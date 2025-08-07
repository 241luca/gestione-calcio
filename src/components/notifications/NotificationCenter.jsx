// src/components/notifications/NotificationCenter.jsx
import React, { useState, useEffect } from 'react';
import { FaBell, FaFilter, FaTrash, FaCheckDouble, FaClock } from 'react-icons/fa';
import notificationService from '../../services/notificationService';
import NotificationList from './NotificationList';
import toast from 'react-hot-toast';
import './NotificationCenter.css';

function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    type: 'all'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadNotifications();
    loadStats();
  }, [filters, pagination.page]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      
      const filterParams = {};
      if (filters.status !== 'all') filterParams.status = filters.status;
      if (filters.priority !== 'all') filterParams.priority = filters.priority;
      if (filters.type !== 'all') filterParams.type = filters.type;

      const response = await notificationService.getNotifications(
        filterParams,
        pagination.page,
        pagination.limit
      );

      if (response.success) {
        setNotifications(response.data.notifications);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Errore caricamento notifiche:', error);
      toast.error('Errore nel caricamento delle notifiche');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await notificationService.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Errore caricamento statistiche:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      toast.success('Notifica segnata come letta');
      loadNotifications();
      loadStats();
    } catch (error) {
      toast.error('Errore nell\'aggiornamento');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      toast.success('Tutte le notifiche sono state segnate come lette');
      loadNotifications();
      loadStats();
    } catch (error) {
      toast.error('Errore nell\'aggiornamento');
    }
  };

  const handleDelete = async (notificationId) => {
    if (window.confirm('Sei sicuro di voler eliminare questa notifica?')) {
      try {
        await notificationService.deleteNotification(notificationId);
        toast.success('Notifica eliminata');
        loadNotifications();
        loadStats();
      } catch (error) {
        toast.error('Errore nell\'eliminazione');
      }
    }
  };

  const handleSendReminders = async () => {
    if (window.confirm('Vuoi inviare tutti i promemoria automatici?')) {
      try {
        setLoading(true);
        await notificationService.sendReminders('all');
        toast.success('Promemoria inviati con successo');
        loadNotifications();
      } catch (error) {
        toast.error('Errore nell\'invio dei promemoria');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="notification-center">
      <div className="notification-center-header">
        <div className="header-left">
          <h1>
            <FaBell /> Centro Notifiche
          </h1>
          {stats && (
            <div className="notification-stats">
              <span className="stat-badge unread">
                {stats.unread} non lette
              </span>
              <span className="stat-badge total">
                {stats.total} totali
              </span>
            </div>
          )}
        </div>

        <div className="header-actions">
          <button 
            className="btn btn-secondary"
            onClick={handleMarkAllAsRead}
            disabled={!stats || stats.unread === 0}
          >
            <FaCheckDouble /> Segna tutte come lette
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleSendReminders}
          >
            <FaClock /> Invia Promemoria
          </button>
        </div>
      </div>

      <div className="notification-filters">
        <div className="filter-group">
          <label><FaFilter /> Filtra per:</label>
          
          <select 
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            <option value="all">Tutte</option>
            <option value="unread">Non lette</option>
            <option value="read">Lette</option>
          </select>

          <select 
            value={filters.priority}
            onChange={(e) => setFilters({...filters, priority: e.target.value})}
          >
            <option value="all">Tutte le priorità</option>
            <option value="urgent">Urgenti</option>
            <option value="high">Alta priorità</option>
            <option value="normal">Normale</option>
            <option value="low">Bassa priorità</option>
          </select>

          <select 
            value={filters.type}
            onChange={(e) => setFilters({...filters, type: e.target.value})}
          >
            <option value="all">Tutti i tipi</option>
            <option value="document_expiry">Documenti</option>
            <option value="payment_reminder">Pagamenti</option>
            <option value="match_reminder">Partite</option>
            <option value="training_reminder">Allenamenti</option>
            <option value="transport_booking_confirmed">Trasporti</option>
          </select>
        </div>
      </div>

      <div className="notification-center-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Caricamento notifiche...</p>
          </div>
        ) : notifications.length > 0 ? (
          <>
            <NotificationList
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDelete}
            />
            
            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button 
                  onClick={() => setPagination({...pagination, page: pagination.page - 1})}
                  disabled={pagination.page === 1}
                >
                  Precedente
                </button>
                <span>Pagina {pagination.page} di {pagination.totalPages}</span>
                <button 
                  onClick={() => setPagination({...pagination, page: pagination.page + 1})}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Successiva
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <FaBell size={48} />
            <h3>Nessuna notifica</h3>
            <p>Non ci sono notifiche da mostrare con i filtri selezionati</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationCenter;