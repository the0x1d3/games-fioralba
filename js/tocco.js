/* ===================================================================
   FIORALBA — tocco.js
   I comandi per chi gioca col pollice.

   Il gioco era già quasi pronto: la mira automatica c'è (calcolaBersaglio
   ripiega sulla casella davanti al personaggio quando il mouse non ha
   mai toccato niente), gli slot della barra sono cliccabili da sempre e
   i cinque tasti dell'HUD pure. Mancavano due cose, misurate su
   375×812: **non si poteva interagire** — il tocco sul canvas chiamava
   solo `usaOggetto()`, mai `interagisci()`, quindi porte, casse,
   macchinari e abitanti non esistevano — e i dialoghi non avanzavano,
   perché si avanza con Spazio/Invio/E e su un telefono quei tasti non
   ci sono. Con quei due buchi il gioco non si può finire.

   REGOLA DI QUESTO FILE: si emettono **tasti veri** su `window`, non si
   chiamano le funzioni di `game.js`. Quelle sono private al modulo, ma
   soprattutto il gestore di `keydown` sa già tutto quello che qui
   andrebbe rifatto a mano: se c'è un dialogo aperto Spazio lo fa
   avanzare, se c'è una finestra la chiude, se si sta pescando tiene la
   lenza, durante la lettera d'apertura non fa camminare nessuno, e a
   pesca in corso Escape abbandona. Rifare quella cascata qui vorrebbe
   dire tenerla allineata per sempre, e sbagliarla la prima volta che
   qualcuno aggiunge un caso.

   Da qui in poi il movimento a tocco è di questo file. In `game.js`
   c'erano tre gestori sul canvas che scrivevano dentro `tasti[]`: sono
   stati tolti, perché due padroni dello stesso vettore di direzioni si
   sarebbero pestati i piedi — uno alza `tasti['a']`, l'altro emette il
   `keyup` di 'a', e chi cammina dipende da chi arriva ultimo.
   =================================================================== */
