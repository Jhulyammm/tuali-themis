/**
 * /teach — Capa 1 + Capa 2 + Capa 6 demo page.
 *
 * Dos modos:
 *   - Visual (mock): el operador ve la tabla creciendo animada para el pitch
 *   - Real (live): click un botón, mandamos una Recording sintética al backend,
 *     Claude la convierte en Playbook real, Solana lo firma, MongoDB lo guarda.
 *     PRUEBA del criterio 1 de la rúbrica (Aprendizaje por observación).
 *
 * Marita: pule visuales siguiendo mockup #2. NO toques la lógica de useState/handlers.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MappingTable } from "@/components/MappingTable";
import { VoiceIndicator } from "@/components/VoiceIndicator";
import { BrowserViewer } from "@/components/BrowserViewer";
import { SolanaBadge } from "@/components/SolanaBadge";
import { useVoice } from "@/hooks/useVoice";
import { Circle, Square, Sparkles } from "lucide-react";
import type { Mapping, Playbook, SolanaProvenance } from "@hack4her/playbooks";

const SOURCE_URL = "https://automationexercise.com/products";

// Visual demo data — para el pitch
const MOCK_MAPPINGS_PROGRESSIVE: Mapping[] = [
  {
    source_field: "Product Name",
    source_selector_intent: "campo del nombre del producto en vista detalle",
    destination_field: "Denominación comercial",
    destination_selector_intent: "campo de denominación",
    confidence: 0.97,
    examples: [{ source_value: "Blue Top", destination_value: "Blue Top" }],
  },
  {
    source_field: "Price",
    source_selector_intent: "campo del precio del producto",
    destination_field: "Precio neto sin IVA",
    destination_selector_intent: "campo de precio neto",
    confidence: 0.92,
    transformation: "Sin símbolo de moneda, dividir entre 1.16",
    examples: [{ source_value: "$500", destination_value: "431.03" }],
  },
  {
    source_field: "Brand",
    source_selector_intent: "campo de la marca del producto",
    destination_field: "Fabricante",
    destination_selector_intent: "campo del fabricante",
    confidence: 0.89,
    examples: [{ source_value: "H&M", destination_value: "H&M" }],
  },
  {
    source_field: "Category",
    source_selector_intent: "categoría del producto en breadcrumb",
    destination_field: "Rubro contable",
    destination_selector_intent: "select de rubro contable",
    confidence: 0.85,
    examples: [{ source_value: "Women > Tops", destination_value: "Textiles" }],
  },
];

// Recording sintético — representa una observación real del flujo
const SYNTHETIC_RECORDING = {
  id: crypto.randomUUID(),
  source_url: "https://automationexercise.com/product_details/1",
  destination_url: "http://localhost:3001/captura",
  duration_ms: 18000,
  audio_transcript:
    "Voy a capturar un producto del catálogo de automationexercise al ERP de Tuali. Primero leo el nombre del producto, la marca, el precio y la categoría. Después en el ERP capturo denominación comercial con el nombre, fabricante con la marca, precio neto sin IVA con el precio dividido entre 1.16, y rubro contable basado en la categoría.",
  events: [
    {
      timestamp_ms: 100,
      type: "dom_event",
      data: { kind: "navigate", url: "https://automationexercise.com/product_details/1" },
    },
    {
      timestamp_ms: 2300,
      type: "narration",
      data: "Leyendo nombre del producto: Blue Top",
    },
    {
      timestamp_ms: 4100,
      type: "narration",
      data: "Marca: H&M",
    },
    {
      timestamp_ms: 5800,
      type: "narration",
      data: "Precio: Rs. 500",
    },
    {
      timestamp_ms: 7200,
      type: "narration",
      data: "Categoría: Women > Tops",
    },
    {
      timestamp_ms: 8400,
      type: "dom_event",
      data: { kind: "navigate", url: "http://localhost:3001/captura" },
    },
    {
      timestamp_ms: 10100,
      type: "dom_event",
      data: {
        kind: "fill",
        testid: "denominacion-input",
        value: "Blue Top",
      },
    },
    {
      timestamp_ms: 12400,
      type: "dom_event",
      data: { kind: "fill", testid: "fabricante-input", value: "H&M" },
    },
    {
      timestamp_ms: 14700,
      type: "dom_event",
      data: {
        kind: "fill",
        testid: "precio-neto-input",
        value: "431.03",
      },
    },
    {
      timestamp_ms: 16100,
      type: "dom_event",
      data: { kind: "click", testid: "guardar-button" },
    },
  ],
  created_at: new Date().toISOString(),
};

export default function TeachPage() {
  // Visual demo state
  const [recording, setRecording] = useState(false);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Real demo state
  const [realRunning, setRealRunning] = useState(false);
  const [realResult, setRealResult] = useState<{
    playbook: Playbook;
    provenance: SolanaProvenance | null;
  } | null>(null);
  const [realError, setRealError] = useState<string | null>(null);

  const { speak, isPlaying } = useVoice();

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startVisualDemo = () => {
    if (recording) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    setRecording(true);
    setMappings([]);
    setElapsed(0);

    let i = 0;
    intervalRef.current = setInterval(() => {
      const next = MOCK_MAPPINGS_PROGRESSIVE[i];
      if (!next) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        return;
      }
      setMappings((prev) => [...prev, next]);
      void speak(
        `Aprendí: ${next.source_field} mapea a ${next.destination_field}`,
      );
      i++;
    }, 2000);

    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);

    setTimeout(() => {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecording(false);
    }, 12000);
  };

  const stopVisualDemo = () => {
    setRecording(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const runRealDemo = async () => {
    setRealRunning(true);
    setRealError(null);
    setRealResult(null);
    void speak("Mandando observación a Claude para extraer playbook real");

    try {
      const res = await fetch("/api/playbook/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(SYNTHETIC_RECORDING),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as {
        playbook: Playbook;
        provenance: SolanaProvenance | null;
      };
      setRealResult(data);
      // Reemplazar mappings visuales con los reales de Claude
      setMappings(data.playbook.mappings ?? []);
      void speak(
        `Playbook extraído con ${data.playbook.mappings?.length ?? 0} mapeos. Registrado en Solana.`,
      );
    } catch (err) {
      const msg = (err as Error).message;
      setRealError(msg);
      void speak("Hubo un error extrayendo el playbook");
    } finally {
      setRealRunning(false);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="font-mono text-xs uppercase tracking-wider text-text-tertiary">
              Capa 1 · Modo Observación
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Themis aprende viendo
            </h1>
            <p className="text-text-secondary">
              Realiza el proceso UNA vez. Themis observa, mapea con Claude, registra en Solana.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <VoiceIndicator active={isPlaying} source="agent" />
            {recording ? (
              <Button variant="destructive" onClick={stopVisualDemo}>
                <Square className="w-4 h-4" />
                Detener
              </Button>
            ) : (
              <Button variant="secondary" onClick={startVisualDemo}>
                <Circle className="w-4 h-4 fill-current animate-pulse-coral" />
                Visual demo
              </Button>
            )}
            <Button onClick={runRealDemo} disabled={realRunning}>
              <Sparkles className="w-4 h-4" />
              {realRunning ? "Procesando..." : "Generar Playbook real"}
            </Button>
          </div>
        </header>

        {realResult?.provenance && (
          <Card className="border-status-success/40 bg-status-success/5">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">
                  Playbook extraído por Claude · Persistido en knowledge graph
                </p>
                <p className="text-xs text-text-secondary mt-0.5">
                  {realResult.playbook.name} — {realResult.playbook.mappings?.length ?? 0} mapeos · {realResult.playbook.steps.length} pasos
                </p>
              </div>
              <SolanaBadge provenance={realResult.provenance} />
            </CardContent>
          </Card>
        )}

        {realError && (
          <Card className="border-status-error/40 bg-status-error/5">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-status-error">
                Error extrayendo playbook
              </p>
              <p className="text-xs text-text-secondary mt-1 font-mono break-all">
                {realError}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-subtle">
              <p className="text-sm font-medium">Sistema A · Origen</p>
              <Badge variant={recording ? "error" : "secondary"}>
                {recording ? `● Grabando ${elapsed}s` : "Inactivo"}
              </Badge>
            </CardHeader>
            <CardContent className="p-4">
              <BrowserViewer
                url={SOURCE_URL}
                status={recording ? "observing" : "idle"}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b border-subtle">
              <p className="text-sm font-medium">
                Mapeos {realResult ? "(reales de Claude)" : "(visual demo)"} —{" "}
                {mappings.length}
              </p>
              <p className="text-xs text-text-secondary">
                Themis identifica correspondencias source-field → destination-field
              </p>
            </CardHeader>
            <CardContent className="p-4">
              <MappingTable mappings={mappings} />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
