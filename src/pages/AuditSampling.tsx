import React from 'react';
import { useParams } from 'react-router-dom';
import StickyClientLayout from '@/components/Layout/StickyClientLayout';
import AuditSamplingModule from '@/components/Audit/Sampling/AuditSamplingModule';
import { useClientDetails } from '@/hooks/useClientDetails';

const AuditSampling: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const { data: client } = useClientDetails(clientId || '');

  if (!clientId) {
    return <div>Klient ID mangler</div>;
  }

  if (!client) {
    return <div>Laster klient...</div>;
  }

  return (
    <StickyClientLayout 
      clientName={client.name}
      orgNumber={client.org_number}
      pageTitle="Revisjonsutvalg"
    >
      <div className="container mx-auto py-6">
        <AuditSamplingModule clientId={clientId} />
      </div>
    </StickyClientLayout>
  );
};

export default AuditSampling;