# 🏡 Fioralba — La Lanterna del Solstizio

Un gioco di fattoria *cozy* in italiano, vista dall'alto 3/4 (stile Stardew Valley),
che gira nel browser **senza installare niente**.

Zero dipendenze, zero file di immagini o audio: **ogni sprite è disegnato in codice**
e **ogni suono è sintetizzato con WebAudio**. Il gioco è tutto qui dentro.

---

## ▶️ Come si gioca

**Il modo più semplice:** doppio clic su `index.html`.

**Se vuoi essere sicuro che i salvataggi funzionino** (alcuni browser bloccano il
salvataggio sulle pagine aperte da file locale), apri un terminale in questa
cartella e lancia:

```
python -m http.server 8123
```

poi vai su <http://localhost:8123> nel browser.

---

## 🎮 Comandi

| Tasto | Azione |
|---|---|
| **WASD** / **frecce** | Cammina |
| **Shift** | Corri |
| **Spazio** / clic sinistro | Usa l'oggetto che hai in mano |
| **E** / clic destro | Interagisci (porte, casse, macchine, persone) |
| **1…9** / rotellina | Cambia oggetto nella barra |
| **Q** | Getta l'oggetto in mano |
| — | il nome dell'oggetto in mano appare sopra la barra |
| **I** | Zaino e abilità |
| **C** | Banco da lavoro |
| **J** | Diario (obiettivi, abitanti, lettere) |
| **M** | Mappa della valle |
| **Esc** | Menu (audio, salvataggio) |
| **F** | Schermo intero |

Si gioca anche da telefono: trascina per muoverti, tocca per agire.

---

## 👋 La prima volta

Alla **Nuova Partita**, dopo la lettera di Nonna Ilde, parte una **guida
interattiva**: ti prende per mano nelle prime azioni (muoviti, zappa, semina,
annaffia), illumina il pulsante giusto da premere e avanza quando fai la cosa
richiesta. Puoi saltarla in qualsiasi momento con *Salta guida*. Appare una volta
sola: chi ricarica una partita salvata non la rivede.

## 📖 La storia

Tua nonna Ilde ti ha lasciato il podere. Sul testamento c'era scritto solo quello.

Nella prima lettera, però, ti scrive di una **lanterna nel bosco**, spenta da dodici
anni, che lei ha provato a riaccendere finché le mani gliel'hanno permesso.

Nella radura oltre il burrone c'è un santuario, e uno spirito di nome **Fiammella**
che ha quasi dimenticato il proprio colore. Per riaccendere la Lanterna del Solstizio
servono **quattro braci**, una per stagione: ognuna chiede i frutti di quel periodo
dell'anno.

Ogni brace accesa sblocca una nuova lettera di Ilde. Le lettere sono la vera storia.

> *"Non devi salvare la valle. Devi solo non abbandonarla oggi."*

Finita la storia il gioco **continua**: il podere resta tuo.

---

## 🌱 Cosa si può fare

**Coltivare** — Zappa la terra, semina, annaffia ogni giorno (se piove ci pensa il
cielo), raccogli a mani nude. 17 colture divise per stagione: chi semina fuori
stagione se ne accorge in fretta. Alcune ricrescono da sole, altre no.

**Espandere** — Dal fabbro Tobia si comprano **pollaio**, **serra** (dentro è sempre
estate), **silo** (più spazio nello zaino), **ponte del bosco** e **ampliamento
della casa**.

**Costruire e trasformare** — Barattoliera (conserve, valore ×2 +50), botte (vino e
succhi, ×3), forno per cucinare, fornace per i lingotti, arnie per il miele,
spaventapasseri, lanterne, staccionate, sentieri, casse.

**Guadagnare** — Vendi da Bruno oppure lascia la roba nella **cassa di consegna**
vicino a casa: viene ritirata di notte e pagata all'alba. Trasformare conviene
sempre più che vendere crudo.

