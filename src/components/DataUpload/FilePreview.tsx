import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FilePreview as FilePreviewType, FieldDefinition, ColumnMapping, suggestColumnMappings } from '@/utils/fileProcessing';
import { FileText, Database, AlertCircle, Brain, CheckCircle, Zap } from 'lucide-react';

interface FilePreviewProps {
  preview: FilePreviewType;
  fileName: string;
  fieldDefinitions?: FieldDefinition[];
  onMappingComplete?: (mapping: Record<string, string>) => void;
  showMapping?: boolean;
}

export const FilePreview: React.FC<FilePreviewProps> = ({ 
  preview, 
  fileName, 
  fieldDefinitions = [], 
  onMappingComplete,
  showMapping = false 
}) => {
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [suggestedMappings, setSuggestedMappings] = useState<ColumnMapping[]>([]);

  // Auto-suggest mappings when field definitions are provided
  useEffect(() => {
    if (fieldDefinitions.length > 0) {
      const suggestions = suggestColumnMappings(preview.headers, fieldDefinitions);
      setSuggestedMappings(suggestions);
      
      // Auto-apply high-confidence suggestions
      const autoMapping: Record<string, string> = {};
      suggestions.forEach(suggestion => {
        if (suggestion.confidence > 0.8) {
          autoMapping[suggestion.sourceColumn] = suggestion.targetField;
        }
      });
      setMapping(autoMapping);
    }
  }, [preview.headers, fieldDefinitions]);

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

  const getSuggestionForColumn = (column: string) =>
    suggestedMappings.find(s => s.sourceColumn === column);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-emerald-500';
    if (confidence >= 0.7) return 'bg-amber-500';
    return 'bg-orange-500';
  };

  const getMappedField = (fieldKey: string) => 
    Object.keys(mapping).find(col => mapping[col] === fieldKey);

  const getRequiredFieldsStatus = () => {
    const requiredFields = fieldDefinitions.filter(f => f.required);
    const mappedRequired = requiredFields.filter(f => getMappedField(f.key));
    return {
      total: requiredFields.length,
      mapped: mappedRequired.length,
      complete: mappedRequired.length === requiredFields.length
    };
  };

  const requiredStatus = getRequiredFieldsStatus();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Forhåndsvisning: {fileName}
            {showMapping && (
              <Badge variant="secondary" className="ml-auto">
                <Brain className="w-3 h-3 mr-1" />
                Smart mapping aktiv
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-2 flex-wrap items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary">
                <Database className="w-3 h-3 mr-1" />
                {preview.totalRows} rader
              </Badge>
              <Badge variant="secondary">
                {preview.headers.length} kolonner
              </Badge>
              {preview.detectedDelimiter && (
                <Badge variant="outline">
                  Separator: "{preview.detectedDelimiter}"
                </Badge>
              )}
              {showMapping && requiredStatus.total > 0 && (
                <Badge variant={requiredStatus.complete ? "default" : "destructive"}>
                  {requiredStatus.mapped}/{requiredStatus.total} påkrevde felt
                </Badge>
              )}
            </div>
            {showMapping && suggestedMappings.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={applyAllSuggestions}
                  className="flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Bruk alle forslag
                </Button>
                {onMappingComplete && (
                  <Button
                    size="sm"
                    onClick={() => onMappingComplete(mapping)}
                    disabled={!requiredStatus.complete}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Fortsett
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                {showMapping && fieldDefinitions.length > 0 && (
                  <tr className="bg-primary/10">
                    <th className="border border-border px-2 py-1 text-left text-xs font-medium">
                      Standard felt
                    </th>
                    {preview.headers.map((header, index) => {
                      const suggestion = getSuggestionForColumn(header);
                      const currentMapping = mapping[header];
                      const mappedField = currentMapping ? fieldDefinitions.find(f => f.key === currentMapping) : null;
                      
                      return (
                        <th key={index} className="border border-border px-2 py-1 text-left">
                          <Select
                            value={currentMapping || ''}
                            onValueChange={(value) => handleMappingChange(header, value)}
                          >
                            <SelectTrigger className="h-7 text-xs border-0 bg-transparent">
                              <SelectValue placeholder="Velg felt">
                                {mappedField && (
                                  <div className="flex items-center gap-1">
                                    <span className="truncate">{mappedField.label}</span>
                                    {suggestion && (
                                      <Badge 
                                        variant="secondary" 
                                        className={`text-xs ${getConfidenceColor(suggestion.confidence)} text-white`}
                                      >
                                        {Math.round(suggestion.confidence * 100)}%
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Ignorer</SelectItem>
                              {fieldDefinitions.map(field => (
                                <SelectItem 
                                  key={field.key} 
                                  value={field.key}
                                  disabled={getMappedField(field.key) === header ? false : !!getMappedField(field.key)}
                                >
                                  <div className="flex items-center gap-2">
                                    {field.label}
                                    {field.required && <span className="text-destructive">*</span>}
                                    <Badge variant="outline" className="ml-auto text-xs">
                                      {field.type}
                                    </Badge>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </th>
                      );
                    })}
                  </tr>
                )}
                <tr className="bg-muted/50">
                  <th className="border border-border px-2 py-1 text-left text-xs font-medium">
                    #
                  </th>
                  {preview.headers.map((header, index) => (
                    <th key={index} className="border border-border px-2 py-1 text-left text-xs font-medium">
                      {header || `Kolonne ${index + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-muted/25">
                    <td className="border border-border px-2 py-1 text-xs text-muted-foreground">
                      {rowIndex + 1}
                    </td>
                    {preview.headers.map((_, colIndex) => (
                      <td key={colIndex} className="border border-border px-2 py-1 text-xs">
                        {row[colIndex] || ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {preview.totalRows > preview.rows.length && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="w-4 h-4" />
              Viser første {preview.rows.length} av {preview.totalRows} rader
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};