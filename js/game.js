/* ===================================================================
   FIORALBA — game.js
   Stato, ciclo di gioco, input, sistemi.
   =================================================================== */
(function(){
'use strict';

const T = 64;
/* Quante volte il mondo è più fitto di quando la casella era 32.
   Sta davanti a ogni misura in pixel che era stata tarata allora:
   la velocità del passo, il mezzo hitbox ai piedi, la distanza a cui si
   attacca discorso, il raggio di un lampione. Le misure scritte in
   caselle (`x*T`, `T*2.6`) non ne hanno bisogno: si adattano da sole. */
const K = 2;
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
    /* Dove sono finiti i mobili che hai spostato in casa. NON è
       l'arredamento: è l'elenco delle differenze. Le stanze sono scritte
       e si rifanno da `world.js` a ogni caricamento — rileggerle da un
       salvataggio ha già fatto danno una volta, col letto rimasto dietro
       al camino per sempre — quindi si tiene solo «questo letto l'ho
       messo là», e uno spostamento che non torna più si salta da sé. */
    arrediSpostati: [],
    gatto:{ affetto:0, giorno:-1, nome:null },
    obiettiviRiscossi:{}, sagra:null, mercante:{presente:false, giorno:-1, stock:[]},
    visitati:{podere:true}, collezione:{}, bottiglieLette:[],
    /* La serie dei giorni VERI in cui hai aperto il gioco. `ultimo` è una
       data locale «AAAA-MM-GG» e non un timestamp: fra le 23:50 e le
       00:10 sono due giorni per chi gioca, e devono essere due anche
       qui. `daPrendere` è il pacco che ti aspetta sull'aia. */
    serie:{ ultimo:null, giorni:0, daPrendere:0 },
    vicende:{}, persona:{},
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
let cvs, ultimo=0, accum=0, loopInCorsa=false;
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

async function init(){
  cvs = $('#game');
  /* PixiJS deve poter ottenere il contesto WebGL prima che qualunque codice
     chieda un contesto 2D allo stesso canvas. L'adattatore restituisce il
     canvas effettivo (può sostituirlo se l'avvio WebGL fallisce), perciò
     input e resize vengono collegati soltanto quando il backend è pronto. */
  cvs = await REND.init(cvs);
  /* Gli arredi disegnati a mano partono subito, e nessuno li aspetta:
     finché non arrivano il gioco disegna l'arte in codice di sempre, e
     se non arrivano mai continua a disegnarla. Sta qui e non al
     caricamento di immagini.js perché quel file si carica prima di
     data.js: toccare `DATA` mentre si carica sarebbe un tredicesimo
     vincolo d'ordine preso per niente. */
  if(window.IMG){
    IMG.precarica(DATA.ARREDI);
    IMG.precarica({ omino: DATA.OMINO });   // il foglio della camminata
    IMG.precarica(DATA.OMINO_ATTREZZI, 'omino:');   // e uno per attrezzo in mano
    IMG.precarica(DATA.VEGETAZIONE, 'veg:');        // alberi, erbaccia, ceppo
    IMG.precarica(DATA.NPC_FOGLI, 'npc:');          // gli abitanti disegnati a mano
    IMG.precarica({ terreni: DATA.TERRENI });      // il foglio dei terreni
    IMG.precarica({ minerali: DATA.MINERALI });    // e quello dei minerali
    IMG.precarica(DATA.EDIFICI, 'ed:');            // le nove facciate
    IMG.precarica(DATA.ANIMALI, 'an:');            // le bestie, con le loro pose
    /* Col prefisso: `cartello` e `spaventapasseri` stanno in tutti e due
       gli elenchi, e le immagini si tengono per id — senza, la seconda
       richiesta si perderebbe e nello zaino resterebbe il disegno in
       codice mentre il file si scarica lo stesso. */
    IMG.precarica(DATA.ICONE, 'icona:');    // le icone nelle finestre

    /* I DUE CONTROLLI CHE VOGLIONO UN CANVAS E LE IMMAGINI ARRIVATE.

       `tools/coerenza.js` gira in Node e un canvas non ce l'ha, quindi
       queste due domande — quanto è alto un tetto, da che parte guarda
       un abitante — si possono fare solo qui. Girano una volta sola,
       quando non c'è più niente in volo, e scrivono in console.

       E vanno chiamati: `W.verificaProporzioni` esisteva da un pezzo e
       non lo invocava nessuno, cioè era un controllo che non ha mai
       controllato niente. Un rilevatore spento è peggio che non averlo,
       perché uno lo conta fra le sue reti. */
    const controlli = ()=>{
      if(IMG.stato().inVolo){ setTimeout(controlli, 400); return; }
      if(WORLD.verificaProporzioni) WORLD.verificaProporzioni();
      if(ART.verificaDirezioni) ART.verificaDirezioni();
      if(ART.verificaGiunte) ART.verificaGiunte();
    };
    setTimeout(controlli, 900);
  }
  window.addEventListener('resize', ()=>{ REND.resize(); REND.initMeteo(); });
  collegaInput();
  collegaTitolo();
  collegaLanding();
  TITOLO.avvia();
}

/* ===================================================================
   LANDING PAGE — front page con "cosa offre" e i pulsanti di avvio.
   Si gioca da tutto: i comandi a tocco stanno in tocco.js.
   =================================================================== */
function collegaLanding(){
  // la landing usa lo sfondo animato del titolo: nascondi il vecchio menu del titolo
  const ti = $('#title-inner'); if(ti) ti.style.display='none';
  /* Il telefono non si rifiuta più.

     Qui c'era `daMobile()`, e chiudeva la porta: la landing prendeva la
     classe `solo-desktop`, «Nuova Partita» diventava «Solo da computer»
     e ogni clic apriva un avviso. Era onesto finché era vero — il tocco
     non poteva interagire né avanzare un dialogo, cioè il gioco non si
     poteva finire. Adesso quei due buchi sono chiusi (tocco.js), la
     barra degli attrezzi entra nello schermo e si vedono 11,7 caselle
     invece di 5,9: il motivo del cancello non c'è più, e il cancello
     nemmeno.

     Sono spariti anche il riquadro «Fioralba si gioca da computer» in
     cima alla landing e la schermata a tutto schermo `#mobile-warn`:
     non erano soltanto inutili, dicevano una cosa falsa, e del markup
     morto che afferma il contrario di come sta il gioco è peggio di
     niente — al primo che lo rilegge sembra una cosa da riattivare. */

  if(window.LANDING) LANDING.init();

  /* «Continua» apre il selettore delle partite: questo dispositivo si
     ricorda i codici che ha visto, e li mostra invece di chiederli. Se
     non ne conosce nessuno la stessa finestra chiede il codice, che è
     la sola cosa che serve sapere per riprendere da qualunque parte.

     Prima il pulsante si abilitava guardando `fioralba_save_v1`: era
     spento per chiunque arrivasse da un altro computer — cioè proprio
     per chi una partita ce l'aveva. Adesso è sempre acceso, perché la
     domanda «ce l'hai una partita?» la sa solo il server. */
  document.querySelectorAll('.lp-continue').forEach(b=>{
    b.disabled = false; b.removeAttribute('title');
    b.addEventListener('click', ()=>{
      SND.resume(); SND.play('menu');
      UI.scegliPartita();
    });
  });
  document.querySelectorAll('.lp-new').forEach(b=>{
    b.addEventListener('click', ()=>{
      SND.resume(); SND.play('menu');
      cominciaNuova();
    });
  });

  /* Chi apriva Fioralba ieri ha ancora la partita dentro al browser.
     Non deve accorgersi di niente: la si manda sul server, si prende un
     codice, e si continua. La chiave vecchia si cancella solo a
     conferma arrivata — se il server non risponde, quello che c'era
     c'è ancora, e si riprova al prossimo avvio. */
  if(window.SINC && SINC.daMigrare() && UI.proponiMigrazione) UI.proponiMigrazione();
}

/* Una partita nuova non cancella più niente: ogni partita ha il suo
   codice, e quella di prima resta dov'è. Sparisce con questo tutto
   l'avviso «cominciandone una nuova la perdi» — che era vero finché la
   partita stava nel browser e ce n'era una sola. */
function cominciaNuova(){
  /* Anche di qui si passa dal nome: è obbligatorio, e una porta di
     riserva che lo salta lo renderebbe obbligatorio solo per finta.
     È lo stesso campo dell'altra porta — `UI.chiediNome` e la finestra
     del codice chiamano tutte e due `campoNome` — perché due campi che
     si comportano quasi uguale sono peggio di uno. */
  if(!window.SINC){
    UI.chiediNome(n=>nuovaPartita(n));
    return;
  }
  UI.attesaServer('Preparo la valle…');
  SINC.nuova().then(r=>{
    if(!r.ok){ UI.erroreServer(r.errore); return; }
    /* Il codice PRIMA della partita, e non dopo.

       Facendolo dopo, `nuovaPartita()` chiama `avviaGioco(true)` che a
       700 ms apre la lettera di Nonna Ilde a tutto schermo: il codice
       finiva sotto, e il primo gesto di chi comincia sarebbe stato
       chiudere una finestra senza leggerla. Qui invece la finestra del
       codice è l'ultima cosa che si vede prima della valle, non ha
       crocetta, e il suo unico pulsante fa cominciare. */
    UI.mostraCodice(r.codice, true, n=>nuovaPartita(n));
  });
}

/* ===================================================================
   AVVIO DELLA PARTITA
   Stava sotto l'intestazione "TITOLO" insieme al disegno della
   schermata, e da lì veniva l'impressione che quella sezione fosse
   legata a mezzo gioco: erano queste quattro funzioni ad esserlo — la
   scena animata (ora in titolo.js) non chiamava niente.
   =================================================================== */
/* Il menu del titolo: la landing lo nasconde (`title-inner` sparisce
   in collegaLanding), ma resta la strada di chi entra col gioco già
   avviato. Le due porte fanno la stessa cosa della landing, e non due
   cose simili — averle diverse è come sono nate metà delle stranezze
   di questo file. */
function collegaTitolo(){
  $('#btn-continue').classList.remove('hidden');
  $('#btn-new').onclick      = ()=>{ SND.resume(); SND.play('menu'); cominciaNuova(); };
  $('#btn-continue').onclick = ()=>{ SND.resume(); SND.play('menu'); UI.scegliPartita(); };
  $('#btn-howto').onclick    = ()=>{ SND.resume(); UI.comeSiGioca(); };
}

async function nuovaPartita(nome){
  /* Il manifesto arriva da un JSON pubblico: si aspetta qui, prima di
     creare la valle, così la prima partita non vede per un fotogramma la
     mappa vecchia e poi quella approvata. */
  if(window.SCENARI && SCENARI.pronto) await SCENARI.pronto;
  Object.assign(G, statoIniziale());
  /* Il nome arriva dalla finestra che può chiamarci prima del manifesto.
     Si assegna DOPO l'attesa, altrimenti `statoIniziale()` lo
     riscriverebbe con «Contadino» proprio quando si parte con una rete
     lenta. */
  if(nome) G.nomeGiocatore = nome;
  G.maps = WORLD.crea();
  if(window.SCENARI) SCENARI.applica(G.maps);
  G.p.look = G.look;
  G.p.px = 8*T+T/2; G.p.py = 10*T+T/2;
  G.animali = [{tipo:'gatto', mappa:'podere', px:10*T, py:9*T, dir:1, tx:10, ty:9, wait:0}];
  WORLD.nuovoGiorno(G.maps, G.stagione().id, 12345);
  G.richieste = [];
  G.aggiornaRichieste();          // qualche richiesta già dal primo giorno
  G.sagra = G.creaSagra();        // la sagra di primavera è già in corso
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
  G.rifaiPassanti();              // il paese si ripopola prima del primo fotogramma
  G.aggiornaOspitiSagra();          // se si riprende proprio nel giorno di festa
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
  /* Il pacco della valle, se oggi è un giorno nuovo. Dopo la lettera
     d'apertura e dopo la guida, mai insieme: alla primissima partita si
     accavallerebbero tre finestre in tre secondi, e il pacco è quello
     che può aspettare. Chi riprende una partita lo trova subito. */
  G.controllaSerie();
  if(G.serie.daPrendere)
    setTimeout(()=>{ if(G.inGioco && !UI.modalAperta()) UI.pacco(G); }, conIntro ? 2600 : 900);
  ultimo = performance.now();
  /* Un loop solo, sempre. «Cambia partita» dal menu arriva qui con la
     partita vecchia ancora in corsa (`G.inGioco` non è mai tornato
     falso): un secondo requestAnimationFrame avrebbe messo due loop a
     disegnare lo stesso canvas, e un cambio dopo l'altro li avrebbe
     accumulati. Il loop esistente continua da solo con lo stato nuovo. */
  if(!loopInCorsa){
    loopInCorsa = true;
    requestAnimationFrame(loop);
  }
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
      UI.toast(o.premio ? fraseF('Traguardo compiuto: {0} — {1} monete da riscuotere', o.nome, o.premio)
                        : fraseF('Traguardo compiuto: {0}', o.nome),
               'gold', o.icona);
      particelleTesto(G.p.px, G.p.py-52*K, 'TRAGUARDO!', '#ffe270');
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

    particelleTesto(G.p.px, G.p.py-40*K, 'LIVELLO '+dopo, '#ffe270');
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
  const cx = G.p.px, cy = G.p.py - 22*K;
  for(let i=0;i<46;i++){
    const a = Math.random()*6.283, v = 0.5+Math.random()*2.1;
    G.particelle.push({ t:'stella', x:cx, y:cy,
      vx:(Math.cos(a)*v)*K, vy:(Math.sin(a)*v-0.5)*K, g:0.006*K,
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
  /* La stessa percentuale in due posti perché la barra cambia verso:
     in piedi si riempie in altezza, col telefono coricato in larghezza
     (26×150 diventa 118×20, o metà schermo se ne va per un numero).
     Scriverla come variabile invece di cambiare il verso qui dentro
     lascia la scelta al CSS, che è l'unico che sa com'è girato lo
     schermo — e non fa esistere due strade nel JS che devono restare
     d'accordo per sempre. */
  const barra = $('#energyfill');
  barra.style.height = pct+'%';
  barra.style.setProperty('--energia', pct+'%');
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
  if(!G.inGioco){ loopInCorsa = false; return; }   // il loop si ferma solo uscendo dal gioco
  try{
    /* Anche da sotto: il primo `ts` di requestAnimationFrame è l'ora di
       inizio del fotogramma, che può PRECEDERE il performance.now() con
       cui avviaGioco ha appena riempito `ultimo`. Un dt negativo manda
       G.tempoMs sotto zero, e col tempo negativo la fase delle
       increspature della fontana diventa negativa: raggio negativo,
       `ellipse` lancia, e quel fotogramma muore a metà lasciando il
       contesto sporco (globalAlpha compreso) per il fotogramma dopo. */
    const dt = Math.min(50, Math.max(0, ts-ultimo));
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
      sistema('npc',       ()=>G.aggiornaNPC(dt));
      sistema('animali',   ()=>aggiornaAnimali(dt));
      sistema('passanti',  ()=>G.aggiornaPassanti(dt));
      sistema('fauna',     ()=>MOBS.aggiorna(G, dt));
      sistema('guardia',   guardiaGiocatore);
    }
    if(PESCA.inCorso()) sistema('pesca', ()=>PESCA.aggiorna(dt));

    // le chiacchiere girano anche a menu aperto: devono poter scadere
    sistema('chiacchiere', ()=>G.aggiornaChiacchiere(dt));

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
    p.px=s.x*T+T/2; p.py=s.y*T+20*K; p.vx=0; p.vy=0;
    return;
  }
  const maxX=m.w*T-2*K, maxY=m.h*T-2*K;
  if(p.px<2*K||p.py<2*K||p.px>maxX||p.py>maxY){
    p.px=Math.max(2*K,Math.min(maxX,p.px));
    p.py=Math.max(2*K,Math.min(maxY,p.py));
  }
}

/* I due monti — energia e caselle dello zaino — si ricalcolano sempre dai
   pezzi, non si sommano man mano. È il motivo per cui una partita già
   cominciata si ritrova subito il valore giusto: valeva già per
   l'energia (base + quello che si è guadagnato salendo di livello), e
   adesso vale anche per lo zaino.

   Il silo faceva `G.invMax = Math.min(36, G.invMax+12)`, cioè scriveva
   il risultato invece degli addendi. Finché era l'unico a toccare quel
   numero reggeva; con lo zaino comprato da Bruno no, perché due
   ricalcoli di fila avrebbero dato risultati diversi a seconda
   dell'ordine, e il tetto a 36 avrebbe mangiato in silenzio quello che
   uno aveva appena pagato. 27 + 9 col silo fa 36, cioè esattamente
   quello che dava prima: chi ha il silo non guadagna e non perde nulla.

   Il `while(...) push(null)` viene dopo perché l'array cresce e non si
   accorcia mai: uno zaino non si rimpicciolisce. */
const ZAINO_BASE = 27, ZAINO_SILO = 9;
G.applicaPersona = function(){
  if(!G.persona || typeof G.persona!=='object') G.persona = {};
  const P = window.PERSONA;
  G.energiaMax = ENERGIA_BASE + G.energiaBonus + (P ? P.valore('resistenza') : 0);
  G.invMax = ZAINO_BASE + ((G.costruzioni && G.costruzioni.silo) ? ZAINO_SILO : 0)
           + (P ? P.valore('zaino') : 0);
  while(G.inv.length < G.invMax) G.inv.push(null);
};

/* garantisce che tutte le strutture di stato esistano e siano del tipo giusto:
   così salvataggi vecchi/parziali non mandano in errore il resto del motore. */
function normalizzaStato(){
  const A = k => { if(!Array.isArray(G[k])) G[k]=[]; };
  const O = k => { if(!G[k] || typeof G[k]!=='object') G[k]={}; };
  ['inv','richieste','cassaConsegna','animali','premiSospesi'].forEach(A);
  ['skills','attrezziLiv','amicizia','costruzioni','santuario','santuarioDato',
   'lettere','ricetteNote','stats','obiettiviRiscossi','visitati','collezione','regaloRicevuto',
   'parlatoOggi','regalatoOggi','mercato','gatto','vicende','persona'].forEach(O);
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
  G.applicaPersona();
  if(typeof G.energia !== 'number' || !isFinite(G.energia)) G.energia = G.energiaMax;
  G.energia = Math.min(G.energia, G.energiaMax);
  while(G.inv.length < G.invMax) G.inv.push(null);
  // giocatore incastrato in un solido dopo il caricamento → sblocca (una tantum)
  const p=G.p, m=(G.maps && G.maps[G.mappaId]) ? G.maps[G.mappaId] : null;
  if(p && m){
    if(!isFinite(p.px)||!isFinite(p.py)){ p.px=8*T+T/2; p.py=10*T+20*K; }
    const tx=(p.px/T)|0, ty=(p.py/T)|0;
    if(WORLD.solido(m,tx,ty)){ const s=WORLD.vicinoLibero(m,tx,ty); p.px=s.x*T+T/2; p.py=s.y*T+20*K; }
  }
  dissotterraIlRaccolto();
}

/* --- il raccolto rimasto sotto a un edificio ---

   Segnalato da chi ci giocava: «costruisco il pollaio… torno a casa
   così ci metto dentro una gallina» e il pollaio è nato sopra al campo.
   «Non posso neanche raccogliere il raccolto.»

   Le colture restano scritte in `m.suolo` ma la casella è diventata
   muro: invisibili, non raccoglibili, e senza modo di spostare
   l'edificio. Adesso la zappa non lascia più seminare lì (vedi
   `WORLD.riservata`), ma chi ce l'ha già sotto va tirato fuori — e non
   basta cancellare il terreno: quella roba è stata seminata, annaffiata
   e aspettata, e va restituita.

   Gira a ogni caricamento perché è lì che si scopre il danno, e non fa
   niente quando non c'è niente da fare: nessun messaggio, nessun costo. */
function dissotterraIlRaccolto(){
  const m = G.maps && G.maps.podere;
  if(!m || !m.suolo) return;
  const resi = {};
  let quante = 0;
  for(let i=0;i<m.suolo.length;i++){
    const s = m.suolo[i];
    if(!s) continue;
    const x = i % m.w, y = (i / m.w) | 0;
    if(!WORLD.solido(m, x, y)) continue;          // si raggiunge: non c'è niente da salvare
    /* matura o no, il seme torna indietro: se era a metà crescita
       restituire il raccolto sarebbe un regalo, e restituire niente un
       furto. Il seme è quello che il giocatore aveva comprato. */
    if(s.crop){
      const maturo = DATA.CROPS[s.crop] && s.stage >= DATA.CROPS[s.crop].fasi.length;
      const cosa = maturo ? s.crop : ('seme_' + s.crop);
      if(DATA.ITEMS[cosa]){ resi[cosa] = (resi[cosa]||0) + 1; quante++; }
    }
    m.suolo[i] = null;
  }
  if(!quante) return;

  const pezzi = [];
  for(const id in resi){
    if(G.puoiAggiungere(id, resi[id])) G.aggiungi(id, resi[id]);
    else G.premiSospesi.push({ item:id, n:resi[id], da:'campo', liv:0 });
    pezzi.push(resi[id] + '× ' + IT.nome(id));
  }
  /* Si dice, e si dice perché: trovarsi otto rape nello zaino senza
     spiegazione è più inquietante che non trovarle. */
  setTimeout(()=>{
    if(!window.UI) return;
    UI.modal('Il campo sotto la costruzione', body=>{
      const p1=document.createElement('div'); p1.style.marginBottom='10px';
      p1.innerHTML = 'Una costruzione era stata tirata su sopra a un pezzo di campo seminato, e '+
                     'quel raccolto era rimasto lì sotto: non si vedeva e non si poteva raccogliere.';
      body.appendChild(p1);
      /* Modello e non concatenazione: `'…<b>' + roba + '</b>.'` spezza il
         tag fra due stringhe — il controllo dei tag lo boccia, e in
         inglese uscirebbe metà frase con la grammatica italiana. */
      const p2=document.createElement('div'); p2.style.marginBottom='10px';
      const modello = 'Te l\'ho tirato fuori: <b>{0}</b>. Se lo zaino era pieno ti aspetta nella scheda delle abilità.';
      p2.innerHTML = window.LINGUA ? LINGUA.f(modello, pezzi.join(', '))
                                   : modello.replace('{0}', pezzi.join(', '));
      body.appendChild(p2);
      const p3=document.createElement('div'); p3.className='muted';
      p3.textContent = 'Da adesso la zappa non lavora più il prato riservato alle costruzioni, così non ricapita.';
      body.appendChild(p3);
    });
  }, 900);
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
    /* Le scarpe di Oreste. Moltiplicano invece di sommare, come fa il
       sentiero qui accanto: sommare avrebbe dato lo stesso regalo a chi
       cammina e a chi corre, e camminando si sarebbe sentito il doppio. */
    let vel = (correndo?1.9:1.18)*K * (duro?1.14:1) * (1 + (window.PERSONA ? PERSONA.valore('scarpe') : 0));
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
  const HW = 7*K, HH = 5*K;   // mezzo hitbox ai piedi

  // X
  if(dx){
    const nx = p.px + dx;
    if(!collide(m, nx, p.py, HW, HH)) p.px = nx;
    else {
      // scivolamento sugli angoli
      const step = dx>0?1:-1;
      if(!collide(m, nx, p.py-3*K, HW, HH) && !collide(m, p.px, p.py-3*K, HW, HH)) p.py -= 0.6*K;
      else if(!collide(m, nx, p.py+3*K, HW, HH) && !collide(m, p.px, p.py+3*K, HW, HH)) p.py += 0.6*K;
    }
  }
  // Y
  if(dy){
    const ny = p.py + dy;
    if(!collide(m, p.px, ny, HW, HH)) p.py = ny;
    else {
      if(!collide(m, p.px-3*K, ny, HW, HH) && !collide(m, p.px-3*K, p.py, HW, HH)) p.px -= 0.6*K;
      else if(!collide(m, p.px+3*K, ny, HW, HH) && !collide(m, p.px+3*K, p.py, HW, HH)) p.px += 0.6*K;
    }
  }
  p.px = Math.max(4*K, Math.min(m.w*T-4*K, p.px));
  p.py = Math.max(10*K, Math.min(m.h*T-4*K, p.py));
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
    G.particelle.push({t:'terra', x:G.p.px+(Math.random()*8-4)*K, y:G.p.py-K,
      vx:((Math.random()-0.5)*0.3)*K, vy:(-0.15)*K, g:0.006*K, vita:260, vitaMax:260, s:2, c:'#a8875b', alpha:0.6});
  }
}

/* ===================================================================
   CAMERA
   =================================================================== */
function aggiornaCamera(subito){
  const m = G.mappa();
  const {VW,VH} = REND.info();
  let tx = G.p.px - VW/2;
  let ty = G.p.py - VH/2 - 8*K;
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
    const minX = m.w*T < VW ? tx : 0, maxCamX = m.w*T < VW ? tx : maxX;
    const minY = m.h*T < VH ? ty : 0, maxCamY = m.h*T < VH ? ty : maxY;
    /* Un cambio di viewport non deve far inseguire al gioco per parecchi
       secondi una camera ormai impossibile. Dentro i limiti resta la stessa
       interpolazione di sempre; fuori, si torna subito al bersaglio valido. */
    G.cam.x = !isFinite(G.cam.x) || G.cam.x<minX || G.cam.x>maxCamX
      ? tx : G.cam.x+(tx-G.cam.x)*0.14;
    G.cam.y = !isFinite(G.cam.y) || G.cam.y<minY || G.cam.y>maxCamY
      ? ty : G.cam.y+(ty-G.cam.y)*0.14;
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
    const d = Math.hypot(tx*T+T/2-p.px, ty*T+T/2-p.py);
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

/* Quello che si posa dipingendo il terreno invece di appoggiarci un
   oggetto sopra. Il terreno viaggia nel salvataggio, quindi una
   pennellata resta; e siccome i tipi di terreno sono gli stessi che il
   mondo usa da sempre per i pavimenti degli interni, texture e raccordi
   erano già disegnati — qui si è solo aperta la porta.

   `erba` è quello che mancava: il sentiero si posava e non si toglieva
   più, e una casella diventata terra battuta restava terra battuta per
   sempre. La zolla è il verso opposto di tutti gli altri. */
const SUPERFICI = { sentiero:1, assi:1, lastre:1, cotto:1, erba:1 };

function azionePossibile(id, tx, ty){
  const m=G.mappa();
  if(!WORLD.dentro(m,tx,ty)) return false;
  const i=WORLD.idx(m,tx,ty);
  const o=m.obj[i];
  const suolo=m.suolo[i];
  const terr=WORLD.terreno(m,tx,ty);
  const cat=IT.cat(id);

  if(id==='zappa') return m.coltivabile && !o && !suolo && (terr==='erba'||terr==='terra')
                        && !WORLD.riservata(m, tx, ty, G.costruzioni);
  if(id==='annaffiatoio') return (suolo && !suolo.bagnato) || terr==='acqua';
  if(id==='ascia') return !!(o && (o.t==='albero'||o.t==='ceppo'||o.t==='ramo'));
  if(id==='piccone') return !!(o && (o.t==='sasso'||o.t==='stalagmite'||o.t==='mobile')) || !!(suolo && !suolo.crop);
  if(id==='falce') return !!(o && (o.t==='erbaccia'||o.t==='fiori'||o.t==='cespuglio'));
  if(id==='canna') return terr==='acqua';
  if(cat==='seme') return !!(suolo && !suolo.crop);
  if(DATA.ITEMS[id] && DATA.ITEMS[id].posabile){
    const kind = DATA.ITEMS[id].posabile;
    /* Le SUPERFICI non posano un oggetto: dipingono il terreno, quindi
       hanno regole loro. Si dipinge anche sotto a una staccionata o a
       una lanterna — l'oggetto sta sopra e non c'entra — ma non sul
       terreno arato, che vorrebbe dire cancellare una coltura senza
       averlo chiesto.

       Solo all'aperto: le stanze si riscrivono da `world.js` a ogni
       caricamento e il salvataggio degli interni tiene solo casse e
       macchinari, quindi un pavimento dipinto in casa sparirebbe alla
       riapertura senza che niente lo dica.

       E mai la stessa tinta che c'è già: sarebbe una zolla buttata per
       non cambiare niente, ed è l'errore più facile da fare passando la
       superficie a pennellate. */
    if(SUPERFICI[kind]){
      if(!m.esterno || suolo) return false;
      if(terr==='acqua'||terr==='roccia'||terr==='vuoto'||terr==='grotta') return false;
      return terr !== kind;
    }
    return !o && !suolo && terr!=='acqua' && terr!=='roccia';
  }
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

/* Il perché, detto con la cosa che ci andrà: «qui ci va una
   costruzione» è un divieto, «qui ci va il pollaio» è un'informazione. */
const NOMI_SPAZIO = {
  pollaio: 'Questo pezzo di prato è dove sorgerà il <b>pollaio</b>: meglio non seminarci.',
  serra:   'Questo pezzo di prato è dove sorgerà la <b>serra</b>: meglio non seminarci.',
  silo:    'Questo pezzo di prato è dove sorgerà il <b>silo</b>: meglio non seminarci.'
};

/* perché la zappa non morde questa casella? */
function perchePuoiZappare(m, tx, ty){
  if(!m.coltivabile) return 'Qui non si coltiva: la terra buona è al podere.';
  const i = WORLD.idx(m,tx,ty);
  if(m.suolo[i]) return 'Questa terra è già dissodata: prendi i semi.';
  if(m.obj[i])   return 'C\'è qualcosa sopra: prima libera la casella.';
  const t = WORLD.terreno(m,tx,ty);
  if(t!=='erba' && t!=='terra') return 'La zappa lavora l\'erba e la terra, non questo.';
  /* Il terreno promesso a una costruzione: dirlo PRIMA vale molto più
     che scusarsi dopo. Chi seminava qui, il giorno che comprava il
     pollaio se lo vedeva costruire sopra al campo, e il raccolto
     restava sotto al muro — scritto nel salvataggio e irraggiungibile. */
  const ris = WORLD.riservata(m, tx, ty, G.costruzioni);
  if(ris) return NOMI_SPAZIO[ris] || 'Qui ci andrà una costruzione: tieni la casella libera.';
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
  const ddx = tx*T+T/2-p.px, ddy = ty*T+T/2-p.py;
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
        x:tx*T+(8+Math.random()*16)*K, y:ty*T+(14+Math.random()*10)*K,
        vx:((Math.random()-0.5)*1.1)*K, vy:(-0.7-Math.random()*0.7)*K, g:0.05*K,
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
            x:xx*T+(6+Math.random()*20)*K, y:yy*T+(6+Math.random()*14)*K,
            vx:((Math.random()-0.5)*0.4)*K, vy:0.5*K, g:0.03*K, vita:340, vitaMax:340});
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
          x:tx*T+T/2+(Math.random()-0.5)*30*K, y:ty*T+(4+Math.random()*20)*K,
          vx:((Math.random()-0.5)*1.2)*K, vy:(-0.5-Math.random())*K, g:0.014*K, r:Math.random()*6.3, vr:(Math.random()-0.5)*0.2,
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
          x:tx*T+T/2+(Math.random()-0.5)*22*K, y:ty*T+T/2+(Math.random()-0.5)*16*K,
          vx:((Math.random()-0.5)*1.6)*K, vy:(-0.8-Math.random()*0.8)*K, g:0.055*K,
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
          x:tx*T+T/2+(Math.random()-0.5)*18*K, y:ty*T+18*K,
          vx:((Math.random()-0.5)*1.1)*K, vy:(-0.6-Math.random()*0.5)*K, g:0.02*K, r:Math.random()*6.3, vr:0.2,
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
      UI.toast(fraseF('Non è la stagione giusta per {0}.', C.nome),'bad');
      SND.play('errore');
      return;
    }
    suolo.crop = { id:cropId, stage:0, gg:0 };
    suolo.appassita = false;        // la nuova semina ripulisce i resti secchi
    G.togli(id,1);
    SND.play('semina'); p.usoT=220;
    for(let k=0;k<5;k++) G.particelle.push({t:'terra',
      x:tx*T+(10+Math.random()*12)*K, y:ty*T+T/2+Math.random()*8*K,
      vx:((Math.random()-0.5)*0.5)*K, vy:(-0.4)*K, g:0.03*K, vita:300, vitaMax:300, s:2, c:C.c1});
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
  if(SUPERFICI[kind]){
    m.g[i] = WORLD.ti(kind);
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
  /* Un cartello appena piantato è una tavoletta vuota, e nessuno pianta
     un cartello per lasciarlo bianco: la finestra si apre da sola,
     subito. Chi non ha niente da scrivere la chiude, e il cartello
     resta lì muto finché non ci torna con E. */
  if(kind==='cartello') UI.cartello(m.obj[i]);
}

function spendi(e){
  /* La cintura di Tobia sconta anche il pavimento, non solo il costo.

     Scontando il solo costo, il pavimento a 0.4 si mangiava lo sconto
     proprio dove serve: gli attrezzi potenziati costano già 0.5 e 0.6
     (`3 - liv*0.5`, `2 - liv*0.35`), quindi a fine partita — cioè
     quando la cintura ce l'hai — il 24% promesso ne sarebbe diventato
     un 4%, e la scheda avrebbe raccontato un bonus che non c'era.
     Scontato anche il minimo, il gesto più economico passa da 0.4 a
     0.30: meno, ma mai gratis, che è il motivo per cui il pavimento
     esiste. */
  const sconto = window.PERSONA ? PERSONA.valore('cintura') : 0;
  e = Math.max(0.4 * (1 - sconto), e * (1 - sconto));
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
  particelleTesto(tx*T+T/2, ty*T, '+'+n, '#b6e06a');

  for(let k=0;k<8;k++) G.particelle.push({t:'stella',
    x:tx*T+T/2+(Math.random()-0.5)*20*K, y:ty*T+(14+(Math.random()-0.5)*16)*K,
    vx:((Math.random()-0.5)*0.8)*K, vy:(-0.5-Math.random()*0.5)*K, g:0.01*K,
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
    x:tx*T+T/2+(Math.random()-0.5)*16*K, y:ty*T+T/2,
    vx:((Math.random()-0.5)*0.6)*K, vy:(-0.5)*K, g:0.01*K, vita:520, vitaMax:520, c:'#fff4c8'});
}

/* ===================================================================
   INTERAZIONE (E / clic destro)
   =================================================================== */
/* ===================================================================
   IL PACCO DELLA VALLE — la serie dei giorni veri

   Chi torna trova un pacco sull'aia, uno per giorno di calendario. Il
   settimo è il regalone, poi il giro ricomincia.

   LA DATA SI CONTA IN LOCALE, come «AAAA-MM-GG», non con un timestamp:
   fra le 23:50 e le 00:10 sono due giorni per chi gioca, e devono essere
   due anche qui. `toISOString()` avrebbe dato UTC, cioè lo stesso giorno
   per mezza Europa e il giorno prima per l'altra metà.

   E SALTARE UN GIORNO COSTA UN PASSO, NON TUTTO. Una serie che si azzera
   mette addosso l'obbligo di collegarsi — «se salto perdo la settimana»
   — ed è il contrario del tono di questo gioco, che è fatto per essere
   lasciato lì e ripreso. Si torna indietro di un giorno per ogni giorno
   saltato, col fondo a uno: una dimenticanza costa poco, un mese di
   assenza riporta all'inizio, e in nessun caso c'è una punizione. */
function oggiLocale(d){
  const g = d || new Date();
  const p = n => String(n).padStart(2,'0');
  return g.getFullYear() + '-' + p(g.getMonth()+1) + '-' + p(g.getDate());
}

/* differenza in giorni fra due «AAAA-MM-GG», a mezzogiorno per non farsi
   sbagliare il conto dall'ora legale */
function giorniFra(a, b){
  const P = s => { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d, 12); };
  return Math.round((P(b) - P(a)) / 86400000);
}

G.controllaSerie = function(){
  const s = G.serie;
  const oggi = oggiLocale();
  if(s.ultimo === oggi) return;              // già contato oggi

  if(!s.ultimo){
    s.giorni = 1;
  } else {
    const passati = giorniFra(s.ultimo, oggi);
    if(passati <= 0){ s.ultimo = oggi; return; }   // orologio all'indietro: si lascia stare
    if(passati === 1) s.giorni = (s.giorni % 7) + 1;
    else s.giorni = Math.max(1, s.giorni - (passati - 1));
  }
  s.ultimo = oggi;
  s.daPrendere = s.giorni;
};

/* Il pacco si apre, e quello che c'è dentro entra. Se lo zaino è pieno
   non si perde niente: va nei premi sospesi, come per i livelli — ed è
   il caso normale, non quello raro, perché uno apre il gioco e trova il
   pacco prima ancora di aver svuotato lo zaino di ieri. */
G.apriPacco = function(){
  const s = G.serie;
  if(!s.daPrendere) return null;
  const P = DATA.PREMI_SERIE.find(x => x.g === s.daPrendere) || DATA.PREMI_SERIE[0];
  s.daPrendere = 0;
  const dato = { g:P.g, oro:P.oro||0, roba:[], sospesi:0 };
  if(P.oro){ G.oro += P.oro; G.registraVendita(0); }
  for(const [id, n] of (P.roba||[])){
    if(G.puoiAggiungere(id, n)) G.aggiungi(id, n);
    else { G.premiSospesi.push({ item:id, n, da:'pacco', liv:0 }); dato.sospesi++; }
    dato.roba.push([id, n]);
  }
  G.aggiornaHUD();
  return dato;
};

/* --- LA BOTTIGLIA DAL MARE ---
   Dentro c'è una delle lettere di DATA.BOTTIGLIE, una volta sola:
   `G.bottiglieLette` ricorda quali sono già arrivate, e viaggia nel
   salvataggio. Finite le lettere, una ricetta sbiadita dall'acqua — la
   stessa porta di Marisol, `ricetteNote` — e finite anche quelle,
   qualche moneta vecchia: una bottiglia che si apre e non dà niente è
   una promessa rotta, e il mare non ne fa. */
function apriBottiglia(m, i){
  m.obj[i] = null;
  SND.play('acqua');
  const lette = G.bottiglieLette;
  const chiuse = DATA.BOTTIGLIE.filter(b => lette.indexOf(b.id) < 0);
  if(chiuse.length){
    const b = chiuse[(Math.random()*chiuse.length)|0];
    lette.push(b.id);
    UI.modal('Una bottiglia dal mare', body=>{
      const t=document.createElement('div');
      t.style.cssText='font-style:italic;line-height:1.65;margin-bottom:14px';
      t.textContent = b.testo;
      const f=document.createElement('div');
      f.style.cssText='text-align:right;opacity:.75';
      f.textContent = '— ' + b.firma;
      body.appendChild(t); body.appendChild(f);
    });
    SND.play('regalo');
    return;
  }
  const nuove = DATA.CUCINA.filter(r=>!G.ricetteNote[r.id]);
  if(nuove.length){
    const r = nuove[(Math.random()*nuove.length)|0];
    G.ricetteNote[r.id] = true;
    UI.toast(fraseF("Dentro c'è una ricetta, sbiadita dall'acqua ma leggibile: {0}!", IT.nome(r.id)), 'gold', r.id);
    SND.play('livello');
    return;
  }
  const n = 40 + ((Math.random()*80)|0);
  G.oro += n; G.registraVendita(0);
  UI.toast(fraseF('Dentro ci sono {0} monete, vecchie ma buone.', n), 'gold');
  SND.play('regalo');
  G.aggiornaHUD();
}

function interagisci(){
  const p=G.p, m=G.mappa();
  const px=(p.px/T)|0, py=(p.py/T)|0;

  // NPC vicino
  for(const n of G.npcVivi()){
    if(Math.hypot(n.px-p.px, n.py-p.py) < 46*K){ G.parlaCon(n); return; }
  }

  // il gatto, che non è un NPC ma nemmeno un oggetto
  const gatto = gattoVicino();
  if(gatto){ accarezzaGatto(gatto); return; }

  // caselle intorno
  const off=[[0,1],[-1,0],[1,0],[0,-1]][p.dir];
  const cand=[[px+off[0],py+off[1]],[px,py]];
  for(const [tx,ty] of cand){
    if(!WORLD.dentro(m,tx,ty)) continue;
    /* `WORLD.oggetto` risolve i rimandi: un letto grande due per tre
       occupa sei caselle, e premere E sull'angolo dei piedi dev'essere
       identico a premerlo sulla testata. Da qui in poi `ax, ay` sono
       l'ANCORA del mobile — che può non essere la casella toccata — e
       vanno usate ogni volta che qualcuno se lo deve ricordare: aprirlo,
       spostarlo, guardarci dentro. */
    const trovato = WORLD.oggetto(m, tx, ty);
    if(!trovato) continue;
    const o = trovato.obj, ax = trovato.x, ay = trovato.y;
    const i = WORLD.idx(m, ax, ay);

    if(o.t==='porta'){ apriPorta(o.ed); return; }
    if(o.t==='consegna'){ SOLSTIZIO.apriConsegna(); return; }
    if(o.t==='bottiglia'){ apriBottiglia(m, i); return; }

    /* Col riordino acceso E prende il mobile invece di usarlo. Le porte
       e i muri restano quello che sono, sopra: una casa senza uscita
       sarebbe uno scherzo di cattivo gusto. */
    if(G.riordino && m.interno && o.t!=='muro'){
      G.iniziaSpostamento(o, ax, ay);
      return;
    }

    /* --- arredi degli interni --- */
    if(o.t==='bancone'){
      if(o.uso==='bottega'){ SND.play('menu'); UI.negozio(G,'bruno'); }
      else { SND.play('menu'); G.apriLocanda(); }
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
    if(o.t==='sedia'){ UI.toast('Una sedia impagliata. Scricchiola come faceva allora.'); return; }
    if(o.t==='baule'){ UI.toast('Il baule della dispensa. Dentro c\'è quello che serve, e un po\' di polvere.'); return; }
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
      if(o.kind==='cassa'){ UI.cassa(G,o,ax,ay); return; }
      if(o.pronto){ G.ritiraMacchina(o); return; }
      UI.macchina(G,o,ax,ay); return;
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
      if(o.kind==='cartello'){ UI.cartello(o); return; }
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

/* --- RIORDINARE LA CASA ---

   Le cose che si posa il giocatore hanno il loro «Sposta» nella
   finestrella che si apre con E. I mobili di casa no, e non potevano
   averlo: su di loro E è già preso quasi tutto — il letto apre «Dormi»,
   la cucina i fornelli, la scrivania le lettere — e infilare «Sposta»
   dentro a ognuna di quelle strade voleva dire cambiarne cinque e
   lasciarne fuori due, perché per la cucina e la scrivania un posto
   ovvio dove metterlo non c'era.

   Quindi è una modalità: la si accende dalle Impostazioni e finché è
   accesa E, in casa, vuol dire «prendi questo e spostalo» invece di
   quello che vuol dire di solito. Si spegne da sola uscendo di casa,
   che è il momento in cui non serve più e in cui uno si dimenticherebbe
   di spegnerla. */
G.riordino = false;

G.riordina = function(acceso){
  G.riordino = !!acceso;
  if(!G.riordino && G.spostamento) G.annullaSpostamento();
  UI.toast(G.riordino
    ? 'Riordino acceso: con E prendi un mobile, poi scegli dove metterlo.'
    : 'Riordino spento.', G.riordino ? 'good' : null);
};

/* Prendere in mano un mobile vuol dire liberare TUTTE le sue caselle,
   non quella che si è toccata: un letto lasciato indietro con cinque
   rimandi che puntano al vuoto è un buco solido in mezzo alla stanza,
   invisibile e impossibile da togliere. `WORLD.togliArredo` risolve
   anche il rimando, quindi si può prendere un letto per i piedi. */
G.iniziaSpostamento = function(o, x, y){
  const m = G.mappa();
  const via = WORLD.togliArredo(m, x, y);
  if(!via) return;
  G.spostamento = { obj:via.obj, mappa:m.id, x:via.x, y:via.y };
  SND.play('prendi');
  UI.toast('Scegli dove metterlo. Esc per rimetterlo dov\'era.', 'good');
};

G.annullaSpostamento = function(){
  const s = G.spostamento;
  if(!s) return false;
  const m = G.maps[s.mappa];
  if(m) WORLD.arredo(m, s.x, s.y, s.obj);
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
  /* La casella scelta è l'ANGOLO IN ALTO A SINISTRA di quello che si
     posa, e per un mobile grande devono essere libere tutte quelle che
     copre: un letto due per tre chiede sei caselle e le chiede tutte
     insieme. Il messaggio lo dice, se no chi prova a metterlo contro il
     muro vede solo un rifiuto e non capisce che gli manca lo spazio a
     destra. */
  if(!WORLD.ciStaArredo(m, tx, ty, s.obj)){
    const f = WORLD.impronta(s.obj);
    nonSiPuo(f.w>1 || f.h>1
      ? fraseF('Qui non ci sta: questo mobile occupa {0}×{1} caselle, e le vuole libere tutte.', f.w, f.h)
      : 'Qui non ci sta: serve una casella libera, senza acqua e senza terra dissodata.');
    return false;
  }
  WORLD.arredo(m, tx, ty, s.obj);
  /* Se è un mobile SCRITTO dentro a una stanza, l'unico modo di
     ritrovarlo lì domani è annotarselo: il salvataggio degli interni
     tiene le casse e i macchinari del giocatore e null'altro. Quelli non
     hanno bisogno di niente e infatti si saltano.

     Si tiene una riga sola per mobile, non una per spostamento: se
     esiste già un'annotazione che finiva dove questo comincia, le si
     cambia l'arrivo. E se il giro riporta il mobile dov'era nato,
     l'annotazione si toglie invece di restare a dire «da qui a qui». */
  const daInterno = G.maps[s.mappa] && G.maps[s.mappa].interno;
  const scritto = s.obj.t !== 'macchina' && s.obj.t !== 'mobile';
  if(daInterno && scritto && s.mappa === m.id){
    const partenza = WORLD.idx(m, s.x, s.y);
    const gia = G.arrediSpostati.find(r => r.m===m.id && r.t===s.obj.t && r.a===partenza);
    if(gia){
      if(gia.da === i) G.arrediSpostati.splice(G.arrediSpostati.indexOf(gia), 1);
      else gia.a = i;
    } else {
      G.arrediSpostati.push({ m:m.id, t:s.obj.t, da:partenza, a:i });
    }
  }
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
  /* Gli arredi con E non si toccano più: l'etichetta prometterebbe il
     falso. Il cartello è l'eccezione, perché lì E è l'unica cosa che
     abbia senso fare, non toglie niente per sbaglio, e apre una
     finestra che si può chiudere senza cambiare nulla. */
  if(o.t==='mobile'){
    /* Tradotta qui e non da `UI.prompt`: là arriva la frase già montata
       col `<kbd>E</kbd>` davanti, e una chiave con dentro il markup non
       la cerca nessuno — è il motivo per cui «esamina le rune» in
       inglese è ancora in italiano. Qui la stringa è nuda. */
    if(o.kind==='cartello'){
      const e = o.testo ? 'riscrivi il cartello' : 'scrivi sul cartello';
      return window.LINGUA ? LINGUA.t(e) : e;
    }
    return null;
  }
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
    if(Math.hypot(n.px-p.px, n.py-p.py) < 46*K){
      const N = DATA.NPCS[n.id];
      UI.prompt(fraseF('<kbd>E</kbd> parla con {0}', N ? N.nome : frase('qualcuno')));
      return;
    }
  }

  if(gattoVicino()){
    UI.prompt(fraseF('<kbd>E</kbd> accarezza {0}', G.nomeGatto() || frase('il gatto')));
    return;
  }

  const px=(p.px/T)|0, py=(p.py/T)|0;
  const off=[[0,1],[-1,0],[1,0],[0,-1]][p.dir];
  for(const [tx,ty] of [[px+off[0],py+off[1]],[px,py]]){
    if(!WORLD.dentro(m,tx,ty)) continue;
    const et = etichettaInterazione(m.obj[WORLD.idx(m,tx,ty)]);
    if(et){ UI.prompt('<kbd>E</kbd> '+et); return; }
  }

  /* Gli arredi posati non rispondono a E — l'etichetta prometterebbe il
     falso, e con E si toglievano per sbaglio camminando lungo il
     recinto. Ma non dire NIENTE è peggio, e l'ha dimostrato una
     segnalazione: «non riesce a spaccare le fence». Il piccone le toglie
     da sempre, e le rimette nello zaino intere; quello che mancava era
     la riga che lo dice, nel momento in cui uno ci sta davanti e si
     chiede cosa farne.

     Niente `<kbd>`: non è un tasto, è un attrezzo da prendere in mano, e
     scriverlo come un tasto manderebbe a cercarlo sulla tastiera. */
  for(const [tx,ty] of [[px+off[0],py+off[1]],[px,py]]){
    if(!WORLD.dentro(m,tx,ty)) continue;
    const o = m.obj[WORLD.idx(m,tx,ty)];
    if(!o || o.t!=='mobile') continue;
    const suo = idDaKind(o.kind);
    /* «la togli» al femminile andava sulla staccionata e steccava sul
       cancelletto, che è maschile. Impersonale: vale per tutti e due, e
       non obbliga a una tabella dei generi per una riga sola. */
    UI.prompt(fraseF('Col <b>{0}</b> si toglie: {1}', IT.nome('piccone'), IT.nome(suo)));
    return;
  }
  UI.prompt(null);
}

/* Esposta apposta: gira dentro al loop, e nel pannello del browser il
   loop non parte mai — senza questa, l'unico modo di provare il
   suggerimento è giocarci a mano e fidarsi. */
G.promptContestuale = promptContestuale;

/* i modelli con un pezzo dentro, in game.js: `T` qui è la misura della
   casella (32), quindi la traduzione si chiama per esteso */
function fraseF(modello, ...pezzi){
  return window.LINGUA ? LINGUA.f(modello, ...pezzi)
                       : modello.replace(/\{(\d+)\}/g, (_,i)=>pezzi[i]);
}
/* e il pezzo da solo, per quando è lui a finire dentro a un modello:
   `fraseF('<kbd>E</kbd> parla con {0}', ...)` riceve o il nome di un
   abitante — che non si traduce — oppure «qualcuno», che sì. */
function frase(testo){
  return window.LINGUA ? LINGUA.t(testo) : testo;
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
    case 'locanda': G.apriLocanda(); break;
    case 'fucina': UI.fucina(G); break;
    case 'santuario': SOLSTIZIO.apriSantuario(); break;
    case 'serafina': UI.dialogo('serafina', ['La porta è socchiusa, ma Serafina è fuori, nell\'orto.']); break;
    case 'eremita': UI.dialogo('eremita', ['La porta di legno è chiusa. L\'eremita sarà fuori, da qualche parte sulla neve.']); break;
    case 'pollaio': apriPollaio(); break;
    case 'serra': UI.toast('La serra è calda e umida. Qui puoi coltivare tutto l\'anno.'); break;
    case 'rovina_pollaio': apriRovina('pollaio'); break;
    case 'rovina_serra':   apriRovina('serra'); break;
    default: UI.toast('È chiuso.'); break;
  }
}

/* QUELLO CHE RESTA DEL POLLAIO, E DELLA SERRA.

   Tre righe di storia da `DATA.ROVINE` e una quarta che la fa il gioco,
   perché dice dei numeri: quanto manca e quanto costa. Quei numeri
   stanno in `DATA.COSTRUZIONI` e da lì si leggono — scriverli qui
   sarebbe il solito numero di bilanciamento in due posti, e la rovina
   finirebbe per promettere un prezzo che alla fucina non esiste.

   La quarta riga cambia da sola quando hai di che: a chi ha già tutto
   non si elenca quello che ha in tasca, si dice che può andare. */
function apriRovina(id){
  const R = DATA.ROVINE && DATA.ROVINE[id];
  const C = DATA.COSTRUZIONI.find(c => c.id === id);
  if(!R || !C){ UI.toast('Non ne resta granché.'); return; }

  const righe = R.righe.map(r => r.replace('{stagione}', G.stagione().nome));
  if(G.costruzioni[id]){ UI.dialogo(null, righe, {nome:R.nome}); return; }

  const manca = [];
  for(const k in C.ing){
    const ho = G.conta(k);
    if(ho < C.ing[k]) manca.push(IT.nome(k) + ' ' + ho + '/' + C.ing[k]);
  }
  if(G.oro < C.costo) manca.push(G.oro + '/' + C.costo + ' monete');

  righe.push(manca.length
    ? 'Da <b>Tobia</b>, alla fucina, si rimette in piedi. Ti manca: ' + manca.join(', ') + '.'
    : 'Hai tutto quello che serve. Da <b>Tobia</b>, alla fucina, si rimette in piedi quando vuoi.');

  UI.dialogo(null, righe, {nome:R.nome});
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
          x:G.p.px+(Math.random()-0.5)*40*K, y:G.p.py-(20+Math.random()*20)*K,
          vx:((Math.random()-0.5)*0.3)*K, vy:(-0.5)*K, g:0, vita:900, vitaMax:900, c:'#e04a63'});
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
   AGENDE, COSA DICE OGGI, PASSANTI E CHIACCHIERE — stanno in
   abitanti.js. Qui restano i due riagganci: le funzioni tornano su G,
   che è dove le cerca il resto del gioco (render.js i passanti e i
   vivi, solstizio.js la fascia dell'agenda, il pannello di prova la
   chiacchiera), e le due liste nascono qui e vuote perché abitanti.js
   si carica prima di G.
   =================================================================== */
Object.assign(G, ABITANTI);
G.passanti = [];
G.chiacchiere = [];
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
      x:G.p.px+(Math.random()-0.5)*44*K, y:G.p.py-(16+Math.random()*24)*K,
      vx:((Math.random()-0.5)*0.35)*K, vy:(-0.55-Math.random()*0.2)*K, g:0,
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
    if(Math.hypot(a.px-G.p.px, a.py-G.p.py) < 42*K) return a;
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
      x:a.px+(Math.random()-0.5)*20*K, y:a.py-(14+Math.random()*10)*K,
      vx:((Math.random()-0.5)*0.25)*K, vy:(-0.45)*K, g:0, vita:800, vitaMax:800, c:'#f08a9a'});
    return;
  }

  const prima = faseGatto();
  g.giorno = G.giornoTot;
  g.affetto = Math.min(100, g.affetto + 6);
  const dopo = faseGatto();

  for(let k=0;k<7;k++) G.particelle.push({t:'cuoricino',
    x:a.px+(Math.random()-0.5)*26*K, y:a.py-(16+Math.random()*16)*K,
    vx:((Math.random()-0.5)*0.3)*K, vy:(-0.5)*K, g:0, vita:1000, vitaMax:1000, c:'#e04a63'});

  UI.toast(chi + ': ' + dopo.frasi[(Math.random()*dopo.frasi.length)|0]);
  G.progresso();

  if(dopo !== prima) particelleTesto(a.px, a.py-30*K, 'si fida di più', '#f0a8b8');

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
      if(WORLD.dentro(m,nx,ny) && !WORLD.solidoPerBestie(m,nx,ny)) a.dest={x:nx*T+T/2,y:ny*T+20*K};
      else { a.wait=900; continue; }
    }
    const dx=a.dest.x-a.px, dy=a.dest.y-a.py, d=Math.hypot(dx,dy);
    if(d<4*K){ a.dest=null; a.wait=1200+Math.random()*3400; continue; }
    const spd=(a.tipo==='gatto'?0.42:0.3)*K*dt/16;
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
const GITTATA = 210*K;        // portata dell'arco semplice, in pixel di mondo
const CONO = 0.62;            // mezzo angolo del cono di tiro, in radianti
const COSTO_TIRO = 4;

