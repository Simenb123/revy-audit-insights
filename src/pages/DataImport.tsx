
import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import DataUploadHub from '@/components/DataUpload/DataUploadHub';
import AccountingDataUploader from '@/components/Accounting/AccountingDataUploader';
import { useClientDetails } from '@/hooks/useClientDetails';

const DataImport = () => {
  const { orgNumber } = useParams<{ orgNumber: string }>();
  const location = useLocation();
  const { data: client } = useClientDetails(orgNumber || '');
  
  // If we're on a specific data category route, show the appropriate uploader
  if (location.pathname.includes('/grunnlagsdata')) {
    return <AccountingDataUploader 
      clientId={orgNumber || ''} 
      clientName={client?.companyName || client?.name || 'Ukjent klient'} 
    />;
  }
  
  if (location.pathname.includes('/spesialdata')) {
    return <AccountingDataUploader 
      clientId={orgNumber || ''} 
      clientName={client?.companyName || client?.name || 'Ukjent klient'} 
    />;
  }
  
  if (location.pathname.includes('/transaksjoner')) {
    return <AccountingDataUploader 
      clientId={orgNumber || ''} 
      clientName={client?.companyName || client?.name || 'Ukjent klient'} 
    />;
  }
  
  if (location.pathname.includes('/import')) {
    return <AccountingDataUploader 
      clientId={orgNumber || ''} 
      clientName={client?.companyName || client?.name || 'Ukjent klient'} 
    />;
  }
  
  // Default: show the data upload hub if we're in a client context
  if (orgNumber) {
    return <DataUploadHub />;
  }
  
  // Fallback for non-client context
  return <AccountingDataUploader 
    clientId="" 
    clientName="Ingen klient valgt" 
  />;
};

export default DataImport;
