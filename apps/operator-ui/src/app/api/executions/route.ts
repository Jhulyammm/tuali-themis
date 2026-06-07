/**
 * GET /api/executions — lista runs históricos (MongoDB → filesystem).
 * POST /api/executions — guarda una ejecución (sirve al modo replay de /execute).
 *
 * Ambos sirven a /registro: GET para listar, POST para que las ejecuciones
 * del modo replay queden persistidas y aparezcan en el historial.
 */

import { NextRequest, NextResponse } from "next/server";
import { listExecutions, saveExecution } from "@hack4her/db";
import type { Execution } from "@hack4her/playbooks";
import {
  badRequest,
  rateLimit,
  getClientIp,
  tooManyRequests,
  sanitizedError,
} from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const executions = await listExecutions();
    return NextResponse.json({ executions });
  } catch (err) {
    console.error("[/api/executions GET]", err);
    return NextResponse.json(
      { ...sanitizedError(err, "List failed"), executions: [] },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!rateLimit(`executions:${ip}`, 30, 60_000)) {
    return tooManyRequests("Demasiadas ejecuciones. Espera 1 minuto.");
  }

  let body: { execution?: Execution };
  try {
    body = (await request.json()) as { execution?: Execution };
  } catch {
    return badRequest("Invalid JSON");
  }

  const exec = body.execution;
  if (!exec || !exec.id || !exec.playbook_id) {
    return badRequest("'execution' con 'id' y 'playbook_id' es requerido");
  }

  try {
    await saveExecution(exec);
    return NextResponse.json({ ok: true, id: exec.id });
  } catch (err) {
    console.error("[/api/executions POST]", err);
    return NextResponse.json(sanitizedError(err, "Save failed"), {
      status: 500,
    });
  }
}
