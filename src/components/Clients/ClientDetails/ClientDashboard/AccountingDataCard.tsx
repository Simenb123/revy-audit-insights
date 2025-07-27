import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, Upload, FileText, Calculator, TrendingUp } from "lucide-react";
import { useAccountingData } from "@/hooks/useAccountingData";
import { useNavigate } from "react-router-dom";
import { Client } from "@/types/revio";

interface AccountingDataCardProps {
  client: Client;
}

const AccountingDataCard = ({ client }: AccountingDataCardProps) => {
  const { data: accountingData, isLoading } = useAccountingData(client.id);
  const navigate = useNavigate();

  const handleUploadClick = () => {
    navigate(`/klienter/${client.org_number}/regnskapsdata`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nb-NO');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Regnskapsdata
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Regnskapsdata
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Data Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-muted/50 rounded-md">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Kontoplan</span>
            </div>
            <p className="text-lg font-bold">{accountingData?.chartOfAccountsCount || 0}</p>
            <p className="text-xs text-muted-foreground">kontoer</p>
          </div>

          <div className="p-3 bg-muted/50 rounded-md">
            <div className="flex items-center gap-2 mb-1">
              <Calculator className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Regnskapsfiler</span>
            </div>
            <p className="text-lg font-bold">{accountingData?.generalLedgerTransactionsCount || 0}</p>
            <p className="text-xs text-muted-foreground">opplastet</p>
          </div>

          <div className="p-3 bg-muted/50 rounded-md">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Siste opplasting</span>
            </div>
            <p className="text-lg font-bold">
              {accountingData?.latestGeneralLedgerUpload ? '✓' : '—'}
            </p>
            <p className="text-xs text-muted-foreground">
              {accountingData?.latestGeneralLedgerUpload ? 'tilgjengelig' : 'ingen'}
            </p>
          </div>
        </div>

        {/* Latest Accounting File */}
        {accountingData?.latestGeneralLedgerUpload && (
          <div className="p-3 border border-border rounded-md">
            <h4 className="text-sm font-medium mb-2">Siste regnskapsfil</h4>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">{accountingData.latestGeneralLedgerUpload.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  Opplastet: {formatDate(accountingData.latestGeneralLedgerUpload.created_at)}
                </p>
              </div>
              <Badge variant="outline">Tilgjengelig</Badge>
            </div>
          </div>
        )}

        {/* Accounting System */}
        {client.accounting_system && (
          <div className="p-3 bg-primary/5 rounded-md">
            <h4 className="text-sm font-medium mb-1">Regnskapssystem</h4>
            <p className="text-sm">{client.accounting_system}</p>
          </div>
        )}

        {/* Data Quality Status */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Datakvalitet</h4>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs">Kontoplan</span>
              <Badge variant={accountingData?.chartOfAccountsCount ? "default" : "secondary"}>
                {accountingData?.chartOfAccountsCount ? "OK" : "Mangler"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">Regnskapsfiler</span>
              <Badge variant={accountingData?.generalLedgerTransactionsCount ? "default" : "secondary"}>
                {accountingData?.generalLedgerTransactionsCount ? "OK" : "Mangler"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">Siste opplasting</span>
              <Badge variant={accountingData?.latestGeneralLedgerUpload ? "default" : "secondary"}>
                {accountingData?.latestGeneralLedgerUpload ? "OK" : "Mangler"}
              </Badge>
            </div>
          </div>
        </div>

        <Button className="w-full" onClick={handleUploadClick}>
          <Upload className="mr-2 h-4 w-4" />
          Administrer regnskapsdata
        </Button>
      </CardContent>
    </Card>
  );
};

export default AccountingDataCard;