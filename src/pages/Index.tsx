
import React from 'react';
import RoleDashboard from '@/components/Dashboard/RoleDashboard';

const Index = () => {
  return (
    <div className="h-full w-full">
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
    </div>
  );
};

export default Index;
