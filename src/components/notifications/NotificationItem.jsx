// src/components/notifications/NotificationItem.jsx
import React from 'react';
import { 
  FaFileAlt, 
  FaMoneyBillWave, 
  FaFutbol, 
  FaDumbbell,
  FaBus,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCheckCircle,
  FaTimes,
  FaEye
} from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import './NotificationItem.css';

function NotificationItem({ notification, onMarkAsRead, onDelete, showActions }) {
  const getIcon = () => {
    switch (notification.type) {
      case 'document_expiry':
        return <FaFileAlt />;
      case 'payment_reminder':
      case 'payment_overdue':
        return <FaMoneyBillWave />;
      case 'match_reminder':
      case 'match_convocation':
        return <FaFutbol />;
      case 'training_reminder':
        return <FaDumbbell />;
      case 'transport_booking_confirmed':
        return <FaBus />;
      default:
        return <FaInfoCircle />;
    }
  };

  const getPriorityIcon = () => {
    switch (notification.priority) {
      case 'urgent':
        return <FaExclamationTriangle className="priority-urgent" />;
      case 'high':
        return <FaExclamationTriangle className="priority-high" />;
      default:
        return null;
    }
  };

  const getPriorityClass = () => {
    switch (notification.priority) {
      case 'urgent':
        return 'notification-item-urgent';
      case 'high':
        return 'notification-item-high';
      default:
        return '';
    }
  };

  const handleClick = () => {
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  return (
    <div 
      className={`notification-item ${!notification.isRead ? 'unread' : ''} ${getPriorityClass()}`}
      onClick={handleClick}
    >
      <div className="notification-icon">
        {getIcon()}
      </div>
      
      <div className="notification-body">
        <div className="notification-title-row">
          <h4 className="notification-title">
            {notification.title}
            {getPriorityIcon()}
          </h4>
          {showActions && (
            <div className="notification-actions">
              {!notification.isRead && (
                <button
                  className="action-btn read-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead(notification.id);
                  }}
                  title="Segna come letta"
                >
                  <FaEye size={14} />
                </button>
              )}
              <button
                className="action-btn delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification.id);
                }}
                title="Elimina"
              >
                <FaTimes size={14} />
              </button>
            </div>
          )}
        </div>
        
        <p className="notification-message">{notification.message}</p>
        
        <div className="notification-meta">
          <span className="notification-time">
            {formatDistanceToNow(new Date(notification.createdAt), { 
              addSuffix: true,
              locale: it 
            })}
          </span>
          {notification.isRead && (
            <span className="notification-read-indicator">
              <FaCheckCircle size={12} /> Letta
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationItem;