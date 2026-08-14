/* ===================================================================
   FIORALBA — abitanti.js
   Dove sta un abitante a quest'ora, cosa dice oggi, e la gente che
   passa per la piazza parlandosi addosso.

   Era in game.js, in tre sezioni staccate fra loro — AGENDE, COSA DICE
   OGGI, PASSANTI E CHIACCHIERE — che però erano già un modulo senza
   saperlo: 443 righe che di game.js non usavano NESSUNA funzione
   privata, e di cui a game.js servivano solo quattro nomi, i tre
   sistemi che il ciclo principale chiama a ogni fotogramma e il
   `parlaCon` di quando si preme E addosso a qualcuno.

   Le sette funzioni che stavano su `G` ci tornano: è lì che le cerca il
   resto del gioco — render.js disegna i passanti e chiede chi è vivo,
   solstizio.js la fascia dell'agenda, il pannello di prova fa
   chiacchierare — e cambiarle di posto avrebbe voluto dire rincorrerle
   in quattro file. Le rimette game.js con un `Object.assign`, perché
   questo file si carica prima e al caricamento `G` non esiste ancora.
   Per la stessa ragione `G.passanti` e `G.chiacchiere` nascono di là:
   sono stato, non funzioni, e lo stato vuole G già fatto.

   `FASCE_SAGRA` e `FASCE_VEGLIA` viaggiano con le agende e non con le
   sagre né con l'atto secondo: sono due memo di `fasciaAgenda`, e
   quando l'atto secondo se ne andò in solstizio.js `FASCE_VEGLIA` per
   poco non lo seguì lasciandolo senza.
   =================================================================== */
(function(){

/* `AB` e non `A`: dentro `fasciaAgenda` c'è già un `const A =
   DATA.AGENDE[id]`, e due `A` nello stesso file sono un errore che
   aspetta il giorno in cui qualcuno usa l'alias del modulo dentro a
   quella funzione — e allora legge l'agenda di un abitante credendo di
   avere il modulo in mano. */
const AB = {};
window.ABITANTI = AB;

/* Le due comodità che ogni modulo si ridichiara — la casella è 32 px e
   basta, e `$` è quello che è. Le hanno uguali render.js, mobs.js e
   pesca.js: dividerle vorrebbe dire un modulo in più per due righe. */
const T = 64;
/* Quante volte il mondo è più fitto della casella da 32: sta davanti
   alla velocità di chi cammina, alle distanze di arrivo e ai raggi
   entro cui uno si accorge di te. Gli scostamenti dal centro casella
   (+16, +24) sono diventati T/2 e 24*K per la stessa ragione. */
const K = 2;
const $ = s=>document.querySelector(s);

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

AB.fasciaAgenda = function(id){
  /* La sera della veglia l'agenda si mette da parte: dal tramonto in poi
     quei sei stanno alla radura, e basta. */
  const postiVeglia = DATA.POSTI_VEGLIA;    // era un alias in cima all'atto secondo
  if(G.eSeraDiVeglia() && postiVeglia[id] && G.ora>=1020){
    if(!FASCE_VEGLIA[id]) FASCE_VEGLIA[id] = { fino:1440, giro:postiVeglia[id], coperto:true, veglia:true };
    return FASCE_VEGLIA[id];
  }
  if(G.eGiornoDiSagra() && DATA.POSTI_SAGRA[id] && G.ora>=540 && G.ora<1320){
    if(!FASCE_SAGRA[id]) FASCE_SAGRA[id] = { fino:1320, giro:DATA.POSTI_SAGRA[id], coperto:true, sagra:true };
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
AB.npcAlChiuso = function(id){
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
                   px:x*T+T/2, py:y*T+24*K, dir:0, frame:0, animT:0,
                   wait:Math.random()*2000 });
    } else if(!ciSta && i>=0){
      m.npc.splice(i,1);
    }
  }
}

