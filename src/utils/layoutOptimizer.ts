import { Layout } from 'react-grid-layout';

export interface OptimizationConfig {
  screenWidth: number;
  containerWidth: number;
  columns: number;
  rowHeight: number;
  margin: [number, number];
  padding: [number, number];
}

export interface WidgetMetrics {
  id: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
  minWidth: number;
  minHeight: number;
  preferredAspectRatio?: number;
  content?: {
    dataPoints: number;
    complexity: 'simple' | 'medium' | 'complex';
  };
}

export interface OptimizedLayout extends Layout {
  optimizationScore: number;
  reasoning: string[];
}

export class LayoutOptimizer {
  private config: OptimizationConfig;
  private widgets: WidgetMetrics[];

  constructor(config: OptimizationConfig, widgets: WidgetMetrics[]) {
    this.config = config;
    this.widgets = widgets;
  }

  /**
   * Optimize layout based on screen size and widget priorities
   */
  optimizeLayout(): OptimizedLayout[] {
    const layouts: OptimizedLayout[] = [];
    let currentY = 0;

    // Sort widgets by priority
    const sortedWidgets = this.sortWidgetsByPriority();

    for (let i = 0; i < sortedWidgets.length; i++) {
      const widget = sortedWidgets[i];
      const optimizedLayout = this.optimizeWidgetLayout(widget, currentY, layouts);
      
      layouts.push(optimizedLayout);
      currentY = Math.max(currentY, optimizedLayout.y + optimizedLayout.h);
    }

    return this.validateAndAdjustLayouts(layouts);
  }

  /**
   * Sort widgets by priority and optimization rules
   */
  private sortWidgetsByPriority(): WidgetMetrics[] {
    return [...this.widgets].sort((a, b) => {
      // Primary: Priority
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Secondary: Widget type importance
      const typeWeight = this.getWidgetTypeWeight(a.type) - this.getWidgetTypeWeight(b.type);
      if (typeWeight !== 0) return typeWeight;

      // Tertiary: Content complexity
      const complexityWeight = { complex: 3, medium: 2, simple: 1 };
      const aComplexity = a.content?.complexity || 'simple';
      const bComplexity = b.content?.complexity || 'simple';
      
      return complexityWeight[bComplexity] - complexityWeight[aComplexity];
    });
  }

  /**
   * Get widget type weight for optimization
   */
  private getWidgetTypeWeight(type: string): number {
    const weights: Record<string, number> = {
      kpi: 10,
      enhancedKpi: 9,
      metricCard: 8,
      chart: 7,
      table: 6,
      pivot: 5,
      gauge: 4,
      filter: 3,
      text: 2,
      formula: 1
    };
    return weights[type] || 0;
  }

  /**
   * Optimize layout for a specific widget
   */
  private optimizeWidgetLayout(
    widget: WidgetMetrics, 
    startY: number, 
    existingLayouts: OptimizedLayout[]
  ): OptimizedLayout {
    const reasoning: string[] = [];
    let optimizationScore = 100;

    // Calculate optimal dimensions
    const dimensions = this.calculateOptimalDimensions(widget);
    reasoning.push(`Optimal dimensjoner: ${dimensions.w}x${dimensions.h} basert på widget-type og innhold`);

    // Find optimal position
    const position = this.findOptimalPosition(dimensions, startY, existingLayouts);
    reasoning.push(`Plassering: (${position.x}, ${position.y}) for å minimere overlapp og optimalisere flyt`);

    // Apply screen size optimizations
    const screenOptimizations = this.applyScreenSizeOptimizations(dimensions, widget);
    const finalDimensions = { ...dimensions, ...screenOptimizations.dimensions };
    optimizationScore *= screenOptimizations.score;
    reasoning.push(...screenOptimizations.reasoning);

    // Apply responsive adjustments
    const responsiveAdjustments = this.applyResponsiveAdjustments(finalDimensions, widget);
    const adjustedDimensions = { ...finalDimensions, ...responsiveAdjustments.dimensions };
    optimizationScore *= responsiveAdjustments.score;
    reasoning.push(...responsiveAdjustments.reasoning);

    return {
      i: widget.id,
      x: position.x,
      y: position.y,
      w: adjustedDimensions.w,
      h: adjustedDimensions.h,
      minW: widget.minWidth,
      minH: widget.minHeight,
      optimizationScore: Math.round(optimizationScore),
      reasoning
    };
  }

