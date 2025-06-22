
import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent } from "@/components/ui/sheet";
import RightSidebar from './RightSidebar';
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileRightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileRightSidebar = ({ isOpen, onClose }: MobileRightSidebarProps) => {
  const isMobile = useIsMobile();
  const [mobileWidth, setMobileWidth] = useState(320);

  // Load saved width from localStorage on mount
  useEffect(() => {
    const savedWidth = localStorage.getItem('rightSidebarWidth');
    if (savedWidth) {
      setMobileWidth(parseInt(savedWidth, 10));
    }
  }, []);

  const handleWidthChange = (newWidth: number) => {
    setMobileWidth(newWidth);
    localStorage.setItem('rightSidebarWidth', newWidth.toString());
  };

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
            onToggle={onClose}
            width={mobileWidth}
            onWidthChange={handleWidthChange}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileRightSidebar;
