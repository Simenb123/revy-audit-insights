import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface SaveReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, description?: string) => Promise<void>;
  loading?: boolean;
}

export function SaveReportDialog({ open, onOpenChange, onSave, loading }: SaveReportDialogProps) {
  const [reportName, setReportName] = useState('');
  const [description, setDescription] = useState('');

  const handleSave = async () => {
    if (!reportName.trim()) return;
    
    try {
      await onSave(reportName.trim(), description.trim() || undefined);
      setReportName('');
      setDescription('');
      onOpenChange(false);
    } catch (error) {
      // Error is handled by parent component
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setReportName('');
        setDescription('');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Lagre rapport</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="report-name">Rapportnavn *</Label>
            <Input
              id="report-name"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="Skriv inn rapportnavn..."
              disabled={loading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Valgfri beskrivelse av rapporten..."
              disabled={loading}
              rows={3}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Avbryt
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!reportName.trim() || loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Lagre
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}