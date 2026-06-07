/**
 * POST /api/browser/session — crea una sesión Browserbase en vivo.
 *
 * Body:  { startUrl: string }
 * Returns: { sessionId, debuggerUrl, startUrl, createdAt }
 *
 * El debuggerUrl se embebe en un iframe del lado del cliente: ese iframe
 * es un browser real, interactivo, controlado por Browserbase (no bloqueado
 * por X-Frame-Options del sitio destino).
 *
 * Seguridad:
 *  - startUrl validado contra allowlist (anti-SSRF: bloquea metadata,
 *    private CIDRs, file://, ftp://, etc).
 *  - rate limit per-IP (cada sesión cuesta minutos de Browserbase).
 */

import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@hack4her/agent/browser";
import {
  validateStartUrl,
  rateLimit,
  getClientIp,
  badRequest,
  tooManyRequests,
  sanitizedError,
} from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  // 3 sesiones por minuto por IP — más que suficiente para demo, frena spam.
  if (!rateLimit(`browser-session:${ip}`, 3, 60_000)) {
    return tooManyRequests("Demasiadas sesiones. Esperá 1 minuto.");
  }

  let body: { startUrl?: string };
  try {
    body = (await request.json().catch(() => ({}))) as { startUrl?: string };
  } catch {
    return badRequest("Invalid JSON");
  }

  const startUrl =
    body.startUrl ??
    process.env.NEXT_PUBLIC_SOURCE_SYSTEM_URL ??
    "https://automationexercise.com/products";

  const check = validateStartUrl(startUrl);
  if (!check.ok) {
    return badRequest(`startUrl rechazada: ${check.reason}`);
  }

  try {
    const handle = await createSession({ startUrl: check.url.toString() });
    return NextResponse.json({
      sessionId: handle.sessionId,
      debuggerUrl: handle.debuggerUrl,
      startUrl: handle.startUrl,
      createdAt: handle.createdAt,
    });
  } catch (err) {
    console.error("[/api/browser/session]", err);
    return NextResponse.json(
      sanitizedError(err, "Failed to create session"),
      { status: 500 },
    );
  }
}
