
import React from 'react';
import ConstrainedWidth from '@/components/Layout/ConstrainedWidth';
import StandardPageLayout from '@/components/Layout/StandardPageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useClientTeams } from '@/hooks/useClientTeams';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { usePageTitle } from '@/components/Layout/PageTitleContext';
import { useUtilizationAnalytics } from '@/hooks/useUtilizationAnalytics';

const months = [
  { value: '1', label: 'Jan' },
  { value: '2', label: 'Feb' },
  { value: '3', label: 'Mar' },
  { value: '4', label: 'Apr' },
  { value: '5', label: 'Mai' },
  { value: '6', label: 'Jun' },
  { value: '7', label: 'Jul' },
  { value: '8', label: 'Aug' },
  { value: '9', label: 'Sep' },
  { value: '10', label: 'Okt' },
  { value: '11', label: 'Nov' },
  { value: '12', label: 'Des' },
];

const ResourcePlanner: React.FC = () => {
  const { setPageTitle } = usePageTitle();
  const { selectedFiscalYear } = useFiscalYear();
  const { data: teams = [] } = useClientTeams();
  const [selectedTeamId, setSelectedTeamId] = React.useState<string | undefined>(undefined);
  const [selectedMonth, setSelectedMonth] = React.useState<string>('1');

  React.useEffect(() => {
    setPageTitle('Ressursplanlegger');
  }, [setPageTitle]);

  React.useEffect(() => {
    if (!selectedTeamId && teams.length > 0) setSelectedTeamId(teams[0].id);
  }, [teams, selectedTeamId]);

  const monthNum = Number(selectedMonth);
  const { data } = useUtilizationAnalytics(selectedTeamId, selectedFiscalYear, monthNum);

  return (
    <ConstrainedWidth width="full">
      <StandardPageLayout
        header={
          <header>
            <h1 className="text-3xl font-bold">Ressursplanlegger – bemanning og kapasitetsstyring</h1>
            <p className="text-muted-foreground mt-1">Planlegg kapasitet per teammedlem for valgt måned og år.</p>
          </header>
        }
      >
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Filter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Team</label>
                <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Velg team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Måned</label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Utnyttelse {selectedFiscalYear} – {months.find(m => m.value === selectedMonth)?.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Medarbeider</TableHead>
                      <TableHead className="text-right">Kapasitet (t)</TableHead>
                      <TableHead className="text-right">Fordelt (t)</TableHead>
                      <TableHead className="text-right">Utnyttelse</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.rows || []).map((r) => (
                      <TableRow key={r.userId}>
                        <TableCell>{r.name}</TableCell>
                        <TableCell className="text-right">{r.capacityHours?.toFixed(1)}</TableCell>
                        <TableCell className="text-right">{r.allocatedHours?.toFixed(1)}</TableCell>
                        <TableCell className="text-right">
                          {r.utilizationPct === null ? '—' : `${(r.utilizationPct * 100).toFixed(0)}%`}
                        </TableCell>
                      </TableRow>
                    ))}
                    {data && (
                      <TableRow>
                        <TableCell className="font-medium">Totalt</TableCell>
                        <TableCell className="text-right font-medium">{data.totals.capacityHours.toFixed(1)}</TableCell>
                        <TableCell className="text-right font-medium">{data.totals.allocatedHours.toFixed(1)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {data.totals.utilizationPct === null ? '—' : `${(data.totals.utilizationPct * 100).toFixed(0)}%`}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>
      </StandardPageLayout>
    </ConstrainedWidth>
  );
};

export default ResourcePlanner;
