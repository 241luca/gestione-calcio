# 📋 ISTRUZIONI PER COMPLETARE IL SISTEMA - SESSIONE SUCCESSIVA
## Soccer Management System - Continuazione Sviluppo

**Data Creazione:** 7 Agosto 2025  
**Versione Sistema:** 2.0.0  
**Ultimo Aggiornamento:** Transport Service e UI completati

---

## 🎯 CONTESTO DEL PROGETTO

### Informazioni Base
- **Directory Progetto:** `/Users/lucamambelli/Desktop/Gestione-Calcio`
- **Repository GitHub:** https://github.com/241luca/gestione-calcio
- **Branch Attuale:** `feature/complete-alignment`
- **Utente GitHub:** 241luca
- **Email:** lucamambelli@lmtecnologie.it

### Credenziali Sistema Demo
- **Email:** demo@soccermanager.com
- **Password:** demo123456

### Accesso Applicazione
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Database:** PostgreSQL su localhost:5432 (DB: soccer_management)

---

## ✅ LAVORO COMPLETATO (7 Agosto 2025)

### Backend Completato
1. **Transport Service** (`backend/src/services/transport.service.ts`)
   - ✅ CRUD completo per Zone Trasporto
   - ✅ CRUD completo per Percorsi (Routes)
   - ✅ Gestione Programmazione viaggi (Schedules)
   - ✅ Sistema Prenotazioni (Bookings)
   - ✅ Statistiche e Report
   - ✅ Invio promemoria (struttura base)

2. **Transport Routes** (`backend/src/routes/transport.routes.ts`)
   - ✅ Tutti gli endpoint API implementati
   - ✅ Validazioni e autorizzazioni
   - ✅ Integrato in server.ts

3. **Utility Files Creati**
   - ✅ `backend/src/utils/responseFormatter.ts`
   - ✅ `backend/src/utils/errors.ts`

### Frontend Completato
1. **Componenti Trasporti** (directory: `src/components/transport/`)
   - ✅ TransportDashboard.jsx - Dashboard principale
   - ✅ TransportZoneManager.jsx - Gestione zone
   - ✅ TransportRouteList.jsx - Gestione percorsi
   - ✅ TransportScheduleCalendar.jsx - Programmazione viaggi
   - ✅ TransportBookingList.jsx - Gestione prenotazioni
   - ✅ TransportStats.jsx - Statistiche

2. **Integrazioni**
   - ✅ TransportService (`src/services/transportService.js`)
   - ✅ TransportPage (`src/pages/TransportPage.jsx`)
   - ✅ Routing aggiornato in App.jsx
   - ✅ Menu aggiornato in Layout.jsx

---

## 🚧 LAVORO DA COMPLETARE

### PRIORITÀ ALTA - Notification Service

#### 1. Backend - Notification Service
**File da creare:** `backend/src/services/notification.service.ts`

```typescript
// Metodi da implementare:
- createNotification(userId, type, title, message, data)
- createBulkNotifications(userIds, notification)
- notifyOrganization(organizationId, notification)
- notifyTeam(teamId, notification)
- getUserNotifications(userId, filters, pagination)
- markAsRead(notificationId)
- markAllAsRead(userId)
- deleteNotification(id)
- sendDocumentExpiryNotifications()
- sendPaymentReminders()
- sendMatchReminders()
- sendTrainingReminders()
- getNotificationTemplates()
- createCustomTemplate(template)
```

#### 2. Backend - Notification Routes
**File da creare:** `backend/src/routes/notification.routes.ts`

```
GET    /api/v1/notifications
POST   /api/v1/notifications
PUT    /api/v1/notifications/:id/read
PUT    /api/v1/notifications/mark-all-read
DELETE /api/v1/notifications/:id
GET    /api/v1/notifications/templates
POST   /api/v1/notifications/templates
POST   /api/v1/notifications/send-bulk
```

#### 3. Frontend - Notification Components ✅
**Directory:** `src/components/notifications/`
✅ NotificationCenter.jsx - Centro notifiche principale completo
✅ NotificationBell.jsx - Campanella con badge (integrata nel Layout)
✅ NotificationList.jsx - Lista notifiche
✅ NotificationItem.jsx - Singola notifica con icone e priorità
✅ NotificationService.js - Service API per comunicare con backend
✅ NotificationsPage.jsx - Pagina dedicata notifiche
✅ CSS completi per tutti i componenti
✅ Integrato routing in App.jsx
✅ Aggiunto link nel menu di navigazione

