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
    
    // Use 32px for collapsed sidebar or actual width for expanded
    const rightSidebarWidth = rightCollapsed ? '32px' : `${rightWidth}px`;
    
    return `${leftSidebarWidth} 1fr ${rightSidebarWidth}`;
  };

  return (
    <div
      className={cn(
        'w-full app-grid transition-[grid-template-columns] duration-300 ease-in-out',
        // Ensure mobile shows main content properly
        'min-h-0',
        className
      )}
      style={{
        gridTemplateColumns: getGridTemplateColumns(),
        // Ensure mobile grid works correctly
        display: 'grid',
        height: 'auto'
      }}
    >
      {children}
    </div>
  );
};

export default GridLayoutContainer;
