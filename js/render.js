/* ===================================================================
   FIORALBA — render.js
   Camera, terreni raccordati, ombre proiettate, luci, bloom, meteo.
   =================================================================== */
(function(){
'use strict';

const R = {};
window.REND = R;

const T = 32;
let cvs, ctx;
let scene, sx;
let light, lx;
let VW=480, VH=270, SCALE=3;
/* DPR: quanti pixel fisici vale un pixel CSS (1 di norma, 1.25/1.5/2 sugli
   schermi in scala e sui Retina). cssW/cssH servono a capire se la finestra
   è cambiata senza che sia arrivato l'evento "resize". */
let DPR=1, cssW=0, cssH=0;

R.init = function(canvas){
  cvs = canvas;
  /* alpha:false — il canvas di gioco è sempre coperto per intero (la
     scena parte da un fillRect dello sfondo), quindi il browser può
     saltare la fusione col fondo della pagina a ogni compositing. È il
     consiglio standard per i canvas opachi; le superfici di lavoro
     (scene, light) restano trasparenti perché la luce si ritaglia con
     destination-out e ha bisogno dell'alfa. */
  ctx = cvs.getContext('2d', { alpha:false });
  ctx.imageSmoothingEnabled = false;
  scene = ART.cv(VW,VH); sx = scene.getContext('2d');
  light = ART.cv(VW,VH); lx = light.getContext('2d');
  R.resize();
};

function dprCorrente(){
  return Math.max(1, Math.min(3, window.devicePixelRatio || 1));
}

R.resize = function(){
  // un canvas 0×0 farebbe fallire drawImage: ripieghiamo su una misura sensata
  cssW = Math.max(320, window.innerWidth  || 0);
  cssH = Math.max(240, window.innerHeight || 0);
  DPR  = dprCorrente();

  /* Il canvas lavora in pixel FISICI. Dimensionandolo in pixel CSS, su uno
     schermo al 125% o su un Retina il browser lo riscalerebbe di un fattore
     non intero: la griglia della pixel art diventerebbe irregolare (alcuni
     pixel larghi 2, altri 1) e il disegno "sfarfallerebbe" muovendosi. */
  const devW = Math.round(cssW*DPR), devH = Math.round(cssH*DPR);
  cvs.width = devW; cvs.height = devH;

  // quanto zoom vogliamo — cioè quante caselle si vedono — dipende da quanto
  // è grande la finestra per l'occhio, quindi dalla misura in pixel CSS
  let zoom = Math.max(2, Math.min(4, Math.round(cssW/(19*T))));
  if(cssW < 760) zoom = Math.max(2, Math.min(3, Math.round(cssW/(13*T))));
  // ...ma l'ingrandimento effettivo dev'essere un numero INTERO di pixel fisici
  SCALE = Math.max(1, Math.round(zoom*DPR));

  VW = Math.max(1, Math.ceil(devW/SCALE)); VH = Math.max(1, Math.ceil(devH/SCALE));
  scene.width=VW; scene.height=VH;
  light.width=VW; light.height=VH;
  sx = scene.getContext('2d'); sx.imageSmoothingEnabled=false;
  lx = light.getContext('2d'); lx.imageSmoothingEnabled=false;
  ctx = cvs.getContext('2d'); ctx.imageSmoothingEnabled=false;
};
R.info = ()=>({VW,VH,SCALE,DPR});

/* la finestra (o lo zoom del browser) è cambiata senza emettere "resize"? */
R.deveRidimensionare = function(){
  return Math.max(320, window.innerWidth  || 0) !== cssW
      || Math.max(240, window.innerHeight || 0) !== cssH
      || dprCorrente() !== DPR;
};

/* il mouse arriva in pixel CSS: prima ai pixel fisici, poi al mondo */
R.schermoAMondo = function(px, py, cam){
  // stesso aggancio al pixel che usa il disegno, altrimenti si clicca
  // mezzo pixel a fianco di quello che si vede
  return { x:(px*DPR/SCALE + Math.round(cam.x)), y:(py*DPR/SCALE + Math.round(cam.y)) };
};

/* ===================================================================
   TERRENO PRE-COTTO A BLOCCHI (con raccordi)
   I raccordi costano, ma il terreno cambia di rado: lo disegniamo una
   volta per blocco di 8×8 caselle e poi lo ricopiamo.
   =================================================================== */
const CH = 8;
/* Ogni blocco è un canvas 256×256 = 256 KB di memoria video. Una Map tiene
   l'ordine d'uso, così a essere buttato è il blocco che non guardi da più
   tempo (e non, come prima, il primo che era entrato — che poteva benissimo
   essere quello sotto ai piedi del giocatore, ricostruito a ogni frame).
   120 blocchi = ~30 MB, con sei volte il margine sul campo visivo. */
const CACHE_MAX = 120;
let chunkCache = new Map();

/* diagnostica: quanti blocchi di terreno sono in cache e quanti ne ha
   costruiti da quando è partito il gioco (utile per capire se la cache
   sta lavorando o se sta ricostruendo sempre le stesse cose) */
let chunkCostruiti = 0;
R.statoCache = ()=>({ inCache: chunkCache.size, max: CACHE_MAX, costruitiInTutto: chunkCostruiti });

R.invalidaTerreno = function(mapId){
  if(!mapId){ chunkCache.clear(); return; }
  for(const k of [...chunkCache.keys()]) if(k.indexOf(mapId+'|')===0) chunkCache.delete(k);
};
/* i blocchi di terreno sono precotti coi colori della palette:
   se la palette cambia, vanno rifatti */
if(window.PAL) PAL.suCambio(()=>{ chunkCache.clear(); });

R.invalidaCasella = function(mapId, x, y){
  // il raccordo tocca anche i blocchi vicini
  for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){
    const cx = ((x+dx)/CH)|0, cy = ((y+dy)/CH)|0;
    for(const s of DATA.SEASONS) chunkCache.delete(mapId+'|'+cx+'|'+cy+'|'+s.id);
  }
};

function texTerreno(tipo){ return tipo==='roccia' ? 'grotta' : tipo; }

/* Le caselle della fontana sono terreno "acqua" (così ci si può pescare)
   ma la vasca è tonda: dell'acqua grezza e della schiuma si vedeva il
   quadrato 4×4 tutt'intorno, come un alone chiaro. Sotto la fontana va
   disegnato il pavimento, e la vasca ci si appoggia sopra. */
function eFontana(m, gx, gy){
  const o = m.obj[WORLD.idx(m,gx,gy)];
  return !!(o && o.t==='fontana');
}
function terrenoAttorno(m, gx, gy){
  for(const [dx0,dy0] of [[0,-1],[0,1],[-1,0],[1,0],[0,-2],[0,2],[-2,0],[2,0]]){
    if(!WORLD.dentro(m,gx+dx0,gy+dy0)) continue;
    const t = WORLD.terreno(m,gx+dx0,gy+dy0);
    if(t!=='acqua' && t!=='vuoto' && !eFontana(m,gx+dx0,gy+dy0)) return t;
  }
  return 'lastre';
}

/* Una targhetta di legno con sopra una parola. Il testo è disegnato con
   il font del sistema e non a pixel: a questa misura un alfabeto
   disegnato a mano sarebbe illeggibile, e una targhetta che non si
   legge non serve a niente. */
/* Le targhette messe in questo fotogramma, per non pestarsi fra loro.
   Due casse affiancate hanno i coperchi a trentadue pixel di distanza e
   le targhette sono larghe il triplo: si sovrapponevano e non si leggeva
   nessuna delle due. Quella che arriva dopo sale finché trova posto. */
let targhettePoste = [];
const ALTA_T = 13, SALTO_T = 15;

function targhetta(testo, cx, cy){
  const s = String(testo).slice(0, 18);
  sx.font = 'bold 9px system-ui, sans-serif';
  sx.textAlign = 'center';
  sx.textBaseline = 'middle';
  const w = Math.ceil(sx.measureText(s).width) + 8;
  let x0 = Math.round(cx - w/2), y0 = Math.round(cy - 7);

  /* si alza di un gradino per volta finché non tocca più nessuno; dopo
     quattro tentativi si arrende e si sovrappone, che è meglio di una
     targhetta finita fuori dallo schermo */
  for(let giro=0; giro<4; giro++){
    let libero = true;
    for(const t of targhettePoste){
      if(x0 < t.x+t.w && x0+w > t.x && y0 < t.y+ALTA_T && y0+ALTA_T > t.y){ libero = false; break; }
    }
    if(libero) break;
    y0 -= SALTO_T;
  }
  targhettePoste.push({ x:x0, y:y0, w });

  const I = PAL.c.interno;
  ART.px(sx, x0, y0, w, ALTA_T, I.legnoOmbra);
  ART.px(sx, x0+1, y0+1, w-2, ALTA_T-2, I.legno);
  ART.px(sx, x0+1, y0+1, w-2, 1, I.legnoLuce);
  sx.fillStyle = '#2a1d12';
  sx.fillText(s, Math.round(x0 + w/2), y0 + 7);
  sx.textAlign = 'start';
  sx.textBaseline = 'alphabetic';
}

/* ===================================================================
   FUMETTI — quello che la gente dice ad alta voce

   Stessa idea delle targhette e stesso problema risolto allo stesso
   modo: in piazza tre persone parlano vicine, e tre nuvolette alla
   stessa altezza diventano una macchia. Si accodano in `targhettePoste`
   insieme alle targhette, così si scansano anche a vicenda — un
   fumetto sopra una cassa e una targhetta di cassa sono due scritte
   nello stesso punto, e il giocatore non sa che vengono da due sistemi
   diversi.

   Il testo si spezza a mano invece che con una misura per riga: a
   nove pixel di corpo su una scena larga 480, una battuta lunga
   coprirebbe mezza piazza. Tre righe da ventotto caratteri sono il
   limite oltre il quale si smette di leggere e si comincia a guardare.
   =================================================================== */
const FUM_RIGA = 28, FUM_RIGHE = 3, FUM_ALTA = 11;

function spezza(testo){
  const parole = String(testo).split(/\s+/);
  const righe = [];
  let r = '';
  for(const p of parole){
    if(!r.length){ r = p; continue; }
    if((r + ' ' + p).length <= FUM_RIGA){ r += ' ' + p; continue; }
    righe.push(r); r = p;
    if(righe.length === FUM_RIGHE - 1) break;
  }
  if(righe.length < FUM_RIGHE && r) righe.push(r);
  // se non ci sta tutto, l'ultima riga si tronca con dignità
  const detto = righe.join(' ');
  if(detto.length < String(testo).length && righe.length){
    let u = righe[righe.length-1];
    if(u.length > FUM_RIGA - 1) u = u.slice(0, FUM_RIGA - 1);
    righe[righe.length-1] = u + '…';
  }
  return righe;
}

function fumetto(testo, cx, cy, opacita){
  const righe = spezza(testo);
  if(!righe.length) return;
  sx.font = 'bold 9px Nunito, system-ui, sans-serif';
  sx.textAlign = 'center';
  sx.textBaseline = 'middle';

  let larga = 0;
  for(const r of righe) larga = Math.max(larga, Math.ceil(sx.measureText(r).width));
  const w = larga + 10, h = righe.length*FUM_ALTA + 6;
  let x0 = Math.round(cx - w/2), y0 = Math.round(cy - h);

  for(let giro=0; giro<5; giro++){
    let libero = true;
    for(const t of targhettePoste)
      if(x0 < t.x+t.w && x0+w > t.x && y0 < t.y+(t.h||ALTA_T) && y0+h > t.y){ libero = false; break; }
    if(libero) break;
    y0 -= h + 3;
  }
  targhettePoste.push({ x:x0, y:y0, w, h });

  /* dentro lo schermo per forza: un fumetto mezzo fuori dal bordo è
     peggio di un fumetto spostato */
  x0 = Math.max(2, Math.min(VW - w - 2, x0));
  y0 = Math.max(2, y0);

  const a = opacita === undefined ? 1 : opacita;
  sx.globalAlpha = a;
  ART.px(sx, x0,   y0,   w,   h,   '#2a1d12');
  ART.px(sx, x0+1, y0+1, w-2, h-2, '#fdf6e4');
  // la codina che indica chi sta parlando
  const tx = Math.max(x0+4, Math.min(x0+w-7, Math.round(cx)-2));
  ART.px(sx, tx,   y0+h,   4, 2, '#2a1d12');
  ART.px(sx, tx+1, y0+h-1, 2, 2, '#fdf6e4');
  ART.px(sx, tx+1, y0+h+1, 2, 1, '#2a1d12');

  sx.fillStyle = '#3a2a1a';
  righe.forEach((r, i)=> sx.fillText(r, Math.round(x0 + w/2), y0 + 4 + i*FUM_ALTA + 4));
  sx.globalAlpha = 1;
  sx.textAlign = 'start';
  sx.textBaseline = 'alphabetic';
}

/* Variante di un oggetto ricavata dalla sua casella: due alberi vicini
   prendono disegni diversi senza che il mondo debba ricordarsi niente,
   quindi i salvataggi vecchi funzionano identici. */
function varianteDi(gx, gy){ return (gx*7 + gy*13) & 3; }

/* ===================================================================
   STRATO DI DETTAGLIO DELLE SUPERFICI
   Le grandi distese piatte — la sabbia della Costa, la piazza del paese,
   il pavimento della miniera, la neve del Passo — erano campiture
   uniformi dove l'occhio non aveva dove posarsi. Qui sopra ci va una
   variazione tonale a bassa frequenza più qualche detrito sparso.

   Si disegna DENTRO il blocco, non dentro la casella: così dipende dalle
   coordinate del mondo (niente motivo che si ripete ogni 32 pixel) e
   viene cotta una volta sola, quindi a schermo non costa niente.
   =================================================================== */
const DETTAGLIO = {
  sabbia:  { chiazza:'#c9ab72', forza:0.16, scala:9,  detriti:['#cfc0a2','#b89b6a'], quanti:2 },
  lastre:  { chiazza:'#8f8672', forza:0.13, scala:7,  detriti:['#9aa07e','#b0a58c'], quanti:1 },
  cotto:   { chiazza:'#3d2a1c', forza:0.20, scala:6,  detriti:['#5a3f2a','#2e2018'], quanti:1 },
  grotta:  { chiazza:'#3e372f', forza:0.22, scala:6,  detriti:['#544c42','#7a6f60'], quanti:2 },
  neve:    { chiazza:'#b9c6d2', forza:0.13, scala:8,  detriti:['#ffffff','#cdd8e2'], quanti:1 },
  sentiero:{ chiazza:'#7d7364', forza:0.11, scala:6,  detriti:['#8f8371','#b5a894'], quanti:1 },
  terra:   { chiazza:'#6d4d38', forza:0.13, scala:7,  detriti:['#a07a56','#5f4433'], quanti:1 }
};

function dettaglioSuperficie(x, dx, dy, gx, gy, tipo, season){
  // d'inverno l'erba è disegnata come neve: prende il dettaglio della neve.
  // L'erba nelle altre stagioni non ne ha bisogno: ha già i ciuffi animati.
  const D = DETTAGLIO[(tipo==='erba' && season==='inverno') ? 'neve' : tipo];
  if(!D) return;

  /* 1. chiazze larghe: due frequenze di rumore, in coordinate mondo */
  const n = ART.rumore(gx, gy, D.scala)*0.68 + ART.rumore(gx, gy, D.scala*0.35)*0.32;
  const forza = (n-0.5)*2;                       // -1..1
  if(Math.abs(forza) > 0.12){
    x.globalAlpha = Math.min(0.5, Math.abs(forza)*D.forza*2.2);
    x.fillStyle = D.chiazza;
    // bordo irregolare: la chiazza non deve essere un quadrato
    for(let k=0;k<8;k++){
      const ry = (k*4);
      const inizio = ((ART.hsh(gx, gy*8+k, 401)*5)|0);
      const largo  = T - inizio - ((ART.hsh(gx*3, gy+k, 402)*5)|0);
      if(largo > 0) x.fillRect(dx+inizio, dy+ry, largo, 4);
    }
    x.globalAlpha = 1;
  }

  /* 2. detriti radi: qualche sassolino, conchiglia, crepa */
  for(let k=0; k<D.quanti; k++){
    if(ART.hsh(gx, gy*7+k, 411) < 0.86) continue;
    const bx = dx + 3 + ((ART.hsh(gx+k, gy, 412)*(T-7))|0);
    const by = dy + 3 + ((ART.hsh(gx, gy+k, 413)*(T-7))|0);
    const col = D.detriti[(ART.hsh(gx+k, gy+k, 414)*D.detriti.length)|0];
    const forma = ART.hsh(gx*5+k, gy, 415);
    x.globalAlpha = 0.75;
    if(forma > 0.66){                            // sassolino
      x.fillStyle = col; x.fillRect(bx, by, 3, 2);
      x.fillStyle = ART.shade(col, 0.22); x.fillRect(bx, by, 2, 1);
    } else if(forma > 0.33){                     // crepa / venatura
      x.fillStyle = col;
      x.fillRect(bx, by, 5, 1);
      x.fillRect(bx+4, by+1, 3, 1);
    } else {                                     // puntinatura
      x.fillStyle = col;
      x.fillRect(bx, by, 1, 1); x.fillRect(bx+2, by+1, 1, 1); x.fillRect(bx+1, by+3, 1, 1);
    }
    x.globalAlpha = 1;
  }
}

/* ===================================================================
   PARETI DELLA MINIERA
   Erano rettangoli neri con un cornicione sottile: gradini da 32 pixel,
   nessun materiale, e il piano verticale che toccava quello orizzontale
   senza stacco. Ora la roccia ha corpo e strati, il bordo che affaccia
   sul vuoto ha una faccia illuminata in alto e scura alla base, con
   stalattiti e vene di minerale.
   =================================================================== */
function pareteRoccia(x, dx, dy, gx, gy, m){
  const R = PAL.c.roccia;
  const roccia = (ax,ay)=> WORLD.terreno(m,ax,ay)==='roccia';
  const sotto = !roccia(gx,gy+1);          // affaccia sul vuoto: si vede la parete

  /* --- corpo della roccia, a strati orizzontali --- */
  x.fillStyle = R.corpo; x.fillRect(dx,dy,T,T);
  for(let k=0;k<T;k+=4){
    const n = ART.hsh(gx, gy*8+k, 421);
    x.fillStyle = n>0.62 ? R.corpoChiaro : (n>0.3 ? R.corpo : R.strato);
    x.fillRect(dx, dy+k, T, 4);
  }
  // fratture verticali
  for(let k=0;k<3;k++){
    if(ART.hsh(gx*3+k, gy, 422) < 0.55) continue;
    const bx = dx + 3 + ((ART.hsh(gx+k, gy*2, 423)*(T-6))|0);
    x.fillStyle = R.strato;
    x.fillRect(bx, dy + ((ART.hsh(gx,gy+k,424)*10)|0), 1, 10+((ART.hsh(gx,gy-k,425)*14)|0));
  }
  // vene di minerale, rare
  if(ART.hsh(gx, gy, 426) > 0.88){
    const bx = dx+4+((ART.hsh(gx,gy,427)*20)|0), by = dy+5+((ART.hsh(gx,gy,428)*18)|0);
    x.fillStyle = R.vena;
    x.fillRect(bx, by, 6, 2); x.fillRect(bx+5, by+2, 5, 2); x.fillRect(bx+9, by+1, 4, 2);
    x.fillStyle = R.venaLuce;
    x.fillRect(bx+1, by, 3, 1); x.fillRect(bx+6, by+2, 2, 1);
  }

  /* --- bordi laterali: spigolo illuminato dove la roccia finisce --- */
  if(!roccia(gx-1,gy)){ x.fillStyle=R.facciaLuce; x.fillRect(dx,dy,1,T);
                        x.fillStyle=R.faccia;     x.fillRect(dx+1,dy,1,T); }
  if(!roccia(gx+1,gy)){ x.fillStyle=R.facciaLuce; x.fillRect(dx+T-1,dy,1,T);
                        x.fillStyle=R.faccia;     x.fillRect(dx+T-2,dy,1,T); }
  if(!roccia(gx,gy-1)){ x.fillStyle=R.strato; x.fillRect(dx,dy,T,2); }

  if(!sotto) return;

  /* --- la faccia che guarda la caverna --- */
  const FH = 15;                            // altezza della parete visibile
  const fy = dy + T - FH;
  x.fillStyle = R.cornice; x.fillRect(dx, fy-2, T, 2);      // cornicione in luce
  x.fillStyle = R.facciaLuce; x.fillRect(dx, fy, T, 3);
  x.fillStyle = R.faccia; x.fillRect(dx, fy+3, T, FH-6);
  x.fillStyle = R.base;   x.fillRect(dx, dy+T-3, T, 3);     // base in ombra

  // scanalature verticali della parete
  for(let k=0;k<T;k+=5){
    const off = ((ART.hsh(k, gy, 431)*3)|0);
    x.fillStyle = R.giunto;
    x.fillRect(dx+k+off, fy+3, 1, FH-5);
    x.fillStyle = R.facciaLuce;
    x.fillRect(dx+k+off+1, fy+3, 1, 3);
  }

  /* Le stalattiti NON si disegnano qui: pendono sotto il bordo, quindi
     finirebbero fuori dalla casella e verrebbero tagliate al confine fra
     un blocco e l'altro. Le disegna la casella di pavimento sottostante
     (vedi stalattiti()), che ha tutto lo spazio che serve. */
}

/* stalattiti che pendono dalla parete soprastante, disegnate sul
   pavimento così restano dentro la casella */
function stalattiti(x, dx, dy, gx, gy){
  const R = PAL.c.roccia;
  const sopra = gy-1;                       // il seme viene dalla parete
  const quante = ART.hsh(gx, sopra, 441) > 0.5 ? (ART.hsh(gx, sopra, 442)>0.72 ? 2 : 1) : 0;
  for(let k=0;k<quante;k++){
    const bx = dx + 3 + ((ART.hsh(gx+k*7, sopra, 443)*(T-8))|0);
    const h  = 4 + ((ART.hsh(gx, sopra+k*5, 444)*8)|0);
    for(let i=0;i<h;i++){
      const w = i < h*0.45 ? 3 : (i < h*0.8 ? 2 : 1);
      x.fillStyle = i<2 ? R.stalattiteLuce : R.stalattite;
      x.fillRect(bx, dy+i, w, 1);
    }
    x.fillStyle = R.base;                   // ombrina sotto la punta
    x.fillRect(bx, dy+h, 1, 1);
  }
}

function costruisciChunk(m, cx, cy, season){
  const c = ART.cv(CH*T, CH*T);
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  const P = ART.PRIORITA;

  for(let ty=0; ty<CH; ty++) for(let tx=0; tx<CH; tx++){
    const gx = cx*CH+tx, gy = cy*CH+ty;
    if(!WORLD.dentro(m,gx,gy)) continue;
    const dx = tx*T, dy = ty*T;
    const tipo = WORLD.terreno(m,gx,gy);
    if(tipo==='vuoto') continue;
    const v = m.v[WORLD.idx(m,gx,gy)];

    /* --- base (l'acqua resta trasparente: è animata sotto) --- */
    const fontana = tipo==='acqua' && eFontana(m,gx,gy);
    if(tipo!=='acqua' || fontana){
      const t2 = fontana ? terrenoAttorno(m,gx,gy) : tipo;
      x.drawImage(ART.ground(texTerreno(t2), v, season), dx, dy);
      dettaglioSuperficie(x, dx, dy, gx, gy, t2, season);
    }

    /* --- pareti di roccia --- */
    if(tipo==='roccia'){ pareteRoccia(x, dx, dy, gx, gy, m); continue; }

    /* ombra della parete sul pavimento sottostante: stacca il piano
       verticale da quello orizzontale, che prima si toccavano di netto */
    if(tipo==='grotta' && WORLD.terreno(m,gx,gy-1)==='roccia'){
      const g = x.createLinearGradient(0, dy, 0, dy+10);
      g.addColorStop(0, 'rgba(0,0,0,0.38)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.fillRect(dx, dy, T, 10);
      stalattiti(x, dx, dy, gx, gy);
    }

    /* --- raccordi: i vicini "più forti" sbordano su questa casella --- */
    const mio = P[tipo]!==undefined ? P[tipo] : 5;
    if(mio < 0) continue;
    const mv = v % 3;
    const lati = [['n',0,-1],['s',0,1],['w',-1,0],['e',1,0]];
    const fatto = {};
    for(const [d,ddx,ddy] of lati){
      const nt = WORLD.terreno(m,gx+ddx,gy+ddy);
      if(nt==='vuoto'||nt==='roccia') continue;
      const np = P[nt]!==undefined ? P[nt] : 5;
      if(np <= mio) continue;
      x.drawImage(ART.ombraBordo(d, mv), dx, dy);
      x.drawImage(ART.bordo(texTerreno(nt), d, mv, season), dx, dy);
      fatto[d]=true;
    }
    const angoli = [['nw',-1,-1,'n','w'],['ne',1,-1,'n','e'],['sw',-1,1,'s','w'],['se',1,1,'s','e']];
    for(const [d,ddx,ddy,a,b] of angoli){
      if(fatto[a]||fatto[b]) continue;
      const nt = WORLD.terreno(m,gx+ddx,gy+ddy);
      if(nt==='vuoto'||nt==='roccia') continue;
      const np = P[nt]!==undefined ? P[nt] : 5;
      if(np <= mio) continue;
      x.drawImage(ART.ombraBordo(d, mv), dx, dy);
      x.drawImage(ART.bordo(texTerreno(nt), d, mv, season), dx, dy);
    }
  }
  return c;
}

function chunk(m, cx, cy, season){
  const k = m.id+'|'+cx+'|'+cy+'|'+season;
  const c = chunkCache.get(k);
  if(c){
    chunkCache.delete(k); chunkCache.set(k, c);   // rimettilo in fondo: è "appena usato"
    return c;
  }
  const nuovo = costruisciChunk(m, cx, cy, season);
  chunkCostruiti++;
  chunkCache.set(k, nuovo);
  if(chunkCache.size > CACHE_MAX){
    chunkCache.delete(chunkCache.keys().next().value);   // sfratta il meno recente
  }
  return nuovo;
}

/* ===================================================================
   CICLO GIORNO/NOTTE
   =================================================================== */
function luceAmbiente(ora, meteo, esterno){
  if(!esterno) return { a:0.54, c:[16,14,22] };
  let a=0, c=[20,28,64];
  if(ora < 390){ a = 0.52 - (ora-360)/30*0.26; c=[40,44,92]; }
  else if(ora < 450){ a = 0.26 - (ora-390)/60*0.26; c=[80,60,60]; }
  else if(ora < 1020){ a = 0; }
  else if(ora < 1110){ a = (ora-1020)/90*0.22; c=[110,60,40]; }
  else if(ora < 1200){ a = 0.22+(ora-1110)/90*0.26; c=[60,44,70]; }
  else { a = Math.min(0.66, 0.48+(ora-1200)/240*0.18); c=[16,22,58]; }
  if(meteo==='pioggia'){ a=Math.max(a,0.20); c=[40,52,70]; }
  if(meteo==='temporale'){ a=Math.max(a,0.34); c=[30,38,56]; }
  if(meteo==='nuvoloso') a=Math.max(a,0.10);
  if(meteo==='neve') a=Math.max(a,0.08);
  return {a, c};
}
R.luceAmbiente = luceAmbiente;

/* ===================================================================
   DISEGNO PRINCIPALE
   =================================================================== */
R.disegna = function(G){
  const m = G.mappa();
  /* La camera insegue il giocatore per interpolazione, quindi porta con
     sé una parte frazionaria. Va agganciata al pixel virtuale una volta
     per fotogramma, qui: `|0` tronca verso lo zero, e con lo scostamento
     negativo le caselle a sinistra e a destra dello schermo finivano per
     arrotondare in direzioni opposte — è la cucitura da un pixel che si
     apriva fra i tasselli, e lo sfarfallio quando ci si muove.
     G.cam resta in virgola mobile: se arrotondassimo lì, l'inseguimento
     non convergerebbe più e la camera resterebbe indietro di mezzo pixel
     per sempre. */
  const cam = { x: Math.round(G.cam.x), y: Math.round(G.cam.y) };
  const stag = G.stagione().id;
  const t = G.tempoMs;
  const sole = FX.soleOmbra(G.ora, m.esterno);

  sx.clearRect(0,0,VW,VH);
  sx.fillStyle = m.sfondo; sx.fillRect(0,0,VW,VH);
  targhettePoste.length = 0;      // le targhette del fotogramma prima non contano

  const x0 = Math.max(0, Math.floor(cam.x/T)-1);
  const y0 = Math.max(0, Math.floor(cam.y/T)-1);
  const x1 = Math.min(m.w-1, Math.ceil((cam.x+VW)/T)+1);
  const y1 = Math.min(m.h-1, Math.ceil((cam.y+VH)/T)+2);
  const ox = -cam.x, oy = -cam.y;
  const wf = (t/140|0)%6;

  /* ---------- 1. ACQUA ANIMATA (sotto al terreno pre-cotto) ---------- */
  for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){
    if(WORLD.terreno(m,x,y)!=='acqua') continue;
    if(eFontana(m,x,y)) continue;              // la vasca disegna la sua acqua
    sx.drawImage(ART.water(stag, wf), (x*T+ox)|0, (y*T+oy)|0);
  }

  /* ---------- 2. TERRENO A BLOCCHI ---------- */
  const c0 = Math.max(0, (x0/CH)|0), c1 = ((x1/CH)|0);
  const r0 = Math.max(0, (y0/CH)|0), r1 = ((y1/CH)|0);
  for(let cy=r0; cy<=r1; cy++) for(let cx=c0; cx<=c1; cx++){
    sx.drawImage(chunk(m,cx,cy,stag), (cx*CH*T+ox)|0, (cy*CH*T+oy)|0);
  }

  /* ---------- 3. SCHIUMA SULLE RIVE (animata) ---------- */
  for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){
    if(WORLD.terreno(m,x,y)!=='acqua') continue;
    if(eFontana(m,x,y)) continue;              // niente schiuma sul bordo della vasca
    const px=(x*T+ox)|0, py=(y*T+oy)|0;
    const v=m.v[WORLD.idx(m,x,y)];
    for(const [d,dx,dy] of [['n',0,-1],['s',0,1],['w',-1,0],['e',1,0]]){
      const nt = WORLD.terreno(m,x+dx,y+dy);
      if(nt==='acqua'||nt==='vuoto') continue;
      sx.globalAlpha=0.55;
      sx.drawImage(ART.schiuma(d, v%3, ((t/260|0)+x+y)%4), px, py);
      sx.globalAlpha=1;
    }
  }

  /* ---------- 3b. RIFLESSI SULL'ACQUA ----------
     Chi sta sulla riva si specchia nell'acqua sotto di sé: giocatore,
     abitanti e alberi. Il riflesso è ritagliato sulle sole caselle
     d'acqua, altrimenti sborderebbe sulla sabbia. */
  if(m.esterno) riflessi(m, x0,y0,x1,y1, ox,oy, stag, t, G);

  /* ---------- 4. TERRENO ARATO + DECORAZIONI PIATTE ---------- */
  if(m.coltivabile){
    for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){
      const i=y*m.w+x, s=m.suolo[i];
      if(!s) continue;
      const px=(x*T+ox)|0, py=(y*T+oy)|0;
      // maschera dei vicini arati: l'aiuola prende una forma unica
      let vic = 0;
      if(y>0     && m.suolo[i-m.w]) vic|=1;
      if(x<m.w-1 && m.suolo[i+1])   vic|=2;
      if(y<m.h-1 && m.suolo[i+m.w]) vic|=4;
      if(x>0     && m.suolo[i-1])   vic|=8;
      sx.drawImage(ART.arato(vic, m.v[i]%4, !!s.bagnato, stag), px, py);
      // resti secchi di una coltura morta fuori stagione o calpestata
      if(s.appassita && !s.crop) sx.drawImage(ART.appassita(m.v[i]%4), px, py);
      if(s.concime){
        sx.globalAlpha=0.30;
        sx.fillStyle = s.concime==='ritenzione' ? '#4f8ab8' : '#5a3a20';
        sx.fillRect(px+2,py+2,T-4,T-4);
        sx.globalAlpha=1;
      }
    }
  }
  for(const d of m.deco){
    if(d.x<x0-2||d.x>x1+2||d.y<y0-2||d.y>y1+3) continue;
    disegnaDecoPiatta(d, ox, oy, t, stag);
  }

  /* ---------- 5. ERBA ANIMATA ---------- */
  if(m.esterno) stratoErba(m, x0,y0,x1,y1, ox,oy, stag, t, G);

  /* ---------- 6. OMBRE DELLE NUVOLE ----------
     Stavano in coordinate schermo: scivolavano sul monitor invece di
     restare per terra, e camminando non si muovevano col mondo. Sulle
     superfici piatte (la sabbia della Costa) si leggevano come due ovali
     grigi incollati allo schermo. Ora vivono nel mondo, su un reticolo
     che deriva col vento, e hanno il bordo sfumato invece che netto. */
  if(m.esterno && (G.meteo==='sereno'||G.meteo==='nuvoloso')){
    const forza = G.meteo==='nuvoloso' ? 0.20 : 0.10;
    const PASSO = 460;                       // distanza media fra una nuvola e l'altra
    const deriva = t*0.010;                  // il banco di nuvole scorre verso est
    const RX = 150, RY = 62;
    /* Il margine deve coprire il raggio MASSIMO (la scala arriva a 1.4) più
       lo scarto del reticolo: se una nuvola di bordo entra con una camera e
       non con l'altra, la stessa zolla di terra risulta illuminata in due
       modi diversi a seconda di dove guardi — che è esattamente il difetto
       che stiamo togliendo. */
    const MX = RX*1.4 + PASSO*0.7, MY = RY*1.4 + PASSO*0.7;
    const gx0 = Math.floor((cam.x - deriva - MX) / PASSO);
    const gx1 = Math.floor((cam.x - deriva + VW + MX) / PASSO);
    const gy0 = Math.floor((cam.y - MY) / PASSO);
    const gy1 = Math.floor((cam.y + VH + MY) / PASSO);
    for(let gy=gy0; gy<=gy1; gy++) for(let gx=gx0; gx<=gx1; gx++){
      // ogni cella del reticolo sposta la sua nuvola di un po', così non
      // si vede la griglia
      const wx = gx*PASSO + ART.hsh(gx,gy,211)*PASSO*0.7 + deriva;
      const wy = gy*PASSO + ART.hsh(gx,gy,212)*PASSO*0.7;
      const pxc = Math.round(wx - cam.x), pyc = Math.round(wy - cam.y);
      /* la scala è a quattro gradini, non continua: ogni misura diversa
         è una pozza da cuocere, e con la scala continua la cache
         crescerebbe per sempre */
      const scala = 0.7 + (Math.round(ART.hsh(gx,gy,213)*3)/3)*0.7;
      const rx = RX*scala, ry = RY*scala;
      if(pxc < -rx || pxc > VW+rx || pyc < -ry || pyc > VH+ry) continue;
      const a = forza * (0.75 + ART.hsh(gx,gy,214)*0.5);
      /* cotta a piena opacità e schiarita qui: così la stessa pozza
         serve a tutte le intensità, e il retino non si sfalda */
      const pz = ART.pozza(rx, ry, 1, PAL.c.nuvole.ombra, 4);
      sx.globalAlpha = a;
      sx.drawImage(pz, pxc - ((pz.width-1)>>1), pyc - ((pz.height-1)>>1));
      sx.globalAlpha = 1;
    }
  }

  /* ---------- 7. RACCOLTA DEGLI SPRITE ---------- */
  const lista = [];

  for(const e of m.edifici){
    const by = (e.y+e.h)*T;
    if((e.x+e.w)*T < cam.x-200 || e.x*T > cam.x+VW+200) continue;
    if(by < cam.y-300 || e.y*T > cam.y+VH+140) continue;
    lista.push({
      y:by,
      s:()=>ombraEdificio(e, ox, oy, G, stag, sole),
      d:()=>disegnaEdificio(e, ox, oy, G, stag)
    });
  }

  for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){
    const i=y*m.w+x;
    const o=m.obj[i];
    if(o && o.t!=='muro' && o.t!=='porta'){
      const px=(x*T+ox)|0, py=(y*T+oy)|0;
      lista.push({
        y:(y+1)*T,
        s:()=>ombraOggetto(o, px, py, x, y, t, stag, sole),
        d:()=>disegnaOggetto(o, px, py, x, y, t, stag, G)
      });
    }
    if(m.coltivabile){
      const s=m.suolo[i];
      if(s && s.crop){
        const px=(x*T+ox)|0, py=(y*T+oy)|0;
        lista.push({
          y:(y+1)*T-2,
          s:()=>{ FX.ombraTerra(sx, px+16, py+27, 7, 2.6, 0.18); },
          d:()=>disegnaColtura(s, px, py, x, y, t)
        });
      }
    }
  }

  for(const d of m.deco){
    if(d.x<x0-2||d.x>x1+2||d.y<y0-3||d.y>y1+3) continue;
    if(d.t==='cartello'||d.t==='erbe'||d.t==='ortaggio'||d.t==='fungo_luce'){
      lista.push({ y:(d.y+1)*T, d:()=>disegnaDecoAlta(d, ox, oy, t, stag) });
    }
  }

  /* Anche chi cammina va agganciato al pixel: le posizioni sono in
     virgola mobile, e uno sprite che sta a metà casella si ridisegna
     ogni fotogramma con i pezzi arrotondati in modo diverso. */
  for(const n of G.npcVivi()){
    const px = Math.round(n.px)+ox, py = Math.round(n.py)+oy;
    if(px<-60||px>VW+60||py<-90||py>VH+60) continue;
    lista.push({ y:n.py,
      s:()=>{ FX.ombraTerra(sx, px, py-1, 8, 3, 0.24); },
      d:()=>{
        const look = DATA.NPCS[n.id].look;
        if(!look.spirito) sx.drawImage(FX.contorno(ART.charSprite(look, n.dir, n.frame)), (px-14)|0, (py-37)|0);
        ART.drawChar(sx, px|0, py|0, look, n.dir, n.frame, {t:t, blink:n.blink, senzaOmbra:true});
        if(n.emote) sx.drawImage(ART.emote(n.emote), (px-16)|0, (py-58)|0);
      }});
  }

  /* i passanti: stessa gente, meno storia */
  for(const p of (G.passanti||[])){
    if(p.mappa!==m.id) continue;
    const px = Math.round(p.px)+ox, py = Math.round(p.py)+oy;
    if(px<-60||px>VW+60||py<-90||py>VH+60) continue;
    lista.push({ y:p.py,
      s:()=>{ FX.ombraTerra(sx, px, py-1, 8, 3, 0.24); },
      d:()=>{
        sx.drawImage(FX.contorno(ART.charSprite(p.look, p.dir, p.frame||0)), (px-14)|0, (py-37)|0);
        ART.drawChar(sx, px|0, py|0, p.look, p.dir, p.frame||0, {t:t, senzaOmbra:true});
      }});
  }

  for(const a of G.animali){
    if(a.mappa!==m.id) continue;
    const px=Math.round(a.px)+ox, py=Math.round(a.py)+oy;
    if(px<-60||px>VW+60||py<-70||py>VH+60) continue;
    lista.push({ y:a.py,
      s:()=>{ FX.ombraTerra(sx, px, py-1, 7, 2.6, 0.22); },
      d:()=>{
        const img = a.tipo==='gatto' ? ART.gatto((t/300|0)%2) : ART.gallina((t/260|0)%2, a.dir);
        sx.drawImage(FX.contorno(img), (px-17)|0, (py-29)|0);
        sx.drawImage(img, (px-16)|0, (py-28)|0);
      }});
  }

  /* fauna */
  if(window.MOBS){
    for(const b of MOBS.lista()){
      const px=Math.round(b.x)+ox, py=Math.round(b.y)+oy;
      if(px<-80||px>VW+80||py<-90||py>VH+80) continue;
      lista.push({ y:b.y, d:()=>MOBS.disegnaUno(sx, b, ox, oy) });
    }
  }

  /* giocatore */
  {
    const px=Math.round(G.p.px)+ox, py=Math.round(G.p.py)+oy;
    lista.push({ y:G.p.py,
      s:()=>{ if(!G.p.dorme) FX.ombraTerra(sx, px, py-1, 8.5, 3.2, 0.26); },
      d:()=>{
        if(G.p.dorme) return;
        sx.drawImage(FX.contorno(ART.charSprite(G.p.look, G.p.dir, G.p.frame)), (px-14)|0, (py-37)|0);
        ART.drawChar(sx, px|0, py|0, G.p.look, G.p.dir, G.p.frame,
          { attrezzo:G.p.attrezzoVisibile, uso:G.p.usoT>0, blink:G.p.blink, t:t, senzaOmbra:true });
      }});
  }

  /* ---------- 8. OMBRE PROIETTATE, POI SPRITE ---------- */
  for(const it of lista) if(it.s) it.s();
  lista.sort((a,b)=>a.y-b.y);
  for(const it of lista) it.d();

  /* ---------- 8b. FUMETTI ----------
     Dopo tutti gli sprite e fuori dall'ordinamento in profondità: una
     nuvoletta che finisce dietro a un albero non si legge, e chi parla
     dietro un albero è proprio quello che vale la pena sentire. */
  if(G.chiacchiere) for(const c of G.chiacchiere){
    if(c.mappa !== m.id) continue;
    const px = Math.round(c.x)+ox, py = Math.round(c.y)+oy;
    if(px<-80||px>VW+80||py<-90||py>VH+60) continue;
    fumetto(c.testo, px, py-42, c.opacita);
  }

  /* ---------- 9. PARTICELLE ---------- */
  for(const p of G.particelle) disegnaParticella(p, ox, oy);

  /* ---------- 10. CASELLA BERSAGLIO ---------- */
  if(G.bersaglio && !G.p.dorme){
    const b=G.bersaglio;
    const px=(b.x*T+ox)|0, py=(b.y*T+oy)|0;
    sx.globalAlpha = 0.45+Math.sin(t*0.006)*0.16;
    sx.strokeStyle = b.ok ? '#ffe9a8' : '#e88a72';
    sx.lineWidth = 1;
    sx.strokeRect(px+1.5, py+1.5, T-3, T-3);
    sx.globalAlpha = 0.12;
    sx.fillStyle = b.ok ? '#ffe9a8' : '#e88a72';
    sx.fillRect(px+1, py+1, T-2, T-2);
    sx.globalAlpha=1;
  }

  /* ---------- 11. METEO ---------- */
  if(m.esterno) disegnaMeteo(G, t);

  /* ---------- 12. LUCI ---------- */
  const amb = luceAmbiente(G.ora, G.meteo, m.esterno);
  const luci = G.luci();
  if(amb.a > 0.015){
    lx.clearRect(0,0,VW,VH);
    lx.fillStyle = `rgba(${amb.c[0]},${amb.c[1]},${amb.c[2]},${amb.a})`;
    lx.fillRect(0,0,VW,VH);
    lx.globalCompositeOperation='destination-out';
    for(const L of luci){
      const px=Math.round(L.x)+ox, py=Math.round(L.y)+oy;
      if(px<-160||px>VW+160||py<-160||py>VH+160) continue;
      /* Il tremolio della fiamma sta sull'intensità e non più sul
         raggio: un raggio che respira vuol dire una pozza diversa a ogni
         fotogramma, e con il retino i puntini striscerebbero verso fuori
         come formiche. */
      const puls = 1 + Math.sin(t*0.004 + (L.f||0))*0.07;
      const pz = ART.pozza(L.r, L.r, 1, '#000000', 5);
      lx.globalAlpha = Math.max(0, Math.min(1, L.i*puls));
      lx.drawImage(pz, px - ((pz.width-1)>>1), py - ((pz.height-1)>>1));
      lx.globalAlpha = 1;
    }
    lx.globalCompositeOperation='source-over';
    sx.drawImage(light,0,0);
  }

  /* ---------- 13. BLOOM ---------- */
  if(amb.a > 0.04){
    const bx = FX.iniziaBloom(VW, VH);
    for(const L of luci){
      if(!L.caldo) continue;
      const px=Math.round(L.x)+ox, py=Math.round(L.y)+oy;
      if(px<-200||px>VW+200||py<-200||py>VH+200) continue;
      const r = L.r*0.55;              // alone stretto: il bloom deve
      const g = bx.createRadialGradient(px,py,0,px,py,r);   // accennare, non annebbiare
      const inten = Math.min(1, amb.a*1.5)*L.i;
      g.addColorStop(0, `rgba(255,206,132,${0.34*inten})`);
      g.addColorStop(0.4, `rgba(255,178,96,${0.13*inten})`);
      g.addColorStop(1, 'rgba(255,160,80,0)');
      bx.fillStyle=g;
      bx.beginPath(); bx.arc(px,py,r,0,6.3); bx.fill();
    }
    // le lucciole brillano
    for(const p of G.particelle){
      if(p.t!=='lucciola') continue;
      const px=Math.round(p.x)+ox, py=Math.round(p.y)+oy;
      const g = bx.createRadialGradient(px,py,0,px,py,7);
      g.addColorStop(0,'rgba(230,250,150,0.42)');
      g.addColorStop(1,'rgba(200,240,120,0)');
      bx.fillStyle=g; bx.beginPath(); bx.arc(px,py,7,0,6.3); bx.fill();
    }
    FX.applicaBloom(sx, VW, VH, 0.42);
  }

  /* ---------- 14. GRADAZIONE, RAGGI E VIGNETTATURA ---------- */
  FX.gradazione(sx, VW, VH, G.ora, G.meteo, m.esterno);
  if(m.esterno) FX.raggi(sx, VW, VH, G.ora, G.meteo);
  /* La vignettatura era un gradiente steso sulla tela finale, cioè alla
     risoluzione vera del monitor: sfumava attraverso i pixel del gioco
     invece che insieme a loro, ed era la cosa più morbida sullo schermo.
     Ora è retinata a misura virtuale e ingrandisce con tutto il resto. */
  sx.drawImage(ART.vignetta(VW, VH, 0.32), 0, 0);

  /* ---------- BLIT ---------- */
  ctx.clearRect(0,0,cvs.width,cvs.height);
  ctx.drawImage(scene, 0,0, VW*SCALE, VH*SCALE);
};

