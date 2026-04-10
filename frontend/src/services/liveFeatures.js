// Live Features Service
// Manages real-time features: typing indicators, online status, message delivery, and presence updates

import { socketChat, socketPresence, socketCall, socketNotification } from './socket.js';
import { useChatStore } from '../store/chatStore.js';
import { useUserStore } from '../store/userStore.js';
import { useNotificationStore } from '../store/notificationStore.js';

class LiveFeaturesService {
  constructor() {
    this.activeListeners = new Set();
    this.typingTimers = new Map();
    this.TYPING_TIMEOUT = 3000; // 3 seconds
  }

  /**
   * Initialize all live features listeners
   * Should be called once when app loads and user is authenticated
   */
  initializeAllListeners() {
    if (this.activeListeners.has('all')) {
      console.warn('Live features already initialized');
      return;
    }

    this.initializeChatListeners();
    this.initializePresenceListeners();
    this.initializeCallListeners();
    this.initializeNotificationListeners();

    this.activeListeners.add('all');
  }

  /**
   * Initialize chat-related real-time features
   */
  initializeChatListeners() {
    // New message received
    socketChat.onNewMessage((data) => {
      const { conversationId, message } = data;
      const { addMessage, currentConversation } = useChatStore.getState();

      // Only add if in current conversation
      if (currentConversation?._id === conversationId) {
        addMessage(conversationId, message);
      }

      // Update conversation preview
      const { updateConversationMessagePreview } = useChatStore.getState();
      updateConversationMessagePreview(conversationId, message);
    });

    // User typing indicator
    socketChat.onUserTyping((data) => {
      const { conversationId, userId, username } = data;
      const { setTypingUsers } = useChatStore.getState();

      setTypingUsers(conversationId, userId, username, true);

      // Clear existing timer for this user
      const timerId = this.typingTimers.get(`${conversationId}-${userId}`);
      if (timerId) clearTimeout(timerId);

      // Set new timer to auto-clear typing status
      const newTimerId = setTimeout(() => {
        setTypingUsers(conversationId, userId, username, false);
        this.typingTimers.delete(`${conversationId}-${userId}`);
      }, this.TYPING_TIMEOUT);

      this.typingTimers.set(`${conversationId}-${userId}`, newTimerId);
    });

    // User stopped typing
    socketChat.onUserStopTyping((data) => {
      const { conversationId, userId } = data;
      const { setTypingUsers } = useChatStore.getState();

      const timerId = this.typingTimers.get(`${conversationId}-${userId}`);
      if (timerId) clearTimeout(timerId);
      this.typingTimers.delete(`${conversationId}-${userId}`);

      setTypingUsers(conversationId, userId, null, false);
    });

    // Message delivery confirmation
    socketChat.onNewMessage((data) => {
      const { messageId } = data;
      const { updateMessageStatus } = useChatStore.getState();
      updateMessageStatus(messageId, 'delivered');
    });

    // Message seen confirmation
    socketChat.onMessageSeen((data) => {
      const { conversationId, userId } = data;
      const { updateMessagesSeen } = useChatStore.getState();
      updateMessagesSeen(conversationId, userId);
    });

    // Message edited
    socketChat.onMessageEdited((data) => {
      const { messageId, content } = data;
      const { updateMessage } = useChatStore.getState();
      updateMessage(messageId, { content });
    });

    // Message deleted
    socketChat.onMessageDeleted((data) => {
      const { messageId } = data;
      const { deleteMessage } = useChatStore.getState();
      deleteMessage(messageId);
    });

    // Reaction added
    socketChat.onReactionAdded((data) => {
      const { messageId, reaction, userId } = data;
      const { addReaction } = useChatStore.getState();
      addReaction(messageId, reaction, userId);
    });

    this.activeListeners.add('chat');
  }

  /**
   * Initialize presence-related real-time features
   */
  initializePresenceListeners() {
    // User online status changed
    socketPresence.onUserStatusChanged((data) => {
      const { userId, status } = data;
      const { updateUserStatus } = useUserStore.getState();
      updateUserStatus(userId, status);
    });

    // Get list of online users
    socketPresence.onOnlineUsers((data) => {
      const { onlineUsers } = data;
      const { setOnlineUsers } = useUserStore.getState();
      setOnlineUsers(onlineUsers);
    });

    this.activeListeners.add('presence');
  }

