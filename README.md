# ⚽ SOCCER MANAGEMENT SYSTEM
## Sistema Completo Gestione Società di Calcio

**Versione:** 2.1.1  
**Completamento:** 78%  
**Ultimo Aggiornamento:** 9 Dicembre 2024

[![Version](https://img.shields.io/badge/version-2.1.1-blue.svg)](https://github.com/241luca/gestione-calcio)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-blue)](https://www.postgresql.org/)

---

## 🆕 ULTIMI AGGIORNAMENTI

### v2.1.1 (09/12/2024)
- 🐛 **FIX**: Risolto errore `staff.filter is not a function` in StaffPage
- 🔧 **IMPROVEMENT**: Gestione adattiva formato risposta API
- 📝 **DOCS**: Aggiunto CHANGELOG e TROUBLESHOOTING guide

### v2.1.0 (09/08/2024)  
- 🐛 **FIX**: Risolto errore `athletes.map` in PaymentsPage
- 🐛 **FIX**: Implementati endpoint Scheduler mancanti
- 🐛 **FIX**: Aggiunto endpoint Transport stats
- ✅ **STABLE**: Sistema ora stabile e funzionante

---

## 🚀 QUICK START

```bash
# Clona il repository
git clone https://github.com/241luca/gestione-calcio.git
cd gestione-calcio

# Setup Backend
cd backend
npm install
cp .env.example .env  # Configura le variabili
npx prisma migrate deploy
npm run dev

# Setup Frontend (nuovo terminale)
cd ..
npm install
npm run dev
```

🌐 Apri http://localhost:5173

**Credenziali Demo:**
- Email: `demo@soccermanager.com`
- Password: `demo123456`

---

## 📚 DOCUMENTAZIONE

### 📌 **DOCUMENTI PRINCIPALI**

1. **[Docs/README.md](./Docs/README.md)** 📖
   - Documentazione completa del sistema
   - Architettura e tecnologie
   - API Reference

2. **[Docs/CHANGELOG.md](./Docs/CHANGELOG.md)** 📝
   - Cronologia versioni
   - Dettaglio modifiche
   - Bug fix e nuove features

3. **[Docs/TROUBLESHOOTING.md](./Docs/TROUBLESHOOTING.md)** 🆘
   - Problemi comuni e soluzioni
   - Pattern di gestione errori
   - Best practices implementate

4. **[Docs/FIX-TECNICI-v2.1.0.md](./Docs/FIX-TECNICI-v2.1.0.md)** 🔧
   - Dettagli tecnici correzioni v2.1.0
   - Pattern e soluzioni implementate
   - Best practices

5. **[TRACKING-SVILUPPO.md](./TRACKING-SVILUPPO.md)** 📊
   - Stato real-time del sistema
   - Checklist moduli completati
   - Roadmap sviluppo

---

## 🎯 FUNZIONALITÀ PRINCIPALI

### ✅ Completate (100%)
- 🔐 **Autenticazione** - JWT, refresh tokens, multi-tenant
- 👥 **Gestione Atleti** - CRUD completo, import/export, validazioni
- 📄 **Gestione Documenti** - Upload sicuro, scadenze automatiche
- 💰 **Gestione Pagamenti** - Ricevute PDF, export Excel, report
- 🔔 **Sistema Notifiche** - Email, real-time con Socket.io
- 📊 **Dashboard** - Analytics, KPI, grafici interattivi
- ⚙️ **Impostazioni** - Configurazioni, backup, utenti
- 📅 **Scheduler** - Job automatici configurabili (NEW)

### 🟡 In Sviluppo (60-80%)
- ⚽ **Gestione Partite** - Calendario, roster (mancano convocazioni)
- 👨‍👩‍👧‍👦 **Staff** - Gestione base (mancano permessi dettagliati)
- 🏆 **Competizioni** - CRUD base (manca classifica automatica)
- 🚌 **Trasporti** - Dashboard stats funzionante (FIXED)

### 🔴 Da Implementare
- 🎯 **Allenamenti** - Calendario, presenze, schede
- 🏥 **Infortuni** - Tracking, certificati medici
- 📈 **Reports Avanzati** - Analytics AI, ML predictions
- 💬 **Messaggistica** - Chat interna, comunicazioni
- 📱 **App Mobile** - React Native, offline mode

---

## 🛠️ TECH STACK

### Backend
- **Node.js 18+** con **TypeScript**
- **Express.js** - Web framework
- **Prisma ORM** - Database management
- **PostgreSQL 14+** - Database
- **JWT** - Authentication
- **Socket.io** - Real-time
- **Redis** - Cache (optional)

### Frontend
- **React 18** - UI Library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **React Router** - Routing
- **React Hook Form** - Forms
- **Recharts** - Grafici

---

## 📂 STRUTTURA PROGETTO

```
gestione-calcio/
├── backend/               # Backend Node.js/TypeScript
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Auth, validation
│   │   └── utils/        # Utilities
│   └── prisma/           # Database schema
├── src/                  # Frontend React
│   ├── components/       # React components
│   ├── pages/           # Page components
│   ├── services/        # API services
│   └── hooks/           # Custom hooks
├── Docs/                # Documentazione
└── README.md           # Questo file
```

---

## 🤝 CONTRIBUIRE

1. Fork del repository
2. Crea branch feature (`git checkout -b feature/NuovaFeature`)
3. Commit modifiche (`git commit -m 'Add: NuovaFeature'`)
4. Push al branch (`git push origin feature/NuovaFeature`)
5. Apri Pull Request

### Convenzioni Commit
- `Fix:` per bug fix
- `Add:` per nuove features
- `Update:` per modifiche
- `Docs:` per documentazione
- `Test:` per test

---

## 📞 SUPPORTO

- **GitHub**: [241luca/gestione-calcio](https://github.com/241luca/gestione-calcio)
- **Email**: lucamambelli@lmtecnologie.it
- **Issues**: [GitHub Issues](https://github.com/241luca/gestione-calcio/issues)

---

## 📜 LICENSE

MIT License - vedi [LICENSE](./LICENSE) per dettagli

---

## 🙏 CREDITS

Sviluppato da **Luca Mambelli** @ LM Tecnologie

---

> "Il successo di una società sportiva inizia da una gestione efficiente" ⚽

**Soccer Management System** - Gestione sportiva moderna e intelligente 🚀
