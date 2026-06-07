#!/bin/bash
# Themis — Deploy/reload en VPS Vultr.
# Correr DESDE la VPS:
#   bash /opt/themis/scripts/deploy-vultr.sh

set -e

cd /opt/themis

echo "==> git pull"
git pull --rebase

echo "==> docker compose down"
docker compose down

echo "==> docker compose up -d --build"
docker compose up -d --build

echo "==> Esperando healthy (60s)"
sleep 60

echo "==> docker compose ps"
docker compose ps

echo "==> URLs:"
IP=$(curl -s ifconfig.me)
echo "    Operator UI:    http://$IP:3000"
echo "    ERP destino:    http://$IP:3001/captura"
echo "    Catálogo CPG:   http://$IP:3002"

echo "==> Tailing operator logs (Ctrl+C para salir)"
docker compose logs -f --tail 30 operator-ui
