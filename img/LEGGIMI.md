# img/ — l'arte che non è disegnata in codice

Qui stanno gli sprite **rimpiccioliti**, quelli che il gioco carica davvero.
I sorgenti ad alta risoluzione **non stanno nel repository**: sono decine
di megabyte l'uno, non li serve nessuno, e restano sul disco di chi
disegna. Qui c'è solo quello che il gioco carica davvero.

## Perché non sono disegnati in codice

Fino a qui la regola del repo era «niente file inventati: sprite e suoni si
disegnano nel codice», ed è ancora vera per tutto il resto. Questi sono
un'eccezione voluta: sono disegnati a mano dal proprietario, a una densità
che in codice non si riproduce.

## Come si rimpiccioliscono

**A metà per volta, non in un colpo solo.** Passare da 1066 px a 192 con un
`drawImage` unico fa campionare al browser un pixel ogni cinque e il
risultato sgrana; dimezzando a ogni passo, ogni pixel di partenza finisce
nella media. È il motivo per cui l'intaglio della testata sopravvive.

Il rimpicciolimento si fa nel browser (canvas), non con uno strumento a
riga di comando: `tools/` non ha dipendenze e Node da solo non sa leggere
un PNG. Il risultato si committa qui.

## Le misure, e da dove vengono

Sono l'impronta in caselle moltiplicata per la casella. Con la casella a
**64**:

| file | impronta | misura |
|------|----------|--------|
| letto.png    | 2×3    | 128×192 |
| tavolo.png   | 2×1,5  | 128×96  |
| sedia.png    | 1×1,5  | 64×96   |
| baule.png    | 1,5×1  | 96×64   |
| camino.png   | 1,5×2  | 96×128  |
| forno.png    | 1,5×1,5| 96×96   |
| lanterna.png | 0,75×1,5 | 48×96 |
| cartello.png | 1,5×1,5 | 96×96 |
| spaventapasseri.png | 1,5×1,5 | 96×96 |
| scrivania.png | 1,5×1,5 | 96×96 |
| omino.png    | 1×1,5  | 64×96 a cella, 256×384 il foglio |

Gli ultimi tre stanno FUORI dalle stanze e appoggiano su un'impronta di
**una** casella: il disegno sborda in su, come la sedia. Un cartello
alto quanto la sua casella sarebbe un cartello per terra.

Il loro PNG è quadrato ma il disegno dentro non lo è — 923×1019 il
cartello col suo palo, 669×1062 lo spaventapasseri, 960×703 la
scrivania — e il vuoto intorno **non va ritagliato**: è quello che li
tiene alla stessa scala l'uno con l'altro. Ritagliando ognuno sul
proprio contenuto, la scrivania sarebbe venuta alta quanto lo
spaventapasseri.

Se la casella cambia va riesportato tutto, e per farlo servono i
sorgenti: si rimettono in una cartella `sprite-new/` (che il
`.gitignore` tiene fuori dal repo) e si rifà il giro descritto qui.

Le **icone dello zaino** — tutte e **136**, cioè una per ogni voce di
`DATA.ITEMS` — fanno eccezione a tutta questa tabella: non stanno nel
mondo, stanno nelle finestre, e in caselle non si misurano. Sono
**128×128** e le dichiara `DATA.ICONE`, che è un elenco di NOMI: il
file si chiama come l'oggetto, e aggiungerne una è aggiungere un nome.

Sono state ritagliate da un foglio solo, e tre cose vanno sapute perché
si rifarà:

- **una scala sola per tutte.** Ritagliando ognuna sul suo contenuto e
  portandola a riempire il quadrato, una fragola verrebbe grande quanto
  una zucca. Nel foglio le proporzioni fra un oggetto e l'altro ci sono
  già, e la scala si prende dal disegno più grande.
- **le scritte sotto le icone vanno tolte, e non sono rade.** Sono dieci
  per riga e messe insieme fanno una banda densa quanto le icone:
  cercarle come «righe con pochi pixel» non funziona. Sono però testo,
  quindi alte uguali in tutte le righe — 15-17 pixel — e si tagliano
  contando dal fondo.
- **le schegge dei vicini.** Un'icona che sborda dal suo riquadro entra
  in quello accanto. Si riconoscono perché toccano il bordo della
  finestra e sono piccole; un pezzo vero — un chicco d'uva staccato, una
  nocciola — o è grande o sta dentro.

**Il nome dell'oggetto non basta a fare il nome del file**, e quattro lo
dimostrano: `cartello`, `spaventapasseri`, `forno` e `lanterna` hanno
DUE disegni — quello nel mondo e l'icona — e il file dell'icona prende
il suffisso `-icona`. Le prime due si sapevano; le altre due le ha
trovate il controllo, dopo che l'esportazione aveva sovrascritto il
forno della cucina con la sua icona. Adesso c'è un controllo apposta:
due tabelle non possono dichiarare lo stesso file.

