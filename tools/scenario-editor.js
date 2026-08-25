#!/usr/bin/env node
/* ===================================================================
   FIORALBA — editor locale degli scenari

   Questo processo ascolta solo su 127.0.0.1. `server.js` continua a
   rifiutare la cartella tools/, quindi l'interfaccia non può finire su
   Railway per errore. Le bozze sono file versionati; il pulsante Approva
   aggiorna il solo manifesto che il gioco legge.
   =================================================================== */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vm = require('vm');
const { spawn } = require('child_process');

const RADICE = path.join(__dirname, '..');
const PORTA = Number(process.env.EDITOR_PORTA || 4173);
const APPROVATI = path.join(RADICE, 'scenarios', 'approved');
const BOZZE = path.join(RADICE, 'scenarios', 'drafts');
const MANIFESTO = path.join(RADICE, 'scenarios', 'approved.json');
const TIPI = ['erba','terra','sentiero','sabbia','acqua','assi','lastre','grotta','roccia','vuoto','neve','cotto'];
/* L'editor modifica file del progetto: ogni processo usa un segreto
   effimero, consegnato soltanto alla pagina servita da questo loopback. */
const TOKEN_EDITOR = crypto.randomBytes(32).toString('base64url');
const ORIGINE_LOCALE = 'http://127.0.0.1:' + PORTA;

function caricaMotore(){
  const sandbox = { window:{}, console, Math, Uint8Array, Array, JSON };
  vm.createContext(sandbox);
  for(const file of ['js/data.js', 'js/world.js']){
    const sorgente = fs.readFileSync(path.join(RADICE, file), 'utf8');
    vm.runInContext(sorgente, sandbox, { filename:file });
  }
  return sandbox.window.WORLD;
}

function caricaMondo(){
  return caricaMotore().crea();
}

function copiaSicura(valore, visti){
  if(valore === null || typeof valore !== 'object') return valore;
  visti = visti || new WeakSet();
  if(visti.has(valore)) return undefined;
  visti.add(valore);
  if(Array.isArray(valore)) return valore.map(v=>copiaSicura(v, visti)).filter(v=>v!==undefined);
  const uscita = {};
  for(const k of Object.keys(valore)){
    if(k === 'ed') continue; // l'edificio contiene il riferimento circolare alla mappa
    const v = copiaSicura(valore[k], visti);
    if(v !== undefined && typeof v !== 'function') uscita[k] = v;
  }
  return uscita;
}

function oggettoEditor(o){
  if(!o || o.t === 'muro' || o.t === 'porta' || o.t === 'rimando') return null;
  return copiaSicura(o);
}

function istantanea(m){
  const oggetti = [];
  for(let y=0;y<m.h;y++) for(let x=0;x<m.w;x++){
    const o = oggettoEditor(m.obj[y*m.w+x]);
    if(o) oggetti.push({ x, y, oggetto:o });
  }
  return {
    id:m.id, nome:m.nome, w:m.w, h:m.h,
    terreno:Array.from(m.g, n=>m.TIPI ? m.TIPI[n] : undefined),
    oggetti, decorazioni:copiaSicura(m.deco)
  };
}

/* `WORLD.TIPI` è il catalogo pubblico, ma il dato generato dalla VM non ha
   bisogno di duplicare un riferimento nel singolo scenario. */
function normalizzaSnapshot(s, world){
  const tipi = world.TIPI;
  const risultato = istantanea(s);
  risultato.terreno = Array.from(s.g, n=>tipi[n]);
  return risultato;
}

function stesso(a,b){
  return JSON.stringify(a) === JSON.stringify(b);
}

function identita(o){
  return o && [o.t, o.kind, o.item].filter(v=>v!==undefined).join(':');
}

function patchScenario(base, corrente){
  const ritocchi = { terreno:[], oggetti:[], decorazioni:[] };
  for(let i=0;i<base.terreno.length;i++){
    if(base.terreno[i] === corrente.terreno[i]) continue;
    ritocchi.terreno.push({
      x:i%base.w, y:Math.floor(i/base.w),
      da:base.terreno[i], tipo:corrente.terreno[i]
    });
  }
  const vecchi = new Map(base.oggetti.map(v=>[v.x+','+v.y,v]));
  const nuovi = new Map(corrente.oggetti.map(v=>[v.x+','+v.y,v]));
  const rimossi = [], aggiunti = [];
  for(const [pos, voce] of vecchi){
    const nuovo = nuovi.get(pos);
    if(!nuovo) rimossi.push(voce);
    /* La coordinata da sola non basta: rimuovere una panchina e posare
       una cassa nella stessa casella è una sostituzione, non «nessuna
       modifica». La si esporta in due passi, nell'ordine giusto. */
    else if(!stesso(voce.oggetto, nuovo.oggetto)){
      rimossi.push(voce); aggiunti.push(nuovo);
    }
  }
  for(const [pos, voce] of nuovi) if(!vecchi.has(pos)) aggiunti.push(voce);
  const usati = new Set();
  for(const voce of rimossi){
    const j = aggiunti.findIndex((v,i)=>!usati.has(i) &&
      (v.x!==voce.x || v.y!==voce.y) && identita(v.oggetto) === identita(voce.oggetto));
    if(j >= 0){
      usati.add(j);
      ritocchi.oggetti.push({
        azione:'sposta', x:voce.x, y:voce.y,
        a:{x:aggiunti[j].x, y:aggiunti[j].y}, da:voce.oggetto
      });
    } else {
      ritocchi.oggetti.push({ azione:'rimuovi', x:voce.x, y:voce.y, da:voce.oggetto });
    }
  }
  aggiunti.forEach((voce,i)=>{
    if(!usati.has(i)) ritocchi.oggetti.push({
      azione:'aggiungi', x:voce.x, y:voce.y, oggetto:voce.oggetto
    });
  });
  for(const d of base.decorazioni){
    if(!corrente.decorazioni.some(n=>stesso(n,d)))
      ritocchi.decorazioni.push({ azione:'rimuovi', da:d });
  }
  for(const d of corrente.decorazioni){
    if(!base.decorazioni.some(n=>stesso(n,d)))
      ritocchi.decorazioni.push({ azione:'aggiungi', decorazione:d });
  }
  return {
    formato:'fioralba-scenario', versione:1, mappa:base.id,
    nome:base.nome, w:base.w, h:base.h, ritocchi
  };
}

function prossimoNome(cartella, id){
  fs.mkdirSync(cartella, { recursive:true });
  const re = new RegExp('^' + id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '-v(\\d+)\\.json$');
  let massimo = 0;
  for(const nome of fs.readdirSync(cartella)){
    const trovato = nome.match(re);
    if(trovato) massimo = Math.max(massimo, Number(trovato[1]));
  }
  return id + '-v' + String(massimo+1).padStart(3,'0') + '.json';
}

function leggiManifesto(){
  try{ return JSON.parse(fs.readFileSync(MANIFESTO, 'utf8')); }
  catch(_){ return { formato:'fioralba-scenari', versione:1, mappe:{} }; }
}

function eInteroDentro(n, massimo){
  return Number.isInteger(n) && n >= 0 && n < massimo;
}

function oggettoValido(o){
  return !!(o && typeof o === 'object' && !Array.isArray(o) &&
            typeof o.t === 'string' && o.t.length > 0 && o.t.length < 40);
}

function spazioRiservato(m,x,y){
  return !!(m.spazi && Object.values(m.spazi).some(s =>
    x>=s.x-1 && x<s.x+s.w+1 && y>=s.y-1 && y<s.y+s.h+1
  ));
}

function scenarioValido(scenario){
  if(!scenario || typeof scenario !== 'object' || Array.isArray(scenario))
    return 'Scenario mancante.';
  if(scenario.formato !== 'fioralba-scenario' || scenario.versione !== 1)
    return 'Formato dello scenario non riconosciuto.';
  const mappe = caricaMondo();
  const m = mappe[scenario.mappa];
  if(!m || !/^[a-z0-9_]+$/.test(scenario.mappa))
    return 'La mappa scelta non esiste.';
  if(scenario.w !== m.w || scenario.h !== m.h)
    return 'Le misure della mappa non corrispondono alla base corrente.';
  const r = scenario.ritocchi;
  if(!r || typeof r !== 'object') return 'Mancano i ritocchi dello scenario.';
  const motore = caricaMotore();
  const caselleTerreno = new Set(), caselleOggetti = new Map();
  const chiave = voce => voce.x+','+voce.y;
  for(const voce of (r.terreno || [])){
    if(!eInteroDentro(voce.x,m.w) || !eInteroDentro(voce.y,m.h) ||
       !TIPI.includes(voce.da) || !TIPI.includes(voce.tipo))
      return 'Un ritocco del terreno non è valido.';
    if(spazioRiservato(m,voce.x,voce.y))
      return 'Uno scenario non può occupare lo spazio riservato a una costruzione.';
    if(caselleTerreno.has(chiave(voce)))
      return 'Lo scenario modifica due volte lo stesso terreno.';
    caselleTerreno.add(chiave(voce));
  }
  for(const voce of (r.oggetti || [])){
    if(!eInteroDentro(voce.x,m.w) || !eInteroDentro(voce.y,m.h) ||
       !['aggiungi','rimuovi','sposta'].includes(voce.azione))
      return 'Un ritocco degli oggetti non è valido.';
    if(voce.azione === 'aggiungi' && !oggettoValido(voce.oggetto))
      return 'L’oggetto da aggiungere non è valido.';
    if(voce.azione === 'rimuovi' && !oggettoValido(voce.da))
      return 'L’oggetto da rimuovere non è valido.';
    if(voce.azione === 'sposta' &&
       (!oggettoValido(voce.da) || !voce.a || !eInteroDentro(voce.a.x,m.w) || !eInteroDentro(voce.a.y,m.h)))
      return 'Lo spostamento di un oggetto non è valido.';
    if(spazioRiservato(m,voce.x,voce.y) ||
       (voce.azione==='sposta' && spazioRiservato(m,voce.a.x,voce.a.y)))
      return 'Uno scenario non può occupare lo spazio riservato a una costruzione.';
    const toccate=[chiave(voce)];
    if(voce.azione === 'sposta') toccate.push(voce.a.x+','+voce.a.y);
    for(const k of toccate){
      const precedente=caselleOggetti.get(k);
      /* Un ridimensionamento nello stesso punto è, per il formato v1,
         una rimozione seguita da un’aggiunta. È l’unica coppia ripetuta
         che non sovrappone due oggetti e che il motore applica in ordine. */
      if(precedente && !(precedente==='rimuovi' && voce.azione==='aggiungi'))
        return 'Lo scenario sovrappone due ritocchi degli oggetti.';
      caselleOggetti.set(k,voce.azione);
    }
  }
  for(const voce of (r.decorazioni || [])){
    if(!['aggiungi','rimuovi'].includes(voce.azione) ||
       !oggettoValido(voce.azione === 'aggiungi' ? voce.decorazione : voce.da))
      return 'Un ritocco delle decorazioni non è valido.';
    if(!motore.decorazioneScenarioSicura(voce.azione === 'aggiungi' ? voce.decorazione : voce.da))
      return 'Uno scenario può ritoccare soltanto decorazioni scenografiche.';
  }
  /* La stessa prova che fa il gioco dopo una migrazione viene fatta prima
     dell'approvazione: una scenografia non può murare un'uscita né mettere
     qualcosa di solido nel punto in cui una mappa vicina ci fa arrivare. */
  const prova = motore.crea();
  const applicazione=motore.applicaScenario(prova[scenario.mappa], scenario, false);
  if(applicazione.saltati)
    return 'La bozza non entra nella mappa base: controlla impronta, collisioni e coordinate di arrivo.';
  /* Non si giudica la mappa intera: alberi ai margini, fontane e rocce sono
     scenografia già valida della base. Si giudicano solo le caselle che lo
     scenario sta toccando, altrimenti anche una modifica innocua verrebbe
     rifiutata per un oggetto che esisteva già prima dell'editor. */
  const toccate={[scenario.mappa]:new Set()};
  const aggiungiImpronta=(x,y,o)=>{
    const f=motore.impronta(o);
    for(let j=0;j<f.h;j++) for(let i=0;i<f.w;i++) toccate[scenario.mappa].add((x+i)+','+(y+j));
  };
  for(const voce of (r.terreno||[])) toccate[scenario.mappa].add(chiave(voce));
  for(const voce of (r.oggetti||[])){
    aggiungiImpronta(voce.x,voce.y,voce.azione==='aggiungi'?voce.oggetto:voce.da);
    if(voce.azione==='sposta') aggiungiImpronta(voce.a.x,voce.a.y,voce.da);
  }
  const problemi = motore.verificaMappe(prova, toccate);
  if(problemi.length) return 'Lo scenario blocca un collegamento: '+problemi[0]+'.';
  return null;
}

function salvaScenario(scenario, approva){
  const cartella = approva ? APPROVATI : BOZZE;
  const nome = prossimoNome(cartella, scenario.mappa);
  scenario.edizione = Number((nome.match(/-v(\d+)\.json$/) || [])[1]);
  fs.writeFileSync(path.join(cartella, nome), JSON.stringify(scenario, null, 2) + '\n');
  if(approva){
    const manifesto = leggiManifesto();
    manifesto.mappe = manifesto.mappe || {};
    manifesto.mappe[scenario.mappa] = scenario;
    fs.writeFileSync(MANIFESTO, JSON.stringify(manifesto, null, 2) + '\n');
  }
  return { nome, approvato:!!approva };
}

function risposta(res, codice, dati){
  const testo = JSON.stringify(dati);
  res.writeHead(codice, {'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'no-store', 'Content-Length':Buffer.byteLength(testo)});
  res.end(testo);
}

function tokenValido(token){
  if(typeof token !== 'string' || token.length !== TOKEN_EDITOR.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(TOKEN_EDITOR));
}

function richiestaScritturaValida(req){
  return req.headers.host === '127.0.0.1:' + PORTA &&
    req.headers.origin === ORIGINE_LOCALE &&
    tokenValido(req.headers['x-editor-token']);
}

function apriBrowser(){
  if(process.env.EDITOR_APRI_BROWSER !== '1') return;
  const url = ORIGINE_LOCALE + '/';
  let comando, argomenti;
  if(process.platform === 'win32'){
    comando = 'cmd'; argomenti = ['/c', 'start', '', url];
  }else if(process.platform === 'darwin'){
    comando = 'open'; argomenti = [url];
  }else{
    comando = 'xdg-open'; argomenti = [url];
  }
  try{
    const processo = spawn(comando, argomenti, { detached:true, stdio:'ignore' });
    processo.on('error', ()=>{});
    processo.unref();
  }catch(_){}
}

function corpo(req){
  return new Promise((ok,no)=>{
    let testo = '';
    req.on('data', pezzo=>{ testo += pezzo; if(testo.length > 4e6) no(new Error('file troppo grande')); });
    req.on('end', ()=>{ try{ ok(JSON.parse(testo || '{}')); }catch(e){ no(e); } });
    req.on('error', no);
  });
}

const server = http.createServer(async (req,res)=>{
  const url = new URL(req.url || '/', 'http://127.0.0.1');
  try{
    if(req.method === 'GET' && url.pathname === '/api/mappe'){
      const mondo = caricaMondo();
      const dati = {};
      for(const id of Object.keys(mondo)) dati[id] = normalizzaSnapshot(mondo[id], { TIPI: [
        'erba','terra','sentiero','sabbia','acqua','assi','lastre','grotta','roccia','vuoto','neve','cotto'
      ]});
      return risposta(res, 200, { mappe:dati, approvati:leggiManifesto() });
    }
    if(req.method === 'POST' && url.pathname === '/api/esporta'){
      if(!richiestaScritturaValida(req))
        return risposta(res,403,{errore:'Richiesta dell’editor non autorizzata.'});
      if(!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || ''))
        return risposta(res,415,{errore:'L’editor accetta soltanto JSON.'});
      const corpoLetto = await corpo(req);
      const errore = scenarioValido(corpoLetto.scenario);
      if(errore) return risposta(res,400,{errore});
      return risposta(res,200,salvaScenario(corpoLetto.scenario, !!corpoLetto.approva));
    }
    if(req.method === 'GET' || req.method === 'HEAD'){
      const nome = url.pathname === '/' ? 'editor.html' : url.pathname.slice(1);
      if(nome !== 'editor.html' && nome !== 'editor.js') return risposta(res,404,{errore:'Non trovato.'});
      const file = path.join(__dirname, nome);
      let testo = fs.readFileSync(file, 'utf8');
      if(nome === 'editor.html')
        testo = testo.replace('<!-- EDITOR_CSRF_TOKEN -->', TOKEN_EDITOR);
      res.writeHead(200, {
        'Content-Type':nome.endsWith('.js')?'text/javascript; charset=utf-8':'text/html; charset=utf-8',
        'Content-Security-Policy':"default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
        'X-Frame-Options':'DENY',
        'Referrer-Policy':'no-referrer'
      });
      return res.end(req.method === 'HEAD' ? undefined : testo);
    }
    risposta(res,405,{errore:'Metodo non consentito.'});
  }catch(e){
    risposta(res,500,{errore:e.message || 'Errore dell’editor.'});
  }
});

server.listen(PORTA, '127.0.0.1', ()=>{
  console.log('\n  Editor scenari Fioralba: http://127.0.0.1:' + PORTA);
  console.log('  Solo locale — le bozze vanno in scenarios/drafts/\n');
  apriBrowser();
});