import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Users, 
  BookOpen, 
  TrendingUp, 
  Zap, 
  ArrowRight,
  CheckCircle,
  Star,
  Target,
  GraduationCap,
  MessageSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';

const WelcomeDashboard = () => {
  const { data: userProfile } = useUserProfile();

  const quickActions = [
    {
      title: "Mine klienter",
      description: "Se oversikt over alle dine klienter og deres revisjonstatus",
      icon: Users,
      href: "/clients",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Start ny revisjon",
      description: "Opprett en ny klient eller start revisjonsarbeid",
      icon: Target,
      href: "/clients",
      color: "text-green-600", 
      bgColor: "bg-green-50"
    },
    {
      title: "Kunnskapsbase",
      description: "Utforsk fagartikler og revisjonsveiledninger",
      icon: BookOpen,
      href: "/fag",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "AI Revy Assistent",
      description: "Få AI-drevet hjelp til revisjonsarbeid",
      icon: Brain,
      href: "/clients",
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ];

  const recentFeatures = [
    {
      title: "AI-drevet dokumentanalyse",
      description: "Automatisk analyse av regnskapsdokumenter",
      status: "new"
    },
    {
      title: "Forbedret risikomatrise",
      description: "Ny visuell fremstilling av klientrisiko",
      status: "updated"
    },
    {
      title: "Team-samarbeid",
      description: "Nye verktøy for samarbeid i revisjonsgrupper",
      status: "new"
    }
  ];

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="text-center space-y-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Velkommen til AI Revy
            {userProfile?.firstName && (
              <span className="text-primary">, {userProfile.firstName}</span>
            )}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Din intelligente revisjonspartner som kombinerer AI-teknologi med faglig ekspertise 
            for mer effektiv og nøyaktig revisjonsarbeid.
          </p>
        </div>
        
        <div className="flex items-center justify-center gap-4 pt-4">
          <Badge variant="secondary" className="px-3 py-1">
            <Star className="w-3 h-3 mr-1" />
            AI-drevet
          </Badge>
          <Badge variant="secondary" className="px-3 py-1">
            <CheckCircle className="w-3 h-3 mr-1" />
            ISA-standarder
          </Badge>
          <Badge variant="secondary" className="px-3 py-1">
            <TrendingUp className="w-3 h-3 mr-1" />
            Økt effektivitet
          </Badge>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickActions.map((action, index) => (
          <Link key={index} to={action.href}>
            <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer h-full">
              <CardHeader className="pb-4">
                <div className={`w-12 h-12 rounded-lg ${action.bgColor} flex items-center justify-center mb-3`}>
                  <action.icon className={`w-6 h-6 ${action.color}`} />
                </div>
                <CardTitle className="text-lg">{action.title}</CardTitle>
                <CardDescription className="text-sm">
                  {action.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-primary text-sm font-medium">
                  Kom i gang
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Getting Started */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Kom raskt i gang
            </CardTitle>
            <CardDescription>
              Følg disse trinnene for å maksimere nytten av AI Revy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <h4 className="font-medium">Opprett din første klient</h4>
                  <p className="text-sm text-muted-foreground">
                    Legg inn klientinformasjon og start revisjonsarbeidet
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <h4 className="font-medium">Last opp dokumenter</h4>
                  <p className="text-sm text-muted-foreground">
                    AI-en analyserer automatisk regnskapsdokumenter
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <h4 className="font-medium">Utforsk AI-assistenten</h4>
                  <p className="text-sm text-muted-foreground">
                    Få intelligente forslag og svar på faglige spørsmål
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Link to="/clients">
                <Button className="w-full">
                  Start med første klient
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Updates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Siste oppdateringer
            </CardTitle>
            <CardDescription>
              Nye funksjoner og forbedringer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentFeatures.map((feature, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-start justify-between">
                  <h4 className="font-medium text-sm">{feature.title}</h4>
                  <Badge 
                    variant={feature.status === 'new' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {feature.status === 'new' ? 'Ny' : 'Oppdatert'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {feature.description}
                </p>
                {index < recentFeatures.length - 1 && (
                  <hr className="my-3" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Help Section */}
      <Card>
        <CardContent className="py-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold">Trenger du hjelp?</h3>
            <p className="text-muted-foreground">
              Utforsk våre ressurser eller kontakt support for å komme raskt i gang
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/fag">
                <Button variant="outline" size="sm">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Kunnskapsbase
                </Button>
              </Link>
              <Link to="/training">
                <Button variant="outline" size="sm">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Opplæring
                </Button>
              </Link>
              <Button variant="outline" size="sm">
                <MessageSquare className="w-4 h-4 mr-2" />
                Kontakt support
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WelcomeDashboard;