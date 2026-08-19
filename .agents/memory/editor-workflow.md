---
name: Editor locale e debug privato
description: Decisione sul flusso di sviluppo dell’editor di scenari prima della pubblicazione del gioco.
---

Durante la fase privata il pannello debug può restare attivo. L’editor degli scenari deve invece essere uno strumento locale separato dal gioco: Railway riceve soltanto i dati di scenario approvati, non l’interfaccia editoriale.

**Why:** l’editor deve poter modificare il mondo liberamente senza esporre strumenti di authoring nel gioco distribuito e senza confondere le modifiche dello scenario con i salvataggi dei giocatori.

**How to apply:** mantenere l’editor in una cartella locale separata, preferibilmente con output in JSON versionato; non modificare direttamente world.js come flusso normale e non cambiare il debug finché il progetto resta privato.
