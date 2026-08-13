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
