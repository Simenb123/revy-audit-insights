import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

interface ValidationIssue {
  level: 'info' | 'warning' | 'error' | 'critical';
  field: string;
  message: string;
  count?: number;
  suggestion?: string;
}

interface ValidationResults {
  saftVersion: string;
  isValid: boolean;
  totalIssues: number;
  issues: ValidationIssue[];
  summary: {
    accounts: number;
    transactions: number;
    customers: number;
    suppliers: number;
    journals: number;
    analysisTypes: number;
  };
  balanceCheck: {
    isBalanced: boolean;
    difference: number;
  };
}

interface SaftValidationReportProps {
  results: ValidationResults;
}

const getIssueIcon = (level: ValidationIssue['level']) => {
  switch (level) {
    case 'info':
      return <Info className="h-4 w-4 text-blue-500" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'error':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'critical':
      return <XCircle className="h-4 w-4 text-red-600" />;
    default:
      return <Info className="h-4 w-4" />;
  }
};

const getIssueColor = (level: ValidationIssue['level']) => {
  switch (level) {
    case 'info':
      return 'bg-blue-100 text-blue-800';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800';
    case 'error':
      return 'bg-red-100 text-red-800';
    case 'critical':
      return 'bg-red-200 text-red-900';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const SaftValidationReport: React.FC<SaftValidationReportProps> = ({ results }) => {
  const criticalIssues = results.issues.filter(i => i.level === 'critical');
  const errorIssues = results.issues.filter(i => i.level === 'error');
  const warningIssues = results.issues.filter(i => i.level === 'warning');
  const infoIssues = results.issues.filter(i => i.level === 'info');

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {results.isValid ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            SAF-T Validering - {results.saftVersion}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{results.summary.accounts}</div>
              <div className="text-sm text-muted-foreground">Kontoer</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{results.summary.transactions}</div>
              <div className="text-sm text-muted-foreground">Transaksjoner</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{results.summary.customers}</div>
              <div className="text-sm text-muted-foreground">Kunder</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{results.summary.suppliers}</div>
              <div className="text-sm text-muted-foreground">Leverandører</div>
            </div>
          </div>

          {/* Balance Check */}
          <Alert className={results.balanceCheck.isBalanced ? 'border-green-200' : 'border-red-200'}>
            <AlertDescription className="flex items-center justify-between">
              <span>Balansekontroll: {results.balanceCheck.isBalanced ? 'OK' : 'Feil'}</span>
              {!results.balanceCheck.isBalanced && (
                <span className="font-mono text-sm">Differanse: {results.balanceCheck.difference.toFixed(2)}</span>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Issues by Level */}
      {criticalIssues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Kritiske Feil ({criticalIssues.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalIssues.map((issue, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg bg-red-50">
                  {getIssueIcon(issue.level)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getIssueColor(issue.level)}>{issue.field}</Badge>
                      {issue.count && <span className="text-sm text-muted-foreground">({issue.count})</span>}
                    </div>
                    <p className="text-sm">{issue.message}</p>
                    {issue.suggestion && (
                      <p className="text-sm text-muted-foreground mt-1">💡 {issue.suggestion}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {errorIssues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">Feil ({errorIssues.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {errorIssues.map((issue, index) => (
                <div key={index} className="flex items-start gap-3 p-2 border rounded">
                  {getIssueIcon(issue.level)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge className={getIssueColor(issue.level)}>{issue.field}</Badge>
                      {issue.count && <span className="text-sm text-muted-foreground">({issue.count})</span>}
                    </div>
                    <p className="text-sm mt-1">{issue.message}</p>
                    {issue.suggestion && (
                      <p className="text-sm text-muted-foreground mt-1">💡 {issue.suggestion}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {warningIssues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-yellow-600">Advarsler ({warningIssues.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {warningIssues.slice(0, 10).map((issue, index) => (
                <div key={index} className="flex items-start gap-3 p-2 border rounded">
                  {getIssueIcon(issue.level)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge className={getIssueColor(issue.level)}>{issue.field}</Badge>
                      {issue.count && <span className="text-sm text-muted-foreground">({issue.count})</span>}
                    </div>
                    <p className="text-sm mt-1">{issue.message}</p>
                  </div>
                </div>
              ))}
              {warningIssues.length > 10 && (
                <div className="text-sm text-muted-foreground text-center py-2">
                  ... og {warningIssues.length - 10} flere advarsler
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {infoIssues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600">Informasjon ({infoIssues.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {infoIssues.slice(0, 5).map((issue, index) => (
                <div key={index} className="flex items-start gap-3 p-2">
                  {getIssueIcon(issue.level)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge className={getIssueColor(issue.level)}>{issue.field}</Badge>
                    </div>
                    <p className="text-sm mt-1">{issue.message}</p>
                  </div>
                </div>
              ))}
              {infoIssues.length > 5 && (
                <div className="text-sm text-muted-foreground text-center py-2">
                  ... og {infoIssues.length - 5} flere informasjoner
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};