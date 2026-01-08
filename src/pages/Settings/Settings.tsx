import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { useAuthStore } from '@/store/authStore';
import { useThemeColor, colorThemes, ColorTheme } from '@/contexts/ThemeColorContext';
import { RiUserLine, RiNotification3Line, RiShieldLine, RiMailLine, RiArrowRightSLine, RiLogoutBoxLine, RiInformationLine, RiQuestionLine, RiSmartphoneLine, RiPaletteLine, RiCheckLine, RiLockLine, RiLoader4Line } from 'react-icons/ri';
import { UserRole } from '@/types';
import { APP_VERSION } from '@/config/version';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useNotifications } from '@/hooks/useNotifications';

// ============================================
// SETTINGS PAGE - Dark Luxury Style
// Con supporto tema dinamico
// ============================================

// Colori base (invarianti)
const baseColors = {
  bgCardLit: 'linear-gradient(165deg, #2a2722 0%, #1e1c18 50%, #1a1816 100%)',
  bgCard: '#1e1c18',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.75)',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  cardShadowLit: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
  toggleTrack: 'rgba(50, 45, 38, 1)',
  toggleTrackBorder: 'rgba(70, 62, 50, 0.8)',
  error: '#ef4444',
  warning: '#f59e0b',
};

export const Settings = () => {
  const { user, logout } = useAuthStore();
  const { colorTheme, setColorTheme, colors: themeColors } = useThemeColor();
  const navigate = useNavigate();
  const { isSupported, isEnabled, loading: notificationsLoading, error: notificationsError, enableNotifications, disableNotifications } = useNotifications();

  const isAdmin = user?.ruolo === UserRole.ADMIN;

  // Colori dinamici basati sul tema
  const colors = {
    ...baseColors,
    accent: themeColors.accent,
    accentLight: themeColors.accentLight,
    accentDark: themeColors.accentDark,
    border: `rgba(${hexToRgb(themeColors.accent)}, 0.15)`,
    borderHover: `rgba(${hexToRgb(themeColors.accent)}, 0.35)`,
  };

  // Stile base card (dinamico)
  const cardStyle = {
    background: colors.bgCardLit,
    border: `1px solid ${colors.border}`,
    borderRadius: '20px',
    boxShadow: colors.cardShadowLit,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  };

  // Top edge highlight (dinamico)
  const topHighlight = {
    position: 'absolute' as const,
    top: 0,
    left: '25%',
    right: '25%',
    height: '1px',
    background: `linear-gradient(90deg, transparent, ${colors.accentLight}4D, transparent)`,
    pointerEvents: 'none' as const,
  };

  // Funzione helper per convertire hex a rgb
  function hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
    }
    return '106, 212, 160';
  }

  // Gestione cambio tema
  const handleThemeChange = (theme: ColorTheme) => {
    setColorTheme(theme);
    toast.success(`Tema ${colorThemes[theme].name}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Toggle Switch Component
  const ToggleSwitch = ({
    enabled,
    onToggle,
    accentColor = colors.accent
  }: {
    enabled: boolean;
    onToggle: () => void;
    accentColor?: string;
  }) => (
    <motion.button
      onClick={onToggle}
      style={{
        width: '52px',
        height: '28px',
        borderRadius: '9999px',
        background: enabled
          ? `linear-gradient(135deg, ${accentColor}, ${colors.accentDark})`
          : colors.toggleTrack,
        border: `1px solid ${enabled ? accentColor : colors.toggleTrackBorder}`,
        position: 'relative',
        cursor: 'pointer',
        boxShadow: enabled ? `0 0 16px ${accentColor}40` : 'none',
      }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        animate={{ x: enabled ? 24 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          position: 'absolute',
          top: '2px',
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: enabled
            ? `linear-gradient(135deg, #fff 0%, ${colors.accentLight} 100%)`
            : 'linear-gradient(135deg, #888 0%, #666 100%)',
          boxShadow: enabled
            ? `0 2px 8px rgba(0,0,0,0.3), 0 0 8px ${accentColor}40`
            : '0 2px 6px rgba(0,0,0,0.4)',
        }}
      />
    </motion.button>
  );

  // Setting Row Component
  const SettingRow = ({
    icon: Icon,
    iconBg,
    title,
    subtitle,
    onClick,
    rightElement,
    showArrow = true
  }: {
    icon: React.ElementType;
    iconBg: string;
    title: string;
    subtitle: string;
    onClick?: () => void;
    rightElement?: React.ReactNode;
    showArrow?: boolean;
  }) => (
    <motion.div
      onClick={onClick}
      style={{
        ...cardStyle,
        padding: '14px',
        cursor: onClick ? 'pointer' : 'default',
      }}
      whileHover={onClick ? { scale: 1.01 } : undefined}
      whileTap={onClick ? { scale: 0.99 } : undefined}
    >
      <div style={topHighlight} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              padding: '8px',
              borderRadius: '12px',
              background: iconBg,
            }}
          >
            <Icon size={18} style={{ color: iconBg.includes('accent') ? colors.accent : colors.textPrimary }} />
          </div>
          <div>
            <h3 style={{
              fontSize: '14px',
              fontWeight: 500,
              color: colors.textPrimary,
              margin: 0,
            }}>
              {title}
            </h3>
            <p style={{
              fontSize: '11px',
              color: colors.textMuted,
              margin: '2px 0 0 0',
            }}>
              {subtitle}
            </p>
          </div>
        </div>
        {rightElement || (showArrow && (
          <RiArrowRightSLine size={18} style={{ color: colors.textMuted }} />
        ))}
      </div>
    </motion.div>
  );

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 700,
              color: colors.textPrimary,
              margin: 0,
            }}>
              Impostazioni
            </h1>
            <p style={{
              fontSize: '12px',
              color: colors.textMuted,
              margin: '4px 0 0 0',
            }}>
              v{APP_VERSION}
            </p>
          </div>
        </div>

        {/* Profilo Utente Card - Cliccabile */}
        <motion.div
          onClick={() => navigate('/settings/profilo')}
          style={{
            ...cardStyle,
            padding: '16px',
            cursor: 'pointer',
          }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div style={topHighlight} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${colors.accent}30, ${colors.accentDark}20)`,
                border: `1px solid ${colors.accent}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <RiUserLine size={24} style={{ color: colors.accent }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 600,
                color: colors.textPrimary,
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {user?.nome || 'Utente'}
              </h3>
              <p style={{
                fontSize: '12px',
                color: colors.textMuted,
                margin: '4px 0 0 0',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <RiMailLine size={12} />
                <span style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {user?.email || 'email@example.com'}
                </span>
              </p>
              {isAdmin && (
                <span
                  style={{
                    display: 'inline-block',
                    marginTop: '6px',
                    padding: '2px 8px',
                    fontSize: '10px',
                    fontWeight: 600,
                    color: colors.accent,
                    background: `${colors.accent}15`,
                    border: `1px solid ${colors.accent}30`,
                    borderRadius: '6px',
                  }}
                >
                  ADMIN
                </span>
              )}
            </div>
            <RiArrowRightSLine size={18} style={{ color: colors.textMuted, flexShrink: 0 }} />
          </div>
        </motion.div>

        {/* Aspetto Section */}
        <div>
          <h2 style={{
            fontSize: '12px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: colors.textMuted,
            margin: '0 0 10px 4px',
          }}>
            Aspetto
          </h2>

          {/* Theme Color Selector Card */}
          <motion.div
            style={{
              ...cardStyle,
              padding: '16px',
            }}
          >
            <div style={topHighlight} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div
                style={{
                  padding: '8px',
                  borderRadius: '12px',
                  background: `${colors.accent}20`,
                }}
              >
                <RiPaletteLine size={18} style={{ color: colors.accent }} />
              </div>
              <div>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: colors.textPrimary,
                  margin: 0,
                }}>
                  Colore Tema
                </h3>
                <p style={{
                  fontSize: '11px',
                  color: colors.textMuted,
                  margin: '2px 0 0 0',
                }}>
                  {colorThemes[colorTheme].name}
                </p>
              </div>
            </div>

            {/* Color Options Grid */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-start' }}>
              {(Object.keys(colorThemes) as ColorTheme[]).map((theme) => {
                const themeConfig = colorThemes[theme];
                const isSelected = colorTheme === theme;
                return (
                  <motion.button
                    key={theme}
                    onClick={() => handleThemeChange(theme)}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      border: isSelected
                        ? `2px solid ${themeConfig.accent}`
                        : '2px solid transparent',
                      background: `linear-gradient(135deg, ${themeConfig.accent}30, ${themeConfig.accentDark}20)`,
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: isSelected
                        ? `0 0 12px ${themeConfig.accent}40`
                        : 'none',
                      flexShrink: 0,
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    title={themeConfig.name}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        inset: '20%',
                        borderRadius: '50%',
                        background: themeConfig.accent,
                        boxShadow: `0 0 8px ${themeConfig.accent}60`,
                      }}
                    />
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(0,0,0,0.3)',
                        }}
                      >
                        <RiCheckLine size={14} style={{ color: '#fff' }} />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Account Section */}
        <div>
          <h2 style={{
            fontSize: '12px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: colors.textMuted,
            margin: '0 0 10px 4px',
          }}>
            Account
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Notifiche Toggle */}
            {isSupported ? (
              <SettingRow
                icon={RiNotification3Line}
                iconBg={`${colors.accent}20`}
                title="Notifiche Push"
                subtitle={
                  notificationsLoading
                    ? 'Caricamento...'
                    : notificationsError
                      ? notificationsError
                      : isEnabled
                        ? 'Attive'
                        : 'Disattivate'
                }
                showArrow={false}
                rightElement={
                  notificationsLoading ? (
                    <RiLoader4Line
                      size={24}
                      style={{
                        color: colors.accent,
                        animation: 'spin 1s linear infinite'
                      }}
                    />
                  ) : (
                    <ToggleSwitch
                      enabled={isEnabled}
                      onToggle={async () => {
                        if (isEnabled) {
                          await disableNotifications();
                        } else {
                          await enableNotifications();
                        }
                      }}
                    />
                  )
                }
              />
            ) : (
              <SettingRow
                icon={RiNotification3Line}
                iconBg={`${colors.textMuted}20`}
                title="Notifiche Push"
                subtitle="Non supportate su questo browser"
                showArrow={false}
              />
            )}

            {/* Dispositivi Connessi */}
            <SettingRow
              icon={RiSmartphoneLine}
              iconBg={`${colors.warning}20`}
              title="Dispositivi Connessi"
              subtitle="Gestisci sessioni attive"
              onClick={() => navigate('/settings/dispositivi-connessi')}
            />
          </div>
        </div>

        {/* Sicurezza Section */}
        <div>
          <h2 style={{
            fontSize: '12px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: colors.textMuted,
            margin: '0 0 10px 4px',
          }}>
            Sicurezza
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <SettingRow
              icon={RiLockLine}
              iconBg={`${colors.warning}20`}
              title="Password"
              subtitle="Modifica password"
              onClick={() => navigate('/settings/password')}
            />
          </div>
        </div>

        {/* Admin Panel */}
        {isAdmin && (
          <div>
            <h2 style={{
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: colors.textMuted,
              margin: '0 0 10px 4px',
            }}>
              Amministrazione
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <SettingRow
                icon={RiShieldLine}
                iconBg={`${colors.error}20`}
                title="Gestione Utenti"
                subtitle="Amministra account utenti"
                onClick={() => navigate('/settings/admin/utenti')}
              />
            </div>
          </div>
        )}

        {/* Info Section */}
        <div>
          <h2 style={{
            fontSize: '12px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: colors.textMuted,
            margin: '0 0 10px 4px',
          }}>
            Informazioni
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <SettingRow
              icon={RiQuestionLine}
              iconBg={`${colors.accent}20`}
              title="Guida"
              subtitle="Come usare l'app"
              onClick={() => navigate('/settings/guida')}
            />
            <SettingRow
              icon={RiInformationLine}
              iconBg={`${colors.accent}20`}
              title="Informazioni"
              subtitle={`OmniaPi v${APP_VERSION}`}
              onClick={() => navigate('/settings/info')}
            />
          </div>
        </div>

        {/* Logout Button */}
        <motion.button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '14px',
            background: `${colors.error}15`,
            border: `1px solid ${colors.error}30`,
            borderRadius: '16px',
            color: colors.error,
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            marginTop: '8px',
          }}
          whileHover={{
            scale: 1.02,
            background: `${colors.error}25`,
          }}
          whileTap={{ scale: 0.98 }}
        >
          <RiLogoutBoxLine size={18} />
          Esci dall'account
        </motion.button>

        {/* Footer Spacing for Bottom Nav */}
        <div style={{ height: '80px' }} />
      </div>
    </Layout>
  );
};
