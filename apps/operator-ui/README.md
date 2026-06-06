# operator-ui — Themis Frontend

> Next.js 15 + Tailwind + shadcn pattern + Framer Motion.
> **Marita: aquí codeas.** Componentes ya wireados al backend, tú aplicas los mockups de Figma.

---

## Arranque rápido

```powershell
# Desde el ROOT del workspace (no aquí):
cd C:\Users\jhuly\Development\hack4her
pnpm install
pnpm dev:operator   # → http://localhost:3000
```

Verás 4 páginas funcionando con mock data:
- `/` — landing
- `/teach` — Capa 1 + 2 (observación + voz)
- `/execute` — Capa 1 + 2 + self-healing
- `/memory` — Capa 4 + 6 (knowledge graph + Solana)
- `/recommendations` — Capa 3 (Gemini)

---

## Qué está hecho (Jhulyam ya lo armó)

### Backend integrado
- ✅ `/api/whisper` — transcripción Whisper
- ✅ `/api/playbook/extract` — Claude → Playbook + Solana register
- ✅ `/api/recommendations` — Gemini cognitive
- ✅ `/api/solana/verify` — verifica tx on-chain
- ✅ `/api/voice` — ElevenLabs synthesis

### Componentes funcionales (con tipos correctos + data flow real)
- ✅ `SolanaBadge` — verified-on-chain badge
- ✅ `MappingTable` — tabla de mapeos en vivo
- ✅ `StepLog` — log de ejecución con self-healing
- ✅ `RecommendationsPanel` — panel Capa 3 ⭐
- ✅ `VoiceIndicator` — waveform Capa 2
- ✅ `MemoryGraphView` — knowledge graph Capa 4

### Hooks
- ✅ `useVoice` — TTS via ElevenLabs
- ✅ `useRecommendations` — Gemini wrapper

### Design tokens
- ✅ Pegados en `src/app/globals.css`
- ✅ Tailwind config con coral + status colors + custom animations
- ✅ Geist + JetBrains Mono cargados en layout

---

## Lo que TÚ haces, Marita

**No tocas:** lógica de hooks, API routes, types.

**Sí pules:**
1. **Layout y composición** — sigue los mockups de Figma de Ale
2. **Espaciado y jerarquía visual** — usa los design tokens (`bg-bg-surface`, `text-text-primary`, etc.)
3. **Animaciones** — Framer Motion ya está instalado, agrega motion en los componentes según mockup
4. **Variantes de Button/Badge** — agrega más si necesitas
5. **Iconos** — Lucide React ya está en `lucide-react`

### Ejemplo: pulir `RecommendationsPanel`

Cuando Ale te entregue el mockup #3, abre `src/components/RecommendationsPanel.tsx`:
1. El componente ya recibe la data correctamente
2. Solo cambia las clases de Tailwind para que matchee el mockup
3. Agrega animaciones extra si quieres (Framer Motion ya importado)
4. NO cambies los props ni la lógica

### Si necesitas más componentes shadcn

```powershell
cd apps/operator-ui
pnpm dlx shadcn@latest add dialog dropdown-menu tabs sheet input textarea
```

---

## Estructura

```
operator-ui/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── whisper/route.ts
│   │   │   ├── playbook/extract/route.ts
│   │   │   ├── recommendations/route.ts
│   │   │   ├── solana/verify/route.ts
│   │   │   └── voice/route.ts
│   │   ├── teach/page.tsx           # Capa 1 + 2 demo
│   │   ├── execute/page.tsx         # Capa 1 + 2 + self-healing demo
│   │   ├── memory/page.tsx          # Capa 4 + 6 demo
│   │   ├── recommendations/page.tsx # Capa 3 demo ⭐
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # landing
│   │   └── globals.css              # design tokens
│   ├── components/
│   │   ├── ui/                      # shadcn primitives (button, card, badge)
│   │   ├── SolanaBadge.tsx          # ⭐ Capa 6
│   │   ├── MappingTable.tsx
│   │   ├── StepLog.tsx
│   │   ├── RecommendationsPanel.tsx # ⭐ Capa 3
│   │   ├── VoiceIndicator.tsx
│   │   └── MemoryGraphView.tsx
│   ├── hooks/
│   │   ├── useVoice.ts
│   │   └── useRecommendations.ts
│   └── lib/
│       └── utils.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
├── postcss.config.mjs
└── components.json
```

---

## Mantra

> **Si no compila o no funciona algo, NO inventes — llama a Jhulyam.**
>
> **No cambies hooks, APIs, ni types.** Solo Tailwind classes y motion.
