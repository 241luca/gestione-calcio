# 📝 ISTRUZIONI PER CARICARE SU GITHUB

Se il push automatico non funziona, segui questi passi manuali:

## Opzione 1: Usando il Terminal

1. Apri il Terminal
2. Vai nella cartella del progetto:
```bash
cd /Users/lucamambelli/Desktop/Gestione-Calcio
```

3. Se non è già un repository git:
```bash
git init
```

4. Aggiungi il remote di GitHub:
```bash
git remote add origin https://github.com/241luca/gestione-calcio.git
```

5. Configura le tue credenziali:
```bash
git config user.name "241luca"
git config user.email "lucamambelli@lmtecnologie.it"
```

6. Aggiungi tutti i file:
```bash
git add -A
```

7. Crea il commit:
```bash
git commit -m "Sistema completo di gestione società calcio"
```

8. Fai il push:
```bash
git push origin main
```

## Opzione 2: Crea prima il repository su GitHub

1. Vai su https://github.com
2. Accedi con:
   - Username: 241luca
   - Password: 241-Mambo

3. Clicca sul + in alto a destra
4. Seleziona "New repository"
5. Nome: gestione-calcio
6. Descrizione: Sistema gestione società di calcio
7. Lascia "Public"
8. NON inizializzare con README
9. Clicca "Create repository"

10. Poi nel Terminal:
```bash
cd /Users/lucamambelli/Desktop/Gestione-Calcio
git init
git add -A
git commit -m "Prima versione completa"
git branch -M main
git remote add origin https://github.com/241luca/gestione-calcio.git
git push -u origin main
```

Quando chiede le credenziali:
- Username: 241luca
- Password: [USA UN NUOVO TOKEN - vedi sotto come generarlo]

## Opzione 3: Usa GitHub Desktop (più semplice)

1. Scarica GitHub Desktop da: https://desktop.github.com
2. Installalo e accedi con le tue credenziali
3. Clicca "Add" → "Add Existing Repository"
4. Seleziona la cartella: /Users/lucamambelli/Desktop/Gestione-Calcio
5. Clicca "Publish repository"

## Se ancora non funziona:

Il token potrebbe essere scaduto. In questo caso:
1. Vai su GitHub.com → Settings → Developer settings → Personal access tokens
2. Genera un nuovo token con permessi "repo"
3. Usa il nuovo token al posto della password

---

**IMPORTANTE**: Una volta caricato su GitHub, il tuo codice sarà salvato online e potrai sempre recuperarlo anche se succede qualcosa al computer!
