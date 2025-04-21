
import React from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Clock, FileText, HelpCircle } from 'lucide-react';
import { DocumentVersion } from '@/types/revio';
import { format } from 'date-fns';

interface VersionSelectorProps {
  versions: DocumentVersion[];
  selectedVersion: DocumentVersion;
  onSelectVersion?: (version: DocumentVersion) => void;
}

const VersionSelector: React.FC<VersionSelectorProps> = ({ 
  versions,
  selectedVersion,
  onSelectVersion
}) => {
  const handleSelectVersion = (versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    if (version && onSelectVersion) {
      onSelectVersion(version);
    }
  };
  
  return (
    <div className="flex justify-between items-center border-b pb-4 mb-4">
      <div className="flex items-center gap-2">
        <Clock size={16} className="text-muted-foreground" />
        <span className="text-sm font-medium">Versjon:</span>
        <Select value={selectedVersion.id} onValueChange={handleSelectVersion}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Velg versjon" />
          </SelectTrigger>
          <SelectContent>
            {versions.map(version => (
              <SelectItem key={version.id} value={version.id} className="flex gap-2 items-center">
                <FileText size={14} className="mr-2" />
                <span>{version.name}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {format(new Date(version.date), 'dd.MM.yyyy')}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <HelpCircle size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                Du ser på versjon <strong>{selectedVersion.name}</strong> fra {format(new Date(selectedVersion.date), 'dd. MMMM yyyy')}. 
                Du kan velge en tidligere versjon fra nedtrekksmenyen.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="flex items-center gap-1 bg-muted/40 rounded px-2 py-1 text-xs">
        <span className={`w-2 h-2 rounded-full ${
          selectedVersion.status === 'draft' ? 'bg-yellow-500' : 
          selectedVersion.status === 'final' ? 'bg-green-500' : 'bg-blue-500'
        }`} />
        <span>
          {selectedVersion.status === 'draft' ? 'Utkast' : 
           selectedVersion.status === 'final' ? 'Endelig' : 'Revidert'}
        </span>
      </div>
    </div>
  );
};

export default VersionSelector;
