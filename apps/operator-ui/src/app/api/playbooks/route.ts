/**
 * GET  /api/playbooks       — lista todos los playbooks aprendidos
 * POST /api/playbooks       — guarda un playbook (después de extraerlo)
 *
 * Backend: MongoDB Atlas si conectado, filesystem si no.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  saveSavedPlaybook,
  listSavedPlaybooks,
  getStoreStatus,
} from "@hack4her/db";
import type { Playbook } from "@hack4her/playbooks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [playbooks, status] = await Promise.all([
      listSavedPlaybooks(),
      getStoreStatus(),
    ]);
    return NextResponse.json({ playbooks, status });
  } catch (err) {
    console.error("[/api/playbooks] GET", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const playbook = (await request.json()) as Playbook;
    if (!playbook || !Array.isArray(playbook.steps)) {
      return NextResponse.json(
        { error: "Invalid playbook" },
        { status: 400 },
      );
    }
    const saved = await saveSavedPlaybook(playbook);
    return NextResponse.json({ playbook: saved });
  } catch (err) {
    console.error("[/api/playbooks] POST", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
