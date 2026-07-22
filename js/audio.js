/* ===================================================================
   FIORALBA — audio.js
   Musica e suoni generati proceduralmente con WebAudio.
   Nessun file audio esterno.
   =================================================================== */
(function(){
'use strict';

const S = {};
window.SND = S;

let ctx = null, master = null, musicGain = null, sfxGain = null;
let started = false;
S.volMusica = 0.34;
S.volSfx = 0.5;
S.attivo = true;

S.init = function(){
  if(ctx) return;
  try{
    ctx = new (window.AudioContext||window.webkitAudioContext)();
  }catch(e){ S.attivo=false; return; }
  master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
  musicGain = ctx.createGain(); musicGain.gain.value = S.volMusica; musicGain.connect(master);
  sfxGain = ctx.createGain(); sfxGain.gain.value = S.volSfx; sfxGain.connect(master);

  // riverbero leggero condiviso
  const conv = ctx.createConvolver();
  conv.buffer = makeReverb(1.8, 2.4);
  const rvGain = ctx.createGain(); rvGain.gain.value = 0.22;
  conv.connect(rvGain); rvGain.connect(master);
  S._reverb = conv;
};

function makeReverb(sec, decay){
  const rate = ctx.sampleRate, len = rate*sec;
  const buf = ctx.createBuffer(2, len, rate);
  for(let ch=0; ch<2; ch++){
    const d = buf.getChannelData(ch);
    for(let i=0;i<len;i++){
      d[i] = (Math.random()*2-1) * Math.pow(1-i/len, decay);
    }
  }
  return buf;
}

S.resume = function(){
  if(!ctx) S.init();
  if(ctx && ctx.state==='suspended') ctx.resume();
};

S.setVol = function(m, s){
  if(m!==undefined){ S.volMusica=m; if(musicGain) musicGain.gain.value=m; }
  if(s!==undefined){ S.volSfx=s; if(sfxGain) sfxGain.gain.value=s; }
};

/* ------------------------------------------------------------------
   SUONI
   ------------------------------------------------------------------ */
function env(node, t0, a, d, peak){
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0+a);
  g.gain.exponentialRampToValueAtTime(0.0001, t0+a+d);
  node.connect(g);
  return g;
}

function tone(freq, dur, type, vol, t0, detune, glide){
  if(!ctx || !S.attivo) return;
  t0 = t0 || ctx.currentTime;
  const o = ctx.createOscillator();
  o.type = type||'sine';
  o.frequency.setValueAtTime(freq, t0);
  if(glide) o.frequency.exponentialRampToValueAtTime(Math.max(20,glide), t0+dur);
  if(detune) o.detune.value = detune;
  const g = env(o, t0, Math.min(0.02,dur*0.2), dur, vol||0.2);
  g.connect(sfxGain);
  o.start(t0); o.stop(t0+dur+0.08);
}

function noise(dur, vol, filterFreq, t0, type, q){
  if(!ctx || !S.attivo) return;
  t0 = t0 || ctx.currentTime;
  const len = Math.max(1,(ctx.sampleRate*dur)|0);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for(let i=0;i<len;i++) d[i] = (Math.random()*2-1) * (1 - i/len);
  const src = ctx.createBufferSource(); src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = type||'lowpass'; f.frequency.value = filterFreq||1200; f.Q.value = q||1;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol||0.2, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0+dur);
  src.connect(f); f.connect(g); g.connect(sfxGain);
  src.start(t0); src.stop(t0+dur+0.02);
}

