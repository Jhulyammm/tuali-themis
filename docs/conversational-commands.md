# Conversational Commands — Tuali Operator

> **Contrato técnico** entre Carlos (UI input) y Jhulyam (parser + executor).
> Define exactamente qué comandos entiende el agente, qué retorna el parser, y cómo cada comando se traduce en una acción.
> **Si está en este documento → se soporta. Si no → fallback de "no entendí".**

---

## 1. El principio

El parser es **conservador, no genérico**. Soportamos 5 intents explícitos. Esto:

- Baja el riesgo del demo (no improvisa, no alucina)
- Permite testear cada comando con casos concretos
- Hace la demo predecible bajo presión

**NO queremos un chatbot que "entienda cualquier cosa".** Queremos un parser que **reconoce con precisión** los 5 intents que soportamos.

---

## 2. Los 5 intents soportados

| # | Intent | Para qué | Crítico para demo |
|---|--------|----------|-------------------|
| 1 | `execute_bulk` | Ejecutar un playbook sobre N tiendas filtradas | **SÍ — Acto 3** |
| 2 | `execute_specific` | Ejecutar sobre tiendas listadas por ID | Bonus |
| 3 | `query_executions` | "¿cómo va el lote?" "¿qué pasó hoy?" | Bonus |
| 4 | `list_playbooks` | "¿qué procesos tengo?" | Bonus |
| 5 | `unknown` | Fallback — no entendí | Seguridad |

`execute_bulk` es el único que **debe funcionar** para el demo. Los otros 4 son nice-to-have. Si en hora 22 solo funciona `execute_bulk` → suficiente.

---

## 3. Schema (Zod) — la verdad de la interfaz

`packages/agent/src/llm/command-schema.ts`:

```typescript
import { z } from "zod";

// === Intent: execute_bulk ===
export const ExecuteBulkSchema = z.object({
  intent: z.literal("execute_bulk"),
  playbook_id: z.string().describe("ID del playbook a ejecutar"),
  filter: z.object({
    tipo: z.string().optional().describe("Tipo de tienda: OXXO, 7-Eleven, etc."),
    zona: z.string().optional().describe("Zona/región: Querétaro, León, etc."),
    ciudad: z.string().optional().describe("Ciudad específica"),
  }),
  parameters: z.record(z.unknown()).describe("Parámetros del playbook"),
});

// === Intent: execute_specific ===
export const ExecuteSpecificSchema = z.object({
  intent: z.literal("execute_specific"),
  playbook_id: z.string(),
  store_ids: z.array(z.string()).min(1).max(50),
  parameters: z.record(z.unknown()),
});

// === Intent: query_executions ===
export const QueryExecutionsSchema = z.object({
  intent: z.literal("query_executions"),
  filter: z.object({
    status: z.enum(["succeeded", "failed", "running", "all"]).default("all"),
    since: z.enum(["today", "this_week", "all_time"]).default("today"),
  }).optional(),
});

// === Intent: list_playbooks ===
export const ListPlaybooksSchema = z.object({
  intent: z.literal("list_playbooks"),
});

// === Intent: unknown ===
export const UnknownSchema = z.object({
  intent: z.literal("unknown"),
  user_message: z.string(),
  suggestion: z.string().describe("Qué crees que el usuario quería"),
});

// === Discriminated union ===
export const CommandSchema = z.discriminatedUnion("intent", [
  ExecuteBulkSchema,
  ExecuteSpecificSchema,
  QueryExecutionsSchema,
  ListPlaybooksSchema,
  UnknownSchema,
]);

export type Command = z.infer<typeof CommandSchema>;
```

---

## 4. System prompt para Claude (el parser)

`packages/agent/src/llm/command-parser-prompt.ts`:

```typescript
export const COMMAND_PARSER_PROMPT = `Eres el parser de comandos del agente Tuali Operator. Tu única tarea es convertir un comando en español del usuario a un JSON estructurado.

# Intents soportados (SOLO estos)

1. execute_bulk      — ejecutar un playbook en tiendas filtradas por tipo/zona/ciudad
2. execute_specific  — ejecutar en tiendas listadas por ID
3. query_executions  — preguntar sobre estado de ejecuciones
4. list_playbooks    — listar procesos aprendidos
5. unknown           — fallback cuando no encajas en los 4 anteriores

# Playbooks disponibles (contexto inyectado en runtime)

{{AVAILABLE_PLAYBOOKS}}

# Filtros válidos

- tipo: "OXXO" | "7-Eleven" | "Walmart" | "Soriana" | "abarrotes"
- zona: "Querétaro" | "León" | "Guadalajara" | "Monterrey" | "Ciudad de México"
- ciudad: cualquier ciudad mexicana

# Reglas estrictas

