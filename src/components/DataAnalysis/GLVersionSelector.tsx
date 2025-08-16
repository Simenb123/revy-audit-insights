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
    <div className="border-b pb-4 mb-4">
      {/* Version Information Display */}
      <div className="flex items-center gap-2 mb-3">
        <FileText size={16} className="text-muted-foreground" />
        <span className="font-medium">{selectedVersion.label}</span>
        {selectedVersion.is_active && (
          <Star size={12} className="text-amber-500 fill-amber-500" />
        )}
        <span className="text-sm text-muted-foreground">
          • {format(new Date(selectedVersion.created_at), 'dd.MM.yyyy HH:mm')} • {selectedVersion.total_transactions} transaksjoner
        </span>
      </div>
      
      {/* Version Selector and Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-muted-foreground" />
          <span className="text-sm font-medium">Versjon:</span>
          <select 
            value={selectedVersion.id} 
            onChange={(e) => handleSelectVersion(e.target.value)}
            className="w-[280px] h-9 px-3 py-1 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          >
            {versions.map(version => (
              <option key={version.id} value={version.id}>
                {version.label}{version.is_active ? ' (Standard)' : ''}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-2">
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
    </div>
  );
};

export default GLVersionSelector;