/* ===================================================================
   RIFLESSI SULL'ACQUA
   =================================================================== */

/* c'è acqua sotto questa casella? quante caselle di fila? */
function acquaSotto(m, tx, ty){
  let n = 0;
  while(n < 3 && WORLD.terreno(m, tx, ty+1+n) === 'acqua') n++;
  return n;
}

/* ritaglia sulle caselle d'acqua nell'area del riflesso, poi disegna */
function specchia(m, sx0, img, cxMondo, byMondo, ox, oy, t, alpha, alt){
  const tx = (cxMondo/T)|0, ty = ((byMondo-1)/T)|0;
  const prof = acquaSotto(m, tx, ty);
  if(!prof) return;

  sx0.save();
  sx0.beginPath();
  const raggio = 2;                       // il riflesso può sbandare di lato
  for(let d=0; d<prof; d++) for(let k=-raggio; k<=raggio; k++){
    if(WORLD.terreno(m, tx+k, ty+1+d) !== 'acqua') continue;
    sx0.rect((tx+k)*T+ox, (ty+1+d)*T+oy, T, T);
  }
  sx0.clip();
  FX.riflesso(sx0, img, cxMondo+ox, byMondo+oy, img.width, alt||img.height, t, alpha);
  sx0.restore();
}

function riflessi(m, x0,y0,x1,y1, ox,oy, stag, t, G){
  /* --- alberi e cespugli sulla riva --- */
  for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){
    const o = m.obj[WORLD.idx(m,x,y)];
    if(!o) continue;
    if(o.t==='albero'){
      if(!acquaSotto(m,x,y)) continue;
      const img = ART.tree(o.kind, stag, o.stage, varianteDi(x,y));
      specchia(m, sx, img, x*T+16, (y+1)*T, ox, oy, t, 0.20, img.height*0.8);
    } else if(o.t==='cespuglio'){
      if(!acquaSotto(m,x,y)) continue;
      specchia(m, sx, ART.bush(stag,o.v,o.bacche), x*T+16, (y+1)*T, ox, oy, t, 0.18);
    }
  }

  /* --- abitanti e giocatore --- */
  const gente = [];
  for(const n of G.npcVivi()) gente.push({px:n.px, py:n.py, look:DATA.NPCS[n.id].look, dir:n.dir, frame:n.frame});
  if(!G.p.dorme) gente.push({px:G.p.px, py:G.p.py, look:G.p.look, dir:G.p.dir, frame:G.p.frame});
  for(const g of gente){
    if(!g.look || g.look.spirito) continue;
    const px = g.px+ox;
    if(px < -60 || px > VW+60) continue;
    const tx=(g.px/T)|0, ty=(g.py/T)|0;
    if(!acquaSotto(m,tx,ty)) continue;
    specchia(m, sx, ART.charSprite(g.look, g.dir, g.frame), g.px, (ty+1)*T, ox, oy, t, 0.26);
  }
}

/* ===================================================================
   ERBA ANIMATA
   =================================================================== */
function stratoErba(m, x0,y0,x1,y1, ox,oy, stag, t, G){
  const px0 = G.p.px, py0 = G.p.py;
  for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){
    const i = y*m.w+x;
    if(WORLD.terreno(m,x,y)!=='erba') continue;
    if(m.suolo && m.suolo[i]) continue;
    const o = m.obj[i];
    if(o && o.solido) continue;

    // campo di densità a bassa frequenza: radure spelacchiate e zone folte
    const dens = ART.rumore(x, y, 5.5)*0.75 + ART.rumore(x, y, 1.7)*0.25;
    if(dens < 0.24) continue;
    const quanti = dens > 0.68 ? 3 : (dens > 0.42 ? 2 : 1);

    for(let k=0;k<quanti;k++){
      const h = ART.hsh(x, y, 900+k);
      if(h > 0.30 + dens*0.55) continue;
      const bx = x*T + 4 + Math.round(ART.hsh(x,y,910+k)*22);
      const by = y*T + 6 + Math.round(ART.hsh(x,y,920+k)*22);
      const v  = (ART.hsh(x,y,930+k)*6)|0;

      // vento + spinta del giocatore che passa
      let piega = FX.vento(bx, by) * 3.1;
      const dx = bx-px0, dy = by-py0;
      const dist = Math.hypot(dx, dy);
      if(dist < 26) piega += (dx>0?1:-1) * (1 - dist/26) * 4.5;
      piega = Math.max(-4, Math.min(4, Math.round(piega)));

      sx.drawImage(ART.ciuffo(stag, v, piega), (bx+ox-10)|0, (by+oy-14)|0);
    }
  }
}

/* ===================================================================
   OMBRE
   =================================================================== */
function ombraEdificio(e, ox, oy, G, stag, sole){
  if(sole.a < 0.03) return;
  const opt = { lit: G.ora>1020 || G.ora<420, season:stag, liv:e.liv||0 };
  if(e.kind==='santuario') opt.liv = G.braci;
  const img = ART.building(e.kind, opt);
  const w = e.w*T, scr = w/img.width;
  FX.ombraSprite(sx, img, (e.x*T+ox)+w/2, ((e.y+e.h)*T+oy), sole, w, img.height*scr, 0);
}

function ombraOggetto(o, px, py, gx, gy, t, stag, sole){
  if(sole.a < 0.03){
    if(o.t==='albero'&&o.stage===2) FX.ombraTerra(sx, px+16, py+30, 13, 4, 0.16);
    return;
  }
  switch(o.t){
    case 'albero': {
      // stessa variante del disegno, altrimenti l'ombra non è la sua
      const img = ART.tree(o.kind, stag, o.stage, varianteDi(gx,gy));
      const sway = FX.vento(gx*T, gy*T) * (o.stage===2?2.2:0.9);
      FX.ombraSprite(sx, img, px+16, py+T, sole, img.width, img.height, sway);
      break;
    }
    case 'ceppo':  FX.ombraTerra(sx, px+16, py+26, 11, 3.4, sole.a*0.8); break;
    case 'sasso':  FX.ombraTerra(sx, px+16, py+26, 11, 3.6, sole.a*0.8); break;
    case 'cespuglio': FX.ombraTerra(sx, px+16, py+28, 12, 3.8, sole.a*0.75); break;
    case 'consegna': case 'silo': case 'lampione':
    case 'panchina': case 'fioriera': case 'bancarella': case 'casse': {
      FX.ombraTerra(sx, px+16, py+28, 13, 4, sole.a*0.7); break;
    }
    case 'macchina': case 'mobile': {
      const opt = {attivo:!!o.dentro, pronto:!!o.pronto};
      // l'ombra deve venire dal pezzo giusto, non da quello isolato
      if(o.kind==='recinto' || o.kind==='cancelletto') opt.lati = latiRecinto(G.mappa(), gx, gy);
      const img = ART.placeable(o.kind, opt);
      FX.ombraSprite(sx, img, px+16, py+T, sole, img.width, img.height, 0);
      break;
    }
    case 'pietra_rituale': FX.ombraTerra(sx, px+16, py+30, 9, 3, sole.a*0.8); break;
    case 'erbaccia': case 'fiori': case 'foraggio':
      FX.ombraTerra(sx, px+16, py+26, 6, 2.2, sole.a*0.55); break;
  }
}

