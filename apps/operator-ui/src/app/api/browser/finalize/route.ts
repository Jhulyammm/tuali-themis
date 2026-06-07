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
    // ESTRATEGIA: fetch directo HTTP al startUrl (saltándose Browserbase).
    // Browserbase nos da el WOW visual del iframe pero sus sesiones serverless
    // son frágiles. Para extraer datos REALES del sitio, usamos fetch HTTP
    // directo desde el server. Claude infiere playbook desde el HTML real.
    let allSnapshots: BrowserSnapshot[] = body.snapshots ?? [];

    try {
      const directSnapshot = await fetchPageAsSnapshot(body.startUrl);
      allSnapshots = [...allSnapshots, directSnapshot];
    } catch (err) {
      console.warn(
        "[/api/browser/finalize] direct HTTP fetch failed:",
        (err as Error).message,
      );
    }

    // Fallback opcional: capturar via Browserbase si la sesión sigue viva
    if (allSnapshots.length === 0) {
      try {
        const freshSnapshot = await captureSnapshot(sessionId);
        allSnapshots = [...allSnapshots, freshSnapshot];
      } catch (err) {
        console.warn(
          "[/api/browser/finalize] Browserbase snapshot fallback failed:",
          (err as Error).message,
        );
      }
    }

    if (allSnapshots.length === 0) {
      return badRequest(
        "No pude extraer información del sitio. Verificá que la URL sea válida y accesible.",
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

/**
 * Hace fetch HTTP directo al startUrl y parsea el HTML para extraer:
 *   - Título de la página
 *   - Labels visibles (lo que ve el usuario como nombre de campo)
 *   - Headings + table headers
 *   - Input names + placeholders (lo que Themis necesita para mapear)
 *
 * Convierte todo a un BrowserSnapshot que el extractor puede usar.
 * Es server-side regex parsing — barato, sin DOM real ni Playwright.
 */
async function fetchPageAsSnapshot(url: string): Promise<BrowserSnapshot> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; ThemisAgent/1.0; +https://themis.dev)",
      Accept: "text/html",
    },
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }
  const html = await res.text();

  // Extracción mínima — regex sobre HTML, suficiente para Claude
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch?.[1]?.trim().slice(0, 200) ?? "";

  const observations: string[] = [];
  const seen = new Set<string>();

  const pushUnique = (text: string) => {
    const clean = text.replace(/\s+/g, " ").trim();
    if (clean.length > 0 && clean.length < 100 && !seen.has(clean)) {
      seen.add(clean);
      observations.push(clean);
    }
  };

  // Labels visibles
  const labelMatches = html.matchAll(/<label[^>]*>([^<]+)<\/label>/gi);
  for (const m of labelMatches) {
    pushUnique(m[1] ?? "");
    if (observations.length >= 30) break;
  }

  // Headings + table headers
  const headingMatches = html.matchAll(
    /<(h[1-3]|th)[^>]*>([^<]+)<\/\1>/gi,
  );
  for (const m of headingMatches) {
    pushUnique(m[2] ?? "");
    if (observations.length >= 50) break;
  }

  // Button text (acciones disponibles)
  const buttonMatches = html.matchAll(/<button[^>]*>([^<]+)<\/button>/gi);
  for (const m of buttonMatches) {
    pushUnique(m[1] ?? "");
    if (observations.length >= 60) break;
  }

  // Field values: extraemos name + placeholder de inputs
  const field_values: Record<string, string> = {};
  const inputMatches = html.matchAll(
    /<input[^>]*\bname=["']([^"']+)["'][^>]*>/gi,
  );
  for (const m of inputMatches) {
    const name = m[1] ?? "";
    const placeholderMatch = m[0].match(/placeholder=["']([^"']+)["']/i);
    const valueMatch = m[0].match(/value=["']([^"']+)["']/i);
    if (name) {
      field_values[name] =
        placeholderMatch?.[1] ?? valueMatch?.[1] ?? "";
    }
    if (Object.keys(field_values).length >= 30) break;
  }

  // Select options (más contexto de qué campos hay)
  const selectMatches = html.matchAll(
    /<select[^>]*\bname=["']([^"']+)["'][^>]*>/gi,
  );
  for (const m of selectMatches) {
    const name = m[1];
    if (name && !field_values[name]) field_values[name] = "(select)";
  }

  return {
    taken_at: new Date().toISOString(),
    url,
    title,
    observations: observations.slice(0, 50),
    field_values,
  };
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
