
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';

interface SidebarHeaderProps {
  title: string;
  isCollapsed?: boolean;
  onToggle?: () => void;
  onClose?: () => void;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  title,
  isCollapsed,
  onToggle,
  onClose
}) => {
  if (isCollapsed) {
    return (
      <div className="w-16 border-l bg-background flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="p-2"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex justify-between items-center mb-4">
      <h3 className="font-semibold">{title}</h3>
      <div className="flex gap-2">
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onToggle}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default SidebarHeader;
