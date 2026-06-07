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
import { extractPlaybookWithMetrics } from "@hack4her/agent/playbook";
import { critiquePlaybook } from "@hack4her/agent/playbook/critique";
import { createSolanaClientFromEnv } from "@hack4her/agent/blockchain";
import {
  closeSession,
  type BrowserSnapshot,
} from "@hack4her/agent/browser";
import {
  saveSavedPlaybook,
  claudeCost,
  solanaCost,
} from "@hack4her/db";
import type {
  CostBreakdown,
  LatencyBreakdown,
  Recording,
  RecordingEvent,
} from "@hack4her/playbooks";
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
    return tooManyRequests("Demasiados finalize calls. Espera 1 minuto.");
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
    // FUENTE DE VERDAD: fetch HTTP directo al startUrl + páginas relacionadas.
    // El dashboard de un portal CPG es informativo (KPIs, alertas, actividad)
    // pero NO tiene forms ricos. Para que Claude infiera mappings buenos hay
    // que darle HTML de páginas con inputs/labels/selects reales: catálogo,
    // formulario de nuevo pedido, estado de cuenta. Multi-fetch en paralelo.
    let allSnapshots: BrowserSnapshot[] = body.snapshots ?? [];

    const urlsToFetch = expandStartUrl(body.startUrl);
    const fetchResults = await Promise.allSettled(
      urlsToFetch.map((u) => fetchPageAsSnapshot(u)),
    );
    for (const result of fetchResults) {
      if (result.status === "fulfilled") {
        const snap = result.value;
        // Solo agregamos snapshots con contenido real (no 404, no vacíos)
        if (
          snap.observations.length > 0 ||
          Object.keys(snap.field_values).length > 0
        ) {
          allSnapshots = [...allSnapshots, snap];
        }
      } else {
        console.warn(
          "[/api/browser/finalize] fetch failed:",
          (result.reason as Error).message,
        );
      }
    }

    if (allSnapshots.length === 0) {
      return badRequest(
        "No pude extraer información del sitio. Verifica que la URL sea válida y accesible.",
      );
    }

    const recording = buildRecording(allSnapshots, {
      sessionId,
      startUrl: body.startUrl,
      audioTranscript: body.audioTranscript,
    });

    const extractResult = await extractPlaybookWithMetrics(recording);
    const playbook = extractResult.playbook;
    if (body.name) playbook.name = body.name;

    // Track costs (transparencia diferenciadora)
    const cost: CostBreakdown = {
      capa1_claude_usd: claudeCost(
        extractResult.model,
        extractResult.input_tokens,
        extractResult.output_tokens,
      ),
      capa1_browserbase_usd: 0, // sin sesión BB
      capa2_elevenlabs_usd: 0,
      capa2_whisper_usd: 0,
      capa3_gemini_usd: 0,
      capa6_solana_usd: 0,
      total_usd: 0,
    };

    const latency: LatencyBreakdown = {
      total_ms: extractResult.latency_ms,
      claude_ms: extractResult.latency_ms,
      browserbase_ms: 0,
      solana_ms: 0,
      other_ms: 0,
    };

    let provenance = null;
    const solanaT0 = Date.now();
    try {
      const solana = createSolanaClientFromEnv();
      provenance = await solana.registerPlaybook(playbook);
      playbook.provenance = provenance;

      // Per-mapping signing: firma cada mapping de alta confianza por separado.
      // Mappings <70% NO se firman → marcadores claros para revisión humana.
      if (playbook.mappings && playbook.mappings.length > 0) {
        try {
          playbook.mappings = await solana.signMappings(playbook.mappings, {
            minConfidence: 0.7,
          });
        } catch (err) {
          console.warn(
            "[/api/browser/finalize] per-mapping signing skipped:",
            (err as Error).message,
          );
        }
      }

      const signedCount =
        (playbook.mappings ?? []).filter((m) => m.signature).length + 1;
      cost.capa6_solana_usd = solanaCost(signedCount);
      latency.solana_ms = Date.now() - solanaT0;
    } catch (err) {
      console.warn(
        "[/api/browser/finalize] Solana skipped:",
        (err as Error).message,
      );
    }

    // Total y persistir en el playbook
    cost.total_usd =
      cost.capa1_claude_usd +
      cost.capa1_browserbase_usd +
      cost.capa2_elevenlabs_usd +
      cost.capa2_whisper_usd +
      cost.capa3_gemini_usd +
      cost.capa6_solana_usd;
    latency.total_ms = latency.claude_ms + latency.solana_ms + latency.other_ms;

    playbook.cost_breakdown = cost;
    playbook.latency_breakdown = latency;

    try {
      const critique = await critiquePlaybook(playbook);
      if (critique) playbook.self_critique = critique;
    } catch (err) {
      console.warn(
        "[/api/browser/finalize] critique skipped:",
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

/**
 * Expande el startUrl a un conjunto de URLs probables que contienen forms.
 * Si la URL es un source-system propio (Vercel) o tiene patrón de portal,
 * agregamos rutas conocidas: /catalogo, /pedidos/nuevo, etc.
 *
 * Esto permite a Claude inferir mappings MUCHO más ricos porque ve forms
 * reales con labels, no solo el dashboard que solo tiene KPIs.
 */
function expandStartUrl(startUrl: string): string[] {
  try {
    const u = new URL(startUrl);
    const origin = u.origin;
    const urls = [startUrl];

    // Detectar si es un source-system propio (Vercel) o demo conocido
    const isOwnDomain =
      u.hostname.endsWith(".vercel.app") ||
      u.hostname === "localhost" ||
      u.hostname.startsWith("127.0.0.1");

    if (isOwnDomain) {
      // Agregamos rutas conocidas del source-system Distribuidora del Norte.
      // Estas tienen forms ricos con labels y inputs reales.
      const knownPaths = [
        "/catalogo",
        "/pedidos/nuevo",
        "/promociones",
        "/estado-cuenta",
      ];
      for (const path of knownPaths) {
        const candidate = `${origin}${path}`;
        if (candidate !== startUrl) urls.push(candidate);
      }
    }

    return urls;
  } catch {
    return [startUrl];
  }
}
