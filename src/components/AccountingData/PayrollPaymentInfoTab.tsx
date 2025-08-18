import React from 'react';
import { formatCurrency } from '@/lib/utils';
import { usePayrollPaymentInfo } from '@/hooks/usePayrollDetailedData';

interface PayrollPaymentInfoTabProps {
  importId: string;
}

const PayrollPaymentInfoTab = ({ importId }: PayrollPaymentInfoTabProps) => {
  const { data: paymentInfo, isLoading } = usePayrollPaymentInfo(importId);

  if (isLoading) {
    return <div className="text-center py-4">Laster betalingsinformasjon...</div>;
  }

  if (!paymentInfo || paymentInfo.length === 0) {
    return <div className="text-center py-4">Ingen betalingsinformasjon funnet.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Måned
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Kontonummer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                KID Arbeidsgiveravgift
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                KID Forskuddstrekk
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                KID Finansskatt
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Forfallsdato
              </th>
            </tr>
          </thead>
          <tbody className="bg-background divide-y divide-border">
            {paymentInfo.map((payment) => (
              <tr key={payment.id} className="hover:bg-muted/50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {payment.calendar_month}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {payment.account_number || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground font-mono">
                  {payment.kid_arbeidsgiveravgift || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground font-mono">
                  {payment.kid_forskuddstrekk || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground font-mono">
                  {payment.kid_finansskatt || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {payment.due_date ? new Date(payment.due_date).toLocaleDateString('no-NO') : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PayrollPaymentInfoTab;