/**
 * POST /api/execute — corre un Playbook con Stagehand y stream-ea progreso via SSE.
 *
 * Body:
 *   { playbook: Playbook, parameters: Record<string, unknown>, existingSessionId?: string }
 *
 * Response (text/event-stream):
 *   event: session_ready  data: { sessionId, debuggerUrl }
 *   event: step_update    data: ExecutionLog
 *   event: self_healing   data: PlaybookAction
 *   event: done           data: { execution }
 *   event: error          data: { message }
 *
 * Si `existingSessionId` viene en el body, reusa esa sesión Browserbase
 * (la misma del modo observación → el jurado ve a Themis manejar el mismo
 * browser donde acababa de demostrar).
 */

import { NextRequest } from "next/server";
import { executePlaybook } from "@hack4her/agent/execute";
import { saveExecution } from "@hack4her/db";
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
export const maxDuration = 300;

interface ExecuteRequestBody {
  playbook: Playbook;
  parameters?: Record<string, unknown>;
  existingSessionId?: string;
}

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

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      try {
        const execution = await executePlaybook(body.playbook, {
          parameters: body.parameters ?? {},
          existingSessionId: body.existingSessionId,
          onSession: (info) => send("session_ready", info),
          onStepUpdate: (log: ExecutionLog) => send("step_update", log),
          onSelfHealing: (step: PlaybookAction) => send("self_healing", step),
        });

        // Persistir el run completo (sirve a /registro y /auto-reparacion)
        try {
          await saveExecution(execution);
        } catch (err) {
          console.warn(
            "[/api/execute] saveExecution skipped:",
            (err as Error).message,
          );
        }

        send("done", { execution });
      } catch (err) {
        send("error", { message: (err as Error).message || "Execution failed" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
