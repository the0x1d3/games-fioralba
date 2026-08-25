---
name: Trasparenza delle pose generate
description: Precauzione per convertire immagini generate con reticolo in sprite pixel-art trasparenti e allineati.
---

Le immagini generate con un reticolo di trasparenza visibile non vanno inserite direttamente nel foglio sprite: il reticolo può avere alfa parziale e viene disegnato dal Canvas, anche quando sembra quasi trasparente.

**Why:** Un bordo con alfa residuo altera l'appoggio rilevato dal renderer e mostra quadrati sullo sfondo di gioco.

**How to apply:** Prima dell'assemblaggio, rimuovere le tinte del reticolo, controllare una cella su uno sfondo colorato e verificare che la sagoma finisca alla quota dei piedi prevista dal telaio canonico.