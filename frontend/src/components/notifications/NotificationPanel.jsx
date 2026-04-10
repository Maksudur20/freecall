// NotificationPanel Component
// Displays list of notifications with filtering and management

import { useState } from 'react';
import useNotifications from '../../hooks/useNotifications.js';
import NotificationItem from './NotificationItem.jsx';

export function NotificationPanel({ isOpen = true, onClose = () => {} }) {
  const {
    notifications,
    unreadCount,
    badgeCount,
    isLoading,
    soundEnabled,
    readAllNotifications,
    clearAllNotifications,
    toggleSound,
    testSound,
    getByType,
  } = useNotifications({ autoInit: true, fetchOnMount: true });

  const [selectedType, setSelectedType] = useState('all');
  const [showSettings, setShowSettings] = useState(false);

  const types = ['all', 'message', 'friend_request', 'friend_accepted', 'call_incoming', 'call_missed'];

  const filteredNotifications = selectedType === 'all'
    ? notifications
    : getByType(selectedType);

  const notificationsByType = {
    message: getByType('message').length,
    friend_request: getByType('friend_request').length,
    friend_accepted: getByType('friend_accepted').length,
    call_incoming: getByType('call_incoming').length,
    call_missed: getByType('call_missed').length,
  };

  if (!isOpen) return null;

  return (
    <div className="w-96 max-h-96 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-lg">Notifications</h2>
          {badgeCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {badgeCount}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 font-bold text-xl"
        >
          ✕
        </button>
      </div>

      {/* Settings Toggle */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 border-b border-gray-100"
      >
        {showSettings ? '✓ Hide Settings' : '⚙️ Settings'}
      </button>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 border-b border-gray-200 bg-gray-50 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              🔔 Notification Sounds
            </label>
            <button
              onClick={toggleSound}
              className={`px-3 py-1 rounded text-xs font-medium transition ${
                soundEnabled
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-300 text-gray-700'
              }`}
            >
              {soundEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {soundEnabled && (
            <button
              onClick={testSound}
              className="w-full px-3 py-2 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 rounded transition"
            >
              🔊 Test Sound
            </button>
          )}

          <button
            onClick={readAllNotifications}
            disabled={unreadCount === 0}
            className="w-full px-3 py-2 text-xs bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-800 rounded transition"
          >
            ✓ Mark All as Read
          </button>

          <button
            onClick={clearAllNotifications}
            disabled={notifications.length === 0}
            className="w-full px-3 py-2 text-xs bg-red-100 hover:bg-red-200 disabled:opacity-50 text-red-800 rounded transition"
          >
            🗑️ Clear All
          </button>
        </div>
      )}

      {/* Type Filter */}
      <div className="px-4 py-3 border-b border-gray-200 flex gap-2 text-xs overflow-x-auto">
        {types.map(type => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-3 py-1 rounded-full whitespace-nowrap transition ${
              selectedType === type
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {type === 'all' 
              ? `All (${notifications.length})`
              : `${type.replace(/_/g, ' ')} (${notificationsByType[type] || 0})`
            }
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto space-y-2 p-3">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">
            Loading notifications...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500 flex items-center justify-center h-full">
            <div>
              <p className="text-2xl mb-2">📭</p>
              <p>No notifications yet</p>
            </div>
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <NotificationItem
              key={notification._id}
              notification={notification}
            />
          ))
        )}
      </div>

      {/* Footer */}
      {filteredNotifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 text-center text-xs text-gray-500">
          Showing {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

export default NotificationPanel;
