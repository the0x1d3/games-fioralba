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

R.init = function(canvas){
  cvs = canvas;
  ctx = cvs.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  scene = ART.cv(VW,VH); sx = scene.getContext('2d');
  light = ART.cv(VW,VH); lx = light.getContext('2d');
  R.resize();
};

R.resize = function(){
  // un canvas 0×0 farebbe fallire drawImage: ripieghiamo su una misura sensata
  const dw = Math.max(320, window.innerWidth  || 0);
  const dh = Math.max(240, window.innerHeight || 0);
  cvs.width = dw; cvs.height = dh;
  let s = Math.max(2, Math.min(4, Math.round(dw/(19*T))));
  if(dw < 760) s = Math.max(2, Math.min(3, Math.round(dw/(13*T))));
  SCALE = s;
  VW = Math.max(1, Math.ceil(dw/SCALE)); VH = Math.max(1, Math.ceil(dh/SCALE));
  scene.width=VW; scene.height=VH;
  light.width=VW; light.height=VH;
  sx = scene.getContext('2d'); sx.imageSmoothingEnabled=false;
  lx = light.getContext('2d'); lx.imageSmoothingEnabled=false;
  ctx = cvs.getContext('2d'); ctx.imageSmoothingEnabled=false;
};
R.info = ()=>({VW,VH,SCALE});

R.schermoAMondo = function(px, py, cam){
  return { x:(px/SCALE + cam.x), y:(py/SCALE + cam.y) };
};

/* ===================================================================
   TERRENO PRE-COTTO A BLOCCHI (con raccordi)
   I raccordi costano, ma il terreno cambia di rado: lo disegniamo una
   volta per blocco di 8×8 caselle e poi lo ricopiamo.
   =================================================================== */
const CH = 8;
let chunkCache = {};

R.invalidaTerreno = function(mapId){
  if(!mapId){ chunkCache = {}; return; }
  for(const k in chunkCache) if(k.indexOf(mapId+'|')===0) delete chunkCache[k];
};
R.invalidaCasella = function(mapId, x, y){
  // il raccordo tocca anche i blocchi vicini
  for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){
    const cx = ((x+dx)/CH)|0, cy = ((y+dy)/CH)|0;
    for(const s of DATA.SEASONS) delete chunkCache[mapId+'|'+cx+'|'+cy+'|'+s.id];
  }
};

