
import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import DataUploadHub from '@/components/DataUpload/DataUploadHub';
import AccountingDataUploader from '@/components/Accounting/AccountingDataUploader';
import { useClientDetails } from '@/hooks/useClientDetails';
import ResponsiveLayout from '@/components/Layout/ResponsiveLayout';

const DataImport = () => {
  const { orgNumber } = useParams<{ orgNumber: string }>();
  const location = useLocation();
  const { data: client } = useClientDetails(orgNumber || '');
  const clientId = client?.id || '';
  const clientName = client?.company_name || client?.name || 'Ukjent klient';
  
  // If we're on a specific data category route, show the appropriate uploader
  if (location.pathname.includes('/grunnlagsdata')) {
  return (
    <ResponsiveLayout maxWidth="wide">
      <AccountingDataUploader clientId={clientId} clientName={clientName} />
    </ResponsiveLayout>
  );
  }
  
  if (location.pathname.includes('/spesialdata')) {
    return (
      <ResponsiveLayout maxWidth="wide">
        <AccountingDataUploader clientId={clientId} clientName={clientName} />
      </ResponsiveLayout>
    );
  }
  
  if (location.pathname.includes('/transaksjoner')) {
    return (
      <ResponsiveLayout maxWidth="wide">
        <AccountingDataUploader clientId={clientId} clientName={clientName} />
      </ResponsiveLayout>
    );
  }
  
  if (location.pathname.includes('/import')) {
    return (
      <ResponsiveLayout maxWidth="wide">
        <AccountingDataUploader clientId={clientId} clientName={clientName} />
      </ResponsiveLayout>
    );
  }
  
  // Default: show the data upload hub if we're in a client context
  if (orgNumber) {
    return <DataUploadHub />;
  }
  
  // Fallback for non-client context
  return (
    <ResponsiveLayout maxWidth="wide">
      <AccountingDataUploader 
        clientId="" 
        clientName="Ingen klient valgt" 
      />
    </ResponsiveLayout>
  );
};

export default DataImport;
