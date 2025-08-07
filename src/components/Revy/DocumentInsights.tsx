import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Brain, 
  Calendar, 
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { ClientDocument } from '@/hooks/useClientDocumentsList';

interface DocumentInsightsProps {
  documents: ClientDocument[];
  className?: string;
}

const DocumentInsights: React.FC<DocumentInsightsProps> = ({ 
  documents, 
  className = '' 
}) => {
  const totalDocs = documents.length;
  const aiAnalyzedDocs = documents.filter(doc => 
    doc.ai_analysis_summary || doc.ai_suggested_category
  );
  const categorizedDocs = documents.filter(doc => 
    doc.category || doc.ai_suggested_category
  );
  const needsReviewDocs = documents.filter(doc => 
    doc.ai_confidence_score && doc.ai_confidence_score < 0.7
  );
  
  const analysisProgress = totalDocs > 0 ? (aiAnalyzedDocs.length / totalDocs) * 100 : 0;
  const categorizationProgress = totalDocs > 0 ? (categorizedDocs.length / totalDocs) * 100 : 0;

  const getTopCategories = () => {
    const categoryCount: Record<string, number> = {};
    documents.forEach(doc => {
      const category = doc.ai_suggested_category || doc.category;
      if (category) {
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      }
    });
    
    return Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  };

  const getRecentDocs = () => {
    return documents
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);
  };

  if (totalDocs === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Ingen dokumenter tilgjengelig</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="h-5 w-5 text-purple-600" />
          Dokumentinnsikt for AI-Revy
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Totalt</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{totalDocs}</p>
            <p className="text-xs text-blue-500">dokumenter</p>
          </div>
          
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Brain className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">AI-analysert</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{aiAnalyzedDocs.length}</p>
            <p className="text-xs text-purple-500">av {totalDocs}</p>
          </div>
        </div>

        {/* Progress Indicators */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>AI-analyse fremdrift</span>
              <span>{Math.round(analysisProgress)}%</span>
            </div>
            <Progress value={analysisProgress} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Kategorisering</span>
              <span>{Math.round(categorizationProgress)}%</span>
            </div>
            <Progress value={categorizationProgress} className="h-2" />
          </div>
        </div>

        {/* Alerts */}
        {needsReviewDocs.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">Trenger gjennomgang</span>
            </div>
            <p className="text-xs text-orange-700">
              {needsReviewDocs.length} dokumenter har lav AI-sikkerhet og bør gjennomgås manuelt
            </p>
          </div>
        )}

        {/* Top Categories */}
        {getTopCategories().length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Hovedkategorier
            </h4>
            <div className="flex flex-wrap gap-1">
              {getTopCategories().map(([category, count]) => (
                <Badge key={category} variant="secondary" className="text-xs">
                  {category} ({count})
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Recent Documents */}
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Nyeste dokumenter
          </h4>
          <div className="space-y-2">
            {getRecentDocs().map((doc) => (
              <div key={doc.id} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{doc.file_name}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {doc.ai_analysis_summary && (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(doc.created_at).toLocaleDateString('no-NO')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Context Info */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Brain className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">AI-Revy Kontekst</span>
          </div>
          <p className="text-xs text-purple-700">
            AI-Revy har tilgang til {aiAnalyzedDocs.length} analyserte dokumenter og kan 
            svare på spørsmål om innhold, kategorier og sammenhenger.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentInsights;