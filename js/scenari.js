/* ===================================================================
   FIORALBA — scenari.js
   Carica soltanto gli scenari approvati. L'editor vive in tools/ e non
   viene mai incluso nel sito: qui arriva solo il manifesto JSON pronto
   per il deploy.
   =================================================================== */
(function(){
'use strict';

const S = { manifesto:null, pronto:null, errore:null };
window.SCENARI = S;

function leggiManifesto(d){
  if(!d || d.formato !== 'fioralba-scenari' || !d.versione) return {};
  const mappe = d.mappe && typeof d.mappe === 'object' ? d.mappe : {};
  const pronti = {};
  for(const id in mappe){
    const scenario = mappe[id];
    if(!scenario || scenario.mappa !== id || !scenario.versione) continue;
    pronti[id] = scenario;
  }
  return pronti;
}

S.pronto = (typeof fetch === 'function'
  ? fetch('scenarios/approved.json', { cache:'no-store' })
      .then(r=>r.ok ? r.json() : { formato:'fioralba-scenari', versione:1, mappe:{} })
      .then(d=>{ S.manifesto=d; return leggiManifesto(d); })
      .catch(e=>{ S.errore=e; S.manifesto={ formato:'fioralba-scenari', versione:1, mappe:{} }; return {}; })
  : Promise.resolve({}));

S.applica = function(mappe, conservaGiocatore){
  const scenari = leggiManifesto(S.manifesto);
  const risultati = {};
  for(const id in scenari){
    if(mappe[id] && window.WORLD && WORLD.applicaScenario)
      risultati[id] = WORLD.applicaScenario(mappe[id], scenari[id], conservaGiocatore);
  }
  return risultati;
};
})();