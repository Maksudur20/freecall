// Settings Page
import { useState } from 'react';
import { useAuthStore } from '@store/authStore';
import { PageTransition } from '@components/animations';
import DeleteAccountModal from '@components/settings/DeleteAccountModal';
import { motion } from 'framer-motion';

const SettingsPage = () => {
  const { user, logout } = useAuthStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('darkMode') === 'true'
  );

  const handleDarkModeToggle = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleDeleteAccountClick = () => {
    setShowDeleteModal(true);
  };

  const handleCloseModal = () => {
    setShowDeleteModal(false);
  };

  const handleAccountDeleted = () => {
    // Logout and redirect
    logout();
    window.location.href = '/login';
  };

  return (
    <PageTransition className="flex h-screen bg-white dark:bg-dark-900">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="max-w-2xl mx-auto p-6"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your account settings and preferences
            </p>
          </div>

          {/* User Info Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-dark-800 rounded-xl shadow-lg p-6 mb-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Account Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username
                </label>
                <p className="text-gray-900 dark:text-white font-medium">
                  {user?.username}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <p className="text-gray-900 dark:text-white font-medium">
                  {user?.email}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <p className="text-gray-900 dark:text-white font-medium">
                  {user?.firstName} {user?.lastName}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Account Created
                </label>
                <p className="text-gray-900 dark:text-white font-medium">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Preferences Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-dark-800 rounded-xl shadow-lg p-6 mb-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Preferences
            </h2>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Dark Mode
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Toggle dark mode for the application
                </p>
              </div>

              <button
                onClick={handleDarkModeToggle}
                className={`relative w-14 h-8 rounded-full transition-all ${
                  darkMode
                    ? 'bg-blue-600'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <motion.div
                  animate={{ x: darkMode ? 28 : 4 }}
                  className="w-6 h-6 bg-white rounded-full absolute top-1"
                />
              </button>
            </div>
          </motion.div>

          {/* Danger Zone Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-6"
          >
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
              ⚠️ Danger Zone
            </h2>

            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Irreversible and destructive actions
            </p>

            <button
              onClick={handleDeleteAccountClick}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2"
            >
              <span>🗑️</span>
              Delete Account Permanently
            </button>

            <p className="text-sm text-red-600 dark:text-red-400 mt-4">
              This action cannot be undone. All your data will be permanently deleted.
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <DeleteAccountModal
          onClose={handleCloseModal}
          onSuccess={handleAccountDeleted}
        />
      )}
    </PageTransition>
  );
};

export default SettingsPage;
