# ⚽ Sistema Gestione Società di Calcio

Sistema completo per la gestione di una società di calcio giovanile.

## 🚀 Funzionalità Principali

- 👥 Gestione completa atleti
- 📄 Gestione documenti e scadenze
- 💰 Tracking pagamenti e quote
- ⚽ Gestione partite e convocazioni
- 📊 Report e statistiche
- 🔔 Notifiche in tempo reale

## 📋 Requisiti

- Node.js 18+
- PostgreSQL 14+
- npm o yarn

## 🛠️ Installazione

1. Clona il repository
```bash
git clone https://github.com/241luca/gestione-calcio.git
cd gestione-calcio
```

2. Installa le dipendenze del backend
```bash
cd backend
npm install
```

3. Configura il database
```bash
npx prisma migrate dev
```

4. Installa le dipendenze del frontend
```bash
cd ..
npm install
```

5. Avvia l'applicazione
```bash
# Backend
cd backend
npm run dev

# Frontend (in un altro terminale)
npm run dev
```

## 🔔 Sistema Notifiche Completo (v3.0.0)

### ✅ Implementato al 100%

**Documentazione completa:** [SISTEMA-NOTIFICHE-DOCUMENTAZIONE.md](./SISTEMA-NOTIFICHE-DOCUMENTAZIONE.md)

#### Funzionalità:
- **Real-time:** Socket.io per notifiche istantanee
- **Email:** Integrazione Brevo con API key criptata nel DB
- **Scheduler:** Jobs automatici configurabili
- **Template:** Personalizzabili con variabili dinamiche
- **Preferenze:** Per utente con quiet hours
- **Audit:** Log completo di tutte le azioni
- **Statistiche:** Dashboard con metriche real-time

#### Database:
- `notifications` - Notifiche utenti
- `notification_templates` - Template personalizzabili  
- `organization_settings` - Settings con API key criptata
- `email_logs` - Log email inviate
- `audit_logs` - Audit trail completo

#### Come configurare:
1. Vai su Settings → Notifiche → Impostazioni Complete
2. Inserisci API key Brevo
3. Configura preferenze e template
4. Sistema pronto!

## 👤 Autore

**Luca Mambelli**
- GitHub: [@241luca](https://github.com/241luca)

## 📝 Licenza

MIT License
