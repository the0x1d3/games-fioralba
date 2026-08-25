---
name: Camera stabile nei test browser dell’editor
description: Vincolo di affidabilità per i test Playwright che cliccano caselle del mondo dopo aver riposizionato la camera.
---

Nei test browser dell’editor, dopo aver riposizionato il personaggio per inquadrare una casella, attendere che l’inerzia della camera si stabilizzi prima di calcolare e cliccare le coordinate Canvas.

**Why:** il renderer traduce i click con la camera corrente; durante l’animazione di inseguimento il punto calcolato può diventare una casella diversa pochi frame dopo.

**How to apply:** quando un test modifica la posizione usata dalla camera, aspettare la stabilizzazione e controllare che la casella sia visibile fuori dai pannelli DOM prima di inviare il click Playwright.