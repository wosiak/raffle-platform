import React from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireMaster?: boolean;
}

export default function ProtectedRoute({ children, requireMaster = false }: ProtectedRouteProps) {
  const { user, loading, isMaster } = useAuth();
  const location = useLocation();
  const { companySlug } = useParams<{ companySlug?: string }>();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirecionar para login da empresa ou login geral
    const loginPath = companySlug ? `/${companySlug}/login` : '/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (requireMaster && !isMaster) {
    return <Navigate to="/" replace />;
  }

  // Verificar se admin está tentando acessar empresa diferente da sua
  if (!isMaster && companySlug && user.company_slug !== companySlug) {
    return <Navigate to={`/${user.company_slug}/dashboard`} replace />;
  }

  return <>{children}</>;
}
