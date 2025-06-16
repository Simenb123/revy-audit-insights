
import React from 'react';
import { Button } from "@/components/ui/button";
import { MessageSquare, Sparkles } from 'lucide-react';
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileRightSidebarToggleProps {
  onClick: () => void;
}

const MobileRightSidebarToggle = ({ onClick }: MobileRightSidebarToggleProps) => {
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <Button
      onClick={onClick}
      className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg"
      size="icon"
    >
      <div className="relative">
        <MessageSquare className="h-6 w-6 text-white" />
        {/* Smart AI indicator */}
        <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5">
          <Sparkles className="h-2.5 w-2.5 text-blue-600" />
        </div>
      </div>
    </Button>
  );
};

export default MobileRightSidebarToggle;
