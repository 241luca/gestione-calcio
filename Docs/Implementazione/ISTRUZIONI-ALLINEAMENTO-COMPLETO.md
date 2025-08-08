# 📋 ISTRUZIONI COMPLETE PER ALLINEAMENTO CON SPECIFICHE
## Sistema Gestione Calcio - Implementazione Funzionalità Mancanti

**Data:** 8 Agosto 2025  
**Versione:** 3.0.0  
**Priorità:** CRITICA  
**Tempo stimato:** 16-20 ore di sviluppo

---

## ⚠️ PREREQUISITI IMPORTANTI

### Prima di iniziare VERIFICARE:
1. **Backup completo del database** esistente
2. **Commit di tutti i file** su GitHub
3. **Test del sistema attuale** per verificare stabilità
4. **Ambiente di test** separato se possibile

### Comandi backup database:
```bash
# Dalla directory /Users/lucamambelli/Desktop/Gestione-Calcio
pg_dump -U lucamambelli -d soccer_management > backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## 🎯 ORDINE DI IMPLEMENTAZIONE (CRITICO)

### ⚡ FASE 1: PREPARAZIONE (30 minuti)
1. Creare branch dedicato: `git checkout -b feature/complete-alignment`
2. Backup database
3. Verificare che tutti i test attuali passino
4. Documentare stato attuale sistema

### 🔧 FASE 2: MIGRATION DATABASE (2-3 ore)

#### Step 2.1 - Creare file migration principale
Creare file: `backend/prisma/migrations/add_missing_features/migration.sql`

```sql
-- ==========================================
-- FASE 2: AGGIUNTA MODELLI MANCANTI
-- ==========================================

-- 1. SISTEMA TRASPORTI
CREATE TABLE "transport_zones" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "description" TEXT,
  "organization_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
);

CREATE TABLE "transport_routes" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "driver" TEXT,
  "vehicle_plate" TEXT,
  "capacity" INTEGER NOT NULL DEFAULT 8,
  "organization_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
);

CREATE TABLE "transport_schedules" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "route_id" TEXT NOT NULL,
  "match_id" TEXT,
  "session_id" TEXT,
  "pickup_time" TIMESTAMP(3) NOT NULL,
  "return_time" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("route_id") REFERENCES "transport_routes"("id") ON DELETE CASCADE,
  FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE SET NULL,
  FOREIGN KEY ("session_id") REFERENCES "training_sessions"("id") ON DELETE SET NULL
);

CREATE TABLE "transport_bookings" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "athlete_id" TEXT NOT NULL,
  "schedule_id" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
  "pickup_point" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("athlete_id") REFERENCES "athletes"("id") ON DELETE CASCADE,
  FOREIGN KEY ("schedule_id") REFERENCES "transport_schedules"("id") ON DELETE CASCADE,
  UNIQUE("athlete_id", "schedule_id")
);

-- 2. SISTEMA NOTIFICHE
CREATE TABLE "notifications" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "user_id" TEXT,
  "organization_id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "link" TEXT,
  "priority" TEXT NOT NULL DEFAULT 'normal',
  "is_read" BOOLEAN NOT NULL DEFAULT false,
  "read_at" TIMESTAMP(3),
  "data" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
);

-- 3. AUDIT LOG
CREATE TABLE "audit_logs" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT NOT NULL,
  "old_values" JSONB,
  "new_values" JSONB,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- 4. COMPETIZIONI E VENUE
CREATE TABLE "competitions" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "season" TEXT NOT NULL,
  "start_date" TIMESTAMP(3) NOT NULL,
  "end_date" TIMESTAMP(3),
  "organization_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
);

CREATE TABLE "venues" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "province" TEXT,
  "capacity" INTEGER,
  "type" TEXT DEFAULT 'STANDARD',
  "organization_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
);

-- 5. STAFF TECNICO
CREATE TABLE "staff_members" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" TEXT NOT NULL,
  "first_name" TEXT NOT NULL,
  "last_name" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "team_id" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "qualifications" TEXT,
  "contract_end" TIMESTAMP(3),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
  FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL
);

-- 6. PERFORMANCE SCORES
CREATE TABLE "performance_scores" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "athlete_id" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "type" TEXT NOT NULL,
  "score" DOUBLE PRECISION NOT NULL,
  "metrics" JSONB,
  "evaluator_id" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("athlete_id") REFERENCES "athletes"("id") ON DELETE CASCADE,
  FOREIGN KEY ("evaluator_id") REFERENCES "users"("id") ON DELETE SET NULL
);

-- 7. EVENTI
CREATE TABLE "events" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "date" TIMESTAMP(3) NOT NULL,
  "end_date" TIMESTAMP(3),
  "location" TEXT,
  "max_participants" INTEGER,
  "is_public" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
);

-- 8. COMUNICAZIONI
CREATE TABLE "communications" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" TEXT NOT NULL,
  "from_user_id" TEXT NOT NULL,
  "to_users" TEXT[],
  "to_groups" TEXT[],
  "subject" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'EMAIL',
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "sent_at" TIMESTAMP(3),
  "error_message" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
  FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- ==========================================
-- AGGIORNAMENTO TABELLE ESISTENTI
-- ==========================================

-- Aggiorna Athletes
ALTER TABLE "athletes" 
ADD COLUMN IF NOT EXISTS "transport_zone_id" TEXT,
ADD COLUMN IF NOT EXISTS "needs_transport" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "photo_url" TEXT,
ADD COLUMN IF NOT EXISTS "registration_number" TEXT,
ADD COLUMN IF NOT EXISTS "contract_end_date" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "social_media_consent" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "image_rights_consent" BOOLEAN DEFAULT false,
ADD FOREIGN KEY ("transport_zone_id") REFERENCES "transport_zones"("id") ON DELETE SET NULL;

-- Aggiorna Payments
ALTER TABLE "payments"
ADD COLUMN IF NOT EXISTS "invoice_number" TEXT,
ADD COLUMN IF NOT EXISTS "invoice_url" TEXT,
ADD COLUMN IF NOT EXISTS "reminder_sent" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "reminder_date" TIMESTAMP(3);

-- Aggiorna Matches
ALTER TABLE "matches"
ADD COLUMN IF NOT EXISTS "competition_id" TEXT,
ADD COLUMN IF NOT EXISTS "venue_id" TEXT,
ADD COLUMN IF NOT EXISTS "referees" TEXT[],
ADD COLUMN IF NOT EXISTS "weather_conditions" TEXT,
ADD COLUMN IF NOT EXISTS "spectators" INTEGER,
ADD COLUMN IF NOT EXISTS "income_generated" DOUBLE PRECISION,
ADD FOREIGN KEY ("competition_id") REFERENCES "competitions"("id") ON DELETE SET NULL,
ADD FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE SET NULL;

-- Aggiorna Documents
ALTER TABLE "documents"
ADD COLUMN IF NOT EXISTS "reminder_30_days" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "reminder_7_days" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "reminder_1_day" BOOLEAN DEFAULT false;

-- Aggiorna Organizations
ALTER TABLE "organizations"
ADD COLUMN IF NOT EXISTS "founded_year" INTEGER,
ADD COLUMN IF NOT EXISTS "president" TEXT,
ADD COLUMN IF NOT EXISTS "colors" TEXT[],
ADD COLUMN IF NOT EXISTS "registration_number" TEXT,
ADD COLUMN IF NOT EXISTS "bank_account" TEXT,
ADD COLUMN IF NOT EXISTS "social_links" JSONB;

-- Aggiorna MatchRoster per convocazioni avanzate
ALTER TABLE "match_rosters"
ADD COLUMN IF NOT EXISTS "convocation_status" TEXT DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS "response_date" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "absence_reason" TEXT;

-- ==========================================
-- INDICI PER PERFORMANCE
-- ==========================================

