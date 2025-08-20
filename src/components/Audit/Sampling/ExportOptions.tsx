import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  FileCheck,
  Settings,
  Info
} from 'lucide-react';
import { SamplingResult, ExportFormat } from '@/services/sampling/types';
import { 
  exportToCSV,
  exportToJSON,
  preparePDFData,
  createDownloadBlob, 
  downloadFile, 
  generateExportFilename 
} from '@/services/sampling/exportService';
import { paramHash } from '@/services/sampling/paramHash';
import { useToast } from '@/hooks/use-toast';

interface ExportOptionsProps {
  result?: SamplingResult;
  onSave?: (planName: string, notes?: string) => void;
  disabled?: boolean;
}

const ExportOptions: React.FC<ExportOptionsProps> = ({ 
  result, 
  onSave,
  disabled = false 
}) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Export settings
  const [exportFormat, setExportFormat] = useState<'CSV' | 'JSON' | 'PDF'>('CSV');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeParameters, setIncludeParameters] = useState(true);
  
  // Save settings
  const [planName, setPlanName] = useState('');
  const [notes, setNotes] = useState('');

  const handleExport = async () => {
    if (!result) return;

    setIsExporting(true);
    try {
      const exportOptions = {
        type: exportFormat as 'CSV' | 'JSON',
        includeMetadata,
        includeParameters
      };

      // Create content based on format
      const content = exportFormat === 'CSV' 
        ? exportToCSV(result, result.plan as any, exportOptions)
        : exportToJSON(result, result.plan as any, exportOptions);

      // Create and download file
      const mimeType = exportFormat === 'CSV' ? 'text/csv' : 'application/json';
      const blob = createDownloadBlob(content, mimeType);
      const fileName = generateExportFilename(
        planName || `Utvalg_${new Date().toISOString().split('T')[0]}`,
        exportFormat,
        new Date()
      );
      
      downloadFile(blob, fileName);
      
      toast({
        title: "Eksport fullført",
        description: `Utvalget er eksportert som ${fileName}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Eksport feilet",
        description: error instanceof Error ? error.message : 'Ukjent feil oppstod',
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSave = async () => {
    if (!planName.trim()) {
      toast({
        title: "Mangler plannavn",
        description: "Vennligst angi et navn for utvalgsplanen",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSave?.(planName.trim(), notes.trim() || undefined);
      
      toast({
        title: "Utvalg lagret",
        description: `Utvalgsplan "${planName}" er lagret`,
      });
      
      // Reset form
      setPlanName('');
      setNotes('');
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Lagring feilet",
        description: error instanceof Error ? error.message : 'Ukjent feil oppstod',
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'CSV':
        return <FileSpreadsheet className="h-4 w-4" />;
      case 'JSON':
        return <FileText className="h-4 w-4" />;
      case 'PDF':
        return <FileCheck className="h-4 w-4" />;
      default:
        return <Download className="h-4 w-4" />;
    }
  };

  const getFormatDescription = (format: string) => {
    switch (format) {
      case 'CSV':
        return 'Tabellformat kompatibel med Excel og andre regneark';
      case 'JSON':
        return 'Strukturert dataformat for teknisk bruk';
      case 'PDF':
        return 'Formatert rapport for presentasjon og arkivering';
      default:
        return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Eksport og lagring
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status indicator */}
        {!result && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <div className="font-medium">Ingen utvalg å eksportere</div>
                <div>Generer et utvalg først for å aktivere eksport- og lagringsmuligheter.</div>
              </div>
            </div>
          </div>
        )}

        {/* Export Section */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Eksporter utvalg</Label>
          
          {/* Format Selection */}
          <div className="space-y-3">
            <Label htmlFor="exportFormat">Filformat</Label>
            <Select value={exportFormat} onValueChange={(value: 'CSV' | 'JSON' | 'PDF') => setExportFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CSV">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    CSV - Regneark
                  </div>
                </SelectItem>
                <SelectItem value="JSON">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    JSON - Strukturert data
                  </div>
                </SelectItem>
                <SelectItem value="PDF">
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-4 w-4" />
                    PDF - Rapport
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground">
              {getFormatDescription(exportFormat)}
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-3">
            <Label>Inkluder i eksport</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeMetadata"
                  checked={includeMetadata}
                  onCheckedChange={(checked) => setIncludeMetadata(checked === true)}
                />
                <Label htmlFor="includeMetadata" className="text-sm">
                  Metadata og beregningsdetaljer
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeParameters"
                  checked={includeParameters}
                  onCheckedChange={(checked) => setIncludeParameters(checked === true)}
                />
                <Label htmlFor="includeParameters" className="text-sm">
                  Parametere og konfigurasjon
                </Label>
              </div>
            </div>
          </div>

          {/* Export Button */}
          <Button 
            onClick={handleExport}
            disabled={disabled || !result || isExporting}
            className="w-full"
          >
            {getFormatIcon(exportFormat)}
            {isExporting ? 'Eksporterer...' : `Eksporter som ${exportFormat}`}
          </Button>
        </div>

        <Separator />

        {/* Save Section */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Lagre utvalgsplan</Label>
          
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="planName">Plannavn *</Label>
              <Input
                id="planName"
                placeholder="f.eks. Salgsutvalg 2024 Q1"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                disabled={disabled || !result}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notater (valgfritt)</Label>
              <Textarea
                id="notes"
                placeholder="Tilleggsnotater om utvalget..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={disabled || !result}
                rows={3}
              />
            </div>
          </div>

          <Button 
            onClick={handleSave}
            disabled={disabled || !result || !planName.trim() || isSaving}
            className="w-full"
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            {isSaving ? 'Lagrer...' : 'Lagre utvalgsplan'}
          </Button>
        </div>

        {/* Result Summary */}
        {result && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-sm font-medium mb-2">Utvalgssammendrag</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="text-muted-foreground">Total størrelse</div>
                <div className="font-medium">{result.plan.actualSampleSize} transaksjoner</div>
              </div>
              <div>
                <div className="text-muted-foreground">Metode</div>
                <div className="font-medium">{result.plan.method}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Målrettede</div>
                <div className="font-medium">{result.samples.targeted.length}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Tilfeldige</div>
                <div className="font-medium">{result.samples.residual.length}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExportOptions;