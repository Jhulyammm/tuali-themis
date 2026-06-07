/**
 * GET /api/browser/observe?sessionId=X — toma snapshot del estado actual.
 *
 * STATELESS: attach a la sesión BROWSERBASE vía API, captura snapshot, retorna.
 * El cliente acumula los snapshots en su React state.
 */

import { NextRequest, NextResponse } from "next/server";
import { snapshot } from "@hack4her/agent/browser";
import {
  rateLimit,
  getClientIp,
  badRequest,
  tooManyRequests,
  sanitizedError,
} from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

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

  try {
    const snap = await snapshot(sessionId);
    return NextResponse.json({ sessionId, snapshot: snap });
  } catch (err) {
    const msg = (err as Error).message ?? "";
    // Si la sesión Browserbase expiró/se cerró, retornar 410 (gone) en vez de 500
    if (msg.includes("no longer alive") || msg.includes("not found")) {
      return NextResponse.json(
        { error: "Browserbase session expired", expired: true },
        { status: 410 },
      );
    }
    console.error("[/api/browser/observe]", err);
    return NextResponse.json(sanitizedError(err, "Observe failed"), {
      status: 500,
    });
  }
}
