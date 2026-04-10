// Socket.io Service
import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const initializeSocket = (userId) => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('✓ Socket connected');
    socket.emit('authenticate', userId);
    socket.emit('user_online', userId);
  });

  socket.on('disconnect', () => {
    console.log('✗ Socket disconnected');
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

// Chat events
export const socketChat = {
  joinConversation: (conversationId, userId) => {
    socket?.emit('join_conversation', conversationId, userId);
  },

  leaveConversation: (conversationId, userId) => {
    socket?.emit('leave_conversation', conversationId, userId);
  },

  sendMessage: (data) => {
    socket?.emit('send_message', data);
  },

  onNewMessage: (callback) => {
    socket?.on('new_message', callback);
  },

  offNewMessage: () => {
    socket?.off('new_message');
  },

  typing: (conversationId, userId, username) => {
    socket?.emit('user_typing', conversationId, userId, username);
  },

  stopTyping: (conversationId, userId) => {
    socket?.emit('user_stop_typing', conversationId, userId);
  },

  onUserTyping: (callback) => {
    socket?.on('user_typing', callback);
  },

  offUserTyping: () => {
    socket?.off('user_typing');
  },

  onUserStopTyping: (callback) => {
    socket?.on('user_stop_typing', callback);
  },

  offUserStopTyping: () => {
    socket?.off('user_stop_typing');
  },

  messageDelivered: (messageId) => {
    socket?.emit('message_delivered', messageId);
  },

  messageSeen: (conversationId, userId) => {
    socket?.emit('message_seen', conversationId, userId);
  },

  onMessageSeen: (callback) => {
    socket?.on('message_seen', callback);
  },

  offMessageSeen: () => {
    socket?.off('message_seen');
  },

  editMessage: (data) => {
    socket?.emit('edit_message', data);
  },

  onMessageEdited: (callback) => {
    socket?.on('message_edited', callback);
  },

  offMessageEdited: () => {
    socket?.off('message_edited');
  },

  deleteMessage: (data) => {
    socket?.emit('delete_message', data);
  },

  onMessageDeleted: (callback) => {
    socket?.on('message_deleted', callback);
  },

  offMessageDeleted: () => {
    socket?.off('message_deleted');
  },

  addReaction: (data) => {
    socket?.emit('add_reaction', data);
  },

  onReactionAdded: (callback) => {
    socket?.on('reaction_added', callback);
  },

  offReactionAdded: () => {
    socket?.off('reaction_added');
  },
};

// Presence events
export const socketPresence = {
  userOnline: (userId) => {
    socket?.emit('user_online', userId);
  },

  userAway: (userId) => {
    socket?.emit('user_away', userId);
  },

  userOffline: (userId) => {
    socket?.emit('user_offline', userId);
  },

  getOnlineUsers: () => {
    socket?.emit('get_online_users');
  },

  onOnlineUsers: (callback) => {
    socket?.on('online_users', callback);
  },

  offOnlineUsers: () => {
    socket?.off('online_users');
  },

  // Get presence info for specific users
  getPresence: (userIds) => {
    socket?.emit('get_presence', userIds);
  },

  onPresenceInfo: (callback) => {
    socket?.on('presence_info', callback);
  },

  offPresenceInfo: () => {
    socket?.off('presence_info');
  },

  onUserStatusChanged: (callback) => {
    socket?.on('user_status_changed', callback);
  },

  offUserStatusChanged: () => {
    socket?.off('user_status_changed');
  },

  userActivity: (userId) => {
    socket?.emit('user_activity', userId);
  },
};

// Call events
export const socketCall = {
  initiateCall: (data) => {
    socket?.emit('initiate_call', data);
  },

  onIncomingCall: (callback) => {
    socket?.on('incoming_call', callback);
  },

  offIncomingCall: () => {
    socket?.off('incoming_call');
  },

  acceptCall: (data) => {
    socket?.emit('accept_call', data);
  },

  onCallAccepted: (callback) => {
    socket?.on('call_accepted', callback);
  },

  offCallAccepted: () => {
    socket?.off('call_accepted');
  },

  declineCall: (data) => {
    socket?.emit('decline_call', data);
  },

  onCallDeclined: (callback) => {
    socket?.on('call_declined', callback);
  },

  offCallDeclined: () => {
    socket?.off('call_declined');
  },

  endCall: (data) => {
    socket?.emit('end_call', data);
  },

  onCallEnded: (callback) => {
    socket?.on('call_ended', callback);
  },

  offCallEnded: () => {
    socket?.off('call_ended');
  },

  sendOffer: (data) => {
    socket?.emit('webrtc_offer', data);
  },

  onOffer: (callback) => {
    socket?.on('webrtc_offer', callback);
  },

  offOffer: () => {
    socket?.off('webrtc_offer');
  },

  sendAnswer: (data) => {
    socket?.emit('webrtc_answer', data);
  },

  onAnswer: (callback) => {
    socket?.on('webrtc_answer', callback);
  },

  offAnswer: () => {
    socket?.off('webrtc_answer');
  },

  sendICECandidate: (data) => {
    socket?.emit('webrtc_ice_candidate', data);
  },

  onICECandidate: (callback) => {
    socket?.on('webrtc_ice_candidate', callback);
  },

  offICECandidate: () => {
    socket?.off('webrtc_ice_candidate');
  },

  toggleMute: (data) => {
    socket?.emit('toggle_mute', data);
  },

  onMuteStatusChange: (callback) => {
    socket?.on('user_mute_status', callback);
  },

  offMuteStatusChange: () => {
    socket?.off('user_mute_status');
  },

  toggleCamera: (data) => {
    socket?.emit('toggle_camera', data);
  },

  onCameraStatusChange: (callback) => {
    socket?.on('user_camera_status', callback);
  },

  offCameraStatusChange: () => {
    socket?.off('user_camera_status');
  },

  callMissed: (data) => {
    socket?.emit('call_missed', data);
  },

  connectionStatus: (data) => {
    socket?.emit('connection_status', data);
  },

  onPeerConnectionStatus: (callback) => {
    socket?.on('peer_connection_status', callback);
  },

  offPeerConnectionStatus: () => {
    socket?.off('peer_connection_status');
  },

  onPeerDisconnected: (callback) => {
    socket?.on('peer_disconnected', callback);
  },

  offPeerDisconnected: () => {
    socket?.off('peer_disconnected');
  },

  onCallInitiated: (callback) => {
    socket?.on('call_initiated', callback);
  },

  offCallInitiated: () => {
    socket?.off('call_initiated');
  },

  onCallAcceptedConfirmed: (callback) => {
    socket?.on('call_accepted_confirmed', callback);
  },

  offCallAcceptedConfirmed: () => {
    socket?.off('call_accepted_confirmed');
  },

  onCallDeclinedConfirmed: (callback) => {
    socket?.on('call_declined_confirmed', callback);
  },

  offCallDeclinedConfirmed: () => {
    socket?.off('call_declined_confirmed');
  },

  onCallEndedConfirmed: (callback) => {
    socket?.on('call_ended_confirmed', callback);
  },

  offCallEndedConfirmed: () => {
    socket?.off('call_ended_confirmed');
  },

  onCallError: (callback) => {
    socket?.on('call_error', callback);
  },

  offCallError: () => {
    socket?.off('call_error');
  },
};

// Notification events
export const socketNotification = {
  // Listen for new notification
  onNotification: (callback) => {
    socket?.on('notification', callback);
  },

  offNotification: () => {
    socket?.off('notification');
  },

  // Legacy event support
  onNewNotification: (callback) => {
    socket?.on('new_notification', callback);
  },

  offNewNotification: () => {
    socket?.off('new_notification');
  },

  // Listen for notification read
  onNotificationRead: (callback) => {
    socket?.on('notification_read', callback);
  },

  offNotificationRead: () => {
    socket?.off('notification_read');
  },

  // Listen for all notifications read
  onAllNotificationsRead: (callback) => {
    socket?.on('all_notifications_read', callback);
  },

  offAllNotificationsRead: () => {
    socket?.off('all_notifications_read');
  },

  // Listen for notification deleted
  onNotificationDeleted: (callback) => {
    socket?.on('notification_deleted', callback);
  },

  offNotificationDeleted: () => {
    socket?.off('notification_deleted');
  },

  // Emit actions
  getUnreadCount: (userId) => {
    socket?.emit('get_unread_count', userId);
  },

  onUnreadCount: (callback) => {
    socket?.on('unread_count', callback);
  },

  offUnreadCount: () => {
    socket?.off('unread_count');
  },

  getNotifications: (userId, limit = 20, skip = 0) => {
    socket?.emit('get_notifications', userId, limit, skip);
  },

  onNotificationsList: (callback) => {
    socket?.on('notifications_list', callback);
  },

  offNotificationsList: () => {
    socket?.off('notifications_list');
  },

  markNotificationRead: (notificationId) => {
    socket?.emit('mark_notification_read', notificationId);
  },

  markAllRead: (userId) => {
    socket?.emit('mark_all_notifications_read', userId);
  },

  deleteNotification: (notificationId) => {
    socket?.emit('delete_notification', notificationId);
  },

  setNotificationSound: (userId, enabled) => {
    socket?.emit('set_notification_sound', userId, enabled);
  },
};

export default {
  initializeSocket,
  disconnectSocket,
  getSocket,
  socketChat,
  socketPresence,
  socketCall,
  socketNotification,
};
