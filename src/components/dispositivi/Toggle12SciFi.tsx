import { motion } from 'framer-motion';
import { RiLockLine, RiLockUnlockLine } from 'react-icons/ri';

// ============================================
// TOGGLE 12 - Sci-Fi Door Lock
// Ispirato a Chris Gannon - CodePen bLeMEB
// ============================================

interface Toggle12Props {
  isOn: boolean;
  disabled?: boolean;
  onChange: (state: boolean) => void;
}

export const Toggle12SciFi = ({ isOn, disabled, onChange }: Toggle12Props) => {
  return (
    <div className="relative w-full">
      <motion.button
        type="button"
        onClick={() => !disabled && onChange(!isOn)}
        disabled={disabled}
        className={`relative w-full h-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl overflow-hidden border-2 ${
          isOn ? 'border-cyan-400' : 'border-red-500'
        } transition-all duration-300 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
        whileTap={!disabled ? { scale: 0.98 } : {}}
      >
        {/* Scanline effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent"
          animate={{ y: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />

        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, white 2px, white 3px), repeating-linear-gradient(90deg, transparent, transparent 2px, white 2px, white 3px)',
            backgroundSize: '20px 20px'
          }}
        />

        {/* Lock mechanism */}
        <div className="relative h-full flex items-center justify-center gap-8 px-6">
          {/* Left bolt */}
          <motion.div
            className={`h-2 rounded-full ${isOn ? 'bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)]' : 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)]'}`}
            animate={{
              width: isOn ? '80px' : '20px',
              x: isOn ? -30 : 0
            }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          />

          {/* Center lock icon */}
          <motion.div
            className={`relative ${isOn ? 'text-cyan-400' : 'text-red-500'}`}
            animate={{ rotate: isOn ? 0 : 90 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            {isOn ? (
              <RiLockUnlockLine size={32} strokeWidth={2.5} />
            ) : (
              <RiLockLine size={32} strokeWidth={2.5} />
            )}

            {/* Glow effect */}
            <motion.div
              className={`absolute inset-0 rounded-full blur-xl ${
                isOn ? 'bg-cyan-400' : 'bg-red-500'
              }`}
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
          </motion.div>

          {/* Right bolt */}
          <motion.div
            className={`h-2 rounded-full ${isOn ? 'bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)]' : 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)]'}`}
            animate={{
              width: isOn ? '80px' : '20px',
              x: isOn ? 30 : 0
            }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          />
        </div>

        {/* Status text */}
        <div className="absolute bottom-2 left-0 right-0 text-center">
          <motion.span
            className={`text-xs font-mono font-bold ${
              isOn ? 'text-cyan-400' : 'text-red-500'
            }`}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {isOn ? '[ UNLOCKED ]' : '[ LOCKED ]'}
          </motion.span>
        </div>
      </motion.button>

      {/* Status Badge */}
      <motion.div
        className="mt-2 text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-semibold ${
            isOn
              ? 'bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300'
              : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
          }`}>
          {isOn ? '🔓 Sbloccato' : '🔒 Bloccato'}
        </span>
      </motion.div>
    </div>
  );
};
