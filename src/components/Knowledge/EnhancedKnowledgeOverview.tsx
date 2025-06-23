
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useKnowledgeStats, useRecentArticles, useTotalArticleCount } from '@/hooks/knowledge/useKnowledgeStats';
import { useAuditActionTemplateCount } from '@/hooks/knowledge/useAuditActionTemplatesPreview';

const EnhancedKnowledgeOverview = () => {
  const navigate = useNavigate();
  const { data: knowledgeStats, isLoading: statsLoading, error: statsError } = useKnowledgeStats();
  const { data: recentArticles, isLoading: articlesLoading, error: articlesError } = useRecentArticles(3);
  const { data: totalArticles, isLoading: totalLoading, error: totalError } = useTotalArticleCount();
  const { data: totalActionTemplates, isLoading: templatesLoading, error: templatesError } = useAuditActionTemplateCount();

  console.log('📊 [KNOWLEDGE_OVERVIEW] Loading states:', {
    statsLoading,
    articlesLoading,
    totalLoading,
    templatesLoading
  });

  console.log('📊 [KNOWLEDGE_OVERVIEW] Data:', {
    knowledgeStats,
    totalArticles,
    totalActionTemplates,
    recentArticlesCount: recentArticles?.length
  });

  console.log('📊 [KNOWLEDGE_OVERVIEW] Errors:', {
    statsError: statsError?.message,
    articlesError: articlesError?.message,
    totalError: totalError?.message,
    templatesError: templatesError?.message
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

  // Transform knowledge stats into categories display
  const categories = knowledgeStats?.map(category => ({
    id: category.id,
    name: category.name,
    count: category.article_count,
    description: category.description || 'Fagartikler og ressurser',
    color: getColorForCategory(category.name)
  })) || [];

  // Add subject areas as categories if we have audit action data
  if (totalActionTemplates && totalActionTemplates > 0) {
    categories.push({
      id: 'audit-actions',
      name: 'Revisjonshandlinger',
      count: totalActionTemplates,
      description: 'Standardiserte handlingsmaler',
      color: 'bg-orange-100 text-orange-800'
    });
  }

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
    };
    return colorMap[name] || 'bg-gray-100 text-gray-800';
  }

  const handleCategoryClick = (category: any) => {
    if (category.id === 'audit-actions') {
      navigate('/fag/revisjonshandlinger');
    } else {
      navigate(`/fag/kategori/${category.id}`);
    }
  };

  // Show loading state
  if (statsLoading || totalLoading) {
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

  // Show error state if we have critical errors
  if (statsError || totalError) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Fagstoff</h1>
          <div className="text-red-600">
            <p>Feil ved lasting av fagstoff:</p>
            <p className="text-sm">{statsError?.message || totalError?.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">Fagstoff</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Tilgang til {totalArticles || 0} revisjonsartikler, standarder, veiledninger og avansert dokumenthåndtering
        </p>
      </div>

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
      {categories.length > 0 ? (
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
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ingen fagstoff funnet</h3>
            <p className="text-gray-500 mb-4">Det ser ut til at det ikke er noe fagstoff tilgjengelig ennå.</p>
            <Button onClick={() => navigate('/fag/ny-artikkel')}>
              <PlusCircle className="w-4 h-4 mr-2" />
              Opprett første artikkel
            </Button>
          </CardContent>
        </Card>
      )}

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
              {!templatesLoading && totalActionTemplates && (
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

export default EnhancedKnowledgeOverview;
