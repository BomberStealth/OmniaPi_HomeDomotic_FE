import { motion, AnimatePresence } from 'framer-motion';
import { useThemeColors } from '@/hooks/useThemeColors';

// ============================================
// CONFIRM POPUP - Universal Confirmation Dialog
// Replaces native confirm() with styled popup
// ============================================

interface ConfirmPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'danger' | 'warning' | 'primary';
  icon?: React.ReactNode;
}

export function ConfirmPopup({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Conferma',
  cancelText = 'Annulla',
  confirmVariant = 'primary',
  icon
}: ConfirmPopupProps) {
  const { colors } = useThemeColors();

  const variantColors = {
    danger: '#ef4444',
    warning: '#f59e0b',
    primary: colors.accent
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: colors.bgCard,
            borderRadius: '1rem',
            padding: '1.5rem',
            maxWidth: '400px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            {icon && (
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '0.75rem',
                background: `${variantColors[confirmVariant]}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: variantColors[confirmVariant]
              }}>
                {icon}
              </div>
            )}
            <h3 style={{ color: colors.textPrimary, fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
              {title}
            </h3>
          </div>

          {/* Message */}
          <p style={{ color: colors.textMuted, marginBottom: '1.5rem', lineHeight: 1.5 }}>
            {message}
          </p>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '0.5rem',
                border: `1px solid ${colors.border}`,
                background: 'transparent',
                color: colors.textMuted,
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: variantColors[confirmVariant],
                color: 'white',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
