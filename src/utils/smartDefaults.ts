import { Widget, WidgetLayout } from '@/contexts/WidgetManagerContext';

interface DataComplexityMetrics {
  recordCount: number;
  columnCount: number;
  uniqueValues: Record<string, number>;
  dataTypes: Record<string, string>;
  nullPercentage: Record<string, number>;
  numericColumns: string[];
  dateColumns: string[];
  textColumns: string[];
}

interface SmartDefaultConfig {
  widgetType: string;
  title: string;
  configuration: Record<string, any>;
  size: { w: number; h: number };
  priority: number;
  reasoning: string;
}

export class SmartDefaultsEngine {
  /**
   * Analyze data complexity and characteristics
   */
  static analyzeDataComplexity(data: any[]): DataComplexityMetrics {
    if (!data || data.length === 0) {
      return {
        recordCount: 0,
        columnCount: 0,
        uniqueValues: {},
        dataTypes: {},
        nullPercentage: {},
        numericColumns: [],
        dateColumns: [],
        textColumns: []
      };
    }

    const sampleRecord = data[0];
    const columns = Object.keys(sampleRecord);
    
    const metrics: DataComplexityMetrics = {
      recordCount: data.length,
      columnCount: columns.length,
      uniqueValues: {},
      dataTypes: {},
      nullPercentage: {},
      numericColumns: [],
      dateColumns: [],
      textColumns: []
    };

    // Analyze each column
    columns.forEach(column => {
      const values = data.map(record => record[column]).filter(v => v != null);
      const uniqueValues = new Set(values);
      const nullCount = data.length - values.length;
      
      metrics.uniqueValues[column] = uniqueValues.size;
      metrics.nullPercentage[column] = (nullCount / data.length) * 100;
      
      // Determine data type
      const sampleValue = values[0];
      if (typeof sampleValue === 'number' || !isNaN(Number(sampleValue))) {
        metrics.dataTypes[column] = 'numeric';
        metrics.numericColumns.push(column);
      } else if (this.isDateColumn(values)) {
        metrics.dataTypes[column] = 'date';
        metrics.dateColumns.push(column);
      } else {
        metrics.dataTypes[column] = 'text';
        metrics.textColumns.push(column);
      }
    });

    return metrics;
  }

  /**
   * Check if a column contains date values
   */
  private static isDateColumn(values: any[]): boolean {
    if (values.length === 0) return false;
    
    const sampleSize = Math.min(10, values.length);
    let dateCount = 0;
    
    for (let i = 0; i < sampleSize; i++) {
      const value = values[i];
      if (typeof value === 'string') {
        // Check common date patterns
        const datePatterns = [
          /^\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
          /^\d{2}\.\d{2}\.\d{4}/, // DD.MM.YYYY
          /^\d{2}\/\d{2}\/\d{4}/, // MM/DD/YYYY
        ];
        
        if (datePatterns.some(pattern => pattern.test(value)) || !isNaN(Date.parse(value))) {
          dateCount++;
        }
      }
    }
    
    return dateCount / sampleSize > 0.7; // 70% threshold
  }

