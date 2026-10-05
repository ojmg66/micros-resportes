import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const EXPECTED_ACTION = "reporte";
const EXPECTED_HOSTNAMES = new Set(
  (process.env.TURNSTILE_HOSTNAMES ?? "")
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean)
);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    departamento,
    numero_linea,
    numero_interno,
    foto_url,
    turnstileToken,
  } = body;

  if (!departamento || !numero_linea || !numero_interno) {
    return NextResponse.json(
      { error: "Faltan campos obligatorios" },
      { status: 400 }
    );
  }

  // --- Turnstile siteverify (server-side, obligatorio) ---
  if (
    typeof turnstileToken !== "string" ||
    turnstileToken.length === 0 ||
    turnstileToken.length > 2048 ||
    EXPECTED_HOSTNAMES.size === 0
  ) {
    return NextResponse.json(
      { error: "Verificación de seguridad fallida" },
      { status: 403 }
    );
  }

  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;

  let result: {
    success: boolean;
    action?: string;
    hostname?: string;
  };

  try {
    const r = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        signal: AbortSignal.timeout(10_000),
        body: new URLSearchParams({
          secret: process.env.TURNSTILE_SECRET_KEY!,
          response: turnstileToken,
          ...(clientIp ? { remoteip: clientIp } : {}),
        }),
      }
    );
    if (!r.ok) throw new Error(`siteverify ${r.status}`);
    result = await r.json();
  } catch {
    return NextResponse.json(
      { error: "Verificación de seguridad fallida" },
      { status: 403 }
    );
  }

  if (
    !result.success ||
    result.action !== EXPECTED_ACTION ||
    !result.hostname ||
    !EXPECTED_HOSTNAMES.has(result.hostname)
  ) {
    return NextResponse.json(
      { error: "Verificación de seguridad fallida" },
      { status: 403 }
    );
  }

  // --- Inserción con service_role (bypassa RLS) ---
  const { data, error } = await supabaseAdmin
    .from("reportes")
    .insert({
      departamento,
      numero_linea,
      numero_interno,
      foto_url,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Esta línea ya está registrada con este número interno" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}