import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWidgetManager } from '@/contexts/WidgetManagerContext';
import { LayoutOptimizer, OptimizationConfig, WidgetMetrics, OptimizedLayout } from '@/utils/layoutOptimizer';
import { useToast } from '@/hooks/use-toast';
import { 
  Sparkles, 
  Monitor, 
  Tablet, 
  Smartphone, 
  Zap,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SmartLayoutManagerProps {
  className?: string;
}

export function SmartLayoutManager({ className }: SmartLayoutManagerProps) {
  const { widgets, layouts, updateLayout } = useWidgetManager();
  const { toast } = useToast();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState<{
    layouts: OptimizedLayout[];
    recommendations: Array<{ type: 'info' | 'warning' | 'error'; message: string; widgetId?: string }>;
  } | null>(null);

  // Screen size configurations
  const screenConfigs: Record<string, OptimizationConfig> = {
    desktop: {
      screenWidth: 1920,
      containerWidth: 1200,
      columns: 12,
      rowHeight: 60,
      margin: [10, 10],
      padding: [10, 10]
    },
    tablet: {
      screenWidth: 1024,
      containerWidth: 768,
      columns: 8,
      rowHeight: 60,
      margin: [8, 8],
      padding: [8, 8]
    },
    mobile: {
      screenWidth: 768,
      containerWidth: 360,
      columns: 4,
      rowHeight: 60,
      margin: [5, 5],
      padding: [5, 5]
    }
  };

  // Convert widgets to metrics
  const convertToWidgetMetrics = (): WidgetMetrics[] => {
    return widgets.map(widget => ({
      id: widget.id,
      type: widget.type,
      priority: widget.config?.priority || 'medium',
      minWidth: getMinWidth(widget.type),
      minHeight: getMinHeight(widget.type),
      preferredAspectRatio: getPreferredAspectRatio(widget.type),
      content: {
        dataPoints: widget.config?.dataPoints || 10,
        complexity: widget.config?.complexity || 'medium'
      }
    }));
  };

  const getMinWidth = (type: string): number => {
    const minWidths: Record<string, number> = {
      kpi: 2,
      enhancedKpi: 3,
      chart: 4,
      table: 6,
      filter: 3,
      text: 3,
      crossCheck: 6
    };
    return minWidths[type] || 3;
  };

  const getMinHeight = (type: string): number => {
    const minHeights: Record<string, number> = {
      kpi: 2,
      enhancedKpi: 2,
      chart: 3,
      table: 4,
      filter: 1,
      text: 2,
      crossCheck: 4
    };
    return minHeights[type] || 2;
  };

  const getPreferredAspectRatio = (type: string): number | undefined => {
    const ratios: Record<string, number> = {
      kpi: 1.5,
      chart: 1.6,
      gauge: 1
    };
    return ratios[type];
  };

  // Optimize layout for specific screen size
  const optimizeForScreen = async (screenType: keyof typeof screenConfigs) => {
    setIsOptimizing(true);
    
    try {
      const config = screenConfigs[screenType];
      const widgetMetrics = convertToWidgetMetrics();
      
      const optimizer = new LayoutOptimizer(config, widgetMetrics);
      const optimizedLayouts = optimizer.optimizeLayout();
      const recommendations = LayoutOptimizer.getOptimizationRecommendations(optimizedLayouts, config);

      setOptimizationResults({
        layouts: optimizedLayouts,
        recommendations
      });

      toast({
        title: "Layout optimalisert",
        description: `Layout er optimalisert for ${screenType} med ${optimizedLayouts.length} widgets`
      });
    } catch (error) {
      toast({
        title: "Optimaliseringsfeil",
        description: "Kunne ikke optimalisere layout",
        variant: "destructive"
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  // Apply optimized layout
  const applyOptimizedLayout = () => {
    if (!optimizationResults) return;

    const newLayouts = optimizationResults.layouts.map(optimized => ({
      i: optimized.i,
      x: optimized.x,
      y: optimized.y,
      w: optimized.w,
      h: optimized.h,
      widgetId: optimized.i,
      dataSourceId: widgets.find(w => w.id === optimized.i)?.dataSourceId,
      sectionId: widgets.find(w => w.id === optimized.i)?.sectionId
    }));

    updateLayout(newLayouts);
    
    toast({
      title: "Layout anvendt",
      description: "Den optimaliserte layouten er nå aktiv"
    });
  };

  // Auto-optimize for current screen
  const autoOptimize = () => {
    const screenWidth = window.innerWidth;
    
    if (screenWidth >= 1200) {
      optimizeForScreen('desktop');
    } else if (screenWidth >= 768) {
      optimizeForScreen('tablet');
    } else {
      optimizeForScreen('mobile');
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getRecommendationVariant = (type: string) => {
    switch (type) {
      case 'error': return 'destructive' as const;
      case 'warning': return 'default' as const;
      default: return 'default' as const;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Smart Layout Manager
          <Badge variant="secondary">AI-drevet</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="optimize" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="optimize">Optimaliser</TabsTrigger>
            <TabsTrigger value="results">Resultater</TabsTrigger>
          </TabsList>

          <TabsContent value="optimize" className="space-y-4">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={autoOptimize}
                disabled={isOptimizing}
                className="flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                {isOptimizing ? 'Optimaliserer...' : 'Auto-optimaliser'}
              </Button>
              
              {optimizationResults && (
                <Button 
                  onClick={applyOptimizedLayout}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Anvend layout
                </Button>
              )}
            </div>

            {/* Screen Size Options */}
            <div className="space-y-3">
              <h4 className="font-medium">Optimaliser for spesifikk skjerm:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  onClick={() => optimizeForScreen('desktop')}
                  disabled={isOptimizing}
                  className="flex items-center gap-2"
                >
                  <Monitor className="h-4 w-4" />
                  Desktop
                </Button>
                <Button
                  variant="outline"
                  onClick={() => optimizeForScreen('tablet')}
                  disabled={isOptimizing}
                  className="flex items-center gap-2"
                >
                  <Tablet className="h-4 w-4" />
                  Tablet
                </Button>
                <Button
                  variant="outline"
                  onClick={() => optimizeForScreen('mobile')}
                  disabled={isOptimizing}
                  className="flex items-center gap-2"
                >
                  <Smartphone className="h-4 w-4" />
                  Mobil
                </Button>
              </div>
            </div>

            {/* Current Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold">{widgets.length}</div>
                <div className="text-sm text-muted-foreground">Widgets</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{layouts.length}</div>
                <div className="text-sm text-muted-foreground">Layouts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {widgets.filter(w => w.config?.priority === 'high').length}
                </div>
                <div className="text-sm text-muted-foreground">Høy prioritet</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {Math.round(window.innerWidth)}px
                </div>
                <div className="text-sm text-muted-foreground">Skjermbredde</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {optimizationResults ? (
              <div className="space-y-4">
                {/* Optimization Score */}
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-medium mb-2">Optimaliseringsresultater</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-lg font-semibold">
                        {Math.round(
                          optimizationResults.layouts.reduce((sum, l) => sum + l.optimizationScore, 0) / 
                          optimizationResults.layouts.length
                        )}%
                      </div>
                      <div className="text-sm text-muted-foreground">Gjennomsnittlig score</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">
                        {optimizationResults.layouts.filter(l => l.optimizationScore >= 80).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Høy score widgets</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">
                        {optimizationResults.recommendations.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Anbefalinger</div>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                {optimizationResults.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Anbefalinger:</h4>
                    {optimizationResults.recommendations.map((rec, index) => (
                      <Alert key={index} variant={getRecommendationVariant(rec.type)}>
                        {getRecommendationIcon(rec.type)}
                        <AlertDescription>{rec.message}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}

                {/* Widget Details */}
                <div className="space-y-2">
                  <h4 className="font-medium">Widget-detaljer:</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {optimizationResults.layouts.map((layout) => {
                      const widget = widgets.find(w => w.id === layout.i);
                      return (
                        <div key={layout.i} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium">{widget?.title || layout.i}</h5>
                            <Badge 
                              variant={layout.optimizationScore >= 80 ? "default" : "secondary"}
                            >
                              {layout.optimizationScore}%
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div>Posisjon: ({layout.x}, {layout.y}) | Størrelse: {layout.w}x{layout.h}</div>
                            {layout.reasoning.map((reason, idx) => (
                              <div key={idx}>• {reason}</div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Kjør en optimalisering for å se resultater</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}