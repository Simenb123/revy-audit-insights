import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface ActionDetailsFormProps {
  name: string;
  description: string;
  procedures: string;
  dueDate?: string;
  workNotes: string;
  onNameChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onProceduresChange: (v: string) => void;
  onDueDateChange: (v: string) => void;
  onWorkNotesChange: (v: string) => void;
}

const ActionDetailsForm: React.FC<ActionDetailsFormProps> = ({
  name,
  description,
  procedures,
  dueDate,
  workNotes,
  onNameChange,
  onDescriptionChange,
  onProceduresChange,
  onDueDateChange,
  onWorkNotesChange,
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Tittel</Label>
        <Input id="name" value={name} onChange={(e) => onNameChange(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="desc">Beskrivelse</Label>
        <Textarea id="desc" value={description} onChange={(e) => onDescriptionChange(e.target.value)} rows={4} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="proc">Prosedyrer</Label>
        <Textarea id="proc" value={procedures} onChange={(e) => onProceduresChange(e.target.value)} rows={8} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="due">Forfallsdato</Label>
        <Input id="due" type="date" value={dueDate || ''} onChange={(e) => onDueDateChange(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Arbeidsnotater</Label>
        <Textarea id="notes" value={workNotes} onChange={(e) => onWorkNotesChange(e.target.value)} rows={4} />
      </div>
    </div>
  );
};

export default ActionDetailsForm;
