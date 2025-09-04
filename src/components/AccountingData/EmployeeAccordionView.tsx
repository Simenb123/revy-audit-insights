import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, FileDown, Eye } from 'lucide-react';
import { A07Row } from '@/modules/payroll/lib/a07-parser';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import StandardDataTable, { StandardDataTableColumn } from '@/components/ui/standard-data-table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface IncomeTypeGroup {
  beskrivelse: string;
  fordel: string;
  totalAmount: number;
  count: number;
  rows: A07Row[];
}

interface EmployeeGroup {
  employeeId: string;
  employeeName: string;
  totalAmount: number;
  totalRows: number;
  incomeTypeGroups: IncomeTypeGroup[];
}

interface EmployeeAccordionViewProps {
  incomeRows: A07Row[];
  onExport?: () => void;
}

export function EmployeeAccordionView({ incomeRows, onExport }: EmployeeAccordionViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const employeeGroups = useMemo((): EmployeeGroup[] => {
    const employeeMap = incomeRows.reduce((acc, row) => {
      const key = row.ansattFnr;
      if (!acc[key]) {
        acc[key] = {
          employeeId: key,
          employeeName: row.navn,
          totalAmount: 0,
          totalRows: 0,
          incomeTypeGroups: []
        };
      }
      acc[key].totalAmount += row.beloep;
      acc[key].totalRows += 1;
      return acc;
    }, {} as Record<string, Omit<EmployeeGroup, 'incomeTypeGroups'> & { incomeTypeGroups: IncomeTypeGroup[] }>);

    // Group income rows by type within each employee
    Object.keys(employeeMap).forEach(employeeId => {
      const employeeRows = incomeRows.filter(row => row.ansattFnr === employeeId);
      const typeGroups = employeeRows.reduce((acc, row) => {
        const typeKey = `${row.beskrivelse}-${row.fordel}`;
        if (!acc[typeKey]) {
          acc[typeKey] = {
            beskrivelse: row.beskrivelse,
            fordel: row.fordel,
            totalAmount: 0,
            count: 0,
            rows: []
          };
        }
        acc[typeKey].totalAmount += row.beloep;
        acc[typeKey].count += 1;
        acc[typeKey].rows.push(row);
        return acc;
      }, {} as Record<string, IncomeTypeGroup>);

      employeeMap[employeeId].incomeTypeGroups = Object.values(typeGroups)
        .sort((a, b) => b.totalAmount - a.totalAmount);
    });

    return Object.values(employeeMap).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [incomeRows]);

  const filteredGroups = useMemo(() => {
    if (!searchTerm) return employeeGroups;
    return employeeGroups.filter(group =>
      group.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.employeeId.includes(searchTerm) ||
      group.incomeTypeGroups.some(typeGroup => 
        typeGroup.beskrivelse.toLowerCase().includes(searchTerm.toLowerCase()) ||
        typeGroup.fordel.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [employeeGroups, searchTerm]);

  const handleExpandAll = () => {
    setExpandedItems(employeeGroups.map(g => g.employeeId));
  };

  const handleCollapseAll = () => {
    setExpandedItems([]);
  };

  // Create columns for detailed view
  const detailColumns: StandardDataTableColumn<A07Row>[] = [
    {
      key: 'beskrivelse',
      header: 'Beskrivelse',
      accessor: 'beskrivelse',
    },
    {
      key: 'fordel',
      header: 'Fordel',
      accessor: 'fordel',
    },
    {
      key: 'beloep',
      header: 'Beløp',
      accessor: 'beloep',
      align: 'right',
      format: (value) => formatCurrency(value),
    },
    {
      key: 'antall',
      header: 'Antall',
      accessor: 'antall',
      align: 'right',
    },
    {
      key: 'trekkpliktig',
      header: 'Trekkpliktig',
      accessor: 'trekkpliktig',
      format: (value) => (
        <Badge variant={value ? 'default' : 'secondary'} className="text-xs">
          {value ? 'Ja' : 'Nei'}
        </Badge>
      ),
    },
    {
      key: 'aga',
      header: 'AGA',
      accessor: 'aga',
      format: (value) => (
        <Badge variant={value ? 'default' : 'secondary'} className="text-xs">
          {value ? 'Ja' : 'Nei'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Søk etter ansatt, FNR eller inntektstype..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExpandAll}>
            Utvid alle
          </Button>
          <Button variant="outline" size="sm" onClick={handleCollapseAll}>
            Lukk alle
          </Button>
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <FileDown className="h-4 w-4 mr-2" />
              Eksporter
            </Button>
          )}
        </div>
      </div>

      {/* Scrollable Employee Accordion */}
      <ScrollArea className="h-[600px] w-full">
        <Accordion 
          type="multiple" 
          value={expandedItems} 
          onValueChange={setExpandedItems}
          className="space-y-2 pr-4"
        >
          {filteredGroups.map((group) => (
            <AccordionItem key={group.employeeId} value={group.employeeId}>
              <Card>
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center justify-between w-full mr-4">
                    <div className="flex items-center gap-3">
                      <div className="font-medium text-left">
                        {group.employeeName}
                      </div>
                      <div className="text-sm text-muted-foreground font-mono">
                        {group.employeeId}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-semibold text-primary">
                          {formatCurrency(group.totalAmount)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {group.totalRows} poster
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent>
                  <div className="px-4 pb-4">
                    <div className="space-y-2">
                      {group.incomeTypeGroups.map((typeGroup, index) => (
                        <div
                          key={`${typeGroup.beskrivelse}-${typeGroup.fordel}-${index}`}
                          className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-4">
                              <div>
                                <div className="font-medium text-sm">{typeGroup.beskrivelse}</div>
                                <div className="text-xs text-muted-foreground">{typeGroup.fordel}</div>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>({typeGroup.count} poster)</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="font-semibold">{formatCurrency(typeGroup.totalAmount)}</div>
                            </div>
                            {typeGroup.count > 1 && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[80vh]">
                                  <DialogHeader>
                                    <DialogTitle>
                                      {typeGroup.beskrivelse} - {group.employeeName}
                                    </DialogTitle>
                                  </DialogHeader>
                                  <div className="mt-4">
                                    <StandardDataTable
                                      data={typeGroup.rows}
                                      columns={detailColumns}
                                      tableName={`${typeGroup.beskrivelse}-${group.employeeName}`}
                                      title={`${typeGroup.beskrivelse} detaljer`}
                                      maxBodyHeight="50vh"
                                      pageSize={25}
                                      enablePagination={typeGroup.rows.length > 25}
                                    />
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </AccordionContent>
              </Card>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollArea>

      {filteredGroups.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Ingen ansatte funnet med søkekriteriet "{searchTerm}"
          </p>
        </div>
      )}
    </div>
  );
}