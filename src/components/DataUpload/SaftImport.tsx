
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { parseSaftFile, toCsvFiles, toXlsxBlob } from '@/utils/saft';
import { createZipFromParsed, persistParsed, uploadZipToStorage } from '@/utils/saftImport';
import SaftWorker from '@/workers/saft.worker?worker';
import { useParams } from 'react-router-dom';
import { useClientLookup } from '@/hooks/useClientLookup';

const SaftImport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [generateXlsx, setGenerateXlsx] = useState(true);
  const [generateCsv, setGenerateCsv] = useState(false);
  const [uploadToSupabase, setUploadToSupabase] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { clientId: clientIdParam, orgNumber } = useParams<{ clientId?: string; orgNumber?: string }>();
  const { data: lookup } = useClientLookup(orgNumber);
  const clientId = clientIdParam || lookup?.id || '';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!file) return;

    setIsProcessing(true);
    const baseName = file.name.replace(/\.(xml|zip)$/i, '');
    const threshold = 5 * 1024 * 1024; // 5MB

    try {
      console.log(`🚀 Starting SAF-T import for file: ${file.name} (${file.size} bytes)`);
      
      // Parse + lag ZIP (CSV + XLSX) – bruk worker for store filer
      let parsed: Awaited<ReturnType<typeof parseSaftFile>>;
      let zip: Blob;

      if (file.size > threshold && typeof Worker !== 'undefined') {
        console.log('📊 Using worker for large file processing');
        const worker = new SaftWorker();
        const result: { parsed: any; zip: Blob; error?: string } = await new Promise((resolve, reject) => {
          worker.onmessage = (e: MessageEvent<any>) => {
            worker.terminate();
            if (e.data.error) reject(new Error(e.data.error));
            else resolve({ parsed: e.data.parsed, zip: e.data.zip });
          };
          worker.postMessage({ file });
        });
        parsed = result.parsed;
        zip = result.zip;
      } else {
        console.log('🔄 Processing file directly (main thread)');
        parsed = await parseSaftFile(file);
        zip = await createZipFromParsed(parsed);
      }

      console.log('✅ Parsing completed:', {
        accounts: parsed.accounts?.length || 0,
        customers: parsed.customers?.length || 0,
        suppliers: parsed.suppliers?.length || 0,
        transactions: parsed.transactions?.length || 0,
        hasCustomerBalances: parsed.customers?.some(c => c.closing_balance_netto !== undefined),
        hasSupplierBalances: parsed.suppliers?.some(s => s.closing_balance_netto !== undefined)
      });

      // Lokal nedlasting av CSV-filer (valgfri)
      if (generateCsv) {
        const csvFiles = toCsvFiles(parsed);
        csvFiles.forEach(f => downloadBlob(f, f.name));
      }

      // Valgfri lokal XLSX-eksport
      if (generateXlsx) {
        const blob = await toXlsxBlob(parsed);
        const name = `${baseName}.xlsx`;
        downloadBlob(blob, name);
      }

      // Valgfri lagring til Supabase (DB + Storage)
      if (uploadToSupabase) {
        if (!clientId) {
          toast.error('Ingen klient-kontekst: kan ikke lagre til database uten valgt klient.');
        } else {
          console.log('💾 Starting database persistence...');
          const result = await persistParsed(clientId, parsed, file.name);
          console.log('✅ Persistence completed:', result);
          
          console.log('📦 Uploading ZIP to storage...');
          const storagePath = await uploadZipToStorage(clientId, zip, `${baseName}.zip`);
          console.log('✅ SAF-T ZIP uploaded to:', storagePath);
        }
      }

      toast.success('SAF-T fil behandlet' + (uploadToSupabase ? ' og lagret' : ''));
    } catch (err) {
      console.error('❌ SAF-T import error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Ukjent feil';
      toast.error(`Feil ved SAF-T import: ${errorMsg}`);
      
      // Log detailed error information for debugging
      if (err instanceof Error && err.stack) {
        console.error('Full error stack:', err.stack);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>SAF-T Import</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <input type="file" accept=".xml,.zip" onChange={handleFileChange} />
        <div className="flex items-center space-x-2">
          <Checkbox id="generate-xlsx" checked={generateXlsx} onCheckedChange={(v) => setGenerateXlsx(!!v)} />
          <Label htmlFor="generate-xlsx">Generér XLSX</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="generate-csv" checked={generateCsv} onCheckedChange={(v) => setGenerateCsv(!!v)} />
          <Label htmlFor="generate-csv">Last ned CSV (ett ark per datasett)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="upload-supabase"
            checked={uploadToSupabase}
            onCheckedChange={(v) => setUploadToSupabase(!!v)}
          />
          <Label htmlFor="upload-supabase">Last opp til Supabase (lagre rader og ZIP for valgt klient)</Label>
        </div>
        {uploadToSupabase && !clientId && (
          <div className="text-sm text-muted-foreground">
            Ingen klient funnet i URL – gå inn via en klient for å lagre til database.
          </div>
        )}
        <Button onClick={handleImport} disabled={!file || isProcessing}>
          {isProcessing ? 'Behandler...' : 'Parse'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SaftImport;
