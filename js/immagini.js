/* ===================================================================
   FIORALBA — immagini.js
   Il caricatore dei pochi sprite che NON sono disegnati in codice.

   La regola del repo è sempre stata «niente file inventati: sprite e
   suoni si disegnano nel codice», ed è ancora vera per la quasi totalità
   di quello che si vede. Quello che sta in `img/` è un'eccezione voluta e
   circoscritta — sette arredi, il foglio della camminata, sette icone di
   attrezzi — disegnata a mano dal proprietario a una densità che in
   codice non si riproduce. Il resto del gioco non cambia.

   QUESTO FILE ESISTE PER UNA RAGIONE SOLA: il disegno è sincrono e le
   immagini no. `REND.disegna` gira sessanta volte al secondo e non può
   aspettare niente e nessuno — non un `await`, non una promessa, non
   una richiesta di rete che al primo avvio non è ancora tornata. Quindi
   il patto è questo:

       IMG.prendi(id)   →  l'immagine se è pronta, `null` altrimenti

   e chi disegna, davanti a un `null`, disegna l'arte in codice di
   sempre. Non è una toppa: è il comportamento normale per i primi
   fotogrammi di ogni partita, ed è anche quello che tiene in piedi il
   gioco se la cartella `img/` non c'è — aperto da `file://`, servito da
   un server che non conosce i PNG, o dentro all'APK offline se un
   giorno qualcuno dimentica di impacchettarla. Il gioco resta giocabile
   e si vede l'arte di prima, che è un esito accettabile; una schermata
   nera non lo sarebbe.

   Un file che non arriva si segna come MANCATO e non si richiede più:
   sessanta tentativi al secondo su un file che non c'è sono sessanta
   errori al secondo nella console e un po' di traffico per niente.

   `PAL.vincola` non passa da qui. Aggancia `fillStyle` e `strokeStyle`,
   non `drawImage`: i pixel di questi PNG sono gli unici del gioco fuori
   dai 173 colori ammessi. È il prezzo dichiarato dell'arte disegnata a
   mano, non una dimenticanza.
   =================================================================== */
(function(){
'use strict';

const IM = {};
window.IMG = IM;

/* Dove stanno. Relativa, non assoluta: il gioco si apre anche da una
   sottocartella e da `file://`. */
const CARTELLA = 'img/';

/* id → { img, pronta, mancata }. `pronta` e `mancata` sono due stati
   diversi e servono tutti e due: la prima dice «usala», la seconda dice
   «non richiederla più». Chi non è né l'una né l'altra sta arrivando. */
const stato = {};

/* Quante ne abbiamo chieste e come sono andate. Serve al pannello di
   prova e al controllo nel browser: «le immagini sono arrivate?» è la
   prima domanda quando qualcosa si vede con l'arte vecchia. */
IM.stato = function(){
  let pronte = 0, mancate = 0, inVolo = 0;
  for(const k in stato){
    if(stato[k].pronta) pronte++;
    else if(stato[k].mancata) mancate++;
    else inVolo++;
  }
  return { chieste: Object.keys(stato).length, pronte, mancate, inVolo };
};

/* Chiede un'immagine sola. Non torna niente: chi disegna la ripesca da
   `prendi` quando è pronta. */
function chiedi(id, file){
  if(stato[id]) return;
  const s = stato[id] = { img: new Image(), pronta:false, mancata:false };
  /* `decoding:async` dice al browser che può decodificare fuori dal
     filo principale: una decodifica sincrona di un PNG da 128×192 in
     mezzo a un fotogramma è uno scatto, e si vede. */
  s.img.decoding = 'async';
  s.img.onload  = ()=>{ s.pronta = true; };
  s.img.onerror = ()=>{
    s.mancata = true;
    console.warn('[img] «' + file + '» non è arrivata: si continua con l\'arte in codice');
  };
  s.img.src = CARTELLA + file;
}

/* Chiede tutto l'elenco. `elenco` è { id: {file, …} } — la forma di
   `DATA.ARREDI` — così l'unico posto che sa quali file esistono resta
   quello, e questo modulo non ha una lista sua da tenere allineata.

   Si chiama da `game.js` all'avvio, cioè DENTRO a una funzione: questo
   file si carica prima di data.js e non deve toccare `DATA` mentre si
   carica, o si aggiunge un tredicesimo vincolo d'ordine per niente.

   IL `prefisso` SERVE A NON PESTARSI GLI ID, e serve davvero. La stessa
   cosa del gioco ha due disegni: quello che si vede nel mondo e l'icona
   nello zaino. `cartello` sta in tutti e due gli elenchi con lo stesso
   id, e qui le immagini si tengono PER ID — senza prefisso la seconda
   `chiedi` trova già occupato e torna indietro in silenzio: il file si
   scarica, non lo usa nessuno, e nello zaino resta il disegno in
   codice. Un difetto che costa peso e non si vede. */
IM.precarica = function(elenco, prefisso){
  if(!elenco) return;
  for(const id in elenco){
    const a = elenco[id];
    if(a && a.file) chiedi((prefisso||'') + id, a.file);
  }
};

/* L'immagine, o `null`. È tutto quello che il renderer deve sapere.

   Il controllo su `naturalWidth` non è pignoleria: un'immagine che ha
   fatto `onload` ma è larga zero esiste — succede con un file troncato
   o con un PNG che il browser accetta e non sa decodificare — e
   `drawImage` su quella lancia, dentro al ciclo di disegno, sessanta
   volte al secondo. */
IM.prendi = function(id){
  const s = stato[id];
  if(!s || !s.pronta) return null;
  return s.img.naturalWidth ? s.img : null;
};

/* Per il pannello di prova: rifà la richiesta di quelle mancate. Serve
   a chi sta sistemando i file senza ricaricare la pagina. */
IM.riprova = function(elenco){
  for(const k in stato) if(stato[k].mancata) delete stato[k];
  IM.precarica(elenco);
};

})();
