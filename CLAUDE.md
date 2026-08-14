# Istruzioni per Claude Code

Appunti operativi su questo repo. Non è la documentazione del gioco — quella sta
in [README.md](README.md), ed è per chi ci gioca e per chi ci mette le mani.
Qui c'è solo quello che serve a lavorarci senza ricominciare da capo ogni volta:
le convenzioni, com'è montato, come si verifica, e le trappole in cui si cade
due volte se nessuno le scrive.

---

## Regole di lavoro

**I commit vanno sempre su `main`, mai su altri rami.** Istruzione permanente
del proprietario del repo. Vale anche quando la regola generale direbbe di
aprire un ramo.

**Tutto in italiano**: codice, commenti, messaggi di commit, testi di gioco,
nomi di funzione e di variabile. `chiCeDentro`, `nonSiPuo`, `ristampaBurrone`.
Un nome inglese in mezzo stona come una parola straniera in una frase.

**I commenti spiegano il perché, col difetto vero che li ha motivati.** Non
"disegna il cespuglio", ma "metteva sei bacche rosse in ogni stagione, e la
falce dava viole: chi tagliava bacche rosse si ritrovava un fiore in mano".
Chi legge fra un anno deve capire cosa succedeva prima, altrimenti "semplifica"
e il difetto torna. Stessa cosa per i messaggi di commit: cosa non andava,
cosa è stato misurato, cosa è cambiato.

**Si misura prima e dopo.** Questo repo è pieno di correzioni che sembravano
giuste e non lo erano: la pesca ritarata al 100% in 0.7 secondi, il burrone che
lasciava 153 caselle su 153 raggiungibili, le viole che finivano tutte nello
stesso punto. Quasi ogni sezione qui sotto nasce da una misura che ha
contraddetto la prima ipotesi. Se la misura dice che il tuo primo tentativo è
sbagliato, buttalo: è già successo più volte e ogni volta era la misura ad avere
ragione.

**Niente file inventati.** Nessuna dipendenza, nessun asset: sprite e suoni sono
disegnati e sintetizzati nel codice. Se serve un'immagine, si disegna.

---

## Com'è montato

Vanilla JS, zero dipendenze, canvas 2D. Ogni file è una IIFE che appende un
globale. **L'ordine degli script in `index.html` è portante**: `data.js` prima di
tutto, `game.js` per ultimo.

```
data.js  lingua-en.js  lingua.js  palette.js  art.js  fx.js  audio.js
world.js  mobs.js  ui.js  demo.js  changelog.js  landing.js  titolo.js
salvataggio.js  sincronizza.js  pesca.js  storie.js  vicende.js
persona.js  partite.js  diario.js  botteghe.js  solstizio.js  livelli.js  traguardi.js  abitanti.js  paese.js
tutorial.js  guida.js  tocco.js  render.js  game.js   (in fondo: debug.js)
```

Questa lista non va tenuta a mente: un controllo in `tools/coerenza.js`
confronta `js/*.js` con gli script di `index.html`. Un file scritto e mai
caricato non fa rumore — non è un errore di sintassi e non è un test rosso.

**Ma «portante» era un'impressione, e adesso è un numero.** Fra i moduli ci
sono 2.706 riferimenti incrociati e 2.690 stanno *dentro* le funzioni: girano a
partita avviata, quando i file ci sono tutti da un pezzo, e dell'ordine non
sanno niente. Al caricamento ne restano sedici, che fanno **undici** vincoli
d'ordine, ed è tutto quello che «portante» vuol dire:

| chi | vuole prima | perché |
|-----|-------------|--------|
| `art.js`, `render.js` | `palette.js` | `PAL.suCambio(...)`, per buttare le cache quando la palette cambia (protetti da `if(window.PAL)`) |
| `solstizio.js` | `data.js`   | `const POSTI_VEGLIA = DATA.POSTI_VEGLIA`, un alias preso subito |
| `game.js` | `solstizio.js`, `salvataggio.js`, `traguardi.js`, `abitanti.js`, `paese.js` | i riagganci a `G` |
| `partite.js`, `diario.js`, `botteghe.js` | `ui.js` | `const U = UI`: scrivono le loro finestre sullo stesso oggetto |

