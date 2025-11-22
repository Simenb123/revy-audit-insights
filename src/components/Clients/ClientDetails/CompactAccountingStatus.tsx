import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Database, 
  CheckCircle, 
  AlertCircle, 
  FileText,
  ExternalLink
} from 'lucide-react';
import { useAccountingData } from '@/hooks/useAccountingData';
import { Client } from '@/types/revio';

interface CompactAccountingStatusProps {
  client: Client;
}

const CompactAccountingStatus = ({ client }: CompactAccountingStatusProps) => {
  const { data: accountingData } = useAccountingData(client.id);

  const hasTrialBalance = accountingData?.chartOfAccountsCount > 0;
  const hasGeneralLedger = accountingData?.hasGeneralLedger;

  const items = [
    {
      label: 'Saldobalanse',
      status: hasTrialBalance,
      link: hasTrialBalance ? `/clients/${client.id}/analysis` : `/clients/${client.id}/trial-balance`
    },
    {
      label: 'Hovedbok',
      status: hasGeneralLedger,
      link: hasGeneralLedger ? `/clients/${client.id}/analysis` : `/clients/${client.id}/general-ledger`
    },
    {
      label: 'Kontoplan',
      status: accountingData?.chartOfAccountsCount > 0,
      link: `/clients/${client.id}/accounting-data`
    }
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Database className="h-4 w-4" />
          Regnskapsdata
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          {items.map((item, index) => (
            <div key={index} className="text-center">
              <div className="flex flex-col items-center gap-2">
                {item.status ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-orange-500" />
                )}
                <div>
                  <p className="text-xs font-medium">{item.label}</p>
                  <Badge 
                    variant={item.status ? "default" : "secondary"}
                    className="text-xs mt-1"
                  >
                    {item.status ? 'OK' : 'Mangler'}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="pt-3 border-t">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link to={`/clients/${client.id}/accounting-data`}>
              <FileText className="w-3 h-3 mr-1" />
              Administrer data
              <ExternalLink className="w-3 h-3 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompactAccountingStatus;