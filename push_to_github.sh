#!/bin/bash

# Script per fare push sicuro su GitHub
# Esegui questo script nel Terminal

cd /Users/lucamambelli/Desktop/Gestione-Calcio

echo "🔧 Configurazione Git..."
git config user.name "241luca"
git config user.email "lucamambelli@lmtecnologie.it"

echo "📝 Creazione nuovo commit..."
git add -A
git commit -m "Sistema completo gestione società calcio - Versione sicura"

echo "🔐 Per fare il push ti servirà:"
echo "1. Username: 241luca"
echo "2. Password: Vai su GitHub → Settings → Developer settings → Personal access tokens"
echo "   Genera un nuovo token con permessi 'repo'"
echo ""
echo "📤 Tentativo di push..."
git push -u origin main

echo "✅ Processo completato!"
