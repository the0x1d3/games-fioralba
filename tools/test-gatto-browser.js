/*
 * Verifica nel browser i percorsi completi degli aspetti del gatto e
 * dell'editor interno di scenografia.
 *
 * Uso:
 *   npm run test:browser
 *
 * Per usare un Chromium di sistema, dichiararlo così:
 *   CHROMIUM_PATH=/percorso/a/chromium npm run test:browser
 *
 * Senza TEST_BASE_URL il test avvia server.js in sviluppo su una porta
 * temporanea.
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
  const processo = spawn(process.execPath, ['server.js', '--sviluppo'], {
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
  const stato = { versione: 0, dati: null, salvataggi: [], put: 0 };

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
      stato.put += 1;
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

async function nuovaPartitaEditor(page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('#landing').waitFor({ state: 'visible' });
  await page.locator('.lp-new').first().click();
  const modal = page.locator('#modal-wrap');
  await modal.locator('.imp-nome-inp').waitFor({ state: 'visible' });
  await modal.locator('.imp-nome-inp').fill('Prova editor');
  await modal.getByRole('button', { name: 'Ho segnato il codice, si comincia', exact: true }).click();
  await page.waitForFunction(() => window.G && G.inGioco && window.EDITOR_INTERNO);
  await page.evaluate(() => {
    G.tutorialFatto = true;
    G.serie.daPrendere = 0;
  });
  await page.waitForTimeout(1_000);
  await page.evaluate(() => {
    UI.chiudiModal(true);
    const lettera = document.querySelector('#letter');
    if (!lettera.classList.contains('hidden')) lettera.querySelector('.letter-btn').click();
  });
}

async function clicCasella(page, x, y) {
  const punto = await page.evaluate(({ x, y }) => {
    const canvas = document.querySelector('#game');
    const r = canvas.getBoundingClientRect();
    const p = REND.mondoASchermo((x + 0.5) * 64, (y + 0.5) * 64, G.cam);
    return { x: p.x, y: p.y, larghezza: r.width, altezza: r.height };
  }, { x, y });
  verifica(
    punto.x >= 0 && punto.y >= 0 && punto.x < punto.larghezza && punto.y < punto.altezza,
    `La casella (${x}, ${y}) non è visibile nel canvas.`,
  );
  await page.locator('#game').click({ position: { x: punto.x, y: punto.y } });
}

async function inquadraCasella(page, giocatoreX, giocatoreY, x, y) {
  await page.evaluate(({ giocatoreX, giocatoreY }) => {
    G.p.px = (giocatoreX + 0.5) * 64;
    G.p.py = (giocatoreY + 0.5) * 64;
  }, { giocatoreX, giocatoreY });
  await page.waitForTimeout(850);
  await page.waitForFunction(({ x, y }) => {
    const canvas = document.querySelector('#game').getBoundingClientRect();
    const pannello = document.querySelector('#editor-interno').getBoundingClientRect();
    const p = REND.mondoASchermo((x + 0.5) * 64, (y + 0.5) * 64, G.cam);
    const sx = canvas.left + p.x, sy = canvas.top + p.y;
    const sopraPannello = sx >= pannello.left && sx <= pannello.right
      && sy >= pannello.top && sy <= pannello.bottom;
    return p.x >= 0 && p.x < canvas.width && p.y >= 0 && p.y < canvas.height && !sopraPannello;
  }, { x, y });
}

async function verificaControlloMobile(page, selettore, nome) {
  const controllo = page.locator(selettore);
  verifica(await controllo.isVisible(), `mobile: ${nome} non è visibile.`);
  verifica(await controllo.isEnabled(), `mobile: ${nome} non è utilizzabile.`);
  const riquadro = await controllo.boundingBox();
  verifica(
    riquadro
      && riquadro.width >= 44
      && riquadro.height >= 44
      && riquadro.x >= 0
      && riquadro.y >= 0
      && riquadro.x + riquadro.width <= page.viewportSize().width
      && riquadro.y + riquadro.height <= page.viewportSize().height,
    `mobile: ${nome} non ha un’area touch visibile (${JSON.stringify(riquadro)}).`,
  );
}

async function verificaEditor(browser, url, vista) {
  const context = await browser.newContext({
    baseURL: url,
    viewport: vista.viewport,
    acceptDownloads: true,
  });
  await context.addInitScript(() => localStorage.setItem('fioralba_lingua', 'it'));
  const salvataggio = await fingiPartite(context);
  const page = await context.newPage();
  const errori = [];
  page.on('pageerror', errore => errori.push(errore.message));

  try {
    await nuovaPartitaEditor(page);
    verifica(
      await page.evaluate(() => window.FIORALBA_MODIFICA_INTERNA === true && !!window.EDITOR_INTERNO),
      'Editor interno non disponibile: il server di prova deve essere in modalità sviluppo.',
    );
    const putPrima = salvataggio.put;

    await page.evaluate(() => EDITOR_INTERNO.apri());
    await page.locator('#editor-interno').waitFor({ state: 'visible' });
    await inquadraCasella(page, 2, 10, 3, 10);
    await clicCasella(page, 3, 10);
    await page.locator('#editor-dimensioni').waitFor({ state: 'visible' });
    verifica(
      await page.locator('#editor-stato').textContent().then(testo => testo.includes('Selezionato: Bucato')),
      `${vista.nome}: la decorazione regolare non viene selezionata nel canvas.`,
    );

    await page.locator('#editor-larghezza').fill('2');
    await page.locator('#editor-altezza').fill('1');
    if (vista.nome === 'mobile') {
      await verificaControlloMobile(page, '#editor-larghezza', 'larghezza');
      await verificaControlloMobile(page, '#editor-altezza', 'altezza');
      await verificaControlloMobile(page, '#editor-ridimensiona', 'anteprima e applica');
    }
    verifica(
      await page.evaluate(() => {
        const bordo = document.querySelector('#editor-selezione');
        const scala = REND.mondoASchermo(0, 0, G.cam).scala;
        return Math.round(parseFloat(bordo.style.width) / (64 * scala)) === 2
          && Math.round(parseFloat(bordo.style.height) / (64 * scala)) === 1;
      }),
      'La modifica delle misure non mostra l’anteprima della decorazione.',
    );
    await page.locator('#editor-ridimensiona').click();
    verifica(
      await page.evaluate(() => G.mappa().deco.some(d => d.t === 'bucato' && d.x === 3 && d.y === 10 && d.w === 2)),
      'L’applicazione delle dimensioni della decorazione non aggiorna la bozza.',
    );
    const downloadPronto = page.waitForEvent('download');
    await page.locator('#editor-esporta').click();
    const download = await downloadPronto;
    const file = await download.path();
    verifica(file, 'L’esportazione della bozza non ha prodotto un file.');
    const bozza = JSON.parse(fs.readFileSync(file, 'utf8'));
    verifica(
      bozza.mappa === 'podere'
        && bozza.ritocchi.decorazioni.some(d => d.azione === 'rimuovi' && d.da?.t === 'bucato' && d.da.w === 3)
        && bozza.ritocchi.decorazioni.some(d => d.azione === 'aggiungi' && d.decorazione?.t === 'bucato'
          && d.decorazione.w === 2 && d.decorazione.h === 1),
      `${vista.nome}: la bozza esportata non descrive la decorazione ridimensionata.`,
    );
    await page.locator('#editor-esci').click();
    verifica(
      await page.evaluate(() => !EDITOR_INTERNO.attivo()
        && G.maps.podere.deco.some(d => d.t === 'bucato' && d.x === 3 && d.y === 10 && d.w === 3)),
      `${vista.nome}: uscire dall’editor non ripristina la decorazione ridimensionata.`,
    );

    // Verifica che oggetti scenografici (panchina, lampione) siano selezionabili —
    // gli oggetti funzionali restano bloccati, quelli scenografici no.
    await page.evaluate(() => EDITOR_INTERNO.apri());
    await page.locator('#editor-interno').waitFor({ state: 'visible' });
    await inquadraCasella(page, 9, 10, 11, 10);
    await clicCasella(page, 11, 10);
    const msgPanchina = await page.locator('#editor-istruzioni').textContent();
    verifica(
      await page.locator('#editor-sposta').isEnabled(),
      `${vista.nome}: la panchina risulta protetta invece di essere selezionabile. Messaggio: "${msgPanchina}"`,
    );
    await page.locator('#editor-esci').click();

    await page.evaluate(() => {
      G.teletrasporta('piazza');
      EDITOR_INTERNO.apri();
    });
    await page.locator('#editor-interno').waitFor({ state: 'visible' });
    const fontana = await page.evaluate(() => {
      const m = G.mappa();
      const d = m.deco.find(deco => deco.t === 'fontana');
      return {
        x: d?.x,
        y: d?.y,
        w: d?.iw,
        h: d?.ih,
        acqua: d && Array.from({ length: d.ih }, (_, j) =>
          Array.from({ length: d.iw }, (_, i) => WORLD.terreno(m, d.x + i, d.y + j) === 'acqua')).flat().every(Boolean),
      };
    });
    verifica(
      fontana.x === 18 && fontana.y === 14 && fontana.w === 4 && fontana.h === 4 && fontana.acqua,
      `${vista.nome}: la mappa di prova deve contenere una fontana 4×4 sull’acqua.`,
    );
    await inquadraCasella(page, 18, 14, fontana.x, fontana.y);
    await clicCasella(page, fontana.x, fontana.y);
    const diagnosiFontana = await page.evaluate(() => {
      const p = REND.mondoASchermo(18.5 * 64, 14.5 * 64, G.cam);
      return {
        fontana: G.mappa().deco.find(d => d.t === 'fontana'),
        mira: REND.schermoAMondo(p.x, p.y, G.cam),
        camera: G.cam,
        renderer: REND.info(),
      };
    });
    verifica(
      await page.locator('#editor-sposta').isEnabled(),
      `${vista.nome}: la selezione della fontana non è riuscita: ${await page.locator('#editor-istruzioni').textContent()} (${JSON.stringify(diagnosiFontana)})`,
    );
    if (vista.nome === 'mobile')
      await verificaControlloMobile(page, '#editor-sposta', 'sposta');
    await page.getByRole('button', { name: 'Sposta', exact: true }).click();
    await inquadraCasella(page, 32, 9, 35, 7);
    await clicCasella(page, 35, 7);
    const fontanaSpostata = await page.evaluate(() => {
      const m = G.mappa();
      const fontana = m.deco.find(d => d.t === 'fontana');
      const tutte = (x, y, tipo) => Array.from({ length: 4 }, (_, j) =>
          Array.from({ length: 4 }, (_, i) => m.obj[WORLD.idx(m, x + i, y + j)]?.t === tipo)
            .every(Boolean)).every(Boolean);
      const acqua = fontana && Array.from({ length: 4 }, (_, j) =>
        Array.from({ length: 4 }, (_, i) => WORLD.terreno(m, fontana.x + i, fontana.y + j) === 'acqua')
          .every(Boolean)).every(Boolean);
      const origineLibera = Array.from({ length: 4 }, (_, j) =>
        Array.from({ length: 4 }, (_, i) => !m.obj[WORLD.idx(m, 18 + i, 14 + j)]).every(Boolean)).every(Boolean);
      return {
        x: fontana?.x,
        y: fontana?.y,
        collisioni: fontana && tutte(fontana.x, fontana.y, 'fontana'),
        acqua,
        origineLibera,
      };
    });
    verifica(
      (fontanaSpostata.x !== 18 || fontanaSpostata.y !== 14)
        && fontanaSpostata.collisioni && fontanaSpostata.acqua && fontanaSpostata.origineLibera,
      `${vista.nome}: la fontana non sposta insieme tutte le 16 collisioni su una zona d’acqua libera.`,
    );

    await page.locator('#editor-annulla').click();
    verifica(
      await page.evaluate(() => {
        const m = G.mappa();
        const fontana = m.deco.find(d => d.t === 'fontana');
        return fontana?.x === 18 && fontana?.y === 14
          && Array.from({ length: 4 }, (_, j) =>
            Array.from({ length: 4 }, (_, i) => m.obj[WORLD.idx(m, 18 + i, 14 + j)]?.t === 'fontana')
              .every(Boolean)).every(Boolean);
      }),
      `${vista.nome}: annulla non ripristina la fontana e le sue collisioni.`,
    );

    await page.locator('#editor-esci').click();
    verifica(
      await page.evaluate(() => {
        const m = G.maps.piazza;
        const fontana = m.deco.find(d => d.t === 'fontana');
        return !EDITOR_INTERNO.attivo()
          && fontana?.x === 18 && fontana?.y === 14;
      }),
      `${vista.nome}: uscire dall’editor lascia modifiche nella mappa di gioco.`,
    );
    await page.waitForTimeout(100);
    verifica(
      salvataggio.put === putPrima,
      `${vista.nome}: l’editor ha emesso ${salvataggio.put - putPrima} salvataggi PUT mentre era aperto.`,
    );
    errorePagina(`editor interno ${vista.nome}`, errori);
    console.log(`✓ editor interno ${vista.nome}: selezione, anteprima, fontana, annulla, export e nessun salvataggio`);
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
    for (const vista of VISTE) await verificaEditor(browser, server.url, vista);
  } finally {
    await browser.close();
    await server.ferma();
  }
}

principale().catch(errore => {
  console.error(`\nTest browser degli aspetti del gatto non riuscito:\n${errore.stack || errore.message}`);
  process.exitCode = 1;
});