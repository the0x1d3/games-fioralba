/* ===================================================================
   FIORALBA — world.js
   Costruzione delle mappe, collisioni, respawn giornaliero.
   =================================================================== */
(function(){
'use strict';

const W = {};
window.WORLD = W;

/* rng deterministico per la generazione */
function rnd(seed){
  let s = seed>>>0;
  return function(){
    s ^= s<<13; s>>>=0; s ^= s>>17; s ^= s<<5; s>>>=0;
    return s/4294967296;
  };
}

const SOLIDI = {acqua:1, roccia:1, vuoto:1};

function mkMap(id, nome, w, h, opt){
  const m = {
    id, nome, w, h,
    esterno: opt.esterno!==false,
    coltivabile: !!opt.coltivabile,
    musica: opt.musica || 'primavera',
    ambiente: opt.ambiente || null,
    sfondo: opt.sfondo || '#2b3a2a',
    g: new Uint8Array(w*h),          // indice tipo terreno
    v: new Uint8Array(w*h),          // variante grafica
    obj: new Array(w*h).fill(null),  // oggetti di scena
    suolo: new Array(w*h).fill(null),// terreno arato/coltura (solo mappe coltivabili)
    edifici: [], warps: [], npc: [], deco: []
  };
  for(let i=0;i<w*h;i++) m.v[i] = (Math.random()*4)|0;
  return m;
}

/* Solo in coda: gli indici finiscono nei salvataggi, e spostarli
   trasformerebbe l'erba di una vecchia partita in acqua. */
const TIPI = ['erba','terra','sentiero','sabbia','acqua','assi','lastre','grotta','roccia','vuoto','neve','cotto'];
W.TIPI = TIPI;
function ti(name){ return TIPI.indexOf(name); }
W.ti = ti;

W.idx = (m,x,y)=> y*m.w+x;
W.dentro = (m,x,y)=> x>=0 && y>=0 && x<m.w && y<m.h;
W.terreno = (m,x,y)=> W.dentro(m,x,y) ? TIPI[m.g[W.idx(m,x,y)]] : 'vuoto';

W.solido = function(m,x,y){
  if(!W.dentro(m,x,y)) return true;
  const i = W.idx(m,x,y);
  if(SOLIDI[TIPI[m.g[i]]]) return true;
  const o = m.obj[i];
  if(o && o.solido) return true;
  return false;
};

/* Come `solido`, ma per chi non ha le mani. Il cancelletto è aperto per
   il contadino e chiuso per le galline: è tutto il senso di un
   cancelletto, e senza questa distinzione o passano tutti o non passa
   nessuno. */
W.solidoPerBestie = function(m,x,y){
  if(W.solido(m,x,y)) return true;
  const o = m.obj[W.idx(m,x,y)];
  return !!(o && o.apribile);
};

W.acqua = function(m,x,y){
  return W.dentro(m,x,y) && TIPI[m.g[W.idx(m,x,y)]]==='acqua';
};

/* ---- helper di disegno mappa ---- */
function fill(m, x0,y0,w,h, tipo){
  const t = ti(tipo);
  for(let y=y0;y<y0+h;y++) for(let x=x0;x<x0+w;x++)
    if(W.dentro(m,x,y)) m.g[W.idx(m,x,y)] = t;
}
function blob(m, cx,cy, r, tipo, R, irr){
  const t = ti(tipo);
  irr = irr===undefined?0.35:irr;
  for(let y=cy-r-2;y<=cy+r+2;y++) for(let x=cx-r-2;x<=cx+r+2;x++){
    if(!W.dentro(m,x,y)) continue;
    const d = Math.hypot(x-cx, (y-cy)*1.25);
    if(d < r*(1-irr/2+R()*irr)) m.g[W.idx(m,x,y)] = t;
  }
}
function linea(m, x0,y0,x1,y1, sp, tipo){
  const t = ti(tipo);
  const steps = Math.max(Math.abs(x1-x0), Math.abs(y1-y0));
  for(let s=0;s<=steps;s++){
    const x = Math.round(x0+(x1-x0)*s/steps);
    const y = Math.round(y0+(y1-y0)*s/steps);
    for(let dy=0;dy<sp;dy++) for(let dx=0;dx<sp;dx++){
      const px=x+dx-((sp/2)|0), py=y+dy-((sp/2)|0);
      if(W.dentro(m,px,py)) m.g[W.idx(m,px,py)] = t;
    }
  }
}
function setObj(m,x,y,o){
  if(!W.dentro(m,x,y)) return;
  m.obj[W.idx(m,x,y)] = o;
}
function libero(m,x,y){
  if(!W.dentro(m,x,y)) return false;
  const i=W.idx(m,x,y);
  if(SOLIDI[TIPI[m.g[i]]]) return false;
  if(m.obj[i]) return false;
  if(m.suolo[i]) return false;
  return true;
}
W.libero = libero;

function albero(kind, stage){
  return { t:'albero', kind, stage:stage===undefined?2:stage, hp:(stage===2?5:2), solido:true, w:3, h:3, anc:1 };
}
function sasso(kind){
  return { t:'sasso', kind, hp: kind==='pietra'?2:(kind==='oro'||kind==='ametista'?5:3), solido:true };
}
W.setObj = setObj;
W.albero = albero;
W.sasso  = sasso;

/* sparge oggetti su caselle libere di un dato terreno — usato dagli eventi notturni.
   `fabbrica(R)` costruisce l'oggetto da posare; ritorna quanti ne ha piazzati. */
W.spargiSu = function(m, terreno, quanti, fabbrica, seed){
  const R = rnd((seed>>>0)||1);
  let messi=0, tent=0, max=quanti*80+400;
  while(messi<quanti && tent<max){
    tent++;
    const x=1+((R()*(m.w-2))|0), y=1+((R()*(m.h-2))|0);
    if(!libero(m,x,y)) continue;
    if(W.terreno(m,x,y)!==terreno) continue;
    setObj(m,x,y, fabbrica(R));
    messi++;
  }
  return messi;
};

/* edificio: occupa un rettangolo solido, con porta interattiva */
/* Quante caselle il disegno di un edificio sborda sopra al suo ingombro.

   Il tetto viene disegnato appoggiando il fondo dello sprite al bordo
   basso dell'edificio e salendo: quasi sempre sale più in alto di quanto
   dichiari. La locanda sbordava di quasi due caselle, casa tua di una —
   ed erano caselle calpestabili, quindi ci si camminava dentro e si
   finiva col mezzobusto dentro il tetto. Qui lo misuriamo dal disegno
   vero, invece di scriverlo a mano: se un giorno un tetto cambia
   altezza, l'ingombro lo segue da solo.

   I livelli contano: casa tua cresce quando la amplii, e il muro deve
   valere per la versione più alta che può prendere. */
/* Quanto è alto il disegno rispetto a quanto è largo. Sta scritto qui e
   non chiesto ad ART perché di questi numeri deve poter vivere anche il
   controllo di coerenza, che gira in Node e un canvas non ce l'ha. Che
   la tabella dica il vero lo verifica ART stesso appena il gioco parte:
   se un tetto cambia altezza, in console arriva l'avviso. */
const PROPORZIONI = {
  casa:0.875, cottage:0.944, capanna:0.929, bottega:0.833,
  fucina:0.909, locanda:0.846, santuario:1.000,
  serra:0.833, pollaio:0.850
};

function sbordoTetto(kind, tw, th){
  const r = PROPORZIONI[kind];
  if(!r) return 0;
  return Math.max(0, Math.round(r*tw - th));
}

/* Il controllo che la tabella non menta: gira una volta sola, quando c'è
   di che misurare. */
W.verificaProporzioni = function(){
  if(typeof ART === 'undefined' || !ART.building) return [];
  const scarti = [];
  for(const kind in PROPORZIONI){
    let alto = 0;
    for(let liv=0; liv<=4; liv++){
      try{
        const img = ART.building(kind, { season:'primavera', liv });
        if(img && img.width) alto = Math.max(alto, img.height/img.width);
      }catch(e){ /* un tipo che il disegno non conosce si salta */ }
    }
    if(alto && Math.abs(alto - PROPORZIONI[kind]) > 0.06)
      scarti.push(kind+': la tabella dice '+PROPORZIONI[kind]+', il disegno '+(Math.round(alto*1000)/1000));
  }
  if(scarti.length) console.warn('[mondo] le proporzioni degli edifici sono cambiate:', scarti);
  return scarti;
};

function edificio(m, kind, x, y, tw, th, opt){
  opt = opt||{};
  const e = { kind, x, y, w:tw, h:th, porta:opt.porta, azione:opt.azione,
              nome:opt.nome, scala:opt.scala||1, offY:opt.offY||0, liv:opt.liv||0 };
  m.edifici.push(e);
  /* Solido su tutta la sagoma disegnata, tetto compreso: non si passa
     dietro a una casa perché dietro a una casa c'è la casa. */
  const su = sbordoTetto(kind, tw, th);
  e.sbordo = su;
  for(let yy=y-su; yy<y+th; yy++) for(let xx=x; xx<x+tw; xx++){
    if(opt.porta && xx===opt.porta.x && yy===opt.porta.y) continue;
    if(W.dentro(m,xx,yy)) m.obj[W.idx(m,xx,yy)] = {t:'muro', solido:true, ed:e};
  }
  /* La porta è solida come il muro che la contiene. Era calpestabile —
     l'idea era «ci si entra» — ma quella casella sta dentro la sagoma
     della casa: chi ci saliva sopra si ritrovava disegnato dentro
     l'edificio, mezzo dentro e mezzo fuori. Una porta si apre stando
     davanti, non standoci in mezzo, e `interagisci` guarda già la
     casella che hai di fronte. */
  if(opt.porta) setObj(m, opt.porta.x, opt.porta.y, {t:'porta', ed:e, azione:opt.azione, solido:true});
  return e;
}
W.edificio = edificio;

/* ------------------------------------------------------------------
   IL TERRENO CHE UN EDIFICIO SI PRENDERÀ

   Gli spazi delle costruzioni (`m.spazi`) si sgombrano una volta sola,
   quando la mappa nasce. Ma il podere è coltivabile e niente impediva
   di zappare lì dentro: chi seminava nel prato davanti a dove sarebbe
   andato il pollaio, il giorno che comprava il pollaio se lo vedeva
   costruire sopra al campo. Misurato: 20 caselle su 20 sepolte sotto il
   pollaio, 30 su 30 sotto la serra — con le colture ancora scritte in
   `m.suolo` ma la casella diventata muro, quindi invisibili e
   irraggiungibili per sempre.

   `W.riservata` dice se una casella è promessa a una costruzione non
   ancora fatta. Il margine di una casella c'è perché anche lì la mappa
   sgombra alla nascita, e perché un edificio ha bisogno di un passo
   davanti alla porta.
   ------------------------------------------------------------------ */
W.riservata = function(m, x, y, costruzioni){
  if(!m || !m.spazi) return null;
  for(const k in m.spazi){
    if(costruzioni && costruzioni[k]) continue;      // già costruito: il terreno è suo
    const s = m.spazi[k];
    if(x >= s.x-1 && x < s.x+s.w+1 && y >= s.y-1 && y < s.y+s.h+1) return k;
  }
  return null;
};

function warp(m, x,y,w,h, to, tx,ty, etichetta){
  m.warps.push({x,y,w,h,to,tx,ty,etichetta});
}

/* Sgombra un tipo di terreno dagli oggetti di scena — ma NON dalle porte e
   dai muri. Prima le porte che capitavano su un sentiero (Serafina,
   l'eremita) venivano cancellate insieme ai cespugli, e restava un buco
   camminabile nel muro di casa loro. */
function sgombra(m, tipo){
  for(let y=0;y<m.h;y++) for(let x=0;x<m.w;x++){
    if(W.terreno(m,x,y)!==tipo) continue;
    const i = W.idx(m,x,y);
    const o = m.obj[i];
    if(o && (o.t==='porta' || o.t==='muro')) continue;
    m.obj[i]=null;
  }
}

/* ===================================================================
   PODERE — la fattoria
   =================================================================== */
function buildPodere(){
  const m = mkMap('podere','Podere di Nonna Ilde', 52, 44, {
    coltivabile:true, musica:'primavera', ambiente:'uccelli', sfondo:'#3c4f33'
  });
  const R = rnd(1337);

  fill(m, 0,0, m.w,m.h, 'erba');

  /* ------------------------------------------------------------------
     BOSCO DI CONFINE
     Prima era una cornice rettangolare spessa esattamente due caselle e
     si leggeva come un bordo. Ora il margine ondeggia.
     ------------------------------------------------------------------ */
  for(let x=0;x<m.w;x++){
    for(let y=0; y<2+((R()*2)|0); y++) setObj(m,x,y, albero(R()>0.6?'pino':'quercia'));
    for(let y=m.h-1-((R()*2)|0); y<m.h; y++) setObj(m,x,y, albero('pino'));
  }
  for(let y=0;y<m.h;y++){
    for(let x=0; x<2+((R()*2)|0); x++) setObj(m,x,y, albero(R()>0.5?'pino':'quercia'));
    for(let x=m.w-1-((R()*2)|0); x<m.w; x++) setObj(m,x,y, albero('pino'));
  }

  /* ------------------------------------------------------------------
     L'AIA — la corte di terra battuta davanti a casa
     ------------------------------------------------------------------ */
  fill(m, 3,3, 13,9, 'terra');
  // l'aia va sgomberata PRIMA di arredarla: il bosco di confine può
  // averci lasciato dentro un albero
  for(let y=3;y<12;y++) for(let x=3;x<16;x++) if(W.dentro(m,x,y)) m.obj[W.idx(m,x,y)]=null;
  edificio(m,'casa', 4,3, 7,5, { porta:{x:7,y:7}, azione:'casa', nome:'Casa', scala:1 });

  // l'abbeveratoio in pietra: il pezzo forte dell'aia
  fill(m, 12,3, 4,3, 'acqua');
  m.deco.push({t:'fontana', x:12, y:3});
  for(let y=3;y<6;y++) for(let x=12;x<16;x++) m.obj[W.idx(m,x,y)] = {t:'fontana', solido:true};

  setObj(m, 11,10, {t:'panchina', solido:true, dir:0});
  for(const [fx,fy] of [[4,9],[5,9],[9,9],[10,9]])
    setObj(m, fx,fy, {t:'fioriera', solido:true, v:(R()*4)|0});
  m.deco.push({t:'bucato', x:3, y:10, w:3});
  setObj(m, 13,8, {t:'consegna', solido:true});
  m.deco.push({t:'cartello', x:12, y:9, testo:'Cassa di consegna — la ritirano di notte'});

  /* ------------------------------------------------------------------
     I SENTIERI — l'occhio deve capire dove si va
     ------------------------------------------------------------------ */
  linea(m,  7,8,  7,15,  2, 'sentiero');    // dalla porta al campo
  linea(m,  7,15, 23,15, 2, 'sentiero');    // il viale lungo il campo
  linea(m,  8,8,  12,8,  2, 'sentiero');    // fino alla cassa di consegna
  linea(m, 23,15, 23,30, 2, 'sentiero');    // giù a est del campo
  linea(m, 23,30, 20,41, 2, 'sentiero');    // fino all'uscita per il bosco
  linea(m, 23,16, 49,19, 2, 'sentiero');    // e a est, verso il paese

  /* ------------------------------------------------------------------
     IL CAMPO GRANDE — recintato e sgombro: si riconosce a colpo d'occhio
     ------------------------------------------------------------------ */
  /* Il campo finisce una casella prima del viale. Prima arrivava fino a
     toccarlo, e siccome la staccionata non si posa sul selciato tutto il
     lato est restava aperto: tredici caselle di varco, cioè un recinto
     con tre lati. Adesso la linea corre sull'erba e il viale ci passa
     accanto, con un cancelletto dove si entra. */
  const CX0=5, CY0=17, CX1=20, CY1=27;
  for(let y=CY0;y<=CY1;y++) for(let x=CX0;x<=CX1;x++){
    const i=W.idx(m,x,y);
    if(TIPI[m.g[i]]==='sentiero') continue;
    m.obj[i]=null;
    m.g[i]=ti('erba');
  }
  /* Le staccionate del gioco erano decorazioni, cioè si attraversavano;
     quelle che posa il giocatore sono oggetti, cioè fermano. Due
     staccionate identiche che si comportano in modo opposto: quella del
     gioco non recintava niente e quella del giocatore sembrava rotta.
     Adesso sono la stessa cosa e fermano tutt'e due — ed è per questo
     che serve un cancelletto. */
  const recinta=(x,y)=>{
    if(!W.dentro(m,x,y)) return;
    if(TIPI[m.g[W.idx(m,x,y)]]==='sentiero') return;     // il varco dove passa il viale
    setObj(m, x, y, {t:'mobile', kind:'recinto', solido:true});
  };
  for(let x=CX0-1;x<=CX1+1;x++){ recinta(x,CY0-1); recinta(x,CY1+1); }
  for(let y=CY0;y<=CY1;y++){ recinta(CX0-1,y); recinta(CX1+1,y); }
  /* I due cancelletti: uno a nord verso l'aia, uno a est sul viale. Si
     entra di lì, e le galline restano fuori dalle insalate. */
  const cancello=(x,y)=>setObj(m, x, y, {t:'mobile', kind:'cancelletto', solido:false, apribile:true});
  cancello(CX0+3, CY0-1);
  cancello(CX1+1, CY0+5);
  m.deco.push({t:'cartello', x:CX0, y:CY0-2, testo:'Campo grande'});

  /* ------------------------------------------------------------------
     IL FRUTTETO — alberi in filare: si vede che è coltivato
     ------------------------------------------------------------------ */
  for(let fy=0; fy<3; fy++) for(let fx=0; fx<4; fx++){
    const x = 26+fx*3, y = 21+fy*3;
    if(libero(m,x,y)) setObj(m,x,y, albero(fy%2 ? 'betulla' : 'quercia'));
  }
  for(let i=0;i<12;i++){
    const x=25+((R()*12)|0), y=20+((R()*10)|0);
    if(libero(m,x,y) && W.terreno(m,x,y)==='erba') m.deco.push({t:'petali_terra',x,y,v:(R()*4)|0});
  }

  /* ------------------------------------------------------------------
     IL RUSCELLO, COL PONTICELLO SUL VIALE
     ------------------------------------------------------------------ */
  linea(m, 24,0, 26,10, 2, 'acqua');
  linea(m, 26,10, 32,20, 2, 'acqua');
  linea(m, 32,20, 36,27, 2, 'acqua');
  /* IL PONTICELLO DEVE COPRIRE IL RUSCELLO, non stargli accanto.

     Segnalato in partita: «il ponte ha due blocchi invisibili che non te
     lo fanno attraversare, e si vede anche male». Misurato: il viale
     corre sulle righe 16 e 17, e lì il ruscello passa per la casella
     x=29 — ma il ponte cominciava a x=30. Quei due quadrati d'acqua
     stavano fra il selciato e le assi, sotto il bordo della ringhiera
     disegnata, quindi non si leggevano come acqua: si leggevano come
     ponte che non si attraversa. Si passava solo scendendo a y=18, cioè
     fuori dal viale e fuori dal ponte disegnato.

     Adesso il ponte parte da x=29 ed è largo quattro: il viale ci entra
     e ne esce sulla stessa riga da cui arriva. */
  ponticello(m);

  /* ------------------------------------------------------------------
     LO STAGNO — riva curata, canneti, un pontile per pescare
     ------------------------------------------------------------------ */
  blob(m, 41, 34, 8, 'acqua', R, 0.4);
  for(let y=24;y<m.h;y++) for(let x=30;x<m.w;x++){
    if(W.terreno(m,x,y)!=='erba') continue;
    let vicino=false;
    for(let d=0;d<4;d++) if(W.terreno(m,x+[1,-1,0,0][d], y+[0,0,1,-1][d])==='acqua') vicino=true;
    if(vicino) m.g[W.idx(m,x,y)] = ti('sabbia');
  }
  for(let i=0;i<9;i++){
    const x=37+((R()*9)|0), y=31+((R()*7)|0);
    if(W.terreno(m,x,y)==='acqua') m.deco.push({t:'ninfea',x,y,v:(R()*3)|0});
  }
  for(let i=0;i<18;i++){
    const x=31+((R()*17)|0), y=25+((R()*15)|0);
    if(libero(m,x,y) && W.terreno(m,x,y)==='sabbia') m.deco.push({t:'erbe',x,y,v:(R()*4)|0});
  }
  for(let k=0;k<3;k++){
    const px2=36, py2=30+k;
    if(!W.dentro(m,px2,py2)) continue;
    m.g[W.idx(m,px2,py2)] = ti('assi');
    m.obj[W.idx(m,px2,py2)] = null;
  }
  m.deco.push({t:'molo', x:36, y:30, w:1});
  m.deco.push({t:'cartello', x:35, y:29, testo:'Il laghetto di Ilde'});

  /* ------------------------------------------------------------------
     SPAZI PER LE COSTRUZIONI — vanno tenuti sgombri
     ------------------------------------------------------------------ */
  m.spazi = {
    pollaio:{x:17,y:4,w:5,h:4, kind:'pollaio', porta:{x:19,y:7}},
    serra:  {x:34,y:4,w:6,h:5, kind:'serra',   porta:{x:37,y:8}},
    silo:   {x:41,y:5,w:2,h:2, kind:'silo'}
  };
  for(const k in m.spazi){
    const sp=m.spazi[k];
    for(let y=sp.y-1;y<sp.y+sp.h+1;y++) for(let x=sp.x-1;x<sp.x+sp.w+1;x++){
      if(!W.dentro(m,x,y)) continue;
      m.obj[W.idx(m,x,y)]=null;
      if(TIPI[m.g[W.idx(m,x,y)]]==='acqua') m.g[W.idx(m,x,y)]=ti('erba');
    }
  }

  /* ------------------------------------------------------------------
     L'ANGOLO SELVATICO — a sud-ovest: legna, fibra, pietra
     ------------------------------------------------------------------ */
  for(let i=0;i<140;i++){
    const x=3+((R()*13)|0), y=29+((R()*13)|0);
    if(!libero(m,x,y) || W.terreno(m,x,y)!=='erba') continue;
    const r=R();
    if(r<0.30) setObj(m,x,y, albero(R()>0.6?'pino':'quercia'));
    else if(r<0.42) setObj(m,x,y, sasso('pietra'));
    else if(r<0.52) setObj(m,x,y, {t:'ceppo', hp:4, solido:true});
    else if(r<0.80) setObj(m,x,y, {t:'erbaccia', v:(R()*4)|0});
    else setObj(m,x,y, {t:'ramo', v:(R()*3)|0});
  }

  /* --- verde sparso sul resto del prato, senza soffocarlo --- */
  for(let i=0;i<90;i++){
    const x=3+((R()*(m.w-8))|0), y=3+((R()*(m.h-8))|0);
    if(!libero(m,x,y) || W.terreno(m,x,y)!=='erba') continue;
    if(x>=CX0-1 && x<=CX1+1 && y>=CY0-1 && y<=CY1+1) continue;   // il campo resta pulito
    const r=R();
    if(r<0.26) setObj(m,x,y,{t:'cespuglio', v:(R()*3)|0, bacche:R()>0.6});
    else if(r<0.48) setObj(m,x,y,{t:'fiori', v:(R()*4)|0});
    else if(r<0.78) m.deco.push({t:'ciuffo',x,y,v:(R()*4)|0});
    else m.deco.push({t:'sassolini',x,y,v:(R()*3)|0});
  }

  /* ------------------------------------------------------------------
     USCITE
     ------------------------------------------------------------------ */
  fill(m, m.w-2, 18, 2, 4, 'sentiero');
  warp(m, m.w-1, 18, 1, 4, 'fioralba', 2, 16, 'Fioralba');
  m.deco.push({t:'cartello', x:m.w-5, y:21, testo:'→ Fioralba, il paese'});

  fill(m, 18, m.h-2, 4, 2, 'sentiero');
  warp(m, 18, m.h-1, 4, 1, 'bosco', 20, 2, 'Bosco');
  m.deco.push({t:'cartello', x:17, y:m.h-4, testo:'↓ Bosco di Fioralba'});

  /* i camminamenti restano sgombri (porte e muri esclusi) */
  sgombra(m, 'sentiero');
  sgombra(m, 'assi');

  /* le lanterne vanno DOPO lo sgombero, o le porterebbe via */
  for(const [lx,ly] of [[8,13],[16,14],[24,14],[23,24],[21,38],[12,7]])
    if(libero(m,lx,ly)) setObj(m,lx,ly,{t:'lampione', solido:false});

  return m;
}

/* ===================================================================
   FIORALBA — il paese
   =================================================================== */
function buildFioralba(){
  const m = mkMap('fioralba','Fioralba', 46, 36, {
    musica:'paese', ambiente:'uccelli', sfondo:'#3a4738'
  });
  const R = rnd(4242);

  fill(m, 0,0, m.w,m.h, 'erba');

  // bordo alberi
  for(let x=0;x<m.w;x++){ setObj(m,x,0,albero('pino')); setObj(m,x,m.h-1,albero('pino')); }
  for(let y=0;y<m.h;y++){ setObj(m,0,y,albero('pino')); setObj(m,m.w-1,y,albero('pino')); }

  /* fiume a est con molo */
  fill(m, 37,0, 9, m.h, 'acqua');
  for(let y=0;y<m.h;y++){
    const w = 6 + Math.round(Math.sin(y*0.22)*2);
    for(let x=37;x<m.w;x++) m.g[W.idx(m,x,y)] = ti(x>=46-w? 'acqua':'acqua');
    for(let x=34;x<37;x++){
      const bordo = 36 + Math.round(Math.sin(y*0.22)*1.6);
      m.g[W.idx(m,x,y)] = x>=bordo ? ti('acqua') : ti('sabbia');
    }
  }
  // molo di legno
  fill(m, 33,18, 6,2, 'assi');
  m.deco.push({t:'molo', x:33, y:18, w:6});

  /* piazza centrale lastricata (ottagonale, non un quadrato piatto) */
  for(let y=15;y<23;y++) for(let x=17;x<27;x++){
    const dx=Math.abs(x-21.5), dy=Math.abs(y-18.5);
    if(dx+dy*1.25 < 7.4) m.g[W.idx(m,x,y)] = ti('lastre');
  }
  // fontana
  fill(m, 20,17, 4,3, 'acqua');
  m.deco.push({t:'fontana', x:20, y:17});
  for(let y=17;y<20;y++) for(let x=20;x<24;x++) m.obj[W.idx(m,x,y)]={t:'fontana', solido:true};

  /* strade — strette, da paese */
  linea(m, 2,16, 17,18, 2, 'sentiero');
  linea(m, 27,18, 34,19, 2, 'sentiero');
  linea(m, 22,15, 22,6, 2, 'sentiero');
  linea(m, 22,22, 22,31, 2, 'sentiero');
  linea(m, 11,8, 22,8, 2, 'sentiero');
  linea(m, 10,28, 22,28, 2, 'sentiero');

  /* edifici */
  edificio(m,'bottega', 8,10, 7,5, { porta:{x:11,y:14}, azione:'bottega', nome:'Bottega di Bruno' });
  edificio(m,'fucina', 27,9, 6,5, { porta:{x:29,y:13}, azione:'fucina', nome:'Fucina di Tobia' });
  edificio(m,'locanda', 15,4, 8,5, { porta:{x:18,y:8}, azione:'locanda', nome:'Locanda del Tasso Storto' });
  edificio(m,'cottage', 7,24, 5,4, { porta:{x:9,y:27}, azione:'chiuso', nome:'Casa di Elio' });
  edificio(m,'cottage', 27,25, 5,4, { porta:{x:29,y:28}, azione:'chiuso', nome:'Casa di Marisol' });
  edificio(m,'capanna', 31,21, 4,3, { porta:{x:32,y:23}, azione:'chiuso', nome:'Rimessa' });

  /* arredo urbano */
  const lamp = [[17,15],[26,15],[17,22],[26,22],[21,13],[21,24],[12,17],[31,19]];
  for(const p of lamp) if(libero(m,p[0],p[1])) setObj(m,p[0],p[1],{t:'lampione', solido:false});

  // panchine attorno alla piazza
  for(const p of [[18,21,1],[25,21,1],[18,16,0],[25,16,0]])
    if(libero(m,p[0],p[1])) setObj(m,p[0],p[1],{t:'panchina', solido:true, dir:p[2]});

  // fioriere
  for(const p of [[19,15],[24,15],[19,22],[24,22],[16,18],[27,18]])
    if(libero(m,p[0],p[1])) setObj(m,p[0],p[1],{t:'fioriera', solido:true, v:(R()*4)|0});

  // bancarelle del mercato + casse e botti
  for(const p of [[18,13],[24,13]])
    if(libero(m,p[0],p[1])) setObj(m,p[0],p[1],{t:'bancarella', solido:true, v:(R()*3)|0});
  for(const p of [[16,12],[26,12],[13,15],[30,17],[12,26],[33,20]])
    if(libero(m,p[0],p[1])) setObj(m,p[0],p[1],{t:'casse', solido:true, v:(R()*3)|0});

  // panni stesi e barili vicino alle case
  m.deco.push({t:'bucato', x:8, y:23, w:4});
  m.deco.push({t:'bucato', x:28, y:24, w:3});
  for(let i=0;i<26;i++){
    const x=2+((R()*32)|0), y=2+((R()*32)|0);
    if(!libero(m,x,y)) continue;
    if(W.terreno(m,x,y)!=='erba') continue;
    const r=R();
    if(r<0.35) setObj(m,x,y, albero(R()>0.5?'quercia':'betulla'));
    else if(r<0.6) setObj(m,x,y, {t:'cespuglio', v:(R()*3)|0, bacche:false});
    else setObj(m,x,y, {t:'fiori', v:(R()*4)|0});
  }
  // orti dietro le case
  fill(m, 5,30, 8,3, 'terra');
  for(let x=5;x<13;x++) for(let y=30;y<33;y++) if(R()>0.4) m.deco.push({t:'ortaggio',x,y,v:(R()*4)|0});

  /* uscite */
  fill(m, 0,15, 2,4, 'sentiero');
  for(let y=15;y<19;y++) for(let x=0;x<2;x++) m.obj[W.idx(m,x,y)]=null;
  warp(m, 0, 15, 1, 4, 'podere', 49, 20, 'Podere');
  m.deco.push({t:'cartello', x:3, y:15, testo:'← Podere'});

  fill(m, 20,0, 4,2, 'sentiero');
  for(let y=0;y<2;y++) for(let x=20;x<24;x++) m.obj[W.idx(m,x,y)]=null;
  warp(m, 20, 0, 4, 1, 'grotta', 17, 26, 'Miniera');
  m.deco.push({t:'cartello', x:19, y:3, testo:'↑ Miniera'});

  fill(m, 20,m.h-2, 4,2, 'sentiero');
  for(let y=m.h-2;y<m.h;y++) for(let x=20;x<24;x++) m.obj[W.idx(m,x,y)]=null;
  warp(m, 20, m.h-1, 4, 1, 'bosco', 22, 2, 'Bosco');

  // uscita a sud-est → Piazza del Porto
  fill(m, 30,m.h-2, 4,2, 'sentiero');
  for(let y=m.h-2;y<m.h;y++) for(let x=30;x<34;x++) m.obj[W.idx(m,x,y)]=null;
  warp(m, 30, m.h-1, 4, 1, 'piazza', 20, 3, 'Piazza');
  m.deco.push({t:'cartello', x:29, y:m.h-4, testo:'↓ Piazza'});

  /* npc */
  m.npc = [
    { id:'bruno',   x:12, y:16, home:[12,16], giro:[[12,16],[10,16],[13,15]] },
    { id:'tobia',   x:29, y:15, home:[29,15], giro:[[29,15],[31,16],[27,16]] },
    { id:'marisol', x:19, y:10, home:[19,10], giro:[[19,10],[21,11],[17,11]] },
    { id:'elio',    x:34, y:19, home:[34,19], giro:[[34,19],[35,18],[33,20]] }
  ];
  return m;
}

/* ===================================================================
   BOSCO — la Radura degli Spiriti
   =================================================================== */
function buildBosco(){
  const m = mkMap('bosco','Bosco di Fioralba', 46, 42, {
    musica:'primavera', ambiente:'uccelli', sfondo:'#26361f'
  });
  const R = rnd(9001);

  fill(m, 0,0, m.w,m.h, 'erba');
  for(let x=0;x<m.w;x++){ setObj(m,x,0,albero('pino')); setObj(m,x,m.h-1,albero('pino')); }
  for(let y=0;y<m.h;y++){ setObj(m,0,y,albero('pino')); setObj(m,m.w-1,y,albero('pino')); }
  // entrate aperte
  for(let x=19;x<23;x++){ m.obj[W.idx(m,x,0)]=null; m.g[W.idx(m,x,0)]=ti('sentiero'); }
  for(let x=21;x<25;x++){ m.obj[W.idx(m,x,1)]=null; }

  /* stagno grande a sinistra */
  blob(m, 9, 28, 7, 'acqua', R, 0.45);
  for(let y=20;y<m.h;y++) for(let x=1;x<20;x++){
    if(W.terreno(m,x,y)!=='erba') continue;
    let vic=false;
    for(let d=0;d<4;d++) if(W.terreno(m,x+[1,-1,0,0][d], y+[0,0,1,-1][d])==='acqua') vic=true;
    if(vic) m.g[W.idx(m,x,y)]=ti('sabbia');
  }

  /* torrente che divide la radura */
  linea(m, 26,0, 28,14, 2, 'acqua');
  linea(m, 28,14, 30,22, 2, 'acqua');

  /* sentieri */
  linea(m, 21,1, 21,12, 2, 'sentiero');
  linea(m, 21,12, 12,18, 2, 'sentiero');
  linea(m, 21,12, 33,16, 2, 'sentiero');

  /* casa di Serafina */
  edificio(m,'cottage', 6,12, 5,4, { porta:{x:8,y:15}, azione:'serafina', nome:'Casa di Serafina', wall:'#c0a878' });
  linea(m, 8,16, 14,18, 2, 'sentiero');
  for(let i=0;i<10;i++){
    const x=4+((R()*9)|0), y=16+((R()*3)|0);
    if(libero(m,x,y)) m.deco.push({t:'erbe',x,y,v:(R()*4)|0});
  }

  /* --- RADURA DEGLI SPIRITI (oltre il ponte) ---

     Il burrone che la separa. Correva solo da x=30 al bordo est, e
     bastava scendere qualche passo più a ovest per entrare nella radura
     a piedi asciutti: il ponte da 3000 monete era un souvenir, e la
     missione che porta a costruirlo non chiudeva niente.

     Ora il burrone gira anche a sud e chiude la conca su tre lati (il
     quarto è il bordo della mappa): o si passa dal ponte, o non si
     passa. Il fianco ovest del bosco e lo stagno restano fuori dal
     recinto, perché lì si pesca fin dal primo giorno. */
  m.burrone = [ {x:27, y:24, w:19, h:3},    // braccio est-ovest
                {x:27, y:27, w:3,  h:15} ]; // braccio nord-sud, chiude il fianco
  for(const b of m.burrone) fill(m, b.x, b.y, b.w, b.h, 'roccia');
  fill(m, 30,27, 16,15, 'erba');
  fill(m, 33,24, 3,3, 'vuoto');   // punto dove andrà il ponte
  m.pontePos = {x:33, y:24, w:3, h:3};

  // radura: terra battuta al centro, muschio ed erba verso i bordi
  blob(m, 38, 35, 5.5, 'terra', R, 0.3);
  edificio(m,'santuario', 35,30, 6,5, { porta:{x:38,y:34}, azione:'santuario', nome:'Santuario della Lanterna' });
  // cerchio di pietre
  for(let i=0;i<10;i++){
    const a=i/10*6.283;
    const x=38+Math.round(Math.cos(a)*7), y=35+Math.round(Math.sin(a)*5);
    if(libero(m,x,y)) setObj(m,x,y,{t:'pietra_rituale', solido:true, v:i});
  }
  // ciuffi d'erba, fiori e sassolini sulla terra battuta
  for(let i=0;i<70;i++){
    const x=30+((R()*15)|0), y=27+((R()*13)|0);
    if(!libero(m,x,y)) continue;
    const t = W.terreno(m,x,y);
    if(t!=='terra' && t!=='erba') continue;
    const r=R();
    if(r<0.42) m.deco.push({t:'ciuffo', x, y, v:(R()*4)|0});
    else if(r<0.70) m.deco.push({t:'petali_terra', x, y, v:(R()*4)|0});
    else if(r<0.86) m.deco.push({t:'sassolini', x, y, v:(R()*3)|0});
    else setObj(m,x,y,{t:'fiori', v:(R()*4)|0});
  }
  /* Sentiero di lastre dal ponte al santuario. Partiva da (34,26), cioè
     da *dentro* il varco del ponte, e ci scavava un ripiano di lastre:
     restava una sola riga di vuoto a reggere tutto il burrone, e a
     vederlo sembrava un ponte già mezzo costruito. Parte da sotto. */
  linea(m, 34,27, 38,30, 2, 'sentiero');
  // e il varco torna un buco pulito, qualunque cosa ci abbia disegnato sopra
  fill(m, m.pontePos.x, m.pontePos.y, m.pontePos.w, m.pontePos.h, 'vuoto');
  // chi arriva al burrone deve capire cosa sta guardando e cosa gli manca
  m.deco.push({t:'cartello', x:32, y:23,
               testo:'Il burrone. Di là c\'è la Radura degli Spiriti: serve un ponte.'});
  // lucciole permanenti
  for(let i=0;i<14;i++) m.deco.push({t:'lucciola', x:32+R()*13, y:29+R()*11, f:R()*6.28});

  /* vegetazione fitta */
  for(let i=0;i<340;i++){
    const x=1+((R()*(m.w-2))|0), y=1+((R()*(m.h-2))|0);
    if(!libero(m,x,y)) continue;
    if(W.terreno(m,x,y)!=='erba' && W.terreno(m,x,y)!=='terra') continue;
    const r=R();
    if(r<0.40) setObj(m,x,y, albero(R()>0.55?'pino':(R()>0.4?'quercia':'betulla')));
    else if(r<0.50) setObj(m,x,y, {t:'cespuglio', v:(R()*3)|0, bacche:R()>0.6});
    else if(r<0.60) setObj(m,x,y, sasso(R()>0.8?'quarzo':'pietra'));
    else if(r<0.80) setObj(m,x,y, {t:'erbaccia', v:(R()*4)|0});
    else setObj(m,x,y, {t:'ramo', v:(R()*3)|0});
  }
  // pulisci i sentieri
  sgombra(m, 'sentiero');

  /* uscite */
  warp(m, 19, 0, 4, 1, 'podere', 20, 41, 'Podere');
  fill(m, 43,14, 3,4, 'sentiero');
  for(let y=14;y<18;y++) for(let x=43;x<m.w;x++) m.obj[W.idx(m,x,y)]=null;
  warp(m, m.w-1, 14, 1, 4, 'fioralba', 22, 33, 'Fioralba');

  m.npc = [
    { id:'serafina', x:9, y:17, home:[9,17], giro:[[9,17],[11,18],[7,18]] },
    { id:'fiammella', x:38, y:36, home:[38,36], giro:[[38,36]], fisso:true, richiedePonte:true }
  ];
  return m;
}

/* ===================================================================
   GROTTA — la miniera
   =================================================================== */
function buildGrotta(){
  const m = mkMap('grotta','Miniera di Fioralba', 38, 30, {
    esterno:false, musica:'grotta', ambiente:'goccia', sfondo:'#14120f'
  });
  const R = rnd(777);

  fill(m, 0,0, m.w,m.h, 'roccia');
  // caverne
  const centri = [[18,25],[12,20],[24,19],[8,13],[19,12],[29,15],[14,6],[26,7],[20,4]];
  for(const c of centri) blob(m, c[0], c[1], 4.5+R()*2.5, 'grotta', R, 0.5);
  // corridoi
  for(let i=0;i<centri.length-1;i++){
    linea(m, centri[i][0],centri[i][1], centri[i+1][0],centri[i+1][1], 3, 'grotta');
  }
  linea(m, 18,25, 18,28, 3, 'grotta');
  // pozza sotterranea
  blob(m, 30, 22, 3.5, 'acqua', R, 0.3);
  linea(m, 24,19, 30,22, 3, 'grotta');

  /* minerali */
  const tabella = [
    ['pietra',0.42],['rame',0.20],['ferro',0.14],['carbone',0.09],
    ['quarzo',0.07],['ametista',0.04],['oro',0.03],['geode',0.01]
  ];
  for(let i=0;i<190;i++){
    const x=1+((R()*(m.w-2))|0), y=1+((R()*(m.h-2))|0);
    if(!libero(m,x,y)) continue;
    if(W.terreno(m,x,y)!=='grotta') continue;
    const r=R(); let acc=0, kind='pietra';
    for(const t of tabella){ acc+=t[1]; if(r<acc){ kind=t[0]; break; } }
    if(kind==='carbone') setObj(m,x,y,{t:'sasso', kind:'pietra', carbone:true, hp:2, solido:true});
    else setObj(m,x,y, sasso(kind));
  }
  // funghi luminosi
  for(let i=0;i<24;i++){
    const x=1+((R()*(m.w-2))|0), y=1+((R()*(m.h-2))|0);
    if(libero(m,x,y) && W.terreno(m,x,y)==='grotta') m.deco.push({t:'fungo_luce', x, y, v:(R()*3)|0});
  }
  // stalagmiti
  for(let i=0;i<18;i++){
    const x=1+((R()*(m.w-2))|0), y=1+((R()*(m.h-2))|0);
    if(libero(m,x,y) && W.terreno(m,x,y)==='grotta') setObj(m,x,y,{t:'stalagmite', v:(R()*3)|0, solido:true});
  }

  /* uscita verso il paese */
  fill(m, 16,27, 4,3, 'grotta');
  for(let y=27;y<30;y++) for(let x=16;x<20;x++) m.obj[W.idx(m,x,y)]=null;
  warp(m, 16, m.h-1, 4, 1, 'fioralba', 22, 2, 'Fioralba');
  m.deco.push({t:'cartello', x:15, y:26, testo:'↓ Uscita'});

  /* Scala che scende alla Miniera Profonda.

     Era un varco da UNA casella, e il passaggio scatta quando il centro
     del giocatore ci finisce dentro: bisognava azzeccare trentadue
     pixel in fondo a un corridoio stretto. Segnalato in beta come «si
     attraversa solo in un punto particolare», ed era esattamente così.
     Adesso il gradino è largo due caselle e intorno c'è un pianerottolo
     sgombro, così ci si arriva da più parti. */
  blob(m, 6, 23, 2.6, 'grotta', R, 0.3);
  linea(m, 8,13, 6,23, 3, 'grotta');
  fill(m, 6,23, 2,1, 'lastre');
  warp(m, 6, 23, 2, 1, 'grotta2', 6, 24, 'Miniera Profonda');
  m.deco.push({t:'cartello', x:5, y:21, testo:'↓ Giù'});

  /* passaggio a nord: sbuca sul Passo innevato */
  fill(m, 18,0, 3,2, 'grotta');
  for(let y=0;y<2;y++) for(let x=18;x<21;x++) m.obj[W.idx(m,x,y)]=null;
  linea(m, 19,1, 20,4, 3, 'grotta');
  warp(m, 18, 0, 3, 1, 'montagna', 20, 34, 'Passo');
  m.deco.push({t:'cartello', x:17, y:3, testo:'↑ Passo'});

  // scale, passaggi e atterraggi sgombri e protetti dalla rigenerazione
  m.scaleClear = [[6,22],[7,22],[6,23],[7,23],[6,24],[7,24],[5,23],[5,24],
                  [18,0],[19,0],[20,0],[19,1],[19,2],[19,3],[20,3]];
  for(const [cx,cy] of m.scaleClear) if(W.dentro(m,cx,cy)) m.g[W.idx(m,cx,cy)]=ti('grotta');
  W.pulisciScale(m);
  m.ingresso = [17,26];                   // dove si entra venendo dal bosco
  W.apriPassaggi(m, m.ingresso[0], m.ingresso[1]);

  return m;
}

/* ===================================================================
   MINIERA PROFONDA — livelli 2 e 3 (roccia + grotta, minerali ricchi)
   =================================================================== */
function buildMinieraProfonda(id, nome, seed, profondo){
  const m = mkMap(id, nome, 40, 32, {
    esterno:false, musica:'grotta', ambiente:'goccia', sfondo: profondo?'#0f0d0b':'#131110'
  });
  const R = rnd(seed);

  fill(m, 0,0, m.w,m.h, 'roccia');
  const centri = [[6,4],[10,10],[20,7],[30,10],[34,18],[26,22],[16,20],[8,24],[20,27],[12,15]];
  for(const c of centri) blob(m, c[0], c[1], 4.5+R()*3, 'grotta', R, 0.5);
  for(let i=0;i<centri.length-1;i++)
    linea(m, centri[i][0],centri[i][1], centri[i+1][0],centri[i+1][1], 3, 'grotta');
  // pozze sotterranee
  blob(m, 33, 24, 3.2, 'acqua', R, 0.3);
  blob(m, 7, 8, 2.4, 'acqua', R, 0.3);
  linea(m, 26,22, 33,24, 3, 'grotta');

  W.rigeneraMiniera(m, seed^0x9e37, profondo);

  // stalagmiti e funghi luminosi
  for(let i=0;i<22;i++){
    const x=1+((R()*(m.w-2))|0), y=1+((R()*(m.h-2))|0);
    if(libero(m,x,y) && W.terreno(m,x,y)==='grotta') setObj(m,x,y,{t:'stalagmite', v:(R()*3)|0, solido:true});
  }
  for(let i=0;i<26;i++){
    const x=1+((R()*(m.w-2))|0), y=1+((R()*(m.h-2))|0);
    if(libero(m,x,y) && W.terreno(m,x,y)==='grotta') m.deco.push({t:'fungo_luce', x, y, v:(R()*3)|0});
  }

  // zone di scala camminabili e sgombre (protette dalla rigenerazione notturna)
  m.scaleClear = profondo
    ? [[6,3],[7,3],[6,4],[7,4],[6,5],[5,4]]
    : [[6,3],[7,3],[6,4],[7,4],[6,5],[5,4],[20,27],[21,27],[20,28],[21,28],[20,26],[19,28]];
  m.ingresso = [6,4];                     // dove si atterra scendendo
  for(const [cx,cy] of m.scaleClear) if(W.dentro(m,cx,cy)) m.g[W.idx(m,cx,cy)]=ti('grotta');
  W.pulisciScale(m);

  /* scala che risale — larga due caselle, come quella che scende */
  fill(m, 6,3, 2,1, 'lastre');
  warp(m, 6, 3, 2, 1, profondo?'grotta2':'grotta', profondo?20:6, profondo?27:24, 'Su');
  m.deco.push({t:'cartello', x:5, y:2, testo:'↑ Su'});

  /* scala che scende ancora (solo dal livello 2) */
  if(!profondo){
    fill(m, 20,28, 2,1, 'lastre');
    warp(m, 20, 28, 2, 1, 'grotta3', 6, 4, 'Cuore della Miniera');
    m.deco.push({t:'cartello', x:19, y:26, testo:'↓ Ancora giù'});
  }

  W.apriPassaggi(m, m.ingresso[0], m.ingresso[1]);
  return m;
}

/* tiene sgombre le caselle di scala/atterraggio dopo ogni rigenerazione */
W.pulisciScale = function(m){
  if(!m || !m.scaleClear) return;
  for(const [x,y] of m.scaleClear) if(W.dentro(m,x,y)) m.obj[W.idx(m,x,y)]=null;
};

/* ===================================================================
   APRIRE I PASSAGGI NELLA MINIERA

   I sassi si spaccano col piccone, quindi in teoria nessuna miniera è
   chiusa. In pratica lo era: sui livelli profondi si spargono settanta
   sassi dentro corridoi larghi tre caselle, e basta un sasso nel punto
   sbagliato per tagliare in due il livello. Misurato: dall'ingresso del
   secondo livello si raggiungevano *quattordici* caselle su
   trecentoventotto — il 4% — e la scala per il terzo livello stava
   dall'altra parte del tappo. Il primo livello, che di sassi ne ha molti
   meno, stava al 74%: è quella la differenza fra una miniera che si
   esplora e una che sembra rotta.

   Qui si tolgono i sassi che *chiudono* una zona, e soltanto quelli: si
   guarda cosa si raggiunge camminando, si trovano le sacche di grotta
   rimaste fuori, e per ognuna si apre il varco più corto. Il minerale
   in mezzo alle sale resta dov'è — sparisce il tappo, non la miniera.
   =================================================================== */
const DIR4 = [[1,0],[-1,0],[0,1],[0,-1]];

W.apriPassaggi = function(m, ix, iy){
  if(!m || !W.dentro(m, ix, iy)) return 0;
  const cava = (x,y)=>{ const t=W.terreno(m,x,y); return t!=='roccia' && t!=='vuoto'; };
  const rompibile = (x,y)=>{ const o=m.obj[W.idx(m,x,y)]; return !!(o && (o.t==='sasso' || o.t==='stalagmite')); };
  const passa = (x,y)=> cava(x,y) && !W.solido(m,x,y);
  const SACCA_MINIMA = 5;      // una nicchia da quattro caselle può restare chiusa
  let aperti = 0;

  for(let giro=0; giro<80; giro++){
    // 1. dove si arriva camminando
    const zona = new Set([ix+','+iy]);
    const q = [[ix,iy]];
    while(q.length){
      const [x,y] = q.shift();
      for(const [dx,dy] of DIR4){
        const nx=x+dx, ny=y+dy, k=nx+','+ny;
        if(zona.has(k) || !W.dentro(m,nx,ny) || !passa(nx,ny)) continue;
        zona.add(k); q.push([nx,ny]);
      }
    }
    // 2. la sacca di grotta più grande rimasta fuori
    const fatte = new Set();
    let sacca = null;
    for(let y=0;y<m.h && !sacca;y++) for(let x=0;x<m.w;x++){
      const k = x+','+y;
      if(zona.has(k) || fatte.has(k) || !passa(x,y)) continue;
      const comp = [], cq=[[x,y]]; fatte.add(k);
      while(cq.length){
        const [cx,cy] = cq.shift(); comp.push([cx,cy]);
        for(const [dx,dy] of DIR4){
          const nx=cx+dx, ny=cy+dy, kk=nx+','+ny;
          if(fatte.has(kk) || !W.dentro(m,nx,ny) || !passa(nx,ny)) continue;
          fatte.add(kk); cq.push([nx,ny]);
        }
      }
      if(comp.length >= SACCA_MINIMA){ sacca = comp; break; }
    }
    if(!sacca) break;                       // non è rimasto niente da aprire

    /* 3. il varco più corto: una visita che può attraversare i sassi
       pagandoli uno, e che si ferma appena tocca la sacca. */
    const meta = new Set(sacca.map(([x,y])=>x+','+y));
    const costo = new Map([[ix+','+iy, 0]]);
    const padre = new Map();
    const coda = [[ix,iy]];                 // coda a due teste, costi 0 e 1
    let arrivo = null;
    while(coda.length && !arrivo){
      const [x,y] = coda.shift();
      const c = costo.get(x+','+y);
      for(const [dx,dy] of DIR4){
        const nx=x+dx, ny=y+dy, k=nx+','+ny;
        if(!W.dentro(m,nx,ny) || !cava(nx,ny)) continue;
        if(W.solido(m,nx,ny) && !rompibile(nx,ny)) continue;   // muro vero: non si passa
        const nc = c + (rompibile(nx,ny) ? 1 : 0);
        if(costo.has(k) && costo.get(k) <= nc) continue;
        costo.set(k, nc); padre.set(k, x+','+y);
        if(nc === c) coda.unshift([nx,ny]); else coda.push([nx,ny]);
        if(meta.has(k)){ arrivo = k; break; }
      }
    }
    if(!arrivo) break;                      // sacca murata sul serio: si lascia stare
    // 4. si tolgono i sassi lungo il varco, e solo quelli
    let k = arrivo;
    while(k){
      const [x,y] = k.split(',').map(Number);
      if(rompibile(x,y)){ m.obj[W.idx(m,x,y)] = null; aperti++; }
      k = padre.get(k);
    }
  }
  return aperti;
};

/* rigenera i minerali di una miniera (build + ogni notte) */
W.rigeneraMiniera = function(m, seed, profondo){
  const R = rnd((seed>>>0)||1);
  for(let i=0;i<m.obj.length;i++){ if(m.obj[i] && m.obj[i].t==='sasso') m.obj[i]=null; }
  const tab = profondo
    ? [['pietra',0.30],['ferro',0.20],['carbone',0.10],['quarzo',0.10],['ametista',0.12],['oro',0.10],['geode',0.05],['rame',0.03]]
    : [['pietra',0.38],['rame',0.16],['ferro',0.16],['carbone',0.09],['quarzo',0.09],['ametista',0.06],['oro',0.04],['geode',0.02]];
  const obiettivo = profondo?70:60;
  let messi=0, tent=0;
  while(messi<obiettivo && tent<2500){
    tent++;
    const x=1+((R()*(m.w-2))|0), y=1+((R()*(m.h-2))|0);
    if(!libero(m,x,y) || W.terreno(m,x,y)!=='grotta') continue;
    const r=R(); let acc=0, kind='pietra';
    for(const t of tab){ acc+=t[1]; if(r<acc){ kind=t[0]; break; } }
    if(kind==='carbone') setObj(m,x,y,{t:'sasso', kind:'pietra', carbone:true, hp:2, solido:true});
    else setObj(m,x,y, sasso(kind));
    messi++;
  }
  W.pulisciScale(m);
};

/* rigenera il foraggio invernale della montagna */
W.rigeneraMontagna = function(m, seed){
  const R = rnd((seed>>>0)||1);
  for(let i=0;i<m.obj.length;i++){ if(m.obj[i] && m.obj[i].t==='foraggio') m.obj[i]=null; }
  const inv = ['bacca_inverno','radice_gelata','fiocco_cristallo'];
  let messi=0, tent=0;
  while(messi<9 && tent<700){
    tent++;
    const x=1+((R()*(m.w-2))|0), y=1+((R()*(m.h-2))|0);
    if(!libero(m,x,y) || W.terreno(m,x,y)!=='neve') continue;
    setObj(m,x,y,{t:'foraggio', item:inv[(R()*inv.length)|0]});
    messi++;
  }
};

/* rigenera quello che il mare porta a riva, ogni notte

   La Costa aveva una cosa sola da fare, pescare, e per il resto era da
   guardare: novecentosettantotto caselle di sabbia con ventun oggetti
   sopra, sempre quelli. Adesso ogni mattina la marea lascia qualcosa
   sulla battigia — conchiglie, telline, granchi fra gli scogli, e il
   legname che il mare restituisce.

   Solo sulla BATTIGIA, cioè la sabbia che tocca l'acqua: sparpagliarla
   su tutta la spiaggia l'avrebbe fatta sembrare roba caduta, non roba
   portata, e soprattutto avrebbe tolto la ragione di camminare lungo la
   riva. Le pozze di marea contano come acqua, quindi ne compare anche
   attorno a quelle, che è il posto dove uno le cercherebbe.

   Si toglie solo quello che aveva messo la marea di ieri (`marea:true`)
   e non tutti i rami: sulla spiaggia c'è anche il legname scritto nella
   mappa, e ripulire alla cieca l'avrebbe cancellato la prima notte. */
W.rigeneraCosta = function(m, seed){
  if(!m) return;
  const R = rnd((seed>>>0)||1);
  for(let i=0;i<m.obj.length;i++){ const o=m.obj[i]; if(o && o.marea) m.obj[i]=null; }

  const battigia = (x,y)=>{
    if(W.terreno(m,x,y)!=='sabbia') return false;
    for(const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0],[1,1],[-1,1],[1,-1],[-1,-1]])
      if(W.terreno(m,x+dx,y+dy)==='acqua') return true;
    return false;
  };
  /* Le conchiglie sono le più comuni e il granchio il più raro: chi
     passa tutte le mattine deve trovare quasi sempre qualcosa e ogni
     tanto qualcosa che vale. */
  const roba = ['conchiglia','conchiglia','conchiglia','tellina','tellina','granchio'];

  let messi=0, tent=0;
  while(messi<8 && tent<900){
    tent++;
    const x=1+((R()*(m.w-2))|0), y=1+((R()*(m.h-2))|0);
    if(!libero(m,x,y) || !battigia(x,y)) continue;
    setObj(m,x,y,{t:'foraggio', item:roba[(R()*roba.length)|0], marea:true});
    messi++;
  }
  let legni=0; tent=0;
  while(legni<3 && tent<400){
    tent++;
    const x=1+((R()*(m.w-2))|0), y=1+((R()*(m.h-2))|0);
    if(!libero(m,x,y) || !battigia(x,y)) continue;
    setObj(m,x,y,{t:'ramo', v:(R()*3)|0, marea:true});
    legni++;
  }

  /* Ogni tanto, una BOTTIGLIA chiusa. Non ha `marea` addosso, di
     proposito: una bottiglia vista di sfuggita e ripescata il giorno
     dopo deve essere ancora lì — la marea porta, ma un messaggio non se
     lo riprende. E finché ce n'è una da aprire non ne arriva un'altra:
     due bottiglie sulla stessa spiaggia farebbero collezione, e queste
     sono apparizioni. */
  let cera=false;
  for(const o of m.obj) if(o && o.t==='bottiglia'){ cera=true; break; }
  if(!cera && R()<0.35){
    let t2=0;
    while(t2<300){
      t2++;
      const x=1+((R()*(m.w-2))|0), y=1+((R()*(m.h-2))|0);
      if(!libero(m,x,y) || !battigia(x,y)) continue;
      setObj(m,x,y,{t:'bottiglia'});
      break;
    }
  }
};

