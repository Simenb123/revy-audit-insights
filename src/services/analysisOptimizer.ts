import { logger } from '@/utils/logger';

interface OptimizationConfig {
  enableParallelProcessing: boolean;
  maxBatchSize: number;
  cacheResults: boolean;
  enableProgressTracking: boolean;
  adaptiveSettings: {
    enabled: boolean;
    performanceThresholds: {
      slow: number; // ms
      fast: number; // ms
    };
  };
}

interface PerformanceMetrics {
  executionTime: number;
  memoryUsage?: number;
  cacheHitRate: number;
  batchProcessingEfficiency: number;
}

export class AnalysisOptimizer {
  private config: OptimizationConfig;
  private performanceHistory: PerformanceMetrics[] = [];
  private adaptiveSettings: Map<string, any> = new Map();

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = {
      enableParallelProcessing: true,
      maxBatchSize: 1000,
      cacheResults: true,
      enableProgressTracking: true,
      adaptiveSettings: {
        enabled: true,
        performanceThresholds: {
          slow: 5000, // 5 seconds
          fast: 1000  // 1 second
        }
      },
      ...config
    };
  }

  async optimizeAnalysisExecution<T>(
    analysisFunction: () => Promise<T>,
    context: {
      analysisType: string;
      dataSize: number;
      complexity: 'low' | 'medium' | 'high';
    }
  ): Promise<T> {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();

    try {
      // Apply adaptive optimizations based on context
      this.applyAdaptiveOptimizations(context);

      // Execute analysis with optimizations
      const result = await this.executeWithOptimizations(analysisFunction, context);

      // Record performance metrics
      const endTime = performance.now();
      const endMemory = this.getMemoryUsage();

      const metrics: PerformanceMetrics = {
        executionTime: endTime - startTime,
        memoryUsage: endMemory - startMemory,
        cacheHitRate: 0, // Would be calculated based on cache statistics
        batchProcessingEfficiency: 1 // Would be calculated based on batch processing
      };

      this.recordPerformanceMetrics(context.analysisType, metrics);
      this.updateAdaptiveSettings(context, metrics);

      logger.log(`Analysis optimization completed for ${context.analysisType}:`, {
        executionTime: metrics.executionTime,
        memoryUsage: metrics.memoryUsage,
        efficiency: this.calculateEfficiencyScore(metrics)
      });

      return result;

    } catch (error) {
      logger.error('Analysis optimization failed:', error);
      throw error;
    }
  }

  private async executeWithOptimizations<T>(
    analysisFunction: () => Promise<T>,
    context: any
  ): Promise<T> {
    // Apply parallel processing if enabled and beneficial
    if (this.config.enableParallelProcessing && this.shouldUseParallelProcessing(context)) {
      return this.executeWithParallelProcessing(analysisFunction, context);
    }

    // Standard execution with basic optimizations
    return analysisFunction();
  }

  private async executeWithParallelProcessing<T>(
    analysisFunction: () => Promise<T>,
    context: any
  ): Promise<T> {
    // For demonstration - in practice, this would split work into chunks
    // and process them in parallel using Web Workers or similar
    return analysisFunction();
  }

  private applyAdaptiveOptimizations(context: any): void {
    if (!this.config.adaptiveSettings.enabled) return;

    const previousMetrics = this.getAverageMetrics(context.analysisType);
    if (!previousMetrics) return;

    // Adjust batch size based on previous performance
    if (previousMetrics.executionTime > this.config.adaptiveSettings.performanceThresholds.slow) {
      this.adaptiveSettings.set(`${context.analysisType}_batchSize`, 
        Math.max(100, this.config.maxBatchSize * 0.5));
    } else if (previousMetrics.executionTime < this.config.adaptiveSettings.performanceThresholds.fast) {
      this.adaptiveSettings.set(`${context.analysisType}_batchSize`, 
        Math.min(2000, this.config.maxBatchSize * 1.5));
    }
  }

  private shouldUseParallelProcessing(context: any): boolean {
    return context.dataSize > 500 && context.complexity !== 'low';
  }

  private recordPerformanceMetrics(analysisType: string, metrics: PerformanceMetrics): void {
    this.performanceHistory.push({
      ...metrics,
      // Add timestamp and analysis type for historical tracking
    });

    // Keep only last 100 entries to prevent memory growth
    if (this.performanceHistory.length > 100) {
      this.performanceHistory = this.performanceHistory.slice(-100);
    }
  }

  private updateAdaptiveSettings(context: any, metrics: PerformanceMetrics): void {
    if (!this.config.adaptiveSettings.enabled) return;

    // Update settings based on performance
    const efficiency = this.calculateEfficiencyScore(metrics);
    
    if (efficiency < 0.5) {
      // Performance is poor, reduce complexity
      this.adaptiveSettings.set(`${context.analysisType}_complexity`, 'reduced');
    } else if (efficiency > 0.8) {
      // Performance is good, can increase complexity
      this.adaptiveSettings.set(`${context.analysisType}_complexity`, 'full');
    }
  }

  private getAverageMetrics(analysisType: string): PerformanceMetrics | null {
    const typeMetrics = this.performanceHistory.slice(-10); // Last 10 runs
    if (typeMetrics.length === 0) return null;

    return {
      executionTime: typeMetrics.reduce((sum, m) => sum + m.executionTime, 0) / typeMetrics.length,
      memoryUsage: typeMetrics.reduce((sum, m) => sum + (m.memoryUsage || 0), 0) / typeMetrics.length,
      cacheHitRate: typeMetrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / typeMetrics.length,
      batchProcessingEfficiency: typeMetrics.reduce((sum, m) => sum + m.batchProcessingEfficiency, 0) / typeMetrics.length
    };
  }

  private calculateEfficiencyScore(metrics: PerformanceMetrics): number {
    // Simple efficiency calculation - in practice this would be more sophisticated
    const timeScore = Math.max(0, 1 - (metrics.executionTime / 10000)); // Normalize against 10 seconds
    const memoryScore = Math.max(0, 1 - ((metrics.memoryUsage || 0) / 100)); // Normalize against 100MB
    const cacheScore = metrics.cacheHitRate;
    const batchScore = metrics.batchProcessingEfficiency;

    return (timeScore + memoryScore + cacheScore + batchScore) / 4;
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  getOptimizationReport(): {
    config: OptimizationConfig;
    performanceHistory: PerformanceMetrics[];
    adaptiveSettings: Record<string, any>;
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    const avgMetrics = this.getAverageMetrics('overall');

    if (avgMetrics) {
      if (avgMetrics.executionTime > this.config.adaptiveSettings.performanceThresholds.slow) {
        recommendations.push('Consider enabling parallel processing for large datasets');
        recommendations.push('Increase caching TTL for stable data');
      }

      if (avgMetrics.cacheHitRate < 0.3) {
        recommendations.push('Review cache strategy - low hit rate detected');
      }

      if (avgMetrics.memoryUsage && avgMetrics.memoryUsage > 50) {
        recommendations.push('Memory usage is high - consider batch processing');
      }
    }

    return {
      config: this.config,
      performanceHistory: this.performanceHistory.slice(-20), // Last 20 entries
      adaptiveSettings: Object.fromEntries(this.adaptiveSettings),
      recommendations
    };
  }
}

export const analysisOptimizer = new AnalysisOptimizer();
