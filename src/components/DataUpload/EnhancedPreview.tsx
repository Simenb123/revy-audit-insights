import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { FilePreview, ColumnMapping, FieldDefinition } from '@/utils/fileProcessing';
import { getFieldDefinitions, saveColumnMappingHistory, getHistoricalMappings, suggestEnhancedColumnMappings } from '@/utils/fieldDefinitions';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import ColumnMappingTable from './ColumnMappingTable';
import MappingSummary from './MappingSummary';

// Helpers for simple mapping when using custom field definitions (e.g., client bulk)
const normalizeText = (text: string) => (text || '')
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/å/g, 'a')
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

function simpleSuggestMappings(headers: string[], sampleData: any[][], fields: any[]): ColumnMapping[] {
  const suggestions: ColumnMapping[] = [];
  const usedTargets = new Set<string>();

  headers.forEach((header) => {
    const nHeader = normalizeText(header);
    let bestScore = 0;
    let bestField: any = null;

    fields.forEach((f: any) => {
      const candidates = [f.field_label, ...(f.aliases || [])].map(normalizeText);
      let score = 0;
      for (const c of candidates) {
        if (!c) continue;
        if (nHeader === c) { score = 0.95; break; }
        if (nHeader.includes(c) || c.includes(nHeader)) score = Math.max(score, 0.8);
      }
      if (score > bestScore) { bestScore = score; bestField = f; }
    });

    if (bestField && bestScore >= 0.6 && !usedTargets.has(bestField.field_key)) {
      usedTargets.add(bestField.field_key);
      suggestions.push({ sourceColumn: header, targetField: bestField.field_key, confidence: bestScore });
    }
  });

  return suggestions.sort((a, b) => b.confidence - a.confidence);
}

interface EnhancedPreviewProps {
  preview: FilePreview;
  fileName: string;
  clientId: string; // can be placeholder like 'bulk' for non-client specific flows
  fileType: 'trial_balance' | 'general_ledger' | 'chart_of_accounts' | 'client_bulk';
  onMappingComplete: (mappings: Record<string, string>, headerRowIndex?: number, headers?: string[]) => void;
  onCancel: () => void;
  // Optional: allow callers to override field definitions (e.g. for client bulk import)
  customFieldDefinitions?: {
    field_key: string;
    field_label: string;
    data_type: 'text' | 'number' | 'date';
    is_required: boolean;
    aliases?: string[];
  }[];
}

