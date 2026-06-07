/**
 * Themis — Self-examen post-aprendizaje.
 *
 * Después de extraer un playbook, le pedimos a Claude que actúe como crítica
 * implacable del playbook que acabamos de generar. La crítica se muestra
 * abierta en la UI: el jurado ve a Themis SEÑALANDO sus propias debilidades.
 *
 * Es la respuesta al sesgo "los agentes mienten cuando no saben". Themis
 * publica lo que NO sabe.
 */

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { Playbook } from "@hack4her/playbooks";

const SYSTEM_PROMPT = `Sos un crítico técnico riguroso revisando un playbook que
Themis acaba de extraer por observación. Tu trabajo NO es validar — es señalar
debilidades, riesgos y áreas que necesitan validación humana.

Tono: directo, técnico, sin halagos. Lo que está bien NO importa — solo lo que
podría fallar.

Devolvé SOLO JSON con este shape exacto:
{
  "overall_grade": "A+" | "A" | "B" | "C" | "D" | "F",
  "summary": "frase corta, máximo 20 palabras",
  "weakest_mapping": "source_field del más débil o null",
  "risks": ["string", "string"],     // 2-4 riesgos concretos
  "improvements": ["string", "string"] // 2-3 sugerencias accionables
}

Reglas:
- "grade" baja si: mappings con confianza <0.8, transformations vagas, falta
  de ejemplos, steps con selector_intent ambiguo.
- "risks" deben ser ESPECÍFICOS al playbook, no genéricos ("podría fallar si...").
- "improvements" deben ser ACCIONABLES por un humano en <5min.
- Si todo realmente está perfecto: grade A, summary breve, risks []. Honesto.`;

const ResponseSchema = z.object({
  overall_grade: z.enum(["A+", "A", "B", "C", "D", "F"]),
  summary: z.string().max(200),
  weakest_mapping: z.string().nullable().optional(),
  risks: z.array(z.string()).default([]),
  improvements: z.array(z.string()).default([]),
});

export type SelfCritique = z.infer<typeof ResponseSchema>;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function critiquePlaybook(
  playbook: Playbook,
): Promise<SelfCritique | null> {
  const compact = {
    name: playbook.name,
    intent: playbook.intent,
    source_url: playbook.source_url,
    destination_url: playbook.destination_url,
    steps_count: playbook.steps?.length ?? 0,
    mappings: (playbook.mappings ?? []).map((m) => ({
      source: m.source_field,
      destination: m.destination_field,
      confidence: m.confidence,
      transformation: m.transformation,
      has_example: (m.examples?.length ?? 0) > 0,
    })),
  };

  try {
    const model = process.env.CRITIQUE_MODEL ?? "claude-haiku-4-5";
    const res = await client.messages.create({
      model,
      max_tokens: 600,
      temperature: 0.3,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Playbook a criticar:\n\n${JSON.stringify(compact, null, 2)}`,
        },
      ],
    });

    const text =
      res.content[0]?.type === "text" ? res.content[0].text : "";
    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/, "")
      .replace(/\s*```$/, "")
      .trim();

    const parsed = JSON.parse(cleaned);
    const validated = ResponseSchema.safeParse(parsed);
    if (!validated.success) return null;
    return validated.data;
  } catch (err) {
    console.warn(
      "[self-critique] failed:",
      (err as Error).message.slice(0, 100),
    );
    return null;
  }
}
