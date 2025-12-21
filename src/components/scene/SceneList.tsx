import { SceneCard } from './SceneCard';

// ============================================
// SCENE LIST - Layout verticale compatto
// Mobile-first design
// ============================================

interface SceneListProps {
  scene: any[];
  executingId: number | null;
  onExecute: (scenaId: number) => void;
  onDelete: (scenaId: number) => void;
  onSchedule: (scena: any) => void;
}

export const SceneList = ({ scene, executingId, onExecute, onDelete, onSchedule }: SceneListProps) => {
  return (
    <div className="flex flex-col gap-2">
      {scene.filter(s => s !== null && s !== undefined).map((scena) => (
        <SceneCard
          key={scena.id}
          scena={scena}
          executing={executingId === scena.id}
          onExecute={() => onExecute(scena.id)}
          onDelete={!scena.is_base ? () => onDelete(scena.id) : undefined}
          onSchedule={() => onSchedule(scena)}
        />
      ))}
    </div>
  );
};
