// User Store
import { create } from 'zustand';
import { userAPI } from '../services/api.js';

export const useUserStore = create((set, get) => ({
  users: {}, // Cache of user profiles
  friends: [],
  friendSuggestions: [],
  onlineUsers: new Set(),
  isLoading: false,
  error: null,

  getUserProfile: async (userId) => {
    try {
      const cached = get().users[userId];
      if (cached) return cached;

      const response = await userAPI.getProfile(userId);
      set(state => ({
        users: {
          ...state.users,
          [userId]: response.user,
        },
      }));

      return response.user;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  getFriends: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await userAPI.getFriends();
      set({ friends: response.friends, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  getFriendSuggestions: async (limit = 5) => {
    try {
      const response = await userAPI.getFriendSuggestions(limit);
      set({ friendSuggestions: response.suggestions });
    } catch (error) {
      set({ error: error.message });
    }
  },

  setOnlineUsers: (users) => {
    set({ onlineUsers: new Set(users.map(u => u._id)) });
  },

  updateUserStatus: (userId, status) => {
    set(state => {
      const newOnlineUsers = new Set(state.onlineUsers);
      if (status === 'online') {
        newOnlineUsers.add(userId);
      } else {
        newOnlineUsers.delete(userId);
      }
      return { onlineUsers: newOnlineUsers };
    });
  },

  searchUsers: async (query) => {
    try {
      const response = await userAPI.searchUsers(query);
      return response.users;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  blockUser: async (userId) => {
    try {
      await userAPI.blockUser(userId);
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  unblockUser: async (userId) => {
    try {
      await userAPI.unblockUser(userId);
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
