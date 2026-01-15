import { InputHTMLAttributes, forwardRef, useMemo } from 'react';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import { spacing, fontSize, radius } from '@/styles/responsive';

// ============================================
// INPUT COMPONENT - Dark Luxury Style
// Con supporto tema dinamico
// ============================================

// Helper per convertire hex a rgb
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '106, 212, 160';
};

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', style, ...props }, ref) => {
    const { colors: themeColors, modeColors } = useThemeColor();

    const colors = useMemo(() => {
      const accentRgb = hexToRgb(themeColors.accent);
      return {
        ...modeColors,
        accent: themeColors.accent,
        inputBorder: `rgba(${accentRgb}, 0.15)`,
        focusRing: `rgba(${accentRgb}, 0.15)`,
      };
    }, [themeColors, modeColors]);

    const inputStyles: React.CSSProperties = {
      width: '100%',
      height: 'clamp(38px, 9vw, 44px)',  // Altezza RIDOTTA
      padding: '0 clamp(10px, 2.5vw, 14px)',  // Padding ridotto
      background: colors.bgCard,
      border: `1px solid ${error ? colors.error : colors.inputBorder}`,
      borderRadius: radius.sm,  // Radius più piccolo
      color: colors.textPrimary,
      fontSize: 'clamp(13px, 3.2vw, 15px)',  // Font ridotto
      fontFamily: 'inherit',
      transition: 'all 0.2s ease',
      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
      outline: 'none',
      ...style,
    };

    const labelStyles: React.CSSProperties = {
      display: 'block',
      marginBottom: spacing.xs,
      fontSize: fontSize.xs,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      color: colors.textMuted,
    };

    return (
      <div style={{ width: '100%' }}>
        {label && (
          <label style={labelStyles}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          style={inputStyles}
          className={className}
          onFocus={(e) => {
            e.target.style.borderColor = error ? colors.error : colors.accent;
            e.target.style.boxShadow = `inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 0 0 3px ${error ? 'rgba(239, 68, 68, 0.15)' : colors.focusRing}`;
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? colors.error : colors.inputBorder;
            e.target.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.1)';
            props.onBlur?.(e);
          }}
          {...props}
        />
        {error && (
          <p style={{
            marginTop: '8px',
            fontSize: '12px',
            color: colors.error,
          }}>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
