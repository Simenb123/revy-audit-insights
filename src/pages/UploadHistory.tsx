import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FileText, RotateCcw, AlertTriangle, CheckCircle, ListFilter } from 'lucide-react';
import { useUploadBatches, UploadBatch } from '@/hooks/useUploadBatches';
import { format } from 'date-fns';

const statusBadge = (status: UploadBatch['status']) => {
  switch (status) {
    case 'completed':
      return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" /> Fullført</Badge>;
    case 'failed':
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" /> Feilet</Badge>;
    case 'processing':
      return <Badge variant="secondary">Behandler</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const batchTypeLabel: Record<string, string> = {
  all: 'Alle typer',
  trial_balance: 'Saldobalanse',
  general_ledger: 'Hovedbok',
  chart_of_accounts: 'Kontoplan',
};

export default function UploadHistory() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [batchType, setBatchType] = useState<string>('all');
  const [status, setStatus] = useState<'all' | UploadBatch['status']>('all');
  const [errorLog, setErrorLog] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Opplastingshistorikk – Revio';
  }, []);

  const { data: batches = [], isLoading } = useUploadBatches({ clientId: clientId!, batchType, status });

  const totals = useMemo(() => {
    const total = batches.length;
    const completed = batches.filter(b => b.status === 'completed').length;
    const failed = batches.filter(b => b.status === 'failed').length;
    return { total, completed, failed };
  }, [batches]);

  return (
    <main className="container mx-auto py-6">
      <section className="mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-2 inline-flex items-center gap-2">
          <RotateCcw className="h-4 w-4" /> Tilbake
        </Button>
        <h1 className="text-2xl font-semibold">Opplastingshistorikk</h1>
        <p className="text-sm text-muted-foreground">Oversikt over alle opplastinger og prosesseringsstatus for klienten</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filtrering</CardTitle>
            <CardDescription>Begrens visningen etter type og status</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <ListFilter className="h-4 w-4 text-muted-foreground" />
              <div className="grid w-full gap-1">
                <label className="text-xs text-muted-foreground">Type</label>
                <Select value={batchType} onValueChange={setBatchType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Velg type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(batchTypeLabel).map((k) => (
                      <SelectItem key={k} value={k}>{batchTypeLabel[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-1">
              <label className="text-xs text-muted-foreground">Status</label>
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Velg status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="processing">Behandler</SelectItem>
                  <SelectItem value="completed">Fullført</SelectItem>
                  <SelectItem value="failed">Feilet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              {totals.total} batcher · {totals.completed} fullført · {totals.failed} feilet
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" /> Batcher
            </CardTitle>
            <CardDescription>Nyeste først. Oppdateres i sanntid.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Laster…</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dato</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Fil</TableHead>
                    <TableHead className="text-right">Poster</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ferdig</TableHead>
                    <TableHead className="text-right">Feil</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>{format(new Date(b.created_at), 'yyyy-MM-dd HH:mm')}</TableCell>
                      <TableCell>{batchTypeLabel[b.batch_type] || b.batch_type}</TableCell>
                      <TableCell className="font-medium">{b.file_name}</TableCell>
                      <TableCell className="text-right">{b.processed_records ?? 0}/{b.total_records}</TableCell>
                      <TableCell>{statusBadge(b.status)}</TableCell>
                      <TableCell>{b.completed_at ? format(new Date(b.completed_at), 'HH:mm') : '-'}</TableCell>
                      <TableCell className="text-right">{b.error_records || 0}</TableCell>
                      <TableCell className="text-right">
                        {(b.error_records || 0) > 0 && (
                          <Button variant="outline" size="sm" onClick={() => setErrorLog(b.error_log || 'Ingen detaljert feil-logg tilgjengelig')}>
                            Vis feil
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {batches.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                        Ingen batcher funnet for valgt filter.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>

      <Dialog open={!!errorLog} onOpenChange={(open) => !open && setErrorLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Feil-logg</DialogTitle>
            <DialogDescription>Detaljer fra prosessering</DialogDescription>
          </DialogHeader>
          <pre className="max-h-[60vh] overflow-auto rounded-md bg-muted p-4 text-xs whitespace-pre-wrap">{errorLog}</pre>
        </DialogContent>
      </Dialog>
    </main>
  );
}
