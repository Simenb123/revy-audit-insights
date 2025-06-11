
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare, 
  BarChart3, 
  Activity, 
  ChevronRight,
  TrendingUp,
  Users,
  FileText,
  Brain,
  DollarSign
} from 'lucide-react';
import RevyAssistant from '../Revy/RevyAssistant';
import { useLocation } from 'react-router-dom';
import { useAIUsage } from '@/hooks/useAIUsage';

interface RightSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  clientData?: any;
  userRole?: string;
}

const RightSidebar = ({ isCollapsed, onToggle, clientData, userRole }: RightSidebarProps) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('revy');
  const { personalStats } = useAIUsage('week');

  // Mock analytics data - would be replaced with real data
  const analyticsData = {
    clients: 24,
    activeProjects: 8,
    pendingReviews: 5,
    completionRate: 92
  };

  // If completely collapsed, don't render the sidebar at all
  if (isCollapsed) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('no-NO', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4
    }).format(amount);
  };

  return (
    <div className="bg-white border-l border-border h-full flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-sm">Verktøy</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-6 w-6"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
            <TabsTrigger value="revy" className="text-xs">
              <MessageSquare className="h-3 w-3 mr-1" />
              Revy
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs">
              <BarChart3 className="h-3 w-3 mr-1" />
              Data
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              Aktivitet
            </TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-auto p-4">
            <TabsContent value="revy" className="h-full m-0">
              <div className="h-full">
                <RevyAssistant 
                  embedded={true} 
                  clientData={clientData}
                  userRole={userRole}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="analytics" className="space-y-4 m-0">
              {/* AI Usage Stats */}
              {personalStats && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      AI-bruk (uke)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Kostnad</span>
                      <span className="font-medium">
                        {formatCurrency(personalStats.summary.totalCost)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Forespørsler</span>
                      <span className="font-medium">{personalStats.summary.totalRequests}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Tokens</span>
                      <span className="font-medium">
                        {personalStats.summary.totalTokens.toLocaleString('no-NO')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Card className="p-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Klienter</p>
                      <p className="text-sm font-semibold">{analyticsData.clients}</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Prosjekter</p>
                      <p className="text-sm font-semibold">{analyticsData.activeProjects}</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-3">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Ventende</p>
                      <p className="text-sm font-semibold">{analyticsData.pendingReviews}</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-revio-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Fullført</p>
                      <p className="text-sm font-semibold">{analyticsData.completionRate}%</p>
                    </div>
                  </div>
                </Card>
              </div>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Ukens aktivitet</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Fullførte oppgaver</span>
                    <span className="font-medium">12</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Nye klienter</span>
                    <span className="font-medium">3</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Timer registrert</span>
                    <span className="font-medium">38.5</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="activity" className="space-y-3 m-0">
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Regnskap oppdatert for Firma AS</span>
                  <span className="text-muted-foreground ml-auto">10:30</span>
                </div>
                
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Ny melding fra teamleder</span>
                  <span className="text-muted-foreground ml-auto">09:15</span>
                </div>
                
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Revisjon klar for gjennomgang</span>
                  <span className="text-muted-foreground ml-auto">08:45</span>
                </div>
                
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Dokument lastet opp</span>
                  <span className="text-muted-foreground ml-auto">07:30</span>
                </div>

                {personalStats && personalStats.summary.totalRequests > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded text-xs">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>AI-assistent brukt {personalStats.summary.totalRequests} ganger</span>
                    <span className="text-muted-foreground ml-auto">i dag</span>
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default RightSidebar;
