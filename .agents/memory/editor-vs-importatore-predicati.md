---
name: Predicati editor vs importatore
description: oggettoEditorSicuro allarga la selezione interattiva (barca/consegna/bancarella/baule) senza che il validatore/importatore JSON li accetti automaticamente.
---

## Regola
Esiste una distinzione tra:
- `WORLD.oggettoScenarioSicuro(o)` — usato da validatore e importatore bozze JSON; lista ristretta (albero, panchina, lampione, ecc.)
- `WORLD.oggettoEditorSicuro(o)` — usato solo nell'editor interattivo; include anche `barca`, `consegna`, `bancarella`, `baule`

**Why:** Gli oggetti "editor-extra" possono essere spostati visivamente nell'editor (anteprima live), e la loro posizione finisce nella bozza JSON. L'importatore li salterà (campo `saltati`) — il revisore li applica a mano se li approva. Questo evita che meccaniche di gioco (quest trigger, rotte) vengano alterate da import automatici.

**How to apply:**
- In `editor-interno.js`, `scenograficoOggetto(o)` usa `WORLD.oggettoEditorSicuro` con fallback a `oggettoScenarioSicuro`.
- In `tools/coerenza.js`, il mock deve includere `oggettoEditorSicuro` nel `policy` object.
- `OGGETTI_EDITOR_EXTRA` in `world.js` contiene i tipi aggiuntivi.
- Il check "modalità modifica lascia fermi gli oggetti funzionali" testa separatamente: editor-extra sono selezionabili (puo=true), ma il validatore JSON li rifiuta ancora.
