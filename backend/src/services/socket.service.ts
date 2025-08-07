// backend/src/services/socket.service.ts - VERSIONE SEMPLIFICATA
import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

class SocketService {
  private io: Server | null = null;
  private connectedUsers: Map<string, Socket> = new Map();

  /**
   * Inizializza Socket.io
   */
  initialize(httpServer: HTTPServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        credentials: true
      }
    });

    // Middleware di autenticazione (opzionale per ora)
    this.io.use(async (socket, next) => {
      try {
        // Per ora accettiamo tutte le connessioni
        // In futuro implementeremo autenticazione JWT
        next();
      } catch (error) {
        next(new Error('Autenticazione fallita'));
      }
    });

    // Gestione connessioni
    this.io.on('connection', (socket: Socket) => {
      console.log('🔌 Nuovo client connesso:', socket.id);

      // Gestione eventi
      socket.on('join-room', (room: string) => {
        socket.join(room);
        console.log(`Socket ${socket.id} joined room ${room}`);
      });

      socket.on('leave-room', (room: string) => {
        socket.leave(room);
        console.log(`Socket ${socket.id} left room ${room}`);
      });

      socket.on('disconnect', () => {
        console.log('🔌 Client disconnesso:', socket.id);
        // Rimuovi dalla mappa degli utenti connessi
        for (const [userId, userSocket] of this.connectedUsers.entries()) {
          if (userSocket.id === socket.id) {
            this.connectedUsers.delete(userId);
            break;
          }
        }
      });
    });

    console.log('✅ Socket.io inizializzato');
  }

  /**
   * Invia un messaggio a tutti i client connessi
   */
  broadcast(event: string, data: any) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  /**
   * Invia un messaggio a una stanza specifica
   */
  sendToRoom(room: string, event: string, data: any) {
    if (this.io) {
      this.io.to(room).emit(event, data);
    }
  }

  /**
   * Invia un messaggio a tutti gli utenti di un'organizzazione
   */
  sendToOrganization(organizationId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`org:${organizationId}`).emit(event, data);
    }
  }

  /**
   * Invia notifica a un utente specifico
   */
  sendNotification(userId: string, notification: any) {
    const socket = this.connectedUsers.get(userId);
    if (socket) {
      socket.emit('notification', notification);
    }
  }

  /**
   * Invia conteggio notifiche a un utente
   */
  sendNotificationCount(userId: string, count: number) {
    const socket = this.connectedUsers.get(userId);
    if (socket) {
      socket.emit('notification-count', { count });
    }
  }

  /**
   * Ottieni numero utenti online
   */
  getOnlineUsersCount(): number {
    return this.io ? this.io.sockets.sockets.size : 0;
  }

  /**
   * Verifica se Socket.io è inizializzato
   */
  isInitialized(): boolean {
    return this.io !== null;
  }
}

// Esporta istanza singleton
export default new SocketService();
