
import React from 'react';
import { cn } from '@/lib/utils';

interface FlexibleGridProps {
  children: React.ReactNode;
  columns?: {
    sm?: 1 | 2 | 3 | 4 | 6 | 12;
    md?: 1 | 2 | 3 | 4 | 6 | 12;
    lg?: 1 | 2 | 3 | 4 | 6 | 12;
    xl?: 1 | 2 | 3 | 4 | 6 | 12;
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  equalHeight?: boolean;
}

const FlexibleGrid: React.FC<FlexibleGridProps> = ({
  children,
  columns = { sm: 1, md: 2, lg: 3 },
  gap = 'md',
  className,
  equalHeight = false
}) => {
  const columnClasses = [
    columns.sm && `grid-cols-${columns.sm}`,
    columns.md && `md:grid-cols-${columns.md}`,
    columns.lg && `lg:grid-cols-${columns.lg}`,
    columns.xl && `xl:grid-cols-${columns.xl}`
  ].filter(Boolean).join(' ');

  const gapClasses = {
    sm: 'gap-[var(--space-3)]',
    md: 'gap-[var(--space-4)] md:gap-[var(--space-6)]',
    lg: 'gap-[var(--space-6)] md:gap-[var(--space-8)]',
    xl: 'gap-[var(--space-8)] md:gap-[var(--space-10)]'
  };

  return (
    <div className={cn(
      'grid w-full',
      columnClasses,
      gapClasses[gap],
      equalHeight && 'items-stretch',
      className
    )}>
      {children}
    </div>
  );
};

export default FlexibleGrid;
