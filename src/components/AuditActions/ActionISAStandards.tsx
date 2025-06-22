
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen } from 'lucide-react';
import { AuditActionISAMapping } from '@/types/enhanced-audit-actions';

interface ActionISAStandardsProps {
  actionTemplateId: string;
  mappings: AuditActionISAMapping[];
  editable?: boolean;
}

const ActionISAStandards = ({ actionTemplateId, mappings, editable = false }: ActionISAStandardsProps) => {
  const getRelevanceBadgeColor = (level: string) => {
    switch (level) {
      case 'primary': return 'default';
      case 'secondary': return 'secondary';
      case 'reference': return 'outline';
      default: return 'outline';
    }
  };

  const getRelevanceLabel = (level: string) => {
    switch (level) {
      case 'primary': return 'Primær';
      case 'secondary': return 'Sekundær';
      case 'reference': return 'Referanse';
      default: return level;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">ISA-standarder</h3>
        {editable && (
          <Button size="sm" variant="outline">
            <Plus size={16} className="mr-1" />
            Legg til ISA
          </Button>
        )}
      </div>

      {mappings.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <BookOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="mb-4">Ingen ISA-standarder koblet til denne handlingen.</p>
            {editable && (
              <Button variant="outline">
                <Plus size={16} className="mr-2" />
                Legg til første ISA-standard
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {mappings.map((mapping) => (
            <Card key={mapping.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">
                        {mapping.isa_standard?.isa_number} - {mapping.isa_standard?.title}
                      </h4>
                      <Badge variant={getRelevanceBadgeColor(mapping.relevance_level)}>
                        {getRelevanceLabel(mapping.relevance_level)}
                      </Badge>
                    </div>
                    
                    {mapping.isa_standard?.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {mapping.isa_standard.description}
                      </p>
                    )}
                    
                    {mapping.isa_standard?.category && (
                      <Badge variant="outline" className="text-xs">
                        {mapping.isa_standard.category}
                      </Badge>
                    )}
                  </div>
                  
                  {editable && (
                    <Button variant="ghost" size="sm">
                      Fjern
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActionISAStandards;
