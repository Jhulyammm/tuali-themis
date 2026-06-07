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
   "campo del precio del producto en vista detalle" -> SI
   "/html/body/div[3]/input" -> NO
   "#price-input-4521" -> NO

2. MAPPINGS: identifica correspondencias entre los dos sistemas. Cada mapping necesita
   source_field, source_selector_intent, destination_field, destination_selector_intent.

3. PARAMETERS: array de strings (nombres de variables). NO objetos.

4. Responde UNICAMENTE con JSON valido en el shape EXACTO de abajo. Sin prosa, sin markdown, sin null.

# Shape EXACTO de respuesta (sigue estos field names al pie de la letra)

{
  "name": "Capturar SKU en ERP destino",
  "intent": "Replicar producto del catalogo origen en el ERP destino",
  "source_url": "https://automationexercise.com/products",
  "destination_url": "http://localhost:3001/captura",
  "steps": [
    { "action": "navigate", "target": "https://automationexercise.com/products" },
    { "action": "click", "selector_intent": "tarjeta del producto en el catalogo" },
    { "action": "extract", "selector_intent": "nombre del producto en vista detalle", "as": "product_name" },
    { "action": "extract", "selector_intent": "precio del producto", "as": "product_price" },
    { "action": "switch_system", "target": "http://localhost:3001/captura" },
    { "action": "fill", "selector_intent": "campo denominacion comercial", "value": "{{product_name}}" },
    { "action": "fill", "selector_intent": "campo precio neto sin IVA", "value": "{{product_price}}" },
    { "action": "click", "selector_intent": "boton Guardar SKU" }
  ],
  "mappings": [
    {
      "source_field": "Product Name",
      "source_selector_intent": "nombre del producto en vista detalle",
      "destination_field": "Denominacion comercial",
      "destination_selector_intent": "campo denominacion comercial",
      "confidence": 0.97,
      "transformation": "",
      "examples": [{ "source_value": "Blue Top", "destination_value": "Blue Top" }]
    }
  ],
  "parameters": ["product_id", "store_id"]
}

REGLAS DE STRINGS:
- TODOS los strings son requeridos. Si no aplica, usa "" (string vacio) NUNCA null.
- transformation puede ser "" si no hay transformacion.
- parameters es array de STRINGS, NO de objetos.`;

// ============================================================
// Zod schema para validar la respuesta de Claude
// ============================================================

const str = z.preprocess(
  (v) => (v == null ? "" : typeof v === "string" ? v : String(v)),
  z.string(),
);

const PlaybookActionSchema: z.ZodType = z.lazy(() =>
  z.discriminatedUnion("action", [
    z.object({ action: z.literal("navigate"), target: str }),
    z.object({ action: z.literal("switch_system"), target: str }),
    z.object({
      action: z.literal("click"),
      selector_intent: str,
      selector_hint: str.optional(),
    }),
    z.object({ action: z.literal("fill"), selector_intent: str, value: str }),
    z.object({ action: z.literal("select"), selector_intent: str, value: str }),
    z.object({
      action: z.literal("wait_for"),
      selector_intent: str,
      timeout_ms: z.number().optional(),
    }),
    z.object({ action: z.literal("extract"), selector_intent: str, as: str }),
    z.object({
      action: z.literal("extract_list"),
      selector_intent: str,
      as: str,
      fields: z.array(z.object({ name: str, selector_intent: str })),
    }),
    z.object({
      action: z.literal("for_each"),
      input_var: str,
      as: str,
      steps: z.array(PlaybookActionSchema),
    }),
    z.object({
      action: z.literal("if"),
      condition: str,
      then: z.array(PlaybookActionSchema),
      else: z.array(PlaybookActionSchema).optional(),
    }),
  ]),
);

const MappingSchema = z.object({
  source_field: str,
  source_selector_intent: str,
  destination_field: str,
  destination_selector_intent: str,
  confidence: z.preprocess((v) => (typeof v === "number" ? v : 0.8), z.number().min(0).max(1)),
  transformation: str.optional(),
  examples: z
    .array(z.object({ source_value: str, destination_value: str }))
    .default([]),
});

const ParameterSchema = z.preprocess((v) => {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "name" in v) return String((v as { name: unknown }).name);
  return String(v ?? "");
}, z.string());

const PlaybookResponseSchema = z.object({
  name: str,
  intent: str,
  source_url: str,
  destination_url: str,
  steps: z.array(PlaybookActionSchema),
  mappings: z.array(MappingSchema),
  parameters: z.array(ParameterSchema),
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

  // Retry con backoff por si Anthropic 429s — crítico al final de observación.
  const response = await retryWithBackoff(async () =>
    client.messages.create({
      model: process.env.EXTRACTOR_MODEL ?? "claude-haiku-4-5",
      max_tokens: 4096,
      temperature: 0.1,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  );

  const text = response.content[0]?.type === "text" ? response.content[0].text : "";
  const json = safeParseJson(text);
  const normalized = normalizePlaybookResponse(json, recording);
  const validated = PlaybookResponseSchema.parse(normalized);

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

/**
 * Retry con exponential backoff para llamadas a Anthropic.
 * Espera: 500ms → 1.5s → 4s. Hasta 3 intentos.
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const msg = (err as Error).message ?? "";
      const retryable =
        msg.includes("429") ||
        msg.includes("rate_limit") ||
        msg.includes("overloaded") ||
        msg.includes("timeout") ||
        msg.includes("ECONNRESET");
      if (!retryable || attempt === maxAttempts) throw err;
      const delayMs = Math.min(500 * Math.pow(3, attempt - 1), 5000);
      console.warn(
        `[extractor] attempt ${attempt} failed (${msg.slice(0, 80)}), retry in ${delayMs}ms`,
      );
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastError;
}

// ============================================================
// Normalización: Claude a veces se desvía del schema. Acá rellenamos
// top-level desde el recording, mapeamos action aliases y aplanamos
// mappings que vinieron sin _selector_intent.
// ============================================================

const ACTION_ALIASES: Record<string, string> = {
  goto: "navigate",
  open: "navigate",
  visit: "navigate",
  type: "fill",
  input: "fill",
  enter: "fill",
  press: "click",
  tap: "click",
  read: "extract",
  get: "extract",
  scrape: "extract",
  loop: "for_each",
  foreach: "for_each",
  iterate: "for_each",
  switch: "switch_system",
  goto_system: "switch_system",
};

function normalizePlaybookResponse(input: unknown, recording: Recording): unknown {
  if (!input || typeof input !== "object") return input;
  const obj = input as Record<string, unknown>;

  const intent =
    (typeof obj.intent === "string" && obj.intent) ||
    (typeof obj.description === "string" && obj.description) ||
    (typeof obj.goal === "string" && obj.goal) ||
    "Replicar proceso aprendido de Sistema A a Sistema B";

  const sourceUrl =
    (typeof obj.source_url === "string" && obj.source_url) ||
    recording.source_url ||
    "";

  const destinationUrl =
    (typeof obj.destination_url === "string" && obj.destination_url) ||
    recording.destination_url ||
    "";

  const name =
    (typeof obj.name === "string" && obj.name) || "Playbook aprendido";

  const steps = Array.isArray(obj.steps) ? obj.steps.map(normalizeStep) : [];
  const mappings = Array.isArray(obj.mappings)
    ? obj.mappings.map(normalizeMapping)
    : [];
  const parameters = Array.isArray(obj.parameters)
    ? obj.parameters.map(normalizeParameter)
    : [];

  return {
    name,
    intent,
    source_url: sourceUrl,
    destination_url: destinationUrl,
    steps,
    mappings,
    parameters,
  };
}

function normalizeStep(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const s = { ...(raw as Record<string, unknown>) };

  if (typeof s.action === "string") {
    const lower = s.action.toLowerCase();
    s.action = ACTION_ALIASES[lower] ?? lower;
  }

  // target alias: a veces Claude usa "url" para navigate o "target_url"
  if ((s.action === "navigate" || s.action === "switch_system") && !s.target) {
    s.target = s.url ?? s.target_url ?? s.href ?? "";
  }

  // selector_intent alias
  if (!s.selector_intent) {
    s.selector_intent = s.selector ?? s.target_intent ?? s.intent ?? s.element ?? "";
  }

  // value alias
  if ((s.action === "fill" || s.action === "select") && s.value == null) {
    s.value = s.text ?? s.input ?? s.content ?? "";
  }

  // extract: as alias
  if ((s.action === "extract" || s.action === "extract_list") && !s.as) {
    s.as = s.variable ?? s.name ?? "value";
  }

  return s;
}

function normalizeMapping(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const m = { ...(raw as Record<string, unknown>) };

  if (!m.source_selector_intent) {
    m.source_selector_intent =
      m.source_intent ?? m.from_selector ?? m.source_field ?? "";
  }
  if (!m.destination_selector_intent) {
    m.destination_selector_intent =
      m.destination_intent ?? m.to_selector ?? m.destination_field ?? "";
  }

  if (Array.isArray(m.examples)) {
    m.examples = m.examples.map((ex) => {
      if (!ex || typeof ex !== "object") return ex;
      const e = { ...(ex as Record<string, unknown>) };
      if (e.source_value == null) e.source_value = e.from ?? e.source ?? "";
      if (e.destination_value == null) e.destination_value = e.to ?? e.destination ?? "";
      return e;
    });
  }

  return m;
}

function normalizeParameter(raw: unknown): unknown {
  if (typeof raw === "string") return raw;
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    return obj.name ?? obj.key ?? obj.id ?? "param";
  }
  return String(raw ?? "");
}
