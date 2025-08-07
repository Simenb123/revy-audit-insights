import React from 'react';
import { cn } from '@/lib/utils';
import { useRightSidebar } from './RightSidebarContext';
import { useSidebar } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

interface GridLayoutContainerProps {
  children: React.ReactNode;
  className?: string;
}

const GridLayoutContainer: React.FC<GridLayoutContainerProps> = ({
  children,
  className
}) => {
  const { isCollapsed: rightCollapsed, width: rightWidth } = useRightSidebar();
  const { state: leftSidebarState } = useSidebar();
  const isMobile = useIsMobile();
  
  const leftCollapsed = leftSidebarState === 'collapsed';

  // Dynamic grid template columns based on sidebar states
  const getGridTemplateColumns = () => {
    // On mobile, use single column layout
    if (isMobile) {
      return '1fr';
    }
    
    const leftSidebarWidth = leftCollapsed ? 'var(--grid-left-sidebar-collapsed)' : 'var(--grid-left-sidebar)';

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
        isMobile && 'block',
        className
      )}
      style={{
        gridTemplateColumns: getGridTemplateColumns(),
        // Ensure mobile grid works correctly
        display: isMobile ? 'block' : 'grid',
        height: 'auto'
      }}
    >
      {children}
    </div>
  );
};

export default GridLayoutContainer;