**Migliorare** — Quattro abilità (Agricoltura, Raccolta, Estrazione, Pesca) che
salgono usandole: più resa, più energia massima, attrezzi più efficaci. Gli attrezzi
si potenziano in quattro stadi fino all'oro.

**Pescare** — Minigioco con barra da tenere sul pesce. 10 specie più il raro
**Pesce Luna**, che esce solo di notte. E qualche scarpa vecchia.

**Scavare** — La miniera rigenera i suoi minerali ogni notte: rame, ferro, oro,
quarzo, ametista, geodi e la Gemma di Luna.

**Fare amicizia** — Sei abitanti con gusti propri sui regali, battute che cambiano
col rapporto e dialoghi legati ai tuoi progressi. Marisol insegna ricette se passi
a trovarla.

---

## 🦌 La fauna

La valle è abitata. Le bestiole compaiono secondo l'ora, la stagione, il meteo e
il posto, e scappano se ti avvicini troppo.

| | dove e quando |
|---|---|
| **Coniglio** | prati del podere e del bosco, di giorno |
| **Cervo** | bosco, solo all'alba e al tramonto — raro e diffidente |
| **Scoiattolo** | bosco, di giorno, con la ghianda in mano |
| **Riccio** | di notte, cammina piano e non si spaventa quasi mai |
| **Rana** | vicino all'acqua |
| **Farfalla** | primavera ed estate, sei colori diversi |
| **Libellula** | estate, sopra l'acqua |
| **Uccellino** | ovunque di giorno, si posa e riparte |
| **Corvo** | podere — **ti becca il raccolto maturo** |
| **Pipistrello** | miniera |
| **Lumaca** | quando piove |

Il corvo è l'unico che ti dà fastidio: se hai colture mature e nessuno
**spaventapasseri** entro 6 caselle, scende e se ne mangia una. Con lo
spaventapasseri gira alla larga.

## 🌦️ Dettagli che potresti notare

- **Il vento è uno solo per tutta la valle**: erba, chiome, colture, panni stesi,
  tendoni del mercato, fumo dei camini e pioggia si piegano insieme, a folate
- **L'erba si scosta quando ci cammini in mezzo**
- I terreni non si toccano ad angolo retto: erba, terra, sentieri e sabbia
  **sconfinano l'uno nell'altro** con bordi irregolari
- Le aiuole arate prendono una forma unica con un piccolo argine attorno,
  invece di sembrare una griglia di quadrati
- **Le ombre girano con il sole**: lunghe e inclinate all'alba, corte a mezzogiorno
- Alberi ed edifici proiettano la loro sagoma vera, non un ovale
- Le stagioni cambiano il colore di erba e alberi; d'inverno la neve copre le chiome
- Petali in primavera, foglie in autunno, lucciole nelle notti d'estate
- Il fumo esce dai comignoli solo quando dentro è acceso, e lo porta via il vento
- Le finestre si illuminano al tramonto, i lampioni del paese si accendono da soli
- Di notte le luci hanno un alone morbido; raggi di sole obliqui all'alba e al tramonto
- La pioggia annaffia il campo e lascia gli anelli sulle pozzanghere
- Schiuma animata dove l'acqua tocca la riva
- L'acqua della fontana scorre, i panni stesi ondeggiano, il gatto ti segue
- Le colture pronte scintillano
- Le braci del santuario si accendono una per una, e la luce cresce ogni volta

---

## 💾 Salvataggi

Il gioco salva da solo ogni due minuti, quando dormi e quando chiudi la pagina.
Puoi salvare a mano da **Esc → Salva partita**.

Il salvataggio sta nel `localStorage` del browser: resta lì finché non cancelli i
dati del sito. Per ricominciare da zero basta **Nuova Partita**.

---

## 🛠️ Com'è fatto

