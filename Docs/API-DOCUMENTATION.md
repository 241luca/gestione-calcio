# 📚 API DOCUMENTATION - SOCCER MANAGEMENT SYSTEM
## Versione 2.0.0 - Documentazione Completa

---

## 🔐 AUTENTICAZIONE

Tutte le API (eccetto login e register) richiedono un token JWT nel header:
```
Authorization: Bearer <token>
X-Organization-ID: <organization-id>
```

### Base URL
```
Development: http://localhost:3000/api/v1
Production: https://api.soccermanager.com/v1
```

---

## 📋 INDICE ENDPOINTS

### [Autenticazione](#auth-endpoints)
- POST /auth/register
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout
- GET /auth/me

### [Atleti](#athletes-endpoints)
- GET /athletes
- GET /athletes/:id
- POST /athletes
- PUT /athletes/:id
- DELETE /athletes/:id
- POST /athletes/bulk-import

### [Documenti](#documents-endpoints)
- GET /documents
- GET /documents/:id
- POST /documents/upload
- POST /documents/:id/verify
- DELETE /documents/:id
- GET /documents/expiring

### [Pagamenti](#payments-endpoints)
- GET /payments
- GET /payments/:id
- POST /payments
- PUT /payments/:id
- POST /payments/:id/pay
- GET /payments/overdue

### [Squadre](#teams-endpoints)
- GET /teams
- GET /teams/:id
- POST /teams
- PUT /teams/:id
- DELETE /teams/:id

### [Partite](#matches-endpoints)
- GET /matches
- GET /matches/:id
- POST /matches
- PUT /matches/:id
- DELETE /matches/:id
- POST /matches/:id/roster
- POST /matches/:id/stats

### [Competizioni](#competitions-endpoints)
- GET /competitions
- GET /competitions/:id
- POST /competitions
- PUT /competitions/:id
- DELETE /competitions/:id
- GET /competitions/:id/standings

### [Staff](#staff-endpoints)
- GET /staff
- GET /staff/:id
- POST /staff
- PUT /staff/:id
- DELETE /staff/:id

### [Sponsor](#sponsors-endpoints)
- GET /sponsors
- GET /sponsors/:id
- POST /sponsors
- PUT /sponsors/:id
- DELETE /sponsors/:id
- GET /sponsors/stats

### [Campi da Gioco](#venues-endpoints)
- GET /venues
- GET /venues/:id
- POST /venues
- PUT /venues/:id
- DELETE /venues/:id

### [Trasporti](#transport-endpoints)
- GET /transport/zones
- POST /transport/zones
- GET /transport/routes
- POST /transport/routes
- GET /transport/schedules
- POST /transport/schedules
- POST /transport/bookings
- DELETE /transport/bookings/:id

### [Notifiche](#notifications-endpoints)
- GET /notifications
- POST /notifications/:id/read
- POST /notifications/mark-all-read

### [Report](#reports-endpoints)
- GET /reports/stats
- GET /reports/charts
- GET /reports/attendance
- GET /reports/payments
- GET /reports/summary

---

## 🔐 <a name="auth-endpoints"></a>AUTENTICAZIONE

### POST /auth/register
Registra nuovo utente e organizzazione

**Request Body:**
```json
{
  "organizationName": "ASD Calcio Milano",
  "organizationTaxCode": "12345678901",
  "firstName": "Mario",
  "lastName": "Rossi",
  "email": "mario@example.com",
  "password": "SecurePass123!",
  "phone": "+39 333 1234567"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "id": "uuid",
      "email": "mario@example.com",
      "firstName": "Mario",
      "lastName": "Rossi",
      "organizationId": "uuid",
      "role": "admin"
    }
  }
}
```

### POST /auth/login
Login utente esistente

**Request Body:**
```json
{
  "email": "mario@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "id": "uuid",
      "email": "mario@example.com",
      "firstName": "Mario",
      "lastName": "Rossi",
      "organizationId": "uuid",
      "role": "admin",
      "permissions": ["athletes:read", "athletes:write", "payments:read"]
    }
  }
}
```

### POST /auth/refresh
Rinnova access token usando refresh token

**Request Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

---

## 👥 <a name="athletes-endpoints"></a>ATLETI

