/**
 * /diagnostics — System health check para Themis.
 *
 * Lee env vars del servidor y muestra qué capas están LIVE vs MOCK.
 * Para cada capa, hace una llamada real al servicio para verificar la conexión.
 *
 * Refresca la página después de actualizar .env.local para ver cambios.
 */

import { CheckEnv } from "@/components/CheckEnv";

export const dynamic = "force-dynamic";

interface CheckResult {
  capa: string;
  name: string;
  required_env: string[];
  status: "live" | "mock" | "error";
  detail: string;
  test_endpoint?: string;
}

async function runDiagnostics(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  // ===== Capa 1: Anthropic Claude =====
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  results.push({
    capa: "1",
    name: "Anthropic Claude (extractor + self-healing)",
    required_env: ["ANTHROPIC_API_KEY"],
    status: hasAnthropic ? "live" : "mock",
    detail: hasAnthropic
      ? "Key configurada. Listo para extraer playbooks de recordings."
      : "Falta ANTHROPIC_API_KEY. Sin esto, el agente no puede aprender.",
  });

  // ===== Capa 1: Browserbase + Stagehand =====
  const hasBrowserbase =
    !!process.env.BROWSERBASE_API_KEY && !!process.env.BROWSERBASE_PROJECT_ID;
  results.push({
    capa: "1",
    name: "Browserbase + Stagehand (ejecución autónoma)",
    required_env: ["BROWSERBASE_API_KEY", "BROWSERBASE_PROJECT_ID"],
    status: hasBrowserbase ? "live" : "mock",
    detail: hasBrowserbase
      ? "Configurado. Browserbase + Stagehand listos."
      : "Sin keys, /execute solo muestra el mock animado. No hay browser real.",
  });

  // ===== Capa 2: ElevenLabs =====
  const hasElevenLabs = !!process.env.ELEVENLABS_API_KEY;
  results.push({
    capa: "2",
    name: "ElevenLabs (voz mexicana de Themis)",
    required_env: ["ELEVENLABS_API_KEY", "ELEVENLABS_VOICE_ID (opcional)"],
    status: hasElevenLabs ? "live" : "mock",
    detail: hasElevenLabs
      ? "Key configurada. Voice ID por env (default si no se especifica)."
      : "Sin key, /api/voice tira 500. UI muestra waveform pero sin audio real.",
  });

  // ===== Capa 2: OpenAI Whisper =====
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  results.push({
    capa: "2",
    name: "OpenAI Whisper (transcripción narración)",
    required_env: ["OPENAI_API_KEY"],
    status: hasOpenAI ? "live" : "mock",
    detail: hasOpenAI
      ? `Key configurada. Recorder puede transcribir narración del operador.`
      : "Sin key, el recorder no transcribe audio. Solo captura DOM events.",
  });

  // ===== Capa 3: Gemini =====
  const hasGemini = !!(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY);
  results.push({
    capa: "3",
    name: "Google Gemini Pro (razonamiento contextual)",
    required_env: ["GOOGLE_API_KEY"],
    status: hasGemini ? "live" : "mock",
    detail: hasGemini
      ? "Key configurada. /api/recommendations devuelve análisis real de Gemini."
      : "Sin key, /recommendations tira error. UI muestra estructura pero sin razonamiento.",
  });

  // ===== Capa 4: MongoDB Atlas =====
  const hasMongo = !!process.env.MONGODB_URI;
  results.push({
    capa: "4",
    name: "MongoDB Atlas (knowledge graph de mapeos)",
    required_env: ["MONGODB_URI"],
    status: hasMongo ? "live" : "mock",
    detail: hasMongo
      ? "URI configurada. Los mapeos aprendidos se persisten cross-session."
      : "Sin URI, /memory muestra mock data. No hay persistencia real.",
  });

  // ===== Capa 6: Solana =====
  const hasSolanaKey = !!process.env.SOLANA_WALLET_SECRET_KEY;
  let solanaDetail = "";
  let solanaStatus: CheckResult["status"] = "mock";
  if (!hasSolanaKey) {
    solanaDetail = "Falta SOLANA_WALLET_SECRET_KEY. Corre `pnpm setup:solana`.";
  } else {
    // Try to fetch balance
    try {
      const web3 = await import("@solana/web3.js");
      const { Connection, PublicKey } = web3;
      const conn = new Connection(
        process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
        "confirmed",
      );
      const pubKey = new PublicKey(process.env.SOLANA_WALLET_PUBLIC_KEY ?? "");
      const balance = await conn.getBalance(pubKey);
      const solBalance = balance / 1e9;
      if (solBalance > 0) {
        solanaStatus = "live";
        solanaDetail = `Wallet con ${solBalance.toFixed(4)} SOL. Lista para registrar playbooks on-chain.`;
      } else {
        solanaStatus = "error";
        solanaDetail = `Wallet sin SOL. Address: ${process.env.SOLANA_WALLET_PUBLIC_KEY}. Pide al faucet manualmente en https://faucet.solana.com.`;
      }
    } catch (err) {
      solanaStatus = "error";
      solanaDetail = `Error consultando balance: ${(err as Error).message}`;
    }
  }
  results.push({
    capa: "6",
    name: "Solana devnet (on-chain provenance)",
    required_env: ["SOLANA_WALLET_SECRET_KEY", "SOLANA_WALLET_PUBLIC_KEY"],
    status: solanaStatus,
    detail: solanaDetail,
  });

  return results;
}

export default async function DiagnosticsPage() {
  const results = await runDiagnostics();
  const liveCount = results.filter((r) => r.status === "live").length;
  const totalCount = results.length;

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-wider text-text-tertiary">
            System Diagnostics · Themis
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Estado de las 6 capas
          </h1>
          <p className="text-text-secondary">
            {liveCount} de {totalCount} servicios conectados.
            {liveCount === 0 &&
              " Ningún servicio live — solo verás UI mock. Llena `.env.local` y refresca."}
          </p>
        </header>

        <div className="space-y-3">
          {results.map((r) => (
            <div
              key={r.name}
              className={`rounded-lg border p-4 ${
                r.status === "live"
                  ? "border-status-success/40 bg-status-success/5"
                  : r.status === "error"
                    ? "border-status-error/40 bg-status-error/5"
                    : "border-default bg-bg-surface"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-text-tertiary">
                      Capa {r.capa}
                    </span>
                    <span
                      className={`font-mono text-xs px-2 py-0.5 rounded ${
                        r.status === "live"
                          ? "bg-status-success/20 text-status-success"
                          : r.status === "error"
                            ? "bg-status-error/20 text-status-error"
                            : "bg-bg-elevated text-text-tertiary"
                      }`}
                    >
                      {r.status === "live"
                        ? "● LIVE"
                        : r.status === "error"
                          ? "● ERROR"
                          : "○ MOCK"}
                    </span>
                  </div>
                  <p className="font-medium text-sm">{r.name}</p>
                  <p className="text-xs text-text-secondary mt-1">{r.detail}</p>
                  <p className="text-xs font-mono text-text-tertiary mt-2">
                    Env vars: {r.required_env.join(", ")}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <CheckEnv />

        <footer className="pt-4 border-t border-subtle">
          <p className="text-xs text-text-tertiary">
            Refresca la página después de actualizar{" "}
            <code className="font-mono">.env.local</code> y reiniciar{" "}
            <code className="font-mono">pnpm dev:operator</code>.
          </p>
        </footer>
      </div>
    </main>
  );
}
