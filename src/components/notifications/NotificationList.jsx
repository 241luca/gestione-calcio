// src/components/notifications/NotificationList.jsx
import React from 'react';
import NotificationItem from './NotificationItem';
import './NotificationList.css';

function NotificationList({ notifications, onMarkAsRead, onDelete, showActions = true }) {
  return (
    <div className="notification-list">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkAsRead={onMarkAsRead}
          onDelete={onDelete}
          showActions={showActions}
        />
      ))}
    </div>
  );
}

export default NotificationList;