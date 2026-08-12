/* ===================================================================
   FIORALBA — salvataggio.js
   La partita che va e torna dal localStorage: serializzazione delle
   mappe, backup del salvataggio precedente, esportazione e importazione
   in .json, validazione di quello che arriva da fuori.

   Stava in game.js. Ne è uscita perché è il pezzo che si può leggere da
   solo: misurato, di tutto game.js gli servivano due funzioni —
   `statoIniziale` e `normalizzaStato` — e ne rientravano due,
   `grezzo()` e `carica()`. Quattro fili in tutto, per 270 righe che
   nessuno vuole rileggere mentre cerca un bug della pesca.

   I quattro metodi che il menu chiama — salva, esporta, importaTesto,
   importaDaFile — stavano appesi a `G`, e lì restano: è game.js a
   riappenderli, perché questo file si carica prima che `G` esista.
   =================================================================== */
(function(){

const T = 32;

const S = {};
window.SALVA = S;

const CHIAVE='fioralba_save_v1';
const CHIAVE_BAK='fioralba_save_bak';

function serializzaMappa(m){
  const obj={}, suolo={};
  for(let i=0;i<m.obj.length;i++){
    const o=m.obj[i];
    if(!o || o.t==='muro' || o.t==='porta') continue;
    obj[i]=o;
  }
  for(let i=0;i<m.suolo.length;i++) if(m.suolo[i]) suolo[i]=m.suolo[i];
  // w e h servono a chi rilegge: senza, non si può sapere se gli indici
  // salvati parlano ancora della stessa mappa
  return { w:m.w, h:m.h, g:Array.from(m.g), obj, suolo, deco:m.deco.length };
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
    return;
  }

  if(d.g && d.g.length===m.g.length) m.g = Uint8Array.from(d.g);
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
    richieste:G.richieste, richiestaSeq:G.richiestaSeq, premiSospesi:G.premiSospesi,
    obiettiviRiscossi:G.obiettiviRiscossi, sagra:G.sagra, mercante:G.mercante, trame:G.trame, visitati:G.visitati, collezione:G.collezione,
    px:G.p.px, py:G.p.py,
    maps:(function(){ const o={}; for(const k in G.maps) o[k]=serializzaMappa(G.maps[k]); return o; })()
  };
}

S.salva = function(){
  let testo;
  // serializza a parte: se fallisce, NON tocchiamo il salvataggio esistente
  try{ testo = JSON.stringify(costruisciDati()); }
  catch(e){ console.warn('Serializzazione salvataggio fallita', e); return false; }
  try{
    const prec = localStorage.getItem(CHIAVE);
    if(prec) localStorage.setItem(CHIAVE_BAK, prec);   // backup del precedente buono
    localStorage.setItem(CHIAVE, testo);
    return true;
  }catch(e){ console.warn('Salvataggio non riuscito', e); return false; }
};

/* ---- Esporta il salvataggio come file .json scaricabile ----

   Esporta LA PARTITA GIUSTA per il momento in cui viene chiamata.
   Serializzava sempre `G`, e da lì è uscito un file di 31 byte con
   «announdefined» nel nome: dalla landing, «Nuova Partita» con una
   partita salvata apre l'avviso che consiglia di esportare prima — ma a
   quel punto la partita sta solo nel localStorage, e `G` è ancora ai
   valori di avvio. La finestra mostrava i dati veri, letti dal
   salvataggio, e il bottone accanto esportava il vuoto.

   Quindi: in gioco si esporta lo stato vivo, fuori dal gioco si esporta
   il salvataggio scritto — che è esattamente quello che l'avviso
   promette di mettere in salvo. E in ogni caso il file passa dalla
   stessa validazione dell'import: un file che non riusciremmo a
   rileggere non deve neanche partire. ---- */
