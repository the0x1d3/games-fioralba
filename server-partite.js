/* ===================================================================
   FIORALBA — server-partite.js
   Il salvataggio che segue il giocatore da un computer all'altro.

   L'IDEA, in una riga: il locale resta la verità, il server è la copia.

   Il gioco continua a salvare su localStorage esattamente come prima,
   offline compreso. Qui si tiene una copia, e la si allinea quando si
   può. Se questo servizio è giù, chi gioca non se ne accorge — e non è
   un ripiego, è il progetto: una partita non deve mai dipendere dalla
   rete per esistere.

   NIENTE ACCOUNT. L'identità è un codice casuale — `FIORALBA-XXXX-XXXX-XXXX`
   — generato al primo collegamento e mostrato nel menu. Sul secondo
   computer lo si digita una volta. Niente email, niente password, niente
   dato personale: il GDPR si riduce quasi a zero e non ci si ritrova a
   gestire recuperi password per un gioco di orti.

   Il prezzo, dichiarato: chi conosce il codice può leggere e scrivere
   quella partita. È una chiave, non un nome utente. Per questo è lunga:
   dodici caratteri su un alfabeto di ventotto fanno ~2,3·10^17
   combinazioni, e l'alfabeto esclude 0/O/1/I/L, che al telefono si
   dettano male.

   I CONFLITTI NON SI RISOLVONO DA SOLI. Giochi sul fisso fino al giorno
   41, poi apri il portatile fermo al 34: qualunque regola automatica
   butta via una delle due sessioni. Quindi il server tiene un numero di
   versione e, se non torna, RIFIUTA la scrittura e restituisce cosa ha.
   A decidere è il giocatore, guardando due date e due giorni di gioco.
   =================================================================== */
'use strict';

const crypto = require('crypto');

/* --------------------------------------------------------------- */
/* la memoria                                                       */
/* --------------------------------------------------------------- */
/* Due implementazioni dietro la stessa porta. Con DATABASE_URL si usa
   Postgres; senza, una memoria volatile che serve a provare tutto in
   locale senza avere un database installato. Non è un trucco da test:
   è anche il modo in cui chi clona il repo può far girare il gioco
   intero senza configurare niente. */

const LIMITE_DATI = 2 * 1024 * 1024;      // 2 MB: un salvataggio ne pesa 0,14
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';   // niente 0 O 1 I L

function nuovoCodice(){
  const b = crypto.randomBytes(12);
  let s = '';
  for(let i=0;i<12;i++){
    if(i && i%4===0) s += '-';
    s += ALFABETO[b[i] % ALFABETO.length];
  }
  return 'FIORALBA-' + s;
}

/* Il codice arriva da fuori: si normalizza e si accetta solo se ha la
   forma giusta, così una richiesta storta non arriva mai al database. */
function codiceValido(c){
  return typeof c === 'string' && /^FIORALBA-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(c.toUpperCase());
}

function creaMemoriaVolatile(){
  const dentro = new Map();
  console.warn('  ⚠ Nessun DATABASE_URL: i salvataggi sincronizzati stanno in memoria\n' +
               '    e spariscono al riavvio. Va bene per provare, non per giocare davvero.');
  return {
    tipo: 'volatile',
    async prepara(){},
    async leggi(codice){ return dentro.get(codice) || null; },
    async scrivi(codice, dati, versione, giornoTot, nome, sommario){
      dentro.set(codice, { codice, dati, versione, giorno_tot:giornoTot, nome, sommario,
                           aggiornato:new Date().toISOString() });
      return dentro.get(codice);
    },
    async crea(codice){
      dentro.set(codice, { codice, dati:null, versione:0, giorno_tot:0, nome:null,
                           aggiornato:new Date().toISOString() });
      return dentro.get(codice);
    },
    async cancella(codice){ return dentro.delete(codice); }
  };
}

function creaMemoriaPostgres(url){
  const { Pool } = require('pg');
  /* `ssl` con rejectUnauthorized:false: dentro Railway il collegamento
     passa dalla rete privata e il certificato è interno. Fuori (per
     esempio provando dal proprio computer) serve comunque TLS. */
  const pool = new Pool({
    connectionString: url,
    ssl: /localhost|127\.0\.0\.1/.test(url) ? false : { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30000
  });
  pool.on('error', e => console.warn('[partite] pool:', e.message));

  return {
    tipo: 'postgres',
    async prepara(){
      /* Lo schema si crea da sé al primo avvio: una migrazione a mano è
         un passo che si dimentica, e questa tabella è una sola. */
      await pool.query(`
        create table if not exists partite (
          codice      text primary key,
          dati        text,
          versione    integer     not null default 0,
          giorno_tot  integer     not null default 0,
          nome        text,
          /* Una manciata di numeri per riconoscere una partita senza
             scaricarne 140 KB: stagione, giorno, anno, monete. Serve alla
             finestra del conflitto, che senza mostrava «A che punto —» e
             «Monete —» proprio nel momento in cui bisogna decidere. */
          sommario    text,
          creato      timestamptz not null default now(),
          aggiornato  timestamptz not null default now()
        )`);
      /* Per fare pulizia un giorno: le partite mai più toccate. Non
         cancella niente adesso — solo l'indice per poterlo fare. */
      await pool.query('create index if not exists partite_aggiornato on partite (aggiornato)');
      // chi ha già la tabella di ieri non deve ricrearla a mano
      await pool.query('alter table partite add column if not exists sommario text');
    },
    async leggi(codice){
      const r = await pool.query('select * from partite where codice = $1', [codice]);
      return r.rows[0] || null;
    },
    async scrivi(codice, dati, versione, giornoTot, nome, sommario){
      const r = await pool.query(
        `update partite set dati=$2, versione=$3, giorno_tot=$4, nome=$5, sommario=$6, aggiornato=now()
         where codice=$1 returning *`,
        [codice, dati, versione, giornoTot, nome, sommario]);
      return r.rows[0] || null;
    },
    async crea(codice){
      const r = await pool.query(
        'insert into partite (codice) values ($1) returning *', [codice]);
      return r.rows[0];
    },
    async cancella(codice){
      const r = await pool.query('delete from partite where codice = $1', [codice]);
      return r.rowCount > 0;
    }
  };
}

const memoria = process.env.DATABASE_URL
  ? creaMemoriaPostgres(process.env.DATABASE_URL)
  : creaMemoriaVolatile();

let pronta = null;
function assicura(){
  if(!pronta) pronta = memoria.prepara().catch(e=>{
    console.error('[partite] non riesco a preparare la memoria:', e.message);
    pronta = null;                      // si riproverà alla richiesta dopo
    throw e;
  });
  return pronta;
}

/* --------------------------------------------------------------- */
/* un freno contro gli abusi                                        */
/* --------------------------------------------------------------- */
/* Non è sicurezza, è buon senso: l'endpoint accetta scritture da 140 KB
   e chiunque conosca l'indirizzo può chiamarlo. Trenta richieste al
   minuto per indirizzo bastano e avanzano a chi gioca. */
const visite = new Map();
function troppoSpesso(ip){
  const ora = Date.now();
  const v = visite.get(ip) || { da:ora, n:0 };
  if(ora - v.da > 60000){ v.da = ora; v.n = 0; }
  v.n++;
  visite.set(ip, v);
  if(visite.size > 5000) visite.clear();        // non cresce all'infinito
  return v.n > 30;
}

/* --------------------------------------------------------------- */
/* le risposte                                                      */
/* --------------------------------------------------------------- */
function json(res, stato, corpo){
  const testo = JSON.stringify(corpo);
  res.writeHead(stato, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(testo),
    'Cache-Control': 'no-store'
  });
  res.end(testo);
}

function corpoDi(req, limite){
  return new Promise((ok, no)=>{
    let n = 0; const pezzi = [];
    req.on('data', d=>{
      n += d.length;
      if(n > limite){ no(new Error('troppo grande')); req.destroy(); return; }
      pezzi.push(d);
    });
    req.on('end', ()=>{
      try{ ok(pezzi.length ? JSON.parse(Buffer.concat(pezzi).toString('utf8')) : {}); }
      catch(e){ no(new Error('json illeggibile')); }
    });
    req.on('error', no);
  });
}

/* quello che si racconta di una partita senza spedire i 140 KB */
function scheda(r){
  let s = null;
  try{ s = r.sommario ? JSON.parse(r.sommario) : null; }catch(e){}
  return Object.assign({ codice:r.codice, versione:r.versione, giornoTot:r.giorno_tot,
           nome:r.nome, aggiornato:r.aggiornato, vuota: !r.dati }, s || {});
}