Perché 128 e non 64: la stessa icona si mostra a misure diverse in giro
per il gioco — 22 px nella scheda delle abilità, 40 nello zaino, 42 nel
toast, 46 nella carta del livello — e su uno schermo a densità doppia
quel 46 sono 92 pixel veri. A 64 il caso più grande sarebbe arrivato
stirato, che è lo stesso difetto della mappa della valle. Sette file,
76 KB in tutto.

Attenzione al filtro, che è la trappola: il CSS mette
`image-rendering:pixelated` su tutte le icone, ed è giusto per una tela
disegnata in codice, che è 32 px e si INGRANDISCE. Un PNG da 128 invece
si RIMPICCIOLISCE, e a scalini netti il browser butta due pixel su tre
invece di farne la media — il filo della falce si spezzetta. Chi mette
l'icona in pagina lo distingue con `ART.iconaAMano(id)` e le mette la
classe `.ico-mano`, che rimette il filtro liscio.

`omino.png` è l'unico che non è un'immagine sola: è un FOGLIO di celle
64×96, quattro fotogrammi per riga e una riga per direzione — giù,
sinistra, destra, su. Chi lo legge è `DATA.OMINO`, e l'altezza del file
deve corrispondere ESATTAMENTE alle righe che dichiara.

Da solo pesa 149 KB dei 277 di questa cartella, e non è un errore: sono
46.117 pixel disegnati con 29.336 colori diversi, cioè quasi uno per
pixel. Quantizzare a 5 bit per canale lo porterebbe a 113 KB, ed è stato
misurato e scartato: 36 KB non valgono il rischio di righe di banding
sulla paglia del cappello, che è proprio la densità per cui questi file
esistono invece di essere disegnati in codice.

## Le nove facciate, e la luce che non sta nel file

Un file per edificio, e **uno solo**: `casa.png`, `bottega.png`, `fucina.png`,
`locanda.png`, `cottage.png`, `capanna.png`, `pollaio.png`, `serra.png`,
`santuario.png`. Li dichiara `DATA.EDIFICI`.

La larghezza è **esattamente l'impronta in caselle per 64** — casa 7 caselle
→ 448, locanda 8 → 512 — e non è pignoleria: `disegnaEdificio` scala lo
sprite per farlo stare nell'impronta, e con una scala diversa da 1 alcune
colonne di pixel escono larghe due e altre tre. È lo stesso motivo per cui le
nove facciate *in codice* erano state riportate all'impronta quando la casella
è passata a 64. L'altezza invece se la porta il disegno.

Quell'altezza però conta anche per un'altra ragione, ed è la trappola: la
parte di tetto che sborda sopra l'impronta diventa **muro**, e quanta sia lo
dice `PROPORZIONI` in `world.js`. Quel numero si legge quando la mappa nasce,
cioè quando le immagini non sono ancora arrivate, quindi non può dipendere da
quale dei due disegni si vedrà: vale il **più alto fra quello a mano e quello
in codice**. Tre controlli in `tools/coerenza.js` tengono ferma la cosa.

**La notte non è un secondo file.** La scena la tinge già di blu
`FX.gradazione`, e quello che manca è solo la luce che esce dai vetri. Quella
la mette il gioco, in due posti che vanno insieme:

- `G.luci()` accende una luce **per finestra** — non una sola in mezzo alla
  facciata, come faceva prima — e quella luce buca il velo del buio e prende
  il bloom. Senza questa, qualunque cosa si dipinga sullo sprite viene spenta
  un attimo dopo: misurato, il vetro veniva un marroncino alto come il muro.
- `render.js` dipinge il vetro caldo e piatto, più l'alone che cade sul muro
  intorno. I riquadri stanno in `DATA.EDIFICI` come frazioni dello sprite, e
  sono quelli del **vetro**, non della finestra: prendendo anche la cornice si
  scalda il legno e sembra una finestra incendiata.

Stessa strada per la forgia della fucina, che arde anche di giorno.

**Il Santuario è il caso a parte**, e ha cinque disegni: uno per brace accesa.
Lì le braci e la lanterna sono DISEGNATE, quindi il gioco non dipinge la
fiamma — mette solo l'alone, che serve a bucare il velo del buio e a tingere
la pozza di verde, giallo, arancio e azzurro. I quattro colori restano quelli
della facciata in codice: accendere una brace non può cambiare tinta a seconda
di quale disegno è arrivato.

**Cosa manca ancora**, e va disegnato:

**Le varianti di livello** hanno la chiave `tipo_liv` e stanno in mezzo alle
altre, non annidate: `IMG.precarica` scorre l'oggetto per sapere cosa
scaricare, e una voce annidata resterebbe a terra senza dire niente.
`ART.edificio(tipo, liv)` prova `tipo_liv` e ripiega su `tipo`, così un
livello senza disegno suo tiene quello di prima. E la variante **eredita**
dalla base quello che non ridichiara: le quattro nicchie del Santuario stanno
dove stanno a zero braci come a quattro, e scriverle cinque volte vuol dire
vederle divergere al primo ritocco.

