// API Service
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('accessToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Try to refresh token
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return apiCall(endpoint, options);
      }
      // Log out user
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return null;
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

const refreshAccessToken = async () => {
  try {
    const response = await fetch(`${API_URL}/api/auth/refresh-token`, {
      method: 'POST',
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('accessToken', data.accessToken);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
};

export const authAPI = {
  register: (username, email, password) =>
    apiCall('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, confirmPassword: password }),
    }),

  login: (email, password) =>
    apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getCurrentUser: () => apiCall('/api/auth/me'),

  logout: () =>
    apiCall('/api/auth/logout', {
      method: 'POST',
    }),

  refreshToken: () => apiCall('/api/auth/refresh-token', { method: 'POST' }),
};

export const userAPI = {
  getProfile: (userId) => apiCall(`/api/users/profile/${userId}`),

  getCurrentUserProfile: () => apiCall('/api/users/profile'),

  updateProfile: (data) =>
    apiCall('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  uploadProfilePicture: (file) => {
    const formData = new FormData();
    formData.append('profilePicture', file);

    return apiCall('/api/users/profile/picture', {
      method: 'POST',
      body: formData,
      headers: {}, // Remove Content-Type to let browser set it
    });
  },

  deleteAccount: (password) =>
    apiCall('/api/users/account', {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    }),

  searchUsers: (query, limit = 10) =>
    apiCall(`/api/users/search?q=${encodeURIComponent(query)}&limit=${limit}`),

  getFriends: () => apiCall('/api/users/friends'),

  getFriendSuggestions: (limit = 5) =>
    apiCall(`/api/users/suggestions?limit=${limit}`),

  blockUser: (userId) =>
    apiCall('/api/users/block', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),

  unblockUser: (userId) =>
    apiCall('/api/users/unblock', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
};

export const friendAPI = {
  sendRequest: (recipientId, message = '') =>
    apiCall('/api/friends/request/send', {
      method: 'POST',
      body: JSON.stringify({ recipientId, message }),
    }),

  acceptRequest: (requestId) =>
    apiCall('/api/friends/request/accept', {
      method: 'POST',
      body: JSON.stringify({ requestId }),
    }),

  rejectRequest: (requestId) =>
    apiCall('/api/friends/request/reject', {
      method: 'POST',
      body: JSON.stringify({ requestId }),
    }),

  getPendingRequests: () => apiCall('/api/friends/requests/pending'),

  getSentRequests: () => apiCall('/api/friends/requests/sent'),

  removeFriend: (friendId) =>
    apiCall('/api/friends/remove', {
      method: 'POST',
      body: JSON.stringify({ friendId }),
    }),
};

export const chatAPI = {
  getConversations: (limit = 20) =>
    apiCall(`/api/chat/conversations?limit=${limit}`),

  getOrCreateConversation: (userId) =>
    apiCall(`/api/chat/conversation/${userId}`),

  getMessages: (conversationId, limit = 50, skip = 0) =>
    apiCall(
      `/api/chat/messages/${conversationId}?limit=${limit}&skip=${skip}`
    ),

  sendMessage: (conversationId, content, messageType = 'text', replyTo = null) =>
    apiCall('/api/chat/message/send', {
      method: 'POST',
      body: JSON.stringify({ conversationId, content, messageType, replyTo }),
    }),

  editMessage: (messageId, content) =>
    apiCall('/api/chat/message/edit', {
      method: 'PUT',
      body: JSON.stringify({ messageId, content }),
    }),

  deleteMessage: (messageId, deleteForEveryone = false) =>
    apiCall('/api/chat/message', {
      method: 'DELETE',
      body: JSON.stringify({ messageId, deleteForEveryone }),
    }),

  addReaction: (messageId, emoji) =>
    apiCall('/api/chat/message/reaction', {
      method: 'POST',
      body: JSON.stringify({ messageId, emoji }),
    }),

  markMessagesSeen: (conversationId) =>
    apiCall('/api/chat/messages/mark-seen', {
      method: 'POST',
      body: JSON.stringify({ conversationId }),
    }),

  uploadMedia: (conversationId, files) => {
    const formData = new FormData();
    formData.append('conversationId', conversationId);
    files.forEach(file => formData.append('files', file));

    return apiCall('/api/chat/upload', {
      method: 'POST',
      body: formData,
      headers: {},
    });
  },
};

export const notificationAPI = {
  getNotifications: (limit = 20, skip = 0) =>
    apiCall(`/api/notifications?limit=${limit}&skip=${skip}`),

  markAsRead: (notificationId) =>
    apiCall('/api/notifications/mark-read', {
      method: 'POST',
      body: JSON.stringify({ notificationId }),
    }),

  markAllAsRead: () =>
    apiCall('/api/notifications/mark-all-read', {
      method: 'POST',
    }),

  getUnreadCount: () => apiCall('/api/notifications/unread-count'),

  deleteNotification: (notificationId) =>
    apiCall(`/api/notifications/${notificationId}`, {
      method: 'DELETE',
    }),
};

export default {
  authAPI,
  userAPI,
  friendAPI,
  chatAPI,
  notificationAPI,
};
