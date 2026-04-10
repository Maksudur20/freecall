// NotificationItem Component
// Individual notification display

import { formatDistanceToNow } from 'date-fns';
import useNotifications from '../../hooks/useNotifications.js';

export function NotificationItem({ notification, onDismiss = () => {} }) {
  const { readNotification, removeNotification, getTypeIcon, getTypeColor, getTypeLabel } = useNotifications({
    autoInit: false,
  });

  const handleRead = (e) => {
    e.stopPropagation();
    if (!notification.isRead) {
      readNotification(notification._id);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    removeNotification(notification._id);
    onDismiss();
  };

  const handleClick = () => {
    if (!notification.isRead) {
      readNotification(notification._id);
    }
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });

  return (
    <div
      onClick={handleClick}
      className={`
        p-4 border-l-4 rounded-r-lg
        ${getTypeColor(notification.type)}
        ${!notification.isRead ? 'bg-opacity-100' : 'bg-opacity-60'}
        ${notification.actionUrl ? 'cursor-pointer hover:shadow-md' : ''}
        transition-all duration-200
        flex items-start gap-3
      `}
    >
      {/* Icon */}
      <span className="text-xl mt-1">{getTypeIcon(notification.type)}</span>

      {/* Content */}
      <div className="flex-1">
        <h3 className="font-semibold text-sm text-gray-900 mb-1">
          {notification.title}
        </h3>
        {notification.description && (
          <p className="text-sm text-gray-700 mb-2">
            {notification.description}
          </p>
        )}
        <p className="text-xs text-gray-500">
          {getTypeLabel(notification.type)} • {timeAgo}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {!notification.isRead && (
          <button
            onClick={handleRead}
            className="text-xs px-2 py-1 rounded bg-white/50 hover:bg-white/100 transition"
            title="Mark as read"
          >
            ✓
          </button>
        )}
        <button
          onClick={handleDelete}
          className="text-xs px-2 py-1 rounded bg-white/50 hover:bg-white/100 text-gray-600 transition"
          title="Dismiss"
        >
          ✕
        </button>
      </div>

      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
      )}
    </div>
  );
}

export default NotificationItem;
