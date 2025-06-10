
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

  console.log('OnboardingCheck - session:', !!session);
  console.log('OnboardingCheck - userProfile:', userProfile);
  console.log('OnboardingCheck - isLoading:', isLoading);
  console.log('OnboardingCheck - error:', error);

  // Don't redirect if we're still loading
  if (isLoading) {
    console.log('OnboardingCheck - Still loading, showing loading state');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Laster brukerdata...</p>
        </div>
      </div>
    );
  }

  // If no session, something is wrong with auth
  if (!session) {
    console.log('OnboardingCheck - No session, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // If there's an error loading profile, redirect to setup
  if (error) {
    console.error('OnboardingCheck - Profile error:', error);
    return <Navigate to="/organisasjon/oppsett" replace />;
  }

  // If user profile exists and has audit firm, allow access
  if (userProfile && userProfile.auditFirmId) {
    console.log('OnboardingCheck - User has profile and audit firm, allowing access');
    return <>{children}</>;
  }

  // If user profile exists but no audit firm, redirect to setup
  if (userProfile && !userProfile.auditFirmId) {
    console.log('OnboardingCheck - User has profile but no audit firm, redirecting to setup');
    return <Navigate to="/organisasjon/oppsett" replace />;
  }

  // If we get here and still no profile, redirect to setup
  console.log('OnboardingCheck - No user profile found, redirecting to setup');
  return <Navigate to="/organisasjon/oppsett" replace />;
};

export default OnboardingCheck;
