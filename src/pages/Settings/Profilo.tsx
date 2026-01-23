import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { useAuthStore } from '@/store/authStore';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import { RiArrowLeftLine, RiUserLine, RiMailLine, RiSaveLine, RiDownloadLine, RiDeleteBinLine, RiAlertLine, RiCloseLine } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/utils/toast';
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
  const email = user?.email || '';
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

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
      const response = await api.put('/api/auth/profile', { nome });
      setUser(response.data.user);
      toast.success('Profilo aggiornato con successo');
      navigate('/settings');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Errore durante l\'aggiornamento');
    } finally {
      setLoading(false);
    }
  };

  // Export data GDPR
  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const response = await api.get('/api/auth/export-data');
      if (response.data.success) {
        // Download as JSON file
        const dataStr = JSON.stringify(response.data.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `omniapi-dati-${user?.email || 'utente'}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Dati esportati con successo');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Errore durante l\'esportazione');
    } finally {
      setExportLoading(false);
    }
  };

  // Delete account GDPR
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'ELIMINA') {
      toast.error('Scrivi ELIMINA per confermare');
      return;
    }
    if (!deletePassword) {
      toast.error('Inserisci la password per confermare');
      return;
    }

    setDeleteLoading(true);
    try {
      const response = await api.post('/api/auth/delete-account', { password: deletePassword });
      if (response.data.success) {
        toast.success('Account eliminato con successo');
        // Logout and redirect
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Errore durante l\'eliminazione');
    } finally {
      setDeleteLoading(false);
    }
  };

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
            <div>
              <Input
                label="Email"
                type="email"
                value={email}
                disabled={true}
                placeholder="La tua email"
              />
              <p style={{
                fontSize: '11px',
                color: colors.textMuted,
                marginTop: '6px',
                fontStyle: 'italic',
              }}>
                Per cambiare email contatta il supporto
              </p>
            </div>
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

        {/* GDPR Section - I miei dati */}
        <motion.div style={{ ...cardStyle, padding: '20px' }}>
          <div style={topHighlight} />
          <h3 style={{
            fontSize: '16px',
            fontWeight: 600,
            color: colors.textPrimary,
            marginBottom: '16px',
          }}>
            I miei dati
          </h3>
          <p style={{
            fontSize: '13px',
            color: colors.textMuted,
            marginBottom: '16px',
            lineHeight: 1.5,
          }}>
            Ai sensi del GDPR (Art. 20), puoi esportare tutti i tuoi dati in qualsiasi momento.
          </p>
          <Button
            variant="secondary"
            onClick={handleExportData}
            disabled={exportLoading}
            className="w-full"
          >
            <RiDownloadLine size={18} className="mr-2" />
            {exportLoading ? 'Esportazione...' : 'Esporta i miei dati'}
          </Button>
        </motion.div>

        {/* Danger Zone - Elimina account */}
        <motion.div
          style={{
            ...cardStyle,
            padding: '20px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          <div style={{ ...topHighlight, background: 'linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.3), transparent)' }} />
          <h3 style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#ef4444',
            marginBottom: '12px',
          }}>
            Zona pericolosa
          </h3>
          <p style={{
            fontSize: '13px',
            color: colors.textMuted,
            marginBottom: '16px',
            lineHeight: 1.5,
          }}>
            L'eliminazione dell'account e permanente. Tutti i tuoi dati, impianti, dispositivi e scene verranno eliminati definitivamente.
          </p>
          <motion.button
            onClick={() => setShowDeleteModal(true)}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'transparent',
              border: '1px solid #dc2626',
              borderRadius: '8px',
              color: '#dc2626',
              fontWeight: 500,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
            whileHover={{
              background: '#dc2626',
              color: '#ffffff',
            }}
            whileTap={{ scale: 0.98 }}
          >
            <RiDeleteBinLine size={18} />
            Elimina il mio account
          </motion.button>
        </motion.div>
      </div>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              zIndex: 100,
            }}
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                ...cardStyle,
                maxWidth: '400px',
                width: '100%',
                padding: '24px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#ef4444', margin: 0 }}>
                  Elimina Account
                </h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: colors.textMuted,
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  <RiCloseLine size={24} />
                </button>
              </div>

              <div style={{
                padding: '12px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                marginBottom: '16px',
              }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <RiAlertLine size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
                  <p style={{ fontSize: '13px', color: '#ef4444', margin: 0, lineHeight: 1.5 }}>
                    Questa azione e irreversibile. Tutti i tuoi dati verranno eliminati permanentemente.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: colors.textMuted, display: 'block', marginBottom: '6px' }}>
                    Scrivi <strong style={{ color: '#ef4444' }}>ELIMINA</strong> per confermare
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="ELIMINA"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${colors.border}`,
                      color: colors.textPrimary,
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', color: colors.textMuted, display: 'block', marginBottom: '6px' }}>
                    Inserisci la tua password
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Password"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${colors.border}`,
                      color: colors.textPrimary,
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <Button
                    variant="secondary"
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1"
                  >
                    Annulla
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading || deleteConfirmText !== 'ELIMINA' || !deletePassword}
                    className="flex-1"
                    style={{
                      background: deleteConfirmText === 'ELIMINA' && deletePassword ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.05)',
                      border: '1px solid rgba(239, 68, 68, 0.5)',
                      color: '#ef4444',
                      opacity: deleteConfirmText !== 'ELIMINA' || !deletePassword ? 0.5 : 1,
                    }}
                  >
                    {deleteLoading ? 'Eliminazione...' : 'Elimina'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
};
