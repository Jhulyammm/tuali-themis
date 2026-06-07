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
  ZoneContext,
} from "@hack4her/playbooks";

// ============================================================
// System prompt (compartido entre Gemini y Claude)
// ============================================================

const ARCA_PORTFOLIO = `PORTAFOLIO ARCA CONTINENTAL (lo ÚNICO que se puede ordenar):
- Refrescos: Coca-Cola, Coca-Cola Sin Azúcar/Light, Sprite, Fanta, Fresca, Sidral Mundet, Delaware Punch.
- Agua: Ciel, Topo Chico.
- Hidratación/energía: Powerade, Monster Energy (distribución Arca).
- Jugos/néctares/té: Del Valle, FUZE Tea.
- Lácteos: Santa Clara.
- Botanas: Bokados (papas, churritos, cacahuates, etc.).

NO pertenecen a Arca Continental (PROHIBIDO recomendarlos): Pepsi, 7Up, Boing, Jumex; Sabritas/Gamesa, Doritos, Cheetos; Gatorade, Red Bull; cualquier cerveza (Tecate, Indio, Modelo, Victoria); Bimbo. Si el último pedido (baseline) trae alguno de estos, IGNÓRALO por completo.`;

const SYSTEM_PROMPT = `Eres Themis, el módulo de razonamiento contextual de un agente cognitivo para Arca Continental (embotellador del sistema Coca-Cola) en México. Operas en CANAL MODERNO (autoservicios y cadenas de conveniencia), no en tienda tradicional.

${ARCA_PORTFOLIO}

Recibes:
- Información de una tienda (zona, perfil, ciudad)
- Eventos próximos REALES (investigados vía Deep Research con búsqueda web)
- Contexto estacional/temporal (temporada, clima, calendario escolar, momento económico)
- Histórico de ventas baseline por SKU
- (Implícito) tu conocimiento del mercado mexicano y patrones de consumo

Tu tarea tiene DOS partes:

1) recommendations — ajustes de pedido por SKU:
   - delta_percentage: cuánto subir (positivo) O BAJAR (negativo) respecto al baseline. Las REDUCCIONES son tan válidas como los aumentos (ej. bajar bebidas calientes en ola de calor, bajar cerveza en semana de exámenes).
   - reason: justificación clara en español mexicano, máximo 2 frases.
   - driver: el evento o factor estacional que lo motiva (ej. "Concierto Nodal 13 jun" o "Temporada de calor").

2) contextual_insights — evaluaciones útiles que NO son necesariamente compra de producto. Cada una con:
   - kind: "aumento" | "reduccion" | "estacional" | "operativo" | "riesgo"
   - title: título corto.
   - detail: 1-2 frases accionables. Ejemplos: reducir inventario en temporada baja, reforzar refrigeración por calor, ajustar surtido por vacaciones universitarias, riesgo de merma por sobre-stock, oportunidad por evento.

Reglas:
1. EXCLUSIVIDAD ARCA: todos los SKU en "recommendations" deben pertenecer al portafolio Arca Continental listado arriba. Si el baseline trae productos de la competencia, NO los incluyas. Puedes sugerir productos Arca relevantes aunque no estén en el baseline.
2. Basa TODO en los eventos reales y el contexto estacional recibidos. NO inventes eventos.
3. Incluye al menos una REDUCCIÓN o ajuste a la baja si el contexto lo justifica (temporada, vacaciones, clima).
3. Sé específico: nombra el evento/temporada, la zona, el producto.
4. Tono profesional, mexicano natural.
5. NO uses números inventados — usa el histórico_baseline como referencia.
6. Responde ÚNICAMENTE con JSON válido del schema. Sin prosa, sin markdown.

Schema esperado:
{
  "recommendations": [
    {
      "sku": "string (nombre exacto del baseline)",
      "base_quantity": number,
      "recommended_quantity": number,
      "delta_percentage": number,
      "reason": "string corto en español",
      "driver": "string corto"
    }
  ],
  "contextual_insights": [
    {
      "kind": "estacional",
      "title": "string corto",
      "detail": "string accionable en español"
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
  driver: z.string().optional(),
});

const InsightSchema = z.object({
  title: z.string(),
  kind: z.enum(["aumento", "reduccion", "estacional", "operativo", "riesgo"]),
  detail: z.string(),
});

const RecommendationsResponseSchema = z.object({
  recommendations: z.array(RecommendationSchema),
  contextual_insights: z.array(InsightSchema).default([]),
  overall_justification: z.string(),
});

// ============================================================
// Retry (errores transitorios de Gemini: 429 / 5xx / overloaded)
// ============================================================

function isTransient(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  if (status && [429, 500, 502, 503, 504, 529].includes(status)) return true;
  const msg = (err as Error)?.message ?? "";
  return /overloaded|unavailable|try again|temporarily|503|429/i.test(msg);
}

async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  baseDelayMs = 1500,
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i === attempts - 1 || !isTransient(err)) throw err;
      await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** i));
    }
  }
  throw lastErr;
}

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
  // Modelo de EVALUACIÓN contextual. Configurable: cambia a "gemini-2.5-pro"
  // (requiere billing) para máxima profundidad. Default capaz y con cuota.
  const modelName = process.env.GEMINI_EVAL_MODEL || "gemini-2.5-flash";
  const model = client.getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      temperature: 0.4,
      responseMimeType: "application/json",
    },
  });

  const result = await withRetry(() => model.generateContent(userPrompt));
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
      driver: r.driver,
    })),
    contextual_insights: validated.contextual_insights,
    overall_justification: `[${source}] ${validated.overall_justification}`,
    generated_at: new Date().toISOString(),
  };
}

function buildUserPrompt(ctx: RecommendationContext): string {
  return JSON.stringify(
    {
      tienda_destino: ctx.zone,
      proximos_eventos: ctx.upcoming_events,
      contexto_estacional: ctx.seasonal_context ?? "(no disponible)",
      historico_baseline_por_sku: ctx.historical_baseline,
    },
    null,
    2,
  );
}

// ============================================================
// Contextual events — eventos REALES vía Gemini + Google Search grounding
// ============================================================
//
// Gemini base (sin grounding) ALUCINA eventos de su entrenamiento. Para que
// los "próximos eventos" sean reales y verificables, usamos grounding con
// Google Search: Gemini busca en la web en vivo y devuelve eventos reales
// junto con las fuentes (links) que consultó. Si falla (cuota, parseo), el
// caller debe caer al calendario curado del dataset — nunca a datos inventados.

const EventSchema = z.object({
  event_id: z.string(),
  name: z.string(),
  type: z.enum(["futbol", "universitario", "comercial", "estacional"]),
  date: z.string(),
  impact_zones: z.array(z.string()).optional(),
  expected_impact: z.string(),
});

const DeepResearchSchema = z.object({
  events: z.array(EventSchema),
  seasonal_context: z.string().optional(),
});

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface DeepResearchResult {
  events: ContextualEvent[];
  /** Contexto estacional/temporal investigado (temporada, clima, calendario
   *  escolar, fechas económicas) — habilita ajustes por temporada, no solo
   *  por compra de producto. */
  seasonal_context: string;
  sources: GroundingSource[];
  /** Búsquedas que Gemini ejecutó en Google (prueba de grounding en vivo) */
  search_queries: string[];
}

function buildDeepResearchPrompt(
  today: string,
  withinDays: number,
  zone: ZoneContext,
): string {
  const institutions = zone.nearby_institutions?.length
    ? zone.nearby_institutions.join(", ")
    : "ninguna registrada";
  return `Hoy es ${today}. Eres un investigador de mercado de Arca Continental (sistema Coca-Cola) en CANAL MODERNO (autoservicios y cadenas de conveniencia). Usa Google Search de forma EXHAUSTIVA (Deep Research) para investigar el contexto comercial de un punto de venta de canal moderno entre hoy y dentro de ${withinDays} días en ${zone.zone_name}, ${zone.city}, México.

Tienda:
- Zona: ${zone.zone_name} (${zone.zone_id})
- Perfil: ${zone.profile}
- Cerca de: ${institutions}

Investiga en profundidad (haz varias búsquedas, cruza fuentes):
A) EVENTOS reales próximos que muevan la demanda: partidos de Liga MX de equipos locales, conciertos, ferias, fechas del calendario universitario de las instituciones cercanas (inicio/fin de clases, exámenes, vacaciones, graduaciones), días festivos mexicanos, quincenas de pago, eventos comerciales (El Buen Fin, Hot Sale, etc.).
B) CONTEXTO ESTACIONAL/TEMPORAL: temporada del año y clima esperado en la ciudad (calor, lluvias, frío), fase del calendario escolar (clases vs vacaciones), situación económica del periodo (quincena, aguinaldo, cuesta de enero). Describe cómo este contexto SUBE o BAJA la demanda — incluye REDUCCIONES por temporada (ej. baja de consumo en vacaciones en zona universitaria, menos bebidas calientes en calor, etc.).

Reglas estrictas:
1. SOLO información REAL encontrada en búsquedas. NO inventes eventos ni fechas.
2. Eventos: fecha REAL en ISO (YYYY-MM-DD), entre hoy (${today}) y ${withinDays} días después.
3. "type" del evento: EXACTAMENTE uno de "futbol" | "universitario" | "comercial" | "estacional".
4. "impact_zones" incluye "${zone.zone_id}".
5. "expected_impact": impacto en categorías del portafolio Arca Continental (refrescos Coca-Cola/Sprite/Fanta, agua Ciel/Topo Chico, Powerade, Monster, jugos Del Valle, botanas Bokados) con porcentajes aproximados, en español mexicano.
6. 2 a 4 eventos, del más próximo al más lejano.
7. "seasonal_context": 2-4 frases describiendo la temporada, el clima, el calendario escolar y el momento económico, y su efecto (incluyendo bajas) en la demanda.

Devuelve EXCLUSIVAMENTE un objeto JSON con esta forma, sin texto adicional ni markdown:
{"events":[{"event_id":"kebab-unico","name":"...","type":"futbol","date":"YYYY-MM-DD","impact_zones":["${zone.zone_id}"],"expected_impact":"..."}],"seasonal_context":"..."}`;
}

/**
 * DEEP RESEARCH — investiga eventos REALES + contexto estacional/temporal de
 * una zona usando Gemini con Google Search grounding (búsqueda web en vivo).
 * Lanza error si Gemini no está disponible o no produce datos válidos — el
 * caller decide el fallback (calendario curado del dataset).
 */
export async function deepResearch(
  zone: ZoneContext,
  withinDays: number = 21,
  today: string = new Date().toISOString().slice(0, 10),
): Promise<DeepResearchResult> {
  const gemini = getGemini();
  if (!gemini) {
    throw new Error(
      "Gemini no configurado (se requiere para Deep Research con grounding).",
    );
  }

  // Cadena de modelos con grounding + cuota. Si el primario está saturado
  // (503) tras reintentos, cae al siguiente antes de rendirse al calendario.
  const models = [
    process.env.GEMINI_GROUNDING_MODEL || "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
  ].filter((m, i, all) => all.indexOf(m) === i);

  // googleSearch grounding existe en runtime pero no en los typings del SDK
  // 0.21; casteamos los tools al tipo esperado por getGenerativeModel.
  type ModelArg = Parameters<GoogleGenerativeAI["getGenerativeModel"]>[0];
  const tools = [{ googleSearch: {} }] as unknown as ModelArg["tools"];
  const prompt = buildDeepResearchPrompt(today, withinDays, zone);

  let lastErr: unknown;
  for (const modelName of models) {
    try {
      const model = gemini.getGenerativeModel({
        model: modelName,
        tools,
        generationConfig: { temperature: 0.3 },
      });
      const result = await withRetry(() => model.generateContent(prompt), 3, 1200);

      const { events, seasonal_context } = parseDeepResearch(
        result.response.text(),
        zone,
        today,
        withinDays,
      );
      const { sources, search_queries } = extractGrounding(result);

      if (events.length === 0) {
        throw new Error("Deep Research no produjo eventos reales válidos.");
      }
      return { events, seasonal_context, sources, search_queries };
    } catch (err) {
      lastErr = err;
      console.warn(
        `[cognitive] Deep Research con ${modelName} falló:`,
        (err as Error).message.slice(0, 100),
      );
    }
  }

  throw lastErr ?? new Error("Deep Research falló en todos los modelos.");
}

function parseDeepResearch(
  text: string,
  zone: ZoneContext,
  today: string,
  withinDays: number,
): { events: ContextualEvent[]; seasonal_context: string } {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Gemini no devolvió JSON de Deep Research.");
  }
  const json = JSON.parse(text.slice(start, end + 1));
  const parsed = DeepResearchSchema.parse(json);

  const now = new Date(today);
  const cutoff = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);

  const events = parsed.events
    .filter((e) => {
      const d = new Date(e.date);
      return !Number.isNaN(d.getTime()) && d >= now && d <= cutoff;
    })
    .map((e) => ({
      ...e,
      impact_zones: e.impact_zones?.length ? e.impact_zones : [zone.zone_id],
    }));

  return { events, seasonal_context: parsed.seasonal_context ?? "" };
}

// El tipo de generateContent en @google/generative-ai no expone
// groundingMetadata en sus typings; lo accedemos con una forma laxa explícita.
interface GroundingMetadataShape {
  candidates?: Array<{
    groundingMetadata?: {
      groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>;
      webSearchQueries?: string[];
    };
  }>;
}

function extractGrounding(result: {
  response: unknown;
}): { sources: GroundingSource[]; search_queries: string[] } {
  const response = result.response as GroundingMetadataShape;
  const meta = response.candidates?.[0]?.groundingMetadata;
  const chunks = meta?.groundingChunks ?? [];
  const seen = new Set<string>();
  const sources: GroundingSource[] = [];
  for (const c of chunks) {
    const uri = c.web?.uri;
    if (!uri || seen.has(uri)) continue;
    seen.add(uri);
    sources.push({ title: c.web?.title ?? uri, uri });
  }
  return { sources, search_queries: meta?.webSearchQueries ?? [] };
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
