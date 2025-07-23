
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
  const maxWidthClasses = {
    narrow: 'max-w-[var(--content-narrow)]',
    medium: 'max-w-[var(--content-medium)]',
    wide: 'max-w-[var(--content-wide)]',
    full: 'max-w-full'
  };

  return (
    <main 
      className={cn(
        'flex-1 overflow-auto',
        'min-h-0',
        'w-full',
        !disableRightSidebarOffset && maxWidthClasses[maxWidth],
        disableRightSidebarOffset && 'max-w-full',
        className
      )}
    >
      {children}
    </main>
  );
};

export default GlobalLayoutContainer;
