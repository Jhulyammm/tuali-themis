# Skill — Emi (Pitch Lead + Backend Support)

> Destilado de `docs/references/skills/frontend-slides/SKILL.md`
> Léelo en hora 0. ~3 min.

## El template ya existe

`docs/references/skills/frontend-slides/` contiene:
- `html-template.md` — template HTML completo, copia y adapta
- `STYLE_PRESETS.md` — presets de estilo (lee este primero)
- `animation-patterns.md` — animaciones listas
- `viewport-base.css` — el CSS base obligatorio
- `scripts/` — utilities

**NO partas de cero.** Adapta el template.

## No-negociables del deck

1. **Zero dependencies** — UN archivo HTML autocontenido (inline CSS + JS)
2. **Viewport fit obligatorio** — cada slide ocupa 100vh, CERO scroll interno
3. **Show, don't tell** — visuales > texto explicativo
4. **Distinctive** — NO gradientes morados genéricos, NO system fonts, NO templates de PowerPoint
5. **Producción** — código comentado, accesible, responsive

## La regla #1 que rompen todos

**Si el contenido no cabe en el viewport, divide en más slides. JAMÁS shrink el texto a tamaño ilegible. JAMÁS pongas overflow:scroll en un slide.**

Usa `clamp(min, ideal, max)` para tipografía que escala con la pantalla.

## Límites de densidad por tipo de slide

| Tipo | Límite |
|---|---|
| Título | 1 heading + 1 subtítulo + tagline opcional |
| Contenido | 1 heading + 4-6 bullets O 2 párrafos cortos |
| Feature grid | 6 cards máximo |
| Código | 8-10 líneas máximo |
| Quote | 1 cita + atribución |
| Image | 1 imagen contenida por el viewport |

## Estructura del deck (los 3 actos + apertura + cierre)

Total objetivo: 8-12 slides, 3:45 min.

| # | Slide | Tipo | Tiempo |
|---|---|---|---|
| 1 | Título: "Always on Shelf" + tagline | Title | 5s |
| 2 | El problema: "Arca tiene N planeadores, X horas semanales en procesos manuales" | Content (data heavy) | 30s |
| 3 | El insight: "¿Y si la IA aprendiera viendo?" | Quote/big idea | 10s |
| 4 | Demo en vivo / video (Acto 1: dolor manual) | Image/video | 45s |
| 5 | Demo en vivo / video (Acto 2: enseñar) | Image/video | 60s |
| 6 | Demo en vivo / video (Acto 3: ejecutar y generalizar) | Image/video | 90s |
| 7 | Arquitectura técnica (un diagrama, no texto) | Image | 20s |
| 8 | Métricas de impacto: $ ahorrados, horas eliminadas | Content (data) | 30s |
| 9 | Generalización: "no solo este flujo — cualquiera" | Content | 15s |
| 10 | Cierre + equipo | Title | 10s |

## Required JS en el deck

- Navegación por teclado (← → ESC)
- Touch / swipe en mobile
- Mouse wheel
- Progress indicator o slide index
- Reveal animations on enter (Intersection Observer)
- `prefers-reduced-motion` respect

## Validación obligatoria

Antes de cerrar el deck, abre y verifica en estos tamaños (DevTools):
- 1920×1080 (proyector típico)
- 1280×720 (laptop)
- 768×1024 (tablet — por si proyectan así)
- 375×667 (mobile — share por WhatsApp)

Si **cualquier slide** hace overflow → falla, dividir.

## Anti-patterns que pierden hackathons

- Slide 1 con "agenda" — nadie quiere agendas en 4 min
- Slides con 8+ bullets — nadie los lee
- Code blocks con scroll
- "Thank you for your attention" como último slide — pon CTA o métrica
- Atmospheric backgrounds genéricos (gradientes morados)
- Logos de stack tecnológico ocupando un slide entero

## Métricas que debes calcular (hora 24-32)

Esto define el cierre del pitch. Necesitas números concretos:

- **Tiempo manual del proceso elegido**: cronométralo en el mock portal cuando esté listo. Ej. 3 min.
- **Frecuencia**: ¿cuántas veces al día/semana ocurre el proceso? Investiga o haz supuesto razonable. Ej. 12 veces/semana.
- **Cantidad de planeadores**: ej. 8 planeadores × 12 procesos = 96 ejecuciones/semana
- **Tiempo total semanal**: 96 × 3 min = 288 min ≈ 4.8 horas/semana **solo de este flujo**
- **Cálculo de ahorro en $$$**: salario hora × ahorro = anualizado
- **El multiplicador**: "y aprende N procesos, no 1"

Pon esos números en el slide 8. No los inventes — usa supuestos defendibles con fuente cuando sea posible.

## Backend support (tu rol secundario)

Mientras armas pitch, en paralelo:

- **Hora 2-12: Mock Portal v1** en `apps/mock-portal/`. Login fake, lista de tiendas, form de surtido con `data-testid` por todas partes. Look corporativo (azul/gris). Habla con Marita para visuales.
- **Hora 8-16: Seeds de Supabase** — 20-30 tiendas mock, 50-100 SKUs, 5-10 playbooks de ejemplo guardados.
- **Hora 32+: Backup video del demo**. Graba la versión perfecta del demo. Si falla en vivo, lanzas el video.

---

**Lectura para hora 24-32:** `docs/references/skills/investor-materials/SKILL.md` para sharpen las métricas.
**Lectura para hora 32-40:** `docs/references/skills/ui-demo/SKILL.md` para grabar el video.
