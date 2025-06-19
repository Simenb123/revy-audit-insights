
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Link2, 
  Brain, 
  FileText, 
  Unlink, 
  Loader2,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Building
} from 'lucide-react';
import { useClientDocuments } from '@/hooks/useClientDocuments';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface IntelligentDocumentLinkerProps {
  clientId: string;
  selectedDocumentId?: string;
}

interface DocumentRelationship {
  id: string;
  parent_document_id: string;
  child_document_id: string;
  relationship_type: string;
  description?: string;
  confidence_score?: number;
  created_by?: string;
  created_at: string;
}

interface SuggestedLink {
  documentId: string;
  documentName: string;
  relationshipType: string;
  confidence: number;
  reason: string;
  metadata?: any;
}

const IntelligentDocumentLinker: React.FC<IntelligentDocumentLinkerProps> = ({
  clientId,
  selectedDocumentId
}) => {
  const { documents } = useClientDocuments(clientId);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestedLinks, setSuggestedLinks] = useState<SuggestedLink[]>([]);
  const [existingRelationships, setExistingRelationships] = useState<DocumentRelationship[]>([]);

  useEffect(() => {
    if (selectedDocumentId) {
      loadExistingRelationships();
      analyzeDocumentRelationships();
    }
  }, [selectedDocumentId, clientId]);

  const loadExistingRelationships = async () => {
    if (!selectedDocumentId) return;

    try {
      const { data, error } = await supabase
        .from('document_relationships')
        .select('*')
        .or(`parent_document_id.eq.${selectedDocumentId},child_document_id.eq.${selectedDocumentId}`);

      if (error) throw error;
      setExistingRelationships(data || []);
    } catch (error) {
      console.error('Error loading relationships:', error);
    }
  };

  const analyzeDocumentRelationships = async () => {
    if (!selectedDocumentId || documents.length === 0) return;

    setIsAnalyzing(true);
    
    try {
      const selectedDoc = documents.find(d => d.id === selectedDocumentId);
      if (!selectedDoc) return;

      const suggestions: SuggestedLink[] = [];
      
      // Analyser andre dokumenter for potensielle koblinger
      for (const doc of documents) {
        if (doc.id === selectedDocumentId) continue;
        
        const relationship = analyzeDocumentPair(selectedDoc, doc);
        if (relationship) {
          suggestions.push(relationship);
        }
      }

      // Sorter etter konfidensgrad
      suggestions.sort((a, b) => b.confidence - a.confidence);
      setSuggestedLinks(suggestions.slice(0, 5)); // Top 5 forslag

    } catch (error) {
      console.error('Error analyzing relationships:', error);
      toast({
        title: "Analyse feilet",
        description: "Kunne ikke analysere dokumentkoblinger",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeDocumentPair = (doc1: any, doc2: any): SuggestedLink | null => {
    let confidence = 0;
    let relationshipType = 'related';
    let reason = '';

    // Periode-matching
    if (doc1.ai_analysis_summary && doc2.ai_analysis_summary) {
      const period1 = extractPeriod(doc1.file_name);
      const period2 = extractPeriod(doc2.file_name);
      
      if (period1 && period2 && period1.year === period2.year) {
        confidence += 0.3;
        if (period1.month === period2.month) {
          confidence += 0.2;
        }
        reason += `Samme periode (${period1.year}). `;
      }
    }

    // Dokumenttype-relasjon
    const typeRelation = getDocumentTypeRelation(doc1.category, doc2.category);
    if (typeRelation) {
      confidence += typeRelation.confidence;
      relationshipType = typeRelation.type;
      reason += typeRelation.reason;
    }

    // Filnavn-likhet
    const nameSimilarity = calculateNameSimilarity(doc1.file_name, doc2.file_name);
    if (nameSimilarity > 0.3) {
      confidence += nameSimilarity * 0.2;
      reason += `Lignende filnavn. `;
    }

    // System-matching
    if (doc1.ai_analysis_summary?.includes('visma') && doc2.ai_analysis_summary?.includes('visma')) {
      confidence += 0.1;
      reason += 'Samme regnskapssystem. ';
    }

    return confidence > 0.4 ? {
      documentId: doc2.id,
      documentName: doc2.file_name,
      relationshipType,
      confidence: Math.min(confidence, 0.95),
      reason: reason.trim(),
      metadata: {
        category: doc2.category,
        size: doc2.file_size
      }
    } : null;
  };

  const getDocumentTypeRelation = (type1?: string, type2?: string) => {
    if (!type1 || !type2) return null;

    const relations: Record<string, Record<string, { confidence: number; type: string; reason: string }>> = {
      'hovedbok': {
        'saldobalanse': { confidence: 0.4, type: 'supports', reason: 'Hovedbok støtter saldobalanse. ' },
        'lonnslipp': { confidence: 0.3, type: 'related', reason: 'Begge er regnskapsdokumenter. ' }
      },
      'saldobalanse': {
        'hovedbok': { confidence: 0.4, type: 'supported_by', reason: 'Saldobalanse støttes av hovedbok. ' },
        'arsregnskap': { confidence: 0.5, type: 'creates', reason: 'Saldobalanse brukes til årsregnskap. ' }
      },
      'faktura': {
        'hovedbok': { confidence: 0.3, type: 'posted_to', reason: 'Faktura posteres i hovedbok. ' }
      }
    };

    return relations[type1]?.[type2] || null;
  };

  const extractPeriod = (filename: string) => {
    const yearMatch = filename.match(/20\d{2}/);
    const monthMatch = filename.match(/(?:jan|feb|mar|apr|mai|jun|jul|aug|sep|okt|nov|des|\d{1,2})/i);
    
    if (yearMatch) {
      return {
        year: parseInt(yearMatch[0]),
        month: monthMatch ? getMonthNumber(monthMatch[0]) : null
      };
    }
    return null;
  };

  const getMonthNumber = (monthStr: string): number => {
    const monthMap: Record<string, number> = {
      'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'mai': 5, 'jun': 6,
      'jul': 7, 'aug': 8, 'sep': 9, 'okt': 10, 'nov': 11, 'des': 12
    };
    return monthMap[monthStr.toLowerCase()] || parseInt(monthStr) || 0;
  };

  const calculateNameSimilarity = (name1: string, name2: string): number => {
    const words1 = name1.toLowerCase().split(/[\s_-]+/);
    const words2 = name2.toLowerCase().split(/[\s_-]+/);
    
    let matches = 0;
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1.length > 2 && word2.length > 2 && 
            (word1.includes(word2) || word2.includes(word1))) {
          matches++;
        }
      }
    }
    
    return matches / Math.max(words1.length, words2.length);
  };

  const createDocumentLink = async (suggestion: SuggestedLink) => {
    if (!selectedDocumentId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('document_relationships')
        .insert({
          parent_document_id: selectedDocumentId,
          child_document_id: suggestion.documentId,
          relationship_type: suggestion.relationshipType,
          description: suggestion.reason,
          created_by: user?.id
        });

      if (error) throw error;

      toast({
        title: "Kobling opprettet",
        description: `Koblet dokumenter med ${Math.round(suggestion.confidence * 100)}% sikkerhet`
      });

      // Oppdater lokale data
      loadExistingRelationships();
      setSuggestedLinks(prev => prev.filter(s => s.documentId !== suggestion.documentId));

    } catch (error) {
      console.error('Error creating link:', error);
      toast({
        title: "Kunne ikke opprette kobling",
        description: "Prøv igjen senere",
        variant: "destructive"
      });
    }
  };

  const removeDocumentLink = async (relationshipId: string) => {
    try {
      const { error } = await supabase
        .from('document_relationships')
        .delete()
        .eq('id', relationshipId);

      if (error) throw error;

      toast({
        title: "Kobling fjernet",
        description: "Dokumentkoblingen er slettet"
      });

      loadExistingRelationships();
    } catch (error) {
      console.error('Error removing link:', error);
      toast({
        title: "Kunne ikke fjerne kobling",
        description: "Prøv igjen senere",
        variant: "destructive"
      });
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (!selectedDocumentId) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>Velg et dokument for å se intelligente koblingsforslag</p>
        </CardContent>
      </Card>
    );
  }

  const selectedDoc = documents.find(d => d.id === selectedDocumentId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Intelligente dokumentkoblinger
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            AI-Revi foreslår koblinger mellom relaterte dokumenter basert på innhold og metadata
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedDoc && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">Valgt dokument:</span>
              </div>
              <p className="text-sm text-blue-700">{selectedDoc.file_name}</p>
              {selectedDoc.category && (
                <Badge variant="outline" className="mt-2 bg-blue-100 text-blue-800">
                  {selectedDoc.category}
                </Badge>
              )}
            </div>
          )}

          {/* Foreslåtte koblinger */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                AI-foreslåtte koblinger
              </h4>
              <Button
                onClick={analyzeDocumentRelationships}
                disabled={isAnalyzing}
                size="sm"
                variant="outline"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Brain className="h-3 w-3 mr-1" />
                )}
                Analyser på nytt
              </Button>
            </div>

            {isAnalyzing ? (
              <div className="text-center py-8 text-gray-500">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p>AI-Revi analyserer dokumentkoblinger...</p>
              </div>
            ) : suggestedLinks.length > 0 ? (
              <div className="space-y-2">
                {suggestedLinks.map((suggestion, index) => (
                  <div key={index} className="p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-sm">{suggestion.documentName}</span>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getConfidenceColor(suggestion.confidence)}`}
                          >
                            {Math.round(suggestion.confidence * 100)}% sikkerhet
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{suggestion.reason}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Building className="h-3 w-3" />
                          <span>{suggestion.relationshipType}</span>
                          {suggestion.metadata?.category && (
                            <>
                              <span>•</span>
                              <span>{suggestion.metadata.category}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => createDocumentLink(suggestion)}
                        size="sm"
                        className="ml-3"
                      >
                        <Link2 className="h-3 w-3 mr-1" />
                        Koble
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Link2 className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>Ingen koblingsforslag funnet</p>
                <p className="text-xs">AI-Revi fant ingen sterke koblinger til andre dokumenter</p>
              </div>
            )}
          </div>

          {/* Eksisterende koblinger */}
          {existingRelationships.length > 0 && (
            <div>
              <h4 className="font-medium flex items-center gap-2 mb-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Etablerte koblinger ({existingRelationships.length})
              </h4>
              <div className="space-y-2">
                {existingRelationships.map((rel) => {
                  const relatedDoc = documents.find(d => 
                    d.id === (rel.parent_document_id === selectedDocumentId 
                      ? rel.child_document_id 
                      : rel.parent_document_id)
                  );
                  
                  if (!relatedDoc) return null;

                  return (
                    <div key={rel.id} className="p-3 border border-green-200 bg-green-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-sm text-green-900">{relatedDoc.file_name}</span>
                            <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                              {rel.relationship_type}
                            </Badge>
                          </div>
                          {rel.description && (
                            <p className="text-xs text-green-700">{rel.description}</p>
                          )}
                          <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                            <Calendar className="h-3 w-3" />
                            <span>Opprettet {new Date(rel.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => removeDocumentLink(rel.id)}
                          size="sm"
                          variant="outline"
                          className="ml-3 text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Unlink className="h-3 w-3 mr-1" />
                          Fjern
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IntelligentDocumentLinker;
