import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

interface FinancialStatementValidationProps {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  totalRevenue: number;
  totalExpenses: number;
  mappingStats: {
    totalAccounts: number;
    mappedAccounts: number;
    unmappedAccounts: number;
  };
}

const FinancialStatementValidation = ({
  totalAssets,
  totalLiabilities,
  totalEquity,
  totalRevenue,
  totalExpenses,
  mappingStats
}: FinancialStatementValidationProps) => {
  const balanceCheck = Math.abs(totalAssets - (totalLiabilities + totalEquity));
  const balanceCheckPercentage = totalAssets > 0 ? (balanceCheck / totalAssets) * 100 : 0;
  const isBalanced = balanceCheckPercentage < 0.01; // Allow for rounding errors
  
  const netResult = totalRevenue - totalExpenses;
  const mappingCompleteness = (mappingStats.mappedAccounts / Math.max(mappingStats.totalAccounts, 1)) * 100;
  
  const validationItems = [
    {
      id: 'balance',
      title: 'Balansesjekk',
      description: 'Eiendeler = Gjeld + Egenkapital',
      status: isBalanced ? 'success' : 'error',
      value: `Avvik: ${new Intl.NumberFormat('nb-NO').format(balanceCheck)}`,
      icon: isBalanced ? CheckCircle : XCircle,
      details: isBalanced 
        ? 'Balansen stemmer' 
        : `Avvik på ${balanceCheckPercentage.toFixed(2)}% av totale eiendeler`
    },
    {
      id: 'mapping',
      title: 'Mapping-fullstendighet',
      description: 'Andel kontoer som er mappet',
      status: mappingCompleteness === 100 ? 'success' : mappingCompleteness > 80 ? 'warning' : 'error',
      value: `${mappingCompleteness.toFixed(1)}%`,
      icon: mappingCompleteness === 100 ? CheckCircle : mappingCompleteness > 80 ? AlertTriangle : XCircle,
      details: `${mappingStats.mappedAccounts} av ${mappingStats.totalAccounts} kontoer mappet`
    },
    {
      id: 'result',
      title: 'Årsresultat',
      description: 'Inntekter - Kostnader',
      status: 'info',
      value: new Intl.NumberFormat('nb-NO').format(netResult),
      icon: Info,
      details: netResult >= 0 ? 'Positivt årsresultat' : 'Negativt årsresultat'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-50 text-green-700 border-green-200';
      case 'warning': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'error': return 'bg-red-50 text-red-700 border-red-200';
      case 'info': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getIconColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      case 'info': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Validering av regnskapsoppstilling
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {validationItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <div
              key={item.id}
              className={`p-4 border rounded-lg ${getStatusColor(item.status)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <IconComponent className={`w-5 h-5 mt-0.5 ${getIconColor(item.status)}`} />
                  <div>
                    <h4 className="font-medium">{item.title}</h4>
                    <p className="text-sm opacity-80">{item.description}</p>
                    <p className="text-xs mt-1 opacity-70">{item.details}</p>
                  </div>
                </div>
                <Badge variant="outline" className="font-mono">
                  {item.value}
                </Badge>
              </div>
            </div>
          );
        })}

        {mappingStats.unmappedAccounts > 0 && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5" />
              <div className="text-sm text-orange-700">
                <p className="font-medium">Ufullstendig mapping oppdaget</p>
                <p className="text-xs mt-1">
                  {mappingStats.unmappedAccounts} kontoer er ikke mappet til standardkontoer. 
                  Dette kan påvirke nøyaktigheten av regnskapsoppstillingen.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FinancialStatementValidation;