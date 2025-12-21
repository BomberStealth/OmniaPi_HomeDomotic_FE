import { motion } from 'framer-motion';

// ============================================
// TOGGLE 7 - Neon Switch
// Ispirato a Jon Kantner - CodePen MWzqMrp
// ============================================

interface Toggle7Props {
  isOn: boolean;
  disabled?: boolean;
  onChange: (state: boolean) => void;
}

export const Toggle7Neon = ({ isOn, disabled, onChange }: Toggle7Props) => {
  return (
    <div className="relative w-full">
      <motion.button
        type="button"
        onClick={() => !disabled && onChange(!isOn)}
        disabled={disabled}
        className={`relative w-full h-16 rounded-full overflow-hidden transition-all duration-300 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
        style={{
          background: isOn
            ? 'linear-gradient(90deg, #1a1a2e 0%, #16213e 100%)'
            : 'linear-gradient(90deg, #1a1a2e 0%, #16213e 100%)'
        }}
        whileTap={!disabled ? { scale: 0.98 } : {}}
      >
        {/* Neon tube background */}
        <div className="absolute inset-2 rounded-full border-2 border-gray-700/50" />

        {/* Neon glow track */}
        <motion.div
          className="absolute inset-2 rounded-full"
          animate={{
            boxShadow: isOn
              ? [
                  '0 0 10px rgba(16, 185, 129, 0.3), inset 0 0 10px rgba(16, 185, 129, 0.2)',
                  '0 0 20px rgba(16, 185, 129, 0.5), inset 0 0 15px rgba(16, 185, 129, 0.3)',
                  '0 0 10px rgba(16, 185, 129, 0.3), inset 0 0 10px rgba(16, 185, 129, 0.2)'
                ]
              : [
                  '0 0 5px rgba(107, 114, 128, 0.2), inset 0 0 5px rgba(107, 114, 128, 0.1)',
                  '0 0 8px rgba(107, 114, 128, 0.3), inset 0 0 8px rgba(107, 114, 128, 0.15)',
                  '0 0 5px rgba(107, 114, 128, 0.2), inset 0 0 5px rgba(107, 114, 128, 0.1)'
                ]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Neon ball slider */}
        <motion.div
          className="absolute top-2 bottom-2 w-12 rounded-full"
          animate={{
            left: isOn ? 'calc(100% - 56px)' : '8px'
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          {/* Inner neon circle */}
          <div
            className={`absolute inset-0 rounded-full ${
              isOn ? 'bg-emerald-500' : 'bg-gray-500'
            }`}
          />

          {/* Multiple neon glow layers */}
          <motion.div
            className="absolute inset-0 rounded-full blur-sm"
            style={{
              background: isOn
                ? 'radial-gradient(circle, rgba(16,185,129,0.8) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(107,114,128,0.6) 0%, transparent 70%)'
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.8, 1, 0.8]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />

          <motion.div
            className="absolute inset-0 rounded-full blur-md"
            style={{
              background: isOn
                ? 'radial-gradient(circle, rgba(16,185,129,0.6) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(107,114,128,0.4) 0%, transparent 70%)'
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.6, 0.9, 0.6]
            }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
          />

          <motion.div
            className="absolute inset-0 rounded-full blur-lg"
            style={{
              background: isOn
                ? 'radial-gradient(circle, rgba(16,185,129,0.4) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(107,114,128,0.2) 0%, transparent 70%)'
            }}
            animate={{
              scale: [1, 1.8, 1],
              opacity: [0.4, 0.7, 0.4]
            }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.6 }}
          />

          {/* Inner light reflection */}
          <div
            className={`absolute top-1 left-1 w-3 h-3 rounded-full ${
              isOn ? 'bg-emerald-200' : 'bg-gray-300'
            } opacity-80`}
          />
        </motion.div>

        {/* Neon letters ON/OFF */}
        <div className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none">
          <motion.span
            className={`text-sm font-bold tracking-wider ${
              isOn ? 'text-gray-600' : 'text-gray-400'
            }`}
            animate={{
              textShadow: !isOn
                ? [
                    '0 0 5px rgba(107,114,128,0.5)',
                    '0 0 10px rgba(107,114,128,0.8)',
                    '0 0 5px rgba(107,114,128,0.5)'
                  ]
                : '0 0 0px transparent'
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            OFF
          </motion.span>

          <motion.span
            className={`text-sm font-bold tracking-wider ${
              isOn ? 'text-emerald-400' : 'text-gray-600'
            }`}
            animate={{
              textShadow: isOn
                ? [
                    '0 0 5px rgba(16,185,129,0.8), 0 0 10px rgba(16,185,129,0.6)',
                    '0 0 10px rgba(16,185,129,1), 0 0 20px rgba(16,185,129,0.8)',
                    '0 0 5px rgba(16,185,129,0.8), 0 0 10px rgba(16,185,129,0.6)'
                  ]
                : '0 0 0px transparent'
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ON
          </motion.span>
        </div>

        {/* Flicker effect when ON */}
        {isOn && (
          <motion.div
            className="absolute inset-0 bg-emerald-500/5 rounded-full"
            animate={{ opacity: [0, 0.1, 0] }}
            transition={{
              duration: 0.15,
              repeat: Infinity,
              repeatDelay: 3
            }}
          />
        )}
      </motion.button>

      {/* Status Badge */}
      <motion.div
        className="mt-2 text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-semibold ${
            isOn
              ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          }`}>
          {isOn ? '💡 Neon ON' : '⚫ Neon OFF'}
        </span>
      </motion.div>
    </div>
  );
};
