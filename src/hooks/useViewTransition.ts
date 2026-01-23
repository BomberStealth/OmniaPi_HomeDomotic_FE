import { useNavigate, NavigateOptions } from 'react-router-dom';
import { useCallback } from 'react';

// ============================================
// VIEW TRANSITIONS HOOK
// Usa la View Transitions API per transizioni fluide
// Fallback automatico per browser non supportati
// ============================================

export const useViewTransitionNavigate = () => {
  const navigate = useNavigate();

  const navigateWithTransition = useCallback((to: string | number, options?: NavigateOptions) => {
    // Se è un numero (come -1 per tornare indietro)
    if (typeof to === 'number') {
      if (document.startViewTransition) {
        document.startViewTransition(() => {
          navigate(to);
        });
      } else {
        navigate(to);
      }
      return;
    }

    // Se è una stringa (path)
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        navigate(to, options);
      });
    } else {
      navigate(to, options);
    }
  }, [navigate]);

  return navigateWithTransition;
};

// Hook per controllare se View Transitions è supportato
export const useViewTransitionsSupported = () => {
  return typeof document !== 'undefined' && 'startViewTransition' in document;
};
