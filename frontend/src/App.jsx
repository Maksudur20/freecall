import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LoadingScreen from '@components/common/LoadingScreen';
import ProtectedRoute from '@components/auth/ProtectedRoute';
import { useUIStore } from '@store/uiStore';

// Lazy load pages
const LoginPage = lazy(() => import('@pages/LoginPage'));
const RegisterPage = lazy(() => import('@pages/RegisterPage'));
const ChatPage = lazy(() => import('@pages/ChatPage'));
const ProfilePage = lazy(() => import('@pages/index').then(m => ({ default: m.ProfilePage })));
const FriendsPage = lazy(() => import('@pages/index').then(m => ({ default: m.FriendsPage })));
const SettingsPage = lazy(() => import('@pages/index').then(m => ({ default: m.SettingsPage })));
const TermsPage = lazy(() => import('@pages/index').then(m => ({ default: m.TermsPage })));
const NotFoundPage = lazy(() => import('@pages/index').then(m => ({ default: m.NotFoundPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

function App() {
  const isDarkMode = useUIStore(state => state.isDarkMode);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/terms" element={<TermsPage />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/profile/:userId" element={<ProfilePage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/friends" element={<FriendsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Catch all */}
            <Route path="/" element={<Navigate to="/chat" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </Router>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}

export default App;
