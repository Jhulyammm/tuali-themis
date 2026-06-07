/**
 * /challenge — Reto del Jurado.
 *
 * El jurado pega una URL que Themis nunca vio. Sin observación humana, sin
 * iframe, sin Browserbase. Solo: fetch HTTP + Claude + Solana. <30s.
 *
 * Esto demuele la objeción "esto es plantillas hardcoded". En pitch en vivo
 * cualquier persona del jurado puede dictarme una URL y la audiencia ve a
 * Themis inferir el playbook en tiempo real.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MappingTable } from "@/components/MappingTable";
import { SolanaBadge } from "@/components/SolanaBadge";
import { CostBreakdownCard } from "@/components/CostBreakdownCard";
import { ConfidenceHeatmap } from "@/components/ConfidenceHeatmap";
import { SelfCritiqueCard } from "@/components/SelfCritiqueCard";
import { VoiceIndicator } from "@/components/VoiceIndicator";
import { useVoice } from "@/hooks/useVoice";
import {
  Sparkles,
  Loader2,
  Trophy,
  Zap,
  AlertCircle,
  Play,
  Link as LinkIcon,
} from "lucide-react";
import type { Playbook, SolanaProvenance } from "@hack4her/playbooks";

interface ChallengeResult {
  playbook: Playbook;
  provenance: SolanaProvenance | null;
  snapshotsCount: number;
  fetchMs: number;
  title: string;
}

type State =
  | { kind: "idle" }
  | { kind: "running"; elapsedMs: number; startedAt: number }
  | { kind: "success"; result: ChallengeResult; elapsedMs: number }
  | { kind: "error"; message: string };

// URLs con formularios HTML reales — Themis necesita inputs/labels/selects
// para extraer mappings. Sites corporativos puros (arcacontal.com,
// coca-colacompany.com) no exponen forms públicos → 0 mappings → Grade F.
// Estas tres garantizan que el demo siempre devuelva mappings ricos.
const SUGGESTION_URLS = [
  "https://httpbin.org/forms/post",
  "https://www.amazon.com.mx/registries/wishlist/create",
  "https://www.bestbuy.com.mx/login.jsp",
];

export default function ChallengePage() {
  const [url, setUrl] = useState("");
  const [hint, setHint] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });
  const { speak, unlock, isPlaying } = useVoice();
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (state.kind !== "running") {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
      return;
    }
    const startedAt = state.startedAt;
    tickRef.current = setInterval(() => {
      setState((s) =>
        s.kind === "running"
          ? { ...s, elapsedMs: Date.now() - startedAt }
          : s,
      );
    }, 100);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [state.kind, state.kind === "running" ? state.startedAt : 0]);

  const handleAccept = async () => {
    if (!url.trim()) return;
    await unlock();

    void speak(
      "Acepto el reto. Nunca he visto esta URL. Voy a inferir el playbook.",
      "firm",
    );

    // Capturamos el startedAt en una const ANTES del await. Sin esto, al
    // resolverse el fetch, state.kind ya es "success" y state.startedAt no
    // existe en el closure → elapsed sale 0.0s.
    const startedAt = Date.now();
    setState({ kind: "running", elapsedMs: 0, startedAt });

    try {
      const res = await fetch("/api/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), hint: hint.trim() || undefined }),
      });

      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }

      const result = (await res.json()) as ChallengeResult;
      const elapsed = Date.now() - startedAt;
      setState({ kind: "success", result, elapsedMs: elapsed });

      const mappings = result.playbook.mappings?.length ?? 0;
      void speak(
        `Reto superado en ${(elapsed / 1000).toFixed(1)} segundos. Detecté ${mappings} mapeos.${
          result.provenance ? " Firmado en Solana." : ""
        }`,
        "triumphant",
      );
    } catch (err) {
      const msg = (err as Error).message;
      setState({ kind: "error", message: msg });
      void speak("No pude superar el reto. Revisa la URL.", "alert");
    }
  };

  const reset = () => {
    setState({ kind: "idle" });
    setUrl("");
    setHint("");
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header dramático */}
      <div className="relative overflow-hidden rounded-2xl border border-coral/30 bg-gradient-to-br from-coral/10 via-white to-white p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-coral grid place-items-center shadow-lg shadow-coral/30">
            <Trophy className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-coral text-white border-0 font-mono uppercase tracking-widest text-[10px]">
                Reto del jurado
              </Badge>
              <span className="text-xs font-mono uppercase tracking-widest text-text-tertiary">
                Capa 1 · prueba en vivo
              </span>
            </div>
            <h1 className="text-3xl font-bold text-text-primary leading-tight">
              Dame cualquier URL de proveedor.
              <span className="text-coral"> Te devuelvo el playbook.</span>
            </h1>
            <p className="text-sm text-text-secondary mt-2 max-w-2xl">
              Sin plantillas. Sin que un capturista lo enseñe. Themis nunca vio
              esta URL. Fetch HTTP → Claude infiere los mapeos hacia el ERP de
              Tuali → Solana firma. Segundos, no semanas de integración.
            </p>
          </div>
        </div>

        <div className="absolute -right-4 -bottom-4 opacity-5">
          <Sparkles className="w-32 h-32 text-coral" />
        </div>
      </div>

      {/* Input + sugerencias */}
      {state.kind === "idle" && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-coral" />
              <h2 className="font-medium">Pega la URL del reto</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://ejemplo.com/formulario"
              className="w-full px-4 py-3 rounded-lg border border-border bg-white text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral"
              onKeyDown={(e) => {
                if (e.key === "Enter" && url.trim()) void handleAccept();
              }}
            />

            <input
              type="text"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="(opcional) Pista en lenguaje natural — ej. 'transferí precios sin IVA'"
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-text-secondary text-sm focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral"
              maxLength={500}
            />

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-text-tertiary font-mono uppercase tracking-widest">
                Sugerencias:
              </span>
              {SUGGESTION_URLS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setUrl(s)}
                  className="text-xs px-2 py-1 rounded bg-bg-elevated border border-border text-text-secondary hover:bg-coral/5 hover:border-coral/40 hover:text-coral transition-colors font-mono"
                >
                  {s.replace(/^https?:\/\//, "")}
                </button>
              ))}
            </div>

            <Button
              onClick={handleAccept}
              disabled={!url.trim()}
              size="lg"
              className="w-full bg-coral hover:bg-coral/90 text-white font-semibold"
            >
              <Play className="w-4 h-4 mr-2" />
              Aceptar reto
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Running — countdown grande */}
      {state.kind === "running" && (
        <Card className="border-coral/40 bg-gradient-to-br from-coral/5 via-white to-white">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-coral mb-1">
                  Themis está pensando
                </p>
                <p className="text-sm text-text-secondary">
                  Analizando estructura de{" "}
                  <span className="font-mono text-text-primary">
                    {hostnameOf(url)}
                  </span>
                </p>
              </div>
              <VoiceIndicator active={isPlaying} source="agent" />
            </div>

            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <p className="text-xs font-mono uppercase tracking-widest text-text-tertiary mb-2">
                  Tiempo transcurrido
                </p>
                <p className="text-7xl font-bold tabular-nums text-coral leading-none">
                  {(state.elapsedMs / 1000).toFixed(1)}
                  <span className="text-3xl text-text-tertiary">s</span>
                </p>
                <div className="flex items-center justify-center gap-2 mt-4 text-sm text-text-secondary">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {state.elapsedMs < 5000 && "Haciendo fetch del HTML..."}
                    {state.elapsedMs >= 5000 &&
                      state.elapsedMs < 15000 &&
                      "Claude infiere mapeos..."}
                    {state.elapsedMs >= 15000 &&
                      state.elapsedMs < 25000 &&
                      "Sintetizando playbook..."}
                    {state.elapsedMs >= 25000 && "Firmando en Solana..."}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest text-text-tertiary border-t border-border pt-3">
              <span>OBJETIVO: &lt; 30s</span>
              <span>STATUS: {state.elapsedMs < 30_000 ? "EN TIEMPO" : "EXCEDIDO"}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success */}
      {state.kind === "success" && (
        <>
          <Card className="border-status-success/40 bg-gradient-to-br from-status-success/5 via-white to-white">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-status-success grid place-items-center shadow-lg shadow-status-success/30">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-status-success text-white border-0 font-mono uppercase tracking-widest text-[10px]">
                      Reto superado
                    </Badge>
                    <span className="text-xs font-mono text-text-tertiary">
                      {state.result.title}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-text-primary">
                    Aprendí en{" "}
                    <span className="text-status-success">
                      {(state.elapsedMs / 1000).toFixed(1)}s
                    </span>
                  </h2>
                  <p className="text-sm text-text-secondary mt-1">
                    {state.result.playbook.mappings?.length ?? 0} mapeos detectados
                    a partir de HTML, sin observación humana.
                  </p>
                </div>
                {state.result.provenance && (
                  <SolanaBadge provenance={state.result.provenance} size="lg" />
                )}
              </div>

              <div className="grid grid-cols-4 gap-3 mt-6 pt-6 border-t border-border">
                <Metric
                  label="Mapeos"
                  value={String(state.result.playbook.mappings?.length ?? 0)}
                  icon={<Sparkles className="w-3 h-3" />}
                />
                <Metric
                  label="Pasos"
                  value={String(state.result.playbook.steps?.length ?? 0)}
                  icon={<Play className="w-3 h-3" />}
                />
                <Metric
                  label="Latencia"
                  value={`${(state.elapsedMs / 1000).toFixed(1)}s`}
                  icon={<Zap className="w-3 h-3" />}
                />
                <Metric
                  label="Provenance"
                  value={state.result.provenance ? "ON-CHAIN" : "OFF"}
                  icon={<Trophy className="w-3 h-3" />}
                />
              </div>
            </CardContent>
          </Card>

          {state.result.playbook.mappings &&
            state.result.playbook.mappings.length > 0 && (
              <Card>
                <CardHeader>
                  <h3 className="font-medium">Mapeos inferidos</h3>
                </CardHeader>
                <CardContent>
                  <MappingTable mappings={state.result.playbook.mappings} />
                </CardContent>
              </Card>
            )}

          {state.result.playbook.self_critique && (
            <SelfCritiqueCard critique={state.result.playbook.self_critique} />
          )}

          {state.result.playbook.mappings &&
            state.result.playbook.mappings.length > 0 && (
              <ConfidenceHeatmap mappings={state.result.playbook.mappings} />
            )}

          {state.result.playbook.cost_breakdown && (
            <CostBreakdownCard
              cost={state.result.playbook.cost_breakdown}
              latency={state.result.playbook.latency_breakdown}
              manualMinutes={6}
              hourlyUSD={8.3}
            />
          )}

          <Button onClick={reset} variant="outline" className="w-full">
            Probar otra URL
          </Button>
        </>
      )}

      {/* Error */}
      {state.kind === "error" && (
        <Card className="border-status-error/40">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-status-error flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-text-primary">No pude con esa URL</p>
                <p className="text-sm text-text-secondary mt-1">
                  {state.message}
                </p>
              </div>
            </div>

            {/* URLs que SIEMPRE funcionan para que el jurado las pruebe en su lugar */}
            <div className="bg-bg-elevated rounded-lg p-3 border border-border">
              <p className="text-[10px] uppercase tracking-widest font-mono text-text-tertiary mb-2">
                Probá con una de estas que sí garantizan mappings ricos:
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTION_URLS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setUrl(s);
                      setState({ kind: "idle" });
                    }}
                    className="text-xs px-2 py-1 rounded bg-white border border-border text-text-secondary hover:bg-coral/5 hover:border-coral/40 hover:text-coral transition-colors font-mono"
                  >
                    {s.replace(/^https?:\/\//, "")}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={reset} variant="outline" className="w-full">
              Intentar otra URL
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-text-tertiary mb-1">
        {icon}
        <span className="text-[10px] uppercase tracking-widest font-mono">
          {label}
        </span>
      </div>
      <p className="text-lg font-bold tabular-nums text-text-primary">{value}</p>
    </div>
  );
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url.slice(0, 40);
  }
}
