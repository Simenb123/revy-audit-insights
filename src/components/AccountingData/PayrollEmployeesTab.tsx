import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());

  if (!employees || employees.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Ingen ansattdata funnet</p>
      </div>
    );
  }

  const filteredEmployees = employees.filter(employee => 
    employee.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.employee_data?.navn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    JSON.stringify(employee.employee_data).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleEmployeeExpansion = (employeeId: string) => {
    const newExpanded = new Set(expandedEmployees);
    if (newExpanded.has(employeeId)) {
      newExpanded.delete(employeeId);
    } else {
      newExpanded.add(employeeId);
    }
    setExpandedEmployees(newExpanded);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Ansattdata</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Detaljert informasjon om alle ansatte i A07-rapporten
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Søk etter ansatte..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h4 className="font-semibold mb-2">Totalt antall ansatte</h4>
          <p className="text-2xl font-bold">{employees.length}</p>
        </Card>
        <Card className="p-4">
          <h4 className="font-semibold mb-2">Filtrerte resultater</h4>
          <p className="text-2xl font-bold">{filteredEmployees.length}</p>
        </Card>
      </div>

      {/* Employee List */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Ansatt ID</TableHead>
              <TableHead>Navn</TableHead>
              <TableHead>Fødselsdato</TableHead>
              <TableHead>Kjønn</TableHead>
              <TableHead>Arbeidsforhold</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.map((employee) => (
              <>
                <TableRow key={employee.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
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
                  </TableCell>
                  <TableCell className="font-medium">{employee.employee_id}</TableCell>
                  <TableCell>
                    {employee.employee_data?.navn || 
                     `${employee.employee_data?.fornavn || ''} ${employee.employee_data?.etternavn || ''}`.trim() ||
                     'Ikke oppgitt'}
                  </TableCell>
                  <TableCell>{employee.employee_data?.foedselsdato || 'Ikke oppgitt'}</TableCell>
                  <TableCell>{employee.employee_data?.kjoenn || 'Ikke oppgitt'}</TableCell>
                  <TableCell>
                    {employee.employee_data?.arbeidsforhold?.length || 0} aktive
                  </TableCell>
                </TableRow>
                {expandedEmployees.has(employee.id) && (
                  <TableRow>
                    <TableCell colSpan={6} className="p-0">
                      <div className="p-4 bg-muted/25 space-y-4">
                        {/* Employee Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-semibold mb-2">Personopplysninger</h5>
                            <div className="text-sm space-y-1">
                              <div><strong>ID:</strong> {employee.employee_id}</div>
                              {employee.employee_data?.foedselsdato && (
                                <div><strong>Fødselsdato:</strong> {employee.employee_data.foedselsdato}</div>
                              )}
                              {employee.employee_data?.kjoenn && (
                                <div><strong>Kjønn:</strong> {employee.employee_data.kjoenn}</div>
                              )}
                              {employee.employee_data?.statsborgerskap && (
                                <div><strong>Statsborgerskap:</strong> {employee.employee_data.statsborgerskap}</div>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <h5 className="font-semibold mb-2">Arbeidsforhold</h5>
                            <div className="text-sm space-y-1">
                              {employee.employee_data?.arbeidsforhold?.map((work: any, index: number) => (
                                <div key={index} className="p-2 border rounded">
                                  <div><strong>Type:</strong> {work.type || 'Ikke oppgitt'}</div>
                                  <div><strong>Periode:</strong> {work.startdato} - {work.sluttdato || 'Pågående'}</div>
                                  {work.stillingsprosent && (
                                    <div><strong>Stillingsprosent:</strong> {work.stillingsprosent}%</div>
                                  )}
                                </div>
                              )) || <div>Ingen arbeidsforhold registrert</div>}
                            </div>
                          </div>
                        </div>

                        {/* Income Details */}
                        <EmployeeIncomeDetails employeeId={employee.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}