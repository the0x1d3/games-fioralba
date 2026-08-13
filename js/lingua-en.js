/* ===================================================================
   FIORALBA — lingua-en.js
   Il gioco in inglese. La chiave è la frase italiana: il perché sta in
   lingua.js, e `node tools/lingua.js en` dice quante ne mancano.

   Una nota sul tono, per chi tradurrà la prossima lingua. Fioralba non
   è scritto in italiano neutro: Ilde dà del tu, Bruno taglia corto,
   Oreste parla per sentenze e Serafina per immagini. Tradurre la
   *informazione* e perdere la voce vuol dire consegnare un altro gioco.
   Dove la lettera e il suono litigano, qui ha vinto il suono.

   Due esempi di scelte prese, così si capisce il criterio:
   — «Locanda del Tasso Storto» → «The Crooked Badger Inn». «Tasso» è
     l'animale, non l'albero né l'interesse bancario, e «storto» è
     affettuoso, non difettoso.
   — Il gatto si chiama Cenere e in inglese resta **Ash**: è una parola
     che in inglese fa lo stesso mestiere — colore, residuo del fuoco,
     e nome plausibile per un gatto.
   =================================================================== */
window.LINGUA_EN = {

/* ===================================================================
   ATTREZZI E MATERIALI
   =================================================================== */
'Zappa': 'Hoe',
'Annaffiatoio': 'Watering Can',
'Ascia': 'Axe',
'Piccone': 'Pickaxe',
'Falce': 'Scythe',
'Canna da pesca': 'Fishing Rod',
'Arco': 'Bow',

'Legna': 'Wood',
'Pietra': 'Stone',
'Fibra': 'Fibre',
'Argilla': 'Clay',
'Carbone': 'Coal',
'Linfa d\'acero': 'Maple Sap',
'Carne': 'Meat',
'Pelle': 'Hide',
'Corno di Cervo': 'Deer Antler',
'Uovo': 'Egg',
'Uovo d\'Oro': 'Golden Egg',
'Miele': 'Honey',
'Latte': 'Milk',

'Minerale di Rame': 'Copper Ore',
'Minerale di Ferro': 'Iron Ore',
'Minerale d\'Oro': 'Gold Ore',
'Lingotto di Rame': 'Copper Bar',
'Lingotto di Ferro': 'Iron Bar',
'Lingotto d\'Oro': 'Gold Bar',
'Quarzo': 'Quartz',
'Ametista': 'Amethyst',
'Gemma di Luna': 'Moonstone',
'Geode': 'Geode',

/* ===================================================================
   FORAGGIO E PESCI
   =================================================================== */
'Cipolla Selvatica': 'Wild Onion',
'Dente di Leone': 'Dandelion',
'Viola di Bosco': 'Wood Violet',
'Mora': 'Blackberry',
'Erba Dolce': 'Sweet Grass',
'Lavanda': 'Lavender',
'Porcino': 'Porcini',
'Nocciola': 'Hazelnut',
'Melagrana': 'Pomegranate',
'Bacca d\'Inverno': 'Winterberry',
'Radice Gelata': 'Frostroot',
'Cristallo di Neve': 'Snow Crystal',

'Trota': 'Trout',
'Carpa': 'Carp',
'Persico': 'Perch',
'Luccio': 'Pike',
'Anguilla': 'Eel',
'Storione': 'Sturgeon',
'Temolo': 'Grayling',
'Pesce Sole': 'Sunfish',
'Pesce Luna': 'Moonfish',
'Gambero di Fiume': 'River Crayfish',
'Branzino': 'Sea Bass',
'Orata': 'Sea Bream',
'Sgombro': 'Mackerel',
'Polpo': 'Octopus',
'Ricciola': 'Amberjack',
'Scarpa Vecchia': 'Old Boot',
'Alga': 'Seaweed',
'Lattina Arrugginita': 'Rusty Can',

/* ===================================================================
   ARTIGIANATO E MACCHINE
   =================================================================== */
'Concime': 'Fertiliser',
'Terra Umida': 'Damp Soil',
'Spaventapasseri': 'Scarecrow',
'Sentiero di Pietra': 'Stone Path',
'Staccionata': 'Fence',
'Cancelletto': 'Gate',
'Lanterna': 'Lantern',
'Cassa': 'Chest',
'Barattoliera': 'Preserves Jar',
'Botte': 'Cask',
'Forno a Legna': 'Wood Oven',
'Fornace': 'Furnace',
'Arnia': 'Beehive',
'Barattolo di Lucciole': 'Jar of Fireflies',

/* ===================================================================
   CUCINA
   =================================================================== */
'Zuppa Contadina': 'Farmhouse Soup',
'Spezzatino': 'Stew',
'Frittata': 'Omelette',
'Insalata dell\'Orto': 'Garden Salad',
'Torta di Zucca': 'Pumpkin Cake',
'Crostata di Frutti': 'Berry Tart',
'Polenta': 'Polenta',
'Pesce Arrosto': 'Roast Fish',
'Pane e Miele': 'Bread and Honey',
'Tisana di Serafina': 'Serafina\'s Tisane',

/* ===================================================================
   COSE DELLA STORIA
   =================================================================== */
'Brace di Primavera': 'Spring Ember',
'Brace d\'Estate': 'Summer Ember',
'Brace d\'Autunno': 'Autumn Ember',
'Brace d\'Inverno': 'Winter Ember',
'Medaglione di Ilde': 'Ilde\'s Locket',
'Gancio da Lanterna': 'Lantern Hook',
'Gallina': 'Hen',

/* ===================================================================
   COLTURE E SEMI
   Le colture hanno lo stesso nome del raccolto: una voce sola le copre
   tutte e due, perché la chiave è la parola, non il posto in cui sta.
   =================================================================== */
'Rapa': 'Turnip',
'Semi di Rapa': 'Turnip Seeds',
'Patata': 'Potato',
'Semi di Patata': 'Potato Seeds',
'Spinacio': 'Spinach',
'Semi di Spinacio': 'Spinach Seeds',
'Fragola': 'Strawberry',
'Semi di Fragola': 'Strawberry Seeds',
'Narciso': 'Daffodil',
'Semi di Narciso': 'Daffodil Seeds',
'Pomodoro': 'Tomato',
'Semi di Pomodoro': 'Tomato Seeds',
'Mais': 'Corn',
'Semi di Mais': 'Corn Seeds',
'Girasole': 'Sunflower',
'Semi di Girasole': 'Sunflower Seeds',
'Melone': 'Melon',
'Semi di Melone': 'Melon Seeds',
'Peperoncino': 'Chilli',
'Semi di Peperoncino': 'Chilli Seeds',
'Zucca': 'Pumpkin',
'Semi di Zucca': 'Pumpkin Seeds',
'Uva': 'Grape',
'Semi di Uva': 'Grape Seeds',
'Cavolo': 'Cabbage',
'Semi di Cavolo': 'Cabbage Seeds',
'Melanzana': 'Aubergine',
'Semi di Melanzana': 'Aubergine Seeds',
'Mirtillo': 'Blueberry',
'Semi di Mirtillo': 'Blueberry Seeds',
'Radice d\'Inverno': 'Winter Root',
'Semi di Radice d\'Inverno': 'Winter Root Seeds',
'Cristallia': 'Crystallia',
'Semi di Cristallia': 'Crystallia Seeds',

/* ===================================================================
   STAGIONI, GIORNI, TEMPO
   =================================================================== */
'Primavera': 'Spring',
'Estate': 'Summer',
'Autunno': 'Autumn',
'Inverno': 'Winter',

'Lunedì': 'Monday',
'Martedì': 'Tuesday',
'Mercoledì': 'Wednesday',
'Giovedì': 'Thursday',
'Venerdì': 'Friday',
'Sabato': 'Saturday',
'Domenica': 'Sunday',

'Sereno': 'Clear',
'Nuvoloso': 'Cloudy',
'Pioggia': 'Rain',
'Temporale': 'Storm',
'Neve': 'Snow',
'Ventoso': 'Windy',

/* ===================================================================
   ABILITÀ
   =================================================================== */
'Agricoltura': 'Farming',
'Raccolta': 'Foraging',
'Estrazione': 'Mining',
'Pesca': 'Fishing',
'Caccia': 'Hunting',

'I raccolti valgono di più.': 'Your harvests are worth more.',
'Più legna, più fibra, più fortuna nel bosco.': 'More wood, more fibre, more luck in the woods.',
'Le rocce cedono più in fretta.': 'Rocks give way faster.',
'La barra si allarga, i pesci si stancano.': 'The bar grows taller, the fish tire sooner.',
'Le prede si accorgono di te più tardi, e rendono di più.': 'Game notices you later, and gives you more.',

/* ===================================================================
   COSTRUZIONI E MIGLIORIE
   =================================================================== */
'Pollaio': 'Coop',
'Tre galline ci staranno comode. Uova ogni mattina.': 'Three hens will be comfortable in there. Eggs every morning.',
'Serra': 'Greenhouse',
'Dentro è sempre estate: coltiva in ogni stagione.': 'Inside it is always summer: grow in any season.',
'Silo': 'Silo',
'Aumenta lo spazio dell\'inventario di {0} caselle.': 'Adds {0} slots to your backpack.',
'Ponte del Bosco': 'Woodland Bridge',
'Apre il sentiero verso la Radura degli Spiriti.': 'Opens the path to the Spirits\' Clearing.',
'Ampliamento Casa': 'House Extension',
'Una cucina vera, e più spazio per vivere.': 'A proper kitchen, and more room to live in.',

'Semplice': 'Plain',
'di Rame': 'Copper',
'di Ferro': 'Iron',
'd\'Oro': 'Gold',

/* ===================================================================
   MESTIERI DEGLI ABITANTI
   I nomi propri restano: Bruno è Bruno anche in inglese.
   =================================================================== */
'Bottegaio': 'Shopkeeper',
'Erborista': 'Herbalist',
'Fabbro e Carpentiere': 'Smith and Carpenter',
'Locandiera': 'Innkeeper',
'Pescatore': 'Fisherman',
'Eremita del Passo': 'Hermit of the Pass',
'Spirito del Santuario': 'Spirit of the Shrine'

};

/* ===================================================================
   DESCRIZIONI DEGLI OGGETTI
   Sono righe corte e asciutte, spesso senza verbo: in italiano suonano
   come l'etichetta scritta a mano su un barattolo. In inglese si tiene
   quel registro, non la grammatica completa — «Solida e grigia», non
   «It is solid and grey».
   =================================================================== */
Object.assign(window.LINGUA_EN, {

'Dissoda la terra per seminare.': 'Breaks the soil for sowing.',
'Bagna il terreno arato.': 'Waters tilled ground.',
'Abbatte alberi e ceppi.': 'Fells trees and stumps.',
'Frantuma sassi e vene di minerale.': 'Shatters rocks and ore veins.',
'Taglia erbacce e sterpaglia.': 'Cuts weeds and brush.',
'Per le acque calme della valle.': 'For the still waters of the valley.',
'Corno e tendine. Te lo insegna Oreste, sul Passo.': 'Antler and sinew. Oreste teaches you, up on the Pass.',

'Utile per costruire quasi tutto.': 'Useful for building almost anything.',
'Solida e grigia.': 'Solid and grey.',
"Filamenti d'erba secca.": 'Threads of dry grass.',
'Morbida, si trova zappando.': 'Soft, turned up by the hoe.',
'Brucia a lungo e caldo.': 'Burns long and hot.',
'Dolce resina degli alberi.': 'Sweet resin of the trees.',
'Da appendere al fresco. Oreste dice di non sprecarne niente.': 'To hang somewhere cool. Oreste says waste none of it.',
'Conciata dura una vita. Tobia la usa per le impugnature.': 'Tanned, it lasts a lifetime. Tobia uses it for grips.',
"Il cervo lo perde ogni anno da solo: prenderlo così è un'altra cosa.": 'The stag sheds one every year by itself: taking it this way is another matter.',
'Ancora tiepido.': 'Still warm.',
'Le galline felici fanno miracoli.': 'Happy hens work miracles.',
'Denso, profumato di fiori.': 'Thick, and scented with flowers.',
'Cremoso e fresco. Bruno lo prende dalla cascina di là dal colle.': 'Creamy and cool. Bruno gets it from the farm over the hill.',

'Rossastro.': 'Reddish.',
'Pesante e scuro.': 'Heavy and dark.',
'Luccica anche al buio.': 'It gleams even in the dark.',
'Fuso nella fornace.': 'Smelted in the furnace.',
'Pronto per il fabbro.': 'Ready for the smith.',
'Caldo di riflessi.': 'Warm with reflections.',
'Trasparente, freddo.': 'Clear, and cold.',
'Viola profondo.': 'Deep violet.',
'Pulsa piano, come un respiro.': 'It pulses slowly, like breathing.',
"Chissà cosa c'è dentro.": 'Who knows what is inside.',

'Pungente e sincera.': 'Sharp, and honest about it.',
'Un desiderio per soffio.': 'One wish per breath.',
"Cresce all'ombra.": 'It grows in the shade.',
'Macchia le dita.': 'It stains your fingers.',
'Sa di miele e sole.': 'It tastes of honey and sunlight.',
'Profuma il cassetto.': 'It scents the drawer.',
'Il re del sottobosco.': 'The king of the undergrowth.',
'Gli scoiattoli ti guardano male.': 'The squirrels are giving you a look.',
'Cento rubini dentro.': 'A hundred rubies inside.',
'Rossa sulla neve.': 'Red against the snow.',
'Croccante di brina.': 'Crisp with frost.',
'Non si scioglie mai.': 'It never melts.',

'Migliora la qualità del raccolto.': 'Improves the quality of your harvest.',
'Il terreno resta bagnato la notte.': 'The soil stays damp overnight.',
'Tiene lontani i corvi nel raggio di 6 caselle.': 'Keeps crows away within 6 tiles.',
"Cammini più veloce e l'erba non ricresce.": 'You walk faster, and the grass stays down.',
'Delimita con garbo, e si aggancia da sé ai pezzi vicini. Non ci si passa attraverso: per quello serve un cancelletto. Per toglierla, una picconata.': 'Marks a boundary politely, and joins itself to its neighbours. You cannot walk through it: that is what a gate is for. To take it back, one swing of the pickaxe.',
'Il varco di una staccionata. Tu passi, le bestie no. Per toglierlo, una picconata.': 'The way through a fence. You pass, the animals do not. To take it back, one swing of the pickaxe.',
'Illumina la notte intorno a sé.': 'It lights the night around it.',
'Deposito da 24 caselle.': 'Storage for 24 slots.',
'Trasforma un raccolto in conserva (valore x2 + 50).': 'Turns a crop into preserves (value x2 + 50).',
'Frutta → vino, verdura → succo (valore x3).': 'Fruit → wine, vegetables → juice (value x3).',
'Cucina i piatti che ridanno energia.': 'Cooks the dishes that give energy back.',
'Minerale + carbone → lingotto.': 'Ore + coal → bar.',
'Produce miele ogni 4 giorni.': 'Produces honey every 4 days.',
"Una piccola notte d'estate in tasca.": 'A small summer night, in your pocket.',

'Scalda anche i pensieri.': 'It warms your thoughts, too.',
'Cotto piano tutto il pomeriggio. La ricetta è di Oreste, e non prevede fretta.': 'Cooked slowly all afternoon. The recipe is Oreste\'s, and it does not allow for hurry.',
'Semplice, perfetta.': 'Simple. Perfect.',
'Croccante di rugiada.': 'Crisp with dew.',
'La ricetta di Nonna Ilde.': 'Granny Ilde\'s recipe.',
'Il bordo è la parte migliore.': 'The crust is the best part.',
'Gira, gira, gira.': 'Stir, and stir, and stir.',
'Con un rametto di lavanda.': 'With a sprig of lavender.',
"Merenda dell'infanzia.": 'The taste of being small.',
'Sa di bosco dopo la pioggia.': 'It tastes of woodland after rain.',

'Un tepore verde tra le mani.': 'A green warmth in your hands.',
'Scotta appena, come un ricordo.': 'Barely hot, the way a memory is.',
'Odora di foglie e fumo.': 'It smells of leaves and smoke.',
'Fredda fuori, viva dentro.': 'Cold outside, alive within.',
'Sul retro: "torna quando la valle chiama".': 'On the back: "come back when the valley calls".',
"Ferro battuto, con la spirale. Tobia l'ha finito il giorno prima del solstizio e non l'ha consegnato per dodici anni.": 'Wrought iron, with the spiral. Tobia finished it the day before the solstice and did not deliver it for twelve years.',
'Ha già deciso come si chiama.': 'She has already decided what her name is.',

'Coltivato con le tue mani.': 'Grown with your own hands.',
'Sembra fatto di luce.': 'It seems to be made of light.',
'Si piantano in Primavera.': 'Sown in Spring.',
'Si piantano in Estate.': 'Sown in Summer.',
'Si piantano in Autunno.': 'Sown in Autumn.',
'Si piantano in Inverno.': 'Sown in Winter.',
'Si piantano in Estate e Autunno.': 'Sown in Summer and Autumn.'

});

/* ===================================================================
   MESSAGGI DI SISTEMA — quello che il gioco ti dice mentre giochi
   Molti arrivano da concatenazioni: «Serve più confidenza: » + numero +
   « cuori con » + nome. Sono spezzoni, e si traducono come tali —
   funziona perché in queste frasi italiano e inglese mettono le parole
   nello stesso ordine. Dove non succedesse, il modello con segnaposto
   di lingua.js è la via d'uscita.
   =================================================================== */