/* ===================================================================
   SPRITE
   =================================================================== */
function disegnaEdificio(e, ox, oy, G, stag){
  const opt = { lit: G.ora>1020 || G.ora<420, season:stag, liv:e.liv||0 };
  if(e.kind==='santuario') opt.liv = G.braci;
  const img = ART.building(e.kind, opt);
  const w = e.w*T;
  const dw = img.width, dh = img.height;
  const sc = w/dw;
  const px = (e.x*T+ox)|0;
  const py = ((e.y+e.h)*T + oy - dh*sc)|0;
  sx.drawImage(img, px, py, dw*sc, dh*sc);

  if((e.kind==='casa'||e.kind==='locanda'||e.kind==='fucina'||e.kind==='capanna') && opt.lit){
    const cxp = px + w*(e.kind==='fucina'?0.33:0.72);
    const cyp = py + dh*sc*(e.kind==='fucina'?0.1:0.03);
    const vento = FX.vento(e.x*T, e.y*T);
    sx.globalAlpha=0.28;
    for(let i=0;i<6;i++){
      const tt=(G.tempoMs*0.0006 + i*0.17)%1;
      const r=3+tt*10;
      sx.fillStyle='#cfc8bc';
      sx.beginPath();
      sx.arc(cxp + Math.sin(tt*5+i)*7 + vento*tt*22, cyp - tt*38, r, 0, 6.3);
      sx.fill();
    }
    sx.globalAlpha=1;
  }
  if(e.kind==='santuario' && G.braci>=4){
    sx.globalAlpha=0.18+Math.sin(G.tempoMs*0.003)*0.05;
    sx.fillStyle='#ffe9a8';
    sx.beginPath(); sx.arc(px+w/2, py+dh*sc*0.55, 70, 0, 6.3); sx.fill();
    sx.globalAlpha=1;
  }
}

/* Da che parte continua la staccionata. Il cancelletto conta come
   staccionata: è un pezzo della fila, non un buco nella fila, e se non
   contasse le traverse gli si fermerebbero a un passo di distanza. */
function eRecinto(m, x, y){
  if(!m || !WORLD.dentro(m,x,y)) return false;
  const o = m.obj[WORLD.idx(m,x,y)];
  return !!(o && o.t==='mobile' && (o.kind==='recinto' || o.kind==='cancelletto'));
}
function latiRecinto(m, x, y){
  return (eRecinto(m,x,y-1) ? 1 : 0) | (eRecinto(m,x+1,y) ? 2 : 0)
       | (eRecinto(m,x,y+1) ? 4 : 0) | (eRecinto(m,x-1,y) ? 8 : 0);
}

function disegnaOggetto(o, px, py, gx, gy, t, stag, G){
  switch(o.t){
    case 'albero': {
      const img = ART.tree(o.kind, stag, o.stage, varianteDi(gx,gy));
      const vento = FX.vento(gx*T, gy*T);
      const sway = vento * (o.stage===2?2.6:1.1) + Math.sin(t*0.0011 + gx*0.7 + gy*0.3)*0.5;
      const shake = o.shake ? Math.sin(t*0.05)*o.shake : 0;
      sx.save();
      sx.translate(px+T/2 + shake, py+T);
      // il tronco resta fermo, la chioma ondeggia: leggera inclinazione
      sx.transform(1, 0, sway*0.012, 1, 0, 0);
      sx.drawImage(img, -img.width/2, -img.height+6);
      sx.restore();
      break;
    }
    case 'ceppo': sx.drawImage(ART.stump(varianteDi(gx,gy)), px-4, py+2); break;
    case 'sasso': {
      const img = ART.rock(o.carbone?'geode':o.kind, (gx*3+gy)%4);
      const shake = o.shake? Math.sin(t*0.06)*o.shake : 0;
      sx.drawImage(img, px-4+shake, py-4);
      if(o.kind!=='pietra'||o.carbone){
        sx.globalAlpha=0.20+Math.sin(t*0.003+gx)*0.09;
        const col = o.carbone?'#8a6038':{rame:'#e08a4a',ferro:'#d8dce8',oro:'#ffd24a',
                     ametista:'#c98ae8',quarzo:'#eaf4ff',geode:'#8ac0d8'}[o.kind]||'#fff';
        sx.fillStyle=col;
        sx.beginPath(); sx.arc(px+16,py+14,13,0,6.3); sx.fill();
        sx.globalAlpha=1;
      }
      break;
    }
    case 'erbaccia': {
      const vento = FX.vento(gx*T, gy*T);
      sx.save();
      sx.translate(px+16, py+26);
      sx.transform(1,0,vento*0.09,1,0,0);
      sx.drawImage(ART.weed(stag,o.v), -16, -26);
      sx.restore();
      break;
    }
    case 'ramo': {
      sx.save(); sx.translate(px+16,py+22); sx.rotate(o.v*0.7);
      ART.px(sx,-9,-2,18,4,'#8a6038'); ART.px(sx,-9,-2,18,1,'#a8763c');
      ART.px(sx,-4,-6,7,3,'#7a5432');
      sx.restore(); break;
    }
    case 'cespuglio': {
      const vento = FX.vento(gx*T, gy*T);
      sx.save();
      sx.translate(px+16, py+30);
      sx.transform(1,0,vento*0.045,1,0,0);
      sx.drawImage(ART.bush(stag,o.v,o.bacche), -20, -32);
      sx.restore();
      break;
    }
    case 'fiori': {
      const S=DATA.SEASONS.find(s=>s.id===stag);
      const vento = FX.vento(gx*T, gy*T);
      for(let i=0;i<4;i++){
        const fx=px+6+((ART.hsh(i,o.v,301)*20)|0), fy=py+10+((ART.hsh(i,o.v,302)*14)|0);
        const sw=Math.sin(t*0.002+i+gx)*1 + vento*1.6;
        ART.px(sx,fx+sw,fy,1,6,'#5f9c3c');
        if(stag==='inverno') continue;
        for(let k=0;k<4;k++){ const a=k/4*6.28;
          ART.px(sx,(fx+sw+Math.cos(a)*2.4)|0,(fy-2+Math.sin(a)*2.4)|0,2,2, i%2?S.accent:'#fff4d8'); }
        ART.px(sx,fx+sw,fy-2,1,1,'#ffe270');
      }
      break;
    }
    case 'foraggio': {
      sx.drawImage(ART.forage(o.item,(gx+gy)%3), px, py);
      sx.globalAlpha=0.2+Math.sin(t*0.004+gx)*0.1;
      sx.fillStyle='#fff4c8'; sx.beginPath(); sx.arc(px+16,py+18,10,0,6.3); sx.fill();
      sx.globalAlpha=1;
      break;
    }
    case 'consegna': {
      ART.px(sx,px+1,py+8,30,20,'#7a5636');
      ART.px(sx,px+1,py+8,30,3,'#a8763c');
      ART.px(sx,px+1,py+25,30,3,'#5f4028');
      ART.px(sx,px+3,py+4,26,6,'#8a6038');
      ART.px(sx,px+3,py+4,26,2,'#b58a5e');
      ART.px(sx,px+10,py+12,12,8,'#3a2a1c');
      ART.px(sx,px-1,py+10,3,14,'#c9a05a');
      ART.px(sx,px+30,py+10,3,14,'#c9a05a');
      break;
    }
    case 'lampione': {
      ART.px(sx,px+14,py+6,4,24,'#3f3a34');
      ART.px(sx,px+10,py+28,12,3,'#3f3a34');
      ART.px(sx,px+10,py-4,12,12,'#4a4540');
      const acceso = G.ora>1020||G.ora<420;
      ART.px(sx,px+12,py-2,8,8, acceso?'#ffe9a8':'#5a5550');
      ART.px(sx,px+9,py-7,14,4,'#3f3a34');
      if(acceso){
        sx.globalAlpha=0.25+Math.sin(t*0.004+gx)*0.05;
        sx.fillStyle='#ffd98a'; sx.beginPath(); sx.arc(px+16,py+2,26,0,6.3); sx.fill();
        sx.globalAlpha=1;
      }
      break;
    }
    case 'fontana': break;

    case 'panchina': {
      const w=28, y0=py+10;
      ART.px(sx,px+3,y0+8,3,12,'#4a4640'); ART.px(sx,px+26,y0+8,3,12,'#4a4640');
      ART.px(sx,px+1,y0+19,7,3,'#3a3630'); ART.px(sx,px+24,y0+19,7,3,'#3a3630');
      for(let k=0;k<3;k++) ART.px(sx,px+2,y0+8+k*4,w,3, k%2?'#a8763c':'#96704a');
      for(let k=0;k<3;k++) ART.px(sx,px+2,y0-6+k*5,w,4, k%2?'#96704a':'#a8763c');
      ART.px(sx,px+2,y0-6,w,1,'#c99a5e');
      ART.px(sx,px+2,y0+8,w,1,'#c99a5e');
      break;
    }
    case 'fioriera': {
      const S=DATA.SEASONS.find(s=>s.id===stag);
      const vento = FX.vento(gx*T, gy*T);
      ART.px(sx,px+3,py+16,26,14,'#a8663c');
      ART.px(sx,px+3,py+16,26,3,'#c98a5e');
      ART.px(sx,px+1,py+13,30,5,'#b8764c');
      ART.px(sx,px+1,py+13,30,2,'#d09a6e');
      ART.px(sx,px+3,py+28,26,2,'#7a4a28');
      ART.px(sx,px+4,py+17,24,3,'#5f4028');
      if(stag!=='inverno'){
        for(let i=0;i<5;i++){
          const bx=px+6+i*5, sw=Math.sin(t*0.0022+i+gx)*1.2 + vento*2;
          ART.px(sx,bx+sw,py+8,2,10,'#5f9c3c');
          const col=[S.accent,'#fff4d8','#f0c04a','#e8687a','#a87fd0'][(o.v+i)%5];
          for(let k=0;k<4;k++){ const a=k/4*6.28;
            ART.px(sx,(bx+sw+Math.cos(a)*2.6)|0,(py+7+Math.sin(a)*2.6)|0,2,2,col); }
          ART.px(sx,bx+sw,py+7,1,1,'#ffe270');
        }
      } else {
        for(let i=0;i<4;i++) ART.px(sx,px+7+i*5,py+13,3,4,'#8fa5ae');
        ART.px(sx,px+3,py+12,26,3,'#ffffff');
      }
      break;
    }
    case 'bancarella': {
      const vento = FX.vento(gx*T, gy*T);
      ART.px(sx,px-6,py+16,44,4,'#8a6038');
      ART.px(sx,px-6,py+16,44,1,'#a8763c');
      ART.px(sx,px-3,py+20,4,12,'#6b4a2e'); ART.px(sx,px+31,py+20,4,12,'#6b4a2e');
      const merci=[['#d8452c','#e8892c','#7fc45a'],['#f5d24f','#8a4fb0','#e8465c'],['#7fae4a','#c9a44c','#4a63b8']][o.v%3];
      for(let k=0;k<3;k++){
        ART.px(sx,px-4+k*15,py+8,13,8,'#a8763c');
        for(let i=0;i<3;i++) ART.circ(sx,px+1+k*15+i*4,py+8,2.4,merci[i]);
      }
      // tendone che respira col vento
      sx.save();
      sx.translate(px+16, py-14);
      sx.transform(1,0,vento*0.03,1,0,0);
      ART.px(sx,-24,0,48,3,'#8a6038');
      for(let k=0;k<8;k++) ART.px(sx,-24+k*6,3,6,10, k%2?'#d84f4f':'#f2e8d0');
      for(let k=0;k<8;k++) ART.px(sx,-24+k*6,13,6,3, k%2?'#b03d3d':'#d8ceb4');
      sx.restore();
      ART.px(sx,px-7,py-11,3,28,'#7a5432'); ART.px(sx,px+36,py-11,3,28,'#7a5432');
      break;
    }
    case 'casse': {
      ART.px(sx,px+2,py+12,20,18,'#a8763c');
      ART.px(sx,px+2,py+12,20,3,'#c99a5e');
      ART.px(sx,px+2,py+27,20,3,'#7a5432');
      ART.px(sx,px+2,py+18,20,2,'#8a6038');
      ART.px(sx,px+10,py+12,3,18,'#8a6038');
      if(o.v>0){
        ART.px(sx,px+6,py+4,16,9,'#b58a5e');
        ART.px(sx,px+6,py+4,16,2,'#d0a878');
        for(let i=0;i<3;i++) ART.circ(sx,px+9+i*5,py+4,2.4,['#d8452c','#7fc45a','#e8892c'][i]);
      }
      if(o.v>1){
        ART.px(sx,px+22,py+14,12,16,'#96704a');
        ART.px(sx,px+21,py+17,14,2,'#8a8a92');
        ART.px(sx,px+21,py+25,14,2,'#8a8a92');
        ART.ellip(sx,px+28,py+14,6,2.5,'#a8763c');
      }
      break;
    }
    case 'stalagmite': {
      const h=14+o.v*6;
      sx.fillStyle='#565149';
      sx.beginPath(); sx.moveTo(px+10,py+T); sx.lineTo(px+16,py+T-h); sx.lineTo(px+22,py+T); sx.fill();
      sx.fillStyle='#68625a';
      sx.beginPath(); sx.moveTo(px+12,py+T); sx.lineTo(px+16,py+T-h+3); sx.lineTo(px+18,py+T); sx.fill();
      break;
    }
    case 'pietra_rituale': {
      const h=26;
      sx.fillStyle='#6b6762';
      sx.beginPath(); sx.moveTo(px+9,py+T); sx.lineTo(px+11,py+T-h); sx.lineTo(px+21,py+T-h+2); sx.lineTo(px+23,py+T); sx.fill();
      sx.fillStyle='#7d786f'; sx.fillRect(px+12,py+T-h+2,7,h-3);
      sx.globalAlpha=0.5+Math.sin(t*0.002+o.v)*0.3;
      sx.fillStyle= G.braci>=4?'#ffe9a8':'#8fd0c8';
      sx.fillRect(px+14,py+T-18,4,2); sx.fillRect(px+15,py+T-14,2,5);
      sx.globalAlpha=1;
      break;
    }
    /* ---------- ARREDI DEGLI INTERNI ---------- */
    case 'bancone': {
      const I = PAL.c.interno;
      ART.px(sx,px,py+10,T,4,I.legnoLuce);              // piano
      ART.px(sx,px,py+14,T,12,I.legno);                 // fronte
      ART.px(sx,px,py+25,T,3,I.legnoOmbra);
      ART.px(sx,px,py+18,T,1,I.legnoOmbra);             // fascia
      if(o.v===0){ ART.px(sx,px+6,py+4,8,6,I.legnoOmbra); ART.circ(sx,px+10,py+5,2.4,'#d8452c'); }
      if(o.v===1){ ART.px(sx,px+4,py+5,10,5,'#c9b48c'); ART.px(sx,px+4,py+5,10,1,'#e8dcc0'); }
      break;
    }
    /* Scaffalatura a parete. Le stanze erano arredate a casse sparse per
       terra, che è come sembra un magazzino svaligiato: una bottega si
       legge come bottega perché la roba sta *sui muri*, in file. */
    case 'scaffale': {
      const I = PAL.c.interno;
      const merci = [['#c8402c','#4a7a3c','#d8a02c'], ['#7a4fb0','#c9b48c','#3f7a9c'],
                     ['#d86a2c','#8ab04a','#b03f4a']][ (o.v||0) % 3 ];
      for(let r=0;r<2;r++){
        const y0 = py + 2 + r*13;
        ART.px(sx, px, y0+8, T, 3, I.legno);              // il ripiano
        ART.px(sx, px, y0+8, T, 1, I.legnoLuce);
        ART.px(sx, px, y0+11, T, 1, I.legnoOmbra);
        // la merce sopra, allineata come la mette chi la vende
        for(let k=0;k<3;k++){
          if(ART.hsh(k, (o.v||0)*3+r, 771) < 0.22) continue;   // qualche vuoto
          const bx = px + 3 + k*10, h = 5 + ((ART.hsh(k,r+(o.v||0),772)*3)|0);
          ART.px(sx, bx, y0+8-h, 7, h, merci[k]);
          ART.px(sx, bx, y0+8-h, 7, 1, ART.shade(merci[k], 0.2));
          ART.px(sx, bx+6, y0+8-h, 1, h, ART.shade(merci[k], -0.2));
        }
      }
      // i montanti laterali, che tengono insieme la fila
      ART.px(sx, px, py+2, 2, 24, I.legnoOmbra);
      ART.px(sx, px+T-2, py+2, 2, 24, I.legnoOmbra);
      break;
    }
    case 'incudine': {
      const I = PAL.c.interno;
      ART.px(sx,px+8,py+20,16,8,I.legnoOmbra);          // ceppo
      ART.px(sx,px+8,py+20,16,2,I.legno);
      ART.px(sx,px+6,py+12,20,7,I.metallo);             // corpo
      ART.px(sx,px+6,py+12,20,2,I.metalloLuce);
      ART.px(sx,px+10,py+18,12,3,I.metalloOmbra);
      ART.px(sx,px+2,py+13,6,4,I.metallo);              // corno
      ART.px(sx,px+2,py+13,6,1,I.metalloLuce);
      break;
    }
    case 'camino': {
      const I = PAL.c.interno;
      ART.px(sx,px-2,py-6,36,34,I.pareteOmbra);         // cappa
      ART.px(sx,px-2,py-6,36,3,I.zoccoloLuce);
      ART.px(sx,px+4,py+8,24,20,'#1a120b');             // bocca
      const b = 0.55 + Math.sin(t*0.006)*0.28;
      sx.globalAlpha = b;
      ART.ellip(sx,px+16,py+24,10,6,I.brace);
      sx.globalAlpha = Math.min(1,b+0.25);
      ART.ellip(sx,px+16,py+25,6,3.5,I.braceCuore);
      sx.globalAlpha = 1;
      for(let k=0;k<3;k++){                              // legna
        ART.px(sx,px+6+k*6,py+22,6,3,I.legnoOmbra);
      }
      break;
    }
    /* Il letto stava tutto dentro una casella, ed era più piccolo del
       tappetino che gli sta accanto: da lontano sembrava una macchia di
       stoffa, non un mobile. Adesso sale contro la parete come fa la
       cappa del camino — occupa sempre una casella sola, ma si vede che
       è un letto. */
    case 'letto': {
      const I = PAL.c.interno;
      const y0 = py - 18;                                // testata addossata al muro
      ART.px(sx,px+1,y0,30,50,I.legnoOmbra);             // struttura
      ART.px(sx,px+2,y0+1,28,48,I.legno);
      ART.px(sx,px+2,y0+1,28,2,I.legnoLuce);
      ART.px(sx,px+1,y0+47,30,3,I.legnoOmbra);           // pediera
      ART.px(sx,px+1,y0,30,7,I.legno);                   // spalliera
      ART.px(sx,px+1,y0,30,2,I.legnoLuce);
      ART.px(sx,px+4,y0+8,24,10,I.lenzuolo);             // cuscino
      ART.px(sx,px+4,y0+8,24,2,PAL.passo(I.lenzuolo,1));
      ART.px(sx,px+4,y0+19,24,27,I.stoffa);              // coperta
      ART.px(sx,px+4,y0+19,24,2,I.stoffaLuce);
      ART.px(sx,px+4,y0+19,24,4,I.lenzuolo);             // il risvolto sopra la coperta
      ART.px(sx,px+4,y0+42,24,4,PAL.passo(I.stoffa,-1)); // ombra ai piedi
      break;
    }
    case 'cucina': {
      const img = ART.placeable('forno',{attivo:true});
      sx.drawImage(img, px-8, py+T-img.height+2);
      break;
    }
    case 'scrivania': {
      const I = PAL.c.interno;
      ART.px(sx,px+1,py+12,30,6,I.legnoLuce);           // piano
      ART.px(sx,px+1,py+18,30,4,I.legno);
      ART.px(sx,px+3,py+22,4,8,I.legnoOmbra);
      ART.px(sx,px+25,py+22,4,8,I.legnoOmbra);
      ART.px(sx,px+8,py+7,10,6,'#f6e6c8');              // lettere di Ilde
      ART.px(sx,px+8,py+7,10,1,'#fff8e8');
      ART.px(sx,px+10,py+9,6,1,'#b8a27c');
      ART.px(sx,px+20,py+8,4,5,'#7a5432');              // calamaio
      break;
    }
    case 'tavolo': {
      const I = PAL.c.interno;
      ART.px(sx,px+2,py+10,28,6,I.legnoLuce);
      ART.px(sx,px+2,py+16,28,3,I.legno);
      ART.px(sx,px+5,py+19,4,9,I.legnoOmbra);
      ART.px(sx,px+23,py+19,4,9,I.legnoOmbra);
      if(((gx+gy)&1)===0){ ART.ellip(sx,px+16,py+11,5,3,'#c9b48c'); ART.circ(sx,px+16,py+10,2,'#e8dcc0'); }
      break;
    }
    case 'lume': {
      const I = PAL.c.interno;
      ART.px(sx,px+13,py+2,6,3,I.lumeMetallo);          // braccio a muro
      ART.px(sx,px+15,py+5,2,4,I.lumeMetallo);
      const b = 0.7 + Math.sin(t*0.004 + gx)*0.18;
      sx.globalAlpha = 0.22*b;
      ART.circ(sx,px+16,py+12,13,I.lume);
      sx.globalAlpha = 1;
      ART.px(sx,px+12,py+8,8,8,I.lumeMetallo);
      ART.px(sx,px+13,py+9,6,6,I.lume);
      ART.px(sx,px+14,py+10,4,4,'#fff8d0');
      break;
    }

    case 'silo': {
      ART.px(sx,px+4,py-14,24,42,'#a8a29a');
      ART.px(sx,px+4,py-14,6,42,'#c0bab0');
      for(let k=0;k<5;k++) ART.px(sx,px+4,py-10+k*8,24,1,'#8a857c');
      sx.fillStyle='#8a5a34';
      sx.beginPath(); sx.moveTo(px+2,py-14); sx.lineTo(px+16,py-26); sx.lineTo(px+30,py-14); sx.fill();
      ART.px(sx,px+12,py+8,8,20,'#5a5550');
      break;
    }
    case 'macchina': {
      const img = ART.placeable(o.kind, {attivo:!!o.dentro, pronto:!!o.pronto});
      sx.drawImage(img, px-8, py+T-img.height+2);
      if(o.pronto && o.out){
        const bob = Math.sin(t*0.004)*2;
        sx.drawImage(ART.bolla(o.out), px-4, py-32+bob);
      }
      /* La targhetta di una cassa con un nome. Serve a non aprirne
         dieci per trovare i semi: il nome si legge da fuori, come su un
         cassetto vero. */
      if(o.kind==='cassa' && o.nome) targhetta(o.nome, px+16, py-3);
      break;
    }
    case 'mobile': {
      const opt = {attivo:true};
      if(o.kind==='recinto' || o.kind==='cancelletto') opt.lati = latiRecinto(G.mappa(), gx, gy);
      const img = ART.placeable(o.kind, opt);
      if(o.kind==='spaventapasseri'){
        const vento = FX.vento(gx*T, gy*T);
        sx.save();
        sx.translate(px+16, py+T);
        sx.transform(1,0,vento*0.05,1,0,0);
        sx.drawImage(img, -24, -img.height+2);
        sx.restore();
      } else {
        sx.drawImage(img, px-8, py+T-img.height+2);
      }
      break;
    }
  }
}

