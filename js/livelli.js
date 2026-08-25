/* ===================================================================
   FIORALBA — livelli.js
   Tutto quello che si vede dell'esperienza: la barretta che compare
   quando si guadagna, la carta che annuncia un livello coi suoi premi,
   e la scheda lunga delle cinque abilità.

   Prima l'esperienza era invisibile. Saliva di nascosto e a fine corsa
   sparava un toast — «Pesca — livello 3!» — che diceva quando eri
   arrivato ma mai quanto mancava, e i punti guadagnati zappando non si
   vedevano proprio. Il risultato era che i numeri c'erano ma nessuno
   sapeva di averli: si saliva di livello per caso.

   Qui il conto si mostra mentre cambia. Un colpo di piccone accende una
   barretta con «+4 Estrazione» e quanto resta al livello dopo; il
   livello vero si prende la sua carta, con dentro le monete, l'oggetto e
   il bonus appena sbloccato.

   Il file non decide niente: i numeri stanno in DATA.XP_LIV, i bonus in
   DATA.BONUS, i premi in DATA.PREMI_LIVELLO, e chi li assegna è G.xp.
   Qui si disegna soltanto, ed è apposta: la scheda ha già mentito una
   volta — prometteva «barra di pesca +7px» quando il gioco ne dava 8 —
   e succedeva perché i numeri erano scritti anche qui.
   =================================================================== */
(function(){

const $ = s=>document.querySelector(s);

/* I conti dentro alla frase, non incollati col `+`: `UI.toast` traduce
   quello che riceve, e riceveva «Ritirati 2, ne restano 3: …» già
   montato, che nel catalogo non c'è. Come `fraseF` in game.js. */
function fraseF(modello, ...pezzi){
  return window.LINGUA ? LINGUA.f(modello, ...pezzi)
                       : modello.replace(/\{(\d+)\}/g, (_,i)=>pezzi[i]);
}

const L = {};
window.LIV = L;

const CHIAVI = ['agricoltura','raccolta','estrazione','pesca','caccia'];
const MAX = 10;

/* --------------------------------------------------------------- */
/* il conto                                                        */
/* --------------------------------------------------------------- */
/* Un posto solo per «a che punto sono»: lo usano la barretta, la carta
   e la scheda. Prima ognuna delle tre se lo ricalcolava, con tre
   arrotondamenti diversi, e la percentuale nello zaino non coincideva
   con quella del diario. */
L.progresso = function(k){
  const xp   = (G.skills && G.skills[k]) || 0;
  const liv  = G.livello(k);
  const cur  = DATA.XP_LIV[liv] || 0;
  const next = DATA.XP_LIV[liv+1];
  if(liv >= MAX || next === undefined)
    return { liv:MAX, xp, cur, next:null, dentro:0, serve:0, mancano:0, perc:100, massimo:true };
  const dentro  = xp - cur;
  const serve   = next - cur;
  return { liv, xp, cur, next, dentro, serve,
           mancano: next - xp,
           perc: Math.max(0, Math.min(100, dentro/serve*100)),
           massimo:false };
};

L.premioDi = function(k, liv){ return (DATA.PREMI_LIVELLO[k]||[])[liv] || null; };

/* Le scelte al livello 3 non sono un albero da amministrare: un mestiere
   prende una direzione e il Diario resta sempre il posto da cui leggerla
   o deciderla più tardi, senza punire chi chiude la carta subito. */
L.talento = function(k){
  const id=G.talenti && G.talenti[k];
  return ((DATA.TALENTI&&DATA.TALENTI[k])||[]).find(t=>t.id===id) || null;
};
L.sceltaDisponibile = function(k){
  return G.livello(k)>=3 && !L.talento(k) && !!((DATA.TALENTI&&DATA.TALENTI[k])||[]).length;
};
L.riconsiderazioneDisponibile = function(k){
  const R=DATA.RICONSIDERAZIONE_TALENTO;
  return G.livello(k)>=3 && !!L.talento(k) && !G.riconsiderazioneTalentoUsata &&
    G.braci >= R.braci;
};
L.scegliTalento = function(k, riconsidera){
  const opzioni=(DATA.TALENTI&&DATA.TALENTI[k])||[];
  const attuale=L.talento(k);
  if((riconsidera ? !L.riconsiderazioneDisponibile(k) : !L.sceltaDisponibile(k)) || !opzioni.length) return;
  UI.modal(riconsidera ? 'Riconsidera la specializzazione' : 'Scegli una specializzazione', body=>{
    const intro=el('p','muted',riconsidera
      ? 'La Lanterna conserva questo unico momento per cambiare direzione. I livelli e l’esperienza restano dove sono.'
      : 'Questa scelta aggiunge una piccola direzione al mestiere. Potrai leggerla sempre nel Diario.');
    body.appendChild(intro);
    for(const t of opzioni){
      if(riconsidera && attuale && t.id===attuale.id) continue;
      const c=el('div','liv-scheda');
      const r=el('div','liv-scheda-testa');
      r.appendChild(icona(t.icona,30));
      const tx=el('div','liv-scheda-nomi');
      tx.appendChild(el('div','liv-scheda-nome',t.nome));
      tx.appendChild(el('div','liv-scheda-desc',t.descrizione));
      r.appendChild(tx); c.appendChild(r);
      const b=el('button','btn gold','Scegli '+t.nome);
      b.onclick=()=>{
        if(!G.talenti || typeof G.talenti!=='object') G.talenti={};
        G.talenti[k]=t.id;
        if(riconsidera) G.riconsiderazioneTalentoUsata=true;
        G.salva();
        G.rinfrescaHotbar();
        G.aggiornaHUD();
        UI.chiudiModal();
        UI.toast(DATA.SKILLS[k].nome+(riconsidera ? ' — nuova direzione: ' : ' — talento scelto: ')+t.nome+'.','gold');
      };
      c.appendChild(b); body.appendChild(c);
    }
  });
};

/* --------------------------------------------------------------- */
/* pezzi di disegno riusati                                        */
/* --------------------------------------------------------------- */
function el(tag, cls, testo){
  const e = document.createElement(tag);
  if(cls) e.className = cls;
  if(testo != null) e.textContent = testo;
  return e;
}

/* L'icona di un oggetto, con la stessa funzione che usano tutte le altre
   finestre: `UI.ico(id, lato)` disegna su un canvas quello che ART sa
   disegnare. Il try serve per gli id che ART non conosce — un premio
   scritto male darebbe una finestra bianca invece di una riga senza
   figurina, e la scheda è il posto sbagliato per scoprirlo. */
function icona(id, lato){
  try{
    const e = UI.ico(id, lato);
    if(e) return e;
  }catch(e){ console.warn('[livelli] nessuna icona per', id, e); }
  return el('span','liv-ico-vuota');
}

function barra(p, cls){
  const b = el('div','liv-barra'+(cls?' '+cls:''));
  const i = el('i');
  i.style.width = p.perc + '%';
  b.appendChild(i);
  return b;
}

function testoMancano(p){
  if(p.massimo) return 'livello massimo';
  return p.dentro.toLocaleString('it-IT') + ' / ' + p.serve.toLocaleString('it-IT') +
         ' — mancano ' + p.mancano.toLocaleString('it-IT') + ' al livello ' + (p.liv+1);
}

/* --------------------------------------------------------------- */
/* LA BARRETTA — compare quando si guadagna, poi se ne va           */
/* --------------------------------------------------------------- */
let chip = null, chipVia = null, chipUltima = null, chipSomma = 0;

function chipElemento(){
  if(chip) return chip;
  chip = el('div','liv-chip nascosto');
  chip.innerHTML =
    '<div class="liv-chip-testa"><span class="liv-chip-nome"></span>'+
    '<span class="liv-chip-piu"></span></div>'+
    '<div class="liv-barra liv-chip-barra"><i></i></div>'+
    '<div class="liv-chip-resto"></div>';
  const hud = $('#hud') || document.body;
  hud.appendChild(chip);
  return chip;
}

/* Ogni guadagno la riaccende e fa ripartire i sei secondi. I punti si
   sommano finché resta a schermo: zappando un campo arrivano otto colpi
   in fila, e otto «+8» che si sostituiscono a vicenda non si leggono —
   uno solo che sale a «+64» sì. */
L.guadagno = function(k, n){
  if(!G.inGioco || !n) return;
  const c = chipElemento();
  if(chipUltima !== k){ chipSomma = 0; chipUltima = k; }
  chipSomma += n;

  const p = L.progresso(k);
  c.querySelector('.liv-chip-nome').textContent = DATA.SKILLS[k].nome + ' · liv. ' + p.liv;
  c.querySelector('.liv-chip-piu').textContent  = '+' + chipSomma;
  c.querySelector('.liv-chip-barra i').style.width = p.perc + '%';
  c.querySelector('.liv-chip-resto').textContent = p.massimo
    ? 'livello massimo'
    : 'ancora ' + p.mancano.toLocaleString('it-IT') + ' → liv. ' + (p.liv+1);

  c.classList.remove('nascosto');
  c.classList.remove('pulsa'); void c.offsetWidth; c.classList.add('pulsa');

  clearTimeout(chipVia);
  chipVia = setTimeout(()=>{
    c.classList.add('nascosto');
    chipUltima = null; chipSomma = 0;
  }, 6000);
};

L.nascondiChip = function(){
  if(!chip) return;
  clearTimeout(chipVia);
  chip.classList.add('nascosto');
  chipUltima = null; chipSomma = 0;
};

/* --------------------------------------------------------------- */
/* LA CARTA — un livello alla volta, in coda                        */
/* --------------------------------------------------------------- */
/* Salire due livelli con un colpo solo capita (la lezione di Oreste ne
   dà 40 in una volta). Due carte sovrapposte non si leggerebbero, quindi
   si mettono in fila e la seconda aspetta che la prima abbia finito. */
const coda = [];
let inCorso = false;

L.annuncia = function(salita){
  coda.push(salita);
  if(!inCorso) prossima();
};

/* Fra una carta e l'altra passano 260ms in cui a schermo non c'è niente:
   chi guarda solo se esiste `.liv-velo` in quel momento conclude che la
   coda è finita, e si sbaglia. Serve per provare le carte in fila, ed è
   costato un giro di verifica capirlo. */
L.inCoda = function(){ return coda.length + (inCorso ? 1 : 0); };

function prossima(){
  const s = coda.shift();
  if(!s){ inCorso = false; return; }
  inCorso = true;
  mostraCarta(s, ()=>setTimeout(prossima, 260));
}

function mostraCarta(s, finito){
  const k = s.skill, liv = s.liv, P = s.premio;
  L.nascondiChip();                       // la barretta sotto darebbe fastidio
  SND.play('livello');

  const velo = el('div','liv-velo');
  const carta = el('div','liv-carta');

  const occhiello = el('div','liv-occhiello','Livello raggiunto');
  carta.appendChild(occhiello);

  const testa = el('div','liv-carta-testa');
  testa.appendChild(icona(DATA.SKILLS[k].icona, 46));
  const tt = el('div','liv-carta-tit');
  tt.appendChild(el('div','liv-carta-nome', DATA.SKILLS[k].nome));
  tt.appendChild(el('div','liv-carta-num', 'Livello ' + liv));
  testa.appendChild(tt);
  carta.appendChild(testa);

  /* la barra parte da dove stava e si riempie: è l'unico momento in cui
     si vede il salto invece di trovarselo già fatto */
  const b = el('div','liv-barra liv-carta-barra');
  const bi = el('i'); bi.style.width = '0%';
  b.appendChild(bi);
  carta.appendChild(b);

  /* --- i bonus, quello nuovo evidenziato --- */
  const righeOra   = DATA.BONUS_TESTO[k](liv);
  const righePrima = DATA.BONUS_TESTO[k](liv-1);
  const bx = el('div','liv-bonus');
  righeOra.forEach(([nome, val], i)=>{
    const r = el('div','liv-bonus-riga' + (righePrima[i] && righePrima[i][1] !== val ? ' su' : ''));
    r.appendChild(el('span','liv-bonus-nome', nome));
    r.appendChild(el('span','liv-bonus-val', val));
    bx.appendChild(r);
  });
  carta.appendChild(bx);

  if(liv===3 && L.sceltaDisponibile(k)){
    const talento=el('div','liv-premi chiave');
    talento.appendChild(el('div','liv-premi-tit','Scegli la tua direzione'));
    talento.appendChild(el('div','liv-premi-nota','Il livello 3 apre una specializzazione per questa abilità.'));
    const bTalento=el('button','btn gold','Scegli un talento');
    bTalento.onclick=()=>{ via(); setTimeout(()=>L.scegliTalento(k),300); };
    talento.appendChild(bTalento);
    carta.appendChild(talento);
  }

  /* --- i premi --- */
  if(P){
    const pr = el('div','liv-premi' + (P.chiave ? ' chiave' : ''));
    pr.appendChild(el('div','liv-premi-tit', P.chiave ? 'Premio speciale' : 'Premio'));
    const riga = el('div','liv-premi-riga');

    if(P.oro){
      const m = el('div','liv-premio');
      m.appendChild(el('span','liv-moneta'));
      m.appendChild(el('span',null,'+' + P.oro.toLocaleString('it-IT')));
      riga.appendChild(m);
    }
    if(P.item && P.n){
      const o = el('div','liv-premio');
      o.appendChild(icona(P.item, 26));
      o.appendChild(el('span',null, IT.nome(P.item) + ' ×' + P.n));
      riga.appendChild(o);
    }
    pr.appendChild(riga);
    if(P.sospeso)
      pr.appendChild(el('div','liv-premi-nota','Lo zaino era pieno: l\'oggetto ti aspetta nella scheda delle abilità.'));
    carta.appendChild(pr);
  }

  const chiudi = el('button','btn gold liv-carta-btn','Continua');
  carta.appendChild(chiudi);

  velo.appendChild(carta);
  document.body.appendChild(velo);

  /* l'animazione parte al fotogramma dopo, altrimenti il browser vede
     larghezza iniziale e finale nello stesso momento e non anima niente */
  requestAnimationFrame(()=>{
    velo.classList.add('dentro');
    const p = L.progresso(k);
    setTimeout(()=>{ bi.style.width = (p.massimo ? 100 : p.perc) + '%'; }, 240);
    if(P && P.chiave) setTimeout(()=>SND.play('brace'), 320);
  });

  let chiuso = false;
  const via = ()=>{
    if(chiuso) return;
    chiuso = true;
    velo.classList.remove('dentro');
    setTimeout(()=>{ velo.remove(); finito(); }, 260);
    window.removeEventListener('keydown', tasto, true);
  };
  /* in cattura e con stopPropagation: senza, lo stesso invio che chiude
     la carta arriverebbe al gioco e darebbe una zappata */
  const tasto = e=>{
    const t = e.key.toLowerCase();
    if(t===' '||t==='enter'||t==='escape'||t==='e'){
      e.preventDefault(); e.stopPropagation(); via();
    }
  };
  window.addEventListener('keydown', tasto, true);
  chiudi.onclick = via;
  velo.onclick = e=>{ if(e.target===velo) via(); };
}

/* --------------------------------------------------------------- */
/* I PREMI RIMASTI FUORI                                            */
/* --------------------------------------------------------------- */
L.sospesi = function(){ return (G.premiSospesi||[]).length; };

/* Ne ritira quanti ne entrano e lascia gli altri: se lo zaino è ancora
   pieno lo dice invece di far sparire la roba. */
L.ritira = function(){
  const resto = [];
  let presi = 0;
  for(const p of (G.premiSospesi||[])){
    if(G.puoiAggiungere(p.item, p.n)){ G.aggiungi(p.item, p.n); presi++; }
    else resto.push(p);
  }
  G.premiSospesi = resto;
  if(presi && !resto.length) UI.toast('Premi ritirati.','gold');
  else if(presi)             UI.toast(fraseF('Ritirati {0}, ne restano {1}: libera lo zaino.', presi, resto.length),'bad');
  else                       UI.toast('Zaino pieno: non c\'è posto per i premi.','bad');
  G.rinfrescaHotbar(); G.aggiornaHUD();
  return presi;
};

/* --------------------------------------------------------------- */
/* LA SCHEDA — l'elenco lungo, per il diario                        */
/* --------------------------------------------------------------- */
L.scheda = function(body){
  /* --- riepilogo in cima --- */
  const tot = CHIAVI.reduce((a,k)=>a + G.livello(k), 0);
  const cap = el('div','liv-cappello');
  cap.appendChild(el('div','liv-cappello-num', tot + '/' + (CHIAVI.length*MAX)));
  const cd = el('div','liv-cappello-txt');
  cd.appendChild(el('div','liv-cappello-tit','Livelli raggiunti'));
  cd.appendChild(el('div','liv-cappello-sub',
    'Ogni livello dà monete, un oggetto e un bonus permanente. ' +
    'Energia massima attuale: ' + G.energiaMax + '.'));
  cap.appendChild(cd);
  body.appendChild(cap);

  /* --- il momento per riconsiderare ---
     Sta prima delle singole abilità così il Diario dice sempre se la
     possibilità esiste, anche quando non è ancora stata scelta nessuna
     direzione. Il gesto vero resta accanto al talento interessato. */
  const R=DATA.RICONSIDERAZIONE_TALENTO;
  const riconsiderabili=CHIAVI.filter(k=>L.riconsiderazioneDisponibile(k));
  const rip=el('div','liv-prossimo chiave');
  rip.appendChild(el('span','liv-prossimo-eti','Riconsiderare — '+R.nome));
  const ripTesto=el('span','liv-prossimo-val');
  if(G.riconsiderazioneTalentoUsata)
    ripTesto.textContent='Hai già usato questo momento: livelli ed esperienza non sono mai stati toccati.';
  else if(G.braci<R.braci)
    ripTesto.textContent=R.descrizione+' Non perderai livelli né esperienza.';
  else if(riconsiderabili.length)
    ripTesto.textContent='La Lanterna è accesa: puoi cambiare una sola specializzazione dal suo riquadro qui sotto. Livelli ed esperienza restano invariati.';
  else
    ripTesto.textContent='La Lanterna è pronta: scegli prima una specializzazione al livello 3, poi potrai riconsiderarne una sola.';
  rip.appendChild(ripTesto);
  body.appendChild(rip);

  /* --- premi in attesa --- */
  if(L.sospesi()){
    const s = el('div','liv-sospesi');
    const t = el('div','liv-sospesi-txt');
    t.appendChild(el('b',null, L.sospesi() + (L.sospesi()===1 ? ' premio ti aspetta' : ' premi ti aspettano')));
    t.appendChild(el('div','liv-sospesi-el',
      (G.premiSospesi||[]).map(p=>IT.nome(p.item)+' ×'+p.n).join(' · ')));
    s.appendChild(t);
    const b = el('button','btn gold','Ritira');
    /* la scheda si chiama 'livelli': con 'abilita', che non esiste,
       il diario ricadeva sul ramo di riserva e chi ritirava i premi
       si ritrovava davanti «Il podere in numeri» */
    b.onclick = ()=>{ L.ritira(); UI.diario(G,'livelli'); };
    s.appendChild(b);
    body.appendChild(s);
  }

  /* --- quello che si è migliorato addosso ---

     Sta qui e non in una scheda sua perché è la stessa domanda dei
     livelli — «a che punto sono» — e perché così il numero e la frase
     si leggono uno sotto l'altro: la frase la calcola `PERSONA.frase`
     dallo stesso `passo` che il gioco applica, quindi non possono
     divergere. Non compare finché non si è sbloccato niente: una
     sezione vuota per tre stagioni è solo rumore. */
  const addosso = (window.PERSONA ? PERSONA.righeScheda() : []);
  if(addosso.length){
    body.appendChild(el('div','sectitle', 'Sulla persona'));
    for(const r of addosso){
      const c = el('div','liv-scheda' + (r.grado >= r.quanti ? ' massimo' : ''));
      const testa = el('div','liv-scheda-testa');
      testa.appendChild(icona(r.icona, 34));
      const nomi = el('div','liv-scheda-nomi');
      nomi.appendChild(el('div','liv-scheda-nome', r.nome + ' — ' + r.titolo));
      nomi.appendChild(el('div','liv-scheda-desc', r.frase));
      testa.appendChild(nomi);
      testa.appendChild(el('div','liv-scheda-liv',
        r.grado >= r.quanti ? 'MAX' : r.grado + '/' + r.quanti));
      c.appendChild(testa);
      if(r.grado < r.quanti)
        c.appendChild(el('div','liv-scheda-conto', 'Il prossimo lo fa ' + r.da + '.'));
      body.appendChild(c);
    }
  }

  /* --- una carta per abilità --- */
  for(const k of CHIAVI){
    const p = L.progresso(k);
    const S = DATA.SKILLS[k];
    const c = el('div','liv-scheda' + (p.massimo ? ' massimo' : ''));

    const testa = el('div','liv-scheda-testa');
    testa.appendChild(icona(S.icona, 34));
    const nomi = el('div','liv-scheda-nomi');
    nomi.appendChild(el('div','liv-scheda-nome', S.nome));
    nomi.appendChild(el('div','liv-scheda-desc', S.desc));
    testa.appendChild(nomi);
    testa.appendChild(el('div','liv-scheda-liv', p.massimo ? 'MAX' : 'Liv. ' + p.liv));
    c.appendChild(testa);

    c.appendChild(barra(p));
    c.appendChild(el('div','liv-scheda-conto', testoMancano(p)));

    /* i bonus di adesso; quelli fermi a zero restano spenti, così si vede
       che esistono e che cosa aspettano */
    const bx = el('div','liv-bonus');
    for(const [nome, val] of DATA.BONUS_TESTO[k](p.liv)){
      const spento = /(^\+?0( |%|px)|^−?0%|^0 )/.test(val) || /da livello/.test(val);
      const r = el('div','liv-bonus-riga' + (spento ? ' spento' : ''));
      r.appendChild(el('span','liv-bonus-nome', nome));
      r.appendChild(el('span','liv-bonus-val', val));
      bx.appendChild(r);
    }
    c.appendChild(bx);

    const talento=L.talento(k);
    if(talento){
      const r=el('div','liv-prossimo chiave');
      r.appendChild(el('span','liv-prossimo-eti','Talento scelto: '));
      r.appendChild(el('span','liv-prossimo-val',talento.nome+' — '+talento.descrizione));
      if(L.riconsiderazioneDisponibile(k)){
        const b=el('button','btn','Riconsidera alla Lanterna');
        b.onclick=()=>L.scegliTalento(k,true);
        r.appendChild(b);
      }
      c.appendChild(r);
    } else if(L.sceltaDisponibile(k)){
      const r=el('div','liv-prossimo chiave');
      r.appendChild(el('span','liv-prossimo-eti','Specializzazione disponibile'));
      const b=el('button','btn gold','Scegli talento');
      b.onclick=()=>L.scegliTalento(k);
      r.appendChild(b);
      c.appendChild(r);
    }

    /* cosa dà il livello dopo: è la ragione per cui uno continua */
    if(!p.massimo){
      const P = L.premioDi(k, p.liv+1);
      if(P){
        const n = el('div','liv-prossimo' + (P.chiave ? ' chiave' : ''));
        n.appendChild(el('span','liv-prossimo-eti', 'Al livello ' + (p.liv+1) + ':'));
        const v = el('span','liv-prossimo-val');
        v.appendChild(el('span','liv-moneta'));
        v.appendChild(el('span',null, P.oro.toLocaleString('it-IT') + '  '));
        v.appendChild(icona(P.item, 22));
        v.appendChild(el('span',null, IT.nome(P.item) + ' ×' + P.n));
        n.appendChild(v);
        c.appendChild(n);
      }
    }

    /* la scala intera, a pallini: dove sei e dove si va */
    const scala = el('div','liv-scala');
    for(let i=1;i<=MAX;i++){
      const P = L.premioDi(k, i);
      const d = el('div','liv-passo' + (i<=p.liv ? ' fatto' : '') +
                            (i===p.liv+1 ? ' ora' : '') + (P && P.chiave ? ' chiave' : ''), String(i));
      d.title = P ? 'Livello '+i+': '+P.oro+' monete e '+IT.nome(P.item)+' ×'+P.n
                  : 'Livello '+i;
      scala.appendChild(d);
    }
    c.appendChild(scala);

    body.appendChild(c);
  }
};

})();
