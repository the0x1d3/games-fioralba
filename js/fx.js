/* ===================================================================
   FIORALBA — fx.js
   Effetti trasversali: vento globale, ombre proiettate, sfocatura,
   bloom e gradazione colore. Tutto su canvas 2D, niente dipendenze.
   =================================================================== */
(function(){
'use strict';

const F = {};
window.FX = F;

/* Quanto è più fitto il mondo di quando la casella era 32. Serve nei
   pochi punti di questo file che hanno una misura in pixel scritta a
   mano: lo spessore del contorno dei personaggi e la fase spaziale del
   vento. Tutto il resto qui dentro lavora su misure che gli arrivano da
   fuori, e quelle sono già raddoppiate all'origine. */
const K = 2;

/* ===================================================================
   1. VENTO GLOBALE
   Un solo valore condiviso: erba, chiome, colture, panni e particelle
   si piegano insieme. Le raffiche danno il ritmo.
   =================================================================== */
const raffiche = [];
let ventoVal = 0, ventoT = 0;

F.aggiornaVento = function(dt, forza){
  ventoT += dt;
  // raffiche casuali
  if(Math.random() < dt*0.00035*(forza||1)){
    raffiche.push({ t:0, dur:1400+Math.random()*2200, amp:(0.5+Math.random()*0.9)*(forza||1) });
  }
  let g = 0;
  for(let i=raffiche.length-1;i>=0;i--){
    const r = raffiche[i];
    r.t += dt;
    if(r.t > r.dur){ raffiche.splice(i,1); continue; }
    const p = r.t/r.dur;
    g += Math.sin(p*Math.PI) * r.amp * (0.7+0.3*Math.sin(r.t*0.012));
  }
  // brezza di fondo
  const brezza = Math.sin(ventoT*0.00042)*0.42 + Math.sin(ventoT*0.00019+1.7)*0.28;
  ventoVal = (brezza + g) * (forza===undefined?1:forza);
};

/* forza del vento in questo istante, con sfasamento spaziale:
   le folate attraversano la mappa invece di muovere tutto insieme.

   `x, y` sono pixel di MONDO, e i due coefficienti sono divisi per `K`
   perché il mondo ha raddoppiato: lasciandoli com'erano, la stessa
   folata avrebbe attraversato metà delle caselle di prima — cioè
   raffiche larghe la metà, che è una cosa che si vede sul prato. */
F.vento = function(x, y){
  if(x===undefined) return ventoVal;
  const fase = ((x||0)*0.013 + (y||0)*0.007) / K;
  return ventoVal * (0.72 + 0.28*Math.sin(ventoT*0.0016 - fase));
};

/* ===================================================================
   2. OMBRE PROIETTATE
   Dalla silhouette di uno sprite ricavo un'ombra inclinata e
   schiacciata, che cambia con l'ora del giorno.
   =================================================================== */
const ombreCache = new WeakMap();

/* silhouette nera dello sprite, generata una volta sola */
function silhouette(src){
  let s = ombreCache.get(src);
  if(s) return s;
  const c = document.createElement('canvas');
  c.width = src.width; c.height = src.height;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  x.drawImage(src,0,0);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = '#000';
  x.fillRect(0,0,c.width,c.height);
  ombreCache.set(src, c);
  return c;
}
F.silhouette = silhouette;

/* inclinazione e lunghezza dell'ombra secondo l'ora (360..1560) */
F.soleOmbra = function(ora, esterno){
  if(!esterno) return { sk:-0.5, sc:0.42, a:0.20 };
  if(ora < 400 || ora > 1180) return { sk:0, sc:0.30, a:0.10 };   // notte: ombra minima
  /* Il sole attraversa il cielo da destra (mattino) a sinistra (sera):
     è dove FX.raggi mette i fasci di luce. L'ombra però cade dalla parte
     OPPOSTA al sole, non verso di lui — e qui stava l'errore: l'angolo
     del sole veniva usato tale e quale come inclinazione dell'ombra,
     così al mattino l'ombra puntava a destra, verso il sole. */
  const p = Math.max(0, Math.min(1, (ora-400)/(1180-400)));
  const sk = p*2.5 - 1.25;
  // più lunga all'alba e al tramonto
  const lung = 0.34 + Math.pow(Math.abs(p-0.5)*2, 2)*0.55;
  const a = 0.30 - Math.pow(Math.abs(p-0.5)*2, 2)*0.12;
  return { sk, sc:lung, a };
};

/* disegna l'ombra di uno sprite ancorato in basso a (bx, by) */
F.ombraSprite = function(ctx, src, bx, by, sole, w, h, sway){
  if(!src || !src.width) return;
  const sil = silhouette(src);
  const sw = w || src.width, sh = h || src.height;
  ctx.save();
  ctx.globalAlpha = sole.a;
  ctx.translate(bx, by);
  ctx.transform(1, 0, sole.sk + (sway||0)*0.06, -sole.sc, 0, 0);
  ctx.drawImage(sil, -sw/2, 0, sw, sh);
  ctx.restore();
  ctx.globalAlpha = 1;
};

/* ombra morbida a terra (per personaggi e bestiole) */
F.ombraTerra = function(ctx, cx, cy, rx, ry, a){
  ctx.globalAlpha = a===undefined?0.26:a;
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 6.283); ctx.fill();
  ctx.globalAlpha = 1;
};

/* ===================================================================
   3. CONTORNO SCURO
   Un bordo sottile stacca i personaggi dallo sfondo.
   =================================================================== */
const contornoCache = new WeakMap();
F.contorno = function(src, col){
  let c = contornoCache.get(src);
  if(c) return c;
  c = document.createElement('canvas');
  /* Il bordo è spesso `K` pixel di mondo e non uno: gli sprite sono
     cotti a densità doppia, e un contorno da un pixel su uno sprite
     grande il doppio si legge come metà del contorno di prima — sparisce
     proprio dove serve, cioè sul fondo chiaro. Cresce tutto insieme:
     la tela di `K` per lato, e gli otto scostamenti moltiplicati. */
  c.width = src.width+2*K; c.height = src.height+2*K;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled=false;
  const sil = silhouette(src);
  for(const d of [[0,1],[1,0],[2,1],[1,2],[0,0],[2,0],[0,2],[2,2]]) x.drawImage(sil, d[0]*K, d[1]*K);
  x.globalCompositeOperation='source-in';
  x.fillStyle = col||'rgba(24,16,10,0.55)';
  x.fillRect(0,0,c.width,c.height);
  contornoCache.set(src, c);
  return c;
};

/* ===================================================================
   4. SFOCATURA E BLOOM
   Il bloom si costruisce da una mappa di sorgenti luminose: si
   rimpicciolisce, si sfoca per passaggi e si riadditiva sulla scena.
   =================================================================== */
let bl1=null, bl2=null, blW=0, blH=0;

function assicuraBuffer(w,h){
  /* Un quarto della scena diviso `K`. Il diviso K è arrivato con la
     casella da 64: la scena ha il doppio dei pixel per lato, quindi a
     parità di formula il buffer sarebbe quadruplicato — quattro volte
     il costo — e la sfocatura, che è di uno-due-tre pixel di BUFFER,
     avrebbe coperto metà dello schermo di prima. Così invece il buffer
     resta della misura di sempre, e l'alone pure. */
  const dw = Math.max(1, (w/(4*K))|0), dh = Math.max(1, (h/(4*K))|0);
  if(bl1 && blW===dw && blH===dh) return;
  blW=dw; blH=dh;
  bl1 = document.createElement('canvas'); bl1.width=dw; bl1.height=dh;
  bl2 = document.createElement('canvas'); bl2.width=dw; bl2.height=dh;
}

/* apre il buffer bloom: restituisce il contesto su cui disegnare i bagliori */
F.iniziaBloom = function(w,h){
  assicuraBuffer(w,h);
  const x = bl1.getContext('2d');
  x.setTransform(1,0,0,1,0,0);
  x.clearRect(0,0,blW,blH);
  x.scale(blW/w, blH/h);
  return x;
};

/* chiude il bloom e lo somma alla scena */
F.applicaBloom = function(ctx, w, h, intensita){
  if(!bl1) return;
  const x2 = bl2.getContext('2d');
  const x1 = bl1.getContext('2d');
  x1.setTransform(1,0,0,1,0,0);
  // tre passaggi di sfocatura a scatola, sfruttando lo scaling bilineare
  for(let p=0;p<3;p++){
    x2.setTransform(1,0,0,1,0,0);
    x2.clearRect(0,0,blW,blH);
    x2.globalAlpha = 1;
    x2.imageSmoothingEnabled = true;
    const o = 1+p;
    x2.globalAlpha = 0.25;
    x2.drawImage(bl1, -o, 0, blW, blH);
    x2.drawImage(bl1,  o, 0, blW, blH);
    x2.drawImage(bl1, 0, -o, blW, blH);
    x2.drawImage(bl1, 0,  o, blW, blH);
    x2.globalAlpha = 1;
    x1.clearRect(0,0,blW,blH);
    x1.drawImage(bl2,0,0);
  }
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = intensita===undefined?0.75:intensita;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(bl1, 0, 0, w, h);
  ctx.restore();
  ctx.imageSmoothingEnabled = false;
};

/* ===================================================================
   5. GRADAZIONE COLORE
   Una tinta per fascia oraria, applicata in "overlay" + un
   leggero recupero di contrasto.
   =================================================================== */
F.gradazione = function(ctx, w, h, ora, meteo, esterno){
  if(!esterno){
    ctx.save();
    ctx.globalCompositeOperation='overlay';
    ctx.fillStyle='rgba(70,60,110,0.16)';
    ctx.fillRect(0,0,w,h);
    ctx.restore();
    return;
  }
  /* Di notte la tinta va MOLTIPLICATA: in "overlay" un blu chiaro
     schiarisce la scena e viene fuori una nebbia lattiginosa.
     Di giorno invece l'overlay caldo funziona bene. */
  const notte = (ora>=1150 || ora<350);
  ctx.save();
  if(notte){
    ctx.globalCompositeOperation='multiply';
    ctx.fillStyle='rgba(122,142,205,0.55)';
    ctx.fillRect(0,0,w,h);
  } else {
    let tinta, forza;
    if(ora>=1010 && ora<1150){            // tramonto
      const p = 1-Math.abs(ora-1080)/70;
      tinta='rgba(255,138,52,'; forza=0.24*p;
    } else if(ora>=350 && ora<470){       // alba
      const p = 1-Math.abs(ora-410)/60;
      tinta='rgba(255,168,120,'; forza=0.18*p;
    } else {                              // pieno giorno
      tinta='rgba(255,240,190,'; forza=0.07;
    }
    if(meteo==='pioggia'||meteo==='temporale'){ tinta='rgba(90,140,180,'; forza=0.18; }
    if(meteo==='neve'){ tinta='rgba(180,210,240,'; forza=0.14; }
    ctx.globalCompositeOperation='overlay';
    ctx.fillStyle = tinta+forza+')';
    ctx.fillRect(0,0,w,h);
  }
  ctx.restore();
};

/* ===================================================================
   6. SOLE E RAGGI

   Il vecchio effetto inchiodava i raggi ai due angoli dello schermo:
   l'ora cambiava colore al mondo, ma la sorgente restava sempre ferma.
   Qui il disco segue un piccolo arco nelle finestre di alba e tramonto;
   anche l'origine dei raggi lo segue, con un tremolio appena percettibile
   che non rompe la griglia della pixel art.
   =================================================================== */
F.raggi = function(ctx, w, h, ora, meteo, tempo){
  if(meteo!=='sereno') return;
  let a=0;
  if(ora>=400 && ora<560) a = (1-Math.abs(ora-480)/80)*0.13;
  else if(ora>=1000 && ora<1140) a = (1-Math.abs(ora-1070)/70)*0.16;
  if(a<=0.004) return;
  const mattino = ora<700;
  const p = mattino ? (ora-400)/160 : (ora-1000)/140;
  const viaggio = Math.max(0, Math.min(1, p));
  const respiro = Math.round(Math.sin((tempo||0)*0.0008 + (mattino?0:2.4))*K);
  const ox = mattino
    ? w*(0.90-0.19*viaggio)
    : w*(0.10+0.19*viaggio);
  const oy = -4*K + (mattino ? viaggio : 1-viaggio)*h*0.13 + respiro;
  /* Piccolo e caldo: il sole vive sopra un mondo dall'alto, non deve
     sembrare un quadrato bianco appoggiato sul prato. */
  const r = 4;
  ctx.save();
  ctx.globalCompositeOperation='lighter';
  /* Prima l'alone, largo e molto trasparente: dà aria alla luce senza
     disegnare un cerchio morbido estraneo al resto della scena. */
  const alone = ctx.createRadialGradient(ox,oy,0,ox,oy,r*3.2);
  alone.addColorStop(0, `rgba(255,236,164,${a*1.15})`);
  alone.addColorStop(0.45, `rgba(255,190,92,${a*0.32})`);
  alone.addColorStop(1, 'rgba(255,208,122,0)');
  ctx.fillStyle = alone;
  ctx.fillRect(ox-r*3.2, oy-r*3.2, r*6.4, r*6.4);
  /* Il nucleo resta costruito a scalini, non come una pallina vettoriale
     liscia; il renderer lo ingrandisce poi con nearest-neighbour. */
  ctx.globalAlpha = Math.min(1, 0.52+a*1.1);
  ctx.fillStyle = '#ffd86b';
  ctx.fillRect(Math.round(ox-r+K), Math.round(oy-r), r*2-2*K, r*2);
  ctx.fillRect(Math.round(ox-r), Math.round(oy-r+K), r*2, r*2-2*K);
  ctx.fillStyle = '#fff2bd';
  ctx.fillRect(Math.round(ox-K), Math.round(oy-K), K*2, K*2);
  ctx.globalAlpha = 1;
  /* Le misure in frazione di schermo (w*0.55) si adattano da sole; la
     larghezza dei fasci e la loro distanza no, sono pixel, e con la
     scena raddoppiata cinque fasci da 26 sarebbero diventati cinque
     fili in mezzo al prato. */
  for(let i=0;i<5;i++){
    const g = ctx.createLinearGradient(ox, oy, ox+(mattino?-1:1)*w*0.55, h);
    g.addColorStop(0, `rgba(255,232,170,${a*(1-i*0.13)})`);
    g.addColorStop(1, 'rgba(255,220,150,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    const sx0 = ox + (i-2)*34*K;
    ctx.moveTo(sx0, oy-8*K);
    ctx.lineTo(sx0+26*K, oy-8*K);
    ctx.lineTo(sx0+26*K+(mattino?-1:1)*w*0.5, h+20*K);
    ctx.lineTo(sx0+(mattino?-1:1)*w*0.5 - 40*K, h+20*K);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
};

/* ===================================================================
   7. RIFLESSI SULL'ACQUA
   Una copia capovolta e increspata dello sprite. Il chiamante ritaglia
   sull'acqua: qui si pensa solo a specchiare e ondeggiare.

   Questo codice era già scritto ma non lo invocava nessuno, quindi era
   stato tolto come codice morto. Ora è collegato davvero (render.js).
   =================================================================== */
F.riflesso = function(ctx, src, bx, by, w, h, t, alpha){
  if(!src || !src.width) return;
  ctx.save();
  ctx.globalAlpha = alpha===undefined?0.22:alpha;
  const sw = w||src.width, sh = h||src.height;
  // a fette orizzontali, ognuna sfalsata: dà l'increspatura
  const fette = 8;
  for(let i=0;i<fette;i++){
    // l'increspatura è in pixel di mondo: raddoppia con tutto il resto
    const off = Math.sin(t*0.003 + i*0.9)*(1.2+i*0.22)*K;
    ctx.drawImage(src,
      0, src.height-(src.height/fette)*(i+1), src.width, src.height/fette,
      bx-sw/2+off, by+(sh/fette)*i*0.55, sw, (sh/fette)*0.58);
  }
  ctx.restore();
  ctx.globalAlpha=1;
};

})();
