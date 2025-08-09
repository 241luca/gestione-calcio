#!/bin/bash
# Script completo per trovare tutti i limiti di paginazione nel sistema

echo "🔍 RICERCA COMPLETA DI TUTTI I LIMITI NEL SISTEMA"
echo "=================================================="
echo ""

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funzione per cercare limiti
check_limits() {
    local file=$1
    local name=$2
    
    if [ -f "$file" ]; then
        echo -e "${YELLOW}📁 $name:${NC}"
        grep -n "limit.*=\|take:\|limit:\|pageSize\|perPage" "$file" 2>/dev/null | grep -v "//" | grep -v "*" || echo "  ✅ Nessun limite trovato"
        echo ""
    fi
}

echo -e "${GREEN}=== BACKEND ===${NC}"
echo ""

# Routes
echo -e "${YELLOW}📂 ROUTES:${NC}"
for file in /Users/lucamambelli/Desktop/Gestione-Calcio/backend/src/routes/*.ts; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        check_limits "$file" "routes/$filename"
    fi
done

# Services
echo -e "${YELLOW}📂 SERVICES:${NC}"
for file in /Users/lucamambelli/Desktop/Gestione-Calcio/backend/src/services/*.ts; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        check_limits "$file" "services/$filename"
    fi
done

echo -e "${GREEN}=== FRONTEND ===${NC}"
echo ""

# Frontend services
echo -e "${YELLOW}📂 FRONTEND SERVICES:${NC}"
for file in /Users/lucamambelli/Desktop/Gestione-Calcio/src/services/*.js; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        check_limits "$file" "src/services/$filename"
    fi
done

# Frontend components
echo -e "${YELLOW}📂 FRONTEND COMPONENTS:${NC}"
find /Users/lucamambelli/Desktop/Gestione-Calcio/src/components -name "*.jsx" -o -name "*.js" | while read file; do
    result=$(grep -n "limit.*=\|pageSize\|perPage" "$file" 2>/dev/null | grep -v "//" | grep -v "*")
    if [ ! -z "$result" ]; then
        filename=$(basename "$file")
        echo -e "${YELLOW}$filename:${NC}"
        echo "$result"
        echo ""
    fi
done

echo -e "${GREEN}=== PRISMA QUERIES ===${NC}"
echo ""

# Cerca findMany con take
echo -e "${YELLOW}📂 PRISMA QUERIES CON TAKE:${NC}"
grep -r "findMany.*take\|take:.*[0-9]" /Users/lucamambelli/Desktop/Gestione-Calcio/backend/src --include="*.ts" | head -20

echo ""
echo "=================================================="
echo -e "${GREEN}✅ RICERCA COMPLETATA${NC}"
