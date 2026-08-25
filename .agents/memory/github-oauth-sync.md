---
name: Recupero push GitHub
description: Come gestire un ramo locale divergente quando il push HTTPS non può più autenticarsi ma l’integrazione GitHub Replit è autorizzata.
---

Quando `git fetch` funziona ma `git push` rifiuta le credenziali HTTPS, non chiedere un token all’utente. La connessione GitHub OAuth di Replit può eseguire le chiamate REST al repository senza esporre segreti.

**Why:** l’URL `origin` può restare pubblico mentre le credenziali locali scadono; ciò blocca soltanto il push, non l’accesso autorizzato via integrazione.

**How to apply:** verificare prima che OAuth disponga del permesso `push` e integrare i commit remoti localmente. Se bisogna ricostruire la cronologia tramite REST, aggiornare il ref remoto solo dopo che il tree GitHub calcolato coincide con `HEAD^{tree}` locale. Prima di riallineare `main` con un reset, creare un ramo di sicurezza che punti alla cronologia locale precedente.