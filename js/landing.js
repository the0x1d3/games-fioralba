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

let lettoreDemo = null;
let raf = null;
let vivo = false;

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
    txt:'Quattro braci da accendere, una per stagione. È la storia che tiene insieme tutto il resto.' }
];

function iconaGrande(id, lato){
  const c = document.createElement('canvas');
  c.width = 32; c.height = 32;
  c.style.width = lato+'px'; c.style.height = lato+'px';
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  try{ x.drawImage(ART.icon(id), 0, 0); }catch(e){}
  return c;
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
    c.width = 30*3; c.height = 40*3;
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

    RITRATTI.push({ ctx:c.getContext('2d'), look:N.look, fase:Math.random()*4000 });
  }
  for(const r of RITRATTI) r.ctx.imageSmoothingEnabled = false;
}

/* i personaggi camminano sul posto: quattro fotogrammi, ogni 180 ms */
function animaGente(t){
  for(const r of RITRATTI){
    const f = (((t + r.fase)/180)|0) % 4;
    let sp;
    try{ sp = ART.charSprite(r.look, 0, f); }catch(e){ continue; }
    r.ctx.clearRect(0,0,90,120);
    r.ctx.drawImage(sp, 0, 0, sp.width, sp.height, 0, 0, sp.width*3, sp.height*3);
  }
}

/* ------------------------------------------------------------------
   3. LE SCENETTE — le stesse del "guarda come si fa" dentro al gioco
   ------------------------------------------------------------------ */
function costruisciDemo(){
  const host = $('#landing .lp-demo-host');
  if(!host || !window.DEMO) return;
  if(lettoreDemo) lettoreDemo.ferma();
  lettoreDemo = DEMO.monta(host, 'coltiva');
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
   AVVIO E ARRESTO
   ------------------------------------------------------------------ */
function ciclo(t){
  if(!vivo) return;
  animaGente(t);
  raf = requestAnimationFrame(ciclo);
}

L.init = function(){
  const lp = $('#landing');
  if(!lp || lp.classList.contains('hidden')) return;
  costruisciCose();
  costruisciGente();
  costruisciDemo();
  collegaComparsa();
  vivo = true;
  raf = requestAnimationFrame(ciclo);
};

/* Quando parte la partita la pagina sparisce: tutto quello che animava
   va spento, altrimenti resta a girare a vuoto per tutta la sessione
   rubando fotogrammi al gioco. */
L.ferma = function(){
  vivo = false;
  if(raf){ cancelAnimationFrame(raf); raf = null; }
  if(lettoreDemo){ lettoreDemo.ferma(); lettoreDemo = null; }
};

})();
