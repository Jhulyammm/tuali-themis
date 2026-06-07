# Themis — Security model (hackathon scope)

> Este documento explica las mitigaciones de seguridad implementadas, sus
> limitaciones intencionales para hackathon, y qué se haría diferente en
> producción real.

---

## Contexto de despliegue

Themis se demuestra públicamente sobre HTTP en una VPS Vultr **sin
autenticación**. Esto es una decisión consciente para que el jurado pueda
explorar libremente. La URL no se publica fuera del jurado durante el evento.

**Threat model:**
- Aceptamos: jurado curioso explorando endpoints
- Aceptamos: análisis de tráfico HTTP local
- Mitigamos: abuso del API que cueste plata (Claude, Browserbase, ElevenLabs)
- Mitigamos: SSRF a metadata services / private CIDRs
- Mitigamos: leak de API keys via UI
- **NO mitigamos**: ataques sofisticados, MITM en HTTP, ofensivas post-pitch

---

## Mitigaciones implementadas

### 1. Módulo central `apps/operator-ui/src/lib/security.ts`

Helpers reusables que todos los endpoints sensibles importan:

| Helper | Propósito |
|--------|-----------|
| `validateStartUrl(url)` | Allowlist + blocklist anti-SSRF |
| `isBlockedHost(host)` | Bloquea localhost, 169.254.169.254, RFC1918, `.internal`, `.local` |
| `allowedSourceHosts()` | Lee `SSRF_ALLOWED_HOSTS` env + URLs configuradas |
| `LIMITS.*` | Caps de bytes/chars por endpoint (proteger billing) |
| `jsonTooBig(raw, max)` | Check body size pre-parse |
| `rateLimit(key, max, ms)` | In-memory por IP, best-effort |
| `getClientIp(req)` | Lee X-Forwarded-For / X-Real-IP |
| `sanitizedError(err, fallback)` | En prod no leak stack/paths |
| `badRequest / tooLarge / tooManyRequests` | Responses estándar |

### 2. Endpoints protegidos

| Endpoint | Validaciones |
|----------|--------------|
| `POST /api/browser/session` | SSRF allowlist + rate limit (3/min) + sanitized errors |
| `GET /api/browser/observe` | sessionId pattern + rate limit (90/min para polling) |
| `POST /api/browser/finalize` | sessionId pattern + audioTranscript cap + rate limit (10/min) |
| `POST /api/voice` | text cap 1500 chars + voice_id pattern + rate limit (30/min) |
| `POST /api/whisper` | file size 4MB + MIME type check + rate limit (15/min) |
| `POST /api/playbook/extract` | body 256KB cap + rate limit (10/min) |
| `POST /api/execute` | body 128KB + max 200 steps + rate limit (5/min) |
| `POST /api/playbooks` | body 128KB + max 200 steps + name length + rate limit (10/min) |
| `GET /api/playbooks` | rate limit (60/min) |
| `POST /api/recommendations` | rate limit (20/min) + input validation |
| `POST /api/skus` (erp-destino) | body 32KB + max 30 fields + field length 500 + rate limit (30/min) |

### 3. Leak de partial API key (CRITICAL — RESUELTO)

Antes en `apps/operator-ui/src/app/diagnostics/page.tsx` se mostraban los
primeros 12 chars del `ANTHROPIC_API_KEY` y los primeros 8 del
`BROWSERBASE_PROJECT_ID`. Se quitó. Ahora solo dice "Key configurada"
sin leak.

### 4. Solana wallet protection

- El secret key NUNCA aparece en respuestas API ni logs.
- `/api/solana/health` y `/api/status` solo retornan el `walletAddress()` (público).
- `createSolanaClientFromEnv()` lee el secret SOLO server-side.

### 5. Deployment (Vultr) — env injection segura

`docker-compose.yml` usa `env_file: ./.env.production` para inyectar secrets
en runtime, NO `ENV` en los Dockerfiles (que quedaría bakeado en el layer).

`.env.production` NO está en el repo (cubierto por `.gitignore` con `.env*`).

---

## Limitaciones conocidas y tradeoffs

### A. No auth en endpoints sensibles
Decisión: el jurado debe poder usar `/teach` y `/execute` sin login.
**Mitigación parcial**: rate limits + body caps. Si alguien encuentra la URL
y abusa, el daño económico está topado (ej. ElevenLabs 30 req/min × 1500 chars
= ~$0.05/min).

**Cómo lo arreglaríamos en prod**: NextAuth con magic links + middleware
opcional con header `X-Demo-Key` que el jurado conoce.

### B. Rate limits in-memory
Se resetean al restart del server. En un horizontal scale serían inefectivos.
**Producción**: Upstash Redis o Vercel KV.

### C. SSE en `/api/execute` sin auth
La SSE puede ser polleada por un atacante para saber qué está ejecutando
otro usuario. **Mitigación**: cada llamada crea su propia ejecución y stream
(no es broadcast — el atacante necesitaría un sessionId válido para hijack).

### D. `existingSessionId` en /api/execute
Acepta reusar una sesión Browserbase ya creada (para el flow observación→ejecución).
Un atacante con `sessionId` válido podría hijack y ejecutar acciones costosas.
**Mitigación**: sessionId pattern-validated + sesiones se cierran después de
finalize/error. Window de ataque ~5 min máx.

### E. HTTP no HTTPS en Vultr
Tradeoff explícito: HTTPS requiere dominio + Let's Encrypt → 30+ min de
setup. Para devnet demo de hackathon es aceptable. **Producción**: Caddy
con DNS provider integrado.

### F. Logs leak de errores
`console.error("[endpoint]", err)` loggea el error completo. Si alguien
gana acceso a la VPS, puede leer logs con detalles internos.
**Mitigación**: logs solo accesibles vía SSH a `root@<vultr-ip>`.

### G. SSRF allowlist puede ser ampliada
`SSRF_ALLOWED_HOSTS` env permite agregar hosts. Si alguien con acceso al
`.env.production` agrega un host malicioso → puede SSRF.
**Mitigación**: solo el deploy tiene acceso al `.env.production`.

---

## Checklist pre-deploy a Vultr

Antes de hacer `docker compose up -d`:

- [ ] `.env.production` NO está commiteado al repo
- [ ] `.gitignore` cubre `.env*` (verificado)
- [ ] `NODE_ENV=production` está en `.env.production`
- [ ] `SSRF_ALLOWED_HOSTS` configurado con los hosts que Browserbase puede tocar
- [ ] Firewall Vultr abierto solo en 22, 3000, 3001, 3002
- [ ] No exponer otros puertos por accidente
- [ ] `SOLANA_WALLET_SECRET_KEY` solo tiene SOL en **devnet** (cero valor real)
- [ ] `MONGODB_URI` apunta a un cluster dedicado al demo (no compartido con otros proyectos)

---

## Post-pitch checklist

- [ ] Destruir VPS Vultr (`Vultr panel → Destroy`)
- [ ] Rotar API keys: Anthropic, Browserbase, ElevenLabs, OpenAI, Gemini, MongoDB
- [ ] Mover SOL restante de la wallet devnet a otra (o ignorar — es devnet)
- [ ] Sacar el tunnel cloudflared si quedó arriba

---

## Reportar un issue

Para hackathon: avisar a Jhulyam directamente.
Post-hackathon: este repo se archiva; abrir issue público en GitHub.
