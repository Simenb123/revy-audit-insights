
import React from 'react';
import { Link } from 'react-router-dom';
import ExcelImporter from '@/components/DataUpload/ExcelImporter';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import AppLayout from '@/components/Layout/AppLayout';

const DataImport = () => {
  return (
    <AppLayout>
      <div className="container mx-auto py-8">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link to="/" className="flex items-center gap-1">
              <ChevronLeft size={16} />
              <span>Tilbake til dashboard</span>
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Dataimport</h1>
        </div>
        
        <div className="mb-6 bg-blue-50 border border-blue-100 rounded-lg p-4 text-blue-800">
          <p>Her kan du importere klienter fra en Excel-fil. Filen må ha organisasjonsnumre i kolonne A.</p>
          <p className="mt-2">Etter importering vil du finne klientene dine i klientoversikten.</p>
        </div>
        
        <ExcelImporter />
      </div>
    </AppLayout>
  );
};

export default DataImport;
