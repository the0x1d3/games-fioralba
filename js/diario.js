/* ===================================================================
   FIORALBA — diario.js
   Le due finestre grandi che raccontano la partita invece di farla
   giocare: il Diario (traguardi, collezione, abitanti, richieste,
   lettere, podere) e la Mappa della valle.

   Sono uscite insieme da ui.js perché sono contigue, sono le due più
   grosse del file, e dal resto non prendono quasi niente: fra tutte e
   due usano `ico` — che è già pubblica come `U.ico` — e le due private
   `arrotondato` e `disegnaTrama`, che sono di qui e non escono.

   `spoglia` è venuta via con loro. Stava scritta accanto a `IT.dove`,
   che risponde in HTML, e serve a togliere i tag quando quel testo
   finisce dentro a un attributo `title` invece che nella pagina — ma il
   solo posto che lo fa è il Diario. Stessa regola delle fasce
   dell'agenda: una comodità non sta dove è nata, sta dove sta chi la
   usa.

   Come partite.js: si carica DOPO ui.js e scrive sullo stesso oggetto
   `UI`, quindi `UI.diario(G, tab)` e `UI.mappa(G)` continuano a
   chiamarsi così da game.js e dal pannello di prova — nessun punto di
   chiamata cambia.
   =================================================================== */
(function(){

const U = UI;
const ico = U.ico;         // la fabbrica di icone resta di ui.js: la usano in tredici

/* I tre gusci della lingua, ridichiarati come in partite.js: stanno
   sopra a LINGUA, che è la strozzatura vera, e valgono meno di un
   modulo che li tenga. */
const T = s => (window.LINGUA ? LINGUA.t(s) : s);
const F = (modello, ...pezzi)=> window.LINGUA
  ? LINGUA.f(modello, ...pezzi)
  : modello.replace(/\{(\d+)\}/g, (_,i)=>pezzi[i]);
const NUM = v => (window.LINGUA ? LINGUA.n(v) : String(v));

/* ===================================================================
   DIARIO
   =================================================================== */
U.diario = function(G, tabIniziale){
  let tab=tabIniziale||'obiettivi';
  U.modal('Diario', body=>{
    const tabs=document.createElement('div'); tabs.className='tabs';
    const nRich=(G.richieste||[]).filter(r=>!r.fatta).length;
    // il pallino sui Livelli quando c'è un premio da ritirare: senza,
    // un oggetto rimasto fuori dallo zaino resterebbe lì per sempre
    const nPremi = (window.LIV && LIV.sospesi()) || 0;
    for(const [k,lab] of [['obiettivi','Obiettivi'],['livelli','Livelli'+(nPremi?' •':'')],['richieste','Richieste'+(nRich?' ('+nRich+')':'')],['collezione','Collezione'],['abitanti','Abitanti'],['lettere','Lettere'],['stats','Podere']]){
      const b=document.createElement('button');
      b.className='tab'+(tab===k?' on':'');
      b.textContent=T(lab); b.onclick=()=>{ tab=k; U.aggiorna(); };
      tabs.appendChild(b);
    }
    body.appendChild(tabs);

    if(tab==='obiettivi'){
      const s=document.createElement('div'); s.className='sectitle'; s.textContent=T('La Lanterna del Solstizio');
      body.appendChild(s);
      const p=document.createElement('div'); p.className='muted';
      p.style.marginBottom='12px';
      p.innerHTML = `Braci accese: <b>${G.braci}/4</b>. `+
        (G.braci>=4 ? 'La valle è sveglia. Resta solo da viverci.'
                    : 'Porta al Santuario i frutti di ogni stagione.');
      body.appendChild(p);

      /* Il ponte è la chiave: senza, al Santuario non ci si arriva, e
         un elenco di cinque offerte per un posto che non esiste ancora
         è un compito senza porta. Con il ponte invece la porta c'è, e
         allora tenere l'elenco solo laggiù vuol dire farsi la strada
         ogni volta per rileggere cosa manca. */
      const conPonte = !!(G.costruzioni && G.costruzioni.ponte);

      for(const b of DATA.SANTUARIO){
        const done=G.santuario[b.id];
        const r=document.createElement('div'); r.className='row';
        r.appendChild(ico(b.premio.item));
        const info=document.createElement('div'); info.className='rinfo';
        const dati = (G.santuarioDato[b.id]||[]).length;
        info.innerHTML=`<div class="rname">${b.nome} ${done?'✦':''}</div>`+
                       `<div class="rdesc">${b.testo}</div>`+
                       `<div class="ringr">${done?'<b>Completata.</b>':dati+'/'+b.req.length+' '+T('offerte')}</div>`;
        r.appendChild(info);
        body.appendChild(r);

        /* --- cosa serve, e dove si trova ---
           Stessa forma di «dove si trovano» nella Collezione: una riga
           che si apre, non un muro di testo sempre aperto. Quattro
           braci aperte insieme sono venti righe. */
        if(conPonte && !done){
          const dato = G.santuarioDato[b.id] || [];
          const box=document.createElement('div'); box.className='coll-manca';
          const cap=document.createElement('div'); cap.className='coll-manca-cap cliccabile';
          const restano = b.req.filter(x=>dato.indexOf(x)<0).length;
          cap.innerHTML='<span class="ob-freccia"></span>'+
                        F('Cosa serve — te ne mancano {0}', restano);
          const lista=document.createElement('div'); lista.className='coll-manca-lista hidden';
          for(const id of b.req){
            const gia = dato.indexOf(id)>=0;
            const riga=document.createElement('div');
            riga.className='coll-manca-riga' + (gia ? ' data' : '');
            const c=document.createElement('div'); c.className='icell mini'; c.appendChild(ico(id));
            riga.appendChild(c);
            const t=document.createElement('div');
            /* Quello già offerto resta in elenco, spento: sapere cosa hai
               già portato è metà dell'informazione, e toglierlo dalla
               lista farebbe sembrare che il Santuario ne voglia meno. */
            t.innerHTML='<b>'+IT.nome(id)+(gia?' ✦':'')+'</b>'+
                        '<div class="rdesc">'+(gia ? T('già offerto') : IT.dove(id))+'</div>';
            riga.appendChild(t);
            lista.appendChild(riga);
          }
          cap.onclick=()=>{
            const chiuso=lista.classList.contains('hidden');
            lista.classList.toggle('hidden', !chiuso);
            cap.querySelector('.ob-freccia').classList.toggle('giu', chiuso);
            SND.play('menu');
          };
          box.appendChild(cap); box.appendChild(lista);
          body.appendChild(box);
        }
      }
      if(!conPonte){
        const n=document.createElement('div'); n.className='muted';
        n.style.margin='2px 0 10px';
        n.textContent = T('Al Santuario si arriva dal bosco, oltre il burrone: serve il ponte. Da lì saprai cosa chiede ogni brace.');
        body.appendChild(n);
      }

      // --- SAGRA DI STAGIONE ---
      if(G.sagra){
        const ss=document.createElement('div'); ss.className='sectitle'; ss.textContent=T('🎪 ')+G.sagra.nome;
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
    else if(tab==='livelli'){
      // il contenuto sta in livelli.js: qui c'è solo la finestra che lo ospita
      LIV.scheda(body);
    }
    else if(tab==='richieste'){
      /* --- LE STORIE DEL PAESE, sopra alle richieste della bacheca ---

         Stanno insieme perché sono la stessa domanda — «cosa devo fare
         adesso» — ma in cima, e con la riga in grande, perché sono
         diverse: la bacheca chiede sei carote entro giovedì e domani ne
         chiede altre, una storia comincia e finisce una volta sola.

         Le storie che ancora non si sono aperte si vedono lo stesso, ma
         senza titolo: sapere che una persona ha qualcosa da raccontare è
         metà del motivo per portarle dei regali, e senza questa riga i
         cuori restano un numero che sale e basta — che è esattamente
         com'era prima. */
      const atti = VICENDE.attive(), pronte = VICENDE.pronte(),
            finite = VICENDE.finite(), attesa = VICENDE.inAttesa();
      if(atti.length || pronte.length || finite.length || attesa.length){
        const st=document.createElement('div'); st.className='sectitle';
        st.textContent=T('Storie del paese'); body.appendChild(st);
      }
      const facciaDi = (npcId)=>{
        const N=DATA.NPCS[npcId]; if(!N) return null;
        const c=document.createElement('canvas'); c.width=c.height=40;
        const cx=c.getContext('2d'); cx.imageSmoothingEnabled=false;
        cx.drawImage(ART.face(npcId,N.look),0,0,40,40); c.style.borderRadius='7px';
        return c;
      };
      for(const v of atti){
        const row=document.createElement('div'); row.className='row';
        const f=facciaDi(v.npc); if(f) row.appendChild(f);
        const info=document.createElement('div'); info.className='rinfo';
        const N=DATA.NPCS[v.npc];
        info.innerHTML =
          `<div class="rname">${v.titolo}</div>`+
          `<div class="rdesc">${v.compito}</div>`+
          `<div class="ringr">${F('passo {0} di {1}', v.passo, v.quanti)}`+
          (v.pronto && N ? ' · '+F('ce l\'hai tutto: vai da {0}', N.nome) : '')+`</div>`;
        row.appendChild(info);
        body.appendChild(row);
      }
      for(const v of pronte){
        const N=DATA.NPCS[v.npc]; if(!N) continue;
        const row=document.createElement('div'); row.className='row';
        const f=facciaDi(v.npc); if(f) row.appendChild(f);
        const info=document.createElement('div'); info.className='rinfo';
        info.innerHTML =
          `<div class="rname">${v.titolo}</div>`+
          `<div class="rdesc">${F('{0} ha qualcosa da dirti. Vai a parlarci.', N.nome)}</div>`;
        row.appendChild(info);
        body.appendChild(row);
      }
      if(attesa.length){
        const n=document.createElement('div'); n.className='muted'; n.style.margin='2px 2px 10px';
        n.innerHTML = attesa.map(v=>{
          const N=DATA.NPCS[v.npc];
          return N ? F('{0} si aprirà con te più avanti ({1} cuori)', '<b>'+N.nome+'</b>', v.cuori) : '';
        }).filter(Boolean).join('<br>');
        body.appendChild(n);
      }
      if(finite.length){
        const n=document.createElement('div'); n.className='cassa-nota fatta'; n.style.margin='2px 2px 14px';
        n.innerHTML = finite.map(v=>v.titolo).join(' · ');
        body.appendChild(n);
      }

      const st2=document.createElement('div'); st2.className='sectitle';
      st2.textContent=T('Bacheca delle richieste'); body.appendChild(st2);
      const intro=document.createElement('div'); intro.className='muted'; intro.style.marginBottom='12px';
      /* Era assegnata dritta a `textContent`, quindi non passava da
         nessun traduttore e nessun censimento la vedeva: in inglese
         restava questa riga italiana, e adesso stava anche sotto a
         un'intestazione inglese. */
      intro.textContent=T('Gli abitanti chiedono una mano. Consegna in tempo: monete e amicizia in cambio.');
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
      for(const cat of G.categorieCollezione()){
        const nome = cat.nome, ids = cat.ids;
        const d=ids.filter(id=>coll[id]).length;

        /* L'intestazione porta con sé il premio: prima diceva soltanto
           «MINERALI — 10/10» e finiva lì, cioè l'unica cosa del Diario
           che si riempie senza che nessuno se ne accorga. */
        const s=document.createElement('div'); s.className='sectitle coll-testa';
        const et=document.createElement('span');
        et.textContent = T(nome)+' — '+d+'/'+ids.length;
        s.appendChild(et);

        const P = G.premioCollezione(cat.id);
        if(P){
          if(G.collezioneRiscossa(cat.id)){
            const t=document.createElement('span'); t.className='coll-premio riscosso';
            t.textContent = T('premio riscosso');
            s.appendChild(t);
          } else if(G.collezioneCompleta(cat.id)){
            const b=document.createElement('button'); b.className='btn gold coll-riscuoti';
            b.textContent = T('Riscuoti')+' ✦';
            b.onclick=()=>{
              const dato = G.riscuotiCollezione(cat.id);
              if(!dato) return;
              const oggetto = dato.n ? ' · ' + dato.n + '× ' + IT.nome(dato.item) : '';
              U.toast(F('{0} completata! +{1} monete{2}', T(nome), NUM(dato.oro), oggetto), 'gold', dato.item);
              if(dato.sospeso) U.toast(T('Lo zaino era pieno: l\'oggetto ti aspetta nella scheda delle abilità.'),'bad');
              G.aggiornaHUD(); G.rinfrescaHotbar(); U.aggiorna();
            };
            s.appendChild(b);
          } else {
            /* Quanto vale finirla, detto PRIMA di finirla: un premio che
               si scopre solo dopo non fa venire voglia di cercare
               l'ultimo pesce. */
            const t=document.createElement('span'); t.className='coll-premio';
            t.textContent = F('completala: {0} monete + {1}× {2}',
                              NUM(P.oro), P.n, IT.nome(P.item));
            s.appendChild(t);
          }
        }
        body.appendChild(s);
        const grid=document.createElement('div'); grid.className='invgrid';
        const mancanti=[];
        for(const id of ids){
          const scoperto=!!coll[id];
          const cell=document.createElement('div'); cell.className='icell'+(scoperto?'':' empty');
          if(scoperto){ cell.appendChild(ico(id)); cell.title=IT.nome(id); }
          else{
            mancanti.push(id);
            const q=document.createElement('span'); q.textContent='?';
            q.style.cssText='font-size:20px;font-weight:800;color:#8a7c66;opacity:.55';
            cell.appendChild(q);
            /* «La lavanda non esiste» — esiste, è foraggio d'estate, e chi
               giocava in primavera non aveva modo di saperlo: la casella
               diceva soltanto «?». Adesso dice cos'è e dove sta. */
            cell.title = IT.nome(id) + ' — ' + spoglia(IT.dove(id));
          }
          grid.appendChild(cell);
        }
        body.appendChild(grid);

        /* E siccome passare il mouse su dodici caselle per cercarne una
           non è un modo di cercare, sotto c'è la lista in chiaro. */
        if(mancanti.length){
          const box=document.createElement('div'); box.className='coll-manca';
          const cap=document.createElement('div'); cap.className='coll-manca-cap cliccabile';
          cap.innerHTML='<span class="ob-freccia"></span>Te ne mancano '+mancanti.length+
                        ' — dove si trovano';
          const lista=document.createElement('div'); lista.className='coll-manca-lista hidden';
          for(const id of mancanti){
            const r=document.createElement('div'); r.className='coll-manca-riga';
            const c=document.createElement('div'); c.className='icell mini'; c.appendChild(ico(id));
            r.appendChild(c);
            const t=document.createElement('div');
            t.innerHTML='<b>'+IT.nome(id)+'</b><div class="rdesc">'+IT.dove(id)+'</div>';
            r.appendChild(t);
            lista.appendChild(r);
          }
          cap.onclick=()=>{
            const chiuso=lista.classList.contains('hidden');
            lista.classList.toggle('hidden', !chiuso);
            cap.querySelector('.ob-freccia').classList.toggle('giu', chiuso);
            SND.play('menu');
          };
          box.appendChild(cap); box.appendChild(lista);
          body.appendChild(box);
        }
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
      /* Le memorie della notte del solstizio non sono lettere, ma è qui
         che uno viene a rileggere. Sei racconti raccolti in giro per la
         valle a mesi di distanza uno dall'altro: senza un posto dove
         ritrovarli, quando arriva il sesto il primo è già evaporato. */
      const V = (G.trame && G.trame.veglia) || {};
      if(V.avviata && DATA.MEMORIE){
        const avute = DATA.MEMORIE.filter(m => V.memorie && V.memorie[m.id]);
        const s=document.createElement('div'); s.className='sectitle';
        s.textContent='La notte del solstizio — '+avute.length+'/'+DATA.MEMORIE.length;
        body.appendChild(s);
        if(!avute.length){
          const n=document.createElement('div'); n.className='muted'; n.style.marginBottom='10px';
          n.textContent='Sei abitanti erano da qualche parte, quella notte. Chiedi a ognuno.';
          body.appendChild(n);
        }
        for(const M of avute){
          const r=document.createElement('div'); r.className='row';
          const c=document.createElement('canvas'); c.width=c.height=40;
          const cx=c.getContext('2d'); cx.imageSmoothingEnabled=false;
          cx.drawImage(ART.face(M.npc, DATA.NPCS[M.npc].look),0,0,40,40);
          c.style.borderRadius='7px';
          r.appendChild(c);
          const info=document.createElement('div'); info.className='rinfo';
          info.innerHTML='<div class="rname">'+M.titolo+'</div>'+
                         '<div class="rdesc">Da '+DATA.NPCS[M.npc].nome+'</div>';
          r.appendChild(info);
          const b=document.createElement('button'); b.className='btn blue'; b.textContent='Rileggi';
          b.onclick=()=>{ U.chiudiModal(); U.dialogo(M.npc, M.testo); };
          r.appendChild(b);
          body.appendChild(r);
        }
        const t=document.createElement('div'); t.className='sectitle'; t.textContent=T('Lettere');
        body.appendChild(t);
      }
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
        /* Diceva «Da Nonna Ilde» su tutte, e adesso che scrivono anche
           Elio, Tobia e Marisol sarebbe una bugia. Le vecchie sono sue
           davvero, quindi restano sue anche senza dirlo nei dati. */
        info.innerHTML=`<div class="rname">${DATA.LETTERE[k].titolo}</div>`+
                       `<div class="rdesc">Da ${DATA.LETTERE[k].da || 'Nonna Ilde'}</div>`;
        r.appendChild(info);
        const b=document.createElement('button'); b.className='btn blue'; b.textContent='Rileggi';
        b.onclick=()=>{ U.chiudiModal(); U.lettera(k); };
        r.appendChild(b);
        body.appendChild(r);
      }
    }
    else {
      /* Le abilità stavano qui, in coda alle statistiche, scritte a mano
         e ferme a quattro su cinque: della Caccia non diceva niente, e i
         bonus erano frasi ricopiate che avevano già smesso di combaciare
         coi numeri veri (prometteva 7px di barra da pesca, il gioco ne
         dava 8). Adesso hanno una scheda loro — LIV.scheda, che legge
         DATA.BONUS_TESTO — e qui restano solo i numeri del podere. */
      const st=G.statistiche();
      const s=document.createElement('div'); s.className='sectitle'; s.textContent=T('Il podere in numeri');
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

/* `IT.dove` risponde in HTML, perché quasi ovunque finisce dentro alla
   pagina. Nell'attributo `title` invece i tag si vedrebbero scritti. */
function spoglia(html){
  return String(html||'').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

})();
