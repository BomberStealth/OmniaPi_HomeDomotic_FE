import { StanzaCard } from './StanzaCard';

// ============================================
// STANZA LIST - Griglia stanze
// ============================================

interface StanzaListProps {
  stanze: any[];
  onDelete: (id: number) => void;
}

export const StanzaList = ({ stanze, onDelete }: StanzaListProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {stanze.filter(s => s !== null && s !== undefined).map((stanza) => (
        <StanzaCard
          key={stanza.id}
          stanza={stanza}
          onDelete={() => onDelete(stanza.id)}
        />
      ))}
    </div>
  );
};
