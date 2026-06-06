/**
 * POST /api/execute — corre un Playbook autónomamente via Stagehand.
 *
 * Body:
 *   { playbook: Playbook, parameters: Record<string, unknown> }
 * Returns:
 *   { execution: Execution }
 *
 * Nota: este endpoint mantiene la conexión abierta hasta que termina la
 * ejecución completa (puede tomar 30-90s). Para streaming de eventos en
 * tiempo real, eventualmente se migraría a un endpoint SSE.
 */

import { NextRequest, NextResponse } from "next/server";
import { executePlaybook } from "@hack4her/agent";
import type { Playbook } from "@hack4her/playbooks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min

interface ExecuteRequestBody {
  playbook: Playbook;
  parameters: Record<string, unknown>;
  headless?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ExecuteRequestBody;

    if (!body.playbook || !Array.isArray(body.playbook.steps)) {
      return NextResponse.json(
        { error: "Missing or invalid 'playbook' in body" },
        { status: 400 },
      );
    }

    const execution = await executePlaybook(body.playbook, {
      parameters: body.parameters ?? {},
      headless: body.headless ?? true,
    });

    return NextResponse.json({ execution });
  } catch (err) {
    console.error("[/api/execute]", err);
    return NextResponse.json(
      { error: (err as Error).message || "Execution failed" },
      { status: 500 },
    );
  }
}
