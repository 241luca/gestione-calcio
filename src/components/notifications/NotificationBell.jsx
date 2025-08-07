// src/components/notifications/NotificationBell.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FaBell } from 'react-icons/fa';
import notificationService from '../../services/notificationService';
import NotificationList from './NotificationList';
import './NotificationBell.css';

function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Carica le notifiche quando il componente si monta
  useEffect(() => {
    loadNotifications();
    
    // Ricarica ogni 30 secondi
    const interval = setInterval(loadNotifications, 30000);
    
    // Chiudi dropdown quando clicchi fuori
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
      loadNotifications();
    } catch (error) {
      console.error('Errore nel segnare come letta:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      loadNotifications();
    } catch (error) {
      console.error('Errore nel segnare tutte come lette:', error);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      loadNotifications();
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
      >
        <FaBell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifiche</h3>
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