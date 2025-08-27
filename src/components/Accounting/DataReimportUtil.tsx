import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Trash2, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DataReimportUtilProps {
  clientId: string;
  clientName: string;
}

const DataReimportUtil: React.FC<DataReimportUtilProps> = ({ clientId, clientName }) => {
  const [isClearing, setIsClearing] = useState(false);

  const clearExistingData = async () => {
    setIsClearing(true);
    try {
      console.log('🗑️ Clearing existing data for client:', clientId);
      
      // Delete general ledger transactions
      const { error: transError } = await supabase
        .from('general_ledger_transactions')
        .delete()
        .eq('client_id', clientId);
      
      if (transError) throw transError;

      // Delete accounting data versions
      const { error: versionError } = await supabase
        .from('accounting_data_versions')
        .delete()
        .eq('client_id', clientId);
      
      if (versionError) throw versionError;

      // Delete upload batches for this client
      const { error: batchError } = await supabase
        .from('upload_batches')
        .delete()
        .eq('client_id', clientId);
      
      if (batchError) throw batchError;

      toast.success(`Alle eksisterende hovedbok-data for ${clientName} er slettet`);
      
      // Reload page to refresh all data
      window.location.reload();
      
    } catch (error) {
      console.error('Error clearing data:', error);
      toast.error('Feil ved sletting av data: ' + (error as Error).message);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          Data Reimport Verktøy
        </CardTitle>
        <CardDescription>
          Verktøy for å slette eksisterende hovedbok-data og laste opp på nytt med forbedret mapping.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-800 mb-2">Hovedbok</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Opplastning</li>
          </ul>
        </div>
        
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Last opp:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Transaksjoner</li>

          </ul>
        </div>

        <div className="space-y-3">
          <Button
            onClick={clearExistingData}
            disabled={isClearing}
            className="w-full"
            variant="destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isClearing ? 'Sletter...' : `Slett all hovedbok-data for ${clientName}`}
          </Button>
          
          <p className="text-sm text-gray-600">
            Etter sletting kan du gå til hovedbok-opplastning og laste opp filen på nytt.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataReimportUtil;