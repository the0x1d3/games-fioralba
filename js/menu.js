/* ===================================================================
   FIORALBA — menu.js
   Le Impostazioni e il «come si gioca»: il nome del podere, il pannello
   del salvataggio col codice della partita, i volumi, la misura dei
   pixel, la lingua, la guida, il riordino dei mobili — e le demo
   animate che mostrano un gesto invece di descriverlo.

   Ultimo pezzo uscito da ui.js, e il più chiuso in sé di tutti: 420
   righe che dal resto del file prendevano `ico` una volta sola. Le sue
   cinque private — `daQuanto`, `rigaNome`, `pannelloSalvataggio`,
   `sezione`, `scorciatoieDemo` — non uscivano di lì. (`rigaNome`
   sembrava di sì: nella finestra della cassa c'è un `const rigaNome`
   che è un `<div>`, non questa funzione. È la quarta omonimia che
   inganna in questo repo, e la quarta volta che l'albero della sintassi
   la smaschera.)

   Come partite.js, diario.js e botteghe.js: si carica DOPO ui.js e
   scrive sullo stesso oggetto `UI`, quindi `UI.menu(G)` e
   `UI.comeSiGioca()` continuano a chiamarsi così da game.js e dalla
   landing — nessun punto di chiamata cambia.
   =================================================================== */
(function(){

const U = UI;
const ico = U.ico;

/* I gusci della lingua, come negli altri file usciti da ui.js. */
const T = s => (window.LINGUA ? LINGUA.t(s) : s);
const F = (modello, ...pezzi)=> window.LINGUA
  ? LINGUA.f(modello, ...pezzi)
  : modello.replace(/\{(\d+)\}/g, (_,i)=>pezzi[i]);

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

    /* ---- 1b. RIORDINARE LA CASA ----
       Sta qui e non su ogni mobile perché su di loro E è già preso: il
       letto apre «Dormi», la cucina i fornelli, la scrivania le lettere.
       Una modalità cambia il significato di E per il tempo che serve,
       invece di infilare un pulsante dentro a cinque finestre diverse e
       lasciarne fuori due. */
    const sCasa = sezione(wrap, 'La casa');
    const dentro = !!(G.mappa() && G.mappa().interno);
    const bRi = document.createElement('button');
    bRi.className = 'btn' + (G.riordino ? ' gold' : '');
    bRi.textContent = T(G.riordino ? 'Smetti di riordinare' : 'Riordina i mobili');
    bRi.disabled = !dentro && !G.riordino;
    bRi.onclick = ()=>{ U.chiudiModal(); G.riordina(!G.riordino); };
    sCasa.appendChild(bRi);
    const nRi=document.createElement('div'); nRi.className='muted imp-nota';
    nRi.innerHTML = dentro
      ? T('Con il riordino acceso, <b>E</b> su un mobile lo prende invece di usarlo: scegli dove rimetterlo, o <b>Esc</b> per lasciarlo dov\'era. Si spegne da sé quando esci.')
      : T('Si riordina stando dentro: entra in casa e riapri queste impostazioni.');
    sCasa.appendChild(nRi);

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
      /* Due gradini e non più tre: con la casella da 64 lo zoom va da 1
         a 2, e in mezzo non c'è niente di intero. Vedi CHIAVE_ZOOM in
         render.js per come si migra la scelta di chi già giocava. */
      for(const [n,lab] of [[null,'Automatica'],[1,'Pixel piccoli'],[2,'Pixel grandi']]){
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

    /* ---- 6. RITOCCHI INTERNI (solo ambiente di prova) ---- */
    if(window.EDITOR_INTERNO && EDITOR_INTERNO.disponibile && EDITOR_INTERNO.disponibile()){
      const sd = sezione(wrap, 'Sviluppo');
      const be=document.createElement('button'); be.className='btn gold';
      be.textContent = T('🛠 Modalità modifica');
      be.onclick=()=>{ U.chiudiModal(); EDITOR_INTERNO.apri(); };
      sd.appendChild(be);
      const nota=document.createElement('div'); nota.className='muted imp-nota';
      nota.innerHTML = T('Strumento di test: sposta la scenografia, verifica l\'effetto e scarica una bozza. <b>Non salva né pubblica la partita.</b>');
      sd.appendChild(nota);
    }

    /* ---- 7. in fondo ---- */
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
      <div class="sectitle">La crescita del personaggio</div>
      <div class="muted">
        Coltivare, raccogliere, estrarre, pescare e cacciare fanno salire cinque
        <b>abilità</b>. Ogni livello dà un premio e un bonus permanente: apri
        <b>Diario → Crescita</b> per vedere esperienza, prossimo livello e costi.
        Al livello 3, <b>coltivazione, raccolta, estrazione e pesca</b>
        propongono una <b>specializzazione</b> fra due direzioni; caccia
        continua invece con i suoi premi di livello.
      </div>
      <div class="sectitle">Dopo la Lanterna</div>
      <div class="muted">
        La veglia non è la fine: dopo aver riacceso la Lanterna, guarda la
        <b>bacheca dei progetti</b> in piazza. Elio propone di riparare una
        barca, la costa nasconde un enigma di marea e la prima rotta porta alla
        <b>Cala delle Reti</b>. Il seguito resta breve, umano e comunitario.
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

})();
