import React, { useMemo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  AlertTriangle,
  Calculator,
  Target,
  Activity,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';

interface ReconciliationMetrics {
  totalItems: number;
  perfectMatches: number;
  minorDiscrepancies: number;
  majorDiscrepancies: number;
  totalDiscrepancyAmount: number;
  adjustedMatches: number;
  mappingCompleteness: number;
  dataQualityScore: number;
}

interface RealTimeReconciliationDashboardProps {
  metrics: ReconciliationMetrics;
  targetAccuracy?: number;
  showAnimation?: boolean;
  onMetricClick?: (metric: string) => void;
}

export function RealTimeReconciliationDashboard({
  metrics,
  targetAccuracy = 95,
  showAnimation = true,
  onMetricClick
}: RealTimeReconciliationDashboardProps) {
  const [previousMetrics, setPreviousMetrics] = useState<ReconciliationMetrics | null>(null);
  const [animatedValues, setAnimatedValues] = useState(metrics);

  // Calculate derived metrics
  const derivedMetrics = useMemo(() => {
    const totalProcessed = metrics.perfectMatches + metrics.minorDiscrepancies + metrics.majorDiscrepancies;
    const accuracyRate = totalProcessed > 0 ? ((metrics.perfectMatches + metrics.adjustedMatches) / totalProcessed) * 100 : 0;
    const improvementFromAdjustments = metrics.adjustedMatches > 0 ? (metrics.adjustedMatches / totalProcessed) * 100 : 0;
    
    return {
      accuracyRate,
      improvementFromAdjustments,
      isTargetMet: accuracyRate >= targetAccuracy,
      totalProcessed,
      pendingItems: metrics.totalItems - totalProcessed,
      qualityGrade: metrics.dataQualityScore >= 90 ? 'A' : 
                   metrics.dataQualityScore >= 80 ? 'B' : 
                   metrics.dataQualityScore >= 70 ? 'C' : 'D'
    };
  }, [metrics, targetAccuracy]);

  // Animation effect for metric changes
  useEffect(() => {
    if (!showAnimation) {
      setAnimatedValues(metrics);
      return;
    }

    if (previousMetrics) {
      // Animate changes
      const animationDuration = 1000; // 1 second
      const steps = 30;
      const stepDuration = animationDuration / steps;
      
      let step = 0;
      const interval = setInterval(() => {
        step++;
        const progress = step / steps;
        
        setAnimatedValues(prev => ({
          totalItems: Math.round(previousMetrics.totalItems + (metrics.totalItems - previousMetrics.totalItems) * progress),
          perfectMatches: Math.round(previousMetrics.perfectMatches + (metrics.perfectMatches - previousMetrics.perfectMatches) * progress),
          minorDiscrepancies: Math.round(previousMetrics.minorDiscrepancies + (metrics.minorDiscrepancies - previousMetrics.minorDiscrepancies) * progress),
          majorDiscrepancies: Math.round(previousMetrics.majorDiscrepancies + (metrics.majorDiscrepancies - previousMetrics.majorDiscrepancies) * progress),
          totalDiscrepancyAmount: previousMetrics.totalDiscrepancyAmount + (metrics.totalDiscrepancyAmount - previousMetrics.totalDiscrepancyAmount) * progress,
          adjustedMatches: Math.round(previousMetrics.adjustedMatches + (metrics.adjustedMatches - previousMetrics.adjustedMatches) * progress),
          mappingCompleteness: previousMetrics.mappingCompleteness + (metrics.mappingCompleteness - previousMetrics.mappingCompleteness) * progress,
          dataQualityScore: previousMetrics.dataQualityScore + (metrics.dataQualityScore - previousMetrics.dataQualityScore) * progress
        }));
        
        if (step >= steps) {
          clearInterval(interval);
          setAnimatedValues(metrics);
        }
      }, stepDuration);
      
      return () => clearInterval(interval);
    } else {
      setAnimatedValues(metrics);
    }
    
    setPreviousMetrics(metrics);
  }, [metrics, showAnimation, previousMetrics]);

  const getChangeIndicator = (current: number, previous: number | undefined) => {
    if (!previous) return null;
    
    const change = current - previous;
    if (Math.abs(change) < 0.01) return null;
    
    return (
      <span className={cn(
        "flex items-center text-xs ml-2",
        change > 0 ? "text-success" : "text-destructive"
      )}>
        {change > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
        {Math.abs(change).toFixed(0)}
      </span>
    );
  };

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Accuracy Overview */}
        <Card 
          className={cn(
            "transition-all duration-300 cursor-pointer hover:shadow-md",
            derivedMetrics.isTargetMet ? "ring-2 ring-success/20 bg-success/5" : "ring-2 ring-warning/20 bg-warning/5"
          )}
          onClick={() => onMetricClick?.('accuracy')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Nøyaktighet
              </span>
              <Badge variant={derivedMetrics.isTargetMet ? "default" : "secondary"}>
                {derivedMetrics.qualityGrade}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold">
                {derivedMetrics.accuracyRate.toFixed(1)}%
              </span>
              {getChangeIndicator(derivedMetrics.accuracyRate, previousMetrics ? 
                ((previousMetrics.perfectMatches + previousMetrics.adjustedMatches) / 
                 (previousMetrics.perfectMatches + previousMetrics.minorDiscrepancies + previousMetrics.majorDiscrepancies)) * 100 : undefined)}
            </div>
            <Progress value={derivedMetrics.accuracyRate} className="mb-2" />
            <p className="text-xs text-muted-foreground">
              Mål: {targetAccuracy}% | {animatedValues.perfectMatches + animatedValues.adjustedMatches} av {derivedMetrics.totalProcessed} prosessert
            </p>
          </CardContent>
        </Card>

        {/* Perfect Matches */}
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onMetricClick?.('matches')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              Perfekte treff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold text-success">
                {animatedValues.perfectMatches}
              </span>
              {getChangeIndicator(metrics.perfectMatches, previousMetrics?.perfectMatches)}
            </div>
            {animatedValues.adjustedMatches > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Zap className="h-3 w-3" />
                +{animatedValues.adjustedMatches} justerte
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {metrics.totalItems > 0 ? ((animatedValues.perfectMatches / metrics.totalItems) * 100).toFixed(1) : 0}% av totalt
            </p>
          </CardContent>
        </Card>

        {/* Discrepancies */}
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onMetricClick?.('discrepancies')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Avvik
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-warning">Små (≤5kr):</span>
                <span className="font-medium">{animatedValues.minorDiscrepancies}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-destructive">Store (&gt;5kr):</span>
                <span className="font-medium">{animatedValues.majorDiscrepancies}</span>
              </div>
              <div className="pt-1 border-t">
                <div className="flex justify-between text-xs font-medium">
                  <span>Totalt beløp:</span>
                  <span className={cn(
                    animatedValues.totalDiscrepancyAmount > 1000 ? "text-destructive" : "text-warning"
                  )}>
                    {formatCurrency(animatedValues.totalDiscrepancyAmount)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress & Data Quality */}
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onMetricClick?.('progress')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Fremdrift
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Mapping komplett:</span>
                  <span>{animatedValues.mappingCompleteness.toFixed(1)}%</span>
                </div>
                <Progress value={animatedValues.mappingCompleteness} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Datakvalitet:</span>
                  <span>{animatedValues.dataQualityScore.toFixed(1)}%</span>
                </div>
                <Progress 
                  value={animatedValues.dataQualityScore} 
                  className={cn(
                    "h-2",
                    animatedValues.dataQualityScore >= 90 ? "bg-success/20" : "bg-warning/20"
                  )} 
                />
              </div>

              {derivedMetrics.pendingItems > 0 && (
                <p className="text-xs text-muted-foreground">
                  {derivedMetrics.pendingItems} poster gjenstår
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Insights */}
      {(derivedMetrics.improvementFromAdjustments > 10 || !derivedMetrics.isTargetMet) && (
        <Card className="mt-4 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Calculator className="h-5 w-5 text-primary mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Innsikt fra avstemmingen</h4>
                <div className="text-xs text-muted-foreground space-y-1">
                  {derivedMetrics.improvementFromAdjustments > 10 && (
                    <p>✨ Manuelle justeringer har forbedret nøyaktigheten med {derivedMetrics.improvementFromAdjustments.toFixed(1)}%</p>
                  )}
                  {!derivedMetrics.isTargetMet && (
                    <p>⚠️ Nøyaktighet er {(targetAccuracy - derivedMetrics.accuracyRate).toFixed(1)}% under målet</p>
                  )}
                  {metrics.majorDiscrepancies > 0 && (
                    <p>🔍 {metrics.majorDiscrepancies} store avvik krever nærmere undersøkelse</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </TooltipProvider>
  );
}