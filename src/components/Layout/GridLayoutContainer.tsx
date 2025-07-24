import React from 'react';
import { cn } from '@/lib/utils';
import { useRightSidebar } from './RightSidebarContext';
import { useSidebar } from '@/components/ui/sidebar';

interface GridLayoutContainerProps {
  children: React.ReactNode;
  className?: string;
}

const GridLayoutContainer: React.FC<GridLayoutContainerProps> = ({
  children,
  className
}) => {
  const { isCollapsed: rightCollapsed, isHidden: rightHidden, width: rightWidth } = useRightSidebar();
  const { state: leftSidebarState } = useSidebar();
  
  const leftCollapsed = leftSidebarState === 'collapsed';

  // Dynamic grid template columns based on sidebar states
  const getGridTemplateColumns = () => {
    const leftSidebarWidth = leftCollapsed ? 'var(--grid-left-sidebar-collapsed)' : 'var(--grid-left-sidebar)';
    
    if (rightHidden) {
      return `${leftSidebarWidth} 1fr 0px`;
    }
    
    // For collapsed state, use a very minimal width but still visible
    const rightSidebarWidth = rightCollapsed ? '32px' : `${rightWidth}px`;
    
    return `${leftSidebarWidth} 1fr ${rightSidebarWidth}`;
  };

  return (
    <div 
      className={cn('app-grid', className)}
      style={{ 
        gridTemplateColumns: getGridTemplateColumns()
      }}
    >
      {children}
    </div>
  );
};

export default GridLayoutContainer;