import React, { useState, useCallback, useMemo } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { useWidgetVirtualization } from '@/hooks/useWidgetVirtualization';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { useIntelligentCache } from '@/hooks/useIntelligentCache';
import { WidgetInteractionProvider, useWidgetInteraction } from '@/contexts/WidgetInteractionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, Filter, Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Import existing widgets
import AccountingOverview from './Widgets/AccountingOverview';
import FinancialRatios from './Widgets/FinancialRatios';
import RevenueAnalysis from './Widgets/RevenueAnalysis';
import ExpenseAnalysis from './Widgets/ExpenseAnalysis';
import RiskAssessment from './Widgets/RiskAssessment';
import ProjectCard from './Widgets/ProjectCard';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface WidgetConfig {
  id: string;
  type: string;
  title: string;
  component: React.ComponentType<any>;
  defaultProps?: Record<string, any>;
  cacheConfig?: {
    ttl?: number;
    priority?: 'low' | 'medium' | 'high';
  };
  size?: {
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
  };
}

const widgetConfigs: Record<string, WidgetConfig> = {
  accountingOverview: {
    id: 'accounting-overview',
    type: 'accountingOverview',
    title: 'Regnskapsoversikt',
    component: AccountingOverview,
    cacheConfig: { ttl: 10 * 60 * 1000, priority: 'high' },
    size: { w: 6, h: 4, minW: 4, minH: 3 }
  },
  financialRatios: {
    id: 'financial-ratios',
    type: 'financialRatios',
    title: 'Finansielle nøkkeltall',
    component: FinancialRatios,
    cacheConfig: { ttl: 15 * 60 * 1000, priority: 'medium' },
    size: { w: 3, h: 3, minW: 3, minH: 2 }
  },
  revenueAnalysis: {
    id: 'revenue-analysis',
    type: 'revenueAnalysis',
    title: 'Inntektsanalyse',
    component: RevenueAnalysis,
    cacheConfig: { ttl: 5 * 60 * 1000, priority: 'high' },
    size: { w: 3, h: 3, minW: 3, minH: 2 }
  },
  expenseAnalysis: {
    id: 'expense-analysis',
    type: 'expenseAnalysis',
    title: 'Kostnadsanalyse',
    component: ExpenseAnalysis,
    cacheConfig: { ttl: 5 * 60 * 1000, priority: 'medium' },
    size: { w: 3, h: 3, minW: 3, minH: 2 }
  },
  riskAssessment: {
    id: 'risk-assessment',
    type: 'riskAssessment',
    title: 'Risikovurdering',
    component: RiskAssessment,
    cacheConfig: { ttl: 30 * 60 * 1000, priority: 'low' },
    size: { w: 3, h: 4, minW: 3, minH: 3 }
  },
  projectCard: {
    id: 'project-card',
    type: 'projectCard',
    title: 'Prosjektdetaljer',
    component: ProjectCard,
    cacheConfig: { ttl: 2 * 60 * 1000, priority: 'medium' },
    size: { w: 6, h: 2, minW: 4, minH: 2 }
  }
};

interface VirtualizedWidgetProps {
  widgetConfig: WidgetConfig;
  isVisible: boolean;
  isLoaded: boolean;
  onObserve: (element: HTMLElement) => void;
  clientId?: string;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}

