import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import {
  RiArrowLeftLine,
  RiQuestionLine,
  RiHome4Line,
  RiDeviceLine,
  RiLightbulbLine,
  RiSettings4Line,
  RiArrowDownSLine,
  RiArrowUpSLine,
} from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';

// ============================================
// GUIDA PAGE - FAQ e tutorial
// ============================================

interface FaqItem {
  question: string;
  answer: string;
  icon: React.ElementType;
}

const faqItems: FaqItem[] = [
  {
    question: 'Come aggiungo un nuovo dispositivo?',
    answer: 'Vai nella Dashboard, clicca su "Aggiungi Dispositivo" e segui la procedura guidata. Assicurati che il dispositivo sia acceso e connesso alla stessa rete WiFi.',
    icon: RiDeviceLine,
  },
  {
    question: 'Come creo una stanza?',
    answer: 'Dalla pagina Stanze, clicca sul pulsante "+" in alto a destra. Inserisci il nome della stanza e seleziona un\'icona. Potrai poi assegnare i dispositivi alla stanza.',
    icon: RiHome4Line,
  },
  {
    question: 'Come creo una scena?',
    answer: 'Vai nella pagina Scene e clicca su "Crea Scena". Seleziona i dispositivi che vuoi includere, imposta lo stato desiderato per ognuno e salva. Potrai attivare la scena con un solo tap.',
    icon: RiLightbulbLine,
  },
  {
    question: 'Come configuro il Gateway?',
    answer: 'Il Gateway si configura durante il primo avvio. Collegalo alla corrente, cerca la rete WiFi "OmniaPi-XXXX", connettiti con password "omniapi123" e vai su 192.168.4.1 per inserire le credenziali WiFi.',
    icon: RiSettings4Line,
  },
  {
    question: 'Cosa fare se un dispositivo non risponde?',
    answer: 'Verifica che il dispositivo sia acceso e connesso alla rete. Prova a riavviarlo. Se il problema persiste, verifica che il Gateway sia online dalla Dashboard.',
    icon: RiDeviceLine,
  },
];

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

export const Guida = () => {
  const { colors: themeColors } = useThemeColor();
  const navigate = useNavigate();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

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

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
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
          <div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 700,
              color: colors.textPrimary,
              margin: 0,
            }}>
              Guida
            </h1>
            <p style={{
              fontSize: '12px',
              color: colors.textMuted,
              margin: '4px 0 0 0',
            }}>
              Domande frequenti e tutorial
            </p>
          </div>
        </div>

        {/* Icon Card */}
        <motion.div
          style={{ ...cardStyle, padding: '24px' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div style={topHighlight} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                padding: '16px',
                borderRadius: '50%',
                background: `${colors.accent}15`,
              }}
            >
              <RiQuestionLine size={32} style={{ color: colors.accent }} />
            </div>
            <p style={{
              fontSize: '14px',
              color: colors.textSecondary,
              margin: 0,
              textAlign: 'center',
            }}>
              Trova risposte alle domande piu comuni su OmniaPi
            </p>
          </div>
        </motion.div>

        {/* FAQ Accordion */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {faqItems.map((item, index) => {
            const Icon = item.icon;
            const isExpanded = expandedIndex === index;

            return (
              <motion.div
                key={index}
                style={{ ...cardStyle, padding: '0', cursor: 'pointer' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => toggleExpand(index)}
              >
                <div style={topHighlight} />
                <div style={{ padding: '16px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <div
                        style={{
                          padding: '10px',
                          borderRadius: '12px',
                          background: `${colors.accent}15`,
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={18} style={{ color: colors.accent }} />
                      </div>
                      <h3 style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: colors.textPrimary,
                        margin: 0,
                        lineHeight: 1.4,
                      }}>
                        {item.question}
                      </h3>
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ flexShrink: 0 }}
                    >
                      {isExpanded ? (
                        <RiArrowUpSLine size={20} style={{ color: colors.accent }} />
                      ) : (
                        <RiArrowDownSLine size={20} style={{ color: colors.textMuted }} />
                      )}
                    </motion.div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <p style={{
                          fontSize: '13px',
                          color: colors.textSecondary,
                          margin: '14px 0 0 0',
                          paddingTop: '14px',
                          borderTop: `1px solid ${colors.border}`,
                          lineHeight: 1.6,
                        }}>
                          {item.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Contact Card */}
        <motion.div
          style={{
            ...cardStyle,
            padding: '16px',
            background: `${colors.accent}08`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div style={topHighlight} />
          <p style={{
            fontSize: '13px',
            color: colors.textSecondary,
            margin: 0,
            textAlign: 'center',
            lineHeight: 1.5,
          }}>
            Non hai trovato quello che cerchi?{' '}
            <span style={{ color: colors.accent }}>Contattaci</span> per supporto.
          </p>
        </motion.div>

        {/* Footer Spacing */}
        <div style={{ height: '80px' }} />
      </div>
    </Layout>
  );
};
