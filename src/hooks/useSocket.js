// src/hooks/useSocket.js
import { useEffect, useState, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { toast } from 'react-hot-toast';

/**
 * Hook personalizzato per gestire la connessione Socket.io
 * Gestisce connessione, eventi e notifiche real-time
 */
export function useSocket() {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const socketRef = useRef(null);
  const listenersRef = useRef(new Map());

  useEffect(() => {
    // Recupera il token di autenticazione
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.log('⚠️ Nessun token trovato, socket non connesso');
      return;
    }

    console.log('🔌 Inizializzazione connessione Socket.io...');

    // Crea la connessione Socket.io
    const newSocket = io('http://localhost:3000', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      timeout: 20000
    });

    socketRef.current = newSocket;

    // Gestione eventi di connessione
    newSocket.on('connect', () => {
      console.log('✅ Socket connesso!');
      setConnected(true);
      setConnectionError(null);
      
      // Mostra toast di connessione (solo la prima volta)
      if (!connected) {
        toast.success('Connessione real-time stabilita! 🚀');
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnesso:', reason);
      setConnected(false);
      
      if (reason === 'io server disconnect') {
        // Il server ha disconnesso, prova a riconnetterti
        toast.error('Connessione persa. Riconnessione in corso...');
        newSocket.connect();
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Errore connessione socket:', error.message);
      setConnectionError(error.message);
      
      // Mostra errore solo se non è già stato mostrato
      if (!connectionError) {
        toast.error('Problema di connessione real-time');
      }
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`♻️ Riconnesso dopo ${attemptNumber} tentativi`);
      toast.success('Riconnesso! 🔄');
    });

    // Gestione notifiche in arrivo
    newSocket.on('notification:new', (notification) => {
      console.log('📬 Nuova notifica ricevuta:', notification);
      handleNewNotification(notification);
    });

    // Aggiornamento contatore notifiche
    newSocket.on('notification:count', (data) => {
      console.log('🔢 Aggiornamento contatore:', data.count);
      // Dispatch evento personalizzato per aggiornare il badge
      window.dispatchEvent(new CustomEvent('notification:countUpdate', { 
        detail: { count: data.count } 
      }));
    });

    // Messaggio di benvenuto dal server
    newSocket.on('notification:welcome', (data) => {
      console.log('👋 Messaggio di benvenuto:', data.message);
    });

    // Test ping/pong
    newSocket.on('pong', (data) => {
      console.log('🏓 Pong ricevuto:', data);
    });

    // Eventi di test
    newSocket.on('test:message', (data) => {
      console.log('🧪 Messaggio di test:', data);
      toast.info(`Test: ${data.message}`);
    });

    setSocket(newSocket);

    // Cleanup quando il componente si smonta
    return () => {
      console.log('🧹 Pulizia socket...');
      
      // Rimuovi tutti i listener
      listenersRef.current.clear();
      
      // Disconnetti socket
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []); // Esegui solo al mount

  /**
   * Gestisce l'arrivo di una nuova notifica
   */
  const handleNewNotification = useCallback((notification) => {
    console.log('🔔 Gestione nuova notifica:', notification);
    
    // Dispatch evento per aggiornare la lista notifiche
    window.dispatchEvent(new CustomEvent('notification:new', { 
      detail: notification 
    }));

    // Mostra toast in base alla priorità
    const options = {
      duration: notification.priority === 'urgent' ? 10000 : 5000,
      position: 'top-right',
      style: {
        maxWidth: '400px'
      }
    };

    // Icona in base al tipo
    let icon = '📢';
    if (notification.type === 'document_expiry') icon = '📄';
    else if (notification.type === 'payment_reminder') icon = '💰';
    else if (notification.type === 'match_reminder') icon = '⚽';
    else if (notification.type === 'training_reminder') icon = '🏃';

    // Messaggio con icona
    const message = `${icon} ${notification.title}\n${notification.message}`;

    // Mostra toast con priorità appropriata
    switch (notification.priority) {
      case 'urgent':
        toast.error(message, {
          ...options,
          style: {
            ...options.style,
            background: '#dc2626',
            color: 'white'
          }
        });
        break;
      case 'high':
        toast(message, {
          ...options,
          style: {
            ...options.style,
            background: '#ea580c',
            color: 'white'
          }
        });
        break;
      case 'normal':
        toast.success(message, options);
        break;
      default:
        toast(message, options);
    }

    // Suona un suono per notifiche urgenti (opzionale)
    if (notification.priority === 'urgent') {
      playNotificationSound();
    }
  }, []);

  /**
   * Suona un suono di notifica (opzionale)
   */
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Audio non disponibile:', e));
    } catch (error) {
      console.log('Impossibile riprodurre suono:', error);
    }
  };

  /**
   * Invia un evento al server
   */
  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      console.log(`📤 Emissione evento: ${event}`, data);
      socketRef.current.emit(event, data);
    } else {
      console.warn(`⚠️ Socket non connesso, impossibile inviare: ${event}`);
    }
  }, []);

  /**
   * Ascolta un evento
   */
  const on = useCallback((event, handler) => {
    if (socketRef.current) {
      console.log(`👂 Registrazione listener: ${event}`);
      socketRef.current.on(event, handler);
      
      // Traccia i listener per la pulizia
      if (!listenersRef.current.has(event)) {
        listenersRef.current.set(event, new Set());
      }
      listenersRef.current.get(event).add(handler);
    }
  }, []);

  /**
   * Rimuove un listener
   */
  const off = useCallback((event, handler) => {
    if (socketRef.current) {
      console.log(`🔇 Rimozione listener: ${event}`);
      socketRef.current.off(event, handler);
      
      // Rimuovi dal tracking
      if (listenersRef.current.has(event)) {
        listenersRef.current.get(event).delete(handler);
      }
    }
  }, []);

  /**
   * Segna una notifica come letta
   */
  const markNotificationRead = useCallback((notificationId) => {
    emit('notification:markRead', notificationId);
  }, [emit]);

  /**
   * Segna tutte le notifiche come lette
   */
  const markAllNotificationsRead = useCallback(() => {
    emit('notification:markAllRead');
  }, [emit]);

  /**
   * Test della connessione
   */
  const testConnection = useCallback(() => {
    console.log('🧪 Test connessione...');
    emit('ping');
  }, [emit]);

  /**
   * Riconnetti manualmente
   */
  const reconnect = useCallback(() => {
    if (socketRef.current && !socketRef.current.connected) {
      console.log('🔄 Riconnessione manuale...');
      socketRef.current.connect();
    }
  }, []);

  return {
    socket: socketRef.current,
    connected,
    connectionError,
    emit,
    on,
    off,
    markNotificationRead,
    markAllNotificationsRead,
    testConnection,
    reconnect
  };
}

export default useSocket;