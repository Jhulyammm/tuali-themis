/**
 * GET /api/browser/observe?sessionId=X — heartbeat ligero.
 *
 * NO usa Stagehand attach. Solo verifica el estado de la sesión vía REST
 * de Browserbase. Esto es porque cada attach/detach de Stagehand cierra
 * la sesión en serverless (incluso con keepAlive=true) y el siguiente
 * attach falla con "session is not running".
 *
 * El cliente NO depende de esta route para el demo — el polling de
 * snapshots reales se eliminó. Esta route queda como kill-switch del UI
 * por si Browserbase muere la sesión completamente.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  rateLimit,
  getClientIp,
  badRequest,
  tooManyRequests,
} from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  if (!rateLimit(`observe:${ip}`, 120, 60_000)) {
    return tooManyRequests("Demasiados polls. Esperá unos segundos.");
  }

  const sessionId = request.nextUrl.searchParams.get("sessionId");
  if (!sessionId || !SESSION_ID_PATTERN.test(sessionId)) {
    return badRequest("'sessionId' inválido");
  }

  const apiKey = process.env.BROWSERBASE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing BROWSERBASE_API_KEY" },
      { status: 500 },
    );
  }

  try {
    const res = await fetch(
      `https://api.browserbase.com/v1/sessions/${sessionId}`,
      { headers: { "x-bb-api-key": apiKey } },
    );
    if (!res.ok) {
      // Si no responde, asumimos transient — el cliente reintenta
      return NextResponse.json({ ok: true, status: "unknown" });
    }
    const data = (await res.json()) as { status?: string };
    // RUNNING / PENDING / PROXY_BUFFER = todavía utilizable
    // COMPLETED / TIMED_OUT / ERROR = muerta
    const aliveStatuses = ["RUNNING", "PENDING", "PROXY_BUFFER"];
    if (data.status && !aliveStatuses.includes(data.status)) {
      return NextResponse.json(
        { ok: false, status: data.status, expired: true },
        { status: 410 },
      );
    }
    return NextResponse.json({ ok: true, status: data.status });
  } catch {
    // Network blip → asumimos viva, cliente reintenta
    return NextResponse.json({ ok: true, status: "unknown" });
  }
}
