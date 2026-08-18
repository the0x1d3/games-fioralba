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

/* Un campo di stato nuovo va scritto in TRE posti: `statoIniziale()` in
   game.js, l'oggetto che si serializza in salvataggio.js, e l'elenco dei
   nomi che si rileggono. Sono tre liste a mano e non si sorvegliano fra
   loro.

   Questo controllo nasce da un difetto vero, preso mentre si aggiungevano
   le vicende del paese: `G.vicende` esisteva e funzionava per tutta la
   sessione, ma non era in nessuna delle due liste di salvataggio. In
   partita non si vedeva niente di storto — si vedeva ricaricando, con
   tutte le storie tornate da fare. Un difetto che si manifesta solo al
   giro dopo è quello che arriva più lontano prima che qualcuno lo veda.

   Si legge il sorgente e non lo stato vero, perché `statoIniziale()` sta
   in game.js e game.js qui non si carica: vuole il DOM. */
verifica('ogni pezzo di stato finisce nel salvataggio', () => {
  const g = fs.readFileSync(path.join(RADICE, 'js/game.js'), 'utf8');
  const s = fs.readFileSync(path.join(RADICE, 'js/salvataggio.js'), 'utf8');

  const corpo = g.slice(g.indexOf('function statoIniziale()'), g.indexOf('G.statoIniziale = statoIniziale'));
  if (!corpo) return ['non trovo più `statoIniziale()` in game.js: questo controllo non sa più dove guardare'];
  // le chiavi al primo piano: quattro spazi di rientro e poi `nome:`
  const nello = new Set([...corpo.matchAll(/^ {4}([a-zA-Z]\w*)\s*:/gm)].map(m => m[1]));

  const scritti = new Set([...s.matchAll(/(\w+)\s*:\s*G\.\1\b/g)].map(m => m[1]));
  const lettiM = s.match(/for\s*\(const k of \[([\s\S]*?)\]\)/);
  const letti = new Set(lettiM ? [...lettiM[1].matchAll(/'(\w+)'/g)].map(m => m[1]) : []);
  if (!scritti.size || !letti.size) return ['non trovo più le liste di salvataggio in salvataggio.js'];

  /* Quello che di proposito NON si salva, con il perché accanto: se un
     giorno uno di questi deve entrare, si toglie da qui e il controllo
     comincia a pretenderlo. */
  const fuori = {
    energia: 'si rigenera dormendo, e viene ricalcolata al caricamento',
    energiaMax: 'ricalcolata da base + bonus a ogni caricamento',
    mappaId: 'salvato a parte, insieme a px/py',
    inv: 'salvato a parte (viene normalizzato in lettura)',
    slotSel: 'la mano in cui si tiene qualcosa non è progresso',
    parlatoOggi: 'si azzera ogni mattina',
    regalatoOggi: 'si azzera ogni mattina'
  };

  const problemi = [];
  for (const k of nello) {
    if (fuori[k] || scritti.has(k)) continue;
    problemi.push(`\`G.${k}\` esiste in statoIniziale() ma non si salva: al prossimo caricamento riparte da zero`);
  }
  for (const k of scritti) {
    if (k === 'p') continue;
    if (!letti.has(k)) problemi.push(`\`G.${k}\` si salva ma non si rilegge: il salvataggio lo porta e nessuno lo raccoglie`);
  }
  for (const k of letti) if (!scritti.has(k)) problemi.push(`\`G.${k}\` si rilegge ma non lo scrive nessuno`);
  return problemi;
});

/* Le vicende del paese sono diciotto passi scritti a mano che il motore
   esegue alla lettera: un `npc` sbagliato è una scelta che non compare
   mai nel dialogo, un `dove` sbagliato è un passo che non si chiude più
   e blocca la storia per sempre, e un oggetto inventato in `ing` è una
   consegna impossibile. Nessuna di queste tre cose fa rumore giocando:
   sembrano solo storie che non partono. */
verifica('le vicende del paese stanno in piedi', () => {
  const V = DATA.VICENDE || {};
  const mappe = WORLD.MAPPE;
  const problemi = [];
  const diChi = {};
  for (const id in V) {
    const v = V[id];
    const q = t => `«${id}»: ${t}`;
    if (!DATA.NPCS[v.npc]) { problemi.push(q(`è di «${v.npc}», che non è un abitante`)); continue; }
    /* Una persona, una storia: il motore mostra le scelte per abitante e
       due storie sulla stessa faccia si presenterebbero insieme, senza
       modo di capire quale sia quale. */
    if (diChi[v.npc]) problemi.push(q(`è la seconda storia di «${v.npc}» (l'altra è «${diChi[v.npc]}»)`));
    diChi[v.npc] = id;
    if (!v.titolo || !v.scelta) problemi.push(q('manca il titolo o la voce di dialogo che la apre'));
    if (!(v.cuori >= 0 && v.cuori <= 8)) problemi.push(q(`chiede ${v.cuori} cuori, che non si raggiungono (il massimo è 8)`));
    if (!Array.isArray(v.passi) || !v.passi.length) { problemi.push(q('non ha passi')); continue; }

    const p0 = v.passi[0];
    if (p0.tipo !== 'parla' || p0.npc !== v.npc)
      problemi.push(q('il primo passo deve essere un «parla» con chi la storia appartiene, o non si apre da nessuna parte'));

    v.passi.forEach((p, i) => {
      const r = t => problemi.push(q(`passo ${i + 1}: ${t}`));
      if (!p.compito) r('non dice cosa fare (manca `compito`, cioè la riga del Diario)');
      if (!Array.isArray(p.righe) || !p.righe.length) r('non dice niente quando si chiude (manca `righe`)');
      if (p.tipo === 'parla' || p.tipo === 'porta') {
        if (!DATA.NPCS[p.npc]) r(`è con «${p.npc}», che non è un abitante`);
      } else if (p.tipo === 'luogo') {
        if (mappe.indexOf(p.dove) < 0) r(`manda in «${p.dove}», che non è un posto`);
      } else r(`è di tipo «${p.tipo}», che il motore non conosce`);
      if (p.tipo === 'porta') {
        if (!p.ing || !Object.keys(p.ing).length) r('è una consegna senza niente da consegnare');
        for (const k in (p.ing || {})) {
          if (!DATA.ITEMS[k]) r(`chiede «${k}», che non è un oggetto`);
          if (!(p.ing[k] > 0)) r(`chiede ${p.ing[k]} di «${k}»`);
        }
        /* `{ing}` è il posto dove il motore infila l'elenco di quello che
           manca. Senza, la frase resta generica proprio nel momento in
           cui il giocatore vuole sapere cosa gli serve. */
        for (const campo of ['compito', 'manca'])
          if (p[campo] && String(p[campo]).indexOf('{ing}') < 0)
            r(`\`${campo}\` non ha il segnaposto {ing}: l'elenco delle cose da portare non comparirà`);
      }
    });

    const P = v.premio || {};
    if (P.item && !DATA.ITEMS[P.item]) problemi.push(q(`paga con «${P.item}», che non è un oggetto`));
    if (P.item && !(P.qta > 0)) problemi.push(q('paga con un oggetto ma non dice quanti'));
    if (!P.oro && !P.item) problemi.push(q('non paga niente'));
  }
  return problemi;
});

/* Quello che si migliora addosso ha due modi di guastarsi in silenzio.

   Il primo è la roba inventata, come per ogni tabella. Il secondo è più
   sottile: ognuno di questi si sblocca finendo una vicenda, e se la
   vicenda non esiste — un id scritto male, una storia rinominata — non
   succede niente di rotto. Succede che quella cosa non si può comprare,
   mai, e nessuno se ne accorge perché «non è ancora sbloccata» è uno
   stato normale del gioco.

   E c'è la regola dei numeri: `passo` sta in `DATA.PERSONA` una volta
   sola perché lo leggono sia chi applica l'effetto sia chi lo racconta
   nella scheda. Qui si verifica che ci sia e che sia un numero: senza,
   la scheda scriverebbe «NaN caselle in più» — che in questo repo è già
   successo, con le frasi dei livelli. */
verifica('quello che si migliora addosso sta in piedi', () => {
  const P = DATA.PERSONA || {};
  const problemi = [];
  for (const k in P) {
    const U = P[k];
    const q = t => `«${k}»: ${t}`;
    if (!DATA.NPCS[U.da]) problemi.push(q(`lo vende «${U.da}», che non è un abitante`));
    if (!DATA.VICENDE[U.vicenda]) problemi.push(q(`si sblocca con la vicenda «${U.vicenda}», che non esiste: non si potrà comprare mai`));
    else if (DATA.VICENDE[U.vicenda].npc !== U.da)
      problemi.push(q(`lo vende ${U.da} ma si sblocca con una storia di ${DATA.VICENDE[U.vicenda].npc}`));
    if (!DATA.ITEMS[U.icona]) problemi.push(q(`ha per icona «${U.icona}», che non è un oggetto`));
    if (!(typeof U.passo === 'number' && isFinite(U.passo) && U.passo > 0))
      problemi.push(q('non ha un `passo` numerico: la scheda scriverebbe NaN'));
    if (!U.effetto || U.effetto.indexOf('{0}') < 0)
      problemi.push(q('`effetto` non ha il segnaposto {0}: il numero non comparirebbe nella frase'));
    if (!U.scelta) problemi.push(q('non ha la voce di dialogo che apre il negozio'));
    if (!Array.isArray(U.gradi) || !U.gradi.length) { problemi.push(q('non ha gradi')); continue; }
    let prima = 0;
    U.gradi.forEach((g, i) => {
      const r = t => problemi.push(q(`grado ${i + 1}: ${t}`));
      if (!g.nome) r('non ha nome');
      if (!(g.costo > 0)) r(`costa ${g.costo}`);
      /* Un grado che costa meno del precedente si compra al contrario, e
         chi ha pagato il primo si sente preso in giro. */
      if (g.costo <= prima) r(`costa ${g.costo}, cioè non più del grado prima (${prima})`);
      prima = g.costo;
      for (const i2 in (g.ing || {})) {
        if (!DATA.ITEMS[i2]) r(`chiede «${i2}», che non è un oggetto`);
        if (!(g.ing[i2] > 0)) r(`chiede ${g.ing[i2]} di «${i2}»`);
      }
      if (!Array.isArray(g.righe) || !g.righe.length) r('non fa dire niente a chi te lo dà');
    });
  }
  return problemi;
});

/* In basso al centro ci sono tre fasce sovrapposte in ordine: la barra
   degli attrezzi col nome dell'oggetto, il suggerimento («E parla con
   Bruno», «Abbocca! Premi Spazio») e i messaggi. Nessuna delle tre sa
   quanto sono alte le altre — sono tre `bottom` in pixel scritti a mano
   in tre punti diversi del CSS — e si sono già scavalcate due volte: i
   messaggi sul nome dell'attrezzo, poi il suggerimento sul nome
   dell'attrezzo durante la pesca, quando la canna in mano fa comparire
   sempre l'etichetta.

   Qui si controlla solo l'ordine, che è la parte che si può leggere dal
   sorgente: i messaggi stanno sopra al suggerimento. Le distanze vere si
   misurano nel browser, e stanno scritte nel commento accanto a
   `#toasts`. */
verifica('i messaggi stanno sopra al suggerimento', () => {
  const css = fs.readFileSync(path.join(RADICE, 'css/style.css'), 'utf8');
  const problemi = [];
  const fondo = (sel, dove) => {
    const re = new RegExp(sel.replace(/[.#]/g, '\\$&') + '\\s*\\{[^}]*?bottom\\s*:\\s*(?:calc\\(\\s*)?(\\d+)px', 'g');
    const dentro = dove ? css.slice(css.indexOf(dove)) : css;
    const m = re.exec(dentro);
    return m ? Number(m[1]) : null;
  };
  const coppie = [
    ['di suo', '#toasts', '#prompt', null],
    ['col telefono in orizzontale', 'html.col-dito #toasts', 'html.col-dito #prompt', '@media (orientation:landscape)']
  ];
  for (const [dove, selMsg, selSug, ancora] of coppie) {
    const msg = fondo(selMsg, ancora), sug = fondo(selSug, ancora);
    if (msg === null || sug === null) { problemi.push(`${dove}: non trovo più i due \`bottom\` (${selMsg}, ${selSug})`); continue; }
    if (msg <= sug) problemi.push(`${dove}: i messaggi partono da ${msg}px e il suggerimento da ${sug}px — crescendo verso l'alto ci finiscono sopra`);
  }
  return problemi;
});

/* Un posabile senza disegno non è un errore: si compra, si posa, e sul
   terreno resta il vuoto — `A.placeable` cade nel `default` e restituisce
   una tela pulita. Lo stesso vale per l'icona nello zaino, che sta in un
   secondo elenco, dentro `A.icon`: quando ne aggiungi uno è facile
   ricordarsi del primo e scordarsi del secondo, e il risultato è un
   quadratino vuoto in mano al giocatore.

   Si guarda il sorgente e non `ART`, perché disegnare vuole un canvas e
   qui il `window` è finto. Il `sentiero` non ha uno sprite da posato — è
   terreno, `posa()` lo scrive dentro `m.g` — quindi l'unico elenco che lo
   riguarda è quello delle icone. */
verifica('ogni oggetto posabile ha uno sprite e un\'icona', () => {
  const src = fs.readFileSync(path.join(RADICE, 'js/art.js'), 'utf8');
  const taglio = src.indexOf('A.icon = function');
  if (taglio < 0) return ['in art.js non si trova più `A.icon`: questo controllo non sa più dove guardare'];
  const casi = (testo) => new Set([...testo.matchAll(/case\s+'([a-z_]+)'\s*:/g)].map(m => m[1]));
  const sprite = casi(src.slice(src.indexOf('A.placeable = function'), taglio));
  const icone  = casi(src.slice(taglio));
  const problemi = [];
  for (const id in DATA.ITEMS) {
    const p = DATA.ITEMS[id].posabile;
    if (!p) continue;
    /* Le SUPERFICI non hanno uno sprite e non devono averlo: non
       appoggiano un oggetto sulla casella, le dipingono il terreno. Si
       riconoscono da sole — il nome che posano è un tipo di terreno di
       `WORLD.TIPI` — invece di stare scritte a mano qui come stava
       «sentiero», che era l'unica e adesso sono cinque. */
    const eSuperficie = WORLD.TIPI.indexOf(p) >= 0;
    if (!eSuperficie && !sprite.has(p)) problemi.push(`«${id}» si posa come «${p}», che ART.placeable non sa disegnare`);
    if (!icone.has(id)) problemi.push(`«${id}» si posa ma non ha icona nello zaino (manca in ART.icon)`);
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

/* --- e adesso: quanto pesa davvero, quell'ordine ---

   «L'ordine degli script è portante» stava scritto in due posti, e non
   l'aveva misurato nessuno. Misurato: fra i moduli ci sono 2.737
   riferimenti incrociati, e 2.720 stanno DENTRO le funzioni — cioè
   avvengono a partita avviata, quando i file ci sono tutti da un pezzo,
   e dell'ordine non sanno niente. Al caricamento ne restano sei, ed
   è l'elenco qui sotto.

   Due trappole ci sono cascate durante la misura, e vale la pena
   scriverle perché il prossimo che tocca questo controllo ci ricasca:

   - ogni file è avvolto in una IIFE, che è essa stessa una funzione.
     Chiedere «questo riferimento è dentro una funzione?» risponde
     sempre sì, e il conto viene zero: il corpo della IIFE È il
     caricamento del file, e va scoperchiato.
   - demo.js ha un `const PESCA` che è la sua dimostrazione della pesca,
     non il modulo PESCA. Cercando i nomi senza guardare chi li dichiara
     risultava un vincolo che non esiste — la stessa omonimia che aveva
     già fatto leggere male l'elenco delle dipendenze di game.js.

   Il pericolo non sono questi dodici, che si reggono. È il tredicesimo: una
   riga come `SND.init()` messa al livello del file funziona finché
   l'ordine regge, non rompe niente e non lascia traccia — e il giorno
   che qualcuno sposta uno <script> il gioco si apre bianco, con l'errore
   in una console che nessuno ha aperto.

   La parte che conta di più è però quella al contrario: se il rilevatore
   smette di vedere i vincoli NOTI, il controllo diventa rosso invece di
   diventare verde a vuoto. Un controllo che non trova più niente e dice
   «tutto a posto» è peggio che non averlo, ed è già successo di prendere
   per buono un verde che non voleva dire niente. */
const TS = (() => { try { return require('typescript'); } catch (_) { return null; } })();

const VINCOLI_NOTI = {
  'art.js|palette.js':       'PAL.suCambio(A.svuotaCache): la cache degli sprite si butta quando la palette cambia (ed è protetto da if(window.PAL))',
  'render.js|palette.js':    'PAL.suCambio(...): i blocchi di terreno sono precotti coi colori della palette (idem, protetto)',
  'solstizio.js|data.js':    'const POSTI_VEGLIA = DATA.POSTI_VEGLIA, un alias preso al caricamento',
  'game.js|solstizio.js':    'i quattro alias G.eSeraDiVeglia = SOLSTIZIO.…',
  'game.js|salvataggio.js':  'G.salva = SALVA.salva',
  'game.js|traguardi.js':    'Object.assign(G, TRAGUARDI)',
  'game.js|abitanti.js':     'Object.assign(G, ABITANTI)',
  'game.js|paese.js':        'Object.assign(G, PAESE)',
  'partite.js|ui.js':        'const U = UI: le nove finestre delle partite si appendono allo stesso oggetto UI',
  'diario.js|ui.js':         'const U = UI, e const ico = U.ico: il Diario e la Mappa si appendono allo stesso oggetto',
  'botteghe.js|ui.js':       'const U = UI, e const ico = U.ico: zaino, negozio, artigianato, cucina, fucina e santuario',
  'menu.js|ui.js':           'const U = UI, e const ico = U.ico: le Impostazioni, il «come si gioca» e le demo'
};

verifica(TS ? 'nessuno script pretende di stare dopo un altro, oltre ai dodici noti'
            : 'ordine di caricamento: SALTATO, manca typescript (fai npm install)', () => {
  if (!TS) return [];
  const dir = path.join(RADICE, 'js');
  const files = fs.readdirSync(dir).filter(n => n.endsWith('.js'));

  const definisce = {}, sorgenti = {};
  for (const f of files) {
    sorgenti[f] = fs.readFileSync(path.join(dir, f), 'utf8');
    for (const m of sorgenti[f].matchAll(/window\.([A-Z_][A-Z0-9_]*)\s*=/g)) definisce[m[1]] = f;
  }
  const noti = new Set(Object.keys(definisce));
  const trovati = {};                      // 'chi|daChi' -> dove si vede

  for (const f of files) {
    const sf = TS.createSourceFile(f, sorgenti[f], TS.ScriptTarget.ES2020, true);

    /* le IIFE più esterne: il loro corpo è il caricamento, non «dentro una funzione» */
    const involucri = new Set();
    TS.forEachChild(sf, n => {
      if (!TS.isExpressionStatement(n)) return;
      const e = n.expression;
      const ch = TS.isCallExpression(e) ? e
        : (TS.isParenthesizedExpression(e) && TS.isCallExpression(e.expression) ? e.expression : null);
      if (!ch) return;
      const g = TS.isParenthesizedExpression(ch.expression) ? ch.expression.expression : ch.expression;
      if (TS.isFunctionExpression(g) || TS.isArrowFunction(g)) involucri.add(g);
    });

    /* i nomi che il file dichiara per sé: sono suoi, non del modulo omonimo */
    const suoi = new Set();
    for (const inv of involucri)
      for (const st of (inv.body && inv.body.statements) || []) {
        if (TS.isFunctionDeclaration(st) && st.name) suoi.add(st.name.text);
        if (TS.isVariableStatement(st))
          for (const d of st.declarationList.declarations)
            if (TS.isIdentifier(d.name)) suoi.add(d.name.text);
      }

    const alCaricamento = n => {
      for (let p = n.parent; p; p = p.parent) {
        if (involucri.has(p)) continue;
        if (TS.isFunctionDeclaration(p) || TS.isFunctionExpression(p) || TS.isArrowFunction(p) ||
            TS.isMethodDeclaration(p) || TS.isGetAccessor(p) || TS.isSetAccessor(p) ||
            TS.isConstructorDeclaration(p)) return false;
      }
      return true;
    };

    const visita = n => {
      if (TS.isIdentifier(n) && noti.has(n.text) && definisce[n.text] !== f && !suoi.has(n.text)) {
        const p = n.parent;
        const eProprieta = (TS.isPropertyAccessExpression(p) && p.name === n) ||
                           (TS.isPropertyAssignment(p) && p.name === n) ||
                           (TS.isBindingElement(p) && p.propertyName === n);
        if (!eProprieta && alCaricamento(n)) {
          const k = f + '|' + definisce[n.text];
          if (!trovati[k]) trovati[k] = `${n.text}, a js/${f}:${sf.getLineAndCharacterOfPosition(n.getStart()).line + 1}`;
        }
      }
      TS.forEachChild(n, visita);
    };
    visita(sf);
  }

  const problemi = [];
  for (const k of Object.keys(trovati))
    if (!VINCOLI_NOTI[k]) {
      const [chi, da] = k.split('|');
      problemi.push(`js/${chi} tocca ${trovati[k]} al CARICAMENTO: da adesso pretende di stare dopo js/${da}. ` +
        'Se è voluto, scrivilo in VINCOLI_NOTI qui sopra e mettilo nell\'ordine giusto in index.html; ' +
        'se no, spostalo dentro una funzione — lì l\'ordine non conta.');
    }
  for (const [k, perche] of Object.entries(VINCOLI_NOTI))
    if (!trovati[k]) {
      const [chi, da] = k.split('|');
      problemi.push(`il vincolo noto js/${chi} → js/${da} non si vede più (${perche}). ` +
        'O è stato tolto davvero, e allora va tolto anche da VINCOLI_NOTI, oppure il rilevatore ' +
        'ha smesso di funzionare: senza questa riga il controllo stava per diventare verde senza guardare niente.');
    }

  /* i vincoli veri devono trovare in index.html l'ordine che chiedono */
  const html = fs.readFileSync(path.join(RADICE, 'index.html'), 'utf8');
  const caricati = [...html.matchAll(/<script src="js\/([\w.-]+\.js)"><\/script>/g)].map(m => m[1]);
  for (const [k, perche] of Object.entries(VINCOLI_NOTI)) {
    const [chi, da] = k.split('|');
    const i = caricati.indexOf(chi), j = caricati.indexOf(da);
    if (i >= 0 && j >= 0 && j > i)
      problemi.push(`index.html carica js/${chi} PRIMA di js/${da}, ma al caricamento gli serve: ${perche}`);
  }

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

  for (const id of ['tocco', 'tocco-pad', 'tocco-usa', 'tocco-parla', 'tocco-corri'])
    if (!html.includes('id="' + id + '"')) problemi.push(`manca #${id} in index.html`);

  // i verbi, e sotto i tasti che il gioco ascolta davvero
  if (!/collegaTasto\(\s*\$\('#tocco-usa'\)\s*,\s*' '\s*\)/.test(src))
    problemi.push("«Usa» non è più collegato a Spazio: senza, non si zappa e non si pesca");
  if (!/collegaTasto\(\s*\$\('#tocco-parla'\)\s*,\s*'e'\s*\)/.test(src))
    problemi.push("«Parla» non è più collegato a E: senza, porte, casse e abitanti tornano irraggiungibili");
  if (!/collegaTasto\(\s*\$\('#tocco-corri'\)\s*,\s*'shift'\s*\)/.test(src))
    problemi.push("«Corri» non è più collegato a Shift: da telefono si tornerebbe ad andare solo al passo");

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

/* La veglia fissata «domani sera» e poi saltata — a dormire prima del
   tramonto, o svenendo a mezzanotte dall'altra parte della valle — non
   deve chiudere l'atto secondo per sempre: `eSeraDiVeglia()` confronta
   il giorno con l'uguale, e con `giornoTot` andato oltre non tornava
   mai più vera. Fiammella ripeteva «È domani sera» per l'eternità.
   Il controllo esegue il modulo vero e verifica che il risveglio
   riporti la data a oggi: è una prova di comportamento, non di testo,
   così qualunque modo di correggere il difetto la tiene verde. */
verifica('la veglia saltata si ripropone la sera dopo', () => {
  const vm = require('vm');
  const problemi = [];
  const sandbox = { window:{}, console, DATA };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(RADICE, 'js/solstizio.js'), 'utf8'),
    sandbox, { filename:'solstizio.js' });
  sandbox.G = {
    giornoTot: 12,
    trame: { veglia: { avviata:true, memorie:{}, verita:true, invitati:{}, giorno:10, fatta:false } },
    maps: {}     // senza bosco: qui conta solo la data, non gli ospiti
  };
  sandbox.window.SOLSTIZIO.aggiornaOspitiVeglia();
  const v = sandbox.G.trame.veglia;
  if (v.giorno !== 12)
    problemi.push(`la veglia saltata resta al giorno ${v.giorno} con giornoTot 12: l'atto secondo non si chiude più`);
  if (!sandbox.window.SOLSTIZIO.eSeraDiVeglia())
    problemi.push('dopo il risveglio eSeraDiVeglia() è ancora falsa: Fiammella continuerebbe a dire «È domani sera»');
  // una veglia già fatta invece non si riapre
  sandbox.G.trame.veglia = { avviata:true, memorie:{}, verita:true, invitati:{}, giorno:10, fatta:true };
  sandbox.window.SOLSTIZIO.aggiornaOspitiVeglia();
  if (sandbox.G.trame.veglia.giorno !== 10)
    problemi.push('una veglia già conclusa viene rimessa in calendario');
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
  /* L'interfaccia è in due file da quando le finestre delle partite
     sono uscite in partite.js, e qui si guarda l'insieme: a questo
     controllo interessa che quelle strade esistano, non in quale dei
     due file stiano scritte. Senza questa riga lo stacco faceva sparire
     sei finestre agli occhi del controllo, che è esattamente quello che
     è successo — ed è la terza volta che uno stacco inciampa qui. */
  const ui    = ['ui.js', 'partite.js', 'diario.js', 'botteghe.js', 'menu.js'].map(senzaCommenti).join('\n');
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

  /* Il giro dei .json non deve riaprirsi — ma la porta a SENSO UNICO sì.

     Convertire un vecchio file in una partita sul server è un'altra
     cosa dall'esportarne uno nuovo: chi ha un .json sul desktop da
     quando Fioralba li esportava deve poterlo portare dentro. Quello
     che non deve tornare è l'USCITA — un file scaricabile — perché da lì
     ricomincia la storia delle due partite che divergono.

     Il controllo guarda quindi la scrittura, non la lettura: niente
     `download=`, niente Blob salvati, niente `esporta`. */
  for (const [dove, src] of [['salvataggio.js', salva], ['ui.js o partite.js', ui], ['game.js', game],
                             ['sincronizza.js', sinc]])
    if (/download\s*=|createObjectURL|S\.esporta|G\.esporta/.test(src))
      problemi.push(dove + ' è tornato a esportare la partita in un file: da lì ricominciano le due copie che divergono');
  if (/id="btn-import"|class="[^"]*lp-import/.test(html))
    problemi.push('index.html ha di nuovo un pulsante di import da file');

  /* La conversione del vecchio .json, e la cancellazione. Sono due
     strade che passano dal selettore e nessuna delle due fa rumore
     sparendo: il selettore continua ad aprirsi e a funzionare. */
  if (!/S\.daFileLegacy\s*=/.test(sinc))
    problemi.push('sparita la conversione del vecchio file .json: chi ne ha uno resta fuori');
  if (!/sinc-legacy-link/.test(ui))
    problemi.push('il selettore non offre più di convertire un vecchio .json');
  if (!/S\.cancella\s*=/.test(sinc) || !/U\.confermaCancella\s*=/.test(ui))
    problemi.push('sparita la cancellazione di una partita');

  /* Cancellare deve arrivare al SERVER, o non ha cancellato niente: una
     partita tolta solo dall'elenco locale resta viva, col suo codice
     ancora buono e nessuno che se lo ricordi. */
  const server = fs.readFileSync(path.join(RADICE, 'server-partite.js'), 'utf8');
  if (!/req\.method === 'DELETE'/.test(server) || !/async cancella\(/.test(server))
    problemi.push('il server non sa più cancellare una partita: «elimina» sarebbe una bugia');
  const corpoCanc = sinc.slice(sinc.indexOf('S.cancella'), sinc.indexOf('S.cancella') + 800);
  if (corpoCanc.indexOf("chiama('DELETE'") < 0 ||
      corpoCanc.indexOf("chiama('DELETE'") > corpoCanc.indexOf('S.dimentica'))
    problemi.push('S.cancella non chiede più al server PRIMA di dimenticare: se il server dicesse di no ' +
                  'resterebbe una partita viva di cui nessuno ha più il codice');

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

/* I due agganci dello sprite dei personaggi.

   Sono aritmetica pura, e quando è sbagliata non si rompe niente: il
   gioco disegna, nessuna prova diventa rossa, e gli abitanti hanno solo
   un'aria storta che uno fatica a mettere a fuoco. Il proprietario l'ha
   detto così — «alcune texture sono deformate» — ed erano queste due.

   Il conto NON è scritto a mano qui: si legge da art.js e si verifica
   che il renderer sia d'accordo. Se un giorno la cella cresce, questo
   controllo cresce con lei invece di diventare una bugia. */
verifica('il contorno e i ritratti sono agganciati dove devono', () => {
  const problemi = [];
  const art  = fs.readFileSync(path.join(RADICE, 'js', 'art.js'), 'utf8');
  const rend = fs.readFileSync(path.join(RADICE, 'js', 'render.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');
  const fx   = fs.readFileSync(path.join(RADICE, 'js', 'fx.js'), 'utf8');

  const mW = art.match(/A\.CH_W\s*=\s*(\d+)/), mH = art.match(/A\.CH_H\s*=\s*(\d+)/);
  if (!mW || !mH) { problemi.push('non trovo A.CH_W / A.CH_H in art.js'); return problemi; }
  const CH_W = +mW[1], CH_H = +mH[1];

  /* dove sta il personaggio dentro alla cella, secondo charSprite */
  const anc = art.match(/A\.drawChar\(x,\s*A\.CH_W\/2,\s*A\.CH_H-(\d+)/);
  if (!anc) { problemi.push('charSprite non ancora più il personaggio a (CH_W/2, CH_H-n)'); return problemi; }
  const cx = CH_W / 2, cy = CH_H - (+anc[1]);

  /* FX.contorno allarga la tela di `K` pixel per lato — uno di disegno,
     due di mondo — e `charSprite` è una tela cotta a densità doppia.
     Il conto però si continua a fare in unità di DISEGNO, perché è lì
     che stanno CH_W e CH_H e l'ancoraggio ai piedi; il renderer poi lo
     scrive moltiplicato per K, ed è quello che si va a leggere. */
  const bordo = /c\.width\s*=\s*src\.width\+2\*K;\s*c\.height\s*=\s*src\.height\+2\*K/.test(fx) ? 1 : null;
  if (bordo === null) { problemi.push('FX.contorno non allarga più di K per lato: il conto qui sotto non vale'); return problemi; }

  const attesoX = -(cx + bordo), attesoY = -(cy + bordo);
  const usati = [...rend.matchAll(/FX\.contorno\(ART\.charSprite\([^)]*\)\),\s*\(px([+-]\d+)\*K\)\|0,\s*\(py([+-]\d+)\*K\)\|0/g)];
  if (!usati.length) problemi.push('il renderer non disegna più il contorno dei personaggi in pixel di mondo (px-n*K)');
  for (const u of usati) {
    if (+u[1] !== attesoX || +u[2] !== attesoY)
      problemi.push(`contorno disegnato a (px${u[1]}*K, py${u[2]}*K) invece di (px${attesoX}*K, py${attesoY}*K): ` +
                    'sborda da due lati e i personaggi sembrano storti');
  }

  /* E il personaggio vero va dentro a un blocco raddoppiato, ancorato a
     zero: `drawChar` disegna pixel per pixel in unità di disegno, e
     chiamato in pixel di mondo verrebbe fuori mezzo. */
  const chiamate = [...rend.matchAll(/ART\.drawChar\(sx,\s*([^,]+),\s*([^,]+),/g)];
  if (!chiamate.length) problemi.push('il renderer non disegna più i personaggi');
  for (const c of chiamate) {
    if (c[1].trim() !== '0' || c[2].trim() !== '0')
      problemi.push(`ART.drawChar chiamato a (${c[1].trim()}, ${c[2].trim()}) invece che a (0, 0): ` +
                    'fuori da un blocco raddoppiato il personaggio esce mezza casella più piccolo');
  }

  /* Il ritratto del dialogo inquadra la testa, ma la statura la sposta
     in su: senza compensarla, chi è alto e porta il cappello esce dai
     96×96. Serafina (altezza 2 + cappello) arrivava a y=0, tagliata. */
  if (!/x\.translate\(0,\s*8\s*\+\s*altezzaRitratto\)/.test(art))
    problemi.push('A.face non compensa più la statura: i ritratti dei personaggi alti col cappello si tagliano in cima');

  return problemi;
});

/* Nessuna battuta deve arrivare tagliata dentro al fumetto.

   Queste frasi sono quasi tutte a due tempi — una premessa e una chiusa
   — e troncare taglia sempre la chiusa: «Ilde saliva fin qui ogni
   inverno, con una fetta di torta. Non parlava. Guardava e basta.»
   diventava «…con una fetta di torta.», cioè un'informazione al posto
   di un ricordo. Erano 33 su 60, il 55%, e nessuno se n'era accorto
   perché il taglio è educato: mette i puntini e sembra una scelta.

   Il modo giusto di tenere corte le battute è accorgersene mentre le si
   scrive. Questo controllo usa la `spezza()` VERA, presa dal sorgente:
   una copia riscritta qui misurerebbe un altro algoritmo, e il giorno
   che quello cambia questo resterebbe verde per conto suo. */
verifica('nessuna battuta dei fumetti arriva tagliata', () => {
  const problemi = [];
  const rend = fs.readFileSync(path.join(RADICE, 'js', 'render.js'), 'utf8');
  const da = rend.indexOf('const FUM_RIGA');
  const a  = rend.indexOf('\n}', rend.indexOf('function spezza')) + 2;
  if (da < 0 || a < 2) { problemi.push('non trovo spezza() in render.js'); return problemi; }
  let mod;
  try { mod = new Function(rend.slice(da, a) + '; return { spezza, FUM_RIGA, FUM_RIGHE };')(); }
  catch (e) { problemi.push('spezza() non si lascia leggere da qui: ' + e.message); return problemi; }

  const battute = [];
  for (const id in DATA.NPCS) {
    const N = DATA.NPCS[id];
    for (const b of (N.battute || [])) battute.push([id, b]);
    for (const campo of ['stagione', 'meteo', 'ora', 'sagra', 'compleanno'])
      if (N[campo]) for (const k in N[campo])
        for (const b of [].concat(N[campo][k])) battute.push([id + ' (' + campo + ')', b]);
  }
  for (const p of (DATA.PASSANTI || [])) for (const b of (p.dice || [])) battute.push(['passante ' + p.id, b]);

  /* Anche in inglese. Le stesse battute tradotte cambiano lunghezza, e
     un controllo che guarda solo l'italiano lascerebbe passare un
     fumetto tagliato per metà dei giocatori. Il catalogo si legge come
     lo legge il gioco; se una frase non è tradotta resta l'italiana e
     viene contata due volte, che non fa danno. */
  try {
    const sb = { window:{} };
    require('vm').runInNewContext(
      fs.readFileSync(path.join(RADICE, 'js', 'lingua-en.js'), 'utf8'), sb, { filename:'lingua-en.js' });
    const cat = sb.window.LINGUA_EN || {};
    for (const [chi, testo] of battute.slice())
      if (cat[testo]) battute.push([chi + ' [en]', cat[testo]]);
  } catch (e) { /* senza catalogo si controlla solo l'italiano */ }

  for (const [chi, testo] of battute) {
    const righe = mod.spezza(testo);
    if (righe.some(r => r.endsWith('…')))
      problemi.push(`la battuta di ${chi} non ci sta nel fumetto e verrebbe tagliata ` +
                    `(${String(testo).length} caratteri, ce ne stanno ${mod.FUM_RIGHE * mod.FUM_RIGA}): ` +
                    JSON.stringify(testo));

    /* Una parola sola più lunga di una riga non viene troncata da
       nessuno: `spezza` non spezza dentro le parole, quindi esce una
       riga larga quanto la parola e il fumetto si allarga con lei.
       Provato: una battuta di centosessanta caratteri senza spazi
       passava indenne il controllo qui sopra. */
    for (const r of righe)
      if (r.length > mod.FUM_RIGA)
        problemi.push(`la battuta di ${chi} ha una parola più lunga di una riga (${r.length} ` +
                      `caratteri contro ${mod.FUM_RIGA}): il fumetto si allarga fuori misura`);
  }
  return problemi;
});

/* I premi delle collezioni, e il «cosa serve» delle braci.

   Sono due cose che spariscono senza far rumore: un premio con un
   oggetto che non esiste si riscuote lo stesso e non arriva niente
   nello zaino, e una categoria senza premio resta l'unica che si
   completa senza dare niente — che è esattamente il difetto da cui
   nasce tutto questo. */
verifica('ogni collezione ha il suo premio, e i premi esistono', () => {
  const problemi = [];
  const P = DATA.PREMI_COLLEZIONE || {};

  /* Le categorie si leggono dal sorgente di traguardi.js: riscriverle
     qui vorrebbe dire tenere due elenchi d'accordo per sempre, ed è la
     cosa che questo file esiste per evitare. (Stavano in game.js fino
     allo stacco: le funzioni si chiamano ancora G.categorieCollezione
     perché game.js le rimette su G, ma il sorgente è di là.) */
  const traguardi = fs.readFileSync(path.join(RADICE, 'js', 'traguardi.js'), 'utf8');
  const dentro = traguardi.slice(traguardi.indexOf('TG.categorieCollezione = function'),
                                 traguardi.indexOf('TG.contaCollezione = function'));
  const cat = [...dentro.matchAll(/\{\s*id:'(\w+)'/g)].map(m => m[1]);
  if (!cat.length) { problemi.push('non trovo le categorie in TG.categorieCollezione (js/traguardi.js)'); return problemi; }

  for (const id of cat)
    if (!P[id]) problemi.push(`la collezione «${id}» non ha un premio: si completerebbe senza dare niente`);
  for (const id in P)
    if (cat.indexOf(id) < 0) problemi.push(`c'è un premio per «${id}», che non è una collezione`);

  for (const id in P) {
    const p = P[id];
    if (!(p.oro > 0)) problemi.push(`il premio di «${id}» non dà monete`);
    if (!p.item || !DATA.ITEMS[p.item])
      problemi.push(`il premio di «${id}» regala «${p.item}», che non esiste fra gli oggetti`);
    if (!(p.n > 0)) problemi.push(`il premio di «${id}» regala zero pezzi di ${p.item}`);
  }

  /* I due traguardi sostituiti non devono tornare: pagherebbero una
     seconda volta lo stesso gesto. E la mappa che li ricorda serve a non
     far riscuotere due volte chi li aveva già presi. */
  for (const id in (DATA.COLLEZIONE_DA_TRAGUARDO || {})) {
    const vecchio = DATA.COLLEZIONE_DA_TRAGUARDO[id];
    if (new RegExp("cont\\('" + vecchio + "'").test(traguardi))
      problemi.push(`il traguardo «${vecchio}» è tornato: pagherebbe due volte la collezione «${id}»`);
  }

  /* Il «cosa serve» delle braci si apre solo col ponte: senza, è un
     elenco di offerte per un posto dove non si può ancora andare.
     Quella riga sta nel Diario, che dal 14 agosto 2026 è in diario.js e
     non più in ui.js: è la quarta volta che uno stacco fa cadere un
     controllo che cerca del codice per nome dentro a un file preciso, e
     ogni volta la correzione è la stessa — guardare l'interfaccia
     intera invece di uno dei file in cui è divisa. */
  const ui = ['ui.js', 'diario.js', 'partite.js', 'botteghe.js', 'menu.js']
    .map(f => fs.readFileSync(path.join(RADICE, 'js', f), 'utf8')).join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  if (!/G\.costruzioni && G\.costruzioni\.ponte/.test(ui))
    problemi.push('il «cosa serve» delle braci non è più legato al ponte');

  /* E ogni cosa che una brace chiede dev'essere un oggetto vero, o la
     riga con «dove si trova» resterebbe vuota proprio lì. */
  for (const b of DATA.SANTUARIO)
    for (const r of b.req)
      if (!DATA.ITEMS[r]) problemi.push(`la brace «${b.id}» chiede «${r}», che non esiste`);

  return problemi;
});

/* «Dove si trova» dev'essere tradotto per intero.

   `IT.dove` costruisce le sue frasi dai dati, e per mesi le ha
   costruite col `+`: il nome dell'oggetto era tradotto e la frase
   intorno no, quindi in inglese si leggeva «Cresce nel campo dai Semi
   di **Turnip**, che Bruno vende in primavera». Misurato: 67 righe su
   121, il 55%.

   Adesso ogni frase è un modello, e questo controllo verifica che ogni
   modello abbia la sua traduzione. Non è il censimento (`tools/lingua.js`,
   che gira a parte): è la parte che `npm test` deve poter bocciare,
   perché una riga mezza inglese non rompe niente e nessuno se ne
   accorge finché non la legge un giocatore. */
verifica('«dove si trova» è tradotto per intero', () => {
  const problemi = [];
  const ui = fs.readFileSync(path.join(RADICE, 'js', 'ui.js'), 'utf8');
  const da = ui.indexOf('function nomeStagione(id){');
  const apre = ui.indexOf('IT.dove = function(id){', da);
  if (da < 0 || apre < 0) { problemi.push('non trovo IT.dove in ui.js'); return problemi; }
  const re = /\r?\n\};\r?\n/g; re.lastIndex = apre;
  let fine = -1, m;
  while ((m = re.exec(ui))) {
    const dentro = ui.slice(apre, m.index);
    if ((dentro.split('{').length - dentro.split('}').length) === 1) { fine = m.index; break; }
  }
  if (fine < 0) { problemi.push('non trovo la chiusura di IT.dove'); return problemi; }
  const zona = ui.slice(da, fine);

  let cat = null;
  try {
    const sb = { window:{} };
    require('vm').runInNewContext(
      fs.readFileSync(path.join(RADICE, 'js', 'lingua-en.js'), 'utf8'), sb, { filename:'lingua-en.js' });
    cat = sb.window.LINGUA_EN;
  } catch (e) { problemi.push('non riesco a leggere il catalogo inglese: ' + e.message); return problemi; }

  /* Ogni letterale passato a T(...) o F(...) dentro alla zona. Le
     stringhe di servizio (id, chiavi) non hanno spazi e si scartano. */
  const viste = new Set();
  for (const mm of zona.matchAll(/\b[TF]\(\s*'((?:[^'\\]|\\.)*)'/g)) {
    const s = mm[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\');
    if (s.indexOf(' ') < 0) continue;
    viste.add(s);
  }
  /* e le frasi dentro alla tabella AMANO, che passano tutte da T() */
  const amano = zona.slice(zona.indexOf('const AMANO = {'), zona.indexOf('};', zona.indexOf('const AMANO = {')));
  for (const mm of amano.matchAll(/:\s*'((?:[^'\\]|\\.)*)'/g)) {
    const s = mm[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\');
    if (s.indexOf(' ') >= 0) viste.add(s);
  }

  if (viste.size < 20) problemi.push(`trovo solo ${viste.size} frasi in IT.dove: la lettura del sorgente non funziona più`);
  for (const s of viste)
    if (!cat[s]) problemi.push('«dove si trova» ha una frase senza traduzione inglese: ' + JSON.stringify(s.slice(0, 70)));

  return problemi;
});

/* Il censimento deve conoscere tutte le strozzature della traduzione.

   `tools/lingua.js` non legge «ogni stringa italiana»: parte da chi
   parla col giocatore, e tiene l'elenco in `USCITE`. Il buco è che una
   strozzatura nuova non fa rumore — non è un errore, non è un test
   rosso, è solo un pezzo di gioco che il conto smette di guardare.

   `T` ci è stato fuori a lungo, e il danno era doppio e invisibile: il
   censimento diceva «862 su 862, zero mancanti» mentre 102 frasi non
   le aveva mai viste, e le loro traduzioni — che c'erano — finivano
   nell'elenco delle orfane, 384 invece di 282. Due contatori che si
   confermavano a vicenda e sbagliavano insieme.

   Qui non si controlla come è scritto `USCITE`, ma cosa fa: si ricostruisce
   la stessa regex del censimento e le si dà in pasto una chiamata finta
   per ogni strozzatura trovata nel sorgente. Se non la riconosce, quella
   strozzatura è cieca. */
verifica('il censimento delle lingue conosce ogni strozzatura', () => {
  const problemi = [];
  const dir = path.join(RADICE, 'js');

  /* Le strozzature, nelle due forme in cui sono scritte: `const X = … =>`
     e `function X(…)`. Cercare solo la prima è il modo di rifare lo
     stesso buco un piano più sotto — `fraseF` è dichiarata `function`, e
     un controllo che guardava le sole freccie la dava per coperta.
     Solo `t` e `f`, non `n`: `NUM` passa numeri, non frasi, e nel
     catalogo non ci va. La finestra corta fra la dichiarazione e la
     chiamata tiene dentro le due righe di `F`, che va a capo dopo
     `window.LINGUA`. */
  const nomi = new Set();
  for (const f of fs.readdirSync(dir).filter(n => n.endsWith('.js'))) {
    if (f === 'lingua.js' || f.startsWith('lingua-')) continue;
    const src = fs.readFileSync(path.join(dir, f), 'utf8');
    for (const m of src.matchAll(/const\s+(\w+)\s*=\s*(?:\([^)]*\)|\w+)\s*=>[\s\S]{0,120}?LINGUA\.[tf]\(/g))
      nomi.add(m[1]);
    for (const m of src.matchAll(/function\s+(\w+)\s*\([^)]*\)\s*\{[\s\S]{0,120}?LINGUA\.[tf]\(/g))
      nomi.add(m[1]);
  }
  if (nomi.size < 2) { problemi.push(`trovo solo ${nomi.size} strozzature nei js: la lettura del sorgente non funziona più`); return problemi; }

  const sorgente = fs.readFileSync(path.join(RADICE, 'tools', 'lingua.js'), 'utf8');
  const mU = sorgente.match(/const USCITE = \[([\s\S]*?)\n\];/);
  if (!mU) { problemi.push('non trovo USCITE in tools/lingua.js'); return problemi; }
  /* i commenti prima dei letterali: dentro ci sono apostrofi italiani
     («l'oggetto») che un cercatore di stringhe leggerebbe come virgolette */
  const zona = mU[1].replace(/\/\*[\s\S]*?\*\//g, '');
  const uscite = [...zona.matchAll(/'((?:[^'\\]|\\.)*)'/g)].map(m => m[1].replace(/\\\\/g, '\\'));
  if (!uscite.length) { problemi.push('USCITE risulta vuoto: la lettura di tools/lingua.js non funziona più'); return problemi; }

  const re = new RegExp('(?:' + uscite.join('|') + ")\\(\\s*'");
  for (const n of nomi)
    if (!re.test(n + "('ciao')"))
      problemi.push(`la strozzatura ${n}(...) non è in USCITE (tools/lingua.js): le sue frasi non vengono censite e in inglese restano in italiano`);

  return problemi;
});

/* Due passaggi che, tappandosi, non fanno rumore.

   Il primo è il corridoio del ponte: `ristampaBurrone` sfratta casse e
   macchinari dal burrone e li posa a due caselle a nord del ponte, cioè
   dentro l'unico passaggio del gioco. `vicinoLibero` cerca la casella
   libera più vicina e non sa che quelle sono le uniche per cui si
   passa: una cassa lì e la radura torna irraggiungibile, con l'aria di
   essere roba messa lì apposta dal giocatore.

   Il secondo è il campo sotto una costruzione: il podere è coltivabile
   dappertutto e niente impediva di seminare dove sarebbe sorto il
   pollaio. Misurato: 20 caselle su 20 sepolte sotto il pollaio, 30 su
   30 sotto la serra, con le colture ancora scritte nel salvataggio ma
   la casella diventata muro. Segnalato da chi ci giocava: «non posso
   neanche raccogliere il raccolto». */
verifica('il ponte non si tappa, e le costruzioni non seppelliscono il campo', () => {
  const problemi = [];
  const maps = WORLD.crea();
  WORLD.costruisci(maps, 'ponte');
  const b = maps.bosco, p = b.pontePos;

  const passa = (m) => {
    const q = m.pontePos;
    let s = null;
    for (let y = 2; y < q.y-1 && !s; y++)
      for (let x = 2; x < m.w-2; x++) if (!WORLD.solido(m,x,y)) { s = [x,y]; break; }
    const visti = new Set([s.join(',')]), coda = [s];
    while (coda.length) {
      const [x,y] = coda.shift();
      for (const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0]]) {
        const nx=x+dx, ny=y+dy, k=nx+','+ny;
        if (visti.has(k) || !WORLD.dentro(m,nx,ny) || WORLD.solido(m,nx,ny)) continue;
        visti.add(k); coda.push([nx,ny]);
      }
    }
    let sud=0, presi=0;
    for (let y=q.y+q.h; y<m.h; y++) for (let x=0; x<m.w; x++)
      if (!WORLD.solido(m,x,y)) { sud++; if (visti.has(x+','+y)) presi++; }
    return { sud, presi };
  };

  /* A 4 VICINI, non a 8: la BFS a otto passa in diagonale fra due
     angoli, quindi direbbe «si passa» anche di un varco che il
     giocatore non attraversa. */
  const prima = passa(b);
  if (prima.presi < prima.sud)
    problemi.push(`col ponte costruito si raggiunge solo ${prima.presi} delle ${prima.sud} caselle oltre il burrone`);

  /* e se qualcosa ci finisce sopra, la ristampa deve sgombrarlo */
  for (let x = p.x; x < p.x+p.w; x++)
    b.obj[WORLD.idx(b, x, p.y+1)] = { t:'macchina', kind:'cassa', solido:true };
  const tappato = passa(b);
  if (tappato.presi >= tappato.sud)
    problemi.push('tre casse in mezzo al ponte non lo tappano: questa prova non sa più distinguere');
  WORLD.ristampaBurrone(b, true);
  const dopo = passa(b);
  if (dopo.presi < dopo.sud)
    problemi.push('ristampaBurrone non sgombra più il corridoio del ponte: una partita può restare bloccata di là dal burrone');

  /* IL SALVATAGGIO NON DECIDE IL CORRIDOIO. Segnalato in partita: «il
     ponte ha due blocchi invisibili che non te lo fanno attraversare».
     Il terreno viaggia nel salvataggio, e se il varco di una versione
     precedente stava in un altro punto, nelle caselle del ponte attuale
     il salvataggio dice roccia o vuoto: la ristampa le SALTAVA «per non
     toccare il ponte», e i blocchi restavano lì, invisibili sotto la
     passerella disegnata. Qui si simula esattamente quel salvataggio:
     ponte costruito, corridoio sporcato, e dopo la ristampa si deve
     passare. */
  for (let x = p.x; x < p.x+p.w; x++)
    b.g[WORLD.idx(b, x, p.y+1)] = WORLD.ti(x===p.x+1 ? 'roccia' : 'vuoto');
  const sporco = passa(b);
  if (sporco.presi >= sporco.sud)
    problemi.push('il corridoio sporcato non blocca: questa prova non sa più distinguere');
  WORLD.ristampaBurrone(b, true);
  const pulito = passa(b);
  if (pulito.presi < pulito.sud)
    problemi.push('un salvataggio col varco vecchio lascia blocchi invisibili sul ponte: il ponte pagato non si attraversa');
  /* e senza ponte il corridoio deve restare CHIUSO anche se il
     salvataggio lo diceva aperto: assi scritte da chissà quando non
     regalano il passaggio. Si guarda il corridoio stesso, non la BFS:
     a sud-ovest del burrone si arriva a piedi da sempre, ed è giusto. */
  for (let y = p.y; y < p.y+p.h; y++) for (let x = p.x; x < p.x+p.w; x++)
    b.g[WORLD.idx(b, x, y)] = WORLD.ti('assi');
  WORLD.ristampaBurrone(b, false);
  for (let y = p.y; y < p.y+p.h; y++) for (let x = p.x; x < p.x+p.w; x++)
    if (!WORLD.solido(b, x, y)){
      problemi.push('senza ponte la ristampa lascia il varco aperto: la radura si raggiunge gratis');
      y = p.y+p.h; break;
    }

  /* --- il campo sotto le costruzioni --- */
  const m = WORLD.crea().podere;
  for (const k in m.spazi) {
    const sp = m.spazi[k];
    let zappabili = 0;
    for (let y = sp.y; y < sp.y+sp.h; y++) for (let x = sp.x; x < sp.x+sp.w; x++) {
      const i = WORLD.idx(m,x,y), t = WORLD.terreno(m,x,y);
      if (m.coltivabile && !m.obj[i] && !m.suolo[i] && (t==='erba'||t==='terra')
          && !WORLD.riservata(m, x, y, {})) zappabili++;
    }
    if (zappabili)
      problemi.push(`si possono ancora zappare ${zappabili} caselle dentro allo spazio di «${k}»: ` +
                    'il raccolto finirebbe sotto all\'edificio');
  }
  /* e il terreno torna del giocatore quando la costruzione c'è già */
  const sp = m.spazi.pollaio;
  if (WORLD.riservata(m, sp.x, sp.y, { pollaio:true }) === 'pollaio')
    problemi.push('lo spazio del pollaio resta riservato anche dopo averlo costruito');

  /* Fin qui si è provata la PRIMITIVA. Ma il difetto vero torna
     togliendo la chiamata in `azionePossibile`, e quello non si vede da
     `WORLD.riservata`: la prova resterebbe verde con la zappa che
     ricomincia a lavorare il prato del pollaio. Tarato apposta: senza
     queste due righe, rimettere il difetto non accendeva niente. */
  const game = fs.readFileSync(path.join(RADICE, 'js', 'game.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  const zappa = game.slice(game.indexOf("if(id==='zappa') return"), game.indexOf("if(id==='zappa') return") + 260);
  if (!/WORLD\.riservata\(/.test(zappa))
    problemi.push('la zappa non guarda più gli spazi riservati: il raccolto tornerebbe a finire sotto agli edifici');
  if (!/WORLD\.riservata\(/.test(game.slice(game.indexOf('function perchePuoiZappare'), game.indexOf('function usaOggetto'))))
    problemi.push('la zappa rifiuta la casella senza dire che ci andrà una costruzione');

  /* E davanti a una cosa posata il gioco deve DIRE come si toglie.

     Il piccone le toglie da sempre e le rimette intere nello zaino, ma
     stando davanti a una staccionata il gioco non diceva niente: E non
     la tocca (l'etichetta prometterebbe il falso) e nessun'altra riga
     compariva. Chi l'ha segnalato ha provato e ha concluso che non si
     può: «non riesce a spaccare le fence». Un verbo che esiste e che
     nessuno nomina è, per chi gioca, un verbo che non esiste. */
  const prompt = game.slice(game.indexOf('function promptContestuale'), game.indexOf('function idDaKind'));
  if (!/o\.t!=='mobile'/.test(prompt) || !/UI\.prompt\(/.test(prompt))
    problemi.push('davanti a una cosa posata non compare più il suggerimento del piccone: ' +
                  'il modo di toglierla tornerebbe a non essere nominato da nessuna parte');
  if (!/o\.t==='mobile'/.test(game.slice(game.indexOf("if(id==='piccone') return"), game.indexOf("if(id==='falce') return"))))
    problemi.push('il piccone non toglie più le cose posate: il suggerimento prometterebbe il falso');

  return problemi;
});

/* =================================================================== */

/* Le bottiglie del mare si leggono UNA volta: il gioco si segna l'id di
   quelle già aperte, quindi un id doppio farebbe sparire una lettera —
   letta la prima, la seconda risulterebbe già letta senza esserlo mai
   stata. E i testi devono avere la traduzione: DATA si traduce sul
   posto per campi dichiarati, e un campo senza voce nel catalogo non fa
   rumore — l'inglese mostrerebbe l'italiano in silenzio. Il confronto
   col sorgente regge perché le chiavi del catalogo sono fra virgolette
   doppie e i testi non ne contengono. */
/* IL VIALE NON SI INTERROMPE AL RUSCELLO.

   Segnalato in partita: «il ponte ha due blocchi invisibili che non te
   lo fanno attraversare». Erano due caselle d'acqua fra il selciato e le
   assi, sulle righe del viale: il ponte cominciava una casella più in
   là del ruscello, quindi da lì non si passava — si passava solo
   scendendo di una riga, fuori dal viale e fuori dal ponte disegnato.

   I controlli di camminabilità che c'erano non lo vedevano, ed è il
   punto: chiedono che dal podere si raggiunga OGNI USCITA, e l'uscita si
   raggiungeva davvero — aggirando. Un giro che funziona nasconde un
   passaggio rotto. Questo invece cammina sul viale e basta, dentro una
   fascia stretta attorno al ruscello: se per andare da una parte
   all'altra bisogna uscire dal viale, è rosso. */
verifica('il viale attraversa il ruscello sul ponte, senza aggirarlo', () => {
  const problemi = [];
  const m = WORLD.crea().podere;
  const ponte = m.deco.find(d => d.t === 'ponte');
  if (!ponte) return ['il ponticello del podere non c\'è più fra le decorazioni'];

  // ogni casella del ponte disegnato dev'essere camminabile: se il
  // disegno promette un ponte più largo del legno, è una bugia
  for (let y = ponte.y; y < ponte.y + (ponte.h||2); y++)
    for (let x = ponte.x; x < ponte.x + ponte.w; x++)
      if (WORLD.solido(m, x, y))
        problemi.push(`il ponticello è disegnato su (${x},${y}) ma lì non si passa`);

  /* E UN PONTE CHE FINISCE NELL'ACQUA NON È UN PONTE. Su ogni riga che
     attraversa, la casella subito prima e quella subito dopo devono
     essere terra: se c'è ancora ruscello, vuol dire che il ponte non
     arriva alla riva, e quel quadrato d'acqua — stretto fra il selciato
     e le assi, sotto il bordo della ringhiera — non si legge come acqua.
     Si legge come ponte che non si attraversa.

     È l'affermazione giusta, e la prima versione di questo controllo
     sbagliava: cercava un cammino in una fascia che comprendeva anche la
     riga di sotto, cioè proprio l'aggiramento, e restava verde col ponte
     rotto. Un controllo che non distingue il difetto è peggio di
     nessun controllo. */
  for (let y = ponte.y; y < ponte.y + (ponte.h||2); y++) {
    for (const [x, lato] of [[ponte.x - 1, 'a ponente'], [ponte.x + ponte.w, 'a levante']]) {
      if (WORLD.terreno(m, x, y) === 'acqua')
        problemi.push(`il ponticello non arriva alla riva ${lato}: (${x},${y}) è ancora ruscello, ` +
                      'e da lì non si passa pur sembrando ponte');
    }
  }
  return problemi;
});

/* I sette pacchi della serie. Le regole che tengono, e perché:

   SETTE, numerati da 1 a 7 senza buchi. `apriPacco` cerca il pacco per
   numero e ripiega sul primo se non lo trova: un buco non farebbe
   rumore, darebbe il pacco del primo giorno al quarto e nessuno se ne
   accorgerebbe mai.

   OGNI COSA DENTRO DEVE ESISTERE, se no il pacco si apre su un oggetto
   fantasma — e quello lo scopre chi gioca, non chi scrive.

   IL SETTIMO DEV'ESSERE IL PIÙ RICCO. È l'unica promessa che la serie
   fa davvero: se un ritocco ai numeri lo rendesse meno del quinto, la
   settimana non varrebbe più la pena e niente lo direbbe.

   E NIENTE ROBA IRRAGGIUNGIBILE ALTROVE: un premio che dà cose che il
   gioco non dà trasformerebbe il collegarsi ogni giorno nella via
   principale per averle, che è il contrario di un gioco che si fa i
   suoi tempi. */
verifica('i sette pacchi della serie stanno in piedi', () => {
  const problemi = [];
  const P = DATA.PREMI_SERIE || [];
  if (P.length !== 7) problemi.push(`i pacchi sono ${P.length}, non sette`);
  for (let k = 1; k <= 7; k++)
    if (!P.some(p => p.g === k)) problemi.push(`manca il pacco del giorno ${k}`);

  const valore = p => (p.oro || 0) +
    (p.roba || []).reduce((a, [id, n]) => a + ((DATA.ITEMS[id] || {}).prezzo || 0) * n, 0);

  for (const p of P) {
    if (!p.nota) problemi.push(`il pacco del giorno ${p.g} è senza nota`);
    if (!(p.oro > 0) && !(p.roba || []).length)
      problemi.push(`il pacco del giorno ${p.g} è vuoto`);
    for (const [id, n] of (p.roba || [])) {
      if (!DATA.ITEMS[id]) { problemi.push(`il pacco del giorno ${p.g} dà «${id}», che non esiste`); continue; }
      if (!(n > 0)) problemi.push(`il pacco del giorno ${p.g} dà zero pezzi di ${id}`);
      if (!fontiOttenibili().has(id))
        problemi.push(`il pacco del giorno ${p.g} dà «${id}», che nel gioco non si ottiene in nessun altro modo: ` +
                      'la serie diventerebbe l\'unica via per averlo');
    }
  }
  const settimo = P.find(p => p.g === 7);
  if (settimo) for (const p of P)
    if (p.g !== 7 && valore(p) >= valore(settimo))
      problemi.push(`il pacco del giorno ${p.g} vale quanto o più del settimo: il regalone non è più un regalone`);
  return problemi;
});

verifica('ogni bottiglia del mare si legge, una volta e in due lingue', () => {
  const problemi = [];
  const visti = new Set();
  const en = fs.readFileSync(path.join(RADICE, 'js/lingua-en.js'), 'utf8');
  for (const b of DATA.BOTTIGLIE || []) {
    if (!b.id) { problemi.push('una bottiglia è senza id'); continue; }
    if (visti.has(b.id)) problemi.push(`id doppio «${b.id}»: la seconda lettera non arriverebbe mai`);
    visti.add(b.id);
    if (!b.testo || !b.firma) problemi.push(`la bottiglia «${b.id}» è senza testo o senza firma`);
    for (const campo of ['testo', 'firma'])
      if (b[campo] && en.indexOf(b[campo]) < 0)
        problemi.push(`la bottiglia «${b.id}» ha un ${campo} senza traduzione inglese`);
  }
  if (!(DATA.BOTTIGLIE || []).length) problemi.push('DATA.BOTTIGLIE è vuoto: la bottiglia si aprirebbe sul niente');
  return problemi;
});

/* --- LA DENSITÀ, CHE NON PUÒ ESSERE DUE ---

   La casella del mondo vale 64 e sta dichiarata in nove file, perché
   questo repo non ha un modulo di costanti e non ne vuole uno: si
   ridichiara e si controlla. Un file rimasto a 32 non è un errore di
   sintassi e non fa fallire niente — fa camminare il giocatore a metà
   velocità, o mette le prede a fuggire a metà distanza, o disegna la
   mappa del Diario col segnalino fuori dal riquadro. Cose che si vedono
   giocando e non si vedono leggendo.

   Tre grandezze, tre significati diversi che non vanno confusi:
     `T`  la casella del mondo: 64
     `K`  quanto il mondo è più fitto di quando la casella era 32: 2
     `U`  l'unità in cui restano scritti i disegni a mano: 32
   In `landing.js` la casella si chiama `TT` per non pestare altro.

   E il controllo pretende di TROVARLE, non solo di trovarle giuste: se
   un giorno smettesse di vedere le dichiarazioni direbbe «tutto a
   posto» su un repo che potrebbe essere tornato a 32 dappertutto. */
const DENSITA_ATTESA = { T: 64, TT: 64, K: 2, U: 32 };
const QUANTE_ALMENO = { T: 6, TT: 1, K: 10, U: 2 };
verifica('la casella del mondo vale 64 dappertutto, e l\'unità di disegno 32', () => {
  const problemi = [];
  const conte = { T: 0, TT: 0, K: 0, U: 0 };
  for (const f of fs.readdirSync(path.join(RADICE, 'js')).filter(n => n.endsWith('.js'))) {
    const src = fs.readFileSync(path.join(RADICE, 'js', f), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');
    // solo le dichiarazioni con un NUMERO a destra: `const T = s => …` in
    // mezza interfaccia è la scorciatoia della traduzione, non la casella
    for (const m of src.matchAll(/\bconst (T|TT|K|U) *= *(\d+)/g)) {
      const nome = m[1], valore = +m[2];
      conte[nome]++;
      if (valore !== DENSITA_ATTESA[nome])
        problemi.push(`js/${f}: \`const ${nome} = ${valore}\` invece di ${DENSITA_ATTESA[nome]}`);
    }
  }
  for (const nome in QUANTE_ALMENO)
    if (conte[nome] < QUANTE_ALMENO[nome])
      problemi.push(`trovate solo ${conte[nome]} dichiarazioni di \`${nome}\` invece di almeno ` +
                    `${QUANTE_ALMENO[nome]}: o il controllo non le vede più, e allora non protegge niente`);
  return problemi;
});

/* --- OGNI BLOCCO DISEGNATO A MANO PASSA DAL RADDOPPIO ---

   In render.js le funzioni che disegnano a mano sono spaccate in due: un
   guscio che chiama `raddoppia` e un corpo `…Dentro` scritto in unità di
   disegno. Il corpo da solo, chiamato senza guscio, disegna tutto grande
   la metà e nel quarto in alto a sinistra della casella — e non se ne
   accorge nessuno finché non lo si guarda. */
verifica('i blocchi disegnati a mano di render.js passano tutti dal raddoppio', () => {
  const problemi = [];
  const src = fs.readFileSync(path.join(RADICE, 'js/render.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');
  const corpi = [...src.matchAll(/function (\w+)Dentro\s*\(/g)].map(m => m[1]);
  if (corpi.length < 6)
    problemi.push(`trovati solo ${corpi.length} corpi \`…Dentro\` invece di almeno 6: ` +
                  'il controllo non li vede più e non protegge niente');
  for (const nome of corpi) {
    const guscio = src.match(new RegExp('function ' + nome + '\\s*\\([^)]*\\)\\s*\\{([\\s\\S]*?)\\n\\}'));
    if (!guscio) { problemi.push(`\`${nome}Dentro\` non ha un guscio \`${nome}\``); continue; }
    if (guscio[1].indexOf('raddoppia(') < 0)
      problemi.push(`\`${nome}\` non chiama \`raddoppia\`: il suo disegno esce grande la metà`);
    if (guscio[1].indexOf('.restore()') < 0)
      problemi.push(`\`${nome}\` raddoppia e non ripristina: da lì in poi tutta la scena è doppia`);
  }
  // e le chiamate ai corpi partono dall'origine, non da una posizione vera
  // `(?<!\w)` per partire da un confine di parola — se no la regex si
  // sposta di un carattere e ripesca la dichiarazione che stiamo
  // scartando — e `(?<!function )` per scartarla davvero
  for (const m of src.matchAll(/(?<!\w)(?<!function )(\w+)Dentro\((?:[^,]+,\s*)([^,]+),\s*([^,)]+)/g)) {
    if (m[2].trim() !== '0' || m[3].trim() !== '0')
      problemi.push(`\`${m[1]}Dentro\` è chiamata con l'origine (${m[2].trim()}, ${m[3].trim()}) ` +
                    'invece di (0, 0): dentro al blocco raddoppiato l\'origine l\'ha già messa `raddoppia`');
  }
  return problemi;
});

/* --- LA TELA DEGLI SPRITE NASCE DOPPIA ---
   `tela()` è il patto su cui si regge tutta la conversione: se qualcuno
   «semplifica» via il `setTransform`, ogni sprite del gioco resta della
   misura di prima dentro una tela grande il doppio — cioè un disegnino
   nell'angolo in alto a sinistra di ogni casella. */
verifica('gli sprite nascono su una tela a densità doppia', () => {
  const problemi = [];
  const art = fs.readFileSync(path.join(RADICE, 'js/art.js'), 'utf8');
  if (!/function tela\([\s\S]{0,200}setTransform\(K,0,0,K,0,0\)/.test(art))
    problemi.push('`tela()` non scala più il contesto di K: gli sprite resterebbero alla misura di prima');
  if (!/const c = cv\(w\*K, h\*K\)/.test(art))
    problemi.push('`tela()` non crea più la tela K volte più grande');
  const corpo = art.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');
  const grezze = [...corpo.matchAll(/\bcv\(U\s*,\s*U\)/g)];
  if (grezze.length)
    problemi.push(`${grezze.length} sprite di una casella nascono ancora su \`cv(U,U)\` invece che su ` +
                  '`tela(U,U)`: uscirebbero grandi mezza casella');
  /* Le due strade sono `tela` (l'arte di prima, ingrandita) e `telaNetta`
     (quella ridisegnata a 64). Si contano insieme, perché uno sprite che
     passa dalla seconda esce dalla prima: contare solo `tela(` faceva
     scattare l'allarme a ogni sprite rifatto, che è il contrario di
     quello che serve. */
  const quante = (corpo.match(/\btela\(/g) || []).length
               + (corpo.match(/\btelaNetta\(/g) || []).length;
  if (quante < 40)
    problemi.push(`solo ${quante} usi di \`tela(\`/\`telaNetta(\`: erano una quarantina, ` +
                  'il controllo non li vede più');
  if (!/function telaNetta\(w, h\)\{ return tela\(w\/K, h\/K, true\); \}/.test(art))
    problemi.push('`telaNetta` non chiede più una tela netta: chi la usa tornerebbe a 32 senza accorgersene');
  return problemi;
});

/* --- CHI È STATO RIDISEGNATO A 64 NON TORNA INDIETRO ---

   Il ridisegno di uno sprite a 64 non lascia nessuna traccia che un
   errore possa svelare: se qualcuno rimette `tela` al posto di
   `telaNetta` e dimezza i numeri, il gioco funziona identico e l'unica
   differenza è che la texture torna a blocchi da due. Nessun test
   diventerebbe rosso, e chi guarda non se ne accorge subito perché il
   confronto non ce l'ha davanti.

   Questo elenco è la memoria di cosa è già stato fatto. Cresce man mano
   che la coda lunga si accorcia, e ogni riga che si aggiunge è una riga
   che non può più tornare indietro di nascosto. */
const RIFATTI_A_64 = [
  'grassTile', 'dirtTile', 'tilledTile', 'pathTile', 'sandTile', 'woodTile',
  'stoneFloorTile', 'terracottaTile', 'snowTile', 'caveTile', 'waterFrames',
  'maskLato', 'maskAngolo',
  // seconda infornata: la vegetazione e le nove facciate
  'bCasa', 'bBottega', 'bFucina', 'bLocanda', 'bCottage',
  'bSantuario', 'bPollaio', 'bSerra', 'bCapanna'
];
/* Le funzioni di render.js promosse a 64: disegnano direttamente in
   pixel di mondo, senza `raddoppia`. Ri-avvolgerle in un raddoppio non
   darebbe nessun errore — verrebbero fuori grandi il doppio e nel
   quarto in alto a sinistra della casella — quindi si nomina qui chi è
   già stato promosso, e chi lo rimette dentro trova rosso. */
const IN_PIXEL_DI_MONDO = ['pareteRoccia', 'stalattiti', 'dettaglioSuperficie'];
verifica('chi disegna già in pixel di mondo non torna dentro a un raddoppio', () => {
  const problemi = [];
  const src = fs.readFileSync(path.join(RADICE, 'js/render.js'), 'utf8');
  for (const nome of IN_PIXEL_DI_MONDO) {
    const m = src.match(new RegExp('function ' + nome + '\\s*\\([^)]*\\)\\s*\\{([\\s\\S]*?)\\n\\}'));
    if (!m) { problemi.push(`non trovo più \`${nome}\` in render.js`); continue; }
    const corpo = m[1].replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
    if (/(?<!\w)raddoppia\s*\(/.test(corpo))
      problemi.push(`\`${nome}\` è ridisegnata a 64 e usa di nuovo \`raddoppia\`: ` +
                    'uscirebbe grande il doppio e spostata sull\'angolo della casella');
    if (/(?<!\w)U(?!\w)/.test(corpo))
      problemi.push(`\`${nome}\` è ridisegnata a 64 ma parla ancora di \`U\`: ` +
                    'metà dei suoi numeri sono in trentaduesimi e metà no');
  }
  return problemi;
});

verifica('gli sprite già ridisegnati a 64 restano a 64', () => {
  const problemi = [];
  const art = fs.readFileSync(path.join(RADICE, 'js', 'art.js'), 'utf8');
  for (const nome of RIFATTI_A_64) {
    const m = art.match(new RegExp('function ' + nome + '\\s*\\([^)]*\\)\\s*\\{([\\s\\S]*?)\\n\\}'));
    if (!m) { problemi.push(`non trovo più \`${nome}\` in art.js`); continue; }
    const corpo = m[1].replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
    if (!/\btelaNetta\(/.test(corpo))
      problemi.push(`\`${nome}\` era ridisegnata a 64 e adesso non chiede più \`telaNetta\`: ` +
                    'la sua texture è tornata a blocchi da due, e non se ne accorgerebbe nessuno');
    if (/(?<!\w)U(?!\w)/.test(corpo))
      problemi.push(`\`${nome}\` è ridisegnata a 64 ma parla ancora di \`U\`: ` +
                    'metà dei suoi numeri sono in trentaduesimi e metà no');
  }
  // e le due che compongono i raccordi devono seguire le maschere
  for (const nome of ['bordo', 'ombraBordo', 'arato', 'tree', 'bush', 'stump', 'rock']) {
    const m = art.match(new RegExp('A\\.' + nome + ' = function[^{]*\\{([\\s\\S]*?)\\n\\};'));
    if (!m) { problemi.push(`non trovo più \`A.${nome}\``); continue; }
    if (!/\btelaNetta\(/.test(m[1]))
      problemi.push(`\`A.${nome}\` compone sprite già a 64 su una tela da 32: ` +
                    'il ritaglio uscirebbe della misura sbagliata');
  }
  return problemi;
});

/* --- GLI ARREDI DISEGNATI A MANO ---

   `DATA.ARREDI` dichiara che `letto.png` è due caselle per tre. Se un
   giorno lo si riesporta dai sorgenti a una misura diversa e ci si
   dimentica di aggiornare la riga, il gioco non si rompe: `drawImage`
   con misura esplicita RISCALA in silenzio, e il letto viene fuori
   schiacciato o stirato senza un errore da nessuna parte. Un occhio
   distratto lo prende per uno sbaglio di disegno.

   Qui la misura dichiarata si confronta coi pixel veri, letti
   dall'intestazione del PNG: 25 byte, nessuna dipendenza. */
const CASELLA = 64;
verifica('gli arredi disegnati a mano esistono e sono della misura dichiarata', () => {
  const problemi = [];
  const dir = path.join(RADICE, 'img');
  if (!fs.existsSync(dir)) return ['manca la cartella img/'];
  const usati = new Set();

  for (const id in DATA.ARREDI) {
    const a = DATA.ARREDI[id];
    const f = path.join(dir, a.file);
    usati.add(a.file);
    if (!fs.existsSync(f)) { problemi.push(`«${id}» vuole img/${a.file}, che non c'è`); continue; }
    const b = fs.readFileSync(f);
    // PNG: la firma è di 8 byte, poi IHDR con larghezza e altezza a 16 e 20
    if (b.length < 24 || b.readUInt32BE(0) !== 0x89504e47) {
      problemi.push(`img/${a.file} non è un PNG`); continue;
    }
    const w = b.readUInt32BE(16), h = b.readUInt32BE(20);
    const attesoW = a.w * CASELLA, attesoH = a.h * CASELLA;
    if (w !== attesoW || h !== attesoH)
      problemi.push(`img/${a.file} è ${w}×${h} ma «${id}» lo dichiara ${a.w}×${a.h} caselle, ` +
                    `cioè ${attesoW}×${attesoH}: verrebbe riscalato senza che nessuno se ne accorga`);
    if (a.w <= 0 || a.h <= 0) problemi.push(`«${id}» ha una misura non positiva`);
  }

  /* Le icone degli attrezzi si misurano in PIXEL e non in caselle: non
     stanno nel mondo, stanno nelle finestre. Due cose da tenere ferme.

     La misura, per la stessa ragione degli arredi — chi le mette in
     pagina fa una tela della misura della sorgente, e una misura
     dichiarata che non corrisponde ai pixel veri non dà un errore da
     nessuna parte.

     E la CHIAVE, che è la parte che si rompe più facilmente: è l'id
     dell'oggetto, quello che passa per `ART.icon(id)`. Scritto storto
     non succede niente di visibile — il PNG si scarica, non lo chiede
     nessuno, e l'attrezzo continua a mostrare l'icona in codice. Un
     difetto che costa peso e non si vede è il tipo peggiore. */
  for (const id in (DATA.ICONE || {})) {
    const a = DATA.ICONE[id];
    const f = path.join(dir, a.file);
    usati.add(a.file);
    if (!DATA.ITEMS[id])
      problemi.push(`DATA.ICONE ha «${id}», che fra gli oggetti non c'è: ` +
                    'il file si scaricherebbe senza che nessuno lo chieda');
    if (!fs.existsSync(f)) { problemi.push(`«${id}» vuole img/${a.file}, che non c'è`); continue; }
    const b = fs.readFileSync(f);
    if (b.length < 24 || b.readUInt32BE(0) !== 0x89504e47) {
      problemi.push(`img/${a.file} non è un PNG`); continue;
    }
    const w = b.readUInt32BE(16), h = b.readUInt32BE(20);
    if (w !== a.w || h !== a.h)
      problemi.push(`img/${a.file} è ${w}×${h} ma «${id}» lo dichiara ${a.w}×${a.h}`);
  }

  /* Il foglio del personaggio è un caso a sé: non è un arredo, è una
     griglia di celle. Si controlla che i pixel veri siano esattamente
     `w × fotogrammi` per `h × righe` — se un domani si riesporta con una
     riga in più e ci si dimentica di dirlo a `DATA.OMINO`, le celle si
     ritagliano sfalsate e il giocatore cammina a pezzi di due pose. */
  const O = DATA.OMINO;
  if (!O) problemi.push('manca DATA.OMINO: il foglio del personaggio non lo legge nessuno');
  else {
    usati.add(O.file);
    const f = path.join(dir, O.file);
    if (!fs.existsSync(f)) problemi.push(`DATA.OMINO vuole img/${O.file}, che non c'è`);
    else {
      const b = fs.readFileSync(f);
      const w = b.readUInt32BE(16), h = b.readUInt32BE(20);
      const attesoW = O.w * O.fotogrammi;
      if (w !== attesoW)
        problemi.push(`img/${O.file} è largo ${w} ma ${O.fotogrammi} celle da ${O.w} fanno ${attesoW}`);
      /* L'altezza si pretende ESATTA, e non «almeno tante righe». Nei due
         sensi c'è un difetto vero: una riga di meno e una direzione
         ritaglia fuori dal foglio, una riga di più è arte che nessuno
         disegna e che pesa lo stesso su chi scarica la pagina. Si conta
         dall'indice più alto e non da quante direzioni sono mappate,
         perché due direzioni possono legittimamente puntare alla stessa
         riga — il giorno che il profilo destro si ricava specchiando il
         sinistro, quel conto direbbe quattro righe per un foglio di tre. */
      const ultima = Math.max(...Object.values(O.righe));
      const attesoH = (ultima + 1) * O.h;
      if (h !== attesoH)
        problemi.push(`img/${O.file} è alto ${h} ma DATA.OMINO arriva alla riga ${ultima}, ` +
                      `cioè ${attesoH}: o manca una riga o ce n'è una che non disegna nessuno`);
      for (const d in O.righe) {
        if (!'0123'.includes(d)) problemi.push(`DATA.OMINO.righe parla della direzione «${d}», che non esiste`);
        if (O.righe[d] >= h / O.h) problemi.push(`la direzione ${d} punta alla riga ${O.righe[d]}, che nel foglio non c'è`);
      }
    }
  }

  /* I fogli con l'attrezzo in mano: stessa griglia, cella più grande.
     Si controllano come quello a mani vuote, più due cose loro.

     La chiave dev'essere un attrezzo che esiste: scritta storta, il file
     si scarica e non lo chiede nessuno, e il giocatore continua a
     camminare a mani vuote senza che niente si lamenti.

     E la cella dev'essere ALMENO grande quanto quella a mani vuote. Il
     renderer centra sulla larghezza e appoggia in fondo, quindi da una
     cella più piccola il contadino uscirebbe più basso e più stretto: si
     rimpicciolirebbe prendendo in mano un attrezzo. */
  for (const id in (DATA.OMINO_ATTREZZI || {})) {
    const A = DATA.OMINO_ATTREZZI[id];
    if (!DATA.ITEMS[id])
      problemi.push(`DATA.OMINO_ATTREZZI ha «${id}», che fra gli oggetti non c'è: ` +
                    'il foglio si scaricherebbe senza che nessuno lo chieda');
    if (O && (A.w < O.w || A.h < O.h))
      problemi.push(`il foglio di «${id}» ha celle ${A.w}×${A.h}, più piccole dei ${O.w}×${O.h} a mani vuote: ` +
                    'il contadino si rimpicciolirebbe prendendo in mano l\'attrezzo');
    usati.add(A.file);
    const f = path.join(dir, A.file);
    if (!fs.existsSync(f)) { problemi.push(`DATA.OMINO_ATTREZZI vuole img/${A.file}, che non c'è`); continue; }
    const b = fs.readFileSync(f);
    if (b.length < 24 || b.readUInt32BE(0) !== 0x89504e47) { problemi.push(`img/${A.file} non è un PNG`); continue; }
    const w = b.readUInt32BE(16), h = b.readUInt32BE(20);
    const ultima = Math.max(...Object.values(A.righe));
    if (w !== A.w * A.fotogrammi)
      problemi.push(`img/${A.file} è largo ${w} ma ${A.fotogrammi} celle da ${A.w} fanno ${A.w*A.fotogrammi}`);
    if (h !== (ultima + 1) * A.h)
      problemi.push(`img/${A.file} è alto ${h} ma «${id}» arriva alla riga ${ultima}, cioè ${(ultima+1)*A.h}`);
    for (const d in A.righe)
      if (!'0123'.includes(d))
        problemi.push(`il foglio di «${id}» parla della direzione «${d}», che non esiste`);
  }

  /* I fogli della vegetazione: stessa griglia degli altri, e due cose
     loro. Le stagioni devono essere QUATTRO quando il foglio è
     stagionale — una colonna in meno e d'inverno si ritaglierebbe fuori
     dal foglio, che è un difetto che si vede una stagione su quattro e
     quindi si scopre tardi. E le chiavi degli alberi devono nominare uno
     stadio che esiste: `quercia|5` non lo chiederebbe mai nessuno, e il
     foglio si scaricherebbe con una riga morta dentro. */
  for (const id in (DATA.VEGETAZIONE || {})) {
    const V = DATA.VEGETAZIONE[id];
    usati.add(V.file);
    const f = path.join(dir, V.file);
    if (!fs.existsSync(f)) { problemi.push(`DATA.VEGETAZIONE vuole img/${V.file}, che non c'è`); continue; }
    const b = fs.readFileSync(f);
    if (b.length < 24 || b.readUInt32BE(0) !== 0x89504e47) { problemi.push(`img/${V.file} non è un PNG`); continue; }
    const w = b.readUInt32BE(16), h = b.readUInt32BE(20);
    const ultima = Math.max(...Object.values(V.righe));
    /* Tre impaginati possibili, e vanno distinti o il conto non torna:
       a griglia (`colonne`), a stagioni, o una colonna sola. */
    /* Quattro impaginati, e vanno distinti o il conto non torna:
       una colonna per FASE (`fasi`, una riga per voce), a GRIGLIA
       (`colonne`, l'indice e il numero di cella), a STAGIONI, o una
       colonna sola. */
    const colonne = V.fasi || V.colonne || (V.stagionale ? DATA.SEASONS.length : 1);
    const righeAttese = V.colonne ? Math.ceil((ultima + 1) / V.colonne) : ultima + 1;
    if (w !== V.w * colonne)
      problemi.push(`img/${V.file} è largo ${w} ma «${id}» vuole ${colonne} colonne da ${V.w}, cioè ${V.w*colonne}`);
    if (h !== righeAttese * V.h)
      problemi.push(`img/${V.file} è alto ${h} ma «${id}» ne vuole ${righeAttese} righe da ${V.h}, cioè ${righeAttese*V.h}`);
    /* E per i fogli a griglia: ogni chiave dev'essere un oggetto vero, se
       no si ritaglia una cella vuota e il raccolto sparisce dal bosco. */
    if (V.fasi) for (const k in V.righe)
      if (k !== '*' && !DATA.CROPS[k])
        problemi.push(`«${id}» ha la riga «${k}», che fra le colture non c'è`);
    if (V.colonne) for (const k in V.righe)
      if (k !== '*' && !DATA.ITEMS[k])
        problemi.push(`«${id}» ha la cella «${k}», che fra gli oggetti non c'è`);
    /* Solo il foglio degli alberi ha le chiavi `tipo|stadio`: gli altri
       le hanno di altra forma, e prima questo controllo le rifiutava
       tutte dicendo che un raccolto selvatico non è un albero. */
    if (id === 'alberi') for (const k in V.righe) {
      if (k === '*') continue;
      const [tipo, stadio] = k.split('|');
      if (!['pino','quercia','betulla'].includes(tipo))
        problemi.push(`«${id}» ha la riga «${k}»: «${tipo}» non è un albero che il mondo pianta`);
      if (!['0','1','2'].includes(stadio))
        problemi.push(`«${id}» ha la riga «${k}»: lo stadio «${stadio}» non esiste`);
    }
  }

  /* Un file in img/ che non usa nessuno è peso morto scaricato da chi
     gioca. Non basta però dire «toglilo»: qualcuno può essere disegnato
     e in attesa di poter entrare, e allora la risposta sta in
     `DATA.ARREDI_IN_ATTESA` con scritto cosa manca. Quello che non è né
     usato né in attesa è dimenticato, e si nomina. */
  const inAttesa = DATA.ARREDI_IN_ATTESA || {};
  for (const f of fs.readdirSync(dir))
    if (f.endsWith('.png') && !usati.has(f) && !inAttesa[f])
      problemi.push(`img/${f} non lo usa nessuno: o si collega in DATA.ARREDI, ` +
                    'o si spiega in DATA.ARREDI_IN_ATTESA cosa gli manca, o si toglie');

  // e il contrario: un'attesa per un file che non c'è più è una nota stantia
  for (const f in inAttesa)
    if (!fs.existsSync(path.join(dir, f)))
      problemi.push(`DATA.ARREDI_IN_ATTESA parla di img/${f}, che non c'è`);
    else if (usati.has(f))
      problemi.push(`img/${f} è collegato in DATA.ARREDI: la sua riga in ARREDI_IN_ATTESA va tolta`);

  return problemi;
});

/* --- LE IMPRONTE MULTI-CASELLA ---

   Un mobile grande scritto male non dà nessun errore: `WORLD.arredo`
   torna false e il mobile semplicemente NON C'È. La stanza si apre, si
   cammina, e manca il letto — che è esattamente il genere di cosa che
   si scopre giocando invece che leggendo. */
verifica('i mobili grandi ci stanno, non si pestano, e non chiudono la stanza', () => {
  const maps = WORLD.crea();
  const problemi = [];
  let grandi = 0;

  for (const id of WORLD.MAPPE) {
    const m = maps[id];
    if (!m) continue;
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      const o = m.obj[WORLD.idx(m, x, y)];
      if (!o || o.t === 'rimando') continue;
      const f = WORLD.impronta(o);
      if (f.w === 1 && f.h === 1) continue;
      grandi++;
      // ogni casella dell'impronta dev'essere sua: o il mobile, o un suo rimando
      for (let j = 0; j < f.h; j++) for (let i = 0; i < f.w; i++) {
        if (!WORLD.dentro(m, x + i, y + j)) {
          problemi.push(`in «${id}» il ${o.t} in (${x},${y}) esce dalla mappa`); continue;
        }
        const c = m.obj[WORLD.idx(m, x + i, y + j)];
        if (i === 0 && j === 0) continue;
        if (!c || c.t !== 'rimando' || c.ax !== x || c.ay !== y)
          problemi.push(`in «${id}» il ${o.t} in (${x},${y}) non tiene la casella ` +
                        `(${x + i},${y + j}): o è stato posato con setObj invece che con arredo, ` +
                        'o ce n\'è un altro sopra');
      }
    }
    /* E nessun rimando deve puntare al vuoto: sarebbe un blocco solido
       invisibile, che non si vede e non si toglie. */
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      const c = m.obj[WORLD.idx(m, x, y)];
      if (!c || c.t !== 'rimando') continue;
      const a = WORLD.oggetto(m, x, y);
      if (!a) problemi.push(`in «${id}» la casella (${x},${y}) è occupata da un rimando che non punta a niente`);
    }
  }

  if (!grandi) problemi.push('nessun mobile occupa più di una casella: il controllo non protegge niente');

  /* La stanza dev'essere ancora attraversabile DALLA PORTA, che è una
     domanda diversa da «quante caselle sono libere»: un letto due per
     tre messo di traverso può lasciare libera mezza stanza e chiuderne
     l'altra metà. BFS a 8 vicini, che è più permissiva del movimento
     vero: se dice chiuso, è chiuso. */
  for (const azione in WORLD.INTERNI) {
    const m = maps[WORLD.INTERNI[azione]];
    if (!m || !m.warps.length) continue;
    const porta = m.warps[0];
    const visti = new Set([WORLD.idx(m, porta.x, porta.y)]);
    const coda = [[porta.x, porta.y]];
    while (coda.length) {
      const [x, y] = coda.pop();
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (!WORLD.dentro(m, nx, ny) || WORLD.solido(m, nx, ny)) continue;
        const k = WORLD.idx(m, nx, ny);
        if (visti.has(k)) continue;
        visti.add(k); coda.push([nx, ny]);
      }
    }
    let liberi = 0;
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++)
      if (!WORLD.solido(m, x, y)) liberi++;
    if (visti.size < liberi)
      problemi.push(`in «${m.id}» ${liberi - visti.size} caselle libere su ${liberi} non si raggiungono ` +
                    'dalla porta: un mobile ha tagliato la stanza in due');
  }

  return problemi;
});

/* Il renderer allarga la finestra di raccolta degli oggetti di
   `SBORDO_ARREDI` caselle, perché un mobile alto tre ancorato appena
   sopra il bordo dello schermo non sparisca. Se un giorno se ne scrive
   uno più alto, il margine va alzato con lui — e questo lo dice, invece
   di lasciare che il mobile scompaia a chi ci gioca. */
verifica('il margine di disegno copre il mobile più alto che esiste', () => {
  const problemi = [];
  const rend = fs.readFileSync(path.join(RADICE, 'js/render.js'), 'utf8');
  const m = rend.match(/const SBORDO_ARREDI = (\d+)/);
  if (!m) return ['non trovo SBORDO_ARREDI in render.js: il margine non è più dichiarato lì'];
  const margine = +m[1];

  const maps = WORLD.crea();
  let piuAlto = 1, dove = '';
  for (const id of WORLD.MAPPE) {
    const mm = maps[id];
    if (!mm) continue;
    for (const o of mm.obj) {
      if (!o || o.t === 'rimando') continue;
      const f = WORLD.impronta(o);
      const g = Math.max(f.w, f.h);
      if (g > piuAlto) { piuAlto = g; dove = `${o.t} in «${id}»`; }
    }
  }
  if (margine < piuAlto)
    problemi.push(`SBORDO_ARREDI è ${margine} ma il mobile più ingombrante ne occupa ${piuAlto} ` +
                  `(${dove}): ancorato appena fuori dallo schermo sparirebbe tutto`);
  return problemi;
});

/* --- IL RADDOPPIO NON SI SOMMA A SÉ STESSO ---

   `raddoppia` è RELATIVA: si appoggia alla trasformazione che trova. Va
   benissimo per chi la chiama dal ciclo di disegno, dove il contesto è
   pulito, e va malissimo per chi può essere chiamato da DENTRO a un
   blocco già raddoppiato. La targhetta col nome di una cassa era così: la
   chiede `disegnaOggettoDentro`, che gira già raddoppiato, e i due
   raddoppi si sommavano.

   Misurato quando è successo: scala 4 invece di 2, e la tavoletta di una
   cassa che sta in (640,640) finiva in (1624,920). La scritta no — quella
   si stampa dopo l'ingrandimento e sta sempre in pixel di mondo — quindi
   restava al suo posto. A schermo si vedevano assi di legno vuote che
   volavano per il prato, e da un'altra parte scritte senza niente sotto.
   Nessun test era rosso: è un difetto che si vede solo guardando.

   Qui si prende ogni funzione chiamata da dentro a un corpo `…Dentro` e
   si pretende che non usi il raddoppio relativo. `raddoppiaDaCapo` azzera
   la trasformazione e riparte, quindi è immune a chi la chiama. */
verifica(TS ? 'niente raddoppio relativo dentro a un blocco già raddoppiato'
            : 'raddoppio annidato: SALTATO, manca typescript (fai npm install)', () => {
  if (!TS) return [];
  const problemi = [];
  const src = fs.readFileSync(path.join(RADICE, 'js/render.js'), 'utf8');
  const sf = TS.createSourceFile('render.js', src, TS.ScriptTarget.Latest, true, TS.ScriptKind.JS);

  /* Il CORPO e non la funzione intera, e senza commenti: la firma
     `function raddoppia(x, ox, oy)` è una chiamata a `raddoppia` per
     qualunque regex, e in `pareteRocciaDentro` c'è scritto «vedi
     stalattiti()» in un commento. Due falsi allarmi presi subito, e
     tutti e due dicevano una cosa vera su come si legge il codice con
     le espressioni regolari: non si legge. */
  const senzaCommenti = t => t.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
  const corpi = new Map();                 // nome -> corpo, senza firma né commenti
  (function raccogli(nd) {
    if (TS.isFunctionDeclaration(nd) && nd.name && nd.body)
      corpi.set(nd.name.text, senzaCommenti(nd.body.getText()));
    nd.forEachChild(raccogli);
  })(sf);
  if (!corpi.size) return ['non trovo nessuna funzione in render.js: il controllo non protegge niente'];

  if (!/function raddoppiaDaCapo\([\s\S]{0,120}setTransform\(K, 0, 0, K, 0, 0\)/.test(src))
    problemi.push('`raddoppiaDaCapo` non azzera più la trasformazione con setTransform: ' +
                  'non è più immune a chi la chiama, ed è tutto quello che serviva che fosse');

  /* chi viene chiamato da dentro a un blocco raddoppiato, anche di
     rimbalzo: se A sta in un …Dentro e A chiama B, pure B ci sta dentro */
  const dentro = new Set();
  const daVedere = [...corpi.keys()].filter(n => n.endsWith('Dentro'));
  if (daVedere.length < 6)
    problemi.push(`trovati solo ${daVedere.length} corpi \`…Dentro\`: il controllo non li vede più`);
  while (daVedere.length) {
    const nome = daVedere.pop();
    const testo = corpi.get(nome);
    if (!testo) continue;
    for (const altro of corpi.keys()) {
      if (altro === nome || dentro.has(altro) || altro.endsWith('Dentro')) continue;
      if (new RegExp('(?<!\\w)' + altro + '\\s*\\(').test(testo)) {
        dentro.add(altro); daVedere.push(altro);
      }
    }
  }

  for (const nome of dentro) {
    const testo = corpi.get(nome);
    if (/(?<!\w)raddoppia\s*\(/.test(testo))
      problemi.push(`\`${nome}\` è chiamata da dentro a un blocco raddoppiato e usa \`raddoppia\`: ` +
                    'i due raddoppi si sommano e quello che disegna esce a scala 4, ' +
                    'spostato. Va usata `raddoppiaDaCapo`.');
  }
  return problemi;
});

/* NIENTE FLOAT NELLE FINESTRE, e il perché va letto tutto perché il
   difetto non somiglia alla sua causa.

   Nella finestra della botte il bottone «Sposta» stava a destra con un
   `float:right`, e la PRIMA riga sotto veniva 82 pixel più stretta
   delle altre — misurata: 693 contro 775, che sono esattamente il
   bottone (72) più il suo margine (10). Le righe di quelle finestre
   sono `display:flex`, cioè aprono un contesto di formattazione nuovo,
   e un contesto nuovo non scorre sotto a un float: si stringe per
   evitarlo. Dalla seconda riga in giù, sotto al bordo basso del
   bottone, la larghezza tornava piena.

   Il risultato è due righe identiche larghe diverso, e guardandole
   sembra un problema di quello che ci sta dentro — un nome più lungo,
   un'icona più grande — mentre è il bottone sopra. Ci si perde tempo.
   Un bottone che va a destra si spinge con `margin-left:auto` dentro a
   una riga flex.

   Il controllo pretende anche di aver LETTO qualcosa: un giorno che i
   file si spostano e la cartella non c'è più, «nessun float trovato»
   sarebbe un verde che non vuol dire niente.

   E i commenti si tolgono prima di cercare, se no il primo a essere
   segnalato è il commento che spiega perché il float non c'è più —
   scritto qui sopra e in ui.js. È già successo, ed è successo due
   volte: lo stesso inciampo l'aveva fatto il controllo sul raddoppio,
   che si segnalava la propria dichiarazione. */
/* IL MOLO STA SULLE ASSI, DA MAPPA NUOVA E DA SALVATAGGIO VECCHIO.

   Segnalato in partita: al laghetto due assi di legno galleggiano
   sull'acqua staccate da tutto. Erano le due traverse e il palo del
   deco `molo`, rimasti senza il pavimento sotto: il terreno viaggia nel
   salvataggio e i deco no, quindi `buildPodere` ridisegnava il pontile
   a ogni apertura mentre le tre caselle di assi arrivavano dal
   salvataggio — e in una partita cominciata prima che il molo fosse lì,
   sono acqua.

   Terzo caso della stessa famiglia dopo il burrone e il ponticello, e
   si controlla come quelli: che il deco stia sulle assi appena nata la
   valle, e che la ristampa rimetta a posto un terreno vecchio. La
   seconda metà ha la sua taratura davanti — prima si controlla che
   sporcare il terreno si veda davvero — se no sarebbe un verde che
   viene comunque. */
verifica('il molo del laghetto poggia sulle assi, anche da una partita vecchia', () => {
  const problemi = [];
  const m = WORLD.crea().podere;
  const moli = (m.deco||[]).filter(d => d.t === 'molo');
  if (!moli.length) return ['nel podere non c\'è nessun molo: questo controllo non guarda più niente'];

  const caselle = d => {
    const c = [];
    for (let k = 0; k < 3; k++) c.push({ x:d.x, y:d.y+k });
    return c;
  };
  for (const d of moli)
    for (const q of caselle(d))
      if (WORLD.terreno(m, q.x, q.y) !== 'assi')
        problemi.push(`il molo (${d.x},${d.y}) ha ${WORLD.terreno(m,q.x,q.y)} in (${q.x},${q.y}) invece di assi: ` +
                      'la ringhiera si disegna sul niente');

  // taratura: se sporcare il terreno non si vede, la prova qui sotto non vale
  const v = WORLD.crea().podere;
  for (const q of caselle(moli[0])) v.g[WORLD.idx(v, q.x, q.y)] = WORLD.ti('acqua');
  if (caselle(moli[0]).every(q => WORLD.terreno(v, q.x, q.y) === 'assi'))
    return problemi.concat('non riesco a togliere le assi da sotto al molo: questa prova non distingue più niente');

  WORLD.ristampaMolo(v);
  for (const q of caselle(moli[0]))
    if (WORLD.terreno(v, q.x, q.y) !== 'assi')
      problemi.push(`ristampaMolo non rimette le assi in (${q.x},${q.y}): ` +
                    'chi ha una partita avviata continua a vedere il pontile galleggiare');
  // e non se ne impila un secondo a ogni caricamento
  WORLD.ristampaMolo(v);
  const quanti = (v.deco||[]).filter(d => d.t === 'molo').length;
  if (quanti !== moli.length)
    problemi.push(`dopo due ristampe i moli sono ${quanti} invece di ${moli.length}: se ne impila uno a ogni caricamento`);
  return problemi;
});

verifica('niente float nelle finestre: stringe la prima riga flex', () => {
  const problemi = [];
  const dir = path.join(RADICE, 'js');
  const file = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
  if (file.length < 10)
    return [`in js/ ho trovato ${file.length} file: questo controllo non sta guardando quello che dovrebbe`];
  for (const f of file) {
    /* i commenti si sostituiscono con spazi, non si cancellano: così i
       numeri di riga restano quelli veri e l'errore si va a leggere */
    const src = fs.readFileSync(path.join(dir, f), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, c => c.replace(/[^\n]/g, ' '))
      .replace(/(^|\s)\/\/.*$/gm, (c, p) => p + ' '.repeat(c.length - p.length));
    for (const m of src.matchAll(/float\s*:\s*(right|left)/g)) {
      const riga = src.slice(0, m.index).split('\n').length;
      problemi.push(`js/${f}:${riga} usa «${m[0]}»: se sotto c'è una riga flex, quella si stringe ` +
                    'della larghezza del float e sembra un problema del suo contenuto. ' +
                    'Per mandare un elemento a destra: `margin-left:auto` dentro a una riga flex');
    }
  }
  return problemi;
});

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
