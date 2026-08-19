---
name: Validazione WebGL in anteprima
description: Come distinguere un vero errore Pixi dal limite GPU del browser di cattura locale.
---

La cattura locale dell’anteprima può non offrire alcun renderer WebGL e attivare correttamente il fallback Canvas, mentre la cattura tramite il dominio di sviluppo riesce ad avviare Pixi/WebGL.

**Why:** Trattare il fallback della cattura locale come un errore applicativo rende impossibile validare il percorso nativo e porta a inseguire un falso guasto.

**How to apply:** Usare la cattura locale per verificare Canvas e il fallback esplicito; per Pixi ricavare ogni volta il dominio di sviluppo corrente dall’ambiente, catturare quello e confermare backend/versione nei log del browser. Non salvare mai un dominio concreto.