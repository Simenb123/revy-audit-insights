import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import { processExcelFile, processCSVFile, suggestColumnMappings, FilePreview, ColumnMapping } from '@/utils/fileProcessing';
import { LEGAL_PROVISION_FIELDS, NORWEGIAN_LEGAL_TERMS } from '@/utils/legalProvisionFields';
import { SmartColumnMapper } from '@/components/Upload';
import { FieldDefinition } from '@/types/upload';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateLegalProvisionTemplate } from '@/services/legal-knowledge/legalProvisionTemplate';

interface LawProvisionUploaderProps {
  lawIdentifier: string;
  lawTitle: string;
  onBack: () => void;
  onComplete?: () => void;
}

export const LawProvisionUploader: React.FC<LawProvisionUploaderProps> = ({
  lawIdentifier,
  lawTitle,
  onBack,
  onComplete
}) => {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'importing'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [suggestedMappings, setSuggestedMappings] = useState<ColumnMapping[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [requiredStatus, setRequiredStatus] = useState({ total: 0, mapped: 0, complete: false });
  const [processedData, setProcessedData] = useState<any[]>([]);

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('Kun Excel (.xlsx, .xls) og CSV filer er støttet');
      return;
    }

    setFile(selectedFile);
  };

  // Process file and generate suggestions
  const handleProcessFile = async () => {
    if (!file) return;

    try {
      console.log('Starting file processing...', { fileName: file.name, fileSize: file.size });
      toast.info('Behandler fil...');
      
      let preview: FilePreview;
      if (file.name.toLowerCase().endsWith('.csv')) {
        console.log('Processing as CSV file');
        preview = await processCSVFile(file, { extraAliasHeaders: NORWEGIAN_LEGAL_TERMS });
      } else {
        console.log('Processing as Excel file');
        preview = await processExcelFile(file, { extraTerms: NORWEGIAN_LEGAL_TERMS });
      }

      console.log('File preview generated:', {
        headers: preview.headers,
        totalRows: preview.totalRows,
        sampleRows: preview.rows.slice(0, 2)
      });

      setFilePreview(preview);

      // Generate column mapping suggestions
      console.log('Generating column mapping suggestions...');
      
      let initialMapping: Record<string, string> = {};
      
      try {
        const suggestions = await suggestColumnMappings(
          preview.headers,
          LEGAL_PROVISION_FIELDS
        );

        console.log('Generated suggestions:', suggestions);
        setSuggestedMappings(suggestions);

        // Apply suggested mappings
        suggestions.forEach(suggestion => {
          if (suggestion.confidence > 0.6) {
            initialMapping[suggestion.sourceColumn] = suggestion.targetField;
          }
        });
      } catch (error) {
        console.error('Error generating mapping suggestions:', error);
      }
      
      // Pre-populate law_identifier for all rows
      const lawIdHeader = preview.headers.find(h => 
        LEGAL_PROVISION_FIELDS[1].aliases.some(alias => 
          h.toLowerCase().includes(alias.toLowerCase())
        )
      );
      if (!lawIdHeader) {
        // If no law_identifier column detected, we'll add it during processing
        initialMapping['_auto_law_id'] = 'law_identifier';
      }

      console.log('Initial mapping:', initialMapping);
      setColumnMapping(initialMapping);
      
      console.log('Moving to mapping step...');
      setStep('mapping');
      toast.success(`Fil behandlet: ${preview.totalRows} rader funnet`);
    } catch (error) {
      console.error('File processing error:', error);
      toast.error(`Feil ved behandling av fil: ${error instanceof Error ? error.message : 'Ukjent feil'}`);
    }
  };

  // Handle mapping changes
  const handleMappingChange = (sourceColumn: string, targetField: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [sourceColumn]: targetField === 'none' ? '' : targetField
    }));
  };

  // Validate mappings
  useEffect(() => {
    if (!filePreview) return;

    const errors: Record<string, string> = {};
    const mappedFields = new Set(Object.values(columnMapping).filter(Boolean));
    
    // Check for required fields
    const requiredFields = LEGAL_PROVISION_FIELDS.filter(f => f.required);
    const mappedRequiredFields = requiredFields.filter(f => mappedFields.has(f.key));
    
    // Check for duplicate mappings
    const fieldCounts: Record<string, string[]> = {};
    Object.entries(columnMapping).forEach(([source, target]) => {
      if (target) {
        if (!fieldCounts[target]) fieldCounts[target] = [];
        fieldCounts[target].push(source);
      }
    });

    Object.entries(fieldCounts).forEach(([field, sources]) => {
      if (sources.length > 1) {
        sources.forEach(source => {
          errors[source] = `Duplikat: Feltet "${field}" er valgt flere ganger`;
        });
      }
    });

    setValidationErrors(errors);
    setRequiredStatus({
      total: requiredFields.length,
      mapped: mappedRequiredFields.length,
      complete: mappedRequiredFields.length === requiredFields.length && Object.keys(errors).length === 0
    });
  }, [columnMapping, filePreview]);

  // Process and preview data
  const handlePreviewData = () => {
    if (!filePreview || !requiredStatus.complete) return;

    try {
      const processed = filePreview.allRows.map((row, index) => {
        const processedRow: any = {
          _row_number: index + 1,
          law_identifier: lawIdentifier // Always set to selected law
        };

        // Map each column according to user selection
        Object.entries(columnMapping).forEach(([sourceColumn, targetField]) => {
          if (targetField && targetField !== 'law_identifier') {
            const columnIndex = filePreview.headers.indexOf(sourceColumn);
            if (columnIndex !== -1) {
              processedRow[targetField] = row[columnIndex] || '';
            }
          }
        });

        return processedRow;
      });

      setProcessedData(processed);
      setStep('preview');
      toast.success(`${processed.length} rader klare for import`);
    } catch (error) {
      toast.error(`Feil ved behandling av data: ${error}`);
    }
  };

  // Import data to database
  const handleImportData = async () => {
    if (!processedData.length) return;

    try {
      setStep('importing');
      toast.info('Importerer juridiske bestemmelser...');

      // Prepare data for database insertion
      const provisions = processedData.map((row, index) => {
        // Create valid provision data ensuring required fields are not empty
        const provision = {
          provision_id: row.provision_id || crypto.randomUUID(),
          law_identifier: row.law_identifier || lawIdentifier,
          provision_type: row.provision_type || 'section',
          provision_number: row.provision_number || `${index + 1}`,
          title: row.title || `Bestemmelse ${index + 1}`,
          content: row.content || '',
          parent_provision_id: row.parent_provision_id || null,
          valid_from: row.valid_from ? (
            typeof row.valid_from === 'string' ? row.valid_from.split('T')[0] : 
            new Date(row.valid_from).toISOString().split('T')[0]
          ) : null,
          valid_until: row.valid_until ? (
            typeof row.valid_until === 'string' ? row.valid_until.split('T')[0] : 
            new Date(row.valid_until).toISOString().split('T')[0]
          ) : null,
          is_active: true
        };
        
        console.log(`Row ${index + 1} prepared:`, provision);
        return provision;
      });

      // Insert provisions in batch
      console.log('Attempting to insert provisions:', provisions.length);
      const { data, error } = await supabase
        .from('legal_provisions')
        .insert(provisions)
        .select();

      if (error) {
        console.error('Database insert error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log('Successfully inserted provisions:', data?.length || provisions.length);
      toast.success(`${provisions.length} juridiske bestemmelser importert!`);
      onComplete?.();
    } catch (error) {
      console.error('Import error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ukjent feil';
      toast.error(`Feil ved import: ${errorMessage}`);
      setStep('preview');
    }
  };

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <FileSpreadsheet className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Last opp juridiske bestemmelser</h3>
        <p className="text-muted-foreground mb-4">
          For <strong>{lawTitle}</strong>
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          Støttede formater: Excel (.xlsx, .xls) eller CSV filer
        </p>
        <Button 
          variant="outline" 
          onClick={() => {
            try {
              generateLegalProvisionTemplate(lawIdentifier, lawTitle);
              toast.success('Excel-template lastet ned');
            } catch (error) {
              console.error('Template generation error:', error);
              toast.error('Feil ved generering av template');
            }
          }}
          className="mb-4"
        >
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Last ned Excel-template
        </Button>
      </div>

      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
        <Input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="hidden"
          id="provision-file-upload"
        />
        <label htmlFor="provision-file-upload" className="cursor-pointer">
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">
            {file ? file.name : 'Velg fil for opplastning'}
          </p>
          <p className="text-sm text-muted-foreground">
            Klikk her eller dra og slipp fil
          </p>
        </label>
      </div>

      {file && (
        <Button onClick={handleProcessFile} className="w-full">
          Behandle fil
        </Button>
      )}
    </div>
  );

  const renderMappingStep = () => {
    if (!filePreview) return null;

    // Convert LEGAL_PROVISION_FIELDS to FieldDefinition format for SmartColumnMapper
    const fieldDefinitions: FieldDefinition[] = LEGAL_PROVISION_FIELDS.map((field, index) => ({
      field_key: field.key,
      field_label: field.label,
      field_description: `Felt for ${field.label.toLowerCase()}`,
      is_required: field.required,
      data_type: field.type === 'date' ? 'date' : 'text',
      sort_order: index,
      category: field.required ? 'Påkrevd' : 'Valgfri',
      example_values: field.aliases?.slice(0, 3) || []
    }));

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Kolonnemapping</h3>
            <p className="text-sm text-muted-foreground">
              Map CSV/Excel kolonner til juridiske feltdefinisjoner
            </p>
          </div>
          <Badge variant={requiredStatus.complete ? "default" : "destructive"}>
            {requiredStatus.mapped}/{requiredStatus.total} påkrevde felt
          </Badge>
        </div>

        <SmartColumnMapper
          fileName={file?.name || ''}
          headers={filePreview.headers}
          sampleRows={filePreview.rows.slice(0, 5)}
          fieldDefinitions={fieldDefinitions}
          suggestedMappings={suggestedMappings}
          mapping={columnMapping}
          validationErrors={validationErrors}
          requiredStatus={requiredStatus}
          onMappingChange={handleMappingChange}
        />

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStep('upload')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tilbake
          </Button>
          <Button 
            onClick={handlePreviewData}
            disabled={!requiredStatus.complete}
            className="flex-1"
          >
            Forhåndsvis data
          </Button>
        </div>
      </div>
    );
  };

  const renderPreviewStep = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Forhåndsvisning</h3>
          <p className="text-sm text-muted-foreground">
            {processedData.length} bestemmelser klare for import til <strong>{lawTitle}</strong>
          </p>
        </div>
        <Badge variant="default" className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Klar for import
        </Badge>
      </div>

      <div className="border rounded-lg p-4 bg-muted/30 max-h-96 overflow-y-auto">
        <div className="space-y-3">
          {processedData.slice(0, 5).map((row, index) => (
            <div key={index} className="border rounded p-3 bg-background">
              <div className="font-medium text-sm">
                {row.provision_number && `§ ${row.provision_number}`} {row.title}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Type: {row.provision_type} | ID: {row.provision_id}
              </div>
              {row.content && (
                <div className="text-xs mt-2 text-muted-foreground">
                  {row.content.substring(0, 100)}...
                </div>
              )}
            </div>
          ))}
          {processedData.length > 5 && (
            <div className="text-center text-sm text-muted-foreground">
              ... og {processedData.length - 5} flere bestemmelser
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep('mapping')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tilbake til mapping
        </Button>
        <Button onClick={handleImportData} className="flex-1">
          Importer {processedData.length} bestemmelser
        </Button>
      </div>
    </div>
  );

  const renderImportingStep = () => (
    <div className="text-center space-y-4">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-primary animate-pulse" />
      </div>
      <h3 className="text-lg font-semibold">Importerer bestemmelser...</h3>
      <p className="text-muted-foreground">
        Vennligst vent mens juridiske bestemmelser blir lagt til i databasen.
      </p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Juridisk Bestemmelse Opplaster</h1>
            <p className="text-muted-foreground">Lov: {lawTitle}</p>
          </div>
        </div>
        <Badge variant="outline">{lawIdentifier}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {step === 'upload' && 'Steg 1: Velg fil'}
              {step === 'mapping' && 'Steg 2: Map kolonner'}
              {step === 'preview' && 'Steg 3: Forhåndsvis'}
              {step === 'importing' && 'Importerer...'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {step === 'upload' && renderUploadStep()}
          {step === 'mapping' && renderMappingStep()}
          {step === 'preview' && renderPreviewStep()}
          {step === 'importing' && renderImportingStep()}
        </CardContent>
      </Card>
    </div>
  );
};