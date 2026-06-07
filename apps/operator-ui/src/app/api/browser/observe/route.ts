/**
 * GET /api/browser/observe?sessionId=X — toma snapshot del estado actual.
 *
 * El cliente hace polling cada ~1.5s mientras el operador interactúa con
 * el iframe Browserbase. Cada snapshot registra URL, título y un resumen
 * de elementos observados (page.observe()), que después se pasa a Claude
 * para reconstruir steps + mappings.
 *
 * Returns: { snapshot, totalSnapshots, sessionId }
 *
 * Seguridad:
 *  - sessionId pattern-validated (anti path traversal / injection)
 *  - rate limit per-IP (polling normal: 40/min = 1.5s; tope 90 = espacio para multi-pestaña)
 */

import { NextRequest, NextResponse } from "next/server";
import { snapshot, getHandle } from "@hack4her/agent/browser";
import {
  rateLimit,
  getClientIp,
  badRequest,
  tooManyRequests,
  sanitizedError,
} from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  if (!rateLimit(`observe:${ip}`, 90, 60_000)) {
    return tooManyRequests("Demasiados polls. Esperá unos segundos.");
  }

  const sessionId = request.nextUrl.searchParams.get("sessionId");
  if (!sessionId || !SESSION_ID_PATTERN.test(sessionId)) {
    return badRequest("'sessionId' inválido");
  }

  const handle = getHandle(sessionId);
  if (!handle) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  try {
    const snap = await snapshot(sessionId);
    return NextResponse.json({
      sessionId,
      snapshot: snap,
      totalSnapshots: handle.snapshots.length,
    });
  } catch (err) {
    console.error("[/api/browser/observe]", err);
    return NextResponse.json(sanitizedError(err, "Observe failed"), {
      status: 500,
    });
  }
}
