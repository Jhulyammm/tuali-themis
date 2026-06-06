# MARITA.md — Guía de Integración UI/UX

> **Para Marita.** Léelo completo antes de tocar código. ~10 min.
> Lo importante: **la lógica ya está conectada al backend real.** Tu trabajo es polish visual + animaciones.

---

## 🚦 Estado al 6 de junio · noche

| Cosa | Status | Quién toca |
|------|--------|-----------|
| 6 capas con APIs reales conectadas | ✅ Funcionando | NO TOCAR |
| Diseño visual de las pantallas | ⚠️ Funcional pero feo | **TÚ pules** |
| Animaciones / motion polish | ⚠️ Básico | **TÚ refinas** |
| Mockups de Ale → componentes reales | ⏳ Esperando | **TÚ adaptas** |

---

## 🎯 Lo que YA funciona end-to-end

### Capa 1 (Aprender + Ejecutar)
- `/teach` → click "Generar Playbook real" → Claude extrae un Playbook real → Solana lo firma → MongoDB lo guarda
- `/execute` → Stagehand REAL contra automationexercise.com → captura datos en erp-destino

### Capa 2 (Voz)
- ElevenLabs configurado. Themis narra cada paso en voz natural.
- Hook: `useVoice()` — solo llamas `speak("texto")`. NO toques esto.

### Capa 3 (Razonamiento contextual)
- `/recommendations` → Gemini Pro analiza zona + evento + histórico
- **Si Gemini falla, automáticamente cae a Claude.** Demo nunca rompe.

### Capa 4 (Knowledge graph)
- `/memory` → muestra mapeos reales persistidos
- Backend: MongoDB Atlas si conecta, filesystem si no

### Capa 6 (Solana blockchain)
- Cada playbook aprendido se hashea y firma on-chain
- Badge `SolanaBadge` clickeable → abre Solana Explorer
- Endpoint health: `/api/solana/health`

---

## 🛠️ Cómo arrancar todo

### Necesitas DOS terminales corriendo en paralelo:

**Terminal 1 — Operator UI (puerto 3000):**
```powershell
cd C:\Users\jhuly\Development\hack4her
pnpm env:sync       # sincroniza .env.local cada vez que actualices keys
pnpm dev:operator
```

**Terminal 2 — ERP Destino (puerto 3001):**
```powershell
pnpm dev:destino
```

### URLs para probar:
- http://localhost:3000 — Themis (lo que TÚ pules)
- http://localhost:3000/diagnostics — verificar que las 6 capas estén LIVE
- http://localhost:3001 — el ERP corporativo (sistema B, no toques este)

---

## 📂 Estructura — qué hay y qué pules

### apps/operator-ui/src/app/ — Pages (TÚ las pules visualmente)

| Página | Mockup de Ale | Capa demostrada | Estado |
|--------|---------------|-----------------|--------|
| `page.tsx` | Landing | — | Funcional, simple |
| `teach/page.tsx` | Mockup #2 (Observación) | 1 + 2 + 6 | Wireada al real |
| `execute/page.tsx` | Mockup #5 + #6 (Ejecución + Self-healing) | 1 + 2 | Wireada al real |
| `validate/page.tsx` | (sin mockup todavía) | 1 (criterio 3) | Side-by-side básico |
| `memory/page.tsx` | Mockup #4 (Memory Graph) | 4 + 6 | Lee data real |
| `recommendations/page.tsx` | Mockup #3 (Recomendaciones) | 3 | LA ESTRELLA |
| `diagnostics/page.tsx` | — | system check | No tocar |

### apps/operator-ui/src/components/ — Componentes reusables

| Componente | Qué hace | Mockup correspondiente |
|------------|----------|------------------------|
| `MappingTable.tsx` | Tabla de mapeos source → destino | Mockup #2 |
| `StepLog.tsx` | Lista de pasos con estados (succeeded, adapting ⚡) | Mockup #6 |
| `RecommendationsPanel.tsx` | Panel de Gemini con recomendaciones | Mockup #3 ⭐ |
| `SolanaBadge.tsx` | Badge "Verified on Solana" | Lo usas dentro de otros |
| `MemoryGraphView.tsx` | Grid de mapeos previos | Mockup #4 |
| `VoiceIndicator.tsx` | Waveform animado de voz | Inline en páginas |
| `BrowserViewer.tsx` | Placeholder de navegador | Mockup en /teach y /execute |
| `ui/button.tsx`, `card.tsx`, `badge.tsx` | shadcn primitives | base |

---

## 🎨 Lo que TÚ haces (y lo que NO)

### ✅ Sí pules

1. **Classes de Tailwind** — cambias colores, spacing, sizes para matchear mockups de Ale
2. **Layout / composición** — reordenar columnas, grids, espaciados
3. **Motion con Framer Motion** — agregar animaciones de aparición, hover, transiciones
4. **Tokens visuales** — `bg-bg-surface`, `text-text-primary`, `border-default`, etc. ya están en `globals.css`
5. **Estados visuales** — hover, focus, loading, success, error
6. **Tipografía y jerarquía** — pesos, tamaños, kerning
7. **Iconos extras** — Lucide React ya está, agrega los que necesites

