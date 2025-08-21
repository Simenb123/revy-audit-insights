import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Info, CheckCircle2, RotateCw, Rows, Columns } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import StandardDataTable, { StandardDataTableColumn } from '@/components/ui/standard-data-table';
import { ColumnMapping } from '@/utils/fileProcessing';

interface FieldDefinition {
  field_key: string;
  field_label: string;
  is_required: boolean;
  sort_order: number;
}

interface SmartColumnMapperProps {
  fileName: string;
  headers: string[];
  sampleRows: string[][];
  mapping: Record<string, string>;
  fieldDefinitions: FieldDefinition[];
  suggestedMappings: ColumnMapping[];
  validationErrors: Record<string, string>;
  requiredStatus: {
    total: number;
    mapped: number;
    complete: boolean;
  };
  onMappingChange: (sourceColumn: string, targetField: string) => void;
  additionalInfo?: React.ReactNode;
}

interface MappingTableRow {
  id: string;
  columnName: string;
  suggestion: ColumnMapping | undefined;
  currentMapping: string;
  validationError?: string;
  sampleData: string[];
}

interface LandscapeTableRow {
  id: string;
  rowType: string;
  [key: string]: any;
}

type TableData = MappingTableRow[] | LandscapeTableRow[];

const SmartColumnMapper: React.FC<SmartColumnMapperProps> = ({
  fileName,
  headers,
  sampleRows,
  mapping,
  fieldDefinitions,
  suggestedMappings,
  validationErrors,
  requiredStatus,
  onMappingChange,
  additionalInfo
}) => {
  // Orientation state with localStorage persistence
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(() => {
    const saved = localStorage.getItem('column-mapper-orientation');
    return (saved as 'portrait' | 'landscape') || 'portrait';
  });

  useEffect(() => {
    localStorage.setItem('column-mapper-orientation', orientation);
  }, [orientation]);

  const toggleOrientation = () => {
    setOrientation(prev => prev === 'portrait' ? 'landscape' : 'portrait');
  };
  const getSuggestionForColumn = (columnName: string): ColumnMapping | undefined => {
    return suggestedMappings.find(s => s.sourceColumn === columnName);
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
    return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
  };

  // Transform headers and sample data into table rows
  const tableData: MappingTableRow[] = useMemo(() => {
    return headers.map((header, index) => ({
      id: `col-${index}`,
      columnName: header,
      suggestion: getSuggestionForColumn(header),
      currentMapping: mapping[header] || '',
      validationError: validationErrors[header],
      sampleData: sampleRows.slice(0, 3).map(row => row[index] || '-')
    }));
  }, [headers, mapping, validationErrors, sampleRows, suggestedMappings]);

  // Portrait columns (current implementation)
  const portraitColumns: StandardDataTableColumn<MappingTableRow>[] = [
    {
      key: 'columnName',
      header: 'Kolonne fra fil',
      accessor: 'columnName',
      format: (value) => (
        <div className="font-medium text-foreground">
          {value}
        </div>
      )
    },
    {
      key: 'suggestion',
      header: 'AI Forslag',
      accessor: 'suggestion',
      align: 'center',
      format: (suggestion: ColumnMapping | undefined) => {
        if (!suggestion) return <span className="text-muted-foreground">-</span>;
        return (
          <Badge className={`text-xs ${getConfidenceColor(suggestion.confidence)}`}>
            {Math.round(suggestion.confidence * 100)}% match
          </Badge>
        );
      }
    },
    {
      key: 'mapping',
      header: 'Tildelt felt',
      accessor: 'currentMapping',
      format: (value, row) => (
        <div className="space-y-2">
          <Select
            value={value}
            onValueChange={(newValue) => onMappingChange(row.columnName, newValue)}
          >
            <SelectTrigger className="w-full">
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
                      {field.is_required && <span className="text-destructive">*</span>}
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          
          {row.validationError && (
            <div className="text-destructive text-xs flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {row.validationError}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'sampleData',
      header: 'Eksempeldata',
      accessor: 'sampleData',
      format: (sampleData: string[]) => (
        <div className="space-y-1">
          {sampleData.map((sample, idx) => (
            <div key={idx} className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
              {sample}
            </div>
          ))}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (row) => row.currentMapping && row.currentMapping !== 'none',
      align: 'center',
      format: (isValid) => (
        isValid ? (
          <CheckCircle2 className="w-4 h-4 text-green-600" />
        ) : (
          <div className="w-4 h-4 border border-muted-foreground rounded-full" />
        )
      )
    }
  ];

  // Landscape columns (file headers become columns)
  const landscapeColumns: StandardDataTableColumn<any>[] = useMemo(() => {
    const baseColumns = [
      {
        key: 'rowType',
        header: 'Rad',
        accessor: 'rowType',
        format: (value: string) => (
          <div className="font-medium text-foreground">
            {value}
          </div>
        )
      }
    ];

    const headerColumns = headers.map(header => ({
      key: header,
      header: header,
      accessor: header,
      format: (value: any) => value
    }));

    return [...baseColumns, ...headerColumns];
  }, [headers]);

  // Landscape table data (rotate the structure)
  const landscapeData = useMemo(() => {
    const aiSuggestionRow: Record<string, any> = { 
      id: 'ai-suggestions', 
      rowType: 'AI Forslag' 
    };
    const mappingRow: Record<string, any> = { 
      id: 'mapping', 
      rowType: 'Tildelt felt' 
    };
    const sampleRow1: Record<string, any> = { 
      id: 'sample-1', 
      rowType: 'Eksempel 1' 
    };
    const sampleRow2: Record<string, any> = { 
      id: 'sample-2', 
      rowType: 'Eksempel 2' 
    };
    const sampleRow3: Record<string, any> = { 
      id: 'sample-3', 
      rowType: 'Eksempel 3' 
    };

    headers.forEach((header, index) => {
      const suggestion = getSuggestionForColumn(header);
      const currentMapping = mapping[header] || '';
      const validationError = validationErrors[header];
      
      // AI Suggestion row
      aiSuggestionRow[header] = suggestion ? (
        <Badge className={`text-xs ${getConfidenceColor(suggestion.confidence)}`}>
          {Math.round(suggestion.confidence * 100)}% match
        </Badge>
      ) : (
        <span className="text-muted-foreground">-</span>
      );

      // Mapping row
      mappingRow[header] = (
        <div className="space-y-2">
          <Select
            value={currentMapping}
            onValueChange={(newValue) => onMappingChange(header, newValue)}
          >
            <SelectTrigger className="w-full">
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
                      {field.is_required && <span className="text-destructive">*</span>}
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          
          {validationError && (
            <div className="text-destructive text-xs flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {validationError}
            </div>
          )}
        </div>
      );

      // Sample data rows
      const samples = sampleRows.slice(0, 3).map(row => row[index] || '-');
      sampleRow1[header] = (
        <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
          {samples[0] || '-'}
        </div>
      );
      sampleRow2[header] = (
        <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
          {samples[1] || '-'}
        </div>
      );
      sampleRow3[header] = (
        <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
          {samples[2] || '-'}
        </div>
      );
    });

    return [aiSuggestionRow, mappingRow, sampleRow1, sampleRow2, sampleRow3];
  }, [headers, mapping, validationErrors, sampleRows, suggestedMappings, fieldDefinitions, onMappingChange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>Kolonnmapping: {fileName}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleOrientation}
                  className="h-8 w-8 p-0"
                >
                  {orientation === 'portrait' ? <Columns className="h-4 w-4" /> : <Rows className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Bytt til {orientation === 'portrait' ? 'landskap' : 'stående'} visning
              </TooltipContent>
            </Tooltip>
          </div>
          <Badge variant={requiredStatus.complete ? "default" : "destructive"}>
            {requiredStatus.mapped}/{requiredStatus.total} påkrevde felt
          </Badge>
        </CardTitle>
        {additionalInfo && (
          <div className="text-sm text-muted-foreground">
            {additionalInfo}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {orientation === 'portrait' ? (
          <StandardDataTable
            data={tableData}
            columns={portraitColumns}
            title="Kolonnmapping"
            tableName="column-mapping"
            searchPlaceholder="Søk kolonner..."
            emptyMessage="Ingen kolonner funnet"
            enablePagination={false}
            showSearch={headers.length > 10}
            maxBodyHeight="60vh"
            wrapInCard={false}
          />
        ) : (
          <StandardDataTable
            data={landscapeData}
            columns={landscapeColumns}
            title="Kolonnmapping"
            tableName="column-mapping"
            searchPlaceholder="Søk kolonner..."
            emptyMessage="Ingen kolonner funnet"
            enablePagination={false}
            showSearch={headers.length > 10}
            maxBodyHeight="60vh"
            wrapInCard={false}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default SmartColumnMapper;