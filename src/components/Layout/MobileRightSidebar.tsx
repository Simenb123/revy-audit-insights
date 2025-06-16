
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
        className="w-full p-0 border-l-0"
        style={{ maxWidth: '100vw' }}
      >
        <RightSidebar 
          isCollapsed={false}
          isExpanded={false}
          onToggle={onClose}
          onToggleExpanded={() => {}}
        />
      </SheetContent>
    </Sheet>
  );
};

export default MobileRightSidebar;
