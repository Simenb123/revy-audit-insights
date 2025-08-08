
import React from 'react';
import { cn } from '@/lib/utils';

interface GlobalLayoutContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'narrow' | 'medium' | 'wide' | 'full';
}

const GlobalLayoutContainer: React.FC<GlobalLayoutContainerProps> = ({
  children,
  className,
  maxWidth = 'wide'
}) => {
  const maxWidthClasses = {
    narrow: 'max-w-[var(--content-narrow)]',
    medium: 'max-w-[var(--content-medium)]',
    wide: 'max-w-[var(--content-wide)]',
    full: 'max-w-full'
  };

  return (
    <main 
      className={cn(
        'h-[calc(100vh-var(--global-header-height))]',
        'w-full mx-auto px-4 lg:pr-6 min-w-0 overflow-x-hidden',
        maxWidthClasses[maxWidth],
        // Add top border line for visual consistency
        'border-t-2 border-t-border/50',
        className
      )}
    >
      {children}
    </main>
  );
};

export default GlobalLayoutContainer;
