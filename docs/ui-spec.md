# UI/UX Spec — Tuali Operator (Proyecto A)

> **Quién lee esto:** Marita (UI/UX Lead) y Carlos (Frontend Engineer).
> **Para qué:** alinear visión visual antes de tocar Figma o código. Esto define qué construimos y cómo se siente.
> **Status:** v1 — actualizar a v2 cuando el equipo confirme nombres de producto.

---

## 1. El producto en una frase

**Una herramienta interna de operaciones que se siente como Linear/Vercel/Notion, no como un portal SAP.** Densa, callada, scaneable, premium. Para personas que pasarán horas dentro de ella, no para un visitante que llega 30 segundos.

### El detalle memorable (el "wow" visual del producto)

**El navegador autónomo en vivo.** Cuando el agente está ejecutando, el navegador embedded muestra el cursor moverse solo con un sutil glow coral. El usuario ve, en tiempo real, una mano invisible operando un sistema. Esta es LA pantalla que define el producto. Marita y Carlos: piensen en esto como la estrella. Todo lo demás existe para llevar al usuario a este momento.

---

## 2. Design tokens (copy-paste ready)

### 2.1 Paleta

Sistema dark-first. Multi-dimensional (no monohue). Coral red como único acento de marca.

```css
/* docs/ui-spec.css → copy to apps/operator-ui/src/app/globals.css */

:root {
  /* Backgrounds */
  --bg-base: 0 0% 4%;        /* #0a0a0a — fondo más profundo */
  --bg-surface: 240 4% 9%;   /* #18181b — cards, panels */
  --bg-elevated: 240 4% 12%; /* #1f1f23 — popovers, dropdowns */
  --bg-overlay: 240 4% 6%;   /* #0f0f10 — modal backdrop */

  /* Borders */
  --border-subtle: 240 4% 14%;  /* #232327 — divisores delgados */
  --border-default: 240 4% 18%; /* #2a2a2f — bordes de cards */
  --border-strong: 240 4% 25%;  /* #3a3a42 — focus rings */

  /* Text */
  --text-primary: 0 0% 95%;     /* #f2f2f2 */
  --text-secondary: 240 4% 65%; /* #999ba0 */
  --text-tertiary: 240 4% 45%;  /* #6d6e72 */
  --text-disabled: 240 4% 28%;  /* #46474a */

  /* Brand accent (Tuali / Arca coral) */
  --accent-coral: 0 84% 60%;    /* #ef4444 */
  --accent-coral-soft: 0 84% 60% / 0.12;  /* fondo sutil */
  --accent-coral-glow: 0 84% 60% / 0.35;  /* glow para el cursor del agente */

  /* Status semantics */
  --status-success: 142 76% 45%;  /* #1aa653 — verde calmado */
  --status-warning: 38 92% 50%;   /* #f59e0b */
  --status-error: 0 72% 55%;      /* #dc2626 */
  --status-info: 217 92% 60%;     /* #3b82f6 */

  /* Motion */
  --motion-micro: 150ms;
  --motion-default: 300ms;
  --motion-entrance: 500ms;
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

  /* Spacing scale (rem) — múltiplos de 4px */
  --space-1: 0.25rem;  /*  4px */
  --space-2: 0.5rem;   /*  8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-5: 1.25rem;  /* 20px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */
  --space-10: 2.5rem;  /* 40px */
  --space-12: 3rem;    /* 48px */

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 6px;   /* default */
  --radius-lg: 8px;   /* cards */
  --radius-xl: 12px;  /* modals, sheets */

  /* Type scale */
  --type-xs: 0.75rem;   /* 12px — metadata, captions */
  --type-sm: 0.875rem;  /* 14px — body default */
  --type-base: 1rem;    /* 16px — body emphasis */
  --type-lg: 1.125rem;  /* 18px — section headers */
  --type-xl: 1.5rem;    /* 24px — page titles */
  --type-2xl: 2rem;     /* 32px — hero only */
}
```

### 2.2 Tipografía

```html
<!-- Add to app/layout.tsx <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
```

- **UI / cuerpo:** Geist Sans (`font-family: 'Geist', system-ui, sans-serif;`)
- **Datos, código, valores numéricos:** JetBrains Mono (`font-family: 'JetBrains Mono', ui-monospace, monospace;`)

**Regla:** los IDs, cantidades, timestamps, URLs y JSON van en mono. Todo el resto en Geist.

### 2.3 Tailwind config snippet

