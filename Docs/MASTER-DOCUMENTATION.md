# 📚 DOCUMENTAZIONE MASTER - SOCCER MANAGEMENT SYSTEM
## 🔴 SCHEMA DEFINITIVO DA SEGUIRE SEMPRE

**Versione:** 3.0.0 - DEFINITIVA  
**Data:** 09 Dicembre 2024  
**Status:** ⚠️ DOCUMENTO UFFICIALE - DA SEGUIRE OBBLIGATORIAMENTE

---

# ⚠️ IMPORTANTE - LEGGERE PRIMA DI TUTTO

## 🚨 REGOLE D'ORO DEL PROGETTO

### REGOLA #1: MAI USARE API DIRETTAMENTE
```javascript
// ❌ SBAGLIATO - NON FARE MAI COSÌ
import api from '../services/api';
const response = await api.get('/athletes');

// ✅ CORRETTO - SEMPRE COSÌ
import { useApiData } from '../hooks/useApiData';
const { data, loading, error, refetch } = useApiData('/athletes');
```

### REGOLA #2: SEMPRE GESTIRE LOADING E ERROR
```javascript
// ❌ SBAGLIATO
function MyPage() {
  const { data } = useApiData('/endpoint');
  return <div>{data.map(...)}</div>;
}

// ✅ CORRETTO
function MyPage() {
  const { data, loading, error, refetch } = useApiData('/endpoint');
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;
  
  return <div>{(data || []).map(...)}</div>;
}
```

### REGOLA #3: MAI ASSUMERE CHE I DATI ESISTANO
```javascript
// ❌ SBAGLIATO
data.athletes.map(...)  // Crash se data è undefined

// ✅ CORRETTO
(data?.athletes || []).map(...)  // Sempre sicuro
```

---

# 📋 INDICE COMPLETO

1. [Architettura del Sistema](#architettura)
2. [Pattern Frontend OBBLIGATORIO](#pattern-frontend)
3. [Pattern Backend OBBLIGATORIO](#pattern-backend)
4. [Hooks Personalizzati](#hooks)
5. [Gestione Errori](#gestione-errori)
6. [Esempi Completi](#esempi)
7. [Checklist Sviluppo](#checklist)
8. [Troubleshooting](#troubleshooting)

---

# 🏗️ ARCHITETTURA DEL SISTEMA {#architettura}

## Stack Tecnologico

### Backend (100% Completato)
- **Node.js** + **TypeScript**
- **Express.js** - Server HTTP
- **Prisma** - ORM per database
- **PostgreSQL** - Database
- **JWT** - Autenticazione
- **Multer** - Upload files

### Frontend (100% Completato)
- **React 18** - UI Framework
- **Vite** - Build tool
- **React Router** - Navigazione
- **Tailwind CSS** - Styling
- **React Hook Form** - Forms
- **React Hot Toast** - Notifiche
- **date-fns** - Date management

## Struttura Directory

```
soccer-management-system/
├── backend/                 # ✅ COMPLETATO 100%
│   ├── src/
│   │   ├── routes/         # Endpoint API
│   │   ├── services/       # Logica business
│   │   ├── middleware/     # Auth, validation
│   │   └── utils/          # Utilities
│   └── prisma/
│       └── schema.prisma   # Database schema
│
├── src/                    # ✅ COMPLETATO 100%
│   ├── components/         # Componenti React
│   ├── pages/             # Pagine applicazione
│   ├── hooks/             # Custom hooks (useApiData)
│   ├── services/          # API client
│   └── utils/             # Utilities frontend
│
└── Docs/                   # 📚 DOCUMENTAZIONE
    └── MASTER-DOCUMENTATION.md  # QUESTO FILE
```

---

# 🎯 PATTERN FRONTEND OBBLIGATORIO {#pattern-frontend}

## 1. STRUTTURA PAGINA STANDARD

**OGNI PAGINA DEVE SEGUIRE QUESTO SCHEMA:**

```javascript
// src/pages/ExamplePage.jsx

import React, { useState } from 'react';
import { useApiData, useApiMutation } from '../hooks/useApiData';
import { toast } from 'react-hot-toast';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

function ExamplePage() {
  // 1. HOOKS PER DATI
  const { data, loading, error, refetch } = useApiData('/endpoint');
  const { mutate } = useApiMutation();
  
  // 2. STATI LOCALI (solo per UI)
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // 3. HANDLERS
  const handleCreate = async (formData) => {
    try {
      await mutate('post', '/endpoint', formData, 'Creato con successo');
      refetch();
      setShowModal(false);
    } catch (error) {
      // Errore già gestito da mutate
    }
  };
  
  const handleUpdate = async (id, formData) => {
    try {
      await mutate('put', `/endpoint/${id}`, formData, 'Aggiornato con successo');
      refetch();
    } catch (error) {
      // Errore già gestito da mutate
    }
  };
  
  const handleDelete = async (id) => {
    if (!window.confirm('Sei sicuro?')) return;
    
    try {
      await mutate('delete', `/endpoint/${id}`, null, 'Eliminato con successo');
      refetch();
    } catch (error) {
      // Errore già gestito da mutate
    }
  };
  
  // 4. LOADING STATE (SEMPRE!)
  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Caricamento...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // 5. ERROR STATE (SEMPRE!)
  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-900 mb-2">Errore nel caricamento</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button 
            onClick={refetch} 
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }
  
  // 6. RENDER PRINCIPALE
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Titolo Pagina</h1>
        <p className="text-gray-600">Descrizione</p>
      </div>
      
      {/* Content - SEMPRE con safe access */}
      <div>
        {(data || []).map(item => (
          <div key={item.id}>
            {/* Contenuto */}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ExamplePage;
```

## 2. USO HOOK useApiData

### Chiamata Singola
```javascript
const { data, loading, error, refetch } = useApiData('/athletes');
```

### Chiamate Multiple (Dashboard)
```javascript
const { data: athletes, loading: loadingAthletes } = useApiData('/athletes');
const { data: documents, loading: loadingDocs } = useApiData('/documents');
const { data: payments, loading: loadingPayments } = useApiData('/payments');

const loading = loadingAthletes || loadingDocs || loadingPayments;
```

### Con Parametri
```javascript
const { data } = useApiData('/documents/expiring?days=30');
const { data } = useApiData(`/athletes/${id}`);
```

## 3. USO HOOK useApiMutation

### CREATE
```javascript
await mutate('post', '/athletes', {
  firstName: 'Mario',
  lastName: 'Rossi',
  birthDate: '2010-01-01'
}, 'Atleta creato con successo');
```

### UPDATE
```javascript
await mutate('put', `/athletes/${id}`, {
  status: 'ACTIVE'
}, 'Atleta aggiornato');
```

### DELETE
```javascript
await mutate('delete', `/athletes/${id}`, null, 'Atleta eliminato');
```

---

# 🔧 PATTERN BACKEND OBBLIGATORIO {#pattern-backend}

## Formato Risposta Standard

**TUTTE LE API DEVONO RESTITUIRE QUESTO FORMATO:**

### Successo
```json
{
  "success": true,
  "data": { ... } o [...]
}
```

### Errore
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Messaggio errore"
  }
}
```

### Lista con Paginazione
```json
{
  "success": true,
  "data": {
    "athletes": [...],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 100,
      "totalPages": 2
    }
  }
}
```

---

# 🪝 HOOKS PERSONALIZZATI {#hooks}

## useApiData Hook

**File:** `src/hooks/useApiData.js`

### Cosa fa:
1. Fetcha dati dal backend
2. Gestisce loading state
3. Gestisce errori
4. Fornisce funzione refetch
5. Cache automatica dei risultati

### Uso:
```javascript
const { data, loading, error, refetch } = useApiData('/endpoint');
```

### Risposta:
- `data`: I dati ricevuti (o `null`)
- `loading`: `true` durante il caricamento
- `error`: Messaggio errore (o `null`)
- `refetch`: Funzione per ricaricare i dati

## useApiMutation Hook

### Cosa fa:
1. Esegue operazioni POST/PUT/DELETE
2. Mostra toast automatici
3. Gestisce errori
4. Ritorna promise per azioni successive

### Uso:
```javascript
const { mutate } = useApiMutation();

// In un handler
await mutate('post', '/endpoint', data, 'Successo!');
```

---

# ❌ GESTIONE ERRORI {#gestione-errori}

## Frontend

### Errori di Caricamento
```javascript
if (error) {
  return <ErrorComponent error={error} onRetry={refetch} />;
}
```

### Errori di Mutazione
```javascript
try {
  await mutate('post', '/endpoint', data);
  // successo
} catch (error) {
  // L'errore è già mostrato come toast
  // Opzionale: azioni aggiuntive
}
```

### Array Vuoti
```javascript
// SEMPRE usare default values
(data || []).map(...)
(data?.items || []).filter(...)
data?.name || 'Nome non disponibile'
```

## Backend

### Try-Catch Standard
```javascript
try {
  const result = await prisma.athlete.create({ data });
  return res.json({ success: true, data: result });
} catch (error) {
  return res.status(400).json({
    success: false,
    error: {
      code: 'CREATE_FAILED',
      message: error.message
    }
  });
}
```

---

# 📝 ESEMPI COMPLETI {#esempi}

## Esempio 1: Pagina Lista con CRUD

```javascript
// src/pages/AthletesPage.jsx
import React, { useState } from 'react';
import { useApiData, useApiMutation } from '../hooks/useApiData';
import { PlusIcon, PencilIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

function AthletesPage() {
  const { data: athletes = [], loading, error, refetch } = useApiData('/athletes');
  const { mutate } = useApiMutation();
  
  const [showModal, setShowModal] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingAthlete) {
        await mutate('put', `/athletes/${editingAthlete.id}`, formData, 'Atleta aggiornato');
      } else {
        await mutate('post', '/athletes', formData, 'Atleta creato');
      }
      refetch();
      resetForm();
    } catch (error) {
      // Gestito da mutate
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminare questo atleta?')) return;
    
    try {
      await mutate('delete', `/athletes/${id}`, null, 'Atleta eliminato');
      refetch();
    } catch (error) {
      // Gestito da mutate
    }
  };

  const resetForm = () => {
    setFormData({ firstName: '', lastName: '', birthDate: '' });
    setEditingAthlete(null);
    setShowModal(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Caricamento atleti...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-900 mb-2">Errore nel caricamento</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button onClick={refetch} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Atleti</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nuovo Atleta
        </button>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-lg shadow">
        {athletes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nessun atleta registrato
          </div>
        ) : (
          <div className="divide-y">
            {athletes.map(athlete => (
              <div key={athlete.id} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{athlete.firstName} {athlete.lastName}</p>
                  <p className="text-sm text-gray-500">
                    Nato il {new Date(athlete.birthDate).toLocaleDateString('it-IT')}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingAthlete(athlete);
                      setFormData({
                        firstName: athlete.firstName,
                        lastName: athlete.lastName,
                        birthDate: athlete.birthDate
                      });
                      setShowModal(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(athlete.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingAthlete ? 'Modifica Atleta' : 'Nuovo Atleta'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cognome *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data di nascita *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.birthDate}
                    onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingAthlete ? 'Salva' : 'Crea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AthletesPage;
```

---

# ✅ CHECKLIST SVILUPPO {#checklist}

## Per Ogni Nuova Pagina

- [ ] Importare `useApiData` e `useApiMutation`
- [ ] NON importare `api` direttamente
- [ ] Implementare loading state
- [ ] Implementare error state con retry
- [ ] Usare `(data || [])` per array
- [ ] Usare `data?.property` per oggetti
- [ ] Testare con backend spento
- [ ] Testare con dati vuoti
- [ ] Verificare toast notifications

## Per Ogni Nuovo Componente

- [ ] Ricevere dati come props
- [ ] NON fare chiamate API dirette
- [ ] Gestire stati vuoti/null
- [ ] Implementare PropTypes o TypeScript

## Per Ogni API Backend

- [ ] Restituire formato `{ success, data }` o `{ success, error }`
- [ ] Status HTTP corretti (200, 201, 400, 404, 500)
- [ ] Validazione input
- [ ] Try-catch su operazioni database
- [ ] Logging errori

---

# 🔧 TROUBLESHOOTING {#troubleshooting}

## Problema: "Cannot read property of undefined"

### Causa
Tentativo di accedere a proprietà di oggetti non definiti

### Soluzione
```javascript
// Invece di
data.user.name

// Usa
data?.user?.name || 'Default'
```

## Problema: "data.map is not a function"

### Causa
`data` non è un array

### Soluzione
```javascript
// Invece di
data.map(...)

// Usa
(data || []).map(...)
// o
(Array.isArray(data) ? data : []).map(...)
```

## Problema: Loading infinito

### Causa
Dipendenze useEffect sbagliate o loop infiniti

### Soluzione
```javascript
// Verifica che useApiData non abbia dipendenze circolari
// Controlla console per errori API
// Verifica che il backend risponda
```

## Problema: Toast non appare

### Causa
Toaster non configurato o errore nel messaggio

### Soluzione
```javascript
// Verifica che App.jsx abbia
import { Toaster } from 'react-hot-toast';

// E nel return
<Toaster position="top-right" />
```

## Problema: Errore 404 su API

### Causa
Endpoint sbagliato o proxy non configurato

### Soluzione
```javascript
// Verifica vite.config.js
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true
  }
}

// Verifica che usi path relativi
useApiData('/athletes')  // Corretto
useApiData('http://localhost:3000/api/v1/athletes')  // Sbagliato
```

---

# 📊 STATO ATTUALE DEL PROGETTO

## ✅ COMPLETATO (100%)

### Backend
- [x] Autenticazione JWT
- [x] CRUD Atleti
- [x] CRUD Documenti
- [x] CRUD Pagamenti
- [x] CRUD Teams
- [x] CRUD Matches
- [x] CRUD Staff
- [x] CRUD Competitions
- [x] CRUD Sponsors
- [x] Sistema Trasporti
- [x] Upload Files
- [x] Multi-tenant
- [x] Validazioni

### Frontend
- [x] Sistema Hook useApiData
- [x] Sistema Hook useApiMutation
- [x] Tutte le pagine conformi
- [x] Loading states
- [x] Error handling
- [x] Toast notifications
- [x] Responsive design
- [x] Form validations

### Documentazione
- [x] Setup guide
- [x] API documentation
- [x] Frontend patterns
- [x] Backend patterns
- [x] Deployment guide

---

# 🚀 COMANDI UTILI

## Sviluppo

```bash
# Backend
cd backend
npm run dev

# Frontend
cd ..
npm run dev

# Database
cd backend
npx prisma studio
npx prisma migrate dev
```

## Git

```bash
# Commit standard
git add -A
git commit -m "Tipo: Descrizione breve"
git push origin main

# Tipi commit
# - Frontend: modifiche frontend
# - Backend: modifiche backend
# - Fix: correzioni bug
# - Docs: documentazione
# - Config: configurazioni
```

## Test

```bash
# Test backend
cd backend
npm test

# Test frontend
npm test
```

---

# 📞 SUPPORTO

## Se hai problemi:

1. **Controlla questa documentazione**
2. **Verifica i log del backend** (`backend/logs/`)
3. **Controlla la console del browser**
4. **Verifica che il database sia attivo**
5. **Riavvia backend e frontend**

## Errori comuni e soluzioni:

| Errore | Soluzione |
|--------|-----------|
| "Port 3000 already in use" | `lsof -i :3000` poi `kill -9 [PID]` |
| "Cannot connect to database" | Avvia PostgreSQL |
| "Module not found" | `npm install` in backend e frontend |
| "Invalid token" | Fai logout e login |

---

# 🎯 REGOLE FINALI DA RICORDARE SEMPRE

## I 10 COMANDAMENTI del Progetto

1. **Mai usare `api` direttamente** - Sempre `useApiData` o `useApiMutation`
2. **Sempre gestire loading state** - L'utente deve sapere che sta caricando
3. **Sempre gestire error state** - Con possibilità di retry
4. **Mai assumere che i dati esistano** - Usa `?.` e `||`
5. **Sempre testare con backend spento** - Per verificare error handling
6. **Mai modificare useApiData hook** - È perfetto così
7. **Sempre commitare spesso** - Piccoli commit frequenti
8. **Mai dimenticare i toast** - Feedback per ogni azione
9. **Sempre documentare** - Commenti nel codice complesso
10. **Mai fare assumzioni** - Verifica sempre i dati

---

# ✅ CONCLUSIONE

Questa documentazione rappresenta lo **STANDARD DEFINITIVO** per il progetto Soccer Management System.

**OGNI SVILUPPO FUTURO DEVE:**
- Seguire questi pattern
- Rispettare queste regole
- Usare questi esempi come riferimento

Il sistema è ora **100% FUNZIONANTE** e **100% CONFORME** a questi standard.

---

**📅 Data Ultimo Aggiornamento:** 09 Dicembre 2024  
**✍️ Autore:** Sistema di Documentazione Automatizzata  
**📌 Versione:** 3.0.0 - DEFINITIVA  
**🔒 Status:** DOCUMENTO UFFICIALE - NON MODIFICARE SENZA AUTORIZZAZIONE

---

## 🏆 QUESTO È LO SCHEMA DA SEGUIRE SEMPRE!