(function(){
'use strict';

const TOC = {};
window.TOCCO = TOC;

const $ = s => document.querySelector(s);

/* ------------------------------------------------------------------
   CHI HA IL DITO

   Si guarda il dito, non la larghezza: una finestra stretta su un
   computer ha ancora il mouse, e mostrarle una levetta sarebbe una
   bugia. `(pointer:coarse) and (hover:none)` è la coppia che descrive
   «si tocca, e non c'è puntatore che passa sopra le cose». La larghezza
   resta come seconda prova per i tablet, che il dito ce l'hanno ma sono
   larghi come un portatile.

   `?tocco` forza l'accensione: serve per provare i comandi da computer
   senza dover prendere in mano un telefono, e senza che una prova finta
   diventi l'unica prova fatta.
   ------------------------------------------------------------------ */
let forzato = null;
try{ if(/[?&]tocco\b/.test(location.search)) forzato = true; }catch(e){}

TOC.daDito = function(){
  if(forzato !== null) return forzato;
  const grosso = window.matchMedia('(pointer:coarse) and (hover:none)').matches;
  const stretto = (navigator.maxTouchPoints||0) > 0
               && window.matchMedia('(max-width:820px)').matches;
  return grosso || stretto;
};
/* per le prove: TOCCO.forza(true) accende i comandi anche col mouse */
TOC.forza = function(v){ forzato = v; TOC.aggiorna(); };

/* ------------------------------------------------------------------
   I TASTI SINTETICI

   `premuti` non è una raffinatezza: senza, un dito appoggiato sul tasto
   «Parla» emetterebbe un `keydown` per ogni `touchmove` — e `keydown`
   di 'e' chiama `interagisci()`, cioè si aprirebbe e richiuderebbe la
   stessa porta dieci volte al secondo. Serve anche al contrario: se un
   dito esce dal tasto senza staccarsi, il `keyup` va emesso lo stesso,
   o si resta a camminare da soli.
   ------------------------------------------------------------------ */
const premuti = new Set();

function giu(k){
  if(premuti.has(k)) return;
  premuti.add(k);
  window.dispatchEvent(new KeyboardEvent('keydown', { key:k, bubbles:true }));
}
function su(k){
  if(!premuti.has(k)) return;
  premuti.delete(k);
  window.dispatchEvent(new KeyboardEvent('keyup', { key:k, bubbles:true }));
}
function mollaTutto(){ for(const k of [...premuti]) su(k); }
TOC.mollaTutto = mollaTutto;

/* ------------------------------------------------------------------
   IL PAD CHE COMPARE SOTTO IL POLLICE

   Non è fisso in un angolo: nasce dove appoggi il dito. Su uno schermo
   alto un pollice non torna due volte nello stesso punto, e una levetta
   ferma costringe a guardarla invece di guardare il gioco. Quello che
   si vede è solo il ritorno visivo: senza, il trascinamento c'era già
   ma nessuno poteva sapere che c'era.
   ------------------------------------------------------------------ */
const RAGGIO = 44;   // a questa distanza dal centro si va alla massima spinta
const MORTO  = 10;   // sotto questa non ci si muove: un pollice appoggiato trema
const SOGLIA = 0.42; // quanto di un asse serve perché quella direzione conti

let dito = null;     // { id, x0, y0 }
let pad, perno;

function mostraPad(x, y){
  if(!pad) return;
  pad.style.left = x + 'px';
  pad.style.top  = y + 'px';
  pad.classList.add('vivo');
  muoviPerno(0, 0);
}
function muoviPerno(dx, dy){
  if(!perno) return;
  const d = Math.hypot(dx, dy);
  const f = d > RAGGIO ? RAGGIO / d : 1;
  perno.style.transform = 'translate(-50%,-50%) translate(' +
    Math.round(dx*f) + 'px,' + Math.round(dy*f) + 'px)';
}
function nascondiPad(){
  if(pad) pad.classList.remove('vivo');
}

/* dal vettore del pollice alle quattro direzioni, diagonali comprese:
   ogni asse decide per conto suo, così 'w'+'d' vale nord-est */
function direzioni(dx, dy){
  const d = Math.hypot(dx, dy);
  if(d < MORTO) return { w:false, a:false, s:false, d:false };
  const nx = dx/d, ny = dy/d;
  return { a: nx < -SOGLIA, d: nx > SOGLIA, w: ny < -SOGLIA, s: ny > SOGLIA };
}
let dirOra = { w:false, a:false, s:false, d:false };
function applica(nuove){
  for(const k of ['w','a','s','d']){
    if(nuove[k] && !dirOra[k]) giu(k);
    else if(!nuove[k] && dirOra[k]) su(k);
  }
  dirOra = nuove;
}

/* ------------------------------------------------------------------
   I GESTORI

   La zona del pad è la parte SINISTRA dello schermo, e si ferma prima
   dei tasti: 62% è stato scelto guardando dove finiscono i due bottoni
   in basso a destra più il loro margine. Sopra ci sono le finestre e i
   tasti dell'HUD, che hanno i loro gestori e non devono far comparire
   un pad sotto le dita.
   ------------------------------------------------------------------ */
function zonaDelPad(t){
  if(t.clientX > window.innerWidth * 0.62) return false;
  /* Se sotto il dito c'è un pulsante o una finestra, il pad non c'entra:
     `elementFromPoint` dice chi sta DAVVERO sopra, che è l'unica domanda
     che conta quando le cose si sovrappongono. */
  const e = document.elementFromPoint(t.clientX, t.clientY);
  return !e || e.id === 'game' || e.id === 'tocco' || e.id === 'app';
}

function inizio(e){
  if(!attivo) return;
  if(dito !== null) return;
  for(const t of e.changedTouches){
    if(!zonaDelPad(t)) continue;
    dito = { id:t.identifier, x0:t.clientX, y0:t.clientY };
    mostraPad(t.clientX, t.clientY);
    break;
  }
}
function trascina(e){
  if(!dito) return;
  for(const t of e.changedTouches){
    if(t.identifier !== dito.id) continue;
    const dx = t.clientX - dito.x0, dy = t.clientY - dito.y0;
    muoviPerno(dx, dy);
    applica(direzioni(dx, dy));
    break;
  }
}
function fine(e){
  if(!dito) return;
  for(const t of e.changedTouches){
    if(t.identifier !== dito.id) continue;
    dito = null;
    nascondiPad();
    applica({ w:false, a:false, s:false, d:false });
    break;
  }
}

/* Un tasto a schermo: preme al `touchstart` e molla al `touchend`, non
   al `click`. La pesca vuole il tenere premuto (Spazio giù = tira,
   Spazio su = molla), e `click` arriva solo alla fine — con quello la
   barra della pesca non si sarebbe mai mossa. */
function collegaTasto(el, k){
  if(!el) return;
  const parti = e => { e.preventDefault(); el.classList.add('giu'); giu(k); };
  const smetti = e => { if(e) e.preventDefault(); el.classList.remove('giu'); su(k); };
  el.addEventListener('touchstart', parti,  { passive:false });
  el.addEventListener('touchend',   smetti, { passive:false });
  el.addEventListener('touchcancel',smetti, { passive:false });
  /* col mouse (prove da computer, e chi ha lo schermo touch sul portatile) */
  el.addEventListener('mousedown', e=>{ e.preventDefault(); el.classList.add('giu'); giu(k); });
  window.addEventListener('mouseup', ()=>{ if(premuti.has(k)){ el.classList.remove('giu'); su(k); } });
}

/* ------------------------------------------------------------------
   ACCENSIONE
   ------------------------------------------------------------------ */
let attivo = false;
let collegato = false;

TOC.aggiorna = function(){
  const zona = $('#tocco');
  if(!zona) return;
  attivo = TOC.daDito();
  zona.classList.toggle('hidden', !attivo);
  document.documentElement.classList.toggle('col-dito', attivo);
  if(!attivo){ mollaTutto(); nascondiPad(); dito = null; }
};

TOC.init = function(){
  const zona = $('#tocco');
  if(!zona || collegato) return;
  collegato = true;
  pad   = $('#tocco-pad');
  perno = pad ? pad.querySelector('.tp-perno') : null;

  collegaTasto($('#tocco-usa'),   ' ');
  collegaTasto($('#tocco-parla'), 'e');

  /* `passive:false` sul movimento: senza `preventDefault` il trascinamento
     diventa lo scorrimento della pagina, e su Android anche il «tira per
     aggiornare» — cioè si ricarica il gioco camminando verso l'alto. */
  window.addEventListener('touchstart', inizio,  { passive:true });
  window.addEventListener('touchmove',  e=>{ if(dito){ e.preventDefault(); trascina(e); } }, { passive:false });
  window.addEventListener('touchend',   fine,    { passive:true });
  window.addEventListener('touchcancel',fine,    { passive:true });

  /* Un dito che esce dalla finestra, una telefonata in arrivo, la scheda
     che passa in secondo piano: il `touchend` non arriva e si resta a
     camminare contro un muro fino al prossimo tocco. */
  window.addEventListener('blur', ()=>{ mollaTutto(); nascondiPad(); dito = null; });
  document.addEventListener('visibilitychange', ()=>{
    if(document.hidden){ mollaTutto(); nascondiPad(); dito = null; }
  });

  window.addEventListener('resize', TOC.aggiorna);
  TOC.aggiorna();
};

})();
