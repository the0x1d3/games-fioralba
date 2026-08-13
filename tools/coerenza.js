#!/usr/bin/env node
/* ===================================================================
   FIORALBA — tools/coerenza.js
   Controlli di coerenza sui dati di gioco. Nessuna dipendenza: carica
   i file del gioco in un finto `window` e verifica che il contenuto
   stia in piedi da solo.

   Nasce da un bug vero: il `latte` serviva alla ricetta della Polenta
   ma non lo produceva né lo vendeva nessuno, quindi quella ricetta era
   impossibile da cucinare. Un controllo del genere lo avrebbe preso
   il giorno stesso.

       node tools/coerenza.js      (oppure: npm test)
   =================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');

const RADICE = path.join(__dirname, '..');

/* --- carica i moduli del gioco che non toccano il DOM --- */
global.window = {};
for (const file of ['js/data.js', 'js/world.js']) {
  const src = fs.readFileSync(path.join(RADICE, file), 'utf8');
  // eslint-disable-next-line no-eval
  eval(src);
}
const DATA = global.window.DATA;
const WORLD = global.window.WORLD;

/* --- mini framework --- */
const errori = [];
const fatti = [];

/* Il primo controllo di tutti: i file devono almeno essere JavaScript
   valido. Sembra ovvio, ma un apostrofo non protetto dentro una stringa
   fa fallire il caricamento in silenzio — nel browser resta una pagina
   che non parte, e il motivo si scopre solo aprendo la console. */
function controllaSintassi(){
  const vm = require('vm');
  const dir = path.join(RADICE, 'js');
  const problemi = [];
  for (const f of fs.readdirSync(dir).filter(n => n.endsWith('.js'))) {
    const src = fs.readFileSync(path.join(dir, f), 'utf8');
    try { new vm.Script(src, { filename: f }); }
    catch (e) { problemi.push(`js/${f}: ${e.message}`); }
  }
  return problemi;
}
function verifica(nome, fn) {
  try {
    const problemi = fn() || [];
    if (problemi.length) { errori.push([nome, problemi]); }
    else { fatti.push(nome); }
  } catch (e) {
    errori.push([nome, ['il controllo stesso è esploso: ' + e.message]]);
  }
}

/* --- da dove può arrivare un oggetto, in gioco --- */
/* mobs.js disegna e ha bisogno del DOM, quindi non si carica: le prede
   si leggono dal sorgente. Meno elegante che importarlo, ma è l'unico
   modo di tenere una sola fonte di verità senza un finto canvas. */
function dropDellePrede() {
  const src = fs.readFileSync(path.join(RADICE, 'js/mobs.js'), 'utf8');
  const ids = new Set();
  for (const m of src.matchAll(/preda:\s*\{[^}]*drop:\s*\[([^\]]*(?:\][^\]]*)*?)\]\s*\}/g)) {
    for (const d of m[1].matchAll(/\['([a-z_]+)'/g)) ids.add(d[1]);
  }
  return ids;
}

function fontiOttenibili() {
  const ok = new Set();
  for (const id in DATA.ITEMS) {
    const I = DATA.ITEMS[id];
    // raccolti dal campo, foraggio dal bosco, pesci, minerali, materiali
    if (['raccolto', 'foraggio', 'pesce', 'minerale', 'materiale'].indexOf(I.cat) >= 0) ok.add(id);
  }
  for (const id of DATA.SHOP_EXTRA) ok.add(id);              // bottega di Bruno
  for (const st in DATA.SHOP) for (const id of DATA.SHOP[st]) ok.add(id);
  for (const r of DATA.CRAFT) ok.add(r.id);                  // banco da lavoro
  for (const r of DATA.CUCINA) ok.add(r.id);                 // fornelli
  ok.add('uovo'); ok.add('uovo_oro');                        // pollaio
  ok.add('miele');                                           // arnia
  /* la caccia: quello che lasciano le prede. Letto dal file della fauna
     invece che scritto qui, così se domani una preda smette di lasciare
     la pelle il controllo se ne accorge da solo. */
  for (const id of dropDellePrede()) ok.add(id);
  for (const b of DATA.SANTUARIO) if (b.premio && b.premio.item) ok.add(b.premio.item);
  return ok;
}

/* =================================================================== */

verifica('ogni file .js è sintatticamente valido', controllaSintassi);

/* La palette è la sola cosa che tiene insieme l'immagine: se una rampa
   si sfalda — due gradini uguali, il valore che torna indietro a metà
   scala, un materiale senza ombra — non se ne accorge nessuno finché
   non si guarda una schermata e sembra sporca. */
verifica('le rampe della palette salgono senza buchi né gemelli', () => {
  const vm = require('vm');
  const sandbox = { window:{}, console };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(RADICE,'js/palette.js'),'utf8'), sandbox, {filename:'palette.js'});
  const PAL = sandbox.window.PAL;
  const problemi = [];
  const luminosita = h => {
    const n = parseInt(h.slice(1),16);
    return 0.299*((n>>16)&255) + 0.587*((n>>8)&255) + 0.114*(n&255);
  };
  const visti = new Map();
  for (const nome in PAL.r) {
    const r = PAL.r[nome];
    if (r.length < 5) problemi.push(`la rampa «${nome}» ha solo ${r.length} gradini`);
    for (let i = 1; i < r.length; i++) {
      if (luminosita(r[i]) <= luminosita(r[i-1]))
        problemi.push(`la rampa «${nome}» non sale fra il gradino ${i-1} e il ${i} (${r[i-1]} → ${r[i]})`);
    }
    for (const c of r) {
      if (visti.has(c) && visti.get(c) !== nome)
        problemi.push(`${c} sta sia in «${visti.get(c)}» che in «${nome}»`);
      visti.set(c, nome);
    }
  }
  // deve esserci davvero un nero che ancora e una luce pulita in cima
  const tutte = [...visti.keys()].map(luminosita);
  if (Math.min(...tutte) > 26) problemi.push('nessun gradino abbastanza scuro da ancorare l\'immagine');
  if (Math.max(...tutte) < 240) problemi.push('nessun gradino abbastanza chiaro da fare da luce');
  // e l'aggancio deve essere totale e stabile
  for (const prova of ['#000000','#ffffff','#7f3ab2','#0d0b07','#ff9a3c']) {
    const a = PAL.snap(prova);
    if (!visti.has(a)) problemi.push(`${prova} si aggancia a ${a}, che non è un gradino di nessuna rampa`);
    if (PAL.snap(a) !== a) problemi.push(`l'aggancio non è stabile: ${a} → ${PAL.snap(a)}`);
  }
  return problemi;
});

/* Segnalato in beta: «l'ingresso del secondo livello si attraversa solo
   in un punto particolare». Era un varco da una casella sola in fondo a
   un corridoio, e il passaggio scatta quando il *centro* del giocatore
   ci finisce dentro: trentadue pixel da azzeccare. Un varco che si
   prende per caso non è un varco. */
verifica('le scale della miniera si imboccano senza mirare', () => {
  const problemi = [];
  const maps = WORLD.crea();
  const scale = [
    ['grotta',  'Miniera Profonda'],
    ['grotta2', 'Su'], ['grotta2', 'Cuore della Miniera'],
    ['grotta3', 'Su']
  ];
  for (const [id, etichetta] of scale) {
    const m = maps[id];
    const w = (m.warps || []).find(x => x.etichetta === etichetta);
    if (!w) { problemi.push(`su ${id} manca il passaggio «${etichetta}»`); continue; }
    let dentro = 0;
    const bordo = new Set();
    for (let y = w.y; y < w.y + w.h; y++) for (let x = w.x; x < w.x + w.w; x++) {
      if (WORLD.solido(m, x, y)) continue;
      dentro++;
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx = x+dx, ny = y+dy;
        if (WORLD.dentro(m,nx,ny) && !WORLD.solido(m,nx,ny)) bordo.add(nx+','+ny);
      }
    }
    if (dentro < 2)
      problemi.push(`su ${id} il passaggio «${etichetta}» è calpestabile su ${dentro} casella/e: troppo poco`);
    if (bordo.size < 3)
      problemi.push(`su ${id} a «${etichetta}» ci si arriva solo da ${bordo.size} casella/e`);
  }
  return problemi;
});

/* Le porte adesso sono solide, perché camminarci dentro voleva dire
   finire disegnati dentro la casa. Solide sì, ma davanti a ognuna ci si
   deve poter stare, altrimenti l'edificio diventa inaccessibile. */
verifica('davanti a ogni porta si può stare', () => {
  const problemi = [];
  const maps = WORLD.crea();
  for (const id in maps) {
    const m = maps[id];
    for (const e of (m.edifici || [])) {
      if (!e.porta) continue;
      const { x, y } = e.porta;
      const davanti = [[x,y+1],[x-1,y],[x+1,y],[x,y-1]]
        .filter(([a,b]) => WORLD.dentro(m,a,b) && !WORLD.solido(m,a,b));
      if (!davanti.length)
        problemi.push(`su ${id} la porta di ${e.kind} a (${x},${y}) non ha una casella da cui aprirla`);
    }
  }
  return problemi;
});

/* Segnalato in beta come «la miniera non è accessibile», ed era vero
   anche se nessun muro era davvero chiuso: i sassi si spaccano, ma
   dall'ingresso del secondo livello si camminava su quattordici caselle
   su trecentoventotto e la scala per il terzo stava dall'altra parte di
   un tappo che non si vedeva. Una miniera in cui bisogna indovinare
   dove bucare non è una miniera. */
verifica('in ogni livello di miniera si cammina, senza dover bucare', () => {
  const problemi = [];
  const maps = WORLD.crea();
  const livelli = [
    ['grotta',  [17,26], [6,23]],
    ['grotta2', [6,4],   [20,28]],
    ['grotta3', [6,4],   null]
  ];
  const cava = (m,x,y)=>{ const t = WORLD.terreno(m,x,y); return t!=='roccia' && t!=='vuoto'; };

  for (const [id, ing, scala] of livelli) {
    const m = maps[id];
    if (!m) { problemi.push(`manca il livello ${id}`); continue; }
    const visto = new Set([ing[0]+','+ing[1]]);
    const q = [ing];
    while (q.length) {
      const [x,y] = q.shift();
      for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx=x+dx, ny=y+dy, k=nx+','+ny;
        if (visto.has(k) || !WORLD.dentro(m,nx,ny)) continue;
        if (!cava(m,nx,ny) || WORLD.solido(m,nx,ny)) continue;
        visto.add(k); q.push([nx,ny]);
      }
    }
    let totale = 0;
    for (let y=0;y<m.h;y++) for (let x=0;x<m.w;x++) if (cava(m,x,y)) totale++;
    const quota = visto.size / totale;
    if (quota < 0.6)
      problemi.push(`su ${id} si cammina solo sul ${Math.round(quota*100)}% della grotta (${visto.size}/${totale})`);
    if (scala && !visto.has(scala[0]+','+scala[1]))
      problemi.push(`su ${id} la scala (${scala}) non si raggiunge camminando`);
  }
  return problemi;
});

/* L'atto secondo tiene solo se le sei testimonianze sono davvero sei,
   di sei persone diverse e raggiungibili, e se la sera della veglia
   ognuno ha dove mettere i piedi. Un abitante piantato dentro una
   pietra rituale è il genere di difetto che si scopre alla fine della
   partita, cioè quando fa più danno e costa di più da correggere. */
verifica('la notte del solstizio si può ricostruire', () => {
  const problemi = [];
  const M = DATA.MEMORIE;
  if (!M || !M.length) return ['manca DATA.MEMORIE'];

  const visti = new Set();
  for (const m of M) {
    if (!DATA.NPCS[m.npc]) problemi.push(`la memoria «${m.id}» è di «${m.npc}», che non è un abitante`);
    if (m.npc === 'fiammella') problemi.push('Fiammella non può testimoniare: quella notte si è spenta con la lanterna');
    if (visti.has(m.npc)) problemi.push(`«${m.npc}» ha più di una memoria: il dialogo ne mostrerebbe una sola`);
    visti.add(m.npc);
    if (!Array.isArray(m.testo) || !m.testo.length) problemi.push(`la memoria «${m.id}» non ha testo`);
    if (!(m.cuori >= 0 && m.cuori <= 10)) problemi.push(`la memoria «${m.id}» chiede ${m.cuori} cuori, fuori scala`);
    if (m.dona && !DATA.ITEMS[m.dona]) problemi.push(`la memoria «${m.id}» regala «${m.dona}», che non esiste`);
  }

  /* Alla veglia devono venire esattamente quelli che hanno parlato:
     se uno testimonia e poi non ha un posto, la veglia non si chiude. */
  const P = DATA.POSTI_VEGLIA || {};
  for (const m of M)
    if (!P[m.npc]) problemi.push(`«${m.npc}» testimonia ma non ha un posto alla veglia`);
  for (const id in P)
    if (!M.some(m => m.npc === id)) problemi.push(`«${id}» ha un posto alla veglia ma non testimonia`);

  const bosco = WORLD.crea().bosco;
  for (const id in P) {
    for (const [x, y] of P[id]) {
      if (!WORLD.dentro(bosco, x, y)) { problemi.push(`il posto di ${id} alla veglia (${x},${y}) è fuori dal bosco`); continue; }
      if (WORLD.solido(bosco, x, y)) problemi.push(`il posto di ${id} alla veglia (${x},${y}) non è calpestabile`);
    }
  }
  return problemi;
});

/* Una lettera scritta e mai consegnata è lavoro buttato, e una lettera
   consegnata che non esiste è una finestra vuota in faccia al
   giocatore. Le due liste stanno in file diversi — il testo in data.js,
   la condizione nel codice, che qui non si può caricare perché vuole il
   DOM — quindi gli id si leggono dal sorgente.

   Il sorgente è tutto `js/`, non più il solo game.js: quando l'atto
   secondo è uscito in solstizio.js si è portato dietro le consegne di
   «verita» e «veglia», e questo controllo è diventato rosso senza che
   il gioco avesse niente di rotto. Cercare in un file solo voleva dire
   legare un controllo sui dati a dove sta scritto il codice. */