```typescript
// apps/operator-ui/tailwind.config.ts — add to theme.extend
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "hsl(var(--bg-base))",
          surface: "hsl(var(--bg-surface))",
          elevated: "hsl(var(--bg-elevated))",
          overlay: "hsl(var(--bg-overlay))",
        },
        border: {
          subtle: "hsl(var(--border-subtle))",
          DEFAULT: "hsl(var(--border-default))",
          strong: "hsl(var(--border-strong))",
        },
        text: {
          primary: "hsl(var(--text-primary))",
          secondary: "hsl(var(--text-secondary))",
          tertiary: "hsl(var(--text-tertiary))",
          disabled: "hsl(var(--text-disabled))",
        },
        coral: {
          DEFAULT: "hsl(var(--accent-coral))",
          soft: "hsl(var(--accent-coral-soft))",
          glow: "hsl(var(--accent-coral-glow))",
        },
        status: {
          success: "hsl(var(--status-success))",
          warning: "hsl(var(--status-warning))",
          error: "hsl(var(--status-error))",
          info: "hsl(var(--status-info))",
        },
      },
      fontFamily: {
        sans: ["Geist", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        DEFAULT: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
    },
  },
};

export default config;
```

---

## 3. Componentes shadcn a instalar

Carlos: corre estos cuando scaffolde el app.

```bash
cd apps/operator-ui
pnpm dlx shadcn@latest add \
  button card dialog sheet tabs table dropdown-menu \
  input label select separator textarea \
  badge progress avatar \
  scroll-area command tooltip toast \
  skeleton
```

**Custom components que Carlos construye encima:**

| Componente | Propósito | Estado base |
|---|---|---|
| `<PlaybookCard>` | Una fila en la lista del dashboard | shadcn Card + Badge |
| `<TeachRecorder>` | Split-screen de modo enseñar | Custom layout |
| `<PlaybookEditor>` | Vista del playbook extraído (editable) | shadcn Card + Input |
| `<ChatComposer>` | Input conversacional con stream | shadcn Textarea + Command |
| `<BrowserViewer>` | iframe + cursor overlay | iframe + framer-motion |
| `<StepLog>` | Lista de pasos con estado en tiempo real | shadcn Card list |
| `<BulkProgress>` | Dashboard de ejecución en lote | shadcn Progress + Table |
| `<SelfHealingIndicator>` | Animación de adaptación | framer-motion pulse |

---

## 4. Catálogo de pantallas

### 4.1 Dashboard / Lista de Playbooks

**URL:** `/`

```
┌─ Tuali Operator ───────────────────────────────────[●]─┐
│                                                        │
│  Procesos aprendidos                                   │
│  ──────────────────────────────────────────────        │
│                                                        │
│  [Buscar...]  [Todos] [Activos] [Recientes]            │
│                                                        │
│  ▶ Actualizar surtido por tienda                       │
│    Canal Moderno · 5 stores · 32 runs · 97% éxito      │
│    última: hace 2h                                     │
│  ───                                                   │
│  ▶ Generar pedido sugerido                             │
│    Cross-system · 1 store · 1 run · 100% éxito         │
│    última: ayer                                        │
│  ───                                                   │
│  ▶ Validar precios promocionales                       │
│    Canal Moderno · 3 stores · 8 runs · 88% éxito       │
│                                                        │
│                                          [+ Enseñar]   │
└────────────────────────────────────────────────────────┘
```

**Estados:**
- Empty: mensaje calmado + botón Enseñar grande, centrado, sin hero ni copy de marketing
- Loading: skeleton de 3 cards
- Con datos: lista paginada

**Quién:** Marita diseña, Carlos implementa.

---

### 4.2 Modo Enseñar (grabación activa)

**URL:** `/teach/[recordingId]`

```
┌─ Modo Enseñar  ●  02:14                  [Pausar][Fin]─┐
├─────────────────────────────────────┬──────────────────┤
│                                     │ PASOS DETECTADOS │
│  ┌─ Navegador (Canal Moderno) ───┐  │                  │
│  │                               │  │ ✓ Login          │
│  │  [Portal en vivo]             │  │   1.2s           │
│  │                               │  │ ✓ Click Surtido  │
│  │                               │  │   0.5s           │
│  │                               │  │ ✓ Buscar 1234    │
│  │                               │  │   1.8s           │
│  │                               │  │ ⏺ Capturando...  │
│  └───────────────────────────────┘  │                  │
│                                     ├──────────────────┤
│                                     │ 🎤 ▁▂▆▆▅▃▁       │
│                                     │ "Voy a poner 50  │
│                                     │  unidades de..." │
└─────────────────────────────────────┴──────────────────┘
```

**Estados:**
- Grabando: indicador rojo pulsante, micrófono activo con waveform
- Pausado: indicador amarillo estático
- Procesando (al terminar): overlay con "Extrayendo proceso..." y spinner

**Comportamiento:**
- La columna derecha se actualiza con cada paso detectado (animación slide-in desde derecha)
- El waveform del mic es REAL (Web Audio API), no fake
- Al terminar, transición suave a vista de playbook extraído

**Quién:** Marita diseña con énfasis en sensación "alguien está mirando" calmado, no surveillant agresivo. Carlos implementa con framer-motion para los slide-ins.

---

### 4.3 Playbook View (extracted from recording)

**URL:** `/playbooks/[id]`

```
┌─ Tuali Operator ───────────────────────────────────────┐
│                                                        │
│  Actualizar surtido por tienda                  [✏ ✕]  │
│  Canal Moderno · Aprendido hace 3 min                  │
│  ───────────────────────────────────────────────       │
│                                                        │
│  Pasos (6)                                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 1. → Ir a /portal/login                          │  │
│  │ 2. ⌨ Login con { username }                       │  │
│  │ 3. ⤵ Click en "Surtido"                          │  │
│  │ 4. 🔍 Buscar tienda { store_id }                 │  │
│  │ 5. ⌨ Capturar { quantity } en cantidad de {sku}  │  │
│  │ 6. 💾 Click "Guardar"                            │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  Variables (3)                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  store_id   ej. 1234                             │  │
│  │  sku        ej. Coca 600ml                       │  │
│  │  quantity   ej. 50                               │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  [Descartar]               [Probar ejecución →]        │
└────────────────────────────────────────────────────────┘
```

**Detalle visual clave:** las variables en los pasos aparecen como **pills coral en mono**: `{ store_id }`. Esto enseña visualmente qué es parametrizable.

**Quién:** Marita diseña la jerarquía de pasos vs variables. Carlos implementa con shadcn Card.

---

### 4.4 Conversational Orchestration (chat-based execute) — LA CAPACIDAD 3

**URL:** `/agente` o panel embedded

```
┌─ Tuali Operator ───────────────────────────────────────┐
│                                                        │
│  Agente Tuali                                          │
│  ───────────────────────                               │
│                                                        │
│  ┌─ Conversación ──────────────────────────────────┐   │
│  │                                                 │   │
│  │ Tú:                                             │   │
│  │ Actualiza surtido de Coca 600ml a 50 unidades  │   │
│  │ en todas las OXXO de Querétaro.                 │   │
│  │                                                 │   │
│  │ Agente:                                         │   │
│  │ Entendido. Encontré 30 OXXO en Querétaro.       │   │
│  │ Voy a ejecutar el playbook "actualizar surtido" │   │
│  │ con esos parámetros.                            │   │
│  │                                                 │   │
│  │ [▶ Ejecutar 30 instancias]  [Cancelar]          │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Escribe lo que quieres hacer...        [Enviar] │   │
│  └─────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘
```

**Comportamiento:**
- Respuesta del agente con **stream visible** (typing effect REAL via Vercel AI SDK)
- Acciones propuestas aparecen como botones inline (no en barra inferior separada)
- Después de confirmar, transiciona suavemente a `<BulkProgress>` (no navega — overlay)

**Comandos soportados (lista cerrada):**
1. "Actualiza surtido de {SKU} a {N} en todas las {tipo} de {zona}"
2. "Ejecuta {playbook} para {filtro de tiendas}"
3. "Muestra los procesos aprendidos sobre {tema}"
4. "¿Cuántas ejecuciones se han hecho hoy?"
5. "¿Por qué falló la última ejecución?"
6. (5 más definir en hora 18)

**Quién:** Marita diseña sensación de "tienes un colega digital". Carlos implementa con `@assistant-ui/react` o shadcn chat + Vercel AI SDK.

---

### 4.5 Ejecución en Vivo (el momento del wow)

**URL:** `/executions/[id]`

