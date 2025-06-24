
import React from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/components/Auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface OnboardingCheckProps {
  children: React.ReactNode;
}

const OnboardingCheck = ({ children }: OnboardingCheckProps) => {
  const { session, isLoading: authLoading } = useAuth();
  const { data: userProfile, isLoading: profileLoading, error } = useUserProfile();

  console.log('OnboardingCheck - session exists:', !!session);
  console.log('OnboardingCheck - userProfile:', userProfile);
  console.log('OnboardingCheck - authLoading:', authLoading);
  console.log('OnboardingCheck - profileLoading:', profileLoading);
  console.log('OnboardingCheck - error:', error);

  // Still loading authentication or profile data
  if (authLoading || (session && profileLoading)) {
    console.log('OnboardingCheck - Loading...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Laster brukerdata...</p>
        </div>
      </div>
    );
  }

  // No session = not authenticated, show guest mode option
  if (!session) {
    console.log('OnboardingCheck - No session, showing guest/auth options');
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-[400px]">
          <CardHeader className="text-center">
            <CardTitle>Velkommen til AI Revi</CardTitle>
            <CardDescription>
              Logg inn for full tilgang eller prøv som gjest
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full" 
              onClick={() => window.location.href = '/auth'}
            >
              Logg inn
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                // Enable guest mode by proceeding without auth
                console.log('Enabling guest mode');
              }}
            >
              Fortsett som gjest (begrenset tilgang)
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error loading profile or no profile exists = needs setup
  if (error || !userProfile || !userProfile.auditFirmId) {
    console.log('OnboardingCheck - Profile missing or no firm, redirecting to setup');
    return <Navigate to="/organisasjon/oppsett" replace />;
  }

  // All good - user has profile and firm
  console.log('OnboardingCheck - User ready, showing content');
  return <>{children}</>;
};

export default OnboardingCheck;
