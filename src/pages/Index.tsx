
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, BarChart2, FileUp, FolderOpen, Search } from 'lucide-react';
import DashboardGrid from '@/components/Dashboard/DashboardGrid';
import FileUploader from '@/components/DataUpload/FileUploader';
import DrillDownTable from '@/components/DataAnalysis/DrillDownTable';
import { useRevyContext } from '@/components/RevyContext/RevyContextProvider';
import { RevyContext } from '@/types/revio';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { setContext } = useRevyContext();
  
  // Update RevyContext when tab changes
  useEffect(() => {
    const contextMap: Record<string, RevyContext> = {
      'dashboard': 'dashboard',
      'upload': 'general',
      'drilldown': 'drill-down'
    };
    
    setContext(contextMap[activeTab] || 'general');
  }, [activeTab, setContext]);
  
  return (
    <div className="w-full px-4 py-6 md:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Velkommen til Revio</h1>
          <p className="text-muted-foreground mt-1">
            Din revisjonshjelper for effektiv analyse og dokumentasjon
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="gap-2">
            <Search size={16} />
            <span>Søk</span>
          </Button>
          <Button variant="outline" className="gap-2">
            <FolderOpen size={16} />
            <span>Prosjekter</span>
          </Button>
          <Button className="gap-2 bg-revio-500 hover:bg-revio-600">
            <ArrowUpRight size={16} />
            <span>Ny revisjon</span>
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart2 size={16} />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <FileUp size={16} />
            <span>Last opp</span>
          </TabsTrigger>
          <TabsTrigger value="drilldown" className="flex items-center gap-2">
            <Search size={16} />
            <span>Drill-down</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="mt-6 w-full">
          <DashboardGrid />
        </TabsContent>
        
        <TabsContent value="upload" className="mt-6 w-full">
          <div className="grid grid-cols-1 gap-6">
            <FileUploader />
            
            <div className="bg-revio-50 border border-revio-100 rounded-lg p-6 flex items-center gap-4">
              <div className="bg-white p-4 rounded-full">
                <img 
                  src="/lovable-uploads/f813b1e2-df71-4a18-b810-b8b775bf7c90.png" 
                  alt="Revy" 
                  className="w-16 h-16 object-contain"
                />
              </div>
              <div>
                <h3 className="text-lg font-medium text-revio-900">Revy tips</h3>
                <p className="text-revio-800">
                  For å laste opp regnskapsdata til en spesifikk klient, gå til 
                  klienten under "Klienter" og velg "Regnskapsdata" fanen.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="drilldown" className="mt-6 w-full">
          <DrillDownTable />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
