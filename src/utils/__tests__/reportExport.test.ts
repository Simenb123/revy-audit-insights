import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock jsPDF and autoTable
const mockJsPDF = {
  text: vi.fn(),
  setFont: vi.fn(),
  setFontSize: vi.fn(),
  setTextColor: vi.fn(),
  addPage: vi.fn(),
  autoTable: vi.fn(),
  save: vi.fn(),
  internal: {
    pageSize: {
      getWidth: vi.fn(() => 210),
      getHeight: vi.fn(() => 297)
    }
  }
};

vi.mock('jspdf', () => ({
  default: vi.fn(() => mockJsPDF)
}));

vi.mock('jspdf-autotable', () => ({}));

// Import after mocking
import { exportAnalysisReportToPDF } from '../reportExport';

describe('reportExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('exportAnalysisReportToPDF', () => {
    const mockReportData = {
      clientName: 'Test Client AS',
      reportDate: '2024-01-15',
      fiscalYear: '2024',
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
          { account_number: '3000', transaction_count: 400 },
          { account_number: '4000', transaction_count: 300 }
        ]
      },
      controlTests: [
        {
          testId: 'voucher_balance_test',
          testName: 'Bilagsbalanse test',
          result: 'PASS',
          severity: 'HIGH',
          details: []
        },
        {
          testId: 'duplicate_transactions_test',
          testName: 'Duplikat transaksjoner',
          result: 'FAIL',
          severity: 'MEDIUM',
          details: ['Found 3 potential duplicates']
        }
      ],
      riskScoring: {
        overallRisk: 0.35,
        transactionRisks: [
          {
            transactionId: '1',
            riskScore: 0.8,
            riskFactors: ['weekend_posting', 'large_amount']
          },
          {
            transactionId: '2',
            riskScore: 0.2,
            riskFactors: []
          }
        ]
      },
      aiAnalysis: {
        summary: 'Overall transaction patterns appear normal',
        key_findings: [
          'High concentration of transactions in Q4',
          'Some unusual weekend activity detected'
        ],
        recommendations: [
          'Review weekend posting procedures',
          'Implement additional controls for large transactions'
        ]
      }
    };

    it('should create PDF with comprehensive analysis', () => {
      exportAnalysisReportToPDF({
        reportData: mockReportData,
        analysisType: 'comprehensive',
        dateRange: {
          start: '2024-01-01',
          end: '2024-12-31'
        }
      });

      // Verify PDF creation
      expect(mockJsPDF.text).toHaveBeenCalled();
      expect(mockJsPDF.setFont).toHaveBeenCalled();
      expect(mockJsPDF.setFontSize).toHaveBeenCalled();
      expect(mockJsPDF.autoTable).toHaveBeenCalled();
      expect(mockJsPDF.save).toHaveBeenCalledWith('Revisjonsrapport_Test_Client_AS_2024-01-15.pdf');
    });

    it('should create PDF with executive template', () => {
      exportAnalysisReportToPDF({
        reportData: mockReportData,
        analysisType: 'executive',
        dateRange: {
          start: '2024-01-01',
          end: '2024-12-31'
        }
      });

      expect(mockJsPDF.save).toHaveBeenCalledWith('Lederrapport_Test_Client_AS_2024-01-15.pdf');
    });

    it('should create PDF with technical template', () => {
      exportAnalysisReportToPDF({
        reportData: mockReportData,
        analysisType: 'technical',
        dateRange: {
          start: '2024-01-01',
          end: '2024-12-31'
        }
      });

      expect(mockJsPDF.save).toHaveBeenCalledWith('Teknisk_rapport_Test_Client_AS_2024-01-15.pdf');
    });

    it('should handle missing optional data gracefully', () => {
      const minimalReportData = {
        clientName: 'Minimal Client',
        reportDate: '2024-01-15',
        fiscalYear: '2024',
        basicAnalysis: {
          total_transactions: 10,
          amount_statistics: {
            total: 1000,
            average: 100,
            min: 50,
            max: 200
          }
        }
      };

      expect(() => {
        exportAnalysisReportToPDF({
          reportData: minimalReportData,
          analysisType: 'comprehensive',
          dateRange: {
            start: '2024-01-01',
            end: '2024-12-31'
          }
        });
      }).not.toThrow();

      expect(mockJsPDF.save).toHaveBeenCalled();
    });

    it('should include risk distribution when available', () => {
      exportAnalysisReportToPDF({
        reportData: mockReportData,
        analysisType: 'comprehensive',
        dateRange: {
          start: '2024-01-01',
          end: '2024-12-31'
        }
      });

      // Check that autoTable was called multiple times (for different sections)
      expect(mockJsPDF.autoTable).toHaveBeenCalledTimes(4); // Basic stats, control tests, risk distribution, AI findings
    });

    it('should format Norwegian currency correctly', () => {
      exportAnalysisReportToPDF({
        reportData: mockReportData,
        analysisType: 'comprehensive',
        dateRange: {
          start: '2024-01-01',
          end: '2024-12-31'
        }
      });

      // Verify that text includes formatted currency
      const textCalls = mockJsPDF.text.mock.calls;
      const hasFormattedCurrency = textCalls.some(call => 
        typeof call[0] === 'string' && call[0].includes('kr')
      );
      expect(hasFormattedCurrency).toBe(true);
    });

    it('should generate unique filename with timestamp', () => {
      const now = new Date();
      const dateString = now.toISOString().split('T')[0];
      
      exportAnalysisReportToPDF({
        reportData: { ...mockReportData, reportDate: dateString },
        analysisType: 'comprehensive',
        dateRange: {
          start: '2024-01-01',
          end: '2024-12-31'
        }
      });

      expect(mockJsPDF.save).toHaveBeenCalledWith(
        expect.stringContaining(`Test_Client_AS_${dateString}`)
      );
    });
  });
});