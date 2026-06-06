# Themis — Kickoff Brief

> **Hack4Her 2026** · Reto Always on Shelf · 48 horas
> Léelo en 5 minutos al llegar. Después abre tu doc de rol.

---

## El producto en 2 líneas

**Themis** — diosa griega del orden divino. Agente cognitivo que **aprende un proceso web viendo una vez**, lo **ejecuta solo** con datos nuevos, **razona con contexto** (zona, fecha, evento), **recuerda** lo aprendido, te **habla con voz**, y **prueba en blockchain** que aprendió.

> *"Implementar EDI toma 6 meses. Themis trae orden en 90 segundos."*

---

## El reto (PDF de organizadores)

Tres fases obligatorias:
1. **Conexión** — el agente se conecta a 2 sistemas web
2. **Observación** — el operador hace el proceso UNA vez mientras agente observa
3. **Automatización** — agente lo replica autónomamente con datos nuevos

**Rúbrica (4 criterios):**
1. Aprendizaje por observación (NO hardcoded)
2. Reproducción autónoma
3. Exactitud campo-por-campo
4. Replicabilidad (opcional, gran diferenciador)

**La pregunta-killer del jurado:** *"¿Cómo demuestras que aprendió y no está hardcodeado?"* — Themis tiene 5 respuestas, incluida prueba criptográfica en Solana.

---

## Equipo y roles (FINAL)

| Persona | Rol | Carpeta principal |
|---------|-----|-------------------|
| **Jhulyam** | Tech Lead — Backend Agent + Arquitectura | `packages/agent/` |
| **Emi** | Backend — APIs, DB, infra | `apps/erp-destino/`, server routes |
| **Marita** | Frontend coding — Componentes UI | `apps/operator-ui/src/components/` |
| **Ale** | Diseño + Pitch | Figma + `docs/pitch/` + `docs/demo-script.md` |

**Pipeline:** Ale (mockup Figma) → Marita (React + shadcn) → Emi (backend integration) → Jhulyam (agent integration)

---

## Las 6 capas de Themis

| # | Capa | Tech | MLH prize | Owner principal |
|---|------|------|-----------|-----------------|
| 1 | **Core agent** | Anthropic Claude + Computer Use + Stagehand | — | Jhulyam |
| 2 | **Voice narration** | ElevenLabs + Whisper | ElevenLabs Best | Emi + Marita |
| 3 | **Cognitive reasoning** | Gemini Pro | Gemini Best | Jhulyam + Marita |
| 4 | **Memory graph** | MongoDB Atlas | MongoDB Atlas Best | Emi |
| 5 | **Production infra** | Vultr Cloud | Vultr Best | Emi |
| 6 | **On-chain provenance** | Solana devnet | Solana Best | Jhulyam + Marita |

**Cubrimos los 4 criterios de la rúbrica + 5 MLH bonus prizes en un solo producto.**

---

## Caso de uso técnico

**Sistema A (origen):** [automationexercise.com/products](https://automationexercise.com/products)
**Sistema B (destino):** `apps/erp-destino` custom (Next.js local)

**Proceso:** Avanzado por rúbrica — 10+ campos, navegación list→detail, mapeo no-obvio.

**Mapeo no-obvio (prueba aprendizaje real):**

| Origen | Destino |
|--------|---------|
| Product Name | Denominación comercial |
| Brand | Fabricante |
| Price | Precio neto sin IVA |
| Category | Rubro contable |
| Availability "In Stock" | Estado de stock "Disponible" |

---

## Demo guión (13 min)

| Paso | Tiempo | Qué muestra |
|------|--------|-------------|
| 1. Manual + dolor EDI | 2 min | Cronómetro visible del proceso a mano |
| 2. Observación + voz + Solana | 2.5 min | Themis observa, narra, registra en blockchain |
| 3a. Automatización fiel | 1.5 min | Datos NUEVOS, replica solo |
| 3b. Inteligencia contextual | 2 min | Panel Gemini con recomendaciones por zona+evento |
| 4. Validación exactitud | 1.5 min | Side-by-side, campo por campo |
| 5a. Self-healing en vivo | 1 min | Cambio de label en DevTools → Themis se adapta |
| 5b. Memoria cross-cliente | 1.5 min | "Ya vi este mapeo, arranco con 9 de 11" |
| Cierre | 1 min | URL Vultr + Solana Explorer |

---

## Hour-0 checklist por persona

### Jhulyam
- [ ] Crear repo `tuali-themis` en GitHub (comandos en PLAN.md)
- [ ] `.env.local` con las 11 keys
- [ ] Empieza `packages/agent/src/teach/recorder.ts`

### Emi
- [ ] Lee este KICKOFF.md
- [ ] Crear cuenta Supabase + MongoDB Atlas
- [ ] Setup project + migrations
- [ ] Skeleton `apps/erp-destino`

### Marita
- [ ] Lee este KICKOFF.md
- [ ] Scaffold `apps/operator-ui` con Next.js + Tailwind + shadcn
- [ ] Pega design tokens del `docs/ui-spec.md` en globals.css
- [ ] Espera mockup #1 de Ale (Dashboard) y empieza el render

### Ale
- [ ] Lee este KICKOFF.md
- [ ] Crear cuentas: ElevenLabs, Gemini, MongoDB Atlas, Vultr, Phantom wallet + Solana faucet
- [ ] Compartir keys con equipo (Google Doc privado o password manager)
- [ ] Empezar mockup #1: Dashboard (entrégalo a Marita)
- [ ] Estructura inicial del pitch deck (10 slides)

---

## Mantra

> **¿Esta feature crea un wow en el demo de 13 minutos?**
> Si no, no se construye.

> **¿La rúbrica del PDF lo premia?**
> Si no, va al tier de drop rules.

---

## Links rápidos

- **PLAN.md:** [`PLAN.md`](PLAN.md) — el plan completo de 6 capas
- **UI Spec:** [`docs/ui-spec.md`](docs/ui-spec.md) — tokens y screens
- **Walkthrough:** [`docs/concept-walkthrough.md`](docs/concept-walkthrough.md) — la historia
- **Tu rol:**
  - Jhulyam → [`docs/skills/jhuly-tech-lead.md`](docs/skills/jhuly-tech-lead.md)
  - Marita → [`docs/skills/marita-uiux.md`](docs/skills/marita-uiux.md) (lee considerando que ahora codeas)
  - Emi → [`docs/skills/emi-pitch.md`](docs/skills/emi-pitch.md) (lee considerando que ahora eres backend)
  - Ale → [`docs/skills/emi-pitch.md`](docs/skills/emi-pitch.md) (parte del pitch aplica)

**Themis trae orden donde no hay estándar. Vamos.**
