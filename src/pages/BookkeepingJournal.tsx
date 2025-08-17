import React from 'react';
import { useParams } from 'react-router-dom';
import { useClientDetails } from '@/hooks/useClientDetails';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import StickyClientLayout from '@/components/Layout/StickyClientLayout';
import JournalEntryForm from '@/components/bookkeeping/JournalEntryForm';
import JournalEntriesList from '@/components/bookkeeping/JournalEntriesList';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';

const BookkeepingJournal = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const { data: client, isLoading, error } = useClientDetails(clientId || '');
  const { setSelectedClientId } = useFiscalYear();

  useEffect(() => {
    if (client?.id) setSelectedClientId(client.id);
  }, [client?.id, setSelectedClientId]);

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
      pageTitle="Bilagsjournal"
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-auto">
          <div className="space-y-6 p-6">
            <JournalEntryForm 
              clientId={client.id}
              onSuccess={() => {
                // The list will automatically refresh due to query invalidation
              }}
            />
            <JournalEntriesList clientId={client.id} />
          </div>
        </div>
      </div>
    </StickyClientLayout>
  );
};

export default BookkeepingJournal;