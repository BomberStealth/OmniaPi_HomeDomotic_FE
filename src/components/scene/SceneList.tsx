import { motion } from 'framer-motion';
import { SceneCard } from './SceneCard';

// ============================================
// SCENE LIST - Dark Luxury Style
// ============================================

// Variants per animazioni card (uniformi come Dashboard)
const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } }
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } }
};

interface SceneListProps {
  scene: any[];
  executingId: number | null;
  onExecute: (scenaId: number) => void;
  onDelete: (scenaId: number) => void;
  onSchedule: (scena: any) => void;
  onToggleShortcut: (scenaId: number, isShortcut: boolean) => void;
  onEdit: (scena: any) => void;
}

export const SceneList = ({ scene, executingId, onExecute, onDelete, onSchedule, onToggleShortcut, onEdit }: SceneListProps) => {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={containerVariants}
      style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
    >
      {scene.filter(s => s !== null && s !== undefined).map((scena) => (
        <motion.div key={scena.id} variants={cardVariants} whileTap={{ scale: 0.98 }}>
          <SceneCard
            scena={scena}
            executing={executingId === scena.id}
            onExecute={() => onExecute(scena.id)}
            onDelete={!scena.is_base ? () => onDelete(scena.id) : undefined}
            onSchedule={() => onSchedule(scena)}
            onToggleShortcut={(isShortcut) => onToggleShortcut(scena.id, isShortcut)}
            onEdit={() => onEdit(scena)}
          />
        </motion.div>
      ))}
    </motion.div>
  );
};
