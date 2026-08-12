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
    if(k==='conserva') return 'Conserva di '+n;
    if(k==='vino')     return (DATA.FRUTTA.indexOf(s)>=0? 'Vino di ':'Distillato di ')+n;
    if(k==='succo')    return 'Succo di '+n;
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
const NOMI_STAGIONE = { primavera:'primavera', estate:'estate', autunno:'autunno', inverno:'inverno' };
function elenco(a, cong){
  const v = a.filter(Boolean);
  if(!v.length) return '';
  if(v.length===1) return v[0];
  return v.slice(0,-1).join(', ') + ' ' + (cong||'e') + ' ' + v[v.length-1];
}
function stagioni(a){ return elenco((a||[]).map(s=>NOMI_STAGIONE[s]||s), 'e'); }

/* la ricetta che produce questo oggetto, se ce n'è una */
function ricettaDi(id){
  for(const r of DATA.CRAFT)  if(r.id===id) return {ing:r.ing, dove:'al banco da lavoro (tasto C)'};
  for(const r of DATA.CUCINA) if(r.id===id) return {ing:r.ing, dove:'ai fornelli di casa'};
  return null;
}

IT.dove = function(id){
  /* prodotti delle macchine: conserva:rapa, vino:uva… */
  if(id.indexOf(':')>0){
    const k = id.split(':')[0], s = IT.nome(IT.src(id));
    if(k==='conserva') return 'Esce dalla <b>barattoliera</b>, mettendoci dentro ' + s + '.';
    if(k==='vino')     return 'Esce dalla <b>botte</b>, mettendoci dentro ' + s + '. Ci vogliono quattro giorni.';
    if(k==='succo')    return 'Esce dalla <b>botte</b>, mettendoci dentro ' + s + '.';
    return null;
  }
  const I = DATA.ITEMS[id];
  if(!I) return null;

  /* semi: quando si seminano e chi li vende */
  if(I.cat === 'seme'){
    const c = id.replace(/^seme_/, '');
    const C = DATA.CROPS[c];
    if(C){
      const st = stagioni(C.stagioni);
      let dove = 'Si semina in <b>' + st + '</b>';
      const giorni = C.fasi.reduce((a,b)=>a+b, 0);
      dove += ', e ci mette <b>' + giorni + ' giorni</b> a maturare';
      if(C.ricresce) dove += '; poi ricresce ogni ' + C.ricresce + ' giorni senza riseminare';
      dove += '. Lo vende <b>Bruno</b> in bottega, ma solo nella sua stagione.';
      return dove;
    }
  }
  /* raccolti: si risale al seme */
  if(DATA.CROPS[id]){
    const C = DATA.CROPS[id];
    return 'Cresce nel campo dai <b>Semi di ' + C.nome + '</b>, che <b>Bruno</b> vende in <b>' +
           stagioni(C.stagioni) + '</b>. Fuori stagione la pianta appassisce.';
  }
  /* foraggio: si raccoglie per terra, e conta la stagione */
  if(I.cat === 'foraggio'){
    if(['bacca_inverno','radice_gelata','fiocco_cristallo'].indexOf(id) >= 0)
      return 'Si raccoglie da terra sul <b>Passo di montagna</b>, dove è sempre inverno: c\'è tutto l\'anno.';
    return 'Si raccoglie da terra in <b>' + (NOMI_STAGIONE[I.stagione]||I.stagione) +
           '</b>, sparso per la valle — prato, bosco, radure. Nelle altre stagioni non c\'è.';
  }
  /* pesci */
  if(I.cat === 'pesce' && !I.spazzatura){
    const luoghi = { fiume:'nel fiume del paese', lago:'nel lago del bosco', mare:'in mare, alla Costa' };
    let d = 'Si pesca ' + (luoghi[I.luogo] || 'nelle acque della valle');
    if(I.stagioni && I.stagioni.length < 4) d += ', in <b>' + stagioni(I.stagioni) + '</b>';
    if(I.notte) d += ', e solo <b>dopo il tramonto</b>';
    return d + '.';
  }
  /* minerali */
  if(I.cat === 'minerale'){
    const rari = ['oro','ametista','gemma_luna','geode','quarzo'];
    return 'Si spacca col <b>piccone</b> nella <b>miniera</b>' +
           (rari.indexOf(id)>=0 ? ', e più si scende più se ne trova.' : '.');
  }
  /* roba che si costruisce o si cucina */
  const r = ricettaDi(id);
  if(r){
    const lista = Object.keys(r.ing).map(k => IT.nome(k) + ' ×' + r.ing[k]).join(', ');
    return 'Si fa ' + r.dove + ' con: <b>' + lista + '</b>.';
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
  if(AMANO[id]) return AMANO[id];
  if(I.cat === 'attrezzo') return 'Ce l\'hai dall\'inizio. <b>Tobia</b>, alla fucina, lo può potenziare.';
  /* le quattro braci sono il filo di tutta la partita: se c'è una cosa
     che deve dire dove si prende, è questa */
  if(/^brace_/.test(id)){
    const st = id.replace('brace_','');
    return 'La consegna il <b>Santuario</b>, nel bosco, quando gli porti le cinque offerte di <b>' +
           (NOMI_STAGIONE[st]||st) + '</b>. Le quattro braci insieme riaccendono la Lanterna.';
  }
  if(id === 'medaglione') return 'Te l\'ha lasciato <b>Nonna Ilde</b>. Non si vende e non si perde.';
  if(I.spazzatura) return 'Roba che ogni tanto abbocca al posto di un pesce. Si butta, o si vende per due soldi.';
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
U.toast = function(msg, tipo, itemId){
  const box = $('#toasts');

  if(itemId){
    const gia = box.querySelector('.toast.oggetto[data-item="'+CSS.escape(itemId)+'"]:not(.out)');
    if(gia){
      gia.querySelector('.toast-testo').textContent = msg;
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
  s.textContent = msg;
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
  if(p.dataset.t !== testo){ p.dataset.t = testo; p.innerHTML = testo; }
  p.classList.remove('hidden');
};

/* ===================================================================
   MODALE
   =================================================================== */
let modalAperta = null;

U.modal = function(titolo, costruisci, onClose){
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
  modalAperta = { titolo, costruisci, onClose };
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

U.chiudiModal = function(){
  if(!modalAperta) return;
  $('#modal-wrap').classList.add('hidden');
  const cb = modalAperta.onClose;
  modalAperta = null;
  if(cb) cb();
};

U.modalAperta = ()=> !!modalAperta;

U.aggiorna = function(){
  if(!modalAperta) return;
  const body = $('#modal-body');
  const sc = body.scrollTop;
  body.innerHTML='';
  modalAperta.costruisci(body);
  body.scrollTop = sc;
};

$('#modal-close').addEventListener('click', ()=>U.chiudiModal());
$('#modal-wrap').addEventListener('click', e=>{ if(e.target.id==='modal-wrap') U.chiudiModal(); });

/* ===================================================================
   DIALOGO
   =================================================================== */
let dlgCoda = [], dlgAttivo = false, dlgFine = null, dlgTyping = null;

U.dialogo = function(npcId, righe, opzioni){
  opzioni = opzioni || {};
  const N = DATA.NPCS[npcId];
  dlgCoda = Array.isArray(righe) ? righe.slice() : [righe];
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
  const riga = dlgCoda.shift();
  // effetto macchina da scrivere
  txt.textContent='';
  let i=0;
  dlgTyping = setInterval(()=>{
    if(i>=riga.length){ clearInterval(dlgTyping); dlgTyping=null; return; }
    txt.textContent += riga[i++];
    if(i%3===0) SND.play('menu');
  }, 16);
}

U.avanzaDialogo = function(){
  if(!dlgAttivo) return false;
  const d = $('#dialogue');
  const txt = d.querySelector('.dlg-text');
  if(dlgTyping){
    // completa subito la riga
    clearInterval(dlgTyping); dlgTyping=null;
    return true;
  }
  if(d.querySelector('.dlg-choices').children.length) return true;
  prossimaRiga();
  return true;
};

U.chiudiDialogo = function(){
  dlgAttivo=false;
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
   INVENTARIO
   =================================================================== */
U.inventario = function(G, presoIniziale){
  U.modal('Zaino', body=>{
    // statistiche rapide
    const head = document.createElement('div');
    head.className='muted';
    head.style.marginBottom='12px';
    head.innerHTML = `<b>${G.nomeGiocatore}</b> · ${G.oro} monete · `+
      `${G.inv.filter(s=>s).length}/${G.invMax} caselle`;
    body.appendChild(head);

    const t1=document.createElement('div'); t1.className='sectitle'; t1.textContent='Oggetti';
    body.appendChild(t1);

    const aiuto=document.createElement('div'); aiuto.className='muted';
    aiuto.style.cssText='font-size:12px;margin:-6px 0 8px';
    aiuto.innerHTML='Trascina per spostare. Le prime nove caselle sono la barra in basso: '+
                    'quello che metti lì lo hai in mano.';
    body.appendChild(aiuto);

    const g=document.createElement('div'); g.className='invgrid';
    /* Lo spostamento funziona in due modi apposta. Trascinare è quello
       che uno prova per primo; ma il trascinamento è anche il gesto che
       riesce peggio — parte per sbaglio, si perde a metà, e su un
       trackpad è una piccola prova di abilità. Quindi c'è anche il
       clic-clic: scegli la casella, scegli dove va. Uno dei due
       funziona sempre. */
    let preso = (typeof presoIniziale==='number' && G.inv[presoIniziale]) ? presoIniziale : -1;
    const ridisegna = ()=>{ U.chiudiModal(); U.inventario(G); };
    const marca = ()=>{
      [...g.children].forEach((c,i)=>c.classList.toggle('presa', i===preso));
      aiuto.innerHTML = preso>=0
        ? '<b>'+IT.nome(G.inv[preso].id)+'</b> in mano: clicca la casella dove vuoi metterlo. '+
          '(Le prime nove sono la barra in basso.)'
        : 'Trascina per spostare. Le prime nove caselle sono la barra in basso: '+
          'quello che metti lì lo hai in mano.';
    };

    for(let i=0;i<G.invMax;i++){
      const s = G.inv[i];
      const c=document.createElement('div');
      c.className='icell'+(s?'':' empty')+(i<9?' barra':'');
      c.dataset.i = i;
      if(i<9){ const n=document.createElement('span'); n.className='slotnum'; n.textContent=i+1; c.appendChild(n); }
      if(s){
        c.appendChild(ico(s.id));
        if(s.n>1){ const q=document.createElement('span'); q.className='qty'; q.textContent=s.n; c.appendChild(q); }
        c.title = IT.nome(s.id)+' — '+IT.desc(s.id);
        c.draggable = true;
        c.ondragstart = e=>{
          preso = i; marca();
          e.dataTransfer.effectAllowed='move';
          e.dataTransfer.setData('text/plain', String(i));
        };
        c.ondragend = ()=>{ preso=-1; marca(); };
      }
      c.ondragover = e=>{ e.preventDefault(); e.dataTransfer.dropEffect='move'; c.classList.add('mira'); };
      c.ondragleave = ()=>c.classList.remove('mira');
      c.ondrop = e=>{
        e.preventDefault(); c.classList.remove('mira');
        const da = parseInt(e.dataTransfer.getData('text/plain'), 10);
        if(isFinite(da) && G.spostaSlot(da, i)){ SND.play('menu'); ridisegna(); }
      };
      c.onclick = ()=>{
        if(preso >= 0){                       // seconda parte del clic-clic
          if(preso === i){ preso = -1; marca(); return; }
          if(G.spostaSlot(preso, i)){ SND.play('menu'); ridisegna(); }
          else { preso = -1; marca(); }
          return;
        }
        if(!s) return;
        mostraOggetto(G, i);
      };
      // clic destro: prendi senza aprire la scheda dell'oggetto
      c.oncontextmenu = e=>{
        e.preventDefault();
        if(!s && preso<0) return;
        preso = (preso===i) ? -1 : i;
        marca();
      };
      g.appendChild(c);
    }
    body.appendChild(g);
    marca();

    /* abilità */
    const t2=document.createElement('div'); t2.className='sectitle'; t2.textContent='Abilità';
    body.appendChild(t2);
    for(const k in DATA.SKILLS){
      const liv = G.livello(k);
      const xp = G.skills[k];
      const cur = DATA.XP_LIV[liv]||0;
      const next = DATA.XP_LIV[liv+1] || (cur+1);
      const pct = liv>=10 ? 100 : Math.round((xp-cur)/(next-cur)*100);
      const d=document.createElement('div'); d.className='skill';
      d.innerHTML = `<div class="skill-top"><span>${DATA.SKILLS[k].nome}</span><span>Liv. ${liv}</span></div>`+
                    `<div class="skill-bar"><i style="width:${pct}%"></i></div>`+
                    `<div class="muted" style="font-size:11.5px;margin-top:2px">${DATA.SKILLS[k].desc}</div>`;
      body.appendChild(d);
    }
  });
};

function mostraOggetto(G, idx){
  const s = G.inv[idx];
  if(!s) return;
  U.modal(IT.nome(s.id), body=>{
    const row=document.createElement('div'); row.className='row';
    row.appendChild(ico(s.id));
    const info=document.createElement('div'); info.className='rinfo';
    info.innerHTML = `<div class="rname">${IT.nome(s.id)} ×${s.n}</div>`+
                     `<div class="rdesc">${IT.desc(s.id)}</div>`+
                     (IT.prezzo(s.id)? `<div class="ringr">Valore: <b>${IT.prezzo(s.id)}</b> monete l'una</div>`:'');
    row.appendChild(info);
    body.appendChild(row);

    const dove = IT.dove(s.id);
    if(dove){
      const d=document.createElement('div'); d.className='dove';
      d.innerHTML = '<span class="dove-tit">Dove si trova</span>'+dove;
      body.appendChild(d);
    }

    const az=document.createElement('div');
    az.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-top:12px';

    if(IT.commestibile(s.id)){
      const b=document.createElement('button'); b.className='btn';
      b.textContent = `Mangia (+${IT.energia(s.id)} energia)`;
      b.onclick=()=>{ G.mangia(idx); U.chiudiModal(); };
      az.appendChild(b);
    }
    const bs=document.createElement('button'); bs.className='btn';
    bs.textContent='Sposta in un\'altra casella';
    bs.onclick=()=>{ U.chiudiModal(); U.inventario(G, idx); };
    az.appendChild(bs);

    const bd=document.createElement('button'); bd.className='btn red';
    bd.textContent='Butta via 1';
    bd.onclick=()=>{ G.togliSlot(idx,1); U.chiudiModal(); U.inventario(G); };
    az.appendChild(bd);

    const bb=document.createElement('button'); bb.className='btn blue';
    bb.textContent='← Indietro';
    bb.onclick=()=>{ U.chiudiModal(); U.inventario(G); };
    az.appendChild(bb);

    body.appendChild(az);
  });
}

/* ===================================================================
   NEGOZIO
   =================================================================== */
U.negozio = function(G, tipo){
  const titoli = { bruno:'Bottega di Bruno', marisol:'Locanda del Tasso Storto' };
  let tab = 'compra';

  U.modal(titoli[tipo]||'Bottega', body=>{
    const tabs=document.createElement('div'); tabs.className='tabs';
    for(const [k,lab] of [['compra','Compra'],['vendi','Vendi']]){
      const b=document.createElement('button');
      b.className='tab'+(tab===k?' on':'');
      b.textContent=lab;
      b.onclick=()=>{ tab=k; U.aggiorna(); };
      tabs.appendChild(b);
    }
    const oro=document.createElement('span');
    oro.style.cssText='margin-left:auto;font-weight:800;color:#c9922b;align-self:center';
    oro.textContent = G.oro+' monete';
    tabs.appendChild(oro);
    body.appendChild(tabs);

    if(tab==='compra'){
      let lista;
      if(tipo==='marisol'){
        lista = DATA.CUCINA.map(r=>({id:r.id, prezzo:Math.round(IT.prezzo(r.id)*1.6)}));
      } else {
        const stag = G.stagione().id;
        lista = (DATA.SHOP[stag]||[]).concat(DATA.SHOP_EXTRA).map(id=>{
          const I=DATA.ITEMS[id];
          let p;
          if(I.seme) p = DATA.CROPS[I.seme].seme;
          else if(id==='gallina') p = 800;
          // il latte non si produce al podere: Bruno lo rivende quasi a costo,
          // altrimenti cucinare la polenta costerebbe più di quanto rende
          else if(id==='latte') p = 90;
          else p = Math.max(2, Math.round((I.prezzo||10)*2.2));
          return {id, prezzo:p};
        });
      }
      for(const it of lista){
        body.appendChild(rigaCompra(G, it.id, it.prezzo));
      }
      if(tipo==='bruno'){
        const n=document.createElement('div'); n.className='muted'; n.style.marginTop='10px';
        n.textContent='I semi cambiano con la stagione. Bruno non fa eccezioni, nemmeno per te.';
        body.appendChild(n);
      }
    } else {
      const vendibili = G.inv.map((s,i)=>({s,i})).filter(o=>o.s && IT.prezzo(o.s.id)>0 && IT.cat(o.s.id)!=='attrezzo');
      if(!vendibili.length){
        const n=document.createElement('div'); n.className='muted';
        n.textContent='Non hai niente da vendere. Torna quando lo zaino pesa.';
        body.appendChild(n);
      }
      for(const o of vendibili){
        body.appendChild(rigaVendi(G, o.i));
      }
      if(vendibili.length>1){
        const b=document.createElement('button'); b.className='btn gold';
        b.style.marginTop='8px';
        b.textContent='Vendi tutto il raccolto';
        b.onclick=()=>{
          let tot=0;
          for(let i=G.inv.length-1;i>=0;i--){
            const s=G.inv[i];
            if(!s) continue;
            const c=IT.cat(s.id);
            if(c==='raccolto'||c==='foraggio'||c==='pesce'){
              tot += G.prezzoVendita(s.id)*s.n;
              G.inv[i]=null;
            }
          }
          if(tot){ G.oro+=tot; G.registraVendita(tot); SND.play('moneta'); U.toast('Venduto per '+tot+' monete','gold'); }
          G.rinfrescaHotbar();
          U.aggiorna(); G.aggiornaHUD();
        };
        body.appendChild(b);
      }
    }
  });
};

U.mercante = function(G){
  U.modal('Mercante Ambulante', body=>{
    const n=document.createElement('div'); n.className='muted'; n.style.marginBottom='10px';
    n.innerHTML='«Roba che da queste parti non si trova. Domani sono già altrove.» '+
                `<span style="color:#c9922b;font-weight:800">${G.oro} monete</span>`;
    body.appendChild(n);
    const stock=(G.mercante && G.mercante.stock)||[];
    if(!stock.length){
      const e=document.createElement('div'); e.className='muted'; e.textContent='Il banco è vuoto oggi.';
      body.appendChild(e);
    }
    for(const it of stock) body.appendChild(rigaCompra(G, it.id, it.prezzo));
  });
};

function rigaCompra(G, id, prezzo){
  const r=document.createElement('div'); r.className='row';
  r.appendChild(ico(id));
  const info=document.createElement('div'); info.className='rinfo';
  /* Segnalato in beta: parecchia roba in vendita non dice a cosa serve.
     Un sacchetto di semi con scritto solo «Semi di Uva» e un prezzo non
     aiuta a decidere; dire in che stagione si semina e in quanti giorni
     matura, sì. */
  info.innerHTML=`<div class="rname">${IT.nome(id)}</div><div class="rdesc">${IT.desc(id)}</div>`+
                 (IT.dove(id) ? `<div class="rserve">${IT.dove(id)}</div>` : '');
  r.appendChild(info);
  const p=document.createElement('span'); p.className='price'; p.textContent=prezzo+' ✦';
  r.appendChild(p);
  for(const q of [1,5]){
    const b=document.createElement('button'); b.className='btn';
    b.textContent='×'+q;
    b.disabled = G.oro < prezzo*q;
    b.onclick=()=>{
      if(G.oro < prezzo*q) return;
      if(id==='gallina'){
        if(!G.costruzioni.pollaio){ U.toast('Ti serve prima un pollaio.','bad'); SND.play('errore'); return; }
        if(G.animali.filter(a=>a.tipo==='gallina').length + q > 6){ U.toast('Il pollaio è pieno.','bad'); return; }
        G.oro -= prezzo*q;
        for(let k=0;k<q;k++) G.aggiungiGallina();
        SND.play('gallina'); U.toast(q+' gallina/e nel pollaio!','good');
      } else {
        if(!G.puoiAggiungere(id,q)){ U.toast('Zaino pieno.','bad'); SND.play('errore'); return; }
        G.oro -= prezzo*q;
        G.aggiungi(id,q);
        SND.play('moneta');
      }
      U.aggiorna(); G.aggiornaHUD();
    };
    r.appendChild(b);
  }
  return r;
}

function rigaVendi(G, idx){
  const s=G.inv[idx];
  const pu = G.prezzoVendita(s.id);
  const r=document.createElement('div'); r.className='row';
  r.appendChild(ico(s.id));
  const info=document.createElement('div'); info.className='rinfo';
  info.innerHTML=`<div class="rname">${IT.nome(s.id)} ×${s.n}</div>`+
                 `<div class="rdesc">${pu} monete l'uno</div>`;
  r.appendChild(info);
  for(const q of [1, s.n]){
    if(q===1 && s.n===1) continue;
    const b=document.createElement('button'); b.className='btn gold';
    b.textContent = q===1?'Vendi 1':'Vendi tutto ('+(pu*q)+')';
    b.onclick=()=>{
      const n=Math.min(q, G.inv[idx]?G.inv[idx].n:0);
      if(!n) return;
      G.oro += pu*n;
      G.registraVendita(pu*n);
      G.togliSlot(idx,n);
      SND.play('moneta');
      U.aggiorna(); G.aggiornaHUD();
    };
    r.appendChild(b);
  }
  if(s.n===1){
    const b=document.createElement('button'); b.className='btn gold';
    b.textContent='Vendi ('+pu+')';
    b.onclick=()=>{ G.oro+=pu; G.registraVendita(pu); G.togliSlot(idx,1); SND.play('moneta'); U.aggiorna(); G.aggiornaHUD(); };
    r.appendChild(b);
  }
  return r;
}

/* ===================================================================
   ARTIGIANATO
   =================================================================== */
U.artigianato = function(G){
  let cat = 'podere';
  U.modal('Banco da lavoro', body=>{
    const tabs=document.createElement('div'); tabs.className='tabs';
    for(const [k,lab] of [['podere','Podere'],['macchine','Macchine']]){
      const b=document.createElement('button');
      b.className='tab'+(cat===k?' on':'');
      b.textContent=lab;
      b.onclick=()=>{ cat=k; U.aggiorna(); };
      tabs.appendChild(b);
    }
    body.appendChild(tabs);

    const ric = DATA.CRAFT.filter(r=>r.cat===cat);
    for(const r of ric){
      const sbloccata = G.livello('agricoltura')>=r.liv || G.livello('estrazione')>=r.liv;
      const row=document.createElement('div'); row.className='row';
      row.appendChild(ico(r.id));
      const info=document.createElement('div'); info.className='rinfo';
      let ing='';
      for(const k in r.ing){
        const ok = G.conta(k) >= r.ing[k];
        ing += `<span class="${ok?'':'miss'}">${IT.nome(k)} ${G.conta(k)}/${r.ing[k]}</span> · `;
      }
      info.innerHTML = `<div class="rname">${IT.nome(r.id)}${r.out>1?' ×'+r.out:''}</div>`+
                       `<div class="rdesc">${IT.desc(r.id)}</div>`+
                       `<div class="ringr">${ing.slice(0,-3)}</div>`;
      row.appendChild(info);
      const b=document.createElement('button'); b.className='btn';
      if(!sbloccata){
        b.textContent='Liv. '+r.liv; b.disabled=true;
        b.title='Serve livello '+r.liv+' in Agricoltura o Estrazione';
      } else {
        b.textContent='Crea';
        b.disabled = !G.puoiCraftare(r);
        b.onclick=()=>{ G.crafta(r); U.aggiorna(); };
      }
      row.appendChild(b);
      body.appendChild(row);
    }
  });
};

/* ===================================================================
   CUCINA (forno)
   =================================================================== */
U.cucina = function(G){
  U.modal('Forno a legna', body=>{
    const n=document.createElement('div'); n.className='muted'; n.style.marginBottom='12px';
    n.textContent='I piatti caldi restituiscono energia. Le ricette te le insegna Marisol, ma il forno non fa domande.';
    body.appendChild(n);
    for(const r of DATA.CUCINA){
      const nota = G.ricetteNote[r.id];
      const row=document.createElement('div'); row.className='row';
      row.appendChild(ico(nota? r.id : 'legna'));
      const info=document.createElement('div'); info.className='rinfo';
      if(!nota){
        info.innerHTML = `<div class="rname">Ricetta sconosciuta</div>`+
                         `<div class="rdesc">Parla con Marisol o trova la ricetta in giro.</div>`;
      } else {
        let ing='';
        for(const k in r.ing){
          const ok = G.conta(k)>=r.ing[k];
          ing += `<span class="${ok?'':'miss'}">${IT.nome(k)} ${G.conta(k)}/${r.ing[k]}</span> · `;
        }
        info.innerHTML = `<div class="rname">${IT.nome(r.id)}</div>`+
                         `<div class="rdesc">+${IT.energia(r.id)} energia · ${IT.desc(r.id)}</div>`+
                         `<div class="ringr">${ing.slice(0,-3)}</div>`;
      }
      row.appendChild(info);
      const b=document.createElement('button'); b.className='btn';
      b.textContent = nota?'Cucina':'???';
      b.disabled = !nota || !G.puoiCraftare({ing:r.ing, out:1, id:r.id});
      b.onclick=()=>{ G.crafta({id:r.id, out:1, ing:r.ing}, 'cucina'); U.aggiorna(); };
      row.appendChild(b);
      body.appendChild(row);
    }
  });
};

/* ===================================================================
   FUCINA — potenziamenti e costruzioni
   =================================================================== */
U.fucina = function(G){
  let tab='attrezzi';
  U.modal('Fucina di Tobia', body=>{
    const tabs=document.createElement('div'); tabs.className='tabs';
    for(const [k,lab] of [['attrezzi','Potenzia attrezzi'],['costruzioni','Costruzioni'],['fusione','Fusione']]){
      const b=document.createElement('button');
      b.className='tab'+(tab===k?' on':'');
      b.textContent=lab;
      b.onclick=()=>{ tab=k; U.aggiorna(); };
      tabs.appendChild(b);
    }
    body.appendChild(tabs);

    if(tab==='attrezzi'){
      for(const att in DATA.UPGRADE){
        const liv = G.attrezziLiv[att]||0;
        const next = DATA.UPGRADE[att][liv];
        const row=document.createElement('div'); row.className='row';
        row.appendChild(ico(att));
        const info=document.createElement('div'); info.className='rinfo';
        if(!next){
          info.innerHTML=`<div class="rname">${IT.nome(att)} ${DATA.UPG_NOMI[liv]}</div>`+
                         `<div class="rdesc">Al massimo. Non si può migliorare oltre.</div>`;
        } else {
          const ok = G.conta(Object.keys(next.ing)[0]) >= Object.values(next.ing)[0];
          info.innerHTML=`<div class="rname">${IT.nome(att)} ${DATA.UPG_NOMI[liv]} → ${DATA.UPG_NOMI[liv+1]}</div>`+
                         `<div class="rdesc">Meno energia per colpo, area più ampia.</div>`+
                         `<div class="ringr"><span class="${ok?'':'miss'}">`+
                         `${IT.nome(Object.keys(next.ing)[0])} ${G.conta(Object.keys(next.ing)[0])}/${Object.values(next.ing)[0]}</span>`+
                         ` · <b>${next.costo}</b> monete</div>`;
        }
        row.appendChild(info);
        if(next){
          const b=document.createElement('button'); b.className='btn';
          b.textContent='Potenzia';
          const ok = G.oro>=next.costo && G.conta(Object.keys(next.ing)[0])>=Object.values(next.ing)[0];
          b.disabled=!ok;
          b.onclick=()=>{ G.potenzia(att); U.aggiorna(); };
          row.appendChild(b);
        }
        body.appendChild(row);
      }
    }
    else if(tab==='costruzioni'){
      for(const c of DATA.COSTRUZIONI){
        const fatta = G.costruzioni[c.id];
        const row=document.createElement('div'); row.className='row';
        row.appendChild(ico(c.id==='serra'?'seme_cristallia':(c.id==='pollaio'?'uovo':'legna')));
        const info=document.createElement('div'); info.className='rinfo';
        let ing='';
        for(const k in c.ing){
          const ok=G.conta(k)>=c.ing[k];
          ing += `<span class="${ok?'':'miss'}">${IT.nome(k)} ${G.conta(k)}/${c.ing[k]}</span> · `;
        }
        info.innerHTML=`<div class="rname">${c.nome}</div>`+
                       `<div class="rdesc">${c.desc}</div>`+
                       (fatta? `<div class="ringr"><b>Già costruito.</b></div>`
                             : `<div class="ringr">${ing}<b>${c.costo}</b> monete</div>`);
        row.appendChild(info);
        if(!fatta){
          const b=document.createElement('button'); b.className='btn';
          b.textContent='Costruisci';
          b.disabled = !G.puoiCostruire(c);
          b.onclick=()=>{ G.costruisci(c); U.aggiorna(); };
          row.appendChild(b);
        }
        body.appendChild(row);
      }
    }
    else {
      const n=document.createElement('div'); n.className='muted'; n.style.marginBottom='10px';
      n.textContent='Serve una Fornace posata al podere per fondere da solo. Qui Tobia lo fa per te, con una piccola commissione.';
      body.appendChild(n);
      const fusioni=[['rame','lingotto_rame',5,60],['ferro','lingotto_ferro',5,150],['oro','lingotto_oro',5,320]];
      for(const [min,ling,q,tassa] of fusioni){
        const row=document.createElement('div'); row.className='row';
        row.appendChild(ico(ling));
        const info=document.createElement('div'); info.className='rinfo';
        const ok=G.conta(min)>=q;
        info.innerHTML=`<div class="rname">${IT.nome(ling)}</div>`+
                       `<div class="ringr"><span class="${ok?'':'miss'}">${IT.nome(min)} ${G.conta(min)}/${q}</span>`+
                       ` + <b>${tassa}</b> monete · serve 1 Carbone</div>`;
        row.appendChild(info);
        const b=document.createElement('button'); b.className='btn';
        b.textContent='Fondi';
        b.disabled = !(ok && G.oro>=tassa && G.conta('carbone')>=1);
        b.onclick=()=>{
          G.togli(min,q); G.togli('carbone',1); G.oro-=tassa;
          G.aggiungi(ling,1);
          SND.play('costruisci'); U.toast('Un '+IT.nome(ling)+'!','good',ling);
          U.aggiorna(); G.aggiornaHUD();
        };
        row.appendChild(b);
        body.appendChild(row);
      }
    }
  });
};

/* ===================================================================
   SANTUARIO
   =================================================================== */
U.santuario = function(G){
  U.modal('Santuario della Lanterna', body=>{
    const intro=document.createElement('div'); intro.className='muted';
    intro.style.cssText='margin-bottom:14px;font-style:italic;line-height:1.6';
    intro.innerHTML = G.braci>=4
      ? 'La Lanterna arde piena. La valle è tornata al suo colore.<br>Fiammella non dice niente, ma è la prima volta che la vedi ferma.'
      : `Quattro nicchie, quattro stagioni. Le hai accese <b>${G.braci}</b> volte su quattro.<br>`+
        `Deposita gli oggetti richiesti: verranno presi dallo zaino.`;
    body.appendChild(intro);

    DATA.SANTUARIO.forEach((b,bi)=>{
      const fatta = G.santuario[b.id];
      const d=document.createElement('div');
      d.className='bundle'+(fatta?' done':'');
      const h=document.createElement('h3');
      h.textContent = b.nome + (fatta? ' ✦ accesa':'');
      h.style.color = fatta ? '#a07818' : '';
      d.appendChild(h);
      const p=document.createElement('div'); p.className='bdesc'; p.textContent=b.testo;
      d.appendChild(p);

      const sl=document.createElement('div'); sl.className='bslots';
      for(const req of b.req){
        const dato = fatta || (G.santuarioDato[b.id]||[]).indexOf(req)>=0;
        const ha = G.conta(req)>0;
        const s=document.createElement('div');
        s.className='bslot'+(dato?' have':'');
        const im=document.createElement('div'); im.className='bimg';
        im.appendChild(ico(req));
        if(dato){ const x=document.createElement('div'); x.className='bx'; x.textContent='✦'; im.appendChild(x); }
        s.appendChild(im);
        const lab=document.createElement('div'); lab.className='blab'; lab.textContent=IT.nome(req);
        s.appendChild(lab);
        if(!dato && ha && !fatta){
          im.style.cursor='pointer';
          im.style.borderColor='#7fb069';
          im.onclick=()=>{ G.offri(b.id, req); U.aggiorna(); };
          s.title='Clicca per offrire';
        } else if(!dato && !fatta){
          im.style.opacity='0.45';
          s.title='Non ce l\'hai ancora';
        }
        sl.appendChild(s);
      }
      d.appendChild(sl);

      if(!fatta){
        const mancano = b.req.filter(r=>(G.santuarioDato[b.id]||[]).indexOf(r)<0);
        const puo = mancano.every(r=>G.conta(r)>0);
        const btn=document.createElement('button');
        btn.className='btn gold'; btn.style.marginTop='10px';
        btn.textContent = mancano.length? 'Offri tutto ciò che hai' : 'Accendi la brace';
        btn.disabled = !mancano.length ? false : !mancano.some(r=>G.conta(r)>0);
        btn.onclick=()=>{
          if(!mancano.length){ G.completaBrace(b.id); U.chiudiModal(); return; }
          for(const r of mancano) if(G.conta(r)>0) G.offri(b.id, r, true);
          U.aggiorna();
        };
        d.appendChild(btn);
      }
      body.appendChild(d);
    });
  });
};

/* ===================================================================
   DIARIO
   =================================================================== */
U.diario = function(G, tabIniziale){
  let tab=tabIniziale||'obiettivi';
  U.modal('Diario', body=>{
    const tabs=document.createElement('div'); tabs.className='tabs';
    const nRich=(G.richieste||[]).filter(r=>!r.fatta).length;
    for(const [k,lab] of [['obiettivi','Obiettivi'],['richieste','Richieste'+(nRich?' ('+nRich+')':'')],['collezione','Collezione'],['abitanti','Abitanti'],['lettere','Lettere'],['stats','Podere']]){
      const b=document.createElement('button');
      b.className='tab'+(tab===k?' on':'');
      b.textContent=lab; b.onclick=()=>{ tab=k; U.aggiorna(); };
      tabs.appendChild(b);
    }
    body.appendChild(tabs);

    if(tab==='obiettivi'){
      const s=document.createElement('div'); s.className='sectitle'; s.textContent='La Lanterna del Solstizio';
      body.appendChild(s);
      const p=document.createElement('div'); p.className='muted';
      p.style.marginBottom='12px';
      p.innerHTML = `Braci accese: <b>${G.braci}/4</b>. `+
        (G.braci>=4 ? 'La valle è sveglia. Resta solo da viverci.'
                    : 'Porta al Santuario i frutti di ogni stagione.');
      body.appendChild(p);

      for(const b of DATA.SANTUARIO){
        const done=G.santuario[b.id];
        const r=document.createElement('div'); r.className='row';
        r.appendChild(ico(b.premio.item));
        const info=document.createElement('div'); info.className='rinfo';
        const dati = (G.santuarioDato[b.id]||[]).length;
        info.innerHTML=`<div class="rname">${b.nome} ${done?'✦':''}</div>`+
                       `<div class="rdesc">${b.testo}</div>`+
                       `<div class="ringr">${done?'<b>Completata.</b>':dati+'/'+b.req.length+' offerte'}</div>`;
        r.appendChild(info);
        body.appendChild(r);
      }

      // --- SAGRA DI STAGIONE ---
      if(G.sagra){
        const ss=document.createElement('div'); ss.className='sectitle'; ss.textContent='🎪 '+G.sagra.nome;
        body.appendChild(ss);
        const r=document.createElement('div'); r.className='row';
        r.appendChild(ico(G.sagra.icona));
        const info=document.createElement('div'); info.className='rinfo';
        const restano=Math.max(0, G.sagra.scadenza - G.giornoTot);
        const ho=G.sagraDisponibili();
        info.innerHTML=`<div class="rname">Consegna ${G.sagra.req} prodotti di stagione ${G.sagra.riscossa?'✦':''}</div>`+
                       `<div class="rdesc">Premio: <b>${G.sagra.premio}</b> monete · +amicizia in paese · scade tra ${restano} ${restano===1?'giorno':'giorni'}</div>`+
                       `<div class="ringr">${G.sagra.progresso}/${G.sagra.req}${G.sagra.fatta?' — pronta!':' · nello zaino: '+ho}</div>`;
        r.appendChild(info);
        if(G.sagra.riscossa){
          const t=document.createElement('span'); t.className='price'; t.style.opacity='.7'; t.textContent='vinta';
          r.appendChild(t);
        } else if(G.sagra.fatta){
          const b=document.createElement('button'); b.className='btn gold'; b.textContent='Riscuoti premio';
          b.onclick=()=>{ const nome=G.sagra.nome, pr=G.sagra.premio;
            if(G.riscuotiSagra()){ U.toast(nome+' vinta! +'+pr+' monete','gold'); G.aggiornaHUD(); U.aggiorna(); } };
          r.appendChild(b);
        } else {
          const b=document.createElement('button'); b.className='btn'; b.textContent='Contribuisci';
          b.disabled = ho<=0;
          b.onclick=()=>{
            const n=G.contribuisciSagra();
            if(n>0){ U.toast('Hai versato '+n+' prodotti alla sagra.','good'); U.aggiorna(); }
            else U.toast('Non hai prodotti di stagione da versare.','bad');
          };
          r.appendChild(b);
        }
        body.appendChild(r);
      }

      const s2=document.createElement('div'); s2.className='sectitle'; s2.textContent='Traguardi';
      body.appendChild(s2);
      const nota=document.createElement('div'); nota.className='muted';
      nota.style.cssText='font-size:12px;margin:-4px 0 8px';
      nota.textContent='Clicca un traguardo per sapere dove si fa e con cosa.';
      body.appendChild(nota);

      for(const o of G.obiettivi()){
        /* Un traguardo che dice solo cosa serve è un compito; quello che
           dice anche dove si fa è un suggerimento. Il come sta chiuso
           finché non lo si chiede, altrimenti l'elenco diventa un muro
           di testo e non si legge più niente. */
        const box=document.createElement('div'); box.className='obiettivo';
        const r=document.createElement('div'); r.className='row';
        r.appendChild(ico(o.icona));
        const info=document.createElement('div'); info.className='rinfo';
        const riscosso = G.obiettiviRiscossi && G.obiettiviRiscossi[o.id];
        info.innerHTML=`<div class="rname">${o.nome} ${o.fatto?'✔':''}<span class="ob-freccia">▾</span></div>`+
                       `<div class="rdesc">${o.desc}</div>`+
                       `<div class="ringr">${o.prog}${o.premio?' · premio '+o.premio+' ✦':''}</div>`;
        r.appendChild(info);
        if(o.fatto && !riscosso){
          const b=document.createElement('button'); b.className='btn gold'; b.textContent='Riscuoti';
          b.onclick=e=>{ e.stopPropagation(); const pr=o.premio;
            if(G.riscuotiObiettivo(o)){ U.toast('Traguardo riscosso! +'+pr+' monete','gold'); G.aggiornaHUD(); U.aggiorna(); } };
          r.appendChild(b);
        } else if(riscosso){
          const t=document.createElement('span'); t.className='price'; t.style.opacity='.7'; t.textContent='riscosso';
          r.appendChild(t);
        }
        box.appendChild(r);

        if(o.come){
          const come=document.createElement('div'); come.className='ob-come hidden';
          come.innerHTML='<div class="ob-come-tit">Come si fa</div>'+o.come;
          box.appendChild(come);
          r.classList.add('cliccabile');
          r.onclick=()=>{
            const chiuso = come.classList.contains('hidden');
            // uno alla volta: due spiegazioni aperte insieme non si leggono
            body.querySelectorAll('.ob-come').forEach(e=>e.classList.add('hidden'));
            body.querySelectorAll('.ob-freccia').forEach(e=>e.classList.remove('giu'));
            if(chiuso){
              come.classList.remove('hidden');
              info.querySelector('.ob-freccia').classList.add('giu');
              SND.play('menu');
            }
          };
        }
        body.appendChild(box);
      }
    }
    else if(tab==='richieste'){
      const intro=document.createElement('div'); intro.className='muted'; intro.style.marginBottom='12px';
      intro.textContent='Gli abitanti chiedono una mano. Consegna in tempo: monete e amicizia in cambio.';
      body.appendChild(intro);

      const attive=(G.richieste||[]).filter(r=>!r.fatta);
      if(!attive.length){
        const n=document.createElement('div'); n.className='muted';
        n.textContent='Nessuna richiesta al momento. Torna a controllare domani.';
        body.appendChild(n);
      }
      for(const r of attive){
        const N=DATA.NPCS[r.npc]; if(!N) continue;
        const row=document.createElement('div'); row.className='row';

        const c=document.createElement('canvas'); c.width=c.height=40;
        const cx=c.getContext('2d'); cx.imageSmoothingEnabled=false;
        cx.drawImage(ART.face(r.npc,N.look),0,0,40,40); c.style.borderRadius='7px';
        row.appendChild(c);

        const info=document.createElement('div'); info.className='rinfo';
        const restano = r.scadenza - G.giornoTot;
        const scad = restano<=0 ? '<b style="color:#d9694f">ultimo giorno!</b>'
                                : 'scade tra '+restano+(restano===1?' giorno':' giorni');
        const ho = G.conta(r.item);
        info.innerHTML =
          `<div class="rname">${N.nome} — ${r.qta}× ${IT.nome(r.item)}</div>`+
          `<div class="rdesc">Ricompensa: <b>${r.premio}</b> monete · +amicizia · <span style="opacity:.85">${scad}</span></div>`+
          `<div class="ringr">Ne hai ${ho}/${r.qta}</div>`;
        row.appendChild(info);

        const b=document.createElement('button'); b.className='btn'; b.textContent='Consegna';
        b.disabled = ho < r.qta;
        b.onclick=()=>{
          const nome=N.nome, premio=r.premio;
          if(G.completaRichiesta(r)){
            U.toast(nome+' ringrazia di cuore! +'+premio+' monete','gold');
            G.aggiornaHUD(); U.aggiorna();
          } else U.toast('Ti serve ancora qualcosa per completarla.','bad');
        };
        row.appendChild(b);
        body.appendChild(row);
      }
    }
    else if(tab==='collezione'){
      const cc=G.contaCollezione();
      const intro=document.createElement('div'); intro.className='muted'; intro.style.marginBottom='10px';
      intro.innerHTML=`Tutto ciò che hai scoperto nella valle. Completamento: <b>${cc.tot.d}/${cc.tot.t}</b> (${cc.tot.t?Math.round(cc.tot.d/cc.tot.t*100):0}%).`;
      body.appendChild(intro);
      const coll=G.collezione||{};
      for(const [nome,,ids] of G.categorieCollezione()){
        const d=ids.filter(id=>coll[id]).length;
        const s=document.createElement('div'); s.className='sectitle'; s.textContent=nome+' — '+d+'/'+ids.length;
        body.appendChild(s);
        const grid=document.createElement('div'); grid.className='invgrid';
        for(const id of ids){
          const scoperto=!!coll[id];
          const cell=document.createElement('div'); cell.className='icell'+(scoperto?'':' empty');
          if(scoperto){ cell.appendChild(ico(id)); cell.title=IT.nome(id); }
          else{
            const q=document.createElement('span'); q.textContent='?';
            q.style.cssText='font-size:20px;font-weight:800;color:#8a7c66;opacity:.55';
            cell.appendChild(q); cell.title='Non ancora scoperto';
          }
          grid.appendChild(cell);
        }
        body.appendChild(grid);
      }
    }
    else if(tab==='abitanti'){
      for(const id in DATA.NPCS){
        const N=DATA.NPCS[id];
        if(id==='fiammella' && G.braci<1) continue;
        const cuori = Math.floor((G.amicizia[id]||0)/100);
        const r=document.createElement('div'); r.className='row';
        const c=document.createElement('canvas'); c.width=c.height=40;
        const cx=c.getContext('2d'); cx.imageSmoothingEnabled=false;
        cx.drawImage(ART.face(id,N.look),0,0,40,40);
        c.style.borderRadius='7px';
        r.appendChild(c);
        const info=document.createElement('div'); info.className='rinfo';
        let hs='<div class="hearts">';
        for(let i=0;i<10;i++) hs+=`<span class="heart${i<cuori?' on':''}"></span>`;
        hs+='</div>';
        info.innerHTML=`<div class="rname">${N.nome}</div><div class="rdesc">${N.ruolo}</div>`+hs;
        r.appendChild(info);
        body.appendChild(r);
      }
      const n=document.createElement('div'); n.className='muted'; n.style.marginTop='10px';
      n.textContent='Parla con loro ogni giorno e fai un regalo due volte a settimana. Ognuno ha i suoi gusti.';
      body.appendChild(n);
    }
    else if(tab==='lettere'){
      const chiavi = Object.keys(DATA.LETTERE).filter(k=>G.lettere[k]);
      if(!chiavi.length){
        const n=document.createElement('div'); n.className='muted';
        n.textContent='Nessuna lettera ancora.';
        body.appendChild(n);
      }
      for(const k of chiavi){
        const r=document.createElement('div'); r.className='row';
        r.appendChild(ico('medaglione'));
        const info=document.createElement('div'); info.className='rinfo';
        info.innerHTML=`<div class="rname">${DATA.LETTERE[k].titolo}</div>`+
                       `<div class="rdesc">Da Nonna Ilde</div>`;
        r.appendChild(info);
        const b=document.createElement('button'); b.className='btn blue'; b.textContent='Rileggi';
        b.onclick=()=>{ U.chiudiModal(); U.lettera(k); };
        r.appendChild(b);
        body.appendChild(r);
      }
    }
    else {
      // --- ABILITÀ ---
      const sa=document.createElement('div'); sa.className='sectitle'; sa.textContent='Abilità';
      body.appendChild(sa);
      const skIco={agricoltura:'zappa', raccolta:'falce', estrazione:'piccone', pesca:'canna'};
      for(const k of ['agricoltura','raccolta','estrazione','pesca']){
        const lv=G.livello(k), xp=G.skills[k]||0;
        const cur=DATA.XP_LIV[lv]||0, next=DATA.XP_LIV[lv+1];
        const perc = next? Math.max(2,Math.round((xp-cur)/(next-cur)*100)) : 100;
        const bonus = {
          agricoltura:'Raccolti +'+(lv*3)+'% di valore · raccolto doppio ~'+(lv*2)+'%',
          raccolta:'Legna e foraggio extra ~'+(lv*4)+'%',
          estrazione:'Rocce più fragili · minerali extra ~'+Math.round((0.25+lv*0.03)*100)+'%',
          pesca:'Barra di pesca +'+(lv*7)+'px · pesci più stanchi'
        }[k];
        const row=document.createElement('div'); row.className='row';
        row.appendChild(ico(skIco[k]));
        const info=document.createElement('div'); info.className='rinfo';
        info.innerHTML=`<div class="rname">${DATA.SKILLS[k].nome} — Liv. ${lv}/10</div>`+
          `<div class="rdesc">${bonus}</div>`+
          `<div class="skbar"><div class="skfill" style="width:${perc}%"></div><span>${next?perc+'% → Liv. '+(lv+1):'MASSIMO'}</span></div>`;
        row.appendChild(info);
        body.appendChild(row);
      }

      const st=G.statistiche();
      const s=document.createElement('div'); s.className='sectitle'; s.textContent='Il podere in numeri';
      body.appendChild(s);
      const tbl=document.createElement('div');
      tbl.style.cssText='display:grid;grid-template-columns:1fr auto;gap:6px 18px;font-size:14px';
      for(const [k,v] of st){
        const a=document.createElement('div'); a.textContent=k; a.style.color='#7a5c3c';
        const b=document.createElement('div'); b.textContent=v; b.style.fontWeight='800';
        tbl.appendChild(a); tbl.appendChild(b);
      }
      body.appendChild(tbl);
    }
  });
};

/* ===================================================================
   MAPPA
   =================================================================== */
U.mappa = function(G){
  U.modal('Valle di Fioralba', body=>{
    const W=460, H=400;
    const c=document.createElement('canvas');
    c.width=W; c.height=H;
    c.style.cssText='width:100%;border:3px solid #8a6038;border-radius:10px;display:block';
    const x=c.getContext('2d');

    /* --- disposizione fedele ai passaggi reali ---
       A nord del paese la Miniera e, ancora sopra, il Passo innevato.
       A sud-est la Piazza del Porto e la Costa; a sud il Bosco. */
    const zone=[
      {id:'montagna', n:'Passo',    x:252, y:8,   w:150, h:48,  col:'#e2e8ee', col2:'#b6c2cc', ico:'montagna'},
      {id:'grotta',   n:'Miniera',  x:252, y:64,  w:150, h:48,  col:'#6d635a', col2:'#544c45', ico:'miniera'},
      {id:'podere',   n:'Podere',   x:30,  y:124, w:150, h:86,  col:'#7fb85c', col2:'#5f9442', ico:'podere'},
      {id:'fioralba', n:'Fioralba', x:252, y:124, w:150, h:86,  col:'#c4b26a', col2:'#9c8c4c', ico:'paese'},
      {id:'bosco',    n:'Bosco',    x:30,  y:224, w:210, h:100, col:'#4f8a46', col2:'#356030', ico:'bosco'},
      {id:'piazza',   n:'Piazza',   x:262, y:224, w:130, h:58,  col:'#cdbd93', col2:'#a89568', ico:'piazza'},
      {id:'spiaggia', n:'Costa',    x:262, y:294, w:130, h:54,  col:'#e8dcac', col2:'#cbb26c', ico:'spiaggia'}
    ];
    const strade=[
      [327,64, 327,56 ],    // grotta ↔ montagna
      [327,124, 327,112],   // fioralba ↔ miniera
      [180,167, 252,167],   // podere ↔ fioralba
      [327,224, 327,210],   // fioralba ↔ piazza
      [327,294, 327,282],   // piazza ↔ costa
      [105,210, 105,224],   // podere ↔ bosco
      [255,210, 235,224]    // fioralba ↔ bosco
    ];

    /* --- pergamena --- */
    const g=x.createLinearGradient(0,0,W,H);
    g.addColorStop(0,'#f2e0bb'); g.addColorStop(0.5,'#e9d3ab'); g.addColorStop(1,'#dcc294');
    x.fillStyle=g; x.fillRect(0,0,W,H);
    for(let i=0;i<900;i++){
      const bx=(ART.hsh(i,0,71)*W)|0, by=(ART.hsh(i,1,71)*H)|0;
      x.fillStyle = ART.hsh(i,2,71)>0.5 ? 'rgba(150,110,60,0.07)' : 'rgba(255,240,210,0.10)';
      x.fillRect(bx,by,2,2);
    }
    // macchie e bordi bruciacchiati
    for(let i=0;i<9;i++){
      const bx=ART.hsh(i,3,71)*W, by=ART.hsh(i,4,71)*H, r=8+ART.hsh(i,5,71)*26;
      const gg=x.createRadialGradient(bx,by,0,bx,by,r);
      gg.addColorStop(0,'rgba(160,115,60,0.10)'); gg.addColorStop(1,'rgba(160,115,60,0)');
      x.fillStyle=gg; x.beginPath(); x.arc(bx,by,r,0,6.3); x.fill();
    }
    const vg=x.createRadialGradient(W/2,H/2,W*0.3,W/2,H/2,W*0.66);
    vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(120,80,40,0.22)');
    x.fillStyle=vg; x.fillRect(0,0,W,H);

    /* --- strade tratteggiate --- */
    x.strokeStyle='#9a7048'; x.lineWidth=4; x.lineCap='round';
    x.setLineDash([6,6]);
    for(const s of strade){
      x.beginPath(); x.moveTo(s[0],s[1]); x.lineTo(s[2],s[3]); x.stroke();
    }
    x.setLineDash([]); x.lineCap='butt';

    /* --- regioni --- */
    for(const z of zone){
      const qui = z.id===G.mappaId;
      // ombra
      x.fillStyle='rgba(90,58,36,0.22)';
      arrotondato(x, z.x+4, z.y+5, z.w, z.h, 9); x.fill();
      // corpo
      const zg=x.createLinearGradient(z.x,z.y,z.x,z.y+z.h);
      zg.addColorStop(0,z.col); zg.addColorStop(1,z.col2);
      x.fillStyle=zg;
      arrotondato(x, z.x, z.y, z.w, z.h, 9); x.fill();
      // trama interna
      x.save();
      arrotondato(x, z.x, z.y, z.w, z.h, 9); x.clip();
      disegnaTrama(x, z);
      x.restore();
      // cornice
      x.strokeStyle = qui ? '#f2c14e' : '#5b3a24';
      x.lineWidth = qui ? 4 : 2.5;
      arrotondato(x, z.x, z.y, z.w, z.h, 9); x.stroke();

      // etichetta su cartiglio
      const lw = x.measureText(z.n).width;
      x.font='bold 15px Nunito, sans-serif';
      const tw = x.measureText(z.n).width + 18;
      x.fillStyle='rgba(246,230,200,0.92)';
      arrotondato(x, z.x+9, z.y+8, tw, 22, 6); x.fill();
      x.strokeStyle='#8a6038'; x.lineWidth=1.5;
      arrotondato(x, z.x+9, z.y+8, tw, 22, 6); x.stroke();
      x.fillStyle='#4a3320';
      x.fillText(z.n, z.x+18, z.y+24);

      // segnalino "viaggio rapido" sui luoghi scoperti (diversi da quello attuale)
      if(z.id!==G.mappaId && G.visitati && G.visitati[z.id]){
        x.font='bold 11px Nunito, sans-serif';
        const chip='▸ vai', cw=x.measureText(chip).width+12;
        x.fillStyle='rgba(242,193,78,0.94)';
        arrotondato(x, z.x+z.w-cw-8, z.y+z.h-25, cw, 17, 6); x.fill();
        x.strokeStyle='#8a6417'; x.lineWidth=1;
        arrotondato(x, z.x+z.w-cw-8, z.y+z.h-25, cw, 17, 6); x.stroke();
        x.fillStyle='#3d2a08'; x.fillText(chip, z.x+z.w-cw-2, z.y+z.h-12.5);
      }
    }

    /* --- segnalino "sei qui" (le miniere profonde ricadono sulla Miniera) --- */
    const zid = (G.mappaId==='grotta2'||G.mappaId==='grotta3') ? 'grotta' : G.mappaId;
    const z = zone.find(z=>z.id===zid);
    if(z){
      const m=G.mappa();
      const pxp = z.x + 10 + (G.p.px/(m.w*32))*(z.w-20);
      const pyp = z.y + 34 + (G.p.py/(m.h*32))*(z.h-44);
      x.fillStyle='rgba(0,0,0,0.25)';
      x.beginPath(); x.ellipse(pxp,pyp+7,7,3,0,0,6.3); x.fill();
      // spillo
      x.strokeStyle='#7a2f22'; x.lineWidth=3;
      x.beginPath(); x.moveTo(pxp,pyp+6); x.lineTo(pxp,pyp-4); x.stroke();
      x.fillStyle='#d9694f';
      x.beginPath(); x.arc(pxp,pyp-8,6.5,0,6.3); x.fill();
      x.strokeStyle='#fff8e4'; x.lineWidth=2; x.stroke();
      x.fillStyle='#fff8e4';
      x.beginPath(); x.arc(pxp-2,pyp-10,2,0,6.3); x.fill();
    }

    /* --- rosa dei venti --- */
    const rx=44, ry=H-42;
    x.strokeStyle='#8a6038'; x.lineWidth=2;
    x.beginPath(); x.arc(rx,ry,20,0,6.3); x.stroke();
    x.globalAlpha=0.5; x.beginPath(); x.arc(rx,ry,14,0,6.3); x.stroke(); x.globalAlpha=1;
    for(let i=0;i<4;i++){
      const a=i*Math.PI/2 - Math.PI/2;
      x.fillStyle = i===0 ? '#c0392b' : '#8a6038';
      x.beginPath();
      x.moveTo(rx+Math.cos(a)*19, ry+Math.sin(a)*19);
      x.lineTo(rx+Math.cos(a+2.3)*6, ry+Math.sin(a+2.3)*6);
      x.lineTo(rx+Math.cos(a-2.3)*6, ry+Math.sin(a-2.3)*6);
      x.closePath(); x.fill();
    }
    x.fillStyle='#5b3a24'; x.font='bold 11px Nunito, sans-serif';
    x.fillText('N', rx-4, ry-24);

    // --- viaggio rapido: clic su un luogo scoperto ---
    c.style.cursor='pointer';
    c.onclick = (ev)=>{
      const r=c.getBoundingClientRect();
      const cxp=(ev.clientX-r.left)*(W/r.width), cyp=(ev.clientY-r.top)*(H/r.height);
      for(const zn of zone){
        if(cxp>=zn.x && cxp<=zn.x+zn.w && cyp>=zn.y && cyp<=zn.y+zn.h){
          if(zn.id===G.mappaId) return;
          if(G.visitati && G.visitati[zn.id]){ U.chiudiModal(); SND.play('menu'); G.viaggiaRapido(zn.id); }
          else U.toast('Non hai ancora scoperto «'+zn.n+'». Arrivaci a piedi la prima volta.','bad');
          return;
        }
      }
    };

    body.appendChild(c);

    const n=document.createElement('div'); n.className='muted'; n.style.marginTop='12px';
    n.innerHTML = `<b>Tocca un luogo con «▸ vai» per il viaggio rapido.</b> `+
      `Sei in: ${G.mappa().nome}. `+
      `Dal podere: <b>est</b> il paese, <b>sud</b> il bosco. `+
      `Dal paese: <b>nord</b> la miniera (e ancora su il passo innevato), <b>sud-est</b> la piazza e la costa. `+
      `In fondo alla miniera scendi ai livelli profondi.`;
    body.appendChild(n);
  });
};

function arrotondato(x, bx, by, w, h, r){
  x.beginPath();
  x.moveTo(bx+r,by);
  x.lineTo(bx+w-r,by); x.quadraticCurveTo(bx+w,by,bx+w,by+r);
  x.lineTo(bx+w,by+h-r); x.quadraticCurveTo(bx+w,by+h,bx+w-r,by+h);
  x.lineTo(bx+r,by+h); x.quadraticCurveTo(bx,by+h,bx,by+h-r);
  x.lineTo(bx,by+r); x.quadraticCurveTo(bx,by,bx+r,by);
  x.closePath();
}

/* piccoli simboli disegnati dentro ogni regione */
function disegnaTrama(x, z){
  const R=(i,s)=>ART.hsh(i, z.x+z.y, s);
  if(z.ico==='bosco' || z.ico==='podere'){
    const n = z.ico==='bosco' ? 26 : 9;
    for(let i=0;i<n;i++){
      const bx=z.x+12+R(i,11)*(z.w-24), by=z.y+34+R(i,12)*(z.h-46);
      x.fillStyle='rgba(30,58,26,0.55)';
      x.beginPath(); x.moveTo(bx,by-9); x.lineTo(bx-6,by+3); x.lineTo(bx+6,by+3); x.closePath(); x.fill();
      x.fillStyle='rgba(30,58,26,0.75)'; x.fillRect(bx-1,by+2,2,4);
    }
  }
  if(z.ico==='podere'){
    // solchi del campo
    x.strokeStyle='rgba(110,80,40,0.35)'; x.lineWidth=2;
    for(let i=0;i<5;i++){
      const yy=z.y+50+i*9;
      x.beginPath(); x.moveTo(z.x+18,yy); x.lineTo(z.x+z.w*0.52,yy); x.stroke();
    }
    // casetta
    const hx=z.x+z.w-46, hy=z.y+z.h-34;
    x.fillStyle='rgba(120,70,44,0.85)'; x.fillRect(hx,hy,24,16);
    x.fillStyle='rgba(160,60,48,0.9)';
    x.beginPath(); x.moveTo(hx-4,hy); x.lineTo(hx+12,hy-12); x.lineTo(hx+28,hy); x.closePath(); x.fill();
    x.fillStyle='rgba(255,220,150,0.9)'; x.fillRect(hx+9,hy+5,7,7);
  }
  if(z.ico==='paese'){
    for(let i=0;i<6;i++){
      const bx=z.x+22+i*23, by=z.y+46+((i%2)*20);
      x.fillStyle='rgba(120,70,44,0.8)'; x.fillRect(bx,by,17,13);
      x.fillStyle='rgba(160,60,48,0.85)';
      x.beginPath(); x.moveTo(bx-3,by); x.lineTo(bx+8,by-9); x.lineTo(bx+20,by); x.closePath(); x.fill();
      x.fillStyle='rgba(255,220,150,0.85)'; x.fillRect(bx+6,by+4,5,5);
    }
    // fiume a est
    x.strokeStyle='rgba(70,130,170,0.55)'; x.lineWidth=6;
    x.beginPath(); x.moveTo(z.x+z.w-16,z.y+30);
    x.quadraticCurveTo(z.x+z.w-26,z.y+z.h/2, z.x+z.w-14,z.y+z.h-6); x.stroke();
  }
  if(z.ico==='miniera'){
    for(let i=0;i<10;i++){
      const bx=z.x+16+R(i,21)*(z.w-32), by=z.y+34+R(i,22)*(z.h-42);
      x.fillStyle='rgba(40,36,32,0.5)';
      x.beginPath(); x.moveTo(bx,by-7); x.lineTo(bx-7,by+4); x.lineTo(bx+7,by+4); x.closePath(); x.fill();
    }
    // ingresso della miniera
    const mx=z.x+z.w/2, my=z.y+z.h-16;
    x.fillStyle='rgba(30,26,22,0.85)';
    x.beginPath(); x.arc(mx,my,10,Math.PI,0); x.fill();
    x.fillRect(mx-10,my,20,8);
    x.fillStyle='rgba(140,100,60,0.9)';
    x.fillRect(mx-13,my-12,4,20); x.fillRect(mx+9,my-12,4,20); x.fillRect(mx-13,my-14,26,4);
  }
  if(z.ico==='bosco'){
    // il santuario, a est
    const sx0=z.x+z.w-58, sy0=z.y+z.h-34;
    x.fillStyle='rgba(200,192,176,0.9)';
    x.fillRect(sx0,sy0,6,20); x.fillRect(sx0+22,sy0,6,20);
    x.fillRect(sx0-4,sy0-6,36,7);
    x.beginPath(); x.moveTo(sx0-6,sy0-6); x.lineTo(sx0+14,sy0-20); x.lineTo(sx0+34,sy0-6); x.closePath(); x.fill();
    x.fillStyle='rgba(255,215,120,0.95)';
    x.beginPath(); x.arc(sx0+14,sy0+7,5,0,6.3); x.fill();
    // stagno a ovest
    x.fillStyle='rgba(70,130,170,0.5)';
    x.beginPath(); x.ellipse(z.x+46,z.y+z.h-26,24,13,0,0,6.3); x.fill();
  }
  if(z.ico==='montagna'){
    for(let i=0;i<3;i++){
      const bx=z.x+34+i*42, by=z.y+z.h-8;
      x.fillStyle='rgba(140,158,176,0.75)';
      x.beginPath(); x.moveTo(bx,by); x.lineTo(bx-18,z.y+18); x.lineTo(bx+18,by); x.closePath(); x.fill();
      x.fillStyle='rgba(255,255,255,0.9)';
      x.beginPath(); x.moveTo(bx-18,z.y+18); x.lineTo(bx-11,z.y+26); x.lineTo(bx-25,z.y+26); x.closePath(); x.fill();
    }
  }
  if(z.ico==='piazza'){
    const fx=z.x+z.w/2, fy=z.y+z.h/2+2;
    x.fillStyle='rgba(70,130,170,0.5)'; x.beginPath(); x.arc(fx,fy,9,0,6.3); x.fill();
    x.strokeStyle='rgba(120,80,44,0.75)'; x.lineWidth=2; x.stroke();
    for(let i=0;i<3;i++){ const bx=z.x+24+i*34, by=z.y+z.h-16;
      x.fillStyle='rgba(160,70,50,0.7)'; x.fillRect(bx,by,16,8);
      x.fillStyle='rgba(120,70,44,0.8)'; x.fillRect(bx,by+8,16,4);
    }
  }
  if(z.ico==='spiaggia'){
    x.strokeStyle='rgba(70,140,175,0.65)'; x.lineWidth=2.5;
    for(let r=0;r<3;r++){
      const yy=z.y+z.h-10-r*8;
      x.beginPath();
      for(let bx=z.x+8;bx<z.x+z.w-8;bx+=6) x.lineTo(bx, yy+Math.sin(bx*0.4+r)*2.2);
      x.stroke();
    }
    x.fillStyle='rgba(120,70,44,0.8)'; x.fillRect(z.x+z.w/2-3, z.y+24, 6, z.h-34);
  }
}

/* ===================================================================
   MENU DI SISTEMA
   =================================================================== */
U.menu = function(G){
  U.modal('Menu', body=>{
    const wrap=document.createElement('div');
    wrap.style.cssText='display:flex;flex-direction:column;gap:10px';

    const info=document.createElement('div'); info.className='muted';
    info.innerHTML=`<b>${G.nomeGiocatore}</b> · ${G.stagione().nome} ${G.giorno}, Anno ${G.anno}<br>`+
                   `${G.oro} monete · ${G.braci}/4 braci accese`;
    wrap.appendChild(info);

    /* volumi */
    const vol=document.createElement('div');
    vol.innerHTML='<div class="sectitle" style="margin-top:6px">Audio</div>';
    for(const [lab,key,val] of [['Musica','m',SND.volMusica],['Effetti','s',SND.volSfx]]){
      const r=document.createElement('div');
      r.style.cssText='display:flex;align-items:center;gap:10px;margin-bottom:7px;font-size:14px;font-weight:700';
      const l=document.createElement('span'); l.textContent=lab; l.style.width='70px';
      const inp=document.createElement('input');
      inp.type='range'; inp.min=0; inp.max=100; inp.value=Math.round(val*100);
      inp.style.flex='1';
      inp.oninput=()=>{
        const v=inp.value/100;
        if(key==='m') SND.setVol(v, undefined); else SND.setVol(undefined, v);
      };
      r.appendChild(l); r.appendChild(inp);
      vol.appendChild(r);
    }
    wrap.appendChild(vol);

    /* guida "Primi passi": si può nascondere e riaccendere quando si vuole */
    if(window.GUIDA && !GUIDA.completata()){
      const gt=document.createElement('div'); gt.className='sectitle'; gt.textContent='Guida';
      wrap.appendChild(gt);
      const bg=document.createElement('button'); bg.className='btn blue';
      bg.textContent = GUIDA.nascosta() ? '🧭 Mostra i Primi passi' : '🧭 Nascondi i Primi passi';
      bg.onclick=()=>{
        if(GUIDA.nascosta()){ GUIDA.mostra(); U.toast('Guida di nuovo a schermo.','good'); }
        else { GUIDA.nascondi(); U.toast('Guida nascosta.'); }
        U.aggiorna();
      };
      wrap.appendChild(bg);
    }

    const t=document.createElement('div'); t.className='sectitle'; t.textContent='Partita';
    wrap.appendChild(t);

    const bs=document.createElement('button'); bs.className='btn'; bs.textContent='Salva partita';
    bs.onclick=()=>{
      if(G.salva()) U.toast('Partita salvata.','good');
      else U.toast('Salvataggio non riuscito: il browser blocca la memoria locale su questa pagina.','bad');
    };
    wrap.appendChild(bs);

    /* esporta / importa il salvataggio come file */
    const bkp=document.createElement('div');
    bkp.style.cssText='display:flex;gap:8px';
    const bex=document.createElement('button'); bex.className='btn gold'; bex.textContent='⬇ Esporta salvataggio';
    bex.style.flex='1';
    bex.onclick=()=>{
      G.salva();
      if(G.esporta()) U.toast('Salvataggio esportato.','good');
      else U.toast('Esportazione non riuscita.','bad');
    };
    const bim=document.createElement('button'); bim.className='btn blue'; bim.textContent='⬆ Importa salvataggio';
    bim.style.flex='1';
    bim.onclick=()=>{ G.importaDaFile(); };
    bkp.appendChild(bex); bkp.appendChild(bim);
    wrap.appendChild(bkp);
    const nota=document.createElement('div'); nota.className='muted';
    nota.style.cssText='font-size:12px;margin-top:-2px';
    nota.textContent='Importare un file sostituisce la partita attuale.';
    wrap.appendChild(nota);

    const bh=document.createElement('button'); bh.className='btn blue'; bh.textContent='Come si gioca';
    bh.onclick=()=>{ U.chiudiModal(); U.comeSiGioca(); };
    wrap.appendChild(bh);

    const bq=document.createElement('button'); bq.className='btn red'; bq.textContent='Salva ed esci al titolo';
    bq.onclick=()=>{ G.salva(); location.reload(); };
    wrap.appendChild(bq);

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
    n.textContent='Clicca un oggetto per spostarlo dentro o fuori. Trascina per riordinare.';
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
          if(!G.puoiAggiungere(s.id,s.n)){ U.toast('Zaino pieno.','bad'); return; }
          G.aggiungi(s.id,s.n); obj.slots[i]=null;
          SND.play('prendi'); U.aggiorna();
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
          // cerca slot nella cassa
          let k=obj.slots.findIndex(x=>x&&x.id===s.id);
          if(k<0) k=obj.slots.findIndex(x=>!x);
          if(k<0){ U.toast('La cassa è piena.','bad'); return; }
          if(obj.slots[k]) obj.slots[k].n += s.n; else obj.slots[k]={id:s.id,n:s.n};
          G.inv[i]=null;
          G.rinfrescaHotbar();
          SND.play('prendi'); U.aggiorna();
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
    b.onclick=()=>{ U.chiudiModal(); if(dopo) dopo(); };
    body.appendChild(b);
  }, dopo);
};

})();