Il pericolo non sono questi undici, che si reggono: è il dodicesimo. Una riga come
`SND.init()` messa al livello del file funziona finché l'ordine regge, non
rompe niente e non lascia traccia — e il giorno che qualcuno sposta uno
`<script>` la pagina si apre bianca. Un controllo ora li conta e pretende che
siano esattamente quelli previsti (`VINCOLI_NOTI` in `tools/coerenza.js`), **e
diventa rosso anche se smette di vederli**: un rilevatore che non trova più
niente e dice «tutto a posto» è peggio che non averlo.

Due trappole, se lo tocchi: ogni file è avvolto in una IIFE, che è essa stessa
una funzione — chiedere «è dentro una funzione?» risponde sempre sì e il conto
viene zero, il corpo della IIFE *è* il caricamento. E `demo.js` ha un
`const PESCA` che è la sua dimostrazione, non il modulo: la solita omonimia.

| globale    | file          | cosa tiene                                              |
|------------|---------------|---------------------------------------------------------|
| `DATA`     | data.js       | oggetti, colture, ricette, NPC, agende, lettere, sagre  |
| `PAL`      | palette.js    | rampe di colore e lo *snap* (vedi sotto)                |
| `ART`      | art.js        | tutti gli sprite, disegnati e messi in cache            |
| `FX`, `SND`| fx.js, audio.js | particelle e ombre; suoni sintetizzati               |
| `WORLD`    | world.js      | mappe, collisioni, rigenerazione giornaliera            |
| `MOBS`     | mobs.js       | fauna e prede                                           |
| `UI`, `IT` | ui.js         | finestre e HUD; `IT` sono i testi derivati dagli oggetti |
| *(`UI`)*   | partite.js    | le finestre delle partite sul server: **scrive sullo stesso `UI`** |
| *(`UI`)*   | diario.js     | il Diario e la Mappa: **scrive sullo stesso `UI`**       |
| *(`UI`)*   | botteghe.js   | zaino, negozio, banco, fornelli, fucina, Santuario: idem |
| `TITOLO`   | titolo.js     | la scena animata dietro la schermata iniziale           |
| `SALVA`    | salvataggio.js| localStorage, backup, esporta/importa in `.json`        |
| `PESCA`    | pesca.js      | il minigioco: lancio, abboccata, lotta                  |
| `STORIE`   | storie.js     | la lezione di Oreste, la torta di Ilde, il Pesce Luna   |
| `VICENDE`  | vicende.js    | le storie del paese: il motore, i testi stanno in `DATA` |
| `PERSONA`  | persona.js    | zaino, resistenza, scarpe, cintura: negozio ed effetti   |
| `SOLSTIZIO`| solstizio.js  | atto secondo: le sei memorie, la verità, la veglia      |
| `LIV`      | livelli.js    | barretta, carta del livello, scheda delle abilità       |
| `TRAGUARDI`| traguardi.js  | traguardi, Collezione del Naturalista, statistiche      |
| `ABITANTI` | abitanti.js   | agende, cosa dice oggi, passanti e chiacchiere          |
| `PAESE`    | paese.js      | mercato del giorno, eventi notturni, bacheca, sagre, mercante |
| `REND`     | render.js     | il disegno di un fotogramma                             |
| `G`        | game.js       | stato di gioco, input, sistemi (il file più grosso)     |
| `DEBUG`    | debug.js      | il pannello di prova (dopo game.js: legge `G` subito)   |

`game.js` è ~3200 righe e quasi tutte le sue funzioni sono **private al modulo**.
Solo quelle appese a `G.` si chiamano da fuori. Se ti serve provare una funzione
privata dalla console, o la esponi apposta (`G.postaDovuta` nasce così) oppure
la raggiungi dal percorso vero degli eventi.

### Cosa serve per staccare un pezzo di game.js

Ne sono usciti cinque, e si è misurato prima quali si potevano staccare
davvero: per ogni sezione, quante funzioni private di `game.js` usa e da chi è
chiamata. `titolo.js` e `storie.js` non ne usavano **nessuna**,
`salvataggio.js` e `solstizio.js` due, `pesca.js` tre.

**Prima di spostare, guarda cosa c'è davvero dentro una sezione, non come si
chiama.** Le sezioni che sembravano peggio legate — `TITOLO` con 17 dipendenze,
`LA POSTA` con 13 — lo erano perché ospitavano funzioni che non c'entravano:
`nuovaPartita` stava sotto l'intestazione del titolo, `nuovoGiorno` sotto quella
della posta. Al contrario, `PESCA` risultava dipendere da `passo` e `LA LEZIONE
DI ORESTE` pure: erano **omonimie**, `const passo` dentro un ciclo e
`passoLezione`, e in italiano la parola torna nei commenti. Un elenco di
dipendenze si legge, non si crede.

E guarda anche il contrario: cosa di quella sezione serve *fuori*. Con l'atto
secondo se ne stava andando `FASCE_VEGLIA`, che è una memo usata solo da
`G.fasciaAgenda` — l'avrebbe lasciata senza. Restò in `game.js` accanto a
`FASCE_SAGRA`, che fa la stessa identica cosa; poi sono andate via **insieme**,
tutte e due dentro `abitanti.js`, cioè nel file della loro unica lettrice. È il
modo giusto di leggere quella regola: non «non si sposta», ma «si sposta dove
sta chi la usa».

Il prezzo di ogni stacco è nominabile: le funzioni che restano in `game.js` e
servono al file nuovo vanno appese a `G.` — finora `G.statoIniziale`,
`G.normalizzaStato`, `G.spendi`, `G.schizzo`, `G.particelleTesto`, `G.finale`.
Se l'elenco cresce troppo, la sezione non era staccabile.

I file nuovi si caricano **prima** di `game.js` e quindi non possono toccare `G`
al caricamento: lo usano solo dentro le funzioni. Per questo è `game.js` a
riappendere `G.salva` e compagnia a `SALVA`, e `G.eSeraDiVeglia` e compagnia a
`SOLSTIZIO`, e non il contrario.

**Il caso più facile è quello in cui la sezione è già pubblica.** `traguardi.js`
(traguardi, Collezione del Naturalista, statistiche) è uscito per primo del giro
nuovo perché di `game.js` non usava niente — zero private prese, zero proprie
chiamate da fuori — e le sue nove funzioni stavano già tutte appese a `G.`: gli
mancava solo il file. Lì il prezzo è **una riga sola**, `Object.assign(G,
TRAGUARDI)`, e nessun punto di chiamata cambia, perché continuano a essere
`G.obiettivi()` e `G.contaCollezione()` come prima.

Prima di staccare, misura: quante funzioni private della sezione servono fuori,
e quante private altrui usa lei. Con l'albero della sintassi, non con le regex —
la trappola delle omonimie ha già fatto leggere male l'elenco una volta. E dopo
lo stacco, ricordati di `tools/coerenza.js`: alcuni controlli leggono il
*sorgente* di `game.js` cercandoci una funzione per nome, e vanno rimandati al
file nuovo. Ne è saltato uno subito («ogni collezione ha il suo premio»), ed è il
motivo per cui questi controlli valgono.

