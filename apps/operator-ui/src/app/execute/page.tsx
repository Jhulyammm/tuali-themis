/**
 * /execute — Capa 1 ejecución REAL + Capa 2 voz + self-healing en vivo.
 *
 * Stream SSE desde /api/execute mientras Stagehand maneja un browser
 * Browserbase real visible (iframe embebido). Telemetría se actualiza por cada
 * step. El jurado ve a Themis trabajando sola en vivo.
 */

"use client";

import { useEffect, useReducer } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StepLog } from "@/components/StepLog";
import { VoiceIndicator } from "@/components/VoiceIndicator";
import { BrowserViewer } from "@/components/BrowserViewer";
import { SolanaBadge } from "@/components/SolanaBadge";
import { useVoice } from "@/hooks/useVoice";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  AlertTriangle,
  Play,
} from "lucide-react";
import type {
  ExecutionLog,
  Playbook,
  Execution,
} from "@hack4her/playbooks";

// ============================================================
// State
// ============================================================

interface ExecState {
  playbooks: Playbook[];
  selectedPb: Playbook | null;
  productId: string;
  status: "idle" | "starting" | "running" | "succeeded" | "failed";
  debuggerUrl: string | null;
  sessionId: string | null;
  logs: ExecutionLog[];
  currentIndex: number | undefined;
  execution: Execution | null;
  error: string | null;
}

type ExecAction =
  | { type: "set_playbooks"; playbooks: Playbook[] }
  | { type: "select_pb"; playbook: Playbook | null }
  | { type: "set_product_id"; value: string }
  | { type: "start" }
  | { type: "session_ready"; sessionId: string; debuggerUrl: string | null }
  | { type: "step"; log: ExecutionLog }
  | { type: "done"; execution: Execution }
  | { type: "error"; message: string };

const initialState: ExecState = {
  playbooks: [],
  selectedPb: null,
  productId: "1",
  status: "idle",
  debuggerUrl: null,
  sessionId: null,
  logs: [],
  currentIndex: undefined,
  execution: null,
  error: null,
};

function reducer(state: ExecState, action: ExecAction): ExecState {
  switch (action.type) {
    case "set_playbooks":
      return {
        ...state,
        playbooks: action.playbooks,
        selectedPb: state.selectedPb ?? action.playbooks[0] ?? null,
      };
    case "select_pb":
      return { ...state, selectedPb: action.playbook };
    case "set_product_id":
      return { ...state, productId: action.value };
    case "start":
      return {
        ...state,
        status: "starting",
        debuggerUrl: null,
        sessionId: null,
        logs: [],
        currentIndex: 0,
        execution: null,
        error: null,
      };
    case "session_ready":
      return {
        ...state,
        status: "running",
        sessionId: action.sessionId,
        debuggerUrl: action.debuggerUrl,
      };
    case "step":
      return {
        ...state,
        logs: [...state.logs, action.log],
        currentIndex: action.log.step_index + 1,
      };
    case "done":
      return {
        ...state,
        status:
          action.execution.status === "succeeded" ? "succeeded" : "failed",
        execution: action.execution,
        currentIndex: undefined,
      };
    case "error":
      return {
        ...state,
        status: "failed",
        error: action.message,
        currentIndex: undefined,
      };
  }
}

// ============================================================
// Page
// ============================================================

