import React, { useEffect } from 'react';
import AllocationImport from '@/components/ResourcePlanner/AllocationImport';
import PageLayout from '@/components/Layout/PageLayout';

export default function AllocationImportPage() {
  useEffect(() => {
    document.title = 'Allokeringsimport – Revio';
  }, []);

  return (
    <PageLayout width="medium" spacing="normal">
      <h1 className="text-2xl font-semibold mb-4">Allokeringsimport</h1>
      <AllocationImport />
    </PageLayout>
  );
}