```
index.html          impalcatura e livelli dell'interfaccia
css/style.css       interfaccia in legno e carta
js/data.js          colture, oggetti, ricette, personaggi, lore
js/art.js           motore di pixel-art: ogni sprite disegnato in codice,
                    raccordi fra terreni, erba animata, aiuole
js/fx.js            vento globale, ombre proiettate, bloom, gradazione colore
js/audio.js         musica generata (una traccia per stagione) e suoni
js/world.js         le quattro mappe, collisioni, respawn notturno
js/mobs.js          fauna: sprite, comportamenti, comparsa
js/tutorial.js      guida interattiva delle prime azioni
js/render.js        camera, terreni a blocchi, profondità, luci, meteo
js/ui.js            menu, negozi, dialoghi, diario
js/game.js          stato, ciclo di gioco, input, sistemi

tsconfig.json       type-checking (solo editor, nessuna build)
types/fioralba.d.ts descrizione dei tipi dei dati e dello stato
vercel.json         configurazione per il deploy statico su Vercel
```

Niente build, niente `npm install`: si aprono i file e funziona.

**Perché nessuna libreria grafica.** Phaser o PixiJS avrebbero sostituito il
disegno su canvas, ma qui il collo di bottiglia non era *come* si disegna: era
*cosa* si disegna. Gli sprite sono tutti generati in codice, quindi il guadagno
vero stava nel migliorare l'arte e il renderer (raccordi fra terreni, ombre che
seguono il sole, bloom, vento condiviso), non nel cambiare il motore — che
avrebbe voluto dire riscrivere tutto senza aggiungere un pixel.

Il terreno viene pre-disegnato a blocchi di 8×8 caselle e riusato: un fotogramma
costa meno di **1 ms**, quindi resta fluido anche su macchine modeste.

---

## 🌐 Pubblicare su Vercel

Il gioco è un **sito statico** (niente server, salvataggi in `localStorage`), quindi
il piano **gratuito** di Vercel basta e avanza. Non serve installare Node: Vercel
serve i file così come sono.

**Con Git (consigliato):** metti la cartella su un repo GitHub, poi su Vercel scegli
*Add New → Project*, importa il repo e premi *Deploy*. Non c'è nulla da configurare:
Vercel non trova un `package.json`, capisce che è un sito statico e serve `index.html`.

**Senza Git (al volo):** installa la CLI di Vercel su un computer che ha Node
(`npm i -g vercel`), poi da questa cartella lancia `vercel`. In alternativa puoi
trascinare la cartella nella dashboard di Vercel.

Il file `vercel.json` è già pronto: lascia rivalidare l'HTML (così i nuovi
aggiornamenti si vedono) e tiene in cache a lungo `js/` e `css/` — che cambiano URL
da soli grazie al `?v=N` sui tag `<script>`.

> **Banda:** il gioco pesa pochissimo (nessun file immagine o audio), quindi rientra
> comodo nei limiti del piano gratuito anche con molti giocatori.

---

## 🔎 Sicurezza dei tipi (senza build)

Nel progetto c'è un `tsconfig.json` e un file di tipi `types/fioralba.d.ts`. Servono
**solo all'editor**: il browser non li carica, il gioco resta "apri e gioca".

Aprendo la cartella in **VS Code** ottieni subito:
- **autocompletamento** su tutto (scrivi `G.` o `DATA.CROPS.rapa.` e vedi i campi);
- **descrizioni** al passaggio del mouse sui dati e sullo stato di gioco;
- **controllo errori** attivabile file per file: aggiungi `// @ts-check` in cima a un
  file e VS Code ti segnala usi sbagliati (id inesistenti, campi mancanti, tipi
  errati). Un buon primo candidato è `js/data.js`.

I moduli grafici (ART, FX, REND, WORLD, MOBS…) sono lasciati volutamente "liberi":
tiparli in dettaglio darebbe poco valore rispetto al lavoro. I tipi si concentrano
dove gli errori costano di più — i **dati di gioco** e lo **stato**.

> Il controllo completo con `tsc` richiede Node installato (`npx tsc --noEmit`); non
> è necessario per giocare né per pubblicare, ma è utile se vuoi validare tutto in
> un colpo solo.
