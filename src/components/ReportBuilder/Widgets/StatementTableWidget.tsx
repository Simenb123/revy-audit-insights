import React from 'react';
import { Widget, useWidgetManager } from '@/contexts/WidgetManagerContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InlineEditableTitle } from '../InlineEditableTitle';
import { useDetailedFinancialStatement } from '@/hooks/useDetailedFinancialStatement';
import { useTrialBalanceMappings } from '@/hooks/useTrialBalanceMappings';
import { useTrialBalanceData } from '@/hooks/useTrialBalanceData';
import { useAccountClassifications } from '@/hooks/useAccountClassifications';
import { useNavigate } from 'react-router-dom';
import { StatementLineRow } from './StatementTable/StatementLineRow';
import { SectionHeading } from './StatementTable/SectionHeading';
import { StatementTableToolbar } from './StatementTable/Toolbar';
import { HelpCircle } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { formatCurrency } from '@/lib/formatters';

interface StatementTableWidgetProps { widget: Widget }

const ARIA_HELP_TITLE = 'Tilgjengelighet (ARIA)';
const ARIA_HELP_TEXT = 'Tabellen er et hierarki (treegrid). Bruk piltaster for å åpne/lukke rader og Enter/Space for drilldown. Skjermlesere mottar nivå, posisjon og kolonne-/radantall.';

