/**
 * Themis — central type schema.
 *
 * - Playbook: a process learned by demonstration, replayable across runs.
 * - Mapping: source-field → destination-field correspondence (what Themis "learns").
 * - LearnedMapping: persisted in MongoDB knowledge graph + Solana provenance.
 *
 * `selector_intent` describes WHAT to interact with in natural language
 * (e.g. "campo del precio del producto"). Stagehand resolves these at runtime
 * using vision + DOM — that resolution is what enables generalization and
 * self-healing when the target page changes.
 */

// ============================================================
// Playbook actions (what the agent can do)
// ============================================================

export type PlaybookAction =
  | { action: "navigate"; target: string }
  | { action: "switch_system"; target: "source" | "destination" | string }
  | { action: "click"; selector_intent: string; selector_hint?: string }
  | { action: "fill"; selector_intent: string; value: string }
  | { action: "select"; selector_intent: string; value: string }
  | { action: "wait_for"; selector_intent: string; timeout_ms?: number }
  | { action: "extract"; selector_intent: string; as: string }
  | {
      action: "extract_list";
      selector_intent: string;
      as: string;
      fields: Array<{ name: string; selector_intent: string }>;
    }
  | {
      action: "for_each";
      input_var: string;
      as: string;
      steps: PlaybookAction[];
    }
  | {
      action: "if";
      condition: string;
      then: PlaybookAction[];
      else?: PlaybookAction[];
    };

// ============================================================
// Mapping: source field → destination field (what Themis learns)
// ============================================================

/**
 * A single field-level mapping learned during observation.
 * Examples:
 *   { source: "Product Name", destination: "Denominación comercial" }
 *   { source: "Price",        destination: "Precio neto sin IVA",
 *     transformation: "remove currency symbol, parse as float" }
 */
export interface Mapping {
  source_field: string;
  source_selector_intent: string;
  destination_field: string;
  destination_selector_intent: string;
  confidence: number; // 0.0 - 1.0, set by Claude when extracting
  transformation?: string; // natural-language description if value transforms
  examples: MappingExample[];
  /** Per-mapping on-chain signature (Capa 6) — cada mapping firmado por separado */
  signature?: MappingSignature;
}

export interface MappingSignature {
  hash: string;
  tx_signature: string;
  explorer_url: string;
  slot: number;
  signed_at: string;
}

export interface MappingExample {
  source_value: string;
  destination_value: string;
}

// ============================================================
// Playbook: the unit of learned behavior
// ============================================================

export interface Playbook {
  id: string;
  name: string;
  /** Natural-language summary of what this playbook does */
  intent: string;
  source_url: string;
  destination_url: string;
  steps: PlaybookAction[];
  mappings: Mapping[];
  parameters: string[];
  recording_id?: string;
  version: number;
  created_at: string;
  /** Hash de los mappings + steps, registrado en Solana (Capa 6) */
  provenance?: SolanaProvenance;
  /** Costos de aprendizaje (USD) breakdown por capa */
  cost_breakdown?: CostBreakdown;
  /** Latencia (ms) breakdown por capa */
  latency_breakdown?: LatencyBreakdown;
  /** Self-examen — crítica honesta que Themis se hace post-aprendizaje */
  self_critique?: PlaybookCritique;
}

export interface PlaybookCritique {
  overall_grade: "A+" | "A" | "B" | "C" | "D" | "F";
  summary: string;
  weakest_mapping?: string | null;
  risks: string[];
  improvements: string[];
}

export interface CostBreakdown {
  capa1_claude_usd: number;
  capa1_browserbase_usd: number;
  capa2_elevenlabs_usd: number;
  capa2_whisper_usd: number;
  capa3_gemini_usd: number;
  capa6_solana_usd: number;
  total_usd: number;
}

export interface LatencyBreakdown {
  total_ms: number;
  claude_ms: number;
  browserbase_ms: number;
  solana_ms: number;
  other_ms: number;
}

// ============================================================
// Solana on-chain provenance (Capa 6)
// ============================================================

export interface SolanaProvenance {
  /** SHA-256 hash of the playbook JSON at learning time */
  playbook_hash: string;
  /** Solana transaction signature */
  tx_signature: string;
  /** Solana network: devnet | mainnet-beta */
  network: "devnet" | "mainnet-beta";
  /** Solana Explorer URL for verification */
  explorer_url: string;
  /** Slot at which the tx was confirmed */
  slot: number;
  registered_at: string;
}

// ============================================================
// Execution (running a playbook)
// ============================================================

export type ExecutionStatus =
  | "pending"
  | "running"
  | "succeeded"
  | "failed";

