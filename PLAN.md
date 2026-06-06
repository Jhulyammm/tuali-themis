# Themis — Plan de Producto y Estado del MVP

> **Hack4Her 2026** · Reto Always on Shelf (Tuali / Arca Continental)
> **Themis** — diosa griega del orden divino y la balanza justa.
> Agente cognitivo verificable que aprende procesos web por observación.

> *"Implementar EDI toma 6 meses. Themis trae orden en 90 segundos."*

---

## 1. El producto en una frase

Un agente que **observa** un proceso entre dos sistemas web UNA vez, **aprende el mapeo de campos** con Claude, **firma el aprendizaje en blockchain** con Solana, y después **ejecuta el proceso autónomamente** con Stagehand — adaptándose si los sistemas cambian.

---

## 2. Cómo cumplimos el reto del PDF de organizadores

El PDF define **3 fases obligatorias**. Aquí está dónde vive cada una:

| Fase del PDF | Implementación | Endpoint / página |
|--------------|----------------|-------------------|
| **Conexión** a los 2 sistemas | Stagehand abre Browserbase + apunta a Sistema A (origen) y B (destino) | `packages/agent/src/execute/executor.ts` |
| **Observación** del proceso | Operador hace el flujo, Themis recibe la grabación y la manda a Claude | `/api/playbook/extract` |
| **Automatización** autónoma | Stagehand corre el playbook con datos nuevos | `/api/execute` + `/execute` page |

Y respondemos a los **4 criterios de la rúbrica**:

| Criterio | Cómo lo demostramos |
|----------|---------------------|
| 1. Aprendizaje por observación (NO hardcoded) | `selector_intent` natural en el playbook + **Solana on-chain provenance** + memory recall |
| 2. Reproducción autónoma | Stagehand corre el playbook contra **automationexercise.com real** |
| 3. Exactitud campo-por-campo | Página `/validate` side-by-side: lo extraído vs lo escrito |
| 4. Replicabilidad (opcional) | Capa 4 (memory graph) + Capa 3 (razonamiento contextual) demuestran extensibilidad |

---

## 3. Las 6 capas de Themis (estado actual)

| # | Capa | Tecnología | Status | MLH Prize |
|---|------|-----------|--------|-----------|
| 1 | **Core agent** — aprende, ejecuta, mapea | Claude Sonnet 4 + Stagehand + Browserbase | ✅ LIVE | — |
| 2 | **Voice narration** — Themis te habla | ElevenLabs (síntesis) + OpenAI Whisper | ✅ LIVE | ElevenLabs Best |
| 3 | **Cognitive reasoning** — razona contexto | Gemini Pro **+ Claude fallback automático** | ✅ LIVE | Gemini Best |
| 4 | **Memory graph** — recuerda lo aprendido | MongoDB Atlas **+ filesystem fallback** | ✅ LIVE | MongoDB Atlas Best |
| 5 | **Production infra** — deploy escalable | Vultr Cloud Compute | ⏳ Pendiente | Vultr Best |
| 6 | **On-chain provenance** — prueba criptográfica | Solana devnet + Memo Program | ✅ LIVE | Solana Best |

**Todas las capas críticas para la rúbrica están LIVE.** Solo Vultr falta (es deploy final).

---

## 4. La pregunta-killer del jurado: 5 respuestas

> *"¿Cómo demuestras que aprendió y no está hardcodeado?"*

1. **`selector_intent` natural** — abre el playbook JSON, todos los campos son frases en español ("campo del precio del producto"), no XPath.
2. **Solana Explorer en vivo** — click el badge `Verified on Solana ✓` en `/teach` o `/memory`. Te abre `explorer.solana.com` con el hash del playbook firmado en blockchain ANTES de ejecutar. **Imposible de fabricar.**
3. **Self-healing** — cambia un selector en automationexercise.com (DevTools) durante una ejecución. Stagehand cae al vision fallback con Claude y se adapta. ⚡
4. **Memory recall** — abre `/memory`. Verás los mapeos que el agente aprendió en cada sesión, con confidence + ejemplos. Puede reusarlos cross-cliente.
5. **"Propónganos otro flujo"** — Stagehand funciona contra cualquier sitio web. No tenemos selectores hardcoded por sitio.

