/* ===================================================================
   FIORALBA — tutorial.js
   Guida interattiva delle prime azioni. Non blocca il gioco: mostra
   un cartello, evidenzia il pulsante giusto e avanza quando fai la
   cosa richiesta.
   =================================================================== */
(function(){
'use strict';

const TUT = {};
window.TUT = TUT;

const $ = s=>document.querySelector(s);

/* ------------------------------------------------------------------
   I PASSI
   cond:
     'muovi'   -> avanza dopo un po' di cammino (soglia = frame di moto)
     'slotId'  -> avanza quando l'oggetto selezionato ha quell'id
     'slotCat' -> ...quando appartiene a quella categoria
     'evento'  -> avanza quando arriva la notifica di quell'evento
     'ok'      -> avanza col pulsante Continua
   glow: selettore CSS o funzione()->elemento da far pulsare
   ------------------------------------------------------------------ */
const PASSI = [
  { id:'benvenuto', titolo:'Benvenuto a Fioralba',
    testo:'Questo è il podere di tua nonna. Prima cosa: fai due passi. Muoviti con <b>WASD</b> o le <b>frecce</b>.',
    cond:'muovi', soglia:55 },

  { id:'zappa', titolo:'Dissoda la terra',
    testo:'Hai già la <b>Zappa</b> in mano. Avvicinati a un pezzo d\'erba libero: la casella davanti a te si illumina. Premi <b>Spazio</b> (o clic) per zapparla.',
    glow:'#hotbar .slot:nth-child(1)',
    cond:'evento', evento:'zappa' },

  { id:'selSeme', titolo:'Ora i semi',
    testo:'Bravo! Adesso scegli i <b>Semi di Rapa</b> nella barra.',
    glow:()=>slotDi('seme'),
    cond:'slotCat', valore:'seme' },

  { id:'semina', titolo:'Semina',
    testo:'Mettiti sopra o accanto alla terra dissodata e premi di nuovo <b>Spazio</b> per piantare.',
    cond:'evento', evento:'semina' },

  { id:'selAnn', titolo:'Serve acqua',
    testo:'Le piantine hanno sete. Scegli l\'<b>Annaffiatoio</b> (tasto <b>2</b>).',
    glow:'#hotbar .slot:nth-child(2)',
    cond:'slotId', valore:'annaffiatoio' },

  { id:'annaffia', titolo:'Dai da bere',
    testo:'Bagna la terra dove hai seminato con <b>Spazio</b>. Da domani cresceranno un po\' ogni notte.',
    cond:'evento', evento:'annaffia' },

  { id:'fine', titolo:'Sei pronto',
    testo:'Ottimo lavoro! Quando sei stanco torna a <b>casa</b> e vai a letto: la notte fa crescere le piante.<br>'+
          'Poi metti il raccolto nella <b>cassa di consegna</b> per venderlo, parla con gli <b>abitanti</b>, esplora il <b>bosco</b> — e un giorno riaccendi la <b>Lanterna</b>.',
    cond:'ok' }
];

/* trova la casella della barra (1..9) che contiene un oggetto di quella categoria */
function slotDi(cat){
  for(let i=0;i<9;i++){
    const s = window.G && G.inv[i];
    if(s && IT.cat(s.id)===cat){
      return document.querySelector('#hotbar .slot:nth-child('+(i+1)+')');
    }
  }
  return null;
}

/* ------------------------------------------------------------------
   STATO
   ------------------------------------------------------------------ */
let attivo = false;
let idx = 0;
let movAcc = 0;
let glowEl = null;
let ultimoTesto = '';

TUT.attivo = ()=>attivo;

TUT.inizia = function(){
  if(attivo) return;
  attivo = true;
  idx = 0; movAcc = 0;
  $('#tutorial').classList.remove('hidden');
  collegaBottoni();
  mostra();
  SND.play('menu');
};

TUT.fine = function(salta){
  if(!attivo) return;
  attivo = false;
  togliGlow();
  $('#tutorial').classList.add('hidden');
  if(window.G){ G.tutorialFatto = true; try{ G.salva(); }catch(e){} }
  if(!salta) SND.play('livello');
};

/* ------------------------------------------------------------------
   NOTIFICHE dal gioco
   ------------------------------------------------------------------ */
TUT.notifica = function(evento){
  if(!attivo) return;
  const p = PASSI[idx];
  if(!p) return;
  if(evento==='muovi'){
    if(p.cond==='muovi'){ movAcc++; if(movAcc>=p.soglia) avanza(); }
    return;
  }
  if(evento==='slot'){
    if(p.cond==='slotId' || p.cond==='slotCat') verificaSlot();
    return;
  }
  if(p.cond==='evento' && p.evento===evento) avanza();
};

function verificaSlot(){
  const p = PASSI[idx];
  const s = window.G && G.inv[G.slotSel];
  if(!s) return;
  if(p.cond==='slotId'  && s.id===p.valore) avanza();
  if(p.cond==='slotCat' && IT.cat(s.id)===p.valore) avanza();
}

/* ------------------------------------------------------------------
   AVANZAMENTO
   ------------------------------------------------------------------ */
function avanza(){
  idx++; movAcc = 0;
  if(idx>=PASSI.length){ TUT.fine(false); return; }
  SND.play('raccolta');
  mostra();
}

function mostra(){
  const p = PASSI[idx];
  const card = $('#tutorial');
  card.querySelector('.tut-title').textContent = p.titolo;
  card.querySelector('.tut-text').innerHTML = p.testo;

  // pallini di progresso
  const dots = card.querySelector('.tut-dots');
  dots.innerHTML='';
  for(let i=0;i<PASSI.length;i++){
    const d=document.createElement('i');
    d.className = 'tut-dot'+(i<idx?' done':(i===idx?' now':''));
    dots.appendChild(d);
  }

  // pulsante Continua solo sull'ultimo passo
  card.querySelector('.tut-next').classList.toggle('hidden', p.cond!=='ok');

  // animazione d'entrata
  const inner = card.querySelector('.tut-card');
  inner.style.animation='none'; void inner.offsetWidth; inner.style.animation='';

  aggiornaGlow();
}

/* ------------------------------------------------------------------
   EVIDENZIAZIONE
   ------------------------------------------------------------------ */
function togliGlow(){
  if(glowEl){ glowEl.classList.remove('tut-glow'); glowEl = null; }
}

function aggiornaGlow(){
  const p = PASSI[idx];
  const nuovo = !p || !p.glow ? null
    : (typeof p.glow==='function' ? p.glow() : document.querySelector(p.glow));
  if(nuovo === glowEl) return;
  togliGlow();
  if(nuovo){ nuovo.classList.add('tut-glow'); glowEl = nuovo; }
}

/* chiamato ogni frame: la barra viene ricostruita spesso, così il
   bagliore resta sull'elemento giusto anche dopo un ridisegno */
TUT.aggiorna = function(){
  if(!attivo) return;
  aggiornaGlow();
  // se lo slot è già quello giusto quando appare il passo, avanza subito
  const p = PASSI[idx];
  if(p && (p.cond==='slotId'||p.cond==='slotCat')) verificaSlot();
};

/* ------------------------------------------------------------------
   BOTTONI
   ------------------------------------------------------------------ */
let collegati = false;
function collegaBottoni(){
  if(collegati) return;
  collegati = true;
  $('#tutorial').querySelector('.tut-next').onclick = ()=>{ SND.play('menu'); TUT.fine(false); };
  $('#tutorial').querySelector('.tut-skip').onclick = ()=>{ SND.play('menu'); TUT.fine(true); };
};

})();
