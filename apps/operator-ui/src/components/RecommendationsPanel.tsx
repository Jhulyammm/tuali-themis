"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Check,
  X,
  TrendingUp,
  TrendingDown,
  Snowflake,
  Wrench,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatDelta } from "@/lib/utils";
import type {
  CognitiveRecommendation,
  ContextualInsight,
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
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className={cn("space-y-4", className)}
    >
      {/* Panel header */}
      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-coral">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Recomendaciones contextuales · Gemini Pro</span>
      </div>

      {/* Context pill */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
        <span className="font-medium text-text-primary">{zone.zone_name}</span>
        <span className="text-text-tertiary">·</span>
        <span>Perfil {zone.profile}</span>
        {primaryEvent && (
          <>
            <span className="text-text-tertiary">·</span>
            <span className="text-coral font-medium">{primaryEvent.name}</span>
            <span className="bg-status-warning-bg text-status-warning font-mono px-1.5 py-0.5 rounded text-[10px] font-semibold">
              {formatRelativeDate(primaryEvent.date)}
            </span>
          </>
        )}
      </div>

      {/* Content */}
      {loading && <LoadingState />}
      {!loading && !response && <EmptyState />}
      {!loading && response && (
        <>
          <AnimatePresence>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {response.recommendations.map((r, i) => (
                <RecommendationCard
                  key={r.sku}
                  item={r}
                  index={i}
                />
              ))}
            </div>
          </AnimatePresence>

          {/* Contextual insights — evaluación más allá de comprar producto */}
          {response.contextual_insights?.length > 0 && (
            <InsightsSection insights={response.contextual_insights} />
          )}

          {/* Overall justification */}
          {response.overall_justification && (
            <div className="bg-bg-elevated border border-border rounded-xl p-4">
              <p className="text-xs font-mono uppercase tracking-wider text-text-tertiary mb-1">
                Razonamiento global de Themis
              </p>
              <p className="text-xs text-text-secondary leading-relaxed italic">
                {response.overall_justification}
              </p>
            </div>
          )}

          {/* Footer actions */}
          {response.recommendations.length > 0 && (
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => onAccept?.(response.recommendations)}
                className="flex-1 bg-[#C8102E] hover:bg-[#B40D28] text-white border-0"
              >
                <Check className="w-4 h-4 mr-1.5" />
                Aplicar todas
              </Button>
              <Button onClick={onReject} variant="ghost" className="text-text-secondary">
                <X className="w-4 h-4 mr-1.5" />
                Rechazar
              </Button>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

/* ——— InsightsSection (evaluación contextual) ——— */

const INSIGHT_STYLES: Record<
  ContextualInsight["kind"],
  { label: string; icon: typeof TrendingUp; cls: string }
> = {
  aumento: {
    label: "Aumento",
    icon: TrendingUp,
    cls: "text-status-success bg-status-success-bg",
  },
  reduccion: {
    label: "Reducción",
    icon: TrendingDown,
    cls: "text-status-error bg-red-50",
  },
  estacional: {
    label: "Estacional",
    icon: Snowflake,
    cls: "text-blue-600 bg-blue-50",
  },
  operativo: {
    label: "Operativo",
    icon: Wrench,
    cls: "text-text-secondary bg-bg-elevated",
  },
  riesgo: {
    label: "Riesgo",
    icon: AlertTriangle,
    cls: "text-status-warning bg-status-warning-bg",
  },
};

function InsightsSection({ insights }: { insights: ContextualInsight[] }) {
  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-coral">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Evaluación contextual</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {insights.map((ins, i) => {
          const s = INSIGHT_STYLES[ins.kind] ?? INSIGHT_STYLES.operativo;
          const Icon = s.icon;
          return (
            <motion.div
              key={`${ins.title}-${i}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
              className="bg-white rounded-xl border border-border shadow-sm p-4 flex gap-3"
            >
              <div
                className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                  s.cls,
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-text-primary">
                    {ins.title}
                  </p>
                  <span
                    className={cn(
                      "text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded",
                      s.cls,
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed mt-1">
                  {ins.detail}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ——— RecommendationCard ——— */

function RecommendationCard({
  item,
  index,
}: {
  item: CognitiveRecommendation;
  index: number;
}) {
  const [state, setState] = useState<"idle" | "applied" | "rejected">("idle");
  const positive = item.delta_percentage > 0;

  // Deterministic sparkline from base/recommended ratio
  const ratio = item.recommended_quantity / Math.max(item.base_quantity, 1);
  const sparkHeights = [0.35, 0.55, 0.45, 0.7, Math.min(1, Math.max(0.2, ratio * 0.85))];

  // Visual confidence derived from magnitude of delta
  const confidence = Math.min(96, Math.max(62, 74 + Math.abs(item.delta_percentage) * 0.5));

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08, ease: [0.4, 0, 0.2, 1] }}
      className="bg-white rounded-xl border border-border shadow-sm p-5 flex flex-col gap-4"
    >
      {/* Delta + sparkline */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p
            className={cn(
              "text-4xl font-bold tabular-nums leading-none",
              positive ? "text-status-success" : "text-status-error",
            )}
          >
            {formatDelta(item.delta_percentage)}
          </p>
          <p className="mt-1.5 text-sm font-semibold text-text-primary truncate">{item.sku}</p>
          <p className="mt-0.5 font-mono text-xs text-text-tertiary tabular-nums">
            {item.base_quantity} → {item.recommended_quantity} uds
          </p>
          {item.driver && (
            <p className="mt-1 text-[10px] text-coral font-mono truncate">
              ▸ {item.driver}
            </p>
          )}
        </div>

        {/* Sparkline */}
        <div className="flex items-end gap-[3px] h-10 flex-shrink-0">
          {sparkHeights.map((h, i) => (
            <div
              key={i}
              className={cn(
                "w-1.5 rounded-full transition-all",
                positive ? "bg-status-success" : "bg-status-error",
              )}
              style={{ height: `${h * 100}%`, opacity: 0.3 + h * 0.7 }}
            />
          ))}
        </div>
      </div>

      {/* Reasoning box */}
      <div className="bg-bg-elevated rounded-lg p-3 flex-1">
        <p className="text-[10px] font-mono uppercase tracking-widest text-text-tertiary mb-1">
          Por qué Themis lo sugiere
        </p>
        <p className="text-xs text-text-secondary leading-relaxed italic">{item.reason}</p>
      </div>

      {/* Confidence bar */}
      <div>
        <div className="flex justify-between text-[10px] font-mono text-text-tertiary mb-1.5">
          <span>Confianza</span>
          <span className="tabular-nums">{confidence.toFixed(0)}%</span>
        </div>
        <div className="h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full bg-gradient-to-r",
              positive
                ? "from-emerald-200 to-status-success"
                : "from-rose-200 to-status-error",
            )}
            style={{ width: `${confidence}%` }}
          />
        </div>
      </div>

      {/* Per-card action buttons */}
      {state === "idle" && (
        <div className="flex gap-2">
          <button
            onClick={() => setState("applied")}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#C8102E] text-white text-xs font-semibold hover:bg-[#B40D28] transition-colors"
          >
            {positive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            Aplicar
          </button>
          <button
            onClick={() => setState("rejected")}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-border text-text-secondary text-xs font-medium hover:bg-bg-elevated transition-colors"
          >
            <X className="w-3 h-3" />
            Rechazar
          </button>
        </div>
      )}

      {state === "applied" && (
        <div className="flex items-center gap-1.5 py-2 px-3 rounded-lg bg-status-success-bg text-status-success text-xs font-semibold">
          <Check className="w-3.5 h-3.5" />
          Aplicado al pedido
        </div>
      )}

      {state === "rejected" && (
        <div className="flex items-center gap-1.5 py-2 px-3 rounded-lg bg-bg-elevated text-text-tertiary text-xs font-medium">
          <X className="w-3.5 h-3.5" />
          Rechazado
        </div>
      )}
    </motion.div>
  );
}

/* ——— States ——— */

function LoadingState() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-border p-5 space-y-3 animate-pulse"
        >
          <div className="flex justify-between">
            <div className="space-y-2">
              <div className="h-8 w-16 bg-bg-elevated rounded" />
              <div className="h-4 w-28 bg-bg-elevated rounded" />
              <div className="h-3 w-20 bg-bg-elevated rounded" />
            </div>
            <div className="flex items-end gap-1 h-10">
              {[0.4, 0.6, 0.5, 0.8, 0.7].map((h, j) => (
                <div
                  key={j}
                  className="w-1.5 bg-bg-elevated rounded-full"
                  style={{ height: `${h * 100}%` }}
                />
              ))}
            </div>
          </div>
          <div className="bg-bg-elevated rounded-lg p-3 space-y-1.5">
            <div className="h-2.5 w-28 bg-border rounded" />
            <div className="h-3 w-full bg-border rounded" />
            <div className="h-3 w-3/4 bg-border rounded" />
          </div>
          <div className="h-1.5 bg-bg-elevated rounded-full" />
          <div className="h-8 bg-bg-elevated rounded-lg" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-xl bg-bg-elevated/50">
      <Sparkles className="w-8 h-8 text-coral mb-3 opacity-50" />
      <p className="text-sm font-medium text-text-secondary">
        Listo para razonar
      </p>
      <p className="mt-1 text-xs text-text-tertiary max-w-xs">
        Haz clic en "Generar recomendaciones" para que Themis analice la tienda,
        el evento y el histórico de pedidos.
      </p>
    </div>
  );
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.round(
    (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0) return "hoy";
  if (diffDays === 1) return "mañana";
  if (diffDays > 1) return `en ${diffDays} días`;
  return `hace ${Math.abs(diffDays)} días`;
}
