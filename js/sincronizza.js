/* ===================================================================
   FIORALBA — sincronizza.js
   Le partite stanno sul server. Questo file è l'unico che ci parla.

   PRIMA ERA IL CONTRARIO, e non funzionava. Il localStorage era la
   verità e il server ne teneva una copia: due partite che potevano
   divergere, un conflitto da far decidere al giocatore ogni volta che
   divergevano davvero, e — per un anno intero — una copia che non si
   aggiornava mai, perché `programmaInvio` non la chiamava nessuno.
   Adesso c'è una partita sola e sta sul server: un codice, una partita,
   nessuna copia con cui litigare.

   RESTA UNA COSA IN LOCALE, E UNA SOLA: il **cassetto**. È l'ultimo
   salvataggio che non è ancora riuscito ad arrivare sul server — Wi-Fi
   caduto, scheda chiusa a metà invio, treno in galleria. Non è una
   seconda partita: non ci si può giocare, non compare da nessuna parte,
   e sparisce nell'istante in cui il server conferma di averlo preso.
   Senza, un pacchetto perso costa una giornata di gioco, e questo è il
   genere di cosa che non si perdona a un gioco di fattoria.

   NIENTE ACCOUNT: un codice, e basta. Chi ha il codice ha la partita —
   è una chiave, non un nome utente. Questo dispositivo si ricorda i
   codici che ha visto, così «Continua» può mostrarli invece di
   chiederli; ma è un elenco di chiavi, non di partite, e cancellarlo
   non cancella niente.
   =================================================================== */
