"use client";

import { useEffect, useMemo, useState } from "react";
import { MemoryGraphView, LearnedMappingRecord } from "@/components/MemoryGraphView";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Brain, Search } from "lucide-react";
import { useActiveClient } from "@/hooks/useActiveClient";
import type { Playbook, SolanaProvenance } from "@hack4her/playbooks";

const MOCK_FALLBACK: LearnedMappingRecord[] = [
  {
    id: "demo-1",
    source_field: "Product Name",
    source_selector_intent: "campo del nombre del producto",
    destination_field: "Denominación comercial",
    destination_selector_intent: "campo de denominación",
    confidence: 0.97,
    examples: [{ source_value: "Blue Top", destination_value: "Blue Top" }],
    learned_at: "2026-06-06T14:30:00Z",
    source_site: "automationexercise.com",
    destination_site: "erp-destino.local",
    zone_context: "demo",
  },
];

const FILTER_OPTIONS = ["Todos", "SAP S/4HANA", "erp-destino", "Facturación"];

interface BackendStatus {
  backend: "mongodb" | "filesystem";
  count: number;
}

export default function MemoryPage() {
  const { activeClient, clients } = useActiveClient();
  const [mappings, setMappings] = useState<LearnedMappingRecord[]>([]);
  const [status, setStatus] = useState<BackendStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [scopeAllClients, setScopeAllClients] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/playbooks");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { playbooks: Playbook[]; status: BackendStatus };
      setStatus(data.status);
      setMappings(playbooksToMappings(data.playbooks));
    } catch (err) {
      setError((err as Error).message);
      setMappings(MOCK_FALLBACK);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadAll(); }, []);

  // Filtro por cliente activo (multi-tenant). Si scope es "todos los clientes",
  // mostramos todo. Si no, solo los mappings cuyos playbook_id pertenezcan al
  // cliente activo.
  const clientFiltered = useMemo(() => {
    if (scopeAllClients || !activeClient) return mappings;
    const allowedPbIds = new Set(activeClient.playbook_ids ?? []);
    if (allowedPbIds.size === 0) return mappings; // sin filtro hasta que aprenda
    return mappings.filter((m) => {
      const pbId = m.id.split("::")[0];
      return allowedPbIds.has(pbId);
    });
  }, [mappings, activeClient, scopeAllClients]);

  const realCount = clientFiltered.filter((m) => m.id !== "demo-1").length;
  const verifiedCount = clientFiltered.filter((m) => m.provenance).length;
  const avgConfidence =
    clientFiltered.length > 0
      ? Math.round(
          (clientFiltered.reduce((s, m) => s + m.confidence, 0) /
            clientFiltered.length) *
            100,
        )
      : 0;

  // Search + destination filter on top of client filter
  const filtered = clientFiltered.filter((m) => {
    const matchSearch =
      !search ||
      m.source_field.toLowerCase().includes(search.toLowerCase()) ||
      m.destination_field.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      activeFilter === "Todos" ||
      m.destination_site.toLowerCase().includes(activeFilter.toLowerCase());
    return matchSearch && matchFilter;
  });

  return (
    <div className="min-h-screen p-8 bg-bg-base">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <p className="font-mono text-[11px] uppercase tracking-widest text-text-tertiary">
              Capa 4 · Knowledge Graph · Capa 6 · Solana Provenance
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
              {activeClient && !scopeAllClients ? (
                <>
                  Memoria de{" "}
                  <span className="text-coral">
                    {activeClient.emoji} {activeClient.brand}
                  </span>
                </>
              ) : (
                "Memoria de Themis"
              )}
            </h1>
            <p className="text-sm text-text-secondary">
              {activeClient && !scopeAllClients
                ? `Mapeos aprendidos para ${activeClient.name} — reutilizables cross-cliente.`
                : "Cada mapeo aprendido se guarda — verificable en Solana, reutilizable cross-cliente."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {activeClient && (
              <button
                type="button"
                onClick={() => setScopeAllClients((v) => !v)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  scopeAllClients
                    ? "bg-white border-border text-text-secondary"
                    : "bg-coral text-white border-coral"
                }`}
              >
                {scopeAllClients
                  ? `Ver todos los clientes (${clients.length})`
                  : `Solo ${activeClient.brand}`}
              </button>
            )}
            <Button onClick={loadAll} disabled={loading} variant="secondary">
              <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refrescar
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Mapeos aprendidos" value={mappings.length} icon={<Brain className="w-5 h-5 text-text-tertiary" />} />
          <StatCard label="Verificados on-chain" value={verifiedCount} highlight icon={
            <svg className="w-5 h-5 text-coral" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          } />
          <StatCard label="Confidence promedio" value={`${avgConfidence}%`} icon={
            <svg className="w-5 h-5 text-status-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
            </svg>
          } />
        </div>

        {/* Backend badge */}
        {status && (
          <div className="flex items-center gap-2">
            <Badge variant={status.backend === "mongodb" ? "success" : "info"}>
              {status.backend}
            </Badge>
            <span className="text-xs text-text-tertiary font-mono">
              {status.count} playbook{status.count !== 1 ? "s" : ""} persistidos
            </span>
            {realCount === 0 && (
              <Badge variant="secondary">mostrando ejemplo · corre /teach</Badge>
            )}
          </div>
        )}

        {error && (
          <Card className="border-status-warning/40 bg-status-warning-bg">
            <CardContent className="p-4 text-xs text-text-secondary">{error}</CardContent>
          </Card>
        )}

        {/* Search + filter row */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar campo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-coral/30"
            />
          </div>
          <div className="flex items-center gap-1.5">
            {FILTER_OPTIONS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={[
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  activeFilter === f
                    ? "bg-[#C8102E] text-white"
                    : "bg-white border border-border text-text-secondary hover:border-coral/50 hover:text-coral",
                ].join(" ")}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Count indicator */}
        {(search || activeFilter !== "Todos") && (
          <p className="text-xs text-text-tertiary font-mono">
            {filtered.length} de {mappings.length} mapeos
          </p>
        )}

        <MemoryGraphView mappings={filtered} />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-mono uppercase tracking-widest text-text-tertiary">{label}</p>
        {icon}
      </div>
      <p className={`text-3xl font-bold tabular-nums ${highlight ? "text-coral" : "text-text-primary"}`}>
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
  try { return new URL(url).hostname; } catch { return url; }
}