const SFX = {
  zappa(){ noise(0.16,0.34,900,0,'lowpass'); tone(140,0.13,'triangle',0.16,0,0,80); },
  acqua(){
    noise(0.5,0.16,2600,0,'bandpass',1.5);
    for(let i=0;i<6;i++) tone(700+Math.random()*900, 0.1, 'sine', 0.05, ctx.currentTime+i*0.05);
  },
  ascia(){ noise(0.2,0.4,700,0,'lowpass'); tone(180,0.16,'square',0.1,0,0,70); },
  albero(){ noise(0.9,0.32,420,0,'lowpass'); tone(90,0.8,'triangle',0.16,0,0,40); },
  piccone(){ noise(0.13,0.36,3200,0,'highpass'); tone(320,0.1,'square',0.1,0,0,150); },
  roccia(){ noise(0.42,0.34,900,0,'lowpass'); tone(120,0.32,'triangle',0.14,0,0,55); },
  raccolta(){
    const t=ctx.currentTime;
    [660,880,1100].forEach((f,i)=>tone(f,0.13,'triangle',0.14,t+i*0.045));
  },
  semina(){ noise(0.14,0.16,1600,0,'bandpass'); tone(420,0.09,'sine',0.09); },
  prendi(){ tone(880,0.08,'triangle',0.13); tone(1320,0.07,'sine',0.07,ctx.currentTime+0.04); },
  moneta(){
    const t=ctx.currentTime;
    tone(1180,0.09,'square',0.09,t); tone(1560,0.13,'square',0.08,t+0.06);
  },
  errore(){ tone(200,0.14,'square',0.1); tone(150,0.16,'square',0.09,ctx.currentTime+0.09); },
  menu(){ tone(720,0.05,'triangle',0.09); },
  passo(){ noise(0.07,0.09,480,0,'lowpass'); },
  passoLegno(){ noise(0.06,0.11,900,0,'lowpass'); tone(220,0.04,'sine',0.04); },
  porta(){ noise(0.3,0.2,600,0,'lowpass'); tone(160,0.24,'triangle',0.1,0,0,110); },
  dormi(){
    const t=ctx.currentTime;
    [392,330,262].forEach((f,i)=>tone(f,0.8,'sine',0.11,t+i*0.28));
  },
  sveglia(){
    const t=ctx.currentTime;
    [523,659,784,1047].forEach((f,i)=>tone(f,0.5,'triangle',0.11,t+i*0.11));
  },
  livello(){
    const t=ctx.currentTime;
    [523,659,784,1047,1319].forEach((f,i)=>tone(f,0.55,'triangle',0.13,t+i*0.085));
  },
  costruisci(){
    const t=ctx.currentTime;
    noise(0.2,0.3,800,t,'lowpass');
    [330,440,550].forEach((f,i)=>tone(f,0.3,'triangle',0.11,t+i*0.1));
  },
  abbocca(){ tone(500,0.09,'square',0.12); tone(700,0.09,'square',0.11,ctx.currentTime+0.07); },
  lancio(){ noise(0.3,0.14,1800,0,'bandpass'); tone(600,0.24,'sine',0.07,0,0,240); },
  pesceOk(){
    const t=ctx.currentTime;
    [659,784,988,1319].forEach((f,i)=>tone(f,0.42,'triangle',0.13,t+i*0.09));
    noise(0.4,0.14,1400,t,'bandpass');
  },
  pesceKo(){ tone(300,0.2,'sawtooth',0.09,0,0,140); noise(0.3,0.1,700,0,'lowpass'); },
  regalo(){
    const t=ctx.currentTime;
    [784,988,1175].forEach((f,i)=>tone(f,0.4,'sine',0.12,t+i*0.09));
  },
  brace(){
    const t=ctx.currentTime;
    [262,330,392,523,659,784].forEach((f,i)=>{
      tone(f,1.6,'sine',0.1,t+i*0.13);
      tone(f*2,1.2,'triangle',0.04,t+i*0.13);
    });
    noise(1.4,0.1,900,t,'lowpass');
  },
  magia(){
    const t=ctx.currentTime;
    for(let i=0;i<8;i++) tone(660+i*110,0.3,'sine',0.06,t+i*0.05);
  },
  gallina(){
    const t=ctx.currentTime;
    tone(760,0.09,'square',0.07,t,0,900);
    tone(620,0.12,'square',0.06,t+0.11,0,520);
  },
  gatto(){
    tone(620,0.4,'sine',0.08,0,0,780);
  },
  tuono(){
    const t=ctx.currentTime;
    noise(1.6,0.3,220,t,'lowpass');
    tone(52,1.4,'sine',0.14,t,0,32);
  }
};

S.play = function(name){
  if(!S.attivo) return;
  if(!ctx) S.init();
  if(!ctx) return;
  if(ctx.state==='suspended') ctx.resume();
  const f = SFX[name];
  if(f) try{ f(); }catch(e){}
};

