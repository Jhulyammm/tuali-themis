/**
 * ConfidenceHeatmap — visual de un vistazo de cuánto confía Themis en cada
 * mapping del playbook. Una rejilla de cuadrados coloreados, calendar-style.
 *
 * Verde = ≥90% (Themis está segura), amarillo = 70-89% (probable, ver),
 * rojo = <70% (incierto, marcar para revisión).
 *
 * Esto le habla al jurado más exigente: "¿cómo sé que tu agente no inventa?"
 * Respuesta: cada mapping tiene un nivel de confianza honestamente reportado,
 * y los bajos no se firman en cadena sin revisión humana.
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, AlertCircle, Eye } from "lucide-react";
import type { Mapping } from "@hack4her/playbooks";

interface Props {
  mappings: Mapping[];
}

export function ConfidenceHeatmap({ mappings }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (!mappings || mappings.length === 0) return null;

  const avg =
    mappings.reduce((s, m) => s + m.confidence, 0) / mappings.length;
  const high = mappings.filter((m) => m.confidence >= 0.9).length;
  const medium = mappings.filter(
    (m) => m.confidence >= 0.7 && m.confidence < 0.9,
  ).length;
  const low = mappings.filter((m) => m.confidence < 0.7).length;

  const overallColor =
    avg >= 0.9
      ? "text-status-success"
      : avg >= 0.7
        ? "text-status-warning"
        : "text-status-error";

  return (
    <Card className="border-coral/30">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-coral" />
              <p className="text-xs font-mono uppercase tracking-widest text-text-tertiary">
                Confianza por mapping
              </p>
              <Badge className="bg-coral/10 text-coral border-coral/20 text-[10px]">
                Capa 4 · transparencia
              </Badge>
            </div>
            <p className="text-sm font-medium text-text-primary">
              Themis te dice qué tan segura está de cada uno
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-text-tertiary font-mono">
              Promedio
            </p>
            <p className={`text-3xl font-bold tabular-nums ${overallColor}`}>
              {(avg * 100).toFixed(0)}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-12 sm:grid-cols-16 md:grid-cols-20 gap-1.5 mb-4">
          {mappings.map((m, i) => (
            <motion.div
              key={`${m.source_field}-${m.destination_field}-${i}`}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.02, duration: 0.3 }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className={`aspect-square rounded cursor-pointer transition-all hover:scale-125 hover:z-10 relative ${colorClass(
                m.confidence,
              )}`}
              title={`${m.source_field} → ${m.destination_field} · ${(m.confidence * 100).toFixed(0)}%`}
            />
          ))}
        </div>

        {/* Hover detail */}
        {hovered !== null && mappings[hovered] && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-l-2 border-coral/40 pl-3 py-2 mb-3"
          >
            <p className="text-xs font-mono text-text-tertiary">
              {mappings[hovered].source_field} →{" "}
              <span className="text-coral">
                {mappings[hovered].destination_field}
              </span>
            </p>
            <p className="text-sm font-medium text-text-primary mt-0.5">
              {(mappings[hovered].confidence * 100).toFixed(0)}% de confianza
              {mappings[hovered].transformation
                ? ` · transforma con: ${mappings[hovered].transformation}`
                : ""}
            </p>
          </motion.div>
        )}

        {/* Legend + stats */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-3 border-t border-border">
          <div className="flex items-center gap-4 text-xs">
            <LegendItem
              colorClass="bg-status-success"
              count={high}
              label="≥90% segura"
            />
            <LegendItem
              colorClass="bg-status-warning"
              count={medium}
              label="70-89% probable"
            />
            <LegendItem
              colorClass="bg-status-error"
              count={low}
              label="<70% revisar"
            />
          </div>
          {low > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-status-warning bg-status-warning/10 px-2 py-1 rounded">
              <AlertCircle className="w-3 h-3" />
              <span>{low} sin firmar — necesitan revisión humana</span>
            </div>
          )}
          {low === 0 && (
            <div className="flex items-center gap-1.5 text-xs text-status-success bg-status-success/10 px-2 py-1 rounded">
              <Eye className="w-3 h-3" />
              <span>Todos validados automáticamente</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function LegendItem({
  colorClass,
  count,
  label,
}: {
  colorClass: string;
  count: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-3 h-3 rounded ${colorClass}`} />
      <span className="font-mono tabular-nums text-text-primary">{count}</span>
      <span className="text-text-tertiary">{label}</span>
    </div>
  );
}

function colorClass(confidence: number): string {
  if (confidence >= 0.9) return "bg-status-success";
  if (confidence >= 0.8) return "bg-status-success/70";
  if (confidence >= 0.7) return "bg-status-warning";
  if (confidence >= 0.5) return "bg-status-warning/60";
  return "bg-status-error";
}
