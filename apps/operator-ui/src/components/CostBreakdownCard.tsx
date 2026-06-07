/**
 * CostBreakdownCard — Transparencia diferenciadora.
 *
 * Después de aprender un playbook, muestra el costo REAL en USD:
 *   Capa 1 Claude:  $0.0023
 *   Capa 6 Solana:  $0.0000
 *   Total Themis:   $0.0023
 *   Manual humano:  $0.83  (6 min × $8.30/h)
 *   ROI:            361×
 *
 * Esto es lo que ningún otro equipo va a mostrar. Habla idioma de CFO.
 */

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Zap, TrendingUp } from "lucide-react";
import type { CostBreakdown, LatencyBreakdown } from "@hack4her/playbooks";

interface Props {
  cost: CostBreakdown;
  latency?: LatencyBreakdown;
  manualMinutes?: number;
  hourlyUSD?: number;
}

export function CostBreakdownCard({
  cost,
  latency,
  manualMinutes = 6,
  hourlyUSD = 8.3,
}: Props) {
  const manualCost = (manualMinutes / 60) * hourlyUSD;
  const themisTotal = Math.max(cost.total_usd, 0.0001);
  const multiplier = Math.round(manualCost / themisTotal);
  const savings = manualCost - cost.total_usd;
  const themisSeconds = latency ? Math.round(latency.total_ms / 1000) : null;

  return (
    <Card className="border-coral/30 bg-gradient-to-br from-coral/5 via-white to-white overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-coral/10 grid place-items-center">
            <DollarSign className="w-4 h-4 text-coral" />
          </div>
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-text-tertiary">
              Costo real · este playbook
            </p>
            <p className="text-sm font-medium text-text-primary">
              Transparencia total — capa por capa
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-full bg-coral text-white text-xs font-bold">
            <TrendingUp className="w-3 h-3" />
            {multiplier}× ROI
          </div>
        </div>

        {/* Breakdown por capa */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <CostRow label="Capa 1 · Claude" usd={cost.capa1_claude_usd} />
          <CostRow label="Capa 1 · Browserbase" usd={cost.capa1_browserbase_usd} />
          <CostRow label="Capa 3 · Gemini" usd={cost.capa3_gemini_usd} />
          <CostRow label="Capa 6 · Solana" usd={cost.capa6_solana_usd} />
        </div>

        {/* Comparativa */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-tertiary font-mono">
              Themis (esta vez)
            </p>
            <p className="text-2xl font-bold tabular-nums text-coral">
              ${cost.total_usd.toFixed(4)}
            </p>
            {themisSeconds !== null && (
              <p className="text-[10px] text-text-tertiary">
                en {themisSeconds}s
              </p>
            )}
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-tertiary font-mono">
              Capturista manual
            </p>
            <p className="text-2xl font-bold tabular-nums text-text-secondary line-through decoration-2">
              ${manualCost.toFixed(2)}
            </p>
            <p className="text-[10px] text-text-tertiary">
              en {manualMinutes} min · captura tiendita
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-tertiary font-mono">
              Ahorro por captura
            </p>
            <p className="text-2xl font-bold tabular-nums text-status-success">
              ${savings.toFixed(2)}
            </p>
            <p className="text-[10px] text-text-tertiary">
              ${(savings * 1000).toFixed(0)} cada 1000 SKUs
            </p>
          </div>
        </div>

        {/* Latency breakdown (si disponible) */}
        {latency && latency.total_ms > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-3 h-3 text-coral" />
              <p className="text-[10px] uppercase tracking-widest text-text-tertiary font-mono">
                Latencia por capa
              </p>
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs font-mono">
              <LatencyBar label="Claude" ms={latency.claude_ms} max={latency.total_ms} />
              <LatencyBar label="Browserbase" ms={latency.browserbase_ms} max={latency.total_ms} />
              <LatencyBar label="Solana" ms={latency.solana_ms} max={latency.total_ms} />
              <LatencyBar label="Otros" ms={latency.other_ms} max={latency.total_ms} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CostRow({ label, usd }: { label: string; usd: number }) {
  return (
    <div className="bg-white border border-border rounded-lg p-3">
      <p className="text-[10px] uppercase font-mono tracking-widest text-text-tertiary truncate">
        {label}
      </p>
      <p className="text-sm font-bold font-mono tabular-nums text-text-primary mt-1">
        ${usd.toFixed(4)}
      </p>
    </div>
  );
}

function LatencyBar({
  label,
  ms,
  max,
}: {
  label: string;
  ms: number;
  max: number;
}) {
  const pct = max > 0 ? (ms / max) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-text-secondary">{label}</span>
        <span className="text-text-primary tabular-nums">
          {ms > 0 ? `${ms}ms` : "—"}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <div
          className="h-full bg-coral transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
