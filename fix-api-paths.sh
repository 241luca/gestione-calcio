#!/bin/bash

# Script per correggere il doppio /api/v1 in tutti i file JSX

echo "🔧 Correzione doppio /api/v1 in corso..."

# Lista dei file da correggere
FILES=(
  "src/pages/DashboardPage.jsx"
  "src/pages/StaffPage.jsx"
  "src/pages/TeamsPage.jsx"
  "src/pages/SponsorsPage.jsx"
  "src/pages/DocumentsPage.jsx"
  "src/pages/PaymentsPage.jsx"
  "src/pages/CalendarPage.jsx"
  "src/pages/TransportPage.jsx"
  "src/pages/NotificationsPage.jsx"
  "src/pages/ReportsPage.jsx"
  "src/pages/SettingsPage.jsx"
)

# Sostituzioni da fare
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Correzione $file..."
    
    # Sostituisci tutti i pattern errati
    sed -i '' "s|api.get('/api/v1/|api.get('/|g" "$file"
    sed -i '' "s|api.post('/api/v1/|api.post('/|g" "$file"
    sed -i '' "s|api.put('/api/v1/|api.put('/|g" "$file"
    sed -i '' "s|api.delete('/api/v1/|api.delete('/|g" "$file"
    sed -i '' "s|api.patch('/api/v1/|api.patch('/|g" "$file"
  fi
done

echo "✅ Correzione completata!"
