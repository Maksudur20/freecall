// Placeholder Pages
import TermsPageComponent from './TermsPage';

// ProfilePage
const ProfilePage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 p-4">
      <div className="max-w-2xl mx-auto bg-white dark:bg-dark-800 rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Profile page coming soon...</p>
      </div>
    </div>
  );
};

// FriendsPage
const FriendsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 p-4">
      <div className="max-w-2xl mx-auto bg-white dark:bg-dark-800 rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Friends</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Friends page coming soon...</p>
      </div>
    </div>
  );
};

// SettingsPage
const SettingsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 p-4">
      <div className="max-w-2xl mx-auto bg-white dark:bg-dark-800 rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Settings page coming soon...</p>
      </div>
    </div>
  );
};

// NotFoundPage
const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">Page not found</p>
      </div>
    </div>
  );
};

export { ProfilePage, FriendsPage, SettingsPage, TermsPageComponent as TermsPage, NotFoundPage };
