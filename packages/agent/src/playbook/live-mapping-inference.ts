/**
 * Themis — Live Mapping Inference (Capa 1 extendida)
 *
 * Durante /teach, mientras el usuario hace clic en el browser, NO esperamos
 * al final para inferir mappings. Le mandamos cada N snapshots a Claude en
 * modo cumulativo y le pedimos:
 *   "De lo que vas viendo, ¿qué pares de campos source→destination estás
 *    detectando hasta ahora?"
 *
 * El UI muestra esos mappings creciendo en tiempo real. La voz narra cada
 * uno. El jurado nunca ve un punto muerto durante observación.
 *
 * Diferente del extractor final (extractor.ts) que sintetiza el playbook
 * COMPLETO al final. Acá hacemos inferencia incremental, más barata.
 */

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { Mapping } from "@hack4her/playbooks";

const SYSTEM_PROMPT = `Eres Themis, observando un proceso humano en curso entre dos sistemas web.

Recibís una secuencia parcial de snapshots (URLs visitadas + campos visibles +
descripción de elementos). Tu tarea: enumerar los mappings POTENCIALES que
estás detectando hasta ahora.

Un MAPPING es una correspondencia entre un campo de la fuente y un campo del
destino. Ejemplos:
  "Producto"     →  "Denominación comercial"
  "Precio lista" →  "Precio neto sin IVA"   (transformación: /1.16)
  "SKU proveedor"→  "Código interno"

Reglas:
- Solo inferí mappings que tengan EVIDENCIA en los snapshots (no inventes)
- Marca confidence honestamente (0.5 si poco evidente, 0.9+ si obvio)
- Si todavía no tenés suficientes snapshots para detectar nada, devolvé []
- transformation solo si el valor cambia (parsing, división, lookup, etc)
- Sé incremental: cada llamada puede aportar más mappings sobre la previa

Respondé SOLO JSON válido con este shape exacto:
{ "mappings": [{ "source_field": "...", "destination_field": "...",
                 "confidence": 0.9, "transformation": "" }] }`;

const MappingSchema = z.object({
  source_field: z.string(),
  destination_field: z.string(),
  confidence: z.number().min(0).max(1),
  transformation: z.string().default(""),
});

const ResponseSchema = z.object({
  mappings: z.array(MappingSchema).default([]),
});

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface SnapshotInput {
  url: string;
  title: string;
  observations: string[];
  field_values: Record<string, string>;
}

export interface PartialMapping {
  source_field: string;
  destination_field: string;
  confidence: number;
  transformation?: string;
}

export interface InferenceMetrics {
  input_tokens: number;
  output_tokens: number;
  model: string;
  latency_ms: number;
}

let lastMetrics: InferenceMetrics | null = null;
export function getLastInferenceMetrics(): InferenceMetrics | null {
  return lastMetrics;
}

export async function inferPartialMappings(
  snapshots: SnapshotInput[],
): Promise<PartialMapping[]> {
  if (snapshots.length < 2) return [];

  const compact = snapshots.slice(-12).map((s, i) => ({
    n: i,
    url: s.url,
    title: s.title.slice(0, 80),
    fields: s.field_values,
    elements: s.observations.slice(0, 6),
  }));

  const userPrompt = `Snapshots recientes (parciales):

${JSON.stringify(compact, null, 2)}

¿Qué mappings detectás hasta ahora? Solo los que tengan evidencia clara.`;

  // Retry con exponential backoff — si Anthropic 429s, esperamos y reintentamos
  // hasta 3 veces. Crítico para demo en vivo: si truena el primer call, igual
  // hay chance de recuperarse sin romper la UX.
  const model = process.env.LIVE_INFERENCE_MODEL ?? "claude-haiku-4-5";
  const t0 = Date.now();
  const response = await retryWithBackoff(async () =>
    client.messages.create({
      model,
      max_tokens: 400,
      temperature: 0.2,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  );
  lastMetrics = {
    input_tokens: response.usage?.input_tokens ?? 0,
    output_tokens: response.usage?.output_tokens ?? 0,
    model,
    latency_ms: Date.now() - t0,
  };

  const text =
    response.content[0]?.type === "text" ? response.content[0].text : "";
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/\s*```$/, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return [];
  }

  const validated = ResponseSchema.safeParse(parsed);
  if (!validated.success) return [];

  return validated.data.mappings.map((m) => ({
    source_field: m.source_field,
    destination_field: m.destination_field,
    confidence: m.confidence,
    transformation: m.transformation || undefined,
  }));
}

/**
 * Convierte un PartialMapping en un Mapping completo (para mostrar en UI
 * con la misma MappingTable que el extractor final).
 */
export function partialToMapping(p: PartialMapping): Mapping {
  return {
    source_field: p.source_field,
    source_selector_intent: p.source_field,
    destination_field: p.destination_field,
    destination_selector_intent: p.destination_field,
    confidence: p.confidence,
    transformation: p.transformation,
    examples: [],
  };
}

/**
 * Reintenta una llamada async con exponential backoff. Crítico para resilencia
 * en demo en vivo cuando Anthropic devuelve 429 (rate limit).
 *
 * Esperas: 500ms → 1.5s → 4s. Max 3 intentos. Si el último también truena,
 * propaga la excepción al caller.
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
      // Solo retry si es rate limit o transient. Otros errores fallan rápido.
      const retryable =
        msg.includes("429") ||
        msg.includes("rate_limit") ||
        msg.includes("overloaded") ||
        msg.includes("timeout") ||
        msg.includes("ECONNRESET");
      if (!retryable || attempt === maxAttempts) throw err;

      const delayMs = Math.min(500 * Math.pow(3, attempt - 1), 5000);
      console.warn(
        `[live-mapping-inference] attempt ${attempt} failed (${msg.slice(0, 80)}), retry in ${delayMs}ms`,
      );
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastError;
}
