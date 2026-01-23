import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AuthCard } from '@/components/common/AuthCard';
import { AuthInput } from '@/components/common/AuthInput';
import { AuthButton } from '@/components/common/AuthButton';
import { RiShieldLine, RiAlertLine, RiArrowLeftLine, RiMailSendLine, RiHome4Line, RiToolsLine } from 'react-icons/ri';
import { authApi } from '@/services/api';

// ============================================
// REGISTER PAGE - Dark Luxury Style
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

  if (strength <= 2) return { strength, label: 'Debole', color: '#ef4444' };
  if (strength <= 4) return { strength, label: 'Media', color: '#f59e0b' };
  return { strength, label: 'Forte', color: '#10b981' };
};

// Sanitizza input
const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const Register = () => {
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    email: '',
    password: '',
    confirmPassword: '',
    ruolo: 'proprietario' as 'proprietario' | 'installatore'
  });

  // Refs per i checkbox - evita problemi di closure
  const gdprRef = useRef<HTMLInputElement>(null);
  const ageRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const passwordStrength = getPasswordStrength(formData.password);

  // Validazione form completa - usa refs per checkbox
  const validateForm = (): boolean => {
    const gdprChecked = gdprRef.current?.checked ?? false;
    const ageChecked = ageRef.current?.checked ?? false;
    console.log('VALIDATE - gdprChecked:', gdprChecked, 'ageChecked:', ageChecked);
    const errors: string[] = [];

    if (!formData.nome || formData.nome.length < 2) {
      errors.push('Nome troppo corto (minimo 2 caratteri)');
    }
    if (!formData.cognome || formData.cognome.length < 2) {
      errors.push('Cognome troppo corto (minimo 2 caratteri)');
    }
    if (!formData.email) {
      errors.push('Email richiesta');
    } else if (!isValidEmail(formData.email)) {
      errors.push('Email non valida');
    }
    if (!formData.password) {
      errors.push('Password richiesta');
    } else {
      const { valid, errors: passErrors } = validateStrongPassword(formData.password);
      if (!valid) {
        errors.push(...passErrors.map(e => `Password: ${e}`));
      }
    }
    if (!formData.confirmPassword) {
      errors.push('Conferma password richiesta');
    } else if (formData.password !== formData.confirmPassword) {
      errors.push('Le password non corrispondono');
    }
    if (!gdprChecked) {
      errors.push('Devi accettare la Privacy Policy e i Termini di Servizio');
    }
    if (!ageChecked) {
      errors.push('Devi confermare di avere almeno 16 anni');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const gdprChecked = gdprRef.current?.checked ?? false;
    const ageChecked = ageRef.current?.checked ?? false;
    console.log('SUBMIT - gdprChecked:', gdprChecked, 'ageChecked:', ageChecked);
    setError('');
    setValidationErrors([]);

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const sanitizedData = {
        nome: sanitizeInput(formData.nome),
        cognome: sanitizeInput(formData.cognome),
        email: sanitizeInput(formData.email).toLowerCase(),
        password: formData.password,
        ruolo: formData.ruolo,
        gdprAccepted: gdprChecked === true,
        ageConfirmed: ageChecked === true
      };
      console.log('[FE] Sending to backend:', JSON.stringify(sanitizedData));

      await authApi.register(sanitizedData);
      setSuccess(true);

      // Non redirect automatico - l'utente deve verificare l'email
    } catch (err: any) {
      setIsLoading(false);

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

  // Mostra messaggio successo - Verifica Email
  if (success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 relative"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(106, 212, 160, 0.08) 0%, transparent 60%), linear-gradient(to bottom, #12110f 0%, #0a0a09 100%)',
          fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
        }}
      >
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 100% 40% at 50% 0%, rgba(106, 212, 160, 0.06) 0%, transparent 70%)',
          }}
        />

        <AuthCard className="w-full max-w-md relative z-10">
          <div className="text-center py-6">
            <div className="flex justify-center mb-4">
              <div
                style={{
                  padding: '16px',
                  borderRadius: '24px',
                  background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1))',
                  boxShadow: '0 4px 20px rgba(16, 185, 129, 0.2)',
                }}
              >
                <RiMailSendLine
                  size={48}
                  style={{
                    color: '#10b981',
                    filter: 'drop-shadow(0 0 8px #10b981)',
                  }}
                />
              </div>
            </div>
            <h2
              className="text-2xl font-bold mb-2"
              style={{
                background: 'linear-gradient(135deg, #10b981, #6ad4a0)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Controlla la tua Email!
            </h2>
            <p style={{ color: colors.textMuted, fontSize: '14px', marginBottom: '8px' }}>
              Ti abbiamo inviato un link di verifica a:
            </p>
            <p style={{ color: colors.accentLight, fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>
              {formData.email}
            </p>
            <p style={{ color: colors.textMuted, fontSize: '13px', marginBottom: '20px', lineHeight: 1.5 }}>
              Clicca sul link nell'email per attivare il tuo account.
              <br />
              Controlla anche la cartella spam.
            </p>
            <Link
              to="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#0a0a09',
                background: `linear-gradient(135deg, ${colors.accentLight}, ${colors.accent})`,
                borderRadius: '12px',
                textDecoration: 'none',
              }}
            >
              <RiArrowLeftLine size={16} />
              Vai al Login
            </Link>
          </div>
        </AuthCard>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(106, 212, 160, 0.08) 0%, transparent 60%), linear-gradient(to bottom, #12110f 0%, #0a0a09 100%)',
        fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
        viewTransitionName: 'page-content',
      } as React.CSSProperties}
    >
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 100% 40% at 50% 0%, rgba(106, 212, 160, 0.06) 0%, transparent 70%)',
        }}
      />

      <AuthCard className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
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
            Crea Account
          </h1>
          <p style={{ color: colors.textMuted, fontSize: '14px' }}>
            Registrati per accedere a OmniaPi
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome e Cognome */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <AuthInput
              type="text"
              name="nome"
              label="Nome"
              value={formData.nome}
              onChange={handleChange}
              required
              placeholder="Mario"
              disabled={isLoading}
            />
            <AuthInput
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

          <AuthInput
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
            <AuthInput
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
                  <div
                    className="flex-1 h-2 rounded-full overflow-hidden"
                    style={{ background: colors.border }}
                  >
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${(passwordStrength.strength / 6) * 100}%`,
                        background: passwordStrength.color,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '11px', color: colors.textMuted, whiteSpace: 'nowrap' }}>
                    {passwordStrength.label}
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: colors.textMuted }}>
                  Requisiti: 8+ caratteri, maiuscola, minuscola, numero
                </p>
              </div>
            )}
          </div>

          <AuthInput
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

          {/* Selezione Ruolo */}
          <div style={{ marginTop: '8px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 500,
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '10px'
            }}>
              Registrati come
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              {/* Opzione Proprietario */}
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, ruolo: 'proprietario' }))}
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '14px 12px',
                  borderRadius: '14px',
                  background: formData.ruolo === 'proprietario'
                    ? `linear-gradient(145deg, ${colors.accent}25, ${colors.accent}15)`
                    : 'rgba(255, 255, 255, 0.03)',
                  border: formData.ruolo === 'proprietario'
                    ? `2px solid ${colors.accent}`
                    : '2px solid rgba(255, 255, 255, 0.1)',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: isLoading ? 0.5 : 1,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <RiHome4Line
                    size={24}
                    style={{
                      color: formData.ruolo === 'proprietario' ? colors.accent : 'rgba(255, 255, 255, 0.5)'
                    }}
                  />
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: formData.ruolo === 'proprietario' ? colors.accentLight : 'rgba(255, 255, 255, 0.7)'
                  }}>
                    Proprietario
                  </span>
                  <span style={{
                    fontSize: '11px',
                    color: 'rgba(255, 255, 255, 0.45)',
                    textAlign: 'center',
                    lineHeight: 1.3
                  }}>
                    Per gestire la tua casa
                  </span>
                </div>
              </button>

              {/* Opzione Installatore */}
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, ruolo: 'installatore' }))}
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '14px 12px',
                  borderRadius: '14px',
                  background: formData.ruolo === 'installatore'
                    ? `linear-gradient(145deg, ${colors.accent}25, ${colors.accent}15)`
                    : 'rgba(255, 255, 255, 0.03)',
                  border: formData.ruolo === 'installatore'
                    ? `2px solid ${colors.accent}`
                    : '2px solid rgba(255, 255, 255, 0.1)',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: isLoading ? 0.5 : 1,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <RiToolsLine
                    size={24}
                    style={{
                      color: formData.ruolo === 'installatore' ? colors.accent : 'rgba(255, 255, 255, 0.5)'
                    }}
                  />
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: formData.ruolo === 'installatore' ? colors.accentLight : 'rgba(255, 255, 255, 0.7)'
                  }}>
                    Installatore
                  </span>
                  <span style={{
                    fontSize: '11px',
                    color: 'rgba(255, 255, 255, 0.45)',
                    textAlign: 'center',
                    lineHeight: 1.3
                  }}>
                    Per gestire impianti clienti
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* GDPR Checkboxes - Refs per evitare closure problems */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
            {/* Privacy Policy Checkbox */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <input
                type="checkbox"
                id="gdprAccepted"
                ref={gdprRef}
                onChange={() => {
                  if (validationErrors.length > 0) setValidationErrors([]);
                }}
                disabled={isLoading}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: colors.accent,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  marginTop: '2px',
                  flexShrink: 0,
                }}
              />
              <label
                htmlFor="gdprAccepted"
                style={{
                  fontSize: '13px',
                  color: colors.textMuted,
                  lineHeight: 1.4,
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
              >
                Ho letto e accetto la{' '}
                <Link
                  to="/privacy"
                  target="_blank"
                  style={{ color: colors.accentLight, textDecoration: 'underline' }}
                >
                  Privacy Policy
                </Link>{' '}
                e i{' '}
                <Link
                  to="/terms"
                  target="_blank"
                  style={{ color: colors.accentLight, textDecoration: 'underline' }}
                >
                  Termini di Servizio
                </Link>
              </label>
            </div>

            {/* Age Confirmation Checkbox */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <input
                type="checkbox"
                id="ageConfirmed"
                ref={ageRef}
                onChange={() => {
                  if (validationErrors.length > 0) setValidationErrors([]);
                }}
                disabled={isLoading}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: colors.accent,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  marginTop: '2px',
                  flexShrink: 0,
                }}
              />
              <label
                htmlFor="ageConfirmed"
                style={{
                  fontSize: '13px',
                  color: colors.textMuted,
                  lineHeight: 1.4,
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
              >
                Confermo di avere almeno 16 anni di eta
              </label>
            </div>
          </div>

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

          <AuthButton
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
          </AuthButton>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-1 transition-all"
              style={{
                fontSize: '13px',
                color: colors.accentLight,
              }}
            >
              <RiArrowLeftLine size={16} />
              <span>Hai già un account? Accedi</span>
            </Link>
          </div>
        </form>

        <div
          className="mt-6 pt-4"
          style={{ borderTop: `1px solid ${colors.border}` }}
        >
          <p style={{ fontSize: '11px', color: colors.textMuted, textAlign: 'center' }}>
            Password criptata con bcrypt - Connessione SSL/TLS
          </p>
        </div>

      </AuthCard>
    </div>
  );
};
