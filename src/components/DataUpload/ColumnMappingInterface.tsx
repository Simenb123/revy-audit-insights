
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, AlertCircle, Eye } from 'lucide-react';

interface ColumnMapping {
  [key: string]: string; // file column -> standard field
}

interface StandardField {
  key: string;
  label: string;
  required: boolean;
  description: string;
}

interface ColumnMappingInterfaceProps {
  fileColumns: string[];
  sampleData: Record<string, string>[];
  onMappingComplete: (mapping: ColumnMapping) => void;
  onCancel: () => void;
}

const standardFields: StandardField[] = [
  { key: 'transaction_date', label: 'Dato', required: true, description: 'Transaksjonsdato' },
  { key: 'account_number', label: 'Kontonummer', required: true, description: 'Kontonummer' },
  { key: 'voucher_number', label: 'Bilagsnummer', required: false, description: 'Bilagsnummer/referanse' },
  { key: 'description', label: 'Beskrivelse', required: false, description: 'Transaksjonsbeskrivelse' },
  { key: 'debit_amount', label: 'Debet', required: false, description: 'Debetbeløp' },
  { key: 'credit_amount', label: 'Kredit', required: false, description: 'Kreditbeløp' },
  { key: 'balance_amount', label: 'Saldo', required: false, description: 'Saldo etter transaksjon' },
];

const ColumnMappingInterface = ({ 
  fileColumns, 
  sampleData, 
  onMappingComplete, 
  onCancel 
}: ColumnMappingInterfaceProps) => {
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [showPreview, setShowPreview] = useState(false);

  // Auto-detect column mappings based on common names
  useEffect(() => {
    const autoMapping: ColumnMapping = {};
    
    fileColumns.forEach(column => {
      const lowerColumn = column.toLowerCase();
      
      // Auto-detect common patterns
      if (lowerColumn.includes('dato') || lowerColumn.includes('date')) {
        autoMapping[column] = 'transaction_date';
      } else if (lowerColumn.includes('konto') || lowerColumn.includes('account')) {
        autoMapping[column] = 'account_number';
      } else if (lowerColumn.includes('bilag') || lowerColumn.includes('voucher') || lowerColumn.includes('ref')) {
        autoMapping[column] = 'voucher_number';
      } else if (lowerColumn.includes('beskriv') || lowerColumn.includes('description') || lowerColumn.includes('tekst')) {
        autoMapping[column] = 'description';
      } else if (lowerColumn.includes('debet') || lowerColumn.includes('debit')) {
        autoMapping[column] = 'debit_amount';
      } else if (lowerColumn.includes('kredit') || lowerColumn.includes('credit')) {
        autoMapping[column] = 'credit_amount';
      } else if (lowerColumn.includes('saldo') || lowerColumn.includes('balance')) {
        autoMapping[column] = 'balance_amount';
      }
    });
    
    setMapping(autoMapping);
  }, [fileColumns]);

  const handleMappingChange = (fileColumn: string, standardField: string) => {
    setMapping(prev => ({
      ...prev,
      [fileColumn]: standardField
    }));
  };

  const removeMappingForStandardField = (standardField: string) => {
    setMapping(prev => {
      const newMapping = { ...prev };
      Object.keys(newMapping).forEach(key => {
        if (newMapping[key] === standardField) {
          delete newMapping[key];
        }
      });
      return newMapping;
    });
  };

  const getRequiredFieldsStatus = () => {
    const requiredFields = standardFields.filter(field => field.required);
    const mappedRequiredFields = requiredFields.filter(field => 
      Object.values(mapping).includes(field.key)
    );
    return {
      total: requiredFields.length,
      mapped: mappedRequiredFields.length,
      complete: mappedRequiredFields.length === requiredFields.length
    };
  };

  const status = getRequiredFieldsStatus();

  const handleComplete = () => {
    if (status.complete) {
      onMappingComplete(mapping);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Kolonnemapping</span>
            {status.complete ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-500" />
            )}
          </CardTitle>
          <CardDescription>
            Koble kolonnene fra filen din til standardfeltene. 
            Påkrevde felter: {status.mapped}/{status.total}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Kolonner i filen din:</h4>
              <div className="space-y-2">
                {fileColumns.map(column => (
                  <div key={column} className="flex items-center justify-between p-2 border rounded">
                    <span className="font-mono text-sm">{column}</span>
                    <Select
                      value={mapping[column] || ''}
                      onValueChange={(value) => {
                        if (value === 'none') {
                          const newMapping = { ...mapping };
                          delete newMapping[column];
                          setMapping(newMapping);
                        } else {
                          // Remove existing mapping for this standard field
                          removeMappingForStandardField(value);
                          handleMappingChange(column, value);
                        }
                      }}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Velg felt" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Ikke bruk</SelectItem>
                        {standardFields.map(field => (
                          <SelectItem key={field.key} value={field.key}>
                            {field.label} {field.required && '*'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Standardfelter:</h4>
              <div className="space-y-2">
                {standardFields.map(field => {
                  const isMapped = Object.values(mapping).includes(field.key);
                  const mappedColumn = Object.keys(mapping).find(col => mapping[col] === field.key);
                  
                  return (
                    <div 
                      key={field.key} 
                      className={`p-2 border rounded ${
                        field.required && !isMapped ? 'border-red-200 bg-red-50' : 
                        isMapped ? 'border-green-200 bg-green-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </span>
                        {isMapped && (
                          <span className="text-sm text-green-600 font-mono">
                            ← {mappedColumn}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600">{field.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              {showPreview ? 'Skjul' : 'Vis'} forhåndsvisning
            </Button>
            <Button onClick={onCancel} variant="outline">
              Avbryt
            </Button>
            <Button 
              onClick={handleComplete} 
              disabled={!status.complete}
              className="flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Fortsett import ({status.mapped}/{status.total})
            </Button>
          </div>
        </CardContent>
      </Card>

      {showPreview && sampleData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Forhåndsvisning av data</CardTitle>
            <CardDescription>
              Slik vil dataene dine se ut etter mapping (viser første 5 rader)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {standardFields
                    .filter(field => Object.values(mapping).includes(field.key))
                    .map(field => (
                      <TableHead key={field.key}>{field.label}</TableHead>
                    ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleData.slice(0, 5).map((row, index) => (
                  <TableRow key={index}>
                    {standardFields
                      .filter(field => Object.values(mapping).includes(field.key))
                      .map(field => {
                        const fileColumn = Object.keys(mapping).find(col => mapping[col] === field.key);
                        return (
                          <TableCell key={field.key} className="font-mono text-sm">
                            {fileColumn ? row[fileColumn] || '-' : '-'}
                          </TableCell>
                        );
                      })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ColumnMappingInterface;
