import { useState } from 'react';
import { motion } from 'framer-motion';
import { RiCloseLine } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import { useAdminModeStore } from '@/store/adminModeStore';
import { ConfirmPopup } from '@/components/ui/ConfirmPopup';

// ============================================
// ADMIN MODE BORDER
// Effetto bordo "respiro" + bottone uscita quando in modalità admin
// ============================================

export function AdminModeBorder() {
  const isAdminMode = useAdminModeStore((state) => state.isAdminMode);
  const adminImpiantoNome = useAdminModeStore((state) => state.adminImpiantoNome);
  const exitAdminMode = useAdminModeStore((state) => state.exitAdminMode);
  const navigate = useNavigate();
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  if (!isAdminMode) return null;

  const handleExitAdminMode = async () => {
    await exitAdminMode();
    navigate('/dashboard');
  };

  return (
    <>
      {/* Bordo animato su tutti i lati */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 9998,
        }}
      >
        {/* Bordo con effetto glow pulsante */}
        <motion.div
          animate={{
            boxShadow: [
              'inset 0 0 20px 5px rgba(245, 158, 11, 0.3)',
              'inset 0 0 40px 10px rgba(245, 158, 11, 0.5)',
              'inset 0 0 20px 5px rgba(245, 158, 11, 0.3)',
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 0,
            border: '3px solid rgba(245, 158, 11, 0.6)',
          }}
        />
      </motion.div>

      {/* Banner in alto con bottone X */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.95) 0%, rgba(245, 158, 11, 0.85) 100%)',
          color: 'white',
          padding: '0.5rem 1rem',
          fontWeight: 600,
          fontSize: '0.875rem',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
        }}
      >
        <span style={{ flex: 1, textAlign: 'center' }}>
          MODALITA ADMIN - {adminImpiantoNome || 'Impianto'}
        </span>

        {/* Bottone X per uscire */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowExitConfirm(true)}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            borderRadius: '0.5rem',
            padding: '0.25rem 0.75rem',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.75rem',
            fontWeight: 500,
          }}
        >
          <RiCloseLine size={16} />
          Esci
        </motion.button>
      </motion.div>

      {/* Popup conferma uscita */}
      <ConfirmPopup
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        onConfirm={handleExitAdminMode}
        title="Esci dalla modalita Admin"
        message={`Vuoi uscire dalla modalita admin per "${adminImpiantoNome}"? Tornerai alla tua dashboard.`}
        confirmText="Esci"
        cancelText="Annulla"
        confirmVariant="warning"
      />
    </>
  );
}
