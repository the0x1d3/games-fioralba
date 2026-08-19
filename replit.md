# Avvio su Replit

Il progetto viene servito dal server Node già incluso:

```bash
npm start
```

Il workflow `Start application` lo avvia sulla porta `5000`, necessaria per
l'anteprima web di Replit.

Il gioco funziona anche senza `DATABASE_URL`; in quel caso i salvataggi
sincronizzati sul server restano in memoria e vengono persi al riavvio.
`localStorage` continua a gestire i salvataggi locali del browser.