import { BudgetsList } from '@/components/budget/BudgetsList';

export default function BudgetManagement() {
  // For demo purposes, using a placeholder client ID
  // In real implementation, this would come from route params or context
  const clientId = 'demo-client-id';

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Budsjettplanlegging</h1>
          <p className="text-muted-foreground">
            Opprett og administrer budsjetter, sammenlign faktiske tall og lag prognoser
          </p>
        </div>
        
        <BudgetsList clientId={clientId} />
      </div>
    </div>
  );
}