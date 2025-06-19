
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Lightbulb, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  ArrowRight,
  Calendar
} from 'lucide-react';
import { useClientDocuments } from '@/hooks/useClientDocuments';

interface SearchRecommendation {
  title: string;
  description: string;
  searchQuery: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  icon: React.ReactNode;
  estimatedDocuments: number;
}

interface SearchRecommendationEngineProps {
  clientId: string;
  onSearchRecommendation: (query: string) => void;
}

const SearchRecommendationEngine: React.FC<SearchRecommendationEngineProps> = ({
  clientId,
  onSearchRecommendation
}) => {
  const [recommendations, setRecommendations] = useState<SearchRecommendation[]>([]);
  const { documents } = useClientDocuments(clientId);

  useEffect(() => {
    generateIntelligentRecommendations();
  }, [documents]);

  const generateIntelligentRecommendations = () => {
    if (!documents || documents.length === 0) return;

    const recs: SearchRecommendation[] = [];

    // Check for low confidence documents
    const lowConfidenceDocs = documents.filter(d => 
      d.ai_confidence_score && d.ai_confidence_score < 0.6
    );
    
    if (lowConfidenceDocs.length > 0) {
      recs.push({
        title: 'Dokumenter som trenger gjennomgang',
        description: `${lowConfidenceDocs.length} dokumenter har lav AI-sikkerhet og bør gjennomgås`,
        searchQuery: 'ai_confidence:low',
        priority: 'high',
        reason: 'Kvalitetssikring',
        icon: <AlertCircle className="h-4 w-4 text-red-600" />,
        estimatedDocuments: lowConfidenceDocs.length
      });
    }

    // Check for recent uploads
    const recentDocs = documents.filter(d => {
      const docDate = new Date(d.created_at);
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      return docDate > threeDaysAgo;
    });

    if (recentDocs.length > 0) {
      recs.push({
        title: 'Nye dokumenter',
        description: `${recentDocs.length} dokumenter lastet opp de siste 3 dagene`,
        searchQuery: 'recent:3days',
        priority: 'medium',
        reason: 'Nylig aktivitet',
        icon: <Clock className="h-4 w-4 text-blue-600" />,
        estimatedDocuments: recentDocs.length
      });
    }

    // Check for documents without categories
    const uncategorizedDocs = documents.filter(d => !d.category);
    
    if (uncategorizedDocs.length > 0) {
      recs.push({
        title: 'Ukategoriserte dokumenter',
        description: `${uncategorizedDocs.length} dokumenter mangler kategorisering`,
        searchQuery: 'category:none',
        priority: 'medium',
        reason: 'Organisering',
        icon: <FileText className="h-4 w-4 text-yellow-600" />,
        estimatedDocuments: uncategorizedDocs.length
      });
    }

    // Check for high-quality documents
    const highQualityDocs = documents.filter(d => 
      d.ai_confidence_score && d.ai_confidence_score >= 0.9
    );

    if (highQualityDocs.length > 0) {
      recs.push({
        title: 'Høykvalitetsdokumenter',
        description: `${highQualityDocs.length} dokumenter med svært høy AI-sikkerhet`,
        searchQuery: 'ai_confidence:excellent',
        priority: 'low',
        reason: 'Referansedokumenter',
        icon: <CheckCircle className="h-4 w-4 text-green-600" />,
        estimatedDocuments: highQualityDocs.length
      });
    }

    // Category-based recommendations
    const categoryStats = documents.reduce((acc, doc) => {
      if (doc.category) {
        acc[doc.category] = (acc[doc.category] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const topCategory = Object.entries(categoryStats)
      .sort(([,a], [,b]) => b - a)[0];

    if (topCategory && topCategory[1] >= 3) {
      recs.push({
        title: `${topCategory[0]} dokumenter`,
        description: `Du har ${topCategory[1]} dokumenter i kategorien ${topCategory[0]}`,
        searchQuery: `category:${topCategory[0]}`,
        priority: 'low',
        reason: 'Mest populære kategori',
        icon: <TrendingUp className="h-4 w-4 text-purple-600" />,
        estimatedDocuments: topCategory[1]
      });
    }

    // Year-end specific recommendations
    const currentMonth = new Date().getMonth();
    if (currentMonth >= 10) { // November or December
      const yearEndDocs = documents.filter(d => 
        d.file_name.toLowerCase().includes('årsoppgjør') ||
        d.file_name.toLowerCase().includes('årsslutt') ||
        d.category?.toLowerCase().includes('årsregnskap')
      );

      if (yearEndDocs.length > 0) {
        recs.push({
          title: 'Årsoppgjørsdokumenter',
          description: `${yearEndDocs.length} dokumenter relatert til årsoppgjør`,
          searchQuery: 'årsoppgjør OR årsslutt',
          priority: 'high',
          reason: 'Sesongaktuelt',
          icon: <Calendar className="h-4 w-4 text-orange-600" />,
          estimatedDocuments: yearEndDocs.length
        });
      }
    }

    setRecommendations(recs.slice(0, 5)); // Top 5 recommendations
  };

  const getPriorityColor = (priority: SearchRecommendation['priority']) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getPriorityBadge = (priority: SearchRecommendation['priority']) => {
    switch (priority) {
      case 'high': return <Badge className="bg-red-100 text-red-800">Høy prioritet</Badge>;
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-800">Middels prioritet</Badge>;
      case 'low': return <Badge className="bg-blue-100 text-blue-800">Lav prioritet</Badge>;
      default: return null;
    }
  };

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-600" />
          AI-Revi anbefalinger
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Intelligente søkeforslag basert på dine dokumenter
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recommendations.map((rec, index) => (
            <div 
              key={index}
              className={`p-4 border rounded-lg transition-all hover:shadow-md ${getPriorityColor(rec.priority)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-0.5">
                    {rec.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{rec.title}</h4>
                      {getPriorityBadge(rec.priority)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>📊 {rec.estimatedDocuments} dokumenter</span>
                      <span>🏷️ {rec.reason}</span>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => onSearchRecommendation(rec.searchQuery)}
                  size="sm"
                  variant="outline"
                  className="ml-3"
                >
                  <ArrowRight className="h-3 w-3 mr-1" />
                  Søk
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Brain className="h-4 w-4 text-purple-600" />
            <span className="font-medium text-sm text-purple-900">AI-Revi tips</span>
          </div>
          <p className="text-xs text-purple-700">
            Disse anbefalingene er generert basert på dine dokumenters kvalitet, kategorier og opplastningsdatoer. 
            Klikk "Søk" for å utforske relevante dokumenter.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchRecommendationEngine;