/* La preda più conveniente davanti a te: la più vicina dentro il cono. */
function predaMirata(){
  if(!window.MOBS) return null;
  const p = G.p;
  const liv = G.attrezziLiv.arco || 0;
  const portata = GITTATA + liv*55*K;
  const versoX = [0,-1,1,0][p.dir], versoY = [1,0,0,-1][p.dir];
  let scelta = null, vicina = Infinity;
  for(const b of MOBS.lista()){
    if(!MOBS.ePreda(b)) continue;
    const dx = b.x - p.px, dy = (b.y - b.z) - p.py;
    const d = Math.hypot(dx, dy);
    if(d > portata || d < K) continue;
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
  const portata = GITTATA + liva*55*K;
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
  freccia(p.px, p.py-16*K, preda.x, preda.y - preda.z);

  if(!colpisce(d)){
    MOBS.spaventa(preda.x, preda.y, 190*K);
    UI.toast('La freccia passa alta. Sono già lontani.','bad');
    G.xp('caccia', 2);                 // si impara anche sbagliando, poco
    return;
  }

  const esito = MOBS.abbatti(preda);
  if(!esito) return;
  SND.play('pesceOk');
  MOBS.spaventa(preda.x, preda.y, 150*K);
  for(const b of esito.bottino){
    if(G.aggiungi(b.id, b.n)) UI.toast('+'+b.n+' '+IT.nome(b.id), 'good', b.id);
    else UI.toast('Zaino pieno: qualcosa è rimasto lì.','bad');
  }
  G.xp('caccia', esito.xp);
  G.stats.prede = (G.stats.prede||0) + 1;
  particelleTesto(preda.x, preda.y-30*K, 'Presa!', '#e8c07a');
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
  if(c.id==='silo') G.applicaPersona();   // il silo è uno degli addendi, non una somma a parte
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
  const cx = G.p.px, cy = G.p.py-20*K;
  for(let k=0;k<70;k++){
    const a=Math.random()*6.283, v=0.6+Math.random()*2.4;
    G.particelle.push({t:'stella', x:cx, y:cy,
      vx:(Math.cos(a)*v)*K, vy:(Math.sin(a)*v-0.4)*K, g:0.004*K,
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
  particelleTesto(G.p.px, G.p.py-42*K, '+'+e, '#b6e06a');
  for(let k=0;k<6;k++) G.particelle.push({t:'stella',
    x:G.p.px+(Math.random()-0.5)*20*K, y:G.p.py-24*K,
    vx:((Math.random()-0.5)*0.5)*K, vy:(-0.5)*K, g:0.005*K, vita:700, vitaMax:700, c:'#b6e06a'});
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
  /* Il riordino si spegne cambiando stanza: è il momento in cui non
     serve più, ed è l'unico in cui uno si dimenticherebbe di spegnerlo
     e poi si ritroverebbe a raccogliere un bancone invece di parlarci. */
  if(G.riordino) G.riordina(false);
  const pos = WORLD.vicinoLibero(dest, tx, ty);
  G.mappaId = id;
  if(id==='bosco')        G.stats.visitatoBosco=true;
  else if(id==='grotta')  G.stats.visitatoGrotta=true;
  else if(id==='fioralba')G.stats.visitatoPaese=true;
  if(!G.visitati) G.visitati={};
  G.visitati[id]=true;   // per il viaggio rapido dalla mappa
  G.p.px = pos.x*T+T/2;
  G.p.py = pos.y*T+20*K;
  G.progresso();
  mouseWorld=null;
  MOBS.reset();          // la fauna di una mappa non segue nell'altra
  G.chiacchiere.length = 0;   // quello che si diceva di là non ci segue
  aggiornaCamera(true);
  musicaGiusta();
  SND.ambiente(ambienteGiusto());
  const chi = chiCeDentro(dest);
  UI.toast(chi ? dest.nome + ' — ' + chi : dest.nome);
  /* Un passo «vai a vedere» si chiude arrivandoci, comunque ci si
     arrivi: a piedi o col viaggio rapido, che passa di qui anche lui. */
  VICENDE.visita(id);
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
    UI.toast(fraseF('📬 C\'è posta per te: una lettera da {0}.', da),'gold');
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
  G.mercato = G.scegliMercato();
  /* --- bacheca: aggiorna le richieste degli abitanti --- */
  const richInfo = G.aggiornaRichieste();
  /* --- sagra di stagione: nuova a ogni cambio stagione --- */
  let nuovaSagra=false;
  if(!G.sagra || G.sagra.stagione !== stag){ G.sagra = G.creaSagra(); nuovaSagra = (G.giornoTot>0); }
  /* --- mercante ambulante: passa ogni 7 giorni --- */
  if(G.giornoTot>0 && G.giornoTot % 7 === 0){ G.mercante = { presente:true, giorno:G.giornoTot, stock:G.stockMercante() }; }
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
  G.rifaiPassanti();      // col tempo di domani cambia anche chi si vede in giro

  /* --- evento notturno casuale (applica subito l'effetto sul mondo) --- */
  const eventoNotte = G.tiraEventoNotte(cambioStagione);

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
      G.p.px=8*T+T/2; G.p.py=9*T+20*K;
      aggiornaCamera(true);

      if(svenuto){
        UI.toast(fraseF('Ti sei svegliato dolorante. Qualcuno ti ha riportato a casa (−{0} monete).', multa),'bad');
      }
      if(cambioStagione){
        UI.toast(fraseF('È arrivata la {0}.', G.stagione().nome),'gold');
      }
      if(uova) UI.toast(uova+' uovo/a dal pollaio.','good','uovo');

      // avviso di gelo
      if(G.gelo) setTimeout(()=>UI.toast('Gelata forte: fiume e pozzo sono ghiacciati per oggi.','bad'), 700);
      // evento della notte
      if(eventoNotte) setTimeout(()=>UI.toast(eventoNotte.msg, eventoNotte.tipo||undefined, eventoNotte.icona), 1000);
      // mercato del giorno
      if(G.mercato) setTimeout(()=>UI.toast(fraseF('Mercato di oggi: {0} vale ×{1} da Bruno e alla cassa.', IT.nome(G.mercato.item), G.mercato.mult),'gold', G.mercato.item), 1400);
      // bacheca delle richieste
      if(richInfo && richInfo.nuove)   setTimeout(()=>UI.toast('📋 Nuove richieste degli abitanti: guarda il Diario (J).','gold'), 1800);
      if(richInfo && richInfo.scadute) setTimeout(()=>UI.toast(richInfo.scadute+(richInfo.scadute===1?' richiesta è scaduta.':' richieste sono scadute.'),'bad'), 2100);
      // sagra e mercante
      if(nuovaSagra) setTimeout(()=>UI.toast(fraseF('🎪 È tempo della {0}: consegna i prodotti di stagione dal Diario!', G.sagra.nome),'gold'), 2400);
      if(G.mercante && G.mercante.presente) setTimeout(()=>UI.toast('🛒 Il mercante ambulante è in paese, oggi alla Locanda.','gold'), 2700);
      // la posta arriva col mattino, una lettera per volta
      consegnaPosta(3300);
      // compleanni: una casella del calendario che prima era vuota
      const festeggiato = G.festeggiatoOggi();
      if(festeggiato) setTimeout(()=>UI.toast(fraseF('🎂 Oggi è il compleanno di {0}. Un regalo, oggi, vale il triplo.',
        DATA.NPCS[festeggiato].nome),'gold'), 3000);
      // il giorno della festa il paese si raduna in piazza
      G.aggiornaOspitiSagra();
      // e la sera della veglia si raduna alla radura
      SOLSTIZIO.aggiornaOspitiVeglia();
      if(G.eGiornoDiSagra()) setTimeout(()=>UI.toast(fraseF('🎪 Oggi è il giorno della {0}: il paese è tutto in piazza a Fioralba.',
        G.sagra.nome),'gold'), 3300);

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
   MERCATO DINAMICO, EVENTI NOTTURNI, RICHIESTE, SAGRE e MERCANTE —
   stanno in paese.js, che è il calendario del paese: c'è chi scatta
   ogni giorno, chi ogni notte, chi ogni sette giorni, chi a stagione.
   Qui resta il riaggancio: le funzioni tornano su G, che è dove le
   cercano le finestre di ui.js e l'agenda di abitanti.js.
   =================================================================== */
Object.assign(G, PAESE);
/* ===================================================================
   LUCI
   =================================================================== */
/* Che disegno vuole questo edificio. Per quasi tutti è il loro livello;
   per il Santuario è `G.braci`, cioè a che punto sta l'atto secondo. La
   regola stava scritta due volte in render.js e una qui, e tre copie di
   una regola sono tre occasioni di scordarsene una. */
G.livelloEdificio = function(e){
  return e.kind==='santuario' ? (G.braci||0) : (e.liv||0);
};

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
    if(o.t==='lampione') out.push({x:x*T+T/2, y:y*T+2*K, r:96*K, i:0.85, caldo:true, f:x*0.7});
    else if(o.t==='lume')   out.push({x:x*T+T/2, y:y*T+12*K, r:82*K, i:0.72, caldo:true, f:x*1.3});
    else if(o.t==='camino') out.push({x:x*T+T/2, y:y*T+22*K, r:120*K, i:0.9, caldo:true, f:y*0.6});
    else if(o.t==='mobile' && o.kind==='lanterna') out.push({x:x*T+T/2, y:y*T+8*K, r:88*K, i:0.8, caldo:true, f:x});
    /* Il lume posato fa la stessa luce di quelli scritti nelle stanze —
       stesso raggio, stessa intensità — se no lo stesso oggetto
       illuminerebbe in due modi a seconda di chi ce l'ha messo. */
    else if(o.t==='mobile' && o.kind==='lume') out.push({x:x*T+T/2, y:y*T+12*K, r:82*K, i:0.72, caldo:true, f:x*1.3});
    else if(o.t==='macchina' && (o.kind==='forno'||o.kind==='fornace') && o.dentro)
      out.push({x:x*T+T/2, y:y*T+18*K, r:64*K, i:0.7, caldo:true, f:y});
  }
  // funghi luminosi
  for(const d of m.deco){
    if(d.t==='fungo_luce' && d.x>=x0-2 && d.x<=x1+2 && d.y>=y0-2 && d.y<=y1+2)
      out.push({x:d.x*T+T/2, y:d.y*T+18*K, r:52*K, i:0.55, caldo:false, f:d.v});
  }
  /* LE FINESTRE DEGLI EDIFICI.

     Qui non si dipinge niente: si dice al gioco DOVE c'è una luce, e la
     luce buca il velo del buio (`destination-out`, poco sopra in
     render.js) e prende il bloom. È l'unico modo perché una finestra
     accesa si veda davvero: il primo tentativo dipingeva l'alone sopra
     allo sprite, e il velo del buio ci passava sopra un attimo dopo e
     lo spegneva — misurato, il vetro veniva un marroncino spento invece
     che ambra.

     Se l'edificio è disegnato a mano si accende una luce PER FINESTRA,
     perché di quel disegno sappiamo dove sono i vetri. Chi non ce l'ha
     tiene la luce sola in mezzo alla facciata, che è quello che c'era. */
  for(const e of m.edifici){
    /* Una casa chiusa ha la luce accesa o spenta e resta così per tutta
       la sera. Prima decideva `Math.random()`, che qui gira a ogni
       fotogramma: sessanta monetine al secondo, cioè uno sfarfallio. */
    if(e.azione==='chiuso' && ART.hsh(e.x, e.y + (G.giorno||0), 771) > 0.5) continue;
    const liv = G.livelloEdificio(e);
    const neve = G.stagione().id === 'inverno';
    const E = ART.edificio(e.kind, liv, neve) ? ART.datoEdificio(e.kind, liv, neve) : null;
    if(E && (E.finestre || E.fuoco || E.nicchie || E.lanterna)){
      const bx = e.x*T, by = (e.y+e.h)*T - E.h;
      const luce = (f, r, i) => out.push({ x: bx + (f[0]+f[2]/2)*E.w, y: by + (f[1]+f[3]/2)*E.h,
                                           r: r*K, i, caldo:true, f: e.x + f[0]*10 });
      const punto = (p2, r, i) => out.push({ x: bx + p2[0]*E.w, y: by + p2[1]*E.h,
                                             r: r*K, i, caldo:true, f: p2[0]*10 });
      if(E.finestre) for(const f of E.finestre) luce(f, 70, 0.85);
      /* La forgia è accesa e basta: è disegnata così, e di sera è la sola
         luce di quel lato della piazza. */
      if(E.fuoco) luce(E.fuoco, 104, 0.8);
      /* Le braci e la lanterna del Santuario. Il colore lo mette
         `render.js`, che sa quale brace è quale; qui si dice solo che lì
         c'è luce, e senza questa riga il velo del buio la spegnerebbe —
         cioè la sera in cui si accende la quarta brace non si vedrebbe
         niente, che è il momento più importante dell'atto secondo. */
      if(E.nicchie) for(let i=0; i<E.nicchie.length && i<(G.braci||0); i++)
        punto(E.nicchie[i], 42, 0.7);
      if(E.lanterna && (G.braci||0) > 0)
        punto(E.lanterna, 52 + G.braci*14, 0.5 + G.braci*0.1);
      continue;
    }
    out.push({x:(e.x+e.w/2)*T, y:(e.y+e.h-1)*T, r:110*K, i:0.6, caldo:true, f:e.x});
  }
  // santuario
  if(m.id==='bosco' && G.braci>0){
    const s=m.edifici.find(e=>e.kind==='santuario');
    if(s) out.push({x:(s.x+s.w/2)*T, y:(s.y+s.h-1)*T, r:(60+G.braci*34)*K, i:0.5+G.braci*0.12, caldo:true, f:0});
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
        x:G.cam.x-20*K+Math.random()*(VW+40*K), y:G.cam.y-20*K,
        vx:(0.3+Math.random()*0.7)*K, vy:(0.25+Math.random()*0.35)*K, g:0,
        r:Math.random()*6.3, vr:(Math.random()-0.5)*0.09,
        vita:9000, vitaMax:9000, c:['#d9713c','#c47a2c','#b8562c','#e0a03c'][(Math.random()*4)|0], alpha:0.9});
    }
    if(st==='primavera' && Math.random()<0.07*f){
      G.particelle.push({t:'petalo',
        x:G.cam.x-20*K+Math.random()*(VW+40*K), y:G.cam.y-20*K,
        vx:(0.25+Math.random()*0.5)*K, vy:(0.2+Math.random()*0.3)*K, g:0,
        r:Math.random()*6.3, vr:(Math.random()-0.5)*0.07,
        vita:9000, vitaMax:9000, c:['#f5a6c0','#f8c8d8','#fff0f4'][(Math.random()*3)|0], alpha:0.85});
    }
    const notte = G.ora>1090 || G.ora<380;
    if(notte && (st==='estate'||st==='primavera'||m.id==='bosco') && Math.random()<0.05*f){
      G.particelle.push({t:'lucciola',
        x:G.cam.x+Math.random()*VW, y:G.cam.y+40*K+Math.random()*(VH-60*K),
        vx:((Math.random()-0.5)*0.22)*K, vy:((Math.random()-0.5)*0.16)*K, g:0,
        f:Math.random()*6.3, vita:7000, vitaMax:7000});
    }
  }
}