Ce ne sono due famiglie: `casa_1`, la casa ampliata di `casa2` — più grande,
con la falda in più e cinque finestre invece di due — e `santuario_1..4`, una
per brace accesa. Per il Santuario il «livello» non è `e.liv` ma `G.braci`:
lo decide `G.livelloEdificio`, che è l'unico posto dove quella regola sta
scritta.

**E c'è la STAGIONE**, col suffisso `_neve`: `rovina_pollaio_neve`,
`casa_neve`, e volendo `casa_1_neve`. Si prova dal più specifico al più
generale e vince il primo che ha davvero il suo file, quindi la neve si può
aggiungere **un edificio per volta** senza che gli altri se ne accorgano.

La differenza fra le due famiglie non è solo di nome, ed è la regola da
ricordare: un LIVELLO può cambiare misura, perché la casa ampliata è un'altra
casa; una STAGIONE no. Una variante innevata dev'essere **alta e larga uguale**
a quella da cui deriva, o il giorno che nevica il tetto fa un saltello — ed è
esattamente quello che era successo col Santuario, dove due righe del foglio
erano alte 247 e tre 248, e la terza brace faceva sobbalzare il tempio di due
pixel. Un controllo lo pretende.

**Cosa manca ancora**, e va disegnato: le **varianti innevate**. Il gioco non
le ha mai avute — nessuna delle facciate in codice guarda `opt.season` — e i
disegni ci sono solo per la casa ampliata (`Upgrade Casa 03` e `04`). Per
farne una stagione servono tutti e nove, o d'inverno metà paese avrebbe la
neve sul tetto e l'altra metà no.


## Come si allinea una camminata

I sorgenti arrivano **ritagliati stretti**, ognuno sul proprio contenuto,
e quindi di misura diversa l'uno dall'altro (335×553 … 335×578 di
fronte, 289-307 di lato). Ritagliare ognuno sulla propria sagoma fa
saltellare il personaggio, perché a ogni passo la figura cambia altezza.

I due punti fermi da cui si ricava la cella sono:

- il **bordo basso** della sagoma, che è il piede piantato a terra, e va
  sempre sulla stessa riga (93 su 96);
- il **centro orizzontale della falda del cappello** — la fascia alta
  della sagoma — che nel passo non oscilla, mentre braccia e gambe sì,
  e va sempre nella stessa colonna (31 su 64).

La scala è **una sola per tutti i fotogrammi e tutte le direzioni**: se
ogni riga si normalizza da sé, il contadino cambia statura girandosi. Di
lato la figura viene 85 px dove di fronte ne fa 92, il 3,4% più bassa, ed
è come è disegnata: la riga di fronte varia già di suo del 4,7% fra un
passo e l'altro, quindi stirare i profili aggiungerebbe un errore più
grande di quello che toglie.

## La camminata con l'attrezzo in mano

Un foglio per attrezzo (`omino-ascia.png` e compagni, `DATA.OMINO_ATTREZZI`),
stessa griglia di quattro fotogrammi per quattro direzioni, **celle
96×112 e non 64×96**: con l'attrezzo la figura esce dai bordi, e
misurando l'ingombro servivano 6 px a sinistra, 11 a destra e 5 sopra.
In una cella da 64 i fotogrammi si pestano, e si vede come un pezzo
d'ascia attaccato alla schiena del fotogramma accanto.

Il renderer non ha numeri scritti a mano: centra sulla larghezza e
appoggia in fondo. Basta quindi che nel foglio la **testa stia in mezzo**
(colonna 47 di 96) e i **piedi sul fondo** (riga 109 di 112) — che sono
le stesse quote di `omino.png` riportate alla cella nuova. Misurato dopo
sulla tela vera: il piede cade allo stesso pixel a mani vuote e con
tutti e tre gli attrezzi, scarto zero.

**Qui la scala è per RIGA, non una sola.** È il contrario di quanto vale
per la camminata a mani vuote, e la ragione è nei file: la riga di
spalle arriva esportata dal 10 al 23% più piccola delle altre, che è
troppo per essere un modo di disegnare. Il riferimento non è il file
stesso ma `omino.png`: si misura il corpo — dalla cima del **cappello**
ai piedi, non della sagoma, perché un'ascia alzata o un arco tenuto
dritto arrivano più su della testa — e si porta ogni riga all'altezza
della riga corrispondente della camminata a mani vuote. Così il
contadino non cambia statura né girandosi né prendendo in mano qualcosa.

Dentro alla riga il saliscendi del passo si tiene: la scala si prende
dalla **mediana** dei quattro fotogrammi. Chi si scosta più dell'8% non
è un passo più alto, è un file esportato a un'altra scala, e si porta
alla mediana da solo — succede, ed è già successo con un fotogramma
esportato a un terzo della misura dei suoi compagni.
