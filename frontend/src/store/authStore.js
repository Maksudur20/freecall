// Auth Store
import { create } from 'zustand';
import { authAPI } from '../services/api.js';
import { initializeSocket, disconnectSocket } from '../services/socket.js';

export const useAuthStore = create((set, get) => ({
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null,
  accessToken: localStorage.getItem('accessToken'),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login(email, password);
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      
      // Initialize Socket.io
      initializeSocket(response.user._id);

      set({
        user: response.user,
        accessToken: response.accessToken,
        isLoading: false,
      });

      return response.user;
    } catch (error) {
      const errorMsg = error.message || 'Login failed';
      set({ error: errorMsg, isLoading: false });
      throw error;
    }
  },

  register: async (username, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.register(username, email, password);
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);

      // Initialize Socket.io
      initializeSocket(response.user._id);

      set({
        user: response.user,
        accessToken: response.accessToken,
        isLoading: false,
      });

      return response.user;
    } catch (error) {
      const errorMsg = error.message || 'Registration failed';
      set({ error: errorMsg, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authAPI.logout();
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      disconnectSocket();
      set({
        user: null,
        accessToken: null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Logout error:', error);
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  setUser: (user) => set({ user }),
}));
