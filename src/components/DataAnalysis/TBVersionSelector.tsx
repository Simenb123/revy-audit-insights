import React from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Clock, FileText, HelpCircle } from 'lucide-react';
import { TBVersionOption } from '@/types/accounting';
import { format } from 'date-fns';

export interface TBVersionSelectorProps {
  versions: TBVersionOption[];
  selectedVersion?: TBVersionOption;
  onSelectVersion?: (version: TBVersionOption) => void;
}

const TBVersionSelector: React.FC<TBVersionSelectorProps> = ({ 
  versions,
  selectedVersion,
  onSelectVersion
}) => {
  const handleSelectVersion = (versionId: string) => {
    console.log('[TB Version Selector] Selecting version:', versionId);
    const version = versions.find(v => v.id === versionId);
    if (version && onSelectVersion) {
      console.log('[TB Version Selector] Found version:', version);
      onSelectVersion(version);
    }
  };

  // Don't render if no versions or no selected version
  if (!versions.length || !selectedVersion) {
    console.log('[TB Version Selector] Not rendering - versions:', versions.length, 'selected:', !!selectedVersion);
    return null;
  }
  
  return (
    <div className="flex justify-between items-center border-b pb-4 mb-4">
      <div className="flex items-center gap-2">
        <Clock size={16} className="text-muted-foreground" />
        <span className="text-sm font-medium">Versjon:</span>
        <Select value={selectedVersion.id} onValueChange={handleSelectVersion}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Velg versjon" />
          </SelectTrigger>
          <SelectContent>
            {versions.map(version => (
              <SelectItem key={version.id} value={version.id} className="flex gap-2 items-center">
                <FileText size={14} className="mr-2" />
                <span>{version.label}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {format(new Date(version.created_at), 'dd.MM.yyyy HH:mm')}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <HelpCircle size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">
              Du ser på versjon <strong>{selectedVersion.label}</strong> fra {format(new Date(selectedVersion.created_at), 'dd. MMMM yyyy')}. 
              Du kan velge en tidligere versjon fra nedtrekksmenyen.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

export default TBVersionSelector;