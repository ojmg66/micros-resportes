"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

export default function FloatingReportButton() {
  const pathname = usePathname();

  // No mostrar el botón si ya estamos en el formulario
  if (pathname?.startsWith("/reportar")) return null;

  return (
    <Link
      href="/reportar"
      aria-label="Reportar línea"
      className="
        fixed bottom-5 right-5 z-40
        inline-flex items-center gap-2
        rounded-full bg-black px-5 py-3
        text-sm font-medium text-white
        shadow-lg shadow-black/20
        transition hover:bg-gray-800 active:scale-95
        md:hidden
      "
    >
      <Plus className="h-5 w-5" />
      Reportar
    </Link>
  );
}