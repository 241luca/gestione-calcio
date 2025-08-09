#!/bin/bash

echo "🔐 TEST LOGIN FINALE - Soccer Management"
echo "========================================"
echo ""

# Colori
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Credenziali
EMAIL="demo@soccermanager.com"
PASSWORD="demo123456"

echo "📋 Credenziali di test:"
echo "   Email: $EMAIL"
echo "   Password: $PASSWORD"
echo ""

# Test 1: Backend health
echo "1️⃣  Test Backend Health..."
health_response=$(curl -s http://localhost:3000/api/health)
if echo "$health_response" | grep -q '"status":"healthy"'; then
    echo -e "${GREEN}✅ Backend funzionante${NC}"
else
    echo -e "${RED}❌ Backend non raggiungibile${NC}"
    echo "   Avvia con: cd backend && npm run dev"
    exit 1
fi

echo ""
echo "2️⃣  Test Login API..."

# Fai il login
login_response=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

# Controlla se il login è riuscito
if echo "$login_response" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ LOGIN FUNZIONANTE!${NC}"
    
    # Estrai il token
    token=$(echo "$login_response" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
    org_id=$(echo "$login_response" | sed -n 's/.*"organizationId":"\([^"]*\)".*/\1/p')
    
    if [ ! -z "$token" ]; then
        echo ""
        echo "   Token: ${token:0:50}..."
        echo "   Organization ID: $org_id"
        
        echo ""
        echo "3️⃣  Test Endpoint Protetto (Athletes)..."
        
        # Test endpoint protetto
        athletes_response=$(curl -s -X GET http://localhost:3000/api/v1/athletes \
          -H "Authorization: Bearer $token" \
          -H "X-Organization-ID: $org_id")
        
        if echo "$athletes_response" | grep -q '"success":true'; then
            echo -e "${GREEN}✅ Autenticazione funzionante${NC}"
        else
            echo -e "${YELLOW}⚠️  Endpoint athletes vuoto o errore${NC}"
            echo "   Response: ${athletes_response:0:100}..."
        fi
    fi
    
    echo ""
    echo "========================================"
    echo -e "${GREEN}🎉 SISTEMA PRONTO!${NC}"
    echo ""
    echo "Ora puoi:"
    echo "1. Andare su http://localhost:5173"
    echo "2. Fare login con:"
    echo "   Email: $EMAIL"
    echo "   Password: $PASSWORD"
    
else
    echo -e "${RED}❌ LOGIN FALLITO${NC}"
    echo ""
    echo "Response:"
    echo "$login_response" | python3 -m json.tool 2>/dev/null || echo "$login_response"
    echo ""
    echo "Possibili soluzioni:"
    echo "1. Esegui: cd backend && node fix-demo-user-v2.js"
    echo "2. Verifica che il backend sia attivo"
    echo "3. Controlla i log del backend per errori"
fi

echo ""
echo "========================================"
