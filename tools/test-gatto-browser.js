/*
 * Verifica nel browser il percorso completo degli aspetti del gatto.
 *
 * Uso:
 *   npm run test:browser
 *
 * Per usare un Chromium di sistema, dichiararlo così:
 *   CHROMIUM_PATH=/percorso/a/chromium npm run test:browser
 *
 * Senza TEST_BASE_URL il test avvia server.js su una porta temporanea.
 * Le API delle partite sono intercettate dentro un contesto Playwright
 * privato: nessuna partita di prova raggiunge il server o resta nel
 * browser dopo il test.
 */
'use strict';

const fs = require('fs');
const http = require('http');
const net = require('net');
const path = require('path');
const { spawn, execFileSync } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const CODICE_TEST = 'FIORALBA-ABCD-EFGH-JKMP';
const VISTE = [
  { nome: 'desktop', viewport: { width: 1280, height: 820 } },
  { nome: 'mobile', viewport: { width: 390, height: 844 } },
];

function verifica(condizione, messaggio) {
  if (!condizione) throw new Error(messaggio);
}

function trovaBrowser() {
  const candidati = [process.env.CHROMIUM_PATH, chromium.executablePath()];
  try {
    candidati.push(execFileSync('which', ['chromium'], { encoding: 'utf8' }).trim());
  } catch (_) {}
  return candidati.find(percorso => percorso && fs.existsSync(percorso));
}

function errorePagina(nome, errori) {
  if (!errori.length) return;
  throw new Error(`${nome}: errori JavaScript nel browser:\n${errori.join('\n')}`);
}

function portaLibera() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(err => err ? reject(err) : resolve(port));
    });
  });
}

function attendeServer(url) {
  return new Promise((resolve, reject) => {
    const scadenza = Date.now() + 15_000;
    const prova = () => {
      const richiesta = http.get(`${url}/salute`, risposta => {
        risposta.resume();
        if (risposta.statusCode === 200) return resolve();
        riprova();
      });
      richiesta.on('error', riprova);
      richiesta.setTimeout(1_000, () => richiesta.destroy());
    };
    const riprova = () => {
      if (Date.now() >= scadenza)
        return reject(new Error(`Il server di prova non risponde su ${url}.`));
      setTimeout(prova, 100);
    };
    prova();
  });
}

async function avviaServerSeServe() {
  if (process.env.TEST_BASE_URL) {
    return { url: process.env.TEST_BASE_URL.replace(/\/$/, ''), ferma: async () => {} };
  }

  const port = await portaLibera();
  const url = `http://127.0.0.1:${port}`;
  const processo = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  processo.stdout.on('data', dati => { log += dati; });
  processo.stderr.on('data', dati => { log += dati; });

  try {
    await attendeServer(url);
  } catch (errore) {
    processo.kill('SIGTERM');
    throw new Error(`${errore.message}\n${log}`);
  }

  return {
    url,
    ferma: async () => {
      if (processo.exitCode !== null || processo.signalCode) return;
      processo.kill('SIGTERM');
      await new Promise(resolve => processo.once('exit', resolve));
    },
  };
}

async function fingiPartite(context) {
  const stato = { versione: 0, dati: null, salvataggi: [] };

  await context.route('**/api/**', async route => {
    const richiesta = route.request();
    const url = new URL(richiesta.url());
    const metodo = richiesta.method();
    const risposta = corpo => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(corpo),
    });

    if (metodo === 'POST' && url.pathname === '/api/partita') {
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ codice: CODICE_TEST, versione: stato.versione, vuota: true }),
      });
    }

    if (!url.pathname.startsWith(`/api/partita/${CODICE_TEST}`)) {
      return route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ errore: 'partita di prova non trovata' }),
      });
    }

    if (metodo === 'PUT') {
      const corpo = richiesta.postDataJSON();
      stato.dati = corpo.dati;
      stato.salvataggi.push(JSON.parse(corpo.dati));
      stato.versione += 1;
      return risposta({ codice: CODICE_TEST, versione: stato.versione });
    }

    if (metodo === 'GET' && url.pathname.endsWith('/stato')) {
      return risposta({
        codice: CODICE_TEST,
        versione: stato.versione,
        nome: 'Prova gatto',
        giornoTot: 0,
        oro: stato.dati ? JSON.parse(stato.dati).oro : 600,
        aggiornato: '2026-01-01T00:00:00.000Z',
        vuota: !stato.dati,
      });
    }

    if (metodo === 'GET') {
      return risposta({
        codice: CODICE_TEST,
        versione: stato.versione,
        dati: stato.dati,
        nome: 'Prova gatto',
        giornoTot: 0,
        aggiornato: '2026-01-01T00:00:00.000Z',
        vuota: !stato.dati,
      });
    }

    return route.abort('failed');
  });

  return stato;
}

