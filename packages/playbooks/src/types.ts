/**
 * Playbook = a process learned by demonstration, replayable and generalizable.
 *
 * `selector_intent` describes WHAT to interact with in natural language
 * (e.g. "campo de usuario", "botón guardar"). Stagehand resolves these at
 * runtime using vision + DOM — that resolution is what allows generalization
 * to new pages or layouts that the playbook was never recorded against.
 */

export type PlaybookAction =
  | { action: "navigate"; target: string }
  | { action: "click"; selector_intent: string; selector_hint?: string }
  | { action: "fill"; selector_intent: string; value: string }
  | { action: "select"; selector_intent: string; value: string }
  | { action: "wait_for"; selector_intent: string; timeout_ms?: number }
  | { action: "extract"; selector_intent: string; as: string }
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

export interface Playbook {
  id: string;
  name: string;
  intent: string;
  target_url: string;
  steps: PlaybookAction[];
  parameters: string[];
  recording_id?: string;
  version: number;
  created_at: string;
}

export type ExecutionStatus =
  | "pending"
  | "running"
  | "succeeded"
  | "failed";

export interface ExecutionLog {
  step_index: number;
  action: PlaybookAction;
  status: "succeeded" | "failed" | "retrying";
  screenshot_url?: string;
  duration_ms: number;
  error?: string;
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
}

export type RecordingEventType = "dom_event" | "screenshot" | "narration";

export interface RecordingEvent {
  timestamp_ms: number;
  type: RecordingEventType;
  data: unknown;
}

export interface Recording {
  id: string;
  events: RecordingEvent[];
  audio_transcript?: string;
  screenshots_path?: string;
  duration_ms: number;
  created_at: string;
}
