// src/components/notifications/NotificationBell.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FaBell } from 'react-icons/fa';
import notificationService from '../../services/notificationService';
import { useSocket } from '../../hooks/useSocket';
import NotificationList from './NotificationList';
import './NotificationBell.css';

function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  
  // Usa il nostro hook Socket.io
  const { connected, markNotificationRead, markAllNotificationsRead } = useSocket();

  // Carica le notifiche quando il componente si monta
  useEffect(() => {
    loadNotifications();
    
    // Chiudi dropdown quando clicchi fuori
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Ascolta eventi Socket.io per notifiche real-time
  useEffect(() => {
    // Ascolta nuove notifiche
    const handleNewNotification = (event) => {
      const notification = event.detail;
      console.log('🔔 Nuova notifica ricevuta in NotificationBell:', notification);
      
      // Aggiungi la nuova notifica all'inizio della lista
      setNotifications(prev => [notification, ...prev].slice(0, 10));
      
      // Incrementa il contatore
      setUnreadCount(prev => prev + 1);
    };

    // Ascolta aggiornamenti del contatore
    const handleCountUpdate = (event) => {
      const { count } = event.detail;
      console.log('🔢 Aggiornamento contatore notifiche:', count);
      setUnreadCount(count);
    };

    // Registra i listener
    window.addEventListener('notification:new', handleNewNotification);
    window.addEventListener('notification:countUpdate', handleCountUpdate);

    // Pulisci i listener quando il componente si smonta
    return () => {
      window.removeEventListener('notification:new', handleNewNotification);
      window.removeEventListener('notification:countUpdate', handleCountUpdate);
    };
  }, []);

  // Mostra indicatore di connessione Socket.io
  useEffect(() => {
    if (connected) {
      console.log('✅ NotificationBell: Socket.io connesso');
    } else {
      console.log('❌ NotificationBell: Socket.io disconnesso');
    }
  }, [connected]);

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications(
        { status: 'unread' },
        1,
        10
      );
      
      if (response.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Errore caricamento notifiche:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      loadNotifications();
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      // Invia anche via Socket.io
      markNotificationRead(notificationId);
      
      // Aggiorna la lista locale
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, status: 'read', isRead: true } 
            : n
        )
      );
      
      // Decrementa il contatore
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Errore nel segnare come letta:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      
      // Invia anche via Socket.io
      markAllNotificationsRead();
      
      // Aggiorna tutte le notifiche locali
      setNotifications(prev => 
        prev.map(n => ({ ...n, status: 'read', isRead: true }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Errore nel segnare tutte come lette:', error);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      
      // Rimuovi dalla lista locale
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Se era non letta, decrementa il contatore
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Errore eliminazione notifica:', error);
    }
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button 
        className="notification-bell-button"
        onClick={handleToggle}
        aria-label="Notifiche"
        title={connected ? 'Notifiche (Real-time attivo)' : 'Notifiche'}
      >
        <FaBell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {/* Indicatore di connessione real-time */}
        {connected && (
          <span 
            className="connection-indicator" 
            style={{
              position: 'absolute',
              bottom: '-2px',
              right: '-2px',
              width: '8px',
              height: '8px',
              backgroundColor: '#10b981',
              borderRadius: '50%',
              border: '2px solid white',
              animation: 'pulse 2s infinite'
            }}
            title="Real-time attivo"
          />
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>
              Notifiche 
              {connected && (
                <span 
                  style={{
                    fontSize: '12px',
                    color: '#10b981',
                    marginLeft: '8px'
                  }}
                >
                  • Live
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button 
                className="mark-all-read-btn"
                onClick={handleMarkAllAsRead}
              >
                Segna tutte come lette
              </button>
            )}
          </div>

          <div className="notification-content">
            {loading ? (
              <div className="notification-loading">
                Caricamento...
              </div>
            ) : notifications.length > 0 ? (
              <NotificationList
                notifications={notifications}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
              />
            ) : (
              <div className="notification-empty">
                <p>Nessuna nuova notifica</p>
                {connected && (
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                    Le notifiche appariranno qui in tempo reale
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="notification-footer">
            <a href="/notifications" className="view-all-link">
              Vedi tutte le notifiche
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;