Object.assign(window.LINGUA_EN, {

/* --- attrezzi, terra, rifiuti --- */
'Non hai niente in mano: scegli un oggetto dalla barra in basso (tasti 1-9).': 'Your hands are empty: pick something from the bar at the bottom (keys 1-9).',
"L'acqua è gelata: oggi non si annaffia.": 'The water is frozen: no watering today.',
'Questa terra è già bagnata. Domani avrà di nuovo sete.': 'This ground is already watered. It will be thirsty again tomorrow.',
'Lo zaino è pieno: prima fai posto.': 'Your backpack is full: make room first.',
'Il piccone rompe sassi e rocce, e toglie le cose che hai posato. Sul terreno arato invece lo ripulisce.': 'The pickaxe breaks stones and rocks, and takes back what you have put down. On tilled soil it clears it instead.',
'La falce taglia erbacce, fiori e cespugli.': 'The scythe cuts weeds, flowers and bushes.',
'I semi vanno sulla terra dissodata: prima passa la zappa.': 'Seeds go on tilled soil: use the hoe first.',
'Qui sta già crescendo qualcosa.': 'Something is already growing here.',
'Non è la stagione giusta per': 'This is not the season for',
'Il concime va sulla terra dissodata.': 'Fertiliser goes on tilled soil.',
'Questa terra è già stata concimata.': 'This ground has already been fertilised.',
'Terreno migliorato.': 'Soil improved.',
'Sei troppo stanco. Mangia qualcosa o vai a dormire.': 'You are too tired. Eat something, or go to bed.',
'Zaino pieno!': 'Backpack full!',
'Zaino pieno.': 'Backpack full.',
'Zaino pieno: qualcosa è rimasto lì.': 'Backpack full: some of it stayed where it was.',
'Non si mangia.': 'Not edible.',
'Meglio tenerlo.': 'Better keep it.',
'Argilla!': 'Clay!',
"Linfa d'acero!": 'Maple sap!',
'Gemma di Luna!': 'Moonstone!',
'Un corvo ti ha beccato': 'A crow got you',

/* --- posare e spostare --- */
"Scegli dove metterlo. Esc per rimetterlo dov'era.": 'Choose where to put it. Esc to leave it where it was.',
"Rimesso dov'era.": 'Put back where it was.',
'Qui non ci sta: serve una casella libera, senza acqua e senza terra dissodata.': 'It will not fit here: you need a clear tile, with no water and no tilled soil.',

/* --- luoghi e arredi --- */
'Il letto': 'The bed',
"Il focolare c'è, ma serve una cucina vera: chiedi a Tobia l'ampliamento.": 'There is a hearth, but you need a proper kitchen: ask Tobia about the extension.',
'Il fuoco scoppietta piano. Fa un bell’effetto, stare qui.': 'The fire crackles quietly. It is rather nice, standing here.',
'Il fuoco scoppietta piano. Fa un bell\'effetto, stare qui.': 'The fire crackles quietly. It is rather nice, standing here.',
'Un tavolo di legno, segnato da anni di piatti.': 'A wooden table, marked by years of plates.',
'Il banco è chiuso: il mercante non è in paese oggi.': 'The stall is shut: the pedlar is not in the village today.',
'Fa il suo lavoro in silenzio.': 'It does its work in silence.',
'Rune consumate dal tempo. Sembrano aspettare qualcosa.': 'Runes worn down by time. They seem to be waiting for something.',
"La serra è calda e umida. Qui puoi coltivare tutto l'anno.": 'The greenhouse is warm and damp. You can grow here all year round.',
'È chiuso.': 'It is shut.',
'Le galline sono felici.': 'The hens are happy.',
'Locanda del Tasso Storto': 'The Crooked Badger Inn',
'Cassa di consegna': 'Shipping Bin',
'La Lanterna del Solstizio': 'The Solstice Lantern',
'Ricominciare da capo?': 'Start over?',

/* --- caccia e pesca --- */
'Hai un arco ma non sai ancora cosa farne. Oreste, sul Passo, insegna.': 'You have a bow but you do not yet know what to do with it. Oreste, up on the Pass, teaches.',
'Niente da tirare, qui davanti. La selvaggina sta nel bosco, e sente da lontano.': 'Nothing to shoot at, straight ahead. Game keeps to the woods, and hears you coming.',
'La freccia passa alta. Sono già lontani.': 'The arrow goes high. They are already gone.',
"L'acqua è gelata: niente pesca oggi.": 'The water is frozen: no fishing today.',
'Abbocca! Premi <kbd>Spazio</kbd>': 'A bite! Press <kbd>Space</kbd>',
'Hai preso:': 'You caught:',
'Il Pesce Luna! Corri a mostrarlo a Elio.': 'The Moonfish! Run and show Elio.',
"Se n'è andato.": 'It got away.',
'Ti è scappato.': 'You lost it.',
'Hai mollato la lenza.': 'You let go of the line.',

/* --- macchine --- */
'Serve del carbone.': 'You need coal.',
'In lavorazione…': 'Working…',

/* --- giornata, meteo, eventi --- */
"📬 C'è posta per te: una lettera da": '📬 There is post for you: a letter from',
'Ti sei svegliato dolorante. Qualcuno ti ha riportato a casa (−': 'You woke up aching. Somebody carried you home (−',
'È arrivata la': 'It is',
'Gelata forte: fiume e pozzo sono ghiacciati per oggi.': 'Hard frost: the river and the well are frozen for the day.',
'Mercato di oggi:': 'Today at market:',
'📋 Nuove richieste degli abitanti: guarda il Diario (J).': '📋 New requests from the villagers: check the Journal (J).',
'🎪 È tempo della': '🎪 It is time for the',
'🛒 Il mercante ambulante è in paese, oggi alla Locanda.': '🛒 The travelling pedlar is in the village, at the Inn today.',
'🎂 Oggi è il compleanno di': '🎂 Today is the birthday of',
'🎪 Oggi è il giorno della': '🎪 Today is the day of the',

/* --- porte chiuse --- */
"La porta è socchiusa, ma Serafina è fuori, nell'orto.": 'The door is ajar, but Serafina is outside, in the garden.',
"La porta di legno è chiusa. L'eremita sarà fuori, da qualche parte sulla neve.": 'The wooden door is shut. The hermit will be out somewhere in the snow.',
'Il ponte è in piedi. Tobia lavora bene quando lo si paga.': 'The bridge is standing. Tobia does good work when he is paid for it.',
'Lo trovi sul burrone, nel bosco a est: scavalcalo e sei nella radura. Vacci di giorno, la prima volta.': 'You will find it at the ravine, in the woods to the east: cross it and you are in the clearing. Go by day, the first time.',

/* --- Serafina, il primo incontro --- */
"Ti ho visto arrivare l'altro ieri. Non ti ho salutato perché stavo parlando con un rovo.": 'I saw you arrive the day before yesterday. I did not say hello because I was talking to a bramble.',
'Sono Serafina. Sto nel bosco, a sud del tuo campo.': 'I am Serafina. I live in the woods, south of your field.',
'Ilde ti ha lasciato più di un podere, sai. Quando vorrai saperne di più, passa.': 'Ilde left you more than a farm, you know. When you want to know more, come by.',

/* --- le scelte nei dialoghi --- */
'✦ Quella notte, dodici anni fa': '✦ That night, twelve years ago',
'🕯️ Vieni alla veglia al Santuario': '🕯️ Come to the vigil at the Shrine',
'🛒 Vorrei comprare qualcosa': '🛒 I would like to buy something',
'🔨 Parliamo di attrezzi': '🔨 Let us talk about tools',
'💛 La torta di Ilde': "💛 Ilde's cake",
'💛 Mi parli di Nonna Ilde?': '💛 Will you tell me about Granny Ilde?',
"🍲 Cosa c'è di buono?": '🍲 What is good today?',
'📖 Insegnami una ricetta': '📖 Teach me a recipe',
'💛 Il segreto della torta di Ilde': "💛 The secret of Ilde's cake",
'🌿 Parlami della valle': '🌿 Tell me about the valley',
'🌙 Il Pesce Luna': '🌙 The Moonfish',
'🌙 Parlami del Pesce Luna': '🌙 Tell me about the Moonfish',
'🎣 Consigli sulla pesca?': '🎣 Any fishing advice?',
"🏹 Cos'è quell'arco?": '🏹 What is that bow?',
'🏹 Sono qui per la lezione': '🏹 I am here for the lesson',
'🏹 Parlami di caccia': '🏹 Tell me about hunting',
'✦ Il santuario': '✦ The shrine',
'🎁 Ho un regalo per te': '🎁 I have something for you',
'Ci vediamo!': 'See you around!',
'🏹 Insegnami': '🏹 Teach me',
"Un'altra volta": 'Another time',
'Va bene': 'All right',

/* --- guida e traguardi --- */
'Guida nascosta. La riapri dal menu (Esc).': 'Guide hidden. You can bring it back from the menu (Esc).',
'Primi passi completati: sai muoverti a Fioralba. Da qui in poi guarda il Diario (J).': 'First steps done: you know your way around Fioralba. From here on, check the Journal (J).',
'Passa la prima notte': 'Get through the first night',
'Raccogli il primo prodotto': 'Harvest your first crop',
'Vendi quello che hai raccolto': 'Sell what you have harvested',
'Vai in paese': 'Go into the village',
'Abbatti un albero': 'Fell a tree',
'Fai un regalo a un abitante': 'Give a villager a gift',
'Prendi il primo pesce': 'Catch your first fish',
'Esplora il bosco': 'Explore the woods',
'Scendi nella miniera': 'Go down into the mine',
'Fatti costruire il ponte del bosco': 'Have the woodland bridge built',
'Accendi la prima brace': 'Light the first ember',
'Accendi tutte e quattro le braci': 'Light all four embers',
'Scopri perché la Lanterna si è spenta': 'Find out why the Lantern went out',
'La veglia al Santuario': 'The vigil at the Shrine',
'Traguardo compiuto:': 'Milestone reached:',

/* --- livelli --- */
'Premi ritirati.': 'Rewards collected.',
"Zaino pieno: non c'è posto per i premi.": 'Backpack full: no room for the rewards.',
'Livello raggiunto': 'Level up',
'Premio': 'Reward',
'Premio speciale': 'Special reward',
'Continua': 'Continue',
'Ritira': 'Collect',
'Livelli raggiunti': 'Levels earned',
'livello massimo': 'top level',
'si fida di più': 'trusts you more',

/* --- salvataggio --- */
"Non c'è nessuna partita da esportare.": 'There is no game to export.',
'Questo salvataggio è incompleto, meglio non esportarlo:': 'This save is incomplete, better not to export it:',
'Salvataggio importato! Riavvio…': 'Save imported! Restarting…',
'Non riesco a leggere il file.': 'I cannot read the file.',
'Salvataggio principale corrotto: ripristinato il backup.': 'Main save corrupted: the backup has been restored.',
'Salvataggio esportato.': 'Save exported.',

/* --- atto secondo, i pezzi cuciti --- */
'Serve più confidenza:': 'You need to know them better:',
'Memoria raccolta (': 'Memory gathered (',
'Invita i sei abitanti alla veglia al Santuario.': 'Invite the six villagers to the vigil at the Shrine.',
'Hanno detto di sì in': 'Said yes so far:',
'Ci sono tutti. La veglia è domani sera al Santuario, dal tramonto.': 'Everyone is coming. The vigil is tomorrow evening at the Shrine, from sundown.',
'La Lanterna è accesa, ma non tiene. Fiammella ha qualcosa da dirti.': 'The Lantern is lit, but it will not hold. Fiammella has something to tell you.',
'Nuova storia: la notte del solstizio. Parla con i sei abitanti.': 'New story: the night of the solstice. Talk to the six villagers.',
'Sei a': 'You are at',
'Ne mancano': 'You are still missing',
'. Vai avanti: quando ci sono tutte capisci da solo.': '. Keep going: when you have them all, you will work it out yourself.',
'. Vai a chiamarli: non comincio senza.': '. Go and call them: I am not starting without them.',

/* --- storie --- */
'Hai imparato: <b>Caccia</b>': 'You have learnt: <b>Hunting</b>',
'Lezione di caccia:': 'Hunting lesson:',
'Ricetta imparata:': 'Recipe learnt:',
'Nuova storia: La torta di Nonna Ilde.': "New story: Granny Ilde's cake.",
'Hai scoperto il segreto della torta di Ilde.': "You have found out the secret of Ilde's cake.",
'La torta di Nonna Ilde è pronta.': "Granny Ilde's cake is ready.",

/* --- prompt contestuali --- */
'<kbd>E</kbd> parla con': '<kbd>E</kbd> talk to',
'<kbd>E</kbd> accarezza': '<kbd>E</kbd> stroke',
'il gatto': 'the cat',
'Cenere': 'Ash',

/* --- il gatto --- */
'Si lascia sfiorare la schiena, poi si sposta di un passo.': 'She lets you brush her back, then moves one step away.',
'Ti annusa la mano e decide che va bene così.': 'She sniffs your hand and decides that will do.',
'Resta fermo giusto il tempo di farsi toccare.': 'She holds still just long enough to be touched.',
'Fa le fusa un momento, poi finge di non averlo fatto.': 'She purrs for a moment, then pretends she did not.',
'Si struscia contro lo stivale e se ne va soddisfatto.': 'She rubs against your boot and walks off satisfied.',
'Fa le fusa forte. Non si sposta.': 'She purrs loudly. She does not move.',
'Si rotola sulla schiena e ti guarda a testa in giù.': 'She rolls onto her back and looks at you upside down.',
'Ti viene incontro prima ancora che ti fermi.': 'She comes to meet you before you have even stopped.',
'Fa le fusa appoggiandoti la testa sulla gamba.': 'She purrs with her head against your leg.',
'Ti cammina fra i piedi come se il podere fosse suo. E in fondo lo è.': 'She walks between your feet as if the farm were hers. Which, after all, it is.',
'Si accuccia accanto a te e chiude gli occhi.': 'She settles down beside you and closes her eyes.',
'ne ha avuto abbastanza, per oggi.': 'has had enough for today.',
'Il gatto': 'The cat'

});

/* ===================================================================
   NOMI CHE SI COMPONGONO
   Qui l'ordine delle parole si ribalta: in italiano il contenitore sta
   davanti, in inglese dietro. Il segnaposto {0} è il nome del frutto.
   =================================================================== */
Object.assign(window.LINGUA_EN, {
'Conserva di {0}': '{0} Preserves',
'Vino di {0}': '{0} Wine',
'Distillato di {0}': '{0} Spirit',
'Succo di {0}': '{0} Juice',

/* titoli delle finestre */
'Diario': 'Journal',
'Menu': 'Menu',
'Zaino': 'Backpack',
'Artigianato': 'Crafting',
'Mappa': 'Map',
'Bottega': 'Shop',
'Fucina': 'Forge',
'Cucina': 'Kitchen',
'Santuario': 'Shrine',
'Pollaio': 'Coop',
'Come si gioca': 'How to play',
'Audio': 'Audio',
'Lingua': 'Language',
'Guida': 'Guide',
'Musica': 'Music',
'Effetti': 'Sound',
'Obiettivi': 'Goals',
'Livelli': 'Levels',
'Richieste': 'Requests',
'Collezione': 'Collection',
'Abitanti': 'Villagers',
'Lettere': 'Letters',
'Podere': 'Farm',
'Abilità': 'Skills',
'Il podere in numeri': 'The farm in numbers',
'Monete': 'Coins',
'Energia': 'Energy',
'Primi passi': 'First steps'
});

/* ===================================================================
   LE VOCI DEGLI ABITANTI
   Qui la fedeltà alla lettera conta meno della fedeltà al carattere.
   Bruno taglia corto e non spreca parole; Serafina parla per immagini e
   non spiega mai del tutto; Tobia dice le cose come si dicono in
   officina; Marisol sa tutto e lo dice mentre fa altro; Elio è un
   ragazzo entusiasta; Oreste parla per sentenze, poche e definitive;
   Fiammella è antica e stanca.

   Dove l'italiano fa una battuta che in inglese non esiste, si è
   cercata la battuta equivalente, non la traduzione della battuta.
   =================================================================== */
Object.assign(window.LINGUA_EN, {

/* --- BRUNO, bottegaio --- */
"La bottega apre all'alba e chiude quando ho fame. Quindi presto.": 'The shop opens at dawn and closes when I get hungry. So, early.',
'Tua nonna comprava sempre due sacchetti di semi. Uno lo regalava.': 'Your grandmother always bought two bags of seed. One of them she gave away.',
"Se ti serve qualcosa e non ce l'ho... probabilmente non ti serviva.": 'If you need something and I have not got it… you probably did not need it.',
'Ho ordinato tre casse di semi di zucca. Ne sono arrivate trenta. Aiutami.': 'I ordered three crates of pumpkin seed. Thirty arrived. Help me.',
'Il tempo cambia. Il prezzo dei semi no. Per fortuna.': 'The weather changes. The price of seed does not. Thankfully.',
'Sai che quando sei arrivato dicevo che non saresti durato un mese? Mi hai fatto perdere una scommessa con Marisol. Ne è valsa la pena.': 'You know when you arrived I said you would not last a month? You made me lose a bet with Marisol. It was worth it.',
'Ti ho messo da parte i semi migliori. Non dirlo agli altri. Non che ci sia una fila, eh.': 'I have put the best seed aside for you. Do not tell the others. Not that there is a queue, mind.',

/* --- SERAFINA, erborista --- */
'Il bosco ti ha già annusato. Ora deve decidere.': 'The woods have had a smell of you already. Now they have to decide.',
'Le viole crescono dove qualcuno è stato triste a lungo. Non è tristezza: è memoria.': 'Violets grow where somebody was sad for a long time. It is not sadness: it is memory.',
'Ilde veniva qui ogni solstizio. Portava una torta e non spiegava mai perché.': 'Ilde came here every solstice. She brought a cake and never once explained why.',
"Non raccogliere mai l'ultimo fungo di una radura. Lascia sempre il seme del ritorno.": 'Never take the last mushroom in a clearing. Always leave the seed of its coming back.',
"Ho sognato una lanterna accesa. Poi mi sono svegliata e c'eri tu che zappavi.": 'I dreamt of a lantern, lit. Then I woke up and there you were, hoeing.',
"La valle respira meglio da quando sei qui. Non è poesia: è che l'aria sa di terra smossa.": 'The valley breathes easier since you came. That is not poetry: the air tastes of turned earth.',
'Ilde sarebbe insopportabile, adesso. Direbbe "te l\'avevo detto" per sei mesi.': 'Ilde would be unbearable now. She would say "I told you so" for six months.',

/* --- TOBIA, fabbro --- */
'Portami lingotti e ti restituisco attrezzi che non ti tradiscono.': 'Bring me bars and I will give you back tools that will not let you down.',
'Il ferro va scaldato, non convinto.': 'Iron wants heating, not persuading.',
'Ho costruito il tetto della casa di tua nonna. Regge ancora. Come vedi.': 'I built the roof on your grandmother\'s house. It is still up. As you can see.',
'La miniera è vecchia quanto la valle. Vai piano nei livelli bassi.': 'The mine is as old as the valley. Go slowly on the lower levels.',
'Legno buono, misure giuste, pazienza. Il resto è decorazione.': 'Good wood, right measurements, patience. The rest is decoration.',
'Se ti serve una mano al podere, chiedi. Porto gli attrezzi miei, che sono migliori.': 'If you want a hand at the farm, ask. I will bring my own tools, which are better.',
'Ilde mi pagò una volta con una torta. La torta valeva più del lavoro.': 'Ilde once paid me with a cake. The cake was worth more than the job.',

/* --- MARISOL, locandiera --- */
"Alla Locanda del Tasso Storto si mangia e si ascolta. In quest'ordine.": 'At the Crooked Badger you eat and you listen. In that order.',
'Ti insegno una ricetta se mi porti qualcosa che non ho mai cucinato.': 'I will teach you a recipe if you bring me something I have never cooked.',
'La zuppa di Ilde aveva un ingrediente segreto. Era il tempo. Cuoceva tre ore.': 'Ilde\'s soup had a secret ingredient. It was time. Three hours on the stove.',
'Elio passa a rubare focacce. Faccio finta di non vederlo.': 'Elio comes by to steal flatbread. I pretend not to see him.',
'Quando piove la locanda si riempie. Adoro la pioggia, professionalmente.': 'When it rains the inn fills up. I love rain, professionally speaking.',
'Ho messo il tuo nome sul tavolo vicino al camino. È ufficialmente tuo.': 'I have put your name on the table by the fire. It is officially yours.',
'Un giorno cucineremo insieme la torta di Ilde. Ho quasi tutti i pezzi della ricetta.': 'One day we will make Ilde\'s cake together. I have nearly all the pieces of the recipe.',

/* --- ELIO, pescatore --- */
'Oggi ho preso una scarpa. Ieri due. Sto costruendo un paio.': 'Today I caught a boot. Yesterday, two. I am building a pair.',
"Il Pesce Luna esiste. L'ho visto. Aveva gli occhi come piattini.": 'The Moonfish is real. I have seen it. Eyes like saucers.',
'Se tiri la lenza troppo forte scappa. Se molli, scappa. Bisogna respirare.': 'Pull too hard and it runs. Let go and it runs. You have to breathe.',
"Al molo di notte l'acqua fa un rumore diverso. Più profondo.": 'At the jetty at night the water sounds different. Deeper.',
'Quando prenderò lo storione lo appendo in camera. Mia madre dice di no.': 'When I catch the sturgeon I am hanging it in my room. My mother says no.',
'Ti ho tenuto il posto buono al molo. Quello dove abbocca sempre.': 'I have kept the good spot on the jetty for you. The one where they always bite.',
'Sei l\'unico che mi crede sul Pesce Luna. Grazie.': 'You are the only one who believes me about the Moonfish. Thank you.',

/* --- ORESTE, eremita --- */
'Sono salito quassù per stare solo. Poi è arrivato il silenzio e mi ha tenuto compagnia.': 'I came up here to be alone. Then the silence arrived and kept me company.',
'La neve non nasconde le cose. Le mette a riposo.': 'Snow does not hide things. It puts them to rest.',
'Ilde saliva fin qui ogni inverno, con una fetta di torta. Non parlava. Guardava e basta.': 'Ilde climbed all the way up here every winter, with a slice of cake. She did not talk. She just looked.',
'Il ghiaccio del laghetto regge, se sai dove mettere i piedi. Io lo so. Tu impara.': 'The ice on the pond will hold, if you know where to put your feet. I know. You: learn.',
'Giù in miniera scavano. Io ascolto la montagna: è un altro modo di scavare.': 'Down in the mine they dig. I listen to the mountain: that is another way of digging.',
'Non offro molto: un fuoco, del silenzio e qualche pietra rara che il gelo spinge in superficie. Ma è tuo, quando vuoi.': 'I do not offer much: a fire, some silence, and the odd rare stone the frost pushes up. But it is yours, whenever you want it.',
"Da quassù vedo la lanterna della valle. Da quando l'hai riaccesa, dormo meglio.": 'From up here I can see the valley\'s lantern. Since you lit it again, I sleep better.',

/* --- FIAMMELLA, spirito --- */
'Dodici inverni al buio. Cominciavo a dimenticare il mio colore.': 'Twelve winters in the dark. I was beginning to forget my own colour.',
'Non sono io la Lanterna. Io sono solo quello che resta quando si spegne.': 'I am not the Lantern. I am only what is left when it goes out.',
'Porta i frutti delle quattro stagioni. La valle si ricorderà da sola.': 'Bring the fruits of the four seasons. The valley will remember by itself.',
'Ilde parlava tanto. Mi mancava anche quello.': 'Ilde talked a great deal. I missed that too.',
'Sei diventato parte della valle. Anche se vai via, resti nel modo in cui cresce l\'erba.': 'You have become part of the valley. Even if you leave, you stay in the way the grass grows.',

/* ===================================================================
   L'ATTO SECONDO — Fiammella, la verità, la veglia
   =================================================================== */
'Di quella notte non mi va di parlare.': 'I would rather not talk about that night.',
'Non con chiunque, almeno. Torna quando ci conosciamo meglio.': 'Not with just anybody. Come back when we know each other better.',
'Lo sai. Te lo leggo addosso.': 'You know. I can see it on you.',
'Io no. Io quella notte ero la fiamma: quando le mani si sono chiuse sono finita anch\'io, e di quello che è successo dopo non ho niente.': 'I do not. That night I was the flame: when the hands closed I went out with it, and of what happened afterwards I have nothing.',
'Dodici anni a chiedermi cosa avevo fatto di male.': 'Twelve years wondering what I had done wrong.',
'Niente. Non avevo fatto niente. È stata la brutta notte di una donna sola, ed è bastata.': 'Nothing. I had done nothing. It was one bad night for a woman on her own, and that was enough.',
"C'era una lettera nel cassetto della cucina, sotto la carta. Serafina l'ha tenuta lì tutto questo tempo. Leggila.": 'There was a letter in the kitchen drawer, under the lining paper. Serafina kept it there all this time. Read it.',
'Ha scritto «chiama gente». Dodici anni per due parole.': 'She wrote "call people". Twelve years for two words.',
'Ma ha ragione, e adesso lo so anch\'io: questa lanterna l\'ha tenuta accesa una persona sola per quarant\'anni, e si è spenta la prima notte che quella persona non ce l\'ha fatta.': 'But she is right, and now I know it too: one person kept this lantern lit for forty years, and it went out the first night that person could not manage.',
'Non voglio che si spenga la prima notte che non ce la fai tu.': 'I do not want it going out the first night you cannot manage.',
"Vai a chiamarli. Tutti e sei. Di' che li aspetto qui.": 'Go and call them. All six. Say I am waiting here.',
'E se qualcuno ti chiede perché — digli che è per Ilde. Funziona.': 'And if anybody asks you why — tell them it is for Ilde. That works.',
'Sono venuti tutti e sei. Non era mai successo, nemmeno quando era accesa.': 'All six came. That had never happened, not even when it was lit.',
'Bruno ha appoggiato un quaderno sulla pietra e ha strappato una pagina.': 'Bruno set a ledger down on the stone and tore out a page.',
'Tobia ha cambiato il gancio senza chiedere il permesso a nessuno. Dice che quello vecchio era storto — lo diceva anche dodici anni fa.': 'Tobia changed the hook without asking anybody\'s permission. He says the old one was crooked — he was saying that twelve years ago too.',
'Serafina è arrivata per ultima e si è fermata dove si era fermata quella notte. Poi ha fatto altri due passi.': 'Serafina came last and stopped where she had stopped that night. Then she took two more steps.',
'Accendila tu. Io non sono la Lanterna: sono solo quello che resta quando si spegne.': 'You light it. I am not the Lantern: I am only what is left when it goes out.',
'E stasera non serve che resti niente.': 'And tonight nothing needs to be left over.',
'È accesa. Quattro braci, quattro nicchie, e la valle si è ricordata.': 'It is lit. Four embers, four niches, and the valley has remembered.',
'Solo che non tiene.': 'Except that it will not hold.',
'Guarda: fa quella cosa lì. Si abbassa e risale. Da accesa vera non lo faceva.': 'Look: it does that thing. Dips, and comes back. It never did that when it was properly lit.',
'Manca qualcosa, e la cosa peggiore è che non so cosa — perché non ho mai saputo nemmeno perché si sia spenta.': 'Something is missing, and the worst of it is that I do not know what — because I never knew why it went out either.',
'Ero io la fiamma. Quando è finita sono finita anch\'io, e di quella notte non ho niente: né prima né dopo.': 'I was the flame. When it ended I ended with it, and of that night I have nothing: not before, not after.',
'Ma la valle sì. La valle era sveglia, e sei persone quella notte erano da qualche parte a guardare.': 'But the valley does. The valley was awake, and six people were somewhere that night, watching.',
'Vai a chiedere. A tutti e sei. Poi torna e dimmi cosa hai capito.': 'Go and ask. All six of them. Then come back and tell me what you have understood.',
'Oh. Sei venuto davvero.': 'Oh. You actually came.',
'Dodici inverni che questa lanterna è spenta. Cominciavo a credere di essermela sognata, la luce.': 'Twelve winters this lantern has been out. I was beginning to think I had dreamt the light.',
'Non posso riaccenderla da sola. Serve che qualcuno raccolga la valle e me la porti qui, un pezzo per stagione.': 'I cannot light it again on my own. Somebody has to gather the valley and bring it to me here, one piece per season.',
'Ilde lo faceva. Poi ha smesso di riuscirci.': 'Ilde used to. Then she stopped being able to.',
'Quattro braci. Quattro nicchie. Prenditi il tempo che ti serve: io non vado da nessuna parte.': 'Four embers. Four niches. Take all the time you need: I am not going anywhere.',

/* --- i titoli delle sei memorie --- */
'Il registro di Bruno': "Bruno's ledger",
"Il tavolo d'angolo": 'The corner table',
'Quello che ha visto Elio': 'What Elio saw',
'Quello che Tobia non ha consegnato': 'What Tobia never delivered',
'Quello che si vede dal Passo': 'What you can see from the Pass',
'Quello che Serafina è salita a dire': 'What Serafina climbed up to say',

/* --- i titoli delle lettere --- */
'La prima lettera': 'The first letter',
'Sul paese': 'About the village',
'Su Serafina': 'About Serafina',
'Sul buio': 'About the dark',
'Sul primo raccolto': 'About the first harvest',
'Sul cambio di stagione': 'About the turning season',
'Tre acque': 'Three waters',
'Castagno, non abete': 'Chestnut, not fir',
'La lettera che non ha spedito': 'The letter she never sent',
'Dopo la veglia': 'After the vigil',
'Sulla prima brace': 'About the first ember',
'Sul caldo': 'About the heat',
'Sul raccogliere': 'About gathering',
'Il gatto': 'The cat',
'La ricetta di Ilde': "Ilde's recipe",
"L'ultima lettera": 'The last letter',

/* --- le quattro braci --- */
'"Quello che nasce non chiede permesso." Portale ciò che spunta per primo.': '"What is born does not ask permission." Bring her what comes up first.',
'"Il sole non si trattiene: si divide." Portale ciò che matura al caldo.': '"The sun does not keep itself: it divides." Bring her what ripens in the heat.',
'"Si raccoglie ciò che si è avuto la pazienza di aspettare." Portale l\'abbondanza.': '"You gather what you had the patience to wait for." Bring her the abundance.',
'"Anche sotto il gelo qualcosa conta i giorni." Portale ciò che resiste.': '"Even under the frost, something is counting the days." Bring her what endures.'

});

/* ===================================================================
   NOMI PROPRI
   Restano com'erano, e stanno scritti qui apposta: una voce che dice
   «Bruno resta Bruno» è una decisione presa; la stessa parola assente
   dal catalogo è una dimenticanza. Dal di fuori si assomigliano, e lo
   strumento che conta le mancanti non saprebbe distinguerle.
   =================================================================== */
Object.assign(window.LINGUA_EN, {
'Bruno': 'Bruno',
'Serafina': 'Serafina',
'Tobia': 'Tobia',
'Marisol': 'Marisol',
'Elio': 'Elio',
'Oreste': 'Oreste',
'Fiammella': 'Fiammella',
'Nonna Ilde': 'Granny Ilde',
'Fioralba': 'Fioralba',
'...': '...',

/* le tacche degli attrezzi */
'Rame': 'Copper',
'Ferro': 'Iron',
'Oro': 'Gold',
'Teso': 'Taut',
'Ricurvo': 'Recurve',
'Lungo': 'Long',
'Una cucina vera, e una finestra che guarda a est.': 'A proper kitchen, and a window that faces east.',

/* ===================================================================
   COSA DICONO A SECONDA DEL MOMENTO
   Righe corte, buttate lì mentre fanno altro. In inglese devono
   restare parlato, non didascalia.
   =================================================================== */
'Il vento mi rovescia le ceste. Ogni volta.': 'The wind knocks my baskets over. Every time.',
"Aperto da un'ora e sei il primo. Dimmi che è un buon segno.": 'Open an hour and you are the first. Tell me that is a good sign.',
'Sto per chiudere. Se ti serve qualcosa, adesso o domani.': 'I am about to shut. If you need anything, now or tomorrow.',
'I porcini escono dopo tre giorni di pioggia. Segnatelo.': 'Porcini come up after three days of rain. Make a note.',
'Stagione buona per il ferro: né umido né rovente.': 'Good season for iron: neither damp nor scorching.',
'Il carbone bagnato non serve a niente. Oggi si batte poco.': 'Wet coal is no use to anybody. Not much hammering today.',
'Nevica. Il mantice tira meglio con l\'aria fredda, però.': 'Snow. The bellows pull better in cold air, mind you.',
'Sono in piedi da prima di te. Il ferro non aspetta.': 'I have been up longer than you. Iron does not wait.',
'In primavera cambio il menu. Le prime erbe cambiano tutto.': 'I change the menu in spring. The first herbs change everything.',
'È la stagione in cui la locanda si riempie e io dormo poco.': 'This is the season the inn fills up and I get no sleep.',
'Sto impastando. Se resti a guardare, ti metto a lavorare.': 'I am kneading. Stand there watching and I will put you to work.',
'In primavera i pesci hanno fame come me. Si prende tutto.': 'In spring the fish are as hungry as I am. You catch everything.',
'La trota di primavera è più magra ma più buona. Fidati.': 'The spring trout is leaner but better. Trust me.',
"Lo storione d'inverno vale tre giorni di freddo. Almeno.": 'A winter sturgeon is worth three days of cold. At least.',
'Col temporale non si esce sul molo. Ho imparato bagnandomi.': 'You do not go out on the jetty in a storm. I learnt that by getting soaked.',
'Col vento la lenza va dove vuole lei. Oggi è una lotta.': 'In wind the line goes where it likes. Today it is a fight.',
"Due settimane d'estate, quassù. Le uso tutte.": 'Two weeks of summer, up here. I use all of them.',
"D'estate il passo è quasi ospitale. Quasi.": 'In summer the pass is almost hospitable. Almost.',
'Adesso siamo io e la montagna. È il periodo che preferisco.': 'Now it is me and the mountain. This is the part I like best.',
'Il freddo non è il nemico. È il vento a portarti via.': 'Cold is not the enemy. It is the wind that takes you.',
'Pioggia quassù vuol dire che sotto sta nevicando. Aspetta.': 'Rain up here means it is snowing further down. Wait.',
'Nevica. Bene. La neve copre e protegge, non uccide.': 'Snow. Good. Snow covers and protects; it does not kill.',
'Questo vento scende dal ghiacciaio. Coprila, quella faccia.': 'This wind comes off the glacier. Cover that face of yours.',
'Sei salito presto. Pochi lo fanno.': 'You came up early. Few do.',
"Fra un'ora non si vedrà più il sentiero. Deciditi.": 'In an hour you will not see the path any more. Make your mind up.',
'Bottega chiusa. Una volta a stagione me lo concedo.': 'Shop shut. Once a season I allow myself.',
'Un giorno all\'anno non pesco. Oggi. E già mi manca.': 'One day a year I do not fish. Today. And I miss it already.',

/* --- il risveglio --- */
'Il gallo ha cantato due volte. Il secondo era per te.': 'The cockerel crowed twice. The second was for you.',
'C\'è rugiada sul davanzale.': 'There is dew on the windowsill.',
'Odore di legna dal camino di Marisol.': 'Woodsmoke from Marisol\'s chimney.',
'La valle è ancora mezza addormentata.': 'The valley is still half asleep.',
'Il pozzo ha fatto quel rumore. Di nuovo.': 'The well made that noise. Again.',
'Qualcosa è cresciuto stanotte.': 'Something grew in the night.',

/* --- i consigli --- */
'Dormi prima di mezzanotte o ti sveglierai a pezzi.': 'Sleep before midnight or you will wake up in pieces.',
'La pioggia annaffia il campo al posto tuo.': 'Rain waters the field for you.',
'Gli attrezzi migliorati costano, ma consumano meno energia.': 'Upgraded tools cost money, but use less energy.',
'Le conserve valgono più del raccolto crudo.': 'Preserves are worth more than the raw crop.',
'Nel bosco, ogni stagione nasconde qualcosa di diverso.': 'In the woods, every season hides something different.',

/* --- la veglia, i pezzi corti --- */
'Aspetta. Devo prendere una cosa.': 'Wait. I need to fetch something.',
'Ho aspettato una settimana. Poi un mese. Poi dodici anni.': 'I waited a week. Then a month. Then twelve years.',
'E quando le ha tolte, era buio.': 'And when she took them away, it was dark.',
'Ero io sul sentiero. Sono salita io.': 'It was me on the path. I was the one who climbed up.',
'«Serafina, per chi la tengo accesa adesso?»': '"Serafina, who am I keeping it lit for now?"',
'Poi ha spento. E siamo scese insieme al buio.': 'Then she put it out. And we walked down together in the dark.',

/* --- negozio e interfaccia --- */
'Compra': 'Buy',
'Vendi': 'Sell',
'Bottega di Bruno': "Bruno's Shop",
'Richieste ({0})': 'Requests ({0})',
'Livelli •': 'Levels •',
'Macchine': 'Machines',
'Potenzia attrezzi': 'Upgrade tools',
'Costruzioni': 'Buildings',
'Fusione': 'Smelting'

});

/* ===================================================================
   I PASSANTI
   Gente che dice una cosa e tira dritto. In inglese devono suonare
   come uno che parla fra sé mentre lavora, non come una didascalia.
   =================================================================== */
Object.assign(window.LINGUA_EN, {

/* la lavandaia */
'Se stendo adesso, per sera è asciutto.': 'If I hang it out now, it will be dry by evening.',
'Il sapone buono lo fa Serafina. Costa, ma dura.': 'Serafina makes the good soap. Costs more, lasts longer.',
'Ho tre lenzuola e quattro figli. Fate voi il conto.': 'I have three sheets and four children. You do the arithmetic.',
'Mia madre diceva che il bucato steso al sole sa di domenica.': 'My mother used to say washing dried in the sun smells of Sunday.',

/* il bambino */
'Ho visto un cervo! Grande così! ...forse era un cane.': 'I saw a stag! This big! …it might have been a dog.',
'Quando sarò grande faccio il fabbro. O il pescatore. O tutti e due.': 'When I grow up I am going to be a smith. Or a fisherman. Or both.',
'Elio dice che il Pesce Luna esiste. Io gli credo.': 'Elio says the Moonfish is real. I believe him.',
'Mia mamma dice che non devo andare nel bosco da solo. Ci vado con te?': 'My mum says I must not go into the woods alone. Can I come with you?',
'Sai fischiare? Io no. Ci sto provando da un anno.': 'Can you whistle? I cannot. I have been trying for a year.',

/* la vecchia */
'Ilde la conoscevo da prima che fosse nonna di qualcuno.': 'I knew Ilde before she was anybody\'s grandmother.',
'Una volta questa piazza era piena. Adesso è piena a modo suo.': 'This square used to be full. Now it is full in its own way.',
"Il pozzo fa quel rumore da quarant'anni. Non è mai stato il pozzo.": 'The well has made that noise for forty years. It was never the well.',
'Tu sei quello del podere di sopra, vero? Si vede dalle mani.': 'You are the one from the farm up the hill, are you not? I can tell by the hands.',
'Passa a trovarmi, che tanto sono sempre qui.': 'Come and see me. I am always here anyway.',

/* il pastore */
'Scendo dai pascoli una volta a settimana. Il resto lo sanno le pecore.': 'I come down from the pastures once a week. The sheep know the rest.',
"Il formaggio buono vuole erba buona, e l'erba buona vuole essere lasciata in pace.": 'Good cheese wants good grass, and good grass wants leaving alone.',
'Su in alto si sente il vento prima che arrivi qui.': 'Up top you hear the wind before it gets down here.',
'Oreste? Sì, lo vedo. Ci salutiamo da lontano. Ci basta.': 'Oreste? Yes, I see him. We wave from a distance. That does us.',

/* il marinaio */
'Il mare qui è calmo. Troppo calmo. Non mi fido dei mari educati.': 'The sea is calm here. Too calm. I do not trust a well-mannered sea.',
'Ho visto porti più grandi. Nessuno più tranquillo di questo.': 'I have seen bigger harbours. Never a quieter one.',
"Quando c'è vento da sud, il pesce si sposta al largo. Diglielo, a quel ragazzo.": 'When the wind is southerly the fish move offshore. Tell that lad, would you.',
'Dodici anni fa da qui si vedeva una luce, la notte del solstizio. Poi più niente.': 'Twelve years ago you could see a light from here, on solstice night. Then nothing.',

/* la ragazza */
'Sto imparando a memoria i nomi dei pesci. Sono più di quanto pensassi.': 'I am learning the names of the fish by heart. There are more than I thought.',
'Marisol mi ha promesso che mi insegna la crostata. Aspetto da marzo.': 'Marisol promised to teach me the tart. I have been waiting since March.',
"D'estate ci si siede sul molo fino a tardi. È la cosa migliore dell'anno.": 'In summer we sit on the jetty until late. It is the best thing all year.',
'Tu vieni dal podere di Ilde? Mia nonna ne parlava sempre.': 'Are you from Ilde\'s farm? My grandmother talked about it all the time.'

});

/* ===================================================================
   LA PAGINA DI PRESENTAZIONE
   Le frasi lunghe portano dentro il loro grassetto: la chiave è
   l'innerHTML intero, quindi la traduzione può mettere il <strong>
   dove serve in inglese, che non è sempre dove sta in italiano.

   «Tutto in italiano» diventa «In Italian and English»: era un vanto
   quando la lingua era una sola, e tradotto alla lettera diventerebbe
   una frase che si contraddice da sé nel momento in cui la leggi.
   =================================================================== */
Object.assign(window.LINGUA_EN, {

/* --- logo e apertura --- */
'La Lanterna del Solstizio': 'The Solstice Lantern',
'un piccolo podere, una valle da risvegliare': 'a small farm, a valley to wake up',
"Nonna Ilde ti ha lasciato il suo podere e una cosa che sul testamento non c'era: una <strong>lanterna spenta da dodici anni</strong>, in fondo al bosco. Coltiva, pesca, scendi in miniera, fatti voler bene dal paese — e, stagione dopo stagione, riaccendila.":
  'Granny Ilde left you her farm, and one thing the will did not mention: a <strong>lantern that has been dark for twelve years</strong>, deep in the woods. Farm, fish, go down the mine, make the village fond of you — and, season after season, light it again.',

/* --- i pulsanti --- */
'Nuova Partita': 'New Game',
'Continua': 'Continue',
'Importa salvataggio': 'Import a save',
'Come si gioca': 'How to play',
'guarda com\'è': 'see what it looks like',

/* --- i fatti in fila --- */
'Gratis': 'Free',
'Nel browser': 'In your browser',
'Niente da installare': 'Nothing to install',
'Tutto in italiano': 'In Italian and English',
'Si salva da solo': 'Saves itself',

/* --- i titoli delle sezioni --- */
'Sei posti, una valle sola': 'Six places, one valley',
'Cosa si fa a Fioralba': 'What you do in Fioralba',
'Chi ci vive': 'Who lives here',
'Quattro braci, quattro stagioni': 'Four embers, four seasons',
"Non succede niente di spettacolare. Solo che l'erba, la mattina dopo, è di un verde che nessuno ricordava.":
  'Nothing spectacular happens. Only that the next morning the grass is a green nobody remembered.',

/* --- changelog e piede --- */
'Vedi tutti i cambiamenti': 'See everything that changed',
"Cos'è cambiato": 'What changed',
'Il gioco si aggiorna da solo: basta ricaricare la pagina.':
  'The game updates itself: just reload the page.',
'Il podere ti aspetta.': 'The farm is waiting.',
"La partita si salva nel tuo browser, da sola. Dal menu puoi esportarla in un file e riprenderla su un altro computer.":
  'The game saves itself in your browser. From the menu you can export it to a file, or sync it and pick it up on another computer.',

/* --- avvisi per il telefono --- */
"<strong>💻 Fioralba si gioca da computer.</strong> Serve tastiera e mouse: da telefono o tablet i comandi non funzionano. Puoi comunque dare un'occhiata a cosa ti aspetta.":
  '<strong>💻 Fioralba is played on a computer.</strong> It needs a keyboard and mouse: on a phone or tablet the controls do not work. You are welcome to look around anyway.',
'Gioca dal computer': 'Play on a computer',
"<strong>Fioralba</strong> è pensato per essere giocato da PC con tastiera e mouse. Da smartphone o tablet <strong>non funziona</strong> correttamente.":
  '<strong>Fioralba</strong> is made to be played on a PC with a keyboard and mouse. On a phone or tablet it <strong>does not work</strong> properly.',
'Per vivere al meglio la valle, riapri il gioco da un computer. 🏮':
  'To see the valley at its best, open the game again on a computer. 🏮',
'Torna indietro': 'Go back',

/* --- pezzi dell'interfaccia di gioco --- */
'Salta guida': 'Skip guide',
'Chiudi la lettera': 'Close the letter',
'Tieni premuto <kbd>Spazio</kbd> per salire': 'Hold <kbd>Space</kbd> to rise',
'Primi passi': 'First steps',
'Energia': 'Energy',

/* --- la sincronizzazione, nel menu --- */
'Partita su più computer': 'Play on more than one computer',
'Collega la partita per riprenderla da un altro computer. Niente registrazione: si genera un codice.':
  'Link this game to pick it up on another computer. No sign-up: it just makes you a code.',
'Collega questa partita': 'Link this game',
'collego…': 'linking…',
'Hai già un codice da un altro computer?': 'Already have a code from another computer?',
'Usa questo codice': 'Use this code',
'Collegata. Segna il codice.': 'Linked. Write the code down.',
'Collegata.': 'Linked.',
'Scollegata.': 'Unlinked.',
'Clicca per copiare': 'Click to copy',
'Codice copiato.': 'Code copied.',
'Copialo a mano: ': 'Copy it by hand: ',
"Scrivi questo codice sull'altro computer per riprendere la partita. <b>Chi ha il codice ha la partita</b>: non darlo in giro.":
  'Type this code on the other computer to pick the game up. <b>Whoever has the code has the game</b>: do not pass it around.',
'Manda adesso': 'Send now',
'Prendi dal server': 'Get from the server',
'Scollega': 'Unlink',
'La partita resta qui e resta sul server: si smette solo di allinearle.':
  'The game stays here and stays on the server: they simply stop being kept in step.',
'Partita mandata al server.': 'Game sent to the server.',
'Il codice non ha la forma giusta: dodici lettere e numeri.':
  'That code is not the right shape: twelve letters and numbers.',
'Nessuna partita con questo codice.': 'No game with that code.',
'La partita sul server è diversa: apri il Menu per decidere.':
  'The game on the server is different: open the Menu to decide.',

/* --- la finestra del conflitto --- */
'Due partite diverse': 'Two different games',
"Su questo computer e sul server ci sono due partite che non combaciano. Tenerne una vuol dire <b>perdere l'altra</b>: guarda a che punto sono e scegli.":
  'This computer and the server have two games that do not match. Keeping one means <b>losing the other</b>: look at where each has got to, and choose.',
'Su questo computer': 'On this computer',
'Sul server': 'On the server',
'Tengo questa': 'Keep this one',
'Tengo quella del server': 'Keep the server one',
'Decido dopo': 'Decide later',
'Fatto: adesso vale questa.': 'Done: this one counts now.',
'Scaricata. Ricarico la pagina…': 'Downloaded. Reloading…',
'non riuscito': 'did not work',
'vuota': 'empty',
'Contadino': 'Farmer',
'A che punto': 'How far along',
'Giorni giocati': 'Days played',
'Salvata': 'Saved',
'anno': 'year',
'adesso': 'just now',
'minuti fa': 'minutes ago',
'ora fa': 'hour ago',
'ore fa': 'hours ago'

});

/* --- la finestra che compare dopo aver importato un file --- */
Object.assign(window.LINGUA_EN, {
'Partita importata': 'Game imported',
'Partita importata e collegata': 'Game imported and linked',
'La partita è al sicuro sul server. Da adesso si sincronizza da sola: questo è il tuo codice.':
  'Your game is safe on the server. From now on it syncs by itself: this is your code.',
'La partita è stata mandata sul server, sul codice che questo browser aveva già.':
  'The game has been sent to the server, under the code this browser already had.',
"<b>Segnatelo.</b> Su un altro computer apri Fioralba, vai nel Menu e inseriscilo: ritrovi questa partita dov'era. Qui dentro resta salvato, non devi rifare niente.":
  '<b>Write it down.</b> On another computer open Fioralba, go to the Menu and type it in: you will find this game exactly where you left it. It stays saved in here, so you need not do it again.',
'La partita è stata importata e riparte adesso. Non sono riuscito a collegarla al server: potrai farlo dal Menu, quando vuoi.':
  'The game has been imported and is starting now. I could not link it to the server: you can do that from the Menu whenever you like.',
'Il file è stato importato, ma questo browser era già collegato a una partita diversa sul server. Scegli quale vale.':
  'The file has been imported, but this browser was already linked to a different game on the server. Choose which one counts.',
'Quella appena importata': 'The one just imported',
'Tengo quella importata': 'Keep the imported one',
'Comincia a giocare': 'Start playing',
'Salvataggio importato.': 'Save imported.',
'Salvataggio importato! Riavvio…': 'Save imported! Restarting…'
});

/* --- «ho già una partita, voglio riprenderla»: il blocco della landing.
       In italiano la partita è femminile e le frasi ci girano intorno
       («collegarla», «esportarla», «riprenderla»); in inglese non c'è
       genere e ripetere «game» quattro volte suona da manuale, quindi
       qui si alterna con «it» dove la frase regge da sola. --- */
Object.assign(window.LINGUA_EN, {
'Ho già una partita, voglio riprenderla': 'I already have a game — let me pick it up',
'Se giochi da un altro computer, o giocavi dal vecchio indirizzo, la partita si porta qui in due modi.':
  'If you play on another computer, or you used to play at the old address, there are two ways to bring your game over.',
"<b>Con il codice</b> — se l'hai già collegata":
  '<b>With the code</b> — if you have already linked it',
'Riprendi': 'Pick it up',
'Il codice si trova nel Menu del gioco, sull\u2019altro computer.':
  'You will find the code in the game Menu, on the other computer.',
'Il codice si trova nel Menu del gioco, sull\'altro computer.':
  'You will find the code in the game Menu, on the other computer.',
"<b>Con un file</b> — se l'hai esportata":
  '<b>With a file</b> — if you exported it',
'Scegli il file .json…': 'Choose the .json file…',
'È il file che scarichi dal Menu con «Esporta». Importandolo qui, la partita si collega da sola e ti diamo un codice.':
  'That is the file you download from the Menu with “Export”. Import it here and the game links itself: we hand you a code.',
'La partita si salva nel tuo browser, da sola. Puoi collegarla per riprenderla da un altro computer, o esportarla in un file. <a href="#" class="lp-vai-riprendi">Ho già una partita altrove →</a>':
  'The game saves itself in your browser. You can link it and pick it up from another computer, or export it to a file. <a href="#" class="lp-vai-riprendi">I already have a game elsewhere →</a>',

/* la riga che risponde sotto il campo del codice */
'Cerco la partita…': 'Looking for the game…',
'Codice non valido.': 'That code is not valid.',
'Quel codice esiste, ma non ha ancora nessuna partita dentro.':
  'That code exists, but there is no game in it yet.',
'Trovata! La sto scaricando…': 'Found it! Downloading…',
'Non riesco a scaricarla, riprova fra un momento.':
  'I cannot download it — try again in a moment.',
'Fatto. Riparto…': 'Done. Restarting…'
});

/* ===================================================================
   LE LETTERE
   Le diciassette lettere che arrivano nella cassetta: sedici di Ilde e
   dei suoi (Elio, Tobia, Marisol), piu\u0300 quella che non ha mai spedito.
   Sono la scrittura migliore del gioco e sono state tenute per ultime
   apposta: qui non si traduce l informazione, si traduce la voce.
   Ilde da\u0300 del tu e non addolcisce niente, e in inglese la stessa
   ruvidezza affettuosa passa dal registro (poche contrazioni, frasi
   corte, «brazen affection») piu\u0300 che dal lessico.

   Le chiavi qui sotto non sono state ricopiate a mano: le ha generate
   uno script leggendo DATA.LETTERE e serializzando con JSON.stringify.
   Otto\u0300cento caratteri con a capo, apostrofi e <b> dentro si sbagliano
   con uno spazio, e una chiave sbagliata non fa rumore — la lettera
   resta in italiano e niente lo segnala.
   =================================================================== */
Object.assign(window.LINGUA_EN, {
"Caro nipote,\n\nse stai leggendo questo foglio vuol dire che il notaio ha fatto il suo lavoro e io ho fatto il mio: me ne sono andata con calma, in una mattina di <b>Primavera</b>, con la finestra aperta.\n\nTi lascio il <b>podere</b>. Non è granché. La staccionata cede a est, il pozzo fa un rumore che non ti spiego, e nel campo grande c'è più sasso che terra.\n\nTi lascio anche una cosa che non compare sul testamento, perché i notai non hanno le parole giuste.\n\nC'è una <b>lanterna</b>, nel bosco. È spenta da dodici anni. Ho provato a riaccenderla finché le mani me lo hanno permesso.\n\nNon è un obbligo. Se vuoi vendere tutto e tornare in città, fallo senza sensi di colpa: la valle non tiene il conto.\n\nMa se una mattina ti svegli e senti che l'aria sa di terra bagnata — allora prendi la zappa. Sai già cosa fare.\n\n<b>Con affetto sfacciato,\nNonna Ilde</b>":
  "Dear grandchild,\n\nif you are reading this page it means the solicitor did his job and I did mine: I went quietly, on a <b>Spring</b> morning, with the window open.\n\nI leave you the <b>farm</b>. It is nothing much. The fence sags on the east side, the well makes a noise I will not try to explain, and the big field has more stone in it than soil.\n\nI also leave you something that does not appear in the will, because solicitors do not have the right words for it.\n\nThere is a <b>lantern</b>, in the woods. It has been out for twelve years. I tried to light it again for as long as my hands would let me.\n\nIt is not an obligation. If you want to sell the lot and go back to the city, do it without guilt: the valley keeps no score.\n\nBut if one morning you wake up and the air smells of wet earth — then pick up the hoe. You already know what to do.\n\n<b>With brazen affection,\nGranny Ilde</b>",

"Sei sceso a Fioralba. Il notaio doveva darti questa dopo, e a quanto pare ha fatto il suo lavoro anche stavolta.\n\n<b>Bruno</b> ti sembrerà scorbutico. Lo è. Tiene i conti a memoria e non sbaglia mai di una moneta, il che lo rende insopportabile quando sbagli tu.\n\n<b>Tobia</b> lavora bene e lo sa, e te lo fa pagare. Non tirare sul prezzo: si offende e poi ci mette il doppio.\n\n<b>Marisol</b> alla locanda sa tutto di tutti. Ti dirà anche cose che non hai chiesto. Ascoltale lo stesso: nella valle le notizie utili viaggiano di striscio.\n\nUna cosa pratica, che di quelle vivo: davanti a casa c'è la <b>cassa di consegna</b>. Mettici quello che vuoi vendere e passano a ritirarlo di notte. Non è tanto per il prezzo — è per non doverti fare la strada del paese ogni volta che ti avanza una rapa.\n\n<b>Ilde</b>":
  "So you have been down to Fioralba. The solicitor was to give you this one afterwards, and it seems he did his job that time as well.\n\n<b>Bruno</b> will strike you as gruff. He is. He keeps his accounts in his head and is never a single coin out, which makes him unbearable on the days when you are.\n\n<b>Tobia</b> does good work and knows it, and makes you pay for both. Do not haggle: he takes offence, and then he takes twice as long.\n\n<b>Marisol</b> at the inn knows everything about everybody. She will tell you things you never asked about. Listen anyway: in this valley the useful news arrives sideways.\n\nOne practical thing, since practical things are what I live on: outside the house there is the <b>shipping bin</b>. Put in it whatever you want to sell and they come for it at night. It is not really about the price — it is about not having to walk into the village every time you have a turnip going spare.\n\n<b>Ilde</b>",

"Se sei arrivato fin nel bosco, prima o poi incontri <b>Serafina</b>.\n\nÈ scesa dalla montagna trent'anni fa e non è mai scesa del tutto. Vive in quel cottage con più erbe secche che mobili, e parla come se ogni frase le costasse qualcosa.\n\nTi dirà del <b>burrone</b> e di cosa c'è dall'altra parte. Non farle fretta.\n\nTi dirà anche che ho provato a riaccendere la lanterna da sola. È vero. Ci ho messo undici anni a capire che non è una cosa che si fa da soli, e altri due a trovare qualcuno a cui lasciarla. Sei arrivato tardi, ma sei arrivato.\n\nPortale una <b>viola</b>, quando ne trovi una. Fa finta di niente ma se le ricorda tutte.\n\n<b>Ilde</b>":
  "If you have got as far as the woods, sooner or later you will meet <b>Serafina</b>.\n\nShe came down from the mountain thirty years ago and has never entirely come down. She lives in that cottage with more dried herbs than furniture, and she speaks as though every sentence cost her something.\n\nShe will tell you about the <b>ravine</b> and what lies on the other side. Do not rush her.\n\nShe will also tell you that I tried to relight the lantern on my own. It is true. It took me eleven years to understand that it is not a thing one does alone, and two more to find somebody to leave it to. You came late, but you came.\n\nTake her a <b>violet</b>, when you find one. She pretends not to notice, but she remembers every single one.\n\n<b>Ilde</b>",

"Quindi sei sceso in <b>miniera</b>. Bene: vuol dire che hai capito che la terra da sola non basta.\n\nTuo nonno ci passava le giornate. Tornava su nero fino ai gomiti e diceva sempre la stessa cosa: «sotto non c'è niente di magico, c'è solo roba che nessuno ha ancora tirato fuori».\n\nAveva torto, ma non di molto.\n\nTre cose, e poi ti lascio in pace.\n\nLa prima: si scende più di un livello. Le <b>scale</b> stanno in fondo, e più vai giù più le pietre valgono.\n\nLa seconda: il <b>piccone</b> si migliora da Tobia, e un piccone migliore non è un lusso, è meno fatica per lo stesso sasso.\n\nLa terza: quando sei stanco, risali. La miniera non scappa. Tu sì, ma poi ti svegli a casa senza metà di quello che avevi in tasca.\n\n<b>Ilde</b>":
  "So you have gone down the <b>mine</b>. Good: it means you have worked out that the soil on its own is not enough.\n\nYour grandfather spent his days down there. He would come up black to the elbows and always say the same thing: «there is nothing magical down below, there is only stuff nobody has pulled out yet».\n\nHe was wrong, but not by much.\n\nThree things, and then I will leave you in peace.\n\nThe first: there is more than one level to go down. The <b>stairs</b> are at the far end, and the deeper you go the more the stones are worth.\n\nThe second: the <b>pickaxe</b> gets made better at Tobia's, and a better pickaxe is not a luxury, it is less sweat for the same rock.\n\nThe third: when you are tired, come back up. The mine is not going anywhere. You are, and then you wake up at home without half of what you had in your pockets.\n\n<b>Ilde</b>",

"Il primo raccolto non è mai il migliore. Non prendertela.\n\nLa terra del campo grande è stanca — l'ho sfruttata per quarant'anni e non le ho mai chiesto scusa. Ci vuole un anno perché torni gentile.\n\nNel frattempo: <b>semina fitto</b>, annaffia ogni giorno, e non piantare fuori stagione sperando che stavolta funzioni. Non funziona. L'ho provato tre volte, con tre stagioni diverse, e tre volte il campo mi ha risposto la stessa cosa.\n\nQuando avrai qualche moneta da parte, fatti tirare su la <b>serra</b>: lì dentro le stagioni non contano e d'inverno hai qualcosa da fare che non sia guardare la neve.\n\n<b>Ilde</b>":
  "The first harvest is never the best one. Do not take it to heart.\n\nThe soil in the big field is tired — I worked it for forty years and never once apologised to it. It takes a year for it to turn kind again.\n\nIn the meantime: <b>sow thickly</b>, water every day, and do not plant out of season hoping that this time it will work. It does not. I tried three times, in three different seasons, and three times the field gave me the same answer.\n\nWhen you have a few coins put by, have the <b>greenhouse</b> put up: in there the seasons do not count, and in winter you have something to do that is not watching the snow.\n\n<b>Ilde</b>",

"È cambiata la stagione, e quindi metà del tuo campo è appassita in una notte.\n\nLo so, sembra un dispetto. Non lo è: è solo che qui le stagioni non chiedono permesso, e le piante lo sanno meglio di noi.\n\nRegola unica: <b>raccogli prima dell'ultimo giorno</b>. Se una coltura ci mette otto giorni e la stagione ne ha ventotto, l'ultima semina utile è al ventesimo. Fatti il conto, non fidarti dell'occhio — io mi sono fidata dell'occhio per quarant'anni e ho perso un campo di zucche a tre giorni dalla fine.\n\nE cambia anche quello che trovi nel bosco. Le <b>viole</b> di primavera non le rivedi fino all'anno dopo. Se te ne serve una per qualcosa, raccoglila quando la vedi.\n\n<b>Ilde</b>":
  "The season has turned, and so half your field withered overnight.\n\nI know, it feels like spite. It is not: it is only that the seasons here do not ask permission, and the plants know that better than we do.\n\nOne rule: <b>harvest before the last day</b>. If a crop takes eight days and the season has twenty-eight, the last sowing worth making is on the twentieth. Do the arithmetic, do not trust your eye — I trusted my eye for forty years and lost a field of pumpkins three days from the end.\n\nAnd what you find in the woods changes too. The spring <b>violets</b> you will not see again until the year after. If you need one for something, pick it when you see it.\n\n<b>Ilde</b>",

"Ehi.\n\nMarisol dice che hai tirato su qualcosa dall'acqua. Non chiedo cosa, tanto lo so: la prima è sempre una carpa e sempre piccola.\n\nComunque. Ti scrivo perché la gente qui pensa che pescare sia un modo di perdere tempo con stile, e invece è l'unica cosa in questa valle che ti insegna ad aspettare senza innervosirti.\n\nTre posti, tre acque diverse: il <b>fiume</b> in paese, il <b>lago</b> nel bosco, il <b>mare</b> alla Costa. Non c'è pesce che stia in due posti, e non c'è pesce che stia in tutte le stagioni. Quello che prendi oggi fra tre mesi non c'è più.\n\nSe un giorno ti capita di veder salire qualcosa di grosso in una notte di luna piena — non tirare subito. Vieni a dirmelo.\n\n<b>Elio</b>":
  "Hey.\n\nMarisol says you pulled something out of the water. I am not asking what, because I know: the first one is always a carp and always small.\n\nAnyway. I am writing because people here think fishing is a stylish way of wasting time, when in fact it is the only thing in this valley that teaches you to wait without getting worked up about it.\n\nThree places, three different waters: the <b>river</b> in the village, the <b>lake</b> in the woods, the <b>sea</b> at the Coast. There is no fish that lives in two of them, and no fish that lives in every season. What you catch today is gone in three months.\n\nIf one day you happen to see something big come up on a full-moon night — do not strike straight away. Come and tell me.\n\n<b>Elio</b>",

"Conto saldato. Ti scrivo lo stesso perché una cosa così non la faccio tutti i giorni e voglio che resti scritta da qualche parte.\n\nCento legna, quaranta pietra, tre giorni sul burrone con la fune. Il legno l'ho scelto io: castagno, non abete. L'abete costava meno e tu non l'avresti saputo, ma io sì.\n\nQuel ponte regge trent'anni. Non ci sarò per verificarlo e non ci sarai nemmeno tu, ma regge.\n\nTua nonna me l'aveva chiesto due volte. La prima non avevo l'attrezzatura, la seconda non aveva più i soldi. Non gliel'ho mai detto, ma di quelle due volte mi è rimasto un po' di magone.\n\nAdesso è in piedi. Vacci.\n\n<b>Tobia</b>":
  "Account settled. I am writing anyway, because a job like that is not one I do every day and I want it written down somewhere.\n\nA hundred wood, forty stone, three days over the ravine on a rope. I chose the timber myself: chestnut, not fir. Fir cost less and you would never have known, but I would.\n\nThat bridge will stand for thirty years. I will not be here to check and neither will you, but it will stand.\n\nYour grandmother asked me for it twice. The first time I did not have the gear, the second time she no longer had the money. I never told her, but those two times left a lump in my throat that has not quite gone.\n\nNow it is up. Go and use it.\n\n<b>Tobia</b>",

"Ti scrivo dalla locanda, che tanto sono sempre qui.\n\nVolevo dirti una cosa che nessuno ti dirà in faccia: da queste parti ci si mette del tempo a decidere se una persona resta o no. Non è cattiveria, è che ne abbiamo visti passare parecchi.\n\nTu stai restando, e si vede. Qualcuno ha cominciato a chiedermi di te — di solito è il primo segno.\n\nPassa quando vuoi. Il <b>tavolo d'angolo</b> era quello di Ilde, e da quando non c'è più nessuno ci si siede volentieri. Sarebbe ora che ci si sedesse qualcuno.\n\nCucino tutti i giorni fino a tardi. E no, non ti faccio pagare la prima volta.\n\n<b>Marisol</b>":
  "I am writing from the inn, since I am always here anyway.\n\nI wanted to tell you something nobody will say to your face: round here it takes people a while to decide whether somebody is staying or not. It is not unkindness, it is that we have watched a fair few come and go.\n\nYou are staying, and it shows. People have started asking me about you — that is usually the first sign.\n\nCome by whenever you like. The <b>corner table</b> was Ilde's, and since she went nobody sits there willingly. It is about time somebody did.\n\nI cook every day until late. And no, I am not charging you the first time.\n\n<b>Marisol</b>",

"Questa non te la manda il notaio, perché non gliel'ho mai data. L'ho tenuta nel cassetto della cucina, sotto la carta, e se sei arrivato a saperlo vuol dire che Serafina ha deciso di parlare. Ci avrà messo un po'.\n\nAllora lo dico io, che è meglio.\n\nL'ho spenta io. Non il vento, non la neve, non i dodici anni. Io, con le mani, la notte del solstizio, mentre mi dicevano che tuo nonno era morto seduto sulla riva del fiume come uno che si riposa.\n\nNon l'ho fatto per rabbia. Se fosse stata rabbia sarebbe passata in una settimana e l'avrei riaccesa a gennaio.\n\nL'ho fatto perché in quel momento non mi è venuto in mente <b>per chi</b>. È una domanda stupida e ci ho messo undici anni a capire che la risposta non era «per lui». Non è mai stata per lui. Era per la valle, e la valle il giorno dopo si è svegliata lo stesso, solo un po' più grigia, e ha continuato a svegliarsi grigia per dodici anni per colpa di una domanda che mi ero fatta al buio.\n\nHo provato a rimediare. Le mani non hanno tenuto il passo delle intenzioni, che è il modo educato di dire che sono invecchiata.\n\nAdesso c'è una cosa che devi sapere, e la scrivo qui perché a voce non la direi bene.\n\nQuella lanterna io la tenevo accesa da sola. Mi sembrava giusto: era il mio santuario, la mia valle, il mio compito. Era anche l'errore, e l'ho fatto per quarant'anni senza accorgermene.\n\nUna lanterna tenuta da una persona sola si spegne quando quella persona ha una brutta notte.\n\nNon farla come me. Chiama gente.\n\n<b>Ilde</b>":
  "This one is not coming to you from the solicitor, because I never gave it to him. I kept it in the kitchen drawer, under the paper, and if you have come to know about it then Serafina has decided to talk. It will have taken her a while.\n\nSo I shall say it myself, which is better.\n\nI put it out. Not the wind, not the snow, not the twelve years. Me, with my hands, on the night of the solstice, while they were telling me your grandfather had died sitting on the riverbank like a man having a rest.\n\nI did not do it out of anger. Had it been anger it would have passed in a week and I would have lit it again in January.\n\nI did it because in that moment it did not occur to me <b>who for</b>. It is a stupid question and it took me eleven years to understand that the answer was not «for him». It was never for him. It was for the valley, and the valley woke up all the same the next day, only a little greyer, and went on waking up grey for twelve years because of a question I had asked myself in the dark.\n\nI tried to put it right. My hands did not keep pace with my intentions, which is the polite way of saying that I grew old.\n\nNow there is something you need to know, and I am writing it here because I would not say it well out loud.\n\nThat lantern — I kept it alight on my own. It seemed right to me: my shrine, my valley, my task. It was also the mistake, and I made it for forty years without noticing.\n\nA lantern held up by one person alone goes out the night that person has a bad one.\n\nDo not do it my way. Call people.\n\n<b>Ilde</b>",

"Se stai leggendo questa vuol dire che ce l'hai fatta, e che al santuario non c'eri da solo.\n\nNon ti scrivo per congratularmi. Ti scrivo per dirti la cosa noiosa che le nonne dicono alla fine, e che è l'unica che conta.\n\nAdesso la Lanterna sta accesa senza di te.\n\nNon perché sia magica: perché siete in sette a saperla accendere, e sette persone non hanno una brutta notte tutte insieme. Se domani ti va di stare a letto, la valle non si spegne. Se ti va di andartene per un mese, non si spegne. Se un giorno decidi che questa vita non fa per te e torni in città, non si spegne.\n\nCi ho messo quarant'anni e una notte al buio per capirlo, quindi permettimi di scriverlo grosso: <b>la valle non ti tiene in ostaggio</b>. Ci stai perché ti va.\n\nIl podere ha ancora la staccionata che cede a est. Il pozzo fa ancora quel rumore. Nel campo grande adesso c'è meno sasso che terra, e quello è merito tuo.\n\nVai a dormire, che domani c'è da annaffiare.\n\n<b>Con affetto sfacciato, ancora,\nNonna Ilde</b>":
  "If you are reading this it means you managed it, and that you were not alone at the shrine.\n\nI am not writing to congratulate you. I am writing to tell you the boring thing grandmothers say at the end, which is the only one that counts.\n\nThe Lantern is alight now without you.\n\nNot because it is magical: because there are seven of you who know how to light it, and seven people do not all have a bad night at once. If tomorrow you feel like staying in bed, the valley does not go dark. If you feel like leaving for a month, it does not go dark. If one day you decide this life is not for you and go back to the city, it does not go dark.\n\nIt took me forty years and one night in the dark to understand that, so allow me to write it large: <b>the valley is not holding you hostage</b>. You are here because you want to be.\n\nThe farm still has the fence that sags on the east side. The well still makes that noise. The big field has less stone in it than soil now, and that is your doing.\n\nGo to bed — there is watering to do tomorrow.\n\n<b>With brazen affection, still,\nGranny Ilde</b>",

"Allora l'hai trovata.\n\nLa prima brace è sempre la più facile e la più difficile. Facile perché la primavera regala. Difficile perché devi <b>crederci</b> senza aver ancora visto niente.\n\nIo la accesi a ventidue anni. Avevo le mani a pezzi e nessuno che mi dicesse se stavo sbagliando.\n\nTre ancora. Non correre.\n\n<b>Ilde</b>":
  "So you found it.\n\nThe first ember is always the easiest and the hardest. Easy, because spring gives things away. Hard, because you have to <b>believe in it</b> without having seen anything yet.\n\nI lit mine at twenty-two. My hands were in pieces and there was nobody to tell me whether I was getting it wrong.\n\nThree more. Do not rush.\n\n<b>Ilde</b>",

"D'estate la valle diventa rumorosa. Grilli, api, quel vento che arriva alle quattro e sposta tutto.\n\nTi confesso una cosa: la seconda brace l'ho quasi mollata. Avevo il campo secco, un debito con il padre di Bruno e una gran voglia di andarmene.\n\nPoi Serafina — sì, era già insopportabile allora — mi disse: <b>\"Non devi salvare la valle. Devi solo non abbandonarla oggi.\"</b>\n\nFunziona anche per le persone.\n\n<b>Ilde</b>":
  "In summer the valley turns noisy. Crickets, bees, that wind that arrives at four and moves everything about.\n\nI will admit something: I nearly gave up on the second ember. I had a dry field, a debt to Bruno's father and a great longing to leave.\n\nThen Serafina — yes, she was insufferable back then too — said to me: <b>\"You do not have to save the valley. You only have to not abandon it today.\"</b>\n\nIt works for people as well.\n\n<b>Ilde</b>",

"Terza. Bravo. Non lo dico spesso, quindi rileggilo.\n\nL'autunno è la stagione onesta: ti mostra esattamente quanto hai lavorato in primavera. Niente scuse, niente miracoli.\n\nC'è una cosa che non ti ho detto. La lanterna non si spense da sola, dodici anni fa. Si spense la notte in cui morì tuo nonno.\n\nNon credo alle maledizioni. Credo che ci sia luce dove qualcuno la tiene accesa, e che quell'anno io <b>non ce l'ho fatta</b>.\n\nTu sì. Ecco perché ti ho lasciato il podere e non i soldi.\n\n<b>Ilde</b>":
  "Third. Well done. I do not say that often, so read it twice.\n\nAutumn is the honest season: it shows you exactly how much work you put in in spring. No excuses, no miracles.\n\nThere is something I have not told you. The lantern did not go out on its own, twelve years ago. It went out the night your grandfather died.\n\nI do not believe in curses. I believe there is light where somebody keeps it lit, and that in that particular year I <b>could not manage it</b>.\n\nYou can. That is why I left you the farm and not the money.\n\n<b>Ilde</b>",

"Se stai leggendo questa, vuol dire che si è deciso.\n\nNon è mio e non è tuo: è arrivato una sera d'inverno che pioveva e si è messo davanti alla stufa come se avesse pagato l'affitto. L'ho chiamato <b>Cenere</b> perché era esattamente del colore che resta quando il fuoco si spegne, e a quel tempo la battuta mi sembrava spiritosa.\n\nCi ha messo due anni a farsi toccare. Due. Io gli mettevo il latte fuori e facevo finta di niente, e lui faceva finta di niente e beveva il latte.\n\nPoi una sera mi si è seduto sulle ginocchia senza chiedere permesso, e non se n'è più andato.\n\nTi dico questo perché con le persone della valle funziona uguale, solo che nessuno te lo spiega: non devi convincerle. Devi solo esserci abbastanza volte.\n\nLui lo sa già. Per questo è rimasto anche quando non c'è rimasto nessun altro.\n\n<b>Ilde</b>":
  "If you are reading this, it means the matter has been settled.\n\nShe is not mine and she is not yours: she turned up one rainy winter evening and sat down in front of the stove as though she had paid the rent. I called her <b>Ash</b> because she was exactly the colour of what is left when a fire goes out, and at the time I thought the joke was rather good.\n\nIt took her two years to let herself be touched. Two. I would put milk out for her and pretend not to notice, and she would pretend not to notice and drink the milk.\n\nThen one evening she sat down on my knees without asking permission, and never left again.\n\nI am telling you this because it works the same way with the people of this valley, only nobody explains it to you: you do not have to convince them. You only have to be there enough times.\n\nShe knows it already. That is why she stayed even when nobody else did.\n\n<b>Ilde</b>",

"<b>Torta del Solstizio — di Nonna Ilde</b>\n\nZucca cotta e schiacciata. Uova, quelle vere, di gallina contenta. Miele fino a quando smetti di sentirti in colpa. E — non ridere — una presa di <b>lavanda</b>.\n\nIl segreto non si scrive, ma te lo scrivo lo stesso: <b>tempo</b>. Impasta, poi lasciala nel forno spento tutta la notte, a prendersi il calore che resta.\n\nLa facevo per il solstizio, dicevo. Bugia. La facevo per avere una scusa buona per vederti seduto al mio tavolo.\n\nAdesso falla tu, per qualcuno. Mi raccomando la lavanda.\n\n<b>Ilde</b>":
  "<b>Solstice Cake — by Granny Ilde</b>\n\nPumpkin, cooked and mashed. Eggs, real ones, from a contented hen. Honey until you stop feeling guilty about it. And — do not laugh — a pinch of <b>lavender</b>.\n\nThe secret is not something one writes down, but I shall write it down for you anyway: <b>time</b>. Mix it, then leave it in the switched-off oven all night, to take up the heat that is left.\n\nI made it for the solstice, I used to say. A lie. I made it to have a decent excuse to see you sitting at my table.\n\nNow you make it, for somebody. Mind the lavender.\n\n<b>Ilde</b>",

"Se sei qui, la valle è accesa.\n\nNon ti scriverò più: ho finito le cose importanti da dire, e le altre te le racconterà Serafina esagerandole.\n\nVolevo solo che sapessi che quando piantavo i semi non pensavo al raccolto. Pensavo a chi sarebbe passato di lì dopo di me, e avrebbe trovato la terra <b>già pronta</b>.\n\nAdesso tocca a te lasciarla pronta per qualcun altro.\n\nChiudi la porta piano quando esci. Cigola.\n\n<b>Ti ho voluto un bene assurdo,\nNonna Ilde</b>":
  "If you are here, the valley is alight.\n\nI shall not write to you again: I have run out of important things to say, and the rest Serafina will tell you, exaggerating it.\n\nI only wanted you to know that when I planted seeds I was not thinking about the harvest. I was thinking about whoever would pass this way after me, and would find the ground <b>already made ready</b>.\n\nNow it is your turn to leave it ready for somebody else.\n\nClose the door gently on your way out. It creaks.\n\n<b>I loved you absurdly,\nGranny Ilde</b>"
});

/* ===================================================================
   LE SEI MEMORIE DELLA NOTTE DEL SOLSTIZIO
   Sei testimonianze, una per abitante, e nessuna è la risposta: ognuno
   ha visto un pezzo di quella notte da dove stava. La traduzione deve
   tenere due cose. La prima è che si contraddicono: se in inglese le
   frasi si «puliscono» e concordano, il buco al centro della trama si
   chiude da solo e il finale non ha più niente da rivelare. La seconda
   è che ognuno parla il suo mestiere — Bruno in partita doppia,
   Marisol in servizio di sala, Elio in acqua, Tobia in ferro battuto,
   l'Eremita in dislivelli, Serafina in cose non dette.
   =================================================================== */
Object.assign(window.LINGUA_EN, {

/* --- Bruno: la riga rimasta aperta nel registro --- */
'Quella notte? Me la ricordo per via del registro, non per il resto.':
  'That night? I remember it because of the ledger, not because of the rest.',
"Ilde era passata tre giorni prima. Ha comprato olio da lanterna, il doppio del solito, e una coperta di lana pesante. La coperta non l'ha pagata.":
  'Ilde had come in three days before. She bought lamp oil, twice her usual, and a heavy wool blanket. She never paid for the blanket.',
"Non perché non avesse i soldi. Perché è uscita di fretta e io non l'ho fermata.":
  'Not because she had no money. Because she went out in a hurry and I did not stop her.',
"Sono dodici anni che quella riga è aperta nel registro. L'ho riscritta quattro volte, cambiando quaderno, e ogni volta l'ho ricopiata.":
  'That line has been open in the ledger for twelve years. I have started four new books since, and every time I copied it across.',
'Non è per i soldi. È che finché la riga è aperta la faccenda non è chiusa.':
  'It is not about the money. It is that while the line is open, the matter is not closed.',

/* --- Marisol: il cliente che non ha visto uscire --- */
"Il solstizio d'inverno di dodici anni fa avevo la locanda piena. Si faceva sempre così: la valle mangiava qui e poi saliva al santuario.":
  'Twelve years ago, at the winter solstice, the inn was full. That was how it always went: the valley ate here and then walked up to the shrine.',
'Ilde è partita presto, da sola, che era ancora chiaro. Aveva da fare lassù.':
  'Ilde left early, on her own, while it was still light. She had things to do up there.',
"Al tavolo d'angolo è rimasto suo marito. Da solo, col cappotto addosso, che non se l'era tolto.":
  'Her husband stayed behind at the corner table. On his own, still in his coat — he never took it off.',
'Gli ho chiesto se aspettava qualcuno e ha detto di no. Ha bevuto mezzo bicchiere e si è messo a guardare fuori.':
  'I asked him if he was waiting for somebody and he said no. He drank half a glass and sat looking out of the window.',
"Poi a un certo punto non c'era più, e io ero in cucina, e non ho visto quando è uscito.":
  'Then at some point he was not there any more, and I was in the kitchen, and I did not see him go.',
"È l'unica sera in vent'anni in cui non ho visto uscire un cliente.":
  'It is the only evening in twenty years when I did not see a customer leave.',

/* --- Elio: la fiamma vista dall'acqua --- */
'Ero sul lago. Di notte, al solstizio, si prende il pesce che non prendi mai.':
  'I was out on the lake. At night, at the solstice, you catch the fish you never catch.',
"Da lì il santuario si vede bene: sta più in alto e la luce arriva sull'acqua prima che sulla riva.":
  'You get a clear view of the shrine from there: it sits higher up, and the light reaches the water before it reaches the bank.',
"La lanterna era accesa. Poi si è spenta. Non è calata piano come fa una fiamma che finisce l'olio — si è spenta e basta, come una candela con sopra una mano.":
  'The lantern was lit. Then it went out. It did not sink slowly the way a flame does when the oil runs out — it just stopped, like a candle with a hand over it.',
"E c'erano due persone sul sentiero. Una che saliva di corsa e una ferma.":
  'And there were two people on the path. One coming up at a run and one standing still.',
'Ho pensato: stanno litigando, non sono affari miei. Ho tirato su la lenza e sono andato a casa.':
  'I thought: they are having a row, it is none of my business. I pulled in the line and went home.',
'Ci ho pensato ogni solstizio da allora. Ogni volta mi dico che avrei dovuto remare fino a riva.':
  'I have thought about it every solstice since. Every time I tell myself I should have rowed to shore.',

/* --- Tobia: il gancio rimasto nel cassetto --- */
"Ecco. È un gancio da lanterna. Ferro battuto, con la spirale. Ilde me l'aveva ordinato quell'autunno: quello vecchio al santuario era storto e la lanterna pendeva.":
  'There. It is a lantern hook. Wrought iron, with the spiral. Ilde ordered it from me that autumn: the old one at the shrine was bent and the lantern hung crooked.',
"L'ho finito il giorno prima del solstizio. Volevo portarglielo di persona, che ero contento di come era venuto.":
  'I finished it the day before the solstice. I wanted to take it to her myself, because I was pleased with how it had come out.',
"Poi è successo quello che è successo, e portare un gancio da lanterna a una che aveva appena spento la lanterna mi è sembrato...":
  'Then what happened happened, and carrying a lantern hook to a woman who had just put the lantern out seemed…',
'Tienilo tu. Se lassù serve, serve. E se non serve, almeno esce da questo cassetto.':
  'You keep it. If it is needed up there, it is needed. And if it is not, at least it gets out of this drawer.',

/* --- l'Eremita: quello che si vede da duecento metri più in alto --- */
'Dal Passo si vede tutta la valle, e la notte del solstizio non dormo mai. Vecchia abitudine.':
  'From the Pass you can see the whole valley, and on solstice night I never sleep. Old habit.',
'Quindi sì: ho visto. Da lassù si vede quello che dal basso non si vede.':
  'So yes: I saw. From up there you see what you cannot see from below.',
"C'era Ilde davanti alla nicchia. E c'era Serafina che saliva.":
  'Ilde was standing in front of the niche. And Serafina was coming up.',
'Serafina le ha detto qualcosa. Non ho sentito cosa, sono duecento metri di dislivello.':
  'Serafina said something to her. I did not hear what — it is two hundred metres of drop.',
'Poi Ilde si è girata verso la lanterna e ci ha messo sopra le mani. Tutte e due. È rimasta lì un momento.':
  'Then Ilde turned to the lantern and put her hands over it. Both of them. She stayed like that a moment.',
"Non l'ha spenta il vento, ragazzo. Non l'ha spenta la neve. L'ha spenta lei.":
  'It was not the wind that put it out. It was not the snow. It was her.',

/* --- Serafina: la frase che non ha ripetuto per dodici anni --- */
'Lo sapevo che prima o poi saresti arrivato a me. Gli altri ti hanno dato i pezzi e i pezzi non tornano, vero?':
  'I knew you would come to me sooner or later. The others gave you the pieces, and the pieces do not add up, do they?',
"Suo marito era uscito dalla locanda ed era andato al fiume, dove andava sempre quando aveva qualcosa che non riusciva a dire. Non stava bene da un anno: il torace, la miniera, il freddo. Quell'inverno era peggiorato e non l'aveva detto a nessuno tranne che a me, perché a me si dicono le cose e poi si fa finta di niente.":
  'Her husband had left the inn and gone down to the river, where he always went when he had something he could not say. He had not been well for a year: his chest, the mine, the cold. That winter he had got worse, and he had told nobody but me, because people tell me things and then we all pretend nothing was said.',
"L'hanno trovato lì. Non è caduto, non è successo niente di drammatico. Si è seduto e non si è più alzato.":
  'They found him there. He did not fall, nothing dramatic happened. He sat down and did not get up again.',
'Sono salita io a dirglielo perché nessun altro se la sentiva.':
  'I was the one who went up to tell her, because nobody else could face it.',
'Lei mi ha ascoltata. Non ha pianto, non ha detto niente. Ha guardato la nicchia — mancava un frutto, uno solo, era quasi finita — e ha messo le mani sulla fiamma.':
  'She listened to me. She did not cry, she did not say anything. She looked at the niche — one fruit short, just the one, she was almost done — and put her hands over the flame.',
'Io le ho detto: Ilde, ci hai messo un anno. E lei mi ha risposto una cosa che non ho più ripetuto a nessuno per dodici anni.':
  'I said to her: Ilde, it took you a year. And she answered me with something I have not repeated to anybody for twelve years.'
});

/* ===================================================================
   LE DUE CATENE E LA LEZIONE DI ORESTE (storie.js)
   La torta di Ilde, il Pesce Luna, e il vecchio del Passo che insegna
   la caccia un passo per volta. Le frasi con un pezzo variabile dentro
   passano da `LINGUA.f`: qui la chiave è il modello, e il `{0}` va
   messo dove lo vuole l'inglese, non dove stava in italiano.
   =================================================================== */
Object.assign(window.LINGUA_EN, {

/* --- Oreste e l'arco --- */
"L'arco? È mio.": 'The bow? It is mine.',
"Torna quando ci conosciamo un po' meglio. Non do archi a chi ho visto due volte.":
  'Come back when we know each other a little better. I do not hand bows to people I have seen twice.',
'Sei pronto.': 'You are ready.',
'Sei pronto': 'You are ready',
'Non ancora. {0}': 'Not yet. {0}',
'Lezione di caccia: {0}': 'Hunting lesson: {0}',
"Prendi l'arco dalla barra in basso.": 'Take the bow from the bar at the bottom.',
'Trova una preda e colpiscila. Coniglio nel prato, cervo nel bosco allalba.':
  'Find quarry and hit it. Rabbit in the meadow, deer in the woods at dawn.',
"Trova una preda e colpiscila. Coniglio nel prato, cervo nel bosco all'alba.":
  'Find quarry and hit it. Rabbit in the meadow, deer in the woods at dawn.',

/* --- Marisol insegna le ricette --- */
'Ti ho già insegnato tutto quello che so. Adesso tocca a te inventarne una.':
  'I have already taught you everything I know. Now it is your turn to invent one.',
'Le ricette non si regalano, si passano.': 'Recipes are not given away, they are handed on.',
"Passa più spesso, mangia qui, raccontami com'è andato il campo. Poi vediamo.":
  'Come by more often, eat here, tell me how the field is doing. Then we shall see.',
'Allora: {0}.': 'Right then: {0}.',
'Ti serve {0}. Poco fuoco e tanta pazienza.': 'You will need {0}. Low heat and a lot of patience.',
'Ricetta imparata: {0}': 'Recipe learnt: {0}',

/* --- Elio e i consigli di pesca --- */
'In questa stagione? Cerca il {0}.': 'This season? Go for {0}.',
'Quello sta al largo: vai alla Costa, oltre la Piazza, e lancia dal molo.':
  'That one stays out in deep water: go to the Coast, past the Square, and cast from the jetty.',
'Sta nelle acque ferme: il laghetto del podere o lo stagno del bosco.':
  'It lives in still water: the pond on the farm or the one in the woods.',
'Sta nella corrente. Prova il fiume del paese, dal molo.':
  'It lives in the current. Try the river in the village, from the landing.',
'Ah: esce solo dopo il tramonto. Portati una lanterna.':
  'Oh, and: it only comes out after sunset. Take a lantern with you.',
'Di giorno abbocca senza troppi problemi.': 'It bites readily enough by day.',

/* --- La torta di Nonna Ilde --- */
'Nonna Ilde... la sua torta era leggendaria. Me la portava a ogni solstizio e non mi ha mai dato la ricetta intera.':
  'Granny Ilde… that cake of hers was legendary. She brought me one every solstice and never once gave me the whole recipe.',
'Ho quasi tutti i pezzi. Mi mancano due cose: il suo <b>segreto</b> — quello lo sa Serafina, c’era sempre — e gli <b>ingredienti</b>.':
  'I have nearly all the pieces. Two things are missing: her <b>secret</b> — Serafina knows that one, she was always there — and the <b>ingredients</b>.',
"Ho quasi tutti i pezzi. Mi mancano due cose: il suo <b>segreto</b> — quello lo sa Serafina, c'era sempre — e gli <b>ingredienti</b>.":
  'I have nearly all the pieces. Two things are missing: her <b>secret</b> — Serafina knows that one, she was always there — and the <b>ingredients</b>.',
'Portami {0}, fatti dire il segreto da Serafina, e la facciamo insieme. Per lei.':
  'Bring me {0}, get the secret out of Serafina, and we shall make it together. For her.',
"La torta di Ilde? Mezzo paese ha provato a rifarla. Nessuno c'è riuscito.":
  "Ilde's cake? Half the village has tried to make it again. Nobody has managed it.",
'Il segreto non è un ingrediente raro. È il <b>tempo</b>: la lasciava nel forno spento tutta la notte, a prendersi il calore che restava.':
  'The secret is not some rare ingredient. It is <b>time</b>: she left it in the switched-off oven all night, taking up the heat that was left.',
'E una presa di <b>lavanda</b> nell’impasto. Ma non dirlo in giro, o si offende mezza valle.':
  'And a pinch of <b>lavender</b> in the mixture. But do not go telling people, or half the valley will take offence.',
"E una presa di <b>lavanda</b> nell'impasto. Ma non dirlo in giro, o si offende mezza valle.":
  'And a pinch of <b>lavender</b> in the mixture. But do not go telling people, or half the valley will take offence.',
"Aspetta... senti l'odore? È lei. È esattamente lei.":
  'Wait… can you smell that? It is her. It is exactly her.',
'Ho capito il vero segreto solo adesso: non la faceva per il solstizio. Faceva il solstizio per avere una scusa buona per portartela.':
  'I have only just understood the real secret: she did not make it for the solstice. She made the solstice happen so she would have a decent excuse to bring it to you.',
'Tieni: la ricetta, scritta di suo pugno. E la prima fetta è tua.':
  'Here: the recipe, in her own hand. And the first slice is yours.',
'Per la torta di Ilde manca ancora {0}.': "Ilde's cake still needs {0}.",
', e': ', and',

/* --- Il Pesce Luna --- */
'Nuova storia: Il Pesce Luna. Pescalo di notte, nel lago.':
  'New story: the Moonfish. Catch it at night, in the lake.',
"Il Pesce Luna. Lo so, fai quella faccia. Ma io l'ho visto, una volta sola, da ragazzo.":
  'The Moonfish. I know, you are pulling that face. But I saw it, just the once, when I was a boy.',
'Grande come un piatto, con gli occhi che sembravano due lune piene. Da allora lo cerco.':
  'Big as a dinner plate, with eyes like two full moons. I have been looking for it ever since.',
"Se ci credi anche tu, provaci: di <b>notte</b>, nelle acque ferme del <b>lago</b>, d'estate o d'autunno. Se lo prendi, corri da me.":
  'If you believe it too, have a go: at <b>night</b>, in the still water of the <b>lake</b>, in summer or autumn. If you land it, run to me.',
'Fermo. Fermo lì. Quello è... no. NO. È il Pesce Luna. È vero. È VERO!':
  'Hold on. Hold it right there. That is… no. NO. It is the Moonfish. It is real. IT IS REAL!',
'Dodici anni che lo dico e mi ridono dietro. E tu ci sei riuscito.':
  'Twelve years I have been saying so and they laugh behind my back. And you went and did it.',
'Tienilo tu, mi raccomando: a me basta sapere che esiste. Prendi questa — è la colletta che tenevo da parte per chi mi avrebbe creduto. Sei tu.':
  'You keep it, mind: knowing it exists is enough for me. Take this — it is the purse I put aside for whoever would believe me. That is you.',
'Elio non ci crede: hai preso il Pesce Luna! +{0} monete':
  'Elio cannot believe it: you caught the Moonfish! +{0} coins',
"L'hai visto? No? Esce solo di <b>notte</b>, e solo nelle acque ferme del <b>lago</b>.":
  'Seen it? No? It only comes out at <b>night</b>, and only in the still water of the <b>lake</b>.',
"D'estate e d'autunno è più facile. Porta pazienza e una buona lanterna.":
  'It is easier in summer and autumn. Bring patience and a good lantern.'
});

/* ===================================================================
   I PRIMI MINUTI (tutorial.js) E LA GUIDA A SCHERMO (guida.js)
   Qui il tono è di servizio e le parole sono le stesse dei tasti: se
   la guida dice «Space» e la barra dice «Spazio», il giocatore cerca
   un tasto che non c'è.
   =================================================================== */
Object.assign(window.LINGUA_EN, {
'Benvenuto a Fioralba': 'Welcome to Fioralba',
'Questo è il podere di tua nonna. Prima cosa: fai due passi. Muoviti con <b>WASD</b> o le <b>frecce</b>.':
  'This is your grandmother’s farm. First things first: take a few steps. Move with <b>WASD</b> or the <b>arrow keys</b>.',
"Hai già la <b>Zappa</b> in mano. Avvicinati a un pezzo d'erba libero: la casella davanti a te si illumina. Premi <b>Spazio</b> (o clic) per zapparla.":
  'You already have the <b>Hoe</b> in hand. Step up to a clear patch of grass: the tile in front of you lights up. Press <b>Space</b> (or click) to break the soil.',
'Ora i semi': 'Now the seeds',
'Bravo! Adesso scegli i <b>Semi di Rapa</b> nella barra.':
  'Well done! Now pick the <b>Turnip Seeds</b> from the bar.',
'Mettiti sopra o accanto alla terra dissodata e premi di nuovo <b>Spazio</b> per piantare.':
  'Stand on or next to the tilled soil and press <b>Space</b> again to plant.',
'Serve acqua': 'Water needed',
'Dai da bere': 'Give them a drink',
'Bagna la terra dove hai seminato con <b>Spazio</b>. Da domani cresceranno un po’ ogni notte.':
  'Water the soil where you sowed with <b>Space</b>. From tomorrow they will grow a little every night.',
"Bagna la terra dove hai seminato con <b>Spazio</b>. Da domani cresceranno un po' ogni notte.":
  'Water the soil where you sowed with <b>Space</b>. From tomorrow they will grow a little every night.',
'Ottimo lavoro! Quando sei stanco torna a <b>casa</b> e vai a letto: la notte fa crescere le piante.<br>':
  'Good work! When you are tired go <b>home</b> and get into bed: night is what makes the plants grow.<br>',

/* i passi numerati della guida: il {0} è il numero del passo */
"<b>{0}.</b> Scegli la <b>zappa</b> e premi <kbd>Spazio</kbd> verso l'erba: la casella davanti a te si illumina.":
  '<b>{0}.</b> Choose the <b>hoe</b> and press <kbd>Space</kbd> facing the grass: the tile in front of you lights up.',
'<b>{0}.</b> Scegli i <b>semi</b> e premi ancora <kbd>Spazio</kbd> sulla terra dissodata.':
  '<b>{0}.</b> Choose the <b>seeds</b> and press <kbd>Space</kbd> again on the tilled soil.',
"<b>{0}.</b> Con l'<b>annaffiatoio</b> bagna la terra. Se piove ci pensa il cielo.":
  '<b>{0}.</b> Water the soil with the <b>watering can</b>. If it rains, the sky sees to it.',
'<b>{0}.</b> Torna a casa e <b>dormi</b>: le piante crescono solo durante la notte.':
  '<b>{0}.</b> Go home and <b>sleep</b>: plants only grow during the night.',
'<b>{0}.</b> Quando la pianta <b>scintilla</b> è matura: raccoglila <b>a mani nude</b>.':
  '<b>{0}.</b> When the plant <b>sparkles</b> it is ripe: pick it <b>with bare hands</b>.',
'<b>{0}.</b> Scegli la <b>canna</b> e premi <kbd>Spazio</kbd> rivolto verso l’acqua.':
  '<b>{0}.</b> Choose the <b>rod</b> and press <kbd>Space</kbd> facing the water.',
"<b>{0}.</b> Scegli la <b>canna</b> e premi <kbd>Spazio</kbd> rivolto verso l'acqua.":
  '<b>{0}.</b> Choose the <b>rod</b> and press <kbd>Space</kbd> facing the water.',
'<b>{0}.</b> Aspetta. Quando il galleggiante fa <b>!</b> premi subito <kbd>Spazio</kbd>.':
  '<b>{0}.</b> Wait. When the float goes <b>!</b> press <kbd>Space</kbd> at once.',
'<b>{0}.</b> <b>Tieni premuto</b> per far salire la barra verde, <b>molla</b> per farla scendere: tienila sul pesce.':
  '<b>{0}.</b> <b>Hold</b> to send the green bar up, <b>let go</b> to bring it down: keep it on the fish.',
'<b>{0}.</b> La barra blu si riempie finché il pesce è dentro. Piena = pesce tuo.':
  '<b>{0}.</b> The blue bar fills while the fish is inside it. Full = the fish is yours.',
'<b>{0}.</b> Mettiti davanti alla <b>botte</b> e premi <kbd>E</kbd>: scegli cosa infilarci.':
  '<b>{0}.</b> Stand in front of the <b>barrel</b> and press <kbd>E</kbd>: choose what to put in.',
'<b>{0}.</b> Ci mette qualche giorno. Intanto fai altro: lavora anche mentre dormi.':
  '<b>{0}.</b> It takes a few days. Get on with something else meanwhile: it works while you sleep, too.',
"<b>{0}.</b> Quando spunta la <b>bolla</b>, premi <kbd>E</kbd> e ritira. Il vino vale <b>il triplo</b> dell'uva.":
  '<b>{0}.</b> When the <b>bubble</b> appears, press <kbd>E</kbd> and collect. Wine is worth <b>three times</b> the grapes.',
'<b>{0}.</b> La <b>cassa di consegna</b> è accanto a casa. Premi <kbd>E</kbd> e lasciaci dentro il raccolto.':
  '<b>{0}.</b> The <b>shipping bin</b> is beside the house. Press <kbd>E</kbd> and leave your harvest in it.',
'<b>{0}.</b> Durante la <b>notte</b> passano a ritirarla. Non devi fare niente.':
  '<b>{0}.</b> They come for it during the <b>night</b>. You need do nothing.',
"<b>{0}.</b> All'alba trovi le monete già contate. Comodo prima di andare a dormire.":
  '<b>{0}.</b> At dawn the coins are there, already counted. Handy just before bed.',
"Le piantine hanno sete. Scegli l'<b>Annaffiatoio</b> (tasto <b>{0}</b>).":
  'The seedlings are thirsty. Choose the <b>Watering Can</b> (key <b>{0}</b>).'
});

/* ===================================================================
   I CARTELLI E LE INSEGNE (world.js)
   Sono scritti sul mondo e si leggono di sfuggita: corti, e con la
   freccia sempre nella stessa posizione, perché è quella che si guarda.
   =================================================================== */
Object.assign(window.LINGUA_EN, {
'Cassa di consegna — la ritirano di notte': 'Shipping bin — collected at night',
'Campo grande': 'The big field',
'Il laghetto di Ilde': "Ilde's pond",
'→ Fioralba, il paese': '→ Fioralba, the village',
'↓ Bosco di Fioralba': '↓ Fioralba Woods',
'← Podere': '← Farm',
'↑ Miniera': '↑ Mine',
'↓ Miniera': '↓ Mine',
'↓ Piazza': '↓ Square',
'↑ Piazza': '↑ Square',
'↓ Uscita': '↓ Way out',
'↓ Giù': '↓ Down',
'↑ Su': '↑ Up',
'↓ Ancora giù': '↓ Further down',
'↑ Passo': '↑ The Pass',
'↑ Fioralba': '↑ Fioralba',
'↓ Costa': '↓ Coast',
'Banco del mercante': "Pedlar's stall",
'Il burrone. Di là c’è la Radura degli Spiriti: serve un ponte.':
  "The ravine. The Spirits' Clearing is over there: you will need a bridge.",
"Il burrone. Di là c'è la Radura degli Spiriti: serve un ponte.":
  "The ravine. The Spirits' Clearing is over there: you will need a bridge.",
"«Se non ce l'ho, probabilmente non ti serviva.»":
  '«If I have not got it, you probably did not need it.»',
'«Il ferro va scaldato, non convinto.»': '«Iron is heated, not talked round.»',
"«Qui si mangia e si ascolta. In quest'ordine.»":
  '«Here we eat and we listen. In that order.»',
'La teiera di Nonna Ilde è ancora sul tavolo.': "Granny Ilde's teapot is still on the table."
});

/* ===================================================================
   LE CHIACCHIERE DI STAGIONE, DI METEO E DI GIORNATA
   Sono le battute che ogni abitante cambia a seconda della stagione,
   del tempo che fa e dell'ora, più i compleanni e la sagra. Non portano
   informazione: portano la voce di chi le dice, ed è l'unica cosa che
   c'è da tradurre. Bruno conta, Serafina osserva, Tobia lavora,
   Marisol cucina, Elio pesca, Oreste sta in alto e guarda giù.
   =================================================================== */
Object.assign(window.LINGUA_EN, {

/* --- Bruno, il negozio --- */
'I semi di primavera vanno via che è un piacere. Se ne vuoi, muoviti.':
  'Spring seeds are flying off the shelf. If you want any, get a move on.',
"Ogni primavera dico che quest'anno mi organizzo. Ogni primavera arrivo impreparato.":
  'Every spring I say that this year I shall get organised. Every spring I turn up unprepared.',
'Con questo caldo la gente compra e scappa. Nessuno chiacchiera più.':
  'In this heat people buy and run. Nobody stops to talk any more.',
"Tengo i semi di melone all'ombra. L'anno scorso mi sono germogliati in negozio.":
  'I keep the melon seeds in the shade. Last year they sprouted in the shop.',
"L'autunno è la mia stagione: si vende tutto e si lavora la metà.":
  'Autumn is my season: everything sells and there is half the work.',
'Zucche. Ogni anno mi sommergono di zucche. E ogni anno le ricompro.':
  'Pumpkins. Every year they bury me in pumpkins. And every year I buy them again.',
"D'inverno vendo tre cose in croce e parlo con chiunque entri. Compreso te.":
  'In winter I sell next to nothing and I talk to whoever walks in. You included.',
'Il magazzino è pieno e il paese è vuoto. Fa un certo effetto.':
  'The storeroom is full and the village is empty. It is a strange feeling.',
'Con la pioggia entra gente solo per asciugarsi. Non compra niente, ma almeno parla.':
  'When it rains people come in only to dry off. They buy nothing, but at least they talk.',
"Ho staccato l'insegna prima che la portasse via il vento. È già successo.":
  'I took the sign down before the wind could carry it off. It has happened before.',
'Con la neve la gente compra il doppio del necessario. Non ho mai capito perché.':
  'When it snows people buy twice what they need. I have never understood why.',

/* --- Serafina, il bosco --- */
'Il bosco si sta svegliando adesso. Cammina piano, i primi giorni.':
  'The woods are waking up just now. Walk slowly, the first few days.',
"Le viole sono uscite tutte insieme, come se si fossero messe d'accordo.":
  'The violets all came out together, as though they had agreed on it.',
"D'estate il sottobosco profuma di resina. Respira, invece di correre.":
  'In summer the undergrowth smells of resin. Breathe, instead of hurrying.',
'La lavanda va colta al mattino, prima che il sole se la beva.':
  'Lavender should be picked in the morning, before the sun drinks it up.',
'Adesso il bosco dà tutto quello che ha. Prendine metà e lascia il resto.':
  'Now the woods give everything they have. Take half and leave the rest.',
'Sotto la neve non è morto niente. Sta solo contando i giorni.':
  'Nothing has died under the snow. It is only counting the days.',
"D'inverno il bosco è più onesto: si vede la forma delle cose.":
  'In winter the woods are more honest: you can see the shape of things.',
'La pioggia è la voce del bosco. Sta dicendo qualcosa, se ti fermi.':
  'Rain is the voice of the woods. It is saying something, if you stand still.',
'I temporali fanno crescere le piante più in fretta. Non chiedermi perché, so solo che è così.':
  'Storms make the plants grow faster. Do not ask me why, I only know that they do.',
'Nella neve si leggono le impronte. Oggi è passata una volpe, prima di te.':
  'Tracks can be read in the snow. A fox came through today, before you did.',
"Il vento porta i semi lontano. È l'unico modo che hanno di viaggiare.":
  'The wind carries seeds a long way. It is the only way they have of travelling.',
"A quest'ora il bosco è ancora di chi ci vive. Sei ospite: comportati bene.":
  'At this hour the woods still belong to those who live in them. You are a guest: behave.',
'Sta per farsi buio. Se torni al podere, prendi il sentiero, non la scorciatoia.':
  'It is nearly dark. If you are going back to the farm, take the path, not the short cut.',

/* --- Tobia, la fucina --- */
'Primavera: tutti si ricordano che gli attrezzi sono da aggiustare.':
  'Spring: everybody suddenly remembers their tools need mending.',
"Il legno umido non tiene. Aspetta l'estate per la staccionata.":
  'Damp timber will not hold. Wait for summer to do the fence.',
"Con la fucina accesa e questo caldo, io d'estate mi sciolgo.":
  'With the forge lit and this heat, I melt in summer.',
"Lavoro all'alba e al tramonto. Nel mezzo, sto all'ombra come un gatto.":
  'I work at dawn and at dusk. In between I lie in the shade like a cat.',
'Se hai lingotti da parte, adesso è il momento di portarmeli.':
  'If you have ingots put by, now is the time to bring them to me.',
"La fucina d'inverno è il posto più caldo del paese. Passa quando vuoi.":
  'In winter the forge is the warmest place in the village. Come by whenever you like.',
'Il freddo rende il metallo capriccioso. Ci vuole più pazienza.':
  'Cold makes metal awkward. It wants more patience.',
"Sento i tuoni nel petto prima che nelle orecchie. È l'incudine.":
  'I feel thunder in my chest before I hear it. That is the anvil.',
'Con questo vento la forgia tira troppo. Brucio il doppio del carbone.':
  'In this wind the forge draws too hard. I burn twice the charcoal.',
'Chiudo bottega e vado alla locanda. Ci vediamo là, se ti va.':
  'I am shutting up shop and going to the inn. See you there, if you fancy it.',

/* --- Marisol, la locanda --- */
'Serafina mi porta le viole e io ci faccio uno sciroppo che non ti dico.':
  'Serafina brings me violets and I make a syrup out of them that I shall not even try to describe.',
"D'estate si mangia fuori, sotto il pergolato. Passa una sera.":
  'In summer we eat outside, under the pergola. Come by one evening.',
"Il pomodoro d'estate non ha bisogno di niente. Nemmeno di me.":
  'A summer tomato needs nothing at all. Not even me.',
'Autunno: zucca, funghi, castagne. La cucina si scrive da sola.':
  'Autumn: pumpkin, mushrooms, chestnuts. The menu writes itself.',
"D'inverno tengo il camino acceso tutto il giorno. Vieni a scaldarti.":
  'In winter I keep the fire going all day. Come and get warm.',
"Le conserve d'estate si aprono adesso. È come riaprire luglio.":
  'The summer preserves get opened now. It is like opening July again.',
'Coi tuoni la gente resta a tavola più a lungo. E ordina il dolce.':
  'When it thunders people stay at the table longer. And order pudding.',
'Ho messo la zuppa sul fuoco alle sei. Con questa neve, sparirà entro mezzogiorno.':
  'I put the soup on at six. With this snow it will be gone by midday.',
'Il vento fa sbattere le imposte e i clienti si spaventano. Poi ordinano vino.':
  'The wind bangs the shutters and the customers jump. Then they order wine.',
"È l'ora buona: c'è gente, c'è rumore, c'è odore di cena. Siediti.":
  'This is the good hour: people, noise, the smell of dinner. Sit down.',

/* --- Elio, la riva --- */
"D'estate si pesca all'alba o non si pesca. Il resto è stare al sole.":
  'In summer you fish at dawn or you do not fish. The rest is sitting in the sun.',
"Al largo, d'estate, l'acqua è così ferma che si vede il fondo.":
  'Out in the deep, in summer, the water is so still you can see the bottom.',
"L'autunno è per il luccio. Grosso, cattivo, e non molla mai.":
  'Autumn is for pike. Big, mean, and it never gives up.',
'Con le foglie in acqua abbocca meno. Bisogna avere pazienza.':
  'With leaves in the water they bite less. You have to be patient.',
"D'inverno le mani si spaccano e i pesci stanno sotto. Ma io vado lo stesso.":
  'In winter your hands crack and the fish stay deep. But I go out all the same.',
'Quando piove i pesci salgono. È il momento migliore e nessuno ci crede.':
  'When it rains the fish come up. It is the best time and nobody believes it.',
"Sotto la neve l'acqua è nera e ferma. Un po' mi mette soggezione.":
  'Under snow the water is black and still. It puts me in awe of it, a little.',
"Sono qui da prima dell'alba. I pesci non aspettano chi dorme.":
  'I have been here since before dawn. Fish do not wait for people who sleep in.',
"Di notte, al molo, l'acqua fa un rumore diverso. Più profondo. Provaci.":
  'At night, off the jetty, the water makes a different sound. Deeper. Give it a try.',

/* --- Oreste, il Passo --- */
'Quassù la primavera arriva con un mese di ritardo. Non si offende nessuno.':
  'Up here spring arrives a month late. Nobody takes offence.',
'La neve si ritira e sotto trovo le cose che avevo perso a novembre.':
  'The snow pulls back and underneath I find the things I lost in November.',
"L'autunno dura tre giorni e poi è già inverno. Fai in fretta.":
  'Autumn lasts three days and then it is winter already. Be quick.',
'Sto mettendo via legna. Ne serve sempre più di quanto pensi.':
  'I am putting firewood by. You always need more of it than you think.',
'I temporali di montagna arrivano di sotto in su. Guarda la valle, non il cielo.':
  'Mountain storms come from below upwards. Watch the valley, not the sky.',

/* --- la sagra --- */
'Guarda quanta gente. E pensare che di solito parlo con le casse.':
  'Look at all these people. And to think I usually talk to the crates.',
'Sono scesa dal bosco apposta. Non succede spesso: segnatelo.':
  'I came down out of the woods on purpose. It does not happen often: make a note of it.',
"Ilde non ne saltava una. Stava lì, in quell'angolo, a guardare tutti.":
  'Ilde never missed one. She would stand right there, in that corner, watching everybody.',
'Oggi la fucina è fredda e io ho le mani pulite. Mi sento strano.':
  'Today the forge is cold and my hands are clean. It feels odd.',
'Ho portato le panche nuove. Tre giorni di lavoro, per un pomeriggio.':
  'I brought the new benches. Three days of work, for one afternoon.',
'Ho cucinato per settanta persone. Settanta, in un paese di dodici.':
  'I have cooked for seventy people. Seventy, in a village of twelve.',
'Assaggia tutto e non dirmi cosa preferisci: mi offendo comunque.':
  'Taste everything, and do not tell me which you liked best: I shall take offence either way.',
"Alla sagra dell'anno scorso ho raccontato del Pesce Luna. Ridono ancora.":
  'At last year’s fair I told them about the Moonfish. They are still laughing.',

/* --- i compleanni --- */
"Oggi? Compleanno. Non l'ho detto a nessuno e voi ve lo ricordate tutti. Misterioso.":
  'Today? Birthday. I told nobody and the lot of you remember it. Mysterious.',
'Compio gli anni oggi. Li conto ancora, sì. Mi sembra una cortesia verso il tempo.':
  'It is my birthday today. Yes, I still count them. It seems a courtesy towards time.',
"Compleanno. Mio padre me lo festeggiava battendo l'incudine dodici volte. Rumoroso, ma sincero.":
  'Birthday. My father used to mark it by striking the anvil twelve times. Loud, but sincere.',
'È il mio compleanno e sto cucinando per gli altri. Non lo cambierei con niente.':
  'It is my birthday and I am cooking for everybody else. I would not swap it for anything.',
'Oggi compio gli anni. Da ragazzo pescavo per festeggiare. Oggi... pesco lo stesso.':
  'It is my birthday. As a boy I would go fishing to celebrate. Today… I am fishing anyway.',
'Compleanno. Quassù non lo sa nessuno. Che tu sia salito oggi è una coincidenza notevole.':
  'Birthday. Nobody up here knows. That you should have climbed up today is a remarkable coincidence.',

/* --- due consigli e un passo della guida --- */
"Metti una Lanterna vicino al campo: di notte è tutta un'altra cosa.":
  'Put a Lantern near the field: at night it is a different place altogether.',
'Regala qualcosa agli abitanti: due volte a settimana bastano.':
  'Give the villagers a present: twice a week is plenty.',
'Dissoda la terra': 'Break the soil'
});

