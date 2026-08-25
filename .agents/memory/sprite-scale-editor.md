---
name: Scala sprite editor iw/ih
description: arredoDaImmagine centra il PNG sull'impronta — quando iw/ih cambiano il sprite si SPOSTA perché il calcolo dx/dy cambia. Fix: se iw/ih impostati esplicitamente, scalare lo sprite a riempire l'ingombro invece di usare la dimensione nativa.
---

## Regola
In `arredoDaImmagine` (render.js), la formula standard centra il PNG (`a.w*T × a.h*T`) nell'impronta `f.w*T × f.h*T`. Quando l'editor cambia `iw/ih` dell'oggetto, `f` cambia ma il sprite resta fisso → appare che l'elemento "si sposta".

**Fix applicato:**
```javascript
const scalaIngombro = !!(o.iw || o.ih);
const iw = scalaIngombro ? f.w*T : a.w*T;
const ih = scalaIngombro ? f.h*T : a.h*T;
```

**Why:** Un oggetto con `iw/ih` espliciti è stato ritoccato dall'editor di scenografia. L'utente si aspetta che il PNG corrisponda al bordo dorato di selezione. Gli oggetti non ritoccati (default, nessun `iw/ih`) mantengono il comportamento originale.

**How to apply:** Questo cambiamento è in `arredoDaImmagine` in `render.js`. Tutti gli oggetti che usano PNG da `DATA.ARREDI` passano da qui. Gli oggetti con disegno procedurale (`case 'panchina': {...}` in `disegnaOggettoDentro`) non usano questa funzione e non sono toccati.
