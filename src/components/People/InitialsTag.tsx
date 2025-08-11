
import React from 'react';
import { cn } from '@/lib/utils';

interface InitialsTagProps {
  initials?: string | null;
  fullName?: string | null;
  color?: string | null; // hex or css color string
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

function computeInitialsFromName(name?: string | null) {
  if (!name) return '';
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '';
  const letters = parts.map(p => p[0]?.toUpperCase() ?? '');
  // Up to 3 letters (e.g. Leif Ove Tautra -> LOT)
  return letters.slice(0, 3).join('');
}

const sizeClasses = {
  sm: 'text-[10px] px-1.5 py-0.5 rounded',
  md: 'text-xs px-2 py-1 rounded-md',
  lg: 'text-sm px-2.5 py-1.5 rounded-md',
};

const InitialsTag: React.FC<InitialsTagProps> = ({ initials, fullName, color, className, size = 'md' }) => {
  const derived = initials && initials.trim().length > 0 ? initials : computeInitialsFromName(fullName);
  const style: React.CSSProperties = color ? { backgroundColor: color, color: 'white' } : {};
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-medium',
        'bg-muted text-muted-foreground border border-border',
        sizeClasses[size],
        className
      )}
      style={style}
      title={fullName || undefined}
    >
      {derived || '–'}
    </span>
  );
};

export default InitialsTag;
