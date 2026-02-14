import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RiCheckboxCircleLine, RiAlertLine, RiLoginCircleLine, RiLoader4Line } from 'react-icons/ri';
import { api } from '@/services/api';

// ============================================
// CONFIRM DELETE ACCOUNT PAGE
// Stile coerente con VerifyEmail.tsx
// ============================================

const colors = {
  accent: '#ef4444',
  accentLight: '#f87171',
  border: 'rgba(239, 68, 68, 0.15)',
  textMuted: 'rgba(255, 255, 255, 0.75)',
  textPrimary: '#ffffff',
  bgCard: 'rgba(20, 18, 15, 0.7)',
  error: '#ef4444',
  success: '#10b981',
};

export const ConfirmDeleteAccount = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth < 640);
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  useEffect(() => {
    const confirmDelete = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Link non valido. Token mancante.');
        return;
      }

      try {
        const response = await api.get(`/api/auth/confirm-delete-account?token=${token}`);
        if (response.data.success) {
          setStatus('success');
          setMessage(response.data.message || 'Account eliminato con successo.');
          // Rimuovi il token di autenticazione
          localStorage.removeItem('token');
        } else {
          setStatus('error');
          setMessage(response.data.error || 'Errore durante la conferma');
        }
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Token non valido o scaduto.');
      }
    };

    confirmDelete();
  }, [token]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '12px' : '16px',
        overflow: 'hidden',
        fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
      } as React.CSSProperties}
    >
      {/* Background */}
      <motion.div
        className="fixed inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -10%, rgba(239, 68, 68, 0.1) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 100%, rgba(239, 68, 68, 0.06) 0%, transparent 50%),
            linear-gradient(to bottom, #12110f 0%, #0a0a09 100%)
          `,
        }}
      />

      {/* Ambient glow */}
      <div
        className="fixed top-0 left-0 right-0 pointer-events-none"
        style={{
          height: isMobile ? '150px' : '250px',
          background: 'radial-gradient(ellipse 100% 100% at 50% -30%, rgba(239, 68, 68, 0.12) 0%, transparent 70%)',
          zIndex: 1,
        }}
      />

      {/* Main Card */}
      <motion.div
        className="w-full relative"
        style={{
          maxWidth: isMobile ? '100%' : '420px',
          zIndex: 10,
        }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div
          style={{
            background: colors.bgCard,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: isMobile ? '20px' : '28px',
            border: `1px solid ${colors.border}`,
            boxShadow: `0 4px 24px rgba(0, 0, 0, 0.4), 0 0 60px rgba(239, 68, 68, 0.04)`,
            padding: isMobile ? '24px' : '36px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Top glow line */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '15%',
              right: '15%',
              height: '1px',
              background: `linear-gradient(90deg, transparent, ${colors.accent}50, transparent)`,
            }}
          />

          <div className="text-center">
            {/* Icon */}
            <motion.div
              className="flex justify-center"
              style={{ marginBottom: '20px' }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            >
              <motion.div
                style={{
                  padding: isMobile ? '16px' : '20px',
                  borderRadius: '24px',
                  background: status === 'loading'
                    ? `linear-gradient(145deg, ${colors.accent}35, ${colors.accent}15)`
                    : status === 'success'
                      ? `linear-gradient(145deg, ${colors.success}35, ${colors.success}15)`
                      : `linear-gradient(145deg, ${colors.error}35, ${colors.error}15)`,
                  border: `1px solid ${status === 'loading' ? colors.accent : status === 'success' ? colors.success : colors.error}25`,
                }}
                animate={status === 'loading' ? {
                  boxShadow: [
                    `0 0 15px ${colors.accent}30`,
                    `0 0 25px ${colors.accent}45`,
                    `0 0 15px ${colors.accent}30`,
                  ],
                } : {}}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                {status === 'loading' ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  >
                    <RiLoader4Line
                      size={isMobile ? 36 : 44}
                      style={{
                        color: colors.accentLight,
                        filter: `drop-shadow(0 0 8px ${colors.accent})`,
                      }}
                    />
                  </motion.div>
                ) : status === 'success' ? (
                  <RiCheckboxCircleLine
                    size={isMobile ? 36 : 44}
                    style={{
                      color: colors.success,
                      filter: `drop-shadow(0 0 8px ${colors.success})`,
                    }}
                  />
                ) : (
                  <RiAlertLine
                    size={isMobile ? 36 : 44}
                    style={{
                      color: colors.error,
                      filter: `drop-shadow(0 0 8px ${colors.error})`,
                    }}
                  />
                )}
              </motion.div>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              style={{
                fontSize: isMobile ? '22px' : '28px',
                fontWeight: 700,
                marginBottom: '12px',
                color: status === 'error' ? '#fca5a5' : '#ffffff',
              }}
            >
              {status === 'loading' && 'Eliminazione in corso...'}
              {status === 'success' && 'Account Eliminato'}
              {status === 'error' && 'Eliminazione Fallita'}
            </motion.h1>

            {/* Message */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{
                color: '#ffffff',
                fontSize: isMobile ? '13px' : '15px',
                marginBottom: '24px',
                lineHeight: 1.5,
              }}
            >
              {status === 'loading' && 'Stiamo eliminando il tuo account...'}
              {status !== 'loading' && message}
            </motion.p>

            {/* Actions */}
            {status !== 'loading' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
              >
                <Link
                  to="/login"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    height: isMobile ? '46px' : '52px',
                    fontSize: isMobile ? '15px' : '16px',
                    fontWeight: 600,
                    color: colors.textPrimary,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid rgba(255, 255, 255, 0.15)`,
                    borderRadius: isMobile ? '12px' : '14px',
                    textDecoration: 'none',
                  }}
                >
                  <RiLoginCircleLine size={18} />
                  {status === 'success' ? 'Vai al Login' : 'Torna al Login'}
                </Link>
                {status === 'success' && (
                  <p style={{
                    fontSize: isMobile ? '11px' : '12px',
                    color: colors.textMuted,
                    textAlign: 'center',
                  }}>
                    Il tuo account e tutti i dati sono stati eliminati
                  </p>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
