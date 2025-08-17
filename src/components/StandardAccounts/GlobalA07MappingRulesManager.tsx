import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Download, Upload, Trash2, Edit } from 'lucide-react';
import { useGlobalA07MappingRules, useSaveGlobalA07MappingRule, useUpdateGlobalA07MappingRule, useDeleteGlobalA07MappingRule } from '@/hooks/useGlobalA07MappingRules';
import { exportArrayToXlsx } from '@/utils/exportToXlsx';
import { parseXlsxSafely, getWorksheetDataSafely } from '@/utils/secureXlsx';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';

interface A07MappingRuleForm {
  rule_name: string;
  account_range_start: number;
  account_range_end: number;
  a07_performance_code: string;
  confidence_score: number;
}

export const GlobalA07MappingRulesManager = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);

  const { data: rules = [], isLoading } = useGlobalA07MappingRules();
  const saveRule = useSaveGlobalA07MappingRule();
  const updateRule = useUpdateGlobalA07MappingRule();
  const deleteRule = useDeleteGlobalA07MappingRule();

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<A07MappingRuleForm>();

  const handleSave = async (data: A07MappingRuleForm) => {
    try {
      if (editingRule) {
        await updateRule.mutateAsync({ id: editingRule.id, ...data });
      } else {
        await saveRule.mutateAsync({ ...data, is_active: true });
      }
      setIsDialogOpen(false);
      setEditingRule(null);
      reset();
    } catch (error) {
      console.error('Error saving A07 mapping rule:', error);
    }
  };

  const handleEdit = (rule: any) => {
    setEditingRule(rule);
    setValue('rule_name', rule.rule_name);
    setValue('account_range_start', rule.account_range_start);
    setValue('account_range_end', rule.account_range_end);
    setValue('a07_performance_code', rule.a07_performance_code);
    setValue('confidence_score', rule.confidence_score);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Er du sikker på at du vil slette denne A07 mappingregelen?')) {
      await deleteRule.mutateAsync(id);
    }
  };

  const handleExport = () => {
    const exportData = rules.map(rule => ({
      'Regelnavn': rule.rule_name,
      'Kontoområde fra': rule.account_range_start,
      'Kontoområde til': rule.account_range_end,
      'A07 ytelseskode': rule.a07_performance_code,
      'Konfidensverdi': rule.confidence_score
    }));

    exportArrayToXlsx('global-a07-mapping-rules', exportData);
    toast.success('A07 mappingregler eksportert til Excel');
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    try {
      const workbook = await parseXlsxSafely(file);
      const data = getWorksheetDataSafely(workbook);

      let imported = 0;
      for (const row of data.slice(1)) { // Skip header row
        if (row.A && row.B && row.C && row.D) { // Ensure required fields
          await saveRule.mutateAsync({
            rule_name: row.A,
            account_range_start: parseInt(row.B),
            account_range_end: parseInt(row.C),
            a07_performance_code: row.D,
            confidence_score: parseFloat(row.E) || 0.9,
            is_active: true
          });
          imported++;
        }
      }

      toast.success(`${imported} A07 mappingregler importert`);
    } catch (error) {
      toast.error(`Import feilet: ${error instanceof Error ? error.message : 'Ukjent feil'}`);
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  const openDialog = () => {
    setEditingRule(null);
    reset();
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <div>Laster A07 mappingregler...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Globale A07 Mappingregler</CardTitle>
        <CardDescription>
          Administrer globale mappingregler mellom kontonumre og A07 ytelseskoder
        </CardDescription>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Ny regel
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingRule ? 'Rediger A07 mappingregel' : 'Ny A07 mappingregel'}
                </DialogTitle>
                <DialogDescription>
                  Definer mappingen mellom kontoområde og A07 ytelseskode
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
                <div>
                  <Label htmlFor="rule_name">Regelnavn</Label>
                  <Input
                    id="rule_name"
                    {...register('rule_name', { required: 'Regelnavn er påkrevd' })}
                  />
                  {errors.rule_name && (
                    <p className="text-sm text-destructive">{errors.rule_name.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="account_range_start">Fra konto</Label>
                    <Input
                      id="account_range_start"
                      type="number"
                      {...register('account_range_start', { 
                        required: 'Fra konto er påkrevd',
                        valueAsNumber: true 
                      })}
                    />
                    {errors.account_range_start && (
                      <p className="text-sm text-destructive">{errors.account_range_start.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="account_range_end">Til konto</Label>
                    <Input
                      id="account_range_end"
                      type="number"
                      {...register('account_range_end', { 
                        required: 'Til konto er påkrevd',
                        valueAsNumber: true 
                      })}
                    />
                    {errors.account_range_end && (
                      <p className="text-sm text-destructive">{errors.account_range_end.message}</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="a07_performance_code">A07 ytelseskode</Label>
                  <Input
                    id="a07_performance_code"
                    {...register('a07_performance_code', { required: 'A07 ytelseskode er påkrevd' })}
                  />
                  {errors.a07_performance_code && (
                    <p className="text-sm text-destructive">{errors.a07_performance_code.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="confidence_score">Konfidensverdi (0-1)</Label>
                  <Input
                    id="confidence_score"
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    {...register('confidence_score', { 
                      valueAsNumber: true,
                      min: { value: 0, message: 'Minimum verdi er 0' },
                      max: { value: 1, message: 'Maksimum verdi er 1' }
                    })}
                  />
                  {errors.confidence_score && (
                    <p className="text-sm text-destructive">{errors.confidence_score.message}</p>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Avbryt
                  </Button>
                  <Button type="submit">
                    {editingRule ? 'Oppdater' : 'Lagre'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Eksporter
          </Button>

          <Button variant="outline" asChild>
            <label htmlFor="import-file" className="cursor-pointer">
              <Upload className="w-4 h-4 mr-2" />
              {isImporting ? 'Importerer...' : 'Importer'}
            </label>
          </Button>
          <input
            id="import-file"
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleImport}
            disabled={isImporting}
          />
        </div>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Regelnavn</TableHead>
              <TableHead>Kontoområde</TableHead>
              <TableHead>A07 ytelseskode</TableHead>
              <TableHead>Konfidensverdi</TableHead>
              <TableHead>Handlinger</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell className="font-medium">{rule.rule_name}</TableCell>
                <TableCell>
                  {rule.account_range_start} - {rule.account_range_end}
                </TableCell>
                <TableCell>{rule.a07_performance_code}</TableCell>
                <TableCell>{rule.confidence_score}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(rule)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(rule.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {rules.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Ingen A07 mappingregler funnet. Legg til en ny regel for å komme i gang.
          </div>
        )}
      </CardContent>
    </Card>
  );
};