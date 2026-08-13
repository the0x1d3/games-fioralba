#!/usr/bin/env node
/* ===================================================================
   FIORALBA — tools/lingua.js
   Tira fuori dal gioco ogni frase che il giocatore legge, e la
   confronta col catalogo di una lingua.

       node tools/lingua.js en           quante ne mancano, e quali
       node tools/lingua.js en --tutte   tutte, non solo le prime
       node tools/lingua.js en --orfane  traduzioni che non servono più

   Esiste perché il catalogo è indicizzato per frase italiana: se
   qualcuno cambia una frase nel codice, la traduzione resta appesa a
   una frase che non c'è più. Senza questo strumento te ne accorgi
   giocando in inglese e trovando una riga in italiano; con questo, è
   una riga di output.
   =================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');
const RADICE = path.join(__dirname, '..');

/* --------------------------------------------------------------- */
/* 1. il testo che sta in DATA                                     */
/* --------------------------------------------------------------- */
function testiDati() {
  const finestra = {};
  const codice = ['js/data.js', 'js/lingua.js']
    .map(f => fs.readFileSync(path.join(RADICE, f), 'utf8')).join('\n');
  // lingua.js si aggancia al DOM al fondo: qui non c'è, quindi si finge
  const sandbox = {
    window: finestra, document: null, localStorage: null, navigator: { language: 'it' }
  };
  const vm = require('vm');
  const ctx = vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(RADICE, 'js/data.js'), 'utf8'), ctx, { filename: 'data.js' });
  // il motore vuole DATA globale e un DOM: gli si dà solo quello che usa
  ctx.DATA = finestra.DATA;
  ctx.document = { readyState: 'complete', documentElement: {}, querySelectorAll: () => [], addEventListener: () => {} };
  ctx.localStorage = { getItem: () => null, setItem: () => {} };
  vm.runInContext(fs.readFileSync(path.join(RADICE, 'js/lingua.js'), 'utf8'), ctx, { filename: 'lingua.js' });
  return finestra.LINGUA.testiDati();
}

/* --------------------------------------------------------------- */
/* 2. il testo scritto nei moduli                                  */
/* --------------------------------------------------------------- */
/* Si prendono solo le stringhe passate a chi parla col giocatore. Una
   regex sul sorgente è ingenua, ma cercare "ogni stringa italiana"
   raccoglieva id, selettori e frammenti di codice: meglio partire da
   chi la mostra. */
const USCITE = [
  'UI\\.toast', 'UI\\.prompt', 'nonSiPuo', 'particelleTesto', 'G\\.particelleTesto',
  'UI\\.dialogo', 'UI\\.modal', 'flashMessaggio', 'nota'
];

function testiModuli() {
  const fuori = new Set();
  const dir = path.join(RADICE, 'js');
  for (const f of fs.readdirSync(dir).filter(n => n.endsWith('.js'))) {
    if (f === 'lingua.js' || f.startsWith('lingua-')) continue;
    /* Il changelog è un archivio, non il gioco: diciassettemila caratteri
       di storia delle versioni. La voce più recente si traduce (è quella
       che compare sulla landing), le vecchie restano nella lingua in cui
       sono state scritte — un registro non si retrodata. Tenerle qui
       dentro voleva dire un conto di «mancanti» che non scende mai, e un
       contatore che non arriva a zero smette di dire qualcosa. */
    if (f === 'changelog.js') continue;
    /* Il pannello di prova non lo vede chi gioca: lo vede chi sviluppa,
       e chi sviluppa qui legge italiano. Tradurlo sarebbe lavoro per
       nessuno, e cinquanta righe che gonfiano il conto delle mancanti
       facendo sembrare il gioco meno tradotto di quanto sia. */
    if (f === 'debug.js') continue;
    const src = fs.readFileSync(path.join(dir, f), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');

    // il primo argomento di chi mostra testo
    const re = new RegExp('(?:' + USCITE.join('|') + ")\\(\\s*'((?:[^'\\\\]|\\\\.)*)'", 'g');
    for (const m of src.matchAll(re)) aggiungi(fuori, m[1]);

    // gli array di battute passati a UI.dialogo: [ '...', '...' ]
    for (const m of src.matchAll(/UI\.dialogo\([^,]+,\s*\[([\s\S]*?)\]\s*[,)]/g))
      for (const s of m[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)) aggiungi(fuori, s[1]);

    // le scelte dei dialoghi: { testo:'...' }
    for (const m of src.matchAll(/testo\s*:\s*'((?:[^'\\]|\\.)*)'/g)) aggiungi(fuori, m[1]);
    // i titoli e le etichette dichiarate come dati nei moduli
    for (const m of src.matchAll(/(?:attesa|titolo|eti|etichetta)\s*:\s*'((?:[^'\\]|\\.)*)'/g)) aggiungi(fuori, m[1]);
  }
  return [...fuori];
}

