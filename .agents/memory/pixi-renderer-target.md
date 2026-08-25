---
name: Renderer target PixiJS WebGL
description: Il browser usa sempre PixiJS WebGL. Ogni modifica visiva deve funzionare nel percorso Pixi, non solo in Canvas 2D.
---

## Regola
Il gioco gira su PixiJS 8 / WebGL. Il Canvas 2D è un fallback di sviluppo (nessuna GPU, test Playwright). **Ogni modifica visiva deve essere verificata e funzionare nel percorso PixiJS.**

**Why:** L'utente ha confermato esplicitamente: "tutte le modifiche che fai falle in PixiJS WebGL". Modifiche che impattano solo il ramo Canvas 2D sono invisibili all'utente reale.

**How to apply:**
- L'architettura è: le funzioni Canvas 2D (es. `arredoDaImmagine`, `disegnaOggetto`) servono da *content generator* per Pixi → disegnano su una canvas off-screen → il risultato viene caricato come PIXI.Texture → usato da PIXI.Sprite. Modificare quelle funzioni Canvas fa sì che il cambiamento si propaghi anche a Pixi.
- Ma la cache-key Pixi (`statoBase` in `sincronizzaNodiPixi`) deve includere tutti i campi che influenzano il disegno (es. `o.iw`, `o.ih`). Se manca un campo, la texture non viene invalidata e il cambio non appare.
- Aggiungere `o.iw||0, o.ih||0` alla `statoBase` array quando si introducono nuovi attributi che modificano la resa visiva.
- Per effetti nativi Pixi (filtri, blending, layer) usare direttamente le API PIXI, non Canvas.
- Validare sempre nel browser vero (PixiJS) prima di dichiarare la fix completata.
