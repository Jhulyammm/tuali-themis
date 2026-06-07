"use client";

import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";
import { ClientSelector } from "@/components/ClientSelector";

const PAGE_NAMES: Record<string, string> = {
  "/": "Inicio",
  "/teach": "Observación",
  "/execute": "Ejecución",
  "/recommendations": "Recomendaciones",
  "/memory": "Memoria",
  "/validate": "Verificación",
  "/diagnostics": "Diagnósticos",
  "/produccion": "Producción",
  "/registro": "Registro",
  "/auto-reparacion": "Auto-reparación",
  "/clients": "Clientes",
  "/challenge": "Reto del jurado",
  "/race": "Carrera",
  "/comparativo": "Comparativo",
  "/mcp": "MCP Server",
};

export function Topbar() {
  const pathname = usePathname();
  const pageName = PAGE_NAMES[pathname] ?? pathname.replace("/", "");

  return (
    <header className="sticky top-0 z-30 h-[60px] flex items-center justify-between px-6 bg-bg-base/90 backdrop-blur border-b border-border">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-text-tertiary font-mono text-xs">THEMIS</span>
        <span className="text-text-tertiary">/</span>
        <span className="font-medium text-text-primary">{pageName}</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Client selector — el shift de mindset multi-tenant */}
        <ClientSelector />

        {/* Search (cosmetic) */}
        <button className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-border text-xs text-text-tertiary hover:border-border-strong transition-colors">
          <Search className="w-3.5 h-3.5" />
          <span>Buscar...</span>
          <span className="font-mono bg-bg-elevated px-1 rounded text-[10px]">⌘K</span>
        </button>

        {/* Notification bell */}
        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg-elevated transition-colors">
          <Bell className="w-4 h-4 text-text-secondary" />
          {/* Red dot */}
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-coral" />
        </button>
      </div>
    </header>
  );
}
