import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types/revio';

export interface AITaskResult {
  taskId: string;
  status: 'success' | 'error';
  data?: any;
  error?: string;
  timestamp: Date;
}

export interface AIAnalysisRequest {
  clientId: string;
  taskTypes: string[];
  priority: 'low' | 'medium' | 'high';
}

export class AITaskManager {
  private static instance: AITaskManager;
  private runningTasks = new Map<string, AbortController>();

  static getInstance(): AITaskManager {
    if (!AITaskManager.instance) {
      AITaskManager.instance = new AITaskManager();
    }
    return AITaskManager.instance;
  }

  async runDocumentAnalysis(client: Client): Promise<AITaskResult> {
    const taskId = `doc-analysis-${client.id}-${Date.now()}`;
    const controller = new AbortController();
    this.runningTasks.set(taskId, controller);

    try {
      const { data, error } = await supabase.functions.invoke('enhanced-semantic-search', {
        body: {
          clientId: client.id,
          query: 'Analyser alle dokumenter for denne klienten',
          analysisType: 'comprehensive'
        }
      });

      if (error) throw error;

      return {
        taskId,
        status: 'success',
        data,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        taskId,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    } finally {
      this.runningTasks.delete(taskId);
    }
  }

  async runPredictiveAnalysis(client: Client): Promise<AITaskResult> {
    const taskId = `predictive-${client.id}-${Date.now()}`;
    const controller = new AbortController();
    this.runningTasks.set(taskId, controller);

    try {
      const { data, error } = await supabase.functions.invoke('predictive-analytics', {
        body: {
          clientId: client.id,
          analysisType: 'comprehensive',
          includeRiskAssessment: true,
          includeTrendAnalysis: true
        }
      });

      if (error) throw error;

      return {
        taskId,
        status: 'success',
        data,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        taskId,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    } finally {
      this.runningTasks.delete(taskId);
    }
  }

  async runBenchmarkingAnalysis(client: Client): Promise<AITaskResult> {
    const taskId = `benchmark-${client.id}-${Date.now()}`;
    const controller = new AbortController();
    this.runningTasks.set(taskId, controller);

    try {
      const { data, error } = await supabase.functions.invoke('intelligent-benchmarking', {
        body: {
          clientId: client.id,
          industryCode: client.org_number?.substring(0, 2) || '00', // Use first 2 digits of org_number as industry code
          companySize: 'medium', // Default to medium since company_size doesn't exist in Client type
          benchmarkType: 'comprehensive'
        }
      });

      if (error) throw error;

      return {
        taskId,
        status: 'success',
        data,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        taskId,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    } finally {
      this.runningTasks.delete(taskId);
    }
  }

  async runRiskAssessment(client: Client): Promise<AITaskResult> {
    const taskId = `risk-${client.id}-${Date.now()}`;
    const controller = new AbortController();
    this.runningTasks.set(taskId, controller);

    try {
      // Run both predictive analytics and benchmarking for comprehensive risk assessment
      const [predictiveResult, benchmarkResult] = await Promise.all([
        this.runPredictiveAnalysis(client),
        this.runBenchmarkingAnalysis(client)
      ]);

      const riskScore = this.calculateRiskScore(predictiveResult.data, benchmarkResult.data);

      return {
        taskId,
        status: 'success',
        data: {
          riskScore,
          riskFactors: this.identifyRiskFactors(predictiveResult.data, benchmarkResult.data),
          recommendations: this.generateRiskRecommendations(riskScore, client)
        },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        taskId,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    } finally {
      this.runningTasks.delete(taskId);
    }
  }

  async runComprehensiveAnalysis(client: Client, onProgress?: (progress: number, taskName: string) => void): Promise<AITaskResult[]> {
    const results: AITaskResult[] = [];
    
    try {
      // Run tasks sequentially to manage load
      onProgress?.(25, 'Dokumentanalyse');
      const docResult = await this.runDocumentAnalysis(client);
      results.push(docResult);

      onProgress?.(50, 'Prediktive Innsikter');
      const predictiveResult = await this.runPredictiveAnalysis(client);
      results.push(predictiveResult);

      onProgress?.(75, 'Benchmarking');
      const benchmarkResult = await this.runBenchmarkingAnalysis(client);
      results.push(benchmarkResult);

      onProgress?.(100, 'Risikovurdering');
      const riskResult = await this.runRiskAssessment(client);
      results.push(riskResult);

      return results;
    } catch (error) {
      throw new Error(`Comprehensive analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  cancelTask(taskId: string): boolean {
    const controller = this.runningTasks.get(taskId);
    if (controller) {
      controller.abort();
      this.runningTasks.delete(taskId);
      return true;
    }
    return false;
  }

  getRunningTasks(): string[] {
    return Array.from(this.runningTasks.keys());
  }

  private calculateRiskScore(predictiveData: any, benchmarkData: any): number {
    // Simple risk calculation - in real implementation this would be more sophisticated
    let riskScore = 50; // Base risk score

    if (predictiveData?.trends?.declining) riskScore += 20;
    if (benchmarkData?.performance?.belowAverage) riskScore += 15;
    if (predictiveData?.anomalies?.length > 0) riskScore += 10;

    return Math.min(Math.max(riskScore, 0), 100);
  }

  private identifyRiskFactors(predictiveData: any, benchmarkData: any): string[] {
    const factors: string[] = [];
    
    if (predictiveData?.trends?.declining) factors.push('Fallende trender i økonomiske indikatorer');
    if (benchmarkData?.performance?.belowAverage) factors.push('Under bransjegjennomsnittet');
    if (predictiveData?.anomalies?.length > 0) factors.push('Uregelmessigheter i dataene');

    return factors;
  }

  private generateRiskRecommendations(riskScore: number, client: Client): string[] {
    const recommendations: string[] = [];

    if (riskScore > 70) {
      recommendations.push('Økt revisjonsintensitet anbefales');
      recommendations.push('Gjennomgang av interne kontroller');
    } else if (riskScore > 50) {
      recommendations.push('Utvidet prøvetaking i risikoområder');
    } else {
      recommendations.push('Standard revisjonsprosedyrer');
    }

    return recommendations;
  }
}