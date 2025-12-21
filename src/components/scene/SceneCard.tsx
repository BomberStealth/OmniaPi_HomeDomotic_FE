import { Card } from '@/components/common/Card';
import { Trash2, Loader, Clock } from 'lucide-react';

// ============================================
// SCENE CARD - Redesign Mobile-First
// Tap sulla card = esegui scena
// Icone piccole per delete e schedule
// ============================================

interface SceneCardProps {
  scena: any;
  executing: boolean;
  onExecute: () => void;
  onDelete?: () => void;
  onSchedule: () => void;
}

export const SceneCard = ({ scena, executing, onExecute, onDelete, onSchedule }: SceneCardProps) => {
  const deviceCount = scena.azioni?.length || 0;

  return (
    <Card
      variant="glass"
      hover
      className={`p-3 cursor-pointer overflow-hidden transition-all duration-300 ${
        executing ? 'ring-2 ring-primary animate-pulse' : ''
      }`}
      onClick={(e) => {
        // Evita esecuzione se si clicca sui pulsanti
        if ((e.target as HTMLElement).closest('button')) return;
        onExecute();
      }}
    >
      <div className="flex items-center justify-between">
        {/* Left: Icon + Info */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Icon con feedback esecuzione */}
          <div className={`text-2xl flex-shrink-0 transition-transform duration-300 ${
            executing ? 'scale-110' : ''
          }`}>
            {executing ? (
              <Loader className="w-6 h-6 animate-spin text-primary" />
            ) : (
              scena.icona
            )}
          </div>

          {/* Nome e info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold dark:text-copy light:text-copy-light text-sm truncate">
                {scena.nome}
              </h3>
              {scena.is_base && (
                <span className="px-1.5 py-0.5 text-[8px] font-medium bg-primary/20 text-primary rounded flex-shrink-0">
                  BASE
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] dark:text-copy-lighter light:text-copy-lighter">
                {deviceCount} dispositiv{deviceCount === 1 ? 'o' : 'i'}
              </span>
              {scena.scheduling?.enabled && (
                <span className="flex items-center gap-0.5 text-[10px] text-success">
                  <Clock size={10} />
                  <span>Programmata</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Action icons */}
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          {/* Schedule button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSchedule();
            }}
            className="p-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-black/5 transition-colors"
            title="Programmazione"
          >
            <Clock size={14} className={`${
              scena.scheduling?.enabled ? 'text-success' : 'dark:text-copy-lighter light:text-copy-lighter'
            }`} />
          </button>

          {/* Delete button - only for non-base scenes */}
          {!scena.is_base && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 rounded-lg hover:bg-error/20 transition-colors"
              title="Elimina"
            >
              <Trash2 size={14} className="text-error/70 hover:text-error" />
            </button>
          )}
        </div>
      </div>
    </Card>
  );
};
