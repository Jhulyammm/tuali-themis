#!/bin/bash
# Themis — Pre-flight check antes de deploy a Vultr.
# Corré DESDE tu máquina LOCAL antes de hacer scp + ssh:
#   bash scripts/preflight-vultr.sh
#
# Valida: env vars críticas, build local, archivos requeridos.

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check() {
  if eval "$1"; then
    echo -e "${GREEN}✓${NC} $2"
  else
    echo -e "${RED}✗${NC} $2"
    EXIT_CODE=1
  fi
}

warn() {
  if eval "$1"; then
    echo -e "${GREEN}✓${NC} $2"
  else
    echo -e "${YELLOW}!${NC} $2"
  fi
}

EXIT_CODE=0

echo "═══════════════════════════════════════════"
echo " Themis · Pre-flight Vultr deploy check"
echo "═══════════════════════════════════════════"

# 1. Archivos requeridos
echo ""
echo "▸ Archivos de deploy:"
check "[ -f Dockerfile.operator-ui ]" "Dockerfile.operator-ui presente"
check "[ -f Dockerfile.erp-destino ]" "Dockerfile.erp-destino presente"
check "[ -f Dockerfile.source-system ]" "Dockerfile.source-system presente"
check "[ -f docker-compose.yml ]" "docker-compose.yml presente"
check "[ -f .dockerignore ]" ".dockerignore presente"
check "[ -f DEPLOY.md ]" "DEPLOY.md presente"

# 2. Env local
echo ""
echo "▸ .env.local (workspace root):"
check "[ -f .env.local ]" ".env.local existe"

if [ -f .env.local ]; then
  for var in ANTHROPIC_API_KEY BROWSERBASE_API_KEY BROWSERBASE_PROJECT_ID ELEVENLABS_API_KEY OPENAI_API_KEY GEMINI_API_KEY MONGODB_URI SOLANA_WALLET_SECRET_KEY; do
    check "grep -q \"^${var}=\" .env.local" "${var} configurada"
  done

  # Warning si MongoDB URI parece local
  warn "! grep -q '^MONGODB_URI=.*mongodb+srv' .env.local" "MONGODB_URI usa Atlas (recomendado para prod)"
fi

# 3. Solana wallet con balance
echo ""
echo "▸ Solana wallet:"
if [ -f .env.local ]; then
  PUB_KEY=$(grep "^SOLANA_WALLET_PUBLIC_KEY=" .env.local | cut -d= -f2)
  if [ -n "$PUB_KEY" ]; then
    BAL=$(curl -s "https://api.devnet.solana.com" \
      -H "Content-Type: application/json" \
      -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getBalance\",\"params\":[\"$PUB_KEY\"]}" \
      | grep -o '"value":[0-9]*' | head -1 | cut -d: -f2)
    if [ -n "$BAL" ] && [ "$BAL" -gt 0 ]; then
      echo -e "${GREEN}✓${NC} Wallet $PUB_KEY tiene $(echo "scale=4; $BAL / 1000000000" | bc) SOL"
    else
      echo -e "${YELLOW}!${NC} Wallet sin SOL. Pedí faucet en https://faucet.solana.com"
    fi
  fi
fi

# 4. Typecheck
echo ""
echo "▸ TypeScript (puede tardar 30s):"
warn "pnpm --filter @hack4her/agent typecheck > /dev/null 2>&1" "@hack4her/agent compila"
warn "(cd apps/operator-ui && pnpm exec tsc --noEmit > /dev/null 2>&1)" "operator-ui compila"
warn "(cd apps/erp-destino && pnpm exec tsc --noEmit > /dev/null 2>&1)" "erp-destino compila"
warn "(cd apps/source-system && pnpm exec tsc --noEmit > /dev/null 2>&1)" "source-system compila"

# 5. Docker disponible
echo ""
echo "▸ Docker tooling (opcional para test local):"
warn "command -v docker > /dev/null 2>&1" "docker CLI disponible"
warn "command -v docker compose > /dev/null 2>&1 || command -v docker-compose > /dev/null 2>&1" "docker compose disponible"

# Final
echo ""
echo "═══════════════════════════════════════════"
if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}LISTO PARA DEPLOY${NC}"
  echo ""
  echo "Siguiente paso: leer DEPLOY.md sección 1 (crear VPS en Vultr)"
else
  echo -e "${RED}HAY ITEMS PENDIENTES${NC} — Resolvélos antes de hacer scp."
fi
echo "═══════════════════════════════════════════"

exit $EXIT_CODE
