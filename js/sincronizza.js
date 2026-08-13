/* ===================================================================
   FIORALBA — sincronizza.js
   La partita che ti segue dal fisso al portatile.

   IL LOCALE RESTA LA VERITÀ. Il gioco salva su localStorage esattamente
   come ha sempre fatto — offline compreso, senza chiedere niente a
   nessuno — e questo file tiene allineata una copia sul server. Se il
   server è giù, chi gioca non se ne accorge: nessuna funzione del gioco
   aspetta la rete, e un errore di collegamento non è mai un errore di
   gioco. Non è prudenza eccessiva: fino a ieri Fioralba funzionava in
   aereo, e deve continuare.

   NIENTE ACCOUNT: un codice, e basta. Si genera al primo collegamento,
   si legge nel menu, e sul secondo computer si digita una volta. Chi ha
   il codice ha la partita — è una chiave, non un nome utente, ed è
   scritto anche nel menu perché non sia una sorpresa.

   I CONFLITTI LI DECIDE IL GIOCATORE. Se le versioni non tornano il
   server rifiuta la scrittura, e qui si apre una finestra che mostra le
   due partite — giorno, stagione, monete, quando sono state salvate — e
   chiede quale tenere. Nessuna regola automatica: «vince il più
   recente» butta via una sessione senza dirlo, ed è il modo peggiore di
   rompere la fiducia in una funzione che dovrebbe darne.
   =================================================================== */
