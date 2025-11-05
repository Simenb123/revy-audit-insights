import { AssetsList } from '@/components/assets/AssetsList';
import PageLayout from '@/components/Layout/PageLayout';

export default function AssetManagement() {
  // For demo purposes, using a placeholder client ID
  // In real implementation, this would come from route params or context
  const clientId = 'demo-client-id';

  return (
    <PageLayout width="wide" spacing="normal">
      <div>
        <h1 className="text-3xl font-bold">Anleggsmiddelforvaltning</h1>
        <p className="text-muted-foreground">
          Administrer anleggsmidler, avskrivninger og vedlikehold
        </p>
      </div>
      
      <AssetsList clientId={clientId} />
    </PageLayout>
  );
}