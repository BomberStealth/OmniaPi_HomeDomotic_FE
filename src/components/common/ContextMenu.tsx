import { ReactNode, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { useThemeColor } from '@/contexts/ThemeColorContext';

// ============================================
// CONTEXT MENU COMPONENT - Dark Luxury Style
// Con supporto tema dinamico
// ============================================

// Colori base (invarianti)
const baseColors = {
  bgCardLit: 'linear-gradient(165deg, #2a2722 0%, #1e1c18 50%, #1a1816 100%)',
  textPrimary: '#ffffff',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  cardShadowLit: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
  error: '#ef4444',
};

// Helper per convertire hex a rgb
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '106, 212, 160';
};

export interface ContextMenuItem {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface ContextMenuProps {
  children: ReactNode;
  items: ContextMenuItem[];
  disabled?: boolean;
}

interface MenuPosition {
  x: number;
  y: number;
}

export const ContextMenu = ({ children, items, disabled = false }: ContextMenuProps) => {
  const { colors: themeColors } = useThemeColor();
  const [isOpen, setIsOpen] = useState(false);

  // Colori dinamici basati sul tema
  const colors = useMemo(() => ({
    ...baseColors,
    accent: themeColors.accent,
    accentLight: themeColors.accentLight,
    border: `rgba(${hexToRgb(themeColors.accent)}, 0.15)`,
    borderHover: `rgba(${hexToRgb(themeColors.accent)}, 0.35)`,
  }), [themeColors]);
  const [position, setPosition] = useState<MenuPosition>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  // Close menu when clicking outside or scrolling
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside, { passive: true });
      window.addEventListener('scroll', handleScroll, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  // Adjust menu position to stay within viewport
  const adjustPosition = useCallback((x: number, y: number): MenuPosition => {
    const menuWidth = 180;
    const menuHeight = items.length * 44 + 16;
    const padding = 8;
    const bottomNavHeight = 88; // Account for bottom navigation bar

    let adjustedX = x;
    let adjustedY = y;

    // Check right edge
    if (x + menuWidth > window.innerWidth - padding) {
      adjustedX = window.innerWidth - menuWidth - padding;
    }

    // Check bottom edge (account for bottom nav bar)
    if (y + menuHeight > window.innerHeight - bottomNavHeight) {
      adjustedY = window.innerHeight - menuHeight - bottomNavHeight;
    }

    // Check left edge
    if (adjustedX < padding) {
      adjustedX = padding;
    }

    // Check top edge
    if (adjustedY < padding) {
      adjustedY = padding;
    }

    return { x: adjustedX, y: adjustedY };
  }, [items.length]);

  // Handle right-click (desktop)
  const handleContextMenu = (e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    const adjusted = adjustPosition(e.clientX, e.clientY);
    setPosition(adjusted);
    setIsOpen(true);
  };

  // Handle long-press (mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };

    longPressTimer.current = setTimeout(() => {
      if (touchStartPos.current) {
        // Vibrate if supported
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
        const adjusted = adjustPosition(touchStartPos.current.x, touchStartPos.current.y);
        setPosition(adjusted);
        setIsOpen(true);
      }
    }, 500); // 500ms long press
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Cancel long press if user moves finger significantly
    if (longPressTimer.current && touchStartPos.current) {
      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - touchStartPos.current.x);
      const dy = Math.abs(touch.clientY - touchStartPos.current.y);
      if (dx > 10 || dy > 10) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleItemClick = (item: ContextMenuItem) => {
    if (item.disabled) return;
    setIsOpen(false);
    item.onClick();
  };

  return (
    <>
      <div
        ref={containerRef}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ userSelect: 'none' }}
      >
        {children}
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Menu */}
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed',
                left: position.x,
                top: position.y,
                zIndex: 101,
                minWidth: '180px',
                padding: '8px 0',
                background: colors.bgCardLit,
                border: `1px solid ${colors.border}`,
                borderRadius: '16px',
                boxShadow: colors.cardShadowLit,
                overflow: 'hidden',
              }}
            >
              {/* Top edge highlight */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '25%',
                  right: '25%',
                  height: '1px',
                  background: `linear-gradient(90deg, transparent, ${colors.accentLight}4D, transparent)`,
                }}
              />

              {items.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={index}
                    onClick={() => handleItemClick(item)}
                    disabled={item.disabled}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: 500,
                      background: 'transparent',
                      border: 'none',
                      cursor: item.disabled ? 'not-allowed' : 'pointer',
                      opacity: item.disabled ? 0.5 : 1,
                      color: item.danger ? colors.error : colors.textPrimary,
                    }}
                    whileHover={!item.disabled ? {
                      background: item.danger ? `${colors.error}15` : 'rgba(255, 255, 255, 0.05)',
                    } : undefined}
                  >
                    {Icon && <Icon size={18} />}
                    <span>{item.label}</span>
                  </motion.button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
