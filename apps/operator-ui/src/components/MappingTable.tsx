/**
 * MappingTable — Capa 1 · Modo Observación
 *
 * Tabla que crece EN VIVO mientras Themis observa el proceso.
 * Cada fila = un mapeo source-field → destination-field aprendido.
 *
 * TODO Marita: aplicar mockup Figma #2 (Modo Observación).
 * Tip: nueva fila aparece con slide-in desde abajo + highlight 800ms.
 * El confidence bar es el detalle visual clave (gradient zinc→coral).
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Mapping } from "@hack4her/playbooks";

interface MappingTableProps {
  mappings: Mapping[];
  className?: string;
}

export function MappingTable({ mappings, className }: MappingTableProps) {
  // Defensa contra entries vacías (StrictMode double-firing o concurrencia)
  const safeMappings = (mappings ?? []).filter(
    (m): m is Mapping => !!m && typeof m.source_field === "string",
  );

  if (safeMappings.length === 0) {
    return (
      <div
        className={cn(
          "p-8 text-center text-text-tertiary text-sm rounded-lg border border-default border-dashed",
          className,
        )}
      >
        Esperando observación... Themis aprenderá los mapeos conforme realices el proceso.
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border border-default overflow-hidden", className)}>
      <table className="w-full text-sm">
        <thead className="bg-bg-surface border-b border-default text-text-secondary text-xs font-mono uppercase tracking-wider">
          <tr>
            <th className="text-left px-4 py-3 font-medium">Origen</th>
            <th className="text-left px-4 py-3 font-medium">→</th>
            <th className="text-left px-4 py-3 font-medium">Destino</th>
            <th className="text-left px-4 py-3 font-medium">Confidence</th>
            <th className="text-left px-4 py-3 font-medium">Ejemplos</th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence initial={false}>
            {safeMappings.map((m, i) => (
              <motion.tr
                key={`${m.source_field}->${m.destination_field}`}
                initial={{ opacity: 0, y: 12, backgroundColor: "rgba(239, 68, 68, 0.1)" }}
                animate={{ opacity: 1, y: 0, backgroundColor: "transparent" }}
                transition={{ duration: 0.4, backgroundColor: { duration: 0.8 } }}
                className="border-b border-subtle last:border-0"
              >
                <td className="px-4 py-3 font-medium">{m.source_field}</td>
                <td className="px-4 py-3 text-text-tertiary">→</td>
                <td className="px-4 py-3 font-medium">{m.destination_field}</td>
                <td className="px-4 py-3">
                  <ConfidenceBar value={m.confidence} />
                </td>
                <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                  {m.examples.length > 0
                    ? `${m.examples[0].source_value} = ${m.examples[0].destination_value}`
                    : "—"}
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
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-bg-elevated overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-zinc-500 to-coral"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-mono text-xs text-text-secondary tabular-nums">
        {pct}%
      </span>
    </div>
  );
}
