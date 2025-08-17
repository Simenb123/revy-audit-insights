import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { 
  useReconciliationSuggestions, 
  useAcceptReconciliationSuggestion, 
  useRejectReconciliationSuggestion 
} from '@/hooks/useBankReconciliation';
import { Check, X, AlertCircle } from 'lucide-react';

interface BankReconciliationPanelProps {
  clientId: string;
}

export const BankReconciliationPanel = ({ clientId }: BankReconciliationPanelProps) => {
  const { data: suggestions, isLoading } = useReconciliationSuggestions(clientId);
  const acceptSuggestion = useAcceptReconciliationSuggestion();
  const rejectSuggestion = useRejectReconciliationSuggestion();

  const handleAccept = (suggestionId: string) => {
    acceptSuggestion.mutate(suggestionId);
  };

  const handleReject = (suggestionId: string) => {
    rejectSuggestion.mutate(suggestionId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Avstemmingsforslag</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Avstemmingsforslag</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Ingen avstemmingsforslag tilgjengelig</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Avstemmingsforslag
          <Badge variant="outline">{suggestions.length} forslag</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.map((suggestion) => (
          <div key={suggestion.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="secondary">
                Konfidensgrad: {Math.round(suggestion.confidence_score * 100)}%
              </Badge>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAccept(suggestion.id)}
                  disabled={acceptSuggestion.isPending}
                  className="text-green-600 border-green-600 hover:bg-green-50"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Godkjenn
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReject(suggestion.id)}
                  disabled={rejectSuggestion.isPending}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-1" />
                  Avvis
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Bank Transaction */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Banktransaksjon</h4>
                <div className="bg-muted/50 p-3 rounded text-sm space-y-1">
                  <p><span className="font-medium">Dato:</span> {new Date(suggestion.bank_transaction?.transaction_date || '').toLocaleDateString('nb-NO')}</p>
                  <p><span className="font-medium">Beskrivelse:</span> {suggestion.bank_transaction?.description}</p>
                  <p><span className="font-medium">Beløp:</span> {formatCurrency(suggestion.bank_transaction?.amount || 0)}</p>
                  {suggestion.bank_transaction?.reference_number && (
                    <p><span className="font-medium">Referanse:</span> {suggestion.bank_transaction.reference_number}</p>
                  )}
                </div>
              </div>

              {/* Journal Entry Line */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Journalpost</h4>
                <div className="bg-muted/50 p-3 rounded text-sm space-y-1">
                  {suggestion.journal_entry_line?.account && (
                    <p><span className="font-medium">Konto:</span> {suggestion.journal_entry_line.account.account_number} - {suggestion.journal_entry_line.account.account_name}</p>
                  )}
                  {suggestion.journal_entry_line?.description && (
                    <p><span className="font-medium">Beskrivelse:</span> {suggestion.journal_entry_line.description}</p>
                  )}
                  <p><span className="font-medium">Debet:</span> {formatCurrency(suggestion.journal_entry_line?.debit_amount || 0)}</p>
                  <p><span className="font-medium">Kredit:</span> {formatCurrency(suggestion.journal_entry_line?.credit_amount || 0)}</p>
                </div>
              </div>
            </div>

            {suggestion.match_reason && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Match årsak:</span> {suggestion.match_reason}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};