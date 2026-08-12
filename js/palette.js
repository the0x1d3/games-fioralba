/* ===================================================================
   FIORALBA — palette.js
   I colori della valle, in un posto solo.

   Il problema non era che i colori fossero sparsi: era che erano 724,
   e 561 di quei 724 avevano un gemello a meno di 12 punti su 255. Ogni
   oggetto si era inventato il suo marrone. Tutti insieme facevano una
   cosa sola — marrone — perché nessuno di quei marroni era in rapporto
   con gli altri, e per la stessa ragione mancavano sia un nero che
   ancorasse l'immagine sia una luce pulita in cima: nessuno aveva
   motivo di arrivarci.

   Adesso la verità sono le RAMPE. Ogni materiale ha cinque gradini, e
   i gradini non sono lo stesso colore schiarito e scurito: l'ombra
   vira verso un unico blu-viola e l'alta luce verso un unico giallo
   caldo, gli stessi per tutti. È il vecchio trucco dello spostamento
   di tinta, ed è quello che fa sembrare un'immagine dipinta invece che
   calcolata — un'ombra fredda accanto a una luce calda apre la gamma
   senza bisogno di allargare il contrasto.

   Chi disegna non deve saperlo. `P.vincola()` mette un filtro sui
   contesti canvas: qualunque colore pieno passi da `fillStyle` o
   `strokeStyle` viene agganciato al gradino più vicino. Le migliaia di
   esadecimali sparsi nei sorgenti restano lì e restano leggibili, ma
   diventano *intenzioni* — "un marrone caldo di mezzo" — e la palette
   decide quale marrone caldo di mezzo esiste davvero in questo gioco.
   I colori con trasparenza (`rgba(...)`) passano intatti: quelli non
   sono materia, sono luce, e vanno lasciati continui.

   Per provare una variazione, dalla console:

       PAL.applica({ RAMPE:{ ombra:'#1d2033' } })   // tutte le ombre
       PAL.applica({ sabbia:{ base:'#d8bf88' } })   // un colore solo

   Le cache grafiche si svuotano da sole e il gioco si ridisegna con la
   tinta nuova, senza ricaricare la pagina.
   =================================================================== */
