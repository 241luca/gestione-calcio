import React, { useState, useEffect, useRef } from 'react';
import { BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { BellAlertIcon } from '@heroicons/react/24/solid';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Carica notifiche di esempio
  useEffect(() => {
    // Simuliamo alcune notifiche
    const sampleNotifications = [
      {
        id: 1,
        type: 'document',
        title: 'Documento in scadenza',
        message: 'Il certificato medico di Mario Rossi scade tra 5 giorni',
        time: '2 ore fa',
        read: false,
        priority: 'high',
        icon: '📄'
      },
      {
        id: 2,
        type: 'payment',
        title: 'Pagamento scaduto',
        message: 'Luigi Verdi ha un pagamento scaduto di €50',
        time: '3 ore fa',
        read: false,
        priority: 'urgent',
        icon: '💰'
      },
      {
        id: 3,
        type: 'match',
        title: 'Nuova convocazione',
        message: 'Sei stato convocato per la partita di domenica',
        time: '5 ore fa',
        read: false,
        priority: 'normal',
        icon: '⚽'
      },
      {
        id: 4,
        type: 'calendar',
        title: 'Allenamento annullato',
        message: "L'allenamento di oggi è stato annullato per maltempo",
        time: '1 giorno fa',
        read: true,
        priority: 'normal',
        icon: '📅'
      },
      {
        id: 5,
        type: 'system',
        title: 'Backup completato',
        message: 'Il backup automatico è stato completato con successo',
        time: '2 giorni fa',
        read: true,
        priority: 'low',
        icon: '✅'
      }
    ];

    setNotifications(sampleNotifications);
    updateUnreadCount(sampleNotifications);

    // Simula l'arrivo di nuove notifiche
    const interval = setInterval(() => {
      const newNotification = {
        id: Date.now(),
        type: 'document',
        title: 'Nuova notifica',
        message: `Notifica automatica delle ${new Date().toLocaleTimeString('it-IT')}`,
        time: 'ora',
        read: false,
        priority: 'normal',
        icon: '🔔'
      };

      setNotifications(prev => [newNotification, ...prev]);
      updateUnreadCount([newNotification, ...notifications]);
    }, 60000); // Ogni minuto

    return () => clearInterval(interval);
  }, []);

  // Aggiorna conteggio non lette
  const updateUnreadCount = (notifs) => {
    const unread = notifs.filter(n => !n.read).length;
    setUnreadCount(unread);
  };

  // Gestisci click fuori dal dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Segna come letta
  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    updateUnreadCount(
      notifications.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  // Segna tutte come lette
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
    setUnreadCount(0);
  };

  // Elimina notifica
  const deleteNotification = (id) => {
    const newNotifications = notifications.filter(n => n.id !== id);
    setNotifications(newNotifications);
    updateUnreadCount(newNotifications);
  };

  // Elimina tutte
  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
    setIsOpen(false);
  };

  // Ottieni colore priorità
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Icona campanella con badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
      >
        {unreadCount > 0 ? (
          <BellAlertIcon className="h-6 w-6 text-blue-600" />
        ) : (
          <BellIcon className="h-6 w-6" />
        )}
        
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 -mt-1 -mr-1 px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown notifiche */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[500px] overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Notifiche
                {unreadCount > 0 && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({unreadCount} non {unreadCount === 1 ? 'letta' : 'lette'})
                  </span>
                )}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            {/* Azioni rapide */}
            {notifications.length > 0 && (
              <div className="flex justify-between mt-2">
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700"
                  disabled={unreadCount === 0}
                >
                  Segna tutte come lette
                </button>
                <button
                  onClick={clearAll}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Elimina tutte
                </button>
              </div>
            )}
          </div>

          {/* Lista notifiche */}
          <div className="overflow-y-auto max-h-[400px]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nessuna notifica</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icona */}
                      <div className="flex-shrink-0 text-2xl">
                        {notification.icon}
                      </div>

                      {/* Contenuto */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-sm font-medium text-gray-900 ${
                              !notification.read ? 'font-semibold' : ''
                            }`}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center mt-2 space-x-2">
                              <span className="text-xs text-gray-500">
                                {notification.time}
                              </span>
                              <span className={`px-2 py-0.5 text-xs rounded-full border ${
                                getPriorityColor(notification.priority)
                              }`}>
                                {notification.priority === 'urgent' ? 'Urgente' :
                                 notification.priority === 'high' ? 'Alta' :
                                 notification.priority === 'normal' ? 'Normale' : 'Bassa'}
                              </span>
                            </div>
                          </div>

                          {/* Azioni */}
                          <div className="flex items-center space-x-1 ml-2">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-1 text-blue-600 hover:text-blue-700"
                                title="Segna come letta"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="p-1 text-gray-400 hover:text-red-600"
                              title="Elimina"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium">
                Vedi tutte le notifiche
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