export interface ExecutionLog {
  step_index: number;
  action: PlaybookAction;
  status: "succeeded" | "failed" | "retrying" | "adapting";
  screenshot_url?: string;
  duration_ms: number;
  error?: string;
  /** If the step was self-healed via vision fallback, this captures the adaptation */
  adapted_from?: string;
  adapted_to?: string;
  timestamp: string;
}

export interface Execution {
  id: string;
  playbook_id: string;
  parameters: Record<string, unknown>;
  status: ExecutionStatus;
  current_step_index: number;
  logs: ExecutionLog[];
  started_at: string;
  ended_at?: string;
  /** Costos USD de esta ejecución (Browserbase + Stagehand/Claude) */
  cost_breakdown?: CostBreakdown;
  /** Latencias ms breakdown */
  latency_breakdown?: LatencyBreakdown;
}

// ============================================================
// Recording (raw output of teach mode)
// ============================================================

export type RecordingEventType = "dom_event" | "screenshot" | "narration";

export interface RecordingEvent {
  timestamp_ms: number;
  type: RecordingEventType;
  /** Shape depends on `type` — DOM event JSON, screenshot URL, transcript chunk */
  data: unknown;
}

export interface Recording {
  id: string;
  events: RecordingEvent[];
  audio_transcript?: string;
  screenshots_path?: string;
  source_url?: string;
  destination_url?: string;
  duration_ms: number;
  created_at: string;
}

// ============================================================
// Multi-tenant — Cliente / Tienda (la unidad de negocio Tuali)
// ============================================================

/**
 * Cliente / tienda al que Themis le aprendió un proceso. La unidad de negocio.
 *
 * Tuali atiende miles de tiendas (OXXO, Soriana, Costco, abarrotes). Cada una
 * tiene su catálogo de proveedor distinto y su instancia del ERP distinta.
 * Themis le aprende a UNA, y después replica a las miles.
 *
 * El cliente acumula sus playbooks, sus stats, sus recomendaciones. La
 * onboarding es "pegá la URL del catálogo" — Themis identifica la marca,
 * crea el cliente y arranca a aprender.
 */
export interface Client {
  id: string;
  name: string;
  brand: string; // "OXXO", "Soriana", "Costco", etc.
  emoji: string; // identificador visual rápido
  source_system_name: string; // "Catálogo Arca Continental"
  source_system_url: string;
  destination_system_name: string; // "ERP Tuali"
  destination_system_url: string;
  zone: ZoneContext;
  /** IDs de playbooks aprendidos para este cliente */
  playbook_ids: string[];
  /** Último pedido enviado — base para recomendaciones */
  baseline_skus: Record<string, number>;
  status: "active" | "onboarding" | "paused";
  onboarded_at: string;
  onboarded_via: "url" | "manual" | "preseed";
  /** Stats agregados (calculados desde executions) */
  total_runs?: number;
  avg_seconds?: number;
  last_run_at?: string;
}

// ============================================================
// Cognitive recommendations (Capa 3 — Gemini)
// ============================================================

export interface ZoneContext {
  zone_id: string;
  zone_name: string;
  city: string;
  profile: "universitaria" | "familiar" | "comercial" | "industrial" | "turistica";
  nearby_institutions?: string[];
}

export interface ContextualEvent {
  event_id: string;
  name: string;
  type: "futbol" | "universitario" | "comercial" | "estacional";
  date: string; // ISO date
  impact_zones: string[]; // zone_ids affected
  expected_impact: string; // natural-language description
}

export interface CognitiveRecommendation {
  sku: string;
  base_quantity: number;
  recommended_quantity: number;
  delta_percentage: number; // positivo = aumento, negativo = reducción
  reason: string; // generated by Gemini, in natural language
  driver?: string; // qué evento o factor estacional lo motiva
}

/**
 * Evaluación contextual NO necesariamente ligada a un SKU: ajustes por
 * temporada, acciones operativas, riesgos, oportunidades. Esto es lo que
 * hace la evaluación "útil más allá de comprar producto".
 */
export interface ContextualInsight {
  title: string;
  kind: "aumento" | "reduccion" | "estacional" | "operativo" | "riesgo";
  detail: string;
}

export interface RecommendationContext {
  tendero_id: string;
  zone: ZoneContext;
  upcoming_events: ContextualEvent[];
  historical_baseline: Record<string, number>; // sku → avg quantity
  /** Contexto estacional/temporal investigado vía Deep Research (grounding) */
  seasonal_context?: string;
}

export interface RecommendationsResponse {
  tendero_id: string;
  recommendations: CognitiveRecommendation[];
  contextual_insights: ContextualInsight[];
  overall_justification: string;
  generated_at: string;
}
