
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
  const { isCollapsed, isHidden, width: rightSidebarWidth } = useRightSidebar();
  
  // Calculate dynamic margin based on right sidebar state
  const rightMargin = React.useMemo(() => {
    if (disableRightSidebarOffset || isHidden || typeof window === 'undefined' || window.innerWidth < 1024) {
      return 0;
    }
    return isCollapsed ? 56 : rightSidebarWidth; // 56px for collapsed state
  }, [disableRightSidebarOffset, isCollapsed, isHidden, rightSidebarWidth]);

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
        'w-full mx-auto',
        maxWidthClasses[maxWidth],
        className
      )}
      style={{ 
        marginRight: `${rightMargin}px`
      }}
    >
      {children}
    </main>
  );
};

export default GlobalLayoutContainer;
