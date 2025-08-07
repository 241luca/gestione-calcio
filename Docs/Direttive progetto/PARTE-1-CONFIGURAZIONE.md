# 🚀 GUIDA COMPLETA SOCCER MANAGEMENT SYSTEM - PARTE 1
## Configurazione e Setup Base

**Versione:** 2.0.0  
**Data:** 7 Agosto 2025  

---

## 📋 INDICE PARTE 1

1. [Panoramica del Sistema](#panoramica)
2. [Struttura Directory Completa](#struttura-directory)
3. [Database Schema Completo](#database-schema)
4. [Configurazione Backend](#configurazione-backend)
5. [Configurazione Frontend](#configurazione-frontend)

---

## 🎯 1. PANORAMICA DEL SISTEMA

### Obiettivi Principali
- **Eliminare disallineamenti** tra frontend e backend
- **Standardizzare formati dati** per consistenza totale
- **Completare servizi mancanti** con funzionalità avanzate
- **Risolvere problemi di routing** e navigazione
- **Uniformare tipi di dati** TypeScript/JavaScript
- **Ottimizzare performance** con caching e indicizzazione
- **Garantire sicurezza** con validazioni robuste

### Caratteristiche Chiave
- ✅ Multi-tenant con gestione organizzazioni
- ✅ Sistema autenticazione JWT con refresh token e 2FA
- ✅ Upload documenti sicuro con validazioni
- ✅ Gestione completa atleti, squadre, partite
- ✅ Sistema pagamenti integrato con fatturazione
- ✅ Dashboard analytics con previsioni AI
- ✅ Notifiche real-time (Socket.io)
- ✅ Export report PDF/Excel
- ✅ API mobile-ready con ottimizzazioni
- ✅ Sistema di cache Redis
- ✅ Backup automatici
- ✅ Audit logging completo

---

## 📁 2. STRUTTURA DIRECTORY COMPLETA

```
soccer-management-system/
├── 📁 backend/
│   ├── 📁 src/
│   │   ├── 📁 config/          # Configurazioni database, cache, socket
│   │   ├── 📁 middleware/      # Auth, Rate limit, Multi-tenant, Cache
│   │   ├── 📁 routes/          # Endpoint API REST + Mobile
│   │   ├── 📁 services/        # Logica business + Analytics
│   │   ├── 📁 types/           # TypeScript types
│   │   ├── 📁 utils/           # Utilities, formatters, validators
│   │   ├── 📁 validators/      # Validazioni custom calcio
│   │   ├── 📁 errors/          # Classi errori personalizzate
│   │   ├── 📁 jobs/            # Background jobs (notifiche, report)
│   │   ├── 📁 tests/           # Test unitari e integrazione
│   │   └── 📄 server.ts        # Entry point con Socket.io
│   ├── 📁 prisma/
│   │   ├── 📄 schema.prisma    # Schema database ottimizzato
│   │   ├── 📁 migrations/      # Migration files
│   │   └── 📁 seeds/           # Dati iniziali e demo
│   ├── 📁 uploads/              # File storage temporaneo
│   ├── 📁 logs/                 # Log applicazione
│   ├── 📄 package.json
│   ├── 📄 tsconfig.json
│   ├── 📄 jest.config.js       # Configurazione test
│   └── 📄 .env
├── 📁 src/                      # Frontend React
│   ├── 📁 components/
│   │   ├── 📁 athletes/
│   │   ├── 📁 auth/
│   │   ├── 📁 common/
│   │   ├── 📁 dashboard/
│   │   ├── 📁 documents/
│   │   ├── 📁 matches/
│   │   ├── 📁 notifications/
│   │   ├── 📁 organizations/
│   │   ├── 📁 payments/
│   │   ├── 📁 reports/         # Componenti report
│   │   ├── 📁 settings/
│   │   └── 📁 transport/
│   ├── 📁 hooks/                # Custom React hooks + Socket hooks
│   ├── 📁 services/             # API client + Cache service
│   ├── 📁 utils/                # Utilities + Validators
│   ├── 📁 config/               # Configurazioni
│   ├── 📁 store/                # State management (Zustand/Redux)
│   ├── 📄 App.jsx
│   └── 📄 main.jsx
├── 📁 mobile-api/               # API ottimizzate mobile
├── 📁 docs/                     # Documentazione completa
├── 📁 scripts/                  # Script automazione
├── 📄 package.json
├── 📄 vite.config.js
├── 📄 docker-compose.yml        # Setup Docker
└── 📄 README.md
```

---

## 🔧 3. CONFIGURAZIONE BACKEND

### 3.1 File .env Backend Completo

```env
# Database
DATABASE_URL="postgresql://lucamambelli@localhost:5432/soccer_management"

# JWT
JWT_SECRET=dev-secret-key-2025-soccer-management
JWT_REFRESH_SECRET=dev-refresh-secret-key-2025-soccer-management
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document

# Cache (Redis)
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
CACHE_TTL=600

# Email
EMAIL_ENABLED=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=noreply@soccermanager.com

# Socket.io
SOCKET_ENABLED=true
SOCKET_CORS_ORIGIN=http://localhost:5173

# Cloud Storage (AWS S3)
AWS_ENABLED=false
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=eu-south-1
AWS_S3_BUCKET=soccer-documents

# Logging
LOG_LEVEL=debug
LOG_FILE=./logs/app.log
LOG_MAX_SIZE=10485760
LOG_MAX_FILES=10

# Security
BCRYPT_ROUNDS=10
SESSION_SECRET=session-secret-key-2025
COOKIE_SECURE=false
COOKIE_HTTPONLY=true
COOKIE_SAMESITE=strict

# 2FA
TWO_FACTOR_ENABLED=false
TWO_FACTOR_APP_NAME=SoccerManager
```

### 3.2 TypeScript Configuration Avanzata

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@config/*": ["src/config/*"],
      "@services/*": ["src/services/*"],
      "@middleware/*": ["src/middleware/*"],
      "@utils/*": ["src/utils/*"],
      "@types/*": ["src/types/*"],
      "@validators/*": ["src/validators/*"],
      "@errors/*": ["src/errors/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
```

### 3.3 Package.json Backend

```json
{
  "name": "soccer-management-backend",
  "version": "2.0.0",
  "description": "Backend per sistema gestione società calcio",
  "main": "dist/server.js",
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write src/**/*.ts",
    "migrate": "prisma migrate dev",
    "migrate:deploy": "prisma migrate deploy",
    "seed": "ts-node src/scripts/seed-initial-data.ts",
    "generate": "prisma generate"
  },
  "dependencies": {
    "@prisma/client": "^5.8.0",
    "express": "^4.18.2",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "multer": "^1.4.5-lts.1",
    "socket.io": "^4.6.0",
    "ioredis": "^5.3.2",
    "date-fns": "^3.0.0",
    "zod": "^3.22.4",
    "winston": "^3.11.0",
    "dotenv": "^16.3.1",
    "speakeasy": "^2.0.0",
    "qrcode": "^1.5.3",
    "node-cron": "^3.0.3",
    "pdfkit": "^0.14.0",
    "exceljs": "^4.4.0",
    "nodemailer": "^6.9.7",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/express": "^4.17.21",
    "@types/bcrypt": "^5.0.2",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/cors": "^2.8.17",
    "@types/multer": "^1.4.11",
    "@types/speakeasy": "^2.0.10",
    "@types/qrcode": "^1.5.5",
    "@types/node-cron": "^3.0.11",
    "@types/pdfkit": "^0.13.3",
    "@types/nodemailer": "^6.4.14",
    "@types/uuid": "^9.0.7",
    "typescript": "^5.3.3",
    "ts-node": "^10.9.2",
    "nodemon": "^3.0.2",
    "prisma": "^5.8.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "@types/jest": "^29.5.11",
    "supertest": "^6.3.3",
    "@types/supertest": "^6.0.2",
    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^6.17.0",
    "@typescript-eslint/parser": "^6.17.0",
    "prettier": "^3.1.1"
  }
}
```

---

## 🎨 4. CONFIGURAZIONE FRONTEND

### 4.1 Vite Configuration Avanzata

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
        changeOrigin: true
      }
    }
  },
  define: {
    'process.env': {},
    '__APP_VERSION__': JSON.stringify(process.env.npm_package_version)
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@config': path.resolve(__dirname, './src/config'),
      '@store': path.resolve(__dirname, './src/store')
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts', 'd3'],
          utils: ['date-fns', 'lodash']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
```

### 4.2 Environment Variables Frontend

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_SOCKET_URL=http://localhost:3000
VITE_APP_NAME=Soccer Management System
VITE_APP_VERSION=2.0.0
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_SOCKET=true
VITE_ENABLE_CACHE=true
VITE_CACHE_TTL=300000
```

### 4.3 Package.json Frontend

```json
{
  "name": "soccer-management-frontend",
  "version": "2.0.0",
  "description": "Frontend per sistema gestione società calcio",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src/**/*.{js,jsx}",
    "format": "prettier --write src/**/*.{js,jsx,css}"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "axios": "^1.6.5",
    "socket.io-client": "^4.6.0",
    "zustand": "^4.4.7",
    "react-query": "^3.39.3",
    "react-hook-form": "^7.48.2",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.4",
    "date-fns": "^3.0.0",
    "lodash": "^4.17.21",
    "recharts": "^2.10.3",
    "react-hot-toast": "^2.4.1",
    "react-modal": "^3.16.1",
    "react-select": "^5.8.0",
    "react-datepicker": "^4.25.0",
    "react-dropzone": "^14.2.3",
    "react-table": "^7.8.0",
    "react-icons": "^5.0.1",
    "@headlessui/react": "^1.7.17",
    "@heroicons/react": "^2.1.1",
    "classnames": "^2.5.1",
    "tailwindcss": "^3.4.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.46",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.10",
    "vitest": "^1.1.3",
    "@vitest/ui": "^1.1.3",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.2.0",
    "@testing-library/user-event": "^14.5.2",
    "jsdom": "^23.2.0",
    "eslint": "^8.56.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "prettier": "^3.1.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.33"
  }
}
```

### 4.4 Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          700: '#15803d',
        },
        warning: {
          50: '#fefce8',
          500: '#eab308',
          700: '#a16207',
        },
        danger: {
          50: '#fef2f2',
          500: '#ef4444',
          700: '#b91c1c',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
}
```