function particelleTesto(x,y,testo,col){
  // anche il testo che vola sopra la testa passa dalla lingua
  if(window.LINGUA) testo = LINGUA.t(testo);
  G.particelle.push({t:'testo', x, y, vx:0, vy:(-0.42)*K, g:0, testo, c:col||'#fff8d0',
                     vita:1100, vitaMax:1100});
}
G.particelleTesto = particelleTesto;   // pesca.js: il nome del pesce che sale dalla testa

function schegge(tx,ty,col){
  for(let k=0;k<7;k++) G.particelle.push({t:'schegge',
    x:tx*T+T/2+(Math.random()-0.5)*18*K, y:ty*T+T/2+(Math.random()-0.5)*14*K,
    vx:((Math.random()-0.5)*1.5)*K, vy:(-0.7-Math.random()*0.7)*K, g:0.05*K,
    vita:420, vitaMax:420, s:2, c:col});
}

function schizzo(tx,ty){
  G.particelle.push({t:'splash', x:tx*T+T/2, y:ty*T+T/2, vx:0,vy:0,g:0, vita:700, vitaMax:700});
  for(let k=0;k<6;k++) G.particelle.push({t:'goccia',
    x:tx*T+T/2, y:ty*T+T/2, vx:((Math.random()-0.5)*1.4)*K, vy:(-0.8-Math.random()*0.6)*K, g:0.06*K,
    vita:500, vitaMax:500});
}
G.schizzo = schizzo;   // pesca.js: l'acqua che si apre quando cade la lenza

/* ===================================================================
   TRAGUARDI, COLLEZIONE DEL NATURALISTA, STATISTICHE — stanno in
   traguardi.js. Quel file si carica prima di game.js, quindi non può
   appendersi da sé a G: lo fa questa riga, ed è tutto il prezzo dello
   stacco. Le nove funzioni restano dove le cercano UI.diario e il
   pannello di prova, cioè su G.
   =================================================================== */
Object.assign(G, TRAGUARDI);

/* ===================================================================
   SALVATAGGIO — sta in salvataggio.js, e finisce sul server.
   Qui resta solo l'aggancio: l'autosave e il menu chiamano G.salva, e
   quel file si carica prima che G esista, quindi non può appendercelo
   da sé.

   Erano quattro: `esporta`, `importaTesto` e `importaDaFile` se ne sono
   andati col file .json. Il giro «esporta un file, portalo sull'altro
   computer, importalo» era il modo di spostare una partita quando la
   partita stava nel browser; adesso sta sul server e ci si sposta col
   codice, che sono dodici caratteri invece di centoquaranta chilobyte.
   =================================================================== */
G.salva = SALVA.salva;
/* Il selettore delle partite sta in ui.js e deve poter far cominciare
   quella scelta: è il prezzo, nominato, di avere le finestre di là e
   l'avvio di qua. */
