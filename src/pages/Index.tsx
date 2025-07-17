
import React from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import WelcomeDashboard from '@/components/Welcome/WelcomeDashboard';
import RoleDashboard from '@/components/Dashboard/RoleDashboard';

const Index = () => {
  const { data: userProfile, isLoading } = useUserProfile();

  // Show loading state
  if (isLoading) {
    return (
      <main className="h-full w-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Laster...</p>
        </div>
      </main>
    );
  }

  // Show welcome dashboard for new users or when they want an overview
  // Show role-specific dashboard for returning users
  const showWelcomeDashboard = !userProfile?.firstName || new URLSearchParams(window.location.search).get('welcome') === 'true';

  if (showWelcomeDashboard) {
    return (
      <main className="h-full w-full">
        <WelcomeDashboard />
      </main>
    );
  }

  return (
    <main className="h-full w-full">
      <div className="p-6 max-w-none">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Oversikt tilpasset din rolle og arbeidsoppgaver
          </p>
        </div>
        
        <div className="w-full">
          <RoleDashboard />
        </div>
      </div>
    </main>
  );
};

export default Index;
