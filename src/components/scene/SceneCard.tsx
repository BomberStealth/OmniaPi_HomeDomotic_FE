import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Play, Trash2, Loader, Clock } from 'lucide-react';

// ============================================
// SCENE CARD - Singola scena
// ============================================

interface SceneCardProps {
  scena: any;
  executing: boolean;
  onExecute: () => void;
  onDelete?: () => void;
  onSchedule: () => void;
}

export const SceneCard = ({ scena, executing, onExecute, onDelete, onSchedule }: SceneCardProps) => {
  return (
    <Card variant="glass" hover className="p-3">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{scena.icona}</span>
          {scena.scheduling?.enabled && (
            <Clock size={12} className="text-success" />
          )}
        </div>
        {!scena.is_base && onDelete && (
          <Button
            variant="glass"
            size="sm"
            onClick={onDelete}
          >
            <Trash2 size={14} />
          </Button>
        )}
      </div>

      <h3 className="font-bold dark:text-copy light:text-copy-light text-sm mb-3">
        {scena.nome}
      </h3>

      <div className="flex gap-1.5">
        <Button
          variant="primary"
          fullWidth
          size="sm"
          onClick={onExecute}
          disabled={executing}
        >
          {executing ? (
            <>
              <Loader size={12} className="mr-1 animate-spin" />
              <span className="text-[10px]">Esegui</span>
            </>
          ) : (
            <>
              <Play size={12} className="mr-1" />
              <span className="text-[10px]">Esegui</span>
            </>
          )}
        </Button>
        <Button
          variant="glass"
          size="sm"
          onClick={onSchedule}
        >
          <Clock size={12} />
        </Button>
      </div>
    </Card>
  );
};
