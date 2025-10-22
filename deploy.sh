#!/bin/bash

set -e  # stop on errors
set -x  # print each command as it's run

echo "🚀 Deleting remote build..."
sshpass -p "$DEPLOY_PASSWORD" ssh -o StrictHostKeyChecking=no -v root@kiezbox.ts.berlin 'rm -rf /opt/kb-www'

echo "📦 Uploading new build..."
sshpass -p "$DEPLOY_PASSWORD" scp -rv ./build root@kiezbox.ts.berlin:/opt/kb-www

echo "✅ Deployment complete."
