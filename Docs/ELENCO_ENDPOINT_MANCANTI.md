# 📋 ELENCO ENDPOINT MANCANTI NEL BACKEND
## Analisi completa delle API non implementate

**Data:** 8 Agosto 2025  
**Analisi effettuata da:** Claude Assistant

---

## ❌ ENDPOINT MANCANTI (404 Not Found)

### 📊 **DASHBOARD**
```javascript
GET /api/v1/documents/expiring?days=30    // Documenti in scadenza
GET /api/v1/payments/overdue              // Pagamenti scaduti
GET /api/v1/matches/upcoming?limit=5      // Prossime partite
```

### 🚌 **TRASPORTI**
```javascript
GET /api/v1/transport/stats               // Statistiche trasporti
GET /api/v1/transport/zones               // Zone trasporto
GET /api/v1/transport/routes              // Percorsi
GET /api/v1/transport/schedules           // Programmazioni
GET /api/v1/transport/bookings            // Prenotazioni
POST /api/v1/transport/reminders          // Invio promemoria
```

### 🏆 **COMPETIZIONI**
```javascript
GET /api/v1/competitions                  // Lista competizioni
POST /api/v1/competitions                 // Crea competizione
PUT /api/v1/competitions/:id              // Modifica competizione
DELETE /api/v1/competitions/:id           // Elimina competizione
```

### 👥 **STAFF**
```javascript
GET /api/v1/staff                         // Lista staff
POST /api/v1/staff                        // Aggiungi membro
PUT /api/v1/staff/:id                     // Modifica membro
DELETE /api/v1/staff/:id                  // Elimina membro
```

### ⚽ **SQUADRE (TEAMS)**
```javascript
GET /api/v1/teams                         // Lista squadre
POST /api/v1/teams                        // Crea squadra
PUT /api/v1/teams/:id                     // Modifica squadra
DELETE /api/v1/teams/:id                  // Elimina squadra
```

### 💼 **SPONSOR**
```javascript
GET /api/v1/sponsors                      // Lista sponsor
POST /api/v1/sponsors                     // Aggiungi sponsor
PUT /api/v1/sponsors/:id                  // Modifica sponsor
DELETE /api/v1/sponsors/:id               // Elimina sponsor
```

### 🔔 **NOTIFICHE**
```javascript
GET /api/v1/notifications                 // Lista notifiche
PUT /api/v1/notifications/:id/read        // Segna come letta
PUT /api/v1/notifications/mark-all-read   // Segna tutte come lette
DELETE /api/v1/notifications/:id          // Elimina notifica
POST /api/v1/notifications/send-bulk      // Invio massivo
GET /api/v1/notifications/templates       // Template notifiche
GET /api/v1/notifications/stats           // Statistiche
```

### 📅 **CALENDARIO/PARTITE**
```javascript
GET /api/v1/matches                       // Lista partite
GET /api/v1/matches/:id                   // Dettaglio partita
POST /api/v1/matches                      // Crea partita
PUT /api/v1/matches/:id                   // Modifica partita
DELETE /api/v1/matches/:id                // Elimina partita
GET /api/v1/matches/:id/roster            // Convocazioni
POST /api/v1/matches/:id/roster           // Aggiungi convocato
```

### 📄 **DOCUMENTI (parziale)**
```javascript
GET /api/v1/documents/expiring            // Documenti in scadenza
POST /api/v1/documents/verify/:id         // Verifica documento
GET /api/v1/documents/stats               // Statistiche documenti
```

### 💰 **PAGAMENTI (parziale)**
```javascript
GET /api/v1/payments/overdue              // Pagamenti scaduti
GET /api/v1/payments/stats                // Statistiche pagamenti
POST /api/v1/payments/bulk                // Pagamenti multipli
PUT /api/v1/payments/:id/status           // Aggiorna stato
```

### 📊 **REPORT**
```javascript
GET /api/v1/reports/athletes              // Report atleti
GET /api/v1/reports/payments              // Report pagamenti
GET /api/v1/reports/attendance            // Report presenze
POST /api/v1/reports/generate             // Genera report custom
GET /api/v1/reports/export                // Export PDF/Excel
```

### ⚙️ **SETTINGS**
```javascript
GET /api/v1/settings/organization         // Impostazioni org
PUT /api/v1/settings/organization         // Aggiorna impostazioni
GET /api/v1/settings/payment-types        // Tipi pagamento
POST /api/v1/settings/payment-types       // Aggiungi tipo
GET /api/v1/settings/document-types       // Tipi documento
POST /api/v1/settings/document-types      // Aggiungi tipo
```

---

## ✅ ENDPOINT FUNZIONANTI

### ✅ **AUTENTICAZIONE**
```javascript
POST /api/v1/auth/login                   ✅ Funziona
POST /api/v1/auth/logout                  ✅ Funziona
POST /api/v1/auth/refresh                 ✅ Funziona
```

### ✅ **ATLETI**
```javascript
GET /api/v1/athletes                      ✅ Funziona (350+ atleti)
GET /api/v1/athletes/:id                  ✅ Funziona
POST /api/v1/athletes                     ✅ Funziona
PUT /api/v1/athletes/:id                  ✅ Funziona
DELETE /api/v1/athletes/:id               ✅ Funziona
```

### ✅ **DOCUMENTI BASE**
```javascript
GET /api/v1/documents                     ✅ Funziona
GET /api/v1/athletes/:id/documents        ✅ Funziona
POST /api/v1/documents                    ✅ Funziona (upload)
```

### ✅ **PAGAMENTI BASE**
```javascript
GET /api/v1/payments                      ✅ Funziona
GET /api/v1/athletes/:id/payments         ✅ Funziona
POST /api/v1/payments                     ✅ Funziona
```

---

## 📊 RIEPILOGO

### Statistiche:
- **Endpoint mancanti:** ~60
- **Endpoint funzionanti:** ~15
- **Percentuale completamento backend:** ~20%

### Priorità implementazione:
1. **🔴 ALTA:** Dashboard stats (documents/expiring, payments/overdue, matches/upcoming)
2. **🟠 MEDIA:** Teams, Staff, Competitions
3. **🟡 BASSA:** Transport, Reports, Settings

---

## 🚀 PROSSIMI PASSI CONSIGLIATI

### STEP 1: Implementare endpoint Dashboard
Questi sono critici per mostrare informazioni nella home:
- `/documents/expiring`
- `/payments/overdue`
- `/matches/upcoming`

### STEP 2: Completare CRUD base
- Teams (squadre già nel DB)
- Staff (membri già nel DB)
- Competitions (competizioni già nel DB)

### STEP 3: Funzionalità avanzate
- Notifiche
- Report
- Transport

---

## 💡 NOTA IMPORTANTE

**Il frontend è completo al 90%**, ma il **backend è implementato solo al 20%**.

La maggior parte delle funzionalità UI sono pronte, ma mancano le API corrispondenti nel backend.

I dati ci sono nel database (350+ atleti, squadre, staff, etc.) ma mancano gli endpoint per recuperarli/modificarli.

---

**Documento creato:** 8 Agosto 2025  
**Analisi basata su:** Errori console browser + Codice sorgente
