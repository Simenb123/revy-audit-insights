import React, { useState } from 'react';
import { parseSaftFile, type SaftResult } from '@/utils/saftParser';
import SaftWorker from '@/workers/saft.worker?worker';
import { createZipFromParsed, persistParsed, uploadZipToStorage } from '@/utils/saftImport';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SaftImportProps {
  clientId: string;
}

const SaftImport: React.FC<SaftImportProps> = ({ clientId }) => {
  const [status, setStatus] = useState<string>('');

  const handleFile = async (file: File) => {
    setStatus('Behandler...');
    const threshold = 5 * 1024 * 1024; // 5MB
    let parsed: SaftResult;
    let zip: Blob;

    if (file.size > threshold && typeof Worker !== 'undefined') {
      const worker = new SaftWorker();
      const result: { parsed: SaftResult; zip: Blob } = await new Promise((resolve, reject) => {
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
      parsed = await parseSaftFile(file);
      zip = await createZipFromParsed(parsed);
    }

    try {
      await persistParsed(clientId, parsed);
      await uploadZipToStorage(clientId, zip, `${file.name.replace(/\.[^.]+$/, '')}.zip`);
      setStatus('Ferdig');
      toast.success('SAF-T fil importert');
    } catch (err: any) {
      console.error(err);
      setStatus('Feil ved import');
      toast.error(err.message || 'Import feilet');
    }
  };

  return (
    <div className="space-y-4">
      <input type="file" accept=".xml,.zip" onChange={e => e.target.files && handleFile(e.target.files[0])} />
      {status && <div>{status}</div>}
      <Button onClick={() => {}}>Oppdater</Button>
    </div>
  );
};

export default SaftImport;
