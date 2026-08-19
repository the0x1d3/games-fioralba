---
name: Validazione degli aggiornamenti scenario
description: Regole per validare collisioni e collegamenti degli scenari senza respingere scenografia valida.
---

La validazione di uno scenario deve esaminare le sole caselle modificate, comprese le coordinate di arrivo dei collegamenti nella mappa di destinazione. Non deve giudicare la mappa base intera.

**Why:** fontane e barche sono oggetti solidi volutamente posati sull'acqua. Un controllo globale li scambia per collisioni corrotte e renderebbe impossibile approvare anche un ritocco innocuo. Al contrario, un terreno o oggetto solido in una casella di arrivo modificata può intrappolare davvero il giocatore.

Gli spazi riservati del podere restano di proprietà delle costruzioni permanenti, anche prima che siano acquistate. Uno scenario non può posare terreno o oggetti in quelle impronte e una migrazione deve avere una sola fonte di verità per ogni costruzione.

**How to apply:** per un nuovo controllo, porta l'insieme delle coordinate toccate per mappa; verifica sempre uscite e arrivi nei rispettivi mondi. Mantieni le eccezioni semantiche per la scenografia ammessa, proteggi gli spazi riservati e applica le regole più severe alle costruzioni del giocatore.