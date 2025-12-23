import { SceneCard } from './SceneCard';

// ============================================
// SCENE LIST - Dark Luxury Style
// ============================================

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {scene.filter(s => s !== null && s !== undefined).map((scena) => (
        <SceneCard
          key={scena.id}
          scena={scena}
          executing={executingId === scena.id}
          onExecute={() => onExecute(scena.id)}
          onDelete={!scena.is_base ? () => onDelete(scena.id) : undefined}
          onSchedule={() => onSchedule(scena)}
          onToggleShortcut={(isShortcut) => onToggleShortcut(scena.id, isShortcut)}
          onEdit={() => onEdit(scena)}
        />
      ))}
    </div>
  );
};
