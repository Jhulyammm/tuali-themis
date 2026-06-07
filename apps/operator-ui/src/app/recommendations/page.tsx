"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles, Zap, Globe, ExternalLink, MapPin, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecommendationsPanel } from "@/components/RecommendationsPanel";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useContextualEvents } from "@/hooks/useContextualEvents";
import type { ZoneContext } from "@hack4her/playbooks";

// ============================================================
// Contrato de entrada de la sucursal del cliente (vía API/URL).
//
// La información de la sucursal NO es del operador de Themis: llega desde el
// sistema del cliente como query params, p.ej.:
//   /recommendations?sucursal_id=ABA-001&nombre=Abarrotes Don Beto
//     &tipo=Abarrotes&ciudad=Monterrey&zona=Colonia Obrera&perfil=familiar
//     &referencia=Mercado Juárez
// ============================================================

interface Sucursal {
  id: string;
  nombre: string;
  tipo: string;
  referencia?: string;
  zone: ZoneContext;
}

const VALID_PROFILES: ZoneContext["profile"][] = [
  "universitaria",
  "familiar",
  "comercial",
  "industrial",
  "turistica",
];

function parseSucursal(sp: URLSearchParams): Sucursal | null {
  const nombre = sp.get("nombre")?.trim();
  const ciudad = sp.get("ciudad")?.trim();
  const zona = sp.get("zona")?.trim();
  // Mínimo necesario para ubicar la sucursal y poder investigar su contexto.
  if (!nombre || !ciudad || !zona) return null;

  const perfilRaw = (sp.get("perfil")?.trim() || "comercial").toLowerCase();
  const profile = (
    VALID_PROFILES.includes(perfilRaw as ZoneContext["profile"])
      ? perfilRaw
      : "comercial"
  ) as ZoneContext["profile"];

  const referencia = sp.get("referencia")?.trim() || undefined;
  const id = sp.get("sucursal_id")?.trim() || sp.get("id")?.trim() || nombre;
  const zoneId = sp.get("zone_id")?.trim() || zona;

  return {
    id,
    nombre,
    tipo: sp.get("tipo")?.trim() || "Tienda",
    referencia,
    zone: {
      zone_id: zoneId,
      zone_name: zona,
      city: ciudad,
      profile,
      nearby_institutions: referencia ? [referencia] : [],
    },
  };
}

/**
 * LAST BASELINE — el último pedido enviado a la sucursal, recibido del cliente
 * (API/URL). Formatos aceptados en el param `baseline`:
 *   - JSON:    baseline={"Indio 355ml":100,"Coca 600ml":200}
 *   - Compacto: baseline=Indio 355ml:100;Coca 600ml:200;Sabritas 150g:60
 */
function parseBaseline(sp: URLSearchParams): Record<string, number> {
  const raw = sp.get("baseline")?.trim();
  if (!raw) return {};

  // 1) intenta JSON
  try {
    const j = JSON.parse(raw);
    if (j && typeof j === "object" && !Array.isArray(j)) {
      const out: Record<string, number> = {};
      for (const [k, v] of Object.entries(j)) {
        const n = Number(v);
        if (k && !Number.isNaN(n)) out[k] = n;
      }
      if (Object.keys(out).length > 0) return out;
    }
  } catch {
    // no era JSON, intenta formato compacto
  }

  // 2) formato compacto "sku:qty" separado por ; o ,
  const out: Record<string, number> = {};
  for (const pair of raw.split(/[;,]/)) {
    const idx = pair.lastIndexOf(":");
    if (idx === -1) continue;
    const sku = pair.slice(0, idx).trim();
    const n = Number(pair.slice(idx + 1).trim());
    if (sku && !Number.isNaN(n)) out[sku] = n;
  }
  return out;
}

const PLACEHOLDER_ZONE: ZoneContext = {
  zone_id: "",
  zone_name: "—",
  city: "—",
  profile: "comercial",
  nearby_institutions: [],
};

// Sucursales demo precargadas. URL params = contrato real del cliente Tuali.
// El baseline es opcional pero rico para que Themis razone con histórico.
const DEMO_SUCURSALES = [
  {
    label: "Abarrotes Don Beto",
    hint: "Mty · familiar",
    params: new URLSearchParams({
      sucursal_id: "ABA-001",
      nombre: "Abarrotes Don Beto",
      tipo: "Abarrotes",
      ciudad: "Monterrey",
      zona: "Colonia Obrera",
      perfil: "familiar",
      referencia: "Mercado Juárez",
      baseline:
        "Coca-Cola 600ml:120;Topo Chico 600ml:80;Powerade 500ml:30;Sabritas 150g:60",
    }).toString(),
  },
  {
    label: "OXXO Tec",
    hint: "Mty · universitaria",
    params: new URLSearchParams({
      sucursal_id: "OXX-2841",
      nombre: "OXXO Tec de Monterrey",
      tipo: "Tienda de conveniencia",
      ciudad: "Monterrey",
      zona: "Tecnológico",
      perfil: "universitaria",
      referencia: "Tec de Monterrey Campus MTY",
      baseline:
        "Coca-Cola 600ml:240;Powerade 500ml:90;Topo Chico Twist Limón:60;Ciel 1L:180",
    }).toString(),
  },
  {
    label: "Misceláneas García",
    hint: "Cdmx · turística",
    params: new URLSearchParams({
      sucursal_id: "MIS-018",
      nombre: "Misceláneas García",
      tipo: "Miscelánea",
      ciudad: "Ciudad de México",
      zona: "Centro Histórico",
      perfil: "turistica",
      referencia: "Zócalo CDMX",
      baseline: "Coca-Cola 355ml:300;Ciel 600ml:200;Powerade 500ml:50",
    }).toString(),
  },
];

