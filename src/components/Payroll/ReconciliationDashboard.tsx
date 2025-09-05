import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';

interface ReconciliationSummary {
  totalItems: number;
  perfectMatches: number;
  smallDiscrepancies: number; // <=5 kr
  largeDiscrepancies: number; // >5 kr
  totalDiscrepancy: number;
  accountsCovered: number;
  totalAccounts: number;
}

interface ReconciliationDashboardProps {
  summary: ReconciliationSummary;
  isLoading?: boolean;
}

const ReconciliationDashboard: React.FC<ReconciliationDashboardProps> = ({
  summary,
  isLoading = false
}) => {
  const {
    totalItems,
    perfectMatches,
    smallDiscrepancies,
    largeDiscrepancies,
    totalDiscrepancy,
    accountsCovered,
    totalAccounts
  } = summary;

  const matchPercentage = totalItems > 0 ? Math.round((perfectMatches / totalItems) * 100) : 0;
  const accountCoverage = totalAccounts > 0 ? Math.round((accountsCovered / totalAccounts) * 100) : 0;
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-3/4" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2 mb-2" />
              <div className="h-3 bg-muted rounded w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Perfect Matches */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Perfekte Match</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{perfectMatches}</div>
            <p className="text-xs text-muted-foreground">
              av {totalItems} totalt ({matchPercentage}%)
            </p>
            <Progress value={matchPercentage} className="mt-2 h-2" />
          </CardContent>
        </Card>

        {/* Small Discrepancies */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Små Avvik</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{smallDiscrepancies}</div>
            <p className="text-xs text-muted-foreground">
              ≤ 5 kr forskjell
            </p>
            <Badge variant="secondary" className="mt-2">
              Godkjent avvik
            </Badge>
          </CardContent>
        </Card>

        {/* Large Discrepancies */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Store Avvik</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{largeDiscrepancies}</div>
            <p className="text-xs text-muted-foreground">
              {'>'}5 kr forskjell
            </p>
            <Badge variant="destructive" className="mt-2">
              Krever oppmerksomhet
            </Badge>
          </CardContent>
        </Card>

        {/* Account Coverage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kontodekning</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accountsCovered}</div>
            <p className="text-xs text-muted-foreground">
              av {totalAccounts} kontoer ({accountCoverage}%)
            </p>
            <Progress value={accountCoverage} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Total Discrepancy Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Avstemmingssammendrag</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Totalt avvik</p>
              <p className="text-2xl font-bold">
                {Math.abs(totalDiscrepancy).toLocaleString('nb-NO')} kr
              </p>
            </div>
            <div className="text-right">
              <Badge
                variant={Math.abs(totalDiscrepancy) <= 100 ? "default" : "destructive"}
                className="text-sm"
              >
                {Math.abs(totalDiscrepancy) <= 100 ? "Godkjent" : "Krever gjennomgang"}
              </Badge>
            </div>
          </div>
          
          {largeDiscrepancies > 0 && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <p className="text-sm font-medium text-destructive">
                  {largeDiscrepancies} poster krever oppmerksomhet
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Gå til "Avstemming" fanen for å se detaljer og løse avvik.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReconciliationDashboard;