import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Database, FileText, Calendar, User, CheckCircle2 } from 'lucide-react';
import { useAccountingVersions, useSetActiveVersion } from '@/hooks/useAccountingVersions';
import { VersionDeleteButton } from './VersionDeleteButton';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { nb } from 'date-fns/locale';

interface VersionManagerCardProps {
  clientId: string;
}

export const VersionManagerCard: React.FC<VersionManagerCardProps> = ({ clientId }) => {
  const { data: versions, isLoading } = useAccountingVersions(clientId);
  const setActiveVersion = useSetActiveVersion();

  const handleSetActive = async (versionId: string, versionLabel: string) => {
    try {
      await setActiveVersion.mutateAsync(versionId);
      toast.success(`"${versionLabel}" er nå aktiv versjon`);
    } catch (error) {
      toast.error('Kunne ikke aktivere versjon');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Versjonsstyring
          </CardTitle>
          <CardDescription>
            Laster versjoner...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!versions || versions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Versjonsstyring
          </CardTitle>
          <CardDescription>
            Ingen hovedboksversjoner funnet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Last opp hovedbokdata for å opprette din første versjon.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Versjonsstyring
        </CardTitle>
        <CardDescription>
          Administrer {versions.length} hovedboksversjoner
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {versions.map((version) => (
            <div 
              key={version.id} 
              className={`p-4 border rounded-lg ${
                version.is_active 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium truncate">
                      Versjon {version.version_number} - {version.file_name}
                    </h4>
                    {version.is_active && (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Aktiv
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {version.total_transactions.toLocaleString()} transaksjoner
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(version.created_at), { 
                        addSuffix: true, 
                        locale: nb 
                      })}
                    </div>
                    <div className="text-xs">
                      Debet: {version.total_debit_amount.toLocaleString('nb-NO', { 
                        minimumFractionDigits: 2 
                      })} kr
                    </div>
                    <div className="text-xs">
                      Kredit: {version.total_credit_amount.toLocaleString('nb-NO', { 
                        minimumFractionDigits: 2 
                      })} kr
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!version.is_active && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetActive(
                        version.id, 
                        `Versjon ${version.version_number}`
                      )}
                      disabled={setActiveVersion.isPending}
                    >
                      Aktiver
                    </Button>
                  )}
                  
                  <VersionDeleteButton
                    versionId={version.id}
                    versionLabel={`Versjon ${version.version_number} - ${version.file_name}`}
                    isActive={version.is_active}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};