import { supabase } from '@/integrations/supabase/client';

export interface AccountFlowNode {
  accountNumber: string;
  accountName: string;
  auditArea: string;
  totalInflow: number;
  totalOutflow: number;
  transactionCount: number;
}

export interface AccountFlowEdge {
  fromAccount: string;
  toAccount: string;
  totalAmount: number;
  transactionCount: number;
  averageAmount: number;
  isUnusual: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface TransactionFlowData {
  nodes: AccountFlowNode[];
  edges: AccountFlowEdge[];
  totalFlowAmount: number;
  unusualFlows: AccountFlowEdge[];
  auditAreaFlows: Array<{
    fromArea: string;
    toArea: string;
    amount: number;
    count: number;
  }>;
}

export class TransactionFlowService {
  
  /**
   * Analyserer transaksjonsflyt mellom kontoer
   */
  async analyzeTransactionFlow(clientId: string, versionId?: string): Promise<TransactionFlowData> {
    const transactions = await this.getVoucherGroupedTransactions(clientId, versionId);
    const auditAreaMappings = await this.getAuditAreaMappings(clientId);
    
    const flowEdges = this.calculateAccountFlows(transactions, auditAreaMappings);
    const flowNodes = this.calculateNodeMetrics(flowEdges, auditAreaMappings);
    const auditAreaFlows = this.calculateAuditAreaFlows(flowEdges, auditAreaMappings);
    
    return {
      nodes: flowNodes,
      edges: flowEdges,
      totalFlowAmount: flowEdges.reduce((sum, edge) => sum + edge.totalAmount, 0),
      unusualFlows: flowEdges.filter(edge => edge.isUnusual),
      auditAreaFlows
    };
  }

  /**
   * Hent transaksjoner gruppert per bilag
   */
  private async getVoucherGroupedTransactions(clientId: string, versionId?: string) {
    let query = supabase
      .from('general_ledger_transactions')
      .select(`
        id,
        transaction_date,
        debit_amount,
        credit_amount,
        voucher_number,
        description,
        client_chart_of_accounts!inner(
          account_number,
          account_name,
          account_mappings(
            standard_accounts(
              analysis_group
            )
          )
        )
      `)
      .eq('client_id', clientId);

    if (versionId) {
      query = query.eq('version_id', versionId);
    }

    const { data, error } = await query.order('voucher_number');
    
    if (error) throw error;
    return data || [];
  }

  /**
   * Hent audit area mappings
   */
  private async getAuditAreaMappings(clientId: string) {
    const { data, error } = await supabase
      .from('client_chart_of_accounts')
      .select(`
        account_number,
        account_name,
        account_mappings(
          standard_accounts(
            analysis_group
          )
        )
      `)
      .eq('client_id', clientId);

    if (error) throw error;
    
    const mapping: Record<string, { name: string; auditArea: string }> = {};
    data?.forEach(account => {
      const auditArea = account.account_mappings?.[0]?.standard_accounts?.analysis_group || 'other';
      mapping[account.account_number] = {
        name: account.account_name,
        auditArea
      };
    });
    
    return mapping;
  }

  /**
   * Beregn flyt mellom kontoer basert på bilag
   */
  private calculateAccountFlows(
    transactions: any[], 
    auditAreaMappings: Record<string, { name: string; auditArea: string }>
  ): AccountFlowEdge[] {
    const flowMap = new Map<string, {
      fromAccount: string;
      toAccount: string;
      amounts: number[];
      count: number;
    }>();

    // Grupper transaksjoner per bilag
    const voucherGroups = new Map<string, any[]>();
    transactions.forEach(tx => {
      const voucherNum = tx.voucher_number || 'NO_VOUCHER';
      if (!voucherGroups.has(voucherNum)) {
        voucherGroups.set(voucherNum, []);
      }
      voucherGroups.get(voucherNum)!.push(tx);
    });

    // Analyser flyt innen hvert bilag
    voucherGroups.forEach(voucherTxs => {
      const debits = voucherTxs.filter(tx => (tx.debit_amount || 0) > 0);
      const credits = voucherTxs.filter(tx => (tx.credit_amount || 0) > 0);

      // Lag forbindelser mellom debet- og kreditkontoer
      debits.forEach(debitTx => {
        credits.forEach(creditTx => {
          const fromAccount = creditTx.client_chart_of_accounts?.account_number;
          const toAccount = debitTx.client_chart_of_accounts?.account_number;
          
          if (fromAccount && toAccount && fromAccount !== toAccount) {
            const flowKey = `${fromAccount}_${toAccount}`;
            const amount = Math.min(
              debitTx.debit_amount || 0,
              creditTx.credit_amount || 0
            );

            if (!flowMap.has(flowKey)) {
              flowMap.set(flowKey, {
                fromAccount,
                toAccount,
                amounts: [],
                count: 0
              });
            }

            const flow = flowMap.get(flowKey)!;
            flow.amounts.push(amount);
            flow.count++;
          }
        });
      });
    });

    // Konverter til AccountFlowEdge[]
    const flows: AccountFlowEdge[] = [];
    flowMap.forEach(flow => {
      const totalAmount = flow.amounts.reduce((sum, amt) => sum + amt, 0);
      const averageAmount = totalAmount / flow.amounts.length;
      
      // Bestem om flyten er uvanlig
      const fromAuditArea = auditAreaMappings[flow.fromAccount]?.auditArea || 'other';
      const toAuditArea = auditAreaMappings[flow.toAccount]?.auditArea || 'other';
      const isUnusual = this.isUnusualFlow(fromAuditArea, toAuditArea, flow.count, averageAmount);
      
      flows.push({
        fromAccount: flow.fromAccount,
        toAccount: flow.toAccount,
        totalAmount,
        transactionCount: flow.count,
        averageAmount,
        isUnusual,
        riskLevel: this.calculateFlowRiskLevel(isUnusual, flow.count, averageAmount)
      });
    });

    return flows.sort((a, b) => b.totalAmount - a.totalAmount);
  }

