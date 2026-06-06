/**
 * /execute — Capa 1 ejecución + Capa 2 voz + Capa 6 self-healing.
 *
 * Dos modos:
 *   - Visual demo (mock): step log animado para el pitch
 *   - Real: Stagehand REAL contra automationexercise.com → erp-destino.
 *     PRUEBA del criterio 2 (Reproducción autónoma) y criterio 3 (Exactitud).
 *
 * Marita: polish visual + animación del momento self-healing siguiendo mockup #6.
 */

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StepLog } from "@/components/StepLog";
import { VoiceIndicator } from "@/components/VoiceIndicator";
import { BrowserViewer } from "@/components/BrowserViewer";
import { SolanaBadge } from "@/components/SolanaBadge";
import { useVoice } from "@/hooks/useVoice";
import { Play, Square, Sparkles } from "lucide-react";
import type {
  ExecutionLog,
  Playbook,
  Execution,
} from "@hack4her/playbooks";

// Mock visual ejecución progresiva
const MOCK_LOGS: ExecutionLog[] = [
  {
    step_index: 0,
    action: { action: "navigate", target: "/products" },
    status: "succeeded",
    duration_ms: 1200,
    timestamp: new Date().toISOString(),
  },
  {
    step_index: 1,
    action: { action: "click", selector_intent: "primer producto en grilla" },
    status: "succeeded",
    duration_ms: 480,
    timestamp: new Date().toISOString(),
  },
  {
    step_index: 2,
    action: {
      action: "extract",
      selector_intent: "nombre del producto",
      as: "product_name",
    },
    status: "succeeded",
    duration_ms: 220,
    timestamp: new Date().toISOString(),
  },
  {
    step_index: 3,
    action: {
      action: "extract",
      selector_intent: "precio del producto",
      as: "price",
    },
    status: "adapting",
    duration_ms: 0,
    timestamp: new Date().toISOString(),
  },
];

const MOCK_LOG_ADAPTED: ExecutionLog = {
  step_index: 3,
  action: {
    action: "extract",
    selector_intent: "precio del producto",
    as: "price",
  },
  status: "succeeded",
  duration_ms: 3400,
  adapted_from: "campo de precio",
  adapted_to: "campo de precio (USD)",
  timestamp: new Date().toISOString(),
};

const MOCK_REMAINING: ExecutionLog[] = [
  {
    step_index: 4,
    action: { action: "switch_system", target: "destination" },
    status: "succeeded",
    duration_ms: 600,
    timestamp: new Date().toISOString(),
  },
  {
    step_index: 5,
    action: {
      action: "fill",
      selector_intent: "denominación comercial",
      value: "{product_name}",
    },
    status: "succeeded",
    duration_ms: 380,
    timestamp: new Date().toISOString(),
  },
  {
    step_index: 6,
    action: {
      action: "fill",
      selector_intent: "precio neto sin IVA",
      value: "{price/1.16}",
    },
    status: "succeeded",
    duration_ms: 420,
    timestamp: new Date().toISOString(),
  },
  {
    step_index: 7,
    action: { action: "click", selector_intent: "botón guardar" },
    status: "succeeded",
    duration_ms: 800,
    timestamp: new Date().toISOString(),
  },
];

