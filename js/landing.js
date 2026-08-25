/* ===================================================================
   FIORALBA — landing.js
   La pagina di presentazione.

   Regola che ci siamo dati: niente immagini finte e niente screenshot.
   Tutto quello che si vede qui — le scenette animate, le icone degli
   oggetti, gli abitanti che camminano — è disegnato dal gioco stesso,
   con le stesse funzioni che disegnano la partita. Costa zero byte di
   download, e non può mai mostrare una versione vecchia del gioco.
   =================================================================== */
(function(){
'use strict';

const L = {};
window.LANDING = L;

const $ = s=>document.querySelector(s);

let raf = null;
let vivo = false;
let graficaPronta = false;

function chiaviGraficaLanding(){
  const chiavi = ['terreni'];
  const aggiungi = (elenco,prefisso)=>{
    for(const id of Object.keys(elenco||{})) chiavi.push((prefisso||'')+id);
  };
  aggiungi(DATA.VEGETAZIONE,'veg:');
  aggiungi(DATA.NPC_FOGLI,'npc:');
  aggiungi(DATA.EDIFICI,'ed:');
  /* Servono solo le icone effettivamente presenti nelle card, non tutta la
     libreria degli oggetti di gioco. */
  for(const id of new Set(COSE.map(c=>c.ico))) chiavi.push('icona:'+id);
  return chiavi;
}

/* ------------------------------------------------------------------
   1. LE COSE CHE SI FANNO — icone vere, non emoji
   ------------------------------------------------------------------ */
const COSE = [
  { ico:'zappa', tit:'Coltiva ogni stagione',
    txt:'Zappa, semina, annaffia, raccogli. Ogni stagione ha le sue colture, e quelle fuori stagione appassiscono: il calendario conta.' },
  { ico:'canna', tit:'Pesca ovunque',
    txt:'Dal fiume del paese al lago del bosco, fino al mare aperto della Costa. Certi pesci escono solo dopo il tramonto.' },
  { ico:'piccone', tit:'Scendi nella miniera',
    txt:'Rompi le rocce e scendi di livello in livello. Più vai in profondità, più le gemme si fanno rare.' },
  { ico:'legna', tit:'Costruisci il podere',
    txt:'Pollaio, serra, silo, ampliamento della casa. Ogni costruzione cambia quello che puoi fare il giorno dopo.' },
  { ico:'botte', tit:'Trasforma il raccolto',
    txt:'Barattoliera, botte, forno, fornace, arnia. L\'uva cruda vale 76 monete; il vino ne vale 228.' },
  { ico:'miele', tit:'Fatti voler bene',
    txt:'Parla ogni giorno, indovina i regali giusti e sblocca due storie: la torta di Nonna Ilde e il Pesce Luna.' },
  { ico:'medaglione', tit:'Richieste e sagre',
    txt:'La bacheca del porto, le sagre di stagione, il mercante che passa ogni sette giorni, i traguardi da riscuotere.' },
  { ico:'brace_primavera', tit:'Riaccendi la Lanterna',
     txt:'Quattro braci da accendere, una per stagione. È la storia che tiene insieme tutto il resto.' },
  { ico:'zappa', tit:'Cresci a modo tuo',
     txt:'Coltivazione, raccolta, estrazione, pesca e caccia salgono di livello. Ogni livello porta un bonus e un premio; le prime quattro abilità offrono anche una specializzazione al livello 3.' },
  { ico:'canna', tit:'Dopo la Lanterna',
     txt:'Quando la veglia finisce, la valle non si ferma: la bacheca apre progetti comunitari, Elio rimette in acqua la barca e una breve rotta porta alla Cala delle Reti.' },
  { ico:'pietra', tit:'Osserva la marea',
     txt:'Sulla costa c’è un piccolo enigma ambientale. Guarda l’acqua, segui l’ordine dei segni e fai avanzare la storia senza combattimenti né penalità severe.' }
];

/* La stessa icona che disegnano tutte le altre finestre, e non una copia
   locale: era una copia, con la tela da 32 scritta a mano, e il giorno
   che qui fosse finito un attrezzo disegnato a mano ne sarebbe entrato
   l'angolo in alto a sinistra. Oggi in elenco ci sono solo braci e
   raccolti, quindi non si sarebbe visto niente — che è il modo in cui
   questi difetti aspettano.

   Il try resta: qui gli id li scrive a mano l'elenco qui sopra, e uno
   sbagliato deve dare una riga senza figurina, non una pagina di
   presentazione a metà. */
function iconaGrande(id, lato){
  try{ return UI.ico(id, lato); }
  catch(e){ return document.createElement('canvas'); }
}

function costruisciCose(){
  const box = $('#landing .lp-features');
  if(!box) return;
  box.innerHTML = '';
  for(const c of COSE){
    const card = document.createElement('div'); card.className = 'lp-card';
    const ico  = document.createElement('div'); ico.className = 'lp-ico';
    ico.appendChild(iconaGrande(c.ico, 44));
    const h    = document.createElement('h3'); h.textContent = c.tit;
    const p    = document.createElement('p');  p.textContent = c.txt;
    card.appendChild(ico); card.appendChild(h); card.appendChild(p);
    box.appendChild(card);
  }
}

/* ------------------------------------------------------------------
   2. GLI ABITANTI — gli sprite veri, che camminano
   ------------------------------------------------------------------ */
const RITRATTI = [];
let aggiornaGraficaTimer = null;

function costruisciGente(){
  const box = $('#landing .lp-gente');
  if(!box || !window.DATA) return;
  box.innerHTML = '';
  RITRATTI.length = 0;

  for(const id in DATA.NPCS){
    const N = DATA.NPCS[id];
    if(!N.look || N.look.spirito) continue;      // Fiammella resta una sorpresa

    const card = document.createElement('div'); card.className='lp-tizio';

    const c = document.createElement('canvas');
    /* I fogli nuovi degli abitanti sono 96×112: la tela conserva una
       densità doppia per la carta della landing, senza rimpicciarli al
       vecchio omino generato in codice. */
    c.width = 144; c.height = 168;
    c.className = 'lp-tizio-sprite';
    card.appendChild(c);

    const info = document.createElement('div'); info.className='lp-tizio-info';
    const nome = document.createElement('div'); nome.className='lp-tizio-nome'; nome.textContent = N.nome;
    const ruolo= document.createElement('div'); ruolo.className='lp-tizio-ruolo'; ruolo.textContent = N.ruolo;
    const bat  = document.createElement('p');   bat.className='lp-tizio-battuta';
    bat.textContent = '«' + (N.battute && N.battute[0] ? N.battute[0] : '') + '»';
    info.appendChild(nome); info.appendChild(ruolo); info.appendChild(bat);
    card.appendChild(info);
    box.appendChild(card);

    RITRATTI.push({ ctx:c.getContext('2d'), id, look:N.look, fase:Math.random()*4000 });
  }
  for(const r of RITRATTI) r.ctx.imageSmoothingEnabled = false;
}

/* i personaggi camminano sul posto: quattro fotogrammi, ogni 180 ms */
function animaGente(t){
  for(const r of RITRATTI){
    const f = (((t + r.fase)/180)|0) % 4;
    let modernoSp, sp;
    try{
      modernoSp = ART.npcSprite(r.id, 0, f);
      sp = modernoSp || ART.charSprite(r.look, 0, f);
    }catch(e){ continue; }
    const moderno = !!modernoSp;
    const scala = moderno ? 1.5 : 2;
    const w = Math.round(sp.width*scala), h = Math.round(sp.height*scala);
    r.ctx.clearRect(0,0,144,168);
    r.ctx.drawImage(sp, 0, 0, sp.width, sp.height, ((144-w)/2)|0, 168-h, w, h);
  }
}

/* ------------------------------------------------------------------
   3. LA VALLE

   Qui c'erano quattro scenette animate a schede: sceglievi «Coltivare»,
   guardavi un'animazione di quattro fotogrammi, sceglievi la scheda
   dopo, ricominciavi. Per capire quattro cose dovevi fare quattro
   scelte e aspettare quattro volte — e nel frattempo il resto della
   pagina stava fermo ad aspettare te.

   Adesso i posti si vedono tutti insieme e non si muove niente: sei
   ritagli delle mappe vere, presi da `WORLD.crea()` e disegnati con le
   stesse funzioni che disegnano la partita. Regola della pagina
   rispettata — niente immagini finte — ma senza chiedere niente a chi
   guarda.
   ------------------------------------------------------------------ */
/* Le inquadrature non sono a occhio: ho fatto scorrere tutte le finestre
   possibili di ogni mappa e preso quella che pesa di più — varietà di
   terreno, roba da guardare, edifici, acqua — con un vincolo per posto:
   il paese deve mostrare almeno due case, la miniera non può contenere
   un filo d'erba, la costa deve avere il mare. Scegliendo a occhio era
   venuto un muro al posto del podere, il prato fuori al posto della
   miniera e un angolo di sabbia vuota al posto del mare. */
const POSTI = [
  { mappa:'podere',   x:5,  y:1,  st:'primavera', nome:'Il podere',
    txt:'Quello di tua nonna. Campo, frutteto, stagno e un angolo lasciato al suo destino.' },
  { mappa:'fioralba', x:28, y:22, st:'primavera', nome:'Il paese',
    txt:'Bottega, fucina, locanda. Ci si entra davvero, e dentro c\'è gente che ha i suoi orari.' },
  { mappa:'bosco',    x:19, y:0,  st:'estate',    nome:'Il bosco',
    txt:'Alberi, funghi e il lago. Da qualche parte, in fondo, un santuario spento.' },
  { mappa:'grotta',   x:19, y:3,  st:'estate',    nome:'La miniera',
    txt:'Tre livelli che scendono. Più vai giù, più le pietre diventano interessanti.' },
  { mappa:'montagna', x:11, y:32, st:'inverno',   nome:'Il Passo',
    txt:'Neve tutto l\'anno, e un vecchio che ci vive apposta. È lui che insegna la caccia.' },
  { mappa:'spiaggia', x:31, y:17, st:'estate',    nome:'La Costa',
    txt:'Mare aperto e un molo. I pesci grossi stanno qui, e certi escono solo di notte.' }
];

const LARGO = 9, ALTO = 6;        // caselle del ritaglio
const TT = 64;                    // la casella del mondo
const K = 2;                      // quanto il mondo è più fitto della casella da 32

/* Disegna un ritaglio di mappa vera: il terreno, e sopra le cose che
   danno il carattere a un posto — alberi, sassi, cespugli, edifici. */
function ritaglio(m, x0, y0, stag){
  const c = document.createElement('canvas');
  c.width = LARGO*TT; c.height = ALTO*TT;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;

  for(let j=0;j<ALTO;j++) for(let i=0;i<LARGO;i++){
    const gx = x0+i, gy = y0+j;
    if(!WORLD.dentro(m,gx,gy)) continue;
    const t = WORLD.terreno(m,gx,gy);
    if(t === 'vuoto') continue;
    /* La roccia della miniera non è un pavimento: nel gioco la disegna
       il muro, non `ART.ground` — che infatti non la conosce e ripiega
       sull'erba. Nel ritaglio della miniera spuntava un prato dentro la
       montagna. */
    if(t === 'roccia'){
      const R = PAL.c.roccia;
      ART.px(x, i*TT, j*TT, TT, TT, R.corpo);
      ART.px(x, i*TT, j*TT, TT, 3*K, R.corpoChiaro);
      for(let k=0;k<5;k++){
        const bx = i*TT + ((ART.hsh(gx,gy+k,71)*TT)|0);
        const by = j*TT + ((ART.hsh(gx+k,gy,72)*TT)|0);
        ART.px(x, bx, by, 3*K, 2*K, ART.hsh(k,gx+gy,73)>0.5 ? R.strato : R.faccia);
      }
      continue;
    }
    const img = t==='acqua' ? ART.water(stag, 0)
                            : ART.ground(t, (gx*7+gy*13)&3, stag);
    x.drawImage(img, i*TT, j*TT);
  }
  // gli edifici per primi: stanno dietro a tutto il resto
  for(const e of (m.edifici||[])){
    if(e.x+e.w < x0 || e.x > x0+LARGO || e.y+e.h < y0 || e.y > y0+ALTO) continue;
    /* Stessa priorità del renderer: la facciata disegnata a mano, se
       disponibile, e la versione procedurale solo come rete di sicurezza. */
    const img = ART.edificio(e.kind, e.liv||0, stag==='inverno') ||
                ART.building(e.kind, { season:stag, liv:e.liv||0 });
    const w = e.w*TT, sc = w/img.width;
    x.drawImage(img, (e.x-x0)*TT, (e.y+e.h-y0)*TT - img.height*sc, w, img.height*sc);
  }
  for(let j=0;j<ALTO;j++) for(let i=0;i<LARGO;i++){
    const gx = x0+i, gy = y0+j;
    if(!WORLD.dentro(m,gx,gy)) continue;
    const o = m.obj[WORLD.idx(m,gx,gy)];
    if(!o) continue;
    const v = (gx*7+gy*13)&3;
    let img = null, dy = 0;
    if(o.t==='albero'){ img = ART.tree(o.kind, stag, o.stage, v); dy = -img.height+TT+2*K; }
    else if(o.t==='ceppo'){ img = ART.stump(v); dy = -img.height+TT+2*K; }
    else if(o.t==='sasso'){ img = ART.rock(o.kind, v); dy = -img.height+TT+2*K; }
    else if(o.t==='cespuglio'){ img = ART.bush(stag, v, o.bacche); dy = -img.height+TT+2*K; }
    if(img) x.drawImage(img, (i*TT)-((img.width-TT)>>1), j*TT+dy);
  }
  return c;
}

function costruisciValle(){
  const host = $('#landing .lp-valle');
  if(!host || !window.WORLD || !window.ART) return;
  host.innerHTML = '';
  let maps;
  try{ maps = WORLD.crea(); }catch(e){ return; }

  for(const p of POSTI){
    const m = maps[p.mappa];
    if(!m) continue;
    const card = document.createElement('div'); card.className = 'lp-posto';
    const cornice = document.createElement('div'); cornice.className = 'lp-posto-vista';
    try{ cornice.appendChild(ritaglio(m, p.x, p.y, p.st)); }catch(e){ continue; }
    card.appendChild(cornice);
    const testo = document.createElement('div'); testo.className = 'lp-posto-testo';
    testo.innerHTML = '<h3>'+p.nome+'</h3><p>'+p.txt+'</p>';
    card.appendChild(testo);
    host.appendChild(card);
  }
}

/* Le immagini della grafica aggiornata arrivano in modo asincrono. La
   landing aspetta esclusivamente ciò che mostra, non l'intero catalogo
   scaricato per la partita: in questo modo le sue sezioni compaiono insieme
   senza attendere arredi, animali o pannelli ancora invisibili. */
function aggiornaGraficaQuandoPronta(tentativo){
  if(!vivo || !window.IMG || !IMG.stato) return;
  const stato = IMG.stato(chiaviGraficaLanding());
  if(stato.inVolo && tentativo < 30){
    aggiornaGraficaTimer = setTimeout(()=>aggiornaGraficaQuandoPronta(tentativo+1), 180);
    return;
  }
  /* Le icone e i ritagli non devono mostrare prima la versione procedurale
     per poi cambiare sotto gli occhi di chi legge. Si ricostruiscono una
     sola volta, quando il precaricamento ha finito: durante l'attesa la
     sezione resta vuota, non vecchia. */
  graficaPronta = true;
  costruisciCose();
  costruisciGente();
  costruisciValle();
}

/* ------------------------------------------------------------------
   4. COMPARSA A SCORRIMENTO
   ------------------------------------------------------------------ */
function collegaComparsa(){
  const sezioni = document.querySelectorAll('#landing .lp-riv');
  if(!('IntersectionObserver' in window)){
    sezioni.forEach(s=>s.classList.add('visto'));
    return;
  }
  const oss = new IntersectionObserver((voci)=>{
    for(const v of voci){
      if(v.isIntersecting){ v.target.classList.add('visto'); oss.unobserve(v.target); }
    }
  }, { threshold:0.12, root:$('#landing .lp-scroll') });
  sezioni.forEach(s=>oss.observe(s));
}

/* ------------------------------------------------------------------
   COS'È CAMBIATO
   L'anteprima in fondo alla pagina mostra le prime tre voci dell'ultima
   versione; il resto sta nella finestra, che si costruisce una volta
   sola alla prima apertura.
   ------------------------------------------------------------------ */
const ETICHETTA = { nuovo:'Nuovo', meglio:'Migliorato', fix:'Corretto' };

/* La carta in fondo alla pagina mostrava la voce più recente del
   changelog sempre in italiano, anche premendo «English»: si cambiava
   lingua e restava lì un blocco che parlava un'altra lingua, sotto al
   pulsante appena premuto. Si traduce **solo la versione in cima** —
   quella che si vede senza aprire niente. L'archivio resta nella lingua
   in cui è stato scritto: sono diciassettemila caratteri di storia
   vecchia, e tradurli vorrebbe dire tenerli tradotti per sempre. */
const T = s => (window.LINGUA ? LINGUA.t(s) : s);
const F = (m, ...p)=> window.LINGUA ? LINGUA.f(m, ...p) : m.replace(/\{(\d+)\}/g, (_,i)=>p[i]);

function pallino(tipo){
  const s = document.createElement('span');
  s.className = 'ch-dot ' + (ETICHETTA[tipo] ? tipo : 'meglio');
  s.title = T(ETICHETTA[tipo] || 'Migliorato');
  return s;
}

function costruisciChangelog(){
  const dati = window.CHANGELOG;
  const box = $('#chlog-body');
  if(!dati || !dati.length || !box) return;

  const ultima = dati[0];
  const tag = $('#chlog-ver'), tit = $('#chlog-tit'), sub = $('#chlog-sub');
  if(tag) tag.textContent = 'v' + ultima.v;
  if(tit) tit.textContent = T(ultima.titolo);
  if(sub) sub.textContent = F('Ultimo aggiornamento · {0}', T(ultima.data));

  const ante = $('#chlog-anteprima');
  if(ante){
    ante.innerHTML = '';
    for(const v of ultima.voci.slice(0,3)){
      const li = document.createElement('li');
      li.appendChild(pallino(v.tipo));
      const t = document.createElement('span'); t.textContent = T(v.t);
      li.appendChild(t);
      ante.appendChild(li);
    }
    if(ultima.voci.length > 3){
      const li = document.createElement('li');
      li.style.color = 'var(--ink-soft)';
      li.style.paddingLeft = '19px';
      /* con una voce sola diceva «…e altre 1 cose.»: capita ogni volta
         che una versione ne ha esattamente quattro, e non è raro */
      const resto = ultima.voci.length - 3;
      li.textContent = resto === 1 ? T('…e un\'altra cosa.') : F('…e altre {0} cose.', resto);
      ante.appendChild(li);
    }
  }

  box.innerHTML = '';
  dati.forEach((ver, i)=>{
    const sez = document.createElement('section'); sez.className = 'ch-ver';
    const testa = document.createElement('div'); testa.className = 'ch-ver-testa';
    /* solo la prima: il resto è archivio e resta com'è stato scritto */
    const tr = i === 0 ? T : (x => x);
    const n = document.createElement('span'); n.className = 'ch-ver-n'; n.textContent = F('Versione {0}', ver.v);
    const d = document.createElement('span'); d.className = 'ch-ver-data'; d.textContent = tr(ver.data);
    testa.appendChild(n); testa.appendChild(d);
    sez.appendChild(testa);
    const st = document.createElement('p'); st.className = 'ch-ver-tit'; st.textContent = tr(ver.titolo);
    sez.appendChild(st);
    for(const v of ver.voci){
      const riga = document.createElement('div'); riga.className = 'ch-voce';
      riga.appendChild(pallino(v.tipo));
      const testo = document.createElement('div');
      const t = document.createElement('div'); t.className = 'ch-voce-t'; t.textContent = tr(v.t);
      const dd = document.createElement('div'); dd.className = 'ch-voce-d'; dd.textContent = tr(v.d);
      testo.appendChild(t); testo.appendChild(dd);
      riga.appendChild(testo);
      sez.appendChild(riga);
    }
    box.appendChild(sez);
    if(i < dati.length-1){
      const sep = document.createElement('div'); sep.className = 'ch-sep';
      box.appendChild(sep);
    }
  });
}

let chiusuraChangelog = null;
function apriChangelog(){
  const wrap = $('#chlog-wrap');
  if(!wrap) return;
  wrap.classList.remove('hidden');
  $('#chlog-body').scrollTop = 0;
  const chiudi = ()=>{
    wrap.classList.add('hidden');
    document.removeEventListener('keydown', suTasto);
    chiusuraChangelog = null;
  };
  const suTasto = e => { if(e.key === 'Escape'){ e.stopPropagation(); chiudi(); } };
  document.addEventListener('keydown', suTasto);
  chiusuraChangelog = chiudi;
  const bottone = $('#chlog-close');
  if(bottone) bottone.focus();
}

function collegaChangelog(){
  const apri = $('#chlog-apri'), wrap = $('#chlog-wrap'), chiudi = $('#chlog-close');
  if(!apri || !wrap) return;
  costruisciChangelog();
  apri.onclick = apriChangelog;
  if(chiudi) chiudi.onclick = ()=>{ if(chiusuraChangelog) chiusuraChangelog(); };
  // il velo fuori dal riquadro chiude, il riquadro no
  wrap.onclick = e => { if(e.target === wrap && chiusuraChangelog) chiusuraChangelog(); };
}

/* ------------------------------------------------------------------
   AVVIO E ARRESTO
   ------------------------------------------------------------------ */
function ciclo(t){
  if(!vivo) return;
  animaGente(t);
  raf = requestAnimationFrame(ciclo);
}

/* Il pulsante della lingua sulla barra: mostra quella in cui NON sei,
   perché è quella su cui si clicca. Con due lingue è un interruttore;
   se un giorno diventano tre, qui ci vuole un elenco. */
function collegaLingua(){
  const b = $('#lp-lingua');
  if(!b || !window.LINGUA || LINGUA.elenco.length < 2){ if(b) b.remove(); return; }
  const disegna = ()=>{
    const altra = LINGUA.elenco.find(l => l.id !== LINGUA.attiva);
    b.textContent = altra.bandiera + ' ' + altra.nome;
    b.title = 'Cambia lingua';
  };
  b.onclick = ()=>{
    const altra = LINGUA.elenco.find(l => l.id !== LINGUA.attiva);
    LINGUA.set(altra.id);
    disegna();
    // la valle, le schede e il changelog sono già impaginati in italiano
    if(graficaPronta) costruisciCose();
    costruisciGente(); costruisciChangelog();
  };
  LINGUA.suCambio(disegna);
  disegna();
}

L.init = function(){
  const lp = $('#landing');
  if(!lp || lp.classList.contains('hidden')) return;
  costruisciGente();
  /* La valle viene montata dal primo passaggio completato di
     `aggiornaGraficaQuandoPronta`, non con i fallback del primo fotogramma. */
  collegaLingua();
  collegaChangelog();
  collegaComparsa();
  vivo = true;
  raf = requestAnimationFrame(ciclo);
  aggiornaGraficaTimer = setTimeout(()=>aggiornaGraficaQuandoPronta(0), 120);
};

/* Quando parte la partita la pagina sparisce: tutto quello che animava
   va spento, altrimenti resta a girare a vuoto per tutta la sessione
   rubando fotogrammi al gioco. */
L.ferma = function(){
  vivo = false;
  if(raf){ cancelAnimationFrame(raf); raf = null; }
  if(aggiornaGraficaTimer){ clearTimeout(aggiornaGraficaTimer); aggiornaGraficaTimer = null; }
  // se la partita comincia con il changelog aperto, va chiuso: resterebbe
  // sospeso sopra al gioco, e il suo Escape mangerebbe quello del menu
  if(chiusuraChangelog) chiusuraChangelog();
};

})();