verifica('ogni lettera esiste ed è consegnata da qualcosa', () => {
  const problemi = [];
  const dir = path.join(RADICE, 'js');
  const tutto = fs.readdirSync(dir).filter(n => n.endsWith('.js'))
    .map(n => fs.readFileSync(path.join(dir, n), 'utf8')).join('\n');
  const src = fs.readFileSync(path.join(RADICE, 'js/game.js'), 'utf8');

  const posta = [];
  const blocco = src.slice(src.indexOf('const POSTA = ['), src.indexOf('G.postaDovuta'));
  const re = /\{\s*id\s*:\s*'([a-z_0-9]+)'/g;
  let m; while ((m = re.exec(blocco))) posta.push(m[1]);
  if (!posta.length) return ['non trovo la lista POSTA in game.js'];

  for (const id of posta)
    if (!DATA.LETTERE[id]) problemi.push(`la posta consegna «${id}», che non è fra le lettere`);

  /* le altre vie di consegna: l'apertura, le quattro braci, la ricetta,
     le due dell'atto secondo (verità e veglia) e quella del gatto, che
     non arriva per posta ma la lascia lui quando si decide */
  const altre = new Set(['intro', 'ricetta_ilde', 'verita', 'veglia', 'gatto']);
  if (!/UI\.lettera\('gatto'\)/.test(tutto))
    problemi.push('la lettera «gatto» non la consegna più nessuno');
  for (const k of ['verita', 'veglia'])
    if (!new RegExp('G\\.lettere\\.' + k + '\\s*=\\s*true').test(tutto))
      problemi.push(`la lettera «${k}» non viene mai consegnata da nessun file`);
  for (const b of DATA.SANTUARIO) altre.add(b.id);

  for (const id in DATA.LETTERE) {
    if (posta.indexOf(id) >= 0 || altre.has(id)) continue;
    problemi.push(`la lettera «${id}» è scritta ma non la consegna nessuno`);
  }

  /* e il mittente deve essere qualcuno che esiste (o Ilde, che non è
     un abitante perché è morta prima che cominciasse la partita) */
  const nomi = new Set(['Nonna Ilde']);
  for (const k in DATA.NPCS) nomi.add(DATA.NPCS[k].nome);
  for (const id in DATA.LETTERE) {
    const da = DATA.LETTERE[id].da;
    if (da && !nomi.has(da)) problemi.push(`la lettera «${id}» è firmata «${da}», che non esiste`);
  }
  return problemi;
});

/* Il cespuglio carico e la falce devono dire la stessa cosa. Per un po'
   non l'hanno fatto: il disegno metteva bacche rosse in ogni stagione e
   la falce dava viole di primavera, more d'estate, nocciole d'autunno.
   Adesso leggono la stessa tabella, e questo controlla che la tabella
   sia sensata: quattro stagioni, e ogni frutto è foraggio di quella. */
verifica('quello che dà il cespuglio esiste ed è di stagione', () => {
  const problemi = [];
  const T = DATA.CESPUGLIO;
  if (!T) return ['manca DATA.CESPUGLIO'];
  for (const s of DATA.SEASONS) {
    const id = T[s.id];
    if (!id) { problemi.push(`nessun frutto per ${s.id}`); continue; }
    const it = DATA.ITEMS[id];
    if (!it) { problemi.push(`il cespuglio di ${s.id} dà «${id}», che non è un oggetto`); continue; }
    if (it.cat !== 'foraggio')
      problemi.push(`il cespuglio di ${s.id} dà «${id}», che è ${it.cat} e non foraggio`);
    else if (it.stagione !== s.id)
      problemi.push(`il cespuglio di ${s.id} dà «${id}», che è foraggio di ${it.stagione}`);
  }
  for (const k in T)
    if (!DATA.SEASONS.some(s => s.id === k)) problemi.push(`«${k}» non è una stagione`);
  return problemi;
});

/* Il ponte del bosco costa 3000 monete, 100 legna e 40 pietra, ed è la
   missione che apre la storia. Solo che il burrone che avrebbe dovuto
   rendere obbligatorio il ponte copriva mezza fascia: si scendeva
   qualche passo più a ovest e si entrava nella radura a piedi asciutti.
   Tutte e 153 le caselle della radura erano raggiungibili senza aver
   costruito niente.

   Una barriera si controlla in un modo solo: camminandoci contro. Il
   BFS qui sotto usa 8 vicini, cioè è più permissivo del movimento vero,
   così se dice «chiuso» è chiuso davvero. */
verifica('nella radura degli spiriti ci si arriva solo col ponte', () => {
  const problemi = [];

  const cammina = (m, sx, sy) => {
    const visto = new Set([sx+','+sy]);
    const q = [[sx,sy]];
    while (q.length) {
      const [x,y] = q.pop();
      for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
        const nx=x+dx, ny=y+dy, k=nx+','+ny;
        if (visto.has(k) || !WORLD.dentro(m,nx,ny) || WORLD.solido(m,nx,ny)) continue;
        visto.add(k); q.push([nx,ny]);
      }
    }
    return visto;
  };

  const conta = (m) => {
    const r = cammina(m, 19, 0);            // si entra nel bosco da nord
    let tot = 0, ragg = 0;
    for (let y=27; y<m.h; y++) for (let x=30; x<m.w; x++) {
      if (WORLD.solido(m,x,y)) continue;
      tot++; if (r.has(x+','+y)) ragg++;
    }
    const pi = m.obj.findIndex(o => o && o.t==='porta' && o.azione==='santuario');
    const px = pi % m.w, py = (pi/m.w)|0;
    const santuario = [[px,py+1],[px,py-1],[px+1,py],[px-1,py]]
      .some(([a,b]) => !WORLD.solido(m,a,b) && r.has(a+','+b));
    return { tot, ragg, santuario, soglia: r.has('34,' + (m.pontePos.y-1)) };
  };

  const senza = conta(WORLD.crea().bosco);
  if (senza.ragg > 0)
    problemi.push(`senza ponte si entra lo stesso nella radura: ${senza.ragg}/${senza.tot} caselle`);
  if (senza.santuario)
    problemi.push('senza ponte si arriva comunque alla porta del santuario');
  if (!senza.soglia)
    problemi.push('non si arriva nemmeno davanti al ponte: la sponda nord è irraggiungibile');

  const mapsP = WORLD.crea();
  WORLD.costruisci(mapsP, 'ponte');
  const con = conta(mapsP.bosco);
  if (con.ragg < con.tot)
    problemi.push(`col ponte costruito la radura resta in parte chiusa: ${con.ragg}/${con.tot}`);
  if (!con.santuario)
    problemi.push('col ponte costruito il santuario resta irraggiungibile');

  /* E la stessa cosa deve valere per chi carica un salvataggio vecchio,
     dove il terreno del burrone è quello di prima. */
  const vecchio = WORLD.crea().bosco;
  for (let y=24; y<vecchio.h; y++) for (let x=27; x<30; x++)
    vecchio.g[WORLD.idx(vecchio,x,y)] = WORLD.ti('erba');
  WORLD.ristampaBurrone(vecchio);
  const dopo = conta(vecchio);
  if (dopo.ragg > 0)
    problemi.push(`da un salvataggio vecchio la radura resta aggirabile: ${dopo.ragg}/${dopo.tot} caselle`);

  return problemi;
});

/* Il tetto di un edificio è disegnato più in alto del suo ingombro — la
   locanda di quasi due caselle — e quelle caselle erano calpestabili:
   ci si camminava dentro e si finiva col mezzobusto nel tetto. Adesso la
   sagoma è solida tutta, e questo controlla che sia rimasta solida. */
verifica('la sagoma disegnata di ogni edificio è solida, tetto compreso', () => {
  const problemi = [];
  const maps = WORLD.crea();
  for (const id in maps) {
    const m = maps[id];
    for (const e of (m.edifici || [])) {
      if (!e.sbordo) continue;
      for (let yy = e.y - e.sbordo; yy < e.y; yy++) {
        for (let xx = e.x; xx < e.x + e.w; xx++) {
          if (!WORLD.dentro(m, xx, yy)) continue;
          if (e.porta && xx === e.porta.x && yy === e.porta.y) continue;
          if (!WORLD.solido(m, xx, yy))
            problemi.push(`su ${id} il tetto di ${e.kind} a (${e.x},${e.y}) lascia passare la casella (${xx},${yy})`);
        }
      }
    }
  }
  return problemi;
});

/* Nato da un difetto vero: agganciate alla palette, la chioma e l'erba
   di primavera finivano sullo stesso gradino e i cespugli sparivano nel
   prato. Due cose che devono leggersi separate non possono stare sullo
   stesso colore, e nessuno se ne accorge finché non ci si passa davanti
   nella stagione giusta. */
verifica('in ogni stagione la chioma si stacca dall\'erba', () => {
  const vm = require('vm');
  const sandbox = { window:{}, console };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(RADICE,'js/palette.js'),'utf8'), sandbox, {filename:'palette.js'});
  const PAL = sandbox.window.PAL;
  const problemi = [];
  for (const S of DATA.SEASONS) {
    const chioma = PAL.snap(S.tree);
    for (const [nome, erba] of [['erba', S.grass], ['erba2', S.grass2]]) {
      if (PAL.snap(erba) === chioma)
        problemi.push(`in ${S.id} la chioma e la ${nome} si agganciano entrambe a ${chioma}`);
    }
  }
  return problemi;
});

/* I colori con un nome devono venire dalle rampe, altrimenti la
   disciplina vale per i sorgenti sparsi e non per il posto che
   dovrebbe darne l'esempio. */
verifica('ogni colore di PAL.c è un gradino di una rampa', () => {
  const vm = require('vm');
  const sandbox = { window:{}, console };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(RADICE,'js/palette.js'),'utf8'), sandbox, {filename:'palette.js'});
  const PAL = sandbox.window.PAL;
  const ammessi = new Set();
  for (const nome in PAL.r) for (const c of PAL.r[nome]) ammessi.add(c);
  const problemi = [];
  (function cammina(o, via){
    for (const k in o) {
      const v = o[k], q = via ? via+'.'+k : k;
      if (Array.isArray(v)) v.forEach((x,i) => { if(!ammessi.has(x)) problemi.push(`${q}[${i}] = ${x}`); });
      else if (v && typeof v === 'object') cammina(v, q);
      else if (!ammessi.has(v)) problemi.push(`${q} = ${v}`);
    }
  })(PAL.c, '');
  return problemi;
});

verifica('ogni ingrediente di cucina si può ottenere', () => {
  const ok = fontiOttenibili();
  const problemi = [];
  for (const r of DATA.CUCINA) {
    for (const ing in r.ing) {
      if (!ok.has(ing)) problemi.push(`«${ing}» serve a ${r.id} ma non lo produce né lo vende nessuno`);
    }
  }
  return problemi;
});

verifica('ogni ingrediente di artigianato si può ottenere', () => {
  const ok = fontiOttenibili();
  const problemi = [];
  for (const r of DATA.CRAFT) {
    for (const ing in r.ing) {
      if (!ok.has(ing)) problemi.push(`«${ing}» serve a ${r.id} ma non è ottenibile`);
    }
  }
  return problemi;
});

verifica('ogni costruzione chiede materiali esistenti e ottenibili', () => {
  const ok = fontiOttenibili();
  const problemi = [];
  for (const c of DATA.COSTRUZIONI) {
    for (const ing in c.ing) {
      if (!DATA.ITEMS[ing]) problemi.push(`${c.id} chiede «${ing}», che non esiste`);
      else if (!ok.has(ing)) problemi.push(`${c.id} chiede «${ing}», non ottenibile`);
    }
  }
  return problemi;
});

verifica('i potenziamenti degli attrezzi chiedono lingotti esistenti', () => {
  const problemi = [];
  for (const att in DATA.UPGRADE) {
    if (!DATA.ITEMS[att]) problemi.push(`potenziamento per «${att}», che non è un oggetto`);
    for (const u of DATA.UPGRADE[att]) {
      for (const ing in u.ing) if (!DATA.ITEMS[ing]) problemi.push(`${att} liv.${u.liv} chiede «${ing}», che non esiste`);
    }
  }
  return problemi;
});

verifica('le offerte del Santuario si possono raccogliere in stagione', () => {
  const ok = fontiOttenibili();
  const problemi = [];
  for (const b of DATA.SANTUARIO) {
    for (const req of b.req) {
      if (!DATA.ITEMS[req]) problemi.push(`la ${b.nome} chiede «${req}», che non esiste`);
      else if (!ok.has(req)) problemi.push(`la ${b.nome} chiede «${req}», non ottenibile`);
    }
    if (!DATA.ITEMS[b.premio.item]) problemi.push(`la ${b.nome} premia con «${b.premio.item}», che non esiste`);
  }
  return problemi;
});

verifica('i regali preferiti dagli abitanti esistono', () => {
  const problemi = [];
  for (const id in DATA.NPCS) {
    const N = DATA.NPCS[id];
    if (!N.regali) continue;
    for (const gruppo of ['ama', 'piace']) {
      for (const g of (N.regali[gruppo] || [])) {
        const base = g.indexOf(':') > 0 ? g.split(':')[1] : g;
        if (!DATA.ITEMS[base] && !DATA.CROPS[base]) problemi.push(`${N.nome} ${gruppo} «${g}», che non esiste`);
      }
    }
  }
  return problemi;
});

verifica('ogni coltura ha semi in vendita nella sua stagione', () => {
  const problemi = [];
  for (const id in DATA.CROPS) {
    const semeId = 'seme_' + id;
    const stagioni = DATA.CROPS[id].stagioni;
    const vendutoIn = Object.keys(DATA.SHOP).filter(st => DATA.SHOP[st].indexOf(semeId) >= 0);
    if (!vendutoIn.length) { problemi.push(`i semi di ${id} non sono in vendita da nessuna parte`); continue; }
    for (const st of vendutoIn) {
      if (stagioni.indexOf(st) < 0) problemi.push(`i semi di ${id} sono venduti in ${st}, ma la coltura non cresce in quella stagione`);
    }
  }
  return problemi;
});

verifica('ogni pesce ha almeno una stagione e un luogo raggiungibile', () => {
  const luoghi = ['fiume', 'lago', 'mare'];
  const problemi = [];
  for (const id in DATA.ITEMS) {
    const I = DATA.ITEMS[id];
    if (I.cat !== 'pesce' || I.spazzatura) continue;
    if (!I.stagioni || !I.stagioni.length) problemi.push(`${id} non ha stagioni: non abboccherà mai`);
    if (I.luogo && luoghi.indexOf(I.luogo) < 0) problemi.push(`${id} vive in «${I.luogo}», che non esiste`);
  }
  return problemi;
});

verifica('la Collezione del Naturalista è completabile', () => {
  const ok = fontiOttenibili();
  const problemi = [];
  const categorie = ['pesce', 'minerale', 'raccolto', 'foraggio'];
  for (const id in DATA.ITEMS) {
    const I = DATA.ITEMS[id];
    if (categorie.indexOf(I.cat) < 0 || I.spazzatura) continue;
    if (!ok.has(id)) problemi.push(`«${id}» è nella Collezione ma non è ottenibile`);
  }
  for (const r of DATA.CUCINA) if (!ok.has(r.id)) problemi.push(`il piatto «${r.id}» è nella Collezione ma non è ottenibile`);
  return problemi;
});

verifica('gli oggetti posabili corrispondono a qualcosa di costruibile', () => {
  const problemi = [];
  for (const id in DATA.ITEMS) {
    const p = DATA.ITEMS[id].posabile;
    if (!p) continue;
    const daCraft = DATA.CRAFT.some(r => r.id === id);
    const daShop = DATA.SHOP_EXTRA.indexOf(id) >= 0;
    if (!daCraft && !daShop) problemi.push(`«${id}» si può posare ma non si ottiene in nessun modo`);
  }
  return problemi;
});

verifica('le mappe dichiarate esistono davvero', () => {
  const costruite = Object.keys(WORLD.crea());
  const dichiarate = WORLD.MAPPE;
  const problemi = [];
  for (const k of costruite) if (dichiarate.indexOf(k) < 0) problemi.push(`la mappa «${k}» è costruita ma non è in WORLD.MAPPE`);
  for (const k of dichiarate) if (costruite.indexOf(k) < 0) problemi.push(`WORLD.MAPPE elenca «${k}», che non viene costruita`);
  return problemi;
});

verifica('ogni passaggio fra mappe porta a una mappa esistente', () => {
  const maps = WORLD.crea();
  const problemi = [];
  for (const id in maps) {
    for (const w of maps[id].warps) {
      if (!maps[w.to]) { problemi.push(`da «${id}» si esce verso «${w.to}», che non esiste`); continue; }
      const dest = maps[w.to];
      if (w.tx < 0 || w.ty < 0 || w.tx >= dest.w || w.ty >= dest.h)
        problemi.push(`da «${id}» si arriva in «${w.to}» fuori dalla mappa (${w.tx},${w.ty})`);
    }
  }
  return problemi;
});

verifica('ogni edificio con una porta ha davvero la porta sulla mappa', () => {
  // Nato da un bug vero: la passata che ripulisce i sentieri cancellava
  // anche le porte che ci capitavano sopra (Serafina, l'eremita), e al
  // loro posto restava un buco camminabile nel muro.
  const maps = WORLD.crea();
  const problemi = [];
  for (const id in maps) {
    const m = maps[id];
    for (const e of m.edifici) {
      if (!e.porta) continue;
      const o = m.obj[WORLD.idx(m, e.porta.x, e.porta.y)];
      if (!o) problemi.push(`«${e.nome || e.kind}» in ${id}: la porta (${e.porta.x},${e.porta.y}) è stata cancellata`);
      else if (o.t !== 'porta') problemi.push(`«${e.nome || e.kind}» in ${id}: al posto della porta c'è «${o.t}»`);
    }
  }
  return problemi;
});

verifica('le agende mandano gli abitanti su caselle calpestabili', () => {
  // Un punto dell'agenda dentro un muro significa un abitante che resta
  // incastrato per ore: si nota subito e si trova solo giocando.
  const maps = WORLD.crea();
  const dove = {};
  for (const id in maps) for (const n of (maps[id].npc || [])) dove[n.id] = id;
  const problemi = [];
  for (const id in DATA.AGENDE) {
    const mappa = maps[dove[id]];
    if (!mappa) { problemi.push(`«${id}» ha un'agenda ma non vive su nessuna mappa`); continue; }
    for (const fascia of DATA.AGENDE[id]) {
      for (const [x, y] of (fascia.giro || [])) {
        if (!WORLD.dentro(mappa, x, y)) problemi.push(`${id}: (${x},${y}) è fuori da ${dove[id]}`);
        else if (WORLD.solido(mappa, x, y)) problemi.push(`${id}: (${x},${y}) in ${dove[id]} è dentro un ostacolo`);
      }
    }
  }
  return problemi;
});

verifica('le agende coprono tutta la giornata, senza buchi', () => {
  const problemi = [];
  for (const id in DATA.AGENDE) {
    const A = DATA.AGENDE[id];
    if (!A.length) { problemi.push(`«${id}» ha un'agenda vuota`); continue; }
    let prec = -1;
    for (const f of A) {
      if (typeof f.fino !== 'number') { problemi.push(`${id}: una fascia senza «fino»`); break; }
      if (f.fino <= prec) problemi.push(`${id}: le fasce non sono in ordine (${prec} → ${f.fino})`);
      prec = f.fino;
    }
    if (A[A.length - 1].fino < 1560) problemi.push(`${id}: l'agenda finisce alle ${A[A.length-1].fino}, prima della fine della giornata`);
  }
  return problemi;
});

verifica('i compleanni cadono su giorni che esistono', () => {
  const stagioni = DATA.SEASONS.map(s => s.id);
  const problemi = [];
  const visti = {};
  for (const id in DATA.COMPLEANNI) {
    const c = DATA.COMPLEANNI[id];
    if (!DATA.NPCS[id]) problemi.push(`compleanno di «${id}», che non è un abitante`);
    if (stagioni.indexOf(c.stagione) < 0) problemi.push(`${id}: stagione «${c.stagione}» inesistente`);
    if (c.giorno < 1 || c.giorno > DATA.GIORNI_STAGIONE) problemi.push(`${id}: giorno ${c.giorno} fuori dalla stagione`);
    const k = c.stagione + '/' + c.giorno;
    if (visti[k]) problemi.push(`${id} e ${visti[k]} compiono gli anni lo stesso giorno`);
    visti[k] = id;
    if (!DATA.AUGURI || !DATA.AUGURI[id]) problemi.push(`${id} non ha una battuta per il proprio compleanno`);
  }
  return problemi;
});

verifica('ogni abitante ha battute contestuali per ogni stagione', () => {
  const problemi = [];
  for (const id in DATA.NPCS) {
    if (DATA.NPCS[id].look && DATA.NPCS[id].look.spirito) continue;
    const C = (DATA.CONTESTO || {})[id];
    if (!C) { problemi.push(`«${id}» non ha battute contestuali`); continue; }
    for (const s of DATA.SEASONS.map(x => x.id))
      if (!C.stagione || !(C.stagione[s] || []).length) problemi.push(`${id}: niente da dire in ${s}`);
    if (!C.meteo || !Object.keys(C.meteo).length) problemi.push(`${id}: niente da dire sul tempo`);
  }
  return problemi;
});

verifica('il podere è giocabile: partenza, uscite, spazi da costruire', () => {
  const maps = WORLD.crea();
  const m = maps.podere;
  const problemi = [];

  // dove nasce il giocatore e dove si sveglia ogni mattina
  for (const [x, y, che] of [[8, 10, 'punto di partenza'], [8, 9, 'risveglio del mattino']])
    if (WORLD.solido(m, x, y)) problemi.push(`${che} (${x},${y}) è dentro un ostacolo`);

  // gli spazi delle costruzioni devono essere liberi, o il pollaio non ci sta
  for (const k in m.spazi) {
    const sp = m.spazi[k];
    for (let y = sp.y; y < sp.y + sp.h; y++) for (let x = sp.x; x < sp.x + sp.w; x++) {
      if (!WORLD.dentro(m, x, y)) { problemi.push(`lo spazio «${k}» esce dalla mappa`); continue; }
      if (m.obj[WORLD.idx(m, x, y)]) problemi.push(`lo spazio «${k}» ha un ostacolo in (${x},${y})`);
      const t = WORLD.terreno(m, x, y);
      if (t === 'acqua') problemi.push(`lo spazio «${k}» è sull'acqua in (${x},${y})`);
    }
  }

  // le uscite devono essere raggiungibili a piedi
  for (const w of m.warps) {
    let libera = false;
    for (let dy = 0; dy < w.h; dy++) for (let dx = 0; dx < w.w; dx++)
      if (!WORLD.solido(m, w.x + dx, w.y + dy)) libera = true;
    if (!libera) problemi.push(`l'uscita verso «${w.to}» è murata`);
  }

  // deve restare erba libera da zappare vicino a casa, o il tutorial si blocca
  let zappabili = 0;
  for (let y = 12; y < 30; y++) for (let x = 4; x < 24; x++)
    if (WORLD.libero(m, x, y) && WORLD.terreno(m, x, y) === 'erba') zappabili++;
  if (zappabili < 60) problemi.push(`solo ${zappabili} caselle da zappare vicino a casa: il tutorial rischia`);

  return problemi;
});

verifica('dal podere si raggiunge a piedi ogni uscita', () => {
  // Una zona bella ma murata è peggio di una brutta: qui si cammina
  // davvero dalla porta di casa fino a ogni uscita.
  const m = WORLD.crea().podere;
  const visto = new Set();
  const coda = [[8, 10]];
  visto.add('8,10');
  while (coda.length) {
    const [x, y] = coda.shift();
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx = x+dx, ny = y+dy, k = nx+','+ny;
      if (visto.has(k) || WORLD.solido(m, nx, ny)) continue;
      visto.add(k); coda.push([nx, ny]);
    }
  }
  const problemi = [];
  for (const w of m.warps) {
    let ok = false;
    for (let dy = 0; dy < w.h; dy++) for (let dx = 0; dx < w.w; dx++)
      if (visto.has((w.x+dx)+','+(w.y+dy))) ok = true;
    if (!ok) problemi.push(`l'uscita verso «${w.to}» non si raggiunge camminando`);
  }
  // e la cassa di consegna? deve essere avvicinabile
  let cassa = null;
  for (let i = 0; i < m.obj.length; i++) if (m.obj[i] && m.obj[i].t === 'consegna') cassa = [i % m.w, (i / m.w) | 0];
  if (!cassa) problemi.push('la cassa di consegna non esiste più');
  else {
    const [cx, cy] = cassa;
    const accanto = [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy]) => visto.has((cx+dx)+','+(cy+dy)));
    if (!accanto) problemi.push('alla cassa di consegna non ci si arriva');
  }
  return problemi;
});

verifica('ogni mappa è raggiungibile dal podere', () => {
  // I collegamenti sono di due tipi: i passaggi fra mappe (warps) e le
  // porte degli edifici che aprono un interno.
  const maps = WORLD.crea();
  const visti = new Set(['podere']);
  const coda = ['podere'];
  while (coda.length) {
    const m = maps[coda.shift()];
    const vicini = m.warps.map(w => w.to);
    for (const e of (m.edifici || [])) {
      const dentro = WORLD.INTERNI[e.azione];
      if (dentro) vicini.push(dentro);
    }
    for (const v of vicini) if (maps[v] && !visti.has(v)) { visti.add(v); coda.push(v); }
  }
  return Object.keys(maps).filter(k => !visti.has(k)).map(k => `«${k}» non si raggiunge partendo dal podere`);
});

verifica('ogni interno è una stanza vivibile', () => {
  // Una stanza sbagliata si nota solo entrandoci: qui si controlla che
  // ci sia il pavimento, l'uscita, e che l'uscita riporti dove si è
  // entrati invece che dall'altra parte della valle.
  const maps = WORLD.crea();
  const problemi = [];
  for (const azione in WORLD.INTERNI) {
    const id = WORLD.INTERNI[azione];
    const m = maps[id];
    if (!m) { problemi.push(`la stanza «${id}» non esiste`); continue; }
    if (m.esterno) problemi.push(`«${id}» è segnata come esterno`);

    // deve esserci un'uscita, e deve tornare su una mappa vera
    if (!m.warps.length) { problemi.push(`«${id}» non ha una via d'uscita`); continue; }
    for (const w of m.warps) {
      if (!maps[w.to]) { problemi.push(`da «${id}» si esce verso «${w.to}», che non esiste`); continue; }
      if (WORLD.solido(maps[w.to], w.tx, w.ty))
        problemi.push(`uscendo da «${id}» si finisce dentro un ostacolo (${w.tx},${w.ty})`);
      if (!WORLD.solido(m, w.x, w.y) === false)
        problemi.push(`la porta di «${id}» è murata`);
    }
    // e dev'esserci spazio per camminarci
    let calpestabili = 0;
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++)
      if (!WORLD.solido(m, x, y)) calpestabili++;
    if (calpestabili < 20) problemi.push(`«${id}» ha solo ${calpestabili} caselle calpestabili`);

    // gli abitanti previsti dentro devono avere un posto dove stare
    for (const npc of (m.npcInterno || [])) {
      if (!DATA.NPCS[npc]) { problemi.push(`«${id}» ospita «${npc}», che non è un abitante`); continue; }
      const posti = (m.postiInterni || {})[npc];
      if (!posti || !posti.length) { problemi.push(`«${npc}» non ha un posto dentro «${id}»`); continue; }
      for (const [x, y] of posti)
        if (WORLD.solido(m, x, y)) problemi.push(`il posto di «${npc}» in «${id}» (${x},${y}) è occupato`);
    }
  }
  return problemi;
});

verifica('chi lavora al chiuso ha una stanza che lo ospita', () => {
  const maps = WORLD.crea();
  const problemi = [];
  for (const id in DATA.AGENDE) {
    for (const f of DATA.AGENDE[id]) {
      if (!f.interno) continue;
      const m = maps[f.interno];
      if (!m) { problemi.push(`${id} lavora in «${f.interno}», che non esiste`); continue; }
      if ((m.npcInterno || []).indexOf(id) < 0)
        problemi.push(`${id} sta in «${f.interno}» ma la stanza non lo elenca fra i suoi`);
    }
  }
  return problemi;
});

/* I passanti stanno fuori da DATA.NPCS apposta — non hanno agenda né
   compleanno — ma hanno comunque un giro da fare, e un giro va su
   caselle che esistono e su cui si può stare. Un passante piazzato
   dentro un muro resta fermo lì per sempre, e da fuori sembra una
   statua male orientata invece di un errore di coordinate. */
verifica('i passanti hanno un giro percorribile', () => {
  const maps = WORLD.crea();
  const problemi = [];
  const visti = new Set();

  for (const p of (DATA.PASSANTI || [])) {
    if (visti.has(p.id)) problemi.push(`due passanti si chiamano «${p.id}»`);
    visti.add(p.id);
    if (DATA.NPCS[p.id]) problemi.push(`«${p.id}» è anche un abitante: scegli quale dei due`);

    const m = maps[p.dove];
    if (!m) { problemi.push(`«${p.id}» sta su «${p.dove}», che non è una mappa`); continue; }
    if (!Array.isArray(p.giro) || !p.giro.length) { problemi.push(`«${p.id}» non ha un giro da fare`); continue; }

    for (const [x, y] of p.giro) {
      if (!WORLD.dentro(m, x, y)) { problemi.push(`«${p.id}»: la casella ${x},${y} è fuori da «${p.dove}»`); continue; }
      if (WORLD.solido(m, x, y)) problemi.push(`«${p.id}»: la casella ${x},${y} è occupata, ci resterebbe incastrato`);
    }
    if (!Array.isArray(p.dice) || p.dice.length < 2)
      problemi.push(`«${p.id}» ha meno di due battute: si ripeterebbe subito`);
    if (!p.look) problemi.push(`«${p.id}» non ha un aspetto`);
  }
  return problemi;
});

/* La versione si scriveva a mano in tre punti di index.html, e si era
   scollata da sola: il riquadro del changelog diceva 2.0 — quello lo
   riempie la landing leggendo js/changelog.js — mentre il piede della
   stessa pagina, due centimetri sotto, diceva ancora 1.6. Adesso la
   stampa changelog.js su ogni `.app-ver`, e qui si controlla che in
   index.html non ne rientri nessuna a mano. */
verifica('la versione si legge da un posto solo', () => {
  const html = fs.readFileSync(path.join(RADICE, 'index.html'), 'utf8');
  const src = fs.readFileSync(path.join(RADICE, 'js/changelog.js'), 'utf8');
  const problemi = [];

  const corpo = html.replace(/<!--[\s\S]*?-->/g, '');
  for (const m of corpo.matchAll(/\bv\d+\.\d+/g))
    problemi.push(`index.html ha «${m[0]}» scritto a mano: usa <span class="app-ver">`);

  const segnaposti = (corpo.match(/class="[^"]*\bapp-ver\b/g) || []).length;
  if (!segnaposti) problemi.push('nessun segnaposto .app-ver in index.html: la versione non si vede da nessuna parte');

  if (!/\.app-ver/.test(src)) problemi.push('changelog.js non stampa più la versione sui segnaposti');

  const prima = src.match(/v:\s*'([\d.]+)'/);
  if (!prima) problemi.push('non trovo la versione della voce più recente in changelog.js');

  // le versioni devono scendere: la voce più recente sta in cima
  const tutte = [...src.matchAll(/v:\s*'([\d.]+)'/g)].map(m => m[1].split('.').map(Number));
  for (let i = 1; i < tutte.length; i++) {
    const [aM, am] = tutte[i - 1], [bM, bm] = tutte[i];
    if (aM * 1000 + am <= bM * 1000 + bm)
      problemi.push(`changelog: la voce ${tutte[i - 1].join('.')} non è più recente di ${tutte[i].join('.')}`);
  }

  return problemi;
});

/* I dialoghi si scrivono a macchina un carattere per volta, e per farlo
   ui.js deve spezzare la riga in tag e testo. Regge i tag semplici e
   bilanciati — <b>, <i>, <kbd>, <br> — e nient'altro: un tag mai chiuso
   lascerebbe il grassetto acceso fino a fine dialogo, e uno sconosciuto
   (o con attributi) andrebbe a schermo in chiaro.

   Nasce da un difetto vero: la macchina da scrivere usava `textContent`,
   e i grassetti dei dialoghi si leggevano come parole — «Prima cosa:
   <b>mettitelo in mano</b>». Adesso lavora su HTML, quindi conviene che
   l'HTML sia quello che si aspetta. */
verifica('i tag nei testi dei dialoghi sono semplici e chiusi', () => {
  const AMMESSI = { b:1, i:1, kbd:1, em:1, strong:1, br:1 };
  const VUOTI = { br:1 };
  const problemi = [];

  function controlla(dove, testo) {
    if (typeof testo !== 'string' || testo.indexOf('<') < 0) return;
    const aperti = [];
    for (const m of testo.matchAll(/<[^>]*>/g)) {
      const tag = m[0];
      const t = tag.match(/^<\s*(\/?)\s*([a-zA-Z][\w-]*)\s*\/?>$/);
      if (!t) { problemi.push(`${dove}: «${tag}» non è un tag semplice`); continue; }
      const nome = t[2].toLowerCase();
      if (!AMMESSI[nome]) { problemi.push(`${dove}: tag «${nome}» non ammesso nei dialoghi`); continue; }
      if (VUOTI[nome]) continue;
      if (t[1]) {
        const j = aperti.lastIndexOf(nome);
        if (j < 0) problemi.push(`${dove}: </${nome}> chiude un tag mai aperto`);
        else aperti.splice(j, 1);
      } else aperti.push(nome);
    }
    if (aperti.length) problemi.push(`${dove}: ${aperti.map(n=>'<'+n+'>').join(' ')} non si chiude`);
  }

  // i testi che stanno in DATA, letti per davvero
  for (const id in DATA.NPCS) {
    const N = DATA.NPCS[id];
    for (const campo of ['battute', 'amico'])
      (N[campo] || []).forEach((t, i) => controlla(`NPCS.${id}.${campo}[${i}]`, t));
  }
  (DATA.MEMORIE || []).forEach(m =>
    (m.testo || []).forEach((t, i) => controlla(`MEMORIE.${m.id}[${i}]`, t)));
  for (const k in DATA.LETTERE) controlla(`LETTERE.${k}`, DATA.LETTERE[k].testo);
  for (const b of DATA.SANTUARIO) controlla(`SANTUARIO.${b.id}`, b.testo);

  /* I moduli non si possono caricare qui (vogliono il DOM): le loro
     battute si leggono dal sorgente, come si fa già per le prede.

     L'estrazione con una regex è ingenua, e gli apostrofi italiani nei
     commenti («l'ho», «un'altra») le fanno accoppiare virgolette che non
     c'entrano: ne uscivano "stringhe" che erano pezzi di codice, e il
     controllo cambiava esito a ogni commento aggiunto altrove nel file.
     Prima di estrarre si tolgono commenti e template literal, che è dove
     quegli apostrofi vivono. Poi due filtri: si guardano solo le stringhe
     con un tag da dialogo (<b>, <i>, <kbd>…), e si saltano quelle di
     markup — span, div, attributi, anche in chiusura: «</b></div>» è un
     frammento di finestra concatenata, non una battuta monca. */
  for (const f of ['js/storie.js', 'js/solstizio.js', 'js/pesca.js', 'js/game.js']) {
    const src = fs.readFileSync(path.join(RADICE, f), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')
      .replace(/`(?:[^`\\]|\\.)*`/g, '``');
    let n = 0;
    for (const m of src.matchAll(/'((?:[^'\\]|\\.)*?)'/g)) {
      const s = m[1].replace(/\\'/g, "'");
      n++;
      if (!/<\/?(b|i|kbd|em|strong|br)\s*>/.test(s)) continue;
      if (/<\/?(span|div|button|style|canvas)\b|style=|class=/.test(s)) continue;
      controlla(`${f} (stringa ${n})`, s);
    }
  }

  return problemi;
});

/* I premi dei livelli sono cinquanta righe scritte a mano che nominano
   oggetti: basta un id sbagliato — «lingotto_argento», che non esiste —
   perché salire di livello regali il nulla, e non se ne accorge nessuno
   finché qualcuno non arriva a quel livello lì, cioè settimane dopo. */
verifica('ogni premio di livello esiste e ha un senso', () => {
  const problemi = [];
  const attese = DATA.XP_LIV.length - 1;      // livelli veri, senza lo zero

  for (const k in DATA.SKILLS) {
    const scala = DATA.PREMI_LIVELLO[k];
    if (!scala) { problemi.push(`l'abilità «${k}» non ha una scala di premi`); continue; }
    if (scala.length !== attese + 1)
      problemi.push(`«${k}» ha ${scala.length - 1} premi invece di ${attese}`);
    if (scala[0] !== null) problemi.push(`«${k}»: la casella 0 dovrebbe essere vuota (a zero non si sale)`);

    let oroPrec = 0;
    for (let i = 1; i < scala.length; i++) {
      const P = scala[i];
      if (!P) { problemi.push(`«${k}» livello ${i}: premio mancante`); continue; }
      if (!DATA.ITEMS[P.item])
        problemi.push(`«${k}» livello ${i} regala «${P.item}», che non è fra gli oggetti`);
      if (!(P.n > 0))   problemi.push(`«${k}» livello ${i}: quantità non valida (${P.n})`);
      if (!(P.oro > 0)) problemi.push(`«${k}» livello ${i}: monete non valide (${P.oro})`);
      // salire deve pagare sempre di più: un livello che rende meno del
      // precedente è quasi sempre una riga copiata e non aggiornata
      if (P.oro <= oroPrec)
        problemi.push(`«${k}» livello ${i}: ${P.oro} monete, non più del livello prima (${oroPrec})`);
      oroPrec = P.oro;
    }
  }

  // e ogni abilità deve saper raccontare i propri bonus, a ogni livello
  for (const k in DATA.SKILLS) {
    if (typeof DATA.BONUS_TESTO[k] !== 'function') { problemi.push(`«${k}» non ha BONUS_TESTO`); continue; }
    if (!DATA.BONUS[k]) problemi.push(`«${k}» non ha coefficienti in BONUS`);
    for (let lv = 0; lv <= attese; lv++) {
      let righe;
      try { righe = DATA.BONUS_TESTO[k](lv); }
      catch (e) { problemi.push(`BONUS_TESTO['${k}'](${lv}) è esploso: ${e.message}`); break; }
      if (!Array.isArray(righe) || !righe.length) { problemi.push(`BONUS_TESTO['${k}'](${lv}) non dice niente`); break; }
      for (const r of righe)
        if (!Array.isArray(r) || r.length !== 2 || !r[0] || r[1] == null || /NaN|undefined/.test(String(r[1])))
          problemi.push(`BONUS_TESTO['${k}'](${lv}) ha una riga storta: ${JSON.stringify(r)}`);
    }
  }

  // la scala dell'esperienza deve salire, o G.livello non saprebbe dove fermarsi
  for (let i = 1; i < DATA.XP_LIV.length; i++)
    if (DATA.XP_LIV[i] <= DATA.XP_LIV[i-1])
      problemi.push(`XP_LIV non cresce fra il livello ${i-1} e il ${i}`);

  return problemi;
});

/* Nasce dallo spacchettamento di game.js: titolo.js, salvataggio.js e
   pesca.js sono usciti da lì, e ognuno andava anche aggiunto a mano in
   index.html. Un file scritto e mai caricato non fa rumore — non è un
   errore di sintassi, non è un test rosso: è solo una funzione che non
   esiste al momento del bisogno, e lo si scopre giocando. Più file ci
   sono, più è facile dimenticarne uno. */
verifica('index.html carica tutti i js, nell\'ordine portante', () => {
  const html = fs.readFileSync(path.join(RADICE, 'index.html'), 'utf8');
  const caricati = [...html.matchAll(/<script src="js\/([\w.-]+\.js)"><\/script>/g)].map(m => m[1]);
  const suDisco = fs.readdirSync(path.join(RADICE, 'js')).filter(n => n.endsWith('.js'));
  const problemi = [];

  for (const f of suDisco)
    if (caricati.indexOf(f) < 0) problemi.push(`js/${f} esiste ma index.html non lo carica`);
  for (const f of caricati)
    if (suDisco.indexOf(f) < 0) problemi.push(`index.html carica js/${f}, che non c'è`);
  for (const f of new Set(caricati))
    if (caricati.filter(x => x === f).length > 1) problemi.push(`js/${f} è caricato più di una volta`);

  // i due estremi che CLAUDE.md chiama portanti: DATA serve a tutti, e G
  // dev'essere l'ultimo perché al caricamento chiama subito init().
  // L'unica eccezione è debug.js, che viene dopo proprio perché legge G:
  // sta in fondo alla lista e non conta come «ultimo».
  const gioco = caricati.filter(f => f !== 'debug.js');
  if (caricati[0] !== 'data.js') problemi.push(`il primo script è ${caricati[0]}, non data.js`);
  if (gioco[gioco.length - 1] !== 'game.js')
    problemi.push(`l'ultimo script del gioco è ${gioco[gioco.length - 1]}, non game.js`);
  if (caricati.indexOf('debug.js') >= 0 && caricati[caricati.length - 1] !== 'debug.js')
    problemi.push('debug.js va caricato dopo game.js: legge G appena montato');

  return problemi;
});

/* Chi gioca col pollice ha due soli verbi a schermo, «Usa» e «Parla»,
   e sotto ci sono Spazio ed E. Prima ce n'era uno solo: il tocco sul
   canvas chiamava `usaOggetto()` e mai `interagisci()`, quindi porte,
   casse, macchinari e abitanti non esistevano — cioè il gioco non si
   poteva finire da telefono, e nessuno se n'era accorto perché la
   landing lo rifiutava alla porta.

   Questo controllo tiene fermi i pezzi che, mancando uno solo, fanno
   tornare quel buco senza rompere niente di visibile: il modulo, i due
   tasti nel markup, e il fatto che tocco.js parli al gioco con tasti
   sintetici invece che chiamandone le funzioni — che è quello che gli
   regala tutta la sensibilità al contesto (dialogo, finestra, pesca,
   lettera d'apertura) senza doverla riscrivere. */
