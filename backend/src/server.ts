import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Import routes
import authRoutes from './routes/auth.routes';
import athleteRoutes from './routes/athlete.routes';

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

// Route di test
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Soccer Management System API',
    version: '1.0.0',
    timestamp: new Date()
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/athletes', athleteRoutes);

// Route health check
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Verifica connessione database
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      success: true,
      status: 'healthy',
      database: 'connected',
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
      console.log(`🚀 Server avviato su http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
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
