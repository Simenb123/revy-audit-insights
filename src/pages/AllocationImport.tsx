import React, { useEffect } from 'react';
import AllocationImport from '@/components/ResourcePlanner/AllocationImport';

export default function AllocationImportPage() {
  useEffect(() => {
    document.title = 'Allokeringsimport – Revio';
  }, []);

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Allokeringsimport</h1>
      <AllocationImport />
    </main>
  );
}
