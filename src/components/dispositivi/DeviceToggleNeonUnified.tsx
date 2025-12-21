import { useState, useEffect } from 'react';

// ============================================
// DEVICE TOGGLE NEON UNIFIED - File Unico
// Originale da CodePen jkantner/MWzqMrp
// CSS + React in un unico file
// ============================================

interface DeviceToggleNeonUnifiedProps {
  isOn: boolean;
  disabled?: boolean;
  onChange: (state: boolean) => void;
}

const styles = `
/* NEON TOGGLE SWITCH CSS */
/* Usa le variabili CSS globali del tema definite in index.css */
.neon-toggle-wrapper {
  width: 100%;
  /* Colori dal tema globale */
  --hue: var(--color-primary-hue, 250);
  --off-hue: var(--color-error-hue, 0);
  --on-hue1: var(--color-success-hue, 160);
  --on-hue2: var(--color-secondary-hue, 280);
  --fg: hsl(var(--hue),10%,90%);
  --primary: hsl(var(--hue),90%,50%);
  --trans-dur: 0.6s;
  --trans-timing: cubic-bezier(0.65,0,0.35,1);

  /* Ombre dal tema globale */
  --shadow-light: var(--shadow-color-light, hsl(250, 10%, 30%));
  --shadow-dark: var(--shadow-color-dark, hsl(250, 10%, 5%));
  --shadow-black: var(--shadow-color-black, hsla(0, 0%, 0%, 0.8));

  /* Knob dal tema globale */
  --knob-background: var(--knob-bg, hsl(250, 10%, 15%));
  --knob-background-light: var(--knob-bg-light, hsl(250, 10%, 20%));
  --knob-background-highlight: var(--knob-highlight, hsl(250, 10%, 85%));
}

.switch,
.switch__input {
  -webkit-tap-highlight-color: transparent;
}

.switch {
  display: block;
  position: relative;
  width: 5em;
  height: 3em;
  font-size: inherit;
  margin: auto;
}

.switch__base-outer {
  display: block;
  position: absolute;
  border-radius: 1.5em;
  /* Effetto incassato */
  box-shadow:
    0 0 0.2em 0.00em var(--shadow-light) inset,
    0 0 0.6em 0.03em var(--shadow-dark) inset;
  top: 0;
  left: 0;
  width: 5em;
  height: 3em;
  transition: box-shadow var(--trans-dur) var(--trans-timing);
  z-index: 1;
}

.switch__base-inner {
  display: none;
}

.switch__base-neon {
  display: block;
  overflow: visible;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: auto;
  z-index: 30;
  pointer-events: none;
}

.switch__base-neon path {
  stroke-dasharray: 0 104.26 0;
  transition: stroke-dasharray var(--trans-dur) var(--trans-timing);
}

.switch__input {
  outline: transparent;
  position: relative;
  width: 100%;
  height: 100%;
  -webkit-appearance: none;
  appearance: none;
}

.switch__input:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.switch__input:before {
  border-radius: 0.125em;
  box-shadow: 0 0 0 0.125em hsla(var(--hue),90%,50%,0);
  content: "";
  display: block;
  position: absolute;
  inset: -0.125em;
  transition: box-shadow 0.15s linear;
}

.switch__input:focus-visible:before {
  box-shadow: 0 0 0 0.125em var(--primary);
}

.switch__knob,
.switch__knob-container {
  border-radius: 1.15em;
  display: block;
  position: absolute;
}

.switch__knob {
  background-color: var(--knob-background);
  background-image:
    radial-gradient(88% 88% at 50% 50%, var(--knob-background-light) 47%, transparent 50%),
    radial-gradient(88% 88% at 47% 47%, var(--knob-background-highlight) 45%, transparent 50%),
    radial-gradient(65% 70% at 40% 60%, var(--knob-background-light) 46%, transparent 50%);
  box-shadow:
    /* Ombra interna unica per effetto 3D */
    -0.1em -0.1em 0.15em var(--shadow-dark) inset,
    /* Ombra esterna unica sfumata */
    0.25em 0.15em 0.4em 0.05em var(--shadow-black);
  width: 2.3em;
  height: 2.3em;
  transition: transform var(--trans-dur) var(--trans-timing);
  position: relative;
  z-index: 21;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Icona power dentro la pallina - leggermente incassata */
.switch__knob-icon {
  width: 1em;
  height: 1em;
  color: hsl(var(--off-hue), 70%, 45%);
  opacity: 0.6;
  filter: drop-shadow(0 0.02em 0.03em var(--shadow-dark));
  transition: color var(--trans-dur) var(--trans-timing), opacity var(--trans-dur) var(--trans-timing), filter var(--trans-dur) var(--trans-timing);
}

.switch__input:checked ~ .switch__knob-container .switch__knob-icon {
  color: hsl(var(--on-hue1), 90%, 55%);
  opacity: 1;
  filter: drop-shadow(0 0 0.05em hsl(var(--on-hue1), 90%, 60%));
}

.switch__knob-container {
  overflow: visible;
  top: 0.35em;
  left: 0.35em;
  width: 4.3em;
  height: 2.3em;
  z-index: 20;
}

.switch__knob-neon {
  display: none;
}

.switch__knob-shadow {
  display: none;
}

.switch__led {
  display: none;
}

.switch__text {
  overflow: hidden;
  position: absolute;
  width: 1px;
  height: 1px;
}

.switch__input:checked ~ .switch__base-outer {
  /* Quando ON: ombra interna multicolor */
  box-shadow:
    -0.15em 0 0.9em 0.2em hsla(var(--on-hue1), 100%, 40%, 0.3) inset,
    0.15em 0 0.9em 0.2em hsla(var(--on-hue2), 100%, 40%, 0.3) inset;
}

.switch__input:checked ~ .switch__base-neon path {
  stroke-dasharray: 52.13 0 52.13;
}

.switch__input:checked ~ .switch__knob-container .switch__knob {
  transform: translateX(85%);
}
`;

export const DeviceToggleNeonUnified = ({ isOn, disabled, onChange }: DeviceToggleNeonUnifiedProps) => {
  const [checked, setChecked] = useState(isOn);

  useEffect(() => {
    setChecked(isOn);
  }, [isOn]);

  // Inietta gli stili una sola volta
  useEffect(() => {
    const styleId = 'device-toggle-neon-styles';
    if (!document.getElementById(styleId)) {
      const styleElement = document.createElement('style');
      styleElement.id = styleId;
      styleElement.textContent = styles;
      document.head.appendChild(styleElement);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const newState = e.target.checked;
    setChecked(newState);
    onChange(newState);
  };

  return (
    <div className="neon-toggle-wrapper">
      <label className="switch">
        <input
          className="switch__input"
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
        />
        <span className="switch__base-outer"></span>
        <span className="switch__base-inner"></span>
        <svg className="switch__base-neon" viewBox="0 0 40 24" width="40px" height="24px">
          <defs>
            <filter id="switch-glow">
              <feGaussianBlur result="coloredBlur" stdDeviation="1"></feGaussianBlur>
              <feMerge>
                <feMergeNode in="coloredBlur"></feMergeNode>
                <feMergeNode in="SourceGraphic"></feMergeNode>
              </feMerge>
            </filter>
            <linearGradient id="switch-gradient1" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="hsl(var(--on-hue1),90%,70%)" />
              <stop offset="100%" stopColor="hsl(var(--on-hue2),90%,70%)" />
            </linearGradient>
            <linearGradient id="switch-gradient2" x1="0.7" y1="0" x2="0.3" y2="1">
              <stop offset="25%" stopColor="hsla(var(--on-hue1),90%,70%,0)" />
              <stop offset="50%" stopColor="hsla(var(--on-hue1),90%,70%,0.3)" />
              <stop offset="100%" stopColor="hsla(var(--on-hue2),90%,70%,0.3)" />
            </linearGradient>
          </defs>
          <path
            fill="none"
            filter="url(#switch-glow)"
            stroke="url(#switch-gradient1)"
            strokeWidth="1"
            strokeDasharray="0 104.26 0"
            strokeDashoffset="0.01"
            strokeLinecap="round"
            d="m.5,12C.5,5.649,5.649.5,12,.5h16c6.351,0,11.5,5.149,11.5,11.5s-5.149,11.5-11.5,11.5H12C5.649,23.5.5,18.351.5,12Z"
          />
        </svg>
        <span className="switch__knob-shadow"></span>
        <span className="switch__knob-container">
          <span className="switch__knob">
            {/* Icona Power */}
            <svg className="switch__knob-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
              <line x1="12" y1="2" x2="12" y2="12" />
            </svg>
            <svg className="switch__knob-neon" viewBox="0 0 48 48" width="48px" height="48px" style={{ position: 'absolute', top: 0, left: 0 }}>
              <circle
                fill="none"
                stroke="url(#switch-gradient2)"
                strokeDasharray="0 90.32 0 54.19"
                strokeLinecap="round"
                strokeWidth="1"
                r="23"
                cx="24"
                cy="24"
                transform="rotate(-112.5,24,24)"
              />
            </svg>
          </span>
        </span>
        <span className="switch__led"></span>
        <span className="switch__text">Power</span>
      </label>
    </div>
  );
};

// Export anche con nome originale per compatibilità
export { DeviceToggleNeonUnified as DeviceToggleNeon };