/* ===================================================================
   MONTAGNA — il Passo Innevato
   =================================================================== */
function buildMontagna(){
  const m = mkMap('montagna','Passo Innevato', 44, 38, {
    musica:'primavera', ambiente:'uccelli', sfondo:'#5a6470'
  });
  const R = rnd(31337);
  fill(m, 0,0, m.w,m.h, 'neve');
  for(let x=0;x<m.w;x++){ setObj(m,x,0,albero('pino')); setObj(m,x,m.h-1,albero('pino')); }
  for(let y=0;y<m.h;y++){ setObj(m,0,y,albero('pino')); setObj(m,m.w-1,y,albero('pino')); }
  // apri l'uscita a sud (verso la miniera)
  for(let x=18;x<23;x++) m.obj[W.idx(m,x,m.h-1)]=null;
  fill(m, 18,m.h-3, 5,3, 'lastre');

  // pareti rocciose
  for(const c of [[10,8],[34,10],[22,6],[8,26],[36,28]]) blob(m, c[0],c[1], 3.5+R()*2, 'roccia', R, 0.5);
  // laghetto ghiacciato con sponda di ghiaccio
  blob(m, 14, 20, 4, 'acqua', R, 0.35);
  for(let y=14;y<28;y++) for(let x=6;x<24;x++){
    if(W.terreno(m,x,y)!=='neve') continue;
    let vic=false; for(let d=0;d<4;d++) if(W.terreno(m,x+[1,-1,0,0][d],y+[0,0,1,-1][d])==='acqua') vic=true;
    if(vic) m.g[W.idx(m,x,y)]=ti('lastre');
  }

  linea(m, 20,m.h-3, 22,20, 3, 'sentiero');
  linea(m, 22,20, 30,14, 3, 'sentiero');

  // rifugio dell'eremita
  edificio(m,'cottage', 28,10, 5,4, { porta:{x:30,y:13}, azione:'eremita', nome:'Rifugio dell\'Eremita' });

  // minerali rari sulla neve
  const tab=[['ferro',0.30],['quarzo',0.20],['ametista',0.20],['oro',0.18],['geode',0.12]];
  for(let i=0;i<26;i++){
    const x=2+((R()*(m.w-4))|0), y=2+((R()*(m.h-4))|0);
    if(!libero(m,x,y) || W.terreno(m,x,y)!=='neve') continue;
    const r=R(); let acc=0, kind='ferro';
    for(const q of tab){ acc+=q[1]; if(r<acc){ kind=q[0]; break; } }
    setObj(m,x,y, sasso(kind));
  }
  // foraggio invernale
  W.rigeneraMontagna(m, 31337^0x55);
  // vegetazione innevata
  for(let i=0;i<44;i++){
    const x=2+((R()*(m.w-4))|0), y=2+((R()*(m.h-4))|0);
    if(!libero(m,x,y) || W.terreno(m,x,y)!=='neve') continue;
    const r=R();
    if(r<0.4) setObj(m,x,y, albero('pino'));
    else if(r<0.6) setObj(m,x,y, {t:'cespuglio', v:(R()*3)|0, bacche:false});
    else if(r<0.8) setObj(m,x,y, {t:'ramo', v:(R()*3)|0});
    else m.deco.push({t:'sassolini', x, y, v:(R()*3)|0});
  }
  // pulisci il sentiero
  sgombra(m, 'sentiero');
  // zona d'ingresso dalla miniera sgombra
  for(let yy=32;yy<=35;yy++) for(let xx=18;xx<23;xx++) if(W.dentro(m,xx,yy)) m.obj[W.idx(m,xx,yy)]=null;

  warp(m, 18, m.h-1, 5, 1, 'grotta', 19, 3, 'Miniera');
  m.deco.push({t:'cartello', x:17, y:m.h-4, testo:'↓ Miniera'});

  m.npc = [ { id:'eremita', x:26, y:15, home:[26,15], giro:[[26,15],[24,16],[28,14]] } ];
  return m;
}

