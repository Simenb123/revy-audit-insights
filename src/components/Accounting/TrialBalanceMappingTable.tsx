import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload } from 'lucide-react';
import { useStandardAccounts } from '@/hooks/useChartOfAccounts';
import { useTrialBalanceMappings, useSaveTrialBalanceMapping, useBulkSaveTrialBalanceMappings } from '@/hooks/useTrialBalanceMappings';
import { useTrialBalanceData } from '@/hooks/useTrialBalanceData';
import { toast } from '@/hooks/use-toast';
import { processExcelFile, processCSVFile } from '@/utils/fileProcessing';

interface TrialBalanceMappingTableProps {
  clientId: string;
  onComplete: () => void;
}

interface BulkMappingData {
  account_number: string;
  statement_line_number: string;
}

const TrialBalanceMappingTable = ({ clientId, onComplete }: TrialBalanceMappingTableProps) => {
  const { data: standardAccounts } = useStandardAccounts();
  const { data: mappings = [] } = useTrialBalanceMappings(clientId);
  const { data: trialBalanceData } = useTrialBalanceData(clientId);
  const saveMapping = useSaveTrialBalanceMapping();
  const bulkSaveMapping = useBulkSaveTrialBalanceMappings();
  const [bulkImportFile, setBulkImportFile] = useState<File | null>(null);

  // Create a map of existing mappings for quick lookup
  const mappingMap = new Map(
    mappings.map(m => [m.account_number, m.statement_line_number])
  );

  // Get standard accounts options for the select
  const statementLineOptions = standardAccounts?.map(acc => ({
    value: acc.standard_number,
    label: `${acc.standard_number} - ${acc.standard_name}`
  })) || [];

  const handleMappingChange = (accountNumber: string, statementLineNumber: string) => {
    saveMapping.mutate({
      clientId,
      accountNumber,
      statementLineNumber
    });
  };

  const handleBulkImport = async (file: File) => {
    try {
      const extension = file.name.toLowerCase().split('.').pop();
      let preview;
      
      if (extension === 'csv') {
        preview = await processCSVFile(file);
      } else if (['xlsx', 'xls'].includes(extension || '')) {
        preview = await processExcelFile(file);
      } else {
        toast({
          title: "Ugyldig filtype",
          description: "Kun CSV og Excel-filer er støttet",
          variant: "destructive"
        });
        return;
      }

      // Parse the data - expect 2 columns: account_number, statement_line_number
      const mappingData: BulkMappingData[] = [];
      
      preview.allRows.forEach((row: any[]) => {
        if (row.length >= 2 && row[0] && row[1]) {
          mappingData.push({
            account_number: row[0].toString().trim(),
            statement_line_number: row[1].toString().trim()
          });
        }
      });

      if (mappingData.length === 0) {
        toast({
          title: "Ingen mappinger funnet",
          description: "Filen må inneholde minst 2 kolonner: kontonummer og regnskapslinje",
          variant: "destructive"
        });
        return;
      }

      // Validate statement line numbers exist
      const validStatementLines = new Set(standardAccounts?.map(acc => acc.standard_number) || []);
      const invalidMappings = mappingData.filter(m => !validStatementLines.has(m.statement_line_number));
      
      if (invalidMappings.length > 0) {
        toast({
          title: "Ugyldige regnskapslinjer",
          description: `${invalidMappings.length} mappinger har ugyldige regnskapslinjenummer`,
          variant: "destructive"
        });
        return;
      }

      // Save bulk mappings
      await bulkSaveMapping.mutateAsync({
        clientId,
        mappings: mappingData.map(m => ({
          accountNumber: m.account_number,
          statementLineNumber: m.statement_line_number
        }))
      });

      setBulkImportFile(null);
      
    } catch (error) {
      console.error('Bulk import error:', error);
      toast({
        title: "Feil ved import",
        description: "Kunne ikke importere mappinger fra fil",
        variant: "destructive"
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setBulkImportFile(file);
      handleBulkImport(file);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!trialBalanceData) {
    return <div>Laster saldobalanse...</div>;
  }

  const mappedCount = mappings.length;
  const totalCount = trialBalanceData.length;
  const unmappedCount = totalCount - mappedCount;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Saldobalanse Mapping</CardTitle>
              <p className="text-sm text-muted-foreground">
                Map kontoer til standardregnskapslinjer for rapportering
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">
                {mappedCount}/{totalCount} mapped
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('bulk-import-file')?.click()}
                disabled={bulkSaveMapping.isPending}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import mappinger
              </Button>
              <input
                id="bulk-import-file"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {unmappedCount > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  {unmappedCount} kontoer mangler mapping til regnskapslinjer. 
                  Disse vil ikke være inkludert i finansielle rapporter.
                </p>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Kontonummer</th>
                    <th className="text-left p-2">Kontonavn</th>
                    <th className="text-right p-2">Saldo</th>
                    <th className="text-left p-2">Regnskapslinje</th>
                  </tr>
                </thead>
                <tbody>
                  {trialBalanceData.map((account) => {
                    const currentMapping = mappingMap.get(account.account_number);
                    const isMapped = !!currentMapping;
                    
                    return (
                      <tr key={account.account_number} className="border-b">
                        <td className="p-2 font-mono text-sm">{account.account_number}</td>
                        <td className="p-2">{account.account_name}</td>
                        <td className="p-2 text-right font-mono">
                          {formatAmount(account.closing_balance)}
                        </td>
                        <td className="p-2">
                          {isMapped ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="default">
                                {currentMapping}
                              </Badge>
                              <Select
                                value={currentMapping}
                                onValueChange={(value) => handleMappingChange(account.account_number, value)}
                              >
                                <SelectTrigger className="w-[200px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {statementLineOptions.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ) : (
                            <Select
                              value=""
                              onValueChange={(value) => handleMappingChange(account.account_number, value)}
                            >
                              <SelectTrigger className="w-[300px]">
                                <SelectValue placeholder="Velg regnskapslinje..." />
                              </SelectTrigger>
                              <SelectContent>
                                {statementLineOptions.map(option => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-4">
              <div className="text-sm text-muted-foreground">
                Bulk import format: CSV eller Excel med 2 kolonner - Kontonummer, Regnskapslinje
              </div>
              <Button onClick={onComplete}>
                Fortsett til rapport
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrialBalanceMappingTable;