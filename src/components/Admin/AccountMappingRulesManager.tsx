import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus, Upload, Download } from 'lucide-react';
import { toast } from 'sonner';
import { 
  useAccountMappingRules, 
  useCreateAccountMappingRule,
  useUpdateAccountMappingRule,
  useDeleteAccountMappingRule,
  AccountMappingRule
} from '@/hooks/useAccountMappingRules';
import { useStandardAccounts } from '@/hooks/useChartOfAccounts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface RuleFormData {
  rule_name: string;
  account_range_start: number;
  account_range_end: number;
  standard_account_id: string;
  confidence_score: number;
}

const AccountMappingRulesManager = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AccountMappingRule | null>(null);
  const [formData, setFormData] = useState<RuleFormData>({
    rule_name: '',
    account_range_start: 0,
    account_range_end: 0,
    standard_account_id: '',
    confidence_score: 0.9
  });

  const { data: rules, isLoading } = useAccountMappingRules();
  const { data: standardAccounts } = useStandardAccounts();
  const createRule = useCreateAccountMappingRule();
  const updateRule = useUpdateAccountMappingRule();
  const deleteRule = useDeleteAccountMappingRule();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingRule) {
      await updateRule.mutateAsync({ ...formData, id: editingRule.id });
    } else {
      await createRule.mutateAsync({
        ...formData,
        is_active: true
      });
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      rule_name: '',
      account_range_start: 0,
      account_range_end: 0,
      standard_account_id: '',
      confidence_score: 0.9
    });
    setEditingRule(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (rule: AccountMappingRule) => {
    setFormData({
      rule_name: rule.rule_name,
      account_range_start: rule.account_range_start,
      account_range_end: rule.account_range_end,
      standard_account_id: rule.standard_account_id,
      confidence_score: rule.confidence_score
    });
    setEditingRule(rule);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Er du sikker på at du vil deaktivere denne mappingregelen?')) {
      await deleteRule.mutateAsync(id);
    }
  };

  const handleCSVImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx,.xls';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        processCSVImport(file);
      }
    };
    input.click();
  };

  const processCSVImport = async (file: File) => {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    
    // Check if it matches your format: StartKonto, SluttKonto, Regnnr, Regnskapslinje
    const expectedHeaders = ['StartKonto', 'SluttKonto', 'Regnnr', 'Regnskapslinje'];
    const hasCorrectFormat = expectedHeaders.every(header => 
      headers.some(h => h.toLowerCase().includes(header.toLowerCase()))
    );
    
    if (!hasCorrectFormat) {
      toast.error('CSV-filen må ha kolonnene: StartKonto, SluttKonto, Regnnr, Regnskapslinje');
      return;
    }
    
    const rules = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length >= 4) {
        const startKonto = parseInt(values[0]);
        const sluttKonto = parseInt(values[1]);
        const regnnr = values[2];
        const regnskapslinje = values[3];
        
        // Find the standard account by number
        const standardAccount = standardAccounts?.find(a => a.standard_number === regnnr);
        if (standardAccount) {
          rules.push({
            rule_name: regnskapslinje,
            account_range_start: startKonto,
            account_range_end: sluttKonto,
            standard_account_id: standardAccount.id,
            confidence_score: 0.9,
            is_active: true
          });
        }
      }
    }
    
    // Bulk create rules
    for (const rule of rules) {
      try {
        await createRule.mutateAsync(rule);
      } catch (error) {
        console.error('Error creating rule:', error);
      }
    }
    
    toast.success(`Importerte ${rules.length} regler`);
  };

  const handleCSVExport = () => {
    if (!rules) return;
    
    const csvContent = [
      ['StartKonto', 'SluttKonto', 'Regnnr', 'Regnskapslinje'].join(','),
      ...rules.map(rule => {
        const standardAccount = standardAccounts?.find(a => a.id === rule.standard_account_id);
        return [
          rule.account_range_start,
          rule.account_range_end,
          standardAccount?.standard_number || '',
          standardAccount?.standard_name || ''
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kontomapping-intervaller.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <div>Laster mappingregler...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mappingregler</CardTitle>
          <CardDescription>
            Definer intervaller for automatisk mapping av kontoer til standardkontoplan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingRule(null)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ny regel
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingRule ? 'Rediger mappingregel' : 'Opprett ny mappingregel'}
                    </DialogTitle>
                    <DialogDescription>
                      Definer et kontonummerområde og hvilken standardkonto det skal mappes til
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="rule_name">Regelnavn</Label>
                      <Input
                        id="rule_name"
                        value={formData.rule_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, rule_name: e.target.value }))}
                        placeholder="F.eks. Driftsinntekter"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="account_range_start">Fra kontonummer</Label>
                        <Input
                          id="account_range_start"
                          type="number"
                          value={formData.account_range_start}
                          onChange={(e) => setFormData(prev => ({ ...prev, account_range_start: parseInt(e.target.value) }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="account_range_end">Til kontonummer</Label>
                        <Input
                          id="account_range_end"
                          type="number"
                          value={formData.account_range_end}
                          onChange={(e) => setFormData(prev => ({ ...prev, account_range_end: parseInt(e.target.value) }))}
                          required
                        />
                      </div>
                    </div>
                     <div>
                       <Label htmlFor="standard_account_id">Regnskapsnummer og navn</Label>
                       <Select
                         value={formData.standard_account_id}
                         onValueChange={(value) => setFormData(prev => ({ ...prev, standard_account_id: value }))}
                       >
                         <SelectTrigger>
                           <SelectValue placeholder="Velg regnskapslinje" />
                         </SelectTrigger>
                         <SelectContent>
                           {standardAccounts?.map(account => (
                             <SelectItem key={account.id} value={account.id}>
                               {account.standard_number} - {account.standard_name}
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={resetForm}>
                        Avbryt
                      </Button>
                      <Button type="submit">
                        {editingRule ? 'Oppdater' : 'Opprett'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCSVImport}>
                <Upload className="h-4 w-4 mr-2" />
                Importer CSV
              </Button>
              <Button variant="outline" onClick={handleCSVExport}>
                <Download className="h-4 w-4 mr-2" />
                Eksporter CSV
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {rules?.map(rule => (
              <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{rule.rule_name}</h3>
                    <Badge variant="secondary">
                      {rule.account_range_start} - {rule.account_range_end}
                    </Badge>
                  </div>
                   <p className="text-sm text-muted-foreground">
                     {standardAccounts?.find(a => a.id === rule.standard_account_id)?.standard_number} - {standardAccounts?.find(a => a.id === rule.standard_account_id)?.standard_name}
                   </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(rule)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(rule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {rules?.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Ingen mappingregler opprettet ennå</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountMappingRulesManager;