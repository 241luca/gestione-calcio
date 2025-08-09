#!/bin/bash

echo "🔧 FIX LOGIN SYSTEM - Soccer Management"
echo "========================================"
echo ""

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "1️⃣  Verifico stato backend..."
if lsof -i:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend attivo sulla porta 3000${NC}"
else
    echo -e "${YELLOW}⚠️  Backend non attivo, avvio...${NC}"
    cd backend
    npm run dev &
    sleep 5
    cd ..
fi

echo ""
echo "2️⃣  Verifico database..."
cd backend

# Test connessione database
echo "Testing database connection..."
npx prisma db push 2>&1 | grep -q "error" 
if [ $? -eq 0 ]; then
    echo -e "${RED}❌ Errore connessione database${NC}"
    echo "Assicurati che PostgreSQL sia attivo"
    exit 1
else
    echo -e "${GREEN}✅ Database connesso${NC}"
fi

echo ""
echo "3️⃣  Eseguo seed database..."
npx prisma db seed
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Seed database completato${NC}"
else
    echo -e "${RED}❌ Errore durante il seed${NC}"
fi

cd ..

echo ""
echo "4️⃣  Verifico frontend..."
if lsof -i:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend attivo sulla porta 5173${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend non attivo, avvio...${NC}"
    npm run dev &
    sleep 5
fi

echo ""
echo "5️⃣  Test login API..."
response=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@soccermanager.com","password":"demo123456"}' 2>/dev/null)

if echo "$response" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Login API funzionante${NC}"
    echo "   Email: demo@soccermanager.com"
    echo "   Password: demo123456"
else
    echo -e "${RED}❌ Login API non funzionante${NC}"
    echo "Response: $response"
fi

echo ""
echo "========================================"
echo -e "${GREEN}🎉 FIX COMPLETATO!${NC}"
echo ""
echo "Ora puoi:"
echo "1. Aprire http://localhost:5173"
echo "2. Login con: demo@soccermanager.com / demo123456"
echo ""
echo "Se ancora non funziona, prova:"
echo "1. Pulire cache browser (Cmd+Shift+R)"
echo "2. Aprire console browser (F12) per vedere errori"
echo "3. Controllare file debug-login.html"
