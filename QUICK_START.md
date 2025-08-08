# 🚀 ISTRUZIONI RAPIDE - AVVIO SISTEMA
## Quick Start Guide - Aggiornato 9 Agosto 2025

---

## ✅ BACKEND (100% FUNZIONANTE)

### Avvio Rapido
```bash
# Terminal 1
cd /Users/lucamambelli/Desktop/Gestione-Calcio/backend
npm run dev
```

### Verifica Funzionamento
```bash
# Terminal 2 (test)
curl http://localhost:3000/health
```

### Output Atteso
```
💰 Payment Service inizializzato
✅ Database connesso
🚀 Server avviato su http://localhost:3000
🔌 Socket.io attivo
✅ Tutti i servizi attivi
```

---

## 🎨 FRONTEND

### Avvio Rapido
```bash
# Terminal 3
cd /Users/lucamambelli/Desktop/Gestione-Calcio
npm run dev
```

### Accesso
- **URL**: http://localhost:5173
- **Login**: demo@soccermanager.com
- **Password**: demo123456

---

## 🔧 TROUBLESHOOTING

### Se il Backend non parte
```bash
# 1. Verifica PostgreSQL
ps aux | grep postgres

# 2. Pulisci cache
cd backend
rm -rf node_modules/.cache
rm -rf dist

# 3. Riavvia
npm run dev
```

### Se il Frontend non parte
```bash
# 1. Verifica porta
lsof -i :5173

# 2. Reinstalla dipendenze
npm install

# 3. Riavvia
npm run dev
```

---

## 📊 STATO SISTEMA (09/08/2025)

| Componente | Status | Porta | Note |
|------------|--------|-------|------|
| Backend | ✅ ATTIVO | 3000 | Tutti gli errori TypeScript risolti |
| Frontend | ⏳ Da verificare | 5173 | Da testare |
| Database | ✅ ATTIVO | 5432 | PostgreSQL funzionante |
| Socket.io | ✅ ATTIVO | 3000 | Real-time attivo |

---

## 🎯 COMANDI UTILI

### Database
```bash
# Migrazioni
cd backend
npx prisma migrate dev

# Studio (GUI)
npx prisma studio

# Reset
npx prisma migrate reset
```

### Git
```bash
# Salva modifiche
git add -A
git commit -m "feat: descrizione"
git push origin main

# Stato
git status
git log --oneline -5
```

### Processi
```bash
# Kill backend
pkill -f nodemon

# Kill frontend
pkill -f vite

# Kill tutto
pkill -f node
```

---

## 📝 FILE IMPORTANTI

### Configurazione
- Backend: `/backend/.env`
- Frontend: `/.env`
- Database: `/backend/prisma/schema.prisma`

### Log e Documentazione
- Stato Sistema: `/Docs/STATO_SISTEMA_09_AGOSTO_AGGIORNATO.md`
- Log Correzioni: `/Docs/Correzioni/LOG_CORREZIONI_BACKEND_09_AGOSTO.md`
- Tracking: `/TRACKING-SVILUPPO.md`

---

## 🆘 HELP

### Errori Comuni Risolti
1. ✅ TypeScript compilation errors
2. ✅ Missing imports
3. ✅ Null value handling
4. ✅ PDF generation
5. ✅ Email service

### Da Risolvere
1. ⏳ Frontend verification
2. ⏳ Test completi
3. ⏳ Performance optimization

---

**Quick Start creato**: 9 Agosto 2025  
**Sistema**: Soccer Management System v2.1.0  
**Status**: 🟢 Backend Operativo | 🟡 Frontend da verificare
