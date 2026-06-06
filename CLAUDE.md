# Claude Code rules — Themis

## Project context
48-hour hackathon project para Hack4Her 2026 (reto Tuali / Arca Continental).

**Themis** — agente cognitivo verificable que aprende procesos web por observación. Cubre las 3 fases del PDF de organizadores (Conexión → Observación → Automatización) con 6 capas integradas.

Full plan: see [PLAN.md](./PLAN.md). Single source of truth: [`../KICKOFF.md`](../KICKOFF.md).

## Stack — las 6 capas

- **Monorepo:** pnpm workspaces
- **Apps:** Next.js 15 + Tailwind + shadcn/ui (TypeScript, App Router)
- **Capa 1 Core agent:** `@anthropic-ai/sdk` (Claude Sonnet 4.6) + Computer Use beta + Stagehand (Browserbase)
- **Capa 2 Voice:** ElevenLabs (síntesis voz mexicana) + OpenAI Whisper (transcripción narración)
- **Capa 3 Cognitive:** `@google/generative-ai` (Gemini Pro)
- **Capa 4 Memory:** `mongodb` + MongoDB Atlas (knowledge graph)
- **Capa 5 Infra:** Vultr Cloud Compute (deploy)
- **Capa 6 Provenance:** `@solana/web3.js` + Solana devnet (memo program)
- **DB relacional:** Supabase (Postgres) para playbooks, executions, tiendas
- **Frontend libs:** Vercel AI SDK (streaming), Framer Motion (animaciones), Tanstack Table

## Coding rules
- **TypeScript strict mode.** No `any` — usa `unknown` y narrow.
- **ESM only.** No CommonJS.
- **Server-side secrets:** NUNCA expongas al cliente. Usa `NEXT_PUBLIC_*` solo para safe values.
- **API routes:** Next.js App Router (`app/api/.../route.ts`).
- **Components:** Server Components por default. `"use client"` solo cuando lo necesites.
- **Shared types:** live en `packages/playbooks/src/types.ts`. Import desde `@hack4her/playbooks`.
- **No abstracción prematura.** 3 líneas similares > helper clever.
- **Sin comentarios explicando WHAT.** Solo WHY no obvio.
- **ElevenLabs y Solana keys NUNCA expuestas al cliente** — server routes obligatorias.

## What we are NOT building
- Modelo ML clásico de predicción de surtido (la trampa del reto).
- Auth corporativo, multi-tenancy, feature flags.
- Loop bidireccional de voz (solo narración unidireccional — Capa 2 simplificada).
- Anything que no aparezca en el demo de 13 minutos.

## Caso de uso técnico
- **Sistema A (origen):** automationexercise.com (sitio público).
- **Sistema B (destino):** `apps/erp-destino` (Next.js custom local).
- **Proceso:** Avanzado por rúbrica — 10+ campos, navegación list→detail, mapeo no-obvio.

## La rúbrica del PDF — orden de prioridad
1. **Aprendizaje por observación** (CRÍTICO — no hardcoded) — respondido por selector_intent + self-healing + Solana provenance.
2. **Reproducción autónoma** — Capa 1 execute mode.
3. **Exactitud campo-por-campo** — validación side-by-side en Paso 4 del demo.
4. **Replicabilidad** (opcional, gran diferenciador) — Capas 3, 4, 5 demuestran extensibilidad.

## ECC reference library
Vendored cherry-picks en `docs/references/` — **read-only**. Ver `docs/references/README.md`.

Skills relevantes al implementar:
- Agent loop → `docs/references/skills/agent-harness-construction/SKILL.md`
- Browser automation → `docs/references/skills/click-path-audit/SKILL.md`
- UI polish → `docs/references/skills/make-interfaces-feel-better/SKILL.md`
- Slides → `docs/references/skills/frontend-slides/SKILL.md`
- Motion → `docs/references/skills/motion-ui/SKILL.md`

## Mantra
> **¿Esta feature crea un wow en el demo de 13 minutos?**
> Si no, no se construye.

> **¿La rúbrica del PDF lo premia?**
> Si no, va al tier de drop rules.
