import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface JsonEditorProps {
  value: string;
  error: string | null;
  show: boolean;
  onToggleShow: () => void;
  onChange: (value: string) => void;
}

const JsonEditor: React.FC<JsonEditorProps> = ({ value, error, show, onToggleShow, onChange }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="wp">Arbeidsnotat-data (JSON)</Label>
        <div className="flex items-center gap-2">
          {error ? (
            <span className="flex items-center gap-1 text-destructive text-xs"><AlertTriangle className="h-3 w-3" /> {error}</span>
          ) : (
            <span className="flex items-center gap-1 text-muted-foreground text-xs"><CheckCircle2 className="h-3 w-3" /> Gyldig</span>
          )}
          <Button variant="outline" size="sm" onClick={onToggleShow}>
            {show ? 'Skjul JSON' : 'Vis JSON'}
          </Button>
        </div>
      </div>
      {show && (
        <Textarea id="wp" value={value} onChange={(e) => onChange(e.target.value)} rows={16} className="font-mono text-xs" />
      )}
    </div>
  );
};

export default JsonEditor;
