/* ===================================================================
   FIORALBA — editor-interno.js

   Un banco di prova nella partita, non un secondo editor completo:
   permette di muovere soltanto scenografia sicura, tiene i cambiamenti
   soltanto in memoria e scarica lo stesso delta JSON che comprende
   l'editor locale. Questo file viene innestato dal server esclusivamente
   nelle anteprime/test; non fa parte della risposta pubblica.
   =================================================================== */
(function(){
'use strict';

/* `server.js` inserisce questo consenso soltanto nell'anteprima/test. Nella
   pagina pubblica il file resta inerte: non registra finestre, input o API. */
if(!window.FIORALBA_MODIFICA_INTERNA) return;

const E = {};
window.EDITOR_INTERNO = E;

const T = 64;
const $ = s=>document.querySelector(s);
const AMBIENTALI = new Set(['albero','cespuglio','fiori','sasso','panchina','fioriera','lampione','lume']);
const MOBILI_AMBIENTALI = new Set(['recinto','cancelletto','cartello']);

let aperto=false, basi=null, selezione=null, mira=null, spostamento=false;
let modifiche=new Map(), cronologia=[], originali=new Map(), toccoNascosto=true;

function copiaSicura(v, visti){
  if(v===null || typeof v!=='object') return v;
  visti=visti||new WeakSet();
  if(visti.has(v)) return undefined;
  visti.add(v);
  if(Array.isArray(v)) return v.map(x=>copiaSicura(x,visti)).filter(x=>x!==undefined);
  const uscita={};
  for(const k of Object.keys(v)){
    if(k==='ed') continue; // gli edifici rimandano alla mappa e sono circolari
    const valore=copiaSicura(v[k],visti);
    if(valore!==undefined && typeof valore!=='function') uscita[k]=valore;
  }
  return uscita;
}
function uguale(a,b){ return JSON.stringify(copiaSicura(a))===JSON.stringify(copiaSicura(b)); }
function chiave(m,x,y){ return m+'@'+x+','+y; }
function nomeOggetto(o){
  if(!o) return 'oggetto';
  const n=o.kind||o.t||'oggetto';
  return n.charAt(0).toUpperCase()+n.slice(1);
}
function attuale(){ return G && G.mappa ? G.mappa() : null; }
function spazioRiservato(m,x,y){
  /* La bozza deve superare la stessa validazione dell'editor locale: gli
     spazi promessi a costruzioni restano intoccabili anche quando la
     costruzione è già stata realizzata nella partita aperta. */
  if(m.spazi && Object.values(m.spazi).some(s=>
    x>=s.x-1 && x<s.x+s.w+1 && y>=s.y-1 && y<s.y+s.h+1
  )) return true;
  if(WORLD.riservata && WORLD.riservata(m,x,y,G.costruzioni)) return true;
  if((m.warps||[]).some(w=>x>=w.x && x<w.x+w.w && y>=w.y && y<w.y+w.h)) return true;
  return false;
}
function ambientale(o){
  return !!o && (AMBIENTALI.has(o.t) || (o.t==='mobile' && MOBILI_AMBIENTALI.has(o.kind)));
}
function bozzaIn(m,x,y){
  for(const b of modifiche.values())
    if(b.mappa===m.id && b.a.x===x && b.a.y===y) return b;
  return null;
}
function baseDa(m,x,y){
  const base=basi && basi[m.id];
  if(!base || !WORLD.oggetto) return null;
  const trovato=WORLD.oggetto(base,x,y);
  return trovato && trovato.x===x && trovato.y===y ? trovato : null;
}
function ricorda(m, x, y){
  const k=chiave(m.id,x,y);
  if(!originali.has(k))
    originali.set(k,{mappa:m.id,indice:WORLD.idx(m,x,y),oggetto:m.obj[WORLD.idx(m,x,y)]});
}
function ripristinaOggetti(){
  for(const voce of originali.values()){
    const m=G.maps && G.maps[voce.mappa];
    if(m) m.obj[voce.indice]=voce.oggetto;
  }
  originali.clear();
  modifiche.clear();
  cronologia.length=0;
  selezione=null; mira=null; spostamento=false;
  if(REND.invalidaTerreno) REND.invalidaTerreno();
}
function messaggio(testo){
  const el=$('#editor-istruzioni');
  if(el) el.textContent=testo;
}
function aggiornaPannello(){
  const m=attuale(), stato=$('#editor-stato');
  const bSposta=$('#editor-sposta'), bAnnulla=$('#editor-annulla');
  const bAzzera=$('#editor-azzera'), bEsporta=$('#editor-esporta');
  if(stato){
    const scelta=selezione
      ? 'Selezionato: '+nomeOggetto(selezione.obj)+' · ('+selezione.x+', '+selezione.y+')'
      : (m ? m.nome+' · nessun elemento selezionato' : 'Nessuna mappa aperta');
    const n=modifiche.size;
    stato.textContent=scelta+(n ? ' · '+n+' spostamento'+(n===1?'':'i')+' in bozza' : '');
  }
  if(bSposta){ bSposta.disabled=!selezione; bSposta.textContent=spostamento?'Scegli destinazione':'Sposta'; }
  if(bAnnulla) bAnnulla.disabled=!cronologia.length;
  if(bAzzera) bAzzera.disabled=!modifiche.size;
  if(bEsporta) bEsporta.disabled=!modifiche.size;
}
function aggiornaMira(e,cvs){
  const r=cvs.getBoundingClientRect();
  const mondo=REND.schermoAMondo(e.clientX-r.left,e.clientY-r.top,G.cam);
  mira={x:Math.floor(mondo.x/T),y:Math.floor(mondo.y/T)};
  E.aggiornaOverlay();
}
function seleziona(x,y){
  const m=attuale();
  if(!m || !WORLD.dentro(m,x,y)){ messaggio('Quella casella non appartiene alla mappa.'); return; }
  const trovato=WORLD.oggetto(m,x,y);
  if(!trovato){ selezione=null; spostamento=false; messaggio('Qui non c’è un elemento da spostare.'); aggiornaPannello(); return; }
  const bozza=bozzaIn(m,trovato.x,trovato.y);
  const base=bozza ? null : baseDa(m,trovato.x,trovato.y);
  const da=bozza ? bozza.da : (base && base.obj);
  if(spazioRiservato(m,trovato.x,trovato.y) || !ambientale(trovato.obj) || !da || !uguale(trovato.obj,da)){
    selezione=null; spostamento=false;
    messaggio('Questo elemento è protetto: si spostano solo elementi scenografici della mappa base.');
    aggiornaPannello();
    return;
  }
  selezione={
    mappa:m.id, x:trovato.x, y:trovato.y, obj:trovato.obj,
    origine:bozza ? {x:bozza.x,y:bozza.y} : {x:trovato.x,y:trovato.y},
    da:copiaSicura(da)
  };
  spostamento=false;
  messaggio('Elemento selezionato. Premi “Sposta”, poi tocca una casella libera.');
  aggiornaPannello();
}
function destinazioneValida(m,x,y){
  if(!WORLD.dentro(m,x,y)) return 'Fuori dalla mappa.';
  if(spazioRiservato(m,x,y)) return 'Questa casella è riservata a un edificio o a un passaggio.';
  if(m.obj[WORLD.idx(m,x,y)]) return 'La destinazione è già occupata.';
  if(m.suolo && m.suolo[WORLD.idx(m,x,y)]) return 'Non si posa scenografia su un campo coltivato.';
  const terreno=WORLD.terreno(m,x,y);
  if(['acqua','roccia','vuoto'].includes(terreno)) return 'La scenografia non può stare su '+terreno+'.';
  const px=(G.p.px/T)|0, py=(G.p.py/T)|0;
  if(m.id===G.mappaId && px===x && py===y) return 'Sposta prima il contadino da questa casella.';
  return null;
}
function sposta(x,y){
  if(!selezione) return;
  const m=attuale();
  if(!m || selezione.mappa!==m.id){ messaggio('L’oggetto selezionato non è su questa mappa.'); return; }
  if(x===selezione.x && y===selezione.y){ spostamento=false; messaggio('L’oggetto è già lì.'); aggiornaPannello(); return; }
  const errore=destinazioneValida(m,x,y);
  if(errore){ messaggio(errore); return; }
  const prima={x:selezione.x,y:selezione.y};
  ricorda(m,prima.x,prima.y); ricorda(m,x,y);
  m.obj[WORLD.idx(m,prima.x,prima.y)]=null;
  m.obj[WORLD.idx(m,x,y)]=selezione.obj;
  const k=chiave(m.id,selezione.origine.x,selezione.origine.y);
  const precedente=modifiche.get(k);
  const bozza={
    mappa:m.id, x:selezione.origine.x, y:selezione.origine.y,
    a:{x,y}, da:selezione.da
  };
  modifiche.set(k,bozza);
  cronologia.push({mappa:m.id, da:prima, a:{x,y}, origine:selezione.origine,
                   obj:selezione.obj, precedente});
  selezione={...selezione,x,y};
  spostamento=false;
  if(REND.invalidaTerreno) REND.invalidaTerreno();
  messaggio(nomeOggetto(selezione.obj)+' spostato. Scarica la bozza quando il risultato ti convince.');
  aggiornaPannello();
}
function annulla(){
  const ultima=cronologia.pop();
  if(!ultima) return;
  const m=G.maps[ultima.mappa];
  if(!m) return;
  m.obj[WORLD.idx(m,ultima.a.x,ultima.a.y)]=null;
  m.obj[WORLD.idx(m,ultima.da.x,ultima.da.y)]=ultima.obj;
  const k=chiave(ultima.mappa,ultima.origine.x,ultima.origine.y);
  if(ultima.precedente) modifiche.set(k,ultima.precedente); else modifiche.delete(k);
  if(selezione && selezione.mappa===ultima.mappa)
    selezione={...selezione,x:ultima.da.x,y:ultima.da.y};
  spostamento=false;
  if(REND.invalidaTerreno) REND.invalidaTerreno();
  messaggio('Ultimo spostamento annullato.');
  aggiornaPannello();
}
function scarica(){
  if(!modifiche.size) return;
  const [prima]=modifiche.values();
  const tutte=[...modifiche.values()];
  if(tutte.some(v=>v.mappa!==prima.mappa)){
    messaggio('Scarica una bozza per mappa: chiudi, cambia mappa e riapri la modalità.');
    return;
  }
  const m=G.maps[prima.mappa];
  const scenario={
    formato:'fioralba-scenario', versione:1, mappa:m.id, nome:m.nome, w:m.w, h:m.h,
    ritocchi:{terreno:[],oggetti:tutte.map(v=>({
      azione:'sposta', x:v.x, y:v.y, a:{x:v.a.x,y:v.a.y}, da:v.da
    })),decorazioni:[]}
  };
  const file=new Blob([JSON.stringify(scenario,null,2)+'\n'],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(file);
  a.download=m.id+'-bozza-modifica.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),0);
  messaggio('Bozza scaricata. Aprila nell’editor locale per validarla e approvarla.');
}
function esci(){
  if(!aperto) return;
  ripristinaOggetti();
  aperto=false;
  $('#editor-interno').classList.add('hidden');
  $('#editor-selezione').classList.add('hidden');
  $('#editor-destinazione').classList.add('hidden');
  document.body.classList.remove('modalita-modifica-attiva');
  if(!toccoNascosto) $('#tocco').classList.remove('hidden');
  UI.prompt(null);
  if(G.fermaInput) G.fermaInput();
}

E.disponibile=()=>true;
E.attivo=()=>aperto;
E.apri=function(){
  if(aperto || !G.inGioco) return;
  basi=WORLD.crea();
  if(window.SCENARI) SCENARI.applica(basi,false);
  aperto=true;
  selezione=null; mira=null; spostamento=false;
  modifiche.clear(); cronologia.length=0; originali.clear();
  toccoNascosto=$('#tocco').classList.contains('hidden');
  $('#tocco').classList.add('hidden');
  document.body.classList.add('modalita-modifica-attiva');
  $('#editor-interno').classList.remove('hidden');
  if(G.fermaInput) G.fermaInput();
  messaggio('Tocca un elemento della scenografia per selezionarlo. Esc esce senza salvare.');
  aggiornaPannello();
};
E.gestisciTasto=function(e){
  if(!aperto) return false;
  const k=e.key.toLowerCase();
  if(k==='escape'){ esci(); return true; }
  if((e.ctrlKey || e.metaKey) && k==='z'){ annulla(); return true; }
  if(k==='enter' || k==='s'){
    if(selezione){ spostamento=true; messaggio('Tocca una casella libera come destinazione.'); aggiornaPannello(); }
    return true;
  }
  return true; // in modalità modifica nessun tasto deve arrivare al gioco
};
E.muoviPuntatore=function(e,cvs){
  if(!aperto) return false;
  aggiornaMira(e,cvs);
  return true;
};
E.gestisciPuntatore=function(e,cvs){
  if(!aperto) return false;
  if(e.button!==undefined && e.button!==0) return true;
  aggiornaMira(e,cvs);
  if(!mira) return true;
  if(spostamento) sposta(mira.x,mira.y); else seleziona(mira.x,mira.y);
  E.aggiornaOverlay();
  return true;
};
E.aggiornaOverlay=function(){
  if(!aperto) return;
  const m=attuale();
  function posiziona(el, pos, visibile){
    if(!visibile || !m || !pos || pos.x<0 || pos.y<0 || pos.x>=m.w || pos.y>=m.h){
      el.classList.add('hidden'); return;
    }
    const s=REND.mondoASchermo(pos.x*T,pos.y*T,G.cam);
    const lato=T*s.scala;
    el.style.transform='translate('+Math.round(s.x)+'px,'+Math.round(s.y)+'px)';
    el.style.width=Math.ceil(lato)+'px'; el.style.height=Math.ceil(lato)+'px';
    el.classList.remove('hidden');
  }
  posiziona($('#editor-selezione'), selezione, !!selezione);
  posiziona($('#editor-destinazione'), mira, !!mira && spostamento);
};

$('#editor-sposta').addEventListener('click',()=>{
  if(!selezione) return;
  spostamento=true;
  messaggio('Tocca una casella libera come destinazione.');
  aggiornaPannello();
});
$('#editor-annulla').addEventListener('click',annulla);
$('#editor-azzera').addEventListener('click',()=>{
  ripristinaOggetti();
  messaggio('Bozza azzerata: la valle di prova è tornata allo stato iniziale.');
  aggiornaPannello();
});
$('#editor-esporta').addEventListener('click',scarica);
$('#editor-esci').addEventListener('click',esci);

})();