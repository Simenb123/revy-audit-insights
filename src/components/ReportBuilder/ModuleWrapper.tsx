import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useViewMode } from './ViewModeContext';
import { useAutoGridItemHeight } from '@/hooks/useAutoGridItemHeight';

interface ModuleWrapperProps {
  /** Unique id used for grid auto height calculations */
  id: string;
  /** Optional title shown in module header */
  title?: string;
  /** Widgets or other content contained in the module */
  children: React.ReactNode;
}

export function ModuleWrapper({ id, title, children }: ModuleWrapperProps) {
  const { isViewMode } = useViewMode();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  // Auto-adjust height based on content when expanded
  useAutoGridItemHeight(id, containerRef, { minRows: 2, enabled: !collapsed });

  const toggleCollapse = () => setCollapsed(prev => !prev);

  return (
    <div ref={containerRef} className="relative group h-full overflow-hidden">
      <div className="flex items-center justify-between p-2 border-b cursor-move">
        {title && <h3 className="text-sm font-medium">{title}</h3>}
        {!isViewMode && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 module-controls"
            onClick={toggleCollapse}
            onMouseDown={e => e.stopPropagation()}
          >
            {collapsed ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronUp className="h-3 w-3" />
            )}
          </Button>
        )}
      </div>
      {!collapsed && <div className="p-2 space-y-2">{children}</div>}
    </div>
  );
}
