import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useClientDetails } from '@/hooks/useClientDetails';
import { useArBalances, useApBalances } from '@/hooks/useArApBalances';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import StickyClientLayout from '@/components/Layout/StickyClientLayout';
import BalanceTable, { BalanceItem, BalanceType } from '@/components/ArAp/BalanceTable';
import { Skeleton } from '@/components/ui/skeleton';

interface BalancesPageProps {
  type: BalanceType;
}

const PAGE_CONFIG: Record<BalanceType, { title: string }> = {
  ar: { title: 'Kundesaldo (AR)' },
  ap: { title: 'Leverandørsaldo (AP)' },
};

const BalancesPage = ({ type }: BalancesPageProps) => {
  const { clientId } = useParams<{ clientId: string }>();
  const { data: client, isLoading, error } = useClientDetails(clientId || '');
  const { setSelectedClientId } = useFiscalYear();
  
  const arQuery = useArBalances(type === 'ar' ? (clientId || '') : '');
  const apQuery = useApBalances(type === 'ap' ? (clientId || '') : '');
  
  const balanceQuery = type === 'ar' ? arQuery : apQuery;
  const config = PAGE_CONFIG[type];

  useEffect(() => {
    if (client?.id) setSelectedClientId(client.id);
  }, [client?.id, setSelectedClientId]);

  // Transform data to generic BalanceItem format
  const transformedData: BalanceItem[] = React.useMemo(() => {
    if (!balanceQuery.data) return [];
    
    return balanceQuery.data.map((item) => {
      if (type === 'ar') {
        const arItem = item as { customer_id: string; customer_name: string | null; saldo: number; tx_count: number; updated_at: string };
        return {
          id: arItem.customer_id,
          name: arItem.customer_name,
          saldo: arItem.saldo,
          tx_count: arItem.tx_count,
          updated_at: arItem.updated_at,
        };
      } else {
        const apItem = item as { supplier_id: string; supplier_name: string | null; saldo: number; tx_count: number; updated_at: string };
        return {
          id: apItem.supplier_id,
          name: apItem.supplier_name,
          saldo: apItem.saldo,
          tx_count: apItem.tx_count,
          updated_at: apItem.updated_at,
        };
      }
    });
  }, [balanceQuery.data, type]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Klient ikke funnet</h1>
          <p className="text-muted-foreground">Kunne ikke finne klient med ID {clientId}</p>
        </div>
      </div>
    );
  }

  return (
    <StickyClientLayout
      clientName={client.company_name || client.name}
      orgNumber={client.org_number}
      pageTitle={config.title}
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-auto">
          <div className="space-y-6 p-6">
            <BalanceTable 
              data={transformedData}
              clientName={client.company_name || client.name}
              type={type}
              isLoading={balanceQuery.isLoading}
            />
          </div>
        </div>
      </div>
    </StickyClientLayout>
  );
};

export default BalancesPage;
