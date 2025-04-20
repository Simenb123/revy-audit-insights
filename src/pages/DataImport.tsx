
import React from 'react';
import ExcelImporter from '@/components/DataUpload/ExcelImporter';

const DataImport = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Dataimport</h1>
      <ExcelImporter />
    </div>
  );
};

export default DataImport;
