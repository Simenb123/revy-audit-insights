
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
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EnhancedKnowledgeOverview = () => {
  const navigate = useNavigate();

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

  const categories = [
    {
      name: 'ISA-standarder',
      count: 42,
      description: 'Internasjonale revisjonstandarder',
      color: 'bg-blue-100 text-blue-800'
    },
    {
      name: 'NRS-standarder', 
      count: 18,
      description: 'Norske revisjonstandarder',
      color: 'bg-green-100 text-green-800'
    },
    {
      name: 'Lovgivning',
      count: 156,
      description: 'Relevante lover og forskrifter',
      color: 'bg-purple-100 text-purple-800'
    },
    {
      name: 'Revisjonshandlinger',
      count: 89,
      description: 'Standardiserte handlingsmaler',
      color: 'bg-orange-100 text-orange-800'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">Fagstoff</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Tilgang til revisjonsartikler, standarder, veiledninger og avansert dokumenthåndtering
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((category, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
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
            {[
              {
                title: 'ISA 315 - Identifisering og vurdering av risiko',
                description: 'Oppdatert guide for risikovurdering',
                badge: 'Ny',
                badgeColor: 'bg-green-100 text-green-800'
              },
              {
                title: 'Vesentlighetsvurdering 2024',
                description: 'Nye retningslinjer for vesentlighet', 
                badge: 'Oppdatert',
                badgeColor: 'bg-blue-100 text-blue-800'
              },
              {
                title: 'AI-forbedret dokumentanalyse',
                description: 'Ny funksjonalitet for automatisk kategorisering',
                badge: 'AI',
                badgeColor: 'bg-purple-100 text-purple-800'
              }
            ].map((article, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{article.title}</h4>
                  <p className="text-sm text-gray-500">{article.description}</p>
                </div>
                <Badge className={article.badgeColor}>
                  {article.badge}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
