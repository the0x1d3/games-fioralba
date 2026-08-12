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
data.js  palette.js  art.js  fx.js  audio.js  world.js  mobs.js
ui.js  demo.js  changelog.js  landing.js  titolo.js  salvataggio.js
pesca.js  storie.js  solstizio.js  tutorial.js  guida.js
render.js  game.js
```

Questa lista non va tenuta a mente: un controllo in `tools/coerenza.js`
confronta `js/*.js` con gli script di `index.html`. Un file scritto e mai
caricato non fa rumore — non è un errore di sintassi e non è un test rosso.

| globale    | file          | cosa tiene                                              |
|------------|---------------|---------------------------------------------------------|
| `DATA`     | data.js       | oggetti, colture, ricette, NPC, agende, lettere, sagre  |
| `PAL`      | palette.js    | rampe di colore e lo *snap* (vedi sotto)                |
| `ART`      | art.js        | tutti gli sprite, disegnati e messi in cache            |
| `FX`, `SND`| fx.js, audio.js | particelle e ombre; suoni sintetizzati               |
| `WORLD`    | world.js      | mappe, collisioni, rigenerazione giornaliera            |
| `MOBS`     | mobs.js       | fauna e prede                                           |
| `UI`, `IT` | ui.js         | finestre e HUD; `IT` sono i testi derivati dagli oggetti |
| `TITOLO`   | titolo.js     | la scena animata dietro la schermata iniziale           |
| `SALVA`    | salvataggio.js| localStorage, backup, esporta/importa in `.json`        |
| `PESCA`    | pesca.js      | il minigioco: lancio, abboccata, lotta                  |
| `STORIE`   | storie.js     | la lezione di Oreste, la torta di Ilde, il Pesce Luna   |
| `SOLSTIZIO`| solstizio.js  | atto secondo: le sei memorie, la verità, la veglia      |
| `LIV`      | livelli.js    | barretta, carta del livello, scheda delle abilità       |
| `REND`     | render.js     | il disegno di un fotogramma                             |
| `G`        | game.js       | stato di gioco, input, sistemi (il file più grosso)     |
| `DEBUG`    | debug.js      | il pannello di prova (dopo game.js: legge `G` subito)   |

`game.js` è ~3500 righe e quasi tutte le sue funzioni sono **private al modulo**.
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
`G.fasciaAgenda` — l'avrebbe lasciata senza. È rimasta in `game.js`, accanto a
`FASCE_SAGRA` che fa la stessa identica cosa.

Il prezzo di ogni stacco è nominabile: le funzioni che restano in `game.js` e
servono al file nuovo vanno appese a `G.` — finora `G.statoIniziale`,
`G.normalizzaStato`, `G.spendi`, `G.schizzo`, `G.particelleTesto`, `G.finale`.
Se l'elenco cresce troppo, la sezione non era staccabile.

I file nuovi si caricano **prima** di `game.js` e quindi non possono toccare `G`
al caricamento: lo usano solo dentro le funzioni. Per questo è `game.js` a
riappendere `G.salva` e compagnia a `SALVA`, e `G.eSeraDiVeglia` e compagnia a
`SOLSTIZIO`, e non il contrario.

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

`tools/coerenza.js`: **35 controlli** sui dati e sulle mappe, senza dipendenze —
carica i moduli in un finto `window`. Il primo controlla che ogni file `.js` sia
sintatticamente valido, e non è pignoleria: un apostrofo non protetto dentro una
stringa fa fallire il caricamento in silenzio e nel browser resta una pagina
bianca. È scattato due volte per davvero.

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
