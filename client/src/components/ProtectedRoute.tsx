import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { useEffect } from 'react';
import { Loader } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'user';
}

export default function ProtectedRoute({ children, requiredRole = 'admin' }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && (!user || user.role !== requiredRole)) {
      // Redirect to home if not authenticated or doesn't have required role
      setLocation('/');
    }
  }, [user, loading, requiredRole, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--black)] text-[var(--white)] flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} className="mx-auto mb-4 animate-spin text-[var(--gold)]" />
          <p className="text-[var(--white-dim)]">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}
