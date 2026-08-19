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

/* L'edizione è il numero che cambia quando il contenuto di una mappa viene
   approvato. `versione` invece descrive il FORMATO del file, e rimane uno
   finché il lettore sa capirlo: confonderli farebbe sembrare aggiornato uno
   scenario modificato dieci volte. I manifesti precedenti all'editor non
   avevano ancora `edizione`, per quelli il formato è l'unica versione nota. */
function edizione(scenario){
  const n = scenario && (scenario.edizione || scenario.versione);
  return Number.isInteger(n) && n > 0 ? n : 0;
}

S.pronto = (typeof fetch === 'function'
  ? fetch('scenarios/approved.json', { cache:'no-store' })
      .then(r=>r.ok ? r.json() : { formato:'fioralba-scenari', versione:1, mappe:{} })
      .then(d=>{ S.manifesto=d; return leggiManifesto(d); })
      .catch(e=>{ S.errore=e; S.manifesto={ formato:'fioralba-scenari', versione:1, mappe:{} }; return {}; })
  : Promise.resolve({}));

/* Il salvataggio registra anche gli zeri: sapere che una mappa non aveva
   ritocchi è diverso dal non sapere quale manifesto fosse stato caricato. */
S.versioni = function(mappe){
  const scenari = leggiManifesto(S.manifesto);
  const versioni = {};
  const ids = mappe ? Object.keys(mappe) : (window.WORLD ? WORLD.MAPPE : Object.keys(scenari));
  for(const id of ids) versioni[id] = edizione(scenari[id]);
  return versioni;
};

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