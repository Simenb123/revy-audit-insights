
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface OverviewProps {
  documentCount: number;
  nextAuditDeadline: string;
  lastAccountingFile?: {
    name: string;
    importDate: string;
  };
  onUploadClick: () => void;
}

const Overview = ({ 
  documentCount, 
  nextAuditDeadline, 
  lastAccountingFile, 
  onUploadClick 
}: OverviewProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Oversikt</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Totale dokumenter</h3>
          <p className="text-xl font-bold">{documentCount}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Neste revisjonsfrist</h3>
          <p>{nextAuditDeadline}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Sist importerte regnskapsfil</h3>
          {lastAccountingFile ? (
            <>
              <p>{lastAccountingFile.name}</p>
              <p className="text-xs text-gray-500">Importert: {lastAccountingFile.importDate}</p>
            </>
          ) : (
            <p className="text-sm text-gray-500">Ingen fil importert</p>
          )}
        </div>
        <Button className="w-full" onClick={onUploadClick}>
          <Upload className="mr-2 h-4 w-4" /> Last opp regnskapsdata
        </Button>
      </CardContent>
    </Card>
  );
};

export default Overview;
