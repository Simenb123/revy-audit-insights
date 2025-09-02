// Shared transaction mapping utilities
// This eliminates duplication across multiple hooks

export interface GeneralLedgerTransaction {
  id: string;
  transaction_date: string;
  account_number: string;
  account_name?: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
  voucher_number?: string;
  version_id?: string;
  client_id: string;
  client_account_id: string;
}

export interface MappedTransaction {
  id: string;
  transaction_date: string;
  account_no: string;
  account_name: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
  amount: number;
  voucher_number: string;
  version_id?: string;
  client_id: string;
  client_account_id: string;
}

/**
 * Maps a general ledger transaction to the standard format used across the application
 */
export function mapTransaction(transaction: any): MappedTransaction {
  const debitAmount = Number(transaction.debit_amount) || 0;
  const creditAmount = Number(transaction.credit_amount) || 0;
  const amount = debitAmount > 0 ? debitAmount : -creditAmount;

  return {
    id: transaction.id,
    transaction_date: transaction.transaction_date,
    account_no: transaction.account_number || 'Ukjent',
    account_name: transaction.account_name || 'Ukjent konto',
    description: transaction.description || 'Ingen beskrivelse',
    debit_amount: debitAmount,
    credit_amount: creditAmount,
    amount,
    voucher_number: transaction.voucher_number || '',
    version_id: transaction.version_id,
    client_id: transaction.client_id,
    client_account_id: transaction.client_account_id
  };
}

/**
 * Maps multiple transactions efficiently
 */
export function mapTransactions(transactions: any[]): MappedTransaction[] {
  return transactions.map(mapTransaction);
}

/**
 * Calculate net balance for an account based on debit/credit amounts
 * For assets and expenses: debit increases balance
 * For liabilities, equity, and income: credit increases balance
 */
export function calculateAccountBalance(
  accountNumber: string,
  totalDebit: number,
  totalCredit: number,
  openingBalance: number = 0
): number {
  // Determine account type based on account number
  const isDebitAccount = accountNumber.startsWith('1') || 
                        accountNumber.startsWith('2') || 
                        accountNumber.startsWith('6') || 
                        accountNumber.startsWith('7');
  
  if (isDebitAccount) {
    return openingBalance + totalDebit - totalCredit;
  } else {
    return openingBalance + totalCredit - totalDebit;
  }
}

/**
 * Format currency amounts consistently
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 2
  }).format(amount);
}