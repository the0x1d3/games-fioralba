/* ===================================================================
   FIORALBA — art.js
   Motore di pixel-art procedurale. Nessun asset esterno: ogni sprite
   viene disegnato in codice su canvas offscreen e messo in cache.
   =================================================================== */
(function(){
'use strict';

const A = {};
window.ART = A;

/* ---- l'unità di disegno e la casella ----

   Non sono più la stessa cosa, e la distinzione è tutto quello che
   serve sapere per leggere questo file.

   `U` è l'unità in cui sono scritti i disegni qui dentro: 32, la
   casella com'era prima che il gioco raddoppiasse la densità. Le 590
   `px(x, 3, 5, …)` di questo file parlano quella lingua, e riscriverle
   una per una voleva dire riscrivere il file.

   `T` è la casella vera, quella che il mondo conosce: 64. Fuori di qui
   non esiste altro che questa.

   In mezzo c'è `K`: la tela di uno sprite nasce grande K volte e col
   contesto già scalato (vedi `tela`), così le coordinate restano quelle
   che sono e lo sprite esce della misura che il mondo si aspetta.
   Il nome `U` e non `T` è apposta: un `T` che qui vale 32 e altrove 64
   è l'omonimia che in questo repo ha già fatto leggere male un elenco. */
const U = 32;              // unità di disegno: la casella di prima
const K = 2;               // quante volte la tela è più fitta del disegno
const T = U*K;             // la casella, come la conosce il mondo
A.T = T;
A.K = K;

/* ---------------- utilità ---------------- */
function cv(w,h){
  const c = document.createElement('canvas');
  c.width=w; c.height=h;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  return c;
}
A.cv = cv;

/* La tela di uno sprite: nasce K volte più grande di quello che le si
   chiede, e il contesto parte già scalato di K. Chi disegna continua a
   parlare in unità di disegno e non se ne accorge; chi lo mette a
   schermo trova uno sprite già in pixel di mondo.

   `netto` serve a chi un giorno ridisegnerà lo sprite davvero a 64: la
   tela resta grande uguale, il contesto no, e le coordinate si scrivono
   in sessantaquattresimi. Nessuno dei lettori dello sprite cambia.

   `cv` invece resta grezza, e deve restarci: la scena, la luce, i
   blocchi di terreno e le pozze sono GIÀ in pixel di mondo — scalarle
   le farebbe grandi il doppio del doppio. */
function tela(w, h, netto){
  const c = cv(w*K, h*K);
  if(!netto) c.getContext('2d').setTransform(K,0,0,K,0,0);
  return c;
}
A.tela = tela;

/* La tela di uno sprite RIDISEGNATO a 64: si chiede in pixel di mondo e
   ci si disegna in pixel di mondo, uno per uno. È `tela(w/K, h/K, true)`
   detto nel verso in cui lo pensa chi disegna, e serve solo a questo —
   `telaNetta(T,T)` si legge, `tela(U,U,true)` no.

   Chi la usa scrive in `T`, non in `U`, e non passa da nessuna scala.
   Chi la legge non se ne accorge: la misura logica è identica, ed è
   tutto il senso della manovra. */
function telaNetta(w, h){ return tela(w/K, h/K, true); }
A.telaNetta = telaNetta;

/* Sovrapporre una tela a un'altra — è come si fanno i raccordi fra
   terreni e le aiuole arate: si disegna la texture e poi la si ritaglia
   sulla maschera. Tutte e due sono in pixel di MONDO, ma il contesto di
   chi riceve parla in unità di disegno, quindi la misura va detta a
   voce: `drawImage(src, 0, 0)` prende la misura naturale della sorgente
   e la maschera uscirebbe grande il doppio della casella, cioè fuori
   dalla tela — e il ritaglio non ritaglierebbe più niente. */
function sovrapponi(x, src, w, h){ x.drawImage(src, 0, 0, w||U, h||U); }

function px(c,x,y,w,h,col){ c.fillStyle=col; c.fillRect(x|0,y|0,w|0,h|0); }
A.px = px;

/* rumore deterministico */
/* IL RUMORE DI TUTTO IL GIOCO, E PERCHÉ PER ANNI HA DATO SOLO MEZZI NUMERI.

   Questa funzione decide dove va ogni filo d'erba, ogni granello di
   sabbia, ogni sasso, ogni stella del titolo: 150 usi in cinque file.
   Doveva tornare un numero fra 0 e 1 distribuito bene. Tornava un numero
   fra **0 e 0,5**. Misurato su 46.400 campioni: minimo 0, massimo 0,5000,
   media 0,2505, e l'istogramma vuoto sopra la metà.

   Due conseguenze, e la seconda è peggio della prima.

   La prima: ogni posizione ricavata da `hsh(...)*T` cadeva nel quarto in
   alto a sinistra della casella. Le texture avevano il dettaglio
   ammucchiato in un angolo e il resto liscio — si leggeva come una
   macchia, non come del rumore.

   La seconda: ventuno soglie sopra 0,5 non sono MAI scattate. Niente
   fiori sul prato, niente cotto scheggiato, niente vene di minerale
   nelle pareti della miniera, niente seconda stalattite, niente stelle
   luccicanti sul titolo. E quindici `> 0.5` usati come testa-o-croce
   sono sempre usciti croce: ogni «metà di questi in un modo e metà
   nell'altro» del disegno è sempre stato tutto nello stesso modo.

   La causa è JavaScript: `(n ^ (n>>13)) * 1274126177` è una
   moltiplicazione fra numeri in virgola mobile, non fra interi a 32 bit.
   Il prodotto arriva a 2,7·10^18, cioè ben oltre i 2^53 che la mantissa
   regge, e i bit bassi — che sono tutto quello che serve a un hash — si
   perdono per strada. `Math.imul` è la moltiplicazione a 32 bit vera, ed
   è esattamente il caso per cui esiste. Gli scorrimenti passano da `>>`
   a `>>>` per la stessa ragione: senza segno.

   Nessuna di queste 150 chiamate tocca il gioco — non c'è una regola,
   un raccolto o una probabilità che dipenda da qui. È tutto disegno. */
function hsh(x,y,s){
  let n = Math.imul(x|0, 374761393) + Math.imul(y|0, 668265263) + Math.imul(s|0, 1442695040);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
A.hsh = hsh;

/* rumore morbido interpolato: per variare le densità senza vedere la griglia */
A.rumore = function(x, y, scala){
  const fx = x/scala, fy = y/scala;
  const ix = Math.floor(fx), iy = Math.floor(fy);
  const tx = fx-ix, ty = fy-iy;
  const s = t=>t*t*(3-2*t);
  const a = hsh(ix,iy,555),   b = hsh(ix+1,iy,555);
  const c = hsh(ix,iy+1,555), d = hsh(ix+1,iy+1,555);
  const u = s(tx), v = s(ty);
  return (a*(1-u)+b*u)*(1-v) + (c*(1-u)+d*u)*v;
};

/* Schiarisci / scurisci: ma di gradini, non di percentuali.

   Ottantotto punti del disegno costruiscono le loro sfumature da qui —
   il volume di una chioma, la faccia in ombra di una cassa, il piano di
   un tavolo. Finché i colori erano liberi bastava schiarire "del 16%";
   con una palette chiusa non basta più, perché quel 16% può ricadere
   sullo stesso gradino di partenza. Quando succede la forma si appiattisce
   e sparisce: il cespuglio di primavera era diventato una macchia dello
   stesso verde del prato, con dentro nient'altro.

   Camminando sulla rampa invece, due toni chiesti diversi *sono* diversi,
   e per giunta prendono la rotazione di tinta che la rampa porta con sé:
   l'ombra della chioma si raffredda da sola.

   Sotto, mai meno di un gradino: nel disegno «poco più chiaro» vuol dire
   sempre «distinguibile», e comunque sotto il gradino non c'è niente.
   Sopra, un gradino ogni 20% e non ogni 12%, che era il primo tentativo
   e picchiava troppo forte: l'ombra sotto il mento è chiesta al 20% e
   scendeva di due gradini, cioè un terracotta acceso in mezzo alla
   faccia. Con questa scala quasi tutte le richieste valgono un gradino
   e solo le più decise ne valgono due, che è come sono scritte. */
function shade(hex, amt){
  if(!amt) return hex;
  const passi = Math.sign(amt) * Math.max(1, Math.min(3, Math.round(Math.abs(amt)/0.20)));
  return PAL.passo(hex, passi);
}
A.shade = shade;

function mix(a,b,t){
  const na=parseInt(a.slice(1),16), nb=parseInt(b.slice(1),16);
  const r=((na>>16&255)*(1-t)+(nb>>16&255)*t)|0;
  const g=((na>>8&255)*(1-t)+(nb>>8&255)*t)|0;
  const bl=((na&255)*(1-t)+(nb&255)*t)|0;
  return '#'+((1<<24)+(r<<16)+(g<<8)+bl).toString(16).slice(1);
}
A.mix = mix;

/* ellisse pixelata */
function ellip(c,cx,cy,rx,ry,col){
  c.fillStyle=col;
  for(let y=-ry;y<=ry;y++){
    const w = Math.sqrt(Math.max(0,1-(y*y)/(ry*ry)))*rx;
    if(w<0.4) continue;
    c.fillRect(Math.round(cx-w), Math.round(cy+y), Math.max(1,Math.round(w*2)), 1);
  }
}
A.ellip = ellip;

function circ(c,cx,cy,r,col){ ellip(c,cx,cy,r,r,col); }
A.circ = circ;

/* ===================================================================
   RETINO ORDINATO (matrice di Bayer 4×4)
   Una sfumatura vera, in mezzo a un mondo di pixel netti, si nota
   subito: è l'unica cosa morbida sullo schermo, e tradisce che sotto
   c'è una tela e non una griglia. Il retino la scompone in pochi
   gradini distribuiti su una matrice — è come si sfumava quando i
   colori erano sedici, ed è per questo che si legge come pixel art.
   =================================================================== */
const BAYER4 = [ 0, 8, 2,10,
                12, 4,14, 6,
                 3,11, 1, 9,
                15, 7,13, 5 ];
/* soglia 0..1 per il pixel (x,y) */
function retino(x,y){ return (BAYER4[((y&3)<<2)|(x&3)] + 0.5) / 16; }
A.retino = retino;

/* Pozza sfumata e retinata: la sostituzione dei gradienti radiali per
   luci, ombre di nuvole e simili. Si cuoce una volta per ogni misura e
   poi è un drawImage, quindi a schermo non costa niente.
   `livelli` sono gli anelli di trasparenza: pochi, altrimenti il retino
   non si vede e tanto valeva la sfumatura. */
const pozzaCache = {};
A.pozza = function(rx, ry, alpha, colore, livelli){
  rx = Math.max(1, Math.round(rx));
  ry = Math.max(1, Math.round(ry));
  const L = livelli || 5;
  const aq = Math.round(alpha*50)/50;                 // per non cuocere mille varianti
  // qui i pixel si scrivono a mano, quindi il filtro della palette sui
  // contesti non passa: l'aggancio va chiesto di persona, e prima della
  // chiave, così due tinte che finiscono sullo stesso gradino non
  // cuociono due pozze identiche
  const col = PAL.snap(colore);
  const key = rx+'|'+ry+'|'+aq+'|'+col+'|'+L;
  if(pozzaCache[key]) return pozzaCache[key];

  const w = rx*2+1, h = ry*2+1;
  const c = cv(w,h), x = c.getContext('2d');
  const img = x.createImageData(w,h), d = img.data;
  const n = parseInt(col.slice(1),16);
  const cr=(n>>16)&255, cg=(n>>8)&255, cb=n&255;
  for(let py=0; py<h; py++){
    const dy = (py-ry)/ry;
    for(let pxx=0; pxx<w; pxx++){
      const dx = (pxx-rx)/rx;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if(dist >= 1) continue;
      // stessa curva dei gradienti che sostituisce: nucleo pieno, bordo ripido
      const f = 1 - dist*dist*(3-2*dist);
      const lv = Math.floor(f*L + retino(pxx,py));
      if(lv <= 0) continue;
      const i = (py*w + pxx)*4;
      d[i]=cr; d[i+1]=cg; d[i+2]=cb;
      d[i+3] = Math.round(Math.min(L,lv)/L * aq * 255);
    }
  }
  x.putImageData(img,0,0);
  pozzaCache[key] = c;
  return c;
};

/* Vignettatura retinata a misura di schermo virtuale. Prima era un
   gradiente disegnato sulla tela finale, cioè alla risoluzione vera del
   monitor: sfumava attraverso i pixel del gioco invece che insieme a
   loro. */
const vignCache = {};
A.vignetta = function(w, h, forza){
  const fq = Math.round((forza||0.32)*50)/50;
  const key = w+'|'+h+'|'+fq;
  if(vignCache[key]) return vignCache[key];
  /* La chiave contiene w e h, e w e h cambiano a ogni pixel di
     ridimensionamento della finestra: trascinare un bordo per due
     secondi cuoce decine di vignette, e ognuna è un canvas grande
     quanto lo schermo virtuale (~mezzo MB). Le misure vecchie non
     servono più a niente — la finestra ha una sola misura per volta —
     quindi sopra le 8 si butta via tutto e si ricomincia. */
  const chiavi = Object.keys(vignCache);
  if(chiavi.length >= 8) for(const k of chiavi) delete vignCache[k];
  const c = cv(w,h), x = c.getContext('2d');
  const img = x.createImageData(w,h), d = img.data;
  const cx = w/2, cy = h/2;
  const r0 = Math.min(w,h)*0.36, r1 = Math.max(w,h)*0.74;
  /* Qui i gradini sono fitti, al contrario delle pozze di luce. La
     vignettatura copre due terzi dello schermo, e su una distesa chiara
     e piatta — la sabbia della Costa — un retino a gradini larghi si
     legge come sporco sull'obiettivo invece che come penombra ai bordi.
     Quello che dovevamo togliere era la sfumatura stesa sui pixel veri
     del monitor: quello è risolto dal disegnare qui, a misura virtuale. */
  const L = 10;
  for(let py=0; py<h; py++) for(let pxx=0; pxx<w; pxx++){
    const dist = Math.hypot(pxx-cx, py-cy);
    if(dist <= r0) continue;
    const t = Math.min(1, (dist-r0)/(r1-r0));
    const lv = Math.floor(t*L + retino(pxx,py));
    if(lv <= 0) continue;
    const i = (py*w + pxx)*4;
    d[i+3] = Math.round(Math.min(L,lv)/L * fq * 255);   // nero, quindi RGB resta 0
  }
  x.putImageData(img,0,0);
  vignCache[key] = c;
  return c;
};

/* quante pozze e quante vignette sono state cotte: serve a controllare
   che la quantizzazione tenga la cache limitata invece di farla crescere
   a ogni nuvola che passa */
A.statoRetino = function(){
  return { pozze:Object.keys(pozzaCache).length, vignette:Object.keys(vignCache).length };
};

/* ===================================================================
   1. TERRENI
   =================================================================== */
/* scorciatoia ai colori della palette (js/palette.js) */
function C(){ return PAL.c; }

const groundCache = {};

/* ===================================================================
   LE PIASTRELLE SONO RIDISEGNATE A 64 VERI

   Undici funzioni qui sotto — i dieci terreni e l'acqua — non usano
   `tela` ma `telaNetta`, e scrivono in `T` invece che in `U`. Sono le
   prime della coda lunga, e la coda si è ordinata con una misura invece
   che a occhio: instrumentando il disegno, il terreno copre il 340%
   dello schermo al podere, il 299% nel bosco, il 256% in miniera e il
   73% dentro casa — contando le sovrapposizioni, ma il punto regge: è
   l'unico sprite che c'è in OGNI scena, ed è il fondo su cui si legge
   tutto il resto. In più i raccordi fra terreni (`A.bordo`, un altro
   94-107% per scena) sono ritagliati da queste stesse piastrelle, quindi
   migliorano da soli senza che nessuno li tocchi.

   Cosa vuol dire «ridisegnata a 64»: non raddoppiare i numeri, che non
   guadagnerebbe niente. Vuol dire la STESSA quantità d'inchiostro in
   tratti più fini — il doppio degli elementi, larghi la metà. Un filo
   d'erba era largo 1 in trentaduesimi, cioè 2 pixel a schermo; adesso è
   largo 1 e basta, e ce ne sono il doppio. È la ragione per cui questi
   sprite erano i primi: sono rumore procedurale, quindi la finezza è
   una questione di parametri e non di gusto, e il guadagno si misura.

   La misura: la frazione di quadretti 2×2 tutti dello stesso colore.
   Una tela cotta al doppio ce li ha uniformi tutti, per costruzione —
   100%. Un controllo in `tools/coerenza.js` pretende che queste undici
   restino nette, perché tornare indietro non darebbe nessun errore.
   =================================================================== */
function grassTile(v, season){
  const S = DATA.SEASONS.find(s=>s.id===season);
  const c = telaNetta(T,T), x = c.getContext('2d');
  const base = S.grass, dark = S.grass2;
  px(x,0,0,T,T,base);
  /* Chiazze larghe: devono essere un respiro, non un disegno. Chiedevano
     di schiarire del 6%, che sulla palette a gradini è diventato un
     gradino intero — e il prato si è riempito di coriandoli. Adesso si
     muovono solo fra il verde del corpo e quello d'ombra, con poca
     opacità: la variazione si sente e non si conta.

     A 64 la chiazza non è più un quadretto: sono due rettangoli sfalsati
     che si sovrappongono, e il bordo che ne esce è irregolare. È la cosa
     che a 32 non si poteva fare, perché lo sfalsamento minimo era due
     pixel a schermo e si vedeva come un gradino. */
  for(let i=0;i<30;i++){
    const r = hsh(i,v,season.length*7);
    const bx = (hsh(i,v,1)*T)|0, by=(hsh(i,v,2)*T)|0;
    const w = 4+((r*8)|0), h = 3+((hsh(i,v,3)*7)|0);
    x.fillStyle = dark;
    x.globalAlpha = r>0.5 ? 0.14 : 0.30;
    x.fillRect(bx,by,w,h);
    x.fillRect(bx+1+((hsh(i,v,4)*3)|0), by-1, w-2, h+2);
  }
  x.globalAlpha=1;
  /* Fili d'erba. Erano dieci, larghi un pixel di disegno — cioè due a
     schermo, che è una bandierina più che un filo. Adesso sono ventisei,
     larghi un pixel vero, con la punta di un gradino più chiara: da
     lontano è la stessa quantità di verde, da vicino è erba. */
  const blade = shade(base, season==='inverno'? 0.10 : 0.16);
  for(let i=0;i<26;i++){
    const bx=(hsh(i,v,11)*T)|0, by=(hsh(i,v,12)*T)|0;
    const h = 3+((hsh(i,v,13)*5)|0);
    x.globalAlpha = i%3 ? 0.5 : 0.7;
    x.fillStyle = i%3 ? dark : blade;
    x.fillRect(bx,by,1,h);
    // la punta si piega di un pixel: è quello che toglie l'aria da «sbarra»
    x.fillRect(bx + (hsh(i,v,14)>0.5?1:-1), by, 1, 1);
  }
  x.globalAlpha=1;
  // fiorellini stagionali: a 64 un fiore ha un cuore e quattro petali
  if(season!=='inverno'){
/* Tre fiori in primavera, non cinque. Il conto era stato alzato quando
       la soglia `>0.55` non scattava MAI — vedi `hsh` — e il prato era
       nudo; adesso che scatta, cinque candidati per casella facevano un
       prato fiorito da cartolina invece di un prato con dei fiori. */
    const n = season==='primavera'?3:(season==='estate'?2:1);
    for(let i=0;i<n;i++){
      if(hsh(i,v,21)>0.55){
        const bx=3+((hsh(i,v,22)*(T-9))|0), by=3+((hsh(i,v,23)*(T-9))|0);
        const col = season==='autunno' ? C().erba.fioreAutunno : (hsh(i,v,24)>0.5? S.accent : C().erba.fiore);
        px(x,bx,by-1,2,1,col); px(x,bx,by+2,2,1,col);      // petali sopra e sotto
        px(x,bx-1,by,1,2,col); px(x,bx+2,by,1,2,col);      // e ai lati
        px(x,bx,by,2,2,shade(col,0.3));                    // il cuore, più chiaro
      }
    }
  } else {
    // brina: puntini veri da un pixel, e il doppio di prima
    for(let i=0;i<22;i++){
      const bx=(hsh(i,v,31)*T)|0, by=(hsh(i,v,32)*T)|0;
      px(x,bx,by,1,1,C().erba.brina);
    }
  }
  return c;
}

function dirtTile(v){
  const c=telaNetta(T,T), x=c.getContext('2d');
  px(x,0,0,T,T,C().terra.base);
  // il grano della terra: novanta trattini da un pixel invece di quaranta
  for(let i=0;i<90;i++){
    const bx=(hsh(i,v,41)*T)|0, by=(hsh(i,v,42)*T)|0, r=hsh(i,v,43);
    x.fillStyle = r>0.6?C().terra.chiaro:(r>0.3?C().terra.medio:C().terra.scuro);
    x.fillRect(bx,by,1+((r*4)|0),1);
  }
  // zolle: adesso hanno una faccia in luce e un'ombra sotto, non erano
  // due pixel in croce
  for(let i=0;i<10;i++){
    const bx=(hsh(i,v,44)*T)|0, by=(hsh(i,v,45)*T)|0;
    px(x,bx,by,3,3,C().terra.zolla);
    px(x,bx,by,2,1,C().terra.zollaLuce);
    px(x,bx,by+3,3,1,C().terra.scuro);
  }
  return c;
}

function tilledTile(v, wet){
  const c=telaNetta(T,T), x=c.getContext('2d');
  const A = wet ? C().arato.bagnato : C().arato.asciutto;
  const base = A.base, ridge = A.cresta, dark = A.scuro;
  px(x,0,0,T,T,base);
  /* Solchi orizzontali, quattro come prima — la distanza è quella, è il
     passo dell'aratro. Quello che cambia è il PROFILO: prima era fondo,
     cresta, ombra, tre bande piatte. Adesso la cresta ha un filo di luce
     sopra e sfuma nel fondo sotto, cioè ha una forma. */
  for(let r=0;r<4;r++){
    const y=r*16;
    px(x,0,y,T,2,dark);                       // il fondo del solco
    px(x,0,y+2,T,1,shade(ridge,0.18));        // il filo di luce sulla cresta
    px(x,0,y+3,T,3,ridge);
    px(x,0,y+6,T,1,shade(base,-0.05));        // e l'ombra dalla parte opposta
    // la terra smossa fra un solco e l'altro
    for(let i=0;i<16;i++){
      const bx=(hsh(i,v+r,51)*T)|0;
      px(x,bx,y+8+((hsh(i,v+r,53)*3)|0),1+((hsh(i,v+r,54)*2)|0),1,
         hsh(i,v+r,52)>0.5?dark:shade(base,0.05));
    }
  }
  if(wet){
    // riflessi d'acqua: più numerosi e più sottili, che è come si vede
    // l'acqua nei solchi invece che come si vedono le pozze
    for(let i=0;i<16;i++){
      const bx=(hsh(i,v,61)*T)|0, by=(hsh(i,v,62)*T)|0;
      x.globalAlpha=0.35; px(x,bx,by,2+((hsh(i,v,63)*3)|0),1,C().arato.riflesso); x.globalAlpha=1;
    }
  }
  return c;
}

function pathTile(v){
  const c=telaNetta(T,T), x=c.getContext('2d');
  px(x,0,0,T,T,C().sentiero.malta);
  /* Ciottoli: la griglia resta 4×4 e la misura del ciottolo pure — è la
     misura giusta per un sentiero, non era quello il problema. Quello che
     cambia è che il bordo in luce e quello in ombra adesso sono spessi
     un pixel vero invece di due, e che il ciottolo ha gli ANGOLI smussati:
     a 32 uno smusso da un pixel sarebbe stato un morso da due. */
  const cols=C().sentiero.ciottoli;
  for(let gy=0; gy<4; gy++) for(let gx=0; gx<4; gx++){
    const r=hsh(gx,gy*7+v,71);
    const bx=gx*16+((hsh(gx,gy+v,72)*4)|0), by=gy*16+((hsh(gx,gy+v,73)*4)|0);
    const w=10+((r*4)|0), h=10+((hsh(gx,gy+v,74)*4)|0);
    const col=cols[(r*4)|0];
    x.fillStyle=col; x.fillRect(bx,by,w,h);
    // gli angoli mangiati: quattro pixel di malta, e il sasso diventa tondo
    x.fillStyle=C().sentiero.malta;
    x.fillRect(bx,by,1,1); x.fillRect(bx+w-1,by,1,1);
    x.fillRect(bx,by+h-1,1,1); x.fillRect(bx+w-1,by+h-1,1,1);
    x.fillStyle=shade(col,0.18); x.fillRect(bx+1,by,w-2,1);
    x.fillStyle=shade(col,-0.22); x.fillRect(bx+1,by+h-1,w-2,1);
    // e una venatura dentro, che a 32 non ci stava
    if(r>0.55) px(x, bx+2+((r*3)|0), by+2+((hsh(gx,gy,75)*4)|0), 2+((r*3)|0), 1, shade(col,-0.10));
  }
  return c;
}

function sandTile(v){
  const c=telaNetta(T,T), x=c.getContext('2d');
  px(x,0,0,T,T,C().sabbia.base);
  /* Novanta granelli da un pixel invece di trentaquattro da due. È il
     caso in cui il ridisegno si vede di più e costa di meno: la sabbia È
     grana, e a 32 la grana più fine possibile era un quadretto 2×2. */
  for(let i=0;i<90;i++){
    const bx=(hsh(i,v,81)*T)|0, by=(hsh(i,v,82)*T)|0;
    x.fillStyle = hsh(i,v,83)>0.5?C().sabbia.scuro:C().sabbia.chiaro;
    x.fillRect(bx,by,1,1);
  }
  // e qualche increspatura lasciata dal vento, lunga e bassissima
  for(let i=0;i<5;i++){
    const bx=(hsh(i,v,84)*T)|0, by=(hsh(i,v,85)*T)|0;
    x.globalAlpha=0.5;
    px(x,bx,by,6+((hsh(i,v,86)*10)|0),1,C().sabbia.scuro);
    x.globalAlpha=1;
  }
  return c;
}

function woodTile(v){
  const c=telaNetta(T,T), x=c.getContext('2d');
  px(x,0,0,T,T,C().assi.base);
  /* Quattro assi, come prima. La differenza è il giunto: era spesso un
     pixel di disegno, cioè due a schermo, e due pixel di nero fra un'asse
     e l'altra su un pavimento chiaro si leggono come una fuga di
     piastrelle. Adesso è uno vero, con accanto un filo di luce — che è
     come si vede il bordo di un'asse piallata. */
  for(let r=0;r<4;r++){
    const y=r*16;
    px(x,0,y,T,1,C().assi.giunto);
    px(x,0,y+1,T,1,shade(C().assi.base,0.10));       // il taglio prende luce
    px(x,0,y+2,T,14, r%2? C().assi.alterna:C().assi.base);
    // venature: il doppio, e lunghe il doppio, ma sempre alte un pixel
    for(let i=0;i<12;i++){
      const bx=(hsh(i,r+v,91)*T)|0;
      x.globalAlpha=0.35;
      px(x,bx,y+3+((hsh(i,r,92)*10)|0),5+((hsh(i,r,93)*12)|0),1,C().assi.venatura);
      x.globalAlpha=1;
    }
    // il giunto di testa fra due assi in fila, sfalsato riga per riga
    const jx = (r%2? 32:0);
    px(x,jx,y,1,16,C().assi.giunto);
  }
  return c;
}

/* LA QUARTA LASTRA, E PERCHÉ NON SI USA.

   `lastre.pietre` ha tre pietre dalla rampa PIETRA e una dalla rampa
   SABBIA: un crema caldo in mezzo a tre grigi. Era un accento voluto —
   una lastra di arenaria fra quelle di granito — e non l'ha mai visto
   nessuno, perché con l'hash rotto l'indice `(h*4)|0` arrivava al
   massimo a 1. Guarito l'hash è comparso, una lastra su quattro, e la
   piazza è diventata una scacchiera da bagno.

   Renderlo raro con una probabilità NON funziona, ed è la cosa che vale
   la pena sapere: questa funzione conosce quattro varianti in tutto, e
   sceglie la pietra a partire da quelle. L'accento finisce dentro alla
   variante, e la variante si ripete su tutta la piazza — quindi «una
   volta su venticinque» diventa «sempre nello stesso punto di ogni
   quarta casella», cioè un motivo regolare invece di un caso. Provato a
   0.92 e a 0.96, e si vedeva tutte e due le volte: file di lastre chiare
   a distanza fissa.

   Quindi il selciato usa i tre grigi, che è la famiglia che si è sempre
   vista, più fine di prima perché la piastrella è ridisegnata a 64. Per
   rimettere l'arenaria bisogna prima dare a questa funzione la posizione
   nel mondo e non solo la variante, se no il motivo torna. */
function stoneFloorTile(v){
  const c=telaNetta(T,T), x=c.getContext('2d');
  // lastre calde, sabbiose, con giunti di malta chiara
  px(x,0,0,T,T,C().lastre.malta);
  const cols=C().lastre.pietre;
  /* Sfalsate: due file da due lastre, con offset alternato. La lastra è
     grande uguale — è la misura giusta per una piazza — ma il giunto
     passa da due pixel a schermo a uno, e la fascia in luce e quella in
     ombra da quattro a due. Una lastra fatta così ha uno spessore invece
     di un contorno. */
  for(let gy=0;gy<2;gy++){
    const off = (gy+v)%2 ? 16 : 0;
    for(let gx=-1;gx<3;gx++){
      const bx=gx*32+off, by=gy*32;
      const col = cols[(hsh(gx+2,gy+v,101)*3)|0];   // i tre grigi, non l'arenaria
      x.fillStyle=col; x.fillRect(bx+1,by+1,30,30);
      x.fillStyle=shade(col,0.16); x.fillRect(bx+1,by+1,30,2);
      x.fillStyle=shade(col,-0.16); x.fillRect(bx+1,by+29,30,2);
      // usura: il doppio dei segni, e sottili come graffi veri
      for(let i=0;i<7;i++){
        const ux=bx+3+((hsh(i,gx*3+gy+v,102)*24)|0), uy=by+4+((hsh(i,gx+gy*5+v,103)*22)|0);
        x.fillStyle = hsh(i,gx+gy,104)>0.5 ? shade(col,-0.10) : shade(col,0.10);
        x.fillRect(ux,uy,2+((hsh(i,gx,108)*4)|0),1);
      }
    }
  }
  // muschio negli interstizi, sfrangiato invece che quadrato
  for(let i=0;i<8;i++){
    if(hsh(i,v,105)<0.55) continue;
    const mx=(hsh(i,v,106)*T)|0, my=(hsh(i,v,107)*T)|0;
    x.globalAlpha=0.4;
    px(x,mx,my,3,2,C().lastre.muschio);
    px(x,mx+1,my+2,2,1,C().lastre.muschio);
    x.globalAlpha=1;
  }
  return c;
}

/* pavimento in cotto: mattonelle quadrate posate a corsi sfalsati, con
   la fuliggine che si accumula nei giunti. È il pavimento degli interni
   di pietra — la fucina — dove le lastre della piazza stonavano. */
function terracottaTile(v){
  const c=telaNetta(T,T), x=c.getContext('2d');
  px(x,0,0,T,T,C().cotto.malta);
  const cols=C().cotto.pietre;
  for(let gy=0;gy<3;gy++){
    const off = (gy+v)%2 ? 10 : 0;
    for(let gx=-1;gx<4;gx++){
      const bx=gx*22+off, by=gy*22;
      const col = cols[(hsh(gx+2,gy+v,161)*4)|0];
      x.fillStyle=col;             x.fillRect(bx+1,by+1,20,20);
      x.fillStyle=shade(col,0.14); x.fillRect(bx+1,by+1,20,2);
      x.fillStyle=shade(col,-0.18);x.fillRect(bx+1,by+19,20,2);
      // qualche mattonella scheggiata: il cotto si consuma agli angoli, e
      // adesso la scheggia ha una forma invece di essere un quadretto
      if(hsh(gx,gy+v,162)>0.78){
        px(x,bx+17,by+17,4,4,shade(col,-0.3));
        px(x,bx+19,by+15,2,2,shade(col,-0.3));
      }
    }
  }
  // fuliggine sparsa, più fitta dove capita
  for(let i=0;i<14;i++){
    if(hsh(i,v,163)<0.45) continue;
    const mx=(hsh(i,v,164)*T)|0, my=(hsh(i,v,165)*T)|0;
    x.globalAlpha=0.35; px(x,mx,my,4+((hsh(i,v,166)*4)|0),2,C().cotto.fuliggine); x.globalAlpha=1;
  }
  return c;
}

function snowTile(v){
  const c=telaNetta(T,T), x=c.getContext('2d');
  px(x,0,0,T,T,C().neve.base);
  /* La neve era ventiquattro trattini 2×1, cioè 4×2 a schermo: da vicino
     si contavano. Adesso sono sessanta, alti un pixel vero, e fra loro
     qualche scintilla singola — che è quello che fa sembrare la neve
     neve invece che intonaco. */
  for(let i=0;i<60;i++){
    const bx=(hsh(i,v,111)*T)|0, by=(hsh(i,v,112)*T)|0;
    x.fillStyle=hsh(i,v,113)>0.5?C().neve.chiaro:C().neve.scuro;
    x.fillRect(bx,by,2+((hsh(i,v,114)*3)|0),1);
  }
  for(let i=0;i<14;i++){
    const bx=(hsh(i,v,115)*T)|0, by=(hsh(i,v,116)*T)|0;
    px(x,bx,by,1,1,C().neve.chiaro);
  }
  return c;
}

function caveTile(v){
  const c=telaNetta(T,T), x=c.getContext('2d');
  // pavimento della grotta: sabbioso, più chiaro delle pareti
  px(x,0,0,T,T,C().grotta.base);
  for(let i=0;i<80;i++){
    const bx=(hsh(i,v,121)*T)|0, by=(hsh(i,v,122)*T)|0, r=hsh(i,v,123);
    x.fillStyle=r>0.6?C().grotta.chiaro:(r>0.3?C().grotta.medio:C().grotta.scuro);
    x.fillRect(bx,by,1+((r*4)|0),1);
  }
  // ghiaia: sassolini con una faccia in luce e un'ombra, non due pixel
  for(let i=0;i<12;i++){
    const bx=(hsh(i,v,124)*T)|0, by=(hsh(i,v,125)*T)|0;
    px(x,bx,by,3,3,C().grotta.ghiaia);
    px(x,bx,by,2,1,C().grotta.ghiaiaLuce);
    px(x,bx,by+3,3,1,C().grotta.scuro);
  }
  return c;
}

/* acqua animata: 6 frame */
function waterFrames(season){
  const frames=[];
  const A = season==='inverno' ? C().acqua.gelida : C().acqua.tiepida;
  const deep = A.fondo, mid = A.medio, top = A.cresta;
  for(let f=0;f<6;f++){
    const c=telaNetta(T,T), x=c.getContext('2d');
    px(x,0,0,T,T,deep);
    /* Le onde scorrono di `f*4.4` invece di `f*2.2`: il movimento a
       schermo resta identico — erano pixel di disegno, adesso sono pixel
       di mondo — ma la scia è lunga il doppio e alta uguale, quindi
       l'acqua si increspa invece di scattare. */
    for(let i=0;i<40;i++){
      const bx=(hsh(i,f,131)*T)|0;
      const by=((hsh(i,0,132)*T + f*4.4)|0)%T;
      x.globalAlpha=0.55;
      px(x,bx,by,6+((hsh(i,0,133)*8)|0),1,mid);
      x.globalAlpha=1;
    }
    // le creste: adesso hanno una punta di luce da un pixel solo
    for(let i=0;i<14;i++){
      const bx=((hsh(i,0,141)*T + Math.sin((f/6)*6.28+i)*6)|0+T)%T;
      const by=((hsh(i,0,142)*T)|0);
      x.globalAlpha=0.7;
      px(x,bx,by,7,1,top);
      px(x,bx+2,by+1,3,1,shade(top,0.25));
      px(x,bx+3,by-1,1,1,shade(top,0.4));
      x.globalAlpha=1;
    }
    frames.push(c);
  }
  return frames;
}

/* Il terreno disegnato a mano, ritagliato dal suo foglio. Stesso patto
   di tutto il resto: `null` se non c'e o non e ancora arrivato, e chi
   disegna continua col terreno in codice. */
const terrCelle = {}; let terrDaCui = null;
A.terreno = function(tipo, v, season){
  if(!window.IMG || !window.DATA || !DATA.TERRENI) return null;
  const T = DATA.TERRENI;
  const riga = T.righe[tipo];
  if(riga === undefined) return null;
  const img = IMG.prendi('terreni');
  if(!img) return null;
  if(terrDaCui !== img){ for(const k in terrCelle) delete terrCelle[k]; terrDaCui = img; }
  const vv = (((v|0) % T.varianti) + T.varianti) % T.varianti;
  let st = DATA.SEASONS.findIndex(x => x.id === season);
  if(st < 0) st = 1;
  const col = vv*4 + st;
  const key = riga+'|'+col;
  if(terrCelle[key]) return terrCelle[key];
  const c = cv(T.w, T.h);
  c.getContext('2d').drawImage(img, col*T.w, riga*T.h, T.w, T.h, 0, 0, T.w, T.h);
  terrCelle[key] = c;
  return c;
};

A.ground = function(type, v, season){
  const key = type+'|'+v+'|'+(type==='erba'||type==='acqua'?season:'-');
  const aMano = A.terreno(type, v, season);
  if(aMano) return aMano;
  if(groundCache[key]) return groundCache[key];
  let c;
  switch(type){
    case 'erba':   c = season==='inverno' ? snowTile(v) : grassTile(v,season); break;
    case 'terra':  c = dirtTile(v); break;
    case 'sentiero': c = pathTile(v); break;
    case 'sabbia': c = sandTile(v); break;
    case 'assi':   c = woodTile(v); break;
    case 'lastre': c = stoneFloorTile(v); break;
    case 'cotto':  c = terracottaTile(v); break;
    case 'neve':   c = snowTile(v); break;
    case 'grotta': c = caveTile(v); break;
    case 'arato':  c = tilledTile(v,false); break;
    case 'bagnato':c = tilledTile(v,true); break;
    default:       c = grassTile(v,season||'primavera');
  }
  groundCache[key]=c;
  return c;
};

const waterCache = {};
A.water = function(season, frame){
  if(!waterCache[season]) waterCache[season]=waterFrames(season);
  return waterCache[season][frame%6];
};

/* ===================================================================
   2. PERSONAGGI
   =================================================================== */
/* look = {pelle,capelli,maglia,pant,grembiule,cappello,barba,spirito} */
A.CHAR_W = 26; A.CHAR_H = 36;

/* ------------------------------------------------------------------
   ACCONCIATURE
   Il colore da solo non basta a distinguere una persona da lontano: la
   sagoma sì. Cinque tagli, ognuno disegnato anche di spalle.
   ------------------------------------------------------------------ */
function chioma(x, bx, hy, dir, stile, cap, capS, capL){
  const dietro = dir===3;

  if(stile==='rado'){                     // stempiato
    px(x, bx+3, hy+1, 12, 2, cap);
    px(x, bx+1, hy+3, 2, 6, cap);
    px(x, bx+15,hy+3, 2, 6, cap);
    px(x, bx+4, hy+1, 10, 1, capL);
    if(dietro){ px(x, bx+2, hy+1, 14, 10, cap); px(x, bx+2, hy+10, 14, 2, capS); }
    return;
  }
  if(stile==='crespi'){                   // voluminosi, bordo mosso
    px(x, bx+1, hy-2, 16, 6, cap);
    px(x, bx-1, hy+1, 3, 8, cap);
    px(x, bx+16,hy+1, 3, 8, cap);
    px(x, bx+2, hy-4, 4, 3, cap);
    px(x, bx+8, hy-5, 4, 3, cap);
    px(x, bx+12,hy-4, 4, 3, cap);
    px(x, bx+3, hy-2, 12, 1, capL);
    if(dietro){ px(x, bx+1, hy-2, 16, 14, cap); px(x, bx+1, hy+11, 16, 2, capS); }
    return;
  }
  if(stile==='lunghi'){                   // ciocche che scendono sulle spalle
    px(x, bx+2, hy, 14, 4, cap);
    px(x, bx+3, hy, 12, 1, capL);
    // ciocche sottili e affusolate: larghe le trasformerebbero in un blocco
    px(x, bx+1, hy+2, 2, 11, cap);
    px(x, bx+15,hy+2, 2, 11, cap);
    px(x, bx+1, hy+12, 2, 2, capS);
    px(x, bx+15,hy+12, 2, 2, capS);
    px(x, bx+2, hy+13, 1, 2, cap);        // punta interna, appena accennata
    px(x, bx+15,hy+13, 1, 2, cap);
    if(dietro){
      px(x, bx+2, hy, 14, 13, cap);
      px(x, bx+3, hy, 12, 1, capL);
      px(x, bx+3, hy+12, 12, 2, capS);
    }
    return;
  }
  if(stile==='raccolti'){                 // crocchia sulla nuca
    px(x, bx+6, hy-4, 6, 5, cap);         // la crocchia spunta sopra la testa
    px(x, bx+7, hy-4, 4, 1, capL);
    px(x, bx+6, hy-1, 6, 1, capS);
    px(x, bx+2, hy, 14, 4, cap);
    px(x, bx+1, hy+2, 2, 6, cap);
    px(x, bx+15,hy+2, 2, 6, cap);
    px(x, bx+3, hy, 12, 1, capL);
    if(dietro){ px(x, bx+2, hy, 14, 11, cap); px(x, bx+2, hy+10, 14, 2, capS); }
    return;
  }

  /* 'corti' — il taglio di sempre */
  px(x, bx+2, hy, 14, 4, cap);
  px(x, bx+1, hy+2, 2, 7, cap);
  px(x, bx+15,hy+2, 2, 7, cap);
  px(x, bx+3, hy, 12, 1, capL);
  if(dietro){
    px(x, bx+2, hy, 14, 12, cap);
    px(x, bx+3, hy, 12, 1, capL);
    px(x, bx+2, hy+11, 14, 2, capS);
  } else {
    px(x, bx+2, hy+4, 3, 3, cap);
    px(x, bx+13,hy+4, 3, 3, cap);
    px(x, bx+4, hy+4, 3, 1, capS);
    px(x, bx+11,hy+4, 3, 1, capS);
  }
}

A.drawChar = function(x, cx, cy, look, dir, frame, opt){
  opt = opt || {};
  const bob = (frame===1||frame===3) ? -1 : 0;
  const step = frame===1 ? 1 : (frame===3 ? -1 : 0);

  if(look.spirito){ return drawSpirit(x,cx,cy,frame,opt); }

  const pelle = look.pelle||'#e8bd8f';
  const pelleS= shade(pelle,-0.20);
  const cap   = look.capelli||'#4a3524';
  const capS  = shade(cap,-0.25);
  const capL  = shade(cap,0.16);
  const mag   = look.maglia||'#c05a44';
  const magS  = shade(mag,-0.22);
  const magL  = shade(mag,0.14);
  const pan   = look.pant||'#3d5470';
  const panS  = shade(pan,-0.25);
  const scarpa= '#4a3524';

  const bx = cx-9, by = cy-32+bob;   // origine sprite (18 largo, 32 alto)

  /* --- corporatura e statura ---
     Prima esisteva un corpo solo, ricolorato sei volte: da lontano gli
     abitanti erano indistinguibili. Ora il torso cambia larghezza e il
     busto si allunga, tenendo i piedi per terra. */
  const LARG = { esile:10, normale:12, robusto:14 };
  const tw = LARG[look.corpo] || 12;
  const tx = bx + ((18-tw)>>1);
  const alt = Math.max(-2, Math.min(3, look.altezza|0));
  const ty = by+15-alt, th = 10+alt;   // busto: parte più in alto e si allunga

  // ombra (saltata quando la disegna il renderer)
  if(!opt.senzaOmbra){
    x.globalAlpha = 0.24;
    ellip(x, cx, cy-1, 8, 3, '#000000');
    x.globalAlpha = 1;
  }

  /* --- gambe --- */
  const l1 = by+24 + (dir<3? Math.max(0,step) : 0);
  const l2 = by+24 + (dir<3? Math.max(0,-step): 0);
  px(x, bx+4, l1, 4, 6, pan);
  px(x, bx+10,l2, 4, 6, pan);
  px(x, bx+4, l1+5, 4, 1, panS);
  px(x, bx+10,l2+5, 4, 1, panS);
  px(x, bx+3, l1+6, 6, 2, scarpa);
  px(x, bx+9, l2+6, 6, 2, scarpa);

  /* --- corpo --- */
  px(x, tx, ty, tw, th, mag);
  px(x, tx, ty, tw, 1, magL);
  px(x, tx, ty+th-1, tw, 1, magS);
  px(x, tx-1, ty+2, 1, th-3, magS);
  px(x, tx+tw,ty+2, 1, th-3, magS);

  // grembiule
  if(look.grembiule){
    const g=look.grembiule;
    px(x, tx+2, ty+4, tw-4, th-3, g);
    px(x, tx+2, ty+4, tw-4, 1, shade(g,0.2));
    px(x, tx+3, ty+th, tw-6, 1, shade(g,-0.2));
    px(x, tx+4, ty+6, tw-8, 3, shade(g,-0.08));
  }

  /* --- braccia --- */
  const arm = opt.uso ? -2 : (dir<3 ? step : 0);
  const ay = ty+1;
  if(dir===1){ // sinistra
    px(x, tx-1, ay+arm, 3, 8, mag);
    px(x, tx-1, ay+7+arm, 3, 3, pelle);
  } else if(dir===2){ // destra
    px(x, tx+tw-2, ay+arm, 3, 8, mag);
    px(x, tx+tw-2, ay+7+arm, 3, 3, pelle);
  } else {
    px(x, tx-2, ay+arm, 3, 8, mag);
    px(x, tx+tw-1, ay-arm, 3, 8, mag);
    px(x, tx-2, ay+7+arm, 3, 3, pelle);
    px(x, tx+tw-1, ay+7-arm, 3, 3, pelle);
  }

  /* --- testa --- */
  const hy = by+2-alt;
  px(x, bx+3, hy+2, 12, 12, pelle);
  px(x, bx+2, hy+4, 1, 8, pelle);
  px(x, bx+15,hy+4, 1, 8, pelle);
  px(x, bx+3, hy+13, 12, 1, pelleS);
  px(x, bx+4, hy+14, 10, 1, pelleS);
  // collo
  px(x, bx+7, hy+14, 4, 2, pelleS);

  /* --- capelli --- */
  chioma(x, bx, hy, dir, look.chioma, cap, capS, capL);

  /* --- viso --- */
  if(dir!==3){
    const ey = hy+7;
    const eo = dir===1 ? -2 : (dir===2 ? 2 : 0);
    const blink = opt.blink;
    if(blink){
      px(x, bx+5+eo, ey+1, 3, 1, '#3a2a1c');
      px(x, bx+10+eo,ey+1, 3, 1, '#3a2a1c');
    } else {
      px(x, bx+5+eo, ey, 2, 3, '#ffffff');
      px(x, bx+11+eo,ey, 2, 3, '#ffffff');
      px(x, bx+6+eo, ey+1, 1, 2, '#2f2418');
      px(x, bx+11+eo,ey+1, 1, 2, '#2f2418');
    }
    // guance
    x.globalAlpha=0.4;
    px(x, bx+3+eo, ey+3, 2, 2, '#e8908a');
    px(x, bx+13+eo,ey+3, 2, 2, '#e8908a');
    x.globalAlpha=1;
    // bocca
    px(x, bx+8+eo, ey+5, 2, 1, pelleS);
    if(look.barba){
      px(x, bx+5, hy+10, 8, 4, cap);
      px(x, bx+6, hy+13, 6, 2, capS);
      px(x, bx+7, hy+9, 4, 1, capS);
    }
  }

  /* --- cappello --- */
  if(look.cappello){
    const h = look.cappello;
    px(x, bx+1, hy+1, 16, 2, shade(h,-0.15));   // tesa
    px(x, bx+0, hy+2, 18, 1, shade(h,-0.3));
    px(x, bx+3, hy-4, 12, 5, h);
    px(x, bx+3, hy-4, 12, 1, shade(h,0.2));
    px(x, bx+3, hy-1, 12, 1, shade(h,-0.2));
  }

  /* --- attrezzo in mano --- */
  if(opt.attrezzo && dir!==3){
    const sx = dir===1 ? bx-3 : bx+15;
    A.drawToolHeld(x, sx, by+14, opt.attrezzo, dir===1?-1:1, opt.uso);
  }
};

function drawSpirit(x,cx,cy,frame,opt){
  const t = (opt.t||0);
  const fl = Math.sin(t*0.006)*2;
  const glow = 0.55+Math.sin(t*0.004)*0.2;
  x.save();
  x.globalAlpha = 0.28*glow;
  circ(x, cx, cy-16+fl, 15, '#ffe9a8');
  x.globalAlpha = 0.5*glow;
  circ(x, cx, cy-16+fl, 10, '#ffdf8a');
  x.globalAlpha = 1;
  // corpo fiammella
  const body='#fff2c8';
  ellip(x, cx, cy-15+fl, 6, 8, body);
  ellip(x, cx, cy-12+fl, 5, 6, '#ffe28f');
  px(x, cx-1, cy-24+fl, 2, 4, body);
  px(x, cx-2, cy-22+fl, 4, 3, body);
  // occhietti
  px(x, cx-3, cy-17+fl, 2, 3, '#8a5a1c');
  px(x, cx+1, cy-17+fl, 2, 3, '#8a5a1c');
  x.globalAlpha=0.5;
  px(x, cx-4, cy-13+fl, 2, 1, '#e0a050');
  px(x, cx+2, cy-13+fl, 2, 1, '#e0a050');
  x.globalAlpha=1;
  // scintille
  for(let i=0;i<3;i++){
    const a = t*0.002+i*2.1;
    const rx = cx+Math.cos(a)*13, ry = cy-16+fl+Math.sin(a*1.3)*9;
    x.globalAlpha = 0.4+Math.sin(t*0.005+i)*0.3;
    px(x, rx|0, ry|0, 2, 2, '#fff6d0');
  }
  x.globalAlpha=1;
  x.restore();
}

/* versione in cache dello sprite, ancorata in basso al centro:
   serve al renderer per ricavarne contorno e ombra */
const charCache = {};
function chiaveLook(l){
  // corporatura, statura e taglio di capelli fanno parte dell'identità:
  // senza di loro due abitanti diversi si scambierebbero lo sprite in cache
  return (l.pelle||'')+(l.capelli||'')+(l.maglia||'')+(l.pant||'')+
         (l.grembiule||'')+(l.cappello||'')+(l.barba?'b':'')+
         '|'+(l.corpo||'')+(l.altezza|0)+(l.chioma||'');
}
A.CH_W = 30; A.CH_H = 40;
A.charSprite = function(look, dir, frame){
  const key = chiaveLook(look)+'|'+dir+'|'+frame;
  if(charCache[key]) return charCache[key];
  const c = tela(A.CH_W, A.CH_H);
  const x = c.getContext('2d');
  x.imageSmoothingEnabled=false;
  A.drawChar(x, A.CH_W/2, A.CH_H-2, look, dir, frame, {senzaOmbra:true});
  charCache[key]=c;
  return c;
};

/* ===================================================================
   IL PERSONAGGIO DISEGNATO A MANO, RITAGLIATO DAL FOGLIO

   `img/omino.png` arriva come un foglio unico (vedi `DATA.OMINO`), ma
   tutto il resto del gioco si aspetta uno sprite per posa: il contorno
   scuro si costruisce da una tela e si tiene in cache PER TELA, la
   profondità si ordina su uno sprite, il riflesso nell'acqua ne vuole
   uno. Quindi il foglio si ritaglia una volta sola, alla prima
   richiesta, e da lì in poi queste otto celle sono sprite come gli altri.

   Torna `null` finché l'immagine non è arrivata, e per le direzioni che
   il foglio non copre: chi disegna, davanti a un `null`, usa il
   personaggio disegnato in codice. È lo stesso patto degli arredi.
   =================================================================== */
const ominoCelle = {};
const ominoDaCui = {};                 // per foglio: da quale immagine sono state ritagliate
/* `attrezzo` sceglie il foglio: c'è la camminata a mani vuote e, per
   qualche attrezzo, quella con l'attrezzo in mano. Un attrezzo senza
   foglio ricade su quella a mani vuote — si cammina, e in mano non si
   vede niente, che è lo stesso patto delle direzioni non disegnate. */
A.ominoSprite = function(dir, frame, attrezzo){
  if(!window.IMG || !window.DATA || !DATA.OMINO) return null;
  const conAttrezzo = attrezzo && DATA.OMINO_ATTREZZI && DATA.OMINO_ATTREZZI[attrezzo];
  const chiave = conAttrezzo ? 'omino:'+attrezzo : 'omino';
  let O = conAttrezzo || DATA.OMINO;
  let img = IMG.prendi(chiave);
  /* Il foglio dell'attrezzo può non essere ancora arrivato mentre quello
     a mani vuote sì. Meglio camminare senza attrezzo che sparire. */
  let k = chiave;
  if(!img && conAttrezzo){ O = DATA.OMINO; k = 'omino'; img = IMG.prendi(k); }
  if(!img) return null;
  const riga = O.righe[dir];
  if(riga === undefined) return null;               // direzione non disegnata
  /* Se l'immagine è cambiata sotto ai piedi — succede solo col
     `IMG.riprova` del pannello di prova — le celle vecchie non valgono
     più e si rifanno. Una per foglio, se no riprovarne uno le butterebbe
     tutte. */
  if(ominoDaCui[k] !== img){
    for(const c in ominoCelle) if(c.indexOf(k+'|') === 0) delete ominoCelle[c];
    ominoDaCui[k] = img;
  }
  const col = ((frame|0) % O.fotogrammi + O.fotogrammi) % O.fotogrammi;
  const key = k+'|'+riga+'|'+col;
  if(ominoCelle[key]) return ominoCelle[key];
  const c = cv(O.w, O.h), x = c.getContext('2d');
  x.drawImage(img, col*O.w, riga*O.h, O.w, O.h, 0, 0, O.w, O.h);
  ominoCelle[key] = c;
  return c;
};

/* L'abitante disegnato a mano, ritagliato dal suo foglio. Stesso patto
   del giocatore: `null` se il foglio non c'e o non e ancora arrivato, e
   chi disegna ripiega su `drawChar`. */
const npcCelle = {}, npcDaCui = {};
A.npcSprite = function(id, dir, frame){
  if(!window.IMG || !window.DATA || !DATA.NPC_FOGLI) return null;
  const N = DATA.NPC_FOGLI[id];
  if(!N) return null;
  const riga = N.righe[dir];
  if(riga === undefined) return null;
  const img = IMG.prendi('npc:'+id);
  if(!img) return null;
  if(npcDaCui[id] !== img){
    for(const k in npcCelle) if(k.indexOf(id+'|') === 0) delete npcCelle[k];
    npcDaCui[id] = img;
  }
  const col = ((frame|0) % N.fotogrammi + N.fotogrammi) % N.fotogrammi;
  const key = id+'|'+riga+'|'+col;
  if(npcCelle[key]) return npcCelle[key];
  const c = cv(N.w, N.h);
  c.getContext('2d').drawImage(img, col*N.w, riga*N.h, N.w, N.h, 0, 0, N.w, N.h);
  npcCelle[key] = c;
  return c;
};

/* Il rettangolo pieno di uno sprite. Serve al ritratto per sapere dove
   sta la testa dentro alla cella, che e' quasi sempre piu' piccola. */
const sagomaCache = new WeakMap();
function sagoma(canv){
  if(sagomaCache.has(canv)) return sagomaCache.get(canv);
  const t = cv(canv.width, canv.height), tx = t.getContext('2d');
  tx.drawImage(canv, 0, 0);
  const D = tx.getImageData(0,0,t.width,t.height).data;
  let mnx=1e9,mxx=-1,mny=1e9,mxy=-1;
  for(let y=0;y<t.height;y++) for(let x=0;x<t.width;x++)
    if(D[(y*t.width+x)*4+3]>16){ if(x<mnx)mnx=x; if(x>mxx)mxx=x; if(y<mny)mny=y; if(y>mxy)mxy=y; }
  const r = mxx<0 ? null : {x:mnx, y:mny, w:mxx-mnx+1, h:mxy-mny+1};
  sagomaCache.set(canv, r);
  return r;
}

/* ritratto per i dialoghi (96x96) */
const faceCache={};
A.face = function(key, look){
  if(faceCache[key]) return faceCache[key];
  const c=cv(96,96), x=c.getContext('2d');
  x.imageSmoothingEnabled=false;
  // sfondo
  const g=x.createLinearGradient(0,0,0,96);
  g.addColorStop(0,'#f6e6c8'); g.addColorStop(1,'#d8bd93');
  x.fillStyle=g; x.fillRect(0,0,96,96);
  x.globalAlpha=0.18;
  for(let i=0;i<40;i++) px(x,(hsh(i,0,7)*96)|0,(hsh(i,1,7)*96)|0,2,2,'#a8865c');
  x.globalAlpha=1;
  /* Personaggio ingrandito, con la testa inquadrata.

     Lo spostamento verticale segue la STATURA. Era fisso a 8, e la
     statura sposta la testa in su di `alt` pixel: a 3,4× di zoom sono
     3,4 pixel di ritratto per ogni gradino. Serafina è alta 2 e porta
     il cappello, e la cupola del cappello finiva a y=0 — cioè tagliata
     netta dal bordo. Da fuori si vede un cappello schiacciato, e sembra
     lo sprite a essere sbagliato.

     Compensando, la testa cade sempre nello stesso punto qualunque sia
     la statura: che è anche quello che si chiede a una cornice di
     ritratti, sei facce alla stessa altezza invece di sei altezze
     diverse. La statura si continua a vedere nel gioco, dove serve. */
  /* Se l'abitante ha il suo foglio disegnato a mano, il ritratto viene
     da lì: nel mondo si vede quello, e una fototessera che mostra un
     altro disegno è la fototessera di un altro. Si inquadra la TESTA —
     la fascia alta della sagoma — e si ingrandisce fino a riempire il
     riquadro, così la faccia cade sempre allo stesso posto qualunque
     sia la statura, che è quello che si chiede a una cornice di
     ritratti. */
  const foglio = A.npcSprite(key, 0, 0);
  if(foglio){
    const b = sagoma(foglio);
    if(b){
      /* Quanta figura entra: dalla cima della testa fino a poco sotto
         le spalle. Presa piu' corta si vedeva mezza faccia, presa piu'
         lunga la testa diventava un puntino in mezzo al busto. */
      const alta = Math.round(b.h * 0.46);
      const zoom = 88 / alta;
      x.save();
      x.imageSmoothingEnabled = false;
      x.translate(48, 10);
      x.scale(zoom, zoom);
      x.drawImage(foglio, b.x, b.y, b.w, alta,
                  -(b.w/2), 0, b.w, alta);
      x.restore();
      const v0=x.createRadialGradient(48,44,20,48,48,58);
      v0.addColorStop(0,'rgba(0,0,0,0)'); v0.addColorStop(1,'rgba(60,40,20,.35)');
      x.fillStyle=v0; x.fillRect(0,0,96,96);
      faceCache[key]=c;
      return c;
    }
  }
  const altezzaRitratto = Math.max(-2, Math.min(3, look.altezza|0));
  x.save();
  x.translate(48, 96);
  x.scale(3.4,3.4);
  x.translate(0, 8 + altezzaRitratto);
  A.drawChar(x, 0, 0, look, 0, 0, {});
  x.restore();
  // vignetta
  const v=x.createRadialGradient(48,44,20,48,48,58);
  v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(60,40,20,.35)');
  x.fillStyle=v; x.fillRect(0,0,96,96);
  faceCache[key]=c;
  return c;
};

/* ===================================================================
   3. COLTURE
   =================================================================== */
A.drawCrop = function(x, cx, by, cropId, stage, nStages, sway){
  /* Il disegno a mano, se c'e. Qui non si torna uno sprite ma si
     DISEGNA dentro a un contesto gia raddoppiato: la cella e 64x64
     pixel di mondo, cioe 32x32 unita di disegno, e la sua origine sta
     a (cx-16, by-26) perche e li che `disegnaColtura` la chiama.
     Metterla a misura piena la farebbe grande il doppio, che e la
     solita trappola dei blocchi raddoppiati.

     Il dondolio al vento resta al disegno in codice: un PNG non si
     piega, e inclinarlo tutto — zolla compresa — si vedrebbe. */
  const aMano = vegSprite('colture', cropId, null, stage);
  if(aMano){ x.drawImage(aMano, cx-16, by-26, 32, 32); return; }
  const C = DATA.CROPS[cropId];
  if(!C) return;
  const fog = C.foglia, fogS = shade(fog,-0.24), fogL = shade(fog,0.16);
  const t = stage/(nStages);          // 0..1
  const ready = stage >= nStages;
  const s = sway||0;

  if(stage===0){
    // germoglio
    px(x, cx-1, by-4, 2, 4, fog);
    px(x, cx-3+s, by-5, 3, 2, fogL);
    px(x, cx+1+s, by-6, 3, 2, fog);
    return;
  }

  const h = 5 + Math.round(t*12);
  // stelo
  px(x, cx-1+((s*0.4)|0), by-h, 2, h, fog);
  px(x, cx-1+((s*0.4)|0), by-h, 1, h, fogL);
  // foglie
  const pairs = 1 + Math.floor(t*2.4);
  for(let i=0;i<pairs;i++){
    const ly = by - 3 - i*Math.max(3,(h/(pairs+0.4)));
    const w  = 4 + Math.round(t*4) - i;
    const off = Math.round(s*(0.5+i*0.3));
    px(x, cx-1-w+off, ly, w, 3, fog);
    px(x, cx-1-w+off, ly, w, 1, fogL);
    px(x, cx+1+off,   ly-1, w, 3, fog);
    px(x, cx+1+off,   ly-1, w, 1, fogL);
    px(x, cx-1-w+off, ly+2, w, 1, fogS);
  }

  if(!ready){
    if(stage >= nStages-1){
      // frutto acerbo
      const fy = by-h+2;
      circ(x, cx+2+s, fy, 2, shade(C.c2,-0.1));
    }
    return;
  }

  /* --- frutto maturo --- */
  A.drawFruit(x, cx, by, C, h, s, false);
};

A.drawFruit = function(x, cx, by, C, h, s, iconMode){
  const c1=C.c1, c2=C.c2, cl=shade(c1,0.28), cd=shade(c2,-0.18);
  const fog=C.foglia||'#5f9c3c', fogL=shade(fog,0.2);
  const topY = by - h;

  switch(C.forma){
    case 'radice': {
      const y = by-4;
      ellip(x, cx+s, y, 5, 5, c1);
      ellip(x, cx-1+s, y-1, 3, 3, cl);
      px(x, cx-4+s, y-5, 8, 2, c2);
      px(x, cx-1+s, by-1, 2, 3, shade(c1,-0.3));
      break;
    }
    case 'tubero': {
      ellip(x, cx-3+s, by-3, 4, 3, c1);
      ellip(x, cx+3+s, by-2, 3, 3, c2);
      ellip(x, cx-3+s, by-4, 2, 1, cl);
      px(x, cx-4+s, by-3, 1, 1, cd);
      px(x, cx+3+s, by-2, 1, 1, cd);
      break;
    }
    case 'foglia': {
      ellip(x, cx+s, by-8, 8, 7, c2);
      ellip(x, cx+s, by-9, 7, 6, c1);
      ellip(x, cx-2+s, by-11, 3, 3, cl);
      for(let i=0;i<4;i++){
        px(x, cx-6+i*3+s, by-12+((i%2)*2), 1, 6, shade(c2,-0.1));
      }
      break;
    }
    case 'bacca': {
      const pos=[[-4,-3],[3,-5],[0,-9],[-5,-8],[4,-10]];
      for(const p of pos){
        const fx = cx+p[0]+s;
        const yy = by-4+p[1];
        circ(x, fx, yy, 2.6, c1);
        px(x, fx-1, yy-2, 2, 1, cl);
        px(x, fx, yy+2, 1, 1, cd);
        px(x, fx-1, yy-4, 3, 1, fog);
      }
      break;
    }
    case 'fiore': {
      const fy = topY+3;
      for(let i=0;i<8;i++){
        const a=i/8*6.283;
        const pxx = cx+Math.cos(a)*5+s, pyy=fy+Math.sin(a)*5;
        ellip(x, pxx, pyy, 3, 2.4, i%2? c1 : shade(c1,0.12));
      }
      circ(x, cx+s, fy, 3, c2);
      circ(x, cx-1+s, fy-1, 1.4, shade(c2,0.3));
      break;
    }
    case 'pannocchia': {
      const fy = topY+5;
      px(x, cx+1+s, fy-6, 5, 13, c1);
      px(x, cx+1+s, fy-6, 5, 1, cl);
      px(x, cx+5+s, fy-5, 1, 12, cd);
      for(let i=0;i<6;i++) px(x, cx+2+s, fy-5+i*2, 3, 1, shade(c1,0.18));
      px(x, cx+2+s, fy-9, 3, 4, fogL);   // barba
      px(x, cx-1+s, fy-4, 3, 11, fog);
      break;
    }
    case 'sfera': {
      const y=by-6;
      ellip(x, cx+s, y, 8, 7, c1);
      ellip(x, cx-2+s, y-2, 4, 3, cl);
      ellip(x, cx+s, y+5, 7, 2, cd);
      for(let i=-2;i<=2;i++){
        x.globalAlpha=0.4;
        px(x, cx+i*3+s, y-6, 1, 12, cd);
        x.globalAlpha=1;
      }
      px(x, cx-1+s, y-8, 2, 3, '#6a4a28');
      break;
    }
    case 'baccello': {
      const pos=[[-4,-4],[3,-7],[-1,-10]];
      for(const p of pos){
        const fx=cx+p[0]+s, yy=by-2+p[1];
        ellip(x, fx, yy, 2.2, 4, c1);
        px(x, fx-1, yy-2, 1, 4, cl);
        px(x, fx-1, yy-5, 2, 2, fog);
      }
      break;
    }
    case 'grappolo': {
      const gy = by-10;
      const rows=[3,3,2,1];
      let ry=gy;
      for(let r=0;r<rows.length;r++){
        for(let i=0;i<rows[r];i++){
          const fx = cx+s - (rows[r]-1)*2.5 + i*5;
          circ(x, fx, ry, 2.4, (i+r)%2? c1:shade(c1,-0.08));
          px(x, fx-1, ry-2, 1, 1, cl);
        }
        ry += 4;
      }
      px(x, cx-4+s, gy-4, 9, 3, fog);
      px(x, cx-4+s, gy-4, 9, 1, fogL);
      break;
    }
    default:
      circ(x, cx+s, by-6, 4, c1);
  }

  if(C.magica){
    x.globalAlpha=0.35;
    circ(x, cx+s, by-8, 9, '#bff0f8');
    x.globalAlpha=1;
  }
};

/* ===================================================================
   4. ALBERI, SASSI, OGGETTI DI SCENA
   =================================================================== */
const objCache = {};

/* Una massa di chioma, in pixel di MONDO: la chiamano l'albero e il
   cespuglio, che sono ridisegnati a 64 tutti e due. */
function foliageBlob(x, cx, cy, r, base, season, seme){
  seme = seme|0;
  const dark = shade(base,-0.22), light = shade(base,0.16), light2=shade(base,0.3);
  circ(x, cx, cy, r, dark);
  circ(x, cx, cy-2, r-2, base);
  circ(x, cx-r*0.32, cy-r*0.34, r*0.55, light);
  circ(x, cx-r*0.4, cy-r*0.45, r*0.28, light2);
  /* Il bordo frastagliato. Erano diciotto bitorzoli da 3×3 unità di
     disegno, cioè 6×6 a schermo: a quella misura il contorno di una
     chioma si legge a bolle, e da vicino si contano una per una. Adesso
     sono quarantaquattro ciuffi da 3×3 pixel VERI — grandi la metà e
     due volte e mezzo più fitti — e il profilo smette di essere un
     cerchio bitorzoluto e comincia a essere fogliame. */
  const N = 44;
  for(let i=0;i<N;i++){
    const a=i/N*6.283;
    const rr=r*(0.88+hsh(i,(cx|0)+seme*37,151)*0.24);
    const bx=cx+Math.cos(a)*rr, byy=cy+Math.sin(a)*rr;
    px(x,bx|0,byy|0,3,3, hsh(i,(cy|0)+seme*53,152)>0.5? base:dark);
  }
  /* E qualche spiraglio DENTRO alla massa. È la cosa che a 32 non si
     poteva fare: un buco da due pixel di disegno sarebbe stato un
     quadrato da quattro a schermo, cioè un difetto. Da due pixel veri è
     l'ombra fra una foglia e l'altra, ed è quello che toglie alla chioma
     l'aria di essere una macchia di vernice. */
  for(let i=0;i<9;i++){
    const a = hsh(i,seme*17,153)*6.283, rr = r*(0.2+hsh(i,seme*19,154)*0.55);
    px(x, (cx+Math.cos(a)*rr)|0, (cy+Math.sin(a)*rr)|0, 2, 2, dark);
  }
  if(season==='inverno'){
    // la neve si posa sopra, e adesso ha un bordo invece di un blocco
    x.globalAlpha=0.75;
    for(let i=0;i<26;i++){
      const a=-0.4-i/26*2.4;
      const bx=cx+Math.cos(a)*r*0.86, byy=cy+Math.sin(a)*r*0.86;
      px(x,bx|0,byy|0,4,3,'#ffffff');
      if(hsh(i,seme,155)>0.5) px(x,bx|0,(byy|0)+3,2,1,'#ffffff');
    }
    x.globalAlpha=1;
  }
}

/* `v` è la variante (0..3): due alberi vicini non devono essere lo stesso
   timbro battuto due volte. Il chiamante la ricava dalle coordinate della
   casella, così non serve salvare niente nel mondo. */
/* ===================================================================
   LA VEGETAZIONE DISEGNATA A MANO

   Stesso patto del foglio della camminata: le celle si ritagliano una
   volta sola e da lì in poi sono sprite come gli altri. Torna `null` se
   il foglio non è arrivato o se quella combinazione non è disegnata, e
   chi chiama continua col disegno in codice.

   La cache tiene da quale immagine viene ogni foglio, se no `IMG.riprova`
   del pannello di prova restituirebbe le celle vecchie.
   =================================================================== */
const vegCelle = {}, vegDaCui = {};
function vegSprite(id, chiave, season, dentro){
  if(!window.IMG || !window.DATA || !DATA.VEGETAZIONE) return null;
  const V = DATA.VEGETAZIONE[id];
  if(!V) return null;
  const riga = V.righe[chiave] !== undefined ? V.righe[chiave] : V.righe['*'];
  if(riga === undefined) return null;
  const img = IMG.prendi('veg:'+id);
  if(!img) return null;
  if(vegDaCui[id] !== img){
    for(const k in vegCelle) if(k.indexOf(id+'|') === 0) delete vegCelle[k];
    vegDaCui[id] = img;
  }
  let col = 0, r = riga;
  if(V.fasi){
    /* Una VOCE per riga, e `dentro` sceglie la colonna: sono le colture,
       una riga per coltura e una colonna per fase. */
    col = Math.max(0, Math.min(V.fasi-1, dentro|0));
  } else if(V.colonne){
    /* Foglio impaginato a griglia invece che a righe: l'indice dichiarato
       in `righe` è il numero della cella, e da lì si ricavano riga e
       colonna. Serve ai quindici raccolti selvatici, che in una colonna
       sola avrebbero fatto un PNG alto 960 e largo 64. */
    col = r % V.colonne; r = (r / V.colonne) | 0;
  } else if(V.stagionale){
    col = DATA.SEASONS.findIndex(s => s.id === season);
    if(col < 0) col = 0;
  }
  const key = id+'|'+r+'|'+col;
  if(vegCelle[key]) return vegCelle[key];
  const c = cv(V.w, V.h);
  c.getContext('2d').drawImage(img, col*V.w, r*V.h, V.w, V.h, 0, 0, V.w, V.h);
  vegCelle[key] = c;
  return c;
}

A.tree = function(kind, season, stage, v){
  v = (((v|0) % 4) + 4) % 4;
  /* Il disegno a mano, se c'e. Una sola variante per ora: il foglio
     ne da una, quindi i quattro `v` pescano la stessa cella e il bosco
     viene uniforme. E scritto in DATA.VEGETAZIONE. */
  const aMano = vegSprite('alberi', kind+'|'+stage, season);
  if(aMano) return aMano;
  const key = 'tree|'+kind+'|'+season+'|'+stage+'|'+v;
  if(objCache[key]) return objCache[key];
  /* L'ALBERO È RIDISEGNATO A 64. La tela è grande uguale — 192×224 pixel,
     tre caselle per tre e mezza — ma adesso ci si scrive dentro uno per
     uno invece che a coppie. Gli alberi sono i secondi per area dopo il
     terreno: 135% dello schermo nel bosco, e al podere anche di più
     contando le sovrapposizioni.

     Attenzione, però, che è un lavoro diverso da quello delle
     piastrelle: là era rumore procedurale e la finezza era una
     questione di parametri, qui la forma di una chioma è una scelta di
     chi disegna. Quello che ho fatto è SUDDIVIDERE quello che c'era —
     più ciuffi e più piccoli, corteccia a scanalature invece che a
     macchie, radici che si allargano invece di tre rettangoli — senza
     toccare la silhouette, le masse e i colori. */
  const W=192, H=224;
  const c=telaNetta(W,H), x=c.getContext('2d');
  const S = DATA.SEASONS.find(s=>s.id===season);
  const cxx=W/2, base=H-12;
  const R = i => hsh(i, v*101+7, 181);      // numeri stabili per questa variante
  const sp = v>=2 ? -1 : 1;                  // metà delle varianti crescono specchiate

  if(stage===0){ // germoglio
    const h = 18 + ((R(1)*8)|0);
    px(x,cxx-2,base-h-2,3,h+2,C().legno.ramo);
    px(x,cxx+1,base-h-2,1,h+2,shade(C().legno.ramo,-0.2));   // il lato in ombra
    foliageBlob(x, cxx + sp*((R(2)*6)|0), base-h-8, 12+R(3)*6, S.tree, season, v);
    objCache[key]=c; return c;
  }
  if(stage===1){ // alberello
    const h = 42 + ((R(4)*14)|0);
    px(x,cxx-4,base-h,7,h,C().legno.ramo);
    px(x,cxx-4,base-h,2,h,shade(C().legno.ramo,0.16));
    px(x,cxx+2,base-h,1,h,shade(C().legno.ramo,-0.2));
    foliageBlob(x, cxx + sp*((R(5)*10)|0), base-h-12, 24+R(6)*10, S.tree, season, v);
    objCache[key]=c; return c;
  }

  // la betulla è crema calda, non bianco gesso: isolata non deve
  // sembrare una colonna di pietra
  const L = C().legno;
  const trunkCol = kind==='betulla' ? L.betulla      : L.corteccia;
  const trunkD   = kind==='betulla' ? L.betullaOmbra : L.cortecciaOmbra;
  const trunkL   = kind==='betulla' ? L.betullaLuce  : L.cortecciaLuce;

  // tronco — altezza e spessore variano un po' da esemplare a esemplare
  const th = (kind==='pino'? 112 : 88) + ((R(10)*18)|0) - 8;
  const tw = (kind==='betulla'? 18 : 24) + (R(11)>0.6 ? 2 : 0);
  const t0 = cxx - (tw>>1);
  px(x, t0, base-th, tw, th, trunkCol);
  px(x, t0, base-th, 5, th, trunkL);
  px(x, t0+tw-5, base-th, 5, th, trunkD);
  /* La corteccia. Erano sette macchioline orizzontali; adesso sono
     scanalature VERTICALI larghe un pixel, che è come è fatta una
     corteccia e che a 32 non si poteva disegnare — un pixel di disegno
     sarebbe stato una riga da due, cioè una striscia. */
  for(let i=0;i<5;i++){
    const gx = t0 + 3 + ((hsh(i,0,164)*(tw-7))|0);
    const y0 = base-th + 6 + ((hsh(i,1,165)*20)|0);
    const gh = 20 + ((hsh(i,2,166)*(th-40))|0);
    x.globalAlpha=0.35;
    px(x, gx, y0, 1, gh, trunkD);
    px(x, gx+1, y0+3, 1, gh-6, trunkL);
    x.globalAlpha=1;
  }
  for(let i=0;i<16;i++){
    const yy=base-th+10+i*((th-16)/16);
    x.globalAlpha=0.5;
    px(x, t0+2+((hsh(i,0,161)*(tw-7))|0), yy, 4, 1, trunkD);
    x.globalAlpha=1;
  }
  if(kind==='betulla'){
    for(let i=0;i<14;i++){
      const bw = 5+((hsh(i,2,163)*6)|0);
      px(x, t0+2+((hsh(i,1,162)*(tw-bw-2))|0), base-th+14+i*((th-20)/14), bw, 3, C().legno.betullaMacchia);
    }
  }
  /* Radici. Erano tre rettangoli sovrapposti; adesso il tronco si
     allarga verso terra a gradini da un pixel, e da lì partono quattro
     radici che si assottigliano. È la differenza fra un palo piantato e
     un albero cresciuto. */
  /* Il piede dell'albero: lo svaso, e le radici che ne ESCONO.

     Due tentativi buttati prima di questo, e valgono tutti e due la
     pena di essere scritti. Il primo erano righe da un pixel a raggiera:
     sull'erba si leggevano come una manciata di graffi rossi — `trunkD`
     è un bruno scuro ma contro il verde tira al rosso. Il secondo erano
     tre gobbe per parte, e il difetto era un altro: partivano DOPO lo
     svaso, con un pixel di stacco, e a schermo sembravano tre paletti
     piantati accanto al tronco.

     Adesso il profilo è continuo: dalla larghezza del piede scende con
     una curva, e ogni tanto una radice si allunga di qualche pixel. Da
     lontano è una base che si allarga, da vicino sono radici. */
  const svaso = 7;
  for(let i=0;i<svaso;i++) px(x, t0-i, base-14+i*2, tw+i*2, 2, trunkCol);
  const piede = (tw>>1) + svaso;
  for(const verso of [-1, 1]){
    const lung = 12 + ((hsh(verso+1, v, 168)*5)|0);
    // il monticello: scende liscio, senza salti
    for(let i=0;i<lung;i++){
      const h = Math.max(1, Math.round(9 * Math.pow(1 - i/lung, 1.6)));
      px(x, cxx + verso*(piede + i), base-h, 1, h+2, i%5===0 ? trunkD : trunkCol);
    }
    /* e due radici che proseguono a filo di terra. L'irregolarità sta
       QUI, nella lunghezza, e non nell'altezza: provata sull'altezza —
       qualche colonna più alta a caso — e il piede dell'albero diventava
       un pettine di stecchi verticali. Una radice corre per terra, non
       sta in piedi. */
    for(const [d, extra] of [[lung-3, 5 + ((hsh(verso,v,169)*4)|0)],
                             [lung-7, 3 + ((hsh(verso,v+1,170)*3)|0)]]){
      for(let i=0;i<extra;i++)
        px(x, cxx + verso*(piede + d + i), base-2, 1, 3, trunkD);
    }
  }

  // chioma
  if(kind==='pino'){
    const col = season==='inverno' ? C().pino.invernale : C().pino.estivo;
    const piani = 4 + (R(12)>0.55 ? 1 : 0);       // pini più o meno folti
    /* I piani si distribuiscono fra la cima e un fondo FISSO, invece di
       scendere di un passo fisso. Col passo fisso il quinto piano — che
       prima non capitava mai, perché `R(12)>0.55` non scattava con
       l'hash rotto — finiva sotto il livello del terreno e si mangiava
       tutto il tronco: il pino diventava un blocco verde. */
    const cima = base-th-8, fondo = base-30;
    const passo = (fondo - cima) / (piani - 1);
    /* I rami del pino sono fatti a colonne. Erano larghe due unità di
       disegno, cioè quattro pixel a schermo, e a quella misura un ago di
       pino è una tavoletta. Adesso sono larghe due pixel veri e ce ne
       sono il doppio, e la punta di ogni colonna è mossa di un pixel:
       il profilo del ramo diventa seghettato invece che smussato. */
    for(let i=0;i<piani;i++){
      const yy = cima + i*passo;
      const w  = 30+i*20 + ((R(14+i)*8)|0);
      const dark=shade(col,-0.2), light=shade(col,0.16);
      x.fillStyle=dark;
      for(let k=0;k<=w;k+=2){
        const hh = 32-Math.abs(k-w/2)/(w/2)*20 + (hsh(k,i,191)>0.5?2:0);
        x.fillRect(cxx-w/2+k, yy-hh, 2, hh+12);
      }
      x.fillStyle=col;
      for(let k=4;k<w-4;k+=2){
        const hh = 26-Math.abs(k-w/2)/(w/2)*18 + (hsh(k,i,192)>0.5?2:0);
        x.fillRect(cxx-w/2+k, yy-hh+4, 2, hh+6);
      }
      x.fillStyle=light;
      for(let k=8;k<w/2;k+=3){
        const hh = 18-Math.abs(k-w/2)/(w/2)*12;
        x.fillRect(cxx-w/2+k, yy-hh+6, 2, hh);
      }
      if(season==='inverno'){
        x.globalAlpha=0.8; x.fillStyle='#ffffff';
        for(let k=0;k<w;k+=4){
          const dy = Math.abs(k-w/2)/(w/2)*12;
          x.fillRect(cxx-w/2+k, yy-16+dy, 3, 2);
          if(hsh(k,i,193)>0.6) x.fillRect(cxx-w/2+k, yy-14+dy, 2, 1);
        }
        x.globalAlpha=1;
      }
    }
  } else {
    const col = S.tree;
    // rametti bassi: raccordano il tronco alla chioma, così non resta
    // un "collo" nudo che di lontano sembra un palo
    x.strokeStyle = trunkD; x.lineWidth = 6;
    x.beginPath();
    x.moveTo(cxx-2, base-th+32); x.lineTo(cxx-26*sp, base-th+12);
    x.moveTo(cxx+2, base-th+36); x.lineTo(cxx+24*sp, base-th+16);
    x.moveTo(cxx,   base-th+20); x.lineTo(cxx-12*sp, base-th-4);
    x.stroke();
    // e i rametti sottili che si staccano dai rami grossi: un pixel
    x.lineWidth = 2;
    x.beginPath();
    x.moveTo(cxx-18*sp, base-th+18); x.lineTo(cxx-30*sp, base-th+4);
    x.moveTo(cxx+16*sp, base-th+22); x.lineTo(cxx+28*sp, base-th+28);
    x.stroke();
    x.lineWidth = 1;

    /* Chioma: sei masse. Posizione e raggio si spostano di qualche pixel a
       seconda della variante, e metà delle varianti sono specchiate: da
       lontano è quanto basta perché il bosco smetta di sembrare stampato. */
    const M = [[-32, 14, 40], [32, 18, 38], [0, 24, 30], [0, -20, 48], [-18, -2, 36], [20, -10, 34]];
    M.forEach(([dx, dy, r], i)=>{
      const jx = ((R(20+i)*14)|0) - 6;
      const jy = ((R(30+i)*10)|0) - 4;
      const jr = 1 + (R(40+i)-0.5)*0.16;
      foliageBlob(x, cxx + (dx+jx)*sp, base-th + dy+jy, r*jr, col, season, v*6+i);
    });
    // frutti autunnali: adesso hanno un lato in ombra e un luccichio
    if(season==='autunno'){
      for(let i=0;i<12;i++){
        const bx=cxx-48+((hsh(i,v*13,171)*96)|0), byy=base-th-36+((hsh(i,v*13+1,172)*68)|0);
        px(x,bx,byy,4,4,C().frutto.base);
        px(x,bx+2,byy+2,2,2,shade(C().frutto.base,-0.22));
        px(x,bx,byy,2,1,C().frutto.luce);
      }
    }
  }
  objCache[key]=c;
  return c;
};

/* Il ceppo aveva un disegno solo per tutta la valle, ed era piatto: si
   leggeva come una ciambella vista dall'alto, in disaccordo con la
   prospettiva a tre quarti di tutto il resto. Ora ha quattro varianti e
   una parete laterale con la corteccia. */
A.stump = function(v){
  v = (((v|0) % 4) + 4) % 4;
  const aMano = vegSprite('ceppo', '*', null);
  if(aMano) return aMano;
  const key='stump|'+v;
  if(objCache[key]) return objCache[key];
  /* Il ceppo è un albero tagliato, quindi va con lui: lasciato a 32
     accanto a un tronco scanalato si legge come un tappo di sughero.
     Gli anelli sono la cosa che ci guadagna di più — a 32 ne stavano
     tre, e un ceppo senza anelli non è un ceppo. */
  const c=telaNetta(80,64), x=c.getContext('2d');
  const P = C().ceppo;
  const R = i => hsh(i, v*67+3, 191);
  // permutazioni invece di numeri a caso: garantiscono quattro sagome
  // diverse, mentre due tiri di dado possono benissimo coincidere
  const rx = 22 + [0,6,2,4][v];            // larghezza del taglio
  const h  = 10 + [4,0,6,2][v];            // quanto sporge da terra
  const cy = 44;

  ellip(x, 40, cy+h-2, rx+2, 9, P.terra);              // ombra al piede
  x.fillStyle = P.fianco;                               // parete di corteccia
  x.fillRect(40-rx, cy-4, rx*2, h);
  ellip(x, 40, cy+h-4, rx, 8, P.fianco);
  for(let i=0;i<11;i++){                                // scanalature verticali
    const bx = 40-rx+3 + ((R(3+i)*(rx*2-6))|0);
    x.globalAlpha = 0.45;
    px(x, bx, cy, 1, h-1, P.terra);
    x.globalAlpha = 1;
  }
  ellip(x, 40, cy-4, rx, 10, P.taglio);                 // faccia tagliata
  /* Gli anelli di crescita: cinque cerchi alternati invece di due, e
     spessi un pixel vero. È quello che a 32 non ci stava — un anello da
     un pixel di disegno era spesso due a schermo, e cinque non ci
     entravano nella faccia del taglio. */
  for(let k=5;k>=1;k--){
    const f = k/5;
    ellip(x, 40, cy-4, rx*f, 10*f, k%2 ? P.anelli : P.taglio);
  }
  ellip(x, 40, cy-4, 4, 2, P.cuore);
  if(R(9) > 0.5){                                       // qualche scheggia
    px(x, 40-rx+2, cy-8, 6, 4, P.taglio);
    px(x, 40+rx-8, cy-6, 6, 4, P.fianco);
  }
  objCache[key]=c; return c;
};

/* Il sasso disegnato a mano. Torna `null` se il foglio non c'e o se
   quel tipo non e disegnato, e chi chiama continua col disegno in
   codice — lo stesso patto di tutto il resto. */
const minCelle = {}; let minDaCui = null;
A.minerale = function(kind, season){
  if(!window.IMG || !window.DATA || !DATA.MINERALI) return null;
  const M = DATA.MINERALI;
  const riga = M.righe[kind];
  if(riga === undefined) return null;
  const img = IMG.prendi('minerali');
  if(!img) return null;
  if(minDaCui !== img){ for(const k in minCelle) delete minCelle[k]; minDaCui = img; }
  let st = DATA.SEASONS.findIndex(x => x.id === season);
  if(st < 0) st = 1;
  const key = riga+'|'+st;
  if(minCelle[key]) return minCelle[key];
  const c = cv(M.w, M.h);
  c.getContext('2d').drawImage(img, st*M.w, riga*M.h, M.w, M.h, 0, 0, M.w, M.h);
  minCelle[key] = c;
  return c;
};

A.rock = function(kind, v, season){
  const aMano = A.minerale(kind, season);
  if(aMano) return aMano;
  const key='rock|'+kind+'|'+v;
  if(objCache[key]) return objCache[key];
  // ridisegnato a 64: il sasso è il 31% di una schermata di miniera, e
  // la roccia delle pareti è ridisegnata insieme a lui (render.js)
  const c=telaNetta(80,80), x=c.getContext('2d');
  const P = {
    pietra:  ['#8a8580','#a8a29a','#6b6762'],
    rame:    ['#8a7568','#b08a6a','#6b5a50'],
    ferro:   ['#8a8a92','#a8a8b2','#67676e'],
    oro:     ['#9a8a68','#c0a55a','#6f6450'],
    ametista:['#7a6a8a','#9a86b2','#5a4e6b'],
    quarzo:  ['#8a8a8a','#b8b8c0','#68686b'],
    geode:   ['#7a7268','#9a9088','#5e584f']
  }[kind] || ['#8a8580','#a8a29a','#6b6762'];
  const base=P[0], light=P[1], dark=P[2];
  ellip(x,40,64,28,10,'rgba(0,0,0,0.22)');
  // corpo
  ellip(x,40,48,26,20,dark);
  ellip(x,40,44,24,18,base);
  ellip(x,32,38,14,10,light);
  // sfaccettature
  x.fillStyle=dark;
  x.beginPath(); x.moveTo(16,48); x.lineTo(32,28); x.lineTo(40,52); x.closePath(); x.fill();
  x.fillStyle=shade(base,0.08);
  x.beginPath(); x.moveTo(40,52); x.lineTo(48,26); x.lineTo(62,48); x.closePath(); x.fill();
  /* Gli SPIGOLI delle sfaccettature, larghi un pixel. Sono la cosa che a
     32 non si poteva fare: un filo di luce da un pixel di disegno erano
     due a schermo, cioè una fascia, e un sasso con le fasce sembra un
     sasso di gomma. Con uno solo lo spigolo taglia, e le tre facce si
     staccano l'una dall'altra. */
  x.strokeStyle = shade(base,0.22); x.lineWidth = 1;
  x.beginPath(); x.moveTo(32,28); x.lineTo(40,52); x.stroke();
  x.beginPath(); x.moveTo(48,26); x.lineTo(40,52); x.stroke();
  x.strokeStyle = shade(dark,-0.12);
  x.beginPath(); x.moveTo(16,48); x.lineTo(32,28); x.stroke();
  // grana della pietra: puntinatura fine sul corpo
  for(let i=0;i<26;i++){
    const a = hsh(i,v,183)*6.283, r = hsh(i,v,184);
    const bx = (40 + Math.cos(a)*r*22)|0, byy = (44 + Math.sin(a)*r*15)|0;
    px(x,bx,byy,1,1, hsh(i,v,185)>0.5 ? shade(base,0.10) : shade(base,-0.12));
  }
  // vene di minerale
  if(kind!=='pietra'){
    const gem = {rame:'#e08a4a',ferro:'#d8dce8',oro:'#ffd24a',ametista:'#c98ae8',quarzo:'#eaf4ff',geode:'#8ac0d8'}[kind];
    /* Un cristallo, riga per riga: punta in cima, pancia in mezzo, e si
       chiude in basso. Provato prima come quadrato da cinque con dentro
       un quadrato chiaro da tre, ed erano adesivi — a 32 passava perché
       tre pixel non fanno una forma comunque, a 64 no. Le due facce
       stanno sulla stessa riga, non una dentro l'altra: è quello che lo
       fa sembrare tagliato invece che stampato. */
    const chiaro = shade(gem,0.28), scuro = shade(gem,-0.28);
    const righe = [[2,1],[1,4],[0,6],[0,6],[1,4],[2,2]];   // [scarto, larghezza]
    for(let i=0;i<5;i++){
      const bx=20+((hsh(i,v,181)*40)|0), byy=32+((hsh(i,v,182)*24)|0);
      x.globalAlpha=0.4; px(x,bx-1,byy-1,8,9,gem); x.globalAlpha=1;   // il bagliore
      righe.forEach(([off,w],r)=>{
        const mezzo = Math.max(1, w>>1);
        px(x, bx+off,       byy+r, mezzo,   1, chiaro);   // faccia in luce
        px(x, bx+off+mezzo, byy+r, w-mezzo, 1, scuro);    // faccia in ombra
      });
      px(x,bx+2,byy+1,1,1,shade(gem,0.55));              // il riflesso, un pixel
    }
  }
  objCache[key]=c; return c;
};

A.bush = function(season, v, bacche){
  const key='bush|'+season+'|'+v+'|'+!!bacche;
  if(objCache[key]) return objCache[key];
  // ridisegnato a 64 con l'albero: usa lo stesso `foliageBlob`, e
  // lasciarlo indietro voleva dire un cespuglio a bolle sotto una
  // chioma a foglie, che è proprio il confronto che si nota
  const c=telaNetta(80,72), x=c.getContext('2d');
  const S=DATA.SEASONS.find(s=>s.id===season);
  ellip(x,40,64,24,8,'rgba(0,0,0,0.2)');
  foliageBlob(x,28,44,20,S.tree,season);
  foliageBlob(x,52,46,20,S.tree,season);
  foliageBlob(x,40,34,22,S.tree,season);
  if(bacche) fruttoCespuglio(x, v, DATA.CESPUGLIO[season]);
  objCache[key]=c; return c;
};

/* Il cespuglio carico metteva sei pallini rossi in ogni stagione, ma
   d'estate dà more, d'autunno nocciole e di primavera viole: tre
   stagioni su quattro il cespuglio diceva una cosa e la falce ne dava
   un'altra. Qui disegna quello che dà, leggendo la stessa tabella. */
function fruttoCespuglio(x, v, item){
  if(item === 'viola'){
    /* Le viole non stanno sul ramo — «cresce all'ombra», dice la sua
       scheda — quindi spuntano sotto, ai piedi del cespuglio.

       Le posizioni sono distribuite a mano e il caso sposta solo di un
       pixel: lasciandole scegliere tutte all'hash finivano appiccicate
       da una parte sola e si leggevano come una macchia viola, non come
       cinque viole. */
    const posti = [[14,68],[26,62],[38,70],[54,64],[64,68]];
    for(let i=0;i<posti.length;i++){
      const bx  = posti[i][0] + ((hsh(i,v,193)*6)|0) - 2;
      const byy = posti[i][1] + ((hsh(i,v,194)*4)|0) - 2;
      px(x,bx,byy-8,1,8,'#4f8a32');                       // gambo, sottile davvero
      px(x,bx-3,byy-5,4,1,'#5f9c3c'); px(x,bx+1,byy-3,4,1,'#5f9c3c');  // foglioline
      for(let k=0;k<5;k++){ const a=k/5*6.28+0.78;
        px(x,(bx+Math.cos(a)*4)|0,(byy-12+Math.sin(a)*4)|0,3,3,'#8a5fc0'); }
      px(x,bx-1,byy-13,2,2,'#ffe270');                    // cuore giallo
    }
    return;
  }
  for(let i=0;i<9;i++){
    const bx=20+((hsh(i,v,191)*40)|0), byy=24+((hsh(i,v,192)*32)|0);
    if(item === 'mora'){
      // una mora è fatta a granelli: adesso ce ne stanno quattro
      px(x,bx,byy,5,5,'#3a2440');
      px(x,bx+1,byy+1,2,2,'#6a4a70'); px(x,bx+3,byy+3,2,2,'#6a4a70');
      px(x,bx+1,byy,1,1,'#8a6a90');
    } else if(item === 'nocciola'){
      px(x,bx,byy,5,5,'#a8763c'); px(x,bx,byy,5,2,'#c99a5e');
      px(x,bx,byy+4,5,1,'#7a5228'); px(x,bx+1,byy+1,1,1,'#e0c090');
    } else {
      px(x,bx,byy,5,5,'#c8324a'); px(x,bx+3,byy+3,2,2,'#8a1f30');
      px(x,bx+1,byy+1,2,2,'#f07a88');
    }
  }
}

A.weed = function(season,v){
  const aMano = vegSprite('erbaccia', '*', season);
  if(aMano) return aMano;
  const key='weed|'+season+'|'+v;
  if(objCache[key]) return objCache[key];
  const c=tela(32,32), x=c.getContext('2d');
  const S=DATA.SEASONS.find(s=>s.id===season);
  const col = season==='inverno' ? '#9aa8ae' : shade(S.grass,-0.12);
  const col2= shade(col,0.2);
  for(let i=0;i<7;i++){
    const bx=8+((hsh(i,v,201)*16)|0);
    const h=6+((hsh(i,v,202)*8)|0);
    const lean=(hsh(i,v,203)*4-2)|0;
    x.fillStyle = i%2?col:col2;
    for(let k=0;k<h;k++) x.fillRect(bx+((lean*k/h)|0), 26-k, 2, 1);
  }
  px(x,14,25,5,2,shade(col,-0.2));
  objCache[key]=c; return c;
};

A.forage = function(itemId, v){
  /* Il disegno a mano, se c'e. Come per la vegetazione: una variante
     sola, quindi i quattro `v` pescano la stessa cella. */
  const aMano = vegSprite('foraggio', itemId, null);
  if(aMano) return aMano;
  const key='for|'+itemId+'|'+v;
  if(objCache[key]) return objCache[key];
  const c=tela(32,32), x=c.getContext('2d');
  x.globalAlpha=0.2; ellip(x,16,27,7,3,'#000'); x.globalAlpha=1;
  drawForageArt(x,16,26,itemId);
  objCache[key]=c; return c;
};

function drawForageArt(x,cx,by,id){
  switch(id){
    case 'cipolla_selvatica':
      ellip(x,cx,by-4,5,5,'#e8e0d0'); ellip(x,cx-1,by-5,3,3,'#f8f4e8');
      px(x,cx-1,by-12,2,7,'#6fae3e'); px(x,cx-4,by-10,3,5,'#5f9c3c'); px(x,cx+2,by-11,3,6,'#7fbe4e');
      break;
    case 'dente_leone':
      px(x,cx-1,by-9,2,9,'#5f9c3c');
      circ(x,cx,by-11,5,'#ffe270'); circ(x,cx,by-11,3,'#f5c93c');
      for(let i=0;i<8;i++){const a=i/8*6.28; px(x,(cx+Math.cos(a)*6)|0,(by-11+Math.sin(a)*6)|0,2,2,'#ffd94f');}
      break;
    case 'viola':
      px(x,cx-1,by-8,2,8,'#4f8a32');
      for(let i=0;i<5;i++){const a=i/5*6.28-1.57; ellip(x,cx+Math.cos(a)*4,by-11+Math.sin(a)*4,3,2.6,'#8a5fc0');}
      circ(x,cx,by-11,2,'#ffe270');
      break;
    case 'mora':
      px(x,cx-1,by-7,2,7,'#5f7a3c');
      for(const p of [[-3,-9],[2,-11],[-1,-13],[3,-8]]) { circ(x,cx+p[0],by+p[1],2.6,'#3a2440'); px(x,cx+p[0]-1,by+p[1]-2,1,1,'#6a4a70'); }
      break;
    case 'erba_dolce':
      for(let i=0;i<5;i++){ const bx=cx-5+i*3; px(x,bx,by-4-i%2*3,2,8+i%2*3,'#8fc45a'); px(x,bx,by-12,2,3,'#ffe89a'); }
      break;
    case 'lavanda':
      for(let i=0;i<3;i++){ const bx=cx-3+i*3; px(x,bx,by-10,1,10,'#6f9c5a');
        for(let k=0;k<5;k++) px(x,bx-1,by-11-k*2,3,2, k%2?'#9a6fd0':'#8459bd'); }
      break;
    /* La roba di mare. Tinte chiare e fredde apposta: sullo scaffale
       dello zaino, in mezzo a viole e funghi, si devono riconoscere come
       un gruppo che viene da un altro posto. */
    case 'conchiglia':
      ellip(x,cx,by-5,9,7,'#f0dcc0'); ellip(x,cx,by-4,8,6,'#e2c9a6');
      for(let i=0;i<5;i++){ const a=-2.5+i*0.62;
        px(x,(cx+Math.cos(a)*6)|0,(by-5+Math.sin(a)*5)|0,2,2,'#c9a982'); }
      px(x,cx-1,by+1,3,2,'#b08f68');
      break;
    case 'tellina':
      ellip(x,cx-2,by-4,6,5,'#dfeef2'); ellip(x,cx+3,by-6,6,5,'#cfe2ea');
      px(x,cx-4,by-4,2,1,'#a8c2ce'); px(x,cx+2,by-6,2,1,'#a8c2ce');
      px(x,cx-1,by-3,2,2,'#f4fbfd');
      break;
    case 'granchio':
      ellip(x,cx,by-5,8,6,'#c9563c'); ellip(x,cx,by-6,7,4,'#e06f4e');
      for(const s of [-1,1]){
        px(x,cx+s*8,by-8,3,2,'#c9563c'); px(x,cx+s*10,by-10,3,3,'#e06f4e');
        for(let k=0;k<3;k++) px(x,cx+s*(5+k*2),by-1,2,3,'#b04a32');
      }
      px(x,cx-3,by-7,2,2,'#2a1a14'); px(x,cx+2,by-7,2,2,'#2a1a14');
      break;
    case 'fungo_porcino':
      px(x,cx-2,by-6,5,6,'#f0e2c8'); px(x,cx-2,by-6,2,6,'#fff8ea');
      ellip(x,cx,by-8,8,5,'#8a5230'); ellip(x,cx,by-9,7,4,'#a8683c'); ellip(x,cx-3,by-10,3,2,'#c08a56');
      break;
    case 'nocciola':
      for(const p of [[-3,-3],[3,-4],[0,-8]]){ ellip(x,cx+p[0],by+p[1],3.4,3,'#a8763c'); px(x,cx+p[0]-1,by+p[1]-2,2,1,'#c99a5e'); px(x,cx+p[0]-1,by+p[1]+1,3,1,'#7a5228'); }
      break;
    case 'melagrana':
      circ(x,cx,by-6,7,'#c0392b'); circ(x,cx-2,by-8,3,'#e05a45');
      px(x,cx-2,by-13,4,3,'#8a2a20'); px(x,cx-3,by-14,6,2,'#a03428');
      px(x,cx+3,by-4,2,2,'#8a2a20');
      break;
    case 'bacca_inverno':
      px(x,cx-1,by-8,2,8,'#5a6a5a');
      for(const p of [[-3,-9],[3,-10],[0,-13]]) { circ(x,cx+p[0],by+p[1],2.8,'#c8324a'); px(x,cx+p[0]-1,by+p[1]-2,1,1,'#f08a88'); }
      px(x,cx-6,by-7,5,2,'#4f7a52'); px(x,cx+2,by-6,5,2,'#4f7a52');
      break;
    case 'radice_gelata':
      ellip(x,cx,by-4,5,5,'#c8dae4'); ellip(x,cx-1,by-5,3,3,'#eaf4fa');
      px(x,cx-1,by-11,2,6,'#7f9c8a'); px(x,cx-4,by-9,3,4,'#8fac9a');
      break;
    case 'fiocco_cristallo':
      for(let i=0;i<6;i++){ const a=i/6*6.28;
        for(let k=2;k<8;k++) px(x,(cx+Math.cos(a)*k)|0,(by-8+Math.sin(a)*k)|0,2,2, k>5?'#bfe8f5':'#eafaff'); }
      circ(x,cx,by-8,3,'#ffffff');
      break;
    default:
      circ(x,cx,by-5,5,'#8fc45a');
  }
}
A.drawForageArt = drawForageArt;

/* ===================================================================
   5. EDIFICI
   =================================================================== */
/* Il tetto a tegole. `u` è quanti pixel di mondo vale un'unità del
   vecchio impaginato: le POSIZIONI arrivano già in pixel — le facciate
   le scalano prima di chiamare — ma la texture no, e la fila di tegole
   deve restare alta quanto era.

   Qui il ridisegno a 64 si vede in due posti: la scanalatura fra una
   tegola e l'altra resta larga UN pixel vero invece di essere scalata
   con tutto il resto, e la punta arrotondata della tegola adesso ha
   davvero una curva di due gradini invece di uno smusso solo. */
function shingleRoof(x, x0,y0,w,h, col, u){
  u = u||1;
  const d=shade(col,-0.26), dd=shade(col,-0.42), l=shade(col,0.16), ll=shade(col,0.3);
  const RH = Math.max(3, Math.round(4*u));   // altezza di una fila di tegole
  const passo = Math.max(4, Math.round(8*u));// quanto è larga una tegola
  const rows = Math.max(2, Math.round(h/RH));
  const topRatio = 0.46;              // larghezza in cima rispetto alla base
  for(let r=rows-1; r>=0; r--){
    const t  = r/(rows-1);            // 0 = base, 1 = colmo
    const rw = Math.round(w*(1-(1-topRatio)*t));
    const xx = Math.round(x0 + (w-rw)/2);
    const yy = y0 + Math.round(h - (r+1)*RH);
    const base = r%2 ? col : shade(col,-0.05);
    // fila di tegole
    px(x, xx, yy, rw, RH+1, base);
    px(x, xx, yy, rw, 1, l);                       // luce sul bordo alto
    px(x, xx, yy+RH, rw, 1, d);                    // ombra sotto
    // scanalature delle tegole, sfalsate
    const off = r%2 ? (passo>>1) : 0;
    for(let k=off; k<rw-1; k+=passo) px(x, xx+k, yy+1, 1, RH-1, d);
    // punte arrotondate delle tegole: due gradini, che a 32 non ci stavano
    for(let k=off; k<rw-3; k+=passo){
      const p = Math.max(2, Math.round(3*u));
      px(x, xx+k+2, yy+RH-1, p, 1, shade(base,0.10));
      px(x, xx+k+3, yy+RH-2, Math.max(1,p-2), 1, shade(base,0.16));
    }
  }
  // colmo
  const m2 = Math.max(1, Math.round(2*u)), m3 = Math.max(1, Math.round(3*u));
  const rwTop = Math.round(w*topRatio);
  const xTop = Math.round(x0+(w-rwTop)/2);
  px(x, xTop-m2, y0-m3, rwTop+m2*2, Math.round(4*u), shade(col,0.08));
  px(x, xTop-m2, y0-m3, rwTop+m2*2, 1, ll);
  px(x, xTop-m2, y0+m3-2, rwTop+m2*2, 1, dd);
  // gronda sporgente sopra i muri
  px(x, x0-m3, y0+h,      w+m3*2, m3, shade(col,-0.18));
  px(x, x0-m3, y0+h,      w+m3*2, 1, l);
  px(x, x0-m3-1, y0+h+m3, w+m3*2+2, m2, '#4a3220');
}

/* La finestra. Era quattordici unità di lato con la crociera larga due,
   cioè quattro pixel a schermo: una crociera da quattro su un vetro da
   ventiquattro è una finestra a scacchi. Adesso il riquadro si scala e
   la crociera resta larga due pixel VERI, che è l'unica misura in cui
   una crociera si legge come una crociera. */
function window4(x, wx, wy, lit, u){
  u = u||1;
  const S = Math.round(12*u);                 // il vetro
  const b = Math.max(1, Math.round(u));       // la cornice
  const cro = Math.max(2, Math.round(u));     // la crociera
  px(x,wx-b,wy-b,S+b*2,S+b*2,'#5a3f28');
  px(x,wx,wy,S,S, lit? '#ffd98a' : '#8fb4c8');
  if(lit){
    px(x,wx,wy,S,Math.round(4*u),'#ffe9b0');
    x.globalAlpha=0.35; px(x,wx-Math.round(3*u),wy-Math.round(3*u),S+Math.round(6*u),S+Math.round(6*u),'#ffcf6a'); x.globalAlpha=1;
  } else {
    px(x,wx,wy,S,Math.round(5*u),'#a8ccdc');
    px(x,wx+Math.round(7*u),wy+Math.round(6*u),Math.round(4*u),Math.round(5*u),'#b8d8e8');
  }
  px(x,wx+((S-cro)>>1),wy,cro,S,'#5a3f28');
  px(x,wx,wy+((S-cro)>>1),S,cro,'#5a3f28');
  px(x,wx-Math.round(2*u),wy+S-b,S+Math.round(4*u),Math.max(2,Math.round(2*u)),'#6b4a2e');
}

/* L'edificio disegnato a mano, se c'è.

   A differenza di terreni, minerali e abitanti qui non si ritaglia
   niente: un file, un edificio, e si restituisce l'immagine com'è.
   Non passa nemmeno da una cache di tele, perché non ce n'è da
   costruire — `IMG.prendi` torna sempre lo stesso oggetto Image.

   La notte non cambia il file — la luce delle finestre la disegna sopra
   `render.js` — ma il LIVELLO sì: casa tua ampliata è un'altra casa, con
   la falda in più e cinque finestre invece di due. Si cerca `tipo_liv` e
   si ripiega su `tipo`, così un livello che il disegno non ha tiene
   quello di prima invece di sparire — che è lo stesso patto di
   `IMG.prendi`, un gradino più in là. */
const CHIAVE_EDIFICIO = 'ed:';
A.edificio = function(kind, liv){
  if(!window.IMG || !window.DATA || !DATA.EDIFICI) return null;
  if(liv){
    const suo = A.datoEdificio(kind, liv);
    if(suo) { const i = IMG.prendi(CHIAVE_EDIFICIO + kind + '_' + liv); if(i) return i; }
  }
  if(!DATA.EDIFICI[kind]) return null;
  return IMG.prendi(CHIAVE_EDIFICIO + kind);
};

/* Quale voce di `DATA.EDIFICI` descrive quello che si vede davvero.
   Serve a chi disegna la luce e a chi accende le luci: il riquadro di
   una finestra della casa ampliata non c'entra niente con quello della
   casa base, e prenderlo dalla voce sbagliata mette una macchia calda
   sul muro. Torna null se non c'è disegno a mano, che è il segnale di
   lasciar perdere e usare la facciata in codice. */
const datiUniti = {};
A.datoEdificio = function(kind, liv){
  if(!window.DATA || !DATA.EDIFICI) return null;
  const k = kind + '_' + liv;
  if(liv && DATA.EDIFICI[k] && window.IMG && IMG.prendi(CHIAVE_EDIFICIO + k)){
    /* La variante EREDITA dalla base quello che non ridichiara: le
       quattro nicchie del Santuario stanno dove stanno a zero braci come
       a quattro, e scriverle cinque volte vuol dire vederle divergere al
       primo ritocco. Chi ha davvero un impaginato suo lo dichiara e
       vince — `casa_1` ha cinque finestre invece di due. L'unione si fa
       una volta sola: questa funzione la chiama il fotogramma. */
    if(!datiUniti[k]) datiUniti[k] = Object.assign({}, DATA.EDIFICI[kind]||{}, DATA.EDIFICI[k]);
    return datiUniti[k];
  }
  return DATA.EDIFICI[kind] || null;
};

/* LA ROVINA DI UN EDIFICIO.

   Non è un disegno nuovo: è QUELLO VERO, rotto. Si prende la facciata —
   quella disegnata a mano se è arrivata, se no quella in codice — le si
   toglie tutto sopra a una linea frastagliata, e quello che resta è il
   basamento con i monconi dei muri. Poi si smorza il colore e ci si
   fanno crescere sopra due ciuffi.

   È la strada giusta per una ragione precisa: il giocatore deve
   riconoscere COSA diventerà. Un rudere disegnato da zero sarebbe un
   rudere qualunque; questo è il pollaio che c'era, con le stesse
   proporzioni e gli stessi colori, e quando lo ricostruisci vedi che è
   lo stesso. Il taglio è frastagliato apposta: dritto si legge come uno
   sprite tagliato male, cioè come un difetto.

   Quando arriveranno due disegni veri — `rovina-pollaio.png` e
   `rovina-serra.png` — basta metterli in `DATA.EDIFICI` con quei nomi e
   questa funzione non viene più chiamata. */
const rovinaCache = {}, rovinaDaCui = {};
A.rovina = function(kind){
  const vero = A.edificio(kind) || A.building(kind, {});
  if(!vero) return null;
  /* La cache si ricorda DA QUALE immagine è nata: il PNG arriva qualche
     fotogramma dopo l'inizio, e una cache riempita prima terrebbe per
     sempre la rovina fatta col disegno in codice. È la stessa trappola
     delle icone. */
  if(rovinaCache[kind] && rovinaDaCui[kind] === vero) return rovinaCache[kind];
  const W0 = vero.width, H0 = vero.height;
  const H = Math.round(H0 * 0.46);
  const rotto = cv(W0, H0), rx = rotto.getContext('2d');
  rx.drawImage(vero, 0, 0);
  /* Il morso: tutto quello che sta sopra alla linea sparisce. La linea
     oscilla, con passi disuguali — a passo fisso viene una merlatura,
     che sembra un castello e non una rovina. */
  rx.globalCompositeOperation = 'destination-out';
  rx.beginPath();
  rx.moveTo(-4, -4);
  const base = H0 - H;
  for(let x2 = 0; x2 <= W0 + 12; x2 += 6 + ((hsh(x2, 3, 517) * 10) | 0)){
    rx.lineTo(x2, base + (hsh(x2, 7, 233) - 0.45) * H * 0.44);
  }
  rx.lineTo(W0 + 8, -4); rx.closePath(); rx.fill();
  /* E i buchi: un'asse che manca, un vetro saltato. Senza, il taglio si
     legge come uno sprite ritagliato male invece che come una cosa
     rotta — e uno sprite ritagliato male e' un difetto, non un
     racconto. Stanno nella meta' alta di quel che resta, perche' e' da
     li' che una cosa comincia a cedere. */
  for(let i = 0; i < 7; i++){
    const bx = W0 * (0.06 + hsh(i, 11, 611) * 0.86);
    const by = base + H * (0.05 + hsh(i, 12, 612) * 0.45);
    const bw = W0 * (0.04 + hsh(i, 13, 613) * 0.07);
    const bh = H  * (0.06 + hsh(i, 14, 614) * 0.12);
    rx.beginPath(); rx.ellipse(bx, by, bw, bh, 0, 0, 6.3); rx.fill();
  }
  rx.globalCompositeOperation = 'source-over';

  const c = cv(W0, H), x = c.getContext('2d');
  x.drawImage(rotto, 0, -(H0 - H));
  /* Abbandonato vuol dire scolorito, non grigio: `saturation` toglie
     tinta e lascia stare la luce, quindi il legno resta legno. */
  x.globalCompositeOperation = 'saturation';
  x.globalAlpha = 0.55; x.fillStyle = '#808080'; x.fillRect(0, 0, W0, H);
  x.globalCompositeOperation = 'multiply';
  x.globalAlpha = 0.22; x.fillStyle = '#7f8f6a'; x.fillRect(0, 0, W0, H);   // muschio
  /* E si rimette la maschera. Le due tinte qui sopra hanno un modo di
     fondersi, ma si compongono lo stesso come qualunque altro disegno:
     dove sotto non c'era niente, il riempimento resta. Senza questa
     riga la rovina si porta dietro il suo rettangolo grigio, che a
     schermo si vede benissimo — misurato guardandolo. */
  x.globalCompositeOperation = 'destination-in';
  x.globalAlpha = 1;
  x.drawImage(rotto, 0, -(H0 - H));
  x.globalCompositeOperation = 'source-over';
  /* E l'erba che se l'è ripresa: davanti al basamento, dove il disegno
     finisce, così la rovina non poggia su un bordo netto. */
  for(let i = 0; i < 22; i++){
    const gx = (hsh(i, 1, 401) * W0) | 0;
    const gh = 5 + ((hsh(i, 2, 402) * 9) | 0);
    const gy = H - 2 - ((hsh(i, 3, 403) * 5) | 0);
    const col = hsh(i, 4, 404) > 0.5 ? '#5f8a3c' : '#4a7030';
    px(x, gx, gy - gh, 2, gh, col);
    px(x, gx + 2, gy - (gh >> 1), 2, gh >> 1, col);
  }
  rovinaCache[kind] = c; rovinaDaCui[kind] = vero;
  return c;
};

A.building = function(kind, opt){
  opt = opt||{};
  const key='b|'+kind+'|'+(opt.lit?1:0)+'|'+(opt.season||'')+'|'+(opt.liv||0);
  if(objCache[key]) return objCache[key];
  let c;
  switch(kind){
    case 'casa':      c = bCasa(opt); break;
    case 'bottega':   c = bBottega(opt); break;
    case 'fucina':    c = bFucina(opt); break;
    case 'locanda':   c = bLocanda(opt); break;
    case 'cottage':   c = bCottage(opt); break;
    case 'santuario': c = bSantuario(opt); break;
    case 'pollaio':   c = bPollaio(opt); break;
    case 'serra':     c = bSerra(opt); break;
    case 'capanna':   c = bCapanna(opt); break;
    /* Le rovine passano di qui e non da un ramo loro: cosi' chiunque
       chieda un edificio per nome — il renderer, l'ombra, il controllo
       sulle proporzioni in world.js — le trova senza sapere che sono
       fatte in un altro modo. */
    case 'rovina_pollaio': return A.rovina('pollaio');
    case 'rovina_serra':   return A.rovina('serra');
    default:          c = bCasa(opt);
  }
  objCache[key]=c;
  return c;
};

/* I muri, il tetto, le finestre e le porte degli edifici.

   Ricevono misure già in pixel di mondo — le facciate le scalano prima
   di chiamarli — ma la loro TEXTURE ha misure sue: l'altezza di una fila
   di tegole, il passo dei corsi di intonaco, la larghezza di un'anta.
   Quelle arrivano in , che è quanti pixel vale un'unità del vecchio
   impaginato.

   E qui c'è il guadagno del ridisegno a 64: le RIGHE restano larghe un
   pixel vero invece di essere scalate con tutto il resto. Un giunto fra
   due corsi di pietra largo un pixel è un giunto; largo due è una fuga,
   e a schermo si legge come piastrelle da bagno. */
function baseWalls(x, x0,y0,w,h, wall, u){
  u = u||1;
  const wd=shade(wall,-0.2), wl=shade(wall,0.12);
  px(x,x0,y0,w,h,wall);
  const passo = Math.max(3, Math.round(8*u));
  for(let r=0;r*passo<h;r++){
    px(x,x0,y0+r*passo,w,1,wd);            // un pixel vero, non due
    px(x,x0,y0+r*passo+1,w,1,wl);
  }
  const bordo = Math.max(1, Math.round(2*u));
  px(x,x0,y0,bordo,h,wl); px(x,x0+w-bordo,y0,bordo,h,wd);
  const zoccolo = Math.max(2, Math.round(3*u));
  px(x,x0,y0+h-zoccolo,w,zoccolo,shade(wall,-0.3));
}

function door(x, dx, dy, w, h, col, opt, u){
  u = u||1;
  const d=shade(col,-0.25), l=shade(col,0.14);
  const b = Math.max(1, Math.round(2*u));
  const passo = Math.max(4, Math.round(7*u));
  px(x,dx-b,dy-b,w+b*2,b,'#4a3220');
  px(x,dx,dy,w,h,col);
  px(x,dx,dy,b,h,l); px(x,dx+w-b,dy,b,h,d);
  px(x,dx,dy,w,b,l);
  /* La fuga fra due assi resta larga UN pixel: era una unità, cioè due
     a schermo, e una porta con le fughe da due sembra fatta di doghe
     staccate invece che di assi accostate. Accanto ci va il filo di
     luce, che è il taglio dell'asse vicina. */
  for(let k=Math.round(4*u); k<w-1; k+=passo){
    px(x,dx+k,dy+b,1,h-b-1,d);
    px(x,dx+k+1,dy+b,1,h-b-1,l);
  }
  const mn = Math.max(2, Math.round(3*u));
  px(x,dx+w-Math.round(6*u),dy+h/2,mn,mn,'#e8c25a');   // maniglia
  if(opt&&opt.arco){
    px(x,dx-1,dy-Math.round(4*u),w+2,Math.round(4*u),col);
    px(x,dx+Math.round(2*u),dy-Math.round(6*u),w-Math.round(4*u),Math.round(3*u),col);
  }
}

function sign(x, sx, sy, testo, col){
  px(x,sx+8,sy,3,10,'#6b4a2e');
  px(x,sx,sy-14,20,15,col||'#8a5a34');
  px(x,sx,sy-14,20,2,shade(col||'#8a5a34',0.2));
  px(x,sx+1,sy-13,18,13,shade(col||'#8a5a34',-0.12));
  px(x,sx+3,sy-10,14,2,'#e8d8b0');
  px(x,sx+3,sy-6,10,2,'#e8d8b0');
}

function bCasa(o){
  const W=448, H=392, c=telaNetta(W,H), x=c.getContext('2d');
  const u = W/192;                       // pixel di mondo per unità dell'impaginato
  const s = n => Math.round(n*u);
  const liv = o.liv||0;
  const wall='#d8c49a', roof= liv>0? '#7a4f8a' : '#b04a3c';
  // ombra
  x.globalAlpha=0.22; ellip(x,s((W/u)/2),s((H/u)-8),s(74),s(12),'#000'); x.globalAlpha=1;
  // base
  baseWalls(x, s(26), s(62), s((26)+(140))-s(26), s((62)+(96))-s(62), wall, u);
  // fondamenta pietra
  px(x,s(22),s(146),s((22)+(148))-s(22),s((146)+(14))-s(146),'#7d766c');
  for(let k=0;k<148;k+=14){ px(x,s(22+k),s(146),s((22+k)+(13))-s(22+k),s((146)+(6))-s(146),'#8d867c'); px(x,s(22+k+7),s(152),s((22+k+7)+(13))-s(22+k+7),s((152)+(6))-s(152),'#8d867c'); }
  // tetto
  shingleRoof(x, s(8), s(22), s((8)+(176))-s(8), s((22)+(44))-s(22), roof, u);
  px(x,s(8),s(62),s((8)+(176))-s(8),s((62)+(5))-s(62),shade(roof,-0.35));
  px(x,s(4),s(64),s((4)+(184))-s(4),s((64)+(4))-s(64),'#5a3f28');
  // comignolo
  px(x,s(132),s(4),s((132)+(22))-s(132),s((4)+(34))-s(4),'#8a6a58');
  px(x,s(132),s(4),s((132)+(22))-s(132),s((4)+(4))-s(4),'#a08272');
  for(let r=0;r<4;r++) px(x,s(132),s(10+r*7),s((132)+(22))-s(132),s((10+r*7)+(1))-s(10+r*7),'#6f5346');
  px(x,s(128),s(0),s((128)+(30))-s(128),s((0)+(7))-s(0),'#6f5346');
  // finestre & porta
  window4(x, s(46), s(86), o.lit, u);
  window4(x, s(128), s(86), o.lit, u);
  door(x, s(82), s(108), s((82)+(30))-s(82), s((108)+(50))-s(108), '#7a4f30', {arco:true}, u);
  // dettagli
  px(x,s(78),s(104),s((78)+(38))-s(78),s((104)+(4))-s(104),'#5a3f28');           // architrave
  px(x,s(74),s(158),s((74)+(46))-s(74),s((158)+(4))-s(158),'#8d867c');           // gradino
  // fioriere
  for(const fx of [44,126]){
    px(x,s(fx-3),s(116),s((fx-3)+(20))-s(fx-3),s((116)+(8))-s(116),'#7a5636');
    px(x,s(fx-3),s(116),s((fx-3)+(20))-s(fx-3),s((116)+(2))-s(116),'#96704a');
    for(let i=0;i<4;i++){
      px(x,s(fx+i*4),s(110),s((fx+i*4)+(3))-s(fx+i*4),s((110)+(7))-s(110),'#5f9c3c');
      px(x,s(fx+i*4-1),s(108),s((fx+i*4-1)+(4))-s(fx+i*4-1),s((108)+(3))-s(108), i%2?'#e8687a':'#f0c04a');
    }
  }
  if(liv>0){ // ampliamento: veranda
    px(x,s(10),s(120),s((10)+(18))-s(10),s((120)+(40))-s(120),'#c9b48c');
    shingleRoof(x, s(4), s(108), s((4)+(32))-s(4), s((108)+(16))-s(108), roof, u);
  }
  return c;
}

function bBottega(o){
  const W=448, H=374, c=telaNetta(W,H), x=c.getContext('2d');
  const u = W/192;                       // pixel di mondo per unità dell'impaginato
  const s = n => Math.round(n*u);
  x.globalAlpha=0.22; ellip(x,s((W/u)/2),s((H/u)-8),s(72),s(11),'#000'); x.globalAlpha=1;
  baseWalls(x, s(20), s(56), s((20)+(152))-s(20), s((56)+(96))-s(56), '#e0d0a8', u);
  shingleRoof(x, s(6), s(18), s((6)+(180))-s(6), s((18)+(40))-s(18), '#3f7a6a', u);
  px(x,s(6),s(56),s((6)+(180))-s(6),s((56)+(5))-s(56),'#2a5548');
  // tendone a righe
  for(let k=0;k<9;k++){
    px(x, s(24+k*17), s(76), s((24+k*17)+(17))-s(24+k*17), s((76)+(16))-s(76), k%2? '#d84f4f':'#f2e8d0');
  }
  px(x,s(22),s(74),s((22)+(154))-s(22),s((74)+(3))-s(74),'#8a5a34');
  for(let k=0;k<9;k++) px(x, s(24+k*17), s(90), s((24+k*17)+(17))-s(24+k*17), s((90)+(4))-s(90), k%2? '#b03d3d':'#d8ceb4');
  // vetrina
  px(x,s(32),s(96),s((32)+(56))-s(32),s((96)+(40))-s(96),'#5a3f28');
  px(x,s(35),s(99),s((35)+(50))-s(35),s((99)+(34))-s(99), o.lit?'#ffdc94':'#a8ccdc');
  px(x,s(35),s(99),s((35)+(50))-s(35),s((99)+(10))-s(99), o.lit?'#ffe9b8':'#c0dcea');
  // barattoli in vetrina
  for(let i=0;i<4;i++){
    px(x,s(40+i*12),s(116),s((40+i*12)+(8))-s(40+i*12),s((116)+(14))-s(116),'#8a6a4a');
    px(x,s(40+i*12),s(113),s((40+i*12)+(8))-s(40+i*12),s((113)+(4))-s(113), ['#d8624a','#7fae4a','#e0b03c','#8a5fc0'][i]);
  }
  door(x, s(110), s(100), s((110)+(34))-s(110), s((100)+(52))-s(100), '#6b4a2e', null, u);
  px(x,s(106),s(96),s((106)+(42))-s(106),s((96)+(5))-s(96),'#4a3220');

  // insegna appesa a un braccio di ferro accanto alla porta
  px(x,s(152),s(96),s((152)+(4))-s(152),s((96)+(3))-s(96),'#4a4640');
  px(x,s(152),s(96),s((152)+(26))-s(152),s((96)+(3))-s(96),'#4a4640');
  px(x,s(176),s(96),s((176)+(3))-s(176),s((96)+(7))-s(96),'#4a4640');
  px(x,s(158),s(98),s((158)+(3))-s(158),s((98)+(5))-s(98),'#4a4640');
  px(x,s(160),s(102),s((160)+(22))-s(160),s((102)+(20))-s(102),'#7a4f30');
  px(x,s(160),s(102),s((160)+(22))-s(160),s((102)+(2))-s(102),'#96683f');
  px(x,s(161),s(103),s((161)+(20))-s(161),s((103)+(18))-s(103),'#8a5a34');
  // pittogramma: una mela e una spiga
  circ(x,s(168),s(110),s(4),'#c0392b'); px(x,s(167),s(105),s((167)+(2))-s(167),s((105)+(3))-s(105),'#5f8a3c');
  px(x,s(175),s(106),s((175)+(2))-s(175),s((106)+(11))-s(106),'#c9a44c');
  for(let k=0;k<4;k++){ px(x,s(173),s(107+k*3),s((173)+(2))-s(173),s((107+k*3)+(2))-s(107+k*3),'#e0bd76'); px(x,s(177),s(107+k*3),s((177)+(2))-s(177),s((107+k*3)+(2))-s(107+k*3),'#e0bd76'); }
  px(x,s(162),s(118),s((162)+(18))-s(162),s((118)+(2))-s(118),'#5f3f24');
  // cassette di verdura fuori
  for(let i=0;i<2;i++){
    const bx=152+i*0, by=132;
    px(x,s(bx),s(by),s((bx)+(26))-s(bx),s((by)+(18))-s(by),'#a8763c'); px(x,s(bx),s(by),s((bx)+(26))-s(bx),s((by)+(3))-s(by),'#c99a5e');
    for(let k=0;k<3;k++) circ(x,s(bx+6+k*7),s(by+2),s(4), ['#d8452c','#e8892c','#7fc45a'][k]);
  }
  return c;
}

function bFucina(o){
  const W=384, H=350, c=telaNetta(W,H), x=c.getContext('2d');
  const u = W/176;                       // pixel di mondo per unità dell'impaginato
  const s = n => Math.round(n*u);
  x.globalAlpha=0.22; ellip(x,s((W/u)/2),s((H/u)-8),s(66),s(11),'#000'); x.globalAlpha=1;
  // muri di pietra
  px(x,s(24),s(60),s((24)+(128))-s(24),s((60)+(92))-s(60),'#8a8078');
  for(let r=0;r<12;r++) for(let k=0;k<9;k++){
    const bx=24+k*14+(r%2?7:0), by=60+r*8;
    if(bx>144) continue;
    const col = hsh(k,r,211)>0.5?'#948a80':'#7f766e';
    px(x,s(bx),s(by),s((bx)+(13))-s(bx),s((by)+(7))-s(by),col); px(x,s(bx),s(by),s((bx)+(13))-s(bx),s((by)+(1))-s(by),shade(col,0.16));
  }
  px(x,s(24),s(148),s((24)+(128))-s(24),s((148)+(6))-s(148),'#5f5852');
  shingleRoof(x, s(10), s(24), s((10)+(156))-s(10), s((24)+(38))-s(24), '#5a5f6b', u);
  px(x,s(10),s(60),s((10)+(156))-s(10),s((60)+(5))-s(60),'#3a3f48');
  // forgia con fuoco
  px(x,s(36),s(96),s((36)+(44))-s(36),s((96)+(52))-s(96),'#5f5852');
  px(x,s(42),s(104),s((42)+(32))-s(42),s((104)+(32))-s(104),'#2a1a12');
  const fireC = o.lit? ['#ff9a3c','#ffd24a','#ff5a2c'] : ['#c05a2c','#e08a3c','#a03a1c'];
  ellip(x,s(58),s(128),s(14),s(9),fireC[2]);
  ellip(x,s(58),s(130),s(11),s(7),fireC[0]);
  ellip(x,s(58),s(132),s(7),s(5),fireC[1]);
  x.globalAlpha=0.3; ellip(x,s(58),s(126),s(20),s(16),'#ff9a3c'); x.globalAlpha=1;
  // canna fumaria
  px(x,s(44),s(24),s((44)+(26))-s(44),s((24)+(74))-s(24),'#6f6660'); px(x,s(44),s(24),s((44)+(26))-s(44),s((24)+(4))-s(24),'#8a8078');
  px(x,s(40),s(18),s((40)+(34))-s(40),s((18)+(8))-s(18),'#5f5852');
  // incudine
  px(x,s(96),s(124),s((96)+(28))-s(96),s((124)+(10))-s(124),'#4a4a52'); px(x,s(102),s(116),s((102)+(16))-s(102),s((116)+(10))-s(116),'#5a5a64');
  px(x,s(102),s(114),s((102)+(16))-s(102),s((114)+(3))-s(114),'#6f6f7a'); px(x,s(92),s(132),s((92)+(36))-s(92),s((132)+(6))-s(132),'#3a3a42');
  door(x, s(108), s(96), s((108)+(32))-s(108), s((96)+(52))-s(96), '#5a4030', null, u);
  // attrezzi appesi
  px(x,s(150),s(80),s((150)+(4))-s(150),s((80)+(26))-s(80),'#6b4a2e'); px(x,s(144),s(76),s((144)+(16))-s(144),s((76)+(8))-s(76),'#8a8a92');
  px(x,s(164),s(84),s((164)+(4))-s(164),s((84)+(22))-s(84),'#6b4a2e'); px(x,s(160),s(80),s((160)+(12))-s(160),s((80)+(8))-s(80),'#8a8a92');
  return c;
}

function bLocanda(o){
  const W=512, H=434, c=telaNetta(W,H), x=c.getContext('2d');
  const u = W/208;                       // pixel di mondo per unità dell'impaginato
  const s = n => Math.round(n*u);
  x.globalAlpha=0.22; ellip(x,s((W/u)/2),s((H/u)-8),s(80),s(12),'#000'); x.globalAlpha=1;
  // piano terra
  baseWalls(x, s(20), s(92), s((20)+(168))-s(20), s((92)+(76))-s(92), '#e8d4a8', u);
  // travi a vista
  for(let k=0;k<6;k++) px(x, s(24+k*28), s(92), s((24+k*28)+(5))-s(24+k*28), s((92)+(76))-s(92), '#7a5636');
  px(x,s(20),s(92),s((20)+(168))-s(20),s((92)+(5))-s(92),'#7a5636'); px(x,s(20),s(140),s((20)+(168))-s(20),s((140)+(5))-s(140),'#7a5636');
  // primo piano sporgente
  baseWalls(x, s(12), s(46), s((12)+(184))-s(12), s((46)+(48))-s(46), '#dcc79c', u);
  px(x,s(8),s(88),s((8)+(192))-s(8),s((88)+(6))-s(88),'#7a5636');
  for(let k=0;k<7;k++) px(x, s(16+k*26), s(46), s((16+k*26)+(5))-s(16+k*26), s((46)+(48))-s(46), '#7a5636');
  shingleRoof(x, s(2), s(8), s((2)+(204))-s(2), s((8)+(40))-s(8), '#8a4a3c', u);
  px(x,s(2),s(46),s((2)+(204))-s(2),s((46)+(5))-s(46),'#5f3228');
  // finestre piano alto
  window4(x, s(40), s(58), o.lit, u); window4(x, s(96), s(58), o.lit, u); window4(x, s(152), s(58), o.lit, u);
  // finestre a arco piano terra
  for(const wx of [40,140]){
    px(x,s(wx-2),s(104),s((wx-2)+(32))-s(wx-2),s((104)+(30))-s(104),'#5a3f28');
    px(x,s(wx+1),s(107),s((wx+1)+(26))-s(wx+1),s((107)+(24))-s(107), o.lit?'#ffd98a':'#8fb4c8');
    px(x,s(wx+1),s(107),s((wx+1)+(26))-s(wx+1),s((107)+(8))-s(107), o.lit?'#ffe9b0':'#a8ccdc');
    px(x,s(wx+12),s(107),s((wx+12)+(3))-s(wx+12),s((107)+(24))-s(107),'#5a3f28');
  }
  door(x, s(88), s(116), s((88)+(34))-s(88), s((116)+(52))-s(116), '#6b4230', {arco:true}, u);
  px(x,s(84),s(112),s((84)+(42))-s(84),s((112)+(5))-s(112),'#4a3220');
  // insegna appesa
  px(x,s(150),s(20),s((150)+(4))-s(150),s((20)+(26))-s(20),'#5a3f28'); px(x,s(150),s(20),s((150)+(40))-s(150),s((20)+(4))-s(20),'#5a3f28');
  px(x,s(168),s(24),s((168)+(34))-s(168),s((24)+(26))-s(24),'#7a4f30');
  px(x,s(170),s(26),s((170)+(30))-s(170),s((26)+(22))-s(26),'#96683f');
  ellip(x,s(185),s(36),s(9),s(8),'#c9a05a'); px(x,s(181),s(32),s((181)+(4))-s(181),s((32)+(4))-s(32),'#3a2a1c'); px(x,s(188),s(32),s((188)+(4))-s(188),s((32)+(4))-s(32),'#3a2a1c');
  px(x,s(183),s(40),s((183)+(6))-s(183),s((40)+(2))-s(40),'#3a2a1c');
  // tavolini fuori
  for(let i=0;i<2;i++){
    const bx=16+i*164;
    ellip(x,s(bx),s(158),s(12),s(5),'#8a5a34'); px(x,s(bx-2),s(158),s((bx-2)+(4))-s(bx-2),s((158)+(10))-s(158),'#6b4a2e');
    px(x,s(bx-8),s(150),s((bx-8)+(4))-s(bx-8),s((150)+(3))-s(150),'#c9a05a');
  }
  return c;
}

function bCottage(o){
  const W=320, H=302, c=telaNetta(W,H), x=c.getContext('2d');
  const u = W/144;                       // pixel di mondo per unità dell'impaginato
  const s = n => Math.round(n*u);
  x.globalAlpha=0.22; ellip(x,s((W/u)/2),s((H/u)-6),s(54),s(9),'#000'); x.globalAlpha=1;
  baseWalls(x, s(20), s(56), s((20)+(104))-s(20), s((56)+(72))-s(56), o.wall||'#cbb68e', u);
  // tetto di paglia
  const straw='#c9a44c';
  for(let r=0;r<7;r++){
    const yy=20+r*6, inset=Math.round(r*3.4);
    px(x, s(6+inset), s(yy), s((6+inset)+(132-inset*2))-s(6+inset), s((yy)+(7))-s(yy), r%2?straw:shade(straw,-0.08));
    for(let k=0;k<132-inset*2;k+=5) px(x, s(6+inset+k+(r%2?2:0)), s(yy+1), s((6+inset+k+(r%2?2:0))+(2))-s(6+inset+k+(r%2?2:0)), s((yy+1)+(6))-s(yy+1), shade(straw,-0.22));
    px(x, s(6+inset), s(yy), s((6+inset)+(132-inset*2))-s(6+inset), s((yy)+(1))-s(yy), shade(straw,0.2));
  }
  px(x,s(4),s(56),s((4)+(136))-s(4),s((56)+(6))-s(56),shade(straw,-0.3));
  window4(x, s(34), s(76), o.lit, u);
  window4(x, s(96), s(76), o.lit, u);
  door(x, s(60), s(92), s((60)+(26))-s(60), s((92)+(36))-s(92), '#6b4a2e', {arco:true}, u);
  // erbe appese
  for(let i=0;i<4;i++){
    const bx=28+i*22;
    px(x,s(bx),s(58),s((bx)+(2))-s(bx),s((58)+(10))-s(58),'#7a5636');
    px(x,s(bx-3),s(66),s((bx-3)+(8))-s(bx-3),s((66)+(10))-s(66), ['#8a5fc0','#5f9c3c','#c9a05a','#8fc45a'][i]);
  }
  // vasi
  px(x,s(14),s(116),s((14)+(14))-s(14),s((116)+(12))-s(116),'#a8663c'); px(x,s(14),s(116),s((14)+(14))-s(14),s((116)+(3))-s(116),'#c98a5e');
  for(let i=0;i<3;i++){ px(x,s(17+i*4),s(108),s((17+i*4)+(2))-s(17+i*4),s((108)+(9))-s(108),'#5f9c3c'); px(x,s(16+i*4),s(105),s((16+i*4)+(4))-s(16+i*4),s((105)+(4))-s(105),'#8a5fc0'); }
  return c;
}

function bSantuario(o){
  const W=384, H=384, c=telaNetta(W,H), x=c.getContext('2d');
  const u = W/176;                       // pixel di mondo per unità dell'impaginato
  const s = n => Math.round(n*u);
  const acceso = o.liv||0;   // 0..4 braci accese
  x.globalAlpha=0.24; ellip(x,s((W/u)/2),s((H/u)-10),s(64),s(12),'#000'); x.globalAlpha=1;
  // basamento a gradini
  for(let i=0;i<3;i++){
    px(x, s(24+i*8), s(150-i*8), s((24+i*8)+(128-i*16))-s(24+i*8), s((150-i*8)+(10))-s(150-i*8), i%2?'#8d867c':'#7d766c');
    px(x, s(24+i*8), s(150-i*8), s((24+i*8)+(128-i*16))-s(24+i*8), s((150-i*8)+(2))-s(150-i*8), '#9d968c');
  }
  // colonne
  for(const cx0 of [36,124]){
    px(x,s(cx0),s(58),s((cx0)+(16))-s(cx0),s((58)+(72))-s(58),'#b0a898');
    px(x,s(cx0),s(58),s((cx0)+(4))-s(cx0),s((58)+(72))-s(58),'#c9c1b0');
    px(x,s(cx0+12),s(58),s((cx0+12)+(4))-s(cx0+12),s((58)+(72))-s(58),'#8e877a');
    px(x,s(cx0-4),s(54),s((cx0-4)+(24))-s(cx0-4),s((54)+(8))-s(54),'#c0b8a8');
    px(x,s(cx0-4),s(126),s((cx0-4)+(24))-s(cx0-4),s((126)+(8))-s(126),'#c0b8a8');
    for(let k=0;k<6;k++) px(x,s(cx0+2),s(64+k*11),s((cx0+2)+(12))-s(cx0+2),s((64+k*11)+(1))-s(64+k*11),'#9a9284');
  }
  // architrave + frontone
  px(x,s(24),s(42),s((24)+(128))-s(24),s((42)+(14))-s(42),'#c0b8a8');
  px(x,s(24),s(42),s((24)+(128))-s(24),s((42)+(3))-s(42),'#d8d0c0');
  x.fillStyle='#b0a898';
  x.beginPath(); x.moveTo(s(20),s(42)); x.lineTo(s(88),s(10)); x.lineTo(s(156),s(42)); x.closePath(); x.fill();
  x.fillStyle='#c9c1b0';
  x.beginPath(); x.moveTo(s(24),s(40)); x.lineTo(s(88),s(14)); x.lineTo(s(152),s(40)); x.closePath(); x.fill();
  // rilievo: sole
  circ(x,s(88),s(32),s(7),'#b8a068');
  for(let i=0;i<8;i++){ const a=i/8*6.28; px(x,s((88+Math.cos(a)*11)|0),s((32+Math.sin(a)*11)|0),s(((88+Math.cos(a)*11)|0)+(3))-s((88+Math.cos(a)*11)|0),s(((32+Math.sin(a)*11)|0)+(3))-s((32+Math.sin(a)*11)|0),'#b8a068'); }
  // edera
  for(let i=0;i<14;i++){
    const bx=28+((hsh(i,0,221)*120)|0), by=46+((hsh(i,1,222)*90)|0);
    x.globalAlpha=0.75; px(x,s(bx),s(by),s((bx)+(4))-s(bx),s((by)+(3))-s(by),'#5f8a4a'); px(x,s(bx+1),s(by-2),s((bx+1)+(2))-s(bx+1),s((by-2)+(2))-s(by-2),'#7fae5a'); x.globalAlpha=1;
  }
  // piedistallo lanterna
  px(x,s(76),s(110),s((76)+(24))-s(76),s((110)+(32))-s(110),'#8e877a'); px(x,s(76),s(110),s((76)+(24))-s(76),s((110)+(3))-s(110),'#a8a094');
  px(x,s(72),s(106),s((72)+(32))-s(72),s((106)+(6))-s(106),'#a8a094');
  // la lanterna
  const lc = acceso>=4 ? '#ffe9a8' : (acceso>0? '#e8c47a':'#5f5a52');
  px(x,s(80),s(84),s((80)+(16))-s(80),s((84)+(24))-s(84),'#6b5a44');
  px(x,s(82),s(86),s((82)+(12))-s(82),s((86)+(20))-s(86), acceso>0? lc : '#2f2a24');
  px(x,s(78),s(80),s((78)+(20))-s(78),s((80)+(5))-s(80),'#8a7458');
  px(x,s(84),s(74),s((84)+(4))-s(84),s((74)+(7))-s(74),'#8a7458');
  px(x,s(80),s(106),s((80)+(16))-s(80),s((106)+(4))-s(106),'#8a7458');
  if(acceso>0){
    const glow = 0.12+acceso*0.13;
    x.globalAlpha=glow; circ(x,s(88),s(96),s(34),'#ffd98a'); x.globalAlpha=glow*0.6; circ(x,s(88),s(96),s(52),'#ffcf6a'); x.globalAlpha=1;
  }
  // quattro nicchie per le braci
  const bc=['#8fd46a','#f7c744','#e08a3c','#9fd8ee'];
  for(let i=0;i<4;i++){
    const bx=40+i*24, by=134;
    px(x,s(bx),s(by),s((bx)+(16))-s(bx),s((by)+(14))-s(by),'#7d766c'); px(x,s(bx+2),s(by+2),s((bx+2)+(12))-s(bx+2),s((by+2)+(10))-s(by+2),'#3a3630');
    if(acceso>i){
      ellip(x,s(bx+8),s(by+8),s(5),s(5),bc[i]);
      x.globalAlpha=0.5; circ(x,s(bx+8),s(by+7),s(9),bc[i]); x.globalAlpha=1;
      px(x,s(bx+7),s(by+3),s((bx+7)+(2))-s(bx+7),s((by+3)+(3))-s(by+3),shade(bc[i],0.4));
    }
  }
  return c;
}

function bPollaio(o){
  const W=320, H=272, c=telaNetta(W,H), x=c.getContext('2d');
  const u = W/160;                       // pixel di mondo per unità dell'impaginato
  const s = n => Math.round(n*u);
  x.globalAlpha=0.22; ellip(x,s((W/u)/2),s((H/u)-6),s(60),s(10),'#000'); x.globalAlpha=1;
  baseWalls(x, s(22), s(60), s((22)+(116))-s(22), s((60)+(68))-s(60), '#d8bd8a', u);
  shingleRoof(x, s(8), s(24), s((8)+(144))-s(8), s((24)+(36))-s(24), '#b0563c', u);
  px(x,s(8),s(60),s((8)+(144))-s(8),s((60)+(5))-s(60),'#7a3628');
  // porticina gallinacea
  px(x,s(36),s(98),s((36)+(22))-s(36),s((98)+(30))-s(98),'#5a3f28'); px(x,s(39),s(101),s((39)+(16))-s(39),s((101)+(27))-s(101),'#2a1a12');
  px(x,s(32),s(128),s((32)+(30))-s(32),s((128)+(4))-s(128),'#8a6a48');
  // rampa
  px(x,s(30),s(128),s((30)+(34))-s(30),s((128)+(4))-s(128),'#a8763c');
  for(let k=0;k<5;k++) px(x,s(32+k*7),s(126),s((32+k*7)+(4))-s(32+k*7),s((126)+(2))-s(126),'#8a5a34');
  window4(x, s(92), s(78), o.lit, u);
  // banderuola
  px(x,s(78),s(8),s((78)+(2))-s(78),s((8)+(18))-s(8),'#5f5852');
  px(x,s(72),s(10),s((72)+(16))-s(72),s((10)+(3))-s(10),'#5f5852');
  x.fillStyle='#5f5852';
  x.beginPath(); x.moveTo(s(80),s(4)); x.lineTo(s(94),s(10)); x.lineTo(s(80),s(16)); x.closePath(); x.fill();
  // paglia a terra
  for(let i=0;i<16;i++){
    const bx=20+((hsh(i,0,231)*120)|0);
    px(x,s(bx),s(128+((hsh(i,1,232)*4)|0)),s((bx)+(4))-s(bx),s((128+((hsh(i,1,232)*4)|0))+(1))-s(128+((hsh(i,1,232)*4)|0)),'#d8b96a');
  }
  return c;
}

function bSerra(o){
  const W=384, H=320, c=telaNetta(W,H), x=c.getContext('2d');
  const u = W/192;                       // pixel di mondo per unità dell'impaginato
  const s = n => Math.round(n*u);
  x.globalAlpha=0.22; ellip(x,s((W/u)/2),s((H/u)-8),s(72),s(11),'#000'); x.globalAlpha=1;
  // basamento
  px(x,s(16),s(132),s((16)+(160))-s(16),s((132)+(24))-s(132),'#8d867c');
  for(let k=0;k<160;k+=16){ px(x,s(16+k),s(132),s((16+k)+(15))-s(16+k),s((132)+(11))-s(132),'#9d968c'); px(x,s(16+k+8),s(143),s((16+k+8)+(15))-s(16+k+8),s((143)+(11))-s(143),'#9d968c'); }
  // vetri
  const glass='rgba(180,225,235,0.55)';
  x.fillStyle=glass; x.fillRect(s(20),s(52),s((20)+(152))-s(20),s((52)+(82))-s(52));
  // tetto a spiovente vetrato
  x.fillStyle='rgba(200,235,245,0.6)';
  x.beginPath(); x.moveTo(s(12),s(54)); x.lineTo(s(96),s(14)); x.lineTo(s(180),s(54)); x.closePath(); x.fill();
  // telaio
  const frame='#4f7a52', frameL='#6f9a6a';
  px(x,s(16),s(50),s((16)+(160))-s(16),s((50)+(6))-s(50),frame); px(x,s(16),s(50),s((16)+(160))-s(16),s((50)+(2))-s(50),frameL);
  px(x,s(16),s(52),s((16)+(6))-s(16),s((52)+(84))-s(52),frame); px(x,s(170),s(52),s((170)+(6))-s(170),s((52)+(84))-s(52),frame);
  for(let k=1;k<6;k++) px(x,s(16+k*26),s(52),s((16+k*26)+(4))-s(16+k*26),s((52)+(82))-s(52),frame);
  for(let k=0;k<3;k++) px(x,s(20),s(60+k*24),s((20)+(152))-s(20),s((60+k*24)+(3))-s(60+k*24),frame);
  x.strokeStyle=frame; x.lineWidth=Math.max(1,s(5));
  x.beginPath(); x.moveTo(s(12),s(54)); x.lineTo(s(96),s(14)); x.lineTo(s(180),s(54)); x.stroke();
  x.lineWidth=Math.max(1,s(3));
  for(let k=1;k<4;k++){ x.beginPath(); x.moveTo(s(96-k*21),s(14+k*10)); x.lineTo(s(96-k*21),s(52)); x.stroke();
                        x.beginPath(); x.moveTo(s(96+k*21),s(14+k*10)); x.lineTo(s(96+k*21),s(52)); x.stroke(); }
  px(x,s(92),s(6),s((92)+(8))-s(92),s((6)+(12))-s(6),frame);
  // piante dentro (silhouette)
  for(let i=0;i<7;i++){
    const bx=30+i*20;
    x.globalAlpha=0.55;
    px(x,s(bx),s(110),s((bx)+(3))-s(bx),s((110)+(20))-s(110),'#3f7a32');
    circ(x,s(bx+1),s(108),s(6),'#4f9440');
    circ(x,s(bx+1),s(104),s(3), ['#e8465c','#f5d24f','#8a4fb0'][i%3]);
    x.globalAlpha=1;
  }
  // riflesso
  x.globalAlpha=0.28; x.fillStyle='#ffffff';
  x.beginPath(); x.moveTo(s(40),s(52)); x.lineTo(s(70),s(20)); x.lineTo(s(84),s(20)); x.lineTo(s(54),s(52)); x.closePath(); x.fill();
  x.globalAlpha=1;
  door(x, s(84), s(96), s((84)+(26))-s(84), s((96)+(38))-s(96), '#4f7a52', null, u);
  return c;
}

function bCapanna(o){
  const W=256, H=238, c=telaNetta(W,H), x=c.getContext('2d');
  const u = W/112;                       // pixel di mondo per unità dell'impaginato
  const s = n => Math.round(n*u);
  x.globalAlpha=0.2; ellip(x,s((W/u)/2),s((H/u)-6),s(42),s(8),'#000'); x.globalAlpha=1;
  // tronchi
  for(let r=0;r<6;r++){
    const yy=44+r*10;
    px(x,s(16),s(yy),s((16)+(80))-s(16),s((yy)+(10))-s(yy),r%2?'#8a6038':'#7a5432');
    px(x,s(16),s(yy),s((16)+(80))-s(16),s((yy)+(2))-s(yy),'#a8763c');
    px(x,s(16),s(yy+8),s((16)+(80))-s(16),s((yy+8)+(2))-s(yy+8),'#5f4028');
    circ(x,s(20),s(yy+5),s(5),'#96704a'); circ(x,s(92),s(yy+5),s(5),'#96704a');
  }
  shingleRoof(x, s(4), s(14), s((4)+(104))-s(4), s((14)+(32))-s(14), '#5f6b52', u);
  px(x,s(4),s(44),s((4)+(104))-s(4),s((44)+(5))-s(44),'#3a4432');
  door(x, s(46), s(76), s((46)+(22))-s(46), s((76)+(28))-s(76), '#5a3f28', null, u);
  window4(x, s(24), s(60), o.lit, u);
  px(x,s(80),s(4),s((80)+(12))-s(80),s((4)+(44))-s(4),'#7f766c'); px(x,s(78),s(0),s((78)+(16))-s(78),s((0)+(6))-s(0),'#5f5852');
  return c;
}

/* ===================================================================
   6. OGGETTI POSABILI / MACCHINE
   =================================================================== */
A.placeable = function(kind, opt){
  opt=opt||{};
  const key='p|'+kind+'|'+(opt.attivo?1:0)+'|'+(opt.pronto?1:0)+'|'+(opt.lati|0);
  if(objCache[key]) return objCache[key];
  const c=tela(48,56), x=c.getContext('2d');
  x.globalAlpha=0.22; ellip(x,24,50,14,5,'#000'); x.globalAlpha=1;
  switch(kind){
    case 'cassa':
      px(x,8,26,32,22,'#96704a'); px(x,8,26,32,3,'#b58a5e');
      px(x,8,44,32,4,'#6b4a2e');
      px(x,8,22,32,8,'#a8763c'); px(x,8,22,32,2,'#c99a5e');
      px(x,6,30,4,16,'#c9a05a'); px(x,38,30,4,16,'#c9a05a');
      px(x,20,32,8,7,'#e8c25a'); px(x,23,34,2,4,'#4a3220');
      break;
    case 'barattoliera':
      px(x,10,28,28,20,'#8a6038'); px(x,10,28,28,3,'#a8763c');
      px(x,12,20,24,10,'#c0d8dc'); px(x,12,20,24,3,'#e0f0f4');
      px(x,14,10,20,12,'#b8d4d8');
      px(x,12,8,24,4,'#8a6038');
      if(opt.pronto){ px(x,16,12,16,8,'#e8892c'); x.globalAlpha=0.5; circ(x,24,16,14,'#ffd24a'); x.globalAlpha=1; }
      else if(opt.attivo) px(x,16,12,16,8,'#7fae4a');
      break;
    case 'botte':
      ellip(x,24,44,15,5,'#6b4a2e');
      px(x,10,18,28,28,'#96704a');
      px(x,10,18,28,2,'#b58a5e');
      for(let r=0;r<4;r++) px(x,9,22+r*7,30,3,'#8a8a92');
      ellip(x,24,18,14,5,'#a8763c'); ellip(x,24,17,11,3.5,'#7a5432');
      if(opt.pronto){ ellip(x,24,17,8,2.5,'#8a4fb0'); x.globalAlpha=0.45; circ(x,24,14,12,'#c98ae8'); x.globalAlpha=1; }
      else if(opt.attivo) ellip(x,24,17,8,2.5,'#5f3080');
      break;
    case 'forno':
      px(x,6,26,36,22,'#8a8078');
      for(let r=0;r<3;r++) for(let k=0;k<4;k++){
        const bx=6+k*9+(r%2?4:0), by=26+r*7;
        if(bx>36) continue;
        px(x,bx,by,8,6, hsh(k,r,241)>0.5?'#948a80':'#7f766e');
      }
      px(x,14,32,20,14,'#2a1a12');
      x.beginPath(); x.fillStyle='#2a1a12'; x.arc(24,34,10,Math.PI,0); x.fill();
      if(opt.attivo||opt.pronto){
        ellip(x,24,40,8,5,'#ff5a2c'); ellip(x,24,41,6,4,'#ff9a3c'); ellip(x,24,42,4,2.5,'#ffd24a');
        x.globalAlpha=0.35; circ(x,24,38,14,'#ff9a3c'); x.globalAlpha=1;
      }
      px(x,28,6,10,22,'#7f766c'); px(x,26,2,14,6,'#5f5852');
      break;
    case 'fornace':
      px(x,8,24,32,24,'#7f766e');
      for(let r=0;r<4;r++) px(x,8,24+r*6,32,1,'#5f5852');
      px(x,16,32,16,14,'#2a1a12');
      if(opt.attivo||opt.pronto){
        ellip(x,24,42,7,4,'#ff7a2c'); ellip(x,24,43,5,3,'#ffc24a');
        x.globalAlpha=0.4; circ(x,24,38,15,'#ff9a3c'); x.globalAlpha=1;
      }
      px(x,10,16,12,10,'#8a8078'); px(x,26,16,12,10,'#8a8078');
      px(x,8,14,32,4,'#6f6660');
      break;
    case 'arnia':
      px(x,10,44,28,4,'#6b4a2e');
      for(let r=0;r<4;r++){ px(x,11,20+r*6,26,6,r%2?'#d8b96a':'#c9a44c'); px(x,11,20+r*6,26,1,'#e8cf8a'); }
      px(x,9,16,30,5,'#a8763c'); px(x,9,16,30,2,'#c99a5e');
      px(x,20,40,8,4,'#4a3220');
      if(opt.pronto){
        for(let i=0;i<4;i++){ const bx=12+i*7; px(x,bx,10+((i%2)*4),3,2,'#f5c93c'); px(x,bx+1,10+((i%2)*4),1,2,'#3a2a1c'); }
      }
      break;
    case 'spaventapasseri':
      px(x,22,20,4,28,'#8a6038');
      px(x,10,26,28,3,'#8a6038');
      px(x,14,18,20,16,'#c9a05a');
      px(x,14,18,20,3,'#e0bd76');
      px(x,18,22,3,3,'#3a2a1c'); px(x,27,22,3,3,'#3a2a1c');
      px(x,20,28,8,2,'#3a2a1c');
      px(x,10,12,28,7,'#7a5636'); px(x,16,6,16,8,'#8a6038');
      px(x,14,34,20,12,'#5f7a9c'); px(x,14,34,20,2,'#7f9abc');
      for(let i=0;i<3;i++) px(x,12+i*8,46,3,5,'#c9a44c');
      break;
    case 'lanterna':
      px(x,21,30,6,18,'#5f5852'); px(x,17,46,14,3,'#4a4640');
      px(x,16,14,16,18,'#7a6a4a');
      px(x,18,16,12,14, opt.attivo!==false ? '#ffe9a8':'#3a3630');
      px(x,14,10,20,5,'#8a7458'); px(x,22,4,4,7,'#8a7458');
      if(opt.attivo!==false){ x.globalAlpha=0.3; circ(x,24,23,20,'#ffd98a'); x.globalAlpha=1; }
      break;
    /* Il lume posato. Quello delle stanze scritte è un braccio a muro e
       lì va bene, perché un muro ce l'ha sempre dietro; questo si posa
       in mezzo alla stanza o sull'aia, quindi ha un piede suo — se no
       resterebbe appeso al nulla. Più basso e più stretto della
       lanterna, che è la luce da fuori: si devono riconoscere a colpo
       d'occhio anche spente. */
    case 'lume':
      px(x,20,44,8,3,'#4a4640');                       // piede
      px(x,23,26,2,18,'#6b5a3f');                      // stelo
      px(x,17,14,14,13,'#7a6a4a');                     // cassa del vetro
      px(x,19,16,10,9, opt.attivo!==false ? '#ffe9a8':'#3a3630');
      px(x,20,17,8,6,  opt.attivo!==false ? '#fff8d0':'#3a3630');
      px(x,16,11,16,4,'#8a7458');                      // cappello
      if(opt.attivo!==false){ x.globalAlpha=0.26; circ(x,24,21,16,'#ffd98a'); x.globalAlpha=1; }
      break;
    /* Una staccionata non è un pezzo: è una fila. Il disegno però era
       sempre lo stesso — due pali e due traverse orizzontali larghe
       quanto la casella — quindi una fila che andava su e giù veniva su
       come una scala a pioli, e negli angoli i pezzi non si toccavano.

       Adesso `opt.lati` dice da che parte c'è un pezzo vicino, e da qui
       si tirano solo le traverse che servono: verso est e ovest quelle
       orizzontali, verso nord e sud un corrente visto di taglio — che è
       come si vede un corrente che va via dallo sguardo. Il palo va per
       ultimo, sopra tutto, così le traverse gli spariscono dietro come
       fanno quelle vere. Le sedici combinazioni escono da questa regola
       sola: angoli, incroci e diramazioni comprese. */
    case 'recinto': {
      const L = opt.lati|0;
      const n=!!(L&1), e=!!(L&2), s=!!(L&4), w=!!(L&8);
      const traversa=(x0,x1)=>{
        px(x,x0,26,x1-x0,4,'#8a6038'); px(x,x0,26,x1-x0,1,'#a8763c');
        px(x,x0,36,x1-x0,4,'#8a6038'); px(x,x0,36,x1-x0,1,'#a8763c');
      };
      /* I correnti che vanno verso nord e verso sud vanno di taglio, e
         devono passare *fuori* dal palo: messi al centro finivano tutti
         dietro al palo e una fila su-giù veniva su come una fila di pali
         nudi. Due strisce, una per corrente, ai lati del palo: è come si
         vede una staccionata che va via dallo sguardo. */
      /* Le due strisce sono i due correnti: quello davanti prende luce,
         quello dietro sta in ombra. La differenza va tenuta larga, perché
         la palette aggancia ogni tinta al gradino più vicino della sua
         rampa e due marroni vicini finiscono sullo stesso: al primo giro
         palo e correnti snappavano tutti e tre a #8a5c34 e la fila
         veniva su come un'unica asse di legno. */
      const corrente=(y0,y1)=>{
        px(x,17,y0,4,y1-y0,'#a8763c'); px(x,17,y0,1,y1-y0,'#c99a5e');   // davanti, in luce
        px(x,27,y0,4,y1-y0,'#6b4a2e'); px(x,27,y0,1,y1-y0,'#7a5636');   // dietro, in ombra
      };
      if(w) traversa(4,26);
      if(e) traversa(22,44);
      if(n) corrente(12,34);
      if(s) corrente(34,56);
      // un pezzo da solo deve somigliare a una staccionata, non a un palo
      if(!L) traversa(6,42);
      px(x,21,22,6,26,'#96704a');            // il palo, fra i due correnti
      px(x,21,22,6,2,'#b58a5e');
      px(x,18,19,12,4,'#6b4a2e');            // il cappello, sporgente: taglia la fila
      px(x,18,19,12,1,'#8a6038');
      break;
    }
    /* Il cancelletto: gli stessi due pali della staccionata, ma le
       traverse sono più basse e in mezzo c'è il battente socchiuso.
       Dev'essere riconoscibile a colpo d'occhio dentro una fila di
       staccionate identiche, altrimenti il varco non si trova. */
    case 'cancelletto': {
      /* Anche il cancelletto segue la fila: in mezzo a una staccionata
         che va su e giù, uno sportello disegnato di traverso è il pezzo
         che stona di più, perché è quello che si cerca con gli occhi. */
      const L = opt.lati|0;
      const suGiu = ((L&1)||(L&4)) && !((L&2)||(L&8));
      if(suGiu){
        /* Il varco si cerca con gli occhi, quindi deve staccarsi dalla
           fila anche di taglio. Come quello orizzontale: un battente di
           legno chiaro incassato fra due pali scuri e grossi — dentro una
           fila di correnti scuri è l'unica cosa chiara, e si trova. */
        px(x,16,16,16,7,'#6b4a2e'); px(x,16,16,16,2,'#8a6038');  // il palo di sopra
        px(x,16,45,16,7,'#6b4a2e'); px(x,16,45,16,2,'#8a6038');  // e quello di sotto
        px(x,18,23,12,22,'#c99a5e');                              // il battente
        px(x,18,23,2,22,'#a8763c');
        for(let k=0;k<4;k++) px(x,18,25+k*5,12,2,'#8a6038');      // le stecche
        px(x,21,43,5,3,'#6a6a74'); px(x,21,43,5,1,'#9a9aa6');     // il gancio
        break;
      }
      px(x,8,18,5,28,'#96704a');  px(x,35,18,5,28,'#96704a');   // i due pali, più grossi
      px(x,8,18,5,2,'#b58a5e');   px(x,35,18,5,2,'#b58a5e');
      px(x,8,16,5,3,'#7a5432');   px(x,35,16,5,3,'#7a5432');    // i cappelli
      // il battente, socchiuso verso l'interno
      px(x,14,28,20,3,'#a8763c'); px(x,14,37,20,3,'#a8763c');
      px(x,14,28,20,1,'#c99a5e'); px(x,14,37,20,1,'#c99a5e');
      for(let k=0;k<4;k++) px(x,15+k*5,28,2,12,'#8a6038');      // le stecche
      px(x,14,28,2,12,'#7a5432');                                // il montante del battente
      px(x,31,31,4,2,'#6a6a74');                                 // il gancio
      px(x,31,31,4,1,'#9a9aa6');
      break;
    }
    case 'cartello':
      px(x,22,30,4,18,'#6b4a2e');
      px(x,10,16,28,18,'#8a5a34'); px(x,10,16,28,2,'#a8763c');
      px(x,13,21,22,2,'#e8d8b0'); px(x,13,26,14,2,'#e8d8b0');
      break;
  }
  objCache[key]=c; return c;
};

/* ===================================================================
   7. ANIMALI E FAUNA
   =================================================================== */
A.gallina = function(frame, dir){
  const key='gal|'+frame+'|'+dir;
  if(objCache[key]) return objCache[key];
  const c=tela(32,32), x=c.getContext('2d');
  const bob = frame%2?0:1;
  x.globalAlpha=0.22; ellip(x,16,27,7,3,'#000'); x.globalAlpha=1;
  const f = dir<0?-1:1;
  // zampe
  px(x,13,24-bob,2,3,'#e0a03c'); px(x,18,24-bob,2,3,'#e0a03c');
  // corpo
  ellip(x,16,19-bob,9,7,'#f4f0e8');
  ellip(x,16,17-bob,8,5,'#ffffff');
  ellip(x,16+f*5,20-bob,4,3,'#e0dcd2');
  // coda
  px(x,16-f*9,14-bob,5,3,'#e8e4da'); px(x,16-f*10,12-bob,4,3,'#f4f0e8');
  // testa
  circ(x,16+f*6,11-bob,4.2,'#ffffff');
  px(x,16+f*8,11-bob,3,2,'#e0a03c');           // becco
  px(x,16+f*5,9-bob,2,2,'#2f2418');            // occhio
  px(x,16+f*4,6-bob,5,3,'#d8452c');            // cresta
  px(x,16+f*6,14-bob,3,2,'#d8452c');           // bargigli
  objCache[key]=c; return c;
};

A.gatto = function(frame){
  const key='gatto|'+frame;
  if(objCache[key]) return objCache[key];
  const c=tela(32,32), x=c.getContext('2d');
  const bob=frame%2;
  x.globalAlpha=0.2; ellip(x,16,27,7,3,'#000'); x.globalAlpha=1;
  ellip(x,15,20-bob,9,6,'#c9853c');
  ellip(x,15,18-bob,8,4,'#e0a05a');
  px(x,9,24-bob,3,3,'#c9853c'); px(x,18,24-bob,3,3,'#c9853c');
  // coda a punto interrogativo
  px(x,24,16-bob,3,7,'#c9853c'); px(x,24,12-bob,5,3,'#c9853c'); px(x,27,10-bob,3,3,'#c9853c');
  circ(x,10,14-bob,5,'#e0a05a');
  x.fillStyle='#c9853c';
  x.beginPath(); x.moveTo(6,11-bob); x.lineTo(8,4-bob); x.lineTo(11,11-bob); x.fill();
  x.beginPath(); x.moveTo(11,10-bob); x.lineTo(14,4-bob); x.lineTo(16,11-bob); x.fill();
  px(x,7,13-bob,2,2,'#2f2418'); px(x,12,13-bob,2,2,'#2f2418');
  px(x,9,16-bob,3,1,'#8a5230');
  for(let i=0;i<3;i++) px(x,4,14-bob+i*2,4,1,'#f0d8b0');
  objCache[key]=c; return c;
};

/* ===================================================================
   8. ICONE OGGETTI
   =================================================================== */
const iconCache = {};

/* Le icone disegnate a mano (`DATA.ICONE`) prendono il posto di quelle
   disegnate in codice, quando il PNG è arrivato. Quel «quando» è il
   punto: `IMG.prendi` torna `null` per i primi fotogrammi di ogni
   partita, e le icone si chiedono subito — la prima finestra dello
   zaino, il primo toast. Se il ripiego finisse in `iconCache`, quel
   disegno resterebbe lì per sempre e il PNG non si vedrebbe mai, con
   la beffa di averlo scaricato lo stesso.

   Quindi il PNG si chiede PRIMA della cache, e in cache ci va per conto
   suo, con annotato da quale immagine viene: così `IMG.riprova` del
   pannello di prova rifà le tele invece di restituire le vecchie. È lo
   stesso meccanismo del foglio del personaggio, per la stessa ragione.

   E si chiedono col prefisso `icona:`, non col nudo id: la stessa cosa
   può avere due disegni — `cartello` è un PNG nel mondo e un ALTRO PNG
   nello zaino — e il caricatore le tiene per id. Senza prefisso qui si
   ripescherebbe lo sprite del mondo, che è tutt'altra misura e
   tutt'altra inquadratura. */
const iconeAMano = {}, iconaDaCui = {};
const CHIAVE_ICONA = 'icona:';

A.icon = function(id){
  const decl = window.DATA && DATA.ICONE && DATA.ICONE[id];
  if(decl && window.IMG){
    const img = IMG.prendi(CHIAVE_ICONA + id);
    if(img){
      if(iconeAMano[id] && iconaDaCui[id] === img) return iconeAMano[id];
      const c = cv(img.naturalWidth, img.naturalHeight);
      c.getContext('2d').drawImage(img, 0, 0);
      iconeAMano[id] = c; iconaDaCui[id] = img;
      return c;
    }
  }
  if(iconCache[id]) return iconCache[id];
  const c = cv(32,32), x = c.getContext('2d');
  x.imageSmoothingEnabled=false;
  drawIcon(x, id);
  iconCache[id]=c;
  return c;
};

/* Serve a chi mette l'icona in una pagina: una tela disegnata in codice
   è 32 px e va ingrandita a scalini netti (`image-rendering:pixelated`),
   una disegnata a mano è 128 e va RIMPICCIOLITA, che a scalini netti
   perde righe intere. Sono due filtri opposti, e senza saperlo distingue
   nessuno. Risponde `false` anche quando il PNG c'è ma non è ancora
   arrivato, perché in quel momento a schermo c'è il disegno in codice. */
A.iconaAMano = function(id){
  return !!(window.DATA && DATA.ICONE && DATA.ICONE[id] && window.IMG && IMG.prendi(CHIAVE_ICONA + id));
};

function toolHead(x, kind, tx, ty){
  switch(kind){
    case 'zappa':
      px(x,tx,ty,3,12,'#9a6b3c'); px(x,tx,ty,1,12,'#b58a5e');
      px(x,tx-6,ty,7,4,'#a8a8b2'); px(x,tx-6,ty,7,1,'#d0d0da'); px(x,tx-6,ty+3,7,1,'#6f6f7a');
      break;
    case 'annaffiatoio':
      px(x,tx-6,ty+2,14,10,'#5f9ab8'); px(x,tx-6,ty+2,14,2,'#7fbad8');
      px(x,tx-6,ty+10,14,2,'#3f7a98');
      px(x,tx+7,ty,4,4,'#5f9ab8');
      px(x,tx-11,ty+3,6,3,'#5f9ab8'); px(x,tx-13,ty+2,3,5,'#7fbad8');
      px(x,tx-2,ty-2,6,3,'#4a86a5');
      break;
    case 'ascia':
      px(x,tx,ty,3,14,'#8a6038'); px(x,tx,ty,1,14,'#a8763c');
      px(x,tx-7,ty-1,8,7,'#b0b0ba'); px(x,tx-7,ty-1,8,2,'#e0e0ea');
      px(x,tx-8,ty,2,5,'#e8e8f2'); px(x,tx-7,ty+5,8,1,'#6f6f7a');
      px(x,tx+2,ty-1,3,7,'#8a8a92');
      break;
    case 'piccone':
      px(x,tx,ty,3,14,'#8a6038'); px(x,tx,ty,1,14,'#a8763c');
      x.fillStyle='#a8a8b2';
      x.beginPath(); x.moveTo(tx-9,ty+3); x.quadraticCurveTo(tx+1,ty-4,tx+11,ty+3);
      x.lineTo(tx+11,ty+5); x.quadraticCurveTo(tx+1,ty-1,tx-9,ty+5); x.fill();
      px(x,tx-10,ty+2,3,4,'#d0d0da'); px(x,tx+9,ty+2,3,4,'#d0d0da');
      break;
    case 'falce':
      px(x,tx,ty+2,3,12,'#8a6038');
      x.strokeStyle='#c0c0ca'; x.lineWidth=3;
      x.beginPath(); x.arc(tx-5,ty+2,8,-0.4,1.9); x.stroke();
      x.strokeStyle='#e8e8f2'; x.lineWidth=1;
      x.beginPath(); x.arc(tx-5,ty+2,9,-0.3,1.8); x.stroke();
      break;
    case 'canna':
      x.strokeStyle='#a8763c'; x.lineWidth=2;
      x.beginPath(); x.moveTo(tx-8,ty+14); x.quadraticCurveTo(tx,ty-2,tx+9,ty-6); x.stroke();
      x.strokeStyle='#e8e8f2'; x.lineWidth=1;
      x.beginPath(); x.moveTo(tx+9,ty-6); x.lineTo(tx+11,ty+8); x.stroke();
      px(x,tx+10,ty+8,3,3,'#d84f4f');
      px(x,tx-5,ty+9,4,4,'#6b4a2e');
      break;
    /* L'arco: il legno curvo, la corda tesa e la freccia incoccata. A
       questa misura si legge per la sagoma, non per i dettagli — la
       curva del legno e la retta della corda bastano. */
    case 'arco':
      x.strokeStyle='#8a5c34'; x.lineWidth=3;
      x.beginPath(); x.arc(tx+5, ty+4, 11, 2.0, 4.3); x.stroke();
      x.strokeStyle='#c99a5e'; x.lineWidth=1;
      x.beginPath(); x.arc(tx+4, ty+4, 11, 2.1, 4.2); x.stroke();
      x.strokeStyle='#e8dcc0'; x.lineWidth=1;          // la corda
      x.beginPath(); x.moveTo(tx-1,ty-6); x.lineTo(tx-1,ty+14); x.stroke();
      px(x,tx-1,ty+3,11,1,'#d8cca8');                   // la freccia
      px(x,tx+9,ty+2,3,3,'#a8a8b2');
      px(x,tx-3,ty+2,3,3,'#6f5238');                    // impugnatura
      break;
  }
}

A.drawToolHeld = function(x, sx, sy, kind, face, using){
  x.save();
  x.translate(sx, sy);
  if(face<0) x.scale(-1,1);
  x.rotate(using ? -0.9 : -0.25);
  x.scale(0.62,0.62);
  toolHead(x, kind, 2, 0);
  x.restore();
};

function drawIcon(x, id){
  /* --- id composti: conserva:xxx, vino:xxx, succo:xxx --- */
  if(id.indexOf(':')>0){
    const [k, src] = id.split(':');
    const C = DATA.CROPS[src] || {c1:'#8fc45a', c2:'#5f9c3c', forma:'sfera', foglia:'#5f9c3c'};
    if(k==='conserva'){
      px(x,8,10,16,18,'#c0d8dc'); px(x,8,10,16,3,'#e0f0f4'); px(x,8,25,16,3,'#9ab8bc');
      px(x,10,13,12,13,C.c1); px(x,10,13,12,3,shade(C.c1,0.3));
      px(x,7,6,18,5,'#a8763c'); px(x,7,6,18,2,'#c99a5e');
      px(x,9,20,4,4,shade(C.c2,-0.1));
      x.globalAlpha=0.35; px(x,11,14,3,10,'#ffffff'); x.globalAlpha=1;
    } else if(k==='vino'){
      px(x,12,4,8,8,'#3f7a52');
      px(x,10,11,12,18,'#2f5a3c'); px(x,10,11,12,3,'#4f7a5c');
      px(x,12,16,8,10,C.c1);
      px(x,11,18,10,7,'#f0e2c0'); px(x,12,19,3,5,C.c2);
      x.globalAlpha=0.4; px(x,12,12,2,14,'#ffffff'); x.globalAlpha=1;
    } else {
      px(x,11,8,10,20,'#d8e8ec'); px(x,11,8,10,2,'#f0f8fa');
      px(x,11,14,10,14,C.c1);
      px(x,9,5,14,4,'#a8a8b2');
      px(x,14,2,3,5,'#c0c0ca');
      x.globalAlpha=0.4; px(x,13,15,2,11,'#ffffff'); x.globalAlpha=1;
    }
    return;
  }

  const IT = DATA.ITEMS[id];
  if(!IT){ px(x,10,10,12,12,'#c05a44'); return; }

  /* attrezzi */
  if(IT.cat==='attrezzo'){ toolHead(x, IT.icona||id, 16, 8); return; }

  /* semi */
  if(IT.cat==='seme'){
    const C = DATA.CROPS[IT.seme];
    px(x,6,12,20,16,'#c9a44c'); px(x,6,12,20,3,'#dcb968');
    px(x,6,25,20,3,'#a8853c');
    px(x,8,8,16,6,'#b08a3c');
    px(x,10,6,12,4,'#c9a44c');
    // cordino
    px(x,9,13,14,2,'#8a6038');
    // semini che escono
    for(let i=0;i<3;i++){
      const bx=11+i*4, by=3+((i%2)*2);
      ellip(x,bx,by,2,2.6,C? C.c1:'#8fc45a');
      px(x,bx-1,by-1,1,1,'#ffffff');
    }
    px(x,12,18,8,6,'#8a6038');
    px(x,13,19,2,2,C?C.c1:'#8fc45a'); px(x,17,20,2,2,C?C.c2:'#5f9c3c');
    return;
  }

  /* raccolti */
  if(IT.cat==='raccolto'){
    const C = DATA.CROPS[IT.crop];
    x.save(); x.translate(0,2); A.drawFruit(x, 16, 28, C, 18, 0, true); x.restore();
    return;
  }

  /* foraggio */
  if(IT.cat==='foraggio'){ drawForageArt(x, 16, 28, id); return; }

  /* pesci */
  if(IT.cat==='pesce'){ drawFishIcon(x, id); return; }

  /* il resto */
  switch(id){
    case 'legna':
      for(let i=0;i<3;i++){
        const bx=5+i*3, by=8+i*6;
        px(x,bx,by,22-i*2,6,'#8a6038'); px(x,bx,by,22-i*2,2,'#a8763c');
        ellip(x,bx+1,by+3,2,3,'#c99a5e'); ellip(x,bx+1,by+3,1,1.5,'#8a6038');
      }
      break;
    case 'pietra':
      ellip(x,16,20,11,8,'#6b6762'); ellip(x,16,18,10,7,'#8a8580');
      ellip(x,12,15,5,4,'#a8a29a');
      x.fillStyle='#6b6762'; x.beginPath(); x.moveTo(6,20); x.lineTo(13,9); x.lineTo(16,22); x.fill();
      break;
    case 'fibra':
      for(let i=0;i<6;i++){
        const bx=6+i*4;
        x.fillStyle=i%2?'#8fa85a':'#7a9448';
        for(let k=0;k<12;k++) x.fillRect(bx+((Math.sin(k*0.5+i)*2)|0), 24-k, 2, 1);
      }
      px(x,10,22,12,3,'#c9a44c');
      break;
    case 'argilla':
      ellip(x,16,20,10,7,'#a8764c'); ellip(x,16,18,9,6,'#c08a5e');
      ellip(x,12,15,4,3,'#d8a878');
      px(x,20,20,3,3,'#8a5a34');
      break;
    case 'carbone':
      ellip(x,14,20,7,6,'#2a2622'); ellip(x,21,18,5,5,'#3a3632');
      ellip(x,12,17,3,2,'#4a4640'); ellip(x,20,16,2,1.5,'#5a564f');
      x.globalAlpha=0.3; px(x,13,15,2,2,'#8a6038'); x.globalAlpha=1;
      break;
    case 'linfa':
      px(x,10,10,12,18,'#7a5636'); px(x,10,10,12,3,'#96704a');
      px(x,12,14,8,12,'#c9852c'); px(x,12,14,8,3,'#e0a54c');
      px(x,9,8,14,3,'#8a6038');
      break;
    case 'uovo': case 'uovo_oro': {
      const col = id==='uovo_oro' ? '#f0c84a' : '#f8f0e0';
      ellip(x,16,19,8,10,shade(col,-0.12));
      ellip(x,16,18,7,9,col);
      ellip(x,13,14,3,3.5,shade(col,0.3));
      if(id==='uovo_oro'){ x.globalAlpha=0.4; circ(x,16,18,13,'#ffe9a8'); x.globalAlpha=1;
        px(x,22,10,2,2,'#fff8d0'); px(x,9,24,2,2,'#fff8d0'); }
      break;
    }
    case 'miele':
      px(x,9,12,14,16,'#e0a54c'); px(x,9,12,14,3,'#f5c96a');
      px(x,9,25,14,3,'#c9852c');
      px(x,8,8,16,5,'#a8763c'); px(x,8,8,16,2,'#c99a5e');
      x.globalAlpha=0.4; px(x,12,15,3,10,'#ffe9a8'); x.globalAlpha=1;
      px(x,14,17,5,5,'#c9852c');
      break;
    case 'latte':
      px(x,11,8,10,20,'#e8e4dc'); px(x,11,8,10,3,'#f8f6f0');
      px(x,11,25,10,3,'#c8c4bc');
      px(x,13,4,6,5,'#d8d4cc');
      px(x,12,14,8,7,'#5f9ab8'); px(x,13,16,2,3,'#ffffff');
      break;
    case 'rame': case 'ferro': case 'oro': case 'quarzo': case 'ametista': case 'gemma_luna': case 'geode': {
      const P={rame:['#b08a6a','#e08a4a'],ferro:['#8a8a92','#d8dce8'],oro:['#9a8a68','#ffd24a'],
               quarzo:['#a8a8b2','#eaf4ff'],ametista:['#7a6a8a','#c98ae8'],
               gemma_luna:['#6a7a9a','#bfd8ff'],geode:['#7a7268','#8ac0d8']}[id];
      ellip(x,16,21,10,8,shade(P[0],-0.2)); ellip(x,16,19,9,7,P[0]);
      ellip(x,12,16,4,3,shade(P[0],0.2));
      for(let i=0;i<4;i++){
        const bx=9+((hsh(i,0,251)*14)|0), by=13+((hsh(i,1,252)*10)|0);
        px(x,bx,by,3,3,P[1]); px(x,bx,by,1,1,shade(P[1],0.4));
      }
      if(id==='gemma_luna'){ x.globalAlpha=0.4; circ(x,16,19,14,'#bfd8ff'); x.globalAlpha=1; }
      break;
    }
    case 'lingotto_rame': case 'lingotto_ferro': case 'lingotto_oro': {
      const P={lingotto_rame:['#d8894a','#f0b070','#a8602c'],
               lingotto_ferro:['#b0b4c0','#dce0ea','#7a7e88'],
               lingotto_oro:['#f0c84a','#ffe89a','#c09020']}[id];
      x.fillStyle=P[2];
      x.beginPath(); x.moveTo(5,24); x.lineTo(9,14); x.lineTo(23,14); x.lineTo(27,24); x.closePath(); x.fill();
      x.fillStyle=P[0];
      x.beginPath(); x.moveTo(6,23); x.lineTo(10,15); x.lineTo(22,15); x.lineTo(26,23); x.closePath(); x.fill();
      px(x,10,14,12,2,P[1]);
      x.globalAlpha=0.5; px(x,12,17,3,5,P[1]); x.globalAlpha=1;
      break;
    }
    case 'concime':
      px(x,8,14,16,14,'#6b4a2e'); px(x,8,14,16,3,'#8a6038');
      px(x,8,25,16,3,'#4a3220');
      for(let i=0;i<6;i++){ const bx=9+((hsh(i,0,261)*14)|0), by=16+((hsh(i,1,262)*8)|0);
        px(x,bx,by,2,2, hsh(i,2,263)>0.5?'#8a6a3c':'#5f4028'); }
      px(x,11,10,10,5,'#8a6038');
      px(x,13,6,3,5,'#5f9c3c'); px(x,12,4,5,3,'#7fbe4e');
      break;
    case 'concime_acqua':
      px(x,8,14,16,14,'#4f6b7a'); px(x,8,14,16,3,'#6f8b9a');
      for(let i=0;i<5;i++){ const bx=10+((hsh(i,0,271)*12)|0), by=17+((hsh(i,1,272)*7)|0);
        px(x,bx,by,2,2,'#8fb8d0'); }
      px(x,11,10,10,5,'#5f7b8a');
      px(x,14,4,4,6,'#7fbad8'); px(x,13,7,6,4,'#9fd0e8');
      break;
    case 'sentiero': {
      const cc=['#b5a894','#a89b86','#c2b6a2'];
      for(let i=0;i<5;i++){
        const bx=5+((hsh(i,0,281)*20)|0), by=10+((hsh(i,1,282)*14)|0);
        const col=cc[i%3];
        px(x,bx,by,7,6,col); px(x,bx,by,7,1,shade(col,0.2)); px(x,bx,by+5,7,1,shade(col,-0.25));
      }
      break;
    }
    /* Le superfici da posare. L'icona è un ritaglio del terreno VERO,
       preso da `A.ground`, non un disegnino che gli somiglia: quello che
       si vede nello zaino è esattamente quello che ci si ritrova per
       terra, e il giorno che una texture cambia l'icona cambia con lei
       senza che nessuno debba ricordarsene. La stagione è fissata a
       primavera perché la zolla d'erba d'inverno sarebbe un quadrato di
       neve, e in mano resta erba anche a dicembre. */
    case 'assi': case 'lastre': case 'cotto': case 'zolla': {
      const tipo = id==='zolla' ? 'erba' : id;
      x.save();
      x.beginPath(); x.rect(4,9,24,16); x.clip();
      // l'icona è una tela grezza da 32: il terreno arriva in pixel di
      // mondo e va rimesso all'unità di disegno, o si vedrebbe solo il
      // quarto in alto a sinistra della casella
      x.drawImage(A.ground(tipo, 1, 'primavera'), 0, 0, U, U);
      x.restore();
      /* Cornice: chiara sopra e a sinistra, scura sotto e a destra, così
         la piastrella ha uno spessore e non sembra un buco nel foglio.
         I colori li aggancia la palette al gradino più vicino. */
      px(x,4,9,24,1,'#8a7a5e'); px(x,4,9,1,16,'#8a7a5e');
      px(x,4,24,24,1,'#3a2a1c'); px(x,27,9,1,16,'#3a2a1c');
      break;
    }
    case 'recinto': case 'cancelletto': case 'cartello': case 'spaventapasseri': case 'lanterna': case 'lume': case 'cassa':
    case 'barattoliera': case 'botte': case 'forno': case 'fornace': case 'arnia':
    case 'vaso_lucciole': {
      const src = A.placeable(id==='vaso_lucciole'?'lanterna':id, {attivo:true, pronto:false});
      x.drawImage(src, 2, 8, 28, 28*56/48);
      if(id==='vaso_lucciole'){
        x.globalAlpha=0.6;
        for(let i=0;i<4;i++) px(x, 12+((hsh(i,0,291)*10)|0), 14+((hsh(i,1,292)*10)|0), 2,2, '#d8f078');
        x.globalAlpha=1;
      }
      break;
    }
    case 'gallina': { const g=A.gallina(0,1); x.drawImage(g,0,0,32,32); break; }
    /* cibi */
    case 'zuppa_contadina':
      ellip(x,16,22,12,7,'#c8c4bc'); ellip(x,16,20,11,6,'#e8e4dc');
      ellip(x,16,19,9,5,'#c9852c'); ellip(x,13,18,3,2,'#e0a54c');
      px(x,10,16,3,2,'#e8892c'); px(x,19,17,3,2,'#7fae4a');
      x.globalAlpha=0.4; px(x,13,8,2,5,'#ffffff'); px(x,18,6,2,6,'#ffffff'); x.globalAlpha=1;
      break;
    case 'frittata':
      ellip(x,16,20,12,8,'#f0d88a'); ellip(x,16,19,11,7,'#f8e8a8');
      ellip(x,14,18,4,3,'#f5c93c'); ellip(x,20,21,3,2,'#e8892c');
      px(x,11,22,3,2,'#d8452c'); px(x,20,16,3,2,'#7fae4a');
      break;
    case 'insalata_orto':
      ellip(x,16,22,12,7,'#d8d4cc'); ellip(x,16,20,11,6,'#f0ece4');
      ellip(x,13,18,5,4,'#5f9c3c'); ellip(x,19,18,5,4,'#7fbe4e'); ellip(x,16,16,4,3,'#8fc45a');
      px(x,12,16,3,3,'#d8452c'); px(x,20,20,3,3,'#e8892c');
      break;
    case 'torta_zucca':
      x.fillStyle='#c9a44c'; x.beginPath(); x.moveTo(4,24); x.lineTo(8,12); x.lineTo(24,12); x.lineTo(28,24); x.closePath(); x.fill();
      px(x,8,12,16,4,'#e8892c'); px(x,8,12,16,1,'#f5a84c');
      px(x,4,23,24,3,'#a8853c');
      ellip(x,16,11,3,2,'#f8f0e0');
      px(x,14,8,4,3,'#7fae4a');
      break;
    case 'crostata':
      ellip(x,16,20,12,8,'#c9a44c'); ellip(x,16,19,10,6,'#e0bd76');
      for(let i=0;i<4;i++) px(x,8+i*5,14,3,12,'#c9a44c');
      for(const p of [[12,17],[19,20],[16,15],[21,16]]) circ(x,p[0],p[1],2.2,'#c8324a');
      circ(x,14,21,2,'#4a63b8');
      break;
    case 'polenta':
      ellip(x,16,22,12,7,'#c8c4bc'); ellip(x,16,20,11,6,'#e8e4dc');
      ellip(x,16,19,9,5,'#f0c84a'); ellip(x,13,18,3,2,'#f8dc7a');
      px(x,14,15,5,3,'#e8892c');
      break;
    case 'pesce_arrosto':
      ellip(x,16,20,12,6,'#c8c4bc');
      ellip(x,15,19,9,5,'#b08a6a'); ellip(x,15,18,8,4,'#d0a880');
      x.fillStyle='#b08a6a'; x.beginPath(); x.moveTo(24,19); x.lineTo(29,15); x.lineTo(29,23); x.fill();
      px(x,9,17,2,2,'#3a2a1c');
      px(x,13,14,6,2,'#8a5fc0');
      break;
    case 'pane_miele':
      x.fillStyle='#c9a44c'; x.beginPath(); x.ellipse(16,20,12,7,0,0,6.3); x.fill();
      x.fillStyle='#dcb968'; x.beginPath(); x.ellipse(16,19,11,6,0,0,6.3); x.fill();
      px(x,8,16,16,4,'#e0a54c');
      x.globalAlpha=0.6; px(x,10,15,12,2,'#f5c96a'); x.globalAlpha=1;
      for(let i=0;i<3;i++) px(x,11+i*4,13,2,3,'#e0a54c');
      break;
    case 'tisana':
      px(x,10,14,14,14,'#e8e4dc'); px(x,10,14,14,3,'#f8f6f0');
      px(x,12,17,10,9,'#8a6a3c'); px(x,12,17,10,2,'#a88a5c');
      px(x,23,17,4,7,'#e8e4dc'); px(x,24,18,2,5,'#c8c4bc');
      x.globalAlpha=0.4; px(x,13,8,2,5,'#ffffff'); px(x,18,6,2,6,'#ffffff'); x.globalAlpha=1;
      px(x,14,15,3,2,'#8a5fc0');
      break;
    /* braci e speciali */
    case 'brace_primavera': case 'brace_estate': case 'brace_autunno': case 'brace_inverno': {
      const col={brace_primavera:'#8fd46a',brace_estate:'#f7c744',brace_autunno:'#e08a3c',brace_inverno:'#9fd8ee'}[id];
      x.globalAlpha=0.3; circ(x,16,18,14,col); x.globalAlpha=0.55; circ(x,16,18,10,col); x.globalAlpha=1;
      ellip(x,16,19,6,7,shade(col,0.25));
      ellip(x,16,20,4,5,'#ffffff');
      px(x,15,10,2,4,shade(col,0.3));
      for(let i=0;i<4;i++){ const a=i*1.6; px(x,(16+Math.cos(a)*12)|0,(18+Math.sin(a)*12)|0,2,2,shade(col,0.4)); }
      break;
    }
    case 'medaglione':
      px(x,15,4,2,8,'#c9a05a');
      circ(x,16,19,9,'#c09020'); circ(x,16,19,7.5,'#f0c84a');
      circ(x,16,19,4,'#c09020');
      x.globalAlpha=0.5; px(x,12,13,3,4,'#ffe89a'); x.globalAlpha=1;
      break;
    default:
      ellip(x,16,20,9,8,'#8a6038'); ellip(x,16,18,8,7,'#a8763c');
  }
}

function drawFishIcon(x, id){
  const P = {
    trota:['#7a8a5a','#a8b878','#e8a04a'], carpa:['#b08a4a','#d8b070','#8a6038'],
    persico:['#6a8a4a','#9ab86a','#e0c04a'], luccio:['#5a7a4a','#8aa86a','#c9a44c'],
    anguilla:['#3a4a3a','#5a6a52','#8a9a7a'], storione:['#5a6a7a','#8a9aaa','#c0c8d0'],
    temolo:['#7a8a9a','#a8b8c8','#d8c0e0'], pesce_sole:['#c9a44c','#f0d878','#e08a4a'],
    pesce_luna:['#8a9ad8','#c0d0f8','#f0f4ff'], gambero:['#c05a3c','#e08a6a','#8a3a24'],
    branzino:['#6a7a8a','#a8b8c4','#d8e0e8'], orata:['#8a8a6a','#c8c49a','#e8b04a'],
    sgombro:['#3a5a6a','#5a8a9a','#8ab0c0'], polpo:['#a84a5a','#d08090','#f0b0b8'],
    ricciola:['#5a6a5a','#9ab89a','#e8d060'],
    scarpa_vecchia:['#5a4a3a','#7a6a5a','#3a2e24'], alga:['#4a7a4a','#6a9a5a','#3a5a3a'],
    lattina:['#8a8a92','#b0b0ba','#c05a44']
  }[id] || ['#7a8a9a','#a8b8c8','#d0d8e0'];

  if(id==='scarpa_vecchia'){
    x.fillStyle=P[0]; x.beginPath(); x.moveTo(4,24); x.lineTo(6,14); x.lineTo(16,14); x.lineTo(20,18); x.lineTo(28,20); x.lineTo(28,24); x.closePath(); x.fill();
    px(x,4,23,24,3,P[2]); px(x,8,15,8,2,P[1]);
    px(x,10,17,3,2,'#3a2e24');
    return;
  }
  if(id==='alga'){
    for(let i=0;i<3;i++){
      const bx=10+i*5;
      x.fillStyle=i%2?P[0]:P[1];
      for(let k=0;k<16;k++) x.fillRect(bx+((Math.sin(k*0.4+i*2)*3)|0),26-k,3,1);
    }
    return;
  }
  if(id==='lattina'){
    px(x,11,10,10,16,P[0]); px(x,11,10,10,3,P[1]); px(x,11,23,10,3,'#6f6f7a');
    px(x,12,15,8,5,P[2]);
    x.globalAlpha=0.4; px(x,13,12,2,11,'#ffffff'); x.globalAlpha=1;
    return;
  }
  if(id==='gambero'){
    ellip(x,17,19,8,5,P[0]); ellip(x,17,18,7,4,P[1]);
    for(let i=0;i<4;i++) px(x,12+i*4,15,2,8,P[2]);
    px(x,25,16,5,3,P[0]); px(x,25,20,5,3,P[0]);   // chele
    px(x,28,14,3,4,P[1]); px(x,28,20,3,4,P[1]);
    px(x,8,16,4,3,P[0]); px(x,8,20,4,3,P[0]);
    px(x,23,17,2,2,'#2f2418');
    for(let i=0;i<3;i++){ px(x,10-i,13-i,2,1,P[2]); }
    return;
  }
  // pesce generico
  ellip(x,15,19,10,6,P[0]);
  ellip(x,15,18,9,5,P[1]);
  ellip(x,12,16,4,2.5,shade(P[1],0.25));
  // coda
  x.fillStyle=P[0];
  x.beginPath(); x.moveTo(24,19); x.lineTo(30,13); x.lineTo(30,25); x.closePath(); x.fill();
  x.fillStyle=P[1];
  x.beginPath(); x.moveTo(25,19); x.lineTo(29,15); x.lineTo(29,23); x.closePath(); x.fill();
  // pinne
  x.fillStyle=P[2];
  x.beginPath(); x.moveTo(13,14); x.lineTo(18,8); x.lineTo(20,14); x.closePath(); x.fill();
  x.beginPath(); x.moveTo(14,24); x.lineTo(18,28); x.lineTo(20,24); x.closePath(); x.fill();
  // occhio + branchia
  px(x,8,17,3,3,'#ffffff'); px(x,9,18,2,2,'#2f2418');
  x.globalAlpha=0.5; px(x,13,15,1,8,P[2]); x.globalAlpha=1;
  // macchie
  for(let i=0;i<3;i++) px(x,14+i*3,17+((i%2)*3),2,2,P[2]);
  if(id==='pesce_luna'){ x.globalAlpha=0.35; circ(x,16,19,15,'#c0d0f8'); x.globalAlpha=1; }
}

/* ===================================================================
   9. ICONE UI (stagioni, meteo)
   =================================================================== */
A.uiIcon = function(kind){
  const key='ui|'+kind;
  if(iconCache[key]) return iconCache[key];
  const c=cv(24,24), x=c.getContext('2d');
  switch(kind){
    case 'primavera':
      px(x,11,12,2,10,'#5f9c3c');
      for(let i=0;i<5;i++){const a=i/5*6.28-1.57; ellip(x,12+Math.cos(a)*5,10+Math.sin(a)*5,3.4,3,'#f5a6c0');}
      circ(x,12,10,2.4,'#ffe270');
      break;
    case 'estate':
      circ(x,12,12,6,'#f7d154'); circ(x,12,12,4.5,'#ffe89a');
      for(let i=0;i<8;i++){const a=i/8*6.28; px(x,(12+Math.cos(a)*9)|0,(12+Math.sin(a)*9)|0,3,3,'#f5c93c');}
      break;
    case 'autunno':
      x.fillStyle='#d9713c';
      x.beginPath(); x.moveTo(12,4); x.lineTo(19,12); x.lineTo(16,12); x.lineTo(20,19); x.lineTo(12,15); x.lineTo(4,19); x.lineTo(8,12); x.lineTo(5,12); x.closePath(); x.fill();
      px(x,11,15,2,6,'#8a5230');
      x.globalAlpha=0.4; px(x,10,8,2,7,'#f0a56a'); x.globalAlpha=1;
      break;
    case 'inverno':
      for(let i=0;i<6;i++){ const a=i/6*6.28;
        for(let k=2;k<9;k++) px(x,(12+Math.cos(a)*k)|0,(12+Math.sin(a)*k)|0,2,2,'#bfe8f5');
        px(x,(12+Math.cos(a)*6+Math.cos(a+1.2)*3)|0,(12+Math.sin(a)*6+Math.sin(a+1.2)*3)|0,2,2,'#eafaff');
      }
      circ(x,12,12,2.4,'#ffffff');
      break;
    case 'sole':
      circ(x,12,12,6,'#f7d154'); circ(x,11,11,4,'#ffe89a');
      for(let i=0;i<8;i++){const a=i/8*6.28; px(x,(12+Math.cos(a)*9)|0,(12+Math.sin(a)*9)|0,2,2,'#f5c93c');}
      break;
    case 'nuvola':
      circ(x,9,13,5,'#e8eef2'); circ(x,15,13,6,'#e8eef2'); circ(x,12,10,5,'#f4f8fa');
      px(x,5,13,15,5,'#e8eef2'); px(x,5,17,15,2,'#c8d2da');
      break;
    case 'pioggia':
      circ(x,9,9,5,'#b8c4cc'); circ(x,15,9,5.5,'#b8c4cc'); px(x,5,9,15,5,'#b8c4cc');
      px(x,5,13,15,2,'#98a4ac');
      for(let i=0;i<4;i++) px(x,6+i*4,17+((i%2)*2),2,4,'#6fa8c7');
      break;
    case 'temporale':
      circ(x,9,8,5,'#8a94a0'); circ(x,15,8,5.5,'#8a94a0'); px(x,5,8,15,5,'#8a94a0');
      x.fillStyle='#ffd24a';
      x.beginPath(); x.moveTo(13,12); x.lineTo(9,18); x.lineTo(12,18); x.lineTo(10,23); x.lineTo(16,16); x.lineTo(13,16); x.closePath(); x.fill();
      break;
    case 'neve':
      circ(x,9,9,5,'#dce4ea'); circ(x,15,9,5.5,'#dce4ea'); px(x,5,9,15,5,'#dce4ea');
      for(let i=0;i<4;i++) px(x,6+i*4,17+((i%2)*2),2,2,'#ffffff');
      break;
    case 'vento':
      for(let i=0;i<3;i++){
        const yy=7+i*5, w=12+i*2;
        px(x,3,yy,w,2,'#c8d8e0');
        x.strokeStyle='#c8d8e0'; x.lineWidth=2;
        x.beginPath(); x.arc(3+w,yy+1,3,-1.6,1.2); x.stroke();
      }
      break;
  }
  iconCache[key]=c; return c;
};

/* ===================================================================
   10. EFFETTI E DECORAZIONI
   =================================================================== */
A.cloudSprite = function(v){
  const key='cloud|'+v;
  if(objCache[key]) return objCache[key];
  const W=160,H=80, c=cv(W,H), x=c.getContext('2d');
  const blobs=6+((hsh(v,0,301)*4)|0);
  for(let i=0;i<blobs;i++){
    const bx=24+((hsh(i,v,302)*(W-48))|0);
    const by=30+((hsh(i,v,303)*24)|0);
    const r=14+((hsh(i,v,304)*16)|0);
    circ(x,bx,by,r,'#ffffff');
  }
  // base piatta
  x.fillStyle='#ffffff'; x.fillRect(20,44,W-40,16);
  // ombreggiatura
  x.globalCompositeOperation='source-atop';
  const g=x.createLinearGradient(0,20,0,64);
  g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(1,'rgba(190,205,220,1)');
  x.fillStyle=g; x.fillRect(0,0,W,H);
  x.globalCompositeOperation='source-over';
  objCache[key]=c; return c;
};

/* segnalino "pronto" sopra le macchine */
A.bolla = function(itemId){
  const key='bolla|'+itemId;
  if(objCache[key]) return objCache[key];
  const c=tela(40,40), x=c.getContext('2d');
  ellip(x,20,16,15,13,'rgba(0,0,0,0.18)');
  ellip(x,20,15,15,13,'#f6e6c8');
  ellip(x,20,14,13,11,'#fff8e4');
  x.fillStyle='#f6e6c8';
  x.beginPath(); x.moveTo(16,26); x.lineTo(20,34); x.lineTo(24,26); x.closePath(); x.fill();
  const ic = A.icon(itemId);
  x.drawImage(ic, 6, 2, 28, 28);
  objCache[key]=c; return c;
};

/* punto esclamativo / cuore sopra NPC */
A.emote = function(kind){
  const key='em|'+kind;
  if(objCache[key]) return objCache[key];
  const c=tela(32,32), x=c.getContext('2d');
  ellip(x,16,15,13,11,'rgba(0,0,0,0.18)');
  ellip(x,16,14,13,11,'#fff8e4');
  x.fillStyle='#fff8e4';
  x.beginPath(); x.moveTo(12,23); x.lineTo(16,30); x.lineTo(20,23); x.closePath(); x.fill();
  if(kind==='!'){ px(x,14,7,4,10,'#d8452c'); px(x,14,19,4,3,'#d8452c'); }
  else if(kind==='?'){ px(x,12,7,8,3,'#5f7ab8'); px(x,17,9,3,4,'#5f7ab8'); px(x,14,12,4,3,'#5f7ab8'); px(x,14,19,4,3,'#5f7ab8'); }
  else if(kind==='cuore'){
    x.fillStyle='#e04a63';
    x.beginPath();
    x.moveTo(16,21); x.bezierCurveTo(8,15,9,7,16,11); x.bezierCurveTo(23,7,24,15,16,21);
    x.fill();
    px(x,12,11,2,2,'#ff9aae');
  }
  else if(kind==='zzz'){
    x.fillStyle='#5f7ab8'; x.font='bold 13px sans-serif'; x.fillText('z',9,18); x.font='bold 10px sans-serif'; x.fillText('z',18,13);
  }
  objCache[key]=c; return c;
};

/* ===================================================================
   11. RACCORDI FRA TERRENI (autotile)
   Ogni terreno "sborda" su quelli di priorità inferiore con un bordo
   irregolare, così non si vedono più i quadrati.
   =================================================================== */
A.PRIORITA = {
  acqua:0, grotta:1, sabbia:2, lastre:3, assi:3, cotto:3, sentiero:4,
  terra:5, erba:6, neve:6, roccia:7, vuoto:-1
};

/* Maschera del bordo: bianco dove il terreno vicino deve comparire.

   Anche le maschere sono ridisegnate a 64, e non per simmetria: la
   frangia fra due terreni è la cosa più guardata del paesaggio — è quella
   che fa la riva del lago e il ciglio del sentiero — e a 32 il dente più
   piccolo che si potesse fare era largo due pixel a schermo. Adesso ne
   basta uno, e la frangia smette di essere una sega regolare. */
function maskLato(dir, v){
  const c = telaNetta(T,T), x = c.getContext('2d');
  x.fillStyle='#fff';
  const prof = (i)=>{
    /* profondità morbida e irregolare, 10..26 px di mondo. La terza
       sinusoide è nuova e ha periodo corto: a 32 non ci stava dentro —
       sarebbe stata un dente ogni due pixel a schermo, cioè rumore. */
    const n = Math.sin(i*0.275 + v*2.1)*0.45
            + Math.sin(i*0.115 + v*3.7)*0.40
            + Math.sin(i*0.9   + v*1.3)*0.15;
    return 10 + Math.round((n*0.5+0.5)*16);
  };
  for(let i=0;i<T;i++){
    const p = prof(i);
    if(dir==='n')      x.fillRect(i, 0, 1, p);
    else if(dir==='s') x.fillRect(i, T-p, 1, p);
    else if(dir==='w') x.fillRect(0, i, p, 1);
    else if(dir==='e') x.fillRect(T-p, i, p, 1);
    // sfumatura a puntini oltre il bordo: sei invece di tre, e più fitti
    for(let k=0;k<4;k++){
      if(hsh(i,k+v*7,801) > 0.62) continue;
      const q = p + 1 + k*2;
      if(q>=T) break;
      if(dir==='n')      x.fillRect(i, q, 1, 1);
      else if(dir==='s') x.fillRect(i, T-1-q, 1, 1);
      else if(dir==='w') x.fillRect(q, i, 1, 1);
      else if(dir==='e') x.fillRect(T-1-q, i, 1, 1);
    }
  }
  return c;
}

function maskAngolo(dir, v){
  const c = telaNetta(T,T), x = c.getContext('2d');
  x.fillStyle='#fff';
  const cx = (dir==='nw'||dir==='sw') ? 0 : T;
  const cy = (dir==='nw'||dir==='ne') ? 0 : T;
  for(let y=0;y<T;y++) for(let x0=0;x0<T;x0++){
    const d = Math.hypot(x0-cx, y-cy);
    const r = 18 + Math.sin((x0+y)*0.2 + v*2.3)*6;
    if(d < r) x.fillRect(x0,y,1,1);
    else if(d < r+6 && hsh(x0,y+v,802) > 0.55) x.fillRect(x0,y,1,1);
  }
  return c;
}

const bordoCache = {};
/* texture del terreno "tipo" ritagliata sulla maschera del lato "dir" */
A.bordo = function(tipo, dir, v, season){
  const key = tipo+'|'+dir+'|'+v+'|'+(tipo==='erba'?season:'-');
  if(bordoCache[key]) return bordoCache[key];
  const c = telaNetta(T,T), x = c.getContext('2d');
  x.imageSmoothingEnabled=false;
  sovrapponi(x, A.ground(tipo, v, season), T, T);
  x.globalCompositeOperation='destination-in';
  sovrapponi(x, dir.length===1 ? maskLato(dir,v) : maskAngolo(dir,v), T, T);
  x.globalCompositeOperation='source-over';
  bordoCache[key]=c;
  return c;
};

/* piccola ombra interna lungo il bordo: dà spessore al dislivello */
const ombraBordoCache = {};
A.ombraBordo = function(dir, v){
  const key='ob|'+dir+'|'+v;
  if(ombraBordoCache[key]) return ombraBordoCache[key];
  const c = telaNetta(T,T), x = c.getContext('2d');
  x.fillStyle='rgba(0,0,0,0.16)';
  sovrapponi(x, dir.length===1 ? maskLato(dir,v) : maskAngolo(dir,v), T, T);
  x.globalCompositeOperation='source-in';
  x.fillStyle='rgba(30,22,14,0.20)';
  x.fillRect(0,0,T,T);
  ombraBordoCache[key]=c;
  return c;
};

/* ===================================================================
   11b. AIUOLE ARATE CON BORDI
   Il terreno arato non deve leggersi come una griglia di quadrati:
   dove non confina con altra terra arata, il bordo si smussa e prende
   un piccolo argine di terra smossa.
   =================================================================== */
const aratoCache = {};
/* vic = bitmask dei vicini arati: 1=N 2=E 4=S 8=O */
A.arato = function(vic, v, bagnato, season){
  const key = 'ar|'+vic+'|'+v+'|'+(bagnato?1:0);
  if(aratoCache[key]) return aratoCache[key];
  const c = telaNetta(T,T), x = c.getContext('2d');
  x.imageSmoothingEnabled=false;

  // 1. maschera della forma
  const mk = telaNetta(T,T), mx = mk.getContext('2d');
  mx.fillStyle='#fff';
  const er = (i, lato)=>{
    // quanto rientra il bordo su questo lato: 0 se c'è un vicino
    if(vic & lato) return 0;
    return 4 + Math.round((Math.sin(i*0.35 + v*2.3)*0.5+0.5)*4);
  };
  for(let y=0;y<T;y++){
    const dw = er(y, 8), de = er(y, 2);
    for(let x0=0;x0<T;x0++){
      const dn = er(x0, 1), ds = er(x0, 4);
      if(x0 < dw || x0 >= T-de) continue;
      if(y < dn || y >= T-ds) continue;
      mx.fillRect(x0,y,1,1);
    }
  }

  // 2. texture arata ritagliata sulla maschera
  sovrapponi(x, tilledTile(v, bagnato), T, T);
  x.globalCompositeOperation='destination-in';
  sovrapponi(x, mk, T, T);
  x.globalCompositeOperation='source-over';

  // 3. argine: zolle chiare sul bordo esterno
  const argine = bagnato ? '#8a6449' : '#b8946c';
  const argineS= bagnato ? '#3f2b1e' : '#6b4a33';
  for(let i=0;i<T;i++){
    if(!(vic&1)){ const d=er(i,1); if(d){ px(x,i,d,1,2,argine); px(x,i,d+2,1,1,argineS); } }
    if(!(vic&4)){ const d=er(i,4); if(d){ px(x,i,T-2-d,1,2,argineS); px(x,i,T-4-d,1,2,argine); } }
    if(!(vic&8)){ const d=er(i,8); if(d){ px(x,d,i,2,1,argine); px(x,d+2,i,1,1,argineS); } }
    if(!(vic&2)){ const d=er(i,2); if(d){ px(x,T-2-d,i,2,1,argineS); px(x,T-4-d,i,2,1,argine); } }
  }
  aratoCache[key]=c;
  return c;
};

/* Pianta seccata: quello che resta sull'aiuola quando una coltura muore
   fuori stagione o viene calpestata dai cinghiali. Sparisce rizappando
   o riseminando: serve a far vedere che è successo qualcosa, invece di
   trovare la mattina dopo un buco al posto della pianta. */
A.appassita = function(v){
  const key = 'app|'+v;
  if(objCache[key]) return objCache[key];
  const c = tela(U,U), x = c.getContext('2d');
  x.imageSmoothingEnabled=false;
  const steli = 2 + (v%2);
  for(let i=0;i<steli;i++){
    const bx = 12 + i*5 + ((hsh(i,v,861)*3)|0);
    const h  = 5 + ((hsh(i,v,862)*4)|0);
    const pend = (hsh(i,v,863)>0.5 ? 1 : -1);
    for(let k=0;k<h;k++){
      const t = k/h;
      px(x, bx + Math.round(pend*t*t*2.4), 24-k, 1, 1, k>h-3 ? '#6b5334' : '#8a7048');
    }
    // foglia secca accasciata a terra
    px(x, bx + pend*2, 24, 2, 1, '#7a6038');
  }
  px(x, 13, 25, 7, 1, 'rgba(58,42,26,0.45)');
  objCache[key]=c;
  return c;
};

/* ===================================================================
   12. ERBA ANIMATA
   Ciuffi disegnati sopra il terreno, che si piegano col vento e
   quando ci cammini in mezzo.
   =================================================================== */
const ciuffoCache = {};
A.ciuffo = function(season, v, piega){
  const key = 'ci|'+season+'|'+v+'|'+piega;
  if(ciuffoCache[key]) return ciuffoCache[key];
  const S = DATA.SEASONS.find(s=>s.id===season) || DATA.SEASONS[0];
  const c = tela(20,20), x = c.getContext('2d');
  const base = season==='inverno' ? '#b8c8d0' : S.grass;
  /* Chiaro, corpo, ombra: un gradino per parte e basta. Prima il filo
     più chiaro saliva di un gradino e la sua punta di altri due, cioè
     tre sopra l'erba: da lontano il prato sembrava spolverato di sale. */
  const cols = [PAL.passo(base,1), PAL.snap(base), PAL.passo(base,-1)];
  const n = 3 + (v%3);
  for(let i=0;i<n;i++){
    const bx = 6 + i*3 + ((hsh(i,v,811)*3)|0);
    const h  = 5 + ((hsh(i,v,812)*6)|0);
    const col = cols[i%3];
    x.fillStyle = col;
    for(let k=0;k<h;k++){
      const t = k/h;
      // la piega cresce verso la punta
      const dx = piega * t * t * 1.15;
      x.fillRect(Math.round(bx+dx), 16-k, 1, 1);
      if(k>h-3) x.fillRect(Math.round(bx+dx)+(piega>0?-1:1), 16-k, 1, 1);
    }
    // punta più chiara, di un gradino solo
    x.fillStyle = PAL.passo(col, 1);
    x.fillRect(Math.round(bx + piega*1.15), 16-h, 1, 1);
  }
  // fiorellino ogni tanto
  if(season!=='inverno' && (v%4)===0){
    const fx = 8 + Math.round(piega*0.8);
    x.fillStyle = S.accent;
    x.fillRect(fx, 7, 2, 2);
    x.fillStyle = '#fff4d8';
    x.fillRect(fx, 6, 1, 1);
  }
  ciuffoCache[key]=c;
  return c;
};

/* ===================================================================
   13. INCRESPATURE E RIFLESSI D'ACQUA
   =================================================================== */
A.schiuma = function(dir, v, frame){
  const key='sc|'+dir+'|'+v+'|'+frame;
  if(objCache[key]) return objCache[key];
  /* La spuma va a 64 con l'acqua e col raccordo: sta esattamente dove
     passa la frangia fra due terreni, e una riva metà fine e metà a
     gradini si nota più di una riva tutta a gradini. */
  const c = telaNetta(T,T), x = c.getContext('2d');
  for(let i=0;i<T;i++){
    const h = 4 + Math.round((Math.sin(i*0.25 + v*2 + frame*0.7)*0.5+0.5)*6);
    x.globalAlpha = 0.55;
    x.fillStyle = '#eaf6fb';
    if(dir==='n') x.fillRect(i, 0, 1, h);
    else if(dir==='s') x.fillRect(i, T-h, 1, h);
    else if(dir==='w') x.fillRect(0, i, h, 1);
    else if(dir==='e') x.fillRect(T-h, i, h, 1);
    x.globalAlpha = 0.28;
    if(dir==='n') x.fillRect(i, h, 1, 4);
    else if(dir==='s') x.fillRect(i, T-h-4, 1, 4);
    else if(dir==='w') x.fillRect(h, i, 4, 1);
    else if(dir==='e') x.fillRect(T-h-4, i, 4, 1);
  }
  x.globalAlpha=1;
  objCache[key]=c;
  return c;
};

/* ===================================================================
   SVUOTAMENTO DELLE CACHE
   Tutto qui dentro è disegnato una volta e conservato. Se cambiano i
   colori della palette, i disegni conservati sono vecchi: vanno buttati
   e rifatti alla prima richiesta.
   =================================================================== */
const TUTTE_LE_CACHE = [groundCache, waterCache, charCache, faceCache, objCache,
                        iconCache, bordoCache, ombraBordoCache, aratoCache, ciuffoCache,
                        pozzaCache, vignCache];
A.svuotaCache = function(){
  for(const dep of TUTTE_LE_CACHE) for(const k in dep) delete dep[k];
};
if(window.PAL) PAL.suCambio(A.svuotaCache);

})();
