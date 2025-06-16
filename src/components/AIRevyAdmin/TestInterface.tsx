
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, RefreshCw, Eye, Clock } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import SmartRevyAssistant from '@/components/Revy/SmartRevyAssistant';

const TestInterface = () => {
  const [testMessage, setTestMessage] = useState('');
  const [testContext, setTestContext] = useState('general');
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [presetTests] = useState([
    {
      name: 'ISA 315 Søk',
      message: 'Hva sier ISA 315 om risikovurdering?',
      context: 'risk-assessment',
      expectedKeywords: ['ISA 315', 'risikovurdering', 'iboende risiko']
    },
    {
      name: 'Revisjonshandlinger',
      message: 'Hvilke revisjonshandlinger anbefaler du for inntekter?',
      context: 'general',
      expectedKeywords: ['inntekter', 'revisjonshandlinger', 'analytiske']
    },
    {
      name: 'Dokumentasjon',
      message: 'Hvordan dokumentere revisjonsarbeid?',
      context: 'documentation',
      expectedKeywords: ['dokumentasjon', 'ISA 230', 'arbeidspapirer']
    }
  ]);
  const { toast } = useToast();

  const runTest = async (message: string, context: string, expectedKeywords?: string[]) => {
    setIsLoading(true);
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('revy-ai-chat', {
        body: {
          message,
          context,
          userId: (await supabase.auth.getUser()).data.user?.id,
          history: []
        }
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (error) throw error;

      const result = {
        id: Date.now(),
        message,
        context,
        response: data.response,
        responseTime,
        timestamp: new Date(),
        expectedKeywords,
        model: data.model,
        usage: data.usage,
        fromCache: data.fromCache || false,
        knowledgeUsed: data.response.includes('artikkel') || data.response.includes('ISA')
      };

      setTestResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results

      toast({
        title: "Test fullført",
        description: `Responstid: ${responseTime}ms`
      });

    } catch (error) {
      toast({
        title: "Test feilet",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runPresetTest = (preset: any) => {
    runTest(preset.message, preset.context, preset.expectedKeywords);
  };

  const runAllPresetTests = async () => {
    for (const preset of presetTests) {
      await runTest(preset.message, preset.context, preset.expectedKeywords);
      // Wait a bit between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const checkKeywords = (response: string, keywords: string[]) => {
    if (!keywords) return null;
    
    const found = keywords.filter(keyword => 
      response.toLowerCase().includes(keyword.toLowerCase())
    );
    
    return {
      found: found.length,
      total: keywords.length,
      percentage: Math.round((found.length / keywords.length) * 100)
    };
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="manual" className="space-y-4">
        <TabsList>
          <TabsTrigger value="manual">Manuell test</TabsTrigger>
          <TabsTrigger value="presets">Forhåndsdefinerte tester</TabsTrigger>
          <TabsTrigger value="live">Live test</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manuell AI-test</CardTitle>
              <CardDescription>
                Test AI-Revy med egendefinerte meldinger og kontekster
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Testmelding</label>
                <Textarea
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Skriv inn en testmelding..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Kontekst</label>
                <Select value={testContext} onValueChange={setTestContext}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Generell</SelectItem>
                    <SelectItem value="risk-assessment">Risikovurdering</SelectItem>
                    <SelectItem value="documentation">Dokumentasjon</SelectItem>
                    <SelectItem value="client-detail">Klientdetaljer</SelectItem>
                    <SelectItem value="collaboration">Samarbeid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={() => runTest(testMessage, testContext)}
                disabled={!testMessage.trim() || isLoading}
                className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                {isLoading ? 'Tester...' : 'Kjør test'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="presets" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Forhåndsdefinerte tester</CardTitle>
                  <CardDescription>
                    Kjør standardiserte tester for å validere AI-funksjonalitet
                  </CardDescription>
                </div>
                <Button onClick={runAllPresetTests} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Kjør alle tester
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {presetTests.map((preset, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{preset.name}</h3>
                      <p className="text-sm text-muted-foreground">{preset.message}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{preset.context}</Badge>
                        <Badge variant="secondary">{preset.expectedKeywords.length} nøkkelord</Badge>
                      </div>
                    </div>
                    <Button 
                      onClick={() => runPresetTest(preset)}
                      disabled={isLoading}
                      variant="outline"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="live" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live test-miljø</CardTitle>
              <CardDescription>
                Test AI-Revy i sanntid med full funksjonalitet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[600px] border rounded-lg">
                <SmartRevyAssistant embedded={true} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Testresultater</CardTitle>
            <CardDescription>Siste {testResults.length} tester</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((result: any) => (
                <div key={result.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">Test: {result.message.substring(0, 50)}...</h3>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline">{result.context}</Badge>
                        <Badge variant={result.fromCache ? 'secondary' : 'default'}>
                          {result.fromCache ? 'Cache' : result.model}
                        </Badge>
                        {result.knowledgeUsed && (
                          <Badge className="bg-green-100 text-green-800">Kunnskap brukt</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {result.responseTime}ms
                      </div>
                      <div>{result.timestamp.toLocaleTimeString('no-NO')}</div>
                    </div>
                  </div>
                  
                  {result.expectedKeywords && (
                    <div className="mb-2">
                      {(() => {
                        const keywordCheck = checkKeywords(result.response, result.expectedKeywords);
                        return keywordCheck && (
                          <Badge 
                            variant={keywordCheck.percentage >= 70 ? "default" : "destructive"}
                          >
                            Nøkkelord: {keywordCheck.found}/{keywordCheck.total} ({keywordCheck.percentage}%)
                          </Badge>
                        );
                      })()}
                    </div>
                  )}
                  
                  <div className="bg-muted p-3 rounded text-sm">
                    {result.response.substring(0, 200)}
                    {result.response.length > 200 && '...'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TestInterface;
