import { logger } from '@/utils/logger';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  Play, 
  TestTube, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Search,
  RefreshCw,
  Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { KnowledgeSearchDiagnostics, SearchDiagnostic, KnowledgeBaseHealth } from '@/services/knowledge/searchDiagnostics';
import { toast } from 'sonner';

const SearchTestingPanel = () => {
  const [health, setHealth] = useState<KnowledgeBaseHealth | null>(null);
  const [diagnostics, setDiagnostics] = useState<SearchDiagnostic[]>([]);
  const [isRunningHealth, setIsRunningHealth] = useState(false);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [customQuery, setCustomQuery] = useState('');
  const [isTestingCustom, setIsTestingCustom] = useState(false);
  const [rlsStatus, setRlsStatus] = useState<'checking' | 'ok' | 'error' | null>(null);

  useEffect(() => {
    runHealthCheck();
    checkRLSConfiguration();
  }, []);

  const checkRLSConfiguration = async () => {
    setRlsStatus('checking');
    try {
      // Test if we can access published articles without authentication
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select('id, title, status')
        .eq('status', 'published')
        .limit(1);
      
      if (error) {
        logger.error('❌ RLS configuration error:', error);
        setRlsStatus('error');
        toast.error('RLS-konfiguration har problemer');
      } else {
        logger.log('✅ RLS configuration OK, can access published articles');
        setRlsStatus('ok');
        if (data && data.length > 0) {
          toast.success('RLS-konfiguration er korrekt! Søk skal nå fungere.');
        }
      }
    } catch (error) {
      logger.error('❌ RLS test failed:', error);
      setRlsStatus('error');
    }
  };

  const runHealthCheck = async () => {
    setIsRunningHealth(true);
    try {
      const healthData = await KnowledgeSearchDiagnostics.runHealthCheck();
      setHealth(healthData);
      
      if (healthData.searchFunctionStatus === 'working') {
        toast.success('Kunnskapsbase er sunn og søk fungerer!');
      } else {
        toast.error('Kunnskapsbase har problemer');
      }
    } catch (error) {
      toast.error('Helsesjekk feilet');
      logger.error('Health check error:', error);
    } finally {
      setIsRunningHealth(false);
    }
  };

  const runSyntheticTests = async () => {
    setIsRunningTests(true);
    try {
      const results = await KnowledgeSearchDiagnostics.runSyntheticQueries();
      setDiagnostics(results);
      
      const successCount = results.filter(r => r.errors.length === 0).length;
      toast.success(`Fullført ${successCount}/${results.length} tester med suksess`);
    } catch (error) {
      toast.error('Syntetiske tester feilet');
      logger.error('Synthetic test error:', error);
    } finally {
      setIsRunningTests(false);
    }
  };

  const testCustomQuery = async () => {
    if (!customQuery.trim()) return;
    
    setIsTestingCustom(true);
    try {
      const result = await KnowledgeSearchDiagnostics.testSingleQuery(customQuery);
      setDiagnostics(prev => [result, ...prev.slice(0, 9)]); // Keep last 10
      
      if (result.errors.length === 0) {
        toast.success(`Søk returnerte ${result.totalResults} resultater på ${result.responseTime}ms`);
      } else {
        toast.error('Søketest feilet');
      }
    } catch (error) {
      toast.error('Søketest feilet');
      logger.error('Custom query test error:', error);
    } finally {
      setIsTestingCustom(false);
    }
  };

  const getHealthBadge = (status: string) => {
    switch (status) {
      case 'working':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Fungerer</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Feil</Badge>;
      default:
        return <Badge variant="secondary">Ukjent</Badge>;
    }
  };

  const getRLSBadge = () => {
    switch (rlsStatus) {
      case 'checking':
        return <Badge variant="secondary"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Sjekker...</Badge>;
      case 'ok':
        return <Badge className="bg-green-100 text-green-800"><Shield className="w-3 h-3 mr-1" />RLS OK</Badge>;
      case 'error':
        return <Badge variant="destructive"><Shield className="w-3 h-3 mr-1" />RLS Feil</Badge>;
      default:
        return <Badge variant="secondary">RLS Ukjent</Badge>;
    }
  };

  const metrics = KnowledgeSearchDiagnostics.getPerformanceMetrics();

  return (
    <div className="space-y-6">
      {/* Health Overview */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Kunnskapsbase Helse
              </CardTitle>
              <CardDescription>Nåværende status og målinger</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={checkRLSConfiguration} variant="outline" size="sm">
                Test RLS
              </Button>
              <Button onClick={runHealthCheck} disabled={isRunningHealth} variant="outline">
                {isRunningHealth ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Sjekker...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Oppdater
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {health ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{health.totalArticles}</div>
                <div className="text-sm text-muted-foreground">Totale Artikler</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{health.publishedArticles}</div>
                <div className="text-sm text-muted-foreground">Publiserte</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{health.articlesWithEmbeddings}</div>
                <div className="text-sm text-muted-foreground">Med Embeddings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{getHealthBadge(health.searchFunctionStatus)}</div>
                <div className="text-sm text-muted-foreground">Søkestatus</div>
              </div>
              <div className="col-span-2 md:col-span-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Embedding Dekning</span>
                  <span className="text-sm">{Math.round(health.embeddingCoverage * 100)}%</span>
                </div>
                <Progress value={health.embeddingCoverage * 100} className="h-2" />
              </div>
              <div className="col-span-2 md:col-span-4 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">RLS Konfigurasjon</span>
                  {getRLSBadge()}
                </div>
                {rlsStatus === 'ok' && (
                  <p className="text-xs text-green-600 mt-1">
                    ✅ Publiserte artikler kan nås uten autentisering - søk skal fungere!
                  </p>
                )}
                {rlsStatus === 'error' && (
                  <p className="text-xs text-red-600 mt-1">
                    ❌ RLS-policy blokkerer tilgang til publiserte artikler
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Klikk oppdater for å sjekke helsestatus
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Ytelsesmålinger
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{metrics.avgResponseTime}ms</div>
                <div className="text-sm text-muted-foreground">Snitt Responstid</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{metrics.successRate}%</div>
                <div className="text-sm text-muted-foreground">Suksessrate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{metrics.avgResults}</div>
                <div className="text-sm text-muted-foreground">Snitt Resultater</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{metrics.totalTests}</div>
                <div className="text-sm text-muted-foreground">Totale Tester</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Controls */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="w-5 h-5" />
              Syntetiske Tester
            </CardTitle>
            <CardDescription>
              Kjør forhåndsdefinerte søk for å teste søkefunksjonalitet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={runSyntheticTests} disabled={isRunningTests} className="w-full">
              {isRunningTests ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Kjører Tester...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Kjør Syntetiske Tester
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Tilpasset Søketest
            </CardTitle>
            <CardDescription>
              Test søk med ditt eget søkeord
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Skriv inn testsøk... (f.eks. 'ISA 315')"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && testCustomQuery()}
              />
              <Button onClick={testCustomQuery} disabled={isTestingCustom || !customQuery.trim()}>
                {isTestingCustom ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Results */}
      {diagnostics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Siste Testresultater</CardTitle>
            <CardDescription>Nyeste søkediagnostikk</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {diagnostics.slice(0, 10).map((diagnostic, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{diagnostic.query}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{diagnostic.totalResults} resultater</Badge>
                      <Badge variant="secondary">{diagnostic.responseTime}ms</Badge>
                      {diagnostic.errors.length > 0 ? (
                        <Badge variant="destructive">Feil</Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800">Suksess</Badge>
                      )}
                    </div>
                  </div>
                  {diagnostic.errors.length > 0 && (
                    <div className="text-sm text-red-600 mt-1">
                      {diagnostic.errors.join(', ')}
                    </div>
                  )}
                  {diagnostic.warnings.length > 0 && (
                    <div className="text-sm text-yellow-600 mt-1">
                      {diagnostic.warnings.join(', ')}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    Semantisk: {diagnostic.semanticResults} | Nøkkelord: {diagnostic.keywordResults} | 
                    {' '}{new Date(diagnostic.timestamp).toLocaleTimeString('nb-NO')}
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

export default SearchTestingPanel;
