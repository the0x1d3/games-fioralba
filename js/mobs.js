/* ===================================================================
   FIORALBA — mobs.js
   Fauna della valle: sprite, comportamenti, comparsa e scomparsa.
   Nessun nemico: è un gioco tranquillo. Ma il corvo ti ruba la roba.
   =================================================================== */
(function(){
'use strict';

const M = {};
window.MOBS = M;

const T = 32;
const px = (c,x,y,w,h,col)=>{ c.fillStyle=col; c.fillRect(x|0,y|0,w|0,h|0); };

/* ===================================================================
   SPRITE
   =================================================================== */
const cache = {};
function spr(key, w, h, dis){
  if(cache[key]) return cache[key];
  const c = ART.cv(w,h);
  const x = c.getContext('2d');
  x.imageSmoothingEnabled=false;
  dis(x);
  cache[key]=c;
  return c;
}

const SPRITE = {

  /* ---------- CONIGLIO ---------- */
  coniglio(x, f){
    const pelo='#b8a894', peloS='#94856f', peloL='#d8cbb8', pancia='#efe8dc';
    const salto = f===1||f===2;
    const y0 = salto ? -3 : 0;
    // zampe
    if(salto){ px(x,7,20+y0,5,3,peloS); px(x,17,20+y0,5,3,peloS); }
    else { px(x,8,21,4,3,peloS); px(x,16,21,5,3,peloS); }
    // corpo
    ART.ellip(x,15,17+y0,8,6,pelo);
    ART.ellip(x,15,15+y0,7,5,peloL);
    ART.ellip(x,17,19+y0,5,3,pancia);
    // coda
    ART.circ(x,7,16+y0,3,'#efe8dc');
    // testa
    ART.ellip(x,21,13+y0,5,4.5,pelo);
    ART.ellip(x,21,12+y0,4,3.5,peloL);
    // orecchie (si abbassano nel salto)
    if(salto){
      px(x,19,7+y0,3,6,pelo); px(x,23,7+y0,3,6,pelo);
      px(x,20,8+y0,1,4,'#e0b8bc'); px(x,24,8+y0,1,4,'#e0b8bc');
    } else {
      px(x,19,4,3,9,pelo); px(x,23,5,3,8,pelo);
      px(x,20,6,1,6,'#e0b8bc'); px(x,24,7,1,5,'#e0b8bc');
    }
    // muso
    px(x,25,13+y0,2,2,'#2f2418');
    px(x,24,15+y0,3,1,'#c98a90');
    px(x,26,16+y0,2,1,'#efe8dc');
  },

  /* ---------- CERVO ---------- */
  cervo(x, f){
    const pelo='#a8763c', peloS='#7a5228', peloL='#c99a5e', pancia='#e0c8a8';
    const p = f===1?1:(f===3?-1:0);
    // zampe
    px(x,10,26+p,3,10,peloS); px(x,15,26-p,3,10,peloS);
    px(x,27,26-p,3,10,peloS); px(x,32,26+p,3,10,peloS);
    px(x,10,35+p,4,2,'#3a2a1c'); px(x,15,35-p,4,2,'#3a2a1c');
    px(x,27,35-p,4,2,'#3a2a1c'); px(x,32,35+p,4,2,'#3a2a1c');
    // corpo
    ART.ellip(x,23,22,14,8,pelo);
    ART.ellip(x,23,20,13,6,peloL);
    ART.ellip(x,24,26,10,3,pancia);
    // macchie
    for(let i=0;i<5;i++) px(x,16+i*4,17+((i%2)*3),2,2,'#e0c090');
    // coda
    px(x,36,18,4,5,peloL); px(x,37,19,2,3,'#fff');
    // collo e testa
    px(x,11,12,7,12,pelo);
    px(x,11,12,3,12,peloL);
    ART.ellip(x,10,10,5,4,pelo);
    ART.ellip(x,10,9,4,3,peloL);
    px(x,5,10,4,3,peloS);           // muso
    px(x,4,10,2,2,'#2f2418');
    px(x,11,8,2,2,'#2f2418');       // occhio
    px(x,13,5,3,4,peloS);           // orecchio
    // corna
    px(x,9,2,2,6,'#8a6038'); px(x,6,1,2,4,'#8a6038'); px(x,12,0,2,5,'#8a6038');
    px(x,4,0,2,3,'#8a6038'); px(x,14,2,3,2,'#8a6038');
  },

  /* ---------- SCOIATTOLO ---------- */
  scoiattolo(x, f){
    const pelo='#b06a34', peloL='#d08c50', pancia='#f0dcc0';
    const b = f%2;
    // coda a pennacchio
    ART.ellip(x,6,12-b,5,9,'#c47a3c');
    ART.ellip(x,6,10-b,4,7,peloL);
    ART.ellip(x,7,7-b,3,4,'#e0a868');
    // corpo
    ART.ellip(x,15,17-b,6,6,pelo);
    ART.ellip(x,16,18-b,4,4,pancia);
    px(x,12,21-b,3,3,'#8a5228'); px(x,17,21-b,3,3,'#8a5228');
    // testa
    ART.circ(x,20,12-b,4.5,pelo);
    ART.circ(x,20,11-b,3.5,peloL);
    px(x,23,12-b,2,2,'#2f2418');
    px(x,21,10-b,2,2,'#2f2418');
    px(x,17,7-b,3,3,pelo); px(x,21,6-b,3,3,pelo);   // orecchie
    px(x,18,8-b,1,1,'#e0a8a8');
    // ghianda tra le zampe
    px(x,22,16-b,4,3,'#c9a05a'); px(x,22,15-b,4,2,'#8a6038');
  },

  /* ---------- RICCIO ---------- */
  riccio(x, f){
    const b=f%2;
    px(x,8,20-b,4,3,'#6b4a2e'); px(x,16,20-b,4,3,'#6b4a2e');
    ART.ellip(x,15,15-b,10,7,'#6b5440');
    // aculei
    for(let i=0;i<16;i++){
      const a=Math.PI+ i/16*Math.PI;
      const bx=15+Math.cos(a)*10, by=15-b+Math.sin(a)*7;
      x.fillStyle = i%2?'#4a3828':'#7a6450';
      x.beginPath(); x.moveTo(bx,by);
      x.lineTo(bx+Math.cos(a)*5, by+Math.sin(a)*5);
      x.lineTo(bx+2,by+2); x.fill();
    }
    ART.ellip(x,15,14-b,8,5,'#5f4a38');
    // muso
    ART.ellip(x,24,17-b,4,3.5,'#c9a888');
    px(x,27,17-b,2,2,'#2f2418');
    px(x,23,15-b,2,2,'#2f2418');
  },

  /* ---------- RANA ---------- */
  rana(x, f){
    const v='#5f9c3c', vL='#7fbe4e', vS='#3f7a2c';
    const salto = f===1;
    if(salto){
      px(x,4,14,7,4,vS); px(x,19,14,7,4,vS);
      ART.ellip(x,15,13,8,5,v);
      ART.ellip(x,15,11,7,4,vL);
    } else {
      px(x,5,18,6,4,vS); px(x,19,18,6,4,vS);
      px(x,7,21,5,2,vS); px(x,18,21,5,2,vS);
      ART.ellip(x,15,17,8,6,v);
      ART.ellip(x,15,15,7,4.5,vL);
    }
    const oy = salto?9:13;
    ART.ellip(x,15,oy,7,4,v);
    // occhi sporgenti
    ART.circ(x,11,oy-3,3,vL); ART.circ(x,19,oy-3,3,vL);
    px(x,10,oy-4,2,2,'#2f2418'); px(x,19,oy-4,2,2,'#2f2418');
    px(x,10,oy-5,1,1,'#fff'); px(x,19,oy-5,1,1,'#fff');
    // bocca
    px(x,12,oy+2,7,1,vS);
    // macchie
    px(x,12,oy+5,2,2,vS); px(x,17,oy+6,2,2,vS);
  },

  /* ---------- FARFALLA ---------- */
  farfalla(x, f, col){
    const ap = f%2===0;      // ali aperte / chiuse
    const c1 = col||'#f0a8d0', c2 = ART.shade(col||'#f0a8d0',-0.28), c3=ART.shade(col||'#f0a8d0',0.3);
    px(x,11,8,2,8,'#4a3828');           // corpo
    px(x,11,6,2,2,'#4a3828');
    px(x,9,4,2,3,'#4a3828'); px(x,13,4,2,3,'#4a3828');  // antenne
    if(ap){
      ART.ellip(x,7,9,5,4,c1);  ART.ellip(x,17,9,5,4,c1);
      ART.ellip(x,7,14,4,3,c2); ART.ellip(x,17,14,4,3,c2);
      px(x,5,8,3,2,c3); px(x,16,8,3,2,c3);
      px(x,6,13,2,2,'#fff8e0'); px(x,16,13,2,2,'#fff8e0');
    } else {
      ART.ellip(x,10,9,2.4,5,c1); ART.ellip(x,14,9,2.4,5,c1);
      ART.ellip(x,10,14,2,3,c2);  ART.ellip(x,14,14,2,3,c2);
    }
  },

  /* ---------- LIBELLULA ---------- */
  libellula(x, f){
    const ap=f%2===0;
    px(x,11,8,3,14,'#3f8ab0');
    px(x,11,8,3,4,'#5fb0d0');
    for(let i=0;i<4;i++) px(x,11,13+i*2,3,1,'#2f6f96');
    ART.circ(x,12.5,7,3,'#5fc0d8');
    px(x,10,5,2,2,'#1a3a4a'); px(x,14,5,2,2,'#1a3a4a');
    x.globalAlpha=ap?0.55:0.3;
    if(ap){
      ART.ellip(x,5,9,6,2,'#cfe8f2'); ART.ellip(x,20,9,6,2,'#cfe8f2');
      ART.ellip(x,6,13,5,2,'#cfe8f2'); ART.ellip(x,19,13,5,2,'#cfe8f2');
    } else {
      ART.ellip(x,8,8,3,1.4,'#cfe8f2'); ART.ellip(x,17,8,3,1.4,'#cfe8f2');
    }
    x.globalAlpha=1;
  },

  /* ---------- UCCELLINO ---------- */
  uccellino(x, f, volo, col){
    const c1=col||'#7a9cc0', c2=ART.shade(col||'#7a9cc0',-0.25), pancia='#f0e8d8';
    if(volo){
      const su = f%2===0;
      ART.ellip(x,14,13,6,4,c1);
      ART.ellip(x,15,14,4,3,pancia);
      ART.circ(x,19,10,3.4,c1);
      px(x,22,10,3,2,'#e0a03c');
      px(x,19,9,2,2,'#2f2418');
      // ali
      if(su){ ART.ellip(x,12,8,7,3,c2); ART.ellip(x,12,7,5,2,c1); }
      else  { ART.ellip(x,12,17,7,3,c2); ART.ellip(x,12,18,5,2,c1); }
      px(x,7,13,5,3,c2);
    } else {
      const b=f%2;
      px(x,12,20-b,2,3,'#e0a03c'); px(x,16,20-b,2,3,'#e0a03c');
      ART.ellip(x,15,16-b,6,5,c1);
      ART.ellip(x,16,18-b,4,3,pancia);
      px(x,7,13-b,6,3,c2);            // coda
      ART.circ(x,19,11-b,3.6,c1);
      px(x,22,11-b,3,2,'#e0a03c');
      px(x,19,10-b,2,2,'#2f2418');
      px(x,19,9-b,1,1,'#fff');
      ART.ellip(x,13,15-b,4,3,c2);    // ala a riposo
    }
  },

  /* ---------- CORVO ---------- */
  corvo(x, f, volo){
    const n='#241f26', n2='#3a3440', l='#4a4450';
    if(volo){
      const su=f%2===0;
      ART.ellip(x,16,15,8,5,n);
      ART.circ(x,23,11,4,n);
      px(x,27,11,4,2,'#3a3028');
      px(x,23,10,2,2,'#e8c25a');
      if(su){ ART.ellip(x,12,8,11,3.4,n2); ART.ellip(x,13,7,8,2,l); }
      else  { ART.ellip(x,12,20,11,3.4,n2); ART.ellip(x,13,21,8,2,l); }
      px(x,5,14,8,4,n2);
    } else {
      const b=f%2;
      px(x,14,23-b,2,4,'#3a3028'); px(x,19,23-b,2,4,'#3a3028');
      ART.ellip(x,18,18-b,8,6,n);
      ART.ellip(x,18,16-b,7,4,n2);
      px(x,7,14-b,9,4,n);             // coda
      ART.circ(x,24,12-b,4.2,n);
      px(x,28,12-b,4,2,'#3a3028');
      px(x,24,11-b,2,2,'#e8c25a');
      px(x,24,11-b,1,1,'#fff');
      ART.ellip(x,16,17-b,5,4,l);
    }
  },

  /* ---------- PIPISTRELLO ---------- */
  pipistrello(x, f){
    const c='#4a3a52', c2='#6b5a75';
    const su=f%2===0;
    ART.ellip(x,16,14,4,4,c);
    ART.circ(x,16,10,3.2,c);
    px(x,13,6,3,4,c); px(x,17,6,3,4,c);      // orecchie
    px(x,14,9,2,2,'#e8c25a'); px(x,18,9,2,2,'#e8c25a');
    const wy = su? -4 : 4;
    x.fillStyle=c2;
    x.beginPath(); x.moveTo(13,13); x.lineTo(2,10+wy); x.lineTo(4,16+wy); x.lineTo(8,14); x.lineTo(12,17); x.fill();
    x.beginPath(); x.moveTo(19,13); x.lineTo(30,10+wy); x.lineTo(28,16+wy); x.lineTo(24,14); x.lineTo(20,17); x.fill();
  },

  /* ---------- LUMACA ---------- */
  lumaca(x, f){
    const b=f%2;
    ART.ellip(x,14,20,10,3,'#c9b48c');
    px(x,20,15-b,2,4,'#c9b48c'); px(x,24,15-b,2,4,'#c9b48c');
    px(x,20,14-b,2,2,'#2f2418'); px(x,24,14-b,2,2,'#2f2418');
    ART.circ(x,12,16,6,'#a8763c');
    ART.circ(x,12,16,4.4,'#c99a5e');
    ART.circ(x,12,16,2.6,'#8a6038');
    ART.circ(x,12,16,1,'#c99a5e');
  }
};

/* dimensioni dei riquadri sprite */
const DIM = {
  coniglio:[30,26], cervo:[42,38], scoiattolo:[28,26], riccio:[30,24],
  rana:[30,24], farfalla:[24,20], libellula:[26,24], uccellino:[28,24],
  corvo:[34,28], pipistrello:[32,22], lumaca:[28,24]
};

M.sprite = function(tipo, frame, volo, col){
  const d = DIM[tipo] || [32,32];
  const key = tipo+'|'+frame+'|'+(volo?1:0)+'|'+(col||'');
  return spr(key, d[0], d[1], x=>{
    const f = SPRITE[tipo];
    if(f) f(x, frame, tipo==='uccellino'||tipo==='corvo' ? volo : col, col);
  });
};

/* ===================================================================
   REGOLE DI COMPARSA
   =================================================================== */
const SPECIE = {
  coniglio:   { mappe:['podere','bosco'], terreni:['erba'], notte:false, max:3, vel:0.55, timido:70 },
  cervo:      { mappe:['bosco'],          terreni:['erba'], alba:true,   max:1, vel:0.42, timido:110, raro:0.35 },
  scoiattolo: { mappe:['bosco'],          terreni:['erba'], notte:false, max:2, vel:0.7,  timido:60 },
  riccio:     { mappe:['bosco','podere'], terreni:['erba'], notte:true,  max:2, vel:0.3,  timido:44 },
  rana:       { mappe:['podere','bosco'], terreni:['sabbia','erba'], vicinoAcqua:true, max:3, vel:0.35, timido:40 },
  farfalla:   { mappe:['podere','bosco','fioralba'], vola:true, stagioni:['primavera','estate'], notte:false, max:5, vel:0.42 },
  libellula:  { mappe:['podere','bosco'], vola:true, stagioni:['estate'], vicinoAcqua:true, notte:false, max:3, vel:0.7 },
  uccellino:  { mappe:['podere','bosco','fioralba'], vola:true, notte:false, max:4, vel:0.85, timido:70 },
  corvo:      { mappe:['podere'],         vola:true, notte:false, max:2, vel:0.8, timido:80, ladro:true },
  pipistrello:{ mappe:['grotta'],         vola:true, max:4, vel:1.0 },
  lumaca:     { mappe:['podere','bosco'], terreni:['erba','terra'], pioggia:true, max:3, vel:0.12, timido:0 }
};

const COLORI_FARFALLA = ['#f0a8d0','#f5d24f','#a8c8f0','#f08a6a','#c8a8f0','#fff0c8'];
const COLORI_UCCELLO  = ['#7a9cc0','#c07a5a','#d0b45a','#7ab08a','#b07a9c'];

let mobs = [];
M.lista = ()=>mobs;
M.reset = ()=>{ mobs=[]; };

function notteOra(ora){ return ora>1080 || ora<390; }
function albaOra(ora){ return (ora>=360 && ora<480) || (ora>=1020 && ora<1140); }

function puoiComparire(id, G){
  const S = SPECIE[id];
  const m = G.mappa();
  if(S.mappe.indexOf(G.mappaId)<0) return false;
  if(S.stagioni && S.stagioni.indexOf(G.stagione().id)<0) return false;
  if(S.notte===true  && !notteOra(G.ora)) return false;
  if(S.notte===false &&  notteOra(G.ora)) return false;
  if(S.alba && !albaOra(G.ora)) return false;
  if(S.pioggia && G.meteo!=='pioggia' && G.meteo!=='temporale') return false;
  if(!S.pioggia && (G.meteo==='temporale')) return false;
  if(G.stagione().id==='inverno' && !S.mappe.includes('grotta') && (id==='farfalla'||id==='libellula'||id==='rana'||id==='lumaca')) return false;
  if(S.raro && Math.random()>S.raro) return false;
  return true;
}

/* trova un punto valido appena fuori dalla vista */
function puntoComparsa(G, S){
  const m = G.mappa();
  const info = REND.info();
  for(let tent=0; tent<26; tent++){
    const a = Math.random()*6.283;
    const d = 150 + Math.random()*130;
    const wx = G.p.px + Math.cos(a)*d;
    const wy = G.p.py + Math.sin(a)*d;
    const tx = (wx/T)|0, ty = (wy/T)|0;
    if(!WORLD.dentro(m,tx,ty)) continue;
    if(WORLD.solido(m,tx,ty)) continue;
    const terr = WORLD.terreno(m,tx,ty);
    if(S.terreni && S.terreni.indexOf(terr)<0) continue;
    if(!S.vola && terr==='acqua') continue;
    if(S.vicinoAcqua){
      let vicino=false;
      for(let dy=-3;dy<=3 && !vicino;dy++) for(let dx=-3;dx<=3;dx++)
        if(WORLD.terreno(m,tx+dx,ty+dy)==='acqua'){ vicino=true; break; }
      if(!vicino) continue;
    }
    return {x:wx, y:wy};
  }
  return null;
}

function nuovo(id, pos){
  const S = SPECIE[id];
  return {
    tipo:id, x:pos.x, y:pos.y, z:S.vola? 14+Math.random()*22 : 0,
    vx:0, vy:0, dir:1, frame:0, animT:0,
    stato:'gira', t:600+Math.random()*1800,
    col: id==='farfalla' ? COLORI_FARFALLA[(Math.random()*COLORI_FARFALLA.length)|0]
       : id==='uccellino'? COLORI_UCCELLO[(Math.random()*COLORI_UCCELLO.length)|0] : null,
    fase: Math.random()*6.283,
    vita: 30000+Math.random()*40000
  };
}

/* ===================================================================
   AGGIORNAMENTO
   =================================================================== */
let spawnT = 0;

M.aggiorna = function(G, dt){
  const m = G.mappa();
  spawnT -= dt;

  /* --- comparsa --- */
  if(spawnT <= 0){
    spawnT = 700 + Math.random()*900;
    const conte = {};
    for(const b of mobs) conte[b.tipo]=(conte[b.tipo]||0)+1;
    const specie = Object.keys(SPECIE);
    const id = specie[(Math.random()*specie.length)|0];
    const S = SPECIE[id];
    if(mobs.length < 14 && (conte[id]||0) < S.max && puoiComparire(id, G)){
      const p = puntoComparsa(G, S);
      if(p) mobs.push(nuovo(id, p));
    }
  }

  /* --- aggiornamento --- */
  const distPl = (b)=>Math.hypot(b.x-G.p.px, b.y-G.p.py);

  for(let i=mobs.length-1; i>=0; i--){
    const b = mobs[i];
    const S = SPECIE[b.tipo];
    b.vita -= dt;
    b.t -= dt;
    b.animT += dt;

    const d = distPl(b);
    // troppo lontano o scaduto → sparisce
    if(d > 620 || b.vita<=0){ mobs.splice(i,1); continue; }

    /* fuga */
    if(S.timido && d < S.timido && b.stato!=='fugge'){
      b.stato='fugge'; b.t=900+Math.random()*700;
      const a = Math.atan2(b.y-G.p.py, b.x-G.p.px);
      b.vx = Math.cos(a)*S.vel*2.1;
      b.vy = Math.sin(a)*S.vel*2.1;
      if(S.vola) b.z = Math.max(b.z, 10);
      if(b.tipo==='corvo' && b.stato!=='vola'){ SND.play('gallina'); }
    }

    switch(b.stato){
      case 'gira': {
        if(b.t<=0){
          if(Math.random()<0.45){ b.stato='fermo'; b.t=900+Math.random()*2600; b.vx=b.vy=0; }
          else {
            const a=Math.random()*6.283;
            b.vx=Math.cos(a)*S.vel; b.vy=Math.sin(a)*S.vel;
            b.t=800+Math.random()*1600;
          }
        }
        break;
      }
      case 'fermo': {
        b.vx=b.vy=0;
        if(b.t<=0){ b.stato='gira'; b.t=600+Math.random()*1400; }
        break;
      }
      case 'fugge': {
        b.vx*=0.985; b.vy*=0.985;
        if(b.t<=0){ b.stato='gira'; b.t=900; }
        break;
      }
      case 'mangia': {
        b.vx=b.vy=0;
        if(b.t<=0){
          rubaRaccolto(G, b);
          b.stato='gira'; b.t=600;
        }
        break;
      }
    }

    /* il corvo cerca colture pronte */
    if(S.ladro && b.stato==='gira' && Math.random()<dt*0.0006){
      const bersaglio = cercaColtura(G, b);
      if(bersaglio){
        b.bersaglio = bersaglio;
        const a = Math.atan2(bersaglio.wy-b.y, bersaglio.wx-b.x);
        b.vx = Math.cos(a)*S.vel; b.vy = Math.sin(a)*S.vel;
        b.t = 2600;
      }
    }
    if(S.ladro && b.bersaglio && b.stato==='gira'){
      const dd = Math.hypot(b.bersaglio.wx-b.x, b.bersaglio.wy-b.y);
      if(dd < 12){ b.stato='mangia'; b.t=1400; b.z=0; }
      else if(b.z>2) b.z -= dt*0.02;
    }

    /* volo: oscillazione verticale */
    if(S.vola){
      b.fase += dt*0.004;
      if(b.stato!=='mangia'){
        const alt = b.stato==='fugge' ? 34 : 20;
        b.z += ((alt + Math.sin(b.fase)*7) - b.z) * 0.03;
      }
      // le farfalle svolazzano invece di andare dritte
      if(b.tipo==='farfalla'){
        b.vx += Math.sin(b.fase*2.3)*0.06;
        b.vy += Math.cos(b.fase*1.7)*0.05;
        const v=Math.hypot(b.vx,b.vy);
        if(v>S.vel*1.6){ b.vx*=S.vel*1.6/v; b.vy*=S.vel*1.6/v; }
      }
    }

    /* movimento con collisione (i volatili passano sopra tutto) */
    const nx = b.x + b.vx*dt/16;
    const ny = b.y + b.vy*dt/16;
    if(S.vola){
      b.x=nx; b.y=ny;
    } else {
      if(!WORLD.solido(m,(nx/T)|0,(b.y/T)|0) && WORLD.terreno(m,(nx/T)|0,(b.y/T)|0)!=='acqua') b.x=nx;
      else b.vx=-b.vx;
      if(!WORLD.solido(m,(b.x/T)|0,(ny/T)|0) && WORLD.terreno(m,(b.x/T)|0,(ny/T)|0)!=='acqua') b.y=ny;
      else b.vy=-b.vy;
    }
    // dentro i bordi
    b.x = Math.max(8, Math.min(m.w*T-8, b.x));
    b.y = Math.max(8, Math.min(m.h*T-8, b.y));

    if(Math.abs(b.vx)>0.01) b.dir = b.vx<0?-1:1;

    /* animazione */
    const rit = S.vola ? (b.tipo==='farfalla'?70:(b.tipo==='libellula'?45:110))
                       : (b.stato==='fugge'?110:190);
    if(b.animT > rit){ b.animT=0; b.frame=(b.frame+1)%4; }

    b.volo = S.vola && b.z > 4;
  }
};

/* cerca una coltura matura da beccare */
function cercaColtura(G, b){
  const m = G.mappa();
  if(!m.coltivabile) return null;
  const bx=(b.x/T)|0, by=(b.y/T)|0;
  for(let tent=0;tent<40;tent++){
    const tx = bx + ((Math.random()*18)|0) - 9;
    const ty = by + ((Math.random()*18)|0) - 9;
    if(!WORLD.dentro(m,tx,ty)) continue;
    const s = m.suolo[WORLD.idx(m,tx,ty)];
    if(!s || !s.crop) continue;
    const C = DATA.CROPS[s.crop.id];
    if(s.crop.stage < C.fasi.length) continue;
    if(protettoDaSpaventapasseri(m,tx,ty)) continue;
    return { tx, ty, wx:tx*T+16, wy:ty*T+22 };
  }
  return null;
}

function protettoDaSpaventapasseri(m, tx, ty){
  for(let y=ty-6;y<=ty+6;y++) for(let x=tx-6;x<=tx+6;x++){
    if(!WORLD.dentro(m,x,y)) continue;
    const o = m.obj[WORLD.idx(m,x,y)];
    if(o && o.t==='mobile' && o.kind==='spaventapasseri'){
      if((x-tx)*(x-tx)+(y-ty)*(y-ty) <= 36) return true;
    }
  }
  return false;
}

function rubaRaccolto(G, b){
  const m = G.mappa();
  const t = b.bersaglio;
  b.bersaglio = null;
  if(!t) return;
  const s = m.suolo[WORLD.idx(m,t.tx,t.ty)];
  if(!s || !s.crop) return;
  const C = DATA.CROPS[s.crop.id];
  if(s.crop.stage < C.fasi.length) return;
  // riporta la pianta indietro di una fase (o la toglie se non ricresce)
  if(C.ricresce){ s.crop.stage = Math.max(0, C.fasi.length-1); s.crop.gg=0; }
  else s.crop = null;
  UI.toast('Un corvo ti ha beccato '+C.nome+'! Servirebbe uno spaventapasseri.','bad');
  SND.play('errore');
  for(let k=0;k<8;k++) G.particelle.push({t:'foglia',
    x:t.wx+(Math.random()-0.5)*16, y:t.wy-6,
    vx:(Math.random()-0.5)*1.1, vy:-0.5-Math.random()*0.5, g:0.02,
    r:Math.random()*6.3, vr:0.2, vita:800, vitaMax:800, c:C.c1});
}

/* ===================================================================
   DISEGNO
   =================================================================== */
M.disegna = function(sx, G, ox, oy, sole){
  for(const b of mobs){
    const S = SPECIE[b.tipo];
    const px0 = b.x+ox, py0 = b.y+oy;
    const img = M.sprite(b.tipo, b.frame, b.volo, b.col);
    const w=img.width, h=img.height;

    // ombra: più piccola e sfocata quanto più è alto
    const scala = Math.max(0.25, 1 - b.z/60);
    FX.ombraTerra(sx, px0, py0, (w*0.28)*scala, (h*0.16)*scala, 0.22*scala);

    const dy = py0 - b.z;
    // contorno sottile per staccare dallo sfondo
    const cont = FX.contorno(img);
    sx.drawImage(cont, (px0-w/2-1)|0, (dy-h+1)|0);

    sx.save();
    if(b.dir<0){ sx.translate(px0, 0); sx.scale(-1,1); sx.translate(-px0, 0); }
    sx.drawImage(img, (px0-w/2)|0, (dy-h+2)|0);
    sx.restore();
  }
};

/* i mob visibili, come oggetti ordinabili in profondità */
M.perProfondita = function(sx, G, ox, oy){
  const out=[];
  for(const b of mobs){
    out.push({ y: b.y, mob:b });
  }
  return out;
};

M.disegnaUno = function(sx, b, ox, oy){
  const px0 = b.x+ox, py0 = b.y+oy;
  const img = M.sprite(b.tipo, b.frame, b.volo, b.col);
  const w=img.width, h=img.height;
  const scala = Math.max(0.25, 1 - b.z/60);
  FX.ombraTerra(sx, px0, py0, (w*0.28)*scala, (h*0.16)*scala, 0.22*scala);
  const dy = py0 - b.z;
  sx.drawImage(FX.contorno(img), (px0-w/2-1)|0, (dy-h+1)|0);
  sx.save();
  if(b.dir<0){ sx.translate(px0,0); sx.scale(-1,1); sx.translate(-px0,0); }
  sx.drawImage(img, (px0-w/2)|0, (dy-h+2)|0);
  sx.restore();
};

})();
