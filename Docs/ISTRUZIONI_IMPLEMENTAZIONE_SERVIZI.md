# 📋 ISTRUZIONI DETTAGLIATE PER COMPLETARE LA MIGRAZIONE
## Servizi Backend e Frontend da Implementare

**Data:** 7 Agosto 2025  
**Versione:** 2.0.0  
**Priorità:** ALTA 🔴

---

## 🎯 OBIETTIVO PRINCIPALE
Completare l'implementazione dei servizi backend per le nuove tabelle create e aggiornare il frontend per utilizzare queste nuove funzionalità.

---

## 📂 CONTESTO DEL PROGETTO

### Directory Progetto
```
/Users/lucamambelli/Desktop/Gestione-Calcio
```

### Credenziali GitHub
- **User:** 241luca
- **Email:** lucamambelli@lmtecnologie.it
- **Repository:** https://github.com/241luca/gestione-calcio
- **Branch attuale:** feature/complete-alignment

### Database
- **Nome:** soccer_management
- **User:** lucamambelli
- **Host:** localhost:5432

### Accesso Demo
- **Email:** demo@soccermanager.com
- **Password:** demo123456

---

## ✅ STATO ATTUALE (GIÀ COMPLETATO)

### Database ✅
- ✅ Schema completo con tutte le tabelle
- ✅ Migrazioni applicate con successo
- ✅ Seed con dati demo funzionante
- ✅ Indici ottimizzati creati

### Tabelle Aggiunte ✅
- transport_zones, transport_routes, transport_schedules, transport_bookings
- notifications
- audit_logs
- competitions, venues
- staff_members
- performance_scores
- events
- communications

### Backend Base ✅
- ✅ Struttura base Express + TypeScript
- ✅ Autenticazione JWT funzionante
- ✅ Servizi base per athletes, documents, payments
- ✅ Middleware auth e multi-tenant

### Frontend Base ✅
- ✅ React + Vite configurato
- ✅ Routing base implementato
- ✅ Componenti UI base creati
- ✅ Sistema di autenticazione

---

## 🚧 DA IMPLEMENTARE - FASE 1: SERVIZI BACKEND

### 1. TRANSPORT SERVICE (Priorità: ALTA)
**File da creare:** `backend/src/services/transport.service.ts`

#### Metodi da implementare:
```typescript
class TransportService {
  // Zone trasporto
  - createTransportZone(data, organizationId)
  - getTransportZones(organizationId)
  - updateTransportZone(id, data)
  - deleteTransportZone(id)
  
  // Route trasporto
  - createRoute(data, organizationId)
  - getRoutes(organizationId, filters)
  - updateRoute(id, data)
  - assignDriverToRoute(routeId, driverName)
  
  // Schedule trasporti
  - createSchedule(routeId, matchOrTrainingId, type)
  - getSchedules(filters, pagination)
  - getUpcomingSchedules(organizationId, days = 7)
  - updateScheduleStatus(id, status)
  
  // Prenotazioni
  - bookTransport(athleteId, scheduleId, pickupPoint)
  - cancelBooking(bookingId)
  - getBookingsBySchedule(scheduleId)
  - getAthleteBookings(athleteId)
  - sendTransportReminders()
}
```

#### API Routes da creare:
**File:** `backend/src/routes/transport.routes.ts`
```
GET    /api/v1/transport/zones
POST   /api/v1/transport/zones
PUT    /api/v1/transport/zones/:id
DELETE /api/v1/transport/zones/:id

GET    /api/v1/transport/routes
POST   /api/v1/transport/routes
PUT    /api/v1/transport/routes/:id
DELETE /api/v1/transport/routes/:id

GET    /api/v1/transport/schedules
POST   /api/v1/transport/schedules
PUT    /api/v1/transport/schedules/:id
GET    /api/v1/transport/schedules/upcoming

POST   /api/v1/transport/bookings
DELETE /api/v1/transport/bookings/:id
GET    /api/v1/transport/bookings/athlete/:athleteId
GET    /api/v1/transport/bookings/schedule/:scheduleId
```

---

### 2. NOTIFICATION SERVICE (Priorità: ALTA)
**File da creare:** `backend/src/services/notification.service.ts`

#### Metodi da implementare:
```typescript
class NotificationService {
  // Creazione notifiche
  - createNotification(userId, type, title, message, data)
  - createBulkNotifications(userIds, notification)
  - notifyOrganization(organizationId, notification)
  - notifyTeam(teamId, notification)
  
  // Gestione notifiche
  - getUserNotifications(userId, filters, pagination)
  - markAsRead(notificationId)
  - markAllAsRead(userId)
  - deleteNotification(id)
  
  // Notifiche automatiche
  - sendDocumentExpiryNotifications()
  - sendPaymentReminders()
  - sendMatchReminders()
  - sendTrainingReminders()
  
  // Template notifiche
  - getNotificationTemplates()
  - createCustomTemplate(template)
}
```

#### API Routes da creare:
**File:** `backend/src/routes/notification.routes.ts`
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

---

### 3. AUDIT LOG SERVICE (Priorità: MEDIA)
**File da creare:** `backend/src/services/audit.service.ts`

