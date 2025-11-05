import { BudgetsList } from '@/components/budget/BudgetsList';
import PageLayout from '@/components/Layout/PageLayout';

export default function BudgetManagement() {
  // For demo purposes, using a placeholder client ID
  // In real implementation, this would come from route params or context
  const clientId = 'demo-client-id';

  return (
    <PageLayout width="wide" spacing="normal">
      <div>
        <h1 className="text-3xl font-bold">Budsjettplanlegging</h1>
        <p className="text-muted-foreground">
          Opprett og administrer budsjetter, sammenlign faktiske tall og lag prognoser
        </p>
      </div>
      
      <BudgetsList clientId={clientId} />
    </PageLayout>
  );
}