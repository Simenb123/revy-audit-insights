
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
  // Height is controlled by parent containers; no layout context needed here.
  const maxWidthClasses = {
    narrow: 'max-w-[var(--content-narrow)]',
    medium: 'max-w-[var(--content-medium)]',
    wide: 'max-w-[var(--content-wide)]',
    full: 'max-w-full'
  };

  return (
    <main 
      className={cn(
        'min-h-0 flex-1',
        'w-full mx-auto px-4 lg:pr-6 min-w-0 overflow-x-hidden overflow-y-auto',
        'pb-8', // Add bottom padding for scroll buffer
        maxWidthClasses[maxWidth],
        className
      )}
      style={{ 
        height: '100%',
        scrollBehavior: 'smooth' // Improve scroll behavior
      }}
    >
      {children}
    </main>
  );
};

export default GlobalLayoutContainer;
