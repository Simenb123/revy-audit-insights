import { ReportsList } from '@/components/reports/ReportsList';

export default function ReportsManagement() {
  // For demo purposes, using a placeholder client ID
  // In real implementation, this would come from route params or context
  const clientId = 'demo-client-id';

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Rapporter og dokumentasjon</h1>
          <p className="text-muted-foreground">
            Generer finansielle rapporter, arbeidsarkiver og revisjonsdokumentasjon
          </p>
        </div>
        
        <ReportsList clientId={clientId} />
      </div>
    </div>
  );
}