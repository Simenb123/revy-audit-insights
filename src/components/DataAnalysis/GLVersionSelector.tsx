import React from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Clock, FileText, HelpCircle, Star, StarOff } from 'lucide-react';
import { GLVersionOption } from '@/types/accounting';
import { format } from 'date-fns';
import { useSetActiveVersion } from '@/hooks/useAccountingVersions';
import { toast } from 'sonner';

export interface GLVersionSelectorProps {
  versions: GLVersionOption[];
  selectedVersion?: GLVersionOption;
  onSelectVersion?: (version: GLVersionOption) => void;
}

const GLVersionSelector: React.FC<GLVersionSelectorProps> = ({ 
  versions,
  selectedVersion,
  onSelectVersion
}) => {
  const setActiveVersionMutation = useSetActiveVersion();

  const handleSelectVersion = (versionId: string) => {
    console.log('[GL Version Selector] Selecting version:', versionId);
    const version = versions.find(v => v.id === versionId);
    if (version && onSelectVersion) {
      console.log('[GL Version Selector] Found version:', version);
      onSelectVersion(version);
    }
  };

  const handleSetAsDefault = async () => {
    if (!selectedVersion) return;
    
    try {
      await setActiveVersionMutation.mutateAsync(selectedVersion.id);
      toast.success(`Versjon ${selectedVersion.version_number} er nå satt som standard`);
    } catch (error) {
      console.error('Error setting active version:', error);
      toast.error('Kunne ikke sette versjon som standard');
    }
  };

  // Don't render if no versions or no selected version
  if (!versions.length || !selectedVersion) {
    console.log('[GL Version Selector] Not rendering - versions:', versions.length, 'selected:', !!selectedVersion);
    return null;
  }
  
  return (
    <div className="flex justify-between items-center border-b pb-4 mb-4">
      <div className="flex items-center gap-2">
        <Clock size={16} className="text-muted-foreground" />
        <span className="text-sm font-medium">Versjon:</span>
        <Select value={selectedVersion.id} onValueChange={handleSelectVersion}>
          <SelectTrigger className="w-[320px]">
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-muted-foreground" />
              <div className="flex flex-col flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{selectedVersion.label}</span>
                  {selectedVersion.is_active && (
                    <Star size={12} className="text-amber-500 fill-amber-500" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(selectedVersion.created_at), 'dd.MM.yyyy HH:mm')} • {selectedVersion.total_transactions} transaksjoner
                </div>
              </div>
            </div>
          </SelectTrigger>
          <SelectContent>
            {versions.map(version => (
              <SelectItem key={version.id} value={version.id}>
                <div className="flex items-center gap-2">
                  <span>{version.label}</span>
                  {version.is_active && (
                    <Star size={12} className="text-amber-500 fill-amber-500" />
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSetAsDefault}
              disabled={selectedVersion.is_active || setActiveVersionMutation.isPending}
              className="h-8"
            >
              {selectedVersion.is_active ? (
                <Star size={14} className="text-amber-500 fill-amber-500" />
              ) : (
                <StarOff size={14} />
              )}
              {selectedVersion.is_active ? 'Standard' : 'Sett som standard'}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">
              {selectedVersion.is_active 
                ? 'Denne versjonen er allerede satt som standard'
                : 'Sett denne versjonen som standard versjon som lastes automatisk'
              }
            </p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <HelpCircle size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">
              Du ser på versjon <strong>{selectedVersion.label}</strong> fra {format(new Date(selectedVersion.created_at), 'dd. MMMM yyyy')}. 
              Du kan velge en tidligere versjon fra nedtrekksmenyen eller sette denne som standard.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

export default GLVersionSelector;