import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Database, 
  CheckCircle, 
  Clock, 
  FileSpreadsheet,
  Settings,
  Upload
} from 'lucide-react';
import { useAccountingVersions, useActiveVersion, useSetActiveVersion } from '@/hooks/useAccountingVersions';
import { useTrialBalanceVersions } from '@/hooks/useTrialBalanceVersions';
import { useActiveTrialBalanceVersion } from '@/hooks/useActiveTrialBalanceVersion';
import { useClientDocuments } from '@/hooks/useClientDocuments';
import { useAccountingYear } from '@/hooks/useAccountingYear';
import { formatDistanceToNow } from 'date-fns';
import { nb } from 'date-fns/locale';
import { toast } from 'sonner';

interface DocumentDataPanelProps {
  clientId?: string;
}

interface VersionStatusProps {
  title: string;
  icon: React.ReactNode;
  activeVersion?: any;
  totalVersions: number;
  isLoading: boolean;
  onVersionChange?: (versionId: string) => void;
  versions?: any[];
}

const VersionStatus: React.FC<VersionStatusProps> = ({
  title,
  icon,
  activeVersion,
  totalVersions,
  isLoading,
  onVersionChange,
  versions = []
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-12 rounded-md bg-muted animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (!activeVersion) {
    return (
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xs text-muted-foreground">
            Ingen versjoner tilgjengelig
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center gap-2">
          {icon}
          {title}
          <Badge variant="secondary" className="ml-auto text-xs">
            {totalVersions} versjoner
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Aktiv versjon</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {activeVersion.file_name || `Versjon ${activeVersion.version_number}`}
            </div>
            {activeVersion.created_at && (
              <div className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(activeVersion.created_at), {
                  addSuffix: true,
                  locale: nb
                })}
              </div>
            )}
          </div>
        </div>

        {versions.length > 1 && (
          <div className="space-y-2">
            <Separator />
            <div className="text-xs font-medium text-muted-foreground">Andre versjoner</div>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {versions
                .filter(v => v.id !== activeVersion.id)
                .slice(0, 3)
                .map((version) => (
                  <div 
                    key={version.id}
                    className="flex items-center justify-between text-xs p-2 rounded border hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="font-medium">
                        {version.file_name || `Versjon ${version.version_number}`}
                      </div>
                      {version.created_at && (
                        <div className="text-muted-foreground">
                          {formatDistanceToNow(new Date(version.created_at), {
                            addSuffix: true,
                            locale: nb
                          })}
                        </div>
                      )}
                    </div>
                    {onVersionChange && (
                      <Button
                        variant="ghost" 
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => onVersionChange(version.id)}
                      >
                        Aktiver
                      </Button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function DocumentDataPanel({ clientId }: DocumentDataPanelProps) {
  const { accountingYear } = useAccountingYear(clientId || '');
  
  // Accounting versions
  const { data: accountingVersions, isLoading: versionsLoading } = useAccountingVersions(clientId || '');
  const { data: activeVersion, isLoading: activeVersionLoading } = useActiveVersion(clientId || '');
  const setActiveVersionMutation = useSetActiveVersion();
  
  // Trial balance versions
  const { data: tbVersions, isLoading: tbVersionsLoading } = useTrialBalanceVersions(clientId || '');
  const { data: activeTBVersion, isLoading: activeTBVersionLoading } = useActiveTrialBalanceVersion(clientId || '', accountingYear);
  
  // Client documents
  const { documents, isLoading: documentsLoading } = useClientDocuments(clientId);
  
  const hasClient = !!clientId;

  const handleSetActiveVersion = async (versionId: string) => {
    try {
      await setActiveVersionMutation.mutateAsync(versionId);
      toast.success('Aktiv versjon oppdatert');
    } catch (error) {
      toast.error('Kunne ikke oppdatere aktiv versjon');
      console.error('Error setting active version:', error);
    }
  };

  if (!hasClient) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Velg en klient for å se dokumenter og versjoner.
      </div>
    );
  }

  const recentDocuments = documents
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <ScrollArea className="flex-1">
      <div className="p-3 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          <h3 className="font-semibold">Dokumenter & Data</h3>
        </div>

        {/* Active Versions Overview */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Aktive versjoner</h4>
          
          <VersionStatus
            title="Hovedbok"
            icon={<FileSpreadsheet className="h-4 w-4" />}
            activeVersion={activeVersion}
            totalVersions={accountingVersions?.length || 0}
            isLoading={versionsLoading || activeVersionLoading}
            onVersionChange={handleSetActiveVersion}
            versions={accountingVersions || []}
          />

          <VersionStatus
            title="Saldobalanse"
            icon={<Database className="h-4 w-4" />}
            activeVersion={activeTBVersion}
            totalVersions={tbVersions?.length || 0}
            isLoading={tbVersionsLoading || activeTBVersionLoading}
          />
        </div>

        <Separator />

        {/* Recent Documents */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-muted-foreground">Siste dokumenter</h4>
            <Badge variant="outline" className="text-xs">
              {documents.length} totalt
            </Badge>
          </div>

          {documentsLoading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => (
                <div key={i} className="h-12 rounded-md bg-muted animate-pulse" />
              ))}
            </div>
          ) : recentDocuments.length > 0 ? (
            <div className="space-y-2">
              {recentDocuments.map((doc) => (
                <Card key={doc.id} className="border-l-4 border-l-primary/20">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {doc.file_name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {doc.category && (
                            <Badge variant="secondary" className="text-xs">
                              {doc.category}
                            </Badge>
                          )}
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(doc.created_at), {
                              addSuffix: true,
                              locale: nb
                            })}
                          </div>
                        </div>
                        {doc.ai_analysis_summary && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {doc.ai_analysis_summary}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <div className="text-sm text-muted-foreground">
                Ingen dokumenter lastet opp ennå
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Settings className="h-4 w-4" />
            <h4 className="text-sm font-medium text-muted-foreground">Hurtighandlinger</h4>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="justify-start h-8"
              disabled={setActiveVersionMutation.isPending}
            >
              <Clock className="h-3 w-3 mr-2" />
              Versjonsoversikt
            </Button>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}