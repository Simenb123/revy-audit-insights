import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, FileDown } from 'lucide-react';
import { A07Row } from '@/modules/payroll/lib/a07-parser';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface EmployeeGroup {
  employeeId: string;
  employeeName: string;
  totalAmount: number;
  incomeRows: A07Row[];
}

interface EmployeeAccordionViewProps {
  incomeRows: A07Row[];
  onExport?: () => void;
}

export function EmployeeAccordionView({ incomeRows, onExport }: EmployeeAccordionViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const employeeGroups = useMemo((): EmployeeGroup[] => {
    const groups = incomeRows.reduce((acc, row) => {
      const key = row.ansattFnr;
      if (!acc[key]) {
        acc[key] = {
          employeeId: key,
          employeeName: row.navn,
          totalAmount: 0,
          incomeRows: []
        };
      }
      acc[key].totalAmount += row.beloep;
      acc[key].incomeRows.push(row);
      return acc;
    }, {} as Record<string, EmployeeGroup>);

    return Object.values(groups).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [incomeRows]);

  const filteredGroups = useMemo(() => {
    if (!searchTerm) return employeeGroups;
    return employeeGroups.filter(group =>
      group.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.employeeId.includes(searchTerm) ||
      group.incomeRows.some(row => 
        row.beskrivelse.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.fordel.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [employeeGroups, searchTerm]);

  const handleExpandAll = () => {
    setExpandedItems(employeeGroups.map(g => g.employeeId));
  };

  const handleCollapseAll = () => {
    setExpandedItems([]);
  };

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

      {/* Employee Accordion */}
      <Accordion 
        type="multiple" 
        value={expandedItems} 
        onValueChange={setExpandedItems}
        className="space-y-2"
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
                        {group.incomeRows.length} poster
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              
              <AccordionContent>
                <div className="px-4 pb-4">
                  <div className="space-y-3">
                    {group.incomeRows.map((row, index) => (
                      <div
                        key={`${row.ansattFnr}-${index}`}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                      >
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div>
                            <div className="font-medium text-sm">{row.beskrivelse}</div>
                            <div className="text-xs text-muted-foreground">{row.fordel}</div>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={row.trekkpliktig ? 'default' : 'secondary'} className="text-xs">
                              Trekkpliktig: {row.trekkpliktig ? 'Ja' : 'Nei'}
                            </Badge>
                            <Badge variant={row.aga ? 'default' : 'secondary'} className="text-xs">
                              AGA: {row.aga ? 'Ja' : 'Nei'}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(row.beloep)}</div>
                            {row.antall && (
                              <div className="text-xs text-muted-foreground">
                                Antall: {row.antall}
                              </div>
                            )}
                          </div>
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