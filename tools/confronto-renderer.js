#!/usr/bin/env node
/* ===================================================================
   FIORALBA — confronto visuale Pixi / Canvas

   Non registra una partita né chiama le API. Per ogni scena apre una
   pagina nuova, ricostruisce il mondo nel browser con un seme fisso,
   compone un solo fotogramma e confronta il canvas WebGL di Pixi con il
   fallback richiesto da ?renderer=canvas.

   Le immagini di una verifica fallita restano in tmp/renderer-visuale/
   (ignorata da Git) per poter vedere subito la differenza.
   =================================================================== */
'use strict';

const assert = require('assert');
const fs = require('fs');
const http = require('http');
const net = require('net');
const path = require('path');
const { spawn, execFileSync } = require('child_process');
const { chromium } = require('playwright');

const RADICE = path.join(__dirname, '..');
const OUTPUT = path.join(RADICE, 'tmp', 'renderer-visuale');

/* Il filtro è intenzionalmente più severo del normale rumore WebGL:
   vedere docs/confronto-renderer.md prima di cambiare questi numeri. */
const SOGLIA = {
  canale: 8,
  pixelDiversi: 0.004,
  erroreMedio: 0.55
};

/* Quattro inquadrature non equivalenti: desktop, telefono, luce diurna,
   notte, pioggia e una scena dove ordine dei personaggi e animali conta. */
const SCENE = [
  {
    id: 'giorno-desktop',
    viewport: { width:1280, height:720, dpr:1, mobile:false },
    mappa: 'podere', posizione:[14,15], ora:660, meteo:'sereno',
    tempo:2140, zoom:null, seme:4101,
    animali: [
      { tipo:'gatto', x:15, y:15, dir:1 },
      { tipo:'gallina', x:16, y:16, dir:-1 }
    ],
    fauna: [{ tipo:'coniglio', x:13, y:16, dir:1, frame:2 }]
  },
  {
    id: 'notte-desktop-zoom',
    viewport: { width:1280, height:720, dpr:1, mobile:false },
    mappa: 'fioralba', posizione:[13,16], ora:1320, meteo:'sereno',
    tempo:3920, zoom:2, seme:4102,
    animali: [], fauna: []
  },
  {
    id: 'pioggia-mobile-npc-animali',
    viewport: { width:390, height:844, dpr:2, mobile:true },
    mappa: 'podere', posizione:[14,15], ora:720, meteo:'pioggia',
    tempo:2740, zoom:null, seme:4103,
    animali: [
      { tipo:'gatto', x:15, y:15, dir:-1 },
      { tipo:'gallina', x:14, y:16, dir:1 },
      { tipo:'gallina', x:16, y:15, dir:-1 }
    ],
    npc: { id:'bruno', x:15, y:14, dir:1 },
    fauna: [{ tipo:'lumaca', x:13, y:16, dir:1, frame:1 }]
  },
  {
    id: 'ridimensionamento-mobile-orizzontale',
    viewport: { width:844, height:390, dpr:2, mobile:true },
    resizeDa: { width:390, height:844 },
    mappa: 'spiaggia', posizione:[23,4], ora:960, meteo:'nuvoloso',
    tempo:4580, zoom:null, seme:4104,
    animali: [], fauna: [{ tipo:'uccellino', x:24, y:4, dir:1, frame:2 }]
  }
];

function trovaChromium(){
  if(process.env.FIORALBA_CHROMIUM) return process.env.FIORALBA_CHROMIUM;
  try { return execFileSync('which', ['chromium'], { encoding:'utf8' }).trim(); }
  catch(_) {
    throw new Error(
      'Chromium non trovato. Su Replit esegui il test nel progetto, che lo fornisce in .replit.'
    );
  }
}

function portaLibera(){
  return new Promise((ok, no)=>{
    const s = net.createServer();
    s.once('error', no);
    s.listen(0, '127.0.0.1', ()=>{
      const { port } = s.address();
      s.close(err=>err ? no(err) : ok(port));
    });
  });
}

function attendeServer(baseUrl, timeout=12000){
  const fine = Date.now() + timeout;
  return new Promise((ok, no)=>{
    const prova = ()=>{
      const richiesta = http.get(baseUrl + '/salute', risposta=>{
        risposta.resume();
        if(risposta.statusCode === 200) return ok();
        riprova(new Error('salute HTTP ' + risposta.statusCode));
      });
      richiesta.once('error', riprova);
      richiesta.setTimeout(900, ()=>richiesta.destroy(new Error('timeout salute')));
    };
    const riprova = err=>{
      if(Date.now() >= fine) return no(new Error('Il server di test non risponde: ' + err.message));
      setTimeout(prova, 80);
    };
    prova();
  });
}

async function avviaServer(){
  const porta = await portaLibera();
  const processo = spawn(process.execPath, ['server.js', '--sviluppo'], {
    cwd: RADICE,
    env: { ...process.env, PORT:String(porta), FIORALBA_SVILUPPO:'1' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let uscita = '';
  processo.stderr.on('data', d=>{ uscita += d; });
  processo.stdout.on('data', d=>{ uscita += d; });
  try {
    await attendeServer('http://127.0.0.1:' + porta);
    return { processo, baseUrl:'http://127.0.0.1:' + porta };
  } catch(err) {
    processo.kill('SIGTERM');
    throw new Error(err.message + (uscita ? '\n' + uscita : ''));
  }
}

function chiudiServer(processo){
  if(!processo || processo.exitCode !== null) return;
  processo.kill('SIGTERM');
}

function urlScena(baseUrl, renderer){
  return renderer === 'canvas' ? baseUrl + '/?renderer=canvas' : baseUrl + '/';
}

async function preparaPagina(browser, baseUrl, scena, renderer){
  const viewportIniziale = scena.resizeDa || scena.viewport;
  const context = await browser.newContext({
    viewport: { width:viewportIniziale.width, height:viewportIniziale.height },
    deviceScaleFactor: scena.viewport.dpr,
    isMobile: scena.viewport.mobile,
    hasTouch: scena.viewport.mobile
  });
  const page = await context.newPage();
  const errori = [];
  page.on('pageerror', e=>errori.push(e.message));
  await page.goto(urlScena(baseUrl, renderer), { waitUntil:'load' });
  const atteso = renderer === 'canvas' ? 'canvas' : 'pixi';
  await page.waitForFunction(backend=>(
    window.REND && REND.info && REND.info().VW > 1 && REND.backend() === backend
  ), atteso, { timeout:12000 });
  /* Il gioco può usare temporaneamente l'arte in codice mentre i PNG
     disegnati a mano arrivano. Aspettarli rende il fotogramma una scena
     definita, non una gara fra due richieste di rete indipendenti. */
  await page.waitForFunction(
    ()=>!window.IMG || IMG.stato().inVolo === 0,
    { timeout:12000 }
  );

  let esito = await page.evaluate(s=>{
    /* Tutta la generazione, compresa pioggia e passanti, deve vedere la
       stessa sequenza sui due backend. Il ripristino evita effetti sugli
       strumenti manuali aperti nella stessa pagina. */
    const randomOriginale = Math.random;
    let stato = s.seme >>> 0;
    Math.random = ()=>{
      stato ^= stato << 13; stato >>>= 0;
      stato ^= stato >>> 17; stato >>>= 0;
      stato ^= stato << 5; stato >>>= 0;
      return stato / 4294967296;
    };
    try {
      Object.assign(G, G.statoIniziale());
      G.maps = WORLD.crea();
      if(window.SCENARI) SCENARI.applica(G.maps);
      G.mappaId = s.mappa;
      G.ora = s.ora;
      G.meteo = s.meteo;
      G.meteoDomani = s.meteo;
      G.giorno = 9;
      G.giornoTot = 9;
      G.stagioneIdx = 1;
      G.tempoMs = s.tempo;
      WORLD.nuovoGiorno(G.maps, G.stagione().id, s.seme);

      const m = G.mappa();
      G.p = {
        ...G.p, px:s.posizione[0]*64+32, py:s.posizione[1]*64+40,
        dir:1, frame:2, animT:320, dorme:false, look:G.look
      };
      G.animali = s.animali.map(a=>({
        tipo:a.tipo, mappa:s.mappa, px:a.x*64+32, py:a.y*64+40,
        dir:a.dir, wait:999999, dest:null, felice:72, uovo:true
      }));
      MOBS.reset();
      for(const b of s.fauna) MOBS.lista().push({
        tipo:b.tipo, x:b.x*64+32, y:b.y*64+40, z:0, vx:0, vy:0,
        dir:b.dir, dir4:2, frame:b.frame, animT:250, stato:'gira',
        t:999999, fase:0.7, vita:999999, colIdx:0, col:null
      });
      G.rifaiPassanti();
      if(s.npc){
        const base = G.npcVivi.bind(G);
        const dati = DATA.NPCS[s.npc.id];
        if(!dati) throw new Error('NPC di scena sconosciuto: ' + s.npc.id);
        const npc = {
          id:s.npc.id, look:dati.look, px:s.npc.x*64+32, py:s.npc.y*64+40,
          dir:s.npc.dir, frame:2, animT:320, emote:null, fisso:false
        };
        /* L'agenda può tenere un abitante al chiuso durante la pioggia.
           Qui la scena deve verificare il suo ordinamento con gli animali,
           quindi lo aggiungiamo localmente al solo fotogramma di prova. */
        G.npcVivi = ()=>[...base(), npc];
      }
      G.chiacchiere = [];
      G.particelle = [];
      REND.impostaZoom(s.zoom);
      REND.resize();
      const info = REND.info();
      G.cam = {
        x:Math.max(0, Math.min(m.w*64-info.VW, Math.round(G.p.px-info.VW/2))),
        y:Math.max(0, Math.min(m.h*64-info.VH, Math.round(G.p.py-info.VH/2)))
      };
      REND.initMeteo();
      REND.disegna(G);
      return {
        backend:REND.backend(), info:REND.info(), npc:G.npcVivi().length,
        camera:{ ...G.cam }, output:{ width:document.querySelector('#game').width, height:document.querySelector('#game').height }
      };
    } finally {
      Math.random = randomOriginale;
    }
  }, scena);
  if(scena.resizeDa){
    /* Non basta inizializzare direttamente in orizzontale: questa è la
       transizione vera che esegue il listener di resize dell'app e rialloca
       tele, texture Pixi e meteo come farebbe una rotazione del telefono. */
    await page.setViewportSize({
      width:scena.viewport.width, height:scena.viewport.height
    });
    await page.waitForFunction(({ width, height, dpr })=>{
      const canvas = document.querySelector('#game');
      return window.innerWidth === width && window.innerHeight === height
        && canvas && canvas.width === width*dpr && canvas.height === height*dpr;
    }, {
      width:scena.viewport.width, height:scena.viewport.height, dpr:scena.viewport.dpr
    }, { timeout:12000 });
    /* initMeteo chiamato dal listener usa casualità. La ripetiamo con un
       seme fisso prima del fotogramma finale, mantenendo la transizione
       testata ma evitando che Pixi e Canvas ricevano gocce diverse. */
    esito = await page.evaluate(s=>{
      const randomOriginale = Math.random;
      let stato = (s.seme ^ 0x9e3779b9) >>> 0;
      Math.random = ()=>{
        stato ^= stato << 13; stato >>>= 0;
        stato ^= stato >>> 17; stato >>>= 0;
        stato ^= stato << 5; stato >>>= 0;
        return stato / 4294967296;
      };
      try {
        const m = G.mappa();
        REND.initMeteo();
        const info = REND.info();
        G.cam = {
          x:Math.max(0, Math.min(m.w*64-info.VW, Math.round(G.p.px-info.VW/2))),
          y:Math.max(0, Math.min(m.h*64-info.VH, Math.round(G.p.py-info.VH/2)))
        };
        REND.disegna(G);
        return {
          backend:REND.backend(), info, npc:G.npcVivi().length,
          camera:{ ...G.cam }, output:{ width:document.querySelector('#game').width, height:document.querySelector('#game').height }
        };
      } finally {
        Math.random = randomOriginale;
      }
    }, scena);
  }
  if(errori.length) throw new Error('errori browser: ' + errori.join(' | '));
  if(esito.backend !== atteso) throw new Error(`backend ${esito.backend}, atteso ${atteso}`);
  if(scena.npc && esito.npc < 1)
    throw new Error('la scena NPC non ha nessun abitante visibile');

  /* Pixi lascia che WebGL scarti il buffer dopo la presentazione, quindi
     toDataURL restituirebbe nero. Nascondiamo invece tutti i livelli DOM
     che non sono #game e fotografiamo la composizione già presentata. */
  await page.evaluate(()=>{
    for(const el of document.querySelectorAll('#app > :not(#game), body > :not(#app)'))
      el.style.setProperty('display', 'none', 'important');
  });
  const immagine = await page.locator('#game').screenshot({ animations:'disabled' });
  await context.close();
  return { immagine, stato:esito };
}

async function confronta(page, pixi, canvas){
  return page.evaluate(async ({ pixi, canvas, soglia })=>{
    const immagine = src=>new Promise((ok, no)=>{
      const img = new Image();
      img.onload = ()=>ok(img);
      img.onerror = ()=>no(new Error('PNG non decodificabile'));
      img.src = src;
    });
    const [a, b] = await Promise.all([immagine(pixi), immagine(canvas)]);
    if(a.width !== b.width || a.height !== b.height)
      throw new Error(`dimensioni diverse: ${a.width}×${a.height} / ${b.width}×${b.height}`);
    const tela = document.createElement('canvas');
    tela.width = a.width; tela.height = a.height;
    const x = tela.getContext('2d', { willReadFrequently:true });
    x.drawImage(a, 0, 0);
    const A = x.getImageData(0, 0, tela.width, tela.height).data;
    x.clearRect(0, 0, tela.width, tela.height);
    x.drawImage(b, 0, 0);
    const B = x.getImageData(0, 0, tela.width, tela.height).data;
    let cambiati = 0, errore = 0, massimo = 0;
    for(let i=0; i<A.length; i+=4){
      let locale = 0;
      for(let c=0; c<3; c++){
        const d = Math.abs(A[i+c]-B[i+c]);
        errore += d; locale = Math.max(locale, d); massimo = Math.max(massimo, d);
      }
      if(locale > soglia.canale) cambiati++;
    }
    const pixel = A.length / 4;
    return {
      larghezza:a.width, altezza:a.height, pixel,
      cambiati, quota:cambiati/pixel, erroreMedio:errore/(pixel*3), massimo
    };
  }, {
    pixi:'data:image/png;base64,' + pixi.toString('base64'),
    canvas:'data:image/png;base64,' + canvas.toString('base64'),
    soglia:SOGLIA
  });
}

function salvaImmagini(nome, pixi, canvas){
  fs.mkdirSync(OUTPUT, { recursive:true });
  fs.writeFileSync(path.join(OUTPUT, nome + '-pixi.png'), pixi);
  fs.writeFileSync(path.join(OUTPUT, nome + '-canvas.png'), canvas);
}

function supera(metrica){
  return metrica.quota <= SOGLIA.pixelDiversi && metrica.erroreMedio <= SOGLIA.erroreMedio;
}

async function main(){
  /* Ogni esecuzione lascia solo le prove dell'errore corrente: immagini
     di un confronto già risolto non devono sembrare un fallimento nuovo. */
  fs.rmSync(OUTPUT, { recursive:true, force:true });
  const { processo, baseUrl } = await avviaServer();
  const browser = await chromium.launch({
    headless:true,
    executablePath:trovaChromium(),
    args:['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
  });
  const comparatore = await browser.newPage();
  let falliti = 0;
  try {
    for(const scena of SCENE){
      const pixi = await preparaPagina(browser, baseUrl, scena, 'pixi');
      const canvas = await preparaPagina(browser, baseUrl, scena, 'canvas');
      const metrica = await confronta(comparatore, pixi.immagine, canvas.immagine);
      const esito = supera(metrica) ? '✓' : '✗';
      console.log(
        `${esito} ${scena.id}: ${(metrica.quota*100).toFixed(3)}% pixel oltre ${SOGLIA.canale}, ` +
        `errore medio ${metrica.erroreMedio.toFixed(3)}, massimo ${metrica.massimo}`
      );
      if(process.env.FIORALBA_RENDERER_DEBUG)
        console.log('  Pixi', JSON.stringify(pixi.stato), 'Canvas', JSON.stringify(canvas.stato));
      if(!supera(metrica)){
        falliti++;
        salvaImmagini(scena.id, pixi.immagine, canvas.immagine);
      }
    }
  } finally {
    await comparatore.close().catch(()=>{});
    await browser.close().catch(()=>{});
    chiudiServer(processo);
  }
  assert.strictEqual(
    falliti, 0,
    `${falliti} confronto/i Pixi/Canvas fuori soglia; immagini in ${path.relative(RADICE, OUTPUT)}`
  );
}

main().catch(err=>{
  console.error('\nConfronto renderer fallito:', err.message);
  process.exitCode = 1;
});