---

## 5. Caso de uso del demo

**Sistema A (origen):** [automationexercise.com](https://automationexercise.com/products) — sitio público real.

**Sistema B (destino):** `apps/erp-destino` — Next.js corporativo en `localhost:3001` con look SAP intencional (blanco + azul) para contrastar con el operator-ui premium (dark + coral).

**Proceso:** Avanzado por rúbrica:
- 10+ campos
- Navegación list → detail
- Mapeo no-obvio (`Product Name` → `Denominación comercial`, `Price` ÷ 1.16 → `Precio neto sin IVA`, etc.)

---

## 6. Arquitectura real

```
┌─────────────────────────────────────────────────────────────────────┐
│                  OPERATOR UI (Next.js · localhost:3000)             │
│                                                                     │
│  /teach  /execute  /memory  /recommendations  /validate /diagnostics│
└──────────────────────────────┬──────────────────────────────────────┘
                               │ fetch
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
   ┌────▼──────────┐  ┌────────▼────────┐  ┌──────────▼────────┐
   │ /api/playbook │  │ /api/execute    │  │ /api/             │
   │ /extract      │  │                 │  │   recommendations │
   │               │  │                 │  │                   │
   │ Claude        │  │ Stagehand       │  │ Gemini Pro        │
   │ → Solana      │  │  → Browserbase  │  │   (Claude fallback)│
   │ → MongoDB/FS  │  │  → ERP destino  │  │                   │
   └───────────────┘  └─────────────────┘  └───────────────────┘
                               │
                               ▼
               ┌──────────────────────────────┐
               │  ERP Destino (localhost:3001) │
               │  Sistema B · Next.js form     │
               │  /captura  /inventario        │
               └───────────────────────────────┘
```

---

## 7. Stack técnico (lo que SÍ usamos)

| Capa | Herramienta | En qué archivo vive |
|------|-------------|---------------------|
| Agent loop | `@anthropic-ai/sdk` (Claude Sonnet) | `packages/agent/src/playbook/extractor.ts` |
| Browser control | `@browserbasehq/stagehand` (Browserbase) | `packages/agent/src/execute/executor.ts` |
| Vision fallback | Claude Vision con screenshots | `packages/agent/src/execute/self-healing.ts` |
| Voice synthesis | ElevenLabs API | `/api/voice` |
| Voice transcription | OpenAI Whisper | `/api/whisper` |
| Cognitive reasoning | Gemini Pro + Claude fallback | `packages/agent/src/cognitive/gemini-recommendations.ts` |
| Knowledge graph | MongoDB Atlas + filesystem | `packages/db/src/playbook-store.ts` |
| Blockchain provenance | `@solana/web3.js` + Memo Program | `packages/agent/src/blockchain/solana-client.ts` |
| Frontend | Next.js 15 + Tailwind + shadcn | `apps/operator-ui/` |
| Sistema B (destino) | Next.js 15 + Tailwind (corp look) | `apps/erp-destino/` |

---

## 8. Equipo y roles

| Persona | Rol | Tareas principales |
|---------|-----|---------------------|
| **Jhulyam** | Tech Lead — Backend agent + Arquitectura | Capa 1 (extractor, executor, self-healing), Capa 6 (Solana), wirings end-to-end |
| **Emi** | Backend support + Pitch | Setup de Supabase/Mongo, mock data, video backup |
| **Marita** | Frontend coding — Componentes UI | Pule componentes con mockups de Ale, sin tocar lógica (ver [`MARITA.md`](./MARITA.md)) |
| **Ale** | Diseño visual + Pitch | Mockups Figma → entrega a Marita; arma el deck (10 slides) |

**Pipeline:** Ale (Figma) → Marita (React + Tailwind) → Emi (apoyo backend) → Jhulyam (integración con agente)

---

## 9. Demo guion (siguiendo PDF 6.2 · 10-13 minutos)

| Paso | Tiempo | Qué se demuestra | Página / acción |
|------|--------|------------------|-----------------|
| **1. Proceso manual** | 2 min | Manualmente captura un producto de automationexercise → erp-destino. Cronómetro visible. | Pantalla compartida con browser y `localhost:3001/captura` |
| **2. Observación** | 3 min | Click "Generar Playbook real". Claude extrae mappings. Aparece badge "Verified on Solana ✓". | `/teach` |
| **3. Automatización con datos NUEVOS** | 3 min | Click "Ejecutar REAL". Stagehand corre solo contra automationexercise con `product_id` distinto. Logs en vivo. | `/execute` |
| **4. Exactitud campo-por-campo** | 2 min | Side-by-side: lo que el playbook extrajo vs lo que se escribió. Sin errores. | `/validate` |
| **5. Replicabilidad** (opcional, gran diferenciador) | 2 min | (a) Self-healing en vivo (cambio label en DevTools). (b) Recomendaciones contextuales para zona universitaria + Clásico Regio. (c) Memory recall: "ya vi este mapeo". | `/recommendations`, `/memory` |

**Total: 12 minutos** dentro del rango del PDF.

---

## 10. Lo que NO construimos (y por qué)

- **Conversational chat / voice loop bidireccional** — Capa 2 simplificada a narración unidireccional (Themis te habla, no chat por voz)
- **Bulk parallel execution** — fuera de scope, no agrega al criterio core
- **Multi-system playbooks (3+ sistemas)** — el reto pide 2, no extendemos
- **Auth corporativo / multi-tenancy** — irrelevante para demo
- **Modelo ML predictivo de surtido** — la "trampa" del reto (no es lo que pide el PDF)

---

## 11. Drop rules (si algo falla en el demo)

| Si falla... | Drop esto sin culpa |
|-------------|---------------------|
| Browserbase rate limit | Demo Stagehand con video pregrabado del Paso 3 |
| Gemini quota | Capa 3 ya cae a Claude automáticamente, no hay que tocar nada |
| MongoDB connection | `/memory` muestra el fallback filesystem, sigue funcionando |
| Solana RPC down | Mostrar tx ya registrada en Explorer (URL guardada) |
| ElevenLabs key | Voz se silencia, todo lo demás sigue |

---

## 12. Estado actual del MVP (resumen ejecutivo)

✅ **Backend completo:**
- packages/agent (extractor, executor, self-healing, cognitive, solana)
- packages/db (playbook-store con MongoDB + filesystem)
- packages/playbooks (schema central)

✅ **2 apps Next.js corriendo:**
- operator-ui (puerto 3000) con 6 páginas + 9 API routes
- erp-destino (puerto 3001) con form + inventario + API

✅ **5 de 6 capas LIVE** (falta Vultr deploy)

✅ **Diagnostics page** (`/diagnostics`) muestra estado en tiempo real

✅ **Docs actualizados:** KICKOFF, README, CLAUDE, MARITA, este PLAN

⏳ **Pendientes opcionales:**
- Vultr deploy (1h)
- Self-healing demo trick ensayado (cambio de label en DevTools en vivo)
- Pulido visual con mockups de Ale (Marita)
- Pitch deck final (Ale)
- Backup video del demo (Emi + Marita)

---

## Mantra

> **¿Esta feature crea un wow en el demo de 13 minutos?**
> Si no, no se construye.

> **¿La rúbrica del PDF lo premia?**
> Si no, va al tier de drop rules.

**Themis trae orden donde no hay estándar.** 🎯
