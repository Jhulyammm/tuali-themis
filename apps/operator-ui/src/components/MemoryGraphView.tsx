"use client";

import { motion } from "framer-motion";
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
      <div className={cn(
        "flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-xl bg-bg-elevated/40",
        className,
      )}>
        <div className="w-10 h-10 rounded-full bg-bg-elevated flex items-center justify-center mb-3">
          <svg className="w-5 h-5 text-text-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p className="text-sm font-medium text-text-secondary">Sin mapeos en memoria</p>
        <p className="text-xs text-text-tertiary mt-1 max-w-xs">
          Themis aprenderá conforme observe procesos. Ve a /teach para comenzar.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-3", className)}>
      {mappings.map((m, i) => (
        <MappingCard key={m.id} mapping={m} index={i} />
      ))}
    </div>
  );
}

function MappingCard({ mapping, index }: { mapping: LearnedMappingRecord; index: number }) {
  const confidence = Math.round(mapping.confidence * 100);
  const confColor =
    confidence >= 90 ? "text-status-success bg-status-success-bg" :
    confidence >= 75 ? "text-status-warning bg-status-warning-bg" :
    "text-status-error bg-red-50";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04, ease: [0.4, 0, 0.2, 1] }}
      className="bg-white rounded-xl border border-border p-4 space-y-3 hover:shadow-md hover:border-border-strong transition-all duration-200 cursor-default group"
    >
      {/* Header: sites + confidence */}
      <div className="flex items-start justify-between gap-2">
        <p className="font-mono text-[10px] text-text-tertiary truncate">
          {mapping.source_site} → {mapping.destination_site}
        </p>
        <span className={cn("flex-shrink-0 font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded-full", confColor)}>
          {confidence}%
        </span>
      </div>

      {/* Mapping pair */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-semibold text-sm text-text-primary group-hover:text-coral transition-colors">
          {mapping.source_field}
        </span>
        <span className="text-text-tertiary text-xs">→</span>
        <span className="font-semibold text-sm text-coral">{mapping.destination_field}</span>
      </div>

      {/* Transformation badge */}
      {mapping.transformation && (
        <span className="inline-flex items-center bg-status-warning-bg text-status-warning text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border border-status-warning/25">
          ƒ {mapping.transformation}
        </span>
      )}

      {/* Examples */}
      {mapping.examples.length > 0 && (
        <div className="font-mono text-[11px] text-text-secondary space-y-0.5 bg-bg-elevated rounded-lg p-2">
          {mapping.examples.slice(0, 2).map((ex, i) => (
            <p key={i}>
              <span className="text-text-tertiary">"{ex.source_value}"</span>
              <span className="text-text-tertiary mx-1">→</span>
              <span>"{ex.destination_value}"</span>
            </p>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="space-y-0.5">
          {mapping.zone_context && (
            <p className="text-[10px] text-text-tertiary font-mono truncate max-w-[140px]">
              {mapping.zone_context}
            </p>
          )}
          <p className="text-[10px] text-text-tertiary">{formatDate(mapping.learned_at)}</p>
        </div>
        {mapping.provenance && (
          <SolanaBadge provenance={mapping.provenance} size="sm" />
        )}
      </div>
    </motion.div>
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
