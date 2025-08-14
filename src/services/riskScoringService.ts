export interface RiskFactor {
  name: string;
  description: string;
  weight: number;
  category: 'timing' | 'amount' | 'description' | 'frequency' | 'user';
}

export interface TransactionRiskScore {
  transactionId: string;
  voucherNumber: string;
  totalScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  triggeredFactors: Array<{
    factor: RiskFactor;
    points: number;
    details: string;
  }>;
  accountNumber: string;
  amount: number;
  date: string;
  description: string;
}

export interface RiskScoringResults {
  totalTransactions: number;
  highRiskTransactions: TransactionRiskScore[];
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  topRiskFactors: Array<{
    factor: RiskFactor;
    frequency: number;
  }>;
}

export class RiskScoringService {
  
  // Definerte risikofaktorer med vekter
  private readonly riskFactors: RiskFactor[] = [
    {
      name: 'weekend_posting',
      description: 'Transaksjon postert på helg',
      weight: 2,
      category: 'timing'
    },
    {
      name: 'holiday_posting', 
      description: 'Transaksjon postert på helligdag',
      weight: 3,
      category: 'timing'
    },
    {
      name: 'round_amount',
      description: 'Runde beløp som kan indikere manuell justering',
      weight: 1,
      category: 'amount'
    },
    {
      name: 'large_amount',
      description: 'Unusually large transaction amount',
      weight: 2,
      category: 'amount'
    },
    {
      name: 'threshold_amount',
      description: 'Beløp rett under vanlige autorisasjonsgrenser',
      weight: 3,
      category: 'amount'
    },
    {
      name: 'correction_keywords',
      description: 'Beskrivelse inneholder korreksjons-relaterte ord',
      weight: 2,
      category: 'description'
    },
    {
      name: 'manual_keywords',
      description: 'Beskrivelse indikerer manuell postering',
      weight: 1,
      category: 'description'
    },
    {
      name: 'rare_account',
      description: 'Sjeldent brukt konto',
      weight: 1,
      category: 'frequency'
    },
    {
      name: 'late_posting',
      description: 'Postering sent på kvelden eller natten',
      weight: 1,
      category: 'timing'
    },
    {
      name: 'period_end_posting',
      description: 'Postering på siste dag i perioden',
      weight: 2,
      category: 'timing'
    }
  ];

