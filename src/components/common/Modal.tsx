import { ReactNode, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiCloseLine } from 'react-icons/ri';
import { useThemeColor } from '@/contexts/ThemeColorContext';

// ============================================
// MODAL COMPONENT - Dark Luxury Style
// Con supporto tema dinamico
// ============================================

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// Helper per convertire hex a rgb
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '106, 212, 160';
};

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }: ModalProps) => {
  const { colors: themeColors, modeColors } = useThemeColor();

  // Colori dinamici basati sul tema
  const colors = useMemo(() => ({
    ...modeColors,
    accent: themeColors.accent,
    accentLight: themeColors.accentLight,
    border: `rgba(${hexToRgb(themeColors.accent)}, 0.15)`,
    borderHover: `rgba(${hexToRgb(themeColors.accent)}, 0.35)`,
  }), [themeColors, modeColors]);
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(8px)',
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative w-full ${sizeClasses[size]}`}
            style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
          >
            <div
              style={{
                background: colors.bgCardLit,
                border: `1px solid ${colors.border}`,
                borderRadius: '28px',
                boxShadow: colors.cardShadowLit,
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '85vh',
              }}
            >
              {/* Top edge highlight */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '25%',
                  right: '25%',
                  height: '1px',
                  background: `linear-gradient(90deg, transparent, ${colors.accentLight}4D, transparent)`,
                }}
              />

              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '20px 24px',
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <h2
                  style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: colors.textPrimary,
                    margin: 0,
                  }}
                >
                  {title}
                </h2>
                <motion.button
                  onClick={onClose}
                  style={{
                    padding: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  whileHover={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderColor: colors.borderHover,
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <RiCloseLine size={20} style={{ color: colors.textMuted }} />
                </motion.button>
              </div>

              {/* Content */}
              <div
                style={{
                  padding: '24px',
                  overflowY: 'auto',
                  flex: 1,
                  minHeight: 0,
                }}
              >
                {children}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
