#!/usr/bin/env node
/* ===================================================================
   FIORALBA — prova delle migrazioni di scenario

   `coerenza.js` controlla la valle appena costruita. Questa prova carica
   invece il lettore dei salvataggi in una piccola pagina finta: verifica sia
   il formato nuovo a delta sia un salvataggio del formato precedente.
   =================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RADICE = path.join(__dirname, '..');
const sorgente = file => fs.readFileSync(path.join(RADICE, file), 'utf8');
const scenarioVecchio = {
  formato:'fioralba-scenario', versione:1, edizione:1, mappa:'podere',
  w:52, h:44, ritocchi:{terreno:[],oggetti:[],decorazioni:[]}
};
/* L'acqua nuova occupa volutamente il posto della cassa: la delta deve
   traslocarla e non perdere né la cassa né il campo coltivato. */
let scenarioNuovo;
const scenarioNuovoBase = {
  formato:'fioralba-scenario', versione:1, edizione:2, mappa:'podere',
  w:52, h:44,
  ritocchi:{terreno:[
    {x:25,y:25,da:'erba',tipo:'acqua'},
    {x:24,y:25,da:'erba',tipo:'acqua'}
  ],oggetti:[],decorazioni:[]}
};

let attivo = scenarioVecchio;
const sandbox = {
  window:{}, console, Math, Uint8Array, Array, JSON,
  performance:{now:()=>0}
};
vm.createContext(sandbox);
for(const file of ['js/data.js','js/world.js'])
  vm.runInContext(sorgente(file),sandbox,{filename:file});

const WORLD = sandbox.window.WORLD;
sandbox.WORLD = WORLD;   // il browser espone anche window.WORLD come globale
const podereBase = WORLD.crea().podere, spazioSilo = podereBase.spazi.silo;
scenarioNuovo = {
  ...scenarioNuovoBase,
  ritocchi:{
    ...scenarioNuovoBase.ritocchi,
    terreno:[
      ...scenarioNuovoBase.ritocchi.terreno,
      {x:spazioSilo.x,y:spazioSilo.y,
       da:WORLD.terreno(podereBase,spazioSilo.x,spazioSilo.y),tipo:'acqua'}
    ]
  }
};
sandbox.window.SCENARI = {
  applica(mappe,conserva){
    return {podere:WORLD.applicaScenario(mappe.podere,attivo,conserva)};
  },
  versioni(mappe){
    const tutte={};
    for(const id of Object.keys(mappe)) tutte[id]=id==='podere'?attivo.edizione:0;
    return tutte;
  }
};
sandbox.SCENARI = sandbox.window.SCENARI;

function statoIniziale(){
  return {
    nomeGiocatore:'Prova',mappaId:'podere',oro:0,energia:260,energiaMax:260,
    energiaBonus:0,giorno:1,stagioneIdx:0,anno:1,giornoTot:0,ora:360,
    meteo:'sereno',meteoDomani:'sereno',inv:[],invMax:27,slotSel:0,
    skills:{},attrezziLiv:{},amicizia:{},costruzioni:{},santuario:{},
    santuarioDato:{},braci:0,lettere:{},ricetteNote:{},cassaConsegna:[],
    stats:{},animali:[],look:{},vistoFiammella:false,introSerafina:false,
    vistoPesca:false,sacaccia:false,lezioneCaccia:null,tutorialFatto:false,
    guidaAperta:false,guidaNascosta:false,regaloRicevuto:{},mercato:null,
    gelo:false,richieste:[],richiestaSeq:0,premiSospesi:[],arrediSpostati:[],
    bottiglieLette:[],serie:{},gatto:{},obiettiviRiscossi:{},sagra:null,
    mercante:{},trame:{},vicende:{},persona:{},visitati:{podere:true},
    collezione:{}
  };
}
sandbox.window.G = {
  statoIniziale,normalizzaStato(){},p:{px:0,py:0},maps:null
};
sandbox.G = sandbox.window.G;   // come sopra, per il lettore del salvataggio
vm.runInContext(sorgente('js/salvataggio.js'),sandbox,{filename:'js/salvataggio.js'});

const G=sandbox.window.G, SALVA=sandbox.window.SALVA;
Object.assign(G,statoIniziale());
G.p={px:8*64+32,py:10*64+32};
G.maps=WORLD.crea();
sandbox.window.SCENARI.applica(G.maps,false);
G.costruzioni={silo:true};
WORLD.costruisci(G.maps,'silo');
const indice=25+25*G.maps.podere.w;
G.maps.podere.obj[indice]={t:'macchina',kind:'cassa',solido:true,slots:[{id:'legna',n:4}]};
G.maps.podere.suolo[24+25*G.maps.podere.w]={arato:true,bagnato:true,crop:{id:'rapa',giorni:2}};

const testo=SALVA.testo();
const nuovo=JSON.parse(testo);
if(!nuovo.versioniScenario || nuovo.versioniScenario.podere!==1 ||
   !nuovo.maps.podere.giocatore)
  throw new Error('il formato nuovo non registra edizione e delta del giocatore');

