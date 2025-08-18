import React from 'react';
import { Button } from '@/components/ui/button';
import { useAIAnalysisSessions } from '@/hooks/useAIAnalysisSessions';
import { toast } from 'sonner';
import { Brain } from 'lucide-react';

interface AIAnalysisTestButtonProps {
  clientId: string;
  selectedVersion?: string;
}

export const AIAnalysisTestButton: React.FC<AIAnalysisTestButtonProps> = ({
  clientId,
  selectedVersion
}) => {
  const { createSession } = useAIAnalysisSessions();

  const handleTestAnalysis = async () => {
    try {
      const session = await createSession.mutateAsync({
        clientId,
        dataVersionId: selectedVersion,
        sessionType: 'ai_transaction_analysis',
        analysisConfig: {
          analysisType: 'comprehensive',
          includeRiskAnalysis: true,
          includeAnomalyDetection: true,
          testMode: true
        }
      });

      toast.success(`Test analyse startet med session ID: ${session.id}`);
    } catch (error) {
      console.error('Error starting test analysis:', error);
      toast.error('Kunne ikke starte test analyse');
    }
  };

  return (
    <Button 
      onClick={handleTestAnalysis} 
      disabled={createSession.isPending}
      variant="outline"
      size="sm"
    >
      <Brain className="h-4 w-4 mr-2" />
      Test AI-analyse
    </Button>
  );
};