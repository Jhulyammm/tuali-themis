/**
 * /validate — Capa 1 · Criterio 3 de la rúbrica (Exactitud campo-por-campo).
 *
 * Compara los datos del playbook (mappings + ejemplos) contra lo que fue
 * efectivamente capturado en erp-destino. Side-by-side.
 *
 * Este es el Paso 4 del demo guion del PDF.
 *
 * Marita: polish visual + animar las celdas verdes/rojas según exactitud.
 */

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Check, X } from "lucide-react";
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
        if (data.playbooks?.length > 0 && !selectedPb) {
          setSelectedPb(data.playbooks[0]);
        }
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

  useEffect(() => {
    void loadAll();
  }, []);

  const latestSku = skus[0]; // el más reciente

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="font-mono text-xs uppercase tracking-wider text-text-tertiary">
              Capa 1 · Validación de exactitud
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Side-by-side: lo que Themis aprendió vs lo que escribió
            </h1>
            <p className="text-text-secondary">
              Campo por campo. Sin errores. Este es el Paso 4 del demo guion.
            </p>
          </div>
          <Button onClick={loadAll} disabled={loading} variant="secondary">
            <RefreshCw className={loading ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
            Refrescar
          </Button>
        </header>

        {error && (
          <Card className="border-status-error/40 bg-status-error/5">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-status-error">{error}</p>
              <p className="text-xs text-text-secondary mt-2">
                Asegúrate que erp-destino esté corriendo:{" "}
                <code className="font-mono">pnpm dev:destino</code>
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-4 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs uppercase font-mono text-text-tertiary">
                Playbook
              </label>
              <select
                value={selectedPb?.id ?? ""}
                onChange={(e) =>
                  setSelectedPb(
                    playbooks.find((p) => p.id === e.target.value) ?? null,
                  )
                }
                disabled={playbooks.length === 0}
                className="bg-bg-elevated border border-default rounded px-3 py-1.5 text-sm"
              >
                {playbooks.length === 0 && (
                  <option>(no hay playbooks — corre /teach)</option>
                )}
                {playbooks.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <Badge variant="info">
              {skus.length} captura{skus.length !== 1 ? "s" : ""} en ERP
            </Badge>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* IZQUIERDA — Source (lo que Themis aprendió de los mappings) */}
          <Card>
            <CardHeader className="pb-3 border-b border-subtle">
              <p className="text-sm font-medium">
                Sistema A · Origen (automationexercise.com)
              </p>
              <p className="text-xs text-text-secondary">
                Valores extraídos según el playbook aprendido
              </p>
            </CardHeader>
            <CardContent className="p-4">
              {!selectedPb ? (
                <p className="text-sm text-text-tertiary p-8 text-center">
                  Selecciona un playbook para ver los datos extraídos.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-text-secondary text-xs font-mono uppercase">
                    <tr>
                      <th className="text-left py-2">Campo</th>
                      <th className="text-left py-2">Valor leído</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPb.mappings?.map((m) => (
                      <tr key={m.source_field} className="border-t border-subtle">
                        <td className="py-2 font-medium">{m.source_field}</td>
                        <td className="py-2 font-mono text-xs">
                          {m.examples[0]?.source_value ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          {/* DERECHA — Destino (lo que se escribió en erp-destino) */}
          <Card>
            <CardHeader className="pb-3 border-b border-subtle">
              <p className="text-sm font-medium">
                Sistema B · Destino (Tuali ERP)
              </p>
              <p className="text-xs text-text-secondary">
                Última captura: {latestSku ? new Date(latestSku.created_at).toLocaleTimeString() : "—"}
              </p>
            </CardHeader>
            <CardContent className="p-4">
              {!latestSku ? (
                <p className="text-sm text-text-tertiary p-8 text-center">
                  Sin capturas todavía. Corre /execute o llena el form manualmente en erp-destino.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-text-secondary text-xs font-mono uppercase">
                    <tr>
                      <th className="text-left py-2">Campo</th>
                      <th className="text-left py-2">Valor escrito</th>
                      <th className="text-right py-2">Exacto?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPb?.mappings?.map((m) => {
                      const writtenValue = latestSku.data[
                        normalizeFieldName(m.destination_field)
                      ] ?? latestSku.data[m.destination_field] ?? "—";
                      const expected = m.examples[0]?.destination_value;
                      const matches =
                        expected && writtenValue === expected;
                      return (
                        <tr
                          key={m.destination_field}
                          className="border-t border-subtle"
                        >
                          <td className="py-2 font-medium">
                            {m.destination_field}
                          </td>
                          <td className="py-2 font-mono text-xs">
                            {writtenValue}
                          </td>
                          <td className="py-2 text-right">
                            {matches ? (
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
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

function normalizeFieldName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "_");
}