function VirtualizedWidget({
  widgetConfig,
  isVisible,
  isLoaded,
  onObserve,
  clientId,
  isMaximized,
  onToggleMaximize
}: VirtualizedWidgetProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { state: interactionState } = useWidgetInteraction();
  
  // Get filters for this widget
  const activeFilters = interactionState.activeFilters[widgetConfig.id] || [];
  
  React.useEffect(() => {
    if (ref.current) {
      onObserve(ref.current);
    }
  }, [onObserve]);

  const { data, isLoading, error, refetch } = useIntelligentCache(
    `widget:${widgetConfig.type}:${clientId || 'default'}`,
    async () => {
      // Simulate data fetching - in real app, this would fetch actual data
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
      return { widgetType: widgetConfig.type, timestamp: Date.now() };
    },
    {
      enabled: isLoaded && isVisible,
      ...widgetConfig.cacheConfig
    }
  );

  if (!isVisible) {
    return (
      <div ref={ref} className="h-full w-full flex items-center justify-center bg-muted/30 rounded-lg border-2 border-dashed border-muted">
        <div className="text-muted-foreground text-sm text-center">
          <div className="mb-2">{widgetConfig.title}</div>
          <div className="text-xs">Scroll for å laste...</div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div ref={ref} className="h-full w-full">
        <Card className="h-full animate-fade-in">
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const WidgetComponent = widgetConfig.component;

  return (
    <div ref={ref} className={cn("h-full w-full transition-all duration-200", isMaximized && "z-50")}>
      <Card className={cn("h-full shadow-sm hover:shadow-md transition-shadow", 
        isMaximized && "shadow-lg"
      )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{widgetConfig.title}</CardTitle>
          
          <div className="flex items-center space-x-1">
            {/* Active filters indicator */}
            {activeFilters.length > 0 && (
              <Badge variant="outline" className="text-xs h-5">
                <Filter className="w-3 h-3 mr-1" />
                {activeFilters.length}
              </Badge>
            )}
            
            {/* Refresh button */}
            {error && (
              <Button onClick={refetch} size="sm" variant="ghost" className="h-6 w-6 p-0">
                <RotateCcw className="w-3 h-3" />
              </Button>
            )}
            
            {/* Maximize toggle */}
            <Button onClick={onToggleMaximize} size="sm" variant="ghost" className="h-6 w-6 p-0">
              {isMaximized ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-3 pt-0 h-[calc(100%-60px)]">
          {error ? (
            <div className="text-center py-4 text-destructive text-sm">
              Feil ved lasting
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Skeleton className="h-full w-full" />
            </div>
          ) : (
            <WidgetComponent 
              className="h-full" 
              data={data}
              activeFilters={activeFilters}
              {...widgetConfig.defaultProps}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface EnhancedDashboardGridProps {
  clientId?: string;
  enabledWidgets?: string[];
  className?: string;
}

function DashboardContent({ clientId, enabledWidgets = Object.keys(widgetConfigs), className }: EnhancedDashboardGridProps) {
  const { metrics } = usePerformanceMonitor('EnhancedDashboardGrid');
  const [layouts, setLayouts] = useState<{ [key: string]: Layout[] }>(() => {
    // Load saved layouts from localStorage
    const saved = localStorage.getItem('enhanced-dashboard-layouts');
    if (saved) {
      return JSON.parse(saved);
    }
    
    // Generate default layouts
    const defaultLayout: Layout[] = enabledWidgets.map((widgetKey, index) => {
      const config = widgetConfigs[widgetKey];
      return {
        i: config.id,
        x: (index % 2) * 6,
        y: Math.floor(index / 2) * 4,
        w: config.size?.w || 6,
        h: config.size?.h || 4,
        minW: config.size?.minW,
        minH: config.size?.minH,
        maxW: config.size?.maxW,
        maxH: config.size?.maxH
      };
    });
    
    return { lg: defaultLayout };
  });
  
  const [maximizedWidget, setMaximizedWidget] = useState<string | null>(null);
  
  const widgetIds = useMemo(() => enabledWidgets.map(key => widgetConfigs[key].id), [enabledWidgets]);
  
  const {
    observeWidget,
    getWidgetState,
    shouldRenderWidget,
    isLoading,
    loadingCount
  } = useWidgetVirtualization(widgetIds, {
    threshold: 0.1,
    rootMargin: '50px',
    maxConcurrentLoads: 2,
    preloadCount: 1
  });

  const handleLayoutChange = useCallback((layout: Layout[], layouts: { [key: string]: Layout[] }) => {
    setLayouts(layouts);
    localStorage.setItem('enhanced-dashboard-layouts', JSON.stringify(layouts));
  }, []);

  const toggleMaximize = useCallback((widgetId: string) => {
    setMaximizedWidget(current => current === widgetId ? null : widgetId);
  }, []);

  const gridElements = useMemo(() => {
    return enabledWidgets.map((widgetKey) => {
      const config = widgetConfigs[widgetKey];
      const state = getWidgetState(config.id);
      const isMaximized = maximizedWidget === config.id;
      
      return (
        <div key={config.id} className={cn("transition-all duration-200", isMaximized && "!fixed !inset-4 !z-50")}>
          <VirtualizedWidget
            widgetConfig={config}
            isVisible={state.isVisible}
            isLoaded={state.isLoaded}
            onObserve={(element) => observeWidget(element, config.id)}
            clientId={clientId}
            isMaximized={isMaximized}
            onToggleMaximize={() => toggleMaximize(config.id)}
          />
        </div>
      );
    });
  }, [enabledWidgets, getWidgetState, observeWidget, clientId, maximizedWidget, toggleMaximize]);

  return (
    <div className={cn('relative min-h-screen', className)}>
      {/* Loading indicator */}
      {isLoading && (
        <div className="fixed top-4 right-4 z-50">
          <Badge variant="secondary" className="animate-pulse">
            Loading {loadingCount} widget{loadingCount !== 1 ? 's' : ''}...
          </Badge>
        </div>
      )}
      
      {/* Maximized overlay */}
      {maximizedWidget && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setMaximizedWidget(null)}
        />
      )}
      
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        onLayoutChange={handleLayoutChange}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
        rowHeight={60}
        margin={[16, 16]}
        containerPadding={[16, 16]}
        isDraggable={!maximizedWidget}
        isResizable={!maximizedWidget}
        useCSSTransforms={true}
        compactType="vertical"
        preventCollision={false}
      >
        {gridElements}
      </ResponsiveGridLayout>
    </div>
  );
}

export function EnhancedDashboardGrid(props: EnhancedDashboardGridProps) {
  return (
    <WidgetInteractionProvider>
      <DashboardContent {...props} />
    </WidgetInteractionProvider>
  );
}