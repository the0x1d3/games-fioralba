---
name: Lockfile per Railway
description: Compatibilità fra il Package Firewall di Replit e i builder npm esterni.
---

Quando il progetto viene pubblicato su Railway o un altro builder esterno, ogni
campo `resolved` di `package-lock.json` deve puntare al registry pubblico npm,
non a `package-firewall.replit.local`.

**Why:** quel nome host esiste soltanto nella rete di Replit; un builder esterno
fallisce con `ENOTFOUND` durante `npm install`, anche se le versioni e gli
integrity checksum del lockfile sono corretti.

**How to apply:** prima di inviare un lockfile a un host esterno, cercare
`package-firewall.replit.local` e sostituire il solo prefisso del registry con
`https://registry.npmjs.org/`. Verificare poi con un `npm ci` pulito.