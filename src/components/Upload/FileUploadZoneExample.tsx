import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import FileUploadZone from './FileUploadZone';
import { useFileProcessor } from '@/hooks/upload/useFileProcessor';
import { TRIAL_BALANCE_FIELDS } from '@/utils/fileProcessing';
import StandardDataTable, { StandardDataTableColumn } from '@/components/ui/standard-data-table';

/**
 * FileUploadZoneExample - Eksempel på hvordan bruke FileUploadZone og useFileProcessor
 * 
 * Dette er en referanse-implementering som viser:
 * 1. Hvordan sette opp FileUploadZone
 * 2. Hvordan bruke useFileProcessor hook
 * 3. Hvordan håndtere preview og mapping
 * 
 * DETTE ER EN DEMO - IKKE BRUK DIREKTE I PRODUKSJON
 * Kopier og tilpass til din use case.
 */

const FileUploadZoneExample: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { processFile, preview, isProcessing, reset } = useFileProcessor();

  const handleFilesSelected = async (files: File[]) => {
    const file = files[0];
    setSelectedFile(file);
    
    // Process the file and get preview
    await processFile(file, TRIAL_BALANCE_FIELDS);
  };

  const handleReset = () => {
    setSelectedFile(null);
    reset();
  };

  // Define columns for preview table
  const previewColumns: StandardDataTableColumn<any>[] = preview?.headers.map(header => ({
    key: header,
    header: header,
    accessor: header,
  })) || [];

  // Convert preview rows to objects for table
  const previewData = preview?.rows.map(row => {
    const obj: any = {};
    preview.headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  }) || [];

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          FileUploadZone Eksempel
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {!selectedFile ? (
          <FileUploadZone
            onFilesSelected={handleFilesSelected}
            acceptedFileTypes={['.xlsx', '.xls', '.csv']}
            maxFileSize={50_000_000} // 50MB
            multiple={false}
            helpText="Last opp en prøvebalanse-fil for å se preview"
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <Button onClick={handleReset} variant="outline">
                Last opp ny fil
              </Button>
            </div>

            {isProcessing && (
              <div className="text-center py-8">
                <p className="text-gray-600">Prosesserer fil...</p>
              </div>
            )}

            {preview && !isProcessing && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Fil-informasjon</h3>
                  <ul className="text-sm space-y-1">
                    <li>Totalt antall rader: {preview.totalRows}</li>
                    <li>Header-rad: Rad {preview.headerRowIndex + 1}</li>
                    <li>Antall kolonner: {preview.headers.length}</li>
                    <li>Delimiter: {preview.detectedDelimiter || 'N/A'}</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Data Preview (første 10 rader)</h3>
                  <StandardDataTable
                    title="Data Preview"
                    data={previewData}
                    columns={previewColumns}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Eksempel-komponent</h4>
          <p className="text-sm text-yellow-800">
            Dette er en demo av FileUploadZone og useFileProcessor. 
            Kopier og tilpass denne koden til din egen use case.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FileUploadZoneExample;
