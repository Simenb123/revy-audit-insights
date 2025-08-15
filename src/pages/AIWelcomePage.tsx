import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Zap, 
  FileText, 
  BarChart3, 
  Search, 
  Shield, 
  TrendingUp,
  Users,
  Activity,
  ArrowRight,
  Sparkles,
  Target,
  Award
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AIWelcomePage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: FileText,
      title: 'Smart Dokumentanalyse',
      description: 'AI-drevet analyse av dokumenter med automatisk kategorisering og innsiktsutvinning',
      color: 'bg-blue-500',
      route: '/ai/documents'
    },
    {
      icon: TrendingUp,
      title: 'Prediktiv Analyse',
      description: 'Forutsi trender og identifiser potensielle risikoer før de oppstår',
      color: 'bg-green-500',
      route: '/ai/predictive'
    },
    {
      icon: Search,
      title: 'Intelligent Søk',
      description: 'Svar på komplekse spørsmål basert på semantisk forståelse av innhold',
      color: 'bg-purple-500',
      route: '/ai/search'
    },
    {
      icon: Shield,
      title: 'Risikovurdering',
      description: 'Automatisk identifikasjon og vurdering av revisjonsrisiko med AI',
      color: 'bg-red-500',
      route: '/ai/risk'
    },
    {
      icon: BarChart3,
      title: 'Benchmarking',
      description: 'Sammenlign klientdata mot bransjestandard med intelligente innsikter',
      color: 'bg-orange-500',
      route: '/ai/benchmarking'
    },
    {
      icon: Brain,
      title: 'AI-assistert Chat',
      description: 'Kontekstuell AI-assistent som forstår dine revisjonsutfordringer',
      color: 'bg-indigo-500',
      route: '/ai/chat'
    }
  ];

  const stats = [
    { label: 'AI-modeller Aktive', value: '5', icon: Brain },
    { label: 'Dokumenter Analysert', value: '12.4K', icon: FileText },
    { label: 'Timer Spart', value: '340', icon: Zap },
    { label: 'Nøyaktighet', value: '97.8%', icon: Target }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="text-center space-y-6 py-12">
        <div className="flex items-center justify-center mb-6">
          <div className="h-20 w-20 bg-gradient-to-br from-primary via-primary/80 to-primary/60 rounded-2xl flex items-center justify-center shadow-lg">
            <Brain className="h-10 w-10 text-white" />
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent">
            AI Revio Platform
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Revolusjonér revisjonsarbeidet med kunstig intelligens. 
            Automatiser rutineoppgaver, få dype innsikter, og gjør smartere beslutninger.
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 pt-4">
          <Badge variant="success" className="animate-pulse">
            <Activity className="h-3 w-3 mr-1" />
            Alle AI-systemer operasjonelle
          </Badge>
          <Badge variant="secondary">
            <Sparkles className="h-3 w-3 mr-1" />
            5 AI-modeller aktive
          </Badge>
        </div>

        <div className="flex items-center justify-center gap-4 pt-6">
          <Button 
            size="lg" 
            onClick={() => navigate('/ai-command')}
            className="gap-2 hover-scale"
          >
            Start AI-analyse
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => navigate('/system/performance')}
            className="gap-2"
          >
            <Activity className="h-4 w-4" />
            Se Ytelse
          </Button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover-scale">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Features Grid */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">AI-funksjoner</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Utforsk våre kraftige AI-drevne verktøy designet spesifikt for moderne revisjonsutfordringer
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group cursor-pointer hover-scale transition-all duration-300 hover:shadow-xl border-2 hover:border-primary/20"
              onClick={() => navigate(feature.route)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 ${feature.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="group-hover:text-primary transition-colors">
                      {feature.title}
                    </CardTitle>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Start Section */}
      <Card className="bg-gradient-to-r from-primary/5 via-purple-500/5 to-blue-500/5 border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Kom i gang med AI
          </CardTitle>
          <CardDescription className="text-base">
            Følg disse enkle stegene for å utnytte AI-kraften i revisjonsarbeidet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-3">
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-lg font-bold text-primary">1</span>
              </div>
              <h3 className="font-medium">Velg Klient</h3>
              <p className="text-sm text-muted-foreground">
                Start med å velge en klient fra AI Command Center
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-lg font-bold text-primary">2</span>
              </div>
              <h3 className="font-medium">Kjør AI-analyse</h3>
              <p className="text-sm text-muted-foreground">
                La AI analysere dokumenter og generere innsikter
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-lg font-bold text-primary">3</span>
              </div>
              <h3 className="font-medium">Få Resultater</h3>
              <p className="text-sm text-muted-foreground">
                Motta automatiske rapporter og handlingsanbefalinger
              </p>
            </div>
          </div>

          <div className="text-center pt-6">
            <Button 
              size="lg" 
              onClick={() => navigate('/ai-command')}
              className="gap-2"
            >
              Start din første AI-analyse
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Achievement Section */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Award className="h-6 w-6 text-yellow-500" />
            AI-prestasjoner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-green-600">97.8%</div>
              <p className="text-sm text-muted-foreground">Nøyaktighet i dokumentkategorisering</p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-blue-600">340+</div>
              <p className="text-sm text-muted-foreground">Timer spart gjennom automatisering</p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-purple-600">12.4K</div>
              <p className="text-sm text-muted-foreground">Dokumenter analysert med AI</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIWelcomePage;