/**
 * Themis — Executor (Capa 1 · Modo Automatización)
 *
 * Toma un Playbook aprendido + parámetros nuevos, lo ejecuta autónomamente
 * en automationexercise.com (Sistema A) → erp-destino (Sistema B) via Stagehand.
 *
 * Cuando un selector_intent no resuelve por DOM, cae al self-healing:
 * vision fallback con Claude. Esto es lo que hace que el demo del Acto 4 funcione.
 *
 * Owner: Jhulyam
 */

import { Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";
import type {
  Execution,
  ExecutionLog,
  Playbook,
  PlaybookAction,
} from "@hack4her/playbooks";
import { selfHealStep } from "./self-healing";

// ============================================================
// Public API
// ============================================================

export interface ExecutorConfig {
  /** Parámetros para sustituir en el playbook (store_id, sku, quantity, etc.) */
  parameters: Record<string, unknown>;
  /** Callback fired on cada paso completado (para UI live) */
  onStepUpdate?: (log: ExecutionLog) => void;
  /** Callback fired cuando hace self-healing */
  onSelfHealing?: (step: PlaybookAction) => void;
  /** Headless mode (true en servidor, false para debug local) */
  headless?: boolean;
  /** Timeout total de la ejecución en ms; default 5 min */
  timeoutMs?: number;
}

export async function executePlaybook(
  playbook: Playbook,
  config: ExecutorConfig,
): Promise<Execution> {
  const execution: Execution = {
    id: crypto.randomUUID(),
    playbook_id: playbook.id,
    parameters: config.parameters,
    status: "running",
    current_step_index: 0,
    logs: [],
    started_at: new Date().toISOString(),
  };

  const stagehand = new Stagehand({
    env: "BROWSERBASE",
    apiKey: process.env.BROWSERBASE_API_KEY,
    projectId: process.env.BROWSERBASE_PROJECT_ID,
    headless: config.headless ?? true,
    modelName: "claude-3-5-sonnet-latest",
    modelClientOptions: { apiKey: process.env.ANTHROPIC_API_KEY },
  });

  try {
    await stagehand.init();

    // Setup context for parameter substitution + extracted variables
    const context: Record<string, unknown> = { ...config.parameters };

    // Switch al origen inicial
    if (playbook.source_url) {
      await stagehand.page.goto(playbook.source_url);
    }

    // Run steps secuencialmente
    for (let i = 0; i < playbook.steps.length; i++) {
      execution.current_step_index = i;
      const step = playbook.steps[i];
      const log = await runStep(stagehand, step, context, i, config);
      execution.logs.push(log);
      config.onStepUpdate?.(log);

      if (log.status === "failed") {
        execution.status = "failed";
        break;
      }
    }

    if (execution.status === "running") execution.status = "succeeded";
  } catch (err) {
    execution.status = "failed";
    execution.logs.push({
      step_index: execution.current_step_index,
      action: playbook.steps[execution.current_step_index] ?? {
        action: "navigate",
        target: "(unknown)",
      },
      status: "failed",
      duration_ms: 0,
      error: (err as Error).message,
      timestamp: new Date().toISOString(),
    });
  } finally {
    await stagehand.close();
  }

  execution.ended_at = new Date().toISOString();
  return execution;
}

// ============================================================
// Step runner
// ============================================================

async function runStep(
  stagehand: Stagehand,
  step: PlaybookAction,
  context: Record<string, unknown>,
  index: number,
  config: ExecutorConfig,
): Promise<ExecutionLog> {
  const started = Date.now();
  const baseLog: Omit<ExecutionLog, "status" | "duration_ms"> = {
    step_index: index,
    action: step,
    timestamp: new Date().toISOString(),
  };

  try {
    switch (step.action) {
      case "navigate":
        await stagehand.page.goto(interpolate(step.target, context));
        break;

      case "switch_system":
        // Para nuestro demo: switch entre Sistema A (automationexercise) y B (erp-destino)
        if (step.target === "destination") {
          await stagehand.page.goto(
            process.env.NEXT_PUBLIC_ERP_DESTINO_URL ?? "http://localhost:3001",
          );
        } else if (step.target === "source") {
          await stagehand.page.goto(
            process.env.NEXT_PUBLIC_SOURCE_SYSTEM_URL ??
              "https://automationexercise.com",
          );
        } else {
          await stagehand.page.goto(interpolate(step.target, context));
        }
        break;

      case "click":
        await stagehand.act({
          action: `click ${interpolate(step.selector_intent, context)}`,
        });
        break;

      case "fill": {
        const intent = interpolate(step.selector_intent, context);
        const value = interpolate(step.value, context);
        await stagehand.act({
          action: `type "${value}" into ${intent}`,
        });
        break;
      }

      case "select": {
        const intent = interpolate(step.selector_intent, context);
        const value = interpolate(step.value, context);
        await stagehand.act({
          action: `select "${value}" in ${intent}`,
        });
        break;
      }

      case "wait_for":
        await stagehand.page.waitForSelector(
          `text=${interpolate(step.selector_intent, context).slice(0, 50)}`,
          { timeout: step.timeout_ms ?? 5000 },
        );
        break;

      case "extract": {
        const intent = interpolate(step.selector_intent, context);
        const result = await stagehand.extract({
          instruction: `Extract: ${intent}`,
          schema: z.object({ value: z.string() }),
        });
        context[step.as] = result.value;
        break;
      }

      case "extract_list": {
        const intent = interpolate(step.selector_intent, context);
        const schemaShape = Object.fromEntries(
          step.fields.map((f) => [f.name, z.string()]),
        );
        const result = await stagehand.extract({
          instruction: `Extract list: ${intent}. Fields: ${step.fields.map((f) => f.name).join(", ")}`,
          schema: z.object({ items: z.array(z.object(schemaShape)) }),
        });
        context[step.as] = result.items;
        break;
      }

      case "for_each": {
        const items = context[step.input_var];
        if (!Array.isArray(items)) {
          throw new Error(`for_each: input_var "${step.input_var}" is not an array`);
        }
        for (const item of items) {
          const itemContext = { ...context, [step.as]: item };
          for (let j = 0; j < step.steps.length; j++) {
            await runStep(stagehand, step.steps[j], itemContext, index, config);
          }
        }
        break;
      }

      case "if": {
        const truthy = evaluateCondition(step.condition, context);
        const branch = truthy ? step.then : step.else ?? [];
        for (let j = 0; j < branch.length; j++) {
          await runStep(stagehand, branch[j], context, index, config);
        }
        break;
      }
    }

    return {
      ...baseLog,
      status: "succeeded",
      duration_ms: Date.now() - started,
    };
  } catch (err) {
    // Self-healing fallback
    config.onSelfHealing?.(step);
    try {
      const healing = await selfHealStep(stagehand, step, context);
      return {
        ...baseLog,
        status: "succeeded",
        duration_ms: Date.now() - started,
        adapted_from: getSelectorIntent(step) ?? undefined,
        adapted_to: healing.adapted_to,
      };
    } catch (healErr) {
      return {
        ...baseLog,
        status: "failed",
        duration_ms: Date.now() - started,
        error: `${(err as Error).message} | heal failed: ${(healErr as Error).message}`,
      };
    }
  }
}

// ============================================================
// Helpers
// ============================================================

/**
 * Sustituye {variable} en una string usando el contexto actual.
 * Ejemplo: "campo de {sku}" + context={sku:"Coca 600ml"} → "campo de Coca 600ml"
 */
function interpolate(template: string, context: Record<string, unknown>): string {
  return template.replace(/\{([^}]+)\}/g, (_, key) => {
    const path = key.trim().split(".");
    let value: unknown = context;
    for (const segment of path) {
      if (value && typeof value === "object") {
        value = (value as Record<string, unknown>)[segment];
      } else {
        return `{${key}}`; // unresolved → leave placeholder
      }
    }
    return value === undefined ? `{${key}}` : String(value);
  });
}

/**
 * Evalúa condiciones simples como "{store.tipo} == OXXO" o "{count} > 5".
 * No es full JS eval — solo equality / comparison entre interpoladas.
 */
function evaluateCondition(
  condition: string,
  context: Record<string, unknown>,
): boolean {
  const interpolated = interpolate(condition, context);
  if (/==|!=|>|<|>=|<=/.test(interpolated)) {
    const [left, op, right] = interpolated.split(/\s*(==|!=|>=|<=|>|<)\s*/);
    const l = parseFloat(left) || left;
    const r = parseFloat(right) || right;
    switch (op) {
      case "==":
        return l == r;
      case "!=":
        return l != r;
      case ">":
        return l > r;
      case "<":
        return l < r;
      case ">=":
        return l >= r;
      case "<=":
        return l <= r;
    }
  }
  return !!interpolated.trim();
}

function getSelectorIntent(step: PlaybookAction): string | undefined {
  if ("selector_intent" in step) return step.selector_intent;
  return undefined;
}
