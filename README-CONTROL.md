# 🎮 PANNELLO DI CONTROLLO - SOCCER MANAGEMENT SYSTEM

## 📌 Guida Rapida all'Uso

### 🚀 Come Iniziare

#### Opzione 1: Usa il Pannello HTML (Consigliato)
1. **Apri il pannello di controllo:**
   - Doppio click su `control-panel.html`
   - Oppure esegui: `open control-panel.html`

2. **Usa i pulsanti per gestire il progetto:**
   - 🟢 **Pulsanti Verdi** = Avvia servizi
   - 🔴 **Pulsanti Rossi** = Ferma servizi
   - 🟡 **Pulsanti Gialli** = Operazioni di manutenzione
   - 🔵 **Pulsanti Blu** = Informazioni e utility

#### Opzione 2: Usa lo Script da Terminale
```bash
# Rendi eseguibile lo script (solo la prima volta)
chmod +x soccer-manager.sh

# Esempi di utilizzo:
./soccer-manager.sh start-all        # Avvia tutto
./soccer-manager.sh stop-all         # Ferma tutto
./soccer-manager.sh db-seed          # Popola database
./soccer-manager.sh help             # Mostra tutti i comandi
```

---

## 🎯 Operazioni Comuni

### Avvio Rapido del Progetto
1. Clicca **"Avvia Backend"** (pulsante verde nel pannello Backend)
2. Attendi 3 secondi
3. Clicca **"Avvia Frontend"** (pulsante verde nel pannello Frontend)
4. Il browser si aprirà automaticamente su http://localhost:5173

### Se una Porta è Bloccata
- **Porta 3000 bloccata?** → Clicca "Kill Porta 3000"
- **Porta 5173 bloccata?** → Clicca "Kill Porta 5173"

### Troppe Finestre Terminal Aperte?
- Clicca **"Chiudi Tutti i Terminal"** (pulsante rosso nel pannello Utilità)
- Questo chiuderà TUTTE le finestre Terminal aperte

### Dopo un Pull da Git
1. Clicca **"Git Pull"** per aggiornare il codice
2. Clicca **"Installa Dipendenze"** se ci sono nuove librerie
3. Clicca **"Esegui Migrazioni"** se ci sono modifiche al database

### Reset Completo (se qualcosa non funziona)
1. **"Stop All"** - Ferma tutti i servizi
2. **"Kill Porta 3000"** e **"Kill Porta 5173"** - Libera le porte
3. **"Reset Database"** - Pulisce il database
4. **"Popola Database"** - Reinserisce i dati demo
5. **"Avvia Backend"** e poi **"Avvia Frontend"**

---

## 🔑 Credenziali Demo

Dopo aver popolato il database, puoi accedere con:
- **Email:** demo@soccermanager.com
- **Password:** demo123456

---

## ⌨️ Scorciatoie da Tastiera

Nel pannello HTML sono disponibili queste scorciatoie:
- **Cmd + K** = Pulisci terminal
- **Cmd + S** = Avvia tutto
- **Cmd + Q** = Ferma tutto
- **Cmd + R** = Riavvia backend

---

## 📁 Struttura File di Controllo

```
/Gestione-Calcio/
├── control-panel.html       # Pannello di controllo visuale
├── soccer-manager.sh        # Script bash per operazioni
├── open-control-panel.scpt  # AppleScript per aprire il pannello
└── README-CONTROL.md        # Questa guida
```

---

## 🆘 Troubleshooting

### Il Backend non si avvia
```bash
# 1. Controlla se la porta è occupata
lsof -i:3000

# 2. Killa il processo
./soccer-manager.sh kill-3000

# 3. Riavvia
./soccer-manager.sh start-backend
```

### Il Frontend non si avvia
```bash
# 1. Controlla se la porta è occupata
lsof -i:5173

# 2. Killa il processo
./soccer-manager.sh kill-5173

# 3. Riavvia
./soccer-manager.sh start-frontend
```

### Errori di Database
```bash
# Reset completo e ripopolamento
./soccer-manager.sh db-reset
./soccer-manager.sh db-seed
```

### Errori di Dipendenze
```bash
# Clean install di tutto
./soccer-manager.sh clean-install
```

---

## 💡 Tips & Tricks

1. **Tieni sempre aperto il pannello** durante lo sviluppo
2. **Usa il Terminal Output** nel pannello per vedere cosa succede
3. **Fai backup regolari** con il pulsante "Backup Database"
4. **Committa spesso** le tue modifiche con i pulsanti Git
5. **Se qualcosa va storto**, usa "Stop All" e riparti

---

## 🚨 Comandi di Emergenza

Se tutto sembra bloccato:
```bash
# Kill TUTTO
pkill -f node
pkill -f vite
lsof -ti:3000 | xargs kill -9
lsof -ti:5173 | xargs kill -9

# Riavvia da zero
./soccer-manager.sh start-all
```

---

## 📞 Supporto

Se hai problemi:
1. Controlla i log nel Terminal Output
2. Usa "System Info" per verificare le versioni
3. Prova un "Clean Install"
4. Fai un backup prima di operazioni rischiose

---

**Buon sviluppo!** 🚀⚽
