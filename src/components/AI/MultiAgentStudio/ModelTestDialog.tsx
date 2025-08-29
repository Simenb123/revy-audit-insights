import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, TestTube } from 'lucide-react';

interface ModelTestResult {
  success: boolean;
  status: number;
  model: string;
  content: string | null;
  error: any;
}

export const ModelTestDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState('gpt-5-mini-2025-08-07');
  const [prompt, setPrompt] = useState('Test message - please respond with "OK"');
  const [result, setResult] = useState<ModelTestResult | null>(null);
  const { toast } = useToast();

  const testModel = async () => {
    if (!model.trim()) {
      toast({
        title: "Feil",
        description: "Vennligst skriv inn et modellnavn",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('revy-model-test', {
        body: { model, prompt },
      });
      
      if (error) throw error;
      
      setResult(data);
      
      if (data.success) {
        toast({
          title: "Test vellykket",
          description: `Modell ${model} fungerer korrekt`,
          variant: "default",
        });
      } else {
        toast({
          title: "Test feilet",
          description: `Modell ${model}: ${data.error}`,
          variant: "destructive",
        });
      }
    } catch (e: any) {
      console.error('Model test error:', e);
      toast({
        title: "Test feilet",
        description: e.message || 'Ukjent feil ved testing av modell',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <TestTube className="w-4 h-4 mr-2" />
          Test AI-modeller
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Test AI-modeller</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="model">Modellnavn</Label>
            <Input
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="gpt-5-mini-2025-08-07"
            />
          </div>
          
          <div>
            <Label htmlFor="prompt">Test-prompt</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Test message - please respond with OK"
              rows={3}
            />
          </div>
          
          <Button onClick={testModel} disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Test modell
          </Button>
          
          {result && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Test-resultat:</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Status:</strong> {result.success ? '✅ Vellykket' : '❌ Feilet'}
                </div>
                <div>
                  <strong>HTTP Status:</strong> {result.status}
                </div>
                <div>
                  <strong>Modell:</strong> {result.model}
                </div>
                {result.content && (
                  <div>
                    <strong>Svar:</strong>
                    <pre className="mt-1 p-2 bg-background border rounded text-xs overflow-auto">
                      {result.content}
                    </pre>
                  </div>
                )}
                {result.error && (
                  <div>
                    <strong>Feilmelding:</strong>
                    <pre className="mt-1 p-2 bg-destructive/10 border rounded text-xs overflow-auto">
                      {JSON.stringify(result.error, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};