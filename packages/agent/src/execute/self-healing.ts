/**
 * Themis — Self-Healing (Capa 1 · vision fallback)
 *
 * Cuando Stagehand normal falla en resolver un selector_intent (porque el
 * portal cambió, el label se renombró, etc.), caemos aquí:
 *   1. Tomar screenshot de la página actual
 *   2. Pedirle a Claude Vision: "este es el contexto, busca el elemento
 *      semánticamente equivalente"
 *   3. Re-intentar la acción con la guía visual
 *
 * Este es el momento del Acto 4 (self-healing demo) — el wow más fuerte
 * después del Solana provenance.
 *
 * Owner: Jhulyam
 */

import Anthropic from "@anthropic-ai/sdk";
import type { Stagehand } from "@browserbasehq/stagehand";
import type { PlaybookAction } from "@hack4her/playbooks";

export interface SelfHealingResult {
  adapted_to: string;
  vision_reasoning: string;
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function selfHealStep(
  stagehand: Stagehand,
  step: PlaybookAction,
  context: Record<string, unknown>,
): Promise<SelfHealingResult> {
  const intent = "selector_intent" in step ? step.selector_intent : undefined;
  if (!intent) {
    throw new Error("Cannot self-heal action without selector_intent");
  }

  const interpolatedIntent = interpolate(intent, context);

  // 1. Screenshot the current page
  const screenshotBuffer = await stagehand.page.screenshot({
    type: "png",
    fullPage: false,
  });
  const screenshotBase64 = screenshotBuffer.toString("base64");

  // 2. Ask Claude Vision to find the semantic equivalent
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/png",
              data: screenshotBase64,
            },
          },
          {
            type: "text",
            text: `Eres Themis. Acabo de fallar al resolver este selector_intent en la página actual:

"${interpolatedIntent}"

Mira la imagen. Encuentra el elemento semánticamente equivalente — el label puede haber cambiado, el campo puede estar en otra posición, etc.

Responde EXACTAMENTE en este formato JSON:
{
  "found": true | false,
  "new_intent": "descripción del elemento ahora, en lenguaje natural",
  "reasoning": "qué cambió y por qué este es el equivalente"
}

Si no lo encuentras, found: false.`,
          },
        ],
      },
    ],
  });

  const text =
    response.content[0]?.type === "text" ? response.content[0].text : "";
  const parsed = parseHealingResponse(text);

  if (!parsed.found || !parsed.new_intent) {
    throw new Error(
      `Vision could not find a semantic equivalent. Reasoning: ${parsed.reasoning}`,
    );
  }

  // 3. Re-try la acción con el nuevo intent
  const newAction = rebuildActionWithIntent(step, parsed.new_intent, context);
  if (newAction) {
    await stagehand.page.act(newAction);
  }

  return {
    adapted_to: parsed.new_intent,
    vision_reasoning: parsed.reasoning,
  };
}

// ============================================================
// Helpers
// ============================================================

interface HealingResponse {
  found: boolean;
  new_intent: string | null;
  reasoning: string;
}

function parseHealingResponse(text: string): HealingResponse {
  // Claude a veces wrappea en ```json
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/\s*```$/, "")
    .trim();
  try {
    const obj = JSON.parse(cleaned) as Partial<HealingResponse>;
    return {
      found: !!obj.found,
      new_intent: obj.new_intent ?? null,
      reasoning: obj.reasoning ?? "(sin razón)",
    };
  } catch {
    return {
      found: false,
      new_intent: null,
      reasoning: "Failed to parse vision response: " + text.slice(0, 200),
    };
  }
}

function rebuildActionWithIntent(
  step: PlaybookAction,
  newIntent: string,
  context: Record<string, unknown>,
): string | null {
  switch (step.action) {
    case "click":
      return `click ${newIntent}`;
    case "fill":
      return `type "${interpolate(step.value, context)}" into ${newIntent}`;
    case "select":
      return `select "${interpolate(step.value, context)}" in ${newIntent}`;
    case "extract":
      return null; // extract uses different mechanism, handled by caller
    default:
      return null;
  }
}

function interpolate(template: string, context: Record<string, unknown>): string {
  return template.replace(/\{([^}]+)\}/g, (_, key) => {
    const path = key.trim().split(".");
    let value: unknown = context;
    for (const segment of path) {
      if (value && typeof value === "object") {
        value = (value as Record<string, unknown>)[segment];
      } else {
        return `{${key}}`;
      }
    }
    return value === undefined ? `{${key}}` : String(value);
  });
}
