/* ===================================================================
   FIORALBA — game.js
   Stato, ciclo di gioco, input, sistemi.
   =================================================================== */
(function(){
'use strict';

const T = 32;
const $ = s=>document.querySelector(s);

const G = {};
window.G = G;

/* La giornata, in energia.

   Era 180, e non bastava: un albero adulto vuole cinque colpi d'ascia da
   4, cioè venti punti, e un edificio chiede fra le cento e le duecento
   legne quando un albero ne dà sette. Facevano nove alberi al giorno, e
   per una sola costruzione ci volevano due giornate passate a spaccare
   legna senza fare altro — che non è il gioco che questo gioco vuole
   essere.

   Adesso la giornata è 260 e il colpo d'ascia o di piccone costa 3
   invece di 4: da nove alberi al giorno a diciassette, cioè una
   costruzione in una giornata di lavoro. Zappa e annaffiatoio restano
   come stavano: quelli sono il mestiere, e il mestiere non si sconta.

   `energiaBonus` tiene da parte quello che si guadagna salendo di
   livello, così alzare la base non cancella quello che uno si è già
   sudato in una partita cominciata prima. */
const ENERGIA_BASE = 260;

/* ===================================================================
   STATO INIZIALE
   Appesa a G perché salvataggio.js la chiama: prima di applicare un
   salvataggio ripulisce lo stato, altrimenti i campi che quel file non
   contiene resterebbero quelli della partita di prima.
   =================================================================== */
function statoIniziale(){
  return {
    nomeGiocatore:'Contadino',
    mappaId:'podere',
    oro:600,
    energia:ENERGIA_BASE, energiaMax:ENERGIA_BASE, energiaBonus:0,
    vistoPesca:false,
    sacaccia:false, lezioneCaccia:null,
    giorno:1, stagioneIdx:0, anno:1, giornoTot:0,
    ora:360,
    meteo:'sereno', meteoDomani:'sereno',
    invMax:27,
    inv:[
      {id:'zappa',n:1},{id:'annaffiatoio',n:1},{id:'ascia',n:1},
      {id:'piccone',n:1},{id:'falce',n:1},{id:'canna',n:1},
      {id:'seme_rapa',n:15},null,null,null,null,null,
      null,null,null,null,null,null,null,null,null,null,null,null
    ],
    slotSel:0,
    skills:{agricoltura:0, raccolta:0, estrazione:0, pesca:0},
    attrezziLiv:{zappa:0, annaffiatoio:0, ascia:0, piccone:0},
    amicizia:{}, regalatoOggi:{}, parlatoOggi:{},
    costruzioni:{},
    santuario:{}, santuarioDato:{}, braci:0, regaloRicevuto:{},
    lettere:{}, ricetteNote:{zuppa_contadina:true, frittata:true},
    cassaConsegna:[],
    stats:{raccolti:0, pesci:0, alberi:0, sassi:0, guadagno:0, giorniGiocati:0,
           piatti:0, regali:0, richiesteFatte:0, sagre:0, venduto:0,
           visitatoBosco:false, visitatoGrotta:false, visitatoPaese:false},
    guidaAperta:true, guidaNascosta:false,
    mercato:null, gelo:false, richieste:[], richiestaSeq:0, premiSospesi:[],
    gatto:{ affetto:0, giorno:-1, nome:null },
    obiettiviRiscossi:{}, sagra:null, mercante:{presente:false, giorno:-1, stock:[]},
    visitati:{podere:true}, collezione:{},
    trame:{ torta:{avviata:false, segreto:false, fatta:false},
            pesceluna:{avviata:false, preso:false, fatta:false},
            veglia:{avviata:false, memorie:{}, verita:false, invitati:{}, giorno:null, fatta:false} },
    tutorialFatto:false,
    animali:[],
    look:{ pelle:'#e8bd8f', capelli:'#6b4423', maglia:'#4f8ab0', pant:'#3d5470', cappello:'#c9a44c' }
  };
}
G.statoIniziale = statoIniziale;

/* ===================================================================
   BOOT
   =================================================================== */
let cvs, ultimo=0, accum=0;
G.tempoMs = 0;
G.particelle = [];
G.cam = {x:0,y:0};
G.bersaglio = null;
G.inGioco = false;

G.p = {
  px:0, py:0, dir:0, frame:0, animT:0, vx:0, vy:0,
  attrezzoVisibile:null, usoT:0, dorme:false, blink:false, blinkT:0,
  look:null, correndo:false
};

function init(){
  cvs = $('#game');
  REND.init(cvs);
  window.addEventListener('resize', ()=>{ REND.resize(); REND.initMeteo(); });
  collegaInput();
  collegaTitolo();
  collegaLanding();
  TITOLO.avvia();
}

/* ===================================================================
   LANDING PAGE — front page con "cosa offre" e i pulsanti di avvio.
   Su mobile la pagina è visibile, ma provare a giocare mostra l'avviso.
   =================================================================== */
function collegaLanding(){
  // la landing usa lo sfondo animato del titolo: nascondi il vecchio menu del titolo
  const ti = $('#title-inner'); if(ti) ti.style.display='none';
  const daMobile = ()=> window.matchMedia('(max-width:820px), (pointer:coarse) and (hover:none)').matches;
  const avviso = ()=> $('#mobile-warn').classList.add('show');
  const back = $('#mw-back'); if(back) back.onclick = ()=> $('#mobile-warn').classList.remove('show');

  /* Su telefono l'avviso va dato SUBITO, in cima alla pagina: far leggere
     tutta la presentazione per poi rifiutare il clic è la peggiore delle
     accoglienze. I pulsanti restano lì ma dicono già come andrà a finire. */
  if(daMobile()){
    const lp = $('#landing');
    if(lp) lp.classList.add('solo-desktop');
    document.querySelectorAll('.lp-new').forEach(b=>{
      b.textContent = 'Solo da computer';
      b.title = 'Fioralba richiede tastiera e mouse';
    });
  }

  if(window.LANDING) LANDING.init();

  const haSalvato = !!caricaGrezzo();
  document.querySelectorAll('.lp-continue').forEach(b=>{
    if(!haSalvato){ b.disabled = true; b.title = 'Nessuna partita salvata'; }
    b.addEventListener('click', ()=>{
      if(daMobile()){ avviso(); return; }
      SND.resume(); SND.play('menu');
      if(carica()) avviaGioco(false); else nuovaPartita();
    });
  });
  document.querySelectorAll('.lp-new').forEach(b=>{
    b.addEventListener('click', ()=>{
      if(daMobile()){ avviso(); return; }
      SND.resume(); SND.play('menu');
      chiediNuovaPartita();     // se c'è già una partita, prima si avverte
    });
  });
  /* L'import stava solo nel menu del titolo, che la landing nasconde
     (`title-inner` sparisce qui sopra): per importare bisognava prima
     entrare in partita, cioè averne già una. Dalla landing invece si
     parte con un salvataggio portato da un altro computer. Il resto del
     giro esiste già: importaDaFile valida, scrive e ricarica, e al
     ritorno collegaTitolo vede il segnale in sessionStorage e riprende
     la partita da solo. */
  document.querySelectorAll('.lp-import').forEach(b=>{
    b.addEventListener('click', ()=>{
      if(daMobile()){ avviso(); return; }
      SND.resume(); SND.play('menu');
      G.importaDaFile();
    });
  });
}

/* ===================================================================
   AVVIO DELLA PARTITA
   Stava sotto l'intestazione "TITOLO" insieme al disegno della
   schermata, e da lì veniva l'impressione che quella sezione fosse
   legata a mezzo gioco: erano queste quattro funzioni ad esserlo — la
   scena animata (ora in titolo.js) non chiamava niente.
   =================================================================== */
function collegaTitolo(){
  const salvato = caricaGrezzo();
  if(salvato) $('#btn-continue').classList.remove('hidden');

  $('#btn-new').onclick = ()=>{
    SND.resume(); SND.play('menu');
    chiediNuovaPartita();
  };
  $('#btn-continue').onclick = ()=>{
    SND.resume(); SND.play('menu');
    if(carica()) avviaGioco(false);
    else nuovaPartita();
  };
  $('#btn-howto').onclick = ()=>{ SND.resume(); UI.comeSiGioca(); };
  const bImp = $('#btn-import');
  if(bImp) bImp.onclick = ()=>{ SND.resume(); SND.play('menu'); G.importaDaFile(); };

  // se torniamo qui subito dopo un import, riprendi la partita importata
  let autoImport = false;
  try{
    autoImport = sessionStorage.getItem('fioralba_import')==='1';
    if(autoImport) sessionStorage.removeItem('fioralba_import');
  }catch(e){}
  if(autoImport && salvato && carica()){ avviaGioco(false); }
}

/* Cominciare da capo cancella quello che c'era, e finora non lo diceva
   nessuno: bastava un clic di troppo sul menu per perdere una stagione
   di lavoro. Adesso si chiede, e prima di rispondere si vede cosa c'è
   in ballo — che giorno è, quante monete, quanto si è guadagnato. */
function chiediNuovaPartita(){
  const grezzo = caricaGrezzo();
  if(!grezzo){ nuovaPartita(); return; }

  let d = null;
  try{ d = JSON.parse(grezzo); }catch(e){}
  if(!d){ nuovaPartita(); return; }

  const st = (DATA.SEASONS[d.stagioneIdx] || DATA.SEASONS[0]).nome;
  const giorni = (d.giornoTot|0) + 1;

  UI.modal('Ricominciare da capo?', body=>{
    const avviso = document.createElement('div');
    avviso.className = 'avviso-grave';
    avviso.innerHTML = 'Hai una partita in corso. Cominciandone una nuova <b>la perdi</b>, '+
                       'e non si torna indietro.';
    body.appendChild(avviso);

    const scheda = document.createElement('div'); scheda.className = 'salva-scheda';
    scheda.innerHTML =
      '<div class="ss-riga"><span>Contadino</span><b>'+(d.nomeGiocatore||'—')+'</b></div>'+
      '<div class="ss-riga"><span>A che punto</span><b>'+st+' '+(d.giorno||1)+', anno '+(d.anno||1)+'</b></div>'+
      '<div class="ss-riga"><span>Giorni giocati</span><b>'+giorni+'</b></div>'+
      '<div class="ss-riga"><span>Monete</span><b>'+(d.oro||0)+'</b></div>'+
      '<div class="ss-riga"><span>Guadagnate in tutto</span><b>'+((d.stats&&d.stats.guadagno)||0)+'</b></div>';
    body.appendChild(scheda);

    const consiglio = document.createElement('div');
    consiglio.className = 'muted'; consiglio.style.margin = '10px 0 14px';
    consiglio.innerHTML = 'Se ci tieni, prima <b>esportala in un file</b>: la ritrovi quando vuoi, '+
                          'anche su un altro computer.';
    body.appendChild(consiglio);

    const az = document.createElement('div');
    az.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';

    const bEsp = document.createElement('button'); bEsp.className = 'btn';
    bEsp.textContent = 'Esporta la partita';
    bEsp.onclick = ()=>{ G.esporta(); };
    az.appendChild(bEsp);

    const bAnn = document.createElement('button'); bAnn.className = 'btn blue';
    bAnn.textContent = 'Lascia stare';
    bAnn.onclick = ()=>UI.chiudiModal();
    az.appendChild(bAnn);

    const bOk = document.createElement('button'); bOk.className = 'btn red';
    bOk.textContent = 'Cancella e ricomincia';
    bOk.onclick = ()=>{ UI.chiudiModal(); nuovaPartita(); };
    az.appendChild(bOk);

    body.appendChild(az);
  });
}

function nuovaPartita(){
  Object.assign(G, statoIniziale());
  G.maps = WORLD.crea();
  G.p.look = G.look;
  G.p.px = 8*T+16; G.p.py = 10*T+16;
  G.animali = [{tipo:'gatto', mappa:'podere', px:10*T, py:9*T, dir:1, tx:10, ty:9, wait:0}];
  WORLD.nuovoGiorno(G.maps, G.stagione().id, 12345);
  G.richieste = [];
  aggiornaRichieste();          // qualche richiesta già dal primo giorno
  G.sagra = creaSagra();        // la sagra di primavera è già in corso
  G.lettere.intro = true;
  avviaGioco(true);
}

function avviaGioco(conIntro){
  $('#title').classList.add('hidden');
  const lp=$('#landing'); if(lp) lp.classList.add('hidden');
  if(window.LANDING) LANDING.ferma();     // niente animazioni a vuoto sotto la partita
  TITOLO.ferma();
  $('#hud').classList.remove('hidden');
  G.inGioco = true;
  G.ultimaAzione = performance.now();
  normalizzaStato();
  REND.initMeteo();
  aggiornaCamera(true);
  costruisciHotbar();
  G.aggiornaHUD();
  G.progresso();
  aggiornaOspitiSagra();          // se si riprende proprio nel giorno di festa
  SOLSTIZIO.aggiornaOspitiVeglia();         // o proprio la sera della veglia
  G.azzeraTraguardi();            // quello che è già fatto non si annuncia
  if(window.GUIDA) GUIDA.init();
  musicaGiusta();
  SND.ambiente(ambienteGiusto());
  if(conIntro){
    // dopo la lettera di Nonna Ilde parte la guida interattiva
    setTimeout(()=>UI.lettera('intro', ()=>{
      if(!G.tutorialFatto) setTimeout(()=>TUT.inizia(), 400);
    }), 700);
  }
  ultimo = performance.now();
  requestAnimationFrame(loop);
}

/* ===================================================================
   ACCESSORI DI STATO
   =================================================================== */
G.mappa = ()=> G.maps[G.mappaId];
G.stagione = ()=> DATA.SEASONS[G.stagioneIdx];

G.livello = function(k){
  const xp = G.skills[k]||0;
  let l=0;
  for(let i=1;i<DATA.XP_LIV.length;i++) if(xp>=DATA.XP_LIV[i]) l=i;
  return l;
};

/* "sto andando da qualche parte": segnato quando succede qualcosa di
   davvero utile (esperienza, una vendita, un luogo nuovo, un giorno che
   passa). I suggerimenti guardano questo, non se stai toccando i tasti:
   chi è perso continua a cliccare, ed è proprio lui che va aiutato. */
G.ultimoProgresso = 0;
G.progresso = function(){ G.ultimoProgresso = performance.now(); };

/* ===================================================================
   QUANDO UN TRAGUARDO SI COMPIE

   Un traguardo si completava in silenzio. Abbatti il venticinquesimo
   albero, e non succede niente: il premio resta lì finché non apri il
   Diario e ti accorgi per caso che c'è un pulsante «Riscuoti». Chi non
   apre il Diario non lo scopre mai — e il Diario si apre quando si ha
   già in mente qualcosa, non a caso.

   Quindi si guarda dopo ogni azione che può averne compiuto uno, e
   quando ne scatta uno lo si dice. Il confronto è sull'insieme di
   quelli fatti: costa un giro su quindici voci, e si fa solo quando
   qualcosa è davvero cambiato.
   =================================================================== */
let traguardiFatti = null;
let traguardiT = 0, traguardiVisti = -1;

G.controllaTraguardi = function(annuncia){
  let ora;
  try{ ora = G.obiettivi(); }catch(e){ return; }
  const adesso = new Set(ora.filter(o=>o.fatto).map(o=>o.id));
  if(traguardiFatti === null){          // prima volta: si prende nota e basta
    traguardiFatti = adesso;
    return;
  }
  if(annuncia !== false){
    for(const o of ora){
      if(!o.fatto || traguardiFatti.has(o.id)) continue;
      SND.play('livello');
      UI.toast('Traguardo compiuto: '+o.nome+(o.premio? ' — '+o.premio+' monete da riscuotere':''),
               'gold', o.icona);
      particelleTesto(G.p.px, G.p.py-52, 'TRAGUARDO!', '#ffe270');
    }
  }
  traguardiFatti = adesso;
};

/* quando si carica una partita, quello che è già fatto non è una notizia */
G.azzeraTraguardi = function(){ traguardiFatti = null; G.controllaTraguardi(false); };

/* Il monte energia che ogni livello aggiunge. Era scritto come cinque
   `if` uno sotto l'altro, e l'agricoltura ne dava 8 mentre le altre 6
   senza che niente dicesse perché: resta com'era, ma detto una volta. */
const ENERGIA_PER_LIVELLO = { agricoltura:8, raccolta:6, estrazione:6, pesca:6, caccia:6 };

/* Salire di livello paga: monete e un oggetto del mestiere che l'ha
   guadagnato (DATA.PREMI_LIVELLO). Se lo zaino è pieno l'oggetto NON si
   perde — finisce in `G.premiSospesi` e si ritira dalla scheda delle
   abilità. Buttarlo sarebbe il modo peggiore di festeggiare, e succede
   proprio quando succede: si sale di livello raccogliendo, cioè con lo
   zaino pieno di roba appena raccolta. */
function premiaLivello(k, liv){
  const P = (DATA.PREMI_LIVELLO[k]||[])[liv];
  if(!P) return null;
  const dato = { oro:P.oro||0, item:P.item, n:P.n||0, chiave:!!P.chiave, sospeso:false };
  if(P.oro){ G.oro += P.oro; G.registraVendita(0); }
  if(P.item && P.n){
    if(G.puoiAggiungere(P.item, P.n)) G.aggiungi(P.item, P.n);
    else {
      G.premiSospesi.push({ item:P.item, n:P.n, da:k, liv });
      dato.sospeso = true;
    }
  }
  return dato;
}

G.xp = function(k, n){
  G.progresso();
  const prima = G.livello(k);
  G.skills[k] = (G.skills[k]||0) + n;
  const dopo = G.livello(k);

  /* Un colpo solo può valere più di un livello — la lezione di Oreste ne
     dà 40 in un pezzo, e a inizio partita bastano. Si sale uno alla volta
     e ognuno paga il suo premio, altrimenti saltare da 0 a 2 farebbe
     sparire il premio del primo. */
  if(dopo > prima){
    const saliti = [];
    for(let l = prima+1; l <= dopo; l++){
      G.energiaBonus += ENERGIA_PER_LIVELLO[k] || 6;
      saliti.push({ skill:k, liv:l, premio:premiaLivello(k, l) });
    }
    G.energiaMax = ENERGIA_BASE + G.energiaBonus;
    G.energia = Math.min(G.energiaMax, G.energia + 20);
    G.stats.livelli = (G.stats.livelli||0) + saliti.length;

    particelleTesto(G.p.px, G.p.py-40, 'LIVELLO '+dopo, '#ffe270');
    festaLivello();
    for(const s of saliti) LIV.annuncia(s);
  } else {
    LIV.guadagno(k, n);          // la barretta che compare e scompare
  }
  G.aggiornaHUD();
};

/* la cascata di stelle attorno al giocatore: sta qui e non in livelli.js
   perché le particelle sono del mondo, non del pannello */
function festaLivello(){
  const cx = G.p.px, cy = G.p.py - 22;
  for(let i=0;i<46;i++){
    const a = Math.random()*6.283, v = 0.5+Math.random()*2.1;
    G.particelle.push({ t:'stella', x:cx, y:cy,
      vx:Math.cos(a)*v, vy:Math.sin(a)*v-0.5, g:0.006,
      vita:900+Math.random()*500, vitaMax:1400, c:i%3?'#ffe270':'#fff6d0' });
  }
}

/* --- inventario --- */
G.conta = function(id){
  let n=0;
  for(const s of G.inv) if(s && s.id===id) n+=s.n;
  return n;
};
G.puoiAggiungere = function(id, n){
  n=n||1;
  for(const s of G.inv) if(s && s.id===id) return true;
  return G.inv.findIndex((s,i)=>i<G.invMax && !s) >= 0;
};
/* registra un oggetto nella Collezione del Naturalista alla prima volta */
function registraScoperta(id){
  if(!id || id.indexOf(':')>0) return;           // niente composti (conserve/vino)
  if(!G.collezione) G.collezione={};
  if(G.collezione[id]) return;
  const I = DATA.ITEMS[id]; if(!I || I.spazzatura) return;
  if(['pesce','minerale','raccolto','foraggio','cibo'].indexOf(I.cat)>=0) G.collezione[id]=true;
}

G.aggiungi = function(id, n){
  n=n||1;
  registraScoperta(id);
  for(let i=0;i<G.invMax;i++){
    const s=G.inv[i];
    if(s && s.id===id){ s.n+=n; return true; }
  }
  for(let i=0;i<G.invMax;i++){
    if(!G.inv[i]){ G.inv[i]={id,n}; costruisciHotbar(); return true; }
  }
  return false;
};
G.togli = function(id, n){
  n=n||1;
  for(let i=0;i<G.invMax && n>0;i++){
    const s=G.inv[i];
    if(s && s.id===id){
      const q=Math.min(n, s.n);
      s.n-=q; n-=q;
      if(s.n<=0) G.inv[i]=null;
    }
  }
  costruisciHotbar();
  return n<=0;
};
G.togliSlot = function(i, n){
  const s=G.inv[i];
  if(!s) return;
  s.n -= (n||1);
  if(s.n<=0) G.inv[i]=null;
  costruisciHotbar();
  G.aggiornaHUD();
};
G.slot = ()=> G.inv[G.slotSel];

/* Sposta un oggetto da una casella all'altra dello zaino.

   Se le due caselle hanno la stessa roba, si sommano invece di
   scambiarsi: è quello che uno si aspetta trascinando dieci rape sopra
   altre dieci rape, e senza si restava con mezze pile sparse ovunque
   senza modo di rimetterle insieme.

   Le prime nove caselle sono la barra in basso: spostare lì un oggetto
   vuol dire metterselo in mano, ed è il motivo per cui questa cosa
   serve davvero. */
G.spostaSlot = function(da, a){
  if(da===a) return false;
  if(da<0 || a<0 || da>=G.invMax || a>=G.invMax) return false;
  const x = G.inv[da], y = G.inv[a];
  if(!x) return false;

  // le pile in questo gioco non hanno tetto, quindi si sommano e basta
  if(y && y.id===x.id && IT.cat(x.id)!=='attrezzo'){
    y.n += x.n;
    G.inv[da] = null;
  } else {
    G.inv[da] = y || null; G.inv[a] = x;
  }
  costruisciHotbar();
  G.aggiornaHUD();
  return true;
};

/* Registra una vendita, da qualunque parte arrivi (bottega o cassa di
   consegna). Prima le vendite in bottega non finivano in `guadagno`:
   chi vendeva solo da Bruno non avanzava mai nel traguardo «Benestante». */
G.registraVendita = function(monete){
  G.stats.venduto = (G.stats.venduto||0) + 1;
  G.stats.guadagno = (G.stats.guadagno||0) + (monete||0);
  G.progresso();
};

G.prezzoVendita = function(id){
  let p = IT.prezzo(id);
  const c = IT.cat(id);
  // i coefficienti stanno in DATA.BONUS: da lì li legge anche la scheda
  const B = DATA.BONUS;
  if(c==='raccolto') p = Math.round(p * (1 + G.livello('agricoltura')*B.agricoltura.valore));
  if(c==='foraggio') p = Math.round(p * (1 + G.livello('raccolta')*B.raccolta.valore));
  if(c==='pesce')    p = Math.round(p * (1 + G.livello('pesca')*B.pesca.valore));
  if(c==='minerale') p = Math.round(p * (1 + G.livello('estrazione')*B.estrazione.valore));
  // mercato dinamico: oggi un prodotto è più richiesto
  if(G.mercato && G.mercato.item===id) p = Math.round(p * G.mercato.mult);
  return p;
};

/* ===================================================================
   HUD
   =================================================================== */
function costruisciHotbar(){
  const hb = $('#hotbar');
  hb.innerHTML='';
  for(let i=0;i<9;i++){
    const s = G.inv[i];
    const d = document.createElement('div');
    d.className='slot'+(i===G.slotSel?' sel':'');
    if(s){
      d.appendChild(UI.ico(s.id));
      if(s.n>1){ const q=document.createElement('span'); q.className='qty'; q.textContent=s.n; d.appendChild(q); }
      d.title = IT.nome(s.id);
    }
    const k=document.createElement('span'); k.className='key'; k.textContent=i+1;
    d.appendChild(k);
    d.onclick=()=>{ G.slotSel=i; evidenziaSlot(); SND.play('menu'); };
    hb.appendChild(d);
  }
  aggiornaNomeHotbar();
}

/* Cambiare casella selezionata NON richiede di ricostruire la barra:
   spostare una classe costa nulla, ricreare 9 nodi e 9 canvas a ogni
   scatto di rotellina no. */
function evidenziaSlot(){
  const slots = $('#hotbar').children;
  for(let i=0;i<slots.length;i++) slots[i].classList.toggle('sel', i===G.slotSel);
  aggiornaNomeHotbar();
}

/* chi tocca G.inv da fuori (negozi, casse) deve poter ridisegnare la barra:
   senza questo la hotbar continua a mostrare oggetti che non hai più */
G.rinfrescaHotbar = costruisciHotbar;

/* etichetta col nome dell'oggetto selezionato, sopra la barra */
function aggiornaNomeHotbar(){
  const el = $('#hotbar-name');
  if(!el) return;
  const s = G.inv[G.slotSel];
  if(!s){ el.classList.add('hidden'); return; }
  const cat = IT.cat(s.id);
  const etichette = { attrezzo:'Attrezzo', seme:'Semi', raccolto:'Raccolto',
    foraggio:'Trovato nel bosco', pesce:'Pesce', minerale:'Minerale',
    materiale:'Materiale', artigianato:'Artigianato', cibo:'Cibo',
    animale:'Prodotto', speciale:'Speciale' };
  const tag = etichette[cat] ? `<span class="nkind">${etichette[cat]}</span>  ` : '';
  el.innerHTML = tag + IT.nome(s.id);
  el.classList.remove('hidden');
  // riavvia l'animazione a ogni cambio
  el.style.animation='none'; void el.offsetWidth; el.style.animation='';
  if(window.TUT) TUT.notifica('slot');
}

G.aggiornaHUD = function(){
  $('#goldtext').textContent = G.oro.toLocaleString('it-IT');
  const pct = Math.max(0, Math.min(100, G.energia/G.energiaMax*100));
  $('#energyfill').style.height = pct+'%';
  $('#energytext').textContent = Math.max(0,Math.round(G.energia));
  $('#energybox .vbar').classList.toggle('low', pct<30);

  const o = Math.floor(G.ora);
  const h = Math.floor(o/60), mi = Math.floor((o%60)/10)*10;
  const h12 = h>=24 ? h-24 : h;
  $('#timetext').textContent = h12+':'+String(mi).padStart(2,'0');
  $('#datetext').textContent = G.stagione().nome+' '+G.giorno;

  const si = $('#season-icon');
  if(si.dataset.s !== G.stagione().id){
    si.dataset.s = G.stagione().id;
    si.innerHTML=''; si.appendChild(ART.uiIcon(G.stagione().id));
  }
  const wi = $('#weather-icon');
  if(wi.dataset.w !== G.meteo){
    wi.dataset.w = G.meteo;
    wi.innerHTML=''; wi.appendChild(ART.uiIcon(DATA.METEO[G.meteo].icona));
  }
  $('#weathertext').textContent = DATA.GIORNI_SETTIMANA[G.giornoTot%7];
};

/* ===================================================================
   CICLO PRINCIPALE
   =================================================================== */
const MS_PER_MIN = 500;

/* esegue un "sistema" del motore isolato: se lancia un errore, non ferma
   gli altri sistemi né il loop. Logga i primi errori di ogni sistema. */
const _erroriSistema = {};
function sistema(nome, fn){
  try{ fn(); }
  catch(e){
    _erroriSistema[nome] = (_erroriSistema[nome]||0) + 1;
    if(_erroriSistema[nome] <= 3) console.warn('[motore] errore nel sistema «'+nome+'»', e);
  }
}

function loop(ts){
  if(!G.inGioco) return;                      // il loop si ferma solo uscendo dal gioco
  try{
    const dt = Math.min(50, ts-ultimo);
    ultimo = ts;
    G.tempoMs += dt;

    // il pannello può essere stato aperto/ridimensionato senza emettere "resize"
    if(REND.deveRidimensionare()){
      sistema('resize', ()=>{ REND.resize(); REND.initMeteo(); });
    }

    const bloccato = UI.modalAperta() || UI.dialogoAttivo() ||
                     !$('#letter').classList.contains('hidden') ||
                     !$('#daycard').classList.contains('hidden') ||
                     G.p.dorme || PESCA.inCorso();

    // il vento gira sempre: anche a menu aperto l'erba continua a muoversi
    sistema('vento', ()=>FX.aggiornaVento(dt, G.meteo==='vento' ? 2.1 :
                         (G.meteo==='temporale' ? 2.6 :
                         (G.meteo==='pioggia' ? 1.4 : 1))));

    if(!bloccato){
      accum += dt;
      let giri=0;
      while(accum >= MS_PER_MIN && giri++ < 600){   // limite di sicurezza contro salti enormi
        accum -= MS_PER_MIN;
        sistema('orologio', avanzaMinuto);
      }
      sistema('giocatore', ()=>aggiornaGiocatore(dt));
      sistema('npc',       ()=>aggiornaNPC(dt));
      sistema('animali',   ()=>aggiornaAnimali(dt));
      sistema('fauna',     ()=>MOBS.aggiorna(G, dt));
      sistema('guardia',   guardiaGiocatore);
    }
    if(PESCA.inCorso()) sistema('pesca', ()=>PESCA.aggiorna(dt));

    if(window.TUT)   sistema('tutorial', ()=>TUT.aggiorna());
    if(window.GUIDA) sistema('guida',    ()=>GUIDA.aggiorna());

    sistema('particelle', ()=>aggiornaParticelle(dt));
    sistema('camera',     ()=>aggiornaCamera(false));
    /* I traguardi si guardano da qui e non dai diciannove punti in cui
       una statistica può cambiare: uno solo si dimentica, diciannove si
       dimenticano tutti. Al massimo una volta al secondo e mezzo, e solo
       se nel frattempo è successo qualcosa. */
    sistema('traguardi',  ()=>{
      if(G.ultimoProgresso === traguardiVisti) return;
      if(performance.now() - traguardiT < 1500) return;
      traguardiT = performance.now();
      traguardiVisti = G.ultimoProgresso;
      G.controllaTraguardi(true);
    });
    sistema('bersaglio',  calcolaBersaglio);
    if(!bloccato) sistema('prompt', promptContestuale);
    sistema('render',     ()=>REND.disegna(G));
  }catch(e){
    console.warn('[motore] errore nel loop', e);
  }
  requestAnimationFrame(loop);                // rischedulato SEMPRE: nessun errore uccide il motore
}

/* mantiene il giocatore in uno stato valido (mai coordinate NaN o fuori mappa) */
function guardiaGiocatore(){
  const p=G.p, m=G.mappa();
  if(!p || !m) return;
  if(!isFinite(p.px) || !isFinite(p.py)){
    const s=WORLD.vicinoLibero(m, (m.w/2)|0, (m.h/2)|0);
    p.px=s.x*T+16; p.py=s.y*T+20; p.vx=0; p.vy=0;
    return;
  }
  const maxX=m.w*T-2, maxY=m.h*T-2;
  if(p.px<2||p.py<2||p.px>maxX||p.py>maxY){
    p.px=Math.max(2,Math.min(maxX,p.px));
    p.py=Math.max(2,Math.min(maxY,p.py));
  }
}

/* garantisce che tutte le strutture di stato esistano e siano del tipo giusto:
   così salvataggi vecchi/parziali non mandano in errore il resto del motore. */
function normalizzaStato(){
  const A = k => { if(!Array.isArray(G[k])) G[k]=[]; };
  const O = k => { if(!G[k] || typeof G[k]!=='object') G[k]={}; };
  ['inv','richieste','cassaConsegna','animali','premiSospesi'].forEach(A);
  ['skills','attrezziLiv','amicizia','costruzioni','santuario','santuarioDato',
   'lettere','ricetteNote','stats','obiettiviRiscossi','visitati','collezione','regaloRicevuto',
   'parlatoOggi','regalatoOggi','mercato','gatto'].forEach(O);
  /* le partite cominciate prima del gatto non hanno i suoi campi: senza
     questi, la prima carezza leggerebbe `undefined + 6` */
  if(typeof G.gatto.affetto !== 'number') G.gatto.affetto = 0;
  if(typeof G.gatto.giorno  !== 'number') G.gatto.giorno  = -1;
  if(G.gatto.nome === undefined) G.gatto.nome = null;
  if(!G.trame || typeof G.trame!=='object') G.trame={};
  if(!G.trame.torta)     G.trame.torta={avviata:false,segreto:false,fatta:false};
  if(!G.trame.pesceluna) G.trame.pesceluna={avviata:false,preso:false,fatta:false};
  /* Chi ha una partita avviata prima dell'atto secondo non ha questo
     pezzo di stato: glielo si mette adesso, vuoto. Se ha già le quattro
     braci, la prossima volta che entra al Santuario la storia riparte
     da lì — cioè esattamente dove l'aveva lasciata. */
  if(!G.trame.veglia) G.trame.veglia={avviata:false,memorie:{},verita:false,invitati:{},giorno:null,fatta:false};
  if(!G.trame.veglia.memorie)  G.trame.veglia.memorie={};
  if(!G.trame.veglia.invitati) G.trame.veglia.invitati={};
  if(!G.mercante || typeof G.mercante!=='object') G.mercante={presente:false,giorno:-1,stock:[]};
  if(!Array.isArray(G.mercante.stock)) G.mercante.stock=[];
  if(!G.visitati.podere) G.visitati.podere=true;
  /* Il monte energia si ricalcola sempre da base + bonus: così alzare la
     base vale anche per le partite già cominciate, senza toccare quello
     che si è guadagnato salendo di livello. (Il bonus di un salvataggio
     vecchio lo ricava applicaSalvataggio, in salvataggio.js: è l'unico
     posto in cui si sa ancora che nel file non c'era.) */
  if(typeof G.energiaBonus !== 'number' || !isFinite(G.energiaBonus)) G.energiaBonus = 0;
  G.energiaMax = ENERGIA_BASE + G.energiaBonus;
  if(typeof G.energia !== 'number' || !isFinite(G.energia)) G.energia = G.energiaMax;
  G.energia = Math.min(G.energia, G.energiaMax);
  /* Ventisette e non ventiquattro: lo zaino si legge come una riga di
     barra più due righe di deposito, e tre righe da nove tornano.
     Le partite già cominciate salgono a ventisette invece di restare
     con una riga monca. */
  if(typeof G.invMax!=='number' || G.invMax<1) G.invMax=27;
  if(G.invMax < 27) G.invMax = 27;
  while(G.inv.length < G.invMax) G.inv.push(null);
  // giocatore incastrato in un solido dopo il caricamento → sblocca (una tantum)
  const p=G.p, m=(G.maps && G.maps[G.mappaId]) ? G.maps[G.mappaId] : null;
  if(p && m){
    if(!isFinite(p.px)||!isFinite(p.py)){ p.px=8*T+16; p.py=10*T+20; }
    const tx=(p.px/T)|0, ty=(p.py/T)|0;
    if(WORLD.solido(m,tx,ty)){ const s=WORLD.vicinoLibero(m,tx,ty); p.px=s.x*T+16; p.py=s.y*T+20; }
  }
}
G.normalizzaStato = normalizzaStato;   // la chiama salvataggio.js, in coda al ripristino

function avanzaMinuto(){
  G.ora++;
  if(Math.floor(G.ora)%10===0) G.aggiornaHUD();
  // svenimento
  if(G.ora >= 1560){
    sveniamo();
  }
}

/* ===================================================================
   GIOCATORE
   =================================================================== */
const tasti = {};

function aggiornaGiocatore(dt){
  const p = G.p;
  const m = G.mappa();

  // uso attrezzo in corso
  if(p.usoT>0){ p.usoT -= dt; if(p.usoT<0) p.usoT=0; }

  // battito di ciglia
  p.blinkT -= dt;
  if(p.blinkT<=0){ p.blink = !p.blink; p.blinkT = p.blink? 110 : 2200+Math.random()*3000; }

  let dx=0, dy=0;
  if(tasti['arrowleft']||tasti['a']) dx-=1;
  if(tasti['arrowright']||tasti['d']) dx+=1;
  if(tasti['arrowup']||tasti['w']) dy-=1;
  if(tasti['arrowdown']||tasti['s']) dy+=1;

  const correndo = (tasti['shift']) && G.energia>2;
  p.correndo = correndo && (dx||dy);

  if(dx||dy){
    const len = Math.hypot(dx,dy)||1;
    // velocità: sentiero più veloce
    const tSotto = WORLD.terreno(m, (p.px/T)|0, (p.py/T)|0);
    const duro = tSotto==='sentiero'||tSotto==='assi'||tSotto==='lastre'||tSotto==='cotto';
    let vel = (correndo?1.9:1.18) * (duro?1.14:1);
    if(p.usoT>0) vel*=0.35;
    const spd = vel * dt/16;

    muovi(dx/len*spd, dy/len*spd);
    if(window.TUT) TUT.notifica('muovi');

    // direzione
    if(Math.abs(dx)>Math.abs(dy)) p.dir = dx<0?1:2;
    else if(dy) p.dir = dy<0?3:0;

    // animazione
    p.animT += dt*(correndo?1.55:1);
    const soglia = 130;
    if(p.animT>soglia){ p.animT=0; p.frame=(p.frame+1)%4; passo(); }

    if(correndo){
      G.energia -= dt*0.0012;
      if(G.energia<0) G.energia=0;
    }
  } else {
    p.frame=0; p.animT=0;
  }

  // attrezzo visibile
  const s = G.slot();
  p.attrezzoVisibile = (s && IT.cat(s.id)==='attrezzo') ? s.id : null;
  // il passo della lezione che si chiude prendendo l'arco in mano
  if(G.lezioneCaccia==='inMano' && p.attrezzoVisibile==='arco') STORIE.avanzaLezioneCaccia('inMano');

  // warp
  for(const w of m.warps){
    if(p.px >= w.x*T && p.px < (w.x+w.w)*T && p.py >= w.y*T && p.py < (w.y+w.h)*T){
      cambiaMappa(w.to, w.tx, w.ty);
      break;
    }
  }
}

function muovi(dx, dy){
  const p = G.p, m = G.mappa();
  const HW = 7, HH = 5;   // mezzo hitbox ai piedi

  // X
  if(dx){
    const nx = p.px + dx;
    if(!collide(m, nx, p.py, HW, HH)) p.px = nx;
    else {
      // scivolamento sugli angoli
      const step = dx>0?1:-1;
      if(!collide(m, nx, p.py-3, HW, HH) && !collide(m, p.px, p.py-3, HW, HH)) p.py -= 0.6;
      else if(!collide(m, nx, p.py+3, HW, HH) && !collide(m, p.px, p.py+3, HW, HH)) p.py += 0.6;
    }
  }
  // Y
  if(dy){
    const ny = p.py + dy;
    if(!collide(m, p.px, ny, HW, HH)) p.py = ny;
    else {
      if(!collide(m, p.px-3, ny, HW, HH) && !collide(m, p.px-3, p.py, HW, HH)) p.px -= 0.6;
      else if(!collide(m, p.px+3, ny, HW, HH) && !collide(m, p.px+3, p.py, HW, HH)) p.px += 0.6;
    }
  }
  p.px = Math.max(4, Math.min(m.w*T-4, p.px));
  p.py = Math.max(10, Math.min(m.h*T-4, p.py));
}

function collide(m, px, py, hw, hh){
  for(const cx of [px-hw, px+hw]) for(const cy of [py-hh, py]){
    if(WORLD.solido(m, (cx/T)|0, (cy/T)|0)) return true;
  }
  return false;
}

let passoT = 0;
function passo(){
  const m = G.mappa();
  const t = WORLD.terreno(m,(G.p.px/T)|0,(G.p.py/T)|0);
  if(t==='assi') SND.play('passoLegno'); else SND.play('passo');
  // polvere
  if(t==='terra'||t==='sentiero'){
    G.particelle.push({t:'terra', x:G.p.px+(Math.random()*8-4), y:G.p.py-1,
      vx:(Math.random()-0.5)*0.3, vy:-0.15, g:0.006, vita:260, vitaMax:260, s:2, c:'#a8875b', alpha:0.6});
  }
}

/* ===================================================================
   CAMERA
   =================================================================== */
function aggiornaCamera(subito){
  const m = G.mappa();
  const {VW,VH} = REND.info();
  let tx = G.p.px - VW/2;
  let ty = G.p.py - VH/2 - 8;
  const maxX = Math.max(0, m.w*T - VW);
  const maxY = Math.max(0, m.h*T - VH);
  tx = Math.max(0, Math.min(maxX, tx));
  ty = Math.max(0, Math.min(maxY, ty));
  /* Una stanza è più piccola dello schermo. Con il solo aggancio a zero
     finiva incollata in alto a sinistra, con due bande nere sugli altri
     due lati: va centrata, e la camera esce dai bordi della mappa. */
  if(m.w*T < VW) tx = (m.w*T - VW)/2;
  if(m.h*T < VH) ty = (m.h*T - VH)/2;
  if(subito){ G.cam.x=tx; G.cam.y=ty; }
  else {
    G.cam.x += (tx-G.cam.x)*0.14;
    G.cam.y += (ty-G.cam.y)*0.14;
  }
}

/* ===================================================================
   BERSAGLIO
   =================================================================== */
let mouseWorld = null;

function calcolaBersaglio(){
  if(G.p.dorme){ G.bersaglio=null; return; }
  const p=G.p;
  let tx, ty;
  if(mouseWorld){
    tx = (mouseWorld.x/T)|0; ty = (mouseWorld.y/T)|0;
    const d = Math.hypot(tx*T+16-p.px, ty*T+16-p.py);
    if(d > T*2.6) mouseWorld = null;
  }
  if(!mouseWorld){
    const px=(p.px/T)|0, py=(p.py/T)|0;
    const off=[[0,1],[-1,0],[1,0],[0,-1]][p.dir];
    tx=px+off[0]; ty=py+off[1];
  }
  const s = G.slot();
  G.bersaglio = { x:tx, y:ty, ok: !!(s && azionePossibile(s.id, tx, ty)) };
}

function azionePossibile(id, tx, ty){
  const m=G.mappa();
  if(!WORLD.dentro(m,tx,ty)) return false;
  const i=WORLD.idx(m,tx,ty);
  const o=m.obj[i];
  const suolo=m.suolo[i];
  const terr=WORLD.terreno(m,tx,ty);
  const cat=IT.cat(id);

  if(id==='zappa') return m.coltivabile && !o && !suolo && (terr==='erba'||terr==='terra');
  if(id==='annaffiatoio') return (suolo && !suolo.bagnato) || terr==='acqua';
  if(id==='ascia') return !!(o && (o.t==='albero'||o.t==='ceppo'||o.t==='ramo'));
  if(id==='piccone') return !!(o && (o.t==='sasso'||o.t==='stalagmite'||o.t==='mobile')) || !!(suolo && !suolo.crop);
  if(id==='falce') return !!(o && (o.t==='erbaccia'||o.t==='fiori'||o.t==='cespuglio'));
  if(id==='canna') return terr==='acqua';
  if(cat==='seme') return !!(suolo && !suolo.crop);
  if(DATA.ITEMS[id] && DATA.ITEMS[id].posabile) return !o && !suolo && terr!=='acqua' && terr!=='roccia';
  if(DATA.ITEMS[id] && DATA.ITEMS[id].uso) return !!(suolo && !suolo.concime);
  return false;
}

/* ===================================================================
   AZIONE PRINCIPALE (spazio / clic sinistro)
   =================================================================== */
/* ===================================================================
   PERCHÉ NON SUCCEDE NIENTE
   Quasi tutte le azioni impossibili uscivano con un `return` muto: il
   giocatore premeva Spazio e il gioco non faceva niente e non diceva
   niente. Per chi comincia è indistinguibile da un gioco rotto, ed è la
   ragione principale per cui i primi minuti sembrano ostici.
   Qui l'azione impossibile spiega sempre il motivo, senza ripetersi.
   =================================================================== */
let rifiutoT = 0, rifiutoTesto = '';
function nonSiPuo(msg){
  const ora = performance.now();
  if(msg === rifiutoTesto && ora - rifiutoT < 2600) return;   // niente raffiche
  rifiutoTesto = msg; rifiutoT = ora;
  UI.toast(msg, 'hint');
}

/* perché la zappa non morde questa casella? */
function perchePuoiZappare(m, tx, ty){
  if(!m.coltivabile) return 'Qui non si coltiva: la terra buona è al podere.';
  const i = WORLD.idx(m,tx,ty);
  if(m.suolo[i]) return 'Questa terra è già dissodata: prendi i semi.';
  if(m.obj[i])   return 'C\'è qualcosa sopra: prima libera la casella.';
  const t = WORLD.terreno(m,tx,ty);
  if(t!=='erba' && t!=='terra') return 'La zappa lavora l\'erba e la terra, non questo.';
  return null;
}

function usaOggetto(){
  const p=G.p, m=G.mappa();
  if(p.usoT>0) return;
  const b=G.bersaglio;
  if(!b) return;
  // se si ha qualcosa in mano da posare, lo spazio serve a quello
  if(G.spostamento){ G.posaSpostamento(b.x, b.y); return; }
  const tx=b.x, ty=b.y;
  if(!WORLD.dentro(m,tx,ty)) return;
  const i=WORLD.idx(m,tx,ty);
  const o=m.obj[i];
  const suolo=m.suolo[i];
  const terr=WORLD.terreno(m,tx,ty);

  // guarda verso il bersaglio
  const ddx = tx*T+16-p.px, ddy = ty*T+16-p.py;
  if(Math.abs(ddx)>Math.abs(ddy)) p.dir = ddx<0?1:2; else p.dir = ddy<0?3:0;

  const s = G.slot();

  /* --- raccolta a mani / oggetto non-attrezzo --- */
  if(o && o.t==='foraggio'){
    raccogliForaggio(tx,ty,o); return;
  }
  if(suolo && suolo.crop){
    const C=DATA.CROPS[suolo.crop.id];
    if(suolo.crop.stage >= C.fasi.length){ raccogliColtura(tx,ty,suolo); return; }
  }

  if(!s){
    nonSiPuo('Non hai niente in mano: scegli un oggetto dalla barra in basso (tasti 1-9).');
    return;
  }
  const id=s.id;
  const cat=IT.cat(id);

  /* --- ATTREZZI --- */
  if(cat==='attrezzo'){
    const liv = G.attrezziLiv[id]||0;

    if(id==='zappa'){
      const perche = perchePuoiZappare(m,tx,ty);
      if(perche){ nonSiPuo(perche); return; }
      if(!spendi(2 - liv*0.35)) return;
      p.usoT=280; SND.play('zappa');
      m.suolo[i]={arato:true, bagnato:false, crop:null, concime:null};
      for(let k=0;k<7;k++) G.particelle.push({t:'terra',
        x:tx*T+8+Math.random()*16, y:ty*T+14+Math.random()*10,
        vx:(Math.random()-0.5)*1.1, vy:-0.7-Math.random()*0.7, g:0.05,
        vita:420, vitaMax:420, s:2, c:Math.random()>0.5?'#8a6647':'#6d4d38'});
      // a volte argilla
      if(Math.random()<0.06 && G.aggiungi('argilla',1)){
        UI.toast('Argilla!','good','argilla'); SND.play('prendi');
      }
      if(window.TUT) TUT.notifica('zappa');
      return;
    }

    if(id==='annaffiatoio'){
      if(G.gelo){ p.usoT=260; UI.toast('L\'acqua è gelata: oggi non si annaffia.','bad'); return; }
      if(terr==='acqua'){ SND.play('acqua'); p.usoT=280; schizzo(tx,ty); return; }
      if(!suolo){ nonSiPuo("L'annaffiatoio serve sulla terra dissodata: prima passa la zappa."); return; }
      if(suolo.bagnato){ nonSiPuo('Questa terra è già bagnata. Domani avrà di nuovo sete.'); return; }
      if(!spendi(2 - liv*0.35)) return;
      p.usoT=300; SND.play('acqua');
      // area a seconda del livello
      const r = liv>=3?2:(liv>=2?1:0);
      for(let yy=ty-r; yy<=ty+r; yy++) for(let xx=tx-r; xx<=tx+r; xx++){
        if(!WORLD.dentro(m,xx,yy)) continue;
        const j=WORLD.idx(m,xx,yy);
        if(m.suolo[j] && !m.suolo[j].bagnato){
          m.suolo[j].bagnato=true;
          for(let k=0;k<3;k++) G.particelle.push({t:'goccia',
            x:xx*T+6+Math.random()*20, y:yy*T+6+Math.random()*14,
            vx:(Math.random()-0.5)*0.4, vy:0.5, g:0.03, vita:340, vitaMax:340});
        }
      }
      if(window.TUT) TUT.notifica('annaffia');
      return;
    }

    if(id==='ascia'){
      if(!o){ nonSiPuo("L'ascia serve su alberi, ceppi e rami caduti."); return; }
      if(o.t==='ramo'){
        m.obj[i]=null; G.aggiungi('legna', 1+((Math.random()*2)|0));
        SND.play('ascia'); G.xp('raccolta',3); p.usoT=260;
        UI.toast('Legna','good','legna');
        return;
      }
      if(o.t!=='albero' && o.t!=='ceppo'){ nonSiPuo("Con l'ascia si abbattono alberi e ceppi, non questo."); return; }
      if(!spendi(3 - liv*0.5)) return;
      p.usoT=320; SND.play('ascia');
      o.shake = 2.5;
      setTimeout(()=>{ if(o) o.shake=0; }, 260);
      schegge(tx,ty,'#8a6038');
      o.hp -= 1 + liv*0.6;
      if(o.hp<=0){
        SND.play('albero');
        const bonus = 1 + Math.floor(G.livello('raccolta')/DATA.BONUS.raccolta.legnaOgni);
        if(o.t==='ceppo'){
          m.obj[i]=null;
          G.aggiungi('legna', 3+bonus);
          UI.toast('+'+(3+bonus)+' Legna','good','legna');
        } else if(o.stage===2){
          m.obj[i]={t:'ceppo', hp:4, solido:true};
          G.aggiungi('legna', 6+bonus);
          UI.toast('+'+(6+bonus)+' Legna','good','legna');
          if(Math.random()<0.35) G.aggiungi('fibra',2);
          if(Math.random()<0.14){ G.aggiungi('linfa',1); UI.toast('Linfa d\'acero!','good','linfa'); }
          // semi d'albero
          if(Math.random()<0.2){
            const spot = trovaLibero(m,tx,ty,2);
            if(spot) m.obj[WORLD.idx(m,spot.x,spot.y)]={t:'albero',kind:o.kind,stage:0,hp:2,solido:true};
          }
          G.stats.alberi++;
        } else {
          m.obj[i]=null;
          G.aggiungi('legna', 2);
        }
        G.xp('raccolta', o.stage===2?14:5);
        for(let k=0;k<12;k++) G.particelle.push({t:'foglia',
          x:tx*T+16+(Math.random()-0.5)*30, y:ty*T+4+Math.random()*20,
          vx:(Math.random()-0.5)*1.2, vy:-0.5-Math.random(), g:0.014, r:Math.random()*6.3, vr:(Math.random()-0.5)*0.2,
          vita:1200, vitaMax:1200, c:G.stagione().tree});
      }
      return;
    }

    if(id==='piccone'){
      if(suolo && !suolo.crop && !o){
        m.suolo[i]=null; SND.play('zappa'); p.usoT=240; return;
      }
      /* Il piccone è anche il modo di togliere quello che si è posato:
         staccionate, cancelletti, lanterne, spaventapasseri. Prima lo
         faceva E, e lo faceva per sbaglio. */
      if(o && o.t==='mobile'){
        const it = idDaKind(o.kind);
        if(!G.puoiAggiungere(it,1)){ nonSiPuo('Lo zaino è pieno: prima fai posto.'); return; }
        if(!spendi(1)) return;
        m.obj[i]=null; G.aggiungi(it,1);
        p.usoT=280; SND.play('piccone');
        schegge(tx,ty,'#a8763c');
        UI.toast('+1 '+IT.nome(it),'good',it);
        return;
      }
      if(!o || (o.t!=='sasso' && o.t!=='stalagmite')){ nonSiPuo('Il piccone rompe sassi e rocce, e toglie le cose che hai posato. Sul terreno arato invece lo ripulisce.'); return; }
      if(!spendi(3 - liv*0.5)) return;
      p.usoT=320; SND.play('piccone');
      if(o.t==='stalagmite'){ m.obj[i]=null; G.aggiungi('pietra',2); G.xp('estrazione',4); return; }
      o.shake=2.5;
      setTimeout(()=>{ if(o) o.shake=0; }, 240);
      schegge(tx,ty,'#a8a29a');
      o.hp -= 1 + liv*0.6;
      if(o.hp<=0){
        SND.play('roccia');
        m.obj[i]=null;
        const lv=G.livello('estrazione');
        let drop, q=1;
        const BE = DATA.BONUS.estrazione;
        if(o.carbone){ drop='carbone'; q=1+(Math.random()<0.3?1:0); }
        else if(o.kind==='pietra'){ drop='pietra'; q=1+((Math.random()*2)|0)+(lv>=BE.pietraDa?1:0); }
        else { drop=o.kind; q=1+(Math.random()<BE.extraBase+lv*BE.extra?1:0); }
        G.aggiungi(drop,q);
        UI.toast('+'+q+' '+IT.nome(drop),'good',drop);
        G.xp('estrazione', o.kind==='pietra'?4:12);
        G.stats.sassi++;
        // geode → contenuto
        if(o.kind==='geode' && Math.random()<0.8){
          const tab=['quarzo','ametista','oro','gemma_luna'];
          const g=tab[Math.min(3,(Math.random()*4)|0)];
          if(Math.random()<0.12) { G.aggiungi('gemma_luna',1); UI.toast('Gemma di Luna!','gold','gemma_luna'); }
          else G.aggiungi(g,1);
        }
        for(let k=0;k<10;k++) G.particelle.push({t:'pietrisco',
          x:tx*T+16+(Math.random()-0.5)*22, y:ty*T+16+(Math.random()-0.5)*16,
          vx:(Math.random()-0.5)*1.6, vy:-0.8-Math.random()*0.8, g:0.055,
          vita:520, vitaMax:520, s:2, c:'#8a8580'});
      }
      return;
    }

    if(id==='falce'){
      if(!o){ nonSiPuo('La falce taglia erbacce, fiori e cespugli.'); return; }
      if(o.t==='erbaccia'||o.t==='fiori'){
        m.obj[i]=null; SND.play('zappa'); p.usoT=200;
        const n = 1 + (Math.random()< (0.25+G.livello('raccolta')*DATA.BONUS.raccolta.fibra) ? 1:0);
        G.aggiungi('fibra',n);
        G.xp('raccolta',2);
        for(let k=0;k<6;k++) G.particelle.push({t:'foglia',
          x:tx*T+16+(Math.random()-0.5)*18, y:ty*T+18,
          vx:(Math.random()-0.5)*1.1, vy:-0.6-Math.random()*0.5, g:0.02, r:Math.random()*6.3, vr:0.2,
          vita:700, vitaMax:700, c:'#7fae4a'});
        return;
      }
      if(o.t==='cespuglio'){
        if(o.bacche){
          o.bacche=false;
          const st=G.stagione().id;
          const f = DATA.CESPUGLIO[st];     // stessa tabella che usa il disegno
          G.aggiungi(f, 1+((Math.random()*2)|0));
          UI.toast(IT.nome(f),'good',f);
          G.xp('raccolta',5); SND.play('raccolta');
        } else {
          m.obj[i]=null; G.aggiungi('fibra',2); SND.play('zappa');
        }
        p.usoT=220;
        return;
      }
      return;
    }

    if(id==='canna'){
      if(terr!=='acqua'){ nonSiPuo("Devi essere rivolto verso l'acqua per lanciare la lenza."); return; }
      PESCA.avvia(tx,ty);
      return;
    }
    if(id==='arco'){ tiraDiArco(); return; }
    return;
  }

  /* --- SEMI --- */
  if(cat==='seme'){
    if(!suolo){ nonSiPuo('I semi vanno sulla terra dissodata: prima passa la zappa.'); return; }
    if(suolo.crop){ nonSiPuo('Qui sta già crescendo qualcosa.'); return; }
    const cropId = DATA.ITEMS[id].seme;
    const C = DATA.CROPS[cropId];
    const inSerra = G.mappaId==='podere' && dentroSerra(tx,ty);
    if(!inSerra && C.stagioni.indexOf(G.stagione().id)<0){
      UI.toast('Non è la stagione giusta per '+C.nome+'.','bad');
      SND.play('errore');
      return;
    }
    suolo.crop = { id:cropId, stage:0, gg:0 };
    suolo.appassita = false;        // la nuova semina ripulisce i resti secchi
    G.togli(id,1);
    SND.play('semina'); p.usoT=220;
    for(let k=0;k<5;k++) G.particelle.push({t:'terra',
      x:tx*T+10+Math.random()*12, y:ty*T+16+Math.random()*8,
      vx:(Math.random()-0.5)*0.5, vy:-0.4, g:0.03, vita:300, vitaMax:300, s:2, c:C.c1});
    if(window.TUT) TUT.notifica('semina');
    return;
  }

  /* --- CONCIME --- */
  if(DATA.ITEMS[id] && DATA.ITEMS[id].uso){
    if(!suolo){ nonSiPuo('Il concime va sulla terra dissodata.'); return; }
    if(suolo.concime){ nonSiPuo('Questa terra è già stata concimata.'); return; }
    suolo.concime = DATA.ITEMS[id].uso;
    G.togli(id,1);
    SND.play('semina'); p.usoT=200;
    UI.toast('Terreno migliorato.','good');
    return;
  }

  /* --- POSABILI --- */
  if(DATA.ITEMS[id] && DATA.ITEMS[id].posabile){
    if(!azionePossibile(id,tx,ty)){ nonSiPuo("Qui non ci sta: serve una casella libera, all'asciutto."); return; }
    posa(id, tx, ty);
    return;
  }

  /* --- CIBO: mangia --- */
  if(IT.commestibile(id)){
    G.mangia(G.slotSel);
    return;
  }
  nonSiPuo(IT.nome(id)+' non si usa così. Prova con <b>E</b>, o aprilo dallo zaino.');
}

function dentroSerra(tx,ty){
  if(!G.costruzioni.serra) return false;
  const sp = G.maps.podere.spazi.serra;
  return tx>=sp.x && tx<sp.x+sp.w && ty>=sp.y && ty<sp.y+sp.h;
}

function posa(id, tx, ty){
  const m=G.mappa();
  const i=WORLD.idx(m,tx,ty);
  const kind = DATA.ITEMS[id].posabile;
  if(kind==='sentiero'){
    m.g[i] = WORLD.ti('sentiero');
    REND.invalidaCasella(m.id, tx, ty);   // i raccordi vicini vanno ridisegnati
  } else if(kind==='cassa'){
    m.obj[i] = {t:'macchina', kind:'cassa', solido:true, slots:new Array(24).fill(null)};
  } else if(['barattoliera','botte','forno','fornace','arnia'].indexOf(kind)>=0){
    m.obj[i] = {t:'macchina', kind, solido:true, dentro:null, out:null, giorni:0, pronto:false};
  } else {
    m.obj[i] = {t:'mobile', kind, solido: kind!=='sentiero' && kind!=='cancelletto'};
    if(kind==='lanterna') m.obj[i].luce=true;
    if(kind==='spaventapasseri') m.obj[i].raggio=6;
    // il cancelletto lascia passare te e non le bestie
    if(kind==='cancelletto') m.obj[i].apribile=true;
  }
  G.togli(id,1);
  SND.play('costruisci');
}

function spendi(e){
  e = Math.max(0.4, e);
  if(G.energia < e){
    UI.toast('Sei troppo stanco. Mangia qualcosa o vai a dormire.','bad');
    SND.play('errore');
    return false;
  }
  G.energia -= e;
  G.aggiornaHUD();
  return true;
}
G.spendi = spendi;   // la chiama pesca.js: lanciare la lenza costa 3

function trovaLibero(m,x,y,r){
  for(let k=0;k<12;k++){
    const nx=x+((Math.random()*(r*2+1))|0)-r, ny=y+((Math.random()*(r*2+1))|0)-r;
    if(WORLD.libero(m,nx,ny) && WORLD.terreno(m,nx,ny)==='erba') return {x:nx,y:ny};
  }
  return null;
}

/* ===================================================================
   RACCOLTA
   =================================================================== */
function raccogliColtura(tx,ty,suolo){
  const C=DATA.CROPS[suolo.crop.id];
  const m=G.mappa();
  let n = 1;
  const lv = G.livello('agricoltura');
  if(suolo.concime==='concime' && Math.random()<0.35) n++;
  if(Math.random() < lv*DATA.BONUS.agricoltura.doppio) n++;
  if(C.forma==='bacca'||C.forma==='grappolo') n += (Math.random()<0.4?1:0);

  if(!G.puoiAggiungere(suolo.crop.id,n)){ UI.toast('Zaino pieno!','bad'); SND.play('errore'); return; }
  G.aggiungi(suolo.crop.id, n);
  G.stats.raccolti += n;
  SND.play('raccolta');
  G.xp('agricoltura', 8 + Math.floor(C.prezzo/12));
  UI.toast('+'+n+' '+C.nome, 'good', suolo.crop.id);
  particelleTesto(tx*T+16, ty*T, '+'+n, '#b6e06a');

  for(let k=0;k<8;k++) G.particelle.push({t:'stella',
    x:tx*T+16+(Math.random()-0.5)*20, y:ty*T+14+(Math.random()-0.5)*16,
    vx:(Math.random()-0.5)*0.8, vy:-0.5-Math.random()*0.5, g:0.01,
    vita:600, vitaMax:600, c:'#fff8d0'});

  if(C.ricresce){
    suolo.crop.stage = C.fasi.length - 1;
    suolo.crop.gg = 0;
    suolo.crop.ricrescita = C.ricresce;
  } else {
    suolo.crop = null;
  }
}

function raccogliForaggio(tx,ty,o){
  const m=G.mappa();
  const lv=G.livello('raccolta');
  let n = 1 + (Math.random()<lv*DATA.BONUS.raccolta.foraggio?1:0);
  if(!G.puoiAggiungere(o.item,n)){ UI.toast('Zaino pieno!','bad'); return; }
  m.obj[WORLD.idx(m,tx,ty)]=null;
  G.aggiungi(o.item,n);
  SND.play('raccolta');
  G.xp('raccolta', 7);
  UI.toast('+'+n+' '+IT.nome(o.item),'good',o.item);
  for(let k=0;k<6;k++) G.particelle.push({t:'stella',
    x:tx*T+16+(Math.random()-0.5)*16, y:ty*T+16,
    vx:(Math.random()-0.5)*0.6, vy:-0.5, g:0.01, vita:520, vitaMax:520, c:'#fff4c8'});
}

/* ===================================================================
   INTERAZIONE (E / clic destro)
   =================================================================== */
function interagisci(){
  const p=G.p, m=G.mappa();
  const px=(p.px/T)|0, py=(p.py/T)|0;

  // NPC vicino
  for(const n of G.npcVivi()){
    if(Math.hypot(n.px-p.px, n.py-p.py) < 46){ parlaCon(n); return; }
  }

  // il gatto, che non è un NPC ma nemmeno un oggetto
  const gatto = gattoVicino();
  if(gatto){ accarezzaGatto(gatto); return; }

  // caselle intorno
  const off=[[0,1],[-1,0],[1,0],[0,-1]][p.dir];
  const cand=[[px+off[0],py+off[1]],[px,py]];
  for(const [tx,ty] of cand){
    if(!WORLD.dentro(m,tx,ty)) continue;
    const i=WORLD.idx(m,tx,ty);
    const o=m.obj[i];
    if(!o) continue;

    if(o.t==='porta'){ apriPorta(o.ed); return; }
    if(o.t==='consegna'){ SOLSTIZIO.apriConsegna(); return; }

    /* --- arredi degli interni --- */
    if(o.t==='bancone'){
      if(o.uso==='bottega'){ SND.play('menu'); UI.negozio(G,'bruno'); }
      else { SND.play('menu'); apriLocanda(); }
      return;
    }
    if(o.t==='incudine'){ SND.play('menu'); UI.fucina(G); return; }
    if(o.t==='letto'){ UI.modal('Il letto', body=>{
        const n=document.createElement('div'); n.className='muted'; n.style.marginBottom='14px';
        n.innerHTML='Le lenzuola sanno di lavanda. Fuori è '+
          (G.ora>1080?'quasi notte':'ancora presto')+'.';
        body.appendChild(n);
        const b=document.createElement('button'); b.className='btn';
        b.textContent='Dormi (fine giornata)';
        b.onclick=()=>{ UI.chiudiModal(); dormi(); };
        body.appendChild(b);
      }); return; }
    if(o.t==='cucina'){
      if(G.costruzioni.casa2) UI.cucina(G);
      else UI.toast('Il focolare c\'è, ma serve una cucina vera: chiedi a Tobia l\'ampliamento.','bad');
      return;
    }
    if(o.t==='scrivania'){ SND.play('menu'); UI.diario(G,'lettere'); return; }
    if(o.t==='camino'){ UI.toast('Il fuoco scoppietta piano. Fa un bell\'effetto, stare qui.'); return; }
    if(o.t==='tavolo'){ UI.toast('Un tavolo di legno, segnato da anni di piatti.'); return; }
    if(o.t==='bancarella' && o.kiosk){
      SND.play('menu');
      if(o.kiosk==='bacheca') UI.diario(G, 'richieste');
      else if(o.kiosk==='mercante'){
        if(G.mercante && G.mercante.presente) UI.mercante(G);
        else UI.toast('Il banco è chiuso: il mercante non è in paese oggi.','bad');
      }
      return;
    }
    if(o.t==='macchina'){
      if(o.kind==='cassa'){ UI.cassa(G,o,tx,ty); return; }
      if(o.pronto){ G.ritiraMacchina(o); return; }
      UI.macchina(G,o,tx,ty); return;
    }
    /* Con E si raccoglieva quello che si era posato, e con E si sbaglia:
       uno cammina lungo la propria staccionata, preme E per parlare o
       per aprire qualcosa, e si ritrova un pezzo di recinto nello zaino
       e un buco nel recinto — senza nemmeno accorgersene, perché il
       messaggio diceva solo «Raccolto».

       Adesso E non tocca gli arredi e non blocca nemmeno il turno: si
       continua a cercare cos'altro c'è intorno. Per togliere una cosa
       posata ci vuole il piccone, che è un gesto che non si fa distratti. */
    if(o.t==='mobile'){
      if(o.kind==='spaventapasseri'){ UI.toast('Fa il suo lavoro in silenzio.'); return; }
      continue;
    }
    if(o.t==='pietra_rituale'){
      UI.toast('Rune consumate dal tempo. Sembrano aspettare qualcosa.');
      return;
    }
  }

  // muro di un edificio: prova la porta
  for(const [tx,ty] of cand){
    if(!WORLD.dentro(m,tx,ty)) continue;
    const o=m.obj[WORLD.idx(m,tx,ty)];
    if(o && o.t==='muro' && o.ed){ apriPorta(o.ed); return; }
  }

  // cartelli
  for(const d of m.deco){
    if(d.t==='cartello' && Math.abs(d.x-px)<=1 && Math.abs(d.y-py)<=1 && d.testo){
      UI.toast(d.testo); return;
    }
  }
}

/* ===================================================================
   SPOSTARE QUELLO CHE SI È POSATO

   Il podere cambia mentre ci giochi: amplii la casa, costruisci la
   serra, e la fila di casse che avevi messo davanti alla porta adesso è
   in mezzo ai piedi. Finora l'unico modo era raccogliere e riposare, e
   per una cassa non si poteva nemmeno fare — sarebbe tornata
   nell'inventario portandosi via quello che c'era dentro.

   Quindi non si raccoglie: si *sposta*. L'oggetto resta lo stesso
   oggetto — con il suo contenuto, il suo nome, la sua lavorazione a
   metà — e cambia solo casella.
   =================================================================== */
G.spostamento = null;      // { obj, mappa, x, y }

G.iniziaSpostamento = function(o, x, y){
  const m = G.mappa();
  G.spostamento = { obj:o, mappa:m.id, x, y };
  m.obj[WORLD.idx(m,x,y)] = null;
  SND.play('prendi');
  UI.toast('Scegli dove metterlo. Esc per rimetterlo dov\'era.', 'good');
};

G.annullaSpostamento = function(){
  const s = G.spostamento;
  if(!s) return false;
  const m = G.maps[s.mappa];
  if(m && !m.obj[WORLD.idx(m,s.x,s.y)]) m.obj[WORLD.idx(m,s.x,s.y)] = s.obj;
  G.spostamento = null;
  UI.prompt(null);
  UI.toast('Rimesso dov\'era.');
  return true;
};

G.posaSpostamento = function(tx, ty){
  const s = G.spostamento;
  if(!s) return false;
  const m = G.mappa();
  const i = WORLD.idx(m,tx,ty);
  const terr = WORLD.terreno(m,tx,ty);
  if(!WORLD.dentro(m,tx,ty) || m.obj[i] || m.suolo[i] ||
     terr==='acqua' || terr==='roccia' || terr==='vuoto'){
    nonSiPuo('Qui non ci sta: serve una casella libera, senza acqua e senza terra dissodata.');
    return false;
  }
  m.obj[i] = s.obj;
  G.spostamento = null;
  SND.play('costruisci');
  UI.prompt(null);
  UI.toast('Spostato.','good');
  return true;
};

/* Il nome di una cassa, che si legge da fuori. «Cassa» e poi «Cassa» e
   poi «Cassa» non aiuta nessuno a ricordarsi dove sono i semi. */
G.nomeCassa = function(o){
  return (o && typeof o.nome === 'string' && o.nome.trim()) ? o.nome.trim() : 'Cassa';
};

/* Riordinare dentro una cassa, con lo stesso gesto dello zaino. Una
   cassa che si riempie nell'ordine in cui ci butti dentro le cose è un
   mucchio, non un deposito. */
G.spostaInCassa = function(obj, da, a){
  if(!obj || !obj.slots) return false;
  if(da===a || da<0 || a<0 || da>=obj.slots.length || a>=obj.slots.length) return false;
  const x = obj.slots[da], y = obj.slots[a];
  if(!x) return false;
  if(y && y.id===x.id && IT.cat(x.id)!=='attrezzo'){
    y.n += x.n; obj.slots[da] = null;
  } else {
    obj.slots[da] = y || null; obj.slots[a] = x;
  }
  return true;
};

/* Mette in ordine da sola: prima per categoria, poi per nome. Con
   ventiquattro caselle a mano ci si mette più tempo a sistemarle che a
   riempirle. */
G.ordinaCassa = function(obj){
  if(!obj || !obj.slots) return false;
  const ORDINE = ['attrezzo','seme','raccolto','foraggio','pesce','minerale','materiale','animale','cibo','artigianato'];
  const roba = obj.slots.filter(Boolean);
  // prima si fondono le pile sparse dello stesso oggetto
  const fuse = [];
  for(const s of roba){
    const g = fuse.find(f=>f.id===s.id && IT.cat(s.id)!=='attrezzo');
    if(g) g.n += s.n; else fuse.push({id:s.id, n:s.n});
  }
  fuse.sort((a,b)=>{
    const ca = ORDINE.indexOf(IT.cat(a.id)), cb = ORDINE.indexOf(IT.cat(b.id));
    if(ca !== cb) return (ca<0?99:ca) - (cb<0?99:cb);
    return IT.nome(a.id).localeCompare(IT.nome(b.id), 'it');
  });
  for(let i=0;i<obj.slots.length;i++) obj.slots[i] = fuse[i] || null;
  return true;
};

/* ===================================================================
   PROMPT CONTESTUALE
   Dice cosa fa E su quello che hai davanti. Prima bisognava indovinare
   che porte, casse, macchine e bacheche fossero interattive.
   =================================================================== */
const NOMI_PORTA = {
  casa:'entra in casa', bottega:'entra in bottega', locanda:'entra nella locanda',
  fucina:'entra nella fucina', santuario:'entra nel Santuario',
  pollaio:'entra nel pollaio', serra:'entra nella serra',
  // qui dentro non si entra: meglio non prometterlo
  serafina:'bussa da Serafina', eremita:'bussa dall\'eremita'
};

function etichettaInterazione(o){
  if(G.spostamento) return null;      // ha già il suo messaggio
  if(!o) return null;
  if(o.t==='porta' || (o.t==='muro' && o.ed)){
    const ed = o.ed;
    if(!ed) return null;
    if(NOMI_PORTA[ed.azione]) return NOMI_PORTA[ed.azione];
    return ed.nome || null;            // porte chiuse: solo il nome, senza promesse
  }
  if(o.t==='consegna')  return 'cassa di consegna';
  if(o.t==='bancarella' && o.kiosk)
    return o.kiosk==='bacheca' ? 'bacheca delle richieste' : 'banco del mercante';
  if(o.t==='macchina'){
    if(o.kind==='cassa')  return 'apri: '+G.nomeCassa(o);
    if(o.pronto && o.out) return 'ritira: '+IT.nome(o.out);
    if(o.dentro)          return 'in lavorazione…';
    return 'usa: '+IT.nome(idDaKind(o.kind));
  }
  // gli arredi con E non si toccano più: l'etichetta prometterebbe il falso
  if(o.t==='mobile') return null;
  if(o.t==='pietra_rituale') return 'esamina le rune';
  return null;
}

function promptContestuale(){
  // la pesca usa già il prompt per conto suo
  if(PESCA.inCorso() || G.p.dorme) return;
  if(UI.modalAperta() || UI.dialogoAttivo()){ UI.prompt(null); return; }

  const p=G.p, m=G.mappa();
  if(!m) return;

  for(const n of G.npcVivi()){
    if(Math.hypot(n.px-p.px, n.py-p.py) < 46){
      const N = DATA.NPCS[n.id];
      UI.prompt('<kbd>E</kbd> parla con '+(N ? N.nome : 'qualcuno'));
      return;
    }
  }

  if(gattoVicino()){
    UI.prompt('<kbd>E</kbd> accarezza ' + (G.nomeGatto() || 'il gatto'));
    return;
  }

  const px=(p.px/T)|0, py=(p.py/T)|0;
  const off=[[0,1],[-1,0],[1,0],[0,-1]][p.dir];
  for(const [tx,ty] of [[px+off[0],py+off[1]],[px,py]]){
    if(!WORLD.dentro(m,tx,ty)) continue;
    const et = etichettaInterazione(m.obj[WORLD.idx(m,tx,ty)]);
    if(et){ UI.prompt('<kbd>E</kbd> '+et); return; }
  }
  UI.prompt(null);
}

function idDaKind(kind){
  for(const id in DATA.ITEMS) if(DATA.ITEMS[id].posabile===kind) return id;
  return 'legna';
}

/* Le porte che hanno una stanza vera ci fanno entrare. Le altre
   continuano a rispondere come prima. */
const RIENTRO = { int_casa:[8,10], int_bottega:[10,11], int_fucina:[9,11], int_locanda:[11,13] };

function apriPorta(ed){
  if(!ed) return;
  SND.play('porta');

  const interno = WORLD.INTERNI[ed.azione];
  if(interno && G.maps[interno]){
    const p = RIENTRO[interno];
    $('#fade').classList.add('on');
    setTimeout(()=>{
      cambiaMappa(interno, p[0], p[1]);
      setTimeout(()=>$('#fade').classList.remove('on'), 120);
    }, 220);
    return;
  }

  switch(ed.azione){
    case 'casa': apriCasa(); break;
    case 'bottega': UI.negozio(G,'bruno'); break;
    case 'locanda': apriLocanda(); break;
    case 'fucina': UI.fucina(G); break;
    case 'santuario': SOLSTIZIO.apriSantuario(); break;
    case 'serafina': UI.dialogo('serafina', ['La porta è socchiusa, ma Serafina è fuori, nell\'orto.']); break;
    case 'eremita': UI.dialogo('eremita', ['La porta di legno è chiusa. L\'eremita sarà fuori, da qualche parte sulla neve.']); break;
    case 'pollaio': apriPollaio(); break;
    case 'serra': UI.toast('La serra è calda e umida. Qui puoi coltivare tutto l\'anno.'); break;
    default: UI.toast('È chiuso.'); break;
  }
}

function apriCasa(){
  UI.modal('Casa', body=>{
    const n=document.createElement('div'); n.className='muted'; n.style.marginBottom='14px';
    n.innerHTML = 'Il camino è acceso. Sul tavolo, la teiera di tua nonna.<br>'+
                  `Sono le <b>${Math.floor(G.ora/60)}:${String(Math.floor(G.ora%60/10)*10).padStart(2,'0')}</b>.`;
    body.appendChild(n);

    const bd=document.createElement('button'); bd.className='btn'; bd.style.marginBottom='8px';
    bd.textContent='Vai a dormire (fine giornata)';
    bd.onclick=()=>{ UI.chiudiModal(); dormi(); };
    body.appendChild(bd);

    if(G.costruzioni.casa2){
      const bc=document.createElement('button'); bc.className='btn blue'; bc.style.marginBottom='8px';
      bc.textContent='Usa la cucina';
      bc.onclick=()=>{ UI.chiudiModal(); UI.cucina(G); };
      body.appendChild(bc);
    }

    const bl=document.createElement('button'); bl.className='btn blue';
    bl.textContent='Leggi le lettere di Nonna Ilde';
    bl.onclick=()=>{ UI.chiudiModal(); UI.diario(G); };
    body.appendChild(bl);
  });
}

function apriPollaio(){
  const galline = G.animali.filter(a=>a.tipo==='gallina');
  UI.modal('Pollaio', body=>{
    const n=document.createElement('div'); n.className='muted'; n.style.marginBottom='12px';
    n.textContent = galline.length
      ? `${galline.length} gallina/e. Sembrano contente.`
      : 'Vuoto. Compra qualche gallina da Bruno.';
    body.appendChild(n);
    if(galline.length){
      const b=document.createElement('button'); b.className='btn';
      b.textContent='Accarezza le galline';
      b.onclick=()=>{
        SND.play('gallina');
        UI.toast('Le galline sono felici.','good');
        for(const g of galline) g.felice = Math.min(100,(g.felice||50)+12);
        for(let k=0;k<6;k++) G.particelle.push({t:'cuoricino',
          x:G.p.px+(Math.random()-0.5)*40, y:G.p.py-20-Math.random()*20,
          vx:(Math.random()-0.5)*0.3, vy:-0.5, g:0, vita:900, vitaMax:900, c:'#e04a63'});
        UI.chiudiModal();
      };
      body.appendChild(b);
    }
  });
}

/* ===================================================================
/* ===================================================================
   ATTO SECONDO — LA NOTTE DEL SOLSTIZIO — sta in solstizio.js.
   Qui resta solo l'aggancio: quel file si carica prima che G esista,
   e queste quattro le chiamano l'agenda, il diario e il risveglio.
   =================================================================== */
G.eSeraDiVeglia        = SOLSTIZIO.eSeraDiVeglia;
G.aggiornaOspitiVeglia = SOLSTIZIO.aggiornaOspitiVeglia;
G.memorieAvute         = SOLSTIZIO.memorieAvute;
G.invitatiAllaVeglia   = SOLSTIZIO.invitatiAllaVeglia;

/* ===================================================================
   NPC
   =================================================================== */
/* ===================================================================
   AGENDE — dove si trova un abitante a quest'ora
   =================================================================== */
const METEO_BRUTTO = { pioggia:1, temporale:1, neve:1 };
const AL_RIPARO = { dentro:true, riparo:true };   // oggetto unico: viene chiesto a ogni frame

/* la fascia di agenda in corso, tenendo conto del tempo che fa */
/* il giorno della sagra l'agenda salta: tutti in piazza dalle 9 a sera */
const FASCE_SAGRA = {};
for(const id in {bruno:1,tobia:1,marisol:1,elio:1,serafina:1}) FASCE_SAGRA[id]=null;

/* Stessa cosa per la sera della veglia. Stava scritta con l'atto secondo,
   ma è una memo che serve solo qui — la gemella di FASCE_SAGRA, due righe
   sopra — e con l'atto secondo se ne sarebbe andata in un altro file
   lasciando la sua unica lettrice indietro. */
const FASCE_VEGLIA = {};

G.fasciaAgenda = function(id){
  /* La sera della veglia l'agenda si mette da parte: dal tramonto in poi
     quei sei stanno alla radura, e basta. */
  const postiVeglia = DATA.POSTI_VEGLIA;    // era un alias in cima all'atto secondo
  if(G.eSeraDiVeglia() && postiVeglia[id] && G.ora>=1020){
    if(!FASCE_VEGLIA[id]) FASCE_VEGLIA[id] = { fino:1440, giro:postiVeglia[id], coperto:true, veglia:true };
    return FASCE_VEGLIA[id];
  }
  if(G.eGiornoDiSagra() && POSTI_SAGRA[id] && G.ora>=540 && G.ora<1320){
    if(!FASCE_SAGRA[id]) FASCE_SAGRA[id] = { fino:1320, giro:POSTI_SAGRA[id], coperto:true, sagra:true };
    return FASCE_SAGRA[id];
  }
  const A = DATA.AGENDE[id];
  if(!A) return null;
  let f = A[A.length-1];
  for(const s of A){ if(G.ora < s.fino){ f = s; break; } }
  // col brutto tempo chi non è al coperto rientra
  if(f && f.giro && !f.coperto && METEO_BRUTTO[G.meteo]) return AL_RIPARO;
  return f;
};

/* è in casa (o al riparo) e quindi non si vede in giro? */
G.npcAlChiuso = function(id){
  const f = G.fasciaAgenda(id);
  return !!(f && (f.dentro || f.interno));
};

/* Quando la fascia dice `interno`, l'abitante non sparisce: è dentro
   quella stanza, e chi ci entra lo trova lì. È la differenza fra un
   paese che chiude e un paese che si sposta.
   Lo facciamo entrando e uscendo dall'elenco `npc` della stanza, così
   tutto quello che già c'era — camminata, animazione, dialogo — continua
   a funzionare senza sapere niente degli interni. */
function sincronizzaInterni(m){
  if(!m || !m.interno) return;
  if(!m.npc) m.npc = [];
  for(const id of (m.npcInterno||[])){
    const f = G.fasciaAgenda(id);
    const ciSta = !!(f && f.interno === m.id);
    const i = m.npc.findIndex(n=>n.id===id);
    if(ciSta && i<0){
      const posti = (m.postiInterni && m.postiInterni[id]) || [[m.w>>1, m.h>>1]];
      const x = posti[0][0], y = posti[0][1];
      // px/py subito: chi entra nella stanza dev'essere già in piedi al
      // primo fotogramma, non al secondo
      m.npc.push({ id, x, y, giro:posti,
                   px:x*T+16, py:y*T+24, dir:0, frame:0, animT:0,
                   wait:Math.random()*2000 });
    } else if(!ciSta && i>=0){
      m.npc.splice(i,1);
    }
  }
}

G.npcVivi = function(){
  const m=G.mappa();
  if(!m) return [];
  if(m.interno){
    sincronizzaInterni(m);
    return m.npc || [];          // se sono nell'elenco, è perché ci devono stare
  }
  return (m.npc||[]).filter(n=>{
    if(n.richiedePonte && !G.costruzioni.ponte) return false;
    if(G.npcAlChiuso(n.id)) return false;      // dorme, o è dentro da qualche parte
    return true;
  });
};

/* oggi è il compleanno di qualcuno? */
G.compleannoOggi = function(id){
  const c = DATA.COMPLEANNI[id];
  return !!(c && c.stagione===G.stagione().id && c.giorno===G.giorno);
};
G.festeggiatoOggi = function(){
  for(const id in DATA.COMPLEANNI) if(G.compleannoOggi(id)) return id;
  return null;
};

function aggiornaNPC(dt){
  const m=G.mappa();
  sincronizzaInterni(m);
  for(const n of (m.npc||[])){
    if(n.px===undefined){ n.px = n.x*T+16; n.py = n.y*T+24; n.dir=0; n.frame=0; n.animT=0; n.wait=Math.random()*3000; }

    const fascia = G.fasciaAgenda(n.id);
    if(n.fisso || (fascia && fascia.fisso)){
      n.frame=0;
      n.emote = (G.braci<4 && n.id==='fiammella') ? '!' : null;
      continue;
    }
    /* Al chiuso continua a esistere, ma lo teniamo davanti a casa sua:
       quando riesce non deve comparire dall'altra parte del paese.
       Se però la stanza è proprio questa, allora è a casa sua: cammina. */
    if(fascia && (fascia.dentro || (fascia.interno && fascia.interno !== m.id))){
      const posto = (fascia.giro && fascia.giro[0]) || [n.x, n.y];
      n.px = posto[0]*T+16; n.py = posto[1]*T+24;
      n.dest = null; n.frame = 0; n.emote = null;
      continue;
    }
    /* cambio di fascia: si rimette in marcia verso il posto nuovo */
    const giro = (fascia && fascia.giro) || n.giro;
    if(n.fasciaPrec !== fascia){ n.fasciaPrec = fascia; n.dest = null; n.wait = Math.random()*900; }

    n.wait -= dt;
    if(n.wait>0){ n.frame=0; continue; }
    if(!n.dest){
      const g = giro[(Math.random()*giro.length)|0];
      n.dest = {x:g[0]*T+16, y:g[1]*T+24};
    }
    const dx=n.dest.x-n.px, dy=n.dest.y-n.py;
    const d=Math.hypot(dx,dy);
    if(d<3){ n.dest=null; n.wait=2200+Math.random()*5200; n.frame=0; continue; }
    const spd = 0.5*dt/16;
    const nx = n.px+dx/d*spd, ny=n.py+dy/d*spd;
    if(!WORLD.solido(m,(nx/T)|0,(ny/T)|0)){ n.px=nx; n.py=ny; }
    else { n.dest=null; n.wait=800; }
    if(Math.abs(dx)>Math.abs(dy)) n.dir = dx<0?1:2; else n.dir = dy<0?3:0;
    n.animT += dt;
    if(n.animT>170){ n.animT=0; n.frame=(n.frame+1)%4; }
    // emote se non gli hai ancora parlato oggi
    n.emote = (!G.parlatoOggi[n.id] && Math.hypot(n.px-G.p.px,n.py-G.p.py)<160) ? '!' : null;
  }
}

/* ===================================================================
   COSA DICE OGGI
   Le battute generiche restano il fondo, ma prima si guarda se c'è
   qualcosa di più pertinente da dire: il compleanno, la stagione, il
   tempo che fa, l'ora. Così chi passa ogni giorno — che è quello che il
   gioco chiede — non risente le stesse cinque frasi per mesi.
   =================================================================== */
function battutaDelGiorno(id, cuori){
  const N = DATA.NPCS[id];
  const C = (DATA.CONTESTO||{})[id];
  const pool = [];

  // il compleanno ha la precedenza su tutto
  if(G.compleannoOggi(id) && DATA.AUGURI && DATA.AUGURI[id]) return DATA.AUGURI[id];
  // poi la sagra, che è il secondo giorno speciale dell'anno
  if(G.eGiornoDiSagra() && DATA.FESTA && DATA.FESTA[id]){
    const f = DATA.FESTA[id];
    return f[(Math.random()*f.length)|0];
  }

  if(C){
    const st = G.stagione().id;
    if(C.stagione && C.stagione[st]) pool.push(...C.stagione[st]);
    if(C.meteo && C.meteo[G.meteo])  pool.push(...C.meteo[G.meteo]);
    if(C.ora){
      if(G.ora < 660 && C.ora.mattina) pool.push(...C.ora.mattina);
      else if(G.ora > 1020 && C.ora.sera) pool.push(...C.ora.sera);
    }
  }
  // con l'amicizia alta entrano anche le battute confidenziali
  if(cuori>=6 && N.amico) pool.push(...N.amico, ...N.amico);
  // e sempre il fondo generico, così non diventa ripetitivo al contrario
  pool.push(...N.battute);
  return pool[(Math.random()*pool.length)|0];
}

/* Ogni tanto un amico stretto ti mette qualcosa in mano: piccolo, ma
   cambia il senso del passare a salutare. */
function forseUnRegalo(id){
  if(G.regaloRicevuto && G.regaloRicevuto[id]===G.giornoTot) return null;
  const cuori = Math.floor((G.amicizia[id]||0)/100);
  if(cuori < 4 || Math.random() > 0.16) return null;
  const doni = {
    bruno:   ['seme_rapa','seme_patata','fibra'],
    serafina:['viola','lavanda','fungo_porcino'],
    tobia:   ['pietra','carbone','rame'],
    marisol: ['zuppa_contadina','pane_miele','frittata'],
    elio:    ['carpa','pesce_sole','gambero'],
    eremita: ['bacca_inverno','quarzo','radice_gelata']
  }[id];
  if(!doni) return null;
  const dono = doni[(Math.random()*doni.length)|0];
  if(!G.puoiAggiungere(dono,1)) return null;
  if(!G.regaloRicevuto) G.regaloRicevuto={};
  G.regaloRicevuto[id]=G.giornoTot;
  G.aggiungi(dono,1);
  SND.play('regalo');
  UI.toast(DATA.NPCS[id].nome+' ti ha regalato '+IT.nome(dono)+'.','gold',dono);
  return dono;
}

function parlaCon(n){
  const N = DATA.NPCS[n.id];
  const cuori = Math.floor((G.amicizia[n.id]||0)/100);
  const righe = [ battutaDelGiorno(n.id, cuori) ];

  if(!G.parlatoOggi[n.id]){
    G.parlatoOggi[n.id]=true;
    G.amicizia[n.id]=(G.amicizia[n.id]||0)+12;
    G.progresso();
    forseUnRegalo(n.id);
  }

  const scelte=[];
  /* L'atto secondo passa dai dialoghi: prima la testimonianza, poi
     l'invito. Vanno in cima perché sono la cosa che il giocatore sta
     cercando quando apre quel dialogo. */
  if(SOLSTIZIO.memoriaDi(n.id))    scelte.push({testo:'✦ Quella notte, dodici anni fa', azione:()=>SOLSTIZIO.raccontaMemoria(n.id)});
  if(SOLSTIZIO.puoiInvitare(n.id)) scelte.push({testo:'🕯️ Vieni alla veglia al Santuario', azione:()=>SOLSTIZIO.invitaAllaVeglia(n.id)});
  if(n.id==='bruno') scelte.push({testo:'🛒 Vorrei comprare qualcosa', azione:()=>UI.negozio(G,'bruno')});
  if(n.id==='tobia') scelte.push({testo:'🔨 Parliamo di attrezzi', azione:()=>UI.fucina(G)});
  if(n.id==='marisol'){
    const t=G.trame.torta;
    if(t.avviata && !t.fatta) scelte.push({testo:'💛 La torta di Ilde', azione:()=>STORIE.tortaMarisol()});
    else if(!t.avviata && cuori>=2) scelte.push({testo:'💛 Mi parli di Nonna Ilde?', azione:()=>STORIE.avviaTortaIlde()});
    scelte.push({testo:'🍲 Cosa c\'è di buono?', azione:()=>UI.negozio(G,'marisol')});
    scelte.push({testo:'📖 Insegnami una ricetta', azione:()=>STORIE.insegnaRicetta()});
  }
  if(n.id==='serafina'){
    const t=G.trame.torta;
    if(t.avviata && !t.segreto && !t.fatta) scelte.push({testo:'💛 Il segreto della torta di Ilde', azione:()=>STORIE.tortaSerafina()});
    scelte.push({testo:'🌿 Parlami della valle', azione:()=>STORIE.loreSerafina()});
  }
  if(n.id==='elio'){
    const t=G.trame.pesceluna;
    if(t.avviata && !t.fatta) scelte.push({testo:'🌙 Il Pesce Luna', azione:()=>STORIE.pescelunaElio()});
    else if(!t.avviata && cuori>=2) scelte.push({testo:'🌙 Parlami del Pesce Luna', azione:()=>STORIE.avviaPesceLuna()});
    scelte.push({testo:'🎣 Consigli sulla pesca?', azione:()=>STORIE.consigliPesca()});
  }
  if(n.id==='eremita'){
    if(!G.sacaccia && !G.lezioneCaccia)
      scelte.push({testo:'🏹 Cos\'è quell\'arco?', azione:()=>STORIE.offriLezioneCaccia(cuori)});
    else if(G.lezioneCaccia)
      scelte.push({testo:'🏹 Sono qui per la lezione', azione:()=>STORIE.riprendiLezioneCaccia()});
    else
      scelte.push({testo:'🏹 Parlami di caccia', azione:()=>STORIE.consigliCaccia()});
  }
  /* Fiammella sta a due passi dalla porta, quindi premendo E si parla
     con lei e non si entra: questa scelta è la via vera per il
     santuario, e deve passare da `apriSantuario` come la porta. Andava
     dritta a `UI.santuario`, e la sera della veglia avrebbe aperto le
     offerte invece della veglia. */
  if(n.id==='fiammella') scelte.push({testo:'✦ Il santuario', azione:()=>SOLSTIZIO.apriSantuario()});

  if(!G.regalatoOggi[n.id]) scelte.push({testo:'🎁 Ho un regalo per te', azione:()=>UI.regalo(G,n.id)});
  scelte.push({testo:'Ci vediamo!', azione:()=>{}});

  UI.dialogo(n.id, righe, {scelte});
}

/* ===================================================================
   LA LEZIONE DI ORESTE e LE CATENE NARRATIVE — stanno in storie.js.
   =================================================================== */

G.regala = function(npcId, idx){
  const s=G.inv[idx];
  if(!s) return;
  const N=DATA.NPCS[npcId];
  let punti = 25, reaz='piace';
  if(N.regali.ama.indexOf(s.id)>=0){ punti=110; reaz='ama'; }
  else if(N.regali.piace.indexOf(s.id)>=0){ punti=60; reaz='piace'; }
  else if(IT.prezzo(s.id)<=6){ punti=-15; reaz='no'; }
  else if(IT.cat(s.id)==='pesce' && DATA.ITEMS[s.id] && DATA.ITEMS[s.id].spazzatura){ punti=-30; reaz='no'; }

  // nel giorno del compleanno qualunque pensiero vale il triplo
  const festa = G.compleannoOggi(npcId);
  if(festa && punti>0) punti *= 3;

  G.togliSlot(idx,1);
  G.regalatoOggi[npcId]=true;
  G.amicizia[npcId]=Math.max(0,(G.amicizia[npcId]||0)+punti);
  if(punti>0) G.stats.regali=(G.stats.regali||0)+1;

  const risposte = festa && punti>0
    ? ['Te lo sei ricordato. Non me lo aspettavo, e invece te lo sei ricordato.',
       'Un regalo, oggi. Guarda, mi hai fatto una festa vera.']
    : {
    ama:['Ma è… è proprio quello che speravo. Grazie davvero.','Non ci posso credere. Lo tengo da conto.'],
    piace:['Che pensiero gentile. Grazie!','Oh, mi piace. Sei una brava persona.'],
    no:['…grazie? Immagino.','Lo apprezzo. Credo. Sì.']
  }[reaz];

  SND.play(punti>0?'regalo':'errore');
  if(punti>0){
    for(let k=0;k<8;k++) G.particelle.push({t:'cuoricino',
      x:G.p.px+(Math.random()-0.5)*44, y:G.p.py-16-Math.random()*24,
      vx:(Math.random()-0.5)*0.35, vy:-0.55-Math.random()*0.2, g:0,
      vita:1100, vitaMax:1100, c:reaz==='ama'?'#e04a63':'#f08a9a'});
  }
  UI.dialogo(npcId, [risposte[(Math.random()*risposte.length)|0]]);
};

/* ===================================================================
   ANIMALI
   =================================================================== */
G.aggiungiGallina = function(){
  const sp = G.maps.podere.spazi.pollaio;
  G.animali.push({
    tipo:'gallina', mappa:'podere',
    px:(sp.x+1+Math.random()*3)*T, py:(sp.y+5+Math.random()*2)*T,
    dir:1, wait:0, felice:50, uovo:true
  });
};

/* ===================================================================
   IL GATTO

   C'era dal primo giorno e non si poteva toccare. Girava attorno al
   giocatore a cinque caselle di distanza, disegnato bene, e finiva lì:
   le galline si accarezzano dal pollaio, lui no. Per un gioco che parla
   di una valle da riavvicinare, l'unico animale che ti sceglie era
   arredamento.

   Adesso è l'unica cosa del podere che non si compra, non si costruisce
   e non si sblocca con le monete: si guadagna tornando. Una carezza al
   giorno — di più non conta, perché la fiducia di un gatto non si
   accelera — e a ogni soglia si avvicina di una casella. Il nome arriva
   solo alla fine, e non lo scegli tu: glielo aveva già dato Ilde.
   =================================================================== */
const GATTO_NOME = 'Cenere';

/* Le soglie. `r` è il raggio in cui gironzola attorno a te: cinque
   caselle sono "ti tengo d'occhio", una è "sono sul tuo piede". */
const GATTO_FASI = [
  { da:0,  r:5, frasi:['Si lascia sfiorare la schiena, poi si sposta di un passo.',
                       'Ti annusa la mano e decide che va bene così.',
                       'Resta fermo giusto il tempo di farsi toccare.'] },
  { da:20, r:4, frasi:['Fa le fusa un momento, poi finge di non averlo fatto.',
                       'Si struscia contro lo stivale e se ne va soddisfatto.'] },
  { da:45, r:3, frasi:['Fa le fusa forte. Non si sposta.',
                       'Si rotola sulla schiena e ti guarda a testa in giù.'] },
  { da:70, r:2, frasi:['Ti viene incontro prima ancora che ti fermi.',
                       'Fa le fusa appoggiandoti la testa sulla gamba.'] },
  { da:90, r:1, frasi:['Ti cammina fra i piedi come se il podere fosse suo. E in fondo lo è.',
                       'Si accuccia accanto a te e chiude gli occhi.'] }
];

function faseGatto(){
  const a = (G.gatto && G.gatto.affetto) || 0;
  let f = GATTO_FASI[0];
  for(const x of GATTO_FASI) if(a >= x.da) f = x;
  return f;
}

/* Come si chiama, se ha già un nome. Prima di allora è «il gatto». */
G.nomeGatto = ()=> (G.gatto && G.gatto.nome) || null;

function gattoVicino(){
  for(const a of G.animali){
    if(a.tipo!=='gatto' || a.mappa!==G.mappaId) continue;
    if(Math.hypot(a.px-G.p.px, a.py-G.p.py) < 42) return a;
  }
  return null;
}

function accarezzaGatto(a){
  if(!G.gatto) G.gatto = { affetto:0, giorno:-1, nome:null };
  const g = G.gatto;
  const chi = g.nome || 'Il gatto';

  SND.play('gatto');
  a.dest = null; a.wait = 2200;          // si ferma un attimo a farsi accarezzare

  /* Una sola volta al giorno conta. Le altre carezze non sono un errore
     — accarezzare il gatto è sempre lecito — quindi rispondono lo
     stesso, ma senza far salire niente: se salisse, bastava restare lì
     un minuto a premere E per avere tutto in un pomeriggio. */
  if(g.giorno === G.giornoTot){
    UI.toast(chi + ' ne ha avuto abbastanza, per oggi.','hint');
    for(let k=0;k<3;k++) G.particelle.push({t:'cuoricino',
      x:a.px+(Math.random()-0.5)*20, y:a.py-14-Math.random()*10,
      vx:(Math.random()-0.5)*0.25, vy:-0.45, g:0, vita:800, vitaMax:800, c:'#f08a9a'});
    return;
  }

  const prima = faseGatto();
  g.giorno = G.giornoTot;
  g.affetto = Math.min(100, g.affetto + 6);
  const dopo = faseGatto();

  for(let k=0;k<7;k++) G.particelle.push({t:'cuoricino',
    x:a.px+(Math.random()-0.5)*26, y:a.py-16-Math.random()*16,
    vx:(Math.random()-0.5)*0.3, vy:-0.5, g:0, vita:1000, vitaMax:1000, c:'#e04a63'});

  UI.toast(chi + ': ' + dopo.frasi[(Math.random()*dopo.frasi.length)|0]);
  G.progresso();

  if(dopo !== prima) particelleTesto(a.px, a.py-30, 'si fida di più', '#f0a8b8');

  /* Il nome. Non è un premio da inventario: è la cosa che Ilde non ha
     fatto in tempo a dirti, e arriva quando il gatto ha smesso di essere
     randagio. Una volta sola, e da lì in poi ce l'ha. */
  if(!g.nome && g.affetto >= 70){
    g.nome = GATTO_NOME;
    setTimeout(()=>{
      UI.lettera('gatto');
    }, 1400);
  }
}
function aggiornaAnimali(dt){
  for(const a of G.animali){
    if(a.mappa!==G.mappaId) continue;
    a.wait -= dt;
    if(a.wait>0) continue;
    if(!a.dest){
      const m=G.maps[a.mappa];
      let base;
      /* il gatto gira attorno a te, e più si fida più stretto: il raggio
         è la sua confidenza, non un numero fisso */
      if(a.tipo==='gatto'){ base={x:(G.p.px/T)|0, y:(G.p.py/T)|0, r:faseGatto().r}; }
      else {
        const sp=G.maps.podere.spazi.pollaio;
        base={x:sp.x+2, y:sp.y+5, r:4};
      }
      const nx=base.x+((Math.random()*base.r*2)|0)-base.r;
      const ny=base.y+((Math.random()*base.r*2)|0)-base.r;
      if(WORLD.dentro(m,nx,ny) && !WORLD.solidoPerBestie(m,nx,ny)) a.dest={x:nx*T+16,y:ny*T+20};
      else { a.wait=900; continue; }
    }
    const dx=a.dest.x-a.px, dy=a.dest.y-a.py, d=Math.hypot(dx,dy);
    if(d<4){ a.dest=null; a.wait=1200+Math.random()*3400; continue; }
    const spd=(a.tipo==='gatto'?0.42:0.3)*dt/16;
    a.px+=dx/d*spd; a.py+=dy/d*spd;
    a.dir = dx<0?-1:1;
  }
}

/* ===================================================================
   CACCIA

   Non c'era niente da inventare: la fauna esisteva già e si comportava
   già bene — conigli e cervi girano, e scappano quando ti avvicini
   troppo. Mancava solo un modo per raggiungerli da lontano, che è poi
   tutta la caccia: avvicinarsi abbastanza senza farsi sentire, e non
   sbagliare il tiro.

   Regole, in ordine di importanza:
   — si tira in avanti, dentro un cono; non si mira col mouse a
     trecentosessanta gradi, altrimenti non conta più da che parte sei
     girato e sparisce l'unica cosa che rende la caccia un mestiere;
   — la gittata cresce col livello dell'arco, la mira col livello
     dell'abilità: uno lo compri, l'altra te la guadagni;
   — un colpo mancato fa scappare tutto quello che c'è intorno. Sbagliare
     deve costare, altrimenti si tira a caso finché non va bene.
   =================================================================== */
const GITTATA = 210;          // portata dell'arco semplice, in pixel
const CONO = 0.62;            // mezzo angolo del cono di tiro, in radianti
const COSTO_TIRO = 4;

/* La preda più conveniente davanti a te: la più vicina dentro il cono. */
function predaMirata(){
  if(!window.MOBS) return null;
  const p = G.p;
  const liv = G.attrezziLiv.arco || 0;
  const portata = GITTATA + liv*55;
  const versoX = [0,-1,1,0][p.dir], versoY = [1,0,0,-1][p.dir];
  let scelta = null, vicina = Infinity;
  for(const b of MOBS.lista()){
    if(!MOBS.ePreda(b)) continue;
    const dx = b.x - p.px, dy = (b.y - b.z) - p.py;
    const d = Math.hypot(dx, dy);
    if(d > portata || d < 1) continue;
    // dentro al cono davanti a te?
    const cos = (dx*versoX + dy*versoY) / d;
    if(cos < Math.cos(CONO)) continue;
    if(d < vicina){ vicina = d; scelta = b; }
  }
  return scelta;
}

/* Ci prendi? Più sei lontano e più è dura; il livello di Caccia rimedia. */
function colpisce(distanza){
  const liv = G.livello('caccia');
  const liva = G.attrezziLiv.arco || 0;
  const portata = GITTATA + liva*55;
  const vicinanza = 1 - (distanza / portata);          // 1 addosso, 0 al limite
  const prob = 0.42 + vicinanza*0.40 + liv*DATA.BONUS.caccia.mira + liva*0.05;
  return Math.random() < Math.min(0.95, prob);
}

function tiraDiArco(){
  if(!G.sacaccia){
    nonSiPuo('Hai un arco ma non sai ancora cosa farne. Oreste, sul Passo, insegna.');
    return;
  }
  const p = G.p;
  const preda = predaMirata();
  if(!preda){
    nonSiPuo('Niente da tirare, qui davanti. La selvaggina sta nel bosco, e sente da lontano.');
    return;
  }
  if(!spendi(COSTO_TIRO)) return;
  p.usoT = 340;
  SND.play('lancio');

  const dx = preda.x - p.px, dy = (preda.y - preda.z) - p.py;
  const d = Math.hypot(dx, dy);
  freccia(p.px, p.py-16, preda.x, preda.y - preda.z);

  if(!colpisce(d)){
    MOBS.spaventa(preda.x, preda.y, 190);
    UI.toast('La freccia passa alta. Sono già lontani.','bad');
    G.xp('caccia', 2);                 // si impara anche sbagliando, poco
    return;
  }

  const esito = MOBS.abbatti(preda);
  if(!esito) return;
  SND.play('pesceOk');
  MOBS.spaventa(preda.x, preda.y, 150);
  for(const b of esito.bottino){
    if(G.aggiungi(b.id, b.n)) UI.toast('+'+b.n+' '+IT.nome(b.id), 'good', b.id);
    else UI.toast('Zaino pieno: qualcosa è rimasto lì.','bad');
  }
  G.xp('caccia', esito.xp);
  G.stats.prede = (G.stats.prede||0) + 1;
  particelleTesto(preda.x, preda.y-30, 'Presa!', '#e8c07a');
  if(G.lezioneCaccia) STORIE.avanzaLezioneCaccia('colpito');
}

/* la freccia: solo una scia, ma serve a far capire dov'è andata */
function freccia(x0,y0,x1,y1){
  const passi = 7;
  for(let i=0;i<passi;i++){
    const t = i/passi;
    G.particelle.push({ t:'pietrisco',
      x: x0+(x1-x0)*t, y: y0+(y1-y0)*t,
      vx:0, vy:0, g:0, vita:150+i*22, vitaMax:150+i*22, s:2, c:'#e8dcc0' });
  }
}

/* ===================================================================
   PESCA — sta in pesca.js.
   =================================================================== */

/* ===================================================================
   MACCHINE
   =================================================================== */
G.outputMacchina = function(kind, id){
  if(kind==='fornace') return 'lingotto_'+id;
  if(kind==='barattoliera') return 'conserva:'+id;
  if(kind==='botte') return (DATA.FRUTTA.indexOf(id)>=0 ? 'vino:' : 'succo:')+id;
  return id;
};

G.caricaMacchina = function(obj, id){
  if(G.conta(id)<1) return;
  G.togli(id,1);
  if(obj.kind==='fornace'){
    if(G.conta('carbone')<1){ UI.toast('Serve del carbone.','bad'); G.aggiungi(id,1); return; }
    G.togli('carbone',1);
  }
  obj.dentro=id;
  obj.out=G.outputMacchina(obj.kind, id);
  obj.giorni = obj.kind==='botte'?4:(obj.kind==='fornace'?1:2);
  obj.pronto=false;
  SND.play('costruisci');
  UI.toast('In lavorazione…','good');
};

G.ritiraMacchina = function(obj){
  if(!obj.pronto||!obj.out) return;
  if(!G.puoiAggiungere(obj.out,1)){ UI.toast('Zaino pieno.','bad'); return; }
  G.aggiungi(obj.out,1);
  SND.play('prendi');
  UI.toast(IT.nome(obj.out)+' pronto!','gold',obj.out);
  obj.pronto=false; obj.out=null; obj.dentro=null; obj.giorni=0;
};

/* ===================================================================
   CRAFTING / COSTRUZIONI
   =================================================================== */
G.puoiCraftare = function(r){
  for(const k in r.ing) if(G.conta(k) < r.ing[k]) return false;
  return true;
};
G.crafta = function(r, tipo){
  if(!G.puoiCraftare(r)) return;
  for(const k in r.ing) G.togli(k, r.ing[k]);
  const n = r.out||1;
  G.aggiungi(r.id, n);
  if(tipo==='cucina') G.stats.piatti=(G.stats.piatti||0)+n;
  SND.play(tipo==='cucina'?'raccolta':'costruisci');
  UI.toast((n>1?n+'× ':'')+IT.nome(r.id)+(tipo==='cucina'?' pronto!':' creato!'),'good',r.id);
  G.aggiornaHUD();
};

G.puoiCostruire = function(c){
  if(G.oro < c.costo) return false;
  for(const k in c.ing) if(G.conta(k) < c.ing[k]) return false;
  return true;
};
G.costruisci = function(c){
  if(!G.puoiCostruire(c)) return;
  G.oro -= c.costo;
  for(const k in c.ing) G.togli(k, c.ing[k]);
  G.costruzioni[c.id]=true;
  WORLD.costruisci(G.maps, c.id);
  REND.invalidaTerreno();      // ponte e serra cambiano il terreno
  if(c.id==='silo') G.invMax = Math.min(36, G.invMax+12);
  SND.play('costruisci');
  UI.toast(c.nome+' costruito!','gold');
  G.aggiornaHUD();
  if(c.id==='ponte'){
    setTimeout(()=>UI.dialogo('serafina',[
      'Il ponte è in piedi. Tobia lavora bene quando lo si paga.',
      'Lo trovi sul burrone, nel bosco a est: scavalcalo e sei nella radura. Vacci di giorno, la prima volta.'
    ]), 400);
  }
};

G.potenzia = function(att){
  const liv = G.attrezziLiv[att]||0;
  const u = DATA.UPGRADE[att][liv];
  if(!u) return;
  const k = Object.keys(u.ing)[0], q = u.ing[k];
  if(G.oro<u.costo || G.conta(k)<q) return;
  G.oro -= u.costo; G.togli(k,q);
  G.attrezziLiv[att]=liv+1;
  SND.play('costruisci');
  UI.toast(IT.nome(att)+' '+DATA.UPG_NOMI[liv+1]+'!','gold',att);
  G.aggiornaHUD();
};

/* ===================================================================
   SANTUARIO
   =================================================================== */
G.offri = function(bid, req, silenzioso){
  if(G.conta(req)<1) return;
  G.togli(req,1);
  if(!G.santuarioDato[bid]) G.santuarioDato[bid]=[];
  if(G.santuarioDato[bid].indexOf(req)<0) G.santuarioDato[bid].push(req);
  if(!silenzioso) SND.play('magia');
  const B = DATA.SANTUARIO.find(b=>b.id===bid);
  if(B && G.santuarioDato[bid].length>=B.req.length){
    setTimeout(()=>G.completaBrace(bid), 300);
  }
};

G.completaBrace = function(bid){
  const B = DATA.SANTUARIO.find(b=>b.id===bid);
  if(!B || G.santuario[bid]) return;
  // controlla che ci siano tutti
  const dati = G.santuarioDato[bid]||[];
  for(const r of B.req){
    if(dati.indexOf(r)<0){
      if(G.conta(r)<1) return;
      G.togli(r,1); dati.push(r);
    }
  }
  G.santuarioDato[bid]=dati;
  G.santuario[bid]=true;
  G.braci++;
  G.oro += B.premio.oro;
  G.aggiungi(B.premio.item,1);
  UI.chiudiModal();
  SND.play('brace');

  // esplosione di luce
  const cx = G.p.px, cy = G.p.py-20;
  for(let k=0;k<70;k++){
    const a=Math.random()*6.283, v=0.6+Math.random()*2.4;
    G.particelle.push({t:'stella', x:cx, y:cy,
      vx:Math.cos(a)*v, vy:Math.sin(a)*v-0.4, g:0.004,
      vita:1800, vitaMax:1800, c:B.colore});
  }

  setTimeout(()=>{
    const testi = {
      primavera:['La nicchia si accende di verde. Il calore ti arriva alle mani prima che agli occhi.',
                 'Fuori, da qualche parte, un ramo si apre di colpo.'],
      estate:['Oro. La seconda nicchia brucia d\'oro, e per un attimo l\'aria sa di grano caldo.',
              'Fiammella non dice niente. Ti guarda e basta.'],
      autunno:['Rosso e fumo. La terza brace scoppietta come un camino di novembre.',
               '"Ne manca una" dice Fiammella. "E quella è la tua."'],
      inverno:['Azzurro. L\'ultima brace non scalda: illumina.',
               'La Lanterna del Solstizio si accende tutta insieme, e il bosco intorno si vede fino in fondo.',
               'Fiammella chiude gli occhi. È la prima volta che la vedi ferma.']
    }[bid];
    UI.dialogo('fiammella', testi, { fine:()=>{
      UI.toast('+'+B.premio.oro+' monete','gold');
      G.aggiornaHUD();
      const lettera = bid;
      if(DATA.LETTERE[lettera] && !G.lettere[lettera]){
        G.lettere[lettera]=true;
        setTimeout(()=>UI.lettera(lettera, ()=>{ if(G.braci>=4) SOLSTIZIO.invitoAttoSecondo(); }), 600);
      } else if(G.braci>=4) SOLSTIZIO.invitoAttoSecondo();
    }});
  }, 1600);
};

function finale(){
  setTimeout(()=>{
    UI.modal('La Lanterna del Solstizio', body=>{
      body.innerHTML = `
        <div class="muted" style="font-size:15.5px;line-height:1.85;font-style:italic">
        La valle di Fioralba è accesa.<br><br>
        Non è successo niente di spettacolare: nessun tuono, nessun coro.
        Sei persone in piedi attorno a una nicchia, al freddo, che non sapevano
        bene dove mettere le mani.<br><br>
        Bruno ha strappato una pagina dal registro e l'ha lasciata sulla pietra:
        dodici anni di una coperta di lana mai pagata, chiusi senza dire niente.
        Marisol aveva portato da mangiare per quindici. Elio è arrivato a piedi.
        Oreste è sceso dal Passo per la seconda volta quest'anno.<br><br>
        Serafina è arrivata per ultima. Si è fermata dove si era fermata
        quella notte, e poi ha fatto altri due passi.<br><br>
        La mattina dopo l'erba era di un verde che nessuno ricordava, e la
        Lanterna era ancora accesa — <b>senza che nessuno la stesse tenendo</b>.
        Questa è l'unica cosa davvero nuova, ed è tutto.<br><br>
        Tu hai chiuso la porta di casa piano, perché cigola.<br><br>
        <b>Il podere è tuo. La valle, un po' anche.</b><br><br>
        <span style="font-size:13px;opacity:.75">
        La partita continua: puoi coltivare, costruire e vivere qui quanto vuoi.
        </span>
        </div>`;
      const b=document.createElement('button'); b.className='btn gold'; b.style.marginTop='16px';
      b.textContent='Continua a vivere a Fioralba';
      b.onclick=()=>UI.chiudiModal();
      body.appendChild(b);
    });
    SND.play('magia');
  }, 800);
}
G.finale = finale;   // la chiama solstizio.js, in fondo alla veglia

/* ===================================================================
   MANGIARE
   =================================================================== */
G.mangia = function(idx){
  const s=G.inv[idx];
  if(!s) return;
  const e=IT.energia(s.id);
  if(!e){ UI.toast('Non si mangia.','bad'); return; }
  G.energia = Math.min(G.energiaMax, G.energia+e);
  G.togliSlot(idx,1);
  SND.play('raccolta');
  UI.toast('+'+e+' energia','good');
  particelleTesto(G.p.px, G.p.py-42, '+'+e, '#b6e06a');
  for(let k=0;k<6;k++) G.particelle.push({t:'stella',
    x:G.p.px+(Math.random()-0.5)*20, y:G.p.py-24,
    vx:(Math.random()-0.5)*0.5, vy:-0.5, g:0.005, vita:700, vitaMax:700, c:'#b6e06a'});
  G.aggiornaHUD();
};

/* A che ora lo si trova in una certa stanza.

   Sapere che Tobia non c'è serve a metà: la domanda vera è quando
   tornare. L'orario sta già scritto nell'agenda — una fascia va dal
   `fino` di quella prima al proprio — e basta leggerlo invece di
   scriverlo un'altra volta a mano, che poi si scorda di aggiornarsi. */
function oreMinuti(m){
  const h = Math.floor(m/60), min = m%60;
  return h + (min ? ':'+String(min).padStart(2,'0') : '');
}

G.orarioInterno = function(id, mappaId){
  const A = DATA.AGENDE[id];
  if(!A) return null;
  const fasce = [];
  let da = 0;
  for(const f of A){
    if(f.interno === mappaId) fasce.push([da, f.fino]);
    da = f.fino;
  }
  if(!fasce.length) return null;
  // fasce attaccate: si leggono come una sola
  const unite = [fasce[0]];
  for(let i=1;i<fasce.length;i++){
    const u = unite[unite.length-1];
    if(fasce[i][0] === u[1]) u[1] = fasce[i][1];
    else unite.push(fasce[i]);
  }
  return unite.map(([a,b])=>'dalle '+oreMinuti(a)+' alle '+oreMinuti(b)).join(' e ');
};

/* Dove si trova adesso uno che non è nella stanza in cui sei entrato.
   Serve a distinguere «è chiuso» da «è rotto». */
function doveSta(id){
  const f = G.fasciaAgenda(id);
  if(!f) return 'è in giro';
  if(f.dentro) return G.ora>1200||G.ora<420 ? 'sta dormendo' : 'è in casa sua';
  if(f.interno && G.maps[f.interno]) return 'è ' + (f.interno==='int_locanda' ? 'alla locanda'
                                                  : 'in ' + G.maps[f.interno].nome.toLowerCase());
  return 'è fuori, in paese';
}

/* Entrare in una stanza vuota senza che niente lo spieghi non sembra un
   orario di chiusura: sembra un difetto del gioco. La bottega e la
   fucina restano usabili lo stesso — il bancone e l'incudine funzionano
   anche col padrone fuori — ma bisogna dirlo, altrimenti chi entra alle
   nove di mattina pensa che la stanza non si sia caricata. */
function chiCeDentro(m){
  if(!m || !m.interno || !m.npcInterno || !m.npcInterno.length) return null;
  const presenti = m.npcInterno.filter(id=>{
    const f = G.fasciaAgenda(id);
    return !!(f && f.interno === m.id);
  });
  if(presenti.length === 1) return DATA.NPCS[presenti[0]].nome + ' è qui.';
  if(presenti.length > 1){
    const nomi = presenti.map(id=>DATA.NPCS[id].nome);
    const ultimo = nomi[nomi.length-1];
    const e = /^[eE]/.test(ultimo) ? 'ed' : 'e';     // «ed Elio», non «e Elio»
    return nomi.slice(0,-1).join(', ') + ' ' + e + ' ' + ultimo + ' sono qui.';
  }
  const padrone = m.npcInterno[0];
  const orario = G.orarioInterno(padrone, m.id);
  return 'Non c\'è nessuno: ' + DATA.NPCS[padrone].nome + ' ' + doveSta(padrone) + '.' +
         (orario ? ' Lo trovi qui ' + orario + '.' : '');
}

/* ===================================================================
   CAMBIO MAPPA
   =================================================================== */
function cambiaMappa(id, tx, ty){
  const dest = G.maps[id];
  if(!dest) return;
  const pos = WORLD.vicinoLibero(dest, tx, ty);
  G.mappaId = id;
  if(id==='bosco')        G.stats.visitatoBosco=true;
  else if(id==='grotta')  G.stats.visitatoGrotta=true;
  else if(id==='fioralba')G.stats.visitatoPaese=true;
  if(!G.visitati) G.visitati={};
  G.visitati[id]=true;   // per il viaggio rapido dalla mappa
  G.p.px = pos.x*T+16;
  G.p.py = pos.y*T+20;
  G.progresso();
  mouseWorld=null;
  MOBS.reset();          // la fauna di una mappa non segue nell'altra
  aggiornaCamera(true);
  musicaGiusta();
  SND.ambiente(ambienteGiusto());
  const chi = chiCeDentro(dest);
  UI.toast(chi ? dest.nome + ' — ' + chi : dest.nome);
}

/* punti d'arrivo del viaggio rapido (casella camminabile per ogni luogo) */
const ARRIVO_RAPIDO = {
  podere:[8,10], fioralba:[4,16], bosco:[21,3], grotta:[17,26],
  montagna:[20,34], piazza:[20,4], spiaggia:[23,3]
};
G.viaggiaRapido = function(id){
  if(!G.maps[id] || id===G.mappaId) return false;
  if(!G.visitati || !G.visitati[id]) return false;   // solo luoghi già scoperti
  const a = ARRIVO_RAPIDO[id] || [8,10];
  $('#fade').classList.add('on');
  setTimeout(()=>{
    cambiaMappa(id, a[0], a[1]);
    setTimeout(()=>$('#fade').classList.remove('on'), 120);
  }, 260);
  return true;
};

/* Come il viaggio rapido, ma senza le due regole che lì servono: si va
   anche dove non si è mai stati e anche negli interni. Esiste per il
   pannello di debug, ed è qui e non lì perché i punti d'arrivo buoni —
   ARRIVO_RAPIDO per i luoghi aperti, RIENTRO per le quattro stanze —
   sono scritti in questo file: un pannello che se li ricopiasse
   comincerebbe a mentire il giorno che una stanza cambia forma. */
G.teletrasporta = function(id){
  if(!G.maps[id]) return false;
  const a = ARRIVO_RAPIDO[id] || RIENTRO[id] || [8,10];
  cambiaMappa(id, a[0], a[1]);
  return true;
};

G.dormi = dormi;   // il pannello di debug salta la notte da qui

function musicaGiusta(){
  const m=G.mappa();
  if(!m.esterno){ SND.musica('grotta'); return; }
  const notte = G.ora>1080 || G.ora<400;
  if(notte){ SND.musica('notte'); return; }
  SND.musica(m.musica==='paese' ? 'paese' : G.stagione().id);
}

function ambienteGiusto(){
  const m=G.mappa();
  if(!m.esterno) return 'goccia';
  if(G.meteo==='pioggia') return 'pioggia';
  if(G.meteo==='temporale') return 'temporale';
  if(G.meteo==='vento') return 'vento';
  const notte = G.ora>1080 || G.ora<380;
  if(notte) return G.stagioneIdx===1 ? 'grilli' : null;
  return 'uccelli';
}

/* ===================================================================
   ANDARE A DORMIRE
   Le due porte per la notte: il letto e lo svenimento. La giornata che
   si chiude davvero è `nuovoGiorno`, più in basso.
   =================================================================== */
function dormi(){
  if(G.p.dorme) return;
  G.p.dorme = true;
  SND.play('dormi');
  $('#fade').classList.add('on');
  setTimeout(()=>{ nuovoGiorno(false); }, 1100);
}

function sveniamo(){
  if(G.p.dorme) return;
  G.p.dorme = true;
  const multa = Math.min(1000, Math.floor(G.oro*0.08));
  G.oro -= multa;
  SND.play('errore');
  $('#fade').classList.add('on');
  setTimeout(()=>{
    nuovoGiorno(true, multa);
  }, 1100);
}

/* ===================================================================
   LA POSTA

   Le lettere erano sei: l'apertura, le quattro delle braci e la ricetta.
   Ma le braci arrivano dopo il ponte, e il ponte costa 3000 monete: fra
   la prima lettera e la seconda passava mezza partita con la cassetta
   vuota, e chi apriva il Diario vedeva un elenco da una riga sola.

   Queste otto sono agganciate a cose che si fanno comunque. La
   condizione la si legge dallo stato che c'è già: non si aggiungono
   contatori nuovi, così le vecchie partite si trovano subito in pari.

   L'ordine dell'elenco è l'ordine di consegna, e ne arriva **una per
   mattina**: otto lettere tutte insieme non sono un racconto, sono un
   fascicolo. =================================================================== */
const POSTA = [
  { id:'paese',          quando:()=> !!G.stats.visitatoPaese },
  { id:'bosco',          quando:()=> !!G.stats.visitatoBosco },
  { id:'primo_raccolto', quando:()=> (G.stats.raccolti||0) >= 1 },
  { id:'miniera',        quando:()=> !!G.stats.visitatoGrotta },
  { id:'primo_pesce',    quando:()=> (G.stats.pesci||0) >= 1 },
  { id:'prima_stagione', quando:()=> (G.giornoTot||0) > DATA.GIORNI_STAGIONE },
  { id:'amicizia',       quando:()=> Object.keys(G.amicizia||{}).some(k=>(G.amicizia[k]||0) >= 100) },
  { id:'ponte',          quando:()=> !!G.costruzioni.ponte }
];

/* Restituisce la prossima lettera dovuta, o null. Non consegna niente:
   così la si può interrogare anche da un controllo, senza effetti. */
G.postaDovuta = function(){
  for(const p of POSTA){
    if(G.lettere[p.id]) continue;
    if(!DATA.LETTERE[p.id]) continue;    // lettera tolta dai dati: si salta
    if(p.quando()) return p.id;
  }
  return null;
};

function consegnaPosta(ritardo){
  const id = G.postaDovuta();
  if(!id) return false;
  G.lettere[id] = true;
  const da = DATA.LETTERE[id].da || 'Nonna Ilde';
  setTimeout(()=>{
    UI.toast('📬 C\'è posta per te: una lettera da ' + da + '.','gold');
    SND.play('regalo');
    setTimeout(()=>UI.lettera(id), 900);
  }, ritardo||0);
  return true;
}

/* ===================================================================
   FINE GIORNATA
   Centottantatré righe che stavano sotto l'intestazione «LA POSTA»,
   perché sono cresciute lì sotto una riga per volta: la vendita della
   cassa, l'avanzamento della data, i campi che crescono, il meteo, il
   mercato, le richieste, la sagra, il mercante, gli eventi notturni.
   La posta vera sono le quattordici righe qui sopra. Chi cercava «dove
   finisce la giornata» non lo trovava, e chi contava le dipendenze di
   «LA POSTA» ne trovava tredici e la credeva inseparabile.
   =================================================================== */
function nuovoGiorno(svenuto, multa){
  /* --- vendita cassa di consegna --- */
  const voci=[]; let tot=0;
  for(const s of G.cassaConsegna){
    const p = G.prezzoVendita(s.id)*s.n;
    voci.push({id:s.id, n:s.n, tot:p});
    tot += p;
  }
  G.oro += tot;
  if(tot > 0) G.registraVendita(tot);
  G.cassaConsegna = [];

  /* --- avanzamento data --- */
  G.giorno++; G.giornoTot++; G.stats.giorniGiocati++;
  let cambioStagione=false;
  if(G.giorno > DATA.GIORNI_STAGIONE){
    G.giorno=1;
    G.stagioneIdx=(G.stagioneIdx+1)%4;
    cambioStagione=true;
    if(G.stagioneIdx===0) G.anno++;
  }
  G.ora = 360;
  G.energia = svenuto ? G.energiaMax*0.55 : G.energiaMax;
  G.parlatoOggi={}; G.regalatoOggi={};

  /* --- meteo --- */
  G.meteo = G.meteoDomani || tiraMeteo();
  G.meteoDomani = tiraMeteo();

  /* --- colture --- */
  const stag = G.stagione().id;

  /* --- gelo invernale: fiume e pozzo gelati per un giorno --- */
  G.gelo = (stag==='inverno' && G.meteo==='neve' && Math.random()<0.5);
  /* --- mercato dinamico: oggi un prodotto vale di più --- */
  G.mercato = scegliMercato();
  /* --- bacheca: aggiorna le richieste degli abitanti --- */
  const richInfo = aggiornaRichieste();
  /* --- sagra di stagione: nuova a ogni cambio stagione --- */
  let nuovaSagra=false;
  if(!G.sagra || G.sagra.stagione !== stag){ G.sagra = creaSagra(); nuovaSagra = (G.giornoTot>0); }
  /* --- mercante ambulante: passa ogni 7 giorni --- */
  if(G.giornoTot>0 && G.giornoTot % 7 === 0){ G.mercante = { presente:true, giorno:G.giornoTot, stock:stockMercante() }; }
  else if(G.mercante){ G.mercante.presente=false; }

  for(const mid in G.maps){
    const m=G.maps[mid];
    if(!m.coltivabile) continue;
    for(let i=0;i<m.suolo.length;i++){
      const s=m.suolo[i];
      if(!s) continue;
      const x=i%m.w, y=(i/m.w)|0;
      const inSerra = dentroSerra(x,y);
      const piove = (G.meteo==='pioggia'||G.meteo==='temporale');

      if(s.crop){
        const C=DATA.CROPS[s.crop.id];
        // fuori stagione → appassisce
        if(cambioStagione && !inSerra && C.stagioni.indexOf(stag)<0){
          s.crop=null; s.appassita=true;
          continue;
        }
        const bagnata = s.bagnato || piove || inSerra;
        if(bagnata){
          if(s.crop.ricrescita){
            s.crop.gg++;
            if(s.crop.gg >= s.crop.ricrescita){ s.crop.stage=C.fasi.length; s.crop.gg=0; }
          } else if(s.crop.stage < C.fasi.length){
            s.crop.gg++;
            const need = C.fasi[Math.min(s.crop.stage, C.fasi.length-1)];
            const veloce = (s.concime==='concime' && Math.random()<0.3)
                         || (G.meteo==='temporale' && Math.random()<0.28); // il temporale spinge la crescita
            if(s.crop.gg >= need || veloce){ s.crop.stage++; s.crop.gg=0; }
          }
        }
      }
      // asciugatura — la Terra Umida trattiene l'acqua tre volte su quattro
      if(piove || inSerra) s.bagnato = true;
      else if(!(s.concime==='ritenzione' && Math.random()<0.75)) s.bagnato = false;
    }
  }

  /* --- macchine --- */
  for(const mid in G.maps){
    const m=G.maps[mid];
    for(const o of m.obj){
      if(!o || o.t!=='macchina') continue;
      if(o.kind==='arnia'){
        o.gg=(o.gg||0)+1;
        if(o.gg>=4 && !o.pronto){ o.pronto=true; o.out='miele'; o.gg=0; }
        continue;
      }
      if(o.dentro && !o.pronto){
        o.giorni--;
        if(o.giorni<=0){ o.pronto=true; }
      }
    }
  }

  /* --- animali: uova --- */
  let uova=0;
  for(const a of G.animali){
    if(a.tipo!=='gallina') continue;
    a.felice = Math.min(100, (a.felice||50) + (G.meteo==='pioggia'?-4:3));
    if(Math.random() < 0.75 + a.felice*0.002){
      uova++;
      if(a.felice>92 && Math.random()<0.06) G.aggiungi('uovo_oro',1);
      else G.aggiungi('uovo',1);
    }
  }

  /* --- mondo --- */
  WORLD.nuovoGiorno(G.maps, stag, (G.giornoTot*7919+13)>>>0);

  /* --- evento notturno casuale (applica subito l'effetto sul mondo) --- */
  const eventoNotte = tiraEventoNotte(cambioStagione);

  /* --- eventi/lore --- */
  const eventi=[];
  if(uova) eventi.push({t:'uova', n:uova});
  if(cambioStagione) eventi.push({t:'stagione'});

  /* --- presentazione --- */
  UI.daycard(G, true);
  G.aggiornaHUD();
  costruisciHotbar();
  musicaGiusta();
  SND.ambiente(ambienteGiusto());

  setTimeout(()=>{
    $('#fade').classList.remove('on');
    SND.play('sveglia');
    setTimeout(()=>{
      UI.daycard(G, false);
      G.p.dorme=false;
      // riporta a casa
      if(G.mappaId!=='podere'){ G.mappaId='podere'; }
      G.p.px=8*T+16; G.p.py=9*T+20;
      aggiornaCamera(true);

      if(svenuto){
        UI.toast('Ti sei svegliato dolorante. Qualcuno ti ha riportato a casa (−'+multa+' monete).','bad');
      }
      if(cambioStagione){
        UI.toast('È arrivata la '+G.stagione().nome+'.','gold');
      }
      if(uova) UI.toast(uova+' uovo/a dal pollaio.','good','uovo');

      // avviso di gelo
      if(G.gelo) setTimeout(()=>UI.toast('Gelata forte: fiume e pozzo sono ghiacciati per oggi.','bad'), 700);
      // evento della notte
      if(eventoNotte) setTimeout(()=>UI.toast(eventoNotte.msg, eventoNotte.tipo||undefined, eventoNotte.icona), 1000);
      // mercato del giorno
      if(G.mercato) setTimeout(()=>UI.toast('Mercato di oggi: '+IT.nome(G.mercato.item)+' vale ×'+G.mercato.mult+' da Bruno e alla cassa.','gold', G.mercato.item), 1400);
      // bacheca delle richieste
      if(richInfo && richInfo.nuove)   setTimeout(()=>UI.toast('📋 Nuove richieste degli abitanti: guarda il Diario (J).','gold'), 1800);
      if(richInfo && richInfo.scadute) setTimeout(()=>UI.toast(richInfo.scadute+(richInfo.scadute===1?' richiesta è scaduta.':' richieste sono scadute.'),'bad'), 2100);
      // sagra e mercante
      if(nuovaSagra) setTimeout(()=>UI.toast('🎪 È tempo della '+G.sagra.nome+': consegna i prodotti di stagione dal Diario!','gold'), 2400);
      if(G.mercante && G.mercante.presente) setTimeout(()=>UI.toast('🛒 Il mercante ambulante è in paese, oggi alla Locanda.','gold'), 2700);
      // la posta arriva col mattino, una lettera per volta
      consegnaPosta(3300);
      // compleanni: una casella del calendario che prima era vuota
      const festeggiato = G.festeggiatoOggi();
      if(festeggiato) setTimeout(()=>UI.toast('🎂 Oggi è il compleanno di '+DATA.NPCS[festeggiato].nome+
        '. Un regalo, oggi, vale il triplo.','gold'), 3000);
      // il giorno della festa il paese si raduna in piazza
      aggiornaOspitiSagra();
      // e la sera della veglia si raduna alla radura
      SOLSTIZIO.aggiornaOspitiVeglia();
      if(G.eGiornoDiSagra()) setTimeout(()=>UI.toast('🎪 Oggi è il giorno della '+G.sagra.nome+
        ': il paese è tutto in piazza a Fioralba.','gold'), 3300);

      if(voci.length){
        setTimeout(()=>UI.riepilogo(G, voci, tot, dopoRisveglio), 500);
      } else {
        dopoRisveglio();
      }
      G.salva();
    }, 900);
  }, 1900);
}

function dopoRisveglio(){
  UI.toast(DATA.RISVEGLI[(Math.random()*DATA.RISVEGLI.length)|0]);
  // primo accesso al bosco → dialogo di Serafina
  if(G.stats.giorniGiocati===2 && !G.introSerafina){
    G.introSerafina=true;
    setTimeout(()=>UI.dialogo('serafina',[
      'Ti ho visto arrivare l\'altro ieri. Non ti ho salutato perché stavo parlando con un rovo.',
      'Sono Serafina. Sto nel bosco, a sud del tuo campo.',
      'Ilde ti ha lasciato più di un podere, sai. Quando vorrai saperne di più, passa.'
    ]), 900);
  }
}

function tiraMeteo(){
  const st=G.stagione().id;
  const r=Math.random();
  if(st==='inverno'){
    if(r<0.42) return 'neve';
    if(r<0.55) return 'nuvoloso';
    if(r<0.62) return 'vento';
    return 'sereno';
  }
  if(st==='primavera'){
    if(r<0.26) return 'pioggia';
    if(r<0.33) return 'temporale';
    if(r<0.48) return 'nuvoloso';
    return 'sereno';
  }
  if(st==='estate'){
    if(r<0.14) return 'pioggia';
    if(r<0.20) return 'temporale';
    if(r<0.30) return 'nuvoloso';
    return 'sereno';
  }
  // autunno
  if(r<0.24) return 'pioggia';
  if(r<0.30) return 'temporale';
  if(r<0.42) return 'vento';
  if(r<0.56) return 'nuvoloso';
  return 'sereno';
}

/* ===================================================================
   MERCATO DINAMICO — ogni giorno un prodotto è più richiesto
   =================================================================== */
function scegliMercato(){
  const pool = Object.keys(DATA.ITEMS).filter(k=>{
    const I=DATA.ITEMS[k];
    return I && I.prezzo>0 && !I.spazzatura &&
           (I.cat==='raccolto'||I.cat==='foraggio'||I.cat==='pesce'||I.cat==='animale');
  });
  if(!pool.length) return null;
  const item = pool[(Math.random()*pool.length)|0];
  const mult = Math.round((1.6 + Math.random()*0.6)*10)/10; // ×1.6–×2.2
  return { item, mult };
}

/* ===================================================================
   EVENTI NOTTURNI — piccole sorprese tra una notte e l'altra.
   Ogni evento applica subito l'effetto sul mondo e ritorna il messaggio
   (o null se stanotte non aveva nulla da fare).
   =================================================================== */
function eventiNotturniPossibili(){
  const st = G.stagione().id;
  const seed = (G.giornoTot*2654435761 + 77)>>>0;
  return [
    { icona:'legna', tipo:'', applica(){
        const n = WORLD.spargiSu(G.maps.bosco,'erba',7,R=>({t:'ramo', v:(R()*3)|0}), seed);
        return n ? 'Vento forte nella notte: il bosco è disseminato di rami caduti.' : null;
    }},
    { icona:'zappa', tipo:'bad', applica(){
        const m=G.maps.podere, colti=[];
        for(let i=0;i<m.suolo.length;i++){ const s=m.suolo[i]; if(s && s.crop) colti.push(i); }
        if(!colti.length) return null;
        const n = Math.min(colti.length, 1 + ((Math.random()*2)|0));
        for(let k=0;k<n;k++){
          const i = colti.splice((Math.random()*colti.length)|0,1)[0];
          m.suolo[i].crop=null; m.suolo[i].appassita=true;
        }
        return 'I cinghiali hanno rovistato l\'orto: '+n+(n===1?' coltura calpestata.':' colture calpestate.');
    }},
    { icona:'ametista', tipo:'good', applica(){
        const n = WORLD.spargiSu(G.maps.grotta,'grotta',8,R=>WORLD.sasso(['ametista','quarzo','oro'][(R()*3)|0]), seed);
        return n ? 'Luna piena: nella miniera sono affiorate gemme in abbondanza.' : null;
    }},
    { icona:'viola', tipo:'good', applica(){
        const forSt = Object.keys(DATA.ITEMS).filter(k=>DATA.ITEMS[k].cat==='foraggio' && DATA.ITEMS[k].stagione===st);
        if(!forSt.length) return null;
        const n = WORLD.spargiSu(G.maps.bosco,'erba',6,R=>({t:'foraggio', item:forSt[(R()*forSt.length)|0]}), seed);
        return n ? 'Una nidiata di lucciole: il sottobosco è tornato a fiorire.' : null;
    }},
    /* Il pesce sulla soglia c'era già, ma lo portava «il gatto randagio»
       anche a chi non l'aveva mai sfiorato: un regalo da uno che ti
       evita. Adesso lo porta solo se si fida, e quando ha un nome lo
       dice col nome. */
    { icona:'carpa', tipo:'good', applica(){
        const gt = G.gatto || {};
        if((gt.affetto||0) < 45) return null;
        if(!G.puoiAggiungere('carpa',1)) return null;
        G.aggiungi('carpa',1);
        return gt.nome
          ? gt.nome + ' ha lasciato un pesce sulla soglia di casa. Non chiede niente in cambio.'
          : 'Il gatto ha lasciato un pesce sulla soglia di casa.';
    }},
    { icona:'miele', tipo:'good', applica(){
        if(!G.puoiAggiungere('miele',1)) return null;
        G.aggiungi('miele',1);
        return 'Le api hanno lavorato tutta la notte: un vasetto di miele sul davanzale.';
    }}
  ];
}

function tiraEventoNotte(cambioStagione){
  if(cambioStagione) return null;          // la notte di cambio stagione ha già il suo annuncio
  if(Math.random() < 0.40) return null;    // notte tranquilla
  const L = eventiNotturniPossibili();
  // pesca a caso finché uno ha davvero un effetto da mostrare
  while(L.length){
    const e = L.splice((Math.random()*L.length)|0, 1)[0];
    const msg = e.applica();
    if(msg) return { icona:e.icona, tipo:e.tipo, msg };
  }
  return null;
}

/* ===================================================================
   RICHIESTE DEGLI ABITANTI — piccole missioni a tempo (bacheca).
   Ogni giorno la bacheca si aggiorna: si tolgono le scadute, si
   mantengono 2–3 richieste attive. Consegni entro la scadenza per
   ottenere monete e amicizia.
   =================================================================== */
function generaRichiesta(npcId){
  const N = DATA.NPCS[npcId]; if(!N) return null;
  const pool = Object.keys(DATA.ITEMS).filter(k=>{
    const I = DATA.ITEMS[k];
    return I && I.prezzo>0 && I.prezzo<=140 && !I.spazzatura &&
           ['raccolto','foraggio','pesce','animale','materiale'].indexOf(I.cat)>=0;
  });
  if(!pool.length) return null;
  const gusti = ((N.regali && N.regali.piace) || []).filter(id=>DATA.ITEMS[id] && !DATA.ITEMS[id].spazzatura);
  let item = (gusti.length && Math.random()<0.5) ? gusti[(Math.random()*gusti.length)|0]
                                                 : pool[(Math.random()*pool.length)|0];
  if(!item) return null;
  const prezzo = IT.prezzo(item);
  const qta = Math.max(2, Math.min(12, Math.round(60/Math.max(6,prezzo)) + 1 + ((Math.random()*3)|0)));
  const premio = Math.round(prezzo*qta*1.5) + 60;             // paga più che venderli
  const amicizia = 40 + ((Math.random()*4)|0)*15;            // +40..85 amicizia
  const giorni = 2 + ((Math.random()*3)|0);                  // scade tra 2–4 giorni
  G.richiestaSeq = (G.richiestaSeq||0)+1;
  return { id:'rq'+G.richiestaSeq, npc:npcId, item, qta,
           scadenza:G.giornoTot+giorni, premio, amicizia, fatta:false };
}

function aggiornaRichieste(){
  if(!Array.isArray(G.richieste)) G.richieste = [];
  let scadute=0;
  G.richieste = G.richieste.filter(r=>{
    if(r.fatta) return false;
    if(G.giornoTot > r.scadenza){ scadute++; return false; }
    return true;
  });
  const npcKeys = Object.keys(DATA.NPCS).filter(id=>id!=='fiammella');
  const target = 2 + ((Math.random()*2)|0);                  // mantieni 2–3 richieste attive
  let nuove=0, guard=0;
  while(G.richieste.length < target && guard++ < 30){
    const usati  = new Set(G.richieste.map(r=>r.npc));        // un solo incarico per abitante alla volta
    const liberi = npcKeys.filter(id=>!usati.has(id));
    if(!liberi.length) break;
    const r = generaRichiesta(liberi[(Math.random()*liberi.length)|0]);
    if(r){ G.richieste.push(r); nuove++; }
  }
  return { scadute, nuove };
}

/* consegna una richiesta: toglie gli oggetti, dà monete e amicizia */
G.completaRichiesta = function(r){
  if(!r || r.fatta) return false;
  if(G.conta(r.item) < r.qta) return false;
  G.togli(r.item, r.qta);
  G.oro += r.premio; G.stats.guadagno += r.premio;
  G.amicizia[r.npc] = Math.max(0,(G.amicizia[r.npc]||0)+r.amicizia);
  r.fatta = true;
  G.richieste = G.richieste.filter(x=>x!==r);
  G.stats.richiesteFatte = (G.stats.richiesteFatte||0)+1;
  SND.play('regalo');
  return true;
};

/* ===================================================================
   SAGRE DI STAGIONE — una sfida a scadenza per ogni stagione.
   Consegna prodotti della stagione entro il giorno 28 per un grande
   premio in monete e amicizia con tutto il paese.
   =================================================================== */
const SAGRE = {
  primavera:{ nome:'Sagra dei Germogli',  icona:'fragola',        req:18, premio:2400 },
  estate:   { nome:'Festa del Sole',       icona:'girasole',       req:20, premio:2800 },
  autunno:  { nome:'Sagra del Raccolto',   icona:'zucca',          req:24, premio:3600 },
  inverno:  { nome:'Fiera del Solstizio',  icona:'radice_inverno', req:14, premio:3000 }
};
function creaSagra(){
  const st = G.stagione().id, S = SAGRE[st];
  return { stagione:st, nome:S.nome, icona:S.icona, req:S.req, progresso:0, premio:S.premio,
           scadenza: G.giornoTot + (DATA.GIORNI_STAGIONE - G.giorno), // fino a fine stagione
           giorno: 24,                    // il giorno della festa in piazza
           fatta:false, riscossa:false };
}

/* ===================================================================
   IL GIORNO DELLA SAGRA
   Prima la sagra era un contatore dentro un menu. Adesso, il giorno
   della festa, il paese smette di lavorare e si raduna in piazza —
   Serafina scende dal bosco apposta.
   =================================================================== */
G.eGiornoDiSagra = function(){
  return !!(G.sagra && !G.sagra.riscossa && G.giorno === (G.sagra.giorno||24)
            && G.sagra.stagione === G.stagione().id);
};

/* le posizioni in piazza, una per abitante */
const POSTI_SAGRA = {
  bruno:   [[18,16],[19,17]],
  tobia:   [[25,16],[24,17]],
  marisol: [[21,14],[22,15]],
  elio:    [[24,21],[23,20]],
  serafina:[[19,21],[20,22]]
};

/* Serafina viene giù dal bosco solo per la festa. Va tolta dal bosco
   mentre è in paese, altrimenti sarebbe in due posti nello stesso
   momento — cosa che il giocatore nota subito. */
let serafinaNelBosco = null;
function aggiornaOspitiSagra(){
  const paese = G.maps.fioralba, bosco = G.maps.bosco;
  if(!paese || !bosco) return;
  const iPaese = paese.npc.findIndex(n=>n.id==='serafina');
  const iBosco = bosco.npc.findIndex(n=>n.id==='serafina');

  if(G.eGiornoDiSagra()){
    if(iBosco>=0){ serafinaNelBosco = bosco.npc[iBosco]; bosco.npc.splice(iBosco,1); }
    if(iPaese<0) paese.npc.push({ id:'serafina', x:19, y:21, ospite:true, giro:POSTI_SAGRA.serafina });
  } else {
    if(iPaese>=0) paese.npc.splice(iPaese,1);
    if(iBosco<0 && serafinaNelBosco){ bosco.npc.push(serafinaNelBosco); serafinaNelBosco=null; }
  }
}
function sagraQualifica(id, season){
  const I = DATA.ITEMS[id]; if(!I) return false;
  if(I.cat==='raccolto' && I.crop && DATA.CROPS[I.crop]) return DATA.CROPS[I.crop].stagioni.indexOf(season)>=0;
  if(I.cat==='foraggio') return I.stagione===season;
  return false;
}
/* quante cose di stagione ho nello zaino, buone per la sagra */
G.sagraDisponibili = function(){
  if(!G.sagra) return 0;
  let n=0;
  for(const s of G.inv) if(s && sagraQualifica(s.id, G.sagra.stagione)) n+=s.n;
  return n;
};
/* versa nella sagra quanti più prodotti di stagione possibile */
G.contribuisciSagra = function(){
  if(!G.sagra || G.sagra.fatta) return 0;
  const st = G.sagra.stagione;
  let bisogno = G.sagra.req - G.sagra.progresso, messi=0;
  for(let i=0;i<G.inv.length && messi<bisogno;i++){
    const s=G.inv[i];
    if(!s || !sagraQualifica(s.id, st)) continue;
    const prendi = Math.min(s.n, bisogno-messi);
    G.togliSlot(i, prendi);
    messi += prendi;
  }
  G.sagra.progresso += messi;
  if(G.sagra.progresso >= G.sagra.req) G.sagra.fatta = true;
  if(messi) SND.play('prendi');
  return messi;
};
G.riscuotiSagra = function(){
  if(!G.sagra || !G.sagra.fatta || G.sagra.riscossa) return false;
  G.oro += G.sagra.premio; G.stats.guadagno += G.sagra.premio;
  for(const id in DATA.NPCS){ if(id==='fiammella') continue; G.amicizia[id]=(G.amicizia[id]||0)+30; }
  G.sagra.riscossa = true;
  G.stats.sagre = (G.stats.sagre||0)+1;
  SND.play('livello');
  return true;
};

/* ===================================================================
   MERCANTE AMBULANTE — ogni 7 giorni passa dalla Locanda con roba rara.
   =================================================================== */
function stockMercante(){
  const pool=[];
  // semi di ogni stagione (utili se hai la serra)
  for(const st in DATA.SHOP) for(const id of DATA.SHOP[st]){
    if(DATA.ITEMS[id]) pool.push({ id, prezzo: Math.round((DATA.ITEMS[id].prezzo||20)*2.6) });
  }
  // materiali e gemme rare + concimi
  for(const id of ['gemma_luna','lingotto_oro','ametista','quarzo','cristallia','concime','concime_acqua']){
    if(DATA.ITEMS[id]) pool.push({ id, prezzo: Math.max(4, Math.round(IT.prezzo(id)*1.7)) });
  }
  // dedup per id
  const visti=new Set(), uniq=[];
  for(const it of pool){ if(visti.has(it.id)) continue; visti.add(it.id); uniq.push(it); }
  // mischia e prendi 5–6 pezzi
  for(let i=uniq.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; const t=uniq[i]; uniq[i]=uniq[j]; uniq[j]=t; }
  return uniq.slice(0, 5 + ((Math.random()*2)|0));
}

function apriLocanda(){
  if(G.mercante && G.mercante.presente){
    UI.modal('Locanda del Tasso Storto', body=>{
      const n=document.createElement('div'); n.className='muted'; n.style.marginBottom='12px';
      n.textContent='C\'è ressa stasera: un mercante ambulante ha messo su banco vicino al camino.';
      body.appendChild(n);
      const b1=document.createElement('button'); b1.className='btn'; b1.style.marginBottom='8px';
      b1.textContent='Bottega di Marisol';
      b1.onclick=()=>{ UI.chiudiModal(); UI.negozio(G,'marisol'); };
      body.appendChild(b1);
      const b2=document.createElement('button'); b2.className='btn gold';
      b2.textContent='🛒 Mercante ambulante';
      b2.onclick=()=>{ UI.chiudiModal(); UI.mercante(G); };
      body.appendChild(b2);
    });
  } else {
    UI.negozio(G,'marisol');
  }
}

/* ===================================================================
   LUCI
   =================================================================== */
G.luci = function(){
  const out=[];
  const m=G.mappa();
  const notte = REND.luceAmbiente(G.ora, G.meteo, m.esterno).a > 0.05;
  if(!notte) return out;

  // giocatore
  out.push({x:G.p.px, y:G.p.py-14, r:74, i:0.55, caldo:true, f:0});

  const x0=Math.max(0,((G.cam.x/T)|0)-3), y0=Math.max(0,((G.cam.y/T)|0)-3);
  const {VW,VH}=REND.info();
  const x1=Math.min(m.w-1, ((G.cam.x+VW)/T|0)+3), y1=Math.min(m.h-1,((G.cam.y+VH)/T|0)+3);

  for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){
    const o=m.obj[WORLD.idx(m,x,y)];
    if(!o) continue;
    if(o.t==='lampione') out.push({x:x*T+16, y:y*T+2, r:96, i:0.85, caldo:true, f:x*0.7});
    else if(o.t==='lume')   out.push({x:x*T+16, y:y*T+12, r:82, i:0.72, caldo:true, f:x*1.3});
    else if(o.t==='camino') out.push({x:x*T+16, y:y*T+22, r:120, i:0.9, caldo:true, f:y*0.6});
    else if(o.t==='mobile' && o.kind==='lanterna') out.push({x:x*T+16, y:y*T+8, r:88, i:0.8, caldo:true, f:x});
    else if(o.t==='macchina' && (o.kind==='forno'||o.kind==='fornace') && o.dentro)
      out.push({x:x*T+16, y:y*T+18, r:64, i:0.7, caldo:true, f:y});
  }
  // funghi luminosi
  for(const d of m.deco){
    if(d.t==='fungo_luce' && d.x>=x0-2 && d.x<=x1+2 && d.y>=y0-2 && d.y<=y1+2)
      out.push({x:d.x*T+16, y:d.y*T+18, r:52, i:0.55, caldo:false, f:d.v});
  }
  // finestre degli edifici
  for(const e of m.edifici){
    if(e.azione==='chiuso' && Math.random()>0.5) continue;
    out.push({x:(e.x+e.w/2)*T, y:(e.y+e.h-1)*T, r:110, i:0.6, caldo:true, f:e.x});
  }
  // santuario
  if(m.id==='bosco' && G.braci>0){
    const s=m.edifici.find(e=>e.kind==='santuario');
    if(s) out.push({x:(s.x+s.w/2)*T, y:(s.y+s.h-1)*T, r:60+G.braci*34, i:0.5+G.braci*0.12, caldo:true, f:0});
  }
  return out;
};

/* ===================================================================
   PARTICELLE
   =================================================================== */
function aggiornaParticelle(dt){
  const m=G.mappa();
  const f = dt/16;
  for(let i=G.particelle.length-1;i>=0;i--){
    const p=G.particelle[i];
    p.vita -= dt;
    if(p.vita<=0){ G.particelle.splice(i,1); continue; }
    p.x += (p.vx||0)*f;
    p.y += (p.vy||0)*f;
    if(p.g) p.vy = (p.vy||0) + p.g*f;
    if(p.vr) p.r = (p.r||0) + p.vr*f;
    if(p.t==='lucciola'){ p.f = (p.f||0) + 0.05*f; }
  }

  // ambiente: foglie / petali / lucciole
  if(m.esterno && G.particelle.length < 90){
    const st=G.stagione().id;
    const {VW,VH}=REND.info();
    if(st==='autunno' && Math.random()<0.09*f){
      G.particelle.push({t:'foglia',
        x:G.cam.x-20+Math.random()*(VW+40), y:G.cam.y-20,
        vx:0.3+Math.random()*0.7, vy:0.25+Math.random()*0.35, g:0,
        r:Math.random()*6.3, vr:(Math.random()-0.5)*0.09,
        vita:9000, vitaMax:9000, c:['#d9713c','#c47a2c','#b8562c','#e0a03c'][(Math.random()*4)|0], alpha:0.9});
    }
    if(st==='primavera' && Math.random()<0.07*f){
      G.particelle.push({t:'petalo',
        x:G.cam.x-20+Math.random()*(VW+40), y:G.cam.y-20,
        vx:0.25+Math.random()*0.5, vy:0.2+Math.random()*0.3, g:0,
        r:Math.random()*6.3, vr:(Math.random()-0.5)*0.07,
        vita:9000, vitaMax:9000, c:['#f5a6c0','#f8c8d8','#fff0f4'][(Math.random()*3)|0], alpha:0.85});
    }
    const notte = G.ora>1090 || G.ora<380;
    if(notte && (st==='estate'||st==='primavera'||m.id==='bosco') && Math.random()<0.05*f){
      G.particelle.push({t:'lucciola',
        x:G.cam.x+Math.random()*VW, y:G.cam.y+40+Math.random()*(VH-60),
        vx:(Math.random()-0.5)*0.22, vy:(Math.random()-0.5)*0.16, g:0,
        f:Math.random()*6.3, vita:7000, vitaMax:7000});
    }
  }
}

function particelleTesto(x,y,testo,col){
  // anche il testo che vola sopra la testa passa dalla lingua
  if(window.LINGUA) testo = LINGUA.t(testo);
  G.particelle.push({t:'testo', x, y, vx:0, vy:-0.42, g:0, testo, c:col||'#fff8d0',
                     vita:1100, vitaMax:1100});
}
G.particelleTesto = particelleTesto;   // pesca.js: il nome del pesce che sale dalla testa

function schegge(tx,ty,col){
  for(let k=0;k<7;k++) G.particelle.push({t:'schegge',
    x:tx*T+16+(Math.random()-0.5)*18, y:ty*T+16+(Math.random()-0.5)*14,
    vx:(Math.random()-0.5)*1.5, vy:-0.7-Math.random()*0.7, g:0.05,
    vita:420, vitaMax:420, s:2, c:col});
}

function schizzo(tx,ty){
  G.particelle.push({t:'splash', x:tx*T+16, y:ty*T+16, vx:0,vy:0,g:0, vita:700, vitaMax:700});
  for(let k=0;k<6;k++) G.particelle.push({t:'goccia',
    x:tx*T+16, y:ty*T+16, vx:(Math.random()-0.5)*1.4, vy:-0.8-Math.random()*0.6, g:0.06,
    vita:500, vitaMax:500});
}
G.schizzo = schizzo;   // pesca.js: l'acqua che si apre quando cade la lenza

/* ===================================================================
   OBIETTIVI / STATISTICHE
   =================================================================== */
/* ===================================================================
   COLLEZIONE DEL NATURALISTA
   =================================================================== */
G.categorieCollezione = function(){
  const F = c => Object.keys(DATA.ITEMS).filter(k=>DATA.ITEMS[k].cat===c && !DATA.ITEMS[k].spazzatura);
  return [
    ['Pesci',    'canna',          F('pesce')],
    ['Minerali', 'gemma_luna',     F('minerale')],
    ['Colture',  'zappa',          F('raccolto')],
    ['Foraggio', 'viola',          F('foraggio')],
    ['Piatti',   'frittata',       DATA.CUCINA.map(r=>r.id)]
  ];
};
G.contaCollezione = function(){
  const coll = G.collezione||{}, r={}; let totD=0, totT=0;
  for(const [nome,,ids] of G.categorieCollezione()){
    const d = ids.filter(id=>coll[id]).length;
    r[nome]={d, t:ids.length}; totD+=d; totT+=ids.length;
  }
  r.tot={d:totD, t:totT};
  return r;
};

/* I traguardi dicevano cosa serve — «Frantuma 100 rocce» — ma non dove
   si trovano cento rocce né con cosa si frantumano. Chi sa già giocare
   lo indovina; chi ha appena cominciato legge un compito e non un
   suggerimento. `come` è la riga che manca: dove andare, con cosa, e
   quale scorciatoia c'è se una c'è. */
G.obiettivi = function(){
  const s=G.stats, o=[];
  const cc=G.contaCollezione();
  // conta (id,nome,icona,desc, valore corrente, traguardo, premio, come)
  const cont=(id,nome,icona,desc,cur,tot,premio,come)=>o.push({
    id, nome, icona, desc, premio, come,
    prog: Math.min(tot,cur)+'/'+tot, fatto: cur>=tot });
  // traguardo booleano (fatto/da fare)
  const flag=(id,nome,icona,desc,ok,premio,come)=>o.push({
    id, nome, icona, desc, premio, come,
    prog: ok?'fatto':'da fare', fatto: !!ok });

  cont('mani_terra','Mani nella terra','zappa','Raccogli 50 prodotti dal campo.', s.raccolti,50,500,
    'Nel <b>podere</b>, dentro il campo recintato. Zappa la terra, semina, annaffia ogni giorno e raccogli quando la pianta è matura. '+
    'I semi li vende <b>Bruno</b> in bottega, e ogni stagione ha i suoi: quelli fuori stagione appassiscono.');
  cont('boscaiolo','Boscaiolo','legna','Abbatti 25 alberi.', s.alberi,25,500,
    'Con l\'<b>ascia</b>, e conta solo l\'albero adulto — non il ceppo che resta. Ce ne sono nel <b>podere</b> e tanti nel <b>bosco</b>. '+
    'Ogni tanto cade un seme d\'albero lì vicino: se lo lasci crescere, gli alberi non finiscono mai.');
  cont('cuore_pietra','Cuore di pietra','piccone','Frantuma 100 rocce.', s.sassi,100,600,
    'Con il <b>piccone</b>. Nella <b>miniera</b> (l\'ingresso è nel bosco) ce ne sono a ogni livello, e più scendi più fruttano. '+
    'Anche i sassi sparsi nel podere contano.');
  cont('pescatore','Pescatore paziente','canna','Pesca 30 pesci.', s.pesci,30,700,
    'Con la <b>canna</b>, mettendoti sulla riva e mirando all\'acqua. Fiume del paese, lago del bosco, mare della <b>Costa</b>. '+
    'La spazzatura non conta: contano solo i pesci veri.');
  cont('cuoco','Ai fornelli','frittata','Cucina 20 piatti in cucina.', s.piatti||0,20,800,
    'Serve l\'<b>Ampliamento Casa</b>: fino ad allora in casa c\'è il focolare ma non una cucina vera. '+
    'Poi entra in casa e usa i fornelli. Le ricette si sbloccano parlando con gli abitanti e salendo di livello.');
  cont('generoso','Cuore generoso','miele','Fai 15 regali graditi agli abitanti.', s.regali||0,15,700,
    'Tieni in mano l\'oggetto e parla con qualcuno: te lo chiederà. Conta solo se il regalo gli <b>piace</b> — '+
    'i gusti di ognuno li trovi in <b>Diario → Abitanti</b>. Uno a testa al giorno.');
  cont('factotum','Persona di fiducia','medaglione','Completa 15 richieste della bacheca.', s.richiesteFatte||0,15,1200,
    'La <b>bacheca</b> è al porto, in paese. Ti chiedono un oggetto entro un tot di giorni: prendilo, torna alla bacheca e consegna. '+
    'Le richieste aperte le vedi in <b>Diario → Richieste</b>.');
  cont('festaiolo','Anima delle sagre','melagrana','Vinci 3 sagre di stagione.', s.sagre||0,3,1500,
    'Una per stagione, in <b>piazza</b>. Bisogna portare il prodotto migliore che hai: la qualità conta più della quantità, '+
    'quindi conserva i raccolti belli invece di venderli subito.');
  flag('esploratore','Conosci la valle','viola','Visita bosco, miniera e paese.',
       s.visitatoBosco && s.visitatoGrotta && s.visitatoPaese, 400,
    'Il <b>paese</b> è a est del podere, il <b>bosco</b> a nord, e la <b>miniera</b> si apre dentro il bosco. '+
    'Basta metterci piede una volta.');
  flag('ponte','Il ponte','legna','Costruisci il ponte per la radura.', G.costruzioni.ponte, 400,
    'Servono <b>100 legna</b>, <b>40 pietra</b> e 3000 monete. Si ordina da <b>Tobia</b> alla fucina — '+
    'o dall\'incudine, se lui non c\'è. Apre la radura oltre il ruscello.');
  flag('serra','Sotto vetro','seme_cristallia','Costruisci la serra.', G.costruzioni.serra, 800,
    'La costruzione più cara: <b>200 legna</b>, <b>120 pietra</b>, <b>5 lingotti d\'oro</b> e 12.000 monete, sempre da Tobia. '+
    'Dentro si coltiva tutto l\'anno, anche d\'inverno.');
  cont('benestante','Benestante','lingotto_oro','Accumula 50.000 monete guadagnate.', s.guadagno,50000,3000,
    'Conta il <b>totale guadagnato</b>, non quello che hai in tasca: spendere non ti fa tornare indietro. '+
    'La strada breve è trasformare — l\'uva cruda vale 76 monete, il vino 228 — con botte, barattoliera e forno.');
  cont('ittiologo','Ittiologo','storione','Scopri tutti i pesci della valle.', cc.Pesci.d, cc.Pesci.t, 1600,
    'Ogni pesce ha la sua stagione, la sua acqua e a volte la sua ora: certi escono solo di notte. '+
    'Quelli che ti mancano li vedi in <b>Diario → Collezione</b>, con dove e quando cercarli.');
  cont('gemmologo','Gemmologo','gemma_luna','Scopri tutti i minerali.', cc.Minerali.d, cc.Minerali.t, 1600,
    'Nella <b>miniera</b>, e i più rari stanno in fondo: scendi di livello. I <b>geodi</b> vanno rotti alla fucina '+
    'per vedere cosa c\'è dentro.');
  cont('collezionista','Collezionista','medaglione','Completa la Collezione del Naturalista.', cc.tot.d, cc.tot.t, 4000,
    'È la somma di tutte le altre: pesci, minerali, raccolti e cose trovate in giro. '+
    'Basta averne visto uno di ogni tipo, non serve tenerlo.');
  return o;
};

/* riscuoti la ricompensa di un traguardo completato */
G.riscuotiObiettivo = function(o){
  if(!o || !o.fatto) return false;
  if(!G.obiettiviRiscossi) G.obiettiviRiscossi={};
  if(G.obiettiviRiscossi[o.id]) return false;
  G.obiettiviRiscossi[o.id]=true;
  if(o.premio){ G.oro += o.premio; }
  SND.play('livello');
  return true;
};

G.statistiche = function(){
  return [
    ['Giorni al podere', G.stats.giorniGiocati],
    ['Prodotti raccolti', G.stats.raccolti],
    ['Alberi abbattuti', G.stats.alberi],
    ['Rocce frantumate', G.stats.sassi],
    ['Pesci pescati', G.stats.pesci],
    ['Guadagno totale', G.stats.guadagno.toLocaleString('it-IT')+' monete'],
    ['Braci accese', G.braci+'/4'],
    ['Stagione', G.stagione().nome+' '+G.giorno+', Anno '+G.anno]
  ];
};

/* ===================================================================
   SALVATAGGIO — sta in salvataggio.js.
   Qui resta solo l'aggancio: i pulsanti del menu e l'autosave chiamano
   G.salva / G.esporta / G.importaTesto / G.importaDaFile, e quel file
   si carica prima che G esista, quindi non può appenderveli da sé.
   =================================================================== */
G.salva         = SALVA.salva;
G.esporta       = SALVA.esporta;
G.importaTesto  = SALVA.importaTesto;
G.importaDaFile = SALVA.importaDaFile;

/* dichiarate come funzioni e non come const: collegaTitolo e collegaLanding
   le chiamano, e sono scritte molto più in su di questa riga. Con const
   basterebbe spostare l'avvio di un pelo perché diventino una zona morta. */
function caricaGrezzo(){ return SALVA.grezzo(); }
function carica(){ return SALVA.carica(); }


/* ===================================================================
   INPUT
   =================================================================== */
function collegaInput(){
  window.addEventListener('keydown', e=>{
    const k = e.key.toLowerCase();
    if(['arrowup','arrowdown','arrowleft','arrowright',' '].indexOf(k)>=0) e.preventDefault();
    if(k==='shift'){ tasti['shift']=true; }
    tasti[k]=true;
    SND.resume();
    attivita();

    if(!G.inGioco) return;

    // dialoghi
    if(UI.dialogoAttivo()){
      if(k===' '||k==='enter'||k==='e'){ UI.avanzaDialogo(); }
      if(k==='escape') UI.chiudiDialogo();
      return;
    }
    // lettera
    if(!$('#letter').classList.contains('hidden')){
      if(k===' '||k==='enter'||k==='escape') $('#letter').querySelector('.letter-btn').click();
      return;
    }
    // modali
    if(UI.modalAperta()){
      if(k==='escape'||k==='i'||k==='c'||k==='j'||k==='m') UI.chiudiModal();
      return;
    }
    // pesca
    if(PESCA.inCorso()){
      if(k===' ') PESCA.premuto();
      if(k==='escape') PESCA.abbandona();
      return;
    }

    if(k>='1'&&k<='9'){ G.slotSel=parseInt(k)-1; evidenziaSlot(); return; }
    switch(k){
      case ' ': usaOggetto(); break;
      case 'e': case 'enter': interagisci(); break;
      case 'i': UI.inventario(G); break;
      case 'c': UI.artigianato(G); break;
      case 'j': UI.diario(G); break;
      case 'm': UI.mappa(G); break;
      case 'escape': if(!G.annullaSpostamento()) UI.menu(G); break;
      case 'q': gettaOggetto(); break;
      case 'f': schermoIntero(); break;
    }
  });

  window.addEventListener('keyup', e=>{
    const k=e.key.toLowerCase();
    tasti[k]=false;
    if(k==='shift') tasti['shift']=false;
    if(k===' ' && PESCA.inCorso()) PESCA.rilasciato();
  });

  // mouse
  cvs.addEventListener('mousemove', e=>{
    if(!G.inGioco) return;
    const r=cvs.getBoundingClientRect();
    mouseWorld = REND.schermoAMondo(e.clientX-r.left, e.clientY-r.top, G.cam);
  });
  cvs.addEventListener('mouseleave', ()=>{ mouseWorld=null; });
  cvs.addEventListener('mousedown', e=>{
    if(!G.inGioco) return;
    SND.resume();
    attivita();
    if(UI.modalAperta()||UI.dialogoAttivo()) return;
    const r=cvs.getBoundingClientRect();
    mouseWorld = REND.schermoAMondo(e.clientX-r.left, e.clientY-r.top, G.cam);
    if(PESCA.inCorso()){ PESCA.premuto(); return; }
    if(e.button===0){ calcolaBersaglio(); usaOggetto(); }
    else if(e.button===2){ interagisci(); }
  });
  cvs.addEventListener('mouseup', ()=>{ if(PESCA.inCorso()) PESCA.rilasciato(); });
  cvs.addEventListener('contextmenu', e=>e.preventDefault());
  cvs.addEventListener('wheel', e=>{
    if(!G.inGioco || UI.modalAperta()) return;
    e.preventDefault();
    attivita();
    G.slotSel = (G.slotSel + (e.deltaY>0?1:-1) + 9) % 9;
    evidenziaSlot();
  }, {passive:false});

  // pulsanti HUD
  $('#btn-inv').onclick   = ()=>UI.inventario(G);
  $('#btn-craft').onclick = ()=>UI.artigianato(G);
  $('#btn-quest').onclick = ()=>UI.diario(G);
  $('#btn-map').onclick   = ()=>UI.mappa(G);
  $('#btn-menu').onclick  = ()=>UI.menu(G);

  // touch: movimento verso il tocco + azione
  let touchStart=null;
  cvs.addEventListener('touchstart', e=>{
    SND.resume();
    attivita();
    if(!G.inGioco) return;
    const t=e.touches[0];
    const r=cvs.getBoundingClientRect();
    touchStart={x:t.clientX-r.left, y:t.clientY-r.top, t:Date.now()};
    if(PESCA.inCorso()) PESCA.premuto();
  }, {passive:true});
  cvs.addEventListener('touchmove', e=>{
    if(!G.inGioco||!touchStart) return;
    const t=e.touches[0];
    const r=cvs.getBoundingClientRect();
    const dx=(t.clientX-r.left)-touchStart.x, dy=(t.clientY-r.top)-touchStart.y;
    tasti['a']=dx<-18; tasti['d']=dx>18;
    tasti['w']=dy<-18; tasti['s']=dy>18;
  }, {passive:true});
  cvs.addEventListener('touchend', e=>{
    tasti['a']=tasti['d']=tasti['w']=tasti['s']=false;
    if(PESCA.inCorso()){ PESCA.rilasciato(); touchStart=null; return; }
    if(touchStart && Date.now()-touchStart.t < 220){
      calcolaBersaglio();
      usaOggetto();
    }
    touchStart=null;
  }, {passive:true});
}

/* ===================================================================
   TOOLTIP D'ESPLORAZIONE
   Quando il giocatore resta fermo, un piccolo invito a scoprire il mondo.
   Prima suggerisce le cose che non ha ancora provato, poi consigli vari.
   =================================================================== */
let hintPrec = '';
function attivita(){ G.ultimaAzione = performance.now(); }

function suggerimentiEsplorazione(){
  const s = G.stats, c = G.costruzioni, nuovi = [];
  // 1) cose ancora da scoprire (le più utili per chi comincia)
  if(s.raccolti===0)      nuovi.push('Prova a zappare la terra, pianta un seme e annaffialo: la fattoria nasce così. 🌱');
  if(s.pesci===0)         nuovi.push('Hai una canna: lanciala nell\'acqua del fiume o del lago e tieni premuto Spazio. 🎣');
  if(s.alberi===0)        nuovi.push('Con l\'ascia abbatti gli alberi del bosco e fai scorta di legna. 🪓');
  if(!s.visitatoPaese)    nuovi.push('A ovest c\'è il paese di Fioralba: da Bruno compri semi e vendi il raccolto. 🏘️');
  if(!s.visitatoBosco)    nuovi.push('A sud si apre il bosco: funghi, foraggio e l\'erborista Serafina ti aspettano. 🌲');
  if(!s.visitatoGrotta)   nuovi.push('A nord del paese c\'è la miniera: col piccone trovi minerali e gemme. ⛏️');
  if((s.regali||0)===0)   nuovi.push('Fai un regalo agli abitanti: ognuno ha i suoi gusti e l\'amicizia cresce. 🎁');
  if(!c.ponte)            nuovi.push('Il fabbro Tobia può costruirti il ponte per la radura del Santuario. 🌉');
  if((s.piatti||0)===0)   nuovi.push('In cucina combini gli ingredienti in piatti che danno più energia. 🍳');
  if(nuovi.length) return nuovi;

  // 2) consigli generali per chi ha già girato un po'
  return [
    'Parla ogni giorno con gli abitanti: ricordano quello che dici. 💬',
    'Nel Diario, alla scheda Richieste, gli abitanti chiedono aiuto e pagano bene. 📋',
    'Ogni stagione ha la sua sagra: consegna i prodotti dal Diario per un gran premio. 🎪',
    'Ogni tanto un mercante ambulante passa dalla Locanda con merce rara. 🛒',
    'Riscuoti i Traguardi completati nel Diario: sono monete che aspettano te. 🏆',
    'La scheda Collezione del Diario segna tutto ciò che scopri: pesci, minerali, colture, piatti. 📖',
    'Apri la Mappa (M) e tocca un luogo già visitato per il viaggio rapido. 🧭',
    'Le abilità migliorano coi livelli: pesca più facile, raccolti doppi, rocce più fragili (Diario → Podere). ⭐',
    'Fai amicizia con Marisol ed Elio: custodiscono due storie speciali da scoprire. 💛',
    'A sud del paese apri la Piazza del Porto, e da lì scendi fino alla Costa a pescare. 🏖️',
    'In fondo alla miniera ci sono scale che scendono: più giù, più gemme rare. 💎',
    'Oltre la miniera, a nord, un passo innevato nasconde un eremita e minerali preziosi. 🏔️',
    'Il Santuario nel bosco chiede i frutti delle quattro stagioni. Porta ciò che matura. 🏮',
    'La cassa di consegna vicino a casa paga durante la notte: riempila prima di dormire. 📦',
    'Con una serra coltivi anche fuori stagione. 🪴',
    'Alla Locanda, Marisol insegna nuove ricette se le porti qualcosa di speciale. 🍲',
    'Di notte, al molo, abboccano pesci che di giorno non vedrai mai. 🌙',
    'Guarda il meteo di domani accanto all\'orologio: se pioverà, stanotte non serve annaffiare. ☔',
    'Concima il terreno per raccolti più ricchi e più veloci. ✨',
    'Ogni giorno un prodotto vale di più al mercato: vendi quello per guadagnare di più. 🪙'
  ];
}

let ultimoHint = 0;
function mostraHintEsplora(){
  if(!G.inGioco || G.p.dorme || PESCA.inCorso()) return;
  if(UI.modalAperta() || UI.dialogoAttivo()) return;
  if(!$('#letter').classList.contains('hidden')) return;
  if(!$('#tutorial').classList.contains('hidden')) return;         // non disturbare durante la guida
  if(!G.tutorialFatto && (G.stats.giorniGiocati||0) < 1) return;   // lascia respirare i primi minuti

  /* Finché i "Primi passi" hanno ancora qualcosa da dire, il consiglio a
     caso tace: due voci che parlano insieme confondono e basta. */
  if(window.GUIDA && !GUIDA.nascosta() && !GUIDA.completata()) return;

  /* Il vecchio criterio era "fermo da 22 secondi", ma qualunque tasto
     azzerava il conteggio: chi girava a vuoto senza capire — cioè
     esattamente chi aveva bisogno di un consiglio — non ne vedeva mai
     uno. Ora conta da quanto non succede qualcosa di utile. */
  const ora = performance.now();
  if(ora - (G.ultimoProgresso || 0) < 45000) return;               // sta ancora combinando qualcosa
  if(ora - ultimoHint < 60000) return;                             // niente raffiche

  const pool = suggerimentiEsplorazione();
  let msg = pool[(Math.random()*pool.length)|0];
  for(let g=0; msg===hintPrec && pool.length>1 && g<6; g++) msg = pool[(Math.random()*pool.length)|0];
  hintPrec = msg;
  UI.toast(msg, 'hint');
  ultimoHint = ora;
}
setInterval(mostraHintEsplora, 5000);

function gettaOggetto(){
  const s=G.slot();
  if(!s) return;
  if(IT.cat(s.id)==='attrezzo'){ UI.toast('Meglio tenerlo.','bad'); return; }
  G.togliSlot(G.slotSel, 1);
  SND.play('menu');
}

function schermoIntero(){
  if(!document.fullscreenElement) document.documentElement.requestFullscreen().catch(()=>{});
  else document.exitFullscreen().catch(()=>{});
}

/* ===================================================================
   AVVIO
   =================================================================== */
window.addEventListener('load', init);

/* rete di sicurezza: gli errori vengono loggati, non fanno crollare il gioco */
window.addEventListener('error', e=>{ try{ console.warn('[motore] errore globale:', e.message, (e.filename||'')+':'+(e.lineno||0)); }catch(_){} });
window.addEventListener('unhandledrejection', e=>{ try{ console.warn('[motore] promise non gestita:', e.reason); }catch(_){} });

/* Salvataggio automatico ogni 2 minuti — nei tempi morti del browser.
   Misurato: serializzare e scrivere costa ~7ms, e piantati in mezzo a un
   fotogramma da 16 sono uno scatto visibile ogni due minuti, sempre
   mentre si cammina. requestIdleCallback lo sposta dove non dà fastidio;
   il timeout garantisce che comunque si salvi entro quattro secondi.
   I salvataggi d'uscita (qui sotto) restano sincroni APPOSTA: la pagina
   sta morendo, un rinvio è un salvataggio perso. */
setInterval(()=>{
  if(!(G.inGioco && !G.p.dorme)) return;
  const fai = ()=>sistema('autosave', G.salva);
  if(window.requestIdleCallback) requestIdleCallback(fai, { timeout:4000 });
  else fai();
}, 120000);

/* Salvataggio all'uscita. "beforeunload" non è affidabile (i telefoni chiudono
   le schede senza emetterlo) e per di più impedisce alla pagina di entrare
   nella cache avanti/indietro del browser. "visibilitychange" scatta anche
   quando cambi scheda o minimizzi, "pagehide" è la rete di sicurezza. */
function salvaSeInGioco(){ if(G.inGioco && !G.p.dorme) sistema('autosave', G.salva); }
document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='hidden') salvaSeInGioco(); });
window.addEventListener('pagehide', salvaSeInGioco);

})();
