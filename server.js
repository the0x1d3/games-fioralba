#!/usr/bin/env node
/* ===================================================================
   FIORALBA — server.js
   Serve il gioco, e più avanti la sincronizzazione dei salvataggi.

   Nasce dalla migrazione da Vercel a Railway: prima lo statico lo
   serviva Vercel e la politica di cache stava in `vercel.json`. Quel
   file adesso non lo legge più nessuno, quindi le sue regole — e il
   ragionamento che c'era dietro — sono state portate qui dentro invece
   che perse.

   UN SOLO SERVER PER SVILUPPO E PRODUZIONE, e non per pigrizia: due
   server diversi vuol dire due comportamenti diversi, e la classe di
   difetti che ne esce è sempre la stessa — «in locale funziona». Qui
   cambia una cosa sola, la cache, ed è l'unica che *deve* cambiare:
   in sviluppo si ricarica e si vede la modifica, in produzione si
   rivalida e si riceve un 304.

       node server.js              produzione (o: npm start)
       node server.js --sviluppo   niente cache (o: npm run serve)
   =================================================================== */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const RADICE = __dirname;
const PORTA = Number(process.env.PORT) || 8123;
const SVILUPPO = process.argv.includes('--sviluppo') || process.env.FIORALBA_SVILUPPO === '1';

/* Le cartelle che non si servono: non c'è niente di segreto, ma non c'è
   nemmeno motivo di esporre i sorgenti degli strumenti e le dipendenze
   di sviluppo. Il gioco è tutto in js/, css/ e index.html. */
const VIETATE = ['node_modules', 'tools', 'types', '.git', '.claude'];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  /* .jpg mancava, e da quando l'anteprima social è un JPEG usciva come
     "application/octet-stream": i crawler dei social scaricano il file e
     non lo riconoscono come immagine, quindi l'anteprima non compare.
     Non se ne accorgeva nessuno perché quel file lo apre solo Facebook. */
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
  '.txt':  'text/plain; charset=utf-8'
};

/* Quello che si comprime prima di spedirlo. Le immagini e i font sono
   già compressi per conto loro: rigirarli nel gzip li fa solo crescere. */
const COMPRIMIBILI = new Set(['.html', '.js', '.css', '.json', '.svg', '.txt']);

/* La politica di cache, portata da vercel.json parola per parola:

   «Tutto rivalida a ogni visita. Il browser tiene comunque i file in
   cache: finché non cambiano riceve un 304 da poche centinaia di byte.
   In cambio non esiste più il rischio di pubblicare un aggiornamento che
   nessuno vede perché il vecchio JS è inchiodato in cache.»

   Perché funzioni serve l'ETag, altrimenti «rivalida» diventa
   «riscarica» e il gioco pesa 250 KB a ogni apertura invece di zero. */
function cacheDi(rel){
  if(SVILUPPO) return 'no-store';
  if(/^\/og-fioralba\./.test(rel)) return 'public, max-age=604800';   // l'anteprima non cambia mai
  return 'public, max-age=0, must-revalidate';
}

/* Le versioni compresse si tengono in memoria: il gioco è piccolo e i
   file non cambiano mentre il processo è vivo. In sviluppo no, o le
   modifiche resterebbero invisibili. */
const memoria = new Map();

function leggi(file, rel){
  if(!SVILUPPO && memoria.has(file)) return Promise.resolve(memoria.get(file));
  return new Promise((ok, no)=>{
    fs.readFile(file, (err, dati)=>{
      if(err) return no(err);
      fs.stat(file, (e2, st)=>{
        const voce = {
          dati,
          etag: '"' + (st ? st.size.toString(16) + '-' + st.mtimeMs.toString(36) : dati.length) + '"',
          tipo: MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
          gz: null
        };
        if(COMPRIMIBILI.has(path.extname(file).toLowerCase()) && dati.length > 1024){
          try{ voce.gz = zlib.gzipSync(dati, { level:9 }); }catch(_){}
        }
        if(!SVILUPPO) memoria.set(file, voce);
        ok(voce);
      });
    });
  });
}

function statico(req, res, rel){
  if(rel === '/') rel = '/index.html';

  const file = path.resolve(RADICE, '.' + rel);
  if(file !== RADICE && !file.startsWith(RADICE + path.sep)){
    res.writeHead(403); return res.end('403');
  }
  const primo = rel.split('/')[1] || '';
  if(VIETATE.includes(primo)){ res.writeHead(404); return res.end('404'); }

  leggi(file, rel).then(v=>{
    /* Il 304: il browser ci manda l'etag che ha, e se combacia gli
       rispondiamo «tienti quello che hai» in poche centinaia di byte. */
    if(req.headers['if-none-match'] === v.etag){
      res.writeHead(304, { 'ETag': v.etag, 'Cache-Control': cacheDi(rel) });
      return res.end();
    }
    const vuoleGz = /\bgzip\b/.test(req.headers['accept-encoding'] || '');
    const corpo = (v.gz && vuoleGz) ? v.gz : v.dati;
    const testa = {
      'Content-Type': v.tipo,
      'Content-Length': corpo.length,
      'Cache-Control': cacheDi(rel),
      'ETag': v.etag,
      'X-Content-Type-Options': 'nosniff'
    };
    if(v.gz && vuoleGz){ testa['Content-Encoding'] = 'gzip'; testa['Vary'] = 'Accept-Encoding'; }
    res.writeHead(200, testa);
    res.end(req.method === 'HEAD' ? undefined : corpo);
  }).catch(()=>{
    res.writeHead(404, { 'Content-Type':'text/plain; charset=utf-8' });
    res.end('404 — ' + rel);
  });
}

const partite = require('./server-partite.js');

const server = http.createServer((req, res)=>{
  const rel = decodeURIComponent((req.url || '/').split('?')[0]);

  /* Railway chiede «sei vivo?» e vuole una risposta secca: non deve
     passare dal disco né dal database, altrimenti un problema del DB
     fa credere che sia morto tutto il servizio e lo fa riavviare. */
  if(rel === '/salute'){
    res.writeHead(200, { 'Content-Type':'application/json', 'Cache-Control':'no-store' });
    return res.end(JSON.stringify({ ok:true, su:'fioralba', memoria: partite.tipoMemoria() }));
  }

  /* La sincronizzazione dei salvataggi. Sta sulla stessa origine del
     gioco — è tutto il motivo per cui siamo su un server solo — quindi
     niente CORS da configurare e niente da sbagliare. */
  if(rel.startsWith('/api/')){
    partite.gestisci(req, res, rel).catch(e=>{
      console.error('[api]', e && e.message);
      if(!res.headersSent){
        res.writeHead(500, { 'Content-Type':'application/json', 'Cache-Control':'no-store' });
        res.end(JSON.stringify({ errore:'errore interno' }));
      }
    });
    return;
  }

  if(req.method !== 'GET' && req.method !== 'HEAD'){
    res.writeHead(405, { 'Allow':'GET, HEAD' });
    return res.end('405');
  }
  statico(req, res, rel);
});

server.listen(PORTA, ()=>{
  console.log('\n  🏮 Fioralba su http://localhost:' + PORTA +
              (SVILUPPO ? '   (sviluppo: niente cache)' : '   (produzione)') + '\n');
});
