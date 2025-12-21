import { motion } from 'framer-motion';
import { Power } from 'lucide-react';

// ============================================
// DEVICE TOGGLE - Fill Animation Slider v1.1.0
// Updated: 2025-12-21
// Effetto onda liquido orizzontale con SVG
// ============================================

interface DeviceToggleProps {
  isOn: boolean;
  disabled?: boolean;
  onChange: (state: boolean) => void;
}

export const DeviceToggle = ({ isOn, disabled, onChange }: DeviceToggleProps) => {
  return (
    <div className="relative w-full">
      {/* Main Toggle Container */}
      <motion.button
        type="button"
        onClick={() => !disabled && onChange(!isOn)}
        disabled={disabled}
        className={`relative w-full h-14 rounded-2xl overflow-hidden transition-all duration-300 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-xl'
        }`}
        whileTap={!disabled ? { scale: 0.98 } : {}}
      >
        {/* Background Base (Grigio quando OFF) */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-600 to-gray-700 dark:from-gray-700 dark:to-gray-800" />

        {/* Fill Animation (Verde che riempie da sinistra quando ON - effetto liquido) */}
        <motion.div
          className="absolute inset-y-0 left-0 overflow-visible"
          initial={{ width: '0%' }}
          animate={{
            width: isOn ? '100%' : '0%'
          }}
          transition={{
            type: 'spring',
            stiffness: 100,
            damping: 12,
            mass: 1.5,
            bounce: 0.6
          }}
        >
          {/* Contenitore con overflow-hidden per clippare */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Sfondo verde solido */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500" />

            {/* Onda 1 - superficie del liquido */}
            <motion.div
              className="absolute left-0 right-0 h-[200%] bg-emerald-400/50"
              style={{
                bottom: '40%',
                borderRadius: '45%'
              }}
              animate={{
                rotate: [0, 360]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'linear'
              }}
            />

            {/* Onda 2 - controfase */}
            <motion.div
              className="absolute left-0 right-0 h-[200%] bg-green-400/40"
              style={{
                bottom: '40%',
                borderRadius: '48%'
              }}
              animate={{
                rotate: [0, -360]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: 'linear'
              }}
            />

            {/* Bolle che salgono */}
            <motion.div
              className="absolute w-3 h-3 rounded-full bg-white/30"
              style={{ left: '15%', bottom: '0%' }}
              animate={{
                y: [0, -70],
                opacity: [0, 0.6, 0],
                scale: [0.3, 1, 0.3]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeOut'
              }}
            />

            <motion.div
              className="absolute w-2 h-2 rounded-full bg-white/20"
              style={{ left: '45%', bottom: '0%' }}
              animate={{
                y: [0, -60],
                opacity: [0, 0.5, 0],
                scale: [0.2, 1, 0.2]
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: 'easeOut',
                delay: 1.2
              }}
            />

            <motion.div
              className="absolute w-4 h-4 rounded-full bg-white/25"
              style={{ left: '75%', bottom: '0%' }}
              animate={{
                y: [0, -75],
                opacity: [0, 0.4, 0],
                scale: [0.4, 1.2, 0.4]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeOut',
                delay: 2.3
              }}
            />

            {/* Riflesso luminoso sul liquido */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent" />
          </div>
        </motion.div>

        {/* Content Container */}
        <div className="relative h-full flex items-center justify-between px-6">
          {/* OFF Side */}
          <motion.div
            className="flex items-center gap-2 z-10"
            animate={{
              opacity: isOn ? 0.5 : 1,
              x: isOn ? -5 : 0
            }}
            transition={{ duration: 0.3 }}
          >
            <Power size={20} className="text-white" />
            <span className="text-white font-bold">OFF</span>
          </motion.div>

          {/* ON Side */}
          <motion.div
            className="flex items-center gap-2 z-10"
            animate={{
              opacity: isOn ? 1 : 0.5,
              x: isOn ? 5 : 0
            }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-white font-bold">ON</span>
            <Power size={20} className="text-white" />
          </motion.div>
        </div>

        {/* Shimmer Effect quando ON */}
        {isOn && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
            animate={{
              x: ['-100%', '200%']
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        )}
      </motion.button>

      {/* Status Badge */}
      <motion.div
        className="mt-2 text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-semibold ${
            isOn
              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          }`}>
          {isOn ? '⚡ Acceso' : '⭕ Spento'}
        </span>
      </motion.div>
    </div>
  );
};