function disegnaColtura(s, px, py, gx, gy, t){
  const C = DATA.CROPS[s.crop.id];
  if(!C) return;
  const n = C.fasi.length;
  const vento = FX.vento(gx*T, gy*T);
  const sway = Math.sin(t*0.0018 + gx*0.9 + gy*0.5)*1.2 + vento*2.4;
  ART.drawCrop(sx, px+16, py+26, s.crop.id, s.crop.stage, n, sway);
  if(s.crop.stage>=n){
    const b=(t*0.004+gx*1.3+gy*0.7);
    sx.globalAlpha=0.35+Math.sin(b)*0.25;
    ART.px(sx, px+22+Math.sin(b*0.7)*3, py+8+Math.cos(b)*3, 2,2, '#fff8d0');
    sx.globalAlpha=1;
  }
}

/* ===================================================================
   DECORAZIONI
   =================================================================== */
function disegnaDecoPiatta(d, ox, oy, t, stag){
  const px=(d.x*T+ox)|0, py=(d.y*T+oy)|0;
  switch(d.t){
    case 'ninfea': {
      const bob=Math.sin(t*0.0013+d.v*2)*1.5;
      ART.ellip(sx, px+16, py+18+bob, 9, 6, '#4f8a3c');
      ART.ellip(sx, px+14, py+16+bob, 5, 3, '#6faa4c');
      sx.fillStyle='#2f5a2c'; sx.fillRect(px+15,py+16+bob,4,1);
      if(d.v===1){ ART.ellip(sx,px+18,py+13+bob,3,3,'#f0e0f0'); ART.circ(sx,px+18,py+13+bob,1.4,'#ffe270'); }
      break;
    }
    case 'ponte': {
      for(let i=0;i<d.w;i++){
        const bx=px+i*T;
        ART.px(sx,bx,py+2,T,3,'#8a6038');
        ART.px(sx,bx,py+T*2-6,T,3,'#8a6038');
      }
      break;
    }
    case 'ponte_grande': {
      for(let i=0;i<d.w;i++) for(let k=0;k<d.h;k++){
        ART.px(sx,px+i*T,py+k*T,T,2,'#7a5432');
      }
      for(let i=0;i<=d.w;i++){
        ART.px(sx,px+i*T-2,py-14,4,16,'#96704a');
        ART.px(sx,px+i*T-2,py+d.h*T-2,4,16,'#96704a');
      }
      ART.px(sx,px-2,py-12,d.w*T+4,4,'#8a6038');
      ART.px(sx,px-2,py+d.h*T+2,d.w*T+4,4,'#8a6038');
      break;
    }
    case 'molo': {
      for(let i=0;i<d.w;i++){
        ART.px(sx,px+i*T,py+4,T,2,'#7a5432');
        ART.px(sx,px+i*T,py+T*2-8,T,2,'#7a5432');
        if(i%2===0){ ART.px(sx,px+i*T+4,py+T*2-4,5,10,'#5f4028'); }
      }
      break;
    }
    /* La fontana era l'unico oggetto della valle disegnato dall'alto: un
       disco piatto in mezzo a botti, forni e panchine viste di tre quarti.
       Ora la vasca è un cilindro — parete esterna con spessore, bordo in
       luce, parete interna di fondo in ombra e acqua incassata. */
    case 'fontana': {
      const F = PAL.c.fontana;
      const cxp = px + T*2, cyp = py + T*1.35;
      const RX = T*2 - 3, RY = T*1.05;      // più schiacciata: sta in piedi, non sdraiata
      const MURO = 11;                       // spessore visibile della parete

      // ombra a terra, sotto il piede della vasca
      sx.globalAlpha = 0.24;
      ART.ellip(sx, cxp, cyp + MURO + 2, RX + 3, RY*0.42, '#000');
      sx.globalAlpha = 1;

      // parete esterna: ellissi impilate dal basso all'alto
      for(let i=MURO; i>=1; i--){
        const q = i/MURO;
        ART.ellip(sx, cxp, cyp+i, RX, RY, ART.mix(F.pietra, F.pietraScura, q));
      }
      // bordo superiore in luce
      ART.ellip(sx, cxp, cyp, RX, RY, F.pietraChiara);
      // conci del bordo
      for(let i=0;i<24;i++){
        const a = i/24*6.283;
        const bx = cxp + Math.cos(a)*(RX-2.5), by = cyp + Math.sin(a)*(RY-1.6);
        ART.px(sx, bx-2, by-2, 4, 3, i%2 ? F.pietra : F.giunto);
      }

      // conca: parete interna, con il fondo (in alto) in ombra
      ART.ellip(sx, cxp, cyp+1, RX-7, RY-3.5, F.internoOmbra);
      ART.ellip(sx, cxp, cyp+3, RX-8, RY-4.5, ART.shade(F.internoOmbra,-0.18));

      // acqua incassata e spostata in basso: della parete di fondo se ne
      // vede una fetta, ed è quella che dà la profondità
      ART.ellip(sx, cxp, cyp+4, RX-9, RY-5, F.acquaFondo);
      ART.ellip(sx, cxp, cyp+5, RX-11, RY-6, F.acquaAlta);
      // ombra portata dal bordo di fondo sull'acqua
      sx.globalAlpha = 0.30;
      ART.ellip(sx, cxp, cyp+1.5, RX-11, (RY-6)*0.5, '#12303f');
      sx.globalAlpha = 1;

      // increspature concentriche
      for(let i=0;i<3;i++){
        const ph=((t*0.0008+i/3)%1);
        sx.globalAlpha=(1-ph)*0.32;
        sx.strokeStyle=F.acquaLuce; sx.lineWidth=1;
        sx.beginPath(); sx.ellipse(cxp, cyp+5, (RX-13)*ph+4, (RY-8)*ph+2, 0, 0, 6.3); sx.stroke();
        sx.globalAlpha=1;
      }
      // luce sull'acqua, verso di noi
      sx.globalAlpha=0.22;
      ART.ellip(sx, cxp-RX*0.30, cyp+7, RX*0.26, RY*0.16, '#ffffff');
      sx.globalAlpha=1;

      // colonna centrale: base immersa, fusto, coppa
      ART.ellip(sx, cxp, cyp+2, 12, 5, ART.shade(F.pietraOmbra,-0.10));
      ART.ellip(sx, cxp, cyp+0.5, 11, 4.4, F.pietraOmbra);
      ART.px(sx, cxp-5, cyp-24, 10, 25, F.pietra);
      ART.px(sx, cxp-5, cyp-24, 3, 25, F.pietraChiara);
      ART.px(sx, cxp+3, cyp-24, 2, 25, F.pietraOmbra);
      ART.ellip(sx, cxp, cyp-25, 14, 5, F.pietraChiara);
      ART.ellip(sx, cxp, cyp-24, 14, 4.6, F.pietraOmbra);
      ART.ellip(sx, cxp, cyp-26, 11, 3.4, F.acquaAlta);
      ART.px(sx, cxp-2, cyp-36, 4, 11, F.pietra);
      ART.px(sx, cxp-2, cyp-36, 1, 11, F.pietraChiara);
      ART.ellip(sx, cxp, cyp-37, 6, 2.6, F.pietraChiara);

      // zampilli
      sx.globalAlpha=0.6; sx.fillStyle=F.schiuma;
      for(let i=0;i<14;i++){
        const ph = ((t*0.0022 + i*0.19) % 1);
        const side = (i%2)?1:-1;
        sx.fillRect((cxp + side*ph*15)|0, (cyp-39 + ph*ph*32)|0, 2, 3);
      }
      for(let i=0;i<5;i++){
        const ph=((t*0.004+i*0.2)%1);
        sx.fillRect(cxp-1, (cyp-42-ph*7)|0, 2, 4);
      }
      sx.globalAlpha=1;
      // spruzzi che ricadono nella vasca
      for(let i=0;i<5;i++){
        const ph=((t*0.003+i*0.23)%1);
        sx.globalAlpha=(1-ph)*0.5;
        ART.px(sx, (cxp-14+i*7)|0, (cyp+2-ph*4)|0, 2,2, F.zampillo);
        sx.globalAlpha=1;
      }
      break;
    }
    /* Resta per i salvataggi vecchi, dove le staccionate del gioco erano
       decorazioni: continuano a vedersi, anche se le nuove sono oggetti. */
    case 'recinto': {
      const img=ART.placeable('recinto',{});
      sx.drawImage(img, px-8, py+T-img.height+2);
      break;
    }
    case 'ciuffo': {
      const S=DATA.SEASONS.find(s=>s.id===stag);
      const col = stag==='inverno' ? '#a8bcc4' : S.grass;
      const vento = FX.vento(d.x*T, d.y*T);
      for(let i=0;i<5;i++){
        const bx=px+7+i*4+((ART.hsh(i,d.v,701)*3)|0);
        const h=4+((ART.hsh(i,d.v,702)*5)|0);
        const sw=Math.sin(t*0.0022+i+d.x)*0.8 + vento*2;
        sx.fillStyle = i%2 ? ART.shade(col,0.16) : ART.shade(col,-0.06);
        for(let k=0;k<h;k++) sx.fillRect((bx+sw*k/h)|0, py+24-k, 2, 1);
      }
      break;
    }
    case 'petali_terra': {
      const S=DATA.SEASONS.find(s=>s.id===stag);
      const cols = stag==='autunno' ? ['#d9713c','#c47a2c'] :
                   stag==='inverno' ? ['#e8eef2','#cfdde4'] : [S.accent,'#fff4d8'];
      for(let i=0;i<5;i++){
        const bx=px+5+((ART.hsh(i,d.v,703)*22)|0), by=py+8+((ART.hsh(i,d.v,704)*18)|0);
        sx.globalAlpha=0.8;
        ART.ellip(sx,bx,by,2.2,1.4,cols[i%cols.length]);
        sx.globalAlpha=1;
      }
      break;
    }
    case 'sassolini': {
      for(let i=0;i<4;i++){
        const bx=px+6+((ART.hsh(i,d.v,705)*20)|0), by=py+10+((ART.hsh(i,d.v,706)*16)|0);
        const s=2+((ART.hsh(i,d.v,707)*2)|0);
        ART.ellip(sx,bx,by,s,s*0.75,'#8a8580');
        ART.px(sx,bx-1,by-1,1,1,'#a8a29a');
      }
      break;
    }
    case 'bucato': {
      const w=d.w*T;
      const vento = FX.vento(d.x*T, d.y*T);
      ART.px(sx,px+2,py-26,3,30,'#8a6038');
      ART.px(sx,px+w-4,py-26,3,30,'#8a6038');
      sx.strokeStyle='#c9b48c'; sx.lineWidth=1;
      sx.beginPath(); sx.moveTo(px+3,py-24);
      sx.quadraticCurveTo(px+w/2,py-18,px+w-3,py-24); sx.stroke();
      const cols=['#e8e0d0','#7fb0d0','#e8a0b0','#d8c88a','#a8c890'];
      for(let i=0;i<d.w+1;i++){
        const bx=px+8+i*(w-16)/(d.w) - 6;
        const dip=Math.sin(i/(d.w))*5;
        const sw=Math.sin(t*0.0018+i*1.3)*2 + vento*7;
        const h=12+((ART.hsh(i,d.x,601)*8)|0);
        sx.save();
        sx.translate(bx+6, py-23+dip);
        sx.rotate(sw*0.02);
        ART.px(sx,-6,0,12,h,cols[i%cols.length]);
        ART.px(sx,-6,0,12,2,'#ffffff');
        ART.px(sx,-6,h-2,12,2,ART.shade(cols[i%cols.length],-0.18));
        sx.restore();
      }
      break;
    }
    /* la parete di fondo di un interno: senza, la stanza è un tappeto
       di assi che galleggia nel nero e non si legge come stanza */
    case 'parete': {
      const I = PAL.c.interno;
      const w = d.w*T, H = 26;
      const y0 = py - H;
      /* la fucina ha muri di pietra: il legno caldo, lì, sembrava una
         stalla e non un posto dove si batte il ferro */
      const pietra = d.stile==='pietra';
      const cor  = pietra ? ART.shade(I.parete,-0.42) : I.parete;
      const alto = pietra ? ART.shade(I.pareteAlta,-0.38) : I.pareteAlta;
      const scuro= pietra ? ART.shade(I.pareteOmbra,-0.30) : I.pareteOmbra;
      ART.px(sx, px, y0, w, H, cor);                            // intonaco
      ART.px(sx, px, y0, w, 3, alto);                           // cornice in luce
      ART.px(sx, px, y0+H-9, w, 6, I.zoccolo);                  // zoccolatura
      ART.px(sx, px, y0+H-9, w, 1, I.zoccoloLuce);
      ART.px(sx, px, y0+H-3, w, 3, I.battiscopa);               // battiscopa
      for(let k=0;k<d.w;k++){                                    // fughe verticali
        sx.globalAlpha = 0.25;
        ART.px(sx, px+k*T, y0+3, 1, H-12, scuro);
        sx.globalAlpha = 1;
      }
      // una finestrella ogni tanto, per non avere una parete cieca
      for(let k=2;k<d.w-2;k+=5){
        const wx = px + k*T + 6;
        ART.px(sx, wx-2, y0+4, 20, 14, I.battiscopa);
        ART.px(sx, wx,   y0+6, 16, 10, '#4a6478');
        ART.px(sx, wx,   y0+6, 16, 3,  '#6f8ea4');
        ART.px(sx, wx+7, y0+6, 2, 10, I.battiscopa);
      }
      break;
    }
    case 'zerbino': {
      const I = PAL.c.interno;
      ART.ellip(sx, px+16, py+22, 12, 6, I.legnoOmbra);
      ART.ellip(sx, px+16, py+21, 10, 5, I.legno);
      for(let k=0;k<4;k++) ART.px(sx, px+9+k*4, py+18, 2, 6, I.legnoLuce);
      break;
    }
    /* Il tappeto. Serve meno all'occhio che alla testa: un pavimento
       tutto uguale non dice dove ci si siede e dove si passa, e i mobili
       sopra sembrano capitati lì. Un rettangolo di lana sotto il tavolo
       e all'improvviso quel tavolo ha un posto. */
    case 'tappeto': {
      const I = PAL.c.interno;
      /* Il primo tappeto era una campitura piena del rosso della stoffa:
         in mezzo a una stanza in penombra veniva fuori una bandiera. Il
         rosso adesso è solo il filo del bordo; il campo è lana. */
      const freddo = d.stile==='freddo';
      const base  = freddo ? I.tappetoFreddo : I.tappeto;
      const trama = freddo ? I.tappetoFreddoTrama : I.tappetoTrama;
      const filo  = freddo ? I.metalloLuce : I.tappetoFilo;
      const w = d.w*T, h = d.h*T;
      ART.px(sx, px, py, w, h, I.tappetoOmbra);              // il bordo consumato
      ART.px(sx, px+2, py+2, w-4, h-4, base);
      ART.px(sx, px+2, py+2, w-4, 1, trama);                 // il lato in luce
      // ordito: righe fitte, il disegno che si vede da sopra
      for(let k=6; k<h-5; k+=4) ART.px(sx, px+4, py+k, w-8, 1, trama);
      // il filo colorato che corre lungo la cornice
      ART.px(sx, px+4, py+4, w-8, 1, filo);
      ART.px(sx, px+4, py+h-5, w-8, 1, filo);
      // frange sui due lati corti
      for(let k=2; k<w-3; k+=3){
        ART.px(sx, px+k, py-1, 1, 2, I.tappetoTrama);
        ART.px(sx, px+k, py+h-1, 1, 2, I.tappetoTrama);
      }
      break;
    }
    case 'lucciola': break;
  }
}

