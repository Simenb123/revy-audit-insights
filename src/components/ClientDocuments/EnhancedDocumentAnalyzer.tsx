
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  TrendingUp,
  BookOpen,
  Users,
  Search
} from 'lucide-react';
import { useEnhancedDocumentAnalysis } from '@/hooks/useEnhancedDocumentAnalysis';
import { useEnhancedClientDocuments } from '@/hooks/useEnhancedClientDocuments';
import AIRevyVariantSelector from '@/components/AI/AIRevyVariantSelector';

interface EnhancedDocumentAnalyzerProps {
  clientId: string;
}

const EnhancedDocumentAnalyzer: React.FC<EnhancedDocumentAnalyzerProps> = ({ clientId }) => {
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const { 
    isAnalyzing, 
    analysisResults, 
    analyzeDocument, 
    analyzeBatch,
    selectedVariant 
  } = useEnhancedDocumentAnalysis();
  
  const { 
    documents, 
    getCategorizeionStats,
    getDocumentsByConfidence 
  } = useEnhancedClientDocuments(clientId);

  const stats = getCategorizeionStats();
  const lowConfidenceDocs = getDocumentsByConfidence('low');
  const uncategorizedDocs = getDocumentsByConfidence('uncategorized');

  const handleAnalyzeSelected = async () => {
    if (selectedDocuments.length === 0) return;
    
    const inputs = selectedDocuments.map(docId => {
      const doc = documents.find(d => d.id === docId);
      return {
        documentId: docId,
        fileName: doc?.file_name || '',
        extractedText: doc?.extracted_text,
        clientId,
        existingDocuments: documents
      };
    });

    await analyzeBatch(inputs);
    setSelectedDocuments([]);
  };

  const handleAnalyzeLowConfidence = async () => {
    const inputs = lowConfidenceDocs.map(doc => ({
      documentId: doc.id,
      fileName: doc.file_name,
      extractedText: doc.extracted_text,
      clientId,
      existingDocuments: documents
    }));

    await analyzeBatch(inputs);
  };

  const getVariantIcon = (variantName?: string) => {
    switch (variantName) {
      case 'methodology': return <Brain className="h-4 w-4" />;
      case 'professional': return <BookOpen className="h-4 w-4" />;
      case 'guide': return <Users className="h-4 w-4" />;
      case 'support': return <Search className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getConfidenceColor = (score?: number) => {
    if (!score) return 'text-gray-400';
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI-forbedret Dokumentanalyse
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Intelligent kategorisering og analyse basert på valgt AI-Revi variant
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* AI Variant Selector */}
          <AIRevyVariantSelector 
            currentContext="documentation"
            onVariantChange={() => {}} // Handle variant change if needed
            compact={false}
          />

          {/* Analysis Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium">{stats.highConfidence}</div>
                  <div className="text-sm text-gray-600">Høy sikkerhet</div>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className="font-medium">{stats.mediumConfidence}</div>
                  <div className="text-sm text-gray-600">Middels sikkerhet</div>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="font-medium">{stats.lowConfidence}</div>
                  <div className="text-sm text-gray-600">Lav sikkerhet</div>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-600" />
                <div>
                  <div className="font-medium">{stats.uncategorized}</div>
                  <div className="text-sm text-gray-600">Ukategoriserte</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={handleAnalyzeLowConfidence}
              disabled={isAnalyzing || lowConfidenceDocs.length === 0}
              variant="outline"
            >
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <TrendingUp className="h-4 w-4 mr-2" />
              )}
              Analyser dokumenter med lav sikkerhet ({lowConfidenceDocs.length})
            </Button>
            
            <Button
              onClick={handleAnalyzeSelected}
              disabled={isAnalyzing || selectedDocuments.length === 0}
              variant="outline"
            >
              Analyser valgte ({selectedDocuments.length})
            </Button>
          </div>

          {/* Document List */}
          <div>
            <h4 className="font-medium mb-3">Dokumenter for analyse</h4>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {documents.map((doc) => (
                <Card key={doc.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedDocuments.includes(doc.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDocuments(prev => [...prev, doc.id]);
                          } else {
                            setSelectedDocuments(prev => prev.filter(id => id !== doc.id));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <FileText className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium text-sm">{doc.file_name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          {doc.category && (
                            <Badge variant="outline" className="text-xs">
                              {doc.category}
                            </Badge>
                          )}
                          {doc.ai_confidence_score && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getConfidenceColor(doc.ai_confidence_score)}`}
                            >
                              {Math.round(doc.ai_confidence_score * 100)}% sikkerhet
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {doc.ai_analysis_summary && (
                      <div className="text-xs text-gray-600 max-w-xs">
                        {doc.ai_analysis_summary}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Analysis Progress */}
          {isAnalyzing && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="font-medium">Analyserer dokumenter...</span>
              </div>
              <Progress value={66} className="w-full" />
              <p className="text-sm text-gray-600 mt-2">
                {selectedVariant && (
                  <>
                    Bruker {selectedVariant.display_name} for analyse
                  </>
                )}
              </p>
            </Card>
          )}

          {/* Recent Analysis Results */}
          {analysisResults.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Nylige analyseresultater</h4>
              <div className="space-y-2">
                {analysisResults.slice(-5).map((result, index) => (
                  <Card key={index} className="p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-sm">{result.aiSuggestedCategory}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          {result.aiAnalysisSummary}
                        </div>
                        {result.aiSuggestedSubjectAreas.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {result.aiSuggestedSubjectAreas.map(area => (
                              <Badge key={area} variant="secondary" className="text-xs">
                                {area}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getConfidenceColor(result.aiConfidenceScore)}`}
                      >
                        {Math.round(result.aiConfidenceScore * 100)}%
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Variant-specific Information */}
          {selectedVariant && (
            <Card className="p-4 bg-purple-50 border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                {getVariantIcon(selectedVariant.name)}
                <span className="font-medium text-purple-900">
                  {selectedVariant.display_name} Analysis Mode
                </span>
              </div>
              <p className="text-xs text-purple-700">
                {selectedVariant.description}
              </p>
              <div className="mt-2 text-xs text-purple-600">
                <strong>Fokusområder:</strong>
                {selectedVariant.name === 'methodology' && ' ISA-standarder, revisjonshandlinger, dokumentasjonskrav'}
                {selectedVariant.name === 'professional' && ' Regnskapslovgivning, IFRS, bransjeforhold'}
                {selectedVariant.name === 'guide' && ' Pedagogisk veiledning, trinn-for-trinn analyse'}
                {selectedVariant.name === 'support' && ' Tekniske aspekter, systemintegrasjon'}
              </div>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedDocumentAnalyzer;
