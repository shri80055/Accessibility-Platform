#!/usr/bin/env bash
# Deploy: build dashboard + widget, restart the API service (Linux/systemd).
set -euo pipefail
cd "$(dirname "$0")/../.."
cd apps/dashboard && npm ci && npm run build && cd ../..
node packages/widget-core/build.mjs
sudo systemctl restart accessibility-platform
curl -fsS "$PUBLIC_BASE_URL/api/health"
echo "Deploy OK"
