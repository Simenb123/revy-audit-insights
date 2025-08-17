import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Edit, Trash2, Save } from 'lucide-react';
import { useBudgetManagement } from '@/hooks/useBudgetManagement';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface BudgetLinesViewProps {
  budget: any;
  onBack: () => void;
}

interface BudgetLineFormData {
  account_number: string;
  account_name: string;
  account_type: 'revenue' | 'expense' | 'asset' | 'liability' | 'equity';
  budget_category?: string;
  jan_amount: number;
  feb_amount: number;
  mar_amount: number;
  apr_amount: number;
  may_amount: number;
  jun_amount: number;
  jul_amount: number;
  aug_amount: number;
  sep_amount: number;
  oct_amount: number;
  nov_amount: number;
  dec_amount: number;
}

export function BudgetLinesView({ budget, onBack }: BudgetLinesViewProps) {
  const { 
    createBudgetLine, 
    updateBudgetLine, 
    deleteBudgetLine, 
    isCreatingLine, 
    isUpdatingLine, 
    isDeletingLine 
  } = useBudgetManagement(budget.client_id);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLine, setEditingLine] = useState<any>(null);
  const [formData, setFormData] = useState<BudgetLineFormData>({
    account_number: '',
    account_name: '',
    account_type: 'revenue',
    budget_category: '',
    jan_amount: 0,
    feb_amount: 0,
    mar_amount: 0,
    apr_amount: 0,
    may_amount: 0,
    jun_amount: 0,
    jul_amount: 0,
    aug_amount: 0,
    sep_amount: 0,
    oct_amount: 0,
    nov_amount: 0,
    dec_amount: 0,
  });

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun',
    'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Des'
  ];

  const monthKeys = [
    'jan_amount', 'feb_amount', 'mar_amount', 'apr_amount', 'may_amount', 'jun_amount',
    'jul_amount', 'aug_amount', 'sep_amount', 'oct_amount', 'nov_amount', 'dec_amount'
  ] as const;

  const handleEdit = (line: any) => {
    setEditingLine(line);
    setFormData({
      account_number: line.account_number,
      account_name: line.account_name,
      account_type: line.account_type,
      budget_category: line.budget_category || '',
      jan_amount: line.jan_amount || 0,
      feb_amount: line.feb_amount || 0,
      mar_amount: line.mar_amount || 0,
      apr_amount: line.apr_amount || 0,
      may_amount: line.may_amount || 0,
      jun_amount: line.jun_amount || 0,
      jul_amount: line.jul_amount || 0,
      aug_amount: line.aug_amount || 0,
      sep_amount: line.sep_amount || 0,
      oct_amount: line.oct_amount || 0,
      nov_amount: line.nov_amount || 0,
      dec_amount: line.dec_amount || 0,
    });
    setShowAddForm(true);
  };

  const handleSave = async () => {
    try {
      if (editingLine) {
        updateBudgetLine({
          ...formData,
          id: editingLine.id,
          budget_id: budget.id
        });
      } else {
        createBudgetLine({
          ...formData,
          budget_id: budget.id
        });
      }
      
      toast.success(editingLine ? 'Budsjettlinje oppdatert' : 'Budsjettlinje opprettet');
      setShowAddForm(false);
      setEditingLine(null);
      resetForm();
    } catch (error) {
      toast.error('Det oppstod en feil');
      console.error('Budget line save error:', error);
    }
  };

  const handleDelete = async (lineId: string) => {
    if (window.confirm('Er du sikker på at du vil slette denne budsjettlinjen?')) {
      try {
        deleteBudgetLine({ lineId, budgetId: budget.id });
        toast.success('Budsjettlinje slettet');
      } catch (error) {
        toast.error('Det oppstod en feil ved sletting');
        console.error('Budget line delete error:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      account_number: '',
      account_name: '',
      account_type: 'revenue',
      budget_category: '',
      jan_amount: 0,
      feb_amount: 0,
      mar_amount: 0,
      apr_amount: 0,
      may_amount: 0,
      jun_amount: 0,
      jul_amount: 0,
      aug_amount: 0,
      sep_amount: 0,
      oct_amount: 0,
      nov_amount: 0,
      dec_amount: 0,
    });
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingLine(null);
    resetForm();
  };

  const budgetLines = budget.budget_lines || [];

  // Calculate totals
  const revenueTotal = budgetLines
    .filter((line: any) => line.account_type === 'revenue')
    .reduce((sum: number, line: any) => sum + (line.total_annual_amount || 0), 0);

  const expenseTotal = budgetLines
    .filter((line: any) => line.account_type === 'expense')
    .reduce((sum: number, line: any) => sum + (line.total_annual_amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tilbake til budsjetter
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{budget.budget_name}</h1>
          <p className="text-muted-foreground">
            Budsjettlinjer for {budget.budget_year}
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(revenueTotal)}</div>
            <p className="text-muted-foreground">Total inntekt</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{formatCurrency(expenseTotal)}</div>
            <p className="text-muted-foreground">Total kostnader</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className={`text-2xl font-bold ${revenueTotal - expenseTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(revenueTotal - expenseTotal)}
            </div>
            <p className="text-muted-foreground">Netto resultat</p>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingLine ? 'Rediger budsjettlinje' : 'Ny budsjettlinje'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium">Kontonummer</label>
                <Input
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  placeholder="1000"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Kontonavn</label>
                <Input
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  placeholder="Salgsinntekt"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Kontotype</label>
                <Select 
                  value={formData.account_type}
                  onValueChange={(value) => setFormData({ ...formData, account_type: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Inntekt</SelectItem>
                    <SelectItem value="expense">Kostnad</SelectItem>
                    <SelectItem value="asset">Eiendel</SelectItem>
                    <SelectItem value="liability">Gjeld</SelectItem>
                    <SelectItem value="equity">Egenkapital</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Kategori</label>
                <Input
                  value={formData.budget_category}
                  onChange={(e) => setFormData({ ...formData, budget_category: e.target.value })}
                  placeholder="Salg, Markedsføring, etc."
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Månedlige beløp</label>
              <div className="grid grid-cols-6 gap-2">
                {monthKeys.map((key, index) => (
                  <div key={key}>
                    <label className="text-xs text-muted-foreground">{monthNames[index]}</label>
                    <Input
                      type="number"
                      value={formData[key]}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        [key]: parseFloat(e.target.value) || 0 
                      })}
                      className="text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleCancel}>
                Avbryt
              </Button>
              <Button 
                onClick={handleSave}
                disabled={isCreatingLine || isUpdatingLine}
              >
                <Save className="h-4 w-4 mr-2" />
                {editingLine ? 'Oppdater' : 'Lagre'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Lines Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Budsjettlinjer</CardTitle>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Legg til linje
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {budgetLines.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Ingen budsjettlinjer lagt til ennå</p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Legg til første linje
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Konto</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Kategori</TableHead>
                    {monthNames.map(month => (
                      <TableHead key={month} className="text-right">{month}</TableHead>
                    ))}
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Handlinger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgetLines.map((line: any) => (
                    <TableRow key={line.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{line.account_number}</div>
                          <div className="text-sm text-muted-foreground">{line.account_name}</div>
                        </div>
                      </TableCell>
                      <TableCell>{line.account_type}</TableCell>
                      <TableCell>{line.budget_category || '-'}</TableCell>
                      {monthKeys.map(key => (
                        <TableCell key={key} className="text-right">
                          {formatCurrency(line[key] || 0)}
                        </TableCell>
                      ))}
                      <TableCell className="text-right font-medium">
                        {formatCurrency(line.total_annual_amount || 0)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(line)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(line.id)}
                            disabled={isDeletingLine}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}