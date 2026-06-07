/**
 * POST /api/challenge — Reto del Jurado.
 *
 * Recibe una URL ARBITRARIA que Themis nunca vio, hace HTTP fetch + parse,
 * invoca a Claude para inferir mappings y firma en Solana. Todo en una sola
 * call, sin iframe Browserbase, sin operador humano observando.
 *
 * Esto es la prueba viva de que el aprendizaje NO está hardcoded:
 * el jurado pasa cualquier URL durante el demo, Themis devuelve playbook + ROI
 * en <30s. Ningún otro equipo se atreve a hacer esto.
 *
 * Body: { url: string, hint?: string }
 * Returns: { playbook, provenance, snapshotsCount, fetchMs }
 */

import { NextRequest, NextResponse } from "next/server";
import { extractPlaybookWithMetrics } from "@hack4her/agent/playbook";
import { critiquePlaybook } from "@hack4her/agent/playbook/critique";
import { createSolanaClientFromEnv } from "@hack4her/agent/blockchain";
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

const URL_PATTERN = /^https?:\/\/[^\s<>"']+$/i;

interface ChallengeBody {
  url: string;
  hint?: string;
}

interface BrowserSnapshot {
  taken_at: string;
  url: string;
  title: string;
  observations: string[];
  field_values: Record<string, string>;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!rateLimit(`challenge:${ip}`, 5, 60_000)) {
    return tooManyRequests("Máximo 5 retos por minuto. Espera.");
  }

  let body: ChallengeBody;
  try {
    body = (await request.json()) as ChallengeBody;
  } catch {
    return badRequest("Invalid JSON");
  }

  if (
    !body.url ||
    typeof body.url !== "string" ||
    body.url.length > 500 ||
    !URL_PATTERN.test(body.url)
  ) {
    return badRequest("'url' inválida (http/https, max 500 chars)");
  }
  if (body.hint && body.hint.length > 500) {
    return badRequest("'hint' max 500 chars");
  }

  try {
    const totalT0 = Date.now();

    const fetchT0 = Date.now();
    const snapshot = await fetchPageAsSnapshot(body.url);
    const fetchMs = Date.now() - fetchT0;

    if (snapshot.observations.length === 0 && Object.keys(snapshot.field_values).length === 0) {
      return badRequest(
        "No pude extraer estructura de esa URL. ¿Es accesible públicamente y devuelve HTML?",
      );
    }

    const recording = buildRecording([snapshot], {
      sessionId: `challenge-${Date.now()}`,
      startUrl: body.url,
      audioTranscript: body.hint,
    });

    const extractResult = await extractPlaybookWithMetrics(recording);
    const playbook = extractResult.playbook;
    playbook.name = `Reto del jurado · ${snapshot.title || hostnameOf(body.url)}`;

    const cost: CostBreakdown = {
      capa1_claude_usd: claudeCost(
        extractResult.model,
        extractResult.input_tokens,
        extractResult.output_tokens,
      ),
      capa1_browserbase_usd: 0,
      capa2_elevenlabs_usd: 0,
      capa2_whisper_usd: 0,
      capa3_gemini_usd: 0,
      capa6_solana_usd: 0,
      total_usd: 0,
    };

    const latency: LatencyBreakdown = {
      total_ms: 0,
      claude_ms: extractResult.latency_ms,
      browserbase_ms: fetchMs,
      solana_ms: 0,
      other_ms: 0,
    };

    let provenance = null;
    const solanaT0 = Date.now();
    try {
      const solana = createSolanaClientFromEnv();
      provenance = await solana.registerPlaybook(playbook);
      playbook.provenance = provenance;

      if (playbook.mappings && playbook.mappings.length > 0) {
        try {
          playbook.mappings = await solana.signMappings(playbook.mappings, {
            minConfidence: 0.7,
          });
        } catch (err) {
          console.warn(
            "[/api/challenge] per-mapping signing skipped:",
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
        "[/api/challenge] Solana skipped:",
        (err as Error).message,
      );
    }

    cost.total_usd =
      cost.capa1_claude_usd +
      cost.capa1_browserbase_usd +
      cost.capa3_gemini_usd +
      cost.capa6_solana_usd;
    latency.total_ms = Date.now() - totalT0;

    playbook.cost_breakdown = cost;
    playbook.latency_breakdown = latency;

    try {
      const critique = await critiquePlaybook(playbook);
      if (critique) playbook.self_critique = critique;
    } catch (err) {
      console.warn(
        "[/api/challenge] critique skipped:",
        (err as Error).message,
      );
    }

    try {
      await saveSavedPlaybook(playbook);
    } catch (err) {
      console.warn(
        "[/api/challenge] Store save skipped:",
        (err as Error).message,
      );
    }

    return NextResponse.json({
      playbook,
      provenance,
      snapshotsCount: 1,
      fetchMs,
      title: snapshot.title,
    });
  } catch (err) {
    console.error("[/api/challenge]", err);
    const msg = (err as Error).message ?? "";
    // Mensaje específico según tipo de falla para que el jurado entienda
    // exactamente qué pasó y el operador pueda elegir otra URL.
    let userMessage = "No pude con esa URL";
    if (msg.includes("HTTP 4") || msg.includes("HTTP 5")) {
      userMessage = `El sitio respondió ${msg.match(/HTTP \d+/)?.[0] ?? "con error"}. Probablemente bloquea bots — probá otra URL pública.`;
    } else if (msg.includes("aborted") || msg.includes("TimeoutError")) {
      userMessage = "El sitio tardó más de 15 segundos. Probá una URL más liviana.";
    } else if (msg.includes("fetch failed") || msg.includes("ENOTFOUND") || msg.includes("getaddrinfo")) {
      userMessage = "No pude resolver esa URL (DNS o sitio caído). Verificá que sea pública y esté online.";
    } else if (msg.includes("Anthropic") || msg.includes("Claude") || msg.includes("overloaded") || msg.includes("rate_limit")) {
      userMessage = "Claude está rate-limited. Esperá 30 segundos y probá de nuevo.";
    } else if (msg.includes("Solana")) {
      userMessage = "Solana devnet no respondió a tiempo. El playbook se aprendió pero no se firmó — probá otra vez.";
    } else if (msg.toLowerCase().includes("json") || msg.includes("Unexpected")) {
      userMessage = "Claude devolvió mappings malformados (el HTML era poco estructurado). Probá una URL con formularios visibles.";
    } else if (msg.includes("Zod") || msg.includes("validation")) {
      userMessage = "La estructura aprendida no pasó validación. La URL probablemente no tiene forms reales.";
    }
    return NextResponse.json(
      {
        ...sanitizedError(err, userMessage),
        error: userMessage,
        debug: msg.slice(0, 200),
      },
      { status: 500 },
    );
  }
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url.slice(0, 40);
  }
}

async function fetchPageAsSnapshot(url: string): Promise<BrowserSnapshot> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; ThemisAgent/1.0; +https://themis.dev)",
      Accept: "text/html",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }
  const html = await res.text();

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

  for (const m of html.matchAll(/<label[^>]*>([^<]+)<\/label>/gi)) {
    pushUnique(m[1] ?? "");
    if (observations.length >= 30) break;
  }
  for (const m of html.matchAll(/<(h[1-3]|th)[^>]*>([^<]+)<\/\1>/gi)) {
    pushUnique(m[2] ?? "");
    if (observations.length >= 50) break;
  }
  for (const m of html.matchAll(/<button[^>]*>([^<]+)<\/button>/gi)) {
    pushUnique(m[1] ?? "");
    if (observations.length >= 60) break;
  }

  const field_values: Record<string, string> = {};
  for (const m of html.matchAll(/<input[^>]*\bname=["']([^"']+)["'][^>]*>/gi)) {
    const name = m[1] ?? "";
    const placeholderMatch = m[0].match(/placeholder=["']([^"']+)["']/i);
    const valueMatch = m[0].match(/value=["']([^"']+)["']/i);
    if (name) {
      field_values[name] = placeholderMatch?.[1] ?? valueMatch?.[1] ?? "";
    }
    if (Object.keys(field_values).length >= 30) break;
  }
  for (const m of html.matchAll(
    /<select[^>]*\bname=["']([^"']+)["'][^>]*>/gi,
  )) {
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

  for (const snap of snapshots) {
    const ts = new Date(snap.taken_at).getTime() - t0;

    events.push({
      timestamp_ms: ts,
      type: "dom_event",
      data: { kind: "navigation", url: snap.url, title: snap.title },
    });

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
    duration_ms: tEnd - t0,
    created_at: new Date(t0).toISOString(),
  };
}
