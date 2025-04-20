
import React from 'react';
import { FileType, X } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface FileInfoProps {
  showReset: boolean;
  onReset: () => void;
}

const FileInfo = ({ showReset, onReset }: FileInfoProps) => {
  return (
    <div className="flex justify-between border-t p-4">
      <div className="flex items-center">
        <FileType size={20} className="text-revio-500 mr-2" />
        <span className="text-sm">Støttede formater: Excel, CSV</span>
      </div>
      
      {showReset && (
        <Button 
          variant="outline"
          onClick={onReset}
          size="sm"
        >
          <X size={16} className="mr-1" />
          Ny opplasting
        </Button>
      )}
    </div>
  );
};

export default FileInfo;
