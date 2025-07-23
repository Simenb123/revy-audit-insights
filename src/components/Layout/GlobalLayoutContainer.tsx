
import React from 'react';
import { cn } from '@/lib/utils';
import { useRightSidebar } from './RightSidebarContext';

interface GlobalLayoutContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'narrow' | 'medium' | 'wide' | 'full';
  disableRightSidebarOffset?: boolean;
}

const GlobalLayoutContainer: React.FC<GlobalLayoutContainerProps> = ({
  children,
  className,
  maxWidth = 'wide',
  disableRightSidebarOffset = false
}) => {
  // Right sidebar is now part of flex layout, no margin needed

  const maxWidthClasses = {
    narrow: 'max-w-[var(--content-narrow)]',
    medium: 'max-w-[var(--content-medium)]',
    wide: 'max-w-[var(--content-wide)]',
    full: 'max-w-full'
  };

  return (
    <main 
      className={cn(
        'flex-1 overflow-auto transition-all duration-300 ease-in-out',
        'min-h-[calc(100vh-var(--header-height))]',
        'w-full',
        maxWidthClasses[maxWidth],
        className
      )}
    >
      {children}
    </main>
  );
};

export default GlobalLayoutContainer;