AB.npcVivi = function(){
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
AB.compleannoOggi = function(id){
  const c = DATA.COMPLEANNI[id];
  return !!(c && c.stagione===G.stagione().id && c.giorno===G.giorno);
};
AB.festeggiatoOggi = function(){
  for(const id in DATA.COMPLEANNI) if(G.compleannoOggi(id)) return id;
  return null;
};

function aggiornaNPC(dt){
  const m=G.mappa();
  sincronizzaInterni(m);
  for(const n of (m.npc||[])){
    if(n.px===undefined){ n.px = n.x*T+T/2; n.py = n.y*T+24*K; n.dir=0; n.frame=0; n.animT=0; n.wait=Math.random()*3000; }

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
      n.px = posto[0]*T+T/2; n.py = posto[1]*T+24*K;
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
      n.dest = {x:g[0]*T+T/2, y:g[1]*T+24*K};
    }
    const dx=n.dest.x-n.px, dy=n.dest.y-n.py;
    const d=Math.hypot(dx,dy);
    if(d<3*K){ n.dest=null; n.wait=2200+Math.random()*5200; n.frame=0; continue; }
    const spd = 0.5*K*dt/16;
    const nx = n.px+dx/d*spd, ny=n.py+dy/d*spd;
    if(!WORLD.solido(m,(nx/T)|0,(ny/T)|0)){ n.px=nx; n.py=ny; }
    else { n.dest=null; n.wait=800; }
    if(Math.abs(dx)>Math.abs(dy)) n.dir = dx<0?1:2; else n.dir = dy<0?3:0;
    n.animT += dt;
    if(n.animT>170){ n.animT=0; n.frame=(n.frame+1)%4; }
    // emote se non gli hai ancora parlato oggi
    n.emote = (!G.parlatoOggi[n.id] && Math.hypot(n.px-G.p.px,n.py-G.p.py)<160*K) ? '!' : null;
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
  /* Le vicende del paese stanno subito sotto l'atto secondo e sopra il
     resto: sono la cosa che si sta portando avanti, e se finiscono in
     fondo all'elenco — sotto «Vorrei comprare qualcosa» e «Insegnami una
     ricetta» — diventano una voce di menu invece che una storia. */
  for(const s of VICENDE.scelte(n.id)) scelte.push(s);
  /* Quello che si migliora addosso lo vende chi ti ha appena raccontato
     la sua storia: la voce compare qui sotto, dopo la vicenda e prima
     del negozio, perché è la cosa nuova e va vista. */
  for(const s of PERSONA.scelte(n.id)) scelte.push(s);
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
   PASSANTI E CHIACCHIERE

   Il paese aveva quattro persone, ognuna ferma al suo mestiere, e in
   piazza non c'era nessuno. Chi ci passava trovava case, insegne e
   silenzio: sembrava un fondale, non un posto dove vive della gente.

   Due pezzi. I PASSANTI sono sei figure che gironzolano e non fanno
   altro: niente amicizia, niente regali, niente agenda. Premendo E non
   succede niente, ed è voluto — se ci si potesse parlare diventerebbero
   sei abitanti scritti male invece di sei persone di passaggio.

   Le CHIACCHIERE sono quello che si sente dire mentre si cammina, in
   una nuvoletta sopra la testa. Le dicono anche i sei abitanti veri, e
   lì il testo non è nuovo: è `DATA.CONTESTO`, che già cambia con la
   stagione, il tempo e l'ora, e che finora si leggeva solo fermandosi a
   parlare con qualcuno. Adesso il paese lo dice da sé.

   Le regole che tengono la cosa dalla parte del piacevole:
   — parla uno per volta, e non riparte prima di sei secondi;
   — solo chi ti è abbastanza vicino da essere sentito;
   — chi ha appena parlato tace per un pezzo, così non è sempre lui;
   — mai durante un dialogo, una finestra aperta, la pesca o la notte.
     Un fumetto sopra un menù è rumore.
   =================================================================== */
const CHIACCHIERA_DURATA = 4200;    // quanto resta a schermo
const CHIACCHIERA_PAUSA  = 6000;    // fra una e l'altra, in tutto il paese
const CHIACCHIERA_RIPOSO = 42000;   // prima che la stessa persona riparli
const CHIACCHIERA_RAGGIO = 190*K;   // entro cui si sente, in pixel di mondo

let chiacchieraT = 0;

/* Chi c'è oggi: la lavandaia esce col sereno, il bambino non gira di
   notte. La condizione sta nei dati, così aggiungerne uno non tocca
   questo codice. */
function passantiDiOggi(){
  return DATA.PASSANTI.filter(p => !p.quando || p.quando(G));
}

/* Si rifanno a ogni cambio di mappa e a ogni nuovo giorno: sono
   comparse, non hanno bisogno di ricordarsi dov'erano, e non finiscono
   nel salvataggio. */
AB.rifaiPassanti = function(){
  G.passanti = passantiDiOggi().map(p => ({
    id:p.id, mappa:p.dove, look:p.look, giro:p.giro, dice:p.dice,
    px:p.giro[0][0]*T+T/2, py:p.giro[0][1]*T+20*K,
    dir:1, frame:0, animT:0, wait:Math.random()*2500, dest:null, tacePer:0
  }));
};

function aggiornaPassanti(dt){
  for(const p of G.passanti){
    if(p.mappa !== G.mappaId) continue;
    if(p.tacePer > 0) p.tacePer -= dt;
    p.wait -= dt;
    if(p.wait > 0) continue;
    if(!p.dest){
      const m = G.maps[p.mappa];
      const meta = p.giro[(Math.random()*p.giro.length)|0];
      if(WORLD.dentro(m, meta[0], meta[1]) && !WORLD.solido(m, meta[0], meta[1]))
        p.dest = { x:meta[0]*T+T/2, y:meta[1]*T+20*K };
      else { p.wait = 1200; continue; }
    }
    const dx = p.dest.x-p.px, dy = p.dest.y-p.py, d = Math.hypot(dx,dy);
    if(d < 3*K){ p.dest = null; p.wait = 1800+Math.random()*4200; p.frame = 0; continue; }
    const v = 0.28*K*dt/16;
    p.px += dx/d*v; p.py += dy/d*v;
    p.dir = Math.abs(dx) > Math.abs(dy) ? (dx<0?1:2) : (dy<0?3:0);
    p.animT += dt;
    p.frame = ((p.animT/170)|0) % 4;
  }
}

/* Chi può parlare adesso: dev'essere sulla tua mappa, abbastanza vicino
   per essere sentito, e non aver parlato da poco. */
function chiPuoParlare(){
  const gente = [];
  const vicino = (x,y)=> Math.hypot(x-G.p.px, y-G.p.py) < CHIACCHIERA_RAGGIO;

  for(const p of G.passanti){
    if(p.mappa!==G.mappaId || p.tacePer>0 || !vicino(p.px,p.py)) continue;
    gente.push({ chi:p, x:p.px, y:p.py, righe:p.dice });
  }
  for(const n of G.npcVivi()){
    if(n.tacePer>0 || !vicino(n.px,n.py)) continue;
    const righe = battuteAmbiente(n.id);
    if(righe && righe.length) gente.push({ chi:n, x:n.px, y:n.py, righe });
  }
  return gente;
}

/* Quello che un abitante direbbe adesso, preso da dove sta già scritto:
   il contesto della stagione, del tempo e dell'ora. Le battute generiche
   restano per il dialogo vero — quelle sono la conversazione, queste
   sono quello che ti sfugge passando. */
function battuteAmbiente(id){
  const C = DATA.CONTESTO && DATA.CONTESTO[id];
  if(!C) return null;
  const fuori = [];
  const st = G.stagione().id;
  if(C.stagione && C.stagione[st]) fuori.push(...C.stagione[st]);
  if(C.meteo && C.meteo[G.meteo]) fuori.push(...C.meteo[G.meteo]);
  if(C.ora){
    if(G.ora < 600 && C.ora.mattina) fuori.push(...C.ora.mattina);
    if(G.ora > 1080 && C.ora.sera)   fuori.push(...C.ora.sera);
  }
  return fuori;
}

/* Fa parlare qualcuno adesso, saltando la pausa e il riposo. Esiste per
   il pannello di prova: aspettare che il caso scelga proprio quello che
   vuoi sentire è il modo peggiore di verificare una nuvoletta. Ritorna
   chi ha parlato, o null se non c'era nessuno abbastanza vicino. */
AB.chiacchiera = function(forzato){
  const gente = chiPuoParlare();
  if(!gente.length) return null;
  const s = forzato ? (gente.find(g=>g.chi.id===forzato) || gente[0])
                    : gente[(Math.random()*gente.length)|0];
  const testo = s.righe[(Math.random()*s.righe.length)|0];
  s.chi.tacePer = CHIACCHIERA_RIPOSO;
  chiacchieraT = CHIACCHIERA_PAUSA;
  G.chiacchiere.push({
    chi:s.chi, mappa:G.mappaId, x:s.x, y:s.y,
    /* niente LINGUA.t qui: le battute arrivano da DATA, e DATA è già
       nella lingua giusta — la traduce il motore sul posto al cambio di
       lingua. Tradurre due volte non rompeva niente, ma sporcava l'elenco
       delle frasi mancanti con stringhe già inglesi. */
    testo,
    vita:CHIACCHIERA_DURATA, opacita:1
  });
  return { chi:s.chi.id, testo };
};

function aggiornaChiacchiere(dt){
  // le nuvolette a schermo invecchiano comunque
  for(let i=G.chiacchiere.length-1; i>=0; i--){
    const c = G.chiacchiere[i];
    c.vita -= dt;
    if(c.vita <= 0){ G.chiacchiere.splice(i,1); continue; }
    // seguono chi le ha dette, e sfumano in coda
    if(c.chi){ c.x = c.chi.px; c.y = c.chi.py; }
    c.opacita = Math.min(1, c.vita/600);
  }

  /* Niente fumetti quando l'attenzione è altrove: sopra un menù o una
     lettera sarebbero rumore, e di notte il paese dorme. */
  if(UI.modalAperta() || UI.dialogoAttivo() || PESCA.inCorso() || G.p.dorme) return;
  if(!$('#letter').classList.contains('hidden')) return;
  if(G.ora < 360 || G.ora > 1320) return;

  chiacchieraT -= dt;
  if(chiacchieraT > 0 || G.chiacchiere.length) return;

  const gente = chiPuoParlare();
  if(!gente.length){ chiacchieraT = 1500; return; }

  const scelto = gente[(Math.random()*gente.length)|0];
  const testo = scelto.righe[(Math.random()*scelto.righe.length)|0];
  scelto.chi.tacePer = CHIACCHIERA_RIPOSO;
  chiacchieraT = CHIACCHIERA_PAUSA;
  G.chiacchiere.push({
    chi:scelto.chi, mappa:G.mappaId, x:scelto.x, y:scelto.y,
    /* niente LINGUA.t qui: le battute arrivano da DATA, e DATA è già
       nella lingua giusta — la traduce il motore sul posto al cambio di
       lingua. Tradurre due volte non rompeva niente, ma sporcava l'elenco
       delle frasi mancanti con stringhe già inglesi. */
    testo,
    vita:CHIACCHIERA_DURATA, opacita:1
  });
}


/* I quattro agganci col ciclo principale di game.js: i tre sistemi che
   girano a ogni fotogramma e il «parla con chi mi sta davanti». Dentro
   a questo file si chiamano per nome fra loro, quindi restano funzioni
   dichiarate; qui escono, e game.js le trova su G come le altre. */
AB.aggiornaNPC = aggiornaNPC;
AB.parlaCon = parlaCon;
AB.aggiornaPassanti = aggiornaPassanti;
AB.aggiornaChiacchiere = aggiornaChiacchiere;

})();
