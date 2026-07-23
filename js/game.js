/* ===================================================================
   FIORALBA — game.js
   Stato, ciclo di gioco, input, sistemi.
   =================================================================== */
(function(){
'use strict';

const T = 32;
const $ = s=>document.querySelector(s);

const G = {};
window.G = G;

/* ===================================================================
   STATO INIZIALE
   =================================================================== */
function statoIniziale(){
  return {
    nomeGiocatore:'Contadino',
    mappaId:'podere',
    oro:600,
    energia:180, energiaMax:180,
    giorno:1, stagioneIdx:0, anno:1, giornoTot:0,
    ora:360,
    meteo:'sereno', meteoDomani:'sereno',
    invMax:24,
    inv:[
      {id:'zappa',n:1},{id:'annaffiatoio',n:1},{id:'ascia',n:1},
      {id:'piccone',n:1},{id:'falce',n:1},{id:'canna',n:1},
      {id:'seme_rapa',n:15},null,null,null,null,null,
      null,null,null,null,null,null,null,null,null,null,null,null
    ],
    slotSel:0,
    skills:{agricoltura:0, raccolta:0, estrazione:0, pesca:0},
    attrezziLiv:{zappa:0, annaffiatoio:0, ascia:0, piccone:0},
    amicizia:{}, regalatoOggi:{}, parlatoOggi:{},
    costruzioni:{},
    santuario:{}, santuarioDato:{}, braci:0,
    lettere:{}, ricetteNote:{zuppa_contadina:true, frittata:true},
    cassaConsegna:[],
    stats:{raccolti:0, pesci:0, alberi:0, sassi:0, guadagno:0, giorniGiocati:0,
           piatti:0, regali:0, richiesteFatte:0, sagre:0, visitatoBosco:false, visitatoGrotta:false, visitatoPaese:false},
    mercato:null, gelo:false, richieste:[], richiestaSeq:0,
    obiettiviRiscossi:{}, sagra:null, mercante:{presente:false, giorno:-1, stock:[]},
    trame:{ torta:{avviata:false, segreto:false, fatta:false},
            pesceluna:{avviata:false, preso:false, fatta:false} },
    tutorialFatto:false,
    animali:[],
    look:{ pelle:'#e8bd8f', capelli:'#6b4423', maglia:'#4f8ab0', pant:'#3d5470', cappello:'#c9a44c' }
  };
}

/* ===================================================================
   BOOT
   =================================================================== */
let cvs, ultimo=0, accum=0;
G.tempoMs = 0;
G.particelle = [];
G.cam = {x:0,y:0};
G.bersaglio = null;
G.inGioco = false;

G.p = {
  px:0, py:0, dir:0, frame:0, animT:0, vx:0, vy:0,
  attrezzoVisibile:null, usoT:0, dorme:false, blink:false, blinkT:0,
  look:null, correndo:false
};

function init(){
  cvs = $('#game');
  REND.init(cvs);
  window.addEventListener('resize', ()=>{ REND.resize(); REND.initMeteo(); });
  collegaInput();
  collegaTitolo();
  collegaLanding();
  disegnaTitolo();
}

/* ===================================================================
   LANDING PAGE — front page con "cosa offre" e i pulsanti di avvio.
   Su mobile la pagina è visibile, ma provare a giocare mostra l'avviso.
   =================================================================== */
function collegaLanding(){
  // la landing usa lo sfondo animato del titolo: nascondi il vecchio menu del titolo
  const ti = $('#title-inner'); if(ti) ti.style.display='none';
  const daMobile = ()=> window.matchMedia('(max-width:820px), (pointer:coarse) and (hover:none)').matches;
  const avviso = ()=> $('#mobile-warn').classList.add('show');
  const back = $('#mw-back'); if(back) back.onclick = ()=> $('#mobile-warn').classList.remove('show');

  const haSalvato = !!caricaGrezzo();
  document.querySelectorAll('.lp-continue').forEach(b=>{
    if(!haSalvato){ b.disabled = true; b.title = 'Nessuna partita salvata'; }
    b.addEventListener('click', ()=>{
      if(daMobile()){ avviso(); return; }
      SND.resume(); SND.play('menu');
      if(carica()) avviaGioco(false); else nuovaPartita();
    });
  });
  document.querySelectorAll('.lp-new').forEach(b=>{
    b.addEventListener('click', ()=>{
      if(daMobile()){ avviso(); return; }
      SND.resume(); SND.play('menu');
      nuovaPartita();
    });
  });
}

/* ===================================================================
   TITOLO
   =================================================================== */
let titoloRaf = null;
function disegnaTitolo(){
  const c = $('#title-art');
  const cx = c.getContext('2d');
  const off = document.createElement('canvas');
  let ox = off.getContext('2d');
  let t = 0;

  /* ---- helper di scena ---- */
  function profilo(x, W, H, base, amp, freq, fase, col, luce){
    x.fillStyle = col;
    x.beginPath(); x.moveTo(0, H);
    for(let px=0; px<=W; px+=2){
      const yy = base
        + Math.sin(px*freq + fase)*amp
        + Math.sin(px*freq*2.7 + fase*1.6)*amp*0.34
        + Math.sin(px*freq*5.3 + fase*0.7)*amp*0.14;
      x.lineTo(px, yy|0);
    }
    x.lineTo(W, H); x.closePath(); x.fill();
    if(luce){
      x.fillStyle = luce;
      for(let px=0; px<=W; px+=2){
        const yy = base
          + Math.sin(px*freq + fase)*amp
          + Math.sin(px*freq*2.7 + fase*1.6)*amp*0.34
          + Math.sin(px*freq*5.3 + fase*0.7)*amp*0.14;
        x.fillRect(px, yy|0, 2, 2);
      }
    }
  }

  function abete(x, bx, by, s, col){
    x.fillStyle = col;
    x.fillRect(bx-1, by-4*s, 2, 5*s);
    for(let i=0;i<3;i++){
      const w = (9-i*2.4)*s, hh = 6*s;
      const yy = by - 4*s - i*4.4*s;
      x.beginPath();
      x.moveTo(bx, yy-hh); x.lineTo(bx-w, yy); x.lineTo(bx+w, yy);
      x.closePath(); x.fill();
    }
  }

  function casetta(x, bx, by, s, col, finestra, fumo, tt){
    x.fillStyle = col;
    x.fillRect(bx-7*s, by-9*s, 14*s, 9*s);
    x.beginPath();
    x.moveTo(bx-9*s, by-8*s); x.lineTo(bx, by-15*s); x.lineTo(bx+9*s, by-8*s);
    x.closePath(); x.fill();
    x.fillRect(bx+3*s, by-19*s, 3*s, 6*s);            // comignolo
    if(finestra){
      x.fillStyle = finestra;
      x.fillRect(bx-4*s, by-6*s, 3*s, 3*s);
      x.fillRect(bx+1*s, by-6*s, 3*s, 3*s);
    }
    if(fumo){
      x.globalAlpha = 0.18;
      x.fillStyle = '#cfc4b4';
      for(let i=0;i<4;i++){
        const p = ((tt*0.00022 + i*0.25) % 1);
        x.beginPath();
        x.arc(bx+4.5*s + Math.sin(p*5+i)*4*s, by-19*s - p*22*s, (1.4+p*3.4)*s, 0, 6.3);
        x.fill();
      }
      x.globalAlpha = 1;
    }
  }

  function frame(){
    const titolo = $('#title');
    if(!titolo || titolo.classList.contains('hidden')) return;
    t += 16;

    const dw = Math.max(320, window.innerWidth  || 0);
    const dh = Math.max(240, window.innerHeight || 0);
    const SC = dw < 700 ? 2 : 3;
    const W = Math.ceil(dw/SC), H = Math.ceil(dh/SC);
    if(off.width!==W || off.height!==H){
      off.width=W; off.height=H;
      ox = off.getContext('2d'); ox.imageSmoothingEnabled=false;
    }
    const x = ox;
    const oriz = Math.round(H*0.60);          // linea dell'orizzonte
    const solX = Math.round(W*0.74);
    const solY = oriz - Math.round(H*0.020);   // mezzo disco sopra le colline
    const brezza = Math.sin(t*0.0006)*0.5 + Math.sin(t*0.00023+1.4)*0.5;

    /* ---------- CIELO ---------- */
    const g = x.createLinearGradient(0,0,0,H);
    g.addColorStop(0.00,'#101733');
    g.addColorStop(0.22,'#22284c');
    g.addColorStop(0.40,'#453a63');
    g.addColorStop(0.52,'#7a4f63');
    g.addColorStop(0.58,'#b56a52');
    g.addColorStop(0.615,'#e39a55');
    g.addColorStop(0.64,'#f7c777');
    g.addColorStop(1.00,'#2a2536');
    x.fillStyle=g; x.fillRect(0,0,W,H);

    /* ---------- STELLE ---------- */
    for(let i=0;i<90;i++){
      const sx0 = ART.hsh(i,0,11)*W;
      const sy0 = ART.hsh(i,1,11)*H*0.46;
      const tw = 0.30 + Math.sin(t*0.0021 + i*1.7)*0.34;
      const fade = 1 - sy0/(H*0.50);
      const a = tw*fade;
      if(a <= 0.02) continue;
      x.globalAlpha = a;
      x.fillStyle = ART.hsh(i,2,11)>0.82 ? '#ffe6b0' : '#e8f0ff';
      x.fillRect(sx0|0, sy0|0, 1, 1);
      if(ART.hsh(i,3,11)>0.9){ x.globalAlpha=a*0.5; x.fillRect((sx0|0)-1,sy0|0,3,1); x.fillRect(sx0|0,(sy0|0)-1,1,3); }
    }
    x.globalAlpha=1;

    /* ---------- ALONE DEL SOLE ---------- */
    const halo = x.createRadialGradient(solX,solY,0,solX,solY,H*0.42);
    halo.addColorStop(0,'rgba(255,214,130,0.55)');
    halo.addColorStop(0.35,'rgba(240,150,90,0.22)');
    halo.addColorStop(1,'rgba(200,110,70,0)');
    x.fillStyle=halo; x.fillRect(0,0,W,H);

    /* ---------- NUVOLE ---------- */
    for(let i=0;i<7;i++){
      const vel = 0.0035 + (i%3)*0.0016;
      const bx = ((ART.hsh(i,0,41)*W*1.6 + t*vel) % (W+180)) - 90;
      const by = H*0.16 + ART.hsh(i,1,41)*H*0.30;
      const lw = 26 + ART.hsh(i,2,41)*46;
      const lh = 3 + ART.hsh(i,3,41)*4;
      const vicino = 1 - Math.min(1, Math.abs(by-solY)/(H*0.4));
      // corpo scuro
      x.globalAlpha = 0.55;
      x.fillStyle = '#3b3350';
      x.fillRect(bx|0, by|0, lw|0, lh|0);
      x.fillRect((bx+lw*0.2)|0, (by-lh*0.8)|0, (lw*0.55)|0, lh|0);
      // sottopancia illuminato dal sole
      x.globalAlpha = 0.5*vicino + 0.12;
      x.fillStyle = '#f0a868';
      x.fillRect(bx|0, (by+lh-1)|0, lw|0, 1);
      x.globalAlpha = 1;
    }

    /* ---------- SOLE ---------- */
    const solR = Math.round(H*0.055);
    x.fillStyle='#fff0c0';
    x.beginPath(); x.arc(solX, solY, solR, 0, 6.3); x.fill();
    x.fillStyle='#ffd98a';
    x.beginPath(); x.arc(solX, solY, solR*0.72, 0, 6.3); x.fill();
    // strisce sull'acqua/aria
    x.globalAlpha=0.18; x.fillStyle='#ffcf80';
    for(let i=0;i<4;i++) x.fillRect(solX-solR*2.4, solY-solR + i*solR*0.7, solR*4.8, 1);
    x.globalAlpha=1;

    /* ---------- MONTAGNE LONTANE ---------- */
    profilo(x, W, H, oriz-H*0.055, H*0.045, 0.006, 0.4, '#413a5e', '#584f78');
    profilo(x, W, H, oriz-H*0.018, H*0.032, 0.010, 2.1, '#332e4c', '#453e63');

    /* ---------- COLLINE ---------- */
    profilo(x, W, H, oriz+H*0.030, H*0.026, 0.008, 1.2, '#2b3a3c', '#3a4c4a');

    profilo(x, W, H, oriz+H*0.075, H*0.022, 0.013, 3.3, '#22302f', '#2f403c');

    /* ---------- LAGHETTO CHE RIFLETTE IL TRAMONTO ----------
       disegnato dopo le colline, così sta nella conca e non ci finisce sotto */
    const lagX = W*0.72, lagY = oriz + H*0.098, lagW = W*0.34, lagH = H*0.036;
    x.fillStyle='#1e2c38';
    x.beginPath(); x.ellipse(lagX, lagY, lagW/2, lagH/2, 0, 0, 6.3); x.fill();
    x.save();
    x.beginPath(); x.ellipse(lagX, lagY, lagW/2-1, lagH/2-1, 0, 0, 6.3); x.clip();
    const lg = x.createLinearGradient(0, lagY-lagH/2, 0, lagY+lagH/2);
    lg.addColorStop(0,'#8a5a5e'); lg.addColorStop(0.5,'#c07a52'); lg.addColorStop(1,'#3c3a52');
    x.fillStyle=lg; x.fillRect(lagX-lagW, lagY-lagH, lagW*2, lagH*2);
    // scia del sole, a trattini che ondeggiano
    for(let i=0;i<9;i++){
      const yy = lagY - lagH/2 + i*(lagH/9);
      const w2 = (2 + i*1.4) * (1 + Math.sin(t*0.0018 + i*1.1)*0.18);
      x.globalAlpha = 0.65 - i*0.05;
      x.fillStyle = '#ffd9a0';
      x.fillRect((solX - w2/2 + Math.sin(t*0.0022+i)*2)|0, yy|0, w2|0, 1);
    }
    x.globalAlpha=1;
    x.restore();
    // bordo del laghetto
    x.strokeStyle='#26332e'; x.lineWidth=1.5;
    x.beginPath(); x.ellipse(lagX, lagY, lagW/2, lagH/2, 0, 0, 6.3); x.stroke();

    /* ---------- BOSCO SULLE COLLINE ---------- */
    for(let i=0;i<58;i++){
      const bx = ART.hsh(i,0,51)*W;
      const by = oriz + H*0.055 + ART.hsh(i,1,51)*H*0.055;
      const s  = 0.55 + ART.hsh(i,2,51)*0.5;
      abete(x, bx, by, s, '#1b2724');
    }

    /* ---------- IL PAESE ---------- */
    const paeseY = oriz + H*0.135;
    const pulse = 0.72 + Math.sin(t*0.0019)*0.16;
    for(let i=0;i<7;i++){
      const bx = W*0.50 + i*W*0.052 + Math.sin(i*2.1)*W*0.012;
      const by = paeseY + ((i%3)-1)*H*0.016;
      casetta(x, bx, by, 0.85+((i%3)*0.12), '#182029',
              `rgba(255,206,120,${pulse*(0.7+ART.hsh(i,0,61)*0.3)})`,
              i%3===0, t);
    }
    // campanile
    x.fillStyle='#182029';
    x.fillRect(W*0.585, paeseY-H*0.085, 7, H*0.085);
    x.beginPath();
    x.moveTo(W*0.585-3, paeseY-H*0.085); x.lineTo(W*0.585+3.5, paeseY-H*0.115);
    x.lineTo(W*0.585+10, paeseY-H*0.085); x.closePath(); x.fill();
    x.fillStyle=`rgba(255,206,120,${pulse})`;
    x.fillRect(W*0.585+2, paeseY-H*0.070, 3, 4);

    /* ---------- IL SANTUARIO, su un poggio a sinistra ---------- */
    // tenuto a sinistra: la colonna dei pulsanti sta al centro
    const sX = W*0.175, sY = oriz + H*0.100;
    const sS = Math.max(1, H*0.0042);          // scala del santuario
    const battito = 0.55 + Math.sin(t*0.0016)*0.28;
    // poggio
    x.fillStyle='#1e2a26';
    x.beginPath(); x.ellipse(sX, sY+3*sS, 30*sS, 7*sS, 0, 0, 6.3); x.fill();
    // alone
    x.globalAlpha = 0.34*battito;
    const gl = x.createRadialGradient(sX, sY-9*sS, 0, sX, sY-9*sS, 34*sS);
    gl.addColorStop(0,'rgba(255,222,150,1)'); gl.addColorStop(1,'rgba(255,200,110,0)');
    x.fillStyle=gl; x.beginPath(); x.arc(sX, sY-9*sS, 34*sS, 0, 6.3); x.fill();
    x.globalAlpha=1;
    // tempietto
    x.fillStyle='#242b33';
    x.fillRect(sX-13*sS, sY-16*sS, 4*sS, 16*sS);
    x.fillRect(sX+9*sS,  sY-16*sS, 4*sS, 16*sS);
    x.fillRect(sX-17*sS, sY-20*sS, 34*sS, 4*sS);
    x.beginPath();
    x.moveTo(sX-19*sS, sY-20*sS); x.lineTo(sX, sY-32*sS); x.lineTo(sX+19*sS, sY-20*sS);
    x.closePath(); x.fill();
    x.fillRect(sX-18*sS, sY, 36*sS, 3*sS);
    // la lanterna accesa
    x.fillStyle=`rgba(255,232,164,${0.78+battito*0.22})`;
    x.fillRect(sX-3*sS, sY-13*sS, 6*sS, 9*sS);
    x.fillStyle='#3a3028';
    x.fillRect(sX-4*sS, sY-14*sS, 8*sS, 1.5*sS);
    // scintille che salgono
    for(let i=0;i<4;i++){
      const p = ((t*0.00035 + i*0.25) % 1);
      x.globalAlpha = (1-p)*0.8;
      x.fillStyle='#ffe9a8';
      x.fillRect((sX + Math.sin(p*7+i*2)*5*sS)|0, (sY-14*sS - p*22*sS)|0, 1, 1);
    }
    x.globalAlpha=1;

    /* ---------- CAMPI DEL PODERE ---------- */
    const campoY = oriz + H*0.195;
    x.fillStyle='#1d2a18'; x.fillRect(0, campoY, W, H-campoY);
    // solchi in prospettiva
    for(let i=0;i<12;i++){
      const p = i/12;
      const yy = campoY + p*p*(H-campoY)*1.15;
      if(yy>H) break;
      x.fillStyle = i%2 ? 'rgba(46,66,36,0.55)' : 'rgba(28,42,22,0.55)';
      x.fillRect(0, yy|0, W, Math.max(2, (p*10)|0));
    }
    // filari di piantine
    for(let r=0;r<4;r++){
      const p = 0.18 + r*0.17;
      const yy = campoY + p*p*(H-campoY)*1.6;
      if(yy>H) continue;
      const passo = 10 + r*5;
      for(let bx=8; bx<W; bx+=passo){
        const sw = brezza*(1+r*0.4);
        x.fillStyle='#2c4423';
        x.fillRect((bx+sw)|0, (yy-3-r)|0, 2, 3+r);
        x.fillStyle='#38562c';
        x.fillRect((bx+sw-2)|0, (yy-4-r)|0, 2, 2);
        x.fillRect((bx+sw+2)|0, (yy-4-r)|0, 2, 2);
      }
    }
    // staccionata
    const recY = campoY + H*0.055;
    x.fillStyle='#241c16';
    for(let bx=-6; bx<W+10; bx+=22) x.fillRect(bx, recY-9, 3, 12);
    x.fillRect(0, recY-6, W, 2);
    x.fillRect(0, recY-2, W, 2);

    /* ---------- ALBERO IN PRIMO PIANO (cornice a sinistra) ---------- */
    const tX = W*0.045, tY = H*1.02;
    const oscilla = brezza*3;
    x.fillStyle='#0e1710';
    x.fillRect(tX-4, tY-H*0.40, 9, H*0.40);
    x.save();
    x.translate(tX+oscilla, tY-H*0.38);
    for(const b of [[0,0,H*0.095],[-H*0.045,H*0.030,H*0.070],[H*0.050,H*0.024,H*0.064],
                    [-H*0.024,-H*0.038,H*0.058],[H*0.028,-H*0.032,H*0.054]]){
      x.beginPath(); x.arc(b[0], b[1], b[2], 0, 6.3); x.fill();
    }
    x.restore();
    // rami che entrano dall'alto a destra
    x.save();
    x.translate(W*1.0, -H*0.02);
    x.fillStyle='#0e1710';
    for(const b of [[0,0,H*0.10],[-H*0.06,H*0.05,H*0.075],[-H*0.11,H*0.01,H*0.055]]){
      x.beginPath(); x.arc(b[0]+oscilla*0.6, b[1], b[2], 0, 6.3); x.fill();
    }
    x.restore();

    /* ---------- ERBA IN PRIMISSIMO PIANO ---------- */
    x.fillStyle='#0a1209';
    x.fillRect(0, H-H*0.045, W, H*0.045);
    for(let bx=-4; bx<W+8; bx+=3){
      const hh = 5 + ((ART.hsh(bx,0,81)*11)|0);
      const sw = brezza*3.2*(0.6+ART.hsh(bx,1,81)*0.8);
      x.fillStyle = ART.hsh(bx,2,81)>0.5 ? '#0a1209' : '#0f1a0c';
      for(let k=0;k<hh;k++){
        const p = k/hh;
        x.fillRect((bx + sw*p*p)|0, (H-H*0.045-k)|0, 2, 1);
      }
    }

    /* ---------- LUCCIOLE ---------- */
    for(let i=0;i<26;i++){
      const fx = (ART.hsh(i,0,31)*W + Math.sin(t*0.00045+i*1.3)*W*0.06 + t*0.004*(i%3-1)) % W;
      const fy = campoY - H*0.03 + ART.hsh(i,1,31)*(H-campoY)*0.85
               + Math.cos(t*0.0008+i*2.1)*H*0.018;
      const a = 0.20 + Math.sin(t*0.0033 + i*1.9)*0.55;
      if(a<=0.02) continue;
      x.globalAlpha = a*0.30;
      x.fillStyle='#e8f89a';
      x.beginPath(); x.arc(fx, fy, 3.4, 0, 6.3); x.fill();
      x.globalAlpha = a;
      x.fillStyle='#f4ffc8';
      x.fillRect(fx|0, fy|0, 1, 1);
    }
    x.globalAlpha=1;

    /* ---------- UCCELLI ---------- */
    for(let i=0;i<5;i++){
      const p = ((t*0.000045 + i*0.21) % 1.4) - 0.2;
      if(p<0 || p>1) continue;
      const bx = p*W*1.1 - W*0.05;
      const by = H*0.20 + Math.sin(p*3.4+i)*H*0.045 + i*H*0.016;
      const ali = Math.sin(t*0.006 + i*1.5) > 0 ? 2 : -1;
      x.strokeStyle='rgba(24,22,34,0.75)'; x.lineWidth=1;
      x.beginPath();
      x.moveTo(bx-3, by+ali); x.lineTo(bx, by); x.lineTo(bx+3, by+ali);
      x.stroke();
    }

    /* ---------- RAGGI CALDI ---------- */
    x.save();
    x.globalCompositeOperation='lighter';
    for(let i=0;i<4;i++){
      const gr = x.createLinearGradient(solX, solY, solX - W*0.5 + i*W*0.1, H);
      gr.addColorStop(0,`rgba(255,206,140,${0.055 - i*0.008})`);
      gr.addColorStop(1,'rgba(255,180,110,0)');
      x.fillStyle=gr;
      x.beginPath();
      x.moveTo(solX, solY);
      x.lineTo(solX - W*0.34 + i*W*0.19, H);
      x.lineTo(solX - W*0.20 + i*W*0.19, H);
      x.closePath(); x.fill();
    }
    x.restore();

    /* ---------- SCRIM CENTRALE PER IL TESTO ---------- */
    const sc = x.createRadialGradient(W/2, H*0.40, 0, W/2, H*0.40, W*0.52);
    sc.addColorStop(0,'rgba(16,14,28,0.50)');
    sc.addColorStop(0.55,'rgba(16,14,28,0.22)');
    sc.addColorStop(1,'rgba(16,14,28,0)');
    x.fillStyle=sc; x.fillRect(0,0,W,H);

    /* ---------- VIGNETTA ---------- */
    const v = x.createRadialGradient(W/2,H/2,Math.min(W,H)*0.34, W/2,H/2,Math.max(W,H)*0.78);
    v.addColorStop(0,'rgba(0,0,0,0)');
    v.addColorStop(1,'rgba(8,6,16,0.62)');
    x.fillStyle=v; x.fillRect(0,0,W,H);

    /* ---------- INGRANDIMENTO A PIXEL ---------- */
    if(c.width!==dw || c.height!==dh){ c.width=dw; c.height=dh; }
    cx.imageSmoothingEnabled=false;
    cx.drawImage(off, 0, 0, dw, dh);

    titoloRaf = requestAnimationFrame(frame);
  }
  frame();
}

function collegaTitolo(){
  const salvato = caricaGrezzo();
  if(salvato) $('#btn-continue').classList.remove('hidden');

  $('#btn-new').onclick = ()=>{
    SND.resume(); SND.play('menu');
    nuovaPartita();
  };
  $('#btn-continue').onclick = ()=>{
    SND.resume(); SND.play('menu');
    if(carica()) avviaGioco(false);
    else nuovaPartita();
  };
  $('#btn-howto').onclick = ()=>{ SND.resume(); UI.comeSiGioca(); };
  const bImp = $('#btn-import');
  if(bImp) bImp.onclick = ()=>{ SND.resume(); SND.play('menu'); G.importaDaFile(); };

  // se torniamo qui subito dopo un import, riprendi la partita importata
  let autoImport = false;
  try{
    autoImport = sessionStorage.getItem('fioralba_import')==='1';
    if(autoImport) sessionStorage.removeItem('fioralba_import');
  }catch(e){}
  if(autoImport && salvato && carica()){ avviaGioco(false); }
}

function nuovaPartita(){
  Object.assign(G, statoIniziale());
  G.maps = WORLD.crea();
  G.p.look = G.look;
  G.p.px = 8*T+16; G.p.py = 10*T+16;
  G.animali = [{tipo:'gatto', mappa:'podere', px:10*T, py:9*T, dir:1, tx:10, ty:9, wait:0}];
  WORLD.nuovoGiorno(G.maps, G.stagione().id, 12345);
  G.richieste = [];
  aggiornaRichieste();          // qualche richiesta già dal primo giorno
  G.sagra = creaSagra();        // la sagra di primavera è già in corso
  G.lettere.intro = true;
  avviaGioco(true);
}

function avviaGioco(conIntro){
  $('#title').classList.add('hidden');
  const lp=$('#landing'); if(lp) lp.classList.add('hidden');
  if(titoloRaf) cancelAnimationFrame(titoloRaf);
  $('#hud').classList.remove('hidden');
  G.inGioco = true;
  G.ultimaAzione = performance.now();
  REND.initMeteo();
  aggiornaCamera(true);
  costruisciHotbar();
  G.aggiornaHUD();
  musicaGiusta();
  SND.ambiente(ambienteGiusto());
  if(conIntro){
    // dopo la lettera di Nonna Ilde parte la guida interattiva
    setTimeout(()=>UI.lettera('intro', ()=>{
      if(!G.tutorialFatto) setTimeout(()=>TUT.inizia(), 400);
    }), 700);
  }
  ultimo = performance.now();
  requestAnimationFrame(loop);
}

/* ===================================================================
   ACCESSORI DI STATO
   =================================================================== */
G.mappa = ()=> G.maps[G.mappaId];
G.stagione = ()=> DATA.SEASONS[G.stagioneIdx];

G.livello = function(k){
  const xp = G.skills[k]||0;
  let l=0;
  for(let i=1;i<DATA.XP_LIV.length;i++) if(xp>=DATA.XP_LIV[i]) l=i;
  return l;
};

G.xp = function(k, n){
  const prima = G.livello(k);
  G.skills[k] = (G.skills[k]||0) + n;
  const dopo = G.livello(k);
  if(dopo>prima){
    SND.play('livello');
    UI.toast(DATA.SKILLS[k].nome+' — livello '+dopo+'!','gold');
    if(k==='agricoltura'){ G.energiaMax += 8; }
    if(k==='raccolta'){ G.energiaMax += 6; }
    if(k==='estrazione'){ G.energiaMax += 6; }
    if(k==='pesca'){ G.energiaMax += 6; }
    G.energia = Math.min(G.energiaMax, G.energia+20);
    particelleTesto(G.p.px, G.p.py-40, 'LIVELLO '+dopo, '#ffe270');
  }
};

/* --- inventario --- */
G.conta = function(id){
  let n=0;
  for(const s of G.inv) if(s && s.id===id) n+=s.n;
  return n;
};
G.puoiAggiungere = function(id, n){
  n=n||1;
  for(const s of G.inv) if(s && s.id===id) return true;
  return G.inv.findIndex((s,i)=>i<G.invMax && !s) >= 0;
};
G.aggiungi = function(id, n){
  n=n||1;
  for(let i=0;i<G.invMax;i++){
    const s=G.inv[i];
    if(s && s.id===id){ s.n+=n; return true; }
  }
  for(let i=0;i<G.invMax;i++){
    if(!G.inv[i]){ G.inv[i]={id,n}; costruisciHotbar(); return true; }
  }
  return false;
};
G.togli = function(id, n){
  n=n||1;
  for(let i=0;i<G.invMax && n>0;i++){
    const s=G.inv[i];
    if(s && s.id===id){
      const q=Math.min(n, s.n);
      s.n-=q; n-=q;
      if(s.n<=0) G.inv[i]=null;
    }
  }
  costruisciHotbar();
  return n<=0;
};
G.togliSlot = function(i, n){
  const s=G.inv[i];
  if(!s) return;
  s.n -= (n||1);
  if(s.n<=0) G.inv[i]=null;
  costruisciHotbar();
  G.aggiornaHUD();
};
G.slot = ()=> G.inv[G.slotSel];

G.prezzoVendita = function(id){
  let p = IT.prezzo(id);
  const c = IT.cat(id);
  if(c==='raccolto') p = Math.round(p * (1 + G.livello('agricoltura')*0.03));
  if(c==='foraggio') p = Math.round(p * (1 + G.livello('raccolta')*0.03));
  if(c==='pesce')    p = Math.round(p * (1 + G.livello('pesca')*0.03));
  if(c==='minerale') p = Math.round(p * (1 + G.livello('estrazione')*0.02));
  // mercato dinamico: oggi un prodotto è più richiesto
  if(G.mercato && G.mercato.item===id) p = Math.round(p * G.mercato.mult);
  return p;
};

/* ===================================================================
   HUD
   =================================================================== */
function costruisciHotbar(){
  const hb = $('#hotbar');
  hb.innerHTML='';
  for(let i=0;i<9;i++){
    const s = G.inv[i];
    const d = document.createElement('div');
    d.className='slot'+(i===G.slotSel?' sel':'');
    if(s){
      d.appendChild(UI.ico(s.id));
      if(s.n>1){ const q=document.createElement('span'); q.className='qty'; q.textContent=s.n; d.appendChild(q); }
      d.title = IT.nome(s.id);
    }
    const k=document.createElement('span'); k.className='key'; k.textContent=i+1;
    d.appendChild(k);
    d.onclick=()=>{ G.slotSel=i; costruisciHotbar(); SND.play('menu'); };
    hb.appendChild(d);
  }
  aggiornaNomeHotbar();
}

/* etichetta col nome dell'oggetto selezionato, sopra la barra */
function aggiornaNomeHotbar(){
  const el = $('#hotbar-name');
  if(!el) return;
  const s = G.inv[G.slotSel];
  if(!s){ el.classList.add('hidden'); return; }
  const cat = IT.cat(s.id);
  const etichette = { attrezzo:'Attrezzo', seme:'Semi', raccolto:'Raccolto',
    foraggio:'Trovato nel bosco', pesce:'Pesce', minerale:'Minerale',
    materiale:'Materiale', artigianato:'Artigianato', cibo:'Cibo',
    animale:'Prodotto', speciale:'Speciale' };
  const tag = etichette[cat] ? `<span class="nkind">${etichette[cat]}</span>  ` : '';
  el.innerHTML = tag + IT.nome(s.id);
  el.classList.remove('hidden');
  // riavvia l'animazione a ogni cambio
  el.style.animation='none'; void el.offsetWidth; el.style.animation='';
  if(window.TUT) TUT.notifica('slot');
}

G.aggiornaHUD = function(){
  $('#goldtext').textContent = G.oro.toLocaleString('it-IT');
  const pct = Math.max(0, Math.min(100, G.energia/G.energiaMax*100));
  $('#energyfill').style.height = pct+'%';
  $('#energytext').textContent = Math.max(0,Math.round(G.energia));
  $('#energybox .vbar').classList.toggle('low', pct<30);

  const o = Math.floor(G.ora);
  const h = Math.floor(o/60), mi = Math.floor((o%60)/10)*10;
  const h12 = h>=24 ? h-24 : h;
  $('#timetext').textContent = h12+':'+String(mi).padStart(2,'0');
  $('#datetext').textContent = G.stagione().nome+' '+G.giorno;

  const si = $('#season-icon');
  if(si.dataset.s !== G.stagione().id){
    si.dataset.s = G.stagione().id;
    si.innerHTML=''; si.appendChild(ART.uiIcon(G.stagione().id));
  }
  const wi = $('#weather-icon');
  if(wi.dataset.w !== G.meteo){
    wi.dataset.w = G.meteo;
    wi.innerHTML=''; wi.appendChild(ART.uiIcon(DATA.METEO[G.meteo].icona));
  }
  $('#weathertext').textContent = DATA.GIORNI_SETTIMANA[G.giornoTot%7];
};

/* ===================================================================
   CICLO PRINCIPALE
   =================================================================== */
const MS_PER_MIN = 500;

function loop(ts){
  if(!G.inGioco) return;
  const dt = Math.min(50, ts-ultimo);
  ultimo = ts;
  G.tempoMs += dt;

  // il pannello può essere stato aperto/ridimensionato senza emettere "resize"
  if(window.innerWidth > 0 && cvs.width !== window.innerWidth){
    REND.resize(); REND.initMeteo();
  }

  const bloccato = UI.modalAperta() || UI.dialogoAttivo() ||
                   !$('#letter').classList.contains('hidden') ||
                   !$('#daycard').classList.contains('hidden') ||
                   G.p.dorme || pesca.attiva;

  // il vento gira sempre: anche a menu aperto l'erba continua a muoversi
  FX.aggiornaVento(dt, G.meteo==='vento' ? 2.1 :
                       (G.meteo==='temporale' ? 2.6 :
                       (G.meteo==='pioggia' ? 1.4 : 1)));

  if(!bloccato){
    accum += dt;
    while(accum >= MS_PER_MIN){
      accum -= MS_PER_MIN;
      avanzaMinuto();
    }
    aggiornaGiocatore(dt);
    aggiornaNPC(dt);
    aggiornaAnimali(dt);
    MOBS.aggiorna(G, dt);
  }
  if(pesca.attiva) aggiornaPesca(dt);

  if(window.TUT) TUT.aggiorna();

  aggiornaParticelle(dt);
  aggiornaCamera(false);
  calcolaBersaglio();
  REND.disegna(G);

  requestAnimationFrame(loop);
}

function avanzaMinuto(){
  G.ora++;
  if(Math.floor(G.ora)%10===0) G.aggiornaHUD();
  // svenimento
  if(G.ora >= 1560){
    sveniamo();
  }
}

/* ===================================================================
   GIOCATORE
   =================================================================== */
const tasti = {};

function aggiornaGiocatore(dt){
  const p = G.p;
  const m = G.mappa();

  // uso attrezzo in corso
  if(p.usoT>0){ p.usoT -= dt; if(p.usoT<0) p.usoT=0; }

  // battito di ciglia
  p.blinkT -= dt;
  if(p.blinkT<=0){ p.blink = !p.blink; p.blinkT = p.blink? 110 : 2200+Math.random()*3000; }

  let dx=0, dy=0;
  if(tasti['arrowleft']||tasti['a']) dx-=1;
  if(tasti['arrowright']||tasti['d']) dx+=1;
  if(tasti['arrowup']||tasti['w']) dy-=1;
  if(tasti['arrowdown']||tasti['s']) dy+=1;

  const correndo = (tasti['shift']) && G.energia>2;
  p.correndo = correndo && (dx||dy);

  if(dx||dy){
    const len = Math.hypot(dx,dy)||1;
    // velocità: sentiero più veloce
    const tSotto = WORLD.terreno(m, (p.px/T)|0, (p.py/T)|0);
    let vel = (correndo?1.9:1.18) * (tSotto==='sentiero'||tSotto==='assi'||tSotto==='lastre'?1.14:1);
    if(p.usoT>0) vel*=0.35;
    const spd = vel * dt/16;

    muovi(dx/len*spd, dy/len*spd);
    if(window.TUT) TUT.notifica('muovi');

    // direzione
    if(Math.abs(dx)>Math.abs(dy)) p.dir = dx<0?1:2;
    else if(dy) p.dir = dy<0?3:0;

    // animazione
    p.animT += dt*(correndo?1.55:1);
    const soglia = 130;
    if(p.animT>soglia){ p.animT=0; p.frame=(p.frame+1)%4; passo(); }

    if(correndo){
      G.energia -= dt*0.0012;
      if(G.energia<0) G.energia=0;
    }
  } else {
    p.frame=0; p.animT=0;
  }

  // attrezzo visibile
  const s = G.slot();
  p.attrezzoVisibile = (s && IT.cat(s.id)==='attrezzo') ? s.id : null;

  // warp
  for(const w of m.warps){
    if(p.px >= w.x*T && p.px < (w.x+w.w)*T && p.py >= w.y*T && p.py < (w.y+w.h)*T){
      cambiaMappa(w.to, w.tx, w.ty);
      break;
    }
  }
}

function muovi(dx, dy){
  const p = G.p, m = G.mappa();
  const HW = 7, HH = 5;   // mezzo hitbox ai piedi

  // X
  if(dx){
    const nx = p.px + dx;
    if(!collide(m, nx, p.py, HW, HH)) p.px = nx;
    else {
      // scivolamento sugli angoli
      const step = dx>0?1:-1;
      if(!collide(m, nx, p.py-3, HW, HH) && !collide(m, p.px, p.py-3, HW, HH)) p.py -= 0.6;
      else if(!collide(m, nx, p.py+3, HW, HH) && !collide(m, p.px, p.py+3, HW, HH)) p.py += 0.6;
    }
  }
  // Y
  if(dy){
    const ny = p.py + dy;
    if(!collide(m, p.px, ny, HW, HH)) p.py = ny;
    else {
      if(!collide(m, p.px-3, ny, HW, HH) && !collide(m, p.px-3, p.py, HW, HH)) p.px -= 0.6;
      else if(!collide(m, p.px+3, ny, HW, HH) && !collide(m, p.px+3, p.py, HW, HH)) p.px += 0.6;
    }
  }
  p.px = Math.max(4, Math.min(m.w*T-4, p.px));
  p.py = Math.max(10, Math.min(m.h*T-4, p.py));
}

function collide(m, px, py, hw, hh){
  for(const cx of [px-hw, px+hw]) for(const cy of [py-hh, py]){
    if(WORLD.solido(m, (cx/T)|0, (cy/T)|0)) return true;
  }
  return false;
}

let passoT = 0;
function passo(){
  const m = G.mappa();
  const t = WORLD.terreno(m,(G.p.px/T)|0,(G.p.py/T)|0);
  if(t==='assi') SND.play('passoLegno'); else SND.play('passo');
  // polvere
  if(t==='terra'||t==='sentiero'){
    G.particelle.push({t:'terra', x:G.p.px+(Math.random()*8-4), y:G.p.py-1,
      vx:(Math.random()-0.5)*0.3, vy:-0.15, g:0.006, vita:260, vitaMax:260, s:2, c:'#a8875b', alpha:0.6});
  }
}

/* ===================================================================
   CAMERA
   =================================================================== */
function aggiornaCamera(subito){
  const m = G.mappa();
  const {VW,VH} = REND.info();
  let tx = G.p.px - VW/2;
  let ty = G.p.py - VH/2 - 8;
  const maxX = Math.max(0, m.w*T - VW);
  const maxY = Math.max(0, m.h*T - VH);
  tx = Math.max(0, Math.min(maxX, tx));
  ty = Math.max(0, Math.min(maxY, ty));
  if(subito){ G.cam.x=tx; G.cam.y=ty; }
  else {
    G.cam.x += (tx-G.cam.x)*0.14;
    G.cam.y += (ty-G.cam.y)*0.14;
  }
}

/* ===================================================================
   BERSAGLIO
   =================================================================== */
let mouseWorld = null;

function calcolaBersaglio(){
  if(G.p.dorme){ G.bersaglio=null; return; }
  const p=G.p;
  let tx, ty;
  if(mouseWorld){
    tx = (mouseWorld.x/T)|0; ty = (mouseWorld.y/T)|0;
    const d = Math.hypot(tx*T+16-p.px, ty*T+16-p.py);
    if(d > T*2.6) mouseWorld = null;
  }
  if(!mouseWorld){
    const px=(p.px/T)|0, py=(p.py/T)|0;
    const off=[[0,1],[-1,0],[1,0],[0,-1]][p.dir];
    tx=px+off[0]; ty=py+off[1];
  }
  const s = G.slot();
  G.bersaglio = { x:tx, y:ty, ok: !!(s && azionePossibile(s.id, tx, ty)) };
}

function azionePossibile(id, tx, ty){
  const m=G.mappa();
  if(!WORLD.dentro(m,tx,ty)) return false;
  const i=WORLD.idx(m,tx,ty);
  const o=m.obj[i];
  const suolo=m.suolo[i];
  const terr=WORLD.terreno(m,tx,ty);
  const cat=IT.cat(id);

  if(id==='zappa') return m.coltivabile && !o && !suolo && (terr==='erba'||terr==='terra');
  if(id==='annaffiatoio') return (suolo && !suolo.bagnato) || terr==='acqua';
  if(id==='ascia') return !!(o && (o.t==='albero'||o.t==='ceppo'||o.t==='ramo'));
  if(id==='piccone') return !!(o && (o.t==='sasso'||o.t==='stalagmite')) || !!(suolo && !suolo.crop);
  if(id==='falce') return !!(o && (o.t==='erbaccia'||o.t==='fiori'||o.t==='cespuglio'));
  if(id==='canna') return terr==='acqua';
  if(cat==='seme') return !!(suolo && !suolo.crop);
  if(DATA.ITEMS[id] && DATA.ITEMS[id].posabile) return !o && !suolo && terr!=='acqua' && terr!=='roccia';
  if(DATA.ITEMS[id] && DATA.ITEMS[id].uso) return !!(suolo && !suolo.concime);
  return false;
}

/* ===================================================================
   AZIONE PRINCIPALE (spazio / clic sinistro)
   =================================================================== */
function usaOggetto(){
  const p=G.p, m=G.mappa();
  if(p.usoT>0) return;
  const b=G.bersaglio;
  if(!b) return;
  const tx=b.x, ty=b.y;
  if(!WORLD.dentro(m,tx,ty)) return;
  const i=WORLD.idx(m,tx,ty);
  const o=m.obj[i];
  const suolo=m.suolo[i];
  const terr=WORLD.terreno(m,tx,ty);

  // guarda verso il bersaglio
  const ddx = tx*T+16-p.px, ddy = ty*T+16-p.py;
  if(Math.abs(ddx)>Math.abs(ddy)) p.dir = ddx<0?1:2; else p.dir = ddy<0?3:0;

  const s = G.slot();

  /* --- raccolta a mani / oggetto non-attrezzo --- */
  if(o && o.t==='foraggio'){
    raccogliForaggio(tx,ty,o); return;
  }
  if(suolo && suolo.crop){
    const C=DATA.CROPS[suolo.crop.id];
    if(suolo.crop.stage >= C.fasi.length){ raccogliColtura(tx,ty,suolo); return; }
  }

  if(!s){ return; }
  const id=s.id;
  const cat=IT.cat(id);

  /* --- ATTREZZI --- */
  if(cat==='attrezzo'){
    const liv = G.attrezziLiv[id]||0;

    if(id==='zappa'){
      if(!azionePossibile(id,tx,ty)){ return; }
      if(!spendi(2 - liv*0.35)) return;
      p.usoT=280; SND.play('zappa');
      m.suolo[i]={arato:true, bagnato:false, crop:null, concime:null};
      for(let k=0;k<7;k++) G.particelle.push({t:'terra',
        x:tx*T+8+Math.random()*16, y:ty*T+14+Math.random()*10,
        vx:(Math.random()-0.5)*1.1, vy:-0.7-Math.random()*0.7, g:0.05,
        vita:420, vitaMax:420, s:2, c:Math.random()>0.5?'#8a6647':'#6d4d38'});
      // a volte argilla
      if(Math.random()<0.06 && G.aggiungi('argilla',1)){
        UI.toast('Argilla!','good','argilla'); SND.play('prendi');
      }
      if(window.TUT) TUT.notifica('zappa');
      return;
    }

    if(id==='annaffiatoio'){
      if(G.gelo){ p.usoT=260; UI.toast('L\'acqua è gelata: oggi non si annaffia.','bad'); return; }
      if(terr==='acqua'){ SND.play('acqua'); p.usoT=280; schizzo(tx,ty); return; }
      if(!suolo || suolo.bagnato) return;
      if(!spendi(2 - liv*0.35)) return;
      p.usoT=300; SND.play('acqua');
      // area a seconda del livello
      const r = liv>=3?2:(liv>=2?1:0);
      for(let yy=ty-r; yy<=ty+r; yy++) for(let xx=tx-r; xx<=tx+r; xx++){
        if(!WORLD.dentro(m,xx,yy)) continue;
        const j=WORLD.idx(m,xx,yy);
        if(m.suolo[j] && !m.suolo[j].bagnato){
          m.suolo[j].bagnato=true;
          for(let k=0;k<3;k++) G.particelle.push({t:'goccia',
            x:xx*T+6+Math.random()*20, y:yy*T+6+Math.random()*14,
            vx:(Math.random()-0.5)*0.4, vy:0.5, g:0.03, vita:340, vitaMax:340});
        }
      }
      if(window.TUT) TUT.notifica('annaffia');
      return;
    }

    if(id==='ascia'){
      if(!o) return;
      if(o.t==='ramo'){
        m.obj[i]=null; G.aggiungi('legna', 1+((Math.random()*2)|0));
        SND.play('ascia'); G.xp('raccolta',3); p.usoT=260;
        UI.toast('Legna','good','legna');
        return;
      }
      if(o.t!=='albero' && o.t!=='ceppo') return;
      if(!spendi(4 - liv*0.7)) return;
      p.usoT=320; SND.play('ascia');
      o.shake = 2.5;
      setTimeout(()=>{ if(o) o.shake=0; }, 260);
      schegge(tx,ty,'#8a6038');
      o.hp -= 1 + liv*0.6;
      if(o.hp<=0){
        SND.play('albero');
        const bonus = 1 + Math.floor(G.livello('raccolta')/3);
        if(o.t==='ceppo'){
          m.obj[i]=null;
          G.aggiungi('legna', 3+bonus);
          UI.toast('+'+(3+bonus)+' Legna','good','legna');
        } else if(o.stage===2){
          m.obj[i]={t:'ceppo', hp:4, solido:true};
          G.aggiungi('legna', 6+bonus);
          UI.toast('+'+(6+bonus)+' Legna','good','legna');
          if(Math.random()<0.35) G.aggiungi('fibra',2);
          if(Math.random()<0.14){ G.aggiungi('linfa',1); UI.toast('Linfa d\'acero!','good','linfa'); }
          // semi d'albero
          if(Math.random()<0.2){
            const spot = trovaLibero(m,tx,ty,2);
            if(spot) m.obj[WORLD.idx(m,spot.x,spot.y)]={t:'albero',kind:o.kind,stage:0,hp:2,solido:true};
          }
          G.stats.alberi++;
        } else {
          m.obj[i]=null;
          G.aggiungi('legna', 2);
        }
        G.xp('raccolta', o.stage===2?14:5);
        for(let k=0;k<12;k++) G.particelle.push({t:'foglia',
          x:tx*T+16+(Math.random()-0.5)*30, y:ty*T+4+Math.random()*20,
          vx:(Math.random()-0.5)*1.2, vy:-0.5-Math.random(), g:0.014, r:Math.random()*6.3, vr:(Math.random()-0.5)*0.2,
          vita:1200, vitaMax:1200, c:G.stagione().tree});
      }
      return;
    }

    if(id==='piccone'){
      if(suolo && !suolo.crop && !o){
        m.suolo[i]=null; SND.play('zappa'); p.usoT=240; return;
      }
      if(!o || (o.t!=='sasso' && o.t!=='stalagmite')) return;
      if(!spendi(4 - liv*0.7)) return;
      p.usoT=320; SND.play('piccone');
      if(o.t==='stalagmite'){ m.obj[i]=null; G.aggiungi('pietra',2); G.xp('estrazione',4); return; }
      o.shake=2.5;
      setTimeout(()=>{ if(o) o.shake=0; }, 240);
      schegge(tx,ty,'#a8a29a');
      o.hp -= 1 + liv*0.6;
      if(o.hp<=0){
        SND.play('roccia');
        m.obj[i]=null;
        const lv=G.livello('estrazione');
        let drop, q=1;
        if(o.carbone){ drop='carbone'; q=1+(Math.random()<0.3?1:0); }
        else if(o.kind==='pietra'){ drop='pietra'; q=1+((Math.random()*2)|0)+(lv>=5?1:0); }
        else { drop=o.kind; q=1+(Math.random()<0.25+lv*0.03?1:0); }
        G.aggiungi(drop,q);
        UI.toast('+'+q+' '+IT.nome(drop),'good',drop);
        G.xp('estrazione', o.kind==='pietra'?4:12);
        G.stats.sassi++;
        // geode → contenuto
        if(o.kind==='geode' && Math.random()<0.8){
          const tab=['quarzo','ametista','oro','gemma_luna'];
          const g=tab[Math.min(3,(Math.random()*4)|0)];
          if(Math.random()<0.12) { G.aggiungi('gemma_luna',1); UI.toast('Gemma di Luna!','gold','gemma_luna'); }
          else G.aggiungi(g,1);
        }
        for(let k=0;k<10;k++) G.particelle.push({t:'pietrisco',
          x:tx*T+16+(Math.random()-0.5)*22, y:ty*T+16+(Math.random()-0.5)*16,
          vx:(Math.random()-0.5)*1.6, vy:-0.8-Math.random()*0.8, g:0.055,
          vita:520, vitaMax:520, s:2, c:'#8a8580'});
      }
      return;
    }

    if(id==='falce'){
      if(!o) return;
      if(o.t==='erbaccia'||o.t==='fiori'){
        m.obj[i]=null; SND.play('zappa'); p.usoT=200;
        const n = 1 + (Math.random()< (0.25+G.livello('raccolta')*0.04) ? 1:0);
        G.aggiungi('fibra',n);
        G.xp('raccolta',2);
        for(let k=0;k<6;k++) G.particelle.push({t:'foglia',
          x:tx*T+16+(Math.random()-0.5)*18, y:ty*T+18,
          vx:(Math.random()-0.5)*1.1, vy:-0.6-Math.random()*0.5, g:0.02, r:Math.random()*6.3, vr:0.2,
          vita:700, vitaMax:700, c:'#7fae4a'});
        return;
      }
      if(o.t==='cespuglio'){
        if(o.bacche){
          o.bacche=false;
          const st=G.stagione().id;
          const f = {primavera:'viola', estate:'mora', autunno:'nocciola', inverno:'bacca_inverno'}[st];
          G.aggiungi(f, 1+((Math.random()*2)|0));
          UI.toast(IT.nome(f),'good',f);
          G.xp('raccolta',5); SND.play('raccolta');
        } else {
          m.obj[i]=null; G.aggiungi('fibra',2); SND.play('zappa');
        }
        p.usoT=220;
        return;
      }
      return;
    }

    if(id==='canna'){
      if(terr!=='acqua') return;
      iniziaPesca(tx,ty);
      return;
    }
    return;
  }

  /* --- SEMI --- */
  if(cat==='seme'){
    if(!suolo || suolo.crop) return;
    const cropId = DATA.ITEMS[id].seme;
    const C = DATA.CROPS[cropId];
    const inSerra = G.mappaId==='podere' && dentroSerra(tx,ty);
    if(!inSerra && C.stagioni.indexOf(G.stagione().id)<0){
      UI.toast('Non è la stagione giusta per '+C.nome+'.','bad');
      SND.play('errore');
      return;
    }
    suolo.crop = { id:cropId, stage:0, gg:0 };
    G.togli(id,1);
    SND.play('semina'); p.usoT=220;
    for(let k=0;k<5;k++) G.particelle.push({t:'terra',
      x:tx*T+10+Math.random()*12, y:ty*T+16+Math.random()*8,
      vx:(Math.random()-0.5)*0.5, vy:-0.4, g:0.03, vita:300, vitaMax:300, s:2, c:C.c1});
    if(window.TUT) TUT.notifica('semina');
    return;
  }

  /* --- CONCIME --- */
  if(DATA.ITEMS[id] && DATA.ITEMS[id].uso){
    if(!suolo || suolo.concime) return;
    suolo.concime = DATA.ITEMS[id].uso;
    G.togli(id,1);
    SND.play('semina'); p.usoT=200;
    UI.toast('Terreno migliorato.','good');
    return;
  }

  /* --- POSABILI --- */
  if(DATA.ITEMS[id] && DATA.ITEMS[id].posabile){
    if(!azionePossibile(id,tx,ty)) return;
    posa(id, tx, ty);
    return;
  }

  /* --- CIBO: mangia --- */
  if(IT.commestibile(id)){
    G.mangia(G.slotSel);
    return;
  }
}

function dentroSerra(tx,ty){
  if(!G.costruzioni.serra) return false;
  const sp = G.maps.podere.spazi.serra;
  return tx>=sp.x && tx<sp.x+sp.w && ty>=sp.y && ty<sp.y+sp.h;
}

function posa(id, tx, ty){
  const m=G.mappa();
  const i=WORLD.idx(m,tx,ty);
  const kind = DATA.ITEMS[id].posabile;
  if(kind==='sentiero'){
    m.g[i] = WORLD.ti('sentiero');
    REND.invalidaCasella(m.id, tx, ty);   // i raccordi vicini vanno ridisegnati
  } else if(kind==='cassa'){
    m.obj[i] = {t:'macchina', kind:'cassa', solido:true, slots:new Array(24).fill(null)};
  } else if(['barattoliera','botte','forno','fornace','arnia'].indexOf(kind)>=0){
    m.obj[i] = {t:'macchina', kind, solido:true, dentro:null, out:null, giorni:0, pronto:false};
  } else {
    m.obj[i] = {t:'mobile', kind, solido: kind!=='sentiero'};
    if(kind==='lanterna') m.obj[i].luce=true;
    if(kind==='spaventapasseri') m.obj[i].raggio=6;
  }
  G.togli(id,1);
  SND.play('costruisci');
}

function spendi(e){
  e = Math.max(0.4, e);
  if(G.energia < e){
    UI.toast('Sei troppo stanco. Mangia qualcosa o vai a dormire.','bad');
    SND.play('errore');
    return false;
  }
  G.energia -= e;
  G.aggiornaHUD();
  return true;
}

function trovaLibero(m,x,y,r){
  for(let k=0;k<12;k++){
    const nx=x+((Math.random()*(r*2+1))|0)-r, ny=y+((Math.random()*(r*2+1))|0)-r;
    if(WORLD.libero(m,nx,ny) && WORLD.terreno(m,nx,ny)==='erba') return {x:nx,y:ny};
  }
  return null;
}

/* ===================================================================
   RACCOLTA
   =================================================================== */
function raccogliColtura(tx,ty,suolo){
  const C=DATA.CROPS[suolo.crop.id];
  const m=G.mappa();
  let n = 1;
  const lv = G.livello('agricoltura');
  if(suolo.concime==='concime' && Math.random()<0.35) n++;
  if(Math.random() < lv*0.02) n++;
  if(C.forma==='bacca'||C.forma==='grappolo') n += (Math.random()<0.4?1:0);

  if(!G.puoiAggiungere(suolo.crop.id,n)){ UI.toast('Zaino pieno!','bad'); SND.play('errore'); return; }
  G.aggiungi(suolo.crop.id, n);
  G.stats.raccolti += n;
  SND.play('raccolta');
  G.xp('agricoltura', 8 + Math.floor(C.prezzo/12));
  UI.toast('+'+n+' '+C.nome, 'good', suolo.crop.id);
  particelleTesto(tx*T+16, ty*T, '+'+n, '#b6e06a');

  for(let k=0;k<8;k++) G.particelle.push({t:'stella',
    x:tx*T+16+(Math.random()-0.5)*20, y:ty*T+14+(Math.random()-0.5)*16,
    vx:(Math.random()-0.5)*0.8, vy:-0.5-Math.random()*0.5, g:0.01,
    vita:600, vitaMax:600, c:'#fff8d0'});

  if(C.ricresce){
    suolo.crop.stage = C.fasi.length - 1;
    suolo.crop.gg = 0;
    suolo.crop.ricrescita = C.ricresce;
  } else {
    suolo.crop = null;
  }
}

function raccogliForaggio(tx,ty,o){
  const m=G.mappa();
  const lv=G.livello('raccolta');
  let n = 1 + (Math.random()<lv*0.04?1:0);
  if(!G.puoiAggiungere(o.item,n)){ UI.toast('Zaino pieno!','bad'); return; }
  m.obj[WORLD.idx(m,tx,ty)]=null;
  G.aggiungi(o.item,n);
  SND.play('raccolta');
  G.xp('raccolta', 7);
  UI.toast('+'+n+' '+IT.nome(o.item),'good',o.item);
  for(let k=0;k<6;k++) G.particelle.push({t:'stella',
    x:tx*T+16+(Math.random()-0.5)*16, y:ty*T+16,
    vx:(Math.random()-0.5)*0.6, vy:-0.5, g:0.01, vita:520, vitaMax:520, c:'#fff4c8'});
}

/* ===================================================================
   INTERAZIONE (E / clic destro)
   =================================================================== */
function interagisci(){
  const p=G.p, m=G.mappa();
  const px=(p.px/T)|0, py=(p.py/T)|0;

  // NPC vicino
  for(const n of G.npcVivi()){
    if(Math.hypot(n.px-p.px, n.py-p.py) < 46){ parlaCon(n); return; }
  }

  // caselle intorno
  const off=[[0,1],[-1,0],[1,0],[0,-1]][p.dir];
  const cand=[[px+off[0],py+off[1]],[px,py]];
  for(const [tx,ty] of cand){
    if(!WORLD.dentro(m,tx,ty)) continue;
    const i=WORLD.idx(m,tx,ty);
    const o=m.obj[i];
    if(!o) continue;

    if(o.t==='porta'){ apriPorta(o.ed); return; }
    if(o.t==='consegna'){ apriConsegna(); return; }
    if(o.t==='bancarella' && o.kiosk){
      SND.play('menu');
      if(o.kiosk==='bacheca') UI.diario(G, 'richieste');
      else if(o.kiosk==='mercante'){
        if(G.mercante && G.mercante.presente) UI.mercante(G);
        else UI.toast('Il banco è chiuso: il mercante non è in paese oggi.','bad');
      }
      return;
    }
    if(o.t==='macchina'){
      if(o.kind==='cassa'){ UI.cassa(G,o); return; }
      if(o.pronto){ G.ritiraMacchina(o); return; }
      UI.macchina(G,o); return;
    }
    if(o.t==='mobile'){
      if(o.kind==='spaventapasseri'){ UI.toast('Fa il suo lavoro in silenzio.'); return; }
      // raccogli l'oggetto
      if(G.puoiAggiungere(idDaKind(o.kind),1)){
        G.aggiungi(idDaKind(o.kind),1); m.obj[i]=null; SND.play('prendi');
        UI.toast('Raccolto.','good');
      }
      return;
    }
    if(o.t==='pietra_rituale'){
      UI.toast('Rune consumate dal tempo. Sembrano aspettare qualcosa.');
      return;
    }
  }

  // muro di un edificio: prova la porta
  for(const [tx,ty] of cand){
    if(!WORLD.dentro(m,tx,ty)) continue;
    const o=m.obj[WORLD.idx(m,tx,ty)];
    if(o && o.t==='muro' && o.ed){ apriPorta(o.ed); return; }
  }

  // cartelli
  for(const d of m.deco){
    if(d.t==='cartello' && Math.abs(d.x-px)<=1 && Math.abs(d.y-py)<=1 && d.testo){
      UI.toast(d.testo); return;
    }
  }
}

function idDaKind(kind){
  for(const id in DATA.ITEMS) if(DATA.ITEMS[id].posabile===kind) return id;
  return 'legna';
}

function apriPorta(ed){
  if(!ed) return;
  SND.play('porta');
  switch(ed.azione){
    case 'casa': apriCasa(); break;
    case 'bottega': UI.negozio(G,'bruno'); break;
    case 'locanda': apriLocanda(); break;
    case 'fucina': UI.fucina(G); break;
    case 'santuario': apriSantuario(); break;
    case 'serafina': UI.dialogo('serafina', ['La porta è socchiusa, ma Serafina è fuori, nell\'orto.']); break;
    case 'eremita': UI.dialogo('eremita', ['La porta di legno è chiusa. L\'eremita sarà fuori, da qualche parte sulla neve.']); break;
    case 'pollaio': apriPollaio(); break;
    case 'serra': UI.toast('La serra è calda e umida. Qui puoi coltivare tutto l\'anno.'); break;
    default: UI.toast('È chiuso.'); break;
  }
}

function apriCasa(){
  UI.modal('Casa', body=>{
    const n=document.createElement('div'); n.className='muted'; n.style.marginBottom='14px';
    n.innerHTML = 'Il camino è acceso. Sul tavolo, la teiera di tua nonna.<br>'+
                  `Sono le <b>${Math.floor(G.ora/60)}:${String(Math.floor(G.ora%60/10)*10).padStart(2,'0')}</b>.`;
    body.appendChild(n);

    const bd=document.createElement('button'); bd.className='btn'; bd.style.marginBottom='8px';
    bd.textContent='Vai a dormire (fine giornata)';
    bd.onclick=()=>{ UI.chiudiModal(); dormi(); };
    body.appendChild(bd);

    if(G.costruzioni.casa2){
      const bc=document.createElement('button'); bc.className='btn blue'; bc.style.marginBottom='8px';
      bc.textContent='Usa la cucina';
      bc.onclick=()=>{ UI.chiudiModal(); UI.cucina(G); };
      body.appendChild(bc);
    }

    const bl=document.createElement('button'); bl.className='btn blue';
    bl.textContent='Leggi le lettere di Nonna Ilde';
    bl.onclick=()=>{ UI.chiudiModal(); UI.diario(G); };
    body.appendChild(bl);
  });
}

function apriPollaio(){
  const galline = G.animali.filter(a=>a.tipo==='gallina');
  UI.modal('Pollaio', body=>{
    const n=document.createElement('div'); n.className='muted'; n.style.marginBottom='12px';
    n.textContent = galline.length
      ? `${galline.length} gallina/e. Sembrano contente.`
      : 'Vuoto. Compra qualche gallina da Bruno.';
    body.appendChild(n);
    if(galline.length){
      const b=document.createElement('button'); b.className='btn';
      b.textContent='Accarezza le galline';
      b.onclick=()=>{
        SND.play('gallina');
        UI.toast('Le galline sono felici.','good');
        for(const g of galline) g.felice = Math.min(100,(g.felice||50)+12);
        for(let k=0;k<6;k++) G.particelle.push({t:'cuoricino',
          x:G.p.px+(Math.random()-0.5)*40, y:G.p.py-20-Math.random()*20,
          vx:(Math.random()-0.5)*0.3, vy:-0.5, g:0, vita:900, vitaMax:900, c:'#e04a63'});
        UI.chiudiModal();
      };
      body.appendChild(b);
    }
  });
}

function apriSantuario(){
  if(G.braci>=4){ UI.santuario(G); return; }
  if(!G.vistoFiammella){
    G.vistoFiammella = true;
    UI.dialogo('fiammella', [
      'Oh. Sei venuto davvero.',
      'Dodici inverni che questa lanterna è spenta. Cominciavo a credere di essermela sognata, la luce.',
      'Non posso riaccenderla da sola. Serve che qualcuno raccolga la valle e me la porti qui, un pezzo per stagione.',
      'Ilde lo faceva. Poi ha smesso di riuscirci.',
      'Quattro braci. Quattro nicchie. Prenditi il tempo che ti serve: io non vado da nessuna parte.'
    ], { fine:()=>UI.santuario(G) });
  } else {
    UI.santuario(G);
  }
}

function apriConsegna(){
  UI.modal('Cassa di consegna', body=>{
    const n=document.createElement('div'); n.className='muted'; n.style.marginBottom='12px';
    n.textContent='Quello che lasci qui viene ritirato durante la notte e pagato all\'alba.';
    body.appendChild(n);

    if(G.cassaConsegna.length){
      const t=document.createElement('div'); t.className='sectitle'; t.textContent='In attesa di ritiro';
      body.appendChild(t);
      let tot=0;
      for(const s of G.cassaConsegna){ tot += G.prezzoVendita(s.id)*s.n; }
      const g=document.createElement('div'); g.className='invgrid';
      G.cassaConsegna.forEach((s,k)=>{
        const c=document.createElement('div'); c.className='icell';
        c.appendChild(UI.ico(s.id));
        if(s.n>1){const q=document.createElement('span');q.className='qty';q.textContent=s.n;c.appendChild(q);}
        c.title='Riprendi '+IT.nome(s.id);
        c.onclick=()=>{
          if(!G.puoiAggiungere(s.id,s.n)) { UI.toast('Zaino pieno.','bad'); return; }
          G.aggiungi(s.id,s.n); G.cassaConsegna.splice(k,1); SND.play('prendi'); UI.aggiorna();
        };
        g.appendChild(c);
      });
      body.appendChild(g);
      const tt=document.createElement('div');
      tt.style.cssText='text-align:right;font-weight:800;color:#c9922b;margin-top:8px;font-size:15px';
      tt.textContent='Stima: '+tot+' monete';
      body.appendChild(tt);
    }

    const t2=document.createElement('div'); t2.className='sectitle'; t2.textContent='Nello zaino';
    body.appendChild(t2);
    const g2=document.createElement('div'); g2.className='invgrid';
    let n2=0;
    for(let i=0;i<G.invMax;i++){
      const s=G.inv[i];
      if(!s) continue;
      const c=IT.cat(s.id);
      if(c==='attrezzo'||c==='speciale') continue;
      if(!IT.prezzo(s.id)) continue;
      n2++;
      const cell=document.createElement('div'); cell.className='icell';
      cell.appendChild(UI.ico(s.id));
      if(s.n>1){const q=document.createElement('span');q.className='qty';q.textContent=s.n;cell.appendChild(q);}
      cell.title='Consegna '+IT.nome(s.id)+' ('+G.prezzoVendita(s.id)+' l\'uno)';
      cell.onclick=()=>{
        const ex = G.cassaConsegna.find(x=>x.id===s.id);
        if(ex) ex.n += s.n; else G.cassaConsegna.push({id:s.id, n:s.n});
        G.inv[i]=null; costruisciHotbar(); SND.play('prendi'); UI.aggiorna();
      };
      g2.appendChild(cell);
    }
    body.appendChild(g2);
    if(!n2){
      const e=document.createElement('div'); e.className='muted'; e.textContent='Niente da consegnare.';
      body.appendChild(e);
    } else {
      const b=document.createElement('button'); b.className='btn gold'; b.style.marginTop='10px';
      b.textContent='Consegna tutto il raccolto';
      b.onclick=()=>{
        for(let i=0;i<G.invMax;i++){
          const s=G.inv[i];
          if(!s) continue;
          const c=IT.cat(s.id);
          if(c!=='raccolto'&&c!=='foraggio'&&c!=='pesce'&&c!=='artigianato') continue;
          const ex=G.cassaConsegna.find(x=>x.id===s.id);
          if(ex) ex.n+=s.n; else G.cassaConsegna.push({id:s.id,n:s.n});
          G.inv[i]=null;
        }
        costruisciHotbar(); SND.play('prendi'); UI.aggiorna();
      };
      body.appendChild(b);
    }
  });
}

/* ===================================================================
   NPC
   =================================================================== */
G.npcVivi = function(){
  const m=G.mappa();
  return (m.npc||[]).filter(n=>{
    if(n.richiedePonte && !G.costruzioni.ponte) return false;
    if(n.id==='fiammella' && !G.vistoFiammella && G.braci===0) return true;
    return true;
  });
};

function aggiornaNPC(dt){
  const m=G.mappa();
  for(const n of (m.npc||[])){
    if(n.px===undefined){ n.px = n.x*T+16; n.py = n.y*T+24; n.dir=0; n.frame=0; n.animT=0; n.wait=Math.random()*3000; }
    if(n.fisso){
      n.frame=0;
      n.emote = (G.braci<4 && n.id==='fiammella') ? '!' : null;
      continue;
    }
    n.wait -= dt;
    if(n.wait>0){ n.frame=0; continue; }
    if(!n.dest){
      const g = n.giro[(Math.random()*n.giro.length)|0];
      n.dest = {x:g[0]*T+16, y:g[1]*T+24};
    }
    const dx=n.dest.x-n.px, dy=n.dest.y-n.py;
    const d=Math.hypot(dx,dy);
    if(d<3){ n.dest=null; n.wait=2200+Math.random()*5200; n.frame=0; continue; }
    const spd = 0.5*dt/16;
    const nx = n.px+dx/d*spd, ny=n.py+dy/d*spd;
    if(!WORLD.solido(m,(nx/T)|0,(ny/T)|0)){ n.px=nx; n.py=ny; }
    else { n.dest=null; n.wait=800; }
    if(Math.abs(dx)>Math.abs(dy)) n.dir = dx<0?1:2; else n.dir = dy<0?3:0;
    n.animT += dt;
    if(n.animT>170){ n.animT=0; n.frame=(n.frame+1)%4; }
    // emote se non gli hai ancora parlato oggi
    n.emote = (!G.parlatoOggi[n.id] && Math.hypot(n.px-G.p.px,n.py-G.p.py)<160) ? '!' : null;
  }
}

function parlaCon(n){
  const N = DATA.NPCS[n.id];
  const cuori = Math.floor((G.amicizia[n.id]||0)/100);
  let righe;
  if(cuori>=6 && N.amico && Math.random()<0.5) righe=[N.amico[(Math.random()*N.amico.length)|0]];
  else righe=[N.battute[(Math.random()*N.battute.length)|0]];

  if(!G.parlatoOggi[n.id]){
    G.parlatoOggi[n.id]=true;
    G.amicizia[n.id]=(G.amicizia[n.id]||0)+12;
  }

  const scelte=[];
  if(n.id==='bruno') scelte.push({testo:'🛒 Vorrei comprare qualcosa', azione:()=>UI.negozio(G,'bruno')});
  if(n.id==='tobia') scelte.push({testo:'🔨 Parliamo di attrezzi', azione:()=>UI.fucina(G)});
  if(n.id==='marisol'){
    const t=G.trame.torta;
    if(t.avviata && !t.fatta) scelte.push({testo:'💛 La torta di Ilde', azione:()=>tortaMarisol()});
    else if(!t.avviata && cuori>=2) scelte.push({testo:'💛 Mi parli di Nonna Ilde?', azione:()=>avviaTortaIlde()});
    scelte.push({testo:'🍲 Cosa c\'è di buono?', azione:()=>UI.negozio(G,'marisol')});
    scelte.push({testo:'📖 Insegnami una ricetta', azione:()=>insegnaRicetta()});
  }
  if(n.id==='serafina'){
    const t=G.trame.torta;
    if(t.avviata && !t.segreto && !t.fatta) scelte.push({testo:'💛 Il segreto della torta di Ilde', azione:()=>tortaSerafina()});
    scelte.push({testo:'🌿 Parlami della valle', azione:()=>loreSerafina()});
  }
  if(n.id==='elio'){
    const t=G.trame.pesceluna;
    if(t.avviata && !t.fatta) scelte.push({testo:'🌙 Il Pesce Luna', azione:()=>pescelunaElio()});
    else if(!t.avviata && cuori>=2) scelte.push({testo:'🌙 Parlami del Pesce Luna', azione:()=>avviaPesceLuna()});
    scelte.push({testo:'🎣 Consigli sulla pesca?', azione:()=>consigliPesca()});
  }
  if(n.id==='fiammella') scelte.push({testo:'✦ Il santuario', azione:()=>UI.santuario(G)});

  if(!G.regalatoOggi[n.id]) scelte.push({testo:'🎁 Ho un regalo per te', azione:()=>UI.regalo(G,n.id)});
  scelte.push({testo:'Ci vediamo!', azione:()=>{}});

  UI.dialogo(n.id, righe, {scelte});
}

function insegnaRicetta(){
  const nuove = DATA.CUCINA.filter(r=>!G.ricetteNote[r.id]);
  const cuori = Math.floor((G.amicizia.marisol||0)/100);
  if(!nuove.length){
    UI.dialogo('marisol',['Ti ho già insegnato tutto quello che so. Adesso tocca a te inventarne una.']);
    return;
  }
  const richiesti = Math.min(nuove.length, Math.max(0, DATA.CUCINA.length - nuove.length));
  if(cuori < richiesti){
    UI.dialogo('marisol',[
      'Le ricette non si regalano, si passano.',
      'Passa più spesso, mangia qui, raccontami com\'è andato il campo. Poi vediamo.'
    ]);
    return;
  }
  const r = nuove[0];
  G.ricetteNote[r.id]=true;
  UI.dialogo('marisol',[
    'Allora: '+IT.nome(r.id)+'.',
    'Ti serve '+Object.keys(r.ing).map(k=>IT.nome(k)+' ×'+r.ing[k]).join(', ')+'. Poco fuoco e tanta pazienza.',
    'Segnatela. Non te la ripeto.'
  ]);
  SND.play('regalo');
  UI.toast('Ricetta imparata: '+IT.nome(r.id),'gold',r.id);
}

function loreSerafina(){
  const l=[];
  if(G.braci===0) l.push('La valle non è malata. È solo rimasta al buio troppo a lungo e ha preso l\'abitudine.',
                          'Nel bosco, oltre il burrone, c\'è un santuario. Ti servirà un ponte per arrivarci: chiedi a Tobia.');
  else if(G.braci===1) l.push('Una brace. L\'aria di primavera è già diversa, l\'hai sentito?',
                               'Ilde diceva che la prima è quella che ti convince che non sei matto.');
  else if(G.braci===2) l.push('Due. Adesso la gente in paese comincia a parlarne.',
                               'Bruno finge di non crederci ma ha ricominciato a tenere aperto fino a tardi.');
  else if(G.braci===3) l.push('Tre. Manca l\'inverno, che è sempre la più difficile.',
                               'Non perché serva chissà cosa. Perché d\'inverno è più facile smettere.');
  else l.push('L\'hai riaccesa.', 'Sai cosa mi ha detto Fiammella ieri? Che aveva dimenticato il proprio colore.',
              'Adesso lo ricorda. Grazie a te. Non fare quella faccia modesta.');
  UI.dialogo('serafina', l);
}

function consigliPesca(){
  const st=G.stagione().id;
  const pesci = Object.keys(DATA.ITEMS).filter(k=>DATA.ITEMS[k].cat==='pesce' && DATA.ITEMS[k].stagioni &&
    DATA.ITEMS[k].stagioni.indexOf(st)>=0);
  const n = pesci[(Math.random()*pesci.length)|0];
  UI.dialogo('elio',[
    'In questa stagione? Cerca il '+DATA.ITEMS[n].nome+'.',
    DATA.ITEMS[n].luogo==='mare' ? 'Quello sta al largo: vai alla Costa, oltre la Piazza, e lancia dal molo.'
      : DATA.ITEMS[n].luogo==='lago' ? 'Sta nelle acque ferme: il laghetto del podere o lo stagno del bosco.'
                                     : 'Sta nella corrente. Prova il fiume del paese, dal molo.',
    DATA.ITEMS[n].notte ? 'Ah: esce solo dopo il tramonto. Portati una lanterna.' :
                          'Di giorno abbocca senza troppi problemi.'
  ]);
}

/* ===================================================================
   CATENE NARRATIVE — due storie che si sbloccano con l'amicizia.
   =================================================================== */
const TORTA_ING = { zucca:2, uovo:3, miele:2, lavanda:1 };
function ingLista(ing){ return Object.keys(ing).map(k=>IT.nome(k)+' ×'+ing[k]).join(', '); }

/* --- La torta di Nonna Ilde (Marisol + Serafina) --- */
function avviaTortaIlde(){
  G.trame.torta.avviata = true;
  UI.dialogo('marisol',[
    'Nonna Ilde... la sua torta era leggendaria. Me la portava a ogni solstizio e non mi ha mai dato la ricetta intera.',
    'Ho quasi tutti i pezzi. Mi mancano due cose: il suo <b>segreto</b> — quello lo sa Serafina, c\'era sempre — e gli <b>ingredienti</b>.',
    'Portami '+ingLista(TORTA_ING)+', fatti dire il segreto da Serafina, e la facciamo insieme. Per lei.'
  ]);
  UI.toast('Nuova storia: La torta di Nonna Ilde.','gold');
}
function tortaSerafina(){
  G.trame.torta.segreto = true;
  UI.dialogo('serafina',[
    'La torta di Ilde? Mezzo paese ha provato a rifarla. Nessuno c\'è riuscito.',
    'Il segreto non è un ingrediente raro. È il <b>tempo</b>: la lasciava nel forno spento tutta la notte, a prendersi il calore che restava.',
    'E una presa di <b>lavanda</b> nell\'impasto. Ma non dirlo in giro, o si offende mezza valle.'
  ]);
  UI.toast('Hai scoperto il segreto della torta di Ilde.','gold');
}
function tortaMarisol(){
  const t = G.trame.torta;
  const haIng = Object.keys(TORTA_ING).every(k=>G.conta(k)>=TORTA_ING[k]);
  if(t.segreto && haIng){
    for(const k in TORTA_ING) G.togli(k, TORTA_ING[k]);
    t.fatta = true;
    G.amicizia.marisol = Math.max(0,(G.amicizia.marisol||0)+150);
    G.lettere.ricetta_ilde = true;
    if(G.puoiAggiungere('torta_zucca',2)) G.aggiungi('torta_zucca',2);
    SND.play('livello');
    UI.toast('La torta di Nonna Ilde è pronta.','gold','torta_zucca');
    UI.dialogo('marisol',[
      'Aspetta... senti l\'odore? È lei. È esattamente lei.',
      'Ho capito il vero segreto solo adesso: non la faceva per il solstizio. Faceva il solstizio per avere una scusa buona per portartela.',
      'Tieni: la ricetta, scritta di suo pugno. E la prima fetta è tua.'
    ], { fine:()=>UI.lettera('ricetta_ilde') });
    return;
  }
  const mancano=[];
  if(!t.segreto) mancano.push('il segreto (parla con Serafina, nel bosco)');
  const im = Object.keys(TORTA_ING).filter(k=>G.conta(k)<TORTA_ING[k]).map(k=>IT.nome(k)+' ×'+TORTA_ING[k]);
  if(im.length) mancano.push('gli ingredienti ('+im.join(', ')+')');
  UI.dialogo('marisol',['Per la torta di Ilde manca ancora '+mancano.join(', e ')+'.']);
}

/* --- Il Pesce Luna (Elio) --- */
function avviaPesceLuna(){
  G.trame.pesceluna.avviata = true;
  UI.dialogo('elio',[
    'Il Pesce Luna. Lo so, fai quella faccia. Ma io l\'ho visto, una volta sola, da ragazzo.',
    'Grande come un piatto, con gli occhi che sembravano due lune piene. Da allora lo cerco.',
    'Se ci credi anche tu, provaci: di <b>notte</b>, nelle acque ferme del <b>lago</b>, d\'estate o d\'autunno. Se lo prendi, corri da me.'
  ]);
  UI.toast('Nuova storia: Il Pesce Luna. Pescalo di notte, nel lago.','gold');
}
function pescelunaElio(){
  const t = G.trame.pesceluna;
  if(t.preso || G.conta('pesce_luna')>0){
    t.fatta = true; t.preso = true;
    G.amicizia.elio = Math.max(0,(G.amicizia.elio||0)+150);
    const premio = 2200; G.oro += premio; G.stats.guadagno += premio;
    SND.play('livello');
    UI.toast('Elio non ci crede: hai preso il Pesce Luna! +'+premio+' monete','gold','pesce_luna');
    UI.dialogo('elio',[
      'Fermo. Fermo lì. Quello è... no. NO. È il Pesce Luna. È vero. È VERO!',
      'Dodici anni che lo dico e mi ridono dietro. E tu ci sei riuscito.',
      'Tienilo tu, mi raccomando: a me basta sapere che esiste. Prendi questa — è la colletta che tenevo da parte per chi mi avrebbe creduto. Sei tu.'
    ]);
    return;
  }
  UI.dialogo('elio',[
    'L\'hai visto? No? Esce solo di <b>notte</b>, e solo nelle acque ferme del <b>lago</b>.',
    'D\'estate e d\'autunno è più facile. Porta pazienza e una buona lanterna.'
  ]);
}

G.regala = function(npcId, idx){
  const s=G.inv[idx];
  if(!s) return;
  const N=DATA.NPCS[npcId];
  let punti = 25, reaz='piace';
  if(N.regali.ama.indexOf(s.id)>=0){ punti=110; reaz='ama'; }
  else if(N.regali.piace.indexOf(s.id)>=0){ punti=60; reaz='piace'; }
  else if(IT.prezzo(s.id)<=6){ punti=-15; reaz='no'; }
  else if(IT.cat(s.id)==='pesce' && DATA.ITEMS[s.id] && DATA.ITEMS[s.id].spazzatura){ punti=-30; reaz='no'; }

  G.togliSlot(idx,1);
  G.regalatoOggi[npcId]=true;
  G.amicizia[npcId]=Math.max(0,(G.amicizia[npcId]||0)+punti);
  if(punti>0) G.stats.regali=(G.stats.regali||0)+1;

  const risposte = {
    ama:['Ma è… è proprio quello che speravo. Grazie davvero.','Non ci posso credere. Lo tengo da conto.'],
    piace:['Che pensiero gentile. Grazie!','Oh, mi piace. Sei una brava persona.'],
    no:['…grazie? Immagino.','Lo apprezzo. Credo. Sì.']
  }[reaz];

  SND.play(punti>0?'regalo':'errore');
  if(punti>0){
    for(let k=0;k<8;k++) G.particelle.push({t:'cuoricino',
      x:G.p.px+(Math.random()-0.5)*44, y:G.p.py-16-Math.random()*24,
      vx:(Math.random()-0.5)*0.35, vy:-0.55-Math.random()*0.2, g:0,
      vita:1100, vitaMax:1100, c:reaz==='ama'?'#e04a63':'#f08a9a'});
  }
  UI.dialogo(npcId, [risposte[(Math.random()*risposte.length)|0]]);
};

/* ===================================================================
   ANIMALI
   =================================================================== */
G.aggiungiGallina = function(){
  const sp = G.maps.podere.spazi.pollaio;
  G.animali.push({
    tipo:'gallina', mappa:'podere',
    px:(sp.x+1+Math.random()*3)*T, py:(sp.y+5+Math.random()*2)*T,
    dir:1, wait:0, felice:50, uovo:true
  });
};

function aggiornaAnimali(dt){
  for(const a of G.animali){
    if(a.mappa!==G.mappaId) continue;
    a.wait -= dt;
    if(a.wait>0) continue;
    if(!a.dest){
      const m=G.maps[a.mappa];
      let base;
      if(a.tipo==='gatto'){ base={x:(G.p.px/T)|0, y:(G.p.py/T)|0, r:5}; }
      else {
        const sp=G.maps.podere.spazi.pollaio;
        base={x:sp.x+2, y:sp.y+5, r:4};
      }
      const nx=base.x+((Math.random()*base.r*2)|0)-base.r;
      const ny=base.y+((Math.random()*base.r*2)|0)-base.r;
      if(WORLD.dentro(m,nx,ny) && !WORLD.solido(m,nx,ny)) a.dest={x:nx*T+16,y:ny*T+20};
      else { a.wait=900; continue; }
    }
    const dx=a.dest.x-a.px, dy=a.dest.y-a.py, d=Math.hypot(dx,dy);
    if(d<4){ a.dest=null; a.wait=1200+Math.random()*3400; continue; }
    const spd=(a.tipo==='gatto'?0.42:0.3)*dt/16;
    a.px+=dx/d*spd; a.py+=dy/d*spd;
    a.dir = dx<0?-1:1;
  }
}

/* ===================================================================
   PESCA
   =================================================================== */
const pesca = { attiva:false, fase:'', t:0, barra:50, vBarra:0, pesceY:50, vPesce:0,
                prog:30, target:null, tx:0, ty:0, diff:2, tenuto:false };

function iniziaPesca(tx,ty){
  if(G.gelo){ UI.toast('L\'acqua è gelata: niente pesca oggi.','bad'); return; }
  if(!spendi(3)) return;
  pesca.attiva=true; pesca.fase='lancio'; pesca.t=0;
  pesca.tx=tx; pesca.ty=ty;
  G.p.usoT=400;
  SND.play('lancio');
  schizzo(tx,ty);
  $('#fishing').classList.add('hidden');
}

function scegliPesce(){
  const st=G.stagione().id;
  const notte = G.ora>1020 || G.ora<400;
  const m=G.mappa();
  const luogo = (G.mappaId==='fioralba') ? 'fiume' : (G.mappaId==='spiaggia' ? 'mare' : 'lago');
  // durante la storia del Pesce Luna, di notte al lago abbocca più spesso
  const TL = G.trame && G.trame.pesceluna;
  if(TL && TL.avviata && !TL.preso && luogo==='lago' && notte &&
     DATA.ITEMS.pesce_luna.stagioni.indexOf(st)>=0 && Math.random()<0.45){
    return 'pesce_luna';
  }
  let pool = Object.keys(DATA.ITEMS).filter(k=>{
    const I=DATA.ITEMS[k];
    if(I.cat!=='pesce') return false;
    if(I.spazzatura) return false;
    if(I.stagioni && I.stagioni.indexOf(st)<0) return false;
    if(I.luogo && I.luogo!==luogo) return false;
    if(I.notte && !notte) return false;
    if(I.raro && Math.random()>0.12) return false;
    return true;
  });
  if(!pool.length) pool=['carpa'];
  if(Math.random() < 0.14 - G.livello('pesca')*0.012){
    return ['scarpa_vecchia','alga','lattina'][(Math.random()*3)|0];
  }
  return pool[(Math.random()*pool.length)|0];
}

function aggiornaPesca(dt){
  pesca.t += dt;
  const el=$('#fishing');

  if(pesca.fase==='lancio'){
    if(pesca.t>600){ pesca.fase='attesa'; pesca.t=0; pesca.attesa=900+Math.random()*4200; }
    return;
  }
  if(pesca.fase==='attesa'){
    if(pesca.t>pesca.attesa){
      pesca.fase='abbocca'; pesca.t=0;
      SND.play('abbocca');
      UI.prompt('Abbocca! Premi <kbd>Spazio</kbd>');
      G.particelle.push({t:'splash', x:pesca.tx*T+16, y:pesca.ty*T+16, vx:0,vy:0,g:0, vita:600, vitaMax:600});
    }
    return;
  }
  if(pesca.fase==='abbocca'){
    if(pesca.t>1400){ finePesca(false,'Se n\'è andato.'); }
    return;
  }
  if(pesca.fase==='gioco'){
    const lvl = G.livello('pesca');
    const altezzaBarra = 82 + lvl*7;
    const H = 330 - altezzaBarra;

    // movimento del pesce
    pesca.vPesce += (Math.random()-0.5)*pesca.diff*0.55;
    pesca.vPesce *= 0.92;
    pesca.pesceY += pesca.vPesce;
    if(pesca.pesceY<0){ pesca.pesceY=0; pesca.vPesce*=-0.5; }
    if(pesca.pesceY>H){ pesca.pesceY=H; pesca.vPesce*=-0.5; }

    // movimento della barra
    pesca.vBarra += pesca.tenuto ? -0.42 : 0.36;
    pesca.vBarra *= 0.90;
    pesca.barra += pesca.vBarra;
    if(pesca.barra<0){ pesca.barra=0; pesca.vBarra=0; }
    if(pesca.barra>H){ pesca.barra=H; pesca.vBarra=0; }

    const dentro = pesca.pesceY >= pesca.barra-6 && pesca.pesceY <= pesca.barra+altezzaBarra-36;
    pesca.prog += dentro ? 0.075*dt*(1+lvl*0.03) : -0.06*dt;
    pesca.prog = Math.max(0, Math.min(100, pesca.prog));

    // DOM
    const bar=el.querySelector('.fish-bar');
    bar.style.height = altezzaBarra+'px';
    bar.style.top = pesca.barra+'px';
    bar.style.borderColor = dentro? 'rgba(190,240,160,.95)':'rgba(230,180,140,.7)';
    el.querySelector('.fish-target').style.top = pesca.pesceY+'px';
    el.querySelector('.fish-icon').style.top = (pesca.pesceY+11)+'px';
    el.querySelector('.fish-icon').style.left = '22px';
    el.querySelector('.fish-prog').style.height = pesca.prog+'%';

    if(pesca.prog>=100) finePesca(true);
    else if(pesca.prog<=0) finePesca(false,'Ti è scappato.');
  }
}

function iniziaLotta(){
  const id = scegliPesce();
  pesca.target = id;
  pesca.diff = DATA.ITEMS[id].diff || 2;
  pesca.fase='gioco'; pesca.t=0;
  pesca.barra=120; pesca.vBarra=0;
  pesca.pesceY=140; pesca.vPesce=0;
  pesca.prog=32;
  UI.prompt(null);
  const el=$('#fishing');
  el.classList.remove('hidden');
  el.querySelector('.fish-icon').textContent = DATA.ITEMS[id].spazzatura ? '🥾' : '🐟';
}

function finePesca(ok, msg){
  const el=$('#fishing');
  el.classList.add('hidden');
  UI.prompt(null);
  const id=pesca.target;
  pesca.attiva=false; pesca.fase=''; pesca.target=null; pesca.tenuto=false;

  if(ok && id){
    const I=DATA.ITEMS[id];
    if(G.aggiungi(id,1)){
      SND.play('pesceOk');
      UI.toast('Hai preso: '+I.nome+'!', I.spazzatura?'':'gold', id);
      if(!I.spazzatura){
        G.xp('pesca', 12 + (I.diff||1)*6);
        G.stats.pesci++;
        particelleTesto(G.p.px, G.p.py-46, I.nome, '#9fd8ee');
      }
      if(id==='pesce_luna' && G.trame && G.trame.pesceluna.avviata && !G.trame.pesceluna.preso){
        G.trame.pesceluna.preso = true;
        setTimeout(()=>UI.toast('Il Pesce Luna! Corri a mostrarlo a Elio.','gold','pesce_luna'), 600);
      }
    } else UI.toast('Zaino pieno!','bad');
  } else {
    SND.play('pesceKo');
    if(msg) UI.toast(msg,'bad');
  }
}

/* ===================================================================
   MACCHINE
   =================================================================== */
G.outputMacchina = function(kind, id){
  if(kind==='fornace') return 'lingotto_'+id;
  if(kind==='barattoliera') return 'conserva:'+id;
  if(kind==='botte') return (DATA.FRUTTA.indexOf(id)>=0 ? 'vino:' : 'succo:')+id;
  return id;
};

G.caricaMacchina = function(obj, id){
  if(G.conta(id)<1) return;
  G.togli(id,1);
  if(obj.kind==='fornace'){
    if(G.conta('carbone')<1){ UI.toast('Serve del carbone.','bad'); G.aggiungi(id,1); return; }
    G.togli('carbone',1);
  }
  obj.dentro=id;
  obj.out=G.outputMacchina(obj.kind, id);
  obj.giorni = obj.kind==='botte'?4:(obj.kind==='fornace'?1:2);
  obj.pronto=false;
  SND.play('costruisci');
  UI.toast('In lavorazione…','good');
};

G.ritiraMacchina = function(obj){
  if(!obj.pronto||!obj.out) return;
  if(!G.puoiAggiungere(obj.out,1)){ UI.toast('Zaino pieno.','bad'); return; }
  G.aggiungi(obj.out,1);
  SND.play('prendi');
  UI.toast(IT.nome(obj.out)+' pronto!','gold',obj.out);
  obj.pronto=false; obj.out=null; obj.dentro=null; obj.giorni=0;
};

/* ===================================================================
   CRAFTING / COSTRUZIONI
   =================================================================== */
G.puoiCraftare = function(r){
  for(const k in r.ing) if(G.conta(k) < r.ing[k]) return false;
  return true;
};
G.crafta = function(r, tipo){
  if(!G.puoiCraftare(r)) return;
  for(const k in r.ing) G.togli(k, r.ing[k]);
  const n = r.out||1;
  G.aggiungi(r.id, n);
  if(tipo==='cucina') G.stats.piatti=(G.stats.piatti||0)+n;
  SND.play(tipo==='cucina'?'raccolta':'costruisci');
  UI.toast((n>1?n+'× ':'')+IT.nome(r.id)+(tipo==='cucina'?' pronto!':' creato!'),'good',r.id);
  G.aggiornaHUD();
};

G.puoiCostruire = function(c){
  if(G.oro < c.costo) return false;
  for(const k in c.ing) if(G.conta(k) < c.ing[k]) return false;
  return true;
};
G.costruisci = function(c){
  if(!G.puoiCostruire(c)) return;
  G.oro -= c.costo;
  for(const k in c.ing) G.togli(k, c.ing[k]);
  G.costruzioni[c.id]=true;
  WORLD.costruisci(G.maps, c.id);
  REND.invalidaTerreno();      // ponte e serra cambiano il terreno
  if(c.id==='silo') G.invMax = Math.min(36, G.invMax+12);
  SND.play('costruisci');
  UI.toast(c.nome+' costruito!','gold');
  G.aggiornaHUD();
  if(c.id==='ponte'){
    setTimeout(()=>UI.dialogo('serafina',[
      'Il ponte è in piedi. Tobia lavora bene quando lo si paga.',
      'Adesso puoi arrivare alla radura. Vacci di giorno, la prima volta.'
    ]), 400);
  }
};

G.potenzia = function(att){
  const liv = G.attrezziLiv[att]||0;
  const u = DATA.UPGRADE[att][liv];
  if(!u) return;
  const k = Object.keys(u.ing)[0], q = u.ing[k];
  if(G.oro<u.costo || G.conta(k)<q) return;
  G.oro -= u.costo; G.togli(k,q);
  G.attrezziLiv[att]=liv+1;
  SND.play('costruisci');
  UI.toast(IT.nome(att)+' '+DATA.UPG_NOMI[liv+1]+'!','gold',att);
  G.aggiornaHUD();
};

/* ===================================================================
   SANTUARIO
   =================================================================== */
G.offri = function(bid, req, silenzioso){
  if(G.conta(req)<1) return;
  G.togli(req,1);
  if(!G.santuarioDato[bid]) G.santuarioDato[bid]=[];
  if(G.santuarioDato[bid].indexOf(req)<0) G.santuarioDato[bid].push(req);
  if(!silenzioso) SND.play('magia');
  const B = DATA.SANTUARIO.find(b=>b.id===bid);
  if(B && G.santuarioDato[bid].length>=B.req.length){
    setTimeout(()=>G.completaBrace(bid), 300);
  }
};

G.completaBrace = function(bid){
  const B = DATA.SANTUARIO.find(b=>b.id===bid);
  if(!B || G.santuario[bid]) return;
  // controlla che ci siano tutti
  const dati = G.santuarioDato[bid]||[];
  for(const r of B.req){
    if(dati.indexOf(r)<0){
      if(G.conta(r)<1) return;
      G.togli(r,1); dati.push(r);
    }
  }
  G.santuarioDato[bid]=dati;
  G.santuario[bid]=true;
  G.braci++;
  G.oro += B.premio.oro;
  G.aggiungi(B.premio.item,1);
  UI.chiudiModal();
  SND.play('brace');

  // esplosione di luce
  const cx = G.p.px, cy = G.p.py-20;
  for(let k=0;k<70;k++){
    const a=Math.random()*6.283, v=0.6+Math.random()*2.4;
    G.particelle.push({t:'stella', x:cx, y:cy,
      vx:Math.cos(a)*v, vy:Math.sin(a)*v-0.4, g:0.004,
      vita:1800, vitaMax:1800, c:B.colore});
  }

  setTimeout(()=>{
    const testi = {
      primavera:['La nicchia si accende di verde. Il calore ti arriva alle mani prima che agli occhi.',
                 'Fuori, da qualche parte, un ramo si apre di colpo.'],
      estate:['Oro. La seconda nicchia brucia d\'oro, e per un attimo l\'aria sa di grano caldo.',
              'Fiammella non dice niente. Ti guarda e basta.'],
      autunno:['Rosso e fumo. La terza brace scoppietta come un camino di novembre.',
               '"Ne manca una" dice Fiammella. "E quella è la tua."'],
      inverno:['Azzurro. L\'ultima brace non scalda: illumina.',
               'La Lanterna del Solstizio si accende tutta insieme, e il bosco intorno si vede fino in fondo.',
               'Fiammella chiude gli occhi. È la prima volta che la vedi ferma.']
    }[bid];
    UI.dialogo('fiammella', testi, { fine:()=>{
      UI.toast('+'+B.premio.oro+' monete','gold');
      G.aggiornaHUD();
      const lettera = bid;
      if(DATA.LETTERE[lettera] && !G.lettere[lettera]){
        G.lettere[lettera]=true;
        setTimeout(()=>UI.lettera(lettera, ()=>{ if(G.braci>=4) finale(); }), 600);
      } else if(G.braci>=4) finale();
    }});
  }, 1600);
};

function finale(){
  setTimeout(()=>{
    UI.modal('La Lanterna del Solstizio', body=>{
      body.innerHTML = `
        <div class="muted" style="font-size:15.5px;line-height:1.85;font-style:italic">
        La valle di Fioralba è accesa.<br><br>
        Non è successo niente di spettacolare: nessun tuono, nessun coro.
        Solo che l'erba, la mattina dopo, era di un verde che nessuno ricordava,
        e Bruno ha tenuto aperta la bottega fino a tardi senza un motivo preciso.<br><br>
        Serafina ha portato una torta al santuario, come faceva Ilde,
        e non ha spiegato perché.<br><br>
        Tu hai chiuso la porta di casa piano, perché cigola.<br><br>
        <b>Il podere è tuo. La valle, un po' anche.</b><br><br>
        <span style="font-size:13px;opacity:.75">
        La partita continua: puoi coltivare, costruire e vivere qui quanto vuoi.
        </span>
        </div>`;
      const b=document.createElement('button'); b.className='btn gold'; b.style.marginTop='16px';
      b.textContent='Continua a vivere a Fioralba';
      b.onclick=()=>UI.chiudiModal();
      body.appendChild(b);
    });
    SND.play('magia');
  }, 800);
}

/* ===================================================================
   MANGIARE
   =================================================================== */
G.mangia = function(idx){
  const s=G.inv[idx];
  if(!s) return;
  const e=IT.energia(s.id);
  if(!e){ UI.toast('Non si mangia.','bad'); return; }
  G.energia = Math.min(G.energiaMax, G.energia+e);
  G.togliSlot(idx,1);
  SND.play('raccolta');
  UI.toast('+'+e+' energia','good');
  particelleTesto(G.p.px, G.p.py-42, '+'+e, '#b6e06a');
  for(let k=0;k<6;k++) G.particelle.push({t:'stella',
    x:G.p.px+(Math.random()-0.5)*20, y:G.p.py-24,
    vx:(Math.random()-0.5)*0.5, vy:-0.5, g:0.005, vita:700, vitaMax:700, c:'#b6e06a'});
  G.aggiornaHUD();
};

/* ===================================================================
   CAMBIO MAPPA
   =================================================================== */
function cambiaMappa(id, tx, ty){
  const dest = G.maps[id];
  if(!dest) return;
  const pos = WORLD.vicinoLibero(dest, tx, ty);
  G.mappaId = id;
  if(id==='bosco')        G.stats.visitatoBosco=true;
  else if(id==='grotta')  G.stats.visitatoGrotta=true;
  else if(id==='fioralba')G.stats.visitatoPaese=true;
  G.p.px = pos.x*T+16;
  G.p.py = pos.y*T+20;
  mouseWorld=null;
  MOBS.reset();          // la fauna di una mappa non segue nell'altra
  aggiornaCamera(true);
  musicaGiusta();
  SND.ambiente(ambienteGiusto());
  UI.toast(dest.nome);
}

function musicaGiusta(){
  const m=G.mappa();
  if(!m.esterno){ SND.musica('grotta'); return; }
  const notte = G.ora>1080 || G.ora<400;
  if(notte){ SND.musica('notte'); return; }
  SND.musica(m.musica==='paese' ? 'paese' : G.stagione().id);
}

function ambienteGiusto(){
  const m=G.mappa();
  if(!m.esterno) return 'goccia';
  if(G.meteo==='pioggia') return 'pioggia';
  if(G.meteo==='temporale') return 'temporale';
  if(G.meteo==='vento') return 'vento';
  const notte = G.ora>1080 || G.ora<380;
  if(notte) return G.stagioneIdx===1 ? 'grilli' : null;
  return 'uccelli';
}

/* ===================================================================
   FINE GIORNATA
   =================================================================== */
function dormi(){
  if(G.p.dorme) return;
  G.p.dorme = true;
  SND.play('dormi');
  $('#fade').classList.add('on');
  setTimeout(()=>{ nuovoGiorno(false); }, 1100);
}

function sveniamo(){
  if(G.p.dorme) return;
  G.p.dorme = true;
  const multa = Math.min(1000, Math.floor(G.oro*0.08));
  G.oro -= multa;
  SND.play('errore');
  $('#fade').classList.add('on');
  setTimeout(()=>{
    nuovoGiorno(true, multa);
  }, 1100);
}

function nuovoGiorno(svenuto, multa){
  /* --- vendita cassa di consegna --- */
  const voci=[]; let tot=0;
  for(const s of G.cassaConsegna){
    const p = G.prezzoVendita(s.id)*s.n;
    voci.push({id:s.id, n:s.n, tot:p});
    tot += p;
  }
  G.oro += tot;
  G.stats.guadagno += tot;
  G.cassaConsegna = [];

  /* --- avanzamento data --- */
  G.giorno++; G.giornoTot++; G.stats.giorniGiocati++;
  let cambioStagione=false;
  if(G.giorno > DATA.GIORNI_STAGIONE){
    G.giorno=1;
    G.stagioneIdx=(G.stagioneIdx+1)%4;
    cambioStagione=true;
    if(G.stagioneIdx===0) G.anno++;
  }
  G.ora = 360;
  G.energia = svenuto ? G.energiaMax*0.55 : G.energiaMax;
  G.parlatoOggi={}; G.regalatoOggi={};

  /* --- meteo --- */
  G.meteo = G.meteoDomani || tiraMeteo();
  G.meteoDomani = tiraMeteo();

  /* --- colture --- */
  const stag = G.stagione().id;

  /* --- gelo invernale: fiume e pozzo gelati per un giorno --- */
  G.gelo = (stag==='inverno' && G.meteo==='neve' && Math.random()<0.5);
  /* --- mercato dinamico: oggi un prodotto vale di più --- */
  G.mercato = scegliMercato();
  /* --- bacheca: aggiorna le richieste degli abitanti --- */
  const richInfo = aggiornaRichieste();
  /* --- sagra di stagione: nuova a ogni cambio stagione --- */
  let nuovaSagra=false;
  if(!G.sagra || G.sagra.stagione !== stag){ G.sagra = creaSagra(); nuovaSagra = (G.giornoTot>0); }
  /* --- mercante ambulante: passa ogni 7 giorni --- */
  if(G.giornoTot>0 && G.giornoTot % 7 === 0){ G.mercante = { presente:true, giorno:G.giornoTot, stock:stockMercante() }; }
  else if(G.mercante){ G.mercante.presente=false; }

  for(const mid in G.maps){
    const m=G.maps[mid];
    if(!m.coltivabile) continue;
    for(let i=0;i<m.suolo.length;i++){
      const s=m.suolo[i];
      if(!s) continue;
      const x=i%m.w, y=(i/m.w)|0;
      const inSerra = dentroSerra(x,y);
      const piove = (G.meteo==='pioggia'||G.meteo==='temporale');

      if(s.crop){
        const C=DATA.CROPS[s.crop.id];
        // fuori stagione → appassisce
        if(cambioStagione && !inSerra && C.stagioni.indexOf(stag)<0){
          s.crop=null; s.appassita=true;
          continue;
        }
        const bagnata = s.bagnato || piove || inSerra;
        if(bagnata){
          if(s.crop.ricrescita){
            s.crop.gg++;
            if(s.crop.gg >= s.crop.ricrescita){ s.crop.stage=C.fasi.length; s.crop.gg=0; }
          } else if(s.crop.stage < C.fasi.length){
            s.crop.gg++;
            const need = C.fasi[Math.min(s.crop.stage, C.fasi.length-1)];
            const veloce = (s.concime==='concime' && Math.random()<0.3)
                         || (G.meteo==='temporale' && Math.random()<0.28); // il temporale spinge la crescita
            if(s.crop.gg >= need || veloce){ s.crop.stage++; s.crop.gg=0; }
          }
        }
      }
      // asciugatura
      if(piove || inSerra) s.bagnato = true;
      else if(s.concime==='ritenzione' && Math.random()<0.75) s.bagnato = s.bagnato;
      else s.bagnato = false;
    }
  }

  /* --- macchine --- */
  for(const mid in G.maps){
    const m=G.maps[mid];
    for(const o of m.obj){
      if(!o || o.t!=='macchina') continue;
      if(o.kind==='arnia'){
        o.gg=(o.gg||0)+1;
        if(o.gg>=4 && !o.pronto){ o.pronto=true; o.out='miele'; o.gg=0; }
        continue;
      }
      if(o.dentro && !o.pronto){
        o.giorni--;
        if(o.giorni<=0){ o.pronto=true; }
      }
    }
  }

  /* --- animali: uova --- */
  let uova=0;
  for(const a of G.animali){
    if(a.tipo!=='gallina') continue;
    a.felice = Math.min(100, (a.felice||50) + (G.meteo==='pioggia'?-4:3));
    if(Math.random() < 0.75 + a.felice*0.002){
      uova++;
      if(a.felice>92 && Math.random()<0.06) G.aggiungi('uovo_oro',1);
      else G.aggiungi('uovo',1);
    }
  }

  /* --- mondo --- */
  WORLD.nuovoGiorno(G.maps, stag, (G.giornoTot*7919+13)>>>0);

  /* --- evento notturno casuale (applica subito l'effetto sul mondo) --- */
  const eventoNotte = tiraEventoNotte(cambioStagione);

  /* --- eventi/lore --- */
  const eventi=[];
  if(uova) eventi.push({t:'uova', n:uova});
  if(cambioStagione) eventi.push({t:'stagione'});

  /* --- presentazione --- */
  UI.daycard(G, true);
  G.aggiornaHUD();
  costruisciHotbar();
  musicaGiusta();
  SND.ambiente(ambienteGiusto());

  setTimeout(()=>{
    $('#fade').classList.remove('on');
    SND.play('sveglia');
    setTimeout(()=>{
      UI.daycard(G, false);
      G.p.dorme=false;
      // riporta a casa
      if(G.mappaId!=='podere'){ G.mappaId='podere'; }
      G.p.px=8*T+16; G.p.py=9*T+20;
      aggiornaCamera(true);

      if(svenuto){
        UI.toast('Ti sei svegliato dolorante. Qualcuno ti ha riportato a casa (−'+multa+' monete).','bad');
      }
      if(cambioStagione){
        UI.toast('È arrivata la '+G.stagione().nome+'.','gold');
        objCacheClear();
      }
      if(uova) UI.toast(uova+' uovo/a dal pollaio.','good','uovo');

      // avviso di gelo
      if(G.gelo) setTimeout(()=>UI.toast('Gelata forte: fiume e pozzo sono ghiacciati per oggi.','bad'), 700);
      // evento della notte
      if(eventoNotte) setTimeout(()=>UI.toast(eventoNotte.msg, eventoNotte.tipo||undefined, eventoNotte.icona), 1000);
      // mercato del giorno
      if(G.mercato) setTimeout(()=>UI.toast('Mercato di oggi: '+IT.nome(G.mercato.item)+' vale ×'+G.mercato.mult+' da Bruno e alla cassa.','gold', G.mercato.item), 1400);
      // bacheca delle richieste
      if(richInfo && richInfo.nuove)   setTimeout(()=>UI.toast('📋 Nuove richieste degli abitanti: guarda il Diario (J).','gold'), 1800);
      if(richInfo && richInfo.scadute) setTimeout(()=>UI.toast(richInfo.scadute+(richInfo.scadute===1?' richiesta è scaduta.':' richieste sono scadute.'),'bad'), 2100);
      // sagra e mercante
      if(nuovaSagra) setTimeout(()=>UI.toast('🎪 È tempo della '+G.sagra.nome+': consegna i prodotti di stagione dal Diario!','gold'), 2400);
      if(G.mercante && G.mercante.presente) setTimeout(()=>UI.toast('🛒 Il mercante ambulante è in paese, oggi alla Locanda.','gold'), 2700);

      if(voci.length){
        setTimeout(()=>UI.riepilogo(G, voci, tot, dopoRisveglio), 500);
      } else {
        dopoRisveglio();
      }
      G.salva();
    }, 900);
  }, 1900);
}

function dopoRisveglio(){
  UI.toast(DATA.RISVEGLI[(Math.random()*DATA.RISVEGLI.length)|0]);
  // primo accesso al bosco → dialogo di Serafina
  if(G.stats.giorniGiocati===2 && !G.introSerafina){
    G.introSerafina=true;
    setTimeout(()=>UI.dialogo('serafina',[
      'Ti ho visto arrivare l\'altro ieri. Non ti ho salutato perché stavo parlando con un rovo.',
      'Sono Serafina. Sto nel bosco, a sud del tuo campo.',
      'Ilde ti ha lasciato più di un podere, sai. Quando vorrai saperne di più, passa.'
    ]), 900);
  }
}

function objCacheClear(){
  // la grafica stagionale viene rigenerata alla prima richiesta
}

function tiraMeteo(){
  const st=G.stagione().id;
  const r=Math.random();
  if(st==='inverno'){
    if(r<0.42) return 'neve';
    if(r<0.55) return 'nuvoloso';
    if(r<0.62) return 'vento';
    return 'sereno';
  }
  if(st==='primavera'){
    if(r<0.26) return 'pioggia';
    if(r<0.33) return 'temporale';
    if(r<0.48) return 'nuvoloso';
    return 'sereno';
  }
  if(st==='estate'){
    if(r<0.14) return 'pioggia';
    if(r<0.20) return 'temporale';
    if(r<0.30) return 'nuvoloso';
    return 'sereno';
  }
  // autunno
  if(r<0.24) return 'pioggia';
  if(r<0.30) return 'temporale';
  if(r<0.42) return 'vento';
  if(r<0.56) return 'nuvoloso';
  return 'sereno';
}

/* ===================================================================
   MERCATO DINAMICO — ogni giorno un prodotto è più richiesto
   =================================================================== */
function scegliMercato(){
  const pool = Object.keys(DATA.ITEMS).filter(k=>{
    const I=DATA.ITEMS[k];
    return I && I.prezzo>0 && !I.spazzatura &&
           (I.cat==='raccolto'||I.cat==='foraggio'||I.cat==='pesce'||I.cat==='animale');
  });
  if(!pool.length) return null;
  const item = pool[(Math.random()*pool.length)|0];
  const mult = Math.round((1.6 + Math.random()*0.6)*10)/10; // ×1.6–×2.2
  return { item, mult };
}

/* ===================================================================
   EVENTI NOTTURNI — piccole sorprese tra una notte e l'altra.
   Ogni evento applica subito l'effetto sul mondo e ritorna il messaggio
   (o null se stanotte non aveva nulla da fare).
   =================================================================== */
function eventiNotturniPossibili(){
  const st = G.stagione().id;
  const seed = (G.giornoTot*2654435761 + 77)>>>0;
  return [
    { icona:'legna', tipo:'', applica(){
        const n = WORLD.spargiSu(G.maps.bosco,'erba',7,R=>({t:'ramo', v:(R()*3)|0}), seed);
        return n ? 'Vento forte nella notte: il bosco è disseminato di rami caduti.' : null;
    }},
    { icona:'zappa', tipo:'bad', applica(){
        const m=G.maps.podere, colti=[];
        for(let i=0;i<m.suolo.length;i++){ const s=m.suolo[i]; if(s && s.crop) colti.push(i); }
        if(!colti.length) return null;
        const n = Math.min(colti.length, 1 + ((Math.random()*2)|0));
        for(let k=0;k<n;k++){
          const i = colti.splice((Math.random()*colti.length)|0,1)[0];
          m.suolo[i].crop=null; m.suolo[i].appassita=true;
        }
        return 'I cinghiali hanno rovistato l\'orto: '+n+(n===1?' coltura calpestata.':' colture calpestate.');
    }},
    { icona:'ametista', tipo:'good', applica(){
        const n = WORLD.spargiSu(G.maps.grotta,'grotta',8,R=>WORLD.sasso(['ametista','quarzo','oro'][(R()*3)|0]), seed);
        return n ? 'Luna piena: nella miniera sono affiorate gemme in abbondanza.' : null;
    }},
    { icona:'viola', tipo:'good', applica(){
        const forSt = Object.keys(DATA.ITEMS).filter(k=>DATA.ITEMS[k].cat==='foraggio' && DATA.ITEMS[k].stagione===st);
        if(!forSt.length) return null;
        const n = WORLD.spargiSu(G.maps.bosco,'erba',6,R=>({t:'foraggio', item:forSt[(R()*forSt.length)|0]}), seed);
        return n ? 'Una nidiata di lucciole: il sottobosco è tornato a fiorire.' : null;
    }},
    { icona:'carpa', tipo:'good', applica(){
        if(!G.puoiAggiungere('carpa',1)) return null;
        G.aggiungi('carpa',1);
        return 'Il gatto randagio ha lasciato un pesce sulla soglia di casa.';
    }},
    { icona:'miele', tipo:'good', applica(){
        if(!G.puoiAggiungere('miele',1)) return null;
        G.aggiungi('miele',1);
        return 'Le api hanno lavorato tutta la notte: un vasetto di miele sul davanzale.';
    }}
  ];
}

function tiraEventoNotte(cambioStagione){
  if(cambioStagione) return null;          // la notte di cambio stagione ha già il suo annuncio
  if(Math.random() < 0.40) return null;    // notte tranquilla
  const L = eventiNotturniPossibili();
  // pesca a caso finché uno ha davvero un effetto da mostrare
  while(L.length){
    const e = L.splice((Math.random()*L.length)|0, 1)[0];
    const msg = e.applica();
    if(msg) return { icona:e.icona, tipo:e.tipo, msg };
  }
  return null;
}

/* ===================================================================
   RICHIESTE DEGLI ABITANTI — piccole missioni a tempo (bacheca).
   Ogni giorno la bacheca si aggiorna: si tolgono le scadute, si
   mantengono 2–3 richieste attive. Consegni entro la scadenza per
   ottenere monete e amicizia.
   =================================================================== */
function generaRichiesta(npcId){
  const N = DATA.NPCS[npcId]; if(!N) return null;
  const pool = Object.keys(DATA.ITEMS).filter(k=>{
    const I = DATA.ITEMS[k];
    return I && I.prezzo>0 && I.prezzo<=140 && !I.spazzatura &&
           ['raccolto','foraggio','pesce','animale','materiale'].indexOf(I.cat)>=0;
  });
  if(!pool.length) return null;
  const gusti = ((N.regali && N.regali.piace) || []).filter(id=>DATA.ITEMS[id] && !DATA.ITEMS[id].spazzatura);
  let item = (gusti.length && Math.random()<0.5) ? gusti[(Math.random()*gusti.length)|0]
                                                 : pool[(Math.random()*pool.length)|0];
  if(!item) return null;
  const prezzo = IT.prezzo(item);
  const qta = Math.max(2, Math.min(12, Math.round(60/Math.max(6,prezzo)) + 1 + ((Math.random()*3)|0)));
  const premio = Math.round(prezzo*qta*1.5) + 60;             // paga più che venderli
  const amicizia = 40 + ((Math.random()*4)|0)*15;            // +40..85 amicizia
  const giorni = 2 + ((Math.random()*3)|0);                  // scade tra 2–4 giorni
  G.richiestaSeq = (G.richiestaSeq||0)+1;
  return { id:'rq'+G.richiestaSeq, npc:npcId, item, qta,
           scadenza:G.giornoTot+giorni, premio, amicizia, fatta:false };
}

function aggiornaRichieste(){
  if(!Array.isArray(G.richieste)) G.richieste = [];
  let scadute=0;
  G.richieste = G.richieste.filter(r=>{
    if(r.fatta) return false;
    if(G.giornoTot > r.scadenza){ scadute++; return false; }
    return true;
  });
  const npcKeys = Object.keys(DATA.NPCS).filter(id=>id!=='fiammella');
  const target = 2 + ((Math.random()*2)|0);                  // mantieni 2–3 richieste attive
  let nuove=0, guard=0;
  while(G.richieste.length < target && guard++ < 30){
    const usati  = new Set(G.richieste.map(r=>r.npc));        // un solo incarico per abitante alla volta
    const liberi = npcKeys.filter(id=>!usati.has(id));
    if(!liberi.length) break;
    const r = generaRichiesta(liberi[(Math.random()*liberi.length)|0]);
    if(r){ G.richieste.push(r); nuove++; }
  }
  return { scadute, nuove };
}

/* consegna una richiesta: toglie gli oggetti, dà monete e amicizia */
G.completaRichiesta = function(r){
  if(!r || r.fatta) return false;
  if(G.conta(r.item) < r.qta) return false;
  G.togli(r.item, r.qta);
  G.oro += r.premio; G.stats.guadagno += r.premio;
  G.amicizia[r.npc] = Math.max(0,(G.amicizia[r.npc]||0)+r.amicizia);
  r.fatta = true;
  G.richieste = G.richieste.filter(x=>x!==r);
  G.stats.richiesteFatte = (G.stats.richiesteFatte||0)+1;
  SND.play('regalo');
  return true;
};

/* ===================================================================
   SAGRE DI STAGIONE — una sfida a scadenza per ogni stagione.
   Consegna prodotti della stagione entro il giorno 28 per un grande
   premio in monete e amicizia con tutto il paese.
   =================================================================== */
const SAGRE = {
  primavera:{ nome:'Sagra dei Germogli',  icona:'fragola',        req:18, premio:2400 },
  estate:   { nome:'Festa del Sole',       icona:'girasole',       req:20, premio:2800 },
  autunno:  { nome:'Sagra del Raccolto',   icona:'zucca',          req:24, premio:3600 },
  inverno:  { nome:'Fiera del Solstizio',  icona:'radice_inverno', req:14, premio:3000 }
};
function creaSagra(){
  const st = G.stagione().id, S = SAGRE[st];
  return { stagione:st, nome:S.nome, icona:S.icona, req:S.req, progresso:0, premio:S.premio,
           scadenza: G.giornoTot + (DATA.GIORNI_STAGIONE - G.giorno), // fino a fine stagione
           fatta:false, riscossa:false };
}
function sagraQualifica(id, season){
  const I = DATA.ITEMS[id]; if(!I) return false;
  if(I.cat==='raccolto' && I.crop && DATA.CROPS[I.crop]) return DATA.CROPS[I.crop].stagioni.indexOf(season)>=0;
  if(I.cat==='foraggio') return I.stagione===season;
  return false;
}
/* quante cose di stagione ho nello zaino, buone per la sagra */
G.sagraDisponibili = function(){
  if(!G.sagra) return 0;
  let n=0;
  for(const s of G.inv) if(s && sagraQualifica(s.id, G.sagra.stagione)) n+=s.n;
  return n;
};
/* versa nella sagra quanti più prodotti di stagione possibile */
G.contribuisciSagra = function(){
  if(!G.sagra || G.sagra.fatta) return 0;
  const st = G.sagra.stagione;
  let bisogno = G.sagra.req - G.sagra.progresso, messi=0;
  for(let i=0;i<G.inv.length && messi<bisogno;i++){
    const s=G.inv[i];
    if(!s || !sagraQualifica(s.id, st)) continue;
    const prendi = Math.min(s.n, bisogno-messi);
    G.togliSlot(i, prendi);
    messi += prendi;
  }
  G.sagra.progresso += messi;
  if(G.sagra.progresso >= G.sagra.req) G.sagra.fatta = true;
  if(messi) SND.play('prendi');
  return messi;
};
G.riscuotiSagra = function(){
  if(!G.sagra || !G.sagra.fatta || G.sagra.riscossa) return false;
  G.oro += G.sagra.premio; G.stats.guadagno += G.sagra.premio;
  for(const id in DATA.NPCS){ if(id==='fiammella') continue; G.amicizia[id]=(G.amicizia[id]||0)+30; }
  G.sagra.riscossa = true;
  G.stats.sagre = (G.stats.sagre||0)+1;
  SND.play('livello');
  return true;
};

/* ===================================================================
   MERCANTE AMBULANTE — ogni 7 giorni passa dalla Locanda con roba rara.
   =================================================================== */
function stockMercante(){
  const pool=[];
  // semi di ogni stagione (utili se hai la serra)
  for(const st in DATA.SHOP) for(const id of DATA.SHOP[st]){
    if(DATA.ITEMS[id]) pool.push({ id, prezzo: Math.round((DATA.ITEMS[id].prezzo||20)*2.6) });
  }
  // materiali e gemme rare + concimi
  for(const id of ['gemma_luna','lingotto_oro','ametista','quarzo','cristallia','concime','concime_acqua']){
    if(DATA.ITEMS[id]) pool.push({ id, prezzo: Math.max(4, Math.round(IT.prezzo(id)*1.7)) });
  }
  // dedup per id
  const visti=new Set(), uniq=[];
  for(const it of pool){ if(visti.has(it.id)) continue; visti.add(it.id); uniq.push(it); }
  // mischia e prendi 5–6 pezzi
  for(let i=uniq.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; const t=uniq[i]; uniq[i]=uniq[j]; uniq[j]=t; }
  return uniq.slice(0, 5 + ((Math.random()*2)|0));
}

function apriLocanda(){
  if(G.mercante && G.mercante.presente){
    UI.modal('Locanda del Tasso Storto', body=>{
      const n=document.createElement('div'); n.className='muted'; n.style.marginBottom='12px';
      n.textContent='C\'è ressa stasera: un mercante ambulante ha messo su banco vicino al camino.';
      body.appendChild(n);
      const b1=document.createElement('button'); b1.className='btn'; b1.style.marginBottom='8px';
      b1.textContent='Bottega di Marisol';
      b1.onclick=()=>{ UI.chiudiModal(); UI.negozio(G,'marisol'); };
      body.appendChild(b1);
      const b2=document.createElement('button'); b2.className='btn gold';
      b2.textContent='🛒 Mercante ambulante';
      b2.onclick=()=>{ UI.chiudiModal(); UI.mercante(G); };
      body.appendChild(b2);
    });
  } else {
    UI.negozio(G,'marisol');
  }
}

/* ===================================================================
   LUCI
   =================================================================== */
G.luci = function(){
  const out=[];
  const m=G.mappa();
  const notte = REND.luceAmbiente(G.ora, G.meteo, m.esterno).a > 0.05;
  if(!notte) return out;

  // giocatore
  out.push({x:G.p.px, y:G.p.py-14, r:74, i:0.55, caldo:true, f:0});

  const x0=Math.max(0,((G.cam.x/T)|0)-3), y0=Math.max(0,((G.cam.y/T)|0)-3);
  const {VW,VH}=REND.info();
  const x1=Math.min(m.w-1, ((G.cam.x+VW)/T|0)+3), y1=Math.min(m.h-1,((G.cam.y+VH)/T|0)+3);

  for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){
    const o=m.obj[WORLD.idx(m,x,y)];
    if(!o) continue;
    if(o.t==='lampione') out.push({x:x*T+16, y:y*T+2, r:96, i:0.85, caldo:true, f:x*0.7});
    else if(o.t==='mobile' && o.kind==='lanterna') out.push({x:x*T+16, y:y*T+8, r:88, i:0.8, caldo:true, f:x});
    else if(o.t==='macchina' && (o.kind==='forno'||o.kind==='fornace') && o.dentro)
      out.push({x:x*T+16, y:y*T+18, r:64, i:0.7, caldo:true, f:y});
  }
  // funghi luminosi
  for(const d of m.deco){
    if(d.t==='fungo_luce' && d.x>=x0-2 && d.x<=x1+2 && d.y>=y0-2 && d.y<=y1+2)
      out.push({x:d.x*T+16, y:d.y*T+18, r:52, i:0.55, caldo:false, f:d.v});
  }
  // finestre degli edifici
  for(const e of m.edifici){
    if(e.azione==='chiuso' && Math.random()>0.5) continue;
    out.push({x:(e.x+e.w/2)*T, y:(e.y+e.h-1)*T, r:110, i:0.6, caldo:true, f:e.x});
  }
  // santuario
  if(m.id==='bosco' && G.braci>0){
    const s=m.edifici.find(e=>e.kind==='santuario');
    if(s) out.push({x:(s.x+s.w/2)*T, y:(s.y+s.h-1)*T, r:60+G.braci*34, i:0.5+G.braci*0.12, caldo:true, f:0});
  }
  return out;
};

/* ===================================================================
   PARTICELLE
   =================================================================== */
function aggiornaParticelle(dt){
  const m=G.mappa();
  const f = dt/16;
  for(let i=G.particelle.length-1;i>=0;i--){
    const p=G.particelle[i];
    p.vita -= dt;
    if(p.vita<=0){ G.particelle.splice(i,1); continue; }
    p.x += (p.vx||0)*f;
    p.y += (p.vy||0)*f;
    if(p.g) p.vy = (p.vy||0) + p.g*f;
    if(p.vr) p.r = (p.r||0) + p.vr*f;
    if(p.t==='lucciola'){ p.f = (p.f||0) + 0.05*f; }
  }

  // ambiente: foglie / petali / lucciole
  if(m.esterno && G.particelle.length < 90){
    const st=G.stagione().id;
    const {VW,VH}=REND.info();
    if(st==='autunno' && Math.random()<0.09*f){
      G.particelle.push({t:'foglia',
        x:G.cam.x-20+Math.random()*(VW+40), y:G.cam.y-20,
        vx:0.3+Math.random()*0.7, vy:0.25+Math.random()*0.35, g:0,
        r:Math.random()*6.3, vr:(Math.random()-0.5)*0.09,
        vita:9000, vitaMax:9000, c:['#d9713c','#c47a2c','#b8562c','#e0a03c'][(Math.random()*4)|0], alpha:0.9});
    }
    if(st==='primavera' && Math.random()<0.07*f){
      G.particelle.push({t:'petalo',
        x:G.cam.x-20+Math.random()*(VW+40), y:G.cam.y-20,
        vx:0.25+Math.random()*0.5, vy:0.2+Math.random()*0.3, g:0,
        r:Math.random()*6.3, vr:(Math.random()-0.5)*0.07,
        vita:9000, vitaMax:9000, c:['#f5a6c0','#f8c8d8','#fff0f4'][(Math.random()*3)|0], alpha:0.85});
    }
    const notte = G.ora>1090 || G.ora<380;
    if(notte && (st==='estate'||st==='primavera'||m.id==='bosco') && Math.random()<0.05*f){
      G.particelle.push({t:'lucciola',
        x:G.cam.x+Math.random()*VW, y:G.cam.y+40+Math.random()*(VH-60),
        vx:(Math.random()-0.5)*0.22, vy:(Math.random()-0.5)*0.16, g:0,
        f:Math.random()*6.3, vita:7000, vitaMax:7000});
    }
  }
}

function particelleTesto(x,y,testo,col){
  G.particelle.push({t:'testo', x, y, vx:0, vy:-0.42, g:0, testo, c:col||'#fff8d0',
                     vita:1100, vitaMax:1100});
}

function schegge(tx,ty,col){
  for(let k=0;k<7;k++) G.particelle.push({t:'schegge',
    x:tx*T+16+(Math.random()-0.5)*18, y:ty*T+16+(Math.random()-0.5)*14,
    vx:(Math.random()-0.5)*1.5, vy:-0.7-Math.random()*0.7, g:0.05,
    vita:420, vitaMax:420, s:2, c:col});
}

function schizzo(tx,ty){
  G.particelle.push({t:'splash', x:tx*T+16, y:ty*T+16, vx:0,vy:0,g:0, vita:700, vitaMax:700});
  for(let k=0;k<6;k++) G.particelle.push({t:'goccia',
    x:tx*T+16, y:ty*T+16, vx:(Math.random()-0.5)*1.4, vy:-0.8-Math.random()*0.6, g:0.06,
    vita:500, vitaMax:500});
}

/* ===================================================================
   OBIETTIVI / STATISTICHE
   =================================================================== */
G.obiettivi = function(){
  const s=G.stats, o=[];
  // conta (id,nome,icona,desc, valore corrente, traguardo, premio in monete)
  const cont=(id,nome,icona,desc,cur,tot,premio)=>o.push({
    id, nome, icona, desc, premio,
    prog: Math.min(tot,cur)+'/'+tot, fatto: cur>=tot });
  // traguardo booleano (fatto/da fare)
  const flag=(id,nome,icona,desc,ok,premio)=>o.push({
    id, nome, icona, desc, premio,
    prog: ok?'fatto':'da fare', fatto: !!ok });

  cont('mani_terra','Mani nella terra','zappa','Raccogli 50 prodotti dal campo.', s.raccolti,50,500);
  cont('boscaiolo','Boscaiolo','legna','Abbatti 25 alberi.', s.alberi,25,500);
  cont('cuore_pietra','Cuore di pietra','piccone','Frantuma 100 rocce.', s.sassi,100,600);
  cont('pescatore','Pescatore paziente','canna','Pesca 30 pesci.', s.pesci,30,700);
  cont('cuoco','Ai fornelli','frittata','Cucina 20 piatti in cucina.', s.piatti||0,20,800);
  cont('generoso','Cuore generoso','miele','Fai 15 regali graditi agli abitanti.', s.regali||0,15,700);
  cont('factotum','Persona di fiducia','medaglione','Completa 15 richieste della bacheca.', s.richiesteFatte||0,15,1200);
  cont('festaiolo','Anima delle sagre','melagrana','Vinci 3 sagre di stagione.', s.sagre||0,3,1500);
  flag('esploratore','Conosci la valle','viola','Visita bosco, miniera e paese.',
       s.visitatoBosco && s.visitatoGrotta && s.visitatoPaese, 400);
  flag('ponte','Il ponte','legna','Costruisci il ponte per la radura.', G.costruzioni.ponte, 400);
  flag('serra','Sotto vetro','seme_cristallia','Costruisci la serra.', G.costruzioni.serra, 800);
  cont('benestante','Benestante','lingotto_oro','Accumula 50.000 monete guadagnate.', s.guadagno,50000,3000);
  return o;
};

/* riscuoti la ricompensa di un traguardo completato */
G.riscuotiObiettivo = function(o){
  if(!o || !o.fatto) return false;
  if(!G.obiettiviRiscossi) G.obiettiviRiscossi={};
  if(G.obiettiviRiscossi[o.id]) return false;
  G.obiettiviRiscossi[o.id]=true;
  if(o.premio){ G.oro += o.premio; }
  SND.play('livello');
  return true;
};

G.statistiche = function(){
  return [
    ['Giorni al podere', G.stats.giorniGiocati],
    ['Prodotti raccolti', G.stats.raccolti],
    ['Alberi abbattuti', G.stats.alberi],
    ['Rocce frantumate', G.stats.sassi],
    ['Pesci pescati', G.stats.pesci],
    ['Guadagno totale', G.stats.guadagno.toLocaleString('it-IT')+' monete'],
    ['Braci accese', G.braci+'/4'],
    ['Stagione', G.stagione().nome+' '+G.giorno+', Anno '+G.anno]
  ];
};

/* ===================================================================
   SALVATAGGIO
   =================================================================== */
const CHIAVE='fioralba_save_v1';

function serializzaMappa(m){
  const obj={}, suolo={};
  for(let i=0;i<m.obj.length;i++){
    const o=m.obj[i];
    if(!o || o.t==='muro' || o.t==='porta') continue;
    obj[i]=o;
  }
  for(let i=0;i<m.suolo.length;i++) if(m.suolo[i]) suolo[i]=m.suolo[i];
  return { g:Array.from(m.g), obj, suolo, deco:m.deco.length };
}

function deserializzaMappa(m, d){
  if(!d) return;
  if(d.g && d.g.length===m.g.length) m.g = Uint8Array.from(d.g);
  for(let i=0;i<m.obj.length;i++){
    const o=m.obj[i];
    if(o && (o.t==='muro'||o.t==='porta')) continue;
    m.obj[i]=null;
  }
  for(const k in d.obj) m.obj[k|0]=d.obj[k];
  m.suolo = new Array(m.w*m.h).fill(null);
  for(const k in d.suolo) m.suolo[k|0]=d.suolo[k];
}

function costruisciDati(){
  return {
    v:1,
    nomeGiocatore:G.nomeGiocatore, mappaId:G.mappaId,
    oro:G.oro, energia:G.energia, energiaMax:G.energiaMax,
    giorno:G.giorno, stagioneIdx:G.stagioneIdx, anno:G.anno, giornoTot:G.giornoTot,
    ora:G.ora, meteo:G.meteo, meteoDomani:G.meteoDomani,
    inv:G.inv, invMax:G.invMax, slotSel:G.slotSel,
    skills:G.skills, attrezziLiv:G.attrezziLiv,
    amicizia:G.amicizia, costruzioni:G.costruzioni,
    santuario:G.santuario, santuarioDato:G.santuarioDato, braci:G.braci,
    lettere:G.lettere, ricetteNote:G.ricetteNote,
    cassaConsegna:G.cassaConsegna, stats:G.stats, animali:G.animali,
    look:G.look, vistoFiammella:G.vistoFiammella, introSerafina:G.introSerafina,
    tutorialFatto:G.tutorialFatto, mercato:G.mercato, gelo:G.gelo,
    richieste:G.richieste, richiestaSeq:G.richiestaSeq,
    obiettiviRiscossi:G.obiettiviRiscossi, sagra:G.sagra, mercante:G.mercante, trame:G.trame,
    px:G.p.px, py:G.p.py,
    maps:(function(){ const o={}; for(const k in G.maps) o[k]=serializzaMappa(G.maps[k]); return o; })()
  };
}

G.salva = function(){
  try{
    localStorage.setItem(CHIAVE, JSON.stringify(costruisciDati()));
    return true;
  }catch(e){ console.warn('Salvataggio non riuscito', e); return false; }
};

/* ---- Esporta il salvataggio come file .json scaricabile ---- */
G.esporta = function(){
  try{
    const testo = JSON.stringify(costruisciDati());
    const blob = new Blob([testo], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const nome = (G.nomeGiocatore||'contadino').replace(/[^a-z0-9]/gi,'_');
    const data = new Date().toISOString().slice(0,10);
    a.href = url;
    a.download = `fioralba-${nome}-anno${G.anno}-${data}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 1500);
    return true;
  }catch(e){ console.warn('Export non riuscito', e); return false; }
};

/* ---- Valida un testo e lo scrive come salvataggio corrente ---- */
G.importaTesto = function(testo){
  let d;
  try{ d = JSON.parse(testo); }
  catch(e){ return {ok:false, err:'Il file non è leggibile: non è un salvataggio valido.'}; }
  if(!d || typeof d!=='object' || !d.maps || !d.inv){
    return {ok:false, err:'Questo file non sembra un salvataggio di Fioralba.'};
  }
  try{ localStorage.setItem(CHIAVE, JSON.stringify(d)); }
  catch(e){ return {ok:false, err:'Impossibile memorizzare il salvataggio (memoria locale bloccata).'}; }
  return {ok:true};
};

/* ---- Apre il selettore file e importa; al successo ricarica ---- */
G.importaDaFile = function(){
  const inp = document.createElement('input');
  inp.type='file'; inp.accept='.json,application/json';
  inp.style.display='none';
  inp.onchange = ()=>{
    const file = inp.files && inp.files[0];
    if(!file){ inp.remove(); return; }
    const rd = new FileReader();
    rd.onload = ()=>{
      const res = G.importaTesto(String(rd.result||''));
      if(res.ok){
        flashMessaggio('Salvataggio importato! Riavvio…', true);
        try{ sessionStorage.setItem('fioralba_import','1'); }catch(e){}
        setTimeout(()=>location.reload(), 800);
      }else{
        flashMessaggio(res.err||'Import non riuscito.', false);
      }
      inp.remove();
    };
    rd.onerror = ()=>{ flashMessaggio('Non riesco a leggere il file.', false); inp.remove(); };
    rd.readAsText(file);
  };
  document.body.appendChild(inp);
  inp.click();
};

/* ---- Messaggio a comparsa indipendente dall'HUD (funziona anche al titolo) ---- */
function flashMessaggio(testo, ok){
  const el = document.createElement('div');
  el.textContent = testo;
  el.style.cssText =
    'position:fixed;left:50%;top:22px;transform:translateX(-50%);z-index:100000;'+
    'background:'+(ok?'rgba(79,122,66,.96)':'rgba(179,72,60,.96)')+';color:#f6e6c8;'+
    'font-family:Nunito,system-ui,sans-serif;font-weight:800;font-size:15px;'+
    'padding:12px 20px;border-radius:12px;border:2px solid rgba(0,0,0,.35);'+
    'box-shadow:0 6px 18px rgba(0,0,0,.45);max-width:90vw;text-align:center;';
  document.body.appendChild(el);
  setTimeout(()=>{ el.style.transition='opacity .4s'; el.style.opacity='0'; setTimeout(()=>el.remove(),450); }, 2400);
}

function caricaGrezzo(){
  try{ return localStorage.getItem(CHIAVE); }catch(e){ return null; }
}

function carica(){
  const raw = caricaGrezzo();
  if(!raw) return false;
  try{
    const d = JSON.parse(raw);
    Object.assign(G, statoIniziale());
    G.maps = WORLD.crea();

    for(const k of ['nomeGiocatore','mappaId','oro','energia','energiaMax','giorno','stagioneIdx',
                    'anno','giornoTot','ora','meteo','meteoDomani','inv','invMax','slotSel',
                    'skills','attrezziLiv','amicizia','costruzioni','santuario','santuarioDato',
                    'braci','lettere','ricetteNote','cassaConsegna','stats','animali','look',
                    'vistoFiammella','introSerafina','tutorialFatto','mercato','gelo',
                    'richieste','richiestaSeq','obiettiviRiscossi','sagra','mercante','trame']){
      if(d[k]!==undefined) G[k]=d[k];
    }
    // ricostruisci le costruzioni sbloccate
    for(const id in G.costruzioni) if(G.costruzioni[id]) WORLD.costruisci(G.maps, id);
    if(d.maps){
      for(const k in d.maps) if(G.maps[k]) deserializzaMappa(G.maps[k], d.maps[k]);
    }
    G.p.look = G.look;
    G.p.px = d.px||8*T+16;
    G.p.py = d.py||10*T+16;
    return true;
  }catch(e){ console.warn('Caricamento fallito', e); return false; }
}

/* ===================================================================
   INPUT
   =================================================================== */
function collegaInput(){
  window.addEventListener('keydown', e=>{
    const k = e.key.toLowerCase();
    if(['arrowup','arrowdown','arrowleft','arrowright',' '].indexOf(k)>=0) e.preventDefault();
    if(k==='shift'){ tasti['shift']=true; }
    tasti[k]=true;
    SND.resume();
    attivita();

    if(!G.inGioco) return;

    // dialoghi
    if(UI.dialogoAttivo()){
      if(k===' '||k==='enter'||k==='e'){ UI.avanzaDialogo(); }
      if(k==='escape') UI.chiudiDialogo();
      return;
    }
    // lettera
    if(!$('#letter').classList.contains('hidden')){
      if(k===' '||k==='enter'||k==='escape') $('#letter').querySelector('.letter-btn').click();
      return;
    }
    // modali
    if(UI.modalAperta()){
      if(k==='escape'||k==='i'||k==='c'||k==='j'||k==='m') UI.chiudiModal();
      return;
    }
    // pesca
    if(pesca.attiva){
      if(k===' '){
        if(pesca.fase==='abbocca') iniziaLotta();
        else if(pesca.fase==='gioco') pesca.tenuto=true;
      }
      if(k==='escape') finePesca(false,'Hai mollato la lenza.');
      return;
    }

    if(k>='1'&&k<='9'){ G.slotSel=parseInt(k)-1; costruisciHotbar(); return; }
    switch(k){
      case ' ': usaOggetto(); break;
      case 'e': case 'enter': interagisci(); break;
      case 'i': UI.inventario(G); break;
      case 'c': UI.artigianato(G); break;
      case 'j': UI.diario(G); break;
      case 'm': UI.mappa(G); break;
      case 'escape': UI.menu(G); break;
      case 'q': gettaOggetto(); break;
      case 'f': schermoIntero(); break;
    }
  });

  window.addEventListener('keyup', e=>{
    const k=e.key.toLowerCase();
    tasti[k]=false;
    if(k==='shift') tasti['shift']=false;
    if(k===' ' && pesca.attiva) pesca.tenuto=false;
  });

  // mouse
  cvs.addEventListener('mousemove', e=>{
    if(!G.inGioco) return;
    const r=cvs.getBoundingClientRect();
    mouseWorld = REND.schermoAMondo(e.clientX-r.left, e.clientY-r.top, G.cam);
  });
  cvs.addEventListener('mouseleave', ()=>{ mouseWorld=null; });
  cvs.addEventListener('mousedown', e=>{
    if(!G.inGioco) return;
    SND.resume();
    attivita();
    if(UI.modalAperta()||UI.dialogoAttivo()) return;
    const r=cvs.getBoundingClientRect();
    mouseWorld = REND.schermoAMondo(e.clientX-r.left, e.clientY-r.top, G.cam);
    if(pesca.attiva){
      if(pesca.fase==='abbocca') iniziaLotta();
      else if(pesca.fase==='gioco') pesca.tenuto=true;
      return;
    }
    if(e.button===0){ calcolaBersaglio(); usaOggetto(); }
    else if(e.button===2){ interagisci(); }
  });
  cvs.addEventListener('mouseup', ()=>{ if(pesca.attiva) pesca.tenuto=false; });
  cvs.addEventListener('contextmenu', e=>e.preventDefault());
  cvs.addEventListener('wheel', e=>{
    if(!G.inGioco || UI.modalAperta()) return;
    e.preventDefault();
    attivita();
    G.slotSel = (G.slotSel + (e.deltaY>0?1:-1) + 9) % 9;
    costruisciHotbar();
  }, {passive:false});

  // pulsanti HUD
  $('#btn-inv').onclick   = ()=>UI.inventario(G);
  $('#btn-craft').onclick = ()=>UI.artigianato(G);
  $('#btn-quest').onclick = ()=>UI.diario(G);
  $('#btn-map').onclick   = ()=>UI.mappa(G);
  $('#btn-menu').onclick  = ()=>UI.menu(G);

  // touch: movimento verso il tocco + azione
  let touchStart=null;
  cvs.addEventListener('touchstart', e=>{
    SND.resume();
    attivita();
    if(!G.inGioco) return;
    const t=e.touches[0];
    const r=cvs.getBoundingClientRect();
    touchStart={x:t.clientX-r.left, y:t.clientY-r.top, t:Date.now()};
    if(pesca.attiva){
      if(pesca.fase==='abbocca') iniziaLotta();
      else if(pesca.fase==='gioco') pesca.tenuto=true;
    }
  }, {passive:true});
  cvs.addEventListener('touchmove', e=>{
    if(!G.inGioco||!touchStart) return;
    const t=e.touches[0];
    const r=cvs.getBoundingClientRect();
    const dx=(t.clientX-r.left)-touchStart.x, dy=(t.clientY-r.top)-touchStart.y;
    tasti['a']=dx<-18; tasti['d']=dx>18;
    tasti['w']=dy<-18; tasti['s']=dy>18;
  }, {passive:true});
  cvs.addEventListener('touchend', e=>{
    tasti['a']=tasti['d']=tasti['w']=tasti['s']=false;
    if(pesca.attiva){ pesca.tenuto=false; touchStart=null; return; }
    if(touchStart && Date.now()-touchStart.t < 220){
      calcolaBersaglio();
      usaOggetto();
    }
    touchStart=null;
  }, {passive:true});
}

/* ===================================================================
   TOOLTIP D'ESPLORAZIONE
   Quando il giocatore resta fermo, un piccolo invito a scoprire il mondo.
   Prima suggerisce le cose che non ha ancora provato, poi consigli vari.
   =================================================================== */
let hintPrec = '';
function attivita(){ G.ultimaAzione = performance.now(); }

function suggerimentiEsplorazione(){
  const s = G.stats, c = G.costruzioni, nuovi = [];
  // 1) cose ancora da scoprire (le più utili per chi comincia)
  if(s.raccolti===0)      nuovi.push('Prova a zappare la terra, pianta un seme e annaffialo: la fattoria nasce così. 🌱');
  if(s.pesci===0)         nuovi.push('Hai una canna: lanciala nell\'acqua del fiume o del lago e tieni premuto Spazio. 🎣');
  if(s.alberi===0)        nuovi.push('Con l\'ascia abbatti gli alberi del bosco e fai scorta di legna. 🪓');
  if(!s.visitatoPaese)    nuovi.push('A ovest c\'è il paese di Fioralba: da Bruno compri semi e vendi il raccolto. 🏘️');
  if(!s.visitatoBosco)    nuovi.push('A sud si apre il bosco: funghi, foraggio e l\'erborista Serafina ti aspettano. 🌲');
  if(!s.visitatoGrotta)   nuovi.push('A nord del paese c\'è la miniera: col piccone trovi minerali e gemme. ⛏️');
  if((s.regali||0)===0)   nuovi.push('Fai un regalo agli abitanti: ognuno ha i suoi gusti e l\'amicizia cresce. 🎁');
  if(!c.ponte)            nuovi.push('Il fabbro Tobia può costruirti il ponte per la radura del Santuario. 🌉');
  if((s.piatti||0)===0)   nuovi.push('In cucina combini gli ingredienti in piatti che danno più energia. 🍳');
  if(nuovi.length) return nuovi;

  // 2) consigli generali per chi ha già girato un po'
  return [
    'Parla ogni giorno con gli abitanti: ricordano quello che dici. 💬',
    'Nel Diario, alla scheda Richieste, gli abitanti chiedono aiuto e pagano bene. 📋',
    'Ogni stagione ha la sua sagra: consegna i prodotti dal Diario per un gran premio. 🎪',
    'Ogni tanto un mercante ambulante passa dalla Locanda con merce rara. 🛒',
    'Riscuoti i Traguardi completati nel Diario: sono monete che aspettano te. 🏆',
    'Fai amicizia con Marisol ed Elio: custodiscono due storie speciali da scoprire. 💛',
    'A sud del paese apri la Piazza del Porto, e da lì scendi fino alla Costa a pescare. 🏖️',
    'In fondo alla miniera ci sono scale che scendono: più giù, più gemme rare. 💎',
    'Oltre la miniera, a nord, un passo innevato nasconde un eremita e minerali preziosi. 🏔️',
    'Il Santuario nel bosco chiede i frutti delle quattro stagioni. Porta ciò che matura. 🏮',
    'La cassa di consegna vicino a casa paga durante la notte: riempila prima di dormire. 📦',
    'Con una serra coltivi anche fuori stagione. 🪴',
    'Alla Locanda, Marisol insegna nuove ricette se le porti qualcosa di speciale. 🍲',
    'Di notte, al molo, abboccano pesci che di giorno non vedrai mai. 🌙',
    'Guarda il meteo di domani accanto all\'orologio: se pioverà, stanotte non serve annaffiare. ☔',
    'Concima il terreno per raccolti più ricchi e più veloci. ✨',
    'Ogni giorno un prodotto vale di più al mercato: vendi quello per guadagnare di più. 🪙'
  ];
}

function mostraHintEsplora(){
  if(!G.inGioco || G.p.dorme || pesca.attiva) return;
  if(UI.modalAperta() || UI.dialogoAttivo()) return;
  if(!$('#letter').classList.contains('hidden')) return;
  if(!$('#tutorial').classList.contains('hidden')) return;         // non disturbare durante la guida
  if(!G.tutorialFatto && (G.stats.giorniGiocati||0) < 1) return;   // lascia respirare i primi minuti
  const idle = performance.now() - (G.ultimaAzione || 0);
  if(idle < 22000) return;                                         // fermo da almeno ~22 secondi

  const pool = suggerimentiEsplorazione();
  let msg = pool[(Math.random()*pool.length)|0];
  for(let g=0; msg===hintPrec && pool.length>1 && g<6; g++) msg = pool[(Math.random()*pool.length)|0];
  hintPrec = msg;
  UI.toast(msg, 'hint');
  G.ultimaAzione = performance.now();                              // riparte il conteggio: niente raffiche
}
setInterval(mostraHintEsplora, 6000);

function gettaOggetto(){
  const s=G.slot();
  if(!s) return;
  if(IT.cat(s.id)==='attrezzo'){ UI.toast('Meglio tenerlo.','bad'); return; }
  G.togliSlot(G.slotSel, 1);
  SND.play('menu');
}

function schermoIntero(){
  if(!document.fullscreenElement) document.documentElement.requestFullscreen().catch(()=>{});
  else document.exitFullscreen().catch(()=>{});
}

/* ===================================================================
   AVVIO
   =================================================================== */
window.addEventListener('load', init);

/* salvataggio automatico ogni 2 minuti */
setInterval(()=>{ if(G.inGioco && !G.p.dorme) G.salva(); }, 120000);
window.addEventListener('beforeunload', ()=>{ if(G.inGioco) G.salva(); });

})();
