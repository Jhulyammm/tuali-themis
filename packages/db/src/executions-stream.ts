/**
 * In-memory streaming store para ejecuciones en curso.
 *
 * En serverless puro esto no sirve (cada lambda es nueva), pero como Vercel
 * mantiene Lambdas "calientes" durante varios minutos, se puede usar para
 * comunicar entre el endpoint que dispara la ejecución y el endpoint que
 * pollea el estado. NO se persiste para queries — eso lo hace
 * executions-store.ts via filesystem/MongoDB.
 *
 * Si una lambda nueva no encuentra el sessionId, devuelve null y el cliente
 * sabe que tiene que mostrar "loading" en vez de mostrar nada.
 */

import type { Execution, ExecutionLog } from "@hack4her/playbooks";

export interface RunningExecution {
  execution: Execution;
  logs: ExecutionLog[];
  sessionId?: string;
  debuggerUrl?: string;
  done: boolean;
  error?: string;
  startedAt: number;
  lastUpdate: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __themis_running_executions: Map<string, RunningExecution> | undefined;
}

function store(): Map<string, RunningExecution> {
  if (!globalThis.__themis_running_executions) {
    globalThis.__themis_running_executions = new Map();
  }
  return globalThis.__themis_running_executions;
}

export function startRunning(executionId: string, execution: Execution): void {
  store().set(executionId, {
    execution,
    logs: [],
    done: false,
    startedAt: Date.now(),
    lastUpdate: Date.now(),
  });
}

export function setSession(
  executionId: string,
  sessionId: string,
  debuggerUrl?: string,
): void {
  const r = store().get(executionId);
  if (!r) return;
  r.sessionId = sessionId;
  r.debuggerUrl = debuggerUrl;
  r.lastUpdate = Date.now();
}

export function appendLog(executionId: string, log: ExecutionLog): void {
  const r = store().get(executionId);
  if (!r) return;
  r.logs.push(log);
  r.execution.logs = r.logs;
  r.lastUpdate = Date.now();
}

export function markDone(
  executionId: string,
  finalExecution: Execution,
): void {
  const r = store().get(executionId);
  if (!r) return;
  r.execution = finalExecution;
  r.logs = finalExecution.logs ?? [];
  r.done = true;
  r.lastUpdate = Date.now();
}

export function markError(executionId: string, message: string): void {
  const r = store().get(executionId);
  if (!r) return;
  r.error = message;
  r.done = true;
  r.lastUpdate = Date.now();
}

export function getRunning(executionId: string): RunningExecution | null {
  return store().get(executionId) ?? null;
}

/**
 * Cleanup ejecuciones viejas (10+ min). Para no acumular memoria entre
 * lambdas calientes.
 */
export function pruneOld(): void {
  const now = Date.now();
  const threshold = 10 * 60 * 1000;
  for (const [k, v] of store().entries()) {
    if (now - v.lastUpdate > threshold) store().delete(k);
  }
}
