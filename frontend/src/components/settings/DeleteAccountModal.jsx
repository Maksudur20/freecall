// Delete Account Modal
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { userAPI } from '@services/api';

const DeleteAccountModal = ({ onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [confirmationText, setConfirmationText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // Step 1: Warning, Step 2: Confirm

  const isConfirmationValid = confirmationText === 'DELETE MY ACCOUNT';
  const isFormValid = password.length >= 8 && isConfirmationValid;

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error) setError('');
  };

  const handleConfirmationChange = (e) => {
    setConfirmationText(e.target.value);
  };

  const handleProceed = () => {
    if (isConfirmationValid) {
      setStep(2);
    }
  };

  const handleDelete = async () => {
    if (!isFormValid) return;

    setLoading(true);
    setError('');

    try {
      const response = await userAPI.deleteAccount(password);
      
      if (response.success) {
        // Clear local storage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');

        // Call success callback
        onSuccess();
      } else {
        setError(response.error || 'Failed to delete account');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while deleting your account');
      console.error('Delete account error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (step === 2) {
      setStep(1);
      setPassword('');
      setConfirmationText('');
    } else {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          {/* Step 1: Warning */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="p-8"
              >
                {/* Header with Icon */}
                <div className="text-center mb-8">
                  <div className="text-6xl mb-4">⚠️</div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Delete Account?
                  </h2>
                  <p className="text-red-600 dark:text-red-400 font-semibold">
                    This action is permanent
                  </p>
                </div>

                {/* Warning Message */}
                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600 p-4 mb-6 rounded">
                  <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">
                    By deleting your account:
                  </h3>
                  <ul className="text-sm text-red-700 dark:text-red-400 space-y-1">
                    <li>✓ Your profile will be permanently deleted</li>
                    <li>✓ All your messages will be removed</li>
                    <li>✓ All friend connections will be severed</li>
                    <li>✓ All conversations will be deleted</li>
                    <li>✓ This cannot be undone or recovered</li>
                  </ul>
                </div>

                {/* Confirmation Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    To confirm, type "DELETE MY ACCOUNT" below:
                  </label>
                  <input
                    type="text"
                    value={confirmationText}
                    onChange={handleConfirmationChange}
                    placeholder="Type DELETE MY ACCOUNT"
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-red-600 dark:focus:border-red-400 focus:outline-none bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => onClose()}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProceed}
                    disabled={!isConfirmationValid}
                    className={`flex-1 font-semibold py-2 px-4 rounded-lg transition duration-200 ${
                      isConfirmationValid
                        ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Password Confirmation */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="p-8"
              >
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="text-5xl mb-4">🔐</div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Confirm Password
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                    Enter your password to permanently delete your account
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6 text-sm"
                  >
                    ❌ {error}
                  </motion.div>
                )}

                {/* Password Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="Enter your password"
                    autoFocus
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-600 dark:focus:border-blue-400 focus:outline-none bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Warning */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-600 p-3 mb-6 rounded text-sm">
                  <p className="text-yellow-800 dark:text-yellow-300">
                    <strong>⚠️ After deletion:</strong> You will be automatically logged out from all devices.
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={!isFormValid || loading}
                    className={`flex-1 font-semibold py-2 px-4 rounded-lg transition duration-200 ${
                      isFormValid && !loading
                        ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Deleting...
                      </div>
                    ) : (
                      'Delete My Account'
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DeleteAccountModal;
