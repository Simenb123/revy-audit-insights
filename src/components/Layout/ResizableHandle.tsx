
import React from 'react';
import { GripVertical } from 'lucide-react';

interface ResizableHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
}

const ResizableHandle: React.FC<ResizableHandleProps> = ({ onMouseDown }) => {
  return (
    <div
      className="w-1 bg-border hover:bg-primary/50 cursor-col-resize flex items-center justify-center group"
      onMouseDown={onMouseDown}
    >
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
};

export default ResizableHandle;
