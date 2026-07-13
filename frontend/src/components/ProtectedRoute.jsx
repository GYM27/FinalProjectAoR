import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, perfil } = useAuthStore();

  // Se não estiver autenticado na memória central, barra o acesso imediatamente
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(perfil)) {
    alert('Acesso Negado: Não tem permissões para aceder a esta página.');
    const fallbackPath = perfil === 'ADMIN' ? '/users' : '/dashboard';
    return <Navigate to={fallbackPath} replace />;
  }

  // Se estiver autenticado, permite que o React Router renderize a página interna (o MainLayout)
  return <Outlet />;
}
