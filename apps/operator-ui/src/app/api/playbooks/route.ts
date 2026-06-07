/**
 * GET  /api/playbooks       — lista todos los playbooks aprendidos
 * POST /api/playbooks       — guarda un playbook (después de extraerlo)
 *
 * Backend: MongoDB Atlas si conectado, filesystem si no.
 *
 * Seguridad:
 *  - POST: rate limit + body size cap (evita pollution del store)
 *  - GET: rate limit suave (read endpoint)
 */

import { NextRequest, NextResponse } from "next/server";
import {
  saveSavedPlaybook,
  listSavedPlaybooks,
  getStoreStatus,
} from "@hack4her/db";
import type { Playbook } from "@hack4her/playbooks";
import {
  LIMITS,
  jsonTooBig,
  rateLimit,
  getClientIp,
  badRequest,
  tooLarge,
  tooManyRequests,
  sanitizedError,
} from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  if (!rateLimit(`playbooks-get:${ip}`, 60, 60_000)) {
    return tooManyRequests("Demasiados pedidos. Espera un momento.");
  }
  try {
    const [playbooks, status] = await Promise.all([
      listSavedPlaybooks(),
      getStoreStatus(),
    ]);
    return NextResponse.json({ playbooks, status });
  } catch (err) {
    console.error("[/api/playbooks] GET", err);
    return NextResponse.json(sanitizedError(err, "List failed"), {
      status: 500,
    });
  }
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!rateLimit(`playbooks-post:${ip}`, 10, 60_000)) {
    return tooManyRequests("Demasiados saves. Espera 1 minuto.");
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return badRequest("Failed to read body");
  }
  const sizeCheck = jsonTooBig(raw, LIMITS.playbook_json_bytes);
  if (sizeCheck.tooBig) {
    return tooLarge(`Playbook max ${LIMITS.playbook_json_bytes} bytes`);
  }

  let playbook: Playbook;
  try {
    playbook = JSON.parse(raw) as Playbook;
  } catch {
    return badRequest("Invalid JSON");
  }

  if (!playbook || !Array.isArray(playbook.steps)) {
    return badRequest("Invalid playbook: missing 'steps' array");
  }
  if (playbook.steps.length > 200) {
    return badRequest("Playbook tiene demasiados steps (max 200)");
  }
  if (typeof playbook.name !== "string" || playbook.name.length > 200) {
    return badRequest("'name' inválido (string, max 200 chars)");
  }

  try {
    const saved = await saveSavedPlaybook(playbook);
    return NextResponse.json({ playbook: saved });
  } catch (err) {
    console.error("[/api/playbooks] POST", err);
    return NextResponse.json(sanitizedError(err, "Save failed"), {
      status: 500,
    });
  }
}
