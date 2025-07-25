import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Upload, Download, FileSpreadsheet, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

const AccountRelationshipManager = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [customColumns, setCustomColumns] = useState<string[]>([]);
  const [newColumnName, setNewColumnName] = useState('');

  const handleExport = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('account-data-manager', {
        body: {
          operation: 'export',
          file_name: `account_relationships_${new Date().toISOString().split('T')[0]}.csv`
        }
      });

      if (error) throw error;

      if (data.success) {
        // Convert to Excel format
        const worksheet = XLSX.utils.json_to_sheet(data.data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Standard Accounts');

        // Add a second sheet with audit areas reference
        const auditAreasData = [
          { audit_number: 100, name: 'Lønn', description: 'Lønnskostnader og relaterte poster' },
          { audit_number: 200, name: 'Salg', description: 'Salgsinntekter og kundefordringer' },
          { audit_number: 300, name: 'Varelager', description: 'Lagerbeholdning og varekostnader' },
          { audit_number: 400, name: 'Kostnader', description: 'Driftskostnader og leverandørgjeld' },
          { audit_number: 500, name: 'Finans', description: 'Finansinntekter og finanskostnader' },
          { audit_number: 600, name: 'Bank', description: 'Bankinnskudd og kontanter' },
          { audit_number: 700, name: 'Investeringer', description: 'Anleggsmidler og investeringer' },
          { audit_number: 800, name: 'Nærstående transaksjoner', description: 'Transaksjoner med nærstående parter' },
          { audit_number: 900, name: 'Regnskapsrapportering', description: 'Regnskapsavleggelse og presentasjon' }
        ];
        const auditAreasSheet = XLSX.utils.json_to_sheet(auditAreasData);
        XLSX.utils.book_append_sheet(workbook, auditAreasSheet, 'Audit Areas Reference');

        // Add risk factors reference sheet
        const riskFactorsData = [
          { risk_number: 100, name: 'Salgsinntekter - innregning', risk_level: 'high' },
          { risk_number: 200, name: 'Lønn - periodisering', risk_level: 'medium' },
          { risk_number: 300, name: 'Varelager - verdsettelse', risk_level: 'high' },
          { risk_number: 400, name: 'Nærstående transaksjoner', risk_level: 'high' },
          { risk_number: 500, name: 'Ledelsens overstyring', risk_level: 'critical' },
          { risk_number: 600, name: 'IT-kontroller', risk_level: 'medium' },
          { risk_number: 700, name: 'Estimater og vurderinger', risk_level: 'high' }
        ];
        const riskFactorsSheet = XLSX.utils.json_to_sheet(riskFactorsData);
        XLSX.utils.book_append_sheet(workbook, riskFactorsSheet, 'Risk Factors Reference');

        // Download the file
        XLSX.writeFile(workbook, `account_relationships_${new Date().toISOString().split('T')[0]}.xlsx`);
        
        toast.success(`Eksporterte ${data.record_count} kontoer til Excel-fil`);
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Feil ved eksport av data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Detect custom columns (columns starting with 'custom_')
      const detectedCustomColumns: string[] = [];
      if (jsonData.length > 0) {
        const firstRow = jsonData[0] as any;
        Object.keys(firstRow).forEach(key => {
          if (key.startsWith('custom_')) {
            const customColName = key.replace('custom_', '');
            if (!detectedCustomColumns.includes(customColName)) {
              detectedCustomColumns.push(customColName);
            }
          }
        });
      }

      const { data, error } = await supabase.functions.invoke('account-data-manager', {
        body: {
          operation: 'import',
          data: jsonData,
          file_name: file.name,
          custom_columns: detectedCustomColumns
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(`Import fullført: ${data.records_successful} suksess, ${data.records_failed} feil`);
        if (data.errors && data.errors.length > 0) {
          console.log('Import errors:', data.errors);
          toast.warning(`${data.records_failed} rader feilet. Se konsollen for detaljer.`);
        }
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Feil ved import av data');
    } finally {
      setIsLoading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const addCustomColumn = () => {
    if (newColumnName && !customColumns.includes(newColumnName)) {
      setCustomColumns([...customColumns, newColumnName]);
      setNewColumnName('');
      toast.success(`Egendefinert kolonne "${newColumnName}" lagt til`);
    }
  };

  const removeCustomColumn = (columnName: string) => {
    setCustomColumns(customColumns.filter(col => col !== columnName));
    toast.success(`Egendefinert kolonne "${columnName}" fjernet`);
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        standard_number: '1000',
        standard_name: 'Eksempel konto',
        account_type: 'asset',
        category: 'current_assets',
        analysis_group: 'balance_sheet',
        audit_area_number: '600',
        audit_area_name: 'Bank',
        audit_area_relevance: '1.0',
        audit_area_notes: 'Primær revisjonsområde',
        risk_factor_number: '600',
        risk_factor_name: 'IT-kontroller',
        risk_level: 'medium',
        risk_impact: 'Potensial for feil i rapportering',
        risk_mitigation: 'Månedlig avstemming',
        is_related_party: false,
        related_party_type: '',
        related_party_description: '',
        is_estimate: false,
        estimate_type: '',
        estimate_complexity: '',
        estimation_method: '',
        key_assumptions: '',
        audit_considerations: '',
        ...customColumns.reduce((acc, col) => ({ ...acc, [`custom_${col}`]: '' }), {})
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

    // Add instruction sheet
    const instructions = [
      { field: 'standard_number', description: 'Kontonummer (påkrevd)', example: '1000' },
      { field: 'standard_name', description: 'Kontonavn', example: 'Bankinnskudd' },
      { field: 'audit_area_number', description: 'Revisjonsområde nummer', example: '600' },
      { field: 'risk_factor_number', description: 'Risikofaktor nummer', example: '600' },
      { field: 'risk_level', description: 'Risikonivå (low/medium/high/critical)', example: 'medium' },
      { field: 'is_related_party', description: 'Nærstående transaksjon (true/false)', example: 'false' },
      { field: 'is_estimate', description: 'Estimat (true/false)', example: 'false' }
    ];
    const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

    XLSX.writeFile(workbook, 'account_relationships_template.xlsx');
    toast.success('Template lastet ned');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relasjonsstyring Kontoer</h1>
          <p className="text-muted-foreground">Administrer relasjoner mellom kontoer, revisjonsområder og risikoer</p>
        </div>
      </div>

      <Tabs defaultValue="import-export" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="import-export">Import/Export</TabsTrigger>
          <TabsTrigger value="custom-columns">Egendefinerte Kolonner</TabsTrigger>
          <TabsTrigger value="overview">Oversikt</TabsTrigger>
        </TabsList>

        <TabsContent value="import-export" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Eksporter Data
                </CardTitle>
                <CardDescription>
                  Last ned alle kontoer med deres relasjoner til Excel-format
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleExport} 
                  disabled={isLoading}
                  className="w-full"
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Eksporter til Excel
                </Button>
                <Button 
                  onClick={downloadTemplate} 
                  variant="outline"
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Last ned Template
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Importer Data
                </CardTitle>
                <CardDescription>
                  Last opp Excel-fil med kontodata og relasjoner
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="file-upload">Velg Excel-fil</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    disabled={isLoading}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  Støttede formater: .xlsx, .xls, .csv
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="custom-columns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Egendefinerte Kolonner</CardTitle>
              <CardDescription>
                Legg til egne kolonner for fleksibel dataadministrasjon
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Navn på ny kolonne"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCustomColumn()}
                />
                <Button onClick={addCustomColumn} disabled={!newColumnName}>
                  Legg til
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label>Aktive egendefinerte kolonner:</Label>
                {customColumns.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {customColumns.map((column) => (
                      <div key={column} className="flex items-center gap-2 bg-secondary px-3 py-1 rounded-md">
                        <span className="text-sm">{column}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeCustomColumn(column)}
                          className="h-4 w-4 p-0"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Ingen egendefinerte kolonner lagt til</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Revisjonsområder
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>100 - Lønn</div>
                  <div>200 - Salg</div>
                  <div>300 - Varelager</div>
                  <div>400 - Kostnader</div>
                  <div>500 - Finans</div>
                  <div>600 - Bank</div>
                  <div>700 - Investeringer</div>
                  <div>800 - Nærstående transaksjoner</div>
                  <div>900 - Regnskapsrapportering</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risikofaktorer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>100 - Salgsinntekter - innregning</div>
                  <div>200 - Lønn - periodisering</div>
                  <div>300 - Varelager - verdsettelse</div>
                  <div>400 - Nærstående transaksjoner</div>
                  <div>500 - Ledelsens overstyring</div>
                  <div>600 - IT-kontroller</div>
                  <div>700 - Estimater og vurderinger</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Indikatorer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div><strong>Nærstående transaksjoner:</strong></div>
                  <div className="text-muted-foreground">Marker kontoer som normalt involverer nærstående</div>
                  
                  <div className="mt-4"><strong>Estimater:</strong></div>
                  <div className="text-muted-foreground">Identifiser kontoer med regnskapsmessige estimater</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountRelationshipManager;