import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { AuthCard } from '@/components/common/AuthCard';
import { AuthInput } from '@/components/common/AuthInput';
import { AuthButton } from '@/components/common/AuthButton';
import { RiShieldLine, RiAlertLine, RiUserAddLine } from 'react-icons/ri';

// ============================================
// LOGIN PAGE - Dark Luxury Style
// Valori esatti copiati da StylePreview.tsx
// ============================================

// Colori esatti dal preview
const colors = {
  accent: '#6ad4a0',
  accentLight: '#a0e8c4',
  accentDark: '#4aa870',
  border: 'rgba(106, 212, 160, 0.15)',
  textMuted: 'rgba(255, 255, 255, 0.5)',
};

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);

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
      errors.push('Password troppo corta (minimo 6 caratteri)');
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
        setError('Troppi tentativi di login. Riprova tra 15 minuti.');
      } else if (err.response?.status === 401) {
        setError('Credenziali non valide. Verifica email e password.');
      } else if (err.response?.data?.details) {
        setValidationErrors(err.response.data.details);
      } else {
        setError('Errore durante il login. Riprova più tardi.');
      }
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(106, 212, 160, 0.08) 0%, transparent 60%), linear-gradient(to bottom, #12110f 0%, #0a0a09 100%)',
        fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 100% 40% at 50% 0%, rgba(106, 212, 160, 0.06) 0%, transparent 70%)',
        }}
      />

      <AuthCard className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-4">
            <div
              style={{
                padding: '16px',
                borderRadius: '24px',
                background: `linear-gradient(145deg, ${colors.accent}33, ${colors.accent}1A)`,
                boxShadow: `0 4px 20px ${colors.accent}33`,
              }}
            >
              <RiShieldLine
                size={32}
                style={{
                  color: colors.accentLight,
                  filter: `drop-shadow(0 0 8px ${colors.accent})`,
                }}
              />
            </div>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-bold mb-2"
            style={{
              background: `linear-gradient(135deg, ${colors.accentLight}, ${colors.accent}, ${colors.accentDark})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: `0 0 40px ${colors.accent}30`,
            }}
          >
            {t('app.name')}
          </h1>
          <p style={{ color: colors.textMuted, fontSize: '14px' }}>
            {t('auth.loginTitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthInput
            type="email"
            label={t('auth.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="esempio@email.com"
            disabled={isLoading}
          />

          <AuthInput
            type="password"
            label={t('auth.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            disabled={isLoading}
          />

          {/* Errori di validazione */}
          {validationErrors.length > 0 && (
            <div
              style={{
                padding: '12px',
                borderRadius: '16px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
              }}
            >
              <div className="flex items-start gap-2">
                <RiAlertLine size={18} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  {validationErrors.map((err, i) => (
                    <p key={i} style={{ fontSize: '13px', color: '#f59e0b' }}>{err}</p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Errore generale */}
          {error && (
            <div
              style={{
                padding: '12px',
                borderRadius: '16px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              <div className="flex items-start gap-2">
                <RiAlertLine size={18} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
                <p style={{ fontSize: '13px', color: '#ef4444' }}>{error}</p>
              </div>
            </div>
          )}

          {/* Indicatore tentativi */}
          {attempts > 0 && attempts < 5 && (
            <p style={{ fontSize: '11px', color: colors.textMuted, textAlign: 'center' }}>
              Tentativi: {attempts}/5
            </p>
          )}

          <AuthButton
            type="submit"
            fullWidth
            disabled={isLoading || attempts >= 5}
            variant="primary"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin">⚙️</div>
                <span>Accesso in corso...</span>
              </span>
            ) : (
              t('auth.login')
            )}
          </AuthButton>
        </form>

        {/* Link Registrazione */}
        <div className="mt-4 text-center">
          <Link
            to="/register"
            className="inline-flex items-center gap-1 transition-all"
            style={{
              fontSize: '13px',
              color: colors.accentLight,
            }}
          >
            <RiUserAddLine size={16} />
            <span>Non hai un account? Registrati</span>
          </Link>
        </div>

        {/* Info sicurezza */}
        <div
          className="mt-6 pt-4"
          style={{ borderTop: `1px solid ${colors.border}` }}
        >
          <p style={{ fontSize: '11px', color: colors.textMuted, textAlign: 'center' }}>
            Connessione sicura con crittografia SSL/TLS
          </p>
        </div>

        {/* Link Legali */}
        <div className="mt-4 flex justify-center gap-4">
          <Link
            to="/privacy"
            style={{ fontSize: '11px', color: colors.textMuted }}
            className="hover:opacity-80 transition-opacity"
          >
            Privacy Policy
          </Link>
          <span style={{ color: colors.textMuted }}>|</span>
          <Link
            to="/terms"
            style={{ fontSize: '11px', color: colors.textMuted }}
            className="hover:opacity-80 transition-opacity"
          >
            Termini di Servizio
          </Link>
        </div>
      </AuthCard>
    </div>
  );
};
