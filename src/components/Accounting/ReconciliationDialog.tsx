import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface ReconciliationDialogProps {
  clientId: string;
  currentYear: number;
  currentVersion?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TBRow {
  account_number: string;
  account_name: string;
  opening_balance?: number;
  closing_balance?: number;
}

const numberFormat = new Intl.NumberFormat('nb-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ReconciliationDialog: React.FC<ReconciliationDialogProps> = ({ clientId, currentYear, currentVersion, open, onOpenChange }) => {
  const [prevYearData, setPrevYearData] = useState<TBRow[]>([]);
  const [currYearData, setCurrYearData] = useState<TBRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [showOnlyDiffs, setShowOnlyDiffs] = useState(true);

  useEffect(() => {
    if (!open) return;
    const fetchData = async () => {
      setLoading(true);
      const prevYear = currentYear - 1;
      try {
        // Fetch latest version for previous year (for closing balances)
        const { data: prevLatest } = await supabase
          .from('trial_balances')
          .select('version, created_at')
          .eq('client_id', clientId)
          .eq('period_year', prevYear)
          .order('created_at', { ascending: false })
          .limit(1);
        const prevVersion = prevLatest?.[0]?.version as string | undefined;

        let prevQuery = supabase
          .from('trial_balances')
          .select(`
            closing_balance,
            client_chart_of_accounts!inner(account_number, account_name)
          `)
          .eq('client_id', clientId)
          .eq('period_year', prevYear);
        if (prevVersion) prevQuery = prevQuery.eq('version', prevVersion);

        const [{ data: prevRows }, { data: currRows }] = await Promise.all([
          prevQuery,
          supabase
            .from('trial_balances')
            .select(`
              opening_balance,
              client_chart_of_accounts!inner(account_number, account_name)
            `)
            .eq('client_id', clientId)
            .eq('period_year', currentYear)
            .eq('version', currentVersion || '')
        ]);

        const prev: TBRow[] = (prevRows || []).map((r: any) => ({
          account_number: r.client_chart_of_accounts?.account_number,
          account_name: r.client_chart_of_accounts?.account_name,
          closing_balance: r.closing_balance || 0,
        }));
        const curr: TBRow[] = (currRows || []).map((r: any) => ({
          account_number: r.client_chart_of_accounts?.account_number,
          account_name: r.client_chart_of_accounts?.account_name,
          opening_balance: r.opening_balance || 0,
        }));

        setPrevYearData(prev);
        setCurrYearData(curr);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [open, clientId, currentYear, currentVersion]);

  const rows = useMemo(() => {
    // Join by account_number and filter 1000-2999
    const currMap = new Map(currYearData.map(a => [a.account_number, a]));
    const prevMap = new Map(prevYearData.map(a => [a.account_number, a]));
    const accountNumbers = new Set<string>([...currMap.keys(), ...prevMap.keys()]);

    const joined = Array.from(accountNumbers).map(acc => {
      const n = parseInt(acc, 10);
      const inRange = !isNaN(n) && n >= 1000 && n <= 2999;
      if (!inRange) return null;
      const curr = currMap.get(acc);
      const prev = prevMap.get(acc);
      const opening = curr?.opening_balance || 0;
      const closingPrev = prev?.closing_balance || 0;
      return {
        account_number: acc,
        account_name: curr?.account_name || prev?.account_name || '',
        opening_balance: opening,
        previous_year_closing: closingPrev,
        diff: opening - closingPrev,
      };
    }).filter(Boolean) as Array<{ account_number: string; account_name: string; opening_balance: number; previous_year_closing: number; diff: number }>;

    return joined
      .filter(r => (showOnlyDiffs ? Math.abs(r.diff) > 0.0049 : true))
      .sort((a, b) => a.account_number.localeCompare(b.account_number, undefined, { numeric: true }));
  }, [currYearData, prevYearData, showOnlyDiffs]);

  const totalDiff = useMemo(() => rows.reduce((s, r) => s + r.diff, 0), [rows]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Avstemming: Inngående {currentYear} vs. Saldo {currentYear - 1}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <p className="text-muted-foreground">Laster data...</p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Viser konto 1000–2999. {showOnlyDiffs ? 'Kun avvik' : 'Alle kontoer'}</p>
                <Button variant="secondary" onClick={() => setShowOnlyDiffs(v => !v)}>
                  {showOnlyDiffs ? 'Vis alle' : 'Vis kun avvik'}
                </Button>
              </div>
              <div className="rounded-md border">
                <div className="grid grid-cols-12 px-3 py-2 text-sm font-medium">
                  <div className="col-span-2">Kontonr</div>
                  <div className="col-span-4">Kontonavn</div>
                  <div className="col-span-2 text-right">Saldo {currentYear - 1}</div>
                  <div className="col-span-2 text-right">Inngående {currentYear}</div>
                  <div className="col-span-2 text-right">Avvik</div>
                </div>
                <div className="max-h-80 overflow-auto">
                  {rows.length === 0 ? (
                    <div className="px-3 py-6 text-sm text-muted-foreground">Ingen avvik funnet.</div>
                  ) : (
                    rows.map((r) => (
                      <div key={r.account_number} className="grid grid-cols-12 px-3 py-1.5 text-sm border-t">
                        <div className="col-span-2 font-mono">{r.account_number}</div>
                        <div className="col-span-4 truncate" title={r.account_name}>{r.account_name}</div>
                        <div className="col-span-2 text-right font-mono">{numberFormat.format(r.previous_year_closing)}</div>
                        <div className="col-span-2 text-right font-mono">{numberFormat.format(r.opening_balance)}</div>
                        <div className={`col-span-2 text-right font-mono ${Math.abs(r.diff) > 0.0049 ? 'text-destructive' : ''}`}>{numberFormat.format(r.diff)}</div>
                      </div>
                    ))
                  )}
                </div>
                <div className="grid grid-cols-12 px-3 py-2 text-sm font-semibold border-t bg-muted/50">
                  <div className="col-span-8">Sum avvik</div>
                  <div className={`col-span-4 text-right font-mono ${Math.abs(totalDiff) > 0.0049 ? 'text-destructive' : ''}`}>{numberFormat.format(totalDiff)}</div>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Lukk</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReconciliationDialog;
