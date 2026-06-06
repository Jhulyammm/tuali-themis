# Tuali Operator — Plataforma de Fuerza Laboral Digital
### Plan BIG MVP — Hackathon Tuali 2026 · 48 horas

> **Equipo:** Jhulyam · Emi · Carlos · Marita
> **Reto principal:** Always on Shelf — Surtido predictivo para canal moderno
> **Reto de respaldo (BIG):** Churn Hunters — ver [PLAN_B.md](./PLAN_B.md)

---

## 1. El reto literal

> *"Desarrollar una solución de IA capaz de aprender un proceso entre sistemas web observándolo una sola vez y ejecutarlo de forma autónoma, eliminando tareas manuales, errores y tiempo operativo."*

**Nuestra interpretación expandida:** No construimos una "herramienta de automatización". Construimos **un sistema operativo de agentes que aprenden por demostración, se adaptan cuando los sistemas cambian, y obedecen lenguaje natural** — la primera capa de fuerza laboral digital para CPG.

---

## 2. Las 4 capacidades del Big MVP

Todas se construyen sobre el MISMO motor (Claude + visión + Stagehand). No explotan complejidad geométricamente — la capacidad core es UNA, las features son LAYERS encima.

### Capacidad 1 — Multi-system playbooks (HORIZONTAL)
El agente navega entre **2 portales** como un solo workflow.
**Ejemplo:** *Lee inventario en "Tuali Internal" → calcula sugerencia → captura en "Canal Moderno Surtido".*

→ Destruye el frame de "automatización de un sitio". Esto es **automatización de un proceso de negocio cross-system**.

### Capacidad 2 — Self-healing por visión (VERTICAL DEPTH)
Cuando el portal cambia (botón se mueve, label se renombra), el agente **se adapta sin re-entrenamiento**.

**Demo trick:** durante el demo en vivo, Emi modifica un label del mock portal en hot-reload mientras el agente está corriendo. El agente reintenta, encuentra el botón equivalente por visión, completa la tarea. **Silencio del jurado.**

Esta capacidad ya viene "gratis" con Stagehand vision-first — solo hay que **diseñar el momento del demo** explícitamente.

### Capacidad 3 — Conversational orchestration (CONCEPTUAL UPGRADE)
María NO llena formularios de parámetros. **Le habla al agente:**

> *"Haz lo mismo para todas las OXXO de Querétaro con Coca 600ml, 50 unidades."*

El agente:
1. Entiende el comando (Claude)
2. Consulta la BD de tiendas (filter: tipo=OXXO, zona=Querétaro)
3. Genera N instancias de ejecución
4. Las corre en paralelo
5. Reporta resultados

→ Convierte el producto de "GUI con formularios" a **"interfaz conversacional para fuerza laboral digital"**.

### Capacidad 4 — Bulk parallel execution
Ejecuciones paralelas con dashboard de progreso. **Se dispara por comando conversacional**, no por upload de CSV. Más natural, más wow.

---

## 3. Equipo y roles

| Persona | Rol | Responsabilidad expandida |
|---------|-----|---------------------------|
| **Jhulyam** | Tech Lead + Agent Engineer + Arquitecto | Agent loop, Computer Use, Stagehand, generalización, **planner conversacional**, **cross-system navigation**, **self-healing logic**, arquitectura, code review |
| **Carlos** | Frontend Engineer + Co-Pitch (h32+) | Operator UI con **interfaz conversacional (chat-style)** + dashboard + live execution viewer + bulk progress |
| **Marita** | UI/UX Lead | Mockups, dirección visual, **diseño del momento de self-healing** (animación clave), polish del demo |
| **Emi** | Pitch Lead + Backend | **2 mock portals** (`canal-moderno` + `inventario-tuali`), seeds de Supabase con tiendas tipadas/zonificadas, **el hot-reload trick para self-healing**, pitch enterprise, video backup |

