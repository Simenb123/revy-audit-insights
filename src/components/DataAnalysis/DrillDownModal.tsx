import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, FileText, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VirtualScrollArea } from '@/components/ui/virtual-scroll-area';
import LoadingSkeleton from '@/components/ui/loading-skeleton';

interface DrillDownModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  fiscalYear: number;
  selectedAccountNumbers: string[];
  counterAccountNumber: string;
  counterAccountName: string;
  versionId?: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0
  }).format(amount);
};

const DrillDownModal: React.FC<DrillDownModalProps> = ({
  isOpen,
  onOpenChange,
  clientId,
  fiscalYear,
  selectedAccountNumbers,
  counterAccountNumber,
  counterAccountName,
  versionId
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 50;
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['drill-down-transactions', clientId, fiscalYear, selectedAccountNumbers, counterAccountNumber, versionId],
    queryFn: async () => {
      // Get voucher numbers that contain both selected accounts and counter account
      let voucherQuery = supabase
        .from('general_ledger_transactions')
        .select('voucher_number')
        .eq('client_id', clientId)
        .gte('transaction_date', `${fiscalYear}-01-01`)
        .lte('transaction_date', `${fiscalYear}-12-31`)
        .in('account_number', [...selectedAccountNumbers, counterAccountNumber]);

      if (versionId) {
        voucherQuery = voucherQuery.eq('version_id', versionId);
      }

      const { data: voucherData } = await voucherQuery;
      const voucherNumbers = [...new Set(voucherData?.map(v => v.voucher_number).filter(Boolean))];

      if (voucherNumbers.length === 0) return [];

      // Get all transactions in those vouchers
      let transactionQuery = supabase
        .from('general_ledger_transactions')
        .select(`
          id,
          transaction_date,
          account_number,
          description,
          debit_amount,
          credit_amount,
          voucher_number,
          client_chart_of_accounts!inner(account_name)
        `)
        .eq('client_id', clientId)
        .in('voucher_number', voucherNumbers)
        .order('transaction_date', { ascending: false });

      if (versionId) {
        transactionQuery = transactionQuery.eq('version_id', versionId);
      }

      const { data: allTransactions } = await transactionQuery;

      // Group by voucher and filter relevant combinations
      const relevantTransactions = allTransactions?.filter(t => 
        selectedAccountNumbers.includes(t.account_number) || t.account_number === counterAccountNumber
      ) || [];

      return relevantTransactions;
    },
    enabled: isOpen && !!clientId && selectedAccountNumbers.length > 0 && !!counterAccountNumber
  });

  const monthlyStats = React.useMemo(() => {
    if (!transactions) return [];

    const monthlyMap = new Map<string, { count: number; totalAmount: number }>();
    
    transactions.forEach(t => {
      const month = t.transaction_date.substring(0, 7); // YYYY-MM
      const amount = Math.abs((t.debit_amount || 0) - (t.credit_amount || 0));
      
      const existing = monthlyMap.get(month) || { count: 0, totalAmount: 0 };
      monthlyMap.set(month, {
        count: existing.count + 1,
        totalAmount: existing.totalAmount + amount
      });
    });

    return Array.from(monthlyMap.entries())
      .map(([month, stats]) => ({ month, ...stats }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [transactions]);

  const groupedByVoucher = React.useMemo(() => {
    if (!transactions) return [];

    const voucherMap = new Map<string, typeof transactions>();
    transactions.forEach(t => {
      const existing = voucherMap.get(t.voucher_number) || [];
      voucherMap.set(t.voucher_number, [...existing, t]);
    });

      return Array.from(voucherMap.entries())
        .map(([voucher, txns]) => ({
          voucher,
          transactions: txns.sort((a, b) => a.account_number.localeCompare(b.account_number)),
          totalAmount: txns.reduce((sum, t) => sum + Math.abs((t.debit_amount || 0) - (t.credit_amount || 0)), 0)
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount);
  }, [transactions]);

  const paginatedVouchers = groupedByVoucher.slice(
    currentPage * ITEMS_PER_PAGE, 
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(groupedByVoucher.length / ITEMS_PER_PAGE);

  const handlePreviousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  }, [totalPages]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]" role="dialog" aria-labelledby="drill-down-title">
        <DialogHeader>
          <DialogTitle id="drill-down-title" className="flex items-center gap-2">
            <FileText className="h-5 w-5" aria-hidden="true" />
            Detaljanalyse: {counterAccountNumber} {counterAccountName}
          </DialogTitle>
          <DialogDescription>
            Transaksjoner mellom valgte kontoer og motkonto {counterAccountNumber}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <LoadingSkeleton 
            title="Laster transaksjonsdata..."
            description="Henter detaljerte bilagsopplysninger"
            showCharts={false}
            showStats={true}
            rows={3}
          />
        ) : (
          <div className="space-y-6">
            {/* Monthly Statistics */}
            {monthlyStats.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Månedlig fordeling
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {monthlyStats.map(stat => (
                    <div key={stat.month} className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-sm font-medium">{stat.month}</div>
                      <div className="text-xs text-muted-foreground">
                        {stat.count} transaksjoner
                      </div>
                      <div className="text-sm font-semibold text-primary">
                        {formatCurrency(stat.totalAmount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Transaction Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  Bilagsdetaljer ({groupedByVoucher.length} bilag)
                </h4>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 0}
                      aria-label="Forrige side"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Side {currentPage + 1} av {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages - 1}
                      aria-label="Neste side"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              
              <VirtualScrollArea
                items={paginatedVouchers}
                height={384}
                itemHeight={120}
                className="border rounded-md"
                renderItem={({ voucher, transactions: voucherTxns, totalAmount }, index) => (
                  <div key={voucher} className="border rounded-lg p-4 m-2" role="article" aria-label={`Bilag ${voucher}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-medium">Bilag {voucher}</div>
                      <Badge variant="outline" aria-label={`Totalbeløp: ${formatCurrency(totalAmount)}`}>
                        {formatCurrency(totalAmount)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2" role="list" aria-label="Transaksjoner i bilag">
                      {voucherTxns.map(t => (
                        <div 
                          key={t.id} 
                          className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded focus-within:ring-2 focus-within:ring-primary"
                          role="listitem"
                          tabIndex={0}
                        >
                          <div className="flex-1">
                            <div className="font-medium">
                              {t.account_number} {t.client_chart_of_accounts?.account_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {t.transaction_date} • {t.description || 'Ingen beskrivelse'}
                            </div>
                          </div>
                          <div className="text-right">
                            {t.debit_amount ? (
                              <div className="text-green-600" aria-label={`Debet: ${formatCurrency(t.debit_amount)}`}>
                                +{formatCurrency(t.debit_amount)}
                              </div>
                            ) : (
                              <div className="text-red-600" aria-label={`Kredit: ${formatCurrency(t.credit_amount || 0)}`}>
                                -{formatCurrency(t.credit_amount || 0)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DrillDownModal;