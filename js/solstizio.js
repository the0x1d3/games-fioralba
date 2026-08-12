/* ===================================================================
   FIORALBA — solstizio.js
   ATTO SECONDO — LA NOTTE DEL SOLSTIZIO

   Fino alla prima parte la storia finiva con le quattro braci e un
   riquadro di testo. E in tutta la prima parte nessuno diceva *perché*
   la Lanterna si fosse spenta: il buco stava in mezzo alla trama fin
   dall'inizio, e Fiammella lo diceva senza accorgersene — «Ilde lo
   faceva. Poi ha smesso di riuscirci».

   Sei testimonianze da sei abitanti, una verità che nessuna di loro
   contiene da sola, e poi una veglia: la Lanterna non si tiene accesa da
   soli. È l'errore che Ilde ha fatto per quarant'anni e ha pagato per
   dodici.

   Era in game.js. Gli servono due funzioni di là, `G.finale` e
   `G.rinfrescaHotbar`. Due cose che stavano scritte qui sono invece
   rimaste dov'erano usate: `FASCE_VEGLIA` — una memo che serve solo a
   `G.fasciaAgenda`, ed è la gemella di `FASCE_SAGRA` che le sta a due
   righe — e il riferimento ai posti nell'agenda, che era solo un alias
   di `DATA.POSTI_VEGLIA` e adesso lo dice.
   =================================================================== */
