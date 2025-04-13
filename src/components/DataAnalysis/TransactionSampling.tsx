
import React, { useState } from 'react';
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
import { 
  Download, 
  ListFilter, 
  BarChart4, 
  FileCheck, 
  PlusCircle 
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  BarChart, 
  ResponsiveContainer, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import { Transaction, SamplingResult } from '@/types/revio';

// Mock data for transactions
const mockTransactions: Transaction[] = [
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
];

const distributionData = [
  { range: '0-25k', count: 1 },
  { range: '25k-50k', count: 2 },
  { range: '50k-75k', count: 3 },
  { range: '75k-100k', count: 2 },
  { range: '100k+', count: 2 },
];

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
  
  const [samplingResults, setSamplingResults] = useState<SamplingResult>({
    transactions: [],
    summary: {
      totalCount: mockTransactions.length,
      sampledCount: 0,
      totalAmount: mockTransactions.reduce((sum, t) => sum + t.amount, 0),
      sampledAmount: 0,
      coverage: 0
    }
  });
  
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
    // In a real app, we would call an API to perform sampling
    // For now, we'll simulate it with some logic based on the parameters
    
    let filteredTransactions = [...mockTransactions];
    
    // Apply amount filters if provided
    if (minAmount) {
      filteredTransactions = filteredTransactions.filter(t => t.amount >= Number(minAmount));
    }
    
    if (maxAmount) {
      filteredTransactions = filteredTransactions.filter(t => t.amount <= Number(maxAmount));
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
      const sorted = [...filteredTransactions].sort((a, b) => a.amount - b.amount);
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
    const sampledAmount = sampledTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
    
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
  };
  
  const handleGenerateSummary = () => {
    console.log("Generating summary for selected transactions:", selectedTransactions);
    // In a real app, this would generate a report or save the selection
    alert(`Oppsummering generert for ${selectedTransactions.length} transaksjoner`);
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Transaksjonsutvalg</CardTitle>
          <CardDescription>
            Velg transaksjoner for testing basert på ulike utvalgskriterier
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sampleSize">Antall transaksjoner</Label>
                <Input 
                  id="sampleSize" 
                  value={sampleSize} 
                  onChange={(e) => setSampleSize(e.target.value)}
                  type="number"
                  min="1"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sampleType">Utvalgsmetode</Label>
                <Select value={sampleType} onValueChange={setSampleType}>
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
                />
              </div>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={handleRunSampling} 
                size="lg" 
                className="w-full gap-2"
              >
                <ListFilter size={16} />
                <span>Kjør utvalg</span>
              </Button>
            </div>
          </div>
          
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
                      <BarChart data={distributionData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value} transaksjoner`, 'Antall']} />
                        <Bar dataKey="count" name="Antall transaksjoner" fill="#2A9D8F" />
                      </BarChart>
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
              : "Velg transaksjoner for å generere oppsummering"}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
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
  );
};

export default TransactionSampling;
