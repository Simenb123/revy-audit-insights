/**
 * Utility for computing net amounts when net_amount might be undefined
 */

export const calculateNet = (item: {
  net?: number;
  net_amount?: number;
  debit?: number;
  debit_amount?: number;
  credit?: number;
  credit_amount?: number;
}): number => {
  // Try to use existing net values first
  if (typeof item.net === 'number' && !isNaN(item.net)) {
    return item.net;
  }
  
  if (typeof item.net_amount === 'number' && !isNaN(item.net_amount)) {
    return item.net_amount;
  }
  
  // Fallback to calculating from debit and credit
  const debit = item.debit ?? item.debit_amount ?? 0;
  const credit = item.credit ?? item.credit_amount ?? 0;
  
  return debit - credit;
};

export const safeNet = (item: any): number => {
  const net = calculateNet(item);
  return isNaN(net) ? 0 : net;
};