#!/bin/bash

set -e  # stop on errors

# Deploy target per city/box, set in .env or .env.<city> (never commit real values)
: "${DEPLOY_HOST:?DEPLOY_HOST ist nicht gesetzt}"
: "${DEPLOY_USER:?DEPLOY_USER ist nicht gesetzt}"
: "${DEPLOY_PATH:?DEPLOY_PATH ist nicht gesetzt}"
: "${DEPLOY_PASSWORD:?DEPLOY_PASSWORD ist nicht gesetzt}"

# sshpass -e reads the password from $SSHPASS, so it never appears in argv or logs
export SSHPASS="$DEPLOY_PASSWORD"

echo "🚀 Deleting remote build on ${DEPLOY_HOST}..."
sshpass -e ssh -o StrictHostKeyChecking=no "${DEPLOY_USER}@${DEPLOY_HOST}" "rm -rf '${DEPLOY_PATH}'"

echo "📦 Uploading new build..."
sshpass -e scp -r ./build "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}"

echo "✅ Deployment complete."
