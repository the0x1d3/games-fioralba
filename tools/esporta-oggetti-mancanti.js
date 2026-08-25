/*
 * Esporta una tavola trasparente degli arredi del mondo che, al momento,
 * non hanno un PNG manuale. Il disegno non viene reinterpretato qui:
 * il file estrae le funzioni correnti di render.js e le esegue nel gioco.
 *
 * Uso: node tools/esporta-oggetti-mancanti.js
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const renderSource = fs.readFileSync(path.join(root, 'js/render.js'), 'utf8');

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`Funzione non trovata: ${name}`);
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`Corpo non chiuso: ${name}`);
}

const sources = {
  object: extractFunction(renderSource, 'disegnaOggettoDentro'),
  flat: extractFunction(renderSource, 'disegnaDecoPiattaDentro'),
  tall: extractFunction(renderSource, 'disegnaDecoAltaDentro'),
};

const browserPath = process.env.CHROMIUM_PATH ||
  '/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium';
const baseUrl = process.env.REPLIT_DEV_DOMAIN
  ? `https://${process.env.REPLIT_DEV_DOMAIN}`
  : 'http://127.0.0.1:5000';
const outPath = path.join(root, 'attached_assets/generated_images/fioralba-oggetti-mancanti.png');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: browserPath,
    args: ['--no-sandbox'],
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 60_000 });

    const png = await page.evaluate((currentSources) => {
      const U = 32;
      const T = 64;
      const windlessFX = Object.create(window.FX);
      windlessFX.vento = () => 0;
      const game = { ora: 600, braci: 4 };

      function makeRenderer(source, name) {
        return new Function(
          'G', 'U', 'T', 'PAL', 'FX', 'ART', 'mez',
          'latiRecinto', 'targhetta', 'catturaNodoPixi',
          'immagineArredo', 'immagineRotte', 'spr', 'wx', 'wy',
          `let sx; ${source}; return (ctx, ...args) => {
            sx = ctx;
            return ${name}(...args);
          };`,
        )(
          game, U, T, window.PAL, windlessFX, window.ART,
          (n) => n / 2, () => ({}), () => {}, false,
          () => null, () => null, () => {}, 0, 0,
        );
      }

      const objectRenderer = makeRenderer(currentSources.object, 'disegnaOggettoDentro');
      const flatRenderer = makeRenderer(currentSources.flat, 'disegnaDecoPiattaDentro');
      const tallRenderer = makeRenderer(currentSources.tall, 'disegnaDecoAltaDentro');

      function isolated(draw, width = 160, height = 160) {
        const sprite = window.ART.tela(width / 2, height / 2);
        const ctx = sprite.getContext('2d');
        draw(ctx);
        return sprite;
      }

      function object(item, px = 24, py = 28) {
        return isolated((ctx) => {
          objectRenderer(ctx, item, px, py, 8, 8, 0, 'primavera', game, 0, 0);
        });
      }

      function flat(item, px = 24, py = 28, width = 160, height = 160) {
        return isolated((ctx) => {
          flatRenderer(ctx, item, px, py, 0, 'primavera');
        }, width, height);
      }

      function tall(item, px = 24, py = 28) {
        return isolated((ctx) => {
          tallRenderer(ctx, item, px, py, 0, 'primavera');
        });
      }

      /*
       * Ordine di lettura:
       * 1) bancarelle, 2) casse, 3) fioriere, 4) fiori spontanei,
       * 5) arredo urbano, 6) fontana/bucato, 7) ortaggi.
       * Le celle grandi sono volutamente lasciate senza testo e senza
       * fondo: la tavola rimane utilizzabile come sorgente trasparente.
       */
      const items = [
        object({ t: 'bancarella', v: 0 }, 30, 36),
        object({ t: 'bancarella', v: 1 }, 30, 36),
        object({ t: 'bancarella', v: 2 }, 30, 36),
        object({ t: 'casse', v: 0 }, 34, 38),
        object({ t: 'casse', v: 1 }, 34, 38),
        object({ t: 'casse', v: 2 }, 34, 38),

        object({ t: 'fioriera', v: 0 }, 34, 38),
        object({ t: 'fioriera', v: 1 }, 34, 38),
        object({ t: 'fioriera', v: 2 }, 34, 38),
        object({ t: 'fioriera', v: 3 }, 34, 38),
        object({ t: 'fiori', v: 0 }, 34, 38),
        object({ t: 'fiori', v: 1 }, 34, 38),

        object({ t: 'fiori', v: 2 }, 34, 38),
        object({ t: 'fiori', v: 3 }, 34, 38),
        object({ t: 'panchina', v: 0 }, 34, 34),
        object({ t: 'lampione', v: 0 }, 34, 42),
        object({ t: 'consegna', v: 0 }, 34, 38),
        object({ t: 'silo', v: 0 }, 34, 54),

        object({ t: 'pietra_rituale', v: 0 }, 34, 54),
        object({ t: 'bottiglia', v: 0 }, 34, 38),
        tall({ t: 'ortaggio', v: 0 }, 34, 38),
        tall({ t: 'ortaggio', v: 1 }, 34, 38),
        tall({ t: 'ortaggio', v: 2 }, 34, 38),
        tall({ t: 'ortaggio', v: 3 }, 34, 38),
      ];

      const sheet = document.createElement('canvas');
      sheet.width = 960;
      sheet.height = 960;
      const ctx = sheet.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      items.forEach((sprite, index) => {
        const col = index % 6;
        const row = Math.floor(index / 6);
        ctx.drawImage(sprite, col * 160, row * 160);
      });

      // Fontana: l'oggetto occupa quattro caselle di mappa, perciò conserva
      // il suo spazio 2×2 senza essere miniaturizzato.
      const fountain = flat({ t: 'fontana', v: 0 }, 0, 64, 320, 320);
      ctx.drawImage(fountain, 0, 640);

      // Bucato: le due lunghezze che il mondo usa davvero (3 e 4 caselle).
      const laundry3 = flat({ t: 'bucato', x: 0, y: 0, w: 3 }, 8, 64, 320, 160);
      const laundry4 = flat({ t: 'bucato', x: 0, y: 0, w: 4 }, 8, 64, 320, 160);
      ctx.drawImage(laundry3, 320, 640);
      ctx.drawImage(laundry4, 640, 640);

      return sheet.toDataURL('image/png');
    }, sources);

    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, Buffer.from(png.split(',')[1], 'base64'));
    console.log(`Tavola esportata: ${path.relative(root, outPath)}`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});