function texTerreno(tipo){ return tipo==='roccia' ? 'grotta' : tipo; }

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
    if(tipo!=='acqua'){
      x.drawImage(ART.ground(texTerreno(tipo), v, season), dx, dy);
    }

    /* --- pareti di roccia: faccia scura e cornicione --- */
    if(tipo==='roccia'){
      x.fillStyle='rgba(8,7,6,0.62)'; x.fillRect(dx,dy,T,T);
      if(WORLD.terreno(m,gx,gy+1)!=='roccia'){
        x.fillStyle='#241f1a'; x.fillRect(dx,dy+T-11,T,11);
        x.fillStyle='#4a4038'; x.fillRect(dx,dy+T-13,T,3);
        x.fillStyle='#635648'; x.fillRect(dx,dy+T-13,T,1);
        for(let k=0;k<T;k+=7){
          x.fillStyle='#191510';
          x.fillRect(dx+k+((ART.hsh(k,gy,431)*3)|0), dy+T-9, 1, 7);
        }
      }
      if(WORLD.terreno(m,gx-1,gy)!=='roccia'){ x.fillStyle='rgba(90,78,66,0.35)'; x.fillRect(dx,dy,2,T); }
      if(WORLD.terreno(m,gx+1,gy)!=='roccia'){ x.fillStyle='rgba(90,78,66,0.35)'; x.fillRect(dx+T-2,dy,2,T); }
      continue;   // la roccia non partecipa ai raccordi
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
  let c = chunkCache[k];
  if(!c){
    c = costruisciChunk(m, cx, cy, season);
    chunkCache[k]=c;
    // non facciamo crescere la cache all'infinito
    const chiavi = Object.keys(chunkCache);
    if(chiavi.length > 260) delete chunkCache[chiavi[0]];
  }
  return c;
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
  const cam = G.cam;
  const stag = G.stagione().id;
  const t = G.tempoMs;
  const sole = FX.soleOmbra(G.ora, m.esterno);

  sx.clearRect(0,0,VW,VH);
  sx.fillStyle = m.sfondo; sx.fillRect(0,0,VW,VH);

  const x0 = Math.max(0, Math.floor(cam.x/T)-1);
  const y0 = Math.max(0, Math.floor(cam.y/T)-1);
  const x1 = Math.min(m.w-1, Math.ceil((cam.x+VW)/T)+1);
  const y1 = Math.min(m.h-1, Math.ceil((cam.y+VH)/T)+2);
  const ox = -cam.x, oy = -cam.y;
  const wf = (t/140|0)%6;

  /* ---------- 1. ACQUA ANIMATA (sotto al terreno pre-cotto) ---------- */
  for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){
    if(WORLD.terreno(m,x,y)!=='acqua') continue;
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

  /* ---------- 6. OMBRE DELLE NUVOLE ---------- */
  if(m.esterno && (G.meteo==='sereno'||G.meteo==='nuvoloso')){
    sx.globalAlpha = G.meteo==='nuvoloso'?0.16:0.08;
    sx.fillStyle='#1a2838';
    for(let i=0;i<4;i++){
      const cxp = ((t*0.012 + i*430) % (VW+400)) - 200;
      const cyp = ((i*167)%VH);
      sx.beginPath(); sx.ellipse(cxp, cyp, 120, 46, 0, 0, 6.3); sx.fill();
    }
    sx.globalAlpha=1;
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

  for(const n of G.npcVivi()){
    const px = n.px+ox, py = n.py+oy;
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

  for(const a of G.animali){
    if(a.mappa!==m.id) continue;
    const px=a.px+ox, py=a.py+oy;
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
      const px=b.x+ox, py=b.y+oy;
      if(px<-80||px>VW+80||py<-90||py>VH+80) continue;
      lista.push({ y:b.y, d:()=>MOBS.disegnaUno(sx, b, ox, oy) });
    }
  }

  /* giocatore */
  {
    const px=G.p.px+ox, py=G.p.py+oy;
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
      const px=L.x+ox, py=L.y+oy;
      if(px<-160||px>VW+160||py<-160||py>VH+160) continue;
      const r = L.r * (1 + Math.sin(t*0.004 + (L.f||0))*0.035);
      const g = lx.createRadialGradient(px,py,0,px,py,r);
      g.addColorStop(0,`rgba(0,0,0,${L.i})`);
      g.addColorStop(0.55,`rgba(0,0,0,${L.i*0.5})`);
      g.addColorStop(1,'rgba(0,0,0,0)');
      lx.fillStyle=g;
      lx.beginPath(); lx.arc(px,py,r,0,6.3); lx.fill();
    }
    lx.globalCompositeOperation='source-over';
    sx.drawImage(light,0,0);
  }

  /* ---------- 13. BLOOM ---------- */
  if(amb.a > 0.04){
    const bx = FX.iniziaBloom(VW, VH);
    for(const L of luci){
      if(!L.caldo) continue;
      const px=L.x+ox, py=L.y+oy;
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
      const px=p.x+ox, py=p.y+oy;
      const g = bx.createRadialGradient(px,py,0,px,py,7);
      g.addColorStop(0,'rgba(230,250,150,0.42)');
      g.addColorStop(1,'rgba(200,240,120,0)');
      bx.fillStyle=g; bx.beginPath(); bx.arc(px,py,7,0,6.3); bx.fill();
    }
    FX.applicaBloom(sx, VW, VH, 0.42);
  }

  /* ---------- 14. GRADAZIONE E RAGGI ---------- */
  FX.gradazione(sx, VW, VH, G.ora, G.meteo, m.esterno);
  if(m.esterno) FX.raggi(sx, VW, VH, G.ora, G.meteo);

  /* ---------- BLIT ---------- */
  ctx.clearRect(0,0,cvs.width,cvs.height);
  ctx.drawImage(scene, 0,0, VW*SCALE, VH*SCALE);

  const vg = ctx.createRadialGradient(cvs.width/2,cvs.height/2, Math.min(cvs.width,cvs.height)*0.36,
                                      cvs.width/2,cvs.height/2, Math.max(cvs.width,cvs.height)*0.74);
  vg.addColorStop(0,'rgba(0,0,0,0)');
  vg.addColorStop(1,'rgba(0,0,0,0.32)');
  ctx.fillStyle=vg; ctx.fillRect(0,0,cvs.width,cvs.height);
};

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
      const img = ART.tree(o.kind, stag, o.stage);
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
      const img = ART.placeable(o.kind, {attivo:!!o.dentro, pronto:!!o.pronto});
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

function disegnaOggetto(o, px, py, gx, gy, t, stag, G){
  switch(o.t){
    case 'albero': {
      const img = ART.tree(o.kind, stag, o.stage);
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
    case 'ceppo': sx.drawImage(ART.stump(), px-4, py+2); break;
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
      break;
    }
    case 'mobile': {
      const img = ART.placeable(o.kind, {attivo:true});
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
    case 'fontana': {
      const cxp = px + T*2, cyp = py + T*1.5;
      const RX = T*2 - 2, RY = T*1.4;
      sx.globalAlpha=0.20; ART.ellip(sx, cxp, cyp+RY-4, RX+4, 9, '#000'); sx.globalAlpha=1;
      ART.ellip(sx, cxp, cyp+4, RX+5, RY+4, '#8e8578');
      ART.ellip(sx, cxp, cyp,   RX+5, RY+4, '#b8ae9c');
      ART.ellip(sx, cxp, cyp-2, RX+5, RY+4, '#cabfa9');
      for(let i=0;i<20;i++){
        const a=i/20*6.283;
        const bx=cxp+Math.cos(a)*(RX+2), by=cyp-2+Math.sin(a)*(RY+1.6);
        ART.px(sx, bx-2, by-2, 5, 4, i%2?'#c2b7a1':'#b3a893');
      }
      ART.ellip(sx, cxp, cyp-1, RX-2, RY-2, '#2f7fa8');
      ART.ellip(sx, cxp, cyp-2, RX-4, RY-4, '#3f95c0');
      for(let i=0;i<3;i++){
        const ph=((t*0.0008+i/3)%1);
        sx.globalAlpha=(1-ph)*0.35;
        sx.strokeStyle='#a8dcf0'; sx.lineWidth=1;
        sx.beginPath(); sx.ellipse(cxp, cyp-2, (RX-6)*ph+4, (RY-6)*ph+3, 0, 0, 6.3); sx.stroke();
        sx.globalAlpha=1;
      }
      sx.globalAlpha=0.30;
      ART.ellip(sx, cxp-RX*0.35, cyp-RY*0.4, RX*0.34, RY*0.24, '#ffffff');
      sx.globalAlpha=1;
      ART.ellip(sx, cxp, cyp-4, 13, 6, '#a89e8c');
      ART.px(sx, cxp-5, cyp-26, 10, 24, '#c2b7a1');
      ART.px(sx, cxp-5, cyp-26, 3, 24, '#d8cdb6');
      ART.px(sx, cxp+3, cyp-26, 2, 24, '#948a78');
      ART.ellip(sx, cxp, cyp-27, 14, 5, '#cabfa9');
      ART.ellip(sx, cxp, cyp-28, 11, 3.4, '#3f95c0');
      ART.px(sx, cxp-2, cyp-38, 4, 11, '#c2b7a1');
      ART.ellip(sx, cxp, cyp-39, 6, 2.6, '#cabfa9');
      sx.globalAlpha=0.6; sx.fillStyle='#dff2fa';
      for(let i=0;i<14;i++){
        const ph = ((t*0.0022 + i*0.19) % 1);
        const side = (i%2)?1:-1;
        sx.fillRect((cxp + side*ph*15)|0, (cyp-41 + ph*ph*30)|0, 2, 3);
      }
      for(let i=0;i<5;i++){
        const ph=((t*0.004+i*0.2)%1);
        sx.fillRect(cxp-1, (cyp-44-ph*7)|0, 2, 4);
      }
      sx.globalAlpha=1;
      for(let i=0;i<5;i++){
        const ph=((t*0.003+i*0.23)%1);
        sx.globalAlpha=(1-ph)*0.5;
        ART.px(sx, (cxp-14+i*7)|0, (cyp-6-ph*4)|0, 2,2, '#cfeaf8');
        sx.globalAlpha=1;
      }
      break;
    }
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

function disegnaMeteo(G, t){
  if(!gocce.length) initMeteo();
  const M = G.meteo;
  const vento = FX.vento();
  if(M==='pioggia'||M==='temporale'){
    const forte = M==='temporale';
    sx.strokeStyle = forte? 'rgba(180,210,235,0.55)':'rgba(180,210,235,0.42)';
    sx.lineWidth=1;
    sx.beginPath();
    for(const g of gocce){
      g.y += g.v*(forte?1.5:1); g.x += (forte?1.6:0.9) + vento*1.4;
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
      f.y += f.v; f.x += Math.sin(f.f + t*0.0012)*0.5 + vento*0.9;
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
