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

})();
