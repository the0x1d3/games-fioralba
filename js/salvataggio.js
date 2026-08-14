/* ===================================================================
   FIORALBA — salvataggio.js
   Trasformare la partita in testo e rimetterla al suo posto: mappe in
   RLE, oggetti per indice, validazione di quello che arriva da fuori.

   NON SCRIVE PIÙ SU DISCO. Fino a ieri questo file era il padrone del
   salvataggio: scriveva `fioralba_save_v1`, ne teneva un backup,
   esportava e importava file .json. Adesso la partita sta sul server e
   qui resta il mestiere vero — serializzare e deserializzare — mentre
   dove finiscono quei byte lo decide sincronizza.js. Il motivo è che
   due padroni della stessa partita divergono, e divergevano: il
   giocatore si trovava a scegliere quale delle due tenere ogni volta
   che aveva giocato da due posti.

   Stava in game.js. Ne è uscita perché è il pezzo che si può leggere da
   solo: di tutto game.js gli servono due funzioni — `statoIniziale` e
   `normalizzaStato` — per 270 righe che nessuno vuole rileggere mentre
   cerca un bug della pesca.
   =================================================================== */
(function(){

const T = 32;

const S = {};
window.SALVA = S;


function serializzaMappa(m){
  const obj={}, suolo={};
  for(let i=0;i<m.obj.length;i++){
    const o=m.obj[i];
    if(!o || o.t==='muro' || o.t==='porta') continue;
    obj[i]=o;
  }
  for(let i=0;i<m.suolo.length;i++) if(m.suolo[i]) suolo[i]=m.suolo[i];

  /* Il terreno viaggia in RLE — coppie [valore, quante volte] — invece
     che numero per numero. Misurato prima: il salvataggio pesava 170 KB
     e per il 98,6% era terreno, cioè lunghe distese della stessa erba
     scritte "0,0,0,0…" migliaia di volte. L'autosave riscrive tutto ogni
     due minuti e a ogni cambio di scheda: erano i byte più inutili del
     gioco. I salvataggi vecchi restano leggibili: chi rilegge accetta
     sia `g` pieno sia `gr` compresso. */
  const gr = [];
  let v = m.g[0], n = 1;
  for(let i=1;i<m.g.length;i++){
    if(m.g[i]===v){ n++; continue; }
    gr.push(v,n); v=m.g[i]; n=1;
  }
  gr.push(v,n);

  // w e h servono a chi rilegge: senza, non si può sapere se gli indici
  // salvati parlano ancora della stessa mappa
  return { w:m.w, h:m.h, gr, obj, suolo, deco:m.deco.length };
}

/* riapre le coppie [valore, n]: torna null se il conto non torna, e chi
   chiama tiene il terreno rigenerato invece di uno strappato a metà */
function espandiRLE(gr, lunghezzaAttesa){
  if(!Array.isArray(gr) || gr.length%2) return null;
  const g = new Uint8Array(lunghezzaAttesa);
  let i = 0;
  for(let k=0;k<gr.length;k+=2){
    const v = gr[k], n = gr[k+1];
    if(!(n>0) || i+n > lunghezzaAttesa) return null;
    g.fill(v, i, i+n);
    i += n;
  }
  return i === lunghezzaAttesa ? g : null;
}

/* Gli oggetti sono salvati per indice — `i = y*larghezza + x` — e
   l'indice ha senso solo se la larghezza è la stessa. Quando le stanze
   sono state rifatte più grandi, i salvataggi vecchi hanno continuato a
   riversarci dentro le loro coordinate: nella casa il letto di prima
   finiva in (11,1) e il camino in (2,2), cioè esattamente sopra al letto
   nuovo. Da fuori si vedeva «il letto è dietro al camino», ed era vero.

   Se la mappa ha cambiato misura, quello che c'è nel salvataggio per
   quella mappa non è più leggibile: si tiene l'arredamento nuovo. Si
   perde quello che il giocatore aveva posato *lì dentro* — ma in una
   stanza rifatta non c'era comunque un posto dove rimettercelo, e
   averla arredata a caso era peggio. */
function deserializzaMappa(m, d){
  if(!d) return;
  const stessaMisura = (typeof d.w === 'number' && typeof d.h === 'number')
    ? (d.w === m.w && d.h === m.h)
    : (Array.isArray(d.g) && d.g.length === m.g.length);   // salvataggi vecchi: si deduce
  if(!stessaMisura) return;

  /* Le stanze sono *scritte*, non costruite dal giocatore: il letto sta
     dove l'abbiamo messo noi, e non c'è motivo di rileggerlo da un
     salvataggio. Rileggerlo anzi fa danno, e l'ha fatto: chi ha caricato
     la partita nella finestra fra l'allargamento delle stanze e la
     correzione si è visto riscrivere nel salvataggio l'arredamento
     sbagliato, con le misure nuove. Da lì in poi le misure combaciano e
     il controllo qui sopra non se ne accorge più: il letto resta dietro
     al camino per sempre.

     Quindi degli interni si tiene solo quello che ci ha messo il
     giocatore — casse e macchinari — e il resto lo rifà la stanza. Chi
     ha il salvataggio guasto guarisce da solo alla prima apertura. */
  if(m.interno){
    const miei = [];
    for(const k in d.obj){
      const o = d.obj[k];
      if(o && (o.t==='macchina' || o.t==='mobile')) miei.push([k|0, o]);
    }
    for(const [i, o] of miei){
      let dove = i;
      if(m.obj[dove] || WORLD.solido(m, dove%m.w, (dove/m.w)|0)){
        // la casella di allora adesso è occupata: si cerca lì vicino
        const p = WORLD.vicinoLibero(m, dove%m.w, (dove/m.w)|0);
        dove = p ? WORLD.idx(m, p.x, p.y) : -1;
        if(dove>=0 && m.obj[dove]) dove = -1;
      }
      if(dove>=0) m.obj[dove] = o;
    }

    /* L'arredamento scritto non si rilegge — vedi qui sopra il perché —
       ma gli SPOSTAMENTI sì: non sono l'arredamento, sono le differenze.
       Si riapplicano sulla stanza appena rifatta, e ognuno si controlla
       da sé: se al posto di partenza non c'è più quel mobile — perché la
       stanza è cambiata fra due versioni — lo spostamento si salta e la
       casa resta com'è scritta, invece di mettere il letto dietro al
       camino per sempre come successe l'altra volta. */
    for(const s of (G.arrediSpostati || [])){
      if(s.m !== m.id) continue;
      const o = m.obj[s.da];
      if(!o || o.t !== s.t) continue;
      if(s.a < 0 || s.a >= m.obj.length || m.obj[s.a]) continue;
      if(WORLD.solido(m, s.a % m.w, (s.a / m.w)|0)) continue;
      m.obj[s.da] = null;
      m.obj[s.a] = o;
    }
    return;
  }

  if(d.g && d.g.length===m.g.length) m.g = Uint8Array.from(d.g);   // salvataggi vecchi
  else if(d.gr){ const g = espandiRLE(d.gr, m.g.length); if(g) m.g = g; }
  for(let i=0;i<m.obj.length;i++){
    const o=m.obj[i];
    if(o && (o.t==='muro'||o.t==='porta')) continue;
    m.obj[i]=null;
  }
  for(const k in d.obj) m.obj[k|0]=d.obj[k];
  m.suolo = new Array(m.w*m.h).fill(null);
  for(const k in d.suolo) m.suolo[k|0]=d.suolo[k];
}

function costruisciDati(){
  return {
    v:2,
    nomeGiocatore:G.nomeGiocatore, mappaId:G.mappaId,
    oro:G.oro, energia:G.energia, energiaMax:G.energiaMax, energiaBonus:G.energiaBonus,
    giorno:G.giorno, stagioneIdx:G.stagioneIdx, anno:G.anno, giornoTot:G.giornoTot,
    ora:G.ora, meteo:G.meteo, meteoDomani:G.meteoDomani,
    inv:G.inv, invMax:G.invMax, slotSel:G.slotSel,
    skills:G.skills, attrezziLiv:G.attrezziLiv,
    amicizia:G.amicizia, costruzioni:G.costruzioni,
    santuario:G.santuario, santuarioDato:G.santuarioDato, braci:G.braci,
    lettere:G.lettere, ricetteNote:G.ricetteNote,
    cassaConsegna:G.cassaConsegna, stats:G.stats, animali:G.animali,
    look:G.look, vistoFiammella:G.vistoFiammella, introSerafina:G.introSerafina,
    vistoPesca:G.vistoPesca, sacaccia:G.sacaccia, lezioneCaccia:G.lezioneCaccia,
    tutorialFatto:G.tutorialFatto, guidaAperta:G.guidaAperta, guidaNascosta:G.guidaNascosta,
    regaloRicevuto:G.regaloRicevuto,
    mercato:G.mercato, gelo:G.gelo,
    richieste:G.richieste, richiestaSeq:G.richiestaSeq, premiSospesi:G.premiSospesi, arrediSpostati:G.arrediSpostati, bottiglieLette:G.bottiglieLette, gatto:G.gatto,
    obiettiviRiscossi:G.obiettiviRiscossi, sagra:G.sagra, mercante:G.mercante, trame:G.trame, vicende:G.vicende, persona:G.persona, visitati:G.visitati, collezione:G.collezione,
    px:G.p.px, py:G.p.py,
    maps:(function(){ const o={}; for(const k in G.maps) o[k]=serializzaMappa(G.maps[k]); return o; })()
  };
}

S.testo = function(){
  /* Serializza a parte e non tocca niente se fallisce: un salvataggio
     mezzo scritto è peggio di uno vecchio. */
  try{ return JSON.stringify(costruisciDati()); }
  catch(e){ console.warn('Serializzazione salvataggio fallita', e); return null; }
};

/* Salvare vuol dire mandare al server.

   Qui c'erano tre righe di localStorage — scrivi il backup, scrivi la
   partita — e la partita del server era una copia che qualcuno teneva
   allineata. Adesso è il contrario: c'è una partita sola e sta di là.
   `programmaInvio` riempie il cassetto subito (sincrono, così una
   scheda chiusa un istante dopo non costa niente) e manda dopo qualche
   secondo di quiete.

   Sta qui e non nei punti che salvano perché i punti sono sei —
   autosave, dormita, menu, tutorial, cambio scheda, pannello di prova —
   e il settimo che qualcuno aggiungerà se la dimenticherebbe. È già
   successo: `programmaInvio` è rimasta senza chiamanti per un anno, e
   le partite collegate salivano sul server una volta sola. */
S.salva = function(){
  if(!S.testo()) return false;
  if(!window.SINC || !SINC.collegato()) return false;
  SINC.programmaInvio();
  return true;
};

/* ---- Valida un testo e lo scrive come salvataggio corrente ----
   Meglio rifiutare un file storto qui che ritrovarsi una partita che si apre
   ma è rotta: il renderer sopravvive agli errori, il giocatore no. ---- */
function validaSalvataggio(d){
  if(!d || typeof d!=='object' || Array.isArray(d)) return 'Questo file non sembra un salvataggio di Fioralba.';
  if(!Array.isArray(d.inv)) return 'Il salvataggio non contiene uno zaino valido.';
  for(const s of d.inv){
    if(s===null || s===undefined) continue;
    if(typeof s!=='object' || typeof s.id!=='string' || typeof s.n!=='number' || !(s.n>0))
      return 'Lo zaino nel salvataggio contiene voci non valide.';
  }
  if(!d.maps || typeof d.maps!=='object') return 'Il salvataggio non contiene le mappe della valle.';
  const trovate = Object.keys(d.maps).filter(k=>WORLD.MAPPE.indexOf(k)>=0);
  if(!trovate.length) return 'Le mappe del salvataggio non corrispondono a quelle del gioco.';
  for(const k of trovate){
    const m = d.maps[k];
    if(!m || typeof m!=='object') return 'La mappa «'+k+'» nel salvataggio è illeggibile.';
    if(m.g!==undefined && !Array.isArray(m.g)) return 'La mappa «'+k+'» ha un terreno non valido.';
    if(m.gr!==undefined && (!Array.isArray(m.gr) || m.gr.length%2)) return 'La mappa «'+k+'» ha un terreno compresso non valido.';
    if(m.obj!==undefined && (typeof m.obj!=='object' || Array.isArray(m.obj))) return 'La mappa «'+k+'» ha oggetti non validi.';
    if(m.suolo!==undefined && (typeof m.suolo!=='object' || Array.isArray(m.suolo))) return 'La mappa «'+k+'» ha un terreno coltivato non valido.';
  }
  for(const [k,tipo] of [['oro','number'],['giorno','number'],['stagioneIdx','number'],['anno','number']]){
    if(d[k]!==undefined && typeof d[k]!==tipo) return 'Il campo «'+k+'» nel salvataggio non è valido.';
  }
  if(d.stagioneIdx!==undefined && (d.stagioneIdx<0 || d.stagioneIdx>3)) return 'La stagione nel salvataggio non esiste.';
  return null;
}

/* Valida un testo e lo installa come partita corrente.
   Meglio rifiutare qui che ritrovarsi una partita che si apre ma è
   rotta: il renderer sopravvive agli errori, il giocatore no. */
S.applicaTesto = function(testo){
  let d;
  try{ d = JSON.parse(testo); }
  catch(e){ return {ok:false, err:'Il salvataggio non è leggibile.'}; }
  const err = validaSalvataggio(d);
  if(err) return {ok:false, err};
  try{ if(!applicaSalvataggio(testo)) return {ok:false, err:'Il salvataggio non si è potuto aprire.'}; }
  catch(e){ return {ok:false, err:'Il salvataggio non si è potuto aprire: ' + e.message}; }
  return {ok:true};
};

/* applica un salvataggio (testo JSON) allo stato. Ritorna true se riuscito. */
function applicaSalvataggio(raw){
  if(!raw) return false;
  const d = JSON.parse(raw);                 // può lanciare: gestito dal chiamante
  if(!d || typeof d!=='object' || !d.maps) return false;
  Object.assign(G, G.statoIniziale());
  G.maps = WORLD.crea();
  for(const k of ['nomeGiocatore','mappaId','oro','energia','energiaMax','energiaBonus','giorno','stagioneIdx',
                  'anno','giornoTot','ora','meteo','meteoDomani','inv','invMax','slotSel',
                  'skills','attrezziLiv','amicizia','costruzioni','santuario','santuarioDato',
                  'braci','lettere','ricetteNote','cassaConsegna','stats','animali','look',
                  'vistoFiammella','introSerafina','vistoPesca','sacaccia','lezioneCaccia','tutorialFatto','guidaAperta','guidaNascosta','regaloRicevuto',
                  'mercato','gelo',
                  'richieste','richiestaSeq','premiSospesi','arrediSpostati','bottiglieLette','gatto','obiettiviRiscossi','sagra','mercante','trame','vicende','persona','visitati','collezione']){
    if(d[k]!==undefined) G[k]=d[k];
  }
  /* Salvataggi fatti quando la giornata era 180: i punti guadagnati coi
     livelli stavano dentro energiaMax e non c'era un campo per loro.
     Qui li ricaviamo, altrimenti chi ha una partita avviata si vedrebbe
     azzerare quello che si è sudato. Va fatto qui e non più tardi:
     G.statoIniziale() ha già messo energiaBonus a zero, quindi dopo non si
     distingue più «non ce l'aveva» da «era davvero zero». */
  if(d.energiaBonus === undefined && typeof d.energiaMax === 'number')
    G.energiaBonus = Math.max(0, d.energiaMax - 180);
  for(const id in G.costruzioni) if(G.costruzioni[id]) WORLD.costruisci(G.maps, id);
  if(d.maps){
    for(const k in d.maps) if(G.maps[k]) deserializzaMappa(G.maps[k], d.maps[k]);
  }
  /* Il terreno del bosco è appena tornato dal salvataggio, burrone
     compreso: se il salvataggio è di prima della correzione, il burrone
     è ancora quello corto e la radura resta aggirabile a piedi. Il
     burrone lo decidiamo noi, non il giocatore, quindi si ristampa. */
  WORLD.ristampaBurrone(G.maps.bosco, !!G.costruzioni.ponte);
  /* Stessa ragione, e stesso rimedio, per il porto e la costa: la
     Piazza del Porto ha preso l'insenatura con la banchina e le barche,
     la spiaggia le dune e le pozze di marea, e senza questo chi ha una
     partita avviata continuerebbe a vedere il lastricato vuoto e il
     deserto di sabbia. */
  WORLD.ristampaPorto(G.maps.piazza);
  WORLD.ristampaCosta(G.maps.spiaggia);
  G.p.look = G.look;
  G.p.px = d.px||8*T+16;
  G.p.py = d.py||10*T+16;
  G.normalizzaStato();                         // salvataggi vecchi/parziali resi validi
  return true;
}

})();