verifica('i comandi a tocco ci sono tutti, e passano dai tasti veri', () => {
  const problemi = [];
  const html = fs.readFileSync(path.join(RADICE, 'index.html'), 'utf8');
  /* Senza togliere i commenti, questo controllo si accendeva da solo: in
     `game.js` c'è scritto **perché** il rifiuto «solo da computer» è
     stato tolto, e la spiegazione nomina le due cose che cerca. In un
     repo dove i commenti raccontano il difetto che li ha motivati, un
     controllo che legge il sorgente deve leggere il codice. */
  const senzaCommenti = f => fs.readFileSync(path.join(RADICE, 'js', f), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');
  const src  = senzaCommenti('tocco.js');
  const game = senzaCommenti('game.js');
  const ui   = senzaCommenti('ui.js');

  for (const id of ['tocco', 'tocco-pad', 'tocco-usa', 'tocco-parla'])
    if (!html.includes('id="' + id + '"')) problemi.push(`manca #${id} in index.html`);

  // i due verbi, e sotto i due tasti che il gioco ascolta davvero
  if (!/collegaTasto\(\s*\$\('#tocco-usa'\)\s*,\s*' '\s*\)/.test(src))
    problemi.push("«Usa» non è più collegato a Spazio: senza, non si zappa e non si pesca");
  if (!/collegaTasto\(\s*\$\('#tocco-parla'\)\s*,\s*'e'\s*\)/.test(src))
    problemi.push("«Parla» non è più collegato a E: senza, porte, casse e abitanti tornano irraggiungibili");

  // la regola del file: si emettono tasti, non si chiamano le funzioni
  if (!/new KeyboardEvent\('keydown'/.test(src) || !/new KeyboardEvent\('keyup'/.test(src))
    problemi.push('tocco.js non emette più KeyboardEvent: la sensibilità al contesto va riscritta a mano');

  // un solo padrone delle direzioni: due si pestano i piedi
  if (/cvs\.addEventListener\('touch/.test(game))
    problemi.push('game.js ha di nuovo gestori touch sul canvas: il movimento avrebbe due padroni');

  // il dialogo si avanza toccandolo, o su un telefono la storia finisce alla prima battuta
  if (!/getElementById\('dialogue'\)[\s\S]{0,200}addEventListener\('click'/.test(ui))
    problemi.push('il riquadro del dialogo non avanza più al tocco: ogni conversazione è un vicolo cieco');

  // e il cancello non deve tornare
  if (/id="mobile-warn"|class="lp-mobile"/.test(html) || /solo-desktop/.test(game))
    problemi.push('è tornato il rifiuto «solo da computer»: adesso direbbe una cosa falsa');

  /* IL TELEFONO CORICATO. L'HUD è disegnato per un rettangolo alto, e
     coricato si accavalla su se stesso: misurato a 844×390, i cinque
     tasti dell'HUD stavano addosso ai due verbi e all'orologio, e la
     barra dell'energia era alta metà schermo. Le regole che lo
     rimettono in ordine sono CSS e non fanno rumore sparendo: il gioco
     continua a girare, e il pulsante che apre le porte semplicemente
     non risponde più. */
  const css = fs.readFileSync(path.join(RADICE, 'css', 'style.css'), 'utf8');
  if (!/@media \(orientation:landscape\) and \(max-height:520px\)/.test(css))
    problemi.push('sparito il layout del telefono coricato: i comandi tornerebbero a sovrapporsi');
  if (!/--energia/.test(css) || !/--energia/.test(game))
    problemi.push('la barra dell\'energia non sa più girarsi: coricata resterebbe alta mezzo schermo');

  /* La linguetta del pannello di prova sta in basso a destra, che col
     dito è il posto dei comandi: in verticale copriva gli slot 8 e 9
     della barra, coricata copriva «Parla». */
  if (!/html\.col-dito \.dbg-scatola/.test(css))
    problemi.push('la linguetta del pannello di prova è tornata sui comandi del tocco');

  /* I cinque tasti dell'HUD in colonna sul bordo destro tenevano, coi
     due verbi, il 55% dell'altezza dello schermo. Vanno in riga — e in
     riga anche in VERTICALE, che è il caso che il proprietario ha visto.

     Si guarda solo la parte di foglio prima del blocco del coricato: la
     stessa regola c'è due volte, e cercandola su tutto il file la copia
     del coricato copriva quella del verticale. Rotta la prima, il
     controllo restava verde — un verde che non voleva dire niente. */
  const cssRitto = css.slice(0, css.indexOf('@media (orientation:landscape)'));
  if (!/html\.col-dito #quickbtns\{[^}]*flex-direction:row/.test(cssRitto))
    problemi.push('i tasti dell\'HUD sono tornati in colonna: rifarebbero un muro sul lato destro');

  return problemi;
});

/* Le partite stanno sul server, e questa è la parte che, se si sfila,
   non fa rumore: il gioco continua a girare, si salva, sembra tutto a
   posto — e non arriva niente di là. È già successo per un anno intero,
   perché `SINC.programmaInvio` era definita e non la chiamava nessuno:
   una partita saliva una volta sola, il giorno del collegamento, e chi
   guardava il database ci trovava dentro qualcosa e non sospettava.

   Qui si tengono ferme le tre giunture che quel difetto ha attraversato,
   e il fatto che il salvataggio locale non torni dalla finestra. */
verifica('il salvataggio passa dal server, e non torna in locale', () => {
  const problemi = [];
  const senzaCommenti = f => fs.readFileSync(path.join(RADICE, 'js', f), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');
  const salva = senzaCommenti('salvataggio.js');
  const sinc  = senzaCommenti('sincronizza.js');
  const ui    = senzaCommenti('ui.js');
  const game  = senzaCommenti('game.js');
  const html  = fs.readFileSync(path.join(RADICE, 'index.html'), 'utf8');

  // LA GIUNTURA CHE SI ERA SFILATA: salvare deve chiamare l'invio
  if (!/SINC\.programmaInvio\(\)/.test(salva))
    problemi.push('SALVA.salva non chiama più SINC.programmaInvio: le partite smetterebbero di salire sul server senza che niente lo dica');
  if (!/programmaInvio/.test(sinc))
    problemi.push('SINC.programmaInvio non esiste più');

  // la partita non deve tornare a vivere nel browser
  if (/localStorage\.setItem\(\s*['"]fioralba_save/.test(salva + sinc + game + ui))
    problemi.push('qualcuno riscrive fioralba_save_* : la partita tornerebbe ad avere due padroni che divergono');

  // e il giro dei file .json non deve riaprirsi
  for (const [dove, src] of [['salvataggio.js', salva], ['ui.js', ui], ['game.js', game]])
    if (/\.json['"]|download\s*=|importaDaFile|S\.esporta/.test(src))
      problemi.push(dove + ' è tornato a esportare o importare file .json');
  if (/id="btn-import"|class="[^"]*lp-import/.test(html))
    problemi.push('index.html ha di nuovo un pulsante di import da file');

  // le finestre che il giro nuovo richiede
  for (const f of ['scegliPartita', 'mostraCodice', 'proponiMigrazione', 'cassettoInSospeso', 'conflittoSinc'])
    if (!new RegExp('U\\.' + f + '\\s*=').test(ui)) problemi.push('manca UI.' + f);
  if (!/G\.avvia\s*=/.test(game))
    problemi.push('G.avvia non è più esposta: il selettore delle partite non può far cominciare quella scelta');
  if (!/id="sinc-spia"/.test(html))
    problemi.push('manca la spia #sinc-spia: un server che non risponde resterebbe invisibile');

  /* Il cassetto si riempie PRIMA di provare a mandare. Se lo si
     riempisse dopo il fallimento, una scheda chiusa nel mezzo della
     fetch non eseguirebbe nessun `catch` e quel pezzo di partita non
     verrebbe scritto da nessuna parte. */
  const corpo = sinc.slice(sinc.indexOf('S.programmaInvio'), sinc.indexOf('S.programmaInvio') + 700);
  if (corpo.indexOf('metti(dati)') < 0 || corpo.indexOf('metti(dati)') > corpo.indexOf('setTimeout'))
    problemi.push('il cassetto non si riempie più prima dell\'invio: una scheda chiusa a metà perderebbe la giornata');

  /* Il ritentativo dei cinque minuti. L'invio parte da `SALVA.salva`:
     se fallisce, non lo riprova nessuno finché il gioco non salva di
     nuovo — e se in quel momento si smette di giocare, il cassetto
     resta pieno fino al prossimo avvio. */
  if (!/S\.battito\s*=/.test(sinc) || !/setInterval\(\s*S\.battito/.test(sinc))
    problemi.push('è sparito il ritentativo periodico: un invio fallito non verrebbe più ripreso finché non si salva di nuovo');
  if (!/5\s*\*\s*60\s*\*\s*1000/.test(sinc))
    problemi.push('il battito non è più di cinque minuti');

  /* L'avviso a chi esce con qualcosa in mano. `beforeunload` costa la
     cache avanti/indietro, quindi il gestore si attacca solo quando il
     cassetto è pieno e si stacca quando si svuota: se qualcuno lo
     registrasse una volta per tutte, il prezzo si pagherebbe sempre. */
  if (!/addEventListener\('beforeunload'/.test(sinc))
    problemi.push('sparito l\'avviso di chi esce senza aver salvato sul server');
  if (!/removeEventListener\('beforeunload'/.test(sinc))
    problemi.push('il gestore beforeunload non si stacca più: la pagina perderebbe sempre la cache avanti/indietro');

  /* Il confronto che evita l'allarme falso a ogni ricarica: uscendo si
     manda con `keepalive`, la richiesta arriva ma la pagina è già morta
     e nessuno svuota il cassetto. Senza questo confronto, al rientro il
     gioco dice «non ancora arrivato» di una cosa arrivata. */
  if (!/c\.dati\s*===\s*r\.dati\.dati/.test(sinc))
    problemi.push('sparito il confronto cassetto/server in apri(): ogni ricarica sembrerebbe avere del gioco non salvato');

  // il nome della partita si deve poter cambiare
  if (!/G\.nomeGiocatore\s*=/.test(ui))
    problemi.push('il nome della partita non è più modificabile dalle Impostazioni');

  return problemi;
});

/* =================================================================== */

const larghezza = 62;
console.log('\n  Fioralba — coerenza dei dati\n  ' + '─'.repeat(larghezza));
for (const nome of fatti) console.log('  [32m✓[0m ' + nome);
for (const [nome, problemi] of errori) {
  console.log('  [31m✗[0m ' + nome);
  for (const p of problemi) console.log('      → ' + p);
}
console.log('  ' + '─'.repeat(larghezza));
if (errori.length) {
  const n = errori.reduce((a, e) => a + e[1].length, 0);
  console.log(`  [31m${errori.length} controlli falliti, ${n} problemi.[0m\n`);
  process.exit(1);
}
console.log(`  [32mTutti i ${fatti.length} controlli superati.[0m\n`);
