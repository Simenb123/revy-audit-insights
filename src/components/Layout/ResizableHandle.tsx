
import React from 'react';
import { GripVertical } from 'lucide-react';

interface ResizableHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
}

const ResizableHandle: React.FC<ResizableHandleProps> = ({ onMouseDown }) => {
  return (
    <div
      className="w-1 h-full bg-border hover:bg-primary/50 cursor-col-resize flex items-center justify-center group transition-all duration-200 hover:w-2"
      onMouseDown={onMouseDown}
      title="Dra for å endre størrelse"
    >
      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-background/80 rounded px-0.5 py-1">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
};

export default ResizableHandle;
