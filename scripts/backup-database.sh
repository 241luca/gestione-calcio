#!/bin/bash

# Script di Backup Automatico Database PostgreSQL
# Versione: 1.0.0
# Data: 09/08/2025

# Configurazione
DB_NAME="soccer_management"
DB_USER="lucamambelli"
BACKUP_DIR="/Users/lucamambelli/Desktop/Gestione-Calcio/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"
RETENTION_DAYS=30

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   BACKUP DATABASE SOCCER MANAGEMENT   ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Crea directory backup se non esiste
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${YELLOW}Creazione directory backup...${NC}"
    mkdir -p "$BACKUP_DIR"
fi

# Esegui backup
echo -e "${YELLOW}Esecuzione backup database...${NC}"
pg_dump -U "$DB_USER" -d "$DB_NAME" -f "$BACKUP_FILE" 2>/dev/null

if [ $? -eq 0 ]; then
    # Comprimi il backup
    echo -e "${YELLOW}Compressione backup...${NC}"
    gzip "$BACKUP_FILE"
    BACKUP_FILE="${BACKUP_FILE}.gz"
    
    # Calcola dimensione
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    
    echo -e "${GREEN}✅ Backup completato con successo!${NC}"
    echo -e "   📁 File: ${BACKUP_FILE}"
    echo -e "   📊 Dimensione: ${SIZE}"
    
    # Elimina backup vecchi
    echo -e "${YELLOW}Pulizia backup vecchi (> $RETENTION_DAYS giorni)...${NC}"
    find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    
    # Conta backup totali
    TOTAL_BACKUPS=$(ls -1 "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null | wc -l)
    echo -e "${GREEN}✅ Backup totali disponibili: $TOTAL_BACKUPS${NC}"
    
    # Lista ultimi 5 backup
    echo ""
    echo -e "${GREEN}Ultimi 5 backup:${NC}"
    ls -lht "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null | head -5 | awk '{print "   📄", $9, "("$5")"}'
    
else
    echo -e "${RED}❌ Errore durante il backup!${NC}"
    echo -e "${RED}   Verifica che PostgreSQL sia attivo e le credenziali siano corrette.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   BACKUP COMPLETATO CON SUCCESSO!     ${NC}"
echo -e "${GREEN}========================================${NC}"

# Suggerimento per restore
echo ""
echo -e "${YELLOW}📌 Per ripristinare un backup:${NC}"
echo -e "   gunzip -c $BACKUP_FILE | psql -U $DB_USER -d $DB_NAME"
echo ""

exit 0
