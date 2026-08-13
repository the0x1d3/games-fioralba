/* ===================================================================
   FIORALBA — lingua.js
   Il gioco in due lingue, senza sparpagliare chiavi per tutto il codice.

   LA SCELTA CHE DECIDE TUTTO IL RESTO: la chiave di traduzione è la
   frase italiana stessa. `LINGUA.t('Zaino pieno!')` e non
   `LINGUA.t('inv.full')`. Contro l'ortodossia, e apposta:

   — al punto di chiamata il testo resta leggibile. Chi apre game.js
     legge ancora il gioco in italiano, che è tutta l'estetica di
     CLAUDE.md: le regole dicono «tutto in italiano», e restano vere per
     il codice. Cambia solo cosa arriva a schermo.
   — non c'è da battezzare milleduecento chiavi, né da ricordarsele.
   — e soprattutto: un controllo può confrontare catalogo e sorgente e
     dire quali frasi non sono tradotte e quali traduzioni non servono
     più a nessuno. Con le chiavi astratte quel controllo non si può
     scrivere, perché una chiave orfana sembra identica a una buona.

   Il prezzo, dichiarato: se cambi la frase italiana, la traduzione si
   scolla. Non è un rischio nascosto — è esattamente quello che il
   controllo in tools/coerenza.js va a cercare, e diventa un test rosso
   invece che una scritta italiana in mezzo all'inglese.

   DUE STRADE PER IL TESTO, perché ci sono due tipi di testo:

   1. Le frasi scritte nei moduli passano da poche strozzature — toast,
      prompt, dialoghi, il testo che vola sopra la testa — e lì si
      traducono al volo, all'ultimo momento utile.
   2. I testi che stanno in DATA (nomi degli oggetti, lettere, battute)
      li legge mezzo gioco leggendo DATA direttamente. Tradurli al punto
      di lettura voleva dire toccare centinaia di righe; invece si
      traduce DATA **sul posto**, una volta, al cambio di lingua. Gli
      originali italiani restano in un'ombra, così si torna indietro.
   =================================================================== */
