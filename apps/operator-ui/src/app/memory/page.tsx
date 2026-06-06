/**
 * /memory — Capa 4 + Capa 6 demo page.
 *
 * Knowledge graph REAL: lee de /api/playbooks (MongoDB o filesystem).
 * Cada mapeo aparece con su Solana badge verificable on-chain.
 *
 * Cuando hay 0 playbooks → muestra mock para que la UI no esté vacía.
 *
 * Marita: polish visual del grid + animaciones de aparición siguiendo mockup #4.
 */

"use client";

import { useEffect, useState } from "react";
import { MemoryGraphView, LearnedMappingRecord } from "@/components/MemoryGraphView";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import type { Playbook, SolanaProvenance } from "@hack4her/playbooks";

const MOCK_FALLBACK: LearnedMappingRecord[] = [
  {
    id: "demo-1",
    source_field: "Product Name",
    source_selector_intent: "campo del nombre del producto",
    destination_field: "Denominación comercial",
    destination_selector_intent: "campo de denominación",
    confidence: 0.97,
    examples: [
      { source_value: "Blue Top", destination_value: "Blue Top" },
    ],
    learned_at: "2026-06-06T14:30:00Z",
    source_site: "automationexercise.com",
    destination_site: "erp-destino.local",
    zone_context: "demo",
  },
];

interface BackendStatus {
  backend: "mongodb" | "filesystem";
  count: number;
}

export default function MemoryPage() {
  const [mappings, setMappings] = useState<LearnedMappingRecord[]>([]);
  const [status, setStatus] = useState<BackendStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/playbooks");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as {
        playbooks: Playbook[];
        status: BackendStatus;
      };
      setStatus(data.status);
      setMappings(playbooksToMappings(data.playbooks));
    } catch (err) {
      setError((err as Error).message);
      setMappings(MOCK_FALLBACK);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const realCount = mappings.filter((m) => m.id !== "demo-1").length;
  const verifiedCount = mappings.filter((m) => m.provenance).length;
  const avgConfidence =
    mappings.length > 0
      ? Math.round(
          (mappings.reduce((s, m) => s + m.confidence, 0) /
            mappings.length) *
            100,
        )
      : 0;

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="font-mono text-xs uppercase tracking-wider text-text-tertiary">
              Capa 4 · Knowledge Graph · Capa 6 · Solana provenance
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Memoria de Themis
            </h1>
            <p className="text-text-secondary">
              Cada mapeo aprendido se guarda — verificable en Solana, reusable cross-cliente.
            </p>
          </div>
          <Button onClick={loadAll} disabled={loading} variant="secondary">
            <RefreshCw className={loading ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
            Refrescar
          </Button>
        </header>

        {status && (
          <div className="flex items-center gap-3">
            <Badge variant={status.backend === "mongodb" ? "success" : "info"}>
              backend: {status.backend}
            </Badge>
            <span className="text-xs text-text-tertiary font-mono">
              {status.count} playbook{status.count !== 1 ? "s" : ""} persistidos
            </span>
          </div>
        )}

        <div className="flex items-center gap-6 text-sm">
          <Stat label="Mapeos aprendidos" value={mappings.length.toString()} />
          <Stat label="Verificados on-chain" value={verifiedCount.toString()} highlight />
          <Stat label="Confidence promedio" value={`${avgConfidence}%`} />
          {realCount === 0 && (
            <Badge variant="secondary">mostrando ejemplo (corre /teach)</Badge>
          )}
        </div>

        {error && (
          <Card className="border-status-warning/40 bg-status-warning/5">
            <CardContent className="p-4 text-xs text-text-secondary">
              {error}
            </CardContent>
          </Card>
        )}

        <MemoryGraphView mappings={mappings} />
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="font-mono text-xs uppercase text-text-tertiary">{label}</p>
      <p
        className={`text-xl font-semibold tabular-nums ${highlight ? "text-coral" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function playbooksToMappings(playbooks: Playbook[]): LearnedMappingRecord[] {
  const out: LearnedMappingRecord[] = [];
  for (const pb of playbooks) {
    const provenance: SolanaProvenance | undefined = pb.provenance;
    for (const m of pb.mappings ?? []) {
      out.push({
        id: `${pb.id}::${m.source_field}->${m.destination_field}`,
        source_field: m.source_field,
        source_selector_intent: m.source_selector_intent,
        destination_field: m.destination_field,
        destination_selector_intent: m.destination_selector_intent,
        confidence: m.confidence,
        transformation: m.transformation,
        examples: m.examples,
        learned_at: pb.created_at,
        source_site: hostnameOf(pb.source_url),
        destination_site: hostnameOf(pb.destination_url),
        zone_context: pb.intent.slice(0, 40),
        provenance,
      });
    }
  }
  return out;
}

function hostnameOf(url?: string): string {
  if (!url) return "";
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