#### Metodi da implementare:
```typescript
class AuditService {
  - log(action, entityType, entityId, oldValues, newValues, userId)
  - getAuditLogs(filters, pagination)
  - getEntityHistory(entityType, entityId)
  - getUserActivity(userId, dateRange)
  - getOrganizationActivity(organizationId, dateRange)
  - exportAuditReport(filters, format)
}
```

---

### 4. COMPETITION & VENUE SERVICE (Priorità: MEDIA)
**File da creare:** `backend/src/services/competition.service.ts`

#### Metodi da implementare:
```typescript
class CompetitionService {
  // Competitions
  - createCompetition(data, organizationId)
  - getCompetitions(organizationId, season)
  - updateCompetition(id, data)
  - getCompetitionStandings(competitionId)
  
  // Venues
  - createVenue(data, organizationId)
  - getVenues(organizationId)
  - updateVenue(id, data)
  - checkVenueAvailability(venueId, date)
}
```

---

### 5. PERFORMANCE SERVICE (Priorità: BASSA)
**File da creare:** `backend/src/services/performance.service.ts`

#### Metodi da implementare:
```typescript
class PerformanceService {
  - recordPerformance(athleteId, score, type, metrics)
  - getAthletePerformance(athleteId, dateRange)
  - compareAthletes(athleteIds, metrics)
  - getTeamPerformance(teamId)
  - generatePerformanceReport(athleteId)
}
```

---

## 🎨 DA IMPLEMENTARE - FASE 2: FRONTEND COMPONENTS

### 1. TRANSPORT MANAGEMENT UI
**Directory:** `src/components/transport/`

#### Componenti da creare:
```jsx
TransportDashboard.jsx       // Dashboard principale trasporti
TransportZoneManager.jsx     // Gestione zone
TransportRouteList.jsx       // Lista route
TransportScheduleCalendar.jsx // Calendario trasporti
TransportBookingForm.jsx     // Form prenotazione
TransportBookingList.jsx     // Lista prenotazioni
DriverAssignment.jsx         // Assegnazione autisti
```

#### Features UI:
- Mappa interattiva delle zone (opzionale)
- Calendario con schedule trasporti
- Form prenotazione per atleti/genitori
- Vista autista con lista passeggeri
- Notifiche automatiche pre-partenza

---

### 2. NOTIFICATION CENTER UI
**Directory:** `src/components/notifications/`

#### Componenti da creare:
```jsx
NotificationCenter.jsx       // Centro notifiche principale
NotificationBell.jsx        // Icona campanella con badge
NotificationList.jsx        // Lista notifiche
NotificationItem.jsx        // Singola notifica
NotificationSettings.jsx    // Impostazioni notifiche
```

#### Features UI:
- Badge con numero notifiche non lette
- Dropdown con lista notifiche
- Filtri per tipo/priorità
- Mark as read/unread
- Impostazioni preferenze notifiche

---

### 3. AUDIT LOG VIEWER
**Directory:** `src/components/audit/`

#### Componenti da creare:
```jsx
AuditLogViewer.jsx         // Visualizzatore log
AuditLogFilters.jsx        // Filtri avanzati
ActivityTimeline.jsx       // Timeline attività
UserActivityReport.jsx     // Report attività utente
```

---

### 4. COMPETITION & VENUE MANAGEMENT
**Directory:** `src/components/competitions/`

#### Componenti da creare:
```jsx
CompetitionManager.jsx      // Gestione competizioni
CompetitionCalendar.jsx     // Calendario competizioni
StandingsTable.jsx          // Classifica
VenueManager.jsx            // Gestione campi
VenueAvailability.jsx       // Disponibilità campi
```

---

### 5. PERFORMANCE TRACKING
**Directory:** `src/components/performance/`

#### Componenti da creare:
```jsx
PerformanceChart.jsx        // Grafici performance
PerformanceInput.jsx        // Input valutazioni
PerformanceComparison.jsx   // Confronto atleti
PerformanceReport.jsx       // Report performance
```

---

## 📝 ORDINE DI IMPLEMENTAZIONE CONSIGLIATO

### SETTIMANA 1: Backend Core Services
```
Giorno 1-2: Transport Service completo + routes + test
Giorno 3-4: Notification Service + integrazione Socket.io
Giorno 5: Audit Log Service + middleware integrazione
```

### SETTIMANA 2: Frontend Components
```
Giorno 1-2: Transport Management UI
Giorno 3: Notification Center UI
Giorno 4: Competition & Venue UI
Giorno 5: Testing e bug fixing
```

### SETTIMANA 3: Ottimizzazioni e Polish
```
Giorno 1-2: Performance Service + UI
Giorno 3: Audit Log Viewer
Giorno 4: Testing integrazione completa
Giorno 5: Documentazione e deploy
```

---

## 🧪 TESTING CHECKLIST

### Backend Testing
- [ ] Unit test per ogni service (Jest)
- [ ] Integration test per le API routes
- [ ] Test di carico per notifiche massive
- [ ] Test sicurezza autorizzazioni

