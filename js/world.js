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

const TIPI = ['erba','terra','sentiero','sabbia','acqua','assi','lastre','grotta','roccia','vuoto','neve'];
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
function edificio(m, kind, x, y, tw, th, opt){
  opt = opt||{};
  const e = { kind, x, y, w:tw, h:th, porta:opt.porta, azione:opt.azione,
              nome:opt.nome, scala:opt.scala||1, offY:opt.offY||0, liv:opt.liv||0 };
  m.edifici.push(e);
  // solidi tranne la casella-porta
  for(let yy=y; yy<y+th; yy++) for(let xx=x; xx<x+tw; xx++){
    if(opt.porta && xx===opt.porta.x && yy===opt.porta.y) continue;
    if(W.dentro(m,xx,yy)) m.obj[W.idx(m,xx,yy)] = {t:'muro', solido:true, ed:e};
  }
  if(opt.porta) setObj(m, opt.porta.x, opt.porta.y, {t:'porta', ed:e, azione:opt.azione, solido:false});
  return e;
}
W.edificio = edificio;

function warp(m, x,y,w,h, to, tx,ty, etichetta){
  m.warps.push({x,y,w,h,to,tx,ty,etichetta});
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

  /* --- bordo di alberi fitti --- */
  for(let x=0;x<m.w;x++){
    for(let y=0;y<2;y++) setObj(m,x,y, albero(R()>0.6?'pino':'quercia'));
    setObj(m,x,m.h-1, albero('pino'));
  }
  for(let y=0;y<m.h;y++){
    for(let x=0;x<2;x++) setObj(m,x,y, albero(R()>0.5?'pino':'quercia'));
    setObj(m,m.w-1,y, albero('pino'));
  }

  /* --- laghetto in basso a destra --- */
  blob(m, 41, 33, 8, 'acqua', R, 0.4);
  // riva sabbiosa
  for(let y=22;y<m.h;y++) for(let x=30;x<m.w;x++){
    if(W.terreno(m,x,y)!=='erba') continue;
    let vicino=false;
    for(let d=0;d<4;d++){
      const nx=x+[1,-1,0,0][d], ny=y+[0,0,1,-1][d];
      if(W.terreno(m,nx,ny)==='acqua') vicino=true;
    }
    if(vicino) m.g[W.idx(m,x,y)] = ti('sabbia');
  }
  // ninfee
  for(let i=0;i<7;i++){
    const x=36+((R()*10)|0), y=29+((R()*8)|0);
    if(W.terreno(m,x,y)==='acqua') m.deco.push({t:'ninfea',x,y,v:(R()*3)|0});
  }

  /* --- ruscello dal bordo nord --- */
  linea(m, 24,0, 26,10, 2, 'acqua');
  linea(m, 26,10, 32,20, 2, 'acqua');
  linea(m, 32,20, 36,27, 2, 'acqua');
  // ponticello
  fill(m, 30,17, 3,2, 'assi');
  m.deco.push({t:'ponte', x:30, y:17, w:3});

  /* --- casa e aia --- */
  fill(m, 3,3, 12,8, 'terra');
  linea(m, 8,10, 8,20, 3, 'sentiero');
  linea(m, 8,12, 22,12, 3, 'sentiero');
  edificio(m,'casa', 4,3, 7,5, { porta:{x:7,y:7}, azione:'casa', nome:'Casa', scala:1 });
  // cassa di consegna
  setObj(m, 13,8, {t:'consegna', solido:true});
  m.deco.push({t:'cartello', x:12, y:9, testo:'Cassa di consegna'});

  /* --- campo principale: terra già dissodabile --- */
  fill(m, 5,14, 18,14, 'erba');

  /* --- spazi riservati alle costruzioni --- */
  m.spazi = {
    pollaio:{x:16,y:4,w:5,h:4, kind:'pollaio', porta:{x:18,y:7}},
    serra:  {x:26,y:5,w:6,h:5, kind:'serra',   porta:{x:29,y:9}},
    silo:   {x:23,y:4,w:2,h:2, kind:'silo'}
  };

  /* --- vegetazione sparsa --- */
  for(let i=0;i<70;i++){
    const x=3+((R()*(m.w-6))|0), y=3+((R()*(m.h-6))|0);
    if(!libero(m,x,y)) continue;
    if(x>4 && x<24 && y>13 && y<28 && R()<0.55) continue; // campo più pulito
    const r=R();
    if(r<0.34) setObj(m,x,y, albero(R()>0.7?'pino':(R()>0.5?'betulla':'quercia')));
    else if(r<0.52) setObj(m,x,y, sasso('pietra'));
    else if(r<0.86) setObj(m,x,y, {t:'erbaccia', v:(R()*4)|0});
    else setObj(m,x,y, {t:'ramo', v:(R()*3)|0});
  }
  // qualche ceppo da abbattere
  for(let i=0;i<5;i++){
    const x=6+((R()*16)|0), y=14+((R()*12)|0);
    if(libero(m,x,y)) setObj(m,x,y,{t:'ceppo', hp:4, solido:true});
  }

  /* --- staccionata decorativa a est della casa --- */
  for(let x=3;x<15;x++) if(libero(m,x,11)) m.deco.push({t:'recinto',x,y:11});

  /* --- uscite --- */
  fill(m, m.w-2, 18, 2, 4, 'sentiero');
  for(let y=18;y<22;y++) for(let x=m.w-2;x<m.w;x++) m.obj[W.idx(m,x,y)]=null;
  warp(m, m.w-1, 18, 1, 4, 'fioralba', 2, 16, 'Fioralba');
  m.deco.push({t:'cartello', x:m.w-4, y:19, testo:'→ Fioralba'});

  fill(m, 18, m.h-2, 4, 2, 'sentiero');
  for(let y=m.h-2;y<m.h;y++) for(let x=18;x<22;x++) m.obj[W.idx(m,x,y)]=null;
  warp(m, 18, m.h-1, 4, 1, 'bosco', 20, 2, 'Bosco');
  m.deco.push({t:'cartello', x:17, y:m.h-3, testo:'↓ Bosco'});

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

  /* --- RADURA DEGLI SPIRITI (oltre il ponte) --- */
  // burrone che la separa
  fill(m, 30,24, 16,3, 'roccia');
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
  // sentiero di lastre dal ponte al santuario
  linea(m, 34,26, 38,30, 2, 'sentiero');
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
  for(let y=0;y<m.h;y++) for(let x=0;x<m.w;x++){
    if(W.terreno(m,x,y)==='sentiero') m.obj[W.idx(m,x,y)]=null;
  }

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

  /* uscita */
  fill(m, 16,27, 4,3, 'grotta');
  for(let y=27;y<30;y++) for(let x=16;x<20;x++) m.obj[W.idx(m,x,y)]=null;
  warp(m, 16, m.h-1, 4, 1, 'fioralba', 22, 2, 'Fioralba');
  m.deco.push({t:'cartello', x:15, y:26, testo:'↓ Uscita'});

  return m;
}

/* ===================================================================
   API
   =================================================================== */
W.crea = function(){
  const maps = {};
  maps.podere   = buildPodere();
  maps.fioralba = buildFioralba();
  maps.bosco    = buildBosco();
  maps.grotta   = buildGrotta();
  return maps;
};

/* ---- costruzione di un edificio sbloccato ---- */
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
