# ==========================================================
# DevSync AI — Launch Verification Script (PowerShell)
# ==========================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  DevSync AI - Pre-Flight Launch Verification" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$allPassed = $true

function Test-CheckItem {
    param (
        [string]$Name,
        [bool]$Condition,
        [string]$FailureMessage
    )
    if ($Condition) {
        Write-Host " [PASS] $Name" -ForegroundColor Green
    } else {
        Write-Host " [FAIL] $($Name) - $FailureMessage" -ForegroundColor Red
        $script:allPassed = $false
    }
}

Write-Host "`n1. Verifying Required Files & Directories:" -ForegroundColor Yellow
Test-CheckItem "Prisma Relational Schema" (Test-Path "prisma/schema.prisma") "prisma/schema.prisma missing"
Test-CheckItem "Prisma Database Seed Script" (Test-Path "prisma/seed.ts") "prisma/seed.ts missing"
Test-CheckItem "Root Environment File (.env)" (Test-Path ".env") ".env file missing"
Test-CheckItem "Environment Template (.env.example)" (Test-Path ".env.example") ".env.example missing"
Test-CheckItem "Docker Compose Configuration" (Test-Path "docker-compose.yml") "docker-compose.yml missing"
Test-CheckItem "API Dockerfile" (Test-Path "infrastructure/docker/api.Dockerfile") "api.Dockerfile missing"
Test-CheckItem "Web Dockerfile" (Test-Path "infrastructure/docker/web.Dockerfile") "web.Dockerfile missing"
Test-CheckItem "Worker Dockerfile" (Test-Path "infrastructure/docker/worker.Dockerfile") "worker.Dockerfile missing"
Test-CheckItem "Nginx Reverse Proxy Config" (Test-Path "infrastructure/nginx/nginx.conf") "nginx.conf missing"

Write-Host "`n2. Verifying Core Applications:" -ForegroundColor Yellow
Test-CheckItem "NestJS API Core (apps/api)" (Test-Path "apps/api/src/main.ts") "apps/api/src/main.ts missing"
Test-CheckItem "React Web Client (apps/web)" (Test-Path "apps/web/src/App.tsx") "apps/web/src/App.tsx missing"
Test-CheckItem "Background Worker (apps/worker)" (Test-Path "apps/worker/src/main.ts") "apps/worker/src/main.ts missing"
Test-CheckItem "Central Typed API Client" (Test-Path "apps/web/src/lib/api.ts") "apps/web/src/lib/api.ts missing"

Write-Host "`n3. Verifying Monorepo Workspace Configuration:" -ForegroundColor Yellow
Test-CheckItem "pnpm Workspace Definition" (Test-Path "pnpm-workspace.yaml") "pnpm-workspace.yaml missing"
Test-CheckItem "Turborepo Pipeline Config" (Test-Path "turbo.json") "turbo.json missing"
Test-CheckItem "CI/CD GitHub Actions Pipeline" (Test-Path ".github/workflows/ci.yml") "ci.yml missing"

Write-Host "`n==========================================================" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "  SUCCESS: All DevSync AI launch pre-flight checks passed!" -ForegroundColor Green
    Write-Host "  Ready to launch using: docker compose up -d OR pnpm dev" -ForegroundColor Green
} else {
    Write-Host "  ATTENTION: Some checks failed. Please review above." -ForegroundColor Red
}
Write-Host "==========================================================" -ForegroundColor Cyan
