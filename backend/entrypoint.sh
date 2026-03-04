#!/bin/sh
set -e

echo "[Entrypoint] Running Prisma migrations..."
npx prisma migrate deploy

echo "[Entrypoint] Starting application..."
node dist/main.js