function disegnaDecoAlta(d, ox, oy, t, stag){
  const px=(d.x*T+ox)|0, py=(d.y*T+oy)|0;
  switch(d.t){
    case 'cartello': {
      const img=ART.placeable('cartello',{});
      sx.drawImage(img, px-8, py+T-img.height+2);
      break;
    }
    case 'erbe': {
      const vento = FX.vento(d.x*T, d.y*T);
      for(let i=0;i<3;i++){
        const bx=px+8+i*7, sw=Math.sin(t*0.002+i+d.x)*1 + vento*1.8;
        ART.px(sx,bx+sw,py+14,2,12,'#5f8a4a');
        ART.px(sx,bx-1+sw,py+10,4,5, ['#8a5fc0','#c9a05a','#8fc45a'][(d.v+i)%3]);
      }
      break;
    }
    case 'ortaggio': {
      const cols=[['#e8465c','#5f9c3c'],['#e8892c','#7a8a3a'],['#8fc47a','#5f9450'],['#f5d24f','#5f9c3c']];
      const c=cols[d.v%4];
      ART.px(sx,px+15,py+16,2,10,c[1]);
      ART.ellip(sx,px+16,py+16,5,4,c[0]);
      ART.px(sx,px+11,py+18,4,2,c[1]); ART.px(sx,px+18,py+17,4,2,c[1]);
      break;
    }
    case 'fungo_luce': {
      const gl=0.4+Math.sin(t*0.002+d.v*2)*0.25;
      sx.globalAlpha=gl*0.5;
      sx.fillStyle='#7fd8c8'; sx.beginPath(); sx.arc(px+16,py+20,16,0,6.3); sx.fill();
      sx.globalAlpha=1;
      ART.px(sx,px+14,py+18,4,8,'#d8e8e0');
      ART.ellip(sx,px+16,py+17,7,4,'#5fc0b0');
      ART.ellip(sx,px+16,py+16,5,3,'#8fe0d0');
      break;
    }
  }
}

/* ===================================================================
   PARTICELLE
   =================================================================== */
function disegnaParticella(p, ox, oy){
  const px=(p.x+ox)|0, py=(p.y+oy)|0;
  const a = p.vita/p.vitaMax;
  sx.globalAlpha = Math.max(0, Math.min(1, a*(p.alpha===undefined?1:p.alpha)));
  switch(p.t){
    case 'terra': case 'schegge': case 'pietrisco':
      ART.px(sx,px,py,p.s||2,p.s||2,p.c); break;
    case 'goccia':
      ART.px(sx,px,py,1,3,'#8fc0e0'); break;
    case 'stella': {
      ART.px(sx,px,py,2,2,p.c);
      ART.px(sx,px-2,py,1,1,p.c); ART.px(sx,px+2,py,1,1,p.c);
      ART.px(sx,px,py-2,1,1,p.c); ART.px(sx,px,py+2,1,1,p.c);
      break;
    }
    case 'foglia': {
      sx.save(); sx.translate(px,py); sx.rotate(p.r);
      ART.ellip(sx,0,0,3.4,2,p.c);
      ART.px(sx,-3,0,7,1,ART.shade(p.c,-0.2));
      sx.restore(); break;
    }
    case 'petalo': {
      sx.save(); sx.translate(px,py); sx.rotate(p.r);
      ART.ellip(sx,0,0,2.6,1.6,p.c);
      sx.restore(); break;
    }
    case 'fiocco':
      ART.px(sx,px,py,p.s||2,p.s||2,'#ffffff'); break;
    case 'lucciola': {
      sx.globalAlpha = (0.35+Math.sin(p.f)*0.45)*a;
      sx.fillStyle='#e8f89a';
      sx.beginPath(); sx.arc(px,py,3.2,0,6.3); sx.fill();
      sx.globalAlpha = 0.9*a;
      ART.px(sx,px-1,py-1,2,2,'#f8ffd0');
      break;
    }
    case 'testo': {
      sx.font='bold 9px Nunito, sans-serif';
      sx.textAlign='center';
      sx.fillStyle='rgba(0,0,0,0.55)';
      sx.fillText(p.testo, px+1, py+1);
      sx.fillStyle=p.c;
      sx.fillText(p.testo, px, py);
      sx.textAlign='left';
      break;
    }
    case 'cuoricino': {
      sx.fillStyle=p.c||'#e04a63';
      sx.beginPath();
      sx.moveTo(px,py+3); sx.bezierCurveTo(px-5,py-1,px-4,py-6,px,py-3);
      sx.bezierCurveTo(px+4,py-6,px+5,py-1,px,py+3);
      sx.fill();
      break;
    }
    case 'fumo': {
      sx.fillStyle=p.c||'#cfc8bc';
      sx.beginPath(); sx.arc(px,py,p.s*(1.2-a*0.4),0,6.3); sx.fill();
      break;
    }
    case 'splash': {
      sx.strokeStyle='#bfe0f0'; sx.lineWidth=1;
      sx.beginPath(); sx.arc(px,py,(1-a)*10+2,0,6.3); sx.stroke();
      break;
    }
  }
  sx.globalAlpha=1;
}

/* ===================================================================
   METEO
   =================================================================== */
let gocce=[], fiocchi=[];
function initMeteo(){
  gocce=[]; fiocchi=[];
  for(let i=0;i<170;i++) gocce.push({x:Math.random()*VW, y:Math.random()*VH, v:5+Math.random()*4, l:6+Math.random()*8});
  for(let i=0;i<120;i++) fiocchi.push({x:Math.random()*VW, y:Math.random()*VH, v:0.4+Math.random()*0.7, s:1+((Math.random()*2)|0), f:Math.random()*6.28});
}
R.initMeteo = initMeteo;

/* Gocce e fiocchi avanzano col TEMPO, non col fotogramma. Prima era
   `g.y += g.v` a ogni chiamata: su un monitor a 144Hz la pioggia cadeva
   2,4 volte più veloce che a 60Hz, perché requestAnimationFrame segue il
   refresh. Scoperto con la prova di determinismo — due disegni a tempo
   congelato davano 24.796 pixel diversi sotto la pioggia, e zero col
   sereno. Il fattore `k` vale 1 a 60fps; la pinza a 100ms evita che al
   ritorno da una scheda in secondo piano le gocce attraversino mezzo
   schermo in un colpo. */
let meteoT = 0;
function disegnaMeteo(G, t){
  if(!gocce.length) initMeteo();
  const k = Math.min(100, Math.max(0, t - meteoT)) / 16.667;
  meteoT = t;
  const M = G.meteo;
  const vento = FX.vento();
  if(M==='pioggia'||M==='temporale'){
    const forte = M==='temporale';
    sx.strokeStyle = forte? 'rgba(180,210,235,0.55)':'rgba(180,210,235,0.42)';
    sx.lineWidth=1;
    sx.beginPath();
    for(const g of gocce){
      g.y += g.v*(forte?1.5:1)*k; g.x += ((forte?1.6:0.9) + vento*1.4)*k;
      if(g.y>VH){ g.y=-10; g.x=Math.random()*VW; }
      if(g.x>VW) g.x=0; if(g.x<0) g.x=VW;
      sx.moveTo(g.x,g.y); sx.lineTo(g.x-(forte?4:2), g.y-g.l);
    }
    sx.stroke();
    sx.globalAlpha=0.28;
    for(let i=0;i<12;i++){
      const px=(ART.hsh(i,(t/220|0),501)*VW)|0, py=(ART.hsh(i,(t/220|0),502)*VH)|0;
      sx.strokeStyle='#cfe8f2';
      sx.beginPath(); sx.ellipse(px,py,4,1.6,0,0,6.3); sx.stroke();
    }
    sx.globalAlpha=1;
    if(forte && Math.sin(t*0.0007)>0.9993){
      sx.fillStyle='rgba(255,255,255,0.5)'; sx.fillRect(0,0,VW,VH);
    }
  }
  else if(M==='neve'){
    for(const f of fiocchi){
      f.y += f.v*k; f.x += (Math.sin(f.f + t*0.0012)*0.5 + vento*0.9)*k;
      if(f.y>VH){ f.y=-6; f.x=Math.random()*VW; }
      if(f.x>VW) f.x=0; if(f.x<0) f.x=VW;
      sx.globalAlpha=0.85;
      ART.px(sx, f.x|0, f.y|0, f.s, f.s, '#ffffff');
    }
    sx.globalAlpha=1;
  }
  else if(M==='vento'){
    sx.globalAlpha=0.18;
    sx.strokeStyle='#e8f0f4'; sx.lineWidth=1;
    for(let i=0;i<9;i++){
      const yy=(i*VH/9 + Math.sin(t*0.001+i)*10)|0;
      const xx=((t*0.22 + i*180)%(VW+200))-100;
      sx.beginPath(); sx.moveTo(xx,yy); sx.quadraticCurveTo(xx+30,yy-6,xx+60,yy); sx.stroke();
    }
    sx.globalAlpha=1;
  }
}

})();
