// Chat Page
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuthStore } from '@store/authStore';
import { useChatStore } from '@store/chatStore';
import { useUIStore } from '@store/uiStore';
import { useAutoScroll } from '@hooks/useAutoScroll';
import { debounce } from '@utils/performance';
import MessageBubble from '@components/chat/MessageBubble';
import MessageInput from '@components/chat/MessageInput';
import { SkeletonLoader } from '@components/animations';
import SettingsPage from '@pages/SettingsPage';
import { motion, AnimatePresence } from 'framer-motion';

const ChatPage = () => {
  const { user, logout } = useAuthStore();
  const { conversations, currentConversation, messages } = useChatStore();
  const { sidebarOpen } = useUIStore();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [currentView, setCurrentView] = useState('chat'); // 'chat' or 'settings'
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { containerRef, handleScroll } = useAutoScroll(
    selectedConversation?._id,
    true
  );

  // Memoize filtered conversations based on search
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    
    const query = searchQuery.toLowerCase();
    return conversations.filter((conversation) => {
      const name = conversation.isGroupChat
        ? conversation.name.toLowerCase()
        : conversation.participants
            .filter((p) => p._id !== user._id)
            .map((p) => p.username.toLowerCase())
            .join(', ');
      
      return name.includes(query) || 
             conversation.lastMessage?.content?.toLowerCase().includes(query);
    });
  }, [conversations, searchQuery, user]);

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((query) => {
      setSearchQuery(query);
    }, 300),
    []
  );

  const handleSearchChange = useCallback((e) => {
    debouncedSearch(e.target.value);
  }, [debouncedSearch]);

  // Memoize callback functions
  const handleSelectConversation = useCallback((conversation) => {
    setSelectedConversation(conversation);
  }, []);

  const handleSendMessage = useCallback((content, replyToId) => {
    console.log('Send message:', content, replyToId);
    // Implement message sending logic
  }, []);

  const handleReply = useCallback((message) => {
    console.log('Reply to:', message);
  }, []);

  const handleDelete = useCallback((messageId) => {
    console.log('Delete message:', messageId);
  }, []);

  const handleEdit = useCallback((message) => {
    console.log('Edit message:', message);
  }, []);

  const handleReact = useCallback((messageId, emoji) => {
    console.log('React to message:', messageId, emoji);
  }, []);

  const handleLogout = useCallback(() => {
    logout().then(() => window.location.href = '/login');
  }, [logout]);

  useEffect(() => {
    // Load conversations on mount
  }, []);

  // If viewing settings, show settings page
  if (currentView === 'settings') {
    return (
      <div className="flex h-screen bg-white dark:bg-dark-900">
        {/* Sidebar */}
        <motion.div
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.3 }}
          className={`w-80 bg-white dark:bg-dark-800 border-r border-gray-200 dark:border-dark-700 flex flex-col ${
            !sidebarOpen ? 'hidden' : ''
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-dark-700 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              FreeCall
            </h1>
            <button
              onClick={() => setCurrentView('chat')}
              className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition"
              title="Back to chat"
            >
              ✕
            </button>
          </div>

          {/* Sidebar Menu */}
          <div className="p-4 space-y-2">
            <button
              onClick={() => setCurrentView('chat')}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition text-gray-900 dark:text-white"
            >
              💬 Back to Chat
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition text-red-600 dark:text-red-400"
            >
              🚪 Logout
            </button>
          </div>
        </motion.div>

        {/* Settings Page */}
        <SettingsPage />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white dark:bg-dark-900">
      {/* Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3 }}
        className={`w-80 bg-white dark:bg-dark-800 border-r border-gray-200 dark:border-dark-700 flex flex-col ${
          !sidebarOpen ? 'hidden' : ''
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-dark-700 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            FreeCall
          </h1>
          <button
            onClick={() => setCurrentView('settings')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition"
            title="Settings"
          >
            ⚙️
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search Bar */}
          <div className="p-3 border-b border-gray-200 dark:border-dark-700">
            <input
              type="text"
              placeholder="Search conversations..."
              onChange={handleSearchChange}
              defaultValue={searchQuery}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-700 text-gray-900 dark:text-white rounded-lg border border-transparent focus:border-blue-500 focus:outline-none text-sm"
            />
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map((conversation) => (
              <motion.div
                key={conversation._id}
                onClick={() => handleSelectConversation(conversation)}
                whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                className={`p-4 border-b border-gray-200 dark:border-dark-700 cursor-pointer transition ${
                  selectedConversation?._id === conversation._id
                    ? 'bg-blue-50 dark:bg-dark-700'
                    : ''
                }`}
              >
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {conversation.isGroupChat
                    ? conversation.name
                    : conversation.participants
                        .filter((p) => p._id !== user._id)
                        .map((p) => p.username)
                        .join(', ')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {conversation.lastMessage?.content || 'No messages yet'}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-dark-700">
          <div className="flex items-center gap-3">
            <img
              src={user?.profilePicture || '/default-avatar.png'}
              alt={user?.username}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                @{user?.username}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Chat Area */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 p-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {selectedConversation.isGroupChat
                ? selectedConversation.name
                : selectedConversation.participants
                    .filter((p) => p._id !== user._id)
                    .map((p) => p.username)
                    .join(', ')}
            </h2>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">
                📞
              </button>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">
                📹
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={containerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-dark-900"
          >
            <AnimatePresence>
              {isLoadingMessages ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <SkeletonLoader variant="message" count={3} />
                </motion.div>
              ) : messages[selectedConversation._id]?.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ staggerChildren: 0.05 }}
                >
                  {messages[selectedConversation._id]?.map((message) => (
                    <MessageBubble
                      key={message._id}
                      message={message}
                      isOwn={message.senderId._id === user._id}
                      onReply={handleReply}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                      onReact={handleReact}
                    />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center justify-center h-full"
                >
                  <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                      No messages yet. Start the conversation!
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Input */}
          <MessageInput
            onSendMessage={handleSendMessage}
            onTyping={() => {}}
          />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-dark-900"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="text-center"
          >
            <motion.p
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-gray-600 dark:text-gray-400 text-lg"
            >
              Select a conversation to start messaging
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default ChatPage;