/* --------------------------------------------------------------- */
/* le rotte                                                         */
/* --------------------------------------------------------------- */
/* Ritorna true se ha gestito la richiesta. */
async function gestisci(req, res, rel){
  if(!rel.startsWith('/api/')) return false;

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
          || req.socket.remoteAddress || 'ignoto';
  if(troppoSpesso(ip)){ json(res, 429, { errore:'troppe richieste, aspetta un minuto' }); return true; }

  try{ await assicura(); }
  catch(e){ json(res, 503, { errore:'memoria non disponibile' }); return true; }

  /* POST /api/partita — un codice nuovo */
  if(rel === '/api/partita' && req.method === 'POST'){
    let riga = null;
    for(let tentativo=0; tentativo<5 && !riga; tentativo++){
      try{ riga = await memoria.crea(nuovoCodice()); }
      catch(e){ if(tentativo===4) throw e; }      // collisione: si ritira
    }
    json(res, 201, scheda(riga));
    return true;
  }

  const m = rel.match(/^\/api\/partita\/([A-Za-z0-9-]+)(\/stato)?$/);
  if(!m){ json(res, 404, { errore:'non esiste' }); return true; }

  const codice = m[1].toUpperCase();
  const soloStato = !!m[2];
  if(!codiceValido(codice)){ json(res, 400, { errore:'codice non valido' }); return true; }

  /* GET — lo stato (leggero) o la partita intera */
  if(req.method === 'GET'){
    const riga = await memoria.leggi(codice);
    if(!riga){ json(res, 404, { errore:'nessuna partita con questo codice' }); return true; }
    if(soloStato){ json(res, 200, scheda(riga)); return true; }
    json(res, 200, Object.assign(scheda(riga), { dati: riga.dati }));
    return true;
  }

  /* PUT — scrive, ma solo se il giocatore sa a che versione era */
  if(req.method === 'PUT'){
    let corpo;
    try{ corpo = await corpoDi(req, LIMITE_DATI + 4096); }
    catch(e){ json(res, 413, { errore:e.message }); return true; }

    if(typeof corpo.dati !== 'string' || !corpo.dati.length){
      json(res, 400, { errore:'manca il salvataggio' }); return true;
    }
    if(corpo.dati.length > LIMITE_DATI){
      json(res, 413, { errore:'salvataggio troppo grande' }); return true;
    }
    const riga = await memoria.leggi(codice);
    if(!riga){ json(res, 404, { errore:'nessuna partita con questo codice' }); return true; }

    /* IL CUORE DI TUTTO. Chi scrive dichiara da che versione parte. Se
       nel frattempo ha scritto un altro dispositivo, i numeri non
       tornano: non si sovrascrive niente e si restituisce cosa c'è, con
       409. Decidere quale delle due partite tenere è del giocatore, e
       nessun automatismo lo fa meglio di lui. */
    const attesa = Number(corpo.versione);
    if(Number.isFinite(attesa) && attesa !== riga.versione){
      json(res, 409, { errore:'conflitto', server: scheda(riga) });
      return true;
    }

    const salvata = await memoria.scrivi(
      codice, corpo.dati, riga.versione + 1,
      Number(corpo.giornoTot) || 0,
      typeof corpo.nome === 'string' ? corpo.nome.slice(0, 40) : null,
      corpo.sommario ? JSON.stringify(corpo.sommario).slice(0, 500) : null);
    json(res, 200, scheda(salvata));
    return true;
  }

  /* DELETE — la partita non c'è più.

     Serve perché «elimina» non sia una bugia: finché la riga resta,
     chiunque abbia il codice riapre la partita, e un elenco ripulito
     solo sul proprio apparecchio non ha cancellato niente.

     Non c'è cestino e non c'è «annulla»: chi arriva qui è passato da una
     finestra che gli ha fatto rileggere nome, stagione e monete di
     quello che sta buttando. Un cestino sul server vorrebbe dire
     conservare per sempre partite che qualcuno ha chiesto di togliere,
     ed è la scelta opposta a quella che chiede chi preme. */
  if(req.method === 'DELETE'){
    const cera = await memoria.cancella(codice);
    if(!cera){ json(res, 404, { errore:'nessuna partita con questo codice' }); return true; }
    json(res, 200, { cancellata:true, codice });
    return true;
  }

  json(res, 405, { errore:'metodo non ammesso' });
  return true;
}

module.exports = { gestisci, nuovoCodice, codiceValido, tipoMemoria: ()=>memoria.tipo };
