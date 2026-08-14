# img/ — l'arte che non è disegnata in codice

Qui stanno gli sprite **rimpiccioliti**, quelli che il gioco carica davvero.
I sorgenti ad alta risoluzione stanno in `sprite-new/` e non vengono mai
serviti: sono 3,6 MB contro i 152 KB di questa cartella, e caricarli come
sono quadruplicherebbe il peso della pagina.

## Perché non sono disegnati in codice

Fino a qui la regola del repo era «niente file inventati: sprite e suoni si
disegnano nel codice», ed è ancora vera per tutto il resto. Questi sono
un'eccezione voluta: sono disegnati a mano dal proprietario, a una densità
che in codice non si riproduce.

## Come si rimpiccioliscono

**A metà per volta, non in un colpo solo.** Passare da 1066 px a 192 con un
`drawImage` unico fa campionare al browser un pixel ogni cinque e il
risultato sgrana; dimezzando a ogni passo, ogni pixel di partenza finisce
nella media. È il motivo per cui l'intaglio della testata sopravvive.

Il rimpicciolimento si fa nel browser (canvas), non con uno strumento a
riga di comando: `tools/` non ha dipendenze e Node da solo non sa leggere
un PNG. Il risultato si committa qui.

## Le misure, e da dove vengono

Sono l'impronta in caselle moltiplicata per la casella. Con la casella a
**64**:

| file | impronta | misura |
|------|----------|--------|
| letto.png    | 2×3    | 128×192 |
| tavolo.png   | 2×1,5  | 128×96  |
| sedia.png    | 1×1,5  | 64×96   |
| baule.png    | 1,5×1  | 96×64   |
| camino.png   | 1,5×2  | 96×128  |
| forno.png    | 1,5×1,5| 96×96   |
| lanterna.png | 0,75×1,5 | 48×96 |
| omino.png    | 1×1,5  | 64×96   |

Se la casella cambia, si riesporta da `sprite-new/`: è per questo che i
sorgenti grossi restano nel repo invece di essere buttati.