### GET /athletes
Lista atleti con paginazione e filtri

**Query Parameters:**
- `page` (number): Pagina corrente (default: 1)
- `limit` (number): Elementi per pagina (default: 20)
- `search` (string): Cerca per nome, cognome, codice fiscale
- `teamId` (string): Filtra per squadra
- `status` (string): ACTIVE | INACTIVE | SUSPENDED | INJURED
- `hasExpiredDocuments` (boolean): Solo atleti con documenti scaduti
- `hasOverduePayments` (boolean): Solo atleti con pagamenti scaduti

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "athletes": [
      {
        "id": "uuid",
        "firstName": "Giovanni",
        "lastName": "Bianchi",
        "birthDate": "2010-05-15",
        "fiscalCode": "BNCGNN10E15H501X",
        "email": "giovanni@example.com",
        "phone": "+39 333 9876543",
        "status": "ACTIVE",
        "team": {
          "id": "uuid",
          "name": "Under 14",
          "category": "U14"
        },
        "position": {
          "id": "uuid",
          "name": "Centrocampista",
          "abbreviation": "CEN"
        },
        "jerseyNumber": 10,
        "transportZone": {
          "id": "uuid",
          "name": "Zona Nord"
        },
        "_count": {
          "documents": 5,
          "payments": 12
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 85,
      "totalPages": 5
    }
  }
}
```

### GET /athletes/:id
Dettaglio singolo atleta con tutte le relazioni

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "firstName": "Giovanni",
    "lastName": "Bianchi",
    "birthDate": "2010-05-15",
    "birthPlace": "Milano",
    "nationality": "Italiana",
    "fiscalCode": "BNCGNN10E15H501X",
    "email": "giovanni@example.com",
    "phone": "+39 333 9876543",
    "address": "Via Roma 123",
    "city": "Milano",
    "province": "MI",
    "zipCode": "20100",
    "status": "ACTIVE",
    "height": 165,
    "weight": 55,
    "footPreference": "RIGHT",
    "medicalNotes": "Allergia graminacee",
    "parentName": "Marco Bianchi",
    "parentPhone": "+39 333 1111111",
    "parentEmail": "marco.bianchi@example.com",
    "team": { /* ... */ },
    "position": { /* ... */ },
    "documents": [ /* ... */ ],
    "payments": [ /* ... */ ],
    "matchRoster": [ /* ... */ ],
    "injuries": [ /* ... */ ],
    "stats": {
      "totalMatches": 25,
      "totalGoals": 12,
      "totalAssists": 8,
      "attendanceRate": 92.5
    }
  }
}
```

### POST /athletes
Crea nuovo atleta

**Request Body:**
```json
{
  "firstName": "Luca",
  "lastName": "Verdi",
  "birthDate": "2011-03-20",
  "birthPlace": "Roma",
  "fiscalCode": "VRDLCU11C20H501X",
  "email": "luca.verdi@example.com",
  "phone": "+39 333 2222222",
  "address": "Via Milano 45",
  "city": "Roma",
  "province": "RM",
  "zipCode": "00100",
  "teamId": "uuid",
  "positionId": "uuid",
  "jerseyNumber": 7,
  "parentName": "Paolo Verdi",
  "parentPhone": "+39 333 3333333",
  "parentEmail": "paolo.verdi@example.com"
}
```

**Response:** `201 Created`

### PUT /athletes/:id
Aggiorna atleta esistente

**Request Body:** (campi opzionali)
```json
{
  "email": "nuovo.email@example.com",
  "phone": "+39 333 4444444",
  "status": "INJURED",
  "teamId": "new-team-uuid",
  "jerseyNumber": 9
}
```

**Response:** `200 OK`

### DELETE /athletes/:id
Elimina atleta (soft delete - cambia status in INACTIVE)

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Atleta eliminato con successo"
}
```

---

## 📄 <a name="documents-endpoints"></a>DOCUMENTI

### POST /documents/upload
Upload nuovo documento

**Request:** `multipart/form-data`
- `file`: File da caricare (max 10MB, formati: jpg, png, pdf, doc, docx)
- `athleteId`: ID dell'atleta
- `typeId`: ID tipo documento
- `issueDate`: Data emissione (opzionale)
- `expiryDate`: Data scadenza (opzionale)
- `notes`: Note (opzionale)

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "athleteId": "uuid",
    "fileName": "certificato_medico.pdf",
    "fileUrl": "/uploads/uuid_certificato_medico.pdf",
    "fileSize": 245678,
    "mimeType": "application/pdf",
    "typeId": 1,
    "type": {
      "id": 1,
      "name": "Certificato Medico",
      "isRequired": true,
      "hasExpiry": true
    },
    "issueDate": "2024-01-15",
    "expiryDate": "2025-01-15",
    "status": "VALID",
    "isVerified": false
  }
}
```

### GET /documents
Lista documenti con filtri

**Query Parameters:**
- `athleteId`: Filtra per atleta
- `typeId`: Filtra per tipo
- `status`: VALID | EXPIRING | EXPIRED
- `isVerified`: true | false

**Response:** `200 OK`

### POST /documents/:id/verify
Verifica documento (solo admin/staff)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "isVerified": true,
    "verifiedBy": "user-uuid",
    "verifiedAt": "2024-08-08T10:30:00Z"
  }
}
```

### GET /documents/expiring
Documenti in scadenza nei prossimi 30 giorni

**Query Parameters:**
- `days`: Numero giorni (default: 30)

**Response:** `200 OK`

---

## 💰 <a name="payments-endpoints"></a>PAGAMENTI

### GET /payments
Lista pagamenti con filtri

**Query Parameters:**
- `athleteId`: Filtra per atleta
- `status`: PENDING | PAID | PARTIAL | OVERDUE | CANCELLED
- `fromDate`: Data inizio
- `toDate`: Data fine
- `typeId`: Tipo pagamento

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "uuid",
        "athlete": {
          "id": "uuid",
          "firstName": "Giovanni",
          "lastName": "Bianchi"
        },
        "type": {
          "id": 1,
          "name": "Quota Mensile",
          "amount": 80
        },
        "amount": 80,
        "paidAmount": 0,
        "dueDate": "2024-08-31",
        "status": "PENDING",
        "description": "Quota agosto 2024"
      }
    ],
    "stats": {
      "totalPending": 5600,
      "totalPaid": 12800,
      "totalOverdue": 1200,
      "collectionRate": 91.4
    }
  }
}
```

### POST /payments
Crea nuovo pagamento

**Request Body:**
```json
{
  "athleteId": "uuid",
  "typeId": 1,
  "amount": 80,
  "dueDate": "2024-08-31",
  "description": "Quota agosto 2024"
}
```

**Response:** `201 Created`

### POST /payments/:id/pay
Registra pagamento

**Request Body:**
```json
{
  "paidAmount": 80,
  "paymentMethod": "BANK_TRANSFER",
  "notes": "Bonifico del 08/08/2024"
}
```

**Response:** `200 OK`

### GET /payments/overdue
Pagamenti scaduti

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "payments": [ /* ... */ ],
    "totalOverdue": 2400,
    "count": 12,
    "athletesWithOverdue": [
      {
        "athleteId": "uuid",
        "athleteName": "Mario Rossi",
        "totalOverdue": 240,
        "overdueCount": 3
      }
    ]
  }
}
```

---

## 🏆 <a name="matches-endpoints"></a>PARTITE

### GET /matches
Lista partite

**Query Parameters:**
- `teamId`: Filtra per squadra
- `status`: SCHEDULED | IN_PROGRESS | COMPLETED | CANCELLED | POSTPONED
- `fromDate`: Data inizio
- `toDate`: Data fine
- `competitionId`: Filtra per competizione

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "date": "2024-08-10T15:00:00Z",
      "time": "15:00",
      "homeTeam": {
        "id": "uuid",
        "name": "Under 14"
      },
      "awayTeam": {
        "id": "uuid",
        "name": "AC Rival"
      },
      "venue": {
        "id": "uuid",
        "name": "Campo Principale",
        "address": "Via Sport 1"
      },
      "competition": {
        "id": "uuid",
        "name": "Campionato Provinciale U14"
      },
      "homeScore": null,
      "awayScore": null,
      "status": "SCHEDULED"
    }
  ]
}
```

