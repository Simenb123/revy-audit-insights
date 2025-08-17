import { AssetsList } from '@/components/assets/AssetsList';
import { useAuth } from '@/hooks/useAuth';

export default function AssetManagement() {
  const { user } = useAuth();
  
  // For demo purposes, using a placeholder client ID
  // In real implementation, this would come from route params or context
  const clientId = 'demo-client-id';

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Anleggsmiddelforvaltning</h1>
          <p className="text-muted-foreground">
            Administrer anleggsmidler, avskrivninger og vedlikehold
          </p>
        </div>
        
        <AssetsList clientId={clientId} />
      </div>
    </div>
  );
}