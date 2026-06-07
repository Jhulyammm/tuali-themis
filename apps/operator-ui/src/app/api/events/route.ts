/**
 * /api/events — Capa 3 Cognitive Reasoning (eventos REALES).
 *
 * Primario: Gemini + Google Search grounding → eventos reales verificables
 *           con las fuentes (links) que consultó en vivo.
 * Fallback: calendario curado del dataset (data/eventos-mexico.json), filtrado
 *           por zona y fecha. También son datos reales — NUNCA inventados.
 */

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  deepResearch,
  filterRelevantEvents,
} from "@hack4her/agent/cognitive";
import type { ContextualEvent, ZoneContext } from "@hack4her/playbooks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EventosDataset = {
  liga_mx_jornadas_2026: ContextualEvent[];
  fechas_universitarias_2026: ContextualEvent[];
  fechas_comerciales_2026: ContextualEvent[];
};

type ZonasDataset = {
  zonas: ZoneContext[];
};

let cachedEventos: EventosDataset | null = null;
let cachedZonas: ZonasDataset | null = null;

async function loadDatasets() {
  if (!cachedZonas) {
    const raw = await fs.readFile(
      path.join(process.cwd(), "..", "..", "data", "zonas-tiendas.json"),
      "utf-8",
    );
    cachedZonas = JSON.parse(raw) as ZonasDataset;
  }
  if (!cachedEventos) {
    const raw = await fs.readFile(
      path.join(process.cwd(), "..", "..", "data", "eventos-mexico.json"),
      "utf-8",
    );
    cachedEventos = JSON.parse(raw) as EventosDataset;
  }
  return { zonas: cachedZonas, eventos: cachedEventos };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      zone?: ZoneContext;
      zone_id?: string;
      within_days?: number;
    };
    const withinDays = body.within_days ?? 21;

    const { zonas, eventos } = await loadDatasets();

    // La sucursal puede llegar con su ubicación completa (API/URL externa) o,
    // por compatibilidad, con un zone_id conocido del dataset.
    let zone: ZoneContext | undefined = body.zone;
    if (!zone && body.zone_id) {
      zone = zonas.zonas.find((z) => z.zone_id === body.zone_id);
    }
    if (!zone) {
      return NextResponse.json(
        { error: "Se requiere 'zone' (ubicación de la sucursal) o 'zone_id'." },
        { status: 400 },
      );
    }

    // Primario: Deep Research en vivo vía Gemini + Google Search grounding.
    try {
      const live = await deepResearch(zone, withinDays);
      return NextResponse.json({
        zone,
        events: live.events,
        seasonal_context: live.seasonal_context,
        sources: live.sources,
        search_queries: live.search_queries,
        source_type: "live",
        generated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn(
        "[/api/events] Deep Research falló, usando calendario curado:",
        (err as Error).message.slice(0, 140),
      );
    }

    // Fallback: calendario curado real del dataset, filtrado por zona y fecha.
    const allEvents: ContextualEvent[] = [
      ...eventos.liga_mx_jornadas_2026,
      ...eventos.fechas_universitarias_2026,
      ...eventos.fechas_comerciales_2026,
    ];
    const curated = filterRelevantEvents(allEvents, zone.zone_id, withinDays);

    return NextResponse.json({
      zone,
      events: curated,
      seasonal_context: "",
      sources: [],
      search_queries: [],
      source_type: "calendar",
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[/api/events]", err);
    return NextResponse.json(
      { error: (err as Error).message || "Events generation failed" },
      { status: 500 },
    );
  }
}