  /**
   * Initialize call-related real-time features
   */
  initializeCallListeners() {
    // Incoming call
    socketCall.onIncomingCall((data) => {
      const { callId, callerId, callerName, conversationId } = data;
      const { addIncomingCall } = useChatStore.getState();
      addIncomingCall({
        callId,
        callerId,
        callerName,
        conversationId,
        timestamp: Date.now(),
      });
    });

    // Call accepted
    socketCall.onCallAccepted((data) => {
      const { callId } = data;
      const { updateCallStatus } = useChatStore.getState();
      updateCallStatus(callId, 'accepted');
    });

    // Call declined
    socketCall.onCallDeclined((data) => {
      const { callId, declinedBy } = data;
      const { updateCallStatus } = useChatStore.getState();
      updateCallStatus(callId, 'declined', { declinedBy });
    });

    // Call ended
    socketCall.onCallEnded((data) => {
      const { callId } = data;
      const { updateCallStatus } = useChatStore.getState();
      updateCallStatus(callId, 'ended');
    });

    // WebRTC offer received
    socketCall.onOffer((data) => {
      // Handle WebRTC signaling
      const { callId, offer } = data;
      // Emit event or update state for WebRTC handling
      window.dispatchEvent(
        new CustomEvent('webrtc:offer', {
          detail: { callId, offer },
        })
      );
    });

    // WebRTC answer received
    socketCall.onAnswer((data) => {
      const { callId, answer } = data;
      window.dispatchEvent(
        new CustomEvent('webrtc:answer', {
          detail: { callId, answer },
        })
      );
    });

    // ICE candidate received
    socketCall.onICECandidate((data) => {
      const { callId, candidate } = data;
      window.dispatchEvent(
        new CustomEvent('webrtc:ice', {
          detail: { callId, candidate },
        })
      );
    });

    // User mute status changed
    socketCall.onMuteStatusChange((data) => {
      const { userId, isMuted } = data;
      window.dispatchEvent(
        new CustomEvent('call:mute', {
          detail: { userId, isMuted },
        })
      );
    });

    // User camera status changed
    socketCall.onCameraStatusChange((data) => {
      const { userId, cameraOn } = data;
      window.dispatchEvent(
        new CustomEvent('call:camera', {
          detail: { userId, cameraOn },
        })
      );
    });

    this.activeListeners.add('call');
  }

  /**
   * Initialize notification-related real-time features
   */
  initializeNotificationListeners() {
    // New notification
    socketNotification.onNewNotification((data) => {
      const { addNotification } = useNotificationStore.getState();
      addNotification(data);
    });

    this.activeListeners.add('notification');
  }

  /**
   * Join a conversation for real-time updates
   */
  joinConversation(conversationId, userId) {
    socketChat.joinConversation(conversationId, userId);
    this.activeListeners.add(`conversation:${conversationId}`);
  }

  /**
   * Leave a conversation
   */
  leaveConversation(conversationId, userId) {
    socketChat.leaveConversation(conversationId, userId);
    this.activeListeners.delete(`conversation:${conversationId}`);
  }

  /**
   * Emit typing indicator
   */
  emitTyping(conversationId, userId, username) {
    socketChat.typing(conversationId, userId, username);
  }

  /**
   * Stop typing indicator
   */
  stopTyping(conversationId, userId) {
    socketChat.stopTyping(conversationId, userId);
  }

  /**
   * Send message and emit socket event
   */
  async sendMessage(conversationId, content, attachments = []) {
    const { currentUser } = useUserStore.getState();
    const messageData = {
      conversationId,
      senderId: currentUser._id,
      senderName: currentUser.name,
      content,
      attachments,
      timestamp: Date.now(),
    };

    socketChat.sendMessage(messageData);
  }

  /**
   * Confirm message delivery
   */
  confirmMessageDelivery(messageId) {
    socketChat.messageDelivered(messageId);
  }

  /**
   * Confirm message seen
   */
  confirmMessageSeen(conversationId, userId) {
    socketChat.messageSeen(conversationId, userId);
  }

