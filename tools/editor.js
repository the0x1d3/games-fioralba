/* Editor visuale minimale: la mappa resta una griglia leggibile anche senza
   sprite del gioco, così il file esportato non dipende da canvas o immagini. */
'use strict';
const $ = s=>document.querySelector(s);
const tavola=$('#tavola'), ctx=tavola.getContext('2d');
const TOKEN_EDITOR=$('meta[name="editor-token"]').content;
const PASSO=24;
const COLORI={erba:'#6e9d54',terra:'#98754a',sentiero:'#c0a16d',sabbia:'#d3bd83',
  acqua:'#4d91ad',assi:'#ae8050',lastre:'#aaa08e',grotta:'#665b50',roccia:'#514b48',
  vuoto:'#292b29',neve:'#d9e4dc',cotto:'#a75f46'};
const TIPI=Object.keys(COLORI);
const OGGETTI=[
  ['lampione','Lampione'],['albero','Albero'],['cespuglio','Cespuglio'],
  ['fiori','Fiori'],['sasso','Sasso'],['panchina','Panchina'],
  ['cassa','Cassa'],['recinto','Recinto'],['cancelletto','Cancelletto'],
  ['cartello','Cartello'],['lume','Lume']
];
let dati=null, base=null, corrente=null, selezionata=null, modo=null;

function stato(t,classe){$('#stato').textContent=t;$('#stato').className='stato '+(classe||'');}
function chiave(x,y){return x+','+y}
function oggetto(x,y){return corrente.oggetti.find(o=>o.x===x&&o.y===y)}
function copia(v){return JSON.parse(JSON.stringify(v))}
function stessoOggetto(a,b){
  return !!(a&&b&&a.t===b.t&&a.kind===b.kind&&a.item===b.item);
}
function applicaScenarioLocale(m,scenario){
  if(!scenario||scenario.mappa!==m.id||scenario.w!==m.w||scenario.h!==m.h)return;
  const r=scenario.ritocchi||{}, indice=()=>new Map(m.oggetti.map(v=>[chiave(v.x,v.y),v]));
  for(const v of (r.terreno||[])){
    const i=v.y*m.w+v.x;
    if(m.terreno[i]===v.da) m.terreno[i]=v.tipo;
  }
  for(const v of (r.oggetti||[])){
    const oggetti=indice(), qui=oggetti.get(chiave(v.x,v.y));
    if(v.azione==='rimuovi'&&qui&&stessoOggetto(qui.oggetto,v.da))
      m.oggetti.splice(m.oggetti.indexOf(qui),1);
    else if(v.azione==='aggiungi'&&!qui)
      m.oggetti.push({x:v.x,y:v.y,oggetto:copia(v.oggetto)});
    else if(v.azione==='sposta'&&qui&&stessoOggetto(qui.oggetto,v.da)&&!oggetti.get(chiave(v.a.x,v.a.y))){
      qui.x=v.a.x;qui.y=v.a.y;
    }
  }
  for(const v of (r.decorazioni||[])){
    if(v.azione==='rimuovi'){
      const i=m.decorazioni.findIndex(d=>uguale(d,v.da));
      if(i>=0)m.decorazioni.splice(i,1);
    }else if(v.azione==='aggiungi')m.decorazioni.push(copia(v.decorazione));
  }
}
function inizializza(m){
  base=copia(m); corrente=copia(m); selezionata=null; modo=null;
  const approvato=dati.approvati&&dati.approvati.mappe&&dati.approvati.mappe[m.id];
  if(approvato) applicaScenarioLocale(corrente,approvato);
  tavola.width=m.w*PASSO; tavola.height=m.h*PASSO;
  $('#istruzioni').textContent='';
  disegna();
  stato('Mappa '+m.nome+(approvato?' · revisione approvata '+(approvato.edizione||'attiva'):'')+' pronta.','ok');
}
function disegna(){
  if(!corrente)return;
  ctx.clearRect(0,0,tavola.width,tavola.height);
  for(let y=0;y<corrente.h;y++)for(let x=0;x<corrente.w;x++){
    const i=y*corrente.w+x, tipo=corrente.terreno[i];
    ctx.fillStyle=COLORI[tipo]||'#333';ctx.fillRect(x*PASSO,y*PASSO,PASSO,PASSO);
    ctx.strokeStyle='#ffffff12';ctx.strokeRect(x*PASSO+.5,y*PASSO+.5,PASSO-1,PASSO-1);
  }
  for(const o of corrente.oggetti){
    ctx.fillStyle=o.oggetto.t==='albero'?'#224c2c':'#5b3828';
    ctx.fillRect(o.x*PASSO+5,o.y*PASSO+5,PASSO-10,PASSO-10);
    ctx.fillStyle='#f7e2b5';ctx.font='13px system-ui';ctx.textAlign='center';
    ctx.fillText((o.oggetto.kind||o.oggetto.t).slice(0,2).toUpperCase(),o.x*PASSO+PASSO/2,o.y*PASSO+16);
  }
  if(selezionata){
    ctx.strokeStyle='#f1ca68';ctx.lineWidth=3;
    ctx.strokeRect(selezionata.x*PASSO+2,selezionata.y*PASSO+2,PASSO-4,PASSO-4);
    ctx.lineWidth=1;
  }
}
function aggiornaSelezione(){
  if(!selezionata){$('#selezione').textContent='Nessuna casella selezionata.';return}
  const o=oggetto(selezionata.x,selezionata.y), i=selezionata.y*corrente.w+selezionata.x;
  $('#selezione').textContent='('+selezionata.x+', '+selezionata.y+') · '+corrente.terreno[i]+(o?' · '+(o.oggetto.kind||o.oggetto.t):'');
}
function seleziona(x,y){
  if(modo==='sposta' && selezionata){
    const o=oggetto(selezionata.x,selezionata.y);
    if(o && !oggetto(x,y)){
      o.x=x;o.y=y;modo=null;$('#istruzioni').textContent='';stato('Oggetto spostato.','ok');
    } else stato('La destinazione è occupata.','errore');
  } else {
    selezionata={x,y}; aggiornaSelezione();
  }
  disegna(); aggiornaSelezione();
}
function caricaMappa(id){inizializza(dati.mappe[id])}
function scenario(){
  return {scenario:diffScenario(base,corrente)}
}
function uguale(a,b){return JSON.stringify(a)===JSON.stringify(b)}
function identita(o){return o&&[o.t,o.kind,o.item].filter(v=>v!==undefined).join(':')}
function diffScenario(b,c){
  const ritocchi={terreno:[],oggetti:[],decorazioni:[]};
  for(let i=0;i<b.terreno.length;i++)if(b.terreno[i]!==c.terreno[i])
    ritocchi.terreno.push({x:i%b.w,y:Math.floor(i/b.w),da:b.terreno[i],tipo:c.terreno[i]});
  const bm=new Map(b.oggetti.map(v=>[chiave(v.x,v.y),v])),cm=new Map(c.oggetti.map(v=>[chiave(v.x,v.y),v]));
  const rem=[],add=[],usati=new Set();
  for(const [pos,v] of bm){
    const n=cm.get(pos);
    if(!n) rem.push(v);
    else if(!uguale(v.oggetto,n.oggetto)){rem.push(v);add.push(n)}
  }
  for(const [pos,v] of cm)if(!bm.has(pos))add.push(v);
  rem.forEach(v=>{
    const j=add.findIndex((n,i)=>!usati.has(i)&&(n.x!==v.x||n.y!==v.y)&&identita(n.oggetto)===identita(v.oggetto));
    if(j>=0){usati.add(j);ritocchi.oggetti.push({azione:'sposta',x:v.x,y:v.y,a:{x:add[j].x,y:add[j].y},da:v.oggetto})}
    else ritocchi.oggetti.push({azione:'rimuovi',x:v.x,y:v.y,da:v.oggetto});
  });
  add.forEach((v,i)=>{if(!usati.has(i))ritocchi.oggetti.push({azione:'aggiungi',x:v.x,y:v.y,oggetto:v.oggetto})});
  b.decorazioni.forEach(d=>{if(!c.decorazioni.some(n=>uguale(n,d)))ritocchi.decorazioni.push({azione:'rimuovi',da:d})});
  c.decorazioni.forEach(d=>{if(!b.decorazioni.some(n=>uguale(n,d)))ritocchi.decorazioni.push({azione:'aggiungi',decorazione:d})});
  return {formato:'fioralba-scenario',versione:1,mappa:b.id,nome:b.nome,w:b.w,h:b.h,ritocchi}
}
function invia(approva){
  const payload=scenario();
  if(!payload.scenario.ritocchi.terreno.length&&!payload.scenario.ritocchi.oggetti.length&&!payload.scenario.ritocchi.decorazioni.length)return stato('Nessuna modifica da esportare.','errore');
  fetch('/api/esporta',{method:'POST',headers:{'Content-Type':'application/json','X-Editor-Token':TOKEN_EDITOR},body:JSON.stringify({...payload,approva})})
    .then(r=>r.json()).then(r=>r.errore?stato(r.errore,'errore'):stato((approva?'Approvato: ':'Bozza salvata: ')+r.nome,'ok'))
    .catch(e=>stato('Editor non raggiungibile: '+e.message,'errore'));
}
function nuovoOggetto(tipo){
  if(tipo==='albero') return {t:'albero',kind:'quercia',stage:2,hp:5,solido:true,w:3,h:3,anc:1};
  if(tipo==='cespuglio') return {t:'cespuglio',v:0,bacche:false};
  if(tipo==='fiori') return {t:'fiori',v:0};
  if(tipo==='sasso') return {t:'sasso',kind:'pietra',hp:2,solido:true};
  if(tipo==='cartello') return {t:'mobile',kind:'cartello',solido:true,testo:''};
  if(tipo==='recinto') return {t:'mobile',kind:'recinto',solido:true};
  if(tipo==='cancelletto') return {t:'mobile',kind:'cancelletto',solido:false,apribile:true};
  if(tipo==='cassa') return {t:'macchina',kind:'cassa',solido:true,slots:new Array(24).fill(null)};
  if(tipo==='lampione'||tipo==='lume') return {t:tipo,solido:false};
  return {t:tipo,solido:true};
}
TIPI.forEach(t=>$('#terreno').add(new Option(t,t)));
OGGETTI.forEach(([v,l])=>$('#oggetto').add(new Option(l,v)));
$('#mappa').onchange=()=>caricaMappa($('#mappa').value);
$('#annulla').onclick=()=>caricaMappa($('#mappa').value);
$('#posa-terreno').onclick=()=>{if(!selezionata)return stato('Seleziona una casella.','errore');corrente.terreno[selezionata.y*corrente.w+selezionata.x]=$('#terreno').value;disegna();aggiornaSelezione()};
$('#aggiungi').onclick=()=>{if(!selezionata)return stato('Seleziona una casella.','errore');if(oggetto(selezionata.x,selezionata.y))return stato('La casella è occupata.','errore');const t=$('#oggetto').value;corrente.oggetti.push({x:selezionata.x,y:selezionata.y,oggetto:nuovoOggetto(t)});disegna();aggiornaSelezione()};
$('#rimuovi').onclick=()=>{if(!selezionata)return stato('Seleziona una casella.','errore');const i=corrente.oggetti.findIndex(o=>o.x===selezionata.x&&o.y===selezionata.y);if(i<0)return stato('Nessun oggetto in quella casella.','errore');corrente.oggetti.splice(i,1);disegna();aggiornaSelezione()};
$('#sposta').onclick=()=>{if(!selezionata||!oggetto(selezionata.x,selezionata.y))return stato('Seleziona prima un oggetto.','errore');modo='sposta';$('#istruzioni').textContent='Clicca la casella di destinazione.'};
$('#esporta').onclick=()=>invia(false);$('#approva').onclick=()=>invia(true);
tavola.addEventListener('click',evento=>{
  if(!corrente)return;
  const r=tavola.getBoundingClientRect();
  const x=Math.floor((evento.clientX-r.left)*tavola.width/r.width/PASSO);
  const y=Math.floor((evento.clientY-r.top)*tavola.height/r.height/PASSO);
  if(x>=0&&y>=0&&x<corrente.w&&y<corrente.h)seleziona(x,y);
});
fetch('/api/mappe').then(r=>r.json()).then(r=>{dati=r;for(const id of Object.keys(r.mappe))$('#mappa').add(new Option(r.mappe[id].nome,id));caricaMappa($('#mappa').value=Object.keys(r.mappe)[0])}).catch(e=>stato('Impossibile caricare le mappe: '+e.message,'errore'));