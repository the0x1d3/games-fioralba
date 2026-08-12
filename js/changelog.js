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
    v: '1.4',
    data: 'agosto 2026',
    titolo: 'La miniera si esplora davvero, e il podere si riordina',
    voci: [
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
