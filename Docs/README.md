# 📚 DOCUMENTAZIONE SOCCER MANAGEMENT SYSTEM

## 📁 Struttura Documentazione

Questa cartella contiene tutta la documentazione tecnica del progetto.

### 📖 Documenti Disponibili:

#### 1. **[API-DOCUMENTATION.md](./API-DOCUMENTATION.md)**
Documentazione completa di tutte le API REST del sistema:
- Tutti gli endpoint con esempi
- Autenticazione e autorizzazioni
- Gestione errori
- Eventi Socket.io real-time
- Rate limiting
- Esempi cURL e SDK

#### 2. **[postman/](./postman/)**
Collection Postman per testare le API:
- `soccer-management-api.json` - Collection completa con tutti gli endpoint

#### 3. **[Docs principali](../Docs/)** *(cartella separata)*
Documentazione di configurazione e setup:
- `PARTE-1-CONFIGURAZIONE.md` - Setup e configurazione
- `PARTE-2-DATABASE-SERVIZI.md` - Schema database e servizi
- `PARTE-3-OTTIMIZZAZIONI-CACHE.md` - Cache e ottimizzazioni
- `PARTE-4-FRONTEND-COMPONENTS.md` - Componenti frontend
- `PARTE-5-DEPLOYMENT-DEVOPS.md` - Deployment e DevOps

---

## 🚀 Quick Start

### Per sviluppatori Backend:
1. Leggi `API-DOCUMENTATION.md` per capire tutti gli endpoint
2. Importa la Postman collection per testare
3. Consulta le parti 1-2-3 per dettagli implementativi

### Per sviluppatori Frontend:
1. Consulta `API-DOCUMENTATION.md` per le chiamate API
2. Vedi PARTE-4 per i componenti React
3. Usa la Postman collection per testare le integrazioni

### Per DevOps:
1. Consulta PARTE-5 per deployment
2. Vedi PARTE-1 per configurazioni ambiente

---

## 📝 Come Contribuire alla Documentazione

1. Mantieni la documentazione aggiornata quando modifichi le API
2. Aggiungi esempi per nuovi endpoint
3. Documenta eventuali breaking changes
4. Aggiorna la Postman collection

---

## 🔗 Link Utili

- **Repository GitHub**: [github.com/241luca/gestione-calcio](https://github.com/241luca/gestione-calcio)
- **Backend**: http://localhost:3000
- **Frontend**: http://localhost:5173
- **API Base URL**: http://localhost:3000/api/v1

---

**Ultimo aggiornamento**: 8 Agosto 2024  
**Versione**: 2.0.0
