import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Toggle } from '@/components/common/Toggle';
import { useAuthStore } from '@/store/authStore';
import { useThemeColor, colorThemes, ColorTheme, ThemeMode } from '@/contexts/ThemeColorContext';
import { RiUserLine, RiNotification3Line, RiMailLine, RiArrowRightSLine, RiLogoutBoxLine, RiInformationLine, RiQuestionLine, RiSmartphoneLine, RiPaletteLine, RiCheckLine, RiLockLine, RiLoader4Line, RiCheckboxCircleLine, RiSunLine, RiMoonLine, RiFlashlightLine } from 'react-icons/ri';
import { APP_VERSION } from '@/config/version';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/utils/toast';
import { useNotifications } from '@/hooks/useNotifications';
import { usePWAInstall } from '@/hooks/usePWAInstall';

// ============================================
// SETTINGS PAGE - Dark Luxury Style
// Con supporto tema dinamico
// ============================================

// Variants per animazioni card (uniformi come Dashboard)
const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } }
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } }
};

export const Settings = () => {
  const { user, logout } = useAuthStore();
  const { colorTheme, setColorTheme, colors: themeColors, setThemeMode, isDarkMode, modeColors, useGradients, setUseGradients } = useThemeColor();
  const navigate = useNavigate();
  const { isSupported, isEnabled, loading: notificationsLoading, error: notificationsError, enableNotifications, disableNotifications } = useNotifications();
  const { isStandalone } = usePWAInstall();

  // Colori dinamici basati sul tema (usa modeColors per dark/light)
  const colors = {
    ...modeColors,
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
        padding: '10px',
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
      <motion.div
        initial="hidden"
        animate="show"
        variants={containerVariants}
        style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
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
          variants={cardVariants}
          onClick={() => navigate('/settings/profilo')}
          style={{
            ...cardStyle,
            padding: '12px',
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
              {user?.ruolo && (
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
                    textTransform: 'uppercase',
                  }}
                >
                  {user.ruolo}
                </span>
              )}
            </div>
            <RiArrowRightSLine size={18} style={{ color: colors.textMuted, flexShrink: 0 }} />
          </div>
        </motion.div>

        {/* Aspetto Section */}
        <motion.div variants={cardVariants} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h2 style={{
            fontSize: '12px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: colors.textMuted,
            margin: '0 0 0 4px',
          }}>
            Aspetto
          </h2>

          {/* Theme Color Selector Card */}
          <motion.div
            style={{
              ...cardStyle,
              padding: '12px',
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

            {/* Color Options Grid - Responsive */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(40px, 1fr))',
              gap: '10px',
              maxWidth: '100%',
            }}>
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

          {/* Dark/Light Mode Toggle */}
          <motion.div
            style={{
              ...cardStyle,
              padding: '12px',
            }}
          >
            <div style={topHighlight} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    padding: '8px',
                    borderRadius: '12px',
                    background: isDarkMode ? `${colors.accent}20` : `${colors.warning}20`,
                  }}
                >
                  {isDarkMode ? (
                    <RiMoonLine size={18} style={{ color: colors.accent }} />
                  ) : (
                    <RiSunLine size={18} style={{ color: colors.warning }} />
                  )}
                </div>
                <div>
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: colors.textPrimary,
                    margin: 0,
                  }}>
                    Modalità {isDarkMode ? 'Scura' : 'Chiara'}
                  </h3>
                  <p style={{
                    fontSize: '11px',
                    color: colors.textMuted,
                    margin: '2px 0 0 0',
                  }}>
                    {isDarkMode ? 'Tema scuro attivo' : 'Tema chiaro attivo'}
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <Toggle
                isOn={isDarkMode}
                onToggle={() => {
                  const newMode: ThemeMode = isDarkMode ? 'light' : 'dark';
                  setThemeMode(newMode);
                  toast.success(newMode === 'dark' ? 'Tema scuro' : 'Tema chiaro');
                }}
                size="lg"
              />
            </div>
          </motion.div>

          {/* Gradient Toggle */}
          <motion.div
            style={{
              ...cardStyle,
              padding: '12px',
            }}
          >
            <div style={topHighlight} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    padding: '8px',
                    borderRadius: '12px',
                    background: useGradients ? `${colors.accent}20` : `${colors.textMuted}20`,
                  }}
                >
                  <RiFlashlightLine size={18} style={{ color: useGradients ? colors.accent : colors.textMuted }} />
                </div>
                <div>
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: colors.textPrimary,
                    margin: 0,
                  }}>
                    Usa Gradienti
                  </h3>
                  <p style={{
                    fontSize: '11px',
                    color: colors.textMuted,
                    margin: '2px 0 0 0',
                  }}>
                    Applica effetto gradiente ai controlli
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <Toggle
                isOn={useGradients}
                onToggle={() => {
                  setUseGradients(!useGradients);
                  toast.success(useGradients ? 'Gradienti disattivati' : 'Gradienti attivati');
                }}
                size="lg"
              />
            </div>
          </motion.div>
        </motion.div>

        {/* Account Section */}
        <motion.div variants={cardVariants}>
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
                    <Toggle
                      isOn={isEnabled}
                      onToggle={async () => {
                        if (isEnabled) {
                          await disableNotifications();
                        } else {
                          await enableNotifications();
                        }
                      }}
                      size="lg"
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

            {/* Stato App Installata - mostrato solo se in standalone mode */}
            {isStandalone && (
              <SettingRow
                icon={RiCheckboxCircleLine}
                iconBg="rgba(34, 197, 94, 0.2)"
                title="App Installata"
                subtitle="Stai usando l'app installata"
                showArrow={false}
              />
            )}
          </div>
        </motion.div>

        {/* Sicurezza Section */}
        <motion.div variants={cardVariants}>
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
        </motion.div>

        {/* Info Section */}
        <motion.div variants={cardVariants}>
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
              subtitle={`OmniaPi ${APP_VERSION}`}
              onClick={() => navigate('/settings/info')}
            />
          </div>
        </motion.div>

        {/* Versione App */}
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <span style={{ fontSize: '12px', color: colors.textMuted }}>
            {APP_VERSION}
          </span>
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

      </motion.div>
    </Layout>
  );
};
