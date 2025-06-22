
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Link, Brain, CheckCircle, AlertTriangle, Target } from 'lucide-react';
import { useEnhancedClientDocuments } from '@/hooks/useEnhancedClientDocuments';
import { useEnhancedDocumentAnalysis } from '@/hooks/useEnhancedDocumentAnalysis';
import { useEnhancedAuditActionTemplates } from '@/hooks/useEnhancedAuditActions';

interface IntelligentDocumentLinkerProps {
  clientId: string;
  selectedDocumentId?: string;
}

const IntelligentDocumentLinker = ({ clientId, selectedDocumentId }: IntelligentDocumentLinkerProps) => {
  const { documents, getCategorizeionStats, getDocumentsByConfidence } = useEnhancedClientDocuments(clientId);
  const { analyzeDocument, analyzeBatch, isAnalyzing } = useEnhancedDocumentAnalysis();
  const { data: templates } = useEnhancedAuditActionTemplates();
  const [activeTab, setActiveTab] = useState('overview');

  const stats = getCategorizeionStats();
  const uncategorizedDocs = getDocumentsByConfidence('uncategorized');
  const lowConfidenceDocs = getDocumentsByConfidence('low');

  const handleAnalyzeUncategorized = async () => {
    if (uncategorizedDocs.length === 0) return;
    
    const analysisInputs = uncategorizedDocs
      .filter(doc => doc.extracted_text)
      .map(doc => ({
        documentId: doc.id,
        fileName: doc.file_name,
        extractedText: doc.extracted_text!,
        clientId
      }));

    await analyzeBatch(analysisInputs);
  };

  const handleAnalyzeLowConfidence = async () => {
    if (lowConfidenceDocs.length === 0) return;
    
    const analysisInputs = lowConfidenceDocs
      .filter(doc => doc.extracted_text)
      .map(doc => ({
        documentId: doc.id,
        fileName: doc.file_name,
        extractedText: doc.extracted_text!,
        clientId
      }));

    await analyzeBatch(analysisInputs);
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (score >= 60) return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    return <AlertTriangle className="w-4 h-4 text-red-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Intelligent dokumentkobling
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Totalt dokumenter</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.highConfidence}</div>
              <div className="text-sm text-muted-foreground">Høy sikkerhet</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.mediumConfidence}</div>
              <div className="text-sm text-muted-foreground">Medium sikkerhet</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.uncategorized}</div>
              <div className="text-sm text-muted-foreground">Ukategoriserte</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getQualityIcon(stats.qualityScore)}
                <span className="font-medium">Dokumentkvalitet</span>
                <span className={`font-bold ${getQualityColor(stats.qualityScore)}`}>
                  {stats.qualityScore}%
                </span>
              </div>
              <Progress value={stats.qualityScore} className="w-32" />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleAnalyzeUncategorized}
                disabled={isAnalyzing || uncategorizedDocs.length === 0}
                size="sm"
              >
                <Brain className="w-4 h-4 mr-2" />
                Analyser ukategoriserte ({uncategorizedDocs.length})
              </Button>
              <Button 
                onClick={handleAnalyzeLowConfidence}
                disabled={isAnalyzing || lowConfidenceDocs.length === 0}
                variant="outline"
                size="sm"
              >
                <Target className="w-4 h-4 mr-2" />
                Forbedre lav sikkerhet ({lowConfidenceDocs.length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Oversikt</TabsTrigger>
          <TabsTrigger value="categories">Kategorier</TabsTrigger>
          <TabsTrigger value="linkage">Handlingskobling</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(stats.byCategory).map(([category, count]) => (
              <Card key={category}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{category}</div>
                      <div className="text-sm text-muted-foreground">{count} dokumenter</div>
                    </div>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="space-y-4">
            {['high', 'medium', 'low', 'uncategorized'].map((level) => {
              const docs = getDocumentsByConfidence(level as any);
              const levelNames = {
                high: 'Høy sikkerhet',
                medium: 'Medium sikkerhet', 
                low: 'Lav sikkerhet',
                uncategorized: 'Ukategoriserte'
              };
              
              return (
                <Card key={level}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {levelNames[level as keyof typeof levelNames]} ({docs.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {docs.slice(0, 5).map((doc) => (
                        <div key={doc.id} className="flex items-center gap-2 p-2 border rounded">
                          <FileText className="w-4 h-4" />
                          <span className="flex-1 text-sm">{doc.file_name}</span>
                          {doc.category && (
                            <Badge variant="outline" className="text-xs">
                              {doc.category}
                            </Badge>
                          )}
                          {doc.ai_confidence_score && (
                            <Badge variant="secondary" className="text-xs">
                              {Math.round(doc.ai_confidence_score * 100)}%
                            </Badge>
                          )}
                        </div>
                      ))}
                      {docs.length > 5 && (
                        <div className="text-sm text-muted-foreground text-center">
                          ... og {docs.length - 5} flere
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="linkage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Link className="w-4 h-4" />
                Kobling til revisjonshandlinger
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templates?.slice(0, 3).map((template) => (
                  <div key={template.id} className="border rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{template.name}</h4>
                      <Badge variant="outline">{template.subject_area}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {template.objective || template.description}
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {template.document_mappings?.length || 0} dokumentkrav
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {template.isa_mappings?.length || 0} ISA-standarder
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntelligentDocumentLinker;
