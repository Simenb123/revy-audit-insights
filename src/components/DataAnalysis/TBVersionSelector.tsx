import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Clock, FileText, HelpCircle, Upload, Lock, Unlock } from 'lucide-react';
import { TBVersionOption } from '@/types/accounting';
import { format } from 'date-fns';
import TrialBalanceUploadDialog from './TrialBalanceUploadDialog';
import { useToggleTrialBalanceLock } from '@/hooks/useTrialBalanceVersions';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useToast } from "@/hooks/use-toast";

export interface TBVersionSelectorProps {
  versions: TBVersionOption[];
  selectedVersion?: TBVersionOption;
  onSelectVersion?: (version: TBVersionOption) => void;
  clientId: string;
}

const TBVersionSelector: React.FC<TBVersionSelectorProps> = ({ 
  versions,
  selectedVersion,
  onSelectVersion,
  clientId
}) => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const { selectedFiscalYear } = useFiscalYear();
  const toggleLockMutation = useToggleTrialBalanceLock();
  const { toast } = useToast();
  const handleSelectVersion = (versionId: string) => {
    console.log('[TB Version Selector] Selecting version:', versionId);
    const version = versions.find(v => v.id === versionId);
    if (version && onSelectVersion) {
      console.log('[TB Version Selector] Found version:', version);
      onSelectVersion(version);
    }
  };

  const handleToggleLock = async () => {
    if (!selectedVersion) return;
    
    try {
      await toggleLockMutation.mutateAsync({
        clientId,
        periodYear: selectedVersion.period_year,
        isLocked: !selectedVersion.is_locked
      });
      
      toast({
        title: selectedVersion.is_locked ? "År låst opp" : "År låst",
        description: selectedVersion.is_locked 
          ? `Regnskapsår ${selectedVersion.period_year} er nå åpent for endringer.`
          : `Regnskapsår ${selectedVersion.period_year} er nå låst for endringer.`,
      });
    } catch (error) {
      console.error('Lock toggle error:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke endre låsestatus.",
        variant: "destructive",
      });
    }
  };

  // Show upload option if no versions available
  if (!versions || versions.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock size={16} />
            <span>Ingen saldobalanse data for {selectedFiscalYear}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setUploadDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Upload size={14} />
            Last opp saldobalanse
          </Button>
        </div>
        
        <TrialBalanceUploadDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          clientId={clientId}
          fiscalYear={selectedFiscalYear}
          onUploadSuccess={() => {
            // Refresh will be handled by query invalidation
          }}
        />
      </div>
    );
  }

  // Always render component, but show placeholder if no data - prevents React error #310
  if (!selectedVersion) {
    return (
      <div className="flex justify-between items-center border-b pb-4 mb-4">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Ingen versjon valgt</span>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center border-b pb-4 mb-4">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-muted-foreground" />
          {selectedVersion.is_locked && (
            <Lock size={14} className="text-yellow-600" />
          )}
          <span className="text-sm font-medium">
            Versjon: {selectedVersion.is_locked && "(Låst)"}
          </span>
          <Select value={selectedVersion.id} onValueChange={handleSelectVersion}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Velg versjon" />
            </SelectTrigger>
            <SelectContent>
              {versions.map(version => (
                <SelectItem key={version.id} value={version.id} className="flex gap-2 items-center">
                  <div className="flex items-center gap-2">
                    {version.is_locked ? (
                      <Lock size={14} className="text-yellow-600" />
                    ) : (
                      <FileText size={14} />
                    )}
                    <span>{version.label}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {format(new Date(version.created_at), 'dd.MM.yyyy HH:mm')}
                    </span>
                  </div>
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
                {selectedVersion.is_locked && " Dette året er låst for endringer."}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleLock}
            disabled={toggleLockMutation.isPending}
            className="flex items-center gap-2"
          >
            {selectedVersion.is_locked ? (
              <>
                <Unlock size={14} />
                Lås opp
              </>
            ) : (
              <>
                <Lock size={14} />
                Lås år
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setUploadDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Upload size={14} />
            Last opp ny versjon
          </Button>
        </div>
      </div>
      
      <TrialBalanceUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        clientId={clientId}
        fiscalYear={selectedFiscalYear}
        onUploadSuccess={() => {
          // Refresh will be handled by query invalidation
        }}
      />
    </div>
  );
};

export default React.memo(TBVersionSelector);