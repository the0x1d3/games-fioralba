/* ===================================================================
   FIORALBA — partite.js
   Le finestre delle partite sul server: il codice da segnarsi, la
   scelta fra i salvataggi, la cancellazione, il cassetto in sospeso, il
   conflitto fra quello che c'è qui e quello che c'è là, e la spia della
   sincronizzazione dentro al Menu.

   Erano in ui.js, ed è stato il primo pezzo a uscirne perché era il più
   staccato di tutti: 578 righe che dal resto del file non prendevano
   NIENTE — non l'icona, non il dollaro, nessuna delle private che le
   altre finestre si passano — e le sue quattro private (`quando`,
   `cartaPartita`, `cartaScelta`, `malePrec`) non uscivano di lì. Anche
   per argomento sta da sola: parla di server, di codici e di conflitti,
   non di gioco.

   Le nove funzioni restano `U.qualcosa` e **nessun punto di chiamata
   cambia**, perché `U` qui è lo stesso identico oggetto di ui.js: questo
   file si carica DOPO e ci scrive sopra, come debug.js fa con `G`. È il
   motivo per cui staccare da ui.js costa molto meno che staccare da
   game.js — di là bisognava riscrivere gli undici punti che chiamavano
   le funzioni passate a un altro modulo, qui zero.

   `UI` scritto così, senza `window.` davanti, è voluto: se ui.js non
   c'è, il file si ferma subito con un errore che si legge, invece di
   ritrovarsi `undefined` in mano dieci schermate dopo. Ed è anche il
   modo in cui il controllo sull'ordine di caricamento in
   `tools/coerenza.js` riesce a vedere questa dipendenza: `window.UI`
   sarebbe un accesso a proprietà, e gli passerebbe sotto il naso.
   =================================================================== */
