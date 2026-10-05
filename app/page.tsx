"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import * as Select from "@radix-ui/react-select";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  X,
} from "lucide-react";
import Image from "next/image";

const departamentos = [
  "Santa Cruz",
  "La Paz",
  "Cochabamba",
  "Chuquisaca",
  "Oruro",
  "Potosí",
  "Tarija",
  "Beni",
  "Pando",
];

const PAGE_SIZE = 25;

type Reporte = {
  id: number;
  departamento: string;
  numero_linea: string;
  numero_interno: string;
  foto_url: string | null;
  created_at: string;
};

export default function ReportesList() {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [filtroDepartamento, setFiltroDepartamento] = useState("todos");
  const [filtroLinea, setFiltroLinea] = useState("");
  const [filtroInterno, setFiltroInterno] = useState("");

  const [selected, setSelected] = useState<Reporte | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);

      let query = supabase
        .from("reportes")
        .select("*", { count: "exact" });

      if (filtroDepartamento !== "todos") {
        query = query.eq("departamento", filtroDepartamento);
      }
      if (filtroLinea.trim()) {
        query = query.eq("numero_linea", filtroLinea.trim());
      }
      if (filtroInterno.trim()) {
        query = query.eq("numero_interno", filtroInterno.trim());
      }

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, count, error } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (cancelled) return;

      if (error) {
        console.error(error);
        setReportes([]);
        setTotal(0);
      } else {
        setReportes((data ?? []) as Reporte[]);
        setTotal(count ?? 0);
      }

      setLoading(false);
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [page, filtroDepartamento, filtroLinea, filtroInterno]);

  // Al cambiar filtros, volver a página 1
  const handleDepartamentoChange = (value: string) => {
    setFiltroDepartamento(value);
    setPage(1);
  };
  const handleLineaChange = (value: string) => {
    setFiltroLinea(value.replace(/\D/g, ""));
    setPage(1);
  };
  const handleInternoChange = (value: string) => {
    setFiltroInterno(value.replace(/\D/g, ""));
    setPage(1);
  };

  const limpiarFiltros = () => {
    setFiltroDepartamento("todos");
    setFiltroLinea("");
    setFiltroInterno("");
    setPage(1);
  };

  const hayFiltros =
    filtroDepartamento !== "todos" ||
    filtroLinea.trim() !== "" ||
    filtroInterno.trim() !== "";

  const formatoFecha = (iso: string) =>
    new Date(iso).toLocaleString("es-BO", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  /**
   * Genera los números de página visibles (con "..." si hay muchas)
   * Ejemplo con totalPages=20, current=10:
   *   [1] ... [8] [9] [10] [11] [12] ... [20]
   */
  const pageNumbers = useMemo<(number | "…")[]>(() => {
    const delta = 2;
    const pages: (number | "…")[] = [];

    const left = Math.max(2, page - delta);
    const right = Math.min(totalPages - 1, page + delta);

    pages.push(1);
    if (left > 2) pages.push("…");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push("…");
    if (totalPages > 1) pages.push(totalPages);

    return pages;
  }, [page, totalPages]);

  // Rango visible: "Mostrando X–Y de Z"
  const rangoInicio = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangoFin = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Reportes registrados</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {total}{" "}
          {total === 1 ? "reporte encontrado" : "reportes encontrados"}
        </p>
      </div>

      {/* Filtros */}
      <div className="grid gap-4 rounded-xl border p-4 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">Departamento</label>
          <Select.Root
            value={filtroDepartamento}
            onValueChange={handleDepartamentoChange}
          >
            <Select.Trigger className="flex h-10 w-full items-center justify-between rounded-md border bg-background px-3 text-sm">
              <Select.Value />
              <Select.Icon>
                <ChevronDown className="h-4 w-4" />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content
                position="popper"
                className="z-50 overflow-hidden rounded-md border bg-white shadow-md"
              >
                <Select.Viewport className="p-1">
                  <Select.Item
                    value="todos"
                    className="relative flex cursor-pointer select-none items-center rounded px-8 py-2 text-sm outline-none data-[highlighted]:bg-gray-100"
                  >
                    <Select.ItemText>Todos</Select.ItemText>
                    <Select.ItemIndicator className="absolute left-2">
                      <Check className="h-4 w-4" />
                    </Select.ItemIndicator>
                  </Select.Item>
                  {departamentos.map((item) => (
                    <Select.Item
                      key={item}
                      value={item}
                      className="relative flex cursor-pointer select-none items-center rounded px-8 py-2 text-sm outline-none data-[highlighted]:bg-gray-100"
                    >
                      <Select.ItemText>{item}</Select.ItemText>
                      <Select.ItemIndicator className="absolute left-2">
                        <Check className="h-4 w-4" />
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Número de línea</label>
          <input
            type="text"
            inputMode="numeric"
            value={filtroLinea}
            onChange={(e) => handleLineaChange(e.target.value)}
            placeholder="Ej. 105"
            className="h-10 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Número de interno</label>
          <input
            type="text"
            inputMode="numeric"
            value={filtroInterno}
            onChange={(e) => handleInternoChange(e.target.value)}
            placeholder="Ej. 234"
            className="h-10 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {hayFiltros && (
          <div className="md:col-span-3">
            <button
              type="button"
              onClick={limpiarFiltros}
              className="text-sm text-blue-600 underline hover:text-blue-800"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-700">
                Departamento
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">
                Número de línea
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">
                Número de interno
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-gray-400" />
                </td>
              </tr>
            ) : reportes.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-12 text-center text-gray-500"
                >
                  No se encontraron reportes.
                </td>
              </tr>
            ) : (
              reportes.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className="cursor-pointer border-t transition hover:bg-gray-50"
                >
                  <td className="px-4 py-3">{r.departamento}</td>
                  <td className="px-4 py-3 font-mono">{r.numero_linea}</td>
                  <td className="px-4 py-3 font-mono">{r.numero_interno}</td>
                  <td className="px-4 py-3 text-right text-xs text-blue-600">
                    Detalle
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {total > 0 && (
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Mostrando <span className="font-medium">{rangoInicio}</span>–
            <span className="font-medium">{rangoFin}</span> de{" "}
            <span className="font-medium">{total}</span>
          </p>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              {/* Primera */}
              <button
                type="button"
                onClick={() => setPage(1)}
                disabled={page === 1 || loading}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Primera página"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>

              {/* Anterior */}
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Números */}
              {pageNumbers.map((p, idx) =>
                p === "…" ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-2 text-sm text-gray-400"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    disabled={loading}
                    className={`inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm transition ${
                      p === page
                        ? "border-black bg-black text-white"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              {/* Siguiente */}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Página siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              {/* Última */}
              <button
                type="button"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages || loading}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Última página"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Dialog de detalle */}
      <Dialog.Root
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[95vw] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <Dialog.Title className="text-lg font-semibold">
                Detalle del reporte
              </Dialog.Title>
              <Dialog.Close className="rounded-md p-1 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>

            {selected && (
              <div className="space-y-4">
                {selected.foto_url && (
                  <div className="relative h-64 w-full overflow-hidden rounded-lg border bg-gray-50">
                    <Image
                      src={selected.foto_url}
                      alt={`Reporte ${selected.numero_linea}`}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                )}

                <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs uppercase text-gray-500">
                      Departamento
                    </dt>
                    <dd className="mt-1 font-medium">
                      {selected.departamento}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-gray-500">
                      Fecha de registro
                    </dt>
                    <dd className="mt-1 font-medium">
                      {formatoFecha(selected.created_at)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-gray-500">
                      Número de línea
                    </dt>
                    <dd className="mt-1 font-mono font-medium">
                      {selected.numero_linea}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-gray-500">
                      Número de interno
                    </dt>
                    <dd className="mt-1 font-mono font-medium">
                      {selected.numero_interno}
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}