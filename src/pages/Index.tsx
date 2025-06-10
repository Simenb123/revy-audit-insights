
import React from 'react';
import RoleDashboard from '@/components/Dashboard/RoleDashboard';

const Index = () => {
  return (
    <div className="w-full px-4 py-6 md:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashbord</h1>
        <p className="text-muted-foreground mt-1">
          Oversikt tilpasset din rolle og arbeidsoppgaver
        </p>
      </div>
      
      <RoleDashboard />
    </div>
  );
};

export default Index;
