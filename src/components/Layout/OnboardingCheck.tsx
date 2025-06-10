
import React from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/components/Auth/AuthProvider';

interface OnboardingCheckProps {
  children: React.ReactNode;
}

const OnboardingCheck = ({ children }: OnboardingCheckProps) => {
  const { session } = useAuth();
  const { data: userProfile, isLoading, error } = useUserProfile();

  console.log('OnboardingCheck - session exists:', !!session);
  console.log('OnboardingCheck - userProfile:', userProfile);
  console.log('OnboardingCheck - isLoading:', isLoading);
  console.log('OnboardingCheck - error:', error);

  // No session = not authenticated
  if (!session) {
    console.log('OnboardingCheck - No session, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // Still loading profile data
  if (isLoading) {
    console.log('OnboardingCheck - Loading profile...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Laster brukerdata...</p>
        </div>
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
