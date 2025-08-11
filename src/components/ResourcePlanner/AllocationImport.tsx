import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FileDropZone from '@/components/common/FileDropZone';
import { parseAllocationFile, ParsedAllocationRow } from '@/utils/allocationImportParser';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useClientTeams } from '@/hooks/useClientTeams';
import { useQuery } from '@tanstack/react-query';

interface ClientRecord { id: string; org_number: string; company_name?: string; }
interface ProfileRecord { id: string; first_name?: string; last_name?: string; email?: string; }

function computeInitials(first?: string | null, last?: string | null) {
  const f = (first || '').trim();
  const l = (last || '').trim();
  return (f[0] || '').toUpperCase() + (l[0] || '').toUpperCase();
}

export default function AllocationImport() {
  const { toast } = useToast();
  const [rows, setRows] = useState<ParsedAllocationRow[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  type ImportMode = 'append' | 'replace';
  type ValidationIssue = { type: 'missing-client' | 'missing-user' | 'over-capacity'; message: string; key?: string; details?: any };
  type ValidationSummary = { totalRecords: number; uniqueUsers: number; months: number[]; issues: ValidationIssue[] };

  const [importMode, setImportMode] = useState<ImportMode>('append');
  const [validation, setValidation] = useState<ValidationSummary | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const { data: teams } = useClientTeams();

  // Load clients and profiles for mapping
  const { data: clients = [] } = useQuery<ClientRecord[]>({
    queryKey: ['all-clients-for-import'],
    queryFn: async () => {
      const { data, error } = await supabase.from('clients').select('id, org_number, company_name');
      if (error) throw error;
      return data as ClientRecord[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: profiles = [] } = useQuery<ProfileRecord[]>({
    queryKey: ['all-profiles-for-import'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, first_name, last_name, email');
      if (error) throw error;
      return data as ProfileRecord[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const mapping = useMemo(() => {
    const clientsByOrg = new Map<string, ClientRecord>();
    for (const c of clients) clientsByOrg.set((c.org_number || '').replace(/\s/g, ''), c);

    const profilesByEmail = new Map<string, ProfileRecord>();
    const profilesByInitials = new Map<string, ProfileRecord[]>();
    const profilesById = new Map<string, ProfileRecord>();

    for (const p of profiles) {
      if (p.email) profilesByEmail.set(p.email.toLowerCase(), p);
      profilesById.set(p.id, p);
      const ini = computeInitials(p.first_name, p.last_name);
      if (!profilesByInitials.has(ini)) profilesByInitials.set(ini, []);
      profilesByInitials.get(ini)!.push(p);
    }

    return { clientsByOrg, profilesByEmail, profilesByInitials, profilesById };
  }, [clients, profiles]);

  const preview = rows.slice(0, 5);

  async function handleFiles(files: File[]) {
    const file = files[0];
    if (!file) return;
    setIsParsing(true);
    try {
      const parsed = await parseAllocationFile(file);
      setRows(parsed);
      // If file contains a year, prefer most common
      const years = parsed.map(r => r.year).filter(Boolean) as number[];
      if (years.length) {
        const freq = years.reduce<Record<number, number>>((acc, y) => { acc[y] = (acc[y] || 0) + 1; return acc; }, {});
        const best = Object.entries(freq).sort((a,b)=>b[1]-a[1])[0]?.[0];
        if (best) setSelectedYear(Number(best));
      }
      toast({ title: 'Fil lest', description: `Fant ${parsed.length} rader` });
    } catch (e: any) {
      toast({ title: 'Kunne ikke lese filen', description: e?.message || 'Ukjent feil', variant: 'destructive' });
    } finally {
      setIsParsing(false);
    }
  }

  function resolveUserId(key: string): string | null {
    const k = key.trim();
    if (!k) return null;
    if (k.includes('@')) return mapping.profilesByEmail.get(k.toLowerCase())?.id || null;
    if (k.length === 36 && k.includes('-')) return mapping.profilesById.get(k)?.id || null;
    // treat as initials
    const list = mapping.profilesByInitials.get(k.toUpperCase());
    if (list && list.length === 1) return list[0].id;
    return null;
  }

  const stats = useMemo(() => {
    let clientOk = 0, clientMissing = 0, userOk = 0, userAmbiguous = 0, userMissing = 0;
    for (const r of rows) {
      const c = mapping.clientsByOrg.get((r.orgNumber || '').replace(/\s/g, ''));
      if (c) clientOk++; else clientMissing++;
      const userId = resolveUserId(r.employeeKey);
      if (userId) userOk++; else userMissing++;
      // Ambiguity is handled as missing for now
    }
    return { clientOk, clientMissing, userOk, userMissing, total: rows.length };
  }, [rows, mapping]);

  function buildRecordsFromRows() {
    const issues: ValidationIssue[] = [];
    const records: any[] = [];
    const years = new Set<number>();
    const monthsByYear = new Map<number, Set<number>>();
    const userIds = new Set<string>();

    for (const r of rows) {
      const client = mapping.clientsByOrg.get((r.orgNumber || '').replace(/\s/g, ''));
      if (!client) {
        issues.push({ type: 'missing-client', message: `Klient ikke funnet for orgnr ${r.orgNumber}`, key: r.orgNumber });
        continue;
      }
      const userId = resolveUserId(r.employeeKey);
      if (!userId) {
        issues.push({ type: 'missing-user', message: `Ansatt ikke funnet for nøkkel ${r.employeeKey}`, key: r.employeeKey });
        continue;
      }
      const year = r.year || selectedYear;
      if (!year) continue;
      years.add(year);
      userIds.add(userId);

      const addMonth = (m: number, hours: number) => {
        if (hours && hours !== 0) {
          records.push({
            team_id: selectedTeam,
            client_id: client.id,
            user_id: userId,
            period_year: year,
            period_month: m,
            budget_hours: hours,
          });
          if (!monthsByYear.has(year)) monthsByYear.set(year, new Set());
          monthsByYear.get(year)!.add(m);
        }
      };

      const months = Object.keys(r.hoursByMonth).map((n) => Number(n));
      if (months.length === 1 && months[0] === 0) {
        const annual = r.hoursByMonth[0];
        const perMonth = annual / 12;
        for (let m = 1; m <= 12; m++) addMonth(m, perMonth);
      } else {
        for (const m of months) addMonth(m, r.hoursByMonth[m]);
      }
    }

    return { records, years, monthsByYear, userIds, issues };
  }

  async function validateImport(mode: ImportMode): Promise<ValidationSummary> {
    const { records, years, monthsByYear, userIds, issues } = buildRecordsFromRows();
    if (!selectedTeam) {
      throw new Error('Velg team først');
    }
    if (records.length === 0) {
      return { totalRecords: 0, uniqueUsers: 0, months: [], issues };
    }

    // Fetch existing allocations and capacity for relevant scope
    // Build queries per year to keep filters simple
    const yearsArr = Array.from(years.values());

    const allocPromises = yearsArr.map(async (y) => {
      const months = Array.from(monthsByYear.get(y)?.values() || []);
      let q = (supabase as any)
        .from('team_member_allocations' as any)
        .select('user_id, period_year, period_month, budget_hours')
        .eq('team_id', selectedTeam)
        .eq('period_year', y)
        .in('user_id', Array.from(userIds));
      if (months.length > 0) q = q.in('period_month', months);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as Array<{ user_id: string; period_year: number; period_month: number; budget_hours: number }>;
    });

    const capPromises = yearsArr.map(async (y) => {
      // Get both monthly and yearly capacity rows
      const { data, error } = await (supabase as any)
        .from('employee_capacity' as any)
        .select('user_id, period_year, period_month, capacity_hours')
        .eq('period_year', y)
        .in('user_id', Array.from(userIds));
      if (error) throw error;
      return (data || []) as Array<{ user_id: string; period_year: number; period_month: number | null; capacity_hours: number }>;
    });

    const [allocByYear, capByYear] = await Promise.all([
      Promise.all(allocPromises),
      Promise.all(capPromises),
    ]);

    // Aggregate existing allocations per user-month considering replace mode
    const existingByUserMonth = new Map<string, number>(); // key: `${y}-${m}-${u}`

    yearsArr.forEach((y, idx) => {
      const allocRows = allocByYear[idx];
      const months = Array.from(monthsByYear.get(y)?.values() || []);
      const replaceScope = new Set<string>();
      if (mode === 'replace') {
        // In replace mode, we'll replace for any user-month that appears in import records
        for (const m of months) {
          for (const u of userIds) replaceScope.add(`${y}-${m}-${u}`);
        }
      }
      for (const a of allocRows) {
        const key = `${a.period_year}-${a.period_month}-${a.user_id}`;
        if (mode === 'replace' && replaceScope.has(key)) continue; // Will be deleted
        existingByUserMonth.set(key, (existingByUserMonth.get(key) || 0) + (a.budget_hours || 0));
      }
    });

    // Capacity per user-month
    const capacityByUserMonth = new Map<string, number>();
    yearsArr.forEach((y, idx) => {
      const capRows = capByYear[idx];
      const months = Array.from(monthsByYear.get(y)?.values() || []);
      // Monthly rows
      for (const c of capRows) {
        if (c.period_month != null) {
          const key = `${y}-${c.period_month}-${c.user_id}`;
          capacityByUserMonth.set(key, (capacityByUserMonth.get(key) || 0) + (c.capacity_hours || 0));
        }
      }
      // Yearly rows (null month) -> spread across involved months
      const yearlyByUser = new Map<string, number>();
      for (const c of capRows) {
        if (c.period_month == null) {
          yearlyByUser.set(c.user_id, (yearlyByUser.get(c.user_id) || 0) + (c.capacity_hours || 0));
        }
      }
      if (months.length > 0) {
        for (const u of userIds) {
          const totalYearCap = yearlyByUser.get(u);
          if (totalYearCap && totalYearCap > 0) {
            const perMonth = totalYearCap / 12;
            for (const m of months) {
              const key = `${y}-${m}-${u}`;
              capacityByUserMonth.set(key, (capacityByUserMonth.get(key) || 0) + perMonth);
            }
          }
        }
      }
    });

    // Imported totals per user-month
    const importByUserMonth = new Map<string, number>();
    for (const rec of records) {
      const key = `${rec.period_year}-${rec.period_month}-${rec.user_id}`;
      importByUserMonth.set(key, (importByUserMonth.get(key) || 0) + (rec.budget_hours || 0));
    }

    const overCapIssues: ValidationIssue[] = [];
    for (const [key, imp] of importByUserMonth.entries()) {
      const capacity = capacityByUserMonth.get(key) || 0;
      const existing = existingByUserMonth.get(key) || 0;
      const total = imp + existing;
      if (capacity > 0 && total > capacity + 1e-6) {
        const [y, m, u] = key.split('-');
        overCapIssues.push({
          type: 'over-capacity',
          key,
          message: `Over kapasitet for bruker ${u}, ${y}/${m}: ${total.toFixed(1)} > ${capacity.toFixed(1)}`,
          details: { year: Number(y), month: Number(m), userId: u, imported: imp, existing, capacity, total },
        });
      }
    }

    const monthsAll = Array.from(new Set(records.map((r) => r.period_month))).sort((a, b) => a - b);
    return {
      totalRecords: records.length,
      uniqueUsers: userIds.size,
      months: monthsAll,
      issues: [...issues, ...overCapIssues],
    };
  }

  async function handleSubmit() {
    if (!selectedTeam) {
      toast({ title: 'Velg team', description: 'Du må velge et team for å registrere allokeringer', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const { records, years, monthsByYear, userIds } = buildRecordsFromRows();

      if (records.length === 0) {
        toast({ title: 'Ingen gyldige rader', description: 'Fant ikke noen rader med både klient og ansatt', variant: 'destructive' });
        return;
      }

      if (importMode === 'replace') {
        // Delete existing rows for the affected user-months before insert
        const yearsArr = Array.from(years.values());
        for (const y of yearsArr) {
          const months = Array.from(monthsByYear.get(y)?.values() || []);
          for (const m of months) {
            const uids = Array.from(userIds);
            if (uids.length === 0) continue;
            const { error: delErr } = await (supabase as any)
              .from('team_member_allocations' as any)
              .delete()
              .eq('team_id', selectedTeam)
              .eq('period_year', y)
              .eq('period_month', m)
              .in('user_id', uids);
            if (delErr) throw delErr;
          }
        }
      }

      // Chunked upsert to avoid payload limits and overwrite existing rows on unique key
      const chunkSize = 500;
      for (let i = 0; i < records.length; i += chunkSize) {
        const chunk = records.slice(i, i + chunkSize);
        const { error } = await (supabase as any)
          .from('team_member_allocations' as any)
          .upsert(chunk, { onConflict: 'team_id,client_id,user_id,period_year,period_month' });
        if (error) throw error;
      }

      toast({ title: 'Import fullført', description: `${importMode === 'replace' ? 'Erstattet/oppdatert' : 'Oppdatert'} ${records.length} rader` });
      setRows([]);
      setValidation(null);
    } catch (e: any) {
      toast({ title: 'Feil ved import', description: e?.message || 'Ukjent feil', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importer allokeringer (timer per klient og måned)</CardTitle>
        <CardDescription>Excel/CSV med kolonner: orgnummer, ansatt (epost/initialer/id), år (valgfritt), måneder (1–12 eller Jan–Des)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>År</Label>
              <Input type="number" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Team (brukes for alle rader)</Label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg team" />
                </SelectTrigger>
                <SelectContent>
                  {(teams || []).map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <FileDropZone onFilesSelected={handleFiles} accept={{ 'text/csv': ['.csv'], 'application/vnd.ms-excel': ['.xls'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }}>
            {(active) => (
              <div className="py-10">
                <p className="text-sm">{active ? 'Slipp for å laste opp…' : 'Dra og slipp fil her, eller klikk for å velge'}</p>
                <p className="text-xs text-muted-foreground">Støtter .xlsx, .xls og .csv</p>
              </div>
            )}
          </FileDropZone>

          {rows.length > 0 && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Totalt rader: {stats.total} • Klient funnet: {stats.clientOk} • Mangler klient: {stats.clientMissing} • Ansatt funnet: {stats.userOk} • Mangler ansatt: {stats.userMissing}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="space-y-2">
                    <Label>Importmodus</Label>
                    <Select value={importMode} onValueChange={(v) => setImportMode(v as ImportMode)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Velg modus" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="append">Legg til (append)</SelectItem>
                        <SelectItem value="replace">Erstatt (sletter eksisterende i samme bruker/måned)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2 flex gap-3 md:justify-end">
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        setIsValidating(true);
                        try {
                          const res = await validateImport(importMode);
                          setValidation(res);
                          toast({ title: 'Validering fullført', description: `${res.totalRecords} rader analysert` });
                        } catch (e: any) {
                          toast({ title: 'Validering feilet', description: e?.message || 'Ukjent feil', variant: 'destructive' });
                        } finally {
                          setIsValidating(false);
                        }
                      }}
                      disabled={isParsing || isSubmitting || rows.length === 0 || !selectedTeam}
                    >
                      {isValidating ? 'Validerer…' : 'Valider (dry‑run)'}
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto border rounded-md">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left">
                        <th className="p-2">Orgnr</th>
                        <th className="p-2">Ansatt</th>
                        <th className="p-2">År</th>
                        <th className="p-2">Måneder≠0</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((r, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="p-2">{r.orgNumber}</td>
                          <td className="p-2">{r.employeeKey}</td>
                          <td className="p-2">{r.year || selectedYear}</td>
                          <td className="p-2">{Object.entries(r.hoursByMonth).filter(([m,h])=>Number(h)>0).map(([m,h])=>`${m}:${h}`).join(', ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {validation && (
                  <div className="rounded-md border p-3 text-sm">
                    <div className="font-medium mb-2">Valideringsresultat</div>
                    <div>
                      Poster: {validation.totalRecords} • Unike brukere: {validation.uniqueUsers} • Måneder: {validation.months.length ? validation.months.join(', ') : '-'}
                    </div>
                    {validation.issues.length > 0 ? (
                      <ul className="list-disc ml-5 mt-2 space-y-1">
                        {validation.issues.slice(0, 100).map((i, idx) => (
                          <li key={idx} className={i.type === 'over-capacity' ? 'text-destructive' : ''}>{i.message}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="mt-2 text-primary">Ingen problemer funnet.</div>
                    )}
                  </div>
                )}

                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => { setRows([]); setValidation(null); }} disabled={isParsing || isSubmitting}>Nullstill</Button>
                  <Button onClick={handleSubmit} disabled={isParsing || isSubmitting || rows.length === 0 || !selectedTeam}>
                    {isSubmitting ? 'Importerer…' : 'Importer allokeringer'}
                  </Button>
                </div>
              </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
