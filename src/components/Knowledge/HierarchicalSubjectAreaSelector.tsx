import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown, ChevronRight } from 'lucide-react';
import type { SubjectArea } from '@/types/classification';

interface HierarchicalSubjectAreaSelectorProps {
  subjectAreas: SubjectArea[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  allowMultiple?: boolean;
}

const HierarchicalSubjectAreaSelector: React.FC<HierarchicalSubjectAreaSelectorProps> = ({
  subjectAreas,
  selectedIds,
  onSelectionChange,
  allowMultiple = true
}) => {
  return (
    <div className="space-y-2">
      {subjectAreas.map((area) => (
        <SubjectAreaNode
          key={area.id}
          area={area}
          selectedIds={selectedIds}
          onSelectionChange={onSelectionChange}
          allowMultiple={allowMultiple}
          level={0}
        />
      ))}
    </div>
  );
};

const SubjectAreaNode: React.FC<{
  area: SubjectArea;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  allowMultiple: boolean;
  level: number;
}> = ({ area, selectedIds, onSelectionChange, allowMultiple, level }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const isSelected = selectedIds.includes(area.id);
  const hasChildren = area.children && area.children.length > 0;

  const handleToggle = () => {
    if (allowMultiple) {
      if (isSelected) {
        onSelectionChange(selectedIds.filter(id => id !== area.id));
      } else {
        onSelectionChange([...selectedIds, area.id]);
      }
    } else {
      onSelectionChange(isSelected ? [] : [area.id]);
    }
  };

  return (
    <div className="w-full">
      <div 
        className={`flex items-center p-2 rounded cursor-pointer hover:bg-gray-50 ${
          isSelected ? 'bg-blue-50 border border-blue-200' : ''
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleToggle}
      >
        {hasChildren && (
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-auto w-4 mr-2"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </Button>
        )}
        
        <div 
          className="w-4 h-4 rounded-full mr-2"
          style={{ backgroundColor: area.color }}
        />
        
        {area.icon && (
          <span className="text-sm mr-2">{area.icon}</span>
        )}
        
        <span className="flex-1 text-sm">{area.display_name}</span>
        
        {isSelected && <Check className="w-4 h-4 text-blue-600" />}
      </div>
      
      {hasChildren && isExpanded && (
        <div>
          {area.children!.map((child: SubjectArea) => (
            <SubjectAreaNode
              key={child.id}
              area={child}
              selectedIds={selectedIds}
              onSelectionChange={onSelectionChange}
              allowMultiple={allowMultiple}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HierarchicalSubjectAreaSelector;
