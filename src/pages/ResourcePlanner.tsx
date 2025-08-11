
import React from 'react';
import ConstrainedWidth from '@/components/Layout/ConstrainedWidth';
import StandardPageLayout from '@/components/Layout/StandardPageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useClientTeams } from '@/hooks/useClientTeams';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { usePageTitle } from '@/components/Layout/PageTitleContext';
import { useUtilizationAnalytics } from '@/hooks/useUtilizationAnalytics';
import { useEmployeeCapacityForTeam, useUpsertEmployeeCapacity } from '@/hooks/useEmployeeCapacity';
import { useTeamAllocations } from '@/hooks/useTeamAllocations';
import { useSaveTeamAllocations } from '@/hooks/useSaveTeamAllocations';
import { useClientList } from '@/hooks/useClientList';
import KPICards from '@/components/ResourcePlanner/KPICards';
import TaskBoard from '@/components/ResourcePlanner/TaskBoard';

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

// Kapasitet hooks og state
const { data: capRows = [] } = useEmployeeCapacityForTeam(selectedTeamId, selectedFiscalYear, monthNum);
const upsertCapacity = useUpsertEmployeeCapacity();
const [capacityByUser, setCapacityByUser] = React.useState<Record<string, { cap: number; abs: number }>>({});

// Allokering hooks og state
const { data: allocations = [] } = useTeamAllocations(selectedTeamId, selectedFiscalYear);
const saveAllocations = useSaveTeamAllocations();
const { data: clients = [] } = useClientList();
const [selectedClient, setSelectedClient] = React.useState<string | undefined>(undefined);
const [budgetByUser, setBudgetByUser] = React.useState<Record<string, number>>({});

// Sync selected client once clients are loaded
React.useEffect(() => {
  if (!selectedClient && clients.length > 0) setSelectedClient(clients[0].id);
}, [clients, selectedClient]);

// Init capacity state from fetched data and analytics fallback
React.useEffect(() => {
  const map: Record<string, { cap: number; abs: number }> = {};
  (data?.rows || []).forEach((r) => {
    const cap = (capRows as any[]).find((c: any) => c.user_id === r.userId);
    map[r.userId] = {
      cap: typeof cap?.capacity_hours === 'number' ? cap.capacity_hours : (r.capacityHours ?? 0),
      abs: typeof cap?.absence_hours === 'number' ? cap.absence_hours : 0,
    };
  });
  setCapacityByUser(map);
}, [capRows, data]);

// Init budget state for selected client
React.useEffect(() => {
  if (!selectedClient) return;
  const map: Record<string, number> = {};
  (data?.rows || []).forEach((r) => {
    const row = (allocations as any[]).find((a: any) => a.client_id === selectedClient && a.user_id === r.userId);
    map[r.userId] = typeof row?.budget_hours === 'number' ? row.budget_hours : 0;
  });
  setBudgetByUser(map);
}, [allocations, selectedClient, data]);

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
        <section className="grid grid-cols-1 gap-4 md:gap-6">
          {/* KPI-kort */}
          <KPICards totals={data?.totals} />

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

          {/* Oppgaveboard */}
          <TaskBoard teamId={selectedTeamId} year={selectedFiscalYear} month={monthNum} />

          <Card className="md:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between">
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

          <Card className="md:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Kapasitetsplan {selectedFiscalYear} – {months.find(m => m.value === selectedMonth)?.label}</CardTitle>
              <Button
                variant="default"
                onClick={() => {
                  const rows = Object.entries(capacityByUser).map(([userId, v]) => ({
                    user_id: userId,
                    period_year: selectedFiscalYear,
                    period_month: monthNum,
                    capacity_hours: Number(isNaN(v.cap) ? 0 : v.cap),
                    absence_hours: Number(isNaN(v.abs) ? 0 : v.abs),
                  }));
                  (upsertCapacity as any).mutate(rows as any);
                }}
              >Lagre kapasitet</Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Medarbeider</TableHead>
                      <TableHead className="text-right">Kapasitet (t)</TableHead>
                      <TableHead className="text-right">Fravær (t)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.rows || []).map((r) => (
                      <TableRow key={r.userId}>
                        <TableCell>{r.name}</TableCell>
                        <TableCell className="text-right">
                          <Input
                            inputMode="decimal"
                            value={capacityByUser[r.userId]?.cap ?? ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setCapacityByUser((prev) => ({
                                ...prev,
                                [r.userId]: { cap: isNaN(val) ? 0 : val, abs: prev[r.userId]?.abs ?? 0 },
                              }));
                            }}
                            className="w-24 ml-auto text-right"
                            aria-label={`Kapasitet timer for ${r.name}`}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            inputMode="decimal"
                            value={capacityByUser[r.userId]?.abs ?? ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setCapacityByUser((prev) => ({
                                ...prev,
                                [r.userId]: { cap: prev[r.userId]?.cap ?? 0, abs: isNaN(val) ? 0 : val },
                              }));
                            }}
                            className="w-24 ml-auto text-right"
                            aria-label={`Fravær timer for ${r.name}`}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-3">
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <CardTitle>Fordeling (budsjett) {selectedFiscalYear}</CardTitle>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <label className="text-sm text-muted-foreground">Klient</label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger className="w-[260px]">
                    <SelectValue placeholder="Velg klient" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.company_name || c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="default"
                  onClick={() => {
                    if (!selectedClient || !selectedTeamId) return;
                    const rows = Object.entries(budgetByUser).map(([userId, hours]) => ({
                      client_id: selectedClient,
                      team_id: selectedTeamId,
                      user_id: userId,
                      period_year: selectedFiscalYear,
                      budget_hours: Number(isNaN(Number(hours)) ? 0 : hours),
                    }));
                    (saveAllocations as any).mutate(rows as any);
                  }}
                >Lagre budsjett</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Medarbeider</TableHead>
                      <TableHead className="text-right">Budsjett (t)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.rows || []).map((r) => (
                      <TableRow key={r.userId}>
                        <TableCell>{r.name}</TableCell>
                        <TableCell className="text-right">
                          <Input
                            inputMode="decimal"
                            value={budgetByUser[r.userId] ?? ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setBudgetByUser((prev) => ({ ...prev, [r.userId]: isNaN(val) ? 0 : val }));
                            }}
                            className="w-24 ml-auto text-right"
                            aria-label={`Budsjett timer for ${r.name}`}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        
        </section>
        </section>
      </StandardPageLayout
      >
    </ConstrainedWidth>
  );
};

export default ResourcePlanner;