(function(){

const LG = {};
window.LINGUA = LG;

const CHIAVE = 'fioralba_lingua';

LG.elenco = [
  { id:'it', nome:'Italiano', bandiera:'🇮🇹' },
  { id:'en', nome:'English',  bandiera:'🇬🇧' }
];

LG.attiva = 'it';

/* --------------------------------------------------------------- */
/* il catalogo                                                     */
/* --------------------------------------------------------------- */
function catalogo(){
  return (LG.attiva !== 'it' && window['LINGUA_' + LG.attiva.toUpperCase()]) || null;
}

/* Le frasi con dentro un numero non si possono cercare com'è: «+3 Legna»
   e «+7 Legna» sono la stessa frase. Si sostituisce ogni numero con un
   segnaposto, si cerca il modello, e i numeri si rimettono al loro
   posto. Serve anche a una cosa che sembra scollegata e non lo è: in
   inglese l'ordine può cambiare, e il modello «{0} monete» → «{0} coins»
   lo tiene, mentre una concatenazione fissa no. */
const NUMERO = /-?\d+(?:[.,]\d+)*/g;

function modello(testo){
  const numeri = [];
  const chiave = String(testo).replace(NUMERO, m => { numeri.push(m); return '{' + (numeri.length-1) + '}'; });
  return { chiave, numeri };
}

function rimetti(tradotto, numeri){
  return tradotto.replace(/\{(\d+)\}/g, (_, i) => numeri[i] !== undefined ? numeri[i] : '{'+i+'}');
}

/* La traduzione di una frase. Se non c'è, torna l'italiano: una frase
   non tradotta si legge, una frase mancante no. */
LG.t = function(testo){
  if(testo == null) return testo;
  const c = catalogo();
  if(!c) return testo;
  const s = String(testo);
  if(c[s] !== undefined) return c[s];
  const { chiave, numeri } = modello(s);
  if(numeri.length && c[chiave] !== undefined) return rimetti(c[chiave], numeri);
  mancante(s);
  return testo;
};

/* Una frase composta con dei pezzi dentro: il modello si traduce, e i
   pezzi si infilano dopo. Serve dove l'ordine delle parole cambia, ed è
   l'unico modo di farlo senza sbagliare.

   Il caso che l'ha resa necessaria: `'Conserva di ' + nome` dava «Conserva
   di Turnip» in inglese — metà tradotta e con l'ordine italiano. Con
   `LINGUA.f('Conserva di {0}', nome)` il catalogo dice «{0} Preserves» e
   il nome finisce dove l'inglese lo vuole, in testa. */
LG.f = function(modello, ...pezzi){
  const tradotto = LG.t(modello);
  return String(tradotto).replace(/\{(\d+)\}/g, (_, i) => pezzi[i] !== undefined ? pezzi[i] : '{'+i+'}');
};

/* Le frasi che il catalogo non conosce. Non si scrive in console a ogni
   fotogramma — un prompt ripetuto seppellirebbe tutto il resto — ma si
   tengono da parte, e il pannello di prova le sa mostrare. */
const mancanti = new Set();
function mancante(s){ if(s.trim() && !/^[\d\s.,:%+-]*$/.test(s)) mancanti.add(s); }
LG.mancanti = ()=>[...mancanti];

/* --------------------------------------------------------------- */
/* numeri e date                                                   */
/* --------------------------------------------------------------- */
/* Erano dieci `toLocaleString('it-IT')` scritti a mano. In inglese le
   migliaia si separano con la virgola, non col punto: 1.000 contro
   1,000, e chi legge «1.000» in inglese capisce «uno virgola zero». */
LG.locale = ()=> LG.attiva === 'en' ? 'en-GB' : 'it-IT';
LG.n = (v)=> Number(v).toLocaleString(LG.locale());

/* --------------------------------------------------------------- */
/* i testi dentro DATA                                             */
/* --------------------------------------------------------------- */
/* Quali campi di DATA sono testo da leggere, e non identificativi. È un
   elenco esplicito e non una regola furba: `id`, `cat`, `item`, `crop`
   sono stringhe anche loro, e tradurne una vorrebbe dire rompere il
   gioco invece che localizzarlo. Meglio dimenticare una frase — si vede
   subito, resta in italiano — che tradurre una chiave. */
const CAMPI = [
  ['SEASONS',     ['nome']],
  ['METEO',       ['nome']],
  ['CROPS',       ['nome']],
  ['ITEMS',       ['nome','desc']],
  ['COSTRUZIONI', ['nome','desc']],
  ['UPGRADE',     ['nome']],
  ['SKILLS',      ['nome','desc']],
  ['NPCS',        ['nome','ruolo','battute','amico']],
  ['SANTUARIO',   ['nome','testo']],
  ['MEMORIE',     ['titolo','testo']],
  ['LETTERE',     ['titolo','testo','da']],
  ['CONTESTO',    null],      // struttura libera: si traduce tutto il testo dentro
  ['FESTA',       null],
  ['AUGURI',      null],
  ['RISVEGLI',    null],
  ['CONSIGLI',    null],
  ['GIORNI_SETTIMANA', null],
  ['UPG_NOMI',    null]
];

/* l'italiano originale, preso una volta sola al primo avvio: è la
   sorgente di ogni traduzione e la via del ritorno */
let ombra = null;

/* Le tabelle di DATA hanno due forme: elenchi (`SANTUARIO` è un array di
   braci) e registri (`ITEMS` è un oggetto indicizzato per id). Nei primi
   i campi da tradurre stanno al primo piano, nei secondi al secondo —
   `ITEMS.rapa.nome`, non `ITEMS.nome`.

   Applicare la lista dei campi a un piano fisso funzionava solo per gli
   elenchi: dai registri usciva il vuoto, e sono spariti in silenzio i
   nomi degli oggetti, le battute di tutti e sette gli abitanti e tutte
   e quindici le lettere — dodicimila caratteri, cioè metà del gioco
   scritto. Non se n'era accorto nessuno perché un campo saltato non è
   un errore: è una frase che resta in italiano.

   Quindi la regola non è «a che piano», è «a che nome»: si scende
   finché non si incontra una chiave dell'elenco, e da lì in giù si
   prende tutto. Vale per tutte e due le forme, e per quelle che
   verranno. */
function raccogli(nodo, campi){
  if(typeof nodo === 'string') return campi ? undefined : nodo;
  if(Array.isArray(nodo)){
    const a = nodo.map(x => raccogli(x, campi));
    return a.some(x => x !== undefined) ? a : undefined;
  }
  if(nodo && typeof nodo === 'object'){
    const o = {};
    let qualcosa = false;
    for(const k in nodo){
      const v = nodo[k];
      if(campi && campi.includes(k)){
        const preso = raccogli(v, null);        // da qui in giù è tutto testo
        if(preso !== undefined){ o[k] = preso; qualcosa = true; }
      } else {
        const preso = raccogli(v, campi);       // continua a cercare più sotto
        if(preso !== undefined){ o[k] = preso; qualcosa = true; }
      }
    }
    return qualcosa ? o : undefined;
  }
  return undefined;
}

function versa(dentro, da, tradurre){
  if(typeof da === 'string'){ return tradurre ? LG.t(da) : da; }
  if(Array.isArray(da)){
    for(let i=0;i<da.length;i++){
      const v = versa(dentro && dentro[i], da[i], tradurre);
      if(v !== undefined && dentro) dentro[i] = v;
    }
    return undefined;
  }
  if(da && typeof da === 'object'){
    for(const k in da){
      const v = versa(dentro && dentro[k], da[k], tradurre);
      if(v !== undefined && dentro) dentro[k] = v;
    }
    return undefined;
  }
  return undefined;
}

function prendiOmbra(){
  if(ombra) return;
  ombra = {};
  for(const [nome, campi] of CAMPI){
    if(!DATA[nome]) continue;
    ombra[nome] = raccogli(DATA[nome], campi);
  }
}

/* Rimette in DATA l'italiano o la traduzione, partendo sempre
   dall'ombra: così passare da inglese a italiano e ritorno non
   accumula errori, e una frase tradotta non diventa mai la chiave di
   sé stessa. */
LG.applicaDati = function(){
  prendiOmbra();
  const tradurre = LG.attiva !== 'it';
  for(const [nome] of CAMPI){
    if(!DATA[nome] || !ombra[nome]) continue;
    versa(DATA[nome], ombra[nome], tradurre);
  }
};

/* Tutto l'italiano che sta in DATA, per il controllo di coerenza e per
   chi deve preparare un catalogo nuovo. */
LG.testiDati = function(){
  prendiOmbra();
  const fuori = [];
  const scendi = n => {
    if(typeof n === 'string'){ if(n.trim()) fuori.push(n); return; }
    if(Array.isArray(n)) return n.forEach(scendi);
    if(n && typeof n === 'object') for(const k in n) scendi(n[k]);
  };
  scendi(ombra);
  return fuori;
};

/* --------------------------------------------------------------- */
/* il markup della pagina                                          */
/* --------------------------------------------------------------- */
/* index.html ha una quarantina di frasi scritte a mano — la landing, i
   pulsanti, l'avviso per il telefono. Si segnano con `data-t` e si
   riscrivono al cambio di lingua. Il contenuto italiano resta nel
   sorgente della pagina: chi apre index.html continua a leggere il
   gioco, e chi non ha JS vede comunque qualcosa. */
function segnaMarkup(){
  for(const e of document.querySelectorAll('[data-t]')){
    if(!e.dataset.it) e.dataset.it = e.innerHTML;
  }
}

function applicaMarkup(){
  for(const e of document.querySelectorAll('[data-t]')){
    const orig = e.dataset.it;
    if(orig === undefined) continue;
    e.innerHTML = LG.attiva === 'it' ? orig : LG.t(orig);
  }
}

/* --------------------------------------------------------------- */
/* cambio di lingua                                                */
/* --------------------------------------------------------------- */
const ascoltatori = [];
LG.suCambio = fn => ascoltatori.push(fn);

LG.set = function(id){
  if(!LG.elenco.some(l=>l.id===id)) return false;
  LG.attiva = id;
  try{ localStorage.setItem(CHIAVE, id); }catch(e){}
  document.documentElement.lang = id;
  LG.applicaDati();
  applicaMarkup();
  for(const fn of ascoltatori){ try{ fn(id); }catch(e){ console.warn('[lingua]', e); } }
  return true;
};

function scelta(){
  try{
    const s = localStorage.getItem(CHIAVE);
    if(s && LG.elenco.some(l=>l.id===s)) return s;
  }catch(e){}
  /* Prima visita: si prova a indovinare dal browser, e nel dubbio
     italiano — è la lingua in cui il gioco è scritto, e in cui suona
     come deve. */
  const n = (navigator.language || 'it').toLowerCase();
  return n.startsWith('it') ? 'it' : 'en';
}

LG.init = function(){
  segnaMarkup();
  LG.set(scelta());
};

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', LG.init);
else LG.init();

})();
