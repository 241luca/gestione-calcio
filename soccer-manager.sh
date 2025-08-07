#!/bin/bash

# Script di utilità per Soccer Management System
# Questo script può essere chiamato con diversi parametri per eseguire operazioni comuni

PROJECT_DIR="/Users/lucamambelli/Desktop/Gestione-Calcio"
BACKEND_DIR="$PROJECT_DIR/backend"

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funzione per stampare con colori
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Funzione principale
case "$1" in
    # Backend commands
    start-backend)
        print_info "Avvio backend..."
        cd "$BACKEND_DIR" && npm run dev
        ;;
    
    stop-backend)
        print_info "Arresto backend..."
        pkill -f "node.*server"
        print_success "Backend arrestato"
        ;;
    
    restart-backend)
        print_info "Riavvio backend..."
        pkill -f "node.*server"
        sleep 2
        cd "$BACKEND_DIR" && npm run dev
        ;;
    
    kill-3000)
        print_info "Terminazione processi su porta 3000..."
        lsof -ti:3000 | xargs kill -9 2>/dev/null
        print_success "Porta 3000 liberata"
        ;;
    
    # Frontend commands
    start-frontend)
        print_info "Avvio frontend..."
        cd "$PROJECT_DIR" && npm run dev
        ;;
    
    stop-frontend)
        print_info "Arresto frontend..."
        pkill -f "vite"
        print_success "Frontend arrestato"
        ;;
    
    build-frontend)
        print_info "Build frontend..."
        cd "$PROJECT_DIR" && npm run build
        ;;
    
    kill-5173)
        print_info "Terminazione processi su porta 5173..."
        lsof -ti:5173 | xargs kill -9 2>/dev/null
        print_success "Porta 5173 liberata"
        ;;
    
    # Database commands
    db-migrate)
        print_info "Esecuzione migrazioni database..."
        cd "$BACKEND_DIR" && npx prisma migrate dev
        ;;
    
    db-seed)
        print_info "Popolamento database..."
        cd "$BACKEND_DIR" && npm run seed
        ;;
    
    db-reset)
        print_info "Reset database..."
        cd "$BACKEND_DIR" && npx prisma migrate reset --force
        ;;
    
    db-studio)
        print_info "Apertura Prisma Studio..."
        cd "$BACKEND_DIR" && npx prisma studio
        ;;
    
    db-backup)
        print_info "Backup database..."
        BACKUP_FILE="$PROJECT_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
        pg_dump -U lucamambelli -d soccer_management > "$BACKUP_FILE"
        print_success "Backup salvato in: $BACKUP_FILE"
        ;;
    
    # Git commands
    git-status)
        cd "$PROJECT_DIR" && git status
        ;;
    
    git-pull)
        print_info "Pull da repository..."
        cd "$PROJECT_DIR" && git pull
        ;;
    
    git-push)
        print_info "Push su repository..."
        cd "$PROJECT_DIR" && git push
        ;;
    
    git-commit-all)
        print_info "Commit di tutte le modifiche..."
        cd "$PROJECT_DIR" && git add -A && git commit -m "Update: $(date +%Y-%m-%d) improvements"
        ;;
    
    # Utility commands
    install-all)
        print_info "Installazione dipendenze..."
        cd "$PROJECT_DIR" && npm install
        cd "$BACKEND_DIR" && npm install
        print_success "Dipendenze installate"
        ;;
    
    clean-install)
        print_info "Clean install..."
        cd "$PROJECT_DIR" && rm -rf node_modules package-lock.json && npm install
        cd "$BACKEND_DIR" && rm -rf node_modules package-lock.json && npm install
        print_success "Clean install completato"
        ;;
    
    start-all)
        print_info "Avvio tutti i servizi..."
        # Avvia backend in background
        cd "$BACKEND_DIR" && npm run dev &
        BACKEND_PID=$!
        sleep 3
        # Avvia frontend
        cd "$PROJECT_DIR" && npm run dev &
        FRONTEND_PID=$!
        print_success "Backend PID: $BACKEND_PID"
        print_success "Frontend PID: $FRONTEND_PID"
        wait
        ;;
    
    stop-all)
        print_info "Arresto tutti i servizi..."
        pkill -f "node.*server"
        pkill -f "vite"
        print_success "Tutti i servizi arrestati"
        ;;
    
    check-ports)
        print_info "Controllo porte..."
        echo "Porta 3000 (Backend):"
        lsof -i:3000 || echo "  Libera"
        echo ""
        echo "Porta 5173 (Frontend):"
        lsof -i:5173 || echo "  Libera"
        echo ""
        echo "Porta 5432 (PostgreSQL):"
        lsof -i:5432 || echo "  PostgreSQL non in esecuzione"
        ;;
    
    system-info)
        print_info "Informazioni sistema:"
        echo "Node.js: $(node -v)"
        echo "NPM: $(npm -v)"
        echo "Git: $(git --version)"
        echo "PostgreSQL: $(psql --version 2>/dev/null || echo 'Non installato')"
        echo "Project Dir: $PROJECT_DIR"
        ;;
    
    logs-backend)
        print_info "Ultimi log backend:"
        if [ -f "$BACKEND_DIR/logs/app.log" ]; then
            tail -n 50 "$BACKEND_DIR/logs/app.log"
        else
            echo "File log non trovato"
        fi
        ;;
    
    help|--help|-h|"")
        echo "⚽ Soccer Management System - Script Utilità"
        echo "==========================================="
        echo ""
        echo "Utilizzo: $0 [comando]"
        echo ""
        echo "Comandi Backend:"
        echo "  start-backend    - Avvia il server backend"
        echo "  stop-backend     - Ferma il server backend"
        echo "  restart-backend  - Riavvia il server backend"
        echo "  kill-3000        - Libera la porta 3000"
        echo "  logs-backend     - Mostra gli ultimi log"
        echo ""
        echo "Comandi Frontend:"
        echo "  start-frontend   - Avvia il server frontend"
        echo "  stop-frontend    - Ferma il server frontend"
        echo "  build-frontend   - Build per produzione"
        echo "  kill-5173        - Libera la porta 5173"
        echo ""
        echo "Comandi Database:"
        echo "  db-migrate       - Esegue le migrazioni"
        echo "  db-seed          - Popola il database"
        echo "  db-reset         - Reset completo database"
        echo "  db-studio        - Apre Prisma Studio"
        echo "  db-backup        - Crea backup del database"
        echo ""
        echo "Comandi Git:"
        echo "  git-status       - Mostra lo stato Git"
        echo "  git-pull         - Pull dal repository"
        echo "  git-push         - Push sul repository"
        echo "  git-commit-all   - Commit di tutte le modifiche"
        echo ""
        echo "Comandi Utilità:"
        echo "  install-all      - Installa tutte le dipendenze"
        echo "  clean-install    - Clean install dipendenze"
        echo "  start-all        - Avvia tutti i servizi"
        echo "  stop-all         - Ferma tutti i servizi"
        echo "  check-ports      - Controlla le porte"
        echo "  system-info      - Informazioni sistema"
        echo "  help             - Mostra questo messaggio"
        ;;
    
    *)
        print_error "Comando non riconosciuto: $1"
        echo "Usa '$0 help' per vedere i comandi disponibili"
        exit 1
        ;;
esac
