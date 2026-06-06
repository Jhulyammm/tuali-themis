/**
 * Themis — Playbook Extractor (Capa 1 · Modo Observación → Modo Ejecutable)
 *
 * Toma un Recording (DOM events + screenshots + transcript) y le pide a Claude
 * que extraiga un Playbook estructurado con:
 *   - steps: secuencia de acciones en `selector_intent` natural
 *   - mappings: correspondencias source-field → destination-field
 *   - parameters: variables que cambian entre ejecuciones
 *
 * El JSON resultante se valida con Zod ANTES de devolver. Garantía de schema.
 *
 * Owner: Jhulyam
 */

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { Playbook, Recording } from "@hack4her/playbooks";

// ============================================================
// System prompt — la regla más importante: NO HARDCODE.
// ============================================================

const SYSTEM_PROMPT = `Eres Themis, un agente que extrae playbooks reusables de demostraciones humanas de procesos web.

Dada una Grabación (Recording) con DOM events, screenshots metadata y transcript de voz, produces un Playbook estructurado.

# Reglas críticas

1. selector_intent SIEMPRE en lenguaje natural.
   ✅ "campo del precio del producto en vista detalle"
   ❌ "/html/body/div[3]/input"
   ❌ "#price-input-4521"

   El selector_intent es lo que permite generalización y self-healing.

2. MAPPINGS: identifica correspondencias entre campos de los dos sistemas observando
   la SECUENCIA de eventos. Si el operador LEYÓ un valor del sistema A y después
   ESCRIBIÓ ese mismo valor (o transformado) en el sistema B, ese es un mapping.

   Para cada mapping incluye:
   - source_field: nombre del campo en origen (lenguaje natural)
   - destination_field: nombre del campo en destino (lenguaje natural)
   - confidence: 0.0-1.0 — qué tan obvia es la correspondencia
   - transformation: si hay transformación (ej. "remove currency symbol")
   - examples: pares source_value → destination_value que ocurrieron

3. PARAMETERS: identifica qué valores son los que cambian entre ejecuciones
   (store_id, SKU, quantity). No los hardcodes en los steps.

4. Responde ÚNICAMENTE con JSON válido. Sin prosa, sin markdown.`;

// ============================================================
// Zod schema para validar la respuesta de Claude
// ============================================================

const PlaybookActionSchema: z.ZodType = z.lazy(() =>
  z.discriminatedUnion("action", [
    z.object({ action: z.literal("navigate"), target: z.string() }),
    z.object({
      action: z.literal("switch_system"),
      target: z.string(),
    }),
    z.object({
      action: z.literal("click"),
      selector_intent: z.string(),
      selector_hint: z.string().optional(),
    }),
    z.object({
      action: z.literal("fill"),
      selector_intent: z.string(),
      value: z.string(),
    }),
    z.object({
      action: z.literal("select"),
      selector_intent: z.string(),
      value: z.string(),
    }),
    z.object({
      action: z.literal("wait_for"),
      selector_intent: z.string(),
      timeout_ms: z.number().optional(),
    }),
    z.object({
      action: z.literal("extract"),
      selector_intent: z.string(),
      as: z.string(),
    }),
    z.object({
      action: z.literal("extract_list"),
      selector_intent: z.string(),
      as: z.string(),
      fields: z.array(z.object({ name: z.string(), selector_intent: z.string() })),
    }),
    z.object({
      action: z.literal("for_each"),
      input_var: z.string(),
      as: z.string(),
      steps: z.array(PlaybookActionSchema),
    }),
    z.object({
      action: z.literal("if"),
      condition: z.string(),
      then: z.array(PlaybookActionSchema),
      else: z.array(PlaybookActionSchema).optional(),
    }),
  ]),
);

const MappingSchema = z.object({
  source_field: z.string(),
  source_selector_intent: z.string(),
  destination_field: z.string(),
  destination_selector_intent: z.string(),
  confidence: z.number().min(0).max(1),
  transformation: z.string().optional(),
  examples: z.array(
    z.object({
      source_value: z.string(),
      destination_value: z.string(),
    }),
  ),
});

const PlaybookResponseSchema = z.object({
  name: z.string(),
  intent: z.string(),
  source_url: z.string(),
  destination_url: z.string(),
  steps: z.array(PlaybookActionSchema),
  mappings: z.array(MappingSchema),
  parameters: z.array(z.string()),
});

// ============================================================
// Main extractor
// ============================================================

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function extractPlaybookFromRecording(
  recording: Recording,
): Promise<Playbook> {
  const userPrompt = buildUserPrompt(recording);

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    temperature: 0.1, // baja para consistencia
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content[0]?.type === "text" ? response.content[0].text : "";
  const json = safeParseJson(text);
  const validated = PlaybookResponseSchema.parse(json);

  const playbook: Playbook = {
    id: crypto.randomUUID(),
    name: validated.name,
    intent: validated.intent,
    source_url: validated.source_url,
    destination_url: validated.destination_url,
    steps: validated.steps,
    mappings: validated.mappings,
    parameters: validated.parameters,
    recording_id: recording.id,
    version: 1,
    created_at: new Date().toISOString(),
  };

  return playbook;
}

// ============================================================
// Helpers
// ============================================================

function buildUserPrompt(recording: Recording): string {
  // Resumimos events para evitar prompt overflow.
  // Los screenshots no se envían como imagen aún — solo metadata.
  // (Para multimodal vision-based extraction, agregar `content` con type: "image" arrays.)
  return JSON.stringify(
    {
      recording_id: recording.id,
      source_url: recording.source_url,
      destination_url: recording.destination_url,
      duration_ms: recording.duration_ms,
      audio_transcript: recording.audio_transcript,
      events: recording.events,
    },
    null,
    2,
  );
}

function safeParseJson(text: string): unknown {
  // Claude a veces wrappea en ```json ... ``` aunque le digamos que no
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/\s*```$/, "")
    .trim();
  return JSON.parse(cleaned);
}