/* ===================================================================
   SPIAGGIA — la Costa
   =================================================================== */
function buildSpiaggia(){
  const m = mkMap('spiaggia','La Costa', 46, 34, {
    musica:'primavera', ambiente:'uccelli', sfondo:'#4a6a78'
  });
  const R = rnd(7777);
  fill(m, 0,0, m.w,m.h, 'sabbia');
  // mare in basso, con costa ondulata
  for(let y=0;y<m.h;y++) for(let x=0;x<m.w;x++){
    const costa = 20 + Math.round(Math.sin(x*0.18)*2.4);
    if(y > costa) m.g[W.idx(m,x,y)] = ti('acqua');
  }
  // alberi in alto e ai lati (parte a terra)
  for(let x=0;x<m.w;x++) setObj(m,x,0,albero('pino'));
  for(let y=0;y<10;y++){ setObj(m,0,y,albero('pino')); setObj(m,m.w-1,y,albero('pino')); }

  // molo di legno che entra nel mare
  fill(m, 22,17, 2,11, 'assi');
  for(let y=17;y<28;y++) for(let x=22;x<24;x++) m.obj[W.idx(m,x,y)]=null;
  m.deco.push({t:'cartello', x:25, y:18, testo:'Molo'});

  /* Il molo si legge come molo solo se ha dei pali: le sole assi, viste
     dall'alto, sono una striscia di legno che potrebbe essere qualunque
     cosa — a schermo sembrava una colonna di mattoni. Le casse in fondo
     e il lampione a metà gli danno un verso e una fine. */
  setObj(m, 22, 27, {t:'casse', solido:true, v:1});
  setObj(m, 23, 22, {t:'lampione', solido:false});

  /* Una barca tirata in secca vicino al molo, e due ormeggiate. La costa
     era 978 caselle di sabbia con ventun oggetti sopra: da dentro non
     era una spiaggia, era un deserto con un pontile. */
  setObj(m, 19, 19, {t:'barca', solido:true});
  setObj(m, 26, 24, {t:'barca', solido:true});
  setObj(m, 29, 22, {t:'barca', solido:true});

  /* --- LE DUNE ---
     L'erba che tiene la sabbia, più fitta sotto la pineta e sempre più
     rada scendendo verso la battigia: è quello che fa sembrare una
     spiaggia una spiaggia invece di un foglio beige. Non è solo
     decorazione — sono erbacce e cespugli veri, quindi la falce ci
     lavora e ci si trova della fibra. */
  for(let i=0;i<190;i++){
    const x=1+((R()*(m.w-2))|0), y=1+((R()*19)|0);
    if(!libero(m,x,y) || W.terreno(m,x,y)!=='sabbia') continue;
    // più vicino agli alberi, più fitta: a metà spiaggia si dirada
    const vicinanza = 1 - Math.min(1, y/19);
    if(R() > 0.18 + vicinanza*0.72) continue;
    const r=R();
    if(r<0.62)      setObj(m,x,y, {t:'erbaccia', v:(R()*3)|0});
    else if(r<0.86) setObj(m,x,y, {t:'cespuglio', v:(R()*3)|0});
    else            m.deco.push({t:'sassolini', x, y, v:(R()*3)|0});
  }

  /* --- LE POZZE DI MAREA ---
     Quattro conche d'acqua rimaste a riva, con i sassi intorno. Sono il
     posto dove uno si ferma a guardare, e il gioco sa già disegnarle:
     l'acqua ha i suoi raccordi dentellati e la sua schiuma, che qui
     cadono a pennello perché la pozza è piccola e tutta bordo. */
  for(const [px0,py0,pw,ph] of [[7,15,3,2],[13,17,2,2],[33,16,3,2],[39,18,2,2]]){
    for(let y=py0;y<py0+ph;y++) for(let x=px0;x<px0+pw;x++){
      if(!W.dentro(m,x,y) || W.terreno(m,x,y)!=='sabbia') continue;
      m.g[W.idx(m,x,y)]=ti('acqua'); m.obj[W.idx(m,x,y)]=null;
    }
    for(const [sx0,sy0] of [[px0-1,py0-1],[px0+pw,py0+ph],[px0-1,py0+ph],[px0+pw,py0-1]])
      if(libero(m,sx0,sy0) && W.terreno(m,sx0,sy0)==='sabbia') setObj(m,sx0,sy0, sasso('pietra'));
  }

  // legname portato dal mare, sassi e conchiglie
  for(let i=0;i<40;i++){
    const x=2+((R()*(m.w-4))|0), y=2+((R()*18)|0);
    if(!libero(m,x,y) || W.terreno(m,x,y)!=='sabbia') continue;
    const r=R();
    if(r<0.35) setObj(m,x,y, {t:'ramo', v:(R()*3)|0});
    else if(r<0.55) setObj(m,x,y, sasso('pietra'));
    else m.deco.push({t:'sassolini', x, y, v:(R()*3)|0});
  }

  // uscita a nord → Piazza
  for(let x=21;x<26;x++){ m.obj[W.idx(m,x,0)]=null; m.g[W.idx(m,x,0)]=ti('sabbia'); m.obj[W.idx(m,x,1)]=null; }
  warp(m, 21, 0, 5, 1, 'piazza', 24, 30, 'Piazza');
  m.deco.push({t:'cartello', x:20, y:2, testo:'↑ Piazza'});

  // la prima marea: chi ci arriva il primo giorno trova già qualcosa
  W.rigeneraCosta(m, 7777^0x55);
  return m;
}

