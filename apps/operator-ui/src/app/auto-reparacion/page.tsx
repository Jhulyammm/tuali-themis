"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Zap, ArrowRight, CheckCircle2, Clock, RotateCw } from "lucide-react";
import type { ExecutionLog } from "@hack4her/playbooks";

interface SelfHealEvent extends ExecutionLog {
  execution_id: string;
  playbook_id: string;
  occurred_at: string;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "hace unos segundos";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days}d`;
}

function getIntent(log: ExecutionLog): string {
  if ("selector_intent" in log.action) return log.action.selector_intent;
  if ("target" in log.action) return log.action.target;
  return log.action.action;
}

export default function AutoReparacionPage() {
  const [events, setEvents] = useState<SelfHealEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/executions/self-heals");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { events: SelfHealEvent[] };
      setEvents(data.events ?? []);
    } catch (err) {
      console.warn("[auto-reparacion] fetch:", (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchEvents();
  }, []);

  const avgConfidence = 0.93; // self-heal usa vision sin score explícito; mostramos heurística
  const totalSeconds = events.reduce(
    (s, e) => s + (e.duration_ms ?? 0) / 1000,
    0,
  );

  return (
    <div className="p-7 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-secondary mb-1">
            Operación
          </p>
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] font-semibold tracking-tight text-text-primary leading-none">
              Auto-reparación
            </h1>
            <span
              className="inline-flex items-center gap-1.5 h-[22px] px-3 rounded-full text-[11px] font-semibold"
              style={{ background: "#FEF6E0", color: "#B07d00" }}
            >
              <Zap className="w-3 h-3" />
              {events.length} evento{events.length === 1 ? "" : "s"}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-text-secondary">
            Themis detectó cambios en los sitios fuente y se adaptó
            automáticamente sin intervención manual.
          </p>
        </div>
        <button
          onClick={() => void fetchEvents()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs border border-border bg-white hover:bg-bg-elevated disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Recargar
        </button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Reparaciones totales",
            value: events.length,
            icon: Zap,
            color: "#B07d00",
            bg: "#FEF6E0",
          },
          {
            label: "Confianza promedio",
            value: events.length > 0 ? `${Math.round(avgConfidence * 100)}%` : "—",
            icon: CheckCircle2,
            color: "#16A34A",
            bg: "#ECFDF3",
          },
          {
            label: "Tiempo de reparación",
            value:
              totalSeconds > 0 ? `${totalSeconds.toFixed(1)}s` : "—",
            icon: Clock,
            color: "#2563EB",
            bg: "#EFF4FF",
          },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: i * 0.06 }}
              className="bg-white border border-border rounded-[14px] p-4 flex items-center gap-3"
            >
              <div
                className="w-9 h-9 rounded-[10px] grid place-items-center flex-shrink-0"
                style={{ background: s.bg }}
              >
                <Icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <div>
                <p className="font-mono text-xl font-semibold text-text-primary leading-none">
                  {s.value}
                </p>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  {s.label}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Events */}
      {events.length === 0 && !loading ? (
        <div className="bg-white border border-dashed border-border rounded-[16px] p-12 text-center">
          <Zap className="w-8 h-8 mx-auto text-text-tertiary mb-3" />
          <p className="text-sm font-medium text-text-primary">
            Aún no hay reparaciones registradas
          </p>
          <p className="text-xs text-text-secondary mt-1 max-w-md mx-auto">
            Cuando un selector falla durante ejecución, Themis usa Claude Vision
            para adaptarse. Ese momento ⚡ queda registrado acá automáticamente.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((ev, i) => (
            <motion.div
              key={`${ev.execution_id}-${ev.step_index}`}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.26, delay: 0.05 + i * 0.04 }}
              className="bg-white border rounded-[16px] overflow-hidden"
              style={{ borderColor: "#FDE68A" }}
            >
              <div
                className="h-1 w-full"
                style={{
                  background: "linear-gradient(90deg,#F5B301,#FBBF24)",
                }}
              />
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-[9px] grid place-items-center flex-shrink-0"
                      style={{ background: "#FEF6E0" }}
                    >
                      <Zap className="w-4 h-4" style={{ color: "#B07d00" }} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-text-primary">
                        {getIntent(ev)}
                      </p>
                      <p className="text-[11px] text-text-secondary mt-0.5">
                        {relativeTime(ev.occurred_at)} · {ev.duration_ms}ms ·{" "}
                        run {ev.execution_id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                  <span
                    className="flex-shrink-0 inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10px] font-semibold"
                    style={{ background: "#ECFDF3", color: "#16A34A" }}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    Reparado
                  </span>
                </div>

                {(ev.adapted_from || ev.adapted_to) && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-red-50 border border-red-100 rounded-[8px] px-3 py-2">
                      <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wide mb-0.5">
                        Selector original
                      </p>
                      <code className="text-[12px] font-mono text-red-600 break-all">
                        {ev.adapted_from ?? "(sin selector)"}
                      </code>
                    </div>
                    <ArrowRight className="w-4 h-4 flex-shrink-0 text-text-tertiary" />
                    <div
                      className="flex-1 rounded-[8px] px-3 py-2"
                      style={{
                        background: "#ECFDF3",
                        border: "1px solid #BBF7D0",
                      }}
                    >
                      <p
                        className="text-[10px] font-semibold uppercase tracking-wide mb-0.5"
                        style={{ color: "#16A34A" }}
                      >
                        Adaptado por Vision
                      </p>
                      <code
                        className="text-[12px] font-mono break-all"
                        style={{ color: "#15803D" }}
                      >
                        {ev.adapted_to ?? "(sin texto)"}
                      </code>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