export default function ExecutePage() {
  // Visual demo state
  const [executing, setExecuting] = useState(false);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number | undefined>(
    undefined,
  );

  // Real demo state
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [selectedPb, setSelectedPb] = useState<Playbook | null>(null);
  const [realRunning, setRealRunning] = useState(false);
  const [realExecution, setRealExecution] = useState<Execution | null>(null);
  const [realError, setRealError] = useState<string | null>(null);
  const [productId, setProductId] = useState("1");

  const { speak, isPlaying } = useVoice();

  // Carga los playbooks aprendidos al montar
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/playbooks");
        if (!res.ok) return;
        const data = (await res.json()) as {
          playbooks: Playbook[];
        };
        if (cancelled) return;
        setPlaybooks(data.playbooks ?? []);
        if (data.playbooks?.length > 0) setSelectedPb(data.playbooks[0]);
      } catch {
        // No playbooks yet — usa /api/playbook/sample como fallback
        try {
          const res = await fetch("/api/playbook/sample");
          if (!res.ok) return;
          const data = (await res.json()) as { playbook: Playbook };
          if (!cancelled) setSelectedPb(data.playbook);
        } catch {
          // ignore
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const startVisualDemo = async () => {
    setExecuting(true);
    setLogs([]);
    setCurrentIndex(0);

    void speak(
      "Iniciando ejecución autónoma. Voy a replicar el proceso con datos nuevos.",
    );

    for (let i = 0; i < MOCK_LOGS.length; i++) {
      await sleep(800);
      setCurrentIndex(i);
      setLogs((prev) => [...prev, MOCK_LOGS[i]]);
    }

    await sleep(2500);
    setLogs((prev) => [...prev.slice(0, -1), MOCK_LOG_ADAPTED]);
    void speak(
      "Detecté un cambio en el campo de precio. Resolviendo con visión.",
    );

    for (let i = 0; i < MOCK_REMAINING.length; i++) {
      await sleep(700);
      setCurrentIndex(MOCK_REMAINING[i].step_index);
      setLogs((prev) => [...prev, MOCK_REMAINING[i]]);
    }

    void speak("Listo. Ejecución completada. Exactitud verificada.");
    setExecuting(false);
    setCurrentIndex(undefined);
  };

  const stopVisualDemo = () => {
    setExecuting(false);
    setCurrentIndex(undefined);
  };

  const runRealExecution = async () => {
    if (!selectedPb) {
      setRealError("Selecciona un playbook primero");
      return;
    }
    setRealRunning(true);
    setRealError(null);
    setRealExecution(null);
    setLogs([]);
    setCurrentIndex(0);
    void speak(
      "Iniciando ejecución real con Stagehand. Esto puede tardar 30 a 60 segundos.",
    );

    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playbook: selectedPb,
          parameters: { product_id: productId },
          headless: true,
        }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { execution: Execution };
      setRealExecution(data.execution);
      setLogs(data.execution.logs);
      const ok = data.execution.status === "succeeded";
      void speak(
        ok
          ? "Ejecución real completada. Datos transcritos al ERP."
          : "La ejecución terminó con errores. Revisa el log.",
      );
    } catch (err) {
      const msg = (err as Error).message;
      setRealError(msg);
      void speak("La ejecución real falló");
    } finally {
      setRealRunning(false);
      setCurrentIndex(undefined);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="font-mono text-xs uppercase tracking-wider text-text-tertiary">
              Capa 1 · Modo Ejecutar
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Themis ejecuta sola con datos nuevos
            </h1>
            <p className="text-text-secondary">
              Replica el proceso aprendido. Se adapta si algo cambia (vision fallback).
            </p>
          </div>
          <div className="flex items-center gap-3">
            <VoiceIndicator active={isPlaying} source="agent" />
            {executing ? (
              <Button variant="destructive" onClick={stopVisualDemo}>
                <Square className="w-4 h-4" />
                Detener
              </Button>
            ) : (
              <Button variant="secondary" onClick={startVisualDemo}>
                <Play className="w-4 h-4" /> Visual demo
              </Button>
            )}
            <Button onClick={runRealExecution} disabled={realRunning || !selectedPb}>
              <Sparkles className="w-4 h-4" />
              {realRunning ? "Ejecutando..." : "Ejecutar REAL"}
            </Button>
          </div>
        </header>

        <Card>
          <CardContent className="p-4 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs text-text-tertiary uppercase font-mono">
                Playbook
              </label>
              <select
                value={selectedPb?.id ?? ""}
                onChange={(e) =>
                  setSelectedPb(
                    playbooks.find((p) => p.id === e.target.value) ?? null,
                  )
                }
                className="bg-bg-elevated border border-default rounded px-3 py-1.5 text-sm"
                disabled={playbooks.length === 0}
              >
                {playbooks.length === 0 && (
                  <option>(usando sample — corre /teach primero)</option>
                )}
                {playbooks.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-text-tertiary uppercase font-mono">
                product_id
              </label>
              <input
                type="text"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="bg-bg-elevated border border-default rounded px-3 py-1.5 text-sm font-mono w-20"
              />
            </div>
            {selectedPb?.provenance && (
              <SolanaBadge provenance={selectedPb.provenance} size="sm" />
            )}
          </CardContent>
        </Card>

        {realExecution && (
          <Card
            className={
              realExecution.status === "succeeded"
                ? "border-status-success/40 bg-status-success/5"
                : "border-status-error/40 bg-status-error/5"
            }
          >
            <CardContent className="p-4">
              <p className="text-sm font-medium">
                Ejecución real: {realExecution.status}
              </p>
              <p className="text-xs text-text-secondary mt-1 font-mono">
                {realExecution.logs.length} pasos · {realExecution.id.slice(0, 8)}
              </p>
            </CardContent>
          </Card>
        )}

        {realError && (
          <Card className="border-status-error/40 bg-status-error/5">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-status-error">Error</p>
              <p className="text-xs text-text-secondary mt-1 font-mono break-all">
                {realError}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3 border-b border-subtle">
              <p className="text-sm font-medium">Navegador autónomo</p>
            </CardHeader>
            <CardContent className="p-4">
              <BrowserViewer
                url="https://automationexercise.com/products"
                status={executing || realRunning ? "executing" : "idle"}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b border-subtle">
              <p className="text-sm font-medium">Pasos</p>
              <p className="text-xs text-text-secondary">
                {logs.length} ejecutados · ⚡ = self-healed
              </p>
            </CardHeader>
            <CardContent className="p-4">
              <StepLog logs={logs} currentIndex={currentIndex} />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