/* ===================================================================
   PIAZZA DEL PORTO — ampliamento del paese
   =================================================================== */
function buildPiazza(){
  const m = mkMap('piazza','Piazza del Porto', 40, 34, {
    musica:'paese', ambiente:'uccelli', sfondo:'#3a4738'
  });
  const R = rnd(2025);
  fill(m, 0,0, m.w,m.h, 'erba');
  for(let y=6;y<26;y++) for(let x=6;x<34;x++){
    if(Math.abs(x-20)*0.8 + Math.abs(y-16) < 15) m.g[W.idx(m,x,y)]=ti('lastre');
  }
  for(let x=0;x<m.w;x++){ setObj(m,x,0,albero('pino')); }
  for(let y=0;y<m.h;y++){ setObj(m,0,y,albero('pino')); setObj(m,m.w-1,y,albero('pino')); }

  // fontana centrale
  fill(m, 18,14, 4,4, 'acqua');
  m.deco.push({t:'fontana', x:18, y:14});
  for(let y=14;y<18;y++) for(let x=18;x<22;x++) m.obj[W.idx(m,x,y)]={t:'fontana', solido:true};

  /* --- IL PORTO CHE MANCAVA ---

     Si chiamava «Piazza del Porto» e un porto non ce l'aveva: 445
     caselle di lastre, la fontana in mezzo, e tutto il resto spinto ai
     bordi in simmetria perfetta — due bancarelle, quattro panchine,
     quattro fioriere, quattro casse, sei lampioni, ognuna col suo
     gemello dall'altra parte. Da dentro sembrava un parcheggio, e il
     nome prometteva una cosa che non si vedeva da nessuna parte.

     L'insenatura sta a levante e scende fino al bordo sud, dalla parte
     in cui si esce verso la Costa: così l'acqua della piazza e il mare
     della spiaggia si leggono come la stessa acqua invece che come due
     pozze scollegate su due mappe. */
  for(let y=6;y<m.h;y++) for(let x=34;x<m.w;x++){
    const i=W.idx(m,x,y); m.g[i]=ti('acqua'); m.obj[i]=null;
  }
  /* LA BANCHINA È LA PIAZZA STESSA, in pietra, fino al filo dell'acqua.
     Il primo tentativo ci metteva una striscia di assi larga due
     caselle, e a schermo si leggeva come un muro di mattoni: la texture
     del legno è a doghe orizzontali, e una fascia verticale di doghe
     sembra muratura, non un pontile. Le lastre invece continuano il
     lastricato e il bordo lo disegna l'acqua, che ha già i suoi
     raccordi dentellati e la sua spuma. */
  fill(m, 30,6, 4, m.h-6, 'lastre');
  for(let y=6;y<m.h;y++) for(let x=30;x<34;x++) m.obj[W.idx(m,x,y)]=null;

  /* Le barche stanno ORMEGGIATE CONTRO LA BANCHINA, nella prima colonna
     d'acqua. Il tentativo di mezzo ci metteva dei pontili di legno che
     entravano in acqua, due caselle a testa: a schermo diventavano una
     macchia marrone, perché il raccordo dentellato dell'acqua si mangia
     i bordi di una toppa così piccola e del pontile restava un grumo.
     Una barca accostata alla pietra si legge da sola, ed è anche come
     stanno le barche in un porto vero.

     A distanze disuguali: uguali e spaziate a compasso tornerebbero a
     fare l'effetto parcheggio, che è il difetto da cui nasce tutto
     questo. */
  for(const [bx,by] of [[34,11],[34,18],[34,27]]) setObj(m,bx,by,{t:'barca', solido:true});

  /* Il carico sta sulla banchina, ammucchiato dove serve: davanti alle
     barche, non ai quattro angoli della piazza. */
  for(const p of [[30,9],[30,10],[29,16],[30,20],[30,21],[29,28]])
    if(libero(m,p[0],p[1])) setObj(m,p[0],p[1],{t:'casse', solido:true, v:(R()*3)|0});
  for(const p of [[30,13],[30,25],[10,10],[20,8],[12,23]])
    if(libero(m,p[0],p[1])) setObj(m,p[0],p[1],{t:'lampione', solido:false});

  /* Le panchine guardano la fontana o l'acqua, e stanno dove uno si
     siederebbe: due davanti alla fontana, una sulla banchina a guardare
     le barche. Prima erano quattro ai vertici di un quadrato. */
  for(const p of [[16,19,0],[24,19,0],[29,12,1],[13,13,1]])
    if(libero(m,p[0],p[1])) setObj(m,p[0],p[1],{t:'panchina', solido:true, dir:p[2]});
  for(const p of [[15,12],[25,12],[14,22],[22,25],[18,25]])
    if(libero(m,p[0],p[1])) setObj(m,p[0],p[1],{t:'fioriera', solido:true, v:(R()*4)|0});

  /* Il mercato: una fila di banchi lungo il lato di ponente, che è la
     parte che restava vuota. Il paese ci vende quello che arriva dal
     mare, ed è la ragione per cui una piazza sta attaccata a un porto. */
  for(let k=0;k<4;k++){
    const bx=9, by=11+k*4;
    if(libero(m,bx,by)) setObj(m,bx,by,{t:'bancarella', solido:true, v:k%2});
  }
  m.deco.push({t:'cartello', x:8, y:9, testo:'Mercato del pesce'});

  // BACHECA delle richieste e BANCO del mercante (bancarelle interattive)
  setObj(m, 12,15, {t:'bancarella', solido:true, v:0, kiosk:'bacheca'});
  m.deco.push({t:'cartello', x:11, y:13, testo:'Bacheca'});
  setObj(m, 28,15, {t:'bancarella', solido:true, v:1, kiosk:'mercante'});
  m.deco.push({t:'cartello', x:27, y:13, testo:'Banco del mercante'});

  /* Le casse sparse per la piazza: quelle del carico stanno già sulla
     banchina, queste sono le due o tre che avanzano in giro. */
  for(const p of [[13,19],[27,11],[26,23]]) if(libero(m,p[0],p[1])) setObj(m,p[0],p[1],{t:'casse', solido:true, v:(R()*3)|0});

  // uscita a nord → Fioralba
  fill(m, 18,0, 4,2, 'sentiero');
  for(let y=0;y<2;y++) for(let x=18;x<22;x++) m.obj[W.idx(m,x,y)]=null;
  warp(m, 18, 0, 4, 1, 'fioralba', 31, 33, 'Fioralba');
  m.deco.push({t:'cartello', x:17, y:3, testo:'↑ Fioralba'});

  // uscita a sud → Spiaggia
  fill(m, 22,m.h-2, 4,2, 'sentiero');
  for(let y=m.h-2;y<m.h;y++) for(let x=22;x<26;x++) m.obj[W.idx(m,x,y)]=null;
  warp(m, 22, m.h-1, 4, 1, 'spiaggia', 23, 2, 'La Costa');
  m.deco.push({t:'cartello', x:21, y:m.h-4, testo:'↓ Costa'});

  return m;
}

/* ===================================================================
   INTERNI — le stanze in cui si entra davvero

   Prima ogni porta apriva un menu: la bottega era una finestra bianca,
   la locanda un elenco di piatti, casa tua un pulsante "vai a dormire".
   Adesso si entra, e dentro c'è qualcuno.

   Sono mappe come le altre, solo piccole e al chiuso (`esterno:false`,
   quindi la luce ambientale è quella delle grotte e servono lumi).

   Le prime stanze erano più piccole dello schermo, e si vedeva: una
   casa di bambole vista tutta in una volta, con mobili enormi in mezzo
   a un pavimento vuoto. Adesso sono più larghe della veduta, così la
   camera scorre e i mobili tornano della loro misura.

   E l'arredamento ha una regola, che prima non aveva: la roba sta sui
   muri, in file continue; i mobili grossi stanno in coppia o in griglia,
   mai da soli in mezzo; e fra la porta e il bancone ci deve passare una
   persona. Tre regole banali, ma sono la differenza fra una stanza e un
   magazzino svaligiato.
   =================================================================== */

/* Una fila di scaffali lungo un muro, interrotta ogni tanto da un lume:
   è il ritmo che fa sembrare arredato un muro. */
function filaScaffali(m, x0, x1, y, passoLume){
  for(let x=x0; x<=x1; x++){
    if(passoLume && (x-x0) % passoLume === passoLume-1) setObj(m, x, y, {t:'lume', solido:false});
    else setObj(m, x, y, {t:'scaffale', solido:true, v:(x*3+y)%3});
  }
}

