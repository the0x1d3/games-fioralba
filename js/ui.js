/* ===================================================================
   FIORALBA — ui.js
   Interfaccia: inventario, negozi, artigianato, dialoghi, diario.
   =================================================================== */
(function(){
'use strict';

const U = {};
window.UI = U;

const $ = s=>document.querySelector(s);
const $$ = s=>Array.from(document.querySelectorAll(s));

/* ===================================================================
   HELPER OGGETTI (gestisce anche gli id composti tipo "vino:uva")
   =================================================================== */
const IT = {};
window.IT = IT;

IT.base = id => id.indexOf(':')>0 ? id.split(':')[0] : id;
IT.src  = id => id.indexOf(':')>0 ? id.split(':')[1] : null;

IT.nome = function(id){
  if(id.indexOf(':')>0){
    const [k,s] = id.split(':');
    const C = DATA.CROPS[s] || DATA.ITEMS[s];
    const n = C ? C.nome : s;
    /* Il nome del prodotto si COMPONE, e comporre è la cosa che una
       traduzione rompe per prima: in italiano il contenitore va davanti
       («Conserva di Rapa»), in inglese dietro («Turnip Preserves»).
       Concatenando si otteneva «Conserva di Turnip» — metà tradotto e
       con l'ordine sbagliato. Il modello passa dal catalogo, e ogni
       lingua mette il segnaposto dove le serve. */
    const F = (m)=> window.LINGUA ? LINGUA.f(m, n) : m.replace('{0}', n);
    if(k==='conserva') return F('Conserva di {0}');
    if(k==='vino')     return F(DATA.FRUTTA.indexOf(s)>=0 ? 'Vino di {0}' : 'Distillato di {0}');
    if(k==='succo')    return F('Succo di {0}');
    return n;
  }
  const I = DATA.ITEMS[id];
  return I ? I.nome : id;
};

IT.prezzo = function(id){
  if(id.indexOf(':')>0){
    const [k,s] = id.split(':');
    const base = (DATA.ITEMS[s] && DATA.ITEMS[s].prezzo) || 30;
    if(k==='conserva') return base*2 + 50;
    if(k==='vino')     return base*3;
    if(k==='succo')    return Math.floor(base*2.25);
    return base;
  }
  const I = DATA.ITEMS[id];
  return I && I.prezzo ? I.prezzo : 0;
};

IT.cat = function(id){
  if(id.indexOf(':')>0) return 'artigianato';
  const I = DATA.ITEMS[id];
  return I ? I.cat : 'materiale';
};

IT.desc = function(id){
  if(id.indexOf(':')>0){
    const k = id.split(':')[0];
    return k==='conserva' ? 'Chiusa a caldo, dura tutto l\'inverno.'
         : k==='vino' ? 'Migliora stando ferma. Come certe persone.'
         : 'Dolce, denso, con la polpa.';
  }
  const I = DATA.ITEMS[id];
  return I && I.desc ? I.desc : '';
};

IT.energia = function(id){
  if(id.indexOf(':')>0) return Math.floor(IT.prezzo(id)*0.22);
  const I = DATA.ITEMS[id];
  if(I && I.energia) return I.energia;
  if(I && (I.cat==='raccolto'||I.cat==='foraggio')) return Math.max(8, Math.floor((I.prezzo||20)*0.35));
  if(I && I.cat==='pesce' && !I.spazzatura) return Math.max(10, Math.floor((I.prezzo||20)*0.3));
  if(I && (id==='uovo'||id==='latte'||id==='miele')) return 30;
  return 0;
};

IT.commestibile = id => IT.energia(id) > 0;

/* ===================================================================
   DOVE SI TROVA

   Segnalato in beta due volte con parole diverse: «la lavanda non è
   ancora presente» e «l'uva non si sa dove sia». Nessuna delle due
   mancava — la lavanda è un foraggio d'estate e ne spuntano più di cento
   in una stagione, l'uva cresce dai semi che Bruno vende in autunno. Il
   difetto era che l'oggetto non lo diceva: sapeva a quanto si vende, non
   dove lo si prende.

   Questa riga è *derivata* dai dati, non scritta a mano oggetto per
   oggetto: se domani si sposta una coltura di stagione o si cambia una
   ricetta, la spiegazione si aggiorna da sola invece di restare a
   raccontare il gioco di ieri.
   =================================================================== */
/* I nomi delle stagioni si prendono da DATA, non da una tabella qui.

   C'era `NOMI_STAGIONE = { primavera:'primavera', … }`, cioè gli stessi
   nomi scritti una seconda volta in minuscolo — e scritti in italiano,
   quindi «Bruno vende in primavera» restava «in primavera» anche
   giocando in inglese. `DATA.SEASONS` invece il motore della lingua lo
   traduce sul posto, e da lì i nomi arrivano già nella lingua giusta.
   Minuscoli perché stanno in mezzo a una frase: in inglese le stagioni
   vogliono la maiuscola solo a inizio periodo, e qui non ci stanno mai. */
function nomeStagione(id){
  const S = (DATA.SEASONS || []).find(s => s.id === id);
  const n = S ? S.nome : id;
  return window.LINGUA && LINGUA.attiva === 'en' ? n.toLowerCase() : String(n).toLowerCase();
}
function elenco(a){
  const v = a.filter(Boolean);
  if(!v.length) return '';
  if(v.length===1) return v[0];
  /* La congiunzione passa da un MODELLO e non da `T('e')`.

     Con `T('e')` restava «spring, autumn e winter»: il censimento
     scarta le stringhe più corte di due caratteri — sono id, chiavi,
     simboli — quindi quella «e» non l'avrebbe mai chiesta a nessuno, e
     l'elenco sarebbe rimasto mezzo italiano senza che niente lo
     segnalasse. Come modello invece è una frase come le altre, e in
     inglese può anche diventare «, and» con la virgola. */
  return F('{0} e {1}', v.slice(0,-1).join(', '), v[v.length-1]);
}
function stagioni(a){ return elenco((a||[]).map(nomeStagione)); }


/* la ricetta che produce questo oggetto, se ce n'è una */
function ricettaDi(id){
  for(const r of DATA.CRAFT)  if(r.id===id) return {ing:r.ing, dove:'al banco da lavoro (tasto C)'};
  for(const r of DATA.CUCINA) if(r.id===id) return {ing:r.ing, dove:'ai fornelli di casa'};
  return null;
}

/* ===================================================================
   DOVE SI TROVA

   Ricava la provenienza dai dati invece di tenerne un elenco a mano,
   così resta vera da sola quando i dati cambiano.

   OGNI FRASE È UN MODELLO, non una somma di pezzi. Prima erano
   concatenazioni — `'Cresce nel campo dai Semi di ' + C.nome + ', che
   Bruno vende in ' + stagioni(...)` — e in inglese uscivano metà e
   metà: «Cresce nel campo dai Semi di **Turnip**, che Bruno vende in
   primavera». Misurato: 67 righe su 121, il 55%. È lo stesso difetto di
   «Vino di Grapes», e la cura è la stessa: il {0} va dove lo vuole la
   lingua d'arrivo, non dove stava in italiano.
   =================================================================== */
IT.dove = function(id){
  /* prodotti delle macchine: conserva:rapa, vino:uva… */
  if(id.indexOf(':')>0){
    const k = id.split(':')[0], s = IT.nome(IT.src(id));
    if(k==='conserva') return F('Esce dalla <b>barattoliera</b>, mettendoci dentro {0}.', s);
    if(k==='vino')     return F('Esce dalla <b>botte</b>, mettendoci dentro {0}. Ci vogliono quattro giorni.', s);
    if(k==='succo')    return F('Esce dalla <b>botte</b>, mettendoci dentro {0}.', s);
    return null;
  }
  const I = DATA.ITEMS[id];
  if(!I) return null;

  /* semi: quando si seminano e chi li vende */
  if(I.cat === 'seme'){
    const c = id.replace(/^seme_/, '');
    const C = DATA.CROPS[c];
    if(C){
      const giorni = C.fasi.reduce((a,b)=>a+b, 0);
      /* Tre frasi e non una con dei pezzi opzionali incollati: chi
         traduce deve poter girare l'ordine di tutta la frase, e con
         «...» + «...» + «...» non può. */
      const base = C.ricresce
        ? F('Si semina in <b>{0}</b>, e ci mette <b>{1} giorni</b> a maturare; poi ricresce ogni {2} giorni senza riseminare.',
            stagioni(C.stagioni), giorni, C.ricresce)
        : F('Si semina in <b>{0}</b>, e ci mette <b>{1} giorni</b> a maturare.',
            stagioni(C.stagioni), giorni);
      return base + ' ' + T('Lo vende <b>Bruno</b> in bottega, ma solo nella sua stagione.');
    }
  }
  /* raccolti: si risale al seme */
  if(DATA.CROPS[id]){
    const C = DATA.CROPS[id];
    return F('Cresce nel campo dai <b>Semi di {0}</b>, che <b>Bruno</b> vende in <b>{1}</b>. Fuori stagione la pianta appassisce.',
             C.nome, stagioni(C.stagioni));
  }
  /* foraggio: si raccoglie per terra, e conta la stagione */
  if(I.cat === 'foraggio'){
    /* Quattro di questi vengono anche dai cespugli carichi, uno per
       stagione: chi ne taglia uno con la falce se li ritrova in mano
       senza che nessuno gliel'avesse detto. */
    const daCespuglio = Object.keys(DATA.CESPUGLIO||{}).find(s => DATA.CESPUGLIO[s] === id);
    /* La stagione va ripetuta: la bacca d'inverno si trova sul Passo
       tutto l'anno, ma sui cespugli solo d'inverno, e senza dirlo la
       riga si contraddiceva da sola. */
    const cespuglio = daCespuglio
      ? ' ' + F('Si trova anche sui <b>cespugli carichi</b> in <b>{0}</b>, tagliandoli con la <b>falce</b>.',
                nomeStagione(daCespuglio))
      : '';
    if(['bacca_inverno','radice_gelata','fiocco_cristallo'].indexOf(id) >= 0)
      return T('Si raccoglie da terra sul <b>Passo di montagna</b>, dove è sempre inverno: c\'è tutto l\'anno.') + cespuglio;
    return F('Si raccoglie da terra in <b>{0}</b>, sparso per la valle — prato, bosco, radure. Nelle altre stagioni non c\'è.',
             nomeStagione(I.stagione)) + cespuglio;
  }
  /* pesci */
  if(I.cat === 'pesce' && !I.spazzatura){
    const dove = I.luogo === 'fiume' ? T('nel fiume del paese')
               : I.luogo === 'lago'  ? T('nel lago del bosco')
               : I.luogo === 'mare'  ? T('in mare, alla Costa')
                                     : T('nelle acque della valle');
    const diStagione = I.stagioni && I.stagioni.length < 4;
    /* Quattro frasi intere invece di una costruita a pezzi: in inglese
       «only after sunset» non sta dove sta «e solo dopo il tramonto», e
       incollando si finiva con la virgola italiana in mezzo. */
    if(diStagione && I.notte)
      return F('Si pesca {0}, in <b>{1}</b>, e solo <b>dopo il tramonto</b>.', dove, stagioni(I.stagioni));
    if(diStagione) return F('Si pesca {0}, in <b>{1}</b>.', dove, stagioni(I.stagioni));
    if(I.notte)    return F('Si pesca {0}, e solo <b>dopo il tramonto</b>.', dove);
    return F('Si pesca {0}.', dove);
  }
  /* minerali */
  if(I.cat === 'minerale'){
    const rari = ['oro','ametista','gemma_luna','geode','quarzo'];
    return T(rari.indexOf(id)>=0
      ? 'Si spacca col <b>piccone</b> nella <b>miniera</b>, e più si scende più se ne trova.'
      : 'Si spacca col <b>piccone</b> nella <b>miniera</b>.');
  }
  /* roba che si costruisce o si cucina */
  const r = ricettaDi(id);
  if(r){
    const lista = Object.keys(r.ing).map(k => IT.nome(k) + ' ×' + r.ing[k]).join(', ');
    return F(r.dove === 'ai fornelli di casa'
      ? 'Si cucina <b>ai fornelli di casa</b> con: <b>{0}</b>.'
      : 'Si fa <b>al banco da lavoro</b> (tasto C) con: <b>{0}</b>.', lista);
  }
  /* i pochi casi che i dati non sanno raccontare da soli */
  const AMANO = {
    legna:'Si prende abbattendo alberi e ceppi con l\'<b>ascia</b>.',
    pietra:'Si prende spaccando sassi col <b>piccone</b>.',
    fibra:'Si prende tagliando le <b>erbacce</b> con la falce, o a mani nude.',
    argilla:'Salta fuori <b>zappando</b> la terra, ogni tanto.',
    carbone:'Dai sassi neri della <b>miniera</b>, o bruciando legna nella fornace.',
    linfa:'Ogni tanto la lascia un <b>albero abbattuto</b>.',
    uovo:'Lo fanno le <b>galline</b> del pollaio, ogni mattina.',
    uovo_oro:'Lo fa una gallina molto contenta. Trattale bene.',
    miele:'Dall\'<b>arnia</b>, ogni quattro giorni. Meglio se ci sono fiori intorno.',
    latte:'Lo vende <b>Bruno</b> in bottega: viene dalla cascina di là dal colle.',
    gallina:'La vende <b>Bruno</b>. Ti serve prima il <b>pollaio</b>.',
    concime:'Lo vende <b>Bruno</b>, o si fa al banco da lavoro con fibra e carbone.'
  };
  if(AMANO[id]) return T(AMANO[id]);
  if(I.cat === 'attrezzo') return T('Ce l\'hai dall\'inizio. <b>Tobia</b>, alla fucina, lo può potenziare.');
  /* le quattro braci sono il filo di tutta la partita: se c'è una cosa
     che deve dire dove si prende, è questa */
  if(/^brace_/.test(id)){
    return F('La consegna il <b>Santuario</b>, nel bosco, quando gli porti le cinque offerte di <b>{0}</b>. Le quattro braci insieme riaccendono la Lanterna.',
             nomeStagione(id.replace('brace_','')));
  }
  if(id === 'medaglione') return T('Te l\'ha lasciato <b>Nonna Ilde</b>. Non si vende e non si perde.');
  if(I.spazzatura) return T('Roba che ogni tanto abbocca al posto di un pesce. Si butta, o si vende per due soldi.');
  return null;
};

/* icona come elemento canvas */
function ico(id, size){
  const c = document.createElement('canvas');
  c.width=c.height=32;
  const x=c.getContext('2d');
  x.imageSmoothingEnabled=false;
  x.drawImage(ART.icon(id),0,0);
  if(size){ c.style.width=size+'px'; c.style.height=size+'px'; }
  return c;
}
U.ico = ico;

/* ===================================================================
   TOAST
   =================================================================== */
/* I messaggi che annunciano un oggetto — un pesce preso, la legna di un
   albero — sono quelli che si vogliono vedere, ed erano quelli che si
   vedevano peggio: uguali a tutti gli altri, e schiacciati contro il
   nome dell'attrezzo sopra la barra. Adesso hanno una faccia loro
   (icona grande, nome in oro) e stanno più in alto; e soprattutto se lo
   stesso oggetto arriva di nuovo mentre il messaggio è ancora lì, non
   se ne impila un secondo: si aggiorna quello che c'è. Chi taglia tre
   alberi di fila vedeva tre cartelli sovrapposti, adesso ne vede uno
   che conta. */
/* La traduzione sta qui e non ai punti di chiamata: il testo si scrive
   in italiano dove serve — e lì resta leggibile — e diventa inglese
   nell'ultimo istante, mentre esce a schermo. Cinque strozzature invece
   di milleduecento righe toccate. */
const T = s => (window.LINGUA ? LINGUA.t(s) : s);
/* Le frasi con un pezzo variabile dentro non si incollano col `+`: in
   inglese l'ordine delle parole cambia e verrebbe fuori metà frase
   tradotta con la grammatica italiana — è già successo con «Vino di
   Grapes». E i numeri passano dal separatore della lingua: 1.400 in
   italiano, 1,400 in inglese. */
const F = (modello, ...pezzi)=> window.LINGUA
  ? LINGUA.f(modello, ...pezzi)
  : modello.replace(/\{(\d+)\}/g, (_,i)=>pezzi[i]);
const NUM = v => (window.LINGUA ? LINGUA.n(v) : String(v));

U.toast = function(msg, tipo, itemId){
  msg = T(msg);
  const box = $('#toasts');

  if(itemId){
    const gia = box.querySelector('.toast.oggetto[data-item="'+CSS.escape(itemId)+'"]:not(.out)');
    if(gia){
      gia.querySelector('.toast-testo').innerHTML = msg;
      gia.classList.remove('ripeti');
      void gia.offsetWidth;                    // forza il riavvio dell'animazione
      gia.classList.add('ripeti');
      riarmaTimer(gia, msg);
      return;
    }
  }

  const el = document.createElement('div');
  el.className = 'toast'+(tipo? ' '+tipo : '')+(itemId? ' oggetto':'');
  if(itemId){
    el.dataset.item = itemId;
    el.appendChild(ico(itemId));
  }
  const s = document.createElement('span');
  s.className = 'toast-testo';
  /* innerHTML come il prompt, le lettere e i dialoghi: qualche messaggio
     porta un grassetto — «Hai imparato: <b>Caccia</b>» — e con textContent
     il tag si leggeva. I testi sono tutti nostri, scritti in DATA e nei
     moduli: qui non arriva niente che abbia scritto il giocatore. */
  s.innerHTML = msg;
  el.appendChild(s);
  box.appendChild(el);
  riarmaTimer(el, msg);
  while(box.children.length>4) box.firstChild.remove();
};

/* durata proporzionale alla lunghezza: i messaggi lunghi restano di più */
function riarmaTimer(el, msg){
  if(el._timer) clearTimeout(el._timer);
  const dur = Math.min(8500, Math.max(4200, String(msg).length*75));
  el._timer = setTimeout(()=>{
    el.classList.add('out');
    setTimeout(()=>el.remove(), 400);
  }, dur);
}

/* ===================================================================
   PROMPT DI INTERAZIONE
   =================================================================== */
U.prompt = function(testo){
  const p = $('#prompt');
  if(!testo){ p.classList.add('hidden'); return; }
  testo = T(testo);
  if(p.dataset.t !== testo){ p.dataset.t = testo; p.innerHTML = testo; }
  p.classList.remove('hidden');
};

/* ===================================================================
   MODALE
   =================================================================== */
let modalAperta = null;

/* Il terzo argomento accetta due cose. Storicamente era `onClose`, una
   funzione, e resta valido. Adesso può anche essere un oggetto di
   opzioni, di cui una sola: `senzaChiusura`, che toglie la crocetta e il
   click sullo sfondo. Serve alle finestre che stanno fra il giocatore e
   la sua partita — il codice appena nato, la scelta fra due partite che
   non combaciano — dove chiudere per sbaglio costa qualcosa che non si
   recupera. Chiuderle si può, ma solo dai loro pulsanti. */
U.modal = function(titolo, costruisci, terzo){
  const opz = (typeof terzo === 'function') ? { onClose:terzo } : (terzo || {});
  const onClose = opz.onClose || null;
  titolo = T(titolo);
  // se una modale era già aperta, il suo onClose va eseguito lo stesso:
  // altrimenti chi ci aveva agganciato qualcosa da fermare (le demo
  // animate, per dire) se lo ritrova a girare a vuoto per sempre
  if(modalAperta && modalAperta.onClose){
    const cb = modalAperta.onClose;
    modalAperta = null;
    try{ cb(); }catch(e){ console.warn('[ui] onClose della modale precedente', e); }
  }
  $('#modal-title').textContent = titolo;
  const body = $('#modal-body');
  body.innerHTML = '';
  costruisci(body);
  $('#modal-wrap').classList.remove('hidden');
  $('#modal-close').classList.toggle('hidden', !!opz.senzaChiusura);
  modalAperta = { titolo, costruisci, onClose, senzaChiusura: !!opz.senzaChiusura };
  SND.play('menu');
};

/* ===================================================================
   LA PRIMA PESCATA
   Le tre fasi non si indovinano guardando: chi non le conosce lascia
   scappare la prima abboccata senza capire che ci fosse da fare
   qualcosa. Si spiega una volta sola, con la pista disegnata accanto
   invece che descritta a parole.
   =================================================================== */
function pistaFinta(evidenzia){
  const c = document.createElement('div');
  c.className = 'pesca-pista';
  const barra = document.createElement('div');
  barra.className = 'pesca-barra' + (evidenzia==='barra' ? ' acceso' : '');
  const pesce = document.createElement('div');
  pesce.className = 'pesca-pesce'; pesce.textContent = '🐟';
  c.appendChild(barra); c.appendChild(pesce);
  return c;
}

U.spiegaPesca = function(poi){
  const PASSI = [
    { n:'1', tit:'Aspetta che abbocchi',
      txt:'La lenza è in acqua. Ci mette da uno a cinque secondi: quando senti il tonfo e vedi lo schizzo, qualcosa ha abboccato.' },
    { n:'2', tit:'Ferra subito',
      txt:'Hai poco più di due secondi per premere <b>Spazio</b>. Se aspetti troppo il pesce se ne va con l\'esca.' },
    { n:'3', tit:'Tienilo nella barra',
      txt:'Il pesce sale e scende. <b>Tieni premuto Spazio</b> per far salire la barra verde, <b>lascia</b> per farla scendere: '+
          'ti basta tenerci dentro il pesce. Finché ci sta, la barra dorata a destra si riempie; quando riesce, cala — ma più piano.' }
  ];
  U.modal('Come si pesca', body=>{
    const intro = document.createElement('div');
    intro.className = 'muted'; intro.style.marginBottom = '14px';
    intro.textContent = 'È la tua prima volta con la canna. Tre cose, poi non se ne parla più.';
    body.appendChild(intro);

    for(const p of PASSI){
      const r = document.createElement('div'); r.className = 'pesca-passo';
      const n = document.createElement('div'); n.className = 'pesca-num'; n.textContent = p.n;
      const t = document.createElement('div');
      t.innerHTML = '<div class="rname">'+p.tit+'</div><div class="rdesc">'+p.txt+'</div>';
      r.appendChild(n); r.appendChild(t);
      if(p.n === '3') r.appendChild(pistaFinta('barra'));
      body.appendChild(r);
    }

    const nota = document.createElement('div');
    nota.className = 'muted'; nota.style.margin = '4px 0 12px';
    nota.innerHTML = 'Più sali di livello in <b>Pesca</b>, più la barra diventa alta e più è facile tenerlo.';
    body.appendChild(nota);

    const b = document.createElement('button'); b.className = 'btn gold';
    b.textContent = 'Ho capito, lancia la lenza';
    b.onclick = ()=>{ U.chiudiModal(); };
    body.appendChild(b);
  }, ()=>{ if(typeof poi === 'function') poi(); });
};

/* ===================================================================
   QUANTE NE PRENDI

   Cliccare una pila prendeva tutto. Con 282 legna nella cassa e una
   cassa da costruire che ne vuole 20, toccava portarsi via tutto il
   mucchio, costruire, e rimettere dentro il resto: tre gesti per farne
   uno.

   Il clic su una pila da uno resta immediato — non c'è niente da
   scegliere — e su una pila più grande si apre questo, ancorato alla
   casella: qualche scorciatoia per i casi soliti e un campo per i
   numeri che non sono soliti.
   =================================================================== */
let quantiAperto = null;

function chiudiQuanti(){
  if(quantiAperto){ quantiAperto.remove(); quantiAperto = null; }
}
U.chiudiQuanti = chiudiQuanti;

/* `cella` è l'elemento a cui ancorarsi, `max` quante ce ne sono,
   `poi(n)` che fare col numero scelto. */
function chiediQuanti(cella, max, etichetta, verbo, poi){
  chiudiQuanti();
  const box = document.createElement('div'); box.className = 'quanti';
  box.innerHTML = '<div class="quanti-tit">'+verbo+' '+etichetta+' — quante?</div>';

  const riga = document.createElement('div'); riga.className = 'quanti-riga';
  const meno = document.createElement('button'); meno.className='quanti-b'; meno.textContent='−';
  const campo = document.createElement('input');
  campo.type='number'; campo.className='quanti-n'; campo.min='1'; campo.max=String(max);
  campo.value = String(Math.min(max, 20) || 1);
  const piu = document.createElement('button'); piu.className='quanti-b'; piu.textContent='+';
  const limita = ()=>{
    let v = parseInt(campo.value,10);
    if(!isFinite(v)) v = 1;
    campo.value = String(Math.max(1, Math.min(max, v)));
  };
  meno.onclick = ()=>{ campo.value = String(Math.max(1, (parseInt(campo.value,10)||1) - 1)); };
  piu.onclick  = ()=>{ campo.value = String(Math.min(max, (parseInt(campo.value,10)||0) + 1)); };
  campo.oninput = limita;
  campo.onkeydown = e=>{
    e.stopPropagation();
    if(e.key==='Enter'){ limita(); const n=parseInt(campo.value,10); chiudiQuanti(); poi(n); }
    if(e.key==='Escape') chiudiQuanti();
  };
  riga.appendChild(meno); riga.appendChild(campo); riga.appendChild(piu);
  box.appendChild(riga);

  const scorciatoie = document.createElement('div'); scorciatoie.className='quanti-scorc';
  const chip = (testo, n)=>{
    if(n < 1 || n > max) return;
    const b=document.createElement('button'); b.className='quanti-chip'; b.textContent=testo;
    b.onclick=()=>{ chiudiQuanti(); poi(n); };
    scorciatoie.appendChild(b);
  };
  chip('1', 1); chip('10', 10); chip('50', 50);
  if(max > 3) chip('metà ('+Math.floor(max/2)+')', Math.floor(max/2));
  chip('tutte ('+max+')', max);
  box.appendChild(scorciatoie);

  const az = document.createElement('div'); az.className='quanti-az';
  const ok = document.createElement('button'); ok.className='btn gold'; ok.textContent=verbo;
  ok.onclick = ()=>{ limita(); const n=parseInt(campo.value,10); chiudiQuanti(); poi(n); };
  const no = document.createElement('button'); no.className='btn'; no.textContent='Annulla';
  no.onclick = chiudiQuanti;
  az.appendChild(ok); az.appendChild(no);
  box.appendChild(az);

  document.getElementById('modal-body').appendChild(box);
  quantiAperto = box;

  /* Si ancora alla casella. Le coordinate sono quelle di `offsetTop`,
     non del rettangolo sullo schermo: `#modal-body` è il genitore
     posizionato, quindi sono già le stesse in cui vive il riquadro, e
     non c'è da rincorrere né lo scorrimento né il bordo — un primo giro
     fatto con getBoundingClientRect lo piazzava 17px più su, addosso
     alla casella cliccata. */
  const corpo = document.getElementById('modal-body');
  const bw = box.offsetWidth, bh = box.offsetHeight;
  let left = cella.offsetLeft + cella.offsetWidth/2 - bw/2;
  let top  = cella.offsetTop + cella.offsetHeight + 6;
  left = Math.max(4, Math.min(corpo.clientWidth - bw - 4, left));
  // se sotto non ci sta, si ribalta sopra la casella
  if(top + bh > corpo.scrollTop + corpo.clientHeight)
    top = Math.max(4, cella.offsetTop - bh - 6);
  box.style.left = Math.round(left)+'px';
  box.style.top  = Math.round(top)+'px';
  campo.focus(); campo.select();
}

/* `daFuori` è vero quando a chiudere è la crocetta, lo sfondo o Escape:
   quelle tre strade le finestre senza chiusura le rifiutano. I pulsanti
   dentro la finestra chiamano senza argomenti e chiudono sempre. */
U.chiudiModal = function(daFuori){
  chiudiQuanti();
  if(!modalAperta) return;
  if(daFuori && modalAperta.senzaChiusura) return;
  $('#modal-wrap').classList.add('hidden');
  const cb = modalAperta.onClose;
  modalAperta = null;
  if(cb) cb();
};

U.modalAperta = ()=> !!modalAperta;

U.aggiorna = function(){
  if(!modalAperta) return;
  // il riquadro delle quantità vive dentro al corpo: si svuota con lui
  quantiAperto = null;
  const body = $('#modal-body');
  const sc = body.scrollTop;
  body.innerHTML='';
  modalAperta.costruisci(body);
  body.scrollTop = sc;
};

$('#modal-close').addEventListener('click', ()=>U.chiudiModal(true));
$('#modal-wrap').addEventListener('click', e=>{ if(e.target.id==='modal-wrap') U.chiudiModal(true); });

/* ===================================================================
   DIALOGO
   =================================================================== */
let dlgCoda = [], dlgAttivo = false, dlgFine = null, dlgTyping = null, dlgPassi = null;

/* I tag che si chiudono da soli: non vanno rimessi in piedi a ogni passo */
const TAG_VUOTI = { br:1, hr:1, img:1, wbr:1 };

/* La macchina da scrivere lavora su HTML, non su testo.

   Prima scriveva con `textContent +=`, un carattere per volta, e nei
   dialoghi ci sono i grassetti: «Prima cosa: <b>mettitelo in mano</b>»
   arrivava a schermo con i tag in chiaro, letti come parole. Succedeva
   solo nei dialoghi perché lettere e finestre usano `innerHTML`.

   Qui la riga si spezza in passi: ogni passo è quello che si è svelato
   fin lì, **coi tag ancora aperti richiusi in fondo**. Senza quelle
   chiusure il browser le mette da sé a ogni fotogramma, e il grassetto
   si allarga e si restringe mentre la frase si scrive. Un tag non
   consuma un battito — appare insieme al carattere che protegge — e
   un'entità (`&egrave;`) ne consuma uno solo, come la lettera che è. */
function passiDiRiga(html){
  const passi = [], aperti = [];
  let out = '';
  const conChiusure = ()=>{
    let s = out;
    for(let k=aperti.length-1;k>=0;k--) s += '</'+aperti[k]+'>';
    return s;
  };
  for(let i=0;i<html.length;){
    const c = html[i];
    if(c==='<'){
      const fine = html.indexOf('>', i);
      /* dev'essere un tag per davvero, non un minore che ha la sfortuna
         di avere un maggiore più avanti nella frase: «3 < 5 e 7 > 2» non
         è markup, e senza questo controllo si mangerebbe mezza riga in un
         battito solo */
      const tag = fine > i ? html.slice(i, fine+1) : '';
      if(tag && /^<\/?[a-zA-Z][\w-]*(\s[^<>]*)?\/?>$/.test(tag)){
        const m = tag.match(/^<\s*(\/?)\s*([a-zA-Z][\w-]*)/);
        out += tag;
        if(m){
          const nome = m[2].toLowerCase();
          if(m[1]){ const j = aperti.lastIndexOf(nome); if(j>=0) aperti.splice(j,1); }
          else if(!/\/\s*>$/.test(tag) && !TAG_VUOTI[nome]) aperti.push(nome);
        }
        i = fine+1;
        continue;
      }
    }
    if(c==='&'){
      const fine = html.indexOf(';', i);
      if(fine > i && fine-i <= 10){
        out += html.slice(i, fine+1); i = fine+1;
        passi.push(conChiusure());
        continue;
      }
    }
    out += c; i++;
    passi.push(conChiusure());
  }
  if(!passi.length) passi.push(html);
  return passi;
}

U.dialogo = function(npcId, righe, opzioni){
  opzioni = opzioni || {};
  const N = DATA.NPCS[npcId];
  dlgCoda = (Array.isArray(righe) ? righe.slice() : [righe]).map(T);
  if(opzioni.scelte) for(const s of opzioni.scelte) s.testo = T(s.testo);
  dlgFine = opzioni.fine || null;
  dlgAttivo = true;
  const d = $('#dialogue');
  d.classList.remove('hidden');
  d.querySelector('.dlg-name').textContent = N ? N.nome : (opzioni.nome||'');
  const face = $('#dlg-face');
  const fx = face.getContext('2d');
  fx.imageSmoothingEnabled=false;
  fx.clearRect(0,0,96,96);
  if(N) fx.drawImage(ART.face(npcId, N.look), 0,0);
  d._scelte = opzioni.scelte || null;
  prossimaRiga();
};

function prossimaRiga(){
  const d = $('#dialogue');
  const txt = d.querySelector('.dlg-text');
  const ch  = d.querySelector('.dlg-choices');
  ch.innerHTML='';
  if(dlgTyping){ clearInterval(dlgTyping); dlgTyping=null; }

  if(!dlgCoda.length){
    if(d._scelte && d._scelte.length){
      d.querySelector('.dlg-next').style.display='none';
      for(const s of d._scelte){
        const b=document.createElement('button');
        b.textContent = s.testo;
        b.onclick = ()=>{ SND.play('menu'); U.chiudiDialogo(); if(s.azione) s.azione(); };
        ch.appendChild(b);
      }
      d._scelte = null;
      return;
    }
    U.chiudiDialogo();
    return;
  }
  d.querySelector('.dlg-next').style.display='';
  const riga = String(dlgCoda.shift());
  // effetto macchina da scrivere
  dlgPassi = passiDiRiga(riga);
  txt.innerHTML='';
  let i=0;
  dlgTyping = setInterval(()=>{
    if(i>=dlgPassi.length){ clearInterval(dlgTyping); dlgTyping=null; return; }
    txt.innerHTML = dlgPassi[i++];
    if(i%3===0) SND.play('menu');
  }, 16);
}

/* Toccare il riquadro lo fa avanzare.

   Si avanzava solo con Spazio, Invio o E — che su un telefono non ci
   sono: ogni conversazione era un vicolo cieco, e siccome tutta la
   storia passa di lì il gioco finiva alla prima battuta. Il gestore sta
   qui e non nei comandi a tocco perché è giusto anche col mouse: chi
   gioca da computer con una mano sul mouse cliccava sul riquadro e non
   succedeva niente.

   Si collega una volta sola, e non sulle scelte: quelle sono pulsanti
   veri, e un click che risale fino al riquadro avanzerebbe il dialogo
   annullando la scelta appena fatta. */
(function collegaTocchiDialogo(){
  const d = document.getElementById('dialogue');
  if(!d) return;
  d.addEventListener('click', e=>{
    if(e.target.closest('.dlg-choices')) return;
    U.avanzaDialogo();
  });
})();

U.avanzaDialogo = function(){
  if(!dlgAttivo) return false;
  const d = $('#dialogue');
  const txt = d.querySelector('.dlg-text');
  if(dlgTyping){
    /* Il commento diceva «completa subito la riga» e il codice invece
       spegneva soltanto il timer: la frase restava dov'era arrivata, a
       metà parola, e da fuori sembrava che al testo mancasse un pezzo.
       Chi legge in fretta premeva sempre, e si perdeva mezza storia
       credendo fosse scritta così. Completare vuol dire scriverla. */
    clearInterval(dlgTyping); dlgTyping=null;
    if(dlgPassi && dlgPassi.length) txt.innerHTML = dlgPassi[dlgPassi.length-1];
    return true;
  }
  if(d.querySelector('.dlg-choices').children.length) return true;
  prossimaRiga();
  return true;
};

U.chiudiDialogo = function(){
  dlgAttivo=false;
  dlgPassi=null;
  if(dlgTyping){ clearInterval(dlgTyping); dlgTyping=null; }
  $('#dialogue').classList.add('hidden');
  const f=dlgFine; dlgFine=null;
  if(f) f();
};

U.dialogoAttivo = ()=>dlgAttivo;

/* ===================================================================
   LETTERA
   =================================================================== */
U.lettera = function(key, dopo){
  const L = DATA.LETTERE[key];
  if(!L) { if(dopo) dopo(); return; }
  const el = $('#letter');
  el.querySelector('.letter-text').innerHTML = L.testo;
  el.classList.remove('hidden');
  const btn = el.querySelector('.letter-btn');
  btn.onclick = ()=>{ el.classList.add('hidden'); SND.play('menu'); if(dopo) dopo(); };
};

/* ===================================================================
   ZAINO, NEGOZIO, ARTIGIANATO, CUCINA, FUCINA e SANTUARIO — stanno in
   botteghe.js, che si carica dopo questo file e scrive sullo stesso
   oggetto UI. Da qui non si vede niente: si chiamano ancora
   UI.inventario(G), UI.negozio(G, 'bruno'), UI.fucina(G).
   =================================================================== */

/* ===================================================================
   DIARIO e MAPPA — stanno in diario.js, che si carica dopo questo file
   e scrive sullo stesso oggetto UI. Da qui non si vede niente: si
   chiamano ancora UI.diario(G, tab) e UI.mappa(G).
   =================================================================== */

/* ===================================================================
   MENU DI SISTEMA
   =================================================================== */
/* ===================================================================
   LE PARTITE SUL SERVER e la spia della sincronizzazione — stanno in
   partite.js, che si carica dopo questo file e scrive sullo stesso
   oggetto UI. Da qui non si vede niente: quelle finestre continuano a
   chiamarsi UI.scegliPartita, UI.mostraCodice, UI.segnalaSinc.
   =================================================================== */

/* ===================================================================
   IL MENU

   Era un elenco piatto: una riga di stato, i due cursori dell'audio, il
   pannello della sincronia, la lingua, la guida, e in fondo quattro
   pulsanti — fra cui «Salva partita», «Esporta» e «Importa» — tutti
   dello stesso peso. Dentro non si trovava niente, e soprattutto non
   c'era da nessuna parte la domanda che uno si fa davvero prima di
   chiudere: **la mia partita è al sicuro?**

   Adesso è a sezioni, e la prima è quella. Il resto scende per
   frequenza d'uso: si cambia lingua una volta nella vita, l'audio
   qualche volta, il salvataggio lo si guarda ogni sera.
   =================================================================== */

/* Da quanto tempo, detto come lo direbbe una persona. `quando()` qui
   sopra fa lo stesso mestiere ma parte da una data ISO del server;
   questo parte da un millisecondo nostro. */
function daQuanto(ms){
  if(!ms) return null;
  const min = Math.floor((Date.now() - ms) / 60000);
  if(min < 1)  return T('adesso');
  if(min === 1) return T('un minuto fa');
  if(min < 60) return min + ' ' + T('minuti fa');
  const h = Math.floor(min/60);
  if(h === 1) return T('un\'ora fa');
  if(h < 24) return h + ' ' + T('ore fa');
  const g = Math.floor(h/24);
  return g === 1 ? T('ieri') : g + ' ' + T('giorni fa');
}

/* --- il nome della partita ---------------------------------------
   Non è mai stato chiedibile: `statoIniziale()` metteva 'Contadino' e
   nessuno lo cambiava più. Con le partite sul server il nome smette di
   essere un dettaglio: è quello che si legge nel selettore per capire
   quale delle tre riprendere, e «Contadino, Contadino, Contadino» non
   aiuta nessuno. */
function rigaNome(G){
  const box = document.createElement('div');
  box.className = 'imp-nome';

  const inp = document.createElement('input');
  inp.type = 'text'; inp.className = 'imp-nome-inp';
  inp.value = G.nomeGiocatore || '';
  inp.maxLength = 24;
  inp.placeholder = T('Come ti chiami?');
  /* Il gioco ascolta la tastiera su window e non guarda da dove arriva
     il tasto: senza fermare l'evento qui, scrivere il proprio nome
     farebbe camminare il giocatore e aprirebbe lo zaino sulla «i». */
  for(const ev of ['keydown','keyup','keypress']) inp.addEventListener(ev, e=>e.stopPropagation());

  const b = document.createElement('button');
  b.className = 'btn'; b.textContent = T('Rinomina');
  b.disabled = true;

  const eco = document.createElement('div'); eco.className = 'imp-eco';

  const pulito = ()=> inp.value.trim().replace(/\s+/g, ' ');
  inp.addEventListener('input', ()=>{
    b.disabled = !pulito() || pulito() === G.nomeGiocatore;
    eco.textContent = '';
  });
  inp.addEventListener('keydown', e=>{ if(e.key==='Enter' && !b.disabled) b.click(); });

  b.onclick = ()=>{
    const n = pulito();
    if(!n) return;
    G.nomeGiocatore = n;
    b.disabled = true;
    eco.className = 'imp-eco';
    eco.textContent = T('Cambiato. Lo mando al server…');
    /* Si manda subito e non al prossimo autosave: il nome serve nel
       selettore, e il selettore legge la scheda del server. Rinominare
       e non vedere il nome cambiato di là è il genere di cosa che fa
       ricliccare il pulsante tre volte. */
    SINC.invia().then(r=>{
      if(r.ok){ eco.textContent = T('Fatto.'); }
      else if(r.conflitto){ eco.textContent = ''; U.conflittoSinc(G, r.locale, r.server); }
      else { eco.className = 'imp-eco male'; eco.textContent = T('Il nome è cambiato qui, ma non è ancora arrivato al server.'); }
      G.aggiornaHUD();
    });
  };

  const riga = document.createElement('div'); riga.className = 'imp-riga';
  riga.appendChild(inp); riga.appendChild(b);
  box.appendChild(riga);
  box.appendChild(eco);
  return box;
}

/* --- lo stato del salvataggio ------------------------------------ */
function pannelloSalvataggio(G){
  const box = document.createElement('div');
  const codice = SINC.codice();

  if(!codice){
    const p = document.createElement('div'); p.className='muted';
    p.textContent = T('Questa partita non è ancora sul server.');
    box.appendChild(p);
    return box;
  }

  /* La riga che risponde a «è al sicuro?». Tre stati e non due: sì,
     no, e «non ancora» — che è quello che capita per tre secondi dopo
     ogni mossa e non deve spaventare nessuno. */
  const stato = document.createElement('div');
  const sospeso = SINC.inSospeso();
  const ultimo = daQuanto(SINC.ultimoInvio());
  stato.className = 'imp-stato ' + (sospeso ? 'attesa' : (ultimo ? 'bene' : 'mai'));
  stato.innerHTML =
    sospeso
      ? '<b>' + T('C\'è del gioco non ancora arrivato al server.') + '</b><br>' +
        '<span>' + (ultimo ? T('Ultimo salvataggio riuscito:') + ' ' + ultimo : T('Nessun salvataggio riuscito, per ora.')) + '</span>'
      : (ultimo
        ? '<b>' + T('Tutto salvato sul server.') + '</b><br><span>' + T('Ultimo salvataggio:') + ' ' + ultimo + '</span>'
        : '<b>' + T('Non è ancora stato mandato niente.') + '</b><br><span>' + T('Succede al primo salvataggio.') + '</span>');
  box.appendChild(stato);

  const nota = document.createElement('div'); nota.className='muted imp-nota';
  nota.textContent = T('Il gioco salva da solo mentre giochi, e riprova ogni cinque minuti se qualcosa non passa.');
  box.appendChild(nota);

  const cod = document.createElement('div'); cod.className='sinc-codice';
  cod.textContent = codice;
  cod.title = T('Clicca per copiare');
  cod.onclick = ()=>{
    try{ navigator.clipboard.writeText(codice); U.toast(T('Codice copiato.'),'good'); }
    catch(e){ U.toast(T('Copialo a mano: ') + codice); }
  };
  box.appendChild(cod);

  const nota2 = document.createElement('div'); nota2.className='muted imp-nota';
  nota2.innerHTML = T('Scrivi questo codice su un altro computer o telefono per riprendere di là esattamente da qui. ' +
                      '<b>Chi ha il codice ha la partita</b>: non darlo in giro.');
  box.appendChild(nota2);

  const az = document.createElement('div'); az.className='imp-riga';

  const bSalva = document.createElement('button'); bSalva.className='btn gold';
  bSalva.textContent = T('Salva adesso');
  bSalva.onclick = ()=>{
    bSalva.disabled = true; bSalva.textContent = T('Salvo…');
    G.salva();                       // riempie il cassetto con lo stato di adesso
    SINC.invia().then(r=>{
      bSalva.disabled = false; bSalva.textContent = T('Salva adesso');
      if(r.ok) U.toast(T('Partita salvata sul server.'),'good');
      else if(r.conflitto) U.conflittoSinc(G, r.locale, r.server);
      else U.toast(r.errore || T('Non riesco a salvare adesso: riprovo da solo.'),'bad');
      U.aggiorna();
    });
  };
  az.appendChild(bSalva);

  const bAltra = document.createElement('button'); bAltra.className='btn blue';
  bAltra.textContent = T('Cambia partita');
  bAltra.onclick = ()=>{
    if(SINC.inSospeso()){
      U.toast(T('Prima faccio arrivare al server quello che manca.'),'bad');
      SINC.invia().then(()=>{ U.chiudiModal(); U.scegliPartita(); });
      return;
    }
    U.chiudiModal(); U.scegliPartita();
  };
  az.appendChild(bAltra);

  box.appendChild(az);
  return box;
}

function sezione(wrap, titolo){
  const t = document.createElement('div'); t.className='sectitle'; t.textContent = T(titolo);
  wrap.appendChild(t);
  const b = document.createElement('div'); b.className='imp-sez';
  wrap.appendChild(b);
  return b;
}

U.menu = function(G){
  U.modal(T('Impostazioni'), body=>{
    const wrap=document.createElement('div'); wrap.className='imp';

    /* ---- 1. LA PARTITA ---- */
    const s1 = sezione(wrap, 'La partita');
    s1.appendChild(rigaNome(G));
    const info=document.createElement('div'); info.className='muted imp-nota';
    info.innerHTML = G.stagione().nome + ' ' + G.giorno + ', ' + T('anno') + ' ' + G.anno +
                     ' · ' + (window.LINGUA ? LINGUA.n(G.oro) : G.oro) + ' ' + T('monete') +
                     ' · ' + G.braci + '/4 ' + T('braci accese');
    s1.appendChild(info);

    /* ---- 2. IL SALVATAGGIO ---- */
    if(window.SINC){
      const s2 = sezione(wrap, 'Il salvataggio');
      s2.appendChild(pannelloSalvataggio(G));
    }

    /* ---- 3. AUDIO ---- */
    const s3 = sezione(wrap, 'Audio');
    for(const [lab,key,val] of [['Musica','m',SND.volMusica],['Effetti','s',SND.volSfx]]){
      const r=document.createElement('div'); r.className='imp-cursore';
      const l=document.createElement('span'); l.textContent=T(lab);
      const inp=document.createElement('input');
      inp.type='range'; inp.min=0; inp.max=100; inp.value=Math.round(val*100);
      const n=document.createElement('b'); n.textContent=Math.round(val*100)+'%';
      inp.oninput=()=>{
        const v=inp.value/100;
        n.textContent = inp.value + '%';
        if(key==='m') SND.setVol(v, undefined); else SND.setVol(undefined, v);
      };
      r.appendChild(l); r.appendChild(inp); r.appendChild(n);
      s3.appendChild(r);
    }

    /* ---- 4. GRAFICA ----

       Nasce da una domanda di chi ci gioca: «sul telefono si vede
       benissimo, sul PC sgranato». È vero ed è spiegabile — il gioco
       tiene ferme le caselle in vista, quindi su un monitor grande un
       pixel di gioco diventa un blocchetto da tre — ma non c'è un valore
       giusto per tutti, quindi si sceglie.

       Il riquadro dice quante caselle stai vedendo e si aggiorna al
       clic: il baratto (più mondo contro pixel più grossi) si vede
       invece di doverlo leggere. */
    {
      const sg = sezione(wrap, 'Grafica');
      const riga=document.createElement('div'); riga.className='imp-riga';
      const nota=document.createElement('div'); nota.className='muted imp-nota';
      const scrivi=()=>{
        const c = REND.caselleInVista();
        nota.textContent = F('In vista: {0} caselle in larghezza, {1} in altezza.', c.larghe, c.alte);
      };
      for(const [n,lab] of [[null,'Automatica'],[2,'Pixel piccoli'],[3,'Medi'],[4,'Pixel grandi']]){
        const b=document.createElement('button');
        const attivo = REND.zoomScelto() === n;
        b.className='btn' + (attivo ? ' gold' : ' blue');
        b.textContent = T(lab);
        b.disabled = attivo;
        b.onclick=()=>{
          REND.impostaZoom(n);
          /* Il fondale è tagliato a misura della vista vecchia: senza
             buttarlo, cambiando zoom resta stampato quello di prima. */
          if(REND.invalidaTerreno) REND.invalidaTerreno();
          scrivi();
          U.aggiorna();
        };
        riga.appendChild(b);
      }
      sg.appendChild(riga);
      scrivi();
      sg.appendChild(nota);
    }

    /* ---- 5. LINGUA ---- */
    if(window.LINGUA && LINGUA.elenco.length > 1){
      const s4 = sezione(wrap, 'Lingua');
      const riga=document.createElement('div'); riga.className='imp-riga';
      for(const l of LINGUA.elenco){
        const b=document.createElement('button');
        b.className='btn' + (LINGUA.attiva===l.id ? ' gold' : ' blue');
        b.textContent = l.bandiera + ' ' + l.nome;
        b.disabled = LINGUA.attiva===l.id;
        b.onclick=()=>{
          LINGUA.set(l.id);
          /* Il gioco è già disegnato quando si cambia lingua: la finestra
             si ridisegna da sé, ma la barra degli attrezzi e l'HUD hanno
             i nomi di prima stampati dentro, e resterebbero nella lingua
             vecchia finché non li tocchi. */
          G.rinfrescaHotbar(); G.aggiornaHUD();
          U.aggiorna();
        };
        riga.appendChild(b);
      }
      s4.appendChild(riga);
    }

    /* ---- 5. GUIDA ---- */
    if(window.GUIDA && !GUIDA.completata()){
      const s5 = sezione(wrap, 'Guida');
      const bg=document.createElement('button'); bg.className='btn blue';
      bg.textContent = GUIDA.nascosta() ? T('🧭 Mostra i Primi passi') : T('🧭 Nascondi i Primi passi');
      bg.onclick=()=>{
        if(GUIDA.nascosta()){ GUIDA.mostra(); U.toast(T('Guida di nuovo a schermo.'),'good'); }
        else { GUIDA.nascondi(); U.toast(T('Guida nascosta.')); }
        U.aggiorna();
      };
      s5.appendChild(bg);
    }

    /* ---- 6. in fondo ---- */
    const fondo = document.createElement('div'); fondo.className='imp-fondo';
    const bh=document.createElement('button'); bh.className='btn blue'; bh.textContent=T('Come si gioca');
    bh.onclick=()=>{ U.chiudiModal(); U.comeSiGioca(); };
    fondo.appendChild(bh);

    /* Uscire manda quello che c'è e ASPETTA: la partita che conta è di
       là, e ricaricare senza attendere la conferma era il modo più
       facile di perdere l'ultimo minuto giocato. */
    const bq=document.createElement('button'); bq.className='btn red'; bq.textContent=T('Esci al titolo');
    bq.onclick=()=>{
      bq.disabled = true; bq.textContent = T('Salvo…');
      G.salva();
      SINC.invia().then(r=>{
        if(r.ok || !SINC.inSospeso()){ location.reload(); return; }
        bq.disabled = false; bq.textContent = T('Esci al titolo');
        U.toast(T('Non riesco a salvare: se esci adesso perdi l\'ultimo pezzo.'),'bad');
        U.aggiorna();
      }).catch(()=>location.reload());
    };
    fondo.appendChild(bq);
    wrap.appendChild(fondo);

    body.appendChild(wrap);
  });
};

/* pulsanti che aprono le scenette, in cima a "Come si gioca" */
function scorciatoieDemo(body){
  if(!window.DEMO) return;
  const t=document.createElement('div'); t.className='sectitle'; t.style.marginTop='0';
  t.textContent='Guarda come si fa';
  body.appendChild(t);
  const riga=document.createElement('div'); riga.className='demo-scorciatoie';
  for(const d of DEMO.elenco()){
    const b=document.createElement('button'); b.className='btn blue';
    b.appendChild(ico(d.icona));
    const s=document.createElement('span'); s.textContent=d.nome; b.appendChild(s);
    b.onclick=()=>U.demo(d.id);
    riga.appendChild(b);
  }
  body.appendChild(riga);
}

U.comeSiGioca = function(){
  U.modal('Come si gioca', body=>{
    scorciatoieDemo(body);
    const testo = document.createElement('div');
    body.appendChild(testo);
    testo.innerHTML = `
      <div class="sectitle">Movimento</div>
      <div class="muted">
        <b>WASD</b> o <b>frecce</b> per camminare. <b>Shift</b> per correre (consuma un filo di energia).
      </div>
      <div class="sectitle">Azioni</div>
      <div class="muted">
        <b>Spazio</b> o <b>clic sinistro</b>: usa l'oggetto in mano sulla casella davanti a te.<br>
        <b>E</b> o <b>clic destro</b>: interagisci (porte, casse, macchine, persone).<br>
        <b>1…9</b> oppure <b>rotellina</b>: cambia oggetto nella barra.<br>
        <b>Q</b>: getta a terra l'oggetto in mano.
      </div>
      <div class="sectitle">Menu</div>
      <div class="muted">
        <b>I</b> zaino · <b>C</b> artigianato · <b>J</b> diario · <b>M</b> mappa · <b>Esc</b> menu · <b>F</b> schermo intero.
      </div>
      <div class="sectitle">Il ciclo della giornata</div>
      <div class="muted">
        Si comincia alle 6:00. A <b>mezzanotte</b> crolli dalla stanchezza (e perdi qualche moneta),
        quindi torna a casa e usa il letto. Dormire recupera tutta l'energia e fa passare la notte:
        le piante crescono, i minerali ricompaiono, il bosco si riempie di nuovo.
      </div>
      <div class="sectitle">Coltivare</div>
      <div class="muted">
        <b>Zappa</b> il terreno → <b>pianta</b> i semi → <b>annaffia</b> ogni giorno → raccogli a mani nude.
        Se piove, ci pensa il cielo. Ogni seme cresce solo nella sua stagione: a fine stagione
        le piante fuori stagione appassiscono, quindi guarda il calendario.
      </div>
      <div class="sectitle">Guadagnare</div>
      <div class="muted">
        Metti la roba nella <b>cassa di consegna</b> vicino a casa: paga durante la notte.
        Oppure vendi da Bruno. Le <b>conserve</b> e il <b>vino</b> valgono molto di più del raccolto crudo.
      </div>
      <div class="sectitle">La storia</div>
      <div class="muted">
        Nel bosco, oltre il burrone, c'è un santuario spento da dodici anni.
        Costruisci il <b>ponte</b> dal fabbro, poi porta lì i frutti delle quattro stagioni.
      </div>
    `;
  });
};

/* ===================================================================
   DEMO ANIMATE — "guarda come si fa"
   Il lettore va fermato alla chiusura, altrimenti resta un
   requestAnimationFrame che gira a vuoto per tutta la partita.
   =================================================================== */
U.demo = function(id){
  if(!window.DEMO) return;
  let lettore = null;
  U.modal('Come si fa', body=>{
    const n=document.createElement('div'); n.className='muted';
    n.style.cssText='margin-bottom:10px;font-size:13px';
    n.textContent='Guarda e rifallo: le scenette girano da sole.';
    body.appendChild(n);
    const box=document.createElement('div'); box.className='demo-box';
    body.appendChild(box);
    if(lettore) lettore.ferma();
    lettore = DEMO.monta(box, id);
  }, ()=>{ if(lettore) lettore.ferma(); lettore=null; });
};

/* ===================================================================
   CARTELLO
   =================================================================== */
/* Un campo di testo e basta: chi pianta un cartello sa già cosa vuole
   scriverci. Il testo si salva mentre lo scrivi, non con un bottone
   «Conferma» — così com'è per il nome di una cassa, ed è la stessa
   promessa: quello che leggi qui dentro è quello che si legge fuori.

   Diciotto lettere, che è il taglio di `targhetta()` nel renderer: più
   in là il campo accetterebbe parole che il cartello poi non mostra.
   Il campo ferma i tasti prima di `window`, altrimenti scrivere
   «Pomodori» farebbe camminare il giocatore e gli darebbe due zappate,
   perché il gioco ascolta la tastiera lì e non guarda da dove arriva. */
U.cartello = function(obj){
  U.modal('Cartello', body=>{
    /* Stessa riga del nome di una cassa, etichetta compresa: `.cassa-nome`
       si allarga con `flex:1`, e da sola in mezzo alla finestra resterebbe
       una casellina da venti caratteri buttata a sinistra. */
    const riga=document.createElement('div'); riga.className='cassa-nome-riga';
    const et=document.createElement('label'); et.className='cassa-et';
    et.setAttribute('for','cartello-campo');
    et.innerHTML = '<span class="cassa-et-ico">🪧</span>' + T('Scritta');
    riga.appendChild(et);

    const inp=document.createElement('input');
    inp.type='text'; inp.className='cassa-nome'; inp.maxLength=18;
    inp.id='cartello-campo';
    inp.placeholder = T('Pomodori, Patate, Qui non zappare…');
    inp.value = obj.testo || '';

    const nota=document.createElement('div'); nota.className='cassa-nota';
    const aggiornaNota=()=>{
      nota.textContent = obj.testo
        ? T('Si legge da lontano, senza doverlo toccare.')
        : T('Scrivici sopra: quello che metti qui si legge da lontano, senza doverlo toccare.');
      nota.classList.toggle('fatta', !!obj.testo);
    };
    inp.oninput = ()=>{ obj.testo = inp.value.trim().slice(0,18) || null; aggiornaNota(); };
    inp.onkeydown = e=>{ e.stopPropagation(); if(e.key==='Enter') U.chiudiModal(); };
    inp.onkeyup = e=>e.stopPropagation();
    inp.onkeypress = e=>e.stopPropagation();

    riga.appendChild(inp);
    body.appendChild(riga);
    aggiornaNota();
    body.appendChild(nota);

    const piede=document.createElement('div'); piede.className='cassa-nota';
    piede.innerHTML = T('Per toglierlo di mezzo, una <b>picconata</b>: torna nello zaino.');
    body.appendChild(piede);

    // la tastiera del telefono si apre da sola, che è il gesto che serve
    setTimeout(()=>{ try{ inp.focus(); inp.select(); }catch(e){} }, 30);
  });
};

/* ===================================================================
   CASSA / DEPOSITO
   =================================================================== */
U.cassa = function(G, obj, ox, oy){
  U.modal(G.nomeCassa(obj), body=>{
    /* Il nome. Dieci casse tutte chiamate «Cassa» sono dieci casse da
       aprire una per una per ricordarsi dove stanno i semi.

       Stava in fila con «Ordina» e «Sposta», e in quella compagnia un
       campo di testo si legge come una casella di ricerca: chi ci ha
       giocato non l'ha trovato. Adesso ha una riga sua, con l'etichetta
       davanti, e sotto una frase che dice a cosa serve — cioè che quel
       nome si legge anche da fuori, senza aprire la cassa. */
    const rigaNome=document.createElement('div'); rigaNome.className='cassa-nome-riga';
    const et=document.createElement('label'); et.className='cassa-et';
    et.setAttribute('for','cassa-nome-campo');
    et.innerHTML = '<span class="cassa-et-ico">🏷️</span>Nome';
    rigaNome.appendChild(et);

    const inp=document.createElement('input');
    inp.type='text'; inp.className='cassa-nome'; inp.maxLength=18;
    inp.id='cassa-nome-campo';
    inp.placeholder='Semi, Minerali, Roba da vendere…';
    inp.value = obj.nome || '';
    const nota=document.createElement('div'); nota.className='cassa-nota';
    const aggiornaNota=()=>{
      nota.textContent = obj.nome
        ? 'Si legge su una targhetta sopra il coperchio.'
        : 'Dagliene uno: comparirà su una targhetta sopra il coperchio, e saprai cosa c\'è dentro senza aprirla.';
      nota.classList.toggle('fatta', !!obj.nome);
    };
    const salva=()=>{
      const v = inp.value.trim().slice(0,18);
      obj.nome = v || null;
      document.getElementById('modal-title').textContent = G.nomeCassa(obj);
      aggiornaNota();
    };
    inp.oninput = salva;
    inp.onkeydown = e=>{ e.stopPropagation(); if(e.key==='Enter') inp.blur(); };
    rigaNome.appendChild(inp);
    body.appendChild(rigaNome);
    aggiornaNota();
    body.appendChild(nota);

    /* i due comandi stanno per conto loro, così non fanno concorrenza
       al campo del nome */
    const barra=document.createElement('div'); barra.className='cassa-barra';
    const bOrdina=document.createElement('button'); bOrdina.className='btn';
    bOrdina.textContent='Ordina';
    bOrdina.title='Raggruppa le pile uguali e mette in ordine per tipo';
    bOrdina.onclick=()=>{ G.ordinaCassa(obj); SND.play('menu'); U.aggiorna(); };
    barra.appendChild(bOrdina);

    const bSposta=document.createElement('button'); bSposta.className='btn';
    bSposta.textContent='Sposta la cassa';
    bSposta.title='La cassa cambia posto con tutto quello che ha dentro';
    bSposta.onclick=()=>{ salva(); U.chiudiModal(); G.iniziaSpostamento(obj, ox, oy); };
    barra.appendChild(bSposta);
    body.appendChild(barra);

    const n=document.createElement('div'); n.className='muted'; n.style.marginBottom='10px';
    n.textContent='Clicca un oggetto per spostarlo dentro o fuori: se la pila è di più pezzi ti chiede quanti. Trascina per riordinare.';
    body.appendChild(n);

    const t1=document.createElement('div'); t1.className='sectitle'; t1.textContent='Nella cassa';
    body.appendChild(t1);
    const g1=document.createElement('div'); g1.className='invgrid';
    for(let i=0;i<24;i++){
      const s=obj.slots[i];
      const c=document.createElement('div'); c.className='icell'+(s?'':' empty');
      if(s){
        c.appendChild(ico(s.id));
        if(s.n>1){const q=document.createElement('span');q.className='qty';q.textContent=s.n;c.appendChild(q);}
        c.title=IT.nome(s.id)+' — trascina per riordinare, clicca per prenderlo';
        c.draggable=true;
        c.ondragstart=e=>{ e.dataTransfer.effectAllowed='move'; e.dataTransfer.setData('text/plain','c'+i); };
        c.onclick=()=>{
          const prendi = n=>{
            if(!G.puoiAggiungere(s.id,n)){ U.toast('Zaino pieno.','bad'); return; }
            G.aggiungi(s.id,n);
            s.n -= n;
            if(s.n<=0) obj.slots[i]=null;
            SND.play('prendi'); U.aggiorna();
          };
          if(s.n<=1) prendi(1);
          else chiediQuanti(c, s.n, IT.nome(s.id), 'Prendi', prendi);
        };
      }
      /* Il riordino dentro la cassa: stesso gesto dello zaino, così non
         c'è una seconda cosa da imparare. Si accettano anche gli oggetti
         trascinati dallo zaino qui sotto. */
      c.ondragover=e=>{ e.preventDefault(); e.dataTransfer.dropEffect='move'; c.classList.add('mira'); };
      c.ondragleave=()=>c.classList.remove('mira');
      c.ondrop=e=>{
        e.preventDefault(); c.classList.remove('mira');
        const dato=e.dataTransfer.getData('text/plain');
        if(dato && dato[0]==='c'){
          if(G.spostaInCassa(obj, parseInt(dato.slice(1),10), i)){ SND.play('menu'); U.aggiorna(); }
        } else {
          const k=parseInt(dato,10);
          const z=G.inv[k];
          if(!z) return;
          if(IT.cat(z.id)==='attrezzo'){ U.toast('Gli attrezzi restano con te.','bad'); return; }
          if(obj.slots[i] && obj.slots[i].id!==z.id){ U.toast('Quella casella è occupata.','bad'); return; }
          if(obj.slots[i]) obj.slots[i].n += z.n; else obj.slots[i]={id:z.id, n:z.n};
          G.inv[k]=null; G.rinfrescaHotbar();
          SND.play('prendi'); U.aggiorna();
        }
      };
      g1.appendChild(c);
    }
    body.appendChild(g1);

    const t2=document.createElement('div'); t2.className='sectitle'; t2.textContent='Nello zaino';
    body.appendChild(t2);
    const g2=document.createElement('div'); g2.className='invgrid';
    for(let i=0;i<G.invMax;i++){
      const s=G.inv[i];
      const c=document.createElement('div'); c.className='icell'+(s?'':' empty');
      if(s){
        c.appendChild(ico(s.id));
        if(s.n>1){const q=document.createElement('span');q.className='qty';q.textContent=s.n;c.appendChild(q);}
        c.title=IT.nome(s.id)+' — trascina nella cassa, o clicca';
        c.draggable=true;
        c.ondragstart=e=>{ e.dataTransfer.effectAllowed='move'; e.dataTransfer.setData('text/plain', String(i)); };
        c.onclick=()=>{
          if(IT.cat(s.id)==='attrezzo'){ U.toast('Gli attrezzi restano con te.','bad'); return; }
          const metti = n=>{
            let k=obj.slots.findIndex(x=>x&&x.id===s.id);
            if(k<0) k=obj.slots.findIndex(x=>!x);
            if(k<0){ U.toast('La cassa è piena.','bad'); return; }
            if(obj.slots[k]) obj.slots[k].n += n; else obj.slots[k]={id:s.id,n:n};
            G.togliSlot(i, n);
            SND.play('prendi'); U.aggiorna();
          };
          if(s.n>1){ chiediQuanti(c, s.n, IT.nome(s.id), 'Metti dentro', metti); return; }
          metti(1);
        };
      }
      g2.appendChild(c);
    }
    body.appendChild(g2);
  });
};

/* ===================================================================
   MACCHINA (barattoliera/botte/fornace/forno)
   =================================================================== */
U.macchina = function(G, obj, ox, oy){
  const nomi = { barattoliera:'Barattoliera', botte:'Botte', fornace:'Fornace', forno:'Forno a legna', arnia:'Arnia' };
  U.modal(nomi[obj.kind]||'Macchina', body=>{
    /* Anche le macchine si spostano, e senza perdere la lavorazione in
       corso: raccoglierle e riposarle avrebbe buttato via i tre giorni
       di botte che avevi già aspettato. */
    if(typeof ox === 'number'){
      const b=document.createElement('button'); b.className='btn';
      b.style.cssText='float:right;margin-left:10px';
      b.textContent='Sposta';
      b.onclick=()=>{ U.chiudiModal(); G.iniziaSpostamento(obj, ox, oy); };
      body.appendChild(b);
    }
    if(obj.pronto){
      const r=document.createElement('div'); r.className='row';
      r.appendChild(ico(obj.out));
      const info=document.createElement('div'); info.className='rinfo';
      info.innerHTML=`<div class="rname">${IT.nome(obj.out)}</div>`+
                     `<div class="rdesc">Pronto! Valore ${IT.prezzo(obj.out)} monete.</div>`;
      r.appendChild(info);
      const b=document.createElement('button'); b.className='btn gold'; b.textContent='Ritira';
      b.onclick=()=>{ G.ritiraMacchina(obj); U.chiudiModal(); };
      r.appendChild(b);
      body.appendChild(r);
      return;
    }
    if(obj.dentro){
      const n=document.createElement('div'); n.className='muted';
      n.innerHTML=`Sta lavorando: <b>${IT.nome(obj.dentro)}</b>.<br>Pronto tra <b>${obj.giorni}</b> giorno/i.`;
      body.appendChild(n);
      return;
    }

    const n=document.createElement('div'); n.className='muted'; n.style.marginBottom='10px';
    n.textContent = {
      barattoliera:'Metti dentro un raccolto: diventerà una conserva che vale il doppio più cinquanta.',
      botte:'Frutta → vino, verdura → succo. Ci mette qualche giorno ma ne vale la pena.',
      fornace:'Minerale grezzo + carbone → lingotto.',
      arnia:'Non si tocca. Il miele arriva da solo.'
    }[obj.kind]||'';
    body.appendChild(n);

    let validi;
    if(obj.kind==='fornace') validi = ['rame','ferro','oro'];
    else validi = null;

    let trovato=false;
    for(let i=0;i<G.invMax;i++){
      const s=G.inv[i];
      if(!s) continue;
      const c=IT.cat(s.id);
      if(obj.kind==='fornace'){
        if(validi.indexOf(s.id)<0) continue;
        if(G.conta('carbone')<1) continue;
      } else {
        if(c!=='raccolto' && c!=='foraggio') continue;
      }
      trovato=true;
      const r=document.createElement('div'); r.className='row';
      r.appendChild(ico(s.id));
      const info=document.createElement('div'); info.className='rinfo';
      const out = G.outputMacchina(obj.kind, s.id);
      info.innerHTML=`<div class="rname">${IT.nome(s.id)} ×${s.n}</div>`+
                     `<div class="ringr">→ ${IT.nome(out)} · <b>${IT.prezzo(out)}</b> monete</div>`;
      r.appendChild(info);
      const b=document.createElement('button'); b.className='btn'; b.textContent='Inserisci';
      b.onclick=()=>{ G.caricaMacchina(obj, s.id); U.chiudiModal(); };
      r.appendChild(b);
      body.appendChild(r);
    }
    if(!trovato){
      const e=document.createElement('div'); e.className='muted';
      e.textContent = obj.kind==='fornace'
        ? 'Ti serve minerale grezzo (rame, ferro o oro) e almeno un carbone.'
        : 'Non hai niente di adatto nello zaino.';
      body.appendChild(e);
    }
  });
};

/* ===================================================================
   REGALO
   =================================================================== */
U.regalo = function(G, npcId){
  const N = DATA.NPCS[npcId];
  U.modal('Cosa regali a '+N.nome+'?', body=>{
    let n=0;
    for(let i=0;i<G.invMax;i++){
      const s=G.inv[i];
      if(!s || IT.cat(s.id)==='attrezzo' || IT.cat(s.id)==='speciale') continue;
      n++;
      const r=document.createElement('div'); r.className='row';
      r.appendChild(ico(s.id));
      const info=document.createElement('div'); info.className='rinfo';
      info.innerHTML=`<div class="rname">${IT.nome(s.id)}</div>`;
      r.appendChild(info);
      const b=document.createElement('button'); b.className='btn'; b.textContent='Regala';
      b.onclick=()=>{ U.chiudiModal(); G.regala(npcId, i); };
      r.appendChild(b);
      body.appendChild(r);
    }
    if(!n){
      const e=document.createElement('div'); e.className='muted';
      e.textContent='Non hai niente da regalare.';
      body.appendChild(e);
    }
  });
};

/* ===================================================================
   CARTELLINO DEL GIORNO
   =================================================================== */
U.daycard = function(G, mostra){
  const el=$('#daycard');
  if(!mostra){ el.classList.add('hidden'); return; }
  el.querySelector('.dc-season').textContent = G.stagione().nome+' · Anno '+G.anno;
  el.querySelector('.dc-day').textContent = 'Giorno '+G.giorno;
  el.querySelector('.dc-weather').textContent =
    DATA.GIORNI_SETTIMANA[(G.giornoTot)%7]+' · '+DATA.METEO[G.meteo].nome;
  el.classList.remove('hidden');
};

/* ===================================================================
   RIEPILOGO NOTTURNO
   =================================================================== */
U.riepilogo = function(G, voci, tot, dopo){
  U.modal('Cassa di consegna', body=>{
    if(!voci.length){
      const n=document.createElement('div'); n.className='muted';
      n.textContent='Stanotte la cassa era vuota. Capita.';
      body.appendChild(n);
    } else {
      for(const v of voci){
        const r=document.createElement('div'); r.className='row';
        r.appendChild(ico(v.id));
        const info=document.createElement('div'); info.className='rinfo';
        info.innerHTML=`<div class="rname">${IT.nome(v.id)} ×${v.n}</div>`;
        r.appendChild(info);
        const p=document.createElement('span'); p.className='price'; p.textContent='+'+v.tot+' ✦';
        r.appendChild(p);
        body.appendChild(r);
      }
      const t=document.createElement('div');
      t.style.cssText='text-align:right;font-size:19px;font-weight:800;color:#c9922b;margin-top:12px;'+
                      'border-top:2px solid rgba(122,79,48,.3);padding-top:10px';
      t.textContent='Totale: '+tot+' monete';
      body.appendChild(t);
    }
    const b=document.createElement('button'); b.className='btn'; b.style.marginTop='14px';
    b.textContent='Buongiorno!';
    /* `dopo` lo chiama già `chiudiModal` (è l'onClose qui sotto, e vale
       anche per chi chiude con Escape): chiamarlo pure dal pulsante lo
       faceva girare due volte, e ogni mattina con la cassa piena
       arrivavano due frasi di risveglio una sopra l'altra. */
    b.onclick=()=>{ U.chiudiModal(); };
    body.appendChild(b);
  }, dopo);
};

})();
