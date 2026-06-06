# References — ECC cherry-picks

These files are **vendored copies** from [Everything Claude Code (ECC)](https://github.com/affaan-m/everything-claude-code) — only the skills and agents this project actually uses. Read-only for our purposes.

## Skills (`./skills/`)

| Skill | For whom | When |
|-------|----------|------|
| `agent-harness-construction/` | Jhulyam | Hora 0-2 — diseño del agent loop |
| `autonomous-agent-harness/` | Jhulyam | Hora 2-8 — patrones de agente autónomo |
| `click-path-audit/` | Jhulyam | Hora 8-16 — grabación de DOM events |
| `browser-qa/` | Jhulyam | Hora 16-24 — testing del browser agent |
| `frontend-patterns/` | Carlos | Hora 0-2 — patrones React/Next.js |
| `react-patterns/` | Carlos | Hora 2-8 — patrones React específicos |
| `motion-ui/` | Carlos, Marita | Hora 24-32 — animaciones |
| `frontend-design-direction/` | Marita | Hora 0-8 — dirección visual |
| `motion-foundations/` | Marita | Hora 24-32 — fundamentos de motion |
| `motion-patterns/` | Marita | Hora 24-32 — patrones de motion |
| `make-interfaces-feel-better/` | Marita | Hora 32-40 — polish final |
| `ui-demo/` | Marita, Emi | Hora 32-40 — grabación del demo |
| `frontend-slides/` | Emi | Hora 0-8 — template HTML + presets para pitch deck |
| `investor-materials/` | Emi | Hora 2-8 — métricas + narrativa |

## Agents (`./agents/`)

| Agent | Cuándo invocarlo |
|-------|------------------|
| `architect.md` | Hora 1-2 — decidir arquitectura + estructura |
| `typescript-reviewer.md` | Antes de cada merge de TS |
| `react-reviewer.md` | Antes de cada merge de componentes React |
| `silent-failure-hunter.md` | Hora 32+ — cazar bugs invisibles pre-demo |
| `security-reviewer.md` | Hora 40+ — scan rápido pre-demo |

## ¿Por qué vendoreado y no instalado?

Para 48 horas no necesitamos el framework completo de ECC (con sus hooks, memory, 200+ skills). Solo necesitamos referenciar estas piezas como documentación viva. Cero overhead de instalación, cero riesgo de que actualizaciones del framework rompan algo durante el hack.
