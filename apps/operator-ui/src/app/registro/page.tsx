"use client";

import { useState } from "react";
import { StepLog } from "@/components/StepLog";
import { Clock, CheckCircle2, AlertTriangle, Zap } from "lucide-react";
import { motion } from "framer-motion";
import type { ExecutionLog } from "@hack4her/playbooks";

const SAMPLE_LOGS: ExecutionLog[] = [
  { step_index: 0, action: { action: "navigate", target: "/products" }, status: "succeeded", duration_ms: 1200, timestamp: new Date().toISOString() },
  { step_index: 1, action: { action: "click", selector_intent: "primer producto en grilla" }, status: "succeeded", duration_ms: 480, timestamp: new Date().toISOString() },
  { step_index: 2, action: { action: "extract", selector_intent: "nombre del producto", as: "product_name" }, status: "succeeded", duration_ms: 220, timestamp: new Date().toISOString() },
  { step_index: 3, action: { action: "extract", selector_intent: "precio del producto", as: "price" }, status: "succeeded", duration_ms: 3400, adapted_from: "campo de precio", adapted_to: "campo de precio (USD)", timestamp: new Date().toISOString() },
  { step_index: 4, action: { action: "switch_system", target: "destination" }, status: "succeeded", duration_ms: 600, timestamp: new Date().toISOString() },
  { step_index: 5, action: { action: "fill", selector_intent: "denominación comercial", value: "{product_name}" }, status: "succeeded", duration_ms: 380, timestamp: new Date().toISOString() },
  { step_index: 6, action: { action: "fill", selector_intent: "precio neto sin IVA", value: "{price/1.16}" }, status: "succeeded", duration_ms: 420, timestamp: new Date().toISOString() },
  { step_index: 7, action: { action: "click", selector_intent: "botón guardar" }, status: "succeeded", duration_ms: 800, timestamp: new Date().toISOString() },
];

const STATS = [
  { icon: CheckCircle2, label: "Pasos exitosos", value: "7", color: "#16A34A", bg: "#ECFDF3" },
  { icon: Zap,         label: "Auto-reparaciones", value: "1", color: "#B07d00", bg: "#FEF6E0" },
  { icon: Clock,       label: "Duración total",  value: "7.5s", color: "#2563EB", bg: "#EFF4FF" },
  { icon: AlertTriangle, label: "Errores",       value: "0",  color: "#C8102E", bg: "#FEF2F2" },
];

export default function RegistroPage() {
  const [filter, setFilter] = useState<"all" | "adapted" | "error">("all");

  const filtered = SAMPLE_LOGS.filter((l) => {
    if (filter === "adapted") return !!l.adapted_from;
    if (filter === "error") return l.status === "failed";
    return true;
  });

  return (
    <div className="p-7 space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-secondary mb-1">Operación</p>
        <h1 className="text-[28px] font-semibold tracking-tight text-text-primary">Registro de ejecución</h1>
        <p className="mt-1 text-sm text-text-secondary">Historial completo de pasos del último playbook ejecutado.</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {STATS.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: i * 0.05 }}
              className="bg-white border border-border rounded-[14px] p-4 flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-[10px] grid place-items-center flex-shrink-0" style={{ background: s.bg }}>
                <Icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <div>
                <p className="font-mono text-xl font-semibold text-text-primary leading-none">{s.value}</p>
                <p className="text-[11px] text-text-secondary mt-0.5">{s.label}</p>
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
                ? { background: "#C8102E", color: "#fff", borderColor: "#C8102E" }
                : { background: "#fff", color: "#6B7280", borderColor: "#E5E5E5" }
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
        <StepLog logs={filtered} currentStepIndex={undefined} />
      </motion.div>
    </div>
  );
}