async function aspettiDelGioco(page) {
  return page.evaluate(() => DATA.GATTI.map(({ id, nome, prezzo }) => ({ id, nome, prezzo })));
}

async function salvaEAfferma(page, salvataggio, aspetto, posseduti, contesto) {
  const invio = await page.evaluate(() => SINC.invia());
  verifica(invio.ok, `${contesto}: il salvataggio non riesce.`);
  const ultimo = salvataggio.salvataggi.at(-1);
  verifica(ultimo?.gatto?.skin === aspetto, `${contesto}: il salvataggio non conserva ${aspetto} come aspetto attivo.`);
  verifica(
    posseduti.every(id => ultimo.gatto.aspetti.includes(id)),
    `${contesto}: il salvataggio non conserva tutti gli aspetti adottati.`,
  );
}

async function scegliEAvvia(page, salvataggio, nomeVista, aspetto) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('#landing').waitFor({ state: 'visible' });
  await page.locator('.lp-new').first().click();

  const modal = page.locator('#modal-wrap');
  await modal.locator('.imp-nome-inp').waitFor({ state: 'visible' });
  const carte = modal.locator('.gatto-scelta');
  verifica(await carte.count() === 5, `${nomeVista}: devono comparire cinque aspetti iniziali.`);
  const aspetti = await aspettiDelGioco(page);
  verifica(aspetti.length === 5, `${nomeVista}: i dati del gioco devono dichiarare cinque aspetti.`);
  const indice = aspetti.findIndex(a => a.id === aspetto.id);
  verifica(indice >= 0, `${nomeVista}: non trovo la carta ${aspetto.id}.`);

  const riquadri = await carte.evaluateAll(elementi => elementi.map(el => {
    const r = el.getBoundingClientRect();
    return { width: r.width, height: r.height };
  }));
  verifica(
    riquadri.every(r => r.width > 0 && r.height > 0),
    `${nomeVista}: una carta del gatto non è visibile.`,
  );

  await carte.nth(indice).click();
  verifica(
    await carte.nth(indice).getAttribute('aria-checked') === 'true',
    `${nomeVista}: la carta ${aspetto.nome} non si può selezionare.`,
  );
  await modal.locator('.imp-nome-inp').fill(`Prova ${aspetto.nome}`);
  await modal.getByRole('button', { name: 'Ho segnato il codice, si comincia', exact: true }).click();
  await page.waitForFunction(skin => window.G && G.inGioco && G.gatto.skin === skin, aspetto.id);

  const statoValle = await page.evaluate(() => ({
    skin: G.gatto.skin,
    aspetti: G.gatto.aspetti,
    gatti: G.animali.filter(a => a.tipo === 'gatto').length,
    canvas: document.querySelector('#game')?.getBoundingClientRect().width || 0,
  }));
  verifica(statoValle.skin === aspetto.id, `${nomeVista}: ${aspetto.nome} non arriva nella valle.`);
  verifica(statoValle.aspetti.includes(aspetto.id), `${nomeVista}: ${aspetto.nome} non è adottato.`);
  verifica(statoValle.gatti === 1 && statoValle.canvas > 0, `${nomeVista}: il gatto non è visibile nella valle.`);
  await salvaEAfferma(page, salvataggio, aspetto.id, [aspetto.id], `${nomeVista}: scelta iniziale ${aspetto.nome}`);
  return aspetti;
}