S.esporta = function(){
  try{
    let testo, d;
    if(G.inGioco){
      d = costruisciDati();
      testo = JSON.stringify(d);
    } else {
      testo = caricaGrezzo();
      if(!testo){ flashMessaggio('Non c\'è nessuna partita da esportare.', false); return false; }
      d = JSON.parse(testo);
    }
    const err = validaSalvataggio(d);
    if(err){
      console.warn('Export rifiutato:', err);
      flashMessaggio('Questo salvataggio è incompleto, meglio non esportarlo: ' + err, false);
      return false;
    }
    const blob = new Blob([testo], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const nome = (d.nomeGiocatore||'contadino').replace(/[^a-z0-9]/gi,'_');
    const data = new Date().toISOString().slice(0,10);
    a.href = url;
    a.download = `fioralba-${nome}-anno${d.anno||1}-${data}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 1500);
    return true;
  }catch(e){ console.warn('Export non riuscito', e); return false; }
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
    if(m.obj!==undefined && (typeof m.obj!=='object' || Array.isArray(m.obj))) return 'La mappa «'+k+'» ha oggetti non validi.';
    if(m.suolo!==undefined && (typeof m.suolo!=='object' || Array.isArray(m.suolo))) return 'La mappa «'+k+'» ha un terreno coltivato non valido.';
  }
  for(const [k,tipo] of [['oro','number'],['giorno','number'],['stagioneIdx','number'],['anno','number']]){
    if(d[k]!==undefined && typeof d[k]!==tipo) return 'Il campo «'+k+'» nel salvataggio non è valido.';
  }
  if(d.stagioneIdx!==undefined && (d.stagioneIdx<0 || d.stagioneIdx>3)) return 'La stagione nel salvataggio non esiste.';
  return null;
}

S.importaTesto = function(testo){
  let d;
  try{ d = JSON.parse(testo); }
  catch(e){ return {ok:false, err:'Il file non è leggibile: non è un salvataggio valido.'}; }
  const err = validaSalvataggio(d);
  if(err) return {ok:false, err};
  try{ localStorage.setItem(CHIAVE, JSON.stringify(d)); }
  catch(e){ return {ok:false, err:'Impossibile memorizzare il salvataggio (memoria locale bloccata).'}; }
  return {ok:true};
};

/* ---- Apre il selettore file e importa; al successo ricarica ---- */
S.importaDaFile = function(){
  const inp = document.createElement('input');
  inp.type='file'; inp.accept='.json,application/json';
  inp.style.display='none';
  inp.onchange = ()=>{
    const file = inp.files && inp.files[0];
    if(!file){ inp.remove(); return; }
    const rd = new FileReader();
    rd.onload = ()=>{
      const res = S.importaTesto(String(rd.result||''));
      if(res.ok){
        flashMessaggio('Salvataggio importato! Riavvio…', true);
        try{ sessionStorage.setItem('fioralba_import','1'); }catch(e){}
        setTimeout(()=>location.reload(), 800);
      }else{
        flashMessaggio(res.err||'Import non riuscito.', false);
      }
      inp.remove();
    };
    rd.onerror = ()=>{ flashMessaggio('Non riesco a leggere il file.', false); inp.remove(); };
    rd.readAsText(file);
  };
  document.body.appendChild(inp);
  inp.click();
};

/* ---- Messaggio a comparsa indipendente dall'HUD (funziona anche al titolo) ---- */
function flashMessaggio(testo, ok){
  const el = document.createElement('div');
  el.textContent = testo;
  el.style.cssText =
    'position:fixed;left:50%;top:22px;transform:translateX(-50%);z-index:100000;'+
    'background:'+(ok?'rgba(79,122,66,.96)':'rgba(179,72,60,.96)')+';color:#f6e6c8;'+
    'font-family:Nunito,system-ui,sans-serif;font-weight:800;font-size:15px;'+
    'padding:12px 20px;border-radius:12px;border:2px solid rgba(0,0,0,.35);'+
    'box-shadow:0 6px 18px rgba(0,0,0,.45);max-width:90vw;text-align:center;';
  document.body.appendChild(el);
  setTimeout(()=>{ el.style.transition='opacity .4s'; el.style.opacity='0'; setTimeout(()=>el.remove(),450); }, 2400);
}

function caricaGrezzo(){
  try{ return localStorage.getItem(CHIAVE) || localStorage.getItem(CHIAVE_BAK); }catch(e){ return null; }
}

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
                  'richieste','richiestaSeq','premiSospesi','obiettiviRiscossi','sagra','mercante','trame','visitati','collezione']){
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
  WORLD.ristampaBurrone(G.maps.bosco);
  G.p.look = G.look;
  G.p.px = d.px||8*T+16;
  G.p.py = d.py||10*T+16;
  G.normalizzaStato();                         // salvataggi vecchi/parziali resi validi
  return true;
}

function carica(){
  let raw=null;
  try{ raw = localStorage.getItem(CHIAVE); }catch(e){}
  try{ if(raw && applicaSalvataggio(raw)) return true; }
  catch(e){ console.warn('Salvataggio principale illeggibile, provo il backup.', e); }
  // fallback sul backup
  let bak=null;
  try{ bak = localStorage.getItem(CHIAVE_BAK); }catch(e){}
  try{
    if(bak && applicaSalvataggio(bak)){
      if(window.UI) UI.toast('Salvataggio principale corrotto: ripristinato il backup.','bad');
      return true;
    }
  }catch(e){ console.warn('Anche il backup è illeggibile.', e); }
  return false;
}

S.grezzo = caricaGrezzo;
S.carica = carica;

})();