CREATE INDEX "idx_transport_bookings_athlete" ON "transport_bookings"("athlete_id");
CREATE INDEX "idx_transport_bookings_schedule" ON "transport_bookings"("schedule_id");
CREATE INDEX "idx_notifications_user" ON "notifications"("user_id");
CREATE INDEX "idx_notifications_org" ON "notifications"("organization_id");
CREATE INDEX "idx_notifications_read" ON "notifications"("is_read");
CREATE INDEX "idx_audit_logs_org" ON "audit_logs"("organization_id");
CREATE INDEX "idx_audit_logs_user" ON "audit_logs"("user_id");
CREATE INDEX "idx_audit_logs_entity" ON "audit_logs"("entity_type", "entity_id");
CREATE INDEX "idx_performance_athlete" ON "performance_scores"("athlete_id");
CREATE INDEX "idx_events_date" ON "events"("date");
CREATE INDEX "idx_communications_status" ON "communications"("status");
```

#### Step 2.2 - Aggiornare schema.prisma
**File:** `backend/prisma/schema.prisma`

Aggiungere TUTTI i nuovi modelli mantenendo la struttura esistente. **NON ELIMINARE NULLA**, solo aggiungere.

### 📦 FASE 3: BACKEND SERVICES (4-5 ore)

#### Step 3.1 - Creare Transport Service
**File:** `backend/src/services/transport.service.ts`

```typescript
// Implementare servizio completo per:
// - Gestione zone trasporto
// - Creazione percorsi
// - Programmazione trasporti per partite/allenamenti
// - Prenotazioni atleti
// - Notifiche automatiche per conferme/cancellazioni
// - Report utilizzo mezzi
// - Ottimizzazione percorsi
```

#### Step 3.2 - Creare Notification Service Enhanced
**File:** `backend/src/services/notification.service.ts`

```typescript
// Implementare:
// - Coda notifiche con priorità
// - Notifiche multiple (email, push, in-app)
// - Template notifiche
// - Scheduling notifiche
// - Batch notifications
// - Retry logic per invii falliti
```

#### Step 3.3 - Creare Audit Service
**File:** `backend/src/services/audit.service.ts`

```typescript
// Implementare:
// - Log automatico di tutte le operazioni CRUD
// - Tracking modifiche con diff
// - Report audit per compliance
// - Filtri e ricerca log
// - Export log per analisi
```

### 🎨 FASE 4: FRONTEND COMPONENTS (4-5 ore)

#### Step 4.1 - Componente Gestione Trasporti
**Directory:** `src/components/transport/`

Creare:
- `TransportZoneManager.jsx` - Gestione zone
- `TransportRouteManager.jsx` - Gestione percorsi
- `TransportScheduler.jsx` - Programmazione trasporti
- `TransportBooking.jsx` - Prenotazioni atleti
- `TransportDashboard.jsx` - Dashboard trasporti

#### Step 4.2 - Componente Notifiche
**Directory:** `src/components/notifications/`

Creare:
- `NotificationCenter.jsx` - Centro notifiche
- `NotificationBell.jsx` - Icona con badge
- `NotificationList.jsx` - Lista notifiche
- `NotificationSettings.jsx` - Preferenze utente

#### Step 4.3 - Componente Audit
**Directory:** `src/components/audit/`

Creare:
- `AuditLog.jsx` - Visualizzazione log
- `AuditFilters.jsx` - Filtri ricerca
- `AuditReport.jsx` - Report audit

### 🔌 FASE 5: API ROUTES (3-4 ore)

#### Step 5.1 - Transport Routes
**File:** `backend/src/routes/transport.routes.ts`

```typescript
// Endpoints necessari:
// GET /api/v1/transport/zones
// POST /api/v1/transport/zones
// PUT /api/v1/transport/zones/:id
// DELETE /api/v1/transport/zones/:id
// GET /api/v1/transport/routes
// POST /api/v1/transport/routes
// GET /api/v1/transport/schedules
// POST /api/v1/transport/schedules
// POST /api/v1/transport/bookings
// GET /api/v1/transport/bookings/athlete/:id
// PUT /api/v1/transport/bookings/:id/cancel
```

#### Step 5.2 - Notification Routes
**File:** `backend/src/routes/notification.routes.ts`

```typescript
// Endpoints necessari:
// GET /api/v1/notifications
// PUT /api/v1/notifications/:id/read
// PUT /api/v1/notifications/read-all
// GET /api/v1/notifications/unread-count
// PUT /api/v1/notifications/settings
```

### ✅ FASE 6: TESTING (2-3 ore)

#### Step 6.1 - Test Database Migration
```bash
# Test migration
cd backend
npx prisma migrate dev --name add_missing_features

