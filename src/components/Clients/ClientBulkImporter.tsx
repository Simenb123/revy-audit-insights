
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Upload, Database, AlertCircle, CheckCircle, FileSpreadsheet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import EnhancedPreview from '@/components/DataUpload/EnhancedPreview';
import { 
  processExcelFile, 
  processCSVFile, 
  FilePreview, 
  convertDataWithMapping
} from '@/utils/fileProcessing';

interface ClientBulkImportData {
  org_number: string;
  client_group?: string;
  accounting_system?: string;
  partner?: string;
  ansv?: string;
  // NEW fields
  current_auditor_name?: string;
  accountant_name?: string;
  engagement_type?: string;
}

interface ClientBulkImporterProps {
  onImportComplete?: () => void;
  onCancel?: () => void;
}

const ClientBulkImporter = ({ onImportComplete, onCancel }: ClientBulkImporterProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const [showMapping, setShowMapping] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [step, setStep] = useState<'select' | 'mapping' | 'processing' | 'success'>('select');
  const [results, setResults] = useState<{
    updated: number;
    errors: string[];
    warnings: string[];
  }>({ updated: 0, errors: [], warnings: [] });

  const handleFileSelect = async (file: File) => {
    const extension = file.name.toLowerCase().split('.').pop();
    
    if (!['xlsx', 'xls', 'csv'].includes(extension || '')) {
      toast.error('Kun Excel (.xlsx, .xls) og CSV-filer er støttet');
      return;
    }

    setSelectedFile(file);
    
    try {
      let preview: FilePreview;
      if (extension === 'csv') {
        preview = await processCSVFile(file);
      } else {
        preview = await processExcelFile(file);
      }
      setFilePreview(preview);
      setShowMapping(true);
      setStep('mapping');
    } catch (error) {
      toast.error('Feil ved lesing av fil');
      console.error(error);
    }
  };

  const handleMappingComplete = async (mapping: Record<string, string>, headerRowIndex?: number) => {
    if (!filePreview || !selectedFile) return;
    
    setShowMapping(false);
    setStep('processing');
    
    try {
      const convertedData = convertDataWithMapping(filePreview, mapping, headerRowIndex);
      await processBulkImport(convertedData);
    } catch (error) {
      console.error('Conversion error:', error);
      toast.error('Feil ved datakonvertering');
      setStep('select');
    }
  };

  // Normalize the engagement type to enum values
  const normalizeEngagementType = (value: string): 'revisjon' | 'regnskap' | 'annet' | null => {
    if (!value) return null;
    const v = value.toString().trim().toLowerCase();
    const map: Record<string, 'revisjon' | 'regnskap' | 'annet'> = {
      'revisjon': 'revisjon',
      'revision': 'revisjon',
      'audit': 'revisjon',
      'regnskap': 'regnskap',
      'accounting': 'regnskap',
      'økonomi': 'regnskap',
      'annet': 'annet',
      'other': 'annet',
      'an net': 'annet', // common typo safeguard
    };
    // Simple startsWith mapping for robustness
    if (v.startsWith('rev')) return 'revisjon';
    if (v.startsWith('aud')) return 'revisjon';
    if (v.startsWith('regn') || v.startsWith('acc') || v.startsWith('øk')) return 'regnskap';
    if (v.startsWith('ann') || v.startsWith('oth')) return 'annet';
    return map[v] || null;
  };

  const processBulkImport = async (data: any[]) => {
    setUploadProgress(10);
    const errors: string[] = [];
    const warnings: string[] = [];
    let updated = 0;

    try {
      // Get current user to ensure they can only update their own clients
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Bruker ikke autentisert');
      }

      setUploadProgress(20);

      // Fetch user's clients to validate org numbers
      const { data: userClients, error: clientsError } = await supabase
        .from('clients')
        .select('id, org_number, company_name, client_group, accounting_system')
        .eq('user_id', user.id);

      if (clientsError) throw clientsError;

      const clientMap = new Map(userClients.map(c => [c.org_number, c]));
      
      setUploadProgress(40);

      // Process each row
      for (let i = 0; i < data.length; i++) {
        const row = data[i] as ClientBulkImportData;
        const orgNumber = (row.org_number as any)?.toString()?.trim();
        
        if (!orgNumber) {
          errors.push(`Rad ${i + 1}: Mangler organisasjonsnummer`);
          continue;
        }

        const client = clientMap.get(orgNumber);
        if (!client) {
          warnings.push(`Rad ${i + 1}: Klient med org.nr ${orgNumber} ikke funnet i din klientliste`);
          continue;
        }

        // Prepare update data (whitelisted fields only)
        const updateData: any = {};
        
        if (row.client_group !== undefined && row.client_group !== '') {
          updateData.client_group = row.client_group.toString().trim();
        }
        
        if (row.accounting_system !== undefined && row.accounting_system !== '') {
          updateData.accounting_system = row.accounting_system.toString().trim();
        }

        if (row.partner !== undefined && row.partner !== '') {
          updateData.partner = row.partner.toString().trim();
        }

        if (row.ansv !== undefined && row.ansv !== '') {
          updateData.ansv = row.ansv.toString().trim();
        }

        // NEW: registered auditor
        if (row.current_auditor_name !== undefined && row.current_auditor_name !== '') {
          updateData.current_auditor_name = row.current_auditor_name.toString().trim();
        }

        // NEW: registered accountant
        if (row.accountant_name !== undefined && row.accountant_name !== '') {
          updateData.accountant_name = row.accountant_name.toString().trim();
        }

        // NEW: engagement type normalization
        if (row.engagement_type !== undefined && row.engagement_type !== '') {
          const normalized = normalizeEngagementType(row.engagement_type.toString());
          if (normalized) {
            updateData.engagement_type = normalized;
          } else {
            warnings.push(`Rad ${i + 1}: Ugyldig 'Type oppdrag' (${row.engagement_type}); hoppet over`);
          }
        }

        try {
          const { error: updateError } = await supabase
            .from('clients')
            .update(updateData)
            .eq('id', client.id);

          if (updateError) {
            errors.push(`Rad ${i + 1}: Feil ved oppdatering av ${orgNumber}: ${updateError.message}`);
          } else {
            updated++;
          }
        } catch (error) {
          errors.push(`Rad ${i + 1}: Ukjent feil ved oppdatering av ${orgNumber}`);
        }

        // Update progress
        setUploadProgress(40 + ((i + 1) / data.length) * 50);
      }

      setResults({ updated, errors, warnings });
      setUploadProgress(100);
      setStep('success');

      if (updated > 0) {
        toast.success(`Oppdatert ${updated} klienter`);
        onImportComplete?.();
      }

    } catch (error) {
      console.error('Bulk import error:', error);
      toast.error('Feil ved bulk-import');
      setStep('select');
    }
  };

  const resetImport = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setShowMapping(false);
    setUploadProgress(0);
    setStep('select');
    setResults({ updated: 0, errors: [], warnings: [] });
  };

  if (showMapping && filePreview) {
    return (
      <Card className="w-full max-w-none mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Bulk Import - Kolonnmapping
          </CardTitle>
          <CardDescription>
            Map kolonnene til riktige felt. Organisasjonsnummer er påkrevd for å identifisere klienter.
          </CardDescription>
        </CardHeader>
        <CardContent>
              <EnhancedPreview
                preview={filePreview}
                fileName={selectedFile?.name || ''}
                clientId="bulk"
                fileType="client_bulk"
                customFieldDefinitions={[
                  {
                    field_key: 'org_number',
                    field_label: 'Organisasjonsnummer',
                    data_type: 'text',
                    is_required: true,
                    aliases: ['orgnr','org nr','organisasjonsnummer','orgnummer','org-nr','org no']
                  },
                  {
                    field_key: 'partner',
                    field_label: 'Partner',
                    data_type: 'text',
                    is_required: false,
                    aliases: ['partner','ansvarlig partner','oppdragsansvarlig','engagement partner','oppdragsansvarlig revisor']
                  },
                  {
                    field_key: 'ansv',
                    field_label: 'Kundeansvarlig',
                    data_type: 'text',
                    is_required: false,
                    aliases: ['kundeansvarlig','kunde ansvarlig','kundansvarlig','client manager','account manager','engagement manager','oppdragsleder']
                  },
                  {
                    field_key: 'client_group',
                    field_label: 'Klientgruppe',
                    data_type: 'text',
                    is_required: false,
                    aliases: ['gruppe','kundegruppe','klientgruppe','group','client group']
                  },
                  {
                    field_key: 'accounting_system',
                    field_label: 'Regnskapssystem',
                    data_type: 'text',
                    is_required: false,
                    aliases: ['regnskapssystem','økonomisystem','accounting system','erp','visma','tripletex','poweroffice','fiken','xledger','24sevenoffice']
                  },
                  // NEW fields for mapping
                  {
                    field_key: 'current_auditor_name',
                    field_label: 'Registrert revisor',
                    data_type: 'text',
                    is_required: false,
                    aliases: ['revisor','registrert revisor','auditor','current auditor','oppnevnt revisor']
                  },
                  {
                    field_key: 'accountant_name',
                    field_label: 'Registrert regnskapsfører',
                    data_type: 'text',
                    is_required: false,
                    aliases: ['regnskapsfører','autoriserte regnskapsfører','accountant','bookkeeper','registrert regnskapsfører']
                  },
                  {
                    field_key: 'engagement_type',
                    field_label: 'Type oppdrag',
                    data_type: 'text',
                    is_required: false,
                    aliases: ['oppdragstype','type','engagement type','oppdrag'],
                    // tips for brukeren via helper (EnhancedPreview kan vise dette om støttet)
                    helper_text: "Tillatte verdier: Revisjon, Regnskap, Annet"
                  }
                ]}
                onMappingComplete={handleMappingComplete}
                onCancel={() => {
                  setShowMapping(false);
                  setStep('select');
                }}
              />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Bulk Import av Klientdata
          </CardTitle>
          <CardDescription>
            Last opp Excel eller CSV-fil for å oppdatere klientgrupper og regnskapssystemer i bulk
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 'select' && (
            <>
              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  <strong>Forventet format:</strong>
                  <br />
                  • Organisasjonsnummer (påkrevd) - for å identifisere klienter
                  <br />
                  • Partner (valgfri) - oppdragsansvarlig/ansvarlig partner
                  <br />
                  • Kundeansvarlig (valgfri) - kontaktperson/oppdragsleder
                  <br />
                  • Klientgruppe (valgfri) - for å sette/oppdatere gruppe
                  <br />
                  • Regnskapssystem (valgfri) - for å sette/oppdatere regnskapssystem
                  <br />
                  • Registrert revisor (valgfri) - oppgitt revisor for klienten
                  <br />
                  • Registrert regnskapsfører (valgfri) - oppgitt regnskapsfører for klienten
                  <br />
                  • Type oppdrag (valgfri) - Revisjon, Regnskap eller Annet
                  <br />
                  <br />
                  <strong>Viktig:</strong> Kun eksisterende klienter i din klientliste kan oppdateres.
                </AlertDescription>
              </Alert>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Last opp fil</h3>
                <p className="text-gray-600 mb-4">
                  Velg en Excel (.xlsx, .xls) eller CSV-fil
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                  className="hidden"
                  id="file-upload"
                />
                <Button asChild>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    Velg fil
                  </label>
                </Button>
              </div>
            </>
          )}

          {step === 'processing' && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Prosesserer import...</h3>
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-sm text-gray-600 mt-2">{uploadProgress.toFixed(1)}% fullført</p>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="space-y-4">
              <div className="text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Import fullført</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Oppdatert</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {results.updated}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Advarsler</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      {results.warnings.length}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Feil</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {results.errors.length}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {results.warnings.length > 0 && (
                <Alert>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    <strong>Advarsler:</strong>
                    <ul className="list-disc list-inside mt-2">
                      {results.warnings.slice(0, 5).map((warning, index) => (
                        <li key={index} className="text-sm">{warning}</li>
                      ))}
                      {results.warnings.length > 5 && (
                        <li className="text-sm">... og {results.warnings.length - 5} flere</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {results.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    <strong>Feil:</strong>
                    <ul className="list-disc list-inside mt-2">
                      {results.errors.slice(0, 5).map((error, index) => (
                        <li key={index} className="text-sm">{error}</li>
                      ))}
                      {results.errors.length > 5 && (
                        <li className="text-sm">... og {results.errors.length - 5} flere</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2 justify-center">
                <Button onClick={resetImport}>
                  Importer ny fil
                </Button>
                <Button variant="outline" onClick={onCancel}>
                  Lukk
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientBulkImporter;
