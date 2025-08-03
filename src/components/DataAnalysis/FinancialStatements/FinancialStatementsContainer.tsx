import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, Download, Settings, Info, TrendingUp, Scale } from 'lucide-react';
import IncomeStatement from './IncomeStatement';
import BalanceSheet from './BalanceSheet';

interface FinancialStatementsContainerProps {
  financialStatement: any[];
  mappingStats: {
    totalAccounts: number;
    mappedAccounts: number;
    unmappedAccounts: number;
  };
  periodInfo?: {
    clientId?: string;
    currentYear: number;
    previousYear: number;
    periodStart: string;
    periodEnd: string;
  } | null;
  onNavigateToMapping?: () => void;
}

const FinancialStatementsContainer: React.FC<FinancialStatementsContainerProps> = ({
  financialStatement,
  mappingStats,
  periodInfo,
  onNavigateToMapping
}) => {
  const mappingPercentage = mappingStats.totalAccounts > 0 
    ? Math.round((mappingStats.mappedAccounts / mappingStats.totalAccounts) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Mapping Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Mapping Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span>Mapping-kvalitet</span>
            <Badge variant={mappingPercentage >= 90 ? "default" : mappingPercentage >= 70 ? "secondary" : "destructive"}>
              {mappingPercentage}%
            </Badge>
          </div>
          <Progress value={mappingPercentage} className="h-2" />
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div className="text-center">
              <div className="font-semibold text-lg text-foreground">{mappingStats.totalAccounts}</div>
              <div className="text-muted-foreground">Totalt</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg text-emerald-600">{mappingStats.mappedAccounts}</div>
              <div className="text-muted-foreground">Mappet</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg text-amber-600">{mappingStats.unmappedAccounts}</div>
              <div className="text-muted-foreground">Umappet</div>
            </div>
          </div>
          {mappingStats.unmappedAccounts > 0 && (
            <div className="pt-2">
              <Button variant="outline" size="sm" className="w-full" onClick={onNavigateToMapping}>
                <Settings className="h-4 w-4 mr-2" />
                Forbedre Mapping
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Statements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Regnskapsoppstilling
              {periodInfo && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({periodInfo.currentYear})
                </span>
              )}
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Eksporter
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="income" className="w-full">
            <div className="px-6 pt-2 pb-4 border-b bg-muted/30">
              <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
                <TabsTrigger value="income" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Resultatregnskap
                </TabsTrigger>
                <TabsTrigger value="balance" className="flex items-center gap-2">
                  <Scale className="h-4 w-4" />
                  Balanse
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="income" className="mt-0">
              <div className="p-6">
                <IncomeStatement 
                  data={financialStatement}
                  currentYear={periodInfo?.currentYear}
                  previousYear={periodInfo?.previousYear}
                  clientId={periodInfo?.clientId}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="balance" className="mt-0">
              <div className="p-6">
                <BalanceSheet 
                  data={financialStatement}
                  currentYear={periodInfo?.currentYear}
                  previousYear={periodInfo?.previousYear}
                />
              </div>
            </TabsContent>
          </Tabs>
          
          {mappingPercentage < 90 && (
            <div className="m-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800">Ikke komplett mapping</p>
                  <p className="text-amber-700">
                    {mappingStats.unmappedAccounts} kontoer er ikke mappet til standardkontoer. 
                    Dette kan påvirke nøyaktigheten av regnskapsoppstillingen.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialStatementsContainer;