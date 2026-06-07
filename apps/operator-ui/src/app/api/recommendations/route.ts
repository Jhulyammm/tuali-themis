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
import {
  rateLimit,
  getClientIp,
  badRequest,
  tooManyRequests,
  sanitizedError,
} from "@/lib/security";

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
  const ip = getClientIp(request);
  if (!rateLimit(`recommend:${ip}`, 20, 60_000)) {
    return tooManyRequests("Demasiadas recomendaciones. Esperá 1 minuto.");
  }

  let body: {
    tendero_id?: unknown;
    zone_id?: unknown;
    historical_baseline?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return badRequest("Invalid JSON");
  }

  if (typeof body.tendero_id !== "string" || body.tendero_id.length > 64) {
    return badRequest("'tendero_id' inválido (string, max 64 chars)");
  }
  if (typeof body.zone_id !== "string" || body.zone_id.length > 64) {
    return badRequest("'zone_id' inválido (string, max 64 chars)");
  }
  if (
    !body.historical_baseline ||
    typeof body.historical_baseline !== "object" ||
    Array.isArray(body.historical_baseline)
  ) {
    return badRequest("'historical_baseline' debe ser objeto");
  }
  const baseline = body.historical_baseline as Record<string, unknown>;
  if (Object.keys(baseline).length > 100) {
    return badRequest("'historical_baseline' max 100 SKUs");
  }
  const cleanBaseline: Record<string, number> = {};
  for (const [k, v] of Object.entries(baseline)) {
    if (typeof v === "number" && isFinite(v)) cleanBaseline[k] = v;
  }

  try {
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
      historical_baseline: cleanBaseline,
    };

    const result = await generateRecommendations(context);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/recommendations]", err);
    return NextResponse.json(
      sanitizedError(err, "Recommendation failed"),
      { status: 500 },
    );
  }
}
