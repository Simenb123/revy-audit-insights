import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Download } from 'lucide-react';
import { PayrollRawData } from '@/hooks/usePayrollDetailedData';
import { toast } from 'sonner';

interface PayrollRawDataTabProps {
  rawData?: PayrollRawData;
}

export function PayrollRawDataTab({ rawData }: PayrollRawDataTabProps) {
  const copyToClipboard = async () => {
    if (!rawData?.raw_json) return;
    
    try {
      const jsonString = JSON.stringify(rawData.raw_json, null, 2);
      await navigator.clipboard.writeText(jsonString);
      toast.success('JSON-data kopiert til utklippstavle');
    } catch (error) {
      toast.error('Kunne ikke kopiere data');
    }
  };

  const downloadJson = () => {
    if (!rawData?.raw_json) return;
    
    const jsonString = JSON.stringify(rawData.raw_json, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `a07_raw_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('JSON-fil lastet ned');
  };

  if (!rawData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Ingen rådata tilgjengelig</p>
        <p className="text-sm text-muted-foreground mt-2">
          Rådata er kun tilgjengelig for nye importer etter systemoppdateringen.
        </p>
      </div>
    );
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Rådata (JSON)</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Komplett JSON-struktur fra den originale A07-filen
        </p>
      </div>

      {/* File Info */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold">Filinformasjon</h4>
            <p className="text-sm text-muted-foreground">
              Størrelse: {formatFileSize(rawData.file_size)}
            </p>
            <p className="text-sm text-muted-foreground">
              Importert: {new Date(rawData.created_at).toLocaleString('nb-NO')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={copyToClipboard} variant="outline" size="sm">
              <Copy className="h-4 w-4 mr-2" />
              Kopier JSON
            </Button>
            <Button onClick={downloadJson} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Last ned
            </Button>
          </div>
        </div>
      </Card>

      {/* JSON Viewer */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b">
          <h4 className="font-semibold">JSON-innhold</h4>
        </div>
        <ScrollArea className="h-[500px] w-full">
          <pre className="p-4 text-xs font-mono whitespace-pre-wrap">
            {JSON.stringify(rawData.raw_json, null, 2)}
          </pre>
        </ScrollArea>
      </Card>

      {/* Data Structure Overview */}
      <Card className="p-4">
        <h4 className="font-semibold mb-4">Datastruktur oversikt</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          {rawData.raw_json && Object.keys(rawData.raw_json).map((key) => {
            const value = rawData.raw_json[key];
            const type = Array.isArray(value) ? 'array' : typeof value;
            const count = Array.isArray(value) ? value.length : Object.keys(value || {}).length;
            
            return (
              <div key={key} className="p-3 border rounded">
                <div className="font-medium">{key}</div>
                <div className="text-muted-foreground">
                  Type: {type}
                  {Array.isArray(value) && ` (${count} elementer)`}
                  {type === 'object' && !Array.isArray(value) && ` (${count} felt)`}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}