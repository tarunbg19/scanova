import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AccessDenied from '../pages/AccessDenied';

export default function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07080d] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-scanova-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}