(function(){

const U = UI;

/* Lo stesso `T` di ui.js, ridichiarato invece che condiviso. È un guscio
   di una riga sopra `LINGUA.t`, che è la strozzatura vera: la stessa
   scelta che ha fatto solstizio.js con `fraseF`, e per lo stesso motivo
   — un modulo in più per una riga costerebbe più di quanto risparmi. */
const T = s => (window.LINGUA ? LINGUA.t(s) : s);

/* ===================================================================
   IL PANNELLO DELLA SINCRONIZZAZIONE (dentro il Menu)

   Deve dire tre cose e nient'altro: se sei collegato, qual è il tuo
   codice, e cosa fare adesso. Tutto il resto — versioni, timestamp,
   numeri — resta sotto il cofano, tranne quando c'è un conflitto: lì
   servono, perché è il momento in cui il giocatore deve decidere.
   =================================================================== */
function quando(iso){
  if(!iso) return '';
  const d = new Date(iso), ora = new Date();
  const min = Math.round((ora - d) / 60000);
  if(min < 1)  return T('adesso');
  /* «1 minuti fa» si leggeva nella conferma di cancellazione, che è
     esattamente il posto dove uno rilegge con attenzione */
  if(min === 1) return T('un minuto fa');
  if(min < 60) return min + ' ' + T('minuti fa');
  const h = Math.round(min/60);
  if(h < 24) return h + (h===1 ? ' ' + T('ora fa') : ' ' + T('ore fa'));
  return d.toLocaleDateString(window.LINGUA ? LINGUA.locale() : 'it-IT');
}

/* la carta di una partita, per il confronto nel conflitto */
function cartaPartita(titolo, s, evidenzia){
  const c = document.createElement('div');
  c.className = 'sinc-carta' + (evidenzia ? ' avanti' : '');
  const t = document.createElement('div'); t.className='sinc-carta-tit'; t.textContent = titolo;
  c.appendChild(t);
  if(!s){
    const v = document.createElement('div'); v.className='muted'; v.textContent = T('vuota');
    c.appendChild(v); return c;
  }
  const righe = [
    [T('Contadino'), s.nome || '—'],
    [T('A che punto'), (s.stagione ? s.stagione + ' ' + (s.giorno||1) + ', ' + T('anno') + ' ' + (s.anno||1) : '—')],
    [T('Giorni giocati'), (s.giornoTot|0) + 1],
    [T('Monete'), s.oro != null ? s.oro : '—'],
    [T('Salvata'), quando(s.aggiornato)]
  ];
  for(const [k,v] of righe){
    if(v === '' || v == null) continue;
    const r = document.createElement('div'); r.className='sinc-riga';
    const a = document.createElement('span'); a.textContent = k;
    const b = document.createElement('b'); b.textContent = v;
    r.appendChild(a); r.appendChild(b); c.appendChild(r);
  }
  return c;
}

/* ===================================================================
   LE PARTITE STANNO SUL SERVER

   Qui dentro c'erano le finestre di quando la partita stava nel browser
   e il server ne teneva una copia: «collega questa partita»,
   «scollega», «prendi dal server», e la scelta fra due partite che non
   combaciavano — che capitava ogni volta che si era giocato da due
   posti. Adesso la partita è una e sta di là: quelle finestre non
   descrivono più niente, e quello che serve è un altro giro.

   Restano tre cose da mostrare: quali partite conosce questo
   dispositivo, il codice di quella aperta, e — raramente — il caso in
   cui qualcun altro ha giocato lo stesso codice mentre eravamo dentro.
   =================================================================== */

/* Una finestra d'attesa senza X: sotto sta girando una richiesta e
   chiuderla lascerebbe il giocatore a guardare una landing che non
   risponde più ai pulsanti. */
U.attesaServer = function(testo){
  U.modal(T(testo || 'Un momento…'), body=>{
    const p = document.createElement('div');
    p.className = 'muted'; p.style.cssText = 'padding:8px 0;text-align:center';
    p.textContent = T('Sto parlando col server.');
    body.appendChild(p);
  }, { senzaChiusura:true });
};

U.erroreServer = function(errore){
  U.modal(T('Il server non risponde'), body=>{
    const p = document.createElement('div'); p.style.marginBottom='12px';
    p.textContent = errore || T('Non riesco a raggiungere il server.');
    body.appendChild(p);
    const n = document.createElement('div'); n.className='muted';
    n.textContent = T('Le partite di Fioralba stanno sul server: senza collegamento non si può cominciare né riprendere. Riprova fra un momento.');
    body.appendChild(n);
    const b = document.createElement('button'); b.className='btn gold';
    b.style.cssText='width:100%;margin-top:14px';
    b.textContent = T('Riprova');
    b.onclick = ()=>location.reload();
    body.appendChild(b);
  });
};

/* Il codice, grande, da segnarsi. Non si chiude da sola quando è appena
   nato: è l'unica cosa che sta fra il giocatore e la sua partita, e una
   finestra che sparisce da sé mentre uno cerca una penna è il modo più
   rapido di perdere una valle. */
U.mostraCodice = function(codice, appenaNato, poi){
  U.modal(T(appenaNato ? 'La tua partita è questa' : 'Il codice di questa partita'), body=>{
    const cod = document.createElement('div'); cod.className='sinc-codice';
    cod.textContent = codice;
    cod.title = T('Clicca per copiare');
    cod.onclick = ()=>{
      try{ navigator.clipboard.writeText(codice); U.toast(T('Codice copiato.'),'good'); }
      catch(e){ U.toast(T('Copialo a mano: ') + codice); }
    };
    body.appendChild(cod);

    const n = document.createElement('div'); n.className='muted'; n.style.margin='10px 0 0';
    n.innerHTML = T('<b>Segnatelo.</b> Con questo codice riprendi la partita da qualunque computer o telefono. ' +
                    'Su questo apparecchio resta in elenco, quindi qui non dovrai riscriverlo. ' +
                    '<b>Chi ha il codice ha la partita</b>: non darlo in giro.');
    body.appendChild(n);

    if(appenaNato) campoNome(body, T('Ho segnato il codice, si comincia'), n=>{
      U.chiudiModal();
      /* `poi` può dover aspettare il manifesto degli scenari prima di
         creare G. Il nome e il primo salvataggio arrivano solo dopo:
         prima si rischiava di scrivere la partita vecchia e poi far
         sovrascrivere il nome dallo stato iniziale. */
      const avvio = poi ? poi(n) : null;
      Promise.resolve(avvio).then(()=>{
        if(window.G){ G.nomeGiocatore = n; G.aggiornaHUD(); G.salva(); }
      }).catch(e=>console.warn('Avvio della nuova partita fallito', e));
    });
  }, appenaNato ? { senzaChiusura:true } : undefined);
};

/* --- IL NOME, CHE ADESSO È OBBLIGATORIO ---------------------------

   Il nome si chiede prima di cominciare, e senza di lui non si comincia:
   il pulsante nasce spento e si accende quando c'è qualcosa di scritto.

   Prima era facoltativo, con «Contadino» come segnaposto e la scusa che
   «un campo che blocca la partita di uno che vuole solo giocare è peggio
   di un nome generico». Non regge più, e non per gusto: da quando le
   partite stanno sul server e se ne possono avere tre, il nome è
   l'UNICA cosa che le distingue nel selettore. Chi salta il campo si
   ritrova tre carte che dicono «Contadino» e nessun modo di sapere
   quale sia la sua, che è un problema molto peggiore di dover battere
   sei lettere all'inizio.

   Via anche il segnaposto «Contadino»: in un campo obbligatorio un
   segnaposto che sembra un valore di ripiego dice la cosa sbagliata —
   «lascia stare e ti chiamo così» — che è esattamente quello che adesso
   non succede.

   È UNA FUNZIONE SOLA perché le porte da cui si comincia sono due:
   quella normale, che mostra il codice della partita nuova, e quella
   di riserva di `cominciaNuova()` per quando il modulo del server non
   c'è. Scriverle separate voleva dire due campi che si comportano quasi
   uguale, ed è così che nasce metà delle stranezze di questo gioco. */
function campoNome(body, testoPulsante, avvia){
  const et = document.createElement('div'); et.className='sectitle';
  et.style.marginTop = '16px';
  et.textContent = T('Come ti chiami?');
  body.appendChild(et);

  const perche = document.createElement('div'); perche.className='muted';
  perche.style.marginBottom = '8px';
  perche.textContent = T('Serve a riconoscere questa partita fra le altre.');
  body.appendChild(perche);

  const riga = document.createElement('div'); riga.className='imp-riga';
  const inp = document.createElement('input');
  inp.type='text'; inp.className='imp-nome-inp';
  inp.maxLength = 24;
  /* Il gioco ascolta la tastiera su window e non guarda da dove arriva
     il tasto: senza fermarlo qui, scrivere il proprio nome farebbe
     camminare il giocatore e aprirebbe lo zaino sulla «i». */
  for(const ev of ['keydown','keyup','keypress']) inp.addEventListener(ev, e=>e.stopPropagation());
  riga.appendChild(inp);
  body.appendChild(riga);

  const b = document.createElement('button'); b.className='btn gold';
  b.style.cssText='width:100%;margin-top:14px';
  b.textContent = testoPulsante;
  b.disabled = true;

  const pulito = ()=> inp.value.trim().replace(/\s+/g,' ');
  inp.addEventListener('input', ()=>{ b.disabled = !pulito(); });
  inp.addEventListener('keydown', e=>{ if(e.key==='Enter' && !b.disabled) b.click(); });
  b.onclick = ()=>{ const n = pulito(); if(n) avvia(n); };
  body.appendChild(b);
  setTimeout(()=>{ try{ inp.focus(); }catch(e){} }, 60);
}

/* La porta di riserva: si comincia senza passare dal server, quindi non
   c'è nessun codice da mostrare, ma il nome si chiede lo stesso. */
U.chiediNome = function(avvia){
  U.modal(T('Prima di cominciare'), body=>{
    campoNome(body, T('Si comincia'), n=>{ U.chiudiModal(); avvia(n); });
  }, { senzaChiusura:true });
};

/* ------------------------------------------------------------------
   IL SELETTORE — quello che apre «Continua»

   Le carte si disegnano subito con quello che il dispositivo ricorda, e
   si aggiornano quando il server risponde. Non è vezzo: senza, per un
   secondo si vedono tre rettangoli vuoti, e su una connessione lenta il
   secondo diventa cinque.

   Il campo del codice c'è SEMPRE, non solo quando l'elenco è vuoto: chi
   arriva da un altro computer ha già le sue partite in elenco qui, e
   deve poter aggiungere quella nuova senza cercare dove.
   ------------------------------------------------------------------ */
U.scegliPartita = function(){
  const noti = SINC.elenco();

  U.modal(T(noti.length ? 'Quale partita riprendi?' : 'Riprendi una partita'), body=>{
    if(!noti.length){
      const p = document.createElement('div'); p.className='muted'; p.style.marginBottom='10px';
      p.textContent = T('Su questo apparecchio non risulta nessuna partita. Se ne hai una altrove, scrivi qui il suo codice: lo trovi nel Menu del gioco, sull\'altro computer.');
      body.appendChild(p);
    }

    const lista = document.createElement('div'); lista.className='sinc-lista';
    body.appendChild(lista);

    const carte = {};
    for(const v of noti){
      const c = cartaScelta(v.codice, v.scheda);
      carte[v.codice] = c;
      lista.appendChild(c.el);
    }

    /* Il server dice com'è messa davvero ognuna: giorno, monete, quando
       è stata salvata l'ultima volta. Se non risponde restano quelle
       che ricordava il dispositivo, che è meglio di un elenco vuoto. */
    if(noti.length){
      SINC.schede(noti.map(v=>v.codice)).then(schede=>{
        for(const s of schede){
          if(!s || !carte[s.codice]) continue;
          carte[s.codice].aggiorna(s);
          SINC.ricorda(s.codice, s);
        }
      });
    }

    /* --- l'altro codice --- */
    const sez = document.createElement('div'); sez.className='sinc-altro';
    const et = document.createElement('div'); et.className='muted'; et.style.marginBottom='6px';
    et.textContent = T(noti.length ? 'Oppure scrivi il codice di un\'altra partita:' : 'Il codice della partita:');
    sez.appendChild(et);

    const riga = document.createElement('div'); riga.style.cssText='display:flex;gap:6px;flex-wrap:wrap';
    const inp = document.createElement('input');
    inp.type='text'; inp.className='sinc-codice-inp';
    inp.placeholder='FIORALBA-XXXX-XXXX-XXXX';
    inp.autocomplete='off'; inp.spellcheck=false;
    /* Il gioco ascolta la tastiera su window e non guarda da dove arriva
       il tasto: senza fermare l'evento qui, scrivere il codice farebbe
       camminare il giocatore e aprirebbe lo zaino sulla «a». */
    for(const ev of ['keydown','keyup','keypress']) inp.addEventListener(ev, e=>e.stopPropagation());
    inp.addEventListener('keydown', e=>{ if(e.key==='Enter') vai(inp.value); });

    const b = document.createElement('button'); b.className='btn gold';
    b.textContent = T('Riprendi');
    b.onclick = ()=>vai(inp.value);
    riga.appendChild(inp); riga.appendChild(b);
    sez.appendChild(riga);

    const eco = document.createElement('div'); eco.className='sinc-esito';
    sez.appendChild(eco);

    /* Il vecchio file .json.

       Fioralba ha esportato salvataggi in .json per mesi: sono sul
       desktop di qualcuno, in una cartella dei download, spediti a un
       amico. Adesso non si «importano» più — non c'è un posto locale
       dove metterli — ma si CONVERTONO: salgono sul server come partita
       nuova, col suo codice. Porta a senso unico: si entra nel sistema
       nuovo, non si esce.

       È un rimando piccolo e non un pulsante: serve a chi ce l'ha, che è
       una minoranza destinata ad assottigliarsi, e non deve competere
       con le due strade che servono a tutti gli altri. */
    const leg = document.createElement('div'); leg.className='sinc-legacy';
    const legA = document.createElement('a');
    legA.href = '#'; legA.className = 'sinc-legacy-link';
    legA.textContent = T('Ho un vecchio file .json da convertire →');
    legA.onclick = e => { e.preventDefault(); convertiVecchio(); };
    leg.appendChild(legA);
    sez.appendChild(leg);
    body.appendChild(sez);

    function convertiVecchio(){
      if(inCorso) return;
      inCorso = true;
      eco.className = 'sinc-esito';
      eco.textContent = T('Scegli il file…');
      SINC.daFileLegacy(r=>{
        inCorso = false;
        if(r.annullato){ eco.textContent = ''; return; }
        if(!r.ok){
          eco.className = 'sinc-esito male';
          eco.textContent = r.errore || T('Questo file non è un salvataggio di Fioralba.');
          return;
        }
        /* Il codice PRIMA della partita, come quando ne nasce una nuova:
           è l'unica cosa che sta fra il giocatore e il salvataggio
           appena convertito, e la lettera d'apertura lo coprirebbe. */
        U.chiudiModal();
        U.mostraCodice(r.codice, true, ()=>G.avvia(false));
      });
    }

    let inCorso = false;
    function vai(codice){
      if(inCorso) return;
      const c = String(codice||'').trim();
      if(!c) return;
      inCorso = true;
      eco.className = 'sinc-esito';
      eco.textContent = T('Cerco la partita…');
      SINC.apri(c).then(r=>{
        inCorso = false;
        if(!r.ok){
          eco.className = 'sinc-esito male';
          eco.textContent = r.errore || T('Non riesco ad aprirla.');
          return;
        }
        eco.textContent = T('Trovata. Si comincia.');
        U.chiudiModal();
        if(r.cassettoInSospeso) U.cassettoInSospeso(r.cassettoInSospeso);
        G.avvia(false);
      });
    }
    U.scegliPartita._vai = vai;   // le carte chiamano la stessa porta
  });
};

/* Una riga del selettore: la carta che apre, e il cestino che cancella.

   Due elementi affiancati e non un pulsante dentro l'altro — un
   `<button>` dentro a un `<button>` non è HTML valido, e i browser lo
   risolvono ognuno a modo suo. Così invece il bersaglio grosso resta
   tutto «apri», e cancellare vuole un gesto suo, piccolo e di lato. */
function cartaScelta(codice, scheda){
  const riga = document.createElement('div');
  riga.className = 'sinc-riga-partita';

  const el = document.createElement('button');
  el.className = 'sinc-scelta';
  const corpo = document.createElement('div'); corpo.className='sinc-scelta-corpo';
  el.appendChild(corpo);

  let ultimaScheda = scheda;

  function disegna(s){
    corpo.innerHTML = '';
    const nome = document.createElement('div'); nome.className='sinc-scelta-nome';
    nome.textContent = (s && s.nome) ? s.nome : T('Partita senza nome');
    corpo.appendChild(nome);

    const sotto = document.createElement('div'); sotto.className='sinc-scelta-sotto';
    if(s && s.stagione)
      sotto.textContent = s.stagione + ' ' + (s.giorno||1) + ', ' + T('anno') + ' ' + (s.anno||1)
                        + ' · ' + ((s.oro!=null) ? s.oro + ' ' + T('monete') : '')
                        + (s.aggiornato ? ' · ' + quando(s.aggiornato) : '');
    else sotto.textContent = T('non ancora giocata');
    corpo.appendChild(sotto);

    const c = document.createElement('div'); c.className='sinc-scelta-cod';
    c.textContent = codice;
    corpo.appendChild(c);
  }
  disegna(scheda);
  el.onclick = ()=>{ if(U.scegliPartita._vai) U.scegliPartita._vai(codice); };

  const butta = document.createElement('button');
  butta.className = 'sinc-butta';
  butta.textContent = '🗑';
  butta.title = T('Cancella questa partita');
  butta.setAttribute('aria-label', T('Cancella questa partita'));
  butta.onclick = ()=> U.confermaCancella(codice, ultimaScheda);

  riga.appendChild(el); riga.appendChild(butta);

  return { el: riga, aggiorna: s => { ultimaScheda = s; disegna(s); } };
}

/* ------------------------------------------------------------------
   CANCELLARE UNA PARTITA

   Non si cancella al primo clic. Quello che sta per sparire lo si fa
   rileggere prima — nome, a che punto, monete — perché in un elenco di
   codici che si somigliano tutti il cestino sbagliato è un gesto facile,
   e di là non c'è cestino da cui ripescare.

   E si cancella DAVVERO, sul server: togliere la partita dall'elenco di
   questo apparecchio e lasciarla viva di là non è cancellare, è
   nascondere — con l'aggravante che il codice continuerebbe a
   funzionare e nessuno se lo ricorda più.
   ------------------------------------------------------------------ */
U.confermaCancella = function(codice, scheda){
  const attiva = SINC.codice() === codice;
  U.modal(T('Cancellare questa partita?'), body=>{
    const p = document.createElement('div'); p.style.marginBottom='12px';
    p.innerHTML = T('Sparisce dal server e <b>non si recupera</b>. Il codice smette di funzionare, ' +
                    'anche per chi ce l\'ha su un altro apparecchio.');
    body.appendChild(p);

    const g = document.createElement('div'); g.className='sinc-confronto';
    g.appendChild(cartaPartita(T('Stai per cancellare'), scheda, false));
    body.appendChild(g);

    const cod = document.createElement('div'); cod.className='muted imp-nota';
    cod.style.marginTop = '8px';
    cod.textContent = codice;
    body.appendChild(cod);

    if(attiva){
      const av = document.createElement('div'); av.className='avviso-grave';
      av.style.marginTop = '10px';
      av.textContent = T('È la partita che stai giocando adesso: cancellandola si torna alla pagina iniziale.');
      body.appendChild(av);
    }

    const eco = document.createElement('div'); eco.className='sinc-esito';
    body.appendChild(eco);

    const az = document.createElement('div');
    az.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-top:12px';

    const bNo = document.createElement('button'); bNo.className='btn blue';
    bNo.textContent = T('Lascia stare');
    bNo.onclick = ()=>{ U.chiudiModal(); U.scegliPartita(); };

    const bSi = document.createElement('button'); bSi.className='btn red';
    bSi.textContent = T('Cancella per sempre');
    bSi.onclick = ()=>{
      bSi.disabled = true; bNo.disabled = true;
      bSi.textContent = T('cancello…');
      SINC.cancella(codice).then(r=>{
        if(!r.ok){
          bSi.disabled = false; bNo.disabled = false;
          bSi.textContent = T('Cancella per sempre');
          eco.className = 'sinc-esito male';
          eco.textContent = r.errore || T('Non riesco a cancellarla.');
          return;
        }
        U.chiudiModal();
        /* Se era quella aperta, il gioco sta girando su una partita che
           non esiste più: si riparte dalla pagina iniziale invece di
           lasciarlo camminare in una valle che non ha più dove salvarsi. */
        if(attiva){ location.reload(); return; }
        U.toast(T('Partita cancellata.'),'good');
        U.scegliPartita();
      });
    };

    az.appendChild(bNo); az.appendChild(bSi);
    body.appendChild(az);
  }, { senzaChiusura:true });
};

/* ------------------------------------------------------------------
   IL CASSETTO RIMASTO INDIETRO

   Capita solo così: questa partita è stata giocata qui, l'invio non è
   riuscito (rete caduta, scheda chiusa), e nel frattempo qualcuno l'ha
   giocata da un'altra parte. Sono due strade diverse dalla stessa
   biforcazione, e non le decide il gioco.
   ------------------------------------------------------------------ */
U.cassettoInSospeso = function(c){
  U.modal(T('C\'è del gioco non mandato'), body=>{
    const p = document.createElement('div'); p.style.marginBottom='12px';
    p.innerHTML = T('Su questo apparecchio era rimasto un pezzo di partita che non è mai arrivato al server ' +
                    '— probabilmente è caduta la rete. Nel frattempo la stessa partita è stata giocata altrove, ' +
                    'quindi le due non combaciano più.');
    body.appendChild(p);

    let scheda = null;
    try{ const d = JSON.parse(c.dati); scheda = { nome:d.nomeGiocatore, oro:d.oro, giorno:d.giorno, anno:d.anno,
      stagione:(DATA.SEASONS[d.stagioneIdx]||{}).nome, giornoTot:d.giornoTot, aggiornato:new Date(c.quando).toISOString() }; }catch(e){}

    const g = document.createElement('div'); g.className='sinc-confronto';
    g.appendChild(cartaPartita(T('Rimasta qui'), scheda, false));
    g.appendChild(cartaPartita(T('Sul server'), SINC.schedaViva(), false));
    body.appendChild(g);

    const az = document.createElement('div');
    az.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-top:14px';

    const bQui = document.createElement('button'); bQui.className='btn';
    bQui.textContent = T('Tengo quella rimasta qui');
    bQui.onclick = ()=>{
      const e = SALVA.applicaTesto(c.dati);
      if(!e.ok){ U.toast(e.err,'bad'); return; }
      /* `forza` manda senza dichiarare la versione: il server smette di
         controllare e accetta. È l'unico punto in cui si sovrascrive di
         proposito, e ci si arriva solo da qui. */
      SINC.invia(true).then(()=>{ SINC.svuotaCassetto(); U.chiudiModal(); location.reload(); });
    };

    const bSrv = document.createElement('button'); bSrv.className='btn blue';
    bSrv.textContent = T('Tengo quella del server');
    bSrv.onclick = ()=>{ SINC.svuotaCassetto(); U.chiudiModal(); };

    az.appendChild(bQui); az.appendChild(bSrv);
    body.appendChild(az);
  }, { senzaChiusura:true });
};

/* Qualcun altro ha scritto sullo stesso codice mentre eravamo dentro.
   Non si sceglie da soli: si mostrano le due e si aspetta. */
U.conflittoSinc = function(G, qui, server){
  U.modal(T('Qualcuno sta giocando la stessa partita'), body=>{
    const p = document.createElement('div'); p.className='muted'; p.style.marginBottom='12px';
    p.innerHTML = T('Questa partita è stata salvata da un altro apparecchio mentre giocavi qui. ' +
                    'Tenerne una vuol dire <b>perdere l\'altra</b>: guarda a che punto sono e scegli.');
    body.appendChild(p);

    const avanti = (qui && server) ? ((qui.giornoTot||0) >= (server.giornoTot||0) ? 'qui' : 'srv') : null;
    const g = document.createElement('div'); g.className='sinc-confronto';
    g.appendChild(cartaPartita(T('Quella che stai giocando'), qui, avanti==='qui'));
    g.appendChild(cartaPartita(T('Quella sul server'), server, avanti==='srv'));
    body.appendChild(g);

    const az = document.createElement('div');
    az.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-top:14px';

    const bQui = document.createElement('button'); bQui.className='btn';
    bQui.textContent = T('Tengo questa');
    bQui.onclick = ()=>{
      bQui.disabled = true;
      SINC.invia(true).then(r=>{
        U.chiudiModal();
        U.toast(r.ok ? T('Fatto: adesso vale questa.') : (r.errore || T('non riuscito')), r.ok ? 'good' : 'bad');
      });
    };

    const bSrv = document.createElement('button'); bSrv.className='btn blue';
    bSrv.textContent = T('Tengo quella del server');
    bSrv.onclick = ()=>{
      bSrv.disabled = true;
      SINC.apri(SINC.codice()).then(r=>{
        U.chiudiModal();
        if(r.ok){ U.toast(T('Scaricata. Ricarico la pagina…'),'good'); setTimeout(()=>location.reload(), 900); }
        else U.toast(r.errore || T('non riuscito'),'bad');
      });
    };

    az.appendChild(bQui); az.appendChild(bSrv);
    body.appendChild(az);
  }, { senzaChiusura:true });
};

/* ------------------------------------------------------------------
   LA MIGRAZIONE DI CHI ARRIVA DA IERI
   ------------------------------------------------------------------ */
U.proponiMigrazione = function(){
  const testo = SINC.daMigrare();
  if(!testo) return;
  let d = null; try{ d = JSON.parse(testo); }catch(e){}
  if(!d) return;

  U.modal(T('La tua partita si sposta sul server'), body=>{
    const p = document.createElement('div'); p.style.marginBottom='12px';
    p.innerHTML = T('Fino a ieri Fioralba teneva la partita dentro a questo browser, dove bastava svuotare la cronologia ' +
                    'per perderla. Adesso le partite stanno sul server e si riprendono con un codice, da qualunque apparecchio. ' +
                    'La tua è ancora qui: la porto di là adesso.');
    body.appendChild(p);

    const g = document.createElement('div'); g.className='sinc-confronto';
    g.appendChild(cartaPartita(T('La partita che hai qui'), {
      nome:d.nomeGiocatore, oro:d.oro, giorno:d.giorno, anno:d.anno,
      stagione:(DATA.SEASONS[d.stagioneIdx]||{}).nome, giornoTot:d.giornoTot }, true));
    body.appendChild(g);

    const b = document.createElement('button'); b.className='btn gold';
    b.style.cssText='width:100%;margin-top:14px';
    b.textContent = T('Spostala e dammi il codice');
    b.onclick = ()=>{
      b.disabled = true; b.textContent = T('la sto spostando…');
      SINC.migra(testo).then(r=>{
        if(!r.ok){
          b.disabled = false; b.textContent = T('Spostala e dammi il codice');
          U.toast(r.errore || T('non riuscito'),'bad');
          return;
        }
        U.chiudiModal();
        /* Il terzo argomento non è un dettaglio: senza, il pulsante
           chiudeva la finestra e lasciava il giocatore sulla landing con
           la sua partita caricata in memoria e nessun modo di vederla.
           `applicaTesto` l'ha già messa dentro a G — manca solo alzare
           il sipario. */
        U.mostraCodice(r.codice, true, ()=>G.avvia(false));
      });
    };
    body.appendChild(b);

    const n = document.createElement('div'); n.className='muted'; n.style.marginTop='10px';
    n.textContent = T('Finché non riesce, la partita resta dov\'è: non si perde niente.');
    body.appendChild(n);
  }, { senzaChiusura:true });
};

/* Una spia discreta per quando il server non risponde: il gioco continua
   e il cassetto tiene, ma dirlo è meglio che lasciarlo credere salvato.
   Non è un toast a ogni tentativo — sarebbe insopportabile — ma cambia
   la scritta accanto all'orologio. */
let malePrec = null;
U.segnalaSinc = function(errore){
  if(errore === malePrec) return;
  malePrec = errore;
  const el = document.getElementById('sinc-spia');
  if(!el) return;
  el.classList.toggle('hidden', !errore);
  if(errore) el.title = errore;
};

})();