  /**
   * Calculate optimal dimensions for widget
   */
  private calculateOptimalDimensions(widget: WidgetMetrics): { w: number; h: number } {
    const baseWidth = Math.max(widget.minWidth, 2);
    const baseHeight = Math.max(widget.minHeight, 1);

    // Adjust based on widget type
    const typeDimensions = this.getTypeDimensions(widget.type);
    
    // Adjust based on content
    const contentAdjustment = this.getContentAdjustment(widget);

    // Apply aspect ratio if specified
    let finalWidth = Math.max(baseWidth, typeDimensions.w) * contentAdjustment.w;
    let finalHeight = Math.max(baseHeight, typeDimensions.h) * contentAdjustment.h;

    if (widget.preferredAspectRatio) {
      const calculatedHeight = finalWidth / widget.preferredAspectRatio;
      if (calculatedHeight >= widget.minHeight) {
        finalHeight = calculatedHeight;
      }
    }

    return {
      w: Math.min(Math.round(finalWidth), this.config.columns),
      h: Math.round(finalHeight)
    };
  }

  /**
   * Get default dimensions by widget type
   */
  private getTypeDimensions(type: string): { w: number; h: number } {
    const dimensions: Record<string, { w: number; h: number }> = {
      kpi: { w: 3, h: 2 },
      enhancedKpi: { w: 4, h: 3 },
      metricCard: { w: 3, h: 2 },
      chart: { w: 6, h: 4 },
      table: { w: 8, h: 6 },
      pivot: { w: 8, h: 6 },
      gauge: { w: 4, h: 4 },
      filter: { w: 4, h: 2 },
      text: { w: 6, h: 3 },
      formula: { w: 4, h: 2 },
      crossCheck: { w: 8, h: 5 }
    };
    return dimensions[type] || { w: 4, h: 3 };
  }

  /**
   * Get content-based adjustments
   */
  private getContentAdjustment(widget: WidgetMetrics): { w: number; h: number } {
    if (!widget.content) return { w: 1, h: 1 };

    const { dataPoints, complexity } = widget.content;
    let wMultiplier = 1;
    let hMultiplier = 1;

    // Adjust based on data points
    if (dataPoints > 100) {
      wMultiplier *= 1.5;
      hMultiplier *= 1.3;
    } else if (dataPoints > 50) {
      wMultiplier *= 1.2;
      hMultiplier *= 1.1;
    }

    // Adjust based on complexity
    if (complexity === 'complex') {
      wMultiplier *= 1.3;
      hMultiplier *= 1.2;
    } else if (complexity === 'medium') {
      wMultiplier *= 1.1;
      hMultiplier *= 1.1;
    }

    return { w: wMultiplier, h: hMultiplier };
  }

  /**
   * Find optimal position for widget
   */
  private findOptimalPosition(
    dimensions: { w: number; h: number },
    startY: number,
    existingLayouts: OptimizedLayout[]
  ): { x: number; y: number } {
    // Try to place at the beginning of a row first
    for (let y = startY; y < startY + 10; y++) {
      for (let x = 0; x <= this.config.columns - dimensions.w; x++) {
        if (!this.hasCollision({ x, y, w: dimensions.w, h: dimensions.h }, existingLayouts)) {
          return { x, y };
        }
      }
    }

    // Fallback: place at end
    return { x: 0, y: startY };
  }

  /**
   * Check for layout collisions
   */
  private hasCollision(
    layout: { x: number; y: number; w: number; h: number },
    existingLayouts: OptimizedLayout[]
  ): boolean {
    return existingLayouts.some(existing => 
      layout.x < existing.x + existing.w &&
      layout.x + layout.w > existing.x &&
      layout.y < existing.y + existing.h &&
      layout.y + layout.h > existing.y
    );
  }

  /**
   * Apply screen size specific optimizations
   */
  private applyScreenSizeOptimizations(
    dimensions: { w: number; h: number },
    widget: WidgetMetrics
  ): { dimensions: Partial<{ w: number; h: number }>; score: number; reasoning: string[] } {
    const reasoning: string[] = [];
    let score = 1;
    const adjustments: Partial<{ w: number; h: number }> = {};

    // Mobile optimizations
    if (this.config.screenWidth < 768) {
      // Force single column for better readability
      if (dimensions.w > this.config.columns / 2) {
        adjustments.w = this.config.columns;
        reasoning.push('Mobil: Utvidet til full bredde for bedre lesbarhet');
        score *= 1.1;
      }

      // Increase height for touch interaction
      if (widget.type === 'filter' || widget.type === 'kpi') {
        adjustments.h = Math.max(dimensions.h, 3);
        reasoning.push('Mobil: Økt høyde for bedre touch-interaksjon');
        score *= 1.05;
      }
    }

    // Tablet optimizations
    else if (this.config.screenWidth < 1024) {
      // Optimize for two-column layout
      const optimalWidth = Math.ceil(this.config.columns / 2);
      if (dimensions.w > optimalWidth && dimensions.w < this.config.columns) {
        adjustments.w = optimalWidth;
        reasoning.push('Tablet: Justert for optimal to-kolonne layout');
        score *= 1.08;
      }
    }

    // Desktop optimizations
    else {
      // Use more space for complex widgets
      if (widget.content?.complexity === 'complex' && dimensions.w < this.config.columns * 0.6) {
        adjustments.w = Math.ceil(this.config.columns * 0.6);
        reasoning.push('Desktop: Utvidet komplekse widgets for bedre detaljer');
        score *= 1.1;
      }

      // Group related widgets
      if (widget.priority === 'high' && dimensions.w < this.config.columns / 3) {
        adjustments.w = Math.ceil(this.config.columns / 3);
        reasoning.push('Desktop: Utvidet høy-prioritets widgets');
        score *= 1.05;
      }
    }

    return { dimensions: adjustments, score, reasoning };
  }

