import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { LucideIcon } from 'lucide-react';

// ============================================
// EMPTY STATE - Stato vuoto riutilizzabile
// ============================================

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) => {
  return (
    <Card variant="glass-dark">
      <div className="text-center py-12">
        <Icon size={48} className="mx-auto mb-4 dark:text-copy-lighter light:text-copy-lighter" />
        <h3 className="text-xl font-semibold dark:text-copy light:text-copy-light mb-2">
          {title}
        </h3>
        <p className="dark:text-copy-lighter light:text-copy-lighter mb-6">
          {description}
        </p>
        {actionLabel && onAction && (
          <Button variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    </Card>
  );
};
