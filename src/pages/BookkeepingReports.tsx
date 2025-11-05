import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IncomeStatementReport } from '@/components/reports/IncomeStatementReport';
import { BalanceSheetReport } from '@/components/reports/BalanceSheetReport';
import { BankReconciliationPanel } from '@/components/reconciliation/BankReconciliationPanel';
import { useClients } from '@/hooks/useClients';
import { CalendarIcon, FileText, TrendingUp, DollarSign, CreditCard } from 'lucide-react';
import PageLayout from '@/components/Layout/PageLayout';

export default function BookkeepingReports() {
  const { clients } = useClients();
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [periodStart, setPeriodStart] = useState<string>(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
  );
  const [periodEnd, setPeriodEnd] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [balanceDate, setBalanceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const selectedClient = clients?.find((c: any) => c.id === selectedClientId);

  return (
    <PageLayout width="wide" spacing="normal">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Regnskapsrapporter</h1>
          <p className="text-muted-foreground">
            Standard regnskapsrapporter og avstemming
          </p>
        </div>
      </div>

      {/* Client Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Velg klient og periode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client">Klient</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg klient..." />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((client: any) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valgt klient</Label>
              <div className="p-2 bg-muted rounded border">
                {selectedClient ? selectedClient.name : 'Ingen klient valgt'}
              </div>
            </div>
          </div>

          {selectedClientId && (
            <div className="grid md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="periodStart">Fra dato</Label>
                <Input
                  id="periodStart"
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="periodEnd">Til dato</Label>
                <Input
                  id="periodEnd"
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="balanceDate">Balansedato</Label>
                <Input
                  id="balanceDate"
                  type="date"
                  value={balanceDate}
                  onChange={(e) => setBalanceDate(e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedClientId && (
        <Tabs defaultValue="income-statement" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="income-statement" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Resultatregnskap
            </TabsTrigger>
            <TabsTrigger value="balance-sheet" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Balanse
            </TabsTrigger>
            <TabsTrigger value="reconciliation" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Avstemming
            </TabsTrigger>
          </TabsList>

          <TabsContent value="income-statement">
            <IncomeStatementReport
              clientId={selectedClientId}
              periodStart={periodStart}
              periodEnd={periodEnd}
            />
          </TabsContent>

          <TabsContent value="balance-sheet">
            <BalanceSheetReport
              clientId={selectedClientId}
              asOfDate={balanceDate}
            />
          </TabsContent>

          <TabsContent value="reconciliation">
            <BankReconciliationPanel clientId={selectedClientId} />
          </TabsContent>
        </Tabs>
      )}

      {!selectedClientId && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Velg en klient</h3>
              <p className="text-muted-foreground">
                Velg en klient for å se regnskapsrapporter og avstemminger
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </PageLayout>
  );
}