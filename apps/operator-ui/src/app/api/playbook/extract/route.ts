/**
 * /api/playbook/extract — toma un Recording, lo manda a Claude,
 * devuelve un Playbook estructurado + lo registra en Solana (Capa 6).
 *
 * Imports directos para evitar cargar Stagehand.
 */

import { NextRequest, NextResponse } from "next/server";
import { extractPlaybookFromRecording } from "@hack4her/agent/playbook";
import { createSolanaClientFromEnv } from "@hack4her/agent/blockchain";
import { saveSavedPlaybook } from "@hack4her/db";
import type { Recording } from "@hack4her/playbooks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const recording = (await request.json()) as Recording;

    // Capa 1: Claude extrae el Playbook con selector_intent naturales
    const playbook = await extractPlaybookFromRecording(recording);

    // Capa 6: registramos el hash en Solana devnet
    let provenance = null;
    try {
      const solana = createSolanaClientFromEnv();
      provenance = await solana.registerPlaybook(playbook);
      playbook.provenance = provenance;
    } catch (err) {
      console.warn(
        "[/api/playbook/extract] Solana skipped:",
        (err as Error).message,
      );
    }

    // Capa 4: persistimos en knowledge graph
    try {
      await saveSavedPlaybook(playbook);
    } catch (err) {
      console.warn(
        "[/api/playbook/extract] Store save skipped:",
        (err as Error).message,
      );
    }

    return NextResponse.json({ playbook, provenance });
  } catch (err) {
    console.error("[/api/playbook/extract]", err);
    return NextResponse.json(
      { error: (err as Error).message || "Extraction failed" },
      { status: 500 },
    );
  }
}
