/**
 * /api/whisper — transcribes audio uploads via OpenAI Whisper.
 * Llamado por el Recorder en client-side para la narración del operador.
 */

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
    }

    const transcription = await client.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: "es",
      response_format: "verbose_json",
    });

    return NextResponse.json({
      text: transcription.text,
      duration: (transcription as { duration?: number }).duration,
    });
  } catch (err) {
    console.error("[/api/whisper]", err);
    return NextResponse.json(
      { error: "Transcription failed" },
      { status: 500 },
    );
  }
}
