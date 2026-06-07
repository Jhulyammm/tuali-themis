# Themis — Vultr deploy (Capa 5)

> Objetivo: una URL pública para el demo + MLH bonus "Best Use of Vultr".
> Reemplaza el túnel cloudflared con una IP pública estable.

---

## Prerequisitos

- Cuenta Vultr con créditos free tier (o $6/mes después)
- SSH key local (`~/.ssh/id_rsa.pub` o equivalente)
- Repo `tuali-themis` push-eado a GitHub
- `.env.local` funcionando local con TODAS las keys (Anthropic, Browserbase, ElevenLabs, OpenAI, Gemini, MongoDB, Solana wallet)

---

## 1. Crear VPS en Vultr (5 min)

1. https://my.vultr.com/deploy → **Deploy New Server**
2. Server Type: **Cloud Compute** → **Regular Performance**
3. Location: **Mexico City** (más cercano a jurado mexicano) o **Dallas**
4. Image: **Ubuntu 22.04 LTS**
5. Plan: **$6/mo · 1GB RAM · 25GB SSD** (suficiente para demo; si va lento, sube a 2GB)
6. SSH Keys: agregá la tuya
7. Hostname: `themis-demo`
8. Deploy → esperá ~60s a que aparezca la IP

Anota la **IP pública** que te asignen — la usarás 5 veces más adelante.

---

## 2. Abrir puertos en el firewall Vultr

Panel Vultr → tu instancia → **Settings** → **Firewall** → **Manage**:

Agregá reglas:
- TCP, port `22`, source `Anywhere` (SSH)
- TCP, port `3000`, source `Anywhere` (operator-ui)
- TCP, port `3001`, source `Anywhere` (erp-destino)
- TCP, port `3002`, source `Anywhere` (source-system)

---

## 3. Setup inicial vía SSH

```bash
ssh root@<VULTR_IP>

# Instalar Docker + Docker Compose + git
apt update && apt install -y git docker.io docker-compose-plugin

# Clonar repo
cd /opt
git clone https://github.com/<TU_USUARIO>/tuali-themis themis
cd themis
```

---

## 4. Subir `.env.production` (NO usar git)

En **tu máquina local**, copiá tu `.env.local` a `.env.production`, cambia las URLs públicas a la IP de Vultr:

```bash
cp .env.local .env.production
```

Editá `.env.production` y cambiá:
```env
NEXT_PUBLIC_OPERATOR_URL=http://<VULTR_IP>:3000
NEXT_PUBLIC_ERP_DESTINO_URL=http://<VULTR_IP>:3001
NEXT_PUBLIC_SOURCE_SYSTEM_URL=http://<VULTR_IP>:3002
```

(El resto de keys queda igual.)

Subilo a la VPS:

```bash
scp .env.production root@<VULTR_IP>:/opt/themis/.env.production
```

**IMPORTANTE**: nunca commitees `.env.production` al repo. Ya está cubierto por `.gitignore` si tu `.env*` ahí.

---

## 5. Build + arranque

```bash
ssh root@<VULTR_IP>
cd /opt/themis
docker compose up -d --build
```

El primer build tarda ~5-8 min (pnpm install + compilar Next x3). Veás logs en vivo con:

```bash
docker compose logs -f --tail 100
```

Cuando los 3 servicios estén `(healthy)` (revisar con `docker compose ps`), ya está arriba.

---

## 6. Verificar

Desde tu navegador local:

- `http://<VULTR_IP>:3002` → catálogo verde de Distribuidora del Norte
- `http://<VULTR_IP>:3001/captura` → form del ERP Tuali
- `http://<VULTR_IP>:3000` → Themis con sidebar crimson
- `http://<VULTR_IP>:3000/diagnostics` → todas las capas en LIVE
- `http://<VULTR_IP>:3000/produccion` → deploy_target debe decir "Vultr Cloud"

---

## 7. Actualizar el `.env.local` LOCAL del operator-ui

Ahora en local, cambiá:

```env
NEXT_PUBLIC_SOURCE_SYSTEM_URL=http://<VULTR_IP>:3002
```

Después `pnpm env:sync` y reiniciá `pnpm dev:operator`. Tu /teach local ahora apuntará a la fuente en Vultr (Browserbase la puede leer perfectamente porque es una IP pública).

---

## 8. Re-deploy después de cambios

```bash
ssh root@<VULTR_IP>
cd /opt/themis
git pull
docker compose up -d --build
```

O usa el script:

```bash
bash scripts/deploy-vultr.sh
```

---

## Tradeoffs y limitaciones

- **HTTP no HTTPS**: jurado lo aceptará en hackathon. Si querés HTTPS, agregá Caddy con Let's Encrypt sobre un dominio gratuito (DuckDNS, Freenom).
- **`next dev` no `next build`**: prefiere SSE sin buffering. Para producción real haríamos un build optimizado con streams custom.
- **1GB RAM al límite**: si Stagehand inicia muchas sesiones Browserbase simultáneas, puede OOM. Subí a 2GB ($12/mo) si vas a ensayar mucho.
- **Sin healthcheck en compose strict**: si un servicio cae, no se reinicia limpio. Para producción agregaríamos Watchtower.

---

## Drop rules específicos

| Hora | Si... | Acción |
|------|-------|--------|
| h-2 antes pitch | Vultr no levantó | Revertir env a túnel cloudflared, perder MLH Vultr pero no demo |
| h-30 antes pitch | Vultr está raro | Reiniciar containers: `docker compose restart` |
| Durante pitch | Vultr cae | Switch a localhost + screenshot del Solana explorer como backup |

---

## Cleanup post-hackathon

```bash
# En la VPS:
docker compose down
docker system prune -af
```

Y en el panel Vultr, destruí la instancia si ya no la necesitas (para evitar cobros mensuales).
