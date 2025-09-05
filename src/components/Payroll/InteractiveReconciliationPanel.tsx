import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  AlertTriangle, 
  CheckCircle, 
  Edit3, 
  MessageSquare, 
  ArrowRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ReconciliationItem {
  code: string;
  description: string;
  accounts: string[];
  accountNames?: string[];
  A: number; // P&L amount
  B: number; // Negative accruals
  C: number; // Positive accruals
  D: number; // Calculated (A+B-C)
  E: number; // AGA
  amelding: number; // A07 reported
  difference: number;
  notes?: string;
}

interface InteractiveReconciliationPanelProps {
  items: ReconciliationItem[];
  onUpdateNotes?: (code: string, notes: string) => void;
  onAcceptDiscrepancy?: (code: string) => void;
  onRejectDiscrepancy?: (code: string) => void;
}

const InteractiveReconciliationPanel: React.FC<InteractiveReconciliationPanelProps> = ({
  items,
  onUpdateNotes,
  onAcceptDiscrepancy,
  onRejectDiscrepancy
}) => {
  const [selectedItem, setSelectedItem] = useState<ReconciliationItem | null>(null);
  const [notes, setNotes] = useState('');

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getVarianceStatus = (difference: number) => {
    if (Math.abs(difference) <= 5) return 'acceptable';
    if (Math.abs(difference) <= 100) return 'minor';
    return 'major';
  };

  const getVarianceColor = (difference: number) => {
    const status = getVarianceStatus(difference);
    switch (status) {
      case 'acceptable': return 'text-success';
      case 'minor': return 'text-warning';
      case 'major': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getVarianceBadgeVariant = (difference: number) => {
    const status = getVarianceStatus(difference);
    switch (status) {
      case 'acceptable': return 'default' as const;
      case 'minor': return 'secondary' as const;
      case 'major': return 'destructive' as const;
      default: return 'outline' as const;
    }
  };

  const handleSaveNotes = () => {
    if (selectedItem && onUpdateNotes) {
      onUpdateNotes(selectedItem.code, notes);
      toast({
        title: 'Notater lagret',
        description: `Notater for ${selectedItem.code} er oppdatert.`,
      });
      setSelectedItem(null);
      setNotes('');
    }
  };

  const handleAccept = (item: ReconciliationItem) => {
    if (onAcceptDiscrepancy) {
      onAcceptDiscrepancy(item.code);
      toast({
        title: 'Avvik godkjent',
        description: `Avvik for ${item.code} er godkjent.`,
      });
    }
  };

  const handleReject = (item: ReconciliationItem) => {
    if (onRejectDiscrepancy) {
      onRejectDiscrepancy(item.code);
      toast({
        title: 'Avvik avvist',
        description: `Avvik for ${item.code} krever videre undersøkelse.`,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.code} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{item.code}</CardTitle>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <Badge variant={getVarianceBadgeVariant(item.difference)}>
                Avvik: {formatAmount(item.difference)} kr
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Account Information */}
            <div className="bg-muted/50 p-3 rounded-md">
              <p className="text-sm font-medium mb-1">Berørte kontoer:</p>
              <div className="flex flex-wrap gap-1">
                {item.accounts.length > 0 ? (
                  item.accounts.map((account, idx) => (
                    <Badge key={account} variant="outline" className="text-xs">
                      {account}
                      {item.accountNames?.[idx] && (
                        <span className="ml-1 text-muted-foreground">
                          - {item.accountNames[idx]}
                        </span>
                      )}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Ingen kontoer identifisert</span>
                )}
              </div>
            </div>

            {/* Reconciliation Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">A (Resultat)</p>
                <p className="font-mono text-sm">{formatAmount(item.A)} kr</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">B (Neg.avs.)</p>
                <p className="font-mono text-sm">{formatAmount(item.B)} kr</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">C (Pos.avs.)</p>
                <p className="font-mono text-sm">{formatAmount(item.C)} kr</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">D (Beregnet)</p>
                <p className="font-mono text-sm font-medium">{formatAmount(item.D)} kr</p>
              </div>
            </div>

            {/* Comparison */}
            <div className="flex items-center justify-between p-3 bg-background border rounded-md">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Beregnet (D)</p>
                <p className="font-mono text-lg font-bold">{formatAmount(item.D)} kr</p>
              </div>
              
              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                {item.difference > 0 ? (
                  <TrendingUp className={`h-4 w-4 ${getVarianceColor(item.difference)}`} />
                ) : item.difference < 0 ? (
                  <TrendingDown className={`h-4 w-4 ${getVarianceColor(item.difference)}`} />
                ) : (
                  <CheckCircle className="h-4 w-4 text-success" />
                )}
              </div>
              
              <div className="text-center">
                <p className="text-xs text-muted-foreground">A-melding</p>
                <p className="font-mono text-lg font-bold">{formatAmount(item.amelding)} kr</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedItem(item);
                        setNotes(item.notes || '');
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Notater
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Notater for {item.code}</DialogTitle>
                      <DialogDescription>
                        Legg til notater eller kommentarer for denne avstemmingsposten.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Skriv inn notater..."
                        rows={4}
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setSelectedItem(null)}>
                          Avbryt
                        </Button>
                        <Button onClick={handleSaveNotes}>
                          Lagre
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {item.notes && (
                  <Badge variant="secondary" className="text-xs">
                    Har notater
                  </Badge>
                )}
              </div>

              <div className="flex gap-2">
                {Math.abs(item.difference) > 5 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(item)}
                      className="text-destructive hover:text-destructive"
                    >
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Undersøk
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleAccept(item)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Godkjenn
                    </Button>
                  </>
                )}
                
                {Math.abs(item.difference) <= 5 && (
                  <Badge variant="default" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Godkjent avvik
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default InteractiveReconciliationPanel;