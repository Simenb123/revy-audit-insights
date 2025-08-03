import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirmStandardAccounts } from '@/hooks/useFirmStandardAccounts';

const FirmFinancialStatementPreview = () => {
  const { data: accounts } = useFirmStandardAccounts();

  // Group accounts by type for preview
  const groupedAccounts = accounts?.reduce((acc: any, account: any) => {
    if (!acc[account.account_type]) {
      acc[account.account_type] = [];
    }
    acc[account.account_type].push(account);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Regnskapsoppstilling Forhåndsvisning</CardTitle>
        <CardDescription>
          Forhåndsvisning av hvordan regnskapsoppstillingen vil se ut med firmaets standardkontoer
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(groupedAccounts || {}).map(([type, typeAccounts]) => (
            <div key={type} className="space-y-2">
              <h3 className="font-semibold text-lg capitalize">{type}</h3>
              <div className="space-y-1 pl-4">
                {(typeAccounts as any[])?.map((account: any) => (
                  <div key={account.id} className="flex justify-between items-center py-1">
                    <span className="text-sm">
                      {account.standard_number} {account.standard_name}
                    </span>
                    <span className="text-sm text-muted-foreground">0,00</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FirmFinancialStatementPreview;