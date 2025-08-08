#!/bin/bash

echo "🔧 Setup Database per Soccer Management System"
echo "============================================="

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funzione per verificare se un comando esiste
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 1. Verifica PostgreSQL
echo -e "\n${YELLOW}1. Verifica PostgreSQL...${NC}"
if command_exists psql; then
    echo -e "${GREEN}✓ PostgreSQL è installato${NC}"
    psql --version
else
    echo -e "${RED}✗ PostgreSQL non trovato!${NC}"
    echo "Installa PostgreSQL con: brew install postgresql@14"
    exit 1
fi

# 2. Avvia PostgreSQL
echo -e "\n${YELLOW}2. Avvio PostgreSQL...${NC}"
if brew services list | grep -q "postgresql.*started"; then
    echo -e "${GREEN}✓ PostgreSQL è già in esecuzione${NC}"
else
    echo "Avvio PostgreSQL..."
    brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ PostgreSQL avviato${NC}"
    else
        echo -e "${YELLOW}Provo ad avviare manualmente...${NC}"
        pg_ctl -D /usr/local/var/postgres start 2>/dev/null || \
        pg_ctl -D /usr/local/var/postgresql@14 start 2>/dev