/* ===================================================================
   FIORALBA — traguardi.js
   Quello che il Diario conta e paga: i traguardi, la Collezione del
   Naturalista, le statistiche.

   Era in game.js, e ne è uscito per primo perché era il pezzo che di
   game.js non usava niente: zero funzioni private prese, zero funzioni
   proprie chiamate da fuori. Le nove funzioni stavano già tutte appese a
   `G.`, cioè erano già pubbliche — mancava solo il file. Le chiamano il
   Diario (`UI.diario`) e il pannello di prova, sempre come `G.obiettivi()`,
   `G.contaCollezione()`: i punti di chiamata non sono cambiati di una
   lettera, perché è game.js a rimetterle su `G` con un `Object.assign`.

   Quell'unica riga è il prezzo, ed è nominato: questo file si carica
   PRIMA di game.js e quindi al caricamento `G` non esiste ancora — come
   salvataggio.js e solstizio.js, che infatti si fanno riappendere allo
   stesso modo. Dentro le funzioni `G` c'è, ed è lì che si legge lo stato.

   Il codice dice `obiettivi` dove il gioco dice «traguardi»: il nome
   vecchio è nei salvataggi (`obiettiviRiscossi`) e cambiarlo vorrebbe
   dire una migrazione per una parola.
   =================================================================== */
