import { memo } from 'react';
import { motion } from 'framer-motion';
import { ContextMenu, ContextMenuItem } from '@/components/common/ContextMenu';
import { RiDeleteBinLine, RiLoader4Line, RiTimeLine, RiEditLine, RiPushpinLine, RiUnpinLine, RiPlayLine } from 'react-icons/ri';
import { SceneIcon } from '@/pages/Scene/Scene';
import { useThemeColors } from '@/hooks/useThemeColors';

// ============================================
// SCENE CARD - Dark Luxury Style
// Con React.memo per evitare re-render inutili
// ============================================

interface SceneCardProps {
  scena: any;
  executing: boolean;
  onExecute: () => void;
  onDelete?: () => void;
  onSchedule: () => void;
  onToggleShortcut?: (isShortcut: boolean) => void;
  onEdit?: () => void;
}

const SceneCardComponent = ({ scena, executing, onExecute, onDelete, onSchedule, onToggleShortcut, onEdit }: SceneCardProps) => {
  const { colors } = useThemeColors();
  const deviceCount = scena.azioni?.length || 0;
  const isShortcut = scena.is_shortcut !== false && scena.is_shortcut !== 0;

  // Top highlight style
  const topHighlight = {
    position: 'absolute' as const,
    top: 0,
    left: '25%',
    right: '25%',
    height: '1px',
    background: `linear-gradient(90deg, transparent, ${colors.accentLight}4D, transparent)`,
  };

  // Build context menu items
  const contextMenuItems: ContextMenuItem[] = [];

  if (onToggleShortcut) {
    contextMenuItems.push({
      label: isShortcut ? 'Rimuovi dalle scorciatoie' : 'Aggiungi alle scorciatoie',
      icon: isShortcut ? RiUnpinLine : RiPushpinLine,
      onClick: () => onToggleShortcut(!isShortcut)
    });
  }

  if (onEdit) {
    contextMenuItems.push({
      label: 'Modifica',
      icon: RiEditLine,
      onClick: onEdit
    });
  }

  contextMenuItems.push({
    label: 'Programmazione',
    icon: RiTimeLine,
    onClick: onSchedule
  });

  if (!scena.is_base && onDelete) {
    contextMenuItems.push({
      label: 'Elimina',
      icon: RiDeleteBinLine,
      onClick: onDelete,
      danger: true
    });
  }

  return (
    <ContextMenu items={contextMenuItems}>
      <motion.div
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('button')) return;
          onExecute();
        }}
        style={{
          background: executing
            ? `linear-gradient(165deg, ${colors.accent}15, ${colors.bgCardLit.split(',')[1]}`
            : colors.bgCardLit,
          border: `1px solid ${executing ? colors.accent : colors.border}`,
          borderRadius: '20px',
          boxShadow: executing
            ? `0 0 20px ${colors.accent}30, ${colors.cardShadowLit}`
            : colors.cardShadowLit,
          position: 'relative',
          overflow: 'hidden',
          padding: '10px',
          cursor: 'pointer',
        }}
        whileHover={{ scale: 1.02, borderColor: colors.borderHover }}
        whileTap={{ scale: 0.98 }}
      >
        <div style={topHighlight} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Left: Icon + Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
            {/* Icon */}
            <motion.div
              animate={executing ? { scale: [1, 1.1, 1] } : {}}
              transition={executing ? { repeat: Infinity, duration: 1 } : {}}
              style={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                padding: '6px',
                borderRadius: '10px',
                background: `${colors.accent}15`,
              }}
            >
              {executing ? (
                <RiLoader4Line
                  size={22}
                  style={{ color: colors.accent }}
                  className="animate-spin"
                />
              ) : (
                <SceneIcon
                  iconId={scena.icona}
                  size={22}
                  style={{
                    color: colors.accentLight,
                    filter: `drop-shadow(0 0 4px ${colors.accent}50)`,
                  }}
                />
              )}
            </motion.div>

            {/* Nome e info */}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: colors.textPrimary,
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {scena.nome}
                </h3>
                {scena.is_base && (
                  <span style={{
                    padding: '2px 6px',
                    fontSize: '9px',
                    fontWeight: 600,
                    background: `${colors.accent}20`,
                    color: colors.accent,
                    borderRadius: '4px',
                    flexShrink: 0,
                  }}>
                    BASE
                  </span>
                )}
                {isShortcut && (
                  <RiPushpinLine size={12} style={{ color: colors.accentLight, flexShrink: 0 }} />
                )}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginTop: '4px',
              }}>
                <span style={{
                  fontSize: '11px',
                  color: colors.textMuted,
                }}>
                  {deviceCount} dispositiv{deviceCount === 1 ? 'o' : 'i'}
                </span>
                {scena.scheduling?.enabled && (
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    color: colors.success,
                  }}>
                    <RiTimeLine size={11} />
                    Programmata
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Action buttons */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            flexShrink: 0,
            marginLeft: '10px',
          }}>
            {/* Play button */}
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onExecute();
              }}
              style={{
                padding: '8px',
                borderRadius: '10px',
                background: `${colors.accent}15`,
                border: `1px solid ${colors.accent}30`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              whileHover={{ scale: 1.1, background: `${colors.accent}25` }}
              whileTap={{ scale: 0.9 }}
              title="Esegui"
            >
              <RiPlayLine size={14} style={{ color: colors.accent }} />
            </motion.button>

            {/* Edit button */}
            {onEdit && (
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                style={{
                  padding: '8px',
                  borderRadius: '10px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.9 }}
                title="Modifica"
              >
                <RiEditLine size={14} style={{ color: colors.textMuted }} />
              </motion.button>
            )}

            {/* Schedule button */}
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onSchedule();
              }}
              style={{
                padding: '8px',
                borderRadius: '10px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.1)' }}
              whileTap={{ scale: 0.9 }}
              title="Programmazione"
            >
              <RiTimeLine
                size={14}
                style={{ color: scena.scheduling?.enabled ? colors.success : colors.textMuted }}
              />
            </motion.button>

            {/* Delete button */}
            {!scena.is_base && onDelete && (
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                style={{
                  padding: '8px',
                  borderRadius: '10px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                whileHover={{ scale: 1.1, background: `${colors.error}20` }}
                whileTap={{ scale: 0.9 }}
                title="Elimina"
              >
                <RiDeleteBinLine size={14} style={{ color: `${colors.error}99` }} />
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </ContextMenu>
  );
};

// React.memo per evitare re-render quando props non cambiano
export const SceneCard = memo(SceneCardComponent);
