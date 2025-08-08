# 🎯 ISTRUZIONI PER NUOVA SESSIONE CLAUDE
## Come Continuare lo Sviluppo del Soccer Management System

**Data Documento:** 9 Agosto 2025  
**Versione Sistema:** 3.1.0  
**Completamento:** 70%

---

## 🚀 QUICK START PER NUOVA SESSIONE

### 1️⃣ **PRIMA DI TUTTO - LEGGI QUESTI DOCUMENTI**

```bash
# Nella directory: /Users/lucamambelli/Desktop/Gestione-Calcio

1. TRACKING-SVILUPPO.md          # 📊 Stato completo del sistema (LEGGI PRIMA!)
2. README.md                      # 📋 Indice generale documentazione
3. SISTEMA-NOTIFICHE-DOCUMENTAZIONE.md  # Se lavori su notifiche
4. Docs/PARTE-1-CONFIGURAZIONE.md       # Setup e configurazione
5. Docs/PARTE-2-DATABASE-SERVIZI.md     # Schema DB e servizi
6. Docs/PARTE-3-OTTIMIZZAZIONI-CACHE.md # Cache e ottimizzazioni
```

### 2️⃣ **SETUP AMBIENTE - COMANDI RAPIDI**

```bash
# BACKEND (Terminal 1)
cd /Users/lucamambelli/Desktop/Gestione-Calcio/backend
npm run dev
# Server running on http://localhost:3000

# FRONTEND (Terminal 2)  
cd /Users/lucamambelli/Desktop/Gestione-Calcio
npm run dev
# App running on http://localhost:5173

# DATABASE (se necessario)
# PostgreSQL già running su: postgresql://lucamambelli@localhost:5432/soccer_management
```

### 3️⃣ **CREDENZIALI ACCESSO**

```
Frontend Login:
- Email: demo@soccermanager.com
- Password: demo123456

GitHub:
- User: 241luca
- PWD: 241-Mambo
- Token: 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
- Repo: https://github.com/241luca/gestione-calcio

Database:
- postgresql://lucamambelli@localhost:5432/soccer_management
```

---

## 📊 STATO ATTUALE DEL SISTEMA

### ✅ **MODULI COMPLETATI (100%)**
1. **🔐 Autenticazione** - JWT, refresh tokens, middleware
2. **👥 Gestione Atleti** - CRUD completo, import CSV, validazioni
3. **📄 Gestione Documenti** - Upload, scadenze, verifica staff
4. **🔔 Sistema Notifiche** - Email, real-time, scheduler
5. **📊 Dashboard** - Widget, grafici, KPI
6. **⚙️ Impostazioni** - Gestione società, utenti, backup
7. **💰 Gestione Pagamenti** - NUOVO! PDF, Excel, Report

### 🟡 **MODULI PARZIALI**
- **⚽ Partite (60%)** - Manca: convocazioni, formazioni, statistiche
- **👨‍👩‍👧‍👦 Staff (80%)** - Manca: permessi dettagliati
- **🏆 Competizioni (80%)** - Manca: classifica automatica
- **💼 Sponsor (80%)** - Manca: tracking pagamenti

### 🔴 **MODULI DA FARE**
- **🚌 Trasporti (10%)** - Solo backend base
- **📈 Reports Avanzati (30%)** - Solo placeholder
- **🏥 Infortuni (0%)** - Non iniziato
- **🎯 Allenamenti (0%)** - Non iniziato
- **💬 Messaggistica (0%)** - Non iniziato
- **📸 Media (0%)** - Non iniziato
- **📱 App Mobile (0%)** - Non iniziato

---

## 🎯 ROADMAP PRIORITIZZATA

### 🔥 **PRIORITÀ ALTA - Completa Core Business**

#### 1. **⚽ COMPLETARE PARTITE** (2 giorni)
```javascript
// FILE DA MODIFICARE:
src/pages/CalendarPage.jsx         // Ora solo calendario base
src/pages/MatchDetailPage.jsx      // DA CREARE
backend/src/services/match.service.ts
backend/src/routes/match.routes.ts

// FEATURES DA IMPLEMENTARE:
- Sistema convocazioni con email
- Gestione formazioni (titolari/panchina)
- Inserimento live risultati
- Statistiche giocatori (goal, assist, cartellini)
- Report partita PDF
- Share con genitori
```

