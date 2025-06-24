
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
  RefreshCw
} from 'lucide-react';
import { KnowledgeSearchDiagnostics, SearchDiagnostic, KnowledgeBaseHealth } from '@/services/knowledge/searchDiagnostics';
import { toast } from 'sonner';

const SearchTestingPanel = () => {
  const [health, setHealth] = useState<KnowledgeBaseHealth | null>(null);
  const [diagnostics, setDiagnostics] = useState<SearchDiagnostic[]>([]);
  const [isRunningHealth, setIsRunningHealth] = useState(false);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [customQuery, setCustomQuery] = useState('');
  const [isTestingCustom, setIsTestingCustom] = useState(false);

  useEffect(() => {
    runHealthCheck();
  }, []);

  const runHealthCheck = async () => {
    setIsRunningHealth(true);
    try {
      const healthData = await KnowledgeSearchDiagnostics.runHealthCheck();
      setHealth(healthData);
      
      if (healthData.searchFunctionStatus === 'working') {
        toast.success('Knowledge base is healthy!');
      } else {
        toast.error('Knowledge base has issues');
      }
    } catch (error) {
      toast.error('Health check failed');
      console.error('Health check error:', error);
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
      toast.success(`Completed ${successCount}/${results.length} tests successfully`);
    } catch (error) {
      toast.error('Synthetic tests failed');
      console.error('Synthetic test error:', error);
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
        toast.success(`Query returned ${result.totalResults} results in ${result.responseTime}ms`);
      } else {
        toast.error('Query test failed');
      }
    } catch (error) {
      toast.error('Query test failed');
      console.error('Custom query test error:', error);
    } finally {
      setIsTestingCustom(false);
    }
  };

  const getHealthBadge = (status: string) => {
    switch (status) {
      case 'working':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Working</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
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
                Knowledge Base Health
              </CardTitle>
              <CardDescription>Current status and metrics</CardDescription>
            </div>
            <Button onClick={runHealthCheck} disabled={isRunningHealth} variant="outline">
              {isRunningHealth ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {health ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{health.totalArticles}</div>
                <div className="text-sm text-muted-foreground">Total Articles</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{health.publishedArticles}</div>
                <div className="text-sm text-muted-foreground">Published</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{health.articlesWithEmbeddings}</div>
                <div className="text-sm text-muted-foreground">With Embeddings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{getHealthBadge(health.searchFunctionStatus)}</div>
                <div className="text-sm text-muted-foreground">Search Status</div>
              </div>
              <div className="col-span-2 md:col-span-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Embedding Coverage</span>
                  <span className="text-sm">{Math.round(health.embeddingCoverage * 100)}%</span>
                </div>
                <Progress value={health.embeddingCoverage * 100} className="h-2" />
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Click refresh to check health status
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
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{metrics.avgResponseTime}ms</div>
                <div className="text-sm text-muted-foreground">Avg Response Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{metrics.successRate}%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{metrics.avgResults}</div>
                <div className="text-sm text-muted-foreground">Avg Results</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{metrics.totalTests}</div>
                <div className="text-sm text-muted-foreground">Total Tests</div>
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
              Synthetic Tests
            </CardTitle>
            <CardDescription>
              Run predefined queries to test search functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={runSyntheticTests} disabled={isRunningTests} className="w-full">
              {isRunningTests ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Synthetic Tests
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Custom Query Test
            </CardTitle>
            <CardDescription>
              Test search with your own query
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter test query..."
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
            <CardTitle>Recent Test Results</CardTitle>
            <CardDescription>Latest search diagnostics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {diagnostics.slice(0, 10).map((diagnostic, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{diagnostic.query}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{diagnostic.totalResults} results</Badge>
                      <Badge variant="secondary">{diagnostic.responseTime}ms</Badge>
                      {diagnostic.errors.length > 0 ? (
                        <Badge variant="destructive">Error</Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800">Success</Badge>
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
                    Semantic: {diagnostic.semanticResults} | Keyword: {diagnostic.keywordResults} | 
                    {' '}{new Date(diagnostic.timestamp).toLocaleTimeString()}
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
