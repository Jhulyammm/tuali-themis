# Themis — Pre-flight check antes de deploy a Vultr (Windows / PowerShell).
# Correr DESDE tu máquina LOCAL antes de hacer scp + ssh:
#   pwsh scripts/preflight-vultr.ps1
#
# Valida: env vars críticas, archivos de deploy, Solana wallet balance.

$ErrorActionPreference = "Continue"

function Check($cond, $label) {
    if ($cond) {
        Write-Host "[OK] " -ForegroundColor Green -NoNewline
        Write-Host $label
    } else {
        Write-Host "[FAIL] " -ForegroundColor Red -NoNewline
        Write-Host $label
        $script:ExitCode = 1
    }
}

function Warn($cond, $label) {
    if ($cond) {
        Write-Host "[OK] " -ForegroundColor Green -NoNewline
        Write-Host $label
    } else {
        Write-Host "[WARN] " -ForegroundColor Yellow -NoNewline
        Write-Host $label
    }
}

$script:ExitCode = 0

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host " Themis - Pre-flight Vultr deploy check" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan

Write-Host ""
Write-Host ">> Archivos de deploy:" -ForegroundColor White
Check (Test-Path "Dockerfile.operator-ui") "Dockerfile.operator-ui presente"
Check (Test-Path "Dockerfile.erp-destino") "Dockerfile.erp-destino presente"
Check (Test-Path "Dockerfile.source-system") "Dockerfile.source-system presente"
Check (Test-Path "docker-compose.yml") "docker-compose.yml presente"
Check (Test-Path ".dockerignore") ".dockerignore presente"
Check (Test-Path "DEPLOY.md") "DEPLOY.md presente"

Write-Host ""
Write-Host ">> .env.local (workspace root):" -ForegroundColor White
$envExists = Test-Path ".env.local"
Check $envExists ".env.local existe"

if ($envExists) {
    $envContent = Get-Content ".env.local" -Raw

    $requiredVars = @(
        "ANTHROPIC_API_KEY",
        "BROWSERBASE_API_KEY",
        "BROWSERBASE_PROJECT_ID",
        "ELEVENLABS_API_KEY",
        "OPENAI_API_KEY",
        "GEMINI_API_KEY",
        "MONGODB_URI",
        "SOLANA_WALLET_SECRET_KEY"
    )

    foreach ($var in $requiredVars) {
        $present = $envContent -match "(?m)^${var}=\S+"
        Check $present "$var configurada"
    }

    $atlasUsing = $envContent -match "MONGODB_URI=.*mongodb\+srv"
    Warn $atlasUsing "MONGODB_URI usa Atlas (recomendado para prod)"
}

Write-Host ""
Write-Host ">> Solana wallet:" -ForegroundColor White

if ($envExists) {
    $match = $envContent -match "(?m)^SOLANA_WALLET_PUBLIC_KEY=(\S+)"
    if ($match) {
        $pubKey = $matches[1]
        try {
            $body = @{
                jsonrpc = "2.0"
                id = 1
                method = "getBalance"
                params = @($pubKey)
            } | ConvertTo-Json -Compress

            $resp = Invoke-RestMethod -Uri "https://api.devnet.solana.com" `
                -Method POST -ContentType "application/json" -Body $body
            $lamports = $resp.result.value
            $sol = $lamports / 1000000000.0
            if ($sol -gt 0) {
                Write-Host "[OK] " -ForegroundColor Green -NoNewline
                Write-Host ("Wallet $pubKey tiene {0:N4} SOL" -f $sol)
            } else {
                Write-Host "[WARN] " -ForegroundColor Yellow -NoNewline
                Write-Host "Wallet sin SOL. Faucet: https://faucet.solana.com"
            }
        } catch {
            Write-Host "[WARN] " -ForegroundColor Yellow -NoNewline
            Write-Host "No pude consultar balance: $_"
        }
    }
}

Write-Host ""
Write-Host ">> TypeScript (puede tardar 30s):" -ForegroundColor White

$tcAgent = (& pnpm --filter '@hack4her/agent' typecheck 2>&1) -join "`n"
Warn ($LASTEXITCODE -eq 0) "agent compila"

Push-Location apps/operator-ui
$tcOp = (& pnpm exec tsc --noEmit 2>&1) -join "`n"
Warn ($LASTEXITCODE -eq 0) "operator-ui compila"
Pop-Location

Push-Location apps/erp-destino
$tcEr = (& pnpm exec tsc --noEmit 2>&1) -join "`n"
Warn ($LASTEXITCODE -eq 0) "erp-destino compila"
Pop-Location

Push-Location apps/source-system
$tcSr = (& pnpm exec tsc --noEmit 2>&1) -join "`n"
Warn ($LASTEXITCODE -eq 0) "source-system compila"
Pop-Location

Write-Host ""
Write-Host ">> Docker tooling (opcional para test local):" -ForegroundColor White
Warn ($null -ne (Get-Command docker -ErrorAction SilentlyContinue)) "docker CLI disponible"

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
if ($script:ExitCode -eq 0) {
    Write-Host "LISTO PARA DEPLOY" -ForegroundColor Green
    Write-Host ""
    Write-Host "Siguiente paso: leer DEPLOY.md seccion 1 (crear VPS en Vultr)" -ForegroundColor White
} else {
    Write-Host "HAY ITEMS PENDIENTES - resolvelos antes de hacer scp." -ForegroundColor Red
}
Write-Host "===========================================" -ForegroundColor Cyan

exit $script:ExitCode
