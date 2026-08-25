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
  if(!G.trame.richiamo) G.trame.richiamo={bacheca:false,marea:{passo:0,risolta:false},barca:false};
  if(!G.trame.richiamo.marea) G.trame.richiamo.marea={passo:0,risolta:false};
  return G.trame.richiamo;
}
function vicenda(){
  return G.vicende && G.vicende.elio_barca;
}
function salva(){
  G.progresso();
  G.salva();
}
function testoAttivo(){
  const r=(window.VICENDE ? VICENDE.attive() : []).find(x=>x.id==='elio_barca');
  return r ? r.compito : 'Parla con Elio, al porto.';
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
      intro.textContent='La barca di Elio è in acqua. La prima rotta, Cala delle Reti, parte dal molo della Costa.';
      body.appendChild(intro);
      return;
    }
    intro.textContent='Progetto aperto — La barca che torna';
    body.appendChild(intro);
    const nota=document.createElement('p');
    nota.textContent=s.bacheca
      ? testoAttivo()
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
  if(id!=='barca') return;
  const s=stato();
  if(s.barca) return;
  s.barca=true;
  salva();
  UI.toast('La barca di Elio è pronta. Dal molo della Costa puoi raggiungere Cala delle Reti.','gold');
};

R.interagisciBarca = function(m,o){
  if(m.id==='cala' && o.ritorno==='spiaggia'){
    UI.modal('La barca', body=>{
      const p=document.createElement('p');
      p.textContent='La cala resta dietro, piccola e presente. La Costa è dall\'altra parte della breve traversata.';
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
    p.textContent='La prima rotta è breve: Cala delle Reti. Non è lontana, ma è un posto che ora si può raggiungere e da cui si può tornare.';
    body.appendChild(p);
    const b=document.createElement('button');
    b.className='btn gold'; b.textContent='Vai alla Cala delle Reti';
    b.onclick=()=>{ UI.chiudiModal(); G.viaggiaBarca('cala',14,16); };
    body.appendChild(b);
  });
  return true;
};
})();