# 🎯 COMPONENTE UNIVERSALE PER AZIONI CRUD + EXPORT
## UniversalActions - Componente Riutilizzabile per Tutte le Pagine

**Data:** 8 Agosto 2025  
**Creato da:** Claude Assistant per Luca Mambelli

---

## 📋 PANORAMICA

Ho creato un **componente universale** che gestisce TUTTE le operazioni necessarie in ogni pagina:

### ✅ **OPERAZIONI CRUD**
- ➕ **Aggiungi** nuovo elemento
- ✏️ **Modifica** elemento esistente  
- 🗑️ **Elimina** uno o più elementi
- 👁️ **Visualizza** dettagli (opzionale)

### 📤 **OPERAZIONI EXPORT**
- 🖨️ **Stampa** diretta browser
- 📄 **PDF** con formattazione professionale
- 📊 **Excel** (.xlsx) per analisi dati
- 📋 **CSV** per importazione in altri sistemi

### 🔗 **OPERAZIONI CONDIVISIONE**
- ✉️ **Email** con allegati
- 🔗 **Link** condivisibile (copia negli appunti)
- 💬 **WhatsApp** condivisione rapida

---

## 🚀 COME USARE IL COMPONENTE

### 1. **Import del componente**
```javascript
import UniversalActions from '../components/common/UniversalActions';
```

### 2. **Uso Base (Toolbar)**
```javascript
<UniversalActions
  entityName="atleta"
  entityNamePlural="atleti"
  selectedItems={selectedAthletes}
  allItems={allAthletes}
  onAdd={() => setShowAddModal(true)}
  onEdit={(athlete) => handleEdit(athlete)}
  onDelete={(athletes) => handleDelete(athletes)}
  exportConfig={{
    fields: [
      { key: 'firstName', label: 'Nome' },
      { key: 'lastName', label: 'Cognome' },
      { key: 'email', label: 'Email' }
    ],
    filename: 'atleti',
    title: 'Report Atleti'
  }}
  variant="toolbar"
/>
```

### 3. **Uso in Tabella (Menu Dropdown)**
```javascript
// Per ogni riga della tabella
<UniversalActions
  entityName="atleta"
  selectedItems={[athlete]}
  onEdit={() => handleEdit(athlete)}
  onDelete={() => handleDelete([athlete])}
  showAdd={false}  // Non mostrare "Aggiungi" per singola riga
  variant="dropdown"  // Menu con tre puntini
/>
```

---

## 📊 PROPS DISPONIBILI

| Prop | Tipo | Default | Descrizione |
|------|------|---------|-------------|
| **entityName** | string | 'elemento' | Nome singolare (es. 'atleta') |
| **entityNamePlural** | string | 'elementi' | Nome plurale (es. 'atleti') |
| **selectedItems** | array | [] | Elementi selezionati |
| **allItems** | array | [] | Tutti gli elementi (per export completo) |
| **onAdd** | function | null | Callback per aggiungere |
| **onEdit** | function | null | Callback per modificare |
| **onDelete** | function | null | Callback per eliminare |
| **showAdd** | boolean | true | Mostra bottone aggiungi |
| **showEdit** | boolean | true | Mostra bottone modifica |
| **showDelete** | boolean | true | Mostra bottone elimina |
| **showExport** | boolean | true | Mostra opzioni export |
| **showShare** | boolean | true | Mostra opzioni condivisione |
| **exportConfig** | object | {} | Configurazione export |
| **variant** | string | 'toolbar' | Stile: 'toolbar' o 'dropdown' |

---

## 🎨 VARIANTI DISPONIBILI

### 1. **TOOLBAR** (Barra orizzontale)
```javascript
variant="toolbar"
```
Mostra tutti i bottoni in una barra orizzontale. Ideale per header di pagina.

### 2. **DROPDOWN** (Menu con tre puntini)
```javascript
variant="dropdown"
```
Menu compatto con icona ⋮. Ideale per azioni su singola riga in tabella.

---

## 📤 CONFIGURAZIONE EXPORT

```javascript
exportConfig={{
  // Campi da esportare
  fields: [
    { key: 'firstName', label: 'Nome' },
    { key: 'lastName', label: 'Cognome' },
    { key: 'birthDate', label: 'Data Nascita' },
    { key: 'team', label: 'Squadra' }
  ],
  
  // Nome file (senza estensione)
  filename: 'atleti_report',
  
  // Titolo del report
  title: 'Report Atleti - Stagione 2024/2025'
}}
```

