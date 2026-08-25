/* ===================================================================
   FIORALBA — editor-interno.js

   Banco di prova privato per la scenografia. Non salva mai la partita:
   le trasformazioni vivono solo nella mappa aperta e diventano una bozza
   JSON compatibile con l'editor locale.
   =================================================================== */
(function(){
'use strict';
if(!window.FIORALBA_MODIFICA_INTERNA) return;

const E={}; window.EDITOR_INTERNO=E;
const T=64, $=s=>document.querySelector(s);
/* Il banco di prova sposta solo arredo certamente scenografico. Una
   blacklist non basta: usa la stessa allowlist del motore, che protegge
   anche le bozze JSON scritte a mano e pubblicate dall’editor locale. */
let aperto=false, basi=null, selezione=null, mira=null, spostamento=false;
let modifiche=new Map(), cronologia=[], originali=new Map(), toccoNascosto=true;

function copia(v,visti){
  if(v===null || typeof v!=='object') return v;
  visti=visti||new WeakSet(); if(visti.has(v)) return undefined; visti.add(v);
  if(Array.isArray(v)) return v.map(x=>copia(x,visti)).filter(x=>x!==undefined);
  const r={}; for(const k of Object.keys(v)){
    if(k==='ed') continue;
    const n=copia(v[k],visti); if(n!==undefined && typeof n!=='function') r[k]=n;
  }
  return r;
}
function uguale(a,b){ return JSON.stringify(copia(a))===JSON.stringify(copia(b)); }
function chiave(tipo,m,x,y){ return tipo+'|'+m+'|'+x+','+y; }
function nome(o){ const n=o&&(o.kind||o.t)||'elemento'; return n.charAt(0).toUpperCase()+n.slice(1); }
function mappa(){ return G&&G.mappa?G.mappa():null; }
function impronta(o){ return WORLD.impronta?WORLD.impronta(o):{w:1,h:1}; }
function improntaDeco(d){
  if(d&&d.t==='fontana')
    return {w:Math.max(1,Math.round(d.iw||4)),h:Math.max(1,Math.round(d.ih||3))};
  return {w:Math.max(1,Math.round((d&&d.w)||1)),h:Math.max(1,Math.round((d&&d.h)||1))};
}
function include(x,y,f,px,py){ return px>=x&&px<x+f.w&&py>=y&&py<y+f.h; }
function areaRiservata(m,x,y,f){
  for(let j=0;j<f.h;j++) for(let i=0;i<f.w;i++){
    const ax=x+i, ay=y+j;
    if(!WORLD.dentro(m,ax,ay) || spazioRiservato(m,ax,ay)) return true;
  }
  return false;
}
function spazioRiservato(m,x,y){
  if(m.spazi&&Object.values(m.spazi).some(s=>x>=s.x-1&&x<s.x+s.w+1&&y>=s.y-1&&y<s.y+s.h+1)) return true;
  if(WORLD.riservata&&WORLD.riservata(m,x,y,G.costruzioni)) return true;
  return (m.warps||[]).some(w=>include(w.x,w.y,{w:w.w,h:w.h},x,y));
}
function scenograficoOggetto(o){
  return !!o&&WORLD.oggettoScenarioSicuro(o);
}
function scenograficaDeco(d){ return !!d&&WORLD.decorazioneScenarioSicura(d); }
function ridimensionabile(s){
  if(!s) return false;
  return s.tipo==='oggetto'
    ? WORLD.oggettoScenarioRidimensionabile(s.obj)
    : WORLD.decorazioneScenarioRidimensionabile(s.deco);
}
function fSelezione(s,anteprima){
  if(!s) return {w:1,h:1};
  if(s.tipo==='oggetto'){
    const o=copia(s.obj);
    if(anteprima&&s.anteprima){ o.iw=s.anteprima.w; o.ih=s.anteprima.h; }
    return impronta(o);
  }
  const d=copia(s.deco);
  if(anteprima&&s.anteprima){
    if(d.t==='fontana'){ d.iw=s.anteprima.w; d.ih=s.anteprima.h; }
    else { d.w=s.anteprima.w; d.h=s.anteprima.h; }
  }
  return improntaDeco(d);
}
function baseMappa(m){ return basi&&basi[m.id]; }
function baseOggetto(m,x,y){
  const b=baseMappa(m), t=b&&WORLD.oggetto&&WORLD.oggetto(b,x,y);
  return t?t.obj:null;
}
function modificaOggettoQui(m,x,y){
  for(const v of modifiche.values())
    if(v.tipo==='oggetto'&&v.mappa===m.id&&v.a.x===x&&v.a.y===y) return v;
  return null;
}
function modificaDecoQui(m,d){
  for(const v of modifiche.values())
    if(v.tipo==='decorazione'&&v.mappa===m.id&&uguale(v.a,d)) return v;
  return null;
}
function ricordaMappa(m){
  if(originali.has(m.id)) return;
  originali.set(m.id,{obj:m.obj.slice(),deco:m.deco.map(d=>copia(d))});
}
function istantanea(m){ return {obj:m.obj.slice(),deco:m.deco.map(d=>copia(d))}; }
function ripristinaMappa(m,s){ m.obj=s.obj.slice(); m.deco=s.deco.map(d=>copia(d)); }
function copiaModifiche(){
  return new Map([...modifiche].map(([k,v])=>[k,copia(v)]));
}
function invalida(){ if(REND.invalidaTerreno) REND.invalidaTerreno(); }
function esegui(m,azione){
  ricordaMappa(m);
  const prima=istantanea(m), modPrima=copiaModifiche();
  const esito=azione();
  if(!esito){ ripristinaMappa(m,prima); modifiche=modPrima; return false; }
  cronologia.push({mappa:m.id,prima,modifiche:modPrima});
  invalida(); return true;
}
function ripristinaOggetti(){
  for(const [id,s] of originali){
    const m=G.maps&&G.maps[id]; if(m) ripristinaMappa(m,s);
  }
  originali.clear(); modifiche.clear(); cronologia.length=0;
  selezione=null; mira=null; impostaSpostamento(false); invalida();
}
function registraOggetto(m,origine,da,x,y,obj){
  const k=chiave('oggetto',m.id,origine.x,origine.y);
  if(x===origine.x&&y===origine.y&&uguale(da,obj)) modifiche.delete(k);
  else modifiche.set(k,{tipo:'oggetto',mappa:m.id,x:origine.x,y:origine.y,da:copia(da),
    a:{x,y,oggetto:copia(obj)}});
}
function registraDeco(m,da,d){
  const k=chiave('decorazione',m.id,da.x,da.y)+'|'+JSON.stringify(copia(da));
  if(uguale(da,d)) modifiche.delete(k);
  else modifiche.set(k,{tipo:'decorazione',mappa:m.id,da:copia(da),a:copia(d)});
}
function messaggio(t){ const e=$('#editor-istruzioni'); if(e) e.textContent=t; }

function aggiornaInterazione(){
  const esplora=aperto&&!spostamento;
  document.body.classList.toggle('modalita-modifica-attiva',aperto);
  document.body.classList.toggle('modalita-modifica-esplora',esplora);
  const tocco=$('#tocco'); if(!tocco) return;
  if(!aperto){ if(!toccoNascosto) tocco.classList.remove('hidden'); }
  else if(spostamento||toccoNascosto) tocco.classList.add('hidden');
  else tocco.classList.remove('hidden');
}
function impostaSpostamento(v){ spostamento=!!v; aggiornaInterazione(); }

function aggiornaPannello(){
  const m=mappa(), stato=$('#editor-stato'), bSposta=$('#editor-sposta');
  if(stato){
    const scelta=selezione
      ? 'Selezionato: '+nome(selezione.tipo==='oggetto'?selezione.obj:selezione.deco)+' · ('+selezione.x+', '+selezione.y+')'
      : (m?m.nome+' · nessun elemento selezionato':'Nessuna mappa aperta');
    const fase=spostamento?' · scegli la destinazione':' · puoi camminare e ritoccare';
    stato.textContent=scelta+(modifiche.size?' · '+modifiche.size+' ritocco'+(modifiche.size===1?'':'hi')+' in bozza':'')+fase;
  }
  if(bSposta){ bSposta.disabled=!selezione; bSposta.textContent=spostamento?'Scegli destinazione':'Sposta'; }
  $('#editor-annulla').disabled=!cronologia.length;
  $('#editor-azzera').disabled=!modifiche.size;
  $('#editor-esporta').disabled=!modifiche.size;
  const pannello=$('#editor-dimensioni'), disponibile=ridimensionabile(selezione);
  pannello.classList.toggle('hidden',!disponibile);
  if(disponibile){
    const f=fSelezione(selezione,true), largo=$('#editor-larghezza'), alto=$('#editor-altezza');
    largo.value=f.w; alto.value=f.h;
    largo.disabled=!selezione; alto.disabled=!selezione; $('#editor-ridimensiona').disabled=!selezione;
  }
}

function decoIn(m,x,y){
  for(let i=m.deco.length-1;i>=0;i--){ const d=m.deco[i], f=improntaDeco(d);
    if(include(d.x,d.y,f,x,y)) return {deco:d,indice:i};
  }
  return null;
}
function blocchiDeco(m,d){
  const f=improntaDeco(d), r=[];
  for(let j=0;j<f.h;j++) for(let i=0;i<f.w;i++){
    const t=WORLD.oggetto(m,d.x+i,d.y+j);
    if(!t||t.x!==d.x+i||t.y!==d.y+j||t.obj.t!==d.t) continue;
    const mod=modificaOggettoQui(m,t.x,t.y);
    const origine=mod?{x:mod.x,y:mod.y}:{x:t.x,y:t.y};
    const base=mod?mod.da:baseOggetto(m,origine.x,origine.y);
    if(base) r.push({x:t.x,y:t.y,obj:t.obj,origine,da:mod?mod.da:base});
  }
  return r;
}
function blocchiFontana(m,d){
  const f=improntaDeco(d), r=[];
  for(let j=0;j<f.h;j++) for(let i=0;i<f.w;i++){
    const x=d.x+i,y=d.y+j,t=WORLD.oggetto(m,x,y);
    if(t&&t.x===x&&t.y===y&&t.obj.t==='fontana') r.push({x,y,obj:t.obj});
  }
  return r;
}
function seleziona(x,y){
  const m=mappa();
  if(!m||!WORLD.dentro(m,x,y)){ messaggio('Quella casella non appartiene alla mappa.'); return; }
  const deco=decoIn(m,x,y);
  if(deco){
    const mod=modificaDecoQui(m,deco.deco);
    const base=mod?mod.da:(baseMappa(m).deco||[]).find(d=>uguale(d,deco.deco));
    if(!base||!scenograficaDeco(base)){
      selezione=null; messaggio('Questa decorazione è protetta: ponti, moli, pareti e passaggi non si modificano qui.');
    }else{
      selezione={tipo:'decorazione',mappa:m.id,x:deco.deco.x,y:deco.deco.y,deco:deco.deco,
        indice:deco.indice,origine:{x:base.x,y:base.y},da:copia(base),anteprima:null};
      messaggio(ridimensionabile(selezione)
        ? 'Decorazione selezionata. Puoi spostarla e ridimensionarla: l’anteprima prova l’ingombro completo.'
        : 'Decorazione selezionata. Puoi spostarla senza toccare gli elementi protetti.');
    }
    impostaSpostamento(false); aggiornaPannello(); E.aggiornaOverlay(); return;
  }
  const t=WORLD.oggetto(m,x,y);
  if(!t){
    selezione=null; impostaSpostamento(false);
    messaggio('Qui non c’è scenografia selezionabile. Puoi continuare a camminare.'); aggiornaPannello(); return;
  }
  const mod=modificaOggettoQui(m,t.x,t.y);
  const origine=mod?{x:mod.x,y:mod.y}:{x:t.x,y:t.y};
  const base=mod?mod.da:baseOggetto(m,origine.x,origine.y);
  if(!base||!scenograficoOggetto(base)){
    selezione=null; impostaSpostamento(false);
    messaggio('Questo elemento è protetto: porte, uscite, strutture e oggetti di gioco non si modificano.');
  }else{
    selezione={tipo:'oggetto',mappa:m.id,x:t.x,y:t.y,obj:t.obj,origine,da:copia(base),anteprima:null};
    impostaSpostamento(false);
    messaggio(ridimensionabile(selezione)
      ? 'Oggetto selezionato. Puoi spostarlo o ridimensionarlo: impronta e collisioni restano unite.'
      : 'Oggetto selezionato. L’intera impronta si sposta insieme, collisioni comprese.');
  }
  aggiornaPannello(); E.aggiornaOverlay();
}

function terrenoAmmesso(m,x,y,o){
  const t=WORLD.terreno(m,x,y);
  return !['roccia','vuoto'].includes(t)&&(t!=='acqua'||(o&&o.t==='fontana'));
}
function validaAreaOggetto(m,x,y,o){
  const f=impronta(o);
  if(areaRiservata(m,x,y,f)) return 'L’ingombro tocca un edificio, una porta o un passaggio protetto.';
  for(let j=0;j<f.h;j++) for(let i=0;i<f.w;i++){
    const ax=x+i,ay=y+j;
    if(m.obj[WORLD.idx(m,ax,ay)]) return 'Una delle caselle di arrivo è già occupata.';
    if(m.suolo&&m.suolo[WORLD.idx(m,ax,ay)]) return 'L’ingombro passerebbe sopra un campo coltivato.';
    if(!terrenoAmmesso(m,ax,ay,o)) return 'L’oggetto non può stare su questo terreno.';
    const px=(G.p.px/T)|0,py=(G.p.py/T)|0;
    if(m.id===G.mappaId&&px===ax&&py===ay) return 'Sposta prima il contadino da questa casella.';
  }
  return null;
}
function validaDeco(m,x,y,d){
  const f=improntaDeco(d);
  if(areaRiservata(m,x,y,f)) return 'L’ingombro tocca un edificio, una porta o un passaggio protetto.';
  for(let j=0;j<f.h;j++) for(let i=0;i<f.w;i++){
    const ax=x+i,ay=y+j;
    if(m.obj[WORLD.idx(m,ax,ay)]) return 'Una delle caselle di arrivo è occupata: la decorazione non può coprirla.';
    if(m.suolo&&m.suolo[WORLD.idx(m,ax,ay)]) return 'La decorazione non può coprire un campo coltivato.';
    if(!terrenoAmmesso(m,ax,ay,d)) return 'La decorazione non può stare su questo terreno.';
    const px=(G.p.px/T)|0,py=(G.p.py/T)|0;
    if(m.id===G.mappaId&&px===ax&&py===ay) return 'Sposta prima il contadino da questa casella.';
  }
  return null;
}
function posaOggetto(m,x,y,o){
  return !validaAreaOggetto(m,x,y,o)&&WORLD.arredo(m,x,y,o);
}
function spostaOggetto(x,y){
  const s=selezione,m=mappa(); if(!s||s.tipo!=='oggetto'||!m) return;
  if(x===s.x&&y===s.y){ impostaSpostamento(false); messaggio('L’oggetto è già lì.'); aggiornaPannello(); return; }
  if(!esegui(m,()=>{
    const tolto=WORLD.togliArredo(m,s.x,s.y);
    if(!tolto||!posaOggetto(m,x,y,tolto.obj)) return false;
    registraOggetto(m,s.origine,s.da,x,y,tolto.obj);
    selezione={...s,x,y,obj:tolto.obj,anteprima:null}; return true;
  })){ messaggio('Destinazione non valida: controlla confini, oggetti, campi e aree protette.'); return; }
  impostaSpostamento(false); messaggio(nome(s.obj)+' spostato con tutta la sua impronta.'); aggiornaPannello();
}
function spostaDeco(x,y){
  const s=selezione,m=mappa(); if(!s||s.tipo!=='decorazione'||!m) return;
  if(x===s.x&&y===s.y){ impostaSpostamento(false); messaggio('La decorazione è già lì.'); aggiornaPannello(); return; }
  if(!esegui(m,()=>{
    const fontana=s.deco.t==='fontana', f=improntaDeco(s.deco);
    const blocchi=fontana?blocchiFontana(m,s.deco):blocchiDeco(m,s.deco), indice=m.deco.indexOf(s.deco);
    if(fontana&&blocchi.length!==f.w*f.h) return false;
    if(indice<0) return false;
    m.deco.splice(indice,1);
    for(const b of blocchi) WORLD.togliArredo(m,b.x,b.y);
    const d=copia(s.deco); d.x=x; d.y=y;
    if(validaDeco(m,x,y,d)) return false;
    for(const b of blocchi){
      const nx=x+(b.x-s.x),ny=y+(b.y-s.y);
      if(!posaOggetto(m,nx,ny,b.obj)) return false;
      if(!fontana) registraOggetto(m,b.origine,b.da,nx,ny,b.obj);
    }
    m.deco.splice(indice,0,d); registraDeco(m,s.da,d);
    selezione={...s,x,y,deco:d,indice,anteprima:null}; return true;
  })){ messaggio('Destinazione non valida: l’ingombro deve restare libero e fuori dalle aree protette.'); return; }
  impostaSpostamento(false); messaggio(nome(s.deco)+' spostata; le collisioni collegate l’hanno seguita.'); aggiornaPannello();
}
function sposta(x,y){ if(selezione&&selezione.tipo==='oggetto') spostaOggetto(x,y); else spostaDeco(x,y); }

function leggiMisure(){
  const w=parseInt($('#editor-larghezza').value,10),h=parseInt($('#editor-altezza').value,10);
  return Number.isInteger(w)&&Number.isInteger(h)&&w>=1&&h>=1&&w<=8&&h<=8?{w,h}:null;
}
function anteprimaDimensioni(){
  if(!ridimensionabile(selezione)) return;
  const d=leggiMisure();
  if(!d){ messaggio('Inserisci una larghezza e un’altezza tra 1 e 8 caselle.'); return; }
  selezione.anteprima=d; E.aggiornaOverlay();
  messaggio('Anteprima '+d.w+'×'+d.h+' caselle: verifica il contorno dorato, poi premi di nuovo il pulsante per applicare.');
}
function ridimensiona(){
  const s=selezione,m=mappa(),misure=leggiMisure();
  if(!s||!m||!ridimensionabile(s)||!misure) return;
  const f=fSelezione(s,false); if(f.w===misure.w&&f.h===misure.h){ s.anteprima=null; E.aggiornaOverlay(); return; }
  if(!s.anteprima||s.anteprima.w!==misure.w||s.anteprima.h!==misure.h){ anteprimaDimensioni(); return; }
  if(!esegui(m,()=>{
    if(s.tipo==='oggetto'){
      const tolto=WORLD.togliArredo(m,s.x,s.y),o=copia(s.obj);
      if(!tolto) return false; o.iw=misure.w; o.ih=misure.h;
      if(!posaOggetto(m,s.x,s.y,o)) return false;
      registraOggetto(m,s.origine,s.da,s.x,s.y,o); selezione={...s,obj:o,anteprima:null}; return true;
    }
    const indice=m.deco.indexOf(s.deco); if(indice<0) return false;
    if(s.deco.t==='fontana'){
      const vecchia=improntaDeco(s.deco), blocchi=blocchiFontana(m,s.deco);
      if(blocchi.length!==vecchia.w*vecchia.h) return false;
      m.deco.splice(indice,1);
      for(const b of blocchi) WORLD.togliArredo(m,b.x,b.y);
      const d=copia(s.deco); d.iw=misure.w; d.ih=misure.h;
      if(validaDeco(m,s.x,s.y,d)) return false;
      const f=improntaDeco(d);
      for(let j=0;j<f.h;j++) for(let i=0;i<f.w;i++)
        if(!posaOggetto(m,s.x+i,s.y+j,{t:'fontana',solido:true})) return false;
      m.deco.splice(indice,0,d); registraDeco(m,s.da,d);
      selezione={...s,deco:d,indice,anteprima:null}; return true;
    }
    m.deco.splice(indice,1); const d=copia(s.deco); d.w=misure.w; d.h=misure.h;
    if(validaDeco(m,s.x,s.y,d)) return false;
    m.deco.splice(indice,0,d); registraDeco(m,s.da,d); selezione={...s,deco:d,indice,anteprima:null}; return true;
  })){ messaggio('Queste dimensioni non entrano qui: riduci l’ingombro o scegli un’area libera.'); return; }
  messaggio('Dimensioni applicate. La bozza conserva anche il nuovo ingombro.'); aggiornaPannello(); E.aggiornaOverlay();
}
function annulla(){
  const ultima=cronologia.pop(); if(!ultima) return;
  const m=G.maps[ultima.mappa]; if(m) ripristinaMappa(m,ultima.prima);
  modifiche=ultima.modifiche; selezione=null; mira=null; impostaSpostamento(false);
  invalida(); messaggio('Ultima trasformazione annullata.'); aggiornaPannello(); E.aggiornaOverlay();
}

function bozzaScenario(){
  if(!modifiche.size) return null;
  const tutte=[...modifiche.values()], prima=tutte[0];
  if(tutte.some(v=>v.mappa!==prima.mappa)) return null;
  const m=G.maps[prima.mappa], ritocchi={terreno:[],oggetti:[],decorazioni:[]};
  for(const v of tutte){
    if(v.tipo==='oggetto'){
      if(uguale(v.da,v.a.oggetto)) ritocchi.oggetti.push({azione:'sposta',x:v.x,y:v.y,a:{x:v.a.x,y:v.a.y},da:v.da});
      else{
        ritocchi.oggetti.push({azione:'rimuovi',x:v.x,y:v.y,da:v.da});
        ritocchi.oggetti.push({azione:'aggiungi',x:v.a.x,y:v.a.y,oggetto:v.a.oggetto});
      }
    }else{
      /* La fontana è decorazione + collisioni. L'export riscrive tutto il
         reticolo da quella sola dichiarazione, così spostamento e misura
         restano sempre identici quando la bozza viene riaperta. */
      if(v.da.t==='fontana'){
        const prima=improntaDeco(v.da), dopo=improntaDeco(v.a);
        for(let j=0;j<prima.h;j++) for(let i=0;i<prima.w;i++)
          ritocchi.oggetti.push({azione:'rimuovi',x:v.da.x+i,y:v.da.y+j,da:{t:'fontana',solido:true}});
        for(let j=0;j<dopo.h;j++) for(let i=0;i<dopo.w;i++)
          ritocchi.oggetti.push({azione:'aggiungi',x:v.a.x+i,y:v.a.y+j,oggetto:{t:'fontana',solido:true}});
      }
      ritocchi.decorazioni.push({azione:'rimuovi',da:v.da});
      ritocchi.decorazioni.push({azione:'aggiungi',decorazione:v.a});
    }
  }
  return {formato:'fioralba-scenario',versione:1,mappa:m.id,nome:m.nome,w:m.w,h:m.h,ritocchi};
}
function scarica(){
  if(!modifiche.size) return;
  const scenario=bozzaScenario();
  if(!scenario){ messaggio('Scarica una bozza per mappa: chiudi, cambia mappa e riapri.'); return; }
  const file=new Blob([JSON.stringify(scenario,null,2)+'\n'],{type:'application/json'}),a=document.createElement('a');
  a.href=URL.createObjectURL(file); a.download=scenario.mappa+'-bozza-modifica.json'; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),0);
  messaggio('Bozza scaricata: spostamenti, dimensioni e decorazioni sono pronti per l’editor locale.');
}
function esci(){
  if(!aperto) return;
  ripristinaOggetti(); aperto=false;
  $('#editor-interno').classList.add('hidden'); $('#editor-selezione').classList.add('hidden'); $('#editor-destinazione').classList.add('hidden');
  aggiornaInterazione(); UI.prompt(null); if(G.fermaInput) G.fermaInput();
}

E.disponibile=()=>true; E.attivo=()=>aperto; E.bloccaGioco=()=>aperto&&spostamento;
/* Esposta solo nel modulo di test interno: permette alla suite dati di
   verificare che un oggetto funzionale non possa mai entrare nella bozza. */
E.puoSpostareOggetto=scenograficoOggetto;
E.puoSpostareDecorazione=scenograficaDeco;
E.testSeleziona=(x,y)=>{
  seleziona(x,y);
  return selezione&&{tipo:selezione.tipo,decorazione:selezione.deco&&selezione.deco.t,
    ridimensionabile:ridimensionabile(selezione),impronta:fSelezione(selezione,false)};
};
E.testAnteprima=(w,h)=>{
  if(!selezione) return false;
  $('#editor-larghezza').value=w; $('#editor-altezza').value=h; anteprimaDimensioni();
  return {impronta:fSelezione(selezione,true),anteprima:selezione.anteprima};
};
E.testRidimensiona=(w,h)=>{
  if(!selezione) return false;
  $('#editor-larghezza').value=w; $('#editor-altezza').value=h; selezione.anteprima={w,h};
  ridimensiona();
  return selezione&&{impronta:fSelezione(selezione,false),anteprima:selezione.anteprima};
};
E.testBozza=bozzaScenario;
E.testScarica=scarica;
E.apri=function(){
  if(aperto||!G.inGioco) return;
  basi=WORLD.crea(); if(window.SCENARI) SCENARI.applica(basi,false);
  aperto=true; selezione=null; mira=null; spostamento=false; modifiche.clear(); cronologia.length=0; originali.clear();
  toccoNascosto=$('#tocco').classList.contains('hidden'); aggiornaInterazione();
  $('#editor-interno').classList.remove('hidden'); if(G.fermaInput) G.fermaInput();
  messaggio('Cammina dove vuoi, poi tocca una decorazione o un oggetto scenografico. Esc esce senza salvare.'); aggiornaPannello();
};
E.gestisciTasto=function(e){
  if(!aperto) return false; const k=e.key.toLowerCase();
  if(k==='escape'){ if(spostamento){ impostaSpostamento(false); messaggio('Scelta della destinazione annullata.'); aggiornaPannello(); }else esci(); return true; }
  if((e.ctrlKey||e.metaKey)&&k==='z'){ annulla(); return true; }
  if(k==='enter'){ if(selezione){ impostaSpostamento(true); messaggio('Tocca l’angolo in alto a sinistra della nuova posizione.'); aggiornaPannello(); } return true; }
  if(spostamento) return true;
  return !['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift'].includes(k);
};
function aggiornaMira(e,cvs){
  const r=cvs.getBoundingClientRect(),mondo=REND.schermoAMondo(e.clientX-r.left,e.clientY-r.top,G.cam);
  mira={x:Math.floor(mondo.x/T),y:Math.floor(mondo.y/T)}; E.aggiornaOverlay();
}
E.muoviPuntatore=function(e,cvs){ if(!aperto) return false; aggiornaMira(e,cvs); return true; };
E.gestisciPuntatore=function(e,cvs){
  if(!aperto) return false; if(e.button!==undefined&&e.button!==0) return true;
  aggiornaMira(e,cvs); if(!mira) return true; if(spostamento) sposta(mira.x,mira.y); else seleziona(mira.x,mira.y);
  E.aggiornaOverlay(); return true;
};
E.aggiornaOverlay=function(){
  if(!aperto) return; const m=mappa();
  function posiziona(el,p,f,visibile){
    if(!visibile||!m||!p||areaRiservata(m,p.x,p.y,f)){ el.classList.add('hidden'); return; }
    const s=REND.mondoASchermo(p.x*T,p.y*T,G.cam),lato=T*s.scala;
    el.style.transform='translate('+Math.round(s.x)+'px,'+Math.round(s.y)+'px)';
    el.style.width=Math.ceil(lato*f.w)+'px'; el.style.height=Math.ceil(lato*f.h)+'px'; el.classList.remove('hidden');
  }
  const f=fSelezione(selezione,true);
  posiziona($('#editor-selezione'),selezione,f,!!selezione);
  posiziona($('#editor-destinazione'),mira,f,!!mira&&spostamento);
};

$('#editor-sposta').addEventListener('click',()=>{ if(selezione){ impostaSpostamento(true); messaggio('Tocca l’angolo in alto a sinistra della nuova posizione.'); aggiornaPannello(); }});
$('#editor-annulla').addEventListener('click',annulla);
$('#editor-azzera').addEventListener('click',()=>{ ripristinaOggetti(); messaggio('Bozza azzerata: la valle di prova è tornata identica a prima.'); aggiornaPannello(); });
$('#editor-esporta').addEventListener('click',scarica);
$('#editor-esci').addEventListener('click',esci);
$('#editor-ridimensiona').addEventListener('click',ridimensiona);
$('#editor-larghezza').addEventListener('input',anteprimaDimensioni);
$('#editor-altezza').addEventListener('input',anteprimaDimensioni);
})();