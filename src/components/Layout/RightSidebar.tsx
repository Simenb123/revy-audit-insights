
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquare, 
  BarChart3, 
  Activity, 
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Users,
  FileText,
  Brain,
  Maximize2,
  Minimize2,
  PanelRightClose,
  PanelRightOpen
} from 'lucide-react';
import RevyAssistant from '../Revy/RevyAssistant';
import { useLocation } from 'react-router-dom';
import { useAIUsage } from '@/hooks/useAIUsage';
import { useRevyContext } from '../RevyContext/RevyContextProvider';

interface RightSidebarProps {
  isCollapsed: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onToggleExpanded: () => void;
}

const RightSidebar = ({ isCollapsed, isExpanded, onToggle, onToggleExpanded }: RightSidebarProps) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('revy');
  const { personalStats } = useAIUsage('week');
  const { currentClient } = useRevyContext();

  // Mock analytics data
  const analyticsData = {
    clients: 24,
    activeProjects: 8,
    pendingReviews: 5,
    completionRate: 92
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('no-NO', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4
    }).format(amount);
  };

  // Completely collapsed state - show minimal sidebar with icons only
  if (isCollapsed) {
    return (
      <div className="h-full flex flex-col bg-sidebar border-l border-sidebar-border w-[60px] flex-shrink-0">
        {/* Collapsed Toggle Button */}
        <div className="p-2 border-b border-sidebar-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent mx-auto"
            title="Utvid sidebar"
          >
            <PanelRightOpen className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Collapsed Icons */}
        <div className="flex flex-col gap-2 p-2">
          <Button
            variant={activeTab === 'revy' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => {
              setActiveTab('revy');
              onToggle();
            }}
            className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent mx-auto"
            title="Revy"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          
          <Button
            variant={activeTab === 'analytics' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => {
              setActiveTab('analytics');
              onToggle();
            }}
            className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent mx-auto"
            title="Data"
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
          
          <Button
            variant={activeTab === 'activity' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => {
              setActiveTab('activity');
              onToggle();
            }}
            className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent mx-auto"
            title="Aktivitet"
          >
            <Activity className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Expanded state - show full sidebar
  return (
    <div className="h-full flex flex-col w-full overflow-hidden bg-background">
      {/* Header with toggle and expand controls */}
      <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
        <h3 className="font-semibold text-base">Verktøy</h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleExpanded}
            className="h-8 w-8 hover:bg-accent"
            title={isExpanded ? "Normaliser størrelse" : "Utvid over hele siden"}
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8 hover:bg-accent"
            title="Trekk inn sidebar"
          >
            <PanelRightClose className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mx-4 mt-3 flex-shrink-0">
            <TabsTrigger value="revy" className="text-sm px-3 py-2">
              <MessageSquare className="h-4 w-4 mr-2" />
              Revy
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-sm px-3 py-2">
              <BarChart3 className="h-4 w-4 mr-2" />
              Data
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-sm px-3 py-2">
              <Activity className="h-4 w-4 mr-2" />
              Aktivitet
            </TabsTrigger>
          </TabsList>
          
          <div className="flex-1 min-h-0 px-2">
            <TabsContent value="revy" className="h-full m-0 p-2 data-[state=inactive]:hidden">
              <div className="h-full">
                <RevyAssistant 
                  embedded={true} 
                  clientData={currentClient}
                  userRole="employee"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="analytics" className="h-full m-0 data-[state=inactive]:hidden">
              <ScrollArea className="h-full">
                <div className="p-3 space-y-4">
                  {/* AI Usage Stats */}
                  {personalStats && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Brain className="h-4 w-4" />
                          AI-bruk
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 p-3 pt-0">
                        <div className="flex justify-between text-sm">
                          <span>Kostnad</span>
                          <span className="font-medium">
                            {formatCurrency(personalStats.summary.totalCost)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Requests</span>
                          <span className="font-medium">{personalStats.summary.totalRequests}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Tokens</span>
                          <span className="font-medium">
                            {personalStats.summary.totalTokens.toLocaleString('no-NO')}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="p-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground truncate">Klienter</p>
                          <p className="text-lg font-semibold">{analyticsData.clients}</p>
                        </div>
                      </div>
                    </Card>
                    
                    <Card className="p-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground truncate">Prosjekter</p>
                          <p className="text-lg font-semibold">{analyticsData.activeProjects}</p>
                        </div>
                      </div>
                    </Card>
                    
                    <Card className="p-3">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-orange-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground truncate">Ventende</p>
                          <p className="text-lg font-semibold">{analyticsData.pendingReviews}</p>
                        </div>
                      </div>
                    </Card>
                    
                    <Card className="p-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-revio-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground truncate">Fullført</p>
                          <p className="text-lg font-semibold">{analyticsData.completionRate}%</p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="activity" className="h-full m-0 data-[state=inactive]:hidden">
              <ScrollArea className="h-full">
                <div className="p-3 space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-muted rounded text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="min-w-0 flex-1">
                      <span className="truncate block font-medium">Regnskap oppdatert</span>
                      <span className="text-muted-foreground text-xs">10:30</span>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-muted rounded text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="min-w-0 flex-1">
                      <span className="truncate block font-medium">Ny melding</span>
                      <span className="text-muted-foreground text-xs">09:15</span>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-muted rounded text-sm">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="min-w-0 flex-1">
                      <span className="truncate block font-medium">Revisjon klar</span>
                      <span className="text-muted-foreground text-xs">08:45</span>
                    </div>
                  </div>

                  {personalStats && personalStats.summary.totalRequests > 0 && (
                    <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="min-w-0 flex-1">
                        <span className="truncate block font-medium">AI brukt {personalStats.summary.totalRequests} ganger</span>
                        <span className="text-muted-foreground text-xs">i dag</span>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default RightSidebar;
