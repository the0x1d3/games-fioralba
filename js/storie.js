/* ===================================================================
   FIORALBA — storie.js
   Quello che gli abitanti sanno e insegnano: la lezione di caccia di
   Oreste, e le due catene che si aprono con l'amicizia — la torta di
   Ilde e il Pesce Luna.

   Era in game.js. È il pezzo più autonomo che ci fosse rimasto: non usa
   **nessuna** funzione privata di game.js, solo DATA, IT, SND e UI, più
   lo stato in G. Quello che entra sono dodici punti d'ingresso, quasi
   tutti chiamati dal listino delle scelte di dialogo.

   La misura prima diceva "dipende da `passo`": era falso, ed era il
   nome a ingannare. Qui dentro `passo` è `passoLezione`, e la parola
   ricorre nei commenti perché la lezione è fatta di passi — la funzione
   che fa il rumore dei piedi non c'entra niente.
   =================================================================== */
(function(){

const S = {};
window.STORIE = S;

/* ===================================================================
   LA LEZIONE DI ORESTE

   Il tutorial è la lezione, e la lezione è nel gioco: non c'è un
   cartello che spiega la caccia, c'è un vecchio sul Passo che ti dà un
   arco e ti dice cosa fare, un pezzo per volta, mentre lo fai. Ogni
   passo si chiude quando lo hai fatto davvero, non quando hai premuto
   «avanti» — che è la differenza fra aver capito e aver letto.

   Sta scritto qui e non in tutorial.js perché tutorial.js è la guida
   dei primi minuti, uguale per tutti e una volta sola; questa invece è
   un pezzo di mondo: la trovi quando sali lassù, e vale finché non
   l'hai imparata.
   =================================================================== */
const LEZIONE_CACCIA = [
  { id:'arco',
    testo:['Questo? Un arco. Corno di cervo e tendine, l\'ho fatto io d\'inverno che non c\'era altro da fare.',
           'Se vuoi te ne do uno. Ma un arco senza sapere dove puntarlo è un bastone storto: prima la lezione.'],
    fine:['Tieni. È teso male e tira corto, ma è onesto.',
          'Prima cosa: <b>mettitelo in mano</b>, dalla barra in basso. Poi torna qui.'] },
  { id:'inMano', attesa:'Prendi l\'arco dalla barra in basso.',
    testo:['Bene. Adesso ascolta, perché è la parte che conta.',
           'Si tira <b>davanti a sé</b>, non dove guarda il tuo dito. Da che parte sei girato conta: '+
           'è metà della caccia. L\'altra metà è arrivarci vicino senza farti sentire.'],
    fine:['Le bestie ti sentono da lontano. Il coniglio a due passi, il cervo a quattro.',
          'Vai piano, non correre, e tira quando sei <b>abbastanza vicino</b>: da lontano si sbaglia, '+
          'e chi sbaglia fa scappare tutto il bosco.'] },
  { id:'colpito', attesa:'Trova una preda e colpiscila. Coniglio nel prato, cervo nel bosco all\'alba.',
    testo:['Ecco. Adesso lo sai.',
           'Non sprecare niente: la carne si mangia, la pelle si concia, il corno lo tiene Tobia. '+
           'E non tirare a quello che non ti serve — allo scoiattolo, al riccio. Non sono cacciagione, sono vicini.'],
    fine:['Torna quando vuoi. Se l\'arco ti sta stretto, Tobia lo rinforza con quello che porti giù.'] }
];

function passoLezione(){
  return LEZIONE_CACCIA.find(p => p.id === G.lezioneCaccia) || null;
}

function offriLezioneCaccia(cuori){
  if(cuori < 1){
    UI.dialogo('eremita', [
      'L\'arco? È mio.',
      'Torna quando ci conosciamo un po\' meglio. Non do archi a chi ho visto due volte.'
    ]);
    return;
  }
  const p = LEZIONE_CACCIA[0];
  UI.dialogo('eremita', p.testo, { scelte:[
    { testo:'🏹 Insegnami', azione:()=>{
        G.lezioneCaccia = 'arco';
        UI.dialogo('eremita', p.fine, { scelte:[{ testo:'Va bene', azione:()=>{
          if(!G.conta('arco')) G.aggiungi('arco',1);
          avanzaLezioneCaccia('arco');
        }}]});
      }},
    { testo:'Un\'altra volta', azione:()=>{} }
  ]});
}

function riprendiLezioneCaccia(){
  const p = passoLezione();
  if(!p){ G.lezioneCaccia = null; return; }
  UI.dialogo('eremita', [p.attesa ? 'Non ancora. ' + p.attesa.replace(/^./, c=>c.toLowerCase()) : 'Sei pronto.']);
}

/* Chiude il passo corrente e apre il successivo. Chiamata da chi il
   passo lo compie: la barra quando ci metti l'arco, il tiro quando
   colpisci. */
function avanzaLezioneCaccia(fatto){
  if(G.lezioneCaccia !== fatto) return;
  const i = LEZIONE_CACCIA.findIndex(p => p.id === fatto);
  const prossimo = LEZIONE_CACCIA[i+1];

  if(!prossimo){
    G.lezioneCaccia = null;
    G.sacaccia = true;
    const p = LEZIONE_CACCIA[i];
    UI.dialogo('eremita', p.testo.concat(p.fine));
    UI.toast('Hai imparato: <b>Caccia</b>','gold');
    G.xp('caccia', 40);
    return;
  }
  G.lezioneCaccia = prossimo.id;
  /* il primo passo che si compie lontano da Oreste apre già la caccia:
     altrimenti l'unica cosa da fare sarebbe risalire il Passo per
     sentirsi dire di scendere a cercare un coniglio */
  if(prossimo.id === 'colpito'){
    G.sacaccia = true;
    UI.dialogo('eremita', LEZIONE_CACCIA[i].testo.concat(LEZIONE_CACCIA[i].fine));
  }
  if(prossimo.attesa) UI.toast('Lezione di caccia: '+prossimo.attesa);
}

function consigliCaccia(){
  const liv = G.livello('caccia');
  const righe = [
    'Il coniglio sta nel prato e nel bosco, di giorno. Il cervo solo nel bosco, all\'alba o sul tardi, e non tutti i giorni.',
    'Più sei vicino, più è facile. Non c\'è altro segreto.'
  ];
  if(liv >= 3) righe.push('Te la cavi. Adesso ti sentono più tardi, e quello che porti a casa rende di più.');
  if((G.stats.prede||0) >= 20) righe.push('Ilde diceva che un bosco senza cacciatori si ammala. Non esagerare, però.');
  UI.dialogo('eremita', righe);
}

function insegnaRicetta(){
  const nuove = DATA.CUCINA.filter(r=>!G.ricetteNote[r.id]);
  const cuori = Math.floor((G.amicizia.marisol||0)/100);
  if(!nuove.length){
    UI.dialogo('marisol',['Ti ho già insegnato tutto quello che so. Adesso tocca a te inventarne una.']);
    return;
  }
  const richiesti = Math.min(nuove.length, Math.max(0, DATA.CUCINA.length - nuove.length));
  if(cuori < richiesti){
    UI.dialogo('marisol',[
      'Le ricette non si regalano, si passano.',
      'Passa più spesso, mangia qui, raccontami com\'è andato il campo. Poi vediamo.'
    ]);
    return;
  }
  const r = nuove[0];
  G.ricetteNote[r.id]=true;
  UI.dialogo('marisol',[
    'Allora: '+IT.nome(r.id)+'.',
    'Ti serve '+Object.keys(r.ing).map(k=>IT.nome(k)+' ×'+r.ing[k]).join(', ')+'. Poco fuoco e tanta pazienza.',
    'Segnatela. Non te la ripeto.'
  ]);
  SND.play('regalo');
  UI.toast('Ricetta imparata: '+IT.nome(r.id),'gold',r.id);
}

function loreSerafina(){
  const l=[];
  if(G.braci===0) l.push('La valle non è malata. È solo rimasta al buio troppo a lungo e ha preso l\'abitudine.',
                          'Nel bosco, a est, un burrone taglia la terra. Di là c\'è un santuario, e non ci si arriva a piedi: serve un ponte. Chiedilo a Tobia, alla fucina.');
  else if(G.braci===1) l.push('Una brace. L\'aria di primavera è già diversa, l\'hai sentito?',
                               'Ilde diceva che la prima è quella che ti convince che non sei matto.');
  else if(G.braci===2) l.push('Due. Adesso la gente in paese comincia a parlarne.',
                               'Bruno finge di non crederci ma ha ricominciato a tenere aperto fino a tardi.');
  else if(G.braci===3) l.push('Tre. Manca l\'inverno, che è sempre la più difficile.',
                               'Non perché serva chissà cosa. Perché d\'inverno è più facile smettere.');
  else l.push('L\'hai riaccesa.', 'Sai cosa mi ha detto Fiammella ieri? Che aveva dimenticato il proprio colore.',
              'Adesso lo ricorda. Grazie a te. Non fare quella faccia modesta.');
  UI.dialogo('serafina', l);
}

function consigliPesca(){
  const st=G.stagione().id;
  const pesci = Object.keys(DATA.ITEMS).filter(k=>DATA.ITEMS[k].cat==='pesce' && DATA.ITEMS[k].stagioni &&
    DATA.ITEMS[k].stagioni.indexOf(st)>=0);
  const n = pesci[(Math.random()*pesci.length)|0];
  UI.dialogo('elio',[
    'In questa stagione? Cerca il '+DATA.ITEMS[n].nome+'.',
    DATA.ITEMS[n].luogo==='mare' ? 'Quello sta al largo: vai alla Costa, oltre la Piazza, e lancia dal molo.'
      : DATA.ITEMS[n].luogo==='lago' ? 'Sta nelle acque ferme: il laghetto del podere o lo stagno del bosco.'
                                     : 'Sta nella corrente. Prova il fiume del paese, dal molo.',
    DATA.ITEMS[n].notte ? 'Ah: esce solo dopo il tramonto. Portati una lanterna.' :
                          'Di giorno abbocca senza troppi problemi.'
  ]);
}

/* ===================================================================
   CATENE NARRATIVE — due storie che si sbloccano con l'amicizia.
   =================================================================== */
const TORTA_ING = { zucca:2, uovo:3, miele:2, lavanda:1 };
function ingLista(ing){ return Object.keys(ing).map(k=>IT.nome(k)+' ×'+ing[k]).join(', '); }

/* --- La torta di Nonna Ilde (Marisol + Serafina) --- */
function avviaTortaIlde(){
  G.trame.torta.avviata = true;
  UI.dialogo('marisol',[
    'Nonna Ilde... la sua torta era leggendaria. Me la portava a ogni solstizio e non mi ha mai dato la ricetta intera.',
    'Ho quasi tutti i pezzi. Mi mancano due cose: il suo <b>segreto</b> — quello lo sa Serafina, c\'era sempre — e gli <b>ingredienti</b>.',
    'Portami '+ingLista(TORTA_ING)+', fatti dire il segreto da Serafina, e la facciamo insieme. Per lei.'
  ]);
  UI.toast('Nuova storia: La torta di Nonna Ilde.','gold');
}
function tortaSerafina(){
  G.trame.torta.segreto = true;
  UI.dialogo('serafina',[
    'La torta di Ilde? Mezzo paese ha provato a rifarla. Nessuno c\'è riuscito.',
    'Il segreto non è un ingrediente raro. È il <b>tempo</b>: la lasciava nel forno spento tutta la notte, a prendersi il calore che restava.',
    'E una presa di <b>lavanda</b> nell\'impasto. Ma non dirlo in giro, o si offende mezza valle.'
  ]);
  UI.toast('Hai scoperto il segreto della torta di Ilde.','gold');
}
function tortaMarisol(){
  const t = G.trame.torta;
  const haIng = Object.keys(TORTA_ING).every(k=>G.conta(k)>=TORTA_ING[k]);
  if(t.segreto && haIng){
    for(const k in TORTA_ING) G.togli(k, TORTA_ING[k]);
    t.fatta = true;
    G.amicizia.marisol = Math.max(0,(G.amicizia.marisol||0)+150);
    G.lettere.ricetta_ilde = true;
    if(G.puoiAggiungere('torta_zucca',2)) G.aggiungi('torta_zucca',2);
    SND.play('livello');
    UI.toast('La torta di Nonna Ilde è pronta.','gold','torta_zucca');
    UI.dialogo('marisol',[
      'Aspetta... senti l\'odore? È lei. È esattamente lei.',
      'Ho capito il vero segreto solo adesso: non la faceva per il solstizio. Faceva il solstizio per avere una scusa buona per portartela.',
      'Tieni: la ricetta, scritta di suo pugno. E la prima fetta è tua.'
    ], { fine:()=>UI.lettera('ricetta_ilde') });
    return;
  }
  const mancano=[];
  if(!t.segreto) mancano.push('il segreto (parla con Serafina, nel bosco)');
  const im = Object.keys(TORTA_ING).filter(k=>G.conta(k)<TORTA_ING[k]).map(k=>IT.nome(k)+' ×'+TORTA_ING[k]);
  if(im.length) mancano.push('gli ingredienti ('+im.join(', ')+')');
  UI.dialogo('marisol',['Per la torta di Ilde manca ancora '+mancano.join(', e ')+'.']);
}

/* --- Il Pesce Luna (Elio) --- */
function avviaPesceLuna(){
  G.trame.pesceluna.avviata = true;
  UI.dialogo('elio',[
    'Il Pesce Luna. Lo so, fai quella faccia. Ma io l\'ho visto, una volta sola, da ragazzo.',
    'Grande come un piatto, con gli occhi che sembravano due lune piene. Da allora lo cerco.',
    'Se ci credi anche tu, provaci: di <b>notte</b>, nelle acque ferme del <b>lago</b>, d\'estate o d\'autunno. Se lo prendi, corri da me.'
  ]);
  UI.toast('Nuova storia: Il Pesce Luna. Pescalo di notte, nel lago.','gold');
}
function pescelunaElio(){
  const t = G.trame.pesceluna;
  if(t.preso || G.conta('pesce_luna')>0){
    t.fatta = true; t.preso = true;
    G.amicizia.elio = Math.max(0,(G.amicizia.elio||0)+150);
    const premio = 2200; G.oro += premio; G.stats.guadagno += premio;
    SND.play('livello');
    UI.toast('Elio non ci crede: hai preso il Pesce Luna! +'+premio+' monete','gold','pesce_luna');
    UI.dialogo('elio',[
      'Fermo. Fermo lì. Quello è... no. NO. È il Pesce Luna. È vero. È VERO!',
      'Dodici anni che lo dico e mi ridono dietro. E tu ci sei riuscito.',
      'Tienilo tu, mi raccomando: a me basta sapere che esiste. Prendi questa — è la colletta che tenevo da parte per chi mi avrebbe creduto. Sei tu.'
    ]);
    return;
  }
  UI.dialogo('elio',[
    'L\'hai visto? No? Esce solo di <b>notte</b>, e solo nelle acque ferme del <b>lago</b>.',
    'D\'estate e d\'autunno è più facile. Porta pazienza e una buona lanterna.'
  ]);
}

/* la lezione */
S.offriLezioneCaccia   = offriLezioneCaccia;
S.riprendiLezioneCaccia = riprendiLezioneCaccia;
S.avanzaLezioneCaccia  = avanzaLezioneCaccia;
S.consigliCaccia       = consigliCaccia;

/* quello che sanno gli altri */
S.insegnaRicetta = insegnaRicetta;
S.loreSerafina   = loreSerafina;
S.consigliPesca  = consigliPesca;

/* le due catene */
S.avviaTortaIlde  = avviaTortaIlde;
S.tortaSerafina   = tortaSerafina;
S.tortaMarisol    = tortaMarisol;
S.avviaPesceLuna  = avviaPesceLuna;
S.pescelunaElio   = pescelunaElio;

})();
