// backend/src/services/socket.service.ts
import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

/**
 * Servizio per gestire le connessioni Socket.io
 * Permette di inviare notifiche in tempo reale agli utenti
 */
export class SocketService {
  private io: Server | null = null;
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> socketIds
  private static instance: SocketService;

  // Singleton pattern per avere una sola istanza
  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  /**
   * Inizializza il server Socket.io
   */
  initialize(server: HTTPServer) {
    console.log('🔌 Inizializzazione Socket.io...');
    
    this.io = new Server(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    // Middleware per autenticazione
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Token mancante'));
        }

        // Verifica il JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        
        // Salva i dati utente nel socket
        socket.data.userId = decoded.userId;
        socket.data.email = decoded.email;
        socket.data.organizationId = decoded.organizationId;
        socket.data.role = decoded.role;
        
        console.log(`✅ Utente autenticato: ${decoded.email}`);
        next();
      } catch (error) {
        console.error('❌ Errore autenticazione socket:', error);
        next(new Error('Autenticazione fallita'));
      }
    });

    // Gestione connessioni
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    console.log('✅ Socket.io inizializzato con successo');
  }

  /**
   * Gestisce una nuova connessione
   */
  private handleConnection(socket: Socket) {
    const { userId, email, organizationId } = socket.data;
    
    console.log(`👤 Nuova connessione: ${email} (${socket.id})`);

    // Traccia le connessioni per utente
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socket.id);

    // L'utente si unisce alle stanze (rooms) appropriate
    socket.join(`user:${userId}`); // Stanza personale
    socket.join(`org:${organizationId}`); // Stanza organizzazione
    
    // Invia eventuali notifiche non lette all'utente
    this.sendPendingNotifications(socket);

    // Gestione eventi dal client
    this.registerEventHandlers(socket);

    // Gestione disconnessione
    socket.on('disconnect', () => {
      console.log(`👋 Disconnessione: ${email} (${socket.id})`);
      
      // Rimuovi socket dalla lista
      const userSocketSet = this.userSockets.get(userId);
      if (userSocketSet) {
        userSocketSet.delete(socket.id);
        if (userSocketSet.size === 0) {
          this.userSockets.delete(userId);
        }
      }
    });
  }

  /**
   * Registra gli handler per gli eventi del client
   */
  private registerEventHandlers(socket: Socket) {
    // Quando l'utente segna una notifica come letta
    socket.on('notification:markRead', async (notificationId: string) => {
      console.log(`📖 Notifica ${notificationId} segnata come letta`);
      // Qui potresti aggiornare il database
      socket.emit('notification:marked', { id: notificationId });
    });

    // Quando l'utente segna tutte come lette
    socket.on('notification:markAllRead', async () => {
      console.log(`📖 Tutte le notifiche segnate come lette`);
      socket.emit('notification:allMarked');
    });

    // Test di connessione
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date() });
    });
  }

  /**
   * Invia notifiche non lette quando l'utente si connette
   */
  private async sendPendingNotifications(socket: Socket) {
    try {
      // Qui andresti a recuperare le notifiche non lette dal database
      // Per ora inviamo un messaggio di benvenuto
      socket.emit('notification:welcome', {
        message: 'Benvenuto! Connessione real-time stabilita.',
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Errore invio notifiche pendenti:', error);
    }
  }

  /**
   * Invia una notifica a un utente specifico
   */
  sendToUser(userId: string, event: string, data: any) {
    if (!this.io) {
      console.error('Socket.io non inizializzato');
      return;
    }

    const room = `user:${userId}`;
    console.log(`📤 Invio ${event} a utente ${userId}`);
    this.io.to(room).emit(event, data);
  }

  /**
   * Invia una notifica a tutti gli utenti di un'organizzazione
   */
  sendToOrganization(organizationId: string, event: string, data: any) {
    if (!this.io) {
      console.error('Socket.io non inizializzato');
      return;
    }

    const room = `org:${organizationId}`;
    console.log(`📤 Invio ${event} a organizzazione ${organizationId}`);
    this.io.to(room).emit(event, data);
  }

  /**
   * Invia una nuova notifica a un utente
   */
  sendNotification(userId: string, notification: any) {
    this.sendToUser(userId, 'notification:new', notification);
  }

  /**
   * Invia un aggiornamento del contatore notifiche
   */
  sendNotificationCount(userId: string, count: number) {
    this.sendToUser(userId, 'notification:count', { count });
  }

  /**
   * Broadcast a tutti gli utenti connessi
   */
  broadcast(event: string, data: any) {
    if (!this.io) {
      console.error('Socket.io non inizializzato');
      return;
    }

    console.log(`📢 Broadcast ${event} a tutti`);
    this.io.emit(event, data);
  }

  /**
   * Verifica se un utente è online
   */
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }

  /**
   * Ottieni il numero di utenti connessi
   */
  getOnlineUsersCount(): number {
    return this.userSockets.size;
  }

  /**
   * Ottieni lista utenti online
   */
  getOnlineUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }
}

export default SocketService.getInstance();
