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

function scriviAttiva(){ scrivi(CH_ATTIVA, { codice:stato.codice, versione:stato.versione }); }

S.stato = ()=> Object.assign({}, stato);
S.collegato = ()=> !!stato.codice;
S.codice = ()=> stato.codice;

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
}
function svuota(){ butta(CH_CASSETTO); }
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
  svuota();                        // il cassetto di un'altra partita non c'entra
  return { ok:true, codice: stato.codice };
};

/* Apre un codice: lo scarica e lo installa. È l'unico modo di cominciare
   a giocare una partita che esiste già. */
S.apri = async function(grezzo){
  const codice = S.normalizza(grezzo);
  if(!codice) return { ok:false, errore:'Il codice non ha la forma giusta: dodici lettere e numeri.' };

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
    if(c.versione === r.dati.versione){
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
S.migra = async function(testo){
  const esito = SALVA.applicaTesto(testo);
  if(!esito.ok) return { ok:false, errore: esito.err };
  const n = await S.nuova();
  if(!n.ok) return n;
  const i = await S.invia();
  if(!i.ok) return { ok:false, errore: i.errore || 'Non riesco a mandare la partita sul server.' };
  try{ localStorage.removeItem(CH_VECCHIA); localStorage.removeItem('fioralba_save_bak'); }catch(e){}
  return { ok:true, codice: stato.codice };
};

})();