**Carga balanceada:**
- Jhulyam concentra los 4 frentes técnicos críticos (agent + browser + conversational + self-healing) porque comparten visión arquitectónica unificada
- Carlos absorbe TODO el frontend incluyendo el chat — Jhulyam no se distrae con UI
- Emi escala de "1 portal" a "2 portales con hot-reload" — más rato, no más difícil
- Marita asegura que el momento self-healing se SIENTA cinematográfico

**Reconfiguren si:** el skill-check de 15 min al arranque revela que alguien domina otra área mejor.

---

## 4. Stack técnico

| Capa | Herramienta | Por qué |
|------|-------------|---------|
| Orquestación agente | `@anthropic-ai/sdk` + Claude Agent SDK + Computer Use beta | Estado del arte |
| Browser control | **Stagehand** (Browserbase) | Vision-first, mejor para self-healing |
| Conversational layer | **Vercel AI SDK** + Claude tool use | Stream de respuesta, tool calling nativo |
| Frontend (Operator UI + Mock Portals) | Next.js 15 + Tailwind + shadcn/ui | Velocidad + look profesional |
| Chat UI | `@assistant-ui/react` o shadcn chat components | Listos para producción |
| Storage | Supabase (Postgres + Auth + Storage) | Setup en minutos |
| Audio → texto (narración modo enseñar) | OpenAI Whisper API | Estándar |
| Voice command parsing | Claude Sonnet (texto) | Carlos pasa transcript → JSON estructurado |
| Hosting | Vercel (frontend) + Browserbase (navegador headless) | Predecible para demo |

**Costos estimados:** ~$80-150 USD en APIs. **Pedir créditos a organizadores el día 0.**

---

## 5. Arquitectura

```
┌────────────────────────────────────────────────────────────────┐
│                  OPERATOR UI (Next.js)                         │
│                                                                │
│   ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│   │ Dashboard   │  │ Modo Enseñar │  │ Conversational Chat  │  │
│   │ Playbooks   │  │              │  │ "Haz X para Y..."    │  │
│   └─────────────┘  └──────────────┘  └──────────────────────┘  │
└────────────────────────┬───────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────▼──────┐  ┌──────▼─────┐  ┌──────▼────────┐
   │ TEACH     │  │ PLANNER    │  │ EXECUTOR      │
   │ recorder  │  │ Claude     │  │ Stagehand +   │
   │ (DOM +    │  │ parsea     │  │ Computer Use  │
   │  screen + │  │ comando    │  │ + self-heal   │
   │  Whisper) │  │ → plan     │  │ via vision    │
   └────┬──────┘  └──────┬─────┘  └──────┬────────┘
        │                │                │
        └────────┬───────┴────────┬───────┘
                 │                │
          ┌──────▼───────┐  ┌─────▼─────────┐
          │   Supabase   │  │ MOCK PORTALS  │
          │ • playbooks  │  │ • Canal Mod.  │
          │ • executions │  │ • Inventario  │
          │ • tiendas    │  │   (cross-     │
          │ • recordings │  │    system)    │
          └──────────────┘  └───────────────┘
```

### Playbook schema (sin cambios — el schema central ya soporta esto)

`packages/playbooks/src/types.ts` ya define playbooks parametrizables y multi-step. Para multi-system se agrega una nueva acción `switch_system` que cambia el target_url contexto.

### Conversational layer flow

```
Usuario: "Actualiza surtido de Coca 600ml a 50 en todas las OXXO de Querétaro"
   ↓
Claude (tool: parseCommand)
   ↓
{
  playbook: "actualizar-surtido",
  filter: { tipo: "OXXO", zona: "Querétaro" },
  parameters: { sku: "Coca 600ml", quantity: 50 }
}
   ↓
DB query → N tiendas
   ↓
N ejecuciones paralelas con bulk dashboard
```

---

## 6. Timeline 48h (denso)

### Día 1 (horas 0-24): Las bases + integración mínima

