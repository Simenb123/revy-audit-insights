
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SubjectArea } from '@/hooks/knowledge/useSubjectAreas';

interface HierarchicalSubjectAreaSelectorProps {
  subjectAreas: SubjectArea[];
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  allowMultiple?: boolean;
}

interface SubjectAreaNodeProps {
  area: SubjectArea;
  level: number;
  selectedIds: string[];
  onToggle: (id: string, checked: boolean) => void;
  allowMultiple: boolean;
}

const SubjectAreaNode: React.FC<SubjectAreaNodeProps> = ({
  area,
  level,
  selectedIds,
  onToggle,
  allowMultiple
}) => {
  const [isExpanded, setIsExpanded] = React.useState(level === 0);
  const hasChildren = area.children && area.children.length > 0;
  const isSelected = selectedIds.includes(area.id);
  const indentLevel = level * 20;

  return (
    <div className="w-full">
      <div 
        className="flex items-center gap-2 py-1 hover:bg-accent/50 rounded px-2"
        style={{ paddingLeft: `${indentLevel + 8}px` }}
      >
        {hasChildren && (
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-auto w-4"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </Button>
        )}
        
        {!hasChildren && <div className="w-4" />}
        
        <Checkbox
          id={`area-${area.id}`}
          checked={isSelected}
          onCheckedChange={(checked) => onToggle(area.id, Boolean(checked))}
        />
        
        <Label
          htmlFor={`area-${area.id}`}
          className="text-sm font-normal cursor-pointer flex items-center gap-2 flex-1"
        >
          <div 
            className="w-3 h-3 rounded" 
            style={{ backgroundColor: area.color }}
          />
          <span>{area.display_name}</span>
          {area.description && (
            <span className="text-xs text-muted-foreground">
              ({area.description})
            </span>
          )}
        </Label>
      </div>
      
      {hasChildren && isExpanded && (
        <div className="ml-2">
          {area.children!.map((child) => (
            <SubjectAreaNode
              key={child.id}
              area={child}
              level={level + 1}
              selectedIds={selectedIds}
              onToggle={onToggle}
              allowMultiple={allowMultiple}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const HierarchicalSubjectAreaSelector: React.FC<HierarchicalSubjectAreaSelectorProps> = ({
  subjectAreas,
  selectedIds,
  onSelectionChange,
  allowMultiple = true
}) => {
  const handleToggle = (id: string, checked: boolean) => {
    if (!allowMultiple) {
      onSelectionChange(checked ? [id] : []);
      return;
    }

    if (checked) {
      onSelectionChange([...selectedIds, id]);
    } else {
      onSelectionChange(selectedIds.filter(selectedId => selectedId !== id));
    }
  };

  return (
    <div className="space-y-1 max-h-96 overflow-y-auto border rounded-md p-2">
      {subjectAreas.map((area) => (
        <SubjectAreaNode
          key={area.id}
          area={area}
          level={0}
          selectedIds={selectedIds}
          onToggle={handleToggle}
          allowMultiple={allowMultiple}
        />
      ))}
    </div>
  );
};

export default HierarchicalSubjectAreaSelector;
