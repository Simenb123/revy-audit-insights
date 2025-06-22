
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Clock } from 'lucide-react';
import { AuditActionDocumentMapping } from '@/types/enhanced-audit-actions';

interface ActionDocumentRequirementsProps {
  actionTemplateId: string;
  mappings: AuditActionDocumentMapping[];
  editable?: boolean;
}

const ActionDocumentRequirements = ({ 
  actionTemplateId, 
  mappings, 
  editable = false 
}: ActionDocumentRequirementsProps) => {
  const getTimingBadgeColor = (timing: string) => {
    switch (timing) {
      case 'before': return 'secondary';
      case 'during': return 'default';
      case 'after': return 'outline';
      default: return 'outline';
    }
  };

  const getTimingLabel = (timing: string) => {
    switch (timing) {
      case 'before': return 'Før';
      case 'during': return 'Under';
      case 'after': return 'Etter';
      default: return timing;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Dokumentkrav</h3>
        {editable && (
          <Button size="sm" variant="outline">
            <Plus size={16} className="mr-1" />
            Legg til dokument
          </Button>
        )}
      </div>

      {mappings.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="mb-4">Ingen dokumentkrav definert for denne handlingen.</p>
            {editable && (
              <Button variant="outline">
                <Plus size={16} className="mr-2" />
                Legg til første dokumentkrav
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
                        {mapping.document_requirement?.name}
                      </h4>
                      <Badge variant={mapping.is_mandatory ? 'destructive' : 'secondary'}>
                        {mapping.is_mandatory ? 'Obligatorisk' : 'Valgfri'}
                      </Badge>
                      <Badge 
                        variant={getTimingBadgeColor(mapping.timing)} 
                        className="gap-1"
                      >
                        <Clock size={12} />
                        {getTimingLabel(mapping.timing)}
                      </Badge>
                    </div>
                    
                    {mapping.document_requirement?.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {mapping.document_requirement.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">
                        {mapping.document_requirement?.document_type}
                      </Badge>
                      {mapping.document_requirement?.subject_area && (
                        <Badge variant="outline" className="text-xs">
                          {mapping.document_requirement.subject_area}
                        </Badge>
                      )}
                    </div>
                    
                    {mapping.document_requirement?.file_pattern_hints && 
                     mapping.document_requirement.file_pattern_hints.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground mb-1">Filnavn-hints:</p>
                        <div className="flex flex-wrap gap-1">
                          {mapping.document_requirement.file_pattern_hints.map((hint, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {hint}
                            </Badge>
                          ))}
                        </div>
                      </div>
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

export default ActionDocumentRequirements;
