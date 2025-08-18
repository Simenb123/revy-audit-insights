import React from 'react';
import { usePayrollSubmissionDetails } from '@/hooks/usePayrollDetailedData';

interface PayrollSubmissionDetailsTabProps {
  importId: string;
}

const PayrollSubmissionDetailsTab = ({ importId }: PayrollSubmissionDetailsTabProps) => {
  const { data: submissionDetails, isLoading } = usePayrollSubmissionDetails(importId);

  if (isLoading) {
    return <div className="text-center py-4">Laster innsendingsdetaljer...</div>;
  }

  if (!submissionDetails || submissionDetails.length === 0) {
    return <div className="text-center py-4">Ingen innsendingsdetaljer funnet.</div>;
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
                Altinn-referanse
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Innsendingsstatus
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Kildesystem
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Leveringstidspunkt
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Meldings-ID
              </th>
            </tr>
          </thead>
          <tbody className="bg-background divide-y divide-border">
            {submissionDetails.map((submission) => (
              <tr key={submission.id} className="hover:bg-muted/50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {submission.calendar_month}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground font-mono">
                  {submission.altinn_reference || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    submission.status === 'GODKJENT' 
                      ? 'bg-green-100 text-green-800' 
                      : submission.status === 'AVVIST'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {submission.status || 'Ukjent'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {submission.source_system || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {submission.delivery_time 
                    ? new Date(submission.delivery_time).toLocaleString('no-NO')
                    : '-'
                  }
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground font-mono">
                  {submission.message_id || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PayrollSubmissionDetailsTab;