(function(){

const S = {};
window.SINC = S;

const CHIAVE = 'fioralba_sinc';
const RITARDO_INVIO = 4000;      // si aspetta un attimo: salvare è frequente

/* --------------------------------------------------------------- */
/* quello che ricordiamo di noi                                    */
/* --------------------------------------------------------------- */
let stato = { codice:null, versione:0, ultimo:null, esito:null };

function leggiStato(){
  try{
    const s = JSON.parse(localStorage.getItem(CHIAVE) || 'null');
    if(s && typeof s.codice === 'string') stato = Object.assign(stato, s);
  }catch(e){}
}
function scriviStato(){
  try{ localStorage.setItem(CHIAVE, JSON.stringify({ codice:stato.codice, versione:stato.versione })); }
  catch(e){}
}
leggiStato();

S.stato = ()=> Object.assign({}, stato);
S.collegato = ()=> !!stato.codice;

/* --------------------------------------------------------------- */
/* parlare col server                                              */
/* --------------------------------------------------------------- */
/* Ogni chiamata può fallire, e fallire è normale: si torna un oggetto
   con `ok:false` invece di lanciare, così nessun percorso del gioco può
   rompersi perché la rete non c'era. */
async function chiama(metodo, percorso, corpo){
  try{
    const r = await fetch(percorso, {
      method: metodo,
      headers: corpo ? { 'Content-Type':'application/json' } : {},
      body: corpo ? JSON.stringify(corpo) : undefined
    });
    let dati = null;
    try{ dati = await r.json(); }catch(e){}
    return { ok:r.ok, stato:r.status, dati:dati||{} };
  }catch(e){
    return { ok:false, stato:0, dati:{ errore:'niente rete' } };
  }
}

/* --------------------------------------------------------------- */
/* collegare e scollegare                                          */
/* --------------------------------------------------------------- */
S.collega = async function(){
  const r = await chiama('POST', '/api/partita');
  if(!r.ok) return { ok:false, errore: r.dati.errore || 'non riesco a collegarmi' };
  stato.codice = r.dati.codice;
  stato.versione = 0;
  scriviStato();
  return { ok:true, codice: stato.codice };
};

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

S.usaCodice = async function(grezzo){
  const codice = S.normalizza(grezzo);
  if(!codice) return { ok:false, errore:'Il codice non ha la forma giusta: dodici lettere e numeri.' };
  const r = await chiama('GET', '/api/partita/' + codice + '/stato');
  if(r.stato === 404) return { ok:false, errore:'Nessuna partita con questo codice.' };
  if(!r.ok) return { ok:false, errore: r.dati.errore || 'non riesco a raggiungere il server' };
  stato.codice = codice;
  stato.versione = 0;          // non sappiamo ancora niente: la prossima mossa decide
  scriviStato();
  return { ok:true, scheda: r.dati };
};

S.scollega = function(){
  stato = { codice:null, versione:0, ultimo:null, esito:null };
  try{ localStorage.removeItem(CHIAVE); }catch(e){}
};

/* --------------------------------------------------------------- */
/* mandare e prendere                                              */
/* --------------------------------------------------------------- */
/* Manda il salvataggio locale. Se il server ha qualcosa di più nuovo
   non insiste: torna `conflitto` con la scheda dell'altro, e decide il
   giocatore. */
S.invia = async function(forza){
  if(!stato.codice) return { ok:false, errore:'non collegato' };
  const dati = SALVA.grezzo();
  if(!dati) return { ok:false, errore:'niente da mandare' };

  let meta = {};
  try{ meta = JSON.parse(dati); }catch(e){}

  const r = await chiama('PUT', '/api/partita/' + stato.codice, {
    dati,
    versione: forza ? undefined : stato.versione,   // senza versione il server non controlla
    giornoTot: meta.giornoTot || 0,
    nome: meta.nomeGiocatore || null,
    /* quattro numeri per far riconoscere la partita dall'altro
       dispositivo senza scaricarne centoquaranta chilobyte */
    sommario: {
      oro: meta.oro,
      giorno: meta.giorno,
      anno: meta.anno,
      stagione: (DATA.SEASONS[meta.stagioneIdx] || {}).nome
    }
  });

  if(r.stato === 409){
    stato.esito = 'conflitto';
    return { ok:false, conflitto:true, server:r.dati.server, locale:schedaLocale() };
  }
  if(!r.ok){ stato.esito = 'errore'; return { ok:false, errore: r.dati.errore || 'invio non riuscito' }; }

  stato.versione = r.dati.versione;
  stato.ultimo = Date.now();
  stato.esito = 'ok';
  scriviStato();
  return { ok:true, versione: stato.versione };
};

/* Prende la partita dal server e la installa al posto di quella locale.
   Passa dalla stessa validazione dell'import da file: un salvataggio
   che non sapremmo rileggere non deve entrare neanche da qui. */
S.scarica = async function(){
  if(!stato.codice) return { ok:false, errore:'non collegato' };
  const r = await chiama('GET', '/api/partita/' + stato.codice);
  if(!r.ok) return { ok:false, errore: r.dati.errore || 'non riesco a scaricare' };
  if(!r.dati.dati) return { ok:false, errore:'sul server non c\'è ancora niente' };

  const esito = G.importaTesto(r.dati.dati);
  if(!esito.ok) return { ok:false, errore: esito.err };

  stato.versione = r.dati.versione;
  stato.ultimo = Date.now();
  stato.esito = 'ok';
  scriviStato();
  return { ok:true, versione: stato.versione };
};

/* la carta d'identità della partita che abbiamo qui, per il confronto */
function schedaLocale(){
  try{
    const d = JSON.parse(SALVA.grezzo() || 'null');
    if(!d) return null;
    return { giornoTot:d.giornoTot||0, nome:d.nomeGiocatore, oro:d.oro,
             stagione:(DATA.SEASONS[d.stagioneIdx]||{}).nome, giorno:d.giorno, anno:d.anno };
  }catch(e){ return null; }
}
S.schedaLocale = schedaLocale;

/* --------------------------------------------------------------- */
/* l'invio pigro                                                   */
/* --------------------------------------------------------------- */
/* Il gioco salva spesso — a ogni autosave, a ogni cambio scheda. Mandare
   140 KB ogni volta sarebbe sciocco: si aspetta qualche secondo di
   quiete e si manda una volta sola. */
let attesa = null;
S.programmaInvio = function(){
  if(!stato.codice) return;
  clearTimeout(attesa);
  attesa = setTimeout(()=>{
    S.invia().then(r=>{
      if(r.conflitto && window.UI) UI.toast('La partita sul server è diversa: apri il Menu per decidere.','bad');
    });
  }, RITARDO_INVIO);
};

/* --------------------------------------------------------------- */
/* la migrazione, che passa da chi importa un file                 */
/* --------------------------------------------------------------- */
/* Chi importa un salvataggio da file È, quasi per definizione, chi sta
   spostando la partita da un posto a un altro: o dal vecchio indirizzo,
   o dal fisso al portatile. È il momento in cui la sincronizzazione gli
   serve davvero, e l'unico in cui gliela si può offrire senza
   interrompere niente — sta già aspettando che il gioco si riavvii.

   Quindi il file appena importato sale sul server e si prende un codice.
   È così che i salvataggi locali passano nel database uno per volta,
   senza una migrazione in blocco che nessuno saprebbe fare: migra chi
   si presenta.

   Se il browser ha già un codice non se ne inventa un altro: manda sul
   suo, e se il server ha qualcosa di diverso lo dice invece di
   sovrascrivere. */
S.migraDaImport = async function(){
  if(!S.collegato()){
    const c = await S.collega();
    if(!c.ok) return { ok:false, errore:c.errore };
    const i = await S.invia();
    if(!i.ok) return { ok:false, errore:i.errore || 'non riesco a mandare la partita' };
    return { ok:true, codice:stato.codice, nuovo:true };
  }
  const i = await S.invia();
  if(i.conflitto) return { ok:false, conflitto:true, server:i.server, locale:i.locale, codice:stato.codice };
  if(!i.ok) return { ok:false, errore:i.errore, codice:stato.codice };
  return { ok:true, codice:stato.codice, nuovo:false };
};

/* All'avvio: se il server è più avanti di noi, lo si dice e basta. Non
   si scarica di nascosto — sostituire la partita di qualcuno senza
   chiedere è esattamente quello che questa funzione non deve fare. */
S.controllaAvvio = async function(){
  if(!stato.codice) return null;
  const r = await chiama('GET', '/api/partita/' + stato.codice + '/stato');
  if(!r.ok) return null;
  const loc = schedaLocale();
  if(r.dati.vuota) return null;
  if(r.dati.versione === stato.versione) return null;
  return { server:r.dati, locale:loc };
};

})();
