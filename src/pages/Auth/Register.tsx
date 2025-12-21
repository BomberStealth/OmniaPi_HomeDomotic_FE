import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Shield, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { authApi } from '@/services/api';

// ============================================
// REGISTER PAGE (con validazione avanzata)
// ============================================

// Validazione email
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validazione password forte
const validateStrongPassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Minimo 8 caratteri');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Almeno una lettera minuscola');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Almeno una lettera maiuscola');
  }
  if (!/\d/.test(password)) {
    errors.push('Almeno un numero');
  }

  return { valid: errors.length === 0, errors };
};

// Calcola forza password
const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
  let strength = 0;

  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z\d]/.test(password)) strength++;

  if (strength <= 2) return { strength, label: 'Debole', color: 'bg-error' };
  if (strength <= 4) return { strength, label: 'Media', color: 'bg-warning' };
  return { strength, label: 'Forte', color: 'bg-success' };
};

// Sanitizza input
const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const passwordStrength = getPasswordStrength(formData.password);

  // Validazione form completa
  const validateForm = (): boolean => {
    const errors: string[] = [];

    // Nome e Cognome
    if (!formData.nome || formData.nome.length < 2) {
      errors.push('Nome troppo corto (minimo 2 caratteri)');
    }
    if (!formData.cognome || formData.cognome.length < 2) {
      errors.push('Cognome troppo corto (minimo 2 caratteri)');
    }

    // Email
    if (!formData.email) {
      errors.push('Email richiesta');
    } else if (!isValidEmail(formData.email)) {
      errors.push('Email non valida');
    }

    // Password
    if (!formData.password) {
      errors.push('Password richiesta');
    } else {
      const { valid, errors: passErrors } = validateStrongPassword(formData.password);
      if (!valid) {
        errors.push(...passErrors.map(e => `Password: ${e}`));
      }
    }

    // Conferma Password
    if (!formData.confirmPassword) {
      errors.push('Conferma password richiesta');
    } else if (formData.password !== formData.confirmPassword) {
      errors.push('Le password non corrispondono');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    // Pulisci errori quando l'utente modifica
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationErrors([]);

    // Validazione client-side
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Sanitizza input
      const sanitizedData = {
        nome: sanitizeInput(formData.nome),
        cognome: sanitizeInput(formData.cognome),
        email: sanitizeInput(formData.email).toLowerCase(),
        password: formData.password // Non sanitizzare la password
      };

      // Chiamata API registrazione
      await authApi.register(sanitizedData);

      setSuccess(true);

      // Reindirizza al login dopo 2 secondi
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setIsLoading(false);

      // Gestisci errori specifici
      if (err.response?.status === 429) {
        setError('Troppi tentativi di registrazione. Riprova tra un\'ora.');
      } else if (err.response?.status === 400) {
        const serverError = err.response.data?.error;
        if (serverError?.includes('già registrata')) {
          setError('Email già registrata. Usa un\'altra email o effettua il login.');
        } else if (err.response.data?.details) {
          setValidationErrors(err.response.data.details);
        } else {
          setError(serverError || 'Dati non validi. Controlla i campi.');
        }
      } else {
        setError('Errore durante la registrazione. Riprova più tardi.');
      }
    }
  };

  // Mostra messaggio successo
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-background light:bg-foreground-light p-4">
        <Card className="w-full max-w-md" variant="glass-solid">
          <div className="text-center py-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-success bg-opacity-20">
                <CheckCircle2 size={48} className="text-success" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-copy mb-2">
              Registrazione Completata!
            </h2>
            <p className="text-copy-lighter mb-4">
              Account creato con successo. Verrai reindirizzato al login...
            </p>
            <div className="animate-spin mx-auto w-6 h-6">⚙️</div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background dark:bg-background light:bg-foreground-light p-4">
      <Card className="w-full max-w-md" variant="glass-solid">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="p-3 sm:p-4 rounded-full bg-secondary bg-opacity-20">
              <Shield size={32} className="sm:w-10 sm:h-10 text-secondary" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            Crea Account
          </h1>
          <p className="text-sm sm:text-base text-copy-lighter">
            Registrati per accedere a OmniaPi
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome e Cognome */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input
              type="text"
              name="nome"
              label="Nome"
              value={formData.nome}
              onChange={handleChange}
              required
              placeholder="Mario"
              disabled={isLoading}
            />
            <Input
              type="text"
              name="cognome"
              label="Cognome"
              value={formData.cognome}
              onChange={handleChange}
              required
              placeholder="Rossi"
              disabled={isLoading}
            />
          </div>

          {/* Email */}
          <Input
            type="email"
            name="email"
            label="Email"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
            placeholder="esempio@email.com"
            disabled={isLoading}
          />

          {/* Password */}
          <div>
            <Input
              type="password"
              name="password"
              label="Password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
              placeholder="••••••••"
              disabled={isLoading}
            />

            {/* Indicatore forza password */}
            {formData.password && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                    <div
                      className={`h-full ${passwordStrength.color} transition-all duration-300`}
                      style={{ width: `${(passwordStrength.strength / 6) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-copy-lighter whitespace-nowrap">
                    {passwordStrength.label}
                  </span>
                </div>
                <p className="text-xs text-copy-lighter">
                  Requisiti: 8+ caratteri, maiuscola, minuscola, numero
                </p>
              </div>
            )}
          </div>

          {/* Conferma Password */}
          <Input
            type="password"
            name="confirmPassword"
            label="Conferma Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            autoComplete="new-password"
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

          {/* Pulsante Registrazione */}
          <Button
            type="submit"
            fullWidth
            disabled={isLoading}
            variant="primary"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin">⚙️</div>
                <span>Registrazione in corso...</span>
              </span>
            ) : (
              'Crea Account'
            )}
          </Button>

          {/* Link al Login */}
          <div className="text-center pt-2">
            <Link
              to="/login"
              className="text-sm text-primary hover:text-primary-light transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft size={16} />
              <span>Hai già un account? Accedi</span>
            </Link>
          </div>
        </form>

        {/* Info sicurezza */}
        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-copy-lighter text-center">
            🔒 Password criptata con bcrypt - Connessione SSL/TLS
          </p>
        </div>
      </Card>
    </div>
  );
};