```
┌─ Ejecución en vivo ─────────────────────────[Detener]──┐
├─────────────────────────────────────────────┬──────────┤
│                                             │ PASOS    │
│ ⏵ Ejecutando · 00:08 · paso 4 de 6          │          │
│                                             │ ✓ Login  │
│ ┌─ Navegador (Canal Moderno) ─────────────┐ │   1.2s   │
│ │                                         │ │ ✓ Surt.  │
│ │  [Portal con cursor moviendose solo]    │ │   0.5s   │
│ │  ✦ ← cursor con sutil glow coral        │ │ ✓ Buscar │
│ │                                         │ │   1.8s   │
│ │                                         │ │ ⏺ Cantid │
│ │  Tienda: 5678                           │ │   ...    │
│ │  SKU:    Sprite 500ml                   │ │ · Guard. │
│ │  Cant:   [ 30 ]                         │ │ · ...    │
│ │                                         │ │          │
│ └─────────────────────────────────────────┘ │ Params:  │
│                                             │ store    │
│                                             │   5678   │
│                                             │ sku      │
│                                             │   Sprite │
│                                             │ qty      │
│                                             │   30     │
└─────────────────────────────────────────────┴──────────┘
```

**Detalles visuales críticos (Marita: esto es la estrella):**
- **El cursor del agente** dentro del iframe se renderiza como un punto coral 6px con halo de 16px y opacity 35% (`bg-coral/35`). Se mueve con `framer-motion`, no con CSS transition.
- **Paso actual en el log derecho** tiene border-left coral 2px + pulse sutil (1.5s loop)
- **Pasos completados** muestran timing en mono (`1.2s`) en gris secondary
- **Pasos futuros** muestran solo el icono `·` en gris terciario
- **Bottom-right del log:** card con parámetros activos en mono

**Quién:** Marita diseña el cursor + animación. Carlos implementa con framer-motion + iframe postMessage para position.

---

### 4.6 Self-Healing Moment (Capacidad 2 — el segundo wow)

**Trigger:** durante ejecución, sistema detecta que un selector no resuelve. UI cambia el step a estado "adaptando".

```
┌─ Step Log durante self-healing ─────────┐
│                                         │
│ ✓ Login              1.2s               │
│ ✓ Click Surtido      0.5s               │
│ ✓ Buscar tienda      1.8s               │
│ ⚡ Adaptando...      ◯◯◯  ← pulse       │
│   "El botón cambió.                     │
│    Buscando equivalente con visión..."  │
│ · Capturar cantidad                     │
│ · Guardar                               │
│                                         │
└─────────────────────────────────────────┘

Después de ~2 segundos:

┌─ Step Log post self-healing ────────────┐
│                                         │
│ ✓ Login              1.2s               │
│ ✓ Click Surtido      0.5s               │
│ ✓ Buscar tienda      1.8s               │
│ ✓ Click guardar      2.1s ⚡            │ ← icono ⚡ amarillo
│   "Adaptó al cambio de UI"              │ ← caption pequeña
│ ⏺ Capturando cantidad...                │
│                                         │
└─────────────────────────────────────────┘
```

**Detalles visuales:**
- El estado "Adaptando" usa color `--status-warning` (amarillo)
- Los 3 dots `◯◯◯` pulsan en secuencia (300ms cada uno, loop)
- Al completar, el ✓ verde aparece con un destello amarillo de fondo que se desvanece (500ms)
- El icono ⚡ permanece al lado del timing como insignia "este paso se adaptó"

**Quién:** Marita owns este momento completo. Carlos implementa la animación con framer-motion `<AnimatePresence>` y key changes.

---

### 4.7 Bulk Progress (durante lote conversacional)

**URL:** `/executions/bulk/[id]`

