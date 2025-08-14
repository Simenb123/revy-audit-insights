import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ComprehensiveAnalysisDashboard } from '../ComprehensiveAnalysisDashboard';

// Mock the analysis service
const mockAnalysisService = {
  performComprehensiveAnalysis: vi.fn()
};

vi.mock('@/services/analysisService', () => ({
  analysisService: mockAnalysisService
}));

// Mock the performance monitor hook
vi.mock('@/hooks/usePerformanceMonitor', () => ({
  usePerformanceMonitor: () => ({
    metrics: {
      renderTime: 45.2,
      loadTime: 234.1,
      memoryUsage: 23.4
    },
    isLoading: false,
    warnings: []
  })
}));

// Mock other components
vi.mock('../ControlTestResults', () => ({
  ControlTestResults: ({ results }: any) => (
    <div data-testid="control-test-results">
      Control tests: {results?.length || 0} tests
    </div>
  )
}));

vi.mock('../RiskScoringResults', () => ({
  RiskScoringResults: ({ results }: any) => (
    <div data-testid="risk-scoring-results">
      Risk score: {results?.overallRisk || 0}
    </div>
  )
}));

vi.mock('../AIAnalysisResults', () => ({
  AIAnalysisResults: ({ results }: any) => (
    <div data-testid="ai-analysis-results">
      AI insights: {results?.key_findings?.length || 0} findings
    </div>
  )
}));

vi.mock('../ReportGeneratorPanel', () => ({
  ReportGeneratorPanel: () => <div data-testid="report-generator">Report Generator</div>
}));

vi.mock('../AnalysisConfigurationPanel', () => ({
  AnalysisConfigurationPanel: () => <div data-testid="config-panel">Configuration Panel</div>
}));

vi.mock('../TransactionFlowAnalysis', () => ({
  TransactionFlowAnalysis: () => <div data-testid="flow-analysis">Flow Analysis</div>
}));

vi.mock('../AnalysisProgressIndicator', () => ({
  AnalysisProgressIndicator: ({ progress }: any) => (
    <div data-testid="progress-indicator">
      Progress: {Math.round(progress.overallProgress)}%
    </div>
  )
}));

const mockAnalysisResults = {
  basicAnalysis: {
    total_transactions: 1000,
    amount_statistics: {
      total: 500000,
      average: 500,
      min: 10,
      max: 50000
    },
    date_range: {
      start: '2024-01-01',
      end: '2024-12-31'
    },
    account_distribution: [
      { account_number: '1500', transaction_count: 300 },
      { account_number: '3000', transaction_count: 400 }
    ]
  },
  controlTests: [
    {
      testId: 'voucher_balance_test',
      testName: 'Bilagsbalanse test',
      result: 'PASS',
      severity: 'HIGH'
    },
    {
      testId: 'duplicate_test',
      testName: 'Duplikat test',
      result: 'FAIL',
      severity: 'MEDIUM'
    }
  ],
  riskScoring: {
    overallRisk: 0.35,
    transactionRisks: [
      {
        transactionId: '1',
        riskScore: 0.8,
        riskFactors: ['weekend_posting']
      }
    ]
  },
  aiAnalysis: {
    summary: 'Analysis complete',
    key_findings: [
      'High transaction volume in Q4',
      'Some weekend activities detected'
    ],
    recommendations: [
      'Review weekend posting procedures'
    ]
  }
};

describe('ComprehensiveAnalysisDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAnalysisService.performComprehensiveAnalysis.mockResolvedValue(mockAnalysisResults);
  });

  it('should render loading state initially', () => {
    render(
      <ComprehensiveAnalysisDashboard 
        clientId="test-client" 
        dataVersionId="test-version" 
      />
    );

    expect(screen.getByText('Kjører omfattende analyse...')).toBeInTheDocument();
  });

  it('should display analysis results after loading', async () => {
    render(
      <ComprehensiveAnalysisDashboard 
        clientId="test-client" 
        dataVersionId="test-version" 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('1.000')).toBeInTheDocument(); // Total transactions
    });

    expect(screen.getByText('2/2')).toBeInTheDocument(); // Tests passed/total
    expect(screen.getByText('35%')).toBeInTheDocument(); // Risk score
    expect(screen.getByText('1')).toBeInTheDocument(); // High risk transactions
  });

  it('should switch between tabs correctly', async () => {
    render(
      <ComprehensiveAnalysisDashboard 
        clientId="test-client" 
        dataVersionId="test-version" 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('1.000')).toBeInTheDocument();
    });

    // Click on control tests tab
    fireEvent.click(screen.getByText('Kontrolltester'));
    expect(screen.getByTestId('control-test-results')).toBeInTheDocument();

    // Click on risk scoring tab
    fireEvent.click(screen.getByText('Risikoskåring'));
    expect(screen.getByTestId('risk-scoring-results')).toBeInTheDocument();

    // Click on AI analysis tab
    fireEvent.click(screen.getByText('AI-analyse'));
    expect(screen.getByTestId('ai-analysis-results')).toBeInTheDocument();
  });

  it('should display error message when analysis fails', async () => {
    mockAnalysisService.performComprehensiveAnalysis.mockRejectedValue(
      new Error('Analysis failed')
    );

    render(
      <ComprehensiveAnalysisDashboard 
        clientId="test-client" 
        dataVersionId="test-version" 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Analysis failed')).toBeInTheDocument();
    });
  });

  it('should run new analysis when button is clicked', async () => {
    render(
      <ComprehensiveAnalysisDashboard 
        clientId="test-client" 
        dataVersionId="test-version" 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('1.000')).toBeInTheDocument();
    });

    // Click the "Kjør ny analyse" button
    fireEvent.click(screen.getByText('Kjør ny analyse'));

    expect(mockAnalysisService.performComprehensiveAnalysis).toHaveBeenCalledTimes(2);
  });

  it('should show progress indicator during analysis', async () => {
    let resolveAnalysis: (value: any) => void;
    const analysisPromise = new Promise(resolve => {
      resolveAnalysis = resolve;
    });
    mockAnalysisService.performComprehensiveAnalysis.mockReturnValue(analysisPromise);

    render(
      <ComprehensiveAnalysisDashboard 
        clientId="test-client" 
        dataVersionId="test-version" 
      />
    );

    // Should show progress indicator
    expect(screen.getByTestId('progress-indicator')).toBeInTheDocument();

    // Resolve the analysis
    resolveAnalysis!(mockAnalysisResults);

    await waitFor(() => {
      expect(screen.getByText('1.000')).toBeInTheDocument();
    });
  });

  it('should calculate risk level correctly', async () => {
    // Test high risk scenario
    const highRiskResults = {
      ...mockAnalysisResults,
      riskScoring: {
        overallRisk: 0.8,
        transactionRisks: []
      }
    };
    mockAnalysisService.performComprehensiveAnalysis.mockResolvedValue(highRiskResults);

    render(
      <ComprehensiveAnalysisDashboard 
        clientId="test-client" 
        dataVersionId="test-version" 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('HIGH')).toBeInTheDocument();
    });
  });

  it('should show performance metrics in development mode', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ComprehensiveAnalysisDashboard 
        clientId="test-client" 
        dataVersionId="test-version" 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Performance Metrics (Dev)')).toBeInTheDocument();
      expect(screen.getByText(/Render Time:/)).toBeInTheDocument();
    });

    process.env.NODE_ENV = originalEnv;
  });

  it('should pass progress callback to analysis service', async () => {
    render(
      <ComprehensiveAnalysisDashboard 
        clientId="test-client" 
        dataVersionId="test-version" 
      />
    );

    await waitFor(() => {
      expect(mockAnalysisService.performComprehensiveAnalysis).toHaveBeenCalledWith(
        expect.objectContaining({
          clientId: 'test-client',
          dataVersionId: 'test-version',
          analysisType: 'risk_analysis',
          progressCallback: expect.any(Function)
        })
      );
    });
  });

  it('should display analysis summary correctly', async () => {
    render(
      <ComprehensiveAnalysisDashboard 
        clientId="test-client" 
        dataVersionId="test-version" 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('2024-01-01 - 2024-12-31')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Number of accounts
    });
  });
});