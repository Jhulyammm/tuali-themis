"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StepLog } from "@/components/StepLog";
import { VoiceIndicator } from "@/components/VoiceIndicator";
import { SolanaBadge } from "@/components/SolanaBadge";
import { useVoice } from "@/hooks/useVoice";
import { Play, Square, Sparkles, Zap, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { ExecutionLog, Playbook, Execution } from "@hack4her/playbooks";

const MOCK_LOGS: ExecutionLog[] = [
  { step_index: 0, action: { action: "navigate", target: "/products" }, status: "succeeded", duration_ms: 1200, timestamp: new Date().toISOString() },
  { step_index: 1, action: { action: "click", selector_intent: "primer producto en grilla" }, status: "succeeded", duration_ms: 480, timestamp: new Date().toISOString() },
  { step_index: 2, action: { action: "extract", selector_intent: "nombre del producto", as: "product_name" }, status: "succeeded", duration_ms: 220, timestamp: new Date().toISOString() },
  { step_index: 3, action: { action: "extract", selector_intent: "precio del producto", as: "price" }, status: "adapting", duration_ms: 0, timestamp: new Date().toISOString() },
];

const MOCK_LOG_ADAPTED: ExecutionLog = {
  step_index: 3,
  action: { action: "extract", selector_intent: "precio del producto", as: "price" },
  status: "succeeded",
  duration_ms: 3400,
  adapted_from: "campo de precio",
  adapted_to: "campo de precio (USD)",
  timestamp: new Date().toISOString(),
};

const MOCK_REMAINING: ExecutionLog[] = [
  { step_index: 4, action: { action: "switch_system", target: "destination" }, status: "succeeded", duration_ms: 600, timestamp: new Date().toISOString() },
  { step_index: 5, action: { action: "fill", selector_intent: "denominación comercial", value: "{product_name}" }, status: "succeeded", duration_ms: 380, timestamp: new Date().toISOString() },
  { step_index: 6, action: { action: "fill", selector_intent: "precio neto sin IVA", value: "{price/1.16}" }, status: "succeeded", duration_ms: 420, timestamp: new Date().toISOString() },
  { step_index: 7, action: { action: "click", selector_intent: "botón guardar" }, status: "succeeded", duration_ms: 800, timestamp: new Date().toISOString() },
];

export default function ExecutePage() {
  const [executing, setExecuting] = useState(false);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number | undefined>(undefined);
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [selectedPb, setSelectedPb] = useState<Playbook | null>(null);
  const [realRunning, setRealRunning] = useState(false);
  const [realExecution, setRealExecution] = useState<Execution | null>(null);
  const [realError, setRealError] = useState<string | null>(null);
  const [productId, setProductId] = useState("1");

  const { speak, isPlaying } = useVoice();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/playbooks");
        if (!res.ok) return;
        const data = (await res.json()) as { playbooks: Playbook[] };
        if (cancelled) return;
        setPlaybooks(data.playbooks ?? []);
        if (data.playbooks?.length > 0) setSelectedPb(data.playbooks[0]);
      } catch {
        try {
          const res = await fetch("/api/playbook/sample");
          if (!res.ok) return;
          const data = (await res.json()) as { playbook: Playbook };
          if (!cancelled) setSelectedPb(data.playbook);
        } catch { /* ignore */ }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const startVisualDemo = async () => {
    setExecuting(true);
    setLogs([]);
    setCurrentIndex(0);
    void speak("Iniciando ejecución autónoma. Voy a replicar el proceso con datos nuevos.");

    for (let i = 0; i < MOCK_LOGS.length; i++) {
      await sleep(800);
      setCurrentIndex(i);
      setLogs((prev) => [...prev, MOCK_LOGS[i]]);
    }

    await sleep(2500);
    setLogs((prev) => [...prev.slice(0, -1), MOCK_LOG_ADAPTED]);
    void speak("Detecté un cambio en el campo de precio. Resolviendo con visión.");

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
    if (!selectedPb) { setRealError("Selecciona un playbook primero"); return; }
    setRealRunning(true);
    setRealError(null);
    setRealExecution(null);
    setLogs([]);
    setCurrentIndex(0);
    void speak("Iniciando ejecución real con Stagehand. Esto puede tardar 30 a 60 segundos.");
    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playbook: selectedPb, parameters: { product_id: productId }, headless: true }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { execution: Execution };
      setRealExecution(data.execution);
      setLogs(data.execution.logs);
      void speak(data.execution.status === "succeeded" ? "Ejecución real completada." : "La ejecución terminó con errores.");
    } catch (err) {
      setRealError((err as Error).message);
      void speak("La ejecución real falló");
    } finally {
      setRealRunning(false);
      setCurrentIndex(undefined);
    }
  };

  // Derived telemetry from logs
  const succeeded = logs.filter((l) => l.status === "succeeded").length;
  const adapted = logs.filter((l) => l.adapted_to).length;
  const failed = logs.filter((l) => l.status === "failed").length;
  const totalMs = logs.reduce((s, l) => s + (l.duration_ms ?? 0), 0);

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
              Replica el proceso aprendido. Se adapta si algo cambia (vision fallback ⚡).
            </p>
          </div>
          <div className="flex items-center gap-3">
            <VoiceIndicator active={isPlaying} source="agent" />
            {executing ? (
              <Button variant="destructive" onClick={stopVisualDemo}>
                <Square className="w-4 h-4 mr-1.5" /> Detener
              </Button>
            ) : (
              <Button variant="secondary" onClick={startVisualDemo}>
                <Play className="w-4 h-4 mr-1.5" /> Visual demo
              </Button>
            )}
            <Button
              onClick={runRealExecution}
              disabled={realRunning || !selectedPb}
              className="bg-[#C8102E] hover:bg-[#B40D28] text-white border-0"
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              {realRunning ? "Ejecutando..." : "Ejecutar REAL"}
            </Button>
          </div>
        </div>

        {/* Playbook selector */}
        <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-4 flex-wrap shadow-sm">
          <div className="flex items-center gap-2">
            <label className="text-xs text-text-tertiary uppercase font-mono tracking-widest">Playbook</label>
            <select
              value={selectedPb?.id ?? ""}
              onChange={(e) => setSelectedPb(playbooks.find((p) => p.id === e.target.value) ?? null)}
              disabled={playbooks.length === 0}
              className="bg-bg-elevated border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-coral/30"
            >
              {playbooks.length === 0 && <option>Correr /teach primero</option>}
              {playbooks.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-text-tertiary uppercase font-mono tracking-widest">product_id</label>
            <input
              type="text"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="bg-bg-elevated border border-border rounded-lg px-3 py-1.5 text-sm font-mono w-20 focus:outline-none focus:ring-2 focus:ring-coral/30"
            />
          </div>
          {selectedPb?.provenance && (
            <SolanaBadge provenance={selectedPb.provenance} size="sm" />
          )}
        </div>

        {/* Result cards */}
        {realExecution && (
          <div className={`rounded-xl border p-4 flex items-center justify-between ${
            realExecution.status === "succeeded"
              ? "border-status-success/40 bg-status-success-bg"
              : "border-status-error/40 bg-red-50"
          }`}>
            <div>
              <p className="text-sm font-semibold">Ejecución real: {realExecution.status}</p>
              <p className="text-xs text-text-secondary font-mono mt-0.5">
                {realExecution.logs.length} pasos · ID {realExecution.id.slice(0, 8)}
              </p>
            </div>
            <CheckCircle2 className="w-6 h-6 text-status-success" />
          </div>
        )}

        {realError && (
          <div className="rounded-xl border border-status-error/40 bg-red-50 p-4">
            <p className="text-sm font-semibold text-status-error">Error en ejecución real</p>
            <p className="text-xs text-text-secondary font-mono mt-1 break-all">{realError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Telemetry + info — replaces the always-empty BrowserViewer */}
          <div className="lg:col-span-2 space-y-4">

            {/* Telemetry grid */}
            <div className="grid grid-cols-2 gap-3">
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

            {/* Process context card */}
            <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-tertiary mb-3">Proceso en ejecución</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Sistema A</span>
                  <span className="font-mono text-xs text-text-primary">automationexercise.com</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Sistema B</span>
                  <span className="font-mono text-xs text-text-primary">erp-destino.local</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Playbook</span>
                  <span className="font-mono text-xs text-text-primary truncate max-w-[160px]">
                    {selectedPb?.name ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Product ID</span>
                  <span className="font-mono text-xs text-text-primary">{productId}</span>
                </div>
              </div>
            </div>

            {/* Self-healing explanation — shown when active */}
            {(executing || adapted > 0) && (
              <div className="bg-status-warning-bg border border-status-warning/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Zap className="w-4 h-4 text-status-warning" />
                  <p className="text-sm font-semibold text-amber-800">Vision Fallback activo</p>
                </div>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Cuando un selector CSS falla, Themis toma un screenshot y usa Computer Use
                  de Claude para localizar el elemento visualmente. Nunca se rinde.
                </p>
              </div>
            )}
          </div>

          {/* Step Log */}
          <Card className="bg-white">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Pasos</p>
                {adapted > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-status-warning bg-status-warning-bg px-2 py-0.5 rounded-full border border-status-warning/30">
                    <Zap className="w-2.5 h-2.5" />
                    {adapted} self-heal
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-3">
              <StepLog logs={logs} currentIndex={currentIndex} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

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
      <p className={`text-2xl font-bold tabular-nums ${highlight ? "text-status-warning" : "text-text-primary"}`}>
        {value}
      </p>
      <p className="text-xs text-text-secondary mt-0.5">{label}</p>
    </div>
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
