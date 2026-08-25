/* ===================================================================
   FIORALBA — guida.js
   "Primi passi": la lista di obiettivi che accompagna il giocatore dal
   primo risveglio fino alla prima brace del Santuario.

   Il tutorial insegna i comandi nei primi due minuti e poi tace. Questo
   invece resta lì: dice sempre qual è la prossima cosa sensata da fare,
   senza interrompere e senza obbligare a niente. Si spunta da solo
   leggendo lo stato del gioco, quindi funziona anche se il giocatore fa
   le cose in un ordine tutto suo.
   =================================================================== */
(function(){
'use strict';

const GU = {};
window.GUIDA = GU;

const $ = s=>document.querySelector(s);

/* Il titolo del passo va tradotto **prima** di entrare nel modello: da
   dentro non lo guarda più nessuno, e `UI.toast` riceveva «✔ Passa la
   prima notte» già montato — chiave che nel catalogo non c'è, mentre il
   titolo da solo sì. Risultato: la spunta dei primi passi in inglese
   restava in italiano. Come `fraseF` in game.js. */
function fraseF(modello, ...pezzi){
  return window.LINGUA ? LINGUA.f(modello, ...pezzi)
                       : modello.replace(/\{(\d+)\}/g, (_,i)=>pezzi[i]);
}
function frase(testo){
  return window.LINGUA ? LINGUA.t(testo) : testo;
}

/* ------------------------------------------------------------------
   I PASSI
   `fatto(G)` legge lo stato: nessun passo ha bisogno di essere
   "attivato", quindi l'ordine in cui il giocatore li compie non conta.
   ------------------------------------------------------------------ */
const PASSI = [
  { id:'dormi', icona:'lanterna', demo:'coltiva',
    titolo:'Passa la prima notte',
    come:'Le piante crescono mentre dormi. La casa è in alto a sinistra nel podere: mettiti davanti alla porta e premi <kbd>E</kbd>.',
    fatto: G => (G.stats.giorniGiocati||0) >= 1 },

  { id:'raccogli', icona:'rapa', demo:'coltiva',
    titolo:'Raccogli il primo prodotto',
    come:'Quando una pianta è matura scintilla. Mettiti accanto e premi <kbd>Spazio</kbd> a mani nude — niente attrezzo.',
    fatto: G => (G.stats.raccolti||0) >= 1 },

  { id:'vendi', icona:'cassa', demo:'consegna',
    titolo:'Vendi quello che hai raccolto',
    come:'La <b>cassa di consegna</b> è accanto a casa: lasciaci la roba e la ritirano di notte, pagata all\'alba. Oppure vendila a mano da Bruno.',
    fatto: G => (G.stats.venduto||0) >= 1 },

  { id:'paese', icona:'seme_rapa',
    titolo:'Vai in paese',
    come:'L\'uscita è a <b>est</b> del podere, in fondo al sentiero. A Fioralba trovi la bottega, la fucina e la locanda.',
    fatto: G => !!G.stats.visitatoPaese },

  { id:'legna', icona:'legna',
    titolo:'Abbatti un albero',
    come:'Scegli l\'<b>ascia</b> nella barra e colpisci un tronco più volte. La legna serve praticamente per tutto.',
    fatto: G => (G.stats.alberi||0) >= 1 },

  { id:'amicizia', icona:'miele',
    titolo:'Fai un regalo a un abitante',
    come:'Parla con qualcuno (<kbd>E</kbd>) e scegli <b>“Ho un regalo per te”</b>. Ognuno ha i suoi gusti: indovinare vale il triplo.',
    fatto: G => (G.stats.regali||0) >= 1 },

  { id:'pesca', icona:'canna', demo:'pesca',
    titolo:'Prendi il primo pesce',
    come:'Scegli la <b>canna</b> e usala rivolto verso l\'acqua. Quando abbocca premi <kbd>Spazio</kbd>, poi tienilo premuto per far salire la barra e mantienila sul pesce.',
    fatto: G => (G.stats.pesci||0) >= 1 },

  { id:'bosco', icona:'viola',
    titolo:'Esplora il bosco',
    come:'Si scende a <b>sud</b> del podere. C\'è foraggio da raccogliere e vive <b>Serafina</b>, che della valle sa più di tutti.',
    fatto: G => !!G.stats.visitatoBosco },

  { id:'miniera', icona:'piccone',
    titolo:'Scendi nella miniera',
    come:'A <b>nord</b> del paese. Col <b>piccone</b> spacchi le rocce: pietra, rame, ferro, e più scendi più le gemme sono rare.',
    fatto: G => !!G.stats.visitatoGrotta },

  { id:'ponte', icona:'lingotto_ferro',
    titolo:'Fatti costruire il ponte del bosco',
    come:'Si ordina da <b>Tobia</b>, alla fucina in paese: 3000 monete, 100 legna e 40 pietra. Il ponte nasce da solo dov\'è il <b>burrone</b>, nel bosco: entra da nord, prendi il sentiero che piega a <b>est</b> e poi scendi. È la strada per il Santuario, il cuore della storia.',
    fatto: G => !!G.costruzioni.ponte },

  { id:'brace', icona:'brace_primavera',
    titolo:'Accendi la prima brace',
    come:'Oltre il ponte, nella radura chiusa dal burrone a <b>sud-est del bosco</b>, c\'è il <b>Santuario</b>. Fiammella ti chiede i frutti di una stagione: portali e la Lanterna comincia a riaccendersi.',
    fatto: G => (G.braci||0) >= 1 },

  { id:'quattro', icona:'brace_inverno',
    titolo:'Accendi tutte e quattro le braci',
    come:'Una per stagione, e ognuna vuole cinque cose di quella stagione: si fa in un anno di gioco. La lista sta nel <b>Santuario</b>, e quello che hai già portato resta lì.',
    fatto: G => (G.braci||0) >= 4 },

  { id:'notte', icona:'medaglione',
    titolo:'Scopri perché la Lanterna si è spenta',
    come:'Con le quattro braci accese la Lanterna non tiene: torna da <b>Fiammella</b>, che ti manda a chiedere in giro. Sei abitanti, sei pezzi di quella notte — e per farsi raccontare una cosa così bisogna conoscersi: <b>Bruno</b> a 2 cuori, <b>Marisol</b> ed <b>Elio</b> a 3, <b>Tobia</b> e <b>Oreste</b> a 4, <b>Serafina</b> a 6, perché quella notte c\'era.',
    fatto: G => !!(G.trame && G.trame.veglia && G.trame.veglia.verita) },

  { id:'veglia', icona:'brace_primavera',
    titolo:'La veglia al Santuario',
    come:'Invita tutti e sei alla radura, poi torna al <b>Santuario la sera dopo, dal tramonto</b>. Una lanterna tenuta accesa da una persona sola si spegne la prima notte che quella persona non ce la fa: è successo a Ilde, e non deve succedere a te.',
     fatto: G => !!(G.trame && G.trame.veglia && G.trame.veglia.fatta) },
  { id:'bachecaPostFinale', icona:'medaglione',
     titolo:'Guarda la bacheca dopo la Lanterna',
     come:'La storia continua senza un nuovo nemico: dopo la veglia vai in <b>piazza</b> e cerca la <b>bacheca dei progetti</b>. Elio sta pensando a una barca che possa servire alla valle.',
     fatto: G => !!(G.trame && G.trame.richiamo && G.trame.richiamo.bacheca) },
  { id:'barcaPostFinale', icona:'canna',
     titolo:'Rimetti in acqua la barca',
     come:'Segna il progetto sulla bacheca, parla con <b>Elio</b> e porta avanti la sua vicenda. Quando la marea è pronta, la barca aprirà una rotta breve verso la <b>Cala delle Reti</b>.',
     fatto: G => !!(G.trame && G.trame.richiamo && G.trame.richiamo.barca) },
  { id:'calaPostFinale', icona:'canna',
     titolo:'Scopri la Cala delle Reti',
     come:'Dal molo della <b>Costa</b> sali sulla barca. È una destinazione piccola, fatta per tornare: pesca, posta e nuovi progetti, non un mare infinito da attraversare.',
     fatto: G => G.mappaId === 'cala' || !!(G.trame && G.trame.richiamo && G.trame.richiamo.approdo) }
];

GU.PASSI = PASSI;

/* ------------------------------------------------------------------
   STATO
   ------------------------------------------------------------------ */
let costruito = false;
let firmaPrec = '';
let ultimoControllo = 0;
let fattiPrec = null;

function G(){ return window.G; }

/* quanti passi completati */
function completati(){
  const g = G();
  let n = 0;
  for(const p of PASSI){ try{ if(p.fatto(g)) n++; }catch(e){} }
  return n;
}

function statoPassi(){
  const g = G();
  return PASSI.map(p=>{ try{ return !!p.fatto(g); }catch(e){ return false; } });
}

/* ------------------------------------------------------------------
   COSTRUZIONE DEL PANNELLO
   ------------------------------------------------------------------ */
function costruisci(){
  if(costruito) return;
  const el = $('#guida');
  if(!el) return;
  costruito = true;
  el.querySelector('.gu-head').addEventListener('click', ()=>{
    const g = G();
    g.guidaAperta = !g.guidaAperta;
    SND.play('menu');
    disegna(true);
  });
  el.querySelector('.gu-chiudi').addEventListener('click', e=>{
    e.stopPropagation();
    const g = G();
    g.guidaNascosta = true;
    SND.play('menu');
    UI.toast('Guida nascosta. La riapri dal menu (Esc).');
    disegna(true);
  });
}

/* ------------------------------------------------------------------
   DISEGNO
   ------------------------------------------------------------------ */
function disegna(forza){
  const el = $('#guida');
  if(!el) return;
  const g = G();
  const fatti = statoPassi();
  const n = fatti.filter(Boolean).length;

  // durante il tutorial e la lettera la guida sta zitta: un pannello per volta
  const lettera = $('#letter') && !$('#letter').classList.contains('hidden');
  const nascondi = g.guidaNascosta || n>=PASSI.length ||
                   (window.TUT && TUT.attivo()) || lettera ||
                   !g.inGioco;
  if(nascondi){ el.classList.add('hidden'); return; }
  el.classList.remove('hidden');

  const aperto = g.guidaAperta !== false;
  el.classList.toggle('chiuso', !aperto);

  // ridisegna solo se è cambiato qualcosa
  const firma = fatti.join('')+'|'+(aperto?1:0);
  if(!forza && firma===firmaPrec) return;
  firmaPrec = firma;

  el.querySelector('.gu-prog').textContent = n+'/'+PASSI.length;
  el.querySelector('.gu-barra-fill').style.width = (n/PASSI.length*100)+'%';
  el.querySelector('.gu-toggle').textContent = aperto ? '▾' : '▸';

  const corpo = el.querySelector('.gu-corpo');
  corpo.innerHTML = '';
  if(!aperto) return;

  // i prossimi tre da fare: il primo spiegato, gli altri solo accennati
  const restanti = [];
  for(let i=0;i<PASSI.length && restanti.length<3;i++) if(!fatti[i]) restanti.push(PASSI[i]);

  restanti.forEach((p, k)=>{
    const riga = document.createElement('div');
    riga.className = 'gu-passo' + (k===0 ? ' ora' : '');
    if(k===0 && p.icona && window.ART){
      const ic = document.createElement('span'); ic.className='gu-ico';
      try{ ic.appendChild(UI.ico(p.icona)); }catch(e){}
      riga.appendChild(ic);
    }
    const testo = document.createElement('div'); testo.className='gu-testo';
    testo.innerHTML = '<div class="gu-tit">'+p.titolo+'</div>' +
                      (k===0 ? '<div class="gu-come">'+p.come+'</div>' : '');
    // per i passi che hanno una scenetta: "guarda come si fa"
    if(k===0 && p.demo && window.DEMO && DEMO.esiste(p.demo)){
      const b = document.createElement('button');
      b.className = 'gu-demo';
      b.innerHTML = '▶ guarda come si fa';
      b.onclick = ()=>{ SND.play('menu'); UI.demo(p.demo); };
      testo.appendChild(b);
    }
    riga.appendChild(testo);
    corpo.appendChild(riga);
  });
}

/* ------------------------------------------------------------------
   API
   ------------------------------------------------------------------ */
GU.init = function(){
  costruisci();
  fattiPrec = statoPassi();
  disegna(true);
};

/* chiamata dal ciclo di gioco: controlla di rado, ridisegna solo se serve */
GU.aggiorna = function(){
  if(!costruito) costruisci();
  const ora = performance.now();
  if(ora - ultimoControllo < 400) return;
  ultimoControllo = ora;

  const fatti = statoPassi();
  const nuovi = [];
  if(fattiPrec){
    for(let i=0;i<PASSI.length;i++) if(fatti[i] && !fattiPrec[i]) nuovi.push(PASSI[i]);
  }
  fattiPrec = fatti;
  // due passi possono chiudersi insieme (vendere in paese ne chiude due):
  // un annuncio per ciascuno, ma il messaggio di fine una volta sola
  if(nuovi.length) festeggia(nuovi, fatti.filter(Boolean).length);
  disegna(false);
};

function festeggia(nuovi, completati){
  const g = G();
  if(g.progresso) g.progresso();
  SND.play('livello');
  const el = $('#guida');
  if(el){ el.classList.remove('lampo'); void el.offsetWidth; el.classList.add('lampo'); }

  if(completati >= PASSI.length){
    UI.toast('Primi passi completati: sai muoverti a Fioralba. Da qui in poi guarda il Diario (J).','gold');
    return;
  }
  nuovi.forEach((p,k)=> setTimeout(()=>UI.toast(fraseF('✔ {0}', frase(p.titolo)),'good'), k*450));
}

/* rimette in vista la guida (dal menu) */
GU.mostra = function(){
  const g = G();
  g.guidaNascosta = false;
  g.guidaAperta = true;
  disegna(true);
};
GU.nascondi = function(){
  G().guidaNascosta = true;
  disegna(true);
};
GU.nascosta = function(){ return !!G().guidaNascosta; };
GU.completata = function(){ return completati() >= PASSI.length; };

})();
