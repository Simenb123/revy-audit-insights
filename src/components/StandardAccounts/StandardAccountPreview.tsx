import React from 'react';
import { useFirmStandardAccounts, type FirmStandardAccount } from '@/hooks/useFirmStandardAccounts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Calculator, Sigma } from 'lucide-react';

const StandardAccountPreview = () => {
  const { data: accounts = [], isLoading } = useFirmStandardAccounts();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Forhåndsvisning av struktur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground">Laster struktur...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group accounts by statement type (based on standard_number)
  const balanceAccounts = accounts.filter((acc: FirmStandardAccount) => {
    const num = parseInt(acc.standard_number);
    return num >= 1000 && num <= 2999;
  });
  const incomeAccounts = accounts.filter((acc: FirmStandardAccount) => {
    const num = parseInt(acc.standard_number);
    return num >= 3000 && num <= 8999;
  });

  const getLineTypeInfo = (lineType: string) => {
    switch (lineType) {
      case 'detail':
        return { label: 'Detalj', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-300', icon: FileText };
      case 'subtotal':
        return { label: 'Delsum', color: 'bg-purple-500/10 text-purple-700 dark:text-purple-300', icon: Calculator };
      case 'calculation':
        return { label: 'Beregning', color: 'bg-orange-500/10 text-orange-700 dark:text-orange-300', icon: Sigma };
      default:
        return { label: lineType, color: 'bg-gray-500/10 text-gray-700 dark:text-gray-300', icon: FileText };
    }
  };

  const renderAccount = (account: FirmStandardAccount, depth: number = 0) => {
    const lineTypeInfo = getLineTypeInfo(account.line_type);
    const Icon = lineTypeInfo.icon;
    
    return (
      <div
        key={account.id}
        className="border-b last:border-0 py-3 hover:bg-muted/50 transition-colors"
        style={{ paddingLeft: `${depth * 24}px` }}
      >
        <div className="flex items-start gap-3">
          <Icon className="h-4 w-4 mt-1 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-medium">{account.standard_number}</span>
              <span className="text-sm">{account.standard_name}</span>
              <Badge variant="outline" className={lineTypeInfo.color}>
                {lineTypeInfo.label}
              </Badge>
              {account.is_custom && (
                <Badge variant="secondary" className="text-xs">
                  Tilpasset
                </Badge>
              )}
            </div>
            
            {account.calculation_formula && (
              <div className="mt-1 text-xs text-muted-foreground font-mono">
                Formel: {account.calculation_formula}
              </div>
            )}
            
            {account.parent_line_id && (
              <div className="mt-1 text-xs text-muted-foreground">
                Parent ID: {account.parent_line_id}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Build hierarchical structure
  const buildHierarchy = (accounts: FirmStandardAccount[]) => {
    const accountMap = new Map(accounts.map(acc => [acc.standard_number, acc]));
    const roots: FirmStandardAccount[] = [];
    const childrenMap = new Map<string, FirmStandardAccount[]>();

    // Group children by parent
    accounts.forEach(acc => {
      if (acc.parent_line_id) {
        const children = childrenMap.get(acc.parent_line_id) || [];
        children.push(acc);
        childrenMap.set(acc.parent_line_id, children);
      } else {
        roots.push(acc);
      }
    });

    const renderWithChildren = (account: FirmStandardAccount, depth: number = 0): React.ReactNode[] => {
      const children = childrenMap.get(account.standard_number) || [];
      return [
        renderAccount(account, depth),
        ...children.flatMap(child => renderWithChildren(child, depth + 1))
      ];
    };

    return roots.flatMap(root => renderWithChildren(root, 0));
  };

  return (
    <div className="space-y-6">
      {/* Balanse */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Balanse
          </CardTitle>
        </CardHeader>
        <CardContent>
          {balanceAccounts.length > 0 ? (
            <div className="space-y-1">
              {buildHierarchy(balanceAccounts)}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Ingen balansekontoer funnet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Resultat */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Resultatregnskap
          </CardTitle>
        </CardHeader>
        <CardContent>
          {incomeAccounts.length > 0 ? (
            <div className="space-y-1">
              {buildHierarchy(incomeAccounts)}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Ingen resultatkontoer funnet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Forklaring</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <span className="text-muted-foreground">Detalj: Individuell konto</span>
            </div>
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-purple-500" />
              <span className="text-muted-foreground">Delsum: Sum av underkontoer</span>
            </div>
            <div className="flex items-center gap-2">
              <Sigma className="h-4 w-4 text-orange-500" />
              <span className="text-muted-foreground">Beregning: Beregnet fra formel</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StandardAccountPreview;
