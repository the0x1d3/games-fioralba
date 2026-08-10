#!/usr/bin/env node
/* ===================================================================
   FIORALBA — tools/serve.js
   Serve la cartella del gioco su http://localhost:8123 senza cache,
   così ricaricando la pagina si vedono sempre le ultime modifiche.
   Serve solo in sviluppo: per giocare basta aprire index.html.

       node tools/serve.js      (oppure: npm run serve)
   =================================================================== */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const RADICE = path.resolve(__dirname, '..');
const PORTA = Number(process.env.PORT) || 8123;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon'
};

http.createServer((req, res) => {
  let rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel === '/') rel = '/index.html';
  const file = path.resolve(RADICE, '.' + rel);

  // niente uscite dalla cartella del progetto
  if (file !== RADICE && !file.startsWith(RADICE + path.sep)) {
    res.writeHead(403); return res.end('403');
  }
  fs.readFile(file, (err, dati) => {
    if (err) { res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'}); return res.end('404 — ' + rel); }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(dati);
  });
}).listen(PORTA, () => {
  console.log(`\n  🏮 Fioralba su http://localhost:${PORTA}\n     (Ctrl+C per fermare)\n`);
});