  /**
   * Apply responsive adjustments
   */
  private applyResponsiveAdjustments(
    dimensions: { w: number; h: number },
    widget: WidgetMetrics
  ): { dimensions: Partial<{ w: number; h: number }>; score: number; reasoning: string[] } {
    const reasoning: string[] = [];
    let score = 1;
    const adjustments: Partial<{ w: number; h: number }> = {};

    // Ensure minimum usable size
    if (dimensions.w < widget.minWidth) {
      adjustments.w = widget.minWidth;
      reasoning.push(`Justert til minimum bredde: ${widget.minWidth}`);
      score *= 0.95; // Penalty for not being optimal
    }

    if (dimensions.h < widget.minHeight) {
      adjustments.h = widget.minHeight;
      reasoning.push(`Justert til minimum høyde: ${widget.minHeight}`);
      score *= 0.95;
    }

    // Ensure widgets don't exceed container
    if (dimensions.w > this.config.columns) {
      adjustments.w = this.config.columns;
      reasoning.push('Begrenset til container bredde');
      score *= 0.9;
    }

    return { dimensions: adjustments, score, reasoning };
  }

  /**
   * Validate and adjust final layouts
   */
  private validateAndAdjustLayouts(layouts: OptimizedLayout[]): OptimizedLayout[] {
    return layouts.map(layout => {
      const adjustments: string[] = [];

      // Ensure no negative positions
      if (layout.x < 0) {
        layout.x = 0;
        adjustments.push('Korrigert negativ X-posisjon');
      }
      if (layout.y < 0) {
        layout.y = 0;
        adjustments.push('Korrigert negativ Y-posisjon');
      }

      // Ensure within bounds
      if (layout.x + layout.w > this.config.columns) {
        layout.w = this.config.columns - layout.x;
        adjustments.push('Justert bredde til container grenser');
      }

      if (adjustments.length > 0) {
        layout.reasoning.push(...adjustments);
        layout.optimizationScore *= 0.95;
      }

      return layout;
    });
  }

  /**
   * Get optimization recommendations
   */
  static getOptimizationRecommendations(
    layouts: OptimizedLayout[],
    config: OptimizationConfig
  ): Array<{ type: 'info' | 'warning' | 'error'; message: string; widgetId?: string }> {
    const recommendations: Array<{ type: 'info' | 'warning' | 'error'; message: string; widgetId?: string }> = [];

    // Check for low optimization scores
    const lowScoreLayouts = layouts.filter(l => l.optimizationScore < 70);
    if (lowScoreLayouts.length > 0) {
      recommendations.push({
        type: 'warning',
        message: `${lowScoreLayouts.length} widgets har lav optimaliseringsscore. Vurder å justere størrelse eller posisjon.`
      });
    }

    // Check for overcrowding
    const averageWidgetSize = layouts.reduce((sum, l) => sum + (l.w * l.h), 0) / layouts.length;
    const screenUtilization = (layouts.length * averageWidgetSize) / (config.columns * 10); // Assume 10 row viewport
    
    if (screenUtilization > 0.8) {
      recommendations.push({
        type: 'warning',
        message: 'Dashboard kan være overfylt. Vurder å flytte noen widgets til en ny seksjon.'
      });
    }

    // Check for responsive issues
    if (config.screenWidth < 768) {
      const wideWidgets = layouts.filter(l => l.w > config.columns * 0.8);
      if (wideWidgets.length > 2) {
        recommendations.push({
          type: 'info',
          message: 'På små skjermer kan brede widgets være vanskelige å navigere. Vurder vertikal layout.'
        });
      }
    }

    return recommendations;
  }
}