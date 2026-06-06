"use client";

import { useState } from "react";
import { Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecommendationsPanel } from "@/components/RecommendationsPanel";
import { useRecommendations } from "@/hooks/useRecommendations";
import type { ZoneContext, ContextualEvent } from "@hack4her/playbooks";

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
    <div className="min-h-screen p-8 bg-bg-base">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="font-mono text-[11px] uppercase tracking-widest text-text-tertiary">
              Capa 3 · Cognitive Reasoning · Gemini Pro
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
              Recomendaciones contextuales
            </h1>
            <p className="text-sm text-text-secondary max-w-lg">
              Themis analiza tienda + evento + histórico y genera ajustes de pedido con razonamiento visible.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Context sidebar */}
          <div className="lg:col-span-1 space-y-4">

            {/* Store context card */}
            <div className="bg-white rounded-xl border border-border p-4 shadow-sm space-y-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-tertiary">
                Tienda
              </p>
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  OXXO Tec Sur
                </p>
                <p className="text-xs text-text-secondary mt-0.5">
                  {MOCK_ZONE.city} · Perfil {MOCK_ZONE.profile}
                </p>
              </div>
            </div>

            {/* Event context card */}
            <div className="bg-white rounded-xl border border-border p-4 shadow-sm space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-tertiary">
                Próximo evento
              </p>
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-status-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-text-primary leading-snug">
                    {MOCK_EVENT.name}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {MOCK_EVENT.date}
                  </p>
                  <p className="text-[10px] text-status-warning font-mono mt-1">
                    {MOCK_EVENT.expected_impact}
                  </p>
                </div>
              </div>
            </div>

            {/* Baseline card */}
            <div className="bg-white rounded-xl border border-border p-4 shadow-sm space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-tertiary">
                Baseline actual
              </p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-text-tertiary font-mono">
                    <th className="text-left font-medium pb-1">SKU</th>
                    <th className="text-right font-medium pb-1">Uds</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {Object.entries(MOCK_BASELINE).map(([sku, q]) => (
                    <tr key={sku}>
                      <td className="py-1 text-text-secondary truncate max-w-[100px]">{sku}</td>
                      <td className="py-1 text-right font-mono tabular-nums text-text-primary font-medium">
                        {q}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* CTA */}
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-[#C8102E] hover:bg-[#B40D28] text-white border-0 font-semibold py-3 h-auto"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {loading ? "Razonando con Gemini..." : "Generar recomendaciones"}
            </Button>

            {error && (
              <p className="text-xs text-status-error bg-red-50 rounded-lg p-3 leading-relaxed">
                {error}
              </p>
            )}

            {applied && (
              <div className="flex items-center gap-2 text-xs text-status-success bg-status-success-bg rounded-lg p-3 font-medium">
                ✓ Recomendaciones aplicadas al pedido
              </div>
            )}
          </div>

          {/* Recommendations panel */}
          <div className="lg:col-span-3">
            <RecommendationsPanel
              zone={MOCK_ZONE}
              primaryEvent={MOCK_EVENT}
              response={response}
              loading={loading}
              onAccept={() => setApplied(true)}
              onReject={() => setApplied(false)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
