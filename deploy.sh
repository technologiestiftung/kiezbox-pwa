#!/bin/bash

set -e  # stop on errors

# Deploy target per city/box, set in .env or .env.<city> (never commit real values)
: "${DEPLOY_HOST:?DEPLOY_HOST ist nicht gesetzt}"
: "${DEPLOY_USER:?DEPLOY_USER ist nicht gesetzt}"
: "${DEPLOY_PATH:?DEPLOY_PATH ist nicht gesetzt}"
: "${DEPLOY_PASSWORD:?DEPLOY_PASSWORD ist nicht gesetzt}"

# sshpass -e reads the password from $SSHPASS, so it never appears in argv or logs
export SSHPASS="$DEPLOY_PASSWORD"

# Deploys the app only. The city data in ${DEPLOY_PATH}/city/ (see deploy-city.sh) and the
# box-specific ${DEPLOY_PATH}/box.json (see box.example.json) are kept.
echo "🚀 Deleting remote build on ${DEPLOY_HOST} (keeping city/ and box.json)..."
sshpass -e ssh -o StrictHostKeyChecking=no "${DEPLOY_USER}@${DEPLOY_HOST}" \
	"mkdir -p '${DEPLOY_PATH}' && find '${DEPLOY_PATH}' -mindepth 1 -maxdepth 1 ! -name city ! -name box.json -exec rm -rf {} +"

echo "📦 Uploading new build..."
sshpass -e scp -r ./build/* "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/"

echo "✅ Deployment complete."
