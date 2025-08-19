import { useState } from 'react';
import { Card } from '@/components/ui/card';
import StandardDataTable, { StandardDataTableColumn } from '@/components/ui/standard-data-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import { PayrollEmployee, usePayrollIncomeDetails } from '@/hooks/usePayrollDetailedData';
import { formatCurrency } from '@/lib/utils';

interface PayrollEmployeesTabProps {
  employees: PayrollEmployee[];
  importId: string;
}

function EmployeeIncomeDetails({ employeeId }: { employeeId: string }) {
  const { data: incomeDetails, isLoading } = usePayrollIncomeDetails(employeeId);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground p-2">Laster inntektsdetaljer...</div>;
  }

  if (!incomeDetails || incomeDetails.length === 0) {
    return <div className="text-sm text-muted-foreground p-2">Ingen inntektsdetaljer funnet</div>;
  }

  return (
    <div className="p-4 bg-muted/50 rounded">
      <h5 className="font-semibold mb-2">Inntektsdetaljer</h5>
      <div className="space-y-2">
        {incomeDetails.map((detail) => (
          <div key={detail.id} className="flex justify-between text-sm">
            <span>{detail.income_type} ({detail.period_year}-{String(detail.period_month).padStart(2, '0')})</span>
            <span className="font-medium">{formatCurrency(detail.amount)}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t">
        <div className="flex justify-between font-semibold">
          <span>Total:</span>
          <span>{formatCurrency(incomeDetails.reduce((sum, d) => sum + d.amount, 0))}</span>
        </div>
      </div>
    </div>
  );
}

export function PayrollEmployeesTab({ employees, importId }: PayrollEmployeesTabProps) {
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());

  if (!employees || employees.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Ingen ansattdata funnet</p>
      </div>
    );
  }

  const toggleEmployeeExpansion = (employeeId: string) => {
    const newExpanded = new Set(expandedEmployees);
    if (newExpanded.has(employeeId)) {
      newExpanded.delete(employeeId);
    } else {
      newExpanded.add(employeeId);
    }
    setExpandedEmployees(newExpanded);
  };

  const payrollColumns: StandardDataTableColumn<PayrollEmployee>[] = [
    {
      key: 'expand',
      header: '',
      accessor: () => '',
      format: (_, employee) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleEmployeeExpansion(employee.id)}
          className="p-0 h-6 w-6"
        >
          {expandedEmployees.has(employee.id) ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      )
    },
    {
      key: 'employee_id',
      header: 'Ansatt ID',
      accessor: 'employee_id',
      sortable: true,
      searchable: true,
      format: (value) => <span className="font-medium">{value}</span>
    },
    {
      key: 'name',
      header: 'Navn',
      accessor: (employee) => 
        employee.employee_data?.navn || 
        `${employee.employee_data?.fornavn || ''} ${employee.employee_data?.etternavn || ''}`.trim() ||
        'Ikke oppgitt',
      sortable: true,
      searchable: true
    },
    {
      key: 'birth_date',
      header: 'Fødselsdato',
      accessor: (employee) => employee.employee_data?.foedselsdato || 'Ikke oppgitt',
      align: 'center'
    },
    {
      key: 'gender',
      header: 'Kjønn',
      accessor: (employee) => employee.employee_data?.kjoenn || 'Ikke oppgitt',
      align: 'center'
    },
    {
      key: 'work_relations',
      header: 'Arbeidsforhold',
      accessor: (employee) => employee.employee_data?.arbeidsforhold?.length || 0,
      format: (value) => `${value} aktive`
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Ansattdata</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Detaljert informasjon om alle ansatte i A07-rapporten
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h4 className="font-semibold mb-2">Totalt antall ansatte</h4>
          <p className="text-2xl font-bold">{employees.length}</p>
        </Card>
      </div>

      <StandardDataTable
        title="Ansatte"
        description="Oversikt over alle ansatte i A07-rapporten"
        data={employees}
        columns={payrollColumns}
        tableName="payroll-employees"
        exportFileName="ansatte"
        maxBodyHeight="600px"
        // Custom row expansion logic would need to be handled differently
        // This is a simplified version - full expansion would require custom implementation
      />
    </div>
  );
}