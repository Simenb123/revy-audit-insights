
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  Download, 
  ListFilter, 
  BarChart4, 
  FileCheck, 
  PlusCircle,
  Info,
  AlertTriangle,
  ChevronDown,
  BarChart
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { 
  BarChart as ReBarChart, 
  ResponsiveContainer, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ReTooltip
} from 'recharts';
import { Transaction, SamplingResult, Account, AccountGroup } from '@/types/revio';
import { SidebarProvider } from "@/components/ui/sidebar";
import AccountSelectionSidebar from "./AccountSelectionSidebar";
import MaterialityBanner from "./MaterialityBanner";

// Mock data for transactions (will be filtered based on selected account)
const allMockTransactions: Transaction[] = [
  // Income transactions (3000)
  { id: '1001', accountId: '3000', date: '2024-01-15', description: 'Faktura #12345', amount: 45000, voucher: 'FB-2024-0123' },
  { id: '1002', accountId: '3000', date: '2024-01-22', description: 'Faktura #12346', amount: 68000, voucher: 'FB-2024-0145' },
  { id: '1003', accountId: '3000', date: '2024-02-05', description: 'Faktura #12350', amount: 52000, voucher: 'FB-2024-0189' },
  { id: '1004', accountId: '3000', date: '2024-02-18', description: 'Faktura #12356', amount: 78000, voucher: 'FB-2024-0213' },
  { id: '1005', accountId: '3000', date: '2024-03-10', description: 'Faktura #12370', amount: 61000, voucher: 'FB-2024-0267' },
  { id: '1006', accountId: '3000', date: '2024-03-25', description: 'Faktura #12385', amount: 54000, voucher: 'FB-2024-0301' },
  { id: '1007', accountId: '3000', date: '2024-01-18', description: 'Faktura #12347', amount: 112000, voucher: 'FB-2024-0152' },
  { id: '1008', accountId: '3000', date: '2024-02-12', description: 'Faktura #12358', amount: 95000, voucher: 'FB-2024-0198' },
  { id: '1009', accountId: '3000', date: '2024-03-05', description: 'Faktura #12368', amount: 135000, voucher: 'FB-2024-0254' },
  { id: '1010', accountId: '3000', date: '2024-03-18', description: 'Faktura #12380', amount: 28000, voucher: 'FB-2024-0288' },
  
  // Income transactions (3100)
  { id: '2001', accountId: '3100', date: '2024-01-20', description: 'Faktura #12348', amount: 32000, voucher: 'FB-2024-0130' },
  { id: '2002', accountId: '3100', date: '2024-02-15', description: 'Faktura #12360', amount: 45000, voucher: 'FB-2024-0200' },
  { id: '2003', accountId: '3100', date: '2024-03-05', description: 'Faktura #12375', amount: 38000, voucher: 'FB-2024-0255' },
  
  // Expense transactions (4300)
  { id: '3001', accountId: '4300', date: '2024-01-10', description: 'Varekjøp', amount: -150000, voucher: 'LB-2024-0050' },
  { id: '3002', accountId: '4300', date: '2024-02-05', description: 'Varekjøp', amount: -185000, voucher: 'LB-2024-0120' },
  { id: '3003', accountId: '4300', date: '2024-03-15', description: 'Varekjøp', amount: -210000, voucher: 'LB-2024-0230' },
  
  // Expense transactions (5000)
  { id: '4001', accountId: '5000', date: '2024-01-15', description: 'Lønn januar', amount: -405000, voucher: 'LB-2024-0070' },
  { id: '4002', accountId: '5000', date: '2024-02-15', description: 'Lønn februar', amount: -405000, voucher: 'LB-2024-0150' },
  { id: '4003', accountId: '5000', date: '2024-03-15', description: 'Lønn mars', amount: -405000, voucher: 'LB-2024-0250' },
  
  // Expense transactions (6300)
  { id: '5001', accountId: '6300', date: '2024-01-05', description: 'Husleie Q1', amount: -285000, voucher: 'LB-2024-0020' },
  { id: '5002', accountId: '6300', date: '2024-04-05', description: 'Husleie Q2', amount: -285000, voucher: 'LB-2024-0320' },
  
  // Asset transactions (1500)
  { id: '6001', accountId: '1500', date: '2024-01-31', description: 'Kundeposter', amount: 520000, voucher: 'FB-2024-0180' },
  { id: '6002', accountId: '1500', date: '2024-02-28', description: 'Kundeposter', amount: 635000, voucher: 'FB-2024-0250' },
  { id: '6003', accountId: '1500', date: '2024-03-31', description: 'Kundeposter', amount: 695000, voucher: 'FB-2024-0350' },
  
  // Asset transactions (1920)
  { id: '7001', accountId: '1920', date: '2024-01-15', description: 'Innbetaling kundefordringer', amount: 485000, voucher: 'BB-2024-0015' },
  { id: '7002', accountId: '1920', date: '2024-02-15', description: 'Innbetaling kundefordringer', amount: 520000, voucher: 'BB-2024-0025' },
  { id: '7003', accountId: '1920', date: '2024-03-15', description: 'Innbetaling kundefordringer', amount: 635000, voucher: 'BB-2024-0035' },
  { id: '7004', accountId: '1920', date: '2024-01-20', description: 'Betaling leverandører', amount: -320000, voucher: 'BB-2024-0018' },
  { id: '7005', accountId: '1920', date: '2024-02-20', description: 'Betaling leverandører', amount: -380000, voucher: 'BB-2024-0028' },
  { id: '7006', accountId: '1920', date: '2024-03-20', description: 'Betaling leverandører', amount: -410000, voucher: 'BB-2024-0038' },
  
  // Liability transactions (2400)
  { id: '8001', accountId: '2400', date: '2024-01-10', description: 'Leverandørfaktura', amount: -320000, voucher: 'LB-2024-0040' },
  { id: '8002', accountId: '2400', date: '2024-02-10', description: 'Leverandørfaktura', amount: -380000, voucher: 'LB-2024-0130' },
  { id: '8003', accountId: '2400', date: '2024-03-10', description: 'Leverandørfaktura', amount: -410000, voucher: 'LB-2024-0210' },
];

const materialityThresholds = {
  materiality: 2000000,
  workingMateriality: 1500000,
  clearlyTrivial: 150000
};

// Risk levels for account groups
const accountGroupRiskLevels: Record<string, 'low' | 'medium' | 'high'> = {
  income: 'medium',
  expenses: 'high',
  assets: 'medium',
  liabilities: 'low'
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK' }).format(amount);
};

const TransactionSampling = () => {
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [sampleSize, setSampleSize] = useState("5");
  const [sampleType, setSampleType] = useState("random");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [selectedAccountGroup, setSelectedAccountGroup] = useState<AccountGroup | null>(null);
  const [suggestedSampleSize, setSuggestedSampleSize] = useState<number | null>(null);
  const [transactionDistribution, setTransactionDistribution] = useState<any[]>([]);
  const { toast } = useToast();
  
  const [samplingResults, setSamplingResults] = useState<SamplingResult>({
    transactions: [],
    summary: {
      totalCount: 0,
      sampledCount: 0,
      totalAmount: 0,
      sampledAmount: 0,
      coverage: 0
    }
  });
  
  // Filter transactions based on selected account or account group
  const getFilteredTransactions = () => {
    if (selectedAccount) {
      return allMockTransactions.filter(t => t.accountId === selectedAccount.accountId);
    } else if (selectedAccountGroup) {
      const accountIds = selectedAccountGroup.accounts.map(a => a.accountId);
      return allMockTransactions.filter(t => accountIds.includes(t.accountId));
    }
    return allMockTransactions;
  };
  
  // Calculate suggested sample size based on risk level and account balance relative to materiality
  useEffect(() => {
    if (selectedAccountGroup) {
      const riskLevel = accountGroupRiskLevels[selectedAccountGroup.id] || 'medium';
      const balance = Math.abs(selectedAccountGroup.balance);
      const materiality = materialityThresholds.materiality;
      
      // Base sample size based on risk level
      let baseSize = 5; // Default
      if (riskLevel === 'high') baseSize = 15;
      else if (riskLevel === 'medium') baseSize = 10;
      else if (riskLevel === 'low') baseSize = 5;
      
      // Adjustment based on account size relative to materiality
      let sizeAdjustment = 0;
      if (balance > materiality) {
        sizeAdjustment = Math.min(10, Math.floor(balance / materiality) * 5);
      } else if (balance > materialityThresholds.workingMateriality) {
        sizeAdjustment = 5;
      }
      
      const suggested = baseSize + sizeAdjustment;
      
      // Ensure reasonable minimum and maximum
      const filteredTransactions = getFilteredTransactions();
      const cappedSuggestion = Math.min(
        Math.max(5, suggested), 
        Math.min(30, filteredTransactions.length)
      );
      
      setSuggestedSampleSize(cappedSuggestion);
      setSampleSize(cappedSuggestion.toString());
    }
  }, [selectedAccountGroup, selectedAccount]);
  
  // Calculate transaction distribution data for chart
  useEffect(() => {
    const transactions = getFilteredTransactions();
    
    // Count transactions by amount ranges
    const ranges = {
      "0-25k": 0,
      "25k-50k": 0,
      "50k-100k": 0,
      "100k-250k": 0,
      "250k-500k": 0,
      "500k+": 0
    };
    
    transactions.forEach(t => {
      const amount = Math.abs(t.amount);
      if (amount < 25000) ranges["0-25k"]++;
      else if (amount < 50000) ranges["25k-50k"]++;
      else if (amount < 100000) ranges["50k-100k"]++;
      else if (amount < 250000) ranges["100k-250k"]++;
      else if (amount < 500000) ranges["250k-500k"]++;
      else ranges["500k+"]++;
    });
    
    // Convert to array format for chart
    const distribution = Object.entries(ranges).map(([range, count]) => ({
      range,
      count
    }));
    
    setTransactionDistribution(distribution);
  }, [selectedAccount, selectedAccountGroup]);
  
  const handleSelectTransaction = (transactionId: string) => {
    setSelectedTransactions(prev => {
      if (prev.includes(transactionId)) {
        return prev.filter(id => id !== transactionId);
      } else {
        return [...prev, transactionId];
      }
    });
  };
  
  const handleSelectAll = () => {
    if (selectedTransactions.length === samplingResults.transactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(samplingResults.transactions.map(t => t.id));
    }
  };
  
  const handleRunSampling = () => {
    // Get filtered transactions based on current selection
    let filteredTransactions = getFilteredTransactions();
    
    // Apply additional amount filters if provided
    if (minAmount) {
      filteredTransactions = filteredTransactions.filter(t => Math.abs(t.amount) >= Number(minAmount));
    }
    
    if (maxAmount) {
      filteredTransactions = filteredTransactions.filter(t => Math.abs(t.amount) <= Number(maxAmount));
    }
    
    if (filteredTransactions.length === 0) {
      toast({
        title: "Ingen transaksjoner funnet",
        description: "Det finnes ingen transaksjoner som matcher utvalgskriteriene.",
        variant: "destructive"
      });
      return;
    }
    
    // Select the sample based on sample type
    let sampledTransactions: Transaction[] = [];
    const size = Math.min(Number(sampleSize), filteredTransactions.length);
    
    if (sampleType === 'random') {
      // Random sampling
      const shuffled = [...filteredTransactions].sort(() => 0.5 - Math.random());
      sampledTransactions = shuffled.slice(0, size);
    } else if (sampleType === 'stratified') {
      // Simple stratification by amount (in a real app, this would be more sophisticated)
      // Sort by amount and take evenly distributed items
      const sorted = [...filteredTransactions].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
      const step = Math.max(1, Math.floor(sorted.length / size));
      
      for (let i = 0; i < size; i++) {
        const index = Math.min(i * step, sorted.length - 1);
        sampledTransactions.push(sorted[index]);
      }
    } else {
      // Systematic sampling - take every Nth item
      const step = Math.max(1, Math.floor(filteredTransactions.length / size));
      for (let i = 0; i < size; i++) {
        const index = Math.min(i * step, filteredTransactions.length - 1);
        sampledTransactions.push(filteredTransactions[index]);
      }
    }
    
    // Calculate summary statistics
    const sampledAmount = sampledTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalAmount = filteredTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    setSamplingResults({
      transactions: sampledTransactions,
      summary: {
        totalCount: filteredTransactions.length,
        sampledCount: sampledTransactions.length,
        totalAmount,
        sampledAmount,
        coverage: totalAmount > 0 ? (sampledAmount / totalAmount) * 100 : 0
      }
    });
    
    // Clear any previously selected transactions
    setSelectedTransactions([]);
    
    toast({
      title: "Utvalg generert",
      description: `${sampledTransactions.length} transaksjoner er valgt med ${sampleType === 'random' ? 'tilfeldig' : sampleType === 'stratified' ? 'stratifisert' : 'systematisk'} utvalgsmetode.`,
    });
  };
  
  const handleGenerateSummary = () => {
    if (selectedTransactions.length === 0) {
      toast({
        title: "Ingen transaksjoner valgt",
        description: "Velg minst én transaksjon for å generere oppsummering.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Oppsummering generert",
      description: `Oppsummering generert for ${selectedTransactions.length} transaksjoner.`,
    });
  };
  
  const handleAccountSelect = (account: Account | null) => {
    setSelectedAccount(account);
    setSamplingResults({
      transactions: [],
      summary: {
        totalCount: 0,
        sampledCount: 0,
        totalAmount: 0,
        sampledAmount: 0,
        coverage: 0
      }
    });
  };
  
  const handleAccountGroupSelect = (group: AccountGroup | null) => {
    setSelectedAccountGroup(group);
    if (!group) {
      setSelectedAccount(null);
    }
  };
  
  const getRiskBadge = () => {
    if (!selectedAccountGroup) return null;
    
    const risk = accountGroupRiskLevels[selectedAccountGroup.id] || 'medium';
    const variant = risk === 'high' ? 'destructive' : risk === 'medium' ? 'default' : 'outline';
    const label = risk === 'high' ? 'Høy' : risk === 'medium' ? 'Middels' : 'Lav';
    
    return (
      <Badge variant={variant} className="ml-2">
        {label} risiko
      </Badge>
    );
  };
  
  return (
    <SidebarProvider>
      <div className="flex min-h-[calc(100vh-12rem)]">
        <AccountSelectionSidebar 
          onAccountSelect={handleAccountSelect}
          onAccountGroupSelect={handleAccountGroupSelect}
          selectedAccount={selectedAccount}
          selectedAccountGroup={selectedAccountGroup}
        />
        
        <div className="flex-1 pl-4">
          <MaterialityBanner thresholds={materialityThresholds} />
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center">
                      Transaksjonsutvalg
                      {getRiskBadge()}
                    </CardTitle>
                    <CardDescription>
                      {selectedAccount 
                        ? `Utvalg for konto ${selectedAccount.accountId} - ${selectedAccount.name}`
                        : selectedAccountGroup 
                          ? `Utvalg for ${selectedAccountGroup.name}`
                          : 'Velg konto eller regnskapslinje fra sidebaren for å starte'
                      }
                    </CardDescription>
                  </div>
                  
                  {selectedAccountGroup && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2"
                          >
                            <BarChart size={14} />
                            <span>Totalbeløp: {formatCurrency(selectedAccountGroup.balance)}</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Totalbeløp for valgt regnskapsgruppe</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="sampleSize">Antall transaksjoner</Label>
                        {suggestedSampleSize && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs">
                                <Info size={12} />
                                <span>Anbefalt: {suggestedSampleSize}</span>
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 text-sm">
                              <div className="space-y-2">
                                <h4 className="font-medium">Anbefalt utvalgsstørrelse</h4>
                                <p className="text-muted-foreground text-xs">
                                  Anbefalingen er basert på en kombinasjon av risikofaktorer og beløpsstørrelse vurdert mot vesentlighetsgrensen.
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <AlertTriangle size={14} className="text-amber-500" />
                                  <span className="text-xs">Revisor bør vurdere om utvalget er tilstrekkelig.</span>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                      <Input 
                        id="sampleSize" 
                        value={sampleSize} 
                        onChange={(e) => setSampleSize(e.target.value)}
                        type="number"
                        min="1"
                        disabled={!selectedAccountGroup && !selectedAccount}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="sampleType">Utvalgsmetode</Label>
                      <Select 
                        value={sampleType} 
                        onValueChange={setSampleType}
                        disabled={!selectedAccountGroup && !selectedAccount}
                      >
                        <SelectTrigger id="sampleType">
                          <SelectValue placeholder="Velg metode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="random">Tilfeldig utvalg</SelectItem>
                          <SelectItem value="stratified">Stratifisert utvalg</SelectItem>
                          <SelectItem value="systematic">Systematisk utvalg</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="minAmount">Minimumsbeløp</Label>
                      <Input 
                        id="minAmount" 
                        value={minAmount} 
                        onChange={(e) => setMinAmount(e.target.value)}
                        type="number"
                        min="0"
                        placeholder="Valgfritt"
                        disabled={!selectedAccountGroup && !selectedAccount}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="maxAmount">Maksimumsbeløp</Label>
                      <Input 
                        id="maxAmount" 
                        value={maxAmount} 
                        onChange={(e) => setMaxAmount(e.target.value)}
                        type="number"
                        min="0"
                        placeholder="Valgfritt"
                        disabled={!selectedAccountGroup && !selectedAccount}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-end">
                    <Button 
                      onClick={handleRunSampling} 
                      size="lg" 
                      className="w-full gap-2"
                      disabled={!selectedAccountGroup && !selectedAccount}
                    >
                      <ListFilter size={16} />
                      <span>Kjør utvalg</span>
                    </Button>
                  </div>
                </div>
                
                {(selectedAccountGroup || selectedAccount) && transactionDistribution.length > 0 && samplingResults.transactions.length === 0 && (
                  <Card className="bg-muted/30 mb-6">
                    <CardContent className="pt-6">
                      <h3 className="font-medium mb-3">Fordeling av transaksjoner etter størrelse</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <ReBarChart data={transactionDistribution} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="range" />
                          <YAxis />
                          <ReTooltip formatter={(value) => [`${value} transaksjoner`, 'Antall']} />
                          <Bar dataKey="count" name="Antall transaksjoner" fill="#2A9D8F" />
                        </ReBarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
                
                {samplingResults.transactions.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-6">
                        <div>
                          <span className="text-sm text-muted-foreground">Antall transaksjoner:</span>
                          <div className="text-lg font-semibold">
                            {samplingResults.summary.sampledCount} av {samplingResults.summary.totalCount}
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Total beløp:</span>
                          <div className="text-lg font-semibold">
                            {formatCurrency(samplingResults.summary.sampledAmount)}
                            <span className="text-sm text-muted-foreground ml-2">
                              ({samplingResults.summary.coverage.toFixed(1)}% dekning)
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant={viewMode === 'table' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setViewMode('table')}
                          className="gap-1"
                        >
                          <ListFilter size={14} />
                          <span>Tabell</span>
                        </Button>
                        <Button
                          variant={viewMode === 'chart' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setViewMode('chart')}
                          className="gap-1"
                        >
                          <BarChart4 size={14} />
                          <span>Graf</span>
                        </Button>
                      </div>
                    </div>
                    
                    {viewMode === 'table' ? (
                      <div className="border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[50px]">
                                <Checkbox 
                                  checked={selectedTransactions.length === samplingResults.transactions.length && samplingResults.transactions.length > 0} 
                                  onCheckedChange={handleSelectAll}
                                  aria-label="Velg alle"
                                />
                              </TableHead>
                              <TableHead>Dato</TableHead>
                              <TableHead>Konto</TableHead>
                              <TableHead>Bilagsnr.</TableHead>
                              <TableHead>Beskrivelse</TableHead>
                              <TableHead className="text-right">Beløp</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {samplingResults.transactions.map((transaction) => (
                              <TableRow key={transaction.id}>
                                <TableCell>
                                  <Checkbox 
                                    checked={selectedTransactions.includes(transaction.id)} 
                                    onCheckedChange={() => handleSelectTransaction(transaction.id)}
                                    aria-label={`Velg transaksjon ${transaction.id}`}
                                  />
                                </TableCell>
                                <TableCell>{transaction.date}</TableCell>
                                <TableCell className="font-mono text-xs">{transaction.accountId}</TableCell>
                                <TableCell>{transaction.voucher}</TableCell>
                                <TableCell>{transaction.description}</TableCell>
                                <TableCell className="text-right font-mono">
                                  {formatCurrency(transaction.amount)}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={transaction.isTested ? "success" : "outline"}>
                                    {transaction.isTested ? "Testet" : "Ikke testet"}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <Card className="bg-muted/30">
                        <CardContent className="pt-6">
                          <h3 className="font-medium mb-3">Fordeling av transaksjoner etter størrelse</h3>
                          <ResponsiveContainer width="100%" height={250}>
                            <ReBarChart data={transactionDistribution} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="range" />
                              <YAxis />
                              <ReTooltip formatter={(value) => [`${value} transaksjoner`, 'Antall']} />
                              <Bar dataKey="count" name="Antall transaksjoner" fill="#2A9D8F" />
                            </ReBarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="text-sm text-muted-foreground">
                  {selectedTransactions.length > 0 
                    ? `${selectedTransactions.length} transaksjoner valgt`
                    : samplingResults.transactions.length > 0 
                      ? "Velg transaksjoner for å generere oppsummering" 
                      : selectedAccountGroup || selectedAccount
                        ? "Kjør utvalg for å se resultater"
                        : "Velg konto eller regnskapslinje fra sidebaren"
                  }
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    disabled={samplingResults.transactions.length === 0}
                  >
                    <Download size={16} />
                    <span>Eksporter</span>
                  </Button>
                  <Button 
                    className="gap-2"
                    disabled={selectedTransactions.length === 0}
                    onClick={handleGenerateSummary}
                  >
                    <FileCheck size={16} />
                    <span>Generer oppsummering</span>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default TransactionSampling;
