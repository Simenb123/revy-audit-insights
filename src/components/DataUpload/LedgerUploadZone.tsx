
import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function LedgerUploadZone({ orgNumber }: { orgNumber: string }) {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');

  async function onFile(file: File) {
    if (!file) return;

    setStatus('uploading');
    const form = new FormData();
    form.append('file', file);
    form.append('orgNumber', orgNumber);

    try {
      const res = await fetch('/api/ledger/upload', { method: 'POST', body: form });
      if (!res.ok) throw new Error('Upload failed');
      
      setStatus('done');
      toast.success('Fil lastet opp');
    } catch (error) {
      setStatus('error');
      toast.error('Feil ved opplasting av fil');
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer?.files[0];
    if (file) onFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted transition-colors"
    >
      <input 
        type="file" 
        accept=".xlsx,.csv" 
        className="hidden" 
        onChange={handleFileSelect}
        id="ledger-file"
      />
      <label htmlFor="ledger-file" className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
        <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
        {status === 'idle' && <span className="text-muted-foreground">Slipp fil her eller klikk for å velge</span>}
        {status === 'uploading' && <span className="text-muted-foreground">Laster opp...</span>}
        {status === 'done' && <span className="text-green-600">✅ Fil lastet opp!</span>}
        {status === 'error' && <span className="text-red-600">🚫 Feil ved opplasting</span>}
      </label>
    </div>
  );
}