### POST /matches
Crea nuova partita

**Request Body:**
```json
{
  "homeTeamId": "uuid",
  "awayTeamId": "uuid",
  "date": "2024-08-10T15:00:00Z",
  "time": "15:00",
  "venueId": "uuid",
  "competitionId": "uuid",
  "matchType": "CAMPIONATO"
}
```

**Response:** `201 Created`

### POST /matches/:id/roster
Gestisce convocazioni

**Request Body:**
```json
{
  "roster": [
    {
      "athleteId": "uuid",
      "isStarter": true,
      "position": "ATT"
    },
    {
      "athleteId": "uuid",
      "isStarter": false,
      "position": "DIF"
    }
  ]
}
```

**Response:** `200 OK`

### POST /matches/:id/stats
Aggiorna statistiche partita

**Request Body:**
```json
{
  "homeScore": 2,
  "awayScore": 1,
  "status": "COMPLETED",
  "athleteStats": [
    {
      "athleteId": "uuid",
      "minutesPlayed": 90,
      "goals": 1,
      "assists": 1,
      "yellowCards": 0,
      "redCards": 0
    }
  ]
}
```

**Response:** `200 OK`

---

## 🏅 <a name="competitions-endpoints"></a>COMPETIZIONI

### GET /competitions
Lista competizioni

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Campionato Provinciale",
      "type": "CAMPIONATO",
      "category": "U14",
      "season": "2024/2025",
      "startDate": "2024-09-01",
      "endDate": "2025-05-31",
      "_count": {
        "matches": 26
      }
    }
  ]
}
```

### GET /competitions/:id/standings
Classifica competizione

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "competition": { /* ... */ },
    "standings": [
      {
        "position": 1,
        "teamId": "uuid",
        "teamName": "Under 14",
        "played": 10,
        "won": 7,
        "drawn": 2,
        "lost": 1,
        "goalsFor": 25,
        "goalsAgainst": 8,
        "goalDifference": 17,
        "points": 23
      }
    ]
  }
}
```

---

## 🚌 <a name="transport-endpoints"></a>TRASPORTI

### GET /transport/zones
Lista zone trasporto

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Zona Nord",
      "description": "Milano Nord e hinterland",
      "_count": {
        "athletes": 12
      }
    }
  ]
}
```

### GET /transport/schedules
Programmazione trasporti

**Query Parameters:**
- `routeId`: Filtra per route
- `matchId`: Filtra per partita
- `fromDate`: Data inizio
- `toDate`: Data fine

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "route": {
        "id": "uuid",
        "name": "Linea Centro",
        "driver": "Mario Rossi",
        "vehiclePlate": "AB123CD",
        "capacity": 8
      },
      "pickupTime": "2024-08-10T14:00:00Z",
      "returnTime": "2024-08-10T18:00:00Z",
      "match": {
        "id": "uuid",
        "homeTeam": { /* ... */ },
        "awayTeam": { /* ... */ }
      },
      "bookings": [
        {
          "id": "uuid",
          "athlete": {
            "firstName": "Giovanni",
            "lastName": "Bianchi"
          },
          "pickupPoint": "Piazza Duomo",
          "status": "CONFIRMED"
        }
      ],
      "availableSeats": 3
    }
  ]
}
```

### POST /transport/bookings
Prenota trasporto

**Request Body:**
```json
{
  "scheduleId": "uuid",
  "athleteId": "uuid",
  "pickupPoint": "Piazza Duomo",
  "notes": "Ritorno con i genitori"
}
```

**Response:** `201 Created`

---

## 📊 <a name="reports-endpoints"></a>REPORT

