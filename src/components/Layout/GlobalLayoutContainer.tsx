
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
        'overflow-auto',
        'min-h-[calc(100vh-var(--header-height))]',
        'w-full mx-auto px-4',
        maxWidthClasses[maxWidth],
        className
      )}
    >
      {children}
    </main>
  );
};

export default GlobalLayoutContainer;
