
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import RealTimeKPIs from './Widgets/RealTimeKPIs';
import IntelligentNotifications from './Widgets/IntelligentNotifications';
import PersonalizedWorkQueue from './Widgets/PersonalizedWorkQueue';
import ProjectCard from './Widgets/ProjectCard';
import RevenueAnalysis from './Widgets/RevenueAnalysis';
import FinancialRatios from './Widgets/FinancialRatios';

const EmployeeDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Real-time KPIs */}
      <RealTimeKPIs />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main work area */}
        <div className="lg:col-span-2 space-y-6">
          <PersonalizedWorkQueue />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProjectCard />
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ukens Fokus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Fullførte handlinger</span>
                    <span className="font-medium">23/30</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '77%' }}></div>
                  </div>
                  <p className="text-xs text-muted-foreground">7 handlinger gjenstår denne uken</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RevenueAnalysis />
            <FinancialRatios />
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          <IntelligentNotifications />
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hurtighandlinger</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <button className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors">
                📊 Ny risikoanalyse
              </button>
              <button className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors">
                📄 Importer regnskapsdata
              </button>
              <button className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors">
                👥 Opprett team-møte
              </button>
              <button className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors">
                🎯 Sett ny milepæl
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
