/* ===================================================================
   FIORALBA — data.js
   Tutti i dati di gioco: colture, oggetti, ricette, personaggi, lore.
   =================================================================== */
(function(){
'use strict';

const D = {};
window.DATA = D;

/* ------------------------------------------------------------------
   STAGIONI
   ------------------------------------------------------------------ */
D.SEASONS = [
  { id:'primavera', nome:'Primavera', grass:'#6fa84f', grass2:'#5d9442', tree:'#5c9440', accent:'#f5a6c0' },
  { id:'estate',    nome:'Estate',    grass:'#5f9c3c', grass2:'#4f8a32', tree:'#3f8232', accent:'#f7d154' },
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

  /* --- materiali --- */
  legna:      { nome:'Legna',      cat:'materiale', prezzo:6,  desc:'Utile per costruire quasi tutto.' },
  pietra:     { nome:'Pietra',     cat:'materiale', prezzo:5,  desc:'Solida e grigia.' },
  fibra:      { nome:'Fibra',      cat:'materiale', prezzo:3,  desc:'Filamenti d\'erba secca.' },
  argilla:    { nome:'Argilla',    cat:'materiale', prezzo:14, desc:'Morbida, si trova zappando.' },
  carbone:    { nome:'Carbone',    cat:'materiale', prezzo:22, desc:'Brucia a lungo e caldo.' },
  linfa:      { nome:'Linfa d\'acero', cat:'materiale', prezzo:26, desc:'Dolce resina degli alberi.' },
  uovo:       { nome:'Uovo',       cat:'animale',   prezzo:32, desc:'Ancora tiepido.' },
  uovo_oro:   { nome:'Uovo d\'Oro',cat:'animale',   prezzo:340,desc:'Le galline felici fanno miracoli.' },
  miele:      { nome:'Miele',      cat:'materiale', prezzo:75, desc:'Denso, profumato di fiori.' },
  latte:      { nome:'Latte',      cat:'animale',   prezzo:65, desc:'Cremoso e fresco.' },

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
  recinto:    { nome:'Staccionata',   cat:'artigianato', prezzo:8,  desc:'Delimita con garbo.', posabile:'recinto' },
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
D.SHOP_EXTRA = ['fibra','legna','pietra','concime','sentiero','gallina'];

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
                 {liv:3,nome:'Oro',    costo:11000,ing:{lingotto_oro:5}}]
};
D.UPG_NOMI = ['Semplice','di Rame','di Ferro','d\'Oro'];

/* ------------------------------------------------------------------
   ABILITÀ
   ------------------------------------------------------------------ */
D.SKILLS = {
  agricoltura:{ nome:'Agricoltura', desc:'I raccolti valgono di più.' },
  raccolta:   { nome:'Raccolta',    desc:'Più legna, più fibra, più fortuna nel bosco.' },
  estrazione: { nome:'Estrazione',  desc:'Le rocce cedono più in fretta.' },
  pesca:      { nome:'Pesca',       desc:'La barra si allarga, i pesci si stancano.' }
};
D.XP_LIV = [0,100,260,500,850,1350,2000,2850,3900,5200,6800];

/* ------------------------------------------------------------------
   PERSONAGGI
   ------------------------------------------------------------------ */
D.NPCS = {
  bruno: {
    nome:'Bruno', ruolo:'Bottegaio',
    look:{ pelle:'#e0aa78', capelli:'#5a4030', maglia:'#b8543f', pant:'#4a3b5c', grembiule:'#e3d3aa', barba:true, cappello:null },
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
    look:{ pelle:'#d8a882', capelli:'#8a4f6a', maglia:'#6a4f8a', pant:'#3f3050', grembiule:null, cappello:'#4a3560' },
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
    look:{ pelle:'#b8804f', capelli:'#2f2820', maglia:'#4a5a6a', pant:'#3a3028', grembiule:'#6a4030', barba:true },
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
    look:{ pelle:'#8a5a3a', capelli:'#241a14', maglia:'#c47a2c', pant:'#7a4f30', grembiule:'#f0e0c0' },
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
    look:{ pelle:'#e8c090', capelli:'#c9a044', maglia:'#5f9c8a', pant:'#4a5a6a', cappello:'#7a6a4a' },
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
    look:{ pelle:'#d8b090', capelli:'#d8d8d8', maglia:'#5a6a7a', pant:'#3a4450', cappello:'#3f4a58', barba:true },
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

/* lettere di Nonna Ilde — sbloccate dagli eventi */
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

/* consigli caricamento */
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
