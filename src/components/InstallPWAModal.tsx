import { motion, AnimatePresence } from 'framer-motion';
import { RiDownloadLine, RiCloseLine, RiSmartphoneLine } from 'react-icons/ri';
import { useThemeColor } from '@/contexts/ThemeColorContext';

interface InstallPWAModalProps {
  isOpen: boolean;
  onInstall: () => void;
  onDismiss: () => void;
}

// Helper per convertire hex a rgb
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '106, 212, 160';
};

export const InstallPWAModal = ({ isOpen, onInstall, onDismiss }: InstallPWAModalProps) => {
  const { colors } = useThemeColor();

  const cardBackground = 'linear-gradient(165deg, #2a2722 0%, #1e1c18 50%, #1a1816 100%)';
  const borderColor = `rgba(${hexToRgb(colors.accent)}, 0.2)`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
          onClick={onDismiss}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm p-6 rounded-2xl"
            style={{
              background: cardBackground,
              border: `1px solid ${borderColor}`,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div className="flex justify-between items-start mb-4">
              <div
                className="p-3 rounded-xl"
                style={{ backgroundColor: `rgba(${hexToRgb(colors.accent)}, 0.15)` }}
              >
                <RiSmartphoneLine size={28} style={{ color: colors.accent }} />
              </div>
              <button
                onClick={onDismiss}
                className="p-2 rounded-lg transition-colors"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
              >
                <RiCloseLine size={20} style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
              </button>
            </div>

            <h2 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '8px'
            }}>
              Installa OmniaPi
            </h2>
            <p style={{
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: '24px',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              Installa l'app sul tuo dispositivo per un accesso rapido e notifiche push anche con il browser chiuso.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onDismiss}
                style={{
                  flex: 1,
                  padding: '14px 16px',
                  borderRadius: '12px',
                  fontWeight: '500',
                  fontSize: '14px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Non ora
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onInstall}
                style={{
                  flex: 1,
                  padding: '14px 16px',
                  borderRadius: '12px',
                  fontWeight: '600',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: colors.accent,
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <RiDownloadLine size={18} />
                Installa
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallPWAModal;