### GET /reports/stats
Statistiche generali dashboard

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "athletes": {
      "total": 85,
      "active": 78,
      "inactive": 7
    },
    "teams": {
      "total": 6
    },
    "documents": {
      "total": 425,
      "expiring": 12,
      "expired": 3
    },
    "payments": {
      "total": 1020,
      "overdue": 15,
      "monthlyRevenue": 6400
    }
  }
}
```

### GET /reports/charts
Dati per grafici dashboard

**Query Parameters:**
- `period`: week | month | year

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "revenue": {
      "label": "Ricavi nel tempo",
      "data": [
        { "date": "2024-08-01", "amount": 2400 },
        { "date": "2024-08-07", "amount": 1800 }
      ]
    },
    "athletesByTeam": {
      "label": "Atleti per squadra",
      "data": [
        { "teamName": "Under 14", "count": 22 },
        { "teamName": "Under 12", "count": 18 }
      ]
    },
    "documentStatus": {
      "label": "Stato documenti",
      "data": [
        { "status": "VALID", "count": 410 },
        { "status": "EXPIRING", "count": 12 },
        { "status": "EXPIRED", "count": 3 }
      ]
    }
  }
}
```

### GET /reports/attendance
Report presenze allenamenti

**Query Parameters:**
- `teamId`: Filtra per squadra
- `startDate`: Data inizio
- `endDate`: Data fine

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2024-08-01",
      "end": "2024-08-31"
    },
    "totalSessions": 12,
    "athleteStats": [
      {
        "athleteId": "uuid",
        "athleteName": "Giovanni Bianchi",
        "totalSessions": 12,
        "presentSessions": 11,
        "absentSessions": 1,
        "attendanceRate": "91.7"
      }
    ]
  }
}
```

---

## 🔔 <a name="notifications-endpoints"></a>NOTIFICHE

### GET /notifications
Lista notifiche utente

**Query Parameters:**
- `unreadOnly`: true | false
- `priority`: low | normal | high | urgent

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "DOCUMENT_EXPIRING",
      "title": "Documento in scadenza",
      "message": "Il certificato medico di Giovanni Bianchi scade tra 7 giorni",
      "priority": "high",
      "isRead": false,
      "createdAt": "2024-08-08T10:00:00Z",
      "link": "/athletes/uuid/documents"
    }
  ]
}
```

---

## ⚠️ GESTIONE ERRORI

Tutti gli endpoint restituiscono errori nel formato standard:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "I dati inseriti non sono validi",
    "details": [
      {
        "field": "email",
        "message": "Email non valida"
      }
    ],
    "suggestion": "Controlla i campi evidenziati e riprova"
  },
  "timestamp": "2024-08-08T10:30:00Z",
  "requestId": "uuid"
}
```

### Codici di Errore Comuni

| Codice | HTTP Status | Descrizione |
|--------|-------------|-------------|
| VALIDATION_ERROR | 422 | Dati non validi |
| UNAUTHORIZED | 401 | Non autenticato |
| FORBIDDEN | 403 | Non autorizzato |
| NOT_FOUND | 404 | Risorsa non trovata |
| CONFLICT | 409 | Conflitto (es. duplicato) |
| BAD_REQUEST | 400 | Richiesta malformata |
| INTERNAL_ERROR | 500 | Errore server |

---

## 🔄 REAL-TIME EVENTS (Socket.io)

### Connessione
```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'Bearer <jwt-token>'
  }
});
```

### Eventi disponibili

**Documenti:**
- `document:expiring` - Documento in scadenza
- `document:expired` - Documento scaduto
- `document:uploaded` - Nuovo documento caricato
- `document:verified` - Documento verificato

**Pagamenti:**
- `payment:overdue` - Pagamento scaduto
- `payment:received` - Pagamento ricevuto
- `payment:reminder` - Promemoria pagamento

**Partite:**
- `match:reminder` - Promemoria partita
- `match:roster` - Convocazione pubblicata
- `match:update` - Aggiornamento partita
- `match:live` - Aggiornamenti live

**Sistema:**
- `notification:new` - Nuova notifica
- `refresh:dashboard` - Aggiorna dashboard
- `refresh:athletes` - Aggiorna lista atleti

### Esempio sottoscrizione
```javascript
// Sottoscrivi a squadra specifica
socket.emit('subscribe:team', teamId);

// Ricevi aggiornamenti
socket.on('match:update', (data) => {
  console.log('Aggiornamento partita:', data);
});

// Sottoscrivi a partita live
socket.emit('subscribe:match', matchId);

socket.on('match:live', (data) => {
  console.log('Live update:', data);
  // { type: 'goal', minute: 45, scorer: 'Giovanni Bianchi', score: '1-0' }
});
```

---

## 🔒 RATE LIMITING

### Limiti di richieste

| Endpoint | Limite | Finestra |
|----------|--------|----------|
| /auth/login | 5 richieste | 15 minuti |
| /documents/upload | 20 richieste | 1 ora |
| API generali | 100 richieste | 15 minuti |
| API mobile | 30 richieste | 1 minuto |

### Headers di risposta
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2024-08-08T11:00:00Z
```

---

## 📱 API MOBILE

Endpoint ottimizzati per app mobile con payload ridotti:

### GET /api/v1/mobile/dashboard
Dashboard semplificata per mobile

### GET /api/v1/mobile/athletes
Lista atleti ottimizzata (solo campi essenziali)

### POST /api/v1/mobile/quick/attendance
Registrazione veloce presenze

### POST /api/v1/mobile/quick/payment
Registrazione veloce pagamenti

---

## 🧪 TESTING ENDPOINTS

### Ambiente di Test
```
Base URL: http://localhost:3000/api/v1
Test Organization ID: test-org-uuid
Test User Token: (generato al login)
```

### Credenziali di Test
```
Email: demo@soccermanager.com
Password: demo123456
```

### Postman Collection
Importa la collection Postman disponibile in:
`/docs/postman/soccer-management-api.json`

### cURL Examples

**Login:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@soccermanager.com","password":"demo123456"}'
```

**Get Athletes:**
```bash
curl -X GET http://localhost:3000/api/v1/athletes \
  -H "Authorization: Bearer <token>" \
  -H "X-Organization-ID: <org-id>"
```

**Upload Document:**
```bash
curl -X POST http://localhost:3000/api/v1/documents/upload \
  -H "Authorization: Bearer <token>" \
  -H "X-Organization-ID: <org-id>" \
  -F "file=@certificato.pdf" \
  -F "athleteId=uuid" \
  -F "typeId=1"
```

---

## 📚 SDK E LIBRERIE

### JavaScript/TypeScript SDK
```javascript
import { SoccerManagerAPI } from '@soccermanager/sdk';

const api = new SoccerManagerAPI({
  baseURL: 'http://localhost:3000/api/v1',
  token: 'your-jwt-token',
  organizationId: 'your-org-id'
});

// Esempio utilizzo
const athletes = await api.athletes.list({ 
  teamId: 'uuid',
  status: 'ACTIVE' 
});
```

### React Hooks
```javascript
import { useAthletes, usePayments } from '@soccermanager/react';

function AthletesPage() {
  const { data, loading, error } = useAthletes({
    teamId: 'uuid'
  });
  
  if (loading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  
  return <AthletesList athletes={data} />;
}
```

---

## 🆘 SUPPORTO

### Contatti Sviluppatori
- **Email**: dev@soccermanager.com
- **GitHub Issues**: github.com/soccermanager/api/issues
- **Discord**: discord.gg/soccermanager-dev

### FAQ Tecniche

**Q: Come gestire il refresh token?**
A: Il refresh token ha validità di 7 giorni. Utilizzalo per ottenere un nuovo access token quando quello corrente scade (24h).

**Q: Come gestire gli upload di file grandi?**
A: Il limite è 10MB per file. Per file più grandi, contatta il supporto per abilitare upload chunked.

**Q: Come ottimizzare le query con molti dati?**
A: Usa sempre paginazione, filtri specifici e seleziona solo i campi necessari con il parametro `fields`.

---

## 📈 CHANGELOG API

### v2.0.0 (2024-08-08)
- ✨ Aggiunto sistema trasporti completo
- ✨ Aggiunte API per competizioni con classifica
- ✨ Aggiunto supporto real-time con Socket.io
- ✨ Aggiunte API report e analytics
- 🐛 Fix allineamento campi database

### v1.5.0 (2024-07-15)
- ✨ Aggiunto supporto multi-tenant
- ✨ Aggiunte API per staff e sponsor
- 🔒 Implementato rate limiting

### v1.0.0 (2024-06-01)
- 🎉 Release iniziale

---

**Ultimo aggiornamento**: 8 Agosto 2024
**Versione API**: 2.0.0
**Status**: Production Ready ✅