function RecommendationsView() {
  const searchParams = useSearchParams();
  const sucursal = useMemo(
    () => parseSucursal(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );
  // Último pedido enviado a la sucursal (recibido del cliente vía API/URL).
  const lastBaseline = useMemo(
    () => parseBaseline(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );
  const hasBaseline = Object.keys(lastBaseline).length > 0;

  const { fetch, response, loading, error } = useRecommendations();
  const {
    fetch: fetchEvents,
    events,
    seasonalContext,
    sources,
    sourceType,
    loading: eventsLoading,
    error: eventsError,
  } = useContextualEvents();
  const [applied, setApplied] = useState(false);

  // Genera Deep Research + recomendaciones para la UBICACIÓN de la sucursal
  // recibida. Solo se dispara al presionar el botón.
  const handleGenerate = useCallback(async () => {
    if (!sucursal) return;
    const ev = await fetchEvents({ zone: sucursal.zone, within_days: 21 });
    await fetch({
      tendero_id: sucursal.id,
      zone: sucursal.zone,
      historical_baseline: lastBaseline,
      upcoming_events: ev?.events ?? [],
      seasonal_context: ev?.seasonal_context ?? "",
    });
  }, [fetch, fetchEvents, sucursal, lastBaseline]);

  const primaryEvent = events[0];
  const busy = loading || eventsLoading;

  return (
    <div className="min-h-screen p-8 bg-bg-base">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <p className="font-mono text-[11px] uppercase tracking-widest text-text-tertiary">
              Capa 3 · Cognitive Reasoning · Gemini Pro
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
              Recomendaciones contextuales
            </h1>
            <p className="text-sm text-text-secondary max-w-lg">
              Themis recibe los datos de una sucursal, investiga su contexto real
              (Deep Research) y genera ajustes de surtido con razonamiento visible.
            </p>
          </div>
        </div>

        {/* Quick-load demo: sucursales sample para que el jurado pruebe sin tipear */}
        {!sucursal && (
          <div className="bg-coral/5 border border-coral/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-coral" />
              <p className="text-sm font-semibold text-text-primary">
                Sucursales demo
              </p>
              <span className="text-[10px] font-mono uppercase tracking-widest text-text-tertiary">
                cargá una con 1 click
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {DEMO_SUCURSALES.map((d) => (
                <a
                  key={d.label}
                  href={`/recommendations?${d.params}`}
                  className="text-xs px-3 py-2 rounded-lg bg-white border border-border hover:border-coral hover:bg-coral/5 hover:text-coral transition-colors"
                >
                  <span className="font-semibold">{d.label}</span>
                  <span className="text-text-tertiary ml-1">· {d.hint}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Context sidebar */}
          <div className="lg:col-span-1 space-y-4">

            {/* Store / sucursal context card */}
            <div className="bg-white rounded-xl border border-border p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-mono uppercase tracking-widest text-text-tertiary">
                  Sucursal
                </p>
                <span className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider text-text-tertiary">
                  <Store className="w-2.5 h-2.5" />
                  Cliente
                </span>
              </div>

              {sucursal ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-text-primary leading-snug">
                      {sucursal.nombre}
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {sucursal.tipo}
                    </p>
                  </div>

                  {/* Ubicación de la sucursal (del negocio, no del operador) */}
                  <div className="flex items-start gap-2 pt-2 border-t border-border">
                    <MapPin className="w-4 h-4 text-coral flex-shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-text-primary">
                        {sucursal.zone.zone_name}
                      </p>
                      <p className="text-[11px] text-text-secondary">
                        {sucursal.zone.city} · Perfil {sucursal.zone.profile}
                      </p>
                      {sucursal.referencia && (
                        <p className="text-[10px] text-text-tertiary font-mono">
                          Ref: {sucursal.referencia}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-2 space-y-2">
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Esperando información de la sucursal.
                  </p>
                  <p className="text-[10px] text-text-tertiary leading-relaxed font-mono">
                    Recíbela por URL/API con: nombre, tipo, ciudad, zona, perfil,
                    referencia.
                  </p>
                </div>
              )}
            </div>

            {/* Event context card — Deep Research */}
            <div className="bg-white rounded-xl border border-border p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-mono uppercase tracking-widest text-text-tertiary">
                  Próximos eventos
                </p>
                {sourceType === "calendar" ? (
                  <span className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider text-text-tertiary">
                    <Sparkles className="w-2.5 h-2.5" />
                    Calendario
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider text-coral">
                    <Globe className="w-2.5 h-2.5" />
                    Deep Research
                  </span>
                )}
              </div>

              {eventsLoading && events.length === 0 && (
                <div className="space-y-2 animate-pulse">
                  {[0, 1].map((i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="h-3.5 w-3/4 bg-bg-elevated rounded" />
                      <div className="h-2.5 w-1/3 bg-bg-elevated rounded" />
                      <div className="h-2.5 w-full bg-bg-elevated rounded" />
                    </div>
                  ))}
                </div>
              )}

              {!eventsLoading && events.length === 0 && (
                <p className="text-xs text-text-tertiary italic">
                  {eventsError
                    ? "No se pudieron generar eventos."
                    : sucursal
                      ? "Presiona «Generar» para buscar eventos reales."
                      : "Recibe una sucursal para investigar su contexto."}
                </p>
              )}

              <div className="space-y-3">
                {events.map((evt) => (
                  <div key={evt.event_id} className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-status-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-text-primary leading-snug">
                        {evt.name}
                      </p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {evt.date}
                      </p>
                      <p className="text-[10px] text-status-warning font-mono mt-1 leading-relaxed">
                        {evt.expected_impact}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Fuentes verificables (prueba de grounding en vivo) */}
              {sources.length > 0 && (
                <div className="pt-3 border-t border-border space-y-1.5">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-text-tertiary">
                    Fuentes · verificado en vivo
                  </p>
                  {sources.slice(0, 4).map((s) => (
                    <a
                      key={s.uri}
                      href={s.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[10px] text-text-secondary hover:text-coral transition-colors group"
                    >
                      <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                      <span className="truncate group-hover:underline">
                        {s.title}
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Seasonal context card (Deep Research) */}
            {seasonalContext && (
              <div className="bg-white rounded-xl border border-border p-4 shadow-sm space-y-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-text-tertiary">
                  Contexto estacional
                </p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {seasonalContext}
                </p>
              </div>
            )}

            {/* Last baseline card — último pedido enviado (recibido del cliente) */}
            <div className="bg-white rounded-xl border border-border p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-mono uppercase tracking-widest text-text-tertiary">
                  Last baseline
                </p>
                <span className="text-[9px] font-mono uppercase tracking-wider text-text-tertiary">
                  Último pedido
                </span>
              </div>

              {hasBaseline ? (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-text-tertiary font-mono">
                      <th className="text-left font-medium pb-1">SKU</th>
                      <th className="text-right font-medium pb-1">Uds</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {Object.entries(lastBaseline).map(([sku, q]) => (
                      <tr key={sku}>
                        <td className="py-1 text-text-secondary truncate max-w-[100px]">{sku}</td>
                        <td className="py-1 text-right font-mono tabular-nums text-text-primary font-medium">
                          {q}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-xs text-text-tertiary italic">
                  Esperando el último pedido del cliente.
                </p>
              )}
            </div>

            {/* CTA */}
            <Button
              onClick={handleGenerate}
              disabled={busy || !sucursal}
              className="w-full bg-[#C8102E] hover:bg-[#B40D28] text-white border-0 font-semibold py-3 h-auto disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {!sucursal
                ? "Esperando sucursal..."
                : eventsLoading
                  ? "Buscando eventos reales..."
                  : loading
                    ? "Razonando con Gemini..."
                    : "Generar eventos y recomendaciones"}
            </Button>

            {(error || eventsError) && (
              <p className="text-xs text-status-error bg-red-50 rounded-lg p-3 leading-relaxed">
                {error ?? eventsError}
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
              zone={sucursal?.zone ?? PLACEHOLDER_ZONE}
              primaryEvent={primaryEvent}
              response={response}
              loading={busy}
              onAccept={() => setApplied(true)}
              onReject={() => setApplied(false)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RecommendationsPage() {
  return (
    <Suspense fallback={null}>
      <RecommendationsView />
    </Suspense>
  );
}
