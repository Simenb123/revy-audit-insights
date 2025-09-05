import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, MapPin, AlertTriangle, CheckCircle } from 'lucide-react';

interface MappingRule {
  id: string;
  source: string;
  target: string;
  confidence: number;
  type: 'automatic' | 'manual' | 'suggested';
}

interface AccountMapping {
  sourceAccount: {
    number: string;
    name: string;
    amount: number;
  };
  targetAccount: {
    number: string;
    name: string;
  };
  rule: MappingRule;
  discrepancy: number;
  status: 'mapped' | 'unmapped' | 'conflict';
}

interface AccountMappingVisualizerProps {
  mappings: AccountMapping[];
  onRuleEdit?: (ruleId: string) => void;
  onConflictResolve?: (mappingId: string) => void;
}

export const AccountMappingVisualizer: React.FC<AccountMappingVisualizerProps> = ({
  mappings,
  onRuleEdit,
  onConflictResolve
}) => {
  const mappedCount = mappings.filter(m => m.status === 'mapped').length;
  const unmappedCount = mappings.filter(m => m.status === 'unmapped').length;
  const conflictCount = mappings.filter(m => m.status === 'conflict').length;
  const totalCount = mappings.length;

  const mappingPercentage = totalCount > 0 ? (mappedCount / totalCount) * 100 : 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'mapped':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'conflict':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'unmapped':
        return <MapPin className="h-4 w-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'mapped':
        return 'default';
      case 'conflict':
        return 'destructive';
      case 'unmapped':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getRuleTypeColor = (type: string) => {
    switch (type) {
      case 'automatic':
        return 'default';
      case 'manual':
        return 'outline';
      case 'suggested':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Kontomapping Oversikt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{mappedCount}</div>
                <div className="text-sm text-muted-foreground">Mappet</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{conflictCount}</div>
                <div className="text-sm text-muted-foreground">Konflikter</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{unmappedCount}</div>
                <div className="text-sm text-muted-foreground">Ikke mappet</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{totalCount}</div>
                <div className="text-sm text-muted-foreground">Totalt</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Mapping-dekningsgrad</span>
                <span className="font-medium">{mappingPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={mappingPercentage} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mappings List */}
      <Card>
        <CardHeader>
          <CardTitle>Detaljert Mapping</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mappings.map((mapping, index) => (
              <div 
                key={index} 
                className={`border rounded-lg p-4 transition-colors ${
                  mapping.status === 'conflict' ? 'border-red-200 bg-red-50/30' : 
                  mapping.status === 'unmapped' ? 'border-gray-200 bg-gray-50/30' : 
                  'border-green-200 bg-green-50/30'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(mapping.status)}
                    <Badge variant={getStatusColor(mapping.status)}>
                      {mapping.status === 'mapped' ? 'Mappet' : 
                       mapping.status === 'conflict' ? 'Konflikt' : 'Ikke mappet'}
                    </Badge>
                    <Badge variant={getRuleTypeColor(mapping.rule.type)}>
                      {mapping.rule.type === 'automatic' ? 'Automatisk' :
                       mapping.rule.type === 'manual' ? 'Manuell' : 'Foreslått'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {mapping.status === 'conflict' && onConflictResolve && (
                      <button
                        onClick={() => onConflictResolve(mapping.rule.id)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Løs konflikt
                      </button>
                    )}
                    {onRuleEdit && (
                      <button
                        onClick={() => onRuleEdit(mapping.rule.id)}
                        className="text-sm text-primary hover:text-primary-dark"
                      >
                        Rediger regel
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Source Account */}
                  <div className="flex-1">
                    <div className="font-medium">{mapping.sourceAccount.number}</div>
                    <div className="text-sm text-muted-foreground">{mapping.sourceAccount.name}</div>
                    <div className="text-sm font-mono">
                      {mapping.sourceAccount.amount.toLocaleString('nb-NO', {
                        style: 'currency',
                        currency: 'NOK',
                        minimumFractionDigits: 0
                      })}
                    </div>
                  </div>

                  {/* Arrow */}
                  <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />

                  {/* Target Account */}
                  <div className="flex-1">
                    <div className="font-medium">{mapping.targetAccount.number}</div>
                    <div className="text-sm text-muted-foreground">{mapping.targetAccount.name}</div>
                    {mapping.discrepancy !== 0 && (
                      <div className={`text-sm font-mono ${
                        Math.abs(mapping.discrepancy) > 1000 ? 'text-red-600' : 'text-orange-600'
                      }`}>
                        Avvik: {mapping.discrepancy.toLocaleString('nb-NO', {
                          style: 'currency',
                          currency: 'NOK',
                          minimumFractionDigits: 0
                        })}
                      </div>
                    )}
                  </div>

                  {/* Confidence Score */}
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Tillit</div>
                    <div className={`font-medium ${
                      mapping.rule.confidence >= 90 ? 'text-green-600' :
                      mapping.rule.confidence >= 70 ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {(mapping.rule.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {mappings.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Ingen kontomappinger å vise</p>
                <p className="text-sm">Mappinger vil vises når avstemmingsdata er tilgjengelig</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};