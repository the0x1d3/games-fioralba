#!/usr/bin/env bash
# Preparazione automatica dopo l'integrazione di un'attività.
# Deve restare non interattiva e sicura da eseguire più volte.
# I confronti grafici completi appartengono alla verifica della singola
# attività: qui renderebbero l'integrazione inutilmente lenta.
set -euo pipefail

npm ci --no-audit --no-fund
npm run check