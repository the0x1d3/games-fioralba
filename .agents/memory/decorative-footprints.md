---
name: Impronte delle decorazioni
description: Regola per decorazioni la cui collisione o area selezionabile non coincide con le dimensioni dello sprite.
---

Le decorazioni con un ingombro logico diverso dal loro disegno devono dichiarare la propria impronta separatamente e ogni flusso di modifica deve usare quella dichiarazione: selezione, anteprima, vincoli, collisioni, export e ripristino.

**Why:** usare le dimensioni del solo sprite può lasciare collisioni alla vecchia posizione o permettere una sovrapposizione invisibile nelle righe non disegnate.

**How to apply:** quando aggiungi o trasformi una decorazione con collisione propria, conserva le dimensioni visive per il renderer e definisci un ingombro logico esplicito; prova l’intera area, non solo l’ancora o la porzione visibile.