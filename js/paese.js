/* ===================================================================
   FIORALBA — paese.js
   Quello che il paese propone da sé, giorno per giorno: il prodotto più
   richiesto di oggi, le sorprese della notte, la bacheca, le sagre di
   stagione e il mercante che passa ogni sette giorni.

   Sei sezioni che in game.js stavano già una in fila all'altra, e il
   filo che le tiene insieme è il calendario: c'è chi scatta ogni
   giorno, chi ogni notte, chi ogni sette giorni e chi una volta per
   stagione. Misurate prima di spostarle: 277 righe che di game.js non
   usavano NESSUNA funzione privata.

   Come per abitanti.js, le cinque funzioni che stavano su `G` ci
   tornano — le chiamano le finestre in ui.js, e `G.eGiornoDiSagra`
   anche l'agenda in abitanti.js, che il giorno della sagra si scavalca
   da sola — e ce le rimette game.js, perché questo file si carica prima
   e al caricamento `G` non esiste ancora.

   L'alias è `PS` e non `P`: `P` è già l'alias interno di palette.js, e
   due moduli che si chiamano allo stesso modo si leggono male anche
   stando in file diversi.
   =================================================================== */
(function(){

const PS = {};
window.PAESE = PS;

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
PS.completaRichiesta = function(r){
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
PS.eGiornoDiSagra = function(){
  return !!(G.sagra && !G.sagra.riscossa && G.giorno === (G.sagra.giorno||24)
            && G.sagra.stagione === G.stagione().id);
};

/* le posizioni in piazza, una per abitante */

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
    if(iPaese<0) paese.npc.push({ id:'serafina', x:19, y:21, ospite:true, giro:DATA.POSTI_SAGRA.serafina });
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
PS.sagraDisponibili = function(){
  if(!G.sagra) return 0;
  let n=0;
  for(const s of G.inv) if(s && sagraQualifica(s.id, G.sagra.stagione)) n+=s.n;
  return n;
};
/* versa nella sagra quanti più prodotti di stagione possibile */
PS.contribuisciSagra = function(){
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
PS.riscuotiSagra = function(){
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


/* Gli agganci col resto di game.js: chi gira a fine giornata
   (mercato, notte, bacheca, sagra, mercante), chi prepara la piazza il
   giorno della festa, e l'apertura della Locanda, che il mercante ha
   in comune con la porta. */
PS.scegliMercato = scegliMercato;
PS.tiraEventoNotte = tiraEventoNotte;
PS.aggiornaRichieste = aggiornaRichieste;
PS.creaSagra = creaSagra;
PS.aggiornaOspitiSagra = aggiornaOspitiSagra;
PS.stockMercante = stockMercante;
PS.apriLocanda = apriLocanda;

})();
