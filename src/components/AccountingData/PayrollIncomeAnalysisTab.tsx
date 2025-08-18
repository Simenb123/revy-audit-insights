import React from 'react';
import { formatCurrency } from '@/lib/utils';
import { usePayrollIncomeByType } from '@/hooks/usePayrollDetailedData';

interface PayrollIncomeAnalysisTabProps {
  importId: string;
}

const PayrollIncomeAnalysisTab = ({ importId }: PayrollIncomeAnalysisTabProps) => {
  const { data: incomeByType, isLoading } = usePayrollIncomeByType(importId);

  if (isLoading) {
    return <div className="text-center py-4">Laster inntektsanalyse...</div>;
  }

  if (!incomeByType || incomeByType.length === 0) {
    return <div className="text-center py-4">Ingen inntektsdata funnet.</div>;
  }

  // Group by income type and calculate totals
  const incomeGroups = incomeByType.reduce((acc, item) => {
    if (!acc[item.income_type]) {
      acc[item.income_type] = {
        description: item.income_description,
        total: 0,
        benefit_type: item.benefit_type,
        triggers_aga: item.triggers_aga,
        subject_to_tax_withholding: item.subject_to_tax_withholding,
        entries: []
      };
    }
    acc[item.income_type].total += item.total_amount;
    acc[item.income_type].entries.push(item);
    return acc;
  }, {} as Record<string, any>);

  const totalIncome = Object.values(incomeGroups).reduce((sum: number, group: any) => sum + group.total, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-2">Total inntekt</h3>
          <p className="text-2xl font-bold text-primary">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-2">Inntektstyper</h3>
          <p className="text-2xl font-bold text-primary">{Object.keys(incomeGroups).length}</p>
        </div>
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-2">AGA-pliktig inntekt</h3>
          <p className="text-2xl font-bold text-primary">
            {formatCurrency(
              Object.values(incomeGroups).reduce((sum: number, group: any) => 
                sum + (group.triggers_aga ? group.total : 0), 0
              )
            )}
          </p>
        </div>
      </div>

      {/* Detailed table */}
      <div className="max-h-96 overflow-auto border rounded-lg">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Inntektstype
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total beløp
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Type ytelse
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                AGA-pliktig
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Trekkpliktig
              </th>
            </tr>
          </thead>
          <tbody className="bg-background divide-y divide-border">
            {Object.entries(incomeGroups)
              .sort(([, a], [, b]) => (b as any).total - (a as any).total)
              .map(([type, group]) => (
                <tr key={type} className="hover:bg-muted/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {(group as any).description || type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono">
                    {formatCurrency((group as any).total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      (group as any).benefit_type === 'kontantytelse' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {(group as any).benefit_type === 'kontantytelse' ? 'Kontant' : 'Natural'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      (group as any).triggers_aga 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {(group as any).triggers_aga ? 'Ja' : 'Nei'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      (group as any).subject_to_tax_withholding 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {(group as any).subject_to_tax_withholding ? 'Ja' : 'Nei'}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PayrollIncomeAnalysisTab;