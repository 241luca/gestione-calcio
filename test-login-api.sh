#!/bin/bash

echo "🧪 TEST DIRETTO LOGIN API"
echo "========================"
echo ""

# Test 1: Backend health
echo "1️⃣ Test Backend Health..."
curl -s http://localhost:3000/api/health | python3 -m json.tool
echo ""

# Test 2: Login diretto
echo "2️⃣ Test Login API..."
echo "Credenziali: demo@soccermanager.com / demo123456"
echo ""

response=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@soccermanager.com",
    "password": "demo123456"
  }')

echo "Response:"
echo "$response" | python3 -m json.tool

# Controlla se il login è riuscito
if echo "$response" | grep -q '"success":true'; then
    echo ""
    echo "✅ LOGIN FUNZIONANTE!"
    
    # Estrai il token
    token=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)
    
    if [ ! -z "$token" ]; then
        echo ""
        echo "3️⃣ Test con Token..."
        echo "Token: ${token:0:50}..."
        
        # Test endpoint protetto
        curl -s -X GET http://localhost:3000/api/v1/athletes \
          -H "Authorization: Bearer $token" \
          -H "X-Organization-ID: org-1" | python3 -m json.tool | head -20
    fi
else
    echo ""
    echo "❌ LOGIN FALLITO"
    echo ""
    echo "Possibili cause:"
    echo "1. L'utente demo non esiste nel database"
    echo "2. La password non è corretta"
    echo "3. Il backend non è attivo"
    echo ""
    echo "Esegui questo comando per sistemare:"
    echo "cd backend && node check-fix-users.js"
fi
