
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ExcelImporter from '@/components/DataUpload/ExcelImporter';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Users, FileSpreadsheet, ArrowRight, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

const DataImport = () => {
  const [recentUpload, setRecentUpload] = useState<{
    filename: string;
    timestamp: string;
    importedCount: number;
  } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Auth error:", error);
      }
      setIsAuthenticated(!!session);
      setAuthChecked(true);
    };
    
    checkAuth();
  }, []);

  const handleImportSuccess = (data: { filename: string, importedCount: number }) => {
    setRecentUpload({
      filename: data.filename,
      timestamp: new Date().toLocaleString(),
      importedCount: data.importedCount
    });
  };

  if (authChecked && !isAuthenticated) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Autentisering påkrevd</AlertTitle>
          <AlertDescription>
            Du må være logget inn for å importere klienter. Vennligst logg inn først.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/auth')}>Gå til innlogging</Button>
      </div>
    );
  }

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
      
      {recentUpload ? (
        <div className="mb-6">
          <Alert className="bg-green-50 border-green-200">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            <AlertTitle className="text-green-800">Importering fullført</AlertTitle>
            <AlertDescription className="text-green-700">
              <p className="mb-2">
                Filen <span className="font-medium">{recentUpload.filename}</span> ble importert {recentUpload.timestamp}. 
                <span className="font-medium"> {recentUpload.importedCount} klienter</span> ble lagt til.
              </p>
              <div className="mt-4">
                <Button asChild className="gap-2">
                  <Link to="/klienter">
                    <Users size={16} />
                    <span>Gå til klientoversikt</span>
                    <ArrowRight size={16} />
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  className="ml-3"
                  onClick={() => setRecentUpload(null)}
                >
                  Importer en ny fil
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      ) : (
        <ExcelImporter onImportSuccess={handleImportSuccess} />
      )}

      {!recentUpload && (
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
      )}
    </div>
  );
};

export default DataImport;
