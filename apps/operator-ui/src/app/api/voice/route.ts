/**
 * /api/voice — Capa 2: Themis narra con voz mexicana (ElevenLabs).
 *
 * Body: { text: string, voice_id?: string }
 * Returns: audio/mpeg stream
 *
 * Seguridad:
 *  - text cap a LIMITS.voice_text_chars (protege billing ElevenLabs)
 *  - rate limit 30 req/min per IP
 *  - voice_id solo se permite si está allowlisted
 */

import { NextRequest, NextResponse } from "next/server";
import {
  LIMITS,
  rateLimit,
  getClientIp,
  badRequest,
  tooLarge,
  tooManyRequests,
  sanitizedError,
} from "@/lib/security";

export const runtime = "nodejs";

const ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1";
const VOICE_ID_PATTERN = /^[A-Za-z0-9]{12,32}$/;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!rateLimit(`voice:${ip}`, 30, 60_000)) {
    return tooManyRequests("Demasiados pedidos de voz. Esperá 1 minuto.");
  }

  let body: { text?: unknown; voice_id?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return badRequest("Invalid JSON");
  }

  if (typeof body.text !== "string" || body.text.length === 0) {
    return badRequest("'text' es requerido y debe ser string");
  }
  if (body.text.length > LIMITS.voice_text_chars) {
    return tooLarge(
      `'text' max ${LIMITS.voice_text_chars} chars (got ${body.text.length})`,
    );
  }
  if (
    body.voice_id !== undefined &&
    (typeof body.voice_id !== "string" || !VOICE_ID_PATTERN.test(body.voice_id))
  ) {
    return badRequest("'voice_id' inválido");
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ElevenLabs not configured" },
      { status: 500 },
    );
  }

  const voiceId =
    (typeof body.voice_id === "string" ? body.voice_id : undefined) ??
    process.env.ELEVENLABS_VOICE_ID ??
    "EXAVITQu4vr4xnSDxMaL";

  try {
    const res = await fetch(
      `${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: body.text,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      },
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: `ElevenLabs returned ${res.status}` },
        { status: res.status },
      );
    }

    const audio = await res.arrayBuffer();
    return new NextResponse(audio, {
      status: 200,
      headers: { "Content-Type": "audio/mpeg" },
    });
  } catch (err) {
    console.error("[/api/voice]", err);
    return NextResponse.json(sanitizedError(err, "Voice failed"), {
      status: 500,
    });
  }
}
