
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, CheckCircle, AlertCircle, Info, ArrowRight } from 'lucide-react';
import { Client } from '@/types/revio';

interface IntelligentRecommendationsProps {
  client: Client;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'risk' | 'efficiency' | 'compliance' | 'optimization';
  impact: string;
  effort: 'low' | 'medium' | 'high';
  completed: boolean;
}

const IntelligentRecommendations = ({ client }: IntelligentRecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateRecommendations = async () => {
    setIsGenerating(true);
    
    // Simuler AI-genererte anbefalinger
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newRecommendations: Recommendation[] = [
      {
        id: '1',
        title: 'Implementer automatisert kundefordringskontroll',
        description: 'Basert på aldersanalyse av kundefordringer anbefales økt oppfølging av fordringer eldre enn 60 dager.',
        priority: 'high',
        category: 'risk',
        impact: 'Reduserer kredittrisiko med 15-20%',
        effort: 'medium',
        completed: false
      },
      {
        id: '2',
        title: 'Optimaliser varelageromløp',
        description: 'AI-analyse viser potensial for forbedret lageromløp gjennom bedre prognostisering.',
        priority: 'medium',
        category: 'efficiency',
        impact: 'Frigjør 2-3 millioner i arbeidskapital',
        effort: 'high',
        completed: false
      },
      {
        id: '3',
        title: 'Oppdater internkontrollsystemer',
        description: 'Nye regulatory requirements krever oppdatering av internkontroller innen Q2.',
        priority: 'high',
        category: 'compliance',
        impact: 'Sikrer regulatory compliance',
        effort: 'medium',
        completed: false
      },
      {
        id: '4',
        title: 'Digitaliser bilagsføring',
        description: 'Automatisering av bilagsføring kan redusere manual arbeid med 40%.',
        priority: 'medium',
        category: 'optimization',
        impact: 'Sparer 20 timer per måned',
        effort: 'low',
        completed: true
      },
      {
        id: '5',
        title: 'Implementer real-time finansiell rapportering',
        description: 'Sanntidsrapportering gir bedre grunnlag for beslutninger og risikovurdering.',
        priority: 'low',
        category: 'efficiency',
        impact: 'Forbedrer beslutningsgrunnlag',
        effort: 'high',
        completed: false
      }
    ];

    setRecommendations(newRecommendations);
    setIsGenerating(false);
  };

  useEffect(() => {
    generateRecommendations();
  }, [client.id]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'risk': return <AlertCircle className="h-4 w-4" />;
      case 'efficiency': return <Lightbulb className="h-4 w-4" />;
      case 'compliance': return <CheckCircle className="h-4 w-4" />;
      case 'optimization': return <ArrowRight className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const toggleCompletion = (id: string) => {
    setRecommendations(prev => 
      prev.map(rec => 
        rec.id === id ? { ...rec, completed: !rec.completed } : rec
      )
    );
  };

  const activeRecommendations = recommendations.filter(rec => !rec.completed);
  const completedRecommendations = recommendations.filter(rec => rec.completed);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Intelligente Anbefalinger
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generateRecommendations}
              disabled={isGenerating}
            >
              {isGenerating ? 'Genererer...' : 'Oppdater anbefalinger'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isGenerating ? (
            <div className="text-center py-8">
              <div className="animate-pulse rounded-full h-8 w-8 bg-primary/20 mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Genererer AI-anbefalinger...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Active Recommendations */}
              <div>
                <h3 className="font-medium mb-4">Aktive anbefalinger ({activeRecommendations.length})</h3>
                <div className="space-y-4">
                  {activeRecommendations.map((recommendation) => (
                    <div key={recommendation.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(recommendation.category)}
                          <h4 className="font-medium">{recommendation.title}</h4>
                        </div>
                        <Badge className={getPriorityColor(recommendation.priority)}>
                          {recommendation.priority.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {recommendation.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="text-xs">
                            <span className="font-medium">Impact:</span> {recommendation.impact}
                          </div>
                          <div className="text-xs">
                            <span className="font-medium">Innsats:</span> 
                            <span className={getEffortColor(recommendation.effort)}>
                              {' '}{recommendation.effort}
                            </span>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => toggleCompletion(recommendation.id)}
                        >
                          Marker som fullført
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Completed Recommendations */}
              {completedRecommendations.length > 0 && (
                <div>
                  <h3 className="font-medium mb-4">Fullførte anbefalinger ({completedRecommendations.length})</h3>
                  <div className="space-y-2">
                    {completedRecommendations.map((recommendation) => (
                      <div key={recommendation.id} className="p-3 border rounded-lg bg-muted/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium line-through">
                              {recommendation.title}
                            </span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => toggleCompletion(recommendation.id)}
                          >
                            Angre
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IntelligentRecommendations;
