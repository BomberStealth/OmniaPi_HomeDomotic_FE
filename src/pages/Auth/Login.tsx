import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Shield, AlertCircle, UserPlus } from 'lucide-react';

// ============================================
// LOGIN PAGE (con validazione e sicurezza)
// ============================================

// Validazione email
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Sanitizza input
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

  // Validazione lato client
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

    // Validazione client-side
    if (!validateForm()) {
      return;
    }

    // Limita tentativi dal client (backup al rate limiting del server)
    if (attempts >= 5) {
      setError('Troppi tentativi. Riprova tra qualche minuto.');
      return;
    }

    try {
      // Sanitizza input prima dell'invio
      const sanitizedEmail = sanitizeInput(email).toLowerCase();
      const sanitizedPassword = sanitizeInput(password);

      await login(sanitizedEmail, sanitizedPassword);

      // Reset contatore in caso di successo
      setAttempts(0);
      navigate('/dashboard');
    } catch (err: any) {
      setAttempts(prev => prev + 1);

      // Gestisci messaggi di errore specifici
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
    <div className="min-h-screen flex items-center justify-center bg-background dark:bg-background light:bg-foreground-light p-4">
      <Card className="w-full max-w-md" variant="glass-solid">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 sm:p-4 rounded-full bg-primary bg-opacity-20">
              <Shield size={32} className="sm:w-10 sm:h-10 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            {t('app.name')}
          </h1>
          <p className="text-sm sm:text-base text-copy-lighter">{t('auth.loginTitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            label={t('auth.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="esempio@email.com"
            disabled={isLoading}
          />

          <Input
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
            <div className="p-3 rounded-lg bg-warning bg-opacity-20 border border-warning">
              <div className="flex items-start gap-2">
                <AlertCircle size={18} className="text-warning flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  {validationErrors.map((err, i) => (
                    <p key={i} className="text-sm text-warning">{err}</p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Errore generale */}
          {error && (
            <div className="p-3 rounded-lg bg-error bg-opacity-20 border border-error">
              <div className="flex items-start gap-2">
                <AlertCircle size={18} className="text-error flex-shrink-0 mt-0.5" />
                <p className="text-sm text-error flex-1">{error}</p>
              </div>
            </div>
          )}

          {/* Indicatore tentativi */}
          {attempts > 0 && attempts < 5 && (
            <div className="text-xs text-copy-lighter text-center">
              Tentativi: {attempts}/5
            </div>
          )}

          <Button
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
          </Button>
        </form>

        {/* Link Registrazione */}
        <div className="mt-4 text-center">
          <Link
            to="/register"
            className="text-sm text-secondary hover:text-secondary-light transition-colors inline-flex items-center gap-1"
          >
            <UserPlus size={16} />
            <span>Non hai un account? Registrati</span>
          </Link>
        </div>

        {/* Info sicurezza */}
        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-copy-lighter text-center">
            🔒 Connessione sicura con crittografia SSL/TLS
          </p>
        </div>
      </Card>
    </div>
  );
};
