"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Rocket,
  Server,
  Globe,
  Zap,
  CheckCircle,
  ArrowRight,
  Activity,
  Shield,
  RotateCw,
  AlertTriangle,
} from "lucide-react";

interface StatusReport {
  generated_at: string;
  capa1_agent: {
    anthropic: "configured" | "missing";
    browserbase: "configured" | "missing";
  };
  capa2_voice: {
    elevenlabs: "configured" | "missing";
    openai_whisper: "configured" | "missing";
  };
  capa3_cognitive: {
    gemini: "configured" | "missing";
    fallback_claude: "configured" | "missing";
  };
  capa4_memory: {
    playbooks_backend: "mongodb" | "filesystem";
    playbooks_count: number;
    executions_backend: "mongodb" | "filesystem";
    executions_count: number;
    self_heal_count: number;
  };
  capa5_infra: {
    operator_url: string;
    erp_destino_url: string;
    source_system_url: string;
    deploy_target: "localhost" | "tunnel" | "vultr";
  };
  capa6_solana: {
    network: string;
    wallet_address: string | null;
    balance_sol: number | null;
    rpc: string;
    error?: string;
  };
}

export default function ProduccionPage() {
  const [report, setReport] = useState<StatusReport | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/status");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as StatusReport;
      setReport(data);
    } catch (err) {
      console.warn("[produccion] fetch status:", (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchStatus();
    const t = setInterval(fetchStatus, 30000); // refresh cada 30s
    return () => clearInterval(t);
  }, []);

  const deployLabel: Record<
    "localhost" | "tunnel" | "vultr",
    { label: string; color: string }
  > = {
    localhost: { label: "Localhost", color: "text-text-secondary" },
    tunnel: { label: "Tunnel público", color: "text-status-warning" },
    vultr: { label: "Vultr Cloud", color: "text-status-success" },
  };

  const deploy = report
    ? deployLabel[report.capa5_infra.deploy_target]
    : deployLabel.localhost;

  return (
    <div className="p-7 space-y-7">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-secondary mb-1">
            Escala · Capa 5
          </p>
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] font-semibold tracking-tight text-text-primary leading-none">
              Producción
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 h-[22px] px-3 rounded-[7px] text-[11.5px] font-[550] ${
                report?.capa5_infra.deploy_target === "vultr"
                  ? "bg-status-success-bg text-status-success"
                  : "bg-status-warning-bg text-status-warning"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                  report?.capa5_infra.deploy_target === "vultr"
                    ? "bg-status-success"
                    : "bg-status-warning"
                }`}
              />
              {deploy.label}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-text-secondary">
            Health en vivo de las 6 capas de Themis. Refresh automático cada 30s.
          </p>
        </div>
        <button
          onClick={() => void fetchStatus()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs border border-border bg-white hover:bg-bg-elevated disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Recargar
        </button>
      </motion.div>

      {/* 3 capas críticas */}
      <div className="grid grid-cols-3 gap-3.5">
        <InfraCard
          icon={Activity}
          title="Stagehand · Capa 1"
          subtitle="Motor de observación + ejecución"
          live={
            !!report &&
            report.capa1_agent.anthropic === "configured" &&
            report.capa1_agent.browserbase === "configured"
          }
          metrics={[
            {
              label: "Claude API",
              value:
                report?.capa1_agent.anthropic === "configured"
                  ? "✓ Live"
                  : "✗ Missing",
            },
            {
              label: "Browserbase API",
              value:
                report?.capa1_agent.browserbase === "configured"
                  ? "✓ Live"
                  : "✗ Missing",
            },
            {
              label: "Sistema A",
              value: shortHost(report?.capa5_infra.source_system_url),
            },
          ]}
          delay={0}
        />
        <InfraCard
          icon={Server}
          title="Knowledge Graph · Capa 4"
          subtitle="Mappings + ejecuciones persistidas"
          live={!!report}
          metrics={[
            {
              label: "Playbooks store",
              value: report?.capa4_memory.playbooks_backend ?? "—",
            },
            {
              label: "Playbooks aprendidos",
              value: String(report?.capa4_memory.playbooks_count ?? 0),
            },
            {
              label: "Self-heals registrados",
              value: String(report?.capa4_memory.self_heal_count ?? 0),
            },
          ]}
          delay={0.06}
        />
        <InfraCard
          icon={Globe}
          title="Solana Provenance · Capa 6"
          subtitle="Prueba criptográfica de aprendizaje"
          live={
            !!report &&
            report.capa6_solana.wallet_address !== null &&
            (report.capa6_solana.balance_sol ?? 0) > 0
          }
          metrics={[
            {
              label: "Red",
              value: report?.capa6_solana.network ?? "devnet",
            },
            {
              label: "Wallet",
              value: report?.capa6_solana.wallet_address
                ? shortAddr(report.capa6_solana.wallet_address)
                : "—",
            },
            {
              label: "Balance SOL",
              value:
                report?.capa6_solana.balance_sol != null
                  ? report.capa6_solana.balance_sol.toFixed(4)
                  : "—",
            },
          ]}
          delay={0.12}
        />
      </div>

      {/* Voice + Cognitive */}
      <div className="grid grid-cols-2 gap-3.5">
        <SmallStatusCard
          title="Capa 2 — Voz"
          rows={[
            {
              label: "ElevenLabs (TTS mexicano)",
              ok: report?.capa2_voice.elevenlabs === "configured",
            },
            {
              label: "OpenAI Whisper (transcripción)",
              ok: report?.capa2_voice.openai_whisper === "configured",
            },
          ]}
        />
        <SmallStatusCard
          title="Capa 3 — Cognitivo"
          rows={[
            {
              label: "Gemini Pro (razonamiento principal)",
              ok: report?.capa3_cognitive.gemini === "configured",
            },
            {
              label: "Claude fallback (auto-switch)",
              ok: report?.capa3_cognitive.fallback_claude === "configured",
            },
          ]}
        />
      </div>

      {/* URLs + Solana proof */}
      <div className="grid grid-cols-[1fr_auto] gap-3.5 items-start">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.2 }}
          className="bg-white border border-border rounded-[16px] p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-coral" />
            <p className="font-semibold text-sm text-text-primary">
              URLs públicas
            </p>
            <span
              className={`ml-auto inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest ${deploy.color}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {deploy.label}
            </span>
          </div>
          <div className="space-y-2.5">
            <UrlRow
              label="Operator UI"
              url={report?.capa5_infra.operator_url}
            />
            <UrlRow
              label="Sistema B (ERP destino)"
              url={report?.capa5_infra.erp_destino_url}
            />
            <UrlRow
              label="Sistema A (catálogo)"
              url={report?.capa5_infra.source_system_url}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="bg-white border border-border rounded-[16px] p-5 flex flex-col items-center gap-3 text-center w-52"
        >
          <div
            className="w-14 h-14 rounded-[16px] grid place-items-center"
            style={{
              background: "linear-gradient(150deg,#9945FF,#14F195)",
              boxShadow: "0 8px 24px -4px rgba(153,69,255,.45)",
            }}
          >
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="font-semibold text-[13px] text-text-primary">
              Proveniencia
            </p>
            <p className="text-[11px] text-text-tertiary mt-0.5">
              Certificado en Solana
            </p>
          </div>
          <span className="w-full text-center font-mono text-[10px] px-2 py-1.5 rounded-lg border border-[#9945FF]/20 bg-gradient-to-r from-[#9945FF]/6 to-[#14F195]/6 text-[#7B35D9]">
            {report?.capa6_solana.network ?? "devnet"} ·{" "}
            {report?.capa6_solana.wallet_address ? "verified" : "no wallet"}
          </span>
        </motion.div>
      </div>

      {/* Production banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.35 }}
        className="relative overflow-hidden rounded-[16px] p-[30px_34px] flex items-center justify-between gap-5"
        style={{ background: "linear-gradient(120deg,#C8102E,#A50C25)" }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(80% 120% at 100% 50%, rgba(255,255,255,.12), transparent 60%)",
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Rocket className="w-5 h-5 text-white" />
            <p className="text-white font-semibold text-[17px]">
              Themis está en producción
            </p>
          </div>
          <p className="text-white/70 text-sm">
            Procesando operaciones reales. Cada acción es trazable y verificada
            en blockchain.
          </p>
        </div>
        <a
          href="/diagnostics"
          className="relative z-10 flex-shrink-0 flex items-center gap-2 bg-white text-[#C8102E] font-semibold text-sm px-5 py-2.5 rounded-[11px] hover:bg-white/90 transition-colors"
        >
          Ver diagnostics
          <ArrowRight className="w-4 h-4" />
        </a>
      </motion.div>
    </div>
  );
}

function InfraCard({
  icon: Icon,
  title,
  subtitle,
  live,
  metrics,
  delay,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  live: boolean;
  metrics: { label: string; value: string }[];
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay }}
      className="bg-white border border-border rounded-[16px] p-[18px] flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="w-10 h-10 rounded-[12px] bg-bg-elevated flex items-center justify-center">
          <Icon className="w-5 h-5 text-coral" />
        </div>
        <span
          className={`inline-flex items-center gap-1.5 h-5 px-2 rounded-full text-[10px] font-semibold ${
            live
              ? "bg-status-success-bg text-status-success"
              : "bg-status-warning-bg text-status-warning"
          }`}
        >
          {live ? (
            <CheckCircle className="w-3 h-3" />
          ) : (
            <AlertTriangle className="w-3 h-3" />
          )}
          {live ? "Live" : "Degraded"}
        </span>
      </div>
      <div>
        <p className="font-semibold text-sm text-text-primary">{title}</p>
        <p className="text-[12px] text-text-tertiary mt-0.5">{subtitle}</p>
      </div>
      <div className="space-y-2 pt-1 border-t border-border">
        {metrics.map((m) => (
          <div key={m.label} className="flex items-center justify-between">
            <span className="text-[11px] text-text-secondary">{m.label}</span>
            <span className="font-mono text-[11px] font-semibold text-text-primary truncate ml-2 max-w-[140px]" title={m.value}>
              {m.value}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function SmallStatusCard({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; ok: boolean }[];
}) {
  return (
    <div className="bg-white border border-border rounded-[14px] p-4">
      <p className="text-[10px] font-mono uppercase tracking-widest text-text-tertiary mb-3">
        {title}
      </p>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between">
            <span className="text-[12px] text-text-primary">{r.label}</span>
            <span
              className={`text-[11px] font-mono font-semibold ${
                r.ok ? "text-status-success" : "text-status-error"
              }`}
            >
              {r.ok ? "✓ Live" : "✗ Missing"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function UrlRow({ label, url }: { label: string; url?: string }) {
  if (!url) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-text-secondary">{label}</span>
        <span className="text-[11px] font-mono text-text-tertiary">—</span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[12px] text-text-secondary shrink-0">{label}</span>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[11px] font-mono text-coral hover:underline truncate min-w-0"
        title={url}
      >
        {url}
      </a>
    </div>
  );
}

function shortHost(url?: string): string {
  if (!url) return "—";
  try {
    const u = new URL(url);
    return u.host;
  } catch {
    return url;
  }
}

function shortAddr(addr: string): string {
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