/* ------------------------------------------------------------------
   MUSICA — sequencer pentatonico
   ------------------------------------------------------------------ */
const SCALE = {
  primavera:[0,2,4,7,9,12,14,16],
  estate:   [0,2,4,7,9,12,14,16],
  autunno:  [0,3,5,7,10,12,15,17],
  inverno:  [0,2,3,7,9,12,14,15],
  notte:    [0,3,5,7,10,12,15,17],
  grotta:   [0,1,5,7,8,12,13,17],
  paese:    [0,2,4,5,7,9,11,12]
};
const ROOT = { primavera:262, estate:294, autunno:220, inverno:196, notte:196, grotta:165, paese:247 };

let seqTimer = null, seqStep = 0, curTrack = null, pendingTrack = null;

function nf(root, scale, deg, oct){
  const s = scale[((deg%scale.length)+scale.length)%scale.length];
  const o = oct + Math.floor(deg/scale.length);
  return root * Math.pow(2, (s + o*12)/12);
}

function pluck(freq, t0, dur, vol, wave){
  const o = ctx.createOscillator();
  o.type = wave||'triangle';
  o.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001,t0);
  g.gain.exponentialRampToValueAtTime(vol,t0+0.015);
  g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
  const f = ctx.createBiquadFilter();
  f.type='lowpass'; f.frequency.setValueAtTime(2600,t0);
  f.frequency.exponentialRampToValueAtTime(700,t0+dur);
  o.connect(f); f.connect(g); g.connect(musicGain);
  if(S._reverb) g.connect(S._reverb);
  o.start(t0); o.stop(t0+dur+0.1);
}

function pad(freq, t0, dur, vol){
  const o = ctx.createOscillator(); o.type='sine'; o.frequency.value=freq;
  const o2 = ctx.createOscillator(); o2.type='triangle'; o2.frequency.value=freq*1.005;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001,t0);
  g.gain.linearRampToValueAtTime(vol,t0+dur*0.3);
  g.gain.linearRampToValueAtTime(0.0001,t0+dur);
  o.connect(g); o2.connect(g); g.connect(musicGain);
  if(S._reverb) g.connect(S._reverb);
  o.start(t0); o.stop(t0+dur+0.1);
  o2.start(t0); o2.stop(t0+dur+0.1);
}

function bass(freq, t0, dur, vol){
  const o = ctx.createOscillator(); o.type='sine'; o.frequency.value=freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001,t0);
  g.gain.exponentialRampToValueAtTime(vol,t0+0.04);
  g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
  o.connect(g); g.connect(musicGain);
  o.start(t0); o.stop(t0+dur+0.05);
}

/* motivi melodici: gradi della scala, -1 = pausa */
const MOTIVI = {
  primavera:[
    [0,2,4,2, 5,4,2,0, 1,2,4,-1, 2,1,0,-1],
    [4,5,7,5, 4,2,4,-1, 2,4,5,4, 2,0,-1,-1],
    [7,5,4,5, 7,9,7,-1, 5,4,2,4, 0,-1,-1,-1]
  ],
  estate:[
    [0,4,2,4, 5,4,2,-1, 4,5,7,5, 4,2,-1,-1],
    [7,7,5,4, 5,-1,4,2, 0,2,4,-1, 2,-1,-1,-1],
    [4,2,0,2, 4,5,7,-1, 9,7,5,4, 2,-1,-1,-1]
  ],
  autunno:[
    [0,2,3,2, 0,-1,-2,0, 2,3,5,3, 2,0,-1,-1],
    [5,3,2,3, 5,7,5,-1, 3,2,0,2, -1,-1,-1,-1],
    [2,0,-2,0, 2,3,5,-1, 3,2,0,-1, -1,-1,-1,-1]
  ],
  inverno:[
    [0,-1,2,-1, 4,-1,2,-1, 0,-1,-2,-1, 0,-1,-1,-1],
    [4,-1,5,4, 2,-1,0,-1, 2,-1,4,-1, 2,-1,-1,-1],
    [7,-1,5,-1, 4,-1,2,-1, 0,-1,-1,-1, -1,-1,-1,-1]
  ],
  notte:[
    [0,-1,-1,2, -1,3,-1,-1, 2,-1,0,-1, -1,-1,-1,-1],
    [5,-1,-1,3, -1,2,-1,-1, 0,-1,-1,-1, -1,-1,-1,-1]
  ],
  grotta:[
    [0,-1,-1,-1, 3,-1,-1,-1, 2,-1,-1,-1, -1,-1,-1,-1],
    [-1,-1,5,-1, -1,-1,3,-1, -1,-1,0,-1, -1,-1,-1,-1]
  ],
  paese:[
    [0,2,4,5, 4,2,0,-1, 2,4,5,7, 5,4,2,-1],
    [7,5,4,2, 4,5,4,-1, 2,0,2,4, 0,-1,-1,-1],
    [4,4,5,7, 9,7,5,-1, 4,5,4,2, 0,-1,-1,-1]
  ]
};

