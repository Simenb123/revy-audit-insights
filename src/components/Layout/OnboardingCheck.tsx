
import React from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Navigate } from 'react-router-dom';

interface OnboardingCheckProps {
  children: React.ReactNode;
}

const OnboardingCheck = ({ children }: OnboardingCheckProps) => {
  const { data: userProfile, isLoading } = useUserProfile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Laster...</p>
        </div>
      </div>
    );
  }

  // If user has no audit firm, redirect to organization setup
  if (userProfile && !userProfile.auditFirmId) {
    return <Navigate to="/organisasjon/oppsett" replace />;
  }

  return <>{children}</>;
};

export default OnboardingCheck;
