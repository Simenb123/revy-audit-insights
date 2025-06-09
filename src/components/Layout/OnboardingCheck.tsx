
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

  console.log('OnboardingCheck - userProfile:', userProfile);
  console.log('OnboardingCheck - isLoading:', isLoading);
  console.log('OnboardingCheck - error:', error);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Laster brukerdata...</p>
        </div>
      </div>
    );
  }

  // If there's an error loading profile or no profile exists, redirect to setup
  if (error || !userProfile) {
    console.error('User profile error or missing:', error);
    return <Navigate to="/organisasjon/oppsett" replace />;
  }

  // If user has no audit firm, redirect to organization setup
  if (userProfile && !userProfile.auditFirmId) {
    console.log('User has no audit firm, redirecting to setup');
    return <Navigate to="/organisasjon/oppsett" replace />;
  }

  console.log('OnboardingCheck passed, rendering children');
  return <>{children}</>;
};

export default OnboardingCheck;
