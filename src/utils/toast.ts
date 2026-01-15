// ============================================
// TOAST UTILITIES - Custom duration per type
// Success/Info: 500ms, Error: 2000ms
// ============================================

import { toast as sonnerToast, ExternalToast } from 'sonner';

type ToastOptions = ExternalToast;

// Success toast - 0.5 secondi
export const toastSuccess = (message: string, options?: ToastOptions) => {
  sonnerToast.success(message, { duration: 500, ...options });
};

// Error toast - 2 secondi
export const toastError = (message: string, options?: ToastOptions) => {
  sonnerToast.error(message, { duration: 2000, ...options });
};

// Info toast - 0.5 secondi
export const toastInfo = (message: string, options?: ToastOptions) => {
  sonnerToast.info(message, { duration: 500, ...options });
};

// Warning toast - 1.5 secondi
export const toastWarning = (message: string, options?: ToastOptions) => {
  sonnerToast.warning(message, { duration: 1500, ...options });
};

// Export default toast object per compatibilità
export const toast = {
  success: toastSuccess,
  error: toastError,
  info: toastInfo,
  warning: toastWarning,
};

export default toast;
