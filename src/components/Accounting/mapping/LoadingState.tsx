import React from 'react';

interface LoadingStateProps {
  text: string;
}

export function LoadingState({ text }: LoadingStateProps) {
  return (
    <div
      className="py-6 px-3 flex items-center gap-3 text-muted-foreground"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
      <span className="text-sm">{text}</span>
    </div>
  );
}
