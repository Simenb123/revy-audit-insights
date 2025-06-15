import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useDocumentVersions, DocumentVersion } from '@/hooks/useDocumentVersions';
import { useRestoreDocumentVersion } from '@/hooks/useRestoreDocumentVersion';
import { Clock, History, User, Bot, Loader2, FileDiff } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Client, ClientAuditAction } from '@/types/revio';
import { Alert, AlertDescription } from '@/components/ui/alert';
import VersionDiffDialog from './VersionDiffDialog';
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from '@/hooks/use-toast';
import { cn } from "@/lib/utils";

interface VersionHistoryProps {
  client: Client;
  action: ClientAuditAction;
  onRestore: (content: string) => void;
}

const VersionHistory: React.FC<VersionHistoryProps> = ({ client, action, onRestore }) => {
  const { data: versions, isLoading, error } = useDocumentVersions(action.id);
  const { mutate: restoreVersion, isPending: isRestoring } = useRestoreDocumentVersion(onRestore);
  const [isDiffOpen, setIsDiffOpen] = useState(false);
  const [versionsToCompare, setVersionsToCompare] = useState<{ older: DocumentVersion | null; newer: DocumentVersion | null }>({ older: null, newer: null });
  const [selectedVersions, setSelectedVersions] = useState<DocumentVersion[]>([]);
  const { toast } = useToast();

  const handleRestore = (version: DocumentVersion) => {
    restoreVersion({ version, client, action });
  };

  const handleOpenDiff = (olderVersion: DocumentVersion, newerVersion: DocumentVersion) => {
    setVersionsToCompare({ older: olderVersion, newer: newerVersion });
    setIsDiffOpen(true);
  };

  const handleVersionSelect = (version: DocumentVersion, isChecked: boolean) => {
    if (isChecked) {
      setSelectedVersions(currentSelected => {
        if (currentSelected.length >= 2) {
          toast({
            description: "Du kan bare sammenligne to versjoner om gangen.",
          });
          return currentSelected;
        }
        return [...currentSelected, version];
      });
    } else {
      setSelectedVersions(currentSelected => currentSelected.filter(v => v.id !== version.id));
    }
  };

  const handleCompareSelected = () => {
    if (selectedVersions.length !== 2) return;
    const sorted = [...selectedVersions].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    handleOpenDiff(sorted[0], sorted[1]);
  };


  if (isLoading) {
    return (
        <div className="space-y-2">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <History size={16} />
              Versjonshistorikk
            </h4>
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
        </div>
    );
  }

  if (error) {
    return <Alert variant="destructive"><AlertDescription>{error.message}</AlertDescription></Alert>
  }

  return (
    <div>
      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
        <History size={16} />
        Versjonshistorikk
      </h4>
      {versions && versions.length > 0 ? (
        <>
          <ul className="space-y-2 max-h-48 overflow-y-auto pr-2 border rounded-md p-2 bg-muted/20">
            {versions.map((version) => {
              const isSelected = selectedVersions.some(v => v.id === version.id);
              const canSelect = selectedVersions.length < 2 || isSelected;

              return (
                <li key={version.id} className={cn(
                  "flex items-center justify-between gap-2 p-2 rounded-md border bg-background shadow-sm transition-colors hover:bg-accent",
                  isSelected && "bg-primary/10 border-primary/50"
                )}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Checkbox
                      id={`version-${version.id}`}
                      checked={isSelected}
                      onCheckedChange={(checked) => handleVersionSelect(version, !!checked)}
                      disabled={!canSelect}
                      aria-label={`Velg versjon ${version.version_name}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 font-medium text-sm truncate">
                        {version.change_source === 'ai' ? <Bot size={14} className="text-purple-600 flex-shrink-0" /> : <User size={14} className="text-blue-600 flex-shrink-0" />}
                        <span className="truncate" title={version.version_name}>{version.version_name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock size={12} />
                        {format(new Date(version.created_at), 'dd.MM.yyyy HH:mm:ss')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleRestore(version)}
                      disabled={isRestoring}
                    >
                      {isRestoring ? <Loader2 size={16} className="animate-spin" /> : 'Gjenopprett'}
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>

          {versions && versions.length > 1 && (
            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleCompareSelected}
                disabled={selectedVersions.length !== 2}
              >
                <FileDiff size={16} className="mr-2" />
                Sammenlign ({selectedVersions.length}/2)
              </Button>
            </div>
          )}

          <VersionDiffDialog
            isOpen={isDiffOpen}
            onOpenChange={(isOpen) => {
                if (!isOpen) {
                    setVersionsToCompare({ older: null, newer: null });
                    setSelectedVersions([]);
                }
                setIsDiffOpen(isOpen)
            }}
            olderVersion={versionsToCompare.older}
            newerVersion={versionsToCompare.newer}
          />
        </>
      ) : (
        <div className="text-sm text-muted-foreground italic border rounded-md p-4 text-center">Ingen versjonshistorikk funnet.</div>
      )}
    </div>
  );
};

export default VersionHistory;
