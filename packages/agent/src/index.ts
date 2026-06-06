/**
 * @hack4her/agent — Claude + Computer Use + Stagehand orchestration.
 *
 * Structure (owner: Jhulyam):
 *   teach/      record DOM events + screenshots + narration → Recording
 *   playbook/   extract Playbook from Recording (LLM-driven)
 *   execute/    run Playbook against a target site, with generalization
 *   llm/        Anthropic Claude wrappers
 */

export type {
  Playbook,
  PlaybookAction,
  Execution,
  ExecutionStatus,
  ExecutionLog,
  Recording,
  RecordingEvent,
} from "@hack4her/playbooks";

// To be implemented (hora 2-24):
// export { recordPlaybook } from "./teach/recorder";
// export { extractPlaybookFromRecording } from "./playbook/extractor";
// export { executePlaybook } from "./execute/executor";
// export { generalizePlaybook } from "./execute/generalizer";
