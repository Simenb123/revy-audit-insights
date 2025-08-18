import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from '@/integrations/supabase/client';
import { FileText, Calendar, DollarSign, Hash, Building, AlertTriangle, TrendingUp, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

interface DrilldownDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'voucher' | 'account' | 'transaction';
  identifier: string;
  clientId: string;
  versionId?: string;
  title: string;
  description?: string;
}

interface TransactionDetail {
  id: string;
  transaction_date: string;
  description: string;
  debit_amount: number | null;
  credit_amount: number | null;
  voucher_number: string;
  client_chart_of_accounts?: {
    account_number: string;
    account_name: string;
    account_type: string;
  };
}

interface AccountBalance {
  account_number: string;
  account_name: string;
  account_type: string;
  total_debit: number;
  total_credit: number;
  balance: number;
  transaction_count: number;
}

interface VoucherSummary {
  voucher_number: string;
  transaction_count: number;
  total_amount: number;
  transaction_date: string;
  balance_difference: number;
}

export const DrilldownDialog: React.FC<DrilldownDialogProps> = ({
  open,
  onOpenChange,
  type,
  identifier,
  clientId,
  versionId,
  title,
  description
}) => {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<TransactionDetail[]>([]);
  const [accountBalance, setAccountBalance] = useState<AccountBalance | null>(null);
  const [voucherSummary, setVoucherSummary] = useState<VoucherSummary | null>(null);
  const [analysisInsights, setAnalysisInsights] = useState<string[]>([]);

  useEffect(() => {
    if (open && identifier) {
      loadDrilldownData();
    }
  }, [open, identifier, type, clientId, versionId]);

  const loadDrilldownData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('general_ledger_transactions')
        .select(`
          id,
          transaction_date,
          description,
          debit_amount,
          credit_amount,
          voucher_number,
          client_chart_of_accounts!inner(
            account_number,
            account_name,
            account_type
          )
        `)
        .eq('client_id', clientId);

      if (versionId) {
        query = query.eq('version_id', versionId);
      }

      // Apply filter based on type
      switch (type) {
        case 'voucher':
          query = query.eq('voucher_number', identifier);
          break;
        case 'account':
          query = query.eq('client_chart_of_accounts.account_number', identifier);
          break;
        case 'transaction':
          query = query.eq('id', identifier);
          break;
      }

      const { data: transactionData, error } = await query
        .order('transaction_date', { ascending: false })
        .limit(1000);

      if (error) throw error;

      setTransactions(transactionData || []);

      // Calculate additional insights based on type
      if (type === 'account' && transactionData) {
        const totalDebit = transactionData.reduce((sum, t) => sum + (t.debit_amount || 0), 0);
        const totalCredit = transactionData.reduce((sum, t) => sum + (t.credit_amount || 0), 0);
        const account = transactionData[0]?.client_chart_of_accounts;
        
        if (account) {
          setAccountBalance({
            account_number: account.account_number,
            account_name: account.account_name,
            account_type: account.account_type,
            total_debit: totalDebit,
            total_credit: totalCredit,
            balance: totalDebit - totalCredit,
            transaction_count: transactionData.length
          });
        }
      }

      if (type === 'voucher' && transactionData) {
        const totalAmount = transactionData.reduce((sum, t) => 
          sum + Math.abs((t.debit_amount || 0) - (t.credit_amount || 0)), 0
        );
        const totalDebit = transactionData.reduce((sum, t) => sum + (t.debit_amount || 0), 0);
        const totalCredit = transactionData.reduce((sum, t) => sum + (t.credit_amount || 0), 0);
        
        setVoucherSummary({
          voucher_number: identifier,
          transaction_count: transactionData.length,
          total_amount: totalAmount,
          transaction_date: transactionData[0]?.transaction_date || '',
          balance_difference: Math.abs(totalDebit - totalCredit)
        });
      }

      // Generate analysis insights
      generateInsights(transactionData || [], type);

    } catch (error) {
      console.error('Error loading drilldown data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = (data: TransactionDetail[], analysisType: string) => {
    const insights: string[] = [];

    if (data.length === 0) {
      insights.push('Ingen transaksjoner funnet for dette elementet.');
      setAnalysisInsights(insights);
      return;
    }

    switch (analysisType) {
      case 'voucher':
        const totalDebit = data.reduce((sum, t) => sum + (t.debit_amount || 0), 0);
        const totalCredit = data.reduce((sum, t) => sum + (t.credit_amount || 0), 0);
        const balanceDiff = Math.abs(totalDebit - totalCredit);
        
        if (balanceDiff > 0.01) {
          insights.push(`⚠️ Bilag er ikke i balanse: Debet ${totalDebit.toLocaleString()} vs Kredit ${totalCredit.toLocaleString()}`);
        } else {
          insights.push(`✅ Bilag er i balanse med ${data.length} posteringer`);
        }
        
        if (data.length === 1) {
          insights.push('🔍 Enkelt transaksjon - kan indikere automatisert postering');
        } else if (data.length > 10) {
          insights.push('📊 Komplekst bilag med mange posteringer - kontroller logikk');
        }

        const uniqueAccounts = new Set(data.map(t => t.client_chart_of_accounts?.account_number));
        insights.push(`📈 Berører ${uniqueAccounts.size} ulike kontoer`);
        break;

      case 'account':
        const avgAmount = data.reduce((sum, t) => sum + Math.abs((t.debit_amount || 0) - (t.credit_amount || 0)), 0) / data.length;
        const maxAmount = Math.max(...data.map(t => Math.abs((t.debit_amount || 0) - (t.credit_amount || 0))));
        
        insights.push(`📊 ${data.length} transaksjoner totalt`);
        insights.push(`💰 Gjennomsnittlig beløp: ${avgAmount.toLocaleString()} NOK`);
        insights.push(`🔺 Største transaksjon: ${maxAmount.toLocaleString()} NOK`);
        
        // Check for unusual patterns
        const recentTransactions = data.filter(t => new Date(t.transaction_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
        if (recentTransactions.length / data.length > 0.8) {
          insights.push('🕒 Mesteparten av aktiviteten er fra siste måned');
        }

        const weekendTransactions = data.filter(t => {
          const date = new Date(t.transaction_date);
          const day = date.getDay();
          return day === 0 || day === 6;
        });
        if (weekendTransactions.length > 0) {
          insights.push(`⏰ ${weekendTransactions.length} transaksjoner postert i helger`);
        }
        break;

      case 'transaction':
        const transaction = data[0];
        if (transaction) {
          insights.push(`📅 Transaksjondato: ${format(new Date(transaction.transaction_date), 'dd.MM.yyyy', { locale: nb })}`);
          insights.push(`💰 Beløp: ${((transaction.debit_amount || 0) + (transaction.credit_amount || 0)).toLocaleString()} NOK`);
          insights.push(`📋 Konto: ${transaction.client_chart_of_accounts?.account_number} - ${transaction.client_chart_of_accounts?.account_name}`);
          
          if (transaction.voucher_number) {
            insights.push(`🧾 Bilagsnummer: ${transaction.voucher_number}`);
          }
        }
        break;
    }

    setAnalysisInsights(insights);
  };

  const formatAmount = (amount: number | null) => {
    if (!amount) return '0';
    return amount.toLocaleString('no-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'voucher':
        return <FileText className="h-5 w-5" />;
      case 'account':
        return <Building className="h-5 w-5" />;
      case 'transaction':
        return <DollarSign className="h-5 w-5" />;
      default:
        return <Eye className="h-5 w-5" />;
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'voucher':
        return 'Bilag';
      case 'account':
        return 'Konto';
      case 'transaction':
        return 'Transaksjon';
      default:
        return 'Detaljer';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTypeIcon()}
            {title}
          </DialogTitle>
          <DialogDescription>
            {description || `Detaljert visning av ${getTypeLabel().toLowerCase()}: ${identifier}`}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Oversikt</TabsTrigger>
            <TabsTrigger value="transactions">Transaksjoner</TabsTrigger>
            <TabsTrigger value="analysis">Analyse</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accountBalance && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Kontoinformasjon</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Kontonummer:</span>
                      <span className="font-mono">{accountBalance.account_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Kontonavn:</span>
                      <span>{accountBalance.account_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Kontotype:</span>
                      <Badge variant="outline">{accountBalance.account_type}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Antall transaksjoner:</span>
                      <span>{accountBalance.transaction_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total debet:</span>
                      <span className="font-mono">{formatAmount(accountBalance.total_debit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total kredit:</span>
                      <span className="font-mono">{formatAmount(accountBalance.total_credit)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-medium">Saldo:</span>
                      <span className={`font-mono font-medium ${accountBalance.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatAmount(accountBalance.balance)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {voucherSummary && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Bilagsinformasjon</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bilagsnummer:</span>
                      <span className="font-mono">{voucherSummary.voucher_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dato:</span>
                      <span>{format(new Date(voucherSummary.transaction_date), 'dd.MM.yyyy', { locale: nb })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Antall poster:</span>
                      <span>{voucherSummary.transaction_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total beløp:</span>
                      <span className="font-mono">{formatAmount(voucherSummary.total_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Balanseforskjell:</span>
                      <span className={`font-mono ${voucherSummary.balance_difference > 0.01 ? 'text-red-600 font-medium' : 'text-green-600'}`}>
                        {formatAmount(voucherSummary.balance_difference)}
                      </span>
                    </div>
                    {voucherSummary.balance_difference > 0.01 && (
                      <div className="bg-destructive/10 p-2 rounded-md">
                        <div className="flex items-center gap-2 text-destructive text-sm">
                          <AlertTriangle className="h-4 w-4" />
                          Bilag er ikke i balanse
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="mt-4">
            <ScrollArea className="h-[400px]">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-muted-foreground">Laster transaksjoner...</div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dato</TableHead>
                      <TableHead>Beskrivelse</TableHead>
                      <TableHead>Konto</TableHead>
                      <TableHead className="text-right">Debet</TableHead>
                      <TableHead className="text-right">Kredit</TableHead>
                      <TableHead>Bilag</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-mono text-sm">
                          {format(new Date(transaction.transaction_date), 'dd.MM.yyyy', { locale: nb })}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {transaction.description}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {transaction.client_chart_of_accounts?.account_number} - {transaction.client_chart_of_accounts?.account_name}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {transaction.debit_amount ? formatAmount(transaction.debit_amount) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {transaction.credit_amount ? formatAmount(transaction.credit_amount) : '-'}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {transaction.voucher_number}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="analysis" className="mt-4">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Automatisk analyse
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysisInsights.map((insight, index) => (
                      <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                        <div className="text-sm leading-relaxed">{insight}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};