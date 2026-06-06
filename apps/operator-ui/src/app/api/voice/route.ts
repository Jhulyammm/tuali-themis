/**
 * /api/voice — Capa 2: Themis narra con voz mexicana (ElevenLabs).
 *
 * Body: { text: string, voice_id?: string }
 * Returns: audio/mpeg stream
 *
 * Owner backend: Emi (pero el stub funciona de momento)
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1";

export async function POST(request: NextRequest) {
  try {
    const { text, voice_id } = (await request.json()) as {
      text: string;
      voice_id?: string;
    };

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ElevenLabs not configured" },
        { status: 500 },
      );
    }

    const voiceId = voice_id ?? process.env.ELEVENLABS_VOICE_ID ?? "EXAVITQu4vr4xnSDxMaL";

    const res = await fetch(`${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const audio = await res.arrayBuffer();
    return new NextResponse(audio, {
      status: 200,
      headers: { "Content-Type": "audio/mpeg" },
    });
  } catch (err) {
    console.error("[/api/voice]", err);
    return NextResponse.json(
      { error: (err as Error).message || "Voice failed" },
      { status: 500 },
    );
  }
}
