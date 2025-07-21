import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Brain, Search, TestTube, CheckCircle, AlertTriangle, Zap } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TestResult {
  query: string;
  results: any[];
  success: boolean;
  response_time: number;
  metadata: {
    search_type: string;
    categories_found: string[];
    total_matches: number;
  };
}

export function AIRevyIntegrationPanel() {
  const [testQuery, setTestQuery] = useState('');
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const { data: categoryStats } = useQuery({
    queryKey: ['categoryStats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unified_categories')
        .select('category_type')
        .eq('is_active', true);
      
      if (error) throw error;
      
      const stats = data.reduce((acc, cat) => {
        acc[cat.category_type] = (acc[cat.category_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      return stats;
    }
  });

  const testSearchMutation = useMutation({
    mutationFn: async (query: string) => {
      const startTime = Date.now();
      
      try {
        // Test knowledge search
        const response = await fetch('https://fxelhfwaoizqyecikscu.supabase.co/functions/v1/knowledge-search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            query,
            test_mode: true // Flag for testing 
          })
        });

        const results = await response.json();
        const endTime = Date.now();

        const testResult: TestResult = {
          query,
          results: results.results || [],
          success: response.ok,
          response_time: endTime - startTime,
          metadata: {
            search_type: results.search_type || 'unknown',
            categories_found: results.categories_found || [],
            total_matches: results.total_matches || 0
          }
        };

        return testResult;
      } catch (error) {
        const endTime = Date.now();
        return {
          query,
          results: [],
          success: false,
          response_time: endTime - startTime,
          metadata: {
            search_type: 'error',
            categories_found: [],
            total_matches: 0
          }
        };
      }
    },
    onSuccess: (result) => {
      setTestResults(prev => [result, ...prev.slice(0, 4)]); // Keep last 5 results
      if (result.success) {
        toast.success(`Søk fullført på ${result.response_time}ms`);
      } else {
        toast.error('Søk feilet');
      }
    }
  });

  const runTestSuite = async () => {
    const testQueries = [
      'ISA 315 risikovurdering',
      'revisjonshandlinger for varelager',
      'hvitvaskingskontroll små foretak',
      'regnskapsregler for avskrivninger',
      'dokumentasjon av revisjonsarbeid'
    ];

    toast.info('Kjører testsuite...');
    
    for (const query of testQueries) {
      await testSearchMutation.mutateAsync(query);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    toast.success('Testsuite fullført');
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-red-500" />
    );
  };

  const getResponseTimeColor = (time: number) => {
    if (time < 1000) return 'text-green-600';
    if (time < 3000) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">AI-Revy integrasjon</h2>
        <p className="text-muted-foreground">
          Test og optimaliser AI-søk med den nye kategoristrukturen
        </p>
      </div>

      {/* Statistics */}
      {categoryStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Fagområder</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {categoryStats.subject_area || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Prosesser</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {categoryStats.process || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Regelverk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {categoryStats.compliance || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Totalt aktive</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.values(categoryStats).reduce((sum, count) => sum + count, 0)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Test Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-søk testing
          </CardTitle>
          <CardDescription>
            Test hvordan endringer i kategoristrukturen påvirker AI-søk
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Skriv inn en testspørring..."
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && testQuery.trim()) {
                    testSearchMutation.mutate(testQuery.trim());
                  }
                }}
              />
            </div>
            <Button
              onClick={() => testSearchMutation.mutate(testQuery.trim())}
              disabled={!testQuery.trim() || testSearchMutation.isPending}
            >
              <Search className="h-4 w-4 mr-2" />
              Test søk
            </Button>
            <Button
              onClick={runTestSuite}
              disabled={testSearchMutation.isPending}
              variant="outline"
            >
              <TestTube className="h-4 w-4 mr-2" />
              Kjør testsuite
            </Button>
          </div>

          {testSearchMutation.isPending && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Zap className="h-4 w-4 animate-pulse" />
              Kjører søk...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test resultater</CardTitle>
            <CardDescription>
              Siste {testResults.length} søk med ytelse og kategorisering
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.success)}
                      <span className="font-medium">{result.query}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className={getResponseTimeColor(result.response_time)}>
                        {result.response_time}ms
                      </span>
                      <Badge variant="outline">
                        {result.metadata.total_matches} treff
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Søketype:</span>
                      <Badge variant="secondary" className="ml-2">
                        {result.metadata.search_type}
                      </Badge>
                    </div>
                    
                    {result.metadata.categories_found.length > 0 && (
                      <div>
                        <span className="text-muted-foreground">Kategorier funnet:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {result.metadata.categories_found.slice(0, 3).map((cat, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {cat}
                            </Badge>
                          ))}
                          {result.metadata.categories_found.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{result.metadata.categories_found.length - 3} flere
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {result.results.length > 0 && (
                    <div className="mt-3">
                      <span className="text-sm text-muted-foreground">
                        Topp resultater:
                      </span>
                      <div className="mt-1 space-y-1">
                        {result.results.slice(0, 2).map((res, i) => (
                          <div key={i} className="text-sm text-muted-foreground truncate">
                            • {res.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}