#### 2. **🎯 ALLENAMENTI** (1 giorno)
```javascript
// FILE DA CREARE:
src/pages/TrainingPage.jsx
backend/src/services/training.service.ts
backend/src/routes/training.routes.ts

// FEATURES:
- Calendario settimanale allenamenti
- Registro presenze veloce
- Report mensili presenze
- Notifiche assenze
- Schede tecniche
```

### 📊 **PRIORITÀ MEDIA - Analytics e Report**

#### 3. **📈 REPORTS AVANZATI** (2 giorni)
```javascript
// FILE DA MODIFICARE:
src/pages/ReportsPage.jsx    // Ora placeholder
backend/src/services/analytics.service.ts

// FEATURES:
- Dashboard analytics con D3.js
- Report customizzabili drag&drop
- Export schedulati
- Previsioni AI
- Confronti anno precedente
```

#### 4. **🏥 INFORTUNI** (1 giorno)
```javascript
// FILE DA CREARE:
src/pages/InjuriesPage.jsx
src/components/injuries/*

// FEATURES:
- Form registrazione infortunio
- Timeline recupero
- Certificati medici
- Report assicurazione
- Dashboard infortuni
```

### 🚀 **PRIORITÀ BASSA - Nice to Have**

#### 5. **🚌 TRASPORTI** (1 giorno)
- Sistema prenotazioni bus
- Gestione percorsi
- Split costi

#### 6. **💬 MESSAGGISTICA** (2 giorni)
- Chat interna
- Broadcast messaggi
- Notifiche push

#### 7. **📱 APP MOBILE** (5+ giorni)
- React Native
- API dedicate
- Offline mode

---

## 💻 COME IMPLEMENTARE UN NUOVO MODULO

### ESEMPIO: Implementare ALLENAMENTI

```bash
# 1. BACKEND - Crea il servizio
cat > backend/src/services/training.service.ts << 'EOF'
import { PrismaClient } from '@prisma/client';
// ... implementa CRUD base
EOF

# 2. BACKEND - Crea le routes
cat > backend/src/routes/training.routes.ts << 'EOF'
import { Router } from 'express';
// ... implementa endpoints
EOF

# 3. BACKEND - Registra route in server.ts
# Aggiungi: app.use('/api/v1/trainings', trainingRoutes);

# 4. FRONTEND - Crea la pagina
cat > src/pages/TrainingPage.jsx << 'EOF'
import React from 'react';
// ... implementa UI
EOF

# 5. FRONTEND - Aggiungi route in App.jsx
# Aggiungi: <Route path="trainings" element={<TrainingPage />} />

# 6. AGGIORNA DOCUMENTAZIONE
# Modifica TRACKING-SVILUPPO.md con nuovo stato

# 7. COMMIT E PUSH
git add -A
git commit -m "feat: implementato modulo allenamenti"
git push origin main
```

---

## 🐛 PROBLEMI COMUNI E SOLUZIONI

### Errore: "Token non valido"
```bash
# Soluzione: Clear localStorage
localStorage.clear()
# Rifare login
```

### Errore: "Cannot connect to database"
```bash
# Verifica PostgreSQL
psql -U lucamambelli -d soccer_management -c "SELECT 1"

# Se non funziona, restart PostgreSQL
brew services restart postgresql
```

### Errore: "Module not found"
```bash
# Backend
cd backend && npm install

# Frontend
cd .. && npm install
```

### Errore: "Port already in use"
```bash
# Kill processo su porta 3000
lsof -ti:3000 | xargs kill -9

# Kill processo su porta 5173
lsof -ti:5173 | xargs kill -9
```

---

## 📝 TEMPLATE COMMIT MESSAGE

```bash
# Per nuove feature
git commit -m "feat: [modulo] - descrizione breve

IMPLEMENTATO:
- Feature 1
- Feature 2

FILE MODIFICATI:
- path/to/file1
- path/to/file2"

# Per bugfix
git commit -m "fix: [modulo] - descrizione problema risolto"

# Per documentazione
git commit -m "docs: aggiornato [nome documento]"
```