**Ma quella misura non basta, e il secondo stacco l'ha dimostrato.** Dice quali
*funzioni* si incastrano, non quali *comodità* restano indietro: `abitanti.js`
sembrava pulito — zero private altrui — e appena scritto usava tre nomi che non
aveva, `T`, `$` e `POSTI_SAGRA`. Tre `ReferenceError` che nessun test avrebbe
preso, perché saltano fuori solo quando quella riga gira davvero. Dopo ogni
stacco, quindi, **cerca i nomi orfani**: prendi ogni identificatore del file
nuovo e controlla che sia dichiarato lì, o sia un globale del gioco, o sia del
browser. Le prime due si risolvono ridichiarandole (`const T = 32` ce l'hanno
uguale render.js, mobs.js e pesca.js); la terza era un dato, ed è andata in
`DATA` accanto al suo gemello `POSTI_VEGLIA`, che ci era finito per la stessa
identica ragione.

Altra cosa che il conteggio non vede: **l'alias del modulo può essere
ombreggiato**. In `abitanti.js` il modulo è `AB` e non `A` perché dentro
`fasciaAgenda` c'era già `const A = DATA.AGENDE[id]`.

E dopo, provalo davvero facendo girare il ciclo a mano (vedi più sotto): con
`abitanti.js` la prova che vale è che dieci fotogrammi da 16 ms spostino chi sta
fuori di ~5 px — la velocità nel codice è `0.5*dt/16` — e chi ha la fascia
`interno` di zero, perché quello resta piantato davanti a casa sua.

**Non tutto vive nel fotogramma, però.** `paese.js` vive nel *passaggio del
giorno*, e lì il ciclo non c'entra: `dormi()` fa `setTimeout(nuovoGiorno, 1100)`.
Chiamarlo otto volte di fila non fa passare otto giorni — la prima chiamata mette
`G.p.dorme` e le altre sette escono subito dalla guardia in cima. Per far
scorrere i giorni bisogna aspettare davvero fra l'una e l'altra, e rimettere
`G.p.dorme = false`. Con quello si vede il mercato cambiare ogni giorno, il
mercante arrivare al settimo, e la sagra montare a stagione.

E la prova che vale di più dopo uno stacco è quella che **attraversa i file**.
Per la sagra sono tre: `paese.js` dice che oggi è festa (`G.eGiornoDiSagra`),
`abitanti.js` per un giorno scavalca l'agenda, e i posti in piazza li legge da
`DATA.POSTI_SAGRA`. Che il giro di Bruno restituito dall'agenda sia *identico* a
`DATA.POSTI_SAGRA.bruno` è una riga di verifica che tiene insieme tre moduli.

Dopo una rinomina meccanica di punti di chiamata, la prova che vale è questa,
dalla console: prende dal sorgente ogni `MODULO.funzione` che `game.js` chiama e
controlla che esista davvero. Un nome storto, altrimenti, si scopre solo quando
il giocatore clicca proprio quella scelta lì.

```js
fetch('js/game.js').then(r=>r.text()).then(src=>{
  for(const m of src.matchAll(/\b(STORIE|SOLSTIZIO|PESCA|SALVA|TITOLO)\.(\w+)/g))
    if(typeof window[m[1]][m[2]] !== 'function') console.warn('manca', m[0]);
});
```

### Staccare da ui.js è tutta un'altra cosa, e costa meno

Misurato prima di toccarlo: 31 sezioni, 41 dichiarazioni private, 50 funzioni
pubbliche — e **solo 8 private su 41 attraversano un confine di sezione**. Sette
di quelle otto ne attraversano *una sola*, quasi sempre la sezione accanto;
l'unica davvero condivisa è `ico` (13 sezioni), che è già esposta come `U.ico`.
Per confronto, in `game.js` le tre sezioni del cuore ne usano 10, 8 e 13 a
testa. `ui.js` non è aggrovigliato: **è una pila di finestre indipendenti sopra
una base piccola.**

E qui il meccanismo è un altro. Tutto è già `U.qualcosa` o `IT.qualcosa`, quindi
un file caricato **dopo** `ui.js` scrive sullo stesso oggetto — `const U = UI` in
cima, e basta. Vuol dire **zero punti di chiamata da riscrivere**: `game.js`
continua a dire `UI.scegliPartita()` senza sapere che è cambiato file. Da
`game.js` invece ogni stacco costava la riscrittura dei punti di chiamata (11
per `paese.js`, 4 per `abitanti.js`) più il riaggancio a `G`.

Scrivi `const U = UI` e **non** `window.UI`: se `ui.js` non c'è, così si ferma
subito con un errore leggibile invece di lasciarti `undefined` in mano dieci
schermate dopo — e soprattutto è l'unico modo perché il controllo sull'ordine di
caricamento lo veda, perché `window.UI` per lui è un accesso a proprietà e gli
passa sotto il naso.

Il resto della base che serve a un file nuovo è: `$`, `T` (**165 usi**), `F`,
`NUM`, `ico`. `ico` si prende con `const ico = U.ico`; gli altri sono gusci di
una riga sopra `LINGUA`, e si ridichiarano — come ha fatto `solstizio.js` con
`fraseF`. Il file nuovo, appena scritto, va passato allo scanner dei nomi
orfani: è l'unica rete che prende una di queste dimenticate.

**E porta via anche le comodità che hanno un lettore solo.** Con `diario.js` se
n'è andata `spoglia` (toglie i tag da `IT.dove` quando quel testo va in un
attributo `title`): stava scritta accanto a `IT.dove`, ma il solo posto che la
usava era il Diario. Stessa regola delle fasce dell'agenda — una comodità non
sta dove è nata, sta dove sta chi la usa.

Fatti finora: `partite.js` (578 righe), `diario.js` (Diario + Mappa, 766) e
`botteghe.js` (zaino, negozio, banco, fornelli, fucina, Santuario: 610). `ui.js`
da 3.483 a 1.540 righe. **Resta un blocco solo**, `IL MENU` + le demo animate
(400 righe, gli serve solo `ico`); dopo quello `ui.js` starebbe sulle ~1.130, e
quello che rimane è il nocciolo vero — `IT` e «dove si trova», toast, modale,
dialogo, «quante ne prendi», cassa, macchina, regalo, cartello.

### Firme che sorprendono

Diverse funzioni prendono `G` come **primo parametro**, non dal globale. Chiamarle
male dà errori che sembrano bug del gioco e non lo sono:

```js
REND.disegna(G)                  // non (timestamp)
UI.cassa(G, obj, ox, oy)
UI.diario(G, tab)
UI.negozio(G, 'bruno')
UI.lettera(key, dopo)            // questa invece NON prende G
ART.placeable(kind, opt)         // opt entra nella chiave di cache
```

### La palette aggancia i colori

`PAL.vincola()` sostituisce `fillStyle`/`strokeStyle` sul prototipo del contesto:
**ogni colore opaco viene agganciato al gradino più vicino della sua rampa.**
Sono 173 colori ammessi in tutto.

Conseguenza pratica, che è già costata un giro: due tinte vicine si agganciano
allo stesso gradino e diventano identiche. `#8a6038` e `#7a5432` finiscono
entrambi su `#8a5c34`. Se due elementi devono restare distinti, controlla:

```js
PAL.snap('#8a6038')   // → '#8a5c34'
```

---

## Come si verifica

```bash
npm test
```

`tools/coerenza.js`: **54 controlli** sui dati e sulle mappe, senza dipendenze —
carica i moduli in un finto `window`. Il primo controlla che ogni file `.js` sia
sintatticamente valido, e non è pignoleria: un apostrofo non protetto dentro una
stringa fa fallire il caricamento in silenzio e nel browser resta una pagina
bianca. È scattato due volte per davvero.

L'unico che fa eccezione alla regola «senza dipendenze» è quello sull'ordine di
caricamento: per sapere se un riferimento è al livello del file o dentro una
funzione ci vuole un parser vero, e usa `typescript`, che è già lì per
`npm run check`. Se manca, **si salta dicendolo** — compare nell'elenco come
`ordine di caricamento: SALTATO` — così `node tools/coerenza.js` continua a
girare su un clone appena fatto senza `npm install`.

I controlli non descrivono le decisioni: **le impongono**. Quando correggi
qualcosa che una misura ha scoperto, aggiungi il controllo che la tiene ferma —
è il modo migliore per non doverla ricordare. Esempi già dentro: nella radura ci
si arriva solo col ponte (da mappa nuova *e* da salvataggio vecchio); ogni
lettera scritta è consegnata da qualcosa e firmata da qualcuno che esiste; il
frutto del cespuglio è foraggio della sua stagione.

```bash
npm run check      # tsc --noEmit sui JSDoc
npm run verifica   # test + check
npm run serve      # http://localhost:8123, senza cache
```

### I livelli

Cinque abilità, dieci livelli, e **un solo posto per ogni numero**:

- `DATA.XP_LIV` — le soglie
- `DATA.BONUS` — i coefficienti veri, letti sia da chi li applica
  (`game.js`, `pesca.js`, `mobs.js`) sia da chi li racconta
- `DATA.BONUS_TESTO[k](liv)` — le frasi, calcolate da `DATA.BONUS`
- `DATA.PREMI_LIVELLO[k][liv]` — monete e oggetto di ogni salita
- `G.xp(k, n)` — l'unica porta: accorge la salita, paga, annuncia
- `LIV.progresso(k)` — «a che punto sono», per tutti e tre i posti che lo mostrano

**Non scrivere un numero di bilanciamento in due posti.** Questa sezione
nasce da una divergenza già avvenuta: la scheda prometteva «barra di pesca
+7px per livello» mentre `pesca.js` ne dava 8, e della Caccia non diceva
niente perché l'elenco a mano si era fermato a quattro abilità su cinque.
Un controllo in `tools/coerenza.js` adesso verifica che ogni premio esista
fra gli oggetti, che le monete crescano di livello in livello e che nessuna
frase contenga `NaN`.

Se aggiungi un bonus a `BONUS_TESTO`, **implementalo**: «Passo più leggero»
è nato così — la frase c'era, l'effetto no, e le prede continuavano a
scappare alla stessa distanza. Ora `mobs.js` stringe il raggio di fuga, col
tetto (`uditoMax`) scritto in `DATA` e non nel codice, perché con `udito` a
0.08 la scheda avrebbe promesso l'80% e il gioco si sarebbe fermato al 60%.

Se lo zaino è pieno l'oggetto **non si perde**: va in `G.premiSospesi`, si
ritira dalla scheda, e viaggia nel salvataggio. È il caso normale, non
quello raro: si sale di livello raccogliendo, cioè con lo zaino pieno.

Le carte di livello si mettono **in coda** (un colpo può valere più livelli:
la lezione di Oreste ne dà 40 in una volta). Fra una carta e l'altra passano
260 ms di schermo vuoto: per sapere se la coda è finita usa `LIV.inCoda()`,
non «esiste `.liv-velo`?» — quella domanda risponde male proprio in quei
260 ms, ed è già costata un giro di verifica.

### Il pannello di prova

`js/debug.js` monta una linguetta **debug** in basso a destra: monete, oggetti,
tempo, meteo, tutti i luoghi, le braci, l'atto secondo passo per passo, le
catene narrative, e un «Tutto quanto» che apre la partita da ogni parte. Serve a
raggiungere in un clic pezzi di gioco che altrimenti vogliono quattro stagioni.

**Adesso è sempre visibile, per scelta del proprietario e in via provvisoria.**
Dentro `richiesto()` c'è già scritto, e provato, il corpo che lo riaccende solo
su localhost e con `?debug`: quando il gioco esce, si rimette quello.

Due regole che il pannello si dà, e che conviene tenere se lo si allarga:

- **passa dalle funzioni del gioco**, mai da scorciatoie sue. Le braci si
  accendono nicchia per nicchia con `DATA.SANTUARIO`, non con `G.braci = 4`, che
  lascerebbe la partita in uno stato che giocando non capita mai. Il giorno dopo
  arriva da `G.dormi()`, che vende la cassa, fa crescere i campi e tira il meteo.
