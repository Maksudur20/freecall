// Protected Route Component
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@store/authStore';
import LoadingScreen from '../common/LoadingScreen';

const ProtectedRoute = () => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
