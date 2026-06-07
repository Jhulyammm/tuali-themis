/**
 * @hack4her/agent — Themis core: aprende, ejecuta, razona, recuerda, prueba.
 *
 * Structure (owner: Jhulyam):
 *   teach/        Capa 1 — Recorder (DOM events + screenshots + narración)
 *   playbook/     Capa 1 — Extractor (Recording → Playbook via Claude)
 *   execute/      Capa 1 — Executor (Stagehand + self-healing)
 *   cognitive/    Capa 3 — Gemini contextual recommendations
 *   blockchain/   Capa 6 — Solana on-chain provenance
 *   llm/          shared Claude/Anthropic helpers
 */

export type {
  Playbook,
  PlaybookAction,
  Mapping,
  MappingExample,
  Execution,
  ExecutionStatus,
  ExecutionLog,
  Recording,
  RecordingEvent,
  SolanaProvenance,
  ZoneContext,
  ContextualEvent,
  CognitiveRecommendation,
  RecommendationContext,
  RecommendationsResponse,
} from "@hack4her/playbooks";

// Capa 1 — Observación
export { Recorder, recordOnce } from "./teach/recorder";
export type { RecorderConfig } from "./teach/recorder";

// Capa 1 — Extracción
export { extractPlaybookFromRecording } from "./playbook/extractor";

// Capa 1 — Live mapping inference (durante observación)
export {
  inferPartialMappings,
  partialToMapping,
} from "./playbook/live-mapping-inference";
export type { PartialMapping } from "./playbook/live-mapping-inference";

// Capa 3 — Razonamiento contextual
export { generateRecommendations } from "./cognitive/gemini-recommendations";

// Capa 6 — Provenance on-chain
export { SolanaProvenanceClient, sha256Hex } from "./blockchain/solana-client";

// Capa 1 — Ejecución
export { executePlaybook } from "./execute/executor";
export type { ExecutorConfig } from "./execute/executor";

// Capa 1 — Self-healing (vision fallback)
export { selfHealStep } from "./execute/self-healing";
export type { SelfHealingResult } from "./execute/self-healing";

// Capa 1 — Browser session pool (live view + observation + execution sharing)
export {
  createSession,
  getHandle,
  getStagehand,
  snapshot,
  closeSession,
  listSessions,
} from "./browser/session-manager";
export type {
  BrowserSnapshot,
  SessionHandle,
  CreateSessionOpts,
} from "./browser/session-manager";
