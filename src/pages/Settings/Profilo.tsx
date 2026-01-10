import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { useAuthStore } from '@/store/authStore';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import { RiArrowLeftLine, RiUserLine, RiMailLine, RiSaveLine } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/services/api';

// ============================================
// PROFILO PAGE - Modifica dati utente
// ============================================

const baseColors = {
  bgCardLit: 'linear-gradient(165deg, #2a2722 0%, #1e1c18 50%, #1a1816 100%)',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.75)',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  cardShadowLit: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
};

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '106, 212, 160';
}

export const Profilo = () => {
  const { user, setUser } = useAuthStore();
  const { colors: themeColors } = useThemeColor();
  const navigate = useNavigate();

  const [nome, setNome] = useState(user?.nome || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);

  const colors = {
    ...baseColors,
    accent: themeColors.accent,
    accentLight: themeColors.accentLight,
    border: `rgba(${hexToRgb(themeColors.accent)}, 0.15)`,
  };

  const cardStyle = {
    background: colors.bgCardLit,
    border: `1px solid ${colors.border}`,
    borderRadius: '20px',
    boxShadow: colors.cardShadowLit,
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

  const handleSave = async () => {
    if (!nome.trim()) {
      toast.error('Il nome non puo essere vuoto');
      return;
    }

    setLoading(true);
    try {
      const response = await api.put('/api/auth/profile', { nome, email });
      setUser(response.data.user);
      toast.success('Profilo aggiornato con successo');
      navigate('/settings');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Errore durante l\'aggiornamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
          <h1 style={{
            fontSize: '24px',
            fontWeight: 700,
            color: colors.textPrimary,
            margin: 0,
          }}>
            Profilo
          </h1>
        </div>

        {/* Avatar Card */}
        <motion.div style={{ ...cardStyle, padding: '24px' }}>
          <div style={topHighlight} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${colors.accent}30, ${colors.accent}10)`,
                border: `2px solid ${colors.accent}50`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RiUserLine size={36} style={{ color: colors.accent }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 600,
                color: colors.textPrimary,
                margin: 0,
              }}>
                {user?.nome || 'Utente'}
              </h2>
              <p style={{
                fontSize: '13px',
                color: colors.textMuted,
                margin: '4px 0 0 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}>
                <RiMailLine size={14} />
                {user?.email || 'email@example.com'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Form Card */}
        <motion.div style={{ ...cardStyle, padding: '20px' }}>
          <div style={topHighlight} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Il tuo nome"
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="La tua email"
            />
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={loading}
              className="w-full mt-2"
            >
              <RiSaveLine size={18} className="mr-2" />
              {loading ? 'Salvataggio...' : 'Salva Modifiche'}
            </Button>
          </div>
        </motion.div>

        {/* Footer Spacing */}
        <div style={{ height: '80px' }} />
      </div>
    </Layout>
  );
};
