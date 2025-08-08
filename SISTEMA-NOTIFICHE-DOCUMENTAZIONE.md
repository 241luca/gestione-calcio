# 📚 SISTEMA NOTIFICHE - DOCUMENTAZIONE COMPLETA
## Versione 3.0.0 - Sistema Notifiche Production Ready

**Data ultimo aggiornamento:** 8 Agosto 2025  
**Stato:** ✅ COMPLETO E FUNZIONANTE AL 100%

---

## 📋 INDICE

1. [Panoramica Sistema](#panoramica)
2. [Database Schema](#database-schema)
3. [Backend Services](#backend-services)
4. [API Endpoints](#api-endpoints)
5. [Frontend Components](#frontend-components)
6. [Configurazione](#configurazione)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 1. PANORAMICA SISTEMA

### Architettura Completa

```mermaid
graph TB
    subgraph "DATABASE"
        A[Notifications Table]
        B[NotificationTemplate Table]
        C[OrganizationSettings Table]
        D[EmailLog Table]
        E[AuditLog Table]
        F[User.preferences JSON]
    end
    
    subgraph "BACKEND SERVICES"
        G[NotificationService]
        H[EmailService + Brevo]
        I[SocketService]
        J[SchedulerService]
        K[OrganizationSettingsService]
        L[UserPreferencesService]
        M[NotificationTemplatesService]
        N[EventNotificationService]
    end
    
    subgraph "FRONTEND"
        O[NotificationSettingsPage]
        P[NotificationsPage]
        Q[SchedulerPage]
        R[NotificationBadge]
        S[Toast Notifications]
    end
    
    A --> G
    B --> M
    C --> K
    D --> H
    E --> K
    F --> L
    
    G --> I
    G --> H
    J --> G
    N --> G
    
    K --> O
    G --> P
    J --> Q
    I --> R
    I --> S
```

### Funzionalità Implementate

✅ **Notifiche Real-Time**
- Socket.io per aggiornamenti istantanei
- Toast popup per nuove notifiche
- Badge contatore sempre aggiornato
- Lista notifiche con mark as read

✅ **Email Notifications**
- Integrazione Brevo (ex SendinBlue)
- API key salvata criptata nel database
- Template HTML professionali
- Log di tutte le email inviate/fallite

✅ **Scheduler Automatico**
- Cron jobs configurabili
- Notifiche documenti in scadenza (30, 7, 1 giorni)
- Notifiche pagamenti scaduti
- Reminder partite e allenamenti
- Esecuzione manuale disponibile

✅ **Template Personalizzabili**
- Template di sistema predefiniti
- Template custom per organizzazione
- Variabili dinamiche {{variable}}
- Import/Export template

✅ **Preferenze Utente**
- Frequenza email (instant/daily/weekly/never)
- Quiet hours configurabili
- Enable/disable per categoria
- Preferenze salvate nel database

✅ **Audit e Logging**
- Tracciamento di tutte le modifiche
- Log email inviate con status
- Statistiche real-time
- Report utilizzo sistema

---

## 🗄️ 2. DATABASE SCHEMA

### Tabelle Principali

#### 📌 **notifications**
```sql
- id: UUID (Primary Key)
- userId: String (FK -> users)
- organizationId: String (FK -> organizations)
- type: String (document_expiry, payment_overdue, etc.)
- title: String
- message: String
- link: String?
- priority: String (low, normal, high, urgent)
- isRead: Boolean
- readAt: DateTime?
- data: JSON
- createdAt: DateTime
```

#### 📌 **notification_templates**
```sql
- id: UUID (Primary Key)
- organizationId: String (FK -> organizations)
- name: String
- type: String (unique with organizationId)
- title: String (con variabili {{var}})
- message: String (con variabili)
- emailSubject: String?
- emailBody: String? (HTML)
- variables: JSON (array variabili disponibili)
- isActive: Boolean
- createdAt: DateTime
- updatedAt: DateTime
```

#### 📌 **organization_settings**
```sql
- id: UUID (Primary Key)
- organizationId: String (FK, unique)
- emailProvider: String (brevo, sendgrid, smtp)
- emailApiKey: String? (CRIPTATA)
- emailFrom: String
- emailFromName: String
- emailEnabled: Boolean
- defaultPreferences: JSON
- timezone: String
- dateFormat: String
- currency: String
- language: String
- createdAt: DateTime
- updatedAt: DateTime
```

#### 📌 **audit_logs**
```sql
- id: UUID (Primary Key)
- organizationId: String (FK)
- userId: String? (FK)
- action: String (CREATE, UPDATE, DELETE)
- entityType: String
- entityId: String?
- oldValues: JSON?
- newValues: JSON?
- ipAddress: String?
- userAgent: String?
- createdAt: DateTime
```

#### 📌 **email_logs**
```sql
- id: UUID (Primary Key)
- organizationId: String (FK)
- to: String (email destinatario)
- subject: String
- body: Text
- status: String (SENT, FAILED, BOUNCED)
- provider: String?
- providerId: String?
- error: String?
- sentAt: DateTime?
- createdAt: DateTime
```

#### 📌 **users.preferences** (JSON field)
```json
{
  "emailEnabled": true,
  "emailFrequency": "instant|daily|weekly|never",
  "notificationTypes": {
    "documents": true,
    "payments": true,
    "matches": true,
    "training": true,
    "roster": true,
    "injuries": true,
    "general": true
  },
  "quietHours": {
    "enabled": false,
    "start": "22:00",
    "end": "08:00"
  }
}
```

---

## 🛠️ 3. BACKEND SERVICES

### 📦 NotificationService
**Path:** `/backend/src/services/notification.service.ts`

**Metodi principali:**
- `createNotification()` - Crea notifica e invia via Socket.io
- `getUserNotifications()` - Lista notifiche utente
- `markAsRead()` - Segna come letta
- `markAllAsRead()` - Segna tutte come lette
- `sendDocumentExpiryNotifications()` - Job documenti
- `sendPaymentReminders()` - Job pagamenti
- `getNotificationStats()` - Statistiche

### 📦 EmailService
**Path:** `/backend/src/services/email.service.ts`

**Configurazione Brevo:**
- API key salvata criptata in `organization_settings`
- Recuperata runtime dal database
- Log di ogni email in `email_logs`

**Metodi principali:**
- `sendEmail()` - Invia email via Brevo
- `sendDocumentExpiryEmail()` - Email documenti
- `sendPaymentOverdueEmail()` - Email pagamenti
- `sendDailyDigest()` - Digest giornaliero
- `sendWelcomeEmail()` - Email benvenuto

### 📦 OrganizationSettingsService
**Path:** `/backend/src/services/organization-settings.service.ts`

**Features:**
- Cripta/decripta API keys
- Salva settings nel database
- Cache settings per performance
- Default per nuove organizzazioni

**Metodi principali:**
- `getOrCreateSettings()` - Recupera o crea settings
- `saveEmailSettings()` - Salva config email
- `getEmailApiKey()` - Recupera API key decriptata
- `saveDefaultPreferences()` - Salva preferenze default

### 📦 SocketService
**Path:** `/backend/src/services/socket.service.ts`

**Real-time events:**
- `notification:new` - Nuova notifica
- `notification:read` - Notifica letta
- `notifications:pending` - Notifiche pendenti
- `refresh:dashboard` - Aggiorna dashboard
- `user:typing` - Indicatore digitazione

### 📦 SchedulerService
**Path:** `/backend/src/services/scheduler.service.ts`

**Jobs configurati:**
```javascript
// Documenti in scadenza - ogni giorno alle 9:00
'0 9 * * *' -> checkExpiringDocuments()

// Pagamenti scaduti - ogni giorno alle 10:00
'0 10 * * *' -> checkOverduePayments()

// Reminder partite - ogni giorno alle 18:00
'0 18 * * *' -> sendMatchReminders()

// Digest email - ogni giorno alle 8:00
'0 8 * * *' -> sendDailyDigest()
```

---

## 🔌 4. API ENDPOINTS

### 📍 Notifications API

#### `GET /api/v1/notifications`
Recupera notifiche utente
```javascript
Query params:
- status: read|unread
- priority: low|normal|high|urgent
- type: document_expiry|payment_overdue|etc
- page: number
- limit: number

Response:
{
  success: true,
  data: {
    notifications: [...],
    pagination: {...}
  }
}
```

#### `POST /api/v1/notifications`
Crea nuova notifica
```javascript
Body:
{
  userId: string,
  type: string,
  title: string,
  message: string,
  priority: string,
  link?: string
}
```

#### `PUT /api/v1/notifications/:id/read`
Segna come letta

#### `PUT /api/v1/notifications/mark-all-read`
Segna tutte come lette

### 📍 Settings API

#### `GET /api/v1/settings/notifications`
Recupera tutte le impostazioni
```javascript
Response:
{
  email: {
    provider: "brevo",
    apiKey: "***hidden***",
    senderEmail: "noreply@...",
    enabled: true
  },
  preferences: {...},
  stats: {
    emailsSent: 150,
    emailsFailed: 3,
    notificationsSent: 450
  }
}
```

#### `POST /api/v1/settings/notifications/email`
Salva configurazione email
```javascript
Body:
{
  apiKey: "xkeysib-xxx",
  senderEmail: "noreply@domain.com",
  senderName: "Soccer Manager",
  enabled: true
}
```

#### `POST /api/v1/settings/notifications/test-email`
Test configurazione email

#### `POST /api/v1/settings/notifications/preferences`
Salva preferenze default

### 📍 Templates API

#### `GET /api/v1/notification-templates`
Lista tutti i template

#### `POST /api/v1/notification-templates`
Crea template custom

#### `PUT /api/v1/notification-templates/:id`
Aggiorna template

#### `DELETE /api/v1/notification-templates/:id`
Elimina template

#### `POST /api/v1/notification-templates/preview`
Preview con variabili

### 📍 Scheduler API

#### `GET /api/v1/scheduler/jobs`
Lista jobs configurati

#### `POST /api/v1/scheduler/run/:jobName`
Esegue job manualmente

#### `PUT /api/v1/scheduler/jobs/:jobName`
Aggiorna configurazione job

---

## 🎨 5. FRONTEND COMPONENTS

### 📱 NotificationSettingsPage
**Path:** `/src/pages/NotificationSettingsPage.jsx`

**Tabs:**
1. **Email (Brevo)**
   - Configurazione API key
   - Test connessione
   - Statistiche email

2. **Preferenze Default**
   - Frequenza email
   - Tipi notifiche
   - Quiet hours

3. **Template**
   - Lista template
   - Editor template
   - Variabili dinamiche

4. **Integrazioni Future**
   - Push notifications (pianificate)
   - WhatsApp (pianificate)
   - SMS (pianificate)

### 📱 NotificationsPage
**Path:** `/src/pages/NotificationsPage.jsx`

**Features:**
- Lista notifiche con filtri
- Mark as read singolo/multiplo
- Eliminazione notifiche
- Real-time updates via Socket.io

### 📱 SchedulerPage
**Path:** `/src/pages/SchedulerPage.jsx`

**Features:**
- Visualizzazione jobs
- Esecuzione manuale
- Configurazione schedule
- Log esecuzioni

### 📱 NotificationBadge
**Path:** `/src/components/NotificationBadge.jsx`

**Features:**
- Contatore real-time
- Dropdown notifiche recenti
- Quick actions

---

## ⚙️ 6. CONFIGURAZIONE

### 🔧 Configurazione Brevo

1. **Crea account Brevo**
   - Vai su https://app.brevo.com
   - Registrati gratuitamente

2. **Ottieni API Key**
   - Settings → API Keys
   - Crea nuova API key
   - Copia la key

3. **Configura nel sistema**
   - Vai su Settings → Notifiche → Impostazioni Complete
   - Tab "Email (Brevo)"
   - Incolla API key
   - Test connessione
   - Salva

### 🔧 Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/soccer_management"

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Encryption (per API keys)
ENCRYPTION_KEY=your-encryption-key-32-chars

# Server
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173

# App
APP_URL=http://localhost:5173
```

### 🔧 Migrazione Database

```bash
# Genera migrazione
npx prisma migrate dev --name notifications-system

# Applica in produzione
npx prisma migrate deploy

# Genera client
npx prisma generate
```

---

## 🧪 7. TESTING

### Test Notifiche Real-time

1. **Apri 2 browser**
2. **Login con 2 utenti diversi**
3. **Invia notifica da utente 1**
4. **Verifica ricezione su utente 2**

### Test Email

1. **Configura Brevo API key**
2. **Vai su Test Notifiche**
3. **Invia email test**
4. **Verifica in EmailLog**

```sql
-- Verifica email inviate
SELECT * FROM email_logs 
WHERE organization_id = 'xxx'
ORDER BY created_at DESC;
```

### Test Scheduler

1. **Vai su Scheduler page**
2. **Esegui job manualmente**
3. **Verifica notifiche create**

```sql
-- Verifica notifiche create da scheduler
SELECT type, COUNT(*) 
FROM notifications 
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY type;
```

---

## 🔧 8. TROUBLESHOOTING

### ❌ Email non inviate

**Problema:** Le email non vengono inviate
**Soluzioni:**
1. Verifica API key Brevo configurata
2. Controlla `organization_settings`:
```sql
SELECT email_enabled, email_api_key IS NOT NULL as has_key
FROM organization_settings
WHERE organization_id = 'xxx';
```
3. Verifica log errori:
```sql
SELECT * FROM email_logs 
WHERE status = 'FAILED'
ORDER BY created_at DESC;
```

### ❌ Notifiche non real-time

**Problema:** Le notifiche non appaiono in real-time
**Soluzioni:**
1. Verifica Socket.io connesso
2. Check console browser per errori WebSocket
3. Verifica token JWT valido

### ❌ Scheduler non funziona

**Problema:** Jobs non si eseguono
**Soluzioni:**
1. Verifica scheduler inizializzato:
```javascript
// In server.ts deve esserci:
SchedulerService.initialize();
```
2. Check timezone configurato
3. Esegui manualmente per test

### ❌ Preferenze non salvate

**Problema:** Le preferenze utente non persistono
**Soluzioni:**
1. Verifica campo `preferences` in users:
```sql
SELECT preferences FROM users WHERE id = 'xxx';
```
2. Check permessi utente (`settings:write`)

---

## 📊 STATISTICHE E MONITORING

### Query utili per monitoring

```sql
-- Notifiche inviate oggi
SELECT 
  type,
  priority,
  COUNT(*) as count
FROM notifications
WHERE created_at >= CURRENT_DATE
GROUP BY type, priority;

-- Email success rate
SELECT 
  DATE(created_at) as day,
  COUNT(CASE WHEN status = 'SENT' THEN 1 END) as sent,
  COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed,
  ROUND(
    COUNT(CASE WHEN status = 'SENT' THEN 1 END)::numeric / 
    COUNT(*)::numeric * 100, 2
  ) as success_rate
FROM email_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY day DESC;

-- Utenti più attivi
SELECT 
  u.email,
  COUNT(n.id) as notifications_received,
  COUNT(CASE WHEN n.is_read THEN 1 END) as read,
  COUNT(CASE WHEN NOT n.is_read THEN 1 END) as unread
FROM users u
LEFT JOIN notifications n ON u.id = n.user_id
WHERE n.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY u.email
ORDER BY notifications_received DESC
LIMIT 10;

-- Audit log recenti
SELECT 
  action,
  entity_type,
  u.email as user,
  created_at
FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.id
ORDER BY created_at DESC
LIMIT 20;
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-deployment

- [ ] API key Brevo configurata in production
- [ ] ENCRYPTION_KEY diversa da default
- [ ] Database migrations eseguite
- [ ] Prisma client generato
- [ ] Environment variables configurate
- [ ] SSL/HTTPS abilitato
- [ ] WebSocket configurato per Socket.io
- [ ] Backup database configurato

### Post-deployment

- [ ] Test email invio
- [ ] Test notifiche real-time
- [ ] Verifica scheduler attivo
- [ ] Check logs per errori
- [ ] Monitoring attivo

---

## 📝 CHANGELOG

### v3.0.0 (08-08-2025)
- ✅ Database schema completo con tutte le tabelle
- ✅ Settings salvate nel database (non più .env)
- ✅ API key criptata per sicurezza
- ✅ Email log con tracciamento completo
- ✅ Audit log per tutte le azioni
- ✅ Preferenze utente persistenti
- ✅ Template personalizzabili
- ✅ Scheduler configurabile
- ✅ Statistiche real-time

### v2.0.0 (07-08-2025)
- Sistema notifiche base
- Socket.io integrazione
- Email con Brevo

### v1.0.0 (06-08-2025)
- Prima versione

---

## 👥 TEAM

**Lead Developer:** Sistema Notifiche Team
**Database:** Prisma + PostgreSQL
**Backend:** Node.js + TypeScript
**Frontend:** React + Socket.io
**Email:** Brevo (SendinBlue)

---

## 📞 SUPPORTO

Per problemi o domande:
- 📧 Email: support@soccermanager.com
- 📚 Docs: /docs/notifications
- 🐛 Issues: GitHub Issues

---

**IMPORTANTE:** Questo sistema è PRODUCTION READY e completamente funzionante. Tutte le funzionalità sono implementate, testate e persistenti nel database.