(function(){

const S = {};
window.SINC = S;

const CH_ATTIVA   = 'fioralba_sinc';       // { codice, versione }
const CH_ELENCO   = 'fioralba_partite';    // [ { codice, scheda, visto } ]
const CH_CASSETTO = 'fioralba_cassetto';   // { codice, versione, dati, quando }
const RITARDO     = 3000;                  // quiete prima di mandare: salvare è frequente

/* --------------------------------------------------------------- */
/* quello che questo dispositivo ricorda                            */
/* --------------------------------------------------------------- */
let stato = { codice:null, versione:0, ultimo:null, esito:null };

function leggi(chiave, ripiego){
  try{ const v = JSON.parse(localStorage.getItem(chiave) || 'null'); return v === null ? ripiego : v; }
  catch(e){ return ripiego; }
}
function scrivi(chiave, valore){
  try{ localStorage.setItem(chiave, JSON.stringify(valore)); return true; }
  catch(e){ return false; }
}
function butta(chiave){ try{ localStorage.removeItem(chiave); }catch(e){} }

(function(){
  const s = leggi(CH_ATTIVA, null);
  if(s && typeof s.codice === 'string') stato = Object.assign(stato, s);
})();

/* `ultimo` viaggia col resto: senza, «ultimo salvataggio sul server» si
   azzerava a ogni ricarica e diceva «mai» a chi aveva appena salvato —
   che è il modo più sicuro di far credere rotta una cosa che funziona. */
function scriviAttiva(){
  scrivi(CH_ATTIVA, { codice:stato.codice, versione:stato.versione, ultimo:stato.ultimo });
}

S.stato = ()=> Object.assign({}, stato);
S.collegato = ()=> !!stato.codice;
S.codice = ()=> stato.codice;
S.ultimoInvio = ()=> stato.ultimo || null;
/* C'è qualcosa di giocato che non è ancora arrivato di là? */
S.inSospeso = function(){
  const c = S.cassetto();
  return !!(c && c.codice === stato.codice);
};

/* --------------------------------------------------------------- */
/* l'elenco dei codici visti qui                                    */
/* --------------------------------------------------------------- */
/* Serve a «Continua»: senza, chi torna sul suo computer dovrebbe
   ridigitare dodici caratteri che ha già digitato. La scheda salvata
   accanto (nome, giorno, stagione, monete) serve a disegnare la carta
   PRIMA che il server risponda: la finestra si apre già piena e poi si
   aggiorna, invece di mostrare tre rettangoli vuoti per un secondo. */
S.elenco = function(){
  const l = leggi(CH_ELENCO, []);
  return Array.isArray(l) ? l.filter(v => v && typeof v.codice === 'string') : [];
};
S.ricorda = function(codice, scheda){
  if(!codice) return;
  const l = S.elenco().filter(v => v.codice !== codice);
  l.unshift({ codice, scheda: scheda || null, visto: Date.now() });
  scrivi(CH_ELENCO, l.slice(0, 12));      // dodici è già più di chiunque
};
S.dimentica = function(codice){
  scrivi(CH_ELENCO, S.elenco().filter(v => v.codice !== codice));
  if(stato.codice === codice){ stato = { codice:null, versione:0, ultimo:null, esito:null }; butta(CH_ATTIVA); }
};

/* --------------------------------------------------------------- */
/* parlare col server                                               */
/* --------------------------------------------------------------- */
/* Ogni chiamata può fallire, e fallire è normale: si torna un oggetto
   con `ok:false` invece di lanciare, così nessun percorso del gioco può
   rompersi perché la rete non c'era. */
async function chiama(metodo, percorso, corpo, opzioni){
  try{
    const r = await fetch(percorso, Object.assign({
      method: metodo,
      headers: corpo ? { 'Content-Type':'application/json' } : {},
      body: corpo ? JSON.stringify(corpo) : undefined
    }, opzioni || {}));
    let dati = null;
    try{ dati = await r.json(); }catch(e){}
    return { ok:r.ok, stato:r.status, dati:dati||{} };
  }catch(e){
    return { ok:false, stato:0, dati:{ errore:'Non riesco a raggiungere il server.' } };
  }
}

/* Il codice si detta a voce e si scrive a mano: si accettano minuscole,
   spazi al posto dei trattini, e il prefisso dimenticato. Rifiutare un
   codice giusto scritto in modo diverso è il modo più sicuro di far
   credere che la funzione sia rotta. */
S.normalizza = function(grezzo){
  let c = String(grezzo || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if(c.startsWith('FIORALBA')) c = c.slice(8);
  if(c.length !== 12) return null;
  return 'FIORALBA-' + c.slice(0,4) + '-' + c.slice(4,8) + '-' + c.slice(8,12);
};

/* --------------------------------------------------------------- */
/* il cassetto                                                      */
/* --------------------------------------------------------------- */
/* Si scrive PRIMA di provare a mandare, non dopo il fallimento: se la
   scheda si chiude nel mezzo della fetch non c'è nessun `catch` che
   giri, e quello che non è stato scritto prima non si scrive più. */
function metti(dati){
  scrivi(CH_CASSETTO, { codice:stato.codice, versione:stato.versione, dati, quando:Date.now() });
  if(S.aggiornaGuardia) S.aggiornaGuardia();
}
function svuota(){
  butta(CH_CASSETTO);
  if(S.aggiornaGuardia) S.aggiornaGuardia();
}
S.cassetto = function(){
  const c = leggi(CH_CASSETTO, null);
  return (c && typeof c.dati === 'string' && c.codice) ? c : null;
};
S.svuotaCassetto = svuota;

/* --------------------------------------------------------------- */
/* aprire una partita                                               */
/* --------------------------------------------------------------- */
/* La scheda leggera di un codice, per il selettore. */
S.scheda = async function(codice){
  const r = await chiama('GET', '/api/partita/' + codice + '/stato');
  if(!r.ok) return null;
  return r.dati;
};
S.schede = function(codici){
  return Promise.all(codici.map(c => S.scheda(c).then(s => s ? Object.assign({codice:c}, s) : null)));
};

/* Una partita nuova: il codice lo dà il server, e da quel momento è la
   partita. Non si sovrascrive niente — ogni partita ha il suo codice, e
   quella di prima resta dov'è. */
S.nuova = async function(){
  const r = await chiama('POST', '/api/partita');
  if(!r.ok) return { ok:false, errore: r.dati.errore || 'Non riesco a creare la partita sul server.' };
  stato.codice = r.dati.codice;
  stato.versione = r.dati.versione || 0;
  stato.esito = 'ok';
  scriviAttiva();
  S.ricorda(stato.codice, null);
  /* Il cassetto NON si butta.

     C'era `svuota()` con scritto «il cassetto di un'altra partita non
     c'entra», e non c'entra davvero — `inSospeso()` lo ignora perché
     controlla il codice — ma buttarlo vuol dire buttare l'ultima
     giornata di una partita che non era ancora riuscita a salire. Resta
     lì: se si riapre quel codice, `apri()` lo ritrova e lo propone. */
  return { ok:true, codice: stato.codice };
};

/* Apre un codice: lo scarica e lo installa. È l'unico modo di cominciare
   a giocare una partita che esiste già. */
S.apri = async function(grezzo){
  const codice = S.normalizza(grezzo);
  if(!codice) return { ok:false, errore:'Il codice non ha la forma giusta: dodici lettere e numeri.' };
  /* Una partita già avviata merita lo stesso mondo di una nuova: aspetta
     il piccolo manifesto degli scenari prima di ricostruire le mappe,
     invece di aprire in silenzio la versione base se la rete è lenta. */
  if(window.SCENARI && SCENARI.pronto) await SCENARI.pronto;

  const r = await chiama('GET', '/api/partita/' + codice);
  if(r.stato === 404) return { ok:false, errore:'Nessuna partita con questo codice.' };
  if(!r.ok) return { ok:false, errore: r.dati.errore || 'Non riesco a raggiungere il server.' };
  if(!r.dati.dati) return { ok:false, vuota:true, codice, errore:'Quel codice esiste, ma non ha ancora nessuna partita dentro.' };

  const esito = SALVA.applicaTesto(r.dati.dati);
  if(!esito.ok) return { ok:false, errore: esito.err };

  stato.codice = codice;
  stato.versione = r.dati.versione;
  stato.ultimo = Date.now();
  stato.esito = 'ok';
  scriviAttiva();
  S.ricorda(codice, r.dati);

  /* Il cassetto di QUESTA partita, rimasto da una sessione che non è
     riuscita a mandare: se il server è ancora dov'era quando l'abbiamo
     riempito, quella roba è più recente di quella appena scaricata e va
     rimessa in cima. Se il server è andato avanti, non si decide da
     soli: si dice che c'è e si lascia scegliere. */
  const c = S.cassetto();
  if(c && c.codice === codice){
    /* PRIMA di tutto: il cassetto è uguale a quello che c'è sul server?

       Capita a ogni ricarica normale. Uscendo si riempie il cassetto e
       si manda con `keepalive`: la richiesta arriva, ma la pagina è già
       morta e nessuno esegue lo svuotamento. Al rientro il cassetto è
       lì, pieno, con dentro esattamente quello che il server ha già —
       e senza questo confronto il gioco diceva «c'è del gioco non
       ancora arrivato», accendeva la spia e faceva chiedere al browser
       «vuoi davvero uscire?» a chi non aveva niente in sospeso.
       Confrontare i due testi è esatto, e ce li abbiamo già in mano. */
    if(c.dati === r.dati.dati){ svuota(); }
    else if(c.versione === r.dati.versione){
      /* il server è fermo dov'eravamo: quella roba non è mai partita */
      const e2 = SALVA.applicaTesto(c.dati);
      if(e2.ok) return { ok:true, codice, versione:stato.versione, dalCassetto:true };
    } else {
      return { ok:true, codice, versione:stato.versione, cassettoInSospeso:c };
    }
  }
  return { ok:true, codice, versione:stato.versione };
};

S.chiudi = function(){
  stato = { codice:null, versione:0, ultimo:null, esito:null };
  butta(CH_ATTIVA);
};

/* Cancella la partita: prima sul server, poi da questo apparecchio.

   In quest'ordine e non nell'altro. Togliendola prima dall'elenco
   locale, se poi il server dicesse di no si resterebbe con una partita
   viva di cui non si ha più il codice da nessuna parte — cioè persa
   senza essere cancellata, il peggiore dei due esiti. Se il server non
   risponde non si tocca niente e lo si dice.

   Il 404 vale come riuscita: vuol dire che di là non c'è già più, e
   l'elenco locale che la nomina è proprio la cosa da ripulire. */
S.cancella = async function(codice){
  if(!codice) return { ok:false, errore:'Nessuna partita da cancellare.' };
  const r = await chiama('DELETE', '/api/partita/' + codice);
  if(!r.ok && r.stato !== 404)
    return { ok:false, errore: r.dati.errore || 'Non riesco a cancellarla: il server non risponde.' };

  S.dimentica(codice);
  const c = S.cassetto();
  if(c && c.codice === codice) svuota();     // il cassetto di una partita che non c'è più
  return { ok:true, codice };
};

/* --------------------------------------------------------------- */
/* mandare                                                          */
/* --------------------------------------------------------------- */
/* `forza` salta il controllo di versione: lo usa solo chi ha appena
   guardato in faccia le due partite e ha scelto la sua. */
S.invia = async function(forza, opzioni){
  if(!stato.codice) return { ok:false, errore:'Nessuna partita aperta.' };
  const dati = SALVA.testo();
  if(!dati) return { ok:false, errore:'Non c\'è niente da mandare.' };

  let meta = {};
  try{ meta = JSON.parse(dati); }catch(e){}

  const r = await chiama('PUT', '/api/partita/' + stato.codice, {
    dati,
    versione: forza ? undefined : stato.versione,
    giornoTot: meta.giornoTot || 0,
    nome: meta.nomeGiocatore || null,
    /* quattro numeri per far riconoscere la partita nel selettore senza
       scaricarne centoquaranta chilobyte */
    sommario: {
      oro: meta.oro,
      giorno: meta.giorno,
      anno: meta.anno,
      stagione: (DATA.SEASONS[meta.stagioneIdx] || {}).nome
    }
  }, opzioni);

  if(r.stato === 409){
    stato.esito = 'conflitto';
    return { ok:false, conflitto:true, server:r.dati.server, locale:S.schedaViva() };
  }
  if(!r.ok){ stato.esito = 'errore'; return { ok:false, errore: r.dati.errore || 'Invio non riuscito.' }; }

  stato.versione = r.dati.versione;
  stato.ultimo = Date.now();
  stato.esito = 'ok';
  scriviAttiva();
  S.ricorda(stato.codice, r.dati);
  svuota();                        // è arrivato: il cassetto non serve più
  return { ok:true, versione: stato.versione };
};

/* la carta d'identità della partita che si sta giocando adesso */
S.schedaViva = function(){
  try{
    const d = JSON.parse(SALVA.testo() || 'null');
    if(!d) return null;
    return { giornoTot:d.giornoTot||0, nome:d.nomeGiocatore, oro:d.oro,
             stagione:(DATA.SEASONS[d.stagioneIdx]||{}).nome, giorno:d.giorno, anno:d.anno };
  }catch(e){ return null; }
};

/* --------------------------------------------------------------- */
/* l'invio, chiamato da SALVA.salva a ogni salvataggio              */
/* --------------------------------------------------------------- */
/* Due tempi. Il cassetto si riempie SUBITO e in modo sincrono, così se
   il browser muore un istante dopo il salvataggio è comunque al sicuro.
   L'invio invece aspetta qualche secondo di quiete: il gioco salva a
   ogni autosave e a ogni cambio di scheda, e mandare 140 KB ogni volta
   sarebbe sciocco. */
let attesa = null;
let inVolo = false;
S.programmaInvio = function(){
  if(!stato.codice) return;
  const dati = SALVA.testo();
  if(!dati) return;
  metti(dati);

  clearTimeout(attesa);
  attesa = setTimeout(()=>{
    if(inVolo){ S.programmaInvio(); return; }     // uno alla volta, in fila
    inVolo = true;
    S.invia().then(r=>{
      inVolo = false;
      if(r.conflitto && window.UI && UI.conflittoSinc)
        UI.conflittoSinc(G, r.locale, r.server);
      else if(!r.ok && window.UI && UI.segnalaSinc) UI.segnalaSinc(r.errore);
      else if(window.UI && UI.segnalaSinc) UI.segnalaSinc(null);
    }).catch(()=>{ inVolo = false; });
  }, RITARDO);
};

/* Chiudere la scheda non deve costare gli ultimi tre secondi.
   `keepalive` fa sopravvivere la richiesta alla pagina che se ne va —
   è l'unico modo, perché una `fetch` normale viene troncata. Il
   cassetto c'è comunque, ma arrivare subito è meglio che arrivare al
   prossimo avvio. */
function primaDiAndarsene(){
  if(!stato.codice || !G || !G.inGioco) return;
  clearTimeout(attesa);
  const dati = SALVA.testo();
  if(!dati) return;
  metti(dati);
  S.invia(false, { keepalive:true });
}
window.addEventListener('pagehide', primaDiAndarsene);
document.addEventListener('visibilitychange', ()=>{ if(document.hidden) primaDiAndarsene(); });

/* --------------------------------------------------------------- */
/* il battito dei cinque minuti                                     */
/* --------------------------------------------------------------- */
/* Non è una seconda copia dell'autosave: è il RITENTATIVO.

   L'invio parte da `SALVA.salva`, quindi se un invio fallisce — rete
   caduta, server che tossisce — non lo riprova nessuno finché il gioco
   non salva di nuovo. E se in quel momento si smette di giocare (si
   guarda il campo, si va a prendere un caffè, si resta fermi dentro a
   una casa), non salva più niente e il cassetto resta lì pieno fino al
   prossimo avvio.

   Ogni cinque minuti quindi si guarda se c'è qualcosa di non mandato, e
   se c'è si riprova. Quando non c'è, questo giro non fa niente e non
   costa niente: nessuna richiesta, nessun byte. */
const BATTITO = 5 * 60 * 1000;
/* Una funzione con un nome, e non un corpo anonimo dentro a
   `setInterval`: così la si può chiamare da una prova senza aspettare
   cinque minuti veri, che è l'unico modo di sapere se fa quello che
   dice. Torna cosa ha deciso, per la stessa ragione. */
S.battito = function(){
  if(!stato.codice) return 'nessuna partita aperta';
  if(!window.G || !G.inGioco || G.p.dorme) return 'non si sta giocando';
  if(!S.inSospeso()) return 'niente da mandare';
  S.programmaInvio();
  return 'riprovo';
};
setInterval(S.battito, BATTITO);
S.BATTITO = BATTITO;

/* --------------------------------------------------------------- */
/* l'avviso di chi esce con qualcosa ancora in mano                 */
/* --------------------------------------------------------------- */
/* `beforeunload` è l'unico modo che il browser dà per fermare chi sta
   chiudendo, ma ha un prezzo: una pagina che ce l'ha registrato non
   entra nella cache avanti/indietro, e su telefono viene emesso in modo
   inaffidabile. Il prezzo si paga solo quando serve — il gestore si
   attacca quando il cassetto si riempie e si stacca appena si svuota —
   così nel caso normale, che è «tutto arrivato», la pagina resta com'era.

   Il testo non lo decidiamo noi: i browser mostrano da anni una frase
   loro e ignorano quella dell'autore. Quello che conta è che la domanda
   compaia. */
let guardiaAttaccata = false;
function guardia(e){
  if(!S.inSospeso()) return;
  e.preventDefault();
  e.returnValue = '';               // i browser vecchi vogliono ancora questo
  return '';
}
function aggiornaGuardia(){
  const serve = S.inSospeso();
  if(serve && !guardiaAttaccata){
    window.addEventListener('beforeunload', guardia);
    guardiaAttaccata = true;
  } else if(!serve && guardiaAttaccata){
    window.removeEventListener('beforeunload', guardia);
    guardiaAttaccata = false;
  }
}
S.aggiornaGuardia = aggiornaGuardia;

/* --------------------------------------------------------------- */
/* la migrazione di chi ha ancora una partita nel browser            */
/* --------------------------------------------------------------- */
/* Fino a ieri la partita stava in `fioralba_save_v1`. Chi apre il gioco
   con quella chiave ancora piena e nessun codice non deve accorgersi di
   niente: la si manda sul server, si prende un codice, e si continua.
   Non si cancella la vecchia chiave finché il server non ha confermato:
   se la migrazione fallisce, quello che c'era c'è ancora. */
const CH_VECCHIA = 'fioralba_save_v1';
S.daMigrare = function(){
  try{
    if(stato.codice) return null;
    const t = localStorage.getItem(CH_VECCHIA);
    return (t && t.length > 200) ? t : null;
  }catch(e){ return null; }
};
/* `pulisci` a false quando il salvataggio arriva da un file scelto a
   mano: quello nel browser, se c'è, non c'entra e non va buttato. */
S.migra = async function(testo, pulisci){
  if(window.SCENARI && SCENARI.pronto) await SCENARI.pronto;
  const esito = SALVA.applicaTesto(testo);
  if(!esito.ok) return { ok:false, errore: esito.err };
  const n = await S.nuova();
  if(!n.ok) return n;
  const i = await S.invia();
  if(!i.ok) return { ok:false, errore: i.errore || 'Non riesco a mandare la partita sul server.' };
  if(pulisci !== false)
    try{ localStorage.removeItem(CH_VECCHIA); localStorage.removeItem('fioralba_save_bak'); }catch(e){}
  return { ok:true, codice: stato.codice };
};

/* --------------------------------------------------------------- */
/* il file .json di ieri                                            */
/* --------------------------------------------------------------- */
/* Fioralba ha esportato salvataggi in .json per mesi, e in giro ce ne
   sono: sul desktop di qualcuno, in una cartella dei download, spediti
   per posta a un amico. Quei file adesso non si possono più «importare»
   nel senso di prima — non c'è più un posto locale dove metterli — ma
   si possono CONVERTIRE: si leggono, si validano con la stessa
   validazione di sempre, e salgono sul server come partita nuova col
   suo codice.

   È una porta a senso unico, ed è giusto così: si entra nel sistema
   nuovo, non si esce. Il file di partenza resta dov'è e non viene
   toccato — se la conversione fallisce non si è perso niente. */
S.daFileLegacy = function(alFatto){
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = '.json,application/json';
  inp.style.display = 'none';
  inp.onchange = ()=>{
    const file = inp.files && inp.files[0];
    if(!file){ inp.remove(); alFatto({ ok:false, annullato:true }); return; }
    /* 8 MB: un salvataggio sta in 170 KB, e leggere in memoria un file
       da mezzo giga perché qualcuno ha sbagliato a cliccare non serve a
       nessuno. */
    if(file.size > 8*1024*1024){
      inp.remove();
      alFatto({ ok:false, errore:'Questo file è troppo grande per essere un salvataggio di Fioralba.' });
      return;
    }
    const rd = new FileReader();
    rd.onload = ()=>{
      inp.remove();
      S.migra(String(rd.result||''), false).then(alFatto);
    };
    rd.onerror = ()=>{ inp.remove(); alFatto({ ok:false, errore:'Non riesco a leggere il file.' }); };
    rd.readAsText(file);
  };
  document.body.appendChild(inp);
  inp.click();
};

})();
