/**
 * /api/playbook/extract — toma un Recording, lo manda a Claude,
 * devuelve un Playbook estructurado + lo registra en Solana (Capa 6).
 *
 * Seguridad:
 *  - body cap (Recording → tokens Claude; LLM cost)
 *  - rate limit per-IP (claude billing)
 *  - sanitized errors
 */

import { NextRequest, NextResponse } from "next/server";
import { extractPlaybookFromRecording } from "@hack4her/agent/playbook";
import { createSolanaClientFromEnv } from "@hack4her/agent/blockchain";
import { saveSavedPlaybook } from "@hack4her/db";
import type { Recording } from "@hack4her/playbooks";
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
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!rateLimit(`extract:${ip}`, 10, 60_000)) {
    return tooManyRequests("Demasiadas extracciones. Espera 1 minuto.");
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return badRequest("Failed to read body");
  }

  const sizeCheck = jsonTooBig(raw, LIMITS.recording_json_bytes);
  if (sizeCheck.tooBig) {
    return tooLarge(
      `Recording max ${LIMITS.recording_json_bytes} bytes (got ${sizeCheck.size})`,
    );
  }

  let recording: Recording;
  try {
    recording = JSON.parse(raw) as Recording;
  } catch {
    return badRequest("Invalid Recording JSON");
  }

  try {
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
      sanitizedError(err, "Extraction failed"),
      { status: 500 },
    );
  }
}
