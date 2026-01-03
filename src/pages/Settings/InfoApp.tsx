import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import {
  RiArrowLeftLine,
  RiInformationLine,
  RiCodeSLine,
  RiGithubLine,
  RiHeart2Line,
  RiCopyrightLine,
} from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import { APP_VERSION } from '@/config/version';

// ============================================
// INFO APP PAGE - Informazioni sull'app
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

export const InfoApp = () => {
  const { colors: themeColors } = useThemeColor();
  const navigate = useNavigate();

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

  const infoItems = [
    { label: 'Versione App', value: APP_VERSION },
    { label: 'Build', value: 'Production' },
    { label: 'Piattaforma', value: 'Web App PWA' },
    { label: 'Protocollo', value: 'MQTT / REST API' },
  ];

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
          <div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 700,
              color: colors.textPrimary,
              margin: 0,
            }}>
              Informazioni
            </h1>
            <p style={{
              fontSize: '12px',
              color: colors.textMuted,
              margin: '4px 0 0 0',
            }}>
              Dettagli sull'applicazione
            </p>
          </div>
        </div>

        {/* Logo Card */}
        <motion.div
          style={{ ...cardStyle, padding: '32px' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div style={topHighlight} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            {/* Logo OmniaPi */}
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '20px',
                background: `linear-gradient(135deg, ${colors.accent}30, ${colors.accent}10)`,
                border: `2px solid ${colors.accent}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 8px 32px ${colors.accent}20`,
              }}
            >
              <RiInformationLine size={40} style={{ color: colors.accent }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{
                fontSize: '22px',
                fontWeight: 700,
                color: colors.textPrimary,
                margin: 0,
                letterSpacing: '-0.5px',
              }}>
                OmniaPi
              </h2>
              <p style={{
                fontSize: '13px',
                color: colors.textMuted,
                margin: '6px 0 0 0',
              }}>
                Home Domotic System
              </p>
            </div>
          </div>
        </motion.div>

        {/* Info Card */}
        <motion.div
          style={{ ...cardStyle, padding: '0' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div style={topHighlight} />
          {infoItems.map((item, index) => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                borderBottom: index < infoItems.length - 1 ? `1px solid ${colors.border}` : 'none',
              }}
            >
              <span style={{ fontSize: '14px', color: colors.textSecondary }}>
                {item.label}
              </span>
              <span style={{ fontSize: '14px', color: colors.textPrimary, fontWeight: 500 }}>
                {item.value}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Tech Stack Card */}
        <motion.div
          style={{ ...cardStyle, padding: '16px' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div style={topHighlight} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div
              style={{
                padding: '10px',
                borderRadius: '12px',
                background: `${colors.accent}15`,
              }}
            >
              <RiCodeSLine size={18} style={{ color: colors.accent }} />
            </div>
            <h3 style={{
              fontSize: '14px',
              fontWeight: 600,
              color: colors.textPrimary,
              margin: 0,
            }}>
              Tecnologie
            </h3>
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
          }}>
            {['React', 'TypeScript', 'Node.js', 'Express', 'MQTT', 'MySQL', 'ESP32'].map((tech) => (
              <span
                key={tech}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: colors.accent,
                  background: `${colors.accent}10`,
                  border: `1px solid ${colors.accent}20`,
                  borderRadius: '8px',
                }}
              >
                {tech}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Links Card */}
        <motion.div
          style={{ ...cardStyle, padding: '16px' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div style={topHighlight} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <motion.a
              href="https://github.com/OmniaPi"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: '12px',
                background: `${colors.accent}08`,
                textDecoration: 'none',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <RiGithubLine size={20} style={{ color: colors.accent }} />
              <span style={{ fontSize: '14px', color: colors.textSecondary }}>
                GitHub Repository
              </span>
            </motion.a>
          </div>
        </motion.div>

        {/* Credits Card */}
        <motion.div
          style={{
            ...cardStyle,
            padding: '20px',
            background: `${colors.accent}05`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <div style={topHighlight} />
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            textAlign: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', color: colors.textMuted }}>Made with</span>
              <RiHeart2Line size={16} style={{ color: '#ef4444' }} />
              <span style={{ fontSize: '13px', color: colors.textMuted }}>in Italy</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RiCopyrightLine size={14} style={{ color: colors.textMuted }} />
              <span style={{ fontSize: '12px', color: colors.textMuted }}>
                {new Date().getFullYear()} OmniaPi. All rights reserved.
              </span>
            </div>
          </div>
        </motion.div>

        {/* Footer Spacing */}
        <div style={{ height: '80px' }} />
      </div>
    </Layout>
  );
};
