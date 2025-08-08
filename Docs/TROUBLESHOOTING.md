# 🔧 TROUBLESHOOTING - Problemi Comuni e Soluzioni

## Indice
1. [Errori Frontend](#errori-frontend)
2. [Errori Backend](#errori-backend)
3. [Problemi di Configurazione](#problemi-di-configurazione)
4. [Problemi Database](#problemi-database)
5. [Soluzioni Implementate](#soluzioni-implementate)

---

## Errori Frontend

### ❌ Errore: `Cannot read properties of undefined (reading 'map')`

**Causa**: L'API restituisce un formato diverso da quello atteso dal componente React.

**Soluzione Generale**:
```javascript
// Invece di:
setData(response.data.data);

// Usa una gestione adattiva:
const responseData = response.data.data;
if (Array.isArray(responseData)) {
  setData(responseData);
} else if (responseData && responseData.items) {
  setData(responseData.items);
} else {
  setData([]);
}
```

**File Corretti**:
- `src/pages/PaymentsPage.jsx`
- `src/pages/StaffPage.jsx`

### ❌ Errore: `staff.filter is not a function`

**Causa**: La variabile `staff` non è un array.

**Soluzione Implementata in StaffPage.jsx**:
```javascript
const loadStaff = async () => {
  try {
    setLoading(true);
    const response = await api.get('/staff');
    if (response.data.success) {
      const staffData = response.data.data;
      if (Array.isArray(staffData)) {
        setStaff(staffData);
      } else if (staffData && staffData.staffMembers) {
        setStaff(staffData.staffMembers || []);
      } else {
        setStaff([]);
      }
    }
  } catch (error) {
    console.error('Errore caricamento staff:', error);
    toast.error('Errore nel caricamento dello staff');
    setStaff([]);
  } finally {
    setLoading(false);
  }
};
```

### ❌ Errore: Socket.io disconnesso

**Causa**: Token di autenticazione mancante o scaduto.

**Soluzione**:
1. Verificare che il token sia presente in localStorage
2. Controllare la validità del token
3. Implementare reconnection logic:

```javascript
const socket = io(SOCKET_URL, {
  auth: { token: localStorage.getItem('accessToken') },
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});
```

---

## Errori Backend

### ❌ Errore: `Cannot find module '@prisma/client'`

**Soluzione**:
```bash
cd backend
npx prisma generate
npm install @prisma/client
```

### ❌ Errore: Database connection failed

**Soluzione**:
1. Verificare che PostgreSQL sia in esecuzione
2. Controllare le credenziali in `.env`
3. Verificare la stringa di connessione:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/soccer_management"
```

### ❌ Errore: CORS policy blocking

**Soluzione in `backend/src/server.ts`**:
```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
```

---

## Problemi di Configurazione

### ⚠️ Variabili d'ambiente non caricate

**Verifica**:
1. File `.env` presente sia in `/backend` che nella root
2. Sintassi corretta (no spazi intorno a `=`)
3. Restart del server dopo modifiche

### ⚠️ Porta già in uso

**Soluzione**:
```bash
# Trova processo sulla porta 3000
lsof -i :3000
# Killa il processo
kill -9 [PID]

# Oppure cambia porta in .env
PORT=3001
```

---

## Problemi Database

### ⚠️ Migration pending

**Soluzione**:
```bash
cd backend
npx prisma migrate deploy
```

### ⚠️ Schema out of sync

**Soluzione**:
```bash
npx prisma db push --force-reset
npx prisma generate
npm run seed
```

---

## Soluzioni Implementate

### 1. Gestione Formato Risposta API Adattiva

**Problema**: Diversi endpoint restituiscono formati diversi (array vs oggetto con pagination).

**Pattern Soluzione**:
```javascript
// Hook riutilizzabile
const useApiData = (endpoint) => {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await api.get(endpoint);
        const apiData = response.data.data;
        
        // Gestione adattiva
        if (Array.isArray(apiData)) {
          setData(apiData);
        } else if (apiData && typeof apiData === 'object') {
          // Cerca array in proprietà comuni
          const arrayData = apiData.items || 
                           apiData.data || 
                           apiData.results || 
                           apiData.athletes ||
                           apiData.staffMembers ||
                           [];
          setData(arrayData);
        } else {
          setData([]);
        }
      } catch (error) {
        console.error('Error:', error);
        setData([]);
      }
    };
    
    loadData();
  }, [endpoint]);
  
  return data;
};
```

### 2. Error Boundary Globale

**Implementazione in `src/App.jsx`**:
```javascript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600">
            Qualcosa è andato storto
          </h1>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Ricarica Pagina
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 3. Loading States Consistenti

**Pattern**:
```javascript
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [data, setData] = useState([]);

// Loading component
if (loading) {
  return <LoadingSpinner />;
}

// Error component
if (error) {
  return <ErrorMessage error={error} />;
}

// Empty state
if (data.length === 0) {
  return <EmptyState />;
}

// Data display
return <DataDisplay data={data} />;
```

---

## 🚀 Best Practices Applicate

1. **Sempre gestire array vuoti** come fallback
2. **Validare la struttura** della risposta API
3. **Implementare loading states** per migliorare UX
4. **Usare toast notifications** per feedback utente
5. **Loggare errori** in console per debugging
6. **Gestire errori** con try-catch blocks
7. **Usare TypeScript** (backend) per type safety
8. **Implementare retry logic** per chiamate API critiche

---

## 📞 Supporto

Per problemi non risolti:
1. Controlla i log: `backend/logs/app.log`
2. Verifica la console del browser
3. Controlla i log del database
4. Apri una issue su GitHub con:
   - Descrizione del problema
   - Steps per riprodurre
   - Log di errore completi
   - Environment (OS, Node version, etc.)

---

**Ultimo aggiornamento**: 09/12/2024
**Versione documento**: 1.0.0
