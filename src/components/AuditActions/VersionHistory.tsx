
import React from 'react';
import { Button } from "@/components/ui/button";
import { useDocumentVersions, DocumentVersion } from '@/hooks/useDocumentVersions';
import { useRestoreDocumentVersion } from '@/hooks/useRestoreDocumentVersion';
import { Clock, History, User, Bot, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Client } from '@/types/revio';
import { ClientAuditAction } from '@/types/audit-actions';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VersionHistoryProps {
  client: Client;
  action: ClientAuditAction;
  onRestore: (content: string) => void;
}

const VersionHistory: React.FC<VersionHistoryProps> = ({ client, action, onRestore }) => {
  const { data: versions, isLoading, error } = useDocumentVersions(action.id);
  const { mutate: restoreVersion, isPending: isRestoring } = useRestoreDocumentVersion(onRestore);

  const handleRestore = (version: DocumentVersion) => {
    restoreVersion({ version, client, action });
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
        <ul className="space-y-2 max-h-48 overflow-y-auto pr-2 border rounded-md p-2 bg-muted/20">
          {versions.map((version) => (
            <li key={version.id} className="flex items-center justify-between gap-2 p-2 rounded-md border bg-background shadow-sm">
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
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleRestore(version)}
                disabled={isRestoring}
              >
                {isRestoring ? <Loader2 size={16} className="animate-spin" /> : 'Gjenopprett'}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-sm text-muted-foreground italic border rounded-md p-4 text-center">Ingen versjonshistorikk funnet.</div>
      )}
    </div>
  );
};

export default VersionHistory;
