import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DollarSign, TrendingUp, TrendingDown, Minus, CheckCircle } from 'lucide-react';

interface TrainingAction {
  id: string;
  step_number: number;
  action_type: string;
  title: string;
  description: string;
  cost: number;
  reveal_text: string;
  score_impact: number;
  risk_impact: string;
  sort_order: number;
}

interface ActionsListProps {
  actions: TrainingAction[];
  appliedActionIds: Set<string>;
  currentBudget: number;
  onApplyAction: (actionId: string) => void;
}

const getRiskColor = (risk: string) => {
  switch (risk) {
    case 'positive': return 'bg-green-100 text-green-800';
    case 'negative': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getRiskIcon = (risk: string) => {
  switch (risk) {
    case 'positive': return TrendingUp;
    case 'negative': return TrendingDown;
    default: return Minus;
  }
};

const getActionTypeColor = (type: string) => {
  switch (type) {
    case 'planning': return 'bg-blue-100 text-blue-800';
    case 'execution': return 'bg-orange-100 text-orange-800';
    case 'reporting': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getActionTypeText = (type: string) => {
  switch (type) {
    case 'planning': return 'Planlegging';
    case 'execution': return 'Utførelse';
    case 'reporting': return 'Rapportering';
    default: return type;
  }
};

export const ActionsList = ({ actions, appliedActionIds, currentBudget, onApplyAction }: ActionsListProps) => {
  // Group actions by step number
  const actionsByStep = actions.reduce((acc, action) => {
    if (!acc[action.step_number]) {
      acc[action.step_number] = [];
    }
    acc[action.step_number].push(action);
    return acc;
  }, {} as Record<number, TrainingAction[]>);

  const stepNumbers = Object.keys(actionsByStep).map(Number).sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tilgjengelige handlinger</CardTitle>
          <CardDescription>
            Velg handlinger for å fullføre revisjonsprosessen. Hver handling koster penger og påvirker kvaliteten.
          </CardDescription>
        </CardHeader>
      </Card>

      {stepNumbers.map((stepNumber) => (
        <div key={stepNumber} className="space-y-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold">Steg {stepNumber}</h3>
            <Separator className="flex-1" />
          </div>

          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            {actionsByStep[stepNumber].map((action) => {
              const isApplied = appliedActionIds.has(action.id);
              const canAfford = currentBudget >= action.cost;
              const RiskIcon = getRiskIcon(action.risk_impact);

              return (
                <Card 
                  key={action.id} 
                  className={`transition-all ${
                    isApplied 
                      ? 'bg-green-50 border-green-200' 
                      : canAfford 
                        ? 'hover:shadow-md' 
                        : 'opacity-60'
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{action.title}</CardTitle>
                          {isApplied && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="secondary" 
                            className={getActionTypeColor(action.action_type)}
                          >
                            {getActionTypeText(action.action_type)}
                          </Badge>
                          <Badge 
                            variant="secondary" 
                            className={getRiskColor(action.risk_impact)}
                          >
                            <RiskIcon className="h-3 w-3 mr-1" />
                            {action.risk_impact === 'positive' ? 'Lav risiko' : 
                             action.risk_impact === 'negative' ? 'Høy risiko' : 'Nøytral'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <CardDescription className="text-sm">
                      {action.description}
                    </CardDescription>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span>kr {action.cost.toLocaleString()}</span>
                        </div>
                        {action.score_impact !== 0 && (
                          <div className="flex items-center gap-1">
                            {action.score_impact > 0 ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            )}
                            <span>{action.score_impact > 0 ? '+' : ''}{action.score_impact} poeng</span>
                          </div>
                        )}
                      </div>

                      <Button 
                        onClick={() => onApplyAction(action.id)}
                        disabled={isApplied || !canAfford}
                        size="sm"
                        variant={isApplied ? "secondary" : "default"}
                      >
                        {isApplied ? 'Utført' : canAfford ? 'Utfør' : 'Ikke råd'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};