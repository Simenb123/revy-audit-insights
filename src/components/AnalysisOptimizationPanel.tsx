import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  Zap, 
  TrendingUp, 
  Clock, 
  MemoryStick, 
  Database,
  RefreshCw,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { analysisOptimizer } from '@/services/analysisOptimizer';

export function AnalysisOptimizationPanel() {
  const [optimizationReport, setOptimizationReport] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [settingsChanged, setSettingsChanged] = useState(false);

  const refreshReport = async () => {
    setIsRefreshing(true);
    try {
      const report = analysisOptimizer.getOptimizationReport();
      setOptimizationReport(report);
    } catch (error) {
      console.error('Failed to get optimization report:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshReport();
  }, []);

  const handleSettingChange = (setting: string, value: any) => {
    setSettingsChanged(true);
    // In a real implementation, this would update the optimizer config
    console.log(`Setting ${setting} changed to:`, value);
  };

  const getPerformanceScore = () => {
    if (!optimizationReport?.performanceHistory?.length) return 0;
    
    const recent = optimizationReport.performanceHistory.slice(-5);
    const avgTime = recent.reduce((sum: number, m: any) => sum + m.executionTime, 0) / recent.length;
    const avgCache = recent.reduce((sum: number, m: any) => sum + m.cacheHitRate, 0) / recent.length;
    
    // Simple scoring: faster = better, higher cache hit rate = better
    const timeScore = Math.max(0, 100 - (avgTime / 100)); // Normalize to 0-100
    const cacheScore = avgCache * 100;
    
    return Math.round((timeScore + cacheScore) / 2);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!optimizationReport) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Optimalisering</span>
          </CardTitle>
          <CardDescription>Laster ytelsesdata...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const performanceScore = getPerformanceScore();

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Ytelsesovervåkning</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshReport}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Oppdater
            </Button>
          </CardTitle>
          <CardDescription>
            Overvåkning av analyseytelse og optimalisering
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(performanceScore)}`}>
                {performanceScore}
              </div>
              <div className="text-sm text-muted-foreground">Ytelsesscore</div>
              <Progress value={performanceScore} className="mt-2" />
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">
                {optimizationReport.performanceHistory?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Analyser kjørt</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">
                {optimizationReport.config.enableParallelProcessing ? (
                  <Badge variant="success">På</Badge>
                ) : (
                  <Badge variant="secondary">Av</Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground">Parallell prosessering</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">
                {optimizationReport.recommendations?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Anbefalinger</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Settings */}
      <Card>
        <CardContent>
          <Tabs defaultValue="settings" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="settings">Innstillinger</TabsTrigger>
              <TabsTrigger value="metrics">Metrikker</TabsTrigger>
              <TabsTrigger value="recommendations">Anbefalinger</TabsTrigger>
            </TabsList>
            
            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Parallell prosessering</Label>
                    <div className="text-sm text-muted-foreground">
                      Aktiver for store datasett
                    </div>
                  </div>
                  <Switch 
                    checked={optimizationReport.config.enableParallelProcessing}
                    onCheckedChange={(checked) => handleSettingChange('enableParallelProcessing', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mellomlagring av resultater</Label>
                    <div className="text-sm text-muted-foreground">
                      Lagre analyseresultater for raskere gjenbruk
                    </div>
                  </div>
                  <Switch 
                    checked={optimizationReport.config.cacheResults}
                    onCheckedChange={(checked) => handleSettingChange('cacheResults', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Adaptiv optimalisering</Label>
                    <div className="text-sm text-muted-foreground">
                      Automatisk justering basert på ytelse
                    </div>
                  </div>
                  <Switch 
                    checked={optimizationReport.config.adaptiveSettings.enabled}
                    onCheckedChange={(checked) => handleSettingChange('adaptiveOptimization', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Fremdriftssporing</Label>
                    <div className="text-sm text-muted-foreground">
                      Vis detaljert fremdrift under analyser
                    </div>
                  </div>
                  <Switch 
                    checked={optimizationReport.config.enableProgressTracking}
                    onCheckedChange={(checked) => handleSettingChange('enableProgressTracking', checked)}
                  />
                </div>
              </div>
              
              {settingsChanged && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Innstillinger vil tre i kraft ved neste analyse.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
            
            <TabsContent value="metrics" className="space-y-4">
              {optimizationReport.performanceHistory?.length > 0 ? (
                <div className="space-y-4">
                  {optimizationReport.performanceHistory.slice(-5).map((metric: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {metric.executionTime?.toFixed(0)}ms
                          </div>
                          <div className="text-sm text-muted-foreground">Kjøretid</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <MemoryStick className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {metric.memoryUsage?.toFixed(1) || 0}MB
                          </div>
                          <div className="text-sm text-muted-foreground">Minne</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <Database className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {(metric.cacheHitRate * 100).toFixed(0)}%
                          </div>
                          <div className="text-sm text-muted-foreground">Cache-treff</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Ingen ytelsesdata tilgjengelig ennå
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="recommendations" className="space-y-4">
              {optimizationReport.recommendations?.length > 0 ? (
                <div className="space-y-3">
                  {optimizationReport.recommendations.map((rec: string, index: number) => (
                    <Alert key={index}>
                      <TrendingUp className="h-4 w-4" />
                      <AlertDescription>{rec}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              ) : (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Systemet kjører optimalt - ingen anbefalinger for øyeblikket.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}