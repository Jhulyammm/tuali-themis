/**
 * GET /api/executions/self-heals — lista todos los eventos de auto-reparación.
 * Sirve a /auto-reparacion.
 */

import { NextResponse } from "next/server";
import { listSelfHealEvents } from "@hack4her/db";
import { sanitizedError } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const events = await listSelfHealEvents();
    return NextResponse.json({ events });
  } catch (err) {
    console.error("[/api/executions/self-heals]", err);
    return NextResponse.json(
      { ...sanitizedError(err, "List failed"), events: [] },
      { status: 500 },
    );
  }
}
