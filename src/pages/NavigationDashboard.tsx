
import React from 'react';
import MainNavigation from '@/components/Layout/MainNavigation';

const NavigationDashboard = () => {
  return (
    <div className="w-full px-4 py-6 md:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Hovedmeny</h1>
        <p className="text-muted-foreground mt-1">
          Velg en funksjon fra menyen under
        </p>
      </div>
      
      <MainNavigation />
    </div>
  );
};

export default NavigationDashboard;
