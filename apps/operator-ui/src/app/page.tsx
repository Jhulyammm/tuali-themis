import Link from "next/link";
import { Eye, Play, Sparkles, Brain, ShieldCheck, Activity } from "lucide-react";

const CAPABILITIES = [
  {
    icon: Eye,
    title: "Aprende",
    description: "Observa un proceso web una sola vez y extrae los mapeos con Claude.",
    href: "/teach",
    color: "text-status-info",
    bg: "bg-status-info-bg",
  },
  {
    icon: Activity,
    title: "Habla",
    description: "Narra cada paso en tiempo real con ElevenLabs + Whisper.",
    href: "/execute",
    color: "text-status-success",
    bg: "bg-status-success-bg",
  },
  {
    icon: Sparkles,
    title: "Razona",
    description: "Genera recomendaciones contextuales con Gemini Pro.",
    href: "/recommendations",
    color: "text-coral",
    bg: "bg-red-50",
    star: true,
  },
  {
    icon: Brain,
    title: "Recuerda",
    description: "Knowledge graph persistente en MongoDB Atlas.",
    href: "/memory",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    icon: ShieldCheck,
    title: "Verifica",
    description: "Cada ejecución firmada y sellada en Solana devnet.",
    href: "/validate",
    color: "text-status-success",
    bg: "bg-status-success-bg",
  },
  {
    icon: Play,
    title: "Escala",
    description: "Ejecuta autónomamente con Stagehand + self-healing ⚡.",
    href: "/execute",
    color: "text-status-warning",
    bg: "bg-status-warning-bg",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-4xl mx-auto px-8 py-12 space-y-12">

        {/* Hero */}
        <header className="space-y-4">
          <p className="font-mono text-[11px] uppercase tracking-widest text-text-tertiary">
            Hack4Her 2026 · Reto Always on Shelf · Tuali / Arca Continental
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-text-primary leading-tight">
            Aprende viendo. Razona<br />con contexto. Prueba en cadena.
          </h1>
          <p className="text-text-secondary text-lg leading-relaxed max-w-xl">
            Themis era la diosa griega del orden divino. Hoy es el agente cognitivo
            que mapea sistemas web que no se hablan — y lo prueba en blockchain.
          </p>
          <div className="flex gap-3 pt-2">
            <Link
              href="/teach"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C8102E] text-white text-sm font-semibold hover:bg-[#B40D28] transition-colors"
            >
              <Eye className="w-4 h-4" />
              Iniciar observación
            </Link>
            <Link
              href="/recommendations"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-white text-text-primary text-sm font-medium hover:border-coral hover:text-coral transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Ver recomendaciones ⭐
            </Link>
          </div>
        </header>

        {/* Template suggestion */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-bg-elevated flex items-center justify-center flex-shrink-0">
            <Activity className="w-5 h-5 text-text-secondary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary">
              Plantilla activa · OXXO → SAP S/4HANA
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              automationexercise.com → erp-destino · 10+ campos · mapeo no obvio (e.g. Price ÷ 1.16 → Precio neto sin IVA)
            </p>
          </div>
          <Link
            href="/teach"
            className="flex-shrink-0 text-xs font-semibold text-coral hover:underline"
          >
            Iniciar →
          </Link>
        </div>

        {/* 6 capabilities grid */}
        <section>
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-tertiary mb-4">
            6 capas · 6 capacidades
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {CAPABILITIES.map((cap) => {
              const Icon = cap.icon;
              return (
                <Link
                  key={cap.title}
                  href={cap.href}
                  className={`group relative bg-white rounded-2xl border border-border p-5 hover:border-coral hover:shadow-md transition-all ${cap.star ? "ring-2 ring-coral/20" : ""}`}
                >
                  {cap.star && (
                    <span className="absolute top-3 right-3 text-[10px] font-mono text-coral">⭐</span>
                  )}
                  <div className={`w-9 h-9 rounded-xl ${cap.bg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-4.5 h-4.5 ${cap.color}`} />
                  </div>
                  <p className="text-sm font-semibold text-text-primary group-hover:text-coral transition-colors">
                    {cap.title}
                  </p>
                  <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                    {cap.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Tech stack footer */}
        <footer className="pt-6 border-t border-border">
          <p className="text-xs text-text-tertiary font-mono text-center">
            Claude Sonnet 4.6 · ElevenLabs · Gemini Pro · MongoDB Atlas · Solana devnet · Stagehand · Vultr
          </p>
          <p className="text-[10px] text-text-tertiary text-center mt-1">
            Aprende · Habla · Razona · Recuerda · Verifica · Escala
          </p>
        </footer>
      </div>
    </div>
  );
}
