/* ===================================================================
   FIORALBA — art.js
   Motore di pixel-art procedurale. Nessun asset esterno: ogni sprite
   viene disegnato in codice su canvas offscreen e messo in cache.
   =================================================================== */
(function(){
'use strict';

const A = {};
window.ART = A;

const T = 32;              // dimensione tile in pixel d'arte
A.T = T;

/* ---------------- utilità ---------------- */
function cv(w,h){
  const c = document.createElement('canvas');
  c.width=w; c.height=h;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  return c;
}
A.cv = cv;

function px(c,x,y,w,h,col){ c.fillStyle=col; c.fillRect(x|0,y|0,w|0,h|0); }
A.px = px;

/* rumore deterministico */
function hsh(x,y,s){
  let n = (x|0)*374761393 + (y|0)*668265263 + (s|0)*1442695040;
  n = (n ^ (n>>13)) * 1274126177;
  return ((n ^ (n>>16)) >>> 0) / 4294967295;
}
A.hsh = hsh;

/* rumore morbido interpolato: per variare le densità senza vedere la griglia */
A.rumore = function(x, y, scala){
  const fx = x/scala, fy = y/scala;
  const ix = Math.floor(fx), iy = Math.floor(fy);
  const tx = fx-ix, ty = fy-iy;
  const s = t=>t*t*(3-2*t);
  const a = hsh(ix,iy,555),   b = hsh(ix+1,iy,555);
  const c = hsh(ix,iy+1,555), d = hsh(ix+1,iy+1,555);
  const u = s(tx), v = s(ty);
  return (a*(1-u)+b*u)*(1-v) + (c*(1-u)+d*u)*v;
};

/* schiarisci / scurisci un colore hex */
function shade(hex, amt){
  const n = parseInt(hex.slice(1),16);
  let r=(n>>16)&255, g=(n>>8)&255, b=n&255;
  if(amt>0){ r+=(255-r)*amt; g+=(255-g)*amt; b+=(255-b)*amt; }
  else { r*=(1+amt); g*=(1+amt); b*=(1+amt); }
  return '#'+((1<<24)+((r|0)<<16)+((g|0)<<8)+(b|0)).toString(16).slice(1);
}
A.shade = shade;

function mix(a,b,t){
  const na=parseInt(a.slice(1),16), nb=parseInt(b.slice(1),16);
  const r=((na>>16&255)*(1-t)+(nb>>16&255)*t)|0;
  const g=((na>>8&255)*(1-t)+(nb>>8&255)*t)|0;
  const bl=((na&255)*(1-t)+(nb&255)*t)|0;
  return '#'+((1<<24)+(r<<16)+(g<<8)+bl).toString(16).slice(1);
}
A.mix = mix;

/* ellisse pixelata */
function ellip(c,cx,cy,rx,ry,col){
  c.fillStyle=col;
  for(let y=-ry;y<=ry;y++){
    const w = Math.sqrt(Math.max(0,1-(y*y)/(ry*ry)))*rx;
    if(w<0.4) continue;
    c.fillRect(Math.round(cx-w), Math.round(cy+y), Math.max(1,Math.round(w*2)), 1);
  }
}
A.ellip = ellip;

function circ(c,cx,cy,r,col){ ellip(c,cx,cy,r,r,col); }
A.circ = circ;

/* ===================================================================
   1. TERRENI
   =================================================================== */
const groundCache = {};

function grassTile(v, season){
  const S = DATA.SEASONS.find(s=>s.id===season);
  const c = cv(T,T), x = c.getContext('2d');
  const base = S.grass, dark = S.grass2;
  px(x,0,0,T,T,base);
  // chiazze morbide
  for(let i=0;i<26;i++){
    const r = hsh(i,v,season.length*7);
    const bx = (hsh(i,v,1)*T)|0, by=(hsh(i,v,2)*T)|0;
    const sz = 2+((r*4)|0);
    x.fillStyle = r>0.5 ? shade(base,0.06) : dark;
    x.globalAlpha = 0.5;
    x.fillRect(bx,by,sz,sz-1);
  }
  x.globalAlpha=1;
  // fili d'erba
  const blade = shade(base, season==='inverno'? 0.10 : 0.16);
  const blade2 = shade(dark, -0.10);
  for(let i=0;i<16;i++){
    const bx=(hsh(i,v,11)*T)|0, by=(hsh(i,v,12)*T)|0;
    const h = 2+((hsh(i,v,13)*3)|0);
    x.fillStyle = i%3? blade : blade2;
    x.fillRect(bx,by,1,h);
    if(i%4===0) x.fillRect(bx+1,by+1,1,h-1);
  }
  // fiorellini stagionali
  if(season!=='inverno'){
    const n = season==='primavera'?3:(season==='estate'?2:1);
    for(let i=0;i<n;i++){
      if(hsh(i,v,21)>0.55){
        const bx=2+((hsh(i,v,22)*(T-5))|0), by=2+((hsh(i,v,23)*(T-5))|0);
        const col = season==='autunno' ? '#d9a03c' : (hsh(i,v,24)>0.5? S.accent : '#fff4d8');
        px(x,bx,by,2,2,col);
        px(x,bx,by-1,1,1,shade(col,0.3));
      }
    }
  } else {
    // brina
    for(let i=0;i<10;i++){
      const bx=(hsh(i,v,31)*T)|0, by=(hsh(i,v,32)*T)|0;
      px(x,bx,by,1,1,'#ffffff');
    }
  }
  return c;
}

function dirtTile(v){
  const c=cv(T,T), x=c.getContext('2d');
  px(x,0,0,T,T,'#8a6647');
  for(let i=0;i<40;i++){
    const bx=(hsh(i,v,41)*T)|0, by=(hsh(i,v,42)*T)|0, r=hsh(i,v,43);
    x.fillStyle = r>0.6?'#9a7452':(r>0.3?'#7a5840':'#6d4d38');
    x.fillRect(bx,by,1+((r*2)|0),1);
  }
  for(let i=0;i<5;i++){
    const bx=(hsh(i,v,44)*T)|0, by=(hsh(i,v,45)*T)|0;
    px(x,bx,by,2,2,'#6b4b36');
    px(x,bx,by,1,1,'#a07a56');
  }
  return c;
}

function tilledTile(v, wet){
  const c=cv(T,T), x=c.getContext('2d');
  const base = wet? '#6b4c36' : '#9a7150';
  const ridge= wet? '#7d5a41' : '#b08a62';
  const dark = wet? '#513828' : '#7d5940';
  px(x,0,0,T,T,base);
  // solchi orizzontali
  for(let r=0;r<4;r++){
    const y=r*8;
    px(x,0,y,T,1,dark);
    px(x,0,y+1,T,2,ridge);
    px(x,0,y+3,T,1,shade(base,-0.05));
    for(let i=0;i<8;i++){
      const bx=(hsh(i,v+r,51)*T)|0;
      px(x,bx,y+4,1,2, hsh(i,v+r,52)>0.5?dark:shade(base,0.05));
    }
  }
  if(wet){
    // riflessi d'acqua
    for(let i=0;i<7;i++){
      const bx=(hsh(i,v,61)*T)|0, by=(hsh(i,v,62)*T)|0;
      x.globalAlpha=0.35; px(x,bx,by,2,1,'#8fb8d0'); x.globalAlpha=1;
    }
  }
  return c;
}

function pathTile(v){
  const c=cv(T,T), x=c.getContext('2d');
  px(x,0,0,T,T,'#9b8f7d');
  // ciottoli
  const cols=['#b5a894','#a89b86','#c2b6a2','#8f8371'];
  for(let gy=0; gy<4; gy++) for(let gx=0; gx<4; gx++){
    const r=hsh(gx,gy*7+v,71);
    const bx=gx*8+((hsh(gx,gy+v,72)*2)|0), by=gy*8+((hsh(gx,gy+v,73)*2)|0);
    const w=5+((r*2)|0), h=5+((hsh(gx,gy+v,74)*2)|0);
    const col=cols[(r*4)|0];
    x.fillStyle=col; x.fillRect(bx,by,w,h);
    x.fillStyle=shade(col,0.18); x.fillRect(bx,by,w,1);
    x.fillStyle=shade(col,-0.22); x.fillRect(bx,by+h-1,w,1);
  }
  return c;
}

function sandTile(v){
  const c=cv(T,T), x=c.getContext('2d');
  px(x,0,0,T,T,'#e0cb96');
  for(let i=0;i<34;i++){
    const bx=(hsh(i,v,81)*T)|0, by=(hsh(i,v,82)*T)|0;
    x.fillStyle = hsh(i,v,83)>0.5?'#d4bd85':'#eedaab';
    x.fillRect(bx,by,1,1);
  }
  return c;
}

function woodTile(v){
  const c=cv(T,T), x=c.getContext('2d');
  px(x,0,0,T,T,'#a87a4a');
  for(let r=0;r<4;r++){
    const y=r*8;
    px(x,0,y,T,1,'#7a5432');
    px(x,0,y+1,T,7, r%2? '#b0824f':'#a87a4a');
    for(let i=0;i<6;i++){
      const bx=(hsh(i,r+v,91)*T)|0;
      x.globalAlpha=0.35; px(x,bx,y+2+((hsh(i,r,92)*4)|0),3+((hsh(i,r,93)*4)|0),1,'#8a6038'); x.globalAlpha=1;
    }
    const jx = (r%2? 16:0);
    px(x,jx,y,1,8,'#7a5432');
  }
  return c;
}

function stoneFloorTile(v){
  const c=cv(T,T), x=c.getContext('2d');
  // lastre calde, sabbiose, con giunti di malta chiara
  px(x,0,0,T,T,'#c2b49a');
  const cols=['#cfc1a6','#c6b79c','#bcac90','#d4c7ad'];
  // sfalsate: due file da due lastre, con offset alternato
  for(let gy=0;gy<2;gy++){
    const off = (gy+v)%2 ? 8 : 0;
    for(let gx=-1;gx<3;gx++){
      const bx=gx*16+off, by=gy*16;
      const col = cols[(hsh(gx+2,gy+v,101)*4)|0];
      x.fillStyle=col; x.fillRect(bx+1,by+1,14,14);
      x.fillStyle=shade(col,0.16); x.fillRect(bx+1,by+1,14,2);
      x.fillStyle=shade(col,-0.16); x.fillRect(bx+1,by+13,14,2);
      // usura
      for(let i=0;i<3;i++){
        const ux=bx+2+((hsh(i,gx*3+gy+v,102)*11)|0), uy=by+3+((hsh(i,gx+gy*5+v,103)*10)|0);
        x.fillStyle = hsh(i,gx+gy,104)>0.5 ? shade(col,-0.10) : shade(col,0.10);
        x.fillRect(ux,uy,2,1);
      }
    }
  }
  // muschio negli interstizi
  for(let i=0;i<4;i++){
    if(hsh(i,v,105)<0.55) continue;
    const mx=(hsh(i,v,106)*T)|0, my=(hsh(i,v,107)*T)|0;
    x.globalAlpha=0.4; px(x,mx,my,2,2,'#7f9455'); x.globalAlpha=1;
  }
  return c;
}

function snowTile(v){
  const c=cv(T,T), x=c.getContext('2d');
  px(x,0,0,T,T,'#e8eef2');
  for(let i=0;i<24;i++){
    const bx=(hsh(i,v,111)*T)|0, by=(hsh(i,v,112)*T)|0;
    x.fillStyle=hsh(i,v,113)>0.5?'#ffffff':'#d6e0e8';
    x.fillRect(bx,by,2,1);
  }
  return c;
}

function caveTile(v){
  const c=cv(T,T), x=c.getContext('2d');
  // pavimento della grotta: sabbioso, più chiaro delle pareti
  px(x,0,0,T,T,'#6b6155');
  for(let i=0;i<34;i++){
    const bx=(hsh(i,v,121)*T)|0, by=(hsh(i,v,122)*T)|0, r=hsh(i,v,123);
    x.fillStyle=r>0.6?'#7a6f60':(r>0.3?'#5f564c':'#544c44');
    x.fillRect(bx,by,1+((r*2)|0),1);
  }
  // ghiaia
  for(let i=0;i<6;i++){
    const bx=(hsh(i,v,124)*T)|0, by=(hsh(i,v,125)*T)|0;
    px(x,bx,by,2,2,'#82776a');
    px(x,bx,by,1,1,'#948877');
  }
  return c;
}

/* acqua animata: 6 frame */
function waterFrames(season){
  const frames=[];
  const deep = season==='inverno' ? '#3f5f78' : '#2f6f96';
  const mid  = season==='inverno' ? '#547a94' : '#3f8ab0';
  const top  = season==='inverno' ? '#7ea2b8' : '#63b0cc';
  for(let f=0;f<6;f++){
    const c=cv(T,T), x=c.getContext('2d');
    px(x,0,0,T,T,deep);
    for(let i=0;i<20;i++){
      const bx=(hsh(i,f,131)*T)|0;
      const by=((hsh(i,0,132)*T + f*2.2)|0)%T;
      x.globalAlpha=0.55;
      px(x,bx,by,3+((hsh(i,0,133)*4)|0),1,mid);
      x.globalAlpha=1;
    }
    for(let i=0;i<7;i++){
      const bx=((hsh(i,0,141)*T + Math.sin((f/6)*6.28+i)*3)|0+T)%T;
      const by=((hsh(i,0,142)*T)|0);
      x.globalAlpha=0.7;
      px(x,bx,by,4,1,top);
      px(x,bx+1,by+1,2,1,shade(top,0.25));
      x.globalAlpha=1;
    }
    frames.push(c);
  }
  return frames;
}

A.ground = function(type, v, season){
  const key = type+'|'+v+'|'+(type==='erba'||type==='acqua'?season:'-');
  if(groundCache[key]) return groundCache[key];
  let c;
  switch(type){
    case 'erba':   c = season==='inverno' ? snowTile(v) : grassTile(v,season); break;
    case 'terra':  c = dirtTile(v); break;
    case 'sentiero': c = pathTile(v); break;
    case 'sabbia': c = sandTile(v); break;
    case 'assi':   c = woodTile(v); break;
    case 'lastre': c = stoneFloorTile(v); break;
    case 'neve':   c = snowTile(v); break;
    case 'grotta': c = caveTile(v); break;
    case 'arato':  c = tilledTile(v,false); break;
    case 'bagnato':c = tilledTile(v,true); break;
    default:       c = grassTile(v,season||'primavera');
  }
  groundCache[key]=c;
  return c;
};

const waterCache = {};
A.water = function(season, frame){
  if(!waterCache[season]) waterCache[season]=waterFrames(season);
  return waterCache[season][frame%6];
};

/* ===================================================================
   2. PERSONAGGI
   =================================================================== */
/* look = {pelle,capelli,maglia,pant,grembiule,cappello,barba,spirito} */
A.CHAR_W = 26; A.CHAR_H = 36;

A.drawChar = function(x, cx, cy, look, dir, frame, opt){
  opt = opt || {};
  const bob = (frame===1||frame===3) ? -1 : 0;
  const step = frame===1 ? 1 : (frame===3 ? -1 : 0);

  if(look.spirito){ return drawSpirit(x,cx,cy,frame,opt); }

  const pelle = look.pelle||'#e8bd8f';
  const pelleS= shade(pelle,-0.20);
  const cap   = look.capelli||'#4a3524';
  const capS  = shade(cap,-0.25);
  const capL  = shade(cap,0.16);
  const mag   = look.maglia||'#c05a44';
  const magS  = shade(mag,-0.22);
  const magL  = shade(mag,0.14);
  const pan   = look.pant||'#3d5470';
  const panS  = shade(pan,-0.25);
  const scarpa= '#4a3524';

  const bx = cx-9, by = cy-32+bob;   // origine sprite (18 largo, 32 alto)

  // ombra (saltata quando la disegna il renderer)
  if(!opt.senzaOmbra){
    x.globalAlpha = 0.24;
    ellip(x, cx, cy-1, 8, 3, '#000000');
    x.globalAlpha = 1;
  }

  /* --- gambe --- */
  const l1 = by+24 + (dir<3? Math.max(0,step) : 0);
  const l2 = by+24 + (dir<3? Math.max(0,-step): 0);
  px(x, bx+4, l1, 4, 6, pan);
  px(x, bx+10,l2, 4, 6, pan);
  px(x, bx+4, l1+5, 4, 1, panS);
  px(x, bx+10,l2+5, 4, 1, panS);
  px(x, bx+3, l1+6, 6, 2, scarpa);
  px(x, bx+9, l2+6, 6, 2, scarpa);

  /* --- corpo --- */
  px(x, bx+3, by+15, 12, 10, mag);
  px(x, bx+3, by+15, 12, 1, magL);
  px(x, bx+3, by+24, 12, 1, magS);
  px(x, bx+2, by+17, 1, 7, magS);
  px(x, bx+15,by+17, 1, 7, magS);

  // grembiule
  if(look.grembiule){
    const g=look.grembiule;
    px(x, bx+5, by+19, 8, 7, g);
    px(x, bx+5, by+19, 8, 1, shade(g,0.2));
    px(x, bx+6, by+25, 6, 1, shade(g,-0.2));
    px(x, bx+7, by+21, 4, 3, shade(g,-0.08));
  }

  /* --- braccia --- */
  const arm = opt.uso ? -2 : (dir<3 ? step : 0);
  if(dir===1){ // sinistra
    px(x, bx+2, by+16+arm, 3, 8, mag);
    px(x, bx+2, by+23+arm, 3, 3, pelle);
  } else if(dir===2){ // destra
    px(x, bx+13, by+16+arm, 3, 8, mag);
    px(x, bx+13, by+23+arm, 3, 3, pelle);
  } else {
    px(x, bx+1, by+16+arm, 3, 8, mag);
    px(x, bx+14,by+16-arm, 3, 8, mag);
    px(x, bx+1, by+23+arm, 3, 3, pelle);
    px(x, bx+14,by+23-arm, 3, 3, pelle);
  }

  /* --- testa --- */
  const hy = by+2;
  px(x, bx+3, hy+2, 12, 12, pelle);
  px(x, bx+2, hy+4, 1, 8, pelle);
  px(x, bx+15,hy+4, 1, 8, pelle);
  px(x, bx+3, hy+13, 12, 1, pelleS);
  px(x, bx+4, hy+14, 10, 1, pelleS);
  // collo
  px(x, bx+7, hy+14, 4, 2, pelleS);

  /* --- capelli --- */
  px(x, bx+2, hy, 14, 4, cap);
  px(x, bx+1, hy+2, 2, 7, cap);
  px(x, bx+15,hy+2, 2, 7, cap);
  px(x, bx+3, hy, 12, 1, capL);
  if(dir===3){ // di spalle: tutta la nuca
    px(x, bx+2, hy, 14, 12, cap);
    px(x, bx+3, hy, 12, 1, capL);
    px(x, bx+2, hy+11, 14, 2, capS);
  } else {
    px(x, bx+2, hy+4, 3, 3, cap);
    px(x, bx+13,hy+4, 3, 3, cap);
    px(x, bx+4, hy+4, 3, 1, capS);
    px(x, bx+11,hy+4, 3, 1, capS);
  }

  /* --- viso --- */
  if(dir!==3){
    const ey = hy+7;
    const eo = dir===1 ? -2 : (dir===2 ? 2 : 0);
    const blink = opt.blink;
    if(blink){
      px(x, bx+5+eo, ey+1, 3, 1, '#3a2a1c');
      px(x, bx+10+eo,ey+1, 3, 1, '#3a2a1c');
    } else {
      px(x, bx+5+eo, ey, 2, 3, '#ffffff');
      px(x, bx+11+eo,ey, 2, 3, '#ffffff');
      px(x, bx+6+eo, ey+1, 1, 2, '#2f2418');
      px(x, bx+11+eo,ey+1, 1, 2, '#2f2418');
    }
    // guance
    x.globalAlpha=0.4;
    px(x, bx+3+eo, ey+3, 2, 2, '#e8908a');
    px(x, bx+13+eo,ey+3, 2, 2, '#e8908a');
    x.globalAlpha=1;
    // bocca
    px(x, bx+8+eo, ey+5, 2, 1, pelleS);
    if(look.barba){
      px(x, bx+5, hy+10, 8, 4, cap);
      px(x, bx+6, hy+13, 6, 2, capS);
      px(x, bx+7, hy+9, 4, 1, capS);
    }
  }

  /* --- cappello --- */
  if(look.cappello){
    const h = look.cappello;
    px(x, bx+1, hy+1, 16, 2, shade(h,-0.15));   // tesa
    px(x, bx+0, hy+2, 18, 1, shade(h,-0.3));
    px(x, bx+3, hy-4, 12, 5, h);
    px(x, bx+3, hy-4, 12, 1, shade(h,0.2));
    px(x, bx+3, hy-1, 12, 1, shade(h,-0.2));
  }

  /* --- attrezzo in mano --- */
  if(opt.attrezzo && dir!==3){
    const sx = dir===1 ? bx-3 : bx+15;
    A.drawToolHeld(x, sx, by+14, opt.attrezzo, dir===1?-1:1, opt.uso);
  }
};

function drawSpirit(x,cx,cy,frame,opt){
  const t = (opt.t||0);
  const fl = Math.sin(t*0.006)*2;
  const glow = 0.55+Math.sin(t*0.004)*0.2;
  x.save();
  x.globalAlpha = 0.28*glow;
  circ(x, cx, cy-16+fl, 15, '#ffe9a8');
  x.globalAlpha = 0.5*glow;
  circ(x, cx, cy-16+fl, 10, '#ffdf8a');
  x.globalAlpha = 1;
  // corpo fiammella
  const body='#fff2c8';
  ellip(x, cx, cy-15+fl, 6, 8, body);
  ellip(x, cx, cy-12+fl, 5, 6, '#ffe28f');
  px(x, cx-1, cy-24+fl, 2, 4, body);
  px(x, cx-2, cy-22+fl, 4, 3, body);
  // occhietti
  px(x, cx-3, cy-17+fl, 2, 3, '#8a5a1c');
  px(x, cx+1, cy-17+fl, 2, 3, '#8a5a1c');
  x.globalAlpha=0.5;
  px(x, cx-4, cy-13+fl, 2, 1, '#e0a050');
  px(x, cx+2, cy-13+fl, 2, 1, '#e0a050');
  x.globalAlpha=1;
  // scintille
  for(let i=0;i<3;i++){
    const a = t*0.002+i*2.1;
    const rx = cx+Math.cos(a)*13, ry = cy-16+fl+Math.sin(a*1.3)*9;
    x.globalAlpha = 0.4+Math.sin(t*0.005+i)*0.3;
    px(x, rx|0, ry|0, 2, 2, '#fff6d0');
  }
  x.globalAlpha=1;
  x.restore();
}

/* versione in cache dello sprite, ancorata in basso al centro:
   serve al renderer per ricavarne contorno e ombra */
const charCache = {};
function chiaveLook(l){
  return (l.pelle||'')+(l.capelli||'')+(l.maglia||'')+(l.pant||'')+
         (l.grembiule||'')+(l.cappello||'')+(l.barba?'b':'');
}
A.CH_W = 30; A.CH_H = 40;
A.charSprite = function(look, dir, frame){
  const key = chiaveLook(look)+'|'+dir+'|'+frame;
  if(charCache[key]) return charCache[key];
  const c = cv(A.CH_W, A.CH_H);
  const x = c.getContext('2d');
  x.imageSmoothingEnabled=false;
  A.drawChar(x, A.CH_W/2, A.CH_H-2, look, dir, frame, {senzaOmbra:true});
  charCache[key]=c;
  return c;
};

/* ritratto per i dialoghi (96x96) */
const faceCache={};
A.face = function(key, look){
  if(faceCache[key]) return faceCache[key];
  const c=cv(96,96), x=c.getContext('2d');
  x.imageSmoothingEnabled=false;
  // sfondo
  const g=x.createLinearGradient(0,0,0,96);
  g.addColorStop(0,'#f6e6c8'); g.addColorStop(1,'#d8bd93');
  x.fillStyle=g; x.fillRect(0,0,96,96);
  x.globalAlpha=0.18;
  for(let i=0;i<40;i++) px(x,(hsh(i,0,7)*96)|0,(hsh(i,1,7)*96)|0,2,2,'#a8865c');
  x.globalAlpha=1;
  // personaggio ingrandito (zoom sulla testa)
  x.save();
  x.translate(48, 96);
  x.scale(3.4,3.4);
  x.translate(0, 8);
  A.drawChar(x, 0, 0, look, 0, 0, {});
  x.restore();
  // vignetta
  const v=x.createRadialGradient(48,44,20,48,48,58);
  v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(60,40,20,.35)');
  x.fillStyle=v; x.fillRect(0,0,96,96);
  faceCache[key]=c;
  return c;
};

/* ===================================================================
   3. COLTURE
   =================================================================== */
A.drawCrop = function(x, cx, by, cropId, stage, nStages, sway){
  const C = DATA.CROPS[cropId];
  if(!C) return;
  const fog = C.foglia, fogS = shade(fog,-0.24), fogL = shade(fog,0.16);
  const t = stage/(nStages);          // 0..1
  const ready = stage >= nStages;
  const s = sway||0;

  if(stage===0){
    // germoglio
    px(x, cx-1, by-4, 2, 4, fog);
    px(x, cx-3+s, by-5, 3, 2, fogL);
    px(x, cx+1+s, by-6, 3, 2, fog);
    return;
  }

  const h = 5 + Math.round(t*12);
  // stelo
  px(x, cx-1+((s*0.4)|0), by-h, 2, h, fog);
  px(x, cx-1+((s*0.4)|0), by-h, 1, h, fogL);
  // foglie
  const pairs = 1 + Math.floor(t*2.4);
  for(let i=0;i<pairs;i++){
    const ly = by - 3 - i*Math.max(3,(h/(pairs+0.4)));
    const w  = 4 + Math.round(t*4) - i;
    const off = Math.round(s*(0.5+i*0.3));
    px(x, cx-1-w+off, ly, w, 3, fog);
    px(x, cx-1-w+off, ly, w, 1, fogL);
    px(x, cx+1+off,   ly-1, w, 3, fog);
    px(x, cx+1+off,   ly-1, w, 1, fogL);
    px(x, cx-1-w+off, ly+2, w, 1, fogS);
  }

  if(!ready){
    if(stage >= nStages-1){
      // frutto acerbo
      const fy = by-h+2;
      circ(x, cx+2+s, fy, 2, shade(C.c2,-0.1));
    }
    return;
  }

  /* --- frutto maturo --- */
  A.drawFruit(x, cx, by, C, h, s, false);
};

A.drawFruit = function(x, cx, by, C, h, s, iconMode){
  const c1=C.c1, c2=C.c2, cl=shade(c1,0.28), cd=shade(c2,-0.18);
  const fog=C.foglia||'#5f9c3c', fogL=shade(fog,0.2);
  const topY = by - h;

  switch(C.forma){
    case 'radice': {
      const y = by-4;
      ellip(x, cx+s, y, 5, 5, c1);
      ellip(x, cx-1+s, y-1, 3, 3, cl);
      px(x, cx-4+s, y-5, 8, 2, c2);
      px(x, cx-1+s, by-1, 2, 3, shade(c1,-0.3));
      break;
    }
    case 'tubero': {
      ellip(x, cx-3+s, by-3, 4, 3, c1);
      ellip(x, cx+3+s, by-2, 3, 3, c2);
      ellip(x, cx-3+s, by-4, 2, 1, cl);
      px(x, cx-4+s, by-3, 1, 1, cd);
      px(x, cx+3+s, by-2, 1, 1, cd);
      break;
    }
    case 'foglia': {
      ellip(x, cx+s, by-8, 8, 7, c2);
      ellip(x, cx+s, by-9, 7, 6, c1);
      ellip(x, cx-2+s, by-11, 3, 3, cl);
      for(let i=0;i<4;i++){
        px(x, cx-6+i*3+s, by-12+((i%2)*2), 1, 6, shade(c2,-0.1));
      }
      break;
    }
    case 'bacca': {
      const pos=[[-4,-3],[3,-5],[0,-9],[-5,-8],[4,-10]];
      for(const p of pos){
        const fx = cx+p[0]+s;
        const yy = by-4+p[1];
        circ(x, fx, yy, 2.6, c1);
        px(x, fx-1, yy-2, 2, 1, cl);
        px(x, fx, yy+2, 1, 1, cd);
        px(x, fx-1, yy-4, 3, 1, fog);
      }
      break;
    }
    case 'fiore': {
      const fy = topY+3;
      for(let i=0;i<8;i++){
        const a=i/8*6.283;
        const pxx = cx+Math.cos(a)*5+s, pyy=fy+Math.sin(a)*5;
        ellip(x, pxx, pyy, 3, 2.4, i%2? c1 : shade(c1,0.12));
      }
      circ(x, cx+s, fy, 3, c2);
      circ(x, cx-1+s, fy-1, 1.4, shade(c2,0.3));
      break;
    }
    case 'pannocchia': {
      const fy = topY+5;
      px(x, cx+1+s, fy-6, 5, 13, c1);
      px(x, cx+1+s, fy-6, 5, 1, cl);
      px(x, cx+5+s, fy-5, 1, 12, cd);
      for(let i=0;i<6;i++) px(x, cx+2+s, fy-5+i*2, 3, 1, shade(c1,0.18));
      px(x, cx+2+s, fy-9, 3, 4, fogL);   // barba
      px(x, cx-1+s, fy-4, 3, 11, fog);
      break;
    }
    case 'sfera': {
      const y=by-6;
      ellip(x, cx+s, y, 8, 7, c1);
      ellip(x, cx-2+s, y-2, 4, 3, cl);
      ellip(x, cx+s, y+5, 7, 2, cd);
      for(let i=-2;i<=2;i++){
        x.globalAlpha=0.4;
        px(x, cx+i*3+s, y-6, 1, 12, cd);
        x.globalAlpha=1;
      }
      px(x, cx-1+s, y-8, 2, 3, '#6a4a28');
      break;
    }
    case 'baccello': {
      const pos=[[-4,-4],[3,-7],[-1,-10]];
      for(const p of pos){
        const fx=cx+p[0]+s, yy=by-2+p[1];
        ellip(x, fx, yy, 2.2, 4, c1);
        px(x, fx-1, yy-2, 1, 4, cl);
        px(x, fx-1, yy-5, 2, 2, fog);
      }
      break;
    }
    case 'grappolo': {
      const gy = by-10;
      const rows=[3,3,2,1];
      let ry=gy;
      for(let r=0;r<rows.length;r++){
        for(let i=0;i<rows[r];i++){
          const fx = cx+s - (rows[r]-1)*2.5 + i*5;
          circ(x, fx, ry, 2.4, (i+r)%2? c1:shade(c1,-0.08));
          px(x, fx-1, ry-2, 1, 1, cl);
        }
        ry += 4;
      }
      px(x, cx-4+s, gy-4, 9, 3, fog);
      px(x, cx-4+s, gy-4, 9, 1, fogL);
      break;
    }
    default:
      circ(x, cx+s, by-6, 4, c1);
  }

  if(C.magica){
    x.globalAlpha=0.35;
    circ(x, cx+s, by-8, 9, '#bff0f8');
    x.globalAlpha=1;
  }
};

/* ===================================================================
   4. ALBERI, SASSI, OGGETTI DI SCENA
   =================================================================== */
const objCache = {};

function foliageBlob(x, cx, cy, r, base, season){
  const dark = shade(base,-0.22), light = shade(base,0.16), light2=shade(base,0.3);
  circ(x, cx, cy, r, dark);
  circ(x, cx, cy-1, r-1, base);
  circ(x, cx-r*0.32, cy-r*0.34, r*0.55, light);
  circ(x, cx-r*0.4, cy-r*0.45, r*0.28, light2);
  // bordo frastagliato
  for(let i=0;i<18;i++){
    const a=i/18*6.283;
    const rr=r*(0.86+hsh(i,cx|0,151)*0.28);
    const bx=cx+Math.cos(a)*rr, byy=cy+Math.sin(a)*rr;
    px(x,bx|0,byy|0,3,3, hsh(i,cy|0,152)>0.5? base:dark);
  }
  if(season==='inverno'){
    x.globalAlpha=0.75;
    for(let i=0;i<12;i++){
      const a=-0.4-i/12*2.4;
      const bx=cx+Math.cos(a)*r*0.85, byy=cy+Math.sin(a)*r*0.85;
      px(x,bx|0,byy|0,4,3,'#ffffff');
    }
    x.globalAlpha=1;
  }
}

A.tree = function(kind, season, stage){
  const key = 'tree|'+kind+'|'+season+'|'+stage;
  if(objCache[key]) return objCache[key];
  const W=96, H=112;
  const c=cv(W,H), x=c.getContext('2d');
  const S = DATA.SEASONS.find(s=>s.id===season);
  const cxx=W/2, base=H-6;

  if(stage===0){ // germoglio
    px(x,cxx-1,base-10,2,10,'#6a4a2c');
    foliageBlob(x,cxx,base-14,7, S.tree, season);
    objCache[key]=c; return c;
  }
  if(stage===1){ // alberello
    px(x,cxx-2,base-24,4,24,'#6a4a2c');
    foliageBlob(x,cxx,base-30,14, S.tree, season);
    objCache[key]=c; return c;
  }

  // la betulla è crema calda, non bianco gesso: isolata non deve
  // sembrare una colonna di pietra
  const trunkCol = kind==='betulla' ? '#cfc6b0' : '#6b4a2e';
  const trunkD   = kind==='betulla' ? '#9d9483' : '#4e3520';
  const trunkL   = kind==='betulla' ? '#e2dcc9' : '#84603f';

  // tronco
  const th = kind==='pino'? 56 : 44;
  const tw = kind==='betulla'? 9 : 12;
  const t0 = cxx - (tw>>1);
  px(x, t0, base-th, tw, th, trunkCol);
  px(x, t0, base-th, 3, th, trunkL);
  px(x, t0+tw-3, base-th, 3, th, trunkD);
  for(let i=0;i<7;i++){
    const yy=base-th+6+i*6;
    x.globalAlpha=0.5;
    px(x, t0+1+((hsh(i,0,161)*(tw-4))|0), yy, 3, 1, trunkD);
    x.globalAlpha=1;
  }
  if(kind==='betulla'){
    for(let i=0;i<7;i++){
      const bw = 3+((hsh(i,2,163)*3)|0);
      px(x, t0+1+((hsh(i,1,162)*(tw-bw-1))|0), base-th+7+i*6, bw, 2, '#4a463e');
    }
  }
  // radici
  px(x, cxx-10, base-4, 6, 4, trunkD);
  px(x, cxx+4,  base-4, 6, 4, trunkD);
  px(x, cxx-7,  base-6, 14, 6, trunkCol);

  // chioma
  if(kind==='pino'){
    const col = season==='inverno' ? '#3d6b52' : '#2f6b45';
    for(let i=0;i<4;i++){
      const yy = base-th-4 + i*14;
      const w  = 16+i*10;
      const dark=shade(col,-0.2), light=shade(col,0.16);
      x.fillStyle=dark;
      for(let k=0;k<=w;k+=2){
        const hh = 16-Math.abs(k-w/2)/(w/2)*10;
        x.fillRect(cxx-w/2+k, yy-hh, 2, hh+6);
      }
      x.fillStyle=col;
      for(let k=2;k<w-2;k+=2){
        const hh = 13-Math.abs(k-w/2)/(w/2)*9;
        x.fillRect(cxx-w/2+k, yy-hh+2, 2, hh+3);
      }
      x.fillStyle=light;
      for(let k=4;k<w/2;k+=3){
        const hh = 9-Math.abs(k-w/2)/(w/2)*6;
        x.fillRect(cxx-w/2+k, yy-hh+3, 2, hh);
      }
      if(season==='inverno'){
        x.globalAlpha=0.8; x.fillStyle='#ffffff';
        for(let k=0;k<w;k+=4) x.fillRect(cxx-w/2+k, yy-8+Math.abs(k-w/2)/(w/2)*6, 3, 2);
        x.globalAlpha=1;
      }
    }
  } else {
    const col = S.tree;
    // rametti bassi: raccordano il tronco alla chioma, così non resta
    // un "collo" nudo che di lontano sembra un palo
    x.strokeStyle = trunkD; x.lineWidth = 3;
    x.beginPath();
    x.moveTo(cxx-1, base-th+16); x.lineTo(cxx-13, base-th+6);
    x.moveTo(cxx+1, base-th+18); x.lineTo(cxx+12, base-th+8);
    x.moveTo(cxx,   base-th+10); x.lineTo(cxx-6,  base-th-2);
    x.stroke();
    x.lineWidth = 1;

    // chioma abbassata: il tronco resta corto e l'albero legge come albero
    foliageBlob(x, cxx-16, base-th+7, 20, col, season);
    foliageBlob(x, cxx+16, base-th+9, 19, col, season);
    foliageBlob(x, cxx,    base-th+12, 15, col, season);   // ciuffo basso sul tronco
    foliageBlob(x, cxx,    base-th-10, 24, col, season);
    foliageBlob(x, cxx-9,  base-th-1, 18, col, season);
    foliageBlob(x, cxx+10, base-th-5, 17, col, season);
    // frutti autunnali
    if(season==='autunno'){
      for(let i=0;i<7;i++){
        const bx=cxx-24+((hsh(i,0,171)*48)|0), byy=base-th-18+((hsh(i,1,172)*34)|0);
        px(x,bx,byy,3,3,'#d8452c');
        px(x,bx,byy,1,1,'#f08a6a');
      }
    }
  }
  objCache[key]=c;
  return c;
};

A.stump = function(){
  const key='stump';
  if(objCache[key]) return objCache[key];
  const c=cv(40,32), x=c.getContext('2d');
  ellip(x,20,26,13,5,'#4e3520');
  ellip(x,20,22,13,6,'#7a5636');
  ellip(x,20,21,11,5,'#a67c4e');
  ellip(x,20,21,7,3,'#8a6440');
  ellip(x,20,21,3,1.5,'#6b4a2e');
  objCache[key]=c; return c;
};

A.rock = function(kind, v){
  const key='rock|'+kind+'|'+v;
  if(objCache[key]) return objCache[key];
  const c=cv(40,40), x=c.getContext('2d');
  const P = {
    pietra:  ['#8a8580','#a8a29a','#6b6762'],
    rame:    ['#8a7568','#b08a6a','#6b5a50'],
    ferro:   ['#8a8a92','#a8a8b2','#67676e'],
    oro:     ['#9a8a68','#c0a55a','#6f6450'],
    ametista:['#7a6a8a','#9a86b2','#5a4e6b'],
    quarzo:  ['#8a8a8a','#b8b8c0','#68686b'],
    geode:   ['#7a7268','#9a9088','#5e584f']
  }[kind] || ['#8a8580','#a8a29a','#6b6762'];
  const base=P[0], light=P[1], dark=P[2];
  ellip(x,20,32,14,5,'rgba(0,0,0,0.22)');
  // corpo
  ellip(x,20,24,13,10,dark);
  ellip(x,20,22,12,9,base);
  ellip(x,16,19,7,5,light);
  // sfaccettature
  x.fillStyle=dark;
  x.beginPath(); x.moveTo(8,24); x.lineTo(16,14); x.lineTo(20,26); x.closePath(); x.fill();
  x.fillStyle=shade(base,0.08);
  x.beginPath(); x.moveTo(20,26); x.lineTo(24,13); x.lineTo(31,24); x.closePath(); x.fill();
  // vene di minerale
  if(kind!=='pietra'){
    const gem = {rame:'#e08a4a',ferro:'#d8dce8',oro:'#ffd24a',ametista:'#c98ae8',quarzo:'#eaf4ff',geode:'#8ac0d8'}[kind];
    for(let i=0;i<5;i++){
      const bx=10+((hsh(i,v,181)*20)|0), byy=16+((hsh(i,v,182)*12)|0);
      px(x,bx,byy,3,3,gem);
      px(x,bx,byy,1,1,shade(gem,0.4));
      x.globalAlpha=0.4; px(x,bx-1,byy-1,5,5,gem); x.globalAlpha=1;
    }
  }
  objCache[key]=c; return c;
};

A.bush = function(season, v, bacche){
  const key='bush|'+season+'|'+v+'|'+!!bacche;
  if(objCache[key]) return objCache[key];
  const c=cv(40,36), x=c.getContext('2d');
  const S=DATA.SEASONS.find(s=>s.id===season);
  ellip(x,20,32,12,4,'rgba(0,0,0,0.2)');
  foliageBlob(x,14,22,10,S.tree,season);
  foliageBlob(x,26,23,10,S.tree,season);
  foliageBlob(x,20,17,11,S.tree,season);
  if(bacche){
    for(let i=0;i<6;i++){
      const bx=10+((hsh(i,v,191)*20)|0), byy=12+((hsh(i,v,192)*16)|0);
      px(x,bx,byy,3,3,'#c8324a'); px(x,bx,byy,1,1,'#f07a88');
    }
  }
  objCache[key]=c; return c;
};

A.weed = function(season,v){
  const key='weed|'+season+'|'+v;
  if(objCache[key]) return objCache[key];
  const c=cv(32,32), x=c.getContext('2d');
  const S=DATA.SEASONS.find(s=>s.id===season);
  const col = season==='inverno' ? '#9aa8ae' : shade(S.grass,-0.12);
  const col2= shade(col,0.2);
  for(let i=0;i<7;i++){
    const bx=8+((hsh(i,v,201)*16)|0);
    const h=6+((hsh(i,v,202)*8)|0);
    const lean=(hsh(i,v,203)*4-2)|0;
    x.fillStyle = i%2?col:col2;
    for(let k=0;k<h;k++) x.fillRect(bx+((lean*k/h)|0), 26-k, 2, 1);
  }
  px(x,14,25,5,2,shade(col,-0.2));
  objCache[key]=c; return c;
};

A.forage = function(itemId, v){
  const key='for|'+itemId+'|'+v;
  if(objCache[key]) return objCache[key];
  const c=cv(32,32), x=c.getContext('2d');
  x.globalAlpha=0.2; ellip(x,16,27,7,3,'#000'); x.globalAlpha=1;
  drawForageArt(x,16,26,itemId);
  objCache[key]=c; return c;
};

function drawForageArt(x,cx,by,id){
  switch(id){
    case 'cipolla_selvatica':
      ellip(x,cx,by-4,5,5,'#e8e0d0'); ellip(x,cx-1,by-5,3,3,'#f8f4e8');
      px(x,cx-1,by-12,2,7,'#6fae3e'); px(x,cx-4,by-10,3,5,'#5f9c3c'); px(x,cx+2,by-11,3,6,'#7fbe4e');
      break;
    case 'dente_leone':
      px(x,cx-1,by-9,2,9,'#5f9c3c');
      circ(x,cx,by-11,5,'#ffe270'); circ(x,cx,by-11,3,'#f5c93c');
      for(let i=0;i<8;i++){const a=i/8*6.28; px(x,(cx+Math.cos(a)*6)|0,(by-11+Math.sin(a)*6)|0,2,2,'#ffd94f');}
      break;
    case 'viola':
      px(x,cx-1,by-8,2,8,'#4f8a32');
      for(let i=0;i<5;i++){const a=i/5*6.28-1.57; ellip(x,cx+Math.cos(a)*4,by-11+Math.sin(a)*4,3,2.6,'#8a5fc0');}
      circ(x,cx,by-11,2,'#ffe270');
      break;
    case 'mora':
      px(x,cx-1,by-7,2,7,'#5f7a3c');
      for(const p of [[-3,-9],[2,-11],[-1,-13],[3,-8]]) { circ(x,cx+p[0],by+p[1],2.6,'#3a2440'); px(x,cx+p[0]-1,by+p[1]-2,1,1,'#6a4a70'); }
      break;
    case 'erba_dolce':
      for(let i=0;i<5;i++){ const bx=cx-5+i*3; px(x,bx,by-4-i%2*3,2,8+i%2*3,'#8fc45a'); px(x,bx,by-12,2,3,'#ffe89a'); }
      break;
    case 'lavanda':
      for(let i=0;i<3;i++){ const bx=cx-3+i*3; px(x,bx,by-10,1,10,'#6f9c5a');
        for(let k=0;k<5;k++) px(x,bx-1,by-11-k*2,3,2, k%2?'#9a6fd0':'#8459bd'); }
      break;
    case 'fungo_porcino':
      px(x,cx-2,by-6,5,6,'#f0e2c8'); px(x,cx-2,by-6,2,6,'#fff8ea');
      ellip(x,cx,by-8,8,5,'#8a5230'); ellip(x,cx,by-9,7,4,'#a8683c'); ellip(x,cx-3,by-10,3,2,'#c08a56');
      break;
    case 'nocciola':
      for(const p of [[-3,-3],[3,-4],[0,-8]]){ ellip(x,cx+p[0],by+p[1],3.4,3,'#a8763c'); px(x,cx+p[0]-1,by+p[1]-2,2,1,'#c99a5e'); px(x,cx+p[0]-1,by+p[1]+1,3,1,'#7a5228'); }
      break;
    case 'melagrana':
      circ(x,cx,by-6,7,'#c0392b'); circ(x,cx-2,by-8,3,'#e05a45');
      px(x,cx-2,by-13,4,3,'#8a2a20'); px(x,cx-3,by-14,6,2,'#a03428');
      px(x,cx+3,by-4,2,2,'#8a2a20');
      break;
    case 'bacca_inverno':
      px(x,cx-1,by-8,2,8,'#5a6a5a');
      for(const p of [[-3,-9],[3,-10],[0,-13]]) { circ(x,cx+p[0],by+p[1],2.8,'#c8324a'); px(x,cx+p[0]-1,by+p[1]-2,1,1,'#f08a88'); }
      px(x,cx-6,by-7,5,2,'#4f7a52'); px(x,cx+2,by-6,5,2,'#4f7a52');
      break;
    case 'radice_gelata':
      ellip(x,cx,by-4,5,5,'#c8dae4'); ellip(x,cx-1,by-5,3,3,'#eaf4fa');
      px(x,cx-1,by-11,2,6,'#7f9c8a'); px(x,cx-4,by-9,3,4,'#8fac9a');
      break;
    case 'fiocco_cristallo':
      for(let i=0;i<6;i++){ const a=i/6*6.28;
        for(let k=2;k<8;k++) px(x,(cx+Math.cos(a)*k)|0,(by-8+Math.sin(a)*k)|0,2,2, k>5?'#bfe8f5':'#eafaff'); }
      circ(x,cx,by-8,3,'#ffffff');
      break;
    default:
      circ(x,cx,by-5,5,'#8fc45a');
  }
}
A.drawForageArt = drawForageArt;

/* ===================================================================
   5. EDIFICI
   =================================================================== */
function shingleRoof(x, x0,y0,w,h, col){
  const d=shade(col,-0.26), dd=shade(col,-0.42), l=shade(col,0.16), ll=shade(col,0.3);
  const RH = 4;                       // altezza di una fila di tegole
  const rows = Math.max(2, Math.round(h/RH));
  const topRatio = 0.46;              // larghezza in cima rispetto alla base
  for(let r=rows-1; r>=0; r--){
    const t  = r/(rows-1);            // 0 = base, 1 = colmo
    const rw = Math.round(w*(1-(1-topRatio)*t));
    const xx = Math.round(x0 + (w-rw)/2);
    const yy = y0 + Math.round(h - (r+1)*RH);
    const base = r%2 ? col : shade(col,-0.05);
    // fila di tegole
    px(x, xx, yy, rw, RH+1, base);
    px(x, xx, yy, rw, 1, l);                       // luce sul bordo alto
    px(x, xx, yy+RH, rw, 1, d);                    // ombra sotto
    // scanalature delle tegole, sfalsate
    const off = r%2 ? 4 : 0;
    for(let k=off; k<rw-1; k+=8) px(x, xx+k, yy+1, 1, RH-1, d);
    // punte arrotondate delle tegole
    for(let k=off; k<rw-3; k+=8) px(x, xx+k+3, yy+RH-1, 3, 1, shade(base,0.10));
  }
  // colmo
  const rwTop = Math.round(w*topRatio);
  const xTop = Math.round(x0+(w-rwTop)/2);
  px(x, xTop-2, y0-3, rwTop+4, 4, shade(col,0.08));
  px(x, xTop-2, y0-3, rwTop+4, 1, ll);
  px(x, xTop-2, y0+1, rwTop+4, 1, dd);
  // gronda sporgente sopra i muri
  px(x, x0-3, y0+h,   w+6, 3, shade(col,-0.18));
  px(x, x0-3, y0+h,   w+6, 1, l);
  px(x, x0-4, y0+h+3, w+8, 2, '#4a3220');
}

function window4(x, wx, wy, lit){
  px(x,wx-1,wy-1,14,14,'#5a3f28');
  px(x,wx,wy,12,12, lit? '#ffd98a' : '#8fb4c8');
  if(lit){
    px(x,wx,wy,12,4,'#ffe9b0');
    x.globalAlpha=0.35; px(x,wx-3,wy-3,18,18,'#ffcf6a'); x.globalAlpha=1;
  } else {
    px(x,wx,wy,12,5,'#a8ccdc'); px(x,wx+7,wy+6,4,5,'#b8d8e8');
  }
  px(x,wx+5,wy,2,12,'#5a3f28');
  px(x,wx,wy+5,12,2,'#5a3f28');
  px(x,wx-2,wy+11,16,2,'#6b4a2e');
}

A.building = function(kind, opt){
  opt = opt||{};
  const key='b|'+kind+'|'+(opt.lit?1:0)+'|'+(opt.season||'')+'|'+(opt.liv||0);
  if(objCache[key]) return objCache[key];
  let c;
  switch(kind){
    case 'casa':      c = bCasa(opt); break;
    case 'bottega':   c = bBottega(opt); break;
    case 'fucina':    c = bFucina(opt); break;
    case 'locanda':   c = bLocanda(opt); break;
    case 'cottage':   c = bCottage(opt); break;
    case 'santuario': c = bSantuario(opt); break;
    case 'pollaio':   c = bPollaio(opt); break;
    case 'serra':     c = bSerra(opt); break;
    case 'capanna':   c = bCapanna(opt); break;
    default:          c = bCasa(opt);
  }
  objCache[key]=c;
  return c;
};

function baseWalls(x, x0,y0,w,h, wall){
  const wd=shade(wall,-0.2), wl=shade(wall,0.12);
  px(x,x0,y0,w,h,wall);
  for(let r=0;r*8<h;r++){
    px(x,x0,y0+r*8,w,1,wd);
    px(x,x0,y0+r*8+1,w,1,wl);
  }
  px(x,x0,y0,2,h,wl); px(x,x0+w-2,y0,2,h,wd);
  px(x,x0,y0+h-3,w,3,shade(wall,-0.3));
}

function door(x, dx, dy, w, h, col, opt){
  const d=shade(col,-0.25), l=shade(col,0.14);
  px(x,dx-2,dy-2,w+4,2,'#4a3220');
  px(x,dx,dy,w,h,col);
  px(x,dx,dy,2,h,l); px(x,dx+w-2,dy,2,h,d);
  px(x,dx,dy,w,2,l);
  for(let k=4;k<w;k+=7) px(x,dx+k,dy+2,1,h-3,d);
  px(x,dx+w-6,dy+h/2,3,3,'#e8c25a');   // maniglia
  if(opt&&opt.arco){
    px(x,dx-1,dy-4,w+2,4,col);
    px(x,dx+2,dy-6,w-4,3,col);
  }
}

function sign(x, sx, sy, testo, col){
  px(x,sx+8,sy,3,10,'#6b4a2e');
  px(x,sx,sy-14,20,15,col||'#8a5a34');
  px(x,sx,sy-14,20,2,shade(col||'#8a5a34',0.2));
  px(x,sx+1,sy-13,18,13,shade(col||'#8a5a34',-0.12));
  px(x,sx+3,sy-10,14,2,'#e8d8b0');
  px(x,sx+3,sy-6,10,2,'#e8d8b0');
}

function bCasa(o){
  const W=192,H=168, c=cv(W,H), x=c.getContext('2d');
  const liv = o.liv||0;
  const wall='#d8c49a', roof= liv>0? '#7a4f8a' : '#b04a3c';
  // ombra
  x.globalAlpha=0.22; ellip(x,W/2,H-8,74,12,'#000'); x.globalAlpha=1;
  // base
  baseWalls(x, 26, 62, 140, 96, wall);
  // fondamenta pietra
  px(x,22,146,148,14,'#7d766c');
  for(let k=0;k<148;k+=14){ px(x,22+k,146,13,6,'#8d867c'); px(x,22+k+7,152,13,6,'#8d867c'); }
  // tetto
  shingleRoof(x, 8, 22, 176, 44, roof);
  px(x,8,62,176,5,shade(roof,-0.35));
  px(x,4,64,184,4,'#5a3f28');
  // comignolo
  px(x,132,4,22,34,'#8a6a58');
  px(x,132,4,22,4,'#a08272');
  for(let r=0;r<4;r++) px(x,132,10+r*7,22,1,'#6f5346');
  px(x,128,0,30,7,'#6f5346');
  // finestre & porta
  window4(x, 46, 86, o.lit);
  window4(x, 128, 86, o.lit);
  door(x, 82, 108, 30, 50, '#7a4f30', {arco:true});
  // dettagli
  px(x,78,104,38,4,'#5a3f28');           // architrave
  px(x,74,158,46,4,'#8d867c');           // gradino
  // fioriere
  for(const fx of [44,126]){
    px(x,fx-3,116,20,8,'#7a5636');
    px(x,fx-3,116,20,2,'#96704a');
    for(let i=0;i<4;i++){
      px(x,fx+i*4,110,3,7,'#5f9c3c');
      px(x,fx+i*4-1,108,4,3, i%2?'#e8687a':'#f0c04a');
    }
  }
  if(liv>0){ // ampliamento: veranda
    px(x,10,120,18,40,'#c9b48c');
    shingleRoof(x, 4, 108, 32, 16, roof);
  }
  return c;
}

function bBottega(o){
  const W=192,H=160, c=cv(W,H), x=c.getContext('2d');
  x.globalAlpha=0.22; ellip(x,W/2,H-8,72,11,'#000'); x.globalAlpha=1;
  baseWalls(x, 20, 56, 152, 96, '#e0d0a8');
  shingleRoof(x, 6, 18, 180, 40, '#3f7a6a');
  px(x,6,56,180,5,'#2a5548');
  // tendone a righe
  for(let k=0;k<9;k++){
    px(x, 24+k*17, 76, 17, 16, k%2? '#d84f4f':'#f2e8d0');
  }
  px(x,22,74,154,3,'#8a5a34');
  for(let k=0;k<9;k++) px(x, 24+k*17, 90, 17, 4, k%2? '#b03d3d':'#d8ceb4');
  // vetrina
  px(x,32,96,56,40,'#5a3f28');
  px(x,35,99,50,34, o.lit?'#ffdc94':'#a8ccdc');
  px(x,35,99,50,10, o.lit?'#ffe9b8':'#c0dcea');
  // barattoli in vetrina
  for(let i=0;i<4;i++){
    px(x,40+i*12,116,8,14,'#8a6a4a');
    px(x,40+i*12,113,8,4, ['#d8624a','#7fae4a','#e0b03c','#8a5fc0'][i]);
  }
  door(x, 110, 100, 34, 52, '#6b4a2e');
  px(x,106,96,42,5,'#4a3220');

  // insegna appesa a un braccio di ferro accanto alla porta
  px(x,152,96,4,3,'#4a4640');
  px(x,152,96,26,3,'#4a4640');
  px(x,176,96,3,7,'#4a4640');
  px(x,158,98,3,5,'#4a4640');
  px(x,160,102,22,20,'#7a4f30');
  px(x,160,102,22,2,'#96683f');
  px(x,161,103,20,18,'#8a5a34');
  // pittogramma: una mela e una spiga
  circ(x,168,110,4,'#c0392b'); px(x,167,105,2,3,'#5f8a3c');
  px(x,175,106,2,11,'#c9a44c');
  for(let k=0;k<4;k++){ px(x,173,107+k*3,2,2,'#e0bd76'); px(x,177,107+k*3,2,2,'#e0bd76'); }
  px(x,162,118,18,2,'#5f3f24');
  // cassette di verdura fuori
  for(let i=0;i<2;i++){
    const bx=152+i*0, by=132;
    px(x,bx,by,26,18,'#a8763c'); px(x,bx,by,26,3,'#c99a5e');
    for(let k=0;k<3;k++) circ(x,bx+6+k*7,by+2,4, ['#d8452c','#e8892c','#7fc45a'][k]);
  }
  return c;
}

function bFucina(o){
  const W=176,H=160, c=cv(W,H), x=c.getContext('2d');
  x.globalAlpha=0.22; ellip(x,W/2,H-8,66,11,'#000'); x.globalAlpha=1;
  // muri di pietra
  px(x,24,60,128,92,'#8a8078');
  for(let r=0;r<12;r++) for(let k=0;k<9;k++){
    const bx=24+k*14+(r%2?7:0), by=60+r*8;
    if(bx>144) continue;
    const col = hsh(k,r,211)>0.5?'#948a80':'#7f766e';
    px(x,bx,by,13,7,col); px(x,bx,by,13,1,shade(col,0.16));
  }
  px(x,24,148,128,6,'#5f5852');
  shingleRoof(x, 10, 24, 156, 38, '#5a5f6b');
  px(x,10,60,156,5,'#3a3f48');
  // forgia con fuoco
  px(x,36,96,44,52,'#5f5852');
  px(x,42,104,32,32,'#2a1a12');
  const fireC = o.lit? ['#ff9a3c','#ffd24a','#ff5a2c'] : ['#c05a2c','#e08a3c','#a03a1c'];
  ellip(x,58,128,14,9,fireC[2]);
  ellip(x,58,130,11,7,fireC[0]);
  ellip(x,58,132,7,5,fireC[1]);
  x.globalAlpha=0.3; ellip(x,58,126,20,16,'#ff9a3c'); x.globalAlpha=1;
  // canna fumaria
  px(x,44,24,26,74,'#6f6660'); px(x,44,24,26,4,'#8a8078');
  px(x,40,18,34,8,'#5f5852');
  // incudine
  px(x,96,124,28,10,'#4a4a52'); px(x,102,116,16,10,'#5a5a64');
  px(x,102,114,16,3,'#6f6f7a'); px(x,92,132,36,6,'#3a3a42');
  door(x, 108, 96, 32, 52, '#5a4030');
  // attrezzi appesi
  px(x,150,80,4,26,'#6b4a2e'); px(x,144,76,16,8,'#8a8a92');
  px(x,164,84,4,22,'#6b4a2e'); px(x,160,80,12,8,'#8a8a92');
  return c;
}

function bLocanda(o){
  const W=208,H=176, c=cv(W,H), x=c.getContext('2d');
  x.globalAlpha=0.22; ellip(x,W/2,H-8,80,12,'#000'); x.globalAlpha=1;
  // piano terra
  baseWalls(x, 20, 92, 168, 76, '#e8d4a8');
  // travi a vista
  for(let k=0;k<6;k++) px(x, 24+k*28, 92, 5, 76, '#7a5636');
  px(x,20,92,168,5,'#7a5636'); px(x,20,140,168,5,'#7a5636');
  // primo piano sporgente
  baseWalls(x, 12, 46, 184, 48, '#dcc79c');
  px(x,8,88,192,6,'#7a5636');
  for(let k=0;k<7;k++) px(x, 16+k*26, 46, 5, 48, '#7a5636');
  shingleRoof(x, 2, 8, 204, 40, '#8a4a3c');
  px(x,2,46,204,5,'#5f3228');
  // finestre piano alto
  window4(x, 40, 58, o.lit); window4(x, 96, 58, o.lit); window4(x, 152, 58, o.lit);
  // finestre a arco piano terra
  for(const wx of [40,140]){
    px(x,wx-2,104,32,30,'#5a3f28');
    px(x,wx+1,107,26,24, o.lit?'#ffd98a':'#8fb4c8');
    px(x,wx+1,107,26,8, o.lit?'#ffe9b0':'#a8ccdc');
    px(x,wx+12,107,3,24,'#5a3f28');
  }
  door(x, 88, 116, 34, 52, '#6b4230', {arco:true});
  px(x,84,112,42,5,'#4a3220');
  // insegna appesa
  px(x,150,20,4,26,'#5a3f28'); px(x,150,20,40,4,'#5a3f28');
  px(x,168,24,34,26,'#7a4f30');
  px(x,170,26,30,22,'#96683f');
  ellip(x,185,36,9,8,'#c9a05a'); px(x,181,32,4,4,'#3a2a1c'); px(x,188,32,4,4,'#3a2a1c');
  px(x,183,40,6,2,'#3a2a1c');
  // tavolini fuori
  for(let i=0;i<2;i++){
    const bx=16+i*164;
    ellip(x,bx,158,12,5,'#8a5a34'); px(x,bx-2,158,4,10,'#6b4a2e');
    px(x,bx-8,150,4,3,'#c9a05a');
  }
  return c;
}

function bCottage(o){
  const W=144,H=136, c=cv(W,H), x=c.getContext('2d');
  x.globalAlpha=0.22; ellip(x,W/2,H-6,54,9,'#000'); x.globalAlpha=1;
  baseWalls(x, 20, 56, 104, 72, o.wall||'#cbb68e');
  // tetto di paglia
  const straw='#c9a44c';
  for(let r=0;r<7;r++){
    const yy=20+r*6, inset=Math.round(r*3.4);
    px(x, 6+inset, yy, 132-inset*2, 7, r%2?straw:shade(straw,-0.08));
    for(let k=0;k<132-inset*2;k+=5) px(x, 6+inset+k+(r%2?2:0), yy+1, 2, 6, shade(straw,-0.22));
    px(x, 6+inset, yy, 132-inset*2, 1, shade(straw,0.2));
  }
  px(x,4,56,136,6,shade(straw,-0.3));
  window4(x, 34, 76, o.lit);
  window4(x, 96, 76, o.lit);
  door(x, 60, 92, 26, 36, '#6b4a2e', {arco:true});
  // erbe appese
  for(let i=0;i<4;i++){
    const bx=28+i*22;
    px(x,bx,58,2,10,'#7a5636');
    px(x,bx-3,66,8,10, ['#8a5fc0','#5f9c3c','#c9a05a','#8fc45a'][i]);
  }
  // vasi
  px(x,14,116,14,12,'#a8663c'); px(x,14,116,14,3,'#c98a5e');
  for(let i=0;i<3;i++){ px(x,17+i*4,108,2,9,'#5f9c3c'); px(x,16+i*4,105,4,4,'#8a5fc0'); }
  return c;
}

function bSantuario(o){
  const W=176,H=176, c=cv(W,H), x=c.getContext('2d');
  const acceso = o.liv||0;   // 0..4 braci accese
  x.globalAlpha=0.24; ellip(x,W/2,H-10,64,12,'#000'); x.globalAlpha=1;
  // basamento a gradini
  for(let i=0;i<3;i++){
    px(x, 24+i*8, 150-i*8, 128-i*16, 10, i%2?'#8d867c':'#7d766c');
    px(x, 24+i*8, 150-i*8, 128-i*16, 2, '#9d968c');
  }
  // colonne
  for(const cx0 of [36,124]){
    px(x,cx0,58,16,72,'#b0a898');
    px(x,cx0,58,4,72,'#c9c1b0');
    px(x,cx0+12,58,4,72,'#8e877a');
    px(x,cx0-4,54,24,8,'#c0b8a8');
    px(x,cx0-4,126,24,8,'#c0b8a8');
    for(let k=0;k<6;k++) px(x,cx0+2,64+k*11,12,1,'#9a9284');
  }
  // architrave + frontone
  px(x,24,42,128,14,'#c0b8a8');
  px(x,24,42,128,3,'#d8d0c0');
  x.fillStyle='#b0a898';
  x.beginPath(); x.moveTo(20,42); x.lineTo(88,10); x.lineTo(156,42); x.closePath(); x.fill();
  x.fillStyle='#c9c1b0';
  x.beginPath(); x.moveTo(24,40); x.lineTo(88,14); x.lineTo(152,40); x.closePath(); x.fill();
  // rilievo: sole
  circ(x,88,32,7,'#b8a068');
  for(let i=0;i<8;i++){ const a=i/8*6.28; px(x,(88+Math.cos(a)*11)|0,(32+Math.sin(a)*11)|0,3,3,'#b8a068'); }
  // edera
  for(let i=0;i<14;i++){
    const bx=28+((hsh(i,0,221)*120)|0), by=46+((hsh(i,1,222)*90)|0);
    x.globalAlpha=0.75; px(x,bx,by,4,3,'#5f8a4a'); px(x,bx+1,by-2,2,2,'#7fae5a'); x.globalAlpha=1;
  }
  // piedistallo lanterna
  px(x,76,110,24,32,'#8e877a'); px(x,76,110,24,3,'#a8a094');
  px(x,72,106,32,6,'#a8a094');
  // la lanterna
  const lc = acceso>=4 ? '#ffe9a8' : (acceso>0? '#e8c47a':'#5f5a52');
  px(x,80,84,16,24,'#6b5a44');
  px(x,82,86,12,20, acceso>0? lc : '#2f2a24');
  px(x,78,80,20,5,'#8a7458');
  px(x,84,74,4,7,'#8a7458');
  px(x,80,106,16,4,'#8a7458');
  if(acceso>0){
    const glow = 0.12+acceso*0.13;
    x.globalAlpha=glow; circ(x,88,96,34,'#ffd98a'); x.globalAlpha=glow*0.6; circ(x,88,96,52,'#ffcf6a'); x.globalAlpha=1;
  }
  // quattro nicchie per le braci
  const bc=['#8fd46a','#f7c744','#e08a3c','#9fd8ee'];
  for(let i=0;i<4;i++){
    const bx=40+i*24, by=134;
    px(x,bx,by,16,14,'#7d766c'); px(x,bx+2,by+2,12,10,'#3a3630');
    if(acceso>i){
      ellip(x,bx+8,by+8,5,5,bc[i]);
      x.globalAlpha=0.5; circ(x,bx+8,by+7,9,bc[i]); x.globalAlpha=1;
      px(x,bx+7,by+3,2,3,shade(bc[i],0.4));
    }
  }
  return c;
}

function bPollaio(o){
  const W=160,H=136, c=cv(W,H), x=c.getContext('2d');
  x.globalAlpha=0.22; ellip(x,W/2,H-6,60,10,'#000'); x.globalAlpha=1;
  baseWalls(x, 22, 60, 116, 68, '#d8bd8a');
  shingleRoof(x, 8, 24, 144, 36, '#b0563c');
  px(x,8,60,144,5,'#7a3628');
  // porticina gallinacea
  px(x,36,98,22,30,'#5a3f28'); px(x,39,101,16,27,'#2a1a12');
  px(x,32,128,30,4,'#8a6a48');
  // rampa
  px(x,30,128,34,4,'#a8763c');
  for(let k=0;k<5;k++) px(x,32+k*7,126,4,2,'#8a5a34');
  window4(x, 92, 78, o.lit);
  // banderuola
  px(x,78,8,2,18,'#5f5852');
  px(x,72,10,16,3,'#5f5852');
  x.fillStyle='#5f5852';
  x.beginPath(); x.moveTo(80,4); x.lineTo(94,10); x.lineTo(80,16); x.closePath(); x.fill();
  // paglia a terra
  for(let i=0;i<16;i++){
    const bx=20+((hsh(i,0,231)*120)|0);
    px(x,bx,128+((hsh(i,1,232)*4)|0),4,1,'#d8b96a');
  }
  return c;
}

function bSerra(o){
  const W=192,H=160, c=cv(W,H), x=c.getContext('2d');
  x.globalAlpha=0.22; ellip(x,W/2,H-8,72,11,'#000'); x.globalAlpha=1;
  // basamento
  px(x,16,132,160,24,'#8d867c');
  for(let k=0;k<160;k+=16){ px(x,16+k,132,15,11,'#9d968c'); px(x,16+k+8,143,15,11,'#9d968c'); }
  // vetri
  const glass='rgba(180,225,235,0.55)';
  x.fillStyle=glass; x.fillRect(20,52,152,82);
  // tetto a spiovente vetrato
  x.fillStyle='rgba(200,235,245,0.6)';
  x.beginPath(); x.moveTo(12,54); x.lineTo(96,14); x.lineTo(180,54); x.closePath(); x.fill();
  // telaio
  const frame='#4f7a52', frameL='#6f9a6a';
  px(x,16,50,160,6,frame); px(x,16,50,160,2,frameL);
  px(x,16,52,6,84,frame); px(x,170,52,6,84,frame);
  for(let k=1;k<6;k++) px(x,16+k*26,52,4,82,frame);
  for(let k=0;k<3;k++) px(x,20,60+k*24,152,3,frame);
  x.strokeStyle=frame; x.lineWidth=5;
  x.beginPath(); x.moveTo(12,54); x.lineTo(96,14); x.lineTo(180,54); x.stroke();
  x.lineWidth=3;
  for(let k=1;k<4;k++){ x.beginPath(); x.moveTo(96-k*21,14+k*10); x.lineTo(96-k*21,52); x.stroke();
                        x.beginPath(); x.moveTo(96+k*21,14+k*10); x.lineTo(96+k*21,52); x.stroke(); }
  px(x,92,6,8,12,frame);
  // piante dentro (silhouette)
  for(let i=0;i<7;i++){
    const bx=30+i*20;
    x.globalAlpha=0.55;
    px(x,bx,110,3,20,'#3f7a32');
    circ(x,bx+1,108,6,'#4f9440');
    circ(x,bx+1,104,3, ['#e8465c','#f5d24f','#8a4fb0'][i%3]);
    x.globalAlpha=1;
  }
  // riflesso
  x.globalAlpha=0.28; x.fillStyle='#ffffff';
  x.beginPath(); x.moveTo(40,52); x.lineTo(70,20); x.lineTo(84,20); x.lineTo(54,52); x.closePath(); x.fill();
  x.globalAlpha=1;
  door(x, 84, 96, 26, 38, '#4f7a52');
  return c;
}

function bCapanna(o){
  const W=112,H=104, c=cv(W,H), x=c.getContext('2d');
  x.globalAlpha=0.2; ellip(x,W/2,H-6,42,8,'#000'); x.globalAlpha=1;
  // tronchi
  for(let r=0;r<6;r++){
    const yy=44+r*10;
    px(x,16,yy,80,10,r%2?'#8a6038':'#7a5432');
    px(x,16,yy,80,2,'#a8763c');
    px(x,16,yy+8,80,2,'#5f4028');
    circ(x,20,yy+5,5,'#96704a'); circ(x,92,yy+5,5,'#96704a');
  }
  shingleRoof(x, 4, 14, 104, 32, '#5f6b52');
  px(x,4,44,104,5,'#3a4432');
  door(x, 46, 76, 22, 28, '#5a3f28');
  window4(x, 24, 60, o.lit);
  px(x,80,4,12,44,'#7f766c'); px(x,78,0,16,6,'#5f5852');
  return c;
}

/* ===================================================================
   6. OGGETTI POSABILI / MACCHINE
   =================================================================== */
A.placeable = function(kind, opt){
  opt=opt||{};
  const key='p|'+kind+'|'+(opt.attivo?1:0)+'|'+(opt.pronto?1:0);
  if(objCache[key]) return objCache[key];
  const c=cv(48,56), x=c.getContext('2d');
  x.globalAlpha=0.22; ellip(x,24,50,14,5,'#000'); x.globalAlpha=1;
  switch(kind){
    case 'cassa':
      px(x,8,26,32,22,'#96704a'); px(x,8,26,32,3,'#b58a5e');
      px(x,8,44,32,4,'#6b4a2e');
      px(x,8,22,32,8,'#a8763c'); px(x,8,22,32,2,'#c99a5e');
      px(x,6,30,4,16,'#c9a05a'); px(x,38,30,4,16,'#c9a05a');
      px(x,20,32,8,7,'#e8c25a'); px(x,23,34,2,4,'#4a3220');
      break;
    case 'barattoliera':
      px(x,10,28,28,20,'#8a6038'); px(x,10,28,28,3,'#a8763c');
      px(x,12,20,24,10,'#c0d8dc'); px(x,12,20,24,3,'#e0f0f4');
      px(x,14,10,20,12,'#b8d4d8');
      px(x,12,8,24,4,'#8a6038');
      if(opt.pronto){ px(x,16,12,16,8,'#e8892c'); x.globalAlpha=0.5; circ(x,24,16,14,'#ffd24a'); x.globalAlpha=1; }
      else if(opt.attivo) px(x,16,12,16,8,'#7fae4a');
      break;
    case 'botte':
      ellip(x,24,44,15,5,'#6b4a2e');
      px(x,10,18,28,28,'#96704a');
      px(x,10,18,28,2,'#b58a5e');
      for(let r=0;r<4;r++) px(x,9,22+r*7,30,3,'#8a8a92');
      ellip(x,24,18,14,5,'#a8763c'); ellip(x,24,17,11,3.5,'#7a5432');
      if(opt.pronto){ ellip(x,24,17,8,2.5,'#8a4fb0'); x.globalAlpha=0.45; circ(x,24,14,12,'#c98ae8'); x.globalAlpha=1; }
      else if(opt.attivo) ellip(x,24,17,8,2.5,'#5f3080');
      break;
    case 'forno':
      px(x,6,26,36,22,'#8a8078');
      for(let r=0;r<3;r++) for(let k=0;k<4;k++){
        const bx=6+k*9+(r%2?4:0), by=26+r*7;
        if(bx>36) continue;
        px(x,bx,by,8,6, hsh(k,r,241)>0.5?'#948a80':'#7f766e');
      }
      px(x,14,32,20,14,'#2a1a12');
      x.beginPath(); x.fillStyle='#2a1a12'; x.arc(24,34,10,Math.PI,0); x.fill();
      if(opt.attivo||opt.pronto){
        ellip(x,24,40,8,5,'#ff5a2c'); ellip(x,24,41,6,4,'#ff9a3c'); ellip(x,24,42,4,2.5,'#ffd24a');
        x.globalAlpha=0.35; circ(x,24,38,14,'#ff9a3c'); x.globalAlpha=1;
      }
      px(x,28,6,10,22,'#7f766c'); px(x,26,2,14,6,'#5f5852');
      break;
    case 'fornace':
      px(x,8,24,32,24,'#7f766e');
      for(let r=0;r<4;r++) px(x,8,24+r*6,32,1,'#5f5852');
      px(x,16,32,16,14,'#2a1a12');
      if(opt.attivo||opt.pronto){
        ellip(x,24,42,7,4,'#ff7a2c'); ellip(x,24,43,5,3,'#ffc24a');
        x.globalAlpha=0.4; circ(x,24,38,15,'#ff9a3c'); x.globalAlpha=1;
      }
      px(x,10,16,12,10,'#8a8078'); px(x,26,16,12,10,'#8a8078');
      px(x,8,14,32,4,'#6f6660');
      break;
    case 'arnia':
      px(x,10,44,28,4,'#6b4a2e');
      for(let r=0;r<4;r++){ px(x,11,20+r*6,26,6,r%2?'#d8b96a':'#c9a44c'); px(x,11,20+r*6,26,1,'#e8cf8a'); }
      px(x,9,16,30,5,'#a8763c'); px(x,9,16,30,2,'#c99a5e');
      px(x,20,40,8,4,'#4a3220');
      if(opt.pronto){
        for(let i=0;i<4;i++){ const bx=12+i*7; px(x,bx,10+((i%2)*4),3,2,'#f5c93c'); px(x,bx+1,10+((i%2)*4),1,2,'#3a2a1c'); }
      }
      break;
    case 'spaventapasseri':
      px(x,22,20,4,28,'#8a6038');
      px(x,10,26,28,3,'#8a6038');
      px(x,14,18,20,16,'#c9a05a');
      px(x,14,18,20,3,'#e0bd76');
      px(x,18,22,3,3,'#3a2a1c'); px(x,27,22,3,3,'#3a2a1c');
      px(x,20,28,8,2,'#3a2a1c');
      px(x,10,12,28,7,'#7a5636'); px(x,16,6,16,8,'#8a6038');
      px(x,14,34,20,12,'#5f7a9c'); px(x,14,34,20,2,'#7f9abc');
      for(let i=0;i<3;i++) px(x,12+i*8,46,3,5,'#c9a44c');
      break;
    case 'lanterna':
      px(x,21,30,6,18,'#5f5852'); px(x,17,46,14,3,'#4a4640');
      px(x,16,14,16,18,'#7a6a4a');
      px(x,18,16,12,14, opt.attivo!==false ? '#ffe9a8':'#3a3630');
      px(x,14,10,20,5,'#8a7458'); px(x,22,4,4,7,'#8a7458');
      if(opt.attivo!==false){ x.globalAlpha=0.3; circ(x,24,23,20,'#ffd98a'); x.globalAlpha=1; }
      break;
    case 'recinto':
      px(x,10,20,4,26,'#96704a'); px(x,34,20,4,26,'#96704a');
      px(x,10,20,4,2,'#b58a5e'); px(x,34,20,4,2,'#b58a5e');
      px(x,6,26,36,4,'#8a6038'); px(x,6,36,36,4,'#8a6038');
      px(x,6,26,36,1,'#a8763c'); px(x,6,36,36,1,'#a8763c');
      break;
    case 'cartello':
      px(x,22,30,4,18,'#6b4a2e');
      px(x,10,16,28,18,'#8a5a34'); px(x,10,16,28,2,'#a8763c');
      px(x,13,21,22,2,'#e8d8b0'); px(x,13,26,14,2,'#e8d8b0');
      break;
  }
  objCache[key]=c; return c;
};

/* ===================================================================
   7. ANIMALI E FAUNA
   =================================================================== */
A.gallina = function(frame, dir){
  const key='gal|'+frame+'|'+dir;
  if(objCache[key]) return objCache[key];
  const c=cv(32,32), x=c.getContext('2d');
  const bob = frame%2?0:1;
  x.globalAlpha=0.22; ellip(x,16,27,7,3,'#000'); x.globalAlpha=1;
  const f = dir<0?-1:1;
  // zampe
  px(x,13,24-bob,2,3,'#e0a03c'); px(x,18,24-bob,2,3,'#e0a03c');
  // corpo
  ellip(x,16,19-bob,9,7,'#f4f0e8');
  ellip(x,16,17-bob,8,5,'#ffffff');
  ellip(x,16+f*5,20-bob,4,3,'#e0dcd2');
  // coda
  px(x,16-f*9,14-bob,5,3,'#e8e4da'); px(x,16-f*10,12-bob,4,3,'#f4f0e8');
  // testa
  circ(x,16+f*6,11-bob,4.2,'#ffffff');
  px(x,16+f*8,11-bob,3,2,'#e0a03c');           // becco
  px(x,16+f*5,9-bob,2,2,'#2f2418');            // occhio
  px(x,16+f*4,6-bob,5,3,'#d8452c');            // cresta
  px(x,16+f*6,14-bob,3,2,'#d8452c');           // bargigli
  objCache[key]=c; return c;
};

A.gatto = function(frame){
  const key='gatto|'+frame;
  if(objCache[key]) return objCache[key];
  const c=cv(32,32), x=c.getContext('2d');
  const bob=frame%2;
  x.globalAlpha=0.2; ellip(x,16,27,7,3,'#000'); x.globalAlpha=1;
  ellip(x,15,20-bob,9,6,'#c9853c');
  ellip(x,15,18-bob,8,4,'#e0a05a');
  px(x,9,24-bob,3,3,'#c9853c'); px(x,18,24-bob,3,3,'#c9853c');
  // coda a punto interrogativo
  px(x,24,16-bob,3,7,'#c9853c'); px(x,24,12-bob,5,3,'#c9853c'); px(x,27,10-bob,3,3,'#c9853c');
  circ(x,10,14-bob,5,'#e0a05a');
  x.fillStyle='#c9853c';
  x.beginPath(); x.moveTo(6,11-bob); x.lineTo(8,4-bob); x.lineTo(11,11-bob); x.fill();
  x.beginPath(); x.moveTo(11,10-bob); x.lineTo(14,4-bob); x.lineTo(16,11-bob); x.fill();
  px(x,7,13-bob,2,2,'#2f2418'); px(x,12,13-bob,2,2,'#2f2418');
  px(x,9,16-bob,3,1,'#8a5230');
  for(let i=0;i<3;i++) px(x,4,14-bob+i*2,4,1,'#f0d8b0');
  objCache[key]=c; return c;
};

/* ===================================================================
   8. ICONE OGGETTI
   =================================================================== */
const iconCache = {};

A.icon = function(id){
  if(iconCache[id]) return iconCache[id];
  const c = cv(32,32), x = c.getContext('2d');
  x.imageSmoothingEnabled=false;
  drawIcon(x, id);
  iconCache[id]=c;
  return c;
};

function toolHead(x, kind, tx, ty){
  switch(kind){
    case 'zappa':
      px(x,tx,ty,3,12,'#9a6b3c'); px(x,tx,ty,1,12,'#b58a5e');
      px(x,tx-6,ty,7,4,'#a8a8b2'); px(x,tx-6,ty,7,1,'#d0d0da'); px(x,tx-6,ty+3,7,1,'#6f6f7a');
      break;
    case 'annaffiatoio':
      px(x,tx-6,ty+2,14,10,'#5f9ab8'); px(x,tx-6,ty+2,14,2,'#7fbad8');
      px(x,tx-6,ty+10,14,2,'#3f7a98');
      px(x,tx+7,ty,4,4,'#5f9ab8');
      px(x,tx-11,ty+3,6,3,'#5f9ab8'); px(x,tx-13,ty+2,3,5,'#7fbad8');
      px(x,tx-2,ty-2,6,3,'#4a86a5');
      break;
    case 'ascia':
      px(x,tx,ty,3,14,'#8a6038'); px(x,tx,ty,1,14,'#a8763c');
      px(x,tx-7,ty-1,8,7,'#b0b0ba'); px(x,tx-7,ty-1,8,2,'#e0e0ea');
      px(x,tx-8,ty,2,5,'#e8e8f2'); px(x,tx-7,ty+5,8,1,'#6f6f7a');
      px(x,tx+2,ty-1,3,7,'#8a8a92');
      break;
    case 'piccone':
      px(x,tx,ty,3,14,'#8a6038'); px(x,tx,ty,1,14,'#a8763c');
      x.fillStyle='#a8a8b2';
      x.beginPath(); x.moveTo(tx-9,ty+3); x.quadraticCurveTo(tx+1,ty-4,tx+11,ty+3);
      x.lineTo(tx+11,ty+5); x.quadraticCurveTo(tx+1,ty-1,tx-9,ty+5); x.fill();
      px(x,tx-10,ty+2,3,4,'#d0d0da'); px(x,tx+9,ty+2,3,4,'#d0d0da');
      break;
    case 'falce':
      px(x,tx,ty+2,3,12,'#8a6038');
      x.strokeStyle='#c0c0ca'; x.lineWidth=3;
      x.beginPath(); x.arc(tx-5,ty+2,8,-0.4,1.9); x.stroke();
      x.strokeStyle='#e8e8f2'; x.lineWidth=1;
      x.beginPath(); x.arc(tx-5,ty+2,9,-0.3,1.8); x.stroke();
      break;
    case 'canna':
      x.strokeStyle='#a8763c'; x.lineWidth=2;
      x.beginPath(); x.moveTo(tx-8,ty+14); x.quadraticCurveTo(tx,ty-2,tx+9,ty-6); x.stroke();
      x.strokeStyle='#e8e8f2'; x.lineWidth=1;
      x.beginPath(); x.moveTo(tx+9,ty-6); x.lineTo(tx+11,ty+8); x.stroke();
      px(x,tx+10,ty+8,3,3,'#d84f4f');
      px(x,tx-5,ty+9,4,4,'#6b4a2e');
      break;
  }
}

A.drawToolHeld = function(x, sx, sy, kind, face, using){
  x.save();
  x.translate(sx, sy);
  if(face<0) x.scale(-1,1);
  x.rotate(using ? -0.9 : -0.25);
  x.scale(0.62,0.62);
  toolHead(x, kind, 2, 0);
  x.restore();
};

function drawIcon(x, id){
  /* --- id composti: conserva:xxx, vino:xxx, succo:xxx --- */
  if(id.indexOf(':')>0){
    const [k, src] = id.split(':');
    const C = DATA.CROPS[src] || {c1:'#8fc45a', c2:'#5f9c3c', forma:'sfera', foglia:'#5f9c3c'};
    if(k==='conserva'){
      px(x,8,10,16,18,'#c0d8dc'); px(x,8,10,16,3,'#e0f0f4'); px(x,8,25,16,3,'#9ab8bc');
      px(x,10,13,12,13,C.c1); px(x,10,13,12,3,shade(C.c1,0.3));
      px(x,7,6,18,5,'#a8763c'); px(x,7,6,18,2,'#c99a5e');
      px(x,9,20,4,4,shade(C.c2,-0.1));
      x.globalAlpha=0.35; px(x,11,14,3,10,'#ffffff'); x.globalAlpha=1;
    } else if(k==='vino'){
      px(x,12,4,8,8,'#3f7a52');
      px(x,10,11,12,18,'#2f5a3c'); px(x,10,11,12,3,'#4f7a5c');
      px(x,12,16,8,10,C.c1);
      px(x,11,18,10,7,'#f0e2c0'); px(x,12,19,3,5,C.c2);
      x.globalAlpha=0.4; px(x,12,12,2,14,'#ffffff'); x.globalAlpha=1;
    } else {
      px(x,11,8,10,20,'#d8e8ec'); px(x,11,8,10,2,'#f0f8fa');
      px(x,11,14,10,14,C.c1);
      px(x,9,5,14,4,'#a8a8b2');
      px(x,14,2,3,5,'#c0c0ca');
      x.globalAlpha=0.4; px(x,13,15,2,11,'#ffffff'); x.globalAlpha=1;
    }
    return;
  }

  const IT = DATA.ITEMS[id];
  if(!IT){ px(x,10,10,12,12,'#c05a44'); return; }

  /* attrezzi */
  if(IT.cat==='attrezzo'){ toolHead(x, IT.icona||id, 16, 8); return; }

  /* semi */
  if(IT.cat==='seme'){
    const C = DATA.CROPS[IT.seme];
    px(x,6,12,20,16,'#c9a44c'); px(x,6,12,20,3,'#dcb968');
    px(x,6,25,20,3,'#a8853c');
    px(x,8,8,16,6,'#b08a3c');
    px(x,10,6,12,4,'#c9a44c');
    // cordino
    px(x,9,13,14,2,'#8a6038');
    // semini che escono
    for(let i=0;i<3;i++){
      const bx=11+i*4, by=3+((i%2)*2);
      ellip(x,bx,by,2,2.6,C? C.c1:'#8fc45a');
      px(x,bx-1,by-1,1,1,'#ffffff');
    }
    px(x,12,18,8,6,'#8a6038');
    px(x,13,19,2,2,C?C.c1:'#8fc45a'); px(x,17,20,2,2,C?C.c2:'#5f9c3c');
    return;
  }

  /* raccolti */
  if(IT.cat==='raccolto'){
    const C = DATA.CROPS[IT.crop];
    x.save(); x.translate(0,2); A.drawFruit(x, 16, 28, C, 18, 0, true); x.restore();
    return;
  }

  /* foraggio */
  if(IT.cat==='foraggio'){ drawForageArt(x, 16, 28, id); return; }

  /* pesci */
  if(IT.cat==='pesce'){ drawFishIcon(x, id); return; }

  /* il resto */
  switch(id){
    case 'legna':
      for(let i=0;i<3;i++){
        const bx=5+i*3, by=8+i*6;
        px(x,bx,by,22-i*2,6,'#8a6038'); px(x,bx,by,22-i*2,2,'#a8763c');
        ellip(x,bx+1,by+3,2,3,'#c99a5e'); ellip(x,bx+1,by+3,1,1.5,'#8a6038');
      }
      break;
    case 'pietra':
      ellip(x,16,20,11,8,'#6b6762'); ellip(x,16,18,10,7,'#8a8580');
      ellip(x,12,15,5,4,'#a8a29a');
      x.fillStyle='#6b6762'; x.beginPath(); x.moveTo(6,20); x.lineTo(13,9); x.lineTo(16,22); x.fill();
      break;
    case 'fibra':
      for(let i=0;i<6;i++){
        const bx=6+i*4;
        x.fillStyle=i%2?'#8fa85a':'#7a9448';
        for(let k=0;k<12;k++) x.fillRect(bx+((Math.sin(k*0.5+i)*2)|0), 24-k, 2, 1);
      }
      px(x,10,22,12,3,'#c9a44c');
      break;
    case 'argilla':
      ellip(x,16,20,10,7,'#a8764c'); ellip(x,16,18,9,6,'#c08a5e');
      ellip(x,12,15,4,3,'#d8a878');
      px(x,20,20,3,3,'#8a5a34');
      break;
    case 'carbone':
      ellip(x,14,20,7,6,'#2a2622'); ellip(x,21,18,5,5,'#3a3632');
      ellip(x,12,17,3,2,'#4a4640'); ellip(x,20,16,2,1.5,'#5a564f');
      x.globalAlpha=0.3; px(x,13,15,2,2,'#8a6038'); x.globalAlpha=1;
      break;
    case 'linfa':
      px(x,10,10,12,18,'#7a5636'); px(x,10,10,12,3,'#96704a');
      px(x,12,14,8,12,'#c9852c'); px(x,12,14,8,3,'#e0a54c');
      px(x,9,8,14,3,'#8a6038');
      break;
    case 'uovo': case 'uovo_oro': {
      const col = id==='uovo_oro' ? '#f0c84a' : '#f8f0e0';
      ellip(x,16,19,8,10,shade(col,-0.12));
      ellip(x,16,18,7,9,col);
      ellip(x,13,14,3,3.5,shade(col,0.3));
      if(id==='uovo_oro'){ x.globalAlpha=0.4; circ(x,16,18,13,'#ffe9a8'); x.globalAlpha=1;
        px(x,22,10,2,2,'#fff8d0'); px(x,9,24,2,2,'#fff8d0'); }
      break;
    }
    case 'miele':
      px(x,9,12,14,16,'#e0a54c'); px(x,9,12,14,3,'#f5c96a');
      px(x,9,25,14,3,'#c9852c');
      px(x,8,8,16,5,'#a8763c'); px(x,8,8,16,2,'#c99a5e');
      x.globalAlpha=0.4; px(x,12,15,3,10,'#ffe9a8'); x.globalAlpha=1;
      px(x,14,17,5,5,'#c9852c');
      break;
    case 'latte':
      px(x,11,8,10,20,'#e8e4dc'); px(x,11,8,10,3,'#f8f6f0');
      px(x,11,25,10,3,'#c8c4bc');
      px(x,13,4,6,5,'#d8d4cc');
      px(x,12,14,8,7,'#5f9ab8'); px(x,13,16,2,3,'#ffffff');
      break;
    case 'rame': case 'ferro': case 'oro': case 'quarzo': case 'ametista': case 'gemma_luna': case 'geode': {
      const P={rame:['#b08a6a','#e08a4a'],ferro:['#8a8a92','#d8dce8'],oro:['#9a8a68','#ffd24a'],
               quarzo:['#a8a8b2','#eaf4ff'],ametista:['#7a6a8a','#c98ae8'],
               gemma_luna:['#6a7a9a','#bfd8ff'],geode:['#7a7268','#8ac0d8']}[id];
      ellip(x,16,21,10,8,shade(P[0],-0.2)); ellip(x,16,19,9,7,P[0]);
      ellip(x,12,16,4,3,shade(P[0],0.2));
      for(let i=0;i<4;i++){
        const bx=9+((hsh(i,0,251)*14)|0), by=13+((hsh(i,1,252)*10)|0);
        px(x,bx,by,3,3,P[1]); px(x,bx,by,1,1,shade(P[1],0.4));
      }
      if(id==='gemma_luna'){ x.globalAlpha=0.4; circ(x,16,19,14,'#bfd8ff'); x.globalAlpha=1; }
      break;
    }
    case 'lingotto_rame': case 'lingotto_ferro': case 'lingotto_oro': {
      const P={lingotto_rame:['#d8894a','#f0b070','#a8602c'],
               lingotto_ferro:['#b0b4c0','#dce0ea','#7a7e88'],
               lingotto_oro:['#f0c84a','#ffe89a','#c09020']}[id];
      x.fillStyle=P[2];
      x.beginPath(); x.moveTo(5,24); x.lineTo(9,14); x.lineTo(23,14); x.lineTo(27,24); x.closePath(); x.fill();
      x.fillStyle=P[0];
      x.beginPath(); x.moveTo(6,23); x.lineTo(10,15); x.lineTo(22,15); x.lineTo(26,23); x.closePath(); x.fill();
      px(x,10,14,12,2,P[1]);
      x.globalAlpha=0.5; px(x,12,17,3,5,P[1]); x.globalAlpha=1;
      break;
    }
    case 'concime':
      px(x,8,14,16,14,'#6b4a2e'); px(x,8,14,16,3,'#8a6038');
      px(x,8,25,16,3,'#4a3220');
      for(let i=0;i<6;i++){ const bx=9+((hsh(i,0,261)*14)|0), by=16+((hsh(i,1,262)*8)|0);
        px(x,bx,by,2,2, hsh(i,2,263)>0.5?'#8a6a3c':'#5f4028'); }
      px(x,11,10,10,5,'#8a6038');
      px(x,13,6,3,5,'#5f9c3c'); px(x,12,4,5,3,'#7fbe4e');
      break;
    case 'concime_acqua':
      px(x,8,14,16,14,'#4f6b7a'); px(x,8,14,16,3,'#6f8b9a');
      for(let i=0;i<5;i++){ const bx=10+((hsh(i,0,271)*12)|0), by=17+((hsh(i,1,272)*7)|0);
        px(x,bx,by,2,2,'#8fb8d0'); }
      px(x,11,10,10,5,'#5f7b8a');
      px(x,14,4,4,6,'#7fbad8'); px(x,13,7,6,4,'#9fd0e8');
      break;
    case 'sentiero': {
      const cc=['#b5a894','#a89b86','#c2b6a2'];
      for(let i=0;i<5;i++){
        const bx=5+((hsh(i,0,281)*20)|0), by=10+((hsh(i,1,282)*14)|0);
        const col=cc[i%3];
        px(x,bx,by,7,6,col); px(x,bx,by,7,1,shade(col,0.2)); px(x,bx,by+5,7,1,shade(col,-0.25));
      }
      break;
    }
    case 'recinto': case 'spaventapasseri': case 'lanterna': case 'cassa':
    case 'barattoliera': case 'botte': case 'forno': case 'fornace': case 'arnia':
    case 'vaso_lucciole': {
      const src = A.placeable(id==='vaso_lucciole'?'lanterna':id, {attivo:true, pronto:false});
      x.drawImage(src, 2, 8, 28, 28*56/48);
      if(id==='vaso_lucciole'){
        x.globalAlpha=0.6;
        for(let i=0;i<4;i++) px(x, 12+((hsh(i,0,291)*10)|0), 14+((hsh(i,1,292)*10)|0), 2,2, '#d8f078');
        x.globalAlpha=1;
      }
      break;
    }
    case 'gallina': { const g=A.gallina(0,1); x.drawImage(g,0,0,32,32); break; }
    /* cibi */
    case 'zuppa_contadina':
      ellip(x,16,22,12,7,'#c8c4bc'); ellip(x,16,20,11,6,'#e8e4dc');
      ellip(x,16,19,9,5,'#c9852c'); ellip(x,13,18,3,2,'#e0a54c');
      px(x,10,16,3,2,'#e8892c'); px(x,19,17,3,2,'#7fae4a');
      x.globalAlpha=0.4; px(x,13,8,2,5,'#ffffff'); px(x,18,6,2,6,'#ffffff'); x.globalAlpha=1;
      break;
    case 'frittata':
      ellip(x,16,20,12,8,'#f0d88a'); ellip(x,16,19,11,7,'#f8e8a8');
      ellip(x,14,18,4,3,'#f5c93c'); ellip(x,20,21,3,2,'#e8892c');
      px(x,11,22,3,2,'#d8452c'); px(x,20,16,3,2,'#7fae4a');
      break;
    case 'insalata_orto':
      ellip(x,16,22,12,7,'#d8d4cc'); ellip(x,16,20,11,6,'#f0ece4');
      ellip(x,13,18,5,4,'#5f9c3c'); ellip(x,19,18,5,4,'#7fbe4e'); ellip(x,16,16,4,3,'#8fc45a');
      px(x,12,16,3,3,'#d8452c'); px(x,20,20,3,3,'#e8892c');
      break;
    case 'torta_zucca':
      x.fillStyle='#c9a44c'; x.beginPath(); x.moveTo(4,24); x.lineTo(8,12); x.lineTo(24,12); x.lineTo(28,24); x.closePath(); x.fill();
      px(x,8,12,16,4,'#e8892c'); px(x,8,12,16,1,'#f5a84c');
      px(x,4,23,24,3,'#a8853c');
      ellip(x,16,11,3,2,'#f8f0e0');
      px(x,14,8,4,3,'#7fae4a');
      break;
    case 'crostata':
      ellip(x,16,20,12,8,'#c9a44c'); ellip(x,16,19,10,6,'#e0bd76');
      for(let i=0;i<4;i++) px(x,8+i*5,14,3,12,'#c9a44c');
      for(const p of [[12,17],[19,20],[16,15],[21,16]]) circ(x,p[0],p[1],2.2,'#c8324a');
      circ(x,14,21,2,'#4a63b8');
      break;
    case 'polenta':
      ellip(x,16,22,12,7,'#c8c4bc'); ellip(x,16,20,11,6,'#e8e4dc');
      ellip(x,16,19,9,5,'#f0c84a'); ellip(x,13,18,3,2,'#f8dc7a');
      px(x,14,15,5,3,'#e8892c');
      break;
    case 'pesce_arrosto':
      ellip(x,16,20,12,6,'#c8c4bc');
      ellip(x,15,19,9,5,'#b08a6a'); ellip(x,15,18,8,4,'#d0a880');
      x.fillStyle='#b08a6a'; x.beginPath(); x.moveTo(24,19); x.lineTo(29,15); x.lineTo(29,23); x.fill();
      px(x,9,17,2,2,'#3a2a1c');
      px(x,13,14,6,2,'#8a5fc0');
      break;
    case 'pane_miele':
      x.fillStyle='#c9a44c'; x.beginPath(); x.ellipse(16,20,12,7,0,0,6.3); x.fill();
      x.fillStyle='#dcb968'; x.beginPath(); x.ellipse(16,19,11,6,0,0,6.3); x.fill();
      px(x,8,16,16,4,'#e0a54c');
      x.globalAlpha=0.6; px(x,10,15,12,2,'#f5c96a'); x.globalAlpha=1;
      for(let i=0;i<3;i++) px(x,11+i*4,13,2,3,'#e0a54c');
      break;
    case 'tisana':
      px(x,10,14,14,14,'#e8e4dc'); px(x,10,14,14,3,'#f8f6f0');
      px(x,12,17,10,9,'#8a6a3c'); px(x,12,17,10,2,'#a88a5c');
      px(x,23,17,4,7,'#e8e4dc'); px(x,24,18,2,5,'#c8c4bc');
      x.globalAlpha=0.4; px(x,13,8,2,5,'#ffffff'); px(x,18,6,2,6,'#ffffff'); x.globalAlpha=1;
      px(x,14,15,3,2,'#8a5fc0');
      break;
    /* braci e speciali */
    case 'brace_primavera': case 'brace_estate': case 'brace_autunno': case 'brace_inverno': {
      const col={brace_primavera:'#8fd46a',brace_estate:'#f7c744',brace_autunno:'#e08a3c',brace_inverno:'#9fd8ee'}[id];
      x.globalAlpha=0.3; circ(x,16,18,14,col); x.globalAlpha=0.55; circ(x,16,18,10,col); x.globalAlpha=1;
      ellip(x,16,19,6,7,shade(col,0.25));
      ellip(x,16,20,4,5,'#ffffff');
      px(x,15,10,2,4,shade(col,0.3));
      for(let i=0;i<4;i++){ const a=i*1.6; px(x,(16+Math.cos(a)*12)|0,(18+Math.sin(a)*12)|0,2,2,shade(col,0.4)); }
      break;
    }
    case 'medaglione':
      px(x,15,4,2,8,'#c9a05a');
      circ(x,16,19,9,'#c09020'); circ(x,16,19,7.5,'#f0c84a');
      circ(x,16,19,4,'#c09020');
      x.globalAlpha=0.5; px(x,12,13,3,4,'#ffe89a'); x.globalAlpha=1;
      break;
    default:
      ellip(x,16,20,9,8,'#8a6038'); ellip(x,16,18,8,7,'#a8763c');
  }
}

function drawFishIcon(x, id){
  const P = {
    trota:['#7a8a5a','#a8b878','#e8a04a'], carpa:['#b08a4a','#d8b070','#8a6038'],
    persico:['#6a8a4a','#9ab86a','#e0c04a'], luccio:['#5a7a4a','#8aa86a','#c9a44c'],
    anguilla:['#3a4a3a','#5a6a52','#8a9a7a'], storione:['#5a6a7a','#8a9aaa','#c0c8d0'],
    temolo:['#7a8a9a','#a8b8c8','#d8c0e0'], pesce_sole:['#c9a44c','#f0d878','#e08a4a'],
    pesce_luna:['#8a9ad8','#c0d0f8','#f0f4ff'], gambero:['#c05a3c','#e08a6a','#8a3a24'],
    scarpa_vecchia:['#5a4a3a','#7a6a5a','#3a2e24'], alga:['#4a7a4a','#6a9a5a','#3a5a3a'],
    lattina:['#8a8a92','#b0b0ba','#c05a44']
  }[id] || ['#7a8a9a','#a8b8c8','#d0d8e0'];

  if(id==='scarpa_vecchia'){
    x.fillStyle=P[0]; x.beginPath(); x.moveTo(4,24); x.lineTo(6,14); x.lineTo(16,14); x.lineTo(20,18); x.lineTo(28,20); x.lineTo(28,24); x.closePath(); x.fill();
    px(x,4,23,24,3,P[2]); px(x,8,15,8,2,P[1]);
    px(x,10,17,3,2,'#3a2e24');
    return;
  }
  if(id==='alga'){
    for(let i=0;i<3;i++){
      const bx=10+i*5;
      x.fillStyle=i%2?P[0]:P[1];
      for(let k=0;k<16;k++) x.fillRect(bx+((Math.sin(k*0.4+i*2)*3)|0),26-k,3,1);
    }
    return;
  }
  if(id==='lattina'){
    px(x,11,10,10,16,P[0]); px(x,11,10,10,3,P[1]); px(x,11,23,10,3,'#6f6f7a');
    px(x,12,15,8,5,P[2]);
    x.globalAlpha=0.4; px(x,13,12,2,11,'#ffffff'); x.globalAlpha=1;
    return;
  }
  if(id==='gambero'){
    ellip(x,17,19,8,5,P[0]); ellip(x,17,18,7,4,P[1]);
    for(let i=0;i<4;i++) px(x,12+i*4,15,2,8,P[2]);
    px(x,25,16,5,3,P[0]); px(x,25,20,5,3,P[0]);   // chele
    px(x,28,14,3,4,P[1]); px(x,28,20,3,4,P[1]);
    px(x,8,16,4,3,P[0]); px(x,8,20,4,3,P[0]);
    px(x,23,17,2,2,'#2f2418');
    for(let i=0;i<3;i++){ px(x,10-i,13-i,2,1,P[2]); }
    return;
  }
  // pesce generico
  ellip(x,15,19,10,6,P[0]);
  ellip(x,15,18,9,5,P[1]);
  ellip(x,12,16,4,2.5,shade(P[1],0.25));
  // coda
  x.fillStyle=P[0];
  x.beginPath(); x.moveTo(24,19); x.lineTo(30,13); x.lineTo(30,25); x.closePath(); x.fill();
  x.fillStyle=P[1];
  x.beginPath(); x.moveTo(25,19); x.lineTo(29,15); x.lineTo(29,23); x.closePath(); x.fill();
  // pinne
  x.fillStyle=P[2];
  x.beginPath(); x.moveTo(13,14); x.lineTo(18,8); x.lineTo(20,14); x.closePath(); x.fill();
  x.beginPath(); x.moveTo(14,24); x.lineTo(18,28); x.lineTo(20,24); x.closePath(); x.fill();
  // occhio + branchia
  px(x,8,17,3,3,'#ffffff'); px(x,9,18,2,2,'#2f2418');
  x.globalAlpha=0.5; px(x,13,15,1,8,P[2]); x.globalAlpha=1;
  // macchie
  for(let i=0;i<3;i++) px(x,14+i*3,17+((i%2)*3),2,2,P[2]);
  if(id==='pesce_luna'){ x.globalAlpha=0.35; circ(x,16,19,15,'#c0d0f8'); x.globalAlpha=1; }
}

/* ===================================================================
   9. ICONE UI (stagioni, meteo)
   =================================================================== */
A.uiIcon = function(kind){
  const key='ui|'+kind;
  if(iconCache[key]) return iconCache[key];
  const c=cv(24,24), x=c.getContext('2d');
  switch(kind){
    case 'primavera':
      px(x,11,12,2,10,'#5f9c3c');
      for(let i=0;i<5;i++){const a=i/5*6.28-1.57; ellip(x,12+Math.cos(a)*5,10+Math.sin(a)*5,3.4,3,'#f5a6c0');}
      circ(x,12,10,2.4,'#ffe270');
      break;
    case 'estate':
      circ(x,12,12,6,'#f7d154'); circ(x,12,12,4.5,'#ffe89a');
      for(let i=0;i<8;i++){const a=i/8*6.28; px(x,(12+Math.cos(a)*9)|0,(12+Math.sin(a)*9)|0,3,3,'#f5c93c');}
      break;
    case 'autunno':
      x.fillStyle='#d9713c';
      x.beginPath(); x.moveTo(12,4); x.lineTo(19,12); x.lineTo(16,12); x.lineTo(20,19); x.lineTo(12,15); x.lineTo(4,19); x.lineTo(8,12); x.lineTo(5,12); x.closePath(); x.fill();
      px(x,11,15,2,6,'#8a5230');
      x.globalAlpha=0.4; px(x,10,8,2,7,'#f0a56a'); x.globalAlpha=1;
      break;
    case 'inverno':
      for(let i=0;i<6;i++){ const a=i/6*6.28;
        for(let k=2;k<9;k++) px(x,(12+Math.cos(a)*k)|0,(12+Math.sin(a)*k)|0,2,2,'#bfe8f5');
        px(x,(12+Math.cos(a)*6+Math.cos(a+1.2)*3)|0,(12+Math.sin(a)*6+Math.sin(a+1.2)*3)|0,2,2,'#eafaff');
      }
      circ(x,12,12,2.4,'#ffffff');
      break;
    case 'sole':
      circ(x,12,12,6,'#f7d154'); circ(x,11,11,4,'#ffe89a');
      for(let i=0;i<8;i++){const a=i/8*6.28; px(x,(12+Math.cos(a)*9)|0,(12+Math.sin(a)*9)|0,2,2,'#f5c93c');}
      break;
    case 'nuvola':
      circ(x,9,13,5,'#e8eef2'); circ(x,15,13,6,'#e8eef2'); circ(x,12,10,5,'#f4f8fa');
      px(x,5,13,15,5,'#e8eef2'); px(x,5,17,15,2,'#c8d2da');
      break;
    case 'pioggia':
      circ(x,9,9,5,'#b8c4cc'); circ(x,15,9,5.5,'#b8c4cc'); px(x,5,9,15,5,'#b8c4cc');
      px(x,5,13,15,2,'#98a4ac');
      for(let i=0;i<4;i++) px(x,6+i*4,17+((i%2)*2),2,4,'#6fa8c7');
      break;
    case 'temporale':
      circ(x,9,8,5,'#8a94a0'); circ(x,15,8,5.5,'#8a94a0'); px(x,5,8,15,5,'#8a94a0');
      x.fillStyle='#ffd24a';
      x.beginPath(); x.moveTo(13,12); x.lineTo(9,18); x.lineTo(12,18); x.lineTo(10,23); x.lineTo(16,16); x.lineTo(13,16); x.closePath(); x.fill();
      break;
    case 'neve':
      circ(x,9,9,5,'#dce4ea'); circ(x,15,9,5.5,'#dce4ea'); px(x,5,9,15,5,'#dce4ea');
      for(let i=0;i<4;i++) px(x,6+i*4,17+((i%2)*2),2,2,'#ffffff');
      break;
    case 'vento':
      for(let i=0;i<3;i++){
        const yy=7+i*5, w=12+i*2;
        px(x,3,yy,w,2,'#c8d8e0');
        x.strokeStyle='#c8d8e0'; x.lineWidth=2;
        x.beginPath(); x.arc(3+w,yy+1,3,-1.6,1.2); x.stroke();
      }
      break;
  }
  iconCache[key]=c; return c;
};

/* ===================================================================
   10. EFFETTI E DECORAZIONI
   =================================================================== */
A.cloudSprite = function(v){
  const key='cloud|'+v;
  if(objCache[key]) return objCache[key];
  const W=160,H=80, c=cv(W,H), x=c.getContext('2d');
  const blobs=6+((hsh(v,0,301)*4)|0);
  for(let i=0;i<blobs;i++){
    const bx=24+((hsh(i,v,302)*(W-48))|0);
    const by=30+((hsh(i,v,303)*24)|0);
    const r=14+((hsh(i,v,304)*16)|0);
    circ(x,bx,by,r,'#ffffff');
  }
  // base piatta
  x.fillStyle='#ffffff'; x.fillRect(20,44,W-40,16);
  // ombreggiatura
  x.globalCompositeOperation='source-atop';
  const g=x.createLinearGradient(0,20,0,64);
  g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(1,'rgba(190,205,220,1)');
  x.fillStyle=g; x.fillRect(0,0,W,H);
  x.globalCompositeOperation='source-over';
  objCache[key]=c; return c;
};

/* segnalino "pronto" sopra le macchine */
A.bolla = function(itemId){
  const key='bolla|'+itemId;
  if(objCache[key]) return objCache[key];
  const c=cv(40,40), x=c.getContext('2d');
  ellip(x,20,16,15,13,'rgba(0,0,0,0.18)');
  ellip(x,20,15,15,13,'#f6e6c8');
  ellip(x,20,14,13,11,'#fff8e4');
  x.fillStyle='#f6e6c8';
  x.beginPath(); x.moveTo(16,26); x.lineTo(20,34); x.lineTo(24,26); x.closePath(); x.fill();
  const ic = A.icon(itemId);
  x.drawImage(ic, 6, 2, 28, 28);
  objCache[key]=c; return c;
};

/* punto esclamativo / cuore sopra NPC */
A.emote = function(kind){
  const key='em|'+kind;
  if(objCache[key]) return objCache[key];
  const c=cv(32,32), x=c.getContext('2d');
  ellip(x,16,15,13,11,'rgba(0,0,0,0.18)');
  ellip(x,16,14,13,11,'#fff8e4');
  x.fillStyle='#fff8e4';
  x.beginPath(); x.moveTo(12,23); x.lineTo(16,30); x.lineTo(20,23); x.closePath(); x.fill();
  if(kind==='!'){ px(x,14,7,4,10,'#d8452c'); px(x,14,19,4,3,'#d8452c'); }
  else if(kind==='?'){ px(x,12,7,8,3,'#5f7ab8'); px(x,17,9,3,4,'#5f7ab8'); px(x,14,12,4,3,'#5f7ab8'); px(x,14,19,4,3,'#5f7ab8'); }
  else if(kind==='cuore'){
    x.fillStyle='#e04a63';
    x.beginPath();
    x.moveTo(16,21); x.bezierCurveTo(8,15,9,7,16,11); x.bezierCurveTo(23,7,24,15,16,21);
    x.fill();
    px(x,12,11,2,2,'#ff9aae');
  }
  else if(kind==='zzz'){
    x.fillStyle='#5f7ab8'; x.font='bold 13px sans-serif'; x.fillText('z',9,18); x.font='bold 10px sans-serif'; x.fillText('z',18,13);
  }
  objCache[key]=c; return c;
};

/* ===================================================================
   11. RACCORDI FRA TERRENI (autotile)
   Ogni terreno "sborda" su quelli di priorità inferiore con un bordo
   irregolare, così non si vedono più i quadrati.
   =================================================================== */
A.PRIORITA = {
  acqua:0, grotta:1, sabbia:2, lastre:3, assi:3, sentiero:4,
  terra:5, erba:6, neve:6, roccia:7, vuoto:-1
};

/* maschera del bordo: bianco dove il terreno vicino deve comparire */
function maskLato(dir, v){
  const c = cv(T,T), x = c.getContext('2d');
  x.fillStyle='#fff';
  const prof = (i)=>{
    // profondità morbida e irregolare, 5..13 px
    const n = Math.sin(i*0.55 + v*2.1)*0.5 + Math.sin(i*0.23 + v*3.7)*0.5;
    return 5 + Math.round((n*0.5+0.5)*8);
  };
  for(let i=0;i<T;i++){
    const p = prof(i);
    if(dir==='n')      x.fillRect(i, 0, 1, p);
    else if(dir==='s') x.fillRect(i, T-p, 1, p);
    else if(dir==='w') x.fillRect(0, i, p, 1);
    else if(dir==='e') x.fillRect(T-p, i, p, 1);
    // sfumatura a puntini oltre il bordo
    for(let k=0;k<3;k++){
      if(hsh(i,k+v*7,801) > 0.62) continue;
      const q = p + 1 + k*2;
      if(q>=T) break;
      if(dir==='n')      x.fillRect(i, q, 1, 1);
      else if(dir==='s') x.fillRect(i, T-1-q, 1, 1);
      else if(dir==='w') x.fillRect(q, i, 1, 1);
      else if(dir==='e') x.fillRect(T-1-q, i, 1, 1);
    }
  }
  return c;
}

function maskAngolo(dir, v){
  const c = cv(T,T), x = c.getContext('2d');
  x.fillStyle='#fff';
  const cx = (dir==='nw'||dir==='sw') ? 0 : T;
  const cy = (dir==='nw'||dir==='ne') ? 0 : T;
  for(let y=0;y<T;y++) for(let x0=0;x0<T;x0++){
    const d = Math.hypot(x0-cx, y-cy);
    const r = 9 + Math.sin((x0+y)*0.4 + v*2.3)*3;
    if(d < r) x.fillRect(x0,y,1,1);
    else if(d < r+3 && hsh(x0,y+v,802) > 0.55) x.fillRect(x0,y,1,1);
  }
  return c;
}

const bordoCache = {};
/* texture del terreno "tipo" ritagliata sulla maschera del lato "dir" */
A.bordo = function(tipo, dir, v, season){
  const key = tipo+'|'+dir+'|'+v+'|'+(tipo==='erba'?season:'-');
  if(bordoCache[key]) return bordoCache[key];
  const c = cv(T,T), x = c.getContext('2d');
  x.imageSmoothingEnabled=false;
  x.drawImage(A.ground(tipo, v, season), 0, 0);
  x.globalCompositeOperation='destination-in';
  x.drawImage(dir.length===1 ? maskLato(dir,v) : maskAngolo(dir,v), 0, 0);
  x.globalCompositeOperation='source-over';
  bordoCache[key]=c;
  return c;
};

/* piccola ombra interna lungo il bordo: dà spessore al dislivello */
const ombraBordoCache = {};
A.ombraBordo = function(dir, v){
  const key='ob|'+dir+'|'+v;
  if(ombraBordoCache[key]) return ombraBordoCache[key];
  const c = cv(T,T), x = c.getContext('2d');
  x.fillStyle='rgba(0,0,0,0.16)';
  x.drawImage(dir.length===1 ? maskLato(dir,v) : maskAngolo(dir,v), 0, 0);
  x.globalCompositeOperation='source-in';
  x.fillStyle='rgba(30,22,14,0.20)';
  x.fillRect(0,0,T,T);
  ombraBordoCache[key]=c;
  return c;
};

/* ===================================================================
   11b. AIUOLE ARATE CON BORDI
   Il terreno arato non deve leggersi come una griglia di quadrati:
   dove non confina con altra terra arata, il bordo si smussa e prende
   un piccolo argine di terra smossa.
   =================================================================== */
const aratoCache = {};
/* vic = bitmask dei vicini arati: 1=N 2=E 4=S 8=O */
A.arato = function(vic, v, bagnato, season){
  const key = 'ar|'+vic+'|'+v+'|'+(bagnato?1:0);
  if(aratoCache[key]) return aratoCache[key];
  const c = cv(T,T), x = c.getContext('2d');
  x.imageSmoothingEnabled=false;

  // 1. maschera della forma
  const mk = cv(T,T), mx = mk.getContext('2d');
  mx.fillStyle='#fff';
  const er = (i, lato)=>{
    // quanto rientra il bordo su questo lato: 0 se c'è un vicino
    if(vic & lato) return 0;
    return 2 + Math.round((Math.sin(i*0.7 + v*2.3)*0.5+0.5)*2);
  };
  for(let y=0;y<T;y++){
    const dw = er(y, 8), de = er(y, 2);
    for(let x0=0;x0<T;x0++){
      const dn = er(x0, 1), ds = er(x0, 4);
      if(x0 < dw || x0 >= T-de) continue;
      if(y < dn || y >= T-ds) continue;
      mx.fillRect(x0,y,1,1);
    }
  }

  // 2. texture arata ritagliata sulla maschera
  x.drawImage(tilledTile(v, bagnato), 0, 0);
  x.globalCompositeOperation='destination-in';
  x.drawImage(mk, 0, 0);
  x.globalCompositeOperation='source-over';

  // 3. argine: zolle chiare sul bordo esterno
  const argine = bagnato ? '#8a6449' : '#b8946c';
  const argineS= bagnato ? '#3f2b1e' : '#6b4a33';
  for(let i=0;i<T;i++){
    if(!(vic&1)){ const d=er(i,1); if(d){ px(x,i,d,1,1,argine); px(x,i,d+1,1,1,argineS); } }
    if(!(vic&4)){ const d=er(i,4); if(d){ px(x,i,T-1-d,1,1,argineS); px(x,i,T-2-d,1,1,argine); } }
    if(!(vic&8)){ const d=er(i,8); if(d){ px(x,d,i,1,1,argine); px(x,d+1,i,1,1,argineS); } }
    if(!(vic&2)){ const d=er(i,2); if(d){ px(x,T-1-d,i,1,1,argineS); px(x,T-2-d,i,1,1,argine); } }
  }
  aratoCache[key]=c;
  return c;
};

/* ===================================================================
   12. ERBA ANIMATA
   Ciuffi disegnati sopra il terreno, che si piegano col vento e
   quando ci cammini in mezzo.
   =================================================================== */
const ciuffoCache = {};
A.ciuffo = function(season, v, piega){
  const key = 'ci|'+season+'|'+v+'|'+piega;
  if(ciuffoCache[key]) return ciuffoCache[key];
  const S = DATA.SEASONS.find(s=>s.id===season) || DATA.SEASONS[0];
  const c = cv(20,20), x = c.getContext('2d');
  const base = season==='inverno' ? '#b8c8d0' : S.grass;
  const cols = [shade(base,0.26), shade(base,0.10), shade(base,-0.12)];
  const n = 3 + (v%3);
  for(let i=0;i<n;i++){
    const bx = 6 + i*3 + ((hsh(i,v,811)*3)|0);
    const h  = 5 + ((hsh(i,v,812)*6)|0);
    const col = cols[i%3];
    x.fillStyle = col;
    for(let k=0;k<h;k++){
      const t = k/h;
      // la piega cresce verso la punta
      const dx = piega * t * t * 1.15;
      x.fillRect(Math.round(bx+dx), 16-k, 1, 1);
      if(k>h-3) x.fillRect(Math.round(bx+dx)+(piega>0?-1:1), 16-k, 1, 1);
    }
    // punta più chiara
    x.fillStyle = shade(col,0.3);
    x.fillRect(Math.round(bx + piega*1.15), 16-h, 1, 1);
  }
  // fiorellino ogni tanto
  if(season!=='inverno' && (v%4)===0){
    const fx = 8 + Math.round(piega*0.8);
    x.fillStyle = S.accent;
    x.fillRect(fx, 7, 2, 2);
    x.fillStyle = '#fff4d8';
    x.fillRect(fx, 6, 1, 1);
  }
  ciuffoCache[key]=c;
  return c;
};

/* ===================================================================
   13. INCRESPATURE E RIFLESSI D'ACQUA
   =================================================================== */
A.schiuma = function(dir, v, frame){
  const key='sc|'+dir+'|'+v+'|'+frame;
  if(objCache[key]) return objCache[key];
  const c = cv(T,T), x = c.getContext('2d');
  const off = frame*1.4;
  for(let i=0;i<T;i++){
    const h = 2 + Math.round((Math.sin(i*0.5 + v*2 + frame*0.7)*0.5+0.5)*3);
    x.globalAlpha = 0.55;
    x.fillStyle = '#eaf6fb';
    if(dir==='n') x.fillRect(i, 0, 1, h);
    else if(dir==='s') x.fillRect(i, T-h, 1, h);
    else if(dir==='w') x.fillRect(0, i, h, 1);
    else if(dir==='e') x.fillRect(T-h, i, h, 1);
    x.globalAlpha = 0.28;
    if(dir==='n') x.fillRect(i, h, 1, 2);
    else if(dir==='s') x.fillRect(i, T-h-2, 1, 2);
    else if(dir==='w') x.fillRect(h, i, 2, 1);
    else if(dir==='e') x.fillRect(T-h-2, i, 2, 1);
  }
  x.globalAlpha=1;
  objCache[key]=c;
  return c;
};

})();
