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
const outPath = path.join(root, 'attached_assets/generated_images/fioralba-oggetti-da-illustrare.png');

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

      /* I recinti e le macchine posabili non hanno un `t` proprio:
         fanno già parte del renderer in ART.placeable. Estrarli qui
         evita di reinterpretarne il disegno e consente alla tavola di
         mostrare le sedici giunte realmente usate dalla mappa. */
      function placeable(kind, opt = {}) {
        return isolated((ctx) => {
          const sprite = window.ART.placeable(kind, { attivo: true, ...opt });
          ctx.drawImage(sprite, 16 - sprite.width / 2, 48 - sprite.height);
        });
      }

      /*
       * Il foglio dell'utente copre bancarelle, casse, fioriere,
       * panchine, lampioni, consegna, fontana e bucato. Qui restano
       * soltanto le cose ancora procedurali: prima le 16 giunte del
       * recinto (bit N/E/S/O da 0 a 15), poi i due versi del cancelletto
       * e gli arredi ancora senza una grafica esterna definitiva.
       */
      const items = [];
      for (let lati = 0; lati < 16; lati += 1) items.push(placeable('recinto', { lati }));
      items.push(
        placeable('cancelletto', { lati: 10 }),
        placeable('cancelletto', { lati: 5 }),
        placeable('barattoliera'),
        placeable('botte'),
        placeable('fornace'),
        placeable('arnia'),
        placeable('lanterna'),
        placeable('lume'),
        flat({ t: 'ninfea', v: 0 }, 34, 38),
        flat({ t: 'ciuffo', v: 0 }, 34, 38),
        flat({ t: 'petali_terra', v: 0 }, 34, 38),
        flat({ t: 'sassolini', v: 0 }, 34, 38),
      );

      const sheet = document.createElement('canvas');
      sheet.width = 960;
      sheet.height = 800;
      const ctx = sheet.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      items.forEach((sprite, index) => {
        const col = index % 6;
        const row = Math.floor(index / 6);
        /* `ART.tela` conserva la tavola sorgente alla metà dei pixel
           finali del mondo. Qui la tavola è un asset da consultare, non
           una miniatura del gioco: la si porta quindi alla cella intera,
           senza interpolazione, così giunte e cardini restano leggibili. */
        ctx.drawImage(sprite, col * 160, row * 160, 160, 160);
      });

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