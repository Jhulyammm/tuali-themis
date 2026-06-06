# Themis — Hack4Her 2026

> **Themis** — diosa griega del orden divino y la balanza justa.
> Agente cognitivo verificable que aprende procesos web por observación.

**Reto:** Always on Shelf (Tuali / Arca Continental)
**Equipo:** Jhulyam · Emi · Marita · Ale

---

## Empezar aquí

👉 [**KICKOFF.md**](./KICKOFF.md) — brief de 5 minutos para todo el equipo.

Luego abre tu doc de rol:
- Jhulyam → [`docs/skills/jhuly-tech-lead.md`](./docs/skills/jhuly-tech-lead.md)
- Marita → [`docs/skills/marita-uiux.md`](./docs/skills/marita-uiux.md) *(ahora codeas frontend)*
- Emi → [`docs/skills/emi-pitch.md`](./docs/skills/emi-pitch.md) *(ahora backend)*
- Ale → [`docs/skills/emi-pitch.md`](./docs/skills/emi-pitch.md) *(la parte de pitch aplica)*

---

## El producto en 6 capas

| # | Capa | Tech | MLH prize |
|---|------|------|-----------|
| 1 | Core agent (aprende, ejecuta, mapea) | Claude + Computer Use + Stagehand | — |
| 2 | Voice narration | ElevenLabs + Whisper | ElevenLabs Best |
| 3 | Cognitive reasoning | Gemini Pro | Gemini Best |
| 4 | Memory graph | MongoDB Atlas | MongoDB Atlas Best |
| 5 | Production infra | Vultr Cloud | Vultr Best |
| 6 | On-chain provenance | Solana devnet | Solana Best |

**Cubrimos los 4 criterios de la rúbrica + 5 MLH bonus prizes en un solo producto.**

---

## Estructura del repo

```
tuali-themis/
├── KICKOFF.md                    # ← Empieza aquí (5 min)
├── README.md                     # Este archivo
├── PLAN.md                       # Plan completo de las 6 capas
├── CLAUDE.md                     # Reglas de Claude Code
├── TASKS_ALE.md                  # Tareas de Ale (diseño + pitch)
├── TASKS_MARITA.md               # Tareas de Marita (cuentas + frontend + pitch)
├── PLAN.pdf                      # Versión PDF del plan
├── package.json                  # Workspace root
├── pnpm-workspace.yaml
├── tsconfig.json
├── .env.example
├── apps/
│   ├── operator-ui/              # UI del operador (Marita)
│   └── erp-destino/              # Sistema B custom (Emi)
├── packages/
│   ├── agent/                    # Agent loop (Jhulyam)
│   ├── db/                       # MongoDB + Supabase (Emi)
│   └── playbooks/                # Schema central de playbook
├── docs/
│   ├── concept-walkthrough.md    # Historia end-to-end (Ana Lugo)
│   ├── ui-spec.md                # Tokens, screens, motion patterns
│   ├── conversational-commands.md
│   ├── self-healing-demo-trick.md
│   ├── skills/                   # Cheatsheets por rol
│   └── references/               # Cherry-picks ECC (skills + agents)
└── scripts/                      # Setup + seeds
```

---

## Setup local

```powershell
# Clonar
git clone https://github.com/Jhulyammm/tuali-themis.git
cd tuali-themis

# Instalar
pnpm install

# Variables de entorno
cp .env.example .env.local
# Llenar las keys del password manager del equipo
```

Después de scaffold de las apps (ver KICKOFF.md):
```powershell
pnpm dev:operator   # http://localhost:3000
pnpm dev:destino    # http://localhost:3001
```

---

## Mantra

> **¿Esta feature crea un wow en el demo de 13 minutos?**
> Si no, no se construye.

> **¿La rúbrica del PDF lo premia?**
> Si no, va al tier de drop rules.

**Themis trae orden donde no hay estándar. Vamos.**
