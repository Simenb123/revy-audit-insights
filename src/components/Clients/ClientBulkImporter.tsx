
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
// Nytt: vi trenger Select for fanen velger og Label for litt tydelighet
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Nytt: les Excel-filer for å hente fanenavn og evt. konvertere valgt fane til CSV
import * as XLSX from 'xlsx';

interface ClientBulkImportData {
  org_number: string;
  company_name?: string; // Nytt: navn på klienten
  client_group?: string;
  accounting_system?: string;
  partner?: string;
  ansv?: string;
  // NEW fields
  current_auditor_name?: string;
  accountant_name?: string;
  engagement_type?: string;
  // Nytt for budsjett/industri
  budget_amount?: string | number;
  budget_hours?: string | number;
  actual_industry?: string;
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
  const [step, setStep] = useState<'select' | 'sheet' | 'mapping' | 'processing' | 'success'>('select');
  const [results, setResults] = useState<{
    updated: number;
    errors: string[];
    warnings: string[];
  }>({ updated: 0, errors: [], warnings: [] });

  // Nytt: støtte for flere faner i Excel
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');

  const handleFileSelect = async (file: File) => {
    const extension = file.name.toLowerCase().split('.').pop();
    
    if (!['xlsx', 'xls', 'csv'].includes(extension || '')) {
      toast.error('Kun Excel (.xlsx, .xls) og CSV-filer er støttet');
      return;
    }

    setSelectedFile(file);
    
    // Header detection hints for client bulk files
    const csvOptions = {
      extraAliasHeaders: [
        'orgnr','org nr','organisasjonsnummer','orgnummer','org-nr','org no',
        'partner','ansv','kundeansvarlig','klientgruppe','kundegruppe','gruppe','client group',
        'regnskapssystem','økonomisystem','accounting system','erp',
        'budsjett','budsjett i kr','budsjett kroner','budsjett timer','timebudsjett',
        'faktisk bransje','overordnet bransje','kundenavn','navn','company name','company'
      ]
    } as const;
    const excelOptions = {
      extraTerms: [
        'organisasjonsnummer','orgnr','org nr','orgnummer',
        'partner','ansv','kundeansvarlig','klientgruppe','regnskapssystem',
        'budsjett','budsjett i kr','budsjett timer','faktisk bransje','kundenavn','navn'
      ]
    } as const;
    
    try {
      // Hvis CSV, beholder vi eksisterende løype
      if (extension === 'csv') {
        const preview = await processCSVFile(file, csvOptions);
        setFilePreview(preview);
        setShowMapping(true);
        setStep('mapping');
        return;
      }

      // Excel: hent fanenavn først
      const names = await getExcelSheetNames(file);
      if (names.length > 1) {
        setSheetNames(names);
        setSelectedSheet(names[0]);
        // Bytt til mapping-visning med forhåndsvisning av første fane
        const csvFile = await buildCsvFileFromSheet(file, names[0]);
        const preview = await processCSVFile(csvFile, csvOptions);
        setFilePreview(preview);
        setShowMapping(true);
        setStep('mapping');
        return;
      }

      // Kun én fane – kjør som før
      const preview = await processExcelFile(file, excelOptions);
      setFilePreview(preview);
      setShowMapping(true);
      setStep('mapping');
    } catch (error) {
      toast.error('Feil ved lesing av fil');
      console.error(error);
      setStep('select');
    }
  };

  // Hent fanenavn fra Excel
  const getExcelSheetNames = async (file: File): Promise<string[]> => {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    return wb.SheetNames || [];
  };

  // Konverter valgt fane til CSV og bruk eksisterende CSV-parser for forhåndsvisning/mapping
  const buildCsvFileFromSheet = async (file: File, sheetName: string): Promise<File> => {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const ws = wb.Sheets[sheetName];
    if (!ws) throw new Error(`Fane "${sheetName}" ble ikke funnet i filen`);

    const csv = XLSX.utils.sheet_to_csv(ws);
    const newName = `${file.name.replace(/\.(xlsx|xls)$/i, '')} - ${sheetName}.csv`;
    return new File([csv], newName, { type: 'text/csv' });
  };

  const handleConfirmSheet = async () => {
    if (!selectedFile || !selectedSheet) return;
    try {
      // Konverter valgt fane til CSV og gjenbruk CSV-prosessoren
      const csvFile = await buildCsvFileFromSheet(selectedFile, selectedSheet);
      const preview = await processCSVFile(csvFile, { extraAliasHeaders: [
        'orgnr','org nr','organisasjonsnummer','orgnummer','org-nr','org no',
        'partner','ansv','kundeansvarlig','klientgruppe','kundegruppe','gruppe','client group',
        'regnskapssystem','økonomisystem','accounting system','erp',
        'budsjett','budsjett i kr','budsjett kroner','budsjett timer','timebudsjett',
        'faktisk bransje','overordnet bransje','kundenavn','navn','company name','company'
      ]});
      setFilePreview(preview);
      setShowMapping(true);
      setStep('mapping');
    } catch (error) {
      console.error('Feil ved prosessering av valgt fane:', error);
      toast.error('Kunne ikke prosessere valgt fane');
      setStep('select');
    }
  };

