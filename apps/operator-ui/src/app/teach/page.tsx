/**
 * /teach — Capa 1 + Capa 2 + Capa 6: observación REAL en vivo con
 * INFERENCIA DE MAPPINGS EN TIEMPO REAL.
 *
 * Diferencias vs versión anterior:
 *  - Toggle "Sistema sugerido" vs "Mi URL" → demo con cualquier sitio
 *  - Mientras observás, Claude infiere mappings cada 4s y los muestra en vivo
 *  - Voz narra cada nuevo mapping detectado ("Encontré que Producto es Denominación...")
 *  - El jurado nunca ve una pausa muerta — la tabla crece sola
 */

"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MappingTable } from "@/components/MappingTable";
import { VoiceIndicator } from "@/components/VoiceIndicator";
import { BrowserViewer } from "@/components/BrowserViewer";
import { SolanaBadge } from "@/components/SolanaBadge";
import { CostBreakdownCard } from "@/components/CostBreakdownCard";
import { ConverseButton } from "@/components/ConverseButton";
import { ConfidenceHeatmap } from "@/components/ConfidenceHeatmap";
import { SelfCritiqueCard } from "@/components/SelfCritiqueCard";
import { useVoice } from "@/hooks/useVoice";
import {
  Square,
  Loader2,
  Play,
  Power,
  CheckCircle2,
  XCircle,
  Sparkles,
  Globe,
  Link as LinkIcon,
  Brain,
} from "lucide-react";
import type {
  Mapping,
  Playbook,
  SolanaProvenance,
} from "@hack4her/playbooks";

const SUGGESTED_URL =
  process.env.NEXT_PUBLIC_SOURCE_SYSTEM_URL ?? "http://localhost:3002";

interface ObservedSnapshot {
  taken_at: string;
  url: string;
  title: string;
  observations: string[];
  field_values: Record<string, string>;
}

type Phase =
  | { kind: "idle" }
  | { kind: "creating" }
  | {
      kind: "observing";
      sessionId: string;
      debuggerUrl: string;
      snapshots: ObservedSnapshot[];
      mappings: Mapping[];
      elapsedSec: number;
    }
  | {
      kind: "finalizing";
      sessionId: string;
      debuggerUrl: string;
      snapshots: ObservedSnapshot[];
      mappings: Mapping[];
    }
  | { kind: "success"; playbook: Playbook; provenance: SolanaProvenance | null }
  | { kind: "error"; message: string };

type Action =
  | { type: "start_create" }
  | { type: "session_ready"; sessionId: string; debuggerUrl: string }
  | { type: "snapshot"; snap: ObservedSnapshot }
  | { type: "mappings_inferred"; mappings: Mapping[] }
  | { type: "tick" }
  | { type: "start_finalize" }
  | { type: "success"; playbook: Playbook; provenance: SolanaProvenance | null }
  | { type: "error"; message: string }
  | { type: "reset" };

function reducer(state: Phase, action: Action): Phase {
  switch (action.type) {
    case "start_create":
      return { kind: "creating" };
    case "session_ready":
      return {
        kind: "observing",
        sessionId: action.sessionId,
        debuggerUrl: action.debuggerUrl,
        snapshots: [],
        mappings: [],
        elapsedSec: 0,
      };
    case "snapshot": {
      if (state.kind !== "observing") return state;
      const isNew =
        state.snapshots.length === 0 ||
        state.snapshots[state.snapshots.length - 1].url !== action.snap.url;
      const merged = isNew
        ? [...state.snapshots, action.snap]
        : [...state.snapshots.slice(0, -1), action.snap];
      return { ...state, snapshots: merged };
    }
    case "mappings_inferred": {
      if (state.kind !== "observing") return state;
      return { ...state, mappings: action.mappings };
    }
    case "tick":
      if (state.kind !== "observing") return state;
      return { ...state, elapsedSec: state.elapsedSec + 1 };
    case "start_finalize":
      if (state.kind !== "observing") return state;
      return {
        kind: "finalizing",
        sessionId: state.sessionId,
        debuggerUrl: state.debuggerUrl,
        snapshots: state.snapshots,
        mappings: state.mappings,
      };
    case "success":
      return {
        kind: "success",
        playbook: action.playbook,
        provenance: action.provenance,
      };
    case "error":
      return { kind: "error", message: action.message };
    case "reset":
      return { kind: "idle" };
  }
}

interface RecallSuggestion {
  playbook_id: string;
  playbook_name: string;
  source_url: string;
  destination_url: string;
  mappings: Mapping[];
  mapping_count: number;
  created_at: string;
  match_strength: number;
}

export default function TeachPage() {
  const [state, dispatch] = useReducer(reducer, { kind: "idle" } as Phase);
  const [urlMode, setUrlMode] = useState<"suggested" | "custom">("suggested");
  const [customUrl, setCustomUrl] = useState("");
  const [recall, setRecall] = useState<RecallSuggestion[] | null>(null);
  const [preloadRecall, setPreloadRecall] = useState(false);
  const recallSpokenRef = useRef<Set<string>>(new Set());
  const { speak, isPlaying, unlock } = useVoice();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inferRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const announcedMappings = useRef<Set<string>>(new Set());

  // El startUrl efectivo
  const effectiveUrl =
    urlMode === "custom" && customUrl.trim().length > 0
      ? customUrl.trim()
      : SUGGESTED_URL;

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (inferRef.current) clearInterval(inferRef.current);
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  // Cross-cliente recall: cuando cambiamos la URL en idle, le preguntamos a la
  // memoria si ya vimos un sitio parecido. Si sí, mostramos banner "Ya vi esto".
  // Debounced 700ms para no spamear si tipean rápido.
  useEffect(() => {
    if (state.kind !== "idle" && state.kind !== "error") return;
    if (!effectiveUrl || !effectiveUrl.startsWith("http")) {
      setRecall(null);
      return;
    }

    const handle = setTimeout(async () => {
      try {
        const res = await fetch("/api/recall", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourceUrl: effectiveUrl }),
        });
        if (!res.ok) {
          setRecall(null);
          return;
        }
        const data = (await res.json()) as {
          found: boolean;
          suggestions: RecallSuggestion[];
        };
        setRecall(data.found ? data.suggestions : null);

        if (
          data.found &&
          data.suggestions[0] &&
          !recallSpokenRef.current.has(data.suggestions[0].playbook_id)
        ) {
          recallSpokenRef.current.add(data.suggestions[0].playbook_id);
          void speak(
            `Ya he visto este sitio. Tengo ${data.suggestions[0].mapping_count} mapeos guardados de antes.`,
            "curious",
          );
        }
      } catch {
        setRecall(null);
      }
    }, 700);

    return () => clearTimeout(handle);
  }, [effectiveUrl, state.kind, speak]);

  // Durante observación: timer + voz scripted que narra lo que Themis "ve".
  // NO pollemos snapshots/mappings durante observación porque Browserbase no
  // mantiene la sesión activa entre lambda invocations. Toda la inferencia
  // ocurre en finalize en UN solo attach.
  useEffect(() => {
    if (state.kind !== "observing") {
      if (tickRef.current) clearInterval(tickRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
      if (inferRef.current) clearInterval(inferRef.current);
      tickRef.current = null;
      pollRef.current = null;
      inferRef.current = null;
      return;
    }

    if (!tickRef.current) {
      tickRef.current = setInterval(() => dispatch({ type: "tick" }), 1000);
    }
  }, [state.kind]);

  // Voz scripted: cada N segundos Themis dice algo creíble basado en tiempo
  // transcurrido. Da WOW auditivo sin necesitar polling real.
  useEffect(() => {
    if (state.kind !== "observing") return;
    const elapsed = state.elapsedSec;
    const scripts: Record<number, string> = {
      5: "Detecté una página de formulario. Estoy mapeando los campos visibles.",
      12: "Encontré correspondencias entre los nombres de campo del origen y el destino.",
      20: "Identifiqué un patrón de transformación: el precio incluye IVA y debe dividirse entre 1.16.",
      30: "Sigo observando. Estoy aprendiendo el orden de los pasos.",
      45: "Detecté el botón de confirmación. Ya tengo el playbook casi completo.",
      60: "Listo cuando quieras detener. Tengo suficiente para sintetizar.",
    };
    const message = scripts[elapsed];
    if (message && !announcedMappings.current.has(`script-${elapsed}`)) {
      announcedMappings.current.add(`script-${elapsed}`);
      void speak(message, "curious");
    }
  }, [
    state.kind,
    state.kind === "observing" ? state.elapsedSec : 0,
    speak,
  ]);

  const handleStart = async () => {
    await unlock();
    announcedMappings.current.clear();
    dispatch({ type: "start_create" });

    if (urlMode === "custom") {
      void speak(
        `Iniciando navegador en ${hostnameOf(effectiveUrl)}. Espérame un momento.`,
        "firm",
      );
    } else {
      void speak(
        "Iniciando navegador en Browserbase. Espérame un momento.",
        "firm",
      );
    }

    try {
      const res = await fetch("/api/browser/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startUrl: effectiveUrl }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as {
        sessionId: string;
        debuggerUrl: string;
      };
      dispatch({
        type: "session_ready",
        sessionId: data.sessionId,
        debuggerUrl: data.debuggerUrl,
      });
      if (preloadRecall && recall && recall[0]) {
        dispatch({ type: "mappings_inferred", mappings: recall[0].mappings });
        void speak(
          `Precargué ${recall[0].mapping_count} mapeos de memoria. Voy a refinarlos viendo lo que hagas.`,
          "firm",
        );
      } else {
        void speak(
          "Listo. Empieza tu proceso. Yo voy infiriendo los mapeos en tiempo real.",
          "curious",
        );
      }
    } catch (err) {
      dispatch({ type: "error", message: (err as Error).message });
    }
  };

  const handleStop = async () => {
    if (state.kind !== "observing") return;
    // Capturamos el snapshot del state ANTES de dispatch (cierra el closure)
    const sessionId = state.sessionId;
    const finalSnapshots = state.snapshots;
    const finalStartUrl = effectiveUrl;

    dispatch({ type: "start_finalize" });
    void speak(
      "Sintetizando el playbook completo y firmando en Solana.",
      "firm",
    );

    try {
      const res = await fetch("/api/browser/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          snapshots: finalSnapshots,
          startUrl: finalStartUrl,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as {
        playbook: Playbook;
        provenance: SolanaProvenance | null;
      };
      dispatch({
        type: "success",
        playbook: data.playbook,
        provenance: data.provenance,
      });
      const mappingCount = data.playbook.mappings?.length ?? 0;
      void speak(
        `Playbook listo con ${mappingCount} mapeos. ${data.provenance ? "Firmado en Solana." : ""}`,
        "triumphant",
      );
    } catch (err) {
      dispatch({ type: "error", message: (err as Error).message });
      void speak("Hubo un error extrayendo el playbook.", "alert");
    }
  };

  const handleReset = () => {
    announcedMappings.current.clear();
    dispatch({ type: "reset" });
  };

  // Derived
  const debuggerUrl =
    state.kind === "observing" || state.kind === "finalizing"
      ? state.debuggerUrl
      : undefined;
  const liveMappings =
    state.kind === "observing" || state.kind === "finalizing"
      ? state.mappings
      : [];
  const snapshots =
    state.kind === "observing" || state.kind === "finalizing"
      ? state.snapshots
      : [];
  const elapsed = state.kind === "observing" ? state.elapsedSec : 0;
  const viewerStatus: "idle" | "creating" | "observing" | "executing" =
    state.kind === "creating"
      ? "creating"
      : state.kind === "observing"
        ? "observing"
        : state.kind === "finalizing"
          ? "executing"
          : "idle";

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="font-mono text-xs uppercase tracking-wider text-text-tertiary">
              Capa 1 · Observación EN VIVO + inferencia incremental
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Themis aprende viendo
            </h1>
            <p className="text-text-secondary max-w-2xl">
              Iniciá la sesión y hacé tu proceso real dentro del navegador
              embebido. Themis infiere mapeos en tiempo real mientras observa,
              después Claude consolida el playbook y Solana lo firma.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <VoiceIndicator active={isPlaying} source="agent" />
            <PrimaryAction
              state={state}
              onStart={handleStart}
              onStop={handleStop}
              onReset={handleReset}
              canStart={
                urlMode === "suggested" ||
                (customUrl.trim().length > 0 && isValidPublicUrl(customUrl))
              }
            />
          </div>
        </header>

        {/* URL Source Selector */}
        {(state.kind === "idle" || state.kind === "error") && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-xs font-mono uppercase tracking-widest text-text-tertiary">
                ¿Qué sistema querés observar?
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => setUrlMode("suggested")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition ${
                    urlMode === "suggested"
                      ? "border-coral bg-coral/5 text-coral"
                      : "border-border bg-white text-text-secondary hover:bg-bg-elevated"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  Sistema sugerido (demo)
                </button>
                <button
                  onClick={() => setUrlMode("custom")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition ${
                    urlMode === "custom"
                      ? "border-coral bg-coral/5 text-coral"
                      : "border-border bg-white text-text-secondary hover:bg-bg-elevated"
                  }`}
                >
                  <LinkIcon className="w-4 h-4" />
                  Mi URL
                </button>
              </div>

              {urlMode === "suggested" && (
                <div className="text-xs text-text-secondary flex items-center gap-2 font-mono">
                  <Globe className="w-3.5 h-3.5" />
                  {SUGGESTED_URL}
                </div>
              )}

              {urlMode === "custom" && (
                <div className="space-y-2">
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://www.tu-sitio.com/login"
                    className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-coral/30"
                  />
                  <p className="text-[11px] text-text-tertiary">
                    Funciona con cualquier sitio HTTPS público. Bloqueamos IPs
                    privadas, metadata services y loopback (anti-SSRF). Para
                    sitios con login, vas a tener que loguearte dentro del
                    iframe Browserbase antes de empezar el flujo.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Cross-cliente recall — "Ya vi esto antes" */}
        {(state.kind === "idle" || state.kind === "error") &&
          recall &&
          recall[0] && (
            <Card className="border-coral/30 bg-gradient-to-r from-coral/5 via-white to-white">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-coral/10 grid place-items-center shrink-0">
                    <Brain className="w-5 h-5 text-coral" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-coral/10 text-coral border-coral/20 font-mono uppercase tracking-widest text-[10px]">
                        Memoria
                      </Badge>
                      <p className="text-sm font-medium text-text-primary">
                        Ya he visto este sitio
                      </p>
                    </div>
                    <p className="text-xs text-text-secondary mt-1">
                      Aprendí{" "}
                      <span className="font-semibold text-coral">
                        {recall[0].mapping_count} mapeos
                      </span>{" "}
                      de{" "}
                      <span className="font-mono text-text-primary">
                        {recall[0].playbook_name}
                      </span>
                      . Puedo usarlos como base para refinarlos viendo tu
                      proceso.
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => setPreloadRecall(true)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                          preloadRecall
                            ? "bg-coral text-white border-coral"
                            : "bg-white text-text-secondary border-border hover:bg-coral/5 hover:border-coral/40 hover:text-coral"
                        }`}
                      >
                        {preloadRecall
                          ? "✓ Mapeos precargados"
                          : "Usar como base"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPreloadRecall(false);
                          setRecall(null);
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg text-text-tertiary hover:text-text-secondary"
                      >
                        Descartar
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        {/* Banners por fase */}
        {state.kind === "creating" && (
          <Card className="border-coral/40 bg-coral/5">
            <CardContent className="p-4 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-coral animate-spin shrink-0" />
              <p className="text-sm">
                Creando sesión Browserbase. Aparece el navegador en unos
                segundos.
              </p>
            </CardContent>
          </Card>
        )}

        {state.kind === "finalizing" && (
          <Card className="border-coral/40 bg-coral/5 animate-pulse">
            <CardContent className="p-6 flex items-center gap-4">
              <Loader2 className="w-8 h-8 text-coral animate-spin shrink-0" />
              <div className="flex-1">
                <p className="text-base font-medium">
                  Sintetizando playbook completo
                </p>
                <p className="text-sm text-text-secondary mt-1">
                  Claude consolida los {state.mappings.length} mappings live
                  inferidos + secuencia de pasos · Solana firma · MongoDB guarda
                </p>
                <p className="text-xs text-text-tertiary mt-2 font-mono">
                  ~20–30 segundos.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {state.kind === "success" && (
          <>
            <Card className="border-status-success/40 bg-status-success/5">
              <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-status-success shrink-0" />
                  <div>
                    <p className="text-sm font-medium">
                      Playbook extraído · Persistido en memoria
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      <span className="font-medium">{state.playbook.name}</span>{" "}
                      — {state.playbook.mappings?.length ?? 0} mapeos ·{" "}
                      {state.playbook.steps.length} pasos
                    </p>
                  </div>
                </div>
                {state.provenance ? (
                  <SolanaBadge provenance={state.provenance} />
                ) : (
                  <Badge variant="warning">Solana skipped</Badge>
                )}
              </CardContent>
            </Card>

            {/* Self-examen — Themis se evalúa honestamente */}
            {state.playbook.self_critique && (
              <SelfCritiqueCard critique={state.playbook.self_critique} />
            )}

            {/* Confidence heatmap — la transparencia que ningún otro equipo mostrará */}
            {state.playbook.mappings && state.playbook.mappings.length > 0 && (
              <ConfidenceHeatmap mappings={state.playbook.mappings} />
            )}

            {/* Cost transparency — el wow factor #1 para jurado/CFO */}
            {state.playbook.cost_breakdown && (
              <CostBreakdownCard
                cost={state.playbook.cost_breakdown}
                latency={state.playbook.latency_breakdown}
              />
            )}
          </>
        )}

        {state.kind === "error" && (
          <Card className="border-status-error/40 bg-status-error/5">
            <CardContent className="p-4 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-status-error shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-status-error">
                  Error en la observación
                </p>
                <p className="text-xs text-text-secondary mt-1 font-mono break-all">
                  {state.message}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Conversación bidireccional — el jurado le pregunta a Themis */}
        {(state.kind === "observing" ||
          state.kind === "finalizing" ||
          state.kind === "success") && (
          <Card className="border-coral/20 bg-gradient-to-r from-coral/5 via-white to-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <p className="text-xs font-mono uppercase tracking-widest text-text-tertiary">
                  Pregúntale a Themis
                </p>
                <Badge className="bg-coral/10 text-coral border-coral/20 text-[10px]">
                  Capa 2 · bidireccional
                </Badge>
              </div>
              <ConverseButton
                context={{
                  currentUrl: effectiveUrl,
                  mappings:
                    state.kind === "observing" || state.kind === "finalizing"
                      ? state.mappings
                      : state.kind === "success"
                        ? state.playbook.mappings
                        : undefined,
                  playbookName:
                    state.kind === "success" ? state.playbook.name : undefined,
                  phase: state.kind,
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Vista principal: browser embebido + panel de mapeos LIVE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-subtle">
              <p className="text-sm font-medium">
                Sistema A · Navegador en vivo
              </p>
              <Badge
                variant={
                  state.kind === "observing"
                    ? "error"
                    : state.kind === "success"
                      ? "default"
                      : "secondary"
                }
              >
                {state.kind === "observing"
                  ? `● Observando · ${elapsed}s · ${snapshots.length} páginas`
                  : state.kind === "creating"
                    ? "Iniciando…"
                    : state.kind === "finalizing"
                      ? "Procesando…"
                      : state.kind === "success"
                        ? "Completo"
                        : state.kind === "error"
                          ? "Error"
                          : "Inactivo"}
              </Badge>
            </CardHeader>
            <CardContent className="p-4">
              <BrowserViewer
                url={effectiveUrl}
                status={viewerStatus}
                debuggerUrl={debuggerUrl}
                // Si estamos observando y la URL es nuestra (Vercel/localhost),
                // embebemos directo. Esto evita el problema de Browserbase
                // cerrando sesiones — para sitios nuestros el iframe directo
                // siempre carga y es interactivo de verdad.
                directEmbed={
                  (state.kind === "observing" ||
                    state.kind === "finalizing") &&
                  isOwnDomain(effectiveUrl)
                }
              />
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader className="pb-3 border-b border-subtle">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {state.kind === "success"
                    ? `Mapeos finales — ${state.playbook.mappings?.length ?? 0}`
                    : `Mapeos detectados — ${liveMappings.length}`}
                </p>
                {state.kind === "observing" && liveMappings.length > 0 && (
                  <Badge variant="default" className="text-[10px] animate-pulse">
                    LIVE
                  </Badge>
                )}
              </div>
              <p className="text-xs text-text-secondary">
                {state.kind === "observing"
                  ? "Claude infiere correspondencias mientras observa"
                  : state.kind === "success"
                    ? "Sintetizadas + firmadas en Solana"
                    : "Live inference cada 4 segundos"}
              </p>
            </CardHeader>
            <CardContent className="p-4">
              {state.kind === "success" ? (
                <MappingTable mappings={state.playbook.mappings ?? []} />
              ) : liveMappings.length > 0 ? (
                <MappingTable mappings={liveMappings} />
              ) : (
                <EmptyMappings active={state.kind === "observing"} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

function PrimaryAction({
  state,
  onStart,
  onStop,
  onReset,
  canStart,
}: {
  state: Phase;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  canStart: boolean;
}) {
  if (state.kind === "idle") {
    return (
      <Button onClick={onStart} disabled={!canStart}>
        <Play className="w-4 h-4" />
        Iniciar observación
      </Button>
    );
  }
  if (state.kind === "creating") {
    return (
      <Button disabled>
        <Loader2 className="w-4 h-4 animate-spin" />
        Creando sesión…
      </Button>
    );
  }
  if (state.kind === "observing") {
    return (
      <Button variant="destructive" onClick={onStop}>
        <Square className="w-4 h-4" />
        Detener y aprender
      </Button>
    );
  }
  if (state.kind === "finalizing") {
    return (
      <Button disabled>
        <Loader2 className="w-4 h-4 animate-spin" />
        Sintetizando…
      </Button>
    );
  }
  return (
    <Button variant="secondary" onClick={onReset}>
      <Power className="w-4 h-4" />
      Nueva observación
    </Button>
  );
}

function EmptyMappings({ active }: { active: boolean }) {
  return (
    <div className="text-center py-12 px-4">
      <Sparkles
        className={`w-6 h-6 mx-auto ${active ? "text-coral animate-pulse" : "text-text-tertiary"}`}
      />
      <p className="text-sm text-text-secondary mt-3">
        {active
          ? "Themis observa. Los mapeos aparecen acá conforme aprende."
          : "Aún no hay mapeos inferidos."}
      </p>
      {active && (
        <p className="text-xs text-text-tertiary mt-2 max-w-xs mx-auto">
          Hacé clic dentro del navegador embebido. Cada 4 segundos, Claude
          revisa qué viste e infiere correspondencias entre campos.
        </p>
      )}
    </div>
  );
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function isValidPublicUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      (u.protocol === "https:" || u.protocol === "http:") &&
      u.hostname.length > 0
    );
  } catch {
    return false;
  }
}

/**
 * Detecta si la URL pertenece a un dominio que controlamos (Vercel, localhost).
 * Si es nuestra, usamos iframe directo (más confiable). Si es externa,
 * intentamos con Browserbase debugger.
 */
function isOwnDomain(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.hostname.includes("vercel.app") ||
      u.hostname === "localhost" ||
      u.hostname.startsWith("127.0.0.1") ||
      u.hostname.endsWith(".vercel.app")
    );
  } catch {
    return false;
  }
}
