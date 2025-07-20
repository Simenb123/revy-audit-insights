
import React from 'react';
import { cn } from '@/lib/utils';
import { useRightSidebar } from './RightSidebarContext';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  className
}) => {
  const { isCollapsed, isHidden, width: rightSidebarWidth } = useRightSidebar();
  
  // Calculate dynamic margin based on right sidebar state
  const rightMargin = (!isCollapsed && !isHidden) ? rightSidebarWidth : 0;

  return (
    <main 
      className={cn(
        'flex-1 overflow-auto transition-all duration-300 ease-in-out',
        'min-h-[calc(100vh-var(--header-height))]',
        className
      )}
      style={{ 
        marginRight: window.innerWidth >= 768 ? `${rightMargin}px` : '0px'
      }}
    >
      {children}
    </main>
  );
};

export default ResponsiveLayout;
