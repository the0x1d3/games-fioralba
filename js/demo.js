/* ===================================================================
   FIORALBA — demo.js
   Piccole animazioni che mostrano come si fanno le cose.

   Sono l'idea dei "microvideo" senza i video: ogni scena è disegnata a
   runtime con le stesse funzioni di ART che disegnano il gioco vero.
   Pesano zero byte, non vanno mai fuori sincrono con l'interfaccia
   (usano gli sprite veri) e si possono tradurre come un testo qualsiasi.
   =================================================================== */
(function(){
'use strict';

const D = {};
window.DEMO = D;

const T = 32;
const W = 168, H = 100;          // dimensione logica della scenetta

/* aspetto di riserva se la partita non è ancora cominciata */
const LOOK_BASE = { pelle:'#e8bd8f', capelli:'#6b4423', maglia:'#4f8ab0',
                    pant:'#3d5470', cappello:'#c9a44c' };
function look(){ return (window.G && G.look) || LOOK_BASE; }

/* ------------------------------------------------------------------
   ATTREZZI DI DISEGNO
   ------------------------------------------------------------------ */
function prato(x, tipo, stagione){
  tipo = tipo || 'erba';
  for(let ty=0; ty<Math.ceil(H/T); ty++)
    for(let tx=0; tx<Math.ceil(W/T); tx++)
      x.drawImage(ART.ground(tipo, (tx*3+ty)%4, stagione||'primavera'), tx*T, ty*T);
}

/* tastino: si illumina quando il tasto è "premuto" */
function tasto(x, cx, cy, testo, premuto){
  const w = 8 + testo.length*5, h = 12;
  const bx = cx - w/2, by = cy - h/2;
  x.fillStyle = premuto ? '#f2c14e' : 'rgba(28,20,13,0.85)';
  x.fillRect(bx, by, w, h);
  x.fillStyle = premuto ? '#fff3c8' : 'rgba(242,193,78,0.55)';
  x.fillRect(bx, by, w, 1); x.fillRect(bx, by+h-1, w, 1);
  x.fillRect(bx, by, 1, h); x.fillRect(bx+w-1, by, 1, h);
  x.font = 'bold 7px Nunito, system-ui, sans-serif';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = premuto ? '#3a2a12' : '#f6e6c8';
  x.fillText(testo, cx, cy+0.5);
  x.textAlign = 'left'; x.textBaseline = 'alphabetic';
}

function scritta(x, cx, cy, testo, col, dim){
  x.font = 'bold '+(dim||8)+'px Nunito, system-ui, sans-serif';
  x.textAlign = 'center';
  x.fillStyle = 'rgba(0,0,0,0.6)';
  x.fillText(testo, cx+1, cy+1);
  x.fillStyle = col || '#fff8d0';
  x.fillText(testo, cx, cy);
  x.textAlign = 'left';
}

/* velo notturno che passa e se ne va */
function notte(x, q){
  if(q <= 0) return;
  x.fillStyle = 'rgba(24,30,68,'+(0.62*q)+')';
  x.fillRect(0,0,W,H);
  if(q > 0.35){
    x.fillStyle = 'rgba(255,240,190,'+(q*0.9)+')';
    for(let i=0;i<14;i++){
      const sx0 = (i*37)%W, sy0 = (i*23)%40;
      x.fillRect(sx0, sy0, 1, 1);
    }
    // luna
    x.fillStyle = 'rgba(255,246,214,'+q+')';
    x.beginPath(); x.arc(W-24, 18, 7, 0, 6.3); x.fill();
    x.fillStyle = 'rgba(24,30,68,'+q+')';
    x.beginPath(); x.arc(W-27, 15, 6, 0, 6.3); x.fill();
  }
}

/* interpolazione comoda: 0 prima di a, 1 dopo b */
function q(t, a, b){ return Math.max(0, Math.min(1, (t-a)/(b-a))); }
/* impulso: sale e riscende fra a e b */
function imp(t, a, b){ const p = q(t,a,b); return Math.sin(p*Math.PI); }

/* ==================================================================
   1 — COLTIVARE: il ciclo completo del campo
   ================================================================== */
const COLTIVA = {
  id:'coltiva', nome:'Coltivare', icona:'zappa', durata:10500,
  fasi:[
    { fino:1900,  testo:'<b>1.</b> Scegli la <b>zappa</b> e premi <kbd>Spazio</kbd> verso l\'erba: la casella davanti a te si illumina.' },
    { fino:3500,  testo:'<b>2.</b> Scegli i <b>semi</b> e premi ancora <kbd>Spazio</kbd> sulla terra dissodata.' },
    { fino:5100,  testo:'<b>3.</b> Con l\'<b>annaffiatoio</b> bagna la terra. Se piove ci pensa il cielo.' },
    { fino:7400,  testo:'<b>4.</b> Torna a casa e <b>dormi</b>: le piante crescono solo durante la notte.' },
    { fino:10500, testo:'<b>5.</b> Quando la pianta <b>scintilla</b> è matura: raccoglila <b>a mani nude</b>.' }
  ],
  disegna(x, t){
    prato(x, 'erba');
    // il contadino sta a SINISTRA dell'aiuola e la guarda: così non le
    // finisce mai davanti e la pianta resta sempre visibile
    const TX = 78, TY = 50;
    const PX = 58, PY = TY + T;                   // piedi del contadino
    const arato = t > 1250;
    const bagnato = t > 4300 && t < 7400;

    if(arato) x.drawImage(ART.arato(0, 1, bagnato, 'primavera'), TX, TY);

    /* --- la pianta --- */
    let stage = -1;
    if(t > 2900) stage = 0;
    if(t > 5700) stage = 1;
    if(t > 6300) stage = 2;
    if(t > 6900) stage = 3;
    if(t > 7000) stage = 4;                        // matura (fasi.length della rapa = 4)
    if(t > 9700) stage = -1;                       // raccolta
    if(stage >= 0){
      ART.drawCrop(x, TX+16, TY+26, 'rapa', stage, 4, Math.sin(t*0.004)*0.8);
      if(stage >= 4 && t < 9700){                  // scintillio del maturo
        const b = t*0.006;
        x.globalAlpha = 0.4+Math.sin(b)*0.3;
        x.fillStyle = '#fff8d0';
        x.fillRect(TX+22+Math.sin(b*0.7)*3, TY+6+Math.cos(b)*3, 2, 2);
        x.globalAlpha = 1;
      }
    }

    /* --- la notte che fa crescere --- */
    let buio = 0;
    if(t > 5100 && t < 7400) buio = imp(t, 5100, 7400);
    notte(x, buio);

    /* --- il contadino --- */
    let attrezzo = null, uso = false;
    if(t < 1900){ attrezzo='zappa';        uso = t>700 && t<1250; }
    else if(t < 3500){ attrezzo=null;      uso = t>2500 && t<2900; }
    else if(t < 5100){ attrezzo='annaffiatoio'; uso = t>3900 && t<4400; }
    else if(t > 7400){ attrezzo=null;      uso = t>9300 && t<9700; }
    const dorme = t >= 5100 && t <= 7400;

    /* --- la casella bersaglio, come nel gioco --- */
    if(!dorme && t < 9700){
      x.globalAlpha = 0.45 + Math.sin(t*0.006)*0.16;
      x.strokeStyle = '#ffe9a8'; x.lineWidth = 1;
      x.strokeRect(TX+1.5, TY+1.5, T-3, T-3);
      x.globalAlpha = 1;
    }

    if(!dorme){
      ART.drawChar(x, PX, PY, look(), 2, 0, { attrezzo, uso, t });
    } else {
      scritta(x, W/2, 34, 'zZz', '#cfe0ff', 12);
    }

    /* --- effetti --- */
    if(uso && attrezzo==='zappa'){
      x.fillStyle = '#8a6647';
      for(let i=0;i<5;i++) x.fillRect(TX+8+i*4, TY+14+((i*7)%6), 2, 2);
    }
    if(uso && attrezzo==='annaffiatoio'){
      x.fillStyle = '#8fc0e0';
      for(let i=0;i<6;i++) x.fillRect(TX+6+i*4, TY+6+((t/40+i*5)%16), 1, 3);
    }
    if(t > 9700 && t < 10500){
      const p = q(t, 9700, 10500);
      x.globalAlpha = 1-p;
      scritta(x, TX+16, TY+10-p*18, '+1 Rapa', '#b6e06a', 10);
      x.globalAlpha = 1;
    }

    /* tasto suggerito, in un angolo dove non copre niente */
    if(t < 9700 && !dorme) tasto(x, W-28, 14, 'SPAZIO', uso);
  }
};

/* ==================================================================
   2 — PESCARE: il minigioco spiegato mentre succede
   ================================================================== */
const PESCA = {
  id:'pesca', nome:'Pescare', icona:'canna', durata:12000,
  fasi:[
    { fino:2200,  testo:'<b>1.</b> Scegli la <b>canna</b> e premi <kbd>Spazio</kbd> rivolto verso l\'acqua.' },
    { fino:3400,  testo:'<b>2.</b> Aspetta. Quando il galleggiante fa <b>!</b> premi subito <kbd>Spazio</kbd>.' },
    { fino:9800,  testo:'<b>3.</b> <b>Tieni premuto</b> per far salire la barra verde, <b>molla</b> per farla scendere: tienila sul pesce.' },
    { fino:12000, testo:'<b>4.</b> La barra blu si riempie finché il pesce è dentro. Piena = pesce tuo.' }
  ],
  disegna(x, t){
    /* --- riva e acqua --- */
    prato(x, 'erba');
    for(let ty=0; ty<Math.ceil(H/T); ty++)
      for(let tx=2; tx<Math.ceil(W/T); tx++)
        x.drawImage(ART.water('estate', ((t/140)|0)%6), tx*T, ty*T);

    const gioco = t > 3400;

    /* --- pescatore --- */
    ART.drawChar(x, 30, 74, look(), 2, 0, { attrezzo:'canna', uso:t>900 && t<1500, t });

    /* --- lenza e galleggiante --- */
    if(!gioco){
      const gx = 78, gy = 46 + Math.sin(t*0.005)*2;
      x.strokeStyle = 'rgba(240,235,215,0.75)'; x.lineWidth = 1;
      x.beginPath(); x.moveTo(44, 52); x.lineTo(gx, gy); x.stroke();
      x.fillStyle = '#e0503c'; x.fillRect(gx-2, gy-2, 4, 4);
      x.fillStyle = '#f6e6c8'; x.fillRect(gx-2, gy, 4, 2);
      if(t > 2200){
        x.drawImage(ART.emote('!'), gx-16, gy-30);
        tasto(x, gx+26, gy-6, 'SPAZIO', ((t/220)|0)%2===0);
      }
    }

    /* --- il minigioco vero --- */
    if(gioco){
      const bx = 104, by = 12, bw = 26, bh = 76;
      // colonna
      x.fillStyle = '#16202a'; x.fillRect(bx, by, bw, bh);
      x.fillStyle = '#3a2a1c'; x.fillRect(bx-2, by-2, bw+4, 2); x.fillRect(bx-2, by+bh, bw+4, 2);
      x.fillRect(bx-2, by, 2, bh); x.fillRect(bx+bw, by, 2, bh);

      // il pesce si muove a scatti
      const fy = by + 30 + Math.sin(t*0.0021)*22 + Math.sin(t*0.0057)*7;
      // la barra insegue con un po' di ritardo; a metà demo sbaglia apposta
      const errore = (t>5600 && t<6900) ? 26 : 0;
      const barraH = 24;
      let cy = fy - barraH/2 + Math.sin(t*0.0032)*4 + errore;
      cy = Math.max(by+1, Math.min(by+bh-barraH-1, cy));
      const dentro = fy > cy && fy < cy+barraH;

      x.fillStyle = dentro ? 'rgba(150,220,130,0.55)' : 'rgba(210,160,120,0.4)';
      x.fillRect(bx+2, cy, bw-4, barraH);
      x.fillStyle = dentro ? '#bef0a0' : '#e6b48c';
      x.fillRect(bx+2, cy, bw-4, 1); x.fillRect(bx+2, cy+barraH-1, bw-4, 1);

      // il pesce
      x.fillStyle = '#e0a63c';
      x.beginPath(); x.ellipse(bx+bw/2, fy, 6, 4.5, 0, 0, 6.3); x.fill();
      x.fillStyle = '#ffe089';
      x.beginPath(); x.ellipse(bx+bw/2-1, fy-1, 3.5, 2.5, 0, 0, 6.3); x.fill();
      x.fillStyle = '#e0a63c';
      x.beginPath(); x.moveTo(bx+bw/2+5, fy); x.lineTo(bx+bw/2+10, fy-3); x.lineTo(bx+bw/2+10, fy+3); x.fill();
      x.fillStyle = '#2a1c10'; x.fillRect(bx+bw/2-3, fy-1, 1, 1);

      // il tasto: si tiene premuto quando la barra deve salire
      const tenuto = cy > fy - barraH/2;
      if(t < 9800){
        tasto(x, bx-30, by+bh/2, 'SPAZIO', tenuto);
        scritta(x, bx-30, by+bh/2+16, tenuto ? '▲ sale' : '▼ scende', '#f6e6c8', 7);
      }

      // barra dei progressi
      const px0 = bx+bw+8;
      const prog = Math.max(0, Math.min(1, q(t,3400,9800)*1.25 - (t>5600&&t<7200 ? 0.18 : 0)));
      x.fillStyle = '#16202a'; x.fillRect(px0, by, 8, bh);
      x.fillStyle = '#4a9ad0'; x.fillRect(px0, by+bh-bh*prog, 8, bh*prog);
      x.fillStyle = '#8fd0f0'; x.fillRect(px0, by+bh-bh*prog, 8, 1);
      x.fillStyle = '#3a2a1c';
      x.fillRect(px0-2, by-2, 12, 2); x.fillRect(px0-2, by+bh, 12, 2);
      x.fillRect(px0-2, by, 2, bh); x.fillRect(px0+8, by, 2, bh);

      if(t > 9800){
        x.fillStyle = 'rgba(20,16,10,0.55)'; x.fillRect(0,0,W,H);
        x.drawImage(ART.bolla('trota'), W/2-20, 20);
        scritta(x, W/2, 82, 'Hai preso: Trota!', '#ffe270', 10);
      }
    }
  }
};

/* ==================================================================
   3 — LE MACCHINE: trasformare vale molto di più che vendere crudo
   ================================================================== */
const MACCHINA = {
  id:'macchina', nome:'Trasformare', icona:'botte', durata:10000,
  fasi:[
    { fino:2600,  testo:'<b>1.</b> Mettiti davanti alla <b>botte</b> e premi <kbd>E</kbd>: scegli cosa infilarci.' },
    { fino:6600,  testo:'<b>2.</b> Ci mette qualche giorno. Intanto fai altro: lavora anche mentre dormi.' },
    { fino:10000, testo:'<b>3.</b> Quando spunta la <b>bolla</b>, premi <kbd>E</kbd> e ritira. Il vino vale <b>il triplo</b> dell\'uva.' }
  ],
  disegna(x, t){
    prato(x, 'terra');
    const MX = 96, MY = 62;
    const lavora = t > 2600 && t < 6600;
    const pronto = t >= 6600;

    // la botte
    const img = ART.placeable('botte', { attivo:lavora, pronto });
    x.drawImage(img, MX-24, MY-img.height+8);

    // giorni che passano
    if(lavora){
      const notti = q(t,2600,6600)*3;
      notte(x, imp(t, 2600, 3900)*0.9);
      notte(x, imp(t, 3900, 5200)*0.9);
      notte(x, imp(t, 5200, 6500)*0.9);
      scritta(x, W/2, 16, 'giorno '+Math.min(3, 1+Math.floor(notti)), '#cfe0ff', 9);
    }

    // il contadino
    ART.drawChar(x, MX-44, MY+4, look(), 2, 0, { t });
    if(t < 2600 || (pronto && t < 9000)) tasto(x, MX-44, MY-40, 'E', ((t/260)|0)%2===0);

    // l'uva che entra
    if(t > 1200 && t < 2600){
      const p = q(t, 1200, 2400);
      const ix = MX-34 + 34*p, iy = MY-16 - Math.sin(p*Math.PI)*24;
      x.drawImage(ART.icon('uva'), ix-12, iy-12, 24, 24);
    }
    // la bolla col vino
    if(pronto && t < 9000){
      const bob = Math.sin(t*0.005)*2;
      x.drawImage(ART.bolla('vino:uva'), MX-20, MY-58+bob);
    }
    // il ritiro: le scritte in alto, dove non coprono la scena
    if(t >= 9000){
      const p = q(t, 9000, 10000);
      x.fillStyle = 'rgba(20,16,10,'+(0.55*(1-p*0.4))+')';
      x.fillRect(0, 8, W, 30);
      x.globalAlpha = 1-p*0.5;
      scritta(x, W/2, 21, 'Vino di Uva', '#e8c8ff', 10);
      scritta(x, W/2, 33, '228 monete invece di 76', '#ffe270', 8);
      x.globalAlpha = 1;
    }
  }
};

/* ==================================================================
   4 — LA CASSA DI CONSEGNA: come si fanno i soldi dormendo
   ================================================================== */
const CONSEGNA = {
  id:'consegna', nome:'Vendere', icona:'cassa', durata:9500,
  fasi:[
    { fino:3000, testo:'<b>1.</b> La <b>cassa di consegna</b> è accanto a casa. Premi <kbd>E</kbd> e lasciaci dentro il raccolto.' },
    { fino:6200, testo:'<b>2.</b> Durante la <b>notte</b> passano a ritirarla. Non devi fare niente.' },
    { fino:9500, testo:'<b>3.</b> All\'alba trovi le monete già contate. Comodo prima di andare a dormire.' }
  ],
  disegna(x, t){
    prato(x, 'erba');
    const CX = 98, CY = 50;
    const PX = 44, PY = CY + 32;              // piedi del contadino, a sinistra

    // la cassa (come la disegna il gioco)
    const cassa = (bx, by)=>{
      ART.px(x,bx+1,by+8,30,20,'#7a5636');
      ART.px(x,bx+1,by+8,30,3,'#a8763c');
      ART.px(x,bx+1,by+25,30,3,'#5f4028');
      ART.px(x,bx+3,by+4,26,6,'#8a6038');
      ART.px(x,bx+3,by+4,26,2,'#b58a5e');
      ART.px(x,bx+10,by+12,12,8,'#3a2a1c');
      ART.px(x,bx-1,by+10,3,14,'#c9a05a');
      ART.px(x,bx+30,by+10,3,14,'#c9a05a');
    };
    cassa(CX, CY);

    ART.drawChar(x, PX, PY, look(), 2, 0, { t });

    // il raccolto che vola dentro: grande abbastanza da riconoscerlo
    if(t > 800 && t < 3000){
      const roba = ['rapa','patata','fragola'];
      for(let i=0;i<3;i++){
        const p = q(t, 800+i*500, 2100+i*500);
        if(p<=0 || p>=1) continue;
        const ix = PX+10 + (CX+6 - (PX+10))*p;
        const iy = PY-18 - Math.sin(p*Math.PI)*28;
        x.globalAlpha = 1-p*0.2;
        x.drawImage(ART.icon(roba[i]), ix-12, iy-12, 24, 24);
        x.globalAlpha = 1;
      }
    }
    if(t < 3000) tasto(x, PX, PY-46, 'E', ((t/260)|0)%2===0);

    // la notte
    notte(x, imp(t, 3000, 6200));

    // l'alba: le monete
    if(t > 6200){
      const p = q(t, 6200, 8200);
      for(let i=0;i<6;i++){
        const pp = Math.max(0, Math.min(1, p*1.6 - i*0.09));
        if(pp<=0) continue;
        const mx = CX+16 + Math.sin(i*2.1)*20;
        const my = CY+4 - pp*44;
        x.globalAlpha = 1-pp*0.8;
        x.fillStyle = '#f2c14e';
        x.beginPath(); x.ellipse(mx, my, 4, 4.5, 0, 0, 6.3); x.fill();
        x.fillStyle = '#fff0b0';
        x.beginPath(); x.ellipse(mx-1, my-1, 1.6, 2, 0, 0, 6.3); x.fill();
        x.globalAlpha = 1;
      }
      if(t > 7000) scritta(x, W/2, 26, '+204 monete', '#ffe270', 11);
    }
  }
};

/* ------------------------------------------------------------------
   REGISTRO
   ------------------------------------------------------------------ */
const TUTTE = [COLTIVA, PESCA, MACCHINA, CONSEGNA];
const PER_ID = {};
for(const d of TUTTE) PER_ID[d.id] = d;

D.elenco = ()=> TUTTE.map(d=>({ id:d.id, nome:d.nome, icona:d.icona }));
D.esiste = id => !!PER_ID[id];
D.durata = id => PER_ID[id] ? PER_ID[id].durata : 0;
D.fasi   = id => PER_ID[id] ? PER_ID[id].fasi.slice() : [];
D.misura = ()=> ({ larghezza:W, altezza:H });

/* Disegna UN fotogramma della scena all'istante t. Il lettore lo usa a
   ogni frame, ma serve anche per un'anteprima ferma o per un controllo. */
D.fotogramma = function(id, t, dest){
  const d = PER_ID[id];
  if(!d) return null;
  const c = dest || ART.cv(W, H);
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  x.clearRect(0, 0, W, H);
  x.save();
  try{ d.disegna(x, ((t % d.durata) + d.durata) % d.durata); }
  catch(e){ console.warn('[demo] la scena «'+id+'» è inciampata a t='+t, e); }
  x.restore();
  x.strokeStyle = 'rgba(0,0,0,0.35)'; x.lineWidth = 2;
  x.strokeRect(1, 1, W-2, H-2);
  return c;
};

/* quale fase (didascalia) è in corso a un dato istante */
D.faseA = function(id, t){
  const d = PER_ID[id];
  if(!d) return 0;
  t = ((t % d.durata) + d.durata) % d.durata;
  for(let i=0;i<d.fasi.length;i++) if(t < d.fasi[i].fino) return i;
  return d.fasi.length-1;
};

/* ------------------------------------------------------------------
   IL LETTORE
   Monta canvas + didascalia dentro un contenitore e fa girare la scena
   finché non lo si ferma. Ingrandimento intero: la pixel art resta netta.
   ------------------------------------------------------------------ */
D.monta = function(contenitore, idIniziale){
  let corrente = PER_ID[idIniziale] || TUTTE[0];
  let raf = null, t0 = 0, vivo = true;

  contenitore.innerHTML = '';

  /* scelta della demo */
  const barra = document.createElement('div');
  barra.className = 'demo-tabs';
  const bottoni = {};
  for(const d of TUTTE){
    const b = document.createElement('button');
    b.className = 'demo-tab';
    b.appendChild(UI.ico(d.icona));
    const s = document.createElement('span'); s.textContent = d.nome;
    b.appendChild(s);
    b.onclick = ()=>{ cambia(d); SND.play('menu'); };
    bottoni[d.id] = b;
    barra.appendChild(b);
  }
  contenitore.appendChild(barra);

  /* schermo */
  const larghezza = Math.max(260, contenitore.clientWidth || 380);
  const S = Math.max(2, Math.min(4, Math.floor(larghezza / W)));
  const cvs = document.createElement('canvas');
  cvs.className = 'demo-schermo';
  cvs.width = W*S; cvs.height = H*S;
  cvs.style.width = (W*S)+'px';
  contenitore.appendChild(cvs);
  const ctx = cvs.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const off = ART.cv(W, H);
  const ox = off.getContext('2d');
  ox.imageSmoothingEnabled = false;

  /* didascalia + pallini di fase */
  const sotto = document.createElement('div');
  sotto.className = 'demo-sotto';
  const dida = document.createElement('div'); dida.className = 'demo-dida';
  const dots = document.createElement('div'); dots.className = 'demo-dots';
  sotto.appendChild(dida); sotto.appendChild(dots);
  contenitore.appendChild(sotto);

  function cambia(d){
    corrente = d;
    t0 = performance.now();
    for(const id in bottoni) bottoni[id].classList.toggle('on', id===d.id);
    dots.innerHTML = '';
    for(let i=0;i<d.fasi.length;i++){
      const el = document.createElement('i'); el.className='demo-dot';
      dots.appendChild(el);
    }
    dida.innerHTML = d.fasi[0].testo;
  }

  let fasePrec = -1;
  function frame(ora){
    if(!vivo) return;
    const t = (ora - t0) % corrente.durata;

    D.fotogramma(corrente.id, t, off);
    ctx.clearRect(0,0,cvs.width,cvs.height);
    ctx.drawImage(off, 0, 0, W*S, H*S);

    // didascalia della fase in corso
    const f = D.faseA(corrente.id, t);
    if(f !== fasePrec){
      fasePrec = f;
      dida.innerHTML = corrente.fasi[f].testo;
      [...dots.children].forEach((d,i)=>d.classList.toggle('on', i===f));
    }
    raf = requestAnimationFrame(frame);
  }

  cambia(corrente);
  t0 = performance.now();
  raf = requestAnimationFrame(frame);

  return { ferma(){ vivo = false; if(raf) cancelAnimationFrame(raf); } };
};

})();
