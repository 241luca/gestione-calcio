# 📊 DOCUMENTAZIONE LIMITI DI PAGINAZIONE
## Soccer Management System - v2.0.0
**Data aggiornamento:** 7 Agosto 2025

---

## 🎯 PANORAMICA

Il sistema utilizza limiti di paginazione per ottimizzare le performance e gestire grandi quantità di dati. 
Questa documentazione elenca tutti i limiti configurati nel sistema.

---

## 📈 DATI ATTUALI NEL DATABASE

| Entità | Quantità | Limite Configurato | File di Configurazione |
|--------|----------|-------------------|------------------------|
| **⚽ Atleti** | 327 | 400 | `backend/src/routes/athlete.routes.ts` |
| **📄 Documenti** | 841 | 1000 | `backend/src/routes/document.routes.ts` + `services/document.service.ts` |
| **💰 Pagamenti** | 2531 | 3000 | `backend/src/routes/payment.routes.ts` |
| **👥 Team** | 12 | Da verificare | - |
| **🏋️ Staff** | 19 | Da verificare | - |

---

## 🔧 CONFIGURAZIONE LIMITI

### 1. ATLETI (Athletes)
```typescript
// File: backend/src/routes/athlete.routes.ts
// Riga: ~33
const { 
  page = 1, 
  limit = 400,  // Aumentato per gestire 327+ atleti
  sortBy = 'lastName', 
  sortOrder = 'asc',
  ...filters 
} = req.query;
```

### 2. DOCUMENTI (Documents)
```typescript
// File: backend/src/routes/document.routes.ts
// Riga: ~69
const { 
  page = 1, 
  limit = 1000,  // Aumentato per gestire 841+ documenti
  ...filters 
} = req.query as any;

// File: backend/src/services/document.service.ts
// Riga: ~128
const { page = 1, limit = 1000 } = pagination;
```

### 3. PAGAMENTI (Payments)
```typescript
// File: backend/src/routes/payment.routes.ts
// Riga: ~33
const { 
  page = 1, 
  limit = 3000,  // Aumentato per gestire 2531+ pagamenti
  ...filters 
} = req.query as any;
```

### 4. ALTRI MODULI
Altri moduli del sistema che potrebbero avere limiti:
- **Teams**: Da verificare
- **Staff**: Da verificare
- **Matches**: Da verificare
- **Training Sessions**: Da verificare
- **Notifications**: Da verificare

---

## 🚀 COME MODIFICARE I LIMITI

### Per modificare un limite:

1. **Identifica il modulo** da modificare
2. **Apri il file route** corrispondente in `backend/src/routes/`
3. **Cerca la riga** con `limit =`
4. **Modifica il valore** secondo necessità
5. **Verifica anche il service** corrispondente in `backend/src/services/`
6. **Riavvia il backend** con `npm run dev`

### Esempio:
```bash
# Per modificare il limite degli atleti
nano backend/src/routes/athlete.routes.ts
# Cerca: limit = 400
# Modifica con il nuovo valore
# Salva e riavvia
```

---

## ⚠️ CONSIDERAZIONI IMPORTANTI

### Performance
- **Limiti alti** (>1000) possono rallentare il caricamento
- **Limiti molto alti** (>5000) possono causare timeout
- Consigliato implementare **paginazione vera** per dataset grandi

### Memoria
- Ogni record occupa memoria sia sul server che sul client
- Con molti dati, considerare l'implementazione di:
  - Caricamento lazy (infinite scroll)
  - Paginazione con bottoni
  - Filtri per ridurre i risultati

### Database
- Query con `limit` alto impattano le performance del database
- Assicurarsi di avere **indici appropriati** sulle colonne utilizzate per ordinamento

---

## 📋 CHECKLIST PER NUOVI MODULI

Quando si aggiunge un nuovo modulo con paginazione:

- [ ] Definire limite appropriato nel **route** (`limit = X`)
- [ ] Implementare paginazione nel **service**
- [ ] Aggiungere validazione con **zod** schema
- [ ] Documentare il limite in questo file
- [ ] Testare con dataset grandi
- [ ] Verificare performance con il limite scelto

---

## 🔄 STORICO MODIFICHE

| Data | Modulo | Limite Precedente | Limite Nuovo | Motivo |
|------|--------|-------------------|--------------|---------|
| 07/08/2025 | Atleti | 50 → 200 → 400 | 400 | Supportare 327 atleti |
| 07/08/2025 | Documenti | 20 → 50 → 1000 | 1000 | Supportare 841 documenti |
| 07/08/2025 | Pagamenti | 50 → 3000 | 3000 | Supportare 2531 pagamenti |

---

## 🎯 PROSSIMI PASSI

### Breve termine:
1. ✅ Aumentare limiti per gestire dati attuali
2. ⏳ Verificare limiti altri moduli (teams, staff, etc.)
3. ⏳ Aggiungere monitoraggio performance

### Medio termine:
1. 📅 Implementare paginazione con bottoni navigazione
2. 📅 Aggiungere selettore "elementi per pagina"
3. 📅 Implementare ricerca e filtri avanzati

### Lungo termine:
1. 🔮 Infinite scroll per liste lunghe
2. 🔮 Virtual scrolling per performance ottimali
3. 🔮 Cache lato client per dati frequenti

---

## 📞 SUPPORTO

Per problemi o domande sui limiti:
1. Controllare questa documentazione
2. Verificare i log del backend
3. Contattare il team di sviluppo

---

**Ultimo aggiornamento:** 7 Agosto 2025 - Luca Mambelli