export function StatementTableWidget({ widget }: StatementTableWidgetProps) {
  const { updateWidget } = useWidgetManager();
  const clientId: string | undefined = widget.config?.clientId;
  const selectedVersion: string | undefined = widget.config?.selectedVersion;
  const showPrevious: boolean = widget.config?.showPrevious !== false;
  const showDifference: boolean = widget.config?.showDifference !== false;
  const showPercent: boolean = widget.config?.showPercent !== false;
  const showOnlyChanges: boolean = widget.config?.showOnlyChanges === true;
  const drilldownPanel: boolean = widget.config?.drilldownPanel === true;
  const inlineAccounts: boolean = widget.config?.inlineAccounts !== false;
  const alwaysShowTopHeaders: boolean = widget.config?.alwaysShowTopHeaders === true;
  const showOnlyUnmapped: boolean = widget.config?.showOnlyUnmapped === true;
  const searchQuery: string = widget.config?.searchQuery || '';
  const sectionMode: 'both' | 'income' | 'balance' = (widget.config?.sectionMode as any) ?? 'both';
  const visualGuides: boolean = widget.config?.visualGuides === true;
  const compactMode: boolean = widget.config?.compactMode === true;
  const zebraStriping: boolean = widget.config?.zebraStriping === true;
  const { incomeStatement, balanceStatement, periodInfo, isLoading } = useDetailedFinancialStatement(
    clientId || '',
    selectedVersion
  );
  const { data: mappings = [] } = useTrialBalanceMappings(clientId || '');
  const { data: classifications = [] } = useAccountClassifications(clientId || '', selectedVersion);
  const navigate = useNavigate();

const [expanded, setExpanded] = React.useState<Record<string, boolean>>(() => (widget.config?.expanded ?? {}));
const [accountsExpanded, setAccountsExpanded] = React.useState<Record<string, boolean>>(() => (widget.config?.accountsExpanded ?? {}));
const [liveMessage, setLiveMessage] = React.useState<string>('');
const [panelOpen, setPanelOpen] = React.useState(false);
const [panelContext, setPanelContext] = React.useState<{ standardNumber: string; accounts: string[] } | null>(null);
const lastFocusedRef = React.useRef<HTMLElement | null>(null);
const prevExpandedRef = React.useRef<Record<string, boolean> | null>(null);
const [debugOpen, setDebugOpen] = React.useState(false);
const handleTitleChange = (newTitle: string) => updateWidget(widget.id, { title: newTitle });

  const updateConfig = React.useCallback((patch: Record<string, any>) => {
    queueMicrotask(() => {
      updateWidget(widget.id, { config: { ...(widget.config || {}), ...patch } });
    });
  }, [updateWidget, widget.id, widget.config]);

  // Sync from widget.config to local state to avoid updates during render
  React.useEffect(() => {
    const cfg = widget.config?.expanded ?? {};
    setExpanded((prev) => {
      try { return JSON.stringify(prev) === JSON.stringify(cfg) ? prev : cfg; } catch { return cfg; }
    });
  }, [widget.config?.expanded]);
  React.useEffect(() => {
    const cfg = widget.config?.accountsExpanded ?? {};
    setAccountsExpanded((prev) => {
      try { return JSON.stringify(prev) === JSON.stringify(cfg) ? prev : cfg; } catch { return cfg; }
    });
  }, [widget.config?.accountsExpanded]);

  const toggle = (id: string, details?: { name?: string; opening?: boolean; delta?: number }) => {
    setExpanded((prev) => {
      const opening = details?.opening ?? !prev[id];
      const next = { ...prev, [id]: opening };
      updateConfig({ expanded: next });
      const base = details?.name ? `Rad ${opening ? 'åpnet' : 'lukket'}: ${details.name}` : (opening ? 'Rad åpnet' : 'Rad lukket');
      const withDelta = typeof details?.delta === 'number' && details.delta > 0
        ? `${base}. ${opening ? details.delta + ' nye rader' : details.delta + ' rader skjult'}`
        : base;
      setLiveMessage(withDelta);
      return next;
    });
  };
const collectIds = (nodes: any[]): string[] =>
  nodes.flatMap((n) => [n.id, ...(n.children ? collectIds(n.children) : [])]);

  const expandAll = () => {
    const all = [
      ...(sectionMode !== 'balance' ? collectIds(incomeStatement || []) : []),
      ...(sectionMode !== 'income' ? collectIds(balanceStatement || []) : []),
    ];
    const map = Object.fromEntries(all.map((id) => [id, true] as const));
    setExpanded(map);
    updateConfig({ expanded: map });
    setLiveMessage('Alle rader utvidet');
  };

  const collapseAll = () => {
    setExpanded({});
    updateConfig({ expanded: {} });
    setLiveMessage('Alle rader lukket');
  };

  const expandToLevel = (level: number) => {
    const collect = (nodes: any[], depth: number): [string, boolean][] => {
      let entries: [string, boolean][] = [];
      for (const n of nodes) {
        const hasChildren = !!(n.children && n.children.length);
        const shouldOpen = hasChildren && depth < (level - 1);
        if (shouldOpen) {
          entries.push([n.id, true]);
          entries = entries.concat(collect(n.children, depth + 1));
        }
      }
      return entries;
    };
    const entries = [
      ...(sectionMode !== 'balance' ? collect(incomeStatement || [], 0) : []),
      ...(sectionMode !== 'income' ? collect(balanceStatement || [], 0) : []),
    ];
    const map = Object.fromEntries(entries);
    setExpanded(map);
    updateConfig({ expanded: map });
    setLiveMessage(`Utvidet til nivå ${level}`);
  };

  // Toggle inline accounts for a standard line number
  const toggleAccounts = (standardNumber: string, details?: { opening?: boolean; delta?: number }) => {
    setAccountsExpanded((prev) => {
      const opening = details?.opening ?? !prev[standardNumber];
      const next = { ...prev, [standardNumber]: opening };
      updateConfig({ accountsExpanded: next });
      const count = getAccountsForLine(standardNumber).length;
      setLiveMessage(`${opening ? 'Viser' : 'Skjuler'} ${count} kontoer for linje ${standardNumber}`);
      return next;
    });
  };

  const lineToAccounts = React.useMemo(() => {
    const map = new Map<string, string[]>();
    // 1) Explicit mappings from trial_balance_mappings
    for (const m of mappings) {
      const key = m.statement_line_number as string;
      const acc = m.account_number as string;
      if (!map.has(key)) map.set(key, []);
      if (!map.get(key)!.includes(acc)) map.get(key)!.push(acc);
    }

    // 2) Build name -> number map from statements
    const nameToNumber = new Map<string, string>();
    const walk = (nodes: any[]) => {
      for (const n of nodes || []) {
        if (n.standard_name && n.standard_number) {
          nameToNumber.set(String(n.standard_name).toLowerCase(), String(n.standard_number));
        }
        if (n.children && n.children.length) walk(n.children);
      }
    };
    walk(incomeStatement || []);
    walk(balanceStatement || []);

    // 3) Fallback: active account_classifications
    for (const c of classifications || []) {
      const target = nameToNumber.get(String(c.new_category || '').toLowerCase());
      if (!target) continue;
      const acc = c.account_number as string;
      if (!map.has(target)) map.set(target, []);
      if (!map.get(target)!.includes(acc)) map.get(target)!.push(acc);
    }

    // Debug sample lines
    try {
      const sample = ['10', '15', '19', '20'];
      const findLine = (nodes: any[], num: string): any | undefined => {
        for (const n of nodes || []) {
          if (String(n.standard_number) === num) return n;
          if (n.children) {
            const found = findLine(n.children, num);
            if (found) return found;
          }
        }
        return undefined;
      };
      sample.forEach((num) => {
        const node = findLine(incomeStatement || [], num) || findLine(balanceStatement || [], num);
        // eslint-disable-next-line no-console
        console.debug('[StatementTableWidget] Drillcheck', {
          num,
          line_type: node?.line_type,
          is_total_line: node?.is_total_line,
          mapped_accounts: map.get(num)?.length ?? 0,
        });
      });
    } catch {}

    return map;
  }, [mappings, classifications, incomeStatement, balanceStatement]);

  const childrenByNumber = React.useMemo(() => {
    const map = new Map<string, string[]>();
    const walk = (nodes: any[]) => {
      for (const n of nodes || []) {
        const num = String(n.standard_number);
        const childNums = (n.children || []).map((c: any) => String(c.standard_number));
        map.set(num, childNums);
        if (n.children && n.children.length) walk(n.children);
      }
    };
    walk(incomeStatement || []);
    walk(balanceStatement || []);
    return map;
  }, [incomeStatement, balanceStatement]);

  const nodeByNumber = React.useMemo(() => {
    const map = new Map<string, any>();
    const walk = (nodes: any[]) => {
      for (const n of nodes || []) {
        map.set(String(n.standard_number), n);
        if (n.children && n.children.length) walk(n.children);
      }
    };
    walk(incomeStatement || []);
    walk(balanceStatement || []);
    return map;
  }, [incomeStatement, balanceStatement]);

  const getAccountsForLine = React.useCallback((standardNumber: string) => {
    const visited = new Set<string>();
    const result = new Set<string>();
    const dfs = (num: string) => {
      if (visited.has(num)) return;
      visited.add(num);
      const direct = lineToAccounts.get(num) || [];
      for (const acc of direct) result.add(acc);
      const children = childrenByNumber.get(num) || [];
      for (const child of children) dfs(child);
    };
    dfs(String(standardNumber));
    return Array.from(result);
  }, [lineToAccounts, childrenByNumber]);

  const handleDrilldown = (standardNumber: string) => {
    if (!clientId) return;
    const accounts = getAccountsForLine(standardNumber);
    if (accounts.length === 0) return;
    if (drilldownPanel) {
      lastFocusedRef.current = document.activeElement as HTMLElement;
      setPanelContext({ standardNumber, accounts });
      setPanelOpen(true);
      return;
    }
    const params = new URLSearchParams({ accounts: accounts.join(',') });
    navigate(`/clients/${clientId}/trial-balance?${params.toString()}`);
  };
  const openAccountTB = (accountNumber: string) => {
    if (!clientId) return;
    const params = new URLSearchParams({ accounts: accountNumber });
    navigate(`/clients/${clientId}/trial-balance?${params.toString()}`);
  };
  const openAccountsTB = (accountNumbers: string[]) => {
    if (!clientId || accountNumbers.length === 0) return;
    const params = new URLSearchParams({ accounts: accountNumbers.join(',') });
    navigate(`/clients/${clientId}/trial-balance?${params.toString()}`);
  };
  const exportPanelCSV = (accountNumbers: string[]) => {
    if (accountNumbers.length === 0) return;
    const headers = [
      'Konto', 'Navn',
      periodInfo?.currentYear ?? 'År',
      ...(showPrevious ? [periodInfo?.previousYear ?? 'I fjor'] : []),
      'Endring',
      ...(showPercent ? ['Endring %'] : []),
    ];
    const rows = accountNumbers.map((acc) => {
      const cur = currentByAcc.get(acc);
      const prev = prevByAcc.get(acc);
      const currentVal = cur?.closing_balance || 0;
      const prevVal = prev?.closing_balance || 0;
      const diff = currentVal - prevVal;
      const pct = prevVal !== 0 ? (diff / Math.abs(prevVal)) * 100 : 0;
      const name = cur?.account_name || prev?.account_name || '';
      return [
        acc,
        name,
        String(currentVal),
        ...(showPrevious ? [String(prevVal)] : []),
        String(diff),
        ...(showPercent ? [pct.toFixed(1)] : []),
      ];
    });
    const csv = [headers.join(';'), ...rows.map(r => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `drilldown-${panelContext?.standardNumber ?? ''}-${periodInfo?.currentYear ?? ''}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setLiveMessage('CSV eksportert for panel');
  };

  React.useEffect(() => {
    if (!panelOpen && lastFocusedRef.current) {
      lastFocusedRef.current.focus();
    }
  }, [panelOpen]);

  React.useEffect(() => {
    const handleBeforePrint = () => {
      prevExpandedRef.current = expanded;
      const all = [...collectIds(incomeStatement || []), ...collectIds(balanceStatement || [])];
      const map = Object.fromEntries(all.map((id) => [id, true] as const));
      setExpanded(map);
      updateConfig({ expanded: map });
    };
    const handleAfterPrint = () => {
      if (prevExpandedRef.current) {
        setExpanded(prevExpandedRef.current);
        updateConfig({ expanded: prevExpandedRef.current });
        prevExpandedRef.current = null;
      }
    };
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [expanded, updateConfig, incomeStatement, balanceStatement, collectIds]);

  // Helper: filter tree to only include lines with changes (or descendants with changes)
  const hasChange = React.useCallback((node: any): boolean => {
    const current = node.amount || 0;
    const prev = node.previous_amount || 0;
    const changed = current !== prev;
    if (changed) return true;
    if (node.children && node.children.length) {
      return node.children.some((c: any) => hasChange(c));
    }
    return false;
  }, []);

  // Stable sibling comparator: non-totals first, then display_order, then numeric standard_number, then alphanumeric
  const isTotal = (n: any) => {
    const name = String(n.standard_name || '').toLowerCase();
    return !!n.is_total_line || n.line_type === 'subtotal' || n.line_type === 'calculation' || name.startsWith('sum');
  };
  const sortSiblings = (arr: any[]) =>
    arr.sort((a, b) => {
      const aIsTotal = isTotal(a);
      const bIsTotal = isTotal(b);
      if (aIsTotal !== bIsTotal) return aIsTotal ? 1 : -1;
      const byOrder = (a.display_order ?? 0) - (b.display_order ?? 0);
      if (byOrder !== 0) return byOrder;
      const aNum = parseInt(String(a.standard_number), 10);
      const bNum = parseInt(String(b.standard_number), 10);
      if (!Number.isNaN(aNum) && !Number.isNaN(bNum) && aNum !== bNum) return aNum - bNum;
      return String(a.standard_number).localeCompare(String(b.standard_number));
    });
  const deepSort = (nodes: any[]): any[] => {
    const clone = nodes.map((n) => ({
      ...n,
      children: n.children && n.children.length ? deepSort(n.children) : [],
    }));
    sortSiblings(clone);
    return clone;
  };

// Trial balance data for drilldown panel og unmapped-beregning
const { data: tbCurrent } = useTrialBalanceData(clientId || '', selectedVersion, periodInfo?.currentYear);
const { data: tbPrev } = useTrialBalanceData(clientId || '', selectedVersion, periodInfo?.previousYear);

const currentByAcc = React.useMemo(() => new Map((tbCurrent || []).map((e: any) => [e.account_number, e])), [tbCurrent]);
const prevByAcc = React.useMemo(() => new Map((tbPrev || []).map((e: any) => [e.account_number, e])), [tbPrev]);

// Unmapped: konti i TB som ikke finnes i noen mapping/klassifisering som inngår i rapporten
const mappedAccountsSet = React.useMemo(() => {
  const s = new Set<string>();
  for (const [, accs] of lineToAccounts.entries()) {
    accs.forEach((a) => s.add(String(a)));
  }
  return s;
}, [lineToAccounts]);
const allCurrentAccountsSet = React.useMemo(() => new Set<string>(Array.from(currentByAcc.keys()).map(String)), [currentByAcc]);
const unmappedSet = React.useMemo(() => {
  const s = new Set<string>();
  allCurrentAccountsSet.forEach((a) => { if (!mappedAccountsSet.has(a)) s.add(a); });
  return s;
}, [allCurrentAccountsSet, mappedAccountsSet]);
const unmappedCount = unmappedSet.size;

const filterLines = React.useCallback((nodes: any[]): any[] => {
  const q = (searchQuery || '').trim().toLowerCase();
  const matchesSearch = (n: any) => {
    if (!q) return true;
    return String(n.standard_name || '').toLowerCase().includes(q) || String(n.standard_number || '').toLowerCase().includes(q);
  };
  const hasUnmapped = (n: any): boolean => {
    const accs = getAccountsForLine(String(n.standard_number));
    return accs.some((a) => unmappedSet.has(a));
  };
  if (!showOnlyChanges && !showOnlyUnmapped && !q) return nodes;
  const recurse = (arr: any[], depth = 0): any[] => arr
    .map((n) => ({ ...n, children: n.children ? recurse(n.children, depth + 1) : [] }))
    .filter((n) => {
      const selfMatches = (!showOnlyChanges || hasChange(n)) && (!showOnlyUnmapped || hasUnmapped(n)) && matchesSearch(n);
      const keep = selfMatches || (n.children && n.children.length > 0) || (alwaysShowTopHeaders && depth === 0);
      return keep;
    });
  return recurse(nodes, 0);
}, [showOnlyChanges, hasChange, alwaysShowTopHeaders, showOnlyUnmapped, searchQuery, getAccountsForLine, unmappedSet]);


  const rawIncome = incomeStatement || [];
  const rawBalance = balanceStatement || [];

  // Dev-only: log root order to verify sorting
  if (import.meta.env?.DEV) {
    try {
      // eslint-disable-next-line no-console
      console.debug('[StatementTableWidget] income roots order (first 20):', (rawIncome || []).slice(0, 20).map((n: any) => ({ num: n.standard_number, name: n.standard_name, order: n.display_order, type: n.line_type, total: n.is_total_line })));
    } catch {}
  }

  const filteredIncome = filterLines(rawIncome);
  const filteredBalance = filterLines(rawBalance);

  const fi = sectionMode === 'balance' ? [] : filteredIncome;
  const fb = sectionMode === 'income' ? [] : filteredBalance;

  const hasData = (fi?.length ?? 0) > 0 || (fb?.length ?? 0) > 0;

const colCount = 1 + 1 + (showPrevious ? 1 : 0) + (showDifference ? 1 : 0) + (showPercent ? 1 : 0);
const countVisibleLines = React.useCallback(function countVisibleLines(nodes: any[]): number {
  return nodes.reduce((sum: number, n: any) => {
    const self = 1;
    const accounts = inlineAccounts && accountsExpanded[n.standard_number] ? getAccountsForLine(n.standard_number).length : 0;
    const children = n.children && n.children.length && (expanded[n.id] || isTotal(n)) ? countVisibleLines(n.children) : 0;
    return sum + self + accounts + children;
  }, 0);
}, [expanded, inlineAccounts, accountsExpanded, getAccountsForLine]);

  const rowCount =
    (fi.length > 0 ? 1 + countVisibleLines(fi) : 0) +
    (fb.length > 0 ? 1 + countVisibleLines(fb) : 0);

  const headerRowIndex = 1;
  const incomeHeadingIndex = fi.length > 0 ? headerRowIndex + 1 : undefined;
  const incomeStartIndex = incomeHeadingIndex ? incomeHeadingIndex + 1 : undefined;
  const incomeRowsCount = fi.length > 0 ? countVisibleLines(fi) : 0;
  const balanceHeadingIndex = fb.length > 0
    ? headerRowIndex + (fi.length > 0 ? 1 + incomeRowsCount : 0) + 1
    : undefined;
  const balanceStartIndex = balanceHeadingIndex ? balanceHeadingIndex + 1 : undefined;

// moved: unmapped/calculation block placed above filterLines

  const findLineTitle = React.useCallback((standardNumber: string): string => {
    const findIn = (nodes: any[]): any | undefined => {
      for (const n of nodes) {
        if (n.standard_number === standardNumber) return n;
        if (n.children) {
          const found = findIn(n.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    const node = findIn(filteredIncome) || findIn(filteredBalance);
    return node?.standard_name || standardNumber;
  }, [filteredIncome, filteredBalance]);

  // CSV export of currently visible rows
const flattenVisible = React.useCallback((nodes: any[]): any[] => {
    const out: any[] = [];
    const walk = (arr: any[]) => {
      for (const n of arr) {
        out.push(n);
        if (n.children && n.children.length && (expanded[n.id] || isTotal(n))) walk(n.children);
      }
    };
    walk(nodes);
    return out;
  }, [expanded]);

  const handleExportCSV = React.useCallback(() => {
    const visibleIncome = flattenVisible(fi);
    const visibleBalance = flattenVisible(fb);
    const rows = [
      ...visibleIncome.map((n) => ({ section: 'Resultat', ...n })),
      ...visibleBalance.map((n) => ({ section: 'Balanse', ...n })),
    ];
    const headers = [
      'Seksjon',
      'Nummer',
      'Navn',
      periodInfo?.currentYear ?? 'År',
      ...(showPrevious ? [periodInfo?.previousYear ?? 'I fjor'] : []),
      ...(showDifference ? ['Endring'] : []),
      ...(showPercent ? ['Endring %'] : []),
    ];
    const csv = [
      headers.join(';'),
      ...rows.map((r) => {
        const current = r.amount || 0;
        const prev = r.previous_amount || 0;
        const diff = current - prev;
        const pct = prev !== 0 ? (diff / Math.abs(prev)) * 100 : 0;
        const cols = [
          r.section,
          r.standard_number,
          r.standard_name,
          String(current),
          ...(showPrevious ? [String(prev)] : []),
          ...(showDifference ? [String(diff)] : []),
          ...(showPercent ? [pct.toFixed(1)] : []),
        ];
        return cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';');
      })
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-${periodInfo?.currentYear ?? ''}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setLiveMessage('CSV eksportert');
  }, [filteredIncome, filteredBalance, flattenVisible, periodInfo, showPrevious, showDifference, showPercent]);

  return (
    <>
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <InlineEditableTitle title={widget.title} onTitleChange={handleTitleChange} size="sm" />
            <div className="flex items-center gap-1 print:hidden">
<StatementTableToolbar
  widgetId={widget.id}
  showPrevious={showPrevious}
  onShowPreviousChange={(v) => { updateConfig({ showPrevious: v }); setLiveMessage(v ? 'Kolonne fjorår på' : 'Kolonne fjorår av'); }}
  showDifference={showDifference}
  onShowDifferenceChange={(v) => { updateConfig({ showDifference: v }); setLiveMessage(v ? 'Kolonne endring på' : 'Kolonne endring av'); }}
  showPercent={showPercent}
  onShowPercentChange={(v) => { updateConfig({ showPercent: v }); setLiveMessage(v ? 'Kolonne endring % på' : 'Kolonne endring % av'); }}
  showOnlyChanges={showOnlyChanges}
  onShowOnlyChangesChange={(v: boolean) => { updateConfig({ showOnlyChanges: v }); setLiveMessage(v ? 'Filter aktivert: kun endringer' : 'Filter av: alle linjer'); }}
  inlineAccounts={inlineAccounts}
  onInlineAccountsChange={(v: boolean) => { updateConfig({ inlineAccounts: v, ...(v ? { drilldownPanel: false } : {}) }); setLiveMessage(v ? 'Kontoer vises i tabell' : 'Kontoer vises ikke i tabell'); }}
  drilldownPanel={drilldownPanel}
  onDrilldownPanelChange={(v: boolean) => { updateConfig({ drilldownPanel: v, ...(v ? { inlineAccounts: false } : {}) }); setLiveMessage(v ? 'Drilldown i panel på' : 'Drilldown i panel av'); }}
  alwaysShowTopHeaders={alwaysShowTopHeaders}
  onAlwaysShowTopHeadersChange={(v: boolean) => { updateConfig({ alwaysShowTopHeaders: v }); setLiveMessage(v ? 'Viser alltid toppnivå' : 'Skjuler tomme toppnivå'); }}
  showOnlyUnmapped={showOnlyUnmapped}
  onShowOnlyUnmappedChange={(v: boolean) => { updateConfig({ showOnlyUnmapped: v }); setLiveMessage(v ? 'Filter: kun umappede' : 'Filter: alle'); }}
  searchQuery={searchQuery}
  onSearchQueryChange={(q: string) => { updateConfig({ searchQuery: q }); }}
  sectionMode={sectionMode}
  onSectionModeChange={(mode) => { updateConfig({ sectionMode: mode }); setLiveMessage(mode === 'both' ? 'Seksjon: begge' : mode === 'income' ? 'Seksjon: resultat' : 'Seksjon: balanse'); }}
  onExpandAll={expandAll}
  onCollapseAll={collapseAll}
  onExpandToLevel={(lvl: number) => expandToLevel(lvl)}
  disabled={isLoading}
  unmappedCount={unmappedCount}
  visualGuides={visualGuides}
  onVisualGuidesChange={(v: boolean) => { updateConfig({ visualGuides: v }); setLiveMessage(v ? 'Visuelle guider på' : 'Visuelle guider av'); }}
  compactMode={compactMode}
  onCompactModeChange={(v: boolean) => { updateConfig({ compactMode: v }); setLiveMessage(v ? 'Kompakt modus på' : 'Kompakt modus av'); }}
  zebraStriping={zebraStriping}
  onZebraStripingChange={(v: boolean) => { updateConfig({ zebraStriping: v }); setLiveMessage(v ? 'Striping på' : 'Striping av'); }}
/>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label={ARIA_HELP_TITLE} className="h-7 w-7">
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs" side="bottom">
                    <p className="font-medium">{ARIA_HELP_TITLE}</p>
                    <p className="text-muted-foreground">{ARIA_HELP_TEXT}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button variant="ghost" size="sm" onClick={handleExportCSV} className="ml-1" disabled={isLoading || !hasData}>Eksporter CSV</Button>
              <Button variant="ghost" size="sm" onClick={() => window.print()} className="ml-1" disabled={isLoading || !hasData}>Skriv ut</Button>
              {import.meta.env?.DEV && (
                <Button variant="ghost" size="sm" onClick={() => setDebugOpen((v) => !v)} className="ml-1">Debug</Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <span aria-live="polite" className="sr-only" role="status">{liveMessage}</span>
          {isLoading ? (
            <div className="p-4 text-sm text-muted-foreground">Laster regnskapsoppstilling…</div>
          ) : !hasData ? (
            <div className="p-4 text-sm text-muted-foreground">Ingen data å vise.</div>
          ) : (
              <div className="overflow-x-auto">
                <Table role="treegrid" aria-label="Finansoppstilling" aria-colcount={colCount} aria-rowcount={rowCount} aria-describedby={`caption-${widget.id}`} aria-busy={isLoading}>
                  <caption className="sr-only" id={`caption-${widget.id}`}>
                    Hierarkisk tabell for {periodInfo?.currentYear ?? 'inneværende år'}. Kolonner: inneværende år{showPrevious ? ', fjorår' : ''}{showDifference ? ', endring' : ''}{showPercent ? ', prosent' : ''}. Bruk piltaster for å navigere, venstre/høyre for å lukke/åpne, og Enter/Space for drilldown.
                  </caption>
                  <TableHeader>
                  <TableRow role="row" aria-rowindex={headerRowIndex} className="bg-background z-10">
                    <TableHead role="columnheader" scope="col" aria-colindex={1} className="text-xs sticky top-0 left-0 z-20 bg-background print:static">Linje</TableHead>
                    <TableHead role="columnheader" scope="col" aria-colindex={2} className="text-xs sticky top-0 z-10 bg-background print:static text-right whitespace-nowrap">{periodInfo?.currentYear ?? 'År'}</TableHead>
                    {showPrevious && (
                      <TableHead role="columnheader" scope="col" aria-colindex={3} className="text-xs sticky top-0 z-10 bg-background print:static text-right whitespace-nowrap">{periodInfo?.previousYear ?? 'I fjor'}</TableHead>
                    )}
                    {showDifference && (
                      <TableHead role="columnheader" scope="col" aria-colindex={2 + (showPrevious ? 1 : 0) + 1} className="text-xs sticky top-0 z-10 bg-background print:static text-right whitespace-nowrap">Endring</TableHead>
                    )}
                    {showPercent && (
                      <TableHead role="columnheader" scope="col" aria-colindex={2 + (showPrevious ? 1 : 0) + (showDifference ? 1 : 0) + 1} className="text-xs sticky top-0 z-10 bg-background print:static text-right whitespace-nowrap">Endring %</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
              <TableBody>
                {fi.length > 0 && (
                  <>
                    <SectionHeading title="Resultat" rowIndex={incomeHeadingIndex} colSpan={2 + (showPrevious ? 1 : 0) + (showDifference ? 1 : 0) + (showPercent ? 1 : 0)} />
                    {fi.map((line, idx, arr) => (
<StatementLineRow
  key={line.id}
  line={line}
  level={0}
  expandedMap={expanded}
  toggle={toggle}
  showPrevious={showPrevious}
  showDifference={showDifference}
  showPercent={showPercent}
  onDrilldown={handleDrilldown}
  canDrilldown={(n: string) => {
    const node = nodeByNumber.get(String(n));
    const hasChildren = !!(node?.children && node.children.length);
    const isTotal = !!node?.is_total_line || node?.line_type === 'subtotal' || String(node?.standard_name || '').toLowerCase().startsWith('sum');
    return getAccountsForLine(n).length > 0 && !hasChildren && !isTotal;
  }}
  getAccountsForLine={getAccountsForLine}
  inlineAccounts={inlineAccounts}
  accountsExpandedMap={accountsExpanded}
  toggleAccounts={toggleAccounts}
  currentByAcc={currentByAcc}
  prevByAcc={prevByAcc}
  openAccountTB={openAccountTB}
  siblingIndex={idx + 1}
  siblingCount={arr.length}
  rowIndex={(incomeStartIndex ?? 0) + countVisibleLines(fi.slice(0, idx))}
  tabIndex={idx === 0 ? 0 : -1}
  visualGuides={visualGuides}
  compactMode={compactMode}
  zebraStriping={zebraStriping}
/>
                    ))}
                  </>
                )}
                {fb.length > 0 && (
                  <>
                    <SectionHeading title="Balanse" rowIndex={balanceHeadingIndex} colSpan={2 + (showPrevious ? 1 : 0) + (showDifference ? 1 : 0) + (showPercent ? 1 : 0)} />
                    {fb.map((line, idx, arr) => (
<StatementLineRow
  key={line.id}
  line={line}
  level={0}
  expandedMap={expanded}
  toggle={toggle}
  showPrevious={showPrevious}
  showDifference={showDifference}
  showPercent={showPercent}
  onDrilldown={handleDrilldown}
  canDrilldown={(n: string) => {
    const node = nodeByNumber.get(String(n));
    const hasChildren = !!(node?.children && node.children.length);
    const isTotal = !!node?.is_total_line || node?.line_type === 'subtotal' || String(node?.standard_name || '').toLowerCase().startsWith('sum');
    return getAccountsForLine(n).length > 0 && !hasChildren && !isTotal;
  }}
  getAccountsForLine={getAccountsForLine}
  inlineAccounts={inlineAccounts}
  accountsExpandedMap={accountsExpanded}
  toggleAccounts={toggleAccounts}
  currentByAcc={currentByAcc}
  prevByAcc={prevByAcc}
  openAccountTB={openAccountTB}
  siblingIndex={idx + 1}
  siblingCount={arr.length}
  rowIndex={(balanceStartIndex ?? 0) + countVisibleLines(fb.slice(0, idx))}
  tabIndex={(fi.length === 0 && idx === 0) ? 0 : -1}
  visualGuides={visualGuides}
  compactMode={compactMode}
  zebraStriping={zebraStriping}
/>
                    ))}
                  </>
                )}
              </TableBody>
                </Table>
              </div>
          )}
        </CardContent>
      </Card>

      {drilldownPanel && panelContext && (
        <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
          <SheetContent side="right" aria-label={`Drilldown for ${findLineTitle(panelContext.standardNumber)}`} className="w-[min(480px,100vw)] sm:max-w-lg focus:outline-none">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-medium">{findLineTitle(panelContext.standardNumber)}</h2>
                  <p className="text-xs text-muted-foreground">{panelContext.standardNumber}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => openAccountsTB(panelContext.accounts)} aria-label="Åpne alle kontoer i TB">
                    Åpne alle i TB
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportPanelCSV(panelContext.accounts)} aria-label="Eksporter kontoliste til CSV">
                    Eksporter CSV
                  </Button>
                </div>
              </div>
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">Konto</TableHead>
                      <TableHead scope="col" className="text-right">{periodInfo?.currentYear ?? 'År'}</TableHead>
                      {showPrevious && (
                        <TableHead scope="col" className="text-right">{periodInfo?.previousYear ?? 'I fjor'}</TableHead>
                      )}
                      <TableHead scope="col" className="text-right">Endring</TableHead>
                      {showPercent && (
                        <TableHead scope="col" className="text-right">Endring %</TableHead>
                      )}
                      <TableHead scope="col" className="text-right">Lenke</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {panelContext.accounts.map((acc) => {
                      const cur = currentByAcc.get(acc);
                      const prev = prevByAcc.get(acc);
                      const currentVal = cur?.closing_balance || 0;
                      const prevVal = prev?.closing_balance || 0;
                      const diff = currentVal - prevVal;
                      const pct = prevVal !== 0 ? (diff / Math.abs(prevVal)) * 100 : 0;
                      const name = cur?.account_name || prev?.account_name || '';
                      return (
                        <TableRow key={acc}>
                          <TableCell className="whitespace-nowrap">{acc} {name && <span className="text-muted-foreground">- {name}</span>}</TableCell>
                          <TableCell className="text-right tabular-nums whitespace-nowrap">{formatCurrency(currentVal)}</TableCell>
                          {showPrevious && (
                            <TableCell className="text-right tabular-nums whitespace-nowrap">{formatCurrency(prevVal)}</TableCell>
                          )}
                          <TableCell className="text-right tabular-nums whitespace-nowrap">{formatCurrency(diff)}</TableCell>
                          {showPercent && (
                            <TableCell className="text-right tabular-nums whitespace-nowrap">{(pct >= 0 ? '+' : '') + pct.toFixed(1)}%</TableCell>
                          )}
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" aria-label={`Vis konto ${acc} i TB`} onClick={() => openAccountTB(acc)}>Vis i TB</Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {(() => {
                      const totals = panelContext.accounts.reduce((accum, acc) => {
                        const cur = currentByAcc.get(acc);
                        const prev = prevByAcc.get(acc);
                        const currentVal = cur?.closing_balance || 0;
                        const prevVal = prev?.closing_balance || 0;
                        return { cur: accum.cur + currentVal, prev: accum.prev + prevVal };
                      }, { cur: 0, prev: 0 });
                      const totalDiff = totals.cur - totals.prev;
                      const totalPct = totals.prev !== 0 ? (totalDiff / Math.abs(totals.prev)) * 100 : 0;
                      return (
                        <TableRow>
                          <TableCell className="font-medium">Sum</TableCell>
                          <TableCell className="text-right tabular-nums font-medium whitespace-nowrap">{formatCurrency(totals.cur)}</TableCell>
                          {showPrevious && (
                            <TableCell className="text-right tabular-nums font-medium whitespace-nowrap">{formatCurrency(totals.prev)}</TableCell>
                          )}
                          <TableCell className="text-right tabular-nums font-medium whitespace-nowrap">{formatCurrency(totalDiff)}</TableCell>
                          {showPercent && (
                            <TableCell className="text-right tabular-nums font-medium whitespace-nowrap">{(totalPct >= 0 ? '+' : '') + totalPct.toFixed(1)}%</TableCell>
                          )}
                          <TableCell />
                        </TableRow>
                      );
                    })()}
                  </TableBody>
                </Table>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
      {import.meta.env?.DEV && debugOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-80 max-h-[60vh] overflow-auto border rounded-md bg-background shadow p-3 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Order audit</span>
            <Button variant="ghost" size="sm" onClick={() => setDebugOpen(false)}>Lukk</Button>
          </div>
          <div className="space-y-3">
            <div>
              <div className="font-medium">Resultat (røtter)</div>
              <ol className="list-decimal list-inside">
                {(rawIncome || []).slice(0, 20).map((n: any) => (
                  <li key={n.id}>{String(n.standard_number)} — {n.standard_name}</li>
                ))}
              </ol>
            </div>
            <div>
              <div className="font-medium">Balanse (røtter)</div>
              <ol className="list-decimal list-inside">
                {(rawBalance || []).slice(0, 20).map((n: any) => (
                  <li key={n.id}>{String(n.standard_number)} — {n.standard_name}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