/* ===================================================================
   QUELLO CHE IL CENSIMENTO NON VEDEVA
   Ventinove frasi che risultavano tradotte e non lo erano: la lezione
   di Oreste (scritta come `testo:[...]`), il racconto di Serafina sulle
   braci e i consigli di caccia (costruiti con `l.push(...)` e passati
   come variabile), e i nove suggerimenti d'esplorazione di game.js.
   Il censimento diceva «826 su 826»; nel gioco in inglese Serafina
   parlava italiano. Trovate giocando e leggendo `LINGUA.mancanti()`,
   non leggendo il verde. Adesso lo strumento le vede — ma la lezione
   è che un elenco di frasi mancanti va tarato come qualsiasi prova.
   =================================================================== */
Object.assign(window.LINGUA_EN, {

/* --- i suggerimenti che compaiono quando ci si ferma (game.js) --- */
'Prova a zappare la terra, pianta un seme e annaffialo: la fattoria nasce così. 🌱':
  'Try breaking the soil, plant a seed and water it: that is how a farm begins. 🌱',
"Hai una canna: lanciala nell'acqua del fiume o del lago e tieni premuto Spazio. 🎣":
  'You have a rod: cast it into the river or the lake and hold Space. 🎣',
"Con l'ascia abbatti gli alberi del bosco e fai scorta di legna. 🪓":
  'With the axe you fell trees in the woods and lay in a store of wood. 🪓',
"A ovest c'è il paese di Fioralba: da Bruno compri semi e vendi il raccolto. 🏘️":
  'Fioralba village lies to the west: at Bruno’s you buy seeds and sell your harvest. 🏘️',
"A sud si apre il bosco: funghi, foraggio e l'erborista Serafina ti aspettano. 🌲":
  'The woods open to the south: mushrooms, forage and Serafina the herbalist await you. 🌲',
"A nord del paese c'è la miniera: col piccone trovi minerali e gemme. ⛏️":
  'North of the village is the mine: with the pickaxe you find ore and gems. ⛏️',
"Fai un regalo agli abitanti: ognuno ha i suoi gusti e l'amicizia cresce. 🎁":
  'Give the villagers a present: each has their own taste, and friendship grows. 🎁',
'Il fabbro Tobia può costruirti il ponte per la radura del Santuario. 🌉':
  'Tobia the blacksmith can build you the bridge to the Shrine clearing. 🌉',
'In cucina combini gli ingredienti in piatti che danno più energia. 🍳':
  'In the kitchen you combine ingredients into dishes that give more energy. 🍳',

/* --- la lezione di Oreste --- */
"Questo? Un arco. Corno di cervo e tendine, l'ho fatto io d'inverno che non c'era altro da fare.":
  'This? A bow. Deer horn and sinew — I made it one winter when there was nothing else to do.',
'Se vuoi te ne do uno. Ma un arco senza sapere dove puntarlo è un bastone storto: prima la lezione.':
  'I will give you one if you want. But a bow without knowing where to point it is a bent stick: the lesson comes first.',
'Bene. Adesso ascolta, perché è la parte che conta.':
  'Good. Now listen, because this is the part that matters.',
"Si tira <b>davanti a sé</b>, non dove guarda il tuo dito. Da che parte sei girato conta: è metà della caccia. L'altra metà è arrivarci vicino senza farti sentire.":
  'You shoot <b>straight ahead of you</b>, not where your finger points. Which way you are facing matters: that is half of hunting. The other half is getting close without being heard.',
'Ecco. Adesso lo sai.': 'There. Now you know.',
'Non sprecare niente: la carne si mangia, la pelle si concia, il corno lo tiene Tobia. E non tirare a quello che non ti serve — allo scoiattolo, al riccio. Non sono cacciagione, sono vicini.':
  'Waste nothing: the meat is eaten, the hide is tanned, Tobia takes the horn. And do not shoot what you have no use for — the squirrel, the hedgehog. They are not game, they are neighbours.',
'Te la cavi. Adesso ti sentono più tardi, e quello che porti a casa rende di più.':
  'You are getting the hang of it. They hear you later now, and what you carry home is worth more.',
'Ilde diceva che un bosco senza cacciatori si ammala. Non esagerare, però.':
  'Ilde used to say a wood with no hunters falls ill. Do not overdo it, though.',

/* --- Serafina, brace per brace --- */
"La valle non è malata. È solo rimasta al buio troppo a lungo e ha preso l'abitudine.":
  'The valley is not ill. It has simply been in the dark too long and got into the habit.',
"Nel bosco, a est, un burrone taglia la terra. Di là c'è un santuario, e non ci si arriva a piedi: serve un ponte. Chiedilo a Tobia, alla fucina.":
  'In the woods, to the east, a ravine cuts the land in two. There is a shrine on the far side, and you cannot walk to it: you need a bridge. Ask Tobia, at the forge.',
"Una brace. L'aria di primavera è già diversa, l'hai sentito?":
  'One ember. The spring air is different already — have you noticed?',
'Ilde diceva che la prima è quella che ti convince che non sei matto.':
  'Ilde used to say the first one is what convinces you that you are not mad.',
'Due. Adesso la gente in paese comincia a parlarne.':
  'Two. Now people in the village are starting to talk about it.',
'Bruno finge di non crederci ma ha ricominciato a tenere aperto fino a tardi.':
  'Bruno pretends not to believe it, but he has started staying open late again.',
"Tre. Manca l'inverno, che è sempre la più difficile.":
  'Three. Winter is left, which is always the hardest.',
"Non perché serva chissà cosa. Perché d'inverno è più facile smettere.":
  'Not because it takes anything remarkable. Because in winter it is easier to stop.',
"L'hai riaccesa.": 'You have lit it again.',
'Sai cosa mi ha detto Fiammella ieri? Che aveva dimenticato il proprio colore.':
  'Do you know what Fiammella told me yesterday? That she had forgotten her own colour.',
'Adesso lo ricorda. Grazie a te. Non fare quella faccia modesta.':
  'She remembers it now. Because of you. Do not pull that modest face.',

/* --- i due pezzi che entrano nell'elenco di cosa manca alla torta --- */
'il segreto (parla con Serafina, nel bosco)': 'the secret (talk to Serafina, in the woods)',
'gli ingredienti ({0})': 'the ingredients ({0})',

/* --- la chiusa del tutorial, che nel sorgente è spezzata in due --- */
'Ottimo lavoro! Quando sei stanco torna a <b>casa</b> e vai a letto: la notte fa crescere le piante.<br>Poi metti il raccolto nella <b>cassa di consegna</b> per venderlo, parla con gli <b>abitanti</b>, esplora il <b>bosco</b> — e un giorno riaccendi la <b>Lanterna</b>.':
  'Good work! When you are tired go <b>home</b> and get into bed: night is what makes the plants grow.<br>Then put your harvest in the <b>shipping bin</b> to sell it, talk to the <b>villagers</b>, explore the <b>woods</b> — and one day, light the <b>Lantern</b> again.'
});

/* --- i due consigli di caccia, che stavano in `const righe = [...]`:
       una forma che il censimento non guardava, e che ha lasciato
       Oreste a parlare italiano in inglese per due battute --- */
Object.assign(window.LINGUA_EN, {
"Il coniglio sta nel prato e nel bosco, di giorno. Il cervo solo nel bosco, all'alba o sul tardi, e non tutti i giorni.":
  'The rabbit is in the meadow and in the woods, by day. The deer only in the woods, at dawn or late on, and not every day.',
"Più sei vicino, più è facile. Non c'è altro segreto.":
  'The closer you are, the easier it is. There is no other secret.'
});

/* ===================================================================
   LA CARTA «COS'È CAMBIATO» SULLA PAGINA INIZIALE
   Solo la voce in cima: è quella che si legge senza aprire niente, e
   restava in italiano anche premendo «English» — un blocco in un'altra
   lingua proprio sotto al pulsante appena premuto. L'archivio delle
   versioni vecchie resta com'è stato scritto, per scelta: sono
   diciassettemila caratteri di storia passata e tradurli vorrebbe dire
   tenerli tradotti per sempre. Queste voci il censimento non le vede
   (salta changelog.js apposta): quando esce una versione nuova, le sue
   frasi vanno aggiunte qui a mano.
   =================================================================== */
Object.assign(window.LINGUA_EN, {
'Ultimo aggiornamento · {0}': 'Last updated · {0}',
'…e altre {0} cose.': '…and {0} more.',
"…e un'altra cosa.": '…and one more.',
'Versione {0}': 'Version {0}',
'Nuovo': 'New',
'Migliorato': 'Improved',
'Corretto': 'Fixed',
'Cambia lingua': 'Change language',
'agosto 2026': 'August 2026',

/* --- versione 2.2 --- */
"Fioralba parla inglese, e la partita ti segue da un computer all'altro":
  'Fioralba speaks English, and your game follows you from one computer to another',
'Il gioco, tutto, anche in inglese': 'The whole game, in English too',
"Non solo i menu: le quindici lettere di Nonna Ilde, le sei testimonianze della notte del solstizio, la lezione di caccia di Oreste, le chiacchiere che ogni abitante cambia con la stagione, col tempo che fa e con l'ora. Ottocentocinquantasei frasi. Si cambia lingua dalla pagina iniziale o dal menu, in qualsiasi momento, senza perdere niente.":
  'Not just the menus: Granny Ilde’s fifteen letters, the six accounts of solstice night, Oreste’s hunting lesson, the small talk every villager changes with the season, the weather and the hour. Eight hundred and fifty-six phrases. You can switch language from the front page or from the menu, at any point, without losing anything.',
'La stessa partita dal fisso e dal portatile': 'The same game on the desktop and the laptop',
"La partita si collega e riceve un codice. Su un altro computer si apre Fioralba, si scrive il codice, e si riprende da dov'era. Se le due parti hanno lavorato tutte e due, il gioco non sceglie da solo: fa vedere le due partite — giorno, stagione, monete — e decidi tu quale vale.":
  'You link the game and it is given a code. On another computer you open Fioralba, type the code in, and pick up where you left off. If both sides have been played, the game does not choose for you: it shows you both — day, season, coins — and you decide which one counts.',
'«Ho già una partita, voglio riprenderla»': '«I already have a game — let me pick it up»',
"Il pulsante per importare un salvataggio stava in fila con «Gioca» e «Come si gioca», tre pulsanti identici, e non lo trovava nessuno: non diceva né a chi serviva né cosa bisognava avere in mano. Adesso sulla pagina iniziale c'è un riquadro che si apre e spiega le due strade — col codice, se la partita è già collegata; col file .json, se l'hai esportata — e dice dove trovare l'uno e l'altro. Importando un file la partita si collega da sola e ti dà il codice.":
  'The button for importing a save sat in a row with «Play» and «How to play» — three identical buttons — and nobody found it: it said neither who it was for nor what you needed to have in hand. Now the front page has a panel that opens and explains the two routes — with the code, if the game is already linked; with the .json file, if you exported it — and tells you where to find each. Import a file and the game links itself and hands you the code.',
'Il tasto «English» adesso cambia anche la pagina iniziale':
  'The «English» button now changes the front page as well',
"Cambiava la lingua del gioco ma non quella della presentazione: si restava a leggere l'italiano premendo un pulsante inglese.":
  'It changed the language of the game but not of the presentation: you went on reading Italian after pressing an English button.'
});

/* --- i due tasti a schermo, per chi gioca col pollice.
       Stanno dentro un cerchio di 82 e 64 pixel: la parola deve entrarci
       senza rimpicciolirsi, quindi «Talk» e non «Talk to», «Use» e non
       «Use item». Sono anche i due verbi che il gioco aveva già sulla
       tastiera — Spazio ed E — e non due nomi nuovi da imparare. --- */
Object.assign(window.LINGUA_EN, {
'Usa': 'Use',
'Parla': 'Talk'
});

/* --- versione 2.3, la carta della landing (il censimento salta
       changelog.js apposta: queste vanno aggiunte a mano) --- */
Object.assign(window.LINGUA_EN, {
'Fioralba si gioca dal telefono': 'Fioralba can be played on a phone',
'Si gioca col pollice': 'You play with your thumb',
"Fino a ieri la pagina iniziale diceva «Solo da computer» e rifiutava il clic. Adesso no: appoggi il pollice dove vuoi, nella metà sinistra dello schermo, e nasce lì una levetta che ti segue — non è ferma in un angolo, perché su uno schermo alto il pollice non torna mai nello stesso punto. A destra due tasti, che sono i due verbi che il gioco aveva già sulla tastiera: <b>Usa</b> e <b>Parla</b>. Tenendo premuto Usa si tira la lenza.":
  'Until yesterday the front page said «Computer only» and refused the click. Not any more: put your thumb down wherever you like on the left half of the screen and a stick appears there and follows it — it is not fixed in a corner, because on a tall screen your thumb never comes back to the same spot. On the right, two buttons, which are the two verbs the game already had on the keyboard: <b>Use</b> and <b>Talk</b>. Hold Use down to play the fish.',
'Adesso si può aprire una porta': 'You can open a door now',
"Il tocco sullo schermo sapeva fare una cosa sola, cioè usare l'attrezzo in mano. Non sapeva interagire: porte, casse, macchinari e abitanti erano fuori portata, e senza quello il gioco non si poteva finire. Il tasto «Parla» è esattamente quel verbo che mancava.":
  'Touching the screen could do exactly one thing: use the tool in your hand. It could not interact — doors, chests, machines and villagers were all out of reach, and without that the game could not be finished. The «Talk» button is precisely the verb that was missing.',
'I dialoghi avanzano toccandoli': 'Tap a conversation to move it on',
'Si avanzava solo con Spazio, Invio o E: da telefono ogni conversazione era un vicolo cieco, e siccome tutta la storia passa di lì la partita finiva alla prima battuta. Adesso si tocca il riquadro. Vale anche col mouse: chi gioca da computer con una mano sola cliccava e non succedeva niente.':
  'You could only move on with Space, Enter or E: on a phone every conversation was a dead end, and since the whole story goes through them the game ended at the first line. Now you tap the box. It works with a mouse too: anyone playing one-handed on a computer used to click and nothing happened.',
'Si vede la valle, non un corridoio': 'You can see the valley, not a corridor',
'Su un telefono in verticale si vedevano 5,9 caselle di larghezza, contro le 20 di un computer: si camminava dentro una feritoia. Adesso sono circa dodici, e il conto tiene anche il telefono coricato, che prima restava alto sei caselle — tre sopra la testa e tre sotto i piedi.':
  'On a phone held upright you could see 5.9 tiles across, against twenty on a computer: you were walking down a slot. Now it is about twelve, and the sum also covers a phone on its side, which used to be six tiles tall — three above your head and three below your feet.',
'Tutto grande abbastanza per un dito': 'Everything big enough for a finger',
"La barra degli attrezzi era larga 466 pixel dentro uno schermo da 375: il primo e l'ultimo attrezzo stavano fuori. Le celle dello zaino erano 21 pixel, la crocetta per chiudere le finestre 29. Adesso la barra ci sta, le finestre si aprono a tutto schermo, e ogni cosa che si tocca è grande almeno quanto un polpastrello. C'è anche il rispetto della tacca dell'iPhone e della barra di casa.":
  'The tool bar was 466 pixels wide inside a 375-pixel screen: the first and last tool sat off the edge. The backpack cells were 21 pixels, the cross that closes a window 29. Now the bar fits, windows open full-screen, and everything you touch is at least as big as a fingertip. The iPhone notch and home bar are respected too.'
});

/* ===================================================================
   LE PARTITE SUL SERVER
   Il selettore, il codice, la migrazione di chi arriva da ieri, e i due
   casi in cui qualcosa non torna. Il censimento non vede queste frasi —
   passano da `T(...)` dentro ai textContent, non dal primo argomento di
   UI.modal — quindi vanno tenute allineate a mano.
   Una nota di tono: in italiano si dà del tu e si dice «apparecchio»
   per non ripetere «computer o telefono» ogni volta; in inglese
   «device» fa lo stesso mestiere e non suona tecnico.
   =================================================================== */
Object.assign(window.LINGUA_EN, {
/* --- il codice --- */
'La tua partita è questa': 'This is your game',
'Il codice di questa partita': 'This game’s code',
'Ho segnato il codice, si comincia': 'Code written down — let’s begin',
"<b>Segnatelo.</b> Con questo codice riprendi la partita da qualunque computer o telefono. Su questo apparecchio resta in elenco, quindi qui non dovrai riscriverlo. <b>Chi ha il codice ha la partita</b>: non darlo in giro.":
  '<b>Write it down.</b> With this code you pick the game up on any computer or phone. On this device it stays in the list, so you will not have to type it again here. <b>Whoever has the code has the game</b>: do not pass it around.',
'Scrivi questo codice su un altro computer o telefono per riprendere di là esattamente da qui. <b>Chi ha il codice ha la partita</b>: non darlo in giro.':
  'Type this code on another computer or phone to carry on from exactly here. <b>Whoever has the code has the game</b>: do not pass it around.',
'Questa partita non è ancora sul server.': 'This game is not on the server yet.',
'Cambia partita': 'Switch game',

/* --- il selettore --- */
'Quale partita riprendi?': 'Which game are you picking up?',
'Riprendi una partita': 'Pick up a game',
'Su questo apparecchio non risulta nessuna partita. Se ne hai una altrove, scrivi qui il suo codice: lo trovi nel Menu del gioco, sull\'altro computer.':
  'There is no game on record on this device. If you have one elsewhere, type its code here: you will find it in the game Menu, on the other computer.',
'Oppure scrivi il codice di un\'altra partita:': 'Or type the code of another game:',
'Il codice della partita:': 'The game code:',
'Partita senza nome': 'Unnamed game',
'non ancora giocata': 'not played yet',
'monete': 'coins',
'Trovata. Si comincia.': 'Found it. Here we go.',
'Non riesco ad aprirla.': 'I cannot open it.',

/* --- il server che non risponde --- */
'Il server non risponde': 'The server is not answering',
'Non riesco a raggiungere il server.': 'I cannot reach the server.',
'Le partite di Fioralba stanno sul server: senza collegamento non si può cominciare né riprendere. Riprova fra un momento.':
  'Fioralba games live on the server: without a connection you can neither start nor resume one. Try again in a moment.',
'Riprova': 'Try again',
'Sto parlando col server.': 'Talking to the server.',
'Un momento…': 'One moment…',
'Preparo la valle…': 'Preparing the valley…',
'Nessuna partita aperta.': 'No game is open.',
"Non c'è niente da mandare.": 'There is nothing to send.',
'Invio non riuscito.': 'Sending failed.',
'Non riesco a creare la partita sul server.': 'I cannot create the game on the server.',
'Non riesco a salvare adesso: riprovo da solo.': 'I cannot save right now — I will keep trying on my own.',
'Il salvataggio non è leggibile.': 'The save cannot be read.',
'Il salvataggio non si è potuto aprire.': 'The save could not be opened.',

/* --- il menu --- */
'Partita': 'Game',
'Salva adesso': 'Save now',
'Partita salvata sul server.': 'Game saved to the server.',
'Esci al titolo': 'Quit to title',
'Salvo…': 'Saving…',

/* --- il cassetto rimasto indietro --- */
"C'è del gioco non mandato": 'There is unsent play here',
'Su questo apparecchio era rimasto un pezzo di partita che non è mai arrivato al server — probabilmente è caduta la rete. Nel frattempo la stessa partita è stata giocata altrove, quindi le due non combaciano più.':
  'A piece of play was left on this device that never reached the server — the connection probably dropped. Meanwhile the same game has been played elsewhere, so the two no longer match.',
'Rimasta qui': 'Left here',
'Tengo quella rimasta qui': 'Keep the one left here',

/* --- due apparecchi sulla stessa partita --- */
'Qualcuno sta giocando la stessa partita': 'Somebody else is playing this game',
'Questa partita è stata salvata da un altro apparecchio mentre giocavi qui. Tenerne una vuol dire <b>perdere l\'altra</b>: guarda a che punto sono e scegli.':
  'This game was saved from another device while you were playing here. Keeping one means <b>losing the other</b>: look at where each has got to and choose.',
'Quella che stai giocando': 'The one you are playing',
'Quella sul server': 'The one on the server',

/* --- la migrazione di chi arriva da ieri --- */
'La tua partita si sposta sul server': 'Your game is moving to the server',
'Fino a ieri Fioralba teneva la partita dentro a questo browser, dove bastava svuotare la cronologia per perderla. Adesso le partite stanno sul server e si riprendono con un codice, da qualunque apparecchio. La tua è ancora qui: la porto di là adesso.':
  'Until yesterday Fioralba kept your game inside this browser, where clearing the history was enough to lose it. Now games live on the server and are picked up with a code, from any device. Yours is still here: I will move it across now.',
'La partita che hai qui': 'The game you have here',
'Spostala e dammi il codice': 'Move it and give me the code',
'la sto spostando…': 'moving it…',
"Finché non riesce, la partita resta dov'è: non si perde niente.":
  'Until it succeeds the game stays where it is: nothing is lost.',

/* --- il piede della landing --- */
'La partita si salva sul server, da sola, e si riprende con un codice: dal computer, dal telefono, da dove ti pare.':
  'The game saves itself to the server and is picked up with a code: on your computer, on your phone, wherever you like.'
});

/* --- versione 2.4 (changelog.js il censimento lo salta: a mano) --- */
Object.assign(window.LINGUA_EN, {
'Le partite stanno sul server, e si aprono con un codice':
  'Games live on the server, and open with a code',
'La sincronizzazione partiva una volta sola': 'Syncing happened once and never again',
'Chi collegava la partita la vedeva salire sul server, e poi non saliva più: mesi di gioco restavano fermi al giorno del collegamento. Da fuori sembrava che su alcune partite non partisse mai. Partiva sempre, e non ripartiva mai — la funzione che manda esisteva e non la chiamava nessuno.':
  'If you linked your game you saw it go up to the server, and then it never went up again: months of play stayed frozen on the day you linked it. From the outside it looked as though some games never synced at all. They always did, once — and never again, because the function that sends existed and nobody called it.',
'Una partita sola, e sta di là': 'One game, and it lives over there',
"Prima ce n'erano due: una nel browser e una copia sul server, che potevano scostarsi e ogni tanto ti chiedevano quale tenere. Adesso la partita è una e vive sul server: si salva da sé mentre giochi, e non c'è più niente da allineare. Del browser si serve solo un cassetto, per le volte che cade la rete: appena torna, quello che era rimasto parte da solo.":
  'There used to be two: one in the browser and a copy on the server, which could drift apart and now and then asked you which to keep. Now there is one game and it lives on the server: it saves itself while you play, and there is nothing left to keep in step. All it needs from the browser is a drawer, for the times the connection drops — as soon as it comes back, whatever was left goes up on its own.',
'«Continua» ti chiede quale partita': '«Continue» asks which game',
"Questo apparecchio si ricorda i codici che ha visto, e te li mostra con nome, stagione e monete: si tocca quello giusto e si riparte. Se non ne conosce nessuno — perché sei su un computer nuovo — chiede il codice, che è l'unica cosa da sapere per ritrovare la tua valle da qualunque parte.":
  'This device remembers the codes it has seen and shows them to you with name, season and coins: touch the right one and off you go. If it knows none — because you are on a new computer — it asks for the code, which is the only thing you need to know to find your valley again from anywhere.',
'Cominciarne una nuova non cancella più niente': 'Starting a new one no longer erases anything',
"Ogni partita ha il suo codice, quindi quella di prima resta dov'è. È sparito l'avviso «cominciandone una nuova la perdi», che era vero solo finché la partita stava dentro a un browser.":
  'Every game has its own code, so the previous one stays where it is. The warning «start a new one and you lose this» is gone — it was only true while the game lived inside a browser.',
'Niente più file .json da esportare e importare': 'No more .json files to export and import',
"Erano il modo di spostare una partita quando la partita stava nel browser. Adesso ci si sposta col codice: dodici caratteri invece di centoquaranta chilobyte, e nessun file da ritrovare nella cartella dei download. Chi aveva ancora la partita nel browser se la vede spostare di là alla prima apertura, e riceve il suo codice.":
  'They were how you moved a game when the game lived in the browser. Now you move with the code: twelve characters instead of a hundred and forty kilobytes, and no file to hunt for in your downloads folder. Anyone still holding a game in the browser will see it moved across on first opening, and be given their code.'
});

/* ===================================================================
   LE IMPOSTAZIONI
   La sezione che risponde alla domanda che uno si fa prima di chiudere
   — «la mia partita è al sicuro?» — e il nome della partita, che fino a
   ieri non si poteva scegliere. Il censimento non vede queste frasi:
   passano da `T(...)` dentro ai textContent, non dal primo argomento di
   UI.modal, quindi vanno tenute allineate a mano.
   =================================================================== */
Object.assign(window.LINGUA_EN, {
'Impostazioni': 'Settings',
'La partita': 'The game',
'Il salvataggio': 'Saving',

/* --- il nome --- */
'Come ti chiami?': 'What is your name?',
'Rinomina': 'Rename',
'Cambiato. Lo mando al server…': 'Changed. Sending it to the server…',
'Fatto.': 'Done.',
'Il nome è cambiato qui, ma non è ancora arrivato al server.':
  'The name has changed here, but has not reached the server yet.',
'braci accese': 'embers lit',

/* --- lo stato del salvataggio --- */
'Tutto salvato sul server.': 'Everything is saved on the server.',
'Ultimo salvataggio:': 'Last saved:',
"C'è del gioco non ancora arrivato al server.": 'Some play has not reached the server yet.',
'Ultimo salvataggio riuscito:': 'Last successful save:',
'Nessun salvataggio riuscito, per ora.': 'No successful save so far.',
'Non è ancora stato mandato niente.': 'Nothing has been sent yet.',
'Succede al primo salvataggio.': 'That happens at the first save.',
'Il gioco salva da solo mentre giochi, e riprova ogni cinque minuti se qualcosa non passa.':
  'The game saves itself while you play, and tries again every five minutes if something does not get through.',
'Prima faccio arrivare al server quello che manca.':
  'First let me get what is missing to the server.',
"Non riesco a salvare: se esci adesso perdi l'ultimo pezzo.":
  'I cannot save: if you leave now you lose the last stretch.',

/* --- da quanto tempo --- */
'un minuto fa': 'a minute ago',
"un'ora fa": 'an hour ago',
'ieri': 'yesterday',
'giorni fa': 'days ago',

/* --- la guida, che era rimasta in italiano nel menu --- */
'🧭 Mostra i Primi passi': '🧭 Show First steps',
'🧭 Nascondi i Primi passi': '🧭 Hide First steps',
'Guida di nuovo a schermo.': 'Guide back on screen.',
'Guida nascosta.': 'Guide hidden.',
'Musica': 'Music',
'Effetti': 'Effects'
});

/* --- versione 2.5 (changelog.js il censimento lo salta: a mano) --- */
Object.assign(window.LINGUA_EN, {
'Impostazioni rifatte, e la partita ha un nome': 'Settings rebuilt, and your game has a name',
'Dai un nome alla tua partita': 'Give your game a name',
"Fino a ieri il contadino si chiamava «Contadino» e non c'era modo di cambiarlo — nessuno l'aveva mai chiesto. Adesso il nome si sceglie quando la partita nasce, e si cambia quando vuoi dalle Impostazioni. Serve anche a te: nel selettore di «Continua» tre partite che si chiamano tutte allo stesso modo non aiutano a capire quale riprendere.":
  'Until yesterday the farmer was called «Farmer» and there was no way to change it — nobody had ever been asked. Now you choose the name when the game is created, and change it whenever you like in Settings. It helps you too: in the «Continue» picker, three games all called the same thing do not help you work out which to resume.',
'Le Impostazioni dicono se la partita è al sicuro': 'Settings tell you whether your game is safe',
"La domanda che uno si fa prima di chiudere non compariva da nessuna parte. Adesso è la prima cosa che si legge: <b>tutto salvato sul server</b> e da quanto, oppure che c'è ancora qualcosa per strada. Verde quando è arrivato, ambra mentre sta andando — perché i tre secondi dopo ogni mossa non sono un guasto.":
  'The question you ask yourself before closing appeared nowhere at all. Now it is the first thing you read: <b>everything saved on the server</b> and how long ago, or that something is still on its way. Green when it has arrived, amber while it is going — because the three seconds after every move are not a fault.',
'Un menu a sezioni invece di un elenco': 'A menu in sections instead of a list',
"Era una fila piatta in cui tutto pesava uguale. Adesso è diviso: la partita, il salvataggio, l'audio, la lingua, la guida. I cursori del volume dicono anche a quanto stanno, che prima si trascinavano alla cieca.":
  'It was a flat row in which everything weighed the same. Now it is split up: the game, saving, audio, language, guide. The volume sliders also say where they are, which before you dragged blind.',
'Riprova da solo ogni cinque minuti': 'It tries again on its own every five minutes',
"Se un salvataggio non riesce ad arrivare — rete caduta, server che tossisce — prima non lo riprovava nessuno finché non salvavi di nuovo. E se in quel momento smettevi di giocare, restava lì fino al riavvio. Adesso ogni cinque minuti il gioco guarda se c'è qualcosa rimasto indietro e lo rimanda. Quando non c'è niente, non fa nulla e non costa nulla.":
  'If a save failed to get through — connection dropped, server coughing — nobody used to try again until you saved once more. And if you stopped playing at that moment, it sat there until the next start. Now every five minutes the game looks for anything left behind and sends it again. When there is nothing, it does nothing and costs nothing.',
'Se esci con qualcosa non salvato, te lo dice': 'If you leave with something unsaved, it says so',
'Il browser ti chiede conferma prima di chiudere, ma solo quando serve davvero: se è tutto arrivato non ti disturba, e la pagina resta veloce come prima.':
  'The browser asks you to confirm before closing, but only when it really matters: if everything has arrived it leaves you alone, and the page stays as quick as before.',
'Ricaricare non sembra più aver perso qualcosa': 'Reloading no longer looks like it lost something',
"Uscendo, il gioco manda l'ultima partita mentre la pagina si chiude: arrivava, ma nessuno faceva in tempo a segnarselo. Al rientro il gioco diceva «c'è del gioco non ancora salvato» di una cosa già salvata, accendeva l'avviso e faceva chiedere conferma per uscire. Adesso confronta e si accorge da sé che era tutto a posto.":
  'On the way out the game sends your last play as the page closes: it arrived, but nobody was around long enough to note it down. Coming back, the game said «some play has not been saved yet» about something already saved, lit the warning and made the browser ask you to confirm before leaving. Now it compares, and works out for itself that all was well.'
});

/* --- versione 2.6 (changelog.js il censimento lo salta: a mano) --- */
Object.assign(window.LINGUA_EN, {
'Il telefono si può girare, e i tasti smettono di coprire la valle':
  'You can turn the phone sideways, and the buttons stop covering the valley',
'Un HUD per il telefono coricato': 'A layout for the phone on its side',
"Girando il telefono l'interfaccia si accavallava su se stessa: i cinque tasti del menu finivano sopra i due verdi comandi, e sopra l'orologio; la barra dell'energia era alta mezzo schermo per dire un numero. Adesso coricati c'è una disposizione tutta sua — quello che si guarda in alto, quello che si preme in basso agli angoli, dove arrivano i pollici — e l'energia diventa una barretta orizzontale.":
  'Turn the phone and the interface piled up on itself: the five menu buttons ended up on top of the two controls, and on top of the clock; the energy bar was half the screen tall to tell you one number. Sideways there is now a layout of its own — what you look at along the top, what you press in the bottom corners where your thumbs land — and energy becomes a short horizontal bar.',
'I tasti a destra non fanno più muro': 'The buttons on the right no longer form a wall',
"Sul telefono in piedi, dal primo tasto del menu all'ultimo comando c'era una colonna di pulsanti alta il <b>55% dello schermo</b> lungo tutto il lato destro. I cinque tasti del menu sono passati in alto, in riga sotto l'orologio: si premono ogni tanto e ci si può allungare. In basso restano solo i due verbi, che ora occupano il 17%.":
  'On a phone held upright, from the first menu button to the last control there was a column of buttons <b>55% of the screen tall</b> down the whole right-hand side. The five menu buttons have moved up top, in a row under the clock: you press them now and then, and you can reach. Down below only the two verbs are left, and they now take up 17%.',
'Il pulsante che apriva le porte a volte non rispondeva': 'The button that opens doors sometimes did nothing',
'La linguetta del pannello di prova stava nell\'angolo in basso a destra — che col dito è esattamente il posto dei comandi. In verticale copriva gli ultimi due attrezzi della barra, coricata copriva «Parla». Adesso si sposta di lato.':
  'The test panel tab sat in the bottom-right corner — which, with a finger, is exactly where the controls are. Upright it covered the last two tools on the bar; sideways it covered «Talk». Now it moves out of the way.'
});

/* --- versione 2.7 (changelog.js il censimento lo salta: a mano) --- */
Object.assign(window.LINGUA_EN, {
'Gli abitanti smettono di sembrare storti': 'The villagers stop looking crooked',
'Il bordo scuro non era centrato su nessuno': 'The dark outline was centred on nobody',
'Ogni personaggio della valle — tu compreso — si disegna con un contorno scuro sotto, per staccarlo dallo sfondo. Quel contorno era spostato di due pixel: sporgeva di tre a destra e sotto, e mancava del tutto sopra e a sinistra. Su uno sfondo chiaro sembrava che lo sprite fosse sdoppiato o storto, senza che si riuscisse a mettere a fuoco il perché.':
  'Every character in the valley — you included — is drawn with a dark outline beneath, to lift them off the background. That outline was two pixels out: it stuck out three on the right and below, and was missing entirely above and to the left. Against a light background the sprite looked doubled or crooked, without your quite being able to work out why.',
'A Serafina si vedeva il cappello tagliato': "Serafina's hat came out sliced flat",
"Nel riquadro del dialogo il ritratto inquadra la testa, ma la statura del personaggio la sposta in alto: chi è alto <b>e</b> porta il cappello sbatteva contro il bordo, e la cupola veniva tranciata netta. Adesso l'inquadratura segue la statura, e tutte e sei le facce cadono alla stessa altezza — che è poi quello che si chiede a una cornice di ritratti.":
  'In the dialogue box the portrait frames the head, but a character’s height shifts it upwards: anyone tall <b>and</b> wearing a hat hit the edge, and the crown was cut clean off. Now the framing follows the height, and all six faces sit at the same level — which is what you ask of a row of portraits in the first place.'
});

/* --- convertire un vecchio .json, e cancellare una partita --- */
Object.assign(window.LINGUA_EN, {
'Ho un vecchio file .json da convertire →': 'I have an old .json file to convert →',
'Scegli il file…': 'Choose the file…',
'Questo file non è un salvataggio di Fioralba.': 'This file is not a Fioralba save.',
'Questo file è troppo grande per essere un salvataggio di Fioralba.':
  'This file is too big to be a Fioralba save.',
'Non riesco a leggere il file.': 'I cannot read the file.',

'Cancella questa partita': 'Delete this game',
'Cancellare questa partita?': 'Delete this game?',
"Sparisce dal server e <b>non si recupera</b>. Il codice smette di funzionare, anche per chi ce l'ha su un altro apparecchio.":
  'It disappears from the server and <b>cannot be recovered</b>. The code stops working, including for anyone who has it on another device.',
'Stai per cancellare': 'About to delete',
'È la partita che stai giocando adesso: cancellandola si torna alla pagina iniziale.':
  'This is the game you are playing right now: deleting it takes you back to the front page.',
'Lascia stare': 'Leave it be',
'Cancella per sempre': 'Delete for good',
'cancello…': 'deleting…',
'Partita cancellata.': 'Game deleted.',
'Non riesco a cancellarla.': 'I cannot delete it.',
'Nessuna partita da cancellare.': 'No game to delete.',
'Non riesco a cancellarla: il server non risponde.': 'I cannot delete it: the server is not answering.',
'un minuto fa': 'a minute ago'
});

/* --- versione 2.8 (changelog.js il censimento lo salta: a mano) --- */
Object.assign(window.LINGUA_EN, {
'I vecchi file .json si convertono, e le partite si cancellano':
  'Old .json files can be converted, and games can be deleted',
'Il tuo vecchio salvataggio .json entra nel giro nuovo': 'Your old .json save joins the new setup',
"Per mesi Fioralba ha esportato salvataggi in file .json, e in giro ce ne sono: sul desktop, nella cartella dei download, spediti a un amico. Adesso in fondo alla finestra di «Continua» c'è un rimando: scegli il file, e la partita sale sul server con un codice suo. È una porta a senso unico — si entra nel sistema nuovo e non si esce — e il file di partenza non viene toccato: se qualcosa non va, non hai perso niente.":
  'For months Fioralba exported saves as .json files, and they are out there: on the desktop, in the downloads folder, emailed to a friend. Now at the bottom of the «Continue» window there is a link: choose the file, and the game goes up to the server with a code of its own. It is a one-way door — you come into the new setup and you do not go back out — and the original file is left untouched: if anything goes wrong, you have lost nothing.',
'Le partite si possono cancellare': 'Games can be deleted',
"Accanto a ogni partita dell'elenco c'è un cestino. Prima di cancellare ti facciamo rileggere cosa stai buttando — nome, a che punto sei, quante monete — perché in un elenco di codici che si somigliano tutti il cestino sbagliato è un gesto facile, e di là non c'è nessun cestino da cui ripescare. E si cancella <b>davvero</b>, dal server: toglierla solo dal proprio apparecchio non sarebbe cancellare, sarebbe nascondere, col codice che continua a funzionare e nessuno che se lo ricordi più.":
  'Next to every game in the list there is a bin. Before deleting we make you read back what you are throwing away — name, how far you have got, how many coins — because in a list of codes that all look alike, the wrong bin is an easy gesture, and on the other side there is no wastebasket to fish it out of. And it really <b>is</b> deleted, from the server: removing it only from your own device would not be deleting, it would be hiding, with the code still working and nobody left who remembers it.'
});

/* --- versione 2.9 (changelog.js il censimento lo salta: a mano) --- */
Object.assign(window.LINGUA_EN, {
'Gli abitanti finiscono le frasi': 'The villagers get to finish their sentences',
'Le nuvolette tagliavano la battuta a metà': 'Speech bubbles cut the line in half',
"Più della metà di quello che la gente dice in giro per la valle arrivava troncato — 33 battute su 60 — e siccome sono quasi tutte a due tempi, veniva tagliata sempre la seconda: <b>«Ilde saliva fin qui ogni inverno, con una fetta di torta.»</b> e via il resto, che era «Non parlava. Guardava e basta.» Restava l'informazione e spariva il ricordo. Adesso ci stanno tutte, in italiano e in inglese.":
  'More than half of what people say around the valley arrived cut short — 33 lines out of 60 — and since they are nearly all in two beats, it was always the second one that went: <b>«Ilde came up here every winter, with a slice of cake.»</b> and away with the rest, which was «She never spoke. She just watched.» The information stayed and the memory vanished. Now they all fit, in Italian and in English.',
'Una riga su quattro veniva buttata via': 'One line in four was thrown away',
"La nuvoletta smetteva di riempirsi una riga prima del dovuto: l'ultima conteneva una parola sola e tutto il resto della frase spariva. Di ottantaquattro caratteri disponibili se ne usavano una cinquantina.":
  'The bubble stopped filling one line early: the last one held a single word and all the rest of the sentence disappeared. Of eighty-four characters available, about fifty were used.'
});
