/**
 * GridLayoutContainer - CSS Grid layout for sidebar + main content + right sidebar
 * 
 * @description
 * Provides the core 3-column grid layout that adapts to sidebar states (collapsed/expanded)
 * and viewport size (mobile/desktop).
 * 
 * @responsibilities
 * 1. Dynamic grid columns based on sidebar states (collapsed/expanded)
 * 2. Calculate viewport height minus headers
 * 3. Responsive mobile/desktop layout switching
 * 
 * @grid-template-columns
 * Desktop: [left-sidebar-width] [1fr] [right-sidebar-width]
 * Mobile:  [1fr] (single column, sidebars as overlays)
 * 
 * @css-variables-used
 * - --grid-left-sidebar: 240px (expanded)
 * - --grid-left-sidebar-collapsed: 56px
 * - --grid-right-sidebar-collapsed: 56px
 * - --global-header-current-height: dynamic from LayoutContext
 * - --sub-header-current-height: dynamic from LayoutContext
 * 
 * @height-calculation
 * calc(100vh - (globalHeaderHeight + subHeaderHeight)px)
 * 
 * @example
 * ```tsx
 * <GridLayoutContainer>
 *   <ResizableLeftSidebar />
 *   <ResponsiveLayout>
 *     <Outlet />
 *   </ResponsiveLayout>
 *   <ResizableRightSidebar />
 * </GridLayoutContainer>
 * ```
 * 
 * @see {@link https://docs/design/ui-architecture.md} - Grid system explanation
 */

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
  // Use more robust viewport height calculation
  const computedHeight = `calc(100vh - ${globalHeaderHeight + subHeaderHeight}px)`;
  
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
        display: isMobile ? 'flex' : 'grid',
        flexDirection: isMobile ? 'column' : undefined,
        height: computedHeight
      }}
    >
      {children}
    </div>
  );
};

export default GridLayoutContainer;
