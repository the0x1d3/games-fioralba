---
name: Ridimensionamento delle texture Pixi
description: Vincolo di PixiJS per le texture Canvas che seguono viewport e orientamento.
---

Le texture Pixi create da una Canvas che può cambiare dimensione devono avere
`dynamic` abilitato prima che venga creato lo Sprite che le usa.

**Why:** dopo una rotazione, la sorgente e il buffer WebGL possono riportare
correttamente la nuova misura mentre la geometria batchata dello Sprite resta
quella precedente, lasciando una zona nera o disallineata.

**How to apply:** quando una tela dinamica entra nel compositore Pixi,
impostare la texture come dinamica prima di assegnarla allo Sprite e verificare
un vero resize/orientation change, non soltanto una nuova apertura già alla
misura finale.