attivo=scenarioNuovo;
const aperto=SALVA.applicaTesto(testo);
if(!aperto.ok) throw new Error('il salvataggio a delta non si riapre: '+aperto.err);
const podere=G.maps.podere;
const cassa=podere.obj.find(o=>o && o.t==='macchina' && o.kind==='cassa');
const coltura=podere.suolo.find(Boolean);
const silo=podere.obj[WORLD.idx(podere,spazioSilo.x,spazioSilo.y)];
if(!cassa || !coltura || !silo || silo.t!=='silo' ||
   WORLD.solido(podere,spazioSilo.x,spazioSilo.y) && WORLD.terreno(podere,spazioSilo.x,spazioSilo.y)==='acqua')
  throw new Error('la migrazione perde o rende inutilizzabile una costruzione, un campo o una cassa');
if(WORLD.verificaMappe(G.maps).length)
  throw new Error('la migrazione lascia collisioni o collegamenti bloccati');
/* I primi salvataggi a delta contenevano anche il silo come oggetto. La
   compatibilità deve ignorare quella vecchia voce, perché `costruzioni` lo
   ha già ricostruito nella sua impronta prima di applicare la delta. */
const deltaStorica=JSON.parse(testo), indiceSilo=WORLD.idx(podere,spazioSilo.x,spazioSilo.y);
deltaStorica.maps.podere.giocatore.oggetti[indiceSilo]={da:null,a:{t:'silo',solido:true}};
const storico=SALVA.applicaTesto(JSON.stringify(deltaStorica));
const silosStorici=G.maps.podere.obj.filter(o=>o && o.t==='silo');
if(!storico.ok || silosStorici.length!==1 ||
   !G.maps.podere.obj[indiceSilo] || G.maps.podere.obj[indiceSilo].t!=='silo')
  throw new Error('una delta storica duplica o sposta il silo ricostruito');

/* Il controllo dell'editor deve lasciare passare una modifica isolata e
   fermare invece l'unico caso che può murare davvero un collegamento. */
const provaCollegamenti=WORLD.crea(), uscita=provaCollegamenti.podere.warps[0];
const normale={podere:new Set(['25,25'])};
if(WORLD.verificaMappe(provaCollegamenti,normale).length)
  throw new Error('il controllo degli scenari segnala una modifica innocua');
const bloccata={podere:new Set()};
for(let dy=0;dy<uscita.h;dy++) for(let dx=0;dx<uscita.w;dx++){
  const x=uscita.x+dx,y=uscita.y+dy;
  provaCollegamenti.podere.g[WORLD.idx(provaCollegamenti.podere,x,y)]=WORLD.ti('acqua');
  bloccata.podere.add(x+','+y);
}
if(!WORLD.verificaMappe(provaCollegamenti,bloccata).some(p=>p.includes('uscita')))
  throw new Error('il controllo degli scenari non rileva un passaggio bloccato');
for(const tipo of ['terreno','oggetto']){
  const provaArrivo=WORLD.crea(), destinazione=provaArrivo[uscita.to];
  const i=WORLD.idx(destinazione,uscita.tx,uscita.ty);
  if(tipo==='terreno') destinazione.g[i]=WORLD.ti('acqua');
  else destinazione.obj[i]={t:'panchina',solido:true};
  const toccato={[uscita.to]:new Set([uscita.tx+','+uscita.ty])};
  if(!WORLD.verificaMappe(provaArrivo,toccato).some(p=>p.includes('collegamento')))
    throw new Error('il controllo degli scenari non rileva un arrivo bloccato dal '+tipo);
}
const provaBarca=WORLD.crea(), spiaggia=provaBarca.spiaggia;
let acqua=-1;
for(let i=0;i<spiaggia.g.length;i++) if(WORLD.terreno(spiaggia,i%spiaggia.w,(i/spiaggia.w)|0)==='acqua' && !spiaggia.obj[i]){
  acqua=i; break;
}
if(acqua<0) throw new Error('la prova non trova acqua libera per la barca');
spiaggia.obj[acqua]={t:'barca',solido:true};
const barcaToccata={spiaggia:new Set([(acqua%spiaggia.w)+','+((acqua/spiaggia.w)|0)])};
if(WORLD.verificaMappe(provaBarca,barcaToccata).length)
  throw new Error('il controllo degli scenari rifiuta una barca valida sull’acqua');

/* Un salvataggio senza `giocatore` è quello prodotto dal formato precedente.
   Deve restare leggibile e non può perdere le casse appoggiate sulla mappa. */
const legacy=JSON.parse(testo);
const m=legacy.maps.podere, intero=WORLD.crea().podere;
m.g=Array.from(intero.g); m.obj={}; m.suolo={};
m.obj[indice]={t:'macchina',kind:'cassa',solido:true,slots:[]};
delete m.giocatore;
attivo=scenarioNuovo;
const vecchio=SALVA.applicaTesto(JSON.stringify(legacy));
if(!vecchio.ok || !G.maps.podere.obj.some(o=>o && o.t==='macchina' && o.kind==='cassa'))
  throw new Error('il salvataggio legacy non conserva la cassa del giocatore');

console.log('  ✓ migrazione scenari: formato nuovo e salvataggi legacy');