/* Una catasta ordinata in un angolo, non casse buttate qua e là. */
function catasta(m, x, y, w, h){
  for(let j=0;j<h;j++) for(let i=0;i<w;i++) setObj(m, x+i, y+j, {t:'casse', solido:true, v:(i+j*2)%3});
}

/* Un tavolo con le sue panche, sopra e sotto: un posto dove si siede
   della gente, non un tavolo che galleggia. */
function tavolata(m, x, y){
  setObj(m, x, y, {t:'tavolo', solido:true});
  setObj(m, x, y-1, {t:'panchina', solido:true, dir:0});
  setObj(m, x, y+1, {t:'panchina', solido:true, dir:0});
}

function stanza(id, nome, w, h, opt){
  const m = mkMap(id, nome, w, h, {
    esterno:false, musica:opt.musica||'paese', ambiente:null,
    sfondo: opt.sfondo || '#231a12'
  });
  // il pavimento occupa tutto tranne la cornice, che resta vuota (solida)
  fill(m, 0,0, w,h, 'vuoto');
  fill(m, 1,1, w-2,h-2, opt.pavimento || 'assi');
  // la parete di fondo, disegnata sopra la prima riga di pavimento
  m.deco.push({t:'parete', x:1, y:1, w:w-2, stile:opt.parete||'legno'});
  m.interno = true;
  return m;
}

/* porta di uscita: una casella su cui si torna fuori */
function uscita(m, x, y, verso, tx, ty){
  m.g[W.idx(m,x,y)] = ti('lastre');
  m.obj[W.idx(m,x,y)] = null;
  warp(m, x, y, 1, 1, verso, tx, ty, 'Fuori');
  m.deco.push({t:'zerbino', x, y});
}

/* ---------- LA BOTTEGA DI BRUNO ----------
   Una bottega vera è tre cose: un muro di roba in vendita, un bancone
   fra chi vende e chi compra, e un pezzo di pavimento libero dove il
   cliente sta in piedi a decidere. */
