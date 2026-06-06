# Skill — Marita (UI/UX Lead)

> Destilado de `docs/references/skills/frontend-design-direction/SKILL.md`
> Léelo en hora 0. ~3 min.

## Antes de abrir Figma: define la dirección

Decide ANTES de diseñar:

1. **Propósito** — ¿qué hace la interfaz? *Operador de procesos automatizados ve flujos grabados y dispara ejecuciones.*
2. **Audiencia** — ¿quién la usa diario? *Planeador de Arca, 30-50 años, gerente operativo. Quiere ver "qué está pasando" en 2 segundos.*
3. **Tono** — para nuestro caso: **denso, calmado, scaneable, técnico**. NO maximal, NO playful, NO landing-page-hero.
4. **Detalle memorable** — UNA idea visual que haga que el producto se vea intencional. Sugerencia: la animación del navegador moviéndose solo en pantalla durante la ejecución (eso es el "wow" — diseña esa escena con cuidado).
5. **Constraints** — Tailwind + shadcn ya definen el sistema base. No introduzcas un nuevo design system. Trabaja CON el de shadcn.

## La regla más importante

> **Esto es una herramienta de operaciones SaaS. Debe verse densa, callada y scaneable. NO una landing page.**

Si te encuentras diseñando un hero gigante con CTA, **estás haciendo lo equivocado**. La primera pantalla debe ser la herramienta real funcionando, no marketing.

## Anti-patterns que MATAN el demo

- ❌ Gradientes morados/azules genéricos (es la firma de "generado por IA")
- ❌ Blobs decorativos flotantes
- ❌ Cards dentro de cards (siempre se ve mal)
- ❌ Texto hero gigante "Welcome to..." que ocupa media pantalla
- ❌ Stock photography atmosférica
- ❌ Tipografía sistema (system-ui) — usa una fuente con personalidad: **Geist**, **Inter Tight**, **JetBrains Mono** para datos
- ❌ Una sola familia de color dominando todo

## Lo que SÍ funciona para esta UI

- **Paleta multi-dimensional** — neutros densos (zinc/slate) + 1 color de acción (azul Tuali o rojo de marca Arca) + verdes/rojos de estado (ejecución ok/fail)
- **Tipografía contextual** — sans para UI, monospace para playbook JSON y logs
- **Espaciado generoso entre secciones, denso dentro de secciones** (lista de playbooks compacta, padding amplio alrededor)
- **Motion de alta señal** — transiciones que clarifican estado (paso del playbook en ejecución se ilumina), NO animaciones decorativas
- **Dimensiones estables** — toolbars, grids, tiles no deben "moverse" al hover

## Pantallas críticas que diseñar (en orden de prioridad)

1. **Dashboard / Lista de Playbooks** (hora 2-8) — lo primero que ven todos, define el tono
2. **Modo Enseñar — vista de grabación activa** (hora 8-16) — overlay sobre el portal con grabación
3. **Modo Ejecutar — vista del navegador autónomo** (hora 16-24) — **ÉSTA es la pantalla del wow**. Diseña con extremo cuidado:
   - El navegador embedded debe sentirse "vivo"
   - El log de pasos al lado debe iluminarse en tiempo real con el paso actual
   - Cada paso debe verse legible en lenguaje humano, no como código
4. **Mock Portal** (apoyar a Emi en visual) — debe verse como portal corporativo real estilo SAP. Logos falsos pero creíbles.

## Checklist de review antes de cerrar un mockup

- [ ] El primer viewport comunica el producto en 2 seg
- [ ] La jerarquía visual permite scanear de arriba a abajo
- [ ] Tipografía no se sale del contenedor en mobile ni desktop
- [ ] Colores tienen contraste real (no gris claro sobre gris claro)
- [ ] Iconos son para acciones FAMILIARES (lupa = buscar, no inventes)
- [ ] Grids y toolbars tienen dimensiones estables al hover
- [ ] Motion mejora orientación, no oculta lentitud

## Hora 24-32: polish con motion

Lee `docs/references/skills/motion-foundations/SKILL.md` y `motion-patterns/SKILL.md` cuando llegues a esa fase. Especialmente:
- Easing functions correctas (no `linear`, usa cubic-bezier)
- Duration scales: 150ms (micro), 300ms (transiciones), 500ms (entrada/salida grande)
- Spring physics para elementos que "rebotan" naturalmente

---

**Lectura para polish final (hora 32+):** `docs/references/skills/make-interfaces-feel-better/SKILL.md` + `ui-demo/SKILL.md`.
