export interface GeneralLedgerTransaction {
  id: string;
  client_id: string;
  version_id: string;
  transaction_date: string;
  account_number: string;
  account_name?: string;
  description: string;
  debit_amount: number | null;
  credit_amount: number | null;
  balance_amount?: number | null;
  reference_number?: string;
  voucher_number?: string;
  period_year: number;
  period_month: number;
  client_account_id?: string;
}

export interface MappedTransaction {
  id: string;
  transaction_date: string;
  account_number: string;
  account_name: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
  balance_amount: number;
  reference_number: string;
  voucher_number: string;
  period_year: number;
  period_month: number;
  client_account_id: string;
}

/**
 * Maps a raw transaction to the standardized MappedTransaction format
 */
export function mapTransaction(transaction: any): MappedTransaction {
  return {
    id: transaction.id,
    transaction_date: transaction.transaction_date,
    account_number: transaction.account_number || 'Ukjent',
    account_name: transaction.account_name || 'Ukjent konto',
    description: transaction.description || '',
    debit_amount: transaction.debit_amount || 0,
    credit_amount: transaction.credit_amount || 0,
    balance_amount: transaction.balance_amount || 0,
    reference_number: transaction.reference_number || '',
    voucher_number: transaction.voucher_number || '',
    period_year: transaction.period_year || new Date().getFullYear(),
    period_month: transaction.period_month || 1,
    client_account_id: transaction.client_account_id || ''
  };
}

/**
 * Maps an array of raw transactions to the standardized format
 */
export function mapTransactions(transactions: any[]): MappedTransaction[] {
  return transactions.map(mapTransaction);
}

/**
 * Calculates the net balance of an account based on its type and transaction amounts
 * For asset, expense accounts: Debit increases balance, Credit decreases balance
 * For liability, equity, revenue accounts: Credit increases balance, Debit decreases balance
 */
export function calculateAccountBalance(
  accountNumber: string,
  totalDebit: number,
  totalCredit: number,
  openingBalance: number = 0
): number {
  // Determine account type based on account number (Norwegian chart of accounts)
  const firstDigit = parseInt(accountNumber.charAt(0));
  
  let balance = openingBalance;
  
  if (firstDigit >= 1 && firstDigit <= 2) {
    // Assets (1xxx-2xxx): Debit increases, Credit decreases
    balance += totalDebit - totalCredit;
  } else if (firstDigit >= 3 && firstDigit <= 8) {
    // Liabilities, Equity, Revenue, Expenses (3xxx-8xxx): Credit increases, Debit decreases
    balance += totalCredit - totalDebit;
  } else {
    // Default behavior for unknown account types
    balance += totalDebit - totalCredit;
  }
  
  return balance;
}

/**
 * Formats a number as Norwegian currency (NOK)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}