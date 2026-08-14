// @ts-check
/* ===================================================================
   FIORALBA — data.js
   Tutti i dati di gioco: colture, oggetti, ricette, personaggi, lore.

   Questo file è controllato dai tipi: `npm run check` segnala id
   inesistenti, campi mancanti e valori del tipo sbagliato. È il file in
   cui un refuso costa di più, perché non fa rumore finché non rompe una
   ricetta o una missione.
   =================================================================== */
(function(){
'use strict';

/* Dichiarare subito il tipo di D fa sì che ogni assegnazione qui sotto venga
   controllata contro la sua forma attesa (e che i letterali come 'primavera'
   restino tali invece di allargarsi a string). */
const D = /** @type {FioData} */ ({});
window.DATA = D;

/* ------------------------------------------------------------------
   STAGIONI
   ------------------------------------------------------------------ */
/* Fra chioma ed erba ci vuole un salto vero, non un'ombra di salto. In
   primavera i due verdi distavano diciannove punti di luminosità su
   255: bastavano finché ogni colore era libero, ma su una palette
   chiusa cadono sullo stesso gradino e il cespuglio sparisce nel prato.
   La chioma di primavera adesso scende di un gradino, come già faceva
   in tutte le altre stagioni. Il controllo di coerenza lo verifica. */
D.SEASONS = [
  { id:'primavera', nome:'Primavera', grass:'#6fa84f', grass2:'#5d9442', tree:'#4e8036', accent:'#f5a6c0' },
  { id:'estate',    nome:'Estate',    grass:'#5f9c3c', grass2:'#4f8a32', tree:'#356e2b', accent:'#f7d154' },
  { id:'autunno',   nome:'Autunno',   grass:'#93924a', grass2:'#807f3e', tree:'#c47a2c', accent:'#d9713c' },
  { id:'inverno',   nome:'Inverno',   grass:'#c9d6dd', grass2:'#b4c4cd', tree:'#8fa5ae', accent:'#a8d0e6' }
];
D.GIORNI_STAGIONE = 28;
D.GIORNI_SETTIMANA = ['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'];

D.METEO = {
  sereno:   { nome:'Sereno',   icona:'sole' },
  nuvoloso: { nome:'Nuvoloso', icona:'nuvola' },
  pioggia:  { nome:'Pioggia',  icona:'pioggia' },
  temporale:{ nome:'Temporale',icona:'temporale' },
  neve:     { nome:'Neve',     icona:'neve' },
  vento:    { nome:'Ventoso',  icona:'vento' }
};

/* ------------------------------------------------------------------
   COLTURE
   forma: tipo di disegno del frutto
   ------------------------------------------------------------------ */
D.CROPS = {
  rapa:      { nome:'Rapa',           stagioni:['primavera'], fasi:[1,1,1,1],      prezzo:38,  seme:20,  forma:'radice', c1:'#f0f0f5', c2:'#c07ad8', foglia:'#6fae3e' },
  patata:    { nome:'Patata',         stagioni:['primavera'], fasi:[1,2,1,2],      prezzo:52,  seme:26,  forma:'tubero', c1:'#c8a06a', c2:'#a37f4d', foglia:'#5f9c3c' },
  spinacio:  { nome:'Spinacio',       stagioni:['primavera'], fasi:[1,1,1,2],      prezzo:44,  seme:22,  forma:'foglia', c1:'#4f9c3f', c2:'#3c7a30', foglia:'#5faf46' },
  fragola:   { nome:'Fragola',        stagioni:['primavera'], fasi:[2,2,2,2],      prezzo:72,  seme:70,  ricresce:4, forma:'bacca',  c1:'#e8465c', c2:'#b52a3f', foglia:'#5f9c3c' },
  narciso:   { nome:'Narciso',        stagioni:['primavera'], fasi:[1,2,1,1],      prezzo:56,  seme:30,  forma:'fiore',  c1:'#ffe270', c2:'#f0b53c', foglia:'#5f9c3c' },

  pomodoro:  { nome:'Pomodoro',       stagioni:['estate'],    fasi:[2,2,2,2],      prezzo:66,  seme:32,  ricresce:4, forma:'bacca',  c1:'#e04a35', c2:'#a83324', foglia:'#4f8a32' },
  mais:      { nome:'Mais',           stagioni:['estate','autunno'], fasi:[2,3,3,3], prezzo:82, seme:46, ricresce:4, forma:'pannocchia', c1:'#f5d24f', c2:'#d1a52c', foglia:'#5f9c3c' },
  girasole:  { nome:'Girasole',       stagioni:['estate','autunno'], fasi:[2,2,2,2], prezzo:78, seme:42, forma:'fiore',  c1:'#ffd23c', c2:'#c98a1e', foglia:'#4f8a32' },
  melone:    { nome:'Melone',         stagioni:['estate'],    fasi:[3,3,2,3],      prezzo:145, seme:66,  forma:'sfera',  c1:'#7fc45a', c2:'#4e8a35', foglia:'#4f8a32' },
  peperone:  { nome:'Peperoncino',    stagioni:['estate'],    fasi:[1,2,1,1],      prezzo:48,  seme:32,  ricresce:3, forma:'baccello', c1:'#e2452c', c2:'#a82f1c', foglia:'#4f8a32' },

  zucca:     { nome:'Zucca',          stagioni:['autunno'],   fasi:[3,3,3,3],      prezzo:175, seme:78,  forma:'sfera',  c1:'#e8892c', c2:'#b8611a', foglia:'#7a8a3a' },
  uva:       { nome:'Uva',            stagioni:['autunno'],   fasi:[2,2,3,2],      prezzo:76,  seme:48,  ricresce:3, forma:'grappolo', c1:'#8a4fb0', c2:'#5f3080', foglia:'#7a8a3a' },
  cavolo:    { nome:'Cavolo',         stagioni:['autunno'],   fasi:[2,2,2,1],      prezzo:70,  seme:36,  forma:'foglia', c1:'#8fc47a', c2:'#5f9450', foglia:'#7a8a3a' },
  melanzana: { nome:'Melanzana',      stagioni:['autunno'],   fasi:[1,2,2,1],      prezzo:60,  seme:32,  ricresce:5, forma:'baccello', c1:'#6b3f8f', c2:'#472860', foglia:'#7a8a3a' },
  mirtillo:  { nome:'Mirtillo',       stagioni:['autunno'],   fasi:[2,2,2,2],      prezzo:55,  seme:44,  ricresce:4, forma:'bacca',  c1:'#4a63b8', c2:'#2f4383', foglia:'#7a8a3a' },

  radice_inverno:{ nome:'Radice d\'Inverno', stagioni:['inverno'], fasi:[2,2,2,2], prezzo:130, seme:75, forma:'radice', c1:'#d8e6ee', c2:'#8fa8bd', foglia:'#7f9c8a' },
  cristallia:{ nome:'Cristallia',     stagioni:['inverno'],   fasi:[3,3,2,3],      prezzo:230, seme:130, forma:'fiore',  c1:'#a8e8f0', c2:'#5fa8c8', foglia:'#7f9c8a', magica:true }
};

/* ------------------------------------------------------------------
   OGGETTI
   cat: raccolto | foraggio | minerale | pesce | materiale | artigianato
        | cibo | seme | attrezzo | animale
   ------------------------------------------------------------------ */
D.ITEMS = {
  /* --- attrezzi --- */
  zappa:      { nome:'Zappa',        cat:'attrezzo', desc:'Dissoda la terra per seminare.',      icona:'zappa' },
  annaffiatoio:{nome:'Annaffiatoio', cat:'attrezzo', desc:'Bagna il terreno arato.',             icona:'annaffiatoio' },
  ascia:      { nome:'Ascia',        cat:'attrezzo', desc:'Abbatte alberi e ceppi.',             icona:'ascia' },
  piccone:    { nome:'Piccone',      cat:'attrezzo', desc:'Frantuma sassi e vene di minerale.',  icona:'piccone' },
  falce:      { nome:'Falce',        cat:'attrezzo', desc:'Taglia erbacce e sterpaglia.',        icona:'falce' },
  canna:      { nome:'Canna da pesca',cat:'attrezzo',desc:'Per le acque calme della valle.',     icona:'canna' },
  arco:       { nome:'Arco',         cat:'attrezzo', desc:'Corno e tendine. Te lo insegna Oreste, sul Passo.', icona:'arco' },

  /* --- materiali --- */
  legna:      { nome:'Legna',      cat:'materiale', prezzo:6,  desc:'Utile per costruire quasi tutto.' },
  pietra:     { nome:'Pietra',     cat:'materiale', prezzo:5,  desc:'Solida e grigia.' },
  fibra:      { nome:'Fibra',      cat:'materiale', prezzo:3,  desc:'Filamenti d\'erba secca.' },
  argilla:    { nome:'Argilla',    cat:'materiale', prezzo:14, desc:'Morbida, si trova zappando.' },
  carbone:    { nome:'Carbone',    cat:'materiale', prezzo:22, desc:'Brucia a lungo e caldo.' },
  linfa:      { nome:'Linfa d\'acero', cat:'materiale', prezzo:26, desc:'Dolce resina degli alberi.' },
  /* --- la caccia --- */
  carne:      { nome:'Carne',      cat:'animale',   prezzo:70, desc:'Da appendere al fresco. Oreste dice di non sprecarne niente.' },
  pelle:      { nome:'Pelle',      cat:'materiale', prezzo:85, desc:'Conciata dura una vita. Tobia la usa per le impugnature.' },
  corno_cervo:{ nome:'Corno di Cervo', cat:'materiale', prezzo:220, desc:'Il cervo lo perde ogni anno da solo: prenderlo così è un\'altra cosa.' },
  uovo:       { nome:'Uovo',       cat:'animale',   prezzo:32, desc:'Ancora tiepido.' },
  uovo_oro:   { nome:'Uovo d\'Oro',cat:'animale',   prezzo:340,desc:'Le galline felici fanno miracoli.' },
  miele:      { nome:'Miele',      cat:'materiale', prezzo:75, desc:'Denso, profumato di fiori.' },
  latte:      { nome:'Latte',      cat:'animale',   prezzo:65, desc:'Cremoso e fresco. Bruno lo prende dalla cascina di là dal colle.' },

  /* --- minerali --- */
  rame:       { nome:'Minerale di Rame',  cat:'minerale', prezzo:18,  desc:'Rossastro.' },
  ferro:      { nome:'Minerale di Ferro', cat:'minerale', prezzo:42,  desc:'Pesante e scuro.' },
  oro:        { nome:'Minerale d\'Oro',   cat:'minerale', prezzo:95,  desc:'Luccica anche al buio.' },
  lingotto_rame:{nome:'Lingotto di Rame', cat:'minerale', prezzo:70,  desc:'Fuso nella fornace.' },
  lingotto_ferro:{nome:'Lingotto di Ferro',cat:'minerale',prezzo:150, desc:'Pronto per il fabbro.' },
  lingotto_oro:{nome:'Lingotto d\'Oro',   cat:'minerale', prezzo:340, desc:'Caldo di riflessi.' },
  quarzo:     { nome:'Quarzo',            cat:'minerale', prezzo:55,  desc:'Trasparente, freddo.' },
  ametista:   { nome:'Ametista',          cat:'minerale', prezzo:130, desc:'Viola profondo.' },
  gemma_luna: { nome:'Gemma di Luna',     cat:'minerale', prezzo:420, desc:'Pulsa piano, come un respiro.' },
  geode:      { nome:'Geode',             cat:'minerale', prezzo:35,  desc:'Chissà cosa c\'è dentro.' },

  /* --- foraggio --- */
  cipolla_selvatica:{ nome:'Cipolla Selvatica', cat:'foraggio', prezzo:42, stagione:'primavera', desc:'Pungente e sincera.' },
  dente_leone:      { nome:'Dente di Leone',    cat:'foraggio', prezzo:32, stagione:'primavera', desc:'Un desiderio per soffio.' },
  viola:            { nome:'Viola di Bosco',    cat:'foraggio', prezzo:48, stagione:'primavera', desc:'Cresce all\'ombra.' },
  mora:             { nome:'Mora',              cat:'foraggio', prezzo:46, stagione:'estate',    desc:'Macchia le dita.' },
  erba_dolce:       { nome:'Erba Dolce',        cat:'foraggio', prezzo:54, stagione:'estate',    desc:'Sa di miele e sole.' },
  lavanda:          { nome:'Lavanda',           cat:'foraggio', prezzo:58, stagione:'estate',    desc:'Profuma il cassetto.' },
  fungo_porcino:    { nome:'Porcino',           cat:'foraggio', prezzo:92, stagione:'autunno',   desc:'Il re del sottobosco.' },
  nocciola:         { nome:'Nocciola',          cat:'foraggio', prezzo:52, stagione:'autunno',   desc:'Gli scoiattoli ti guardano male.' },
  melagrana:        { nome:'Melagrana',         cat:'foraggio', prezzo:115,stagione:'autunno',   desc:'Cento rubini dentro.' },
  bacca_inverno:    { nome:'Bacca d\'Inverno',  cat:'foraggio', prezzo:62, stagione:'inverno',   desc:'Rossa sulla neve.' },
  radice_gelata:    { nome:'Radice Gelata',     cat:'foraggio', prezzo:84, stagione:'inverno',   desc:'Croccante di brina.' },
  fiocco_cristallo: { nome:'Cristallo di Neve', cat:'foraggio', prezzo:105,stagione:'inverno',   desc:'Non si scioglie mai.' },

  /* --- pesci --- */
  trota:      { nome:'Trota',            cat:'pesce', prezzo:60,  diff:2, stagioni:['primavera','autunno','inverno'], luogo:'fiume' },
  carpa:      { nome:'Carpa',            cat:'pesce', prezzo:38,  diff:1, stagioni:['primavera','estate','autunno','inverno'], luogo:'lago' },
  persico:    { nome:'Persico',          cat:'pesce', prezzo:72,  diff:2, stagioni:['primavera','estate'], luogo:'lago' },
  luccio:     { nome:'Luccio',           cat:'pesce', prezzo:130, diff:4, stagioni:['estate','autunno'], luogo:'lago' },
  anguilla:   { nome:'Anguilla',         cat:'pesce', prezzo:110, diff:3, stagioni:['autunno','inverno'], luogo:'fiume', notte:true },
  storione:   { nome:'Storione',         cat:'pesce', prezzo:220, diff:5, stagioni:['estate','inverno'], luogo:'lago' },
  temolo:     { nome:'Temolo',           cat:'pesce', prezzo:95,  diff:3, stagioni:['inverno','primavera'], luogo:'fiume' },
  pesce_sole: { nome:'Pesce Sole',       cat:'pesce', prezzo:48,  diff:1, stagioni:['primavera','estate'], luogo:'fiume' },
  pesce_luna: { nome:'Pesce Luna',       cat:'pesce', prezzo:300, diff:6, stagioni:['estate','autunno'], luogo:'lago', notte:true, raro:true },
  gambero:    { nome:'Gambero di Fiume', cat:'pesce', prezzo:66,  diff:2, stagioni:['primavera','estate','autunno'], luogo:'fiume' },
  branzino:   { nome:'Branzino',        cat:'pesce', prezzo:95,  diff:3, stagioni:['primavera','estate','autunno','inverno'], luogo:'mare' },
  orata:      { nome:'Orata',           cat:'pesce', prezzo:115, diff:3, stagioni:['primavera','estate','autunno'], luogo:'mare' },
  sgombro:    { nome:'Sgombro',         cat:'pesce', prezzo:70,  diff:2, stagioni:['estate','autunno'], luogo:'mare' },
  polpo:      { nome:'Polpo',           cat:'pesce', prezzo:155, diff:4, stagioni:['primavera','estate','autunno','inverno'], luogo:'mare' },
  ricciola:   { nome:'Ricciola',        cat:'pesce', prezzo:240, diff:5, stagioni:['estate','autunno'], luogo:'mare', raro:true },
  scarpa_vecchia:{nome:'Scarpa Vecchia', cat:'pesce', prezzo:2,   diff:1, spazzatura:true },
  alga:       { nome:'Alga',             cat:'pesce', prezzo:8,   diff:1, spazzatura:true },
  lattina:    { nome:'Lattina Arrugginita',cat:'pesce',prezzo:2,  diff:1, spazzatura:true },

  /* --- artigianato / macchine --- */
  concime:    { nome:'Concime',       cat:'artigianato', prezzo:36, desc:'Migliora la qualità del raccolto.', uso:'concime' },
  concime_acqua:{nome:'Terra Umida',  cat:'artigianato', prezzo:44, desc:'Il terreno resta bagnato la notte.', uso:'ritenzione' },
  spaventapasseri:{nome:'Spaventapasseri',cat:'artigianato',prezzo:90, desc:'Tiene lontani i corvi nel raggio di 6 caselle.', posabile:'spaventapasseri' },
  sentiero:   { nome:'Sentiero di Pietra', cat:'artigianato', prezzo:4, desc:'Cammini più veloce e l\'erba non ricresce.', posabile:'sentiero' },
  recinto:    { nome:'Staccionata',   cat:'artigianato', prezzo:8,  desc:'Delimita con garbo, e si aggancia da sé ai pezzi vicini. Non ci si passa attraverso: per quello serve un cancelletto. Per toglierla, una picconata.', posabile:'recinto' },
  cancelletto:{ nome:'Cancelletto',   cat:'artigianato', prezzo:14, desc:'Il varco di una staccionata. Tu passi, le bestie no. Per toglierlo, una picconata.', posabile:'cancelletto' },
  /* Il cartello nasce da chi ci gioca: «sto dividendo il campo a zone e
     vorrei mettere dei cartelli con scritto Pomodori, Patate». I cartelli
     del gioco esistevano già — quello del burrone, quelli dei sentieri —
     ma erano paesaggio, scritti da noi. Questo lo scrive il giocatore, e
     si legge da fermi: la targhetta sta sopra al palo, come il nome di
     una cassa, e non chiede di premere niente. */
  cartello:   { nome:'Cartello',      cat:'artigianato', prezzo:10, desc:'Un palo e una tavoletta. Ci scrivi sopra quello che vuoi e si legge da lontano, senza doverlo toccare. Per toglierlo, una picconata.', posabile:'cartello' },
  lanterna:   { nome:'Lanterna',      cat:'artigianato', prezzo:120,desc:'Illumina la notte intorno a sé.', posabile:'lanterna' },
  cassa:      { nome:'Cassa',         cat:'artigianato', prezzo:0,  desc:'Deposito da 24 caselle.', posabile:'cassa' },
  barattoliera:{nome:'Barattoliera',  cat:'artigianato', prezzo:0,  desc:'Trasforma un raccolto in conserva (valore x2 + 50).', posabile:'barattoliera' },
  botte:      { nome:'Botte',         cat:'artigianato', prezzo:0,  desc:'Frutta → vino, verdura → succo (valore x3).', posabile:'botte' },
  forno:      { nome:'Forno a Legna', cat:'artigianato', prezzo:0,  desc:'Cucina i piatti che ridanno energia.', posabile:'forno' },
  fornace:    { nome:'Fornace',       cat:'artigianato', prezzo:0,  desc:'Minerale + carbone → lingotto.', posabile:'fornace' },
  arnia:      { nome:'Arnia',         cat:'artigianato', prezzo:0,  desc:'Produce miele ogni 4 giorni.', posabile:'arnia' },
  vaso_lucciole:{nome:'Barattolo di Lucciole',cat:'artigianato',prezzo:180,desc:'Una piccola notte d\'estate in tasca.', posabile:'lanterna' },

  /* --- cibo --- */
  zuppa_contadina:{ nome:'Zuppa Contadina', cat:'cibo', prezzo:135, energia:70,  desc:'Scalda anche i pensieri.' },
  spezzatino:     { nome:'Spezzatino',      cat:'cibo', prezzo:290, energia:130, desc:'Cotto piano tutto il pomeriggio. La ricetta è di Oreste, e non prevede fretta.' },
  frittata:       { nome:'Frittata',        cat:'cibo', prezzo:150, energia:80,  desc:'Semplice, perfetta.' },
  insalata_orto:  { nome:'Insalata dell\'Orto', cat:'cibo', prezzo:110, energia:55, desc:'Croccante di rugiada.' },
  torta_zucca:    { nome:'Torta di Zucca',  cat:'cibo', prezzo:300, energia:140, desc:'La ricetta di Nonna Ilde.' },
  crostata:       { nome:'Crostata di Frutti', cat:'cibo', prezzo:260, energia:120, desc:'Il bordo è la parte migliore.' },
  polenta:        { nome:'Polenta',         cat:'cibo', prezzo:120, energia:65,  desc:'Gira, gira, gira.' },
  pesce_arrosto:  { nome:'Pesce Arrosto',   cat:'cibo', prezzo:180, energia:95,  desc:'Con un rametto di lavanda.' },
  pane_miele:     { nome:'Pane e Miele',    cat:'cibo', prezzo:95,  energia:50,  desc:'Merenda dell\'infanzia.' },
  tisana:         { nome:'Tisana di Serafina', cat:'cibo', prezzo:140, energia:100, desc:'Sa di bosco dopo la pioggia.' },

  /* --- speciali / lore --- */
  brace_primavera:{ nome:'Brace di Primavera', cat:'speciale', prezzo:0, desc:'Un tepore verde tra le mani.' },
  brace_estate:   { nome:'Brace d\'Estate',    cat:'speciale', prezzo:0, desc:'Scotta appena, come un ricordo.' },
  brace_autunno:  { nome:'Brace d\'Autunno',   cat:'speciale', prezzo:0, desc:'Odora di foglie e fumo.' },
  brace_inverno:  { nome:'Brace d\'Inverno',   cat:'speciale', prezzo:0, desc:'Fredda fuori, viva dentro.' },
  medaglione:     { nome:'Medaglione di Ilde', cat:'speciale', prezzo:0, desc:'Sul retro: "torna quando la valle chiama".' },
  gancio_lanterna:{ nome:'Gancio da Lanterna', cat:'speciale', prezzo:0, desc:'Ferro battuto, con la spirale. Tobia l\'ha finito il giorno prima del solstizio e non l\'ha consegnato per dodici anni.' },
  gallina:        { nome:'Gallina',            cat:'animale',  prezzo:0, desc:'Ha già deciso come si chiama.' }
};

/* semi generati automaticamente dalle colture */
for(const id in D.CROPS){
  const c = D.CROPS[id];
  D.ITEMS[id] = { nome:c.nome, cat:'raccolto', prezzo:c.prezzo, crop:id,
                  desc:c.magica ? 'Sembra fatto di luce.' : 'Coltivato con le tue mani.' };
  D.ITEMS['seme_'+id] = { nome:'Semi di '+c.nome, cat:'seme', prezzo:Math.floor(c.seme/2),
                          seme:id, desc:'Si piantano in '+c.stagioni.map(s=>s[0].toUpperCase()+s.slice(1)).join(' e ')+'.' };
}

/* categorie considerate "frutta" per la botte */
D.FRUTTA = ['fragola','pomodoro','melone','uva','mirtillo','mora','melagrana','bacca_inverno','nocciola'];

/* ------------------------------------------------------------------
   RICETTE ARTIGIANATO
   ------------------------------------------------------------------ */
D.CRAFT = [
  { id:'sentiero',      out:4, ing:{pietra:1},                          liv:0, cat:'podere' },
  { id:'recinto',       out:4, ing:{legna:2},                           liv:0, cat:'podere' },
  { id:'cartello',      out:2, ing:{legna:3},                           liv:0, cat:'podere' },
  { id:'cancelletto',   out:1, ing:{legna:4},                           liv:0, cat:'podere' },
  { id:'concime',       out:2, ing:{fibra:4, carbone:1},                liv:1, cat:'podere' },
  { id:'concime_acqua', out:2, ing:{argilla:2, fibra:3},                liv:2, cat:'podere' },
  { id:'spaventapasseri',out:1,ing:{fibra:20, legna:8, carbone:1},      liv:2, cat:'podere' },
  { id:'cassa',         out:1, ing:{legna:20},                          liv:0, cat:'podere' },
  { id:'lanterna',      out:1, ing:{legna:6, lingotto_rame:1, carbone:2},liv:0,cat:'podere' },
  { id:'vaso_lucciole', out:1, ing:{quarzo:1, fibra:8, legna:4},        liv:0, cat:'podere', stagione:'estate' },
  { id:'fornace',       out:1, ing:{pietra:22, carbone:3},              liv:0, cat:'macchine' },
  { id:'barattoliera',  out:1, ing:{legna:26, pietra:8, lingotto_rame:1},liv:3,cat:'macchine' },
  { id:'botte',         out:1, ing:{legna:30, lingotto_rame:1, lingotto_ferro:1},liv:5,cat:'macchine' },
  { id:'forno',         out:1, ing:{pietra:26, legna:12, argilla:3},    liv:2, cat:'macchine' },
  { id:'arnia',         out:1, ing:{legna:30, fibra:10, lingotto_ferro:1},liv:4,cat:'macchine' }
];

/* ricette del forno (cucina) */
D.CUCINA = [
  { id:'zuppa_contadina', ing:{patata:1, cipolla_selvatica:1} },
  { id:'frittata',        ing:{uovo:2, pomodoro:1} },
  { id:'insalata_orto',   ing:{spinacio:1, cavolo:1, erba_dolce:1} },
  { id:'polenta',         ing:{mais:2, latte:1} },
  { id:'pane_miele',      ing:{miele:1, mais:1} },
  { id:'crostata',        ing:{fragola:1, mirtillo:1, miele:1} },
  { id:'torta_zucca',     ing:{zucca:1, uovo:2, miele:1} },
  { id:'pesce_arrosto',   ing:{trota:1, lavanda:1} },
  { id:'spezzatino',      ing:{carne:1, patata:2, cipolla_selvatica:1} },
  { id:'tisana',          ing:{lavanda:1, erba_dolce:1, viola:1} }
];

/* ------------------------------------------------------------------
   NEGOZIO DI BRUNO — stock stagionale
   ------------------------------------------------------------------ */
D.SHOP_SEMPRE = ['seme_'+'rapa'];
D.SHOP = {
  primavera:['seme_rapa','seme_patata','seme_spinacio','seme_fragola','seme_narciso'],
  estate:   ['seme_pomodoro','seme_mais','seme_girasole','seme_melone','seme_peperone'],
  autunno:  ['seme_zucca','seme_uva','seme_cavolo','seme_melanzana','seme_mirtillo','seme_mais'],
  inverno:  ['seme_radice_inverno','seme_cristallia']
};
D.SHOP_EXTRA = ['fibra','legna','pietra','concime','sentiero','latte','gallina'];

/* costruzioni dal fabbro / carpentiere */
D.COSTRUZIONI = [
  { id:'pollaio',  nome:'Pollaio',        costo:4000,  ing:{legna:120, pietra:20},
    desc:'Tre galline ci staranno comode. Uova ogni mattina.' },
  { id:'serra',    nome:'Serra',          costo:12000, ing:{legna:200, pietra:120, lingotto_oro:5},
    desc:'Dentro è sempre estate: coltiva in ogni stagione.' },
  { id:'silo',     nome:'Silo',           costo:2500,  ing:{legna:60, pietra:60, argilla:10},
    desc:'Aumenta lo spazio dell\'inventario di 12 caselle.' },
  { id:'ponte',    nome:'Ponte del Bosco',costo:3000,  ing:{legna:100, pietra:40},
    desc:'Apre il sentiero verso la Radura degli Spiriti.' },
  { id:'casa2',    nome:'Ampliamento Casa',costo:8000, ing:{legna:150, pietra:50},
    desc:'Una cucina vera, e una finestra che guarda a est.' }
];

/* potenziamenti attrezzi */
D.UPGRADE = {
  zappa:        [{liv:1,nome:'Rame',   costo:1500, ing:{lingotto_rame:5}},
                 {liv:2,nome:'Ferro',  costo:4500, ing:{lingotto_ferro:5}},
                 {liv:3,nome:'Oro',    costo:11000,ing:{lingotto_oro:5}}],
  annaffiatoio: [{liv:1,nome:'Rame',   costo:1500, ing:{lingotto_rame:5}},
                 {liv:2,nome:'Ferro',  costo:4500, ing:{lingotto_ferro:5}},
                 {liv:3,nome:'Oro',    costo:11000,ing:{lingotto_oro:5}}],
  ascia:        [{liv:1,nome:'Rame',   costo:1500, ing:{lingotto_rame:5}},
                 {liv:2,nome:'Ferro',  costo:4500, ing:{lingotto_ferro:5}},
                 {liv:3,nome:'Oro',    costo:11000,ing:{lingotto_oro:5}}],
  piccone:      [{liv:1,nome:'Rame',   costo:1500, ing:{lingotto_rame:5}},
                 {liv:2,nome:'Ferro',  costo:4500, ing:{lingotto_ferro:5}},
                 {liv:3,nome:'Oro',    costo:11000,ing:{lingotto_oro:5}}],
  /* l'arco non si tempra: si rinforza con quello che la caccia stessa
     restituisce, ed e' il motivo per cui Tobia lo accetta in fucina */
  arco:         [{liv:1,nome:'Teso',   costo:1200, ing:{pelle:4}},
                 {liv:2,nome:'Ricurvo',costo:3800, ing:{corno_cervo:2, pelle:6}},
                 {liv:3,nome:'Lungo',  costo:9000, ing:{corno_cervo:5, lingotto_oro:2}}]
};
D.UPG_NOMI = ['Semplice','di Rame','di Ferro','d\'Oro'];

/* ------------------------------------------------------------------
   ABILITÀ
   ------------------------------------------------------------------ */
D.SKILLS = {
  agricoltura:{ nome:'Agricoltura', icona:'zappa',  desc:'I raccolti valgono di più.' },
  raccolta:   { nome:'Raccolta',    icona:'falce',  desc:'Più legna, più fibra, più fortuna nel bosco.' },
  estrazione: { nome:'Estrazione',  icona:'piccone',desc:'Le rocce cedono più in fretta.' },
  pesca:      { nome:'Pesca',       icona:'canna',  desc:'La barra si allarga, i pesci si stancano.' },
  caccia:     { nome:'Caccia',      icona:'arco',   desc:'Le prede si accorgono di te più tardi, e rendono di più.' }
};
D.XP_LIV = [0,100,260,500,850,1350,2000,2850,3900,5200,6800];

/* I coefficienti dei bonus, in un posto solo perché li leggono in due:
   il gioco per applicarli e la scheda delle abilità per raccontarli.

   Erano scritti due volte — il numero vero sparso fra game.js e pesca.js,
   la frase in ui.js — e le due copie avevano già cominciato a divergere:
   la scheda prometteva «barra di pesca +7px per livello» mentre pesca.js
   ne dava 8, e della Caccia non diceva niente perché l'elenco a mano si
   era fermato a quattro abilità su cinque. Adesso chi cambia il numero
   cambia anche la frase, che è l'unico modo perché restino d'accordo. */
D.BONUS = {
  agricoltura:{ valore:0.03, doppio:0.02 },
  raccolta:   { valore:0.03, foraggio:0.04, fibra:0.04, legnaOgni:3 },
  estrazione: { valore:0.02, extraBase:0.25, extra:0.03, pietraDa:5 },
  pesca:      { valore:0.03, barra:8, guadagno:0.03, spazzatura:0.012 },
  /* `uditoMax` è il tetto, e sta qui e non solo in mobs.js perché senza di
     lui la frase e il codice tornerebbero d'accordo solo per combinazione:
     0.06 × 10 livelli fa esattamente 0.6, ma basta alzare `udito` a 0.08
     perché la scheda prometta l'80% mentre le prede si fermano al 60%. */
  caccia:     { mira:0.035, udito:0.06, uditoMax:0.6 }
};

/* Come si legge un bonus, a parole. Una riga per effetto: la scheda le
   mostra tutte, e quelle che a livello 0 non fanno niente le mostra
   spente — vedere cosa *arriverà* è metà del motivo per salire. */
D.BONUS_TESTO = {
  agricoltura: lv => [
    ['Raccolti più preziosi', '+' + Math.round(lv*D.BONUS.agricoltura.valore*100) + '% sul prezzo'],
    ['Raccolto doppio',       Math.round(lv*D.BONUS.agricoltura.doppio*100) + '% di probabilità']
  ],
  raccolta: lv => [
    ['Foraggio e fibra in più', Math.round(lv*D.BONUS.raccolta.foraggio*100) + '% di probabilità'],
    ['Legna per albero',        '+' + Math.floor(lv/D.BONUS.raccolta.legnaOgni) + ' ceppi'],
    ['Foraggio più prezioso',   '+' + Math.round(lv*D.BONUS.raccolta.valore*100) + '% sul prezzo']
  ],
  estrazione: lv => [
    ['Minerale in più',   Math.round((D.BONUS.estrazione.extraBase + lv*D.BONUS.estrazione.extra)*100) + '% di probabilità'],
    ['Pietra in più',     lv >= D.BONUS.estrazione.pietraDa ? 'sì, da livello ' + D.BONUS.estrazione.pietraDa : 'da livello ' + D.BONUS.estrazione.pietraDa],
    ['Minerali più cari', '+' + Math.round(lv*D.BONUS.estrazione.valore*100) + '% sul prezzo']
  ],
  pesca: lv => [
    ['Barra più alta',   '+' + (lv*D.BONUS.pesca.barra) + ' px'],
    ['Presa più salda',  '+' + Math.round(lv*D.BONUS.pesca.guadagno*100) + '% di velocità'],
    ['Meno spazzatura',  '−' + Math.round(lv*D.BONUS.pesca.spazzatura*100) + '% di scarpe vecchie'],
    ['Pesci più cari',   '+' + Math.round(lv*D.BONUS.pesca.valore*100) + '% sul prezzo']
  ],
  caccia: lv => [
    ['Mira più ferma',   '+' + Math.round(lv*D.BONUS.caccia.mira*100) + '% di probabilità'],
    ['Passo più leggero','le prede ti sentono ' +
      Math.round(Math.min(D.BONUS.caccia.uditoMax, lv*D.BONUS.caccia.udito)*100) + '% più tardi']
  ]
};

/* I premi di ogni salita di livello. L'indice è il livello RAGGIUNTO,
   quindi la casella 0 è vuota: a zero non si è salito niente.

   Salgono di valore con la fatica — i primi livelli arrivano in un
   pomeriggio, il decimo è la fine di una stagione — e ognuno regala roba
   del mestiere che l'ha guadagnato: chi zappa riceve semi, chi scava
   riceve lingotti. La `chiave` dei livelli 5 e 10 è quella che vale: uno
   strumento o un materiale che da soli non si troverebbero tanto presto. */
D.PREMI_LIVELLO = {
  agricoltura: [ null,
    { oro:120,  item:'seme_patata',   n:6  },
    { oro:220,  item:'concime',       n:8  },
    { oro:380,  item:'seme_mais',     n:6  },
    { oro:600,  item:'concime_acqua', n:8  },
    { oro:900,  item:'spaventapasseri', n:1, chiave:true },
    { oro:1300, item:'seme_melone',   n:8  },
    { oro:1800, item:'arnia',         n:1  },
    { oro:2500, item:'seme_zucca',    n:10 },
    { oro:3400, item:'seme_uva',      n:10 },
    { oro:5000, item:'seme_cristallia', n:3, chiave:true }
  ],
  raccolta: [ null,
    { oro:120,  item:'fibra',        n:15 },
    { oro:220,  item:'legna',        n:20 },
    { oro:380,  item:'cassa',        n:2  },
    { oro:600,  item:'argilla',      n:12 },
    { oro:900,  item:'botte',        n:1, chiave:true },
    { oro:1300, item:'linfa',        n:10 },
    { oro:1800, item:'miele',        n:8  },
    { oro:2500, item:'lanterna',     n:2  },
    { oro:3400, item:'pelle',        n:6  },
    { oro:5000, item:'vaso_lucciole', n:1, chiave:true }
  ],
  estrazione: [ null,
    { oro:120,  item:'pietra',        n:20 },
    { oro:220,  item:'rame',          n:12 },
    { oro:380,  item:'carbone',       n:10 },
    { oro:600,  item:'ferro',         n:10 },
    { oro:900,  item:'fornace',       n:1, chiave:true },
    { oro:1300, item:'lingotto_rame', n:6  },
    { oro:1800, item:'quarzo',        n:6  },
    { oro:2500, item:'lingotto_ferro', n:5 },
    { oro:3400, item:'ametista',      n:4  },
    { oro:5000, item:'gemma_luna',    n:2, chiave:true }
  ],
  pesca: [ null,
    { oro:120,  item:'pane_miele',    n:3 },
    { oro:220,  item:'fibra',         n:12 },
    { oro:380,  item:'pesce_arrosto', n:3 },
    { oro:600,  item:'barattoliera',  n:1 },
    { oro:900,  item:'vaso_lucciole', n:1, chiave:true },
    { oro:1300, item:'tisana',        n:4 },
    { oro:1800, item:'crostata',      n:3 },
    { oro:2500, item:'lanterna',      n:2 },
    { oro:3400, item:'geode',         n:5 },
    { oro:5000, item:'gemma_luna',    n:2, chiave:true }
  ],
  caccia: [ null,
    { oro:120,  item:'fibra',        n:12 },
    { oro:220,  item:'pelle',        n:3  },
    { oro:380,  item:'spezzatino',   n:2  },
    { oro:600,  item:'pelle',        n:6  },
    { oro:900,  item:'forno',        n:1, chiave:true },
    { oro:1300, item:'corno_cervo',  n:2  },
    { oro:1800, item:'pesce_arrosto', n:4 },
    { oro:2500, item:'corno_cervo',  n:4  },
    { oro:3400, item:'lingotto_oro', n:2  },
    { oro:5000, item:'medaglione',   n:1, chiave:true }
  ]
};

/* Il premio di una collezione completata.

   Completare una casella della Collezione non dava niente: il contatore
   passava a 10/10 e restava lì. Era l'unica cosa del Diario che si
   riempie senza che nessuno se ne accorga — le richieste pagano, la
   sagra paga, i traguardi pagano, e la vetrina no.

   DUE DI QUESTE CINQUE PAGAVANO GIÀ, e in un'altra scheda: i traguardi
   «Ittiologo» e «Gemmologo» davano 1600 monete ciascuno per aver
   scoperto tutti i pesci e tutti i minerali. Era lo stesso gesto pagato
   in due posti, con le altre tre collezioni che non pagavano niente — e
   chi finiva i minerali lo scopriva solo aprendo un'altra scheda. I due
   traguardi sono stati tolti e il loro valore è finito qui, dove la
   collezione si completa: nessuno prende due volte, e nessuno prende
   meno di prima. Chi li aveva già riscossi si ritrova la collezione già
   riscossa, non un secondo premio.

   Le altre tre stanno sotto le due storiche, e fra loro salgono con
   quanto costa riempirle: il foraggio si raccoglie camminando, le
   colture vogliono quattro stagioni di semine, i piatti vogliono la
   cucina e le ricette che si sbloccano parlando con la gente.

   L'oggetto è quello che quella collezione non ti fa mai avere: chi ha
   finito i pesci ha portato in vetrina i più rari invece di cucinarli.

   Restano tutte sotto il traguardo «Collezionista» (4000), che è la
   somma di tutte: chi le completa tutte e cinque prende 6800 qui più
   4000 lì.
   =================================================================== */
D.PREMI_COLLEZIONE = {
  /* i due che venivano dai traguardi: la cifra resta quella */
  pesci:    { oro:1600, item:'pesce_arrosto', n:5  },
  minerali: { oro:1600, item:'geode',         n:3  },
  /* i tre che non pagavano niente, sotto i due storici */
  colture:  { oro:1400, item:'concime',       n:8  },
  piatti:   { oro:1200, item:'miele',         n:6  },
  foraggio: { oro:1000, item:'tisana',        n:3  }
};

/* i traguardi che questi premi hanno sostituito: chi li aveva già
   riscossi non deve poter riscuotere due volte la stessa cosa */
D.COLLEZIONE_DA_TRAGUARDO = { pesci:'ittiologo', minerali:'gemmologo' };

/* ------------------------------------------------------------------
   PERSONAGGI
   ------------------------------------------------------------------ */
D.NPCS = {
  bruno: {
    nome:'Bruno', ruolo:'Bottegaio',
    look:{ pelle:'#e0aa78', capelli:'#5a4030', maglia:'#b8543f', pant:'#4a3b5c', grembiule:'#e3d3aa', barba:true, cappello:null,
           corpo:'robusto', altezza:1, chioma:'rado' },
    casa:'fioralba',
    battute:[
      'La bottega apre all\'alba e chiude quando ho fame. Quindi presto.',
      'Tua nonna comprava sempre due sacchetti di semi. Uno lo regalava.',
      'Se ti serve qualcosa e non ce l\'ho... probabilmente non ti serviva.',
      'Ho ordinato tre casse di semi di zucca. Ne sono arrivate trenta. Aiutami.',
      'Il tempo cambia. Il prezzo dei semi no. Per fortuna.'
    ],
    amico:[ 'Sai che quando sei arrivato dicevo che non saresti durato un mese? Mi hai fatto perdere una scommessa con Marisol. Ne è valsa la pena.',
            'Ti ho messo da parte i semi migliori. Non dirlo agli altri. Non che ci sia una fila, eh.' ],
    regali:{ ama:['torta_zucca','vino:uva','lingotto_oro'], piace:['zuppa_contadina','uva','miele'] }
  },
  serafina: {
    nome:'Serafina', ruolo:'Erborista',
    look:{ pelle:'#d8a882', capelli:'#8a4f6a', maglia:'#6a4f8a', pant:'#3f3050', grembiule:null, cappello:'#4a3560',
           corpo:'esile', altezza:2, chioma:'lunghi' },
    casa:'bosco',
    battute:[
      'Il bosco ti ha già annusato. Ora deve decidere.',
      'Le viole crescono dove qualcuno è stato triste a lungo. Non è tristezza: è memoria.',
      'Ilde veniva qui ogni solstizio. Portava una torta e non spiegava mai perché.',
      'Non raccogliere mai l\'ultimo fungo di una radura. Lascia sempre il seme del ritorno.',
      'Ho sognato una lanterna accesa. Poi mi sono svegliata e c\'eri tu che zappavi.'
    ],
    amico:[ 'La valle respira meglio da quando sei qui. Non è poesia: è che l\'aria sa di terra smossa.',
            'Ilde sarebbe insopportabile, adesso. Direbbe "te l\'avevo detto" per sei mesi.' ],
    regali:{ ama:['cristallia','viola','tisana','gemma_luna'], piace:['lavanda','fungo_porcino','miele'] }
  },
  tobia: {
    nome:'Tobia', ruolo:'Fabbro e Carpentiere',
    look:{ pelle:'#b8804f', capelli:'#2f2820', maglia:'#4a5a6a', pant:'#3a3028', grembiule:'#6a4030', barba:true,
           corpo:'robusto', altezza:2, chioma:'corti' },
    casa:'fioralba',
    battute:[
      'Portami lingotti e ti restituisco attrezzi che non ti tradiscono.',
      'Il ferro va scaldato, non convinto.',
      'Ho costruito il tetto della casa di tua nonna. Regge ancora. Come vedi.',
      'La miniera è vecchia quanto la valle. Vai piano nei livelli bassi.',
      'Legno buono, misure giuste, pazienza. Il resto è decorazione.'
    ],
    amico:[ 'Se ti serve una mano al podere, chiedi. Porto gli attrezzi miei, che sono migliori.',
            'Ilde mi pagò una volta con una torta. La torta valeva più del lavoro.' ],
    regali:{ ama:['lingotto_ferro','lingotto_oro','carbone','pesce_arrosto'], piace:['ametista','quarzo','frittata'] }
  },
  marisol: {
    nome:'Marisol', ruolo:'Locandiera',
    look:{ pelle:'#8a5a3a', capelli:'#241a14', maglia:'#c47a2c', pant:'#7a4f30', grembiule:'#f0e0c0',
           corpo:'normale', altezza:0, chioma:'raccolti' },
    casa:'fioralba',
    battute:[
      'Alla Locanda del Tasso Storto si mangia e si ascolta. In quest\'ordine.',
      'Ti insegno una ricetta se mi porti qualcosa che non ho mai cucinato.',
      'La zuppa di Ilde aveva un ingrediente segreto. Era il tempo. Cuoceva tre ore.',
      'Elio passa a rubare focacce. Faccio finta di non vederlo.',
      'Quando piove la locanda si riempie. Adoro la pioggia, professionalmente.'
    ],
    amico:[ 'Ho messo il tuo nome sul tavolo vicino al camino. È ufficialmente tuo.',
            'Un giorno cucineremo insieme la torta di Ilde. Ho quasi tutti i pezzi della ricetta.' ],
    regali:{ ama:['melagrana','torta_zucca','miele','storione'], piace:['uovo','latte','fragola','mais'] }
  },
  elio: {
    nome:'Elio', ruolo:'Pescatore',
    look:{ pelle:'#e8c090', capelli:'#c9a044', maglia:'#5f9c8a', pant:'#4a5a6a', cappello:'#7a6a4a',
           corpo:'esile', altezza:-1, chioma:'corti' },
    casa:'fioralba',
    battute:[
      'Oggi ho preso una scarpa. Ieri due. Sto costruendo un paio.',
      'Il Pesce Luna esiste. L\'ho visto. Aveva gli occhi come piattini.',
      'Se tiri la lenza troppo forte scappa. Se molli, scappa. Bisogna respirare.',
      'Al molo di notte l\'acqua fa un rumore diverso. Più profondo.',
      'Quando prenderò lo storione lo appendo in camera. Mia madre dice di no.'
    ],
    amico:[ 'Ti ho tenuto il posto buono al molo. Quello dove abbocca sempre.',
            'Sei l\'unico che mi crede sul Pesce Luna. Grazie.' ],
    regali:{ ama:['pesce_luna','storione','luccio','crostata'], piace:['trota','carpa','pane_miele'] }
  },
  eremita: {
    nome:'Oreste', ruolo:'Eremita del Passo',
    look:{ pelle:'#d8b090', capelli:'#d8d8d8', maglia:'#5a6a7a', pant:'#3a4450', cappello:'#3f4a58', barba:true,
           corpo:'normale', altezza:-2, chioma:'lunghi' },
    casa:'montagna',
    battute:[
      'Sono salito quassù per stare solo. Poi è arrivato il silenzio e mi ha tenuto compagnia.',
      'La neve non nasconde le cose. Le mette a riposo.',
      'Ilde saliva fin qui ogni inverno, con una fetta di torta. Non parlava. Guardava e basta.',
      'Il ghiaccio del laghetto regge, se sai dove mettere i piedi. Io lo so. Tu impara.',
      'Giù in miniera scavano. Io ascolto la montagna: è un altro modo di scavare.'
    ],
    amico:[ 'Non offro molto: un fuoco, del silenzio e qualche pietra rara che il gelo spinge in superficie. Ma è tuo, quando vuoi.',
            'Da quassù vedo la lanterna della valle. Da quando l\'hai riaccesa, dormo meglio.' ],
    regali:{ ama:['gemma_luna','geode','ametista','tisana'], piace:['carbone','oro','pane_miele'] }
  },
  fiammella: {
    nome:'Fiammella', ruolo:'Spirito del Santuario',
    look:{ spirito:true },
    casa:'bosco',
    battute:[
      'Dodici inverni al buio. Cominciavo a dimenticare il mio colore.',
      'Non sono io la Lanterna. Io sono solo quello che resta quando si spegne.',
      'Porta i frutti delle quattro stagioni. La valle si ricorderà da sola.',
      'Ilde parlava tanto. Mi mancava anche quello.'
    ],
    amico:[ 'Sei diventato parte della valle. Anche se vai via, resti nel modo in cui cresce l\'erba.' ],
    regali:{ ama:['gemma_luna','cristallia'], piace:['viola','fiocco_cristallo'] }
  }
};

/* ------------------------------------------------------------------
   LORE — LE QUATTRO BRACI
   ------------------------------------------------------------------ */
D.SANTUARIO = [
  { id:'primavera', nome:'Brace di Primavera', colore:'#8fd46a',
    testo:'"Quello che nasce non chiede permesso." Portale ciò che spunta per primo.',
    req:['rapa','fragola','narciso','cipolla_selvatica','uovo'],
    premio:{ oro:800, item:'brace_primavera' } },
  { id:'estate', nome:'Brace d\'Estate', colore:'#f7c744',
    testo:'"Il sole non si trattiene: si divide." Portale ciò che matura al caldo.',
    req:['pomodoro','mais','girasole','miele','lavanda'],
    premio:{ oro:1400, item:'brace_estate' } },
  { id:'autunno', nome:'Brace d\'Autunno', colore:'#e08a3c',
    testo:'"Si raccoglie ciò che si è avuto la pazienza di aspettare." Portale l\'abbondanza.',
    req:['zucca','uva','fungo_porcino','melagrana','nocciola'],
    premio:{ oro:2200, item:'brace_autunno' } },
  { id:'inverno', nome:'Brace d\'Inverno', colore:'#9fd8ee',
    testo:'"Anche sotto il gelo qualcosa conta i giorni." Portale ciò che resiste.',
    req:['radice_inverno','fiocco_cristallo','legna','lingotto_ferro','trota'],
    premio:{ oro:3000, item:'brace_inverno' } }
];

/* ------------------------------------------------------------------
   ATTO SECONDO — LA NOTTE DEL SOLSTIZIO

   Fino alle quattro braci la storia funziona, poi finisce di colpo: si
   accende la Lanterna e compare un riquadro di testo. E soprattutto
   nessuno dice mai *perché* si era spenta — il buco sta in mezzo alla
   trama fin dall'inizio, e Fiammella lo dice senza accorgersene: «Ilde
   lo faceva. Poi ha smesso di riuscirci».

   Sei testimonianze, una per abitante. Nessuna è la risposta: ognuno ha
   visto un pezzo di quella notte da dove stava, e alcuni si
   contraddicono, perché è così che si ricorda a dodici anni di
   distanza. La risposta viene fuori solo quando ci sono tutti e sei.

   `cuori` è quanto bisogna conoscere qualcuno perché tiri fuori una
   cosa del genere. Bruno la racconta quasi subito perché per lui è una
   questione di conti; Serafina è l'ultima perché quella notte c'era.
   ------------------------------------------------------------------ */
D.MEMORIE = [
  { id:'bruno', npc:'bruno', cuori:2, titolo:'Il registro di Bruno', testo:[
    'Quella notte? Me la ricordo per via del registro, non per il resto.',
    'Ilde era passata tre giorni prima. Ha comprato olio da lanterna, il doppio del solito, e una coperta di lana pesante. La coperta non l\'ha pagata.',
    'Non perché non avesse i soldi. Perché è uscita di fretta e io non l\'ho fermata.',
    'Sono dodici anni che quella riga è aperta nel registro. L\'ho riscritta quattro volte, cambiando quaderno, e ogni volta l\'ho ricopiata.',
    'Non è per i soldi. È che finché la riga è aperta la faccenda non è chiusa.'
  ]},

  { id:'marisol', npc:'marisol', cuori:3, titolo:'Il tavolo d\'angolo', testo:[
    'Il solstizio d\'inverno di dodici anni fa avevo la locanda piena. Si faceva sempre così: la valle mangiava qui e poi saliva al santuario.',
    'Ilde è partita presto, da sola, che era ancora chiaro. Aveva da fare lassù.',
    'Al tavolo d\'angolo è rimasto suo marito. Da solo, col cappotto addosso, che non se l\'era tolto.',
    'Gli ho chiesto se aspettava qualcuno e ha detto di no. Ha bevuto mezzo bicchiere e si è messo a guardare fuori.',
    'Poi a un certo punto non c\'era più, e io ero in cucina, e non ho visto quando è uscito.',
    'È l\'unica sera in vent\'anni in cui non ho visto uscire un cliente.'
  ]},

  { id:'elio', npc:'elio', cuori:3, titolo:'Quello che ha visto Elio', testo:[
    'Ero sul lago. Di notte, al solstizio, si prende il pesce che non prendi mai.',
    'Da lì il santuario si vede bene: sta più in alto e la luce arriva sull\'acqua prima che sulla riva.',
    'La lanterna era accesa. Poi si è spenta. Non è calata piano come fa una fiamma che finisce l\'olio — si è spenta e basta, come una candela con sopra una mano.',
    'E c\'erano due persone sul sentiero. Una che saliva di corsa e una ferma.',
    'Ho pensato: stanno litigando, non sono affari miei. Ho tirato su la lenza e sono andato a casa.',
    'Ci ho pensato ogni solstizio da allora. Ogni volta mi dico che avrei dovuto remare fino a riva.'
  ]},

  { id:'tobia', npc:'tobia', cuori:4, titolo:'Quello che Tobia non ha consegnato', testo:[
    'Aspetta. Devo prendere una cosa.',
    '...',
    'Ecco. È un gancio da lanterna. Ferro battuto, con la spirale. Ilde me l\'aveva ordinato quell\'autunno: quello vecchio al santuario era storto e la lanterna pendeva.',
    'L\'ho finito il giorno prima del solstizio. Volevo portarglielo di persona, che ero contento di come era venuto.',
    'Poi è successo quello che è successo, e portare un gancio da lanterna a una che aveva appena spento la lanterna mi è sembrato...',
    'Ho aspettato una settimana. Poi un mese. Poi dodici anni.',
    'Tienilo tu. Se lassù serve, serve. E se non serve, almeno esce da questo cassetto.'
  ], dona:'gancio_lanterna' },

  { id:'eremita', npc:'eremita', cuori:4, titolo:'Quello che si vede dal Passo', testo:[
    'Dal Passo si vede tutta la valle, e la notte del solstizio non dormo mai. Vecchia abitudine.',
    'Quindi sì: ho visto. Da lassù si vede quello che dal basso non si vede.',
    'C\'era Ilde davanti alla nicchia. E c\'era Serafina che saliva.',
    'Serafina le ha detto qualcosa. Non ho sentito cosa, sono duecento metri di dislivello.',
    'Poi Ilde si è girata verso la lanterna e ci ha messo sopra le mani. Tutte e due. È rimasta lì un momento.',
    'E quando le ha tolte, era buio.',
    'Non l\'ha spenta il vento, ragazzo. Non l\'ha spenta la neve. L\'ha spenta lei.'
  ]},

  { id:'serafina', npc:'serafina', cuori:6, titolo:'Quello che Serafina è salita a dire', testo:[
    'Lo sapevo che prima o poi saresti arrivato a me. Gli altri ti hanno dato i pezzi e i pezzi non tornano, vero?',
    'Ero io sul sentiero. Sono salita io.',
    'Suo marito era uscito dalla locanda ed era andato al fiume, dove andava sempre quando aveva qualcosa che non riusciva a dire. Non stava bene da un anno: il torace, la miniera, il freddo. Quell\'inverno era peggiorato e non l\'aveva detto a nessuno tranne che a me, perché a me si dicono le cose e poi si fa finta di niente.',
    'L\'hanno trovato lì. Non è caduto, non è successo niente di drammatico. Si è seduto e non si è più alzato.',
    'Sono salita io a dirglielo perché nessun altro se la sentiva.',
    'Lei mi ha ascoltata. Non ha pianto, non ha detto niente. Ha guardato la nicchia — mancava un frutto, uno solo, era quasi finita — e ha messo le mani sulla fiamma.',
    'Io le ho detto: Ilde, ci hai messo un anno. E lei mi ha risposto una cosa che non ho più ripetuto a nessuno per dodici anni.',
    '«Serafina, per chi la tengo accesa adesso?»',
    'Poi ha spento. E siamo scese insieme al buio.'
  ]}
];

/* Dove sta ognuno, la sera della veglia, nella radura. Sta qui e non in
   game.js perché così il controllo di coerenza può verificare che siano
   caselle su cui si cammina davvero: un abitante piantato dentro a una
   pietra rituale è il genere di cosa che si scopre solo alla fine della
   partita, cioè quando fa più danno. */
D.POSTI_VEGLIA = {
  bruno:    [[33,33],[33,34]],
  marisol:  [[36,36],[35,36]],
  elio:     [[42,33],[42,34]],
  tobia:    [[41,36],[42,36]],
  eremita:  [[38,38],[37,39]],
  serafina: [[39,36],[40,36]]
};

/* E dove stanno il giorno della sagra, in piazza. Stessa storia del
   gemello qui sopra, e per lo stesso motivo è finito qui: lo leggono in
   due, l'agenda (abitanti.js, che per un giorno la scavalca) e chi
   prepara la piazza (game.js). Finché stava in game.js il primo dei due
   non poteva vederlo. */
D.POSTI_SAGRA = {
  bruno:   [[18,16],[19,17]],
  tobia:   [[25,16],[24,17]],
  marisol: [[21,14],[22,15]],
  elio:    [[24,21],[23,20]],
  serafina:[[19,21],[20,22]]
};

/* ===================================================================
   LE VICENDE DEL PAESE — una storia a più passi per ogni abitante.

   L'amicizia esisteva da prima di questa tabella e non serviva quasi a
   niente: i cuori salivano, e a sei cuori arrivava qualche battuta in
   più. Nient'altro. Qui ogni abitante ha una faccenda sua che si apre a
   una certa altezza di cuori, e che si porta avanti parlandoci e
   portandogli roba.

   La forma è la stessa per tutte, così ne bastano una tabella e un
   modulo invece di una bandierina su `G` per ognuna — che è come sono
   fatte le tre catene dell'atto primo (`G.trame.torta`,
   `G.trame.pesceluna`), e infatti quelle non compaiono da nessuna parte
   nel Diario: il giocatore non ha modo di sapere cosa ha in ballo.

   Un passo è di tre tipi soltanto:
     parla  — vai da quella persona e parlaci
     porta  — vai da quella persona con questa roba (`ing`)
     luogo  — fatti vedere in un posto (`dove`)
   `compito` è la riga che si legge nel Diario finché quel passo è
   aperto; `righe` è quello che viene detto quando il passo si chiude.
   Il primo passo è sempre un `parla` con chi la storia appartiene: è
   quello che la fa cominciare.

   Le ricompense non sono mai solo monete: le monete a un certo punto
   della partita non dicono più niente. C'è sempre un oggetto che da
   quella persona non arriverebbe in nessun altro modo. */
D.VICENDE = {

  bruno_libretto: {
    npc:'bruno', cuori:2, titolo:'Il libretto di Bruno',
    scelta:'📓 Quel libretto sotto il banco',
    passi:[
      { tipo:'parla', npc:'bruno',
        compito:'Parla con Bruno, in bottega.',
        righe:[
          'Questo? È il libretto dei conti aperti. Chi non ha da pagare subito, io segno e amen.',
          'C\'è una riga che non chiudo da due anni. Non per i soldi — sono quattro spiccioli. È che quello lassù ha smesso di scendere.',
          'Oreste. L\'eremita del Passo. Prima veniva giù ogni due settimane, prendeva le sue cose e brontolava del tempo. Poi più niente.',
          'Non so se sta bene. E salire fin lassù, con la bottega aperta, io non posso.'
        ] },
      { tipo:'porta', npc:'eremita', ing:{ patata:5, latte:2 },
        compito:'Porta a Oreste, al Passo di montagna: {ing}',
        manca:'Bruno aveva detto: {ing}. Torna quando ce le hai.',
        righe:[
          'Le patate. E il latte. …Te le ha date Bruno, vero. Non rispondere, lo so io.',
          'Non sono sceso perché la strada d\'inverno è ghiaccio vivo e io non ho più vent\'anni. Non perché mi sia offeso.',
          'Digli che il conto lo pago. E digli che se manda su qualcuno ogni tanto, io il caffè ce l\'ho.'
        ] },
      { tipo:'parla', npc:'bruno',
        compito:'Torna da Bruno e digli come sta Oreste.',
        righe:[
          'Sta bene. Sta bene davvero, o lo dici per non farmi stare in pensiero?',
          '…La strada ghiacciata. Certo che è la strada ghiacciata. Sono due anni che mi racconto che si era offeso, e intanto era il ghiaccio.',
          'La riga la lascio aperta. Adesso però è aperta per un motivo diverso: è la scusa per mandare su qualcuno.',
          'Tieni. E quando risali, portagli anche questo da parte mia.'
        ] }
    ],
    premio:{ oro:700, item:'pane_miele', qta:3, amicizia:140 }
  },

  elio_rete: {
    npc:'elio', cuori:2, titolo:'La rete di suo padre',
    scelta:'🪢 Quella rete appesa al muro',
    passi:[
      { tipo:'parla', npc:'elio',
        compito:'Parla con Elio, al porto.',
        righe:[
          'Quella non si tocca. Era di mio padre — l\'ha fatta lui, nodo per nodo, l\'inverno che non si pescava.',
          'È marcia in tre punti. La tengo appesa perché buttarla mi sembra brutto e ripararla mi sembra peggio.',
          'Ripararla vuol dire dire che è ancora una rete. E se è ancora una rete, va usata.',
          'Se mi porti della <b>fibra</b> buona, ci provo. Ma non prometto niente.'
        ] },
      { tipo:'porta', npc:'elio', ing:{ fibra:12 },
        compito:'Porta a Elio: {ing}',
        manca:'Elio aspetta {ing} per rammendare la rete.',
        righe:[
          'Guarda che nodo. Mio padre lo faceva in tre mosse, io ci metto un minuto, ma viene uguale.',
          'Domani all\'alba la porto in acqua. Vieni anche tu, se ti va: da soli certe cose non si fanno.'
        ] },
      { tipo:'luogo', dove:'spiaggia',
        compito:'Vai alla spiaggia, all\'alba o quando puoi.',
        righe:['La rete di Elio è stesa sulla sabbia, piena d\'acqua e di luce. Funziona.'] },
      { tipo:'parla', npc:'elio',
        compito:'Parla con Elio.',
        righe:[
          'Hai visto? Tiene. Tiene meglio delle mie.',
          'Ho pensato una cosa stupida mentre la tiravo su: che lui l\'ha fatta per una barca che non c\'è più, e io la sto usando lo stesso.',
          'Le cose fatte bene si trovano un altro lavoro. Tieni, questo l\'ho preso stamattina con lei.'
        ] }
    ],
    premio:{ oro:900, item:'storione', qta:1, amicizia:150 }
  },

  serafina_pagine: {
    npc:'serafina', cuori:3, titolo:'Le pagine mancanti',
    scelta:'🌿 L\'erbario a cui mancano le pagine',
    passi:[
      { tipo:'parla', npc:'serafina',
        compito:'Parla con Serafina, nel bosco.',
        righe:[
          'L\'erbario me l\'ha lasciato Ilde. È l\'unica cosa che ho di suo, e ha tre pagine strappate.',
          'Non strappate per rabbia: strappate per portarsele dietro. Le piegava in quattro e se le metteva in tasca.',
          'So quali erano, perché me le ha fatte imparare a memoria da ragazza. Le so ridisegnare. Mi servono le piante vere davanti.',
          'Lavanda, porcini, viole. Portamele e rifacciamo le pagine.'
        ] },
      { tipo:'porta', npc:'serafina', ing:{ lavanda:3, fungo_porcino:2, viola:2 },
        compito:'Porta a Serafina: {ing}',
        manca:'Per le tre pagine servono ancora: {ing}',
        righe:[
          'Ferma, non appoggiarle. Una per volta, che le devo guardare da sotto.',
          '…Ecco. La lavanda va disegnata mentre è ancora viva, sennò il grigio del secco ti frega la misura.',
          'Tre pagine in una sera. Ilde ci metteva una settimana e diceva che era per la pazienza. Aveva le mani che tremavano già allora, credo.',
          'L\'erbario è di nuovo intero. Non è più solo suo: adesso c\'è dentro anche una cosa fatta da noi due.'
        ] }
    ],
    premio:{ oro:800, item:'gemma_luna', qta:1, amicizia:160 }
  },

  tobia_campana: {
    npc:'tobia', cuori:3, titolo:'La campana della piazza',
    scelta:'🔔 Perché la campana non suona?',
    passi:[
      { tipo:'parla', npc:'tobia',
        compito:'Parla con Tobia, alla fucina.',
        righe:[
          'Perché è crepata. Crepata da dodici anni, dal solstizio che sai.',
          'L\'hanno suonata tutta la notte quella volta, per chiamare. Il bronzo freddo non è fatto per essere suonato così, e a un certo punto ha ceduto.',
          'Rifonderla non si può: quel bronzo lì non lo fa più nessuno. Si può fasciare la crepa, però. Rame e carbone, e una giornata di fuoco.',
          'Vai a vederla, prima. Voglio che tu la guardi bene, poi mi dici se ne vale la pena.'
        ] },
      { tipo:'luogo', dove:'piazza',
        compito:'Vai a vedere la campana, in piazza.',
        righe:['La crepa parte dal bordo e sale per due palmi. Da sotto, il bronzo è ancora lucido dove ci battevano le mani.'] },
      { tipo:'porta', npc:'tobia', ing:{ lingotto_rame:3, carbone:6 },
        compito:'Porta a Tobia: {ing}',
        manca:'Per fasciare la campana servono ancora: {ing}',
        righe:[
          'L\'hai guardata. Si vede che l\'hai guardata, hai la faccia di quelli che l\'hanno guardata.',
          'Il rame va colato caldo dentro la crepa e poi battuto finché non si offende. Domani ci vuole tutto il giorno.',
          'Non tornerà come prima. Farà un suono più basso, un po\' rotto. Va bene così: è successo, e si sente.'
        ] },
      { tipo:'parla', npc:'tobia',
        compito:'Torna da Tobia il giorno dopo.',
        righe:[
          'Suonata stamattina. Due rintocchi, per provare.',
          'È uscita mezza piazza. Nessuno ha detto niente, sono usciti e basta, e poi sono rientrati.',
          'Dodici anni. Tieni questo: l\'ho fatto con l\'avanzo del rame. Non serve a niente, è solo bello.'
        ] }
    ],
    premio:{ oro:1200, item:'lingotto_oro', qta:1, amicizia:150 }
  },

  marisol_stanza: {
    npc:'marisol', cuori:3, titolo:'La stanza di sopra',
    scelta:'🚪 Quella porta chiusa in cima alle scale',
    passi:[
      { tipo:'parla', npc:'marisol',
        compito:'Parla con Marisol, alla locanda.',
        righe:[
          'La stanza d\'angolo. Chiusa da quando è morta Ilde, perché era la sua quando si fermava a dormire in paese.',
          'Non l\'ho chiusa per sentimento, all\'inizio. L\'ho chiusa perché avevo da fare e non me la sentivo di svuotarla, e poi il tempo ha deciso da solo.',
          'Adesso è una stanza che non rende e una porta che tutti guardano salendo. Il peggio delle due cose.',
          'Se mi aiuti a rimetterla a posto, la riapro. Serve legna per il pavimento, fibra per il materasso, e una lanterna che non sia la sua.'
        ] },
      { tipo:'porta', npc:'marisol', ing:{ legna:15, fibra:10, lanterna:1 },
        compito:'Porta a Marisol: {ing}',
        manca:'Per la stanza di sopra servono ancora: {ing}',
        righe:[
          'Le assi vanno di là, la lanterna sul comodino. No, non al centro: al lato, che è dove la teneva lei.',
          '…Ho detto «dove la teneva lei». Va bene, mi sa che un po\' di sentimento c\'era.',
          'Domani la apro. La affitto a chi passa, e a Natale la tengo libera. Una stanza chiusa non è un ricordo, è solo una stanza chiusa.'
        ] },
      { tipo:'parla', npc:'marisol',
        compito:'Torna da Marisol.',
        righe:[
          'Ci ha dormito uno che vendeva sementi. Ha detto che era la stanza più bella in cui avesse dormito in vita sua, e non sapeva niente di niente.',
          'Mi è piaciuto tantissimo che non sapesse niente. Ha dormito bene e basta.',
          'Tieni, l\'ho fatta stamattina. Prima fetta, come si deve.'
        ] }
    ],
    premio:{ oro:1000, item:'torta_zucca', qta:2, amicizia:160 }
  },

  eremita_neve: {
    npc:'eremita', cuori:4, titolo:'La neve che non si scioglie',
    scelta:'❄️ Quella chiazza di neve che resta',
    passi:[
      { tipo:'parla', npc:'eremita',
        compito:'Parla con Oreste, al Passo.',
        righe:[
          'L\'hai notata anche tu. Bene. Vuol dire che guardi.',
          'Quella chiazza lì non se ne va nemmeno ad agosto. Ci ho messo dieci anni a smettere di trovarci una spiegazione.',
          'Il ghiaccio vecchio, sotto, non è acqua e basta. C\'è dentro l\'aria di quando si è formato. È aria di prima di noi.',
          'Portami due fiocchi di cristallo e un geode, che ti faccio vedere una cosa che non ho mai fatto vedere a nessuno.'
        ] },
      { tipo:'porta', npc:'eremita', ing:{ fiocco_cristallo:2, geode:1 },
        compito:'Porta a Oreste, al Passo: {ing}',
        manca:'Oreste aspetta: {ing}',
        righe:[
          'Guarda dentro il geode, controluce, con il fiocco davanti. Non con gli occhi tutti e due: chiudine uno.',
          '…Visto? Quella riga che si muove. È la stessa che c\'è nel ghiaccio della chiazza.',
          'Io ci ho passato sopra dieci inverni a chiedermi cosa fosse. Poi ho smesso, e il giorno che ho smesso l\'ho vista.',
          'Non te la spiego. Se te la spiego smetti di guardarla. Tieni: questo è il pezzo migliore che ho tirato fuori dal Passo.'
        ] }
    ],
    premio:{ oro:1400, item:'cristallia', qta:2, amicizia:170 }
  }

};

/* ===================================================================
   QUELLO CHE SI MIGLIORA ADDOSSO — non gli attrezzi, la persona.

   Fino a qui tutto quello che cresceva era fuori dal giocatore: gli
   attrezzi (D.UPGRADE, da Tobia), le abilità (D.SKILLS, giocando), il
   podere (D.COSTRUZIONI). La persona no: si camminava alla stessa
   velocità del primo giorno, si portavano le stesse ventisette caselle
   e ogni zappata costava quello che costava a mezzogiorno del giorno
   uno.

   Ognuno di questi si sblocca finendo la vicenda di chi lo fa: la
   cintura la batte Tobia dopo la campana, lo zaino lo ordina Bruno dopo
   il libretto. Il motivo non è narrativo, è che sono quattro cose
   potenti e messe in vendita subito toglierebbero il senso ai primi
   inverni — così invece arrivano quando quei problemi lì li hai già
   avuti addosso per un po'.

   `passo` è il numero, e sta qui una volta sola: lo legge chi applica
   l'effetto e chi lo racconta nella scheda. Le due volte che in questo
   repo un numero di bilanciamento è finito in due posti, i due posti si
   sono contraddetti entro un mese. */
D.PERSONA = {

  zaino: {
    nome:'Zaino', da:'bruno', vicenda:'bruno_libretto', icona:'cassa',
    scelta:'🎒 Mi servirebbe uno zaino più grande',
    passo:9, effetto:'{0} caselle in più nello zaino.',
    gradi:[
      { nome:'Zaino da mercato', costo:2600, ing:{ pelle:6, fibra:20 }, righe:[
        'Uno zaino? Guarda che io vendo semi e formaggio, non pellami.',
        '…Però quello che porta la roba su dal capoluogo passa ogni dieci giorni, e mi deve ancora un favore. Portami la pelle e la fibra, al resto ci penso io.',
        'Tieni. Non è bello, ma ci sta dentro un raccolto intero.'
      ] },
      { nome:'Zaino da viaggio', costo:7800, ing:{ pelle:12, fibra:40, lingotto_rame:3 }, righe:[
        'Ancora più grande. Certo. Sai che è la stessa faccia che faceva Ilde quando gliene proponevo uno piccolo.',
        'Questo ha il telaio di rame dentro, così non ti si affloscia addosso quando è pieno.',
        'Ecco. Adesso però non lamentarti del peso, che il peso è tutta roba tua.'
      ] }
    ]
  },

  resistenza: {
    nome:'Resistenza', da:'marisol', vicenda:'marisol_stanza', icona:'zuppa_contadina',
    scelta:'🍲 Insegnami a reggere la giornata',
    passo:15, effetto:'{0} punti di energia in più al risveglio.',
    gradi:[
      { nome:'Colazione vera', costo:2400, ing:{ uovo:10, latte:6 }, righe:[
        'Il problema non è che lavori troppo. È che parti a stomaco vuoto e poi mangi una mela alle due.',
        'Da domani passi di qui prima dell\'alba. Ti faccio io la colazione, e ti insegno a fartela.',
        'Non è un segreto e non è una ricetta. È solo mangiare prima invece che dopo.'
      ] },
      { nome:'Passo della locandiera', costo:7200, ing:{ zuppa_contadina:4, spezzatino:3, pane_miele:4 }, righe:[
        'Io sto in piedi dalle cinque a mezzanotte da diciannove anni. Vuoi sapere come.',
        'Non si tratta di essere forti. Si tratta di non sprecare niente: non corri se puoi camminare, non torni indietro due volte, e ti siedi quando ti siedi.',
        'Adesso lo sai anche tu. Il difficile è crederci quando hai fretta.'
      ] }
    ]
  },

  scarpe: {
    nome:'Scarpe', da:'eremita', vicenda:'eremita_neve', icona:'pelle',
    scelta:'🥾 Come fai a camminare così?',
    passo:0.10, effetto:'Cammini il {0}% più svelto.',
    gradi:[
      { nome:'Suole da Passo', costo:2800, ing:{ pelle:8, corno_cervo:2 }, righe:[
        'Perché ho le scarpe giuste e tu hai le scarpe che ti hanno dato.',
        'La suola va cucita a doppio filo e ingrassata due volte l\'anno. Se scivoli sul bagnato non è colpa del bagnato.',
        'Portami la pelle e due corni, che il corno tagliato fa i ramponi. Te le faccio io.'
      ] },
      { nome:'Passo di montagna', costo:8400, ing:{ pelle:16, corno_cervo:4, lingotto_ferro:2 }, righe:[
        'Queste hanno il ferro sotto la punta. Sono brutte e pesano, e sono le migliori che avrai mai.',
        'Il trucco non è la scarpa, comunque: è appoggiare tutto il piede invece che il tacco. Ma con la scarpa sbagliata non si può.',
        'Adesso vai dove vuoi. Anche d\'inverno, anche sul ghiaccio vivo.'
      ] }
    ]
  },

  cintura: {
    nome:'Cintura', da:'tobia', vicenda:'tobia_campana', icona:'zappa',
    scelta:'🧰 Una cintura per gli attrezzi',
    passo:0.12, effetto:'Ogni colpo di attrezzo costa il {0}% di energia in meno.',
    gradi:[
      { nome:'Cintura da fucina', costo:3000, ing:{ pelle:10, lingotto_rame:4 }, righe:[
        'Ti guardo da mesi: prendi la zappa, la posi, prendi il piccone, lo posi. Ogni volta ti pieghi.',
        'Cento volte al giorno per trecento giorni. Non è la zappa che ti stanca, è raccoglierla.',
        'Con questa ce li hai addosso. Sembra una sciocchezza finché non la porti per una settimana.'
      ] },
      { nome:'Cintura del fabbro', costo:8800, ing:{ pelle:18, lingotto_ferro:5, corno_cervo:3 }, righe:[
        'Questa è la mia. Cioè, è come la mia: gli anelli sono a molla, l\'attrezzo ci salta dentro da solo.',
        'Mio padre diceva che un fabbro si vede dalla cintura e non dal martello. Aveva torto sul martello, ma sulla cintura aveva ragione.',
        'Tieni. E non appoggiare più niente per terra, che poi lo cerchi.'
      ] }
    ]
  }

};

/* Cosa porta un cespuglio carico, stagione per stagione.

   Stava scritta dentro al codice della falce, e il disegno del cespuglio
   non la conosceva: metteva sei bacche rosse tutto l'anno. Chi tagliava
   un cespuglio di bacche rosse in primavera si ritrovava in mano una
   viola, e credeva di aver raccolto due cose diverse dallo stesso posto.
   D'autunno le bacche rosse davano nocciole. Adesso la tabella è una
   sola e la leggono tutti e due. */
D.CESPUGLIO = {
  primavera: 'viola',        // crescono all'ombra del cespuglio, non sul ramo
  estate:    'mora',
  autunno:   'nocciola',
  inverno:   'bacca_inverno'
};

/* Le lettere.

   Ce n'erano sei: quella d'apertura, quattro legate alle braci del
   Santuario e la ricetta di Ilde. Ma le braci arrivano dopo il ponte, e
   il ponte costa 3000 monete: fra la prima lettera e la seconda passa
   mezza partita, e in mezzo la cassetta resta vuota.

   Queste otto riempiono il vuoto, e sono agganciate a cose che il
   giocatore fa comunque — scendere in paese, tirare su il primo
   raccolto, prendere il primo pesce. Ilde ne aveva lasciato un mazzo dal
   notaio, con scritto sopra quando aprirle; le altre le scrive chi è
   ancora vivo. Il `da` compare nella cassetta: prima diceva «Da Nonna
   Ilde» anche quando non era vero. */
D.LETTERE = {
  intro:{ titolo:'La prima lettera', testo:
`Caro nipote,

se stai leggendo questo foglio vuol dire che il notaio ha fatto il suo lavoro e io ho fatto il mio: me ne sono andata con calma, in una mattina di <b>Primavera</b>, con la finestra aperta.

Ti lascio il <b>podere</b>. Non è granché. La staccionata cede a est, il pozzo fa un rumore che non ti spiego, e nel campo grande c'è più sasso che terra.

Ti lascio anche una cosa che non compare sul testamento, perché i notai non hanno le parole giuste.

C'è una <b>lanterna</b>, nel bosco. È spenta da dodici anni. Ho provato a riaccenderla finché le mani me lo hanno permesso.

Non è un obbligo. Se vuoi vendere tutto e tornare in città, fallo senza sensi di colpa: la valle non tiene il conto.

Ma se una mattina ti svegli e senti che l'aria sa di terra bagnata — allora prendi la zappa. Sai già cosa fare.

<b>Con affetto sfacciato,
Nonna Ilde</b>` },

  paese:{ titolo:'Sul paese', da:'Nonna Ilde', testo:
`Sei sceso a Fioralba. Il notaio doveva darti questa dopo, e a quanto pare ha fatto il suo lavoro anche stavolta.

<b>Bruno</b> ti sembrerà scorbutico. Lo è. Tiene i conti a memoria e non sbaglia mai di una moneta, il che lo rende insopportabile quando sbagli tu.

<b>Tobia</b> lavora bene e lo sa, e te lo fa pagare. Non tirare sul prezzo: si offende e poi ci mette il doppio.

<b>Marisol</b> alla locanda sa tutto di tutti. Ti dirà anche cose che non hai chiesto. Ascoltale lo stesso: nella valle le notizie utili viaggiano di striscio.

Una cosa pratica, che di quelle vivo: davanti a casa c'è la <b>cassa di consegna</b>. Mettici quello che vuoi vendere e passano a ritirarlo di notte. Non è tanto per il prezzo — è per non doverti fare la strada del paese ogni volta che ti avanza una rapa.

<b>Ilde</b>` },

  bosco:{ titolo:'Su Serafina', da:'Nonna Ilde', testo:
`Se sei arrivato fin nel bosco, prima o poi incontri <b>Serafina</b>.

È scesa dalla montagna trent'anni fa e non è mai scesa del tutto. Vive in quel cottage con più erbe secche che mobili, e parla come se ogni frase le costasse qualcosa.

Ti dirà del <b>burrone</b> e di cosa c'è dall'altra parte. Non farle fretta.

Ti dirà anche che ho provato a riaccendere la lanterna da sola. È vero. Ci ho messo undici anni a capire che non è una cosa che si fa da soli, e altri due a trovare qualcuno a cui lasciarla. Sei arrivato tardi, ma sei arrivato.

Portale una <b>viola</b>, quando ne trovi una. Fa finta di niente ma se le ricorda tutte.

<b>Ilde</b>` },

  miniera:{ titolo:'Sul buio', da:'Nonna Ilde', testo:
`Quindi sei sceso in <b>miniera</b>. Bene: vuol dire che hai capito che la terra da sola non basta.

Tuo nonno ci passava le giornate. Tornava su nero fino ai gomiti e diceva sempre la stessa cosa: «sotto non c'è niente di magico, c'è solo roba che nessuno ha ancora tirato fuori».

Aveva torto, ma non di molto.

Tre cose, e poi ti lascio in pace.

La prima: si scende più di un livello. Le <b>scale</b> stanno in fondo, e più vai giù più le pietre valgono.

La seconda: il <b>piccone</b> si migliora da Tobia, e un piccone migliore non è un lusso, è meno fatica per lo stesso sasso.

La terza: quando sei stanco, risali. La miniera non scappa. Tu sì, ma poi ti svegli a casa senza metà di quello che avevi in tasca.

<b>Ilde</b>` },

  primo_raccolto:{ titolo:'Sul primo raccolto', da:'Nonna Ilde', testo:
`Il primo raccolto non è mai il migliore. Non prendertela.

La terra del campo grande è stanca — l'ho sfruttata per quarant'anni e non le ho mai chiesto scusa. Ci vuole un anno perché torni gentile.

Nel frattempo: <b>semina fitto</b>, annaffia ogni giorno, e non piantare fuori stagione sperando che stavolta funzioni. Non funziona. L'ho provato tre volte, con tre stagioni diverse, e tre volte il campo mi ha risposto la stessa cosa.

Quando avrai qualche moneta da parte, fatti tirare su la <b>serra</b>: lì dentro le stagioni non contano e d'inverno hai qualcosa da fare che non sia guardare la neve.

<b>Ilde</b>` },

  prima_stagione:{ titolo:'Sul cambio di stagione', da:'Nonna Ilde', testo:
`È cambiata la stagione, e quindi metà del tuo campo è appassita in una notte.

Lo so, sembra un dispetto. Non lo è: è solo che qui le stagioni non chiedono permesso, e le piante lo sanno meglio di noi.

Regola unica: <b>raccogli prima dell'ultimo giorno</b>. Se una coltura ci mette otto giorni e la stagione ne ha ventotto, l'ultima semina utile è al ventesimo. Fatti il conto, non fidarti dell'occhio — io mi sono fidata dell'occhio per quarant'anni e ho perso un campo di zucche a tre giorni dalla fine.

E cambia anche quello che trovi nel bosco. Le <b>viole</b> di primavera non le rivedi fino all'anno dopo. Se te ne serve una per qualcosa, raccoglila quando la vedi.

<b>Ilde</b>` },

  primo_pesce:{ titolo:'Tre acque', da:'Elio', testo:
`Ehi.

Marisol dice che hai tirato su qualcosa dall'acqua. Non chiedo cosa, tanto lo so: la prima è sempre una carpa e sempre piccola.

Comunque. Ti scrivo perché la gente qui pensa che pescare sia un modo di perdere tempo con stile, e invece è l'unica cosa in questa valle che ti insegna ad aspettare senza innervosirti.

Tre posti, tre acque diverse: il <b>fiume</b> in paese, il <b>lago</b> nel bosco, il <b>mare</b> alla Costa. Non c'è pesce che stia in due posti, e non c'è pesce che stia in tutte le stagioni. Quello che prendi oggi fra tre mesi non c'è più.

Se un giorno ti capita di veder salire qualcosa di grosso in una notte di luna piena — non tirare subito. Vieni a dirmelo.

<b>Elio</b>` },

  ponte:{ titolo:'Castagno, non abete', da:'Tobia', testo:
`Conto saldato. Ti scrivo lo stesso perché una cosa così non la faccio tutti i giorni e voglio che resti scritta da qualche parte.

Cento legna, quaranta pietra, tre giorni sul burrone con la fune. Il legno l'ho scelto io: castagno, non abete. L'abete costava meno e tu non l'avresti saputo, ma io sì.

Quel ponte regge trent'anni. Non ci sarò per verificarlo e non ci sarai nemmeno tu, ma regge.

Tua nonna me l'aveva chiesto due volte. La prima non avevo l'attrezzatura, la seconda non aveva più i soldi. Non gliel'ho mai detto, ma di quelle due volte mi è rimasto un po' di magone.

Adesso è in piedi. Vacci.

<b>Tobia</b>` },

  amicizia:{ titolo:'Il tavolo d\'angolo', da:'Marisol', testo:
`Ti scrivo dalla locanda, che tanto sono sempre qui.

Volevo dirti una cosa che nessuno ti dirà in faccia: da queste parti ci si mette del tempo a decidere se una persona resta o no. Non è cattiveria, è che ne abbiamo visti passare parecchi.

Tu stai restando, e si vede. Qualcuno ha cominciato a chiedermi di te — di solito è il primo segno.

Passa quando vuoi. Il <b>tavolo d'angolo</b> era quello di Ilde, e da quando non c'è più nessuno ci si siede volentieri. Sarebbe ora che ci si sedesse qualcuno.

Cucino tutti i giorni fino a tardi. E no, non ti faccio pagare la prima volta.

<b>Marisol</b>` },

  verita:{ titolo:'La lettera che non ha spedito', da:'Nonna Ilde', testo:
`Questa non te la manda il notaio, perché non gliel'ho mai data. L'ho tenuta nel cassetto della cucina, sotto la carta, e se sei arrivato a saperlo vuol dire che Serafina ha deciso di parlare. Ci avrà messo un po'.

Allora lo dico io, che è meglio.

L'ho spenta io. Non il vento, non la neve, non i dodici anni. Io, con le mani, la notte del solstizio, mentre mi dicevano che tuo nonno era morto seduto sulla riva del fiume come uno che si riposa.

Non l'ho fatto per rabbia. Se fosse stata rabbia sarebbe passata in una settimana e l'avrei riaccesa a gennaio.

L'ho fatto perché in quel momento non mi è venuto in mente <b>per chi</b>. È una domanda stupida e ci ho messo undici anni a capire che la risposta non era «per lui». Non è mai stata per lui. Era per la valle, e la valle il giorno dopo si è svegliata lo stesso, solo un po' più grigia, e ha continuato a svegliarsi grigia per dodici anni per colpa di una domanda che mi ero fatta al buio.

Ho provato a rimediare. Le mani non hanno tenuto il passo delle intenzioni, che è il modo educato di dire che sono invecchiata.

Adesso c'è una cosa che devi sapere, e la scrivo qui perché a voce non la direi bene.

Quella lanterna io la tenevo accesa da sola. Mi sembrava giusto: era il mio santuario, la mia valle, il mio compito. Era anche l'errore, e l'ho fatto per quarant'anni senza accorgermene.

Una lanterna tenuta da una persona sola si spegne quando quella persona ha una brutta notte.

Non farla come me. Chiama gente.

<b>Ilde</b>` },

  veglia:{ titolo:'Dopo la veglia', da:'Nonna Ilde', testo:
`Se stai leggendo questa vuol dire che ce l'hai fatta, e che al santuario non c'eri da solo.

Non ti scrivo per congratularmi. Ti scrivo per dirti la cosa noiosa che le nonne dicono alla fine, e che è l'unica che conta.

Adesso la Lanterna sta accesa senza di te.

Non perché sia magica: perché siete in sette a saperla accendere, e sette persone non hanno una brutta notte tutte insieme. Se domani ti va di stare a letto, la valle non si spegne. Se ti va di andartene per un mese, non si spegne. Se un giorno decidi che questa vita non fa per te e torni in città, non si spegne.

Ci ho messo quarant'anni e una notte al buio per capirlo, quindi permettimi di scriverlo grosso: <b>la valle non ti tiene in ostaggio</b>. Ci stai perché ti va.

Il podere ha ancora la staccionata che cede a est. Il pozzo fa ancora quel rumore. Nel campo grande adesso c'è meno sasso che terra, e quello è merito tuo.

Vai a dormire, che domani c'è da annaffiare.

<b>Con affetto sfacciato, ancora,
Nonna Ilde</b>` },

  primavera:{ titolo:'Sulla prima brace', testo:
`Allora l'hai trovata.

La prima brace è sempre la più facile e la più difficile. Facile perché la primavera regala. Difficile perché devi <b>crederci</b> senza aver ancora visto niente.

Io la accesi a ventidue anni. Avevo le mani a pezzi e nessuno che mi dicesse se stavo sbagliando.

Tre ancora. Non correre.

<b>Ilde</b>` },

  estate:{ titolo:'Sul caldo', testo:
`D'estate la valle diventa rumorosa. Grilli, api, quel vento che arriva alle quattro e sposta tutto.

Ti confesso una cosa: la seconda brace l'ho quasi mollata. Avevo il campo secco, un debito con il padre di Bruno e una gran voglia di andarmene.

Poi Serafina — sì, era già insopportabile allora — mi disse: <b>"Non devi salvare la valle. Devi solo non abbandonarla oggi."</b>

Funziona anche per le persone.

<b>Ilde</b>` },

  autunno:{ titolo:'Sul raccogliere', testo:
`Terza. Bravo. Non lo dico spesso, quindi rileggilo.

L'autunno è la stagione onesta: ti mostra esattamente quanto hai lavorato in primavera. Niente scuse, niente miracoli.

C'è una cosa che non ti ho detto. La lanterna non si spense da sola, dodici anni fa. Si spense la notte in cui morì tuo nonno.

Non credo alle maledizioni. Credo che ci sia luce dove qualcuno la tiene accesa, e che quell'anno io <b>non ce l'ho fatta</b>.

Tu sì. Ecco perché ti ho lasciato il podere e non i soldi.

<b>Ilde</b>` },

  /* Non arriva per posta: la consegna il gatto stesso, la prima volta
     che smette di essere randagio. Ilde non fa in tempo a dirti come si
     chiama, quindi te lo dice con una carta lasciata dove sapeva che
     prima o poi avresti guardato. */
  gatto:{ titolo:'Il gatto', da:'Nonna Ilde', testo:
`Se stai leggendo questa, vuol dire che si è deciso.

Non è mio e non è tuo: è arrivato una sera d'inverno che pioveva e si è messo davanti alla stufa come se avesse pagato l'affitto. L'ho chiamato <b>Cenere</b> perché era esattamente del colore che resta quando il fuoco si spegne, e a quel tempo la battuta mi sembrava spiritosa.

Ci ha messo due anni a farsi toccare. Due. Io gli mettevo il latte fuori e facevo finta di niente, e lui faceva finta di niente e beveva il latte.

Poi una sera mi si è seduto sulle ginocchia senza chiedere permesso, e non se n'è più andato.

Ti dico questo perché con le persone della valle funziona uguale, solo che nessuno te lo spiega: non devi convincerle. Devi solo esserci abbastanza volte.

Lui lo sa già. Per questo è rimasto anche quando non c'è rimasto nessun altro.

<b>Ilde</b>` },

  ricetta_ilde:{ titolo:'La ricetta di Ilde', testo:
`<b>Torta del Solstizio — di Nonna Ilde</b>

Zucca cotta e schiacciata. Uova, quelle vere, di gallina contenta. Miele fino a quando smetti di sentirti in colpa. E — non ridere — una presa di <b>lavanda</b>.

Il segreto non si scrive, ma te lo scrivo lo stesso: <b>tempo</b>. Impasta, poi lasciala nel forno spento tutta la notte, a prendersi il calore che resta.

La facevo per il solstizio, dicevo. Bugia. La facevo per avere una scusa buona per vederti seduto al mio tavolo.

Adesso falla tu, per qualcuno. Mi raccomando la lavanda.

<b>Ilde</b>` },

  inverno:{ titolo:'L\'ultima lettera', testo:
`Se sei qui, la valle è accesa.

Non ti scriverò più: ho finito le cose importanti da dire, e le altre te le racconterà Serafina esagerandole.

Volevo solo che sapessi che quando piantavo i semi non pensavo al raccolto. Pensavo a chi sarebbe passato di lì dopo di me, e avrebbe trovato la terra <b>già pronta</b>.

Adesso tocca a te lasciarla pronta per qualcun altro.

Chiudi la porta piano quando esci. Cigola.

<b>Ti ho voluto un bene assurdo,
Nonna Ilde</b>` }
};

/* frasi ambientali al risveglio */
D.RISVEGLI = [
  'Il gallo ha cantato due volte. Il secondo era per te.',
  'C\'è rugiada sul davanzale.',
  'Odore di legna dal camino di Marisol.',
  'La valle è ancora mezza addormentata.',
  'Il pozzo ha fatto quel rumore. Di nuovo.',
  'Qualcosa è cresciuto stanotte.'
];

/* ------------------------------------------------------------------
   BATTUTE CONTESTUALI
   Prima ogni abitante aveva cinque frasi e basta: chi passava a salutare
   ogni giorno — che è quello che il gioco chiede di fare — le esauriva
   in meno di una settimana e poi le risentiva per mesi.
   Qui ognuno ha qualcosa da dire sulla stagione, sul tempo che fa,
   sull'ora del giorno e su quanto vi conoscete.
   ------------------------------------------------------------------ */
D.CONTESTO = {
  bruno: {
    stagione: {
      primavera:['I semi di primavera vanno via che è un piacere. Se ne vuoi, muoviti.',
                 'Ogni primavera dico che quest\'anno mi organizzo. Ogni primavera arrivo impreparato.'],
      estate:   ['Con questo caldo la gente compra e scappa. Nessuno chiacchiera più.',
                 'Tengo i semi di melone all\'ombra. L\'anno scorso mi sono germogliati in negozio.'],
      autunno:  ['L\'autunno è la mia stagione: si vende tutto e si lavora la metà.',
                 'Zucche. Ogni anno mi sommergono di zucche. E ogni anno le ricompro.'],
      inverno:  ['D\'inverno vendo tre cose in croce e parlo con chiunque entri. Compreso te.',
                 'Il magazzino è pieno e il paese è vuoto. Fa un certo effetto.']
    },
    meteo: {
      pioggia:  ['Con la pioggia entra gente solo per asciugarsi. Non compra niente, ma almeno parla.'],
      temporale:['Ho staccato l\'insegna prima che la portasse via il vento. È già successo.'],
      neve:     ['Con la neve la gente compra il doppio del necessario. Non ho mai capito perché.'],
      vento:    ['Il vento mi rovescia le ceste. Ogni volta.']
    },
    ora: {
      mattina:  ['Aperto da un\'ora e sei il primo. Dimmi che è un buon segno.'],
      sera:     ['Sto per chiudere. Se ti serve qualcosa, adesso o domani.']
    }
  },

  serafina: {
    stagione: {
      primavera:['Il bosco si sta svegliando adesso. Cammina piano, i primi giorni.',
                 'Le viole sono uscite tutte insieme, come se si fossero messe d\'accordo.'],
      estate:   ['D\'estate il sottobosco profuma di resina. Respira, invece di correre.',
                 'La lavanda va colta al mattino, prima che il sole se la beva.'],
      autunno:  ['Adesso il bosco dà tutto quello che ha. Prendine metà e lascia il resto.',
                 'I porcini escono dopo tre giorni di pioggia. Segnatelo.'],
      inverno:  ['Sotto la neve non è morto niente. Sta solo contando i giorni.',
                 'D\'inverno il bosco è più onesto: si vede la forma delle cose.']
    },
    meteo: {
      pioggia:  ['La pioggia è la voce del bosco. Sta dicendo qualcosa, se ti fermi.'],
      temporale:['I temporali fanno crescere le piante più in fretta. Non chiedermi perché, so solo che è così.'],
      neve:     ['Nella neve si leggono le impronte. Oggi è passata una volpe, prima di te.'],
      vento:    ['Il vento porta i semi lontano. È l\'unico modo che hanno di viaggiare.']
    },
    ora: {
      mattina:  ['A quest\'ora il bosco è ancora di chi ci vive. Sei ospite: comportati bene.'],
      sera:     ['Sta per farsi buio. Se torni al podere, prendi il sentiero, non la scorciatoia.']
    }
  },

  tobia: {
    stagione: {
      primavera:['Primavera: tutti si ricordano che gli attrezzi sono da aggiustare.',
                 'Il legno umido non tiene. Aspetta l\'estate per la staccionata.'],
      estate:   ['Con la fucina accesa e questo caldo, io d\'estate mi sciolgo.',
                 'Lavoro all\'alba e al tramonto. Nel mezzo, sto all\'ombra come un gatto.'],
      autunno:  ['Stagione buona per il ferro: né umido né rovente.',
                 'Se hai lingotti da parte, adesso è il momento di portarmeli.'],
      inverno:  ['La fucina d\'inverno è il posto più caldo del paese. Passa quando vuoi.',
                 'Il freddo rende il metallo capriccioso. Ci vuole più pazienza.']
    },
    meteo: {
      pioggia:  ['Il carbone bagnato non serve a niente. Oggi si batte poco.'],
      temporale:['Sento i tuoni nel petto prima che nelle orecchie. È l\'incudine.'],
      neve:     ['Nevica. Il mantice tira meglio con l\'aria fredda, però.'],
      vento:    ['Con questo vento la forgia tira troppo. Brucio il doppio del carbone.']
    },
    ora: {
      mattina:  ['Sono in piedi da prima di te. Il ferro non aspetta.'],
      sera:     ['Chiudo bottega e vado alla locanda. Ci vediamo là, se ti va.']
    }
  },

  marisol: {
    stagione: {
      primavera:['In primavera cambio il menu. Le prime erbe cambiano tutto.',
                 'Serafina mi porta le viole e io ci faccio uno sciroppo che non ti dico.'],
      estate:   ['D\'estate si mangia fuori, sotto il pergolato. Passa una sera.',
                 'Il pomodoro d\'estate non ha bisogno di niente. Nemmeno di me.'],
      autunno:  ['Autunno: zucca, funghi, castagne. La cucina si scrive da sola.',
                 'È la stagione in cui la locanda si riempie e io dormo poco.'],
      inverno:  ['D\'inverno tengo il camino acceso tutto il giorno. Vieni a scaldarti.',
                 'Le conserve d\'estate si aprono adesso. È come riaprire luglio.']
    },
    meteo: {
      pioggia:  ['Quando piove la locanda si riempie. Adoro la pioggia, professionalmente.'],
      temporale:['Coi tuoni la gente resta a tavola più a lungo. E ordina il dolce.'],
      neve:     ['Ho messo la zuppa sul fuoco alle sei. Con questa neve, sparirà entro mezzogiorno.'],
      vento:    ['Il vento fa sbattere le imposte e i clienti si spaventano. Poi ordinano vino.']
    },
    ora: {
      mattina:  ['Sto impastando. Se resti a guardare, ti metto a lavorare.'],
      sera:     ['È l\'ora buona: c\'è gente, c\'è rumore, c\'è odore di cena. Siediti.']
    }
  },

  elio: {
    stagione: {
      primavera:['In primavera i pesci hanno fame come me. Si prende tutto.',
                 'La trota di primavera è più magra ma più buona. Fidati.'],
      estate:   ['D\'estate si pesca all\'alba o non si pesca. Il resto è stare al sole.',
                 'Al largo, d\'estate, l\'acqua è così ferma che si vede il fondo.'],
      autunno:  ['L\'autunno è per il luccio. Grosso, cattivo, e non molla mai.',
                 'Con le foglie in acqua abbocca meno. Bisogna avere pazienza.'],
      inverno:  ['D\'inverno le mani si spaccano e i pesci stanno sotto. Ma io vado lo stesso.',
                 'Lo storione d\'inverno vale tre giorni di freddo. Almeno.']
    },
    meteo: {
      pioggia:  ['Quando piove i pesci salgono. È il momento migliore e nessuno ci crede.'],
      temporale:['Col temporale non si esce sul molo. Ho imparato bagnandomi.'],
      neve:     ['Sotto la neve l\'acqua è nera e ferma. Un po\' mi mette soggezione.'],
      vento:    ['Col vento la lenza va dove vuole lei. Oggi è una lotta.']
    },
    ora: {
      mattina:  ['Sono qui da prima dell\'alba. I pesci non aspettano chi dorme.'],
      sera:     ['Di notte, al molo, l\'acqua fa un rumore diverso. Più profondo. Provaci.']
    }
  },

  eremita: {
    stagione: {
      primavera:['Quassù la primavera arriva con un mese di ritardo. Non si offende nessuno.',
                 'La neve si ritira e sotto trovo le cose che avevo perso a novembre.'],
      estate:   ['Due settimane d\'estate, quassù. Le uso tutte.',
                 'D\'estate il passo è quasi ospitale. Quasi.'],
      autunno:  ['L\'autunno dura tre giorni e poi è già inverno. Fai in fretta.',
                 'Sto mettendo via legna. Ne serve sempre più di quanto pensi.'],
      inverno:  ['Adesso siamo io e la montagna. È il periodo che preferisco.',
                 'Il freddo non è il nemico. È il vento a portarti via.']
    },
    meteo: {
      pioggia:  ['Pioggia quassù vuol dire che sotto sta nevicando. Aspetta.'],
      temporale:['I temporali di montagna arrivano di sotto in su. Guarda la valle, non il cielo.'],
      neve:     ['Nevica. Bene. La neve copre e protegge, non uccide.'],
      vento:    ['Questo vento scende dal ghiacciaio. Coprila, quella faccia.']
    },
    ora: {
      mattina:  ['Sei salito presto. Pochi lo fanno.'],
      sera:     ['Fra un\'ora non si vedrà più il sentiero. Deciditi.']
    }
  }
};

/* cosa si dicono il giorno della sagra, quando il paese è tutto in piazza */
D.FESTA = {
  bruno:    ['Bottega chiusa. Una volta a stagione me lo concedo.',
             'Guarda quanta gente. E pensare che di solito parlo con le casse.'],
  serafina: ['Sono scesa dal bosco apposta. Non succede spesso: segnatelo.',
             'Ilde non ne saltava una. Stava lì, in quell\'angolo, a guardare tutti.'],
  tobia:    ['Oggi la fucina è fredda e io ho le mani pulite. Mi sento strano.',
             'Ho portato le panche nuove. Tre giorni di lavoro, per un pomeriggio.'],
  marisol:  ['Ho cucinato per settanta persone. Settanta, in un paese di dodici.',
             'Assaggia tutto e non dirmi cosa preferisci: mi offendo comunque.'],
  elio:     ['Un giorno all\'anno non pesco. Oggi. E già mi manca.',
             'Alla sagra dell\'anno scorso ho raccontato del Pesce Luna. Ridono ancora.']
};

/* battute per il proprio compleanno */
D.AUGURI = {
  bruno:    'Oggi? Compleanno. Non l\'ho detto a nessuno e voi ve lo ricordate tutti. Misterioso.',
  serafina: 'Compio gli anni oggi. Li conto ancora, sì. Mi sembra una cortesia verso il tempo.',
  tobia:    'Compleanno. Mio padre me lo festeggiava battendo l\'incudine dodici volte. Rumoroso, ma sincero.',
  marisol:  'È il mio compleanno e sto cucinando per gli altri. Non lo cambierei con niente.',
  elio:     'Oggi compio gli anni. Da ragazzo pescavo per festeggiare. Oggi... pesco lo stesso.',
  eremita:  'Compleanno. Quassù non lo sa nessuno. Che tu sia salito oggi è una coincidenza notevole.'
};

/* ------------------------------------------------------------------
   AGENDE — la giornata degli abitanti

   Prima stavano fermi nello stesso fazzoletto di prato alle tre di notte
   come a mezzogiorno, con qualsiasi tempo. Ora ognuno ha una giornata:
   dorme, apre bottega, va alla locanda la sera, e col brutto tempo si
   mette al riparo.

   `fino`  : minuto della giornata in cui la fascia finisce (6:00 = 360)
   `giro`  : caselle fra cui gironzola in quella fascia
   `dentro`: sta in casa — non compare sulla mappa
   `fisso` : non si sposta (Fiammella)
   `coperto`: la fascia vale anche col brutto tempo
   ------------------------------------------------------------------ */
D.AGENDE = {
  bruno: [
    { fino:480,  dentro:true },                                   // dorme
    { fino:600,  giro:[[12,16],[10,16],[11,17]] },                 // apre e sistema fuori
    { fino:1140, interno:'int_bottega' },                          // dietro al bancone
    { fino:1320, interno:'int_locanda' },                          // la sera alla locanda
    { fino:9999, dentro:true }
  ],
  tobia: [
    { fino:540,  dentro:true },
    { fino:720,  giro:[[29,15],[31,16],[27,16]] },                 // scarica il ferro
    { fino:1170, interno:'int_fucina' },                           // alla forgia
    { fino:1350, interno:'int_locanda' },
    { fino:9999, dentro:true }
  ],
  marisol: [
    { fino:420,  dentro:true },
    { fino:1380, interno:'int_locanda' },                          // la locanda è casa sua
    { fino:9999, dentro:true }
  ],
  elio: [
    { fino:330,  dentro:true },
    { fino:780,  giro:[[34,19],[35,18],[33,19]] },                 // all'alba al molo
    { fino:1020, giro:[[24,20],[22,21],[26,20]] },                 // pomeriggio in piazza
    { fino:1290, interno:'int_locanda' },
    { fino:9999, dentro:true }
  ],
  serafina: [
    { fino:450,  dentro:true },
    { fino:900,  giro:[[9,17],[11,18],[7,18],[10,19]] },           // mattina nell'orto
    { fino:1200, giro:[[14,20],[17,22],[12,23]] },                 // pomeriggio nel bosco
    { fino:9999, dentro:true }
  ],
  eremita: [
    // l'eremita vive fuori: la neve non lo scoraggia
    { fino:420,  dentro:true },
    { fino:1260, giro:[[26,15],[24,16],[28,14],[25,18]], coperto:true },
    { fino:9999, dentro:true }
  ],
  fiammella: [ { fino:9999, fisso:true } ]
};

/* ------------------------------------------------------------------
   COMPLEANNI — una casella del calendario che prima era vuota
   Nel giorno giusto qualunque regalo vale il triplo.
   ------------------------------------------------------------------ */
D.COMPLEANNI = {
  bruno:    { stagione:'autunno',   giorno:9  },
  serafina: { stagione:'primavera', giorno:14 },
  tobia:    { stagione:'inverno',   giorno:6  },
  marisol:  { stagione:'estate',    giorno:21 },
  elio:     { stagione:'estate',    giorno:4  },
  eremita:  { stagione:'inverno',   giorno:25 }
};

/* consigli caricamento */
/* ------------------------------------------------------------------
   PASSANTI — la gente che abita il paese senza avere una storia

   Stanno in una tabella loro e non in D.NPCS, e non è pigrizia: un
   controllo pretende che ogni voce di NPCS abbia battute per tutte e
   quattro le stagioni, per il tempo che fa, per l'ora del giorno, un
   compleanno, una casa e dei regali preferiti. È giusto che lo pretenda
   — sono i sei che devi imparare a conoscere. Un passante non ha niente
   di tutto questo: ha una faccia, un giro da fare e delle cose che dice
   ad alta voce. Metterlo fra gli abitanti avrebbe voluto dire o
   indebolire quel controllo per tutti, o inventare sei compleanni finti.

   Non ci si parla: premendo E non succede niente. Sono lì per far
   sembrare che il paese esista anche quando non stai guardando, ed è
   tutto quello che devono fare.

   `dove` è la mappa, `giro` le caselle fra cui gironzolano, `quando`
   una funzione facoltativa che decide se oggi ci sono: la lavandaia
   esce solo col sereno, il bambino non gira di notte.
   ------------------------------------------------------------------ */
D.PASSANTI = [
  { id:'lavandaia', dove:'fioralba', giro:[[12,19],[11,18],[13,18]],
    look:{ pelle:'#d8a878', capelli:'#6a4a30', maglia:'#8aa8c0', pant:'#5a6a7a', grembiule:'#e8e0d0',
           corpo:'normale', altezza:0, chioma:'raccolti' },
    quando:(G)=> G.meteo==='sereno' || G.meteo==='nuvoloso',
    dice:[
      'Se stendo adesso, per sera è asciutto.',
      'Il sapone buono lo fa Serafina. Costa, ma dura.',
      'Ho tre lenzuola e quattro figli. Fate voi il conto.',
      'Mia madre diceva che il bucato steso al sole sa di domenica.'
    ] },

  { id:'bambino', dove:'fioralba', giro:[[21,21],[22,22],[25,18]],
    look:{ pelle:'#e8c090', capelli:'#c9a044', maglia:'#d8724c', pant:'#4a5a6a',
           corpo:'esile', altezza:-3, chioma:'crespi' },
    quando:(G)=> G.ora > 480 && G.ora < 1140,
    dice:[
      'Ho visto un cervo! Grande così! ...forse era un cane.',
      'Quando sarò grande faccio il fabbro. O il pescatore. O tutti e due.',
      'Elio dice che il Pesce Luna esiste. Io gli credo.',
      'Mia mamma dice che non devo andare nel bosco da solo. Ci vado con te?',
      'Sai fischiare? Io no. Ci sto provando da un anno.'
    ] },

  { id:'vecchia', dove:'fioralba', giro:[[18,27],[17,26],[19,26]],
    look:{ pelle:'#d0b098', capelli:'#dcdcdc', maglia:'#7a6a8a', pant:'#4a4050', cappello:'#5a4a68',
           corpo:'normale', altezza:-2, chioma:'raccolti' },
    dice:[
      'Ilde la conoscevo da prima che fosse nonna di qualcuno.',
      'Una volta questa piazza era piena. Adesso è piena a modo suo.',
      'Il pozzo fa quel rumore da quarant\'anni. Non è mai stato il pozzo.',
      'Tu sei quello del podere di sopra, vero? Si vede dalle mani.',
      'Passa a trovarmi, che tanto sono sempre qui.'
    ] },

  { id:'pastore', dove:'piazza', giro:[[18,8],[17,7],[19,7]],
    look:{ pelle:'#b8865a', capelli:'#3a2f24', maglia:'#6a7a4a', pant:'#4a4030', barba:true,
           corpo:'robusto', altezza:1, chioma:'rado' },
    quando:(G)=> G.meteo!=='temporale',
    dice:[
      'Scendo dai pascoli una volta a settimana. Il resto lo sanno le pecore.',
      'Il formaggio buono vuole erba buona, e l\'erba buona vuole essere lasciata in pace.',
      'Su in alto si sente il vento prima che arrivi qui.',
      'Oreste? Sì, lo vedo. Ci salutiamo da lontano. Ci basta.'
    ] },

  { id:'marinaio', dove:'piazza', giro:[[28,21],[29,20],[27,22]],
    look:{ pelle:'#c08a5a', capelli:'#2a2420', maglia:'#4a6a8a', pant:'#3a4a58', cappello:'#8a8070',
           corpo:'robusto', altezza:0, chioma:'corti' },
    dice:[
      'Il mare qui è calmo. Troppo calmo. Non mi fido dei mari educati.',
      'Ho visto porti più grandi. Nessuno più tranquillo di questo.',
      'Quando c\'è vento da sud, il pesce si sposta al largo. Diglielo, a quel ragazzo.',
      'Dodici anni fa da qui si vedeva una luce, la notte del solstizio. Poi più niente.'
    ] },

  { id:'ragazza', dove:'piazza', giro:[[18,19],[20,19],[22,19]],
    look:{ pelle:'#e0b088', capelli:'#8a4f3a', maglia:'#c08ab0', pant:'#6a5a7a',
           corpo:'esile', altezza:0, chioma:'lunghi' },
    quando:(G)=> G.ora > 540,
    dice:[
      'Sto imparando a memoria i nomi dei pesci. Sono più di quanto pensassi.',
      'Marisol mi ha promesso che mi insegna la crostata. Aspetto da marzo.',
      'D\'estate ci si siede sul molo fino a tardi. È la cosa migliore dell\'anno.',
      'Tu vieni dal podere di Ilde? Mia nonna ne parlava sempre.'
    ] }
];

D.CONSIGLI = [
  'Dormi prima di mezzanotte o ti sveglierai a pezzi.',
  'La pioggia annaffia il campo al posto tuo.',
  'Gli attrezzi migliorati costano, ma consumano meno energia.',
  'Metti una Lanterna vicino al campo: di notte è tutta un\'altra cosa.',
  'Le conserve valgono più del raccolto crudo.',
  'Regala qualcosa agli abitanti: due volte a settimana bastano.',
  'Nel bosco, ogni stagione nasconde qualcosa di diverso.'
];

})();