  /**
   * Generate smart widget recommendations based on data complexity
   */
  static generateSmartDefaults(
    data: any[], 
    dataSourceType: string = 'accounting',
    userPreferences: Record<string, any> = {}
  ): SmartDefaultConfig[] {
    const complexity = this.analyzeDataComplexity(data);
    const recommendations: SmartDefaultConfig[] = [];

    // Always start with data validation
    recommendations.push({
      widgetType: 'crosscheck',
      title: 'Datavalidering',
      configuration: {
        rules: this.selectValidationRules(dataSourceType, complexity),
        showSummary: true,
        autoRefresh: true
      },
      size: { w: 6, h: 4 },
      priority: 1,
      reasoning: 'Datavalidering er alltid første prioritet for å sikre datakvalitet'
    });

    // Add overview widget for basic insights
    if (complexity.numericColumns.length > 0) {
      recommendations.push({
        widgetType: 'kpi',
        title: 'Nøkkeloversikt',
        configuration: {
          metrics: this.selectKeyMetrics(complexity, dataSourceType),
          displayType: complexity.numericColumns.length <= 4 ? 'cards' : 'compact',
          showTrend: complexity.dateColumns.length > 0
        },
        size: { w: 6, h: 3 },
        priority: 2,
        reasoning: 'Nøkkeltall gir rask oversikt over viktige målinger'
      });
    }

    // Add table widget for detailed data
    if (complexity.recordCount > 0) {
      recommendations.push({
        widgetType: 'table',
        title: 'Detaljert oversikt',
        configuration: {
          columns: this.selectTableColumns(complexity),
          pageSize: this.calculateOptimalPageSize(complexity.recordCount),
          enableSearch: complexity.recordCount > 100,
          enableExport: true,
          sortBy: this.selectDefaultSortColumn(complexity)
        },
        size: { w: 12, h: 6 },
        priority: 3,
        reasoning: 'Tabellvisning for detaljert gjennomgang av alle data'
      });
    }

    // Add trend analysis if date columns exist
    if (complexity.dateColumns.length > 0 && complexity.numericColumns.length > 0) {
      recommendations.push({
        widgetType: 'chart',
        title: 'Trendanalyse',
        configuration: {
          chartType: 'line',
          xAxis: complexity.dateColumns[0],
          yAxis: this.selectBestNumericColumn(complexity),
          groupBy: this.selectGroupingColumn(complexity),
          period: this.suggestTimePeriod(data, complexity.dateColumns[0])
        },
        size: { w: 8, h: 5 },
        priority: 4,
        reasoning: 'Trendanalyse viser utvikling over tid'
      });
    }

    // Add distribution analysis for categorical data
    const categoricalColumns = complexity.textColumns.filter(col => 
      complexity.uniqueValues[col] && complexity.uniqueValues[col] < 20
    );
    
    if (categoricalColumns.length > 0 && complexity.numericColumns.length > 0) {
      recommendations.push({
        widgetType: 'chart',
        title: 'Fordeling',
        configuration: {
          chartType: 'bar',
          xAxis: categoricalColumns[0],
          yAxis: complexity.numericColumns[0],
          aggregation: 'sum'
        },
        size: { w: 6, h: 4 },
        priority: 5,
        reasoning: 'Viser fordeling av verdier på tvers av kategorier'
      });
    }

    // Add advanced analysis for complex datasets
    if (complexity.recordCount > 1000 && complexity.numericColumns.length > 3) {
      recommendations.push({
        widgetType: 'advanced-analytics',
        title: 'Avansert analyse',
        configuration: {
          analysisType: 'correlation',
          variables: complexity.numericColumns.slice(0, 5),
          showOutliers: true,
          clusterAnalysis: complexity.recordCount > 5000
        },
        size: { w: 8, h: 6 },
        priority: 6,
        reasoning: 'Avansert analyse for store og komplekse datasett'
      });
    }

    // Sort by priority and apply user preferences
    return recommendations
      .sort((a, b) => a.priority - b.priority)
      .map(rec => this.applyUserPreferences(rec, userPreferences));
  }

  /**
   * Select appropriate validation rules based on data source type
   */
  private static selectValidationRules(dataSourceType: string, complexity: DataComplexityMetrics): string[] {
    const baseRules = ['duplicate-check', 'missing-data'];
    
    switch (dataSourceType) {
      case 'accounting':
        return [...baseRules, 'balance-check', 'date-sequence', 'account-validation'];
      case 'financial':
        return [...baseRules, 'balance-check', 'ratio-validation'];
      case 'inventory':
        return [...baseRules, 'quantity-validation', 'value-consistency'];
      default:
        return baseRules;
    }
  }

  /**
   * Select key metrics based on data characteristics
   */
  private static selectKeyMetrics(complexity: DataComplexityMetrics, dataSourceType: string): string[] {
    const numericCols = complexity.numericColumns;
    
    if (dataSourceType === 'accounting') {
      return numericCols.filter(col => 
        col.toLowerCase().includes('saldo') || 
        col.toLowerCase().includes('belop') ||
        col.toLowerCase().includes('sum')
      ).slice(0, 4);
    }
    
    // General case: pick columns with highest variance
    return numericCols.slice(0, Math.min(4, numericCols.length));
  }

  /**
   * Select optimal table columns based on data characteristics
   */
  private static selectTableColumns(complexity: DataComplexityMetrics): string[] {
    const allColumns = [
      ...complexity.dateColumns.slice(0, 1), // Include primary date column
      ...complexity.textColumns.slice(0, 3), // Key text identifiers
      ...complexity.numericColumns.slice(0, 3) // Key numeric values
    ];
    
    return allColumns.slice(0, 8); // Limit to 8 columns for readability
  }

  /**
   * Calculate optimal page size based on record count
   */
  private static calculateOptimalPageSize(recordCount: number): number {
    if (recordCount <= 50) return 25;
    if (recordCount <= 500) return 50;
    if (recordCount <= 5000) return 100;
    return 250;
  }

  /**
   * Select default sort column
   */
  private static selectDefaultSortColumn(complexity: DataComplexityMetrics): string {
    // Prefer date columns for chronological sorting
    if (complexity.dateColumns.length > 0) {
      return complexity.dateColumns[0];
    }
    
    // Fall back to first numeric column
    if (complexity.numericColumns.length > 0) {
      return complexity.numericColumns[0];
    }
    
    // Last resort: first text column
    return complexity.textColumns[0] || Object.keys(complexity.dataTypes)[0];
  }

  /**
   * Select best numeric column for trend analysis
   */
  private static selectBestNumericColumn(complexity: DataComplexityMetrics): string {
    // Prefer columns with names suggesting importance
    const importantPatterns = ['saldo', 'belop', 'sum', 'total', 'amount', 'value'];
    
    for (const pattern of importantPatterns) {
      const match = complexity.numericColumns.find(col => 
        col.toLowerCase().includes(pattern)
      );
      if (match) return match;
    }
    
    return complexity.numericColumns[0];
  }

  /**
   * Select grouping column for analysis
   */
  private static selectGroupingColumn(complexity: DataComplexityMetrics): string | undefined {
    // Look for categorical columns with reasonable number of unique values
    const goodGroupingColumns = complexity.textColumns.filter(col => {
      const uniqueCount = complexity.uniqueValues[col];
      return uniqueCount && uniqueCount > 1 && uniqueCount < 20;
    });
    
    return goodGroupingColumns[0];
  }

  /**
   * Suggest appropriate time period for trend analysis
   */
  private static suggestTimePeriod(data: any[], dateColumn: string): string {
    const dates = data.map(record => new Date(record[dateColumn])).filter(d => !isNaN(d.getTime()));
    
    if (dates.length === 0) return 'month';
    
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    const daysDiff = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDiff <= 31) return 'day';
    if (daysDiff <= 365) return 'week';
    if (daysDiff <= 1095) return 'month'; // 3 years
    return 'quarter';
  }

  /**
   * Apply user preferences to recommendations
   */
  private static applyUserPreferences(
    recommendation: SmartDefaultConfig, 
    preferences: Record<string, any>
  ): SmartDefaultConfig {
    const modified = { ...recommendation };
    
    // Apply preferred chart types
    if (preferences.preferredChartType && modified.configuration.chartType) {
      modified.configuration.chartType = preferences.preferredChartType;
    }
    
    // Apply preferred page sizes
    if (preferences.preferredPageSize && modified.configuration.pageSize) {
      modified.configuration.pageSize = preferences.preferredPageSize;
    }
    
    // Apply layout preferences
    if (preferences.preferCompactLayout) {
      modified.size.h = Math.max(2, modified.size.h - 1);
    }
    
    return modified;
  }

  /**
   * Generate complete dashboard layout with smart positioning
   */
  static generateOptimalLayout(recommendations: SmartDefaultConfig[]): WidgetLayout[] {
    const layout: WidgetLayout[] = [];
    let currentY = 0;
    const gridWidth = 12;
    
    recommendations.forEach((rec, index) => {
      const widgetId = `widget-${index + 1}`;
      
      // Calculate position
      let x = 0;
      let y = currentY;
      
      // Try to fit widgets side by side if they're small enough
      if (index > 0 && rec.size.w <= 6) {
        const previousWidget = layout[layout.length - 1];
        const availableWidth = gridWidth - (previousWidget.x + previousWidget.w);
        
        if (availableWidth >= rec.size.w && previousWidget.y === currentY) {
          x = previousWidget.x + previousWidget.w;
          y = previousWidget.y;
        } else {
          currentY += Math.max(...layout.filter(l => l.y === currentY).map(l => l.h));
          y = currentY;
        }
      }
      
      layout.push({
        i: widgetId,
        x,
        y,
        w: rec.size.w,
        h: rec.size.h,
        widgetId
      });
      
      // Update currentY for next iteration
      if (x === 0) {
        currentY = y + rec.size.h;
      }
    });
    
    return layout;
  }
}

/**
 * Utility functions for quick access to smart defaults
 */
export const SmartDefaults = {
  /**
   * Get basic dashboard setup for accounting data
   */
  getAccountingDashboard: (data: any[]) => {
    return SmartDefaultsEngine.generateSmartDefaults(data, 'accounting');
  },

  /**
   * Get financial analysis dashboard
   */
  getFinancialDashboard: (data: any[]) => {
    return SmartDefaultsEngine.generateSmartDefaults(data, 'financial');
  },

  /**
   * Get quick data overview
   */
  getQuickOverview: (data: any[]) => {
    const recommendations = SmartDefaultsEngine.generateSmartDefaults(data);
    return recommendations.slice(0, 3); // Top 3 most important widgets
  },

  /**
   * Analyze and suggest improvements to existing dashboard
   */
  suggestImprovements: (currentWidgets: Widget[], data: any[]) => {
    const complexity = SmartDefaultsEngine.analyzeDataComplexity(data);
    const suggestions: string[] = [];
    
    const hasValidation = currentWidgets.some(w => w.type === 'table'); // Use existing type
    if (!hasValidation) {
      suggestions.push('Legg til datavalidering for å sikre datakvalitet');
    }
    
    const hasOverview = currentWidgets.some(w => w.type === 'kpi');
    if (!hasOverview && complexity.numericColumns.length > 0) {
      suggestions.push('Legg til nøkkeloversikt for rask forståelse av data');
    }
    
    const hasTrend = currentWidgets.some(w => w.type === 'chart');
    if (!hasTrend && complexity.dateColumns.length > 0) {
      suggestions.push('Legg til trendanalyse for å vise utvikling over tid');
    }
    
    return suggestions;
  }
};