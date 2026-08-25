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
  for (let y = 0; y < height; y++) {
    if (raw[y * stride] !== 0) throw new Error(`${name}: filtro PNG inatteso alla riga ${y}`);
    raw.copy(pixels, y * width * 4, y * stride + 1, (y + 1) * stride);
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
  if (minY < 4 || minY > 18) throw new Error(`${name}: cappello fuori telaio (${minY})`);
  if (maxY !== 109) throw new Error(`${name}: linea dei piedi a ${maxY}, attesa 109`);
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
        const feetDifference = pixelDifference(cell, baseCell, { x: 28, y: 88, w: 40, h: 24 });
        if (feetDifference !== 0) {
          throw new Error(`${name}: l'attrezzo altera gambe o piedi nella direzione ${direction}, fase ${frame}`);
        }
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