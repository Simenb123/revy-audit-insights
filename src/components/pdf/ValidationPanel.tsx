import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, Table } from 'lucide-react';
import { BilagType, BilagPayload } from '@/types/bilag';
import { generateDebugFile } from '@/utils/debug-export';
import { GeneralLedgerTable } from './GeneralLedgerTable';

interface ValidationPanelProps {
  rows: any[];
  bilagGroups: Record<string, any[]>;
  detectedColumns: string[];
  mvaSatser: number[];
  originalData?: any[];
  columnMapping?: Record<string, string>;
  payloads?: BilagPayload[];
  onViewReceipt?: (payload: BilagPayload) => void;
  onDownloadPdf?: (payload: BilagPayload) => void;
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({
  rows,
  bilagGroups,
  detectedColumns,
  mvaSatser,
  originalData,
  columnMapping,
  payloads = [],
  onViewReceipt,
  onDownloadPdf
}) => {
  const typeDistribution = Object.values(bilagGroups).reduce((acc, group) => {
    // Simplified type detection for display
    const accounts = group.map(r => r.konto).filter(Boolean);
    let type: BilagType = 'diversebilag';
    
    if (accounts.some(a => a >= 3000 && a < 4000)) type = 'salgsfaktura';
    else if (accounts.some(a => a >= 4000 && a < 8000)) type = 'leverandorfaktura';
    else if (accounts.includes(1920) && accounts.includes(1500)) type = 'kundebetaling';
    else if (accounts.includes(1920) && accounts.includes(2400)) type = 'leverandorbetaling';
    else if (accounts.includes(8160)) type = 'bankbilag';
    
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<BilagType, number>);

  const handleDownloadDebugFile = async () => {
    try {
      await generateDebugFile({
        originalData: originalData || [],
        mappedData: rows,
        columnMapping: columnMapping || {},
        bilagGroups,
        detectedColumns,
        typeDistribution
      });
    } catch (error) {
      console.error('Failed to generate debug file:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Debug Export Button */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Debug & Feilsøking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownloadDebugFile}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Last ned mappet hovedboksfil
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Laster ned Excel-fil med mappede kolonner for enkel feilsøking av bilagsgenerering
          </p>
        </CardContent>
      </Card>

      {/* Validation Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Rader</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{rows.length}</div>
          <p className="text-xs text-muted-foreground">Totalt antall rader</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Bilag</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Object.keys(bilagGroups).length}</div>
          <p className="text-xs text-muted-foreground">Unike bilag funnet</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Kolonner</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1">
            {detectedColumns.slice(0, 5).map(col => (
              <Badge key={col} variant="secondary" className="text-xs">
                {col}
              </Badge>
            ))}
            {detectedColumns.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{detectedColumns.length - 5}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Typer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {Object.entries(typeDistribution).map(([type, count]) => (
              <div key={type} className="flex justify-between text-xs">
                <span className="capitalize">
                  {type === 'salgsfaktura' ? 'Salgsfaktura' :
                   type === 'leverandorfaktura' ? 'Innkjøpsfaktura' :
                   type === 'kundebetaling' ? 'Kundebetaling' :
                   type === 'leverandorbetaling' ? 'Leverandørbetaling' :
                   type === 'bankbilag' ? 'Bankbilag' :
                   'Diversebilag'}
                </span>
                <Badge variant="outline" className="text-xs">{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>

      {/* General Ledger Table */}
      {rows.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Table className="h-4 w-4" />
              Hovedboksvisning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GeneralLedgerTable
              rows={rows}
              bilagGroups={bilagGroups}
              payloads={payloads}
              onViewReceipt={onViewReceipt}
              onDownloadPdf={onDownloadPdf}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};