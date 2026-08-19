#!/usr/bin/env bash
# Preparazione automatica dopo l'integrazione di un'attività.
# Deve restare non interattiva e sicura da eseguire più volte.
set -euo pipefail

npm ci --no-audit --no-fund
npm run verifica