
import React, { useState } from 'react';
import ProfileSetupForm from '../Onboarding/ProfileSetupForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Sparkles, Users, TrendingUp } from 'lucide-react';

interface OnboardingCheckProps {
  children?: React.ReactNode;
}

const OnboardingCheck: React.FC<OnboardingCheckProps> = ({ children }) => {
  const [showProfileForm, setShowProfileForm] = useState(false);

  const features = [
    {
      icon: Brain,
      title: "AI-drevet analyse",
      description: "Automatisk dokumentanalyse og intelligente forslag"
    },
    {
      icon: TrendingUp,
      title: "Økt effektivitet",
      description: "Spar tid med automatiserte arbeidsflyter"
    },
    {
      icon: Users,
      title: "Team-samarbeid",
      description: "Sømløst samarbeid i revisjonsgrupper"
    },
    {
      icon: Sparkles,
      title: "Faglig støtte",
      description: "Tilgang til omfattende kunnskapsbase"
    }
  ];

  if (showProfileForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
        <ProfileSetupForm onComplete={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full space-y-8">
        {/* Welcome Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
              <Brain className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            Velkommen til AI Revy
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Din intelligente revisjonspartner som kombinerer AI-teknologi med faglig ekspertise. 
            La oss få deg satt opp og klar til å begynne.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="text-center">
              <CardHeader className="pb-4">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription className="text-sm">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Main Setup Card */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">La oss sette opp profilen din</CardTitle>
            <CardDescription className="text-lg">
              Dette tar bare noen minutter og hjelper oss å tilpasse opplevelsen for deg
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-6 space-y-3">
              <h3 className="font-semibold">Hva skjer neste?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  Fortell oss om deg selv og din rolle
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  Oppgi informasjon om ditt arbeidssted
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  Få tilgang til alle funksjoner tilpasset din rolle
                </li>
              </ul>
            </div>
            
            <div className="text-center">
              <button
                onClick={() => setShowProfileForm(true)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6"
              >
                Kom i gang
              </button>
            </div>
            
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingCheck;