function buildBottega(){
  const m = stanza('int_bottega','Bottega di Bruno', 21, 14, { pavimento:'assi', sfondo:'#2a1d12' });
  filaScaffali(m, 2, 18, 2, 6);                   // il muro di merce, coi lumi nel ritmo
  catasta(m, 2, 4, 1, 2);                         // scorte impilate, negli angoli
  catasta(m, 17, 4, 2, 2);
  catasta(m, 8, 6, 3, 1);                         // il banco delle offerte, in mezzo
  for(let x=5;x<=14;x++)                          // il bancone, lungo e continuo
    setObj(m, x, 8, {t:'bancone', solido:true, uso:'bottega', v:x%3});
  setObj(m, 4, 8, {t:'casse', solido:true, v:0});  // il banco finisce contro qualcosa
  setObj(m, 15, 8, {t:'casse', solido:true, v:2});
  m.deco.push({t:'tappeto', x:8, y:10, w:4, h:2}); // dove sta il cliente a decidere
  setObj(m, 2, 11, {t:'fioriera', solido:true, v:2});
  setObj(m, 18, 11, {t:'fioriera', solido:true, v:1});
  setObj(m, 3, 9, {t:'lume', solido:false});
  setObj(m, 17, 9, {t:'lume', solido:false});
  m.deco.push({t:'cartello', x:4, y:11, testo:'«Se non ce l\'ho, probabilmente non ti serviva.»'});
  uscita(m, 10, 12, 'fioralba', 11, 15);
  m.npcInterno = ['bruno'];
  m.postiInterni = { bruno:[[6,7],[10,7],[13,7]] };   // dietro al bancone, per tutta la sua lunghezza
  return m;
}

/* ---------- LA FUCINA DI TOBIA ----------
   Qui il centro non è il bancone ma l'incudine, e tutto le gira intorno:
   la forgia dietro, il banco degli attrezzi di fianco, il ferro grezzo
   accatastato lontano dal fuoco. */
function buildFucina(){
  const m = stanza('int_fucina','Fucina di Tobia', 19, 14, { pavimento:'cotto', parete:'pietra', sfondo:'#1e1712' });
  setObj(m, 4, 2, {t:'camino', solido:true});          // la forgia, contro il muro
  catasta(m, 2, 2, 2, 1);
  filaScaffali(m, 8, 16, 2, 5);                        // rastrelliera degli attrezzi
  setObj(m, 6, 5, {t:'incudine', solido:true, uso:'fucina'});   // il cuore della stanza
  setObj(m, 11, 5, {t:'tavolo', solido:true});         // banco da lavoro, in coppia
  setObj(m, 12, 5, {t:'tavolo', solido:true});
  catasta(m, 15, 6, 2, 3);                             // ferro grezzo, lontano dal fuoco
  catasta(m, 2, 8, 2, 2);                              // carbone
  setObj(m, 4, 10, {t:'panchina', solido:true, dir:0});// dove si siede a rifiatare
  catasta(m, 12, 9, 2, 1);                             // il lavoro finito, vicino all'uscita
  /* Quattro lumi e non due: il cotto è il pavimento più scuro del gioco
     e con due la metà bassa della stanza restava un pozzo nero. */
  for(const [x,y] of [[3,5],[8,8],[14,6],[15,10]]) setObj(m, x, y, {t:'lume', solido:false});
  m.deco.push({t:'cartello', x:12, y:10, testo:'«Il ferro va scaldato, non convinto.»'});
  uscita(m, 9, 12, 'fioralba', 29, 14);
  m.npcInterno = ['tobia'];
  m.postiInterni = { tobia:[[6,4],[5,5],[7,5]] };      // intorno all'incudine
  return m;
}

/* ---------- LA LOCANDA DEL TASSO STORTO ----------
   Due ambienti in una stanza sola: il bancone con le bottiglie dietro, e
   il camino con le sue panche, che è dove uno si siede se non ha voglia
   di parlare. In mezzo, la sala, con i tavoli in griglia e un corridoio
   che ci passa. */
function buildLocanda(){
  const m = stanza('int_locanda','Locanda del Tasso Storto', 23, 16, { pavimento:'assi', sfondo:'#2b1c10' });
  // il bancone e le bottiglie dietro
  filaScaffali(m, 13, 20, 2, 0);
  for(let x=13;x<=20;x++) setObj(m, x, 4, {t:'bancone', solido:true, uso:'locanda', v:x%3});
  setObj(m, 12, 4, {t:'casse', solido:true, v:0});
  // l'angolo del camino: due panche che si guardano, sul tappeto
  setObj(m, 3, 2, {t:'camino', solido:true});
  m.deco.push({t:'tappeto', x:3, y:4, w:3, h:3});
  setObj(m, 2, 5, {t:'panchina', solido:true, dir:0});
  setObj(m, 6, 5, {t:'panchina', solido:true, dir:0});
  // la sala: due file di tavolate, e in mezzo ci si passa
  for(const x of [4,9,14,19]) tavolata(m, x, 8);
  for(const x of [4,9,14,19]) tavolata(m, x, 12);
  catasta(m, 20, 6, 1, 2);
  for(const [x,y] of [[9,2],[2,9],[20,11]]) setObj(m, x, y, {t:'lume', solido:false});
  m.deco.push({t:'cartello', x:2, y:13, testo:'«Qui si mangia e si ascolta. In quest\'ordine.»'});
  uscita(m, 11, 14, 'fioralba', 18, 9);
  m.npcInterno = ['marisol','bruno','tobia','elio'];
  // ognuno al suo posto: Marisol dietro al banco, gli altri nel corridoio fra i tavoli
  m.postiInterni = {
    marisol:[[14,3],[17,3],[19,3]],
    bruno:  [[4,10],[5,10]],
    tobia:  [[9,10],[10,10]],
    elio:   [[14,10],[15,10]]
  };
  return m;
}

/* ---------- CASA DEL GIOCATORE ---------- */
function buildCasa(){
  const m = stanza('int_casa','Casa', 17, 13, { pavimento:'assi', sfondo:'#2a1e14', musica:'notte' });
  // la zona notte a sinistra, il fuoco e la cucina al centro, lo studio a destra
  setObj(m, 2, 2, {t:'letto', solido:true});
  m.deco.push({t:'tappeto', x:2, y:4, w:2, h:2});      // scendiletto
  setObj(m, 8, 2, {t:'camino', solido:true});
  setObj(m, 11, 2, {t:'cucina', solido:true});
  setObj(m, 12, 2, {t:'casse', solido:true, v:0});     // la dispensa, accanto alla cucina
  setObj(m, 14, 5, {t:'scrivania', solido:true});
  setObj(m, 14, 9, {t:'casse', solido:true, v:1});
  // il tavolo dove si mangia, con le sue panche, sul tappeto buono
  m.deco.push({t:'tappeto', x:6, y:7, w:4, h:3});
  tavolata(m, 7, 8);
  for(const [x,y] of [[5,2],[14,2],[3,9]]) setObj(m, x, y, {t:'lume', solido:false});
  m.deco.push({t:'cartello', x:11, y:10, testo:'La teiera di Nonna Ilde è ancora sul tavolo.'});
  uscita(m, 8, 11, 'podere', 7, 8);
  return m;
}

/* ===================================================================
   API
   =================================================================== */
/* I luoghi della valle. Serve anche a validare un salvataggio importato senza
   dover ricostruire tutte le mappe. Il test di coerenza controlla che questa
   lista e quella davvero costruita da W.crea() restino allineate. */
W.MAPPE = ['podere','fioralba','bosco','grotta','grotta2','grotta3','montagna','piazza','spiaggia',
           'int_casa','int_bottega','int_fucina','int_locanda'];

/* Quali porte portano dentro una stanza vera. Sta qui, e non in game.js,
   perché serve anche ai controlli di coerenza: la mappa dei collegamenti
   dev'essere una sola. */
W.INTERNI = { casa:'int_casa', bottega:'int_bottega',
              fucina:'int_fucina', locanda:'int_locanda' };

W.crea = function(){
  const maps = {};
  maps.podere   = buildPodere();
  maps.fioralba = buildFioralba();
  maps.bosco    = buildBosco();
  maps.grotta   = buildGrotta();
  maps.grotta2  = buildMinieraProfonda('grotta2','Miniera Profonda', 5150, false);
  maps.grotta3  = buildMinieraProfonda('grotta3','Cuore della Miniera', 8080, true);
  maps.montagna = buildMontagna();
  maps.piazza   = buildPiazza();
  maps.spiaggia = buildSpiaggia();
  maps.int_casa    = buildCasa();
  maps.int_bottega = buildBottega();
  maps.int_fucina  = buildFucina();
  maps.int_locanda = buildLocanda();
  return maps;
};

/* ---- costruzione di un edificio sbloccato ---- */
/* Il burrone è paesaggio, non roba del giocatore, ma il terreno del
   bosco viaggia nel salvataggio: nei salvataggi fatti prima che il
   burrone girasse a sud c'è ancora quello corto, e chi carica si
   ritrova la radura aperta di fianco col ponte ridotto di nuovo a un
   souvenir da 3000 monete. Quindi dopo aver riletto la mappa lo si
   ristampa.

   La casella del ponte non si tocca: lì il salvataggio ha ragione lui,
   sa se il ponte c'è o no. Casse e macchinari finiti dentro al nuovo
   tracciato traslocano invece di sparire — è successo una volta con un
   letto, basta. */
/* --- IL PORTO E LA COSTA SI RISTAMPANO ---

   Il terreno viaggia nel salvataggio, e con lui gli oggetti di scena:
   chi ha una partita avviata si riporterebbe dietro la piazza vecchia —
   lastricata fino al bordo, senza acqua e senza barche — e la spiaggia
   senza dune e senza pozze, per sempre. È la stessa faccenda del
   burrone: com'è fatto un luogo lo decidiamo noi, non il salvataggio.

   Invece di riscrivere qui quello che i costruttori già sanno fare — due
   copie della stessa piazza che divergono al primo ritocco — se ne
   costruisce una NUOVA e si trapianta la fascia che abbiamo cambiato.
   Una fonte sola: se domani si sposta una barca, si sposta in un posto
   e basta.

   Quello che il giocatore ci ha messo dentro non si cancella: casse e
   macchinari si sfrattano e si rimettono lì fuori, come per il burrone.
   Perdere una cassa piena per una modifica di scenografia sarebbe il
   modo peggiore di migliorare un posto. */
function trapianta(m, fresca, dentro){
  const sfrattati = [];
  for(let y=0;y<m.h;y++) for(let x=0;x<m.w;x++){
    if(!dentro(x,y)) continue;
    const i = W.idx(m,x,y);
    m.g[i] = fresca.g[i];
    const o = m.obj[i];
    if(o && (o.t==='macchina' || o.t==='mobile')) sfrattati.push(o);
    m.obj[i] = fresca.obj[i];
    if(m.suolo) m.suolo[i] = null;
  }
  return sfrattati;
}

function riparaSfrattati(m, sfrattati, ax, ay){
  for(const o of sfrattati){
    const q = W.vicinoLibero(m, ax, ay);
    if(!q) continue;
    const i = W.idx(m,q.x,q.y);
    if(!m.obj[i]) m.obj[i] = o;
  }
}

W.ristampaPorto = function(m){
  if(!m || m.id!=='piazza') return;
  const fresca = buildPiazza();
  if(fresca.w!==m.w || fresca.h!==m.h) return;   // misure diverse: meglio non toccare
  // la banchina, l'acqua e la fila dei banchi al mercato
  const sfrattati = trapianta(m, fresca, (x,y)=> (x>=29 && y>=6) || (x>=8 && x<=9 && y>=9 && y<=24));
  riparaSfrattati(m, sfrattati, 20, 20);         // in mezzo alla piazza, dove si passa
};

W.ristampaCosta = function(m){
  if(!m || m.id!=='spiaggia') return;
  const fresca = buildSpiaggia();
  if(fresca.w!==m.w || fresca.h!==m.h) return;
  /* Tutta la parte a terra: le dune sono sparse su tutta la spiaggia e
     non in una fascia, quindi non c'è un rettangolo più stretto da
     prendere. Il mare sotto non si tocca. */
  const sfrattati = trapianta(m, fresca, (x,y)=> y>=1 && y<=28);
  riparaSfrattati(m, sfrattati, 23, 3);          // vicino all'uscita per la Piazza
};

/* Il ponticello sul ruscello del podere: dove sta e quanto è largo lo
   decidiamo noi, in un posto solo, perché lo stampano in due —
   `buildPodere` quando la valle nasce e `W.ristampaPonticello` quando si
   riapre una partita vecchia. Due copie di queste quattro righe
   divergerebbero al primo ritocco, e il difetto tornerebbe per metà dei
   giocatori. */
const PONTICELLO = { x:29, y:16, w:4, h:3 };

function ponticello(m){
  const p = PONTICELLO;
  fill(m, p.x, p.y, p.w, p.h, 'assi');
  for(let y=p.y;y<p.y+p.h;y++) for(let x=p.x;x<p.x+p.w;x++) m.obj[W.idx(m,x,y)] = null;
  m.deco.push({t:'ponte', x:p.x, y:p.y, w:p.w, h:p.h});
}

/* Il terreno viaggia nel salvataggio, quindi chi ha una partita avviata
   si riporta dietro il ponticello vecchio — quello che non copriva il
   ruscello — e i due quadrati d'acqua invisibili con lui. Come per il
   burrone: com'è fatto un passaggio lo decide il gioco.

   Si ristampa solo il rettangolo del ponte, non il ruscello intorno: il
   podere è la mappa dove il giocatore zappa, costruisce e posa, e più in
   là di quelle dodici caselle non abbiamo niente da dirgli. Il deco si
   rifà solo se manca, se no a ogni caricamento se ne impilerebbe uno. */
W.ristampaPonticello = function(m){
  if(!m || m.id!=='podere') return;
  const p = PONTICELLO;
  const sfrattati = [];
  for(let y=p.y;y<p.y+p.h;y++) for(let x=p.x;x<p.x+p.w;x++){
    if(!W.dentro(m,x,y)) continue;
    const i = W.idx(m,x,y);
    m.g[i] = ti('assi');
    if(m.suolo) m.suolo[i] = null;
    const o = m.obj[i];
    if(o && (o.t==='macchina' || o.t==='mobile')) sfrattati.push(o);
    m.obj[i] = null;
  }
  if(!m.deco.some(d=>d.t==='ponte'))
    m.deco.push({t:'ponte', x:p.x, y:p.y, w:p.w, h:p.h});
  for(const o of sfrattati){
    const q = W.vicinoLibero(m, p.x-2, p.y+1);   // sul viale, di qua dal ruscello
    if(!q) continue;
    const i = W.idx(m,q.x,q.y);
    if(!m.obj[i]) m.obj[i] = o;
  }
};

W.ristampaBurrone = function(m, ponteCostruito){
  if(!m || !m.burrone) return;
  const p = m.pontePos;
  const nelPonte = (x,y) => p && x>=p.x && x<p.x+p.w && y>=p.y && y<p.y+p.h;
  const sfrattati = [];

  /* Anche il CORRIDOIO DEL PONTE si decide qui, non si salta.

     Prima le caselle nelPonte venivano saltate «per non toccare il
     ponte» — cioè restavano come le diceva il salvataggio. Ma se il
     varco di una versione precedente stava in un altro punto, il
     salvataggio in quelle caselle ha roccia o vuoto: due o tre blocchi
     INVISIBILI dentro al corridoio, sotto la passerella disegnata, e il
     ponte comprato e pagato non si attraversava. Segnalato così:
     «due blocchi invisibili che non te lo fanno attraversare».

     Quindi: assi se il ponte c'è, vuoto se non c'è, deciso da noi. */
  for(const b of m.burrone){
    for(let y=b.y; y<b.y+b.h; y++) for(let x=b.x; x<b.x+b.w; x++){
      if(!W.dentro(m,x,y)) continue;
      const i = W.idx(m,x,y);
      m.g[i] = nelPonte(x,y) ? ti(ponteCostruito ? 'assi' : 'vuoto') : ti('roccia');
      if(m.suolo) m.suolo[i] = null;
      const o = m.obj[i];
      if(o && (o.t==='macchina' || o.t==='mobile')) sfrattati.push(o);
      m.obj[i] = null;
    }
  }

  /* E le ASSI ORFANE nella fascia attorno: il ponte di una versione
     vecchia, rimasto scritto nel salvataggio fuori dal burrone attuale,
     si vede come una lingua di passerella che non porta da nessuna
     parte — «si vede anche male, sinceramente». Si torna a erba, solo
     nella fascia stretta attorno al burrone: più in là le assi possono
     essere una superficie posata dal giocatore, e quelle non si toccano. */
  const MARGINE = 2;
  for(const b of m.burrone){
    for(let y=b.y-MARGINE; y<b.y+b.h+MARGINE; y++)
      for(let x=b.x-MARGINE; x<b.x+b.w+MARGINE; x++){
        if(!W.dentro(m,x,y) || nelPonte(x,y)) continue;
        const i = W.idx(m,x,y);
        if(m.g[i] === ti('assi')) m.g[i] = ti('erba');
      }
  }
  /* E lungo le COLONNE del ponte la scia si insegue più a fondo: il
     ponte vecchio era più lungo di quello attuale, e la sua coda scende
     oltre il margine di due — misurato su un salvataggio avvelenato
     apposta, a margine 2 restavano assi a quattro e cinque caselle dal
     corridoio. Sei caselle sopra e sotto, solo nelle colonne del ponte:
     lì un'asse posata dal giocatore sarebbe comunque incollata alla
     passerella, e non si distinguerebbe dalla scia nemmeno a occhio. */
  if(p){
    for(let y=p.y-6; y<p.y+p.h+6; y++){
      if(!W.dentro(m,p.x,y) || nelPonte(p.x,y)) continue;
      for(let x=p.x; x<p.x+p.w; x++){
        const i = W.idx(m,x,y);
        if(m.g[i] === ti('assi')) m.g[i] = ti('erba');
      }
    }
  }

  /* Si trasloca a *nord* del burrone, sulla riva da cui si arriva: di
     là si passa solo col ponte, e una cassa che si può riaprire solo
     dopo aver speso 3000 monete è persa uguale. */
  let ax = p ? p.x : 33, ay = p ? p.y - 2 : 22;
  for(const o of sfrattati){
    const q = W.vicinoLibero(m, ax, ay);
    if(!q || m.obj[W.idx(m,q.x,q.y)]) continue;
    /* MAI dentro al corridoio del ponte.

       Si trasloca a due caselle a nord del ponte, che è la riva giusta —
       ma `vicinoLibero` cerca la casella libera più vicina e non sa che
       quelle sono le uniche per cui si passa. Una cassa o un macchinario
       sono solidi: piazzato lì, il ponte diventa un vicolo cieco e non
       c'è modo di capire perché, perché la cassa sembra roba tua messa
       lì apposta. Il corridoio è largo tre caselle e lungo quanto il
       ponte più due rive: si tiene sgombro tutto. */
    if(nelCorridoio(p, q.x, q.y)) continue;
    m.obj[W.idx(m,q.x,q.y)] = o;
    ax = q.x; ay = q.y - 1;      // il prossimo cerca da un'altra parte
  }

  /* E si sgombra comunque quello che ci fosse già finito: chi ha una
     partita bloccata non deve aspettare di ricostruire il ponte. Gli
     oggetti che si tolgono di mezzo sono solo i solidi — foraggio ed
     erbacce non hanno mai fermato nessuno. */
  if(p){
    for(let y=p.y-2; y<p.y+p.h+2; y++) for(let x=p.x; x<p.x+p.w; x++){
      if(!W.dentro(m,x,y)) continue;
      const i = W.idx(m,x,y), o = m.obj[i];
      if(!o || !o.solido || o.t==='muro' || o.t==='porta') continue;
      m.obj[i] = null;
      const q = W.vicinoLibero(m, p.x - 3, p.y - 3);
      if(q && !m.obj[W.idx(m,q.x,q.y)] && !nelCorridoio(p, q.x, q.y))
        m.obj[W.idx(m,q.x,q.y)] = o;      // spostato di lato, non buttato
    }
  }
};

/* il corridoio del ponte: le sue caselle più una riva per parte */
function nelCorridoio(p, x, y){
  if(!p) return false;
  return x >= p.x && x < p.x + p.w && y >= p.y - 2 && y < p.y + p.h + 2;
}

W.costruisci = function(maps, id){
  const m = maps.podere;
  const sp = m.spazi[id==='casa2'?null:id];
  if(id==='pollaio' && sp){
    edificio(m,'pollaio', sp.x, sp.y, sp.w, sp.h, {porta:sp.porta, azione:'pollaio', nome:'Pollaio'});
    return true;
  }
  if(id==='serra' && sp){
    edificio(m,'serra', sp.x, sp.y, sp.w, sp.h, {porta:sp.porta, azione:'serra', nome:'Serra'});
    return true;
  }
  if(id==='silo' && sp){
    setObj(m, sp.x, sp.y, {t:'silo', solido:true});
    return true;
  }
  if(id==='ponte'){
    const b = maps.bosco, p = b.pontePos;
    for(let y=p.y;y<p.y+p.h;y++) for(let x=p.x;x<p.x+p.w;x++){
      b.g[W.idx(b,x,y)] = ti('assi');
      b.obj[W.idx(b,x,y)] = null;
    }
    b.deco.push({t:'ponte_grande', x:p.x, y:p.y, w:p.w, h:p.h});
    return true;
  }
  if(id==='casa2'){
    const e = m.edifici.find(e=>e.kind==='casa');
    if(e) e.liv = 1;
    return true;
  }
  return false;
};

/* ---- respawn giornaliero ---- */
W.nuovoGiorno = function(maps, stagione, rngSeed){
  const R = rnd(rngSeed>>>0 || 1);

  /* --- BOSCO: foraggio stagionale + erbacce --- */
  const b = maps.bosco;
  // rimuovi vecchio foraggio
  for(let i=0;i<b.obj.length;i++){
    if(b.obj[i] && b.obj[i].t==='foraggio') b.obj[i]=null;
  }
  const forSt = Object.keys(DATA.ITEMS).filter(k=>DATA.ITEMS[k].cat==='foraggio' && DATA.ITEMS[k].stagione===stagione);
  if(forSt.length){
    let messi=0, tent=0;
    while(messi<11 && tent<600){
      tent++;
      const x=1+((R()*(b.w-2))|0), y=1+((R()*(b.h-2))|0);
      if(!libero(b,x,y)) continue;
      if(W.terreno(b,x,y)!=='erba') continue;
      setObj(b,x,y,{t:'foraggio', item: forSt[(R()*forSt.length)|0]});
      messi++;
    }
  }
  // ricrescita alberi tagliati e sterpaglia
  for(const m of [maps.bosco, maps.podere]){
    let n=0;
    while(n<(m.id==='bosco'?8:3)){
      const x=1+((R()*(m.w-2))|0), y=1+((R()*(m.h-2))|0);
      if(!libero(m,x,y)) { n++; continue; }
      if(W.terreno(m,x,y)!=='erba'){ n++; continue; }
      // niente erbacce sul terreno arato o vicino alle macchine
      const r=R();
      if(r<0.5) setObj(m,x,y,{t:'erbaccia', v:(R()*4)|0});
      else if(r<0.75) setObj(m,x,y,{t:'ramo', v:(R()*3)|0});
      else if(m.id==='bosco') setObj(m,x,y, albero('quercia',0));
      n++;
    }
    // germogli che crescono
    for(let i=0;i<m.obj.length;i++){
      const o=m.obj[i];
      if(o && o.t==='albero' && o.stage<2 && R()<0.18){
        o.stage++; o.hp = o.stage===2?5:2;
      }
    }
  }

  /* --- GROTTA: rigenera minerali --- */
  const g = maps.grotta;
  /* Prima si tolgono i sassi di ieri. Senza, ogni notte se ne
     aggiungevano cinquantacinque a quelli già lì e in un mese la
     miniera si murava da sola: misurato, dal 66% percorribile la prima
     notte al 10% la trentesima. I livelli profondi lo facevano già —
     era solo il primo a dimenticarsene. */
  for(let i=0;i<g.obj.length;i++) if(g.obj[i] && g.obj[i].t==='sasso') g.obj[i]=null;
  const tabella = [
    ['pietra',0.42],['rame',0.20],['ferro',0.14],['carbone',0.09],
    ['quarzo',0.07],['ametista',0.04],['oro',0.03],['geode',0.01]
  ];
  let messi=0, tent=0;
  while(messi<55 && tent<2500){
    tent++;
    const x=1+((R()*(g.w-2))|0), y=1+((R()*(g.h-2))|0);
    if(!libero(g,x,y)) continue;
    if(W.terreno(g,x,y)!=='grotta') continue;
    const r=R(); let acc=0, kind='pietra';
    for(const t of tabella){ acc+=t[1]; if(r<acc){ kind=t[0]; break; } }
    if(kind==='carbone') setObj(g,x,y,{t:'sasso', kind:'pietra', carbone:true, hp:2, solido:true});
    else setObj(g,x,y, sasso(kind));
    messi++;
  }

  /* --- PODERE: qualche erbaccia in più se piove --- */

  /* --- NUOVI LUOGHI: rigenera minerali e foraggio, tieni sgombre le scale --- */
  W.pulisciScale(maps.grotta);
  if(maps.grotta2)  W.rigeneraMiniera(maps.grotta2,  (rngSeed^0x0002)>>>0, false);
  if(maps.grotta3)  W.rigeneraMiniera(maps.grotta3,  (rngSeed^0x0003)>>>0, true);
  /* I sassi nuovi possono aver richiuso i corridoi: ogni notte si
     riaprono i varchi, altrimenti la miniera si tappa da sola mentre
     dormi e ti ritrovi murato da una parte all'altra. */
  for(const id of ['grotta','grotta2','grotta3']){
    const g = maps[id];
    if(g && g.ingresso) W.apriPassaggi(g, g.ingresso[0], g.ingresso[1]);
  }
  if(maps.montagna) W.rigeneraMontagna(maps.montagna,(rngSeed^0x0004)>>>0);
  if(maps.spiaggia) W.rigeneraCosta(maps.spiaggia,   (rngSeed^0x0005)>>>0);
};

/* trova una posizione libera vicina */
W.vicinoLibero = function(m, x, y){
  if(!W.solido(m,x,y)) return {x,y};
  for(let r=1;r<8;r++){
    for(let dy=-r;dy<=r;dy++) for(let dx=-r;dx<=r;dx++){
      if(!W.solido(m,x+dx,y+dy)) return {x:x+dx, y:y+dy};
    }
  }
  return {x,y};
};

})();