(function(){

const TG = {};
window.TRAGUARDI = TG;

/* ===================================================================
   COLLEZIONE DEL NATURALISTA
   =================================================================== */
/* Ogni categoria ha un `id` oltre al nome. Il nome è quello che si legge
   e cambia con la lingua; l'id è quello con cui si ricorda che il premio
   è già stato riscosso, e quello non deve cambiare mai — chi gioca in
   inglese e poi torna in italiano non deve poter riscuotere due volte. */
TG.categorieCollezione = function(){
  const F = c => Object.keys(DATA.ITEMS).filter(k=>DATA.ITEMS[k].cat===c && !DATA.ITEMS[k].spazzatura);
  return [
    { id:'pesci',    nome:'Pesci',    icona:'canna',      ids:F('pesce')    },
    { id:'minerali', nome:'Minerali', icona:'gemma_luna', ids:F('minerale') },
    { id:'colture',  nome:'Colture',  icona:'zappa',      ids:F('raccolto') },
    { id:'foraggio', nome:'Foraggio', icona:'viola',      ids:F('foraggio') },
    { id:'piatti',   nome:'Piatti',   icona:'frittata',   ids:DATA.CUCINA.map(r=>r.id) }
  ];
};
TG.contaCollezione = function(){
  const coll = G.collezione||{}, r={}; let totD=0, totT=0;
  for(const c of G.categorieCollezione()){
    const d = c.ids.filter(id=>coll[id]).length;
    r[c.id] = { d, t:c.ids.length };
    totD+=d; totT+=c.ids.length;
  }
  r.tot={d:totD, t:totT};
  return r;
};

/* --- il premio di una collezione completata ---

   Completare una casella non dava niente: il contatore passava a 10/10 e
   restava lì. Era l'unica cosa del Diario che si riempie senza che
   nessuno se ne accorga — le richieste pagano, la sagra paga, i
   traguardi pagano, e la vetrina no.

   Si riscuote a mano e non da sola: una collezione si completa pescando
   di notte o scavando in fondo alla miniera, cioè in un momento in cui
   una finestra a schermo è un'interruzione. Il premio aspetta nel
   Diario, dove uno ci arriva quando ha finito.

   L'oggetto segue la stessa regola dei premi di livello: se lo zaino è
   pieno non si perde, va in `premiSospesi`. Ed è il caso normale, non
   quello raro — si completa una collezione raccogliendo. */
TG.premioCollezione = function(idCat){
  return (DATA.PREMI_COLLEZIONE || {})[idCat] || null;
};
TG.collezioneCompleta = function(idCat){
  const c = G.categorieCollezione().find(x=>x.id===idCat);
  if(!c || !c.ids.length) return false;
  const coll = G.collezione||{};
  return c.ids.every(id=>coll[id]);
};
TG.collezioneRiscossa = function(idCat){
  if(!G.obiettiviRiscossi) return false;
  if(G.obiettiviRiscossi['coll_'+idCat]) return true;
  /* Chi ha una partita avviata può aver già riscosso «Ittiologo» o
     «Gemmologo», che pagavano esattamente questo. Il premio è lo stesso
     e l'ha già preso: qui vale come riscosso, altrimenti la stessa
     collezione pagherebbe due volte proprio a chi gioca da più tempo. */
  const vecchio = (DATA.COLLEZIONE_DA_TRAGUARDO || {})[idCat];
  return !!(vecchio && G.obiettiviRiscossi[vecchio]);
};
TG.riscuotiCollezione = function(idCat){
  if(!G.collezioneCompleta(idCat) || G.collezioneRiscossa(idCat)) return null;
  const P = G.premioCollezione(idCat);
  if(!P) return null;
  if(!G.obiettiviRiscossi) G.obiettiviRiscossi = {};
  G.obiettiviRiscossi['coll_'+idCat] = true;

  const dato = { oro:P.oro||0, item:P.item, n:P.n||0, sospeso:false };
  if(P.oro){ G.oro += P.oro; G.registraVendita(0); }
  if(P.item && P.n){
    if(G.puoiAggiungere(P.item, P.n)) G.aggiungi(P.item, P.n);
    else { G.premiSospesi.push({ item:P.item, n:P.n, da:'collezione', liv:0 }); dato.sospeso = true; }
  }
  SND.play('livello');
  return dato;
};

/* I traguardi dicevano cosa serve — «Frantuma 100 rocce» — ma non dove
   si trovano cento rocce né con cosa si frantumano. Chi sa già giocare
   lo indovina; chi ha appena cominciato legge un compito e non un
   suggerimento. `come` è la riga che manca: dove andare, con cosa, e
   quale scorciatoia c'è se una c'è. */
TG.obiettivi = function(){
  const s=G.stats, o=[];
  const cc=G.contaCollezione();
  // conta (id,nome,icona,desc, valore corrente, traguardo, premio, come)
  const cont=(id,nome,icona,desc,cur,tot,premio,come)=>o.push({
    id, nome, icona, desc, premio, come,
    prog: Math.min(tot,cur)+'/'+tot, fatto: cur>=tot });
  // traguardo booleano (fatto/da fare)
  const flag=(id,nome,icona,desc,ok,premio,come)=>o.push({
    id, nome, icona, desc, premio, come,
    prog: ok?'fatto':'da fare', fatto: !!ok });

  cont('mani_terra','Mani nella terra','zappa','Raccogli 50 prodotti dal campo.', s.raccolti,50,500,
    'Nel <b>podere</b>, dentro il campo recintato. Zappa la terra, semina, annaffia ogni giorno e raccogli quando la pianta è matura. '+
    'I semi li vende <b>Bruno</b> in bottega, e ogni stagione ha i suoi: quelli fuori stagione appassiscono.');
  cont('boscaiolo','Boscaiolo','legna','Abbatti 25 alberi.', s.alberi,25,500,
    'Con l\'<b>ascia</b>, e conta solo l\'albero adulto — non il ceppo che resta. Ce ne sono nel <b>podere</b> e tanti nel <b>bosco</b>. '+
    'Ogni tanto cade un seme d\'albero lì vicino: se lo lasci crescere, gli alberi non finiscono mai.');
  cont('cuore_pietra','Cuore di pietra','piccone','Frantuma 100 rocce.', s.sassi,100,600,
    'Con il <b>piccone</b>. Nella <b>miniera</b> (l\'ingresso è nel bosco) ce ne sono a ogni livello, e più scendi più fruttano. '+
    'Anche i sassi sparsi nel podere contano.');
  cont('pescatore','Pescatore paziente','canna','Pesca 30 pesci.', s.pesci,30,700,
    'Con la <b>canna</b>, mettendoti sulla riva e mirando all\'acqua. Fiume del paese, lago del bosco, mare della <b>Costa</b>. '+
    'La spazzatura non conta: contano solo i pesci veri.');
  cont('cuoco','Ai fornelli','frittata','Cucina 20 piatti in cucina.', s.piatti||0,20,800,
    'Serve l\'<b>Ampliamento Casa</b>: fino ad allora in casa c\'è il focolare ma non una cucina vera. '+
    'Poi entra in casa e usa i fornelli. Le ricette si sbloccano parlando con gli abitanti e salendo di livello.');
  cont('generoso','Cuore generoso','miele','Fai 15 regali graditi agli abitanti.', s.regali||0,15,700,
    'Tieni in mano l\'oggetto e parla con qualcuno: te lo chiederà. Conta solo se il regalo gli <b>piace</b> — '+
    'i gusti di ognuno li trovi in <b>Diario → Abitanti</b>. Uno a testa al giorno.');
  cont('factotum','Persona di fiducia','medaglione','Completa 15 richieste della bacheca.', s.richiesteFatte||0,15,1200,
    'La <b>bacheca</b> è al porto, in paese. Ti chiedono un oggetto entro un tot di giorni: prendilo, torna alla bacheca e consegna. '+
    'Le richieste aperte le vedi in <b>Diario → Richieste</b>.');
  cont('festaiolo','Anima delle sagre','melagrana','Vinci 3 sagre di stagione.', s.sagre||0,3,1500,
    'Una per stagione, in <b>piazza</b>. Bisogna portare il prodotto migliore che hai: la qualità conta più della quantità, '+
    'quindi conserva i raccolti belli invece di venderli subito.');
  flag('esploratore','Conosci la valle','viola','Visita bosco, miniera e paese.',
       s.visitatoBosco && s.visitatoGrotta && s.visitatoPaese, 400,
    'Il <b>paese</b> è a est del podere, il <b>bosco</b> a nord, e la <b>miniera</b> si apre dentro il bosco. '+
    'Basta metterci piede una volta.');
  flag('ponte','Il ponte','legna','Costruisci il ponte per la radura.', G.costruzioni.ponte, 400,
    'Servono <b>100 legna</b>, <b>40 pietra</b> e 3000 monete. Si ordina da <b>Tobia</b> alla fucina — '+
    'o dall\'incudine, se lui non c\'è. Apre la radura oltre il ruscello.');
  flag('serra','Sotto vetro','seme_cristallia','Costruisci la serra.', G.costruzioni.serra, 800,
    'La costruzione più cara: <b>200 legna</b>, <b>120 pietra</b>, <b>5 lingotti d\'oro</b> e 12.000 monete, sempre da Tobia. '+
    'Dentro si coltiva tutto l\'anno, anche d\'inverno.');
  cont('benestante','Benestante','lingotto_oro','Accumula 50.000 monete guadagnate.', s.guadagno,50000,3000,
    'Conta il <b>totale guadagnato</b>, non quello che hai in tasca: spendere non ti fa tornare indietro. '+
    'La strada breve è trasformare — l\'uva cruda vale 76 monete, il vino 228 — con botte, barattoliera e forno.');
  /* «Ittiologo» e «Gemmologo» stavano qui e davano 1600 monete ciascuno
     per aver scoperto tutti i pesci e tutti i minerali. Adesso quelle
     due collezioni pagano nella scheda Collezione, dove uno le completa
     e dove vede il contatore arrivare a 15/15: pagarle anche qui
     sarebbe lo stesso gesto contato due volte, e le altre tre
     collezioni non avevano niente. Le cifre sono passate di là
     identiche (DATA.PREMI_COLLEZIONE), quindi nessuno prende meno. */
  cont('collezionista','Collezionista','medaglione','Completa la Collezione del Naturalista.', cc.tot.d, cc.tot.t, 4000,
    'È la somma di tutte le altre: pesci, minerali, raccolti e cose trovate in giro. '+
    'Basta averne visto uno di ogni tipo, non serve tenerlo.');
  return o;
};

/* riscuoti la ricompensa di un traguardo completato */
TG.riscuotiObiettivo = function(o){
  if(!o || !o.fatto) return false;
  if(!G.obiettiviRiscossi) G.obiettiviRiscossi={};
  if(G.obiettiviRiscossi[o.id]) return false;
  G.obiettiviRiscossi[o.id]=true;
  if(o.premio){ G.oro += o.premio; }
  SND.play('livello');
  return true;
};

TG.statistiche = function(){
  return [
    ['Giorni al podere', G.stats.giorniGiocati],
    ['Prodotti raccolti', G.stats.raccolti],
    ['Alberi abbattuti', G.stats.alberi],
    ['Rocce frantumate', G.stats.sassi],
    ['Pesci pescati', G.stats.pesci],
    ['Guadagno totale', G.stats.guadagno.toLocaleString('it-IT')+' monete'],
    ['Braci accese', G.braci+'/4'],
    ['Stagione', G.stagione().nome+' '+G.giorno+', Anno '+G.anno]
  ];
};

})();
