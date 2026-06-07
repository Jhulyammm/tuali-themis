/**
 * ClientSelector — dropdown que vive en el Topbar.
 *
 * Muestra el cliente Tuali actualmente seleccionado (OXXO, Soriana, Costco,
 * Abarrotes) y permite cambiar. El cliente activo determina qué playbooks,
 * recomendaciones y métricas se muestran en TODA la app.
 *
 * Es el shift de mindset: ya no es "Themis tool" — es "Themis para
 * <cliente seleccionado>".
 */

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Check, Plus, Building2 } from "lucide-react";
import { useActiveClient } from "@/hooks/useActiveClient";

export function ClientSelector() {
  const { clients, activeClient, setActiveClient, loading } = useActiveClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (loading || !activeClient) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-elevated text-xs text-text-tertiary">
        <Building2 className="w-3.5 h-3.5" />
        <span>Cargando clientes...</span>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-border hover:border-coral hover:bg-coral/5 transition-colors text-sm"
      >
        <span className="text-base leading-none">{activeClient.emoji}</span>
        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-text-primary">
              {activeClient.brand}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-text-tertiary">
              · {activeClient.zone.zone_name}
            </span>
          </div>
          <p className="text-[10px] text-text-tertiary font-mono">
            {activeClient.zone.city}
          </p>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-text-tertiary transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-border shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-border bg-bg-elevated">
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-tertiary">
              Clientes Tuali · {clients.length} activos
            </p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {clients.map((c) => {
              const isActive = c.id === activeClient.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setActiveClient(c.id);
                    setOpen(false);
                  }}
                  className={`w-full px-3 py-2.5 flex items-center gap-3 text-left hover:bg-coral/5 transition-colors border-b border-border last:border-0 ${
                    isActive ? "bg-coral/5" : ""
                  }`}
                >
                  <span className="text-xl">{c.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-sm text-text-primary truncate">
                        {c.name}
                      </p>
                      {c.status === "onboarding" && (
                        <span className="text-[9px] font-mono uppercase px-1 py-0.5 rounded bg-status-warning/10 text-status-warning">
                          onboarding
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-text-secondary truncate">
                      {c.zone.zone_name} · {c.zone.city} ·{" "}
                      <span className="font-mono">{c.zone.profile}</span>
                    </p>
                    {c.total_runs !== undefined && (
                      <p className="text-[10px] text-text-tertiary font-mono">
                        {c.total_runs} runs · {c.avg_seconds ?? "—"}s avg
                      </p>
                    )}
                  </div>
                  {isActive && <Check className="w-4 h-4 text-coral" />}
                </button>
              );
            })}
          </div>
          <Link
            href="/clients"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-coral hover:bg-coral/5 border-t border-border font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard nuevo cliente con URL</span>
          </Link>
        </div>
      )}
    </div>
  );
}