async function verificaBruno(page, salvataggio, nomeVista, aspetti, iniziale) {
  await page.evaluate(() => {
    G.oro = 10_000;
    G.aggiornaHUD();
  });
  await page.evaluate(() => UI.negozio(G, 'bruno'));
  const modal = page.locator('#modal-wrap');
  await modal.getByRole('button', { name: 'Gatto', exact: true }).click();
  verifica(await modal.locator('.gatto-riga').count() === 5, `${nomeVista}: Bruno non mostra cinque aspetti.`);

  const posseduti = [iniziale.id];
  let oroPrecedente = 10_000;
  for (const aspetto of aspetti.filter(a => a.id !== iniziale.id)) {
    const riga = modal.locator('.gatto-riga', { hasText: aspetto.nome });
    await riga.getByRole('button', { name: /^Adotta ·/ }).click();
    await page.waitForFunction(skin => G.gatto.skin === skin && G.gatto.aspetti.includes(skin), aspetto.id);
    const oro = await page.evaluate(() => G.oro);
    verifica(oro === oroPrecedente - aspetto.prezzo, `${nomeVista}: Bruno non scala le monete per ${aspetto.nome}.`);
    oroPrecedente = oro;
    posseduti.push(aspetto.id);
    await salvaEAfferma(page, salvataggio, aspetto.id, posseduti, `${nomeVista}: adozione ${aspetto.nome}`);
  }

  let attivo = await page.evaluate(() => G.gatto.skin);
  const ordineApplicazione = aspetti.filter(a => a.id !== attivo).concat(aspetti.filter(a => a.id === attivo));
  for (const aspetto of ordineApplicazione) {
    const riga = modal.locator('.gatto-riga', { hasText: aspetto.nome });
    await riga.getByRole('button', { name: 'Applica', exact: true }).click();
    await page.waitForFunction(skin => G.gatto.skin === skin, aspetto.id);
    await salvaEAfferma(page, salvataggio, aspetto.id, posseduti, `${nomeVista}: applicazione ${aspetto.nome}`);
    attivo = aspetto.id;
  }
  return { attivo, posseduti };
}

async function verificaRiapertura(page, nomeVista, attivo, posseduti) {
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('#landing').waitFor({ state: 'visible' });
  await page.locator('.lp-continue').first().click();
  await page.locator('.sinc-scelta').first().click();
  await page.waitForFunction(skin => window.G && G.inGioco && G.gatto.skin === skin, attivo);

  const gatto = await page.evaluate(() => ({ skin: G.gatto.skin, aspetti: G.gatto.aspetti.slice() }));
  verifica(gatto.skin === attivo, `${nomeVista}: la partita riaperta perde l'aspetto applicato.`);
  verifica(posseduti.every(id => gatto.aspetti.includes(id)), `${nomeVista}: la partita riaperta perde un aspetto adottato.`);
}

async function verificaVista(browser, url, vista) {
  const context = await browser.newContext({ baseURL: url, viewport: vista.viewport });
  await context.addInitScript(() => localStorage.setItem('fioralba_lingua', 'it'));
  const salvataggio = await fingiPartite(context);
  const page = await context.newPage();
  const errori = [];
  page.on('pageerror', errore => errori.push(errore.message));

  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('#landing').waitFor({ state: 'visible' });
    const aspetti = await aspettiDelGioco(page);
    for (const aspetto of aspetti)
      await scegliEAvvia(page, salvataggio, vista.nome, aspetto);
    const iniziale = aspetti[0];
    await scegliEAvvia(page, salvataggio, vista.nome, iniziale);
    const statoBruno = await verificaBruno(page, salvataggio, vista.nome, aspetti, iniziale);
    await verificaRiapertura(page, vista.nome, statoBruno.attivo, statoBruno.posseduti);
    errorePagina(vista.nome, errori);
    console.log(`✓ ${vista.nome}: tutti gli aspetti scelti, adottati, applicati e riaperti`);
  } finally {
    await context.close();
  }
}

async function principale() {
  const percorsoBrowser = trovaBrowser();
  verifica(
    percorsoBrowser,
    'Chromium non trovato. Esegui "npm run test:browser:install" oppure dichiara CHROMIUM_PATH.',
  );

  const server = await avviaServerSeServe();
  const browser = await chromium.launch({
    headless: true,
    executablePath: percorsoBrowser,
    args: ['--no-sandbox'],
  });

  try {
    for (const vista of VISTE) await verificaVista(browser, server.url, vista);
  } finally {
    await browser.close();
    await server.ferma();
  }
}

principale().catch(errore => {
  console.error(`\nTest browser degli aspetti del gatto non riuscito:\n${errore.stack || errore.message}`);
  process.exitCode = 1;
});