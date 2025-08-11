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

  async function handleSubmit() {
    if (!selectedTeam) {
      toast({ title: 'Velg team', description: 'Du må velge et team for å registrere allokeringer', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const records: any[] = [];
      for (const r of rows) {
        const client = mapping.clientsByOrg.get((r.orgNumber || '').replace(/\s/g, ''));
        const userId = resolveUserId(r.employeeKey);
        const year = r.year || selectedYear;
        if (!client || !userId || !year) continue;

        const months = Object.keys(r.hoursByMonth).map(n => Number(n));
        if (months.length === 1 && months[0] === 0) {
          // Annual allocation: store with null month if supported, else split equally across 12
          const annual = r.hoursByMonth[0];
          // Prefer explicit monthly split: divide equally
          const perMonth = annual / 12;
          for (let m = 1; m <= 12; m++) {
            records.push({
              team_id: selectedTeam,
              client_id: client.id,
              user_id: userId,
              period_year: year,
              period_month: m,
              budget_hours: perMonth,
            });
          }
        } else {
          for (const m of months) {
            const hours = r.hoursByMonth[m];
            if (!hours || hours === 0) continue;
            records.push({
              team_id: selectedTeam,
              client_id: client.id,
              user_id: userId,
              period_year: year,
              period_month: m,
              budget_hours: hours,
            });
          }
        }
      }

      if (records.length === 0) {
        toast({ title: 'Ingen gyldige rader', description: 'Fant ikke noen rader med både klient og ansatt', variant: 'destructive' });
        return;
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

      toast({ title: 'Import fullført', description: `Opprettet ${records.length} allokeringer` });
      setRows([]);
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

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setRows([])} disabled={isParsing || isSubmitting}>Nullstill</Button>
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