const EnhancedPreview: React.FC<EnhancedPreviewProps> = ({
  preview,
  fileName,
  clientId,
  fileType,
  onMappingComplete,
  onCancel,
  customFieldDefinitions
}) => {
  const { selectedFiscalYear } = useFiscalYear();
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
      try {
        // Use custom field definitions if provided, otherwise fetch from DB
        let fields: any[] = [];
        if (customFieldDefinitions && customFieldDefinitions.length) {
          fields = customFieldDefinitions.map(f => ({
            field_key: f.field_key,
            field_label: f.field_label,
            data_type: f.data_type,
            is_required: f.is_required,
            aliases: f.aliases || []
          }));
        } else {
          fields = await getFieldDefinitions(fileType, selectedFiscalYear);
        }
        setFieldDefinitions(fields);

        // Build suggestions
        let suggestions: ColumnMapping[] = [];
        if (customFieldDefinitions && customFieldDefinitions.length) {
          suggestions = simpleSuggestMappings(
            currentHeaders,
            preview.rows.slice(0, 10),
            fields
          );
        } else {
          suggestions = await suggestEnhancedColumnMappings(
            clientId || 'bulk',
            fileType,
            currentHeaders,
            preview.rows.slice(0, 10),
            fileName,
            selectedFiscalYear
          );
        }

        setSuggestedMappings(suggestions);

        // Auto-apply high-confidence suggestions (>= 0.8)
        const autoMapping: Record<string, string> = {};
        suggestions.forEach(suggestion => {
          if (suggestion.confidence >= 0.8) {
            autoMapping[suggestion.sourceColumn] = suggestion.targetField;
          }
        });
        setMapping(autoMapping);
      } catch (e) {
        console.error('EnhancedPreview initialization failed:', e);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentHeaders.length > 0) {
      initializeMapping();
    }
  }, [preview, clientId, fileType, currentHeaders, selectedFiscalYear, customFieldDefinitions]);

  const handleMappingChange = (sourceColumn: string, targetField: string) => {
    const newMapping = { ...mapping };
    if (targetField === '' || targetField === 'none') {
      delete newMapping[sourceColumn];
    } else {
      newMapping[sourceColumn] = targetField;
    }
    setMapping(newMapping);

    // Save to history (skip for client_bulk or when using custom fields)
    if (targetField && clientId && fileType !== 'client_bulk' && !(customFieldDefinitions && customFieldDefinitions.length)) {
      saveColumnMappingHistory(
        clientId,
        fileType,
        sourceColumn,
        targetField,
        1.0,
        true, // Manual override
        fileName,
        selectedFiscalYear
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

  // Handle header row change - we need to reconstruct from original Excel data
  const handleHeaderRowChange = (newRowIndex: string) => {
    const rowIndex = parseInt(newRowIndex);
    console.log('=== HEADER ROW CHANGE ===');
    console.log('New row index:', rowIndex);
    
    // For now, just update the header index and let the display logic handle the reconstruction
    // The issue is that we don't have access to the original Excel data here
    // We need to work with what we have in the preview object
    const allRawData = [
      ...preview.skippedRows.map(row => row.content),
      preview.headers,
      ...preview.allRows
    ];
    
    console.log('All raw data length:', allRawData.length);
    console.log('Selected row:', allRawData[rowIndex]);
    
    if (rowIndex < allRawData.length) {
      const newHeaders = allRawData[rowIndex].map(h => h?.toString() || '');
      console.log('New headers:', newHeaders);
      setCurrentHeaders(newHeaders);
      setCurrentHeaderRowIndex(rowIndex);
      setMapping({}); // Reset mapping when header changes
    }
  };

  const requiredStatus = getRequiredFieldsStatus();

  // Generate displayable row data with row numbers - SHOW EXACT RAW DATA
  const generateDisplayRows = () => {
    console.log('=== GENERATING DISPLAY ROWS ===');
    console.log('preview structure:', {
      skippedRowsCount: preview.skippedRows.length,
      headers: preview.headers,
      allRowsCount: preview.allRows.length,
      headerRowIndex: preview.headerRowIndex
    });
    
    const allRawData = [
      ...preview.skippedRows.map(row => row.content),
      preview.headers,
      ...preview.allRows
    ];
    
    console.log('allRawData length:', allRawData.length);
    console.log('First few raw data rows:', allRawData.slice(0, 5));
    
    const displayRows = allRawData.slice(0, showAllRows ? 10 : 6).map((row, index) => ({
      index,
      content: Array.isArray(row) ? row : [],
      isHeader: index === currentHeaderRowIndex,
      isSkipped: index < currentHeaderRowIndex,
      isData: index > currentHeaderRowIndex
    }));
    
    console.log('Generated display rows:', displayRows);
    return displayRows;
  };

  // Generate sample rows based on selected header row - SHOW EXACT RAW DATA
  const generateSampleRows = () => {
    console.log('=== GENERATING SAMPLE ROWS ===');
    console.log('currentHeaderRowIndex:', currentHeaderRowIndex);
    console.log('preview structure:', {
      headerRowIndex: preview.headerRowIndex,
      currentHeaderRowIndex,
      skippedRowsCount: preview.skippedRows.length,
      allRowsCount: preview.allRows.length
    });
    
    // Reconstruct the complete raw data structure
    const allRawData = [
      ...preview.skippedRows.map(row => row.content),
      preview.headers,
      ...preview.allRows
    ];
    
    console.log('Complete raw data length:', allRawData.length);
    console.log('First few raw rows:', allRawData.slice(0, 5));
    
    // Calculate data start position based on current header selection
    const dataStartIndex = currentHeaderRowIndex + 1;
    console.log('Data starts at index:', dataStartIndex);
    
    // Get sample data rows AFTER the selected header row
    const sampleDataRows = allRawData.slice(dataStartIndex, dataStartIndex + 5);
    console.log('Raw sample data rows:', sampleDataRows);
    
    // Format the sample rows for display
    return sampleDataRows.map((row, index) => {
      if (!Array.isArray(row)) {
        console.warn('Non-array row found at index', dataStartIndex + index, ':', row);
        return [];
      }
      
      // Keep original values, only convert to string for display
      const displayRow = row.slice(0, currentHeaders.length).map(cell => {
        if (cell === null || cell === undefined || cell === '') return '';
        return cell.toString();
      });
      
      // Pad with empty strings if needed
      while (displayRow.length < currentHeaders.length) {
        displayRow.push('');
      }
      
      console.log(`Sample row ${index + 1}:`, displayRow);
      return displayRow;
    });
  };

  const displayRows = generateDisplayRows();
  const sampleRows = generateSampleRows();

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

      {/* Kompakt valg av header-rad (uten forhåndsvisningstabell) */}
      <div className="border border-border rounded-lg p-3 bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium">Header rad valgt: rad {currentHeaderRowIndex + 1}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Velg header rad:</span>
            <Select value={currentHeaderRowIndex.toString()} onValueChange={handleHeaderRowChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={`Rad ${currentHeaderRowIndex + 1}`} />
              </SelectTrigger>
              <SelectContent>
                {displayRows.map((row, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    <div className="flex items-center gap-2">
                      <span>Rad {index + 1}</span>
                      {row.content.slice(0, 3).some(cell => {
                        const strCell = typeof cell === 'string' ? cell : cell != null ? String(cell) : '';
                        return strCell && ['konto', 'beløp', 'saldo', 'dato', 'navn'].some(term => 
                          strCell.toLowerCase().includes(term)
                        );
                      }) && (
                        <Badge variant="secondary" className="text-[10px]">Sannsynlig header</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Column Mapping Table */}
      <ColumnMappingTable
        fileName={fileName}
        headers={currentHeaders}
        sampleRows={sampleRows}
        mapping={mapping}
        fieldDefinitions={fieldDefinitions}
        suggestedMappings={suggestedMappings}
        validationErrors={validationErrors}
        requiredStatus={requiredStatus}
        headerRowIndex={currentHeaderRowIndex}
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