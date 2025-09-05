import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, Info, XCircle, FileX, Database } from 'lucide-react';

interface QualityIssue {
  type: 'critical' | 'warning' | 'info';
  category: 'data_completeness' | 'data_consistency' | 'format_validation' | 'business_rules';
  title: string;
  description: string;
  affectedRecords: number;
  recommendation: string;
}

interface DataQualityMetrics {
  totalRecords: number;
  validRecords: number;
  duplicateRecords: number;
  missingDataRecords: number;
  formatErrorRecords: number;
  businessRuleViolations: number;
  overallScore: number;
}

interface DataQualityCheckerProps {
  metrics: DataQualityMetrics;
  issues: QualityIssue[];
  onFixIssue?: (issueIndex: number) => void;
}

export const DataQualityChecker: React.FC<DataQualityCheckerProps> = ({
  metrics,
  issues,
  onFixIssue
}) => {
  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getIssueVariant = (type: string) => {
    switch (type) {
      case 'critical':
        return 'destructive' as const;
      case 'warning':
        return 'warning' as const;
      case 'info':
        return 'default' as const;
      default:
        return 'outline' as const;
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'data_completeness':
        return 'Datakomplethet';
      case 'data_consistency':
        return 'Datakonsistens';
      case 'format_validation':
        return 'Formatvalidering';
      case 'business_rules':
        return 'Forretningsregler';
      default:
        return category;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  const validationRate = metrics.totalRecords > 0 ? (metrics.validRecords / metrics.totalRecords) * 100 : 0;
  const duplicateRate = metrics.totalRecords > 0 ? (metrics.duplicateRecords / metrics.totalRecords) * 100 : 0;
  const missingDataRate = metrics.totalRecords > 0 ? (metrics.missingDataRecords / metrics.totalRecords) * 100 : 0;

  const criticalIssues = issues.filter(issue => issue.type === 'critical');
  const warningIssues = issues.filter(issue => issue.type === 'warning');
  const infoIssues = issues.filter(issue => issue.type === 'info');

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Datakvalitet Sammendrag
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Samlet kvalitetsscore</span>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${getScoreColor(metrics.overallScore)}`}>
                  {metrics.overallScore.toFixed(0)}%
                </span>
                {metrics.overallScore >= 90 ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                )}
              </div>
            </div>
            
            <Progress value={metrics.overallScore} className="h-2" />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">{metrics.validRecords}</div>
                <div className="text-xs text-muted-foreground">Gyldige poster</div>
                <div className="text-xs text-green-600">{validationRate.toFixed(1)}%</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-orange-600">{metrics.duplicateRecords}</div>
                <div className="text-xs text-muted-foreground">Duplikater</div>
                <div className="text-xs text-orange-600">{duplicateRate.toFixed(1)}%</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-red-600">{metrics.missingDataRecords}</div>
                <div className="text-xs text-muted-foreground">Manglende data</div>
                <div className="text-xs text-red-600">{missingDataRate.toFixed(1)}%</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">{metrics.totalRecords}</div>
                <div className="text-xs text-muted-foreground">Totalt poster</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={criticalIssues.length > 0 ? 'border-red-200' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-lg font-semibold text-red-600">{criticalIssues.length}</div>
                <div className="text-sm text-muted-foreground">Kritiske problemer</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={warningIssues.length > 0 ? 'border-orange-200' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-lg font-semibold text-orange-600">{warningIssues.length}</div>
                <div className="text-sm text-muted-foreground">Advarsler</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-lg font-semibold text-blue-600">{infoIssues.length}</div>
                <div className="text-sm text-muted-foreground">Informasjon</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Issues */}
      {issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detaljerte problemer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {issues.map((issue, index) => (
                <Alert key={index} variant={getIssueVariant(issue.type)}>
                  <div className="flex items-start gap-3">
                    {getIssueIcon(issue.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{issue.title}</span>
                        <Badge variant="outline">
                          {getCategoryName(issue.category)}
                        </Badge>
                        <Badge variant="secondary">
                          {issue.affectedRecords} poster påvirket
                        </Badge>
                      </div>
                      
                      <AlertDescription className="mb-2">
                        {issue.description}
                      </AlertDescription>
                      
                      <div className="bg-muted/30 rounded-md p-3 mt-2">
                        <div className="text-sm font-medium mb-1">Anbefaling:</div>
                        <div className="text-sm text-muted-foreground">{issue.recommendation}</div>
                      </div>
                      
                      {onFixIssue && (
                        <button
                          onClick={() => onFixIssue(index)}
                          className="mt-3 text-sm text-primary hover:text-primary-dark font-medium"
                        >
                          Forsøk å fikse automatisk
                        </button>
                      )}
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Issues */}
      {issues.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-600" />
            <h3 className="text-lg font-medium mb-2">Utmerket datakvalitet!</h3>
            <p className="text-muted-foreground">
              Ingen kritiske problemer funnet i datasettet. Alle validering bestått.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};