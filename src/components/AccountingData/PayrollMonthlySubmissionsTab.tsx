import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { PayrollMonthlySubmission } from '@/hooks/usePayrollDetailedData';

interface PayrollMonthlySubmissionsTabProps {
  submissions: PayrollMonthlySubmission[];
}

export function PayrollMonthlySubmissionsTab({ submissions }: PayrollMonthlySubmissionsTabProps) {
  if (!submissions || submissions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Ingen månedlige innsendinger funnet</p>
      </div>
    );
  }

  const getMonthName = (month: number) => {
    const months = [
      'Januar', 'Februar', 'Mars', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Desember'
    ];
    return months[month - 1] || `Måned ${month}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Månedlige innsendinger</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Oversikt over alle månedlige lønnsrapporter i denne A07-filen
        </p>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Periode</TableHead>
              <TableHead>År</TableHead>
              <TableHead>Måned</TableHead>
              <TableHead className="text-right">Antall ansatte</TableHead>
              <TableHead className="text-right">Arbeidsgiveravgift</TableHead>
              <TableHead className="text-right">Forskuddstrekk</TableHead>
              <TableHead>Detaljer</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((submission) => (
              <TableRow key={submission.id}>
                <TableCell className="font-medium">
                  {submission.period_year}-{String(submission.period_month).padStart(2, '0')}
                </TableCell>
                <TableCell>{submission.period_year}</TableCell>
                <TableCell>{getMonthName(submission.period_month)}</TableCell>
                <TableCell className="text-right">
                  {submission.summary_data?.count || submission.submission_data?.antallInntektsmottakere || 0}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(
                    submission.summary_data?.arbeidsgiveravgift || 
                    submission.submission_data?.mottattAvgiftOgTrekkTotalt?.sumArbeidsgiveravgift || 
                    0
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(
                    submission.summary_data?.forskuddstrekk || 
                    Math.abs(submission.submission_data?.mottattAvgiftOgTrekkTotalt?.sumForskuddstrekk || 0)
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-xs text-muted-foreground">
                    <div>Status: {submission.submission_data?.status}</div>
                    {submission.submission_data?.kildesystem && (
                      <div>System: {submission.submission_data.kildesystem}</div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h4 className="font-semibold mb-2">Total perioder</h4>
          <p className="text-2xl font-bold">{submissions.length}</p>
        </Card>
        <Card className="p-4">
          <h4 className="font-semibold mb-2">Total ansatte</h4>
          <p className="text-2xl font-bold">
            {submissions.reduce((sum, s) => sum + (s.summary_data?.count || s.submission_data?.antallInntektsmottakere || 0), 0)}
          </p>
        </Card>
        <Card className="p-4">
          <h4 className="font-semibold mb-2">Total arbeidsgiveravgift</h4>
          <p className="text-2xl font-bold">
            {formatCurrency(
              submissions.reduce((sum, s) => sum + (s.summary_data?.arbeidsgiveravgift || s.submission_data?.mottattAvgiftOgTrekkTotalt?.sumArbeidsgiveravgift || 0), 0)
            )}
          </p>
        </Card>
        <Card className="p-4">
          <h4 className="font-semibold mb-2">Total forskuddstrekk</h4>
          <p className="text-2xl font-bold">
            {formatCurrency(
              submissions.reduce((sum, s) => sum + (s.summary_data?.forskuddstrekk || Math.abs(s.submission_data?.mottattAvgiftOgTrekkTotalt?.sumForskuddstrekk || 0)), 0)
            )}
          </p>
        </Card>
      </div>
    </div>
  );
}