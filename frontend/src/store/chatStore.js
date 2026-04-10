// Chat Store
import { create } from 'zustand';
import { chatAPI } from '../services/api.js';

export const useChatStore = create((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: {},
  isLoading: false,
  error: null,
  typingUsers: {},

  // Get conversations
  getConversations: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await chatAPI.getConversations();
      set({ conversations: response.conversations, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Get or create conversation
  getOrCreateConversation: async (userId) => {
    try {
      const response = await chatAPI.getOrCreateConversation(userId);
      const conversation = response.conversation;
      
      set(state => ({
        conversations: [
          conversation,
          ...state.conversations.filter(c => c._id !== conversation._id),
        ],
        currentConversation: conversation,
      }));

      return conversation;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Get messages
  getMessages: async (conversationId, limit = 50, skip = 0) => {
    try {
      const response = await chatAPI.getMessages(conversationId, limit, skip);
      const messages = response.messages;

      set(state => ({
        messages: {
          ...state.messages,
          [conversationId]: [
            ...(state.messages[conversationId] || []),
            ...messages,
          ],
        },
      }));

      return messages;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Add message (optimistic)
  addMessage: (conversationId, message) => {
    set(state => ({
      messages: {
        ...state.messages,
        [conversationId]: [...(state.messages[conversationId] || []), message],
      },
    }));
  },

  // Update message
  updateMessage: (conversationId, messageId, updates) => {
    set(state => ({
      messages: {
        ...state.messages,
        [conversationId]: state.messages[conversationId].map(msg =>
          msg._id === messageId ? { ...msg, ...updates } : msg
        ),
      },
    }));
  },

  // Delete message
  deleteMessage: (conversationId, messageId) => {
    set(state => ({
      messages: {
        ...state.messages,
        [conversationId]: state.messages[conversationId].filter(
          msg => msg._id !== messageId
        ),
      },
    }));
  },

  // Set typing user
  setTypingUser: (conversationId, userId, username) => {
    set(state => ({
      typingUsers: {
        ...state.typingUsers,
        [conversationId]: { userId, username },
      },
    }));
  },

  // Remove typing user
  removeTypingUser: (conversationId) => {
    set(state => {
      const newTyping = { ...state.typingUsers };
      delete newTyping[conversationId];
      return { typingUsers: newTyping };
    });
  },

  // Set current conversation
  setCurrentConversation: (conversation) => {
    set({ currentConversation: conversation });
  },

  clearError: () => set({ error: null }),
}));