---

## 💡 ESEMPI DI IMPLEMENTAZIONE

### PAGINA ATLETI
```javascript
<UniversalActions
  entityName="atleta"
  entityNamePlural="atleti"
  selectedItems={selectedAthletes}
  allItems={athletes}
  onAdd={handleAddAthlete}
  onEdit={handleEditAthlete}
  onDelete={handleDeleteAthletes}
  exportConfig={athleteExportConfig}
/>
```

### PAGINA DOCUMENTI
```javascript
<UniversalActions
  entityName="documento"
  entityNamePlural="documenti"
  selectedItems={selectedDocs}
  allItems={documents}
  onAdd={handleUploadDocument}
  onEdit={handleEditDocument}
  onDelete={handleDeleteDocuments}
  exportConfig={documentExportConfig}
/>
```

### PAGINA PAGAMENTI
```javascript
<UniversalActions
  entityName="pagamento"
  entityNamePlural="pagamenti"
  selectedItems={selectedPayments}
  allItems={payments}
  onAdd={handleAddPayment}
  onEdit={handleEditPayment}
  onDelete={handleDeletePayments}
  showDelete={false}  // Non permettere eliminazione pagamenti
  exportConfig={paymentExportConfig}
/>
```

---

## 🔧 FUNZIONALITÀ AUTOMATICHE

### 1. **Selezione Intelligente**
- Se nessun elemento selezionato → export/stampa TUTTI
- Se elementi selezionati → export/stampa SOLO selezionati
- Indicatore visivo del numero di elementi selezionati

### 2. **Bottoni Contestuali**
- "Modifica" appare solo con 1 elemento selezionato
- "Elimina" mostra il conteggio se multipli selezionati
- Conferma automatica prima di eliminare

### 3. **Export Formattati**
- PDF con intestazione e data
- Excel con colonne formattate
- CSV pronto per import
- Stampa con layout ottimizzato

### 4. **Feedback Utente**
- Toast notifications per ogni azione
- Loading state durante export
- Indicatori visivi di successo/errore

---

## ✅ VANTAGGI

1. **CODICE RIUTILIZZABILE**
   - Un solo componente per tutte le pagine
   - Niente duplicazione di codice
   - Manutenzione centralizzata

2. **CONSISTENZA UI**
   - Stessa esperienza utente ovunque
   - Stessi bottoni, stessi colori
   - Stesse icone e comportamenti

3. **FUNZIONALITÀ COMPLETE**
   - Tutte le operazioni in un posto solo
   - Export professionali automatici
   - Condivisione integrata

4. **FACILE DA IMPLEMENTARE**
   - Aggiungi il componente
   - Passa le props necessarie
   - Funziona subito!

---

## 📦 FILE CREATI

1. **Componente principale:**
   `/src/components/common/UniversalActions.jsx`

2. **Esempio di utilizzo:**
   `/Docs/ESEMPIO_USO_UNIVERSAL_ACTIONS.jsx`

3. **Questa documentazione:**
   `/Docs/COMPONENTE_UNIVERSAL_ACTIONS.md`

---

## 🚀 PROSSIMI PASSI

### Per implementare in ogni pagina:

1. **Import** del componente
2. **Definisci** le callback per CRUD
3. **Configura** i campi export
4. **Aggiungi** il componente alla pagina

### Pagine da aggiornare:
- ✅ Atleti
- ⬜ Staff
- ⬜ Squadre
- ⬜ Competizioni
- ⬜ Documenti
- ⬜ Pagamenti
- ⬜ Partite
- ⬜ Sponsor
- ⬜ Trasporti

---

## 💬 NOTE PER LUCA

**Questo componente ti fa risparmiare MOLTO tempo!**

Invece di creare bottoni separati per ogni operazione in ogni pagina, usi questo componente che fa tutto automaticamente.

**Esempio pratico:**
- Prima: 50+ righe di codice per i bottoni in ogni pagina
- Ora: 10 righe per aggiungere il componente

**Totale risparmio:** ~500 righe di codice per 10 pagine!

---

**Componente creato da:** Claude Assistant  
**Data:** 8 Agosto 2025  
**Pronto per:** Implementazione immediata
