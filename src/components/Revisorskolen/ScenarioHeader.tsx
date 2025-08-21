import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, DollarSign, Target, RotateCcw } from 'lucide-react';

interface ScenarioHeaderProps {
  title: string;
  totalBudget: number;
  usedBudget: number;
  currency?: string;
  onRestart?: () => void;
  achievedObjectives?: number;
  totalObjectives?: number;
}

export const ScenarioHeader = ({ 
  title, 
  totalBudget, 
  usedBudget, 
  currency = 'NOK',
  onRestart,
  achievedObjectives = 0,
  totalObjectives = 0
}: ScenarioHeaderProps) => {
  const remaining = totalBudget - usedBudget;
  const percent = Math.min(Math.round((usedBudget / totalBudget) * 100), 100);
  const isNearLimit = percent >= 80;
  const isOverBudget = usedBudget > totalBudget;

  return (
    <Card className="border-2 border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground">Revisjonsscenario</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              {achievedObjectives}/{totalObjectives} mål
            </Badge>
            {onRestart && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRestart}
                className="flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Start på nytt
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>Budsjett brukt</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${isOverBudget ? 'text-destructive' : 'text-foreground'}`}>
                {usedBudget.toLocaleString('nb-NO')}
              </span>
              <span className="text-sm text-muted-foreground">
                / {totalBudget.toLocaleString('nb-NO')} {currency}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Gjenstående</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${remaining < 0 ? 'text-destructive' : 'text-foreground'}`}>
                {Math.max(0, remaining).toLocaleString('nb-NO')}
              </span>
              <span className="text-sm text-muted-foreground">{currency}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="h-4 w-4" />
              <span>Fremdrift</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">{percent}%</span>
              <span className="text-sm text-muted-foreground">av budsjett</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Budsjettbruk</span>
            <span className={`font-medium ${
              isOverBudget ? 'text-destructive' : 
              isNearLimit ? 'text-orange-600' : 
              'text-muted-foreground'
            }`}>
              {percent}%
            </span>
          </div>
          <Progress 
            value={percent} 
            className={`w-full h-3 ${
              isOverBudget ? '[&>div]:bg-destructive' :
              isNearLimit ? '[&>div]:bg-orange-500' : ''
            }`}
          />
          {isOverBudget && (
            <p className="text-sm text-destructive font-medium">
              ⚠️ Budsjettet er overskredet med {Math.abs(remaining).toLocaleString('nb-NO')} {currency}
            </p>
          )}
          {isNearLimit && !isOverBudget && (
            <p className="text-sm text-orange-600 font-medium">
              ⚠️ Budsjettet nærmer seg grensen
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};