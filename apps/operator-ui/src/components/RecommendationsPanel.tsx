/**
 * RecommendationsPanel — Capa 3 ⭐ LA ESTRELLA VISUAL del demo (Paso 3b).
 *
 * Muestra recomendaciones contextuales generadas por Gemini en tiempo real.
 * "Zona universitaria, Clásico Regio en 4 días → +35% Indio 355ml..."
 *
 * TODO Marita: aplicar mockup Figma #3 (Panel Recomendaciones Contextuales).
 * Tip:
 *   - Header con zona + evento próximo
 *   - Body con tabla de recomendaciones (SKU + delta % + razón corta)
 *   - Footer con justification general
 *   - Botones [Aplicar todas] [Rechazar]
 *   - Reveal animation slide-in desde la derecha al cargar.
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Check, X } from "lucide-react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatDelta } from "@/lib/utils";
import type {
  CognitiveRecommendation,
  RecommendationsResponse,
  ZoneContext,
  ContextualEvent,
} from "@hack4her/playbooks";

interface RecommendationsPanelProps {
  zone: ZoneContext;
  primaryEvent?: ContextualEvent;
  response: RecommendationsResponse | null;
  loading?: boolean;
  onAccept?: (recommendations: CognitiveRecommendation[]) => void;
  onReject?: () => void;
  className?: string;
}

export function RecommendationsPanel({
  zone,
  primaryEvent,
  response,
  loading,
  onAccept,
  onReject,
  className,
}: RecommendationsPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={className}
    >
      <Card>
        <CardHeader className="space-y-2 border-b border-subtle">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-coral">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Recomendaciones contextuales</span>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {zone.zone_name} · Zona {zone.profile} · {zone.city}
            </p>
            {primaryEvent && (
              <p className="text-xs text-text-secondary">
                Próximo evento:{" "}
                <span className="text-text-primary">{primaryEvent.name}</span>
                {" · "}
                {formatRelativeDate(primaryEvent.date)}
              </p>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading && <LoadingState />}
          {!loading && response && <RecommendationsList items={response.recommendations} />}
          {!loading && !response && <EmptyState />}
        </CardContent>

        {response && response.overall_justification && (
          <div className="px-6 py-4 border-t border-subtle bg-bg-elevated/50">
            <p className="text-xs text-text-secondary leading-relaxed">
              <span className="text-coral font-medium">Razonamiento de Themis: </span>
              {response.overall_justification}
            </p>
          </div>
        )}

        {response && response.recommendations.length > 0 && (
          <CardFooter className="gap-3 pt-4 border-t border-subtle">
            <Button onClick={() => onAccept?.(response.recommendations)} className="flex-1">
              <Check className="w-4 h-4" />
              Aplicar todas
            </Button>
            <Button onClick={onReject} variant="ghost">
              <X className="w-4 h-4" />
              Rechazar
            </Button>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
}

function RecommendationsList({ items }: { items: CognitiveRecommendation[] }) {
  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-text-tertiary text-sm">
        Sin recomendaciones contextuales para este momento.
      </div>
    );
  }
  return (
    <ul className="divide-y divide-subtle">
      <AnimatePresence>
        {items.map((r, i) => (
          <motion.li
            key={r.sku}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.25 }}
            className="px-6 py-4"
          >
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{r.sku}</p>
                <p className="mt-1 text-xs text-text-secondary leading-relaxed">
                  {r.reason}
                </p>
              </div>
              <div className="text-right space-y-0.5">
                <p
                  className={cn(
                    "font-mono text-sm font-semibold tabular-nums",
                    r.delta_percentage > 0 ? "text-status-success" : "text-status-error",
                  )}
                >
                  {formatDelta(r.delta_percentage)}
                </p>
                <p className="font-mono text-xs text-text-tertiary tabular-nums">
                  {r.base_quantity} → {r.recommended_quantity}
                </p>
              </div>
            </div>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}

function LoadingState() {
  return (
    <div className="p-8 space-y-3">
      <div className="h-4 w-3/4 bg-bg-elevated animate-pulse rounded" />
      <div className="h-4 w-1/2 bg-bg-elevated animate-pulse rounded" />
      <div className="h-4 w-2/3 bg-bg-elevated animate-pulse rounded" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="p-8 text-center text-text-tertiary text-sm">
      Esperando contexto para razonar...
    </div>
  );
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "hoy";
  if (diffDays === 1) return "mañana";
  if (diffDays > 1) return `en ${diffDays} días`;
  return "pasó hace " + Math.abs(diffDays) + " días";
}
