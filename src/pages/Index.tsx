
import React from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import WelcomeDashboard from '@/components/Welcome/WelcomeDashboard';
import RoleDashboard from '@/components/Dashboard/RoleDashboard';
import KPIWidgets from '@/components/Dashboard/KPIWidgets';
import QuickActions from '@/components/Dashboard/QuickActions';

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
      <div className="p-6 max-w-none space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Oversikt tilpasset din rolle og arbeidsoppgaver
          </p>
        </div>
        
        {/* KPI Widgets */}
        <KPIWidgets />
        
        {/* Quick Actions and Role Dashboard */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-1">
            <QuickActions />
          </div>
          <div className="md:col-span-2">
            <RoleDashboard />
          </div>
        </div>
      </div>
    </main>
  );
};

export default Index;
