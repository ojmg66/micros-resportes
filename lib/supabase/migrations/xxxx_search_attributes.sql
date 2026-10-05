-- Extensión para búsquedas rápidas con ilike
create extension if not exists pg_trgm;

-- Índices trigram para búsquedas con comodines al inicio
create index if not exists attributes_name_trgm_idx
  on attributes using gin (name gin_trgm_ops);

create index if not exists attribute_values_value_trgm_idx
  on attribute_values using gin (value gin_trgm_ops);

-- RPC: busca + pagina + anida valores en una sola llamada
create or replace function search_attributes(
  term text default '',
  page int default 1,
  page_size int default 10
)
returns json
language sql
stable
as $$
  with filtered as (
    select a.id, a.name, a.created_at
    from attributes a
    where term = ''
       or a.name ilike '%' || term || '%'
       or exists (
         select 1 from attribute_values v
         where v.attribute_id = a.id
           and v.value ilike '%' || term || '%'
       )
  ),
  paged as (
    select *
    from filtered
    order by created_at asc
    limit page_size
    offset (page - 1) * page_size
  )
  select json_build_object(
    'total', (select count(*) from filtered),
    'page', page,
    'page_size', page_size,
    'items', coalesce(
      (
        select json_agg(
          json_build_object(
            'id', p.id,
            'name', p.name,
            'created_at', p.created_at,
            'attribute_values', coalesce(
              (
                select json_agg(
                  json_build_object('id', v.id, 'value', v.value)
                  order by v.value
                )
                from attribute_values v
                where v.attribute_id = p.id
              ),
              '[]'::json
            )
          )
        )
        from paged p
      ),
      '[]'::json
    )
  );
$$;