| Hora | Hito | Responsable |
|------|------|-------------|
| 0-1 | Kickoff + skill-check + repo setup + keys | Todos |
| 1-2 | Decisiones de arquitectura (consultar `docs/references/agents/architect.md`) | Jhulyam |
| 2-10 | **2 mock portals**: `canal-moderno` + `inventario-tuali` con `data-testid` y look corporativo | Emi |
| 2-10 | Computer Use POC + recorder base | Jhulyam |
| 2-10 | Operator UI scaffold + chat UI + dashboard skeleton | Carlos |
| 2-10 | Mockups de TODAS las pantallas + dirección visual | Marita |
| 10-18 | **Integración 1**: teach → execute idéntico funcionando | Jhulyam + Carlos |
| 10-18 | Schema Supabase + seeds (tiendas con tipo/zona/SKUs para queries conversacionales) | Emi |
| 10-18 | Polish del primer flow visible | Marita |
| 18-24 | **Integración 2**: layer conversacional → Claude parsea comando → ejecuta lote | Jhulyam |
| 18-24 | UI conversacional pulida (chat con stream de pasos visibles) | Carlos |
| 18-24 | Pitch deck v0 con framing enterprise | Emi |

**🚦 Checkpoint hora 24:** comando conversacional ejecuta lote de 5 tiendas correctamente con 1 playbook grabado.

Si NO funciona end-to-end aquí → evaluar pivot al **PLAN_B.md** (BIG Churn Hunters).

### Día 2 (horas 24-48): Las 2 capacidades restantes + polish + pitch

| Hora | Hito | Responsable |
|------|------|-------------|
| 24-32 | **Multi-system flow**: agente lee de portal A, escribe en portal B | Jhulyam + Carlos |
| 24-32 | **Self-healing demo**: hot-reload trick listo y ensayado x3 | Jhulyam + Emi |
| 24-32 | Animación visual del momento de self-healing | Marita |
| 24-32 | Pitch deck v1 con métricas enterprise + slide de visión | Emi |
| 32-40 | Edge cases + recovery visible (retries, fallbacks) | Jhulyam |
| 32-40 | UI motion polish (`docs/references/skills/motion-ui/SKILL.md`) | Carlos + Marita |
| 32-40 | **Backup video del demo perfecto** (los 5 wows) | Emi + Marita |
| 32-40 | Métricas de negocio finales ($$$ a nivel enterprise) | Emi |
| 40-44 | 3 ensayos cronometrados del pitch completo | Todos |
| 44-46 | Buffer para bugs de último minuto | Quien lo necesite |
| 46-48 | Descanso + pitch final | — |

---

## 7. Demo strategy: los 5 momentos del wow (4:30 min)

| # | Tiempo | Qué pasa | Capacidad mostrada |
|---|--------|----------|---------------------|
| **Apertura** | 20s | "Arca tiene 200 planeadores. Hacen 12 procesos manuales × semana. 7,200 horas/semana de clic." | Framing del problema |
| **Acto 1** | 45s | María enseña UN proceso narrando. Sistema graba. Playbook extraído visible. | Foundational — teach |
| **Acto 2** | 30s | Ejecuta con mismos valores. Navegador autónomo. | Generalización 101 |
| **Acto 3** | 60s | **"Hazlo para 30 tiendas de Querétaro con Sprite 500ml"** — María habla. 30 ejecuciones paralelas arrancan. | **Conversational + Bulk** |
| **Acto 4** | 60s | A mitad del lote, Emi cambia un label del portal en pantalla compartida. Agente detecta, reintenta, completa. | **Self-healing** |
| **Acto 5** | 45s | Segundo proceso: agente cruza 2 portales (lee de Inventario Tuali, escribe en Canal Moderno) | **Multi-system** |
| **Cierre** | 30s | Slide visión: "Hoy 2 procesos. Q3 2026: 50. Q1 2027: cross-system + voz. Q4 2027: 7,200 horas/semana automatizadas." + métrica de ahorro enterprise | Framing platform |

**Total: 4:50 min.** Quedan 10s de buffer / cierre seco.

### Estructura del cierre

Pantalla final con 3 frases:
> *"Tuali Operator: la primera capa de fuerza laboral digital para CPG."*
> *"Aprende cualquier proceso. Se adapta cuando los sistemas cambian. Obedece lenguaje natural."*
> *"Esto no podía existir hace 12 meses. Esto es ahora."*

---

## 8. ECC: cherry-picks de alto valor

Los skills y agentes que usamos están vendoreados en `docs/references/` (cherry-pick de ECC). **Sin instalar el framework completo** — pura biblioteca de referencia local. Cuando alguien vaya a hacer X, lee el archivo correspondiente antes. Ver índice en `docs/references/README.md`.

### Skills DIRECTAMENTE relevantes (lectura obligatoria por rol)

| Quién | Cuándo | Qué leer |
|-------|--------|----------|
| Jhulyam | Hora 0-2 | `docs/references/skills/agent-harness-construction/SKILL.md` |
| Jhulyam | Hora 2-8 | `docs/references/skills/autonomous-agent-harness/SKILL.md` |
| Jhulyam | Hora 8-16 | `docs/references/skills/click-path-audit/SKILL.md` |
| Jhulyam | Hora 16-24 | `docs/references/skills/browser-qa/SKILL.md` |
| Carlos | Hora 0-2 | `docs/references/skills/frontend-patterns/SKILL.md` |
| Carlos | Hora 2-8 | `docs/references/skills/react-patterns/SKILL.md` |
| Carlos | Hora 24-32 | `docs/references/skills/motion-ui/SKILL.md` |
| Marita | Hora 0-8 | `docs/references/skills/frontend-design-direction/SKILL.md` |
| Marita | Hora 24-32 | `docs/references/skills/motion-foundations/SKILL.md` + `motion-patterns/SKILL.md` |
| Marita | Hora 32-40 | `docs/references/skills/make-interfaces-feel-better/SKILL.md` + `ui-demo/SKILL.md` |
| Emi | Hora 0-8 | `docs/references/skills/frontend-slides/SKILL.md` |
| Emi | Hora 2-8 | `docs/references/skills/investor-materials/SKILL.md` |
| Emi | Hora 32-40 | `docs/references/skills/ui-demo/SKILL.md` |

### Subagentes útiles (referencia en momentos puntuales)

| Cuándo | Cuál | Para qué |
|--------|------|----------|
| Hora 1-2 | `docs/references/agents/architect.md` | Decidir estructura final |
| Antes de cada merge | `docs/references/agents/typescript-reviewer.md` + `react-reviewer.md` | Review rápido |
| Hora 32+ | `docs/references/agents/silent-failure-hunter.md` | Cazar bugs invisibles |
| Hora 40+ | `docs/references/agents/security-reviewer.md` | Scan pre-demo |

---

## 9. Riesgos y mitigaciones

| Riesgo | Probabilidad | Mitigación |
|--------|--------------|------------|
| Conversational layer no parsea bien comandos en libertad | Media | Restringir a 5-10 verbos conocidos. Hardcodear ejemplos de entrenamiento en el system prompt. |
| Multi-system se rompe entre portales | Media | Ambos portales en mismo dominio (subpaths), auth idéntico, navegación predecible. |
| Self-healing falla en vivo | Media-Alta | El "cambio" es CONTROLADO por Emi (specific label, specific timing). Ensayado x5 antes del pitch. |
| Computer Use lento → demo se siente lento | Alta | Backup video grabado a velocidad real con cortes editoriales; reproducir en vivo si lag. |
| Jhulyam cuello de botella técnico | Alta | Carlos absorbe TODO frontend incl. chat UI. Emi cubre 2 portales + hot-reload. Cero distracción. |
| Demo en vivo se rompe por red/timeout | Alta (siempre) | **Backup video obligatorio en hora 40.** Plan: si falla en vivo, lanzar video sin reconocerlo. |
| Burnout en hora 30+ | Alta | Turnos de sueño obligatorios. 2 personas duermen 4h mientras otras 2 trabajan. |
| Scope creep | Muy Alta | **Después de hora 16, congelar features.** Solo pulir lo que ya existe. |
| API costs se disparan | Media | Modo "playback" sin LLM para pruebas. LLM solo en runs de checkpoint y demo. |

