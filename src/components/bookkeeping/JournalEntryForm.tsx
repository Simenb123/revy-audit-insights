import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import { useCreateJournalEntry, CreateJournalEntryData, JournalEntryLine } from '@/hooks/useJournalEntries';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface JournalEntryFormProps {
  clientId: string;
  onSuccess?: () => void;
  defaultData?: Partial<CreateJournalEntryData>;
}

const JournalEntryForm: React.FC<JournalEntryFormProps> = ({
  clientId,
  onSuccess,
  defaultData
}) => {
  const [formData, setFormData] = useState<CreateJournalEntryData>({
    client_id: clientId,
    voucher_date: new Date().toISOString().split('T')[0],
    description: '',
    lines: [
      { line_number: 1, account_id: '', description: '', debit_amount: 0, credit_amount: 0, vat_code: '', vat_amount: 0 },
      { line_number: 2, account_id: '', description: '', debit_amount: 0, credit_amount: 0, vat_code: '', vat_amount: 0 }
    ],
    ...defaultData
  });

  const createJournalEntry = useCreateJournalEntry();

  // Fetch chart of accounts
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

  const calculateTotals = () => {
    const totalDebit = formData.lines.reduce((sum, line) => sum + (line.debit_amount || 0), 0);
    const totalCredit = formData.lines.reduce((sum, line) => sum + (line.credit_amount || 0), 0);
    return { totalDebit, totalCredit, isBalanced: totalDebit === totalCredit };
  };

  const addLine = () => {
    setFormData(prev => ({
      ...prev,
      lines: [
        ...prev.lines,
        {
          line_number: prev.lines.length + 1,
          account_id: '',
          description: '',
          debit_amount: 0,
          credit_amount: 0,
          vat_code: '',
          vat_amount: 0
        }
      ]
    }));
  };

  const removeLine = (index: number) => {
    if (formData.lines.length <= 2) {
      toast.error('Et bilag må ha minst to posteringslinjer');
      return;
    }

    setFormData(prev => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index).map((line, i) => ({
        ...line,
        line_number: i + 1
      }))
    }));
  };

  const updateLine = (index: number, field: keyof Omit<JournalEntryLine, 'id' | 'journal_entry_id'>, value: any) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.map((line, i) => 
        i === index ? { ...line, [field]: value } : line
      )
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const { isBalanced } = calculateTotals();
    if (!isBalanced) {
      toast.error('Debet og kredit må være i balanse');
      return;
    }

    // Validate that all lines have accounts
    const invalidLines = formData.lines.filter(line => !line.account_id);
    if (invalidLines.length > 0) {
      toast.error('Alle linjer må ha en konto valgt');
      return;
    }

    createJournalEntry.mutate(formData, {
      onSuccess: () => {
        onSuccess?.();
        // Reset form
        setFormData({
          client_id: clientId,
          voucher_date: new Date().toISOString().split('T')[0],
          description: '',
          lines: [
            { line_number: 1, account_id: '', description: '', debit_amount: 0, credit_amount: 0, vat_code: '', vat_amount: 0 },
            { line_number: 2, account_id: '', description: '', debit_amount: 0, credit_amount: 0, vat_code: '', vat_amount: 0 }
          ]
        });
      }
    });
  };

  const { totalDebit, totalCredit, isBalanced } = calculateTotals();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nytt bilag</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="voucher_date">Bilagsdato</Label>
              <Input
                id="voucher_date"
                type="date"
                value={formData.voucher_date}
                onChange={(e) => setFormData(prev => ({ ...prev, voucher_date: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Beskrivelse</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Beskrivelse av bilaget"
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Posteringslinjer</h3>
              <Button type="button" onClick={addLine} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Legg til linje
              </Button>
            </div>

            <div className="space-y-3">
              {formData.lines.map((line, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center p-3 border rounded-lg">
                  <div className="col-span-3">
                    <Select
                      value={line.account_id}
                      onValueChange={(value) => updateLine(index, 'account_id', value)}
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
                      placeholder="Beskrivelse"
                      value={line.description || ''}
                      onChange={(e) => updateLine(index, 'description', e.target.value)}
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Debet"
                      step="0.01"
                      value={line.debit_amount || ''}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        updateLine(index, 'debit_amount', value);
                        if (value > 0) updateLine(index, 'credit_amount', 0);
                      }}
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Kredit"
                      step="0.01"
                      value={line.credit_amount || ''}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        updateLine(index, 'credit_amount', value);
                        if (value > 0) updateLine(index, 'debit_amount', 0);
                      }}
                    />
                  </div>
                  
                  <div className="col-span-1">
                    <Input
                      placeholder="MVA"
                      value={line.vat_code || ''}
                      onChange={(e) => updateLine(index, 'vat_code', e.target.value)}
                    />
                  </div>
                  
                  <div className="col-span-1">
                    {formData.lines.length > 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeLine(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center p-3 border rounded-lg bg-muted/50">
              <span className="font-semibold">Totaler:</span>
              <div className="flex gap-4">
                <span>Debet: {totalDebit.toFixed(2)}</span>
                <span>Kredit: {totalCredit.toFixed(2)}</span>
                <span className={`font-semibold ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                  {isBalanced ? 'I balanse' : `Differanse: ${(totalDebit - totalCredit).toFixed(2)}`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="submit"
              disabled={!isBalanced || createJournalEntry.isPending}
            >
              {createJournalEntry.isPending ? 'Oppretter...' : 'Opprett bilag'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default JournalEntryForm;