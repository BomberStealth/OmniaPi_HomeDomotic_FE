import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// TOGGLE 5 - Merging Letters
// Ispirato a Jon Kantner - CodePen gOZrOQm
// ============================================

interface Toggle5Props {
  isOn: boolean;
  disabled?: boolean;
  onChange: (state: boolean) => void;
}

export const Toggle5Letters = ({ isOn, disabled, onChange }: Toggle5Props) => {
  return (
    <div className="relative w-full">
      <motion.button
        type="button"
        onClick={() => !disabled && onChange(!isOn)}
        disabled={disabled}
        className={`relative w-full h-24 rounded-3xl overflow-hidden transition-all duration-500 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
        style={{
          background: isOn
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
        }}
        whileTap={!disabled ? { scale: 0.98 } : {}}
      >
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        />

        {/* Letter animation container */}
        <div className="relative h-full flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            {isOn ? (
              <motion.div
                key="on"
                className="flex items-center gap-1"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.4 }}
              >
                {/* O letter */}
                <motion.div
                  className="relative"
                  animate={{
                    rotate: [0, 5, -5, 0],
                    y: [0, -3, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                >
                  <span className="text-6xl font-black text-white drop-shadow-[0_4px_20px_rgba(255,255,255,0.5)]">
                    O
                  </span>
                </motion.div>

                {/* N letter */}
                <motion.div
                  className="relative"
                  animate={{
                    rotate: [0, -5, 5, 0],
                    y: [0, -3, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 0.2
                  }}
                >
                  <span className="text-6xl font-black text-white drop-shadow-[0_4px_20px_rgba(255,255,255,0.5)]">
                    N
                  </span>
                </motion.div>

                {/* Sparkle effects */}
                <motion.div
                  className="absolute top-2 right-4 text-2xl"
                  animate={{
                    scale: [0, 1.5, 0],
                    rotate: [0, 180, 360],
                    opacity: [0, 1, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                >
                  ✨
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="off"
                className="flex items-center gap-1"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.4 }}
              >
                {/* O letter */}
                <motion.div
                  className="relative"
                  animate={{
                    rotate: [0, -5, 5, 0],
                    y: [0, 3, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                >
                  <span className="text-6xl font-black text-white drop-shadow-[0_4px_20px_rgba(255,255,255,0.5)]">
                    O
                  </span>
                </motion.div>

                {/* F letter */}
                <motion.div
                  className="relative"
                  animate={{
                    rotate: [0, 5, -5, 0],
                    y: [0, 3, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 0.15
                  }}
                >
                  <span className="text-6xl font-black text-white drop-shadow-[0_4px_20px_rgba(255,255,255,0.5)]">
                    F
                  </span>
                </motion.div>

                {/* F letter */}
                <motion.div
                  className="relative"
                  animate={{
                    rotate: [0, -5, 5, 0],
                    y: [0, 3, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 0.3
                  }}
                >
                  <span className="text-6xl font-black text-white drop-shadow-[0_4px_20px_rgba(255,255,255,0.5)]">
                    F
                  </span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Merging transition effect */}
        <AnimatePresence>
          {isOn && (
            <motion.div
              className="absolute inset-0 bg-white"
              initial={{ clipPath: 'circle(0% at 50% 50%)' }}
              animate={{ clipPath: 'circle(150% at 50% 50%)' }}
              exit={{ clipPath: 'circle(0% at 50% 50%)' }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              style={{ mixBlendMode: 'overlay', opacity: 0.3 }}
            />
          )}
        </AnimatePresence>

        {/* Pulse effect */}
        <motion.div
          className="absolute inset-0"
          animate={{
            boxShadow: isOn
              ? [
                  'inset 0 0 20px rgba(255,255,255,0.1)',
                  'inset 0 0 40px rgba(255,255,255,0.2)',
                  'inset 0 0 20px rgba(255,255,255,0.1)'
                ]
              : [
                  'inset 0 0 20px rgba(0,0,0,0.1)',
                  'inset 0 0 40px rgba(0,0,0,0.2)',
                  'inset 0 0 20px rgba(0,0,0,0.1)'
                ]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </motion.button>

      {/* Status Badge */}
      <motion.div
        className="mt-2 text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-semibold ${
            isOn
              ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
              : 'bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300'
          }`}>
          {isOn ? '⚡ ON' : '⭕ OFF'}
        </span>
      </motion.div>
    </div>
  );
};
