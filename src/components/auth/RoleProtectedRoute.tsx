import { ReactNode, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';
import { toast } from 'sonner';

// ============================================
// ROLE PROTECTED ROUTE
// Protegge le route in base al ruolo utente
// ============================================

// Permessi per ruolo - quali route può accedere ogni ruolo
export const rolePermissions: Record<string, string[]> = {
  admin: ['*'], // accesso a tutto
  installatore: [
    '/setup',
    '/dashboard',
    '/stanze',
    '/dispositivi',
    '/scene',
    '/settings',
    '/notifications',
    '/impianti',
    '/impianto'  // /impianto/settings
  ],
  proprietario: [
    '/dashboard',
    '/stanze',
    '/dispositivi',
    '/scene',
    '/settings',
    '/notifications',
    '/impianti',
    '/impianto'  // /impianto/settings
  ],
  ospite: [
    '/dashboard',
    '/settings',
    '/impianto'  // /impianto/settings (view-only)
  ]
};

// Verifica se un path è autorizzato per un ruolo
export const isPathAllowed = (role: string | undefined, path: string): boolean => {
  if (!role) return false;

  const permissions = rolePermissions[role];
  if (!permissions) return false;

  // Admin ha accesso a tutto
  if (permissions.includes('*')) return true;

  // Controlla se il path inizia con uno dei permessi
  // Es: /settings/profilo è permesso se /settings è nella lista
  return permissions.some(allowedPath =>
    path === allowedPath || path.startsWith(`${allowedPath}/`)
  );
};

interface RoleProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[]; // Opzionale: lista specifica di ruoli permessi
  fallbackPath?: string;
}

export const RoleProtectedRoute = ({
  children,
  allowedRoles,
  fallbackPath = '/dashboard'
}: RoleProtectedRouteProps) => {
  const { user, token } = useAuthStore();
  const location = useLocation();
  const hasShownToast = useRef(false);

  // Non autenticato - redirect a login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Se l'utente non è ancora caricato, aspetta (mostra loading)
  // Questo evita redirect prematuri durante il caricamento iniziale
  if (!user) {
    return null; // Il PageLoader di Suspense mostrerà il loading
  }

  const userRole = user.ruolo;
  const currentPath = location.pathname;

  // Se sono specificati ruoli specifici, controlla quelli
  // Cast a stringa per sicurezza (il backend potrebbe restituire stringa invece di enum)
  const isAllowed = allowedRoles
    ? allowedRoles.some(role => role === userRole || role === String(userRole))
    : isPathAllowed(userRole, currentPath);

  // Ruolo non autorizzato - mostra toast e redirect
  if (!isAllowed) {
    // Mostra toast solo una volta per redirect (evita spam)
    if (!hasShownToast.current) {
      hasShownToast.current = true;
      setTimeout(() => {
        toast.error('Accesso non autorizzato');
      }, 100);
    }

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
  const isProprietario = user?.ruolo === UserRole.PROPRIETARIO;
  const isOspite = user?.ruolo === UserRole.OSPITE;

  const hasRole = (roles: UserRole[]) => {
    return user ? roles.includes(user.ruolo) : false;
  };

  // Permessi specifici
  const canAccessSetup = isAdmin || isInstallatore;
  const canManageImpianti = isAdmin || isInstallatore;
  const canManageDispositivi = isAdmin || isInstallatore;
  const canManageUsers = isAdmin;
  const canControlDevices = !isOspite; // Ospite può solo vedere
  const canManageScene = !isOspite;
  const canAccessStanze = !isOspite;

  // Verifica se può accedere a un path specifico
  const canAccessPath = (path: string) => isPathAllowed(user?.ruolo, path);

  return {
    role: user?.ruolo,
    isAdmin,
    isInstallatore,
    isProprietario,
    isOspite,
    hasRole,
    canAccessSetup,
    canManageImpianti,
    canManageDispositivi,
    canManageUsers,
    canControlDevices,
    canManageScene,
    canAccessStanze,
    canAccessPath,
  };
};