  /**
   * Beregn node-metrikker
   */
  private calculateNodeMetrics(
    flows: AccountFlowEdge[],
    auditAreaMappings: Record<string, { name: string; auditArea: string }>
  ): AccountFlowNode[] {
    const nodeMap = new Map<string, {
      inflow: number;
      outflow: number;
      inCount: number;
      outCount: number;
    }>();

    // Samle inn- og utflyt per konto
    flows.forEach(flow => {
      // Outflow fra source
      if (!nodeMap.has(flow.fromAccount)) {
        nodeMap.set(flow.fromAccount, { inflow: 0, outflow: 0, inCount: 0, outCount: 0 });
      }
      const fromNode = nodeMap.get(flow.fromAccount)!;
      fromNode.outflow += flow.totalAmount;
      fromNode.outCount += flow.transactionCount;

      // Inflow til target
      if (!nodeMap.has(flow.toAccount)) {
        nodeMap.set(flow.toAccount, { inflow: 0, outflow: 0, inCount: 0, outCount: 0 });
      }
      const toNode = nodeMap.get(flow.toAccount)!;
      toNode.inflow += flow.totalAmount;
      toNode.inCount += flow.transactionCount;
    });

    // Konverter til AccountFlowNode[]
    const nodes: AccountFlowNode[] = [];
    nodeMap.forEach((metrics, accountNumber) => {
      const accountInfo = auditAreaMappings[accountNumber];
      nodes.push({
        accountNumber,
        accountName: accountInfo?.name || 'Ukjent konto',
        auditArea: accountInfo?.auditArea || 'other',
        totalInflow: metrics.inflow,
        totalOutflow: metrics.outflow,
        transactionCount: metrics.inCount + metrics.outCount
      });
    });

    return nodes.sort((a, b) => 
      (b.totalInflow + b.totalOutflow) - (a.totalInflow + a.totalOutflow)
    );
  }

  /**
   * Beregn flyt mellom audit areas
   */
  private calculateAuditAreaFlows(
    flows: AccountFlowEdge[],
    auditAreaMappings: Record<string, { name: string; auditArea: string }>
  ) {
    const areaFlowMap = new Map<string, { amount: number; count: number }>();

    flows.forEach(flow => {
      const fromArea = auditAreaMappings[flow.fromAccount]?.auditArea || 'other';
      const toArea = auditAreaMappings[flow.toAccount]?.auditArea || 'other';
      
      if (fromArea !== toArea) {
        const key = `${fromArea}_${toArea}`;
        if (!areaFlowMap.has(key)) {
          areaFlowMap.set(key, { amount: 0, count: 0 });
        }
        const areaFlow = areaFlowMap.get(key)!;
        areaFlow.amount += flow.totalAmount;
        areaFlow.count += flow.transactionCount;
      }
    });

    return Array.from(areaFlowMap.entries()).map(([key, metrics]) => {
      const [fromArea, toArea] = key.split('_');
      return {
        fromArea,
        toArea,
        amount: metrics.amount,
        count: metrics.count
      };
    }).sort((a, b) => b.amount - a.amount);
  }

  /**
   * Vurder om en flyt er uvanlig
   */
  private isUnusualFlow(
    fromAuditArea: string,
    toAuditArea: string,
    transactionCount: number,
    averageAmount: number
  ): boolean {
    // Definer forventede flyter
    const expectedFlows: Record<string, string[]> = {
      'sales': ['receivables', 'cash', 'bank'],
      'receivables': ['cash', 'bank', 'bad_debt'],
      'purchases': ['payables', 'inventory', 'expenses'],
      'payables': ['cash', 'bank'],
      'inventory': ['cogs', 'adjustments'],
      'cash': ['bank', 'expenses', 'payables', 'receivables'],
      'bank': ['cash', 'expenses', 'payables', 'receivables'],
      'payroll': ['cash', 'bank', 'payables', 'tax_payables'],
      'expenses': ['cash', 'bank', 'payables', 'accruals']
    };

    // Sjekk om flyten er uventet
    const expectedTargets = expectedFlows[fromAuditArea] || [];
    const isUnexpectedFlow = !expectedTargets.includes(toAuditArea);

    // Sjekk for andre uvanlige mønstre
    const isSingleTransaction = transactionCount === 1;
    const isLargeAmount = averageAmount > 100000; // Over 100k kan være uvanlig
    const isRoundAmount = averageAmount % 1000 === 0 && averageAmount >= 10000;

    return isUnexpectedFlow || (isSingleTransaction && (isLargeAmount || isRoundAmount));
  }

  /**
   * Beregn risikonivå for flyt
   */
  private calculateFlowRiskLevel(
    isUnusual: boolean,
    transactionCount: number,
    averageAmount: number
  ): 'low' | 'medium' | 'high' {
    if (isUnusual && averageAmount > 50000) return 'high';
    if (isUnusual || (transactionCount === 1 && averageAmount > 25000)) return 'medium';
    return 'low';
  }
}

export const transactionFlowService = new TransactionFlowService();