import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { usePayrollRawData } from '@/hooks/usePayrollDetailedData';
import { extractEmployeeIncomeRows } from '@/modules/payroll/lib/a07-parser';
import { formatCurrency } from '@/lib/utils';
import { EmployeeAccordionView } from './EmployeeAccordionView';
import * as XLSX from 'xlsx';

interface PayrollEmployeesTabProps {
  importId: string;
}

export function PayrollEmployeesTab({ importId }: PayrollEmployeesTabProps) {
  const { data: rawData, isLoading } = usePayrollRawData(importId);

  const incomeRows = useMemo(() => {
    if (!rawData?.raw_json) return [];
    const result = extractEmployeeIncomeRows(rawData.raw_json);
    return result.rows || [];
  }, [rawData]);

  const summary = useMemo(() => {
    const uniqueEmployees = new Set(incomeRows.map(row => row.ansattFnr)).size;
    const totalAmount = incomeRows.reduce((sum, row) => sum + row.beloep, 0);
    const uniqueIncomeTypes = new Set(incomeRows.map(row => row.beskrivelse)).size;
    
    return {
      uniqueEmployees,
      totalAmount,
      uniqueIncomeTypes,
      totalRows: incomeRows.length
    };
  }, [incomeRows]);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Laster ansattdata...</p>
      </div>
    );
  }

  if (!rawData?.raw_json || incomeRows.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Ingen ansattdata funnet</p>
      </div>
    );
  }

  const handleExport = () => {
    if (!incomeRows.length) return;

    const exportData = incomeRows.map(row => ({
      'Orgnr': row.orgnr,
      'Ansatt FNR': row.ansattFnr,
      'Navn': row.navn,
      'Beskrivelse': row.beskrivelse,
      'Fordel': row.fordel,
      'Beløp': row.beloep,
      'Antall': row.antall || '',
      'Trekkpliktig': row.trekkpliktig ? 'Ja' : 'Nei',
      'AGA': row.aga ? 'Ja' : 'Nei'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'A07 Inntektsdetaljer');
    XLSX.writeFile(wb, 'a07-inntektsdetaljer.xlsx');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">A07 Inntektsdetaljer</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Detaljert oversikt over alle inntektsposter per ansatt fra A07-rapporten
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <h4 className="font-semibold mb-2">Antall ansatte</h4>
          <p className="text-2xl font-bold">{summary.uniqueEmployees}</p>
        </Card>
        <Card className="p-4">
          <h4 className="font-semibold mb-2">Totalt beløp</h4>
          <p className="text-2xl font-bold">{formatCurrency(summary.totalAmount)}</p>
        </Card>
        <Card className="p-4">
          <h4 className="font-semibold mb-2">Inntektstyper</h4>
          <p className="text-2xl font-bold">{summary.uniqueIncomeTypes}</p>
        </Card>
        <Card className="p-4">
          <h4 className="font-semibold mb-2">Totalt antall poster</h4>
          <p className="text-2xl font-bold">{summary.totalRows}</p>
        </Card>
      </div>

      <EmployeeAccordionView
        incomeRows={incomeRows}
        onExport={handleExport}
      />
    </div>
  );
}