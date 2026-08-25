/* ===================================================================
   FIORALBA — richiamo.js
   Il primo progetto dopo la Lanterna: una barca piccola, una rotta breve
   e un enigma che chiede di osservare, non di indovinare.
   =================================================================== */
(function(){
'use strict';

const R = {};
window.RICHIAMO = R;

function dopoFinale(){
  return !!(G.trame && G.trame.veglia && G.trame.veglia.fatta);
}
function stato(){
  if(!G.trame.richiamo) G.trame.richiamo={bacheca:false,marea:{passo:0,risolta:false},barca:false,posta:false,approdo:false,progetti:{}};
  if(!G.trame.richiamo.marea) G.trame.richiamo.marea={passo:0,risolta:false};
  if(!G.trame.richiamo.progetti || typeof G.trame.richiamo.progetti!=='object')
    G.trame.richiamo.progetti={};
  return G.trame.richiamo;
}
function vicenda(){
  return G.vicende && G.vicende.elio_barca;
}
function salva(){
  G.progresso();
  G.salva();
}
function testoAttivo(id, ripiego){
  const r=(window.VICENDE ? VICENDE.attive() : []).find(x=>x.id===id);
  return r ? r.compito : ripiego;
}
function progettoStato(p){
  const s=stato(), v=G.vicende && G.vicende[p.vicenda];
  if(v && v.fatta) return 'finito';
  if(v) return 'attivo';
  const prima=Array.isArray(p.dopo) ? p.dopo : (p.dopo ? [p.dopo] : []);
  if(prima.some(id=>!(G.vicende && G.vicende[id] && G.vicende[id].fatta))) return 'chiuso';
  return 'pronto';
}
function appendProgetto(body, p){
  const statoProgetto=progettoStato(p);
  const box=document.createElement('section');
  box.className='richiamo-progetto';
  const titolo=document.createElement('h3');
  titolo.textContent=p.titolo;
  box.appendChild(titolo);
  const testo=document.createElement('p');
  testo.textContent=p.descrizione;
  box.appendChild(testo);

  const statoTesto=document.createElement('div');
  statoTesto.className='muted';
  if(statoProgetto==='finito') statoTesto.textContent='Rotta aperta e affidata al paese.';
  else if(statoProgetto==='attivo')
    statoTesto.textContent=testoAttivo(p.vicenda, 'Il progetto è già in cammino.');
  else if(statoProgetto==='chiuso') statoTesto.textContent='Prima termina il progetto indicato sopra.';
  else statoTesto.textContent='Pronto da segnare sulla bacheca.';
  box.appendChild(statoTesto);

  if(statoProgetto==='pronto'){
    const b=document.createElement('button');
    b.className='btn gold';
    b.textContent='Segna il progetto';
    b.onclick=()=>{
      if(!window.VICENDE || !VICENDE.avviaProgetto(p.vicenda)) return;
      salva();
      UI.chiudiModal();
      UI.toast('Progetto segnato: parla con chi lo ha proposto.','gold');
    };
    box.appendChild(b);
  }
  body.appendChild(box);
}

R.apriProgetti = function(){
  UI.modal('Bacheca dei progetti', body=>{
    const intro=document.createElement('div');
    intro.className='muted';
    if(!dopoFinale()){
      intro.textContent='Per ora raccoglie richieste del mercato. Dopo la veglia, il paese deciderà insieme da dove ripartire.';
      body.appendChild(intro);
      return;
    }
    const s=stato();
    if(s.barca){
      intro.textContent='La barca di Elio è in acqua. Le rotte restano brevi: un posto dove portare una parola, un approdo dove fermarsi, e sempre una strada per tornare.';
      body.appendChild(intro);
      const progetti=(window.DATA && DATA.PROGETTI_BARCA) || [];
      for(const p of progetti) appendProgetto(body,p);
      return;
    }
    intro.textContent='Progetto aperto — La barca che torna';
    body.appendChild(intro);
    const nota=document.createElement('p');
    nota.textContent=s.bacheca
      ? testoAttivo('elio_barca','Parla con Elio, al porto.')
      : 'Elio propone di rimettere in acqua la barca di suo padre: non per andare via, ma per riaprire piccole rotte utili a tutti.';
    body.appendChild(nota);
    if(!s.bacheca){
      const b=document.createElement('button');
      b.className='btn gold'; b.textContent='Segna il progetto';
      b.onclick=()=>{
        stato().bacheca=true;
        salva();
        UI.chiudiModal();
        UI.toast('Progetto segnato: parla con Elio al porto.','gold');
      };
      body.appendChild(b);
    }
  });
};

R.toccaMarea = function(o){
  if(!dopoFinale()){
    UI.toast('Le pietre sono lì da sempre. Oggi sembrano soltanto pietre.');
    return;
  }
  const v=vicenda();
  const passo=DATA.VICENDE.elio_barca.passi[v&&v.passo];
  if(!v || v.fatta || !window.VICENDE || !passo || passo.tipo!=='puzzle' || passo.puzzle!=='marea'){
    UI.toast('L\'acqua passa tra i segni e li rende lucidi.');
    return;
  }
  const s=stato().marea;
  /* Una partita salvata fra i tre segni e la chiusura del passo, oppure
     una versione che consentiva di toccarli troppo presto, non resta
     intrappolata: quando il passo giusto è aperto si può chiudere. */
  if(s.risolta){
    if(VICENDE.completa('elio_barca','marea')) salva();
    else UI.toast('La tavoletta della rotta è già al sicuro da Elio.');
    return;
  }
  if(G.ora<360 || G.ora>720){
    UI.toast('Con l\'acqua alta i segni si confondono. Serafina aveva detto di guardare al mattino.','hint');
    return;
  }
  if(o.ordine!==s.passo+1){
    s.passo=0;
    salva();
    UI.toast('L\'ordine si perde nel rumore dell\'acqua. Ricomincia dalla conchiglia, senza fretta.','hint');
    return;
  }
  s.passo++;
  if(s.passo<3){
    salva();
    UI.toast(s.passo===1 ? 'La conchiglia resta asciutta. Cerca la pietra chiara.' : 'La pietra chiara affiora. Resta il segno della rete.','gold');
    return;
  }
  if(VICENDE.completa('elio_barca','marea')){
    s.risolta=true;
    salva();
  }
};

R.sblocca = function(id){
  const s=stato();
  if(id==='barca'){
    if(s.barca) return;
    s.barca=true;
    salva();
    UI.toast('La barca di Elio è pronta. Dal molo della Costa puoi raggiungere Cala delle Reti.','gold');
    return;
  }
  if(id==='posta_cala'){
    if(s.posta) return;
    s.posta=true;
    salva();
    UI.toast('La cassetta della Cala è attiva: la bacheca può far viaggiare anche le parole.','gold');
    return;
  }
  if(id==='rotta_approdo'){
    if(s.approdo) return;
    s.approdo=true;
    salva();
    UI.toast('Nuova rotta aperta: dall’imbarcadero puoi raggiungere l’Approdo delle Erbe.','gold');
  }
};

R.consegnaRotta = function(o){
  if(!o || o.rotta!=='posta') return false;
  const v=G.vicende && G.vicende.marisol_posta_cala;
  const p=window.DATA && DATA.VICENDE.marisol_posta_cala &&
    DATA.VICENDE.marisol_posta_cala.passi[v&&v.passo];
  if(!v || v.fatta || !window.VICENDE || !p || p.tipo!=='puzzle' || p.puzzle!=='posta_cala'){
    UI.toast('La cassetta è pronta. Oggi non aspetta niente di urgente.');
    return true;
  }
  if(VICENDE.completa('marisol_posta_cala','posta_cala')) salva();
  return true;
};

R.battuta = function(npcId){
  const s=stato();
  if(npcId==='marisol' && s.posta) return [
    'C’è una lettera per la Cala sulla bacheca. Non serve correre: serve portarla fino in fondo.',
    'Da quando la cassetta è laggiù, le notizie fanno una strada corta e nessuno deve fingere che non importino.'
  ];
  if(npcId==='elio' && s.approdo) return [
    'L’Approdo delle Erbe è piccolo. È proprio il motivo per cui mi piace: non chiede di diventare un porto.',
    'Se passi dall’approdo e trovi erbe salate, Marisol ci farà qualcosa di buono. Le rotte migliori hanno sempre un ritorno.'
  ];
  return null;
};

R.interagisciBarca = function(m,o){
  if((m.id==='cala' || m.id==='approdo') && o.ritorno==='spiaggia'){
    UI.modal('La barca', body=>{
      const p=document.createElement('p');
      p.textContent=(m.id==='cala'
        ? 'La cala resta dietro, piccola e presente.'
        : 'L’approdo resta piccolo dietro alle rocce e alle erbe salate.')+
        ' La Costa è dall’altra parte della breve traversata.';
      body.appendChild(p);
      const b=document.createElement('button');
      b.className='btn'; b.textContent='Torna alla Costa';
      b.onclick=()=>{ UI.chiudiModal(); G.viaggiaBarca('spiaggia',22,25); };
      body.appendChild(b);
    });
    return true;
  }
  if(m.id!=='spiaggia' || o.viaggio!=='cala') return false;
  if(!dopoFinale()){
    UI.toast('È una barca tirata a secco. Elio la guarda spesso, ma non la tocca ancora.');
    return true;
  }
  if(!stato().barca){
    UI.toast('La barca aspetta il progetto della piazza. Elio sa da dove cominciare.','hint');
    return true;
  }
  UI.modal('Barca di Elio', body=>{
    const p=document.createElement('p');
    p.textContent='Le rotte sono brevi e servono a qualcosa. Scegli dove andare, poi torna quando vuoi.';
    body.appendChild(p);
    const rotte=[
      { id:'cala', nome:'Vai alla Cala delle Reti', testo:'La prima traversata, fra reti e bassa marea.', aperta:true, x:14, y:16 },
      { id:'approdo', nome:'Vai all’Approdo delle Erbe', testo:'Un piccolo ormeggio oltre la Cala.', aperta:stato().approdo, x:12, y:15 }
    ];
    for(const rotta of rotte){
      const b=document.createElement('button');
      b.className='btn'+(rotta.aperta?' gold':'');
      b.textContent=rotta.aperta ? rotta.nome : 'Rotta da aprire — Approdo delle Erbe';
      b.title=rotta.testo;
      b.disabled=!rotta.aperta;
      b.onclick=()=>{ UI.chiudiModal(); G.viaggiaBarca(rotta.id,rotta.x,rotta.y); };
      body.appendChild(b);
    }
  });
  return true;
};
})();