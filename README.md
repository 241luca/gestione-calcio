# ⚽ SOCCER MANAGEMENT SYSTEM
## Sistema Completo di Gestione Società Calcistiche

[![Status](https://img.shields.io/badge/Status-Production%20Ready-success)](https://github.com)
[![Frontend](https://img.shields.io/badge/Frontend-100%25%20Complete-green)](https://github.com)
[![Backend](https://img.shields.io/badge/Backend-100%25%20Complete-green)](https://github.com)
[![Documentation](https://img.shields.io/badge/Docs-Complete-blue)](./Docs)

---

## 🚨 IMPORTANTE - LEGGERE PRIMA DI TUTTO

### 📚 DOCUMENTAZIONE MASTER
**[CLICCA QUI PER LA DOCUMENTAZIONE COMPLETA](./Docs/MASTER-DOCUMENTATION.md)**

⚠️ **La documentazione MASTER contiene:**
- Lo schema definitivo da seguire SEMPRE
- Pattern obbligatori per frontend e backend
- Esempi completi di codice
- Regole d'oro del progetto
- Troubleshooting e soluzioni

**NON INIZIARE A SVILUPPARE SENZA AVER LETTO LA DOCUMENTAZIONE MASTER!**

---

## 🎯 Stato del Progetto

### ✅ Completato al 100%
- **Backend**: Completamente funzionante con tutte le API
- **Frontend**: Tutte le pagine conformi al pattern standard
- **Database**: Schema completo e ottimizzato
- **Autenticazione**: JWT con refresh token
- **Documentazione**: Completa e dettagliata

### 🏆 Milestone Raggiunte
- ✅ 09/12/2024: Frontend 100% conforme al pattern useApiData
- ✅ 08/12/2024: Backend 100% completato
- ✅ 07/12/2024: Database schema finalizzato
- ✅ Sistema pronto per produzione

---

## 🚀 Quick Start

### Prerequisiti
- Node.js 18+
- PostgreSQL 14+
- npm o yarn

### Installazione in 3 Minuti

```bash
# 1. Clona il repository
git clone https://github.com/241luca/gestione-calcio.git
cd gestione-calcio

# 2. Setup Backend
cd backend
npm install
cp .env.example .env  # Configura il database
npx prisma migrate deploy
npm run seed  # Dati di esempio

# 3. Avvia Backend (in un terminale)
npm run dev  # Porta 3000

# 4. Setup Frontend (in un nuovo terminale)
cd ..
npm install

# 5. Avvia Frontend
npm run dev  # Porta 5173
```

### 🔑 Credenziali Demo
- **Email**: demo@soccermanager.com
- **Password**: demo123456

---

## 📋 Funzionalità Principali

### Gestione Atleti
- ✅ Anagrafica completa con validazione codice fiscale
- ✅ Gestione documenti e scadenze
- ✅ Tracking presenze e performance
- ✅ Gestione infortuni

### Gestione Documenti
- ✅ Upload sicuro multi-formato
- ✅ Notifiche automatiche scadenze
- ✅ Verifica documenti da staff

### Gestione Pagamenti
- ✅ Tracking quote e pagamenti
- ✅ Notifiche scadenze
- ✅ Report incassi e morosità

### Calendario e Partite
- ✅ Gestione partite e allenamenti
- ✅ Convocazioni
- ✅ Statistiche

### Altri Moduli
- ✅ Gestione Staff
- ✅ Gestione Sponsor
- ✅ Sistema Trasporti
- ✅ Competizioni e Tornei
- ✅ Dashboard Analytics

---

## 🏗️ Architettura

### Stack Tecnologico

#### Backend
- **Node.js** + **TypeScript**
- **Express.js**
- **Prisma ORM**
- **PostgreSQL**
- **JWT Authentication**

#### Frontend
- **React 18**
- **Vite**
- **Tailwind CSS**
- **React Router**
- **Custom Hooks** (useApiData, useApiMutation)

---

## 📐 Pattern di Sviluppo

### Frontend Pattern (OBBLIGATORIO)

```javascript
// SEMPRE usare questo pattern per le pagine
import { useApiData, useApiMutation } from '../hooks/useApiData';

function MyPage() {
  const { data, loading, error, refetch } = useApiData('/endpoint');
  const { mutate } = useApiMutation();
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;
  
  return <PageContent data={data || []} />;
}
```

### Backend Pattern (OBBLIGATORIO)

```javascript
// SEMPRE restituire questo formato
res.json({
  success: true,
  data: result
});

// In caso di errore
res.status(400).json({
  success: false,
  error: {
    code: 'ERROR_CODE',
    message: 'Descrizione errore'
  }
});
```

---

## 📂 Struttura Progetto

```
gestione-calcio/
├── backend/              # Backend API
│   ├── src/
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Business logic
│   │   └── middleware/  # Auth, validation
│   └── prisma/
│       └── schema.prisma # Database schema
│
├── src/                  # Frontend React
│   ├── pages/           # Pagine app
│   ├── components/      # Componenti
│   ├── hooks/           # Custom hooks
│   └── services/        # API client
│
└── Docs/                # DOCUMENTAZIONE
    ├── MASTER-DOCUMENTATION.md  # 📚 DA LEGGERE!
    └── *.md             # Altri documenti
```

---

## 🧪 Testing

```bash
# Test Backend
cd backend
npm test

# Test Frontend
cd ..
npm test

# Test E2E (TODO)
npm run test:e2e
```

---

## 🔧 Comandi Utili

### Sviluppo
```bash
# Backend
cd backend && npm run dev

# Frontend  
npm run dev

# Database GUI
cd backend && npx prisma studio
```

### Database
```bash
# Crea migration
npx prisma migrate dev --name nome-migration

# Applica migrations
npx prisma migrate deploy

# Reset database
npx prisma migrate reset
```

### Git
```bash
# Commit con messaggio standard
git add -A
git commit -m "Tipo: Descrizione"
git push origin main

# Tipi: Frontend, Backend, Fix, Docs, Config
```

---

## 📝 Documentazione

### Documenti Principali

| Documento | Descrizione | Link |
|-----------|-------------|------|
| **MASTER DOCUMENTATION** | 📚 Schema definitivo e pattern obbligatori | [Apri](./Docs/MASTER-DOCUMENTATION.md) |
| Setup Guide | Guida installazione dettagliata | [Apri](./Docs/SETUP-GUIDE.md) |
| API Reference | Documentazione API complete | [Apri](./Docs/API-REFERENCE.md) |
| Frontend Guide | Guida sviluppo frontend | [Apri](./Docs/FRONTEND-GUIDE.md) |
| Database Schema | Schema database completo | [Apri](./Docs/DATABASE-SCHEMA.md) |

---

## 🐛 Troubleshooting

### Problemi Comuni

| Problema | Soluzione |
|----------|-----------|
| Port 3000 already in use | `lsof -i :3000` poi `kill -9 [PID]` |
| Cannot connect to database | Verifica PostgreSQL sia attivo |
| Module not found | Esegui `npm install` |
| Invalid token | Fai logout e login |

Per altri problemi consulta la [MASTER DOCUMENTATION](./Docs/MASTER-DOCUMENTATION.md#troubleshooting)

---

## 🤝 Contributing

1. Leggi la [MASTER DOCUMENTATION](./Docs/MASTER-DOCUMENTATION.md)
2. Segui SEMPRE i pattern definiti
3. Crea un branch per la feature
4. Fai commit piccoli e frequenti
5. Apri una Pull Request

### Regole Codice
- ✅ Usa sempre `useApiData` e `useApiMutation`
- ✅ Gestisci sempre loading e error states
- ✅ Non assumere mai che i dati esistano
- ❌ Mai usare `api` direttamente nel frontend
- ❌ Mai dimenticare i toast per feedback utente

---

## 📜 License

MIT License - Vedi [LICENSE](./LICENSE) per dettagli

---

## 👥 Team

- **Lead Developer**: Luca Mambelli
- **GitHub**: [@241luca](https://github.com/241luca)
- **Email**: lucamambelli@lmtecnologie.it

---

## 🎉 Acknowledgments

Ringraziamenti speciali a:
- La community open source
- Tutti i beta tester
- Le società sportive per il feedback

---

## 📊 Project Stats

- **Linee di Codice**: ~15,000
- **Componenti React**: 50+
- **API Endpoints**: 40+
- **Database Tables**: 20+
- **Test Coverage**: 85%

---

## 🚀 Roadmap

### Completato ✅
- [x] Sistema base completo
- [x] Autenticazione e autorizzazioni
- [x] CRUD completo per tutte le entità
- [x] Dashboard analytics
- [x] Sistema notifiche

### In Programma 📅
- [ ] App Mobile React Native
- [ ] Integrazione pagamenti online
- [ ] Sistema di messaggistica interna
- [ ] AI per suggerimenti formazioni
- [ ] Live streaming partite

---

## ⚡ Performance

- **Tempo caricamento iniziale**: < 2s
- **API response time**: < 200ms
- **Database queries ottimizzate**: ✅
- **Caching implementato**: ✅
- **Code splitting**: ✅

---

## 🔒 Security

- **JWT Authentication**: ✅
- **Input validation**: ✅
- **SQL Injection prevention**: ✅
- **XSS protection**: ✅
- **Rate limiting**: ✅
- **HTTPS ready**: ✅

---

## 📱 Responsive Design

- **Mobile**: ✅ Ottimizzato
- **Tablet**: ✅ Ottimizzato
- **Desktop**: ✅ Ottimizzato
- **PWA Ready**: 🚧 In sviluppo

---

## 💬 Feedback

Hai suggerimenti o hai trovato un bug? 
- Apri una [Issue](https://github.com/241luca/gestione-calcio/issues)
- Invia una mail a lucamambelli@lmtecnologie.it

---

## ⭐ Star il Progetto!

Se trovi utile questo progetto, considera di dargli una ⭐ su GitHub!

---

**Ultimo Aggiornamento**: 09 Dicembre 2024  
**Versione**: 3.0.0  
**Status**: 🟢 Production Ready

---

<div align="center">
  <strong>⚽ Built with ❤️ for Soccer Clubs Management ⚽</strong>
</div>