function aggiungi(insieme, grezza) {
  const s = grezza.replace(/\\'/g, "'").replace(/\\\\/g, '\\').trim();
  if (!s) return;
  if (s.length < 2) return;
  if (/^[\w.\/#|:-]+$/.test(s)) return;             // id, chiavi, percorsi
  if (!/[a-zà-ù]/i.test(s)) return;                  // solo simboli o numeri
  insieme.add(s);
}

/* --------------------------------------------------------------- */
/* 3. il testo scritto in index.html                               */
/* --------------------------------------------------------------- */
function testiMarkup() {
  const html = fs.readFileSync(path.join(RADICE, 'index.html'), 'utf8');
  const fuori = new Set();
  for (const m of html.matchAll(/<([a-z0-9]+)([^>]*\bdata-t\b[^>]*)>([\s\S]*?)<\/\1>/gi)) {
    const dentro = m[3].trim().replace(/\s+/g, ' ');
    if (dentro) fuori.add(dentro);
  }
  return [...fuori];
}

/* --------------------------------------------------------------- */
/* confronto col catalogo                                          */
/* --------------------------------------------------------------- */
function catalogo(codice) {
  const f = path.join(RADICE, 'js', 'lingua-' + codice + '.js');
  if (!fs.existsSync(f)) return null;
  const sandbox = { window: {} };
  require('vm').runInNewContext(fs.readFileSync(f, 'utf8'), sandbox, { filename: path.basename(f) });
  return sandbox.window['LINGUA_' + codice.toUpperCase()] || null;
}

/* le frasi con un numero dentro stanno nel catalogo come modello */
function comeChiave(s) {
  let i = 0;
  return s.replace(/-?\d+(?:[.,]\d+)*/g, () => '{' + (i++) + '}');
}

function raccogliTutto() {
  const tutte = new Set();
  for (const s of testiDati()) tutte.add(s);
  for (const s of testiModuli()) tutte.add(s);
  for (const s of testiMarkup()) tutte.add(s);
  return [...tutte];
}

module.exports = { raccogliTutto, catalogo, comeChiave, testiDati, testiModuli, testiMarkup };

/* --------------------------------------------------------------- */
/* riga di comando                                                 */
/* --------------------------------------------------------------- */
if (require.main === module) {
  const codice = process.argv[2] || 'en';
  const tutte = process.argv.includes('--tutte');
  const orfane = process.argv.includes('--orfane');

  const cat = catalogo(codice);
  if (!cat) { console.error('Nessun catalogo per «' + codice + '» (js/lingua-' + codice + '.js)'); process.exit(1); }

  const frasi = raccogliTutto();
  const mancanti = [];
  const usate = new Set();
  for (const s of frasi) {
    if (cat[s] !== undefined) { usate.add(s); continue; }
    const k = comeChiave(s);
    if (cat[k] !== undefined) { usate.add(k); continue; }
    mancanti.push(s);
  }

  const car = frasi.reduce((a, s) => a + s.length, 0);
  console.log('\n  Fioralba — lingua «' + codice + '»');
  console.log('  ' + '─'.repeat(62));
  console.log('  frasi nel gioco:      ' + frasi.length + '  (' + car.toLocaleString('it-IT') + ' caratteri)');
  console.log('  tradotte:             ' + (frasi.length - mancanti.length));
  console.log('  mancanti:             ' + mancanti.length);

  if (orfane) {
    const inutili = Object.keys(cat).filter(k => !usate.has(k));
    console.log('  traduzioni orfane:    ' + inutili.length);
    for (const k of inutili.slice(0, tutte ? 1e9 : 30)) console.log('      × ' + k);
  } else if (mancanti.length) {
    console.log('  ' + '─'.repeat(62));
    for (const s of mancanti.slice(0, tutte ? 1e9 : 40))
      console.log('      ' + JSON.stringify(comeChiave(s)) + ': ' + JSON.stringify(comeChiave(s)) + ',');
    if (!tutte && mancanti.length > 40) console.log('      … e altre ' + (mancanti.length - 40) + ' (--tutte)');
  }
  console.log('');
}
