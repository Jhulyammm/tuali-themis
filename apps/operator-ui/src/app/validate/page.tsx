"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SolanaBadge } from "@/components/SolanaBadge";
import { RefreshCw, Check, X, ShieldCheck } from "lucide-react";
import type { Playbook } from "@hack4her/playbooks";

interface SkuRecord {
  id: string;
  created_at: string;
  data: Record<string, string>;
}

export default function ValidatePage() {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [selectedPb, setSelectedPb] = useState<Playbook | null>(null);
  const [skus, setSkus] = useState<SkuRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pbRes, skusRes] = await Promise.all([
        fetch("/api/playbooks"),
        fetch("/api/erp-destino/skus"),
      ]);
      if (pbRes.ok) {
        const data = (await pbRes.json()) as { playbooks: Playbook[] };
        setPlaybooks(data.playbooks ?? []);
        if (data.playbooks?.length > 0 && !selectedPb) setSelectedPb(data.playbooks[0]);
      }
      if (skusRes.ok) {
        const data = (await skusRes.json()) as { skus: SkuRecord[] };
        setSkus(data.skus ?? []);
      } else {
        const err = (await skusRes.json()) as { error?: string };
        setError(err.error ?? `erp-destino: ${skusRes.status}`);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadAll(); }, []);

  const latestSku = skus[0];

  // Compute match score — defensivo contra mappings sin examples/destination_field
  const matches = (selectedPb?.mappings ?? [])
    .filter((m) => m && typeof m.destination_field === "string")
    .map((m) => {
      const data = latestSku?.data ?? {};
      const written =
        data[normalizeFieldName(m.destination_field)] ??
        data[m.destination_field] ??
        null;
      const expected = m.examples?.[0]?.destination_value ?? null;
      return expected !== null && written !== null && written === expected;
    });
  const matchCount = matches.filter(Boolean).length;
  const totalCount = matches.length;
  const accuracy = totalCount > 0 ? Math.round((matchCount / totalCount) * 100) : null;

  return (
    <div className="min-h-screen p-8 bg-bg-base">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="font-mono text-[11px] uppercase tracking-widest text-text-tertiary">
              Criterio 3 · Exactitud campo por campo
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
              Lo que Themis aprendió vs lo que escribió
            </h1>
            <p className="text-sm text-text-secondary">
              Side-by-side · origen vs destino. Paso 4 del guion de demo.
            </p>
          </div>
          <Button onClick={loadAll} disabled={loading} variant="secondary">
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refrescar
          </Button>
        </div>

        {/* Solana shield card */}
        {selectedPb?.provenance && (
          <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(to bottom, #19161f, #0b0a0e)" }}>
            <div className="flex flex-col items-center py-8 px-6 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "linear-gradient(135deg, #9945FF, #14F195)" }}
              >
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <p className="text-white text-lg font-semibold">Verificado en Solana ✓</p>
              <p className="text-white/50 text-xs font-mono mt-1 mb-4">
                {selectedPb.provenance.tx_signature?.slice(0, 16)}...{selectedPb.provenance.tx_signature?.slice(-8)}
              </p>
              <SolanaBadge provenance={selectedPb.provenance} size="md" />
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-status-error/40 bg-red-50 p-4">
            <p className="text-sm font-semibold text-status-error">{error}</p>
            <p className="text-xs text-text-secondary mt-1">
              Asegúrate que erp-destino esté corriendo:{" "}
              <code className="font-mono bg-white px-1 rounded">pnpm dev:destino</code>
            </p>
          </div>
        )}

        {/* Playbook selector */}
        <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-4 flex-wrap shadow-sm">
          <div className="flex items-center gap-2">
            <label className="text-xs uppercase font-mono tracking-widest text-text-tertiary">Playbook</label>
            <select
              value={selectedPb?.id ?? ""}
              onChange={(e) => setSelectedPb(playbooks.find((p) => p.id === e.target.value) ?? null)}
              disabled={playbooks.length === 0}
              className="bg-bg-elevated border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-coral/30"
            >
              {playbooks.length === 0 && <option>No hay playbooks · corre /teach</option>}
              {playbooks.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <Badge variant="info">{skus.length} captura{skus.length !== 1 ? "s" : ""} en ERP</Badge>

          {/* Accuracy score */}
          {accuracy !== null && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-text-tertiary font-mono">Exactitud:</span>
              <span className={`text-lg font-bold tabular-nums ${accuracy === 100 ? "text-status-success" : "text-status-warning"}`}>
                {accuracy}%
              </span>
              <span className="text-xs text-text-tertiary font-mono">({matchCount}/{totalCount} campos)</span>
            </div>
          )}
        </div>

        {/* Side-by-side tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left — Source */}
          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <p className="text-sm font-semibold text-text-primary">Sistema A · Origen</p>
              <p className="text-xs text-text-secondary mt-0.5">automationexercise.com · valores extraídos</p>
            </div>
            <div className="p-0">
              {!selectedPb ? (
                <p className="text-sm text-text-tertiary p-8 text-center">Selecciona un playbook.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-bg-elevated">
                    <tr className="text-[10px] font-mono uppercase tracking-widest text-text-tertiary">
                      <th className="text-left px-5 py-3 font-medium">Campo</th>
                      <th className="text-left px-5 py-3 font-medium">Valor leído</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedPb.mappings ?? [])
                      .filter((m) => m && typeof m.source_field === "string")
                      .map((m, i) => (
                        <tr key={`${m.source_field}-${i}`} className="border-t border-border hover:bg-bg-elevated/50 transition-colors">
                          <td className="px-5 py-3 font-medium text-text-primary">{m.source_field}</td>
                          <td className="px-5 py-3 font-mono text-xs text-text-secondary">
                            {m.examples?.[0]?.source_value ?? "—"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Right — Destination */}
          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <p className="text-sm font-semibold text-text-primary">Sistema B · Destino (Tuali ERP)</p>
              <p className="text-xs text-text-secondary mt-0.5">
                Última captura: {latestSku ? new Date(latestSku.created_at).toLocaleTimeString() : "—"}
              </p>
            </div>
            <div className="p-0">
              {!latestSku ? (
                <p className="text-sm text-text-tertiary p-8 text-center">
                  Sin capturas. Corre /execute o llena el form en erp-destino.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-bg-elevated">
                    <tr className="text-[10px] font-mono uppercase tracking-widest text-text-tertiary">
                      <th className="text-left px-5 py-3 font-medium">Campo</th>
                      <th className="text-left px-5 py-3 font-medium">Valor escrito</th>
                      <th className="text-center px-5 py-3 font-medium">Exacto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedPb?.mappings ?? [])
                      .filter((m) => m && typeof m.destination_field === "string")
                      .map((m, idx) => {
                        const data = latestSku.data ?? {};
                        const writtenValue =
                          data[normalizeFieldName(m.destination_field)] ??
                          data[m.destination_field] ??
                          "—";
                        const expected = m.examples?.[0]?.destination_value;
                        const isMatch = expected && writtenValue === expected;
                        return (
                          <tr
                            key={`${m.destination_field}-${idx}`}
                            className={[
                              "border-t border-border transition-colors",
                              matches[idx] === true ? "bg-status-success-bg" : matches[idx] === false ? "bg-red-50" : "",
                            ].join(" ")}
                          >
                            <td className="px-5 py-3 font-medium text-text-primary">{m.destination_field}</td>
                            <td className="px-5 py-3 font-mono text-xs text-text-secondary">{writtenValue}</td>
                            <td className="px-5 py-3 text-center">
                              {isMatch ? (
                                <Check className="w-4 h-4 text-status-success inline" />
                              ) : (
                                <X className="w-4 h-4 text-status-error inline" />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function normalizeFieldName(name: string): string {
  return name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "_");
}
