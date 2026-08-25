---
name: Staccionata sprite mapping
description: Mappa definitiva di Set01 (staccionata.png) verso lati bitmask e come estendere coerenza.js per nuovi fogli non-arredo.
---

## Foglio staccionata.png (Set01)
- File: `img/staccionata.png`, 1448×1086 px, 4 col × 2 righe
- Ogni cella: 362×543 px (w=cella, h=altezza in DATA.STACCIONATA)
- Caricato come `foglio:staccionata` tramite `IMG.precarica({ staccionata: DATA.STACCIONATA }, 'foglio:')`

### Mappa lati (bitmask N=1 E=2 S=4 W=8) → {col, row}
| lati | desc     | col | row |
|------|----------|-----|-----|
| 15   | NESW     | 0   | 0   |
| 5    | NS       | 1   | 0   |
| 14   | SEW      | 2   | 0   |
| 11   | NEW      | 3   | 0   |
| 12   | SW       | 0   | 1   |
| 10   | EW       | 1   | 1   |
| 6    | ES       | 2   | 1   |
| 3    | NE       | 3   | 1   |
| 9    | NW       | —   | —   | ← derivato: flip orizzontale di NE (3)

**Configurazioni non coperte** (procedurale): 0, 1, 2, 4, 7, 8, 13

**Why:** identificazione visiva dalla preview HTML in `/pr2.html` (rimossa dopo), confermata pixel analysis con ImageMagick sui bordi tile.

## Come aggiungere un foglio non-arredo a coerenza.js
Per un nuovo PNG non in `DATA.ARREDI`:
1. Aggiungi la costante `D.NOME_FOGLIO = { file:'...png', cella:..., altezza:... }` in `data.js`
2. Aggiungi un blocco verifica (simile al blocco RECINTI) in `tools/coerenza.js` → `usati.add(NOME.file)` + check dimensioni
3. Aggiungi `'NOME_FOGLIO'` alla riga `for (const nome of ['GATTO', 'RECINTI', 'STACCIONATA'])` in coerenza.js
4. Aggiungi `IMG.precarica({ nome: DATA.NOME_FOGLIO }, 'foglio:')` in `game.js`

**Why:** senza il passo 2-3 il PNG viene segnalato come "non lo usa nessuno" dal check di coerenza (riga ~3234 di coerenza.js).