G.avvia = avviaGioco;


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
      if(k==='escape'||k==='i'||k==='c'||k==='j'||k==='m') UI.chiudiModal(true);
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

  /* Il tocco sta tutto in tocco.js. Qui c'erano tre gestori sul canvas
     che scrivevano dentro `tasti[]` per camminare e chiamavano
     `usaOggetto()` al tocco breve: erano il seme giusto ma con due
     buchi che rendevano il gioco non finibile da telefono — non
     chiamavano MAI `interagisci()`, quindi porte, casse, macchinari e
     abitanti non esistevano; e sui dialoghi non potevano niente.

     Sono stati tolti e non affiancati: due padroni dello stesso vettore
     di direzioni si pestano i piedi. Uno alza `tasti['a']` a mano,
     l'altro emette il `keyup` di 'a', e chi cammina dipende da chi
     arriva ultimo. Adesso il pad emette tasti veri e passa da questo
     stesso gestore di `keydown`, con tutta la sua sensibilità al
     contesto in regalo. */
  if(window.TOCCO) TOCCO.init();
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
window.addEventListener('load', ()=>{
  init().catch(e=>{
    /* A questo punto anche il fallback Canvas non è disponibile: teniamo
       l'errore esplicito e distinto dagli errori recuperabili dei sistemi. */
    console.error('[motore] avvio non riuscito', e);
  });
});

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
