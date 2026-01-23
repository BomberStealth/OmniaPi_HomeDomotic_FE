import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RiLockLine, RiCheckboxCircleLine, RiAlertLine, RiEyeLine, RiEyeOffLine, RiShieldKeyholeLine } from 'react-icons/ri';
import { api } from '@/services/api';

// ============================================
// RESET PASSWORD PAGE - WOW Edition
// Stile coerente con Login.tsx
// ============================================

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
  success: '#10b981',
  warning: '#f59e0b',
};

// Password validation
const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  if (password.length < 8) errors.push('Minimo 8 caratteri');
  if (!/[a-z]/.test(password)) errors.push('Almeno una lettera minuscola');
  if (!/[A-Z]/.test(password)) errors.push('Almeno una lettera maiuscola');
  if (!/\d/.test(password)) errors.push('Almeno un numero');
  return { valid: errors.length === 0, errors };
};

// Password strength
const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z\d]/.test(password)) strength++;

  if (strength <= 2) return { strength, label: 'Debole', color: colors.error };
  if (strength <= 4) return { strength, label: 'Media', color: colors.warning };
  return { strength, label: 'Forte', color: colors.success };
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

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const passwordStrength = getPasswordStrength(newPassword);

  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth < 640);
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  // Redirect se no token
  useEffect(() => {
    if (!token) {
      setError('Link non valido. Token mancante.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationErrors([]);

    // Validazione
    const { valid, errors } = validatePassword(newPassword);
    if (!valid) {
      setValidationErrors(errors);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Le password non corrispondono');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/api/auth/reset-password', {
        token,
        newPassword,
      });

      if (response.data.success) {
        setIsSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(response.data.error || 'Errore durante il reset');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Token non valido o scaduto.');
    } finally {
      setIsLoading(false);
    }
  };

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

          {isSuccess ? (
            // Success State
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <motion.div
                className="flex justify-center"
                style={{ marginBottom: '20px' }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <div
                  style={{
                    padding: isMobile ? '16px' : '20px',
                    borderRadius: '24px',
                    background: `linear-gradient(145deg, ${colors.success}35, ${colors.success}15)`,
                    border: `1px solid ${colors.success}25`,
                  }}
                >
                  <RiCheckboxCircleLine
                    size={isMobile ? 36 : 44}
                    style={{
                      color: colors.success,
                      filter: `drop-shadow(0 0 8px ${colors.success})`,
                    }}
                  />
                </div>
              </motion.div>

              <h1
                style={{
                  fontSize: isMobile ? '22px' : '28px',
                  fontWeight: 700,
                  marginBottom: '12px',
                  background: `linear-gradient(135deg, ${colors.success}, ${colors.accent})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Password Aggiornata!
              </h1>

              <p
                style={{
                  color: colors.textMuted,
                  fontSize: isMobile ? '13px' : '15px',
                  marginBottom: '24px',
                  lineHeight: 1.5,
                }}
              >
                La tua password è stata reimpostata con successo.
                Verrai reindirizzato al login...
              </p>

              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                style={{
                  width: '24px',
                  height: '24px',
                  border: `2px solid ${colors.accent}30`,
                  borderTopColor: colors.accent,
                  borderRadius: '50%',
                  margin: '0 auto',
                }}
              />
            </motion.div>
          ) : (
            // Form State
            <>
              <div className="text-center" style={{ marginBottom: '24px' }}>
                <motion.div
                  className="flex justify-center"
                  style={{ marginBottom: '16px' }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                >
                  <motion.div
                    style={{
                      padding: isMobile ? '14px' : '18px',
                      borderRadius: '24px',
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
                    <RiShieldKeyholeLine
                      size={isMobile ? 28 : 34}
                      style={{
                        color: colors.accentLight,
                        filter: `drop-shadow(0 0 8px ${colors.accent})`,
                      }}
                    />
                  </motion.div>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  style={{
                    fontSize: isMobile ? '22px' : '28px',
                    fontWeight: 700,
                    marginBottom: '8px',
                    background: `linear-gradient(135deg, ${colors.accentLight}, ${colors.accent})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Nuova Password
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  style={{
                    color: colors.textMuted,
                    fontSize: isMobile ? '13px' : '14px',
                    lineHeight: 1.5,
                  }}
                >
                  Scegli una password sicura per il tuo account.
                </motion.p>
              </div>

              <form onSubmit={handleSubmit}>
                {/* New Password */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  style={{ marginBottom: '12px' }}
                >
                  <label
                    style={{
                      display: 'block',
                      fontSize: isMobile ? '12px' : '13px',
                      fontWeight: 500,
                      color: colors.textMuted,
                      marginBottom: '6px',
                    }}
                  >
                    Nuova Password
                  </label>
                  <div className="relative">
                    <div
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{
                        color: focusedField === 'password' ? colors.accent : colors.textMuted,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <RiLockLine size={isMobile ? 16 : 18} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="••••••••"
                      disabled={isLoading || !token}
                      autoComplete="new-password"
                      style={{
                        width: '100%',
                        height: isMobile ? '44px' : '50px',
                        paddingLeft: isMobile ? '38px' : '44px',
                        paddingRight: '44px',
                        fontSize: isMobile ? '14px' : '15px',
                        color: colors.textPrimary,
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${focusedField === 'password' ? colors.borderGlow : colors.border}`,
                        borderRadius: isMobile ? '12px' : '14px',
                        outline: 'none',
                        transition: 'all 0.2s ease',
                        boxShadow: focusedField === 'password' ? `0 0 15px ${colors.accent}25` : 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: colors.textMuted,
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                    >
                      {showPassword ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {newPassword && (
                    <div style={{ marginTop: '8px' }}>
                      <div className="flex items-center gap-2">
                        <div
                          style={{
                            flex: 1,
                            height: '4px',
                            borderRadius: '2px',
                            background: colors.border,
                            overflow: 'hidden',
                          }}
                        >
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(passwordStrength.strength / 6) * 100}%` }}
                            style={{
                              height: '100%',
                              background: passwordStrength.color,
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '11px', color: passwordStrength.color }}>
                          {passwordStrength.label}
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Confirm Password */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  style={{ marginBottom: '16px' }}
                >
                  <label
                    style={{
                      display: 'block',
                      fontSize: isMobile ? '12px' : '13px',
                      fontWeight: 500,
                      color: colors.textMuted,
                      marginBottom: '6px',
                    }}
                  >
                    Conferma Password
                  </label>
                  <div className="relative">
                    <div
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{
                        color: focusedField === 'confirm' ? colors.accent : colors.textMuted,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <RiLockLine size={isMobile ? 16 : 18} />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={() => setFocusedField('confirm')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="••••••••"
                      disabled={isLoading || !token}
                      autoComplete="new-password"
                      style={{
                        width: '100%',
                        height: isMobile ? '44px' : '50px',
                        paddingLeft: isMobile ? '38px' : '44px',
                        paddingRight: '44px',
                        fontSize: isMobile ? '14px' : '15px',
                        color: colors.textPrimary,
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${focusedField === 'confirm' ? colors.borderGlow : colors.border}`,
                        borderRadius: isMobile ? '12px' : '14px',
                        outline: 'none',
                        transition: 'all 0.2s ease',
                        boxShadow: focusedField === 'confirm' ? `0 0 15px ${colors.accent}25` : 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: colors.textMuted,
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                    >
                      {showConfirmPassword ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
                    </button>
                  </div>

                  {/* Match indicator */}
                  {confirmPassword && (
                    <p style={{
                      fontSize: '11px',
                      color: newPassword === confirmPassword ? colors.success : colors.error,
                      marginTop: '6px',
                    }}>
                      {newPassword === confirmPassword ? 'Le password corrispondono' : 'Le password non corrispondono'}
                    </p>
                  )}
                </motion.div>

                {/* Errors */}
                <AnimatePresence>
                  {(error || validationErrors.length > 0) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: `${colors.error}12`,
                        border: `1px solid ${colors.error}30`,
                        marginBottom: '16px',
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <RiAlertLine size={14} style={{ color: colors.error, flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          {error && <p style={{ fontSize: '12px', color: colors.error, margin: 0 }}>{error}</p>}
                          {validationErrors.map((err, i) => (
                            <p key={i} style={{ fontSize: '12px', color: colors.warning, margin: 0 }}>{err}</p>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Requirements */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    marginBottom: '16px',
                  }}
                >
                  <p style={{ fontSize: '11px', color: colors.textMuted, margin: 0 }}>
                    Requisiti: 8+ caratteri, maiuscola, minuscola, numero
                  </p>
                </motion.div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isLoading || !token}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  style={{
                    width: '100%',
                    height: isMobile ? '46px' : '52px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: isMobile ? '15px' : '16px',
                    fontWeight: 600,
                    color: '#0a0a09',
                    background: `linear-gradient(135deg, ${colors.accentLight}, ${colors.accent})`,
                    border: 'none',
                    borderRadius: isMobile ? '12px' : '14px',
                    cursor: isLoading || !token ? 'not-allowed' : 'pointer',
                    opacity: isLoading || !token ? 0.6 : 1,
                    boxShadow: `0 4px 15px ${colors.accent}25`,
                    marginBottom: '16px',
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
                      <span>Aggiornamento...</span>
                    </>
                  ) : (
                    'Imposta Nuova Password'
                  )}
                </motion.button>

                {/* Back to Login */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-center"
                >
                  <Link
                    to="/login"
                    style={{
                      fontSize: isMobile ? '13px' : '14px',
                      color: colors.accentLight,
                      textDecoration: 'none',
                    }}
                  >
                    Torna al Login
                  </Link>
                </motion.div>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};
