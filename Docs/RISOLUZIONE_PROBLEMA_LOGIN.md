# 🔧 RISOLUZIONE PROBLEMA LOGIN
## "Sessione Scaduta" - Debug e Soluzioni

**Data:** 8 Agosto 2025  
**Problema:** Login restituisce "sessione scaduta"  
**Utente:** Luca Mambelli

---

## 📊 ANALISI DEL PROBLEMA

### Possibili Cause:
1. ❌ **Credenziali errate** nel frontend
2. ❌ **Backend non raggiungibile** dal frontend
3. ❌ **Token JWT** non gestito correttamente
4. ❌ **Database** non popolato correttamente
5. ❌ **CORS** bloccato

---

## ✅ SOLUZIONI APPLICATE

### 1. **Aggiornate Credenziali Login**
Prima (errate):
```
email: demo@soccermanager.com
password: demo123456
```

Dopo (corrette dal seed):
```
email: admin@juventusacademymilano.it
password: password123
```

### 2. **Verifica Proxy Vite**
Il file `vite.config.js` è configurato correttamente:
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
    secure: false
  }
}
```

### 3. **Test Diretto API**
```bash
# Test login backend
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@juventusacademymilano.it","password":"password123"}'
```

---

## 🔍 CHECKLIST VERIFICA

### Backend:
- [ ] Backend avviato su porta 3000
- [ ] Nessun errore in console
- [ ] Database connesso
- [ ] Seed eseguito con successo

### Frontend:
- [ ] Frontend avviato su porta 5173
- [ ] Proxy configurato in vite.config.js
- [ ] Credenziali aggiornate in LoginPage.jsx

### Test:
1. Apri http://localhost:5173/login
2. Clicca "Usa credenziali di test"
3. Clicca "Accedi"

---

## 🎯 CREDENZIALI CORRETTE

### Admin (Accesso completo):
- **Email:** admin@juventusacademymilano.it
- **Password:** password123

### Allenatore:
- **Email:** allenatore@juventusacademymilano.it
- **Password:** password123

### Dirigente:
- **Email:** dirigente@juventusacademymilano.it
- **Password:** password123

---

## 🚀 COMANDI PER AVVIARE

### Terminal 1 - Backend:
```bash
cd backend
npm run dev
# Deve mostrare: "Server avviato su http://localhost:3000"
```

### Terminal 2 - Frontend:
```bash
cd /Users/lucamambelli/Desktop/Gestione-Calcio
npm run dev
# Deve mostrare: "Local: http://localhost:5173"
```

---

## ⚠️ SE ANCORA NON FUNZIONA

### 1. Verifica che il seed sia stato completato:
```bash
cd backend
npx ts-node prisma/seed-complete.ts
```

### 2. Verifica che ci siano utenti nel database:
```bash
cd backend
npx prisma studio
# Si apre browser, controlla tabella "User"
```

### 3. Pulisci cache browser:
- Apri Chrome DevTools (F12)
- Application → Storage → Clear site data
- Ricarica pagina

### 4. Controlla console browser per errori:
- F12 → Console
- Cerca errori rossi
- Controlla Network tab per chiamate API

---

## 📝 LOG ERRORI COMUNI

### Errore: "Network Error"
**Soluzione:** Backend non avviato o porta sbagliata

### Errore: "401 Unauthorized"  
**Soluzione:** Token scaduto o credenziali errate

### Errore: "CORS blocked"
**Soluzione:** Verificare proxy in vite.config.js

### Errore: "Cannot read property 'data' of undefined"
**Soluzione:** Response non nel formato atteso

---

## ✅ RISULTATO ATTESO

Dopo il login con successo:
1. Token salvato in localStorage
2. Redirect a /dashboard
3. Menu laterale visibile
4. Dati atleti caricati

---

**Documento creato da:** Claude Assistant  
**Status:** In risoluzione
