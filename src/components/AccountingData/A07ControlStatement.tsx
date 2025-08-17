import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, FileDown, Settings } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { useA07ControlStatement } from '@/hooks/useA07ControlStatement';
import { exportArrayToXlsx } from '@/utils/exportToXlsx';
import { A07AccountMappingDialog } from './A07AccountMappingDialog';

interface A07ControlStatementProps {
  clientId: string;
  clientName: string;
  selectedVersion?: string;
  fiscalYear?: number;
}

export function A07ControlStatement({ 
  clientId, 
  clientName, 
  selectedVersion, 
  fiscalYear 
}: A07ControlStatementProps) {
  const { controlStatement, summary, isLoading } = useA07ControlStatement(
    clientId, 
    selectedVersion, 
    fiscalYear
  );
  const [showMappingDialog, setShowMappingDialog] = useState(false);

  const handleExportControlStatement = () => {
    const exportData = controlStatement.map(row => ({
      'Kontonummer': row.accountNumber,
      'Kontonavn': row.accountName,
      'Saldobalanse (NOK)': row.trialBalanceAmount,
      'A07 Rapportert (NOK)': row.a07Amount,
      'Differanse (NOK)': row.difference,
      'Differanse (%)': `${row.differencePercentage.toFixed(2)}%`,
      'Har mapping': row.hasMapping ? 'Ja' : 'Nei',
      'A07 Koder': row.mappedA07Codes.join(', '),
    }));

    exportArrayToXlsx(
      `A07_Kontrolloppstilling_${clientName}_${fiscalYear || 'alle_år'}`,
      exportData
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>A07 Kontrolloppstilling</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Laster kontrolloppstilling...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              A07 Kontrolloppstilling
              {summary.significantDifferences > 0 && (
                <Badge variant="destructive" className="ml-2">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {summary.significantDifferences} avvik
                </Badge>
              )}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMappingDialog(true)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Mappinger
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportControlStatement}
                disabled={controlStatement.length === 0}
              >
                <FileDown className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">Total Saldobalanse</div>
              <div className="font-semibold">{formatCurrency(summary.totalTrialBalance)}</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">Total A07</div>
              <div className="font-semibold">{formatCurrency(summary.totalA07)}</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">Total Differanse</div>
              <div className={`font-semibold ${Math.abs(summary.totalDifference) > 1000 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {formatCurrency(summary.totalDifference)}
              </div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">Umappede kontoer</div>
              <div className="font-semibold text-warning">
                {summary.unmappedAccounts} av {summary.totalAccounts}
              </div>
            </div>
          </div>

          {/* Control Statement Table */}
          {controlStatement.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2 font-medium">Konto</th>
                    <th className="text-left p-2 font-medium">Kontonavn</th>
                    <th className="text-right p-2 font-medium">Saldobalanse</th>
                    <th className="text-right p-2 font-medium">A07 Rapportert</th>
                    <th className="text-right p-2 font-medium">Differanse</th>
                    <th className="text-center p-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {controlStatement.map((row) => (
                    <tr key={row.accountNumber} className="border-b hover:bg-muted/25">
                      <td className="p-2 font-mono">{row.accountNumber}</td>
                      <td className="p-2">{row.accountName}</td>
                      <td className="p-2 text-right font-mono">
                        {formatCurrency(row.trialBalanceAmount)}
                      </td>
                      <td className="p-2 text-right font-mono">
                        {formatCurrency(row.a07Amount)}
                      </td>
                      <td className={`p-2 text-right font-mono ${
                        Math.abs(row.difference) > 1000 ? 'text-destructive font-semibold' : ''
                      }`}>
                        {formatCurrency(row.difference)}
                        {Math.abs(row.differencePercentage) > 0.1 && (
                          <div className="text-xs text-muted-foreground">
                            ({row.differencePercentage.toFixed(1)}%)
                          </div>
                        )}
                      </td>
                      <td className="p-2 text-center">
                        {row.hasMapping ? (
                          <div className="flex items-center justify-center gap-1">
                            <CheckCircle className="w-4 h-4 text-success" />
                            <Badge variant="outline" className="text-xs">
                              {row.mappedA07Codes.join(', ')}
                            </Badge>
                          </div>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Ingen mapping
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Ingen data tilgjengelig for kontrolloppstilling.
              <div className="text-sm mt-2">
                Kontroller at både saldobalanse og A07-data er lastet inn.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <A07AccountMappingDialog
        open={showMappingDialog}
        onOpenChange={setShowMappingDialog}
        clientId={clientId}
      />
    </>
  );
}