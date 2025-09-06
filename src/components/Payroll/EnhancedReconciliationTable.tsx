import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Save,
  Calculator,
  Plus,
  Minus,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';

interface ReconciliationData {
  code: string;
  description: string;
  accounts: string[];
  accountNames: string[];
  accountDetails: Array<{ 
    account: string; 
    name: string; 
    amount: number; 
    source: 'TB' | 'A07' | 'Rule';
  }>;
  A: number; // P&L costs
  B: number; // Negative accruals
  C: number; // Positive accruals  
  D: number; // Calculated (A+B-C)
  E: number; // AGA adjustment
  amelding: number; // A07 reported
  difference: number;
  notes?: string;
}

interface ManualAdjustment {
  tillegg: number; // Additions
  fradrag: number; // Deductions
  note: string;
}

interface EnhancedReconciliationTableProps {
  reconciliationData: ReconciliationData[];
  onUpdateNotes?: (code: string, notes: string) => void;
  onAcceptDiscrepancy?: (code: string) => void;
  onRejectDiscrepancy?: (code: string) => void;
  onManualAdjustment?: (code: string, adjustment: ManualAdjustment) => void;
}

export function EnhancedReconciliationTable({
  reconciliationData,
  onUpdateNotes,
  onAcceptDiscrepancy,
  onRejectDiscrepancy,
  onManualAdjustment
}: EnhancedReconciliationTableProps) {
  const [adjustments, setAdjustments] = useState<Record<string, ManualAdjustment>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Calculate adjusted values for each item
  const adjustedData = useMemo(() => {
    return reconciliationData.map(item => {
      const adjustment = adjustments[item.code] || { tillegg: 0, fradrag: 0, note: '' };
      const adjustedD = item.D + adjustment.tillegg - adjustment.fradrag;
      const adjustedDifference = adjustedD - item.amelding;
      
      return {
        ...item,
        adjustedD,
        adjustedDifference,
        adjustment,
        hasAdjustment: adjustment.tillegg !== 0 || adjustment.fradrag !== 0
      };
    });
  }, [reconciliationData, adjustments]);

  const handleAdjustmentChange = (code: string, field: 'tillegg' | 'fradrag', value: string) => {
    const numValue = parseFloat(value) || 0;
    setAdjustments(prev => ({
      ...prev,
      [code]: {
        ...prev[code] || { tillegg: 0, fradrag: 0, note: '' },
        [field]: numValue
      }
    }));
  };

  const handleAdjustmentNoteChange = (code: string, note: string) => {
    setAdjustments(prev => ({
      ...prev,
      [code]: {
        ...prev[code] || { tillegg: 0, fradrag: 0, note: '' },
        note
      }
    }));
  };

  const handleSaveAdjustment = (code: string) => {
    const adjustment = adjustments[code];
    if (adjustment && onManualAdjustment) {
      onManualAdjustment(code, adjustment);
    }
  };

  const handleMoveDiscrepancyToAdjustment = (code: string, type: 'tillegg' | 'fradrag') => {
    const item = reconciliationData.find(i => i.code === code);
    if (!item) return;

    const absDiscrepancy = Math.abs(item.difference);
    setAdjustments(prev => ({
      ...prev,
      [code]: {
        ...prev[code] || { tillegg: 0, fradrag: 0, note: '' },
        [type]: absDiscrepancy,
        note: `Automatisk justert fra avvik (${formatCurrency(item.difference)})`
      }
    }));
  };

  const toggleExpanded = (code: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(code)) {
        newSet.delete(code);
      } else {
        newSet.add(code);
      }
      return newSet;
    });
  };

  const getStatusIcon = (difference: number) => {
    if (Math.abs(difference) <= 0.01) return CheckCircle;
    return AlertTriangle;
  };

  const getStatusVariant = (difference: number) => {
    if (Math.abs(difference) <= 0.01) return 'success';
    if (Math.abs(difference) <= 5) return 'warning';
    return 'destructive';
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {adjustedData.map((item) => {
          const StatusIcon = getStatusIcon(item.adjustedDifference);
          const statusVariant = getStatusVariant(item.adjustedDifference);
          const isExpanded = expandedItems.has(item.code);

          return (
            <Card key={item.code} className={cn(
              "transition-all duration-200",
              statusVariant === 'destructive' && "border-destructive/50 bg-destructive/5",
              statusVariant === 'warning' && "border-warning/50 bg-warning/5",
              statusVariant === 'success' && "border-success/50 bg-success/5",
              item.hasAdjustment && "ring-2 ring-primary/20"
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatusIcon className={cn(
                      "h-5 w-5",
                      statusVariant === 'success' && "text-success",
                      statusVariant === 'warning' && "text-warning", 
                      statusVariant === 'destructive' && "text-destructive"
                    )} />
                    <div>
                      <CardTitle className="text-lg">{item.code}</CardTitle>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {item.hasAdjustment && (
                      <Badge variant="outline" className="bg-primary/10">
                        <Calculator className="h-3 w-3 mr-1" />
                        Justert
                      </Badge>
                    )}
                    <Badge variant={statusVariant}>
                      {Math.abs(item.adjustedDifference) <= 0.01 ? 'Perfect match' : 
                       `Avvik: ${formatCurrency(item.adjustedDifference)}`}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Enhanced calculation display with adjustments */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Original calculation */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Beregning fra regnskap
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>A (P&L) + B (Neg. avsetninger) - C (Pos. avsetninger) = D</p>
                        </TooltipContent>
                      </Tooltip>
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>A (Kostnadsførte beløp):</span>
                        <span className="font-mono">{formatCurrency(item.A)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>B (Negative avsetninger):</span>
                        <span className="font-mono">{formatCurrency(item.B)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>C (Positive avsetninger):</span>
                        <span className="font-mono">{formatCurrency(item.C)}</span>
                      </div>
                      <hr className="my-2" />
                      <div className="flex justify-between font-medium">
                        <span>D (Beregnet):</span>
                        <span className="font-mono">{formatCurrency(item.D)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Adjustment panel */}
                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                    <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Manuelle justeringer
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Legg til eller trekk fra beløp for å justere avvik</p>
                        </TooltipContent>
                      </Tooltip>
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4 text-success" />
                        <Input
                          type="number"
                          placeholder="Tillegg"
                          value={item.adjustment.tillegg || ''}
                          onChange={(e) => handleAdjustmentChange(item.code, 'tillegg', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Minus className="h-4 w-4 text-destructive" />
                        <Input
                          type="number"
                          placeholder="Fradrag"
                          value={item.adjustment.fradrag || ''}
                          onChange={(e) => handleAdjustmentChange(item.code, 'fradrag', e.target.value)}
                          className="text-sm"
                        />
                      </div>

                      {Math.abs(item.difference) > 0.01 && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleMoveDiscrepancyToAdjustment(item.code, 'fradrag')}
                            className="text-xs"
                          >
                            Flytt avvik til fradrag
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleMoveDiscrepancyToAdjustment(item.code, 'tillegg')}
                            className="text-xs"
                          >
                            Flytt avvik til tillegg
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Final calculation with visual flow */}
                <div className="bg-gradient-to-r from-muted/30 to-primary/10 rounded-lg p-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span>Justert D:</span>
                      <span className="font-mono font-medium">{formatCurrency(item.adjustedD)}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div className="flex items-center gap-2">
                      <span>A-melding:</span>
                      <span className="font-mono">{formatCurrency(item.amelding)}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-medium",
                        Math.abs(item.adjustedDifference) <= 0.01 && "text-success",
                        Math.abs(item.adjustedDifference) > 0.01 && Math.abs(item.adjustedDifference) <= 5 && "text-warning",
                        Math.abs(item.adjustedDifference) > 5 && "text-destructive"
                      )}>
                        Avvik: {formatCurrency(item.adjustedDifference)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Adjustment note */}
                {(item.adjustment.tillegg !== 0 || item.adjustment.fradrag !== 0) && (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Forklaring til justering..."
                      value={item.adjustment.note}
                      onChange={(e) => handleAdjustmentNoteChange(item.code, e.target.value)}
                      className="text-sm"
                      rows={2}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSaveAdjustment(item.code)}
                      className="self-start"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Lagre justering
                    </Button>
                  </div>
                )}

                {/* Account details toggle */}
                <div className="pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(item.code)}
                    className="text-xs text-muted-foreground"
                  >
                    {isExpanded ? 'Skjul' : 'Vis'} kontoer ({item.accounts.length})
                  </Button>

                  {isExpanded && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                      {item.accountDetails.map((account, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 bg-muted/30 rounded text-xs">
                          <div>
                            <span className="font-mono">{account.account}</span>
                            <span className="text-muted-foreground ml-2">{account.name}</span>
                          </div>
                          <span className="font-mono">{formatCurrency(account.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </TooltipProvider>
  );
}