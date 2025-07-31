import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Brain, Zap } from 'lucide-react';
import { FilePreview, ColumnMapping, FieldDefinition } from '@/utils/fileProcessing';
import { getFieldDefinitions, saveColumnMappingHistory, getHistoricalMappings, suggestEnhancedColumnMappings } from '@/utils/fieldDefinitions';
import HeaderRowSelector from './HeaderRowSelector';
import ColumnMappingTable from './ColumnMappingTable';
import MappingSummary from './MappingSummary';

interface EnhancedPreviewProps {
  preview: FilePreview;
  fileName: string;
  clientId: string;
  fileType: 'trial_balance' | 'general_ledger' | 'chart_of_accounts';
  onMappingComplete: (mappings: Record<string, string>, headerRowIndex?: number, headers?: string[]) => void;
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
  const [currentHeaderRowIndex, setCurrentHeaderRowIndex] = useState<number>(preview.headerRowIndex);
  const [currentHeaders, setCurrentHeaders] = useState<string[]>(preview.headers);
  const [showAllRows, setShowAllRows] = useState(false);

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
      const suggestions = await suggestEnhancedColumnMappings(
        clientId,
        fileType,
        currentHeaders,
        preview.rows.slice(0, 10), // Sample data for content validation
        fileName
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

    if (clientId && currentHeaders.length > 0) {
      initializeMapping();
    }
  }, [preview, clientId, fileType, currentHeaders]);

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

  // Handle header row change
  const handleHeaderRowChange = (newRowIndex: string) => {
    const rowIndex = parseInt(newRowIndex);
    
    // Create new preview data with updated header row
    const allRawData = [
      ...preview.skippedRows.map(row => row.content),
      preview.headers,
      ...preview.allRows
    ];
    
    if (rowIndex < allRawData.length) {
      const newHeaders = allRawData[rowIndex].map(h => h?.toString() || '');
      setCurrentHeaders(newHeaders);
      setCurrentHeaderRowIndex(rowIndex);
      setMapping({}); // Reset mapping when header changes
    }
  };

  const requiredStatus = getRequiredFieldsStatus();

  // Generate displayable row data with row numbers
  const generateDisplayRows = () => {
    const allRawData = [
      ...preview.skippedRows.map(row => row.content),
      preview.headers,
      ...preview.allRows
    ];
    
    const displayRows = allRawData.slice(0, showAllRows ? 10 : 6).map((row, index) => ({
      index,
      content: row,
      isHeader: index === currentHeaderRowIndex,
      isSkipped: index < currentHeaderRowIndex,
      isData: index > currentHeaderRowIndex
    }));
    
    return displayRows;
  };

  const displayRows = generateDisplayRows();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {currentHeaders.map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Suggestions Header */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Intelligent kolonnmapping</h3>
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
      </div>

      {/* Header Row Selection */}
      <HeaderRowSelector
        currentHeaderRowIndex={currentHeaderRowIndex}
        displayRows={displayRows}
        showAllRows={showAllRows}
        onHeaderRowChange={handleHeaderRowChange}
        onToggleRows={() => setShowAllRows(!showAllRows)}
        skippedRowsCount={preview.skippedRows.length}
      />

      {/* Column Mapping Table */}
      <ColumnMappingTable
        fileName={fileName}
        headers={currentHeaders}
        sampleRows={preview.rows.slice(0, 5)}
        mapping={mapping}
        fieldDefinitions={fieldDefinitions}
        suggestedMappings={suggestedMappings}
        validationErrors={validationErrors}
        requiredStatus={requiredStatus}
        onMappingChange={handleMappingChange}
      />

      {/* Summary */}
      <MappingSummary
        totalRows={preview.totalRows}
        sampleRowsCount={Math.min(5, preview.rows.length)}
        skippedRowsCount={preview.skippedRows.length}
      />

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
            onClick={() => onMappingComplete(mapping, currentHeaderRowIndex, currentHeaders)}
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