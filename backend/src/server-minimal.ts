import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Import solo i routes che funzionano sicuramente
import authRoutes from './routes/auth.routes';
import paymentRoutes from './routes/payment.routes';

// Carica le variabili d'ambiente
dotenv.config();

// Inizializza Prisma
const prisma = new PrismaClient();

// Crea l'applicazione Express
const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve file statici dalla directory uploads
app.use('/uploads', express.static('uploads'));

// Route di test
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Soccer Management System API - Minimal Version',
    version: '1.0.0',
    timestamp: new Date(),
    features: {
      auth: true,
      payments: true,
      athletes: false,
      documents: false,
      notifications: false,
      transport: false
    }
  });
});

// API Routes FUNZIONANTI
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/payments', paymentRoutes);

// Route temporanee disabilitate - restituiscono messaggio informativo
app.use('/api/v1/athletes', (req: Request, res: Response) => {
  res.status(503).json({
    success: false,
    message: 'Servizio atleti temporaneamente disabilitato per manutenzione'
  });
});

app.use('/api/v1/documents', (req: Request, res: Response) => {
  res.status(503).json({
    success: false,
    message: 'Servizio documenti temporaneamente disabilitato per manutenzione'
  });
});

app.use('/api/v1/notifications', (req: Request, res: Response) => {
  res.status(503).json({
    success: false,
    message: 'Servizio notifiche temporaneamente disabilitato per manutenzione'
  });
});

// Route health check
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Verifica connessione database
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      success: true,
      status: 'healthy',
      database: 'connected',
      mode: 'minimal',
      services: {
        auth: 'active',
        payments: 'active',
        athletes: 'disabled',
        documents: 'disabled',
        notifications: 'disabled',
        transport: 'disabled'
      },
      timestamp: new Date()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Error handler globale
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  
  res.status(500).json({
    success: false,
    error: {
      message: err.message || 'Errore interno del server',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Endpoint non trovato'
    }
  });
});

// Avvia il server
async function startServer() {
  try {
    // Connetti al database
    await prisma.$connect();
    console.log('✅ Database connesso');
    
    // Avvia il server
    app.listen(PORT, () => {
      console.log(`🚀 Server avviato in modalità MINIMAL su http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log('\n⚠️  SERVIZI ATTIVI:');
      console.log('  ✅ Auth');
      console.log('  ✅ Payments');
      console.log('\n⚠️  SERVIZI DISABILITATI:');
      console.log('  ❌ Athletes');
      console.log('  ❌ Documents');
      console.log('  ❌ Notifications');
      console.log('  ❌ Transport');
    });
  } catch (error) {
    console.error('❌ Errore avvio server:', error);
    process.exit(1);
  }
}

// Gestione shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Arresto server...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Arresto server...');
  await prisma.$disconnect();
  process.exit(0);
});

// Avvia il server
startServer();

export default app;
