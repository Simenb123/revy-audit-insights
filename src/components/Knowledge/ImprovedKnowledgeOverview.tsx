
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BookOpen, 
  FileText, 
  Search, 
  PlusCircle, 
  Upload,
  Target,
  Brain,
  Lightbulb,
  ArrowRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRobustKnowledgeStats, useRobustRecentArticles, useRobustTotalArticleCount } from '@/hooks/knowledge/useRobustKnowledgeStats';
import { useRobustAuditActionTemplateCount } from '@/hooks/knowledge/useRobustAuditActionTemplates';

const ImprovedKnowledgeOverview = () => {
  const navigate = useNavigate();
  
  const { 
    data: knowledgeStats = [], 
    isLoading: statsLoading, 
    error: statsError,
    isError: hasStatsError 
  } = useRobustKnowledgeStats();
  
  const { 
    data: recentArticles = [], 
    isLoading: articlesLoading, 
    error: articlesError,
    isError: hasArticlesError 
  } = useRobustRecentArticles(3);
  
  const { 
    data: totalArticles = 0, 
    isLoading: totalLoading, 
    error: totalError,
    isError: hasTotalError 
  } = useRobustTotalArticleCount();
  
  const { 
    data: totalActionTemplates = 0, 
    isLoading: templatesLoading, 
    error: templatesError,
    isError: hasTemplatesError 
  } = useRobustAuditActionTemplateCount();

  console.log('📚 [IMPROVED_OVERVIEW] Component render - Loading states:', {
    statsLoading,
    articlesLoading,
    totalLoading,
    templatesLoading
  });

  console.log('📚 [IMPROVED_OVERVIEW] Component render - Data:', {
    knowledgeStats: knowledgeStats?.length || 0,
    totalArticles,
    totalActionTemplates,
    recentArticlesCount: recentArticles?.length || 0
  });

  console.log('📚 [IMPROVED_OVERVIEW] Component render - Errors:', {
    hasStatsError,
    hasArticlesError,
    hasTotalError,
    hasTemplatesError
  });

  const quickActions = [
    {
      title: 'Ny artikkel',
      description: 'Skriv en ny fagartikkel',
      icon: PlusCircle,
      action: () => navigate('/fag/ny-artikkel'),
      color: 'bg-blue-500'
    },
    {
      title: 'Last opp PDF',
      description: 'Konverter PDF til fagstoff',
      icon: Upload,
      action: () => navigate('/fag/upload'),
      color: 'bg-green-500'
    },
    {
      title: 'Søk i fagstoff',
      description: 'Finn relevant innhold',
      icon: Search,
      action: () => navigate('/fag/sok'),
      color: 'bg-purple-500'
    },
    {
      title: 'Revisjonshandlinger',
      description: 'Opprett og administrer handlinger',
      icon: Target,
      action: () => navigate('/fag/revisjonshandlinger'),
      color: 'bg-orange-500'
    }
  ];

  // Transform knowledge stats into categories display with safe fallbacks
  const categories = React.useMemo(() => {
    if (!knowledgeStats || knowledgeStats.length === 0) {
      console.log('📚 [IMPROVED_OVERVIEW] No knowledge stats, creating fallback categories');
      return [
        {
          id: 'fallback-1',
          name: 'ISA-standarder',
          count: 0,
          description: 'Internasjonale revisjonstandarder',
          color: 'bg-blue-100 text-blue-800'
        },
        {
          id: 'fallback-2',
          name: 'NRS-standarder',
          count: 0,
          description: 'Norske revisjonstandarder',
          color: 'bg-green-100 text-green-800'
        },
        {
          id: 'fallback-3',
          name: 'Lovgivning',
          count: 0,
          description: 'Relevante lover og forskrifter',
          color: 'bg-purple-100 text-purple-800'
        }
      ];
    }

    const transformedCategories = knowledgeStats.map(category => ({
      id: category.id,
      name: category.name,
      count: category.article_count || 0,
      description: category.description || 'Fagartikler og ressurser',
      color: getColorForCategory(category.name)
    }));

    // Add audit actions as a category if we have templates
    if (totalActionTemplates && totalActionTemplates > 0) {
      transformedCategories.push({
        id: 'audit-actions',
        name: 'Revisjonshandlinger',
        count: totalActionTemplates,
        description: 'Standardiserte handlingsmaler',
        color: 'bg-orange-100 text-orange-800'
      });
    }

    return transformedCategories;
  }, [knowledgeStats, totalActionTemplates]);

  function getColorForCategory(name: string) {
    const colorMap: Record<string, string> = {
      'ISA-standarder': 'bg-blue-100 text-blue-800',
      'NRS-standarder': 'bg-green-100 text-green-800',
      'Lovgivning': 'bg-purple-100 text-purple-800',
      'Jus': 'bg-purple-100 text-purple-800',
      'Revisjon': 'bg-indigo-100 text-indigo-800',
      'App': 'bg-gray-100 text-gray-800',
      'Regnskap': 'bg-yellow-100 text-yellow-800',
      'FAQ': 'bg-gray-100 text-gray-800',
      'Revisjonstandarder': 'bg-blue-100 text-blue-800',
      'Veiledninger': 'bg-emerald-100 text-emerald-800',
      'Sjekklister': 'bg-slate-100 text-slate-800',
    };
    return colorMap[name] || 'bg-gray-100 text-gray-800';
  }

  const handleCategoryClick = (category: any) => {
    if (category.id === 'audit-actions') {
      navigate('/fag/revisjonshandlinger');
    } else if (category.id.startsWith('fallback-')) {
      // For fallback categories, go to search with the category name
      navigate(`/fag/sok?q=${encodeURIComponent(category.name)}`);
    } else {
      navigate(`/fag/kategori/${category.id}`);
    }
  };

  // Show loading state only if all critical data is loading
  const isLoading = statsLoading && totalLoading;
  
  if (isLoading) {
    console.log('📚 [IMPROVED_OVERVIEW] Showing loading state');
    return (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Fagstoff</h1>
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Laster fagstoff...</span>
          </div>
        </div>
      </div>
    );
  }

  console.log('📚 [IMPROVED_OVERVIEW] Rendering main content with categories:', categories.length);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">Fagstoff</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Tilgang til {totalArticles || 0} revisjonsartikler, standarder, veiledninger og avansert dokumenthåndtering
        </p>
      </div>

      {/* Error Alerts - Show non-blocking alerts for errors */}
      {(hasStatsError || hasArticlesError || hasTotalError || hasTemplatesError) && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Noen data kunne ikke lastes. Grunnleggende funksjonalitet er fortsatt tilgjengelig.
            {hasStatsError && <div className="text-xs mt-1">Kategorier: {statsError?.message}</div>}
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Hurtighandlinger
          </CardTitle>
          <CardDescription>
            Kom raskt i gang med de mest brukte funksjonene
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                onClick={action.action}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start space-y-2 hover:shadow-md transition-all"
              >
                <div className={`p-2 rounded-lg ${action.color} text-white`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">{action.title}</div>
                  <div className="text-sm text-gray-500">{action.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((category, index) => (
          <Card 
            key={category.id || index} 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleCategoryClick(category)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{category.name}</CardTitle>
                <Badge className={category.color}>{category.count}</Badge>
              </div>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" size="sm" className="w-full justify-between">
                Utforsk
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Articles */}
      {recentArticles && recentArticles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Nylige artikler
            </CardTitle>
            <CardDescription>
              De sist oppdaterte fagartiklene i systemet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {articlesLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span>Laster artikler...</span>
                </div>
              ) : (
                recentArticles.map((article) => (
                  <div 
                    key={article.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/fag/artikkel/${article.slug}`)}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{article.title}</h4>
                      {article.summary && (
                        <p className="text-sm text-gray-500">{article.summary}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {article.content_type_entity && (
                        <Badge variant="outline">
                          {article.content_type_entity.display_name}
                        </Badge>
                      )}
                      {article.category && (
                        <Badge className="bg-blue-100 text-blue-800">
                          {article.category.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI-Enhanced Features */}
      <Card className="border-2 border-dashed border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Brain className="w-5 h-5" />
            AI-forbedrede funksjoner
          </CardTitle>
          <CardDescription className="text-blue-700">
            Nye intelligente verktøy for effektiv revisjonsplanlegging
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={() => navigate('/fag/revisjonshandlinger')}
              variant="outline" 
              className="justify-start border-blue-200 hover:bg-blue-100"
            >
              <Target className="w-4 h-4 mr-2" />
              AI Revisjonshandlinger Generator
              {!templatesLoading && totalActionTemplates > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {totalActionTemplates} maler
                </Badge>
              )}
            </Button>
            <Button 
              onClick={() => navigate('/fag/upload')}
              variant="outline" 
              className="justify-start border-blue-200 hover:bg-blue-100"
            >
              <FileText className="w-4 h-4 mr-2" />
              Intelligent Dokumentanalyse
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImprovedKnowledgeOverview;
