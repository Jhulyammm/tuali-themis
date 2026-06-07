/**
 * /clients — la página que demuestra "Themis es plataforma multi-tenant Tuali".
 *
 * Lista de todos los clientes (OXXO, Soriana, Costco, abarrotes) + onboard de
 * uno nuevo con SOLO una URL. El operador de Tuali pega el catálogo de un
 * nuevo cliente y Themis identifica la marca, crea el cliente, y arranca
 * a aprender.
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Plus,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MapPin,
  Activity,
} from "lucide-react";
import { useActiveClient } from "@/hooks/useActiveClient";
import type { Client } from "@hack4her/playbooks";

interface OnboardResult {
  client: Client;
  detected: {
    title: string;
    hostname: string;
    brand: string;
  };
}

const ONBOARD_EXAMPLES = [
  "https://www.oxxo.com",
  "https://www.soriana.com",
  "https://www.costco.com.mx",
];

export default function ClientsPage() {
  const { clients, activeClient, setActiveClient, refresh } = useActiveClient();
  const [url, setUrl] = useState("");
  const [onboarding, setOnboarding] = useState(false);
  const [result, setResult] = useState<OnboardResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOnboard = async () => {
    if (!url.trim()) return;
    setError(null);
    setResult(null);
    setOnboarding(true);
    try {
      const res = await fetch("/api/clients/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as OnboardResult;
      setResult(data);
      await refresh();
      // Auto-seleccionar el nuevo cliente
      setActiveClient(data.client.id);
      setUrl("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setOnboarding(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-text-tertiary">
            Multi-tenant · plataforma Tuali
          </p>
          <h1 className="text-3xl font-bold text-text-primary mt-1">
            Clientes <span className="text-coral">{clients.length}</span>
          </h1>
          <p className="text-sm text-text-secondary mt-2 max-w-2xl">
            Cada tiendita, OXXO, Costco o cadena tiene su propio espacio en
            Themis. Aprendido una vez, replicado a las miles. Onboard con sólo
            la URL del catálogo del proveedor.
          </p>
        </div>
      </div>

      {/* Onboard panel */}
      <Card className="border-coral/30 bg-gradient-to-br from-coral/5 via-white to-white">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-coral grid place-items-center shadow-md shadow-coral/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-text-primary">
                Onboard con una URL
              </p>
              <p className="text-xs text-text-secondary">
                Themis identifica marca, infiere zona y deja al cliente listo
                para aprender en segundos.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {ONBOARD_EXAMPLES.map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUrl(u)}
                className="text-xs px-2 py-1 rounded bg-bg-elevated border border-border text-text-secondary hover:bg-coral/5 hover:border-coral/40 hover:text-coral transition-colors font-mono"
              >
                {u.replace(/^https?:\/\//, "")}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.cliente-nuevo.com/catalogo"
              disabled={onboarding}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !onboarding && url.trim()) {
                  void handleOnboard();
                }
              }}
              className="flex-1 px-3 py-2.5 rounded-lg border border-border bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral disabled:opacity-50"
            />
            <Button
              onClick={handleOnboard}
              disabled={!url.trim() || onboarding}
              className="bg-coral hover:bg-coral/90 text-white"
            >
              {onboarding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Identificando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Onboard
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-status-error bg-status-error/5 rounded-lg p-3 border border-status-error/20">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 bg-status-success/5 border border-status-success/30 rounded-lg p-3"
              >
                <CheckCircle2 className="w-5 h-5 text-status-success mt-0.5 flex-shrink-0" />
                <div className="flex-1 text-sm">
                  <p className="font-semibold text-text-primary">
                    {result.client.emoji} {result.client.name}{" "}
                    <span className="text-text-tertiary font-normal">
                      onboardeado
                    </span>
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Marca detectada:{" "}
                    <span className="font-mono">{result.detected.brand}</span> ·{" "}
                    {result.detected.hostname}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Clients grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((c) => {
          const isActive = activeClient?.id === c.id;
          return (
            <Card
              key={c.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isActive ? "border-coral/50 ring-2 ring-coral/20" : ""
              }`}
              onClick={() => setActiveClient(c.id)}
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{c.emoji}</span>
                    <div>
                      <p className="font-semibold text-text-primary leading-tight">
                        {c.brand}
                      </p>
                      <p className="text-[11px] text-text-tertiary">
                        {c.name.length > 30
                          ? c.name.slice(0, 30) + "..."
                          : c.name}
                      </p>
                    </div>
                  </div>
                  {isActive && (
                    <Badge className="bg-coral text-white border-0 text-[10px]">
                      Activo
                    </Badge>
                  )}
                  {c.status === "onboarding" && (
                    <Badge className="bg-status-warning/20 text-status-warning border-0 text-[10px]">
                      Onboarding
                    </Badge>
                  )}
                </div>

                <div className="space-y-1.5 pt-3 border-t border-border">
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <MapPin className="w-3 h-3 text-coral" />
                    <span>
                      {c.zone.zone_name} · {c.zone.city}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <Building2 className="w-3 h-3 text-text-tertiary" />
                    <span className="truncate">{c.source_system_name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <Activity className="w-3 h-3 text-text-tertiary" />
                    <span>
                      {c.playbook_ids.length} playbooks ·{" "}
                      {c.total_runs ?? 0} runs
                    </span>
                  </div>
                </div>

                {c.source_system_url && (
                  <a
                    href={c.source_system_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-[10px] text-coral hover:underline font-mono flex items-center gap-1"
                  >
                    <ExternalLink className="w-2.5 h-2.5" />
                    {new URL(c.source_system_url).hostname}
                  </a>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
