import React from 'react';
import { 
  FileText, 
  Database, 
  CheckCircle, 
  FileSpreadsheet
} from 'lucide-react';
import { useActiveVersion } from '@/hooks/useAccountingVersions';
import { useActiveTrialBalanceVersion } from '@/hooks/useActiveTrialBalanceVersion';
import { useClientDocuments } from '@/hooks/useClientDocuments';
import { useAccountingYear } from '@/hooks/useAccountingYear';
import { formatDistanceToNow } from 'date-fns';
import { nb } from 'date-fns/locale';

interface DocumentDataPanelProps {
  clientId?: string;
}

export default function DocumentDataPanel({ clientId }: DocumentDataPanelProps) {
  const { accountingYear } = useAccountingYear(clientId || '');
  
  // Active versions
  const { data: activeVersion, isLoading: activeVersionLoading } = useActiveVersion(clientId || '');
  const { data: activeTBVersion, isLoading: activeTBVersionLoading } = useActiveTrialBalanceVersion(clientId || '', accountingYear);
  
  // Recent documents
  const { documents, isLoading: documentsLoading } = useClientDocuments(clientId);
  
  if (!clientId) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Velg en klient for å se dokumenter og versjoner.
      </div>
    );
  }

  const recentDocuments = documents
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4);

  return (
    <div className="p-3 space-y-4 text-sm">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Database className="h-4 w-4" />
        <h3 className="font-medium">Dokumenter</h3>
      </div>

      {/* Active Versions - Simple List */}
      <div className="space-y-3">
        {/* Hovedbok */}
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          {activeVersionLoading ? (
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          ) : activeVersion ? (
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span className="font-medium">Hovedbok:</span>
                <span className="text-muted-foreground truncate">
                  {activeVersion.file_name || `V${activeVersion.version_number}`}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">Ingen hovedbok</span>
          )}
        </div>

        {/* Saldobalanse */}
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          {activeTBVersionLoading ? (
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          ) : activeTBVersion ? (
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span className="font-medium">Saldobalanse:</span>
                <span className="text-muted-foreground truncate">
                  {activeTBVersion.version} ({activeTBVersion.year})
                </span>
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">Ingen saldobalanse</span>
          )}
        </div>
      </div>

      {/* Recent Documents - Simple List */}
      <div className="space-y-2">
        <div className="text-muted-foreground font-medium">Siste dokumenter</div>
        {documentsLoading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => (
              <div key={i} className="h-4 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : recentDocuments.length > 0 ? (
          <div className="space-y-2">
            {recentDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center gap-2">
                <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm">
                    {doc.file_name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(doc.created_at), {
                      addSuffix: true,
                      locale: nb
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground py-2">
            Ingen dokumenter lastet opp
          </div>
        )}
      </div>
    </div>
  );
}