import React from 'react';
import { Button } from '@/components/ui/button';

interface ActionDrawerFooterProps {
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
}

const ActionDrawerFooter: React.FC<ActionDrawerFooterProps> = ({ onCancel, onSave, isSaving }) => {
  return (
    <div className="px-6 py-4 border-t flex justify-end gap-2">
      <Button variant="outline" onClick={onCancel}>Avbryt</Button>
      <Button onClick={onSave} disabled={isSaving}>
        {isSaving ? 'Lagrer...' : 'Lagre endringer'}
      </Button>
    </div>
  );
};

export default ActionDrawerFooter;
