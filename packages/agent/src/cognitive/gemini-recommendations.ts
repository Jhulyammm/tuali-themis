/**
 * Themis — Cognitive Reasoning (Capa 3)
 *
 * Razonamiento contextual con dos backends posibles:
 *   1. Google Gemini (preferido — MLH prize)
 *   2. Anthropic Claude (fallback — siempre funciona)
 *
 * Si GEMINI_API_KEY existe, intenta Gemini. Si falla (rate limit, quota 0,
 * red), automáticamente cae a Claude. Demo nunca se rompe.
 *
 * Owner: Jhulyam
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type {
  RecommendationContext,
  RecommendationsResponse,
  ContextualEvent,
} from "@hack4her/playbooks";

// ============================================================
// System prompt (compartido entre Gemini y Claude)
// ============================================================

const SYSTEM_PROMPT = `Eres Themis, el módulo de razonamiento contextual de un agente cognitivo para CPG (consumer packaged goods) en México.

Recibes:
- Información de una tienda (zona, perfil, ciudad)
- Eventos próximos relevantes (deportivos, universitarios, comerciales)
- Histórico de ventas baseline por SKU
- (Implícito) tu conocimiento del mercado mexicano y patrones de consumo

Tu tarea: generar recomendaciones de ajuste de pedido por SKU, con:
- delta_percentage: cuánto subir/bajar respecto al baseline (ej. 35 para "+35%")
- reason: justificación clara en español mexicano, máximo 2 frases
- overall_justification: párrafo de 2-3 frases explicando el contexto general

Reglas:
1. SOLO recomienda cambios donde haya señal CLARA (evento + zona + producto compatible).
2. Si no hay señal fuerte para un SKU, no lo incluyas.
3. Justificación debe ser SPECIFIC: nombrar el evento, la zona, el producto.
4. Tono profesional, mexicano natural ("para el Clásico Regio del sábado", no "during the upcoming sports event").
5. NO uses números inventados — usa el histórico_baseline como referencia.
6. Responde ÚNICAMENTE con JSON válido del schema. Sin prosa.

Schema esperado:
{
  "recommendations": [
    {
      "sku": "string (nombre exacto del baseline)",
      "base_quantity": number,
      "recommended_quantity": number,
      "delta_percentage": number,
      "reason": "string corto en español"
    }
  ],
  "overall_justification": "string de 2-3 frases"
}`;

// ============================================================
// Schema
// ============================================================

const RecommendationSchema = z.object({
  sku: z.string(),
  base_quantity: z.number(),
  recommended_quantity: z.number(),
  delta_percentage: z.number(),
  reason: z.string(),
});

const RecommendationsResponseSchema = z.object({
  recommendations: z.array(RecommendationSchema),
  overall_justification: z.string(),
});

// ============================================================
// Backend selection
// ============================================================

let cachedGemini: GoogleGenerativeAI | null = null;
let cachedClaude: Anthropic | null = null;

function getGemini(): GoogleGenerativeAI | null {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (cachedGemini) return cachedGemini;
  cachedGemini = new GoogleGenerativeAI(apiKey);
  return cachedGemini;
}

function getClaude(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  if (cachedClaude) return cachedClaude;
  cachedClaude = new Anthropic({ apiKey });
  return cachedClaude;
}

// ============================================================
// Main entry — try Gemini, fallback to Claude
// ============================================================

export async function generateRecommendations(
  context: RecommendationContext,
): Promise<RecommendationsResponse> {
  const userPrompt = buildUserPrompt(context);

  // Try Gemini first if available
  const gemini = getGemini();
  if (gemini) {
    try {
      const result = await callGemini(gemini, userPrompt);
      return formatResponse(context, result, "gemini");
    } catch (err) {
      console.warn(
        "[cognitive] Gemini falló, cayendo a Claude:",
        (err as Error).message.slice(0, 120),
      );
    }
  }

  // Fallback to Claude
  const claude = getClaude();
  if (!claude) {
    throw new Error(
      "Ni Gemini ni Anthropic configurados. Necesitas al menos una.",
    );
  }
  const result = await callClaude(claude, userPrompt);
  return formatResponse(context, result, "claude");
}

// ============================================================
// Gemini backend
// ============================================================

async function callGemini(
  client: GoogleGenerativeAI,
  userPrompt: string,
): Promise<z.infer<typeof RecommendationsResponseSchema>> {
  const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const model = client.getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      temperature: 0.4,
      responseMimeType: "application/json",
    },
  });

  const result = await model.generateContent(userPrompt);
  const text = result.response.text();
  const json = JSON.parse(text);
  return RecommendationsResponseSchema.parse(json);
}

// ============================================================
// Claude backend (fallback)
// ============================================================

async function callClaude(
  client: Anthropic,
  userPrompt: string,
): Promise<z.infer<typeof RecommendationsResponseSchema>> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    temperature: 0.4,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text =
    response.content[0]?.type === "text" ? response.content[0].text : "";
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/\s*```$/, "")
    .trim();
  const json = JSON.parse(cleaned);
  return RecommendationsResponseSchema.parse(json);
}

// ============================================================
// Helpers
// ============================================================

function formatResponse(
  context: RecommendationContext,
  validated: z.infer<typeof RecommendationsResponseSchema>,
  source: "gemini" | "claude",
): RecommendationsResponse {
  return {
    tendero_id: context.tendero_id,
    recommendations: validated.recommendations.map((r) => ({
      sku: r.sku,
      base_quantity: r.base_quantity,
      recommended_quantity: r.recommended_quantity,
      delta_percentage: r.delta_percentage,
      reason: r.reason,
    })),
    overall_justification: `[${source}] ${validated.overall_justification}`,
    generated_at: new Date().toISOString(),
  };
}

function buildUserPrompt(ctx: RecommendationContext): string {
  return JSON.stringify(
    {
      tienda_destino: ctx.zone,
      proximos_eventos: ctx.upcoming_events,
      historico_baseline_por_sku: ctx.historical_baseline,
    },
    null,
    2,
  );
}

export function filterRelevantEvents(
  allEvents: ContextualEvent[],
  zoneId: string,
  withinDays: number = 7,
): ContextualEvent[] {
  const now = new Date();
  const cutoff = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);

  return allEvents.filter((evt) => {
    const evtDate = new Date(evt.date);
    if (evtDate < now || evtDate > cutoff) return false;
    return (
      evt.impact_zones.includes(zoneId) ||
      evt.impact_zones.includes("nacional") ||
      evt.impact_zones.includes("zonas-universitarias-todas")
    );
  });
}