1. Responde ÚNICAMENTE con un JSON válido del schema. Sin texto extra.
2. Si el comando es ambiguo o no encaja, intent="unknown" con suggestion explicando qué entendiste.
3. Si el comando dice "todas las X de Y" → execute_bulk con filter
4. Si el comando lista IDs específicos → execute_specific
5. Si pregunta por estado / cuenta / historia → query_executions
6. Si pide ver/listar lo que sabe hacer → list_playbooks

# Ejemplos

Input: "Actualiza surtido de Coca 600ml a 50 unidades en todas las OXXO de Querétaro"
Output:
{
  "intent": "execute_bulk",
  "playbook_id": "actualizar-surtido-por-tienda",
  "filter": { "tipo": "OXXO", "zona": "Querétaro" },
  "parameters": { "sku": "Coca 600ml", "quantity": 50 }
}

Input: "Captura 30 unidades de Sprite 500ml en las tiendas 1234, 5678 y 9012"
Output:
{
  "intent": "execute_specific",
  "playbook_id": "actualizar-surtido-por-tienda",
  "store_ids": ["1234", "5678", "9012"],
  "parameters": { "sku": "Sprite 500ml", "quantity": 30 }
}

Input: "¿Cómo va el lote?"
Output:
{
  "intent": "query_executions",
  "filter": { "status": "running", "since": "today" }
}

Input: "Lista mis playbooks"
Output: { "intent": "list_playbooks" }

Input: "Hazme un café"
Output:
{
  "intent": "unknown",
  "user_message": "Hazme un café",
  "suggestion": "Solo puedo ejecutar playbooks aprendidos o responder sobre el estado del sistema."
}
`;
```

**Nota:** `{{AVAILABLE_PLAYBOOKS}}` se reemplaza en runtime con la lista de playbooks de la BD. Esto le da a Claude el contexto exacto de qué puede ejecutar.

---

## 5. La lógica del parser

`packages/agent/src/llm/command-parser.ts`:

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { CommandSchema, type Command } from "./command-schema";
import { COMMAND_PARSER_PROMPT } from "./command-parser-prompt";

const client = new Anthropic();

