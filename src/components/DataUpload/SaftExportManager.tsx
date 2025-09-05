import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Download, FileText, Archive, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SaftExportManagerProps {
  clientId: string;
}

interface ExportSession {
  id: string;
  file_name: string;
  import_status: string;
  saft_version: string;
  created_at: string;
  metadata?: any;
}

const SaftExportManager: React.FC<SaftExportManagerProps> = ({ clientId }) => {
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [exportFormats, setExportFormats] = useState({
    xlsx: true,
    csv: false,
    xml: false
  });
  const [isExporting, setIsExporting] = useState(false);
  const [sessions, setSessions] = useState<ExportSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    loadSaftSessions();
  }, [clientId]);

  const loadSaftSessions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('saft_import_sessions')
        .select('*')
        .eq('client_id', clientId)
        .eq('import_status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading SAF-T sessions:', error);
      toast.error('Kunne ikke laste SAF-T importer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    if (!selectedSession) {
      toast.error('Velg en SAF-T import å eksportere');
      return;
    }

    setIsExporting(true);
    try {
      // Call edge function to generate export
      const { data, error } = await supabase.functions.invoke('saft-export', {
        body: {
          sessionId: selectedSession,
          clientId,
          formats: exportFormats
        }
      });

      if (error) throw error;

      // Download the generated files
      if (data.downloadUrls) {
        for (const [format, url] of Object.entries(data.downloadUrls)) {
          if (exportFormats[format as keyof typeof exportFormats]) {
            // Trigger download
            const link = document.createElement('a');
            link.href = url as string;
            link.download = `saft_export_${selectedSession}.${format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        }
      }

      toast.success('SAF-T eksport fullført');
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(error.message || 'Feil ved eksport');
    } finally {
      setIsExporting(false);
    }
  };

  const selectedSessionData = sessions.find(s => s.id === selectedSession);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Archive className="h-5 w-5" />
          SAF-T Eksport
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {sessions.length === 0 && !isLoading ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Ingen fullførte SAF-T importer funnet for denne klienten.
              Importer en SAF-T fil først for å kunne eksportere data.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Velg SAF-T import</Label>
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg en importert SAF-T fil..." />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{session.file_name}</span>
                        <div className="flex items-center gap-2 ml-2">
                          <Badge variant="outline" className="text-xs">
                            {session.saft_version}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(session.created_at).toLocaleDateString('nb-NO')}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedSessionData && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Kontoer: {selectedSessionData.metadata?.total_accounts || 0}</div>
                    <div>Transaksjoner: {selectedSessionData.metadata?.total_transactions || 0}</div>
                    <div>Kunder: {selectedSessionData.metadata?.total_customers || 0}</div>
                    <div>Leverandører: {selectedSessionData.metadata?.total_suppliers || 0}</div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <Label>Eksportformater</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="xlsx"
                    checked={exportFormats.xlsx}
                    onCheckedChange={(checked) =>
                      setExportFormats(prev => ({ ...prev, xlsx: !!checked }))
                    }
                  />
                  <Label htmlFor="xlsx" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Excel (XLSX) - Anbefalt for analyse
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="csv"
                    checked={exportFormats.csv}
                    onCheckedChange={(checked) =>
                      setExportFormats(prev => ({ ...prev, csv: !!checked }))
                    }
                  />
                  <Label htmlFor="csv" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    CSV - Kompatibel med andre systemer
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="xml"
                    checked={exportFormats.xml}
                    onCheckedChange={(checked) =>
                      setExportFormats(prev => ({ ...prev, xml: !!checked }))
                    }
                  />
                  <Label htmlFor="xml" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    XML (SAF-T) - Standard format
                  </Label>
                </div>
              </div>
            </div>

            <Button
              onClick={handleExport}
              disabled={!selectedSession || isExporting || !Object.values(exportFormats).some(Boolean)}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? 'Eksporterer...' : 'Eksporter SAF-T data'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SaftExportManager;