  /**
   * Edit message
   */
  editMessage(messageId, content) {
    socketChat.editMessage({
      messageId,
      content,
      timestamp: Date.now(),
    });
  }

  /**
   * Delete message
   */
  deleteMessage(messageId) {
    socketChat.deleteMessage({ messageId });
  }

  /**
   * Add reaction to message
   */
  addReaction(messageId, reaction) {
    const { currentUser } = useUserStore.getState();
    socketChat.addReaction({
      messageId,
      reaction,
      userId: currentUser._id,
      timestamp: Date.now(),
    });
  }

  /**
   * Set user status
   */
  setUserStatus(userId, status) {
    if (status === 'online') {
      socketPresence.userOnline(userId);
    } else if (status === 'away') {
      socketPresence.userAway(userId);
    } else if (status === 'offline') {
      socketPresence.userOffline(userId);
    }
  }

  /**
   * Get online users
   */
  requestOnlineUsers() {
    socketPresence.getOnlineUsers();
  }

  /**
   * Emit user activity
   */
  emitActivity(userId) {
    socketPresence.userActivity(userId);
  }

  /**
   * Initiate a call
   */
  initiateCall(targetUserId, conversationId) {
    const { currentUser } = useUserStore.getState();
    socketCall.initiateCall({
      targetUserId,
      conversationId,
      callerId: currentUser._id,
      callerName: currentUser.name,
      timestamp: Date.now(),
    });
  }

  /**
   * Accept a call
   */
  acceptCall(callId) {
    socketCall.acceptCall({ callId });
  }

  /**
   * Decline a call
   */
  declineCall(callId) {
    const { currentUser } = useUserStore.getState();
    socketCall.declineCall({
      callId,
      declinedBy: currentUser._id,
    });
  }

  /**
   * End a call
   */
  endCall(callId) {
    socketCall.endCall({ callId });
  }

  /**
   * Send WebRTC offer
   */
  sendWebRTCOffer(callId, offer) {
    socketCall.sendOffer({
      callId,
      offer,
    });
  }

  /**
   * Send WebRTC answer
   */
  sendWebRTCAnswer(callId, answer) {
    socketCall.sendAnswer({
      callId,
      answer,
    });
  }

  /**
   * Send ICE candidate
   */
  sendICECandidate(callId, candidate) {
    socketCall.sendICECandidate({
      callId,
      candidate,
    });
  }

  /**
   * Toggle mute during call
   */
  toggleMute(callId, isMuted) {
    const { currentUser } = useUserStore.getState();
    socketCall.toggleMute({
      callId,
      userId: currentUser._id,
      isMuted,
    });
  }

  /**
   * Toggle camera during call
   */
  toggleCamera(callId, cameraOn) {
    const { currentUser } = useUserStore.getState();
    socketCall.toggleCamera({
      callId,
      userId: currentUser._id,
      cameraOn,
    });
  }

  /**
   * Clean up all listeners
   */
  cleanupAllListeners() {
    // Chat listeners
    socketChat.offNewMessage();
    socketChat.offUserTyping();
    socketChat.offUserStopTyping();
    socketChat.offMessageSeen();
    socketChat.offMessageEdited();
    socketChat.offMessageDeleted();
    socketChat.offReactionAdded();

    // Presence listeners
    socketPresence.offUserStatusChanged();
    socketPresence.offOnlineUsers();

    // Call listeners
    socketCall.offIncomingCall();
    socketCall.offCallAccepted();
    socketCall.offCallDeclined();
    socketCall.offCallEnded();
    socketCall.offOffer();
    socketCall.offAnswer();
    socketCall.offICECandidate();
    socketCall.offMuteStatusChange();
    socketCall.offCameraStatusChange();

    // Notification listeners
    socketNotification.offNewNotification();

    // Clear typing timers
    this.typingTimers.forEach((timerId) => clearTimeout(timerId));
    this.typingTimers.clear();

    // Clear active listeners
    this.activeListeners.clear();
  }

  /**
   * Check if specific feature is initialized
   */
  isInitialized(feature = 'all') {
    return this.activeListeners.has(feature);
  }
}

// Create singleton instance
const liveFeatures = new LiveFeaturesService();

export default liveFeatures;
