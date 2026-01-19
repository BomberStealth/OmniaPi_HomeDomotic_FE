import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { RiShieldLine, RiAlertLine, RiUserAddLine, RiMailLine, RiLockLine } from 'react-icons/ri';
import { APP_VERSION } from '@/config/version';

// ============================================
// LOGIN PAGE - WOW Edition 🚀
// Animazioni d'ingresso + MOBILE OPTIMIZED
// ============================================

// Colori
const colors = {
  accent: '#6ad4a0',
  accentLight: '#a0e8c4',
  accentDark: '#4aa870',
  border: 'rgba(106, 212, 160, 0.15)',
  borderGlow: 'rgba(106, 212, 160, 0.4)',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  textPrimary: '#ffffff',
  bgCard: 'rgba(20, 18, 15, 0.7)',
  error: '#ef4444',
  warning: '#f59e0b',
};

// Validation helpers
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

// ============================================
// FLOATING PARTICLES (ULTRA LIGHTWEIGHT)
// ============================================
const FloatingParticles = ({ count = 15 }: { count?: number }) => {
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

// ============================================
// ANIMATED INPUT - COMPACT VERSION
// ============================================
interface AnimatedInputProps {
  type: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  icon: React.ReactNode;
  autoComplete?: string;
  delay: number;
  isMobile: boolean;
}

const AnimatedInput = ({
  type, label, value, onChange, placeholder, disabled, icon, autoComplete, delay, isMobile
}: AnimatedInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <label
        style={{
          display: 'block',
          fontSize: isMobile ? '11px' : '13px',
          fontWeight: 500,
          color: colors.textMuted,
          marginBottom: isMobile ? '4px' : '6px',
        }}
      >
        {label}
      </label>
      <motion.div
        className="relative"
        animate={{ scale: isFocused ? 1.01 : 1 }}
        transition={{ duration: 0.2 }}
      >
        <div
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{
            color: isFocused ? colors.accent : colors.textMuted,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {icon}
        </div>
        <input
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          style={{
            width: '100%',
            height: isMobile ? '42px' : '48px',
            paddingLeft: isMobile ? '38px' : '44px',
            paddingRight: '12px',
            fontSize: isMobile ? '14px' : '15px',
            color: colors.textPrimary,
            background: 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${isFocused ? colors.borderGlow : colors.border}`,
            borderRadius: isMobile ? '12px' : '14px',
            outline: 'none',
            transition: 'all 0.2s ease',
            boxShadow: isFocused ? `0 0 15px ${colors.accent}25` : 'none',
          }}
        />
      </motion.div>
    </motion.div>
  );
};

// ============================================
// MAIN LOGIN COMPONENT
// ============================================
export const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);

  // Detect screen size
  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < 640);
      setIsSmallMobile(window.innerWidth < 380 || window.innerHeight < 600);
    };
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  // Mark animation complete
  useEffect(() => {
    const timer = setTimeout(() => setAnimationComplete(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const validateForm = (): boolean => {
    const errors: string[] = [];
    if (!email) {
      errors.push('Email richiesta');
    } else if (!isValidEmail(email)) {
      errors.push('Email non valida');
    }
    if (!password) {
      errors.push('Password richiesta');
    } else if (password.length < 6) {
      errors.push('Password troppo corta (min 6 caratteri)');
    }
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationErrors([]);

    if (!validateForm()) return;

    if (attempts >= 5) {
      setError('Troppi tentativi. Riprova tra qualche minuto.');
      return;
    }

    try {
      const sanitizedEmail = sanitizeInput(email).toLowerCase();
      const sanitizedPassword = sanitizeInput(password);
      await login(sanitizedEmail, sanitizedPassword);
      setAttempts(0);
      navigate('/dashboard');
    } catch (err: any) {
      setAttempts(prev => prev + 1);
      if (err.response?.status === 429) {
        setError('Troppi tentativi. Riprova tra 15 minuti.');
      } else if (err.response?.status === 401) {
        setError('Credenziali non valide.');
      } else if (err.response?.data?.details) {
        setValidationErrors(err.response.data.details);
      } else {
        setError('Errore di connessione.');
      }
    }
  };

  // Particle count based on device
  const particleCount = isSmallMobile ? 5 : isMobile ? 8 : 20;

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
      }}
    >
      {/* ============================================ */}
      {/* ANIMATED GRADIENT BACKGROUND */}
      {/* ============================================ */}
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

      {/* Floating Particles */}
      <FloatingParticles count={particleCount} />

      {/* Ambient glow */}
      <div
        className="fixed top-0 left-0 right-0 pointer-events-none"
        style={{
          height: isMobile ? '150px' : '250px',
          background: 'radial-gradient(ellipse 100% 100% at 50% -30%, rgba(106, 212, 160, 0.12) 0%, transparent 70%)',
          zIndex: 1,
        }}
      />

      {/* ============================================ */}
      {/* MAIN CARD - RESPONSIVE */}
      {/* ============================================ */}
      <motion.div
        className="w-full relative"
        style={{
          maxWidth: isMobile ? '100%' : '400px',
          zIndex: 10,
        }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Glassmorphism Card */}
        <div
          style={{
            background: colors.bgCard,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: isMobile ? '20px' : '28px',
            border: `1px solid ${colors.border}`,
            boxShadow: `0 4px 24px rgba(0, 0, 0, 0.4), 0 0 60px rgba(106, 212, 160, 0.04)`,
            padding: isSmallMobile ? '16px' : isMobile ? '20px' : '32px',
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

          {/* ============================================ */}
          {/* HEADER */}
          {/* ============================================ */}
          <div className="text-center" style={{ marginBottom: isSmallMobile ? '16px' : isMobile ? '20px' : '28px' }}>
            {/* Logo */}
            <motion.div
              className="flex justify-center"
              style={{ marginBottom: isSmallMobile ? '10px' : isMobile ? '12px' : '16px' }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.4, type: 'spring', stiffness: 200 }}
            >
              <motion.div
                style={{
                  padding: isSmallMobile ? '12px' : isMobile ? '14px' : '18px',
                  borderRadius: isMobile ? '18px' : '24px',
                  background: `linear-gradient(145deg, ${colors.accent}35, ${colors.accent}15)`,
                  border: `1px solid ${colors.accent}25`,
                }}
                animate={{
                  boxShadow: [
                    `0 0 15px ${colors.accent}30`,
                    `0 0 25px ${colors.accent}45`,
                    `0 0 15px ${colors.accent}30`,
                  ],
                }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <RiShieldLine
                  size={isSmallMobile ? 28 : isMobile ? 32 : 38}
                  style={{
                    color: colors.accentLight,
                    filter: `drop-shadow(0 0 8px ${colors.accent})`,
                  }}
                />
              </motion.div>
            </motion.div>

            {/* Title */}
            <motion.h1
              style={{
                fontSize: isSmallMobile ? '22px' : isMobile ? '26px' : '32px',
                fontWeight: 700,
                marginBottom: '4px',
                background: `linear-gradient(135deg, ${colors.accentLight}, ${colors.accent})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.55 }}
            >
              {t('app.name')}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.7 }}
              style={{
                color: colors.textMuted,
                fontSize: isSmallMobile ? '12px' : isMobile ? '13px' : '14px',
              }}
            >
              {t('auth.loginTitle')}
            </motion.p>
          </div>

          {/* ============================================ */}
          {/* FORM */}
          {/* ============================================ */}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: isSmallMobile ? '12px' : isMobile ? '14px' : '18px' }}>
              <AnimatedInput
                type="email"
                label={t('auth.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="esempio@email.com"
                disabled={isLoading}
                icon={<RiMailLine size={isMobile ? 16 : 18} />}
                autoComplete="email"
                delay={0.85}
                isMobile={isMobile}
              />

              <AnimatedInput
                type="password"
                label={t('auth.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                icon={<RiLockLine size={isMobile ? 16 : 18} />}
                autoComplete="current-password"
                delay={0.95}
                isMobile={isMobile}
              />

              {/* Errors */}
              <AnimatePresence>
                {(validationErrors.length > 0 || error) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{
                      padding: isMobile ? '10px 12px' : '12px 14px',
                      borderRadius: isMobile ? '10px' : '12px',
                      background: error ? `${colors.error}12` : `${colors.warning}12`,
                      border: `1px solid ${error ? colors.error : colors.warning}30`,
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <RiAlertLine
                        size={isMobile ? 14 : 16}
                        style={{
                          color: error ? colors.error : colors.warning,
                          flexShrink: 0,
                          marginTop: '1px'
                        }}
                      />
                      <div>
                        {error && (
                          <p style={{ fontSize: isMobile ? '11px' : '12px', color: colors.error }}>{error}</p>
                        )}
                        {validationErrors.map((err, i) => (
                          <p key={i} style={{ fontSize: isMobile ? '11px' : '12px', color: colors.warning }}>{err}</p>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Attempts */}
              {attempts > 0 && attempts < 5 && (
                <p style={{ fontSize: '10px', color: colors.textMuted, textAlign: 'center', margin: 0 }}>
                  Tentativi: {attempts}/5
                </p>
              )}

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 1.05 }}
              >
                <motion.button
                  type="submit"
                  disabled={isLoading || attempts >= 5}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  animate={animationComplete && !isLoading ? {
                    boxShadow: [
                      `0 4px 15px ${colors.accent}25`,
                      `0 4px 25px ${colors.accent}40`,
                      `0 4px 15px ${colors.accent}25`,
                    ],
                  } : {}}
                  transition={animationComplete ? { duration: 2, repeat: Infinity } : {}}
                  style={{
                    width: '100%',
                    height: isSmallMobile ? '44px' : isMobile ? '46px' : '52px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: isSmallMobile ? '14px' : isMobile ? '15px' : '16px',
                    fontWeight: 600,
                    color: '#0a0a09',
                    background: `linear-gradient(135deg, ${colors.accentLight}, ${colors.accent})`,
                    border: 'none',
                    borderRadius: isMobile ? '12px' : '14px',
                    cursor: isLoading || attempts >= 5 ? 'not-allowed' : 'pointer',
                    opacity: isLoading || attempts >= 5 ? 0.6 : 1,
                    boxShadow: `0 4px 15px ${colors.accent}25`,
                  }}
                >
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        style={{
                          width: '18px',
                          height: '18px',
                          border: '2px solid rgba(0,0,0,0.2)',
                          borderTopColor: '#0a0a09',
                          borderRadius: '50%',
                        }}
                      />
                      <span>Accesso...</span>
                    </>
                  ) : (
                    t('auth.login')
                  )}
                </motion.button>
              </motion.div>
            </div>
          </form>

          {/* ============================================ */}
          {/* FORGOT PASSWORD LINK */}
          {/* ============================================ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 1.1 }}
            className="text-center"
            style={{ marginTop: isSmallMobile ? '10px' : isMobile ? '12px' : '14px' }}
          >
            <Link
              to="/forgot-password"
              style={{
                fontSize: isSmallMobile ? '11px' : isMobile ? '12px' : '13px',
                color: colors.textMuted,
                textDecoration: 'none',
              }}
            >
              Password dimenticata?
            </Link>
          </motion.div>

          {/* ============================================ */}
          {/* REGISTER LINK */}
          {/* ============================================ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 1.15 }}
            className="text-center"
            style={{ marginTop: isSmallMobile ? '10px' : isMobile ? '12px' : '14px' }}
          >
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5"
              style={{
                fontSize: isSmallMobile ? '12px' : isMobile ? '13px' : '14px',
                color: colors.accentLight,
              }}
            >
              <RiUserAddLine size={isMobile ? 14 : 16} />
              <span>Non hai un account? <strong>Registrati</strong></span>
            </Link>
          </motion.div>

          {/* Security + Legal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 1.25 }}
            style={{
              marginTop: isSmallMobile ? '12px' : isMobile ? '14px' : '18px',
              paddingTop: isSmallMobile ? '10px' : isMobile ? '12px' : '16px',
              borderTop: `1px solid ${colors.border}`,
            }}
          >
            <p style={{
              fontSize: isSmallMobile ? '9px' : isMobile ? '10px' : '11px',
              color: colors.textMuted,
              textAlign: 'center',
              marginBottom: isSmallMobile ? '6px' : '8px',
            }}>
              🔒 Connessione sicura SSL/TLS
            </p>
            <div className="flex justify-center items-center" style={{ gap: isMobile ? '8px' : '12px' }}>
              <Link
                to="/privacy"
                style={{ fontSize: isSmallMobile ? '9px' : isMobile ? '10px' : '11px', color: colors.textMuted }}
              >
                Privacy
              </Link>
              <span style={{ color: colors.textMuted, fontSize: '8px' }}>•</span>
              <Link
                to="/terms"
                style={{ fontSize: isSmallMobile ? '9px' : isMobile ? '10px' : '11px', color: colors.textMuted }}
              >
                Termini
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Version */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        style={{
          position: 'fixed',
          bottom: '8px',
          right: '8px',
          fontSize: '9px',
          color: 'rgba(255, 255, 255, 0.2)',
          fontFamily: 'monospace',
          zIndex: 10,
        }}
      >
        {APP_VERSION}
      </motion.p>
    </div>
  );
};