(function(){
'use strict';

const P = {};
window.PAL = P;

/* ------------------------------------------------------------------
   ARITMETICA DEI COLORI
   Duplicata da art.js di proposito: la palette non può dipendere da
   chi disegna, perché viene caricata prima.
   ------------------------------------------------------------------ */
function num(h){ return parseInt(String(h).slice(1),16); }
function esa(r,g,b){
  return '#'+((1<<24)+((r|0)<<16)+((g|0)<<8)+(b|0)).toString(16).slice(1);
}
/* Le rampe si costruiscono in HSL e non in RGB. Schiarire in RGB vuol
   dire avvicinarsi al bianco, cioè spegnere il colore: la prima
   versione di queste rampe faceva diventare rosa la brace del camino e
   grigio il muschio. In HSL si può alzare il valore *tenendo* la
   saturazione, che è quello che serve. */
function aHsl(hex){
  const n=num(hex);
  const r=((n>>16)&255)/255, g=((n>>8)&255)/255, b=(n&255)/255;
  const mx=Math.max(r,g,b), mn=Math.min(r,g,b), l=(mx+mn)/2;
  if(mx===mn) return [0,0,l];
  const d=mx-mn;
  const s = l>0.5 ? d/(2-mx-mn) : d/(mx+mn);
  let h = mx===r ? (g-b)/d+(g<b?6:0) : mx===g ? (b-r)/d+2 : (r-g)/d+4;
  return [h*60, s, l];
}
function daHsl(h, s, l){
  h=((h%360)+360)%360; s=Math.max(0,Math.min(1,s)); l=Math.max(0,Math.min(1,l));
  if(s===0){ const v=l*255; return esa(v,v,v); }
  const q = l<0.5 ? l*(1+s) : l+s-l*s, p = 2*l-q;
  const f = t=>{
    t=((t%1)+1)%1;
    if(t<1/6) return p+(q-p)*6*t;
    if(t<1/2) return q;
    if(t<2/3) return p+(q-p)*(2/3-t)*6;
    return p;
  };
  return esa(f(h/360+1/3)*255, f(h/360)*255, f(h/360-1/3)*255);
}
/* ruota `h` verso `verso` di al massimo `gradi`, per la via più corta */
function ruota(h, verso, gradi){
  let d = ((verso-h)%360+540)%360-180;
  return h + Math.sign(d)*Math.min(Math.abs(d), gradi);
}

/* ------------------------------------------------------------------
   LE RAMPE
   Cinque gradini per materiale: ombra profonda, ombra, corpo, luce,
   alta luce. `giu` e `su` dicono quanto è ampia la rampa; i due poli
   sono gli stessi per tutti, ed è quello che tiene insieme l'immagine.
   ------------------------------------------------------------------ */
P.RAMPE = {
  versoOmbra: 262,    // la tinta in cui vira ogni ombra: un blu-viola
  versoLuce:   45,    // la tinta in cui vira ogni alta luce: un giallo
  giroOmbra:   26,    // di quanti gradi al massimo, per non snaturare
  giroLuce:    20,    // il materiale (un metallo non deve virare verde)
  /* base, quanto scende, quanto sale */
  basi: {
    pietra:    ['#8d8477', 0.62, 0.58],
    metallo:   ['#6f7684', 0.64, 0.62],
    legno:     ['#8a5c34', 0.64, 0.60],
    terra:     ['#8a6647', 0.62, 0.58],
    sabbia:    ['#dcc691', 0.60, 0.62],
    neve:      ['#dde7ef', 0.58, 0.60],
    verde:     ['#4e7f3e', 0.62, 0.62],
    /* il verde tenero: germogli, foglie nuove, e il numerino che salta
       su quando raccogli. Senza, finiva sul verde d'erba e il segnale
       "hai preso qualcosa" si spegneva dentro il prato */
    lime:      ['#8fc45a', 0.64, 0.60],
    oliva:     ['#7d8f4a', 0.62, 0.58],   // muschio, grano, foglie che girano
    pino:      ['#2f6b45', 0.60, 0.64],
    /* fra il verde del pino e l'azzurro dell'acqua c'era un vuoto di
       sessanta gradi, e ci cascava dentro roba che si nota: la maglia
       di Elio finiva verde bosco e il personaggio perdeva la faccia */
    verdeacqua:['#5aa08c', 0.62, 0.60],
    acqua:     ['#3f8ab0', 0.62, 0.60],
    blu:       ['#3f5f8c', 0.64, 0.62],
    rosso:     ['#b8402f', 0.64, 0.58],
    arancio:   ['#d8792c', 0.62, 0.58],
    giallo:    ['#e4bc4a', 0.60, 0.56],
    viola:     ['#6d4a86', 0.64, 0.62],
    rosa:      ['#d4788f', 0.60, 0.58],
    pelle:     ['#d9a077', 0.60, 0.56],
    pelleScura:['#8a5a3e', 0.62, 0.58]
  },
  /* Due rampe scritte a mano, perché non sono materiali.
     La neutra ha bisogno di un nero vero in fondo — quello che ancora
     l'immagine e che prima non esisteva — e di un bianco vero in cima:
     né l'uno né l'altro possono uscire da una rotazione di tinta,
     perché non hanno tinta.
     Il fuoco non è materia illuminata, è la sorgente: brace, forgia,
     lume, lanterna. Sulla scala del legno finiva spento — la brace del
     camino diventava color pelle — perché quella scala è fatta per
     roba che *riceve* luce. Questa sale fino al giallo del lume senza
     mai perdere saturazione. */
  neutro: ['#0e0c14','#241f2e','#4a4453','#8d8797','#d9d5df','#ffffff'],
  fuoco:  ['#5c1206','#a32f08','#d85510','#ff8a1e','#ffb54a','#ffd97a','#ffeeb4']
};

/* I gradini di un materiale. L'ombra scende di valore e ruota verso il
   blu-viola, l'alta luce sale e ruota verso il giallo: è lo spostamento
   di tinta, e due tinte diverse ai due capi allargano la gamma più di
   quanto farebbe allargare il solo contrasto.

   La saturazione fa una gobba: cresce appena nella penombra e cala ai
   due estremi. Senza la discesa, l'ombra profonda della neve veniva un
   blu elettrico e quella della sabbia un arancio bruciato — il colore
   puro non regge in fondo alla scala, va lasciato al centro.

   Otto gradini e non cinque. Con cinque restava un buco in mezzo ai
   marroni — le assi del pavimento finivano sul giallo, che era l'unica
   cosa vicina — e sopra il corpo i salti erano troppo larghi: la chioma
   di primavera e il prato cadevano sullo stesso verde e il cespuglio
   spariva nell'erba. Il lato in luce è più fitto di quello in ombra
   perché lì cade quasi tutto il disegno: al buio i dettagli non si
   vedono comunque. */
const GRADINI = [
  /* quota,  saturazione,  quanto ruota (−ombra, +luce) */
  [-1.00, 0.72, -1.00],   // 0 ombra profonda
  [-0.62, 0.95, -0.62],   // 1 ombra
  [-0.28, 1.05, -0.26],   // 2 penombra
  [ 0.00, 1.00,  0.00],   // 3 corpo
  [ 0.22, 1.03,  0.22],   // 4 primo chiaro
  [ 0.45, 1.00,  0.45],   // 5 luce
  [ 0.70, 0.90,  0.70],   // 6 luce alta
  [ 1.00, 0.78,  1.00]    // 7 lampo
];
function costruisciRampa(base, giu, su){
  const R = P.RAMPE;
  const [h, s, l] = aHsl(base);
  return GRADINI.map(([q, sat, gir]) => {
    if(q === 0) return base;
    const nl = q < 0 ? l*(1 + q*giu) : l + (1-l)*q*su;
    const verso = gir < 0 ? R.versoOmbra : R.versoLuce;
    const giro  = (gir < 0 ? R.giroOmbra : R.giroLuce) * Math.abs(gir);
    return daHsl(ruota(h, verso, giro), s*sat, nl);
  });
}

/* P.r.legno[4] = la luce del legno. Ricostruita a ogni ritocco. */
P.r = {};
let tavolozza = [];              // tutti i gradini, per l'aggancio
function costruisciTavolozza(){
  P.r = { neutro: P.RAMPE.neutro.slice(), fuoco: P.RAMPE.fuoco.slice() };
  for(const nome in P.RAMPE.basi){
    const [base, giu, su] = P.RAMPE.basi[nome];
    P.r[nome] = costruisciRampa(base, giu, su);
  }
  tavolozza = [];
  const visti = new Set();
  for(const nome in P.r) for(const c of P.r[nome]){
    if(visti.has(c)) continue;
    visti.add(c);
    const n = num(c);
    const [L,A,B] = opponenti((n>>16)&255, (n>>8)&255, n&255);
    tavolozza.push({ c, L, A, B });
  }
}
costruisciTavolozza();

/* ------------------------------------------------------------------
   L'AGGANCIO
   Il gradino più vicino — ma "vicino" in che senso.

   Pesare i tre canali per la luminanza (il verde conta più di tutto,
   il blu quasi niente) è la ricetta standard, e qui sbagliava: due
   bianchi con lo stesso verde risultavano identici anche se uno era
   panna e l'altro ghiaccio, e le tende del mercato perdevano il caldo.
   Ai valori alti tutte le distanze in RGB sono piccole e la scelta
   diventa un sorteggio; quello che si vede, lì, è se una tinta è calda
   o fredda.

   Quindi si confronta su tre assi che assomigliano a come guardiamo:
   quanto è chiaro, quanto pende verso il rosso o il verde, quanto
   verso il giallo o il blu. E i due assi della tinta pesano più della
   chiarezza, perché uno spostamento di valore non si nota e uno di
   famiglia sì.
   ------------------------------------------------------------------ */
function opponenti(r, g, b){
  return [ 0.299*r + 0.587*g + 0.114*b,   // chiaro/scuro
           r - g,                          // rosso/verde
           g - b ];                        // giallo/blu
}
const PESO_TINTA = 2.2;
/* Quanto valore si può barattare per un po' di tinta: niente.
   Nel disegno il valore è struttura — è quello che fa leggere le forme —
   mentre la tinta è identità. Sbagliare identità è brutto; sbagliare
   struttura rende il disegno illeggibile, e non è un cambio alla pari.
   Senza questo tetto i capelli prugna di Serafina, che sono spenti,
   finivano su un prugna acceso di quaranta punti più scuro: la tinta
   giusta su una testa che non si vedeva più. */
const TETTO_VALORE = 28;
const memoria = new Map();
P.snap = function(hex){
  const k = String(hex).toLowerCase();
  const gia = memoria.get(k);
  if(gia !== undefined) return gia;
  let s = k;
  if(/^#[0-9a-f]{3}$/.test(k)) s = '#'+k[1]+k[1]+k[2]+k[2]+k[3]+k[3];
  else if(!/^#[0-9a-f]{6}$/.test(k)){ memoria.set(k, hex); return hex; }
  const n = num(s);
  const [L, A, B] = opponenti((n>>16)&255, (n>>8)&255, n&255);
  let best = null, bd = Infinity;          // fra quelli che stanno nel tetto
  let ripiego = tavolozza[0].c, rd = Infinity;   // se non ci sta nessuno
  for(const t of tavolozza){
    const dL=L-t.L, dA=A-t.A, dB=B-t.B;
    const d = dL*dL + PESO_TINTA*(dA*dA + dB*dB);
    if(d < rd){ rd = d; ripiego = t.c; }
    if(dL > TETTO_VALORE || dL < -TETTO_VALORE) continue;
    if(d < bd){ bd = d; best = t.c; }
  }
  const scelto = best || ripiego;
  memoria.set(k, scelto);
  return scelto;
};

/* Sposta un colore di `passi` gradini sulla sua rampa (negativo verso
   l'ombra, positivo verso la luce). È il modo giusto di schiarire e
   scurire, adesso: schiarire "del 16%" dà un colore qualunque, che
   agganciandosi può cadere sullo stesso gradino da cui è partito — e
   quando succede la forma sparisce. Il cespuglio di primavera era
   diventato una macchia piatta esattamente per questo. */
P.passo = function(hex, passi){
  const c = P.snap(hex);
  for(const nome in P.r){
    const r = P.r[nome], i = r.indexOf(c);
    if(i < 0) continue;
    return r[Math.max(0, Math.min(r.length-1, i + (passi|0)))];
  }
  return c;
};

/* ------------------------------------------------------------------
   IL FILTRO SUI CONTESTI
   Si mette una volta sola sul prototipo: così vale per ogni canvas che
   il gioco crea — i tasselli, i personaggi, i ritratti dell'interfaccia,
   le scene delle dimostrazioni — senza che nessuno di quei posti debba
   ricordarsi di chiedere il permesso alla palette.
   ------------------------------------------------------------------ */
let vincolato = false;
P.vincola = function(){
  if(vincolato || typeof CanvasRenderingContext2D === 'undefined') return false;
  const proto = CanvasRenderingContext2D.prototype;
  for(const prop of ['fillStyle','strokeStyle']){
    const d = Object.getOwnPropertyDescriptor(proto, prop);
    if(!d || !d.set) continue;
    Object.defineProperty(proto, prop, {
      configurable:true, enumerable:d.enumerable,
      get: d.get,
      // solo le stringhe piene: i gradienti sono oggetti e la
      // trasparenza è luce, non materia
      set(v){ d.set.call(this, typeof v==='string' && v.charCodeAt(0)===35 ? P.snap(v) : v); }
    });
  }
  vincolato = true;
  return true;
};
P.vincola();

/* ------------------------------------------------------------------
   I COLORI
   ------------------------------------------------------------------ */
/* Scritti a mano, gradino per gradino, e non agganciati in automatico.
   L'aggancio sa trovare il colore più vicino ma non sa cosa serve a
   cosa: mandava le assi e la loro alternanza sullo stesso gradino —
   e il pavimento perdeva la fuga fra un'asse e l'altra — appaiava il
   pino d'estate e quello d'inverno, e faceva del frutto una fiamma.
   Qui la vicinanza conta meno del mestiere: quello che nel disegno
   doveva essere diverso resta diverso. */
function colori(){
const R = P.r;
return {
  /* --- terreni --- */
  terra: {
    base:R.terra[3], chiaro:R.terra[4], medio:R.terra[2], scuro:R.terra[1],
    zolla:R.terra[1], zollaLuce:R.terra[4]
  },
  arato: {
    asciutto:{ base:R.terra[3], cresta:R.terra[5], scuro:R.terra[2] },
    bagnato: { base:R.terra[1], cresta:R.terra[2], scuro:R.terra[0] },
    riflesso:R.acqua[5]
  },
  sentiero: {
    malta:R.pietra[3],
    ciottoli:[R.pietra[5], R.pietra[4], R.pietra[6], R.pietra[3]]
  },
  sabbia: { base:R.sabbia[3], scuro:R.sabbia[2], chiaro:R.sabbia[5] },
  /* base e alterna sono due famiglie allo stesso valore, non due
     gradini della stessa: fra un'asse e l'altra serve un salto di
     tinta, non di luce, altrimenti il pavimento diventa una tavola
     unica */
  assi:   { base:R.legno[4], alterna:R.terra[4], giunto:R.legno[2], venatura:R.legno[3] },
  lastre: {
    malta:R.pietra[5],
    pietre:[R.pietra[6], R.pietra[5], R.pietra[4], R.sabbia[5]],
    muschio:R.oliva[3]
  },
  /* il cotto sta dentro: stesso disegno delle lastre, ma caldo e
     spento, perché una stanza illuminata a lume non può avere per terra
     la stessa pietra chiara della piazza a mezzogiorno */
  cotto: {
    malta:R.legno[1],
    pietre:[R.legno[3], R.terra[2], R.sabbia[1], R.legno[2]],
    fuliggine:R.neutro[0]
  },
  neve:   { base:R.neve[3], chiaro:R.neutro[5], scuro:R.neve[2] },
  grotta: {
    base:R.pietra[2], chiaro:R.pietra[3], medio:R.pietra[1], scuro:R.terra[1],
    ghiaia:R.pietra[3], ghiaiaLuce:R.pietra[4]
  },
  erba: { brina:R.neutro[5], fiore:R.sabbia[6], fioreAutunno:R.giallo[3] },

  /* --- pareti della miniera: qui sta quasi tutto il nero del gioco --- */
  roccia: {
    corpo:R.legno[0], corpoChiaro:R.terra[0], strato:R.neutro[0],
    faccia:R.neutro[1], facciaLuce:R.terra[1], cornice:R.terra[2],
    base:R.neutro[0], giunto:R.neutro[0],
    vena:R.terra[2], venaLuce:R.giallo[1],
    stalattite:R.terra[1], stalattiteLuce:R.pietra[2]
  },

  /* --- acqua (la tinta stagionale la sceglie art.js) --- */
  acqua: {
    tiepida: { fondo:R.acqua[2], medio:R.acqua[3], cresta:R.acqua[5] },
    gelida:  { fondo:R.blu[2],   medio:R.blu[3],   cresta:R.blu[5] }
  },

  /* --- vegetazione --- */
  legno: {
    corteccia:R.legno[2], cortecciaOmbra:R.legno[1], cortecciaLuce:R.legno[3],
    ramo:R.legno[2],
    betulla:R.pietra[6], betullaOmbra:R.pietra[4],
    betullaLuce:R.sabbia[6], betullaMacchia:R.pietra[1]
  },
  ceppo: {
    terra:R.legno[1], fianco:R.terra[2], taglio:R.terra[4],
    anelli:R.terra[3], cuore:R.legno[2]
  },
  /* il pino d'inverno non è il pino d'estate schiarito: è più freddo e
     più cupo, ed è l'unica cosa verde che si vede col Passo innevato */
  pino:   { estivo:R.pino[3], invernale:R.pino[2] },
  frutto: { base:R.rosso[3], luce:R.rosso[4] },

  /* --- la fontana della piazza --- */
  fontana: {
    pietraChiara:R.pietra[6], pietra:R.pietra[5], pietraOmbra:R.pietra[3],
    pietraScura:R.pietra[1],
    giunto:R.pietra[3], internoOmbra:R.metallo[3],
    acquaFondo:R.acqua[2], acquaAlta:R.acqua[3], acquaLuce:R.acqua[5],
    schiuma:R.neve[5], zampillo:R.neve[6]
  },

  /* --- gli interni: pareti, arredi, fuoco --- */
  interno: {
    pareteAlta:R.terra[3], parete:R.terra[2], pareteOmbra:R.legno[1],
    zoccolo:R.terra[1], zoccoloLuce:R.legno[3], battiscopa:R.terra[0],
    intonaco:R.terra[5], intonacoOmbra:R.terra[4],
    legno:R.legno[4], legnoLuce:R.legno[5], legnoOmbra:R.legno[2],
    metallo:R.metallo[3], metalloLuce:R.metallo[4], metalloOmbra:R.metallo[1],
    stoffa:R.rosso[4], stoffaLuce:R.rosso[5], lenzuolo:R.sabbia[6],
    /* La lana di un tappeto vissuto non è rossa: è terra, con dentro un
       filo rosso. Fatto col rosso e basta veniva una bandiera stesa in
       mezzo alla stanza — scura quanto serviva, ma satura al 77%, ed è
       la saturazione quella che urla. */
    tappeto:R.pelleScura[2], tappetoOmbra:R.pelleScura[1],
    tappetoTrama:R.pelleScura[3], tappetoFilo:R.rosso[3],
    tappetoFreddo:R.metallo[2], tappetoFreddoTrama:R.metallo[3],
    brace:R.fuoco[3], braceCuore:R.fuoco[5],
    lume:R.fuoco[6], lumeMetallo:R.terra[1]
  },

  /* --- cielo e atmosfera --- */
  nuvole: { ombra:R.acqua[0] }
};
}

/* i ritocchi singoli, tenuti da parte per poterli riapplicare sopra le
   rampe quando è la rampa a cambiare */
const sovrascritture = {};
P.c = colori();

/* ------------------------------------------------------------------
   RITOCCO A CALDO
   Chi disegna in cache si iscrive con P.suCambio() e svuota il suo
   deposito quando i colori cambiano.
   ------------------------------------------------------------------ */
const ascoltatori = [];
P.suCambio = function(fn){ if(typeof fn==='function') ascoltatori.push(fn); };

function fondi(dest, patch){
  for(const k in patch){
    const v = patch[k];
    if(v && typeof v==='object' && !Array.isArray(v) && dest[k] && typeof dest[k]==='object'){
      fondi(dest[k], v);
    } else {
      dest[k] = v;
    }
  }
}

/* applica un ritocco parziale e fa ridisegnare tutto.
   Se il ritocco tocca le rampe, tutto il gioco cambia insieme: anche i
   colori scritti a mano nei sorgenti, perché passano dall'aggancio e
   l'aggancio pesca dalle rampe nuove. */
P.applica = function(patch){
  if(!patch || typeof patch!=='object') return false;
  if(patch.RAMPE){
    fondi(P.RAMPE, patch.RAMPE);
    costruisciTavolozza();
    memoria.clear();
    /* Si ricostruisce dentro l'oggetto che c'era, non se ne fa uno
       nuovo: chi si fosse tenuto un riferimento a PAL.c resterebbe
       agganciato ai colori vecchi per sempre. */
    fondi(P.c, colori());
    fondi(P.c, sovrascritture);        // i ritocchi singoli restano sopra
  }
  const resto = {};
  for(const k in patch) if(k!=='RAMPE') resto[k] = patch[k];
  if(Object.keys(resto).length){
    fondi(sovrascritture, resto);
    fondi(P.c, resto);
  }
  for(const fn of ascoltatori){
    try{ fn(); }catch(e){ console.warn('[palette] un ascoltatore è inciampato', e); }
  }
  return true;
};

/* copia dei colori attuali, comoda per salvarsi una variante riuscita */
P.esporta = function(){ return JSON.parse(JSON.stringify(P.c)); };

/* da "#rrggbb" a "rgba(r,g,b,a)", per i gradienti */
P.rgba = function(hex, a){
  const n = parseInt(String(hex).slice(1), 16);
  return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+a+')';
};

})();
