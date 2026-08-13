/* ===================================================================
   FIORALBA — debug.js
   Il pannello che serve a provare il gioco senza giocarlo per tre ore:
   monete, oggetti, tempo, luoghi, e soprattutto i pezzi di storia che
   altrimenti si raggiungono solo dopo quattro stagioni di partita vera.

   Non compare a chi gioca. Si accende da solo su localhost e da file://,
   e altrove solo con `?debug` nell'indirizzo — sul sito pubblicato,
   quindi, esiste ma bisogna chiederlo. È la ragione per cui sta in un
   file suo: un pannello che regala diecimila monete non deve poter
   finire aperto per sbaglio davanti a chi il gioco lo sta scoprendo.

   Tutto quello che fa passa dalle stesse funzioni che usa il gioco —
   `G.aggiungi`, `G.teletrasporta`, `G.dormi`, `G.aggiornaOspitiVeglia` —
   e mai da scorciatoie sue. Un pannello che si scrivesse lo stato a mano
   proverebbe sé stesso invece del gioco: metterebbe `G.braci = 4` senza
   accendere le nicchie, e la partita risulterebbe in uno stato che
   giocando non capita mai.
   =================================================================== */
(function(){

const $ = s=>document.querySelector(s);

const D = {};
window.DEBUG = D;

/* --------------------------------------------------------------- */
/* quando accendersi                                               */
/* --------------------------------------------------------------- */
/* Per adesso: sempre. È una scelta esplicita e provvisoria del proprietario
   del repo — il pannello serve anche sul sito pubblicato, finché il gioco è
   in lavorazione. Quando sarà il momento di nasconderlo a chi gioca basta
   rimettere il corpo qui sotto, che è già scritto e provato:

     const h = location.hostname;
     if(h==='localhost' || h==='127.0.0.1' || h==='' || location.protocol==='file:') return true;
     return /(\?|&)debug\b/.test(location.search);

   così tornerebbe ad accendersi da solo in locale e altrove solo con
   `?debug` nell'indirizzo. */
function richiesto(){
  return true;
}

/* --------------------------------------------------------------- */
/* attrezzi del pannello                                           */
/* --------------------------------------------------------------- */
let corpo = null, scatola = null, riga = null;

function el(tag, cls, testo){
  const e = document.createElement(tag);
  if(cls) e.className = cls;
  if(testo != null) e.textContent = testo;
  return e;
}

/* Ogni comando dice cosa ha combinato invece di lasciare indovinare:
   «+10 rapa» o «zaino pieno: ne sono entrate 3 su 10». Senza, un bottone
   che non fa niente perché lo zaino è pieno sembra un bottone rotto. */
function nota(testo, buona){
  if(!riga) return;
  riga.textContent = testo;
  riga.className = 'dbg-nota' + (buona === false ? ' male' : '');
  clearTimeout(nota._t);
  nota._t = setTimeout(()=>{ if(riga) riga.textContent = ''; }, 4000);
}

function sezione(titolo){
  const s = el('div','dbg-sez');
  s.appendChild(el('div','dbg-tit',titolo));
  const g = el('div','dbg-griglia');
  s.appendChild(g);
  corpo.appendChild(s);
  return g;
}

function bottone(dove, testo, fn, cls){
  const b = el('button','dbg-b'+(cls?' '+cls:''),testo);
  b.onclick = ()=>{
    if(!G.inGioco){ nota('Prima entra in partita.', false); return; }
    try{ fn(); }catch(e){ nota('è esploso: '+e.message, false); console.error(e); }
    rinfresca();
  };
  dove.appendChild(b);
  return b;
}

/* dopo ogni comando: HUD, barra degli attrezzi e riquadro di stato */
function rinfresca(){
  if(G.inGioco){
    G.aggiornaHUD();
    G.rinfrescaHotbar();
  }
  scriviStato();
}

/* --------------------------------------------------------------- */
/* il riquadro di stato                                            */
/* --------------------------------------------------------------- */
let statoEl = null;
function scriviStato(){
  if(!statoEl) return;
  if(!G.inGioco){ statoEl.textContent = 'fuori partita'; return; }
  const v = G.trame.veglia;
  const c = G.contaCollezione().tot;
  const ora = Math.floor(G.ora/60) + ':' + String(G.ora%60).padStart(2,'0');
  statoEl.innerHTML = [
    G.stagione().nome + ' ' + G.giorno + ', anno ' + G.anno + ' — ' + ora + ' — ' + G.meteo,
    'luogo: ' + G.mappaId + ' · monete: ' + G.oro.toLocaleString('it-IT') +
      ' · energia: ' + Math.round(G.energia) + '/' + G.energiaMax,
    'braci: ' + G.braci + '/4 · collezione: ' + c.d + '/' + c.t +
      ' · zaino: ' + G.inv.filter(Boolean).length + '/' + G.inv.length,
    'atto secondo: ' + (!v.avviata ? 'non avviato'
      : v.fatta ? 'concluso'
      : v.giorno ? 'veglia fissata (giorno ' + v.giorno + ', oggi ' + G.giornoTot + ')'
      : v.verita ? 'verità saputa, invitati ' + G.invitatiAllaVeglia() + '/' + DATA.MEMORIE.length
      : 'memorie ' + G.memorieAvute() + '/' + DATA.MEMORIE.length)
  ].join('<br>');
}

/* --------------------------------------------------------------- */
/* MONETE, ENERGIA                                                 */
/* --------------------------------------------------------------- */
function costruisciRicchezza(){
  const g = sezione('Monete ed energia');
  /* i puntini a mano: toLocaleString('it-IT') lascia «1000» senza separatore
     e mette «10.000» con, e i tre bottoni in fila risultavano scritti in due
     modi diversi */
  const conPunti = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  for(const n of [1000, 10000, 100000])
    bottone(g, '+' + conPunti(n), ()=>{
      G.oro += n; G.progresso();
      nota('monete: ' + conPunti(G.oro));
    });
  bottone(g, 'Azzera monete', ()=>{ G.oro = 0; nota('monete: 0'); });
  bottone(g, 'Energia piena', ()=>{
    G.energia = G.energiaMax;
    nota('energia: ' + G.energiaMax);
  });

  /* Energia infinita a forza di riempirla, e non spegnendo `spendi`:
     il costo dei colpi è sparso fra game.js e pesca.js, e ogni volta che
     nasce un attrezzo nuovo un elenco di funzioni da zittire resterebbe
     indietro. Rimettere il pieno venti volte al secondo non può restare
     indietro di niente. */
  let pieno = null;
  const b = bottone(g, 'Energia infinita: no', ()=>{
    if(pieno){ clearInterval(pieno); pieno = null; b.textContent = 'Energia infinita: no'; b.classList.remove('acceso'); nota('energia normale'); return; }
    pieno = setInterval(()=>{ if(G.inGioco) G.energia = G.energiaMax; }, 50);
    b.textContent = 'Energia infinita: sì';
    b.classList.add('acceso');
    nota('energia infinita accesa');
  });
}

/* --------------------------------------------------------------- */
/* OGGETTI                                                         */
/* --------------------------------------------------------------- */
function aggiungiTanti(id, n){
  let messi = 0;
  for(let i=0;i<n;i++){ if(!G.aggiungi(id,1)) break; messi++; }
  const nome = IT.nome(id);
  if(messi === n) nota('+' + n + ' ' + nome);
  else nota('zaino pieno: ' + nome + ' ×' + messi + ' su ' + n, false);
  return messi;
}

function costruisciOggetti(){
  const s = el('div','dbg-sez');
  s.appendChild(el('div','dbg-tit','Oggetti'));

  const cerca = el('input','dbg-cerca');
  cerca.type = 'text';
  cerca.placeholder = 'cerca fra ' + Object.keys(DATA.ITEMS).length + ' oggetti…';
  /* Il gioco ascolta la tastiera su `window` e non guarda da dove arriva
     il tasto: senza fermare qui l'evento, scrivere «rapa» in questa
     casella farebbe camminare il giocatore, aprirebbe lo zaino sulla «a»
     e darebbe una zappata sulla barra spaziatrice. */
  for(const ev of ['keydown','keyup','keypress'])
    cerca.addEventListener(ev, e=>e.stopPropagation());
  s.appendChild(cerca);

  const elenco = el('div','dbg-elenco');
  s.appendChild(elenco);

  function mostra(){
    const q = cerca.value.trim().toLowerCase();
    elenco.textContent = '';
    const ids = Object.keys(DATA.ITEMS).filter(id =>
      !q || id.includes(q) || (DATA.ITEMS[id].nome||'').toLowerCase().includes(q));
    if(!ids.length){ elenco.appendChild(el('div','dbg-vuoto','niente che somigli a «'+q+'»')); return; }
    for(const id of ids.slice(0, 60)){
      const r = el('div','dbg-voce');
      r.appendChild(el('span','dbg-nome', DATA.ITEMS[id].nome + '  ') );
      r.querySelector('.dbg-nome').title = id + ' · ' + (DATA.ITEMS[id].cat||'');
      for(const n of [1,10,99]){
        const b = el('button','dbg-mini','×'+n);
        b.onclick = ()=>{
          if(!G.inGioco){ nota('Prima entra in partita.', false); return; }
          aggiungiTanti(id, n); rinfresca();
        };
        r.appendChild(b);
      }
      elenco.appendChild(r);
    }
    if(ids.length > 60) elenco.appendChild(el('div','dbg-vuoto','…e altri '+(ids.length-60)+': affina la ricerca'));
  }
  cerca.oninput = mostra;
  mostra();

  const g = el('div','dbg-griglia');
  s.appendChild(g);
  corpo.appendChild(s);

  bottone(g, 'Attrezzi al massimo', ()=>{
    for(const k in DATA.UPGRADE){
      if(!G.conta(k)) G.aggiungi(k,1);
      G.attrezziLiv[k] = DATA.UPGRADE[k].length;
    }
    nota('attrezzi al livello ' + Object.values(G.attrezziLiv)[0]);
  });
  bottone(g, 'Tutte le ricette', ()=>{
    for(const r of DATA.CUCINA) G.ricetteNote[r.id] = true;
    nota(DATA.CUCINA.length + ' ricette imparate');
  });
  bottone(g, 'Semi di stagione ×20', ()=>{
    const st = G.stagione().id;
    let n = 0;
    for(const id in DATA.ITEMS){
      const I = DATA.ITEMS[id];
      if(I.cat !== 'seme') continue;
      const C = DATA.CROPS[(I.crop)||id.replace('seme_','')];
      if(C && C.stagioni && C.stagioni.indexOf(st) < 0) continue;
      if(aggiungiTanti(id, 20)) n++;
    }
    nota(n + ' tipi di seme di ' + st);
  });
  bottone(g, 'Svuota lo zaino', ()=>{
    for(let i=0;i<G.inv.length;i++) G.inv[i] = null;
    nota('zaino vuoto');
  }, 'rosso');
}

/* --------------------------------------------------------------- */
/* TEMPO E METEO                                                   */
/* --------------------------------------------------------------- */
function costruisciTempo(){
  const g = sezione('Tempo');
  bottone(g, '+1 ora', ()=>{ G.ora = Math.min(1439, G.ora + 60); nota('ore ' + Math.floor(G.ora/60)); });
  bottone(g, '+6 ore', ()=>{ G.ora = Math.min(1439, G.ora + 360); nota('ore ' + Math.floor(G.ora/60)); });
  bottone(g, 'Sera (17:00)', ()=>{ G.ora = 1020; nota('le 17, ora della veglia'); });
  /* passa da G.dormi, non da «giorno++»: la fine giornata vende la cassa,
     fa crescere i campi, tira il meteo, muove il mercante e consegna la
     posta. Saltarla darebbe un giorno dopo che non è mai esistito. */
  bottone(g, 'Dormi (giorno dopo)', ()=>{ G.dormi(); nota('buonanotte'); });

  const s = sezione('Stagione e meteo');
  DATA.SEASONS.forEach((st, i)=>{
    bottone(s, st.nome, ()=>{
      G.stagioneIdx = i;
      WORLD.nuovoGiorno(G.maps, st.id, Math.random()*99999|0);
      REND.initMeteo();
      nota('adesso è ' + st.nome + ' (dormi per vedere i campi aggiornati)');
    });
  });
  for(const m in DATA.METEO)
    bottone(s, DATA.METEO[m].nome || m, ()=>{
      G.meteo = m;
      REND.initMeteo();
      nota('meteo: ' + m);
    });

  /* La gelata ha un bottone suo e non segue la neve. Nel gioco è
     «inverno + neve + una volta su due», tirata a inizio giornata, e blocca
     due cose lontane fra loro: l'annaffiatoio e la pesca. Legarla al meteo
     avrebbe voluto dire non poterla provare d'estate e non poter mettere la
     neve senza. */
  const bg = bottone(s, 'Gelata: no', ()=>{
    G.gelo = !G.gelo;
    bg.textContent = 'Gelata: ' + (G.gelo ? 'sì' : 'no');
    bg.classList.toggle('acceso', G.gelo);
    nota(G.gelo ? 'fiume e pozzo ghiacciati: niente pesca, niente annaffiatoio'
                : 'acqua di nuovo liquida');
  });
}

/* --------------------------------------------------------------- */
/* LUOGHI                                                          */
/* --------------------------------------------------------------- */
function costruisciLuoghi(){
  const g = sezione('Dove andare');
  for(const id of WORLD.MAPPE){
    bottone(g, id, ()=>{
      if(!G.teletrasporta(id)) nota('non ci riesco: ' + id, false);
      else nota('sei a ' + id);
    });
  }
}

/* --------------------------------------------------------------- */
/* STORIA                                                          */
/* --------------------------------------------------------------- */
function accendiBraci(n){
  /* le nicchie si accendono davvero, una per una, con quello che
     ognuna chiede: `G.braci = 4` e basta lascerebbe il santuario con
     quattro braci spente e la storia che chiede roba già data */
  for(let i=0;i<DATA.SANTUARIO.length;i++){
    const B = DATA.SANTUARIO[i];
    if(i < n){
      G.santuario[B.id] = true;
      G.santuarioDato[B.id] = B.req.slice();
    } else {
      delete G.santuario[B.id];
      delete G.santuarioDato[B.id];
    }
  }
  G.braci = n;
  G.visitati.bosco = true;
  G.costruzioni.ponte = true;      // al santuario ci si arriva solo col ponte
  WORLD.costruisci(G.maps, 'ponte');
}

function costruisciStoria(){
  const b = sezione('Braci del santuario');
  for(let n=0;n<=4;n++)
    bottone(b, n + '/4', ()=>{
      accendiBraci(n);
      nota(n === 0 ? 'santuario spento (il ponte resta: serve per arrivarci)'
                   : n + ' braci accese, e il ponte per andarci');
    });

  const a = sezione('Atto secondo — la notte del solstizio');
  bottone(a, '1. Avvia (4 braci)', ()=>{
    accendiBraci(4);
    G.trame.veglia.avviata = true;
    nota('atto secondo avviato: adesso i sei hanno qualcosa da dire');
  });
  bottone(a, '2. Tutte le memorie', ()=>{
    const v = G.trame.veglia;
    v.avviata = true;
    for(const m of DATA.MEMORIE) v.memorie[m.id] = true;
    nota(DATA.MEMORIE.length + ' memorie raccolte: ora Fiammella chiude il cerchio');
  });
  bottone(a, '3. Sai la verità', ()=>{
    const v = G.trame.veglia;
    v.avviata = true;
    for(const m of DATA.MEMORIE) v.memorie[m.id] = true;
    v.verita = true;
    G.lettere.verita = true;
    nota('verità saputa: adesso si può invitare');
  });
  bottone(a, '4. Invita tutti e sei', ()=>{
    const v = G.trame.veglia;
    v.verita = true; v.giorno = null;
    for(const m of DATA.MEMORIE) v.invitati[m.npc] = true;
    nota('invitati ' + G.invitatiAllaVeglia() + '/' + DATA.MEMORIE.length);
  });
  bottone(a, '5. Veglia stasera', ()=>{
    const v = G.trame.veglia;
    v.verita = true; v.fatta = false;
    for(const m of DATA.MEMORIE) v.invitati[m.npc] = true;
    /* `giornoTot` a zero è il primo giorno di una partita nuova, e
       `v.giorno &&` lo leggerebbe come «nessuna veglia fissata»: la sera
       non arriverebbe mai e il pannello sembrerebbe rotto. */
    if(!G.giornoTot) G.giornoTot = 1;
    v.giorno = G.giornoTot;
    G.ora = 1020;
    G.aggiornaOspitiVeglia();
    nota('è stasera: vai alla radura nel bosco dopo il tramonto');
  });
  bottone(a, 'Vai alla radura', ()=>{
    G.teletrasporta('bosco');
    nota('bosco: la radura è oltre il ponte, a est');
  });
  bottone(a, 'Azzera atto secondo', ()=>{
    G.trame.veglia = { avviata:false, memorie:{}, verita:false, invitati:{}, giorno:null, fatta:false };
    G.aggiornaOspitiVeglia();
    nota('atto secondo da rifare');
  }, 'rosso');

  const ch = sezione('Il paese che parla');
  bottone(ch, 'Fai parlare qualcuno', ()=>{
    const r = G.chiacchiera();
    nota(r ? r.chi + ': «' + r.testo.slice(0,50) + '»'
           : 'nessuno abbastanza vicino da farsi sentire', !!r);
  });
  bottone(ch, 'Chiamali tutti qui', ()=>{
    let n = 0;
    for(const p of G.passanti){
      p.mappa = G.mappaId;
      p.px = G.p.px + 40 + (n%3)*30; p.py = G.p.py + ((n/3)|0)*26;
      p.dest = null; p.wait = 0; p.tacePer = 0; n++;
    }
    nota(n + ' passanti al tuo fianco');
  });
  bottone(ch, 'Tutti insieme (prova incastri)', ()=>{
    /* tre nuvolette nello stesso punto: è il caso per cui esiste
       l'anti-sovrapposizione, e l'unico modo per vederla lavorare */
    for(const p of G.passanti){ p.mappa=G.mappaId; p.px=G.p.px+50; p.py=G.p.py; p.tacePer=0; }
    let n=0;
    for(const p of G.passanti.slice(0,3)) if(G.chiacchiera(p.id)) n++;
    nota(n + ' fumetti nello stesso punto: devono scansarsi da soli');
  });
  bottone(ch, 'Zitti tutti', ()=>{ G.chiacchiere.length = 0; nota('silenzio'); });

  const gt = sezione('Il gatto');
  bottone(gt, 'Portalo qui', ()=>{
    const a = G.animali.find(x=>x.tipo==='gatto');
    if(!a){ nota('nessun gatto in questa partita', false); return; }
    a.mappa = G.mappaId; a.px = G.p.px + 24; a.py = G.p.py; a.dest = null; a.wait = 0;
    nota('il gatto è al tuo fianco: premi E');
  });
  for(const n of [0, 45, 69, 100])
    bottone(gt, 'Affetto ' + n, ()=>{
      G.gatto.affetto = n;
      if(n < 70) G.gatto.nome = null;
      G.gatto.giorno = -1;
      nota('affetto ' + n + (n>=70 ? ' — la prossima carezza gli dà il nome' : ''));
    });
  bottone(gt, 'Riazzera il gatto', ()=>{
    G.gatto = { affetto:0, giorno:-1, nome:null };
    delete G.lettere.gatto;
    nota('torna randagio, lettera compresa');
  }, 'rosso');

  const c = sezione('Le altre storie');
  bottone(c, 'Torta di Ilde: avvia', ()=>{
    G.trame.torta = { avviata:true, segreto:false, fatta:false };
    G.amicizia.marisol = Math.max(G.amicizia.marisol||0, 200);
    G.amicizia.serafina = Math.max(G.amicizia.serafina||0, 200);
    nota('parla con Marisol, poi con Serafina');
  });
  bottone(c, 'Pesce Luna: avvia', ()=>{
    G.trame.pesceluna = { avviata:true, preso:false, fatta:false };
    G.amicizia.elio = Math.max(G.amicizia.elio||0, 200);
    nota('di notte, al lago: abbocca molto più spesso');
  });
  bottone(c, 'Lezione di caccia: fatta', ()=>{
    G.lezioneCaccia = null;
    G.sacaccia = true;
    if(!G.conta('arco')) G.aggiungi('arco',1);
    nota('caccia sbloccata, arco nello zaino');
  });
  bottone(c, 'Lezione di caccia: da capo', ()=>{
    G.lezioneCaccia = null; G.sacaccia = false;
    G.amicizia.eremita = Math.max(G.amicizia.eremita||0, 150);
    nota('sali al Passo e chiedi a Oreste dell\'arco');
  });
}

/* --------------------------------------------------------------- */
/* ESPERIENZA E LIVELLI                                            */
/* --------------------------------------------------------------- */
function costruisciLivelli(){
  const g = sezione('Esperienza');

  /* Passa da G.xp e non da G.skills[k] += n: è G.xp che accorge la
     salita, paga il premio e fa partire la carta. Scrivere l'esperienza
     a mano proverebbe soltanto che si sa scrivere in un oggetto. */
  for(const k in DATA.SKILLS){
    bottone(g, DATA.SKILLS[k].nome + ' +50', ()=>{
      G.xp(k, 50);
      const p = LIV.progresso(k);
      nota(DATA.SKILLS[k].nome + ': liv. ' + p.liv + (p.massimo ? ' (massimo)' : ', mancano ' + p.mancano));
    });
  }

  const s = sezione('Livelli');
  bottone(s, 'Un livello a caso', ()=>{
    const chiavi = Object.keys(DATA.SKILLS).filter(k=>G.livello(k) < 10);
    if(!chiavi.length){ nota('sono già tutte al massimo', false); return; }
    const k = chiavi[(Math.random()*chiavi.length)|0];
    G.xp(k, LIV.progresso(k).mancano);
    nota(DATA.SKILLS[k].nome + ' sale');
  });
  bottone(s, 'Salta 3 livelli in una volta', ()=>{
    const k = Object.keys(DATA.SKILLS).find(x=>G.livello(x) <= 7) || 'agricoltura';
    const liv = G.livello(k);
    const meta = Math.min(10, liv+3);
    G.xp(k, DATA.XP_LIV[meta] - (G.skills[k]||0));
    nota(DATA.SKILLS[k].nome + ': da ' + liv + ' a ' + G.livello(k) + ' — le carte si mettono in fila');
  });
  bottone(s, 'Tutte al livello 9', ()=>{
    for(const k in DATA.SKILLS) G.skills[k] = DATA.XP_LIV[9];
    nota('tutte a 9: il prossimo colpo di ognuna dà il premio grosso');
  });
  bottone(s, 'Azzera esperienza', ()=>{
    for(const k in DATA.SKILLS) G.skills[k] = 0;
    G.energiaBonus = 0;
    G.energiaMax = 260;
    G.premiSospesi = [];
    nota('esperienza a zero, energia com\'era all\'inizio');
  }, 'rosso');
  bottone(s, 'Premi in sospeso: provali', ()=>{
    /* riempie lo zaino apposta e poi fa salire di livello: è l'unico
       modo per vedere il ramo in cui il premio non ci sta */
    for(let i=0;i<G.inv.length;i++) if(!G.inv[i]) G.inv[i] = { id:'pietra', n:999 };
    const k = Object.keys(DATA.SKILLS).find(x=>G.livello(x) < 10) || 'agricoltura';
    G.xp(k, LIV.progresso(k).mancano);
    nota('zaino riempito e livello preso: il premio dovrebbe essere in attesa (' + LIV.sospesi() + ')');
  });
  bottone(s, 'Apri la scheda Livelli', ()=>{ UI.diario(G,'livelli'); nota('scheda aperta'); });
}

/* --------------------------------------------------------------- */
/* PROGRESSI                                                       */
/* --------------------------------------------------------------- */
function costruisciProgressi(){
  const g = sezione('Progressi');
  bottone(g, 'Amicizia al massimo', ()=>{
    for(const id in DATA.NPCS) G.amicizia[id] = 1000;
    nota('dieci cuori con tutti');
  });
  bottone(g, 'Abilità al livello 10', ()=>{
    const max = DATA.XP_LIV[DATA.XP_LIV.length-1];
    for(const k of ['agricoltura','raccolta','estrazione','pesca','caccia']) G.skills[k] = max;
    G.energiaBonus = 0;
    nota('tutte le abilità a ' + G.livello('pesca'));
  });
  bottone(g, 'Tutte le costruzioni', ()=>{
    for(const c of DATA.COSTRUZIONI){
      G.costruzioni[c.id] = true;
      WORLD.costruisci(G.maps, c.id);
    }
    nota(DATA.COSTRUZIONI.length + ' costruzioni in piedi');
  });
  bottone(g, 'Collezione completa', ()=>{
    for(const {ids} of G.categorieCollezione()) for(const id of ids) G.collezione[id] = true;
    const c = G.contaCollezione().tot;
    nota('collezione ' + c.d + '/' + c.t);
  });
  bottone(g, 'Tutte le mappe scoperte', ()=>{
    for(const id of WORLD.MAPPE) G.visitati[id] = true;
    G.stats.visitatoBosco = G.stats.visitatoGrotta = G.stats.visitatoPaese = true;
    nota(WORLD.MAPPE.length + ' luoghi sulla mappa');
  });
  bottone(g, 'Salta la guida', ()=>{
    G.tutorialFatto = true;
    G.guidaNascosta = true;
    /* la funzione si chiama `fine`, non `chiudi`: col nome sbagliato la
       guardia `TUT.chiudi &&` taceva e il cartello del tutorial restava
       a schermo dopo il clic */
    if(window.TUT) TUT.fine(true);
    if(window.GUIDA && GUIDA.init) GUIDA.init();
    nota('primi passi tolti di mezzo');
  });
  bottone(g, 'Tutto quanto', ()=>{
    for(const id in DATA.NPCS) G.amicizia[id] = 1000;
    const max = DATA.XP_LIV[DATA.XP_LIV.length-1];
    for(const k of ['agricoltura','raccolta','estrazione','pesca','caccia']) G.skills[k] = max;
    for(const c of DATA.COSTRUZIONI){ G.costruzioni[c.id] = true; WORLD.costruisci(G.maps, c.id); }
    for(const r of DATA.CUCINA) G.ricetteNote[r.id] = true;
    for(const k in DATA.UPGRADE){ if(!G.conta(k)) G.aggiungi(k,1); G.attrezziLiv[k] = DATA.UPGRADE[k].length; }
    for(const id of WORLD.MAPPE) G.visitati[id] = true;
    for(const {ids} of G.categorieCollezione()) for(const id of ids) G.collezione[id] = true;
    G.oro += 100000;
    G.sacaccia = true;
    accendiBraci(4);
    nota('partita aperta da tutte le parti');
  }, 'oro');
}

/* --------------------------------------------------------------- */
/* STORIE DEL PAESE                                                */
/* --------------------------------------------------------------- */
/* Una vicenda intera vuole quattro cose che a mano costano mezz'ora:
   l'amicizia giusta, la roba da consegnare, il giro fino al posto e
   tre conversazioni. Qui è un clic per passo.

   Passa da `VICENDE.avanza`, che è la stessa funzione che chiama la
   scelta nel dialogo: se un giorno il motore cambia, questo cambia con
   lui invece di continuare a provare una strada che non esiste più.
   L'amicizia si alza scrivendo il numero, ed è l'unica scorciatoia —
   ma è la stessa cosa che fa un regalo, solo senza aspettare i giorni.

   `UI.chiudiDialogo()` davanti non è cerimonia: la scelta vera chiude il
   dialogo PRIMA di eseguire l'azione, e il premio dell'ultimo passo è
   appeso al `fine` del dialogo. Aprendone uno nuovo sopra a quello
   ancora aperto, `dlgFine` verrebbe sovrascritto e il premio non lo
   pagherebbe più nessuno. */
function unPassoDiVicenda(id, zitto){
  const v = DATA.VICENDE[id];
  const s = G.vicende[id];
  if(s && s.fatta){ if(!zitto) nota(v.titolo + ': già finita'); return false; }

  const serve = (v.cuori||0) * 100;
  if((G.amicizia[v.npc]||0) < serve) G.amicizia[v.npc] = serve;

  const p = s ? v.passi[s.passo] : v.passi[0];
  const dati = [];
  if(p && p.tipo === 'porta'){
    for(const k in p.ing){
      const manca = p.ing[k] - G.conta(k);
      if(manca > 0){
        let messi = 0;
        for(let i=0;i<manca;i++){ if(!G.aggiungi(k,1)) break; messi++; }
        dati.push(IT.nome(k) + ' ×' + messi);
        if(messi < manca){ nota('zaino pieno: manca ' + IT.nome(k) + ' per andare avanti', false); return false; }
      }
    }
  }

  UI.chiudiDialogo();
  VICENDE.avanza(id);

  if(!zitto){
    const d = G.vicende[id] || {};
    const dove = (VICENDE.attive().find(x=>x.id===id) || {}).compito;
    /* «finita, premio pagato» era falso e misurato falso: il premio è
       appeso al `fine` del dialogo, quindi al momento di questa riga
       c'erano ancora 600 monete e ne sarebbero arrivate 1.300 chiudendo
       l'ultima battuta. Un pannello che annuncia una cosa non ancora
       successa è peggio di uno muto, perché chi prova va a controllare
       il valore sbagliato e conclude che il premio non funziona. */
    nota(v.titolo + ': ' + (d.fatta ? 'finita — il premio arriva chiudendo il dialogo'
          : 'passo ' + (d.passo+1) + ' di ' + v.passi.length + ' — ' + dove)
        + (dati.length ? ' (dati: ' + dati.join(', ') + ')' : ''));
  }
  return true;
}

function costruisciVicende(){
  const g = sezione('Storie del paese');
  for(const id in DATA.VICENDE)
    bottone(g, DATA.VICENDE[id].titolo, ()=>unPassoDiVicenda(id));

  bottone(g, 'Finisci tutte', ()=>{
    let passi = 0, guardia = 0;
    for(const id in DATA.VICENDE)
      while(!(G.vicende[id]||{}).fatta && guardia++ < 60)
        { if(!unPassoDiVicenda(id, true)) break; passi++; }
    UI.chiudiDialogo();
    nota(passi + ' passi fatti: sei storie finite, e i quattro miglioramenti si possono comprare');
  });

  bottone(g, 'Azzera le storie', ()=>{
    G.vicende = {};
    nota('storie da rifare (i cuori restano dove sono)');
  }, 'rosso');
}

/* --------------------------------------------------------------- */
/* SULLA PERSONA                                                   */
/* --------------------------------------------------------------- */
/* Comprare passa da `PERSONA.compra`, che rifiuta se la vicenda non è
   finita: il bottone quindi prima finisce la storia di quella persona,
   e lo dice. È il percorso vero, in ordine, e non un permesso scritto a
   mano — un `G.persona.zaino = 2` lascerebbe la partita in uno stato in
   cui hai lo zaino grande e Bruno non ti ha mai parlato del libretto. */
function costruisciPersona(){
  const g = sezione('Sulla persona');
  for(const k in DATA.PERSONA){
    const U = DATA.PERSONA[k];
    bottone(g, U.nome + ' ▸', ()=>{
      if(PERSONA.grado(k) >= U.gradi.length){ nota(U.nome + ': già al massimo'); return; }
      let storia = '';
      if(!PERSONA.disponibile(k)){
        let guardia = 0;
        while(!(G.vicende[U.vicenda]||{}).fatta && guardia++ < 20)
          if(!unPassoDiVicenda(U.vicenda, true)) break;
        UI.chiudiDialogo();
        storia = ' (prima ho finito «' + DATA.VICENDE[U.vicenda].titolo + '»)';
      }
      const c = PERSONA.costo(k);
      if(G.oro < c.costo) G.oro = c.costo;
      for(const i in (c.ing||{})){
        const manca = c.ing[i] - G.conta(i);
        for(let n=0;n<manca;n++) if(!G.aggiungi(i,1)) break;
      }
      if(!PERSONA.compra(k)){ nota(U.nome + ': non è passato — zaino pieno o materiale mancante', false); return; }
      nota(U.nome + ': ' + c.nome + ' — ' + PERSONA.frase(k) + storia);
    });
  }

  bottone(g, 'Azzera i miglioramenti', ()=>{
    G.persona = {};
    G.applicaPersona();
    nota('tolti: zaino ' + G.invMax + ' caselle, energia ' + G.energiaMax);
  }, 'rosso');
}

/* --------------------------------------------------------------- */
/* SALVATAGGIO                                                     */
/* --------------------------------------------------------------- */
function costruisciSalvataggio(){
  const g = sezione('Salvataggio');
  bottone(g, 'Salva adesso', ()=>{
    nota(G.salva() ? 'salvato' : 'non è riuscito a salvare', G.salva());
  });
  bottone(g, 'Ricarica la pagina', ()=>{ location.reload(); });

  /* Chiede conferma perché è l'unico comando del pannello che distrugge
     qualcosa che non si può rifare con un altro bottone. */
  const b = el('button','dbg-b rosso','Cancella il salvataggio');
  b.onclick = ()=>{
    if(!confirm('Cancello il salvataggio di questo browser? Non si torna indietro.')) return;
    try{
      localStorage.removeItem('fioralba_save_v1');
      localStorage.removeItem('fioralba_save_bak');
    }catch(e){}
    nota('salvataggio cancellato: ricarica per ricominciare');
  };
  g.appendChild(b);
}

/* --------------------------------------------------------------- */
/* montaggio                                                       */
/* --------------------------------------------------------------- */
function monta(){
  scatola = el('div','dbg-scatola');

  const linguetta = el('button','dbg-linguetta','debug');
  linguetta.title = 'pannello di prova — non lo vede chi gioca';
  scatola.appendChild(linguetta);

  const pannello = el('div','dbg-pannello nascosto');
  scatola.appendChild(pannello);

  const testa = el('div','dbg-testa');
  testa.appendChild(el('strong',null,'Pannello di prova'));
  const chiudi = el('button','dbg-x','✕');
  chiudi.onclick = ()=>{ pannello.classList.add('nascosto'); linguetta.classList.remove('acceso'); };
  testa.appendChild(chiudi);
  pannello.appendChild(testa);

  statoEl = el('div','dbg-stato');
  pannello.appendChild(statoEl);

  riga = el('div','dbg-nota');
  pannello.appendChild(riga);

  corpo = el('div','dbg-corpo');
  pannello.appendChild(corpo);

  costruisciRicchezza();
  costruisciOggetti();
  costruisciTempo();
  costruisciLuoghi();
  costruisciLivelli();
  costruisciStoria();
  costruisciVicende();
  costruisciPersona();
  costruisciProgressi();
  costruisciSalvataggio();

  linguetta.onclick = ()=>{
    const chiuso = pannello.classList.toggle('nascosto');
    linguetta.classList.toggle('acceso', !chiuso);
    if(!chiuso) scriviStato();
  };

  document.body.appendChild(scatola);
  scriviStato();
  setInterval(scriviStato, 1000);   // l'ora e il luogo cambiano da soli
}

D.attivo = false;
D.monta = function(){
  if(D.attivo) return false;
  D.attivo = true;
  monta();
  return true;
};

if(richiesto()){
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', D.monta);
  else D.monta();
}

})();
