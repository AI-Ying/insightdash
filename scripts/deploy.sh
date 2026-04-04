#!/bin/bash
set -e

echo "🚀 InsightDash Deployment Script"
echo "================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "${RED}Error: package.json not found. Are you in the project root?${NC}"
    exit 1
fi

echo ""
echo "📋 Pre-deployment Checklist:"
echo "  ✓ Running tests..."
npm test || { echo "${RED}Tests failed!${NC}"; exit 1; }

echo "  ✓ Linting code..."
npm run lint || { echo "${RED}Linting failed!${NC}"; exit 1; }

echo ""
echo "🔨 Building application..."
npm run build || { echo "${RED}Build failed!${NC}"; exit 1; }

echo ""
echo "📤 Pushing to GitHub..."
git add -A
git commit -m "deploy: $(date '+%Y-%m-%d %H:%M:%S')" || echo "${YELLOW}No changes to commit${NC}"
git push origin master

echo ""
echo "${GREEN}✅ Deployment triggered!${NC}"
echo ""
echo "📊 Monitor deployment:"
echo "   • Render Dashboard: https://dashboard.render.com"
echo "   • Production URL: https://insightdash-faa2.onrender.com"
echo "   • Health Check: https://insightdash-faa2.onrender.com/api/health"
echo ""
echo "⏱️  Deployment takes ~2-3 minutes. Check the Render dashboard for progress."
