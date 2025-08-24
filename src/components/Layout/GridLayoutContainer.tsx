import React from 'react';
import { cn } from '@/lib/utils';
import { useRightSidebar } from './RightSidebarContext';
import { useSidebar } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLayout } from '@/components/Layout/LayoutContext';
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
  const { globalHeaderHeight, subHeaderHeight } = useLayout();
  
  // Use CSS variables as primary source with JS values as enhancement
  const totalHeaderHeight = globalHeaderHeight + subHeaderHeight;
  console.log('GridLayoutContainer heights - Global:', globalHeaderHeight, 'Sub:', subHeaderHeight, 'Total:', totalHeaderHeight);
  
  // Ensure minimum reasonable height even if measurements fail
  const minHeight = Math.max(totalHeaderHeight, 45); // At least 45px for global header
  const computedHeight = `calc(100vh - ${minHeight}px)`;
  
  console.log('GridLayoutContainer computed height:', computedHeight);
  
  const leftCollapsed = leftSidebarState === 'collapsed';

  // Dynamic grid template columns based on sidebar states
  const getGridTemplateColumns = () => {
    // On mobile, use single column layout
    if (isMobile) {
      return '1fr';
    }
    
    const leftSidebarWidth = leftCollapsed ? 'var(--grid-left-sidebar-collapsed)' : 'var(--grid-left-sidebar)';

    // Use 32px for collapsed sidebar or actual width for expanded
    const rightSidebarWidth = rightCollapsed ? 'var(--grid-right-sidebar-collapsed, 56px)' : `${rightWidth}px`;
    
    return `${leftSidebarWidth} 1fr ${rightSidebarWidth}`;
  };

  return (
    <div
      className={cn(
        'w-full app-grid transition-[grid-template-columns] duration-300 ease-in-out',
        'min-h-0 overflow-hidden',
        isMobile && 'block',
        className
      )}
      style={{
        gridTemplateColumns: getGridTemplateColumns(),
        display: isMobile ? 'block' : 'grid',
        height: computedHeight
      }}
    >
      {children}
    </div>
  );
};

export default GridLayoutContainer;
