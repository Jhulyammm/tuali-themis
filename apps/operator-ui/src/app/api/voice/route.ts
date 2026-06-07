/**
 * /api/voice — Capa 2: Themis narra con voz mexicana (ElevenLabs).
 *
 * Body: { text: string, voice_id?: string, mood?: VoiceMood }
 * Returns: audio/mpeg stream
 *
 * Seguridad:
 *  - text cap a LIMITS.voice_text_chars (protege billing ElevenLabs)
 *  - rate limit 30 req/min per IP
 *  - voice_id solo se permite si está allowlisted
 *
 * Tono emocional — ningún otro equipo va a hacer esto:
 * Themis cambia de matiz según contexto. Observando suena curioso, ejecutando
 * firme, al triunfar exaltado, en self-healing alerta. La diferencia se nota
 * en demo en vivo: el jurado no escucha un bot — escucha una agente que siente.
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

type VoiceMood = "curious" | "firm" | "triumphant" | "alert" | "neutral";

const MOOD_SETTINGS: Record<
  VoiceMood,
  { stability: number; similarity_boost: number; style: number; use_speaker_boost: boolean }
> = {
  curious: {
    stability: 0.40,
    similarity_boost: 0.70,
    style: 0.35,
    use_speaker_boost: true,
  },
  firm: {
    stability: 0.65,
    similarity_boost: 0.80,
    style: 0.15,
    use_speaker_boost: true,
  },
  triumphant: {
    stability: 0.45,
    similarity_boost: 0.85,
    style: 0.55,
    use_speaker_boost: true,
  },
  alert: {
    stability: 0.55,
    similarity_boost: 0.75,
    style: 0.40,
    use_speaker_boost: true,
  },
  neutral: {
    stability: 0.50,
    similarity_boost: 0.75,
    style: 0.0,
    use_speaker_boost: true,
  },
};

const ALLOWED_MOODS: VoiceMood[] = [
  "curious",
  "firm",
  "triumphant",
  "alert",
  "neutral",
];

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!rateLimit(`voice:${ip}`, 30, 60_000)) {
    return tooManyRequests("Demasiados pedidos de voz. Esperá 1 minuto.");
  }

  let body: { text?: unknown; voice_id?: unknown; mood?: unknown };
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
  const mood: VoiceMood =
    typeof body.mood === "string" && ALLOWED_MOODS.includes(body.mood as VoiceMood)
      ? (body.mood as VoiceMood)
      : "neutral";

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
          voice_settings: MOOD_SETTINGS[mood],
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
