# Scenari di Fioralba

`approved.json` è il solo manifesto letto dal gioco. Contiene gli scenari
approvati e può essere incluso nel deploy Railway senza portare con sé
l'editor locale.

L'editor salva le bozze in `scenarios/drafts/` e, quando si usa il comando
locale **Approva scenario**, copia una versione immutabile in
`scenarios/approved/` e aggiorna il manifesto. I file con versione restano
nel repository: il manifesto indica quale versione è attiva e una partita
può essere ricostruita anche dopo modifiche successive.

Il formato delle singole versioni è documentato nell'interfaccia editoriale.