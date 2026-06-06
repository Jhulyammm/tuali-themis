# Tareas para Marita — Cuentas + Frontend coding + Pitch (con Ale)

> **Rol:** Frontend Engineer + setup de infraestructura externa + Co-pitcher.
> **Pipeline frontend:** Ale te entrega mockup → tú lo conviertes a React + shadcn.
> **Pipeline pitch:** Tú + Ale lo arman juntas. Ale lleva narrativa visual y memoriza apertura/cierre, tú llevas la parte técnica, screenshots del demo, video backup, y cronómetro en ensayos.

---

## 📍 Status actual (lee esto primero)

| Cosa | Estado |
|------|--------|
| Cuentas + keys MLH | ✅ Hecho |
| Scaffold operator-ui + erp-destino + shadcn | ✅ Hecho (Jhulyam lo armó) |
| Componentes UI base (StepLog, MappingTable, SolanaBadge, etc.) | ✅ Funcionando con backend real |
| **Polish visual con mockups de Ale** | 🔥 Tu siguiente foco |
| Screenshots reales para pitch deck | ⏳ Cuando Ale tenga las slides |
| Video backup del demo | ⏳ Últimas horas (h36-h42) |

**Lee [`MARITA.md`](MARITA.md)** — la guía completa de qué tocar y qué NO. **Foco AHORA:** ir página por página adaptando classes Tailwind a los mockups que Ale te entregue.

---

---

## ✅ AHORA — Bloque 1: Cuentas + créditos MLH (45 min)

**Esto es crítico — sin estas keys el resto del equipo NO codea.** Mientras lees, abre cada link en una pestaña:

- [ ] **Anthropic Console** — https://console.anthropic.com (preguntar a organizadores por créditos del evento)
- [ ] **Azure OpenAI for Students** — los organizadores entregan key, pregunta dónde
- [ ] **Browserbase** — https://browserbase.com (free tier)
- [ ] **Supabase** — https://supabase.com (free tier)
- [ ] **Vercel** — https://vercel.com (backup deploy)
- [ ] **OpenAI** — https://platform.openai.com (para Whisper, Capa 2)
- [ ] **ElevenLabs** [MLH] — https://elevenlabs.io (voz, Capa 2)
- [ ] **Google AI Studio Gemini** [MLH] — https://aistudio.google.com (razonamiento, Capa 3)
- [ ] **MongoDB Atlas** [MLH] — https://cloud.mongodb.com ($50 student credit o free M0, Capa 4)
- [ ] **Vultr** [MLH] — https://my.vultr.com (free cloud credits, Capa 5)
- [ ] **Phantom wallet + Solana faucet** [MLH] — https://phantom.app + https://faucet.solana.com (devnet gratis, Capa 6)

**Guardar todas las keys en:** Google Doc privado del equipo o 1Password. **JAMÁS en el repo.** Compárteme el link cuando lo tengas.

---

## ✅ Bloque 2: Lectura crítica (15 min)

- [ ] [`KICKOFF.md`](KICKOFF.md) — qué construimos, las 6 capas, tu rol
- [ ] [`docs/ui-spec.md`](docs/ui-spec.md) — design tokens, screens, motion patterns
- [ ] [`docs/concept-walkthrough.md`](docs/concept-walkthrough.md) — la historia (5 min)

---

## 🛠️ Bloque 3: Setup del frontend (1h, h1-h2)

### Verifica deps locales
```powershell
node --version  # tiene que ser >= 20
pnpm --version  # si no tienes: npm i -g pnpm
```

### Scaffold de `apps/operator-ui`
```powershell
cd C:\Users\jhuly\Development\hack4her\apps

# Borra el placeholder
Remove-Item operator-ui\.gitkeep

# Scaffold Next.js 15 + TypeScript + Tailwind + App Router
pnpm create next-app@latest operator-ui --typescript --tailwind --app --src-dir --import-alias "@/*" --no-eslint --use-pnpm
```

### Setup shadcn/ui
```powershell
cd operator-ui
pnpm dlx shadcn@latest init
# Style: Default · Color: Zinc · CSS vars: Yes

# Instala todos los componentes de una vez:
pnpm dlx shadcn@latest add button card dialog sheet tabs table dropdown-menu input label select separator textarea badge progress avatar scroll-area command tooltip toast skeleton
```

### Deps extra
```powershell
pnpm add framer-motion @tanstack/react-table @tanstack/react-virtual ai recharts zod react-hook-form @hookform/resolvers @hack4her/playbooks @hack4her/db
```

### Pegar design tokens
- Copia el bloque CSS de [`docs/ui-spec.md`](docs/ui-spec.md) sección 2.1 en `src/app/globals.css`
- Copia el snippet de Tailwind config (sección 2.3) en `tailwind.config.ts`
- Importa Geist + JetBrains Mono en `src/app/layout.tsx` (link tags + className en `<html>`)

---

## 🎨 Bloque 4: Componentes UI (24h en h2-h32)

**Workflow:** esperas mockup de Ale → lo codeas → handoff a Emi para integración con backend.

### Sprint 1 — Foundational (h2-h10)
1. **`DashboardLanding.tsx`** (mockup #1 de Ale) — primera pantalla
2. **`MappingTable.tsx`** (Capa 1, Paso 2 demo) — tabla que crece con cada mapeo aprendido
3. **`BrowserViewer.tsx`** (Capa 1) — iframe con cursor coral animado del agente

### Sprint 2 — Capas brillantes (h10-h22)
4. **`StepLog.tsx`** (Capa 1) — lista de pasos con estado `adapting ⚡`
5. **`useVoice.ts` + `WaveformIndicator.tsx`** (Capa 2) — Web Audio API hook + visualización
6. **`RecommendationsPanel.tsx`** (Capa 3) — **LA ESTRELLA**, con accept/reject

### Sprint 3 — Memoria + Verificación (h22-h30)
7. **`MemoryGraphView.tsx`** (Capa 4) — grid de mapeos previos
8. **`SolanaBadge.tsx`** (Capa 6) — badge clickeable → Solana Explorer
9. **`ExecutionDashboard.tsx`** — vista general de bulk progress

### Sprint 4 — Sistema B (h22-h28, en paralelo)
10. **`apps/erp-destino`** — scaffold separado + páginas de captura SKU con form 10+ campos
    ```powershell
    cd ../erp-destino  # mismo proceso de Next.js scaffold
    ```
    - Look intencional CORPORATIVO (white + blue, NO el dark + coral del Operator)

---

## ✨ Bloque 5: Polish + animaciones (2h en h32-h34)

Usa **Framer Motion** con los specs que Ale dejó en los mockups:

```tsx
// Self-healing pulse (Capa 1)
<motion.div
  animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
  transition={{ duration: 1.5, repeat: Infinity }}
/>

// Reveal de Solana Badge (Capa 6)
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
/>

// Typing animation para narración (Capa 2)
// usa el hook useChat() de Vercel AI SDK — ya hace streaming nativo
```

Lee [`docs/ui-spec.md` sección 5](docs/ui-spec.md) para todos los patrones.

---

## 🔌 Integración con backend (continuo)

Cuando termines un componente, **díselo a Emi**. Él te pasa las API routes:

| Componente | Llama a... | Owner backend |
|------------|------------|---------------|
| `MappingTable` | `/api/playbooks/[id]/mappings` (stream) | Emi |
| `BrowserViewer` | `/api/execute/[id]` (websocket/SSE) | Emi |
| `useVoice` | `/api/voice/synthesize` | Emi |
| `RecommendationsPanel` | `/api/recommendations` (Gemini) | Jhulyam |
| `MemoryGraphView` | `/api/memory-graph` | Emi |
| `SolanaBadge` | hash + tx ya vienen del backend | Emi |

---

## 🎤 Pitch deck — Co-ownership con Ale (6h en h24-h46)

**División Marita ↔ Ale:**
- **Marita (tú):** contenido técnico de los slides + screenshots del demo real + grabación del video backup + cronómetro en ensayos.
- **Ale:** estructura narrativa + diseño visual de los slides + memorización de apertura/cierre.
- **Juntas:** 3 ensayos cronometrados en h44-h46.

### Tu parte técnica del pitch (h24-h36)
- [ ] Screenshots reales de las 6 capas funcionando (1 por slide del deck)
- [ ] URL real de Vultr en pantalla para el slide de Capa 5
- [ ] Link del Solana Explorer con tx real para el slide de Capa 6
- [ ] Demo en pantalla compartida (no video) para los Pasos 1-4
- [ ] Asegurar que las pantallas que diseñaste estén pulidas para los screenshots

### Video backup (h36-h42, 4h con Ale apoyando)
- Graba el demo perfecto en condiciones controladas
- 13 minutos siguiendo el guión de los 5 pasos
- Si en vivo algo falla, lanzamos el video
- Usa OBS o QuickTime para grabar pantalla + audio
- Edita cortes que se vean lentos (Computer Use puede tener latencia)

### Ensayos (h44-h46, 3 rondas)
- Cronometra cada paso, anota dónde se atora
- Practica con Ale las 5 respuestas a la pregunta-killer del jurado
- Si llegan a >14 min, dropear Paso 5b según las drop rules del PLAN

---

## 🚫 Bloqueos — qué hacer

- **Ale no me ha entregado el mockup:** mientras tanto, pre-arma estructura del componente con shadcn primitives. Cuando llegue, le pones los estilos.
- **Algo no compila en TypeScript:** mira el error + docs de shadcn primero. 15 min atorada → llama a Jhulyam.
- **Una API no existe todavía:** stub con mock data + comment `// TODO: replace with /api/...`. Continúa con el siguiente.
- **Necesito un componente shadcn no instalado:** `pnpm dlx shadcn@latest add <nombre>`.
- **Las cuentas tomaron más de 45 min:** continua con setup del frontend, vuelves a las cuentas pendientes después.
- **El video backup no se ve bien:** prioriza captura del momento del wow (Capa 3 + 5a self-healing + Capa 6 Solana). El resto puede ser screenshots con narración encima.

---

## 📚 Refs rápidos

- **shadcn/ui docs:** https://ui.shadcn.com
- **Framer Motion docs:** https://www.framer.com/motion/
- **Vercel AI SDK:** https://sdk.vercel.ai/docs (chat + streaming)
- **Tu cheatsheet de coding:** [`docs/skills/carlos-frontend.md`](docs/skills/carlos-frontend.md) — patrones React + shadcn (era de Carlos pero aplica)

---

## Mantra

> **No diseñas — implementas.** Si Ale no te dio el mockup, no lo inventes.
>
> **Componentes pequeños, atómicos, reutilizables.** shadcn ya te da los primitives — tu trabajo es componerlos bien.
