# Confronto visuale Pixi e Canvas

`npm run test:renderer` riproduce quattro scene senza avviare o salvare una
partita sul server. Per ogni scena crea uno stato locale con lo stesso seme,
cattura il canvas WebGL predefinito e quello del fallback
`?renderer=canvas`, quindi confronta i pixel RGB.

Nel percorso WebGL Pixi presenta un unico composito opaco prodotto alla
risoluzione fisica del frame. Questo conserva Pixi come renderer predefinito
ma evita che fondere molte texture trasparenti in GPU cambi i colori rispetto
alla composizione Canvas di riferimento.

Le scene coprono:

- desktop di giorno con fauna e animali;
- desktop di notte con zoom esplicito;
- telefono in verticale con pioggia, NPC e animali;
- telefono che ruota davvero da verticale a orizzontale, utile a
  intercettare differenze dopo un resize.

## Soglia

Un pixel è considerato diverso solo quando almeno un canale RGB differisce di
più di **8** livelli su 255. Questo assorbe l'arrotondamento del compositing
WebGL (conversione premoltiplicata e texture) senza nascondere un bordo, un
livello o un filtro errato.

La verifica fallisce se, in una scena:

- più dello **0,4%** dei pixel supera quella tolleranza; oppure
- l'errore RGB medio supera **0,55** livelli per canale.

I limiti sono intenzionalmente due: la quota scopre cuciture/localizzazioni,
la media scopre un filtro o una tinta applicati a tutto il quadro. Quando un
confronto fallisce, le due immagini vengono lasciate in
`tmp/renderer-visuale/`, esclusa dal repository, per l'ispezione.

Il test richiede Chromium fornito dalla configurazione Replit; fuori da Replit
si può indicare un eseguibile compatibile con
`FIORALBA_CHROMIUM=/percorso/a/chromium npm run test:renderer`.