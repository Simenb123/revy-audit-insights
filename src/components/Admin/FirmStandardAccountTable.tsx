import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useFirmStandardAccounts } from '@/hooks/useFirmStandardAccounts';

const FirmStandardAccountTable = () => {
  const { data: accounts, isLoading } = useFirmStandardAccounts();

  if (isLoading) {
    return <div>Laster firmaspesifikke standardkontoer...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Firmaspesifikke Standardkontoer</CardTitle>
            <CardDescription>
              Rediger og tilpass standardkontoplan for ditt firma
            </CardDescription>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Ny Konto
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {accounts?.map((account: any) => (
            <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="font-medium">{account.standard_number} - {account.standard_name}</div>
                <div className="text-sm text-muted-foreground">
                  {account.account_type} | {account.is_custom ? 'Tilpasset' : 'Standard'}
                </div>
              </div>
              <Button variant="outline" size="sm">
                Rediger
              </Button>
            </div>
          )) || <div className="text-center py-8 text-muted-foreground">Ingen kontoer funnet</div>}
        </div>
      </CardContent>
    </Card>
  );
};

export default FirmStandardAccountTable;