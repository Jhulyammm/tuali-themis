# Tareas para Ale — Diseño UI/UX + Pitch (con Marita)

> **Rol:** Diseñadora visual / UI/UX Lead + Co-pitcher.
> **Pipeline diseño:** Tú entregas mockup → Marita lo convierte a React.
> **Pipeline pitch:** Tú + Marita lo arman juntas. Tú la narrativa visual y estructura, Marita la parte técnica y los ensayos.

---

## 📍 Status actual (lee esto primero)

| Cosa | Estado |
|------|--------|
| Cuentas + keys MLH | ✅ Marita las creó |
| Mockups iniciales (Dashboard, ERP, observación) | ⚠️ Verifica con Marita qué ya pasó |
| **Recommendations panel (Capa 3) — LA ESTRELLA** | 🔥 Funciona LIVE, falta polish visual |
| **Pitch deck v0** | ⏳ Tu siguiente foco |
| Video backup + ensayos | ⏳ Últimas horas |

**Foco AHORA:** mockups que quedan (sobre todo Recommendations panel) + arranque del pitch deck.

---

---

## ✅ AHORA (próximos 30 minutos)

### Lectura crítica (15 min)
- [ ] [`KICKOFF.md`](KICKOFF.md) — qué construimos, las 6 capas, contexto
- [ ] [`docs/ui-spec.md`](docs/ui-spec.md) — TOKENS, paleta, tipografía, motion patterns (este es tu manual)
- [ ] [`docs/concept-walkthrough.md`](docs/concept-walkthrough.md) — la historia que el producto cuenta (5 min)

### Setup Figma (15 min)
- [ ] Frame 1440×900 con fondo `#0a0a0a` (dark mode default)
- [ ] Importa fuentes: **Geist Sans** (UI) + **JetBrains Mono** (datos, números)
- [ ] Crea color styles copiando el bloque de tokens de `ui-spec.md` sección 2.1
- [ ] Crea text styles con jerarquía: H1 32px / H2 24px / Body 14px / Caption 12px / Mono 14px

---

## 🎨 Mockups en ORDEN ESTRICTO (12-15h en h0-h28)

**Workflow crítico:** apenas termines UN mockup, mándale screenshot/link a Marita por chat. Ella lo arranca a codear mientras tú haces el siguiente. **No esperes a tener todos para entregar.**

### Sprint 1 — Foundational (3-4h)
1. **Dashboard inicial** (1h) — pantalla de bienvenida, lista vacía, CTA "Empezar nuevo proceso"
2. **Modo Observación: tabla de mapeo aprendido creciendo** (2h) — izquierda navegador embedded, derecha tabla que crece con cada campo detectado
3. **ERP destino form (Sistema B)** (1h) — form corporativo SAP-like, look intencionalmente FEO (azul corporativo, denso, sin polish premium)

### Sprint 2 — Capas brillantes (5-6h)
4. **★ Panel de Recomendaciones Contextuales** (Capa 3 — Paso 3b del demo) (2h)
   - **LA ESTRELLA visual del demo**
   - Header: "Tienda: OXXO Tec Sur · Zona universitaria · Monterrey"
   - Body: lista de recomendaciones cuantitativas (`+35% sobre base`)
   - Footer: justificación en lenguaje natural generada por Gemini
   - Buttons: `[Aplicar]` `[Rechazar]`
   - Mira el wireframe ASCII en [`PLAN.md` sección Capa 3](PLAN.md)

5. **Step log con voz activa** (Capa 1 + 2 — Paso 3a) (1.5h)
   - Lista vertical de pasos siendo ejecutados
   - Cada paso: icono de estado + nombre + tiempo (en mono)
   - Estado actual con border-left coral + pulse
   - Estado `adapting ⚡` en amarillo (este es el momento self-healing)
   - Bottom: waveform de la voz de Themis hablando

6. **Self-healing momento ⚡** (Capa 1 — Paso 5a) (1.5h)
   - Animation states: `executing` → `adapting...` (pulse amarillo) → `succeeded ⚡`
   - El icono ⚡ es PERMANENTE después, como insignia
   - Texto: "Adaptó al cambio: 'Cantidad' → 'Cantidad solicitada'"

### Sprint 3 — Memoria + Verificación (3h)
7. **Memory Graph view** (Capa 4 — Paso 5b) (1.5h)
   - Grid o tabla de mapeos previos consultables
   - Cada item: source field, destination field, confidence (mono), zone context
   - Filtros por sitio origen / destino

8. **Solana Verified badge** (Capa 6 — Pasos 2, 5b) (1.5h)
   - Badge pequeño con shield + texto "Verified on Solana ✓"
   - Hash truncado en mono: `tx: 5KJp7...`
   - Click → abre Solana Explorer en nueva pestaña
   - Animación de aparición cuando el agente registra (fade-in 300ms)

### Cierre (1h)
9. **Pantalla cierre del demo** — slide con badges de Vultr URL + Solana Explorer + GitHub repo

---

## 🎨 Design System en Figma (4h en paralelo)

Mientras esperas feedback en mockups, arma el sistema:

- [ ] Color styles del bloque CSS de `ui-spec.md` (todos los tokens)
- [ ] Text styles con escalas (Geist Sans 12/14/16/24/32 + JetBrains Mono 14/16)
- [ ] Variantes de estado por componente: **normal / hover / loading / success / error / adapting ⚡**
- [ ] Componentes base reusables:
   - Button (3 variantes: primary coral / secondary ghost / ghost icon)
   - Card (con header / body / footer)
   - Badge (status colors + Solana)
   - Input (con label + error state)
   - Toast (success / error / info)

---

## ✨ Polish + animaciones (2h en h32-h34)

Mientras Marita pule el código, tú especificas el motion en Figma:

- [ ] Self-healing pulse: amarillo, 1.5s loop infinito, 3 dots secuencia
- [ ] Reveal de recomendaciones (Capa 3): slide-in desde derecha, 300ms ease-out
- [ ] Typing animation para narración: ya viene del Vercel AI SDK, no necesitas diseño
- [ ] Solana Badge aparece: fade-in + scale 0.95→1.0, 300ms, spring
- [ ] Tabla de mapeo: nueva fila slide-in desde abajo + highlight 800ms

Entregas: anota en cada mockup el motion spec (duración + curve) directamente como nota o sticky.

---

## 🎤 Pitch deck — Co-ownership con Marita (8h en h6-h36)

**División Ale ↔ Marita:**
- **Ale (tú):** estructura narrativa + diseño visual de los slides + memorización de apertura/cierre.
- **Marita:** contenido técnico + screenshots del demo en vivo + grabación del video backup + cronómetro en ensayos.
- **Juntas:** 3 ensayos cronometrados en h44-h46.

### Estructura del deck (10 slides, 13 min de pitch)

1. **Apertura** — Themis era la diosa griega del orden divino... *(30 seg — tú la memorizas)*
2. **El dolor del EDI** — 6 meses, miles de pesos, alguien copia datos a mano *(45 seg)*
3. **Capa 1: aprende viendo** — screenshot del modo observación
4. **Capa 2: te habla** — voice waveform en pantalla
5. **Capa 3: razona con contexto** — panel de recomendaciones
6. **Capa 4: recuerda** — memory graph view
7. **Capa 5: escala** — URL real de Vultr
8. **Capa 6: prueba on-chain** — Solana Explorer link
9. **Pregunta-killer del jurado: 5 respuestas** — lee `pitch-killer-lines.md` cuando exista
10. **Cierre + equipo + URLs**

### Pitch line de apertura (memorízala palabra por palabra)

> *"Themis era la diosa griega del orden divino — la que traía balance al caos cuando no había reglas escritas. Implementar EDI entre Arca y un cliente nuevo: 6 meses. Mientras tanto, alguien copia datos a mano. Cero estándar. Cero escala. Hoy construimos un agente cognitivo que aprende, razona, recuerda, y prueba criptográficamente lo aprendido. Su nombre es Themis."*

### Pitch line de cierre (también memorizar)

> *"Themis es seis capas: aprende, te habla, razona con contexto, recuerda, escala en Vultr, prueba en Solana. Es la primera capa de fuerza laboral cognitiva verificable para CPG. Themis trae orden donde no hay estándar."*

---

## 🚫 Bloqueos — qué hacer

- **No sé qué color usar:** revisa `docs/ui-spec.md` sección 2 (TODO está ahí).
- **No sé cómo se conecta esta pantalla con otra:** revisa `docs/concept-walkthrough.md` (es la historia completa).
- **Marita está esperando mockup pero estoy en otro:** entrega lo que tienes con nota de "v1 — voy a pulir después", no la bloquees.
- **No me siento segura del diseño:** mándale screenshot a Jhulyam por chat, te da feedback en 5 min.
- **El pitch no fluye en los ensayos:** ajustamos con Jhulyam en 10 min antes del final.

---

## Mantra

> **Tu trabajo no es hacer mockups bonitos. Es contar la historia de Themis con imágenes.**
>
> **Cada pantalla tiene que poderse mirar en 5 segundos y entender qué pasa.** Si necesita explicación, está mal.