- **ogni bottone dice cosa ha combinato.** «+10 Rapa», oppure «zaino pieno: ne
  sono entrate 3 su 10». Un bottone che non fa niente perché lo zaino è pieno,
  senza quella riga, sembra un bottone rotto.

La casella di ricerca degli oggetti ferma `keydown`/`keyup`/`keypress` prima che
arrivino a `window`: il gioco ascolta la tastiera lì e **non guarda da dove viene
il tasto**, quindi scrivere «rapa» farebbe camminare il giocatore, aprirebbe lo
zaino sulla «a» e darebbe una zappata sulla barra spaziatrice. Vale per qualunque
campo di testo che venga aggiunto in futuro.

### Verificare nel browser

Il pannello browser **non compone**: `requestAnimationFrame` non scatta mai,
quindi non si fanno screenshot del DOM e il gioco non gira da solo. Si lavora
così: si chiama il disegno a mano e si legge il canvas.

**Il loop però si può far girare a mano**, ed è l'unico modo di misurare quello
che vive dentro al fotogramma — la velocità di cammino, le prede che scappano,
il tempo che passa. La richiamata di `requestAnimationFrame` si intercetta
**prima** che la partita cominci, e poi la si chiama con l'orologio che decidi
tu. Con la prova di taratura davanti: dieci fotogrammi da 16 ms devono spostare
il giocatore di 11,8 px, che è la velocità base (`1.18`) per dieci.

```js
window.__giri=[];
const vero=window.requestAnimationFrame.bind(window);
window.requestAnimationFrame=cb=>{ window.__giri.push(cb); return vero(cb); };
// ...poi si comincia la partita, e da lì:
let t=1000;
const passo=ms=>{ const cb=window.__giri.pop(); t+=ms; window.__giri.length=0; cb(t); };
```

```js
REND.disegna(G);
const dati = document.querySelector('canvas').toDataURL('image/png');
await fetch('http://127.0.0.1:8131/nome.png', { method:'POST', body: dati });
```

(un ricevitore che salva i PNG su file va messo in piedi a parte, sulla 8131;
il pannello mostra le immagini ma non la pagina).

Per il DOM si misura invece di guardare: `getBoundingClientRect` per la
geometria, `elementFromPoint` per sapere **chi sta davvero sopra** — una finestra
può avere le classi giuste, le misure giuste e stare dietro alla pagina di
presentazione, ed è successo.

### Le trappole del pannello (ci si casca due volte)

Sono tutte conseguenze del fatto che il loop non gira. Ognuna produce un
risultato che *sembra* un esito del test e non lo è:

- **`p.usoT` non scende.** Dopo un colpo di attrezzo ogni uso successivo resta
  bloccato: la seconda picconata "non funziona" e sembra un bug. `G.p.usoT = 0`
  prima di ogni colpo simulato.
- **`G.bersaglio` è vecchio o nullo.** Lo aggiorna `calcolaBersaglio()`, che gira
  su `mousedown`. Simula il `mousedown` sul canvas invece di chiamare l'azione.
- **La lettera d'apertura si mangia i tasti.** A partita nuova `#letter` è aperta
  e il gestore di `keydown` esce subito: premere E non fa niente e sembra che E
  sia rotto. Chiudila prima:
  `document.getElementById('letter').querySelector('.letter-btn').click()`.
- **`nonSiPuo()` non ripete lo stesso messaggio per 2.6 s.** Due prove uguali di
  fila: la seconda non dice niente.
- **Il pannello a volte è 0×0** e allora ogni misura di geometria è finta.
  Controlla il rettangolo del canvas prima di fidarti.

**La prova di determinismo del disegno**: congela `G.tempoMs`, chiama
`REND.disegna(G)` due volte, confronta i pixel. Zero differenze è la norma; una
differenza è un `Math.random` (o uno stato che avanza) in un percorso
per-fotogramma — così è saltata fuori la pioggia che cadeva 2,4× più veloce
sui monitor a 144Hz. Due trappole di misura collegate: `getImageData` spinge
il canvas in modalità software (mai profilare il disegno dopo aver letto i
pixel), e `performance.memory` cresce per giri interi senza che sia una
perdita — i canvas sono memoria esterna, V8 non li sente e rimanda il GC.
Prima di dichiarare una perdita, applica pressione di allocazione e guarda se
il pavimento torna giù.

**Metti sempre una prova di taratura davanti.** Un test che dice "la staccionata
è ancora lì" viene verde sia che il tasto funzioni sia che non parta affatto.
Prima verifica che il percorso giri (E su una cassa la apre), poi misura la cosa
che ti interessa. È già successo di prendere per buono un verde che non voleva
dire niente.

---

## Cose da sapere sui salvataggi

- Gli oggetti si serializzano per **indice lineare** (`i = y*larghezza + x`), con
  `w`/`h` a fianco: se le misure della mappa cambiano, il ripristino si salta.
- **Il terreno viaggia nel salvataggio.** Quindi se cambi il paesaggio in
  `world.js`, chi ha una partita avviata si riporta dietro quello vecchio. È il
  motivo di `W.ristampaBurrone`, chiamata dopo il ripristino: il burrone lo
  decidiamo noi, non il giocatore. Stessa attenzione per ogni terreno *scritto*
  che diventi importante.
- **Il terreno è compresso in RLE** (`gr`: coppie valore/quante volte), ma i
  salvataggi vecchi con `g` pieno si leggono ancora: `deserializzaMappa`
  accetta entrambi. Misurato prima di farlo: il file era 170 KB e per il 98,6%
  era `maps` — ma dentro `maps` il grosso non era il terreno (che in RLE fa
  ~1 KB a mappa), erano i ~2.300 oggetti del mondo scritti come JSON. Quelli
  NON si comprimono: un codec a mano sopra i salvataggi è rischio vero per
  27 KB di guadagno, con 5 MB di quota. Se un giorno i salvataggi crescono
  davvero, la strada è IndexedDB, non un compressore artigianale.
- **Gli interni non ripristinano l'arredamento scritto**, solo casse e macchinari
  del giocatore. Nasce da un difetto vero: nella finestra fra due versioni un
  salvataggio si è riscritto l'arredamento sbagliato con le misure nuove, e da lì
  in poi il controllo sulle misure non se ne accorgeva più — il letto restava
  dietro al camino per sempre.
- Quando sposti roba del giocatore, **traslocala, non cancellarla**, e verso un
  posto che sia raggiungibile nello stato in cui si trova la partita.

---

## Dove guardare per primo

- Un oggetto non si trova, o non si capisce da dove viene → `IT.dove()` in
  `ui.js`: ricava la provenienza dai dati, quindi resta vera da sola.
- Qualcosa non si raggiunge a piedi → una BFS in `tools/coerenza.js`; usane una a
  8 vicini, che è più permissiva del movimento vero: se dice "chiuso" è chiuso.
- Un abitante non è dove dovrebbe → `DATA.AGENDE` e `G.orarioInterno`.
- Uno sprite è sbagliato in una stagione sola → cerca la tabella stagionale: se è
  scritta dentro a una funzione, il disegno non la conosce. È il difetto che ha
  fatto nascere `DATA.CESPUGLIO`.

---

## Cosa **non** mettere in un file

L'elenco dei lavori fatti sta già in tre posti che si aggiornano da soli:
`git log` (i messaggi sono lunghi apposta e spiegano il perché), `js/changelog.js`
(la versione per chi gioca) e i commenti nel codice, che tengono il difetto
accanto alla riga che lo corregge.

Un quarto elenco a mano si scollerebbe dagli altri nel giro di poche settimane.
È esattamente la lezione che sta scritta in `LEGGIMI.md`: era una copia del
README, e due copie della stessa cosa finiscono sempre per raccontare due storie
diverse.
