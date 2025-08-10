import React, { useEffect, useMemo, useState } from 'react';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';

interface MaterialityRow {
  id?: string;
  client_id: string;
  fiscal_year: number;
  materiality: number;
  working_materiality: number;
  clearly_trivial: number;
  currency?: string;
}

function formatCurrency(n?: number) {
  if (n == null) return '—';
  return new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK' }).format(n);
}

const MaterialitySummary: React.FC = () => {
  const { selectedClientId, selectedFiscalYear } = useFiscalYear();
  const [data, setData] = useState<MaterialityRow | null>(null);
  const [open, setOpen] = useState(false);
  const [v, setV] = useState<number | ''>('');
  const [av, setAv] = useState<number | ''>('');
  const [uf, setUf] = useState<number | ''>('');
  const canQuery = useMemo(() => !!selectedClientId && !!selectedFiscalYear, [selectedClientId, selectedFiscalYear]);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!canQuery) return;
      const { data, error } = await supabase
        .from('materiality_settings')
        .select('*')
        .eq('client_id', selectedClientId!)
        .eq('fiscal_year', selectedFiscalYear)
        .maybeSingle();

      if (error) {
        console.warn('Kunne ikke hente vesentlighet:', error.message);
        if (!isMounted) return;
        setData(null);
        setV(''); setAv(''); setUf('');
        return;
      }
      if (!isMounted) return;
      setData(data as MaterialityRow | null);
      setV(data?.materiality ?? '');
      setAv(data?.working_materiality ?? '');
      setUf(data?.clearly_trivial ?? '');
    }
    load();
    return () => { isMounted = false; };
  }, [canQuery, selectedClientId, selectedFiscalYear]);

  const handleSave = async () => {
    if (!selectedClientId || !selectedFiscalYear) return;
    const payload = {
      client_id: selectedClientId,
      fiscal_year: selectedFiscalYear,
      materiality: Number(v) || 0,
      working_materiality: Number(av) || 0,
      clearly_trivial: Number(uf) || 0,
      currency: 'NOK'
    } as const;

    const { data: upserted, error } = await supabase
      .from('materiality_settings')
      .upsert(payload, { onConflict: 'client_id,fiscal_year' })
      .select()
      .maybeSingle();

    if (error) {
      toast.error('Kunne ikke lagre vesentlighet');
      console.error(error);
      return;
    }
    setData(upserted as MaterialityRow);
    toast.success('Vesentlighet oppdatert');
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 text-xs">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              <span className="font-medium">V:</span>
              <Badge variant="outline" className="font-mono">{formatCurrency(data?.materiality)}</Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Vesentlighetsgrense</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              <span className="font-medium">AV:</span>
              <Badge variant="outline" className="font-mono">{formatCurrency(data?.working_materiality)}</Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Arbeidsvesentlighetsgrense</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              <span className="font-medium">UF:</span>
              <Badge variant="outline" className="font-mono">{formatCurrency(data?.clearly_trivial)}</Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Ubetydelig feil</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="icon" variant="ghost" aria-label="Rediger vesentlighet">
            <Pencil className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rediger vesentlighet ({selectedFiscalYear})</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="v" className="col-span-2">Vesentlighetsgrense (V)</Label>
              <Input id="v" type="number" value={v} onChange={(e) => setV(e.target.value === '' ? '' : Number(e.target.value))} className="col-span-2" />
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="av" className="col-span-2">Arbeidsvesentlighetsgrense (AV)</Label>
              <Input id="av" type="number" value={av} onChange={(e) => setAv(e.target.value === '' ? '' : Number(e.target.value))} className="col-span-2" />
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="uf" className="col-span-2">Ubetydelig feil (UF)</Label>
              <Input id="uf" type="number" value={uf} onChange={(e) => setUf(e.target.value === '' ? '' : Number(e.target.value))} className="col-span-2" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>Avbryt</Button>
            <Button onClick={handleSave}>Lagre</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MaterialitySummary;
