#!/bin/bash

set -e  # stop on errors

# Deploys the city data (dist/cities/<CITY>, from npm run package:city) to ${DEPLOY_PATH}/city/,
# next to the app. Target per city/box, set in .env.<city> (never commit real values)
: "${CITY:?CITY ist nicht gesetzt (z. B. CITY=berlin)}"
: "${DEPLOY_HOST:?DEPLOY_HOST ist nicht gesetzt}"
: "${DEPLOY_USER:?DEPLOY_USER ist nicht gesetzt}"
: "${DEPLOY_PATH:?DEPLOY_PATH ist nicht gesetzt}"
: "${DEPLOY_PASSWORD:?DEPLOY_PASSWORD ist nicht gesetzt}"

PACKAGE="./dist/cities/${CITY}"
if [ ! -f "${PACKAGE}/city.json" ]; then
	echo "✖ ${PACKAGE}/city.json fehlt. Zuerst: npm run package:city -- ${CITY}" >&2
	exit 1
fi

# sshpass -e reads the password from $SSHPASS, so it never appears in argv or logs
export SSHPASS="$DEPLOY_PASSWORD"
REMOTE="${DEPLOY_USER}@${DEPLOY_HOST}"

echo "📦 Uploading city data (${CITY}) to ${DEPLOY_HOST}..."
sshpass -e ssh -o StrictHostKeyChecking=no "$REMOTE" \
	"mkdir -p '${DEPLOY_PATH}' && rm -rf '${DEPLOY_PATH}/city.new'"
sshpass -e scp -r "$PACKAGE" "${REMOTE}:${DEPLOY_PATH}/city.new"

# Swap only once the upload is complete, so the box never serves half-copied city data
echo "🔁 Activating new city data..."
sshpass -e ssh -o StrictHostKeyChecking=no "$REMOTE" \
	"cd '${DEPLOY_PATH}' && rm -rf city.old && { [ ! -d city ] || mv city city.old; } && mv city.new city && rm -rf city.old"

echo "✅ City data deployment complete."
