/**
 * /api/recommendations — Capa 3 Cognitive Reasoning.
 *
 * Import directo del módulo cognitive para evitar cargar Stagehand
 * (el barrel @hack4her/agent lo importa transitivamente).
 */

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  generateRecommendations,
  filterRelevantEvents,
} from "@hack4her/agent/cognitive";
import type {
  ContextualEvent,
  RecommendationContext,
  ZoneContext,
} from "@hack4her/playbooks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EventosDataset = {
  liga_mx_jornadas_2026: ContextualEvent[];
  fechas_universitarias_2026: ContextualEvent[];
  fechas_comerciales_2026: ContextualEvent[];
};

type ZonasDataset = {
  zonas: ZoneContext[];
  tiendas_mock: Array<{
    id: string;
    nombre: string;
    tipo: string;
    ciudad: string;
    zona_id: string;
  }>;
};

let cachedEventos: EventosDataset | null = null;
let cachedZonas: ZonasDataset | null = null;

async function loadDatasets() {
  if (!cachedEventos) {
    const raw = await fs.readFile(
      path.join(process.cwd(), "..", "..", "data", "eventos-mexico.json"),
      "utf-8",
    );
    cachedEventos = JSON.parse(raw) as EventosDataset;
  }
  if (!cachedZonas) {
    const raw = await fs.readFile(
      path.join(process.cwd(), "..", "..", "data", "zonas-tiendas.json"),
      "utf-8",
    );
    cachedZonas = JSON.parse(raw) as ZonasDataset;
  }
  return { eventos: cachedEventos, zonas: cachedZonas };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      tendero_id: string;
      zone_id: string;
      historical_baseline: Record<string, number>;
    };

    const { eventos, zonas } = await loadDatasets();
    const zone = zonas.zonas.find((z) => z.zone_id === body.zone_id);
    if (!zone) {
      return NextResponse.json({ error: "Zone not found" }, { status: 404 });
    }

    const allEvents: ContextualEvent[] = [
      ...eventos.liga_mx_jornadas_2026,
      ...eventos.fechas_universitarias_2026,
      ...eventos.fechas_comerciales_2026,
    ];

    const upcoming = filterRelevantEvents(allEvents, body.zone_id, 30);

    const context: RecommendationContext = {
      tendero_id: body.tendero_id,
      zone,
      upcoming_events: upcoming,
      historical_baseline: body.historical_baseline,
    };

    const result = await generateRecommendations(context);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/recommendations]", err);
    return NextResponse.json(
      { error: (err as Error).message || "Recommendation failed" },
      { status: 500 },
    );
  }
}
