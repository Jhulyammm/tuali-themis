/**
 * SelfCritiqueCard — Themis se evalúa a sí misma post-aprendizaje.
 *
 * Esto es la respuesta al sesgo "los agentes mienten cuando no saben":
 * Themis PUBLICA lo que no sabe. El jurado no tiene que confiar — verifica.
 */

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Lightbulb, Eye } from "lucide-react";
import type { PlaybookCritique } from "@hack4her/playbooks";

interface Props {
  critique: PlaybookCritique;
}

const GRADE_COLORS: Record<PlaybookCritique["overall_grade"], string> = {
  "A+": "bg-status-success text-white",
  A: "bg-status-success text-white",
  B: "bg-status-success/70 text-white",
  C: "bg-status-warning text-white",
  D: "bg-status-warning text-white",
  F: "bg-status-error text-white",
};

export function SelfCritiqueCard({ critique }: Props) {
  const grade = critique.overall_grade;
  const isAllGood =
    grade === "A+" || (grade === "A" && critique.risks.length === 0);

  return (
    <Card className="border-coral/30 bg-gradient-to-br from-bg-subtle via-white to-white">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-coral/10 grid place-items-center shrink-0">
              <Eye className="w-5 h-5 text-coral" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs font-mono uppercase tracking-widest text-text-tertiary">
                  Self-examen
                </p>
                <Badge className="bg-coral/10 text-coral border-coral/20 text-[10px]">
                  Capa 1 · auto-crítica
                </Badge>
              </div>
              <p className="text-sm font-medium text-text-primary">
                Themis revisó su propio trabajo
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                {critique.summary}
              </p>
            </div>
          </div>
          <div
            className={`px-4 py-3 rounded-xl text-center ${GRADE_COLORS[grade]} shadow-lg`}
          >
            <p className="text-[10px] font-mono uppercase tracking-widest opacity-80">
              Grade
            </p>
            <p className="text-3xl font-bold leading-none">{grade}</p>
          </div>
        </div>

        {critique.weakest_mapping && (
          <div className="mb-4 p-3 rounded-lg bg-status-warning/10 border border-status-warning/30">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-status-warning flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-widest font-mono text-status-warning mb-1">
                  Mapping más débil
                </p>
                <p className="text-sm font-medium text-text-primary font-mono">
                  {critique.weakest_mapping}
                </p>
              </div>
            </div>
          </div>
        )}

        {critique.risks.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-status-error" />
              <p className="text-[10px] uppercase tracking-widest font-mono text-text-tertiary">
                Riesgos que detecté
              </p>
            </div>
            <ul className="space-y-1.5">
              {critique.risks.map((r, i) => (
                <li
                  key={i}
                  className="text-sm text-text-secondary pl-4 relative before:absolute before:left-0 before:top-2 before:w-1 before:h-1 before:rounded-full before:bg-status-error"
                >
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {critique.improvements.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-3.5 h-3.5 text-coral" />
              <p className="text-[10px] uppercase tracking-widest font-mono text-text-tertiary">
                Cómo mejorarlo
              </p>
            </div>
            <ul className="space-y-1.5">
              {critique.improvements.map((s, i) => (
                <li
                  key={i}
                  className="text-sm text-text-secondary pl-4 relative before:absolute before:left-0 before:top-2 before:w-1 before:h-1 before:rounded-full before:bg-coral"
                >
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {isAllGood && (
          <div className="flex items-center gap-2 text-sm text-status-success">
            <CheckCircle2 className="w-4 h-4" />
            <span>Sin observaciones — listo para ejecutar.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
