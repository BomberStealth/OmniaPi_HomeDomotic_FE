import { InputHTMLAttributes, forwardRef, useMemo } from 'react';
import { useThemeColor } from '@/contexts/ThemeColorContext';

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
    const { colors: themeColors } = useThemeColor();

    const colors = useMemo(() => {
      const accentRgb = hexToRgb(themeColors.accent);
      return {
        accent: themeColors.accent,
        border: `rgba(${accentRgb}, 0.15)`,
        focusRing: `rgba(${accentRgb}, 0.15)`,
      };
    }, [themeColors]);

    const inputStyles: React.CSSProperties = {
      width: '100%',
      padding: '14px 18px',
      background: '#1a1816', // bgCardSolid
      border: `1px solid ${error ? '#ef4444' : colors.border}`,
      borderRadius: '16px', // radius.md
      color: '#ffffff',
      fontSize: '14px',
      fontFamily: 'inherit',
      transition: 'all 0.2s ease',
      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
      outline: 'none',
      ...style,
    };

    const labelStyles: React.CSSProperties = {
      display: 'block',
      marginBottom: '8px',
      fontSize: '11px',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      color: 'rgba(255, 255, 255, 0.5)', // textMuted
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
            e.target.style.borderColor = error ? '#ef4444' : colors.accent;
            e.target.style.boxShadow = `inset 0 2px 4px rgba(0, 0, 0, 0.2), 0 0 0 3px ${error ? 'rgba(239, 68, 68, 0.15)' : colors.focusRing}`;
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? '#ef4444' : colors.border;
            e.target.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.2)';
            props.onBlur?.(e);
          }}
          {...props}
        />
        {error && (
          <p style={{
            marginTop: '8px',
            fontSize: '12px',
            color: '#ef4444',
          }}>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
