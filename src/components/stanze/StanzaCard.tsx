import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { RiDeleteBinLine } from 'react-icons/ri';
import { getRoomIcon } from '@/config/roomIcons';
import { useThemeColor } from '@/contexts/ThemeColorContext';

// ============================================
// STANZA CARD - Singola stanza
// ============================================

interface StanzaCardProps {
  stanza: any;
  onDelete: () => void;
}

export const StanzaCard = ({ stanza, onDelete }: StanzaCardProps) => {
  const { colors } = useThemeColor();
  const Icon = getRoomIcon(stanza.icona);

  return (
    <Card variant="glass" hover className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Icon size={28} style={{ color: colors.accent }} />
          <div>
            <h3 className="font-bold dark:text-copy light:text-copy-light">
              {stanza.nome}
            </h3>
            <p className="text-sm dark:text-copy-lighter light:text-copy-lighter">
              {stanza.dispositivi_count || 0} dispositivi
            </p>
          </div>
        </div>
        <Button
          variant="glass"
          size="sm"
          onClick={onDelete}
        >
          <RiDeleteBinLine size={16} />
        </Button>
      </div>
    </Card>
  );
};