---

## 🎨 STANDARD UI/UX DA MANTENERE

### Colori Badge Stati
```javascript
// SEMPRE usare questi colori per consistenza
const STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  OVERDUE: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-red-100 text-red-800',
  EXPIRING: 'bg-orange-100 text-orange-800'
};
```

### Struttura Modal
```javascript
// SEMPRE usare questa struttura per modal
<div className="fixed inset-0 z-50 overflow-y-auto">
  <div className="flex items-center justify-center min-h-screen px-4">
    <div className="fixed inset-0 transition-opacity" onClick={closeModal}>
      <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
    </div>
    <div className="bg-white rounded-lg p-6 max-w-md w-full z-10">
      {/* Contenuto modal */}
    </div>
  </div>
</div>
```

### Toast Notifications
```javascript
// SEMPRE usare react-hot-toast
import { toast } from 'react-hot-toast';

toast.success('Operazione completata');
toast.error('Errore nell\'operazione');
toast.loading('Caricamento...');
```

---

## 📊 METRICHE DA MONITORARE

Dopo ogni implementazione, aggiorna:

1. **TRACKING-SVILUPPO.md**
   - Percentuale completamento modulo
   - File creati/modificati
   - Features implementate
   - Known issues

2. **Test Coverage**
   ```bash
   cd backend
   npm test -- --coverage
   ```

3. **Performance**
   - Tempo caricamento pagine < 2s
   - API response time < 500ms
   - Bundle size < 1MB

---

## 🚦 CHECKLIST PRE-COMMIT

- [ ] Codice testato manualmente
- [ ] Nessun console.log() dimenticato
- [ ] Documentazione aggiornata
- [ ] TRACKING-SVILUPPO.md aggiornato
- [ ] Commit message descrittivo
- [ ] Push su GitHub

---

## 💡 SUGGERIMENTI PER CLAUDE

### Quando chiedi a Claude di implementare qualcosa:

```markdown
"Ciao Claude, sto lavorando sul Soccer Management System.

CONTESTO:
- Directory: /Users/lucamambelli/Desktop/Gestione-Calcio
- Sistema al 70% completo
- Ultimo modulo completato: Pagamenti

RICHIESTA:
Voglio implementare [NOME MODULO]

Per favore:
1. Leggi prima TRACKING-SVILUPPO.md per capire lo stato
2. Implementa backend e frontend completi
3. Aggiorna la documentazione
4. Fai commit con messaggio descrittivo"
```

### Per debugging:

```markdown
"Ho questo errore: [ERRORE]

File: [PATH FILE]
Contesto: [COSA STAVO FACENDO]

Per favore aiutami a risolverlo."
```

---

## 🎯 OBIETTIVI FINALI

### Target Completamento: 31 Agosto 2025

- **Settimana 2 (12-16 Ago)**: Partite, Allenamenti, Infortuni
- **Settimana 3 (19-23 Ago)**: Reports, Trasporti, Messaggistica  
- **Settimana 4 (26-30 Ago)**: App Mobile, Testing, Deploy

### Criteri di "DONE"
- ✅ Feature funzionante al 100%
- ✅ UI/UX consistente
- ✅ Documentazione aggiornata
- ✅ Commit su GitHub
- ✅ TRACKING-SVILUPPO.md aggiornato

---

## 🆘 HELP & SUPPORT

### Risorse Utili
- **Prisma Docs**: https://www.prisma.io/docs
- **React Docs**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Socket.io**: https://socket.io/docs/v4

### Contatti
- **GitHub Issues**: https://github.com/241luca/gestione-calcio/issues
- **Email**: lucamambelli@lmtecnologie.it

---

## ✨ ULTIMO CONSIGLIO

> "Non cercare di fare tutto perfetto al primo colpo. 
> Implementa, testa, migliora iterativamente.
> Il sistema è già molto avanzato, ogni modulo aggiunto 
> aggiunge valore immediato!"

**BUON LAVORO! 🚀**

---

*Documento creato per facilitare il passaggio tra sessioni di Claude*  
*Ultimo aggiornamento: 9 Agosto 2025 - Session 4*
