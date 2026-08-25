---
name: Composizione canonica Pixi
description: Decisione di rendering per mantenere l'equivalenza visiva stretta tra Pixi/WebGL e Canvas.
---

Quando Pixi deve essere pixel-identico al fallback Canvas, deve presentare un
unico frame opaco composto nella tela canonica, non fondere separatamente i
layer trasparenti in GPU.

**Why:** la premoltiplicazione alfa e il blending WebGL hanno introdotto
variazioni di tinta estese, oltre la soglia visuale, pur con geometria e ordine
dei layer corretti.

**How to apply:** mantenere il composito alla risoluzione fisica del frame,
aggiornare la relativa texture dinamica prima dello Sprite e verificare sia
resize sia gli scenari con luce e pioggia tramite il confronto renderer.

Per la diagnostica, la copia Canvas nel composito opaco conta come
composizione, l'aggiornamento della texture come upload e soltanto il render
WebGL finale come presentazione.

**Why:** il ponte Canvas prepara ancora il frame; attribuirlo al render finale
nasconde il costo reale della composizione e rende le tre misure sovrapposte.