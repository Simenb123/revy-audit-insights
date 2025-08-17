import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Brain, 
  CheckCircle, 
  XCircle, 
  Edit,
  FileText,
  AlertCircle 
} from 'lucide-react';
import { 
  useAISuggestedPostings, 
  useAcceptAIPostingSuggestion,
  AISuggestedPosting 
} from '@/hooks/useAISuggestedPostings';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AISuggestedPostingsCardProps {
  documentId: string;
  clientId: string;
}

const AISuggestedPostingsCard: React.FC<AISuggestedPostingsCardProps> = ({
  documentId,
  clientId
}) => {
  const { data: suggestions, isLoading } = useAISuggestedPostings(documentId);
  const acceptSuggestion = useAcceptAIPostingSuggestion();
  const [isEditing, setIsEditing] = useState(false);
  const [modifiedEntries, setModifiedEntries] = useState<any[]>([]);

  // Fetch chart of accounts for editing
  const { data: chartOfAccounts } = useQuery({
    queryKey: ['chart-of-accounts', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_chart_of_accounts')
        .select('id, account_number, account_name, account_type')
        .eq('client_id', clientId)
        .order('account_number');

      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  const getStatusBadge = (status: AISuggestedPosting['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />Venter</Badge>;
      case 'accepted':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Akseptert</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Avvist</Badge>;
      case 'modified':
        return <Badge variant="outline"><Edit className="w-3 h-3 mr-1" />Modifisert</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleAccept = (suggestion: AISuggestedPosting) => {
    acceptSuggestion.mutate({
      suggestionId: suggestion.id,
      modifications: isEditing ? modifiedEntries : undefined
    });
  };

  const handleEdit = (suggestion: AISuggestedPosting) => {
    setModifiedEntries(suggestion.suggested_entries);
    setIsEditing(true);
  };

  const updateModifiedEntry = (index: number, field: string, value: any) => {
    setModifiedEntries(prev => 
      prev.map((entry, i) => 
        i === index ? { ...entry, [field]: value } : entry
      )
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Laster AI-forslag...</div>
        </CardContent>
      </Card>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Konteringsforslag
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Ingen AI-forslag tilgjengelig</p>
            <p className="text-sm">AI-forslag genereres automatisk når dokumenter analyseres</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {suggestions.map((suggestion) => (
        <Card key={suggestion.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI Konteringsforslag
                {getStatusBadge(suggestion.status)}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="w-4 h-4" />
                {suggestion.document?.file_name}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  Tillit: {Math.round(suggestion.confidence_score * 100)}%
                </span>
                <div className="w-full max-w-32 bg-muted rounded-full h-2 ml-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${suggestion.confidence_score * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Foreslåtte posteringer:</h4>
                {(isEditing ? modifiedEntries : suggestion.suggested_entries).map((entry: any, index: number) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center p-3 border rounded-lg">
                    {isEditing ? (
                      <>
                        <div className="col-span-4">
                          <Select
                            value={entry.account_id}
                            onValueChange={(value) => updateModifiedEntry(index, 'account_id', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Velg konto" />
                            </SelectTrigger>
                            <SelectContent>
                              {chartOfAccounts?.map(account => (
                                <SelectItem key={account.id} value={account.id}>
                                  {account.account_number} - {account.account_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-3">
                          <Input
                            value={entry.description || ''}
                            onChange={(e) => updateModifiedEntry(index, 'description', e.target.value)}
                            placeholder="Beskrivelse"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            value={entry.debit_amount || ''}
                            onChange={(e) => updateModifiedEntry(index, 'debit_amount', parseFloat(e.target.value) || 0)}
                            placeholder="Debet"
                            step="0.01"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            value={entry.credit_amount || ''}
                            onChange={(e) => updateModifiedEntry(index, 'credit_amount', parseFloat(e.target.value) || 0)}
                            placeholder="Kredit"
                            step="0.01"
                          />
                        </div>
                        <div className="col-span-1">
                          <Input
                            value={entry.vat_code || ''}
                            onChange={(e) => updateModifiedEntry(index, 'vat_code', e.target.value)}
                            placeholder="MVA"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="col-span-4">
                          <span className="font-medium">{entry.account_name || entry.account_number}</span>
                        </div>
                        <div className="col-span-3">
                          <span>{entry.description}</span>
                        </div>
                        <div className="col-span-2">
                          <span>{entry.debit_amount ? entry.debit_amount.toFixed(2) : '-'}</span>
                        </div>
                        <div className="col-span-2">
                          <span>{entry.credit_amount ? entry.credit_amount.toFixed(2) : '-'}</span>
                        </div>
                        <div className="col-span-1">
                          <span>{entry.vat_code || '-'}</span>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {suggestion.status === 'pending' && (
                <div className="flex justify-end gap-2">
                  {!isEditing ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => handleEdit(suggestion)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Rediger
                      </Button>
                      <Button
                        onClick={() => handleAccept(suggestion)}
                        disabled={acceptSuggestion.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Aksepter
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                      >
                        Avbryt
                      </Button>
                      <Button
                        onClick={() => handleAccept(suggestion)}
                        disabled={acceptSuggestion.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Aksepter endringer
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AISuggestedPostingsCard;