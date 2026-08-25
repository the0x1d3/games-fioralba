---
name: Trasparenza delle pose generate
description: Precauzione per convertire immagini generate con reticolo in sprite pixel-art trasparenti e allineati.
---

Le immagini generate con un reticolo di trasparenza visibile non vanno inserite direttamente nel foglio sprite: il reticolo può contenere grigi chiari, neri e colori isolati con alfa parziale, tutti visibili dal Canvas.

**Why:** Un bordo con alfa residuo altera l'appoggio rilevato dal renderer e mostra quadrati o puntini sullo sfondo di gioco, anche se i controlli dimensionali passano.

**How to apply:** Estrarre la trasparenza per singola cella, rimuovere il rumore non connesso alla sagoma e ricomporre gli attrezzi da icone trasparenti se i loro metalli vengono coinvolti. Se una sagoma oltrepassa la griglia teorica, non ritagliarla alla cieca: dichiarare un rettangolo sorgente isolato per posa, con un piccolo margine, e controllarne anche l'anello esterno. Riallineare ogni posa alla quota dei piedi prima di ricomporre le righe. Validare sempre il foglio intero composto su un fondale colorato e verificare anche la quota dei piedi.