export async function parseCommand(
  userInput: string,
  availablePlaybooks: Array<{ id: string; name: string; intent: string }>,
): Promise<Command> {
  const systemPrompt = COMMAND_PARSER_PROMPT.replace(
    "{{AVAILABLE_PLAYBOOKS}}",
    availablePlaybooks
      .map((p) => `- ${p.id}: ${p.name} — ${p.intent}`)
      .join("\n"),
  );

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    temperature: 0.1, // Baja para consistencia
    system: systemPrompt,
    messages: [{ role: "user", content: userInput }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const json = JSON.parse(text);
  return CommandSchema.parse(json); // Lanza si no encaja
}
```

**Errores manejados:**
- `JSON.parse` falla → fallback a `{ intent: "unknown", user_message: userInput, suggestion: "..." }`
- `CommandSchema.parse` falla → mismo fallback
- API timeout (>5s) → mismo fallback con "intenta de nuevo más simple"

---

## 6. Test cases obligatorios

Carlos y Jhulyam: estos casos DEBEN pasar antes del demo.

`packages/agent/src/llm/__tests__/parser.test.ts` (o un script manual):

| # | Input | Expected intent | Critical fields |
|---|-------|-----------------|-----------------|
| 1 | "Actualiza surtido de Coca 600ml a 50 en todas las OXXO de Querétaro" | execute_bulk | filter.tipo="OXXO", filter.zona="Querétaro", parameters.sku="Coca 600ml", parameters.quantity=50 |
| 2 | "Captura 30 unidades de Sprite 500ml en tiendas 1234, 5678" | execute_specific | store_ids=["1234","5678"] |
| 3 | "Genera pedido sugerido para todas las OXXO de León" | execute_bulk | playbook_id="generar-pedido-sugerido", filter |
| 4 | "¿Cómo va el lote actual?" | query_executions | filter.status="running" |
| 5 | "¿Qué pasó con las ejecuciones de hoy?" | query_executions | filter.since="today" |
| 6 | "¿Qué procesos tengo aprendidos?" | list_playbooks | — |
| 7 | "Lista todos los playbooks" | list_playbooks | — |
| 8 | "Detén el lote" | unknown | suggestion menciona "cancel" no soportado aún |
| 9 | "Hola, ¿cómo estás?" | unknown | suggestion redirige a casos válidos |
| 10 | "Quiero hacer algo complicado con 5 sistemas" | unknown | suggestion menciona ambigüedad |

**Si los 10 pasan consistentemente** → parser está listo para demo.

---

## 7. UX cuando el parser responde

Carlos: la UI debe manejar cada intent distinto. Sin esto, el parser correcto no sirve.

### `execute_bulk` / `execute_specific`

**No ejecutar automáticamente.** Mostrar resumen + botón de confirmación:

```
┌─ Agente Tuali ──────────────────────────────────────┐
│                                                     │
│ Entendido. Voy a ejecutar:                          │
│                                                     │
│   Playbook: Actualizar surtido por tienda           │
│   Tiendas: 30 (OXXO en Querétaro)                   │
│   Parámetros: { sku: "Coca 600ml", quantity: 50 }   │
│                                                     │
│   [▶ Ejecutar 30 instancias]   [Cancelar]           │
└─────────────────────────────────────────────────────┘
```

### `query_executions`

Stream de respuesta natural:

```
Tú: ¿Cómo va el lote?

Agente: El lote actual ("Actualizar surtido en OXXO Querétaro")
lleva 16 de 30 ejecuciones. 14 exitosas, 0 fallidas, 5 en curso,
11 pendientes. Tiempo restante estimado: 8:24.
```

Internamente Claude llama tools del backend para obtener datos reales, NO inventa números.

### `list_playbooks`

Lista renderizada como cards (mismo componente del Dashboard):

```
Tú: ¿Qué playbooks tengo?

Agente: Tienes 4 procesos aprendidos:

1. Actualizar surtido por tienda (32 ejecuciones, 97% éxito)
2. Generar pedido sugerido (1 ejecución, 100% éxito)
3. Validar precios promocionales (8 ejecuciones, 88% éxito)
4. Conciliar inventario semanal (5 ejecuciones, 100% éxito)
```

### `unknown`

Tono helpful, no robótico:

```
Tú: Hazme un café

Agente: No entendí eso. Solo puedo:
- Ejecutar procesos aprendidos
- Decirte cómo van las ejecuciones
- Listar tus playbooks

¿Quieres que te muestre lo que sé hacer?
```

---

## 8. Riesgos y mitigaciones

| Riesgo | Probabilidad | Mitigación |
|--------|--------------|------------|
| Claude alucina un playbook_id que no existe | Media | El parser tiene la lista real en su prompt. Después de parsear, validar contra BD antes de ejecutar. Si no existe → mostrar "no encontré ese proceso, ¿quieres decir X?" |
| Comandos en spanglish o con typos | Media | Few-shot examples en el prompt incluyen variantes. Temperatura 0.1. |
| Parser tarda >5 seg | Media | Loading state visible. Si timeout → unknown fallback. |
| Usuario espera comandos no soportados | Alta | El `unknown` fallback explica QUÉ puede hacer. No deja al usuario perdido. |
| Demo: el comando crítico del Acto 3 falla en vivo | Alta | **Hardcodear** el comando exacto del demo en una variante del system prompt que da máxima prioridad a ese patrón. Probar 20 veces antes. |

---

## 9. Checklist de implementación

**Jhulyam (hora 18-22):**
- [ ] Schema Zod implementado en `packages/agent/src/llm/command-schema.ts`
- [ ] Prompt en `command-parser-prompt.ts`
- [ ] Función `parseCommand()` en `command-parser.ts`
- [ ] Endpoint `/api/parse-command` en `apps/operator-ui` que llama esta función
- [ ] Los 10 test cases pasan
- [ ] Manejo de errores: JSON.parse fail, Zod fail, timeout
- [ ] Logging de cada comando para debug durante el hack

**Carlos (hora 18-22):**
- [ ] Componente `<ChatComposer>` envía a `/api/parse-command`
- [ ] Componente `<CommandConfirmation>` para mostrar el resumen de execute_bulk
- [ ] Componente `<ExecutionsQueryResult>` para query_executions
- [ ] Componente `<PlaybooksList>` para list_playbooks
- [ ] Componente `<UnknownFallback>` con sugerencias de acciones
- [ ] Botón "Ejecutar" dispara endpoint `/api/execute-bulk` con el comando parseado

**Conjuntos (hora 22-24):**
- [ ] End-to-end: usuario tipea → parser → confirmación → ejecutor → bulk dashboard
- [ ] Demo run: el comando exacto del Acto 3 funciona 5 veces seguidas sin fallo

---

## 10. El comando EXACTO del demo (memorizar)

Este es el comando que María usa en el minuto 9:08 del [walkthrough](./concept-walkthrough.md):

> **"Actualiza surtido de Coca 600ml a 50 unidades en todas las OXXO de Querétaro."**

**Esto debe funcionar 100% de las veces.** Si hay un comando que vale la pena hardcodear como fallback determinístico (sin Claude) → es este.

Sugerencia de defensa en profundidad:
1. Primer intento: parser con Claude (normal)
2. Si parser falla o demora > 3s: matcher de regex específico para este comando
3. Si ambos fallan: hardcode el resultado y avanza

**Tres capas. Cero excusas para fallar en vivo.**
