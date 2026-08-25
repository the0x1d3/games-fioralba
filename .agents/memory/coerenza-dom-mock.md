---
name: Mock DOM in coerenza.js
description: I test Node in coerenza.js simulano il DOM con un oggetto document minimo. Ogni volta che editor-interno.js usa nuove API DOM, il mock va aggiornato.
---

## Regola
`tools/coerenza.js` ha DUE mock del `document` (uno per il check "oggetti funzionali", uno per il check "fontana"):

```javascript
// Mock 1 (check funzionali, ~riga 3401):
document:{querySelector(){return elemento;}, querySelectorAll(){return[];}, addEventListener(){}}

// Mock 2 (check fontana, ~riga 3487):
querySelector(sel){ return elementi[sel]||(elementi[sel]=elemento()); },
querySelectorAll(){ return []; },
addEventListener(){}
```

**Why:** `editor-interno.js` viene eseguito via `vm.runInContext` nei test Node. Se il codice chiama `document.querySelectorAll` (usato dalle maniglie drag) o `document.addEventListener` (usato per mousemove/mouseup globali), il mock deve rispondergli.

**How to apply:** Ogni volta che si aggiungono nuove chiamate DOM in `editor-interno.js`, cercare tutti i mock `document:` in `coerenza.js` e aggiornare ENTRAMBI.