### Frontend Testing
- [ ] Component testing (React Testing Library)
- [ ] E2E test flussi principali (Cypress)
- [ ] Test responsive mobile/tablet
- [ ] Test accessibilità (a11y)

---

## 📦 DIPENDENZE DA AGGIUNGERE

### Backend
```json
{
  "socket.io": "^4.6.0",        // Già presente
  "node-cron": "^3.0.3",         // Per job schedulati
  "bull": "^4.11.0",             // Queue per job background
  "redis": "^4.6.0"              // Cache e sessions
}
```

### Frontend
```json
{
  "socket.io-client": "^4.6.0",  // Già presente
  "react-big-calendar": "^1.8.0", // Calendario eventi
  "react-leaflet": "^4.2.0",      // Mappe (opzionale)
  "@tanstack/react-table": "^8.0", // Tabelle avanzate
  "recharts": "^2.10.0"           // Grafici
}
```

---

## 🚀 COMANDI RAPIDI PER INIZIARE

```bash
# 1. Assicurati di essere sul branch giusto
cd /Users/lucamambelli/Desktop/Gestione-Calcio
git checkout feature/complete-alignment
git pull

# 2. Installa eventuali nuove dipendenze
cd backend && npm install
cd .. && npm install

# 3. Avvia i servizi
./soccer-manager.sh start-all

# 4. Apri VS Code
code .

# 5. Inizia dal Transport Service
# Crea: backend/src/services/transport.service.ts
```

---

## 💡 SUGGERIMENTI IMPORTANTI

1. **Usa i tipi TypeScript** già definiti in Prisma (`@prisma/client`)
2. **Implementa sempre la paginazione** per liste lunghe
3. **Aggiungi sempre validazione** con Zod sui dati in input
4. **Usa transazioni** per operazioni multiple sul DB
5. **Implementa cache** per dati che cambiano poco
6. **Testa ogni endpoint** con Postman/Insomnia prima di fare il frontend
7. **Commenta il codice** per le parti complesse
8. **Fai commit frequenti** con messaggi descrittivi

---

## 🔧 SNIPPET DI CODICE UTILI

### Service Base Template
```typescript
import { PrismaClient } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../utils/errors';

const prisma = new PrismaClient();

export class TransportService {
  async createTransportZone(data: any, organizationId: string) {
    // Validazione
    if (!data.name) {
      throw new BadRequestError('Nome zona richiesto');
    }

    // Creazione
    const zone = await prisma.transportZone.create({
      data: {
        ...data,
        organizationId
      }
    });

    return zone;
  }

  // Altri metodi...
}
```

### Route Template
```typescript
import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { TransportService } from '../services/transport.service';

const router = Router();
const transportService = new TransportService();

router.use(authenticate); // Richiede autenticazione

router.get('/zones', authorize('transport:read'), async (req, res, next) => {
  try {
    const zones = await transportService.getTransportZones(
      req.user!.organizationId
    );
    res.json({ success: true, data: zones });
  } catch (error) {
    next(error);
  }
});

export default router;
```

### React Component Template
```jsx
import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { transportAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

function TransportZoneManager() {
  const { data, isLoading, error } = useQuery(
    'transportZones',
    transportAPI.getZones
  );

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Gestione Zone Trasporto</h2>
      {/* UI implementation */}
    </div>
  );
}

export default TransportZoneManager;
```

---

## 📞 SUPPORTO E RIFERIMENTI

### Documentazione
- **Prisma Schema:** `backend/prisma/schema.prisma`
- **API Docs:** Da creare con Swagger/OpenAPI
- **Component Storybook:** Da configurare

### File di Riferimento
- **Auth Service:** `backend/src/services/auth.service.ts` (esempio completo)
- **Athlete Service:** `backend/src/services/athlete.service.ts` (esempio CRUD)
- **Athletes Page:** `src/pages/AthletesPage.jsx` (esempio UI completa)

---

## ✅ DEFINITION OF DONE

Un servizio/componente si considera completo quando:
1. ✅ Codice implementato e funzionante
2. ✅ Test scritti e passanti (min 80% coverage)
3. ✅ Documentazione API aggiornata
4. ✅ Code review completata
5. ✅ Nessun bug critico
6. ✅ Performance accettabili (<200ms response time)
7. ✅ Accessibile da mobile
8. ✅ Commit e push su GitHub

---

## 🎯 RISULTATO FINALE ATTESO

Al completamento di questa fase, il sistema dovrebbe avere:
- **15+ nuovi endpoint API** funzionanti
- **20+ nuovi componenti React** 
- **Sistema notifiche real-time** operativo
- **Gestione trasporti** completa
- **Audit log** di tutte le operazioni
- **Performance tracking** per atleti
- **100% delle tabelle DB** utilizzate
- **Dashboard** aggiornata con nuove metriche

---

**NOTA IMPORTANTE:** Salva questo documento e usalo come riferimento nella prossima sessione di chat. Mostra questo documento all'assistente all'inizio della conversazione per avere il contesto completo.

---

**Ultimo aggiornamento:** 7 Agosto 2025, 15:00
**Autore:** Sistema di Documentazione
**Status:** PRONTO PER IMPLEMENTAZIONE 🚀
