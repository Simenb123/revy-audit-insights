
import React from 'react';
import { cn } from '@/lib/utils';

interface ConstrainedWidthProps {
  children: React.ReactNode;
  width?: 'narrow' | 'medium' | 'wide' | 'full';
  className?: string;
  center?: boolean;
}

const ConstrainedWidth: React.FC<ConstrainedWidthProps> = ({
  children,
  width = 'wide',
  className,
  center = true
}) => {
  const widthClasses = {
    narrow: 'max-w-[var(--content-narrow)]',
    medium: 'max-w-[var(--content-medium)]',
    wide: 'max-w-[var(--content-wide)]',
    full: 'max-w-full'
  };

  return (
    <div className={cn(
      'w-full',
      widthClasses[width],
      center && 'mx-auto',
      className
    )}>
      {children}
    </div>
  );
};

export default ConstrainedWidth;