let motivoIdx = 0, barra = 0;

function stepSeq(){
  if(!ctx || !S.attivo || !curTrack) return;
  const t = ctx.currentTime + 0.05;
  const scale = SCALE[curTrack] || SCALE.primavera;
  const root = ROOT[curTrack] || 262;
  const motivi = MOTIVI[curTrack] || MOTIVI.primavera;
  const mot = motivi[motivoIdx % motivi.length];
  const n = mot[seqStep % 16];

  const calmo = (curTrack==='notte'||curTrack==='grotta'||curTrack==='inverno');

  // melodia
  if(n !== -1 && n !== undefined){
    pluck(nf(root,scale,n,1), t, calmo?1.4:0.55, calmo?0.10:0.14, calmo?'sine':'triangle');
    if(!calmo && seqStep%4===0) pluck(nf(root,scale,n,2), t+0.02, 0.4, 0.045, 'sine');
  }
  // basso ogni mezza battuta
  if(seqStep%8===0){
    const deg = (barra%4===0)?0 : (barra%4===1? 3 : (barra%4===2? 4 : 2));
    bass(nf(root,scale,deg,-1), t, calmo?2.4:1.1, calmo?0.10:0.13);
  }
  // pad ogni battuta
  if(seqStep===0){
    const deg = (barra%4===0)?0 : (barra%4===1? 3 : (barra%4===2? 4 : 2));
    pad(nf(root,scale,deg,0), t, calmo?4.2:2.4, calmo?0.045:0.05);
    pad(nf(root,scale,deg+2,0), t, calmo?4.2:2.4, calmo?0.032:0.038);
  }
  // percussione leggera solo di giorno
  if(!calmo && (seqStep%8===4)) noise(0.09,0.035,3000,t,'highpass');

  seqStep++;
  if(seqStep>=16){
    seqStep=0; barra++;
    if(barra%2===0) motivoIdx = (motivoIdx + 1 + ((Math.random()*2)|0)) % 3;
    if(pendingTrack){ curTrack = pendingTrack; pendingTrack=null; barra=0; motivoIdx=0; }
  }
}

S.musica = function(track){
  if(!S.attivo) return;
  if(!ctx) S.init();
  if(!ctx) return;
  if(ctx.state==='suspended') ctx.resume();
  if(curTrack === track && seqTimer) return;
  if(!curTrack){ curTrack = track; barra=0; seqStep=0; motivoIdx=0; }
  else pendingTrack = track;
  if(!seqTimer){
    const bpm = 96;
    seqTimer = setInterval(stepSeq, (60/bpm/4)*1000*2);
  }
};

S.stopMusica = function(){
  if(seqTimer){ clearInterval(seqTimer); seqTimer=null; }
  curTrack=null; pendingTrack=null;
};

/* ------------------------------------------------------------------
   AMBIENTE (pioggia, grilli, vento)
   ------------------------------------------------------------------ */
let ambNode = null, ambGain = null, ambTimer = null, ambTipo = null;

