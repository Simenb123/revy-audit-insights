import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, CheckCircle, AlertCircle, Brain, Zap } from 'lucide-react';
import { FilePreview, suggestColumnMappings, ColumnMapping, FieldDefinition } from '@/utils/fileProcessing';
import { getFieldDefinitions, saveColumnMappingHistory, getHistoricalMappings } from '@/utils/fieldDefinitions';

interface EnhancedPreviewProps {
  preview: FilePreview;
  fileName: string;
  clientId: string;
  fileType: 'trial_balance' | 'general_ledger' | 'chart_of_accounts';
  onMappingComplete: (mappings: Record<string, string>) => void;
  onCancel: () => void;
}

const EnhancedPreview: React.FC<EnhancedPreviewProps> = ({
  preview,
  fileName,
  clientId,
  fileType,
  onMappingComplete,
  onCancel
}) => {
  const [fieldDefinitions, setFieldDefinitions] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [suggestedMappings, setSuggestedMappings] = useState<ColumnMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const initializeMapping = async () => {
      setIsLoading(true);
      
      // Load field definitions from database
      const fields = await getFieldDefinitions(fileType);
      setFieldDefinitions(fields);

      // Get historical mappings for this client and file type
      const historicalMappings = await getHistoricalMappings(clientId, fileType);

      // Convert database fields to FieldDefinition format for AI suggestions
      const convertedFields: FieldDefinition[] = fields.map(f => ({
        key: f.field_key,
        label: f.field_label,
        required: f.is_required,
        type: f.data_type as 'text' | 'number' | 'date',
        aliases: f.aliases || []
      }));

      // Generate AI suggestions with enhanced algorithm
      const suggestions = suggestColumnMappings(
        preview.headers,
        convertedFields,
        preview.rows.slice(0, 10), // Sample data for content validation
        historicalMappings
      );

      setSuggestedMappings(suggestions);

      // Auto-apply high-confidence suggestions (>= 0.8)
      const autoMapping: Record<string, string> = {};
      suggestions.forEach(suggestion => {
        if (suggestion.confidence >= 0.8) {
          autoMapping[suggestion.sourceColumn] = suggestion.targetField;
        }
      });
      setMapping(autoMapping);
      setIsLoading(false);
    };

    if (clientId && preview.headers.length > 0) {
      initializeMapping();
    }
  }, [preview, clientId, fileType]);

  const handleMappingChange = (sourceColumn: string, targetField: string) => {
    const newMapping = { ...mapping };
    if (targetField === '' || targetField === 'none') {
      delete newMapping[sourceColumn];
    } else {
      newMapping[sourceColumn] = targetField;
    }
    setMapping(newMapping);

    // Save to history
    if (targetField && clientId) {
      saveColumnMappingHistory(
        clientId,
        fileType,
        sourceColumn,
        targetField,
        1.0,
        true, // Manual override
        fileName
      );
    }
  };

  const applyAllSuggestions = () => {
    const newMapping: Record<string, string> = {};
    suggestedMappings.forEach(suggestion => {
      newMapping[suggestion.sourceColumn] = suggestion.targetField;
    });
    setMapping(newMapping);
  };

  const getSuggestionForColumn = (columnName: string): ColumnMapping | undefined => {
    return suggestedMappings.find(s => s.sourceColumn === columnName);
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800 border-green-200';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getRequiredFieldsStatus = () => {
    const requiredFields = fieldDefinitions.filter(f => f.is_required);
    const mappedRequiredFields = requiredFields.filter(f => 
      Object.values(mapping).includes(f.field_key)
    );
    return {
      total: requiredFields.length,
      mapped: mappedRequiredFields.length,
      complete: mappedRequiredFields.length === requiredFields.length
    };
  };

  const requiredStatus = getRequiredFieldsStatus();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 animate-pulse" />
            Analyserer kolonnene...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {preview.headers.map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-10 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Suggestions Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              <CardTitle>Intelligent kolonnmapping</CardTitle>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {suggestedMappings.length} AI-forslag
              </Badge>
              {suggestedMappings.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={applyAllSuggestions}
                  className="text-xs"
                >
                  Bruk alle forslag
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Enhanced Preview Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Filinnhold: {fileName}</span>
            <div className="flex items-center gap-2">
              <Badge variant={requiredStatus.complete ? "default" : "destructive"}>
                {requiredStatus.mapped}/{requiredStatus.total} påkrevde felt
              </Badge>
            </div>
          </CardTitle>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
            <div className="flex items-center gap-2 text-blue-800">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">
                Klar til å prosessere {preview.totalRows} rader totalt
              </span>
            </div>
            <div className="text-sm text-blue-600 mt-1">
              Viser forhåndsvisning av første 5 rader nedenfor
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                {/* Standard field names row */}
                <tr className="bg-muted/50">
                  {preview.headers.map((header, index) => {
                    const mappedField = mapping[header];
                    const fieldDef = fieldDefinitions.find(f => f.field_key === mappedField);
                    const suggestion = getSuggestionForColumn(header);
                    
                    return (
                      <th key={index} className="border border-border p-2 text-left">
                        <div className="space-y-2">
                          {/* Standard field name */}
                          <div className="text-xs font-normal text-muted-foreground">
                            Standard kolonnenavn:
                          </div>
                          <div className="min-h-[40px] flex items-center">
                            {mappedField ? (
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${fieldDef?.is_required ? 'border-primary' : ''}`}
                              >
                                {fieldDef?.field_label || mappedField}
                                {fieldDef?.is_required && <span className="text-red-500 ml-1">*</span>}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">
                                Ikke tildelt
                              </span>
                            )}
                          </div>
                          
                          {/* AI Suggestion indicator */}
                          {suggestion && (
                            <Badge 
                              className={getConfidenceColor(suggestion.confidence)}
                            >
                              AI: {Math.round(suggestion.confidence * 100)}%
                            </Badge>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
                
                {/* Original headers row */}
                <tr className="bg-background">
                  {preview.headers.map((header, index) => (
                    <th key={index} className="border border-border p-3 text-left font-medium">
                      <div className="space-y-2">
                        <div className="font-semibold">{header}</div>
                        
                        {/* Mapping selector */}
                        <Select
                          value={mapping[header] || ''}
                          onValueChange={(value) => handleMappingChange(header, value)}
                        >
                          <SelectTrigger className="w-full text-xs">
                            <SelectValue placeholder="Velg felt..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">-- Ikke tildelt --</SelectItem>
                            {fieldDefinitions
                              .sort((a, b) => a.sort_order - b.sort_order)
                              .map((field) => (
                                <SelectItem key={field.field_key} value={field.field_key}>
                                  <div className="flex items-center gap-2">
                                    <span>{field.field_label}</span>
                                    {field.is_required && <span className="text-red-500">*</span>}
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        
                        {validationErrors[header] && (
                          <div className="text-red-500 text-xs flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {validationErrors[header]}
                          </div>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.slice(0, 5).map((row, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="border border-border p-2 text-sm">
                        {cell || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">
                {preview.totalRows} rader vil bli prosessert ved opplasting
              </span>
            </div>
            {preview.totalRows > 5 && (
              <p className="text-sm text-green-600 mt-1">
                Viser kun 5 rader i forhåndsvisning av totalt {preview.totalRows} rader
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onCancel}>
          Avbryt
        </Button>
        
        <div className="flex items-center gap-4">
          {!requiredStatus.complete && (
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Alle påkrevde felt må tilordnes
            </div>
          )}
          
          <Button 
            onClick={() => onMappingComplete(mapping)}
            disabled={!requiredStatus.complete}
            className="flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Fortsett med innlasting
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPreview;