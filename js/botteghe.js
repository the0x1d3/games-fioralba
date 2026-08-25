/* ===================================================================
   FIORALBA — botteghe.js
   Le finestre in cui gli oggetti passano di mano o cambiano forma: lo
   zaino, la bottega di Bruno e il banco del mercante, il banco da
   lavoro, i fornelli, la fucina di Tobia e le offerte al Santuario.

   Il nome dice «botteghe» e ci stanno dentro anche lo zaino e il
   Santuario, che botteghe non sono: il filo vero è che sono le sei
   finestre che maneggiano gli oggetti — le si apre con qualcosa in mano
   o per prendere qualcosa. Le altre finestre di ui.js raccontano
   (il Diario), spiegano (il Menu) o interrompono (i dialoghi).

   Sono 610 righe contigue che dal resto di ui.js prendevano una cosa
   sola, `ico`, che è già pubblica come `U.ico`. Le loro tre private —
   `mostraOggetto`, `rigaCompra`, `rigaVendi` — non uscivano di lì.

   Come partite.js e diario.js: si carica DOPO ui.js e scrive sullo
   stesso oggetto `UI`, quindi `UI.inventario`, `UI.negozio`,
   `UI.fucina` e le altre continuano a chiamarsi così da game.js —
   nessun punto di chiamata cambia.
   =================================================================== */
(function(){

const U = UI;
const ico = U.ico;

/* Il solito guscio della lingua, come in partite.js e diario.js. */
const T = s => (window.LINGUA ? LINGUA.t(s) : s);

/* ===================================================================
   INVENTARIO
   =================================================================== */
/* ===================================================================
   LO ZAINO

   Era una colonna sola: ventiquattro caselle indistinte, e sotto le
   abilità, in una finestra lunga il doppio dello schermo. Due cose
   sbagliate insieme.

   La prima: le prime nove caselle *non sono* come le altre — sono la
   barra che si vede sempre, quella che hai in mano. Erano disegnate
   uguali alle altre e messe in fila con loro, quindi non si capiva.
   Adesso stanno per conto loro, in una riga con la sua cornice e il suo
   titolo, e sotto ci sono le due righe del deposito vero.

   La seconda: le abilità non c'entrano niente con gli oggetti, e stando
   sotto obbligavano a scorrere per vedere le une o gli altri. Sono
   passate a destra, dove c'era spazio vuoto.
   =================================================================== */
U.inventario = function(G, presoIniziale){
  U.modal('Zaino', body=>{
    const cols=document.createElement('div'); cols.className='zaino-cols';
    const sx=document.createElement('div'); cols.appendChild(sx);
    const dx=document.createElement('div'); dx.className='zaino-dx'; cols.appendChild(dx);
    body.appendChild(cols);

    /* --- colonna destra: chi sei e cosa sai fare --- */
    const scheda=document.createElement('div'); scheda.className='zaino-scheda';
    scheda.innerHTML =
      `<div class="zs-nome">${G.nomeGiocatore}</div>`+
      `<div class="zs-riga"><span>Monete</span><b>${G.oro}</b></div>`+
      `<div class="zs-riga"><span>Caselle usate</span><b>${G.inv.filter(s=>s).length}/${G.invMax}</b></div>`+
      `<div class="zs-riga"><span>Energia</span><b>${Math.round(G.energia)}/${G.energiaMax}</b></div>`;
    dx.appendChild(scheda);

    const tAb=document.createElement('div'); tAb.className='sectitle'; tAb.textContent='Abilità';
    dx.appendChild(tAb);
    /* il conto lo fa LIV.progresso, non più questa funzione per conto suo:
       le due percentuali — qui e nel diario — arrotondavano in modo
       diverso e la stessa abilità risultava al 61% di là e al 62% di qua */
    for(const k in DATA.SKILLS){
      const p = LIV.progresso(k);
      const d=document.createElement('div'); d.className='skill';
      d.innerHTML = `<div class="skill-top"><span>${DATA.SKILLS[k].nome}</span><span>${p.massimo?'MAX':'Liv. '+p.liv}</span></div>`+
                    `<div class="skill-bar"><i style="width:${Math.round(p.perc)}%"></i></div>`+
                    `<div class="muted" style="font-size:11.5px;margin-top:2px">`+
                    (p.massimo ? DATA.SKILLS[k].desc
                               : 'ancora '+p.mancano.toLocaleString('it-IT')+' → liv. '+(p.liv+1))+
                    `</div>`;
      d.style.cursor='pointer';
      d.title='Apri i livelli';
      d.onclick=()=>U.diario(G,'livelli');
      dx.appendChild(d);
    }

    /* --- colonna sinistra: la barra, poi il deposito --- */
    const tBarra=document.createElement('div'); tBarra.className='sectitle';
    tBarra.innerHTML = 'In mano <span class="sec-nota">— la barra che vedi sempre, tasti 1-9</span>';
    sx.appendChild(tBarra);
    const gBarra=document.createElement('div'); gBarra.className='invgrid invgrid-9 grid-barra';
    sx.appendChild(gBarra);

    const tDep=document.createElement('div'); tDep.className='sectitle';
    tDep.innerHTML = 'Nello zaino <span class="sec-nota">— trascina per spostare</span>';
    sx.appendChild(tDep);
    const gDep=document.createElement('div'); gDep.className='invgrid invgrid-9';
    sx.appendChild(gDep);

    const aiuto=document.createElement('div'); aiuto.className='muted';
    aiuto.style.cssText='font-size:12px;margin:8px 0 0';
    sx.appendChild(aiuto);

    // una sola griglia logica: le celle vanno nell'una o nell'altra
    const g={ children:[], appendChild(c){ this.children.push(c); (this.children.length<=9?gBarra:gDep).appendChild(c); } };
    /* Lo spostamento funziona in due modi apposta. Trascinare è quello
       che uno prova per primo; ma il trascinamento è anche il gesto che
       riesce peggio — parte per sbaglio, si perde a metà, e su un
       trackpad è una piccola prova di abilità. Quindi c'è anche il
       clic-clic: scegli la casella, scegli dove va. Uno dei due
       funziona sempre. */
    let preso = (typeof presoIniziale==='number' && G.inv[presoIniziale]) ? presoIniziale : -1;
    const ridisegna = ()=>{ U.chiudiModal(); U.inventario(G); };
    const marca = ()=>{
      g.children.forEach((c,i)=>c.classList.toggle('presa', i===preso));
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
    marca();
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
    const schede = tipo==='bruno'
      ? [['compra','Compra'],['vendi','Vendi'],['gatto','Gatto']]
      : [['compra','Compra'],['vendi','Vendi']];
    for(const [k,lab] of schede){
      const b=document.createElement('button');
      b.className='tab'+(tab===k?' on':'');
      b.textContent=T(lab);
      b.onclick=()=>{ tab=k; U.aggiorna(); };
      tabs.appendChild(b);
    }
    const oro=document.createElement('span');
    oro.style.cssText='margin-left:auto;font-weight:800;color:#c9922b;align-self:center';
    oro.textContent = G.oro+' monete';
    tabs.appendChild(oro);
    body.appendChild(tabs);

    if(tab==='gatto'){
      const intro=document.createElement('div'); intro.className='muted';
      intro.style.margin='2px 0 10px';
      intro.textContent='Un aspetto nuovo per il tuo gatto. L’aspetto scelto viene applicato subito.';
      body.appendChild(intro);
      for(const aspetto of (DATA.GATTI||[])) body.appendChild(rigaAspettoGatto(G, aspetto));
    } else if(tab==='compra'){
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

function rigaAspettoGatto(G, aspetto){
  const r=document.createElement('div'); r.className='row gatto-riga';
  const anteprima=document.createElement('canvas');
  anteprima.width=64; anteprima.height=64; anteprima.className='gatto-riga-preview';
  const sprite=window.ART && ART.gatto ? ART.gatto(aspetto.id,0,1) : null;
  if(sprite) anteprima.getContext('2d').drawImage(sprite,0,0,64,64);
  r.appendChild(anteprima);
  const info=document.createElement('div'); info.className='rinfo';
  const nome=document.createElement('div'); nome.className='rname'; nome.textContent=aspetto.nome;
  const desc=document.createElement('div'); desc.className='rdesc';
  const posseduti=Array.isArray(G.gatto && G.gatto.aspetti) ? G.gatto.aspetti : ['arancio'];
  const possiede=posseduti.includes(aspetto.id);
  const attivo=G.gatto && G.gatto.skin===aspetto.id;
  desc.textContent=attivo ? 'Aspetto attuale.' : (possiede ? 'Già adottato.' : 'Da adottare una volta sola.');
  info.append(nome,desc); r.appendChild(info);
  const b=document.createElement('button'); b.className='btn'+(attivo?'':' gold');
  if(attivo){
    b.textContent='In uso'; b.disabled=true;
  }else if(possiede){
    b.textContent='Applica';
    b.onclick=()=>{
      G.gatto.skin=aspetto.id;
      G.salva(); SND.play('menu'); U.toast(aspetto.nome+' è il nuovo aspetto del gatto.','good');
      U.aggiorna(); G.aggiornaHUD();
    };
  }else{
    b.textContent='Adotta · '+aspetto.prezzo+' ✦';
    b.disabled=G.oro<aspetto.prezzo;
    b.title=b.disabled ? 'Servono '+aspetto.prezzo+' monete.' : '';
    b.onclick=()=>{
      if(G.oro<aspetto.prezzo) return;
      G.oro-=aspetto.prezzo;
      G.gatto.aspetti=[...new Set([...(G.gatto.aspetti||[]),aspetto.id])];
      G.gatto.skin=aspetto.id;
      G.salva(); SND.play('moneta'); U.toast(aspetto.nome+' ora ti segue per la valle.','good');
      U.aggiorna(); G.aggiornaHUD();
    };
  }
  r.appendChild(b);
  return r;
}

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
      b.textContent=T(lab);
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
      b.textContent=T(lab);
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

})();
