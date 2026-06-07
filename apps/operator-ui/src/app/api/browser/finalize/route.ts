/**
 * POST /api/browser/finalize — cierra observación, extrae playbook, firma on-chain.
 *
 * Body:  { sessionId, audioTranscript?: string, name?: string, intent?: string }
 * Returns: { playbook, provenance }
 *
 * Flow:
 *   1. Lee snapshots acumulados por el SessionManager
 *   2. Construye Recording sintético desde los snapshots (URLs visitadas + observations + field_values)
 *   3. Llama extractPlaybookFromRecording (Claude Sonnet 4.6)
 *   4. Registra hash en Solana devnet (Capa 6)
 *   5. Guarda en knowledge graph (Capa 4)
 *   6. Cierra la sesión Browserbase
 */

import { NextRequest, NextResponse } from "next/server";
import { extractPlaybookFromRecording } from "@hack4her/agent/playbook";
import { createSolanaClientFromEnv } from "@hack4her/agent/blockchain";
import {
  getHandle,
  closeSession,
  type BrowserSnapshot,
} from "@hack4her/agent/browser";
import { saveSavedPlaybook } from "@hack4her/db";
import type { Recording, RecordingEvent } from "@hack4her/playbooks";
import {
  rateLimit,
  getClientIp,
  badRequest,
  tooManyRequests,
  sanitizedError,
} from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

interface FinalizeBody {
  sessionId: string;
  audioTranscript?: string;
  name?: string;
}

// sessionId de Browserbase es un UUID-like string. Validamos shape para
// rechazar paths/inyecciones.
const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!rateLimit(`finalize:${ip}`, 10, 60_000)) {
    return tooManyRequests("Demasiados finalize calls. Esperá 1 minuto.");
  }

  let sessionId: string | undefined;
  try {
    const body = (await request.json()) as FinalizeBody;
    sessionId = body.sessionId;
    if (!sessionId || !SESSION_ID_PATTERN.test(sessionId)) {
      return badRequest("'sessionId' inválido");
    }
    if (body.audioTranscript && body.audioTranscript.length > 8000) {
      return badRequest("'audioTranscript' max 8000 chars");
    }
    if (body.name && body.name.length > 200) {
      return badRequest("'name' max 200 chars");
    }

    const handle = getHandle(sessionId);
    if (!handle) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 },
      );
    }

    const recording = buildRecording(handle.snapshots, {
      sessionId,
      startUrl: handle.startUrl,
      audioTranscript: body.audioTranscript,
    });

    const playbook = await extractPlaybookFromRecording(recording);
    if (body.name) playbook.name = body.name;

    // Capa 6 — Solana
    let provenance = null;
    try {
      const solana = createSolanaClientFromEnv();
      provenance = await solana.registerPlaybook(playbook);
      playbook.provenance = provenance;
    } catch (err) {
      console.warn(
        "[/api/browser/finalize] Solana skipped:",
        (err as Error).message,
      );
    }

    // Capa 4 — Persistir
    try {
      await saveSavedPlaybook(playbook);
    } catch (err) {
      console.warn(
        "[/api/browser/finalize] Store save skipped:",
        (err as Error).message,
      );
    }

    return NextResponse.json({
      playbook,
      provenance,
      snapshotsCount: handle.snapshots.length,
    });
  } catch (err) {
    console.error("[/api/browser/finalize]", err);
    return NextResponse.json(sanitizedError(err, "Finalize failed"), {
      status: 500,
    });
  } finally {
    if (sessionId) {
      // Browserbase consume minutos; cerrar siempre
      void closeSession(sessionId);
    }
  }
}

// ============================================================
// Recording builder: snapshots → shape que entiende el extractor
// ============================================================

function buildRecording(
  snapshots: BrowserSnapshot[],
  meta: {
    sessionId: string;
    startUrl: string;
    audioTranscript?: string;
  },
): Recording {
  const events: RecordingEvent[] = [];
  const t0 = snapshots[0]
    ? new Date(snapshots[0].taken_at).getTime()
    : Date.now();

  let lastUrl = "";
  for (const snap of snapshots) {
    const ts = new Date(snap.taken_at).getTime() - t0;

    if (snap.url !== lastUrl) {
      events.push({
        timestamp_ms: ts,
        type: "dom_event",
        data: {
          kind: "navigation",
          url: snap.url,
          title: snap.title,
        },
      });
      lastUrl = snap.url;
    }

    if (snap.observations.length > 0) {
      events.push({
        timestamp_ms: ts,
        type: "dom_event",
        data: {
          kind: "page_observe",
          url: snap.url,
          elements: snap.observations,
        },
      });
    }

    const fieldEntries = Object.entries(snap.field_values).filter(
      ([, v]) => v && v.trim().length > 0,
    );
    if (fieldEntries.length > 0) {
      events.push({
        timestamp_ms: ts,
        type: "dom_event",
        data: {
          kind: "form_state",
          url: snap.url,
          fields: Object.fromEntries(fieldEntries),
        },
      });
    }
  }

  const lastSnap = snapshots[snapshots.length - 1];
  const tEnd = lastSnap
    ? new Date(lastSnap.taken_at).getTime()
    : Date.now();

  return {
    id: `rec-${meta.sessionId}`,
    events,
    audio_transcript: meta.audioTranscript,
    source_url: meta.startUrl,
    destination_url:
      lastSnap && lastSnap.url !== meta.startUrl ? lastSnap.url : undefined,
    duration_ms: tEnd - t0,
    created_at: new Date(t0).toISOString(),
  };
}
