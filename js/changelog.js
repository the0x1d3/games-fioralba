/* ===================================================================
   FIORALBA — changelog.js
   Cos'è cambiato, in ordine dal più recente.

   Sta in un file suo perché è l'unica cosa del progetto che cresce a
   ogni versione senza che nient'altro debba saperlo: la landing lo
   legge e lo impagina, e per aggiungere una riga basta aggiungere una
   riga.

   `tipo` decide il colore del pallino: 'nuovo' per quello che prima non
   c'era, 'meglio' per quello che c'era e adesso funziona meglio,
   'fix' per i difetti veri.
   =================================================================== */
(function(){
'use strict';

window.CHANGELOG = [
  {
    v: '3.7',
    data: 'agosto 2026',
    titolo: 'La Piazza del Porto ha finalmente un porto',
    voci: [
      { tipo:'fix',    t:'Il ponticello del podere si attraversa sul viale', d:'Segnalato: «il ponte ha due blocchi invisibili che non te lo fanno attraversare, e si vede anche male». Erano due caselle d\'acqua fra il selciato e le assi: il ponticello cominciava una casella più in là del ruscello, quindi sulle righe del viale non si passava — si passava solo scendendo di una riga, cioè fuori dal viale e fuori dal ponte disegnato. E quei due quadrati d\'acqua, stretti sotto il bordo della ringhiera, non si leggevano come acqua: si leggevano come ponte rotto. Adesso il ponte arriva alla riva da tutte e due le parti, ed è stato ridisegnato: prima erano due strisce di legno con in mezzo la texture nuda delle assi, che a schermo sembra muratura; ora ha le travi di traverso e i pali agli angoli. Chi ha una partita avviata guarisce alla prima apertura.' },
      { tipo:'fix',    t:'Il ponte del burrone si attraversa, e si vede bene', d:'Segnalato: «il ponte continua ad avere due blocchi invisibili che non te lo fanno attraversare, e si vede anche male». Erano tutti e due lo stesso difetto, e stava nei salvataggi: il terreno viaggia nella partita salvata, e chi ha cominciato a giocare quando il varco del ponte stava in un altro punto si portava dietro, dentro al corridoio, le caselle di roccia e di vuoto di allora — invisibili sotto la passerella disegnata, ma solide. Lo stesso per la coda del ponte vecchio, che restava scritta come una lingua di assi che non porta da nessuna parte. Adesso il corridoio del ponte lo decide il gioco a ogni apertura — assi se il ponte c\'è, burrone se non c\'è — e le assi orfane intorno tornano erba. Chi ha il ponte pagato ci passa; chi non ce l\'ha non passa lo stesso.' },
      { tipo:'nuovo',  t:'Ogni tanto la marea porta una bottiglia', d:'Sulla battigia, con un luccichio che pulsa piano: dentro c\'è una lettera da un\'altra costa — il guardiano di un faro spento, un cuoco naufragato, una bambina che scrive nomi sulla sabbia. Ogni lettera arriva una volta sola, e il gioco si ricorda quali hai già aperte. Finite le lettere, nella bottiglia si trova una <b>ricetta sbiadita dall\'acqua</b> — di quelle che altrimenti insegna Marisol — e finite anche quelle, qualche moneta vecchia: una bottiglia che si apre sul niente è una promessa rotta, e il mare non ne fa. Una bottiglia avvistata non sparisce: la marea porta, ma un messaggio non se lo riprende.' },
      { tipo:'nuovo',  t:'Dal molo si pesca altro', d:'Il molo della Costa era una passerella di legno senza una ragione: da riva e dal molo venivano su esattamente gli stessi quattro pesci, quindi ci si andava solo per guardare il mare. Adesso chi ci sta sopra ha l\'acqua alta sotto i piedi e prende anche il <b>pesce d\'altura</b>: la <b>Cernia</b>, la <b>Ricciola</b> — che prima era di riva ed è sempre stata rara — e, d\'autunno e d\'inverno di notte, il <b>Pesce Lanterna</b>, che si accende da sé giù dove non arriva la luce. Dal molo si prende tutto quello che si prende da riva, e in più questi: salire su un molo non deve togliere il branzino.' },
      { tipo:'nuovo',  t:'Ogni mattina il mare lascia qualcosa sulla battigia', d:'La Costa aveva una cosa sola da fare, pescare, e per il resto era da guardare. Adesso ogni notte la marea porta a riva <b>conchiglie, telline e granchi</b> — fra gli scogli e attorno alle pozze — più il legname che il mare restituisce. Si raccolgono come le viole del bosco, entrano nella <b>Collezione del Naturalista</b> (che passa da 64 a 67 cose da trovare) e si vendono. Le conchiglie sono le più comuni e il granchio il più raro: chi passa tutte le mattine trova quasi sempre qualcosa, e ogni tanto qualcosa che vale. Non hanno stagione, perché il mare non ha un mese in cui le conchiglie non ci sono.' },
      { tipo:'nuovo',  t:'Il Lume si costruisce, e si mette dove vuoi', d:'I lumi delle stanze c\'erano da sempre — quelli a muro di casa di Nonna Ilde — e nessuno poteva farsene uno. Adesso al banco da lavoro, con <b>4 legna e 1 carbone</b>, ne escono due. Si posano dove serve, anche dentro casa, e di notte fanno lo stesso identico cerchio caldo di quelli che c\'erano già: sarebbe stato strano che lo stesso oggetto illuminasse in due modi a seconda di chi ce l\'ha messo. La Lanterna resta la luce da fuori — grande, di ferro e rame, cara — e questo è quella da dentro: piccola, di legno, che costa poco apposta, perché adesso che i mobili di casa si spostano serve poter illuminare l\'angolo dove li hai messi. Per toglierlo, una picconata: torna nello zaino.' },
      { tipo:'nuovo',  t:'Il porto, con l\'acqua e le barche ormeggiate', d:'Si chiamava <b>Piazza del Porto</b> e un porto non ce l\'aveva: 445 caselle di lastre, la fontana in mezzo, e tutto il resto ai bordi in simmetria perfetta — due bancarelle, quattro panchine, quattro fioriere, quattro casse, sei lampioni, ognuna col suo gemello dall\'altra parte. Da dentro sembrava un parcheggio. Adesso a levante c\'è l\'insenatura, che scende fino al bordo sud dalla parte in cui si esce verso la Costa, così l\'acqua della piazza e il mare della spiaggia si leggono come la stessa acqua. Il lastricato arriva fino al filo dell\'acqua e ci sono tre barche ormeggiate contro la banchina. Sul lato di ponente, che restava vuoto, c\'è il mercato del pesce con la sua fila di banchi; e panchine, fioriere e casse hanno smesso di stare ai vertici di un quadrato.' },
      { tipo:'meglio', t:'La Costa non è più un deserto di sabbia', d:'Erano 978 caselle di sabbia con ventun oggetti sopra — quattordici rami e sette sassi — un molo e due cartelli. Adesso c\'è l\'erba delle dune, più fitta sotto la pineta e sempre più rada scendendo verso la battigia, coi suoi cespugli; quattro pozze di marea coi sassi intorno, che l\'acqua borda da sé con la sua riva dentellata; tre barche, una tirata in secca; e il molo ha le casse in fondo e il lampione a metà, così si vede che è un molo e non una striscia di legno. L\'erba delle dune non è solo decorazione: è erbaccia vera, quindi la falce ci lavora e ci si trova della fibra.' },
      { tipo:'fix',    t:'I due posti cambiano anche nelle partite già avviate', d:'Il terreno e gli oggetti di scena viaggiano nel salvataggio, quindi chi ha una partita in corso si sarebbe riportato dietro la piazza vecchia e la spiaggia vuota per sempre — come sarebbe successo col burrone del bosco, se non ci fosse la stessa cura. Quello che c\'è in un luogo lo decidiamo noi, non il salvataggio: i due posti si ristampano all\'apertura. Le casse e i macchinari che avevi lasciato lì non si perdono: si spostano di qualche passo e restano tuoi.' }
    ]
  },
  {
    v: '3.6',
    data: 'agosto 2026',
    titolo: 'La mappa della valle si vede nitida, e dice chi c\'è',
    voci: [
      { tipo:'fix',    t:'La mappa non è più sfocata', d:'Era disegnata su una tela di 460 pixel di larghezza e poi stirata dal browser fino a riempire la finestra: misurato, arrivava a 764 pixel, cioè ingrandita di una volta e mezza — e su uno schermo a densità doppia, come quasi tutti i portatili e i telefoni, di più del triplo. Ogni linea da un pixel arrivava spalmata su due o tre, ed è quello che si leggeva come «sfocata»: non era una scelta di stile, era una tela troppo piccola tirata per i capelli. Adesso la mappa si disegna alla misura vera dei pixel che occupa, qualunque sia lo schermo, e si ridisegna da sola se giri il telefono. È la stessa cura che nella 3.4 aveva rimesso a fuoco le scritte del mondo.' },
      { tipo:'nuovo',  t:'Sulla mappa vedi dove sono gli abitanti adesso', d:'Ogni luogo porta in alto a destra un bollino per ogni abitante che si trova lì in questo momento, del colore della sua maglia — quello con cui lo vedi in giro, così si impara guardandolo. Aprendo la mappa a metà mattina si vede che Bruno, Tobia, Marisol ed Elio sono in paese, e che Serafina è nel bosco; il giorno della sagra si vede Serafina scendere in piazza con gli altri. Era la domanda vera che uno si fa aprendo una mappa, e l\'unica cosa che non c\'era.' },
      { tipo:'nuovo',  t:'Puoi riordinare i mobili di casa', d:'Le cose che ti posi tu hanno il pulsante «Sposta» nella loro finestrella, i mobili di casa no: su di loro <b>E</b> è già preso — il letto apre «Dormi», la cucina i fornelli, la scrivania le lettere. Quindi è una modalità: nelle <b>Impostazioni</b>, stando in casa, c\'è «Riordina i mobili». Finché è accesa, E su un mobile lo prende invece di usarlo, e poi scegli dove rimetterlo (o Esc per lasciarlo dov\'era). Si spegne da sola quando esci di casa. Letto, camino, cucina, scrivania, dispense e lumi: la stanza te la disponi come ti pare, e resta così anche dopo aver chiuso e riaperto il gioco.' },
      { tipo:'nuovo',  t:'Quattro superfici per rifarti il podere come vuoi', d:'C\'era il Sentiero di Pietra e basta, quindi un podere personale aveva un colore solo; e soprattutto non esisteva il verso opposto — una casella diventata terra battuta o sentiero non tornava più prato in nessun modo. Adesso al banco da lavoro si fanno anche <b>Assi da Pavimento</b> (i passi ci suonano sopra), <b>Lastre di Pietra</b> per i cortili, <b>Mattonelle di Cotto</b> per l\'aia, e soprattutto le <b>Zolle d\'Erba</b>, che rifanno prato dove c\'è terra o una pavimentazione che non ti piace più. Si posano una casella per volta come il sentiero, si passano una sopra l\'altra, e i bordi si raccordano da soli con le caselle vicine. Costano poco di proposito: è una scelta di gusto, non un traguardo da guadagnare. Le trovi anche <b>in bottega da Bruno</b>, tutto l\'anno, se non hai voglia di fare il giro della miniera per l\'argilla e del bosco per la legna: lì si pagano il doppio scarso, che è il prezzo della fretta.' },
      { tipo:'meglio', t:'La sagra dice quali prodotti valgono', d:'La carta diceva «Consegna 20 prodotti di stagione» e si fermava lì. Quali siano i prodotti di questa stagione uno se lo ricorda al primo anno; al terzo no — gli spinaci sono di primavera o d\'autunno? — e l\'unico modo di scoprirlo era portare roba al banco e vedere se la prendeva. Adesso sotto la sagra c\'è una riga che si apre, «Cosa vale», con l\'elenco completo: prima quello che hai già nello zaino, col numero, e poi tutto il resto con scritto dove si trova. Chiusa non ruba spazio, aperta risponde.' },
      { tipo:'fix',    t:'Via la sfumatura bianca sul prato vicino all\'acqua', d:'Lungo le rive il prato sbiadiva, con una fascia chiara squadrata sui bordi delle caselle mentre la riva accanto è frastagliata: stonava, ed è stata segnalata come la cosa più brutta da vedere. Era la schiuma dell\'acqua disegnata nell\'ordine sbagliato — sopra al prato che sborda sull\'acqua, invece che sull\'acqua. Misurato un pixel per volta: quel verde slavato era esattamente l\'erba col 29% del bianco della spuma sopra. Adesso la spuma si disegna sotto al terreno e si vede dove l\'acqua è scoperta, cioè fra i denti della riva, che è dov\'era intesa fin dall\'inizio.' },
      { tipo:'meglio', t:'I posti dove non sei mai stato si riconoscono', d:'Prima erano disegnati identici agli altri, e l\'unico modo per sapere dove si poteva fare il viaggio rapido era provare a toccarli e leggersi un rifiuto. Adesso hanno la pergamena velata, il bordo tratteggiato e — nello stesso angolo dove gli altri dicono «▸ vai» — la scritta «? da scoprire». La forma della valle resta visibile: quello che manca non è il posto, è esserci stati.' }
    ]
  },
  {
    v: '3.5',
    data: 'agosto 2026',
    titolo: 'Si corre anche col pollice, e la veglia non si perde più',
    voci: [
      { tipo:'nuovo',  t:'Il tasto «Corri», sul telefono', d:'Da tastiera si corre tenendo <b>Shift</b>, e chi gioca col pollice quel tasto non ce l\'ha: la valle si attraversava tutta al passo. Adesso accanto a «Usa» e «Parla» c\'è il terzo verbo, azzurro per distinguerlo con la coda dell\'occhio. Si tiene premuto mentre l\'altro pollice tiene la levetta — la stessa presa a due mani di chi gioca col mignolo sullo Shift — e consuma un filo di energia come sempre. Misurato: dieci fotogrammi facevano 11,8 pixel camminando e ne fanno 19 correndo, cioè si andava al 62% della velocità di chi gioca da computer.' },
      { tipo:'fix',    t:'La veglia al Santuario non si può più perdere', d:'Era il difetto peggiore che ci fosse, e stava proprio in fondo alla storia: quando i sei accettano l\'invito la veglia è fissata per <b>la sera dopo</b>, e chi quella sera andava a dormire presto — o crollava dalla stanchezza a mezzanotte dall\'altra parte della valle — si svegliava con quella data ormai passata. Da lì in poi Fiammella ripeteva «È domani sera» per sempre e l\'atto secondo non si chiudeva più: la partita restava a un passo dal finale senza modo di arrivarci. Adesso una veglia saltata si sposta a stasera, ogni mattina, finché non la fai. I sei hanno già detto di sì, e un sì non scade.' },
      { tipo:'fix',    t:'Cambiare partita non appesantisce più il gioco', d:'Passando da una partita all\'altra dal menu, senza ricaricare la pagina, il motore ne faceva partire un secondo sopra a quello che stava già girando — e due, e tre, uno per ogni cambio. Il gioco continuava a funzionare ma consumava il doppio, e nessuno poteva capire perché fosse diventato pesante. Sistemato anche il primo istante di ogni partita, dove un conto del tempo poteva partire all\'indietro e far saltare il primo fotogramma: si vedeva come uno sfarfallio all\'apertura, soprattutto sull\'aia dove c\'è la fontana.' },
      { tipo:'fix',    t:'Due pulsanti che aprivano la cosa sbagliata', d:'Il pulsante <b>Ritira</b> dei premi rimasti fuori dallo zaino ti riportava al Diario, ma sulla scheda dei numeri del podere invece che su quella dei Livelli da cui eri partito. E il buongiorno del mattino, quando la cassa di consegna aveva venduto qualcosa, arrivava due volte di fila.' }
    ]
  },
  {
    v: '3.4',
    data: 'agosto 2026',
    titolo: 'Le scritte non sono più sgranate, e i pixel li scegli tu',
    voci: [
      { tipo:'meglio', t:'Tutto il testo del mondo alla risoluzione vera dello schermo', d:'Le nuvolette di chi parla, le targhette delle casse e dei cartelli, i «+1 Rapa» che volano: erano scritti dentro alla tela piccola del gioco e poi ingranditi tre volte insieme a tutto il resto. Non arrivavano lettere grandi: arrivavano lettere piccole con la loro sfumatura fatta a blocchetti da tre. È il motivo per cui sul telefono si leggevano bene e sul computer no — lì un pixel di gioco è largo un pixel dello schermo, su un monitor grande ne è largo tre. Adesso le scritte si disegnano sopra, alla risoluzione vera: stessa misura all\'occhio, tratti netti. Le cornici di legno e le nuvolette restano pixel art, come devono.' },
      { tipo:'nuovo',  t:'Puoi scegliere quanto grandi sono i pixel', d:'Nelle impostazioni, sotto «Grafica». Il gioco tiene in vista una ventina di caselle su qualunque schermo, e su un monitor grande questo vuol dire pixel grossi: se preferisci vedere più mondo con pixel più minuti, adesso si può. Il riquadro dice quante caselle stai vedendo e cambia mentre scegli, così il baratto lo vedi invece di leggerlo. La scelta resta su questo apparecchio e non viaggia col salvataggio: lo stesso podere aperto sul telefono e sul computer vuole due valori diversi.' }
    ]
  },
  {
    v: '3.3',
    data: 'agosto 2026',
    titolo: 'Gli abitanti hanno una storia da raccontarti',
    voci: [
      { tipo:'nuovo',  t:'Sei storie del paese, una per abitante', d:'I cuori salivano e non succedeva niente: a sei cuori arrivava qualche battuta in più, e basta. Adesso ognuno dei sei ha una faccenda sua, che si apre quando gli sei abbastanza amico e va avanti a passi — parlarci, portargli qualcosa, andare a vedere un posto. <b>Il libretto di Bruno</b>, una riga di conto aperta da due anni con un uomo che ha smesso di scendere dal Passo. <b>La rete di suo padre</b>, che Elio tiene appesa perché ripararla vorrebbe dire usarla. <b>Le pagine mancanti</b> dell\'erbario di Ilde. <b>La campana della piazza</b>, crepata da quella notte di dodici anni fa. <b>La stanza di sopra</b>, chiusa alla locanda. <b>La neve che non si scioglie</b>, al Passo. Ognuna finisce con qualcosa che da quella persona non arriverebbe in nessun altro modo.' },
      { tipo:'nuovo',  t:'Adesso migliori anche te stesso, non solo gli attrezzi', d:'Tutto quello che cresceva era fuori da te: gli attrezzi da Tobia, le abilità giocando, il podere costruendo. Tu no — camminavi alla stessa velocità del primo giorno, portavi le stesse ventisette caselle e ogni zappata costava quello che costava il giorno uno. Adesso ci sono quattro cose che si migliorano addosso, due misure ciascuna: lo <b>zaino</b> (nove caselle in più per misura), la <b>resistenza</b> (energia in più al risveglio), le <b>scarpe</b> (si cammina più svelti) e la <b>cintura</b> (ogni colpo di attrezzo costa meno energia). Le trovi nella scheda delle abilità, sotto ai livelli.' },
      { tipo:'nuovo',  t:'Te li fa chi ti ha appena raccontato la sua storia', d:'Non si comprano al banco: si sbloccano finendo la vicenda di chi li fa. Lo zaino lo ordina Bruno dopo il libretto, la cintura la batte Tobia dopo la campana, le scarpe te le cuce Oreste dopo la neve, e a reggere la giornata te lo insegna Marisol dopo la stanza di sopra. Sono quattro cose potenti, e in vendita dal primo giorno toglierebbero il senso ai primi inverni: così arrivano quando quei problemi lì li hai già avuti addosso per un po\'.' },
      { tipo:'nuovo',  t:'Il Diario dice cosa hai in ballo', d:'Le storie stanno nella scheda «Richieste», sopra alla bacheca: cosa devi fare adesso, a che passo sei, e — se devi portare della roba — quanta te ne manca ancora, non quanta ne serve in tutto. Chi ha già cinque fibre su dodici legge «Fibra ×7», non «Fibra ×12». Si vede anche chi ancora non si è aperto e a quanti cuori lo farà, perché sapere che una persona ha qualcosa da raccontare è metà del motivo per portarle un regalo.' }
    ]
  },
  {
    v: '3.2',
    data: 'agosto 2026',
    titolo: 'I cartelli li scrivi tu',
    voci: [
      { tipo:'fix',    t:'Il suggerimento non copre più il nome dell\'attrezzo', d:'Segnalato con la foto: durante la pesca «Abbocca! Premi Spazio» finiva stampato sopra l\'etichetta dell\'oggetto in mano, ed è proprio pescando che quell\'etichetta c\'è sempre — la canna è in mano. Le tre fasce in basso (barra, suggerimento, messaggi) si tenevano d\'occhio a mano, con tre numeri scritti in tre punti diversi: adesso salgono in fila e c\'è un controllo che lo verifica a ogni giro. Sistemato anche col telefono in orizzontale, dove i messaggi crescevano sopra al suggerimento.' },
      { tipo:'nuovo',  t:'Cartelli con sopra quello che ci scrivi', d:'I cartelli del paese («↑ Miniera», «← Podere») ce l\'hanno sempre avuto un testo, ma per leggerlo bisogna andarci accanto e premere E — per dividere un campo a zone vorrebbe dire farne il giro. Adesso il <b>Cartello</b> lo fai tu al banco da lavoro (tre legna, ne escono due), lo pianti dove vuoi e ci scrivi sopra: «Pomodori», «Patate», «Qui non zappare». La scritta sta sopra la tavoletta e si legge da fermi, da dovunque tu sia. Appena piantato si apre da solo il campo per scriverci, e con E ci torni quando cambi coltura. Per toglierlo, una picconata: torna nello zaino intero.' }
    ]
  },
  {
    v: '3.1',
    data: 'agosto 2026',
    titolo: 'Il pollaio non ti mangia più il campo',
    voci: [
      { tipo:'fix',    t:'Adesso il gioco dice come si tolgono staccionate e cancelletti', d:'Il <b>piccone</b> le toglie da sempre, e te le rimette intere nello zaino — ma nessuno lo diceva: stando davanti a una staccionata il gioco non scriveva niente, perché E di proposito non tocca gli arredi. Chi ci giocava ha provato e ha concluso che non si poteva. Adesso, quando ci sei davanti, in basso compare la riga che lo spiega. Serve anche a rifare un campo altrove: si smontano e si riposano dove vuoi.' },
      { tipo:'fix',    t:'Le costruzioni sorgevano sopra al raccolto', d:'Segnalato da chi ci giocava: costruisci il pollaio, torni a casa per metterci dentro una gallina, e il pollaio è nato sopra al campo che avevi seminato. Il raccolto restava lì sotto — scritto nel salvataggio, invisibile, non raccoglibile — e non c\'era modo di spostare l\'edificio. Erano 20 caselle su 20 sotto il pollaio e 30 su 30 sotto la serra. Adesso la zappa non lavora il prato riservato a una costruzione, e ti dice quale ci andrà; chi ha già del raccolto sepolto se lo ritrova nello zaino alla prossima apertura.' },
      { tipo:'fix',    t:'Il ponte non si può più tappare', d:'Una cassa o un macchinario finiti nel corridoio del ponte lo trasformavano in un vicolo cieco, e non c\'era modo di capire perché: sembrava roba messa lì apposta. Poteva succedere da solo, perché il gioco sposta lì quello che trova nel burrone quando ricontrolla il terreno. Adesso quel corridoio si tiene sgombro, e una partita rimasta bloccata di qua dal burrone si sblocca da sé alla prossima apertura.' }
    ]
  },
  {
    v: '3.0',
    data: 'agosto 2026',
    titolo: 'Il Diario dice cosa serve, e le collezioni pagano',
    voci: [
      { tipo:'nuovo',  t:'«Cosa serve» per ogni brace, senza salire al Santuario', d:'Per sapere cosa chiede una brace bisognava farsi la strada fino al Santuario e leggerlo lì, ogni volta. Adesso nel Diario, sotto ogni brace, c\'è una riga che si apre: i cinque frutti che servono, dove si trovano, e quali hai già portato — quelli restano in elenco, spenti, perché sapere cosa hai già offerto è metà dell\'informazione. Compare dopo il <b>ponte</b>: prima al Santuario non ci si arriva, e un elenco per un posto irraggiungibile è un compito senza porta.' },
      { tipo:'nuovo',  t:'Completare una collezione adesso paga', d:'Il contatore arrivava a 10/10 e restava lì: era l\'unica cosa del Diario che si riempie senza che nessuno se ne accorga. Adesso ogni collezione ha il suo premio — monete e un oggetto che quella collezione non ti fa mai avere — e lo si vede scritto <b>prima</b> di finirla, così sai cosa stai cercando. Se lo zaino è pieno l\'oggetto non si perde: ti aspetta nella scheda delle abilità.' },
      { tipo:'meglio', t:'Niente più premi pagati due volte', d:'Pesci e minerali pagavano già, tramite due traguardi in un\'altra scheda, mentre le altre tre collezioni non davano niente. Adesso pagano tutte, nello stesso posto, e nessuna paga due volte. Le cifre dei due traguardi sono passate di là identiche: nessuno prende meno di prima, e chi li aveva già riscossi si ritrova la collezione già riscossa.' }
    ]
  },
  {
    v: '2.9',
    data: 'agosto 2026',
    titolo: 'Gli abitanti finiscono le frasi',
    voci: [
      { tipo:'fix',    t:'Le nuvolette tagliavano la battuta a metà', d:'Più della metà di quello che la gente dice in giro per la valle arrivava troncato — 33 battute su 60 — e siccome sono quasi tutte a due tempi, veniva tagliata sempre la seconda: <b>«Ilde saliva fin qui ogni inverno, con una fetta di torta.»</b> e via il resto, che era «Non parlava. Guardava e basta.» Restava l\'informazione e spariva il ricordo. Adesso ci stanno tutte, in italiano e in inglese.' },
      { tipo:'fix',    t:'Una riga su quattro veniva buttata via', d:'La nuvoletta smetteva di riempirsi una riga prima del dovuto: l\'ultima conteneva una parola sola e tutto il resto della frase spariva. Di ottantaquattro caratteri disponibili se ne usavano una cinquantina.' }
    ]
  },
  {
    v: '2.8',
    data: 'agosto 2026',
    titolo: 'I vecchi file .json si convertono, e le partite si cancellano',
    voci: [
      { tipo:'nuovo',  t:'Il tuo vecchio salvataggio .json entra nel giro nuovo', d:'Per mesi Fioralba ha esportato salvataggi in file .json, e in giro ce ne sono: sul desktop, nella cartella dei download, spediti a un amico. Adesso in fondo alla finestra di «Continua» c\'è un rimando: scegli il file, e la partita sale sul server con un codice suo. È una porta a senso unico — si entra nel sistema nuovo e non si esce — e il file di partenza non viene toccato: se qualcosa non va, non hai perso niente.' },
      { tipo:'nuovo',  t:'Le partite si possono cancellare', d:'Accanto a ogni partita dell\'elenco c\'è un cestino. Prima di cancellare ti facciamo rileggere cosa stai buttando — nome, a che punto sei, quante monete — perché in un elenco di codici che si somigliano tutti il cestino sbagliato è un gesto facile, e di là non c\'è nessun cestino da cui ripescare. E si cancella <b>davvero</b>, dal server: toglierla solo dal proprio apparecchio non sarebbe cancellare, sarebbe nascondere, col codice che continua a funzionare e nessuno che se lo ricordi più.' }
    ]
  },
  {
    v: '2.7',
    data: 'agosto 2026',
    titolo: 'Gli abitanti smettono di sembrare storti',
    voci: [
      { tipo:'fix',    t:'Il bordo scuro non era centrato su nessuno', d:'Ogni personaggio della valle — tu compreso — si disegna con un contorno scuro sotto, per staccarlo dallo sfondo. Quel contorno era spostato di due pixel: sporgeva di tre a destra e sotto, e mancava del tutto sopra e a sinistra. Su uno sfondo chiaro sembrava che lo sprite fosse sdoppiato o storto, senza che si riuscisse a mettere a fuoco il perché.' },
      { tipo:'fix',    t:'A Serafina si vedeva il cappello tagliato', d:'Nel riquadro del dialogo il ritratto inquadra la testa, ma la statura del personaggio la sposta in alto: chi è alto <b>e</b> porta il cappello sbatteva contro il bordo, e la cupola veniva tranciata netta. Adesso l\'inquadratura segue la statura, e tutte e sei le facce cadono alla stessa altezza — che è poi quello che si chiede a una cornice di ritratti.' }
    ]
  },
  {
    v: '2.6',
    data: 'agosto 2026',
    titolo: 'Il telefono si può girare, e i tasti smettono di coprire la valle',
    voci: [
      { tipo:'nuovo',  t:'Un HUD per il telefono coricato', d:'Girando il telefono l\'interfaccia si accavallava su se stessa: i cinque tasti del menu finivano sopra i due verdi comandi, e sopra l\'orologio; la barra dell\'energia era alta mezzo schermo per dire un numero. Adesso coricati c\'è una disposizione tutta sua — quello che si guarda in alto, quello che si preme in basso agli angoli, dove arrivano i pollici — e l\'energia diventa una barretta orizzontale.' },
      { tipo:'meglio', t:'I tasti a destra non fanno più muro', d:'Sul telefono in piedi, dal primo tasto del menu all\'ultimo comando c\'era una colonna di pulsanti alta il <b>55% dello schermo</b> lungo tutto il lato destro. I cinque tasti del menu sono passati in alto, in riga sotto l\'orologio: si premono ogni tanto e ci si può allungare. In basso restano solo i due verbi, che ora occupano il 17%.' },
      { tipo:'fix',    t:'Il pulsante che apriva le porte a volte non rispondeva', d:'La linguetta del pannello di prova stava nell\'angolo in basso a destra — che col dito è esattamente il posto dei comandi. In verticale copriva gli ultimi due attrezzi della barra, coricata copriva «Parla». Adesso si sposta di lato.' }
    ]
  },
  {
    v: '2.5',
    data: 'agosto 2026',
    titolo: 'Impostazioni rifatte, e la partita ha un nome',
    voci: [
      { tipo:'nuovo',  t:'Dai un nome alla tua partita', d:'Fino a ieri il contadino si chiamava «Contadino» e non c\'era modo di cambiarlo — nessuno l\'aveva mai chiesto. Adesso il nome si sceglie quando la partita nasce, e si cambia quando vuoi dalle Impostazioni. Serve anche a te: nel selettore di «Continua» tre partite che si chiamano tutte allo stesso modo non aiutano a capire quale riprendere.' },
      { tipo:'nuovo',  t:'Le Impostazioni dicono se la partita è al sicuro', d:'La domanda che uno si fa prima di chiudere non compariva da nessuna parte. Adesso è la prima cosa che si legge: <b>tutto salvato sul server</b> e da quanto, oppure che c\'è ancora qualcosa per strada. Verde quando è arrivato, ambra mentre sta andando — perché i tre secondi dopo ogni mossa non sono un guasto.' },
      { tipo:'meglio', t:'Un menu a sezioni invece di un elenco', d:'Era una fila piatta in cui tutto pesava uguale. Adesso è diviso: la partita, il salvataggio, l\'audio, la lingua, la guida. I cursori del volume dicono anche a quanto stanno, che prima si trascinavano alla cieca.' },
      { tipo:'nuovo',  t:'Riprova da solo ogni cinque minuti', d:'Se un salvataggio non riesce ad arrivare — rete caduta, server che tossisce — prima non lo riprovava nessuno finché non salvavi di nuovo. E se in quel momento smettevi di giocare, restava lì fino al riavvio. Adesso ogni cinque minuti il gioco guarda se c\'è qualcosa rimasto indietro e lo rimanda. Quando non c\'è niente, non fa nulla e non costa nulla.' },
      { tipo:'nuovo',  t:'Se esci con qualcosa non salvato, te lo dice', d:'Il browser ti chiede conferma prima di chiudere, ma solo quando serve davvero: se è tutto arrivato non ti disturba, e la pagina resta veloce come prima.' },
      { tipo:'fix',    t:'Ricaricare non sembra più aver perso qualcosa', d:'Uscendo, il gioco manda l\'ultima partita mentre la pagina si chiude: arrivava, ma nessuno faceva in tempo a segnarselo. Al rientro il gioco diceva «c\'è del gioco non ancora salvato» di una cosa già salvata, accendeva l\'avviso e faceva chiedere conferma per uscire. Adesso confronta e si accorge da sé che era tutto a posto.' }
    ]
  },
  {
    v: '2.4',
    data: 'agosto 2026',
    titolo: 'Le partite stanno sul server, e si aprono con un codice',
    voci: [
      { tipo:'fix',    t:'La sincronizzazione partiva una volta sola', d:'Chi collegava la partita la vedeva salire sul server, e poi non saliva più: mesi di gioco restavano fermi al giorno del collegamento. Da fuori sembrava che su alcune partite non partisse mai. Partiva sempre, e non ripartiva mai — la funzione che manda esisteva e non la chiamava nessuno.' },
      { tipo:'nuovo',  t:'Una partita sola, e sta di là', d:'Prima ce n\'erano due: una nel browser e una copia sul server, che potevano scostarsi e ogni tanto ti chiedevano quale tenere. Adesso la partita è una e vive sul server: si salva da sé mentre giochi, e non c\'è più niente da allineare. Del browser si serve solo un cassetto, per le volte che cade la rete: appena torna, quello che era rimasto parte da solo.' },
      { tipo:'nuovo',  t:'«Continua» ti chiede quale partita', d:'Questo apparecchio si ricorda i codici che ha visto, e te li mostra con nome, stagione e monete: si tocca quello giusto e si riparte. Se non ne conosce nessuno — perché sei su un computer nuovo — chiede il codice, che è l\'unica cosa da sapere per ritrovare la tua valle da qualunque parte.' },
      { tipo:'nuovo',  t:'Cominciarne una nuova non cancella più niente', d:'Ogni partita ha il suo codice, quindi quella di prima resta dov\'è. È sparito l\'avviso «cominciandone una nuova la perdi», che era vero solo finché la partita stava dentro a un browser.' },
      { tipo:'meglio', t:'Niente più file .json da esportare e importare', d:'Erano il modo di spostare una partita quando la partita stava nel browser. Adesso ci si sposta col codice: dodici caratteri invece di centoquaranta chilobyte, e nessun file da ritrovare nella cartella dei download. Chi aveva ancora la partita nel browser se la vede spostare di là alla prima apertura, e riceve il suo codice.' }
    ]
  },
  {
    v: '2.3',
    data: 'agosto 2026',
    titolo: 'Fioralba si gioca dal telefono',
    voci: [
      { tipo:'nuovo',  t:'Si gioca col pollice', d:'Fino a ieri la pagina iniziale diceva «Solo da computer» e rifiutava il clic. Adesso no: appoggi il pollice dove vuoi, nella metà sinistra dello schermo, e nasce lì una levetta che ti segue — non è ferma in un angolo, perché su uno schermo alto il pollice non torna mai nello stesso punto. A destra due tasti, che sono i due verbi che il gioco aveva già sulla tastiera: <b>Usa</b> e <b>Parla</b>. Tenendo premuto Usa si tira la lenza.' },
      { tipo:'fix',    t:'Adesso si può aprire una porta', d:'Il tocco sullo schermo sapeva fare una cosa sola, cioè usare l\'attrezzo in mano. Non sapeva interagire: porte, casse, macchinari e abitanti erano fuori portata, e senza quello il gioco non si poteva finire. Il tasto «Parla» è esattamente quel verbo che mancava.' },
      { tipo:'fix',    t:'I dialoghi avanzano toccandoli', d:'Si avanzava solo con Spazio, Invio o E: da telefono ogni conversazione era un vicolo cieco, e siccome tutta la storia passa di lì la partita finiva alla prima battuta. Adesso si tocca il riquadro. Vale anche col mouse: chi gioca da computer con una mano sola cliccava e non succedeva niente.' },
      { tipo:'meglio', t:'Si vede la valle, non un corridoio', d:'Su un telefono in verticale si vedevano 5,9 caselle di larghezza, contro le 20 di un computer: si camminava dentro una feritoia. Adesso sono circa dodici, e il conto tiene anche il telefono coricato, che prima restava alto sei caselle — tre sopra la testa e tre sotto i piedi.' },
      { tipo:'meglio', t:'Tutto grande abbastanza per un dito', d:'La barra degli attrezzi era larga 466 pixel dentro uno schermo da 375: il primo e l\'ultimo attrezzo stavano fuori. Le celle dello zaino erano 21 pixel, la crocetta per chiudere le finestre 29. Adesso la barra ci sta, le finestre si aprono a tutto schermo, e ogni cosa che si tocca è grande almeno quanto un polpastrello. C\'è anche il rispetto della tacca dell\'iPhone e della barra di casa.' }
    ]
  },
  {
    v: '2.2',
    data: 'agosto 2026',
    titolo: 'Fioralba parla inglese, e la partita ti segue da un computer all\'altro',
    voci: [
      { tipo:'nuovo',  t:'Il gioco, tutto, anche in inglese', d:'Non solo i menu: le quindici lettere di Nonna Ilde, le sei testimonianze della notte del solstizio, la lezione di caccia di Oreste, le chiacchiere che ogni abitante cambia con la stagione, col tempo che fa e con l\'ora. Ottocentocinquantasei frasi. Si cambia lingua dalla pagina iniziale o dal menu, in qualsiasi momento, senza perdere niente.' },
      { tipo:'nuovo',  t:'La stessa partita dal fisso e dal portatile', d:'La partita si collega e riceve un codice. Su un altro computer si apre Fioralba, si scrive il codice, e si riprende da dov\'era. Se le due parti hanno lavorato tutte e due, il gioco non sceglie da solo: fa vedere le due partite — giorno, stagione, monete — e decidi tu quale vale.' },
      { tipo:'nuovo',  t:'«Ho già una partita, voglio riprenderla»', d:'Il pulsante per importare un salvataggio stava in fila con «Gioca» e «Come si gioca», tre pulsanti identici, e non lo trovava nessuno: non diceva né a chi serviva né cosa bisognava avere in mano. Adesso sulla pagina iniziale c\'è un riquadro che si apre e spiega le due strade — col codice, se la partita è già collegata; col file .json, se l\'hai esportata — e dice dove trovare l\'uno e l\'altro. Importando un file la partita si collega da sola e ti dà il codice.' },
      { tipo:'fix',    t:'Il tasto «English» adesso cambia anche la pagina iniziale', d:'Cambiava la lingua del gioco ma non quella della presentazione: si restava a leggere l\'italiano premendo un pulsante inglese.' }
    ]
  },
  {
    v: '2.1',
    data: 'agosto 2026',
    titolo: 'I livelli si vedono, e i dialoghi si leggono per intero',
    voci: [
      { tipo:'nuovo',  t:'Salire di livello adesso paga', d:'L\'esperienza c\'era ma saliva di nascosto: non si vedeva mai quanto mancasse, e all\'arrivo restava un avviso che spariva in tre secondi. Adesso ogni livello dà monete e un oggetto del mestiere che l\'ha guadagnato — chi zappa riceve semi, chi scava riceve lingotti — e si prende una carta che mostra il bonus appena sbloccato. Se lo zaino è pieno l\'oggetto non si perde: ti aspetta nella scheda.' },
      { tipo:'nuovo',  t:'Una scheda per i livelli, e una barretta mentre lavori', d:'Nel Diario c\'è «Livelli»: per ognuna delle cinque abilità il punto in cui sei, quanto manca alla prossima, tutti i bonus (anche quelli che devono ancora arrivare) e il premio del livello dopo. E mentre zappi o scavi compare in basso una barretta che dice quanto hai preso e quanto resta.' },
      { tipo:'fix',    t:'I dialoghi non si troncano più a metà', d:'Premere invio mentre la frase si scriveva doveva completarla e invece la congelava dov\'era arrivata, a metà parola. Chi legge in fretta premeva sempre, e si perdeva mezza storia credendo fosse scritta così.' },
      { tipo:'fix',    t:'I grassetti sono grassetti, non parole', d:'Nei dialoghi si leggeva «Prima cosa: <b>mettitelo in mano</b>» coi tag in chiaro.' },
      { tipo:'fix',    t:'Esportare la partita esporta la partita', d:'Dalla pagina iniziale, «Nuova Partita» propone di esportare prima di cancellare: quel pulsante salvava un file vuoto di trentun byte, che al reimport veniva giustamente rifiutato. Adesso esporta quello che c\'è davvero, e un file che non riusciremmo a rileggere non parte nemmeno.' },
      { tipo:'nuovo',  t:'Si importa un salvataggio dalla pagina iniziale', d:'Prima il pulsante stava solo nel menu interno: per riprendere una partita portata da un altro computer bisognava già averne una.' },
      { tipo:'meglio', t:'La caccia si sente nei piedi, non solo nella mira', d:'«Le prede si accorgono di te più tardi» era scritto nella descrizione dell\'abilità dall\'inizio, ma non succedeva: il livello serviva solo a centrare il bersaglio. Adesso salendo di Caccia ci si può avvicinare davvero di più.' },
      { tipo:'fix',    t:'La pioggia cade uguale su ogni schermo', d:'Gocce e fiocchi avanzavano a ogni fotogramma invece che col tempo: su un monitor a 144Hz la pioggia cadeva più del doppio più veloce che su uno normale.' },
      { tipo:'nuovo',  t:'Il gatto si lascia accarezzare', d:'C\'era dal primo giorno e non si poteva toccare: girava lì intorno e basta. Adesso si accarezza — una volta al giorno, di più non conta — e a poco a poco si avvicina: prima si sposta appena lo sfiori, alla fine ti cammina fra i piedi. A un certo punto scopri come si chiama, e non lo scegli tu.' },
      { tipo:'meglio', t:'Il gioco salva senza far scattare la partita', d:'Il salvataggio automatico si piazzava in mezzo a un fotogramma ogni due minuti, sempre mentre camminavi. Adesso aspetta un momento libero, e i file occupano un quinto in meno.' }
    ]
  },
  {
    v: '2.0',
    data: 'agosto 2026',
    titolo: 'La notte del solstizio',
    voci: [
      { tipo:'nuovo',  t:'La storia continua dopo le quattro braci', d:'Prima finiva lì: si accendeva la Lanterna e compariva un riquadro di testo. E in tutta la prima parte nessuno diceva mai perché la Lanterna si fosse spenta — il buco stava in mezzo alla trama fin dall\'inizio, e Fiammella lo diceva senza accorgersene: «Ilde lo faceva. Poi ha smesso di riuscirci». Adesso con le quattro braci accese la Lanterna non tiene, e Fiammella ti manda a chiedere in giro.' },
      { tipo:'nuovo',  t:'Sei testimonianze, una notte sola', d:'Bruno ha una riga aperta nel registro da dodici anni. Marisol ricorda chi è rimasto al tavolo d\'angolo. Elio era sul lago e ha visto due persone sul sentiero. Tobia ha un gancio da lanterna che non ha mai consegnato. Oreste guardava dal Passo, e dall\'alto si vede quello che dal basso non si vede. Serafina è l\'ultima, perché quella notte c\'era. Nessuno ha la risposta da solo, e per farsi raccontare una cosa così bisogna conoscersi: da 2 cuori con Bruno a 6 con Serafina.' },
      { tipo:'nuovo',  t:'La veglia', d:'Alla fine si scopre che una lanterna tenuta accesa da una persona sola si spegne la prima notte che quella persona non ce la fa. Ilde l\'ha tenuta da sola per quarant\'anni. Quindi l\'ultima cosa da fare non è portare altra roba al Santuario: è invitare tutti e sei alla radura e tornarci la sera dopo, dal tramonto. Due lettere nuove di Ilde chiudono la storia, e il finale adesso racconta la veglia invece di un\'accensione generica.' },
      { tipo:'meglio', t:'Le memorie si rileggono nel Diario', d:'Sei racconti raccolti in giro per la valle a mesi di distanza uno dall\'altro: senza un posto dove ritrovarli, quando arriva il sesto il primo è già evaporato. Stanno nella scheda Lettere, sopra alla posta.' },
      { tipo:'fix',    t:'Parlare con Fiammella non salta più il Santuario', d:'La scelta «Il santuario» nel suo dialogo andava dritta alle offerte invece di passare dal controllo di sempre. Siccome lei sta a due passi dalla porta, premendo E si parla con lei e non si entra: la sera della veglia avrebbe aperto la lista delle offerte al posto della veglia.' }
    ]
  },
  {
    v: '1.9',
    data: 'agosto 2026',
    titolo: 'Le staccionate si agganciano, e non si tolgono per sbaglio',
    voci: [
      { tipo:'fix',    t:'La staccionata segue la fila', d:'Il disegno era sempre lo stesso — due pali e due traverse orizzontali — quindi una fila che andava su e giù veniva su come una scala a pioli, e negli angoli i pezzi non si toccavano. Adesso ogni pezzo guarda chi ha intorno: traverse verso est e ovest, correnti di taglio verso nord e sud, e angoli, incroci e diramazioni che si chiudono da sé. Anche il cancelletto ruota, e di taglio resta l\'unica cosa chiara in mezzo alla fila, così il varco si trova.' },
      { tipo:'fix',    t:'Con E non si raccoglie più quello che hai posato', d:'Bastava premere E camminando lungo la propria staccionata per ritrovarsi un pezzo nello zaino e un buco nel recinto, con scritto solo «Raccolto». Adesso E gli passa accanto senza toccarli e senza rubare il turno: per togliere una staccionata, un cancelletto, una lanterna o uno spaventapasseri ci vuole una picconata, che è un gesto che non si fa distratti. L\'oggetto torna comunque nello zaino.' }
    ]
  },
  {
    v: '1.8',
    data: 'agosto 2026',
    titolo: 'Arriva la posta, e i cespugli dicono la verità',
    voci: [
      { tipo:'nuovo',  t:'Otto lettere nuove', d:'Ce n\'erano sei: l\'apertura, le quattro delle braci e la ricetta di Ilde. Ma le braci arrivano dopo il ponte, e fra la prima lettera e la seconda passava mezza partita con la cassetta vuota. Adesso la posta arriva col mattino, una lettera per volta, agganciata a cose che si fanno comunque: scendere in paese, tirare su il primo raccolto, prendere il primo pesce. Scrivono anche Elio, Tobia e Marisol — e la cassetta dice chi, invece di firmare tutto «Nonna Ilde».' },
      { tipo:'fix',    t:'Il cespuglio mostra quello che dà', d:'Sei bacche rosse in ogni stagione, ma d\'estate dà more, d\'autunno nocciole e di primavera viole: tre stagioni su quattro il cespuglio diceva una cosa e la falce ne dava un\'altra, e chi tagliava bacche rosse per ritrovarsi una viola in mano credeva di aver raccolto due cose diverse. Adesso in primavera le viole spuntano ai piedi del cespuglio, dove crescono davvero, e d\'estate e d\'autunno si vedono more e nocciole.' },
      { tipo:'nuovo',  t:'La Collezione dice cosa manca e dove sta', d:'Le caselle non scoperte dicevano «?» e basta, e da lì «la lavanda non esiste» è una conclusione ragionevole: esiste, è foraggio d\'estate, e in primavera non c\'è modo di incontrarla. Adesso ogni casella vuota dice cos\'è passandoci sopra, e sotto ogni sezione c\'è la lista di quello che manca con stagione e posto.' }
    ]
  },
  {
    v: '1.7',
    data: 'agosto 2026',
    titolo: 'Il ponte serve davvero',
    voci: [
      { tipo:'fix',    t:'Il burrone chiude la radura', d:'Il ponte del bosco costa 3000 monete, 100 legna e 40 pietra, ed è la missione che apre la storia. Solo che il burrone che avrebbe dovuto renderlo obbligatorio finiva a metà: bastava scendere qualche passo più a ovest ed eri nella radura a piedi asciutti. Tutte e 153 le caselle erano raggiungibili senza costruire niente. Adesso il burrone gira anche a sud, e c\'è un cartello che dice cos\'è. Chi ha già una partita se lo vede richiudere al primo caricamento, con le casse eventualmente traslocate sulla riva giusta.' },
      { tipo:'meglio', t:'Gli obiettivi dicono anche dove', d:'«Fatti costruire il ponte» diceva da chi ordinarlo, non dove sarebbe spuntato. Adesso lo dicono sia l\'obiettivo che Serafina che Tobia.' },
      { tipo:'nuovo',  t:'Dalla cassa prendi quante ne vuoi', d:'Cliccare una pila la prendeva tutta: con 282 legna e una cassa da costruire che ne vuole 20, toccava portarsi via il mucchio, costruire, e rimettere dentro il resto. Adesso chiede quante, in tutti e due i versi, con le scorciatoie per 1, 10, 50, metà e tutte.' },
      { tipo:'fix',    t:'Due casse vicine non si accavallano più', d:'I nomi si sovrapponevano e non si leggeva né l\'uno né l\'altro. Adesso le targhette si scansano a vicenda.' },
      { tipo:'meglio', t:'«Non c\'è nessuno» dice anche quando tornare', d:'Trovare la fucina vuota senza sapere a che ora Tobia ci sia voleva dire riprovare a caso. L\'orario è ricavato dalle giornate degli abitanti, quindi resta vero anche se cambiano.' }
    ]
  },
  {
    v: '1.6',
    data: 'agosto 2026',
    titolo: 'Si caccia, e i traguardi lo dicono',
    voci: [
      { tipo:'nuovo',  t:'La caccia, insegnata da Oreste', d:'Sul Passo c\'è un vecchio con un arco. Se vi conoscete abbastanza te ne dà uno e ti insegna: tre passi, e ognuno si chiude quando lo hai fatto davvero. Si tira davanti a sé, e più sei vicino più è facile. Allo scoiattolo e al riccio non si spara.' },
      { tipo:'nuovo',  t:'Quando compi un traguardo, il gioco te lo dice', d:'Prima si compivano in silenzio: il premio restava lì finché non aprivi il Diario e te ne accorgevi per caso.' },
      { tipo:'fix',    t:'Non si entra più dentro le porte', d:'La casella della porta era calpestabile, e sta dentro la sagoma della casa: chi ci saliva si ritrovava disegnato mezzo dentro e mezzo fuori.' },
      { tipo:'fix',    t:'La scala della miniera si imbocca', d:'Era un varco da una casella sola in fondo a un corridoio, e il passaggio scatta col centro del giocatore: trentadue pixel da azzeccare. Adesso tutte e quattro le scale sono larghe il doppio, con un pianerottolo sgombro.' },
      { tipo:'meglio', t:'La pagina di presentazione mostra la valle', d:'Al posto delle scenette a schede — che chiedevano di scegliere, aspettare e ricominciare — ci sono i sei posti tutti insieme: ritagli veri delle mappe, disegnati dal motore.' }
    ]
  },
  {
    v: '1.5',
    data: 'agosto 2026',
    titolo: 'Ogni cosa dice dove si trova',
    voci: [
      { tipo:'fix',    t:'Le finestre sul menu iniziale si vedono', d:'L\'avviso «hai una partita in corso» e la lista dei cambiamenti si aprivano dietro alla pagina di presentazione: si vedeva la finestra trasparire sotto il logo, coi pulsanti della pagina sopra.' },
      { tipo:'nuovo',  t:'Ogni oggetto dice dove si trova', d:'«La lavanda non c\'è» e «l\'uva non si sa dove sia» erano la stessa cosa: la lavanda è un foraggio d\'estate e ne spuntano più di cento in una stagione, l\'uva cresce dai semi che Bruno vende in autunno — solo che nessuno lo diceva. Adesso ogni oggetto porta la sua riga, ricavata dai dati del gioco: stagione, posto, attrezzo, ricetta.' },
      { tipo:'meglio', t:'Il negozio spiega cosa stai comprando', d:'Un sacchetto con scritto «Semi di Uva» e un prezzo non basta a decidere. Adesso dice in che stagione si semina e in quanti giorni matura, anche dal mercante ambulante.' },
      { tipo:'nuovo',  t:'Le casse si riordinano', d:'Trascinando, come nello zaino — e si trascina anche dallo zaino direttamente nella casella che vuoi. C\'è anche un tasto «Ordina» che raggruppa le pile uguali e mette in fila per tipo.' },
      { tipo:'fix',    t:'Le staccionate recintano davvero', d:'Quelle del giocatore fermavano, quelle del gioco si attraversavano. E il campo grande aveva tredici caselle aperte sul lato del viale: un recinto con tre lati. Adesso fermano tutte, e ci sono i cancelletti.' },
      { tipo:'nuovo',  t:'Il cancelletto', d:'Un varco nella staccionata, da costruire con 4 legna: ci passi tu, non le bestie.' }
    ]
  },
  {
    v: '1.4',
    data: 'agosto 2026',
    titolo: 'La miniera si esplora davvero, e il podere si riordina',
    voci: [
      { tipo:'fix',    t:'I mobili delle stanze rifatte sono tornati al loro posto', d:'Le stanze sono state allargate, ma i salvataggi vecchi continuavano a riversarci dentro le vecchie coordinate: nella casa il letto finiva sotto al camino. Chi riprende una partita di prima ritrova le stanze arredate come vanno.' },
      { tipo:'meglio', t:'I messaggi «hai preso qualcosa» si vedono', d:'Erano schiacciati contro il nome dell\'attrezzo sopra la barra, e uguali a tutte le altre notifiche. Adesso stanno più in alto, hanno icona grande e nome in oro, e se lo stesso oggetto arriva di nuovo non si impila un secondo cartello: si aggiorna quello che c\'è.' },
      { tipo:'meglio', t:'Il letto sembra un letto', d:'Era un rettangolo più piccolo del tappetino che gli sta accanto.' },
      { tipo:'fix',    t:'La miniera non è più un vicolo cieco', d:'I sassi si spaccano, quindi in teoria nessun livello era chiuso. In pratica lo era: dall\'ingresso del secondo livello si camminava su quattordici caselle su trecentoventotto, e la scala per il terzo stava dall\'altra parte di un tappo che non si vedeva. Adesso i corridoi restano aperti su tutti e tre i livelli.' },
      { tipo:'fix',    t:'Il primo livello non si mura più da solo', d:'Ogni notte si aggiungevano cinquantacinque sassi a quelli già lì, senza togliere i vecchi: in un mese la miniera passava dal 66% percorribile al 10%.' },
      { tipo:'nuovo',  t:'Le casse si possono chiamare per nome', d:'«Semi», «Minerali», «Roba da vendere». Il nome si legge su una targhetta sopra il coperchio, quindi si sa cosa c\'è dentro senza aprirla.' },
      { tipo:'nuovo',  t:'Casse e macchinari si spostano', d:'Senza svuotarli e senza perdere la lavorazione in corso: l\'oggetto cambia casella e basta. Serve quando amplii la casa e quello che avevi messo davanti alla porta finisce in mezzo ai piedi.' }
    ]
  },
  {
    v: '1.3',
    data: 'agosto 2026',
    titolo: 'La pesca si può vincere, e lo zaino si riordina',
    voci: [
      { tipo:'meglio', t:'La pesca non è più una lotteria', d:'Il pesce si muoveva a scatti casuali, la barra rimbalzava oltre dove la volevi, e per fare punti bisognava contenerlo tutto intero — cioè la finestra buona era la metà di quella disegnata. Misurato: un giocatore normale prendeva meno del 5% dei pesci. Adesso il pesce va verso un punto e ci si può stare dietro, e una lotta dura quattro secondi e mezzo invece di finire in mezzo secondo.' },
      { tipo:'nuovo',  t:'La prima volta che peschi, il gioco te lo spiega', d:'Tre passi: aspetta l\'abboccata, ferra entro due secondi, tieni il pesce nella barra. Con la pista disegnata accanto invece che descritta a parole.' },
      { tipo:'nuovo',  t:'Gli oggetti dello zaino si spostano', d:'Trascinandoli, oppure con «Sposta in un\'altra casella» dalla scheda dell\'oggetto. Le prime nove caselle sono la barra in basso: quello che metti lì lo hai in mano. Due pile uguali si sommano.' },
      { tipo:'meglio', t:'I traguardi spiegano dove si fanno', d:'Cliccane uno nel Diario: dice con quale attrezzo, in quale posto, e quale scorciatoia c\'è. «Frantuma 100 rocce» era un compito, non un suggerimento.' },
      { tipo:'fix',    t:'Nuova Partita avverte prima di cancellare', d:'Bastava un clic di troppo sul menu per perdere una stagione di lavoro. Adesso mostra a che punto eri e propone di esportare la partita prima.' }
    ]
  },
  {
    v: '1.2',
    data: 'agosto 2026',
    titolo: 'Le case si aprono, i colori si mettono d\'accordo',
    voci: [
      { tipo:'fix',    t:'Non si entra più dentro le case', d:'Il tetto di un edificio è disegnato più in alto del suo ingombro — la locanda di quasi due caselle — e quelle caselle erano calpestabili. Adesso la sagoma è solida tutta, tetto compreso.' },
      { tipo:'meglio', t:'La giornata dura di più', d:'Da 180 a 260 punti di energia, e un colpo d\'ascia o di piccone ne costa 3 invece di 4: da nove alberi al giorno a diciassette. Una costruzione adesso sta in una giornata di lavoro, non in due.' },
      { tipo:'nuovo',  t:'Si entra in bottega, in fucina, alla locanda e in casa', d:'Quattro stanze vere al posto di quattro finestre di dialogo, con pavimento, arredi e la loro luce. Gli abitanti ci stanno davvero dentro secondo l\'ora: Bruno dietro al bancone il pomeriggio, tutti alla locanda dopo cena.' },
      { tipo:'meglio', t:'Entrando si legge chi c\'è', d:'«Marisol, Bruno, Tobia ed Elio sono qui», oppure «Non c\'è nessuno: Tobia è alla locanda». Una stanza vuota senza spiegazioni sembrava un difetto del gioco invece di un orario di chiusura.' },
      { tipo:'meglio', t:'Le stanze sono arredate come stanze', d:'La roba sta sui muri in file continue, i mobili grossi stanno in coppia o in griglia, e fra la porta e il bancone ci passa una persona. Nuovi scaffali a parete e tappeti.' },
      { tipo:'meglio', t:'Una palette sola per tutto il gioco', d:'Erano 724 colori, e 561 avevano un gemello quasi identico: ognuno si era inventato il suo marrone. Adesso sono ventuno rampe da otto gradini, con le ombre che virano tutte verso lo stesso blu-viola e le luci verso lo stesso giallo caldo.' },
      { tipo:'meglio', t:'Il mondo si posa sulla griglia dei pixel', d:'La camera si aggancia al pixel: sparite le cuciture da un pixel fra i tasselli e lo sfarfallio camminando. E le sfumature morbide — pozze di luce, ombre delle nuvole, vignettatura — adesso passano da un retino, come si faceva quando i colori erano sedici.' },
      { tipo:'fix',    t:'L\'erba non brilla più', d:'Con la palette a gradini le variazioni minime del prato erano diventate coriandoli. Chiazze più discrete, ciuffi meno fitti, punte meno accese.' },
      { tipo:'nuovo',  t:'Questa lista', d:'In fondo alla pagina di presentazione c\'è cos\'è cambiato, versione per versione.' }
    ]
  },
  {
    v: '1.1',
    data: 'agosto 2026',
    titolo: 'Un paese con una giornata, e un podere che sembra un podere',
    voci: [
      { tipo:'nuovo',  t:'Gli abitanti hanno una giornata', d:'Dormono, aprono bottega, la sera vanno alla locanda, e col brutto tempo si mettono al riparo. Prima stavano fermi nello stesso fazzoletto di prato alle tre di notte come a mezzogiorno.' },
      { tipo:'nuovo',  t:'Compleanni e sagre', d:'Ognuno ha il suo giorno, e quel giorno ha una battuta sola per te. La sagra sposta davvero la gente in piazza.' },
      { tipo:'nuovo',  t:'Battute che tengono conto di dove siamo', d:'Stagione, tempo che fa e ora del giorno: chi passa ogni giorno non risente le stesse cinque frasi per mesi.' },
      { tipo:'meglio', t:'Il podere non è più un prato con una casa nell\'angolo', d:'Aia, viale, campo recintato, frutteto, stagno, un angolo lasciato selvatico e sei lanterne.' },
      { tipo:'fix',    t:'Le ombre cadevano verso il sole', d:'Erano inclinate al contrario: la mattina puntavano a est invece che a ovest.' },
      { tipo:'meglio', t:'Quando un\'azione non si può fare, il gioco dice perché', d:'Prima non succedeva niente e non si capiva se fosse un divieto o un difetto.' },
      { tipo:'nuovo',  t:'Nuova pagina di presentazione', d:'Mostra il gioco invece di descriverlo: le scene sono disegnate dal motore vero, in diretta.' }
    ]
  },
  {
    v: '1.0',
    data: 'luglio 2026',
    titolo: 'La valle prende forma',
    voci: [
      { tipo:'meglio', t:'Gli abitanti smettono di essere lo stesso corpo ricolorato sei volte', d:'Corporature, altezze e capigliature diverse.' },
      { tipo:'meglio', t:'Acqua che riflette, superfici che hanno grana, miniera con pareti vere', d:'Le grandi distese piatte non sono più campiture uniformi.' },
      { tipo:'nuovo',  t:'Tutorial interattivo e dimostrazioni animate', d:'I primi passi si imparano facendoli, e ogni gesto ha una scenetta che lo mostra.' },
      { tipo:'nuovo',  t:'Salvataggio esportabile', d:'La partita sta nel browser, ma si può portare via in un file.' },
      { tipo:'nuovo',  t:'Nuove mappe', d:'Il bosco, la miniera su tre livelli, il passo di montagna, la piazza, la costa.' }
    ]
  }
];

/* La versione, presa dalla voce più recente e stampata dove serve.

   Era scritta a mano in tre punti di index.html, e si era già scollata:
   il riquadro del changelog diceva 2.0 — quello lo riempie la landing
   leggendo di qui — mentre il piede della stessa pagina, due centimetri
   sotto, diceva ancora 1.6. Adesso chiunque voglia mostrarla mette
   `class="app-ver"` e ci pensa questo file; un controllo in
   tools/coerenza.js verifica che in index.html non ne resti nessuna
   scritta a mano. */
window.CHANGELOG.versione = window.CHANGELOG[0].v;

function stampaVersione(){
  for(const e of document.querySelectorAll('.app-ver')) e.textContent = 'v' + window.CHANGELOG.versione;
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', stampaVersione);
else stampaVersione();

})();
