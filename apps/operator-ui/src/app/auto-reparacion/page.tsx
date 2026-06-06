"use client";

import { motion } from "framer-motion";
import { Zap, ArrowRight, CheckCircle2, Clock } from "lucide-react";

const HEAL_EVENTS = [
  {
    id: 1,
    step: "Extraer precio del producto",
    trigger: "Selector CSS cambió: .price → .product-price-usd",
    original: ".price",
    adapted: ".product-price-usd",
    confidence: 0.94,
    duration_ms: 3400,
    timestamp: "hace 2 min",
    status: "healed",
  },
  {
    id: 2,
    step: "Hacer clic en botón guardar",
    trigger: "Botón movido — nuevo selector por intent",
    original: "#save-btn",
    adapted: "button[data-action='save']",
    confidence: 0.88,
    duration_ms: 1800,
    timestamp: "hace 15 min",
    status: "healed",
  },
  {
    id: 3,
    step: "Navegar a productos",
    trigger: "URL canónica cambió de /products a /catalog/products",
    original: "/products",
    adapted: "/catalog/products",
    confidence: 0.97,
    duration_ms: 900,
    timestamp: "hace 1h",
    status: "healed",
  },
];

export default function AutoReparacionPage() {
  return (
    <div className="p-7 space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-secondary mb-1">Operación</p>
        <div className="flex items-center gap-3">
          <h1 className="text-[28px] font-semibold tracking-tight text-text-primary leading-none">Auto-reparación</h1>
          <span className="inline-flex items-center gap-1.5 h-[22px] px-3 rounded-full text-[11px] font-semibold" style={{ background: "#FEF6E0", color: "#B07d00" }}>
            <Zap className="w-3 h-3" />
            {HEAL_EVENTS.length} eventos
          </span>
        </div>
        <p className="mt-1.5 text-sm text-text-secondary">
          Themis detectó cambios en los sitios fuente y se adaptó automáticamente sin intervención manual.
        </p>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Reparaciones totales", value: HEAL_EVENTS.length, icon: Zap, color: "#B07d00", bg: "#FEF6E0" },
          { label: "Confianza promedio", value: "93%", icon: CheckCircle2, color: "#16A34A", bg: "#ECFDF3" },
          { label: "Tiempo ahorrado", value: "~2.4h", icon: Clock, color: "#2563EB", bg: "#EFF4FF" },
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

      {/* Events */}
      <div className="space-y-3">
        {HEAL_EVENTS.map((ev, i) => (
          <motion.div
            key={ev.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.26, delay: 0.15 + i * 0.08 }}
            className="bg-white border rounded-[16px] overflow-hidden"
            style={{ borderColor: "#FDE68A" }}
          >
            {/* Yellow top bar */}
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#F5B301,#FBBF24)" }} />
            <div className="p-5 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-[9px] grid place-items-center flex-shrink-0" style={{ background: "#FEF6E0" }}>
                    <Zap className="w-4 h-4" style={{ color: "#B07d00" }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-text-primary">{ev.step}</p>
                    <p className="text-[11px] text-text-secondary mt-0.5">{ev.timestamp} · {ev.duration_ms}ms</p>
                  </div>
                </div>
                <span className="flex-shrink-0 inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10px] font-semibold" style={{ background: "#ECFDF3", color: "#16A34A" }}>
                  <CheckCircle2 className="w-3 h-3" />
                  Reparado
                </span>
              </div>

              {/* Trigger */}
              <p className="text-[12px] text-text-secondary italic bg-bg-elevated rounded-[8px] px-3 py-2">
                "{ev.trigger}"
              </p>

              {/* Before → After */}
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-red-50 border border-red-100 rounded-[8px] px-3 py-2">
                  <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wide mb-0.5">Antes</p>
                  <code className="text-[12px] font-mono text-red-600">{ev.original}</code>
                </div>
                <ArrowRight className="w-4 h-4 flex-shrink-0 text-text-tertiary" />
                <div className="flex-1 rounded-[8px] px-3 py-2" style={{ background: "#ECFDF3", border: "1px solid #BBF7D0" }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: "#16A34A" }}>Después</p>
                  <code className="text-[12px] font-mono" style={{ color: "#15803D" }}>{ev.adapted}</code>
                </div>
              </div>

              {/* Confidence */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-text-secondary">Confianza de la reparación</span>
                  <span className="font-mono text-[11px] font-semibold" style={{ color: "#16A34A" }}>
                    {Math.round(ev.confidence * 100)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-border overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg,#16A34A,#22C55E)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${ev.confidence * 100}%` }}
                    transition={{ duration: 0.6, delay: 0.3 + i * 0.1 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
