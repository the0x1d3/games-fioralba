#!/bin/sh
# Doppio clic su macOS: il terminale resta aperto mentre l'editor è attivo.
DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
exec /bin/sh "$DIR/avvia-editor.sh"