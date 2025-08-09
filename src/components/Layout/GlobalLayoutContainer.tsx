
import React from 'react';
import { cn } from '@/lib/utils';
import { useLayout } from '@/components/Layout/LayoutContext';
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
  const { globalHeaderHeight, subHeaderHeight } = useLayout();
  const computedHeight = `calc(100vh - ${globalHeaderHeight + subHeaderHeight}px)`;
  const maxWidthClasses = {
    narrow: 'max-w-[var(--content-narrow)]',
    medium: 'max-w-[var(--content-medium)]',
    wide: 'max-w-[var(--content-wide)]',
    full: 'max-w-full'
  };

  return (
    <main 
      className={cn(
        'min-h-0',
        'w-full mx-auto px-4 lg:pr-6 min-w-0 overflow-x-hidden overflow-y-auto',
        maxWidthClasses[maxWidth],
        'border-t-2 border-t-border/50',
        className
      )}
      style={{ height: computedHeight }}
    >
      {children}
    </main>
  );
};

export default GlobalLayoutContainer;
