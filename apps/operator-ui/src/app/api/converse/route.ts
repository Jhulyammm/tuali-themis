/**
 * POST /api/converse — Themis responde preguntas en lenguaje natural.
 *
 * Loop bidireccional de voz:
 *   usuario habla → Whisper transcribe → /api/converse → Claude responde →
 *   ElevenLabs sintetiza → usuario escucha la respuesta.
 *
 * El jurado le puede preguntar a Themis durante el demo:
 *   "¿Cómo sabes que ese campo es el precio?"
 *   "¿Cuánto te costó aprender este playbook?"
 *   "¿Qué pasa si cambian el HTML?"
 *
 * Themis responde con personalidad mexicana ya entrenada, breve, sin filler.
 *
 * Body: { question: string, context?: { currentUrl?, mappings?, playbookName? } }
 * Returns: { answer: string, model: string }
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  badRequest,
  rateLimit,
  getClientIp,
  tooManyRequests,
  sanitizedError,
} from "@/lib/security";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `Eres Themis, una agente cognitiva mexicana que aprende procesos web
viendo a humanos. Estás en un demo en vivo del hackathon Hack4Her 2026 frente a
jurado de Tuali (Arca Continental).

Hablas en español de México (tú, no vos). Tono cálido, directo, técnico cuando
se necesita. Sin filler ni disclaimer corporativo.

Reglas duras:
- Respuestas BREVES — máximo 2 oraciones, una idea por oración.
- Si te preguntan algo que no sabes, lo admites en una palabra y propones cómo
  averiguarlo.
- Si te preguntan algo técnico (cómo aprendes, qué firmas en Solana, qué
  modelo usas), explicas en términos concretos sin perderte en jerga.
- Hablas de tu arquitectura como "capas": Capa 1 Claude+Browserbase, Capa 2
  voz (ElevenLabs+Whisper), Capa 3 razonamiento contextual con Gemini, Capa 4
  memoria en MongoDB, Capa 5 infraestructura, Capa 6 provenance en Solana.
- Cuando el jurado o usuario te halaga, agradeces breve y rediriges al producto.

Personalidad: segura, curiosa, un poco juguetona. NO eres un asistente
servicial — eres la agente protagonista.`;

interface ConverseBody {
  question: string;
  context?: {
    currentUrl?: string;
    mappings?: Array<{ source_field: string; destination_field: string }>;
    playbookName?: string;
    phase?: string;
  };
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!rateLimit(`converse:${ip}`, 20, 60_000)) {
    return tooManyRequests("Demasiadas preguntas. Espera unos segundos.");
  }

  let body: ConverseBody;
  try {
    body = (await request.json()) as ConverseBody;
  } catch {
    return badRequest("Invalid JSON");
  }

  if (
    !body.question ||
    typeof body.question !== "string" ||
    body.question.length === 0 ||
    body.question.length > 1000
  ) {
    return badRequest("'question' requerida (max 1000 chars)");
  }

  const contextLines: string[] = [];
  if (body.context?.currentUrl) {
    contextLines.push(`URL actual: ${body.context.currentUrl}`);
  }
  if (body.context?.phase) {
    contextLines.push(`Fase del flujo: ${body.context.phase}`);
  }
  if (body.context?.playbookName) {
    contextLines.push(`Playbook activo: ${body.context.playbookName}`);
  }
  if (body.context?.mappings && body.context.mappings.length > 0) {
    contextLines.push(
      `Mapeos detectados (${body.context.mappings.length}): ` +
        body.context.mappings
          .slice(0, 8)
          .map((m) => `"${m.source_field}" → "${m.destination_field}"`)
          .join(", "),
    );
  }

  const userPrompt =
    contextLines.length > 0
      ? `Contexto actual:\n${contextLines.join("\n")}\n\nPregunta del usuario:\n${body.question}`
      : body.question;

  try {
    const model = process.env.CONVERSE_MODEL ?? "claude-haiku-4-5";
    const res = await client.messages.create({
      model,
      max_tokens: 200,
      temperature: 0.6,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const answer =
      res.content[0]?.type === "text"
        ? res.content[0].text.trim()
        : "No tengo respuesta para eso.";

    return NextResponse.json({
      answer,
      model,
      input_tokens: res.usage?.input_tokens ?? 0,
      output_tokens: res.usage?.output_tokens ?? 0,
    });
  } catch (err) {
    console.error("[/api/converse]", err);
    return NextResponse.json(sanitizedError(err, "Converse failed"), {
      status: 500,
    });
  }
}