  // Bytte fane direkte i forhåndsvisningen
  const handleSheetChange = async (name: string) => {
    if (!selectedFile) return;
    try {
      const csvFile = await buildCsvFileFromSheet(selectedFile, name);
      const preview = await processCSVFile(csvFile, { extraAliasHeaders: [
        'orgnr','org nr','organisasjonsnummer','orgnummer','org-nr','org no',
        'partner','ansv','kundeansvarlig','klientgruppe','kundegruppe','gruppe','client group',
        'regnskapssystem','økonomisystem','accounting system','erp',
        'budsjett','budsjett i kr','budsjett kroner','budsjett timer','timebudsjett',
        'faktisk bransje','overordnet bransje','kundenavn','navn','company name','company'
      ]});
      setSelectedSheet(name);
      setFilePreview(preview);
    } catch (error) {
      console.error('Feil ved bytte av fane:', error);
      toast.error('Kunne ikke bytte fane');
    }
  };

  const handleMappingComplete = async (mapping: Record<string, string>, headerRowIndex?: number, headers?: string[]) => {
    if (!filePreview || !selectedFile) return;
    
    setShowMapping(false);
    setStep('processing');
    
    try {
      const convertedData = convertDataWithMapping(filePreview, mapping, headerRowIndex, headers);
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

  // Parsing helpers for budsjett og timer
  const parseCurrency = (input: any): number | null => {
    if (input === null || input === undefined) return null;
    const raw = String(input).trim();
    if (!raw) return null;

    // Fjern valuta-symboler og mellomrom
    let s = raw.replace(/[^\d.,-]/g, '').replace(/\s+/g, '');

    // Hvis både . og , finnes, anta at komma er desimal (norsk format)
    if (s.includes('.') && s.includes(',')) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else if (s.includes(',')) {
      // Kun komma – bruk som desimal
      s = s.replace(',', '.');
    } else {
      // Kun punktum – antas som desimal eller tusenskiller; la stå
    }

    const val = Number.parseFloat(s);
    return Number.isFinite(val) ? val : null;
  };

  const parseNumber = (input: any): number | null => {
    if (input === null || input === undefined) return null;
    const s = String(input).trim().replace(/[^\d.,-]/g, '').replace(',', '.');
    const val = Number.parseFloat(s);
    return Number.isFinite(val) ? val : null;
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
          // Opprett ny klient automatisk når org.nr ikke finnes
          const baseName = (row.company_name?.toString().trim() || orgNumber);

          // Bygg insert-data med påkrevde felter + valgfelt dersom tilgjengelig
          const insertData: any = {
            user_id: user.id,
            org_number: orgNumber,
            company_name: baseName,
            name: baseName,
            is_active: true,
            progress: 0,
          };
          if (row.client_group) insertData.client_group = row.client_group.toString().trim();
          if (row.accounting_system) insertData.accounting_system = row.accounting_system.toString().trim();
          if (row.partner) insertData.partner = row.partner.toString().trim();
          if (row.ansv) insertData.ansv = row.ansv.toString().trim();
          if (row.current_auditor_name) insertData.current_auditor_name = row.current_auditor_name.toString().trim();
          if (row.accountant_name) insertData.accountant_name = row.accountant_name.toString().trim();
          if (row.engagement_type) {
            const normalized = normalizeEngagementType(row.engagement_type.toString());
            if (normalized) insertData.engagement_type = normalized;
          }
          if (row.budget_amount !== undefined && row.budget_amount !== '') {
            const amount = parseCurrency(row.budget_amount);
            if (amount !== null) {
              insertData.budget_amount = amount;
            }
          }
          if (row.budget_hours !== undefined && row.budget_hours !== '') {
            const hours = parseNumber(row.budget_hours);
            if (hours !== null) insertData.budget_hours = hours;
          }
          if (row.actual_industry !== undefined && row.actual_industry !== '') {
            insertData.actual_industry = row.actual_industry.toString().trim();
          }

          try {
            const { data: created, error: insertError } = await supabase
              .from('clients')
              .insert(insertData)
              .select('id, org_number, company_name, client_group, accounting_system')
              .maybeSingle();

            if (insertError) {
              // Håndter duplikat: unikhetsbrudd behandles som "allerede eksisterer"
              const code = (insertError as any).code || (insertError as any).details || '';
              if (typeof code === 'string' && code.includes('23505')) {
                warnings.push(`Rad ${i + 1}: ${orgNumber} finnes allerede – hoppet over`);
              } else {
                errors.push(`Rad ${i + 1}: Feil ved opprettelse av ${orgNumber}: ${insertError.message}`);
              }
              continue;
            }

            if (created) {
              clientMap.set(orgNumber, created);
              updated++; // teller som en endring
            }
          } catch (e: any) {
            errors.push(`Rad ${i + 1}: Ukjent feil ved opprettelse av ${orgNumber}`);
          }
          // Fortsett til neste rad etter opprettelse
          setUploadProgress(40 + ((i + 1) / data.length) * 50);
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

        // NYTT: Budsjett (kr), Budsjett timer og Faktisk bransje
        if (row.budget_amount !== undefined && row.budget_amount !== '') {
          const amount = parseCurrency(row.budget_amount);
          if (amount !== null) {
            updateData.budget_amount = amount;
          } else {
            warnings.push(`Rad ${i + 1}: Kunne ikke tolke 'Budsjett i kr' (${row.budget_amount})`);
          }
        }

        if (row.budget_hours !== undefined && row.budget_hours !== '') {
          const hours = parseNumber(row.budget_hours);
          if (hours !== null) {
            updateData.budget_hours = hours;
          } else {
            warnings.push(`Rad ${i + 1}: Kunne ikke tolke 'Budsjett timer' (${row.budget_hours})`);
          }
        }

        if (row.actual_industry !== undefined && row.actual_industry !== '') {
          updateData.actual_industry = row.actual_industry.toString().trim();
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
    // Rydd opp sheet state
    setSheetNames([]);
    setSelectedSheet('');
  };

  // Trinnet for manuell fanevelger er ikke lenger nødvendig, da vi viser forhåndsvisning av første fane
  // og lar brukeren bytte fane i selve forhåndsvisningen. Beholder blokk kommentert for evt. gjenbruk.
  // if (step === 'sheet' && selectedFile && sheetNames.length > 1) {
  //   return (
  //     <Card className="w-full max-w-none mx-auto">
  //       <CardHeader>
  //         <CardTitle className="flex items-center gap-2">
  //           <FileSpreadsheet className="w-5 h-5" />
  //           Velg fane i Excel-filen
  //         </CardTitle>
  //         <CardDescription>
  //           Filen har flere faner. Velg hvilken fane som skal brukes til import og mapping.
  //         </CardDescription>
  //       </CardHeader>
  //       <CardContent className="space-y-4">
  //         <div className="max-w-md">
  //           <Label>Fane</Label>
  //           <Select value={selectedSheet} onValueChange={setSelectedSheet}>
  //             <SelectTrigger className="mt-1">
  //               <SelectValue placeholder="Velg fane" />
  //             </SelectTrigger>
  //             <SelectContent>
  //               {sheetNames.map((name) => (
  //                 <SelectItem key={name} value={name}>
  //                   {name}
  //                 </SelectItem>
  //               ))}
  //             </SelectContent>
  //           </Select>
  //         </div>
  //         <div className="flex gap-2">
  //           <Button onClick={handleConfirmSheet}>Fortsett</Button>
  //           <Button variant="outline" onClick={resetImport}>Avbryt</Button>
  //         </div>
  //       </CardContent>
  //     </Card>
  //   );
  // }


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
            sheetNames={sheetNames}
            selectedSheet={selectedSheet}
            onSelectSheet={handleSheetChange}
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
                // Viktig: inkluder "ansv" som nøyaktig alias (både store/små)
                aliases: ['ansv','ANSV','kundeansvarlig','kunde ansvarlig','kundansvarlig','client manager','account manager','engagement manager','oppdragsleder']
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
                aliases: ['oppdragstype','type','engagement type','oppdrag']
              },
              // NYTT: Budsjett (kr)
              {
                field_key: 'budget_amount',
                field_label: 'Budsjett i kr',
                data_type: 'number',
                is_required: false,
                aliases: ['budsjett','budsjett beløp','budsjett i kr','budsjett kroner','budget amount','budget (kr)','budget nok']
              },
              // NYTT: Budsjett timer
              {
                field_key: 'budget_hours',
                field_label: 'Budsjett timer',
                data_type: 'number',
                is_required: false,
                aliases: ['budsjett timer','timer budsjett','timebudsjett','budget hours','hrs','hours']
              },
              // NYTT: Faktisk bransje
              {
                field_key: 'actual_industry',
                field_label: 'Faktisk bransje',
                data_type: 'text',
                is_required: false,
                aliases: ['faktisk bransje','overordnet bransje','manual industry','industry (manual)','næring (overordnet)']
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
                  • Budsjett i kr (valgfri) - tall eller tekst som tolkes til beløp
                  <br />
                  • Budsjett timer (valgfri) - tall eller tekst som tolkes til antall timer
                  <br />
                  • Faktisk bransje (valgfri) - manuelt overordnet bransjekategori
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
