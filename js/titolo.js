/* ===================================================================
   FIORALBA — titolo.js
   Lo sfondo animato della schermata iniziale: cielo, stelle, sole,
   nuvole, montagne, colline, il laghetto che riflette il tramonto, il
   paese, il santuario con la lanterna accesa, i campi del podere,
   l'albero in cornice, le lucciole, gli uccelli. Si disegna in piccolo
   e si ingrandisce a pixel interi, come il canvas di gioco.

   Stava dentro game.js e da solo ne occupava 389 righe su 4884 — l'8%
   del file — pur non avendo niente a che fare col gioco: misurato, non
   chiama nessuna funzione privata di game.js e usa un globale solo,
   ART. Era il pezzo più grosso e più staccabile che ci fosse là dentro.

   `avvia()` comincia chiamando `ferma()`. Finché la funzione era privata
   partiva una volta sola, dal boot; ora che è pubblica una seconda
   chiamata lascerebbe due requestAnimationFrame a disegnare sullo
   stesso canvas, e la scena andrebbe al doppio della velocità.
   =================================================================== */
(function(){

const $ = s=>document.querySelector(s);

const TIT = {};
window.TITOLO = TIT;

let titoloRaf = null;

TIT.ferma = function(){
  if(titoloRaf) cancelAnimationFrame(titoloRaf);
  titoloRaf = null;
};

TIT.avvia = function(){
  TIT.ferma();
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

    // come il canvas di gioco: si lavora in pixel fisici con ingrandimento intero,
    // altrimenti su schermi in scala i pixel del disegno risultano irregolari
    const cw = Math.max(320, window.innerWidth  || 0);
    const ch = Math.max(240, window.innerHeight || 0);
    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    const dw = Math.round(cw*dpr), dh = Math.round(ch*dpr);
    const SC = Math.max(1, Math.round((cw < 700 ? 2 : 3)*dpr));
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
    cx.drawImage(off, 0, 0, W*SC, H*SC);

    titoloRaf = requestAnimationFrame(frame);
  }
  frame();
};

})();
