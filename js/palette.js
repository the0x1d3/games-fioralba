/* ===================================================================
   FIORALBA — palette.js
   I colori della valle, in un posto solo.

   Prima ogni tinta era scritta a mano dentro la funzione che la usava:
   674 colori distinti sparsi nei sorgenti, 411 solo in art.js. Ritoccare
   l'aspetto del gioco — scaldare le ombre, alzare il contrasto della
   sabbia, rendere l'acqua più fredda — voleva dire cercare e sostituire
   centinaia di stringhe a mano.

   Qui stanno i colori *strutturali*: quelli che definiscono l'identità
   visiva e che avrebbe senso ritoccare tutti insieme. I dettagli di un
   singolo oggetto (il rosso di una bancarella) restano dove sono: non
   guadagnerebbero niente a stare qui.

   Per provare una variazione, dalla console:

       PAL.applica({ sabbia:{ base:'#d8bf88' } })

   Le cache grafiche si svuotano da sole e il gioco si ridisegna con la
   tinta nuova, senza ricaricare la pagina.
   =================================================================== */
(function(){
'use strict';

const P = {};
window.PAL = P;

/* ------------------------------------------------------------------
   I COLORI
   ------------------------------------------------------------------ */
P.c = {
  /* --- terreni --- */
  terra: {
    base:'#8a6647', chiaro:'#9a7452', medio:'#7a5840', scuro:'#6d4d38',
    zolla:'#6b4b36', zollaLuce:'#a07a56'
  },
  arato: {
    asciutto:{ base:'#9a7150', cresta:'#b08a62', scuro:'#7d5940' },
    bagnato: { base:'#6b4c36', cresta:'#7d5a41', scuro:'#513828' },
    riflesso:'#8fb8d0'
  },
  sentiero: {
    malta:'#9b8f7d',
    ciottoli:['#b5a894','#a89b86','#c2b6a2','#8f8371']
  },
  sabbia: { base:'#e0cb96', scuro:'#d4bd85', chiaro:'#eedaab' },
  assi:   { base:'#a87a4a', alterna:'#b0824f', giunto:'#7a5432', venatura:'#8a6038' },
  lastre: {
    malta:'#c2b49a',
    pietre:['#cfc1a6','#c6b79c','#bcac90','#d4c7ad'],
    muschio:'#7f9455'
  },
  neve:   { base:'#e8eef2', chiaro:'#ffffff', scuro:'#d6e0e8' },
  grotta: {
    base:'#6b6155', chiaro:'#7a6f60', medio:'#5f564c', scuro:'#544c44',
    ghiaia:'#82776a', ghiaiaLuce:'#948877'
  },
  erba: { brina:'#ffffff', fiore:'#fff4d8', fioreAutunno:'#d9a03c' },

  /* --- pareti della miniera --- */
  roccia: {
    corpo:'#1a1611', corpoChiaro:'#282118', strato:'#100d08',
    faccia:'#2f2820', facciaLuce:'#4a4038', cornice:'#6b5d4c',
    base:'#0d0b07', giunto:'#191510',
    vena:'#6b5a3c', venaLuce:'#8f7848',
    stalattite:'#4c4238', stalattiteLuce:'#736858'
  },

  /* --- acqua (la tinta stagionale la sceglie art.js) --- */
  acqua: {
    tiepida: { fondo:'#2f6f96', medio:'#3f8ab0', cresta:'#63b0cc' },
    gelida:  { fondo:'#3f5f78', medio:'#547a94', cresta:'#7ea2b8' }
  },

  /* --- vegetazione --- */
  legno: {
    corteccia:'#6b4a2e', cortecciaOmbra:'#4e3520', cortecciaLuce:'#84603f',
    ramo:'#6a4a2c',
    betulla:'#cfc6b0', betullaOmbra:'#9d9483', betullaLuce:'#e2dcc9', betullaMacchia:'#4a463e'
  },
  ceppo: {
    terra:'#4e3520', fianco:'#7a5636', taglio:'#a67c4e',
    anelli:'#8a6440', cuore:'#6b4a2e'
  },
  pino:   { estivo:'#2f6b45', invernale:'#3d6b52' },
  frutto: { base:'#d8452c', luce:'#f08a6a' },

  /* --- la fontana della piazza --- */
  fontana: {
    pietraChiara:'#cfc4ae', pietra:'#b8ae9c', pietraOmbra:'#8e8578', pietraScura:'#655d51',
    giunto:'#7d7466', internoOmbra:'#6f7d84',
    acquaFondo:'#2a6f92', acquaAlta:'#3f95c0', acquaLuce:'#7ec4e0',
    schiuma:'#dff2fa', zampillo:'#eaf7fc'
  },

  /* --- cielo e atmosfera --- */
  nuvole: { ombra:'#1a2838' }
};

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

/* applica un ritocco parziale e fa ridisegnare tutto */
P.applica = function(patch){
  if(!patch || typeof patch!=='object') return false;
  fondi(P.c, patch);
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
