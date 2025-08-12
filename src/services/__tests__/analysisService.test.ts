import { describe, it, expect } from 'vitest'
import { AnalysisService } from '../analysisService'

describe('analysis service zero amount handling', () => {
  const service = new AnalysisService()

  it('treats zero debit as zero amount', () => {
    const transactions = [
      { debit_amount: 0, credit_amount: 100 },
      { debit_amount: undefined, credit_amount: 0 }
    ]

    const stats = (service as any).calculateAmountStatistics(transactions)
    expect(stats.sum).toBe(0)
    expect(stats.positive_count).toBe(0)
    expect(stats.negative_count).toBe(0)
  })

  it('handles zero amounts in monthly summary', () => {
    const transactions = [
      { transaction_date: '2024-01-15', debit_amount: 0, credit_amount: 100 },
      { transaction_date: '2024-01-20', debit_amount: undefined, credit_amount: 0 }
    ]

    const summary = (service as any).calculateMonthlySummary(transactions)
    expect(summary).toEqual([{ month: '2024-01', count: 2, sum: 0 }])
  })
})
