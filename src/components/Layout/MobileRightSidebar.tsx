
import React from 'react';
import { Sheet, SheetContent } from "@/components/ui/sheet";
import RightSidebar from './RightSidebar';
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileRightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileRightSidebar = ({ isOpen, onClose }: MobileRightSidebarProps) => {
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className="w-full p-0 border-l-0 max-w-none"
        style={{ width: '100vw' }}
      >
        <div className="h-full">
          <RightSidebar 
            isCollapsed={false}
            isExpanded={false}
            onToggle={onClose}
            onToggleExpanded={() => {}}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileRightSidebar;
