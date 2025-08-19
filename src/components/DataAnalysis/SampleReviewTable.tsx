import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DataTable, { DataTableColumn } from '@/components/ui/data-table';
import { useSampleReview, SampleItem } from '@/hooks/useSampleReview';
import { format } from 'date-fns';
import { CheckCircle, AlertTriangle, Clock, Eye, ArrowLeft, MessageSquare } from 'lucide-react';
import VoucherDrillDownDialog from './VoucherDrillDownDialog';
import { TextSanitizer } from '@/components/Utils/TextSanitizer';

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
  const [commentingItem, setCommentingItem] = useState<SampleItem | null>(null);
  const [commentText, setCommentText] = useState<string>('');
  const [deviationAmount, setDeviationAmount] = useState<string>('0');
  const [pendingStatus, setPendingStatus] = useState<'follow_up' | 'deviation' | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusIcon = (status: 'pending' | 'ok' | 'deviation' | 'follow_up') => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'deviation':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'follow_up':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadgeVariant = (status: 'pending' | 'ok' | 'deviation' | 'follow_up') => {
    switch (status) {
      case 'ok':
        return 'success';
      case 'deviation':
        return 'destructive';
      case 'follow_up':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: 'pending' | 'ok' | 'deviation' | 'follow_up') => {
    switch (status) {
      case 'ok':
        return 'Ingen avvik';
      case 'deviation':
        return 'Avvik';
      case 'follow_up':
        return 'Til oppfølging';
      default:
        return 'Venter';
    }
  };

  const handleStatusChange = (item: SampleItem, newStatus: 'ok' | 'deviation' | 'follow_up') => {
    if (newStatus === 'ok') {
      // No comment needed for OK status
      updateItemReview(item.id, true, 0, '', newStatus);
    } else {
      // Open comment dialog for deviation or follow_up
      setCommentingItem(item);
      setPendingStatus(newStatus);
      setCommentText(item.deviation_notes || '');
      setDeviationAmount(item.deviation_amount?.toString() || '0');
    }
  };

  const handleSaveComment = () => {
    if (!commentingItem || !pendingStatus) return;

    const amount = pendingStatus === 'deviation' ? parseFloat(deviationAmount) || 0 : 0;
    updateItemReview(
      commentingItem.id,
      true,
      amount,
      commentText,
      pendingStatus
    );
    setCommentingItem(null);
    setPendingStatus(null);
    setCommentText('');
    setDeviationAmount('0');
  };

  const columns: DataTableColumn<SampleItem>[] = useMemo(() => [
    {
      key: 'status',
      header: 'Status',
      accessor: 'review_status',
      align: 'center',
      format: (value: 'pending' | 'ok' | 'deviation' | 'follow_up', row: SampleItem) => (
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
      key: 'review_controls',
      header: 'Kontroll',
      accessor: () => '',
      align: 'center',
      format: (_, row: SampleItem) => (
        <div className="flex items-center gap-3">
          <RadioGroup 
            value={row.review_status} 
            onValueChange={(value) => handleStatusChange(row, value as 'ok' | 'deviation' | 'follow_up')}
            className="flex flex-row gap-6"
            disabled={isUpdating}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ok" id={`${row.id}-ok`} className="border-green-500 text-green-500" />
              <Label htmlFor={`${row.id}-ok`} className="text-sm text-green-700 font-medium">
                Ingen avvik
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="follow_up" id={`${row.id}-follow_up`} className="border-yellow-500 text-yellow-500" />
              <Label htmlFor={`${row.id}-follow_up`} className="text-sm text-yellow-700 font-medium">
                Til oppfølging
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="deviation" id={`${row.id}-deviation`} className="border-red-500 text-red-500" />
              <Label htmlFor={`${row.id}-deviation`} className="text-sm text-red-700 font-medium">
                Avvik
              </Label>
            </div>
          </RadioGroup>
          {(row.deviation_notes || row.deviation_amount > 0) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-blue-600"
              onClick={() => {
                setCommentingItem(row);
                setCommentText(row.deviation_notes || '');
                setDeviationAmount(row.deviation_amount?.toString() || '0');
              }}
            >
              <MessageSquare className="h-3 w-3" />
            </Button>
          )}
        </div>
      ),
    },
    {
      key: 'deviation_amount',
      header: 'Avvik',
      accessor: 'deviation_amount',
      sortable: true,
      align: 'right',
      format: (value: number) => {
        if (!value || value === 0) return '-';
        return (
          <span className="text-red-600 font-medium">
            {formatCurrency(value)}
          </span>
        );
      },
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
                  Velg kontrollresultat for hvert element. Kommentarer kreves for oppfølging og avvik.
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
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card className="p-4">
            <div className="text-2xl font-bold">{reviewSummary.totalItems}</div>
            <div className="text-sm text-muted-foreground">Totalt</div>
          </Card>
          <Card className="p-4 bg-green-50">
            <div className="text-2xl font-bold text-green-600">{reviewSummary.okItems}</div>
            <div className="text-sm text-green-700">Ingen avvik</div>
          </Card>
          <Card className="p-4 bg-yellow-50">
            <div className="text-2xl font-bold text-yellow-600">{reviewSummary.followUpItems}</div>
            <div className="text-sm text-yellow-700">Til oppfølging</div>
          </Card>
          <Card className="p-4 bg-red-50">
            <div className="text-2xl font-bold text-red-600">{reviewSummary.deviationItems}</div>
            <div className="text-sm text-red-700">Avvik</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-muted-foreground">{reviewSummary.pendingItems}</div>
            <div className="text-sm text-muted-foreground">Gjenstår</div>
          </Card>
          <Card className="p-4 bg-red-50">
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(reviewSummary.totalDeviationAmount)}
            </div>
            <div className="text-sm text-red-700">Sum avvik</div>
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

      {/* Comment dialog */}
      <Dialog open={!!commentingItem} onOpenChange={(open) => !open && setCommentingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingStatus === 'deviation' ? 'Registrer avvik' : 'Legg til kommentar'}
            </DialogTitle>
            <DialogDescription>
              Bilag: {commentingItem?.voucher_number} - {commentingItem?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {pendingStatus === 'deviation' && (
              <div>
                <Label className="text-sm font-medium">Avviksbeløp (NOK)</Label>
                <Input
                  type="number"
                  value={deviationAmount}
                  onChange={(e) => setDeviationAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            )}

            <div>
              <Label className="text-sm font-medium">
                {pendingStatus === 'deviation' ? 'Beskrivelse av avvik' : 'Kommentar'}
              </Label>
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={
                  pendingStatus === 'deviation' 
                    ? "Beskriv avviket..." 
                    : "Legg til kommentar for oppfølging..."
                }
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => {
                setCommentingItem(null);
                setPendingStatus(null);
              }}>
                Avbryt
              </Button>
              <Button onClick={handleSaveComment} disabled={isUpdating}>
                Lagre
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SampleReviewTable;