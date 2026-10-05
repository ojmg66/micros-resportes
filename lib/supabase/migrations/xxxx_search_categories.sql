-- Extensión para búsquedas rápidas con ilike
create extension if not exists pg_trgm;

-- Índices
create index if not exists categories_name_trgm_idx
  on categories using gin (name gin_trgm_ops);

create index if not exists categories_parent_id_idx
  on categories (parent_id);

-- RPC: busca + pagina.
--   Sin búsqueda: pagina raíces (parent_id null) + todos sus descendientes.
--   Con búsqueda: devuelve coincidencias planas paginadas.
create or replace function search_categories(
  term text default '',
  page int default 1,
  page_size int default 10
)
returns json
language sql
stable
as $$
  with filtered as (
    select c.id, c.name, c.parent_id, c.created_at
    from categories c
    where term = ''
       or c.name ilike '%' || term || '%'
  ),

  -- Raíces paginadas (solo aplica cuando term = '')
  root_page as (
    select *
    from filtered
    where term = '' and parent_id is null
    order by created_at asc
    limit page_size
    offset (page - 1) * page_size
  ),

  -- Descendientes recursivos de las raíces paginadas
  descendants as (
    with recursive tree as (
      select c.id, c.name, c.parent_id, c.created_at
      from categories c
      where c.id in (select id from root_page)
      union all
      select c.id, c.name, c.parent_id, c.created_at
      from categories c
      join tree t on c.parent_id = t.id
    )
    select * from tree
  ),

  -- Coincidencias planas paginadas (solo aplica cuando term <> '')
  flat_page as (
    select *
    from filtered
    where term <> ''
    order by created_at asc
    limit page_size
    offset (page - 1) * page_size
  ),

  -- Total según modo
  total_count as (
    select case
      when term = '' then (select count(*) from filtered where parent_id is null)
      else (select count(*) from filtered)
    end as total
  ),

  -- Items finales: o árbol completo de raíces paginadas, o coincidencias planas
  final_items as (
    select * from descendants
    union all
    select * from flat_page
  )

  select json_build_object(
    'total', (select total from total_count),
    'page', page,
    'page_size', page_size,
    'items', coalesce(
      (
        select json_agg(
          json_build_object(
            'id', f.id,
            'name', f.name,
            'parent_id', f.parent_id,
            'created_at', f.created_at
          )
        )
        from final_items f
      ),
      '[]'::json
    )
  );
$$;