import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, Zap, Check, X } from 'lucide-react';
import { useStandardAccounts } from '@/hooks/useChartOfAccounts';
import { useTrialBalanceMappings, useSaveTrialBalanceMapping, useBulkSaveTrialBalanceMappings } from '@/hooks/useTrialBalanceMappings';
import { useTrialBalanceData } from '@/hooks/useTrialBalanceData';
import { useAutoMapping, AutoMappingSuggestion } from '@/hooks/useAutoMapping';
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
  const { generateAutoMappingSuggestions, applyAutoMapping, isApplying } = useAutoMapping(clientId);
  const [bulkImportFile, setBulkImportFile] = useState<File | null>(null);
  const [showAutoMappingDialog, setShowAutoMappingDialog] = useState(false);
  const [autoMappingSuggestions, setAutoMappingSuggestions] = useState<AutoMappingSuggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());

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

  const handleAutoMapping = () => {
    const suggestions = generateAutoMappingSuggestions();
    if (suggestions.length === 0) {
      toast({
        title: "Ingen forslag",
        description: "Ingen automatiske mapping-forslag kunne genereres for umappede kontoer",
        variant: "destructive"
      });
      return;
    }
    
    setAutoMappingSuggestions(suggestions);
    setSelectedSuggestions(new Set(suggestions.map(s => s.accountNumber)));
    setShowAutoMappingDialog(true);
  };

  const handleApplySelectedSuggestions = () => {
    const selectedSuggestionsArray = autoMappingSuggestions.filter(s => 
      selectedSuggestions.has(s.accountNumber)
    );
    
    if (selectedSuggestionsArray.length === 0) {
      toast({
        title: "Ingen forslag valgt",
        description: "Velg minst ett forslag for å fortsette",
        variant: "destructive"
      });
      return;
    }

    applyAutoMapping.mutate(selectedSuggestionsArray, {
      onSuccess: () => {
        setShowAutoMappingDialog(false);
        setAutoMappingSuggestions([]);
        setSelectedSuggestions(new Set());
      }
    });
  };

  const toggleSuggestionSelection = (accountNumber: string) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(accountNumber)) {
      newSelected.delete(accountNumber);
    } else {
      newSelected.add(accountNumber);
    }
    setSelectedSuggestions(newSelected);
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800 border-green-200';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
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
                onClick={handleAutoMapping}
                disabled={isApplying || unmappedCount === 0}
              >
                <Zap className="w-4 h-4 mr-2" />
                Automatisk mapping
              </Button>
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

      {/* Auto Mapping Suggestions Dialog */}
      <Dialog open={showAutoMappingDialog} onOpenChange={setShowAutoMappingDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Automatiske Mapping-forslag</DialogTitle>
            <DialogDescription>
              Gjennomgå og velg hvilke automatiske mappinger du vil anvende. 
              Høyere confidence score indikerer mer pålitelige forslag.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {selectedSuggestions.size} av {autoMappingSuggestions.length} forslag valgt
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSuggestions(new Set(autoMappingSuggestions.map(s => s.accountNumber)))}
                >
                  Velg alle
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSuggestions(new Set())}
                >
                  Fjern alle
                </Button>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="text-left p-3 w-12"></th>
                    <th className="text-left p-3">Konto</th>
                    <th className="text-left p-3">Foreslått mapping</th>
                    <th className="text-left p-3">Confidence</th>
                    <th className="text-left p-3">Grunn</th>
                  </tr>
                </thead>
                <tbody>
                  {autoMappingSuggestions.map((suggestion) => {
                    const isSelected = selectedSuggestions.has(suggestion.accountNumber);
                    const standardAccount = standardAccounts?.find(acc => acc.standard_number === suggestion.suggestedMapping);
                    
                    return (
                      <tr key={suggestion.accountNumber} className="border-b hover:bg-muted/30">
                        <td className="p-3">
                          <Button
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleSuggestionSelection(suggestion.accountNumber)}
                            className="w-8 h-8 p-0"
                          >
                            {isSelected ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          </Button>
                        </td>
                        <td className="p-3">
                          <div>
                            <div className="font-mono text-sm">{suggestion.accountNumber}</div>
                            <div className="text-sm text-muted-foreground">{suggestion.accountName}</div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div>
                            <div className="font-mono text-sm">{suggestion.suggestedMapping}</div>
                            <div className="text-sm text-muted-foreground">
                              {standardAccount?.standard_name}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge className={getConfidenceColor(suggestion.confidence)}>
                            {Math.round(suggestion.confidence * 100)}%
                          </Badge>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {suggestion.reason}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAutoMappingDialog(false)}
              >
                Avbryt
              </Button>
              <Button
                onClick={handleApplySelectedSuggestions}
                disabled={isApplying || selectedSuggestions.size === 0}
              >
                {isApplying ? "Lagrer..." : `Anvend ${selectedSuggestions.size} mappinger`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrialBalanceMappingTable;