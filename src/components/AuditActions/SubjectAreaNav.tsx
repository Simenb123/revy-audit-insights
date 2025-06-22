
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSubjectAreas } from '@/hooks/knowledge/useSubjectAreas';
import { Loader2 } from 'lucide-react';

interface SubjectAreaNavProps {
  selectedArea: string;
  onAreaSelect: (area: string) => void;
  actionCounts?: Record<string, number>;
}

const SubjectAreaNav = ({ selectedArea, onAreaSelect, actionCounts = {} }: SubjectAreaNavProps) => {
  const { data: subjectAreas, isLoading } = useSubjectAreas();

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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {subjectAreas.map((area) => {
        const count = actionCounts[area.name] || 0;
        const isSelected = selectedArea === area.name;
        
        return (
          <Button
            key={area.id}
            variant={isSelected ? "default" : "outline"}
            onClick={() => onAreaSelect(area.name)}
            className="flex flex-col items-center gap-2 h-auto p-4 text-center"
            style={{
              backgroundColor: isSelected ? area.color : undefined,
              borderColor: area.color,
              color: isSelected ? 'white' : area.color
            }}
          >
            <div className="flex items-center gap-2">
              {area.icon && (
                <span className="text-lg">{area.icon}</span>
              )}
              <span className="font-medium text-sm">{area.display_name}</span>
            </div>
            {count > 0 && (
              <Badge 
                variant={isSelected ? "secondary" : "default"}
                className="text-xs"
              >
                {count} handlinger
              </Badge>
            )}
          </Button>
        );
      })}
    </div>
  );
};

export default SubjectAreaNav;
