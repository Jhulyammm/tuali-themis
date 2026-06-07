"use client";

import { useEffect, useMemo, useState } from "react";
import { StepLog } from "@/components/StepLog";
import { Clock, CheckCircle2, AlertTriangle, Zap, RotateCw } from "lucide-react";
import { motion } from "framer-motion";
import type { Execution, ExecutionLog } from "@hack4her/playbooks";

export default function RegistroPage() {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "adapted" | "error">("all");
  const [loading, setLoading] = useState(true);

  const fetchExecutions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/executions");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { executions: Execution[] };
      setExecutions(data.executions ?? []);
      if (!selectedId && data.executions?.[0]) {
        setSelectedId(data.executions[0].id);
      }
    } catch (err) {
      console.warn("[registro] fetch executions:", (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchExecutions();
  }, []);

  const selected = useMemo(
    () => executions.find((e) => e.id === selectedId) ?? executions[0] ?? null,
    [executions, selectedId],
  );

  const logs: ExecutionLog[] = selected?.logs ?? [];
  const filtered = logs.filter((l) => {
    if (filter === "adapted") return !!l.adapted_from;
    if (filter === "error") return l.status === "failed";
    return true;
  });

  const stats = useMemo(() => {
    const succeeded = logs.filter((l) => l.status === "succeeded").length;
    const adapted = logs.filter((l) => l.adapted_to).length;
    const failed = logs.filter((l) => l.status === "failed").length;
    const totalMs = logs.reduce((s, l) => s + (l.duration_ms ?? 0), 0);
    return {
      succeeded,
      adapted,
      failed,
      duration: totalMs > 0 ? `${(totalMs / 1000).toFixed(1)}s` : "—",
    };
  }, [logs]);

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
          <h1 className="text-[28px] font-semibold tracking-tight text-text-primary">
            Registro de ejecuciones
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Historial de cada playbook que Themis ha ejecutado autónomamente.
          </p>
        </div>
        <button
          onClick={() => void fetchExecutions()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs border border-border bg-white hover:bg-bg-elevated disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Recargar
        </button>
      </motion.div>

      {/* Picker de ejecución */}
      {executions.length > 0 && (
        <div className="bg-white border border-border rounded-[14px] p-4 flex items-center gap-3 flex-wrap">
          <label className="text-[11px] font-mono uppercase tracking-widest text-text-tertiary">
            Ejecución
          </label>
          <select
            value={selectedId ?? ""}
            onChange={(e) => setSelectedId(e.target.value)}
            className="bg-bg-elevated border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-coral/30 min-w-[280px]"
          >
            {executions.map((e) => (
              <option key={e.id} value={e.id}>
                {e.id.slice(0, 8)} · {new Date(e.started_at).toLocaleString()} ·{" "}
                {e.status}
              </option>
            ))}
          </select>
          <span className="text-[11px] text-text-tertiary font-mono ml-auto">
            {executions.length} ejecución{executions.length === 1 ? "" : "es"}{" "}
            histórica{executions.length === 1 ? "" : "s"}
          </span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {
            icon: CheckCircle2,
            label: "Pasos exitosos",
            value: String(stats.succeeded),
            color: "#16A34A",
            bg: "#ECFDF3",
          },
          {
            icon: Zap,
            label: "Auto-reparaciones",
            value: String(stats.adapted),
            color: "#B07d00",
            bg: "#FEF6E0",
          },
          {
            icon: Clock,
            label: "Duración total",
            value: stats.duration,
            color: "#2563EB",
            bg: "#EFF4FF",
          },
          {
            icon: AlertTriangle,
            label: "Errores",
            value: String(stats.failed),
            color: "#C8102E",
            bg: "#FEF2F2",
          },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: i * 0.05 }}
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

      {/* Filters */}
      <div className="flex items-center gap-2">
        {(["all", "adapted", "error"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="h-[30px] px-3 rounded-[9px] text-[12.5px] border transition-colors"
            style={
              filter === f
                ? {
                    background: "#C8102E",
                    color: "#fff",
                    borderColor: "#C8102E",
                  }
                : {
                    background: "#fff",
                    color: "#6B7280",
                    borderColor: "#E5E5E5",
                  }
            }
          >
            {{ all: "Todos", adapted: "Auto-reparados", error: "Errores" }[f]}
          </button>
        ))}
      </div>

      {/* Log */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="bg-white border border-border rounded-[16px] p-5"
      >
        {executions.length === 0 && !loading ? (
          <div className="py-10 text-center text-text-tertiary text-sm">
            Sin ejecuciones aún. Corré un playbook desde{" "}
            <a href="/execute" className="text-coral hover:underline">
              /execute
            </a>{" "}
            para empezar a poblar el historial.
          </div>
        ) : (
          <StepLog logs={filtered} currentIndex={undefined} />
        )}
      </motion.div>
    </div>
  );
}