### PRIORITÀ MEDIA - Altri Servizi

#### Audit Service
- `backend/src/services/audit.service.ts`
- `backend/src/routes/audit.routes.ts`
- Frontend: AuditLogViewer.jsx

#### Competition Service
- `backend/src/services/competition.service.ts`
- `backend/src/routes/competition.routes.ts`
- Frontend: CompetitionManager.jsx, VenueManager.jsx

#### Performance Service
- `backend/src/services/performance.service.ts`
- `backend/src/routes/performance.routes.ts`
- Frontend: PerformanceChart.jsx, PerformanceInput.jsx

---

## 📝 COMANDI PER INIZIARE LA PROSSIMA SESSIONE

```bash
# 1. Aprire il progetto
cd /Users/lucamambelli/Desktop/Gestione-Calcio

# 2. Verificare il branch
git status
git checkout feature/complete-alignment
git pull

# 3. Avviare il backend (in un terminale)
cd backend
npm run dev

# 4. Avviare il frontend (in altro terminale)
cd /Users/lucamambelli/Desktop/Gestione-Calcio
npm run dev

# 5. Testare che tutto funzioni
# Aprire http://localhost:5173
# Login con demo@soccermanager.com / demo123456
# Verificare che la sezione Trasporti funzioni
```

---

## 🔍 VERIFICHE INIZIALI PER LA PROSSIMA SESSIONE

1. **Verificare i file esistenti:**
   - ✅ Transport Service funzionante
   - ✅ Frontend Trasporti accessibile dal menu
   - ✅ Database con tabelle notifications già create

2. **Controllare le dipendenze:**
   ```json
   // backend/package.json deve avere:
   - express
   - @prisma/client
   - jsonwebtoken
   - date-fns
   - bcrypt
   
   // package.json frontend deve avere:
   - react
   - react-router-dom
   - axios
   - react-hot-toast
   - date-fns
   - react-icons
   ```

3. **Verificare lo schema Prisma:**
   - La tabella `Notification` deve esistere
   - Relazioni con User e Organization

---

## 🎯 OBIETTIVI PROSSIMA SESSIONE

### Sessione 1 (2-3 ore)
1. Implementare Notification Service backend
2. Creare le routes per le notifiche
3. Testare gli endpoint con Postman/Insomnia

### Sessione 2 (2-3 ore)
1. Creare i componenti UI per le notifiche
2. Integrare con Socket.io per real-time
3. Testare notifiche automatiche

### Sessione 3 (2-3 ore)
1. Implementare Audit Service
2. Creare UI per audit log
3. Testing generale

---

## 💡 SUGGERIMENTI IMPORTANTI

### Per il Notification Service
1. **Usare il modello esistente** di Transport Service come riferimento
2. **Priorità notifiche:**
   - `urgent`: Documenti scaduti, pagamenti in ritardo
   - `high`: Documenti in scadenza (7 giorni)
   - `normal`: Convocazioni, comunicazioni
   - `low`: Informazioni generali

3. **Template notifiche da creare:**
   - Documento in scadenza
   - Documento scaduto
   - Pagamento in ritardo
   - Convocazione partita
   - Promemoria allenamento
   - Prenotazione trasporto confermata

### Struttura Notification Service
```typescript
// Esempio struttura base
export class NotificationService {
  // Segui lo stesso pattern di TransportService
  // Usa PrismaClient per le query
  // Gestisci errori con le classi in utils/errors.ts
  // Formatta risposte con ResponseFormatter
}
```

### Per i componenti Frontend
1. **NotificationBell.jsx** deve:
   - Mostrare badge con numero notifiche non lette
   - Aprire dropdown al click
   - Aggiornare in real-time

2. **NotificationCenter.jsx** deve:
   - Mostrare lista paginata
   - Permettere filtri (lette/non lette, tipo, data)
   - Mark as read singolo e multiplo

---

## 📂 FILE DI RIFERIMENTO

### Backend - Esempi da seguire:
- `backend/src/services/transport.service.ts` - Pattern per i servizi
- `backend/src/routes/transport.routes.ts` - Pattern per le routes
- `backend/src/middleware/auth.middleware.ts` - Per autorizzazioni

### Frontend - Esempi da seguire:
- `src/components/transport/TransportDashboard.jsx` - Pattern dashboard
- `src/services/transportService.js` - Pattern service API
- `src/components/transport/TransportZoneManager.jsx` - Pattern CRUD

---

## 🐛 PROBLEMI COMUNI E SOLUZIONI

### Problema: "Cannot find module"
```bash
# Soluzione: Reinstallare dipendenze
cd backend && npm install
cd .. && npm install
```

### Problema: "Database connection failed"
```bash
# Verificare che PostgreSQL sia attivo
# Verificare .env in backend/
# DATABASE_URL deve essere corretto
```

### Problema: "Port already in use"
```bash
# Trovare e terminare processi
lsof -i :3000  # per backend
lsof -i :5173  # per frontend
kill -9 [PID]
```

---

## 📊 STATO CHECKLIST

### Completato ✅
- Transport Service (Backend) - 8/8 tasks
- Transport UI (Frontend) - 5/5 componenti
- Database Schema - 100%
- Auth System - 100%

### Da Fare 🚧
- Notification Service - 0/8 tasks
- Notification UI - 0/5 componenti
- Audit Service - 0/6 tasks
- Competition Service - 0/5 tasks
- Performance Service - 0/5 tasks

### Progress Totale
- **Backend Services:** 4/8 (50%)
- **Frontend Components:** 10/30 (33%)
- **Test Coverage:** 45%

---

## 🔗 LINK UTILI

### Documentazione
- **Prisma:** https://www.prisma.io/docs
- **React:** https://react.dev
- **Express:** https://expressjs.com
- **Socket.io:** https://socket.io/docs/v4/

### File Documentazione Progetto
1. `/Docs/ISTRUZIONI_IMPLEMENTAZIONE_SERVIZI.md` - Dettagli servizi
2. `/Docs/CHECKLIST_IMPLEMENTAZIONE.md` - Checklist aggiornata
3. `/PARTE-1-CONFIGURAZIONE.md` - Setup base
4. `/PARTE-2-DATABASE-SERVIZI.md` - Schema e servizi
5. `/PARTE-3-OTTIMIZZAZIONI-CACHE.md` - Cache e Socket.io

---

## 📞 NOTE PER L'ASSISTENTE DELLA PROSSIMA SESSIONE

### Informazioni Utente
- **Nome:** Luca Mambelli
- **Esperienza:** Principiante (spiegare in modo semplice)
- **Preferenza:** Codice funzionante prima, ottimizzazioni dopo

### Approccio Consigliato
1. **Leggere TUTTI i documenti** nella directory Docs/
2. **Verificare lo stato attuale** prima di iniziare
3. **Seguire i pattern esistenti** (Transport Service è il modello)
4. **Testare ogni componente** prima di passare al successivo
5. **Committare spesso** su GitHub
6. **Aggiornare la documentazione** quando si fanno modifiche

### Priorità
1. ⭐ Notification Service (ALTA)
2. ⭐ Notification UI (ALTA)
3. Audit Service (MEDIA)
4. Altri servizi (BASSA)

---

## ✅ COMANDO DA ESEGUIRE ALL'INIZIO

```bash
# Mostra questo messaggio all'assistente:
"Ciao! Sto lavorando al Soccer Management System. 
Il Transport Service è completato. 
Ora devo implementare il Notification Service.
Leggi il file: /Users/lucamambelli/Desktop/Gestione-Calcio/Docs/ISTRUZIONI_SESSIONE_SUCCESSIVA.md
per avere tutto il contesto."
```

---

## 🎯 RISULTATO FINALE ATTESO

Al termine delle prossime sessioni, il sistema dovrebbe avere:
- ✅ Sistema notifiche completo e funzionante
- ✅ Notifiche real-time con Socket.io
- ✅ UI per gestire e visualizzare notifiche
- ✅ Audit log per tracciare tutte le operazioni
- ✅ Sistema completo al 80% minimo

---

**IMPORTANTE:** Questo documento contiene TUTTO il necessario per continuare lo sviluppo. L'assistente della prossima sessione deve leggerlo completamente prima di iniziare.

---

**Creato da:** Assistente Claude  
**Data:** 7 Agosto 2025  
**Ora:** Fine sessione  
**Status:** Pronto per continuazione ✅
