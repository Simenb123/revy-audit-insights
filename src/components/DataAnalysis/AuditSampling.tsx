import React from 'react';
import ConsolidatedAuditSampling from './ConsolidatedAuditSampling';

interface AuditSamplingProps {
  clientId: string;
}

const AuditSampling: React.FC<AuditSamplingProps> = ({ clientId }) => {
  return <ConsolidatedAuditSampling clientId={clientId} />;
};

export default AuditSampling;