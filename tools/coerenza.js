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
