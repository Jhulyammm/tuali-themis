/**
 * /api/execute — corre un Playbook con Stagehand.
 *
 * MODO POLLING (no SSE) porque Vercel Hobby corta lambdas a 60s y los
 * streams se rompen. El cliente:
 *   1. POST /api/execute  → recibe { executionId }
 *   2. GET  /api/execute?id=X cada 1.5s → recibe { logs, done, error, debuggerUrl }
 *   3. Cuando done=true, deja de pollear.
 *
 * El estado de la ejecución vive en `executions-stream` (in-memory).
 * Si Vercel mata la lambda y arranca otra, el polling devuelve "not found"
 * y el cliente muestra "ejecución perdida, reintenta" — caso bordes raros.
 */

import { NextRequest, NextResponse } from "next/server";
import { executePlaybook } from "@hack4her/agent/execute";
import {
  saveExecution,
  startRunning,
  setSession,
  appendLog,
  markDone,
  markError,
  getRunning,
  pruneOld,
} from "@hack4her/db";
import type {
  ExecutionLog,
  Playbook,
  PlaybookAction,
} from "@hack4her/playbooks";
import {
  LIMITS,
  jsonTooBig,
  rateLimit,
  getClientIp,
} from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface ExecuteRequestBody {
  playbook: Playbook;
  parameters?: Record<string, unknown>;
  existingSessionId?: string;
}

// ============================================================
// POST → arranca la ejecución (fire-and-forget) y devuelve executionId
// ============================================================
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!rateLimit(`execute:${ip}`, 5, 60_000)) {
    return new Response("Demasiadas ejecuciones. Esperá 1 minuto.", {
      status: 429,
    });
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return new Response("Failed to read body", { status: 400 });
  }

  const sizeCheck = jsonTooBig(raw, LIMITS.playbook_json_bytes);
  if (sizeCheck.tooBig) {
    return new Response(
      `Playbook body max ${LIMITS.playbook_json_bytes} bytes`,
      { status: 413 },
    );
  }

  let body: ExecuteRequestBody;
  try {
    body = JSON.parse(raw) as ExecuteRequestBody;
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  if (!body.playbook || !Array.isArray(body.playbook.steps)) {
    return new Response("Missing or invalid 'playbook' in body", {
      status: 400,
    });
  }
  if (body.playbook.steps.length > 200) {
    return new Response("Playbook tiene demasiados steps (max 200)", {
      status: 413,
    });
  }

  pruneOld(); // limpia ejecuciones viejas en la lambda caliente

  const executionId = crypto.randomUUID();

  // Inicializa el estado en memoria
  startRunning(executionId, {
    id: executionId,
    playbook_id: body.playbook.id,
    parameters: body.parameters ?? {},
    status: "running",
    current_step_index: 0,
    logs: [],
    started_at: new Date().toISOString(),
  });

  // Lanza fire-and-forget. NO await — devolvemos al cliente de inmediato.
  // Si la lambda se mata antes de terminar, igual el estado intermedio queda.
  void runInBackground(executionId, body);

  return NextResponse.json({
    executionId,
    status: "running",
    pollUrl: `/api/execute?id=${executionId}`,
  });
}

async function runInBackground(
  executionId: string,
  body: ExecuteRequestBody,
): Promise<void> {
  try {
    const execution = await executePlaybook(body.playbook, {
      parameters: body.parameters ?? {},
      existingSessionId: body.existingSessionId,
      onSession: (info) => {
        setSession(executionId, info.sessionId, info.debuggerUrl);
      },
      onStepUpdate: (log: ExecutionLog) => {
        appendLog(executionId, log);
      },
      onSelfHealing: (_step: PlaybookAction) => {
        // log warning para Vercel
        console.log(`[execute ${executionId}] self-healing triggered`);
      },
    });

    try {
      await saveExecution(execution);
    } catch (err) {
      console.warn(
        "[execute] saveExecution skipped:",
        (err as Error).message,
      );
    }

    markDone(executionId, execution);
  } catch (err) {
    markError(executionId, (err as Error).message ?? "Execution failed");
  }
}

// ============================================================
// GET → polling del estado de la ejecución
// ============================================================
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const running = getRunning(id);
  if (!running) {
    return NextResponse.json(
      { error: "Execution not found", expired: true },
      { status: 410 },
    );
  }

  return NextResponse.json({
    executionId: id,
    sessionId: running.sessionId,
    debuggerUrl: running.debuggerUrl,
    logs: running.logs,
    logsCount: running.logs.length,
    done: running.done,
    error: running.error,
    execution: running.done ? running.execution : undefined,
    elapsed_ms: Date.now() - running.startedAt,
  });
}
