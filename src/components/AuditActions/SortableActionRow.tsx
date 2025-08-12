import React from 'react';
import { GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ActionRowBody from './ActionRowBody';
import type { ClientAuditAction } from '@/types/audit-actions';

interface Props {
  action: ClientAuditAction;
  selected: boolean;
  onToggle: (id: string) => void;
  onEdit: (action: ClientAuditAction) => void;
}

const SortableActionRow: React.FC<Props> = ({ action, selected, onToggle, onEdit }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: action.id });
  const style = { transform: CSS.Transform.toString(transform), transition } as React.CSSProperties;

  return (
    <div ref={setNodeRef} style={style}>
      <ActionRowBody
        action={action}
        selected={selected}
        onToggle={onToggle}
        onEdit={onEdit}
        dragHandle={
          <button
            className="p-1 text-muted-foreground hover:text-foreground cursor-grab"
            {...attributes}
            {...listeners}
            aria-label="Dra for å sortere"
            title="Dra for å sortere"
          >
            <GripVertical size={16} />
          </button>
        }
      />
    </div>
  );
};

export default SortableActionRow;