# Verificare che non ci siano errori
npx prisma studio # Controllare visualmente
```

#### Step 6.2 - Test Services
```bash
# Creare test per ogni nuovo servizio
npm test transport.service.test.ts
npm test notification.service.test.ts
npm test audit.service.test.ts
```

#### Step 6.3 - Test Frontend
```bash
# Test componenti
npm test TransportManager.test.jsx
npm test NotificationCenter.test.jsx
```

### 📝 FASE 7: DOCUMENTAZIONE (1 ora)

#### Step 7.1 - Aggiornare documentazione API
**File:** `Docs/API-DOCUMENTATION.md`
- Documentare tutti i nuovi endpoint
- Esempi di request/response
- Codici errore

#### Step 7.2 - Aggiornare README
**File:** `README.md`
- Aggiungere nuove funzionalità
- Aggiornare screenshots
- Aggiornare requisiti

### 🚀 FASE 8: DEPLOYMENT (1 ora)

#### Step 8.1 - Pre-deployment Checklist
```bash
# 1. Tutti i test passano
npm test

# 2. Build frontend
npm run build

# 3. Build backend
cd backend && npm run build

# 4. Verificare migrations
npx prisma migrate deploy --preview-feature

# 5. Backup database produzione
pg_dump -U user -d production_db > backup_prod.sql
```

#### Step 8.2 - Deploy
```bash
# 1. Merge su main
git checkout main
git merge feature/complete-alignment

# 2. Push su GitHub
git push origin main

# 3. Deploy su server
ssh server
cd /path/to/app
git pull
npm install
npx prisma migrate deploy
pm2 restart all
```

---

## ⚠️ PUNTI CRITICI DA VERIFICARE

### 🔴 ATTENZIONE MASSIMA:

1. **NON ELIMINARE MAI** dati o tabelle esistenti
2. **TESTARE SEMPRE** in ambiente di sviluppo prima
3. **BACKUP SEMPRE** prima di ogni migration
4. **VERIFICARE FOREIGN KEYS** - assicurarsi che tutti i riferimenti siano corretti
5. **CONTROLLARE INDICI** - verificare performance dopo migration
6. **VALIDARE DATI** - controllare che i dati esistenti siano compatibili

### 🟡 VERIFICHE POST-IMPLEMENTAZIONE:

- [ ] Tutti i test passano
- [ ] Nessun errore in console
- [ ] Performance non degradate
- [ ] Tutte le funzionalità esistenti funzionano
- [ ] Nuove funzionalità testate manualmente
- [ ] Documentazione aggiornata
- [ ] Backup verificato e testato

### 🟢 CRITERI DI SUCCESSO:

- Sistema stabile come prima
- Nuove funzionalità operative
- Nessuna perdita di dati
- Performance mantenute o migliorate
- Utenti non impattati negativamente

---

## 📞 TROUBLESHOOTING

### Se la migration fallisce:
```bash
# Rollback immediato
npx prisma migrate reset --skip-seed

# Ripristinare backup
psql -U user -d database < backup.sql

# Analizzare errore e correggere
```

### Se il frontend non funziona:
```bash
# Pulire cache
rm -rf node_modules/.cache
npm run dev

# Verificare console browser per errori
```

### Se le performance degradano:
```sql
-- Analizzare query lente
EXPLAIN ANALYZE SELECT ...;

-- Aggiungere indici mancanti
CREATE INDEX CONCURRENTLY ...;
```

---

## 💡 NOTE FINALI

1. **Implementare gradualmente** - Non fare tutto in una volta
2. **Testare ogni fase** - Prima di passare alla successiva
3. **Coinvolgere utenti** - Per feedback su nuove funzionalità
4. **Monitorare sistema** - Per 48h dopo deployment
5. **Essere pronti al rollback** - Avere sempre piano B

---

## 📊 STIMA TEMPI TOTALI

- Preparazione: 30 minuti
- Migration Database: 2-3 ore
- Backend Services: 4-5 ore
- Frontend Components: 4-5 ore
- API Routes: 3-4 ore
- Testing: 2-3 ore
- Documentazione: 1 ora
- Deployment: 1 ora

**TOTALE: 16-20 ore di sviluppo**

---

## ✅ COMANDI RAPIDI DA COPIARE

```bash
# Backup database
pg_dump -U lucamambelli -d soccer_management > backup_$(date +%Y%m%d_%H%M%S).sql

# Creare branch
git checkout -b feature/complete-alignment

# Test migration locale
cd backend
npx prisma migrate dev --name add_missing_features

# Build e test
npm test
npm run build

# Commit e push
git add .
git commit -m "feat: complete system alignment with specifications"
git push origin feature/complete-alignment
```

---

**IMPORTANTE:** Questo documento deve essere seguito PASSO PASSO senza saltare nessuna fase. La stabilità del sistema dipende dal seguire correttamente tutte le istruzioni!