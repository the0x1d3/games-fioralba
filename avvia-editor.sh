#!/bin/sh
# Avvio cliccabile dell'editor locale di Fioralba.
set -eu

DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$DIR"

# I programmi aperti dal Finder possono avere un PATH più piccolo di quello
# del terminale: prova comunque a caricare l'installazione nvm standard.
if [ -z "${NPM_BIN:-}" ] && [ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]; then
  # shellcheck disable=SC1090
  . "${NVM_DIR:-$HOME/.nvm}/nvm.sh"
fi

if [ -n "${NPM_BIN:-}" ]; then
  NPM="$NPM_BIN"
else
  NPM=$(command -v npm || true)
fi

if [ -z "$NPM" ]; then
  echo "Non trovo npm. Installa Node.js e riprova."
  printf "Premi Invio per chiudere..."
  read -r _
  exit 1
fi

export EDITOR_APRI_BROWSER=1
exec "$NPM" run editor