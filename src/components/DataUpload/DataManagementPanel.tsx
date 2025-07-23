import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Database, Eye, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DataManagementPanelProps {
  clientId: string;
  orgNumber?: string;
  lastUploadSummary?: {
    fileName: string;
    recordsImported: number;
    uploadDate: string;
    dataType: string;
  };
}

export const DataManagementPanel: React.FC<DataManagementPanelProps> = ({
  clientId,
  orgNumber,
  lastUploadSummary
}) => {
  const navigate = useNavigate();

  const handleViewChartOfAccounts = () => {
    if (orgNumber) {
      navigate(`/klienter/${orgNumber}/kontoplan`);
    }
  };

  const handleViewUploadHistory = () => {
    if (orgNumber) {
      navigate(`/klienter/${orgNumber}/upload-historikk`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Datahåndtering
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {lastUploadSummary && (
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Siste opplasting
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Fil:</span>
                <span className="font-medium">{lastUploadSummary.fileName}</span>
              </div>
              <div className="flex justify-between">
                <span>Type:</span>
                <Badge variant="secondary">{lastUploadSummary.dataType}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Poster:</span>
                <span className="font-medium">{lastUploadSummary.recordsImported}</span>
              </div>
              <div className="flex justify-between">
                <span>Dato:</span>
                <span className="text-muted-foreground">{lastUploadSummary.uploadDate}</span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="font-medium text-sm">Hvor finner jeg dataen?</h4>
          <div className="grid gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewChartOfAccounts}
              className="justify-start"
              disabled={!orgNumber}
            >
              <Eye className="w-4 h-4 mr-2" />
              Se kontoplan
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewUploadHistory}
              className="justify-start"
              disabled={!orgNumber}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Opplastingshistorikk
            </Button>
          </div>
          
          {!orgNumber && (
            <p className="text-xs text-muted-foreground">
              Navigasjon tilgjengelig når klient er valgt
            </p>
          )}
        </div>

        <div className="bg-muted/50 rounded-lg p-3">
          <h5 className="font-medium text-sm mb-2">Tips</h5>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Saldobalanse legges til i kontoplanen</li>
            <li>• Du kan laste opp samme fil flere ganger (overskriver eksisterende)</li>
            <li>• AI gjenkjenner norske kolonnenavn automatisk</li>
            <li>• Bruk "Angre siste" for å reversere opplastinger</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};