/**
 * /recommendations — Demo page de la Capa 3.
 *
 * Muestra el RecommendationsPanel funcional, jalando data del endpoint
 * real de Gemini. Marita: aplica polish visual aquí siguiendo mockup #3.
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { RecommendationsPanel } from "@/components/RecommendationsPanel";
import { useRecommendations } from "@/hooks/useRecommendations";
import type { ZoneContext, ContextualEvent } from "@hack4her/playbooks";

// Mock zone para el demo. En producción viene del MongoDB knowledge graph (Capa 4).
const MOCK_ZONE: ZoneContext = {
  zone_id: "Monterrey-Norte",
  zone_name: "Monterrey Zona Norte (Tec)",
  city: "Monterrey",
  profile: "universitaria",
  nearby_institutions: ["Tec de Monterrey Campus Monterrey"],
};

const MOCK_EVENT: ContextualEvent = {
  event_id: "lmx-clasico-regio-2026-06",
  name: "Clásico Regio (Tigres vs Rayados)",
  type: "futbol",
  date: "2026-06-13",
  impact_zones: ["Monterrey-Norte"],
  expected_impact: "+30-40% cerveza nacional",
};

// Mock SKU baseline
const MOCK_BASELINE: Record<string, number> = {
  "Indio 355ml": 100,
  "Tecate Light 355ml": 80,
  "Coca 600ml": 200,
  "Sabritas Original 150g": 60,
  "Gatorade Naranja 600ml": 40,
};

export default function RecommendationsPage() {
  const { fetch, response, loading, error } = useRecommendations();
  const [applied, setApplied] = useState(false);

  const handleGenerate = async () => {
    await fetch({
      tendero_id: "OXXO-TEC-SUR-001",
      zone_id: MOCK_ZONE.zone_id,
      historical_baseline: MOCK_BASELINE,
    });
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-wider text-text-tertiary">
            Capa 3 · Cognitive Reasoning · Gemini Pro
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Demo · Recomendaciones contextuales
          </h1>
          <p className="text-text-secondary">
            Themis observa tienda + evento + histórico y genera ajustes de pedido razonados.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <p className="text-sm font-medium">Contexto del demo</p>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-text-tertiary font-mono uppercase">Tienda</p>
                <p>{MOCK_ZONE.zone_name}</p>
                <p className="text-xs text-text-secondary">
                  {MOCK_ZONE.city} · Perfil {MOCK_ZONE.profile}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-tertiary font-mono uppercase">Próximo evento</p>
                <p>{MOCK_EVENT.name}</p>
                <p className="text-xs text-text-secondary">{MOCK_EVENT.date}</p>
              </div>
              <div>
                <p className="text-xs text-text-tertiary font-mono uppercase">Baseline</p>
                <ul className="font-mono text-xs space-y-0.5">
                  {Object.entries(MOCK_BASELINE).map(([sku, q]) => (
                    <li key={sku} className="flex justify-between">
                      <span className="truncate">{sku}</span>
                      <span className="tabular-nums">{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Razonando..." : "Generar recomendaciones"}
              </Button>
              {error && <p className="text-xs text-status-error">{error}</p>}
            </CardContent>
          </Card>

          <div className="lg:col-span-2">
            <RecommendationsPanel
              zone={MOCK_ZONE}
              primaryEvent={MOCK_EVENT}
              response={response}
              loading={loading}
              onAccept={() => setApplied(true)}
              onReject={() => setApplied(false)}
            />
            {applied && (
              <p className="mt-4 text-sm text-status-success">
                ✓ Recomendaciones aplicadas al pedido
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