### Planes de fallback escalonados

- **Plan A (Big MVP):** las 4 capacidades funcionando — 5 wows en demo
- **Plan B (hora 32):** si self-healing no funciona → skippearlo. 4 wows en demo, sigue siendo plataforma
- **Plan C (hora 24):** si multi-system no funciona → todo en 1 portal. 3 wows, sigue siendo conversational platform
- **Plan D (hora 16):** si conversational no funciona → forms tradicionales. 2 wows, sigue siendo agente con generalización
- **Plan E (hora 16):** si NADA del Always on Shelf cuaja → **pivot a [PLAN_B.md](./PLAN_B.md) (BIG Churn Hunters)**

Cada plan es **idéntico al checkpoint del nivel anterior**. Cero trabajo desperdiciado.

---

## 10. Plan B (resumen — detalle en [PLAN_B.md](./PLAN_B.md))

Si en hora 16 el modo "ejecutar idéntico" de Always on Shelf NO funciona end-to-end → pivot a **Churn Hunters BIG: Agente Autónomo de Cuidado de Cliente**.

NO es un dashboard de churn. Es un **agente que monitorea, explica, y actúa** para retener clientes. Mismo patrón filosófico que Always on Shelf — agente que opera autónomamente — aplicado a relación con cliente en vez de procesos web.

Reúsa: Next.js scaffold, Supabase, Claude SDK, chat UI de Carlos, pitch structure de Emi, mockups de Marita.

Ver [PLAN_B.md](./PLAN_B.md) para arquitectura completa, 4 capacidades, timeline post-pivot de 30h y demo strategy.

---

## 11. Decisiones pendientes (resolver hoy)

- [ ] **Acceso a APIs/sandbox de Tuali**: preguntar a organizadores. Default: mock portales propios.
- [ ] **Créditos de API**: Anthropic + Browserbase + OpenAI a organizadores.
- [ ] **Lenguaje del agente**: **TypeScript** (todo en mismo repo).
- [ ] **Roles finales**: skill-check 15 min al inicio.
- [ ] **Procesos específicos del demo**: confirmar 2 procesos:
  - Proceso A: *Actualizar surtido por tienda* (en Canal Moderno)
  - Proceso B: *Generar pedido sugerido desde inventario* (cross-system: Inventario → Canal Moderno)
- [ ] **Comandos conversacionales soportados (lista cerrada de 5-10)**: definir antes de hora 18

---

## 12. Checklist hora 0 (los primeros 60 min)

- [ ] Todos en la misma sala / call permanente
- [ ] Skill-check de 15 min (sección 3)
- [ ] Confirmar roles finales
- [ ] Crear repo monorepo en GitHub
- [ ] Cada persona clona repo, instala Node 20 + pnpm
- [ ] Crear cuentas: Anthropic Console, Browserbase, Supabase, Vercel, OpenAI
- [ ] Compartir API keys en `.env.local` y password manager seguro
- [ ] Jhulyam lee `docs/skills/jhuly-tech-lead.md`
- [ ] Carlos lee `docs/skills/carlos-frontend.md`
- [ ] Marita lee `docs/skills/marita-uiux.md`
- [ ] Emi lee `docs/skills/emi-pitch.md`
- [ ] Todos leen [`docs/concept-walkthrough.md`](docs/concept-walkthrough.md) — la historia de María
- [ ] Definir canal de comunicación (Discord/Slack voice)
- [ ] Pedir créditos a organizadores
- [ ] Confirmar acceso a APIs Tuali (o decidir mock definitivamente)
- [ ] Definir los 5-10 comandos conversacionales soportados

---

## Mantra del hackathon

> **Cada feature debe justificar su existencia con una pregunta:** *¿esto crea un wow en el demo de 4:30 min?*
>
> Si la respuesta es no, **NO se construye**.

> **Cuando dudemos entre "pulir lo que tenemos" vs "agregar una feature más":** siempre pulir.
