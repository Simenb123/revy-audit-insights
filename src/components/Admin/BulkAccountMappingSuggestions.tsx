import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Wand2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { 
  useAccountMappingSuggestions,
  useGenerateAccountMappingSuggestions,
  useApproveMappingSuggestions,
  AccountMappingSuggestion
} from '@/hooks/useAccountMappingRules';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface BulkAccountMappingSuggestionsProps {
  clientId: string;
}

const BulkAccountMappingSuggestions = ({ clientId }: BulkAccountMappingSuggestionsProps) => {
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  
  const { data: suggestions, isLoading } = useAccountMappingSuggestions(clientId);
  const generateSuggestions = useGenerateAccountMappingSuggestions();
  const approveSuggestions = useApproveMappingSuggestions();

  const pendingSuggestions = suggestions?.filter(s => s.status === 'pending') || [];
  const approvedSuggestions = suggestions?.filter(s => s.status === 'approved') || [];

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSuggestions(pendingSuggestions.map(s => s.id));
    } else {
      setSelectedSuggestions([]);
    }
  };

  const handleSelectSuggestion = (suggestionId: string, checked: boolean) => {
    if (checked) {
      setSelectedSuggestions(prev => [...prev, suggestionId]);
    } else {
      setSelectedSuggestions(prev => prev.filter(id => id !== suggestionId));
    }
  };

  const handleGenerateSuggestions = async () => {
    await generateSuggestions.mutateAsync(clientId);
  };

  const handleApproveSuggestions = async () => {
    if (selectedSuggestions.length === 0) return;
    
    await approveSuggestions.mutateAsync({
      suggestionIds: selectedSuggestions,
      clientId
    });
    
    setSelectedSuggestions([]);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Venter';
      case 'approved':
        return 'Godkjent';
      case 'rejected':
        return 'Avvist';
      default:
        return status;
    }
  };

  if (isLoading) {
    return <div>Laster mappingforslag...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Automatiske mappingforslag</CardTitle>
          <CardDescription>
            Generer og godkjenn forslag til kontomapping basert på definerte regler
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <Button 
                onClick={handleGenerateSuggestions}
                disabled={generateSuggestions.isPending}
              >
                <Wand2 className="h-4 w-4 mr-2" />
                {generateSuggestions.isPending ? 'Genererer...' : 'Generer forslag'}
              </Button>
              {selectedSuggestions.length > 0 && (
                <Button 
                  onClick={handleApproveSuggestions}
                  disabled={approveSuggestions.isPending}
                  variant="default"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Godkjenn valgte ({selectedSuggestions.length})
                </Button>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {pendingSuggestions.length} ventende forslag, {approvedSuggestions.length} godkjente
            </div>
          </div>

          {suggestions && suggestions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    {pendingSuggestions.length > 0 && (
                      <Checkbox
                        checked={selectedSuggestions.length === pendingSuggestions.length}
                        onCheckedChange={handleSelectAll}
                      />
                    )}
                  </TableHead>
                  <TableHead>Kontonummer</TableHead>
                  <TableHead>Kontonavn</TableHead>
                  <TableHead>Foreslått standardkonto</TableHead>
                  <TableHead>Konfidensgrad</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suggestions.map((suggestion: any) => (
                  <TableRow key={suggestion.id}>
                    <TableCell>
                      {suggestion.status === 'pending' && (
                        <Checkbox
                          checked={selectedSuggestions.includes(suggestion.id)}
                          onCheckedChange={(checked) => 
                            handleSelectSuggestion(suggestion.id, checked as boolean)
                          }
                        />
                      )}
                    </TableCell>
                    <TableCell className="font-mono">
                      {suggestion.client_chart_of_accounts?.account_number}
                    </TableCell>
                    <TableCell>
                      {suggestion.client_chart_of_accounts?.account_name}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-mono text-sm">
                          {suggestion.standard_accounts?.standard_number}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {suggestion.standard_accounts?.standard_name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {(suggestion.confidence_score * 100).toFixed(0)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(suggestion.status)}
                        <span className="text-sm">
                          {getStatusText(suggestion.status)}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Ingen mappingforslag funnet. Klikk "Generer forslag" for å starte.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BulkAccountMappingSuggestions;