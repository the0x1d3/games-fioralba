#!/usr/bin/env node
/* Verifica il rig originale, la trasparenza e le invarianti fra i fogli. */
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.join(__dirname, '..');
const CELL_W = 96;
const CELL_H = 112;
const COLS = 4;
const ROWS = 4;
const NAMES = [
  'omino',
  'omino-annaffiatoio',
  'omino-ascia',
  'omino-arco',
  'omino-piccone',
  'omino-falce',
  'omino-zappa',
  'omino-canna'
];

function readSheet(name) {
  const png = fs.readFileSync(path.join(ROOT, 'img', `${name}.png`));
  if (png.readUInt32BE(0) !== 0x89504e47) throw new Error(`${name}: non è un PNG`);
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  if (width !== CELL_W * COLS || height !== CELL_H * ROWS) {
    throw new Error(`${name}: dimensione ${width}×${height}, attesa 384×448`);
  }

  const chunks = [];
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset);
    const type = png.toString('ascii', offset + 4, offset + 8);
    if (type === 'IDAT') chunks.push(png.subarray(offset + 8, offset + 8 + length));
    offset += length + 12;
  }
  const raw = zlib.inflateSync(Buffer.concat(chunks));
  const stride = width * 4 + 1;
  if (raw.length !== stride * height) throw new Error(`${name}: dati PNG incompleti`);

  const pixels = Buffer.alloc(width * height * 4);
  const bpp = 4;
  const paeth = (a, b, c) => {
    const p = a + b - c;
    const pa = Math.abs(p-a), pb = Math.abs(p-b), pc = Math.abs(p-c);
    return pa <= pb && pa <= pc ? a : (pb <= pc ? b : c);
  };
  for (let y = 0; y < height; y++) {
    const inizio = y * stride, filtro = raw[inizio];
    const riga = y * width * bpp;
    if (filtro > 4) throw new Error(`${name}: filtro PNG sconosciuto alla riga ${y}`);
    for (let x = 0; x < width * bpp; x++) {
      const valore = raw[inizio + 1 + x];
      const sinistra = x >= bpp ? pixels[riga + x - bpp] : 0;
      const sopra = y ? pixels[riga - width * bpp + x] : 0;
      const diagonale = y && x >= bpp ? pixels[riga - width * bpp + x - bpp] : 0;
      const base = filtro===0 ? 0
        : filtro===1 ? sinistra
        : filtro===2 ? sopra
        : filtro===3 ? ((sinistra + sopra) >> 1)
        : paeth(sinistra, sopra, diagonale);
      pixels[riga + x] = (valore + base) & 255;
    }
  }
  return { width, height, pixels };
}

function extractCell(sheet, direction, frame) {
  const cell = Buffer.alloc(CELL_W * CELL_H * 4);
  for (let y = 0; y < CELL_H; y++) {
    const source = ((direction * CELL_H + y) * sheet.width + frame * CELL_W) * 4;
    sheet.pixels.copy(cell, y * CELL_W * 4, source, source + CELL_W * 4);
  }
  return cell;
}

function pixelDifference(a, b, region = null) {
  const x0 = region ? region.x : 0;
  const y0 = region ? region.y : 0;
  const x1 = region ? region.x + region.w : CELL_W;
  const y1 = region ? region.y + region.h : CELL_H;
  let different = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * CELL_W + x) * 4;
      if (a[i] !== b[i] || a[i + 1] !== b[i + 1] ||
          a[i + 2] !== b[i + 2] || a[i + 3] !== b[i + 3]) different++;
    }
  }
  return different;
}

function alphaBounds(name, cell, direction, frame) {
  let minX = CELL_W;
  let minY = CELL_H;
  let maxX = -1;
  let maxY = -1;
  let opaque = 0;
  for (let y = 0; y < CELL_H; y++) {
    for (let x = 0; x < CELL_W; x++) {
      const i = (y * CELL_W + x) * 4;
      const alpha = cell[i + 3];
      if (alpha !== 0 && alpha !== 255) {
        throw new Error(`${name}: alfa parziale nella direzione ${direction}, fase ${frame}`);
      }
      if (!alpha) {
        if (cell[i] || cell[i + 1] || cell[i + 2]) {
          throw new Error(`${name}: colore residuo sotto alfa nullo nella direzione ${direction}, fase ${frame}`);
        }
        continue;
      }
      opaque++;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (opaque < 700) throw new Error(`${name}: posa troppo vuota nella direzione ${direction}, fase ${frame}`);
  /* I fogli originali iniziavano dal quarto pixel; i fogli disegnati a
     mano possono avere una tesa più alta, purché restino nel riquadro. */
  if (minY < 0 || minY > 18) throw new Error(`${name}: cappello fuori telaio (${minY})`);
  /* Il renderer ancora la cella, non il singolo pixel opaco. Nelle pose
     disegnate a mano un piede può restare sollevato durante la falcata:
     deve stare nel margine basso della cella, non sulla stessa riga fissa. */
  if (maxY < 100 || maxY > 111)
    throw new Error(`${name}: piedi fuori dal margine basso (${maxY})`);
  return { minX, minY, maxX, maxY, opaque };
}

const sheets = new Map(NAMES.map(name => [name, readSheet(name)]));
const base = sheets.get('omino');

for (const name of NAMES) {
  const sheet = sheets.get(name);
  for (let direction = 0; direction < ROWS; direction++) {
    const frames = [];
    for (let frame = 0; frame < COLS; frame++) {
      const cell = extractCell(sheet, direction, frame);
      alphaBounds(name, cell, direction, frame);
      frames.push(cell);

      if (name !== 'omino') {
        const baseCell = extractCell(base, direction, frame);
        if (pixelDifference(cell, baseCell) < 80) {
          throw new Error(`${name}: attrezzo assente o non distinguibile nella direzione ${direction}, fase ${frame}`);
        }
      }
    }

    for (let frame = 0; frame < COLS; frame++) {
      const next = (frame + 1) % COLS;
      if (pixelDifference(frames[frame], frames[next]) < 180) {
        throw new Error(`${name}: fasi ${frame} e ${next} troppo simili nella direzione ${direction}`);
      }
    }
  }

  const front = extractCell(sheet, 0, 0);
  const left = extractCell(sheet, 1, 0);
  const right = extractCell(sheet, 2, 0);
  const back = extractCell(sheet, 3, 0);
  if (pixelDifference(front, left) < 500 ||
      pixelDifference(front, right) < 500 ||
      pixelDifference(front, back) < 500) {
    throw new Error(`${name}: le direzioni non hanno sagome abbastanza distinte`);
  }
}

const dataSource = fs.readFileSync(path.join(ROOT, 'js', 'data.js'), 'utf8');
if (/arco:[\s\S]{0,120}righe:\{0:0,1:2,2:1,3:3\}/.test(dataSource)) {
  throw new Error('mappatura dell’arco non canonica');
}

const generatorSource = fs.readFileSync(path.join(ROOT, 'tools', 'genera-omino.js'), 'utf8');
if (/\breadFile(?:Sync)?\b|\bcreateReadStream\b/.test(generatorSource)) {
  throw new Error('il generatore non deve leggere o adattare immagini esistenti');
}

console.log(`✓ rig originale 4×4, trasparenza, falcate e appoggio verificati per ${NAMES.length} fogli`);