"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { supabase } from "@/lib/supabase/client";
import * as Label from "@radix-ui/react-label";
import * as Select from "@radix-ui/react-select";
import { useRouter } from "next/navigation";

import { Check, ChevronDown, ImagePlus, X } from "lucide-react";
import Image from "next/image";

import { Turnstile } from "@marsidev/react-turnstile";
import type { TurnstileInstance } from "@marsidev/react-turnstile";

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

export default function ReporteForm() {
  const [departamento, setDepartamento] = useState("Santa Cruz");
  const [numeroLinea, setNumeroLinea] = useState("");
  const [numeroInterno, setNumeroInterno] = useState("");
  const [imagen, setImagen] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [errorCode, setErrorCode] = useState<number | null>(null);

  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  const router = useRouter();

  /**
   * Crear preview de la imagen
   */
  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("El archivo seleccionado no es una imagen.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no debe superar los 5 MB.");
      return;
    }

    setError("");
    setImagen(file);

    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
  };

  /**
   * Eliminar imagen
   */
  const removeImage = () => {
    if (preview) URL.revokeObjectURL(preview);
    setImagen(null);
    setPreview(null);

    const input = document.getElementById("imagen") as HTMLInputElement | null;
    if (input) input.value = "";
  };

  /**
   * Limpiar preview al desmontar
   */
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  /**
   * Subir imagen a Supabase Storage
   */
  const uploadImage = async (file: File, folder: string): Promise<string> => {
    const extension = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${extension}`;
    const path = `${folder}/${fileName}`;

    const { error } = await supabase.storage
      .from("reportes")
      .upload(path, file);

    if (error) throw error;

    const { data } = supabase.storage.from("reportes").getPublicUrl(path);
    return data.publicUrl;
  };

  /**
   * Enviar formulario
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setErrorCode(null);

    if (!departamento) return setError("Selecciona un departamento.");
    if (!numeroLinea.trim()) return setError("Ingresa el número de línea.");
    if (!numeroInterno.trim()) return setError("Ingresa el número de interno.");
    if (!turnstileToken) {
      setError("Completa la verificación de seguridad antes de continuar.");
      return;
    }

    setLoading(true);

    try {
      let coverUrl: string | null = null;
      if (imagen) {
        coverUrl = await uploadImage(imagen, "reportes");
      }

      const res = await fetch("/api/reportes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departamento,
          numero_linea: numeroLinea.trim(),
          numero_interno: numeroInterno.trim(),
          foto_url: coverUrl,
          turnstileToken,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        // 🚩 Duplicado: la línea + interno ya existen
        if (res.status === 409) {
          setErrorCode(409);
          setError(
            result.error ||
              "Esta línea ya está registrada con este número interno."
          );
          // El token NO se consumió (el backend hace la validación
          // de duplicado ANTES de siteverify), así que lo mantenemos.
          return;
        }

        // 🚩 Verificación de seguridad fallida
        if (res.status === 403) {
          setErrorCode(403);
          setError("La verificación de seguridad falló. Vuelve a completarla.");
          setTurnstileToken("");
          turnstileRef.current?.reset();
          return;
        }

        // Otros errores
        setErrorCode(res.status);
        throw new Error(result.error || "Error al enviar el reporte");
      }

      // ✅ Éxito
      setSuccess("El reporte fue registrado correctamente.");
      setDepartamento("Santa Cruz");
      setNumeroLinea("");
      setNumeroInterno("");
      removeImage();
      setTurnstileToken("");
      turnstileRef.current?.reset();

      setTimeout(() => router.push("/"), 1500);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al enviar el formulario."
      );

      if (errorCode !== 409 && errorCode !== 403) {
        setTurnstileToken("");
        turnstileRef.current?.reset();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && (
        <div
          role="alert"
          className={`mb-4 rounded-md border px-4 py-3 text-sm ${
            errorCode === 409
              ? "border-amber-300 bg-amber-50 text-amber-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <div className="flex items-start gap-2">
            <span className="mt-0.5 text-lg leading-none">
              {errorCode === 409 ? "⚠️" : "❌"}
            </span>

            <div className="flex-1">
              {errorCode === 409 ? (
                <>
                  <p className="font-semibold">Registro duplicado</p>
                  <p className="mt-1">{error}</p>
                  <p className="mt-1 text-xs text-amber-700">
                    Verifica el número de línea{" "}
                    <span className="font-mono font-semibold">
                      {numeroLinea}
                    </span>{" "}
                    y el interno{" "}
                    <span className="font-mono font-semibold">
                      {numeroInterno}
                    </span>
                    .
                  </p>
                </>
              ) : (
                <p>{error}</p>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setError("");
                setErrorCode(null);
              }}
              className="text-xs underline opacity-70 hover:opacity-100"
              aria-label="Cerrar"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mx-auto w-full max-w-xl space-y-6 rounded-xl border p-6 shadow-sm"
      >
        <div>
          <h1 className="text-2xl font-semibold">Reportar línea</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Completa los datos y adjunta una fotografía.
          </p>
        </div>

        {/* Departamento */}
        <div className="space-y-2">
          <Label.Root htmlFor="departamento" className="text-sm font-medium">
            Departamento
          </Label.Root>

          <Select.Root value={departamento} onValueChange={setDepartamento}>
            <Select.Trigger
              id="departamento"
              className="flex h-10 w-full items-center justify-between rounded-md border bg-background px-3 text-sm"
            >
              <Select.Value placeholder="Seleccionar departamento" />
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

        {/* Número de línea */}
        <div className="space-y-2">
          <Label.Root htmlFor="numero_linea" className="text-sm font-medium">
            Número de línea
          </Label.Root>

          <input
            id="numero_linea"
            type="text"
            
            value={numeroLinea}
            onChange={(event) =>
              setNumeroLinea(event.target.value)
            }
            placeholder="Ej. 105"
            aria-invalid={errorCode === 409}
            className={`h-10 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-ring ${
              errorCode === 409 ? "border-amber-400 bg-amber-50" : ""
            }`}
          />
        </div>

        {/* Número de interno */}
        <div className="space-y-2">
          <Label.Root htmlFor="numero_interno" className="text-sm font-medium">
            Número de interno
          </Label.Root>

          <input
            id="numero_interno"
            type="text"
          
            value={numeroInterno}
            onChange={(event) =>
              setNumeroInterno(event.target.value)
            }
            placeholder="Ej. 234"
            aria-invalid={errorCode === 409}
            className={`h-10 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-ring ${
              errorCode === 409 ? "border-amber-400 bg-amber-50" : ""
            }`}
          />
        </div>

        {/* Imagen */}
        <div className="space-y-2">
          <Label.Root htmlFor="imagen" className="text-sm font-medium">
            Fotografía
          </Label.Root>

          {!preview ? (
            <label
              htmlFor="imagen"
              className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition hover:bg-gray-50"
            >
              <ImagePlus className="mb-2 h-8 w-8 text-gray-400" />

              <span className="text-sm font-medium">
                Seleccionar fotografía
              </span>

              <span className="mt-1 text-xs text-muted-foreground">
                JPG, PNG o WEBP · máximo 5 MB
              </span>

              <input
                id="imagen"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          ) : (
            <div className="relative h-80 w-full">
              <Image
                src={preview}
                alt="Vista previa"
                className="object-contain"
                unoptimized
                fill
              />

              <button
                type="button"
                onClick={removeImage}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
                aria-label="Eliminar imagen"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="absolute bottom-0 left-0 right-0 border-t bg-white px-3 py-2">
                <p className="truncate text-xs text-muted-foreground">
                  {imagen?.name}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Cloudflare Turnstile */}
        <div className="flex justify-center">
          <Turnstile
            ref={turnstileRef}
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
            options={{
              action: "reporte",
              theme: "auto",
              language: "es",
            }}
            onSuccess={(token) => {
              setTurnstileToken(token);
              setError("");
              setErrorCode(null);
            }}
            onExpire={() => {
              setTurnstileToken("");
            }}
            onError={() => {
              setTurnstileToken("");
              setError(
                "No se pudo completar la verificación de seguridad."
              );
            }}
          />
        </div>

        {/* Enviar */}
        <button
          type="submit"
          disabled={loading || !turnstileToken}
          className="w-full rounded-md bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Enviando..." : "Enviar reporte"}
        </button>
      </form>
    </>
  );
}