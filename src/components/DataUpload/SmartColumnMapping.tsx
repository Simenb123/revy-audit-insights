import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  validateDataTypes,
  FilePreview 
} from '@/utils/fileProcessing';
import { 
  FieldDefinition, 
  suggestEnhancedColumnMappings,
  saveColumnMappingHistory
} from '@/utils/fieldDefinitions';
import { Brain, CheckCircle, AlertTriangle, Zap, Info, TrendingUp } from 'lucide-react';

interface SmartColumnMappingProps {
  preview: FilePreview;
  fieldDefinitions: FieldDefinition[];
  clientId: string;
  fileType: string;
  fileName?: string;
  onComplete: (mapping: Record<string, string>) => void;
  onCancel: () => void;
}

export const SmartColumnMapping: React.FC<SmartColumnMappingProps> = ({
  preview,
  fieldDefinitions,
  clientId,
  fileType,
  fileName,
  onComplete,
  onCancel
}) => {
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [suggestedMappings, setSuggestedMappings] = useState<Array<{
    sourceColumn: string;
    targetField: string;
    confidence: number;
    reasoning: string;
  }>>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);

  // Auto-suggest mappings on component mount
  useEffect(() => {
    const loadSuggestions = async () => {
      setIsLoadingSuggestions(true);
      try {
        const suggestions = await suggestEnhancedColumnMappings(
          clientId,
          fileType,
          preview.headers,
          preview.rows,
          fileName
        );
        setSuggestedMappings(suggestions);
        
        // Auto-apply high-confidence suggestions
        const autoMapping: Record<string, string> = {};
        suggestions.forEach(suggestion => {
          if (suggestion.confidence > 0.8) {
            autoMapping[suggestion.sourceColumn] = suggestion.targetField;
          }
        });
        setMapping(autoMapping);
      } catch (error) {
        console.error('Error loading suggestions:', error);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    loadSuggestions();
  }, [clientId, fileType, preview.headers, preview.rows, fileName]);

  // Validate data types when mapping changes
  useEffect(() => {
    if (Object.keys(mapping).length === 0) return;
    
    setIsValidating(true);
    const errors: Record<string, string[]> = {};
    
    Object.entries(mapping).forEach(([sourceColumn, targetField]) => {
      if (targetField === 'none') return;
      
      const field = fieldDefinitions.find(f => f.field_key === targetField);
      if (!field) return;
      
      const columnIndex = preview.headers.indexOf(sourceColumn);
      if (columnIndex === -1) return;
      
      const validation = validateDataTypes(preview.rows, columnIndex, field.data_type);
      if (!validation.valid) {
        errors[sourceColumn] = validation.errors;
      }
    });
    
    setValidationErrors(errors);
    setIsValidating(false);
  }, [mapping, preview, fieldDefinitions]);

  const handleMappingChange = (sourceColumn: string, targetField: string) => {
    setMapping(prev => ({
      ...prev,
      [sourceColumn]: targetField === 'none' ? '' : targetField
    }));
  };

  const applyAllSuggestions = () => {
    const newMapping: Record<string, string> = {};
    suggestedMappings.forEach(suggestion => {
      newMapping[suggestion.sourceColumn] = suggestion.targetField;
    });
    setMapping(newMapping);
  };

  const getMappedField = (fieldKey: string) => 
    Object.keys(mapping).find(col => mapping[col] === fieldKey);

  const getRequiredFieldsStatus = () => {
    const requiredFields = fieldDefinitions.filter(f => f.is_required);
    const mappedRequired = requiredFields.filter(f => getMappedField(f.field_key));
    return {
      total: requiredFields.length,
      mapped: mappedRequired.length,
      complete: mappedRequired.length === requiredFields.length
    };
  };

  const getSuggestionForColumn = (column: string) =>
    suggestedMappings.find(s => s.sourceColumn === column);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-500';
    if (confidence >= 0.7) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const requiredStatus = getRequiredFieldsStatus();
  const completionPercentage = (requiredStatus.mapped / requiredStatus.total) * 100;

  return (
    <div className="space-y-4">
      {/* Header with auto-suggestion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Smart kolonnemapping
          </CardTitle>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Progress value={completionPercentage} className="w-32" />
                <span className="text-sm text-muted-foreground">
                  {requiredStatus.mapped}/{requiredStatus.total} påkrevde felt
                </span>
              </div>
              {suggestedMappings.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={applyAllSuggestions}
                  className="flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Bruk alle forslag
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Column mapping interface */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {preview.headers.map((header, index) => {
              const suggestion = getSuggestionForColumn(header);
              const currentMapping = mapping[header] || '';
              const hasError = validationErrors[header]?.length > 0;
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center gap-4">
                    {/* Source column */}
                    <div className="w-1/3">
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {header || `Kolonne ${index + 1}`}
                        </code>
                        {suggestion && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge 
                                  variant="secondary" 
                                  className={`text-xs ${getConfidenceColor(suggestion.confidence)} text-white cursor-help`}
                                >
                                  {Math.round(suggestion.confidence * 100)}%
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-64">
                                <p className="text-sm">{suggestion.reasoning}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      {/* Sample data */}
                      <div className="text-xs text-muted-foreground mt-1">
                        {preview.rows.slice(0, 3).map((row, i) => (
                          <div key={i} className="truncate max-w-32">
                            {row[index] || '(tom)'}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="w-8 text-center text-muted-foreground">
                      →
                    </div>

                    {/* Target field selection */}
                    <div className="flex-1">
                      <Select
                        value={currentMapping}
                        onValueChange={(value) => handleMappingChange(header, value)}
                      >
                        <SelectTrigger className={hasError ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Velg felt" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Ignorer kolonne</SelectItem>
                          {fieldDefinitions.map(field => (
                            <SelectItem 
                              key={field.field_key} 
                              value={field.field_key}
                              disabled={getMappedField(field.field_key) === header ? false : !!getMappedField(field.field_key)}
                            >
                              <div className="flex items-center gap-2">
                                {field.field_label}
                                {field.is_required && <span className="text-destructive">*</span>}
                                <Badge variant="outline" className="ml-auto">
                                  {field.data_type}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {/* Validation errors */}
                      {hasError && (
                        <Alert className="mt-2">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            {validationErrors[header].join(', ')}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Avbryt
        </Button>
        <Button 
          onClick={async () => {
            // Save mapping history before completing
            const mappingPromises = Object.entries(mapping).map(([sourceColumn, targetField]) => {
              const suggestion = getSuggestionForColumn(sourceColumn);
              return saveColumnMappingHistory(
                clientId,
                fileType,
                sourceColumn,
                targetField,
                suggestion?.confidence || 0.5,
                suggestion?.confidence < 0.8, // Manual override if low confidence
                fileName
              );
            });
            await Promise.all(mappingPromises);
            onComplete(mapping);
          }}
          disabled={!requiredStatus.complete || isValidating}
          className="flex items-center gap-2"
        >
          {requiredStatus.complete ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          {isValidating ? 'Validerer...' : 'Fortsett'}
        </Button>
      </div>
    </div>
  );
};