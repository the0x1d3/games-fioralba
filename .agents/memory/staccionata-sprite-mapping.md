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

## Rendering: padding per eliminare i gap tra tile

Le celle 362×543 hanno margini interni asimmetrici (misurati con `magick -trim`):
- NS: T=56 B=2  — senza fix → 6.8 px gap tra tile verticali
- NESW: B=88    — senza fix → 5 px gap sul lato S
- EW: L=9 R=4   — senza fix → 2.3 px gap tra tile orizzontali

**Fix in `recintoIllustrato` (art.js):** disegnare lo sprite con padding `PX=8, PY=16`:
```javascript
const PX=8, PY=16;
cx.drawImage(foglio, srcX, srcY, cw, ch, -PX, -PY, T+2*PX, T+2*PY);
// per NW (flip di NE): -(T+PX) come x-destinazione
```
Lo sprite viene scalato a (T+2PX)×(T+2PY) = 80×96 e centrato sul canvas T×T (64×64).
Il canvas taglia automaticamente l'overdraw → il contenuto raggiunge esattamente i bordi, gap=0.

**Why:** i margini nel foglio sprite non sono noti a priori; il padding uniforme copre il caso peggiore (B=88 richiede PY≥16) senza modificare la struttura per ogni lati separatamente.

## Come aggiungere un foglio non-arredo a coerenza.js
Per un nuovo PNG non in `DATA.ARREDI`:
1. Aggiungi la costante `D.NOME_FOGLIO = { file:'...png', cella:..., altezza:... }` in `data.js`
2. Aggiungi un blocco verifica (simile al blocco RECINTI) in `tools/coerenza.js` → `usati.add(NOME.file)` + check dimensioni
3. Aggiungi `'NOME_FOGLIO'` alla riga `for (const nome of ['GATTO', 'RECINTI', 'STACCIONATA'])` in coerenza.js
4. Aggiungi `IMG.precarica({ nome: DATA.NOME_FOGLIO }, 'foglio:')` in `game.js`

**Why:** senza il passo 2-3 il PNG viene segnalato come "non lo usa nessuno" dal check di coerenza (riga ~3234 di coerenza.js).
