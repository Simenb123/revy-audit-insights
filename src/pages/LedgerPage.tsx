
import React from 'react';
import { useParams } from 'react-router-dom';
import LedgerUploadZone from '@/components/DataUpload/LedgerUploadZone';

export default function LedgerPage() {
  const { orgNumber } = useParams<{ orgNumber: string }>();

  if (!orgNumber) {
    return <div>Missing organization number</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Last opp regnskapsdata</h1>
      <LedgerUploadZone orgNumber={orgNumber} />
    </div>
  );
}
