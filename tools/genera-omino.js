#!/usr/bin/env node
/*
 * Fioralba — sorgente originale del protagonista.
 *
 * Il disegno nasce su una griglia logica 48×56 e viene ingrandito 2× senza
 * interpolazione. Non legge, ritaglia o trasforma nessuna immagine esistente.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const LW = 48;
const LH = 56;
const SCALE = 2;
const CELL_W = LW * SCALE;
const CELL_H = LH * SCALE;
const COLS = 4;
const ROWS = 4;
const OUT = path.join(__dirname, '..', 'img');

const P = {
  ink: '#21130f',
  outline: '#382019',
  hair: '#572719',
  hairLight: '#853d22',
  skinDeep: '#a64f36',
  skin: '#db8054',
  skinLight: '#f3ad78',
  blush: '#c95f4a',
  white: '#fff1cf',
  blueDeep: '#10385f',
  blue: '#165e9f',
  blueMid: '#287fc0',
  blueLight: '#60add3',
  trouser: '#26384b',
  belt: '#4b291d',
  leather: '#74411f',
  leatherMid: '#a35e2b',
  leatherLight: '#d58a3e',
  straw: '#efb45f',
  bootDeep: '#2d1a16',
  boot: '#5a3427',
  bootLight: '#8b5031',
  gold: '#d9a040',
  metalDeep: '#53616d',
  metal: '#9fadb9',
  metalLight: '#e4ebea',
  woodDeep: '#4a2919',
  wood: '#8d4d24',
  woodLight: '#c27636',
  red: '#c84a3d',
  water: '#67bada'
};

function color(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}

class Surface {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.data = Buffer.alloc(w * h * 4);
  }

  pixel(x, y, c) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.data.set(color(c), (y * this.w + x) * 4);
  }

  rect(x, y, w, h, c) {
    for (let yy = Math.round(y); yy < Math.round(y + h); yy++) {
      for (let xx = Math.round(x); xx < Math.round(x + w); xx++) this.pixel(xx, yy, c);
    }
  }

  ellipse(cx, cy, rx, ry, c) {
    const x0 = Math.floor(cx - rx);
    const x1 = Math.ceil(cx + rx);
    const y0 = Math.floor(cy - ry);
    const y1 = Math.ceil(cy + ry);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = (x - cx) / Math.max(rx, 0.5);
        const dy = (y - cy) / Math.max(ry, 0.5);
        if (dx * dx + dy * dy <= 1) this.pixel(x, y, c);
      }
    }
  }

  polygon(points, c) {
    const minY = Math.max(0, Math.floor(Math.min(...points.map(p => p[1]))));
    const maxY = Math.min(this.h - 1, Math.ceil(Math.max(...points.map(p => p[1]))));
    for (let y = minY; y <= maxY; y++) {
      const intersections = [];
      for (let i = 0; i < points.length; i++) {
        const a = points[i];
        const b = points[(i + 1) % points.length];
        if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) {
          intersections.push(a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
        }
      }
      intersections.sort((a, b) => a - b);
      for (let i = 0; i + 1 < intersections.length; i += 2) {
        for (let x = Math.ceil(intersections[i]); x <= Math.floor(intersections[i + 1]); x++) {
          this.pixel(x, y, c);
        }
      }
    }
  }

  line(x1, y1, x2, y2, c, thickness = 1) {
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) * 2));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;
      this.ellipse(x, y, thickness / 2, thickness / 2, c);
    }
  }
}

function painter(surface, flip = false) {
  const mx = x => flip ? LW - 1 - x : x;
  return {
    pixel: (x, y, c) => surface.pixel(mx(x), y, c),
    rect: (x, y, w, h, c) => surface.rect(flip ? LW - x - w : x, y, w, h, c),
    ellipse: (x, y, rx, ry, c) => surface.ellipse(mx(x), y, rx, ry, c),
    line: (x1, y1, x2, y2, c, t) => surface.line(mx(x1), y1, mx(x2), y2, c, t),
    polygon: (points, c) => surface.polygon(points.map(([x, y]) => [mx(x), y]), c)
  };
}

function outlinedEllipse(A, x, y, rx, ry, outer, inner, inset = 1) {
  A.ellipse(x, y, rx, ry, outer);
  A.ellipse(x, y, Math.max(0.5, rx - inset), Math.max(0.5, ry - inset), inner);
}

function drawBoot(A, x, baseline, toe, far = false) {
  const dark = far ? P.outline : P.ink;
  const fill = far ? P.boot : P.boot;
  const pts = toe < 0
    ? [[x - 2, baseline - 8], [x + 2, baseline - 8], [x + 3, baseline - 2], [x + 1, baseline], [x - 6, baseline], [x - 7, baseline - 2]]
    : [[x - 2, baseline - 8], [x + 2, baseline - 8], [x + 7, baseline - 2], [x + 6, baseline], [x - 1, baseline], [x - 3, baseline - 2]];
  A.polygon(pts, dark);
  const inner = pts.map(([px, py]) => [
    px + (px < x ? 1 : -1),
    py + (py < baseline - 1 ? 1 : -1)
  ]);
  A.polygon(inner, fill);
  A.line(x - 2, baseline - 6, x + 2, baseline - 5, P.bootLight, 1);
  A.line(x - (toe < 0 ? 5 : 1), baseline - 1, x + (toe > 0 ? 5 : 1), baseline - 1, P.bootDeep, 1);
  A.line(x - (toe < 0 ? 6 : 2), baseline, x + (toe > 0 ? 6 : 2), baseline, P.bootDeep, 1);
}

function drawLeg(A, hip, knee, foot, toe, far = false) {
  A.line(hip[0], hip[1], knee[0], knee[1], P.ink, 6);
  A.line(knee[0], knee[1], foot[0], foot[1] - 5, P.ink, 6);
  A.line(hip[0], hip[1], knee[0], knee[1], far ? P.blueDeep : P.trouser, 3);
  A.line(knee[0], knee[1], foot[0], foot[1] - 5, far ? P.outline : P.trouser, 3);
  drawBoot(A, foot[0], foot[1], toe, far);
}

function drawArm(A, shoulder, elbow, hand, far = false) {
  A.line(shoulder[0], shoulder[1], elbow[0], elbow[1], P.ink, 6);
  A.line(elbow[0], elbow[1], hand[0], hand[1], P.ink, 5);
  A.line(shoulder[0], shoulder[1], elbow[0], elbow[1], far ? P.blueDeep : P.blue, 3);
  A.line(elbow[0], elbow[1], hand[0], hand[1] - 1, far ? P.blue : P.blueMid, 2);
  outlinedEllipse(A, hand[0], hand[1], 2.5, 2.4, P.ink, P.skinLight, 1);
  A.pixel(hand[0] - 1, hand[1] - 1, P.white);
}

function drawTorsoFront(A, bx, bob, back = false) {
  const y = bob;
  A.polygon([
    [15 + bx, 29 + y], [18 + bx, 25 + y], [23 + bx, 24 + y],
    [29 + bx, 25 + y], [33 + bx, 29 + y], [32 + bx, 42 + y],
    [28 + bx, 46 + y], [20 + bx, 46 + y], [15 + bx, 42 + y], [14 + bx, 30 + y]
  ], P.ink);
  A.polygon([
    [17 + bx, 29 + y], [20 + bx, 27 + y], [23 + bx, 27 + y],
    [28 + bx, 27 + y], [31 + bx, 30 + y], [30 + bx, 41 + y],
    [27 + bx, 43 + y], [20 + bx, 43 + y], [17 + bx, 40 + y]
  ], back ? P.blueDeep : P.blue);
  A.polygon([[18 + bx, 29 + y], [22 + bx, 27 + y], [21 + bx, 42 + y], [18 + bx, 40 + y]], P.blueMid);
  A.polygon([[28 + bx, 28 + y], [31 + bx, 31 + y], [29 + bx, 40 + y], [27 + bx, 42 + y]], P.blueDeep);
  A.line(17 + bx, 37 + y, 31 + bx, 37 + y, P.belt, 3);
  A.rect(22 + bx, 36 + y, 5, 4, P.ink);
  A.rect(23 + bx, 37 + y, 3, 2, P.gold);
  A.line(19 + bx, 42 + y, 22 + bx, 30 + y, P.blueLight, 1);
  A.line(28 + bx, 30 + y, 27 + bx, 42 + y, P.outline, 1);
  if (back) {
    A.line(24 + bx, 28 + y, 24 + bx, 41 + y, P.blueMid, 1);
    A.rect(20 + bx, 26 + y, 8, 2, P.outline);
  } else {
    A.polygon([[21 + bx, 26 + y], [24 + bx, 30 + y], [27 + bx, 26 + y]], P.skinLight);
    A.polygon([[22 + bx, 26 + y], [24 + bx, 28 + y], [26 + bx, 26 + y]], P.white);
  }
}

function drawHatFront(A, bx, bob, back = false) {
  const y = bob;
  A.polygon([
    [15 + bx, 12 + y], [16 + bx, 7 + y], [20 + bx, 3 + y],
    [28 + bx, 3 + y], [32 + bx, 7 + y], [33 + bx, 12 + y]
  ], P.ink);
  A.polygon([
    [17 + bx, 11 + y], [18 + bx, 7 + y], [21 + bx, 5 + y],
    [27 + bx, 5 + y], [30 + bx, 7 + y], [31 + bx, 11 + y]
  ], P.leatherMid);
  A.polygon([[20 + bx, 5 + y], [27 + bx, 5 + y], [29 + bx, 7 + y], [19 + bx, 7 + y]], P.leatherLight);
  A.line(17 + bx, 10 + y, 31 + bx, 10 + y, P.leather, 2);
  A.rect(22 + bx, 9 + y, 5, 2, P.gold);
  A.polygon([
    [8 + bx, 11 + y], [15 + bx, 10 + y], [22 + bx, 11 + y],
    [30 + bx, 10 + y], [39 + bx, 12 + y], [37 + bx, 15 + y],
    [29 + bx, 16 + y], [21 + bx, 15 + y], [13 + bx, 16 + y], [7 + bx, 14 + y]
  ], P.ink);
  A.polygon([
    [10 + bx, 12 + y], [16 + bx, 11 + y], [23 + bx, 12 + y],
    [30 + bx, 11 + y], [37 + bx, 12 + y], [35 + bx, 14 + y],
    [28 + bx, 14 + y], [21 + bx, 13 + y], [14 + bx, 14 + y], [9 + bx, 13 + y]
  ], back ? P.leather : P.leatherMid);
  A.line(13 + bx, 12 + y, 31 + bx, 12 + y, P.straw, 1);
}

function drawHeadFront(A, bx, bob, back = false) {
  const y = bob;
  if (back) {
    outlinedEllipse(A, 24 + bx, 19 + y, 10, 10, P.ink, P.hair, 1);
    A.polygon([[15 + bx, 17 + y], [18 + bx, 27 + y], [22 + bx, 24 + y], [25 + bx, 29 + y], [29 + bx, 24 + y], [33 + bx, 27 + y], [34 + bx, 17 + y]], P.hair);
    A.line(18 + bx, 18 + y, 21 + bx, 25 + y, P.hairLight, 2);
    A.line(29 + bx, 18 + y, 27 + bx, 26 + y, P.outline, 2);
    A.rect(21 + bx, 25 + y, 7, 4, P.skinDeep);
    drawHatFront(A, bx, bob, true);
    return;
  }

  outlinedEllipse(A, 24 + bx, 19 + y, 10, 10, P.ink, P.hair, 1);
  outlinedEllipse(A, 24 + bx, 19 + y, 8.2, 8.5, P.skinDeep, P.skin, 1);
  A.ellipse(15 + bx, 20 + y, 2, 3, P.ink);
  A.ellipse(15 + bx, 20 + y, 1, 2, P.skinLight);
  A.ellipse(33 + bx, 20 + y, 2, 3, P.ink);
  A.ellipse(33 + bx, 20 + y, 1, 2, P.skinLight);
  A.polygon([[17 + bx, 13 + y], [22 + bx, 11 + y], [25 + bx, 14 + y], [28 + bx, 12 + y], [32 + bx, 15 + y], [30 + bx, 17 + y], [18 + bx, 16 + y]], P.hair);
  A.rect(19 + bx, 18 + y, 4, 4, P.ink);
  A.rect(26 + bx, 18 + y, 4, 4, P.ink);
  A.pixel(20 + bx, 18 + y, P.white);
  A.pixel(27 + bx, 18 + y, P.white);
  A.pixel(24 + bx, 22 + y, P.skinLight);
  A.pixel(25 + bx, 23 + y, P.skinDeep);
  A.pixel(18 + bx, 23 + y, P.blush);
  A.pixel(30 + bx, 23 + y, P.blush);
  A.line(21 + bx, 25 + y, 27 + bx, 25 + y, P.outline, 1);
  A.pixel(23 + bx, 26 + y, P.white);
  A.rect(21 + bx, 27 + y, 7, 2, P.skinDeep);
  drawHatFront(A, bx, bob, false);
}

function drawTorsoSide(A, bx, bob) {
  const y = bob;
  A.polygon([
    [17 + bx, 29 + y], [21 + bx, 25 + y], [27 + bx, 25 + y],
    [31 + bx, 29 + y], [31 + bx, 42 + y], [27 + bx, 46 + y],
    [18 + bx, 45 + y], [15 + bx, 40 + y], [15 + bx, 31 + y]
  ], P.ink);
  A.polygon([
    [18 + bx, 30 + y], [22 + bx, 27 + y], [27 + bx, 27 + y],
    [29 + bx, 30 + y], [29 + bx, 40 + y], [26 + bx, 43 + y],
    [19 + bx, 42 + y], [17 + bx, 39 + y], [17 + bx, 31 + y]
  ], P.blue);
  A.polygon([[18 + bx, 30 + y], [22 + bx, 27 + y], [21 + bx, 42 + y], [18 + bx, 39 + y]], P.blueMid);
  A.polygon([[27 + bx, 28 + y], [29 + bx, 31 + y], [28 + bx, 41 + y], [25 + bx, 43 + y]], P.blueDeep);
  A.line(17 + bx, 37 + y, 29 + bx, 37 + y, P.belt, 3);
  A.rect(21 + bx, 36 + y, 4, 4, P.ink);
  A.rect(22 + bx, 37 + y, 2, 2, P.gold);
  A.line(20 + bx, 42 + y, 22 + bx, 30 + y, P.blueLight, 1);
  A.polygon([[20 + bx, 26 + y], [23 + bx, 30 + y], [26 + bx, 26 + y]], P.white);
}

function drawHeadSide(A, bx, bob) {
  const y = bob;
  outlinedEllipse(A, 23 + bx, 19 + y, 9, 10, P.ink, P.hair, 1);
  A.polygon([
    [15 + bx, 14 + y], [25 + bx, 11 + y], [31 + bx, 16 + y],
    [30 + bx, 24 + y], [25 + bx, 28 + y], [18 + bx, 26 + y],
    [14 + bx, 22 + y], [11 + bx, 21 + y], [14 + bx, 18 + y]
  ], P.ink);
  A.polygon([
    [17 + bx, 15 + y], [25 + bx, 13 + y], [29 + bx, 17 + y],
    [28 + bx, 23 + y], [24 + bx, 26 + y], [18 + bx, 24 + y],
    [15 + bx, 22 + y], [13 + bx, 21 + y], [16 + bx, 19 + y]
  ], P.skin);
  A.polygon([[22 + bx, 12 + y], [29 + bx, 14 + y], [30 + bx, 20 + y], [27 + bx, 18 + y], [25 + bx, 15 + y]], P.hair);
  outlinedEllipse(A, 28 + bx, 20 + y, 2.2, 3, P.ink, P.skinLight, 1);
  A.rect(17 + bx, 18 + y, 4, 4, P.ink);
  A.pixel(18 + bx, 18 + y, P.white);
  A.pixel(14 + bx, 22 + y, P.skinLight);
  A.pixel(19 + bx, 24 + y, P.blush);
  A.line(17 + bx, 25 + y, 22 + bx, 25 + y, P.outline, 1);
  A.rect(21 + bx, 27 + y, 6, 2, P.skinDeep);

  A.polygon([[15 + bx, 11 + y], [17 + bx, 6 + y], [21 + bx, 3 + y], [28 + bx, 4 + y], [31 + bx, 8 + y], [31 + bx, 12 + y]], P.ink);
  A.polygon([[17 + bx, 10 + y], [19 + bx, 6 + y], [22 + bx, 5 + y], [27 + bx, 5 + y], [29 + bx, 8 + y], [29 + bx, 11 + y]], P.leatherMid);
  A.line(18 + bx, 9 + y, 29 + bx, 9 + y, P.leather, 2);
  A.rect(22 + bx, 8 + y, 4, 2, P.gold);
  A.polygon([
    [7 + bx, 11 + y], [15 + bx, 10 + y], [23 + bx, 11 + y],
    [31 + bx, 10 + y], [37 + bx, 12 + y], [35 + bx, 15 + y],
    [25 + bx, 14 + y], [17 + bx, 15 + y], [8 + bx, 14 + y]
  ], P.ink);
  A.polygon([
    [9 + bx, 12 + y], [16 + bx, 11 + y], [23 + bx, 12 + y],
    [30 + bx, 11 + y], [35 + bx, 12 + y], [33 + bx, 13 + y],
    [24 + bx, 13 + y], [17 + bx, 14 + y], [9 + bx, 13 + y]
  ], P.leatherMid);
  A.line(12 + bx, 12 + y, 28 + bx, 12 + y, P.straw, 1);
}

function drawHandle(A, hand, top) {
  A.line(hand[0], hand[1] + 3, top[0], top[1], P.ink, 4);
  A.line(hand[0], hand[1] + 3, top[0], top[1], P.wood, 2);
  A.line(hand[0], hand[1] + 1, top[0] + 1, top[1] + 2, P.woodLight, 1);
}

function drawTool(A, id, hand, side) {
  const top = [hand[0] + side * 3, 14];
  const outward = x => x + side;

  if (id === 'annaffiatoio') {
    const cx = hand[0] + side * 5;
    const cy = hand[1] + 4;
    A.ellipse(cx, cy, 7, 6, P.ink);
    A.rect(cx - 6, cy - 4, 12, 8, P.blueDeep);
    A.ellipse(cx, cy + 3, 6, 3, P.blue);
    A.line(cx - side * 2, cy - 4, hand[0], hand[1], P.ink, 3);
    A.line(cx - side * 2, cy - 4, hand[0], hand[1], P.blueLight, 1);
    A.line(cx + side * 5, cy - 1, cx + side * 10, cy - 5, P.ink, 4);
    A.line(cx + side * 5, cy - 1, cx + side * 10, cy - 5, P.blueMid, 2);
    A.ellipse(cx + side * 11, cy - 6, 2, 2, P.ink);
    A.ellipse(cx + side * 11, cy - 6, 1, 1, P.metalLight);
    A.rect(cx - 2, cy - 7, 4, 2, P.ink);
    A.rect(cx - 1, cy - 7, 2, 1, P.blueLight);
    return;
  }

  if (id === 'arco') {
    const x = hand[0] + side * 6;
    const y = hand[1] - 5;
    A.line(x, y - 10, x + side * 4, y - 5, P.ink, 3);
    A.line(x + side * 4, y - 5, x + side * 5, y + 3, P.ink, 3);
    A.line(x + side * 5, y + 3, x + side * 1, y + 10, P.ink, 3);
    A.line(x, y - 10, x + side * 4, y - 5, P.woodLight, 1);
    A.line(x + side * 4, y - 5, x + side * 5, y + 3, P.woodLight, 1);
    A.line(x + side * 5, y + 3, x + side * 1, y + 10, P.woodLight, 1);
    A.line(x, y - 10, x + side * 1, y + 10, P.metalLight, 1);
    A.line(hand[0], hand[1], x + side * 4, y, P.wood, 1);
    return;
  }

  if (id === 'canna') {
    const tip = [hand[0] + side * 10, 10];
    A.line(hand[0], hand[1] + 2, tip[0], tip[1], P.ink, 3);
    A.line(hand[0], hand[1] + 2, tip[0], tip[1], P.woodLight, 1);
    const lineX = Math.max(1, Math.min(46, tip[0] + side * 3));
    A.line(tip[0], tip[1], lineX, hand[1] + 9, P.metalLight, 1);
    A.rect(lineX - 1, hand[1] + 8, 3, 3, P.ink);
    A.pixel(lineX, hand[1] + 9, P.red);
    return;
  }

  drawHandle(A, hand, top);
  if (id === 'ascia') {
    const tx = top[0];
    A.polygon([
      [tx, 11], [outward(tx), 9], [tx + side * 7, 8],
      [tx + side * 9, 12], [tx + side * 6, 16], [outward(tx), 15]
    ], P.ink);
    A.polygon([
      [tx + side, 11], [tx + side * 2, 10], [tx + side * 6, 10],
      [tx + side * 7, 12], [tx + side * 5, 14], [tx + side, 14]
    ], P.metal);
    A.line(tx + side * 3, 10, tx + side * 6, 10, P.metalLight, 1);
  } else if (id === 'piccone') {
    const tx = top[0];
    A.line(tx - 8, 13, tx + 8, 13, P.ink, 4);
    A.line(tx - 7, 13, tx + 7, 13, P.metal, 2);
    A.line(tx - 7, 13, tx - 9, 15, P.metalLight, 1);
    A.line(tx + 7, 13, tx + 9, 15, P.metalLight, 1);
  } else if (id === 'zappa') {
    const tx = top[0];
    A.polygon([
      [tx - side, 11], [tx + side * 8, 11], [tx + side * 9, 15],
      [tx + side * 2, 16], [tx - side, 14]
    ], P.ink);
    A.polygon([
      [tx + side, 12], [tx + side * 7, 12], [tx + side * 7, 14],
      [tx + side * 2, 15], [tx + side, 14]
    ], P.metal);
    A.line(tx + side * 2, 12, tx + side * 6, 12, P.metalLight, 1);
  } else if (id === 'falce') {
    const tx = top[0];
    A.line(tx, 13, tx + side * 4, 9, P.ink, 3);
    A.line(tx + side * 4, 9, tx + side * 9, 10, P.ink, 3);
    A.line(tx + side * 9, 10, tx + side * 11, 14, P.ink, 3);
    A.line(tx + side, 13, tx + side * 4, 10, P.metalLight, 1);
    A.line(tx + side * 4, 10, tx + side * 8, 11, P.metal, 1);
    A.line(tx + side * 8, 11, tx + side * 10, 14, P.metalLight, 1);
  }
}

const FRONTAL = [
  { bx: 0, bob: 0, left: [18, 54], right: [29, 52], leftKnee: [20, 46], rightKnee: [27, 46] },
  { bx: 1, bob: 1, left: [22, 53], right: [28, 54], leftKnee: [21, 47], rightKnee: [27, 47] },
  { bx: 0, bob: 0, left: [28, 52], right: [19, 54], leftKnee: [22, 46], rightKnee: [27, 46] },
  { bx: -1, bob: 1, left: [20, 54], right: [25, 53], leftKnee: [21, 47], rightKnee: [26, 47] }
];

const PROFILE = [
  { bx: 0, bob: 0, far: [18, 52], near: [31, 54], farKnee: [21, 46], nearKnee: [27, 46] },
  { bx: 1, bob: 1, far: [22, 52], near: [28, 54], farKnee: [22, 47], nearKnee: [27, 47] },
  { bx: 0, bob: 0, far: [30, 52], near: [18, 54], farKnee: [27, 46], nearKnee: [21, 46] },
  { bx: -1, bob: 1, far: [26, 52], near: [21, 54], farKnee: [26, 47], nearKnee: [22, 47] }
];

const ARM_SWING = [
  { left: [-5, 4], right: [5, -4] },
  { left: [-2, -1], right: [2, 2] },
  { left: [5, -4], right: [-5, 4] },
  { left: [2, 2], right: [-2, -1] }
];

function drawFrontal(surface, frame, tool, back = false) {
  const A = painter(surface);
  const pose = FRONTAL[frame];
  const swing = ARM_SWING[frame];
  const { bx, bob } = pose;
  const toolSide = back ? 1 : -1;
  const toolHand = [24 + bx + toolSide * 13, 35 + bob];
  if (tool) drawTool(A, tool, toolHand, toolSide);

  drawLeg(A, [21 + bx, 40 + bob], pose.rightKnee, pose.right, 1, true);
  drawLeg(A, [27 + bx, 40 + bob], pose.leftKnee, pose.left, -1, false);

  const leftShoulder = [16 + bx, 29 + bob];
  const rightShoulder = [32 + bx, 29 + bob];
  const leftHand = tool && toolSide < 0 ? toolHand : [13 + bx + swing.left[0], 37 + bob + swing.left[1]];
  const rightHand = tool && toolSide > 0 ? toolHand : [35 + bx + swing.right[0], 37 + bob + swing.right[1]];

  if (!(tool && toolSide > 0)) drawArm(A, rightShoulder, [34 + bx, 33 + bob], rightHand, true);
  if (!(tool && toolSide < 0)) drawArm(A, leftShoulder, [14 + bx, 33 + bob], leftHand, true);
  drawTorsoFront(A, bx, bob, back);
  drawHeadFront(A, bx, bob, back);

  if (tool && toolSide < 0) drawArm(A, leftShoulder, [14 + bx, 32 + bob], leftHand, false);
  else drawArm(A, leftShoulder, [14 + bx, 33 + bob], leftHand, false);
  if (tool && toolSide > 0) drawArm(A, rightShoulder, [34 + bx, 32 + bob], rightHand, false);
  else drawArm(A, rightShoulder, [34 + bx, 33 + bob], rightHand, false);
}

function drawProfile(surface, frame, tool, flip = false) {
  const A = painter(surface, flip);
  const pose = PROFILE[frame];
  const swing = ARM_SWING[frame];
  const { bx, bob } = pose;
  const toolSide = -1;
  const toolHand = [12 + bx, 35 + bob];
  if (tool) drawTool(A, tool, toolHand, toolSide);

  drawLeg(A, [26 + bx, 40 + bob], pose.farKnee, pose.far, 1, true);
  drawLeg(A, [21 + bx, 40 + bob], pose.nearKnee, pose.near, -1, false);

  const farHand = [30 + bx + swing.right[0] / 2, 37 + bob + swing.right[1]];
  drawArm(A, [28 + bx, 29 + bob], [30 + bx, 33 + bob], farHand, true);
  drawTorsoSide(A, bx, bob);
  drawHeadSide(A, bx, bob);

  const nearHand = tool ? toolHand : [13 + bx + swing.left[0], 37 + bob + swing.left[1]];
  drawArm(A, [18 + bx, 29 + bob], [15 + bx, 32 + bob], nearHand, false);
}

function encodePng(data, width, height) {
  const crc32 = buffer => {
    let crc = ~0;
    for (const value of buffer) {
      crc ^= value;
      for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
    return (~crc) >>> 0;
  };
  const chunk = (type, body) => {
    const typeBuffer = Buffer.from(type);
    const combined = Buffer.concat([typeBuffer, body]);
    const length = Buffer.alloc(4);
    const checksum = Buffer.alloc(4);
    length.writeUInt32BE(body.length);
    checksum.writeUInt32BE(crc32(combined));
    return Buffer.concat([length, combined, checksum]);
  };

  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 4 + 1);
    raw[row] = 0;
    data.copy(raw, row + 1, y * width * 4, (y + 1) * width * 4);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a', 'hex'),
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

function makeSheet(tool) {
  const width = CELL_W * COLS;
  const height = CELL_H * ROWS;
  const sheet = Buffer.alloc(width * height * 4);
  for (let row = 0; row < ROWS; row++) {
    for (let frame = 0; frame < COLS; frame++) {
      const logical = new Surface(LW, LH);
      if (row === 0) drawFrontal(logical, frame, tool, false);
      if (row === 1) drawProfile(logical, frame, tool, false);
      if (row === 2) drawProfile(logical, frame, tool, true);
      if (row === 3) drawFrontal(logical, frame, tool, true);

      for (let y = 0; y < LH; y++) {
        for (let x = 0; x < LW; x++) {
          const source = (y * LW + x) * 4;
          if (!logical.data[source + 3]) continue;
          for (let yy = 0; yy < SCALE; yy++) {
            for (let xx = 0; xx < SCALE; xx++) {
              const dx = frame * CELL_W + x * SCALE + xx;
              const dy = row * CELL_H + y * SCALE + yy;
              logical.data.copy(sheet, (dy * width + dx) * 4, source, source + 4);
            }
          }
        }
      }
    }
  }
  return encodePng(sheet, width, height);
}

const assets = [
  ['omino', null],
  ['omino-annaffiatoio', 'annaffiatoio'],
  ['omino-ascia', 'ascia'],
  ['omino-arco', 'arco'],
  ['omino-piccone', 'piccone'],
  ['omino-falce', 'falce'],
  ['omino-zappa', 'zappa'],
  ['omino-canna', 'canna']
];

for (const [name, tool] of assets) {
  fs.writeFileSync(path.join(OUT, `${name}.png`), makeSheet(tool));
}

console.log(`Generati ${assets.length} fogli originali 384×448 da griglia logica 48×56.`);