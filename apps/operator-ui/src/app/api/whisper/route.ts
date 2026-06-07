/**
 * /api/whisper — transcribe audio uploads via OpenAI Whisper.
 *
 * Seguridad:
 *  - file size cap (LIMITS.whisper_audio_bytes)
 *  - rate limit per-IP (OpenAI billing)
 */

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
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
export const dynamic = "force-dynamic";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!rateLimit(`whisper:${ip}`, 15, 60_000)) {
    return tooManyRequests("Demasiadas transcripciones. Esperá 1 minuto.");
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return badRequest("Invalid form data");
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return badRequest("Missing 'file' field");
  }
  if (file.size > LIMITS.whisper_audio_bytes) {
    return tooLarge(
      `Audio max ${LIMITS.whisper_audio_bytes} bytes (got ${file.size})`,
    );
  }
  // Validar MIME mínimo para no enviar PDFs raros
  if (!file.type.startsWith("audio/") && !file.type.startsWith("video/")) {
    return badRequest(`MIME type '${file.type}' no soportado (solo audio/video)`);
  }

  try {
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
      sanitizedError(err, "Transcription failed"),
      { status: 500 },
    );
  }
}
