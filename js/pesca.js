/* ===================================================================
   FIORALBA — pesca.js
   Il minigioco intero: lancio, attesa, abboccata, lotta, e la scelta di
   che pesce abbocca. I numeri sono tarati per simulazione — la storia
   sta nel commento qui sotto, che vale più di questa intestazione.

   Era in game.js. Di tutto il resto del gioco gli servono tre funzioni,
   che sono rimaste di là e passano da G: `spendi`, `schizzo`,
   `particelleTesto`. Niente altro: il minigioco è una scatola chiusa
   che vive tra un lancio e un pesce.
   =================================================================== */
(function(){

const T = 32;
const $ = s=>document.querySelector(s);

/* Il nome del pesce dentro alla frase, non incollato davanti: `UI.toast`
   traduce quello che riceve, e riceveva «Hai preso: Trout!» già montato
   — chiave che nel catalogo non c'è, quindi in inglese si leggeva il
   nome tradotto dentro a una frase italiana. Come `fraseF` in game.js,
   e anche qui `T` è la misura della casella. */
function fraseF(modello, ...pezzi){
  return window.LINGUA ? LINGUA.f(modello, ...pezzi)
                       : modello.replace(/\{(\d+)\}/g, (_,i)=>pezzi[i]);
}

const P = {};
window.PESCA = P;

/* I numeri della pesca, tutti qui.

   Com'era: il pesce si muoveva a scatti casuali, la barra rimbalzava
   oltre dove la volevi, e per fare punti bisognava contenere il pesce
   *tutto intero* dentro la barra — cioè la finestra buona era la metà
   di quella disegnata. Tre cose che insieme rendevano la pesca una
   lotteria, e infatti si perdeva quasi sempre.

   I numeri sotto non sono a occhio: ho simulato un pilota automatico
   che tiene premuto quando il pesce è sopra la barra, con un ritardo di
   reazione umano, e ho cercato la combinazione che dà questi risultati
   (300 partite per casella):

                        prima          dopo
     attento, facile      0%      →     92%
     attento, medio       2%      →     79%
     attento, difficile   6%      →     64%
     medio,   medio       2%      →     64%
     livello 5, medio    93%      →     93%

   Prima un giocatore normale non prendeva praticamente niente: non era
   difficile, era rotto. Adesso i pesci facili si prendono quasi sempre,
   quelli difficili un po' più di una volta su due, e salire di livello
   in Pesca si sente. E una lotta dura quattro secondi e mezzo invece di
   finire in mezzo secondo: il tempo di accorgersi che c'è una lotta. */
const PISTA = 330;        // altezza della pista, in pixel (vale il CSS)
const PESCE = 42;         // e del pesce
const ALTEZZA_BARRA = 104;// barra al livello zero (era 82)
const MARGINE = 8;        // quanto si perdona ai bordi
const SPINTA = 0.30;      // quanto tira su tenendo premuto (era 0.42)
const GRAVITA = 0.24;     // e quanto scende lasciando (era 0.36)
const ATTRITO = 0.87;     // più attrito = meno rimbalzo (era 0.90)
const GUADAGNO = 0.026;   // punti al millisecondo quando è agganciato
const PERDITA = 0.034;    // e quando lo perdi (era 0.06)
const PROG_INIZIALE = 40; // (era 32)
const FINESTRA_ABBOCCO = 2200;  // tempo per reagire all'abboccata (era 1400)

const pesca = { attiva:false, fase:'', t:0, barra:50, vBarra:0, pesceY:50, vPesce:0,
                metaPesce:120, tPesce:0,
                prog:30, target:null, tx:0, ty:0, diff:2, tenuto:false };

/* i nodi del minigioco non cambiano mai: cercarli a ogni frame era inutile */
let pescaEls = null;
function elementiPesca(){
  if(!pescaEls){
    const el = $('#fishing');
    pescaEls = { root:el,
                 barra:  el.querySelector('.fish-bar'),
                 pesce:  el.querySelector('.fish-target'),
                 icona:  el.querySelector('.fish-icon'),
                 prog:   el.querySelector('.fish-prog') };
  }
  return pescaEls;
}

function iniziaPesca(tx,ty){
  if(G.gelo){ UI.toast('L\'acqua è gelata: niente pesca oggi.','bad'); return; }
  if(!G.spendi(3)) return;
  /* La prima volta si spiega, poi si pesca. Le tre fasi — aspetta,
     reagisci, tieni agganciato — non si indovinano guardando: chi non
     le conosce lascia scappare la prima abboccata senza capire che ci
     fosse qualcosa da fare. */
  if(!G.vistoPesca){
    G.vistoPesca = true;
    UI.spiegaPesca(()=>lanciaLenza(tx,ty));
    return;
  }
  lanciaLenza(tx,ty);
}

function lanciaLenza(tx,ty){
  pesca.attiva=true; pesca.fase='lancio'; pesca.t=0;
  pesca.tx=tx; pesca.ty=ty;
  G.p.usoT=400;
  SND.play('lancio');
  G.schizzo(tx,ty);
  elementiPesca().root.classList.add('hidden');
}

function scegliPesce(){
  const st=G.stagione().id;
  const notte = G.ora>1020 || G.ora<400;
  const m=G.mappa();
  const luogo = (G.mappaId==='fioralba') ? 'fiume' : (G.mappaId==='spiaggia' ? 'mare' : 'lago');
  /* DAL MOLO si prende altro. Il molo è la striscia di assi che entra in
     mare: chi ci sta sopra ha l'acqua alta sotto i piedi, e i pesci
     d'altura abboccano solo lì. Prima da riva e dal molo venivano su
     esattamente gli stessi quattro pesci, quindi il molo era una
     passerella senza una ragione — bella e inutile.

     Non è un luogo a sé ma un di più: dal molo si prende tutto quello
     che si prende da riva, e in più il pesce profondo. Fosse un luogo a
     parte, salire sul molo avrebbe *tolto* il branzino, che sarebbe
     assurdo. */
  const dalMolo = luogo==='mare' &&
    WORLD.terreno(m, (G.p.px/32)|0, (G.p.py/32)|0) === 'assi';
  // durante la storia del Pesce Luna, di notte al lago abbocca più spesso
  const TL = G.trame && G.trame.pesceluna;
  if(TL && TL.avviata && !TL.preso && luogo==='lago' && notte &&
     DATA.ITEMS.pesce_luna.stagioni.indexOf(st)>=0 && Math.random()<0.45){
    return 'pesce_luna';
  }
  let pool = Object.keys(DATA.ITEMS).filter(k=>{
    const I=DATA.ITEMS[k];
    if(I.cat!=='pesce') return false;
    if(I.spazzatura) return false;
    if(I.stagioni && I.stagioni.indexOf(st)<0) return false;
    if(I.luogo && I.luogo!==luogo) return false;
    if(I.profondo && !dalMolo) return false;
    if(I.notte && !notte) return false;
    if(I.raro && Math.random()>0.12) return false;
    return true;
  });
  if(!pool.length) pool=['carpa'];
  if(Math.random() < 0.14 - G.livello('pesca')*DATA.BONUS.pesca.spazzatura){
    return ['scarpa_vecchia','alga','lattina'][(Math.random()*3)|0];
  }
  return pool[(Math.random()*pool.length)|0];
}

function aggiornaPesca(dt){
  pesca.t += dt;

  if(pesca.fase==='lancio'){
    if(pesca.t>600){ pesca.fase='attesa'; pesca.t=0; pesca.attesa=900+Math.random()*4200; }
    return;
  }
  if(pesca.fase==='attesa'){
    if(pesca.t>pesca.attesa){
      pesca.fase='abbocca'; pesca.t=0;
      SND.play('abbocca');
      UI.prompt('Abbocca! Premi <kbd>Spazio</kbd>');
      G.particelle.push({t:'splash', x:pesca.tx*T+16, y:pesca.ty*T+16, vx:0,vy:0,g:0, vita:600, vitaMax:600});
    }
    return;
  }
  if(pesca.fase==='abbocca'){
    if(pesca.t>FINESTRA_ABBOCCO){ finePesca(false,'Se n\'è andato.'); }
    return;
  }
  if(pesca.fase==='gioco'){
    const lvl = G.livello('pesca');
    const altezzaBarra = ALTEZZA_BARRA + lvl*DATA.BONUS.pesca.barra;
    const corsaBarra = PISTA - altezzaBarra;     // quanto può scorrere la barra
    const corsaPesce = PISTA - PESCE;            // il pesce è più piccolo: corre di più

    /* IL PESCE. Prima era una passeggiata aleatoria — a ogni fotogramma
       una spinta a caso — e usciva un tremolio che non si può seguire
       perché non ha intenzioni: quando lo prendevi era per fortuna. Ora
       sceglie un punto e ci va, con un avvicinamento morbido che non
       supera mai la meta. Si può stare dietro a un pesce che *va da
       qualche parte*; la difficoltà cambia quanto spesso cambia idea e
       quanto è svelto ad arrivarci, non quanto trema. */
    pesca.tPesce -= dt;
    if(pesca.tPesce <= 0){
      pesca.metaPesce = Math.random()*corsaPesce;
      pesca.tPesce = 1200 - pesca.diff*110 + Math.random()*600;
      if(Math.random() < 0.20) pesca.tPesce += 500;      // ogni tanto si ferma a pensare
    }
    const passo = (0.0022 + pesca.diff*0.0011) * dt;
    pesca.pesceY += (pesca.metaPesce - pesca.pesceY) * Math.min(1, passo);

    /* LA BARRA. Stessa idea di prima — si sale tenendo premuto, si scende
       lasciando — ma con più attrito e meno spinta: prima rimbalzava
       oltre il punto in cui la volevi e si passava il tempo a inseguire
       i propri errori. */
    pesca.vBarra += pesca.tenuto ? -SPINTA : GRAVITA;
    pesca.vBarra *= ATTRITO;
    pesca.barra += pesca.vBarra;
    if(pesca.barra<0){ pesca.barra=0; pesca.vBarra=0; }
    if(pesca.barra>corsaBarra){ pesca.barra=corsaBarra; pesca.vBarra=0; }

    /* Conta il CENTRO del pesce dentro la barra, non il pesce tutto
       intero: prima bisognava contenerlo per intero e la finestra buona
       era la metà di quella che si vedeva — si mirava a una cosa e ne
       valeva un'altra. */
    const centro = pesca.pesceY + PESCE/2;
    const dentro = centro >= pesca.barra - MARGINE &&
                   centro <= pesca.barra + altezzaBarra + MARGINE;

    pesca.prog += dentro ? GUADAGNO*dt*(1+lvl*DATA.BONUS.pesca.guadagno) : -PERDITA*dt;
    pesca.prog = Math.max(0, Math.min(100, pesca.prog));

    // DOM
    const E = elementiPesca();
    E.barra.style.height = altezzaBarra+'px';
    E.barra.style.top = pesca.barra+'px';
    E.barra.style.borderColor = dentro? 'rgba(190,240,160,.95)':'rgba(230,180,140,.7)';
    E.pesce.style.top = pesca.pesceY+'px';
    E.icona.style.top = (pesca.pesceY+11)+'px';
    E.prog.style.height = pesca.prog+'%';

    if(pesca.prog>=100) finePesca(true);
    else if(pesca.prog<=0) finePesca(false,'Ti è scappato.');
  }
}

function iniziaLotta(){
  const id = scegliPesce();
  pesca.target = id;
  pesca.diff = DATA.ITEMS[id].diff || 2;
  pesca.fase='gioco'; pesca.t=0;
  pesca.barra=120; pesca.vBarra=0;
  // il pesce comincia dentro la barra: il primo mezzo secondo è tuo
  pesca.pesceY=140; pesca.vPesce=0;
  pesca.metaPesce=140; pesca.tPesce=600;
  pesca.prog=PROG_INIZIALE;
  UI.prompt(null);
  const E = elementiPesca();
  E.root.classList.remove('hidden');
  E.icona.textContent = DATA.ITEMS[id].spazzatura ? '🥾' : '🐟';
  E.icona.style.left = '22px';
}

function finePesca(ok, msg){
  elementiPesca().root.classList.add('hidden');
  UI.prompt(null);
  const id=pesca.target;
  pesca.attiva=false; pesca.fase=''; pesca.target=null; pesca.tenuto=false;

  if(ok && id){
    const I=DATA.ITEMS[id];
    if(G.aggiungi(id,1)){
      SND.play('pesceOk');
      UI.toast(fraseF('Hai preso: {0}!', I.nome), I.spazzatura?'':'gold', id);
      if(!I.spazzatura){
        G.xp('pesca', 12 + (I.diff||1)*6);
        G.stats.pesci++;
        G.particelleTesto(G.p.px, G.p.py-46, I.nome, '#9fd8ee');
      }
      if(id==='pesce_luna' && G.trame && G.trame.pesceluna.avviata && !G.trame.pesceluna.preso){
        G.trame.pesceluna.preso = true;
        setTimeout(()=>UI.toast('Il Pesce Luna! Corri a mostrarlo a Elio.','gold','pesce_luna'), 600);
      }
    } else UI.toast('Zaino pieno!','bad');
  } else {
    SND.play('pesceKo');
    if(msg) UI.toast(msg,'bad');
  }
}

P.avvia      = iniziaPesca;
P.aggiorna   = aggiornaPesca;
P.inCorso    = ()=> pesca.attiva;
P.rilasciato = ()=>{ pesca.tenuto = false; };
/* Esposta apposta, e non per il gioco: è l'unico modo di verificare che
   un posto dia i pesci che deve dare. Provarlo dal percorso vero
   vorrebbe dire giocare il minigioco qualche centinaio di volte, e la
   domanda «dal molo abbocca la cernia e da riva no?» si risponde
   tirando il dado mille volte in un secondo. */
P.scegliPesce = scegliPesce;
P.abbandona  = ()=> finePesca(false, 'Hai mollato la lenza.');

/* Queste due righe stavano copiate tre volte in game.js — tastiera, mouse
   e tocco — e ogni volta che la pesca cambiava fase bisognava ricordarsi
   di tutte e tre. Adesso chi riceve il tocco dice solo "è stato premuto",
   e cosa voglia dire lo decide qui chi conosce le fasi. */
P.premuto = function(){
  if(pesca.fase==='abbocca') iniziaLotta();
  else if(pesca.fase==='gioco') pesca.tenuto = true;
};

})();