  /**
   * Utfører risikoskåring på alle transaksjoner
   */
  async scoreTransactionRisk(transactions: any[], accountUsageStats?: Map<string, number>): Promise<RiskScoringResults> {
    const scoredTransactions: TransactionRiskScore[] = [];
    const factorFrequency = new Map<string, number>();
    
    // Beregn kontobruksstatistikk hvis ikke oppgitt
    if (!accountUsageStats) {
      accountUsageStats = this.calculateAccountUsageStats(transactions);
    }
    
    // Beregn beløpsstatistikk for å identifisere "store" transaksjoner
    const amounts = transactions
      .map(tx => Math.abs(tx.debit_amount || tx.credit_amount || 0))
      .filter(amount => amount > 0);
    const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
    const largeAmountThreshold = avgAmount * 3; // 3x gjennomsnitt regnes som "stort"
    
    // Vanlige autorisasjonsgrenser i Norge
    const authorizationThresholds = [5000, 10000, 25000, 50000, 100000, 500000];

    transactions.forEach(tx => {
      const riskScore = this.scoreTransaction(
        tx, 
        accountUsageStats!, 
        largeAmountThreshold, 
        authorizationThresholds,
        factorFrequency
      );
      
      if (riskScore.totalScore > 0) {
        scoredTransactions.push(riskScore);
      }
    });

    // Sorter etter risikoscore
    scoredTransactions.sort((a, b) => b.totalScore - a.totalScore);

    // Beregn risikofordeling
    const riskDistribution = {
      low: scoredTransactions.filter(tx => tx.riskLevel === 'low').length,
      medium: scoredTransactions.filter(tx => tx.riskLevel === 'medium').length,
      high: scoredTransactions.filter(tx => tx.riskLevel === 'high').length,
      critical: scoredTransactions.filter(tx => tx.riskLevel === 'critical').length
    };

    // Identifiser topp risikofaktorer
    const topRiskFactors = Array.from(factorFrequency.entries())
      .map(([factorName, frequency]) => ({
        factor: this.riskFactors.find(f => f.name === factorName)!,
        frequency
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    return {
      totalTransactions: transactions.length,
      highRiskTransactions: scoredTransactions.filter(tx => 
        tx.riskLevel === 'high' || tx.riskLevel === 'critical'
      ),
      riskDistribution,
      topRiskFactors
    };
  }

  /**
   * Skårer en enkelt transaksjon
   */
  private scoreTransaction(
    transaction: any,
    accountUsageStats: Map<string, number>,
    largeAmountThreshold: number,
    authorizationThresholds: number[],
    factorFrequency: Map<string, number>
  ): TransactionRiskScore {
    
    const triggeredFactors: Array<{
      factor: RiskFactor;
      points: number;
      details: string;
    }> = [];

    const txDate = new Date(transaction.transaction_date);
    const amount = Math.abs(transaction.debit_amount || transaction.credit_amount || 0);
    const description = (transaction.description || '').toLowerCase();
    const accountNumber = transaction.client_chart_of_accounts?.account_number || '';
    
    // Test hver risikofaktor
    this.riskFactors.forEach(factor => {
      let points = 0;
      let details = '';
      
      switch (factor.name) {
        case 'weekend_posting':
          const dayOfWeek = txDate.getDay();
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            points = factor.weight;
            details = `Postert på ${dayOfWeek === 0 ? 'søndag' : 'lørdag'}`;
          }
          break;
          
        case 'holiday_posting':
          const monthDay = `${String(txDate.getMonth() + 1).padStart(2, '0')}-${String(txDate.getDate()).padStart(2, '0')}`;
          const holidays = ['01-01', '05-01', '05-17', '12-25', '12-26'];
          if (holidays.includes(monthDay)) {
            points = factor.weight;
            details = 'Postert på helligdag';
          }
          break;
          
        case 'round_amount':
          if (this.isRoundAmount(amount)) {
            points = factor.weight;
            details = `Runde beløp: ${amount.toLocaleString('no-NO')}`;
          }
          break;
          
        case 'large_amount':
          if (amount > largeAmountThreshold) {
            points = factor.weight;
            details = `Stort beløp: ${amount.toLocaleString('no-NO')} (>3x gjennomsnitt)`;
          }
          break;
          
        case 'threshold_amount':
          const nearThreshold = authorizationThresholds.find(threshold => 
            amount >= threshold * 0.95 && amount < threshold
          );
          if (nearThreshold) {
            points = factor.weight;
            details = `Rett under autorisasjonsgrense ${nearThreshold.toLocaleString('no-NO')}`;
          }
          break;
          
        case 'correction_keywords':
          const correctionWords = ['korreksjon', 'korrigering', 'justering', 'feil', 'rettet', 'endret'];
          if (correctionWords.some(word => description.includes(word))) {
            points = factor.weight;
            details = 'Inneholder korreksjonsord';
          }
          break;
          
        case 'manual_keywords':
          const manualWords = ['manuell', 'manual', 'håndtert', 'override'];
          if (manualWords.some(word => description.includes(word))) {
            points = factor.weight;
            details = 'Indikerer manuell håndtering';
          }
          break;
          
        case 'rare_account':
          const accountUsage = accountUsageStats.get(accountNumber) || 0;
          const totalTransactions = Array.from(accountUsageStats.values()).reduce((sum, count) => sum + count, 0);
          const usagePercentage = (accountUsage / totalTransactions) * 100;
          if (usagePercentage < 1) { // Mindre enn 1% av transaksjoner
            points = factor.weight;
            details = `Sjelden brukt konto (${usagePercentage.toFixed(1)}% av transaksjoner)`;
          }
          break;
          
        case 'late_posting':
          const hour = txDate.getHours();
          if (hour >= 22 || hour <= 5) {
            points = factor.weight;
            details = `Postert kl ${hour}:${String(txDate.getMinutes()).padStart(2, '0')}`;
          }
          break;
          
        case 'period_end_posting':
          const lastDayOfMonth = new Date(txDate.getFullYear(), txDate.getMonth() + 1, 0).getDate();
          if (txDate.getDate() === lastDayOfMonth) {
            points = factor.weight;
            details = 'Postert på siste dag i måneden';
          }
          break;
      }
      
      if (points > 0) {
        triggeredFactors.push({ factor, points, details });
        factorFrequency.set(factor.name, (factorFrequency.get(factor.name) || 0) + 1);
      }
    });

    const totalScore = triggeredFactors.reduce((sum, tf) => sum + tf.points, 0);
    
    return {
      transactionId: transaction.id,
      voucherNumber: transaction.voucher_number || 'N/A',
      totalScore,
      riskLevel: this.getRiskLevel(totalScore),
      triggeredFactors,
      accountNumber,
      amount,
      date: transaction.transaction_date,
      description: transaction.description || ''
    };
  }

  /**
   * Beregner kontobruksstatistikk
   */
  private calculateAccountUsageStats(transactions: any[]): Map<string, number> {
    const stats = new Map<string, number>();
    
    transactions.forEach(tx => {
      const accountNumber = tx.client_chart_of_accounts?.account_number || 'unknown';
      stats.set(accountNumber, (stats.get(accountNumber) || 0) + 1);
    });
    
    return stats;
  }

  /**
   * Sjekker om et beløp er "rundt"
   */
  private isRoundAmount(amount: number): boolean {
    // Sjekk for runde beløp som 1000, 5000, 10000, osv.
    if (amount >= 1000) {
      // For beløp over 1000, sjekk om de er delelige med 1000, 5000, eller 10000
      return amount % 1000 === 0 || amount % 5000 === 0 || amount % 10000 === 0;
    } else if (amount >= 100) {
      // For beløp over 100, sjekk om de er delelige med 100 eller 500
      return amount % 100 === 0 || amount % 500 === 0;
    } else {
      // For mindre beløp, sjekk om de er delelige med 10 eller 50
      return amount % 10 === 0 || amount % 50 === 0;
    }
  }

  /**
   * Bestemmer risikonivå basert på total score
   */
  private getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 8) return 'critical';
    if (score >= 5) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }
}

export const riskScoringService = new RiskScoringService();