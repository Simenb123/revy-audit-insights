import React from 'react';
import { useParams } from 'react-router-dom';
import { StickyClientLayout } from '@/components/Layout/StickyClientLayout';
import AuditSamplingModule from '@/components/Audit/Sampling/AuditSamplingModule';

const AuditSampling: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();

  if (!clientId) {
    return <div>Klient ID mangler</div>;
  }

  return (
    <StickyClientLayout clientId={clientId}>
      <div className="container mx-auto py-6">
        <AuditSamplingModule clientId={clientId} />
      </div>
    </StickyClientLayout>
  );
};

export default AuditSampling;