export default function ExecutePage() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { speak, isPlaying, unlock } = useVoice();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/playbooks");
        if (!res.ok) return;
        const data = (await res.json()) as { playbooks: Playbook[] };
        if (!cancelled) {
          dispatch({ type: "set_playbooks", playbooks: data.playbooks ?? [] });
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRun = async () => {
    if (!state.selectedPb) {
      dispatch({ type: "error", message: "Selecciona un playbook primero" });
      return;
    }
    await unlock();
    dispatch({ type: "start" });
    void speak(
      "Arrancando ejecución. Voy a manejar el navegador yo solita ahora.",
      "firm",
    );

    try {
      // 1) POST inicia y devuelve executionId
      const startRes = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playbook: state.selectedPb,
          parameters: { product_id: state.productId },
        }),
      });
      if (!startRes.ok) {
        const text = await startRes.text();
        throw new Error(text || `HTTP ${startRes.status}`);
      }
      const { executionId } = (await startRes.json()) as {
        executionId: string;
      };

      // 2) Polling cada 1.5s al GET /api/execute?id=X
      const seenLogs = new Set<number>();
      let lastAnnouncedHealCount = 0;
      let attempt = 0;

      while (true) {
        await new Promise((r) => setTimeout(r, 1500));
        attempt++;
        if (attempt > 240) {
          throw new Error(
            "Timeout: la ejecución superó 6 minutos sin completar",
          );
        }

        let pollRes: Response;
        try {
          pollRes = await fetch(
            `/api/execute?id=${encodeURIComponent(executionId)}`,
          );
        } catch {
          continue; // network blip, reintentamos
        }

        if (pollRes.status === 410) {
          throw new Error("La ejecución expiró en el servidor (lambda fría).");
        }
        if (!pollRes.ok) continue;

        const poll = (await pollRes.json()) as {
          sessionId?: string;
          debuggerUrl?: string;
          logs?: ExecutionLog[];
          done?: boolean;
          error?: string;
          execution?: Execution;
        };

        // Anunciar session_ready la primera vez que aparezca debuggerUrl
        if (poll.sessionId && state.status !== "running") {
          dispatch({
            type: "session_ready",
            sessionId: poll.sessionId,
            debuggerUrl: poll.debuggerUrl ?? null,
          });
        }

        // Dispatcher de logs nuevos
        for (const log of poll.logs ?? []) {
          const key = log.step_index;
          if (seenLogs.has(key)) continue;
          seenLogs.add(key);
          dispatch({ type: "step", log });
        }

        // Anunciar self-healing si subió el count
        const healCount = (poll.logs ?? []).filter((l) => l.adapted_to).length;
        if (healCount > lastAnnouncedHealCount) {
          lastAnnouncedHealCount = healCount;
          void speak(
            "Detecté un cambio en la página. Adaptando con visión.",
            "alert",
          );
        }

        // Done?
        if (poll.done) {
          if (poll.error) {
            dispatch({ type: "error", message: poll.error });
            void speak("La ejecución falló.", "alert");
          } else if (poll.execution) {
            dispatch({ type: "done", execution: poll.execution });
            void speak(
              poll.execution.status === "succeeded"
                ? "Ejecución completada. Datos transferidos al sistema destino."
                : "La ejecución terminó con errores. Revisa el log.",
              poll.execution.status === "succeeded" ? "triumphant" : "alert",
            );
          }
          break;
        }
      }
    } catch (err) {
      dispatch({ type: "error", message: (err as Error).message });
      void speak("La ejecución falló.", "alert");
    }
  };

  // Derived telemetry
  const succeeded = state.logs.filter((l) => l.status === "succeeded").length;
  const adapted = state.logs.filter((l) => l.adapted_to).length;
  const failed = state.logs.filter((l) => l.status === "failed").length;
  const totalMs = state.logs.reduce(
    (sum, l) => sum + (l.duration_ms ?? 0),
    0,
  );

  const sourceUrl =
    state.selectedPb?.source_url ??
    process.env.NEXT_PUBLIC_SOURCE_SYSTEM_URL ??
    "http://localhost:3002";

  const destinationUrl =
    state.selectedPb?.destination_url ??
    process.env.NEXT_PUBLIC_ERP_DESTINO_URL ??
    "http://localhost:3001";

  const viewerStatus: "idle" | "creating" | "executing" =
    state.status === "starting"
      ? "creating"
      : state.status === "running"
        ? "executing"
        : "idle";

  const isRunning =
    state.status === "starting" || state.status === "running";

  return (
    <div className="min-h-screen p-8 bg-bg-base">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="font-mono text-[11px] uppercase tracking-widest text-text-tertiary">
              Capa 1 · Modo Ejecutar · Stagehand + Claude Computer Use
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
              Themis ejecuta sola con datos nuevos
            </h1>
            <p className="text-sm text-text-secondary">
              Replica el proceso aprendido en un navegador real visible. Si algo
              cambia en la página, se adapta con visión (self-healing ⚡).
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <VoiceIndicator active={isPlaying} source="agent" />
            <Button
              onClick={handleRun}
              disabled={isRunning || !state.selectedPb}
              className="bg-[#C8102E] hover:bg-[#B40D28] text-white border-0"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Ejecutando…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  Ejecutar playbook
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Playbook selector */}
        <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-4 flex-wrap shadow-sm">
          <div className="flex items-center gap-2">
            <label className="text-xs text-text-tertiary uppercase font-mono tracking-widest">
              Playbook
            </label>
            <select
              value={state.selectedPb?.id ?? ""}
              onChange={(e) =>
                dispatch({
                  type: "select_pb",
                  playbook:
                    state.playbooks.find((p) => p.id === e.target.value) ??
                    null,
                })
              }
              disabled={state.playbooks.length === 0 || isRunning}
              className="bg-bg-elevated border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-coral/30"
            >
              {state.playbooks.length === 0 && (
                <option>Correr /teach primero</option>
              )}
              {state.playbooks.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-text-tertiary uppercase font-mono tracking-widest">
              product_id
            </label>
            <input
              type="text"
              value={state.productId}
              onChange={(e) =>
                dispatch({ type: "set_product_id", value: e.target.value })
              }
              disabled={isRunning}
              className="bg-bg-elevated border border-border rounded-lg px-3 py-1.5 text-sm font-mono w-24 focus:outline-none focus:ring-2 focus:ring-coral/30"
            />
          </div>
          {state.selectedPb?.provenance && (
            <SolanaBadge provenance={state.selectedPb.provenance} size="sm" />
          )}
        </div>

        {/* Success / Failure cards */}
        {state.status === "succeeded" && state.execution && (
          <div className="rounded-xl border border-status-success/40 bg-status-success-bg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-status-success" />
              <div>
                <p className="text-sm font-semibold">Ejecución completada</p>
                <p className="text-xs text-text-secondary font-mono mt-0.5">
                  {state.execution.logs.length} pasos · ID{" "}
                  {state.execution.id.slice(0, 8)} ·{" "}
                  {(totalMs / 1000).toFixed(1)}s
                </p>
              </div>
            </div>
          </div>
        )}

        {state.status === "failed" && (
          <div className="rounded-xl border border-status-error/40 bg-red-50 p-4 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-status-error shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-status-error">
                Ejecución terminó con error
              </p>
              {state.error && (
                <p className="text-xs text-text-secondary mt-1 font-mono break-all">
                  {state.error}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Telemetry cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <TelemetryCard
            icon={<CheckCircle2 className="w-5 h-5 text-status-success" />}
            label="Pasos completados"
            value={succeeded}
            bg="bg-status-success-bg"
          />
          <TelemetryCard
            icon={<Clock className="w-5 h-5 text-status-info" />}
            label="Latencia total"
            value={totalMs > 0 ? `${(totalMs / 1000).toFixed(1)}s` : "—"}
            bg="bg-status-info-bg"
          />
          <TelemetryCard
            icon={<Zap className="w-5 h-5 text-status-warning" />}
            label="Auto-reparaciones ⚡"
            value={adapted}
            bg="bg-status-warning-bg"
            highlight={adapted > 0}
          />
          <TelemetryCard
            icon={<AlertTriangle className="w-5 h-5 text-status-error" />}
            label="Errores"
            value={failed}
            bg={failed > 0 ? "bg-red-50" : "bg-bg-elevated"}
          />
        </div>

        {/* Browser viewer + StepLog side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-border">
              <p className="text-sm font-semibold">Navegador autónomo (live)</p>
              <span
                className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full ${
                  state.status === "running"
                    ? "bg-status-warning-bg text-status-warning"
                    : state.status === "succeeded"
                      ? "bg-status-success-bg text-status-success"
                      : state.status === "failed"
                        ? "bg-red-50 text-status-error"
                        : "bg-bg-elevated text-text-tertiary"
                }`}
              >
                {state.status === "starting"
                  ? "Iniciando…"
                  : state.status === "running"
                    ? "● Ejecutando"
                    : state.status === "succeeded"
                      ? "✓ Completo"
                      : state.status === "failed"
                        ? "✗ Falló"
                        : "Inactivo"}
              </span>
            </CardHeader>
            <CardContent className="p-4">
              <BrowserViewer
                url={sourceUrl}
                status={viewerStatus}
                debuggerUrl={state.debuggerUrl ?? undefined}
              />
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">
                  Pasos — {state.logs.length}
                </p>
                {adapted > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-status-warning bg-status-warning-bg px-2 py-0.5 rounded-full border border-status-warning/30">
                    <Zap className="w-2.5 h-2.5" />
                    {adapted} self-heal
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-3">
              {state.status === "idle" ? (
                <div className="text-center py-12 px-4">
                  <Play className="w-6 h-6 mx-auto text-text-tertiary" />
                  <p className="text-sm text-text-secondary mt-3">
                    Selecciona un playbook y apretá &ldquo;Ejecutar&rdquo;
                  </p>
                </div>
              ) : (
                <StepLog
                  logs={state.logs}
                  currentIndex={state.currentIndex}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Self-healing explanation */}
        {(state.status === "running" || adapted > 0) && (
          <div className="bg-status-warning-bg border border-status-warning/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Zap className="w-4 h-4 text-status-warning" />
              <p className="text-sm font-semibold text-amber-800">
                Vision Fallback activo
              </p>
            </div>
            <p className="text-xs text-amber-700 leading-relaxed">
              Cuando un selector falla, Themis toma un screenshot y usa Claude
              Vision para localizar el elemento por semántica. Nunca se rinde.
            </p>
          </div>
        )}

        {/* Process context */}
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-tertiary mb-3">
            Proceso en ejecución
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <ContextRow label="Sistema A" value={shortUrl(sourceUrl)} />
            <ContextRow label="Sistema B" value={shortUrl(destinationUrl)} />
            <ContextRow
              label="Playbook"
              value={state.selectedPb?.name ?? "—"}
            />
            <ContextRow label="product_id" value={state.productId} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Subcomponents
// ============================================================

function TelemetryCard({
  icon,
  label,
  value,
  bg,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  bg: string;
  highlight?: boolean;
}) {
  return (
    <div className={`${bg} rounded-xl p-4 border border-border`}>
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <p
        className={`text-2xl font-bold tabular-nums ${highlight ? "text-status-warning" : "text-text-primary"}`}
      >
        {value}
      </p>
      <p className="text-xs text-text-secondary mt-0.5">{label}</p>
    </div>
  );
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-text-tertiary font-mono">
        {label}
      </p>
      <p className="text-xs font-mono text-text-primary truncate mt-0.5" title={value}>
        {value}
      </p>
    </div>
  );
}

// ============================================================
// SSE consumer
// ============================================================

async function consumeSSE(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: string, data: unknown) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sep = buffer.indexOf("\n\n");
    while (sep !== -1) {
      const chunk = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      sep = buffer.indexOf("\n\n");
      const lines = chunk.split("\n");
      let eventName = "message";
      let dataStr = "";
      for (const line of lines) {
        if (line.startsWith("event:")) {
          eventName = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          dataStr += line.slice(5).trim();
        }
      }
      if (!dataStr) continue;
      try {
        const parsed = JSON.parse(dataStr) as unknown;
        onEvent(eventName, parsed);
      } catch {
        // ignore malformed chunk
      }
    }
  }
}

function shortUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.host + (u.pathname !== "/" ? u.pathname : "");
  } catch {
    return url;
  }
}
