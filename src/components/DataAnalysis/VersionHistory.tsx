
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Minus, Clock, UserRound } from 'lucide-react';

// Sample version changes data
const mockVersionChanges = [
  { 
    id: '1', 
    accountId: '3000', 
    accountName: 'Salg, høy sats', 
    previousAmount: 3500000, 
    newAmount: 3800000, 
    changeDate: '2024-03-15', 
    changedBy: 'Anne Revisor' 
  },
  { 
    id: '2', 
    accountId: '1500', 
    accountName: 'Kundefordringer', 
    previousAmount: 1200000, 
    newAmount: 1050000, 
    changeDate: '2024-03-15', 
    changedBy: 'Anne Revisor' 
  },
  { 
    id: '3', 
    accountId: '7000', 
    accountName: 'Drivstoff transport', 
    previousAmount: 320000, 
    newAmount: 350000, 
    changeDate: '2024-03-16', 
    changedBy: 'Petter Controller' 
  },
  { 
    id: '4', 
    accountId: '6300', 
    accountName: 'Leie lokaler', 
    previousAmount: 700000, 
    newAmount: 700000, 
    changeDate: '2024-03-16', 
    changedBy: 'Petter Controller' 
  },
  { 
    id: '5', 
    accountId: '1920', 
    accountName: 'Bankkonto drift', 
    previousAmount: 2100000, 
    newAmount: 2350000, 
    changeDate: '2024-03-17', 
    changedBy: 'Anne Revisor' 
  },
];

// Sample version comparison data
const mockVersions = [
  { id: '1', name: 'interim1', label: 'Interim 1', date: '2024-01-15', description: 'Foreløpig saldobalanse Q1' },
  { id: '2', name: 'interim2', label: 'Interim 2', date: '2024-03-15', description: 'Foreløpig saldobalanse Q2' },
  { id: '3', name: 'final', label: 'Endelig', date: '2024-04-01', description: 'Endelig saldobalanse' },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK' }).format(amount);
};

const VersionHistory = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Versjonshistorikk</CardTitle>
          <CardDescription>
            Sammenligning av regnskapsversjoner og endringer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Tilgjengelige versjoner</h3>
            <div className="space-y-4">
              {mockVersions.map((version, index) => (
                <div key={version.id} className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Clock size={20} className="text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{version.label}</h4>
                      <p className="text-sm text-muted-foreground">{version.description}</p>
                    </div>
                  </div>
                  <div className="text-sm text-right">
                    <Badge variant="outline" className="mb-1">{version.date}</Badge>
                    <div className="flex items-center justify-end gap-1 text-muted-foreground">
                      <UserRound size={14} />
                      <span>{index === 1 ? 'Petter Controller' : 'Anne Revisor'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Endringer fra Interim 1 til Endelig</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Konto</TableHead>
                  <TableHead>Navn</TableHead>
                  <TableHead className="text-right">Tidligere beløp</TableHead>
                  <TableHead className="text-right">Nytt beløp</TableHead>
                  <TableHead className="text-right">Differanse</TableHead>
                  <TableHead className="text-right">Endret av</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockVersionChanges.map((change) => {
                  const difference = change.newAmount - change.previousAmount;
                  const percentChange = (difference / change.previousAmount) * 100;
                  
                  return (
                    <TableRow key={change.id}>
                      <TableCell>{change.accountId}</TableCell>
                      <TableCell>{change.accountName}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(change.previousAmount)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(change.newAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {difference > 0 ? (
                            <ArrowUp size={16} className="text-green-500" />
                          ) : difference < 0 ? (
                            <ArrowDown size={16} className="text-red-500" />
                          ) : (
                            <Minus size={16} className="text-muted-foreground" />
                          )}
                          <span className={`font-mono ${
                            difference > 0 ? 'text-green-600' : 
                            difference < 0 ? 'text-red-600' : 
                            'text-muted-foreground'
                          }`}>
                            {formatCurrency(difference)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({difference === 0 ? '0' : difference > 0 ? '+' : ''}{percentChange.toFixed(1)}%)
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {change.changedBy}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VersionHistory;
