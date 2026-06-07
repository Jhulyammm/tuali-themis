/**
 * POST /api/browser/finalize — cierra observación, extrae playbook, firma on-chain.
 *
 * STATELESS: el cliente envía sessionId + snapshots + startUrl en el body.
 *
 * Body:
 *   {
 *     sessionId: string,
 *     snapshots: BrowserSnapshot[],
 *     startUrl: string,
 *     audioTranscript?: string,
 *     name?: string,
 *   }
 *
 * Returns: { playbook, provenance, snapshotsCount }
 */

import { NextRequest, NextResponse } from "next/server";
import { extractPlaybookFromRecording } from "@hack4her/agent/playbook";
import { createSolanaClientFromEnv } from "@hack4her/agent/blockchain";
import {
  closeSession,
  snapshot as captureSnapshot,
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
export const maxDuration = 60;

interface FinalizeBody {
  sessionId: string;
  snapshots: BrowserSnapshot[];
  startUrl: string;
  audioTranscript?: string;
  name?: string;
}

const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!rateLimit(`finalize:${ip}`, 10, 60_000)) {
    return tooManyRequests("Demasiados finalize calls. Esperá 1 minuto.");
  }

  let body: FinalizeBody;
  try {
    body = (await request.json()) as FinalizeBody;
  } catch {
    return badRequest("Invalid JSON");
  }

  const sessionId = body.sessionId;
  if (!sessionId || !SESSION_ID_PATTERN.test(sessionId)) {
    return badRequest("'sessionId' inválido");
  }
  // snapshots opcional ahora — finalize captura uno fresco si no le mandan
  if (
    body.snapshots !== undefined &&
    (!Array.isArray(body.snapshots) || body.snapshots.length > 100)
  ) {
    return badRequest("'snapshots' debe ser array (max 100)");
  }
  if (body.audioTranscript && body.audioTranscript.length > 8000) {
    return badRequest("'audioTranscript' max 8000 chars");
  }
  if (body.name && body.name.length > 200) {
    return badRequest("'name' max 200 chars");
  }
  if (!body.startUrl || typeof body.startUrl !== "string") {
    return badRequest("'startUrl' es requerido");
  }

  try {
    // Capturamos UN snapshot fresco de la página final con un attach único.
    // Si falla (la sesión murió), seguimos con los snapshots del cliente.
    let allSnapshots: BrowserSnapshot[] = body.snapshots ?? [];
    try {
      const freshSnapshot = await captureSnapshot(sessionId);
      allSnapshots = [...allSnapshots, freshSnapshot];
    } catch (err) {
      console.warn(
        "[/api/browser/finalize] fresh snapshot failed, using client-side only:",
        (err as Error).message,
      );
    }

    if (allSnapshots.length === 0) {
      return badRequest(
        "No hay snapshots para inferir playbook (sesión sin datos)",
      );
    }

    const recording = buildRecording(allSnapshots, {
      sessionId,
      startUrl: body.startUrl,
      audioTranscript: body.audioTranscript,
    });

    const playbook = await extractPlaybookFromRecording(recording);
    if (body.name) playbook.name = body.name;

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
      snapshotsCount: allSnapshots.length,
    });
  } catch (err) {
    console.error("[/api/browser/finalize]", err);
    return NextResponse.json(sanitizedError(err, "Finalize failed"), {
      status: 500,
    });
  } finally {
    void closeSession(sessionId);
  }
}

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
