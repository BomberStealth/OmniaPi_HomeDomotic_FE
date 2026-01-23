import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RiCheckboxCircleLine, RiAlertLine, RiMailLine, RiLoginCircleLine, RiLoader4Line } from 'react-icons/ri';
import { api } from '@/services/api';

// ============================================
// VERIFY EMAIL PAGE - WOW Edition
// Stile coerente con Login.tsx
// ============================================

const colors = {
  accent: '#6ad4a0',
  accentLight: '#a0e8c4',
  accentDark: '#4aa870',
  border: 'rgba(106, 212, 160, 0.15)',
  borderGlow: 'rgba(106, 212, 160, 0.4)',
  textMuted: 'rgba(255, 255, 255, 0.75)',
  textPrimary: '#ffffff',
  bgCard: 'rgba(20, 18, 15, 0.7)',
  error: '#ef4444',
  success: '#10b981',
};

// Floating Particles
const FloatingParticles = ({ count = 12 }: { count?: number }) => {
  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      size: 2 + Math.random() * 3,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 10 + Math.random() * 10,
      opacity: 0.15 + Math.random() * 0.25,
    })), [count]
  );

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            bottom: '-10px',
            background: colors.accent,
            boxShadow: `0 0 ${p.size}px ${colors.accent}`,
            opacity: p.opacity,
          }}
          animate={{
            y: [0, -window.innerHeight - 50],
            opacity: [0, p.opacity, p.opacity, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
};

export const VerifyEmail = () => {
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
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Link non valido. Token mancante.');
        return;
      }

      try {
        const response = await api.get(`/api/auth/verify-email?token=${token}`);
        if (response.data.success) {
          setStatus('success');
          setMessage(response.data.message || 'Email verificata con successo!');
        } else {
          setStatus('error');
          setMessage(response.data.error || 'Errore durante la verifica');
        }
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Token non valido o scaduto.');
      }
    };

    verifyEmail();
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
        viewTransitionName: 'page-content',
      } as React.CSSProperties}
    >
      {/* Animated Gradient Background */}
      <motion.div
        className="fixed inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -10%, rgba(106, 212, 160, 0.1) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 100%, rgba(74, 168, 112, 0.06) 0%, transparent 50%),
            linear-gradient(to bottom, #12110f 0%, #0a0a09 100%)
          `,
          backgroundSize: '200% 200%',
          animation: 'gradientMove 20s ease infinite',
        }}
      />

      <style>{`
        @keyframes gradientMove {
          0%, 100% { background-position: 0% 0%; }
          50% { background-position: 100% 100%; }
        }
      `}</style>

      <FloatingParticles count={isMobile ? 8 : 15} />

      {/* Ambient glow */}
      <div
        className="fixed top-0 left-0 right-0 pointer-events-none"
        style={{
          height: isMobile ? '150px' : '250px',
          background: 'radial-gradient(ellipse 100% 100% at 50% -30%, rgba(106, 212, 160, 0.12) 0%, transparent 70%)',
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
            boxShadow: `0 4px 24px rgba(0, 0, 0, 0.4), 0 0 60px rgba(106, 212, 160, 0.04)`,
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
                color: status === 'success'
                  ? '#ffffff'
                  : status === 'error'
                    ? '#fca5a5'
                    : '#ffffff',
              }}
            >
              {status === 'loading' && 'Verifica in corso...'}
              {status === 'success' && 'Email Verificata!'}
              {status === 'error' && 'Verifica Fallita'}
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
              {status === 'loading' && 'Stiamo verificando il tuo indirizzo email...'}
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
                {status === 'success' ? (
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
                      color: '#0a0a09',
                      background: `linear-gradient(135deg, ${colors.accentLight}, ${colors.accent})`,
                      borderRadius: isMobile ? '12px' : '14px',
                      textDecoration: 'none',
                      boxShadow: `0 4px 15px ${colors.accent}25`,
                    }}
                  >
                    <RiLoginCircleLine size={18} />
                    Vai al Login
                  </Link>
                ) : (
                  <>
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
                        border: `1px solid ${colors.border}`,
                        borderRadius: isMobile ? '12px' : '14px',
                        textDecoration: 'none',
                      }}
                    >
                      <RiMailLine size={18} />
                      Torna al Login
                    </Link>
                    <p style={{
                      fontSize: isMobile ? '11px' : '12px',
                      color: colors.textMuted,
                      textAlign: 'center',
                    }}>
                      Puoi richiedere un nuovo link di verifica dal login
                    </p>
                  </>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
