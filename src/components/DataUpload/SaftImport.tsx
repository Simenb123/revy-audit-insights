import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { parseSaftFile, toCsvFiles, toXlsxBlob } from '@/utils/saft';

const SaftImport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [generateXlsx, setGenerateXlsx] = useState(false);

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

    try {
      const result = await parseSaftFile(file);
      const csvFiles = toCsvFiles(result);
      csvFiles.forEach(f => downloadBlob(f, f.name));

      if (generateXlsx) {
        const blob = await toXlsxBlob(result);
        const name = file.name.replace(/\.(xml|zip)$/i, '') + '.xlsx';
        downloadBlob(blob, name);
      }
      toast.success('SAF-T fil behandlet');
    } catch (err) {
      console.error(err);
      toast.error('Feil ved lesing av SAF-T fil');
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
        <Button onClick={handleImport} disabled={!file}>Parse</Button>
      </CardContent>
    </Card>
  );
};

export default SaftImport;
