import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DataTable, { DataTableColumn } from '@/components/ui/data-table';
import { useSampleReview, SampleItem } from '@/hooks/useSampleReview';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Clock, AlertTriangle, Eye, ArrowLeft } from 'lucide-react';
import ActionStatusBadge from '@/components/AuditActions/ActionStatusBadge';
import VoucherDrillDownDialog from './VoucherDrillDownDialog';

interface SampleReviewTableProps {
  planId: string;
  planName: string;
  onBack: () => void;
}

const SampleReviewTable: React.FC<SampleReviewTableProps> = ({
  planId,
  planName,
  onBack,
}) => {
  const { sampleItems, updateItemReview, reviewSummary, isLoading, isUpdating } = useSampleReview(planId);
  const [editingItem, setEditingItem] = useState<SampleItem | null>(null);
  const [editDeviationAmount, setEditDeviationAmount] = useState<string>('0');
  const [editDeviationNotes, setEditDeviationNotes] = useState<string>('');
  const [editStatus, setEditStatus] = useState<'pending' | 'ok' | 'deviation'>('ok');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusIcon = (status: 'pending' | 'ok' | 'deviation') => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'deviation':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadgeVariant = (status: 'pending' | 'ok' | 'deviation') => {
    switch (status) {
      case 'ok':
        return 'default';
      case 'deviation':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: 'pending' | 'ok' | 'deviation') => {
    switch (status) {
      case 'ok':
        return 'OK';
      case 'deviation':
        return 'Avvik';
      default:
        return 'Venter';
    }
  };

  const handleEdit = (item: SampleItem) => {
    setEditingItem(item);
    setEditDeviationAmount(item.deviation_amount?.toString() || '0');
    setEditDeviationNotes(item.deviation_notes || '');
    setEditStatus(item.review_status);
  };

  const handleSave = () => {
    if (!editingItem) return;

    const deviationAmount = parseFloat(editDeviationAmount) || 0;
    updateItemReview(
      editingItem.id,
      true,
      deviationAmount,
      editDeviationNotes,
      editStatus
    );
    setEditingItem(null);
  };

  const handleQuickReview = (item: SampleItem, status: 'ok' | 'deviation') => {
    updateItemReview(item.id, true, 0, '', status);
  };

  const columns: DataTableColumn<SampleItem>[] = useMemo(() => [
    {
      key: 'reviewed',
      header: 'Kontrollert',
      accessor: 'is_reviewed',
      align: 'center',
      format: (value: boolean, row: SampleItem) => (
        <Checkbox
          checked={value}
          onCheckedChange={(checked) => {
            if (!checked) {
              updateItemReview(row.id, false, 0, '', 'pending');
            } else {
              handleEdit(row);
            }
          }}
        />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: 'review_status',
      align: 'center',
      format: (value: 'pending' | 'ok' | 'deviation', row: SampleItem) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(value)}
          <Badge variant={getStatusBadgeVariant(value)}>
            {getStatusLabel(value)}
          </Badge>
        </div>
      ),
    },
    {
      key: 'transaction_date',
      header: 'Dato',
      accessor: 'transaction_date',
      sortable: true,
      format: (value: string) => format(new Date(value), 'dd.MM.yyyy'),
    },
    {
      key: 'voucher_number',
      header: 'Bilag',
      accessor: 'voucher_number',
      sortable: true,
      searchable: true,
      className: 'font-medium',
      format: (value: string, row: SampleItem) => (
        <div className="flex items-center gap-2">
          <span>{value}</span>
          <VoucherDrillDownDialog
            voucherNumber={value}
            transactionDate={row.transaction_date}
            trigger={
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Eye className="h-3 w-3" />
              </Button>
            }
          />
        </div>
      ),
    },
    {
      key: 'account_number',
      header: 'Konto',
      accessor: 'account_no',
      sortable: true,
      searchable: true,
    },
    {
      key: 'account_name',
      header: 'Kontonavn',
      accessor: 'account_name',
      sortable: true,
      searchable: true,
    },
    {
      key: 'description',
      header: 'Beskrivelse',
      accessor: 'description',
      searchable: true,
      className: 'max-w-xs truncate',
    },
    {
      key: 'amount',
      header: 'Beløp',
      accessor: 'amount',
      sortable: true,
      align: 'right',
      format: (value: number) => (
        <span className={value < 0 ? 'text-red-600' : ''}>
          {formatCurrency(value)}
        </span>
      ),
    },
    {
      key: 'deviation_amount',
      header: 'Avvik',
      accessor: 'deviation_amount',
      sortable: true,
      align: 'right',
      format: (value: number, row: SampleItem) => {
        if (!value || value === 0) return '-';
        return (
          <span className="text-red-600 font-medium">
            {formatCurrency(value)}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Handlinger',
      accessor: () => '',
      align: 'center',
      format: (_, row: SampleItem) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleQuickReview(row, 'ok')}
            disabled={isUpdating}
            className="text-green-600 hover:text-green-700 hover:bg-green-50"
          >
            <CheckCircle className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(row)}
            disabled={isUpdating}
            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
          >
            <AlertTriangle className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
  ], [isUpdating, updateItemReview]);

  return (
    <div className="space-y-4">
      {/* Header with back button and summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tilbake
              </Button>
              <div>
                <CardTitle>Kontroller utvalg: {planName}</CardTitle>
                <CardDescription>
                  Huk av elementer som er kontrollert og registrer eventuelle avvik
                </CardDescription>
              </div>
            </div>

            {reviewSummary && (
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  {reviewSummary.reviewedItems} av {reviewSummary.totalItems} kontrollert
                </div>
                <Badge variant="outline">
                  {reviewSummary.completionPercentage}% fullført
                </Badge>
                {reviewSummary.totalDeviationAmount > 0 && (
                  <Badge variant="destructive">
                    {formatCurrency(reviewSummary.totalDeviationAmount)} avvik
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Progress summary */}
      {reviewSummary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="text-2xl font-bold">{reviewSummary.totalItems}</div>
            <div className="text-sm text-muted-foreground">Totalt</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-green-600">{reviewSummary.okItems}</div>
            <div className="text-sm text-muted-foreground">OK</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-red-600">{reviewSummary.deviationItems}</div>
            <div className="text-sm text-muted-foreground">Avvik</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-gray-500">{reviewSummary.pendingItems}</div>
            <div className="text-sm text-muted-foreground">Gjenstår</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(reviewSummary.totalDeviationAmount)}
            </div>
            <div className="text-sm text-muted-foreground">Sum avvik</div>
          </Card>
        </div>
      )}

      {/* Main table */}
      <DataTable
        title="Utvalg for kontroll"
        data={sampleItems}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Søk i utvalg..."
        enableExport={true}
        exportFileName={`utvalg-kontroll-${planName}`}
        enablePagination={false}
        showTotals={true}
        emptyMessage="Ingen elementer i utvalget"
      />

      {/* Edit dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kontroller element</DialogTitle>
            <DialogDescription>
              Bilag: {editingItem?.voucher_number} - {editingItem?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Kontrollresultat</label>
              <Select value={editStatus} onValueChange={(value: 'pending' | 'ok' | 'deviation') => setEditStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ok">OK - Ingen avvik</SelectItem>
                  <SelectItem value="deviation">Avvik funnet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editStatus === 'deviation' && (
              <>
                <div>
                  <label className="text-sm font-medium">Avviksbeløp (NOK)</label>
                  <Input
                    type="number"
                    value={editDeviationAmount}
                    onChange={(e) => setEditDeviationAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Beskrivelse av avvik</label>
                  <Textarea
                    value={editDeviationNotes}
                    onChange={(e) => setEditDeviationNotes(e.target.value)}
                    placeholder="Beskriv avviket..."
                    rows={3}
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditingItem(null)}>
                Avbryt
              </Button>
              <Button onClick={handleSave} disabled={isUpdating}>
                Lagre kontroll
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SampleReviewTable;