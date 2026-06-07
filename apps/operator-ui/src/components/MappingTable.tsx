"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Mapping } from "@hack4her/playbooks";

interface MappingTableProps {
  mappings: Mapping[];
  className?: string;
}

export function MappingTable({ mappings, className }: MappingTableProps) {
  const safeMappings = (mappings ?? []).filter(
    (m): m is Mapping => !!m && typeof m.source_field === "string",
  );

  if (safeMappings.length === 0) {
    return (
      <div
        className={cn(
          "p-8 text-center text-text-tertiary text-sm rounded-xl border border-dashed border-border",
          className,
        )}
      >
        Esperando observación... Themis aprenderá los mapeos conforme realices el proceso.
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border border-border overflow-hidden bg-white", className)}>
      <table className="w-full text-sm">
        <thead className="bg-bg-elevated border-b border-border">
          <tr className="text-text-tertiary text-[10px] font-mono uppercase tracking-widest">
            <th className="text-left px-4 py-3 font-medium">Mapeo</th>
            <th className="text-left px-4 py-3 font-medium">Confidence</th>
            <th className="text-left px-4 py-3 font-medium">Transformación</th>
            <th className="text-left px-4 py-3 font-medium">Firma</th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence initial={false}>
            {safeMappings.map((m) => (
              <motion.tr
                key={`${m.source_field}->${m.destination_field}`}
                initial={{ opacity: 0, y: 10, backgroundColor: "rgba(245,179,1,0.18)" }}
                animate={{ opacity: 1, y: 0, backgroundColor: "rgba(245,179,1,0)" }}
                transition={{ duration: 0.4, backgroundColor: { duration: 0.9 } }}
                className="border-b border-border last:border-0 hover:bg-bg-elevated/50 transition-colors"
              >
                {/* Mapeo column — source → dest en una sola celda */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium text-text-primary">{m.source_field}</span>
                    <span className="text-text-tertiary text-xs">→</span>
                    <span className="font-medium text-coral">{m.destination_field}</span>
                  </div>
                </td>

                <td className="px-4 py-3">
                  <ConfidenceBar value={m.confidence} />
                </td>

                <td className="px-4 py-3 font-mono text-xs text-text-secondary italic max-w-[140px]">
                  {m.transformation ? (
                    <span className="bg-status-warning-bg text-status-warning px-1.5 py-0.5 rounded text-[10px] not-italic font-medium">
                      {m.transformation}
                    </span>
                  ) : (
                    <span className="text-text-tertiary">—</span>
                  )}
                </td>

                <td className="px-4 py-3 font-mono text-xs max-w-[180px]">
                  {m.signature ? (
                    <a
                      href={m.signature.explorer_url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 text-coral hover:opacity-80 hover:underline"
                      title={`tx ${m.signature.tx_signature}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-coral animate-pulse" />
                      <span className="truncate">
                        {m.signature.tx_signature.slice(0, 8)}…
                      </span>
                    </a>
                  ) : (
                    <span className="text-text-tertiary text-[10px] italic">
                      pendiente
                    </span>
                  )}
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 90 ? "from-emerald-200 to-status-success" :
    pct >= 75 ? "from-yellow-200 to-status-warning" :
    "from-red-200 to-status-error";

  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-1.5 rounded-full bg-border overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-mono text-xs text-text-secondary tabular-nums">{pct}%</span>
    </div>
  );
}