```
┌─ Lote en progreso ──────────────────────────[Detener]──┐
│                                                        │
│  Actualizar surtido · Sprite 500ml · 30 OXXO Querétaro │
│                                                        │
│  ████████████████░░░░░░░░░░░░░░░░░░░░  16/30 · 53%     │
│  Estimado: 8:24 restante                               │
│                                                        │
│  ┌──────────┬──────────┬───────────┬──────────────┐    │
│  │ Éxito 14 │ Falla 1  │ En curso 1│ Pendiente 14 │    │
│  └──────────┴──────────┴───────────┴──────────────┘    │
│                                                        │
│  Última ejecución                                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │ OXXO Constituyentes (1234)  · 18.4s · ✓ éxito   │  │
│  │ OXXO Centro (5678)          · 22.1s · ⚡ adaptó  │  │
│  │ OXXO Plaza (9012)           · 31.0s · ✗ fallo   │  │
│  │   "Tienda no encontrada en portal"               │  │
│  │ OXXO Norte (3456)           · 19.8s · ✓ éxito   │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

**Comportamiento:**
- Progress bar coral, fondo zinc-800
- Las 4 métricas top: cards independientes, sin recuadros decorativos
- Lista de últimas ejecuciones: tabla minimal, scroll vertical, nuevas entradas slide-in desde arriba
- Las fallidas: subtle red tint en background de la fila, NO toda en rojo

**Quién:** Marita diseña la jerarquía visual de las métricas. Carlos implementa con shadcn Table + Tanstack Table virtualizada (si hay más de 30 filas).

---

### 4.8 Mock Portal — Canal Moderno (Emi/Carlos construyen — Marita revisa look)

**URL:** `localhost:3001/portal/*`

Look intencional **opuesto** al Operator: portal corporativo mexicano estilo SAP Fiori.

```
┌─ Tuali · Canal Moderno ───────────[maria@arca] [⏏]─────┐
│                                                        │
│  📋 Inicio                                             │
│  🏪 Tiendas         Actualizar Surtido                 │
│  📦 Surtido                                            │
│  🚚 Pedidos         Tienda:  [ Buscar...   ] [Q]       │
│  📊 Reportes                                           │
│  ⚙️ Configuración   ┌──────────────────────────────┐   │
│                     │ SKU             Cantidad     │   │
│                     ├──────────────────────────────┤   │
│                     │ Coca 600ml      [    50  ] 💾│   │
│                     │ Sprite 500ml    [    30  ] 💾│   │
│                     │ Fanta 600ml     [    45  ] 💾│   │
│                     │ Powerade 600ml  [     0  ] 💾│   │
│                     └──────────────────────────────┘   │
│                                                        │
│                              [Guardar cambios]         │
└────────────────────────────────────────────────────────┘
```

**Detalles:**
- Background: blanco (#ffffff)
- Brand color: azul corporativo (#0066a3)
- Tipografía: system-ui o Arial — explicitamente NO premium
- Iconos: emoji o íconos genéricos, NO Lucide premium
- Espaciado: denso, sin generosidad

**Por qué importa:** el contraste entre el portal feo y el Operator premium ES el storytelling. Cuando Carlos cambie del mock-portal al operator-ui en el demo, los jueces deben SENTIR la diferencia.

---

## 5. Interacción y motion

### 5.1 Principios de motion

| Tipo | Duración | Curve | Cuándo |
|---|---|---|---|
| Micro (hover, focus) | 150ms | `--ease-default` | Botones, links |
| Default (transitions) | 300ms | `--ease-default` | Modales, sheets, page transitions |
| Entrance (list items) | 500ms | `--ease-spring` | Lista nueva entrando |
| Pulse | 1500ms loop | `--ease-default` | Recording indicator, paso activo |

### 5.2 Animaciones específicas

**Step log entry (modo enseñar y modo ejecutar):**
```tsx
<motion.div
  initial={{ opacity: 0, x: 12 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
/>
```

**Agent cursor (en el browser viewer):**
```tsx
<motion.div
  animate={{ x: targetX, y: targetY }}
  transition={{ type: "spring", stiffness: 200, damping: 25 }}
  className="absolute w-1.5 h-1.5 rounded-full bg-coral
             shadow-[0_0_16px_4px_hsl(var(--accent-coral-glow))]"
/>
```

**Self-healing pulse:**
```tsx
<motion.div
  animate={{ opacity: [0.3, 1, 0.3] }}
  transition={{ duration: 1.5, repeat: Infinity }}
  className="w-2 h-2 rounded-full bg-status-warning"
/>
```

**Recording indicator (modo enseñar):**
```tsx
<motion.div
  animate={{ scale: [1, 1.15, 1], opacity: [1, 0.7, 1] }}
  transition={{ duration: 1.5, repeat: Infinity }}
  className="w-2 h-2 rounded-full bg-status-error"
/>
```

### 5.3 Navegación

- **Sin sidebar.** El operador es de flujo, no de exploración. Top-bar minimalista.
- **Modales para confirmaciones.** Sheets para detalles.
- **Páginas full-screen** para ejecuciones (`/executions/[id]`) — no overlay.
- **Volver:** breadcrumb sutil arriba a la izquierda, no botón "Atrás" gigante.

---

## 6. Voice / Tone (copy)

| Atributo | Sí | No |
|---|---|---|
| Tono | Directo, profesional, sin floritura | Marketingero, exclamativo, animado |
| Tense | Presente, imperativo | Futuro condicional |
| Persona | "Tú/Usted" mexicano formal | "Vos", spanglish, slang |
| Errores | "El paso 4 falló: tienda no encontrada" | "¡Oops! Algo salió mal :(" |
| Estados | "Ejecutando..." / "Adaptado" | "¡Funcionando!" / "¡Listo!" |
| CTAs | "Ejecutar", "Enseñar nuevo", "Probar" | "¡Empieza ahora!", "Click aquí" |

**Sin signos de exclamación. Sin emojis en UI (excepto el mock portal feo).** El producto **no se emociona**. Hace su trabajo bien.

---

## 7. Anti-patterns que MATAN el demo

Marita y Carlos: si se descubren haciendo cualquiera de estos, paren.

- ❌ Hero gigante "Welcome to Tuali Operator" en la home
- ❌ Onboarding tour con tooltips numerados
- ❌ Gradientes morados/azules atmosféricos
- ❌ Blobs decorativos flotantes / partículas
- ❌ Cards dentro de cards (nunca se ve bien)
- ❌ Iconos emoji decorativos en el Operator UI
- ❌ "Splash" entre páginas
- ❌ Modal de confirmación para cada acción (solo para destructivas)
- ❌ Loaders gigantes centrados (usa skeletons)
- ❌ Notificaciones toast con animación bounce
- ❌ Border-radius de 16px+ (se ve infantil para una herramienta operativa)
- ❌ Fuentes muy ligeras (font-weight 300) — denso requiere weight 400-500
- ❌ Texto centrado en bloques largos
- ❌ Glassmorphism / blur backgrounds (no son nuestra estética)

---

## 8. Checklist hora 0

### Marita

- [ ] Lee este spec completo (~20 min)
- [ ] Abre Figma con frame 1440x900, fondo `#0a0a0a`
- [ ] Importa fuentes Geist y JetBrains Mono
- [ ] Crea los color styles del bloque de paleta (sección 2.1)
- [ ] Empieza con la pantalla **4.5 Ejecución en Vivo** (la del wow) — define el lenguaje visual, lo demás escala
- [ ] Luego 4.1 Dashboard
- [ ] Luego 4.6 Self-Healing moment (crítico)
- [ ] El resto las hace conforme Carlos avanza implementación

### Carlos

- [ ] Lee este spec completo (~20 min)
- [ ] Scaffold de `apps/operator-ui` con Next.js + Tailwind (ver README de Themis)
- [ ] Pega `tokens.css` en `src/app/globals.css`
- [ ] Pega el Tailwind config snippet en `tailwind.config.ts`
- [ ] Instala las fuentes en `app/layout.tsx`
- [ ] Corre el comando shadcn add con la lista de la sección 3
- [ ] Instala `framer-motion`, `@assistant-ui/react`, `@tanstack/react-table`, `recharts`
- [ ] Empieza por `<PlaybookCard>` y el Dashboard (4.1) — es el reto técnico más bajo, te calienta
- [ ] Luego `<TeachRecorder>` (4.2)
- [ ] Después `<BrowserViewer>` + cursor animado (4.5) — el reto técnico más alto
- [ ] Coordina con Jhulyam para postMessage protocol entre el iframe del browser y el Operator UI

---

## 9. Pre-flight check antes de mergear cualquier componente

Antes de hacer push de un componente, valida:

- [ ] Funciona en dark mode (todos los colores via tokens)
- [ ] Tipografía es Geist para UI y JetBrains Mono para datos
- [ ] Border radius máximo 8px (excepto modales que pueden 12px)
- [ ] Cero emojis decorativos
- [ ] Cero gradientes morados/azules genéricos
- [ ] No hay "cards dentro de cards"
- [ ] Texto wrap correctamente a 1280px Y a 1920px (los 2 tamaños del demo)
- [ ] Las acciones primarias son coral, todas las secundarias son ghost
- [ ] Motion respeta `prefers-reduced-motion`

---

## 10. Si algo no está claro

Marita y Carlos: pregunten antes de inventar. **Cinco minutos de pregunta = cinco horas de re-trabajo evitadas.** Canal directo entre los 2 abierto 24/7 durante el hack.

**Y siempre:** ¿esto crea un wow en el demo de 4:30 min? Si no, simplificar.
