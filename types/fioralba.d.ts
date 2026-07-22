/* ===================================================================
   FIORALBA — definizioni di tipo (JSDoc / TypeScript)
   -------------------------------------------------------------------
   Questo file NON viene caricato dal browser: serve solo all'editor
   (VS Code) e al type-checker per darti autocompletamento, descrizioni
   al passaggio del mouse e — sui file con "// @ts-check" — controllo
   degli errori. Nessun impatto sul gioco a runtime.

   È un file "globale": niente import/export in cima, così le
   dichiarazioni valgono in tutti i .js del progetto (che usano le
   variabili globali DATA, G, ART, ...).
   =================================================================== */

/* ------------------------------------------------------------------
   DATI DI GIOCO (js/data.js)
   ------------------------------------------------------------------ */

interface FioSeason {
  id: 'primavera' | 'estate' | 'autunno' | 'inverno';
  nome: string;
  grass: string; grass2: string; tree: string; accent: string;
}

interface FioMeteo { nome: string; icona: string; }

type FioFormaFrutto =
  | 'radice' | 'tubero' | 'foglia' | 'bacca' | 'fiore'
  | 'sfera' | 'pannocchia' | 'baccello' | 'grappolo';

interface FioCrop {
  nome: string;
  /** Stagioni in cui il seme germoglia. */
  stagioni: string[];
  /** Giorni per passare da una fase alla successiva. */
  fasi: number[];
  /** Prezzo di vendita del raccolto. */
  prezzo: number;
  /** Prezzo base del seme. */
  seme: number;
  /** Se presente, la pianta ricresce ogni N giorni invece di sparire. */
  ricresce?: number;
  forma: FioFormaFrutto;
  c1: string; c2: string; foglia: string;
  magica?: boolean;
}

/** Categorie possibili di un oggetto. */
type FioCat =
  | 'attrezzo' | 'seme' | 'raccolto' | 'foraggio' | 'pesce'
  | 'minerale' | 'materiale' | 'artigianato' | 'cibo'
  | 'animale' | 'speciale';

/**
 * Un oggetto dell'inventario/mondo. I campi variano molto per
 * categoria, quindi quasi tutto è opzionale: obbligatori solo
 * nome e cat.
 */
interface FioItem {
  nome: string;
  cat: FioCat;
  prezzo?: number;
  desc?: string;
  /** Nome dell'icona per gli attrezzi (js/art.js). */
  icona?: string;
  /** Per i semi: id della coltura che producono. */
  seme?: string;
  /** Per i raccolti: id della coltura di origine. */
  crop?: string;
  /** Energia ridata se mangiato. */
  energia?: number;
  /** Per il foraggio: stagione in cui appare. */
  stagione?: string;
  /** Per i pesci: stagioni pescabili. */
  stagioni?: string[];
  /** Per i pesci: 'fiume' | 'lago'. */
  luogo?: string;
  /** Per i pesci: difficoltà del minigioco. */
  diff?: number;
  notte?: boolean;
  raro?: boolean;
  spazzatura?: boolean;
  magica?: boolean;
  /** Effetto se usato sul terreno: 'concime' | 'ritenzione'. */
  uso?: string;
  /** Se posabile nel mondo: tipo dell'oggetto piazzato. */
  posabile?: string;
}

interface FioRecipe {
  id: string;
  /** Quante unità produce. */
  out: number;
  /** Ingredienti: id → quantità. */
  ing: Record<string, number>;
  /** Livello minimo richiesto. */
  liv?: number;
  cat?: 'podere' | 'macchine';
  stagione?: string;
}

interface FioCostruzione {
  id: string; nome: string; costo: number;
  ing: Record<string, number>; desc: string;
}

interface FioUpgrade {
  liv: number; nome: string; costo: number;
  ing: Record<string, number>;
}

interface FioSkill { nome: string; desc: string; }

/** Aspetto di un personaggio (giocatore o NPC). */
interface FioLook {
  pelle?: string; capelli?: string; maglia?: string; pant?: string;
  grembiule?: string | null; cappello?: string | null;
  barba?: boolean; spirito?: boolean;
}

interface FioNPC {
  nome: string; ruolo: string;
  look: FioLook;
  casa: string;
  battute: string[];
  amico?: string[];
  regali: { ama: string[]; piace: string[] };
}

interface FioBundle {
  id: string; nome: string; colore: string; testo: string;
  req: string[];
  premio: { oro: number; item: string };
}

interface FioLettera { titolo: string; testo: string; }

/** Struttura completa di window.DATA (js/data.js). */
interface FioData {
  SEASONS: FioSeason[];
  GIORNI_STAGIONE: number;
  GIORNI_SETTIMANA: string[];
  METEO: Record<string, FioMeteo>;
  CROPS: Record<string, FioCrop>;
  ITEMS: Record<string, FioItem>;
  FRUTTA: string[];
  CRAFT: FioRecipe[];
  CUCINA: FioRecipe[];
  SHOP_SEMPRE: string[];
  SHOP: Record<string, string[]>;
  SHOP_EXTRA: string[];
  COSTRUZIONI: FioCostruzione[];
  UPGRADE: Record<string, FioUpgrade[]>;
  UPG_NOMI: string[];
  SKILLS: Record<string, FioSkill>;
  XP_LIV: number[];
  NPCS: Record<string, FioNPC>;
  SANTUARIO: FioBundle[];
  LETTERE: Record<string, FioLettera>;
  RISVEGLI: string[];
  CONSIGLI: string[];
}

/* ------------------------------------------------------------------
   STATO DI GIOCO (js/game.js)
   ------------------------------------------------------------------ */

/** Una casella d'inventario: un oggetto e la sua quantità. */
interface FioSlot { id: string; n: number; }

/** Il giocatore. */
interface FioPlayer {
  px: number; py: number;
  /** 0 giù, 1 sinistra, 2 destra, 3 su. */
  dir: number;
  frame: number; animT: number; vx: number; vy: number;
  attrezzoVisibile: string | null;
  usoT: number; dorme: boolean; blink: boolean; blinkT: number;
  look: FioLook | null; correndo: boolean;
}

interface FioStats {
  raccolti: number; pesci: number; alberi: number;
  sassi: number; guadagno: number; giorniGiocati: number;
}

/**
 * Lo stato globale del gioco (window.G). Include i campi salvati e i
 * campi/metodi aggiunti a runtime. I moduli grafici e di mondo sono
 * volutamente lasciati liberi (any): tiparli darebbe poco valore.
 */
interface FioGame {
  /* --- anagrafica e progresso --- */
  nomeGiocatore: string;
  mappaId: string;
  oro: number;
  energia: number; energiaMax: number;
  giorno: number; stagioneIdx: number; anno: number; giornoTot: number;
  ora: number;
  meteo: string; meteoDomani: string;

  /* --- inventario --- */
  invMax: number;
  inv: Array<FioSlot | null>;
  slotSel: number;

  /* --- abilità e attrezzi --- */
  skills: Record<string, number>;
  attrezziLiv: Record<string, number>;

  /* --- relazioni --- */
  amicizia: Record<string, number>;
  regalatoOggi: Record<string, boolean>;
  parlatoOggi: Record<string, boolean>;

  /* --- costruzioni e lore --- */
  costruzioni: Record<string, boolean>;
  santuario: Record<string, boolean>;
  santuarioDato: Record<string, string[]>;
  braci: number;
  lettere: Record<string, boolean>;
  ricetteNote: Record<string, boolean>;
  vistoFiammella?: boolean;
  introSerafina?: boolean;
  tutorialFatto: boolean;

  /* --- economia e statistiche --- */
  cassaConsegna: FioSlot[];
  stats: FioStats;

  /* --- runtime --- */
  animali: any[];
  look: FioLook;
  /** Mappe di gioco, indicizzate per id. */
  maps: Record<string, any>;
  cam: { x: number; y: number };
  p: FioPlayer;
  bersaglio: { x: number; y: number; ok: boolean } | null;
  particelle: any[];
  tempoMs: number;
  inGioco: boolean;

  /* --- metodi principali --- */
  mappa(): any;
  stagione(): FioSeason;
  livello(abilita: string): number;
  xp(abilita: string, quanto: number): void;
  conta(id: string): number;
  puoiAggiungere(id: string, n?: number): boolean;
  aggiungi(id: string, n?: number): boolean;
  togli(id: string, n?: number): boolean;
  togliSlot(indice: number, n?: number): void;
  slot(): FioSlot | null;
  prezzoVendita(id: string): number;
  aggiornaHUD(): void;
  npcVivi(): any[];
  luci(): any[];
  mangia(indice: number): void;
  regala(npcId: string, indice: number): void;
  salva(): boolean;

  /* valvola di sicurezza per campi/metodi aggiunti dinamicamente */
  [extra: string]: any;
}

/* ------------------------------------------------------------------
   AIUTANTE OGGETTI (window.IT, js/ui.js)
   Gestisce anche gli id composti tipo "vino:uva".
   ------------------------------------------------------------------ */
interface FioIT {
  base(id: string): string;
  src(id: string): string | null;
  nome(id: string): string;
  prezzo(id: string): number;
  cat(id: string): FioCat;
  desc(id: string): string;
  energia(id: string): number;
  commestibile(id: string): boolean;
}

/* ------------------------------------------------------------------
   MODULI GLOBALI
   ------------------------------------------------------------------ */
declare const DATA: FioData;
declare const G: FioGame;
declare const IT: FioIT;

/** Motore di pixel-art procedurale (js/art.js). */
declare const ART: any;
/** Effetti: vento, ombre, bloom (js/fx.js). */
declare const FX: any;
/** Audio procedurale (js/audio.js). */
declare const SND: any;
/** Mappe, collisioni, respawn (js/world.js). */
declare const WORLD: any;
/** Fauna (js/mobs.js). */
declare const MOBS: any;
/** Interfaccia: menu, negozi, dialoghi (js/ui.js). */
declare const UI: any;
/** Camera, terreni, luci, meteo (js/render.js). */
declare const REND: any;
/** Guida interattiva (js/tutorial.js). */
declare const TUT: any;

interface Window {
  DATA: FioData;
  G: FioGame;
  IT: FioIT;
  ART: any; FX: any; SND: any; WORLD: any;
  MOBS: any; UI: any; REND: any; TUT: any;
}
