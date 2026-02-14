import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import { RiArrowLeftLine, RiLockLine, RiEyeLine, RiEyeOffLine, RiShieldCheckLine, RiMailCheckLine } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/utils/toast';
import { api } from '@/services/api';

// ============================================
// CAMBIA PASSWORD PAGE
// ============================================

const baseColors = {
  bgCard: '#1e1c18', // Solid color per motion elements (evita errori framer-motion)
  bgCardLit: 'linear-gradient(165deg, #2a2722 0%, #1e1c18 50%, #1a1816 100%)',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.75)',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  cardShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)',
  cardShadowLit: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
  error: '#ef4444',
  success: '#22c55e',
};

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '106, 212, 160';
}

export const CambiaPassword = () => {
  const { colors: themeColors } = useThemeColor();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const colors = {
    ...baseColors,
    accent: themeColors.accent,
    accentLight: themeColors.accentLight,
    border: `rgba(${hexToRgb(themeColors.accent)}, 0.15)`,
  };

  const cardStyle = {
    background: colors.bgCard, // Solid color per evitare errori framer-motion
    border: `1px solid ${colors.border}`,
    borderRadius: '20px',
    boxShadow: colors.cardShadow,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  };

  const topHighlight = {
    position: 'absolute' as const,
    top: 0,
    left: '25%',
    right: '25%',
    height: '1px',
    background: `linear-gradient(90deg, transparent, ${colors.accentLight}4D, transparent)`,
    pointerEvents: 'none' as const,
  };

  // Validazione password
  const passwordChecks = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
  };

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async () => {
    if (!currentPassword) {
      toast.error('Inserisci la password attuale');
      return;
    }
    if (!isPasswordValid) {
      toast.error('La nuova password non rispetta i requisiti');
      return;
    }
    if (!passwordsMatch) {
      toast.error('Le password non coincidono');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/auth/change-password', {
        currentPassword,
        newPassword,
      });
      if (response.data.requiresConfirmation) {
        setEmailSent(true);
      } else {
        toast.success('Password aggiornata con successo');
        navigate('/settings');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Errore durante l\'aggiornamento');
    } finally {
      setLoading(false);
    }
  };

  const PasswordToggle = ({ show, onToggle }: { show: boolean; onToggle: () => void }) => (
    <button
      type="button"
      onClick={onToggle}
      style={{
        background: 'none',
        border: 'none',
        color: colors.textMuted,
        cursor: 'pointer',
        padding: '4px',
      }}
    >
      {show ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
    </button>
  );

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', viewTransitionName: 'page-content' as any }}>
        {/* Header con Back */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <motion.button
            onClick={() => navigate('/settings')}
            style={{
              padding: '10px',
              borderRadius: '12px',
              background: `${colors.accent}15`,
              border: `1px solid ${colors.accent}30`,
              color: colors.accent,
              cursor: 'pointer',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RiArrowLeftLine size={20} />
          </motion.button>
          <div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 700,
              color: colors.textPrimary,
              margin: 0,
            }}>
              Cambia Password
            </h1>
            <p style={{
              fontSize: '12px',
              color: colors.textMuted,
              margin: '4px 0 0 0',
            }}>
              Modifica la tua password di accesso
            </p>
          </div>
        </div>

        {/* Email sent confirmation */}
        {emailSent ? (
          <div style={{ ...cardStyle, padding: '32px' }}>
            <div style={topHighlight} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
              <div style={{ padding: '20px', borderRadius: '50%', background: `${colors.accent}15` }}>
                <RiMailCheckLine size={40} style={{ color: colors.accent }} />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: colors.textPrimary, margin: 0 }}>
                Email di conferma inviata
              </h2>
              <p style={{ fontSize: '14px', color: colors.textSecondary, margin: 0, lineHeight: 1.6 }}>
                Controlla la tua casella di posta e clicca il link per confermare il cambio password. Il link scade tra 1 ora.
              </p>
              <Button
                variant="primary"
                onClick={() => navigate('/settings')}
                className="w-full mt-2"
              >
                Torna alle Impostazioni
              </Button>
            </div>
          </div>
        ) : (
        <>
        {/* Icon Card */}
        <div style={{ ...cardStyle, padding: '24px' }}>
          <div style={topHighlight} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                padding: '16px',
                borderRadius: '50%',
                background: `${colors.accent}15`,
              }}
            >
              <RiLockLine size={32} style={{ color: colors.accent }} />
            </div>
            <p style={{
              fontSize: '14px',
              color: colors.textSecondary,
              margin: 0,
              textAlign: 'center',
            }}>
              Scegli una password sicura per proteggere il tuo account
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div style={{ ...cardStyle, padding: '20px' }}>
          <div style={topHighlight} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Password attuale */}
            <div style={{ position: 'relative' }}>
              <Input
                label="Password Attuale"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Inserisci la password attuale"
              />
              <div style={{ position: 'absolute', right: '12px', top: '38px' }}>
                <PasswordToggle show={showCurrent} onToggle={() => setShowCurrent(!showCurrent)} />
              </div>
            </div>

            {/* Nuova password */}
            <div style={{ position: 'relative' }}>
              <Input
                label="Nuova Password"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Inserisci la nuova password"
              />
              <div style={{ position: 'absolute', right: '12px', top: '38px' }}>
                <PasswordToggle show={showNew} onToggle={() => setShowNew(!showNew)} />
              </div>
            </div>

            {/* Requisiti password */}
            {newPassword.length > 0 && (
              <div style={{
                padding: '12px',
                borderRadius: '12px',
                background: `${colors.accent}08`,
                border: `1px solid ${colors.accent}20`,
              }}>
                <p style={{ fontSize: '11px', color: colors.textMuted, margin: '0 0 8px 0' }}>
                  Requisiti password:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {[
                    { check: passwordChecks.length, label: 'Almeno 8 caratteri' },
                    { check: passwordChecks.uppercase, label: 'Una lettera maiuscola' },
                    { check: passwordChecks.lowercase, label: 'Una lettera minuscola' },
                    { check: passwordChecks.number, label: 'Un numero' },
                  ].map(({ check, label }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <RiShieldCheckLine
                        size={14}
                        style={{ color: check ? colors.success : colors.textMuted }}
                      />
                      <span style={{
                        fontSize: '12px',
                        color: check ? colors.success : colors.textMuted,
                      }}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conferma password */}
            <div style={{ position: 'relative' }}>
              <Input
                label="Conferma Password"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ripeti la nuova password"
              />
              <div style={{ position: 'absolute', right: '12px', top: '38px' }}>
                <PasswordToggle show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} />
              </div>
              {confirmPassword.length > 0 && (
                <p style={{
                  fontSize: '11px',
                  color: passwordsMatch ? colors.success : colors.error,
                  margin: '4px 0 0 0',
                }}>
                  {passwordsMatch ? 'Le password coincidono' : 'Le password non coincidono'}
                </p>
              )}
            </div>

            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={loading || !isPasswordValid || !passwordsMatch}
              className="w-full mt-2"
            >
              <RiLockLine size={18} className="mr-2" />
              {loading ? 'Aggiornamento...' : 'Aggiorna Password'}
            </Button>
          </div>
        </div>
        </>
        )}
      </div>
    </Layout>
  );
};