S.ambiente = function(tipo){
  if(!S.attivo || !ctx) { if(!ctx) S.init(); if(!ctx) return; }
  if(ambTipo === tipo) return;
  S.stopAmbiente();
  ambTipo = tipo;
  if(!tipo) return;

  if(tipo==='pioggia' || tipo==='temporale' || tipo==='vento'){
    const len = ctx.sampleRate*2;
    const buf = ctx.createBuffer(1,len,ctx.sampleRate);
    const d = buf.getChannelData(0);
    for(let i=0;i<len;i++) d[i] = Math.random()*2-1;
    const src = ctx.createBufferSource(); src.buffer=buf; src.loop=true;
    const f = ctx.createBiquadFilter();
    f.type = tipo==='vento' ? 'lowpass' : 'bandpass';
    f.frequency.value = tipo==='vento' ? 420 : (tipo==='temporale'? 900 : 1400);
    f.Q.value = tipo==='vento' ? 0.6 : 0.5;
    ambGain = ctx.createGain();
    ambGain.gain.value = 0;
    ambGain.gain.linearRampToValueAtTime(tipo==='temporale'?0.10:(tipo==='vento'?0.05:0.075), ctx.currentTime+2);
    src.connect(f); f.connect(ambGain); ambGain.connect(master);
    src.start();
    ambNode = src;
    // LFO sul filtro per dare movimento
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.11;
    const lg = ctx.createGain(); lg.gain.value = tipo==='vento'? 180 : 320;
    lfo.connect(lg); lg.connect(f.frequency); lfo.start();
    S._ambLfo = lfo;
    if(tipo==='temporale'){
      ambTimer = setInterval(()=>{ if(Math.random()<0.28) S.play('tuono'); }, 9000);
    }
  }
  else if(tipo==='grilli'){
    ambTimer = setInterval(()=>{
      if(!ctx || Math.random()>0.75) return;
      const t = ctx.currentTime;
      for(let i=0;i<3;i++){
        const o=ctx.createOscillator(); o.type='square'; o.frequency.value=4200+Math.random()*900;
        const g=ctx.createGain();
        g.gain.setValueAtTime(0.0001,t+i*0.09);
        g.gain.exponentialRampToValueAtTime(0.012,t+i*0.09+0.01);
        g.gain.exponentialRampToValueAtTime(0.0001,t+i*0.09+0.05);
        o.connect(g); g.connect(master);
        o.start(t+i*0.09); o.stop(t+i*0.09+0.09);
      }
    }, 1400);
  }
  else if(tipo==='uccelli'){
    ambTimer = setInterval(()=>{
      if(!ctx || Math.random()>0.4) return;
      const t = ctx.currentTime;
      const base = 1800+Math.random()*1400;
      const n = 2+((Math.random()*3)|0);
      for(let i=0;i<n;i++){
        const o=ctx.createOscillator(); o.type='sine';
        const tt = t+i*0.08;
        o.frequency.setValueAtTime(base*(1+Math.random()*0.3), tt);
        o.frequency.exponentialRampToValueAtTime(base*(0.7+Math.random()*0.6), tt+0.07);
        const g=ctx.createGain();
        g.gain.setValueAtTime(0.0001,tt);
        g.gain.exponentialRampToValueAtTime(0.026,tt+0.012);
        g.gain.exponentialRampToValueAtTime(0.0001,tt+0.08);
        o.connect(g); g.connect(master);
        o.start(tt); o.stop(tt+0.12);
      }
    }, 4200);
  }
  else if(tipo==='goccia'){  // grotta
    ambTimer = setInterval(()=>{
      if(!ctx || Math.random()>0.5) return;
      const t=ctx.currentTime;
      const o=ctx.createOscillator(); o.type='sine';
      o.frequency.setValueAtTime(900+Math.random()*500,t);
      o.frequency.exponentialRampToValueAtTime(320,t+0.16);
      const g=ctx.createGain();
      g.gain.setValueAtTime(0.0001,t);
      g.gain.exponentialRampToValueAtTime(0.05,t+0.008);
      g.gain.exponentialRampToValueAtTime(0.0001,t+0.2);
      o.connect(g); g.connect(master);
      if(S._reverb) g.connect(S._reverb);
      o.start(t); o.stop(t+0.26);
    }, 2600);
  }
};

S.stopAmbiente = function(){
  if(ambNode){ try{ ambNode.stop(); }catch(e){} ambNode=null; }
  if(S._ambLfo){ try{ S._ambLfo.stop(); }catch(e){} S._ambLfo=null; }
  if(ambTimer){ clearInterval(ambTimer); ambTimer=null; }
  ambGain=null; ambTipo=null;
};

})();
