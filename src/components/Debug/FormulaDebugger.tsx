import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFormulaCalculation } from '@/hooks/useFormulaCalculation';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { Play, Bug } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FormulaDebuggerProps {
  clientId?: string;
}

const FormulaDebugger: React.FC<FormulaDebuggerProps> = ({ clientId }) => {
  const [testFormula, setTestFormula] = useState('[19]');
  const [testClientId, setTestClientId] = useState(clientId || '8e5a5e79-8510-4e80-98a0-65e6548585ef');
  const { selectedFiscalYear } = useFiscalYear();
  const { toast } = useToast();
  
  const [shouldTest, setShouldTest] = useState(false);
  
  // Test basic formulas
  const testResult = useFormulaCalculation({
    clientId: testClientId,
    fiscalYear: selectedFiscalYear,
    customFormula: testFormula,
    enabled: shouldTest && !!testClientId && !!selectedFiscalYear
  });

  const runTest = () => {
    setShouldTest(true);
    toast({
      title: "Tester formel",
      description: `Beregner: ${testFormula}`
    });
  };

  const testCases = [
    { label: 'Sum driftsinntekter', formula: '[19]' },
    { label: 'Sum eiendeler', formula: '[665]' },
    { label: 'Enkelt tall', formula: '1000' },
    { label: 'Matematisk uttrykk', formula: '100 + 200' },
    { label: 'Standard linje 10', formula: '[10]' }
  ];

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Formula Debugger
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Manual test */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Klient ID</Label>
              <Input 
                value={testClientId}
                onChange={(e) => setTestClientId(e.target.value)}
                placeholder="Klient UUID"
              />
            </div>
            <div>
              <Label>Formel</Label>
              <Input 
                value={testFormula}
                onChange={(e) => setTestFormula(e.target.value)}
                placeholder="[19] eller [665]"
              />
            </div>
          </div>
          
          <Button onClick={runTest} className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Test formel
          </Button>

          {shouldTest && (
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Test resultat:</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Loading:</strong> {testResult.isLoading ? 'Ja' : 'Nei'}</div>
                <div><strong>Error:</strong> {testResult.error?.message || 'Ingen'}</div>
                <div><strong>Valid:</strong> {testResult.data?.isValid ? 'Ja' : 'Nei'}</div>
                <div><strong>Value:</strong> {testResult.data?.value ?? 'N/A'}</div>
                <div><strong>Formatted:</strong> {testResult.data?.formattedValue || 'N/A'}</div>
                <div><strong>Error message:</strong> {testResult.data?.error || 'Ingen'}</div>
                
                <details className="mt-4">
                  <summary className="cursor-pointer">Rådata</summary>
                  <pre className="mt-2 text-xs bg-background p-2 rounded overflow-auto">
                    {JSON.stringify(testResult.data, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          )}
        </div>

        {/* Quick tests */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Hurtigtester</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testCases.map((testCase, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{testCase.label}</div>
                    <div className="text-sm text-muted-foreground">{testCase.formula}</div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setTestFormula(testCase.formula);
                      setShouldTest(true);
                    }}
                  >
                    Test
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Debug info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div><strong>Current FY:</strong> {selectedFiscalYear}</div>
          <div><strong>Client ID:</strong> {testClientId}</div>
          <div><strong>Should test:</strong> {shouldTest ? 'Ja' : 'Nei'}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FormulaDebugger;