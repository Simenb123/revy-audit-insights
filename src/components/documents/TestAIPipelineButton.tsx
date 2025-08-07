import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Beaker, Loader2 } from 'lucide-react';

interface TestAIPipelineButtonProps {
  documentId: string;
  fileName: string;
}

export const TestAIPipelineButton = ({ documentId, fileName }: TestAIPipelineButtonProps) => {
  const [isTesting, setIsTesting] = useState(false);
  const { toast } = useToast();

  const testAIPipeline = async () => {
    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-ai-pipeline', {
        body: { testDocumentId: documentId }
      });

      if (error) {
        throw error;
      }

      console.log('🧪 AI Pipeline Test Results:', data);

      toast({
        title: "AI Pipeline Test Utført",
        description: `Test av "${fileName}" fullført. Sjekk konsollen for detaljer.`,
      });

    } catch (error: any) {
      console.error('❌ AI Pipeline Test Error:', error);
      toast({
        title: "AI Pipeline Test Feilet",
        description: error.message || "Ukjent feil oppstod",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Button
      onClick={testAIPipeline}
      disabled={isTesting}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {isTesting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Beaker className="h-4 w-4" />
      )}
      Test AI
    </Button>
  );
};