
import React from 'react';
import { Link } from 'react-router-dom';
import ExcelImporter from '@/components/DataUpload/ExcelImporter';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Users, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const DataImport = () => {
  return (
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
        <h3 className="font-bold flex items-center gap-2 mb-2">
          <FileSpreadsheet size={18} />
          Import av klientdata
        </h3>
        <p>Her kan du importere klienter fra en Excel-fil. Filen må ha organisasjonsnumre i kolonne A.</p>
        <p className="mt-2">Etter importering vil du finne klientene dine i <Link to="/klienter" className="text-blue-600 hover:underline font-medium">klientoversikten</Link>.</p>
      </div>
      
      <ExcelImporter />

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Navigasjonsguide</CardTitle>
            <CardDescription>Slik navigerer du til importerte klienter</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Last opp Excel-filen med organisasjonsnumre</li>
              <li>Vent til importen er fullført</li>
              <li>Klikk på "Gå til klientoversikt" knappen, eller</li>
              <li>Naviger til klientoversikten fra hovedmenyen</li>
            </ol>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="gap-2 w-full">
              <Link to="/klienter">
                <Users size={16} />
                <span>Gå til klientoversikt</span>
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default DataImport;