### ❌ NO toques (rompe el demo)

1. **Hooks** (`useVoice`, `useRecommendations`) — son la lógica de fetch
2. **API routes** (`/api/*`) — backend que conecta con Claude/Stagehand/Solana
3. **Props de componentes** — los types están definidos, no cambies
4. **Lógica de useState/useEffect** — son los flujos de datos
5. **fetch() calls** — las URLs y bodies son contratos
6. **Imports** desde `@hack4her/agent/*` o `@hack4her/db/*`

---

## 🎬 Las 4 pantallas críticas para el pitch

### 1. `/teach` — Mockup #2 (Observación)
**Demo: click "Generar Playbook real" → 30 seg después aparece card verde con Solana badge.**

Lo que tú pules:
- El layout del split-screen (browser viewer izquierda · mappings derecha)
- La animación de cuando aparece el card verde
- El `SolanaBadge` debe verse premium

### 2. `/execute` — Mockup #5 + #6 (Ejecución + Self-healing)
**Demo: selecciona playbook → "Ejecutar REAL" → 30-60 seg viendo el navegador → ✓ pasos.**

Lo que tú pules:
- El `StepLog` debe tener motion clara cuando un paso se completa
- El icono ⚡ cuando hay self-healing (status "adapting")
- El "Visual demo" sigue activo para el pitch — anímalo bien

### 3. `/recommendations` — Mockup #3 ⭐ LA ESTRELLA
**Demo: click "Generar recomendaciones" → Gemini (o Claude fallback) razona en vivo.**

Esto es lo que más se ve en el pitch del Acto 3b. Pule:
- Layout del `RecommendationsPanel`
- Animación de las recomendaciones apareciendo una por una
- El badge del evento próximo

### 4. `/memory` + `/validate` — Mockup #4 (Memory Graph)
**Memory:** lista de playbooks aprendidos con badges Solana clickeables.
**Validate:** side-by-side de exactitud (criterio 3 del jurado).

---

## 🔥 Tip de Marita: cómo probar tus cambios

```powershell
# Si cambias tokens del globals.css o tailwind config:
# 1. Reinicia el server
# 2. Refresca con Ctrl+Shift+R en el navegador

# Si solo cambias TSX/JSX:
# Hot reload toma los cambios solo
```

Si algo NO se ve igual de inmediato: borra el cache.
```powershell
Remove-Item -Recurse -Force apps\operator-ui\.next
pnpm dev:operator
```

---

## 🚑 Si algo no funciona

| Síntoma | Causa probable | Fix |
|---------|----------------|-----|
| Página tira 500 | API key falta en `.env.local` | Pega la key + `pnpm env:sync` + restart |
| Capa muestra MOCK en /diagnostics | Misma cosa | Mismo fix |
| "Cannot find module" | pnpm install incompleto | `pnpm install` al root |
| Imagen rota en BrowserViewer | El sitio bloquea iframes | Es **intencional**, no se arregla, es así |
| Self-healing ⚡ no se ve | Solo aparece en visual demo | Click "Visual demo" en /execute |

Si en serio se rompió algo: dile a Jhulyam y te ayuda.

---

## 📝 Donde están los archivos clave para ti

```
apps/operator-ui/src/
├── app/
│   ├── globals.css            ← tokens de color, fuentes (sí toca)
│   ├── page.tsx               ← landing (sí toca)
│   ├── teach/page.tsx         ← Modo Observación (sí pule)
│   ├── execute/page.tsx       ← Modo Ejecutar (sí pule)
│   ├── memory/page.tsx        ← Memory Graph (sí pule)
│   ├── recommendations/page.tsx ⭐ Capa 3 (sí pule, ES LA ESTRELLA)
│   └── validate/page.tsx      ← Side-by-side validation (sí pule)
├── components/
│   ├── ui/                    ← shadcn primitives (variants sí, lógica no)
│   ├── MappingTable.tsx       ← sí pule
│   ├── StepLog.tsx            ← sí pule (animar ⚡)
│   ├── RecommendationsPanel.tsx ⭐ sí pule
│   ├── SolanaBadge.tsx        ← sí pule
│   ├── MemoryGraphView.tsx    ← sí pule
│   ├── VoiceIndicator.tsx     ← sí pule
│   └── BrowserViewer.tsx      ← sí pule
└── lib/
    └── utils.ts               ← helpers (no toca)
```

---

## 🤝 Cuando estés lista para integrar mockup de Ale

Para CADA mockup que te entregue Ale:

1. Identifica qué página/componente corresponde (ver tabla arriba)
2. Abre ese archivo `.tsx`
3. Cambia SOLO las classes de Tailwind y el layout JSX para matchear el mockup
4. NO cambies props, hooks, ni fetch calls
5. Refresca y verifica

Si dudas de algo: pregunta antes de tocar. Cinco minutos de pregunta = cinco horas de re-trabajo.

**Themis trae orden donde no hay estándar. Tú le das la cara.** 🎨
