import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';

// ============================================
// ROLE PROTECTED ROUTE
// Protegge le route in base al ruolo utente
// ============================================

interface RoleProtectedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallbackPath?: string;
}

export const RoleProtectedRoute = ({
  children,
  allowedRoles,
  fallbackPath = '/dashboard'
}: RoleProtectedRouteProps) => {
  const { user, token } = useAuthStore();

  // Non autenticato - redirect a login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Ruolo non autorizzato - redirect a fallback
  if (!user || !allowedRoles.includes(user.ruolo)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

// ============================================
// HOOK PER VERIFICARE PERMESSI
// ============================================

export const useUserRole = () => {
  const { user } = useAuthStore();

  const isAdmin = user?.ruolo === UserRole.ADMIN;
  const isInstallatore = user?.ruolo === UserRole.INSTALLATORE;
  const isCliente = user?.ruolo === UserRole.CLIENTE;

  const hasRole = (roles: UserRole[]) => {
    return user ? roles.includes(user.ruolo) : false;
  };

  const canManageImpianti = isAdmin || isInstallatore;
  const canManageDispositivi = isAdmin || isInstallatore;
  const canManageUsers = isAdmin;
  const canControlDevices = true; // Tutti possono controllare dispositivi

  return {
    role: user?.ruolo,
    isAdmin,
    isInstallatore,
    isCliente,
    hasRole,
    canManageImpianti,
    canManageDispositivi,
    canManageUsers,
    canControlDevices,
  };
};
