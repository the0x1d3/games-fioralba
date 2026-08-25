---
name: Fogli grafici del gatto
description: Vincolo di impaginazione dell’asset degli aspetti del gatto.
---

Il foglio degli aspetti del gatto ha cinque righe utilizzabili di celle 192×192 e un margine trasparente inferiore non usato. I ritagli devono essere validati rispetto alla riga e alla cella realmente richieste, senza pretendere che l'altezza completa sia un multiplo esatto della cella.

**Why:** l’esportazione conserva spazio inferiore inattivo; trattarlo come una sesta riga o rifiutarlo renderebbe fragile un asset che viene ritagliato correttamente.

**How to apply:** quando cambiano fogli o aspetti, verificare larghezza, indici di riga e confini di ogni crop. Consentire il margine solo dopo l’ultima cella usata.