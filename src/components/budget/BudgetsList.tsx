import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Calculator, Edit, Trash2, Play, BarChart3 } from 'lucide-react';
import { useBudgetManagement } from '@/hooks/useBudgetManagement';
import { BudgetForm } from './BudgetForm';
import { BudgetLinesView } from './BudgetLinesView';
import { formatCurrency } from '@/lib/utils';

interface BudgetsListProps {
  clientId: string;
}

export function BudgetsList({ clientId }: BudgetsListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [viewingBudgetLines, setViewingBudgetLines] = useState<any>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { 
    budgets, 
    budgetsLoading, 
    budgetSummary,
    deleteBudget, 
    activateBudget,
    isDeleting,
    isActivating
  } = useBudgetManagement(clientId, selectedYear);

  const handleEdit = (budget: any) => {
    setEditingBudget(budget);
    setShowForm(true);
  };

  const handleViewLines = (budget: any) => {
    setViewingBudgetLines(budget);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingBudget(null);
  };

  const handleCloseLinesView = () => {
    setViewingBudgetLines(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'submitted': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'closed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktiv';
      case 'approved': return 'Godkjent';
      case 'submitted': return 'Innsendt';
      case 'draft': return 'Utkast';
      case 'closed': return 'Lukket';
      default: return status;
    }
  };

  const getBudgetTypeText = (type: string) => {
    switch (type) {
      case 'operating': return 'Drift';
      case 'capital': return 'Investering';
      case 'cash_flow': return 'Kontantstrøm';
      case 'master': return 'Hovedbudsjett';
      default: return type;
    }
  };

  if (showForm) {
    return (
      <BudgetForm
        clientId={clientId}
        budget={editingBudget}
        onCancel={handleCloseForm}
        onSuccess={handleCloseForm}
      />
    );
  }

  if (viewingBudgetLines) {
    return (
      <BudgetLinesView
        budget={viewingBudgetLines}
        onBack={handleCloseLinesView}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {budgetSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{budgetSummary.total_budgets}</div>
              <p className="text-muted-foreground">Totalt budsjetter</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{budgetSummary.active_budgets}</div>
              <p className="text-muted-foreground">Aktive budsjetter</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{formatCurrency(budgetSummary.total_revenue_budget)}</div>
              <p className="text-muted-foreground">Budsjettert inntekt</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{formatCurrency(budgetSummary.projected_net_income)}</div>
              <p className="text-muted-foreground">Forventet resultat</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Budsjetter for {selectedYear}
            </CardTitle>
            <div className="flex gap-2">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-1 border rounded-md"
              >
                {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nytt budsjett
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {budgetsLoading ? (
            <div className="text-center py-8">Laster budsjetter...</div>
          ) : !budgets || budgets.length === 0 ? (
            <div className="text-center py-8">
              <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Ingen budsjetter funnet</h3>
              <p className="text-muted-foreground mb-4">
                Opprett ditt første budsjett for {selectedYear}
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Opprett budsjett
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Budsjettnavn</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead>Inntekter</TableHead>
                  <TableHead>Kostnader</TableHead>
                  <TableHead>Resultat</TableHead>
                  <TableHead>Handlinger</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgets.map((budget) => (
                  <TableRow key={budget.id}>
                    <TableCell className="font-medium">
                      {budget.budget_name}
                      {budget.is_active && (
                        <Badge className="ml-2 bg-green-100 text-green-800">Aktiv</Badge>
                      )}
                    </TableCell>
                    <TableCell>{getBudgetTypeText(budget.budget_type)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(budget.status)}>
                        {getStatusText(budget.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(budget.start_date).toLocaleDateString('nb-NO')} - {' '}
                      {new Date(budget.end_date).toLocaleDateString('nb-NO')}
                    </TableCell>
                    <TableCell>{formatCurrency(budget.total_revenue)}</TableCell>
                    <TableCell>{formatCurrency(budget.total_expenses)}</TableCell>
                    <TableCell className={budget.net_income >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(budget.net_income)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewLines(budget)}
                          title="Vis budsjettlinjer"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(budget)}
                          title="Rediger budsjett"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!budget.is_active && budget.status === 'approved' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => activateBudget(budget.id)}
                            disabled={isActivating}
                            title="Aktiver budsjett"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteBudget(budget.id)}
                          disabled={isDeleting}
                          title="Slett budsjett"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}