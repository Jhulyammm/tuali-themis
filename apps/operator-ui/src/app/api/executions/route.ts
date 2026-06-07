/**
 * GET /api/executions — lista runs históricos (MongoDB → filesystem).
 * Sirve a /registro.
 */

import { NextResponse } from "next/server";
import { listExecutions } from "@hack4her/db";
import { sanitizedError } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const executions = await listExecutions();
    return NextResponse.json({ executions });
  } catch (err) {
    console.error("[/api/executions]", err);
    return NextResponse.json(
      { ...sanitizedError(err, "List failed"), executions: [] },
      { status: 500 },
    );
  }
}
