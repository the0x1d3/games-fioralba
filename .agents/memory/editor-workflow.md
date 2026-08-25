---
name: Editor locale e debug privato
description: Decisione sul flusso di sviluppo dell’editor di scenari prima della pubblicazione del gioco.
---

Durante la fase privata il pannello debug può restare attivo. L’editor degli scenari deve invece essere uno strumento locale separato dal gioco: Railway riceve soltanto i dati di scenario approvati, non l’interfaccia editoriale.

**Why:** l’editor deve poter modificare il mondo liberamente senza esporre strumenti di authoring nel gioco distribuito e senza confondere le modifiche dello scenario con i salvataggi dei giocatori.

**How to apply:** mantenere l’editor in una cartella locale separata, preferibilmente con output in JSON versionato; non modificare direttamente world.js come flusso normale e non cambiare il debug finché il progetto resta privato.

La modalità modifica dentro al gioco è ammessa soltanto come banco di prova
temporaneo: richiede il consenso inserito dal server nell’ambiente di sviluppo,
può produrre solo una bozza JSON e deve sempre ripristinare il mondo.

**Why:** è utile provare il ritocco nel contesto reale, ma nessun salvataggio,
invio in chiusura o menu pubblico deve poter trasformare una bozza in progresso
del giocatore o in contenuto pubblicato.

**How to apply:** mantenere l’accesso assente nella risposta pubblica, bloccare
input e serializzazione per tutta la prova e far passare l’approvazione
definitiva dall’editor locale.

Quando l’avvio della partita attende dati di scenario, i dati inseriti nella UI (come il nome) devono essere passati all’inizializzazione e applicati dopo l’attesa, prima del primo salvataggio.

**Why:** una callback UI che continua subito può altrimenti salvare lo stato precedente oppure farsi sovrascrivere dallo stato iniziale.

**How to apply:** trattare l’avvio come un’operazione asincrona atomica e attendere il suo completamento prima di aggiornare HUD o persistenza.

Un editor locale con endpoint che scrivono file deve richiedere un token casuale per processo, consegnato soltanto alla sua pagina loopback, oltre a controllare origine, host e content type.

**Why:** il binding a 127.0.0.1 non blocca un sito esterno dal tentare POST browser verso localhost.

**How to apply:** rigenerare il token a ogni avvio e rifiutare qualsiasi richiesta mutante priva del token o non proveniente dall’origine locale attesa.
