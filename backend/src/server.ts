import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { createServer } from 'http';
import SocketService from './services/socket.service';
import SchedulerService from './services/scheduler.service';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware';
import { ResponseFormatter } from './utils/responseFormatter';

// Import routes
import authRoutes from './routes/auth.routes';
import athleteRoutes from './routes/athlete.routes';
import notificationRoutes from './routes/notification.routes';
import notificationTemplatesRoutes from './routes/notification-templates.routes';
import documentRoutes from './routes/document.routes';
import paymentRoutes from './routes/payment.routes';
import teamsRoutes from './routes/teams.routes';
import transportRoutes from './routes/transport.routes';
import matchRoutes from './routes/match.routes';
import competitionRoutes from './routes/competitions.routes';
import staffRoutes from './routes/staff.routes';
import sponsorRoutes from './routes/sponsors.routes';
import venueRoutes from './routes/venues.routes';
import reportRoutes from './routes/reports.routes';
import schedulerRoutes from './routes/scheduler.routes';
import settingsRoutes from './routes/settings.routes';
import trainingRoutes from './routes/training.routes';

// Carica le variabili d'ambiente
dotenv.config();

// Inizializza Prisma
const prisma = new PrismaClient();

// Crea l'applicazione Express
const app: Application = express();
const PORT = process.env.PORT || 3000;

// Crea server HTTP per Socket.io
const httpServer = createServer(app);

// Inizializza Socket.io
SocketService.initialize(httpServer);

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
    message: 'Soccer Management System API',
    version: '2.0.0',
    timestamp: new Date(),
    features: {
      auth: true,
      athletes: true,
      documents: true,
      payments: true,
      notifications: true,
      transport: false,
      realtime: true,
      socketio: 'enabled'
    }
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/athletes', athleteRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/notification-templates', notificationTemplatesRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/teams', teamsRoutes);
app.use('/api/v1/transport', transportRoutes);
app.use('/api/v1/matches', matchRoutes);
app.use('/api/v1/competitions', competitionRoutes);
app.use('/api/v1/staff', staffRoutes);
app.use('/api/v1/sponsors', sponsorRoutes);
app.use('/api/v1/venues', venueRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/scheduler', schedulerRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/training-sessions', trainingRoutes);

// Route health check
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Verifica connessione database
    await prisma.$queryRaw`SELECT 1`;
    
    // Ottieni info utenti online
    const onlineUsers = SocketService.getOnlineUsersCount();
    
    res.json({
      success: true,
      status: 'healthy',
      database: 'connected',
      socketio: 'active',
      onlineUsers: onlineUsers,
      services: {
        auth: 'active',
        athletes: 'active',
        documents: 'active',
        payments: 'active',
        notifications: 'active',
        transport: 'active'
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

// Route per test Socket.io
app.get('/api/v1/socket/test', (req: Request, res: Response) => {
  // Invia un messaggio di test a tutti gli utenti connessi
  SocketService.broadcast('test:message', {
    message: 'Test broadcast da server',
    timestamp: new Date()
  });
  
  res.json({
    success: true,
    message: 'Messaggio di test inviato a tutti gli utenti connessi',
    onlineUsers: SocketService.getOnlineUsersCount()
  });
});

// Error handlers - DEVONO essere gli ultimi middleware!
app.use(notFoundHandler);  // Gestisce 404
app.use(errorHandler);     // Gestisce tutti gli errori

// Avvia il server
async function startServer() {
  try {
    // Connetti al database
    await prisma.$connect();
    console.log('✅ Database connesso');
    
    // Avvia il server HTTP con Socket.io
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server avviato su http://localhost:${PORT}`);
      console.log(`🔌 Socket.io attivo su ws://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🧪 Test Socket.io: http://localhost:${PORT}/api/v1/socket/test`);
      
      // Inizializza lo scheduler per notifiche automatiche
      SchedulerService.initialize();
      
      console.log('\n✅ SERVIZI ATTIVI:');
      console.log('  ✅ Autenticazione');
      console.log('  ✅ Atleti');
      console.log('  ✅ Documenti');
      console.log('  ✅ Pagamenti');
      console.log('  ✅ Notifiche');
      console.log('  ✅ Socket.io (Real-time)');
      console.log('  ✅ Trasporti');
      console.log('  ✅ Scheduler (Notifiche automatiche)');
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
