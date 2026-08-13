/* ===================================================================
   FIORALBA — persona.js
   Quello che si migliora addosso: zaino, resistenza, scarpe, cintura.

   Il contenuto sta in `DATA.PERSONA`, qui c'è il negozio e il conto dei
   coefficienti. La regola che tiene insieme le due cose è una sola: il
   numero sta in `DATA.PERSONA[k].passo` e da lì lo leggono TUTTI E DUE
   — chi applica l'effetto (game.js) e chi lo racconta (la scheda delle
   abilità). Nel repo è già successo due volte che un numero di
   bilanciamento finisse in due posti, e due volte i due posti si sono
   contraddetti: la scheda prometteva +7 e il gioco ne dava 8.

   Lo stato è `G.persona[k] = grado`, da 0 a `gradi.length`. Zero è
   «niente», e una partita vecchia parte da lì senza migrazioni.

   Carica prima di game.js: non tocca `G` al caricamento.
   =================================================================== */
(function(){
'use strict';

const P = {};

const T = s => (window.LINGUA ? LINGUA.t(s) : s);
const F = (modello, ...pezzi) => window.LINGUA
  ? LINGUA.f(modello, ...pezzi)
  : modello.replace(/\{(\d+)\}/g, (_, i) => pezzi[i]);

function tabella(){ return (window.DATA && DATA.PERSONA) || {}; }

/* --- il grado posseduto, e quanto vale ---------------------------- */

P.grado = function(k){
  if(!G.persona || typeof G.persona!=='object') G.persona = {};
  return G.persona[k] | 0;
};

/* Il valore dell'effetto adesso: `passo` per il grado. Chi lo usa non
   deve sapere niente di quanti gradi ci sono né di quanto valgono. */
P.valore = function(k){
  const U = tabella()[k];
  return U ? U.passo * P.grado(k) : 0;
};

/* La frase, costruita dallo stesso numero. Le percentuali si arrotondano
   qui e non nella tabella: `0.12*2` fa `0.24000000000000002`, e quel
   numero lì nella scheda si è già visto in altri giochi. */
P.frase = function(k, grado){
  const U = tabella()[k];
  if(!U) return '';
  const g = (grado === undefined) ? P.grado(k) : grado;
  const v = U.passo * g;
  const n = (U.passo < 1) ? Math.round(v * 100) : Math.round(v);
  return F(U.effetto, n);
};

/* --- chi lo vende, e quando ---------------------------------------- */

/* Si sblocca finendo la vicenda di quella persona. Prima di allora la
   voce non compare proprio: un negozio con dentro una cosa che non puoi
   comprare è peggio di un negozio che non c'è. */
P.disponibile = function(k){
  const U = tabella()[k];
  if(!U) return false;
  const s = G.vicende && G.vicende[U.vicenda];
  return !!(s && s.fatta);
};

P.scelte = function(npcId){
  const fuori = [];
  for(const k in tabella()){
    const U = tabella()[k];
    if(U.da !== npcId || !P.disponibile(k)) continue;
    if(P.grado(k) >= U.gradi.length) continue;   // già al massimo: non si ripropone
    fuori.push({ testo:U.scelta, azione:()=>P.finestra(k) });
  }
  return fuori;
};

/* --- comprare ------------------------------------------------------ */

P.costo = function(k){
  const U = tabella()[k];
  const g = U && U.gradi[P.grado(k)];
  return g || null;
};

P.puoi = function(k){
  const c = P.costo(k);
  if(!c) return false;
  if(G.oro < c.costo) return false;
  for(const i in (c.ing||{})) if(G.conta(i) < c.ing[i]) return false;
  return true;
};

P.compra = function(k){
  const U = tabella()[k], c = P.costo(k);
  /* Lo sblocco si controlla anche qui e non solo in `scelte()`. Là è la
     regola di cosa si vede; questa è la regola di cosa si può fare, e le
     due cose stanno in punti diversi del codice: basta un bottone
     cablato male — o il pannello di prova — perché la prima non passi e
     la seconda sì. Una guardia sola è una guardia a metà. */
  if(!c || !P.disponibile(k) || !P.puoi(k)) return false;
  G.oro -= c.costo;
  for(const i in (c.ing||{})) G.togli(i, c.ing[i]);
  G.persona[k] = P.grado(k) + 1;
  /* L'effetto va applicato SUBITO e non al prossimo risveglio: chi ha
     appena pagato ottomila monete apre lo zaino per vedere le caselle
     nuove, e se non ci sono pensa di aver buttato i soldi. */
  G.applicaPersona();
  SND.play('livello');
  UI.toast(F('{0}: {1}', U.nome, c.nome), 'gold', U.icona);
  UI.dialogo(U.da, c.righe || []);
  G.aggiornaHUD();
  G.progresso();
  return true;
};

/* --- la finestra --------------------------------------------------- */

P.finestra = function(k){
  const U = tabella()[k];
  if(!U) return;
  UI.modal(U.nome, body=>{
    const c = P.costo(k);
    const grado = P.grado(k);

    const ora=document.createElement('div'); ora.className='muted'; ora.style.marginBottom='12px';
    ora.innerHTML = grado
      ? F('Adesso hai: <b>{0}</b> — {1}', U.gradi[grado-1].nome, P.frase(k))
      : T('Non hai ancora niente del genere.');
    body.appendChild(ora);

    if(!c){
      const f=document.createElement('div'); f.className='cassa-nota fatta';
      f.textContent = T('Meglio di così non si può.');
      body.appendChild(f);
      return;
    }

    const riga=document.createElement('div'); riga.className='row';
    const info=document.createElement('div'); info.className='rinfo';
    const ing = Object.keys(c.ing||{}).map(i=>{
      const ho = G.conta(i), n = c.ing[i];
      /* Chi ce l'ha e chi no si distinguono a colpo d'occhio: leggere
         «Pelle ×8» senza sapere quante ne hai vuol dire chiudere la
         finestra, aprire lo zaino, e tornare. */
      return `<span style="opacity:${ho>=n?1:.55}">${IT.nome(i)} ${ho}/${n}</span>`;
    }).join(', ');
    info.innerHTML =
      `<div class="rname">${c.nome}</div>`+
      `<div class="rdesc">${P.frase(k, grado+1)}</div>`+
      `<div class="ringr">${F('{0} monete', c.costo)}${ing ? ' · '+ing : ''}</div>`;
    riga.appendChild(info);

    const b=document.createElement('button'); b.className='btn gold';
    b.textContent = T('Prendilo');
    b.disabled = !P.puoi(k);
    b.onclick = ()=>{ if(P.compra(k)) U_chiudi(); };
    riga.appendChild(b);
    body.appendChild(riga);

    if(!P.puoi(k)){
      const n=document.createElement('div'); n.className='muted'; n.style.marginTop='10px';
      n.textContent = G.oro < c.costo ? T('Non hai abbastanza monete.') : T('Ti manca ancora del materiale.');
      body.appendChild(n);
    }
  });
};
function U_chiudi(){ UI.chiudiModal(); }

/* --- la scheda delle abilità --------------------------------------- */

/* Le righe da mostrare sotto ai livelli: tutto quello che è stato
   sbloccato, preso o no. Quello che non si è ancora sbloccato non
   compare — la sorpresa è metà del premio di una vicenda finita. */
P.righeScheda = function(){
  const fuori = [];
  for(const k in tabella()){
    if(!P.disponibile(k)) continue;
    const U = tabella()[k], g = P.grado(k);
    fuori.push({
      k, nome:U.nome, icona:U.icona, grado:g, quanti:U.gradi.length,
      titolo: g ? U.gradi[g-1].nome : T('ancora niente'),
      frase: g ? P.frase(k) : T('da prendere'),
      da: (DATA.NPCS[U.da]||{}).nome || U.da
    });
  }
  return fuori;
};

window.PERSONA = P;
})();
