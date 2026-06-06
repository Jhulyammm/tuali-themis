"use client";

import { motion } from "framer-motion";
import { Rocket, Server, Globe, Zap, CheckCircle, ArrowRight, Activity, Shield } from "lucide-react";

const INFRA_CARDS = [
  {
    icon: Server,
    title: "SAP S/4HANA",
    subtitle: "Destino primario",
    status: "live",
    statusLabel: "En vivo",
    metrics: [
      { label: "Registros migrados", value: "12,847" },
      { label: "Tasa de éxito", value: "99.4%" },
      { label: "Latencia avg.", value: "142ms" },
    ],
  },
  {
    icon: Globe,
    title: "OXXO Portal B2B",
    subtitle: "Fuente de aprendizaje",
    status: "live",
    statusLabel: "Activo",
    metrics: [
      { label: "Sesiones observadas", value: "3,291" },
      { label: "Mapeos aprendidos", value: "47" },
      { label: "Confianza prom.", value: "91.2%" },
    ],
  },
  {
    icon: Activity,
    title: "Motor Themis",
    subtitle: "Agente cognitivo",
    status: "live",
    statusLabel: "Corriendo",
    metrics: [
      { label: "Playbooks activos", value: "8" },
      { label: "Auto-reparaciones", value: "14" },
      { label: "Uptime", value: "99.99%" },
    ],
  },
];

const DEPLOY_STEPS = [
  { label: "Build del agente", done: true },
  { label: "Playbooks validados", done: true },
  { label: "Verificación Solana", done: true },
  { label: "Deploy a producción", done: true },
  { label: "Monitoreo activo", done: true },
];

export default function ProduccionPage() {
  return (
    <div className="p-7 space-y-7">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-secondary mb-1">
          Escala
        </p>
        <div className="flex items-center gap-3">
          <h1 className="text-[28px] font-semibold tracking-tight text-text-primary leading-none">
            Producción
          </h1>
          <span className="inline-flex items-center gap-1.5 h-[22px] px-3 rounded-[7px] text-[11.5px] font-[550] bg-status-success-bg text-status-success">
            <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
            Sistemas activos
          </span>
        </div>
        <p className="mt-1.5 text-sm text-text-secondary">
          Themis opera en producción — observando, ejecutando y auto-reparándose en tiempo real.
        </p>
      </motion.div>

      {/* Infra grid */}
      <div className="grid grid-cols-3 gap-3.5">
        {INFRA_CARDS.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: i * 0.06 }}
              className="bg-white border border-border rounded-[16px] p-[18px] flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 cursor-default"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="w-10 h-10 rounded-[12px] bg-bg-elevated flex items-center justify-center">
                  <Icon className="w-5 h-5 text-coral" />
                </div>
                <span className="inline-flex items-center gap-1.5 h-5 px-2 rounded-full text-[10px] font-semibold bg-status-success-bg text-status-success">
                  <span className="w-1 h-1 rounded-full bg-status-success" />
                  {card.statusLabel}
                </span>
              </div>
              <div>
                <p className="font-semibold text-sm text-text-primary">{card.title}</p>
                <p className="text-[12px] text-text-tertiary mt-0.5">{card.subtitle}</p>
              </div>
              <div className="space-y-2 pt-1 border-t border-border">
                {card.metrics.map((m) => (
                  <div key={m.label} className="flex items-center justify-between">
                    <span className="text-[11px] text-text-secondary">{m.label}</span>
                    <span className="font-mono text-[11px] font-semibold text-text-primary">{m.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Deploy pipeline + prod footer row */}
      <div className="grid grid-cols-[1fr_auto] gap-3.5 items-start">
        {/* Pipeline */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.2 }}
          className="bg-white border border-border rounded-[16px] p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-coral" />
            <p className="font-semibold text-sm text-text-primary">Pipeline de despliegue</p>
          </div>
          <div className="space-y-2.5">
            {DEPLOY_STEPS.map((step, i) => (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.22, delay: 0.3 + i * 0.07 }}
                className="flex items-center gap-3"
              >
                <CheckCircle className="w-4 h-4 text-status-success flex-shrink-0" />
                <span className="text-[13px] text-text-primary">{step.label}</span>
                <span className="ml-auto font-mono text-[10px] text-text-tertiary">
                  {["1.2s", "0.8s", "3.1s", "5.4s", "—"][i]}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Solana proof */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="bg-white border border-border rounded-[16px] p-5 flex flex-col items-center gap-3 text-center w-52"
        >
          <div className="w-14 h-14 rounded-[16px] grid place-items-center" style={{ background: "linear-gradient(150deg,#9945FF,#14F195)", boxShadow: "0 8px 24px -4px rgba(153,69,255,.45)" }}>
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="font-semibold text-[13px] text-text-primary">Proveniencia</p>
            <p className="text-[11px] text-text-tertiary mt-0.5">Certificado en Solana</p>
          </div>
          <span className="w-full text-center font-mono text-[10px] px-2 py-1.5 rounded-lg border border-[#9945FF]/20 bg-gradient-to-r from-[#9945FF]/6 to-[#14F195]/6 text-[#7B35D9]">
            devnet · verified
          </span>
        </motion.div>
      </div>

      {/* Production CTA banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.35 }}
        className="relative overflow-hidden rounded-[16px] p-[30px_34px] flex items-center justify-between gap-5"
        style={{ background: "linear-gradient(120deg,#C8102E,#A50C25)" }}
      >
        {/* Shimmer */}
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(80% 120% at 100% 50%, rgba(255,255,255,.12), transparent 60%)" }} />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Rocket className="w-5 h-5 text-white" />
            <p className="text-white font-semibold text-[17px]">Themis está en producción</p>
          </div>
          <p className="text-white/70 text-sm">
            Procesando operaciones reales. Cada acción es trazable y verificada en blockchain.
          </p>
        </div>

        <button className="relative z-10 flex-shrink-0 flex items-center gap-2 bg-white text-[#C8102E] font-semibold text-sm px-5 py-2.5 rounded-[11px] hover:bg-white/90 transition-colors">
          Ver dashboard completo
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
}
