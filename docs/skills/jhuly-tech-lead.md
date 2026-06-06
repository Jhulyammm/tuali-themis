# Skill — Jhulyam (Tech Lead / Agent Engineer)

> Destilado de `docs/references/skills/agent-harness-construction/SKILL.md`
> Léelo en hora 0. ~3 min.

## La idea central

La calidad de un agente está limitada por **4 cosas, en este orden**:

1. **Action space quality** — qué tools le das, cómo están definidos
2. **Observation quality** — qué le devuelven los tools cuando los llama
3. **Recovery quality** — cómo se recupera de errores
4. **Context budget quality** — qué mete y qué saca de su contexto

Tu trabajo es maximizar las 4 simultáneamente.

## Diseño de tools (action space)

- **Nombres estables y explícitos.** `record_dom_event` no `track`.
- **Schemas estrechos.** Cada parámetro tiene tipo y propósito claro. Usa Zod.
- **Outputs deterministas.** Mismo input → misma shape de output, siempre.
- **Evita tools "catch-all"** salvo que la isolation sea imposible.

### Granularidad

| Tipo de operación | Tamaño de tool |
|---|---|
| Riesgo alto (ejecutar playbook, modificar datos) | **Micro-tools** — granular, auditable |
| Loops comunes (read DOM, click, fill) | **Medio** |
| Solo cuando el round-trip domina el costo | **Macro** |

Para nuestro caso: usa **medio** para acciones de Stagehand (click/fill/navigate), **micro** para guardar/ejecutar playbooks.

## Diseño de observaciones

Cada respuesta de tool debe incluir:

```typescript
{
  status: "success" | "warning" | "error",
  summary: string,           // una línea
  next_actions: string[],    // qué puede hacer Claude después
  artifacts: { path: string, id: string }[]
}
```

Si solo devuelves "ok" / "error", Claude no sabe qué hacer.

## Recovery (CRÍTICO para este hackathon)

Para **CADA path de error**, incluye:

- **Root cause hint** — *"selector no encontrado, página probablemente cambió"*
- **Safe retry instruction** — *"reintenta con timeout 5s, o pide screenshot"*
- **Explicit stop condition** — *"después de 3 retries, falla y reporta"*

Sin esto, el agente entra en loops infinitos o falla silencioso. En demo en vivo = muerte.

## Context budget

1. **System prompt mínimo e invariante.**
2. **Guidance grande va en skills cargados on-demand**, no en system.
3. **Referencias a archivos** > inlining de documentos largos.
4. **Compacta en phase boundaries** (modo enseñar → modo ejecutar), no en thresholds arbitrarios.

## Arquitectura: usa híbrido

- **ReAct** para planeación exploratoria (¿cómo generalizo este playbook?)
- **Function-calling** para ejecución determinista (run step N de playbook)
- **Híbrido (recomendado): ReAct planning + typed tool execution**

Para nosotros: Claude planifica la generalización con ReAct, luego ejecuta cada paso con tools tipados (Stagehand actions).

## Anti-patterns (cosas que NO hagas)

- Tools con semántica que se solapa (`click_button` y `click_element` → confusión)
- Output opaco sin recovery hints
- Errores sin next_actions
- Meter referencias irrelevantes al contexto "por si acaso"

## Lo que debes trackear desde hora 8

- `completion_rate` — % de playbooks que se ejecutan end-to-end
- `retries_per_task` — promedio de reintentos por step
- `cost_per_successful_run` — Claude tokens × Browserbase minutos

Si pasas hora 24 con completion < 60%, tira features y arregla recovery.

---

**Lectura secundaria (hora 8-16):** `docs/references/skills/click-path-audit/SKILL.md` para grabación de DOM.
