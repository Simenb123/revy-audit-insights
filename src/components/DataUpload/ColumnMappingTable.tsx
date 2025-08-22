import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Info } from 'lucide-react';
import { ColumnMapping } from '@/utils/fileProcessing';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useFiscalYear } from '@/contexts/FiscalYearContext';

interface ColumnMappingTableProps {
  fileName: string;
  headers: string[];
  sampleRows: string[][];
  mapping: Record<string, string>;
  fieldDefinitions: any[];
  suggestedMappings: ColumnMapping[];
  validationErrors: Record<string, string>;
  requiredStatus: {
    total: number;
    mapped: number;
    complete: boolean;
  };
  headerRowIndex?: number;
  onMappingChange: (sourceColumn: string, targetField: string) => void;
}

const ColumnMappingTable: React.FC<ColumnMappingTableProps> = ({
  fileName,
  headers,
  sampleRows,
  mapping,
  fieldDefinitions,
  suggestedMappings,
  validationErrors,
  requiredStatus,
  onMappingChange
}) => {
  const getSuggestionForColumn = (columnName: string): ColumnMapping | undefined => {
    return suggestedMappings.find(s => s.sourceColumn === columnName);
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800 border-green-200';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  // Check for duplicate mappings
  const getDuplicateFields = (): Record<string, string[]> => {
    const fieldToColumns: Record<string, string[]> = {};
    
    Object.entries(mapping).forEach(([column, field]) => {
      if (field && field !== 'none') {
        if (!fieldToColumns[field]) {
          fieldToColumns[field] = [];
        }
        fieldToColumns[field].push(column);
      }
    });

    // Return only fields that have more than one column mapped
    const duplicates: Record<string, string[]> = {};
    Object.entries(fieldToColumns).forEach(([field, columns]) => {
      if (columns.length > 1) {
        duplicates[field] = columns;
      }
    });

    return duplicates;
  };

  const duplicateFields = getDuplicateFields();
  const hasDuplicates = Object.keys(duplicateFields).length > 0;

  const { selectedFiscalYear } = useFiscalYear();
  const year = selectedFiscalYear || new Date().getFullYear();
  const hasOpening = Array.isArray(fieldDefinitions) && fieldDefinitions.some((f: any) => f.field_key === 'opening_balance');
  const hasClosing = Array.isArray(fieldDefinitions) && fieldDefinitions.some((f: any) => f.field_key === 'closing_balance');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Kolonnmapping: {fileName}</span>
          <Badge variant={requiredStatus.complete ? "default" : "destructive"}>
            {requiredStatus.mapped}/{requiredStatus.total} påkrevde felt
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Duplicate mappings warning */}
        {hasDuplicates && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center gap-2 text-yellow-800 font-medium mb-2">
              <AlertCircle className="w-4 h-4" />
              Duplikate mappinger oppdaget
            </div>
            <div className="text-sm text-yellow-700">
              Følgende felt er mappet til flere kolonner:
              {Object.entries(duplicateFields).map(([field, columns]) => {
                const fieldDef = fieldDefinitions.find(f => f.field_key === field);
                return (
                  <div key={field} className="mt-1">
                    <strong>{fieldDef?.field_label || field}:</strong> {columns.join(', ')}
                  </div>
                );
              })}
              <div className="mt-2 text-xs">
                <strong>Regel:</strong> Hver kolonne kan kun mappes til ett felt, men samme felt kan ha data fra flere kolonner hvis det gir mening (f.eks. "Netto beløp" og "MVA-grunnlag" kan være samme kolonne).
              </div>
            </div>
          </div>
        )}

        {hasOpening && hasClosing && (
          <div className="mb-3 text-xs text-muted-foreground flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1 cursor-help">
                  <Info className="w-3.5 h-3.5" />
                  Tips: Saldo {year - 1} = Inngående {year}, Saldo {year} = Utgående {year}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                Inngående per 1.1.{year} = utgående 31.12.{year - 1} for hver konto
              </TooltipContent>
            </Tooltip>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-border">
            <thead>
              <tr className="bg-primary/10">
                {headers.map((header, index) => (
                  <th key={index} className="border border-border p-3 text-left font-medium min-w-[150px]">
                    {header}
                  </th>
                ))}
              </tr>
              <tr className="bg-muted/30">
                {headers.map((header, index) => {
                  const suggestion = getSuggestionForColumn(header);
                  
                  return (
                    <td key={index} className="border border-border p-2">
                      <div className="space-y-2">
                        {/* AI Suggestion badge */}
                        {suggestion && (
                          <div className="flex justify-center">
                            <Badge 
                              className={`text-xs ${getConfidenceColor(suggestion.confidence)}`}
                            >
                              AI: {Math.round(suggestion.confidence * 100)}%
                            </Badge>
                          </div>
                        )}
                        
                        {/* Mapping selector */}
                        <Select
                          value={mapping[header] || ''}
                          onValueChange={(value) => onMappingChange(header, value)}
                        >
                          <SelectTrigger className={`w-full text-xs ${
                            Object.values(duplicateFields).some(columns => columns.includes(header)) 
                              ? 'border-yellow-500 bg-yellow-50' 
                              : ''
                          }`}>
                            <SelectValue placeholder="Velg felt..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem key="none" value="none">-- Ikke tildelt --</SelectItem>
                            {fieldDefinitions
                              .sort((a, b) => a.sort_order - b.sort_order)
                              .map((field) => {
                                const isAlreadyMapped = Object.values(mapping).includes(field.field_key) && mapping[header] !== field.field_key;
                                return (
                                  <SelectItem key={field.field_key} value={field.field_key}>
                                    <div className="flex items-center gap-2">
                                      <span className={isAlreadyMapped ? 'text-yellow-600' : ''}>
                                        {field.field_label}
                                        {isAlreadyMapped && ' (duplikat)'}
                                      </span>
                                      {field.is_required && <span className="text-red-500">*</span>}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                          </SelectContent>
                        </Select>
                        
                        {validationErrors[header] && (
                          <div className="text-red-500 text-xs flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {validationErrors[header]}
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            </thead>
            
            <tbody>
              {sampleRows.slice(0, 5).map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                  {row.slice(0, headers.length).map((cell, cellIndex) => (
                    <td key={cellIndex} className="border border-border p-2 text-sm">
                      {cell || '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ColumnMappingTable;