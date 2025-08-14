import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Brain, 
  Search, 
  TrendingUp, 
  AlertTriangle, 
  Network, 
  Target,
  FileText,
  BarChart3,
  Zap,
  Eye,
  Filter
} from 'lucide-react';
import { SmartDocumentIntelligence } from './SmartDocumentIntelligence';
import { 
  enhancedSemanticSearchService,
  type EnhancedSearchQuery,
  type EnhancedSearchResult,
  type SemanticInsight
} from '@/services/documentSearch/enhancedSemanticSearchService';
import { useClientDocuments } from '@/hooks/useClientDocuments';

interface DocumentIntelligenceDashboardProps {
  clientId: string;
}

export function DocumentIntelligenceDashboard({ clientId }: DocumentIntelligenceDashboardProps) {
  const { documents, isLoading } = useClientDocuments(clientId);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<EnhancedSearchResult[]>([]);
  const [semanticInsights, setSemanticInsights] = useState<SemanticInsight[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.5);
  const [activeTab, setActiveTab] = useState('overview');

  // Load semantic insights on component mount
  useEffect(() => {
    loadSemanticInsights();
  }, [clientId]);

  const loadSemanticInsights = async () => {
    setIsLoadingInsights(true);
    try {
      const insights = await enhancedSemanticSearchService.generateSemanticInsights(clientId);
      setSemanticInsights(insights);
    } catch (error) {
      console.error('Failed to load semantic insights:', error);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const performEnhancedSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const query: EnhancedSearchQuery = {
        term: searchQuery,
        clientId,
        categories: selectedCategory !== 'all' ? [selectedCategory] : undefined,
        confidenceThreshold,
        semanticSimilarityThreshold: 0.7,
        includeAuditImplications: true
      };

      const results = await enhancedSemanticSearchService.performEnhancedSearch(query);
      setSearchResults(results);
      setActiveTab('search');
    } catch (error) {
      console.error('Enhanced search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Calculate dashboard metrics
  const dashboardMetrics = React.useMemo(() => {
    const totalDocs = documents.length;
    const aiProcessedDocs = documents.filter(doc => doc.ai_analysis_summary).length;
    const categorizedDocs = documents.filter(doc => doc.ai_suggested_category).length;
    const highConfidenceDocs = documents.filter(doc => 
      doc.ai_confidence_score && doc.ai_confidence_score > 0.8
    ).length;
    const riskDocuments = documents.filter(doc => 
      doc.ai_isa_standard_references && doc.ai_isa_standard_references.length > 0
    ).length;

    return {
      totalDocuments: totalDocs,
      aiProcessingRate: totalDocs > 0 ? (aiProcessedDocs / totalDocs) * 100 : 0,
      categorizationRate: totalDocs > 0 ? (categorizedDocs / totalDocs) * 100 : 0,
      confidenceRate: totalDocs > 0 ? (highConfidenceDocs / totalDocs) * 100 : 0,
      riskDocumentsCount: riskDocuments,
      qualityScore: totalDocs > 0 ? 
        ((aiProcessedDocs * 0.3 + categorizedDocs * 0.4 + highConfidenceDocs * 0.3) / totalDocs) * 100 : 0
    };
  }, [documents]);

  // Get unique categories for filtering
  const availableCategories = React.useMemo(() => {
    const categories = documents
      .map(doc => doc.ai_suggested_category)
      .filter(Boolean)
      .filter((category, index, arr) => arr.indexOf(category) === index);
    return ['all', ...categories];
  }, [documents]);

  // Insight severity counts
  const insightCounts = React.useMemo(() => {
    return {
      high: semanticInsights.filter(insight => insight.severity === 'high').length,
      medium: semanticInsights.filter(insight => insight.severity === 'medium').length,
      low: semanticInsights.filter(insight => insight.severity === 'low').length,
      actionable: semanticInsights.filter(insight => insight.actionable).length
    };
  }, [semanticInsights]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-8 bg-muted rounded animate-pulse w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dokumentintelligens Dashboard</h1>
          <p className="text-muted-foreground">
            AI-drevet analyse og innsikt i dine dokumenter
          </p>
        </div>
        <Button onClick={loadSemanticInsights} disabled={isLoadingInsights}>
          <Brain className="h-4 w-4 mr-2" />
          {isLoadingInsights ? 'Oppdaterer...' : 'Oppdater innsikter'}
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Totale dokumenter</p>
                <p className="text-2xl font-bold">{dashboardMetrics.totalDocuments}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">AI-prosessering</p>
                <p className="text-2xl font-bold">{Math.round(dashboardMetrics.aiProcessingRate)}%</p>
              </div>
              <Brain className="h-8 w-8 text-blue-500" />
            </div>
            <Progress value={dashboardMetrics.aiProcessingRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Kvalitetsscore</p>
                <p className="text-2xl font-bold">{Math.round(dashboardMetrics.qualityScore)}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-500" />
            </div>
            <Progress value={dashboardMetrics.qualityScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Risikodokumenter</p>
                <p className="text-2xl font-bold">{dashboardMetrics.riskDocumentsCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Avansert semantisk søk
          </CardTitle>
          <CardDescription>
            Søk gjennom dokumenter med AI-drevet semantisk forståelse
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Skriv inn søkeord eller beskrivelse..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && performEnhancedSearch()}
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Velg kategori" />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'Alle kategorier' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={performEnhancedSearch} 
              disabled={isSearching || !searchQuery.trim()}
            >
              <Search className="h-4 w-4 mr-2" />
              {isSearching ? 'Søker...' : 'Søk'}
            </Button>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span>Konfidensgrad minimum:</span>
              <span className="font-medium">{Math.round(confidenceThreshold * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
              className="w-24"
            />
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Oversikt
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Søkeresultater
            {searchResults.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {searchResults.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Innsikter
            {insightCounts.actionable > 0 && (
              <Badge variant="destructive" className="ml-1">
                {insightCounts.actionable}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="intelligence" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Smart analyse
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Processing Status */}
            <Card>
              <CardHeader>
                <CardTitle>Prosesseringsstatus</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Kategoriserte dokumenter</span>
                    <span>{Math.round(dashboardMetrics.categorizationRate)}%</span>
                  </div>
                  <Progress value={dashboardMetrics.categorizationRate} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Høy konfidensgrad</span>
                    <span>{Math.round(dashboardMetrics.confidenceRate)}%</span>
                  </div>
                  <Progress value={dashboardMetrics.confidenceRate} />
                </div>
              </CardContent>
            </Card>

            {/* Insight Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Innsiktsoversikt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full" />
                      <span className="text-sm">Høy prioritet</span>
                    </div>
                    <p className="text-2xl font-bold">{insightCounts.high}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full" />
                      <span className="text-sm">Middels prioritet</span>
                    </div>
                    <p className="text-2xl font-bold">{insightCounts.medium}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      <span className="text-sm">Lav prioritet</span>
                    </div>
                    <p className="text-2xl font-bold">{insightCounts.low}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3 h-3 text-blue-500" />
                      <span className="text-sm">Handlingsrike</span>
                    </div>
                    <p className="text-2xl font-bold">{insightCounts.actionable}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="search" className="space-y-6">
          {searchResults.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Søkeresultater ({searchResults.length})
                </h3>
                <Badge variant="outline">
                  Søkte etter: "{searchQuery}"
                </Badge>
              </div>
              
              {searchResults.map((result) => (
                <Card key={result.documentId}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-medium">{result.fileName}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{result.category}</Badge>
                            <Badge variant={
                              result.riskLevel === 'high' ? 'destructive' :
                              result.riskLevel === 'medium' ? 'default' : 'secondary'
                            }>
                              {result.riskLevel === 'high' ? 'Høy risiko' :
                               result.riskLevel === 'medium' ? 'Middels risiko' : 'Lav risiko'}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {result.matchType} match
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-right space-y-1">
                          <div className="text-sm font-medium">
                            Relevans: {Math.round(result.relevanceScore * 100)}%
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Konfidensgrad: {Math.round(result.confidence * 100)}%
                          </div>
                        </div>
                      </div>
                      
                      {result.excerpts.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium">Relevante utdrag:</h5>
                          {result.excerpts.map((excerpt, index) => (
                            <blockquote key={index} className="border-l-4 border-muted pl-4 text-sm italic">
                              {excerpt}
                            </blockquote>
                          ))}
                        </div>
                      )}
                      
                      {result.auditImplications.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium">Revisjonsimplikasjoner:</h5>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {result.auditImplications.map((implication, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <Target className="h-3 w-3 mt-1 text-orange-500" />
                                {implication}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">Ingen søkeresultater</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Utfør et søk for å se resultater her
                </p>
                <Button variant="outline" onClick={() => setSearchQuery('')}>
                  Prøv et nytt søk
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {semanticInsights.length > 0 ? (
            <div className="space-y-4">
              {semanticInsights.map((insight, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {insight.type === 'pattern' && <TrendingUp className="h-5 w-5 text-blue-500" />}
                        {insight.type === 'anomaly' && <AlertTriangle className="h-5 w-5 text-orange-500" />}
                        {insight.type === 'relationship' && <Network className="h-5 w-5 text-green-500" />}
                        {insight.type === 'trend' && <BarChart3 className="h-5 w-5 text-purple-500" />}
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{insight.title}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              insight.severity === 'high' ? 'destructive' :
                              insight.severity === 'medium' ? 'default' : 'secondary'
                            }>
                              {insight.severity === 'high' ? 'Høy' :
                               insight.severity === 'medium' ? 'Middels' : 'Lav'}
                            </Badge>
                            {insight.actionable && (
                              <Badge variant="outline">
                                <Zap className="h-3 w-3 mr-1" />
                                Handlingsrik
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">{insight.description}</p>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Konfidensgrad: {Math.round(insight.confidence * 100)}%</span>
                          <span>{insight.relatedDocuments.length} relaterte dokumenter</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                {isLoadingInsights ? (
                  <div className="space-y-4">
                    <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground">Genererer innsikter...</p>
                  </div>
                ) : (
                  <>
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">Ingen innsikter tilgjengelig</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Last opp og analyser flere dokumenter for å få AI-genererte innsikter
                    </p>
                    <Button variant="outline" onClick={loadSemanticInsights}>
                      Last inn innsikter
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="intelligence">
          <SmartDocumentIntelligence clientId={clientId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}