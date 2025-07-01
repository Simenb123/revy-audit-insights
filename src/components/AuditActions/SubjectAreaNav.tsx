
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSubjectAreasHierarchical } from '@/hooks/knowledge/useSubjectAreas';
import { Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import type { SubjectArea } from '@/types/classification';

interface SubjectAreaNavProps {
  selectedArea: string;
  onAreaSelect: (area: string) => void;
  actionCounts?: Record<string, number>;
}

interface SubjectAreaNodeProps {
  area: SubjectArea;
  selectedArea: string;
  onAreaSelect: (areaId: string) => void;
  actionCounts: Record<string, number>;
  level?: number;
}

const SubjectAreaNode: React.FC<SubjectAreaNodeProps> = ({
  area,
  selectedArea,
  onAreaSelect,
  actionCounts,
  level = 0
}) => {
  const [isExpanded, setIsExpanded] = React.useState(level === 0);
  const hasChildren = area.children && area.children.length > 0;
  const count = actionCounts[area.id] || 0;
  const isSelected = selectedArea === area.id;
  
  const childrenCount = hasChildren ? 
    area.children.reduce((sum: number, child: SubjectArea) => 
      sum + (actionCounts[child.id] || 0), 0
    ) : 0;
  
  const totalCount = count + childrenCount;

  return (
    <div className="w-full">
      <Button
        variant={isSelected ? "default" : "outline"}
        onClick={() => onAreaSelect(area.id)}
        className="w-full justify-between text-left h-auto p-3"
        style={{
          backgroundColor: isSelected ? area.color : undefined,
          borderColor: area.color,
          color: isSelected ? 'white' : area.color,
          marginLeft: `${level * 16}px`
        }}
      >
        <div className="flex items-center gap-2">
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-auto w-4"
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
          
          {area.icon && (
            <span className="text-lg">{area.icon}</span>
          )}
          <span className="font-medium text-sm">{area.display_name}</span>
        </div>
        
        {totalCount > 0 && (
          <Badge 
            variant={isSelected ? "secondary" : "default"}
            className="text-xs"
          >
            {totalCount} handlinger
          </Badge>
        )}
      </Button>
      
      {hasChildren && isExpanded && (
        <div className="mt-2 space-y-2">
          {area.children.map((child: SubjectArea) => (
            <SubjectAreaNode
              key={child.id}
              area={child}
              selectedArea={selectedArea}
              onAreaSelect={onAreaSelect}
              actionCounts={actionCounts}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const SubjectAreaNav = ({ selectedArea, onAreaSelect, actionCounts = {} }: SubjectAreaNavProps) => {
  const { data: subjectAreas, isLoading } = useSubjectAreasHierarchical();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Laster fagområder...</span>
      </div>
    );
  }

  if (!subjectAreas?.length) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Ingen fagområder tilgjengelige
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {subjectAreas.map((area) => (
        <SubjectAreaNode
          key={area.id}
          area={area}
          selectedArea={selectedArea}
          onAreaSelect={onAreaSelect}
          actionCounts={actionCounts}
        />
      ))}
    </div>
  );
};

export default SubjectAreaNav;
