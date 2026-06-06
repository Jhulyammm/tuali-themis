/**
 * MemoryGraphView — Capa 4 · Knowledge Graph en pantalla
 *
 * Grid de mapeos previos consultables. Cuando un mapeo se vuelve a usar,
 * el agente lo recupera de aquí en vez de re-aprenderlo.
 *
 * TODO Marita: aplicar mockup Figma #4 (Memory Graph view + Solana Badge).
 * Tip: cards apiladas con info compacta (Geist Mono para campos, sans para metadata).
 * Solana badge inline en cada card.
 */

"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SolanaBadge } from "./SolanaBadge";
import { cn } from "@/lib/utils";
import type { Mapping, SolanaProvenance } from "@hack4her/playbooks";

export interface LearnedMappingRecord extends Mapping {
  id: string;
  learned_at: string;
  source_site: string;
  destination_site: string;
  zone_context?: string;
  provenance?: SolanaProvenance;
}

interface MemoryGraphViewProps {
  mappings: LearnedMappingRecord[];
  className?: string;
}

export function MemoryGraphView({ mappings, className }: MemoryGraphViewProps) {
  if (mappings.length === 0) {
    return (
      <div className={cn("p-8 text-center text-text-tertiary text-sm", className)}>
        Aún no hay mapeos en memoria. Themis aprenderá conforme observe procesos.
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-3", className)}>
      {mappings.map((m) => (
        <MappingCard key={m.id} mapping={m} />
      ))}
    </div>
  );
}

function MappingCard({ mapping }: { mapping: LearnedMappingRecord }) {
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-mono text-xs text-text-tertiary">
            {mapping.source_site} → {mapping.destination_site}
          </p>
          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{mapping.source_field}</span>
            <span className="text-text-tertiary">→</span>
            <span className="font-medium text-sm">{mapping.destination_field}</span>
          </div>
        </div>
        <Badge variant="info">{Math.round(mapping.confidence * 100)}%</Badge>
      </div>

      {mapping.transformation && (
        <p className="text-xs text-text-secondary italic">
          Transformación: {mapping.transformation}
        </p>
      )}

      {mapping.examples.length > 0 && (
        <div className="text-xs text-text-secondary font-mono space-y-0.5">
          {mapping.examples.slice(0, 2).map((ex, i) => (
            <p key={i}>
              <span className="text-text-tertiary">e.g.</span>{" "}
              {ex.source_value} = {ex.destination_value}
            </p>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-subtle">
        <span className="font-mono text-xs text-text-tertiary">
          {mapping.zone_context ?? "—"} · {formatDate(mapping.learned_at)}
        </span>
        {mapping.provenance && <SolanaBadge provenance={mapping.provenance} size="sm" />}
      </div>
    </Card>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-MX", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
