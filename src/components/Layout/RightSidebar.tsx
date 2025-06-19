import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  BarChart3, 
  Activity, 
  TrendingUp,
  Users,
  FileText,
  Brain,
  Maximize2,
  Minimize2,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
  X,
  BookOpen,
  Settings
} from 'lucide-react';
import SmartRevyAssistant from '../Revy/SmartRevyAssistant';
import AIRevyVariantSelector from '../AI/AIRevyVariantSelector';
import { useLocation } from 'react-router-dom';
import { useAIUsage } from '@/hooks/useAIUsage';
import { useRevyContext } from '../RevyContext/RevyContextProvider';
import { useIsMobile } from "@/hooks/use-mobile";

interface RightSidebarProps {
  isCollapsed: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onToggleExpanded: () => void;
}

const RightSidebar = ({ isCollapsed, isExpanded, onToggle, onToggleExpanded }: RightSidebarProps) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('revy');
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const { personalStats } = useAIUsage('week');
  const { currentClient } = useRevyContext();
  const isMobile = useIsMobile();

  // Detect current context based on URL and location
  const getCurrentContext = () => {
    const path = location.pathname;
    if (path.includes('/dokumenter') || path.includes('documents')) {
      return 'documentation';
    } else if (path.includes('/revisjonshandlinger') || path.includes('audit-actions')) {
      return 'audit-actions';
    } else if (path.includes('/klienter/') && path.match(/\/\d+$/)) {
      return 'client-detail';
    } else if (path.includes('/planlegging')) {
      return 'planning';
    } else if (path.includes('/gjennomforing')) {
      return 'execution';
    } else if (path.includes('/avslutning')) {
      return 'completion';
    }
    return 'general';
  };

  const currentContext = getCurrentContext();

  // Context display information
  const getContextInfo = (context: string) => {
    const contextMap = {
      'documentation': {
        name: 'Dokumentanalyse',
        description: 'Hjelper med dokumentkategorisering og kvalitetssikring',
        color: 'bg-blue-100 text-blue-800',
        icon: FileText
      },
      'audit-actions': {
        name: 'Revisjonshandlinger',
        description: 'Veileder om ISA-standarder og revisjonshandlinger',
        color: 'bg-green-100 text-green-800',
        icon: BookOpen
      },
      'client-detail': {
        name: 'Klientdetaljer',
        description: 'Analyser klientinfo og risikovurdering',
        color: 'bg-purple-100 text-purple-800',
        icon: Users
      },
      'planning': {
        name: 'Planlegging',
        description: 'Hjelper med revisjonsplanlegging',
        color: 'bg-yellow-100 text-yellow-800',
        icon: Settings
      },
      'execution': {
        name: 'Gjennomføring',
        description: 'Støtter revisjonsgjennomføring',
        color: 'bg-orange-100 text-orange-800',
        icon: Activity
      },
      'completion': {
        name: 'Avslutning',
        description: 'Hjelper med revisjonsavslutning',
        color: 'bg-red-100 text-red-800',
        icon: TrendingUp
      },
      'general': {
        name: 'Generell assistanse',
        description: 'Hjelper med alle revisjonsrelaterte spørsmål',
        color: 'bg-gray-100 text-gray-800',
        icon: Brain
      }
    };
    return contextMap[context as keyof typeof contextMap] || contextMap.general;
  };

  const contextInfo = getContextInfo(currentContext);

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

  // Handle variant changes with immediate feedback
  const handleVariantChange = (variant: any) => {
    setSelectedVariant(variant);
    console.log(`🔄 Variant changed to: ${variant.name} (${variant.display_name})`);
  };

  // Completely collapsed state - show minimal sidebar with icons only
  if (isCollapsed) {
    return (
      <div className="h-full flex flex-col bg-sidebar border-l border-sidebar-border w-full">
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
            className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent mx-auto relative"
            title="Smart Revy AI"
          >
            <MessageSquare className="h-4 w-4" />
            {/* Smart indicator */}
            <div className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-0.5">
              <Sparkles className="h-2 w-2 text-white" />
            </div>
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

  // Expanded state - show full sidebar with context-aware AI-Revi
  return (
    <div className="h-full flex flex-col w-full overflow-hidden bg-background">
      {/* Header with toggle and expand controls */}
      <div className={`border-b border-border flex items-center justify-between flex-shrink-0 ${isMobile ? 'p-3' : 'p-4'}`}>
        <div className="flex items-center gap-2">
          <h3 className={`font-semibold ${isMobile ? 'text-lg' : 'text-base'}`}>AI-Verktøy</h3>
          {/* Enhanced context indicator with variant info */}
          <Badge className={`text-xs ${contextInfo.color}`}>
            <contextInfo.icon className="h-3 w-3 mr-1" />
            {contextInfo.name}
          </Badge>
          {selectedVariant && (
            <Badge className="text-xs bg-purple-100 text-purple-800">
              {selectedVariant.display_name.replace('AI-Revi ', '')}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleExpanded}
              className="h-8 w-8 hover:bg-accent"
              title={isExpanded ? "Normaliser størrelse" : "Utvid over hele siden"}
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8 hover:bg-accent"
            title={isMobile ? "Lukk" : "Trekk inn sidebar"}
          >
            {isMobile ? <X className="h-4 w-4" /> : <PanelRightClose className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className={`grid w-full grid-cols-3 flex-shrink-0 ${isMobile ? 'mx-3 mt-2' : 'mx-4 mt-3'}`}>
            <TabsTrigger value="revy" className={`relative ${isMobile ? 'text-xs px-2 py-3' : 'text-sm px-3 py-2'}`}>
              <MessageSquare className={`${isMobile ? 'h-5 w-5 mr-1' : 'h-4 w-4 mr-2'}`} />
              {!isMobile && 'AI-Revi'}
              {/* Smart indicator */}
              <div className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-0.5">
                <Sparkles className="h-2 w-2 text-white" />
              </div>
            </TabsTrigger>
            <TabsTrigger value="analytics" className={isMobile ? 'text-xs px-2 py-3' : 'text-sm px-3 py-2'}>
              <BarChart3 className={`${isMobile ? 'h-5 w-5 mr-1' : 'h-4 w-4 mr-2'}`} />
              {!isMobile && 'Data'}
            </TabsTrigger>
            <TabsTrigger value="activity" className={isMobile ? 'text-xs px-2 py-3' : 'text-sm px-3 py-2'}>
              <Activity className={`${isMobile ? 'h-5 w-5 mr-1' : 'h-4 w-4 mr-2'}`} />
              {!isMobile && 'Aktivitet'}
            </TabsTrigger>
          </TabsList>
          
          <div className="flex-1 min-h-0 px-2">
            <TabsContent value="revy" className="h-full m-0 p-2 data-[state=inactive]:hidden">
              <div className="h-full flex flex-col space-y-3">
                {/* Context info and variant selector */}
                <Card className="flex-shrink-0">
                  <CardContent className="p-3">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <contextInfo.icon className="h-4 w-4 text-purple-600" />
                        <div>
                          <p className="text-sm font-medium">{contextInfo.name}</p>
                          <p className="text-xs text-muted-foreground">{contextInfo.description}</p>
                        </div>
                      </div>
                      
                      {/* Variant selector with change handler */}
                      <div className="border-t pt-2">
                        <AIRevyVariantSelector
                          currentContext={currentContext}
                          onVariantChange={handleVariantChange}
                          compact={true}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Context-aware AI Assistant */}
                <div className="flex-1 min-h-0">
                  <SmartRevyAssistant 
                    embedded={true} 
                    context={currentContext as any}
                    selectedVariant={selectedVariant}
                    clientData={{
                      ...currentClient,
                      documentContext: currentContext === 'documentation' ? {
                        currentTab: 'documents',
                        documentStats: {
                          total: 0,
                          categorized: 0,
                          uncategorized: 0,
                          qualityScore: 0
                        }
                      } : undefined
                    }}
                    userRole="employee"
                    onContextChange={(newContext) => {
                      console.log(`🔄 Context change detected: ${newContext}`);
                    }}
                  />
                </div>
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
                  {/* Activity items */}
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

                  {/* Context-aware activity */}
                  <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded text-sm">
                    <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="min-w-0 flex-1">
                      <span className="truncate block font-medium">
                        AI-Revi i {contextInfo.name} modus {selectedVariant && `(${selectedVariant.display_name.replace('AI-Revi ', '')})`}
                      </span>
                      <span className="text-muted-foreground text-xs">{contextInfo.description}</span>
                    </div>
                  </div>

                  {personalStats && personalStats.summary.totalRequests > 0 && (
                    <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded text-sm">
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="min-w-0 flex-1">
                        <span className="truncate block font-medium">Smart AI brukt {personalStats.summary.totalRequests} ganger</span>
                        <span className="text-muted-foreground text-xs">denne uken</span>
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
