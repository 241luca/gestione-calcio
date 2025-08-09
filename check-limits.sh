#!/bin/bash
# Script per verificare tutti i limiti nel codice

echo "🔍 VERIFICA LIMITI NEL CODICE"
echo "================================"

echo -e "\n📄 DOCUMENTI:"
echo "Routes:"
grep -n "limit = " /Users/lucamambelli/Desktop/Gestione-Calcio/backend/src/routes/document.routes.ts | grep -v "//"
echo "Service:"
grep -n "limit = " /Users/lucamambelli/Desktop/Gestione-Calcio/backend/src/services/document.service.ts | grep -v "//"

echo -e "\n💰 PAGAMENTI:"
echo "Routes:"
grep -n "limit = " /Users/lucamambelli/Desktop/Gestione-Calcio/backend/src/routes/payment.routes.ts | grep -v "//"
echo "Service:"
grep -n "limit = " /Users/lucamambelli/Desktop/Gestione-Calcio/backend/src/services/payment.service.ts | grep -v "//" || echo "Nessun limite trovato nel service"

echo -e "\n⚽ ATLETI:"
echo "Routes:"
grep -n "limit = " /Users/lucamambelli/Desktop/Gestione-Calcio/backend/src/routes/athlete.routes.ts | grep -v "//"

echo -e "\n✅ VERIFICA COMPLETATA"
