/* ===================================================================
   FIORALBA — vicende.js
   Le storie del paese: una faccenda a più passi per ogni abitante, che
   si apre a una certa altezza di cuori.

   Il contenuto sta tutto in `DATA.VICENDE`, qui c'è solo il motore. È
   fatto apposta al contrario delle tre catene dell'atto primo, che
   hanno ognuna la sua bandierina su `G` (`G.trame.torta`,
   `G.trame.pesceluna`) e il suo pezzo di codice in storie.js: quelle
   funzionano, ma per aggiungerne una quarta bisogna scrivere codice, e
   nessuna di loro compare nel Diario. Con sei abitanti e diciotto passi
   quella strada non stava in piedi.

   Lo stato è minimo: `G.vicende[id] = { passo, fatta }`, dove `passo` è
   l'indice del passo APERTO, quello che il giocatore deve ancora fare.
   Una vicenda che non c'è dentro non è mai cominciata — così una
   partita vecchia si ritrova tutte le storie da fare, e non serve
   nessuna migrazione.

   Carica prima di game.js, quindi non tocca `G` al caricamento: lo usa
   solo dentro alle funzioni.
   =================================================================== */
(function(){
'use strict';

const V = {};

const T = s => (window.LINGUA ? LINGUA.t(s) : s);
const F = (modello, ...pezzi) => window.LINGUA
  ? LINGUA.f(modello, ...pezzi)
  : modello.replace(/\{(\d+)\}/g, (_, i) => pezzi[i]);

/* --- lettura dello stato, con le difese in mezzo ---------------- */

function tabella(){ return (window.DATA && DATA.VICENDE) || {}; }
function disponibile(v){
  if(v.dopoFinale && !(G.trame && G.trame.veglia && G.trame.veglia.fatta)) return false;
  return !v.segue || !!(stato(v.segue) && stato(v.segue).fatta);
}

function stato(id){
  if(!G.vicende || typeof G.vicende!=='object') G.vicende = {};
  return G.vicende[id] || null;
}

/* Il passo aperto, o null se la vicenda è finita o non cominciata. */
function passoAperto(id){
  const v = tabella()[id], s = stato(id);
  if(!v || !s || s.fatta) return null;
  return v.passi[s.passo] || null;
}

V.cuori = function(npcId){ return Math.floor((G.amicizia[npcId]||0)/100); };

/* --- l'elenco degli ingredienti, scritto come lo legge il giocatore -- */

/* Ogni pezzo passa da `IT.nome`, che è già tradotto; il modello arriva
   da DATA e quindi è già tradotto anche lui. L'unica cosa che non deve
   sparire dalla traduzione è il segnaposto `{ing}` — c'è un controllo in
   tools/coerenza.js che lo verifica sull'italiano, e il catalogo inglese
   lo deve ricopiare uguale. */
/* `soloMancanti` conta quanto ne manca ANCORA, non quanto ne serve in
   tutto. Con cinque fibre su dodici in mano, «serve Fibra ×12» è vero e
   inutile: chi legge deve fare la sottrazione da solo, e la fa mentre
   sta davanti al pescatore. Adesso legge «Fibra ×7».

   Se non manca più niente l'elenco resterebbe vuoto, e la frase che lo
   contiene diventerebbe «Porta a Elio: » — quindi in quel caso si torna
   a dire la consegna intera, che è quello che sta per succedere. */
function elenco(ing, soloMancanti){
  const pezzi = [];
  for(const k in ing){
    const quanti = soloMancanti ? ing[k] - G.conta(k) : ing[k];
    if(quanti <= 0) continue;
    pezzi.push(IT.nome(k) + ' ×' + quanti);
  }
  if(!pezzi.length && soloMancanti) return elenco(ing, false);
  return pezzi.join(', ');
}
function conIngredienti(modello, ing, soloMancanti){
  return String(modello||'').replace('{ing}', elenco(ing, soloMancanti));
}

/* --- cosa si può dire a una persona -------------------------------- */

/* Le scelte da appendere al dialogo di un abitante: quella che apre una
   vicenda nuova, e quella che porta avanti quella già aperta. Non
   possono essercene due dello stesso tipo per la stessa persona, perché
   una vicenda per abitante è il patto. */
V.scelte = function(npcId){
  const fuori = [], tab = tabella();
  for(const id in tab){
    const v = tab[id];
    const s = stato(id);

    // mai cominciata: si offre se i cuori bastano
    if(!s){
      if(v.npc === npcId && disponibile(v) && V.cuori(npcId) >= (v.cuori||0))
        fuori.push({ testo:v.scelta, azione:()=>V.avanza(id) });
      continue;
    }
    if(s.fatta) continue;

    // già aperta: si porta avanti solo con chi tocca adesso
    const p = v.passi[s.passo];
    if(p && (p.tipo==='parla' || p.tipo==='porta') && p.npc === npcId)
      fuori.push({ testo:'▸ '+v.titolo, azione:()=>V.avanza(id) });
  }
  return fuori;
};

/* --- il passo avanti ----------------------------------------------- */

V.avanza = function(id){
  const v = tabella()[id];
  if(!v) return;
  let s = stato(id);
  if(!s){
    /* Comincia adesso. Si scrive lo stato PRIMA di eseguire il passo,
       altrimenti `chiudi()` non trova niente da far avanzare. */
    G.vicende[id] = s = { passo:0, fatta:false };
    UI.toast(F('Nuova storia: {0}.', v.titolo), 'gold');
  }
  if(s.fatta) return;
  const p = v.passi[s.passo];
  if(!p) return;

  if(p.tipo === 'porta'){
    const manca = Object.keys(p.ing).some(k => G.conta(k) < p.ing[k]);
    if(manca){
      /* Non è un fallimento e non deve suonare come tale: si dice cosa
         manca ANCORA, non l'elenco intero — chi ha già portato metà
         roba non vuole rileggersi la lista da capo. */
      /* Il ripiego è una frase intera e non il solo `{ing}`: `manca` è
         facoltativo, e una vicenda che se lo scorda direbbe al giocatore
         «Fibra ×7» e basta, senza verbo, come un'etichetta caduta lì. */
      UI.dialogo(p.npc, [ conIngredienti(p.manca || 'Ti manca ancora: {ing}', p.ing, true) ]);
      return;
    }
    for(const k in p.ing) G.togli(k, p.ing[k]);
  }

  chiudi(id, p);
};

/* I rompicapi non avanzano parlando con qualcuno: il luogo interessato
   chiama qui soltanto quando la soluzione è stata trovata. */
V.completa = function(id, puzzle){
  const p = passoAperto(id);
  if(!p || p.tipo!=='puzzle' || p.puzzle!==puzzle) return false;
  chiudi(id, p);
  return true;
};

/* Chiude il passo aperto: dice le sue righe, e passa al prossimo. */
function chiudi(id, p){
  const v = tabella()[id], s = stato(id);
  s.passo++;
  const finita = s.passo >= v.passi.length;
  if(finita) s.fatta = true;

  const righe = (p.righe || []).slice();
  if(p.tipo === 'luogo'){
    // nessuno con cui parlare: è un pensiero, e va nei messaggi
    for(const r of righe) UI.toast(r, 'gold');
  } else {
    UI.dialogo(p.npc, righe, finita ? { fine:()=>paga(id) } : undefined);
  }
  if(finita && p.tipo === 'luogo') paga(id);
  if(!finita) G.progresso();
}

/* Il premio. Mai solo monete: a metà partita le monete non dicono più
   niente, e una storia che finisce con un bonifico non finisce. */
function paga(id){
  const v = tabella()[id];
  const P = v.premio || {};
  if(v.sblocco && window.RICHIAMO) RICHIAMO.sblocca(v.sblocco);
  if(P.oro){ G.oro += P.oro; G.stats.guadagno += P.oro; }
  if(P.amicizia) G.amicizia[v.npc] = Math.max(0, (G.amicizia[v.npc]||0) + P.amicizia);

  let sospeso = false;
  if(P.item && P.qta){
    /* Lo zaino pieno è il caso normale, non quello raro: si finisce una
       storia tornando dal paese carichi. L'oggetto non si perde, aspetta
       nella scheda delle abilità come i premi di livello. */
    if(G.puoiAggiungere(P.item, P.qta)) G.aggiungi(P.item, P.qta);
    else { G.premiSospesi.push({ item:P.item, n:P.qta, da:'storia', liv:0 }); sospeso = true; }
  }
  G.stats.vicende = (G.stats.vicende||0) + 1;
  SND.play('livello');
  UI.toast(F('Storia finita: {0}.', v.titolo), 'gold', P.item || undefined);
  if(sospeso) UI.toast(T('Lo zaino era pieno: il regalo ti aspetta nella scheda delle abilità.'));
  G.progresso();
}

/* --- il passo «fatti vedere in un posto» ---------------------------- */

/* Lo chiama `cambiaMappa`, e anche il viaggio rapido: ci si arriva in
   tutti e due i modi e un passo che si chiude solo camminando sarebbe
   una trappola per chi usa la mappa. */
V.visita = function(mappaId){
  for(const id in tabella()){
    const p = passoAperto(id);
    if(p && p.tipo==='luogo' && p.dove===mappaId){
      /* Dopo il cambio mappa arriva già il toast col nome del posto:
         mezzo secondo di distacco, o le due righe si accavallano e
         quella della storia sembra parte del nome del luogo. */
      setTimeout(()=>{ try{ V.avanza(id); }catch(e){ console.warn('[vicende]', e); } }, 700);
      return;
    }
  }
};

/* --- quello che si legge nel Diario --------------------------------- */

/* Una riga per ogni storia aperta, col compito di adesso. È la ragione
   per cui questo modulo esiste: le catene dell'atto primo non hanno un
   posto dove dire «sei a metà di questa cosa qui». */
V.attive = function(){
  const fuori = [], tab = tabella();
  for(const id in tab){
    const p = passoAperto(id);
    if(!p) continue;
    const v = tab[id];
    let compito = p.compito || '';
    /* `pronto` è la roba già tutta nello zaino: senza, il Diario dice
       «Porta a Elio: Fibra ×12» identico prima e dopo averla raccolta, e
       chi ce l'ha già non sa che deve solo andarci. */
    let pronto = false;
    if(p.tipo==='porta'){
      compito = conIngredienti(compito, p.ing, true);
      pronto = Object.keys(p.ing).every(k => G.conta(k) >= p.ing[k]);
    }
    fuori.push({ id, titolo:v.titolo, npc:v.npc, compito, pronto,
                 passo:stato(id).passo + 1, quanti:v.passi.length });
  }
  return fuori;
};

/* Le finite, per il Diario e per chi tiene il conto. */
V.finite = function(){
  const fuori = [], tab = tabella();
  for(const id in tab) if(stato(id) && stato(id).fatta) fuori.push({ id, titolo:tab[id].titolo, npc:tab[id].npc });
  return fuori;
};

/* Quelle che aspettano solo più cuori: si mostrano nel Diario senza
   svelare cosa sono, perché sapere che una persona ha una storia è
   metà del motivo per portarle dei regali. */
V.inAttesa = function(){
  const fuori = [], tab = tabella();
  for(const id in tab){
    if(stato(id)) continue;
    const v = tab[id];
    if(disponibile(v) && V.cuori(v.npc) < (v.cuori||0)) fuori.push({ id, npc:v.npc, cuori:v.cuori });
  }
  return fuori;
};

/* Pronte da cominciare: i cuori ci sono, basta andare a parlarci. */
V.pronte = function(){
  const fuori = [], tab = tabella();
  for(const id in tab){
    if(stato(id)) continue;
    const v = tab[id];
    if(disponibile(v) && V.cuori(v.npc) >= (v.cuori||0)) fuori.push({ id, npc:v.npc, titolo:v.titolo });
  }
  return fuori;
};

window.VICENDE = V;
})();
