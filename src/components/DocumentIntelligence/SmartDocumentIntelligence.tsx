import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, FileText, Target, AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react';
import { useClientDocuments } from '@/hooks/useClientDocuments';
import { useAdvancedDocumentAI } from '@/hooks/useAdvancedDocumentAI';
import { useDocumentSearch } from '@/hooks/useDocumentSearch';

interface SmartDocumentIntelligenceProps {
  clientId: string;
}

export function SmartDocumentIntelligence({ clientId }: SmartDocumentIntelligenceProps) {
  const { documents, isLoading, documentsCount } = useClientDocuments(clientId);
  const { analyzeDocument, isAnalyzing } = useAdvancedDocumentAI();
  const { search, isSearching, searchResults, suggestions, loadSuggestions } = useDocumentSearch(clientId);
  
  const [analyzedDocuments, setAnalyzedDocuments] = useState(0);
  const [riskAssessments, setRiskAssessments] = useState<Array<{
    documentId: string;
    riskLevel: 'low' | 'medium' | 'high';
    factors: string[];
  }>>([]);

  // Load search suggestions on mount
  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  // Calculate intelligence metrics
  const intelligenceMetrics = React.useMemo(() => {
    const totalDocs = documents.length;
    const categorizedDocs = documents.filter(doc => doc.ai_suggested_category).length;
    const highConfidenceDocs = documents.filter(doc => 
      doc.ai_confidence_score && doc.ai_confidence_score > 0.8
    ).length;
    const auditRelevantDocs = documents.filter(doc => 
      doc.ai_isa_standard_references && doc.ai_isa_standard_references.length > 0
    ).length;

    return {
      categorizationRate: totalDocs > 0 ? (categorizedDocs / totalDocs) * 100 : 0,
      confidenceRate: totalDocs > 0 ? (highConfidenceDocs / totalDocs) * 100 : 0,
      auditRelevanceRate: totalDocs > 0 ? (auditRelevantDocs / totalDocs) * 100 : 0,
      totalProcessed: categorizedDocs,
      totalDocuments: totalDocs
    };
  }, [documents]);

  // Enhanced document categories with AI insights
  const enhancedCategories = React.useMemo(() => {
    const categoryMap = new Map();
    
    documents.forEach(doc => {
      if (doc.ai_suggested_category) {
        const category = doc.ai_suggested_category;
        if (!categoryMap.has(category)) {
          categoryMap.set(category, {
            name: category,
            count: 0,
            avgConfidence: 0,
            riskLevel: 'low',
            documents: []
          });
        }
        
        const cat = categoryMap.get(category);
        cat.count += 1;
        cat.documents.push(doc);
        
        // Calculate average confidence
        const confidenceSum = cat.documents.reduce((sum: number, d: any) => 
          sum + (d.ai_confidence_score || 0), 0
        );
        cat.avgConfidence = confidenceSum / cat.documents.length;
        
        // Determine risk level based on standard references
        const hasHighRiskImplications = cat.documents.some((d: any) => 
          d.ai_isa_standard_references?.some((ref: string) => 
            ref.toLowerCase().includes('risk') || 
            ref.toLowerCase().includes('compliance')
          )
        );
        
        if (hasHighRiskImplications) {
          cat.riskLevel = cat.avgConfidence > 0.8 ? 'high' : 'medium';
        }
      }
    });
    
    return Array.from(categoryMap.values()).sort((a, b) => b.count - a.count);
  }, [documents]);

  // AI-driven audit insights
  const auditInsights = React.useMemo(() => {
    const insights = [];
    
    if (intelligenceMetrics.categorizationRate < 50) {
      insights.push({
        type: 'warning',
        title: 'Lav kategoriseringsgrad',
        description: `Kun ${Math.round(intelligenceMetrics.categorizationRate)}% av dokumentene er kategorisert`,
        suggestion: 'Kjør AI-analyse på flere dokumenter for bedre oversikt'
      });
    }
    
    if (intelligenceMetrics.confidenceRate < 70) {
      insights.push({
        type: 'info',
        title: 'Varierende AI-konfidensgrad',
        description: `${Math.round(intelligenceMetrics.confidenceRate)}% av dokumentene har høy konfidensgrad`,
        suggestion: 'Vurder manuell gjennomgang av dokumenter med lav konfidensgrad'
      });
    }
    
    const highRiskCategories = enhancedCategories.filter(cat => cat.riskLevel === 'high');
    if (highRiskCategories.length > 0) {
      insights.push({
        type: 'alert',
        title: 'Høyrisiko kategorier identifisert',
        description: `${highRiskCategories.length} kategorier krever ekstra oppmerksomhet`,
        suggestion: 'Prioriter gjennomgang av disse dokumentene i revisjonen'
      });
    }
    
    return insights;
  }, [intelligenceMetrics, enhancedCategories]);

  const analyzeAllDocuments = async () => {
    for (const doc of documents) {
      if (!doc.ai_suggested_category) {
        try {
          await analyzeDocument.mutateAsync({
            fileName: doc.file_name,
            mimeType: doc.mime_type || 'application/pdf',
            fileSize: 0,
            fileContent: ''
          });
          setAnalyzedDocuments(prev => prev + 1);
        } catch (error) {
          console.error('Analysis failed for document:', doc.id, error);
        }
      }
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Smart Dokumentintelligens
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Intelligence Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Smart Dokumentintelligens
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Kategorisering</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(intelligenceMetrics.categorizationRate)}%
                </span>
              </div>
              <Progress value={intelligenceMetrics.categorizationRate} />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">AI Konfidensgrad</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(intelligenceMetrics.confidenceRate)}%
                </span>
              </div>
              <Progress value={intelligenceMetrics.confidenceRate} />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Revisjonsrelevans</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(intelligenceMetrics.auditRelevanceRate)}%
                </span>
              </div>
              <Progress value={intelligenceMetrics.auditRelevanceRate} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {intelligenceMetrics.totalProcessed} av {intelligenceMetrics.totalDocuments} dokumenter analysert
              </span>
              {isAnalyzing && (
                <span className="text-sm text-primary animate-pulse">
                  Analyserer dokumenter...
                </span>
              )}
            </div>
            
            <Button 
              onClick={analyzeAllDocuments}
              disabled={isAnalyzing || intelligenceMetrics.totalProcessed === intelligenceMetrics.totalDocuments}
              size="sm"
            >
              <Brain className="h-4 w-4 mr-2" />
              Analyser alle
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Intelligence Tabs */}
      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="categories">Kategorier</TabsTrigger>
          <TabsTrigger value="insights">Innsikter</TabsTrigger>
          <TabsTrigger value="suggestions">Forslag</TabsTrigger>
        </TabsList>
        
        <TabsContent value="categories" className="space-y-4">
          <div className="grid gap-4">
            {enhancedCategories.map((category) => (
              <Card key={category.name}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{category.name}</h3>
                      <Badge variant={
                        category.riskLevel === 'high' ? 'destructive' :
                        category.riskLevel === 'medium' ? 'default' : 'secondary'
                      }>
                        {category.riskLevel === 'high' ? 'Høy risiko' :
                         category.riskLevel === 'medium' ? 'Middels risiko' : 'Lav risiko'}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {category.count} dokumenter
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Konfidensgrad: {Math.round(category.avgConfidence * 100)}%</span>
                    <Progress value={category.avgConfidence * 100} className="w-24 h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="insights" className="space-y-4">
          {auditInsights.map((insight, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {insight.type === 'warning' && <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />}
                  {insight.type === 'info' && <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5" />}
                  {insight.type === 'alert' && <Target className="h-5 w-5 text-red-500 mt-0.5" />}
                  
                  <div className="space-y-1">
                    <h3 className="font-medium">{insight.title}</h3>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                    <p className="text-sm text-primary">{insight.suggestion}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {auditInsights.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="font-medium mb-2">Utmerket dokumentintelligens!</h3>
                <p className="text-sm text-muted-foreground">
                  Alle dokumenter er godt kategorisert og analysert.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="suggestions" className="space-y-4">
          <div className="grid gap-4">
            {suggestions.slice(0, 6).map((suggestion, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{suggestion.query}</h3>
                      <p className="text-sm text-muted-foreground">
                        {suggestion.description}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => search({ term: suggestion.query, clientId })}
                      disabled={isSearching}
                    >
                      Søk
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {suggestions.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">Ingen forslag tilgjengelig</h3>
                  <p className="text-sm text-muted-foreground">
                    Last opp flere dokumenter for å få AI-genererte søkeforslag.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}