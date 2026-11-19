#!/bin/bash
# ==========================================================
# DevSync AI — Launch Verification Script (Bash)
# ==========================================================

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}==========================================================${NC}"
echo -e "${CYAN}  DevSync AI - Pre-Flight Launch Verification${NC}"
echo -e "${CYAN}==========================================================${NC}"

all_passed=true

check_item() {
  local name="$1"
  local path="$2"
  if [ -e "$path" ]; then
    echo -e " ${GREEN}[PASS]${NC} $name"
  else
    echo -e " ${RED}[FAIL]${NC} $name - missing at $path"
    all_passed=false
  fi
}

echo -e "\n${YELLOW}1. Verifying Required Files & Directories:${NC}"
check_item "Prisma Relational Schema" "prisma/schema.prisma"
check_item "Prisma Database Seed Script" "prisma/seed.ts"
check_item "Root Environment File (.env)" ".env"
check_item "Environment Template (.env.example)" ".env.example"
check_item "Docker Compose Configuration" "docker-compose.yml"
check_item "API Dockerfile" "infrastructure/docker/api.Dockerfile"
check_item "Web Dockerfile" "infrastructure/docker/web.Dockerfile"
check_item "Worker Dockerfile" "infrastructure/docker/worker.Dockerfile"
check_item "Nginx Reverse Proxy Config" "infrastructure/nginx/nginx.conf"

echo -e "\n${YELLOW}2. Verifying Core Applications:${NC}"
check_item "NestJS API Core (apps/api)" "apps/api/src/main.ts"
check_item "React Web Client (apps/web)" "apps/web/src/App.tsx"
check_item "Background Worker (apps/worker)" "apps/worker/src/main.ts"
check_item "Central Typed API Client" "apps/web/src/lib/api.ts"

echo -e "\n${YELLOW}3. Verifying Monorepo Workspace Configuration:${NC}"
check_item "pnpm Workspace Definition" "pnpm-workspace.yaml"
check_item "Turborepo Pipeline Config" "turbo.json"
check_item "CI/CD GitHub Actions Pipeline" ".github/workflows/ci.yml"

echo -e "\n${CYAN}==========================================================${NC}"
if [ "$all_passed" = true ]; then
  echo -e "  ${GREEN}SUCCESS: All DevSync AI launch pre-flight checks passed!${NC}"
  echo -e "  ${GREEN}Ready to launch using: docker compose up -d OR pnpm dev${NC}"
else
  echo -e "  ${RED}ATTENTION: Some checks failed. Please review above.${NC}"
fi
echo -e "${CYAN}==========================================================${NC}"
