#!/usr/bin/env bash
# Preparazione automatica dopo l'integrazione di un'attività.
# Deve restare non interattiva e sicura da eseguire più volte.
# Il confronto grafico completo resta nella verifica della singola attività:
# qui eseguiamo comunque i controlli rapidi su dati, rig e migrazioni.
set -euo pipefail

npm ci --no-audit --no-fund
node tools/coerenza.js
node tools/verifica-omino.js
node tools/scenari-migrazione.js
npm run check