(function(){

const V = {};
window.SOLSTIZIO = V;

function veglia(){ return G.trame.veglia; }

const memorieAvute = function(){
  const v = veglia();
  return DATA.MEMORIE.filter(m => v.memorie[m.id]).length;
};
const invitatiAllaVeglia = function(){
  const v = veglia();
  return DATA.MEMORIE.filter(m => v.invitati[m.npc]).length;
};

/* Quella persona ha una testimonianza da dare, adesso? */
function memoriaDi(npcId){
  const v = veglia();
  if(!v.avviata || v.verita) return null;
  const M = DATA.MEMORIE.find(m => m.npc === npcId);
  if(!M || v.memorie[M.id]) return null;
  return M;
}

function raccontaMemoria(npcId){
  const M = memoriaDi(npcId);
  if(!M) return;
  const cuori = Math.floor((G.amicizia[npcId]||0)/100);
  if(cuori < M.cuori){
    UI.dialogo(npcId, [
      'Di quella notte non mi va di parlare.',
      'Non con chiunque, almeno. Torna quando ci conosciamo meglio.'
    ]);
    UI.toast('Serve più confidenza: ' + M.cuori + ' cuori con ' + DATA.NPCS[npcId].nome + '.','hint');
    return;
  }
  veglia().memorie[M.id] = true;
  UI.dialogo(npcId, M.testo, { fine:()=>{
    if(M.dona && G.puoiAggiungere(M.dona,1)){
      G.aggiungi(M.dona,1);
      UI.toast('Ricevuto: ' + IT.nome(M.dona),'gold',M.dona);
    }
    const n = memorieAvute();
    SND.play('regalo');
    UI.toast('Memoria raccolta (' + n + '/' + DATA.MEMORIE.length + '): ' + M.titolo,'gold');
    G.progresso();
    if(n >= DATA.MEMORIE.length) setTimeout(laVerita, 900);
  }});
}

/* Quando ci sono tutte e sei, i pezzi si incastrano — e non li incastra
   Fiammella, che quella notte era la fiamma e si è spenta con lei: si
   incastrano in testa a chi ha ascoltato. */
function laVerita(){
  const v = veglia();
  if(v.verita) return;
  v.verita = true;
  G.lettere.verita = true;
  SND.play('magia');
  UI.dialogo('fiammella', [
    'Lo sai. Te lo leggo addosso.',
    'Io no. Io quella notte ero la fiamma: quando le mani si sono chiuse sono finita anch\'io, e di quello che è successo dopo non ho niente.',
    'Dodici anni a chiedermi cosa avevo fatto di male.',
    '...',
    'Niente. Non avevo fatto niente. È stata la brutta notte di una donna sola, ed è bastata.',
    'C\'era una lettera nel cassetto della cucina, sotto la carta. Serafina l\'ha tenuta lì tutto questo tempo. Leggila.'
  ], { fine:()=>setTimeout(()=>UI.lettera('verita', ()=>{
    UI.dialogo('fiammella', [
      'Ha scritto «chiama gente». Dodici anni per due parole.',
      'Ma ha ragione, e adesso lo so anch\'io: questa lanterna l\'ha tenuta accesa una persona sola per quarant\'anni, e si è spenta la prima notte che quella persona non ce l\'ha fatta.',
      'Non voglio che si spenga la prima notte che non ce la fai tu.',
      'Vai a chiamarli. Tutti e sei. Di\' che li aspetto qui.',
      'E se qualcuno ti chiede perché — digli che è per Ilde. Funziona.'
    ], { fine:()=>{
      UI.toast('Invita i sei abitanti alla veglia al Santuario.','gold');
      G.progresso();
    }});
  }), 500) });
}

/* --- gli inviti --- */
function puoiInvitare(npcId){
  const v = veglia();
  return v.verita && !v.fatta && !v.giorno && !v.invitati[npcId] &&
         DATA.MEMORIE.some(m => m.npc === npcId);
}

const RISPOSTE_INVITO = {
  bruno:    ['Al santuario? Io la sera chiudo.', '...', 'Chiudo prima. Vengo. E porto il registro: quella riga la chiudiamo lì.'],
  marisol:  ['Me lo stavo chiedendo se qualcuno l\'avrebbe mai fatto.',
             'Cucino io. Non si fa una veglia a stomaco vuoto, non mi importa cosa dice la tradizione.'],
  elio:     ['Dodici anni che mi dico che avrei dovuto remare fino a riva.', 'Vengo a piedi, stavolta. Ci arrivo prima.'],
  tobia:    ['Sì.', '...', 'Scusa, non mi viene altro. Sì.'],
  eremita:  ['Io scendo dal Passo due volte l\'anno, e una è per la sagra.', 'Questa vale come l\'altra. Ci sono.'],
  serafina: ['Sono salita a quel santuario una volta sola in dodici anni, e ci sono salita per spegnerlo.',
             '...',
             'Va bene. Salgo di nuovo. Ma stavolta cammini avanti tu.']
};

function invitaAllaVeglia(npcId){
  const v = veglia();
  if(!puoiInvitare(npcId)) return;
  v.invitati[npcId] = true;
  UI.dialogo(npcId, RISPOSTE_INVITO[npcId] || ['Ci sono.'], { fine:()=>{
    const n = invitatiAllaVeglia(), tot = DATA.MEMORIE.length;
    SND.play('regalo');
    if(n < tot){ UI.toast('Hanno detto di sì in ' + n + ' su ' + tot + '.','gold'); G.progresso(); return; }
    /* Ci sono tutti: la veglia è domani sera. Non stasera — a una cosa
       così la gente ci si prepara, e il giocatore deve poterci arrivare
       apposta invece di trovarsela addosso mentre fa altro. */
    v.giorno = G.giornoTot + 1;
    UI.toast('Ci sono tutti. La veglia è domani sera al Santuario, dal tramonto.','gold');
    G.progresso();
  }});
}

/* La sera della veglia i sei stanno alla radura e non alle loro
   faccende: stessa scorciatoia della sagra, che per un giorno scavalca
   l'agenda. */
const POSTI_VEGLIA = DATA.POSTI_VEGLIA;

const eSeraDiVeglia = function(){
  const v = veglia();
  return !!(v.giorno && G.giornoTot === v.giorno && !v.fatta);
};

let daPrimaDellaVeglia = {};
function aggiornaOspitiVeglia(){
  const bosco = G.maps.bosco;
  if(!bosco) return;
  const attiva = eSeraDiVeglia();
  for(const id in POSTI_VEGLIA){
    const i = bosco.npc.findIndex(n => n.id===id && n.veglia);
    if(attiva && i < 0){
      // Serafina nel bosco ci vive già: va tolta, o si sdoppia
      const j = bosco.npc.findIndex(n => n.id===id && !n.veglia);
      if(j >= 0){ daPrimaDellaVeglia[id] = bosco.npc[j]; bosco.npc.splice(j,1); }
      bosco.npc.push({ id, x:POSTI_VEGLIA[id][0][0], y:POSTI_VEGLIA[id][0][1],
                       veglia:true, giro:POSTI_VEGLIA[id] });
    } else if(!attiva && i >= 0){
      bosco.npc.splice(i,1);
      if(daPrimaDellaVeglia[id]){ bosco.npc.push(daPrimaDellaVeglia[id]); delete daPrimaDellaVeglia[id]; }
    }
  }
}

/* La quarta brace non chiude più niente: rimanda a Fiammella, che ha
   una domanda vecchia di dodici anni da fare. */
function invitoAttoSecondo(){
  if(veglia().avviata) return;
  setTimeout(()=>UI.toast('La Lanterna è accesa, ma non tiene. Fiammella ha qualcosa da dirti.','gold'), 1200);
}

function laVeglia(){
  const v = veglia();
  if(v.fatta) return;
  v.fatta = true;
  SND.play('magia');
  UI.dialogo('fiammella', [
    'Sono venuti tutti e sei. Non era mai successo, nemmeno quando era accesa.',
    'Bruno ha appoggiato un quaderno sulla pietra e ha strappato una pagina.',
    'Tobia ha cambiato il gancio senza chiedere il permesso a nessuno. Dice che quello vecchio era storto — lo diceva anche dodici anni fa.',
    'Serafina è arrivata per ultima e si è fermata dove si era fermata quella notte. Poi ha fatto altri due passi.',
    'Accendila tu. Io non sono la Lanterna: sono solo quello che resta quando si spegne.',
    'E stasera non serve che resti niente.'
  ], { fine:()=>{
    G.lettere.veglia = true;
    G.finale();
  }});
}

function apriSantuario(){
  const v = G.trame.veglia;
  // la sera della veglia, al santuario non si consegna: si fa la veglia
  if(eSeraDiVeglia() && G.ora >= 1020){ laVeglia(); return; }

  if(G.braci>=4){
    if(!v.avviata){
      v.avviata = true;
      UI.dialogo('fiammella', [
        'È accesa. Quattro braci, quattro nicchie, e la valle si è ricordata.',
        '...',
        'Solo che non tiene.',
        'Guarda: fa quella cosa lì. Si abbassa e risale. Da accesa vera non lo faceva.',
        'Manca qualcosa, e la cosa peggiore è che non so cosa — perché non ho mai saputo nemmeno perché si sia spenta.',
        'Ero io la fiamma. Quando è finita sono finita anch\'io, e di quella notte non ho niente: né prima né dopo.',
        'Ma la valle sì. La valle era sveglia, e sei persone quella notte erano da qualche parte a guardare.',
        'Vai a chiedere. A tutti e sei. Poi torna e dimmi cosa hai capito.'
      ], { fine:()=>{
        UI.toast('Nuova storia: la notte del solstizio. Parla con i sei abitanti.','gold');
        G.progresso();
      }});
      return;
    }
    if(!v.verita){
      UI.dialogo('fiammella', ['Sei a ' + memorieAvute() + ' su ' + DATA.MEMORIE.length +
        '. Vai avanti: quando ci sono tutte capisci da solo.']);
      return;
    }
    if(!v.fatta && !v.giorno){
      UI.dialogo('fiammella', ['Ne mancano ' +
        (DATA.MEMORIE.length - invitatiAllaVeglia()) + '. Vai a chiamarli: non comincio senza.']);
      return;
    }
    if(!v.fatta){
      UI.dialogo('fiammella', eSeraDiVeglia()
        ? ['Stasera. Dal tramonto in poi: torna quando cala il sole.']
        : ['È domani sera. Dormici sopra, che ti serve la giornata intera.']);
      return;
    }
    UI.santuario(G); return;
  }
  if(!G.vistoFiammella){
    G.vistoFiammella = true;
    UI.dialogo('fiammella', [
      'Oh. Sei venuto davvero.',
      'Dodici inverni che questa lanterna è spenta. Cominciavo a credere di essermela sognata, la luce.',
      'Non posso riaccenderla da sola. Serve che qualcuno raccolga la valle e me la porti qui, un pezzo per stagione.',
      'Ilde lo faceva. Poi ha smesso di riuscirci.',
      'Quattro braci. Quattro nicchie. Prenditi il tempo che ti serve: io non vado da nessuna parte.'
    ], { fine:()=>UI.santuario(G) });
  } else {
    UI.santuario(G);
  }
}

function apriConsegna(){
  UI.modal('Cassa di consegna', body=>{
    const n=document.createElement('div'); n.className='muted'; n.style.marginBottom='12px';
    n.textContent='Quello che lasci qui viene ritirato durante la notte e pagato all\'alba.';
    body.appendChild(n);

    if(G.cassaConsegna.length){
      const t=document.createElement('div'); t.className='sectitle'; t.textContent='In attesa di ritiro';
      body.appendChild(t);
      let tot=0;
      for(const s of G.cassaConsegna){ tot += G.prezzoVendita(s.id)*s.n; }
      const g=document.createElement('div'); g.className='invgrid';
      G.cassaConsegna.forEach((s,k)=>{
        const c=document.createElement('div'); c.className='icell';
        c.appendChild(UI.ico(s.id));
        if(s.n>1){const q=document.createElement('span');q.className='qty';q.textContent=s.n;c.appendChild(q);}
        c.title='Riprendi '+IT.nome(s.id);
        c.onclick=()=>{
          if(!G.puoiAggiungere(s.id,s.n)) { UI.toast('Zaino pieno.','bad'); return; }
          G.aggiungi(s.id,s.n); G.cassaConsegna.splice(k,1); SND.play('prendi'); UI.aggiorna();
        };
        g.appendChild(c);
      });
      body.appendChild(g);
      const tt=document.createElement('div');
      tt.style.cssText='text-align:right;font-weight:800;color:#c9922b;margin-top:8px;font-size:15px';
      tt.textContent='Stima: '+tot+' monete';
      body.appendChild(tt);
    }

    const t2=document.createElement('div'); t2.className='sectitle'; t2.textContent='Nello zaino';
    body.appendChild(t2);
    const g2=document.createElement('div'); g2.className='invgrid';
    let n2=0;
    for(let i=0;i<G.invMax;i++){
      const s=G.inv[i];
      if(!s) continue;
      const c=IT.cat(s.id);
      if(c==='attrezzo'||c==='speciale') continue;
      if(!IT.prezzo(s.id)) continue;
      n2++;
      const cell=document.createElement('div'); cell.className='icell';
      cell.appendChild(UI.ico(s.id));
      if(s.n>1){const q=document.createElement('span');q.className='qty';q.textContent=s.n;cell.appendChild(q);}
      cell.title='Consegna '+IT.nome(s.id)+' ('+G.prezzoVendita(s.id)+' l\'uno)';
      cell.onclick=()=>{
        const ex = G.cassaConsegna.find(x=>x.id===s.id);
        if(ex) ex.n += s.n; else G.cassaConsegna.push({id:s.id, n:s.n});
        G.inv[i]=null; G.rinfrescaHotbar(); SND.play('prendi'); UI.aggiorna();
      };
      g2.appendChild(cell);
    }
    body.appendChild(g2);
    if(!n2){
      const e=document.createElement('div'); e.className='muted'; e.textContent='Niente da consegnare.';
      body.appendChild(e);
    } else {
      const b=document.createElement('button'); b.className='btn gold'; b.style.marginTop='10px';
      b.textContent='Consegna tutto il raccolto';
      b.onclick=()=>{
        for(let i=0;i<G.invMax;i++){
          const s=G.inv[i];
          if(!s) continue;
          const c=IT.cat(s.id);
          if(c!=='raccolto'&&c!=='foraggio'&&c!=='pesce'&&c!=='artigianato') continue;
          const ex=G.cassaConsegna.find(x=>x.id===s.id);
          if(ex) ex.n+=s.n; else G.cassaConsegna.push({id:s.id,n:s.n});
          G.inv[i]=null;
        }
        G.rinfrescaHotbar(); SND.play('prendi'); UI.aggiorna();
      };
      body.appendChild(b);
    }
  });
}

/* le testimonianze e l'invito, dal listino delle scelte di dialogo */
V.memoriaDi        = memoriaDi;
V.raccontaMemoria  = raccontaMemoria;
V.puoiInvitare     = puoiInvitare;
V.invitaAllaVeglia = invitaAllaVeglia;

/* le porte del santuario */
V.apriSantuario = apriSantuario;
V.apriConsegna  = apriConsegna;

/* la sera della veglia */
V.eSeraDiVeglia        = eSeraDiVeglia;
V.aggiornaOspitiVeglia = aggiornaOspitiVeglia;
V.invitoAttoSecondo    = invitoAttoSecondo;

/* il conto, per il diario e per Fiammella */
V.memorieAvute       = memorieAvute;
V.invitatiAllaVeglia = invitatiAllaVeglia;

})();
