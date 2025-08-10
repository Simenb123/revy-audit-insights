import React from 'react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  text: string;
  query?: string;
  onClearSearch?: () => void;
  clearLabel?: string;
}

export function EmptyState({ text, query, onClearSearch, clearLabel }: EmptyStateProps) {
  return (
    <div className="py-6 px-3 text-center text-sm text-muted-foreground space-y-2">
      <div>
        {text}
        {query ? `: "${query}"` : ''}
      </div>
      {onClearSearch && (
        <Button
          variant="ghost"
          size="sm"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onClearSearch}
        >
          {clearLabel ?? 'Tøm søk'}
        </Button>
      )}
    </div>
  );
}
